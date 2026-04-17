CREATE TYPE "ReactivationLeadStatus" AS ENUM ('imported', 'visited', 'consented', 'qualified', 'routed', 'rejected', 'expired');

CREATE TYPE "ReactivationPartnerMode" AS ENUM ('webhook', 'redirect', 'email', 'whatsapp');

CREATE TYPE "LgpdEventType" AS ENUM (
  'lead_imported',
  'link_generated',
  'page_viewed',
  'consent_granted',
  'consent_revoked',
  'form_submitted',
  'lead_scored',
  'partner_selected',
  'partner_routed',
  'partner_route_failed',
  'notification_sent',
  'token_expired',
  'data_exported'
);

CREATE TABLE "reactivation_leads" (
  "id" TEXT NOT NULL,
  "external_lead_id" TEXT,
  "batch_id" TEXT,
  "token_hash" TEXT NOT NULL,
  "token_last4" TEXT NOT NULL,
  "status" "ReactivationLeadStatus" NOT NULL DEFAULT 'imported',
  "full_name" TEXT,
  "email" TEXT,
  "phone" TEXT,
  "cpf_hash" TEXT,
  "product_type" "ProductType" NOT NULL DEFAULT 'loan',
  "source" TEXT,
  "segment" TEXT,
  "original_payload" JSONB,
  "consent_given_at" TIMESTAMP(3),
  "consent_ip" TEXT,
  "consent_user_agent" TEXT,
  "consent_version" TEXT,
  "requested_amount" DECIMAL(14,2),
  "income" DECIMAL(14,2),
  "employment_status" TEXT,
  "has_restriction" BOOLEAN,
  "score_value" INTEGER,
  "score_band" TEXT,
  "qualification" TEXT,
  "selected_partner_id" TEXT,
  "selected_partner_name" TEXT,
  "expires_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "reactivation_leads_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "reactivation_audit_events" (
  "id" TEXT NOT NULL,
  "lead_id" TEXT,
  "event_type" "LgpdEventType" NOT NULL,
  "actor" TEXT NOT NULL DEFAULT 'system',
  "ip_address" TEXT,
  "user_agent" TEXT,
  "source" TEXT,
  "metadata" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "reactivation_audit_events_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "reactivation_partner_deliveries" (
  "id" TEXT NOT NULL,
  "lead_id" TEXT NOT NULL,
  "partner_id" TEXT NOT NULL,
  "partner_name" TEXT NOT NULL,
  "mode" "ReactivationPartnerMode" NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "destination" TEXT,
  "request_payload" JSONB,
  "response_payload" JSONB,
  "error_message" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "reactivation_partner_deliveries_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "reactivation_leads_token_hash_key" ON "reactivation_leads"("token_hash");
CREATE INDEX "reactivation_leads_batch_id_status_idx" ON "reactivation_leads"("batch_id", "status");
CREATE INDEX "reactivation_leads_status_created_at_idx" ON "reactivation_leads"("status", "created_at");
CREATE INDEX "reactivation_leads_segment_idx" ON "reactivation_leads"("segment");
CREATE INDEX "reactivation_leads_selected_partner_id_created_at_idx" ON "reactivation_leads"("selected_partner_id", "created_at");
CREATE INDEX "reactivation_audit_events_lead_id_created_at_idx" ON "reactivation_audit_events"("lead_id", "created_at");
CREATE INDEX "reactivation_audit_events_event_type_created_at_idx" ON "reactivation_audit_events"("event_type", "created_at");
CREATE INDEX "reactivation_partner_deliveries_lead_id_created_at_idx" ON "reactivation_partner_deliveries"("lead_id", "created_at");
CREATE INDEX "reactivation_partner_deliveries_partner_id_status_idx" ON "reactivation_partner_deliveries"("partner_id", "status");
CREATE INDEX "reactivation_partner_deliveries_status_created_at_idx" ON "reactivation_partner_deliveries"("status", "created_at");

ALTER TABLE "reactivation_audit_events"
  ADD CONSTRAINT "reactivation_audit_events_lead_id_fkey"
  FOREIGN KEY ("lead_id") REFERENCES "reactivation_leads"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "reactivation_partner_deliveries"
  ADD CONSTRAINT "reactivation_partner_deliveries_lead_id_fkey"
  FOREIGN KEY ("lead_id") REFERENCES "reactivation_leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;
