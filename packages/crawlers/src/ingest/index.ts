import { ingestContracts, type IngestResult } from "./contracts"
import { ingestBudgets } from "./budgets"
import { ingestActuals, actualsConfigured } from "./actuals"
import { resetCaches } from "./resolve"

export { ingestContracts, ingestBudgets, ingestActuals, type IngestResult }

export interface RunSummary {
  startedAt: string
  finishedAt: string
  results: IngestResult[]
  errors: string[]
}

/** Run all open-data ingestions. Each source is isolated: a failure in one
 * (e.g. network/egress or a moved URL) is recorded but does not abort the rest. */
export async function runIngest(opts: { limit?: number } = {}): Promise<RunSummary> {
  const startedAt = new Date().toISOString()
  resetCaches()
  const results: IngestResult[] = []
  const errors: string[] = []

  const tasks: [string, () => Promise<IngestResult>][] = [
    ["SEAO contracts", () => ingestContracts(undefined, opts.limit)],
    ["Budgets", () => ingestBudgets(undefined, opts.limit)],
  ]
  // Actuals (Comptes publics) only run once a source is configured.
  if (actualsConfigured()) {
    tasks.push(["Comptes publics", () => ingestActuals(undefined, opts.limit)])
  }

  for (const [name, fn] of tasks) {
    try {
      results.push(await fn())
    } catch (err) {
      const msg = `${name}: ${(err as Error).message}`
      errors.push(msg)
      console.error(msg)
    }
  }

  return { startedAt, finishedAt: new Date().toISOString(), results, errors }
}
