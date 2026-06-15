import { drizzle } from "drizzle-orm/postgres-js"

let _client: ReturnType<typeof drizzle> | null = null

export async function getDb() {
  if (!_client) {
    const postgres = await import("postgres")
    const sql = postgres.default(process.env.DATABASE_URL!, { prepare: false })
    _client = drizzle(sql)
  }
  return _client
}
