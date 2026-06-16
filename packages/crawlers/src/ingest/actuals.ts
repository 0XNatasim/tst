import { eq, and } from "drizzle-orm"
import { budgets, ministries } from "@openquebec/db"
import { getDb } from "./db"
import { fetchCsv, field, money, type Row } from "./parse"
import { loadCsvResources } from "./ckan"
import { getOrCreateMinistry, preloadCaches } from "./resolve"
import type { IngestResult } from "./contracts"

/** Actual public spending (Comptes publics, Volume 2 — "Dépenses et
 * investissements du fonds général"). Defaults to the Données Québec dataset;
 * override with ACTUALS_DATASET or pin a CSV with ACTUALS_URL. */
const DATASET = process.env.ACTUALS_DATASET ?? "comptes-publics-du-gouvernement-volume-2"
const DIRECT_URL = process.env.ACTUALS_URL
// Match the yearly "Dépenses et investissements du fonds général" files.
const NAME = /d[eé]penses et investissements du fonds g[eé]n[eé]ral/i

const MINISTRY_KEYS = ["portefeuille", "ministere", "ministère", "organisme", "entite"]

export function actualsConfigured(): boolean {
  return Boolean(DATASET || DIRECT_URL)
}

function findActualKey(columns: string[]): string | undefined {
  return (
    columns.find((c) => /depenses_reelles?_\d{2}_\d{2}/.test(c)) ??
    columns.find((c) => /^(montant|depensesreelles|depensesreel|reel|actual|depenses)$/.test(c))
  )
}

/** Fiscal year from the file/resource name ("...2024-2025...") or its URL ("24-25"). */
function fiscalYear(name: string, url: string): string {
  const full = name.match(/(\d{4})-(\d{4})/)
  if (full) return `${full[1]}-${full[2]}`
  const short = url.match(/(\d{2})-(\d{2})(?!\d)/)
  if (short) return `20${short[1]}-20${short[2]}`
  return "unknown"
}

/** Aggregate one actuals file to ministry spending totals, then update the
 * matching budget rows (actual + variance) and the ministry's actual spending. */
async function processFile(rows: Row[], fy: string, result: IngestResult, limit?: number) {
  const db = getDb()
  if (!rows.length) return
  const columns = Object.keys(rows[0])
  const actualKey = findActualKey(columns)
  const ministryKey = MINISTRY_KEYS.find((k) => columns.includes(k))
  if (!actualKey || !ministryKey) return

  const totals = new Map<string, number>()
  const slice = limit ? rows.slice(0, limit) : rows
  for (const row of slice) {
    // Compare like-for-like with "budget de dépenses": expenditures only.
    const repartition = row["repartition"]
    if (repartition && !/d[eé]pens/i.test(repartition)) continue
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
}

/** Load every yearly actuals file and reconcile it against the budgets table. */
export async function ingestActuals(directUrl = DIRECT_URL, limit?: number): Promise<IngestResult> {
  await preloadCaches()
  const result: IngestResult = { source: "Comptes publics", url: directUrl ?? DATASET, rows: 0, upserted: 0, skipped: 0, errors: 0 }

  const files = directUrl
    ? [{ url: directUrl, name: directUrl, rows: await fetchCsv(directUrl) }]
    : await loadCsvResources(DATASET, NAME)

  for (const file of files) {
    result.rows += file.rows.length
    await processFile(file.rows, fiscalYear(file.name, file.url), result, limit)
  }
  return result
}
