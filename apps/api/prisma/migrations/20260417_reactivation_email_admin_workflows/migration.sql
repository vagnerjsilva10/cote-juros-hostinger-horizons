-- Email admin, SendGrid event tracking, and visual workflow builder for the
-- Cote Juros lead reactivation operation.

DO $$ BEGIN
  CREATE TYPE "EmailCampaignStatus" AS ENUM ('draft', 'active', 'paused', 'completed', 'archived');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "EmailTemplateStatus" AS ENUM ('draft', 'active', 'inactive', 'archived');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "EmailMessageStatus" AS ENUM ('queued', 'sending', 'sent', 'delivered', 'opened', 'clicked', 'bounced', 'dropped', 'spam_reported', 'unsubscribed', 'failed', 'suppressed', 'cancelled');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "EmailEventType" AS ENUM ('processed', 'delivered', 'open', 'click', 'bounce', 'dropped', 'deferred', 'spamreport', 'unsubscribe', 'group_unsubscribe', 'group_resubscribe', 'sent', 'failed', 'suppressed', 'manual_resend');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "AutomationFlowStatus" AS ENUM ('draft', 'active', 'paused', 'archived');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "AutomationNodeType" AS ENUM ('trigger_lead_entry', 'eligibility_filter', 'delay', 'send_email', 'condition', 'behavior_split', 'wait_event', 'mark_status', 'add_suppression', 'end_flow', 'webhook_event', 'route_partner', 'update_lead_field');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "AutomationExecutionStatus" AS ENUM ('active', 'waiting', 'paused', 'completed', 'failed', 'cancelled');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "AutomationStepStatus" AS ENUM ('pending', 'running', 'waiting', 'completed', 'failed', 'skipped');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "AdminAuditAction" AS ENUM ('campaign_created', 'campaign_updated', 'campaign_paused', 'campaign_activated', 'campaign_archived', 'campaign_duplicated', 'template_created', 'template_updated', 'template_published', 'flow_created', 'flow_updated', 'flow_published', 'flow_paused', 'flow_activated', 'lead_email_resent', 'lead_flow_moved', 'lead_paused', 'lead_suppressed', 'config_updated', 'webhook_received');
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS "reactivation_email_campaigns" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "description" TEXT,
  "status" "EmailCampaignStatus" NOT NULL DEFAULT 'draft',
  "is_active" BOOLEAN NOT NULL DEFAULT false,
  "starts_at" TIMESTAMP(3),
  "ends_at" TIMESTAMP(3),
  "initial_template_id" TEXT,
  "reminder_template_id" TEXT,
  "last_call_template_id" TEXT,
  "flow_definition_id" TEXT,
  "published_flow_version_id" TEXT,
  "daily_limit" INTEGER NOT NULL DEFAULT 5,
  "batch_size" INTEGER NOT NULL DEFAULT 5,
  "send_window" JSONB,
  "exit_rules" JSONB,
  "metadata" JSONB,
  "created_by" TEXT,
  "updated_by" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "reactivation_email_campaigns_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "reactivation_email_templates" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "version" INTEGER NOT NULL DEFAULT 1,
  "status" "EmailTemplateStatus" NOT NULL DEFAULT 'draft',
  "is_active" BOOLEAN NOT NULL DEFAULT false,
  "subject" TEXT NOT NULL,
  "preheader" TEXT,
  "html" TEXT NOT NULL,
  "text" TEXT NOT NULL,
  "variables" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "metadata" JSONB,
  "parent_id" TEXT,
  "created_by" TEXT,
  "updated_by" TEXT,
  "published_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "reactivation_email_templates_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "reactivation_flow_definitions" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "description" TEXT,
  "status" "AutomationFlowStatus" NOT NULL DEFAULT 'draft',
  "is_active" BOOLEAN NOT NULL DEFAULT false,
  "published_version_id" TEXT,
  "metadata" JSONB,
  "created_by" TEXT,
  "updated_by" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "reactivation_flow_definitions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "reactivation_flow_versions" (
  "id" TEXT NOT NULL,
  "flow_id" TEXT NOT NULL,
  "version" INTEGER NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'draft',
  "definition" JSONB NOT NULL,
  "validation_errors" JSONB,
  "published_at" TIMESTAMP(3),
  "created_by" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "reactivation_flow_versions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "reactivation_flow_nodes" (
  "id" TEXT NOT NULL,
  "flow_version_id" TEXT NOT NULL,
  "node_key" TEXT NOT NULL,
  "type" "AutomationNodeType" NOT NULL,
  "label" TEXT NOT NULL,
  "config" JSONB,
  "position" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "reactivation_flow_nodes_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "reactivation_flow_edges" (
  "id" TEXT NOT NULL,
  "flow_version_id" TEXT NOT NULL,
  "edge_key" TEXT NOT NULL,
  "source_node_key" TEXT NOT NULL,
  "target_node_key" TEXT NOT NULL,
  "label" TEXT,
  "condition" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "reactivation_flow_edges_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "reactivation_lead_flow_executions" (
  "id" TEXT NOT NULL,
  "lead_id" TEXT NOT NULL,
  "campaign_id" TEXT,
  "flow_id" TEXT NOT NULL,
  "flow_version_id" TEXT NOT NULL,
  "current_node_key" TEXT,
  "status" "AutomationExecutionStatus" NOT NULL DEFAULT 'active',
  "context" JSONB,
  "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "waiting_until" TIMESTAMP(3),
  "completed_at" TIMESTAMP(3),
  "failed_at" TIMESTAMP(3),
  "error_message" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "reactivation_lead_flow_executions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "reactivation_flow_execution_steps" (
  "id" TEXT NOT NULL,
  "execution_id" TEXT NOT NULL,
  "lead_id" TEXT,
  "flow_node_id" TEXT,
  "node_key" TEXT NOT NULL,
  "node_type" "AutomationNodeType" NOT NULL,
  "status" "AutomationStepStatus" NOT NULL DEFAULT 'pending',
  "input" JSONB,
  "output" JSONB,
  "error_message" TEXT,
  "started_at" TIMESTAMP(3),
  "completed_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "reactivation_flow_execution_steps_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "reactivation_email_messages" (
  "id" TEXT NOT NULL,
  "lead_id" TEXT,
  "campaign_id" TEXT,
  "template_id" TEXT,
  "flow_execution_id" TEXT,
  "step_key" TEXT,
  "sequence_key" TEXT,
  "provider" TEXT NOT NULL DEFAULT 'sendgrid',
  "provider_message_id" TEXT,
  "to_email_hash" TEXT,
  "to_email_masked" TEXT,
  "subject" TEXT,
  "status" "EmailMessageStatus" NOT NULL DEFAULT 'queued',
  "idempotency_key" TEXT,
  "request_payload" JSONB,
  "response_payload" JSONB,
  "error_message" TEXT,
  "scheduled_at" TIMESTAMP(3),
  "sent_at" TIMESTAMP(3),
  "delivered_at" TIMESTAMP(3),
  "opened_at" TIMESTAMP(3),
  "clicked_at" TIMESTAMP(3),
  "bounced_at" TIMESTAMP(3),
  "unsubscribed_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "reactivation_email_messages_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "reactivation_email_message_events" (
  "id" TEXT NOT NULL,
  "message_id" TEXT,
  "lead_id" TEXT,
  "campaign_id" TEXT,
  "event_type" "EmailEventType" NOT NULL,
  "provider" TEXT NOT NULL DEFAULT 'sendgrid',
  "provider_event_id" TEXT,
  "provider_message_id" TEXT,
  "email_hash" TEXT,
  "url" TEXT,
  "user_agent" TEXT,
  "ip_address" TEXT,
  "reason" TEXT,
  "raw_payload" JSONB,
  "signature_verified" BOOLEAN NOT NULL DEFAULT false,
  "occurred_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "reactivation_email_message_events_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "reactivation_admin_audit_logs" (
  "id" TEXT NOT NULL,
  "actor" TEXT NOT NULL DEFAULT 'system',
  "action" "AdminAuditAction" NOT NULL,
  "entity_type" TEXT NOT NULL,
  "entity_id" TEXT,
  "before" JSONB,
  "after" JSONB,
  "metadata" JSONB,
  "ip_address" TEXT,
  "user_agent" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "reactivation_admin_audit_logs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "reactivation_admin_config" (
  "id" TEXT NOT NULL,
  "key" TEXT NOT NULL,
  "value" JSONB NOT NULL,
  "description" TEXT,
  "updated_by" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "reactivation_admin_config_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "reactivation_automation_job_runs" (
  "id" TEXT NOT NULL,
  "job_name" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "trigger_source" TEXT,
  "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "finished_at" TIMESTAMP(3),
  "duration_ms" INTEGER,
  "processed_count" INTEGER,
  "success_count" INTEGER,
  "error_count" INTEGER,
  "metadata" JSONB,
  "error_message" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "reactivation_automation_job_runs_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "reactivation_email_campaigns_slug_key" ON "reactivation_email_campaigns"("slug");
CREATE INDEX IF NOT EXISTS "reactivation_email_campaigns_status_is_active_idx" ON "reactivation_email_campaigns"("status", "is_active");
CREATE INDEX IF NOT EXISTS "reactivation_email_campaigns_starts_at_ends_at_idx" ON "reactivation_email_campaigns"("starts_at", "ends_at");

CREATE UNIQUE INDEX IF NOT EXISTS "reactivation_email_templates_slug_version_key" ON "reactivation_email_templates"("slug", "version");
CREATE INDEX IF NOT EXISTS "reactivation_email_templates_slug_status_idx" ON "reactivation_email_templates"("slug", "status");
CREATE INDEX IF NOT EXISTS "reactivation_email_templates_status_is_active_idx" ON "reactivation_email_templates"("status", "is_active");

CREATE UNIQUE INDEX IF NOT EXISTS "reactivation_flow_definitions_slug_key" ON "reactivation_flow_definitions"("slug");
CREATE INDEX IF NOT EXISTS "reactivation_flow_definitions_status_is_active_idx" ON "reactivation_flow_definitions"("status", "is_active");

CREATE UNIQUE INDEX IF NOT EXISTS "reactivation_flow_versions_flow_id_version_key" ON "reactivation_flow_versions"("flow_id", "version");
CREATE INDEX IF NOT EXISTS "reactivation_flow_versions_flow_id_status_idx" ON "reactivation_flow_versions"("flow_id", "status");

CREATE UNIQUE INDEX IF NOT EXISTS "reactivation_flow_nodes_flow_version_id_node_key_key" ON "reactivation_flow_nodes"("flow_version_id", "node_key");
CREATE INDEX IF NOT EXISTS "reactivation_flow_nodes_flow_version_id_type_idx" ON "reactivation_flow_nodes"("flow_version_id", "type");

CREATE UNIQUE INDEX IF NOT EXISTS "reactivation_flow_edges_flow_version_id_edge_key_key" ON "reactivation_flow_edges"("flow_version_id", "edge_key");
CREATE INDEX IF NOT EXISTS "reactivation_flow_edges_flow_version_id_source_node_key_idx" ON "reactivation_flow_edges"("flow_version_id", "source_node_key");

CREATE INDEX IF NOT EXISTS "reactivation_lead_flow_executions_lead_id_status_idx" ON "reactivation_lead_flow_executions"("lead_id", "status");
CREATE INDEX IF NOT EXISTS "reactivation_lead_flow_executions_campaign_id_status_idx" ON "reactivation_lead_flow_executions"("campaign_id", "status");
CREATE INDEX IF NOT EXISTS "reactivation_lead_flow_executions_flow_version_id_status_idx" ON "reactivation_lead_flow_executions"("flow_version_id", "status");
CREATE INDEX IF NOT EXISTS "reactivation_lead_flow_executions_current_node_key_status_idx" ON "reactivation_lead_flow_executions"("current_node_key", "status");

CREATE INDEX IF NOT EXISTS "reactivation_flow_execution_steps_execution_id_created_at_idx" ON "reactivation_flow_execution_steps"("execution_id", "created_at");
CREATE INDEX IF NOT EXISTS "reactivation_flow_execution_steps_lead_id_created_at_idx" ON "reactivation_flow_execution_steps"("lead_id", "created_at");
CREATE INDEX IF NOT EXISTS "reactivation_flow_execution_steps_node_key_status_idx" ON "reactivation_flow_execution_steps"("node_key", "status");

CREATE UNIQUE INDEX IF NOT EXISTS "reactivation_email_messages_idempotency_key_key" ON "reactivation_email_messages"("idempotency_key");
CREATE INDEX IF NOT EXISTS "reactivation_email_messages_lead_id_created_at_idx" ON "reactivation_email_messages"("lead_id", "created_at");
CREATE INDEX IF NOT EXISTS "reactivation_email_messages_campaign_id_status_created_at_idx" ON "reactivation_email_messages"("campaign_id", "status", "created_at");
CREATE INDEX IF NOT EXISTS "reactivation_email_messages_provider_message_id_idx" ON "reactivation_email_messages"("provider_message_id");
CREATE INDEX IF NOT EXISTS "reactivation_email_messages_status_scheduled_at_idx" ON "reactivation_email_messages"("status", "scheduled_at");

CREATE UNIQUE INDEX IF NOT EXISTS "reactivation_email_message_events_provider_provider_event_id_key" ON "reactivation_email_message_events"("provider", "provider_event_id");
CREATE INDEX IF NOT EXISTS "reactivation_email_message_events_message_id_occurred_at_idx" ON "reactivation_email_message_events"("message_id", "occurred_at");
CREATE INDEX IF NOT EXISTS "reactivation_email_message_events_lead_id_occurred_at_idx" ON "reactivation_email_message_events"("lead_id", "occurred_at");
CREATE INDEX IF NOT EXISTS "reactivation_email_message_events_campaign_id_event_type_occurred_at_idx" ON "reactivation_email_message_events"("campaign_id", "event_type", "occurred_at");
CREATE INDEX IF NOT EXISTS "reactivation_email_message_events_provider_message_id_idx" ON "reactivation_email_message_events"("provider_message_id");

CREATE INDEX IF NOT EXISTS "reactivation_admin_audit_logs_entity_type_entity_id_idx" ON "reactivation_admin_audit_logs"("entity_type", "entity_id");
CREATE INDEX IF NOT EXISTS "reactivation_admin_audit_logs_action_created_at_idx" ON "reactivation_admin_audit_logs"("action", "created_at");
CREATE INDEX IF NOT EXISTS "reactivation_admin_audit_logs_actor_created_at_idx" ON "reactivation_admin_audit_logs"("actor", "created_at");

CREATE UNIQUE INDEX IF NOT EXISTS "reactivation_admin_config_key_key" ON "reactivation_admin_config"("key");

CREATE INDEX IF NOT EXISTS "reactivation_automation_job_runs_job_name_started_at_idx" ON "reactivation_automation_job_runs"("job_name", "started_at");
CREATE INDEX IF NOT EXISTS "reactivation_automation_job_runs_status_started_at_idx" ON "reactivation_automation_job_runs"("status", "started_at");

DO $$ BEGIN ALTER TABLE "reactivation_flow_versions" ADD CONSTRAINT "reactivation_flow_versions_flow_id_fkey" FOREIGN KEY ("flow_id") REFERENCES "reactivation_flow_definitions"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN ALTER TABLE "reactivation_flow_nodes" ADD CONSTRAINT "reactivation_flow_nodes_flow_version_id_fkey" FOREIGN KEY ("flow_version_id") REFERENCES "reactivation_flow_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN ALTER TABLE "reactivation_flow_edges" ADD CONSTRAINT "reactivation_flow_edges_flow_version_id_fkey" FOREIGN KEY ("flow_version_id") REFERENCES "reactivation_flow_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN ALTER TABLE "reactivation_lead_flow_executions" ADD CONSTRAINT "reactivation_lead_flow_executions_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "reactivation_leads"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN ALTER TABLE "reactivation_lead_flow_executions" ADD CONSTRAINT "reactivation_lead_flow_executions_flow_id_fkey" FOREIGN KEY ("flow_id") REFERENCES "reactivation_flow_definitions"("id") ON DELETE RESTRICT ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN ALTER TABLE "reactivation_lead_flow_executions" ADD CONSTRAINT "reactivation_lead_flow_executions_flow_version_id_fkey" FOREIGN KEY ("flow_version_id") REFERENCES "reactivation_flow_versions"("id") ON DELETE RESTRICT ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN ALTER TABLE "reactivation_flow_execution_steps" ADD CONSTRAINT "reactivation_flow_execution_steps_execution_id_fkey" FOREIGN KEY ("execution_id") REFERENCES "reactivation_lead_flow_executions"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN ALTER TABLE "reactivation_flow_execution_steps" ADD CONSTRAINT "reactivation_flow_execution_steps_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "reactivation_leads"("id") ON DELETE SET NULL ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN ALTER TABLE "reactivation_flow_execution_steps" ADD CONSTRAINT "reactivation_flow_execution_steps_flow_node_id_fkey" FOREIGN KEY ("flow_node_id") REFERENCES "reactivation_flow_nodes"("id") ON DELETE SET NULL ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN ALTER TABLE "reactivation_email_messages" ADD CONSTRAINT "reactivation_email_messages_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "reactivation_leads"("id") ON DELETE SET NULL ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN ALTER TABLE "reactivation_email_messages" ADD CONSTRAINT "reactivation_email_messages_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "reactivation_email_campaigns"("id") ON DELETE SET NULL ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN ALTER TABLE "reactivation_email_messages" ADD CONSTRAINT "reactivation_email_messages_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "reactivation_email_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN ALTER TABLE "reactivation_email_message_events" ADD CONSTRAINT "reactivation_email_message_events_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "reactivation_email_messages"("id") ON DELETE SET NULL ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN null; END $$;

