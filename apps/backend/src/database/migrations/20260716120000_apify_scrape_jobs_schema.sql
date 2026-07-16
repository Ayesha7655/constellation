-- Plan 2: Apify scrape runs, Upwork jobs, per-run job log, org Upwork metadata

ALTER TABLE "organizations"
  ADD COLUMN IF NOT EXISTS "extension_connected_at" TIMESTAMPTZ NULL;

ALTER TABLE "organizations"
  ADD COLUMN IF NOT EXISTS "upwork_scoring_config" JSONB NULL;

CREATE TABLE IF NOT EXISTS "scrape_runs" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "org_id" UUID NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
  "freelancer_profile_id" UUID NOT NULL REFERENCES "freelancer_profiles"("id") ON DELETE CASCADE,
  "status" TEXT NOT NULL DEFAULT 'queued',
  "trigger" TEXT NOT NULL DEFAULT 'manual',
  "actor_id" TEXT NOT NULL,
  "apify_run_id" TEXT NULL,
  "filters_snapshot" JSONB NOT NULL DEFAULT '{}'::jsonb,
  "error" TEXT NULL,
  "total_fetched" INTEGER NOT NULL DEFAULT 0,
  "total_filtered" INTEGER NOT NULL DEFAULT 0,
  "total_saved" INTEGER NOT NULL DEFAULT 0,
  "total_new" INTEGER NOT NULL DEFAULT 0,
  "started_at" TIMESTAMPTZ NULL,
  "finished_at" TIMESTAMPTZ NULL,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "scrape_runs_status_check" CHECK ("status" IN ('queued', 'running', 'succeeded', 'failed')),
  CONSTRAINT "scrape_runs_trigger_check" CHECK ("trigger" IN ('manual', 'schedule'))
);

CREATE INDEX IF NOT EXISTS "scrape_runs_profile_created_idx"
  ON "scrape_runs" ("freelancer_profile_id", "created_at" DESC);

CREATE INDEX IF NOT EXISTS "scrape_runs_org_created_idx"
  ON "scrape_runs" ("org_id", "created_at" DESC);

CREATE INDEX IF NOT EXISTS "scrape_runs_profile_active_idx"
  ON "scrape_runs" ("freelancer_profile_id", "status")
  WHERE "status" IN ('queued', 'running');

CREATE TABLE IF NOT EXISTS "upwork_jobs" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "org_id" UUID NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
  "external_job_id" TEXT NOT NULL,
  "job_url" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL DEFAULT '',
  "budget" TEXT NULL,
  "job_type" TEXT NULL,
  "experience_level" TEXT NULL,
  "client_location" TEXT NULL,
  "client_rating" DOUBLE PRECISION NULL,
  "client_spent" TEXT NULL,
  "skills" JSONB NOT NULL DEFAULT '[]'::jsonb,
  "proposals" INTEGER NULL,
  "posted_time" TEXT NULL,
  "posted_at" TIMESTAMPTZ NULL,
  "scrape_run_id" UUID NULL REFERENCES "scrape_runs"("id") ON DELETE SET NULL,
  "raw_payload" JSONB NULL,
  "scraped_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "upwork_jobs_org_external_job_id_key" UNIQUE ("org_id", "external_job_id"),
  CONSTRAINT "upwork_jobs_org_job_url_key" UNIQUE ("org_id", "job_url")
);

CREATE INDEX IF NOT EXISTS "upwork_jobs_org_scraped_idx"
  ON "upwork_jobs" ("org_id", "scraped_at" DESC);

CREATE INDEX IF NOT EXISTS "upwork_jobs_scrape_run_id_idx"
  ON "upwork_jobs" ("scrape_run_id");

CREATE TABLE IF NOT EXISTS "scrape_run_jobs" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "org_id" UUID NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
  "scrape_run_id" UUID NOT NULL REFERENCES "scrape_runs"("id") ON DELETE CASCADE,
  "upwork_job_id" UUID NOT NULL REFERENCES "upwork_jobs"("id") ON DELETE CASCADE,
  "freelancer_profile_id" UUID NOT NULL REFERENCES "freelancer_profiles"("id") ON DELETE CASCADE,
  "is_new" BOOLEAN NOT NULL DEFAULT FALSE,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "scrape_run_jobs_run_job_key" UNIQUE ("scrape_run_id", "upwork_job_id")
);

CREATE INDEX IF NOT EXISTS "scrape_run_jobs_run_new_idx"
  ON "scrape_run_jobs" ("scrape_run_id", "is_new");

CREATE INDEX IF NOT EXISTS "scrape_run_jobs_profile_created_idx"
  ON "scrape_run_jobs" ("freelancer_profile_id", "created_at" DESC);

CREATE INDEX IF NOT EXISTS "scrape_run_jobs_org_profile_job_idx"
  ON "scrape_run_jobs" ("org_id", "freelancer_profile_id", "upwork_job_id");
