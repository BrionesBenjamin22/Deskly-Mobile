CREATE EXTENSION IF NOT EXISTS "pgcrypto";

ALTER TABLE "desks" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();
ALTER TABLE "desk_descriptions" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();
ALTER TABLE "amenities" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();
ALTER TABLE "reservations" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();

ALTER TABLE "desks" ALTER COLUMN "code" TYPE VARCHAR(36);
ALTER TABLE "desks" ALTER COLUMN "code" SET DEFAULT gen_random_uuid()::text;
