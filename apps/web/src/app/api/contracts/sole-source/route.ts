import { NextResponse } from "next/server"
import { getDb } from "@/lib/db"
import { contracts } from "@openquebec/db"
import { desc, eq } from "drizzle-orm"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const limit = parseInt(searchParams.get("limit") ?? "50")
  const data = (await getDb()).select().from(contracts).where(eq(contracts.isSoleSource, true)).orderBy(desc(contracts.amount)).limit(limit)
  return NextResponse.json(data)
}
