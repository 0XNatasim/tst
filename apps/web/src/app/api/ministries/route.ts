import { NextResponse } from "next/server"
import { getDb } from "@/lib/db"
import { ministries } from "@openquebec/db"

export async function GET() {
  const data = (await getDb()).select().from(ministries)
  return NextResponse.json(data)
}
