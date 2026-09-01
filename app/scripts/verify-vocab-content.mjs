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
// Aturan yang dicek (persis 3 aturan yang sudah didokumentasikan
// materi/vocab.md §7, CLAUDE.md "Format Wajib Materi Vocabulary"):
//   1. Semua id topik Vocab unik LINTAS SEMUA level (progress key TIDAK
//      di-namespace per level — id topik yang sama di 2 level akan
//      menimpa/menukar progres, lihat progress.ts).
//   2. Tiap topik minimal 10 kata (CLAUDE.md target kelengkapan konten).
//   3. `item.example.en` WAJIB memuat `item.en` sbg whole word (case-
//      insensitive) — syarat teknis `blankSentence()` (games/vocabulary.ts)
//      supaya soal "Lengkapi Kalimat" bisa nge-blank kata targetnya.

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
      }
    }
  }

  if (errors.length > 0) {
    console.error(`\n❌ Verifikasi konten Vocab GAGAL (${errors.length} masalah):\n`);
    for (const e of errors) console.error(`  - ${e}`);
    console.error('');
    process.exit(1);
  }

  const totalTopics = [...seenTopicIds.keys()].length;
  console.log(`✅ Verifikasi konten Vocab lolos — ${totalTopics} topik, semua id unik, semua ≥10 kata, semua example.en cocok whole-word.`);
}

main().catch((err) => {
  console.error('❌ verify-vocab-content: error tak terduga:', err);
  process.exit(1);
});
