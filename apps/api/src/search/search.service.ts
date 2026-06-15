import { Injectable } from "@nestjs/common"
import { db, organizations, contracts, grants } from "@openquebec/db"
import { like, or, sql } from "drizzle-orm"

@Injectable()
export class SearchService {
  async search(query: string) {
    const q = `%${query.toLowerCase()}%`
    const [orgs, conts, grnts] = await Promise.all([
      db
        .select({
          type: sql<string>`'organization'`.as("type"),
          id: organizations.id,
          title: organizations.name,
          subtitle: organizations.type,
          amount: sql<number>`0`,
          date: organizations.createdAt,
        })
        .from(organizations)
        .where(like(organizations.normalizedName, q))
        .limit(10),
      db
        .select({
          type: sql<string>`'contract'`.as("type"),
          id: contracts.id,
          title: contracts.title,
          subtitle: contracts.description,
          amount: contracts.amount,
          date: contracts.awardDate,
        })
        .from(contracts)
        .where(like(contracts.title, q))
        .limit(10),
      db
        .select({
          type: sql<string>`'grant'`.as("type"),
          id: grants.id,
          title: grants.programName,
          subtitle: grants.description,
          amount: grants.amount,
          date: grants.awardDate,
        })
        .from(grants)
        .where(like(grants.programName, q))
        .limit(10),
    ])
    return [...orgs, ...conts, ...grnts].sort((a, b) => {
      const aMatch = a.title.toLowerCase().includes(query.toLowerCase()) ? 1 : 0
      const bMatch = b.title.toLowerCase().includes(query.toLowerCase()) ? 1 : 0
      return bMatch - aMatch
    })
  }
}
