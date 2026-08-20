/**
 * Soal "First Placement Test" — HARUS identik (id, urutan skor) dengan
 * `portal/lib/placement-test-data.ts`, karena server yang re-scoring
 * (PRD §14/§16: "jangan percaya angka dari client"), cuma butuh questionId +
 * chosenEmoji yang match. Duplikasi kecil disengaja — beda build system
 * (esbuild vs Next.js), belum ada shared package (dicatat sbg kandidat
 * refactor kalau pola ini stabil).
 *
 * 3 kind (doc/first_placement_test.md §4): `vocab` (TTS 1 kata → tap emoji),
 * `listening` (cerita mini `story` → `question` → tap emoji, reuse pola
 * games/listening.ts), `speakingRecognition` (TTS `question` + tiap
 * `options[].label` → tap jawaban, preseden TOEFL Primary). Item mic terbuka
 * (TIDAK di-skor) ada terpisah di `PLACEMENT_OPENMIC_ITEMS` — beda bentuk
 * total karena bukan pilihan-ganda.
 */

export type PlacementLevelKey = 'starter' | 'explorer' | 'adventurer';

export type PlacementItemKind = 'vocab' | 'listening' | 'speakingRecognition';

export interface PlacementOption {
  emoji: string;
  /** speakingRecognition saja: frasa yang dibacakan TTS untuk opsi ini. */
  label?: string;
}

export interface PlacementQuestion {
  id: string;
  level: PlacementLevelKey;
  kind: PlacementItemKind;
  word?: string;
  story?: string[];
  question?: string;
  options: PlacementOption[];
}

export const PLACEMENT_QUESTIONS: PlacementQuestion[] = [
  { id: 's1', level: 'starter', kind: 'vocab', word: 'cat', options: [{ emoji: '🐱' }, { emoji: '🐶' }, { emoji: '🐰' }, { emoji: '🐟' }] },
  { id: 's2', level: 'starter', kind: 'vocab', word: 'red', options: [{ emoji: '🔴' }, { emoji: '🔵' }, { emoji: '🟢' }, { emoji: '🟡' }] },
  { id: 's3', level: 'starter', kind: 'vocab', word: 'apple', options: [{ emoji: '🍎' }, { emoji: '🍌' }, { emoji: '🍇' }, { emoji: '🍊' }] },

  { id: 'e1', level: 'explorer', kind: 'vocab', word: 'mother', options: [{ emoji: '👩' }, { emoji: '👨' }, { emoji: '👦' }, { emoji: '👵' }] },
  { id: 'e2', level: 'explorer', kind: 'vocab', word: 'book', options: [{ emoji: '📖' }, { emoji: '🎒' }, { emoji: '✏️' }, { emoji: '🖍️' }] },
  { id: 'e3', level: 'explorer', kind: 'vocab', word: 'run', options: [{ emoji: '🏃' }, { emoji: '🚶' }, { emoji: '🧍' }, { emoji: '💃' }] },

  { id: 'a1', level: 'adventurer', kind: 'vocab', word: 'hospital', options: [{ emoji: '🏥' }, { emoji: '🏫' }, { emoji: '🏠' }, { emoji: '🏪' }] },
  { id: 'a2', level: 'adventurer', kind: 'vocab', word: 'doctor', options: [{ emoji: '🧑‍⚕️' }, { emoji: '👮' }, { emoji: '🧑‍🍳' }, { emoji: '🧑‍🏫' }] },
  { id: 'a3', level: 'adventurer', kind: 'vocab', word: 'swim', options: [{ emoji: '🏊' }, { emoji: '🚴' }, { emoji: '⚽' }, { emoji: '🎣' }] },

  {
    id: 'l1',
    level: 'starter',
    kind: 'listening',
    story: ['Tom has a dog.', 'The dog is brown.'],
    question: 'What color is the dog?',
    options: [{ emoji: '🟤' }, { emoji: '⚪' }, { emoji: '⚫' }],
  },
  {
    id: 'l2',
    level: 'explorer',
    kind: 'listening',
    story: ['Mira has a red bag.', 'She goes to school with her mother.', 'They walk together.'],
    question: 'Who goes to school with Mira?',
    options: [{ emoji: '👩' }, { emoji: '👨' }, { emoji: '🐱' }, { emoji: '👦' }],
  },
  {
    id: 'l3',
    level: 'adventurer',
    kind: 'listening',
    story: ['Sam wakes up early.', 'He eats breakfast.', 'Then he rides his bike to the park.'],
    question: 'How does Sam go to the park?',
    options: [{ emoji: '🚲' }, { emoji: '🚗' }, { emoji: '🚌' }, { emoji: '🚶' }],
  },

  {
    id: 'sp1',
    level: 'starter',
    kind: 'speakingRecognition',
    question: 'How are you?',
    options: [
      { emoji: '1️⃣', label: "I'm happy!" },
      { emoji: '2️⃣', label: "It's a dog." },
      { emoji: '3️⃣', label: 'Red car.' },
    ],
  },
  {
    id: 'sp2',
    level: 'explorer',
    kind: 'speakingRecognition',
    question: "What's your name?",
    options: [
      { emoji: '1️⃣', label: "I'm fine, thank you." },
      { emoji: '2️⃣', label: 'My name is Rio.' },
      { emoji: '3️⃣', label: "It's a book." },
    ],
  },
  {
    id: 'sp3',
    level: 'adventurer',
    kind: 'speakingRecognition',
    question: 'Where do you live?',
    options: [
      { emoji: '1️⃣', label: 'I live in Jakarta.' },
      { emoji: '2️⃣', label: 'I like pizza.' },
      { emoji: '3️⃣', label: "It's Monday." },
    ],
  },
];

/** Speaking lapis 2 — mic terbuka, TIDAK di-skor untuk level (PRD §13.1).
 *  `matched`/`confidence` dihitung di client (ASR jalan di browser anak,
 *  server tidak pernah dengar audionya — pengecualian yang disengaja dari
 *  "jangan percaya client", aman karena tidak pernah menentukan level). */
export interface PlacementOpenMicItem {
  id: string;
  phrase: string;
}

export const PLACEMENT_OPENMIC_ITEMS: PlacementOpenMicItem[] = [{ id: 'om1', phrase: 'I am happy' }];
