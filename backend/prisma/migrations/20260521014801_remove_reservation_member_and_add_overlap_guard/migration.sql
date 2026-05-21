/*
  Warnings:

  - You are about to drop the column `member_id` on the `reservations` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "reservations_member_id_date_idx";

-- AlterTable
ALTER TABLE "reservations" DROP COLUMN "member_id";

-- Enable GiST equality support for UUID columns.
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- Prevent overlapping active reservations for the same desk.
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
WHERE ("status" = 'ACTIVE');
