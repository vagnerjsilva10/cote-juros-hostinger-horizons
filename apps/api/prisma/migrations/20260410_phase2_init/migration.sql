-- Phase 2 initial schema (PostgreSQL)
CREATE TYPE "ProductType" AS ENUM ('loan', 'credit_card', 'financing');
CREATE TYPE "CategoryType" AS ENUM ('blog', 'product');
CREATE TYPE "RecordStatus" AS ENUM ('draft', 'published', 'archived', 'active', 'inactive');

CREATE TABLE "banks" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL,
  "logo" TEXT,
  "website" TEXT,
  "status" "RecordStatus" NOT NULL DEFAULT 'active',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "categories" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL UNIQUE,
  "type" "CategoryType" NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "financial_products" (
  "id" TEXT PRIMARY KEY,
  "type" "ProductType" NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "category_id" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "financial_products_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE "offers" (
  "id" TEXT PRIMARY KEY,
  "bank_id" TEXT NOT NULL,
  "product_id" TEXT NOT NULL,
  "interest_rate" DECIMAL(10,4),
  "cet" DECIMAL(10,4),
  "min_amount" DECIMAL(14,2),
  "max_amount" DECIMAL(14,2),
  "min_term" INTEGER,
  "max_term" INTEGER,
  "score_requirement" TEXT,
  "redirect_url" TEXT NOT NULL,
  "partner_tracking_url" TEXT,
  "is_featured" BOOLEAN NOT NULL DEFAULT false,
  "status" "RecordStatus" NOT NULL DEFAULT 'active',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "offers_bank_id_fkey" FOREIGN KEY ("bank_id") REFERENCES "banks" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "offers_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "financial_products" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "articles" (
  "id" TEXT PRIMARY KEY,
  "slug" TEXT NOT NULL UNIQUE,
  "title" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "excerpt" TEXT,
  "category_id" TEXT,
  "author" TEXT,
  "seo_title" TEXT,
  "seo_description" TEXT,
  "published_at" TIMESTAMP(3),
  "status" "RecordStatus" NOT NULL DEFAULT 'draft',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "articles_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE "simulation_leads" (
  "id" TEXT PRIMARY KEY,
  "product_type" "ProductType" NOT NULL,
  "requested_amount" DECIMAL(14,2),
  "income" DECIMAL(14,2),
  "score_range" TEXT,
  "employment_status" TEXT,
  "has_restriction" BOOLEAN,
  "utm_source" TEXT,
  "utm_medium" TEXT,
  "utm_campaign" TEXT,
  "origin_page" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "click_events" (
  "id" TEXT PRIMARY KEY,
  "offer_id" TEXT,
  "source_page" TEXT NOT NULL,
  "utm_source" TEXT,
  "utm_medium" TEXT,
  "utm_campaign" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "click_events_offer_id_fkey" FOREIGN KEY ("offer_id") REFERENCES "offers" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE "cta_events" (
  "id" TEXT PRIMARY KEY,
  "source_page" TEXT NOT NULL,
  "cta_name" TEXT NOT NULL,
  "destination" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "app_integration_events" (
  "id" TEXT PRIMARY KEY,
  "source_page" TEXT NOT NULL,
  "product_context" TEXT,
  "simulation_id" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "app_integration_events_simulation_id_fkey" FOREIGN KEY ("simulation_id") REFERENCES "simulation_leads" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE "partner_redirects" (
  "id" TEXT PRIMARY KEY,
  "partner_id" TEXT NOT NULL,
  "offer_id" TEXT,
  "source_page" TEXT NOT NULL,
  "destination" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "partner_redirects_offer_id_fkey" FOREIGN KEY ("offer_id") REFERENCES "offers" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX "banks_name_idx" ON "banks"("name");
CREATE INDEX "categories_type_idx" ON "categories"("type");
CREATE INDEX "financial_products_type_idx" ON "financial_products"("type");
CREATE INDEX "financial_products_category_id_idx" ON "financial_products"("category_id");
CREATE INDEX "offers_bank_id_idx" ON "offers"("bank_id");
CREATE INDEX "offers_product_id_idx" ON "offers"("product_id");
CREATE INDEX "offers_status_is_featured_idx" ON "offers"("status", "is_featured");
CREATE INDEX "articles_status_published_at_idx" ON "articles"("status", "published_at");
CREATE INDEX "articles_category_id_idx" ON "articles"("category_id");
CREATE INDEX "simulation_leads_product_type_idx" ON "simulation_leads"("product_type");
CREATE INDEX "simulation_leads_origin_page_idx" ON "simulation_leads"("origin_page");
CREATE INDEX "simulation_leads_created_at_idx" ON "simulation_leads"("created_at");
CREATE INDEX "click_events_offer_id_idx" ON "click_events"("offer_id");
CREATE INDEX "click_events_source_page_idx" ON "click_events"("source_page");
CREATE INDEX "click_events_created_at_idx" ON "click_events"("created_at");
CREATE INDEX "cta_events_source_page_idx" ON "cta_events"("source_page");
CREATE INDEX "cta_events_cta_name_idx" ON "cta_events"("cta_name");
CREATE INDEX "cta_events_created_at_idx" ON "cta_events"("created_at");
CREATE INDEX "app_integration_events_source_page_idx" ON "app_integration_events"("source_page");
CREATE INDEX "app_integration_events_simulation_id_idx" ON "app_integration_events"("simulation_id");
CREATE INDEX "app_integration_events_created_at_idx" ON "app_integration_events"("created_at");
CREATE INDEX "partner_redirects_partner_id_idx" ON "partner_redirects"("partner_id");
CREATE INDEX "partner_redirects_offer_id_idx" ON "partner_redirects"("offer_id");
CREATE INDEX "partner_redirects_created_at_idx" ON "partner_redirects"("created_at");
