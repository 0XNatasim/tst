import { NextResponse } from "next/server"
import { runIngest } from "@openquebec/crawlers"

export const maxDuration = 300
export const dynamic = "force-dynamic"

/** Weekly cron (see vercel.json) that ingests Québec open data into the DB.
 * Protected by CRON_SECRET when set (Vercel sends it as a Bearer token). */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET
  if (secret) {
    const auth = request.headers.get("authorization")
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 })
    }
  }

  console.log("Crawl cron triggered")
  try {
    const limitParam = new URL(request.url).searchParams.get("limit")
    const limit = limitParam ? Number(limitParam) : undefined
    const summary = await runIngest({ limit })
    return NextResponse.json({ ok: summary.errors.length === 0, ...summary })
  } catch (err) {
    console.error("Ingestion failed:", err)
    return NextResponse.json({ ok: false, error: (err as Error).message }, { status: 500 })
  }
}
