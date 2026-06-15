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
          <div key={i} className="animate-pulse rounded-lg border bg-white p-4 h-24" />
        ))}
      </div>
    )
  }

  const deficit = data.totalBudgetActual - data.totalBudgetPlanned

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      <MetricCard label="Budget total prévu" value={formatB(data.totalBudgetPlanned)} />
      <MetricCard label="Dépenses réelles" value={formatB(data.totalBudgetActual)} />
      <MetricCard label="Écart budgétaire" value={formatB(deficit)} color={deficit > 0 ? "red" : "green"} />
      <MetricCard label="Nombre de ministères" value={data.totalMinistries.toString()} />
      <MetricCard label="Fournisseurs" value={data.totalVendors.toString()} />
      <MetricCard label="Valeur totale contrats" value={formatB(data.totalContractValue)} />
    </div>
  )
}

function MetricCard({
  label,
  value,
  color,
}: {
  label: string
  value: string
  color?: "red" | "green"
}) {
  return (
    <div className="rounded-lg border bg-white p-4 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wider text-slate-500">{label}</p>
      <p className={`mt-1 text-xl font-bold ${
        color === "red" ? "text-red-600" : color === "green" ? "text-green-600" : "text-slate-900"
      }`}>
        {value}
      </p>
    </div>
  )
}
