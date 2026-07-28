ALTER TABLE "reservations" DROP CONSTRAINT IF EXISTS "reservations_no_active_overlap";

ALTER TYPE "ReservationStatus" RENAME TO "ReservationStatus_old";
CREATE TYPE "ReservationStatus" AS ENUM (
  'PENDING_PAYMENT', 'RESERVED', 'ACTIVE', 'COMPLETED', 'CANCELLED'
);
ALTER TABLE "reservations"
  ALTER COLUMN "status" DROP DEFAULT,
  ALTER COLUMN "status" TYPE "ReservationStatus"
    USING ("status"::text)::"ReservationStatus",
  ALTER COLUMN "status" SET DEFAULT 'RESERVED',
  ADD COLUMN "hold_expires_at" TIMESTAMP(3);
DROP TYPE "ReservationStatus_old";

CREATE TYPE "PaymentStatus" AS ENUM (
  'PENDING', 'PROCESSING', 'APPROVED', 'REJECTED', 'CANCELLED', 'EXPIRED', 'REFUNDED'
);
CREATE TYPE "PaymentProvider" AS ENUM ('LEGACY', 'FAKE', 'MERCADO_PAGO');
CREATE TYPE "PaymentCurrency" AS ENUM ('ARS');
CREATE TYPE "PaymentOption" AS ENUM ('DEPOSIT', 'FULL');

ALTER TABLE "payments"
  ADD COLUMN "member_id" UUID,
  ADD COLUMN "amount_minor_units" BIGINT,
  ADD COLUMN "currency" "PaymentCurrency" NOT NULL DEFAULT 'ARS',
  ADD COLUMN "option" "PaymentOption",
  ADD COLUMN "pricing_version" VARCHAR(80),
  ADD COLUMN "provider" "PaymentProvider",
  ADD COLUMN "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
  ADD COLUMN "idempotency_key" VARCHAR(160),
  ADD COLUMN "operation_fingerprint" VARCHAR(128),
  ADD COLUMN "external_payment_id" VARCHAR(160),
  ADD COLUMN "external_reference" VARCHAR(160),
  ADD COLUMN "checkout_url" VARCHAR(2048),
  ADD COLUMN "failure_reason" VARCHAR(500),
  ADD COLUMN "expires_at" TIMESTAMP(3),
  ADD COLUMN "approved_at" TIMESTAMP(3),
  ADD COLUMN "cancelled_at" TIMESTAMP(3),
  ADD COLUMN "refunded_at" TIMESTAMP(3),
  ADD COLUMN "version" INTEGER NOT NULL DEFAULT 0;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM "payments"
    WHERE "amount"::text IN ('NaN', 'Infinity', '-Infinity')
       OR "amount" <= 0
       OR abs(("amount" * 100) - round("amount" * 100)) > 0.000001
  ) THEN
    RAISE EXCEPTION 'No se pueden convertir pagos historicos a centavos exactos';
  END IF;
END $$;

UPDATE "payments" AS p
SET "member_id" = r."member_id",
    "amount_minor_units" = round(p."amount" * 100)::BIGINT,
    "option" = 'FULL',
    "pricing_version" = 'LEGACY_V1',
    "provider" = 'LEGACY',
    "status" = 'APPROVED',
    "idempotency_key" = 'legacy:' || p."id"::text,
    "operation_fingerprint" = md5('legacy:' || p."id"::text),
    "external_reference" = 'legacy:' || p."id"::text,
    "expires_at" = p."created_at" + interval '15 minutes',
    "approved_at" = p."created_at"
FROM "reservations" AS r
WHERE r."id" = p."reservation_id";

ALTER TABLE "payments"
  ALTER COLUMN "member_id" SET NOT NULL,
  ALTER COLUMN "amount_minor_units" SET NOT NULL,
  ALTER COLUMN "option" SET NOT NULL,
  ALTER COLUMN "pricing_version" SET NOT NULL,
  ALTER COLUMN "provider" SET NOT NULL,
  ALTER COLUMN "idempotency_key" SET NOT NULL,
  ALTER COLUMN "operation_fingerprint" SET NOT NULL,
  ALTER COLUMN "external_reference" SET NOT NULL,
  ALTER COLUMN "expires_at" SET NOT NULL,
  DROP COLUMN "amount",
  ADD CONSTRAINT "payments_member_id_fkey" FOREIGN KEY ("member_id")
    REFERENCES "members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "payment_events" (
  "id" UUID NOT NULL,
  "payment_id" UUID NOT NULL,
  "provider" "PaymentProvider" NOT NULL,
  "external_event_id" VARCHAR(160) NOT NULL,
  "previous_status" "PaymentStatus" NOT NULL,
  "new_status" "PaymentStatus" NOT NULL,
  "occurred_at" TIMESTAMP(3) NOT NULL,
  "processed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "metadata" JSONB,
  CONSTRAINT "payment_events_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "payment_events_payment_id_fkey" FOREIGN KEY ("payment_id")
    REFERENCES "payments"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX "payments_member_id_created_at_idx" ON "payments"("member_id", "created_at");
CREATE INDEX "payments_status_expires_at_idx" ON "payments"("status", "expires_at");
CREATE UNIQUE INDEX "payments_provider_idempotency_key_key" ON "payments"("provider", "idempotency_key");
CREATE UNIQUE INDEX "payments_provider_external_payment_id_key" ON "payments"("provider", "external_payment_id");
CREATE UNIQUE INDEX "payments_one_approved_per_reservation_idx"
  ON "payments"("reservation_id")
  WHERE "status" = 'APPROVED' AND "provider" <> 'LEGACY';
CREATE UNIQUE INDEX "payment_events_provider_external_event_id_key"
  ON "payment_events"("provider", "external_event_id");
CREATE INDEX "payment_events_payment_id_occurred_at_idx"
  ON "payment_events"("payment_id", "occurred_at");

ALTER TABLE "reservations"
ADD CONSTRAINT "reservations_no_active_overlap"
EXCLUDE USING gist (
  "desk_id" WITH =,
  tsrange(
    ("date" + "start_time")::timestamp,
    ("date" + "end_time")::timestamp,
    '[)'
  ) WITH &&
)
WHERE ("status" IN ('PENDING_PAYMENT', 'RESERVED', 'ACTIVE'));
