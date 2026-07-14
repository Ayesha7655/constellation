# Plan 1 — Extension, Profile Import & Search Filters

**Date:** 2026-07-14  
**Status:** In progress (scaffold landed)  
**Depends on:** Auth + organizations (v1 shell)  
**Owns:** Chrome extension, org-scoped profile, Apify filter generate/edit/save  
**Does not own:** Apify job runs, scoring, job feed (→ Plan 2)

## Goal

Org admin connects a Chrome extension, syncs their logged-in Upwork profile into the **organization**, then generates and curates Apify search filters from that profile.

## Locked decisions

| Topic | Decision |
|-------|----------|
| Profile scope | Per **organization** (`org_id`) |
| Extension auth | **One-click connect** from dashboard via `externally_connectable` when extension is installed; **6-digit pairing code** fallback (large UI, copy, ~10 min TTL) — never ask users to paste JWTs |
| Filter AI | Separate Node microservice (`apps/filter-ai`) using **ChatGPT**; Nest proxies authenticated generate calls |
| Apify filter target | [`blackfalcondata/upwork-scraper`](https://apify.com/blackfalcondata/upwork-scraper) input shape (`query`, `jobType`, `experienceLevel`, `budget`/`hourlyRate`, `location`, `maxResults`, `sort`, …) |
| Permissions | `org.freelancer_profile.read/update`, `org.search_filters.read/update` → `org-admin` |
| API prefix | `/organizations/me/...` (matches existing orgs surface) |

## Auth UX (seamless)

```
Install extension → Dashboard “Connect Chrome extension”
  → If extension detected: one click pushes short-lived extension session token
  → Else: show 6-digit code + “Open extension → paste code”
Extension stores opaque extension session (not raw user refresh token ideal; or scoped access token)
  → Validates with GET /users/me
```

## Flows

### Sync profile

```
Upwork profile page → Extension Sync
  → POST /organizations/me/freelancer-profile/import
  → Draft → dashboard confirm → saved org profile
```

### Filters

```
Saved profile → POST …/search-filters/generate
  → Nest → filter-ai microservice (ChatGPT) → Apify input JSON
  → Org-admin edits → PUT …/search-filters
```

## Modules

1. Chrome extension (MV3)  
2. Org freelancer profile API  
3. Search filters API + `apps/filter-ai`  
4. Dashboard UI  

## Data

| Table | Notes |
|-------|--------|
| `freelancer_profiles` | `org_id` unique; title, overview, skills, rates, country, timezone, languages, exclusions, profile_url, source |
| `profile_import_drafts` | Pending extension payload per org |
| `search_filter_sets` | `org_id` unique; actor id + input JSON; provenance |
| `extension_pairing_codes` | code hash, org_id, user_id, expires_at, consumed_at |

## Build order

1. Schema + permissions  
2. Profile CRUD + dashboard  
3. Import + confirm  
4. Extension connect + sync  
5. filter-ai microservice + generate  
6. Filter editor + save  

## Done when

- [ ] One-click or pairing-code connect works  
- [ ] Sync → org profile by `org_id`  
- [ ] Generate produces editable Apify JSON for `blackfalcondata/upwork-scraper`  
- [ ] Org-admin can edit/save filters  
- [ ] Permission gates enforced  
