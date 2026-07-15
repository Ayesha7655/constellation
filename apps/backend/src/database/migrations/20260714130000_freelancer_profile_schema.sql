-- Plan 1: org freelancer profiles (many per org), search filters per profile, extension pairing, import drafts

CREATE TABLE IF NOT EXISTS "freelancer_profiles" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "org_id" UUID NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
  "label" TEXT NULL,
  "title" TEXT NULL,
  "overview" TEXT NULL,
  "skills" JSONB NOT NULL DEFAULT '[]'::jsonb,
  "hourly_rate_min" INTEGER NULL,
  "hourly_rate_max" INTEGER NULL,
  "country" TEXT NULL,
  "timezone" TEXT NULL,
  "languages" JSONB NOT NULL DEFAULT '[]'::jsonb,
  "exclusions" JSONB NOT NULL DEFAULT '[]'::jsonb,
  "profile_url" TEXT NULL,
  "source" TEXT NOT NULL DEFAULT 'manual',
  "raw_snapshot" JSONB NULL,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "freelancer_profiles_source_check" CHECK ("source" IN ('manual', 'extension'))
);

CREATE INDEX IF NOT EXISTS "freelancer_profiles_org_id_idx"
  ON "freelancer_profiles" ("org_id");

CREATE INDEX IF NOT EXISTS "freelancer_profiles_org_created_idx"
  ON "freelancer_profiles" ("org_id", "created_at" DESC);

CREATE TABLE IF NOT EXISTS "profile_import_drafts" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "org_id" UUID NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
  "created_by_user_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "payload" JSONB NOT NULL,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "expires_at" TIMESTAMPTZ NOT NULL,
  CONSTRAINT "profile_import_drafts_org_id_key" UNIQUE ("org_id")
);

CREATE INDEX IF NOT EXISTS "profile_import_drafts_expires_at_idx"
  ON "profile_import_drafts" ("expires_at");

CREATE TABLE IF NOT EXISTS "search_filter_sets" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "org_id" UUID NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
  "freelancer_profile_id" UUID NOT NULL REFERENCES "freelancer_profiles"("id") ON DELETE CASCADE,
  "actor_id" TEXT NOT NULL,
  "filters" JSONB NOT NULL DEFAULT '{}'::jsonb,
  "provenance" TEXT NOT NULL DEFAULT 'manual',
  "updated_by_user_id" UUID NULL REFERENCES "users"("id") ON DELETE SET NULL,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "search_filter_sets_profile_id_key" UNIQUE ("freelancer_profile_id"),
  CONSTRAINT "search_filter_sets_provenance_check" CHECK ("provenance" IN ('ai', 'manual'))
);

CREATE INDEX IF NOT EXISTS "search_filter_sets_org_id_idx"
  ON "search_filter_sets" ("org_id");

CREATE TABLE IF NOT EXISTS "extension_pairing_codes" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "code" TEXT NOT NULL,
  "user_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "org_id" UUID NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
  "expires_at" TIMESTAMPTZ NOT NULL,
  "consumed_at" TIMESTAMPTZ NULL,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "extension_pairing_codes_code_key" UNIQUE ("code")
);

CREATE INDEX IF NOT EXISTS "extension_pairing_codes_expires_at_idx"
  ON "extension_pairing_codes" ("expires_at");
