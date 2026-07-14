-- Plan 1: freelancer profile + search filter permissions for org-admin

INSERT INTO "permissions" ("key", "name", "category", "description", "is_core", "sort_order") VALUES
  (
    'org.freelancer_profile.read',
    '{"en": "Read Upwork freelancer profile", "ar": "قراءة ملف المستقل على Upwork"}',
    'organization',
    NULL,
    FALSE,
    40
  ),
  (
    'org.freelancer_profile.update',
    '{"en": "Update Upwork freelancer profile", "ar": "تحديث ملف المستقل على Upwork"}',
    'organization',
    NULL,
    FALSE,
    50
  ),
  (
    'org.search_filters.read',
    '{"en": "Read Apify search filters", "ar": "قراءة عوامل بحث Apify"}',
    'organization',
    NULL,
    FALSE,
    60
  ),
  (
    'org.search_filters.update',
    '{"en": "Update Apify search filters", "ar": "تحديث عوامل بحث Apify"}',
    'organization',
    NULL,
    FALSE,
    70
  )
ON CONFLICT ("key") DO UPDATE SET
  "name" = EXCLUDED."name",
  "category" = EXCLUDED."category",
  "description" = EXCLUDED."description",
  "is_core" = EXCLUDED."is_core",
  "sort_order" = EXCLUDED."sort_order",
  "updated_at" = NOW();

INSERT INTO "role_permissions" ("role_key", "permission_key") VALUES
  ('org-admin', 'org.freelancer_profile.read'),
  ('org-admin', 'org.freelancer_profile.update'),
  ('org-admin', 'org.search_filters.read'),
  ('org-admin', 'org.search_filters.update')
ON CONFLICT ("role_key", "permission_key") DO NOTHING;
