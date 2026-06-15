import { createHash } from "node:crypto"
import { contracts } from "@openquebec/db"
import { getDb } from "./db"
import { fetchCsv, field, money, date, type Row } from "./parse"
import { getOrCreateOrganization, getOrCreateMinistry } from "./resolve"

export interface IngestResult {
  source: string
  url: string
  rows: number
  upserted: number
  skipped: number
  errors: number
}

/** Default Québec contracts open-data source (SEAO). Override with SEAO_CONTRACTS_URL. */
const DEFAULT_URL =
  process.env.SEAO_CONTRACTS_URL ??
  "https://www.donneesquebec.ca/recherche/dataset/systeme-electronique-d-appel-d-offres-seao/resource/contrats.csv"

const SOLE_SOURCE = /gr[eé]\s*[àa]\s*gr[eé]|sole.?source|contrat de gr[eé]/i

function rowExternalId(row: Row, fallbackSeed: string): string {
  const id = field(row, "numeroseao", "numero", "id", "no_contrat", "numerocontrat")
  if (id) return id
  return "seao-" + createHash("sha1").update(fallbackSeed).digest("hex").slice(0, 16)
}

/** Fetch the SEAO contracts CSV, map each row, and upsert into `contracts`. */
export async function ingestContracts(url = DEFAULT_URL, limit?: number): Promise<IngestResult> {
  const result: IngestResult = { source: "SEAO", url, rows: 0, upserted: 0, skipped: 0, errors: 0 }
  const db = getDb()

  const rows = await fetchCsv(url)
  result.rows = rows.length
  const slice = limit ? rows.slice(0, limit) : rows

  for (const row of slice) {
    try {
      const title =
        field(row, "titre", "objet", "description", "nature", "objetcontrat") ?? "Contrat sans titre"
      const amount = money(
        field(row, "montantfinal", "montanttotalcontrat", "montantcontrat", "montant", "montantadjuge"),
      )
      const externalId = rowExternalId(row, `${title}|${amount ?? ""}|${field(row, "fournisseur", "adjudicataire") ?? ""}`)

      const vendorName = field(row, "fournisseur", "adjudicataire", "nomfournisseur", "contractant")
      const buyerName = field(row, "organisme", "donneurdouvrage", "nomorganisme", "donneurordres", "ministere")

      const vendorId = vendorName ? await getOrCreateOrganization(vendorName, "vendor") : undefined
      const ministryId = buyerName ? await getOrCreateMinistry(buyerName) : undefined

      const method = field(row, "type", "typecontrat", "naturecontrat", "modeattribution")
      const isSoleSource = method ? SOLE_SOURCE.test(method) : false

      await db
        .insert(contracts)
        .values({
          externalId,
          title,
          amount,
          vendorId,
          ministryId,
          procurementMethod: method?.slice(0, 50),
          isSoleSource,
          awardDate: date(field(row, "datefinale", "dateadjudication", "datepublication", "datedebutcontrat")),
          startDate: date(field(row, "datedebutcontrat", "datedebut")),
          endDate: date(field(row, "datefincontrat", "datefin")),
          sourceUrl: field(row, "lien", "url", "hyperlien"),
          source: "SEAO",
        })
        .onConflictDoUpdate({
          target: contracts.externalId,
          set: {
            title,
            amount,
            vendorId,
            ministryId,
            procurementMethod: method?.slice(0, 50),
            isSoleSource,
            updatedAt: new Date(),
          },
        })
      result.upserted++
    } catch (err) {
      result.errors++
      if (result.errors <= 5) console.error("contract row error:", (err as Error).message)
    }
  }
  return result
}
