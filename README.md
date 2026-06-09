# Job Tracker IA (JTK)

Application SaaS de suivi de candidatures basée sur l'analyse des emails.

## Prérequis

- Node.js 20+
- pnpm 10+
- Docker (PostgreSQL)
- Ollama (classification locale, commits 12+)

## Démarrage rapide

```bash
pnpm install
pnpm nx serve api   # http://localhost:3001
pnpm nx serve web   # http://localhost:3000
```

## Structure

```
apps/
  web/   # Next.js frontend
  api/   # Express backend
libs/
  shared/types/  # Types partagés
  database/      # Prisma client
  events/        # Event bus interne
```

## Tests

```bash
pnpm test
```

## Repository

`git@github.com:Florent-Desallangre/JTK.git`

Voir [DEPLOY.md](./DEPLOY.md) pour le déploiement production.
