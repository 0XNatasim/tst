import { Injectable } from "@nestjs/common"
import { db, budgets, contracts, ministries, organizations } from "@openquebec/db"
import { eq, sql } from "drizzle-orm"

@Injectable()
export class DashboardService {
  async getSummary() {
    const [budgetStats, contractStats, ministryCount, vendorCount] = await Promise.all([
      db
        .select({
          totalPlanned: sql<number>`sum(planned)`,
          totalActual: sql<number>`sum(actual)`,
        })
        .from(budgets),
      db
        .select({
          total: sql<number>`count(*)`,
          totalAmount: sql<number>`sum(amount)`,
        })
        .from(contracts),
      db.select({ count: sql<number>`count(*)` }).from(ministries),
      db
        .select({ count: sql<number>`count(*)` })
        .from(organizations)
        .where(eq(organizations.type, "vendor")),
    ])
    return {
      totalBudgetPlanned: budgetStats[0]?.totalPlanned ?? 0,
      totalBudgetActual: budgetStats[0]?.totalActual ?? 0,
      totalContracts: contractStats[0]?.total ?? 0,
      totalContractValue: contractStats[0]?.totalAmount ?? 0,
      totalMinistries: ministryCount[0]?.count ?? 0,
      totalVendors: vendorCount[0]?.count ?? 0,
    }
  }

  async getRedFlags() {
    const [soleSource, highValue] = await Promise.all([
      db
        .select({ count: sql<number>`count(*)` })
        .from(contracts)
        .where(eq(contracts.isSoleSource, true)),
      db
        .select({
          id: contracts.id,
          title: contracts.title,
          amount: contracts.amount,
        })
        .from(contracts)
        .where(sql`amount > 10000000`)
        .orderBy(sql`amount desc`)
        .limit(10),
    ])
    return {
      soleSourceCount: soleSource[0]?.count ?? 0,
      highValueContracts: highValue,
    }
  }
}
