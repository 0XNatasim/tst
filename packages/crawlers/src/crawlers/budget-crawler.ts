import { chromium } from "playwright"

export interface CrawlResult {
  source: string
  url: string
  documentsFound: number
  data: Record<string, unknown>[]
}

export class BudgetCrawler {
  async crawl(url: string): Promise<CrawlResult> {
    const browser = await chromium.launch({ headless: true })
    try {
      const page = await browser.newPage()
      await page.goto(url, { waitUntil: "networkidle" })
      const links = await page.$$eval("a[href$='.pdf'], a[href$='.xlsx'], a[href*='Budget']", (els) =>
        els.map((el) => ({
          href: (el as HTMLAnchorElement).href,
          text: el.textContent?.trim() ?? "",
        })).filter((l) => l.href && l.text)
      )
      return {
        source: "Budget Québec",
        url,
        documentsFound: links.length,
        data: links.slice(0, 50),
      }
    } finally {
      await browser.close()
    }
  }
}
