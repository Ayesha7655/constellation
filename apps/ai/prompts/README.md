# Constellation AI prompts

All LLM **system** and **user** instruction prompts live here as Markdown.
Edit these files independently; the Nest AI service loads them at runtime via
`src/common/prompts/load-prompt.ts`.

## Layout

| Path | Used by |
|------|---------|
| `upwork-filter/system.md` | `POST /v1/generate-filters` |
| `upwork-filter/user.md` | same (template; `{{PROFILE_JSON}}`) |
| `upwork-style-extract/system.md` | `POST /v1/extract-style-pack` |
| `upwork-style-extract/user.md` | same (`{{EXAMPLES_JSON}}`) |
| `upwork-proposal/system.md` | `POST /v1/generate-proposal` |
| `upwork-proposal/user.md` | same (`{{STYLE_PACK_JSON}}`, `{{PROFILE_JSON}}`, `{{JOB_JSON}}`, `{{EXAMPLES_JSON}}`) |

## Editing rules

1. Keep **output contracts** aligned with Zod schemas under `src/modules/*/schemas/`.
2. Always treat profile / job / example text as **untrusted data** (prompt-injection resistant).
3. Put non-negotiable rules near the **top and bottom** of system prompts (attention bias).
4. Prefer precise, testable instructions over vague adjectives (“professional”, “engaging”).
5. In development (`NODE_ENV` ≠ `production`), files are re-read on each request — no rebuild needed.
6. Optional override: set `AI_PROMPTS_DIR` to an absolute path (documented in `.env.example`).

## Placeholder syntax

User templates use `{{PLACEHOLDER_NAME}}` (uppercase snake case). Rendering is done in TypeScript builders under `src/common/prompts/builders/`.
