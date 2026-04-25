CREATE TABLE IF NOT EXISTS "seo_search_console_metrics" (
  "id" TEXT NOT NULL,
  "site_url" TEXT NOT NULL,
  "page" TEXT NOT NULL,
  "query" TEXT NOT NULL,
  "date_from" TIMESTAMP(3) NOT NULL,
  "date_to" TIMESTAMP(3) NOT NULL,
  "clicks" INTEGER NOT NULL DEFAULT 0,
  "impressions" INTEGER NOT NULL DEFAULT 0,
  "ctr" DECIMAL(10,6) NOT NULL DEFAULT 0,
  "position" DECIMAL(10,3) NOT NULL DEFAULT 0,
  "source" TEXT NOT NULL DEFAULT 'search_console',
  "synced_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "seo_search_console_metrics_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "seo_search_console_metrics_site_url_page_query_date_from_date_to_key"
  ON "seo_search_console_metrics"("site_url", "page", "query", "date_from", "date_to");

CREATE INDEX IF NOT EXISTS "seo_search_console_metrics_page_idx" ON "seo_search_console_metrics"("page");
CREATE INDEX IF NOT EXISTS "seo_search_console_metrics_query_idx" ON "seo_search_console_metrics"("query");
CREATE INDEX IF NOT EXISTS "seo_search_console_metrics_date_to_idx" ON "seo_search_console_metrics"("date_to");
CREATE INDEX IF NOT EXISTS "seo_search_console_metrics_impressions_idx" ON "seo_search_console_metrics"("impressions");
CREATE INDEX IF NOT EXISTS "seo_search_console_metrics_position_idx" ON "seo_search_console_metrics"("position");
