ALTER TABLE "partner_configs"
  ADD COLUMN IF NOT EXISTS "product_type" TEXT,
  ADD COLUMN IF NOT EXISTS "action_type" TEXT,
  ADD COLUMN IF NOT EXISTS "affiliate_url" TEXT,
  ADD COLUMN IF NOT EXISTS "is_active" BOOLEAN NOT NULL DEFAULT true;

CREATE TABLE IF NOT EXISTS "partner_clicks" (
  "id" TEXT NOT NULL,
  "click_id" TEXT NOT NULL,
  "partner_id" TEXT NOT NULL,
  "simulation_id" TEXT,
  "lead_id" TEXT,
  "source_page" TEXT NOT NULL,
  "utm_source" TEXT,
  "utm_medium" TEXT,
  "utm_campaign" TEXT,
  "utm_content" TEXT,
  "utm_term" TEXT,
  "redirect_url" TEXT NOT NULL,
  "user_agent" TEXT,
  "ip_hash" TEXT,
  "status" TEXT NOT NULL DEFAULT 'redirect_started',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "partner_clicks_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "partner_conversions" (
  "id" TEXT NOT NULL,
  "click_id" TEXT NOT NULL,
  "partner_id" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "external_id" TEXT,
  "commission_value" DECIMAL(14,2),
  "contract_value" DECIMAL(14,2),
  "raw_payload" JSONB,
  "received_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "partner_conversions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "partner_clicks_click_id_key" ON "partner_clicks"("click_id");
CREATE INDEX IF NOT EXISTS "partner_configs_is_active_priority_idx" ON "partner_configs"("is_active", "priority");
CREATE INDEX IF NOT EXISTS "partner_configs_product_type_is_active_idx" ON "partner_configs"("product_type", "is_active");
CREATE INDEX IF NOT EXISTS "partner_clicks_partner_id_created_at_idx" ON "partner_clicks"("partner_id", "created_at");
CREATE INDEX IF NOT EXISTS "partner_clicks_simulation_id_idx" ON "partner_clicks"("simulation_id");
CREATE INDEX IF NOT EXISTS "partner_clicks_lead_id_idx" ON "partner_clicks"("lead_id");
CREATE INDEX IF NOT EXISTS "partner_clicks_source_page_idx" ON "partner_clicks"("source_page");
CREATE INDEX IF NOT EXISTS "partner_clicks_status_created_at_idx" ON "partner_clicks"("status", "created_at");
CREATE UNIQUE INDEX IF NOT EXISTS "partner_conversions_partner_id_external_id_key" ON "partner_conversions"("partner_id", "external_id");
CREATE INDEX IF NOT EXISTS "partner_conversions_click_id_idx" ON "partner_conversions"("click_id");
CREATE INDEX IF NOT EXISTS "partner_conversions_partner_id_status_idx" ON "partner_conversions"("partner_id", "status");
CREATE INDEX IF NOT EXISTS "partner_conversions_received_at_idx" ON "partner_conversions"("received_at");

ALTER TABLE "partner_clicks"
  ADD CONSTRAINT "partner_clicks_partner_id_fkey"
  FOREIGN KEY ("partner_id") REFERENCES "partner_configs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "partner_clicks"
  ADD CONSTRAINT "partner_clicks_simulation_id_fkey"
  FOREIGN KEY ("simulation_id") REFERENCES "simulation_leads"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "partner_conversions"
  ADD CONSTRAINT "partner_conversions_click_id_fkey"
  FOREIGN KEY ("click_id") REFERENCES "partner_clicks"("click_id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "partner_conversions"
  ADD CONSTRAINT "partner_conversions_partner_id_fkey"
  FOREIGN KEY ("partner_id") REFERENCES "partner_configs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO "partner_configs" (
  "id",
  "name",
  "slug",
  "integration_type",
  "tracking_link",
  "affiliate_url",
  "product_type",
  "action_type",
  "is_active",
  "product_types",
  "status",
  "health_status",
  "priority",
  "weight",
  "metadata",
  "created_at",
  "updated_at"
)
VALUES (
  'partner_upp',
  'Up.p',
  'upp',
  'tracking_link',
  'https://upp.com.br/?m=la567e',
  'https://upp.com.br/?m=la567e',
  'fgts',
  'redirect',
  true,
  ARRAY[]::"ProductType"[],
  'active',
  'healthy',
  20,
  1,
  '{
    "description": "Opcao de FGTS e credito rapido com analise do parceiro.",
    "highlights": [
      "Pode aparecer para negativado ou credito rapido",
      "Condicoes sujeitas ao parceiro"
    ],
    "ctaText": "Ver opcao de FGTS",
    "eventType": "click_partner_upp",
    "acceptsXtra": true
  }'::jsonb,
  now(),
  now()
)
ON CONFLICT ("slug") DO UPDATE SET
  "name" = EXCLUDED."name",
  "integration_type" = EXCLUDED."integration_type",
  "tracking_link" = EXCLUDED."tracking_link",
  "affiliate_url" = EXCLUDED."affiliate_url",
  "product_type" = EXCLUDED."product_type",
  "action_type" = EXCLUDED."action_type",
  "is_active" = EXCLUDED."is_active",
  "status" = EXCLUDED."status",
  "health_status" = EXCLUDED."health_status",
  "priority" = EXCLUDED."priority",
  "metadata" = EXCLUDED."metadata",
  "updated_at" = now();
