-- Constellation v1 auth + organizations schema

CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'DELETED', 'DEACTIVATED');
CREATE TYPE "AuthProvider" AS ENUM ('PASSWORD', 'GOOGLE', 'APPLE');
CREATE TYPE "SessionPlatform" AS ENUM ('WEB', 'ANDROID', 'IOS');

CREATE TABLE "organizations" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" TEXT,
  "address" TEXT,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
  "deleted_at" TIMESTAMPTZ(6)
);

CREATE TABLE "roles" (
  "key" TEXT PRIMARY KEY,
  "display_name" JSONB NOT NULL,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT NOW()
);

CREATE TABLE "permission_categories" (
  "key" TEXT PRIMARY KEY,
  "label" JSONB NOT NULL,
  "sort_order" INTEGER NOT NULL
);

CREATE TABLE "permissions" (
  "key" TEXT PRIMARY KEY,
  "name" JSONB NOT NULL,
  "category" TEXT NOT NULL REFERENCES "permission_categories" ("key") ON DELETE RESTRICT,
  "description" JSONB,
  "is_core" BOOLEAN NOT NULL DEFAULT FALSE,
  "sort_order" INTEGER NOT NULL,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT NOW()
);

CREATE TABLE "role_permissions" (
  "role_key" TEXT NOT NULL REFERENCES "roles" ("key") ON DELETE CASCADE,
  "permission_key" TEXT NOT NULL REFERENCES "permissions" ("key") ON DELETE CASCADE,
  PRIMARY KEY ("role_key", "permission_key")
);

CREATE INDEX "role_permissions_perm_key_idx" ON "role_permissions" ("permission_key");

CREATE TABLE "users" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL UNIQUE,
  "firebase_uid" TEXT UNIQUE,
  "photo_url" TEXT,
  "auth_provider" "AuthProvider" NOT NULL,
  "email_verified_at" TIMESTAMPTZ(6),
  "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
  "primary_role_key" TEXT NOT NULL REFERENCES "roles" ("key") ON DELETE RESTRICT,
  "org_id" UUID REFERENCES "organizations" ("id") ON DELETE SET NULL,
  "last_login_at" TIMESTAMPTZ(6),
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
  "deleted_at" TIMESTAMPTZ(6)
);

CREATE INDEX "users_primary_role_key_idx" ON "users" ("primary_role_key");
CREATE INDEX "users_org_id_idx" ON "users" ("org_id");
CREATE INDEX "users_deleted_at_idx" ON "users" ("deleted_at");

CREATE TABLE "user_roles" (
  "user_id" UUID NOT NULL REFERENCES "users" ("id") ON DELETE CASCADE,
  "role_key" TEXT NOT NULL REFERENCES "roles" ("key") ON DELETE CASCADE,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
  PRIMARY KEY ("user_id", "role_key")
);

CREATE INDEX "user_roles_role_key_idx" ON "user_roles" ("role_key");
CREATE INDEX "user_roles_user_id_idx" ON "user_roles" ("user_id");

CREATE TABLE "user_sessions" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" UUID NOT NULL REFERENCES "users" ("id") ON DELETE CASCADE,
  "refresh_token_hash" TEXT,
  "access_token_jti" TEXT,
  "device_id" TEXT,
  "platform" "SessionPlatform" NOT NULL DEFAULT 'WEB',
  "ip_address" TEXT,
  "user_agent" TEXT,
  "is_revoked" BOOLEAN NOT NULL DEFAULT FALSE,
  "active_role_key" TEXT NOT NULL REFERENCES "roles" ("key") ON DELETE RESTRICT,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
  "last_active_at" TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
  "revoked_at" TIMESTAMPTZ(6)
);

CREATE INDEX "user_sessions_user_id_idx" ON "user_sessions" ("user_id");
CREATE INDEX "user_sessions_device_id_idx" ON "user_sessions" ("device_id");
CREATE INDEX "user_sessions_is_revoked_idx" ON "user_sessions" ("is_revoked");
CREATE INDEX "user_sessions_device_platform_idx" ON "user_sessions" ("user_id", "device_id", "platform", "is_revoked");
CREATE INDEX "user_sessions_last_active_at_idx" ON "user_sessions" ("last_active_at");
CREATE INDEX "user_sessions_active_role_key_idx" ON "user_sessions" ("active_role_key");
