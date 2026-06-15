import { NextResponse } from "next/server"
import { getDb } from "@/lib/db"
import { ministries } from "@openquebec/db"
import { eq } from "drizzle-orm"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const fiscalYear = searchParams.get("fiscalYear")
  const data = fiscalYear
    ? (await getDb()).select().from(ministries).where(eq(ministries.fiscalYear, fiscalYear))
    : (await getDb()).select().from(ministries)
  return NextResponse.json(data)
}
