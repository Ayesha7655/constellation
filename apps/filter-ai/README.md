# Filter AI

Internal NestJS microservice for generating validated Apify Upwork search filters. The backend remains the only
consumer; this service is not exposed directly to the frontend or extension.

## Run

```bash
cp apps/filter-ai/.env.example apps/filter-ai/.env
pnpm --filter filter-ai dev
```

The backend must use the same `FILTER_AI_INTERNAL_KEY` and point `FILTER_AI_URL` to this service.

## HTTP contract

- `GET /health` — unauthenticated process health
- `POST /v1/generate-filters` — requires `x-internal-key`

The request and response contracts are shared through `@constellation/shared`.

## Structure

- `common/guards` — internal service authentication
- `health` — health endpoint
- `modules/filter-generation/dto` — runtime request validation
- `modules/filter-generation/prompts` — versionable system and user prompt builders
- `modules/filter-generation/schemas` — model-output validation
- `modules/filter-generation/providers` — OpenAI integration
- `modules/filter-generation/fallbacks` — deterministic fallback behavior
- `filter-generation.service.ts` — provider/fallback orchestration

Prompt copy stays separate from transport and provider code so prompts can be reviewed, tested, and versioned
without changing the endpoint. Model output is never trusted directly: it must pass the schema or the service
returns deterministic fallback filters.
