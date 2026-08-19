import type {
  GrammarTopic,
  LevelMeta,
  ListeningTopic,
  SkillKey,
  SkillMeta,
  SpeakingTopic,
  VocabTopic,
} from './types';

/**
 * 6 level di tangga PRD §3, dalam urutan Peta Level. Cuma Explorer yang punya
 * materi nyata di v1 (`hasContent:true`) — 5 lainnya tampil sebagai placeholder
 * jujur ("belum ada materi"), bukan link mati atau konten palsu (lihat §9 scope
 * guardrail). Little Stars sengaja tanpa badge CEFR (PRD §7).
 */
export const LEVELS: LevelMeta[] = [
  { key: 'little-stars', name: 'Little Stars', emoji: '🌟', cefr: '', age: 'Usia 3–5 tahun', hasContent: false },
  { key: 'starter', name: 'Starter', emoji: '🌱', cefr: '≈ Pre-A1', age: 'Usia 5–7 tahun', hasContent: false },
  { key: 'explorer', name: 'Explorer', emoji: '🧭', cefr: '≈ Pre-A1 → A1', age: 'Usia 7–9 tahun', hasContent: true },
  { key: 'adventurer', name: 'Adventurer', emoji: '🚀', cefr: '≈ A1', age: 'Usia 9–11 tahun', hasContent: false },
  { key: 'achiever', name: 'Achiever', emoji: '🏆', cefr: '≈ A1 → A2', age: 'Usia 11–13 tahun', hasContent: false },
  {
    key: 'trailblazer',
    name: 'Trailblazer',
    emoji: '✨',
    cefr: '≈ B1',
    age: 'Usia 12+ tahun · jalur lanjutan',
    hasContent: false,
  },
];

/** Level aktif v1 — dipakai di header/rail (PRD §7: nama+emoji utama, CEFR sekunder). */
export const LEVEL: LevelMeta = LEVELS.find((l) => l.key === 'explorer')!;

/**
 * Warna per-skill = warna sekunder (cuma muncul di dalam konteks skill-nya),
 * bukan warna merek. Vocabulary sengaja dipindah dari indigo ke grape supaya
 * tidak berdekatan dengan warna utama app pembanding.
 */
export const SKILL_META: Record<SkillKey, SkillMeta> = {
  vocabulary: {
    label: 'Vocabulary',
    emoji: '📚',
    tagline: 'Kenal kata baru',
    activities: ['Tebak & Cocokkan', 'Eja Kata', 'Contoh Penggunaan'],
    accent: 'var(--c-vocab)',
    accentBg: 'var(--c-vocab-bg)',
  },
  listening: {
    label: 'Listening',
    emoji: '🎧',
    tagline: 'Dengar & pahami',
    activities: ['Dengar & Pilih', 'Cerita Mini'],
    accent: 'var(--c-listen)',
    accentBg: 'var(--c-listen-bg)',
  },
  speaking: {
    label: 'Speaking',
    emoji: '🗣️',
    tagline: 'Berani ngomong',
    activities: ['Ucapkan & Cek', 'Mini-Roleplay'],
    accent: 'var(--c-speak)',
    accentBg: 'var(--c-speak-bg)',
  },
  grammar: {
    label: 'Grammar',
    emoji: '✏️',
    tagline: 'Susun pola kalimat',
    activities: ['Susun Kalimat', 'Bikin Sendiri'],
    accent: 'var(--c-gram)',
    accentBg: 'var(--c-gram-bg)',
  },
};

export const VOCAB_TOPICS: VocabTopic[] = [
  {
    id: 'keluarga',
    title: 'Anggota Keluarga',
    desc: '4 kata',
    items: [
      { en: 'Mother', id: 'Ibu', emoji: '👩', example: { en: 'This is my mother.', id: 'Ini ibuku.', emoji: '👩' } },
      { en: 'Father', id: 'Ayah', emoji: '👨', example: { en: 'This is my father.', id: 'Ini ayahku.', emoji: '👨' } },
      { en: 'Sister', id: 'Kakak Perempuan', emoji: '👧', example: { en: 'I love my sister.', id: 'Aku sayang kakak perempuanku.', emoji: '👧' } },
      { en: 'Brother', id: 'Kakak Laki-laki', emoji: '👦', example: { en: 'I play with my brother.', id: 'Aku main dengan kakak laki-lakiku.', emoji: '👦' } },
    ],
  },
  {
    id: 'angka',
    title: 'Angka 1–4',
    desc: '4 kata',
    items: [
      { en: 'One', id: 'Satu', emoji: '1️⃣', example: { en: 'I have one apple.', id: 'Aku punya satu apel.', emoji: '🍎' } },
      { en: 'Two', id: 'Dua', emoji: '2️⃣', example: { en: 'Budi has two apples.', id: 'Budi punya dua apel.', emoji: '🍎🍎' } },
      { en: 'Three', id: 'Tiga', emoji: '3️⃣', example: { en: 'I see three cats.', id: 'Aku lihat tiga kucing.', emoji: '🐱🐱🐱' } },
      { en: 'Four', id: 'Empat', emoji: '4️⃣', example: { en: 'She has four balls.', id: 'Dia punya empat bola.', emoji: '⚽⚽⚽⚽' } },
    ],
  },
  {
    id: 'warna',
    title: 'Warna',
    desc: '4 kata',
    items: [
      { en: 'Red', id: 'Merah', emoji: '🔴', example: { en: 'The apple is red.', id: 'Apel itu merah.', emoji: '🍎' } },
      { en: 'Blue', id: 'Biru', emoji: '🔵', example: { en: 'The sky is blue.', id: 'Langitnya biru.', emoji: '🌤️' } },
      { en: 'Green', id: 'Hijau', emoji: '🟢', example: { en: 'The grass is green.', id: 'Rumputnya hijau.', emoji: '🌿' } },
      { en: 'Sun', id: 'Matahari', emoji: '☀️', example: { en: 'I can see the sun.', id: 'Aku bisa lihat mataharinya.', emoji: '☀️' } },
    ],
  },
];

export const LISTENING_TOPICS: ListeningTopic[] = [
  {
    id: 'toko',
    title: 'Di Toko',
    scene: '🏪',
    desc: 'Cerita belanja',
    primer: [
      { en: 'How much is this?', id: 'Berapa harganya?' },
      { en: 'I want to buy an apple.', id: 'Saya mau beli apel.' },
    ],
    drill: [
      { en: 'I want a red apple.', opts: [{ emoji: '🍎', ok: true }, { emoji: '🍌' }, { emoji: '🍇' }] },
      { en: 'Can I have a banana?', opts: [{ emoji: '🍌', ok: true }, { emoji: '🍉' }, { emoji: '🍎' }] },
    ],
    story: ['Andi goes to the shop.', 'He buys a red apple.', 'The apple is one dollar.'],
    question: {
      en: 'What did Andi buy?',
      opts: [{ emoji: '🍎', lbl: 'Apple', ok: true }, { emoji: '🍌', lbl: 'Banana' }, { emoji: '🍇', lbl: 'Grape' }],
    },
  },
  {
    id: 'perkenalan',
    title: 'Perkenalan',
    scene: '👋',
    desc: 'Cerita kenalan',
    primer: [{ en: 'What is your name?', id: 'Siapa namamu?' }],
    drill: [{ en: 'She is my sister.', opts: [{ emoji: '👧', ok: true }, { emoji: '👴' }] }],
    story: ['This is Ara.', 'Ara is seven years old.', 'Ara likes blue.'],
    question: { en: 'What color does Ara like?', opts: [{ emoji: '🔵', lbl: 'Blue', ok: true }, { emoji: '🔴', lbl: 'Red' }] },
  },
  {
    id: 'sekolah',
    title: 'Di Sekolah',
    scene: '🏫',
    desc: 'Cerita sekolah',
    primer: [{ en: 'This is my classroom.', id: 'Ini kelasku.' }],
    drill: [{ en: 'I have a pencil.', opts: [{ emoji: '✏️', ok: true }, { emoji: '📕' }] }],
    story: ['Budi is at school.', 'He has a blue bag.', 'He likes his teacher.'],
    question: { en: "What color is Budi's bag?", opts: [{ emoji: '🔵', lbl: 'Blue', ok: true }, { emoji: '🟢', lbl: 'Green' }] },
  },
];

export const SPEAKING_TOPICS: SpeakingTopic[] = [
  {
    id: 'kenalan-teman',
    title: 'Kenalan dengan Teman',
    desc: '2 latihan bicara',
    model: ['Hello, my name is Ara.', 'Nice to meet you.'],
    drill: ['My name is Ara.', 'I am seven years old.'],
    roleplay: ["What's your name?", 'How old are you?', 'What is your favorite color?'],
  },
  {
    id: 'beli-toko',
    title: 'Beli di Toko',
    desc: '2 latihan bicara',
    model: ['How much is this?'],
    drill: ['I want an apple, please.'],
    roleplay: ['What do you want to buy?', 'How many do you want?'],
  },
  {
    id: 'tanya-kabar',
    title: 'Tanya Kabar',
    desc: '2 latihan bicara',
    model: ['How are you?'],
    drill: ['I am fine, thank you.'],
    roleplay: ['How are you today?', 'Are you happy?'],
  },
];

export const GRAMMAR_TOPICS: GrammarTopic[] = [
  {
    id: 'this-is',
    title: 'Pola "This is..."',
    desc: 'To be — perkenalan',
    examples: [{ en: 'This is a cat.', emoji: '🐱' }, { en: 'This is a dog.', emoji: '🐶' }],
    scramble: [
      { emoji: '🐱', target: ['This', 'is', 'a', 'cat'] },
      { emoji: '⚽', target: ['This', 'is', 'a', 'ball'] },
    ],
    fill: {
      before: ['This', 'is', 'my'],
      after: [],
      options: [{ word: 'book', emoji: '📕' }, { word: 'ball', emoji: '⚽' }, { word: 'cat', emoji: '🐱' }],
    },
  },
  {
    id: 'there-is',
    title: 'There is / There are',
    desc: 'Menyebut benda',
    examples: [{ en: 'There is a ball.', emoji: '⚽' }, { en: 'There are two cats.', emoji: '🐱🐱' }],
    scramble: [{ emoji: '⚽', target: ['There', 'is', 'a', 'ball'] }],
    fill: {
      before: ['There', 'is', 'a'],
      after: [],
      options: [{ word: 'cat', emoji: '🐱' }, { word: 'dog', emoji: '🐶' }, { word: 'book', emoji: '📕' }],
    },
  },
  {
    id: 'pronouns',
    title: 'Kata Ganti Orang',
    desc: 'I / You / He / She',
    examples: [{ en: 'I am happy.', emoji: '😊' }, { en: 'She is my sister.', emoji: '👧' }],
    scramble: [{ emoji: '😊', target: ['I', 'am', 'happy'] }],
    fill: {
      before: ['I', 'like'],
      after: [],
      options: [{ word: 'apples', emoji: '🍎' }, { word: 'blue', emoji: '🔵' }, { word: 'football', emoji: '⚽' }],
    },
  },
];
