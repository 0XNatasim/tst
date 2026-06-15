"use client"

import { useEffect, useState } from "react"

interface Contract {
  id: string
  title: string
  amount: number
  procurementMethod: string
  isSoleSource: boolean
  bidCount: number
}

export default function ContractsPage() {
  const [contracts, setContracts] = useState<Contract[]>([])
  const [view, setView] = useState<"all" | "top" | "sole">("top")

  useEffect(() => {
    const endpoint = view === "sole" ? "/api/contracts/sole-source" : "/api/contracts/top"
    fetch(endpoint)
      .then((r) => r.json())
      .then(setContracts)
      .catch(() => {})
  }, [view])

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Contrats gouvernementaux</h1>
      <p className="mt-1 text-sm text-slate-500">Contrats publics du Québec — montants, fournisseurs et modes d'attribution.</p>

      <div className="mt-4 flex gap-2">
        {(["top", "all", "sole"] as const).map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={`rounded-lg px-4 py-2 text-sm font-medium ${
              view === v ? "bg-navy-700 text-white" : "bg-white text-slate-600 border"
            }`}
          >
            {v === "top" ? "Plus importants" : v === "sole" ? "Source unique" : "Tous"}
          </button>
        ))}
      </div>

      <div className="mt-4 space-y-2">
        {contracts.map((c) => (
          <div key={c.id} className="rounded-lg border bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-medium text-slate-900">{c.title}</h3>
                <p className="text-sm text-slate-500">
                  {c.procurementMethod ?? "N/A"}
                  {c.isSoleSource && <span className="ml-2 text-red-flag font-medium">Source unique</span>}
                  {c.bidCount != null && <span className="ml-2">{c.bidCount} soumissionnaire(s)</span>}
                </p>
              </div>
              <p className="text-sm font-semibold text-slate-700">
                {new Intl.NumberFormat("fr-CA", { style: "currency", currency: "CAD", maximumFractionDigits: 0 }).format(c.amount)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
