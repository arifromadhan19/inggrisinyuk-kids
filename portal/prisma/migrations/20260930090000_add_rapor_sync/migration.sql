-- Rapor Fase 3 (materi/rapor.md §6.7): data Rapor yang dulu cuma di perangkat
-- ikut akun. Semua JSON kecil (±60 hari / 7 game), digabung per kunci
-- (nilai terbesar) di lib/progress-write.ts supaya 2 perangkat tidak saling menimpa.
ALTER TABLE "child_progress_state" ADD COLUMN "active_ms" JSONB;      -- Store.activeMs      {hari: milidetik belajar aktif}
ALTER TABLE "child_progress_state" ADD COLUMN "daily_answers" JSONB;  -- Store.dailyAnswers  {hari: {n, ok}} (soal pilih/susun, tanpa mic)
ALTER TABLE "child_progress_state" ADD COLUMN "game_stats" JSONB;     -- Store.gameStats     {game: {correct, total}}
ALTER TABLE "child_progress_state" ADD COLUMN "game_xp" JSONB;        -- Store.gameXp        {game: xp}
