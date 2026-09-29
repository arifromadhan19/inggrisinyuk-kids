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
  "👵::grandma's house", // Grammar Starter `pergi-tidak-pergi` — rumah nenek
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

  // Speaking juga menampilkan emoji makhluk hidup (hewan/keluarga/orang) —
  // denylist yang SAMA berlaku (CLAUDE.md "Emoji Hewan/Makhluk Hidup WAJIB
  // Kepala SAJA"), supaya aturan ini tidak cuma terjaga di Vocab.
  const { SPEAKING_TOPICS_BY_LEVEL } = mod;
  for (const [level, topics] of Object.entries(SPEAKING_TOPICS_BY_LEVEL ?? {})) {
    for (const topic of topics) {
      const checks = [];
      for (const it of topic.items ?? []) checks.push([it.en, it.emoji], [it.en, it.phrase?.emoji]);
      for (const st of topic.stories ?? []) checks.push([st.answer?.en ?? '', st.emoji]);
      for (const l of [...(topic.model ?? []), ...(topic.drill ?? [])]) checks.push([l.en ?? '', l.emoji]);
      for (const r of topic.roleplay ?? []) {
        checks.push([r.q?.en ?? '', r.emoji], [r.answer?.en ?? '', r.answer?.emoji]);
        for (const c of r.choices ?? []) checks.push([c.en ?? '', c.emoji]);
      }
      for (const t of topic.turns ?? []) {
        checks.push([t.question?.en ?? '', t.emoji]);
        for (const c of t.choices ?? []) checks.push([c.en ?? '', c.emoji]);
      }
      for (const [word, val] of checks) {
        const key = word.trim().toLowerCase();
        if (val && PROBLEMATIC_EMOJI.has(val) && !ALLOWED_EMOJI_WORD_EXCEPTIONS.has(`${val}::${key}`)) {
          errors.push(`Speaking "${topic.id}" (${level}) "${word}" (emoji="${val}"): ${PROBLEMATIC_EMOJI.get(val)}.`);
        }
      }
    }
  }

  // Grammar: emoji makhluk hidup juga ikut denylist (Kenalan & kartu kontras).
  for (const [level, topics] of Object.entries(mod.GRAMMAR_TOPICS_BY_LEVEL ?? {})) {
    for (const topic of topics) {
      const checks = [];
      for (const s of topic.sentences ?? []) checks.push([s.en, s.emoji]);
      for (const it of topic.items ?? []) checks.push([it.en, it.emoji]);
      for (const tr of topic.transforms ?? []) checks.push([tr.original, tr.emoji]);
      for (const [word, val] of checks) {
        const key = word.trim().toLowerCase();
        if (val && PROBLEMATIC_EMOJI.has(val) && !ALLOWED_EMOJI_WORD_EXCEPTIONS.has(`${val}::${key}`)) {
          errors.push(`Grammar "${topic.id}" (${level}) "${word}" (emoji="${val}"): ${PROBLEMATIC_EMOJI.get(val)}.`);
        }
      }
    }
  }

  // Reading "Baca Teks": emoji makhluk hidup (gambar halaman buku, opsi soal
  // gambar, gambar ✅/❌) ikut denylist yang sama. Kata acuan = kata bukti /
  // label gambar, supaya pengecualian gender-spesifik (grandma) tetap berlaku.
  for (const [level, topics] of Object.entries(mod.READING_TOPICS_BY_LEVEL ?? {})) {
    for (const topic of topics) {
      const checks = [];
      for (const x of [...(topic.texts ?? []), ...(topic.newTexts ?? [])]) {
        // Opsi soal gambar = gambar halaman lain di buku yang sama, jadi cukup
        // cek `pictures` (label = kata halamannya sendiri).
        for (const p of x.pictures ?? []) checks.push([p.label, p.emoji]);
        for (const q of x.questions ?? []) if (q.kind === 'truefalse') checks.push([q.q, q.picture]);
      }
      for (const [word, val] of checks) {
        const keys = [(word ?? '').trim().toLowerCase(), ...(word ?? '').toLowerCase().split(/[^a-z']+/)];
        for (const e of PROBLEMATIC_EMOJI.keys()) {
          if (val && val.includes(e) && !keys.some((k) => ALLOWED_EMOJI_WORD_EXCEPTIONS.has(`${e}::${k}`))) {
            errors.push(`Reading "${topic.id}" (${level}) "${word}" (emoji="${val}"): ${PROBLEMATIC_EMOJI.get(e)}.`);
          }
        }
      }
    }
  }

  // Judul topik WAJIB "Indonesia (English)", mis. "Hari di Kalender (Days on
  // the Calendar)" — aturan CLAUDE.md, dicek di Vocab/Listening/Speaking/Grammar/Reading.
  const TITLE_RE = /^[^()]+ \([^()]+\)$/;
  for (const [skill, byLevel] of [['Vocab', VOCAB_TOPICS_BY_LEVEL], ['Listening', mod.LISTENING_TOPICS_BY_LEVEL], ['Speaking', mod.SPEAKING_TOPICS_BY_LEVEL], ['Grammar', mod.GRAMMAR_TOPICS_BY_LEVEL], ['Reading', mod.READING_TOPICS_BY_LEVEL]]) {
    for (const [level, topics] of Object.entries(byLevel ?? {})) {
      for (const topic of topics) {
        if (!TITLE_RE.test(topic.title ?? '')) {
          errors.push(`${skill} "${topic.id}" (${level}): judul "${topic.title}" belum format "Indonesia (English)".`);
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

  // Raja Kata (Word Quest, `src/games/wordmatch-data.ts`) — bank kata game
  // juga menampilkan emoji makhluk hidup, jadi denylist yang SAMA berlaku.
  // Legendaris (mode petunjuk) wajib py clue+clueId & clue tidak boleh
  // memuat katanya sendiri (bocor jawaban, CLAUDE.md "Soal Tidak Boleh Bisa
  // Ditebak").
  const wmOut = path.join(__dirname, '.verify-wordmatch-bundle.mjs');
  await build({ entryPoints: [path.join(__dirname, '../src/games/wordmatch-data.ts')], bundle: true, format: 'esm', platform: 'node', outfile: wmOut, logLevel: 'silent' });
  let wm;
  try {
    wm = await import(`${wmOut}?t=${Date.now()}`);
  } finally {
    await unlink(wmOut).catch(() => {});
  }
  for (const [tier, bank] of Object.entries(wm.RANDOM_BANK)) {
    for (const e of bank) {
      const key = e.en.trim().toLowerCase();
      if (PROBLEMATIC_EMOJI.has(e.emoji) && !ALLOWED_EMOJI_WORD_EXCEPTIONS.has(`${e.emoji}::${key}`)) {
        errors.push(`Word Quest (${tier}) kata "${e.en}" (emoji="${e.emoji}"): ${PROBLEMATIC_EMOJI.get(e.emoji)}.`);
      }
      if (wm.TIER_CONFIG[tier].mode === 'clue') {
        if (!e.clue || !e.clueId) errors.push(`Word Quest (${tier}) kata "${e.en}" belum py clue/clueId.`);
        else if (new RegExp(`\\b${escapeRegExp(e.en)}`, 'i').test(e.clue)) errors.push(`Word Quest (${tier}) clue "${e.clue}" memuat katanya sendiri "${e.en}" (bocor jawaban).`);
      }
    }
  }

  // Sentence Puzzle (`src/games/sentencepuzzle-data.ts`) — bank kalimat per
  // markas: arti Indonesia wajib, tanpa koma di tengah (gelembung = kata),
  // jumlah kata sesuai tier, pengecoh `wrong` tepat 2 & tidak ada di
  // kalimat, `alt` = kata yang sama persis, kalimat tidak kembar antar markas.
  const spOut = path.join(__dirname, '.verify-sentencepuzzle-bundle.mjs');
  await build({ entryPoints: [path.join(__dirname, '../src/games/sentencepuzzle-data.ts')], bundle: true, format: 'esm', platform: 'node', outfile: spOut, logLevel: 'silent' });
  let sp;
  try {
    sp = await import(`${spOut}?t=${Date.now()}`);
  } finally {
    await unlink(spOut).catch(() => {});
  }
  const spSeen = new Map();
  const spKeys = (s) => sp.tokenize(s).map((w) => w.toLowerCase());
  for (const [tier, bank] of Object.entries(sp.SENTENCE_BANK)) {
    const cfg = sp.TIER_CONFIG[tier];
    if (bank.length < 8) errors.push(`Sentence Puzzle (${tier}) cuma ${bank.length} kalimat — minimal 8 supaya 5 kalimat/markas tetap bervariasi.`);
    for (const s of bank) {
      const tag = `Sentence Puzzle (${tier}) "${s.en}"`;
      const words = spKeys(s.en);
      if (!s.id) errors.push(`${tag} belum py arti Indonesia (id).`);
      if (/,/.test(s.en)) errors.push(`${tag} memuat koma — gelembung dipecah per spasi, koma ikut nempel ke kata.`);
      if (words.length < cfg.minWords || words.length > cfg.maxWords) errors.push(`${tag} ${words.length} kata, tier ini ${cfg.minWords}–${cfg.maxWords}.`);
      if (cfg.distractor === 'wrong') {
        const wrong = (s.wrong ?? []).map((w) => w.toLowerCase());
        if (wrong.length !== 2 || new Set(wrong).size !== 2) errors.push(`${tag} wajib py tepat 2 \`wrong\` yang berbeda.`);
        for (const w of wrong) if (words.includes(w)) errors.push(`${tag} \`wrong\` "${w}" ada di kalimatnya sendiri.`);
      }
      for (const a of s.alt ?? []) {
        if ([...spKeys(a)].sort().join(' ') !== [...words].sort().join(' ')) errors.push(`${tag} alt "${a}" kata-katanya tidak sama persis dgn kalimat utama.`);
      }
      const norm = words.join(' ');
      if (spSeen.has(norm)) errors.push(`${tag} kembar dgn kalimat di markas ${spSeen.get(norm)}.`);
      else spSeen.set(norm, tier);
    }
  }

  // Memory Hunt (`src/games/memorymatch-data.ts`) — denylist emoji makhluk
  // hidup, TANPA kognat ID≈EN (kartu "Bus" ↔ "Bus" bisa dicocokkan dari ejaan
  // saja), kata & emoji tidak kembar di seluruh bank, bank cukup untuk
  // BOARD_COUNT papan tanpa kata yang sama terus.
  const mmOut = path.join(__dirname, '.verify-memorymatch-bundle.mjs');
  await build({ entryPoints: [path.join(__dirname, '../src/games/memorymatch-data.ts')], bundle: true, format: 'esm', platform: 'node', outfile: mmOut, logLevel: 'silent' });
  let mm;
  try {
    mm = await import(`${mmOut}?t=${Date.now()}`);
  } finally {
    await unlink(mmOut).catch(() => {});
  }
  const lev = (a, b) => {
    const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
    for (let j = 1; j <= b.length; j++) d[0][j] = j;
    for (let i = 1; i <= a.length; i++)
      for (let j = 1; j <= b.length; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    return d[a.length][b.length];
  };
  const mmWords = new Map();
  const mmEmoji = new Map();
  const mmSeen = (key, tier, tag) => {
    if (mmWords.has(key)) errors.push(`${tag} kembar dgn markas ${mmWords.get(key)}.`);
    else mmWords.set(key, tier);
  };
  const mmBankSize = (tier, n) => {
    const pairs = mm.TIER_CONFIG[tier].pairCount;
    if (n < pairs * 2) errors.push(`Memory Hunt (${tier}) bank cuma ${n} pasangan — minimal ${pairs * 2} (2 papan tanpa ulang).`);
  };
  // Gambar ↔ kata (Pemanasan/Mudah), kata ID ↔ EN (Sedang), bunyi ↔ tulisan
  // (Sulit): denylist emoji, TANPA kognat, kata & emoji tidak kembar.
  const wordBanks = [...Object.entries(mm.PICTURE_BANK), ['sedang', mm.TRANSLATE_BANK], ['sulit', mm.SOUND_BANK]];
  for (const [tier, bank] of wordBanks) {
    mmBankSize(tier, bank.length);
    for (const e of bank) {
      const key = e.en.trim().toLowerCase();
      const tag = `Memory Hunt (${tier}) "${e.en}"`;
      if (PROBLEMATIC_EMOJI.has(e.emoji) && !ALLOWED_EMOJI_WORD_EXCEPTIONS.has(`${e.emoji}::${key}`)) errors.push(`${tag} (emoji="${e.emoji}"): ${PROBLEMATIC_EMOJI.get(e.emoji)}.`);
      const idKey = e.id.trim().toLowerCase();
      const sim = 1 - lev(idKey, key) / Math.max(idKey.length, key.length);
      if (sim >= 0.6) errors.push(`${tag} kognat dgn "${e.id}" (kemiripan ${sim.toFixed(2)}) — bisa dicocokkan dari ejaan saja.`);
      mmSeen(key, tier, tag);
      if (mmEmoji.has(e.emoji)) errors.push(`${tag} emoji ${e.emoji} sudah dipakai "${mmEmoji.get(e.emoji)}".`);
      else mmEmoji.set(e.emoji, e.en);
    }
  }
  // Lawan kata (Jago): tiap kata cuma di 1 pasangan, arti wajib.
  mmBankSize('jago', mm.OPPOSITE_BANK.length);
  for (const p of mm.OPPOSITE_BANK) {
    const tag = `Memory Hunt (jago) "${p.a}/${p.b}"`;
    if (!p.aId || !p.bId) errors.push(`${tag} belum py arti Indonesia.`);
    for (const w of [p.a, p.b]) mmSeen(w.trim().toLowerCase(), 'jago', tag);
  }
  // Kalimat rumpang (Legendaris): `___` tepat 1x (EN & ID), tidak memuat
  // jawabannya, tanpa "a/an ___" (kata sandang bocorkan jawaban).
  mmBankSize('legendaris', mm.GAP_BANK.length);
  for (const g of mm.GAP_BANK) {
    const tag = `Memory Hunt (legendaris) "${g.sentence}"`;
    if ((g.sentence.match(/___/g) ?? []).length !== 1) errors.push(`${tag} wajib py tepat 1 "___".`);
    if ((g.sentenceId.match(/___/g) ?? []).length !== 1) errors.push(`${tag} arti Indonesia wajib py tepat 1 "___" (jangan bocorkan jawaban lewat 💡 Arti).`);
    if (g.sentence.toLowerCase().includes(g.answer.toLowerCase())) errors.push(`${tag} memuat jawabannya "${g.answer}".`);
    if (/\ban? ___/i.test(g.sentence)) errors.push(`${tag} "a/an ___" membocorkan jawaban lewat kata sandang — pakai "my/the".`);
    mmSeen(g.answer.trim().toLowerCase(), 'legendaris', tag);
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
