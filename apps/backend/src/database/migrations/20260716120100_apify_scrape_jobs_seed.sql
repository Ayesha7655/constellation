-- Plan 2: scrape run, Upwork jobs, and scoring-config permissions for org-admin

INSERT INTO "permissions" ("key", "name", "category", "description", "is_core", "sort_order") VALUES
  (
    'org.scrape_runs.read',
    '{"en": "Read Upwork scrape runs", "ar": "قراءة عمليات جمع وظائف Upwork"}',
    'organization',
    NULL,
    FALSE,
    80
  ),
  (
    'org.scrape_runs.create',
    '{"en": "Start Upwork scrape runs", "ar": "بدء عمليات جمع وظائف Upwork"}',
    'organization',
    NULL,
    FALSE,
    90
  ),
  (
    'org.upwork_jobs.read',
    '{"en": "Read Upwork job results", "ar": "قراءة نتائج وظائف Upwork"}',
    'organization',
    NULL,
    FALSE,
    100
  ),
  (
    'org.upwork_scoring.read',
    '{"en": "Read Upwork scoring settings", "ar": "قراءة إعدادات تقييم Upwork"}',
    'organization',
    NULL,
    FALSE,
    110
  ),
  (
    'org.upwork_scoring.update',
    '{"en": "Update Upwork scoring settings", "ar": "تحديث إعدادات تقييم Upwork"}',
    'organization',
    NULL,
    FALSE,
    120
  )
ON CONFLICT ("key") DO UPDATE SET
  "name" = EXCLUDED."name",
  "category" = EXCLUDED."category",
  "description" = EXCLUDED."description",
  "is_core" = EXCLUDED."is_core",
  "sort_order" = EXCLUDED."sort_order",
  "updated_at" = NOW();

INSERT INTO "role_permissions" ("role_key", "permission_key") VALUES
  ('org-admin', 'org.scrape_runs.read'),
  ('org-admin', 'org.scrape_runs.create'),
  ('org-admin', 'org.upwork_jobs.read'),
  ('org-admin', 'org.upwork_scoring.read'),
  ('org-admin', 'org.upwork_scoring.update')
ON CONFLICT ("role_key", "permission_key") DO NOTHING;
