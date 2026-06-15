import { NextResponse } from "next/server"
import { getDb } from "@/lib/db"
import { contracts } from "@openquebec/db"
import { desc } from "drizzle-orm"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const limit = parseInt(searchParams.get("limit") ?? "20")
  const data = (await getDb()).select().from(contracts).orderBy(desc(contracts.amount)).limit(limit)
  return NextResponse.json(data)
}
