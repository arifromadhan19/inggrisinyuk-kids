/**
 * Scoring "mastery/ceiling" — konsep sama dengan placement test inggrisinyuk
 * dewasa (mulai dari level pertama, naik selama threshold band itu
 * terpenuhi, berhenti di kegagalan threshold pertama), tapi generik untuk N
 * level (bukan hardcode 6 CEFR) dan deterministik/non-AI (selaras PRD §5).
 *
 * PENTING: fungsi ini dipanggil di SERVER dari jawaban mentah (bukan angka
 * yang dikirim client) — pola yang sama dengan inggrisinyuk dewasa ("jangan
 * percaya angka dari client"), lihat app/api/placement-test/route.ts.
 *
 * Jawaban `kind: 'openmic'` diperlakukan BEDA — dan pembedaannya sekarang
 * ada di DUA lapis terpisah, jangan dicampur lagi:
 *
 *  1. `totalCorrect`/`totalItems` (ANGKA SKOR yang dilihat anak & orang tua)
 *     SUDAH termasuk openmic: total item = 13 pilihan-ganda + 3 item mic =
 *     16. Ini yang dilaporkan user — bar progress selama tes memang sudah
 *     menghitung 16 item (app/src/games/placement.ts `TOTAL_ITEMS`), jadi
 *     layar hasil yang cuma bilang "dari 13" bikin anak merasa 3 kegiatan
 *     terakhirnya hilang begitu saja. Server tidak bisa RE-score openmic
 *     (ASR-nya jalan di browser anak, server tidak pernah dengar audionya),
 *     jadi yang dipakai di sini adalah field `matched` yang sudah dihitung
 *     client dari rasio kata (`wordRatio`, ambang di
 *     `OPENMIC_MATCHED_THRESHOLD`) — sinyal yang sama dengan bintang yang
 *     anak lihat di layar, bukan fungsi longgar terpisah.
 *  2. `levelRecommended`/`correctByLevel` (KEPUTUSAN LEVEL) tetap MURNI dari
 *     13 soal pilihan-ganda — openmic TIDAK pernah ikut, sesuai aturan yang
 *     dikunci di PRD §13.1/§4.4/§7.2a: ASR browser terhadap suara anak tidak
 *     cukup andal untuk sampai menurunkan rekomendasi level. Jangan pernah
 *     menambahkan openmic ke `correctByLevel` cuma karena sekarang dia ikut
 *     di angka total.
 *
 * Aslinya (apa adanya, tanpa diringkas jadi skor) tetap disimpan di
 * `speakingSignals` seperti sebelumnya.
 */
import {
  PLACEMENT_LEVEL_ORDER,
  PLACEMENT_OPENMIC_ITEMS,
  PLACEMENT_QUESTIONS,
  type PlacementLevelKey,
} from './placement-test-data';

export interface PlacementMcqAnswer {
  kind?: 'mcq';
  questionId: string;
  chosenEmoji: string;
}

export interface PlacementOpenmicAnswer {
  kind: 'openmic';
  questionId: string;
  /** Turunan `wordRatio >= ambang` (lihat app/src/games/placement.ts) —
   *  konsisten dengan bintang yang anak lihat di layar, bukan fungsi
   *  longgar terpisah lagi. */
  matched: boolean;
  /** Rasio kata target yang kedengaran (0-1) — skor proporsional
   *  sesungguhnya. Contoh: "I like my school" yang cuma kedengaran
   *  "school" → ~0.25, BUKAN skor penuh. */
  wordRatio: number;
  confidence: number;
}

export type PlacementAnswer = PlacementMcqAnswer | PlacementOpenmicAnswer;

export interface PlacementScoreResult {
  /** MURNI dari 13 soal pilihan-ganda — openmic tidak pernah ikut (§ atas). */
  levelRecommended: PlacementLevelKey;
  /** Idem `levelRecommended`: cuma pilihan-ganda, per band level. */
  correctByLevel: Record<PlacementLevelKey, number>;
  /** Angka skor yang dilihat anak/orang tua — pilihan-ganda + item mic yang
   *  `matched` (§ atas). Selalu ≤ `totalItems`. */
  totalCorrect: number;
  /** 13 pilihan-ganda + 3 item mic = 16 — sama dengan jumlah item yang
   *  dihitung bar progress selama tes (games/placement.ts `TOTAL_ITEMS`). */
  totalItems: number;
  speakingSignals: PlacementOpenmicAnswer[];
}

/** Jumlah soal per band TIDAK lagi seragam sejak vocab jadi dua arah
 *  (starter dapat 2 soal vocab — s1 idToEn + s2 enToId — sedangkan
 *  explorer/adventurer masing-masing cuma 1): starter 5 soal (2 vocab + 1
 *  reading + 1 listening + 1 speaking), explorer & adventurer 4 soal
 *  masing-masing (1+1+1+1). Threshold dipilih ~mayoritas per band
 *  (3/5≈60%, 3/4=75%) — semangatnya sama dgn desain sebelumnya (4/6≈67%),
 *  cuma disesuaikan karena totalnya sekarang beda tiap band. */
const THRESHOLD: Record<PlacementLevelKey, number> = {
  starter: 3,
  explorer: 3,
  adventurer: 3,
};

export function scorePlacement(answers: PlacementAnswer[]): PlacementScoreResult {
  const correctByLevel: Record<PlacementLevelKey, number> = { starter: 0, explorer: 0, adventurer: 0 };
  let totalCorrect = 0;
  const speakingSignals: PlacementOpenmicAnswer[] = [];

  for (const answer of answers) {
    if (answer.kind === 'openmic') {
      speakingSignals.push(answer);
    }
  }

  for (const question of PLACEMENT_QUESTIONS) {
    const answer = answers.find((a) => a.kind !== 'openmic' && a.questionId === question.id) as
      | PlacementMcqAnswer
      | undefined;
    if (!answer) continue;
    const chosen = question.options.find((o) => o.emoji === answer.chosenEmoji);
    if (chosen?.correct) {
      correctByLevel[question.level] += 1;
      totalCorrect += 1;
    }
  }

  // Level DIPUTUS DI SINI, sebelum openmic ikut ditambahkan ke angka total di
  // bawah — urutan ini disengaja: `correctByLevel` (satu-satunya masukan
  // keputusan level) sudah final & tidak pernah menyentuh openmic (PRD §13.1).
  let levelRecommended: PlacementLevelKey = PLACEMENT_LEVEL_ORDER[0];
  for (const level of PLACEMENT_LEVEL_ORDER) {
    if (correctByLevel[level] >= THRESHOLD[level]) {
      levelRecommended = level;
    } else {
      break;
    }
  }

  // Item mic ikut angka skor (bukan level) — diiterasi dari daftar item milik
  // SERVER (`PLACEMENT_OPENMIC_ITEMS`), bukan dari array jawaban client, pola
  // defensif yang sama dengan loop pilihan-ganda di atas: id yang tidak
  // dikenal diabaikan & jawaban dobel untuk item yang sama tidak bisa
  // menggandakan skor.
  const openmicCorrect = PLACEMENT_OPENMIC_ITEMS.filter((item) =>
    speakingSignals.some((signal) => signal.questionId === item.id && signal.matched)
  ).length;

  return {
    levelRecommended,
    correctByLevel,
    totalCorrect: totalCorrect + openmicCorrect,
    totalItems: PLACEMENT_QUESTIONS.length + PLACEMENT_OPENMIC_ITEMS.length,
    speakingSignals,
  };
}

/** Level yang beneran punya materi di app/ hari ini (app/src/content.ts,
 *  `hasContent:true` + `*_TOPICS_BY_LEVEL`) — Starter (Vocabulary saja,
 *  materi/vocab.md), Explorer & Adventurer. Update array ini manual begitu
 *  Achiever/Trailblazer juga diauthoring; scoring & fallback di bawah
 *  otomatis ikut tanpa perubahan logic lain. */
const CONTENT_AVAILABLE: PlacementLevelKey[] = ['starter', 'explorer', 'adventurer'];

/** Rekomendasi mentah tetap disimpan apa adanya di DB (§ di atas) — fungsi
 *  ini cuma dipakai saat membuat link "Buka App Anak" (lihat app/dashboard),
 *  supaya anak tidak diarahkan ke level yang materinya belum ada. */
export function resolvePlayableLevel(recommended: PlacementLevelKey): PlacementLevelKey {
  if (CONTENT_AVAILABLE.includes(recommended)) return recommended;

  const targetIdx = PLACEMENT_LEVEL_ORDER.indexOf(recommended);
  let best: PlacementLevelKey | null = null;
  let bestDistance = Infinity;
  for (const level of CONTENT_AVAILABLE) {
    const distance = Math.abs(PLACEMENT_LEVEL_ORDER.indexOf(level) - targetIdx);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = level;
    }
  }
  return best ?? 'explorer';
}
