ALTER TABLE "simulation_leads"
  ADD COLUMN "full_name" TEXT,
  ADD COLUMN "phone" TEXT,
  ADD COLUMN "profile" TEXT,
  ADD COLUMN "partner_id" TEXT,
  ADD COLUMN "partner_name" TEXT,
  ADD COLUMN "delivery_mode" TEXT,
  ADD COLUMN "redirect_url" TEXT,
  ADD COLUMN "status" TEXT NOT NULL DEFAULT 'new',
  ADD COLUMN "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE INDEX "simulation_leads_profile_idx" ON "simulation_leads"("profile");
CREATE INDEX "simulation_leads_partner_id_idx" ON "simulation_leads"("partner_id");
CREATE INDEX "simulation_leads_status_created_at_idx" ON "simulation_leads"("status", "created_at");
