-- SuperAdmin site foundation: settings, navigation, legal disclaimers and route SEO.

CREATE TABLE IF NOT EXISTS "site_settings" (
  "id" TEXT NOT NULL,
  "key" TEXT NOT NULL,
  "value" JSONB NOT NULL,
  "setting_group" TEXT NOT NULL,
  "description" TEXT,
  "is_public" BOOLEAN NOT NULL DEFAULT false,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "site_settings_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "site_settings_key_key" ON "site_settings"("key");
CREATE INDEX IF NOT EXISTS "site_settings_setting_group_is_public_idx" ON "site_settings"("setting_group", "is_public");

CREATE TABLE IF NOT EXISTS "navigation_items" (
  "id" TEXT NOT NULL,
  "location" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "href" TEXT NOT NULL,
  "sort_order" INTEGER NOT NULL DEFAULT 0,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "parent_id" TEXT,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "navigation_items_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "navigation_items_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "navigation_items"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "navigation_items_location_is_active_sort_order_idx" ON "navigation_items"("location", "is_active", "sort_order");
CREATE INDEX IF NOT EXISTS "navigation_items_parent_id_idx" ON "navigation_items"("parent_id");

CREATE TABLE IF NOT EXISTS "legal_disclaimers" (
  "id" TEXT NOT NULL,
  "key" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "placement" TEXT NOT NULL,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "legal_disclaimers_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "legal_disclaimers_key_key" ON "legal_disclaimers"("key");
CREATE INDEX IF NOT EXISTS "legal_disclaimers_placement_is_active_idx" ON "legal_disclaimers"("placement", "is_active");

CREATE TABLE IF NOT EXISTS "seo_meta" (
  "id" TEXT NOT NULL,
  "path" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "canonical" TEXT,
  "robots" TEXT,
  "og_title" TEXT,
  "og_description" TEXT,
  "og_image" TEXT,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "seo_meta_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "seo_meta_path_key" ON "seo_meta"("path");
CREATE INDEX IF NOT EXISTS "seo_meta_is_active_path_idx" ON "seo_meta"("is_active", "path");
