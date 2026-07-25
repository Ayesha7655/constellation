-- Schema: proposal draft creation source (web app vs extension job page).

ALTER TABLE "proposal_drafts"
  ADD COLUMN IF NOT EXISTS "source" TEXT NOT NULL DEFAULT 'web';

ALTER TABLE "proposal_drafts"
  DROP CONSTRAINT IF EXISTS "proposal_drafts_source_chk";

ALTER TABLE "proposal_drafts"
  ADD CONSTRAINT "proposal_drafts_source_chk"
  CHECK ("source" IN ('web', 'extension_job_page'));
