import { contracts } from "@openquebec/db"
import { getDb } from "./db"
import { money, date } from "./parse"
import { loadOcdsReleases, type OcdsRelease } from "./ckan"
import { getOrCreateOrganization, getOrCreateMinistry } from "./resolve"

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

/** Load the newest SEAO OCDS release file and upsert each award into `contracts`. */
export async function ingestContracts(_directUrl?: string, limit?: number): Promise<IngestResult> {
  const db = getDb()
  const { releases, sourceUrl } = await loadOcdsReleases(DATASET, PREFER)
  const result: IngestResult = { source: "SEAO", url: sourceUrl, rows: releases.length, upserted: 0, skipped: 0, errors: 0 }

  const slice = limit ? releases.slice(0, limit) : releases
  for (const release of slice) {
    try {
      const buyer = buyerName(release)
      const tenderTitle = release.tender?.title
      const method = release.tender?.procurementMethodDetails ?? release.tender?.procurementMethod
      const isSoleSource =
        release.tender?.procurementMethod === "direct" || (method ? SOLE_SOURCE.test(method) : false)
      const ministryId = buyer ? await getOrCreateMinistry(buyer) : undefined

      const awards = release.awards?.length ? release.awards : [undefined]
      for (const award of awards) {
        const externalId = `${release.ocid ?? release.id}-${award?.id ?? "0"}`
        const title = award?.title ?? tenderTitle ?? "Contrat SEAO"
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
        const vendorId = vendorName ? await getOrCreateOrganization(vendorName, "vendor") : undefined

        await db
          .insert(contracts)
          .values({
            externalId,
            title,
            amount,
            currency: award?.value?.currency ?? "CAD",
            vendorId,
            ministryId,
            procurementMethod: method?.slice(0, 50),
            isSoleSource,
            awardDate: date(award?.date ?? release.date),
            sourceUrl,
            source: "SEAO",
          })
          .onConflictDoUpdate({
            target: contracts.externalId,
            set: { title, amount, vendorId, ministryId, procurementMethod: method?.slice(0, 50), isSoleSource, updatedAt: new Date() },
          })
        result.upserted++
      }
    } catch (err) {
      result.errors++
      if (result.errors <= 5) console.error("contract release error:", (err as Error).message)
    }
  }
  return result
}
