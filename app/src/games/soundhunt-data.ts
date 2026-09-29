/**
 * Data Sound Hunt (Raja Pemburu Suara) — dipisah dari `games/soundhunt.ts`
 * supaya dicek otomatis `scripts/verify-vocab-content.mjs` tanpa ikut
 * mem-bundle kode DOM. Pola sama `wordmatch-data.ts`/`memorymatch-data.ts`.
 * Analisis & riset: `materi/pembeda_level_game.md` § Sound Hunt.
 *
 * 🔒 Game ini MURNI Listening: instruksi Inggris cuma DIDENGAR (TTS), kartu
 * jawaban = GAMBAR SAJA tanpa tulisan (dulu kartu berlabel "Blue Star" →
 * anak cukup membaca, bukan mendengar). Bentuk game tetap (dengar → tap
 * gambar), yang naik tiap markas = BAHASA INSTRUKSInya, SATU hal baru per
 * markas (ala Cambridge Starters/Movers Listening: tunjuk, warnai, hitung,
 * ikuti perintah, simpulkan dari deskripsi):
 *
 * | Markas     | Instruksi                                   | Pengecoh                          | 💡 Petunjuk          |
 * |------------|---------------------------------------------|-----------------------------------|----------------------|
 * | Pemanasan  | "Find the dog." (1 kata benda)              | beda kelompok (sangat beda)       | langsung             |
 * | Mudah      | "Find the pear." (1 kata benda)             | SATU kelompok (4 buah)            | langsung             |
 * | Sedang     | "Find the blue book." (warna + benda)       | benda sama beda warna, warna sama | langsung             |
 * |            |                                             | beda benda → wajib dengar 2 kata  |                      |
 * | Sulit      | "Find four stars." (angka + benda)          | angka ±1, benda lain angka sama   | langsung             |
 * | Jago       | "Tap the cow, then tap the bus." (2 langkah)| 4 benda acak                      | 🔒 sampai 1x coba    |
 * | Legendaris | tebak dari deskripsi ("It says moo...")     | 3 benda dekat maknanya            | 🔒 sampai 1x coba    |
 *
 * Semua markas: 4 kartu gambar (2×2), `ROUND_COUNT` soal per markas.
 */
import type { WordMatchDifficulty } from '../types';

export type SoundMode = 'find' | 'color' | 'count' | 'sequence' | 'riddle';

export interface TierConfig {
  label: string;
  mode: SoundMode;
  /** Petunjuk terkunci 🔒 sampai anak 1x mencoba soal itu. */
  hintGated: boolean;
  /** Label badge soal (1 baris di atas tombol Dengar). */
  badge: string;
}

/** Soal per markas — 10, sama Balloon Hunt (1 soal = 1 kali dengar + tap,
 *  secepat 1 balon). */
export const ROUND_COUNT = 10;

export const TIER_CONFIG: Record<WordMatchDifficulty, TierConfig> = {
  pemanasan: { label: 'Pemanasan', mode: 'find', hintGated: false, badge: '👂 Dengar & Tunjuk' },
  mudah: { label: 'Mudah', mode: 'find', hintGated: false, badge: '👂 Dengar & Tunjuk' },
  sedang: { label: 'Sedang', mode: 'color', hintGated: false, badge: '🎨 Dengar Warnanya' },
  sulit: { label: 'Sulit', mode: 'count', hintGated: false, badge: '🔢 Dengar Jumlahnya' },
  jago: { label: 'Jago', mode: 'sequence', hintGated: true, badge: '👆 Ikuti 2 Perintah' },
  legendaris: { label: 'Legendaris', mode: 'riddle', hintGated: true, badge: '🕵️ Tebak dari Ciri-cirinya' },
};

export interface Thing {
  en: string;
  id: string;
  emoji: string;
}

/** Pemanasan — benda sehari-hari yang SANGAT beda satu sama lain (4 kartu
 *  diambil dari kelompok berbeda). */
export const WARMUP_BANK: Thing[] = [
  { en: 'dog', id: 'anjing', emoji: '🐶' },
  { en: 'cat', id: 'kucing', emoji: '🐱' },
  { en: 'ball', id: 'bola', emoji: '⚽' },
  { en: 'car', id: 'mobil', emoji: '🚗' },
  { en: 'apple', id: 'apel', emoji: '🍎' },
  { en: 'book', id: 'buku', emoji: '📖' },
  { en: 'hat', id: 'topi', emoji: '🎩' },
  { en: 'cake', id: 'kue', emoji: '🎂' },
  { en: 'sun', id: 'matahari', emoji: '☀️' },
  { en: 'tree', id: 'pohon', emoji: '🌳' },
  { en: 'bed', id: 'tempat tidur', emoji: '🛏️' },
  { en: 'cup', id: 'cangkir', emoji: '☕' },
];

/** Mudah — 1 papan = 4 kata dari SATU kelompok (interferensi semantik:
 *  kata sekelompok lebih sulit dibedakan, Tinkham 1997). */
export const GROUP_BANK: { name: string; items: Thing[] }[] = [
  {
    name: 'Hewan',
    items: [
      { en: 'cow', id: 'sapi', emoji: '🐮' },
      { en: 'pig', id: 'babi', emoji: '🐷' },
      { en: 'horse', id: 'kuda', emoji: '🐴' },
      { en: 'rabbit', id: 'kelinci', emoji: '🐰' },
      { en: 'mouse', id: 'tikus', emoji: '🐭' },
      { en: 'frog', id: 'katak', emoji: '🐸' },
      { en: 'lion', id: 'singa', emoji: '🦁' },
      { en: 'monkey', id: 'monyet', emoji: '🐵' },
    ],
  },
  {
    name: 'Buah',
    items: [
      { en: 'banana', id: 'pisang', emoji: '🍌' },
      { en: 'pear', id: 'pir', emoji: '🍐' },
      { en: 'lemon', id: 'lemon', emoji: '🍋' },
      { en: 'watermelon', id: 'semangka', emoji: '🍉' },
      { en: 'strawberry', id: 'stroberi', emoji: '🍓' },
      { en: 'cherry', id: 'ceri', emoji: '🍒' },
      { en: 'orange', id: 'jeruk', emoji: '🍊' },
      { en: 'pineapple', id: 'nanas', emoji: '🍍' },
    ],
  },
  {
    name: 'Kendaraan',
    items: [
      { en: 'bus', id: 'bus', emoji: '🚌' },
      { en: 'bike', id: 'sepeda', emoji: '🚲' },
      { en: 'train', id: 'kereta', emoji: '🚂' },
      { en: 'boat', id: 'perahu', emoji: '⛵' },
      { en: 'plane', id: 'pesawat', emoji: '✈️' },
      { en: 'truck', id: 'truk', emoji: '🚚' },
      { en: 'helicopter', id: 'helikopter', emoji: '🚁' },
    ],
  },
  {
    name: 'Makanan',
    items: [
      { en: 'bread', id: 'roti', emoji: '🍞' },
      { en: 'cheese', id: 'keju', emoji: '🧀' },
      { en: 'pizza', id: 'pizza', emoji: '🍕' },
      { en: 'rice', id: 'nasi', emoji: '🍚' },
      { en: 'soup', id: 'sup', emoji: '🍲' },
      { en: 'carrot', id: 'wortel', emoji: '🥕' },
      { en: 'corn', id: 'jagung', emoji: '🌽' },
    ],
  },
];

/** Sedang — benda yang punya beberapa emoji warna. Tiap soal: target
 *  (warna A, benda X) + (warna lain, benda X) + (warna A, benda Y) + (warna
 *  lain, benda Y) → anak WAJIB mendengar warna DAN bendanya. Tiap warna
 *  WAJIB dimiliki ≥2 benda (dicek build) — kalau tidak, pengecoh "warna
 *  sama, benda lain" tidak bisa dibuat (📙 oranye dibuang krn itu). */
export const COLOR_ID: Record<string, string> = {
  red: 'merah',
  blue: 'biru',
  green: 'hijau',
  yellow: 'kuning',
  purple: 'ungu',
};

export const COLOR_BANK: { en: string; id: string; colors: Record<string, string> }[] = [
  { en: 'book', id: 'buku', colors: { red: '📕', green: '📗', blue: '📘' } },
  { en: 'heart', id: 'hati', colors: { red: '❤️', blue: '💙', green: '💚', yellow: '💛', purple: '💜' } },
  { en: 'circle', id: 'lingkaran', colors: { red: '🔴', blue: '🔵', green: '🟢', yellow: '🟡', purple: '🟣' } },
  { en: 'square', id: 'kotak', colors: { red: '🟥', blue: '🟦', green: '🟩', yellow: '🟨' } },
  { en: 'apple', id: 'apel', colors: { red: '🍎', green: '🍏' } },
];

/** Sulit — benda yang dihitung (ikon diulang sesuai angka, CLAUDE.md
 *  "Jumlah Ikon = Jumlah di Kalimat"). Angka 2–5 (muat 1 kartu). */
export const NUMBER_WORDS: { n: number; en: string; id: string }[] = [
  { n: 2, en: 'two', id: 'dua' },
  { n: 3, en: 'three', id: 'tiga' },
  { n: 4, en: 'four', id: 'empat' },
  { n: 5, en: 'five', id: 'lima' },
];

export const COUNT_BANK: { en: string; plural: string; id: string; emoji: string }[] = [
  { en: 'apple', plural: 'apples', id: 'apel', emoji: '🍎' },
  { en: 'ball', plural: 'balls', id: 'bola', emoji: '⚽' },
  { en: 'car', plural: 'cars', id: 'mobil', emoji: '🚗' },
  { en: 'star', plural: 'stars', id: 'bintang', emoji: '⭐' },
  { en: 'book', plural: 'books', id: 'buku', emoji: '📖' },
  { en: 'cup', plural: 'cups', id: 'cangkir', emoji: '☕' },
  { en: 'hat', plural: 'hats', id: 'topi', emoji: '🎩' },
  { en: 'flower', plural: 'flowers', id: 'bunga', emoji: '🌸' },
];

/** Legendaris — tebak dari deskripsi. Deskripsi TIDAK boleh menyebut nama
 *  bendanya; pengecoh cocok SEBAGIAN ciri (Lemon kuning tapi tidak
 *  panjang) supaya anak harus paham seluruh deskripsi. `options[0]` = benar
 *  (diacak saat ditampilkan). */
export interface Riddle {
  text: string;
  textId: string;
  options: Thing[];
}

export const RIDDLE_BANK: Riddle[] = [
  {
    text: 'It is yellow and long. Monkeys love to eat it.',
    textId: 'Warnanya kuning dan panjang. Monyet suka memakannya.',
    options: [
      { en: 'banana', id: 'pisang', emoji: '🍌' },
      { en: 'lemon', id: 'lemon', emoji: '🍋' },
      { en: 'carrot', id: 'wortel', emoji: '🥕' },
      { en: 'apple', id: 'apel', emoji: '🍎' },
    ],
  },
  {
    text: 'It has four wheels. People drive it on the road.',
    textId: 'Rodanya empat. Orang mengendarainya di jalan.',
    options: [
      { en: 'car', id: 'mobil', emoji: '🚗' },
      { en: 'bike', id: 'sepeda', emoji: '🚲' },
      { en: 'boat', id: 'perahu', emoji: '⛵' },
      { en: 'plane', id: 'pesawat', emoji: '✈️' },
    ],
  },
  {
    text: 'It is in the sky in the day. It is hot and yellow.',
    textId: 'Ada di langit pada siang hari. Panas dan kuning.',
    options: [
      { en: 'sun', id: 'matahari', emoji: '☀️' },
      { en: 'moon', id: 'bulan', emoji: '🌙' },
      { en: 'star', id: 'bintang', emoji: '⭐' },
      { en: 'cloud', id: 'awan', emoji: '☁️' },
    ],
  },
  {
    text: 'You wear it on your foot when you go to school.',
    textId: 'Kamu memakainya di kaki saat pergi ke sekolah.',
    options: [
      { en: 'shoe', id: 'sepatu', emoji: '👟' },
      { en: 'hat', id: 'topi', emoji: '🎩' },
      { en: 'shirt', id: 'kaus', emoji: '👕' },
      { en: 'jacket', id: 'jaket', emoji: '🧥' },
    ],
  },
  {
    text: 'You read it. It has a lot of pages.',
    textId: 'Kamu membacanya. Halamannya banyak.',
    options: [
      { en: 'book', id: 'buku', emoji: '📖' },
      { en: 'pencil', id: 'pensil', emoji: '✏️' },
      { en: 'bag', id: 'tas', emoji: '🎒' },
      { en: 'television', id: 'televisi', emoji: '📺' },
    ],
  },
  {
    text: 'It says moo. It gives us milk.',
    textId: 'Bunyinya "moo". Ia memberi kita susu.',
    options: [
      { en: 'cow', id: 'sapi', emoji: '🐮' },
      { en: 'pig', id: 'babi', emoji: '🐷' },
      { en: 'horse', id: 'kuda', emoji: '🐴' },
      { en: 'dog', id: 'anjing', emoji: '🐶' },
    ],
  },
  {
    text: 'It is cold and white. It falls from the sky.',
    textId: 'Dingin dan putih. Jatuh dari langit.',
    options: [
      { en: 'snow', id: 'salju', emoji: '❄️' },
      { en: 'cloud', id: 'awan', emoji: '☁️' },
      { en: 'rainbow', id: 'pelangi', emoji: '🌈' },
      { en: 'sun', id: 'matahari', emoji: '☀️' },
    ],
  },
  {
    text: 'You sleep on it at night.',
    textId: 'Kamu tidur di atasnya pada malam hari.',
    options: [
      { en: 'bed', id: 'tempat tidur', emoji: '🛏️' },
      { en: 'chair', id: 'kursi', emoji: '🪑' },
      { en: 'door', id: 'pintu', emoji: '🚪' },
      { en: 'window', id: 'jendela', emoji: '🪟' },
    ],
  },
  {
    text: 'It is orange and long. Rabbits like to eat it.',
    textId: 'Warnanya oranye dan panjang. Kelinci suka memakannya.',
    options: [
      { en: 'carrot', id: 'wortel', emoji: '🥕' },
      { en: 'orange', id: 'jeruk', emoji: '🍊' },
      { en: 'corn', id: 'jagung', emoji: '🌽' },
      { en: 'bread', id: 'roti', emoji: '🍞' },
    ],
  },
  {
    text: 'It flies in the sky. It takes people to other countries.',
    textId: 'Terbang di langit. Membawa orang ke negara lain.',
    options: [
      { en: 'plane', id: 'pesawat', emoji: '✈️' },
      { en: 'bus', id: 'bus', emoji: '🚌' },
      { en: 'train', id: 'kereta', emoji: '🚂' },
      { en: 'boat', id: 'perahu', emoji: '⛵' },
    ],
  },
  {
    text: 'You open it when it rains. It keeps you dry.',
    textId: 'Kamu membukanya saat hujan. Membuatmu tetap kering.',
    options: [
      { en: 'umbrella', id: 'payung', emoji: '☂️' },
      { en: 'sunglasses', id: 'kacamata hitam', emoji: '🕶️' },
      { en: 'hat', id: 'topi', emoji: '🎩' },
      { en: 'scarf', id: 'syal', emoji: '🧣' },
    ],
  },
  {
    text: 'It hangs on the wall. It tells you the time.',
    textId: 'Tergantung di dinding. Memberi tahu jam berapa.',
    options: [
      { en: 'clock', id: 'jam dinding', emoji: '🕰️' },
      { en: 'lamp', id: 'lampu', emoji: '💡' },
      { en: 'camera', id: 'kamera', emoji: '📷' },
      { en: 'key', id: 'kunci', emoji: '🔑' },
    ],
  },
];
