import { NextResponse } from "next/server"
import { getDb } from "@/lib/db"
import { budgets, ministries } from "@openquebec/db"
import { desc, eq } from "drizzle-orm"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const fiscalYear = searchParams.get("fiscalYear")
  const db = await getDb()

  const columns = {
    id: budgets.id,
    ministryId: budgets.ministryId,
    ministryName: ministries.name,
    fiscalYear: budgets.fiscalYear,
    planned: budgets.planned,
    actual: budgets.actual,
    variance: budgets.variance,
    variancePct: budgets.variancePct,
  }

  const base = db.select(columns).from(budgets).leftJoin(ministries, eq(budgets.ministryId, ministries.id))
  const data = await (fiscalYear
    ? base.where(eq(budgets.fiscalYear, fiscalYear)).orderBy(desc(budgets.planned))
    : base.orderBy(desc(budgets.planned)))
  return NextResponse.json(data)
}
