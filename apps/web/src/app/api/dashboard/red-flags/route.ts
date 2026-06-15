import { NextResponse } from "next/server"
import { getDb } from "@/lib/db"
import { contracts } from "@openquebec/db"
import { eq, sql } from "drizzle-orm"

export async function GET() {
  const [soleSource, highValue] = await Promise.all([
    (await getDb()).select({ count: sql<number>`count(*)` }).from(contracts).where(eq(contracts.isSoleSource, true)),
    (await getDb()).select({ id: contracts.id, title: contracts.title, amount: contracts.amount }).from(contracts).where(sql`amount > 10000000`).orderBy(sql`amount desc`).limit(10),
  ])
  return NextResponse.json({ soleSourceCount: soleSource[0]?.count ?? 0, highValueContracts: highValue })
}
