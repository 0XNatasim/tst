import { eq, and } from "drizzle-orm"
import { budgets, ministries } from "@openquebec/db"
import { getDb } from "./db"
import { fetchCsv, field, money, type Row } from "./parse"
import { loadCsvResources } from "./ckan"
import { getOrCreateMinistry, preloadCaches } from "./resolve"
import type { IngestResult } from "./contracts"

/** Québec budget open data (Budget de dépenses). All yearly files in the dataset
 * are ingested so multiple fiscal years are available. */
const DATASET = process.env.BUDGET_DATASET ?? "budget-de-depenses"
const DIRECT_URL = process.env.BUDGET_URL
// Match the yearly budget files in the dataset.
const NAME = /budget|cr[eé]dit|minist|portefeuille|d[eé]pens/i

const MINISTRY_KEYS = ["portefeuille", "ministere", "ministère", "organisme", "entite"]

/** Find the planned-amount column. Real files use a year-suffixed name like
 * `budget_de_depenses_26_27`; fall back to total credits, then generic names. */
function findPlannedKey(columns: string[]): string | undefined {
  return (
    columns.find((c) => /budget_de_depenses_\d{2}_\d{2}/.test(c)) ??
    columns.find((c) => /credits_totaux_\d{2}_\d{2}/.test(c)) ??
    columns.find((c) => /^(depensesprevues|creditsvotes|planifie|planned|budget|credits)$/.test(c))
  )
}

/** Derive a fiscal year ("2026-2027") from a column name or a fiscal-year cell. */
function fiscalYear(plannedKey: string | undefined, row: Row): string {
  const fromCol = plannedKey?.match(/_(\d{2})_(\d{2})/)
  if (fromCol) return `20${fromCol[1]}-20${fromCol[2]}`
  const fy = field(row, "exercice", "annee", "anneefinanciere", "fiscalyear", "fiscal_year")
  if (fy) {
    const m = fy.match(/(\d{4})\D+(\d{2,4})/)
    if (m) return `${m[1]}-${m[2].length === 2 ? m[1].slice(0, 2) + m[2] : m[2]}`.slice(0, 9)
    return fy.slice(0, 9)
  }
  return "unknown"
}

/** Aggregate one budget file's per-program rows up to ministry totals and upsert. */
async function processFile(rows: Row[], result: IngestResult, limit?: number) {
  const db = getDb()
  if (!rows.length) return
  const columns = Object.keys(rows[0])
  const plannedKey = findPlannedKey(columns)
  const ministryKey = MINISTRY_KEYS.find((k) => columns.includes(k))
  if (!plannedKey || !ministryKey) return // not a budget file (e.g. data dictionary)
  const fy = fiscalYear(plannedKey, rows[0])

  const totals = new Map<string, number>()
  const slice = limit ? rows.slice(0, limit) : rows
  for (const row of slice) {
    const name = row[ministryKey]?.trim()
    const amt = Number(money(row[plannedKey]) ?? "")
    if (!name || !Number.isFinite(amt)) {
      result.skipped++
      continue
    }
    totals.set(name, (totals.get(name) ?? 0) + amt)
  }

  for (const [name, planned] of totals) {
    try {
      const ministryId = await getOrCreateMinistry(name)
      const plannedStr = planned.toFixed(2)
      const existing = await db
        .select({ id: budgets.id })
        .from(budgets)
        .where(and(eq(budgets.ministryId, ministryId), eq(budgets.fiscalYear, fy)))
        .limit(1)
      if (existing.length) {
        await db.update(budgets).set({ planned: plannedStr }).where(eq(budgets.id, existing[0].id))
      } else {
        await db.insert(budgets).values({ ministryId, fiscalYear: fy, planned: plannedStr })
      }
      await db
        .update(ministries)
        .set({ budget: plannedStr, fiscalYear: fy, updatedAt: new Date() })
        .where(eq(ministries.id, ministryId))
      result.upserted++
    } catch (err) {
      result.errors++
      if (result.errors <= 5) console.error("budget ministry error:", (err as Error).message)
    }
  }
}

/** Load every yearly budget file (planned spending by ministry) and upsert one
 * budget row per ministry + fiscal year. */
export async function ingestBudgets(directUrl = DIRECT_URL, limit?: number): Promise<IngestResult> {
  await preloadCaches()
  const result: IngestResult = { source: "Budget", url: directUrl ?? DATASET, rows: 0, upserted: 0, skipped: 0, errors: 0 }

  const files = directUrl
    ? [{ url: directUrl, name: "", rows: await fetchCsv(directUrl) }]
    : await loadCsvResources(DATASET, NAME)

  for (const file of files) {
    result.rows += file.rows.length
    await processFile(file.rows, result, limit)
  }
  return result
}
