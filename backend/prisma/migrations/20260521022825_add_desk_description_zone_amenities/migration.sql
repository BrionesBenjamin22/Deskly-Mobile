/*
  Warnings:

  - You are about to drop the column `location_description` on the `desks` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "DeskZone" AS ENUM ('A', 'B', 'C');

-- AlterTable
ALTER TABLE "desks" DROP COLUMN "location_description",
ADD COLUMN     "description_id" UUID,
ADD COLUMN     "zone" "DeskZone";

-- CreateTable
CREATE TABLE "desk_descriptions" (
    "id" UUID NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "description" VARCHAR(255),
    "people_capacity" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "desk_descriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "amenities" (
    "id" UUID NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "amenities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "desk_amenities" (
    "desk_id" UUID NOT NULL,
    "amenity_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "desk_amenities_pkey" PRIMARY KEY ("desk_id","amenity_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "desk_descriptions_name_key" ON "desk_descriptions"("name");

-- CreateIndex
CREATE UNIQUE INDEX "amenities_name_key" ON "amenities"("name");

-- CreateIndex
CREATE INDEX "desk_amenities_amenity_id_idx" ON "desk_amenities"("amenity_id");

-- CreateIndex
CREATE INDEX "desks_description_id_idx" ON "desks"("description_id");

-- CreateIndex
CREATE INDEX "desks_zone_idx" ON "desks"("zone");

-- AddForeignKey
ALTER TABLE "desks" ADD CONSTRAINT "desks_description_id_fkey" FOREIGN KEY ("description_id") REFERENCES "desk_descriptions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "desk_amenities" ADD CONSTRAINT "desk_amenities_desk_id_fkey" FOREIGN KEY ("desk_id") REFERENCES "desks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "desk_amenities" ADD CONSTRAINT "desk_amenities_amenity_id_fkey" FOREIGN KEY ("amenity_id") REFERENCES "amenities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
