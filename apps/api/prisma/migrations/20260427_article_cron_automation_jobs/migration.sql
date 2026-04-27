CREATE TABLE IF NOT EXISTS "automation_jobs" (
  "id" TEXT NOT NULL,
  "job_name" TEXT NOT NULL,
  "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "finished_at" TIMESTAMP(3),
  "status" TEXT NOT NULL,
  "error_message" TEXT,
  "payload" JSONB,
  "result" JSONB,
  "created_article_id" TEXT,
  "wordpress_post_id" INTEGER,
  CONSTRAINT "automation_jobs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "automation_jobs_job_name_started_at_idx" ON "automation_jobs"("job_name", "started_at");
CREATE INDEX IF NOT EXISTS "automation_jobs_status_started_at_idx" ON "automation_jobs"("status", "started_at");
CREATE INDEX IF NOT EXISTS "automation_jobs_created_article_id_idx" ON "automation_jobs"("created_article_id");
CREATE INDEX IF NOT EXISTS "automation_jobs_wordpress_post_id_idx" ON "automation_jobs"("wordpress_post_id");

ALTER TABLE "automation_jobs"
  ADD CONSTRAINT "automation_jobs_created_article_id_fkey"
  FOREIGN KEY ("created_article_id") REFERENCES "articles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
