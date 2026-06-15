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
      <h1 className="text-2xl font-bold text-slate-900">Explorateur de dépenses publiques</h1>
      <p className="mt-1 text-sm text-slate-500">
        Recherchez des contrats, organismes, subventions et bénéficiaires.
      </p>

      <div className="mt-6">
        <input
          type="text"
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Rechercher par nom, montant, ministère..."
          className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm focus:border-navy-500 focus:outline-none"
        />
      </div>

      {loading && <p className="mt-4 text-sm text-slate-400">Recherche en cours...</p>}

      <div className="mt-4 space-y-2">
        {results.map((r) => (
          <div key={`${r.type}-${r.id}`} className="rounded-lg border bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <span className="inline-block rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                  {r.type}
                </span>
                <h3 className="mt-1 font-medium text-slate-900">{r.title}</h3>
                {r.subtitle && <p className="text-sm text-slate-500">{r.subtitle}</p>}
              </div>
              <p className="text-sm font-semibold text-slate-700">
                {new Intl.NumberFormat("fr-CA", { style: "currency", currency: "CAD", maximumFractionDigits: 0 }).format(r.amount)}
              </p>
            </div>
          </div>
        ))}
        {query.length >= 2 && !loading && results.length === 0 && (
          <p className="text-sm text-slate-400">Aucun résultat trouvé.</p>
        )}
      </div>
    </div>
  )
}
