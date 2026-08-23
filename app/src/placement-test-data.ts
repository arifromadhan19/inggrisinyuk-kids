/**
 * Soal "First Placement Test" — HARUS identik (id, urutan skor, `correct`)
 * dengan `portal/lib/placement-test-data.ts`. Server TETAP satu-satunya
 * sumber kebenaran untuk `levelRecommended` (PRD §14/§16: "jangan percaya
 * angka dari client" — re-scoring server dari `questionId`+`chosenEmoji`,
 * lihat account.ts `submitPlacementTest`). `correct` di sini CUMA dipakai
 * client buat feedback UI instan per-item (animasi/suara — permintaan
 * user), bukan buat menghitung level — client tidak pernah mengirim
 * `correct` balik ke server, jadi tidak ada baris "percaya client" yang
 * benar-benar dilanggar. Duplikasi kecil disengaja — beda build system
 * (esbuild vs Next.js), belum ada shared package (dicatat sbg kandidat
 * refactor kalau pola ini stabil).
 *
 * 4 kind (doc/first_placement_test.md §4): `vocab` (TTS soal → tap teks
 * jawaban, dua arah lihat `PlacementQuestion.direction`), `reading` (baca
 * SENDIRI `story` 1-2 kalimat pendek, TERTULIS, TANPA TTS → jawab
 * `question` → tap GAMBAR — format riset Cambridge Pre A1 Starters Reading
 * Task 2/5 "read & answer", sengaja beda dari `listening` yang diucapkan;
 * opsi SENGAJA tanpa label teks di bawah emoji, beda dari kind lain,
 * supaya tidak bisa dicocokkan visual dari teks soal tanpa benar-benar
 * membaca), `listening` (cerita mini `story` → `question` → tap emoji
 * berlabel, reuse pola games/listening.ts), `speakingRecognition` (TTS
 * `question` SAJA → tap jawaban dari `options[].label` yang tertulis di
 * layar — dulu tiap label ikut dibacakan TTS juga, permintaan user:
 * cukup soal yang dibacakan, jawabannya tidak perlu — preseden TOEFL
 * Primary). Item mic terbuka (tidak ikut memutuskan level, tapi ikut angka
 * skor total — lihat catatan di `PLACEMENT_OPENMIC_ITEMS`) ada terpisah di
 * `PLACEMENT_OPENMIC_ITEMS` — beda bentuk total karena bukan pilihan-ganda.
 */

export type PlacementLevelKey = 'starter' | 'explorer' | 'adventurer';

export type PlacementItemKind = 'vocab' | 'reading' | 'listening' | 'speakingRecognition';

export interface PlacementOption {
  emoji: string;
  /** speakingRecognition: teks pilihan jawaban — TAMPIL di layar, TIDAK
   *  dibacakan TTS (permintaan user: cukup `question` yang diucapkan, opsi
   *  dibaca sendiri oleh anak). vocab: teks pilihan (Inggris utk arah
   *  idToEn, Indonesia utk arah enToId) — TIDAK dibacakan TTS, cuma
   *  soalnya (word/wordId) yang diucapkan.
   *  listening: kata Inggris di bawah emoji, visual saja, tanpa
   *  terjemahan Indonesia (jangan kasih tahu artinya). reading: field ini
   *  SENGAJA TIDAK dirender (lihat drawMcqStep) meskipun datanya ada (pool
   *  opsi dipakai bareng skill lain) — kalau ditampilkan, kata di label
   *  bisa sama persis dengan kata di `story`/`question`, anak tinggal
   *  cocokkan teks tanpa benar-benar membaca (bug nyata yang pernah
   *  terjadi, dilaporkan user). */
  label?: string;
  correct: boolean;
}

export interface PlacementQuestion {
  id: string;
  level: PlacementLevelKey;
  kind: PlacementItemKind;
  /** vocab arah 'idToEn': soal (diucapkan TTS bahasa Inggris via speak()).
   *  vocab arah 'enToId': soal (diucapkan TTS bahasa Inggris juga, ini kata
   *  Inggrisnya). reading TIDAK pakai field ini lagi — pakai `story` +
   *  `question` (lihat di bawah), sama seperti listening tapi dibaca
   *  sendiri (silent), bukan diucapkan. */
  word?: string;
  /** vocab arah 'idToEn': soal bahasa Indonesia (diucapkan TTS Indonesia
   *  via speakLocalized(), anak cari arti Inggrisnya di opsi). vocab arah
   *  'enToId': jawaban benar bahasa Indonesia (tidak diucapkan — cuma
   *  dipakai buat susun opsi teks Indonesia). Permintaan user: soal vocab
   *  dua arah (ID→EN dan EN→ID), tetap pakai suara, tanpa gambar sama
   *  sekali biar tidak bisa ditebak dari ikonnya. */
  wordId?: string;
  /** vocab saja: arah soal. 'idToEn' = soal Indonesia, cari arti Inggris.
   *  'enToId' = soal Inggris, cari arti Indonesia. */
  direction?: 'idToEn' | 'enToId';
  /** reading: 1-2 kalimat pendek TERTULIS, dibaca sendiri (silent, TANPA
   *  TTS — playPrompt() no-op untuk kind ini). listening: cerita mini yang
   *  sama bentuknya tapi DIUCAPKAN via speakSequence(), anak tidak pernah
   *  melihat teksnya. */
  story?: string[];
  /** reading & listening: pertanyaan tentang `story`. reading TERTULIS di
   *  layar (silent read), listening diucapkan TTS bareng `story`. */
  question?: string;
  options: PlacementOption[];
}

export const PLACEMENT_QUESTIONS: PlacementQuestion[] = [
  // --- Vocab — dua arah (permintaan user), tetap pakai suara, tanpa
  // gambar. 'idToEn': soal diucapkan bahasa Indonesia (speakLocalized),
  // opsi teks Inggris. 'enToId': soal diucapkan bahasa Inggris (speak),
  // opsi teks Indonesia. 4 soal total: 2 idToEn + 2 enToId. ---
  { id: 's1', level: 'starter', kind: 'vocab', direction: 'idToEn', word: 'cat', wordId: 'kucing', options: [
    { emoji: '🐱', label: 'cat', correct: true },
    { emoji: '🐶', label: 'dog', correct: false },
    { emoji: '🐰', label: 'rabbit', correct: false },
    { emoji: '🐟', label: 'fish', correct: false },
    { emoji: '🐦', label: 'bird', correct: false },
    { emoji: '🐸', label: 'frog', correct: false },
  ] },
  { id: 's2', level: 'starter', kind: 'vocab', direction: 'enToId', word: 'red', wordId: 'merah', options: [
    { emoji: '🔴', label: 'merah', correct: true },
    { emoji: '🔵', label: 'biru', correct: false },
    { emoji: '🟢', label: 'hijau', correct: false },
    { emoji: '🟡', label: 'kuning', correct: false },
    { emoji: '⚪', label: 'putih', correct: false },
    { emoji: '⚫', label: 'hitam', correct: false },
  ] },

  { id: 'e1', level: 'explorer', kind: 'vocab', direction: 'idToEn', word: 'mother', wordId: 'ibu', options: [
    { emoji: '👩', label: 'mother', correct: true },
    { emoji: '👨', label: 'father', correct: false },
    { emoji: '👦', label: 'brother', correct: false },
    { emoji: '👧', label: 'sister', correct: false },
    { emoji: '👵', label: 'grandmother', correct: false },
    { emoji: '👴', label: 'grandfather', correct: false },
  ] },

  { id: 'a1', level: 'adventurer', kind: 'vocab', direction: 'enToId', word: 'teacher', wordId: 'guru', options: [
    { emoji: '🧑‍⚕️', label: 'dokter', correct: false },
    { emoji: '👮', label: 'polisi', correct: false },
    { emoji: '🧑‍🍳', label: 'koki', correct: false },
    { emoji: '🧑‍🏫', label: 'guru', correct: true },
    { emoji: '👨‍🌾', label: 'petani', correct: false },
    { emoji: '👩‍🚒', label: 'pemadam kebakaran', correct: false },
  ] },

  // --- Reading — baca SENDIRI 1-2 kalimat pendek (silent, TANPA TTS) lalu
  // jawab pertanyaan dengan tap GAMBAR. Format riset: Cambridge Pre A1
  // Starters Reading Task 2/5 "read short text about a picture, answer a
  // question" (doc/first_placement_test.md §Reading). Opsi SENGAJA tanpa
  // label teks (lihat drawMcqStep) — kalau label ditampilkan, kata di
  // opsi bisa identik dengan kata di soal, anak tinggal cocokkan teks
  // tanpa benar-benar membaca (bug nyata, dilaporkan user). Non-punitive
  // tetap terjaga: yang belum bisa baca cukup menebak & lanjut seperti
  // biasa, tidak ada layar "kamu belum bisa baca".
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
  // `READING_TOPICS_ADVENTURER` topik 'kebun-binatang' di content.ts (soal
  // "hewan favorit Zoe" — lion & elephant SENGAJA disebut juga di teks
  // sbg distraktor, bukan cuma jawaban panda). ---
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

  // --- Listening: sama prinsip anti-tebak spt Reading di atas (lihat
  // komentar di sana) — distraktor JUGA disebut di `story`, cuma lewat
  // TELINGA (diucapkan, bukan dibaca) sehingga anak wajib benar-benar
  // dengar & pahami KALIMAT MANA yang menjawab `question`, bukan cuma
  // menangkap 1 kata familiar yang kebetulan match gambar. ---
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
 * Speaking lapis 2 — mic terbuka, TIDAK pernah menentukan level (PRD §13.1),
 * TAPI ikut dihitung di angka skor total (13 pilihan-ganda + 3 item mic = 16,
 * lihat portal/lib/placement-scoring.ts): dua hal yang beda, jangan
 * dicampur lagi.
 * `wordRatio`/`matched`/`confidence` dihitung di client (ASR jalan di browser anak,
 * server tidak pernah dengar audionya — pengecualian yang disengaja dari
 * "jangan percaya client", aman karena tidak pernah menentukan level).
 * 3 item (permintaan user, sebelumnya cuma 1) — makin panjang tiap item,
 * yang terakhir 1 kalimat penuh.
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
