/**
 * Data Raja Kata (Word Quest) — dipisah dari `games/wordmatch.ts` supaya
 * bisa dicek otomatis oleh `scripts/verify-vocab-content.mjs` (denylist emoji
 * makhluk hidup, CLAUDE.md "Kepala SAJA") tanpa ikut mem-bundle kode DOM.
 *
 * 🔒 Pembeda tiap markas BUKAN cuma jumlah kata (permintaan user "jangan
 * sampai cuma katanya saja yang makin banyak", riset: tingkat pengetahuan
 * kata recognition→recall, pengecoh mirip bentuk, interferensi satu
 * kategori, pasangan audio ala Duolingo, Cambridge Flyers R&W Part 1
 * "cocokkan definisi"). Tiap markas menambah SATU jenis tantangan baru:
 *
 * | Markas     | Kiri ↔ Kanan        | Papan dibentuk dari                 | Bantuan                      |
 * |------------|---------------------|-------------------------------------|------------------------------|
 * | Pemanasan  | kata ↔ gambar       | acak, kata sangat berbeda           | tap kata = dibacakan 🔊      |
 * | Mudah      | kata ↔ gambar       | acak                                | —                            |
 * | Sedang     | kata ↔ gambar       | 2 grup kata MIRIP BENTUK (Cat/Car)  | 💡 tandai 1 pasangan         |
 * | Sulit      | kata ↔ gambar       | SATU kategori (5 hewan, dst)        | 💡 tandai 1 pasangan         |
 * | Jago       | 🔊 suara ↔ gambar   | acak                                | 💡 tampilkan tulisan katanya |
 * | Legendaris | petunjuk ↔ kata     | acak, TANPA gambar (Flyers Part 1)  | 💡 arti Indonesia petunjuk   |
 *
 * Bank kata dipilih dari tingkat wordlist Cambridge (Starters → Movers →
 * Flyers), bukan dari panjang/langkanya kata.
 */
import type { WordMatchDifficulty } from '../types';

export interface WordBankEntry {
  en: string;
  emoji: string;
  /** Legendaris saja — petunjuk Inggris (TIDAK boleh memuat kata `en`). */
  clue?: string;
  /** Legendaris saja — arti Indonesia petunjuk (dibuka 💡 Petunjuk). */
  clueId?: string;
}

export type BoardMode = 'picture' | 'audio' | 'clue';
export type BoardPicker = 'random' | 'lookalike' | 'category';

export interface TierConfig {
  label: string;
  pairCount: number;
  mode: BoardMode;
  picker: BoardPicker;
  /** Tap kartu kata langsung dibacakan TTS (Pemanasan saja). */
  speakOnTap: boolean;
  hint: boolean;
  /** 1 baris instruksi di atas papan — `{cat}` diganti nama kategori. */
  task: string;
}

export const TIER_CONFIG: Record<WordMatchDifficulty, TierConfig> = {
  pemanasan: { label: 'Pemanasan', pairCount: 3, mode: 'picture', picker: 'random', speakOnTap: true, hint: false, task: 'Tap kata untuk dengar, lalu pilih gambarnya.' },
  mudah: { label: 'Mudah', pairCount: 4, mode: 'picture', picker: 'random', speakOnTap: false, hint: false, task: 'Baca katanya, lalu pilih gambarnya.' },
  sedang: { label: 'Sedang', pairCount: 4, mode: 'picture', picker: 'lookalike', speakOnTap: false, hint: true, task: 'Awas, katanya mirip-mirip! Baca teliti, ya.' },
  sulit: { label: 'Sulit', pairCount: 5, mode: 'picture', picker: 'category', speakOnTap: false, hint: true, task: 'Semua dari kelompok {cat}. Cocokkan, ya!' },
  jago: { label: 'Jago', pairCount: 5, mode: 'audio', picker: 'random', speakOnTap: true, hint: true, task: 'Tap 🔊 untuk dengar, lalu pilih gambarnya.' },
  legendaris: { label: 'Legendaris', pairCount: 5, mode: 'clue', picker: 'random', speakOnTap: false, hint: true, task: 'Baca petunjuknya, lalu pilih kata yang pas.' },
};

/** Pemanasan — Starters, benda sehari-hari yang sangat beda satu sama lain. */
const BANK_PEMANASAN: WordBankEntry[] = [
  { en: 'Ball', emoji: '⚽' },
  { en: 'Book', emoji: '📚' },
  { en: 'Apple', emoji: '🍎' },
  { en: 'Bus', emoji: '🚌' },
  { en: 'Cake', emoji: '🎂' },
  { en: 'Bed', emoji: '🛏️' },
  { en: 'Kite', emoji: '🪁' },
  { en: 'Pen', emoji: '🖊️' },
  { en: 'Egg', emoji: '🥚' },
  { en: 'Sun', emoji: '☀️' },
  { en: 'Cat', emoji: '🐱' },
  { en: 'Dog', emoji: '🐶' },
];

/** Mudah — Starters. */
const BANK_MUDAH: WordBankEntry[] = [
  { en: 'Moon', emoji: '🌙' },
  { en: 'Star', emoji: '⭐' },
  { en: 'Tree', emoji: '🌳' },
  { en: 'Flower', emoji: '🌸' },
  { en: 'Banana', emoji: '🍌' },
  { en: 'Chair', emoji: '🪑' },
  { en: 'Door', emoji: '🚪' },
  { en: 'Shoe', emoji: '👟' },
  { en: 'Milk', emoji: '🥛' },
  { en: 'Car', emoji: '🚗' },
  { en: 'Cow', emoji: '🐮' },
  { en: 'Pig', emoji: '🐷' },
];

/** Sedang — grup kata yang ejaannya cuma beda 1–2 huruf (Starters/Movers).
 *  1 papan = 2 grup × 2 kata, jadi selalu ada pengecoh mirip bentuk. */
export const LOOKALIKE_GROUPS: WordBankEntry[][] = [
  [{ en: 'Cat', emoji: '🐱' }, { en: 'Car', emoji: '🚗' }, { en: 'Cap', emoji: '🧢' }],
  [{ en: 'Pen', emoji: '🖊️' }, { en: 'Pan', emoji: '🍳' }, { en: 'Pin', emoji: '📌' }],
  [{ en: 'Clock', emoji: '🕐' }, { en: 'Sock', emoji: '🧦' }, { en: 'Lock', emoji: '🔒' }],
  [{ en: 'Hat', emoji: '🎩' }, { en: 'Hut', emoji: '🛖' }],
  [{ en: 'Box', emoji: '📦' }, { en: 'Fox', emoji: '🦊' }],
  [{ en: 'Rain', emoji: '🌧️' }, { en: 'Train', emoji: '🚆' }],
  [{ en: 'Boat', emoji: '⛵' }, { en: 'Coat', emoji: '🧥' }],
  [{ en: 'Moon', emoji: '🌙' }, { en: 'Spoon', emoji: '🥄' }],
  [{ en: 'Bear', emoji: '🐻' }, { en: 'Pear', emoji: '🍐' }],
  [{ en: 'Mouse', emoji: '🐭' }, { en: 'House', emoji: '🏠' }],
  [{ en: 'Nose', emoji: '👃' }, { en: 'Rose', emoji: '🌹' }],
  [{ en: 'Kite', emoji: '🪁' }, { en: 'Bike', emoji: '🚲' }],
];

/** Sulit — 1 papan = 5 kata dari SATU kategori (Movers). */
export const CATEGORY_GROUPS: { name: string; items: WordBankEntry[] }[] = [
  {
    name: 'Hewan',
    items: [
      { en: 'Lion', emoji: '🦁' },
      { en: 'Tiger', emoji: '🐯' },
      { en: 'Monkey', emoji: '🐵' },
      { en: 'Panda', emoji: '🐼' },
      { en: 'Koala', emoji: '🐨' },
      { en: 'Frog', emoji: '🐸' },
      { en: 'Horse', emoji: '🐴' },
      { en: 'Wolf', emoji: '🐺' },
    ],
  },
  {
    name: 'Buah',
    items: [
      { en: 'Grapes', emoji: '🍇' },
      { en: 'Lemon', emoji: '🍋' },
      { en: 'Mango', emoji: '🥭' },
      { en: 'Cherry', emoji: '🍒' },
      { en: 'Orange', emoji: '🍊' },
      { en: 'Watermelon', emoji: '🍉' },
      { en: 'Strawberry', emoji: '🍓' },
      { en: 'Pineapple', emoji: '🍍' },
    ],
  },
  {
    name: 'Kendaraan',
    items: [
      { en: 'Plane', emoji: '✈️' },
      { en: 'Ship', emoji: '🚢' },
      { en: 'Taxi', emoji: '🚕' },
      { en: 'Tractor', emoji: '🚜' },
      { en: 'Helicopter', emoji: '🚁' },
      { en: 'Rocket', emoji: '🚀' },
      { en: 'Motorbike', emoji: '🏍️' },
      { en: 'Ambulance', emoji: '🚑' },
    ],
  },
  {
    name: 'Pakaian',
    items: [
      { en: 'Dress', emoji: '👗' },
      { en: 'Jacket', emoji: '🧥' },
      { en: 'Scarf', emoji: '🧣' },
      { en: 'Gloves', emoji: '🧤' },
      { en: 'Boots', emoji: '👢' },
      { en: 'T-shirt', emoji: '👕' },
      { en: 'Jeans', emoji: '👖' },
      { en: 'Shorts', emoji: '🩳' },
    ],
  },
  {
    name: 'Alat Musik',
    items: [
      { en: 'Guitar', emoji: '🎸' },
      { en: 'Drum', emoji: '🥁' },
      { en: 'Piano', emoji: '🎹' },
      { en: 'Violin', emoji: '🎻' },
      { en: 'Trumpet', emoji: '🎺' },
      { en: 'Saxophone', emoji: '🎷' },
      { en: 'Banjo', emoji: '🪕' },
      { en: 'Accordion', emoji: '🪗' },
    ],
  },
];

/** Jago — dengar suara (Movers), tanpa tulisan. */
const BANK_JAGO: WordBankEntry[] = [
  { en: 'Umbrella', emoji: '☂️' },
  { en: 'Rainbow', emoji: '🌈' },
  { en: 'Castle', emoji: '🏰' },
  { en: 'Camera', emoji: '📷' },
  { en: 'Pizza', emoji: '🍕' },
  { en: 'Robot', emoji: '🤖' },
  { en: 'Ladder', emoji: '🪜' },
  { en: 'Candle', emoji: '🕯️' },
  { en: 'Island', emoji: '🏝️' },
  { en: 'Mountain', emoji: '⛰️' },
  { en: 'Sandwich', emoji: '🥪' },
  { en: 'Scissors', emoji: '✂️' },
  { en: 'Tent', emoji: '⛺' },
  { en: 'Balloon', emoji: '🎈' },
];

/** Legendaris — petunjuk definisi ala Cambridge Flyers R&W Part 1, tanpa gambar. */
const BANK_LEGENDARIS: WordBankEntry[] = [
  { en: 'Satellite', emoji: '🛰️', clue: 'It goes around the Earth in space.', clueId: 'Benda ini mengelilingi Bumi di luar angkasa.' },
  { en: 'Volcano', emoji: '🌋', clue: 'A mountain with fire and hot rock inside.', clueId: 'Gunung yang di dalamnya ada api dan batu panas.' },
  { en: 'Telescope', emoji: '🔭', clue: 'You look through it to see the stars.', clueId: 'Kamu melihat lewat benda ini untuk melihat bintang.' },
  { en: 'Microscope', emoji: '🔬', clue: 'You use it to see very, very small things.', clueId: 'Kamu memakainya untuk melihat benda yang sangat kecil.' },
  { en: 'Thermometer', emoji: '🌡️', clue: 'It tells you how hot or cold it is.', clueId: 'Benda ini memberi tahu seberapa panas atau dingin.' },
  { en: 'Compass', emoji: '🧭', clue: 'It shows you north, south, east and west.', clueId: 'Benda ini menunjukkan utara, selatan, timur, dan barat.' },
  { en: 'Dictionary', emoji: '📖', clue: 'A book that tells you what words mean.', clueId: 'Buku yang memberi tahu arti kata-kata.' },
  { en: 'Passport', emoji: '🛂', clue: 'You need it to travel to another country.', clueId: 'Kamu memerlukannya untuk pergi ke negara lain.' },
  { en: 'Library', emoji: '🏛️', clue: 'A place where you can borrow books.', clueId: 'Tempat kamu bisa meminjam buku.' },
  { en: 'Dentist', emoji: '🦷', clue: 'This person looks after your teeth.', clueId: 'Orang ini merawat gigimu.' },
  { en: 'Map', emoji: '🗺️', clue: 'It shows you where places are.', clueId: 'Benda ini menunjukkan letak tempat-tempat.' },
  { en: 'Calendar', emoji: '📅', clue: 'It shows the days and months of the year.', clueId: 'Benda ini menunjukkan hari dan bulan dalam setahun.' },
  { en: 'Museum', emoji: '🏺', clue: 'A place where you can see very old things.', clueId: 'Tempat kamu bisa melihat benda-benda yang sangat tua.' },
];

/** Bank untuk picker 'random' (Sedang/Sulit memakai grup di atas). */
export const RANDOM_BANK: Record<WordMatchDifficulty, WordBankEntry[]> = {
  pemanasan: BANK_PEMANASAN,
  mudah: BANK_MUDAH,
  sedang: LOOKALIKE_GROUPS.flat(),
  sulit: CATEGORY_GROUPS.flatMap((g) => g.items),
  jago: BANK_JAGO,
  legendaris: BANK_LEGENDARIS,
};
