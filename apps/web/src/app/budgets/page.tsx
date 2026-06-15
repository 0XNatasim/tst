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
      <h1 className="text-2xl font-bold text-slate-900">Analyse budgétaire</h1>
      <p className="mt-1 text-sm text-slate-500">Comparaison des budgets prévus vs dépenses réelles par ministère.</p>

      <div className="mt-4">
        <select
          value={fiscalYear}
          onChange={(e) => setFiscalYear(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="2026-2027">2026-2027</option>
          <option value="2025-2026">2025-2026</option>
          <option value="2024-2025">2024-2025</option>
        </select>
      </div>

      <div className="mt-6 h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Bar dataKey="Prévu" fill="#3b5bdb" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Réel" fill="#22c55e" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-6 space-y-2">
        {data.map((d) => {
          const variance = Number(d.variance)
          return (
            <div key={d.id} className="rounded-lg border bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-900">Ministère {d.ministryId?.slice(0, 8)}</p>
                  <p className="text-xs text-slate-500">{d.fiscalYear}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-slate-600">
                    Prévu: {new Intl.NumberFormat("fr-CA", { style: "currency", currency: "CAD", maximumFractionDigits: 0 }).format(Number(d.planned))}
                  </p>
                  <p className="text-sm text-slate-600">
                    Réel: {new Intl.NumberFormat("fr-CA", { style: "currency", currency: "CAD", maximumFractionDigits: 0 }).format(Number(d.actual))}
                  </p>
                  <p className={`text-sm font-medium ${variance > 0 ? "text-red-600" : "text-green-600"}`}>
                    {variance > 0 ? "+" : ""}{new Intl.NumberFormat("fr-CA", { style: "currency", currency: "CAD", maximumFractionDigits: 0 }).format(variance)}
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
