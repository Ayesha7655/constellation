# Constellation

pnpm/turbo monorepo — Next.js frontend + NestJS backend (sequelize-typescript) + `@constellation/shared`.

**v1:** Firebase auth (email + Google), JWT sessions, Resend email, RBAC (`super-admin`, `org-admin`, `user`), organizations with profile onboarding gate, public home with API health check.

## Quick start

```bash
pnpm install
cp apps/backend/.env.example apps/backend/.env
cp apps/frontend/.env.example apps/frontend/.env.local
# Fill Firebase, JWT, Resend, DATABASE_URL

pnpm db:reset          # dev only — destructive
pnpm db:seed           # super-admin + migrations
pnpm dev               # frontend :4000, backend :4050
```

- API health: `http://localhost:4050/api/health`
- Swagger (non-prod): `http://localhost:4050/api/docs`

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Run frontend + backend |
| `pnpm typecheck` | TypeScript all packages |
| `pnpm build` | Production build |
| `pnpm db:migrate` | Apply SQL migrations |
| `pnpm db:reset` | Drop schema + migrate (dev) |
| `pnpm db:seed` | Reset DB + seed super-admin |

## Layout

```
apps/frontend     Next.js 16, Formik+Zod, tweakcn themes
apps/backend      NestJS, sequelize-typescript, OpenAPI
packages/shared   UI primitives, auth codes, permission keys, test ids
docs/superpowers/specs/2026-07-11-constellation-v1-design.md
```

## Docker (optional)

```bash
docker compose --profile setup run --rm migrate
docker compose up --build
```

Postgres exposed on host port `5433`.
