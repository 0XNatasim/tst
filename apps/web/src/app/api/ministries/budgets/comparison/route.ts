import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { ministries } from "@openquebec/db"
import { eq } from "drizzle-orm"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const fiscalYear = searchParams.get("fiscalYear")
  const data = fiscalYear
    ? await db.select().from(ministries).where(eq(ministries.fiscalYear, fiscalYear))
    : await db.select().from(ministries)
  return NextResponse.json(data)
}
