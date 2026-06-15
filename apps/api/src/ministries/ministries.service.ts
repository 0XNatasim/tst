import { Injectable } from "@nestjs/common"
import { db } from "@openquebec/db"
import { ministries } from "@openquebec/db"
import { eq } from "drizzle-orm"

@Injectable()
export class MinistriesService {
  async findAll() {
    return db.select().from(ministries)
  }

  async findOne(id: string) {
    const result = await db.select().from(ministries).where(eq(ministries.id, id))
    return result[0] ?? null
  }

  async getBudgetComparison(fiscalYear: string) {
    return db
      .select({
        id: ministries.id,
        name: ministries.name,
        code: ministries.code,
        budget: ministries.budget,
        actualSpending: ministries.actualSpending,
        fiscalYear: ministries.fiscalYear,
      })
      .from(ministries)
      .where(eq(ministries.fiscalYear, fiscalYear))
  }
}
