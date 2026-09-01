// Verifikasi otomatis: kalimat soal TIDAK BOLEH 100% sama (duplicate) antar
// tahap (Kenalan/Latihan Inti/Tantangan) DALAM 1 topik yang sama — permintaan
// user setelah menemukan Listening Explorer topik "kebun-binatang" py kalimat
// drill Latihan Inti "The turtle is slow." yang diulang PERSIS SAMA sbg salah
// satu baris `story` di Tantangan (CLAUDE.md "🔒 Aturan Wajib: Kalimat Soal...
// Tidak Boleh 100% Sama").
//
// Scope: 4 format LAMA (`ListeningTopic`/`ReadingTopic`/`SpeakingTopic`/
// `GrammarTopic`) yang py risiko struktural ini — masing² py beberapa ARRAY
// sibling (primer/drill/story/question, model/drill/roleplay,
// examples/scramble/fill) yang DIAUTHOR TERPISAH dalam 1 topik yang sama,
// jadi rawan authoring tidak sadar menulis ulang kalimat yang persis sama —
// PLUS `SpeakingStoryTopic` (format KEEMPAT Speaking, `checkSpeakingStoryDuplicates`
// di bawah) yang py risiko SERUPA tapi di level per-CERITA, bukan per-topik
// (`story.lines` vs `story.answer` diauthor terpisah dalam 1 cerita). Format
// `items`/`turns`-based lain (Vocab & sisa format BARU Listening/Reading/
// Grammar/Speaking) TIDAK py risiko yang sama secara struktural — 1 kalimat
// cuma DITULIS SEKALI di data (item.en/example.en/dst), lalu DIPAKAI ULANG
// oleh KODE lintas Kenalan/Latihan Inti/Tantangan (bukan diulang di DATA) —
// jadi di luar scope skrip ini.
//
// Sama pola dgn verify-vocab-content.mjs — di-bundle esbuild supaya bisa
// `import` array TypeScript asli apa adanya, dijalankan sbg bagian `npm run
// build` biasa (lihat package.json) supaya tidak bisa lolos diam-diam lagi.

import { build } from 'esbuild';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { unlink } from 'node:fs/promises';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const entry = path.join(__dirname, '../src/content.ts');
const outfile = path.join(__dirname, '.verify-duplicates-bundle.mjs');

function norm(s) {
  // Strip terminal/internal punctuation juga (bukan cuma whitespace/case) —
  // tanpa ini, "I played football yesterday." (examples, py titik) vs
  // "I played football yesterday" (scramble, hasil join target words TANPA
  // tanda baca) dianggap 2 string BEDA & lolos padahal isinya kalimat yang
  // SAMA PERSIS — bug nyata yang sempat bikin skrip ini false-negative utk
  // SELURUH pola "scramble merekonstruksi examples" (ditemukan lewat audit
  // manual, `materi/grammar.md` §23).
  return s
    .trim()
    .toLowerCase()
    .replace(/[.,!?;:'"]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Cuma kalimat (≥2 kata) yang dicek — kata/label tunggal (mis. lbl opsi
// jawaban "Cheetah") boleh & memang WAJAR diulang lintas soal berbeda.
function isSentenceLike(s) {
  return typeof s === 'string' && s.trim().includes(' ');
}

/** Kumpulkan {phase, text} dari 1 topik `ListeningTopic` (format LAMA). */
function stimuliListening(topic) {
  const out = [];
  for (const p of topic.primer ?? []) out.push({ phase: 'primer', text: p.en });
  for (const d of topic.drill ?? []) out.push({ phase: 'drill', text: d.en });
  for (const line of topic.story ?? []) out.push({ phase: 'story', text: line });
  if (topic.question?.en) out.push({ phase: 'question', text: topic.question.en });
  return out;
}

/** Kumpulkan {phase, text} dari 1 topik `ReadingTopic` (format LAMA). */
function stimuliReading(topic) {
  const out = [];
  for (const p of topic.primer ?? []) for (const line of p.passage ?? []) out.push({ phase: 'primer', text: line });
  for (const d of topic.drill ?? []) {
    for (const line of d.passage ?? []) out.push({ phase: 'drill', text: line });
    if (d.question) out.push({ phase: 'drill-question', text: d.question });
  }
  for (const line of topic.story ?? []) out.push({ phase: 'story', text: line });
  if (topic.question?.text) out.push({ phase: 'question', text: topic.question.text });
  return out;
}

/** Kumpulkan {phase, text} dari 1 topik `SpeakingTopic` (format LAMA). */
function stimuliSpeaking(topic) {
  const out = [];
  for (const line of topic.model ?? []) out.push({ phase: 'model', text: line });
  for (const line of topic.drill ?? []) out.push({ phase: 'drill', text: line });
  for (const line of topic.roleplay ?? []) out.push({ phase: 'roleplay', text: line });
  return out;
}

/** Kumpulkan {phase, text} dari 1 topik `GrammarTopic` (format LAMA).
 *  `fill` dicek per OPSI yang sudah dirakit jadi kalimat utuh (before+word+
 *  after), BUKAN cuma template mentah dgn "___" — versi lama cuma bandingkan
 *  template ("I have never played ___") yg TIDAK PERNAH bisa match `examples`
 *  apa pun (examples selalu kalimat utuh, bukan ada blank-nya) — false-negative
 *  yg sama sifatnya dgn bug `norm()` di atas, ditemukan sesi audit yg sama. */
function stimuliGrammar(topic) {
  const out = [];
  for (const ex of topic.examples ?? []) out.push({ phase: 'examples', text: ex.en });
  for (const sc of topic.scramble ?? []) out.push({ phase: 'scramble', text: (sc.target ?? []).join(' ') });
  if (topic.fill) {
    for (const opt of topic.fill.options ?? []) {
      const sentence = [...(topic.fill.before ?? []), opt.word, ...(topic.fill.after ?? [])].join(' ');
      out.push({ phase: `fill(${opt.word})`, text: sentence });
    }
  }
  return out;
}

function isOldListening(t) {
  return !('items' in t) && Array.isArray(t.drill) && Array.isArray(t.story);
}
function isOldReading(t) {
  return !('items' in t) && !('checks' in t) && Array.isArray(t.primer) && Array.isArray(t.drill) && Array.isArray(t.story);
}
function isOldSpeaking(t) {
  return !('items' in t) && !('turns' in t) && !('stories' in t) && Array.isArray(t.model) && Array.isArray(t.drill) && Array.isArray(t.roleplay);
}
function isOldGrammar(t) {
  return !('items' in t) && !('transforms' in t) && Array.isArray(t.examples) && Array.isArray(t.scramble) && t.fill;
}

/** `SpeakingStoryTopic` (format KEEMPAT, `materi/speaking.md` §16) py
 *  struktur BEDA dari 4 format lama di atas — bukan 1 set model/drill/
 *  roleplay per TOPIK, tapi per CERITA (`topic.stories[i]`, masing² py
 *  `lines`/`question`/`answer` SENDIRI) — dicek PER CERITA (bukan digabung
 *  1 topik spt `checkTopics`, supaya 2 cerita BEDA dlm 1 topik yg kebetulan
 *  pakai kata mirip tidak salah kena flag). `answer` yg diucapkan anak
 *  MEMANG harus bisa ditelusuri MAKNANYA dari salah satu `lines` (desain
 *  inti format ini, lihat komentar `SpeakingStoryItem` types.ts), TAPI
 *  teksnya (verbatim) tidak boleh 100% sama persis — kalau sama persis,
 *  "jawaban" yg ditampilkan Latihan Inti sbg target ucap TIDAK BEDA dari
 *  kalimat yg SUDAH dibaca sbg narasi, jadi Tantangan (yg seharusnya minta
 *  anak MERUMUSKAN jawaban dari fakta relevan) berisiko cuma jadi "baca
 *  ulang baris yg sudah kelihatan", bukan comprehension sungguhan — risiko
 *  yg SAMA PRINSIPNYA dgn duplikat drill/story 4 format lama di atas, cuma
 *  bentuk datanya beda (per-cerita, bukan per-topik).
 */
function checkSpeakingStoryDuplicates(topicsByLevel, errors) {
  for (const [level, topics] of Object.entries(topicsByLevel ?? {})) {
    for (const topic of topics ?? []) {
      if (!('stories' in topic)) continue;
      topic.stories.forEach((story, i) => {
        const lineTexts = (story.lines ?? []).map((l) => norm(l.en));
        const answerText = norm(story.answer?.en ?? '');
        if (answerText && lineTexts.includes(answerText)) {
          errors.push(
            `Speaking (format cerita) "${topic.id}" (${level}) cerita #${i + 1}: jawaban "${story.answer.en}" 100% sama persis dgn salah satu baris cerita — ganti jadi parafrase yg maknanya tetap sama (pola sama cerita lain di topik yg sudah parafrase, mis. "The bag is blue." dari "Rani buys a blue bag.").`
          );
        }
      });
    }
  }
}

function checkTopics(skillLabel, topicsByLevel, isOldFormat, extract, errors) {
  for (const [level, topics] of Object.entries(topicsByLevel ?? {})) {
    for (const topic of topics ?? []) {
      if (!isOldFormat(topic)) continue; // format baru di luar scope (lihat komentar atas)
      const stimuli = extract(topic).filter((s) => isSentenceLike(s.text));

      const seen = new Map(); // normalized text -> phase pertama kali muncul
      for (const { phase, text } of stimuli) {
        const key = norm(text);
        const firstPhase = seen.get(key);
        if (firstPhase && firstPhase !== phase) {
          errors.push(
            `${skillLabel} "${topic.id}" (${level}): kalimat "${text.trim()}" muncul PERSIS SAMA di tahap "${firstPhase}" dan "${phase}" — anak dengar/baca kalimat yang identik 2x dalam topik yang sama.`
          );
        } else if (!firstPhase) {
          seen.set(key, phase);
        }
      }
    }
  }
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

  const errors = [];
  checkTopics('Listening', mod.LISTENING_TOPICS_BY_LEVEL, isOldListening, stimuliListening, errors);
  checkTopics('Reading', mod.READING_TOPICS_BY_LEVEL, isOldReading, stimuliReading, errors);
  checkTopics('Speaking', mod.SPEAKING_TOPICS_BY_LEVEL, isOldSpeaking, stimuliSpeaking, errors);
  checkTopics('Grammar', mod.GRAMMAR_TOPICS_BY_LEVEL, isOldGrammar, stimuliGrammar, errors);
  checkSpeakingStoryDuplicates(mod.SPEAKING_TOPICS_BY_LEVEL, errors);

  if (errors.length > 0) {
    console.error(`\n❌ Verifikasi duplikat kalimat GAGAL (${errors.length} masalah):\n`);
    for (const e of errors) console.error(`  - ${e}`);
    console.error('');
    process.exit(1);
  }

  console.log('✅ Verifikasi duplikat kalimat lolos — tidak ada kalimat soal yang 100% sama antar tahap dalam 1 topik (format lama Listening/Reading/Speaking/Grammar).');
}

main().catch((err) => {
  console.error('❌ verify-content-duplicates: error tak terduga:', err);
  process.exit(1);
});
