ALTER TABLE "work_areas"
ADD COLUMN "address" VARCHAR(255),
ADD COLUMN "latitude" DOUBLE PRECISION,
ADD COLUMN "longitude" DOUBLE PRECISION;

ALTER TABLE "work_areas"
ADD CONSTRAINT "work_areas_valid_coordinates_check"
CHECK (
  ("latitude" IS NULL AND "longitude" IS NULL)
  OR (
    "latitude" BETWEEN -90 AND 90
    AND "longitude" BETWEEN -180 AND 180
  )
);
