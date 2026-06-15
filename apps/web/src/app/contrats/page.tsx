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

function formatCAD(n: number): string {
  return new Intl.NumberFormat("fr-CA", { style: "currency", currency: "CAD", maximumFractionDigits: 0 }).format(n)
}

export default function ContractsPage() {
  const [contracts, setContracts] = useState<Contract[]>([])
  const [view, setView] = useState<"all" | "top" | "sole">("top")

  useEffect(() => {
    const endpoint = view === "sole" ? "/api/contracts/sole-source" : view === "top" ? "/api/contracts/top" : "/api/contracts"
    fetch(endpoint)
      .then((r) => r.json())
      .then(setContracts)
      .catch(() => {})
  }, [view])

  const tabs = [
    { key: "top" as const, label: "Plus importants" },
    { key: "all" as const, label: "Tous" },
    { key: "sole" as const, label: "Source unique" },
  ]

  return (
    <div>
      <h1 className="section-header" style={{ fontFamily: "var(--font-fraunces)" }}>
        Contrats gouvernementaux
      </h1>
      <p className="mt-2 font-mono text-xs uppercase tracking-[0.08em] text-ink-muted">
        Contrats publics du Québec — montants, fournisseurs et modes d&apos;attribution.
      </p>
      <div className="divider-retro mt-4" />

      <div className="mt-6 flex">
        {tabs.map((t) => (
          <button
            key={t.key}
            className="tab-retro"
            data-active={view === t.key}
            onClick={() => setView(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-6 space-y-3">
        {contracts.map((c) => (
          <div key={c.id} className="card-3d p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h3 className="font-serif text-base font-bold tracking-tight text-ink"
                  style={{ fontFamily: "var(--font-fraunces)" }}>
                  {c.title}
                </h3>
                <div className="mt-1.5 flex flex-wrap items-center gap-2">
                  <span className="badge-retro">{c.procurementMethod ?? "N/A"}</span>
                  {c.isSoleSource && (
                    <span className="badge-retro" style={{ borderColor: "var(--color-accent)", color: "var(--color-accent)" }}>
                      Source unique
                    </span>
                  )}
                  {c.bidCount != null && (
                    <span className="badge-retro">{c.bidCount} soumissionnaire(s)</span>
                  )}
                </div>
              </div>
              <p className="ink-value shrink-0 text-base">
                {formatCAD(c.amount)}
              </p>
            </div>
          </div>
        ))}
        {contracts.length === 0 && (
          <p className="font-mono text-xs text-ink-faint">Aucun contrat trouvé.</p>
        )}
      </div>
    </div>
  )
}
