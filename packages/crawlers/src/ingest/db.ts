import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"
import * as schema from "@openquebec/db"

let _db: ReturnType<typeof drizzle<typeof schema>> | null = null

/** Lazily create a Drizzle client. Avoids opening a connection at import time
 * so this module is safe to bundle into serverless functions. */
export function getDb() {
  if (!_db) {
    const url = process.env.DATABASE_URL
    if (!url) throw new Error("DATABASE_URL environment variable is required")
    const sql = postgres(url, { prepare: false })
    _db = drizzle(sql, { schema })
  }
  return _db
}
