import { NextResponse } from "next/server"
import { getDb } from "@/lib/db"
import { ministries } from "@openquebec/db"

export async function GET() {
  const db = await getDb()
  const data = await db.select().from(ministries)
  return NextResponse.json(data)
}
