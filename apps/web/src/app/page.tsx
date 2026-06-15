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
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Tableau de bord des finances publiques du Québec</h1>
        <p className="mt-1 text-sm text-slate-500">
          Suivez chaque dollar public, de la collecte au bénéficiaire final.
        </p>
      </div>

      <DashboardOverview data={data} />

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <QuickActionCard
          title="Explorateur de dépenses"
          description="Recherchez et parcourez toutes les dépenses publiques"
          href="/explorer"
          icon="search"
        />
        <QuickActionCard
          title="Contrats gouvernementaux"
          description="Consultez les contrats, fournisseurs et appels d'offres"
          href="/contrats"
          icon="file"
        />
        <QuickActionCard
          title="Analyse budgétaire"
          description="Comparez les budgets aux dépenses réelles par ministère"
          href="/budgets"
          icon="chart"
        />
      </div>
    </div>
  )
}

function QuickActionCard({
  title,
  description,
  href,
  icon,
}: {
  title: string
  description: string
  href: string
  icon: string
}) {
  return (
    <a
      href={href}
      className="group rounded-lg border bg-white p-6 shadow-sm transition hover:shadow-md hover:border-navy-300"
    >
      <h3 className="font-semibold text-slate-900 group-hover:text-navy-700">{title}</h3>
      <p className="mt-2 text-sm text-slate-500">{description}</p>
    </a>
  )
}
