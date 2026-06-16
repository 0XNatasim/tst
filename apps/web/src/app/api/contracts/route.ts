import { NextResponse } from "next/server"
import { getDb } from "@/lib/db"
import { contracts } from "@openquebec/db"
import { desc, and, ilike, notIlike, type SQL } from "drizzle-orm"

// Map a filter key to SQL conditions on procurement_method. Patterns are kept
// short ("invitat") so they also match values truncated by older imports.
function methodFilter(method: string | null): SQL | undefined {
  switch (method) {
    case "gre":
      return ilike(contracts.procurementMethod, "%gré à gré%")
    case "invitation":
      return ilike(contracts.procurementMethod, "%invitat%")
    case "public":
      return and(
        ilike(contracts.procurementMethod, "%appel%offres%"),
        notIlike(contracts.procurementMethod, "%invitat%"),
      )
    default:
      return undefined
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const limit = parseInt(searchParams.get("limit") ?? "50")
  const offset = parseInt(searchParams.get("offset") ?? "0")
  const where = methodFilter(searchParams.get("method"))
  const db = await getDb()

  const query = db.select().from(contracts)
  const data = await (where ? query.where(where) : query)
    .orderBy(desc(contracts.amount))
    .limit(limit)
    .offset(offset)
  return NextResponse.json(data)
}
