export type FiscalYear = `20${number}-${number}`

export interface MoneyFlow {
  source: string
  target: string
  amount: number
  fiscalYear: FiscalYear
  category: string
}

export interface BudgetComparison {
  ministryId: string
  ministryName: string
  fiscalYear: FiscalYear
  planned: number
  actual: number
  variance: number
  variancePct: number
}

export interface ContractSummary {
  id: string
  title: string
  vendor: string
  amount: number
  ministry: string
  awardDate: string
  procurementMethod: string
  bidCount: number
  riskScore: number
}

export interface RiskFlag {
  type: "critical" | "high" | "medium" | "low"
  title: string
  description: string
  entityType: string
  entityId: string
  value: number
  evidence: string[]
}

export interface DashboardMetric {
  label: string
  value: number
  change: number
  changeType: "up" | "down"
  format: "currency" | "percentage" | "number"
}

export interface EntityGraph {
  nodes: Array<{
    id: string
    type: string
    label: string
    properties: Record<string, unknown>
  }>
  edges: Array<{
    source: string
    target: string
    type: string
    properties: Record<string, unknown>
  }>
}

export interface SearchResult {
  type: "contract" | "grant" | "payment" | "organization" | "ministry"
  id: string
  title: string
  subtitle: string
  amount: number
  date: string
  relevance: number
}
