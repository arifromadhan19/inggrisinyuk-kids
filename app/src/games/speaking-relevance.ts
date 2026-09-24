/**
 * Cek "nyambung" jawaban bebas Speaking TANPA LLM (Tantangan "Ngobrol" utk
 * roleplay/interview). Sebelumnya jawaban bebas cuma dinilai PANJANG-nya, jadi
 * "I like your pizza" utk "What's your name?" dapat ⭐⭐⭐ (laporan user).
 *
 * Jawaban dianggap nyambung kalau memuat minimal 1 kata yang berhubungan
 * dengan soalnya, yaitu:
 *  1. kata ISI dari pertanyaan & contoh jawaban (bentuk dasar, "rains"→"rain"),
 *  2. anggota KELOMPOK KATA yang disinggung soal itu — mis. contoh jawaban
 *     menyebut "eight" → semua angka diterima ("I am nine years old" tetap
 *     benar), menyebut "green" → semua warna, dst,
 *  3. pola khusus pertanyaan nama ("I'm Dhafran" tanpa kata "name").
 * Kata umum yang cocok utk jawaban apa pun ("like", "think", "because", …)
 * TIDAK dihitung, supaya kalimat asal tidak lolos cuma krn kata itu.
 * Batasan jujur: jawaban benar yang memakai kata di luar soal & di luar
 * kelompok kata bisa dinilai "belum nyambung" — makanya hasilnya tetap
 * non-punitive (⭐ + pesan lembut, "Lanjut" tetap ada).
 */

const GENERIC = new Set(
  (
    'the a an is am are was were be been being i im my me mine your yours you it its he she his her we our they their them ' +
    'this that these those to in on at of with for from by so and but or if then also because too very really just ' +
    'can could will would should do does did have has had not dont doesnt no yes ok okay what whats who where when why how ' +
    'which there here like likes liked love want wants think believe prefer enjoy feel feels thing things something some ' +
    'many much more most lot lots nice fun usually always sometimes often every one ones about get got go going ' +
    'make makes made well opinion say tell please thank thanks new try kind special use time day way person'
  ).split(' ')
);

const CLASSES: string[][] = [
  // angka
  ('zero one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen ' +
    'eighteen nineteen twenty thirty forty fifty sixty seventy eighty ninety hundred thousand million first second third ' +
    'fourth fifth sixth seventh eighth ninth tenth half').split(' '),
  // warna
  'red blue green yellow orange purple pink black white brown gray grey gold silver'.split(' '),
  // hari & waktu
  'monday tuesday wednesday thursday friday saturday sunday weekend morning afternoon evening night today tomorrow yesterday oclock'.split(' '),
  'january february march april may june july august september october november december birthday'.split(' '),
  // keluarga & orang
  ('mom mother mum mama dad father papa sister brother grandma grandmother grandpa grandfather aunt uncle cousin baby family ' +
    'parent parents friend friends teacher classmate neighbor').split(' '),
  // perasaan & kabar
  'fine happy sad tired sleepy angry scared excited hungry thirsty sick bored calm nervous great good ok okay well'.split(' '),
  // makanan & minuman
  ('food rice bread noodle noodles soup chicken fish egg eggs meat satay pizza burger sandwich cake cookie chocolate ' +
    'candy fruit apple banana orange mango grape milk juice water tea vegetable vegetables salad sushi snack breakfast lunch dinner').split(' '),
  // olahraga & hobi
  ('sport sports football soccer basketball badminton volleyball tennis swimming swim running run cycling bike ' +
    'drawing draw painting paint singing sing dancing dance reading read cooking cook gaming games game music piano guitar').split(' '),
  // tempat & kendaraan
  ('home house school park beach mall market library museum zoo city town village hospital store shop ' +
    'car bus train bike bicycle plane airplane boat motorcycle walk').split(' '),
  // hewan
  'animal animals cat cats dog dogs bird fish rabbit lion elephant monkey giraffe tiger horse cow'.split(' '),
  // cuaca
  'weather sunny rainy rain cloudy windy hot cold warm cool snow'.split(' '),
  // pelajaran
  'math science art english history music subject subjects language languages'.split(' '),
  // pekerjaan & cita-cita
  ('job jobs work dream future doctor teacher pilot nurse chef cook police firefighter farmer engineer scientist ' +
    'artist singer driver athlete player astronaut programmer designer writer vet dentist').split(' '),
  // kegiatan santai / di rumah
  ('relax rest sleep nap watch tv movie movies video videos film play playing listen music read book books walk ' +
    'clean sweep wash help garden chat phone').split(' '),
  // alat sekolah & benda
  'pencil pen book bag backpack ruler eraser notebook sharpener crayon crayons bottle case lunchbox tablet laptop computer'.split(' '),
];

/** Bentuk dasar sederhana (bukan kamus): rains→rain, rainy→rain, playing→play. */
export function stem(word: string): string {
  let w = word.toLowerCase().replace(/[^a-z]/g, '');
  for (const suf of ['ing', 'ies', 'es', 'ed', 's', 'y']) {
    if (w.length > suf.length + 2 && w.endsWith(suf)) {
      w = w.slice(0, -suf.length);
      break;
    }
  }
  return w;
}

function words(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[’']/g, '')
    .split(/[^a-z]+/)
    .filter(Boolean);
}

/** Himpunan bentuk dasar kata yang dianggap "nyambung" utk 1 soal. */
export function relevantStems(question: string, answer: string): Set<string> {
  const out = new Set<string>();
  const all = [...words(question), ...words(answer)];
  for (const w of all) {
    if (!GENERIC.has(w)) out.add(stem(w));
  }
  for (const cls of CLASSES) {
    if (all.some((w) => cls.includes(w))) cls.forEach((c) => out.add(stem(c)));
  }
  return out;
}

export function isOnTopic(said: string, question: string, answer: string): boolean {
  const heard = words(said);
  const rel = relevantStems(question, answer);
  if (heard.some((w) => !GENERIC.has(w) && rel.has(stem(w)))) return true;
  // "What's your name?" → "I'm Dhafran" / "I am Dhafran" / "Call me …".
  if (/\bname\b/i.test(question) && /\b(i am|im|call me)\b/.test(heard.join(' ')) && heard.length >= 2) return true;
  return false;
}

/** Kata dari pertanyaan yang cocok dijadikan contoh petunjuk ("pakai kata 'name'"). */
export function hintWord(question: string): string | null {
  const w = words(question).find((x) => !GENERIC.has(x) && x.length > 2);
  return w ?? null;
}
