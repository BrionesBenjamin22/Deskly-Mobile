CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'GESTOR', 'MIEMBRO');

CREATE TABLE "users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "email" VARCHAR(255) NOT NULL,
    "username" VARCHAR(60) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'MIEMBRO',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "members" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "full_name" VARCHAR(200) NOT NULL,
    "dni" INTEGER NOT NULL,
    "phone" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "members_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "user_role_history" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "changed_by_id" UUID NOT NULL,
    "previous_role" "UserRole" NOT NULL,
    "new_role" "UserRole" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "user_role_history_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");
CREATE INDEX "users_active_idx" ON "users"("active");
CREATE UNIQUE INDEX "members_user_id_key" ON "members"("user_id");
CREATE UNIQUE INDEX "members_dni_key" ON "members"("dni");
CREATE INDEX "members_active_idx" ON "members"("active");
CREATE INDEX "user_role_history_user_id_created_at_idx" ON "user_role_history"("user_id", "created_at");
CREATE INDEX "user_role_history_changed_by_id_idx" ON "user_role_history"("changed_by_id");

ALTER TABLE "members" ADD CONSTRAINT "members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "user_role_history" ADD CONSTRAINT "user_role_history_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "user_role_history" ADD CONSTRAINT "user_role_history_changed_by_id_fkey" FOREIGN KEY ("changed_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM "reservations" LIMIT 1) THEN
    RAISE EXCEPTION 'Cannot make reservations.member_id required while existing reservations need a member assignment';
  END IF;
END $$;

ALTER TABLE "reservations" ADD COLUMN "member_id" UUID NOT NULL;
CREATE INDEX "reservations_member_id_date_idx" ON "reservations"("member_id", "date");
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
