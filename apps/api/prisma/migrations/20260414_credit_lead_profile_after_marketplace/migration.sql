ALTER TABLE "credit_leads"
  ADD COLUMN IF NOT EXISTS "birth_date" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "mothers_name" TEXT,
  ADD COLUMN IF NOT EXISTS "gender" TEXT,
  ADD COLUMN IF NOT EXISTS "marital_status" TEXT,
  ADD COLUMN IF NOT EXISTS "educational_level" TEXT,
  ADD COLUMN IF NOT EXISTS "birth_city" TEXT,
  ADD COLUMN IF NOT EXISTS "birth_state" TEXT,
  ADD COLUMN IF NOT EXISTS "address" TEXT,
  ADD COLUMN IF NOT EXISTS "address_number" TEXT,
  ADD COLUMN IF NOT EXISTS "district" TEXT,
  ADD COLUMN IF NOT EXISTS "city" TEXT,
  ADD COLUMN IF NOT EXISTS "state" TEXT,
  ADD COLUMN IF NOT EXISTS "zip_code" TEXT;

CREATE INDEX IF NOT EXISTS "credit_leads_birth_state_idx" ON "credit_leads"("birth_state");
CREATE INDEX IF NOT EXISTS "credit_leads_state_idx" ON "credit_leads"("state");
