/**
 * Soal "Main Dulu, Yuk!" (placement test) — dikurasi manual di sini, BUKAN
 * diimpor lintas-paket dari app/src/content.ts (beda package/build system:
 * app/ = esbuild statis, portal/ = Next.js). Duplikasi kecil disengaja untuk
 * v1 — kandidat refactor ke shared package kalau pola ini terbukti stabil
 * (lihat PRD.md §14).
 *
 * 4 skill (doc/first_placement_test.md §4): `vocab` (TTS ucapkan 1 kata →
 * tap emoji, reuse pola vocabulary.ts), `listening` (cerita mini via
 * `story` → 1 `question` → tap emoji, reuse pola games/listening.ts),
 * `speakingRecognition` (TTS ucapkan `question` → 3 `options.label` yang
 * juga dibacakan TTS → tap jawaban, preseden TOEFL Primary — deterministik,
 * TIDAK bergantung akurasi ASR). Ketiganya di-skor sama persis: cocokkan
 * `chosenEmoji` ke `options[].correct`. Item mic terbuka (open-mic, TIDAK
 * di-skor) ada terpisah di `PLACEMENT_OPENMIC_ITEMS` di bawah.
 */

export type PlacementLevelKey = 'starter' | 'explorer' | 'adventurer';

/** Urutan level dari yang paling awal — dipakai scoring "mastery/ceiling". */
export const PLACEMENT_LEVEL_ORDER: PlacementLevelKey[] = ['starter', 'explorer', 'adventurer'];

export type PlacementItemKind = 'vocab' | 'listening' | 'speakingRecognition';

export interface PlacementOption {
  emoji: string;
  correct: boolean;
  /** speakingRecognition saja: frasa yang dibacakan TTS untuk opsi ini. */
  label?: string;
}

export interface PlacementQuestion {
  id: string;
  level: PlacementLevelKey;
  kind: PlacementItemKind;
  /** vocab saja: kata yang diucapkan TTS — bukan ditampilkan sebagai teks besar (audio-first, banyak anak pre-reader). */
  word?: string;
  /** listening saja: 2-3 kalimat cerita mini, diputar berurutan (speakSequence). */
  story?: string[];
  /** listening & speakingRecognition: pertanyaan yang diucapkan TTS. */
  question?: string;
  options: PlacementOption[];
}

export const PLACEMENT_QUESTIONS: PlacementQuestion[] = [
  // --- Starter band: kosakata paling dasar (warna, hewan, buah) ---
  {
    id: 's1',
    level: 'starter',
    kind: 'vocab',
    word: 'cat',
    options: [{ emoji: '🐱', correct: true }, { emoji: '🐶', correct: false }, { emoji: '🐰', correct: false }, { emoji: '🐟', correct: false }],
  },
  {
    id: 's2',
    level: 'starter',
    kind: 'vocab',
    word: 'red',
    options: [{ emoji: '🔴', correct: true }, { emoji: '🔵', correct: false }, { emoji: '🟢', correct: false }, { emoji: '🟡', correct: false }],
  },
  {
    id: 's3',
    level: 'starter',
    kind: 'vocab',
    word: 'apple',
    options: [{ emoji: '🍎', correct: true }, { emoji: '🍌', correct: false }, { emoji: '🍇', correct: false }, { emoji: '🍊', correct: false }],
  },

  // --- Explorer band: perkenalan/keluarga (selaras materi Explorer yang sudah ada) ---
  {
    id: 'e1',
    level: 'explorer',
    kind: 'vocab',
    word: 'mother',
    options: [{ emoji: '👩', correct: true }, { emoji: '👨', correct: false }, { emoji: '👦', correct: false }, { emoji: '👵', correct: false }],
  },
  {
    id: 'e2',
    level: 'explorer',
    kind: 'vocab',
    word: 'book',
    options: [{ emoji: '📖', correct: true }, { emoji: '🎒', correct: false }, { emoji: '✏️', correct: false }, { emoji: '🖍️', correct: false }],
  },
  {
    id: 'e3',
    level: 'explorer',
    kind: 'vocab',
    word: 'run',
    options: [{ emoji: '🏃', correct: true }, { emoji: '🚶', correct: false }, { emoji: '🧍', correct: false }, { emoji: '💃', correct: false }],
  },

  // --- Adventurer band: kosakata lebih luas (tempat, profesi, aktivitas) ---
  {
    id: 'a1',
    level: 'adventurer',
    kind: 'vocab',
    word: 'hospital',
    options: [{ emoji: '🏥', correct: true }, { emoji: '🏫', correct: false }, { emoji: '🏠', correct: false }, { emoji: '🏪', correct: false }],
  },
  {
    id: 'a2',
    level: 'adventurer',
    kind: 'vocab',
    word: 'doctor',
    options: [{ emoji: '🧑‍⚕️', correct: true }, { emoji: '👮', correct: false }, { emoji: '🧑‍🍳', correct: false }, { emoji: '🧑‍🏫', correct: false }],
  },
  {
    id: 'a3',
    level: 'adventurer',
    kind: 'vocab',
    word: 'swim',
    options: [{ emoji: '🏊', correct: true }, { emoji: '🚴', correct: false }, { emoji: '⚽', correct: false }, { emoji: '🎣', correct: false }],
  },

  // --- Listening: cerita mini (2-3 kalimat) → 1 pertanyaan → tap emoji (§4.3) ---
  {
    id: 'l1',
    level: 'starter',
    kind: 'listening',
    story: ['Tom has a dog.', 'The dog is brown.'],
    question: 'What color is the dog?',
    options: [{ emoji: '🟤', correct: true }, { emoji: '⚪', correct: false }, { emoji: '⚫', correct: false }],
  },
  {
    id: 'l2',
    level: 'explorer',
    kind: 'listening',
    story: ['Mira has a red bag.', 'She goes to school with her mother.', 'They walk together.'],
    question: 'Who goes to school with Mira?',
    options: [{ emoji: '👩', correct: true }, { emoji: '👨', correct: false }, { emoji: '🐱', correct: false }, { emoji: '👦', correct: false }],
  },
  {
    id: 'l3',
    level: 'adventurer',
    kind: 'listening',
    story: ['Sam wakes up early.', 'He eats breakfast.', 'Then he rides his bike to the park.'],
    question: 'How does Sam go to the park?',
    options: [{ emoji: '🚲', correct: true }, { emoji: '🚗', correct: false }, { emoji: '🚌', correct: false }, { emoji: '🚶', correct: false }],
  },

  // --- Speaking (lapis 1, DI-SKOR): format recognition, preseden TOEFL Primary
  // (§4.4) — deterministik, tidak bergantung akurasi ASR terhadap suara anak.
  // TTS bacakan `question`, lalu bacakan tiap `options[].label` berurutan;
  // anak tap 1 dari 3 kartu bernomor. ---
  {
    id: 'sp1',
    level: 'starter',
    kind: 'speakingRecognition',
    question: 'How are you?',
    options: [
      { emoji: '1️⃣', label: "I'm happy!", correct: true },
      { emoji: '2️⃣', label: "It's a dog.", correct: false },
      { emoji: '3️⃣', label: 'Red car.', correct: false },
    ],
  },
  {
    id: 'sp2',
    level: 'explorer',
    kind: 'speakingRecognition',
    question: "What's your name?",
    options: [
      { emoji: '1️⃣', label: "I'm fine, thank you.", correct: false },
      { emoji: '2️⃣', label: 'My name is Rio.', correct: true },
      { emoji: '3️⃣', label: "It's a book.", correct: false },
    ],
  },
  {
    id: 'sp3',
    level: 'adventurer',
    kind: 'speakingRecognition',
    question: 'Where do you live?',
    options: [
      { emoji: '1️⃣', label: 'I live in Jakarta.', correct: true },
      { emoji: '2️⃣', label: 'I like pizza.', correct: false },
      { emoji: '3️⃣', label: "It's Monday.", correct: false },
    ],
  },
];

/**
 * Speaking (lapis 2, TIDAK di-skor): mic terbuka "Ucapkan & Cek" (§4.4/§7.2a).
 * Selalu dianggap berhasil ke anak (PRD §13.1 — "ASR anak tidak selalu
 * akurat"), TAPI `matched` (dari `looseMatch()`) + `confidence` (dari
 * `SpeechRecognitionAlternative.confidence`, gratis dalam paket respons yang
 * sama) tetap DIEVALUASI & disimpan sebagai sinyal internal di
 * `PlacementTestResult.speakingSignals` — never mempengaruhi levelRecommended.
 * Cuma 1 item (bukan per-band, doc §4.6 blueprint) karena hasilnya memang
 * tidak dipakai untuk menentukan band.
 */
export interface PlacementOpenMicItem {
  id: string;
  phrase: string;
}

export const PLACEMENT_OPENMIC_ITEMS: PlacementOpenMicItem[] = [{ id: 'om1', phrase: 'I am happy' }];
