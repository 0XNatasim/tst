import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { organizations, contracts, grants } from "@openquebec/db"
import { like, sql } from "drizzle-orm"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const q = searchParams.get("q")
  if (!q || q.length < 2) return NextResponse.json([])

  const query = `%${q.toLowerCase()}%`
  const [orgs, conts, grnts] = await Promise.all([
    db.select({ type: sql<string>`'organization'`.as("type"), id: organizations.id, title: organizations.name, subtitle: organizations.type, amount: sql<number>`0`, date: organizations.createdAt }).from(organizations).where(like(organizations.normalizedName, query)).limit(10),
    db.select({ type: sql<string>`'contract'`.as("type"), id: contracts.id, title: contracts.title, subtitle: sql<string>`coalesce(contracts.description, '')`.as("subtitle"), amount: sql<number>`coalesce(contracts.amount, 0)`.as("amount"), date: contracts.awardDate }).from(contracts).where(like(contracts.title, query)).limit(10),
    db.select({ type: sql<string>`'grant'`.as("type"), id: grants.id, title: grants.programName, subtitle: sql<string>`coalesce(grants.description, '')`.as("subtitle"), amount: sql<number>`coalesce(grants.amount, 0)`.as("amount"), date: grants.awardDate }).from(grants).where(like(grants.programName, query)).limit(10),
  ])
  return NextResponse.json([...orgs, ...conts, ...grnts])
}
