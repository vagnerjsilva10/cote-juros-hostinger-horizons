-- CreateEnum
CREATE TYPE "AffiliateNetworkCode" AS ENUM ('awin');

-- CreateTable
CREATE TABLE "affiliate_networks" (
    "id" TEXT NOT NULL,
    "code" "AffiliateNetworkCode" NOT NULL,
    "name" TEXT NOT NULL,
    "status" "RecordStatus" NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "affiliate_networks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "affiliate_programs" (
    "id" TEXT NOT NULL,
    "network_id" TEXT NOT NULL,
    "advertiser_id" TEXT NOT NULL,
    "merchant_name" TEXT NOT NULL,
    "program_name" TEXT,
    "status" "RecordStatus" NOT NULL DEFAULT 'active',
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "affiliate_programs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "affiliate_offers" (
    "id" TEXT NOT NULL,
    "network_id" TEXT NOT NULL,
    "program_id" TEXT,
    "network" "AffiliateNetworkCode" NOT NULL DEFAULT 'awin',
    "advertiser_id" TEXT NOT NULL,
    "merchant_name" TEXT NOT NULL,
    "offer_slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "audience" TEXT,
    "product_type" "ProductType",
    "page_slugs" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "placements" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "destination_url" TEXT NOT NULL,
    "tracking_url" TEXT NOT NULL,
    "cta_text" TEXT NOT NULL,
    "disclosure_text" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "affiliate_offers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "affiliate_clicks" (
    "id" TEXT NOT NULL,
    "affiliate_offer_id" TEXT,
    "offer_slug" TEXT NOT NULL,
    "page_slug" TEXT NOT NULL,
    "position" TEXT NOT NULL,
    "clickref" TEXT NOT NULL,
    "device" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "affiliate_clicks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "affiliate_networks_code_key" ON "affiliate_networks"("code");

-- CreateIndex
CREATE INDEX "affiliate_programs_network_id_status_idx" ON "affiliate_programs"("network_id", "status");
CREATE UNIQUE INDEX "affiliate_programs_network_id_advertiser_id_key" ON "affiliate_programs"("network_id", "advertiser_id");

-- CreateIndex
CREATE UNIQUE INDEX "affiliate_offers_offer_slug_key" ON "affiliate_offers"("offer_slug");
CREATE INDEX "affiliate_offers_network_is_active_priority_idx" ON "affiliate_offers"("network", "is_active", "priority");
CREATE INDEX "affiliate_offers_product_type_is_active_idx" ON "affiliate_offers"("product_type", "is_active");
CREATE INDEX "affiliate_offers_advertiser_id_idx" ON "affiliate_offers"("advertiser_id");

-- CreateIndex
CREATE INDEX "affiliate_clicks_affiliate_offer_id_created_at_idx" ON "affiliate_clicks"("affiliate_offer_id", "created_at");
CREATE INDEX "affiliate_clicks_offer_slug_created_at_idx" ON "affiliate_clicks"("offer_slug", "created_at");
CREATE INDEX "affiliate_clicks_page_slug_created_at_idx" ON "affiliate_clicks"("page_slug", "created_at");

-- AddForeignKey
ALTER TABLE "affiliate_programs"
ADD CONSTRAINT "affiliate_programs_network_id_fkey"
FOREIGN KEY ("network_id") REFERENCES "affiliate_networks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "affiliate_offers"
ADD CONSTRAINT "affiliate_offers_network_id_fkey"
FOREIGN KEY ("network_id") REFERENCES "affiliate_networks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "affiliate_offers"
ADD CONSTRAINT "affiliate_offers_program_id_fkey"
FOREIGN KEY ("program_id") REFERENCES "affiliate_programs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "affiliate_clicks"
ADD CONSTRAINT "affiliate_clicks_affiliate_offer_id_fkey"
FOREIGN KEY ("affiliate_offer_id") REFERENCES "affiliate_offers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
