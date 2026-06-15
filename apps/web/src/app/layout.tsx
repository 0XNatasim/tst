import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "OpenQuebec.ai — Suivi des finances publiques",
  description: "Plateforme citoyenne de transparence des finances publiques du Québec",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className="min-h-screen bg-slate-50">
        <header className="border-b bg-white shadow-sm">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
            <a href="/" className="flex items-center gap-2">
              <span className="text-xl font-bold text-navy-700">OpenQuebec.ai</span>
              <span className="rounded bg-forest-100 px-2 py-0.5 text-xs font-medium text-forest-700">ALPHA</span>
            </a>
            <nav className="flex items-center gap-4 text-sm text-slate-600">
              <a href="/" className="hover:text-navy-700">Tableau de bord</a>
              <a href="/explorer" className="hover:text-navy-700">Explorateur</a>
              <a href="/contrats" className="hover:text-navy-700">Contrats</a>
              <a href="/budgets" className="hover:text-navy-700">Budgets</a>
              <a href="/rapports" className="hover:text-navy-700">Rapports</a>
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-7xl px-4 py-6">
          {children}
        </main>
        <footer className="border-t bg-white py-6 text-center text-xs text-slate-400">
          OpenQuebec.ai — Données publiques. Transparence citoyenne. Sans affiliation gouvernementale.
        </footer>
      </body>
    </html>
  )
}
