ALTER TABLE "desks"
ADD COLUMN "people_capacity" INTEGER NOT NULL DEFAULT 1;

UPDATE "desks"
SET "people_capacity" = "desk_descriptions"."people_capacity"
FROM "desk_descriptions"
WHERE "desks"."description_id" = "desk_descriptions"."id";
