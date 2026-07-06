CREATE TABLE "localities" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "name" VARCHAR(120) NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "localities_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "work_areas" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "name" VARCHAR(120) NOT NULL,
  "description" VARCHAR(255),
  "locality_id" UUID NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "work_areas_pkey" PRIMARY KEY ("id")
);

INSERT INTO "localities" ("id", "name", "active")
VALUES ('00000000-0000-4000-8000-000000000001', 'Localidad principal', true)
ON CONFLICT DO NOTHING;

INSERT INTO "work_areas" ("id", "name", "description", "locality_id", "active")
VALUES (
  '11111111-1111-4111-8111-111111111111',
  'Area general',
  'Area asignada por defecto para escritorios existentes.',
  '00000000-0000-4000-8000-000000000001',
  true
)
ON CONFLICT DO NOTHING;

ALTER TABLE "desks"
ADD COLUMN "area_id" UUID NOT NULL DEFAULT '11111111-1111-4111-8111-111111111111';

CREATE UNIQUE INDEX "localities_name_key" ON "localities"("name");
CREATE INDEX "localities_active_idx" ON "localities"("active");
CREATE UNIQUE INDEX "work_areas_locality_id_name_key" ON "work_areas"("locality_id", "name");
CREATE INDEX "work_areas_active_idx" ON "work_areas"("active");
CREATE INDEX "work_areas_locality_id_active_idx" ON "work_areas"("locality_id", "active");
CREATE INDEX "desks_area_id_idx" ON "desks"("area_id");

ALTER TABLE "work_areas"
ADD CONSTRAINT "work_areas_locality_id_fkey"
FOREIGN KEY ("locality_id") REFERENCES "localities"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "desks"
ADD CONSTRAINT "desks_area_id_fkey"
FOREIGN KEY ("area_id") REFERENCES "work_areas"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;
