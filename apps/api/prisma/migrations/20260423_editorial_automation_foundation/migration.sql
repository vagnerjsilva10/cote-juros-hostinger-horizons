DO $$ BEGIN
  CREATE TYPE "EditorialBriefStatus" AS ENUM ('planned', 'briefing_ready', 'generating', 'draft', 'published', 'failed');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "EditorialIntentStage" AS ENUM ('pillar', 'top', 'middle', 'bottom');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "EditorialJobStatus" AS ENUM ('queued', 'running', 'succeeded', 'failed', 'draft_saved');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "EditorialImageProvider" AS ENUM ('openai', 'gemini', 'fallback');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "seo_clusters" (
  "id" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "primary_keyword" TEXT NOT NULL,
  "pillar_title" TEXT NOT NULL,
  "pillar_slug" TEXT NOT NULL,
  "description" TEXT,
  "status" "RecordStatus" NOT NULL DEFAULT 'active',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "seo_clusters_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "seo_clusters_slug_key" ON "seo_clusters"("slug");
CREATE UNIQUE INDEX IF NOT EXISTS "seo_clusters_pillar_slug_key" ON "seo_clusters"("pillar_slug");
CREATE INDEX IF NOT EXISTS "seo_clusters_status_created_at_idx" ON "seo_clusters"("status", "created_at");

CREATE TABLE IF NOT EXISTS "editorial_briefs" (
  "id" TEXT NOT NULL,
  "cluster_id" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "primary_keyword" TEXT NOT NULL,
  "secondary_keywords" JSONB,
  "stage" "EditorialIntentStage" NOT NULL,
  "brief" JSONB NOT NULL,
  "seo_title" TEXT,
  "meta_description" TEXT,
  "scheduled_for" TIMESTAMP(3),
  "status" "EditorialBriefStatus" NOT NULL DEFAULT 'planned',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "editorial_briefs_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "editorial_briefs_slug_key" ON "editorial_briefs"("slug");
CREATE INDEX IF NOT EXISTS "editorial_briefs_cluster_id_status_idx" ON "editorial_briefs"("cluster_id", "status");
CREATE INDEX IF NOT EXISTS "editorial_briefs_scheduled_for_status_idx" ON "editorial_briefs"("scheduled_for", "status");

ALTER TABLE "editorial_briefs"
  ADD CONSTRAINT "editorial_briefs_cluster_id_fkey"
  FOREIGN KEY ("cluster_id") REFERENCES "seo_clusters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "articles"
  ADD COLUMN IF NOT EXISTS "cluster_id" TEXT,
  ADD COLUMN IF NOT EXISTS "brief_id" TEXT,
  ADD COLUMN IF NOT EXISTS "cover_image" TEXT,
  ADD COLUMN IF NOT EXISTS "og_image" TEXT,
  ADD COLUMN IF NOT EXISTS "read_time" INTEGER,
  ADD COLUMN IF NOT EXISTS "word_count" INTEGER,
  ADD COLUMN IF NOT EXISTS "is_pillar" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "structured_content" JSONB;

CREATE UNIQUE INDEX IF NOT EXISTS "articles_brief_id_key" ON "articles"("brief_id");
CREATE INDEX IF NOT EXISTS "articles_cluster_id_idx" ON "articles"("cluster_id");
CREATE INDEX IF NOT EXISTS "articles_is_pillar_status_idx" ON "articles"("is_pillar", "status");

ALTER TABLE "articles"
  ADD CONSTRAINT "articles_cluster_id_fkey"
  FOREIGN KEY ("cluster_id") REFERENCES "seo_clusters"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "articles"
  ADD CONSTRAINT "articles_brief_id_fkey"
  FOREIGN KEY ("brief_id") REFERENCES "editorial_briefs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "editorial_assets" (
  "id" TEXT NOT NULL,
  "article_id" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "provider" "EditorialImageProvider" NOT NULL,
  "prompt" TEXT NOT NULL,
  "public_path" TEXT NOT NULL,
  "width" INTEGER,
  "height" INTEGER,
  "file_size_bytes" INTEGER,
  "status" "EditorialJobStatus" NOT NULL DEFAULT 'queued',
  "error_message" TEXT,
  "metadata" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "editorial_assets_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "editorial_assets_article_id_created_at_idx" ON "editorial_assets"("article_id", "created_at");
CREATE INDEX IF NOT EXISTS "editorial_assets_slug_created_at_idx" ON "editorial_assets"("slug", "created_at");

ALTER TABLE "editorial_assets"
  ADD CONSTRAINT "editorial_assets_article_id_fkey"
  FOREIGN KEY ("article_id") REFERENCES "articles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "editorial_job_runs" (
  "id" TEXT NOT NULL,
  "job_name" TEXT NOT NULL,
  "trigger_source" TEXT,
  "cluster_id" TEXT,
  "brief_id" TEXT,
  "article_id" TEXT,
  "status" "EditorialJobStatus" NOT NULL DEFAULT 'queued',
  "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "finished_at" TIMESTAMP(3),
  "duration_ms" INTEGER,
  "metadata" JSONB,
  "error_message" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "editorial_job_runs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "editorial_job_runs_job_name_started_at_idx" ON "editorial_job_runs"("job_name", "started_at");
CREATE INDEX IF NOT EXISTS "editorial_job_runs_status_started_at_idx" ON "editorial_job_runs"("status", "started_at");
CREATE INDEX IF NOT EXISTS "editorial_job_runs_cluster_id_started_at_idx" ON "editorial_job_runs"("cluster_id", "started_at");
CREATE INDEX IF NOT EXISTS "editorial_job_runs_brief_id_started_at_idx" ON "editorial_job_runs"("brief_id", "started_at");

ALTER TABLE "editorial_job_runs"
  ADD CONSTRAINT "editorial_job_runs_cluster_id_fkey"
  FOREIGN KEY ("cluster_id") REFERENCES "seo_clusters"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "editorial_job_runs"
  ADD CONSTRAINT "editorial_job_runs_brief_id_fkey"
  FOREIGN KEY ("brief_id") REFERENCES "editorial_briefs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "editorial_job_runs"
  ADD CONSTRAINT "editorial_job_runs_article_id_fkey"
  FOREIGN KEY ("article_id") REFERENCES "articles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
