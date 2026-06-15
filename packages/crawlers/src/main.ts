import { BudgetCrawler } from "./crawlers/budget-crawler"
import { PublicAccountsCrawler } from "./crawlers/public-accounts-crawler"

const sources = [
  { name: "Budget Québec", crawler: BudgetCrawler, urls: [
    "https://www.finances.gouv.qc.ca/Budget_et_mise_a_jour/budget/",
  ]},
  { name: "Comptes publics", crawler: PublicAccountsCrawler, urls: [
    "https://cdn-contenu.quebec.ca/cdn-contenu/adm/min/finances/publications-adm/Comptes-publics/FR/CPTFR_vol1-2024-2025.pdf",
  ]},
]

async function runAll() {
  console.log("OpenQuebec Crawler Engine starting...")
  for (const source of sources) {
    console.log(`\n--- Crawling: ${source.name} ---`)
    try {
      const crawler = new source.crawler()
      for (const url of source.urls) {
        console.log(`Fetching: ${url}`)
        const result = await crawler.crawl(url)
        console.log(`Result: ${JSON.stringify(result).slice(0, 200)}...`)
      }
    } catch (err) {
      console.error(`Error crawling ${source.name}:`, err)
    }
  }
  console.log("\nCrawl complete.")
}

runAll()
