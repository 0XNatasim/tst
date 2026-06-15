# OpenQuebec.ai

**Plateforme citoyenne de transparence des finances publiques du Québec.**

Suivez chaque dollar public, de la collecte jusqu'au bénéficiaire final.

## Stack

```
Frontend  : Next.js 15 + React 19 + Tailwind 4 + Recharts
API       : Next.js Route Handlers (API routes)
Database  : PostgreSQL 17 + Drizzle ORM + pgvector
Hosting   : Vercel (frontend + API serverless)
DB Host   : Supabase (PostgreSQL serverless + auth + realtime)
Crawlers  : Vercel Cron Jobs + Playwright
AI        : OpenAI / Claude
```

## Structure

```
openquebec/
├── apps/web/
│   ├── src/app/
│   │   ├── page.tsx              # Dashboard
│   │   ├── explorer/page.tsx     # Recherche
│   │   ├── contrats/page.tsx     # Contrats
│   │   ├── budgets/page.tsx      # Budgets
│   │   ├── rapports/page.tsx     # Rapports
│   │   └── api/                  # API routes (serverless)
│   └── src/components/
├── packages/
│   ├── db/         # Drizzle schema + client
│   ├── shared/     # Types
│   ├── crawlers/   # Moteur d'ingestion
│   └── ai/         # Agents d'analyse
├── scripts/
├── rapport_audit_finances_quebec.md
├── vercel.json
└── docker-compose.yml
```

## Déploiement Vercel

### 1. Base de données (Supabase — gratuit)

```bash
# Option A : Supabase local
pnpm supabase:start
# DATABASE_URL = postgresql://postgres:postgres@localhost:54322/postgres

# Option B : Supabase cloud (production)
# 1. https://supabase.com → New project
# 2. Settings → Database → Connection pooler (port 6543)
#    DATABASE_URL = postgresql://postgres.[PROJECT]:[PASSWORD]@[REGION].pooler.supabase.co:6543/postgres
```

### 2. Variables d'environnement

Dans Vercel Dashboard → **Project Settings → Environment Variables** :

| Variable | Valeur |
|----------|--------|
| `DATABASE_URL` | Connection string Neon |

### 3. Déploiement

```bash
# Installer Vercel CLI
pnpm add -g vercel

# Lier et déployer
vercel link
vercel --prod
```

Ou connecter le dépôt GitHub directement sur [vercel.com/new](https://vercel.com/new).

### 4. Migrations DB

```bash
# Après déploiement, lancer les migrations une fois :
pnpm db:push
pnpm tsx scripts/seed.ts
```

### 5. Cron (crawler automatique)

Configuré dans `vercel.json` — s'exécute chaque lundi à 6h. Nécessite d'activer les Cron Jobs dans Vercel Dashboard.

## API (toutes serverless)

| Route | Description |
|-------|-------------|
| `GET /api/ministries` | Tous les ministères |
| `GET /api/ministries/[id]` | Détail d'un ministère |
| `GET /api/ministries/budgets/comparison?fiscalYear=` | Budget vs réel |
| `GET /api/contracts` | Contrats (paginés) |
| `GET /api/contracts/top` | Top contrats |
| `GET /api/contracts/sole-source` | Source unique |
| `GET /api/contracts/stats` | Statistiques |
| `GET /api/organizations?q=&type=` | Organismes et recherche |
| `GET /api/budgets?fiscalYear=` | Budgets |
| `GET /api/budgets/overruns` | Dépassements |
| `GET /api/search?q=` | Recherche unifiée |
| `GET /api/dashboard/summary` | Résumé |
| `GET /api/dashboard/red-flags` | Drapeaux rouges |

## Développement local

```bash
pnpm install
cp .env.example .env
# Démarrer Supabase local
pnpm supabase:start
# Lancer les migrations + seed
pnpm db:push
pnpm tsx scripts/seed.ts
pnpm dev                  # → http://localhost:3000
```

## Licence

MIT
