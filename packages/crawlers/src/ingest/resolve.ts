import { eq } from "drizzle-orm"
import { organizations, ministries } from "@openquebec/db"
import { getDb } from "./db"
import { normalizeName } from "./parse"

/** Find an organization by normalized name, creating it if absent.
 * A small in-process cache avoids repeated lookups during a single run. */
const orgCache = new Map<string, string>()

export async function getOrCreateOrganization(
  name: string,
  type = "vendor",
): Promise<string> {
  const normalized = normalizeName(name)
  if (!normalized) throw new Error("organization name is empty")
  const cached = orgCache.get(normalized)
  if (cached) return cached

  const db = getDb()
  const existing = await db
    .select({ id: organizations.id })
    .from(organizations)
    .where(eq(organizations.normalizedName, normalized))
    .limit(1)
  if (existing.length) {
    orgCache.set(normalized, existing[0].id)
    return existing[0].id
  }

  const inserted = await db
    .insert(organizations)
    .values({ name, normalizedName: normalized, type })
    .returning({ id: organizations.id })
  orgCache.set(normalized, inserted[0].id)
  return inserted[0].id
}

const ministryCache = new Map<string, string>()

/** Find a ministry by code (preferred) or name, creating it if absent. */
export async function getOrCreateMinistry(
  name: string,
  code?: string,
): Promise<string> {
  const key = (code ?? normalizeName(name)).toLowerCase()
  const cached = ministryCache.get(key)
  if (cached) return cached

  const db = getDb()
  if (code) {
    const byCode = await db
      .select({ id: ministries.id })
      .from(ministries)
      .where(eq(ministries.code, code))
      .limit(1)
    if (byCode.length) {
      ministryCache.set(key, byCode[0].id)
      return byCode[0].id
    }
  }

  const inserted = await db
    .insert(ministries)
    .values({ name, code: code ?? deriveCode(name) })
    .onConflictDoNothing({ target: ministries.code })
    .returning({ id: ministries.id })

  if (inserted.length) {
    ministryCache.set(key, inserted[0].id)
    return inserted[0].id
  }

  // Conflict on code: fetch the existing row.
  const existing = await db
    .select({ id: ministries.id })
    .from(ministries)
    .where(eq(ministries.code, code ?? deriveCode(name)))
    .limit(1)
  ministryCache.set(key, existing[0].id)
  return existing[0].id
}

/** Derive a short code from a ministry name (uppercase initials, max 10 chars). */
function deriveCode(name: string): string {
  const stop = new Set(["de", "des", "du", "la", "le", "les", "et", "d", "l"])
  const code = normalizeName(name)
    .split(" ")
    .filter((w) => w && !stop.has(w))
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 10)
  return code || name.slice(0, 10).toUpperCase()
}

/** Load all existing organizations and ministries into the caches with a single
 * query each, so per-row lookups during a run become in-memory hits. */
export async function preloadCaches() {
  const db = getDb()
  const [orgs, mins] = await Promise.all([
    db.select({ id: organizations.id, normalizedName: organizations.normalizedName }).from(organizations),
    db.select({ id: ministries.id, code: ministries.code, name: ministries.name }).from(ministries),
  ])
  for (const o of orgs) orgCache.set(o.normalizedName, o.id)
  for (const m of mins) {
    ministryCache.set(normalizeName(m.name), m.id)
    if (m.code) ministryCache.set(m.code.toLowerCase(), m.id)
  }
}

/** Batch-create any organizations not already cached, then return so callers can
 * resolve every name from `orgCache`. Assumes preloadCaches() ran first. */
export async function ensureOrganizations(names: Iterable<string>, type = "vendor") {
  const db = getDb()
  const missing = new Map<string, string>() // normalized -> display name
  for (const n of names) {
    const norm = normalizeName(n)
    if (norm && !orgCache.has(norm) && !missing.has(norm)) missing.set(norm, n)
  }
  const entries = [...missing]
  for (let i = 0; i < entries.length; i += 500) {
    const chunk = entries.slice(i, i + 500)
    const inserted = await db
      .insert(organizations)
      .values(chunk.map(([norm, name]) => ({ name, normalizedName: norm, type })))
      .returning({ id: organizations.id, normalizedName: organizations.normalizedName })
    for (const r of inserted) orgCache.set(r.normalizedName, r.id)
  }
}

export function orgId(name: string | undefined): string | undefined {
  return name ? orgCache.get(normalizeName(name)) : undefined
}

export function ministryId(name: string | undefined): string | undefined {
  return name ? ministryCache.get(normalizeName(name)) : undefined
}

export function resetCaches() {
  orgCache.clear()
  ministryCache.clear()
}
