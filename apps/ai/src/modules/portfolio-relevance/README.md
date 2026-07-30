# Portfolio relevance finder agent

Selects saved portfolio projects that are genuinely relevant to the Upwork job and explains the mapping in one
short sentence per project.

## Endpoint

`POST /v1/find-relevant-portfolio` (internal key required)

## Inputs

- Upwork job
- up to 50 saved portfolio candidates with stable IDs, project facts, technologies, and stored links

## Output

```json
{
  "matches": [
    {
      "portfolioProjectId": "00000000-0000-0000-0000-000000000000",
      "relevance": "Built with the same automation stack needed for this workflow."
    }
  ]
}
```

The agent returns zero to three stable IDs and concise explanations. It never returns links: the backend resolves
the selected IDs back to trusted database rows and appends their exact stored URLs.

The OpenAI output is validated by `schemas/portfolio-relevance.schema.ts`, then checked against candidate IDs.
Missing configuration or invalid model output uses the deterministic overlap-based fallback; provider
transport/auth/rate-limit failures propagate.

Prompts: `apps/ai/prompts/upwork-portfolio-relevance/`.

## Composition

The backend runs this workflow and the proposal writer concurrently. It then appends a deterministic
`Relevant portfolio:` section containing title, generated mapping, and trusted link to the proposal body.
