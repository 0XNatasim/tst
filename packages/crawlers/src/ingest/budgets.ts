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

function variance(planned?: string, actual?: string) {
  if (planned == null || actual == null) return { variance: undefined, variancePct: undefined }
  const p = Number(planned)
  const a = Number(actual)
  if (!Number.isFinite(p) || !Number.isFinite(a)) return { variance: undefined, variancePct: undefined }
  const v = a - p
  const pct = p !== 0 ? (v / p) * 100 : 0
  return { variance: v.toFixed(2), variancePct: pct.toFixed(3) }
}

function fiscalYear(row: Row): string {
  const fy = field(row, "exercice", "annee", "anneefinanciere", "fiscalyear", "fiscal_year")
  if (!fy) return "unknown"
  // Normalize "2024-2025" / "2024-25" / "2024" to the 9-char column width.
  const m = fy.match(/(\d{4})\D+(\d{2,4})/)
  if (m) {
    const end = m[2].length === 2 ? m[1].slice(0, 2) + m[2] : m[2]
    return `${m[1]}-${end}`.slice(0, 9)
  }
  return fy.slice(0, 9)
}

/** Load budget data (planned vs actual by ministry) and upsert into `budgets`. */
export async function ingestBudgets(directUrl = DIRECT_URL, limit?: number): Promise<IngestResult> {
  const db = getDb()
  const { rows, sourceUrl } = await loadRows({ directUrl, datasetId: DATASET, prefer: PREFER })
  const result: IngestResult = { source: "Budget", url: sourceUrl, rows: rows.length, upserted: 0, skipped: 0, errors: 0 }
  const slice = limit ? rows.slice(0, limit) : rows

  for (const row of slice) {
    try {
      const ministryName = field(row, "portefeuille", "ministere", "ministère", "organisme", "entite")
      const planned = money(field(row, "depensesprevues", "creditsvotes", "planifie", "planned", "budget", "credits"))
      if (!ministryName || planned == null) {
        result.skipped++
        continue
      }
      const actual = money(field(row, "depensesreelles", "reel", "actual", "depenses", "depensesreel"))
      const code = field(row, "code", "codeportefeuille", "codeministere")
      const fy = fiscalYear(row)
      const ministryId = await getOrCreateMinistry(ministryName, code)
      const { variance: varAmt, variancePct } = variance(planned, actual)

      const existing = await db
        .select({ id: budgets.id })
        .from(budgets)
        .where(and(eq(budgets.ministryId, ministryId), eq(budgets.fiscalYear, fy)))
        .limit(1)

      if (existing.length) {
        await db
          .update(budgets)
          .set({ planned, actual, variance: varAmt, variancePct })
          .where(eq(budgets.id, existing[0].id))
      } else {
        await db.insert(budgets).values({
          ministryId,
          fiscalYear: fy,
          planned,
          actual,
          variance: varAmt,
          variancePct,
        })
      }

      // Keep the ministry's headline budget figures in sync.
      await db
        .update(ministries)
        .set({ budget: planned, actualSpending: actual, fiscalYear: fy, updatedAt: new Date() })
        .where(eq(ministries.id, ministryId))

      result.upserted++
    } catch (err) {
      result.errors++
      if (result.errors <= 5) console.error("budget row error:", (err as Error).message)
    }
  }
  return result
}
