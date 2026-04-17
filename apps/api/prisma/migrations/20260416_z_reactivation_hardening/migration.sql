ALTER TYPE "ReactivationLeadStatus" ADD VALUE IF NOT EXISTS 'pending_delivery';
ALTER TYPE "ReactivationLeadStatus" ADD VALUE IF NOT EXISTS 'delivery_retrying';
ALTER TYPE "ReactivationLeadStatus" ADD VALUE IF NOT EXISTS 'delivery_failed';
ALTER TYPE "ReactivationLeadStatus" ADD VALUE IF NOT EXISTS 'delivery_success';
ALTER TYPE "ReactivationLeadStatus" ADD VALUE IF NOT EXISTS 'revoked';
ALTER TYPE "ReactivationLeadStatus" ADD VALUE IF NOT EXISTS 'suppressed';

ALTER TYPE "LgpdEventType" ADD VALUE IF NOT EXISTS 'token_regenerated';
ALTER TYPE "LgpdEventType" ADD VALUE IF NOT EXISTS 'token_revoked';
ALTER TYPE "LgpdEventType" ADD VALUE IF NOT EXISTS 'consent_refused';
ALTER TYPE "LgpdEventType" ADD VALUE IF NOT EXISTS 'opt_out_registered';
ALTER TYPE "LgpdEventType" ADD VALUE IF NOT EXISTS 'duplicate_submit_ignored';
ALTER TYPE "LgpdEventType" ADD VALUE IF NOT EXISTS 'delivery_retry_scheduled';
ALTER TYPE "LgpdEventType" ADD VALUE IF NOT EXISTS 'suppression_checked';

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ReactivationSuppressionScope') THEN
    CREATE TYPE "ReactivationSuppressionScope" AS ENUM (
      'unsubscribe_email',
      'unsubscribe_whatsapp',
      'dnc_global',
      'revoked_consent'
    );
  END IF;
END $$;

ALTER TABLE "reactivation_leads"
  ADD COLUMN IF NOT EXISTS "token_revoked_at" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "token_regenerated_at" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "last_used_at" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "consent_refused_at" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "consent_revoked_at" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "privacy_policy_version" TEXT,
  ADD COLUMN IF NOT EXISTS "consent_source" TEXT,
  ADD COLUMN IF NOT EXISTS "opt_out_reason" TEXT,
  ADD COLUMN IF NOT EXISTS "has_guarantee" BOOLEAN,
  ADD COLUMN IF NOT EXISTS "guarantee_type" TEXT,
  ADD COLUMN IF NOT EXISTS "idempotency_key" TEXT,
  ADD COLUMN IF NOT EXISTS "submission_hash" TEXT,
  ADD COLUMN IF NOT EXISTS "submitted_at" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "processing_lock_id" TEXT,
  ADD COLUMN IF NOT EXISTS "processing_started_at" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "processing_expires_at" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "delivery_status" TEXT,
  ADD COLUMN IF NOT EXISTS "delivered_at" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "estimated_revenue_cents" INTEGER,
  ADD COLUMN IF NOT EXISTS "payout_cents" INTEGER;

ALTER TABLE "reactivation_audit_events"
  ADD COLUMN IF NOT EXISTS "idempotency_key" TEXT;

ALTER TABLE "reactivation_partner_deliveries"
  ADD COLUMN IF NOT EXISTS "idempotency_key" TEXT,
  ADD COLUMN IF NOT EXISTS "retry_count" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "next_attempt_at" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "last_attempt_at" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "delivered_at" TIMESTAMP(3);

UPDATE "reactivation_partner_deliveries"
SET "idempotency_key" = 'legacy:' || "lead_id" || ':' || "partner_id" || ':' || "id"
WHERE "idempotency_key" IS NULL;

ALTER TABLE "reactivation_partner_deliveries"
  ALTER COLUMN "idempotency_key" SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "reactivation_leads_idempotency_key_key"
  ON "reactivation_leads"("idempotency_key");
CREATE INDEX IF NOT EXISTS "reactivation_leads_processing_lock_id_idx"
  ON "reactivation_leads"("processing_lock_id");
CREATE INDEX IF NOT EXISTS "reactivation_leads_delivery_status_updated_at_idx"
  ON "reactivation_leads"("delivery_status", "updated_at");
CREATE UNIQUE INDEX IF NOT EXISTS "reactivation_audit_events_idempotency_key_key"
  ON "reactivation_audit_events"("idempotency_key");
CREATE UNIQUE INDEX IF NOT EXISTS "reactivation_partner_deliveries_idempotency_key_key"
  ON "reactivation_partner_deliveries"("idempotency_key");
CREATE INDEX IF NOT EXISTS "reactivation_partner_deliveries_next_attempt_at_status_idx"
  ON "reactivation_partner_deliveries"("next_attempt_at", "status");
CREATE UNIQUE INDEX IF NOT EXISTS "reactivation_partner_deliveries_lead_id_partner_id_key"
  ON "reactivation_partner_deliveries"("lead_id", "partner_id");

CREATE TABLE IF NOT EXISTS "reactivation_suppressions" (
  "id" TEXT NOT NULL,
  "scope" "ReactivationSuppressionScope" NOT NULL,
  "email_hash" TEXT,
  "phone_hash" TEXT,
  "cpf_hash" TEXT,
  "reason" TEXT,
  "source" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "reactivation_suppressions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "reactivation_suppressions_scope_created_at_idx"
  ON "reactivation_suppressions"("scope", "created_at");
CREATE INDEX IF NOT EXISTS "reactivation_suppressions_email_hash_scope_idx"
  ON "reactivation_suppressions"("email_hash", "scope");
CREATE INDEX IF NOT EXISTS "reactivation_suppressions_phone_hash_scope_idx"
  ON "reactivation_suppressions"("phone_hash", "scope");
CREATE INDEX IF NOT EXISTS "reactivation_suppressions_cpf_hash_scope_idx"
  ON "reactivation_suppressions"("cpf_hash", "scope");
CREATE UNIQUE INDEX IF NOT EXISTS "reactivation_suppressions_email_hash_scope_key"
  ON "reactivation_suppressions"("email_hash", "scope");
CREATE UNIQUE INDEX IF NOT EXISTS "reactivation_suppressions_phone_hash_scope_key"
  ON "reactivation_suppressions"("phone_hash", "scope");
CREATE UNIQUE INDEX IF NOT EXISTS "reactivation_suppressions_cpf_hash_scope_key"
  ON "reactivation_suppressions"("cpf_hash", "scope");
