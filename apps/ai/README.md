# Constellation AI service

Internal NestJS microservice for AI-backed Upwork helpers (filter generation, proposal generation, style extraction).
The backend is the only caller.

```bash
cp apps/ai/.env.example apps/ai/.env
pnpm --filter ai dev
```

The backend must use the same `AI_SERVICE_INTERNAL_KEY` and point `AI_SERVICE_URL` to this service (default `http://localhost:4060`).

## Prompts

All LLM system/user prompts live as editable Markdown under [`prompts/`](./prompts/README.md).
Providers load them at runtime (no rebuild needed in development). Optional override: `AI_PROMPTS_DIR`.

## Endpoints

- `GET /health` — liveness (unauthenticated)
- `POST /v1/generate-filters` — requires `x-internal-key`
- `POST /v1/generate-proposal` — requires `x-internal-key`
- `POST /v1/extract-style-pack` — requires `x-internal-key`; builds style preferences from example proposals
