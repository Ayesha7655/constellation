# Constellation v1 — Design

**Date:** 2026-07-11  
**Status:** Implemented (v1 scaffold)  
**Repo:** `constellation` (renamed from `sequelize-project`)

## Summary

Constellation is a pnpm/turbo monorepo forked in shape from Constellation (Next.js frontend + NestJS backend + shared package), with **Prisma replaced by sequelize-typescript**. v1 ships Firebase auth, Resend transactional email, JWT sessions, RBAC with three roles, organizations (auto-created on signup), org profile completion gate, and a public home page that health-checks the API.

## Decisions

| Topic | Decision |
|-------|----------|
| Identity | Firebase (client) → Nest verifies ID token → app JWTs |
| Email | Resend (forgot password, email verification) |
| ORM | sequelize-typescript + SQL migrations (no Prisma / no codegen) |
| Scaffold | Fork-shape from Constellation — strip domains, rename packages |
| Package scope | `@constellation/*` (not `@constellation/*`) |
| Default signup role | `org-admin` |
| Organizations | In schema from day one; auto-create on signup |
| Org profile | If name/address missing → complete-profile UI before dashboard |
| Redis | **DB-only in v1** — no Redis auth/RBAC cache |
| Google OAuth | **Include** on sign-in/sign-up (email/password also required) |

## Monorepo layout

```
constellation/
├── apps/
│   ├── frontend/     # Next.js — Tailwind, Formik+Zod, tweakcn themes
│   └── backend/      # NestJS — sequelize-typescript, class-validator, OpenAPI
├── packages/
│   └── shared/       # @constellation/shared — codes, roles, UI
├── docs/superpowers/specs/
├── pnpm-workspace.yaml
├── turbo.json
└── tsconfig.base.json
```

**Ports (defaults):** frontend `4000`, backend `4050`, API prefix `/api`.

## Roles & permissions

Three primary roles (stable `key` PKs, Constellation-style):

| Role key | How obtained |
|----------|----------------|
| `super-admin` | Seeded only (`pnpm db:seed`) |
| `org-admin` | Default on every self-serve signup |
| `user` | Later — created by org-admin under their org (out of v1 UI) |

- Tables: `roles`, `permissions`, `role_permissions`, `user_roles`
- Permission catalog patterned after Constellation (additive seeds, keys from `@constellation/shared`)
- Slim grant matrix for the three roles in v1 (platform/admin + org basics)
- Enforcement: global `JwtAuthGuard` + `PermissionsGuard` + `@RequirePermissions` / `@RequireAnyPermissions`
- JWT `role` claim = session active role (same contract as Constellation); switch-role UI deferred

## Organizations

- Table: `organizations` (`id` UUID PK, `name`, `address`, timestamps, soft-delete as needed)
- `users.org_id` FK (nullable for `super-admin`)
- On first successful Firebase → Nest login for a **new** password/Google user:
  1. Create organization with placeholder fields (`name`/`address` null or empty)
  2. Create user with `primary_role_key = org-admin`, `org_id` set, `user_roles` row
- Gate: if authenticated user’s org lacks required profile fields → redirect to `/onboarding/org` (name + address) before dashboard
- Org-admin creating subordinate `user` accounts: **schema-ready, UI deferred**

## Auth flows (v1)

### Backend (`/api/auth/*`)

| Endpoint | Purpose |
|----------|---------|
| `POST /auth/firebase` | Verify Firebase ID token, upsert user/org, issue JWT pair |
| `POST /auth/refresh` | Rotate access token via refresh + session |
| `POST /auth/logout` | Revoke session |
| `POST /auth/forgot-password` | Rate-limited; Resend reset link (no email enumeration) |
| `POST /auth/reset-password` | Apply OOB code; revoke all sessions for user |
| `POST /auth/send-verification` | Resend verification email |
| `POST /auth/verify-email` | Apply verification OOB; sync `email_verified_at` |
| `POST /auth/change-password` | JWT; Firebase current-password check |
| `GET /auth/sessions` | List active sessions |
| `POST /auth/sessions/revoke` | Revoke selected sessions |

Also: `GET /api/health` (DB `SELECT 1` via Sequelize), `GET /api/users/me` (profile + roles + permissions + org completion flag).

### Frontend routes

| Route | Notes |
|-------|-------|
| `/` | Public home — API connection health badge |
| `/sign-in` | Formik + Zod + Firebase |
| `/sign-up` | Formik + Zod + Firebase; then verification flow |
| `/forgot-password` | → backend → Resend |
| `/reset-password` | OOB from URL |
| `/verify-email` | OOB from URL |
| `/onboarding/org` | Org name + address; required when incomplete |
| Dashboard shell | Minimal post-onboarding landing (no domain modules) |

Shared patterns from Constellation: `x-device-id`, `x-locale` (keep i18n wiring), Formik+Zod, toasts, `TEST_IDS`, coded auth errors via `@constellation/shared`.

## Data model (auth-relevant)

| Model | Notes |
|-------|-------|
| `Organization` | UUID PK; `name`, `address` (nullable until onboarding) |
| `User` | UUID PK; email; `firebase_uid`; `auth_provider`; `email_verified_at`; `status`; `primary_role_key`; `org_id`; soft-delete |
| `UserRole` | `(user_id, role_key)` |
| `Role` | `key` text PK; `display_name` JSONB `{en, ar?}` |
| `Permission` / `RolePermission` | Constellation-style catalog; additive SQL seeds |
| `UserSession` | refresh hash, JTI, `device_id`, platform, `active_role_key`, revoke metadata |

Migrations: SQL under `apps/backend/src/database/migrations/` — **two forward migrations per feature** (schema then seed) per project rules. Models: sequelize-typescript under `apps/backend/src/database/models/`.

## Explicitly out of v1 UI / product scope

- Org-admin inviting/creating `user` accounts
- Multi-dashboard / `switch-role` UX
- Domain catalogs (listings, inspections, etc.)
- Full Constellation permission surface (only what auth + org shell need)

## Env (user-provided)

**Backend:** `DATABASE_URL`, `JWT_*`, `REFRESH_TOKEN_*`, `FIREBASE_*`, `FIREBASE_WEB_API_KEY`, `WEB_URL`, `RESEND_API_KEY`, `RESEND_FROM_EMAIL`  
**Frontend:** `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_FIREBASE_*`

Document every var in `apps/*/.env.example` in the same change that introduces it.

## Implementation phases (high level)

1. Rename workspace → constellation; Cursor rules stay; this spec in docs
2. Scaffold monorepo from Constellation (strip domains; rename packages)
3. Sequelize bootstrap: Nest `SequelizeModule`, models, migrations, `db:migrate` / `db:reset` / `db:seed`
4. Port auth/session/firebase/email/permissions/health with Sequelize
5. Seed roles/permissions + super-admin seeder
6. Frontend auth pages + home health + org onboarding gate
7. Wire `.env.example`; smoke-test login / signup / forgot / health

## Open points for the implementation plan

- ~~Redis auth cache: include in v1 vs DB-only~~ → **DB-only** (no Redis in v1)
- ~~Exact permission key list for the three roles~~ → derive slim `platform.*` / `org.*` / `admin.*` matrix at implementation (reference: Constellation permission pattern)
- ~~Whether Google sign-in button ships in first UI cut~~ → **yes**, include Google on sign-in/sign-up
