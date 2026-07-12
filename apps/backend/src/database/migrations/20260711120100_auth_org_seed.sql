-- Constellation v1 slim RBAC seed

INSERT INTO "roles" ("key", "display_name") VALUES
  ('super-admin', '{"en": "Super Admin", "ar": "المشرف الأعلى"}'),
  ('org-admin', '{"en": "Organization Admin", "ar": "مسؤول المنظمة"}'),
  ('user', '{"en": "User", "ar": "مستخدم"}')
ON CONFLICT ("key") DO UPDATE SET
  "display_name" = EXCLUDED."display_name",
  "updated_at" = NOW();

INSERT INTO "permission_categories" ("key", "label", "sort_order") VALUES
  ('platform', '{"en": "Platform", "ar": "المنصة"}', 10),
  ('organization', '{"en": "Organization", "ar": "المنظمة"}', 20),
  ('admin', '{"en": "Administration", "ar": "الإدارة"}', 30)
ON CONFLICT ("key") DO UPDATE SET
  "label" = EXCLUDED."label",
  "sort_order" = EXCLUDED."sort_order";

INSERT INTO "permissions" ("key", "name", "category", "description", "is_core", "sort_order") VALUES
  ('platform.health', '{"en": "Health check", "ar": "فحص الصحة"}', 'platform', NULL, TRUE, 10),
  ('org.profile.read', '{"en": "Read organization profile", "ar": "قراءة ملف المنظمة"}', 'organization', NULL, TRUE, 10),
  ('org.profile.update', '{"en": "Update organization profile", "ar": "تحديث ملف المنظمة"}', 'organization', NULL, TRUE, 20),
  ('org.dashboard.access', '{"en": "Access dashboard", "ar": "الوصول إلى لوحة التحكم"}', 'organization', NULL, TRUE, 30),
  ('admin.users.read', '{"en": "Read users", "ar": "قراءة المستخدمين"}', 'admin', NULL, FALSE, 10),
  ('admin.users.update', '{"en": "Update users", "ar": "تحديث المستخدمين"}', 'admin', NULL, FALSE, 20),
  ('admin.roles.read', '{"en": "Read roles", "ar": "قراءة الأدوار"}', 'admin', NULL, FALSE, 30),
  ('admin.platform.manage', '{"en": "Manage platform", "ar": "إدارة المنصة"}', 'admin', NULL, FALSE, 40)
ON CONFLICT ("key") DO UPDATE SET
  "name" = EXCLUDED."name",
  "category" = EXCLUDED."category",
  "description" = EXCLUDED."description",
  "is_core" = EXCLUDED."is_core",
  "sort_order" = EXCLUDED."sort_order",
  "updated_at" = NOW();

INSERT INTO "role_permissions" ("role_key", "permission_key") VALUES
  ('super-admin', 'platform.health'),
  ('super-admin', 'admin.users.read'),
  ('super-admin', 'admin.users.update'),
  ('super-admin', 'admin.roles.read'),
  ('super-admin', 'admin.platform.manage'),
  ('org-admin', 'org.profile.read'),
  ('org-admin', 'org.profile.update'),
  ('org-admin', 'org.dashboard.access'),
  ('user', 'org.profile.read'),
  ('user', 'org.dashboard.access')
ON CONFLICT ("role_key", "permission_key") DO NOTHING;
