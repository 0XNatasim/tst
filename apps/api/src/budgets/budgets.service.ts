import { Injectable } from "@nestjs/common"
import { db, budgets, ministries, programs } from "@openquebec/db"
import { eq, desc, sql } from "drizzle-orm"

@Injectable()
export class BudgetsService {
  async getByFiscalYear(fiscalYear: string) {
    return db
      .select({
        id: budgets.id,
        ministryId: budgets.ministryId,
        fiscalYear: budgets.fiscalYear,
        planned: budgets.planned,
        actual: budgets.actual,
        variance: budgets.variance,
        variancePct: budgets.variancePct,
      })
      .from(budgets)
      .where(eq(budgets.fiscalYear, fiscalYear))
  }

  async getVarianceSummary(fiscalYear: string) {
    return db
      .select({
        totalPlanned: sql<number>`sum(planned)`,
        totalActual: sql<number>`sum(actual)`,
        totalVariance: sql<number>`sum(variance)`,
        avgVariancePct: sql<number>`avg(variance_pct)`,
      })
      .from(budgets)
      .where(eq(budgets.fiscalYear, fiscalYear))
  }

  async getTopOverruns(fiscalYear: string, limit = 20) {
    return db
      .select()
      .from(budgets)
      .where(eq(budgets.fiscalYear, fiscalYear))
      .orderBy(desc(budgets.variance))
      .limit(limit)
  }
}
