-- Rapor "Hasil Game" per markas (materi/rapor.md §7): Store.gameMarkas
-- {game: {indexMarkas: {c, t, h, name, emoji}}}, digabung per markas di
-- lib/progress-write.ts (total terbesar menang, petunjuk = terbesar).
ALTER TABLE "child_progress_state" ADD COLUMN "game_markas" JSONB;
