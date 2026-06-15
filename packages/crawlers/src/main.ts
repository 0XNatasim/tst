import { runIngest } from "./ingest"

/** CLI entry: `pnpm --filter @openquebec/crawlers start`.
 * Pass a row cap with INGEST_LIMIT to do a quick smoke run. */
async function main() {
  console.log("OpenQuebec ingestion starting...")
  const limit = process.env.INGEST_LIMIT ? Number(process.env.INGEST_LIMIT) : undefined
  const summary = await runIngest({ limit })
  console.log(JSON.stringify(summary, null, 2))
  if (summary.errors.length) process.exitCode = 1
  console.log("Ingestion complete.")
}

main()
