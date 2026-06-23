-- AlterTable
ALTER TABLE "amenities" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "desk_descriptions" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "desks" ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "code" SET DEFAULT gen_random_uuid()::text;

-- AlterTable
ALTER TABLE "reservations" ALTER COLUMN "id" DROP DEFAULT;

-- CreateTable
CREATE TABLE "payments" (
    "id" UUID NOT NULL,
    "reservation_id" UUID NOT NULL,
    "payment_date" DATE NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "payments_reservation_id_idx" ON "payments"("reservation_id");

-- CreateIndex
CREATE INDEX "payments_payment_date_idx" ON "payments"("payment_date");

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_reservation_id_fkey" FOREIGN KEY ("reservation_id") REFERENCES "reservations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
