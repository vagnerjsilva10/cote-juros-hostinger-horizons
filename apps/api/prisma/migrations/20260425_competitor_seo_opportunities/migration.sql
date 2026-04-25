CREATE TABLE "competitor_seo_opportunities" (
  "id" TEXT NOT NULL,
  "query" TEXT NOT NULL,
  "cluster_slug" TEXT,
  "cluster_name" TEXT,
  "competitor_domain" TEXT NOT NULL,
  "competitor_url" TEXT NOT NULL,
  "competitor_title" TEXT,
  "snippet" TEXT,
  "position" INTEGER,
  "score" INTEGER NOT NULL DEFAULT 0,
  "opportunity_type" TEXT NOT NULL DEFAULT 'content_gap',
  "gap_reason" TEXT,
  "recommended_title" TEXT,
  "recommended_slug" TEXT,
  "status" TEXT NOT NULL DEFAULT 'new',
  "raw_result" JSONB,
  "analyzed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "competitor_seo_opportunities_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "competitor_seo_opportunities_query_competitor_url_key"
  ON "competitor_seo_opportunities"("query", "competitor_url");

CREATE INDEX "competitor_seo_opportunities_cluster_slug_idx"
  ON "competitor_seo_opportunities"("cluster_slug");

CREATE INDEX "competitor_seo_opportunities_competitor_domain_idx"
  ON "competitor_seo_opportunities"("competitor_domain");

CREATE INDEX "competitor_seo_opportunities_score_idx"
  ON "competitor_seo_opportunities"("score");

CREATE INDEX "competitor_seo_opportunities_status_analyzed_at_idx"
  ON "competitor_seo_opportunities"("status", "analyzed_at");
