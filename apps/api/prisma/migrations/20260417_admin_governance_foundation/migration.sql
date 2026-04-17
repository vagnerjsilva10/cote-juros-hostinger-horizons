DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'AdminUserStatus') THEN
    CREATE TYPE "AdminUserStatus" AS ENUM ('active', 'invited', 'disabled');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'AdminSessionStatus') THEN
    CREATE TYPE "AdminSessionStatus" AS ENUM ('active', 'revoked', 'expired');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'LeadSuppressionScope') THEN
    CREATE TYPE "LeadSuppressionScope" AS ENUM ('manual', 'invalid', 'duplicated', 'opt_out', 'blocked');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "admin_users" (
  "id" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "full_name" TEXT NOT NULL,
  "password_hash" TEXT NOT NULL,
  "status" "AdminUserStatus" NOT NULL DEFAULT 'active',
  "last_login_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "admin_users_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "admin_users_email_key" ON "admin_users"("email");
CREATE INDEX IF NOT EXISTS "admin_users_status_created_at_idx" ON "admin_users"("status", "created_at");

CREATE TABLE IF NOT EXISTS "admin_roles" (
  "id" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "is_system" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "admin_roles_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "admin_roles_code_key" ON "admin_roles"("code");

CREATE TABLE IF NOT EXISTS "admin_permissions" (
  "id" TEXT NOT NULL,
  "resource" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "description" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "admin_permissions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "admin_permissions_resource_action_key" ON "admin_permissions"("resource", "action");
CREATE INDEX IF NOT EXISTS "admin_permissions_resource_action_idx" ON "admin_permissions"("resource", "action");

CREATE TABLE IF NOT EXISTS "admin_role_permissions" (
  "id" TEXT NOT NULL,
  "role_id" TEXT NOT NULL,
  "permission_id" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "admin_role_permissions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "admin_role_permissions_role_id_permission_id_key" ON "admin_role_permissions"("role_id", "permission_id");
CREATE INDEX IF NOT EXISTS "admin_role_permissions_permission_id_idx" ON "admin_role_permissions"("permission_id");

ALTER TABLE "admin_role_permissions"
  ADD CONSTRAINT "admin_role_permissions_role_id_fkey"
  FOREIGN KEY ("role_id") REFERENCES "admin_roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "admin_role_permissions"
  ADD CONSTRAINT "admin_role_permissions_permission_id_fkey"
  FOREIGN KEY ("permission_id") REFERENCES "admin_permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "admin_user_roles" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "role_id" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "admin_user_roles_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "admin_user_roles_user_id_role_id_key" ON "admin_user_roles"("user_id", "role_id");
CREATE INDEX IF NOT EXISTS "admin_user_roles_role_id_idx" ON "admin_user_roles"("role_id");

ALTER TABLE "admin_user_roles"
  ADD CONSTRAINT "admin_user_roles_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "admin_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "admin_user_roles"
  ADD CONSTRAINT "admin_user_roles_role_id_fkey"
  FOREIGN KEY ("role_id") REFERENCES "admin_roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "admin_sessions" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "session_hash" TEXT NOT NULL,
  "status" "AdminSessionStatus" NOT NULL DEFAULT 'active',
  "ip_address" TEXT,
  "user_agent" TEXT,
  "last_seen_at" TIMESTAMP(3),
  "expires_at" TIMESTAMP(3) NOT NULL,
  "revoked_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "admin_sessions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "admin_sessions_session_hash_key" ON "admin_sessions"("session_hash");
CREATE INDEX IF NOT EXISTS "admin_sessions_user_id_status_idx" ON "admin_sessions"("user_id", "status");
CREATE INDEX IF NOT EXISTS "admin_sessions_status_expires_at_idx" ON "admin_sessions"("status", "expires_at");

ALTER TABLE "admin_sessions"
  ADD CONSTRAINT "admin_sessions_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "admin_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "admin_login_attempts" (
  "id" TEXT NOT NULL,
  "user_id" TEXT,
  "email" TEXT,
  "ip_address" TEXT,
  "user_agent" TEXT,
  "success" BOOLEAN NOT NULL DEFAULT false,
  "failure_reason" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "admin_login_attempts_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "admin_login_attempts_email_created_at_idx" ON "admin_login_attempts"("email", "created_at");
CREATE INDEX IF NOT EXISTS "admin_login_attempts_ip_address_created_at_idx" ON "admin_login_attempts"("ip_address", "created_at");

ALTER TABLE "admin_login_attempts"
  ADD CONSTRAINT "admin_login_attempts_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "admin_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "admin_password_reset_tokens" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "token_hash" TEXT NOT NULL,
  "expires_at" TIMESTAMP(3) NOT NULL,
  "used_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "admin_password_reset_tokens_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "admin_password_reset_tokens_token_hash_key" ON "admin_password_reset_tokens"("token_hash");
CREATE INDEX IF NOT EXISTS "admin_password_reset_tokens_user_id_expires_at_idx" ON "admin_password_reset_tokens"("user_id", "expires_at");

ALTER TABLE "admin_password_reset_tokens"
  ADD CONSTRAINT "admin_password_reset_tokens_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "admin_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "admin_audit_logs" (
  "id" TEXT NOT NULL,
  "actor_user_id" TEXT,
  "actor_email" TEXT,
  "action" TEXT NOT NULL,
  "resource" TEXT NOT NULL,
  "resource_id" TEXT,
  "before" JSONB,
  "after" JSONB,
  "metadata" JSONB,
  "ip_address" TEXT,
  "user_agent" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "admin_audit_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "admin_audit_logs_resource_resource_id_created_at_idx" ON "admin_audit_logs"("resource", "resource_id", "created_at");
CREATE INDEX IF NOT EXISTS "admin_audit_logs_action_created_at_idx" ON "admin_audit_logs"("action", "created_at");
CREATE INDEX IF NOT EXISTS "admin_audit_logs_actor_user_id_created_at_idx" ON "admin_audit_logs"("actor_user_id", "created_at");

ALTER TABLE "admin_audit_logs"
  ADD CONSTRAINT "admin_audit_logs_actor_user_id_fkey"
  FOREIGN KEY ("actor_user_id") REFERENCES "admin_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "feature_flags" (
  "id" TEXT NOT NULL,
  "key" TEXT NOT NULL,
  "description" TEXT,
  "enabled" BOOLEAN NOT NULL DEFAULT false,
  "payload" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "feature_flags_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "feature_flags_key_key" ON "feature_flags"("key");

CREATE TABLE IF NOT EXISTS "lead_tags" (
  "id" TEXT NOT NULL,
  "key" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "color" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "lead_tags_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "lead_tags_key_key" ON "lead_tags"("key");

CREATE TABLE IF NOT EXISTS "lead_tag_assignments" (
  "id" TEXT NOT NULL,
  "lead_id" TEXT NOT NULL,
  "tag_id" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "lead_tag_assignments_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "lead_tag_assignments_lead_id_tag_id_key" ON "lead_tag_assignments"("lead_id", "tag_id");
CREATE INDEX IF NOT EXISTS "lead_tag_assignments_tag_id_idx" ON "lead_tag_assignments"("tag_id");

ALTER TABLE "lead_tag_assignments"
  ADD CONSTRAINT "lead_tag_assignments_lead_id_fkey"
  FOREIGN KEY ("lead_id") REFERENCES "simulation_leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "lead_tag_assignments"
  ADD CONSTRAINT "lead_tag_assignments_tag_id_fkey"
  FOREIGN KEY ("tag_id") REFERENCES "lead_tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "lead_owner_assignments" (
  "id" TEXT NOT NULL,
  "lead_id" TEXT NOT NULL,
  "owner_user_id" TEXT NOT NULL,
  "note" TEXT,
  "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "lead_owner_assignments_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "lead_owner_assignments_lead_id_key" ON "lead_owner_assignments"("lead_id");
CREATE INDEX IF NOT EXISTS "lead_owner_assignments_owner_user_id_assigned_at_idx" ON "lead_owner_assignments"("owner_user_id", "assigned_at");

ALTER TABLE "lead_owner_assignments"
  ADD CONSTRAINT "lead_owner_assignments_lead_id_fkey"
  FOREIGN KEY ("lead_id") REFERENCES "simulation_leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "lead_owner_assignments"
  ADD CONSTRAINT "lead_owner_assignments_owner_user_id_fkey"
  FOREIGN KEY ("owner_user_id") REFERENCES "admin_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "lead_notes" (
  "id" TEXT NOT NULL,
  "lead_id" TEXT NOT NULL,
  "author_user_id" TEXT,
  "body" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "lead_notes_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "lead_notes_lead_id_created_at_idx" ON "lead_notes"("lead_id", "created_at");

ALTER TABLE "lead_notes"
  ADD CONSTRAINT "lead_notes_lead_id_fkey"
  FOREIGN KEY ("lead_id") REFERENCES "simulation_leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "lead_notes"
  ADD CONSTRAINT "lead_notes_author_user_id_fkey"
  FOREIGN KEY ("author_user_id") REFERENCES "admin_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "lead_merges" (
  "id" TEXT NOT NULL,
  "primary_lead_id" TEXT NOT NULL,
  "merged_lead_id" TEXT NOT NULL,
  "merged_by_user_id" TEXT,
  "reason" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "lead_merges_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "lead_merges_merged_lead_id_key" ON "lead_merges"("merged_lead_id");
CREATE INDEX IF NOT EXISTS "lead_merges_primary_lead_id_created_at_idx" ON "lead_merges"("primary_lead_id", "created_at");

ALTER TABLE "lead_merges"
  ADD CONSTRAINT "lead_merges_primary_lead_id_fkey"
  FOREIGN KEY ("primary_lead_id") REFERENCES "simulation_leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "lead_merges"
  ADD CONSTRAINT "lead_merges_merged_lead_id_fkey"
  FOREIGN KEY ("merged_lead_id") REFERENCES "simulation_leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "lead_merges"
  ADD CONSTRAINT "lead_merges_merged_by_user_id_fkey"
  FOREIGN KEY ("merged_by_user_id") REFERENCES "admin_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "lead_routing_decisions" (
  "id" TEXT NOT NULL,
  "lead_id" TEXT NOT NULL,
  "route_type" TEXT,
  "input_snapshot" JSONB,
  "rule_matched" TEXT,
  "partner_id" TEXT,
  "partner_name" TEXT,
  "fallback_used" BOOLEAN NOT NULL DEFAULT false,
  "reason" TEXT,
  "score_value" INTEGER,
  "score_band" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "lead_routing_decisions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "lead_routing_decisions_lead_id_created_at_idx" ON "lead_routing_decisions"("lead_id", "created_at");
CREATE INDEX IF NOT EXISTS "lead_routing_decisions_partner_id_created_at_idx" ON "lead_routing_decisions"("partner_id", "created_at");

ALTER TABLE "lead_routing_decisions"
  ADD CONSTRAINT "lead_routing_decisions_lead_id_fkey"
  FOREIGN KEY ("lead_id") REFERENCES "simulation_leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "lead_delivery_attempts" (
  "id" TEXT NOT NULL,
  "lead_id" TEXT NOT NULL,
  "partner_id" TEXT,
  "partner_name" TEXT,
  "mode" TEXT,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "request_payload" JSONB,
  "response_payload" JSONB,
  "error_message" TEXT,
  "attempted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "lead_delivery_attempts_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "lead_delivery_attempts_lead_id_attempted_at_idx" ON "lead_delivery_attempts"("lead_id", "attempted_at");
CREATE INDEX IF NOT EXISTS "lead_delivery_attempts_partner_id_status_idx" ON "lead_delivery_attempts"("partner_id", "status");

ALTER TABLE "lead_delivery_attempts"
  ADD CONSTRAINT "lead_delivery_attempts_lead_id_fkey"
  FOREIGN KEY ("lead_id") REFERENCES "simulation_leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "lead_suppressions" (
  "id" TEXT NOT NULL,
  "lead_id" TEXT,
  "scope" "LeadSuppressionScope" NOT NULL DEFAULT 'manual',
  "reason" TEXT,
  "source" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "lead_suppressions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "lead_suppressions_lead_id_created_at_idx" ON "lead_suppressions"("lead_id", "created_at");
CREATE INDEX IF NOT EXISTS "lead_suppressions_scope_created_at_idx" ON "lead_suppressions"("scope", "created_at");

ALTER TABLE "lead_suppressions"
  ADD CONSTRAINT "lead_suppressions_lead_id_fkey"
  FOREIGN KEY ("lead_id") REFERENCES "simulation_leads"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "lead_score_snapshots" (
  "id" TEXT NOT NULL,
  "lead_id" TEXT NOT NULL,
  "product_type" "ProductType",
  "score_value" INTEGER NOT NULL,
  "normalized_score" INTEGER,
  "eligibility_score" INTEGER,
  "propensity_score" INTEGER,
  "explanation" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "lead_score_snapshots_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "lead_score_snapshots_lead_id_created_at_idx" ON "lead_score_snapshots"("lead_id", "created_at");
CREATE INDEX IF NOT EXISTS "lead_score_snapshots_product_type_created_at_idx" ON "lead_score_snapshots"("product_type", "created_at");

ALTER TABLE "lead_score_snapshots"
  ADD CONSTRAINT "lead_score_snapshots_lead_id_fkey"
  FOREIGN KEY ("lead_id") REFERENCES "simulation_leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "partner_payout_rules" (
  "id" TEXT NOT NULL,
  "partner_id" TEXT NOT NULL,
  "product_type" "ProductType",
  "payout_type" TEXT NOT NULL DEFAULT 'lead',
  "amount_cents" INTEGER NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'active',
  "metadata" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "partner_payout_rules_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "partner_payout_rules_partner_id_status_idx" ON "partner_payout_rules"("partner_id", "status");
CREATE INDEX IF NOT EXISTS "partner_payout_rules_product_type_status_idx" ON "partner_payout_rules"("product_type", "status");

CREATE TABLE IF NOT EXISTS "revenue_events" (
  "id" TEXT NOT NULL,
  "lead_id" TEXT,
  "partner_id" TEXT,
  "product_type" "ProductType",
  "source_page" TEXT,
  "event_type" TEXT NOT NULL,
  "estimated_cents" INTEGER NOT NULL DEFAULT 0,
  "confirmed_cents" INTEGER NOT NULL DEFAULT 0,
  "metadata" JSONB,
  "occurred_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "revenue_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "revenue_events_lead_id_occurred_at_idx" ON "revenue_events"("lead_id", "occurred_at");
CREATE INDEX IF NOT EXISTS "revenue_events_partner_id_occurred_at_idx" ON "revenue_events"("partner_id", "occurred_at");
CREATE INDEX IF NOT EXISTS "revenue_events_event_type_occurred_at_idx" ON "revenue_events"("event_type", "occurred_at");

ALTER TABLE "revenue_events"
  ADD CONSTRAINT "revenue_events_lead_id_fkey"
  FOREIGN KEY ("lead_id") REFERENCES "simulation_leads"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "revenue_adjustments" (
  "id" TEXT NOT NULL,
  "revenue_event_id" TEXT NOT NULL,
  "amount_cents" INTEGER NOT NULL,
  "reason" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "revenue_adjustments_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "revenue_adjustments_revenue_event_id_created_at_idx" ON "revenue_adjustments"("revenue_event_id", "created_at");

ALTER TABLE "revenue_adjustments"
  ADD CONSTRAINT "revenue_adjustments_revenue_event_id_fkey"
  FOREIGN KEY ("revenue_event_id") REFERENCES "revenue_events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "payout_events" (
  "id" TEXT NOT NULL,
  "lead_id" TEXT,
  "partner_id" TEXT,
  "payout_rule_id" TEXT,
  "amount_cents" INTEGER NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'estimated',
  "metadata" JSONB,
  "occurred_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "payout_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "payout_events_lead_id_occurred_at_idx" ON "payout_events"("lead_id", "occurred_at");
CREATE INDEX IF NOT EXISTS "payout_events_partner_id_occurred_at_idx" ON "payout_events"("partner_id", "occurred_at");
CREATE INDEX IF NOT EXISTS "payout_events_status_occurred_at_idx" ON "payout_events"("status", "occurred_at");

ALTER TABLE "payout_events"
  ADD CONSTRAINT "payout_events_lead_id_fkey"
  FOREIGN KEY ("lead_id") REFERENCES "simulation_leads"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "payout_events"
  ADD CONSTRAINT "payout_events_payout_rule_id_fkey"
  FOREIGN KEY ("payout_rule_id") REFERENCES "partner_payout_rules"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "integration_health_checks" (
  "id" TEXT NOT NULL,
  "integration_key" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "response_time_ms" INTEGER,
  "details" JSONB,
  "checked_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "integration_health_checks_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "integration_health_checks_integration_key_checked_at_idx" ON "integration_health_checks"("integration_key", "checked_at");
CREATE INDEX IF NOT EXISTS "integration_health_checks_status_checked_at_idx" ON "integration_health_checks"("status", "checked_at");

CREATE TABLE IF NOT EXISTS "platform_alerts" (
  "id" TEXT NOT NULL,
  "key" TEXT NOT NULL,
  "severity" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'open',
  "message" TEXT NOT NULL,
  "metadata" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "resolved_at" TIMESTAMP(3),
  CONSTRAINT "platform_alerts_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "platform_alerts_status_created_at_idx" ON "platform_alerts"("status", "created_at");
CREATE INDEX IF NOT EXISTS "platform_alerts_severity_created_at_idx" ON "platform_alerts"("severity", "created_at");
