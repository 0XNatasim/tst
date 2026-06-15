import type { Metadata } from "next"
import { Fraunces, Inter, JetBrains_Mono } from "next/font/google"
import "./globals.css"

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  axes: ["SOFT", "WONK", "opsz"],
})

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
})

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export const metadata: Metadata = {
  title: "OpenQuébec — Suivi des finances publiques",
  description: "Plateforme citoyenne de transparence des finances publiques du Québec",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${fraunces.variable} ${inter.variable} ${jetbrains.variable}`}>
      <body className="min-h-screen bg-paper text-ink antialiased">
        <div className="grain-overlay" />

        <header className="relative border-b border-border bg-paper-light">
          <div className="retro-grid">
            <div className="relative mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
              <a href="/" className="group flex items-center gap-3">
                <span className="inline-flex items-center justify-center w-10 h-10 border border-border bg-paper shadow-[3px_3px_0_#d4c5b2] group-hover:shadow-[4px_4px_0_#c73e1d] group-hover:border-accent transition-all duration-150">
                  <span className="text-lg font-serif font-bold leading-none text-accent" style={{ fontFamily: "var(--font-fraunces)" }}>◈</span>
                </span>
                <div>
                  <span className="text-lg font-serif font-bold tracking-tight text-ink" style={{ fontFamily: "var(--font-fraunces)" }}>
                    OpenQuébec
                  </span>
                  <span className="block text-[0.625rem] font-mono uppercase tracking-[0.15em] text-ink-muted">
                    Transparence publique
                  </span>
                </div>
              </a>
              <nav className="flex items-center gap-1">
                {[
                  { href: "/", label: "Tableau de bord" },
                  { href: "/explorer", label: "Explorateur" },
                  { href: "/contrats", label: "Contrats" },
                  { href: "/budgets", label: "Budgets" },
                  { href: "/rapports", label: "Rapports" },
                ].map((item) => (
                  <a
                    key={item.href}
                    href={item.href}
                    className="px-3 py-1.5 text-[0.6875rem] font-mono font-semibold uppercase tracking-[0.06em] text-ink-muted hover:text-accent transition-colors duration-150"
                  >
                    {item.label}
                  </a>
                ))}
              </nav>
            </div>
          </div>
        </header>

        <main className="relative mx-auto max-w-7xl px-4 py-8">
          {children}
        </main>

        <footer className="relative border-t border-border bg-paper">
          <div className="mx-auto max-w-7xl px-4 py-8">
            <div className="flex flex-col items-center gap-2 text-center">
              <p className="text-[0.625rem] font-mono uppercase tracking-[0.12em] text-ink-faint">
                OpenQuébec — Données publiques · Transparence citoyenne
              </p>
              <p className="text-[0.5625rem] font-mono text-ink-faint">
                Sans affiliation gouvernementale · {new Date().getFullYear()}
              </p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  )
}
