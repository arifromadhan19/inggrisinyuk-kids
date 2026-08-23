/*
  Warnings:

  - You are about to drop the `child_progress` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "child_progress" DROP CONSTRAINT "child_progress_child_id_fkey";

-- DropTable
DROP TABLE "child_progress";

-- CreateTable
CREATE TABLE "child_progress_state" (
    "id" TEXT NOT NULL,
    "child_id" TEXT NOT NULL,
    "xp" INTEGER NOT NULL DEFAULT 0,
    "correct_attempts" INTEGER NOT NULL DEFAULT 0,
    "total_attempts" INTEGER NOT NULL DEFAULT 0,
    "nickname" TEXT,
    "avatar" TEXT,
    "last_skill" TEXT,
    "last_topic_id" TEXT,
    "last_topic_index" INTEGER,
    "last_step" INTEGER,
    "last_level" TEXT,
    "last_active_day" VARCHAR(10),
    "client_updated_at" TIMESTAMP(3),
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "child_progress_state_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "topic_completions" (
    "id" TEXT NOT NULL,
    "child_id" TEXT NOT NULL,
    "skill" TEXT NOT NULL,
    "topic_id" TEXT NOT NULL,
    "level" TEXT,
    "first_done_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_done_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "topic_completions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "boss_clearances" (
    "id" TEXT NOT NULL,
    "child_id" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "cleared_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "boss_clearances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "child_daily_stats" (
    "id" TEXT NOT NULL,
    "child_id" TEXT NOT NULL,
    "day" VARCHAR(10) NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "correct" INTEGER NOT NULL DEFAULT 0,
    "hints_used" INTEGER NOT NULL DEFAULT 0,
    "mic_attempts" INTEGER NOT NULL DEFAULT 0,
    "mic_score_sum" INTEGER NOT NULL DEFAULT 0,
    "topics_done" INTEGER NOT NULL DEFAULT 0,
    "xp_gained" INTEGER NOT NULL DEFAULT 0,
    "hour_histogram" JSONB,
    "first_event_at" TIMESTAMP(3),
    "last_event_at" TIMESTAMP(3),
    "recomputed_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "child_daily_stats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "child_section_progress" (
    "id" TEXT NOT NULL,
    "child_id" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "skill" TEXT NOT NULL,
    "topic_id" TEXT NOT NULL,
    "section" TEXT NOT NULL,
    "round" INTEGER NOT NULL DEFAULT 1,
    "plan" JSONB,
    "plan_seed" INTEGER,
    "slot_count" INTEGER NOT NULL,
    "cursor_slot" INTEGER NOT NULL DEFAULT 0,
    "answered_slots" INTEGER NOT NULL DEFAULT 0,
    "correct_slots" INTEGER NOT NULL DEFAULT 0,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),
    "client_updated_at" TIMESTAMP(3) NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "child_section_progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "child_item_progress" (
    "id" TEXT NOT NULL,
    "child_id" TEXT NOT NULL,
    "skill" TEXT NOT NULL,
    "topic_id" TEXT NOT NULL,
    "section" TEXT NOT NULL,
    "slot" INTEGER NOT NULL,
    "round" INTEGER NOT NULL DEFAULT 1,
    "level" TEXT,
    "item_index" INTEGER,
    "item_ref" TEXT,
    "kind" TEXT,
    "status" INTEGER NOT NULL DEFAULT 0,
    "ever_correct" BOOLEAN NOT NULL DEFAULT false,
    "last_correct" BOOLEAN,
    "best_score" INTEGER,
    "attempt_count" INTEGER NOT NULL DEFAULT 0,
    "wrong_count" INTEGER NOT NULL DEFAULT 0,
    "hint_used" BOOLEAN NOT NULL DEFAULT false,
    "listened_at" TIMESTAMP(3),
    "mic_at" TIMESTAMP(3),
    "game_at" TIMESTAMP(3),
    "first_answered_at" TIMESTAMP(3),
    "last_answered_at" TIMESTAMP(3),
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "child_item_progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "learning_events" (
    "id" UUID NOT NULL,
    "child_id" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "occurred_at" TIMESTAMP(3) NOT NULL,
    "local_day" VARCHAR(10) NOT NULL,
    "local_hour" INTEGER NOT NULL,
    "received_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "level" TEXT,
    "skill" TEXT,
    "topic_id" TEXT,
    "section" TEXT,
    "slot" INTEGER,
    "round" INTEGER,
    "item_index" INTEGER,
    "item_ref" TEXT,
    "activity" TEXT,
    "graded" BOOLEAN NOT NULL DEFAULT true,
    "correct" BOOLEAN,
    "score" INTEGER,
    "hint_used" BOOLEAN NOT NULL DEFAULT false,
    "attempt_no" INTEGER NOT NULL DEFAULT 1,
    "duration_ms" INTEGER,
    "xp_awarded" INTEGER NOT NULL DEFAULT 0,
    "detail" JSONB,

    CONSTRAINT "learning_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "child_progress_state_child_id_key" ON "child_progress_state"("child_id");

-- CreateIndex
CREATE UNIQUE INDEX "topic_completions_child_id_skill_topic_id_key" ON "topic_completions"("child_id", "skill", "topic_id");

-- CreateIndex
CREATE UNIQUE INDEX "boss_clearances_child_id_level_key" ON "boss_clearances"("child_id", "level");

-- CreateIndex
CREATE UNIQUE INDEX "child_daily_stats_child_id_day_key" ON "child_daily_stats"("child_id", "day");

-- CreateIndex
CREATE UNIQUE INDEX "child_section_progress_child_id_skill_topic_id_section_key" ON "child_section_progress"("child_id", "skill", "topic_id", "section");

-- CreateIndex
CREATE INDEX "child_item_progress_child_id_item_ref_idx" ON "child_item_progress"("child_id", "item_ref");

-- CreateIndex
CREATE UNIQUE INDEX "child_item_progress_child_id_skill_topic_id_section_slot_key" ON "child_item_progress"("child_id", "skill", "topic_id", "section", "slot");

-- CreateIndex
CREATE INDEX "learning_events_child_id_local_day_occurred_at_idx" ON "learning_events"("child_id", "local_day", "occurred_at");

-- CreateIndex
CREATE INDEX "learning_events_child_id_kind_occurred_at_idx" ON "learning_events"("child_id", "kind", "occurred_at");

-- AddForeignKey
ALTER TABLE "child_progress_state" ADD CONSTRAINT "child_progress_state_child_id_fkey" FOREIGN KEY ("child_id") REFERENCES "child_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "topic_completions" ADD CONSTRAINT "topic_completions_child_id_fkey" FOREIGN KEY ("child_id") REFERENCES "child_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "boss_clearances" ADD CONSTRAINT "boss_clearances_child_id_fkey" FOREIGN KEY ("child_id") REFERENCES "child_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "child_daily_stats" ADD CONSTRAINT "child_daily_stats_child_id_fkey" FOREIGN KEY ("child_id") REFERENCES "child_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "child_section_progress" ADD CONSTRAINT "child_section_progress_child_id_fkey" FOREIGN KEY ("child_id") REFERENCES "child_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "child_item_progress" ADD CONSTRAINT "child_item_progress_child_id_fkey" FOREIGN KEY ("child_id") REFERENCES "child_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_events" ADD CONSTRAINT "learning_events_child_id_fkey" FOREIGN KEY ("child_id") REFERENCES "child_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
