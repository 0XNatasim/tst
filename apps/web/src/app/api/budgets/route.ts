import { NextResponse } from "next/server"
import { getDb } from "@/lib/db"
import { budgets } from "@openquebec/db"
import { desc, eq, sql } from "drizzle-orm"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const fiscalYear = searchParams.get("fiscalYear")
  const data = fiscalYear
    ? (await getDb()).select().from(budgets).where(eq(budgets.fiscalYear, fiscalYear))
    : (await getDb()).select().from(budgets)
  return NextResponse.json(data)
}
