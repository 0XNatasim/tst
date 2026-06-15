import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { organizations } from "@openquebec/db"
import { desc, eq, like } from "drizzle-orm"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const type = searchParams.get("type")
  const q = searchParams.get("q")
  const limit = parseInt(searchParams.get("limit") ?? "50")
  const offset = parseInt(searchParams.get("offset") ?? "0")
  let data
  if (q) data = await db.select().from(organizations).where(like(organizations.normalizedName, `%${q}%`)).limit(20)
  else if (type) data = await db.select().from(organizations).where(eq(organizations.type, type)).limit(limit).offset(offset)
  else data = await db.select().from(organizations).orderBy(desc(organizations.createdAt)).limit(limit).offset(offset)
  return NextResponse.json(data)
}
