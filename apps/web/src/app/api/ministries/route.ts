import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { ministries } from "@openquebec/db"

export async function GET() {
  const data = await db.select().from(ministries)
  return NextResponse.json(data)
}
