# Upwork Scraper — Modules & Plan

**Date:** 2026-07-14  
**Status:** Proposed  
**Constraint:** DB-only scheduling (no Redis/Bull in v1)

## Goal

Attach a freelancer profile → AI builds Apify search filters → scrape recent Upwork jobs → score vs profile → store results. Runs on a schedule and via a dashboard **Run now** button.

## Sub-plans

| Plan | Doc | Summary |
|------|-----|---------|
| **1** | [plan-1-extension-profile-filters](./2026-07-14-plan-1-extension-profile-filters.md) | Extension connect/sync, org-scoped profile import, generate + org-admin edit/save Apify filters |
| **2** | [plan-2-apify-scoring-dashboard](./2026-07-14-plan-2-apify-scoring-dashboard.md) | Apify search runs, ingest jobs, algorithmic relevancy score, results dashboard |

## Recommended approaches

| Area | Decision | Why |
|------|----------|-----|
| Profile sync | **Structured profile form** + **Chrome extension** (logged-in Upwork → API) | Extension sees your session data Apify can’t; form remains source of truth |
| Job discovery | **Apify** job-search actor (schedule + Run now) | True background runs; extension is a poor fit for unattended search |
| Apify filters | **LLM → draft filter JSON** (user can edit/save) | Profile → keywords/categories/budget/exclusions; human override |
| Relevancy | **Hybrid:** cheap rules/embeddings first, **LLM score + rationale** on top ~N | Fast for volume; LLM for nuance |
| Scheduling | **DB schedule fields** + Nest `@Cron` poller | No Redis; single-instance OK for v1 |
| Job runs | **`scrape_runs`** + async Nest worker | Track Apify run IDs, status, errors |

## Flows

### A — Profile sync (Chrome extension)

```
Login to Upwork in Chrome
  → Open profile (or click Sync in extension)
  → Extension scrapes DOM / page JSON you’re allowed to see
  → POST /api/freelancer-profile/import  (Bearer JWT)
  → Backend maps → profile draft
  → Dashboard preview → user edits → Save
  → Saved profile feeds Filter AI + Scoring
```

- Auth: extension stores app JWT (or short-lived import token from dashboard “Connect extension”).
- Nothing auto-overwrites saved profile without confirm (first sync can soft-fill empties only if we choose).
- Re-sync anytime = new draft overlay, then confirm.

### B — Job scrape pipeline (Apify)

```
Saved profile
  → Filter AI (LLM) → saved search filters (editable)
  → Trigger: schedule tick OR dashboard “Run now”
  → Apify job actor → raw jobs
  → Score engine (rules/embed → LLM top-N)
  → upwork_jobs feed (score, rationale, link)
```

### C — Optional later: extension “save this job page”

Same import API shape, different payload type (`job` vs `profile`) — not required for v1 of scheduling.

## Split of responsibilities

| Concern | Owner |
|---------|--------|
| Bootstrap / refresh **my** profile | Chrome extension → Constellation API |
| Edit profile, schedule, filters, Run now, job feed | Web dashboard |
| Background / scheduled **job search** | Apify + Nest |
| Scoring & filter generation | Nest + LLM |

## Modules

### 1. Freelancer profile (`freelancer-profile`)
- Fields: title, bio/summary, skills[], niches[], rate range, languages, exclusions; `source` (`manual` | `extension`)
- Actions: save, **Import from extension** (API), dashboard preview/confirm
- Schedule prefs: frequency (`manual` | `hourly` | `every_6h` | `daily` | `custom cron`), timezone, `enabled`

### 2. Chrome extension (`apps/extension` or separate package)
- Content script on `*.upwork.com` profile (and later job) pages
- Popup: status, last sync, **Sync profile now**
- Talks only to Constellation API (no direct DB)
- Packaging: Chrome MV3; install instructions in dashboard

### 3. Search filters (`search-filters`)
- Persist Apify actor input JSON
- **Generate with AI** from profile → preview → save
- Manual edit anytime; regenerate with confirm

### 4. Apify runner (`scraping`)
- Trigger: cron **or** `POST /scrape-runs`
- Actor run + ingest into `upwork_jobs` (dedupe by Upwork job id)
- Env: `APIFY_TOKEN`, job actor id

### 5. Relevancy engine (`scoring`)
- Pass 1: skill/keyword/budget heuristics (and/or embeddings)
- Pass 2: LLM 0–100 + short rationale for top N
- Store: `relevancy_score`, `relevancy_rationale`, `scored_at`

### 6. Dashboard UI
- Profile form + “Install / connect extension” help
- Filters panel; **Run now**; job feed by score/date
- Import preview modal when extension posts a draft

### 7. Scheduler (`jobs-scheduler`)
- Cron: due profiles → same pipeline as Run now
- Update `last_run_at` / `next_run_at`

## Data (sketch)

| Table | Purpose |
|-------|---------|
| `freelancer_profiles` | Profile + schedule prefs |
| `profile_import_drafts` | Pending extension payloads awaiting confirm (optional; or hold in memory/session) |
| `search_filter_sets` | Apify input JSON (`ai` / `manual`) |
| `scrape_runs` | Run lifecycle, Apify run id, trigger |
| `upwork_jobs` | Deduped jobs + scores |

## API (sketch)

| Method | Path | Notes |
|--------|------|-------|
| GET/PATCH | `/freelancer-profile` | Profile + schedule |
| POST | `/freelancer-profile/import` | Extension payload → draft / merge |
| POST | `/freelancer-profile/import/:id/confirm` | Accept draft into saved profile |
| GET/PUT | `/search-filters` | Saved filters |
| POST | `/search-filters/generate` | LLM from profile |
| POST | `/scrape-runs` | Run now |
| GET | `/scrape-runs` / `:id` | Status |
| GET | `/upwork-jobs` | Paginated feed |

## Development plan

1. **Schema + profile CRUD** — migrations, models, form UI, schedule fields  
2. **Extension + import API** — MV3 scrapers profile page → `POST /import` → preview → confirm  
3. **Apify smoke** — job actor, Run now, store raw jobs (no AI yet)  
4. **Filter AI** — generate + save + pass into actor  
5. **Scoring** — rules first, then LLM score/rationale  
6. **Scheduler + feed UX** — cron, disable Run now while active, job list  
7. **Polish** — extension connect token, install docs, optional “save job from page”

## Out of scope (this feature v1)

- Upwork OAuth / auto-apply  
- Apify for profile sync (superseded by extension)  
- Extension-driven scheduled scraping (browser must stay open — rejected)  
- Redis queues / multi-instance workers  
- Proposal auto-writing (phase 2)

## Open choices (confirm before build)

1. **Scope of profile:** per-user vs per-org?  
2. **Apify job actor:** which one + input schema?  
3. **LLM provider:** OpenAI / Anthropic / other?  
4. **Score threshold:** hide jobs below X by default?  
5. **Extension auth:** long-lived JWT in extension vs one-time pairing code from dashboard?
