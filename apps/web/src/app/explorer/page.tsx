"use client"

import { useState } from "react"

interface SearchResult {
  type: string
  id: string
  title: string
  subtitle: string
  amount: number
  date: string
}

function formatCAD(n: number): string {
  return new Intl.NumberFormat("fr-CA", { style: "currency", currency: "CAD", maximumFractionDigits: 0 }).format(n)
}

export default function ExplorerPage() {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)

  async function handleSearch(q: string) {
    setQuery(q)
    if (q.length < 2) {
      setResults([])
      return
    }
    setLoading(true)
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`)
      const data = await res.json()
      setResults(data)
    } catch { /* ignore */ }
    setLoading(false)
  }

  return (
    <div>
      <h1 className="section-header" style={{ fontFamily: "var(--font-fraunces)" }}>
        Explorateur de dépenses
      </h1>
      <p className="mt-2 font-mono text-xs uppercase tracking-[0.08em] text-ink-muted">
        Contrats, organismes, subventions — recherchez par nom, montant, ministère.
      </p>
      <div className="divider-retro mt-4" />

      <div className="mt-6">
        <input
          type="text"
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Rechercher..."
          className="input-retro w-full px-4 py-3"
        />
      </div>

      {loading && (
        <p className="mt-4 font-mono text-xs text-ink-faint">Recherche en cours...</p>
      )}

      <div className="mt-4 space-y-3">
        {results.map((r) => (
          <div key={`${r.type}-${r.id}`} className="card-3d p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <span className="badge-retro">{r.type}</span>
                <h3 className="mt-1.5 font-serif text-base font-bold tracking-tight text-ink"
                  style={{ fontFamily: "var(--font-fraunces)" }}>
                  {r.title}
                </h3>
                {r.subtitle && (
                  <p className="mt-0.5 font-mono text-xs text-ink-muted">{r.subtitle}</p>
                )}
              </div>
              <p className="ink-value shrink-0 text-base">
                {formatCAD(r.amount)}
              </p>
            </div>
          </div>
        ))}
        {query.length >= 2 && !loading && results.length === 0 && (
          <p className="font-mono text-xs text-ink-faint">Aucun résultat trouvé.</p>
        )}
      </div>
    </div>
  )
}
