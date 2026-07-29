-- Portfolio projects scraped from Upwork ?p= modal (extension import).

CREATE TABLE IF NOT EXISTS "portfolio_projects" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "freelancer_profile_id" UUID NOT NULL REFERENCES "freelancer_profiles" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "external_id" TEXT NOT NULL,
  "project_url" TEXT NULL,
  "title" TEXT NOT NULL,
  "role" TEXT NULL,
  "description" TEXT NULL,
  "technologies" JSONB NOT NULL DEFAULT '[]'::jsonb,
  "links" JSONB NOT NULL DEFAULT '[]'::jsonb,
  "image_urls" JSONB NOT NULL DEFAULT '[]'::jsonb,
  "published_on" TEXT NULL,
  "source" TEXT NOT NULL DEFAULT 'extension',
  "raw_snapshot" JSONB NULL,
  "scraped_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS "portfolio_projects_profile_external_uidx"
  ON "portfolio_projects" ("freelancer_profile_id", "external_id");

CREATE INDEX IF NOT EXISTS "portfolio_projects_profile_scraped_idx"
  ON "portfolio_projects" ("freelancer_profile_id", "scraped_at" DESC);
