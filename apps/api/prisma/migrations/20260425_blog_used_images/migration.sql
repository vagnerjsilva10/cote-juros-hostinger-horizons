CREATE TABLE IF NOT EXISTS "blog_used_images" (
  "id" TEXT NOT NULL,
  "post_id" TEXT,
  "source" TEXT NOT NULL,
  "source_image_id" TEXT,
  "original_url" TEXT,
  "download_url" TEXT,
  "image_hash" TEXT,
  "perceptual_hash" TEXT,
  "visual_signature" TEXT,
  "keywords" JSONB,
  "article_title" TEXT,
  "used_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "blog_used_images_pkey" PRIMARY KEY ("id")
);

DO $$ BEGIN
  ALTER TABLE "blog_used_images"
  ADD CONSTRAINT "blog_used_images_post_id_fkey"
  FOREIGN KEY ("post_id") REFERENCES "articles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS "blog_used_images_source_source_image_id_key" ON "blog_used_images"("source", "source_image_id") WHERE "source_image_id" IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS "blog_used_images_original_url_key" ON "blog_used_images"("original_url") WHERE "original_url" IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS "blog_used_images_download_url_key" ON "blog_used_images"("download_url") WHERE "download_url" IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS "blog_used_images_image_hash_key" ON "blog_used_images"("image_hash") WHERE "image_hash" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "blog_used_images_post_id_idx" ON "blog_used_images"("post_id");
CREATE INDEX IF NOT EXISTS "blog_used_images_source_idx" ON "blog_used_images"("source");
CREATE INDEX IF NOT EXISTS "blog_used_images_used_at_idx" ON "blog_used_images"("used_at");
