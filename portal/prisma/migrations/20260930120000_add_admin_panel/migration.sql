-- Panel manajemen user (CS): soft delete akun orang tua + akun admin + audit log.
ALTER TABLE "parent_accounts" ADD COLUMN "removed_at" TIMESTAMP(3);
ALTER TABLE "parent_accounts" ADD COLUMN "removed_reason" TEXT;

CREATE TABLE "admin_users" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "totp_secret" TEXT,
    "role" TEXT NOT NULL DEFAULT 'cs',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_login_at" TIMESTAMP(3),
    CONSTRAINT "admin_users_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "admin_users_username_key" ON "admin_users"("username");

CREATE TABLE "admin_audit_logs" (
    "id" TEXT NOT NULL,
    "admin_id" TEXT,
    "action" TEXT NOT NULL,
    "target_parent_id" TEXT,
    "detail" JSONB,
    "ip" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "admin_audit_logs_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "admin_audit_logs_target_parent_id_created_at_idx" ON "admin_audit_logs"("target_parent_id", "created_at");
CREATE INDEX "admin_audit_logs_created_at_idx" ON "admin_audit_logs"("created_at");
ALTER TABLE "admin_audit_logs" ADD CONSTRAINT "admin_audit_logs_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "admin_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Aktivitas harian dihitung lintas anak (DAU/WAU/MAU).
CREATE INDEX "child_daily_stats_day_idx" ON "child_daily_stats"("day");
