import { NextResponse } from "next/server"

export const maxDuration = 300
export const dynamic = "force-dynamic"

export async function GET() {
  console.log("Crawl cron triggered")
  return NextResponse.json({ ok: true })
}
