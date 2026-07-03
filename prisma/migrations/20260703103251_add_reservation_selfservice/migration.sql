-- Add self-service + email lifecycle fields to Reservation.
-- token is backfilled for existing rows before the NOT NULL / UNIQUE constraints.

-- token: add nullable, backfill existing rows, then enforce NOT NULL + UNIQUE.
ALTER TABLE "Reservation" ADD COLUMN "token" TEXT;
UPDATE "Reservation" SET "token" = gen_random_uuid()::text WHERE "token" IS NULL;
ALTER TABLE "Reservation" ALTER COLUMN "token" SET NOT NULL;
CREATE UNIQUE INDEX "Reservation_token_key" ON "Reservation"("token");

-- The rest have defaults / are nullable, so existing rows are fine.
ALTER TABLE "Reservation" ADD COLUMN "emailVerified" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Reservation" ADD COLUMN "promoCode" TEXT;
ALTER TABLE "Reservation" ADD COLUMN "locale" TEXT NOT NULL DEFAULT 'en';
ALTER TABLE "Reservation" ADD COLUMN "reminded24" BOOLEAN NOT NULL DEFAULT false;
