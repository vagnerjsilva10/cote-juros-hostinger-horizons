DROP INDEX IF EXISTS "legal_disclaimers_key_key";

CREATE UNIQUE INDEX IF NOT EXISTS "legal_disclaimers_key_placement_key"
  ON "legal_disclaimers"("key", "placement");
