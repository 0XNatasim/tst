import { chromium } from "playwright"

export interface CrawlResult {
  source: string
  url: string
  documentsFound: number
  data: Record<string, unknown>[]
}

export class PublicAccountsCrawler {
  async crawl(url: string): Promise<CrawlResult> {
    const browser = await chromium.launch({ headless: true })
    try {
      const page = await browser.newPage()
      await page.goto(url, { waitUntil: "networkidle" })
      const text = await page.evaluate(() => document.body.innerText)
      const headerMatch = text.match(/COMPTES PUBLICS.*?\n([\s\S]{0,500})/)
      return {
        source: "Comptes publics",
        url,
        documentsFound: 1,
        data: [{
          snippet: headerMatch?.[1] ?? text.slice(0, 500),
        }],
      }
    } finally {
      await browser.close()
    }
  }
}
