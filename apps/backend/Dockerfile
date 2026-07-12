# Constellation backend — container image (build from monorepo root)
#
#   docker build -f apps/backend/Dockerfile -t constellation-backend .
#
# Migrations: run on release (CI or one-off task), not at container start:
#   pnpm --filter backend db:migrate
# Requires DATABASE_URL.

FROM node:22-bookworm-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
WORKDIR /app

FROM base AS build
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json tsconfig.base.json ./
COPY packages/shared packages/shared
COPY apps/backend apps/backend
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @constellation/shared build
RUN pnpm --filter backend build
RUN pnpm deploy --filter=backend --prod --legacy /prod/backend

FROM base AS production
ENV NODE_ENV=production
WORKDIR /app

RUN mkdir -p certs
COPY certs/global-bundle.pem ./certs/global-bundle.pem

COPY --from=build /prod/backend ./

USER node
EXPOSE 4050

HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:' + (process.env.PORT || 4050) + '/api/health').then((r) => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

CMD ["node", "dist/src/main.js"]
