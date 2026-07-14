# Plan 1 — Extension, Profile Import & Search Filters

**Date:** 2026-07-14  
**Status:** Proposed  
**Depends on:** Auth + organizations (v1 shell)  
**Owns:** Chrome extension, org-scoped profile, Apify filter generate/edit/save  
**Does not own:** Apify job runs, scoring, job feed (→ Plan 2)

## Goal

Org admin connects a Chrome extension, syncs their logged-in Upwork profile into the **organization**, then generates and curates Apify search filters from that profile.

## Scope

| In | Out |
|----|-----|
| Extension login/connect to Constellation | Apify actor execution |
| Sync profile from Upwork page (logged-in DOM) | Relevancy scoring |
| Import profile attached by `org_id` | Job results dashboard |
| LLM (or rules) → draft Apify filters | Scheduled scraping |
| Org-admin edit + save filters | |

## Authority

- Profile + filters are **per organization** (`org_id` FK).
- Only **org-admin** (and super-admin as needed) can import, edit profile, generate/edit/save filters.
- Extension calls JWT-protected APIs; backend enforces org membership + permission.

## Flows

### 1. Connect extension

```
Dashboard → “Connect extension” → pairing code / paste JWT
  → Extension stores credential
  → Extension validates via GET /api/users/me (or lightweight ping)
```

### 2. Sync Upwork profile

```
User logged into Upwork → open profile page
  → Extension “Sync profile”
  → Scrape visible profile fields
  → POST /api/orgs/:orgId/freelancer-profile/import
  → Draft stored → dashboard preview
  → Org-admin confirms → saved org profile
```

### 3. Filters from profile

```
Saved org profile
  → POST …/search-filters/generate  (LLM/rules → Apify input JSON)
  → Preview in dashboard
  → Org-admin edits → PUT …/search-filters  (save)
```

Saved filters are the handoff artifact for Plan 2.

## Modules

1. **Chrome extension (MV3)** — connect UI, content script on Upwork profile, Sync action  
2. **Org freelancer profile API** — import draft, confirm, GET/PATCH profile (`org_id`)  
3. **Search filters API** — generate, GET, PUT; permission-gated to org-admin  
4. **Dashboard UI** — connect docs, import preview, profile form, filter editor  

## Data

| Table | Notes |
|-------|--------|
| `freelancer_profiles` | `org_id` unique; title, bio, skills[], rate, exclusions, `source` |
| `profile_import_drafts` | Optional pending extension payload per org |
| `search_filter_sets` | `org_id` unique; Apify input JSON; `provenance` (`ai`/`manual`); `updated_by` |

## API (sketch)

| Method | Path | Who |
|--------|------|-----|
| POST | `/orgs/me/extension/pair` | Org-admin — issue pairing token |
| POST | `/orgs/me/freelancer-profile/import` | Extension (JWT) |
| POST | `/orgs/me/freelancer-profile/import/confirm` | Org-admin |
| GET/PATCH | `/orgs/me/freelancer-profile` | Org-admin |
| POST | `/orgs/me/search-filters/generate` | Org-admin |
| GET/PUT | `/orgs/me/search-filters` | Org-admin |

## Build order

1. Schema: `freelancer_profiles`, `search_filter_sets` (+ drafts if needed); permissions  
2. Profile CRUD + dashboard form (manual fill first)  
3. Import API + confirm UI  
4. Extension: auth/connect + profile scrape + POST import  
5. Filter generate (start simple: template/rules from skills; swap LLM when ready)  
6. Filter editor UI + save  

## Done when

- [ ] Extension connects to the app and stays authenticated  
- [ ] Sync from Upwork fills an org profile draft; confirm persists by `org_id`  
- [ ] Generate produces editable Apify filter JSON  
- [ ] Org-admin can modify and save filters  
- [ ] Non–org-admin cannot mutate profile/filters  

## Open choices

1. Pairing: one-time code vs paste long-lived JWT  
2. Filter generate: rules-only for MVP vs LLM in this plan  
3. Permission keys: e.g. `org.freelancer_profile.update`, `org.search_filters.update`
