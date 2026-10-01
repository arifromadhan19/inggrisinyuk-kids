/**
 * Data Raja Ingatan (Memory Hunt) — dipisah dari `games/memorymatch.ts`
 * supaya bisa dicek otomatis oleh `scripts/verify-vocab-content.mjs` tanpa
 * ikut mem-bundle kode DOM. Pola sama `wordmatch-data.ts`. Analisis &
 * riset: `materi/pembeda_level_game.md` § Memory Hunt.
 *
 * 🔒 Kartu tertutup & aturan main SAMA di semua markas (identitas game ini =
 * mengingat letak kartu). Yang naik tiap markas = ATURAN PASANGAN — SATU
 * jenis pasangan baru per markas (pola Word Quest), dipilih supaya tidak
 * kembar dgn tangga Word Quest (mirip bentuk / 1 kategori / suara↔gambar /
 * definisi↔kata):
 *
 * | Markas     | Kartu A ↔ Kartu B                    | Pasang | 💡 Bantuan (1x/papan)     |
 * |------------|--------------------------------------|--------|---------------------------|
 * | Pemanasan  | gambar ↔ kata Inggris (dibacakan 🔊) | 2      | Intip semua kartu         |
 * | Mudah      | gambar ↔ kata Inggris                | 3      | Intip semua kartu         |
 * | Sedang     | kata Indonesia ↔ kata Inggris        | 3      | Intip semua kartu         |
 * | Sulit      | 🔊 bunyi ↔ tulisan kata Inggris      | 4      | Intip kartu tulisan       |
 * | Jago       | kata ↔ lawan katanya                 | 4      | Arti Indonesia di kartu   |
 * | Legendaris | kalimat rumpang ↔ kata               | 4      | Arti Indonesia kalimat    |
 *
 * Jumlah pasang SENGAJA kecil (maks 4 = 8 kartu): tantangan datang dari
 * aturan pasangan, bukan dari banyaknya kartu (ingatan letak berkembang
 * sendiri sesuai usia, bukan kemampuan yang diajarkan app ini). Kartu
 * tulisan lebih sulit diingat dari gambar → Sedang tidak menambah pasang.
 */
import type { WordMatchDifficulty } from '../types';

export type BoardMode = 'picture' | 'translate' | 'sound' | 'opposite' | 'gap';
export type HintKind = 'peek' | 'peek-written' | 'meaning';

export interface TierConfig {
  label: string;
  pairCount: number;
  mode: BoardMode;
  /** Kartu kata Inggris dibacakan TTS saat dibuka (Pemanasan saja). */
  speakOnOpen: boolean;
  hint: HintKind;
  /** 1 baris instruksi di atas papan. */
  task: string;
}

/** Papan per markas — 5 (bukan 10 spt Word Quest) krn 1 papan memori jauh
 *  lebih lama (kartu tertutup, perlu banyak giliran). */
export const BOARD_COUNT = 5;

export const TIER_CONFIG: Record<WordMatchDifficulty, TierConfig> = {
  pemanasan: { label: 'Pemanasan', pairCount: 2, mode: 'picture', speakOnOpen: true, hint: 'peek', task: 'Kartu kata dibacakan. Cari gambarnya!' },
  mudah: { label: 'Mudah', pairCount: 3, mode: 'picture', speakOnOpen: false, hint: 'peek', task: 'Cari pasangan gambar & kata Inggrisnya.' },
  sedang: { label: 'Sedang', pairCount: 3, mode: 'translate', speakOnOpen: false, hint: 'peek', task: 'Tanpa gambar! Cocokkan kata Indonesia & Inggrisnya.' },
  sulit: { label: 'Sulit', pairCount: 4, mode: 'sound', speakOnOpen: false, hint: 'peek-written', task: 'Kartu 🔊 berbunyi. Cari tulisan kata yang kamu dengar!' },
  jago: { label: 'Jago', pairCount: 4, mode: 'opposite', speakOnOpen: false, hint: 'meaning', task: 'Cari pasangan kata yang artinya berlawanan.' },
  legendaris: { label: 'Legendaris', pairCount: 4, mode: 'gap', speakOnOpen: false, hint: 'meaning', task: 'Cari kata yang pas untuk mengisi kalimatnya.' },
};

/** Pemanasan/Mudah (gambar ↔ kata) & Sedang (kata ID ↔ kata EN, emoji
 *  TIDAK ditampilkan) & Sulit (bunyi ↔ tulisan, emoji tidak dipakai). */
export interface MemoryWord {
  id: string;
  en: string;
  emoji: string;
}

/** Jago — pasangan lawan kata. Tiap kata cuma boleh muncul di 1 pasangan &
 *  jangan taruh 2 pasangan yang bisa "silang" (Tall/Short + Big/Small →
 *  Small↔Tall terasa berlawanan; Hard/Soft + Loud/Quiet → Loud↔Soft juga
 *  lawan kata yang sah) — SENGAJA dibuang dari bank. */
export interface OppositePair {
  a: string;
  aId: string;
  b: string;
  bId: string;
}

/** Legendaris — kalimat rumpang (`___` tepat 1x) ↔ kata. Kalimat hanya
 *  boleh cocok ke 1 kata di bank, tidak boleh memuat katanya, & kata
 *  sandang tidak boleh membocorkan jawaban ("an ___" cuma cocok ke kata
 *  berawalan vokal) — pakai "my/the". `sentenceId` ikut berlubang supaya
 *  💡 Arti tidak membocorkan jawaban. */
export interface GapSentence {
  sentence: string;
  sentenceId: string;
  answer: string;
}

export const PICTURE_BANK: Record<'pemanasan' | 'mudah', MemoryWord[]> = {
  pemanasan: [
    { id: 'Topi', en: 'Hat', emoji: '🎩' },
    { id: 'Cangkir', en: 'Cup', emoji: '☕' },
    { id: 'Kotak', en: 'Box', emoji: '📦' },
    { id: 'Sapi', en: 'Cow', emoji: '🐮' },
    { id: 'Tempat Tidur', en: 'Bed', emoji: '🛏️' },
    { id: 'Telur', en: 'Egg', emoji: '🥚' },
    { id: 'Matahari', en: 'Sun', emoji: '☀️' },
    { id: 'Kue', en: 'Cake', emoji: '🎂' },
    { id: 'Buku', en: 'Book', emoji: '📖' },
    { id: 'Susu', en: 'Milk', emoji: '🥛' },
    { id: 'Pohon', en: 'Tree', emoji: '🌳' },
    { id: 'Mobil', en: 'Car', emoji: '🚗' },
  ],
  mudah: [
    { id: 'Kucing', en: 'Cat', emoji: '🐱' },
    { id: 'Anjing', en: 'Dog', emoji: '🐶' },
    { id: 'Bola', en: 'Ball', emoji: '⚽' },
    { id: 'Tas', en: 'Bag', emoji: '🎒' },
    { id: 'Kursi', en: 'Chair', emoji: '🪑' },
    { id: 'Sepatu', en: 'Shoe', emoji: '👟' },
    { id: 'Roti', en: 'Bread', emoji: '🍞' },
    { id: 'Bunga', en: 'Flower', emoji: '🌸' },
    { id: 'Tikus', en: 'Mouse', emoji: '🐭' },
    { id: 'Kuda', en: 'Horse', emoji: '🐴' },
    { id: 'Pisang', en: 'Banana', emoji: '🍌' },
    { id: 'Rumah', en: 'House', emoji: '🏠' },
  ],
};

/** Sedang — kata Indonesia ↔ kata Inggris, TANPA kognat (dicek build). */
export const TRANSLATE_BANK: MemoryWord[] = [
  { id: 'Kelinci', en: 'Rabbit', emoji: '🐰' },
  { id: 'Bulan', en: 'Moon', emoji: '🌙' },
  { id: 'Bintang', en: 'Star', emoji: '⭐' },
  { id: 'Katak', en: 'Frog', emoji: '🐸' },
  { id: 'Jeruk', en: 'Orange', emoji: '🍊' },
  { id: 'Jendela', en: 'Window', emoji: '🪟' },
  { id: 'Layang-layang', en: 'Kite', emoji: '🪁' },
  { id: 'Kereta', en: 'Train', emoji: '🚂' },
  { id: 'Perahu', en: 'Boat', emoji: '⛵' },
  { id: 'Pelangi', en: 'Rainbow', emoji: '🌈' },
  { id: 'Keju', en: 'Cheese', emoji: '🧀' },
  { id: 'Madu', en: 'Honey', emoji: '🍯' },
];

/** Sulit — bunyi ↔ tulisan. Kata TIDAK boleh homofon satu sama lain
 *  (see/sea): dari suara saja keduanya benar. Ejaan yang tidak sesuai
 *  bunyinya (Island, Glasses) justru bagian dari tantangannya. */
export const SOUND_BANK: MemoryWord[] = [
  { id: 'Gigi', en: 'Tooth', emoji: '🦷' },
  { id: 'Pulau', en: 'Island', emoji: '🏝️' },
  { id: 'Tangga', en: 'Ladder', emoji: '🪜' },
  { id: 'Awan', en: 'Cloud', emoji: '☁️' },
  { id: 'Salju', en: 'Snow', emoji: '❄️' },
  { id: 'Gunung', en: 'Mountain', emoji: '⛰️' },
  { id: 'Daun', en: 'Leaf', emoji: '🍃' },
  { id: 'Mangkuk', en: 'Bowl', emoji: '🥣' },
  { id: 'Sendok', en: 'Spoon', emoji: '🥄' },
  { id: 'Kacamata', en: 'Glasses', emoji: '👓' },
  { id: 'Wortel', en: 'Carrot', emoji: '🥕' },
  { id: 'Jagung', en: 'Corn', emoji: '🌽' },
];

export const OPPOSITE_BANK: OppositePair[] = [
  { a: 'Big', aId: 'Besar', b: 'Small', bId: 'Kecil' },
  { a: 'Hot', aId: 'Panas', b: 'Cold', bId: 'Dingin' },
  { a: 'Fast', aId: 'Cepat', b: 'Slow', bId: 'Lambat' },
  { a: 'Happy', aId: 'Senang', b: 'Sad', bId: 'Sedih' },
  { a: 'Open', aId: 'Terbuka', b: 'Closed', bId: 'Tertutup' },
  { a: 'Wet', aId: 'Basah', b: 'Dry', bId: 'Kering' },
  { a: 'Heavy', aId: 'Berat', b: 'Light', bId: 'Ringan' },
  { a: 'Full', aId: 'Penuh', b: 'Empty', bId: 'Kosong' },
  { a: 'Day', aId: 'Siang', b: 'Night', bId: 'Malam' },
  { a: 'Clean', aId: 'Bersih', b: 'Dirty', bId: 'Kotor' },
  { a: 'Loud', aId: 'Berisik', b: 'Quiet', bId: 'Tenang' },
  { a: 'Early', aId: 'Awal', b: 'Late', bId: 'Terlambat' },
  { a: 'Old', aId: 'Tua', b: 'Young', bId: 'Muda' },
];

export const GAP_BANK: GapSentence[] = [
  { sentence: 'I brush my teeth with my ___.', sentenceId: 'Aku menggosok gigi pakai ___-ku.', answer: 'Toothbrush' },
  { sentence: 'I borrow books from the ___.', sentenceId: 'Aku meminjam buku dari ___.', answer: 'Library' },
  { sentence: 'Put the milk in the ___ to keep it cold.', sentenceId: 'Taruh susu di ___ supaya tetap dingin.', answer: 'Fridge' },
  { sentence: 'I wear my ___ on my head when I ride my bike.', sentenceId: 'Aku memakai ___ di kepala saat naik sepeda.', answer: 'Helmet' },
  { sentence: 'The ___ on the wall tells us the time.', sentenceId: '___ di dinding memberi tahu kita jam berapa.', answer: 'Clock' },
  { sentence: 'I dry my body with my ___ after a bath.', sentenceId: 'Aku mengeringkan badan dengan ___-ku setelah mandi.', answer: 'Towel' },
  { sentence: 'I take my ___ because it is raining.', sentenceId: 'Aku membawa ___-ku karena sedang hujan.', answer: 'Umbrella' },
  { sentence: 'The doctor works at the ___.', sentenceId: 'Dokter bekerja di ___.', answer: 'Hospital' },
  { sentence: 'I cut the paper with my ___.', sentenceId: 'Aku memotong kertas dengan ___-ku.', answer: 'Scissors' },
  { sentence: 'The plane lands at the ___.', sentenceId: 'Pesawat mendarat di ___.', answer: 'Airport' },
  { sentence: 'I write my homework in my ___.', sentenceId: 'Aku menulis PR di ___-ku.', answer: 'Notebook' },
  { sentence: 'Mom cooks dinner in the ___.', sentenceId: 'Ibu memasak makan malam di ___.', answer: 'Kitchen' },
];
