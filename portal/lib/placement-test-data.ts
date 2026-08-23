/**
 * Soal "Main Dulu, Yuk!" (placement test) — dikurasi manual di sini, BUKAN
 * diimpor lintas-paket dari app/src/content.ts (beda package/build system:
 * app/ = esbuild statis, portal/ = Next.js). Duplikasi kecil disengaja untuk
 * v1 — kandidat refactor ke shared package kalau pola ini terbukti stabil
 * (lihat PRD.md §14).
 *
 * 4 skill (doc/first_placement_test.md §4): `vocab` (TTS ucapkan soal, dua
 * arah — lihat `PlacementQuestion.direction` — → tap teks jawaban),
 * `reading` (baca SENDIRI `story` 1-2 kalimat pendek, TERTULIS, TANPA TTS
 * → jawab `question` → tap GAMBAR — format riset Cambridge Pre A1 Starters
 * Reading Task 2/5 "read & answer"; opsi SENGAJA tanpa `label` teks
 * meskipun datanya ada, lihat komentar `PlacementOption.label` di bawah),
 * `listening` (cerita mini via `story` → 1 `question` DIUCAPKAN → tap
 * emoji berlabel, reuse pola games/listening.ts),
 * `speakingRecognition` (TTS ucapkan `question` SAJA → tap jawaban dari
 * `options.label` yang tertulis di layar — dulu tiap label ikut dibacakan
 * TTS juga, permintaan user: cukup soal yang dibacakan, jawabannya tidak
 * perlu — preseden TOEFL Primary, deterministik, TIDAK bergantung akurasi
 * ASR). Keempatnya di-skor sama persis: cocokkan
 * `chosenEmoji` ke `options[].correct`. Item mic terbuka (open-mic — tidak
 * ikut memutuskan level, tapi ikut angka skor total, lihat
 * `PLACEMENT_OPENMIC_ITEMS` + placement-scoring.ts) ada terpisah di bawah.
 */

export type PlacementLevelKey = 'starter' | 'explorer' | 'adventurer';

/** Urutan level dari yang paling awal — dipakai scoring "mastery/ceiling". */
export const PLACEMENT_LEVEL_ORDER: PlacementLevelKey[] = ['starter', 'explorer', 'adventurer'];

export type PlacementItemKind = 'vocab' | 'reading' | 'listening' | 'speakingRecognition';

export interface PlacementOption {
  emoji: string;
  correct: boolean;
  /** speakingRecognition: teks pilihan jawaban — tampil di layar, TIDAK
   *  dibacakan TTS (cukup `question` yang diucapkan; permintaan user).
   *  reading:
   *  field ini SENGAJA TIDAK dirender di client (app/src/games/placement.ts
   *  `drawMcqStep`) meskipun datanya ada di sini (pool opsi dipakai bareng
   *  skill lain) — kalau ditampilkan, kata di label bisa identik dengan
   *  kata di `story`/`question`, anak tinggal cocokkan teks tanpa benar-
   *  benar membaca (bug nyata, dilaporkan user). Server tidak peduli field
   *  ini sama sekali (scoring cuma pakai `chosenEmoji`+`correct`). */
  label?: string;
}

export interface PlacementQuestion {
  id: string;
  level: PlacementLevelKey;
  kind: PlacementItemKind;
  /** vocab arah 'idToEn': soal (diucapkan TTS bahasa Inggris via speak()).
   *  vocab arah 'enToId': soal (diucapkan TTS bahasa Inggris, ini kata
   *  Inggrisnya). reading TIDAK pakai field ini lagi — pakai `story` +
   *  `question` (lihat di bawah), sama seperti listening tapi dibaca
   *  sendiri (silent), bukan diucapkan. */
  word?: string;
  /** vocab arah 'idToEn': soal bahasa Indonesia (diucapkan TTS Indonesia
   *  via speakLocalized(), anak cari arti Inggrisnya di opsi teks). vocab
   *  arah 'enToId': jawaban benar bahasa Indonesia (tidak diucapkan, cuma
   *  dipakai susun opsi teks Indonesia). */
  wordId?: string;
  /** vocab saja: arah soal. 'idToEn' = soal Indonesia, cari arti Inggris.
   *  'enToId' = soal Inggris, cari arti Indonesia. Permintaan user: soal
   *  vocab dua arah, tetap pakai suara, tanpa gambar sama sekali. */
  direction?: 'idToEn' | 'enToId';
  /** reading: 1-2 kalimat pendek TERTULIS, dibaca sendiri (silent, TANPA
   *  TTS). listening: cerita mini yang sama bentuknya tapi DIUCAPKAN via
   *  speakSequence(), 2-3 kalimat. */
  story?: string[];
  /** reading & listening: pertanyaan tentang `story`. reading TERTULIS di
   *  layar (silent read); listening & speakingRecognition diucapkan TTS. */
  question?: string;
  options: PlacementOption[];
}

export const PLACEMENT_QUESTIONS: PlacementQuestion[] = [
  // --- Vocab — dua arah (permintaan user), tetap pakai suara, tanpa
  // gambar. 'idToEn': soal diucapkan bahasa Indonesia (speakLocalized),
  // opsi teks Inggris. 'enToId': soal diucapkan bahasa Inggris (speak),
  // opsi teks Indonesia. 4 soal total: 2 idToEn + 2 enToId. ---
  {
    id: 's1',
    level: 'starter',
    kind: 'vocab',
    direction: 'idToEn',
    word: 'cat',
    wordId: 'kucing',
    options: [
      { emoji: '🐱', label: 'cat', correct: true },
      { emoji: '🐶', label: 'dog', correct: false },
      { emoji: '🐰', label: 'rabbit', correct: false },
      { emoji: '🐟', label: 'fish', correct: false },
      { emoji: '🐦', label: 'bird', correct: false },
      { emoji: '🐸', label: 'frog', correct: false },
    ],
  },
  {
    id: 's2',
    level: 'starter',
    kind: 'vocab',
    direction: 'enToId',
    word: 'red',
    wordId: 'merah',
    options: [
      { emoji: '🔴', label: 'merah', correct: true },
      { emoji: '🔵', label: 'biru', correct: false },
      { emoji: '🟢', label: 'hijau', correct: false },
      { emoji: '🟡', label: 'kuning', correct: false },
      { emoji: '⚪', label: 'putih', correct: false },
      { emoji: '⚫', label: 'hitam', correct: false },
    ],
  },

  {
    id: 'e1',
    level: 'explorer',
    kind: 'vocab',
    direction: 'idToEn',
    word: 'mother',
    wordId: 'ibu',
    options: [
      { emoji: '👩', label: 'mother', correct: true },
      { emoji: '👨', label: 'father', correct: false },
      { emoji: '👦', label: 'brother', correct: false },
      { emoji: '👧', label: 'sister', correct: false },
      { emoji: '👵', label: 'grandmother', correct: false },
      { emoji: '👴', label: 'grandfather', correct: false },
    ],
  },

  {
    id: 'a1',
    level: 'adventurer',
    kind: 'vocab',
    direction: 'enToId',
    word: 'teacher',
    wordId: 'guru',
    options: [
      { emoji: '🧑‍⚕️', label: 'dokter', correct: false },
      { emoji: '👮', label: 'polisi', correct: false },
      { emoji: '🧑‍🍳', label: 'koki', correct: false },
      { emoji: '🧑‍🏫', label: 'guru', correct: true },
      { emoji: '👨‍🌾', label: 'petani', correct: false },
      { emoji: '👩‍🚒', label: 'pemadam kebakaran', correct: false },
    ],
  },

  // --- Reading — baca SENDIRI 1-2 kalimat pendek (silent, TANPA TTS) lalu
  // jawab pertanyaan dengan tap GAMBAR. Format riset: Cambridge Pre A1
  // Starters Reading Task 2/5 "read short text about a picture, answer a
  // question" (doc/first_placement_test.md §Reading). Opsi SENGAJA tanpa
  // label teks di client (lihat komentar `PlacementOption.label` di atas)
  // — kalau ditampilkan, kata di opsi bisa identik dengan kata di soal,
  // anak tinggal cocokkan teks tanpa benar-benar membaca (bug nyata,
  // dilaporkan user). Non-punitive tetap terjaga: yang belum bisa baca
  // cukup menebak & lanjut seperti biasa.
  //
  // REVISI (dilaporkan user lagi, kasus konkret r1): menghilangkan label
  // SAJA ternyata belum cukup — kalau cuma ADA SATU kata benda di seluruh
  // story yang match salah satu gambar opsi (mis. "dog" — satu-satunya kata
  // hewan di cerita), anak bisa menebak benar cuma dgn mengenali SATU kata
  // familiar + cocokkan ke gambar, TANPA benar-benar memproses kalimatnya
  // (bias "construct-irrelevant" — soal jadi tes "kenal 1 kata", bukan tes
  // paham bacaan). Perbaikan: SEMUA `story` di bawah sekarang sengaja
  // menyebut distraktor-nya JUGA di teks (bukan cuma jawaban benar) —
  // anak WAJIB membedakan lewat kata kerja/konteks yang tepat (mis. "sees"
  // vs "has", "visits...today" vs "works at", "does not want" vs "wants")
  // supaya tidak bisa ditembak dari 1 kata kunci — pola yang sama dgn
  // `READING_TOPICS_ADVENTURER` topik 'kebun-binatang' di app/src/
  // content.ts (soal "hewan favorit Zoe" — lion & elephant SENGAJA disebut
  // juga di teks sbg distraktor, bukan cuma jawaban panda). ---
  {
    id: 'r1',
    level: 'starter',
    kind: 'reading',
    story: ['Tom sees a cat.', 'Tom has a dog.'],
    question: 'What pet does Tom have?',
    options: [
      { emoji: '🐱', label: 'cat', correct: false },
      { emoji: '🐶', label: 'dog', correct: true },
      { emoji: '🐰', label: 'rabbit', correct: false },
      { emoji: '🐟', label: 'fish', correct: false },
      { emoji: '🐦', label: 'bird', correct: false },
      { emoji: '🐸', label: 'frog', correct: false },
    ],
  },
  {
    id: 'r2',
    level: 'explorer',
    kind: 'reading',
    story: ['My father visits the school today.', 'He works at the hospital.'],
    question: 'Where does father work?',
    options: [
      { emoji: '🏥', label: 'hospital', correct: true },
      { emoji: '🏫', label: 'school', correct: false },
      { emoji: '🏠', label: 'house', correct: false },
      { emoji: '🏪', label: 'store', correct: false },
      { emoji: '🏦', label: 'bank', correct: false },
      { emoji: '🏛️', label: 'museum', correct: false },
    ],
  },
  {
    id: 'r3',
    level: 'adventurer',
    kind: 'reading',
    story: ['Sam does not want to be a doctor.', 'He wants to teach children at school.'],
    question: 'What job does Sam want?',
    options: [
      { emoji: '🧑‍⚕️', label: 'doctor', correct: false },
      { emoji: '👮', label: 'police officer', correct: false },
      { emoji: '🧑‍🍳', label: 'chef', correct: false },
      { emoji: '🧑‍🏫', label: 'teacher', correct: true },
      { emoji: '👨‍🌾', label: 'farmer', correct: false },
      { emoji: '👩‍🚒', label: 'firefighter', correct: false },
    ],
  },

  // --- Listening: cerita mini (2-3 kalimat) → 1 pertanyaan → tap emoji
  // (§4.3). Sama prinsip anti-tebak spt Reading di atas — distraktor JUGA
  // disebut di `story`, cuma lewat TELINGA (diucapkan, bukan dibaca)
  // sehingga anak wajib benar-benar dengar & pahami KALIMAT MANA yang
  // menjawab `question`, bukan cuma menangkap 1 kata familiar yang
  // kebetulan match gambar. ---
  {
    id: 'l1',
    level: 'starter',
    kind: 'listening',
    story: ['Tom has a red ball.', 'The dog is brown.'],
    question: 'What color is the dog?',
    options: [
      { emoji: '🟤', label: 'brown', correct: true },
      { emoji: '⚪', label: 'white', correct: false },
      { emoji: '⚫', label: 'black', correct: false },
      { emoji: '🔴', label: 'red', correct: false },
      { emoji: '🟡', label: 'yellow', correct: false },
      { emoji: '🟢', label: 'green', correct: false },
    ],
  },
  {
    id: 'l2',
    level: 'explorer',
    kind: 'listening',
    story: ["Mira's father drives to work.", 'Mira goes to school with her mother.', 'They walk together.'],
    question: 'Who goes to school with Mira?',
    options: [
      { emoji: '👩', label: 'mother', correct: true },
      { emoji: '👨', label: 'father', correct: false },
      { emoji: '🐱', label: 'cat', correct: false },
      { emoji: '👦', label: 'brother', correct: false },
      { emoji: '👧', label: 'sister', correct: false },
      { emoji: '👵', label: 'grandmother', correct: false },
    ],
  },
  {
    id: 'l3',
    level: 'adventurer',
    kind: 'listening',
    story: ['Sam wakes up early and eats breakfast.', 'His sister takes the bus to school.', 'Sam rides his bike to the park.'],
    question: 'How does Sam go to the park?',
    options: [
      { emoji: '🚲', label: 'bicycle', correct: true },
      { emoji: '🚗', label: 'car', correct: false },
      { emoji: '🚌', label: 'bus', correct: false },
      { emoji: '🚶', label: 'walk', correct: false },
      { emoji: '🛴', label: 'scooter', correct: false },
      { emoji: '🏍️', label: 'motorcycle', correct: false },
    ],
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
 * Speaking (lapis 2): mic terbuka "Ucapkan & Cek" (§4.4/§7.2a) — TIDAK ikut
 * memutuskan level, TAPI ikut angka skor total (13 pilihan-ganda + 3 item mic
 * = 16, lihat placement-scoring.ts § di atas).
 * Selalu dianggap berhasil ke anak (PRD §13.1 — "ASR anak tidak selalu
 * akurat"), TAPI `wordRatio` (rasio kata target yang kedengaran, skor
 * proporsional) + `matched` (turunan ambang dari `wordRatio` yang sama,
 * bukan fungsi longgar terpisah lagi) + `confidence` (dari
 * `SpeechRecognitionAlternative.confidence`, gratis dalam paket respons yang
 * sama) tetap DIEVALUASI & disimpan sebagai sinyal internal di
 * `PlacementTestResult.speakingSignals` — `matched` dipakai `totalCorrect`,
 * dan tidak satu pun dari ketiganya pernah mempengaruhi levelRecommended.
 * 3 item (permintaan user, sebelumnya cuma 1) — makin panjang tiap item,
 * yang terakhir 1 kalimat penuh. Server tidak butuh teksnya sama sekali
 * (ASR jalan di client), disertakan di sini cuma biar 2 file gampang
 * dibandingkan.
 */
export interface PlacementOpenMicItem {
  id: string;
  phrase: string;
}

export const PLACEMENT_OPENMIC_ITEMS: PlacementOpenMicItem[] = [
  { id: 'om1', phrase: 'I am happy' },
  { id: 'om2', phrase: 'I like my school' },
  { id: 'om3', phrase: 'I go to school every day' },
];
