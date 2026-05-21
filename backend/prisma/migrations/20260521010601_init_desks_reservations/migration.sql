-- CreateEnum
CREATE TYPE "ReservationStatus" AS ENUM ('ACTIVE', 'CANCELLED');

-- CreateTable
CREATE TABLE "desks" (
    "id" UUID NOT NULL,
    "code" VARCHAR(30) NOT NULL,
    "name" VARCHAR(120),
    "location_description" VARCHAR(255),
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "desks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reservations" (
    "id" UUID NOT NULL,
    "desk_id" UUID NOT NULL,
    "member_id" UUID NOT NULL,
    "date" DATE NOT NULL,
    "start_time" TIME(0) NOT NULL,
    "end_time" TIME(0) NOT NULL,
    "status" "ReservationStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "cancelled_at" TIMESTAMP(3),

    CONSTRAINT "reservations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "desks_code_key" ON "desks"("code");

-- CreateIndex
CREATE INDEX "desks_enabled_idx" ON "desks"("enabled");

-- CreateIndex
CREATE INDEX "reservations_desk_id_date_status_start_time_end_time_idx" ON "reservations"("desk_id", "date", "status", "start_time", "end_time");

-- CreateIndex
CREATE INDEX "reservations_member_id_date_idx" ON "reservations"("member_id", "date");

-- AddForeignKey
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_desk_id_fkey" FOREIGN KEY ("desk_id") REFERENCES "desks"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
