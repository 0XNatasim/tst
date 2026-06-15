import { Injectable } from "@nestjs/common"
import { db, organizations } from "@openquebec/db"
import { eq, desc, sql, like } from "drizzle-orm"

@Injectable()
export class OrganizationsService {
  async findAll(type?: string, limit = 50, offset = 0) {
    const conditions = []
    if (type) conditions.push(eq(organizations.type, type))
    return db
      .select()
      .from(organizations)
      .where(conditions.length ? conditions[0] : undefined)
      .orderBy(desc(organizations.createdAt))
      .limit(limit)
      .offset(offset)
  }

  async findOne(id: string) {
    const result = await db.select().from(organizations).where(eq(organizations.id, id))
    return result[0] ?? null
  }

  async search(query: string) {
    return db
      .select()
      .from(organizations)
      .where(like(organizations.normalizedName, `%${query.toLowerCase()}%`))
      .limit(20)
  }

  async getTopVendors(limit = 50) {
    return db
      .select()
      .from(organizations)
      .where(eq(organizations.type, "vendor"))
      .limit(limit)
  }
}
