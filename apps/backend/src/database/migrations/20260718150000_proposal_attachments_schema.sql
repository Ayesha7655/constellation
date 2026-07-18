-- Proposal document attachments (drafts and/or example library entries)

CREATE TABLE IF NOT EXISTS "proposal_attachments" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "org_id" UUID NOT NULL REFERENCES "organizations" ("id") ON DELETE CASCADE,
  "freelancer_profile_id" UUID NOT NULL REFERENCES "freelancer_profiles" ("id") ON DELETE CASCADE,
  "proposal_draft_id" UUID NULL REFERENCES "proposal_drafts" ("id") ON DELETE CASCADE,
  "proposal_example_id" UUID NULL REFERENCES "proposal_examples" ("id") ON DELETE CASCADE,
  "storage_key" TEXT NOT NULL,
  "file_name" TEXT NOT NULL,
  "mime_type" TEXT NOT NULL,
  "size_bytes" BIGINT NOT NULL,
  "sort_order" INTEGER NOT NULL DEFAULT 1,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "proposal_attach_storage_key_uidx" UNIQUE ("storage_key"),
  CONSTRAINT "proposal_attach_size_bytes_chk" CHECK ("size_bytes" >= 0),
  CONSTRAINT "proposal_attach_sort_order_chk" CHECK ("sort_order" >= 1),
  CONSTRAINT "proposal_attach_parent_chk" CHECK (
    ("proposal_draft_id" IS NOT NULL AND "proposal_example_id" IS NULL)
    OR ("proposal_draft_id" IS NULL AND "proposal_example_id" IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS "proposal_attach_org_id_idx"
  ON "proposal_attachments" ("org_id");

CREATE INDEX IF NOT EXISTS "proposal_attach_profile_id_idx"
  ON "proposal_attachments" ("freelancer_profile_id");

CREATE INDEX IF NOT EXISTS "proposal_attach_draft_sort_idx"
  ON "proposal_attachments" ("proposal_draft_id", "sort_order")
  WHERE "proposal_draft_id" IS NOT NULL;

CREATE INDEX IF NOT EXISTS "proposal_attach_example_sort_idx"
  ON "proposal_attachments" ("proposal_example_id", "sort_order")
  WHERE "proposal_example_id" IS NOT NULL;
