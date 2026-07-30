# Proposal writer agent

Writes the freelancer's Upwork proposal body.

## Endpoint

`POST /v1/generate-proposal` (internal key required)

## Inputs

- proposal style pack
- freelancer profile
- Upwork job
- retrieved example proposals

Portfolio projects are deliberately **not** part of this agent's context. Portfolio selection and explanation are
owned by the separate portfolio relevance finder.

## Output

```json
{ "body": "Plain-text proposal draft" }
```

The OpenAI output is validated by `schemas/upwork-proposal.schema.ts`. Missing configuration or invalid model
output uses the deterministic proposal fallback; provider transport/auth/rate-limit failures propagate.

Prompts: `apps/ai/prompts/upwork-proposal/`.
