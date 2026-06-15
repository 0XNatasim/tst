# OpenQuebec.ai

**Plateforme citoyenne de transparence des finances publiques du Québec.**

Suivez chaque dollar public, de la collecte jusqu'au bénéficiaire final.

---

## Mise en route — Supabase + Vercel (5 minutes)

### 1. Créer Supabase

- Va sur [supabase.com](https://supabase.com) → **New project**
- Note la **Database password** (celle que tu choisis)
- Une fois créé, va dans **Project Settings → Database → Connection string**

### 2. Lier à Vercel

- Va sur [vercel.com/new](https://vercel.com/new) → Importe ce dépôt GitHub
- Dans **Environment Variables**, ajoute :

| Variable | Valeur |
|----------|--------|
| `DATABASE_URL` | `postgresql://postgres.[PROJECT]:[PASSWORD]@[REGION].pooler.supabase.co:6543/postgres` |

- Remplace `[PROJECT]`, `[PASSWORD]`, `[REGION]` par les valeurs de Supabase → **Connection string (Session pooler)**

### 3. Lancer les migrations

Une fois déployé, ouvre un terminal et :

```bash
pnpm db:push
pnpm tsx scripts/seed.ts
```

**Terminé.** L'app est en ligne sur `https://tst.vercel.app`.

### Cron (optionnel)

Le crawler automatique est configuré dans `vercel.json` (chaque lundi 6h). Active-le dans Vercel Dashboard → **Cron Jobs**.

---

## Stack

- **Frontend** : Next.js 15 + React 19 + Tailwind 4 + Recharts
- **API** : Next.js Route Handlers (serverless)
- **DB** : PostgreSQL Supabase + Drizzle ORM + pgvector
- **Crawlers** : Vercel Cron Jobs + Playwright
- **AI** : OpenAI / Claude

## Structure

```
apps/web/
├── src/app/
│   ├── page.tsx              # Dashboard
│   ├── explorer/page.tsx     # Recherche
│   ├── contrats/page.tsx     # Contrats
│   ├── budgets/page.tsx      # Budgets + graphiques
│   ├── rapports/page.tsx     # Rapports d'audit
│   └── api/                  # 13 endpoints serverless
packages/
├── db/         # Schéma Drizzle
├── shared/     # Types
├── crawlers/   # Ingestion données
└── ai/         # Agents d'analyse
```

## API

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

## Licence MIT
