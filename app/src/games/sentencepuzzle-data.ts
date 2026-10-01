/**
 * Data Sentence Puzzle (Raja Susun) — dipisah dari `games/sentencepuzzle.ts`
 * supaya dicek otomatis oleh `scripts/verify-vocab-content.mjs` tanpa ikut
 * mem-bundle kode DOM (pola sama `wordmatch-data.ts`).
 *
 * 🔒 Pembeda tiap markas = POLA KALIMAT yang naik + 1 jenis tantangan baru
 * (riset `materi/pembeda_level_game.md` § Sentence Puzzle — urutan
 * Processability Theory: SVO → + keterangan → bentuk kata → tanya/menyangkal
 * → 2 klausa), BUKAN lagi jumlah kata pengecoh:
 *
 * | Markas     | Prompt                        | Pola kalimat              | Pengecoh            | 💡 Petunjuk               |
 * |------------|-------------------------------|---------------------------|---------------------|---------------------------|
 * | Pemanasan  | 🔊 otomatis + arti, tap=dengar | SVO 3 kata                | 1 kata lain         | isi 1 kata berikutnya     |
 * | Mudah      | 🔊 otomatis                    | SVO + sifat/benda (4–5)   | 2 kata lain         | isi 1 kata berikutnya     |
 * | Sedang     | arti Indonesia saja            | + keterangan (5–7)        | 2 kata lain         | 🔊 dengar kalimat         |
 * | Sulit      | arti Indonesia                 | bentuk kata kerja (5–7)   | 2 bentuk keliru     | 🔊 dengar kalimat         |
 * | Jago       | arti Indonesia                 | tanya & "tidak" (4–7)     | 2 bentuk keliru     | 🔊 dengar, 🔒 sampai 1x coba |
 * | Legendaris | arti Indonesia                 | 2 klausa + penghubung (7–9)| 2 penghubung keliru | 🔊 dengar, 🔒 sampai 1x coba |
 *
 * Aturan menulis kalimat baru (dicek build):
 * - `en` TANPA koma di tengah (gelembung = kata dipisah spasi), tanpa nama orang.
 * - `wrong` (Sulit ke atas) = tepat 2 kata yang TIDAK ada di kalimat & benar-
 *   benar tidak pas di kalimat itu (bentuk lain kata yang sama / penghubung
 *   yang tidak sesuai arti Indonesia).
 * - `alt` = urutan lain yang juga benar, kata-katanya SAMA PERSIS.
 * - Jumlah kata dalam rentang `minWords`–`maxWords` tier-nya.
 */
import type { WordMatchDifficulty } from '../types';

export interface PuzzleSentence {
  en: string;
  id: string;
  /** Sulit–Legendaris: tepat 2 bentuk keliru yang jadi gelembung pengecoh. */
  wrong?: string[];
  /** Urutan kata lain yang juga benar (kata sama persis). */
  alt?: string[];
}

export type PromptMode = 'audio-meaning' | 'audio' | 'meaning';
export type HintMode = 'next-word' | 'listen';

export interface TierConfig {
  label: string;
  prompt: PromptMode;
  /** Tap gelembung = kata dibacakan (Pemanasan, bantu anak yang belum lancar membaca). */
  speakOnTap: boolean;
  distractor: 'sibling' | 'wrong';
  distractorCount: number;
  hint: HintMode;
  /** 💡 terkunci 🔒 sampai anak 1x mencoba menyusun. */
  hintGated: boolean;
  minWords: number;
  maxWords: number;
  /** 1 baris instruksi di atas papan. */
  task: string;
}

export const TIER_CONFIG: Record<WordMatchDifficulty, TierConfig> = {
  pemanasan: { label: 'Pemanasan', prompt: 'audio-meaning', speakOnTap: true, distractor: 'sibling', distractorCount: 1, hint: 'next-word', hintGated: false, minWords: 3, maxWords: 3, task: 'Dengar, lalu susun katanya. Tap gelembung untuk dengar.' },
  mudah: { label: 'Mudah', prompt: 'audio', speakOnTap: false, distractor: 'sibling', distractorCount: 2, hint: 'next-word', hintGated: false, minWords: 4, maxWords: 5, task: 'Dengar baik-baik, lalu susun kalimatnya.' },
  sedang: { label: 'Sedang', prompt: 'meaning', speakOnTap: false, distractor: 'sibling', distractorCount: 2, hint: 'listen', hintGated: false, minWords: 5, maxWords: 7, task: 'Susun kalimat Inggris dari arti ini.' },
  sulit: { label: 'Sulit', prompt: 'meaning', speakOnTap: false, distractor: 'wrong', distractorCount: 2, hint: 'listen', hintGated: false, minWords: 5, maxWords: 7, task: 'Awas, ada kata yang bentuknya tidak pas!' },
  jago: { label: 'Jago', prompt: 'meaning', speakOnTap: false, distractor: 'wrong', distractorCount: 2, hint: 'listen', hintGated: true, minWords: 4, maxWords: 7, task: 'Bertanya atau bilang "tidak"? Susun yang pas!' },
  legendaris: { label: 'Legendaris', prompt: 'meaning', speakOnTap: false, distractor: 'wrong', distractorCount: 2, hint: 'listen', hintGated: true, minWords: 7, maxWords: 9, task: 'Gabungkan 2 ide dengan kata penghubung yang pas!' },
};

/** Pemanasan — SVO 3 kata, kosakata Starters. */
const BANK_PEMANASAN: PuzzleSentence[] = [
  { en: 'I like apples.', id: 'Aku suka apel.' },
  { en: 'I see stars.', id: 'Aku melihat bintang.' },
  { en: 'We eat rice.', id: 'Kami makan nasi.' },
  { en: 'I read books.', id: 'Aku membaca buku.' },
  { en: 'They play football.', id: 'Mereka bermain sepak bola.' },
  { en: 'I drink milk.', id: 'Aku minum susu.' },
  { en: 'We sing songs.', id: 'Kami menyanyikan lagu.' },
  { en: 'I love bananas.', id: 'Aku suka sekali pisang.' },
  { en: 'I draw pictures.', id: 'Aku membuat gambar.' },
  { en: 'We fly kites.', id: 'Kami menerbangkan layang-layang.' },
];

/** Mudah — SVO + kata sifat/benda, Starters. */
const BANK_MUDAH: PuzzleSentence[] = [
  { en: 'The ball is red.', id: 'Bolanya merah.' },
  { en: 'My bag is big.', id: 'Tasku besar.' },
  { en: 'I have a new pen.', id: 'Aku punya pena baru.' },
  { en: 'The sun is hot.', id: 'Mataharinya panas.' },
  { en: 'This cake is sweet.', id: 'Kue ini manis.' },
  { en: 'I have two blue books.', id: 'Aku punya dua buku biru.' },
  { en: 'The door is open.', id: 'Pintunya terbuka.' },
  { en: 'My shoes are black.', id: 'Sepatuku hitam.' },
  { en: 'The water is cold.', id: 'Airnya dingin.' },
  { en: 'I see a yellow bus.', id: 'Aku melihat bus kuning.' },
];

/** Sedang — + keterangan tempat/waktu, Starters–Movers. */
const BANK_SEDANG: PuzzleSentence[] = [
  { en: 'I play football after school.', id: 'Aku bermain sepak bola sepulang sekolah.', alt: ['After school I play football.'] },
  { en: 'We eat lunch at school.', id: 'Kami makan siang di sekolah.', alt: ['At school we eat lunch.'] },
  { en: 'My book is on the table.', id: 'Bukuku ada di atas meja.' },
  { en: 'I brush my teeth every morning.', id: 'Aku menggosok gigi setiap pagi.', alt: ['Every morning I brush my teeth.'] },
  { en: 'The ball is under the chair.', id: 'Bolanya ada di bawah kursi.' },
  { en: 'We go to the park on Sunday.', id: 'Kami pergi ke taman hari Minggu.', alt: ['On Sunday we go to the park.'] },
  { en: 'I read a story at night.', id: 'Aku membaca cerita pada malam hari.', alt: ['At night I read a story.'] },
  { en: 'My pencil is in my bag.', id: 'Pensilku ada di dalam tasku.' },
  { en: 'We watch TV in the evening.', id: 'Kami menonton TV pada sore hari.', alt: ['In the evening we watch TV.'] },
  { en: 'I go to bed at nine.', id: 'Aku tidur jam sembilan.', alt: ['At nine I go to bed.'] },
];

/** Sulit — bentuk kata kerja harus pas (is/are, -s, -ing, lampau), Movers. */
const BANK_SULIT: PuzzleSentence[] = [
  { en: 'She plays with her friends.', id: 'Dia bermain dengan teman-temannya.', wrong: ['play', 'playing'] },
  { en: 'The books are on the shelf.', id: 'Buku-buku itu ada di rak.', wrong: ['is', 'am'] },
  { en: 'My brother likes pizza very much.', id: 'Kakakku suka sekali pizza.', wrong: ['like', 'liking'] },
  { en: 'They are drawing a big house.', id: 'Mereka sedang menggambar rumah besar.', wrong: ['is', 'draws'] },
  { en: 'I am reading a comic now.', id: 'Aku sedang membaca komik sekarang.', wrong: ['is', 'are'] },
  { en: 'He washes his bike every Saturday.', id: 'Dia mencuci sepedanya setiap hari Sabtu.', wrong: ['wash', 'washing'], alt: ['Every Saturday he washes his bike.'] },
  { en: 'We were at the beach yesterday.', id: 'Kemarin kami ada di pantai.', wrong: ['was', 'are'], alt: ['Yesterday we were at the beach.'] },
  { en: 'She went to the shop yesterday.', id: 'Kemarin dia pergi ke toko.', wrong: ['go', 'goes'], alt: ['Yesterday she went to the shop.'] },
  { en: 'The windows are very clean today.', id: 'Jendela-jendelanya sangat bersih hari ini.', wrong: ['is', 'am'], alt: ['Today the windows are very clean.'] },
  { en: 'My mum cooks dinner every day.', id: 'Ibuku memasak makan malam setiap hari.', wrong: ['cook', 'cooking'], alt: ['Every day my mum cooks dinner.'] },
];

/** Jago — kalimat tanya & kalimat "tidak" (urutan kata berubah), Movers–Flyers. */
const BANK_JAGO: PuzzleSentence[] = [
  { en: 'Do you like pizza?', id: 'Apakah kamu suka pizza?', wrong: ['does', 'are'] },
  { en: "He doesn't like milk.", id: 'Dia tidak suka susu.', wrong: ["don't", 'likes'] },
  { en: 'Does she play the piano?', id: 'Apakah dia bermain piano?', wrong: ['do', 'plays'] },
  { en: "We don't have a car.", id: 'Kami tidak punya mobil.', wrong: ["doesn't", 'has'] },
  { en: 'Is your bag heavy?', id: 'Apakah tasmu berat?', wrong: ['are', 'am'] },
  { en: "They aren't at home now.", id: 'Mereka sedang tidak di rumah.', wrong: ["isn't", 'am'] },
  { en: 'Can you swim fast?', id: 'Apakah kamu bisa berenang cepat?', wrong: ['swims', 'swimming'] },
  { en: "I can't find my pencil.", id: 'Aku tidak bisa menemukan pensilku.', wrong: ['finds', 'finding'] },
  { en: 'Where do you live?', id: 'Kamu tinggal di mana?', wrong: ['does', 'lives'] },
  { en: "She didn't go to school yesterday.", id: 'Kemarin dia tidak pergi ke sekolah.', wrong: ['went', 'goes'], alt: ["Yesterday she didn't go to school."] },
];

/** Legendaris — 2 klausa + kata penghubung, Flyers. Pengecoh = penghubung
 *  lain yang tidak sesuai arti Indonesia (arti SELALU tampil). */
const BANK_LEGENDARIS: PuzzleSentence[] = [
  { en: 'I stay home because it is raining.', id: 'Aku di rumah saja karena hujan.', wrong: ['so', 'but'], alt: ['Because it is raining I stay home.'] },
  { en: 'It is cold so I wear a jacket.', id: 'Udaranya dingin jadi aku memakai jaket.', wrong: ['because', 'but'] },
  { en: "I like apples but I don't like bananas.", id: 'Aku suka apel tapi aku tidak suka pisang.', wrong: ['so', 'because'] },
  { en: 'We went to the park and we played football.', id: 'Kami pergi ke taman dan kami bermain sepak bola.', wrong: ['but', 'because'] },
  { en: 'She is tired because she swam a lot.', id: 'Dia lelah karena dia banyak berenang.', wrong: ['so', 'and'], alt: ['Because she swam a lot she is tired.'] },
  { en: 'I was hungry so I ate a sandwich.', id: 'Aku lapar jadi aku makan roti lapis.', wrong: ['because', 'but'] },
  { en: 'He wanted to play but it was dark.', id: 'Dia ingin bermain tapi hari sudah gelap.', wrong: ['so', 'because'] },
  { en: 'I will read a book when I get home.', id: 'Aku akan membaca buku saat aku sampai di rumah.', wrong: ['because', 'so'], alt: ['When I get home I will read a book.'] },
  { en: 'We can go out if the rain stops.', id: 'Kita bisa keluar kalau hujannya berhenti.', wrong: ['so', 'but'], alt: ['If the rain stops we can go out.'] },
  { en: 'My room is clean because I tidied it.', id: 'Kamarku bersih karena aku sudah merapikannya.', wrong: ['so', 'but'] },
];

export const SENTENCE_BANK: Record<WordMatchDifficulty, PuzzleSentence[]> = {
  pemanasan: BANK_PEMANASAN,
  mudah: BANK_MUDAH,
  sedang: BANK_SEDANG,
  sulit: BANK_SULIT,
  jago: BANK_JAGO,
  legendaris: BANK_LEGENDARIS,
};

/** Pecah kalimat jadi kata (tanda baca akhir dibuang). */
export function tokenize(sentence: string): string[] {
  return sentence
    .replace(/[.?!]+$/, '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}
