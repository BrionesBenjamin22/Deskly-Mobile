-- CreateEnum
CREATE TYPE "PenaltyType" AS ENUM ('ABSENCE', 'LATE_CANCELLATION');

-- CreateEnum
CREATE TYPE "InfractionLevel" AS ENUM ('WARNING', 'PENALTY');

-- AlterTable
ALTER TABLE "users" ADD COLUMN "blocked_until" TIMESTAMP(3);
ALTER TABLE "reservations" ADD COLUMN "checked_in_at" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "penalties" (
    "id" UUID NOT NULL,
    "reservation_id" UUID NOT NULL,
    "member_id" UUID NOT NULL,
    "registered_by_id" UUID,
    "type" "PenaltyType" NOT NULL,
    "level" "InfractionLevel" NOT NULL,
    "reason" VARCHAR(500) NOT NULL,
    "registered_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "active_until" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "penalties_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "penalties_reservation_id_key" ON "penalties"("reservation_id");
CREATE INDEX "penalties_member_id_active_until_level_idx" ON "penalties"("member_id", "active_until", "level");
CREATE INDEX "penalties_registered_by_id_idx" ON "penalties"("registered_by_id");

ALTER TABLE "penalties" ADD CONSTRAINT "penalties_reservation_id_fkey" FOREIGN KEY ("reservation_id") REFERENCES "reservations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "penalties" ADD CONSTRAINT "penalties_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "penalties" ADD CONSTRAINT "penalties_registered_by_id_fkey" FOREIGN KEY ("registered_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
