/**
 * Data Balloon Hunt (Raja Balon) — dipisah dari `games/balloonpop.ts`
 * supaya dicek otomatis `scripts/verify-vocab-content.mjs` tanpa ikut
 * mem-bundle kode DOM. Pola sama `wordmatch-data.ts`/`soundhunt-data.ts`.
 * Analisis & riset: `materi/pembeda_level_game.md` § Taman Balon.
 *
 * 🔒 Bentuk game tetap (balon naik, tap untuk meletupkan). Dulu pembedanya
 * cuma KECEPATAN (16–20 → 5–6,5 dtk, tantangan motorik) + kata makin
 * panjang/langka (penuh kognat: Satelit↔Satellite). Sekarang tiap markas
 * menambah SATU jenis tantangan bahasa, kecepatan cuma naik tipis (18 → 10
 * dtk, ada batas bawah):
 *
 * | Markas     | Prompt                                  | Isi balon      | Pengecoh                  | Balon | 💡 Bantuan                   |
 * |------------|-----------------------------------------|----------------|---------------------------|-------|------------------------------|
 * | Pemanasan  | 🔊 kata Inggris (dibacakan)             | GAMBAR         | acak, beda jauh           | 2     | balon benar berkedip (1x salah) |
 * | Mudah      | gambar + kata Indonesia (🔊 Indonesia)   | kata Inggris   | acak                      | 4     | coret 1 balon                |
 * | Sedang     | kata Indonesia                          | kata Inggris   | MIRIP BENTUK (boat/goat)  | 4     | coret 1 balon                |
 * | Sulit      | kata Indonesia                          | kata Inggris   | SATU KATEGORI (4 buah)    | 4     | coret 1 balon                |
 * | Jago       | 🔊 kata Inggris SAJA (tanpa tulisan)     | kata Inggris   | MIRIP BUNYI (ship/sheep)  | 4     | arti Indonesia               |
 * | Legendaris | kalimat Inggris rumpang                 | kata Inggris   | cocok bentuk, salah makna | 4     | arti kalimat                 |
 *
 * Tanpa kognat di prompt Indonesia (dicek build). Beda dari Word Quest
 * (suara↔gambar, definisi↔kata) & Sound Hunt (instruksi → gambar): di sini
 * Jago = suara ↔ EJAAN, Legendaris = kalimat rumpang.
 */
import type { BalloonDifficulty } from '../types';

export type PromptMode = 'audio' | 'picture-id' | 'id' | 'audio-only' | 'gap';
export type BalloonPicker = 'random' | 'group';
export type HintKind = 'flash' | 'strike' | 'meaning';

export interface TierConfig {
  label: string;
  prompt: PromptMode;
  /** Balon berisi gambar (Pemanasan) atau kata Inggris. */
  balloonPicture: boolean;
  picker: BalloonPicker;
  balloons: number;
  /** Detik 1 balon menempuh papan (besar = lambat). */
  durMin: number;
  durMax: number;
  swayMin: number;
  swayMax: number;
  hint: HintKind;
  /** 1 baris instruksi di atas papan. */
  task: string;
}

/** Kata per markas. */
export const WORD_COUNT = 10;

export const TIER_CONFIG: Record<BalloonDifficulty, TierConfig> = {
  pemanasan: { label: 'Pemanasan', prompt: 'audio', balloonPicture: true, picker: 'random', balloons: 2, durMin: 17, durMax: 19, swayMin: 3.8, swayMax: 4.8, hint: 'flash', task: 'Dengarkan, lalu letupkan gambarnya!' },
  mudah: { label: 'Mudah', prompt: 'picture-id', balloonPicture: false, picker: 'random', balloons: 4, durMin: 15, durMax: 17, swayMin: 3.4, swayMax: 4.4, hint: 'strike', task: 'Letupkan kata Inggrisnya!' },
  sedang: { label: 'Sedang', prompt: 'id', balloonPicture: false, picker: 'group', balloons: 4, durMin: 13, durMax: 15, swayMin: 3, swayMax: 3.8, hint: 'strike', task: 'Awas, katanya mirip-mirip! Baca teliti, ya.' },
  sulit: { label: 'Sulit', prompt: 'id', balloonPicture: false, picker: 'group', balloons: 4, durMin: 12, durMax: 13.5, swayMin: 2.8, swayMax: 3.4, hint: 'strike', task: 'Semua balon dari kelompok {cat}. Pilih yang pas!' },
  jago: { label: 'Jago', prompt: 'audio-only', balloonPicture: false, picker: 'group', balloons: 4, durMin: 11, durMax: 12, swayMin: 2.6, swayMax: 3.2, hint: 'meaning', task: 'Dengarkan baik-baik, bunyinya mirip!' },
  legendaris: { label: 'Legendaris', prompt: 'gap', balloonPicture: false, picker: 'random', balloons: 4, durMin: 10, durMax: 11, swayMin: 2.4, swayMax: 3, hint: 'meaning', task: 'Letupkan kata yang pas untuk kalimatnya!' },
};

export interface BalloonWord {
  en: string;
  id: string;
  /** Wajib utk Pemanasan (isi balon) & Mudah (gambar di prompt). */
  emoji?: string;
}

/** Pemanasan — Starters, benda sehari-hari yang sangat beda (isi balon =
 *  gambar, bisa dimainkan anak yang belum bisa membaca). */
export const WARMUP_BANK: BalloonWord[] = [
  { en: 'apple', id: 'apel', emoji: '🍎' },
  { en: 'bed', id: 'tempat tidur', emoji: '🛏️' },
  { en: 'cup', id: 'cangkir', emoji: '☕' },
  { en: 'egg', id: 'telur', emoji: '🥚' },
  { en: 'hat', id: 'topi', emoji: '🎩' },
  { en: 'kite', id: 'layang-layang', emoji: '🪁' },
  { en: 'key', id: 'kunci', emoji: '🔑' },
  { en: 'milk', id: 'susu', emoji: '🥛' },
  { en: 'sun', id: 'matahari', emoji: '☀️' },
  { en: 'star', id: 'bintang', emoji: '⭐' },
  { en: 'moon', id: 'bulan', emoji: '🌙' },
  { en: 'car', id: 'mobil', emoji: '🚗' },
];

/** Mudah — Starters, prompt gambar + kata Indonesia. */
export const EASY_BANK: BalloonWord[] = [
  { en: 'Cat', id: 'Kucing', emoji: '🐱' },
  { en: 'Dog', id: 'Anjing', emoji: '🐶' },
  { en: 'Book', id: 'Buku', emoji: '📖' },
  { en: 'Chair', id: 'Kursi', emoji: '🪑' },
  { en: 'Shoe', id: 'Sepatu', emoji: '👟' },
  { en: 'Bread', id: 'Roti', emoji: '🍞' },
  { en: 'Flower', id: 'Bunga', emoji: '🌸' },
  { en: 'House', id: 'Rumah', emoji: '🏠' },
  { en: 'Tree', id: 'Pohon', emoji: '🌳' },
  { en: 'Door', id: 'Pintu', emoji: '🚪' },
  { en: 'Bike', id: 'Sepeda', emoji: '🚲' },
  { en: 'Bag', id: 'Tas', emoji: '🎒' },
];

export interface WordGroup {
  /** Nama kelompok (ditampilkan di instruksi Sulit). */
  name: string;
  items: BalloonWord[];
}

/** Sedang — kata MIRIP BENTUK (beda 1–2 huruf). 1 soal = 3 kata 1 grup + 1
 *  acak. Sengaja beda dari grup mirip-bentuk Word Quest (Cat/Car, Moon/Spoon). */
export const LOOKALIKE_GROUPS: WordGroup[] = [
  { name: 'ake', items: [{ en: 'Cake', id: 'Kue' }, { en: 'Lake', id: 'Danau' }, { en: 'Snake', id: 'Ular' }] },
  { name: 'oat', items: [{ en: 'Boat', id: 'Perahu' }, { en: 'Goat', id: 'Kambing' }, { en: 'Coat', id: 'Mantel' }] },
  { name: 'ing', items: [{ en: 'King', id: 'Raja' }, { en: 'Ring', id: 'Cincin' }, { en: 'Wing', id: 'Sayap' }] },
  { name: 'ock', items: [{ en: 'Sock', id: 'Kaus kaki' }, { en: 'Rock', id: 'Batu' }, { en: 'Clock', id: 'Jam dinding' }] },
  { name: 'all', items: [{ en: 'Ball', id: 'Bola' }, { en: 'Wall', id: 'Dinding' }, { en: 'Hall', id: 'Aula' }] },
  { name: 'an', items: [{ en: 'Fan', id: 'Kipas angin' }, { en: 'Pan', id: 'Wajan' }, { en: 'Can', id: 'Kaleng' }] },
  { name: 'ice', items: [{ en: 'Rice', id: 'Nasi' }, { en: 'Dice', id: 'Dadu' }, { en: 'Ice', id: 'Es' }] },
];

/** Sulit — SATU kategori per soal (4 balon sekelompok). */
export const CATEGORY_GROUPS: WordGroup[] = [
  {
    name: 'Buah',
    items: [
      { en: 'Banana', id: 'Pisang' },
      { en: 'Grapes', id: 'Anggur' },
      { en: 'Watermelon', id: 'Semangka' },
      { en: 'Pineapple', id: 'Nanas' },
      { en: 'Orange', id: 'Jeruk' },
      { en: 'Pear', id: 'Pir' },
      { en: 'Coconut', id: 'Kelapa' },
    ],
  },
  {
    name: 'Kendaraan',
    items: [
      { en: 'Train', id: 'Kereta' },
      { en: 'Plane', id: 'Pesawat' },
      { en: 'Ship', id: 'Kapal' },
      { en: 'Bicycle', id: 'Sepeda' },
      { en: 'Motorbike', id: 'Sepeda motor' },
    ],
  },
  {
    name: 'Pakaian',
    items: [
      { en: 'Shirt', id: 'Kaus' },
      { en: 'Skirt', id: 'Rok' },
      { en: 'Dress', id: 'Gaun' },
      { en: 'Trousers', id: 'Celana panjang' },
      { en: 'Scarf', id: 'Syal' },
      { en: 'Glove', id: 'Sarung tangan' },
    ],
  },
  {
    name: 'Hewan',
    items: [
      { en: 'Rabbit', id: 'Kelinci' },
      { en: 'Horse', id: 'Kuda' },
      { en: 'Cow', id: 'Sapi' },
      { en: 'Frog', id: 'Katak' },
      { en: 'Lion', id: 'Singa' },
      { en: 'Chicken', id: 'Ayam' },
      { en: 'Tiger', id: 'Harimau' },
    ],
  },
];

/** Jago — kata MIRIP BUNYI (pasangan minimal yang sering tertukar anak
 *  Indonesia: i/ee, f/v, l/r, th/t, e/a). BUKAN homofon (see/sea) — dari
 *  suara saja harus tetap bisa dibedakan. 1 soal = kata 1 grup + isi acak. */
export const SOUNDALIKE_GROUPS: WordGroup[] = [
  { name: 'ship', items: [{ en: 'Ship', id: 'Kapal' }, { en: 'Sheep', id: 'Domba' }, { en: 'Shop', id: 'Toko' }, { en: 'Chip', id: 'Keripik' }] },
  { name: 'pen', items: [{ en: 'Pen', id: 'Pena' }, { en: 'Pin', id: 'Peniti' }, { en: 'Pan', id: 'Wajan' }] },
  { name: 'three', items: [{ en: 'Three', id: 'Tiga' }, { en: 'Tree', id: 'Pohon' }, { en: 'Free', id: 'Gratis' }] },
  { name: 'light', items: [{ en: 'Light', id: 'Lampu' }, { en: 'Right', id: 'Kanan' }, { en: 'Night', id: 'Malam' }] },
  { name: 'fan', items: [{ en: 'Fan', id: 'Kipas angin' }, { en: 'Van', id: 'Mobil boks' }, { en: 'Fun', id: 'Seru' }] },
  { name: 'bed', items: [{ en: 'Bed', id: 'Tempat tidur' }, { en: 'Bad', id: 'Buruk' }, { en: 'Bird', id: 'Burung' }] },
  { name: 'thin', items: [{ en: 'Thin', id: 'Kurus' }, { en: 'Tin', id: 'Kaleng' }, { en: 'Ten', id: 'Sepuluh' }] },
  { name: 'cap', items: [{ en: 'Cap', id: 'Topi pet' }, { en: 'Cup', id: 'Cangkir' }, { en: 'Cat', id: 'Kucing' }] },
];

/** Legendaris — kalimat rumpang (`___` tepat 1x). `options[0]` = jawaban;
 *  3 pengecoh = kata benda yang cocok BENTUK-nya (gramatikal) tapi salah
 *  MAKNA di kalimat itu — hanya 1 balon yang benar. `sentenceId` ikut
 *  berlubang supaya 💡 Arti tidak membocorkan jawaban. Tanpa "an ___"
 *  (kata sandang bocorkan jawaban); "a ___" → semua opsi berawalan
 *  konsonan (dicek build). */
export interface GapSentence {
  sentence: string;
  sentenceId: string;
  options: string[];
}

export const GAP_BANK: GapSentence[] = [
  { sentence: 'I brush my teeth with a ___.', sentenceId: 'Aku menggosok gigi dengan ___.', options: ['toothbrush', 'towel', 'spoon', 'pillow'] },
  { sentence: 'I wear my ___ when it is cold.', sentenceId: 'Aku memakai ___-ku saat udara dingin.', options: ['jacket', 'sandals', 'shorts', 'sunglasses'] },
  { sentence: 'We cut the birthday ___ with a knife.', sentenceId: 'Kami memotong ___ ulang tahun dengan pisau.', options: ['cake', 'soup', 'milk', 'juice'] },
  { sentence: 'Fish live in the ___.', sentenceId: 'Ikan hidup di ___.', options: ['sea', 'sky', 'desert', 'kitchen'] },
  { sentence: 'I drink a glass of ___ every morning.', sentenceId: 'Aku minum segelas ___ setiap pagi.', options: ['milk', 'bread', 'rice', 'cheese'] },
  { sentence: 'The ___ shines in the sky at night.', sentenceId: '___ bersinar di langit pada malam hari.', options: ['moon', 'sun', 'rainbow', 'grass'] },
  { sentence: 'A ___ helps sick people get better.', sentenceId: 'Seorang ___ membantu orang sakit jadi sehat.', options: ['doctor', 'farmer', 'pilot', 'chef'] },
  { sentence: 'We borrow books from the ___.', sentenceId: 'Kami meminjam buku dari ___.', options: ['library', 'kitchen', 'garage', 'bathroom'] },
  { sentence: 'Birds build a ___ in the tree.', sentenceId: 'Burung membuat ___ di pohon.', options: ['nest', 'hive', 'web', 'road'] },
  { sentence: 'The big ___ takes people across the sea.', sentenceId: '___ besar membawa orang menyeberangi laut.', options: ['ship', 'bus', 'train', 'bicycle'] },
  { sentence: 'I keep my money in my ___.', sentenceId: 'Aku menyimpan uang di ___-ku.', options: ['wallet', 'pillow', 'bucket', 'lamp'] },
  { sentence: 'Please turn off the ___. It is too bright.', sentenceId: 'Tolong matikan ___. Terlalu terang.', options: ['light', 'radio', 'fan', 'tap'] },
];
