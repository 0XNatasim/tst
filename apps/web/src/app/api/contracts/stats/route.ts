import { NextResponse } from "next/server"
import { getDb } from "@/lib/db"
import { contracts } from "@openquebec/db"
import { sql } from "drizzle-orm"

export async function GET() {
  const db = await getDb()

  const result = await db
    .select({
      total: sql<number>`count(*)`,
      totalAmount: sql<number>`coalesce(sum(${contracts.amount}), 0)`,
      avgAmount: sql<number>`coalesce(avg(${contracts.amount}), 0)`,
      soleSourceCount: sql<number>`sum(case when ${contracts.isSoleSource} then 1 else 0 end)`,
    })
    .from(contracts)

  return NextResponse.json(result[0] ?? {
    total: 0,
    totalAmount: 0,
    avgAmount: 0,
    soleSourceCount: 0,
  })
}