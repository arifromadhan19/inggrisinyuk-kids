// Cek bank soal Tantangan Raja (tes akhir level, `src/games/boss-bank.ts`,
// `materi/test_level.md`) — bagian `npm run build`. Di tiap level × skill:
// stok soal cukup utk jumlah soal tes, setiap soal pilihan punya TEPAT 1
// jawaban benar & tidak ada opsi kembar. Bundle asli via esbuild (pola sama
// verify-content-duplicates.mjs) + stub DOM minimal (speech.ts dll membaca
// `window` saat di-import).
import { build } from 'esbuild';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { unlink } from 'node:fs/promises';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const out = path.join(__dirname, '.verify-boss-bank-bundle.mjs');

globalThis.window = { speechSynthesis: { getVoices: () => [], cancel() {}, speak() {}, addEventListener() {} }, setTimeout, clearTimeout, addEventListener() {}, location: { hostname: 'x', search: '' } };
globalThis.localStorage = { getItem: () => null, setItem() {}, removeItem() {} };
globalThis.document = { addEventListener() {}, querySelector: () => null, createElement: () => ({ style: {}, setAttribute() {}, appendChild() {} }), body: { appendChild() {} }, documentElement: { dataset: {} } };
globalThis.SpeechSynthesisUtterance = function () {};

await build({ entryPoints: [path.join(__dirname, '../src/games/boss-bank.ts')], bundle: true, format: 'esm', platform: 'node', outfile: out, logLevel: 'silent' });
let m;
try {
  m = await import(`${out}?t=${Date.now()}`);
} finally {
  await unlink(out).catch(() => {});
}

const LEVELS = ['little-stars', 'starter', 'explorer', 'adventurer', 'achiever', 'trailblazer'];
const errors = [];
let checked = 0;
for (const lv of LEVELS) {
  for (const sk of m.ALL_SKILLS) {
    const need = m.questionCount(lv, sk);
    const seen = new Set();
    for (let k = 0; k < 40; k++) for (const id of m.pickIds(lv, sk, need)) seen.add(id);
    const one = m.pickIds(lv, sk, need).filter((id) => m.buildQuestion(lv, id));
    if (one.length < need) errors.push(`${lv}/${sk}: stok soal cuma ${one.length}, tes butuh ${need}.`);
    for (const id of seen) {
      const q = m.buildQuestion(lv, id);
      if (!q) continue;
      checked++;
      if (q.kind !== 'choice') continue;
      const oks = q.options.filter((o) => o.ok).length;
      const labels = q.options.map((o) => (o.label ?? o.emoji ?? o.html ?? '').toLowerCase());
      if (oks !== 1) errors.push(`${lv}/${sk} "${id}": ${oks} jawaban benar (wajib tepat 1).`);
      if (new Set(labels).size !== labels.length) errors.push(`${lv}/${sk} "${id}": ada opsi kembar (${labels.join(' | ')}).`);
      if (q.options.length < 2) errors.push(`${lv}/${sk} "${id}": opsi kurang dari 2.`);
      if (q.options.length % 2 === 1) errors.push(`${lv}/${sk} "${id}": jumlah opsi ganjil (${q.options.length}) — wajib genap 2/4/6.`);
    }
  }
}
if (errors.length) {
  console.error(`\n❌ Verifikasi bank soal Tantangan Raja GAGAL (${errors.length}):\n`);
  for (const e of errors.slice(0, 40)) console.error(`  - ${e}`);
  process.exit(1);
}
console.log(`✅ Verifikasi bank soal Tantangan Raja lolos — ${checked} soal (6 level × 5 skill) stok cukup, tepat 1 jawaban benar, tanpa opsi kembar, jumlah opsi genap.`);
