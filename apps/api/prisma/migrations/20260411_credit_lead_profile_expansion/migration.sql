ALTER TABLE "credit_leads"
ADD COLUMN "birth_date" TIMESTAMP(3),
ADD COLUMN "mothers_name" TEXT,
ADD COLUMN "gender" TEXT,
ADD COLUMN "marital_status" TEXT,
ADD COLUMN "educational_level" TEXT,
ADD COLUMN "birth_city" TEXT,
ADD COLUMN "birth_state" TEXT,
ADD COLUMN "address" TEXT,
ADD COLUMN "address_number" TEXT,
ADD COLUMN "district" TEXT,
ADD COLUMN "city" TEXT,
ADD COLUMN "state" TEXT,
ADD COLUMN "zip_code" TEXT;

CREATE INDEX "credit_leads_birth_state_idx" ON "credit_leads"("birth_state");
CREATE INDEX "credit_leads_state_idx" ON "credit_leads"("state");
