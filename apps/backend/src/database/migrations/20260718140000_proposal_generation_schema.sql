-- Proposal generation: style packs, examples, and per-job drafts

CREATE TABLE IF NOT EXISTS "proposal_style_packs" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "org_id" UUID NOT NULL REFERENCES "organizations" ("id") ON DELETE CASCADE,
  "freelancer_profile_id" UUID NOT NULL REFERENCES "freelancer_profiles" ("id") ON DELETE CASCADE,
  "preferences" JSONB NOT NULL DEFAULT '{}'::jsonb,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "proposal_style_packs_profile_uidx" UNIQUE ("freelancer_profile_id")
);

CREATE INDEX IF NOT EXISTS "proposal_style_packs_org_id_idx"
  ON "proposal_style_packs" ("org_id");

CREATE TABLE IF NOT EXISTS "proposal_examples" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "org_id" UUID NOT NULL REFERENCES "organizations" ("id") ON DELETE CASCADE,
  "freelancer_profile_id" UUID NOT NULL REFERENCES "freelancer_profiles" ("id") ON DELETE CASCADE,
  "title" TEXT NULL,
  "body" TEXT NOT NULL,
  "job_context" TEXT NULL,
  "is_starred" BOOLEAN NOT NULL DEFAULT FALSE,
  "source" TEXT NOT NULL DEFAULT 'upload',
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "proposal_examples_source_chk" CHECK ("source" IN ('upload', 'accepted_draft'))
);

CREATE INDEX IF NOT EXISTS "proposal_examples_profile_created_idx"
  ON "proposal_examples" ("freelancer_profile_id", "created_at" DESC);

CREATE INDEX IF NOT EXISTS "proposal_examples_org_id_idx"
  ON "proposal_examples" ("org_id");

CREATE TABLE IF NOT EXISTS "proposal_drafts" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "org_id" UUID NOT NULL REFERENCES "organizations" ("id") ON DELETE CASCADE,
  "freelancer_profile_id" UUID NOT NULL REFERENCES "freelancer_profiles" ("id") ON DELETE CASCADE,
  "upwork_job_id" UUID NOT NULL REFERENCES "upwork_jobs" ("id") ON DELETE CASCADE,
  "body" TEXT NOT NULL DEFAULT '',
  "status" TEXT NOT NULL DEFAULT 'draft',
  "provenance" TEXT NOT NULL DEFAULT 'ai',
  "model_meta" JSONB NULL,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "proposal_drafts_profile_job_uidx" UNIQUE ("freelancer_profile_id", "upwork_job_id"),
  CONSTRAINT "proposal_drafts_status_chk" CHECK ("status" IN ('draft', 'saved')),
  CONSTRAINT "proposal_drafts_provenance_chk" CHECK ("provenance" IN ('ai', 'manual'))
);

CREATE INDEX IF NOT EXISTS "proposal_drafts_org_id_idx"
  ON "proposal_drafts" ("org_id");

CREATE INDEX IF NOT EXISTS "proposal_drafts_job_id_idx"
  ON "proposal_drafts" ("upwork_job_id");
