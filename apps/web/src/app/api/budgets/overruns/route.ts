import { NextResponse } from "next/server"
import { getDb } from "@/lib/db"
import { budgets } from "@openquebec/db"
import { eq, desc } from "drizzle-orm"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const fiscalYear = searchParams.get("fiscalYear") ?? "2026-2027"
  const limit = parseInt(searchParams.get("limit") ?? "20")
  const data = (await getDb()).select().from(budgets).where(eq(budgets.fiscalYear, fiscalYear)).orderBy(desc(budgets.variance)).limit(limit)
  return NextResponse.json(data)
}
