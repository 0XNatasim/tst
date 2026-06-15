import { NextResponse } from "next/server"
import { getDb } from "@/lib/db"
import { ministries } from "@openquebec/db"
import { eq } from "drizzle-orm"

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const data = (await getDb()).select().from(ministries).where(eq(ministries.id, id))
  return NextResponse.json(data[0] ?? null)
}
