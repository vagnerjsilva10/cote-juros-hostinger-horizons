ALTER TYPE "AffiliateNetworkCode" ADD VALUE IF NOT EXISTS 'admitad';

ALTER TABLE "affiliate_programs"
  ADD COLUMN IF NOT EXISTS "external_program_id" TEXT,
  ADD COLUMN IF NOT EXISTS "description" TEXT,
  ADD COLUMN IF NOT EXISTS "image_url" TEXT,
  ADD COLUMN IF NOT EXISTS "category" TEXT,
  ADD COLUMN IF NOT EXISTS "payout_text" TEXT;

ALTER TABLE "affiliate_offers"
  ADD COLUMN IF NOT EXISTS "external_program_id" TEXT,
  ADD COLUMN IF NOT EXISTS "image_url" TEXT,
  ADD COLUMN IF NOT EXISTS "payout_text" TEXT;

CREATE INDEX IF NOT EXISTS "affiliate_programs_external_program_id_idx" ON "affiliate_programs"("external_program_id");
CREATE INDEX IF NOT EXISTS "affiliate_offers_external_program_id_idx" ON "affiliate_offers"("external_program_id");
