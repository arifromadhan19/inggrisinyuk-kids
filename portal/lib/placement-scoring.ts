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
 * Pengecualian yang disengaja: jawaban `kind: 'openmic'` TIDAK bisa
 * di-re-score di server (ASR-nya jalan di browser anak, servernya tidak
 * pernah dengar audionya) — makanya dipisah total dari scoring, cuma
 * dicatat apa adanya sebagai `speakingSignals`. Ini aman karena openmic
 * tidak pernah ikut memutuskan `levelRecommended` (§4.4/§7.2a).
 */
import { PLACEMENT_LEVEL_ORDER, PLACEMENT_QUESTIONS, type PlacementLevelKey } from './placement-test-data';

export interface PlacementMcqAnswer {
  kind?: 'mcq';
  questionId: string;
  chosenEmoji: string;
}

export interface PlacementOpenmicAnswer {
  kind: 'openmic';
  questionId: string;
  matched: boolean;
  confidence: number;
}

export type PlacementAnswer = PlacementMcqAnswer | PlacementOpenmicAnswer;

export interface PlacementScoreResult {
  levelRecommended: PlacementLevelKey;
  correctByLevel: Record<PlacementLevelKey, number>;
  totalCorrect: number;
  totalItems: number;
  speakingSignals: PlacementOpenmicAnswer[];
}

/** 5 soal per band di data saat ini (3 vocab + 1 listening + 1 speaking
 *  recognition) — 3/5 benar (mayoritas) dianggap "lulus" band itu. Sengaja
 *  seragam per band (bukan makin ketat di band atas ala versi dewasa) supaya
 *  gampang dijelaskan & di-tuning nanti kalau jumlah soal berubah. */
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

  let levelRecommended: PlacementLevelKey = PLACEMENT_LEVEL_ORDER[0];
  for (const level of PLACEMENT_LEVEL_ORDER) {
    if (correctByLevel[level] >= THRESHOLD[level]) {
      levelRecommended = level;
    } else {
      break;
    }
  }

  return { levelRecommended, correctByLevel, totalCorrect, totalItems: PLACEMENT_QUESTIONS.length, speakingSignals };
}

/** Level yang beneran punya materi di app/ hari ini (app/src/content.ts,
 *  `hasContent:true`) — cuma Explorer (PRD §9/§13.3 RESEARCH). Update array
 *  ini manual begitu Starter/Adventurer sudah diauthoring; scoring &
 *  fallback di bawah otomatis ikut tanpa perubahan logic lain. */
const CONTENT_AVAILABLE: PlacementLevelKey[] = ['explorer'];

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
