interface DashboardData {
  totalBudgetPlanned: number
  totalBudgetActual: number
  totalContracts: number
  totalContractValue: number
  totalMinistries: number
  totalVendors: number
}

function formatCAD(n: number): string {
  return new Intl.NumberFormat("fr-CA", { style: "currency", currency: "CAD", maximumFractionDigits: 0 }).format(n)
}

function formatB(n: number): string {
  return `${(n / 1e9).toFixed(1)} G$`
}

export function DashboardOverview({ data }: { data: DashboardData | null }) {
  if (!data) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="card-3d h-24 animate-pulse p-4">
            <div className="h-full w-full rounded bg-border/30" />
          </div>
        ))}
      </div>
    )
  }

  const deficit = data.totalBudgetActual - data.totalBudgetPlanned

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      <MetricCard label="Budget prévu" value={formatB(data.totalBudgetPlanned)} />
      <MetricCard label="Dépenses réelles" value={formatB(data.totalBudgetActual)} />
      <MetricCard
        label="Écart budgétaire"
        value={formatB(deficit)}
        accent={deficit > 0 ? "accent" : "pine"}
      />
      <MetricCard label="Ministères" value={data.totalMinistries.toString()} />
      <MetricCard label="Fournisseurs" value={data.totalVendors.toString()} />
      <MetricCard label="Valeur contrats" value={formatB(data.totalContractValue)} />
    </div>
  )
}

function MetricCard({
  label,
  value,
  accent,
}: {
  label: string
  value: string
  accent?: "accent" | "pine"
}) {
  return (
    <div className="card-3d p-4">
      <p className="ink-label">{label}</p>
      <p
        className={`mt-1.5 text-2xl font-bold tracking-tight ${
          accent === "accent" ? "text-accent" : accent === "pine" ? "text-pine" : "text-ink"
        }`}
        style={{ fontFamily: "var(--font-mono)" }}
      >
        {value}
      </p>
    </div>
  )
}
