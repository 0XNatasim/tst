import { NextResponse } from "next/server"
import { runIngest, loadRows, searchDatasets, peekResource, listResources } from "@openquebec/crawlers"

export const maxDuration = 300
export const dynamic = "force-dynamic"

/** Weekly cron (see vercel.json) that ingests Québec open data into the DB.
 * Protected by CRON_SECRET when set (Vercel sends it as a Bearer token).
 *
 * Diagnostic modes (no DB writes):
 *   ?debug=search&q=comptes        -> list matching dataset slugs
 *   ?debug=cols&dataset=<slug>     -> show a dataset's column names + a sample row
 *   ?debug=raw&dataset=<slug>      -> peek the raw bytes of a dataset's resource
 */
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams
  const secret = process.env.CRON_SECRET
  if (secret) {
    const auth = request.headers.get("authorization")
    const key = params.get("key")
    if (auth !== `Bearer ${secret}` && key !== secret) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 })
    }
  }

  const debug = params.get("debug")

  try {
    if (debug === "search") {
      const q = params.get("q") ?? ""
      return NextResponse.json({ query: q, datasets: await searchDatasets(q) })
    }
    if (debug === "resources") {
      const datasetId = params.get("dataset") ?? ""
      const resources = await listResources(datasetId)
      return NextResponse.json({
        dataset: datasetId,
        resources: resources.map((r) => ({ name: r.name, format: r.format, url: r.url })),
      })
    }
    if (debug === "raw") {
      const datasetId = params.get("dataset") ?? process.env.BUDGET_DATASET ?? "budget-de-depenses"
      return NextResponse.json(await peekResource(datasetId))
    }
    if (debug === "cols") {
      const datasetId = params.get("dataset") ?? process.env.BUDGET_DATASET ?? "budget-de-depenses"
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
