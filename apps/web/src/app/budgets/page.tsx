"use client"

import { useEffect, useState } from "react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

interface BudgetItem {
  id: string
  ministryId: string
  fiscalYear: string
  planned: number
  actual: number
  variance: number
  variancePct: number
}

function formatCAD(n: number): string {
  return new Intl.NumberFormat("fr-CA", { style: "currency", currency: "CAD", maximumFractionDigits: 0 }).format(n)
}

export default function BudgetsPage() {
  const [data, setData] = useState<BudgetItem[]>([])
  const [fiscalYear, setFiscalYear] = useState("2026-2027")

  useEffect(() => {
    fetch(`/api/budgets?fiscalYear=${fiscalYear}`)
      .then((r) => r.json())
      .then(setData)
      .catch(() => {})
  }, [fiscalYear])

  const chartData = data.map((d) => ({
    name: d.ministryId?.slice(0, 8) ?? "N/A",
    Prévu: Number(d.planned) / 1e9,
    Réel: Number(d.actual) / 1e9,
  }))

  return (
    <div>
      <h1 className="section-header" style={{ fontFamily: "var(--font-fraunces)" }}>
        Analyse budgétaire
      </h1>
      <p className="mt-2 font-mono text-xs uppercase tracking-[0.08em] text-ink-muted">
        Budgets prévus vs dépenses réelles par ministère.
      </p>
      <div className="divider-retro mt-4" />

      <div className="mt-6">
        <select
          value={fiscalYear}
          onChange={(e) => setFiscalYear(e.target.value)}
          className="select-retro px-3 py-2"
        >
          <option value="2026-2027">2026-2027</option>
          <option value="2025-2026">2025-2026</option>
          <option value="2024-2025">2024-2025</option>
        </select>
      </div>

      <div className="card-3d mt-6 p-4">
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#d4c5b2" strokeOpacity={0.4} />
              <XAxis
                dataKey="name"
                tick={{ fontFamily: "var(--font-mono)", fontSize: 11, fill: "#7a6f65" }}
                axisLine={{ stroke: "#d4c5b2", strokeOpacity: 0.5 }}
              />
              <YAxis
                tick={{ fontFamily: "var(--font-mono)", fontSize: 11, fill: "#7a6f65" }}
                axisLine={{ stroke: "#d4c5b2", strokeOpacity: 0.5 }}
                tickFormatter={(v) => `${v}G$`}
              />
              <Tooltip
                contentStyle={{
                  background: "#fdfaf5",
                  border: "1px solid #d4c5b2",
                  borderRadius: 0,
                  boxShadow: "4px 4px 0 rgba(0,0,0,0.06)",
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.75rem",
                }}
              />
              <Bar dataKey="Prévu" fill="#2b4c7a" radius={[2, 2, 0, 0]} />
              <Bar dataKey="Réel" fill="#2d6a4f" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="mt-8 space-y-3">
        {data.map((d) => {
          const variance = Number(d.variance)
          return (
            <div key={d.id} className="card-3d p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-serif text-base font-bold text-ink"
                    style={{ fontFamily: "var(--font-fraunces)" }}>
                    Ministère {d.ministryId?.slice(0, 8)}
                  </p>
                  <p className="mt-0.5 font-mono text-[0.625rem] uppercase tracking-wider text-ink-faint">
                    {d.fiscalYear}
                  </p>
                </div>
                <div className="text-right">
                  <p className="ink-label">Prévu</p>
                  <p className="ink-value text-sm">{formatCAD(Number(d.planned))}</p>
                  <p className="ink-label mt-1">Réel</p>
                  <p className="ink-value text-sm">{formatCAD(Number(d.actual))}</p>
                  <p className={`ink-value mt-1 text-sm ${variance > 0 ? "text-accent" : "text-pine"}`}>
                    {variance > 0 ? "+" : ""}{formatCAD(variance)}
                  </p>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
