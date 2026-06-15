export default function ReportsPage() {
  return (
    <div>
      <h1 className="section-header" style={{ fontFamily: "var(--font-fraunces)" }}>
        Rapports d&apos;audit
      </h1>
      <p className="mt-2 font-mono text-xs uppercase tracking-[0.08em] text-ink-muted">
        Rapports générés automatiquement par les agents d&apos;analyse.
      </p>
      <div className="divider-retro mt-4" />

      <div className="mt-8 space-y-4">
        <ReportCard
          title="Audit indépendant des finances publiques du Québec"
          date="14 juin 2026"
          description="Analyse complète des 10 étapes : revenus, dépenses, contrats, sociétés d'État, drapeaux rouges, et répartition par contribuable."
          file="/rapport_audit_finances_quebec.md"
        />
        <ReportCard
          title="Analyse des drapeaux rouges"
          date="14 juin 2026"
          description="14 anomalies détectées dont 3 critiques : déficit record, contrats sans appel d'offres +30%, et plan d'équilibre incomplet."
          file="#"
        />
        <ReportCard
          title="Classement des ministères par efficacité"
          date="14 juin 2026"
          description="Score moyen de 57/100. Économie (70) en tête, Services sociaux (45) en queue."
          file="#"
        />
      </div>
    </div>
  )
}

function ReportCard({
  title,
  date,
  description,
  file,
}: {
  title: string
  date: string
  description: string
  file: string
}) {
  return (
    <div className="card-3d p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="font-serif text-lg font-bold tracking-tight text-ink"
            style={{ fontFamily: "var(--font-fraunces)" }}>
            {title}
          </h3>
          <p className="mt-1 font-mono text-[0.625rem] uppercase tracking-wider text-ink-faint">{date}</p>
          <p className="mt-2 font-mono text-xs leading-relaxed text-ink-muted">{description}</p>
        </div>
        <a
          href={file}
          className="btn-retro btn-retro-primary shrink-0"
        >
          Consulter
        </a>
      </div>
    </div>
  )
}
