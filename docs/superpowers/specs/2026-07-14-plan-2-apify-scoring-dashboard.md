# Plan 2 — Apify Search, Scoring & Results Dashboard

**Date:** 2026-07-14  
**Status:** Proposed  
**Depends on:** Plan 1 (org profile + **saved** search filters)  
**Owns:** Apify runs, job ingest, algorithmic relevancy, results UI  
**Does not own:** Extension, profile import, filter generation UI (← Plan 1)

## Goal

Run Upwork job search via Apify using the org’s saved filters, store results, score each job against the org profile with a **simple algorithm** (no LLM scoring for now), and show them on a dashboard.

## Scope

| In | Out |
|----|-----|
| Trigger search from saved filters (Run now; schedule optional later) | Extension / profile sync |
| Apify actor run + poll/webhook until done | Filter AI / filter edit UI |
| Persist jobs keyed by org + Upwork job id | LLM relevancy / rationale |
| Algorithmic relevancy score vs org profile | Auto-apply / proposals |
| Dashboard list with score | |

## Flows

### 1. Run search

```
Org-admin clicks “Run now” (or cron later)
  → POST /orgs/me/scrape-runs
  → Load saved search_filter_sets for org
  → Start Apify actor with that input
  → scrape_runs: queued → running → succeeded|failed
  → Fetch dataset → upsert upwork_jobs
  → Score each job vs freelancer_profiles
  → Dashboard refresh
```

### 2. Score (algorithm v1 — keep simple)

Inputs: org profile (skills, title tokens, niches, rate range, exclusions) + job (title, description, skills, budget).

Suggested formula (tunable weights):

| Signal | Idea |
|--------|------|
| Skill overlap | `|job.skills ∩ profile.skills| / |profile.skills|` |
| Title/keyword hit | Token overlap of profile title/niches vs job title+desc |
| Budget fit | Soft boost if job budget/rate overlaps profile range |
| Exclusions | Hard zero / heavy penalty if excluded keywords match |

Normalize to **0–100**. Store `relevancy_score` only (no LLM rationale in this plan).

### 3. View results

```
Dashboard → Jobs table
  Columns: title, budget, score, scraped_at, Upwork link
  Sort: score desc (default), or date
  Filter: min score, search q
```

## Modules

1. **Apify client** — start run, wait/poll, read dataset; env `APIFY_TOKEN`, actor id  
2. **Scrape runs** — create/list/get status; one active run per org (optional guard)  
3. **Job ingest** — map actor fields → `upwork_jobs`; dedupe on `(org_id, external_job_id)`  
4. **Scoring service** — pure function profile + job → score; run after ingest  
5. **Dashboard** — Run now, run status, paginated results + score  

## Data

| Table | Notes |
|-------|--------|
| `scrape_runs` | `org_id`, status, `apify_run_id`, trigger (`manual`/`schedule`), error, timestamps |
| `upwork_jobs` | `org_id`, `external_job_id`, title, description, skills, budget fields, url, `relevancy_score`, `scrape_run_id`, timestamps |

## API (sketch)

| Method | Path | Who |
|--------|------|-----|
| POST | `/orgs/me/scrape-runs` | Org-admin — Run now |
| GET | `/orgs/me/scrape-runs` | List recent runs |
| GET | `/orgs/me/scrape-runs/:id` | Status |
| GET | `/orgs/me/upwork-jobs` | Paginated; `minScore`, `q`, sort |

## Build order

1. Schema: `scrape_runs`, `upwork_jobs` + permissions  
2. Apify smoke: Run now with saved filters → store raw jobs (score = 0)  
3. Scoring algorithm + backfill on ingest  
4. Dashboard: Run now + status + results table (score, sort, min score)  
5. (Optional stretch) Nest cron using Plan 1 schedule prefs  

## Done when

- [ ] Run now starts Apify with org saved filters  
- [ ] Jobs land in DB deduped per org  
- [ ] Each job has an algorithmic `relevancy_score`  
- [ ] Dashboard shows results sorted by score  
- [ ] Failed Apify runs surface status/error without hanging UI  

## Open choices

1. Which Apify **job search** actor + field mapping  
2. Exact weight table for the scoring formula  
3. Schedule in this plan or defer to a follow-up  
4. Re-score on profile change: auto vs manual button
