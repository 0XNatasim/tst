// Public entry point for the crawlers package.
// Exposes the HTTP open-data ingestion pipeline (no Playwright dependency),
// so it is safe to import from serverless functions such as the cron route.
export { runIngest, ingestContracts, ingestBudgets } from "./ingest"
export type { RunSummary, IngestResult } from "./ingest"
export { loadRows, searchDatasets } from "./ingest/ckan"
