import { NextResponse } from "next/server"
import { getDb } from "@/lib/db"
import { budgets, contracts, ministries, organizations } from "@openquebec/db"
import { eq, sql } from "drizzle-orm"

export async function GET() {
  const [budgetStats, contractStats, ministryCount, vendorCount] = await Promise.all([
    (await getDb()).select({ totalPlanned: sql<number>`sum(planned)`, totalActual: sql<number>`sum(actual)` }).from(budgets),
    (await getDb()).select({ total: sql<number>`count(*)`, totalAmount: sql<number>`sum(amount)` }).from(contracts),
    (await getDb()).select({ count: sql<number>`count(*)` }).from(ministries),
    (await getDb()).select({ count: sql<number>`count(*)` }).from(organizations).where(eq(organizations.type, "vendor")),
  ])
  return NextResponse.json({
    totalBudgetPlanned: budgetStats[0]?.totalPlanned ?? 0,
    totalBudgetActual: budgetStats[0]?.totalActual ?? 0,
    totalContracts: contractStats[0]?.total ?? 0,
    totalContractValue: contractStats[0]?.totalAmount ?? 0,
    totalMinistries: ministryCount[0]?.count ?? 0,
    totalVendors: vendorCount[0]?.count ?? 0,
  })
}
