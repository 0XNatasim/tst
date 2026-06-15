import { NextResponse } from "next/server"
import { runIngest, loadRows, searchDatasets } from "@openquebec/crawlers"

export const maxDuration = 300
export const dynamic = "force-dynamic"

/** Weekly cron (see vercel.json) that ingests Québec open data into the DB.
 * Protected by CRON_SECRET when set (Vercel sends it as a Bearer token).
 *
 * Diagnostic modes (no DB writes):
 *   ?debug=search&q=seao   -> list matching dataset slugs on Données Québec
 *   ?debug=budget          -> show the budget file's column names + a sample row
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET
  if (secret) {
    const auth = request.headers.get("authorization")
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 })
    }
  }

  const params = new URL(request.url).searchParams
  const debug = params.get("debug")

  try {
    if (debug === "search") {
      const q = params.get("q") ?? ""
      return NextResponse.json({ query: q, datasets: await searchDatasets(q) })
    }
    if (debug === "budget" || debug === "contracts") {
      const datasetId =
        debug === "budget"
          ? process.env.BUDGET_DATASET ?? "budget-de-depenses"
          : process.env.SEAO_DATASET ?? "systeme-electronique-d-appel-d-offres-seao"
      const { rows, sourceUrl } = await loadRows({ datasetId })
      return NextResponse.json({
        sourceUrl,
        rowCount: rows.length,
        columns: rows[0] ? Object.keys(rows[0]) : [],
        sample: rows[0] ?? null,
      })
    }

    console.log("Crawl cron triggered")
    const limitParam = params.get("limit")
    const limit = limitParam ? Number(limitParam) : undefined
    const summary = await runIngest({ limit })
    return NextResponse.json({ ok: summary.errors.length === 0, ...summary })
  } catch (err) {
    console.error("Cron failed:", err)
    return NextResponse.json({ ok: false, error: (err as Error).message }, { status: 500 })
  }
}
