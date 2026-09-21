// Laporan (BUKAN bagian npm run build): seberapa banyak soal Tantangan Listening
// yang pilihan salahnya ikut disebut di audio ("distraktor lisan"), dan berapa
// yang disebut secara HALUS (penyangkalan/koreksi diri/lampau: not, but, was, …).
// Heuristik kata — angka pendekatan, dipakai utk menjaga target proporsi
// materi/pembeda_level.md (halus: Explorer 40%, Adventurer 50%, Achiever 60%,
// Trailblazer 70%). Jalankan: node scripts/report-listening-distractors.mjs
import { build } from 'esbuild';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { unlink } from 'node:fs/promises';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outfile = path.join(__dirname, '.report-distractors-bundle.mjs');
await build({ entryPoints: [path.join(__dirname, '../src/content.ts')], bundle: true, format: 'esm', platform: 'node', outfile, logLevel: 'silent' });
const mod = await import(`${outfile}?t=${Date.now()}`);
await unlink(outfile).catch(() => {});

const STOP = new Set(['the','a','an','her','his','my','of','in','to','for','on','at','with','from','after','before','is','it','and','by','near','behind','front','between','one','two','very','every','each','new','old','all','no','not','was','too','only','day','days','time','their','they','he','she','we','i','you','are','have','has','o','clock']);
const words = (s) => s.toLowerCase().replace(/[^a-z' ]/g, ' ').split(/\s+/).filter(Boolean);
const stem = (w) => w.replace(/(ing|es|ed|s)$/, '');
const core = (t) => words(t).filter((w) => !STOP.has(w)).map(stem);
const MARK = /\b(not|no|never|n't|but|instead|rather|although|however|actually|thought|think|thinks|used to|last (year|week|time)|before|was|were)\b|n’t/i;
const hit = (line, opt, ansCore) => { const aw = new Set(words(line).map(stem)); const c = core(opt).filter((w) => !ansCore.includes(w)); return c.length > 0 && c.some((w) => aw.has(w)); };
// `dialog` = true: penyangkalan boleh ada di giliran BERIKUTNYA (mis. "Do you use
// crayons?" → "No, I use paint."), bukan hanya di kalimat yang menyebut opsi.
function analyze(lines, wrongOpts, okText, dialog = false) {
  const ac = core(okText);
  let mention = false, halus = false;
  lines.forEach((l, i) => {
    for (const o of wrongOpts) {
      if (!hit(l, o, ac)) continue;
      mention = true;
      if (MARK.test(l) || (dialog && lines[i + 1] && MARK.test(lines[i + 1]))) halus = true;
    }
  });
  return { mention, halus };
}
const rows = { Explorer: [], Adventurer: [], Achiever: [], Trailblazer: [] };
for (const [n, arr] of [['Explorer', mod.LISTENING_TOPICS], ['Adventurer', mod.LISTENING_TOPICS_ADVENTURER]]) {
  arr.forEach((t) => { const ok = t.question.opts.find((o) => o.ok); rows[n].push(analyze(t.story, t.question.opts.filter((o) => !o.ok && o.lbl).map((o) => o.lbl), ok.lbl ?? '', !!t.storyVoices)); });
}
mod.LISTENING_TOPICS_ACHIEVER.forEach((t) => t.noteGaps.forEach((g) => rows.Achiever.push(analyze(t.notePassage.map((l) => l.en), g.options.filter((o) => o !== g.answer), g.answer, t.notePassage.every((p) => p.speaker)))));
mod.LISTENING_TOPICS_TRAILBLAZER.forEach((t) => t.inferenceQuestions.forEach((q) => { const ok = q.options.find((o) => o.ok); rows.Trailblazer.push(analyze(t.dialogueLines.map((l) => l.en), q.options.filter((o) => !o.ok).map((o) => o.text), ok.text, true)); }));
const pct = (a, b) => `${a}/${b} (${Math.round((100 * a) / b)}%)`;
for (const [n, r] of Object.entries(rows)) console.log(`${n.padEnd(12)} disebut di audio: ${pct(r.filter((x) => x.mention).length, r.length).padEnd(12)} halus: ${pct(r.filter((x) => x.halus).length, r.length)}`);

const dlg = (arr) => arr.filter((t) => t.storyVoices?.length).length;
console.log(`\nCerita dialog 2 suara — Explorer ${dlg(mod.LISTENING_TOPICS)}/10, Adventurer ${dlg(mod.LISTENING_TOPICS_ADVENTURER)}/10, Achiever ${mod.LISTENING_TOPICS_ACHIEVER.filter((t) => t.notePassage.every((p) => p.speaker)).length}/10 catatan, Trailblazer ${mod.LISTENING_TOPICS_TRAILBLAZER.length}/10 dialog`);
const three = (arr) => arr.filter((t) => t.question.opts.length >= 3).length;
console.log(`Soal akhir dgn ≥3 opsi authored — Explorer ${three(mod.LISTENING_TOPICS)}/10, Adventurer ${three(mod.LISTENING_TOPICS_ADVENTURER)}/10`);
const dec = (arr) => arr.filter((t) => t.question.decoys?.length).length;
console.log(`Topik dgn kandidat jebakan acak — Explorer ${dec(mod.LISTENING_TOPICS)}/10, Adventurer ${dec(mod.LISTENING_TOPICS_ADVENTURER)}/10, Achiever gap ${mod.LISTENING_TOPICS_ACHIEVER.flatMap((t) => t.noteGaps).filter((g) => g.decoys?.length).length}/${mod.LISTENING_TOPICS_ACHIEVER.flatMap((t) => t.noteGaps).length}`);
