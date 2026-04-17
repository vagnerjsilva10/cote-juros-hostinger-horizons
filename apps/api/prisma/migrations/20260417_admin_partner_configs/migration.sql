CREATE TYPE "PartnerIntegrationType" AS ENUM ('tracking_link', 'webhook', 'api', 'manual');

CREATE TABLE "partner_configs" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "bank_id" TEXT,
  "integration_type" "PartnerIntegrationType" NOT NULL DEFAULT 'tracking_link',
  "tracking_link" TEXT,
  "webhook_url" TEXT,
  "api_base_url" TEXT,
  "product_types" "ProductType"[] DEFAULT ARRAY[]::"ProductType"[],
  "status" "RecordStatus" NOT NULL DEFAULT 'active',
  "health_status" TEXT NOT NULL DEFAULT 'unknown',
  "priority" INTEGER NOT NULL DEFAULT 50,
  "weight" INTEGER NOT NULL DEFAULT 1,
  "fallback_partner_id" TEXT,
  "daily_limit" INTEGER,
  "monthly_limit" INTEGER,
  "sla_minutes" INTEGER,
  "payout_lead_cents" INTEGER,
  "payout_conversion_cents" INTEGER,
  "internal_notes" TEXT,
  "metadata" JSONB,
  "last_health_check_at" TIMESTAMP(3),
  "last_error_at" TIMESTAMP(3),
  "last_error_message" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "partner_configs_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "partner_configs_slug_key" ON "partner_configs"("slug");
CREATE INDEX "partner_configs_status_health_status_idx" ON "partner_configs"("status", "health_status");
CREATE INDEX "partner_configs_bank_id_status_idx" ON "partner_configs"("bank_id", "status");
CREATE INDEX "partner_configs_integration_type_status_idx" ON "partner_configs"("integration_type", "status");

ALTER TABLE "partner_configs"
ADD CONSTRAINT "partner_configs_bank_id_fkey"
FOREIGN KEY ("bank_id") REFERENCES "banks"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "partner_configs"
ADD CONSTRAINT "partner_configs_fallback_partner_id_fkey"
FOREIGN KEY ("fallback_partner_id") REFERENCES "partner_configs"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
