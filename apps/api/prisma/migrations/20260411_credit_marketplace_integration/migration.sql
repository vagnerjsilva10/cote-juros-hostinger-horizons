-- CreateTable
CREATE TABLE "credit_leads" (
    "id" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "cpf" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "requested_amount" DECIMAL(14,2),
    "income" DECIMAL(14,2),
    "score_range" TEXT,
    "employment_status" TEXT,
    "has_restriction" BOOLEAN,
    "product_type" "ProductType" NOT NULL,
    "source_page" TEXT,
    "utm_source" TEXT,
    "utm_medium" TEXT,
    "utm_campaign" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "credit_leads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "credit_provider_sessions" (
    "id" TEXT NOT NULL,
    "lead_id" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'juros_baixos',
    "external_user_id" TEXT,
    "external_session_id" TEXT,
    "external_jwt" TEXT,
    "token_expires_at" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'pending',
    "last_error" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "credit_provider_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "credit_simulations" (
    "id" TEXT NOT NULL,
    "lead_id" TEXT NOT NULL,
    "provider_session_id" TEXT,
    "provider" TEXT NOT NULL DEFAULT 'juros_baixos',
    "external_simulation_id" TEXT,
    "requested_amount" DECIMAL(14,2),
    "installments" INTEGER,
    "product_type" "ProductType" NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "raw_request" JSONB,
    "raw_response" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "credit_simulations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "credit_offer_snapshots" (
    "id" TEXT NOT NULL,
    "simulation_id" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'juros_baixos',
    "external_offer_id" TEXT,
    "bank_name" TEXT NOT NULL,
    "product_name" TEXT NOT NULL,
    "monthly_rate" DECIMAL(10,4),
    "cet" DECIMAL(10,4),
    "installment_amount" DECIMAL(14,2),
    "total_amount" DECIMAL(14,2),
    "approved_amount" DECIMAL(14,2),
    "term_months" INTEGER,
    "redirect_url" TEXT,
    "ranking_score" DECIMAL(10,4),
    "match_label" TEXT,
    "raw_payload" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "credit_offer_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "credit_conversions" (
    "id" TEXT NOT NULL,
    "simulation_id" TEXT NOT NULL,
    "offer_snapshot_id" TEXT,
    "provider" TEXT NOT NULL DEFAULT 'juros_baixos',
    "external_conversion_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "commission_amount" DECIMAL(14,2),
    "converted_at" TIMESTAMP(3),
    "raw_payload" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "credit_conversions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "credit_offer_clicks" (
    "id" TEXT NOT NULL,
    "simulation_id" TEXT NOT NULL,
    "offer_snapshot_id" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'juros_baixos',
    "source_page" TEXT NOT NULL,
    "utm_source" TEXT,
    "utm_medium" TEXT,
    "utm_campaign" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "credit_offer_clicks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "credit_leads_cpf_idx" ON "credit_leads"("cpf");
CREATE INDEX "credit_leads_product_type_created_at_idx" ON "credit_leads"("product_type", "created_at");
CREATE INDEX "credit_leads_source_page_created_at_idx" ON "credit_leads"("source_page", "created_at");

-- CreateIndex
CREATE INDEX "credit_provider_sessions_lead_id_provider_idx" ON "credit_provider_sessions"("lead_id", "provider");
CREATE INDEX "credit_provider_sessions_status_updated_at_idx" ON "credit_provider_sessions"("status", "updated_at");
CREATE UNIQUE INDEX "credit_provider_sessions_provider_external_user_id_key" ON "credit_provider_sessions"("provider", "external_user_id");
CREATE UNIQUE INDEX "credit_provider_sessions_provider_external_session_id_key" ON "credit_provider_sessions"("provider", "external_session_id");

-- CreateIndex
CREATE INDEX "credit_simulations_lead_id_created_at_idx" ON "credit_simulations"("lead_id", "created_at");
CREATE INDEX "credit_simulations_provider_session_id_created_at_idx" ON "credit_simulations"("provider_session_id", "created_at");
CREATE INDEX "credit_simulations_provider_status_created_at_idx" ON "credit_simulations"("provider", "status", "created_at");
CREATE UNIQUE INDEX "credit_simulations_provider_external_simulation_id_key" ON "credit_simulations"("provider", "external_simulation_id");

-- CreateIndex
CREATE INDEX "credit_offer_snapshots_simulation_id_created_at_idx" ON "credit_offer_snapshots"("simulation_id", "created_at");
CREATE INDEX "credit_offer_snapshots_provider_bank_name_idx" ON "credit_offer_snapshots"("provider", "bank_name");
CREATE UNIQUE INDEX "credit_offer_snapshots_simulation_id_external_offer_id_key" ON "credit_offer_snapshots"("simulation_id", "external_offer_id");

-- CreateIndex
CREATE INDEX "credit_conversions_simulation_id_created_at_idx" ON "credit_conversions"("simulation_id", "created_at");
CREATE INDEX "credit_conversions_status_converted_at_idx" ON "credit_conversions"("status", "converted_at");
CREATE UNIQUE INDEX "credit_conversions_provider_external_conversion_id_key" ON "credit_conversions"("provider", "external_conversion_id");

-- CreateIndex
CREATE INDEX "credit_offer_clicks_simulation_id_created_at_idx" ON "credit_offer_clicks"("simulation_id", "created_at");
CREATE INDEX "credit_offer_clicks_offer_snapshot_id_created_at_idx" ON "credit_offer_clicks"("offer_snapshot_id", "created_at");
CREATE INDEX "credit_offer_clicks_provider_created_at_idx" ON "credit_offer_clicks"("provider", "created_at");

-- AddForeignKey
ALTER TABLE "credit_provider_sessions"
ADD CONSTRAINT "credit_provider_sessions_lead_id_fkey"
FOREIGN KEY ("lead_id") REFERENCES "credit_leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credit_simulations"
ADD CONSTRAINT "credit_simulations_lead_id_fkey"
FOREIGN KEY ("lead_id") REFERENCES "credit_leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "credit_simulations"
ADD CONSTRAINT "credit_simulations_provider_session_id_fkey"
FOREIGN KEY ("provider_session_id") REFERENCES "credit_provider_sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credit_offer_snapshots"
ADD CONSTRAINT "credit_offer_snapshots_simulation_id_fkey"
FOREIGN KEY ("simulation_id") REFERENCES "credit_simulations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credit_conversions"
ADD CONSTRAINT "credit_conversions_simulation_id_fkey"
FOREIGN KEY ("simulation_id") REFERENCES "credit_simulations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "credit_conversions"
ADD CONSTRAINT "credit_conversions_offer_snapshot_id_fkey"
FOREIGN KEY ("offer_snapshot_id") REFERENCES "credit_offer_snapshots"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credit_offer_clicks"
ADD CONSTRAINT "credit_offer_clicks_simulation_id_fkey"
FOREIGN KEY ("simulation_id") REFERENCES "credit_simulations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "credit_offer_clicks"
ADD CONSTRAINT "credit_offer_clicks_offer_snapshot_id_fkey"
FOREIGN KEY ("offer_snapshot_id") REFERENCES "credit_offer_snapshots"("id") ON DELETE CASCADE ON UPDATE CASCADE;
