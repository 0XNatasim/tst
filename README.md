# OpenQuebec.ai

**Plateforme citoyenne de transparence des finances publiques du Québec.**

Suivez chaque dollar public, de la collecte jusqu'au bénéficiaire final.

## Stack technique

```
Frontend : Next.js 15 + React 19 + Tailwind 4 + Recharts
Backend  : NestJS 11 + TypeScript
Database : PostgreSQL 17 + pgvector
Graph    : Neo4j (schema ready)
Crawlers : Playwright + PDF parsers
AI       : OpenAI / Claude agents
ORM      : Drizzle
Infra    : Docker, Vercel-ready
```

## Structure

```
openquebec/
├── apps/
│   ├── web/                # Next.js frontend
│   │   ├── src/app/        # Pages (dashboard, explorer, contrats, budgets, rapports)
│   │   └── src/components/ # React components
│   └── api/                # NestJS REST API
│       └── src/
│           ├── ministries/
│           ├── contracts/
│           ├── organizations/
│           ├── budgets/
│           ├── search/
│           └── dashboard/
├── packages/
│   ├── db/                 # Drizzle schema + client
│   ├── shared/             # Types partagés
│   ├── crawlers/           # Moteur d'ingestion (Budget, SEAO, Comptes publics)
│   └── ai/                 # Agents d'analyse (OpenAI)
├── scripts/seed.ts         # Données initiales
├── docker-compose.yml
└── Dockerfile.*
```

## Démarrage rapide

```bash
pnpm install
cp .env.example .env
docker compose up -d db
pnpm db:push
pnpm tsx scripts/seed.ts
pnpm dev
```

- Frontend : http://localhost:3000
- API : http://localhost:4000

## API

| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/api/ministries` | Tous les ministères |
| GET | `/api/ministries/:id` | Détail d'un ministère |
| GET | `/api/ministries/budgets/comparison` | Budget vs réel par exercice |
| GET | `/api/contracts` | Contrats (paginés) |
| GET | `/api/contracts/top` | Top contrats par montant |
| GET | `/api/contracts/sole-source` | Contrats source unique |
| GET | `/api/contracts/stats` | Statistiques |
| GET | `/api/contracts/vendor/:id` | Contrats par fournisseur |
| GET | `/api/organizations` | Organismes et fournisseurs |
| GET | `/api/organizations/search?q=` | Recherche d'organismes |
| GET | `/api/budgets?fiscalYear=` | Budgets par année |
| GET | `/api/budgets/overruns` | Dépassements budgétaires |
| GET | `/api/search?q=` | Recherche unifiée |
| GET | `/api/dashboard/summary` | Résumé tableau de bord |
| GET | `/api/dashboard/red-flags` | Drapeaux rouges |

## Rapports générés

- `rapport_audit_finances_quebec.md` — Audit complet en 10 étapes
  - Revenus (166,5 G$ en 2026-2027)
  - Dépenses par ministère (Santé: 68,7 G$)
  - Drapeaux rouges (14 détectés, 3 critiques)
  - Analyse des sociétés d'État
  - Répartition de 10 000 $ par contribuable
  - Scores d'efficacité (moyenne: 57/100)
  - 9 recommandations

## Licence

MIT — Données publiques. Transparence citoyenne.
