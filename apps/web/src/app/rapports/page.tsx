export default function ReportsPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Rapports d'audit</h1>
      <p className="mt-1 text-sm text-slate-500">
        Rapports générés automatiquement par les agents d'analyse.
      </p>

      <div className="mt-6 space-y-4">
        <ReportCard
          title="Rapport d'audit indépendant des finances publiques du Québec"
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
    <div className="rounded-lg border bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-semibold text-slate-900">{title}</h3>
          <p className="mt-1 text-xs text-slate-400">{date}</p>
          <p className="mt-2 text-sm text-slate-600">{description}</p>
        </div>
        <a
          href={file}
          className="rounded-lg bg-navy-700 px-4 py-2 text-sm font-medium text-white hover:bg-navy-800"
        >
          Consulter
        </a>
      </div>
    </div>
  )
}
