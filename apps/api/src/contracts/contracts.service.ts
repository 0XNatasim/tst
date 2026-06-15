import { Injectable } from "@nestjs/common"
import { db, contracts } from "@openquebec/db"
import { eq, desc, sql } from "drizzle-orm"

@Injectable()
export class ContractsService {
  async findAll(limit = 50, offset = 0) {
    return db
      .select()
      .from(contracts)
      .orderBy(desc(contracts.amount))
      .limit(limit)
      .offset(offset)
  }

  async findOne(id: string) {
    const result = await db.select().from(contracts).where(eq(contracts.id, id))
    return result[0] ?? null
  }

  async findByVendor(vendorId: string) {
    return db
      .select()
      .from(contracts)
      .where(eq(contracts.vendorId, vendorId))
      .orderBy(desc(contracts.amount))
  }

  async getTopContracts(limit = 20) {
    return db
      .select()
      .from(contracts)
      .orderBy(desc(contracts.amount))
      .limit(limit)
  }

  async getSoleSourceContracts(limit = 50) {
    return db
      .select()
      .from(contracts)
      .where(eq(contracts.isSoleSource, true))
      .orderBy(desc(contracts.amount))
      .limit(limit)
  }

  async getStats() {
    const result = await db
      .select({
        total: sql<number>`count(*)`,
        totalAmount: sql<number>`sum(amount)`,
        avgAmount: sql<number>`avg(amount)`,
        soleSourceCount: sql<number>`sum(case when is_sole_source then 1 else 0 end)`,
      })
      .from(contracts)
    return result[0]
  }
}
