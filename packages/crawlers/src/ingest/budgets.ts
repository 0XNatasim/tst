import { eq, and } from "drizzle-orm"
import { budgets, ministries } from "@openquebec/db"
import { getDb } from "./db"
import { field, money, type Row } from "./parse"
import { loadRows } from "./ckan"
import { getOrCreateMinistry } from "./resolve"
import type { IngestResult } from "./contracts"

/** Québec budget open data (Budget de dépenses), resolved via the Données Québec
 * CKAN API. Override the dataset slug with BUDGET_DATASET, or pin a CSV with BUDGET_URL. */
const DATASET = process.env.BUDGET_DATASET ?? "budget-de-depenses"
const DIRECT_URL = process.env.BUDGET_URL
const PREFER = /portefeuille|d[eé]pens|programme|cr[eé]dit/i

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

/** Load the budget file (one row per program) and aggregate planned amounts by
 * ministry/portefeuille, then upsert one budget row per ministry + fiscal year. */
export async function ingestBudgets(directUrl = DIRECT_URL, limit?: number): Promise<IngestResult> {
  const db = getDb()
  const { rows, sourceUrl } = await loadRows({ directUrl, datasetId: DATASET, prefer: PREFER })
  const result: IngestResult = { source: "Budget", url: sourceUrl, rows: rows.length, upserted: 0, skipped: 0, errors: 0 }
  if (!rows.length) return result

  const columns = Object.keys(rows[0])
  const plannedKey = findPlannedKey(columns)
  const ministryKey = MINISTRY_KEYS.find((k) => columns.includes(k))
  if (!plannedKey || !ministryKey) {
    throw new Error(
      `Budget columns not recognized. ministryKey=${ministryKey} plannedKey=${plannedKey}. columns=${columns.join(",")}`,
    )
  }
  const fy = fiscalYear(plannedKey, rows[0])

  // Sum the per-program amounts up to the ministry level.
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
  return result
}
