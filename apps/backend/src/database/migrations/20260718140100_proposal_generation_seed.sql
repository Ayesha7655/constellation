-- Proposal generation permissions for org-admin

INSERT INTO "permissions" ("key", "name", "category", "description", "is_core", "sort_order") VALUES
  (
    'org.proposals.read',
    '{"en": "Read proposal style packs and drafts", "ar": "قراءة حزم أسلوب المقترحات والمسودات"}',
    'organization',
    NULL,
    FALSE,
    130
  ),
  (
    'org.proposals.update',
    '{"en": "Manage proposal examples and generate drafts", "ar": "إدارة أمثلة المقترحات وإنشاء المسودات"}',
    'organization',
    NULL,
    FALSE,
    140
  )
ON CONFLICT ("key") DO UPDATE SET
  "name" = EXCLUDED."name",
  "category" = EXCLUDED."category",
  "description" = EXCLUDED."description",
  "is_core" = EXCLUDED."is_core",
  "sort_order" = EXCLUDED."sort_order",
  "updated_at" = NOW();

INSERT INTO "role_permissions" ("role_key", "permission_key") VALUES
  ('org-admin', 'org.proposals.read'),
  ('org-admin', 'org.proposals.update')
ON CONFLICT ("role_key", "permission_key") DO NOTHING;
