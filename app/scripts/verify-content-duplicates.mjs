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

/** Listening format `items` (Little Stars/Starter/Achiever/Trailblazer) —
 *  Latihan Inti WAJIB pakai kalimat BEDA dari Kenalan/Tantangan (`example`)
 *  untuk ≥70% item per topik (`practice`, inti makna & jawaban sama, teks
 *  beda). ≤30% item boleh tanpa `practice` (pakai `example` apa adanya). */
function checkListeningPracticeVariants(topicsByLevel, errors) {
  for (const [level, topics] of Object.entries(topicsByLevel ?? {})) {
    for (const topic of topics ?? []) {
      if (!('items' in topic)) continue;
      const need = Math.ceil(topic.items.length * 0.7);
      let have = 0;
      topic.items.forEach((it, i) => {
        if (!it.practice) return;
        have += 1;
        if (!it.practice.en?.trim() || !it.practice.id?.trim()) {
          errors.push(`Listening "${topic.id}" (${level}) item #${i}: practice.en/id kosong.`);
        } else if (norm(it.practice.en) === norm(it.example.en)) {
          errors.push(`Listening "${topic.id}" (${level}) item #${i}: practice "${it.practice.en}" 100% sama dgn example — ubah kalimatnya (konteks & jawaban tetap sama) atau hapus practice.`);
        }
      });
      if (have < need) {
        errors.push(`Listening "${topic.id}" (${level}): baru ${have}/${topic.items.length} item punya practice (min ${need}) — Latihan Inti tidak boleh mengulang kalimat Kenalan utk >30% soal.`);
      }
    }
  }
}

/** Kalimat utuh Listening (stimulus yang didengar & pertanyaannya) TIDAK
 *  BOLEH sama persis antar topik MAUPUN antar level — permintaan user audit
 *  Listening. Yang dibanding = kalimat UTUH (≥2 kata, dinormalisasi tanpa
 *  tanda baca/kapital); kata/frasa yang sebagian sama boleh. */
function checkListeningGlobalUnique(topicsByLevel, errors) {
  const stim = new Map();
  const ques = new Map();
  const add = (map, text, where) => {
    if (!isSentenceLike(text)) return;
    const key = norm(text.replace(/[“”‘’]/g, ''));
    if (!map.has(key)) map.set(key, []);
    map.get(key).push({ text, where });
  };
  for (const [level, topics] of Object.entries(topicsByLevel ?? {})) {
    for (const t of topics ?? []) {
      const w = (x) => `${level}/${t.id}/${x}`;
      if (!('items' in t)) {
        (t.primer ?? []).forEach((p, i) => add(stim, p.en, w(`primer[${i}]`)));
        (t.drill ?? []).forEach((d, i) => add(stim, d.en, w(`drill[${i}]`)));
        (t.story ?? []).forEach((l, i) => add(stim, l, w(`story[${i}]`)));
        if (t.question?.en) add(ques, t.question.en, w('question'));
        continue;
      }
      t.items.forEach((it, i) => {
        add(stim, it.example.en, w(`items[${i}].example`));
        if (it.practice) add(stim, it.practice.en, w(`items[${i}].practice`));
        add(ques, it.question.en, w(`items[${i}].question`));
      });
      (t.notePassage ?? []).forEach((l, i) => add(stim, l.en, w(`notePassage[${i}]`)));
      (t.noteGaps ?? []).forEach((g, i) => add(ques, g.question, w(`noteGaps[${i}]`)));
      (t.dialogueLines ?? []).forEach((l, i) => add(stim, l.en, w(`dialogueLines[${i}]`)));
      (t.inferenceQuestions ?? []).forEach((q, i) => add(ques, q.question, w(`inferenceQuestions[${i}]`)));
    }
  }
  for (const [label, map] of [['kalimat', stim], ['pertanyaan', ques]]) {
    for (const group of map.values()) {
      if (group.length < 2) continue;
      errors.push(`Listening: ${label} "${group[0].text.trim()}" 100% sama di ${group.length} tempat (${group.map((g) => g.where).join(', ')}) — kalimat utuh Listening tidak boleh kembar antar tahap/topik/level.`);
    }
  }
}

/** Integritas data Tantangan Listening di atas Starter (materi/pembeda_level.md):
 *  suara dialog (`storyVoices`/`speaker`) & kandidat jebakan acak (`decoys`). */
const DECOY_STOP = new Set(['the','a','an','her','his','my','of','in','to','for','on','at','with','from','after','before','is','it','and','by','near','behind','front','between','one','two','very','every','each','new','old','all','no','not','was','too','only','their','they','he','she','we','i','you','are','have','has','o','clock']);
const decoyCore = (t) => t.toLowerCase().replace(/[^a-z' ]/g, ' ').split(/\s+/).filter((w) => w && !DECOY_STOP.has(w)).map((w) => w.replace(/(ing|es|ed|s)$/, ''));
function checkListeningTantanganData(topicsByLevel, errors) {
  const checkDecoys = (where, decoys, existing, audioText, needLabel = true) => {
    if (!decoys?.length) { errors.push(`${where}: belum ada kandidat jebakan (decoys).`); return; }
    const have = new Set(existing.map((e) => e.toLowerCase()));
    const heard = new Set(decoyCore(audioText));
    const cores = existing.map((e) => new Set(decoyCore(e)));
    const frame = cores.length ? [...cores[0]].filter((w) => cores.every((c) => c.has(w))) : [];
    const isHeard = (label) => {
      const words = decoyCore(label).filter((w) => !frame.includes(w));
      return words.filter((w) => heard.has(w)).length > words.length / 2;
    };
    let usable = 0;
    for (const d of decoys) {
      const label = d.label;
      if (!label) { errors.push(`${where}: decoy tanpa label/teks.`); continue; }
      if (have.has(label.toLowerCase())) errors.push(`${where}: decoy "${label}" sama dgn opsi yang sudah ada.`);
      else if (!isHeard(label)) usable += 1;
      if (d.ok === true) errors.push(`${where}: decoy "${label}" bertanda ok:true.`);
    }
    if (usable === 0) errors.push(`${where}: semua decoy katanya muncul di audio — tidak ada yang bisa jadi jebakan "tidak disebut".`);
  };
  for (const [level, topics] of Object.entries(topicsByLevel ?? {})) {
    for (const t of topics ?? []) {
      const at = `Listening "${t.id}" (${level})`;
      if (!('items' in t)) {
        if (t.storyVoices && t.storyVoices.length !== t.story.length) errors.push(`${at}: storyVoices (${t.storyVoices.length}) ≠ jumlah baris story (${t.story.length}).`);
        checkDecoys(`${at} soal akhir`, (t.question.decoys ?? []).map((d) => ({ label: d.lbl, ok: d.ok })), t.question.opts.map((o) => o.lbl ?? ''), t.story.join(' '));
      } else if ('noteGaps' in t) {
        const withSpeaker = t.notePassage.filter((p) => p.speaker).length;
        if (withSpeaker && withSpeaker !== t.notePassage.length) errors.push(`${at}: notePassage campur baris ber-speaker & tanpa speaker — harus semua atau tidak sama sekali.`);
        if (withSpeaker && new Set(t.notePassage.map((p) => p.speaker)).size < 2) errors.push(`${at}: dialog notePassage butuh ≥2 penutur berbeda.`);
        t.noteGaps.forEach((g, i) => checkDecoys(`${at} gap #${i}`, (g.decoys ?? []).map((d) => ({ label: d })), g.options, t.notePassage.map((p) => p.en).join(' ')));
      } else if ('dialogueLines' in t) {
        t.inferenceQuestions.forEach((q, i) => checkDecoys(`${at} soal #${i}`, (q.decoys ?? []).map((d) => ({ label: d.text, ok: d.ok })), q.options.map((o) => o.text), t.dialogueLines.map((l) => l.en).join(' ')));
      }
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
  checkListeningPracticeVariants(mod.LISTENING_TOPICS_BY_LEVEL, errors);
  checkListeningGlobalUnique(mod.LISTENING_TOPICS_BY_LEVEL, errors);
  checkListeningTantanganData(mod.LISTENING_TOPICS_BY_LEVEL, errors);

  if (errors.length > 0) {
    console.error(`\n❌ Verifikasi duplikat kalimat GAGAL (${errors.length} masalah):\n`);
    for (const e of errors) console.error(`  - ${e}`);
    console.error('');
    process.exit(1);
  }

  console.log('✅ Verifikasi duplikat kalimat lolos — tidak ada kalimat soal yang 100% sama antar tahap dalam 1 topik (format lama Listening/Reading/Speaking/Grammar), Latihan Inti Listening (items) ≥70% pakai kalimat practice beda dari Kenalan, & kalimat utuh Listening unik antar topik/level.');
}

main().catch((err) => {
  console.error('❌ verify-content-duplicates: error tak terduga:', err);
  process.exit(1);
});
