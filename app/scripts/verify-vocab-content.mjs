// Verifikasi otomatis konten Vocabulary (`content.ts`) — permintaan user
// (feedback #3 "verifikasi konten masih manual, rawan kelewat"): sebelum ini
// tiap sesi authoring topik baru cuma dicek lewat skrip sementara yang
// ditulis ulang manual & TIDAK disimpan ke repo (lihat materi/vocab.md §7),
// jadi kalau lupa dijalankan, bug bisa lolos diam-diam — persis yang terjadi
// dgn item "Twin" (Starter) yang butuh 1 sesi penuh utk ketemu.
//
// Skrip ini di-bundle pakai esbuild (bukan `tsc`/`ts-node`) supaya bisa
// `import` array TypeScript asli dari `content.ts` apa adanya (bukan
// re-parse teks via regex/eval seperti audit ad-hoc sebelumnya — rawan salah
// kalau bentuk objeknya berubah), lalu dijalankan sbg langkah `npm run build`
// biasa (lihat package.json) — jadi TIDAK PERNAH lagi bisa lolos tanpa
// disadari selama developer menjalankan build normal.
//
// Aturan yang dicek (3 aturan lama sudah didokumentasikan materi/vocab.md
// §7, CLAUDE.md "Format Wajib Materi Vocabulary"; aturan #4 baru ditambah
// menyusul audit user "topik lain yang terlihat sama di mata user" —
// ketemu `item.en` "Teacher" identik dobel di Starter `di-sekolah` DAN
// Adventurer `pekerjaan` (kata sama, translasi "Guru" sama, emoji sama),
// PADAHAL fix persis ini sudah pernah dicatat sebelumnya (materi/vocab.md,
// "Teacher → Coach") tapi diam-diam regresi tertimpa sesi authoring
// berikutnya yang tidak sadar — pola manual/dokumentasi-based ternyata
// tidak cukup, butuh cek otomatis spt 3 aturan lain di atas):
//   1. Semua id topik Vocab unik LINTAS SEMUA level (progress key TIDAK
//      di-namespace per level — id topik yang sama di 2 level akan
//      menimpa/menukar progres, lihat progress.ts).
//   2. Tiap topik minimal 10 kata (CLAUDE.md target kelengkapan konten).
//   3. `item.example.en` WAJIB memuat `item.en` sbg whole word (case-
//      insensitive) — syarat teknis `blankSentence()` (games/vocabulary.ts)
//      supaya soal "Lengkapi Kalimat" bisa nge-blank kata targetnya.
//   4. `item.en` (case-insensitive) TIDAK BOLEH dipakai dobel di topik yang
//      BEDA, KECUALI ada di ACCEPTED_CROSS_TOPIC_DUPLICATES di bawah —
//      allowlist ini isinya kata yang SUDAH diaudit manual & sengaja
//      dibiarkan (homonim beda makna spt "Orange" warna/buah, atau translasi
//      yang sudah dibedakan spt "Car" Mobil-mobilan/Mobil, atau jarak level
//      yang jauh spt Starter↔Trailblazer) — kata BARU yang kebetulan tabrakan
//      HARUS diganti kata lain dulu, bukan ditambah ke allowlist tanpa
//      dicek levelnya/maknanya beda genuinely seperti entri yang sudah ada.
//   5. `item.emoji`/`example.emoji` TIDAK BOLEH salah satu dari
//      PROBLEMATIC_EMOJI di bawah, KECUALI dipakai utk kata di
//      ALLOWED_EMOJI_WORD_EXCEPTIONS — permintaan user langsung ("bagaimana
//      selalu paham aturan tidak boleh menampilkan seluruh tubuh... tapi
//      selalu lupa") menyusul RANGKAIAN temuan manual sesi ini yang semua
//      manusiawi lolos dari audit sebelumnya (giraffe badan penuh walau
//      resmi "face", dove badan penuh, orang tua dipaksa gender tanpa
//      alasan, komponen rambut berdiri sendiri, dst — lihat entri di bawah).
//      Cek ini TIDAK BISA 100% otomatis (butuh judgment visual manusia utk
//      kasus baru), tapi MENCEGAH REGRESI persis kasus yang sudah pernah
//      ditemukan & diperbaiki — kalau nambah kata baru yang PAKAI emoji
//      makhluk hidup (hewan ATAU orang), WAJIB cek dulu manual (nama resmi
//      Unicode via `python3 -c "import unicodedata; print(unicodedata.name('🦒'))"`
//      TIDAK CUKUP sendirian — giraffe resmi "face" tapi tetap kelihatan
//      badan penuh krn lehernya panjang, jadi validasi nama resmi HARUS
//      dibarengi mikir "kalau di-crop cuma kepala, apa konsepnya masih
//      kebaca/masih ada gunanya?" — kalau jawabannya tidak (mis. "tinggi"
//      butuh leher/badan buat kelihatan tinggi), GANTI KATA bukan cari hewan
//      lain, krn masalahnya bukan di hewannya tapi di KONSEPnya.

import { build } from 'esbuild';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { unlink } from 'node:fs/promises';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const entry = path.join(__dirname, '../src/content.ts');
const outfile = path.join(__dirname, '.verify-content-bundle.mjs');

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Kata (lowercase) yang SUDAH diaudit manual & sengaja dibiarkan dobel
// lintas topik — lihat rationale masing-masing. Jangan tambah entri baru ke
// sini tanpa audit setara (level jauh / makna genuinely beda / translasi
// sudah dibedakan) — kalau tidak yakin, ganti kata itu, jangan allowlist.
const ACCEPTED_CROSS_TOPIC_DUPLICATES = new Map([
  ['orange', 'homonim beda makna: warna (Little Stars kenal-warna) vs buah (Little Stars buah-buahan)'],
  ['star', 'homonim beda makna: bentuk bintang (Little Stars bentuk) vs benda langit (Starter alam-sekitar)'],
  ['mouse', 'homonim beda makna: hewan (Little Stars hewan-peliharaan) vs perangkat komputer (Achiever teknologi-internet), jarak level jauh'],
  ['car', 'translasi sudah dibedakan: "Mobil-mobilan" (mainan, Little Stars mainan) vs "Mobil" (kendaraan asli, Little Stars kendaraan)'],
  ['library', 'jarak level jauh & konteks beda: tempat di sekolah (Starter di-sekolah) vs kehidupan akademik (Trailblazer pendidikan-akademik)'],
  ['ticket', 'jarak level jauh & konteks beda: jalan-jalan santai (Explorer keluarga) vs perjalanan wisata (Trailblazer perjalanan-wisata)'],
  ['nose', 'residual dari audit redundansi Body Parts (Little Stars tubuhku vs Adventurer anggota-tubuh) — TIDAK ada emoji pengganti yang genuinely relevan utk kata anggota tubuh lain, lihat CLAUDE.md'],
  ['mouth', 'residual dari audit redundansi Body Parts (Little Stars tubuhku vs Adventurer anggota-tubuh) — sama alasan dgn "nose"'],
]);
// 'lion' SEMPAT di allowlist ini (Little Stars hewan-peliharaan vs Adventurer
// binatang) — dihapus krn Adventurer binatang sudah diganti total jadi
// alat-musik (topik hewan itu sudah tidak ada), jadi "Lion" sekarang UNIK
// lagi di Vocab. Kalau collision serupa muncul lagi nanti, audit ulang dulu
// alasannya SEBELUM nambah balik ke allowlist — jangan asumsikan alasan lama
// masih berlaku.

// Emoji makhluk hidup (hewan/orang) yang SUDAH terbukti bermasalah — badan
// penuh (bukan kepala/wajah saja), gender dipaksa tanpa alasan, atau
// komponen Unicode yang tidak dimaksud berdiri sendiri. Ditemukan manual
// sesi demi sesi (rawan lolos lagi tanpa cek ini, persis kasus "Teacher"
// aturan #4) — kalau nambah/edit kata yang pakai emoji SEJENIS (makhluk
// hidup) & TERNYATA baru & bermasalah, tambahkan ke sini juga supaya tidak
// pernah lolos lagi, bukan cuma diperbaiki sekali lalu dilupakan.
const PROBLEMATIC_EMOJI = new Map([
  ['🦒', 'Giraffe — resmi "face" tapi tetap kelihatan badan penuh krn lehernya panjang (konsepnya "tinggi" butuh leher kelihatan)'],
  ['🕊️', 'Dove — badan penuh (burung terbang), bukan kepala/wajah saja'],
  ['👴', 'Older Man — gender dipaksa tanpa opsi netral (kecuali kata itu MEMANG gender-spesifik, mis. Grandpa)'],
  ['👵', 'Older Woman — sama alasan dgn Older Man (kecuali mis. Grandma)'],
  ['🦱', 'komponen "curly hair" — tidak dimaksud berdiri sendiri, pakai kombinasi 🧑‍🦱'],
  ['🦰', 'komponen "red hair" — tidak dimaksud berdiri sendiri, pakai kombinasi 🧑‍🦰'],
  ['🦳', 'komponen "white hair" — tidak dimaksud berdiri sendiri, pakai kombinasi 🧑‍🦳'],
  ['🦲', 'komponen "bald" — tidak dimaksud berdiri sendiri, pakai kombinasi 🧑‍🦲'],
  ['🐒', 'Monkey (badan) — pakai 🐵 Monkey Face'],
  ['🐘', 'Elephant — tidak py varian kepala saja di Unicode'],
  ['🐧', 'Penguin — tidak py varian kepala saja di Unicode'],
  ['🦘', 'Kangaroo — tidak py varian kepala saja di Unicode'],
  ['🐦', 'Bird — tidak py varian kepala saja di Unicode'],
  ['🧗', 'Person Climbing — badan penuh'],
  ['🤾', 'Handball — badan penuh, jg sport spesifik bukan aksi generik'],
  ['🤸', 'Person Doing Cartwheel — badan penuh, SERING salah dipakai utk "Jump" padahal ini cartwheel bukan lompat'],
  ['🤲', 'Palms Up Together — kelihatan spt gestur berdoa, bukan menangkap/menerima (kecuali kata itu MEMANG "Pray")'],
  ['💃', 'Dancer — gender dipaksa (perempuan), tidak ada versi netral utk kata "dancing" generik'],
  ['🕺', 'Man Dancing — gender dipaksa (laki-laki), sama alasan dgn Dancer'],
  ['🦆', 'Duck — tidak py varian kepala saja di Unicode'],
  ['🐑', 'Sheep — tidak py varian kepala saja di Unicode'],
  ['🐟', 'Fish — tidak py varian kepala saja di Unicode'],
]);

// (emoji, kata en lowercase) yang SENGAJA dikecualikan dari PROBLEMATIC_EMOJI
// krn kata itu SENDIRI genuinely gender-spesifik/konsepnya emang itu (bukan
// dipaksakan ke konsep netral) — lihat alasan tiap baris PROBLEMATIC_EMOJI.
const ALLOWED_EMOJI_WORD_EXCEPTIONS = new Set([
  '🤲::pray',
  '👴::grandpa',
  '👴::grandfather',
  '👵::grandma',
  '👵::grandmother',
]);

async function main() {
  await build({
    entryPoints: [entry],
    bundle: true,
    format: 'esm',
    platform: 'node',
    outfile,
    logLevel: 'silent',
  });

  let mod;
  try {
    mod = await import(`${outfile}?t=${Date.now()}`);
  } finally {
    await unlink(outfile).catch(() => {});
  }

  const { VOCAB_TOPICS_BY_LEVEL } = mod;
  if (!VOCAB_TOPICS_BY_LEVEL) {
    console.error('❌ verify-vocab-content: VOCAB_TOPICS_BY_LEVEL tidak ditemukan di content.ts — cek nama export.');
    process.exit(1);
  }

  const errors = [];
  const seenTopicIds = new Map(); // id -> level yang pertama pakai
  const wordOccurrences = new Map(); // en lowercase -> [{level, topicId, original}]

  for (const [level, topics] of Object.entries(VOCAB_TOPICS_BY_LEVEL)) {
    for (const topic of topics) {
      const firstLevel = seenTopicIds.get(topic.id);
      if (firstLevel) {
        errors.push(`Id topik "${topic.id}" dipakai dobel: level "${firstLevel}" dan "${level}" (progress bisa ketimpa/ketuker).`);
      } else {
        seenTopicIds.set(topic.id, level);
      }

      if (!Array.isArray(topic.items) || topic.items.length < 10) {
        errors.push(`Topik "${topic.id}" (${level}) cuma ${topic.items?.length ?? 0} kata (target minimal 10).`);
      }

      for (const item of topic.items ?? []) {
        const example = item.example?.en ?? '';
        const re = new RegExp(`\\b${escapeRegExp(item.en)}\\b`, 'i');
        if (!re.test(example)) {
          errors.push(
            `Topik "${topic.id}" (${level}) kata "${item.en}": example.en "${example}" tidak memuat kata itu sbg whole word — blankSentence() akan diam-diam gagal nge-blank.`
          );
        }

        const key = item.en.trim().toLowerCase();
        if (!wordOccurrences.has(key)) wordOccurrences.set(key, []);
        wordOccurrences.get(key).push({ level, topicId: topic.id, original: item.en });

        for (const [field, val] of [['emoji', item.emoji], ['example.emoji', item.example?.emoji]]) {
          if (val && PROBLEMATIC_EMOJI.has(val) && !ALLOWED_EMOJI_WORD_EXCEPTIONS.has(`${val}::${key}`)) {
            errors.push(
              `Topik "${topic.id}" (${level}) kata "${item.en}" (${field}="${val}"): ${PROBLEMATIC_EMOJI.get(val)}. Cari emoji lain yang genuinely relevan, atau ganti kata itu sendiri kalau tidak ada opsi bagus.`
            );
          }
        }
      }
    }
  }

  for (const [word, occurrences] of wordOccurrences.entries()) {
    const uniqueTopics = [...new Set(occurrences.map((o) => `${o.level}:${o.topicId}`))];
    if (uniqueTopics.length > 1 && !ACCEPTED_CROSS_TOPIC_DUPLICATES.has(word)) {
      errors.push(
        `Kata "${occurrences[0].original}" dipakai dobel di ${uniqueTopics.length} topik berbeda (${uniqueTopics.join(', ')}) — anak bisa lihat kata identik 2x, terasa diulang. Ganti salah satu jadi kata lain, atau kalau ini genuinely homonim beda makna/level jauh, tambahkan ke ACCEPTED_CROSS_TOPIC_DUPLICATES dgn alasan eksplisit.`
      );
    }
  }

  if (errors.length > 0) {
    console.error(`\n❌ Verifikasi konten Vocab GAGAL (${errors.length} masalah):\n`);
    for (const e of errors) console.error(`  - ${e}`);
    console.error('');
    process.exit(1);
  }

  const totalTopics = [...seenTopicIds.keys()].length;
  console.log(`✅ Verifikasi konten Vocab lolos — ${totalTopics} topik, semua id unik, semua ≥10 kata, semua example.en cocok whole-word, tidak ada kata dobel lintas topik yang belum diaudit, tidak ada emoji makhluk hidup bermasalah yang belum diaudit.`);
}

main().catch((err) => {
  console.error('❌ verify-vocab-content: error tak terduga:', err);
  process.exit(1);
});
