CREATE TABLE "user_status_history" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "changed_by_id" UUID NOT NULL,
    "previous_active" BOOLEAN NOT NULL,
    "new_active" BOOLEAN NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_status_history_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "user_status_history_user_id_created_at_idx" ON "user_status_history"("user_id", "created_at");
CREATE INDEX "user_status_history_changed_by_id_idx" ON "user_status_history"("changed_by_id");

ALTER TABLE "user_status_history" ADD CONSTRAINT "user_status_history_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "user_status_history" ADD CONSTRAINT "user_status_history_changed_by_id_fkey" FOREIGN KEY ("changed_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
