import { db, ministries, organizations, programs, budgets, contracts } from "@openquebec/db"

async function seed() {
  console.log("Seeding OpenQuebec database...")

  const msss = await db.insert(ministries).values({
    name: "Ministère de la Santé et des Services sociaux",
    code: "MSSS",
    budget: "68700000000",
    actualSpending: "65000000000",
    fiscalYear: "2026-2027",
  }).returning()

  const meq = await db.insert(ministries).values({
    name: "Ministère de l'Éducation",
    code: "MEQ",
    budget: "24100000000",
    actualSpending: "23500000000",
    fiscalYear: "2026-2027",
  }).returning()

  const mtmd = await db.insert(ministries).values({
    name: "Ministère des Transports et de la Mobilité durable",
    code: "MTMD",
    budget: "9500000000",
    actualSpending: "9200000000",
    fiscalYear: "2026-2027",
  }).returning()

  const hydro = await db.insert(organizations).values({
    name: "Hydro-Québec",
    normalizedName: "hydro-quebec",
    type: "crown-corporation",
    sector: "Énergie",
  }).returning()

  const saq = await db.insert(organizations).values({
    name: "Société des alcools du Québec",
    normalizedName: "societe des alcools du quebec",
    type: "crown-corporation",
    sector: "Distribution",
  }).returning()

  const loto = await db.insert(organizations).values({
    name: "Loto-Québec",
    normalizedName: "loto-quebec",
    type: "crown-corporation",
    sector: "Jeux",
  }).returning()

  await db.insert(budgets).values([
    { ministryId: msss[0].id, fiscalYear: "2026-2027", planned: "68700000000", actual: "65000000000", variance: "-3700000000", variancePct: "-5.4" },
    { ministryId: meq[0].id, fiscalYear: "2026-2027", planned: "24100000000", actual: "23500000000", variance: "-600000000", variancePct: "-2.5" },
    { ministryId: mtmd[0].id, fiscalYear: "2026-2027", planned: "9500000000", actual: "9200000000", variance: "-300000000", variancePct: "-3.2" },
  ])

  await db.insert(contracts).values([
    {
      title: "Entretien des infrastructures hospitalières",
      amount: "250000000",
      procurementMethod: "Appel d'offres public",
      isSoleSource: false,
      bidCount: 4,
      ministryId: msss[0].id,
    },
    {
      title: "Modernisation du réseau informatique scolaire",
      amount: "85000000",
      procurementMethod: "Appel d'offres public",
      isSoleSource: false,
      bidCount: 3,
      ministryId: meq[0].id,
    },
    {
      title: "Entretien du réseau routier - Région de Montréal",
      amount: "180000000",
      procurementMethod: "Source unique",
      isSoleSource: true,
      bidCount: 1,
      ministryId: mtmd[0].id,
    },
  ])

  console.log("Seed complete.")
}

seed().catch(console.error)
