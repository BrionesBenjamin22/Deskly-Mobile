-- DropIndex
DROP INDEX "desks_enabled_idx";

-- AlterTable
ALTER TABLE "desks" ADD COLUMN     "deleted_at" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "desks_enabled_deleted_at_idx" ON "desks"("enabled", "deleted_at");
