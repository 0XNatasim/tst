import { eq, and } from "drizzle-orm"
import { budgets, ministries } from "@openquebec/db"
import { getDb } from "./db"
import { field, money, type Row } from "./parse"
import { loadRows } from "./ckan"
import { getOrCreateMinistry, preloadCaches } from "./resolve"
import type { IngestResult } from "./contracts"

/** Actual public spending (Comptes publics). Disabled until a source is set via
 * ACTUALS_DATASET (CKAN slug) or ACTUALS_URL (direct CSV). */
const DATASET = process.env.ACTUALS_DATASET
const DIRECT_URL = process.env.ACTUALS_URL
const PREFER = /comptes|d[eé]pens|portefeuille|r[eé]el/i

const MINISTRY_KEYS = ["portefeuille", "ministere", "ministère", "organisme", "entite"]

export function actualsConfigured(): boolean {
  return Boolean(DATASET || DIRECT_URL)
}

/** Locate the actual-spending column (year-suffixed real expenditure, else generic). */
function findActualKey(columns: string[]): string | undefined {
  return (
    columns.find((c) => /depenses_reelles?_\d{2}_\d{2}/.test(c)) ??
    columns.find((c) => /depenses_\d{2}_\d{2}/.test(c)) ??
    columns.find((c) => /^(depensesreelles|depensesreel|reel|actual|depenses)$/.test(c))
  )
}

function fiscalYear(actualKey: string | undefined, row: Row): string {
  const fromCol = actualKey?.match(/_(\d{2})_(\d{2})/)
  if (fromCol) return `20${fromCol[1]}-20${fromCol[2]}`
  const fy = field(row, "exercice", "annee", "anneefinanciere", "fiscalyear", "fiscal_year")
  if (fy) {
    const m = fy.match(/(\d{4})\D+(\d{2,4})/)
    if (m) return `${m[1]}-${m[2].length === 2 ? m[1].slice(0, 2) + m[2] : m[2]}`.slice(0, 9)
    return fy.slice(0, 9)
  }
  return "unknown"
}

/** Load Comptes publics actuals, aggregate by ministry, and update the matching
 * budget rows (actual + variance) and the ministry's headline actual spending. */
export async function ingestActuals(directUrl = DIRECT_URL, limit?: number): Promise<IngestResult> {
  const db = getDb()
  const { rows, sourceUrl } = await loadRows({ directUrl, datasetId: DATASET, prefer: PREFER })
  const result: IngestResult = { source: "Comptes publics", url: sourceUrl, rows: rows.length, upserted: 0, skipped: 0, errors: 0 }
  if (!rows.length) return result
  await preloadCaches()

  const columns = Object.keys(rows[0])
  const actualKey = findActualKey(columns)
  const ministryKey = MINISTRY_KEYS.find((k) => columns.includes(k))
  if (!actualKey || !ministryKey) {
    throw new Error(`Actuals columns not recognized. ministryKey=${ministryKey} actualKey=${actualKey}. columns=${columns.join(",")}`)
  }
  const fy = fiscalYear(actualKey, rows[0])

  const totals = new Map<string, number>()
  const slice = limit ? rows.slice(0, limit) : rows
  for (const row of slice) {
    const name = row[ministryKey]?.trim()
    const amt = Number(money(row[actualKey]) ?? "")
    if (!name || !Number.isFinite(amt)) {
      result.skipped++
      continue
    }
    totals.set(name, (totals.get(name) ?? 0) + amt)
  }

  for (const [name, actual] of totals) {
    try {
      const ministryId = await getOrCreateMinistry(name)
      const actualStr = actual.toFixed(2)

      const existing = await db
        .select({ id: budgets.id, planned: budgets.planned })
        .from(budgets)
        .where(and(eq(budgets.ministryId, ministryId), eq(budgets.fiscalYear, fy)))
        .limit(1)

      if (existing.length) {
        const planned = Number(existing[0].planned)
        const variance = actual - planned
        const variancePct = planned !== 0 ? ((variance / planned) * 100).toFixed(3) : null
        await db
          .update(budgets)
          .set({ actual: actualStr, variance: variance.toFixed(2), variancePct })
          .where(eq(budgets.id, existing[0].id))
      } else {
        await db.insert(budgets).values({ ministryId, fiscalYear: fy, planned: "0", actual: actualStr })
      }

      await db.update(ministries).set({ actualSpending: actualStr, updatedAt: new Date() }).where(eq(ministries.id, ministryId))
      result.upserted++
    } catch (err) {
      result.errors++
      if (result.errors <= 5) console.error("actuals ministry error:", (err as Error).message)
    }
  }
  return result
}
