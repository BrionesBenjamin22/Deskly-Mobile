ALTER TABLE "reservations"
  DROP CONSTRAINT IF EXISTS "reservations_no_active_overlap";

ALTER TYPE "ReservationStatus" RENAME TO "ReservationStatus_old";

CREATE TYPE "ReservationStatus" AS ENUM (
  'PENDING_PAYMENT',
  'RESERVED',
  'ACTIVE',
  'COMPLETED',
  'CANCELLED'
);

ALTER TABLE "reservations"
  ALTER COLUMN "status" DROP DEFAULT,
  ALTER COLUMN "status" TYPE "ReservationStatus"
  USING (
    CASE
      WHEN "status"::text = 'CANCELLED' THEN 'CANCELLED'
      WHEN "checked_in_at" IS NOT NULL THEN 'ACTIVE'
      ELSE 'RESERVED'
    END
  )::"ReservationStatus",
  ALTER COLUMN "status" SET DEFAULT 'PENDING_PAYMENT';

DROP TYPE "ReservationStatus_old";

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
