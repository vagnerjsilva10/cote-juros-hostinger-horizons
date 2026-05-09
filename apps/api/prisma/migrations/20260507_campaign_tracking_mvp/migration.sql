CREATE TABLE IF NOT EXISTS "cta_clicks" (
  "id" TEXT NOT NULL,
  "click_id" TEXT NOT NULL,
  "lead_id" TEXT,
  "campaign_id" TEXT,
  "message_id" TEXT,
  "partner_id" TEXT,
  "affiliate_offer_id" TEXT,
  "source" TEXT NOT NULL DEFAULT 'email',
  "cta_type" TEXT,
  "destination_url" TEXT,
  "fallback_url" TEXT,
  "status" TEXT NOT NULL DEFAULT 'created',
  "clicked_at" TIMESTAMP(3),
  "metadata" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "cta_clicks_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "redirect_attempts" (
  "id" TEXT NOT NULL,
  "click_id" TEXT NOT NULL,
  "partner_id" TEXT,
  "destination_url" TEXT NOT NULL,
  "fallback_url" TEXT,
  "status" TEXT NOT NULL DEFAULT 'redirect_started',
  "http_status" INTEGER,
  "user_agent" TEXT,
  "ip_hash" TEXT,
  "referer" TEXT,
  "error_message" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "redirect_attempts_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "conversion_attributions" (
  "id" TEXT NOT NULL,
  "click_id" TEXT NOT NULL,
  "partner_id" TEXT,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "external_id" TEXT,
  "commission_value" DECIMAL(14,2),
  "contract_value" DECIMAL(14,2),
  "currency" TEXT NOT NULL DEFAULT 'BRL',
  "raw_payload" JSONB,
  "converted_at" TIMESTAMP(3),
  "received_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "conversion_attributions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "cta_clicks_click_id_key" ON "cta_clicks"("click_id");
CREATE INDEX IF NOT EXISTS "cta_clicks_campaign_id_created_at_idx" ON "cta_clicks"("campaign_id", "created_at");
CREATE INDEX IF NOT EXISTS "cta_clicks_lead_id_created_at_idx" ON "cta_clicks"("lead_id", "created_at");
CREATE INDEX IF NOT EXISTS "cta_clicks_message_id_idx" ON "cta_clicks"("message_id");
CREATE INDEX IF NOT EXISTS "cta_clicks_partner_id_idx" ON "cta_clicks"("partner_id");
CREATE INDEX IF NOT EXISTS "cta_clicks_status_created_at_idx" ON "cta_clicks"("status", "created_at");
CREATE INDEX IF NOT EXISTS "redirect_attempts_click_id_created_at_idx" ON "redirect_attempts"("click_id", "created_at");
CREATE INDEX IF NOT EXISTS "redirect_attempts_partner_id_created_at_idx" ON "redirect_attempts"("partner_id", "created_at");
CREATE INDEX IF NOT EXISTS "redirect_attempts_status_created_at_idx" ON "redirect_attempts"("status", "created_at");
CREATE INDEX IF NOT EXISTS "conversion_attributions_click_id_idx" ON "conversion_attributions"("click_id");
CREATE INDEX IF NOT EXISTS "conversion_attributions_partner_id_status_idx" ON "conversion_attributions"("partner_id", "status");
CREATE INDEX IF NOT EXISTS "conversion_attributions_received_at_idx" ON "conversion_attributions"("received_at");

ALTER TABLE "cta_clicks"
  ADD CONSTRAINT "cta_clicks_lead_id_fkey"
  FOREIGN KEY ("lead_id") REFERENCES "reactivation_leads"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "cta_clicks"
  ADD CONSTRAINT "cta_clicks_message_id_fkey"
  FOREIGN KEY ("message_id") REFERENCES "reactivation_email_messages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "cta_clicks"
  ADD CONSTRAINT "cta_clicks_partner_id_fkey"
  FOREIGN KEY ("partner_id") REFERENCES "partner_configs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "cta_clicks"
  ADD CONSTRAINT "cta_clicks_affiliate_offer_id_fkey"
  FOREIGN KEY ("affiliate_offer_id") REFERENCES "affiliate_offers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "redirect_attempts"
  ADD CONSTRAINT "redirect_attempts_click_id_fkey"
  FOREIGN KEY ("click_id") REFERENCES "cta_clicks"("click_id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "redirect_attempts"
  ADD CONSTRAINT "redirect_attempts_partner_id_fkey"
  FOREIGN KEY ("partner_id") REFERENCES "partner_configs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "conversion_attributions"
  ADD CONSTRAINT "conversion_attributions_click_id_fkey"
  FOREIGN KEY ("click_id") REFERENCES "cta_clicks"("click_id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "conversion_attributions"
  ADD CONSTRAINT "conversion_attributions_partner_id_fkey"
  FOREIGN KEY ("partner_id") REFERENCES "partner_configs"("id") ON DELETE SET NULL ON UPDATE CASCADE;
