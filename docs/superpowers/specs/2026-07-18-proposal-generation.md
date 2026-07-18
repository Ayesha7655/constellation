# Plan 3 — Per-profile proposal generation

**Date:** 2026-07-18  
**Status:** Implemented (v1)  
**Depends on:** Plan 1 (profiles) + Plan 2 (jobs)  
**Owns:** Style packs, proposal examples, draft generate/save, AI service rename  
**Does not own:** Upwork auto-apply, embeddings/pgvector, fine-tuning

## Goal

Help each freelancer profile write proposals in their own voice: upload example proposals → AI extracts a style pack (editable) + lexical few-shot examples → draft on job detail → edit/save (optional add to library).

## Writing kit flow

1. User pastes ≥2 past proposals as examples (star the best).
2. **Build style from examples** calls AI `POST /v1/extract-style-pack` and persists the pack.
3. User edits the generated style pack and saves if needed.
4. Job detail generate uses the pack + top lexical-matched examples.

## Architecture

- Internal AI service: `apps/ai` (renamed from `filter-ai`), port 4060
- Env: `AI_SERVICE_URL`, `AI_SERVICE_INTERNAL_KEY`, `AI_SERVICE_TIMEOUT_MS`
- Endpoints: `POST /v1/generate-filters`, `POST /v1/generate-proposal`, `POST /v1/extract-style-pack`
- Backend: `POST …/proposal-style-pack/extract-from-examples` plus style/example/draft CRUD
- Backend tables: `proposal_style_packs`, `proposal_examples`, `proposal_drafts`, `proposal_attachments`
- Attachments: documents (PDF/DOC/images) linked to a draft **or** an example via `proposal_attachments`
- Permissions: `org.proposals.read`, `org.proposals.update`

## Out of scope (v1)

- Fine-tuning / LoRA
- pgvector embeddings
- Auto-submit to Upwork
