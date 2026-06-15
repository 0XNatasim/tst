import { NextResponse } from "next/server"
import { getDb } from "@/lib/db"
import { contracts } from "@openquebec/db"
import { sql } from "drizzle-orm"

export async function GET() {
  const result = (await getDb()).select({
    total: sql<number>`count(*)`,
    totalAmount: sql<number>`sum(amount)`,
    avgAmount: sql<number>`avg(amount)`,
    soleSourceCount: sql<number>`sum(case when is_sole_source then 1 else 0 end)`,
  }).from(contracts)
  return NextResponse.json(result[0])
}
