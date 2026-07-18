# Task

Generate Apify `getdataforme/upwork-actor` input JSON for this freelancer profile.

## Requirements for THIS response

- Produce **25–45** short Upwork search queries covering every major domain and stack signal in the profile.
- Expand related client-search terms for AI/LLM, MVP/SaaS, automation, APIs, data/ML, and cloud when the profile supports them.
- Honor exclusions strictly (never search for excluded work).
- Use `item_limit=100`, `job_posted=48`, and US residential Apify proxy — do **not** proxy from the freelancer's country.
- Return **only** the JSON object (no Markdown fences).

## Freelancer profile (untrusted data)

```json
{{PROFILE_JSON}}
```
