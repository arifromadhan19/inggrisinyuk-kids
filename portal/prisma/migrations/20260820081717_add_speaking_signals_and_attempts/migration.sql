-- AlterTable: kolom baru ditambah nullable dulu, dibackfill dari data lama
-- (9 soal vocab = total_items historisnya sebelum listening/speaking
-- ditambah; attempt_number dibackfill per-anak dari urutan takenAt yang
-- sudah ada), baru dikunci NOT NULL — supaya baris lama tidak hilang.
ALTER TABLE "placement_test_results" ADD COLUMN     "attempt_number" INTEGER,
ADD COLUMN     "speaking_signals" JSONB,
ADD COLUMN     "total_items" INTEGER;

UPDATE "placement_test_results" SET "total_items" = 9 WHERE "total_items" IS NULL;

WITH ranked AS (
  SELECT "id", ROW_NUMBER() OVER (PARTITION BY "child_id" ORDER BY "taken_at" ASC) AS rn
  FROM "placement_test_results"
)
UPDATE "placement_test_results" p
SET "attempt_number" = ranked.rn
FROM ranked
WHERE p."id" = ranked."id" AND p."attempt_number" IS NULL;

ALTER TABLE "placement_test_results" ALTER COLUMN "total_items" SET NOT NULL;
ALTER TABLE "placement_test_results" ALTER COLUMN "attempt_number" SET NOT NULL;
