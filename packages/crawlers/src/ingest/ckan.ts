import { fetchCsv, type Row } from "./parse"

/** Données Québec runs on CKAN. This is the Action API base. Override with CKAN_BASE. */
const CKAN_BASE = process.env.CKAN_BASE ?? "https://www.donneesquebec.ca/recherche/api/3/action"

interface CkanResource {
  id: string
  name?: string
  format?: string
  url?: string
  datastore_active?: boolean
  last_modified?: string
  created?: string
}

async function ckan<T>(action: string, params: Record<string, string | number>): Promise<T> {
  const qs = new URLSearchParams(
    Object.entries(params).map(([k, v]) => [k, String(v)]),
  ).toString()
  const res = await fetch(`${CKAN_BASE}/${action}?${qs}`, { redirect: "follow" })
  if (!res.ok) throw new Error(`CKAN ${action} failed: ${res.status} ${res.statusText}`)
  const json = (await res.json()) as { success: boolean; result: T; error?: unknown }
  if (!json.success) throw new Error(`CKAN ${action} error: ${JSON.stringify(json.error)}`)
  return json.result
}

/** List a dataset's resources, newest first. `id` is the dataset slug or UUID. */
export async function listResources(datasetId: string): Promise<CkanResource[]> {
  const pkg = await ckan<{ resources: CkanResource[] }>("package_show", { id: datasetId })
  return [...pkg.resources].sort((a, b) => time(b) - time(a))
}

/** Search datasets by keyword. Returns slug + title for the top matches,
 * so we can discover the right dataset name to configure. */
export async function searchDatasets(query: string, rows = 10) {
  const result = await ckan<{ count: number; results: { name: string; title: string }[] }>(
    "package_search",
    { q: query, rows },
  )
  return result.results.map((r) => ({ slug: r.name, title: r.title }))
}

function time(r: CkanResource): number {
  return new Date(r.last_modified ?? r.created ?? 0).getTime()
}

/** Pick the most relevant resource: prefer one whose name matches `prefer`,
 * otherwise the newest resource of the requested format. */
export function pickResource(
  resources: CkanResource[],
  format = "CSV",
  prefer?: RegExp,
): CkanResource | undefined {
  const ofFormat = resources.filter(
    (r) => (r.format ?? "").toUpperCase() === format.toUpperCase(),
  )
  if (prefer) {
    const matched = ofFormat.find((r) => prefer.test(r.name ?? ""))
    if (matched) return matched
  }
  return ofFormat[0] ?? resources[0]
}

/** Pull all rows from a CKAN datastore-active resource as JSON, paginated.
 * Keys are lower-cased so the shared `field()` mapper works unchanged. */
export async function fetchDatastore(resourceId: string, max = 50_000): Promise<Row[]> {
  const pageSize = 1000
  const out: Row[] = []
  for (let offset = 0; offset < max; offset += pageSize) {
    const result = await ckan<{ records: Record<string, unknown>[]; total: number }>(
      "datastore_search",
      { resource_id: resourceId, limit: pageSize, offset },
    )
    for (const rec of result.records) {
      const row: Row = {}
      for (const [k, v] of Object.entries(rec)) {
        if (k === "_id") continue
        row[k.trim().toLowerCase()] = v == null ? "" : String(v)
      }
      out.push(row)
    }
    if (out.length >= result.total || result.records.length < pageSize) break
  }
  return out
}

/** Fetch the first bytes of a dataset's chosen resource without parsing,
 * so we can inspect the raw delimiter/quoting when parsing fails. */
export async function peekResource(datasetId: string, prefer?: RegExp, format = "CSV") {
  const resources = await listResources(datasetId)
  const r = pickResource(resources, format, prefer)
  if (!r?.url) return { resource: r ?? null, sourceUrl: undefined, head: null }
  const res = await fetch(r.url, { redirect: "follow" })
  const text = await res.text()
  return {
    sourceUrl: r.url,
    format: r.format,
    datastore_active: r.datastore_active ?? false,
    head: text.slice(0, 1000),
  }
}

/** Fetch and parse a JSON resource. */
export async function fetchJson<T = unknown>(url: string): Promise<T> {
  const res = await fetch(url, { redirect: "follow" })
  if (!res.ok) throw new Error(`Fetch failed for ${url}: ${res.status} ${res.statusText}`)
  return (await res.json()) as T
}

/** Pick the newest OCDS JSON resource for a dataset and return its releases. */
export async function loadOcdsReleases(
  datasetId: string,
  prefer?: RegExp,
): Promise<{ releases: OcdsRelease[]; sourceUrl: string }> {
  const resources = await listResources(datasetId)
  const r = pickResource(resources, "JSON", prefer) ?? pickResource(resources, "JSON")
  if (!r?.url) throw new Error(`No JSON resource found in dataset ${datasetId}`)
  const data = await fetchJson<{ releases?: OcdsRelease[] }>(r.url)
  return { releases: data.releases ?? [], sourceUrl: r.url }
}

export interface OcdsParty {
  id?: string
  name?: string
  roles?: string[]
}
export interface OcdsDocument {
  url?: string
  title?: string
  documentType?: string
}
export interface OcdsAward {
  id?: string
  title?: string
  date?: string
  value?: { amount?: number; currency?: string }
  suppliers?: { id?: string; name?: string }[]
  documents?: OcdsDocument[]
}
export interface OcdsRelease {
  ocid?: string
  id?: string
  date?: string
  tag?: string[]
  buyer?: { id?: string; name?: string }
  parties?: OcdsParty[]
  tender?: {
    title?: string
    procurementMethod?: string
    procurementMethodDetails?: string
    value?: { amount?: number; currency?: string }
    documents?: OcdsDocument[]
  }
  awards?: OcdsAward[]
  documents?: OcdsDocument[]
}

/** Resolve rows for an ingestion source.
 * - If `directUrl` is set, fetch that CSV directly.
 * - Otherwise discover the dataset's best resource via CKAN: use the datastore
 *   JSON API when available, else download the CSV resource. */
export async function loadRows(opts: {
  directUrl?: string
  datasetId?: string
  format?: string
  prefer?: RegExp
}): Promise<{ rows: Row[]; sourceUrl: string }> {
  if (opts.directUrl) {
    return { rows: await fetchCsv(opts.directUrl), sourceUrl: opts.directUrl }
  }
  if (!opts.datasetId) {
    throw new Error("No source configured: set a *_URL or *_DATASET env var")
  }
  const resources = await listResources(opts.datasetId)
  const resource = pickResource(resources, opts.format ?? "CSV", opts.prefer)
  if (!resource) throw new Error(`No matching resource in dataset ${opts.datasetId}`)

  if (resource.datastore_active) {
    return { rows: await fetchDatastore(resource.id), sourceUrl: resource.url ?? opts.datasetId }
  }
  if (!resource.url) throw new Error(`Resource ${resource.id} has no downloadable URL`)
  return { rows: await fetchCsv(resource.url), sourceUrl: resource.url }
}
