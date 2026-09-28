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
  // `kenalanGame` (BARU — Kenalan "🎮 Main" format lama, permintaan user
  // "samakan UI kenalan main dengan Little Stars") — 1 item per topik,
  // `example.en`/`question.en` masing² dicek spt phase lain di sini.
  for (const kg of topic.kenalanGame ?? []) {
    out.push({ phase: 'kenalanGame-example', text: kg.example.en });
    out.push({ phase: 'kenalanGame-question', text: kg.question.en });
  }
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
  for (const line of topic.model ?? []) out.push({ phase: 'model', text: line.en });
  for (const line of topic.drill ?? []) out.push({ phase: 'drill', text: line.en });
  for (const rp of topic.roleplay ?? []) {
    out.push({ phase: 'roleplay', text: rp.q.en });
    out.push({ phase: 'roleplay-answer', text: rp.answer.en });
    for (const c of rp.choices ?? []) out.push({ phase: 'roleplay-choice', text: c.en });
  }
  return out;
}

/**
 * Grammar format KALIMAT (`GrammarSentenceTopic`, Explorer/Adventurer/
 * Achiever) & format KETIGA (`GrammarTransformTopic`, Trailblazer) — cek
 * struktur yang membuat soal bisa salah/bisa ditebak (`materi/pembeda_level.md`
 * § Grammar, audit 2026-09-24):
 *  - ≥10 kalimat per topik;
 *  - `key` 1 kata, muncul TEPAT 1x sbg kata utuh di `en` (dikosongkan di
 *    Tantangan, disorot di Kenalan);
 *  - `wrong` = TEPAT 3 bentuk beda, bukan `key`, & tidak ada di kalimat.
 *    2 pertama = 1 kata (dipakai jg sbg kata jebakan Susun Kalimat — kalau
 *    sudah ada di kalimat, bank jadi dobel); ke-3 boleh >1 kata (cuma jadi
 *    opsi ke-4 Tantangan "Pilih Bentuk" 2×2, permintaan user "4 card");
 *  - tiap `alt` = kata yang SAMA PERSIS dgn `en` (cuma urutan beda);
 *  - Trailblazer: `originalOptions` 3 kutipan beda, bukan `original`.
 */
function checkGrammarData(byLevel, errors) {
  const tokens = (t) => t.replace(/[.,!?]/g, '').split(/\s+/).filter(Boolean).map((w) => w.toLowerCase());
  for (const [level, topics] of Object.entries(byLevel ?? {})) {
    for (const t of topics) {
      if (Array.isArray(t.sentences)) {
        if (t.sentences.length < 10) errors.push(`Grammar "${t.id}" (${level}): cuma ${t.sentences.length} kalimat (minimal 10).`);
        const seen = new Set();
        for (const s of t.sentences) {
          const where = `Grammar "${t.id}" (${level}) "${s.en}"`;
          const tk = tokens(s.en);
          if (seen.has(tk.join(' '))) errors.push(`${where}: kalimat dobel dalam 1 topik.`);
          seen.add(tk.join(' '));
          if (!s.id) errors.push(`${where}: arti Indonesia (id) kosong.`);
          if (/\s/.test(s.key)) errors.push(`${where}: key "${s.key}" harus 1 kata.`);
          const hits = tk.filter((w) => w === s.key.toLowerCase()).length;
          if (hits !== 1) errors.push(`${where}: key "${s.key}" muncul ${hits}x (harus tepat 1x sbg kata utuh).`);
          if (!Array.isArray(s.wrong) || s.wrong.length !== 3) errors.push(`${where}: wrong harus tepat 3 bentuk.`);
          const wl = (s.wrong ?? []).map((w) => w.toLowerCase());
          if (new Set(wl).size !== wl.length || wl.includes(s.key.toLowerCase())) errors.push(`${where}: wrong dobel / sama dgn key.`);
          wl.forEach((w, wi) => {
            if (wi < 2 && /\s/.test(w)) errors.push(`${where}: wrong "${w}" harus 1 kata (2 pertama dipakai sbg kata jebakan).`);
            if (` ${tk.join(' ')} `.includes(` ${w} `)) errors.push(`${where}: wrong "${w}" sudah ada di kalimat.`);
          });
          const sorted = [...tk].sort().join(' ');
          for (const alt of s.alt ?? []) {
            if ([...tokens(alt)].sort().join(' ') !== sorted) errors.push(`${where}: alt "${alt}" katanya tidak sama persis dgn kalimat.`);
            if (tokens(alt).join(' ') === tk.join(' ')) errors.push(`${where}: alt "${alt}" sama dgn kalimat aslinya.`);
          }
        }
      }
      if (Array.isArray(t.texts)) {
        if (level !== 'achiever') errors.push(`Grammar "${t.id}" (${level}): texts cuma dipakai tier Lanjut (Achiever).`);
        if (t.texts.length < 3) errors.push(`Grammar "${t.id}" (${level}): texts minimal 3 (3 soal Tantangan).`);
        const wordRe = (w) => new RegExp(`(^|[^A-Za-z'])${w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?=[^A-Za-z']|$)`, 'gi');
        for (const x of t.texts) {
          const where = `Grammar "${t.id}" (${level}) teks "${(x.en ?? []).join(' ')}"`;
          if (!Array.isArray(x.en) || x.en.length < 2 || x.en.length > 3) errors.push(`${where}: harus 2–3 kalimat.`);
          const last = x.en[x.en.length - 1] ?? '';
          const before = x.en.slice(0, -1).join(' ');
          const hits = (last.match(wordRe(x.key)) ?? []).length;
          if (hits !== 1) errors.push(`${where}: key "${x.key}" muncul ${hits}x di kalimat terakhir (harus tepat 1x).`);
          if (!Array.isArray(x.wrong) || x.wrong.length !== 3) errors.push(`${where}: wrong harus tepat 3.`);
          const opts = [x.key, ...(x.wrong ?? [])].map((o) => o.toLowerCase());
          if (new Set(opts).size !== opts.length) errors.push(`${where}: opsi dobel.`);
          if (!x.cue || !wordRe(x.cue).test(before)) errors.push(`${where}: cue "${x.cue}" tidak ada di kalimat sebelumnya.`);
          if (x.cue && wordRe(x.cue).test(last)) errors.push(`${where}: cue "${x.cue}" ada di kalimat berumpang (petunjuk harus di kalimat lain).`);
          if (!x.id) errors.push(`${where}: arti (id) kosong.`);
        }
      }
      if (Array.isArray(t.transforms)) {
        for (const tr of t.transforms) {
          const where = `Grammar "${t.id}" (${level}) "${tr.original}"`;
          const oo = tr.originalOptions ?? [];
          if (oo.length !== 3) errors.push(`${where}: originalOptions harus tepat 3.`);
          const all = [tr.original, ...oo].map((x) => x.toLowerCase());
          if (new Set(all).size !== all.length) errors.push(`${where}: originalOptions dobel / sama dgn original.`);
          if ((tr.reportedOptions ?? []).filter((o) => o.ok).length !== 1) errors.push(`${where}: reportedOptions harus tepat 1 ok:true.`);
        }
      }
    }
  }
}

/**
 * Reading format "Baca Teks" (`ReadingTextTopic`, PILOT Explorer —
 * materi/reading.md §19–§20): (1) teks Tantangan (`newTexts`) WAJIB teks
 * BARU — tidak ada kalimat yang 100% sama dgn teks Kenalan/Latihan Inti
 * (`texts`); (2) tiap pertanyaan: index jawaban & bukti valid, opsi tidak
 * dobel, arti Indonesia ada; (3) kalimat ber-`pic` menunjuk gambar yang ada.
 */
function checkReadingTextData(byLevel, errors) {
  for (const [level, topics] of Object.entries(byLevel ?? {})) {
    for (const t of topics ?? []) {
      if (!('texts' in t)) continue;
      const where = `Reading "${t.id}" (${level})`;
      const seen = new Set(t.texts.flatMap((x) => x.lines.map((l) => norm(l.en))));
      for (const x of t.newTexts) {
        for (const l of x.lines) {
          if (isSentenceLike(l.en) && seen.has(norm(l.en))) errors.push(`${where}: kalimat Tantangan "${l.en}" sama dgn teks Kenalan — Tantangan wajib teks baru.`);
        }
      }
      for (const [group, texts] of [['texts', t.texts], ['newTexts', t.newTexts]]) {
        texts.forEach((x, ti) => {
          x.lines.forEach((l, li) => {
            if (!l.id) errors.push(`${where} ${group}[${ti}] baris ${li}: arti Indonesia kosong.`);
            if (l.pic !== undefined && !(x.pictures ?? [])[l.pic]) errors.push(`${where} ${group}[${ti}] baris ${li}: pic ${l.pic} tidak ada di pictures.`);
          });
          x.questions.forEach((q, qi) => {
            const w = `${where} ${group}[${ti}] soal ${qi}`;
            if (!q.qId) errors.push(`${w}: qId kosong.`);
            if (!(q.answer >= 0 && q.answer < q.options.length)) errors.push(`${w}: answer di luar rentang opsi.`);
            if (new Set(q.options.map(norm)).size !== q.options.length) errors.push(`${w}: opsi dobel.`);
            if (q.evidence.some((e) => !(e >= 0 && e < x.lines.length))) errors.push(`${w}: evidence menunjuk baris yang tidak ada.`);
            if (q.kind === 'picture') {
              const line = x.lines[q.about];
              if (!line) errors.push(`${w}: about menunjuk baris yang tidak ada.`);
              else if (q.evidenceWord) {
                const ws = line.en.toLowerCase().split(/\s+/).map((t) => t.replace(/[^a-z0-9']/g, ''));
                if (!ws.includes(q.evidenceWord.toLowerCase().replace(/[^a-z0-9']/g, ''))) errors.push(`${w}: evidenceWord "${q.evidenceWord}" tidak ada sbg kata utuh di "${line.en}".`);
              }
              const pics = line?.pic !== undefined ? (x.pictures ?? [])[line.pic]?.emoji : undefined;
              if (pics && q.options[q.answer] !== pics) errors.push(`${w}: jawaban gambar tidak sama dgn gambar halaman "${line.en}".`);
            }
            if (q.kind === 'truefalse' && (q.options.length !== 2 || !q.picture)) errors.push(`${w}: truefalse wajib 2 opsi & picture.`);
          });
          if (x.sequence && x.sequence.some((e) => !(e >= 0 && e < x.lines.length))) errors.push(`${where} ${group}[${ti}]: sequence menunjuk baris yang tidak ada.`);
        });
      }
    }
  }
}

function isOldListening(t) {
  return !('items' in t) && Array.isArray(t.drill) && Array.isArray(t.story);
}
function isOldReading(t) {
  return !('items' in t) && !('checks' in t) && !('texts' in t) && Array.isArray(t.primer) && Array.isArray(t.drill) && Array.isArray(t.story);
}
function isOldSpeaking(t) {
  return !('items' in t) && !('turns' in t) && !('stories' in t) && Array.isArray(t.model) && Array.isArray(t.drill) && Array.isArray(t.roleplay);
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
        (t.kenalanGame ?? []).forEach((kg, i) => {
          add(stim, kg.example.en, w(`kenalanGame[${i}].example`));
          add(ques, kg.question.en, w(`kenalanGame[${i}].question`));
        });
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

/** Kenalan Listening (semua level): (1) format lama (Explorer/Adventurer)
 *  WAJIB ≥10 item `kenalanGame` — sejak `primer` dihapus, itu SATU-SATUNYA
 *  isi Kenalan-nya (permintaan user "samakan Kenalan dgn level lain"); (2)
 *  teks pertanyaan `item.question.en` (items & kenalanGame) TIDAK BOLEH
 *  memuat teks salah satu opsinya — pertanyaan kini SELALU tampil di layar
 *  (Latihan Inti & Kenalan "Main"), jadi anak bisa asal cocokkan kata
 *  (CLAUDE.md "Soal Tidak Boleh Bisa Ditebak" pola #2). */
function checkListeningKenalanData(topicsByLevel, errors) {
  const wordsOf = (t) => ` ${t.toLowerCase().replace(/’/g, "'").replace(/[^a-z0-9' ]/g, ' ').replace(/\s+/g, ' ').trim()} `;
  for (const [level, topics] of Object.entries(topicsByLevel ?? {})) {
    for (const t of topics ?? []) {
      const at = `Listening "${t.id}" (${level})`;
      const list = 'items' in t ? t.items : t.kenalanGame ?? [];
      if (!('items' in t) && list.length < 10) errors.push(`${at}: kenalanGame cuma ${list.length} item (Kenalan format lama wajib ≥10).`);
      list.forEach((it, i) => {
        const q = wordsOf(it.question.en);
        for (const o of it.question.options) {
          if (o.text && q.includes(wordsOf(o.text))) errors.push(`${at} item #${i}: pertanyaan "${it.question.en}" memuat teks opsi "${o.text}" (jawaban bisa ditebak dari teks).`);
        }
      });
    }
  }
}

/**
 * Listening format `items`: subjek pertanyaan WAJIB muncul di kalimat yang
 * diputar sebelumnya (`example` di Kenalan "Main", `practice` di Latihan
 * Inti) — audit Listening menemukan "We recycle…" lalu ditanya "How often
 * do THEY recycle?" (anak dengar 2 subjek beda). Cuma dicek kalau kedua
 * kalimat py kata ganti subjek; "Mom and I" → "we" dianggap cocok.
 */
function checkListeningSubjectMatch(topicsByLevel, errors) {
  const PRONOUNS = ['i', 'we', 'they', 'she', 'he', 'you'];
  const pronounsOf = (s) => {
    const found = new Set();
    for (const w of s.toLowerCase().replace(/[^a-z' ]/g, ' ').split(/\s+/)) if (PRONOUNS.includes(w)) found.add(w);
    return found;
  };
  for (const [level, topics] of Object.entries(topicsByLevel)) {
    for (const topic of topics ?? []) {
      if (!('items' in topic)) continue;
      for (const item of topic.items) {
        const q = pronounsOf(item.question.en);
        if (q.size === 0) continue;
        for (const [field, text] of [['example', item.example.en], ['practice', item.practice?.en]]) {
          if (!text) continue;
          const s = pronounsOf(text);
          if (s.size === 0) continue;
          const missing = [...q].filter((x) => !s.has(x) && !(x === 'we' && s.has('i')));
          if (missing.length > 0) {
            errors.push(`Listening ${level}/${topic.id} [${item.en}]: subjek pertanyaan "${item.question.en}" (${missing.join(', ')}) tidak ada di ${field} "${text}"`);
          }
        }
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
  checkGrammarData(mod.GRAMMAR_TOPICS_BY_LEVEL, errors);
  checkReadingTextData(mod.READING_TOPICS_BY_LEVEL, errors);
  checkSpeakingStoryDuplicates(mod.SPEAKING_TOPICS_BY_LEVEL, errors);
  checkListeningPracticeVariants(mod.LISTENING_TOPICS_BY_LEVEL, errors);
  checkListeningGlobalUnique(mod.LISTENING_TOPICS_BY_LEVEL, errors);
  checkListeningTantanganData(mod.LISTENING_TOPICS_BY_LEVEL, errors);
  checkListeningKenalanData(mod.LISTENING_TOPICS_BY_LEVEL, errors);
  checkListeningSubjectMatch(mod.LISTENING_TOPICS_BY_LEVEL, errors);

  if (errors.length > 0) {
    console.error(`\n❌ Verifikasi duplikat kalimat GAGAL (${errors.length} masalah):\n`);
    for (const e of errors) console.error(`  - ${e}`);
    console.error('');
    process.exit(1);
  }

  console.log('✅ Verifikasi duplikat kalimat lolos — tidak ada kalimat soal yang 100% sama antar tahap dalam 1 topik (format lama Listening/Reading/Speaking), data Grammar (kunci/opsi salah/urutan alternatif) valid, Latihan Inti Listening (items) ≥70% pakai kalimat practice beda dari Kenalan, kalimat utuh Listening unik antar topik/level, & Kenalan Listening ≥10 item tanpa pertanyaan yang memuat teks opsinya, & subjek pertanyaan Listening cocok dgn kalimatnya.');
}

main().catch((err) => {
  console.error('❌ verify-content-duplicates: error tak terduga:', err);
  process.exit(1);
});
