import { sql } from "drizzle-orm"
import { contracts } from "@openquebec/db"
import { getDb } from "./db"
import { money, date } from "./parse"
import { loadOcdsReleases, type OcdsRelease } from "./ckan"
import {
  preloadCaches,
  ensureOrganizations,
  getOrCreateMinistry,
  orgId,
  ministryId,
} from "./resolve"

export interface IngestResult {
  source: string
  url: string
  rows: number
  upserted: number
  skipped: number
  errors: number
}

/** Québec contracts open data (SEAO), published as OCDS JSON via the Données
 * Québec CKAN API. Override the dataset slug with SEAO_DATASET. */
const DATASET = process.env.SEAO_DATASET ?? "systeme-electronique-dappel-doffres-seao"
// Prefer the newest weekly OCDS file ("hebdo_YYYYMMDD_YYYYMMDD.json").
const PREFER = /hebdo|contrat|seao/i

const SOLE_SOURCE = /gr[eé]\s*[àa]\s*gr[eé]|sole.?source|contrat de gr[eé]/i

/** Resolve a release's buyer name from the buyer block or the parties list. */
function buyerName(release: OcdsRelease): string | undefined {
  if (release.buyer?.name) return release.buyer.name
  const party = release.parties?.find((p) => p.roles?.includes("buyer"))
  return party?.name
}

/** Best official document/notice URL for this award, falling back to the
 * public SEAO notice page derived from the OCID. */
function documentUrl(release: OcdsRelease, award?: { documents?: { url?: string }[] }): string | undefined {
  const fromDocs =
    award?.documents?.find((d) => d.url)?.url ??
    release.tender?.documents?.find((d) => d.url)?.url ??
    release.documents?.find((d) => d.url)?.url
  if (fromDocs) return fromDocs
  const num = release.ocid?.split("-").pop()
  return num ? `https://www.seao.ca/Recherche/rech_avis.aspx?ItemId=${num}` : undefined
}

type ContractValues = typeof contracts.$inferInsert

/** Load the newest SEAO OCDS release file and bulk-upsert each award into
 * `contracts`. Resolves vendors/ministries from preloaded caches and inserts in
 * batches so a full weekly file finishes within serverless time limits. */
export async function ingestContracts(_directUrl?: string, limit?: number): Promise<IngestResult> {
  const db = getDb()
  const { releases, sourceUrl } = await loadOcdsReleases(DATASET, PREFER)
  const result: IngestResult = { source: "SEAO", url: sourceUrl, rows: releases.length, upserted: 0, skipped: 0, errors: 0 }

  await preloadCaches()
  const slice = limit ? releases.slice(0, limit) : releases

  // Pass 1: flatten releases → awards, collecting names to resolve in bulk.
  interface Pending {
    externalId: string
    title: string
    amount?: string
    currency: string
    vendorName?: string
    buyer?: string
    method?: string
    isSoleSource: boolean
    awardDate?: Date
    sourceUrl?: string
  }
  const pending: Pending[] = []
  const vendorNames = new Set<string>()
  const buyerNames = new Set<string>()

  for (const release of slice) {
    const buyer = buyerName(release)
    if (buyer) buyerNames.add(buyer)
    const tenderTitle = release.tender?.title
    const method = release.tender?.procurementMethodDetails ?? release.tender?.procurementMethod
    const isSoleSource =
      release.tender?.procurementMethod === "direct" || (method ? SOLE_SOURCE.test(method) : false)
    const awards = release.awards?.length ? release.awards : [undefined]
    for (const award of awards) {
      const amount = money(
        award?.value?.amount != null
          ? String(award.value.amount)
          : release.tender?.value?.amount != null
            ? String(release.tender.value.amount)
            : undefined,
      )
      if (amount == null && !award) {
        result.skipped++
        continue
      }
      const vendorName = award?.suppliers?.find((s) => s.name)?.name
      if (vendorName) vendorNames.add(vendorName)
      pending.push({
        externalId: `${release.ocid ?? release.id}-${award?.id ?? "0"}`,
        title: award?.title ?? tenderTitle ?? "Contrat SEAO",
        amount,
        currency: award?.value?.currency ?? "CAD",
        vendorName,
        buyer,
        method,
        isSoleSource,
        awardDate: date(award?.date ?? release.date),
        sourceUrl: documentUrl(release, award),
      })
    }
  }

  // Resolve foreign keys in bulk (vendors batched; ministries are few).
  await ensureOrganizations(vendorNames)
  for (const name of buyerNames) await getOrCreateMinistry(name)

  // Pass 2: build rows, de-duplicate on externalId, then batch-upsert.
  const byId = new Map<string, ContractValues>()
  for (const p of pending) {
    byId.set(p.externalId, {
      externalId: p.externalId,
      title: p.title,
      amount: p.amount,
      currency: p.currency,
      vendorId: orgId(p.vendorName),
      ministryId: ministryId(p.buyer),
      procurementMethod: p.method,
      isSoleSource: p.isSoleSource,
      awardDate: p.awardDate,
      sourceUrl: p.sourceUrl,
      source: "SEAO",
    })
  }

  const rows = [...byId.values()]
  for (let i = 0; i < rows.length; i += 500) {
    const chunk = rows.slice(i, i + 500)
    try {
      await db
        .insert(contracts)
        .values(chunk)
        .onConflictDoUpdate({
          target: contracts.externalId,
          set: {
            title: sql`excluded.title`,
            amount: sql`excluded.amount`,
            vendorId: sql`excluded.vendor_id`,
            ministryId: sql`excluded.ministry_id`,
            procurementMethod: sql`excluded.procurement_method`,
            isSoleSource: sql`excluded.is_sole_source`,
            sourceUrl: sql`excluded.source_url`,
            updatedAt: new Date(),
          },
        })
      result.upserted += chunk.length
    } catch (err) {
      result.errors += chunk.length
      if (result.errors <= 500) console.error("contract batch error:", (err as Error).message)
    }
  }
  return result
}
