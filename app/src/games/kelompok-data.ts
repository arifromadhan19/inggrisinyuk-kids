/**
 * Data Raja Kelompok — bank sendiri (dulu game ini mengambil topik Vocab
 * ber-`sortBaskets`, cuma ada 1: Little Stars "Bentuk", jadi game ini
 * tersembunyi di 5 dari 6 level & keputusannya — bulat/bersudut — bisa
 * dijawab dari gambar saja tanpa bahasa Inggris). Dipisah dari
 * `games/kelompok.ts` supaya dicek otomatis `scripts/verify-vocab-content.mjs`.
 * Analisis & riset: `materi/pembeda_level_game.md` § Raja Kelompok.
 *
 * 🔒 Tugas inti = MENGELOMPOKKAN menurut ARTI kata Inggris (bukan bentuk
 * gambar). Kategori dipakai sbg TUGAS, beda dari Word Quest/Balloon/Sound
 * Hunt yang memakai kategori sbg pengecoh. Tiap markas 1 tantangan baru:
 *
 * | Markas     | Yang dikelompokkan              | Keranjang                         | 💡 Bantuan                    |
 * |------------|---------------------------------|-----------------------------------|-------------------------------|
 * | Pemanasan  | gambar + kata dibacakan 🔊       | 2, ikon + label Inggris           | arti Indonesia nama keranjang |
 * | Mudah      | KATA Inggris tertulis (tanpa gambar) | 2, ikon + label Inggris       | gambar katanya muncul         |
 * | Sedang     | kata Inggris tertulis           | 3, ikon + label Inggris           | gambar katanya muncul         |
 * | Sulit      | kata Inggris tertulis           | 3 TEMPAT, label Inggris SAJA      | arti Indonesia kata           |
 * | Jago       | 🔊 kata DIDENGAR saja            | 3, ikon + label Inggris           | tulisan katanya muncul        |
 * | Legendaris | "Odd One Out": 4 kata, 1 bukan kelompoknya | —                      | nama kelompok 3 kata lain     |
 *
 * 10 soal per markas. Kategori WAJIB tidak ambigu: 1 kata cuma cocok ke 1
 * kelompok di bank yang dipakai bersamaan (dicek build: kata tidak boleh
 * muncul di 2 kelompok).
 */
import type { WordMatchDifficulty } from '../types';

export type KelompokMode = 'sort' | 'odd';
export type ItemShow = 'picture' | 'word' | 'audio';
export type HintKind = 'basket-meaning' | 'picture' | 'meaning' | 'word' | 'group-name';

export interface TierConfig {
  label: string;
  mode: KelompokMode;
  /** Kelompok yang dipakai (key di `GROUPS`). */
  groups: string[];
  /** Jumlah keranjang per soal (mode `sort`). */
  baskets: number;
  /** Keranjang pakai ikon (false = label Inggris saja). */
  basketIcon: boolean;
  show: ItemShow;
  hint: HintKind;
  /** Petunjuk terkunci 🔒 sampai 1x coba. */
  hintGated: boolean;
  task: string;
}

export const ROUND_COUNT = 10;

export interface KItem {
  en: string;
  id: string;
  /** Wajib utk kelompok yang dipakai markas bergambar / bantuan gambar. */
  emoji?: string;
}

export interface KGroup {
  en: string;
  id: string;
  /** Ikon keranjang — BUKAN salah satu ikon item-nya (biar tidak cocok gambar). */
  emoji: string;
  items: KItem[];
}

/** Kelompok benda sehari-hari (Cambridge wordlist disusun per kategori). */
export const GROUPS: Record<string, KGroup> = {
  animals: {
    en: 'Animals', id: 'Hewan', emoji: '🐾',
    items: [
      { en: 'cat', id: 'kucing', emoji: '🐱' }, { en: 'dog', id: 'anjing', emoji: '🐶' }, { en: 'cow', id: 'sapi', emoji: '🐮' },
      { en: 'pig', id: 'babi', emoji: '🐷' }, { en: 'horse', id: 'kuda', emoji: '🐴' }, { en: 'rabbit', id: 'kelinci', emoji: '🐰' },
      { en: 'mouse', id: 'tikus', emoji: '🐭' }, { en: 'frog', id: 'katak', emoji: '🐸' }, { en: 'lion', id: 'singa', emoji: '🦁' },
      { en: 'tiger', id: 'harimau', emoji: '🐯' }, { en: 'monkey', id: 'monyet', emoji: '🐵' }, { en: 'bear', id: 'beruang', emoji: '🐻' },
    ],
  },
  food: {
    en: 'Food', id: 'Makanan', emoji: '🍴',
    items: [
      { en: 'apple', id: 'apel', emoji: '🍎' }, { en: 'banana', id: 'pisang', emoji: '🍌' }, { en: 'bread', id: 'roti', emoji: '🍞' },
      { en: 'cake', id: 'kue', emoji: '🎂' }, { en: 'rice', id: 'nasi', emoji: '🍚' }, { en: 'pizza', id: 'pizza', emoji: '🍕' },
      { en: 'cheese', id: 'keju', emoji: '🧀' }, { en: 'carrot', id: 'wortel', emoji: '🥕' }, { en: 'soup', id: 'sup', emoji: '🍲' },
      { en: 'cookie', id: 'kukis', emoji: '🍪' }, { en: 'egg', id: 'telur', emoji: '🥚' }, { en: 'watermelon', id: 'semangka', emoji: '🍉' },
    ],
  },
  clothes: {
    en: 'Clothes', id: 'Pakaian', emoji: '👚',
    items: [
      { en: 'shirt', id: 'kaus', emoji: '👕' }, { en: 'dress', id: 'gaun', emoji: '👗' }, { en: 'shoe', id: 'sepatu', emoji: '👟' },
      { en: 'hat', id: 'topi', emoji: '🎩' }, { en: 'coat', id: 'mantel', emoji: '🧥' }, { en: 'scarf', id: 'syal', emoji: '🧣' },
      { en: 'cap', id: 'topi pet', emoji: '🧢' }, { en: 'boot', id: 'sepatu bot', emoji: '👢' }, { en: 'jeans', id: 'celana jin', emoji: '👖' },
      { en: 'sandal', id: 'sandal', emoji: '🩴' },
    ],
  },
  vehicles: {
    en: 'Vehicles', id: 'Kendaraan', emoji: '🛞',
    items: [
      { en: 'car', id: 'mobil', emoji: '🚗' }, { en: 'bus', id: 'bus', emoji: '🚌' }, { en: 'bike', id: 'sepeda', emoji: '🚲' },
      { en: 'train', id: 'kereta', emoji: '🚂' }, { en: 'boat', id: 'perahu', emoji: '⛵' }, { en: 'plane', id: 'pesawat', emoji: '✈️' },
      { en: 'truck', id: 'truk', emoji: '🚚' }, { en: 'helicopter', id: 'helikopter', emoji: '🚁' }, { en: 'ship', id: 'kapal', emoji: '🚢' },
      { en: 'taxi', id: 'taksi', emoji: '🚕' },
    ],
  },
  // Sulit — kelompok TEMPAT (di mana benda ini biasanya ada). Tanpa ikon
  // keranjang & tanpa gambar item: anak wajib paham arti kata Inggrisnya.
  kitchen: {
    en: 'Kitchen', id: 'Dapur', emoji: '',
    items: [
      { en: 'spoon', id: 'sendok' }, { en: 'fork', id: 'garpu' }, { en: 'plate', id: 'piring' },
      { en: 'pan', id: 'wajan' }, { en: 'fridge', id: 'kulkas' }, { en: 'oven', id: 'oven' },
    ],
  },
  bathroom: {
    en: 'Bathroom', id: 'Kamar mandi', emoji: '',
    items: [
      { en: 'toothbrush', id: 'sikat gigi' }, { en: 'soap', id: 'sabun' }, { en: 'towel', id: 'handuk' },
      { en: 'shower', id: 'pancuran' }, { en: 'toilet', id: 'toilet' }, { en: 'bathtub', id: 'bak rendam' },
    ],
  },
  classroom: {
    en: 'Classroom', id: 'Ruang kelas', emoji: '',
    items: [
      { en: 'pencil', id: 'pensil' }, { en: 'ruler', id: 'penggaris' }, { en: 'eraser', id: 'penghapus' },
      { en: 'whiteboard', id: 'papan tulis' }, { en: 'crayon', id: 'krayon' }, { en: 'backpack', id: 'tas sekolah' },
    ],
  },
  bedroom: {
    en: 'Bedroom', id: 'Kamar tidur', emoji: '',
    items: [
      { en: 'bed', id: 'tempat tidur' }, { en: 'pillow', id: 'bantal' }, { en: 'blanket', id: 'selimut' },
      { en: 'wardrobe', id: 'lemari baju' }, { en: 'pajamas', id: 'piyama' }, { en: 'alarm clock', id: 'jam weker' },
    ],
  },
  // Legendaris — kelompok kata yang lebih luas (Movers/Flyers): anak
  // menemukan sendiri kelompoknya, lalu memilih kata yang BUKAN anggotanya.
  colors: {
    en: 'Colors', id: 'Warna', emoji: '',
    items: [{ en: 'red', id: 'merah' }, { en: 'blue', id: 'biru' }, { en: 'green', id: 'hijau' }, { en: 'yellow', id: 'kuning' }, { en: 'purple', id: 'ungu' }, { en: 'pink', id: 'merah muda' }],
  },
  numbers: {
    en: 'Numbers', id: 'Angka', emoji: '',
    items: [{ en: 'seven', id: 'tujuh' }, { en: 'twelve', id: 'dua belas' }, { en: 'twenty', id: 'dua puluh' }, { en: 'eight', id: 'delapan' }, { en: 'fifty', id: 'lima puluh' }, { en: 'three', id: 'tiga' }],
  },
  days: {
    en: 'Days', id: 'Nama hari', emoji: '',
    items: [{ en: 'Monday', id: 'Senin' }, { en: 'Tuesday', id: 'Selasa' }, { en: 'Wednesday', id: 'Rabu' }, { en: 'Friday', id: 'Jumat' }, { en: 'Saturday', id: 'Sabtu' }, { en: 'Sunday', id: 'Minggu' }],
  },
  feelings: {
    en: 'Feelings', id: 'Perasaan', emoji: '',
    items: [{ en: 'happy', id: 'senang' }, { en: 'sad', id: 'sedih' }, { en: 'angry', id: 'marah' }, { en: 'tired', id: 'lelah' }, { en: 'scared', id: 'takut' }, { en: 'bored', id: 'bosan' }],
  },
  jobs: {
    en: 'Jobs', id: 'Pekerjaan', emoji: '',
    items: [{ en: 'doctor', id: 'dokter' }, { en: 'teacher', id: 'guru' }, { en: 'farmer', id: 'petani' }, { en: 'pilot', id: 'pilot' }, { en: 'dentist', id: 'dokter gigi' }, { en: 'singer', id: 'penyanyi' }],
  },
  weather: {
    en: 'Weather', id: 'Cuaca', emoji: '',
    items: [{ en: 'rainy', id: 'hujan' }, { en: 'sunny', id: 'cerah' }, { en: 'windy', id: 'berangin' }, { en: 'cloudy', id: 'berawan' }, { en: 'snowy', id: 'bersalju' }, { en: 'stormy', id: 'badai' }],
  },
};

/** Pasangan kelompok yang TIDAK boleh dipakai bersamaan di "Odd One Out"
 *  karena bisa terasa tumpang tindih (sunny/happy terdengar mirip suasana). */
export const ODD_BLOCKED_PAIRS: [string, string][] = [['weather', 'feelings']];

const THINGS = ['animals', 'food', 'clothes', 'vehicles'];
const PLACES = ['kitchen', 'bathroom', 'classroom', 'bedroom'];

export const TIER_CONFIG: Record<WordMatchDifficulty, TierConfig> = {
  pemanasan: { label: 'Pemanasan', mode: 'sort', groups: THINGS, baskets: 2, basketIcon: true, show: 'picture', hint: 'basket-meaning', hintGated: false, task: 'Masuk keranjang yang mana?' },
  mudah: { label: 'Mudah', mode: 'sort', groups: THINGS, baskets: 2, basketIcon: true, show: 'word', hint: 'picture', hintGated: false, task: 'Baca katanya, lalu pilih keranjangnya.' },
  sedang: { label: 'Sedang', mode: 'sort', groups: THINGS, baskets: 3, basketIcon: true, show: 'word', hint: 'picture', hintGated: false, task: 'Sekarang ada 3 keranjang. Pilih yang pas!' },
  sulit: { label: 'Sulit', mode: 'sort', groups: PLACES, baskets: 3, basketIcon: false, show: 'word', hint: 'meaning', hintGated: false, task: 'Benda ini biasanya ada di mana?' },
  jago: { label: 'Jago', mode: 'sort', groups: THINGS, baskets: 3, basketIcon: true, show: 'audio', hint: 'word', hintGated: true, task: 'Dengarkan katanya, lalu pilih keranjangnya.' },
  legendaris: { label: 'Legendaris', mode: 'odd', groups: ['colors', 'numbers', 'days', 'feelings', 'jobs', 'weather', 'animals', 'vehicles'], baskets: 0, basketIcon: false, show: 'word', hint: 'group-name', hintGated: true, task: 'Tiga kata satu kelompok. Tap yang BUKAN kelompoknya!' },
};
