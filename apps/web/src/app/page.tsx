"use client"

import { useEffect, useState } from "react"
import { DashboardOverview } from "@/components/dashboard/overview"

export default function Home() {
  const [data, setData] = useState<{
    totalBudgetPlanned: number
    totalBudgetActual: number
    totalContracts: number
    totalContractValue: number
    totalMinistries: number
    totalVendors: number
  } | null>(null)

  useEffect(() => {
    fetch("/api/dashboard/summary")
      .then((r) => r.json())
      .then(setData)
      .catch(() => {})
  }, [])

  return (
    <div>
      <div className="mb-8">
        <h1 className="section-header" style={{ fontFamily: "var(--font-fraunces)" }}>
          Finances publiques du Québec
        </h1>
        <p className="mt-2 font-mono text-xs uppercase tracking-[0.08em] text-ink-muted">
          Suivi citoyen — chaque dollar public, de la collecte au bénéficiaire final.
        </p>
        <div className="divider-retro mt-4" />
      </div>

      <DashboardOverview data={data} />

      <div className="mt-10 grid gap-5 lg:grid-cols-3">
        <QuickActionCard
          title="Explorateur"
          description="Recherchez et parcourez toutes les dépenses publiques"
          href="/explorer"
          index={0}
        />
        <QuickActionCard
          title="Contrats"
          description="Consultez les contrats, fournisseurs et appels d'offres"
          href="/contrats"
          index={1}
        />
        <QuickActionCard
          title="Budgets"
          description="Comparez les budgets aux dépenses réelles par ministère"
          href="/budgets"
          index={2}
        />
      </div>
    </div>
  )
}

function QuickActionCard({
  title,
  description,
  href,
  index,
}: {
  title: string
  description: string
  href: string
  index: number
}) {
  const icons = ["◈", "◇", "◆"]
  return (
    <a
      href={href}
      className="card-3d group block p-6"
    >
      <span className="inline-flex items-center justify-center w-9 h-9 mb-3 border border-border bg-paper text-accent text-sm"
        style={{ fontFamily: "var(--font-serif)", boxShadow: "2px 2px 0 #d4c5b2" }}>
        {icons[index]}
      </span>
      <h3 className="font-serif text-lg font-bold tracking-tight text-ink group-hover:text-accent transition-colors"
        style={{ fontFamily: "var(--font-fraunces)" }}>
        {title}
      </h3>
      <p className="mt-1.5 font-mono text-[0.6875rem] leading-relaxed text-ink-muted">
        {description}
      </p>
    </a>
  )
}
