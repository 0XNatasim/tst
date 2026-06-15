import { NextResponse } from "next/server"
import { getDb } from "@/lib/db"
import { contracts } from "@openquebec/db"
import { desc, eq } from "drizzle-orm"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const limit = parseInt(searchParams.get("limit") ?? "50")
  const offset = parseInt(searchParams.get("offset") ?? "0")
  const db = await getDb()
  const data = await db.select().from(contracts).orderBy(desc(contracts.amount)).limit(limit).offset(offset)
  return NextResponse.json(data)
}
