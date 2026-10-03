/**
 * Bank soal Tantangan Raja (tes akhir level) — `materi/test_level.md` §5.
 *
 * 🔒 Tes = bentuk soal TANTANGAN level itu (bukan versi mudah yang sama di
 * semua level), ditarik merata dari tiap topik level (`pickIds`, 1 topik
 * tidak mendominasi) & soal yang dipakai di 3 percobaan terakhir dihindari.
 * Bentuk per tier (`contentLevel` = level yang ditantang):
 *
 * | Skill     | Dasar (LS/Starter)               | Menengah (Explorer/Adventurer)    | Lanjut (Achiever/Trailblazer)             |
 * |-----------|----------------------------------|-----------------------------------|-------------------------------------------|
 * | Vocab     | dengar/arti/Inggrisnya (+gambar) | + lengkapi kalimat, kartu teks    | + 5 opsi                                  |
 * | Listening | kalimat + pertanyaan → gambar    | + cerita mini (+ jebakan)         | + Lengkapi Catatan / Dengar & Simpulkan   |
 * | Reading   | kalimat → gambar, ✅/❌          | teks utuh + soal, lengkapi cerita | + Benar/Salah, kalimat hilang |
 * | Grammar   | dengar → kartu kontras (A & B)   | pilih bentuk yang pas (4 opsi)    | + teks pendek / transformasi              |
 * | Speaking  | tirukan frasa (dilaporkan saja)  | ucapkan jawaban                   | ucapkan jawaban                           |
 *
 * Id soal stabil (`skill~topik~…~varian`) supaya run yang tersimpan bisa
 * dibangun ulang sesudah reload; `baseOf()` = soal tanpa varian (dipakai
 * utk menghindari soal yang sama di percobaan berikut).
 */
import {
  GRAMMAR_TOPICS_BY_LEVEL,
  LISTENING_TOPICS_BY_LEVEL,
  READING_TOPICS_BY_LEVEL,
  SPEAKING_TOPICS_BY_LEVEL,
  VOCAB_TOPICS_BY_LEVEL,
} from '../content';
import { readingPicHtml as picHtml } from '../reading-pic';
import { speak, speakDialogue, speakLocalized, speakSequence } from '../speech';
import type {
  AnyGrammarTopic,
  AnyListeningTopic,
  AnyReadingTopic,
  AnySpeakingTopic,
  LevelKey,
  ListeningDialogueLine,
  ReadingText,
  SkillKey,
  VocabItem,
  VocabTopic,
} from '../types';
import { escapeHtml, shuffle } from '../util';
import { choiceLabel, contrastVisualInner, LABELED_VISUALS, sourceText, transformUi } from './grammar';
import { dialogueGenders, listeningGapMs, withDecoysEven } from './listening';
import { evenPictureQuestion, textCardHtml } from './reading';
import { blankSentence, isAboveStarter, isColorTopic, isDayTopic, isFlyersOrAbove, isNumberTopic, isShapeTopic, itemGlyph } from './vocabulary';

export const OBJECTIVE_SKILLS: SkillKey[] = ['vocabulary', 'listening', 'reading', 'grammar'];
export const ALL_SKILLS: SkillKey[] = ['vocabulary', 'listening', 'reading', 'grammar', 'speaking'];

const LEVEL_ORDER: LevelKey[] = ['little-stars', 'starter', 'explorer', 'adventurer', 'achiever', 'trailblazer'];

/** Jumlah soal (keputusan user, `test_level.md` §5.2): skill objektif mulai
 *  5 di Little Stars, +3 tiap level; Speaking 3/3/4/4/5/5. */
export function questionCount(level: LevelKey, skill: SkillKey): number {
  const i = Math.max(0, LEVEL_ORDER.indexOf(level));
  return skill === 'speaking' ? [3, 3, 4, 4, 5, 5][i] : 5 + 3 * i;
}

/** Lulus = ≥ 80% benar (keputusan user), dibulatkan ke atas. */
export const PASS_RATIO = 0.8;
export function passNeed(total: number): number {
  return Math.ceil(total * PASS_RATIO - 1e-9);
}

/** Soal bonus zona batas (kurang tepat 1 jawaban dari syarat). */
export const EXTRA_COUNT = 3;

/** Perkiraan menit per skill (info saja, bukan timer): ±30–38 dtk per soal
 *  objektif, ±45–55 dtk per soal Speaking. */
export function minutesFor(level: LevelKey, skill: SkillKey): [number, number] {
  const n = questionCount(level, skill);
  const [lo, hi] = skill === 'speaking' ? [45, 55] : [30, 38];
  return [Math.max(1, Math.round((n * lo) / 60)), Math.max(1, Math.round((n * hi) / 60))];
}

export interface BossOpt {
  /** Isi kartu HTML siap pakai (gambar kontras Grammar). */
  html?: string;
  emoji?: string;
  label?: string;
  ok: boolean;
}

export interface BossChoiceQ {
  kind: 'choice';
  id: string;
  topicId: string;
  badge: string;
  body: string;
  play?: () => void;
  autoPlay?: boolean;
  playLabel?: string;
  options: BossOpt[];
  /** cards = kartu gambar(+teks) 2×2; list = kartu teks 1 kolom ber-lencana;
   *  tf = 2 tombol Benar/Salah. */
  layout: 'cards' | 'list' | 'tf';
  answerText: string;
  sayAnswer?: () => void;
}

export interface BossSpeakQ {
  kind: 'speak';
  id: string;
  topicId: string;
  badge: string;
  body: string;
  target: string;
  play?: () => void;
  autoPlay?: boolean;
  /** false = jawaban disembunyikan dulu (cerita), diungkap sesudah mic. */
  showTarget: boolean;
}

export type BossQ = BossChoiceQ | BossSpeakQ;

interface Candidate {
  base: string;
  topicId: string;
  variants: string[];
  /** Soal bentuk khas level (cerita/catatan/dialog/teks pendek) — dijatah ±⅔. */
  special?: boolean;
}

const SEP = '~';

export function baseOf(id: string): string {
  return id.slice(0, id.lastIndexOf(SEP));
}

const PREFIX: Record<SkillKey, string> = { vocabulary: 'v', listening: 'l', reading: 'r', grammar: 'g', speaking: 's' };

/* ------------------------------------------------------------ kandidat -- */

function vocabTopics(level: LevelKey): VocabTopic[] {
  return VOCAB_TOPICS_BY_LEVEL[level] ?? [];
}

function vocabKinds(level: LevelKey, topic: VocabTopic, it: VocabItem): string[] {
  // 'hear' Dasar = kartu GAMBAR SAJA (tulisan Inggris = bunyi yang diucapkan
  // → anak yang bisa membaca cukup mencocokkan tulisan). Topik tanpa gambar
  // aman (angka/bentuk/hari) tidak dapat 'hear' di Dasar.
  const noPic = isNumberTopic(topic) || isShapeTopic(topic) || isDayTopic(topic) || !!topic.iconAmbiguous;
  const kinds = isAboveStarter(level) || !noPic ? ['hear', 'toEn', 'toId'] : ['toEn', 'toId'];
  // "Lengkapi Kalimat" butuh membaca kalimat — Little Stars belum bisa baca.
  if (level !== 'little-stars' && blankSentence(it.example.en, it.en) !== it.example.en) kinds.push('sentence');
  return topic.items.length >= 4 ? kinds : [];
}

function candidates(level: LevelKey, skill: SkillKey): Candidate[] {
  const p = PREFIX[skill];
  const out: Candidate[] = [];
  const add = (topicId: string, rest: (string | number)[], variants: string[], special = false) => {
    const base = [p, topicId, ...rest].join(SEP);
    if (variants.length) out.push({ base, topicId, variants: variants.map((v) => base + SEP + v), special });
  };
  if (skill === 'vocabulary') {
    for (const t of vocabTopics(level)) t.items.forEach((it, i) => add(t.id, [i], vocabKinds(level, t, it)));
  } else if (skill === 'listening') {
    for (const t of (LISTENING_TOPICS_BY_LEVEL[level] ?? []) as AnyListeningTopic[]) {
      if ('items' in t) {
        t.items.forEach((_, i) => add(t.id, ['i', i], ['-']));
        if ('noteGaps' in t) t.noteGaps.forEach((_, i) => add(t.id, ['g', i], ['-'], true));
        if ('inferenceQuestions' in t) t.inferenceQuestions.forEach((_, i) => add(t.id, ['q', i], ['-'], true));
      } else {
        t.kenalanGame.forEach((_, i) => add(t.id, ['k', i], ['-']));
        add(t.id, ['s'], ['-'], true);
      }
    }
  } else if (skill === 'reading') {
    for (const t of (READING_TOPICS_BY_LEVEL[level] ?? []) as AnyReadingTopic[]) {
      const sets: [string, ReadingText[]][] = [
        ['t', t.texts],
        ['n', t.newTexts],
      ];
      for (const [set, texts] of sets)
        texts.forEach((x, xi) =>
          x.questions.forEach((q, qi) => {
            const k = q.kind ?? 'text';
            if ((k === 'gap' || k === 'ref') && gapDistractors(x, q.word ?? '', q.q, q.evidence).length < 3) return;
            add(t.id, [set, xi, qi], ['-'], k !== 'text' && k !== 'picture' && k !== 'truefalse');
          })
        );
    }
  } else if (skill === 'grammar') {
    for (const t of (GRAMMAR_TOPICS_BY_LEVEL[level] ?? []) as AnyGrammarTopic[]) {
      if ('items' in t) t.items.forEach((_, i) => add(t.id, [i], t.items.length >= 2 ? ['A', 'B'] : []));
      else if ('transforms' in t) t.transforms.forEach((_, i) => add(t.id, [i], ['fwd', 'rev']));
      else {
        t.sentences.forEach((st, i) => add(t.id, ['s', i], blankFirst(st.en, st.key) ? ['-'] : []));
        (t.texts ?? []).forEach((_, i) => add(t.id, ['x', i], ['-'], true));
      }
    }
  } else {
    for (const t of (SPEAKING_TOPICS_BY_LEVEL[level] ?? []) as AnySpeakingTopic[]) {
      if ('items' in t) t.items.forEach((_, i) => add(t.id, ['p', i], ['-']));
      else if ('turns' in t) t.turns.forEach((_, i) => add(t.id, ['t', i], ['-']));
      else if ('stories' in t) t.stories.forEach((_, i) => add(t.id, ['c', i], ['-']));
      else {
        t.drill.forEach((_, i) => add(t.id, ['d', i], ['-']));
        t.roleplay.forEach((_, i) => add(t.id, ['r', i], ['-']));
      }
    }
  }
  return out;
}

/** Ambil `count` soal merata per topik (round-robin topik acak), soal bentuk
 *  khas level dijatah ±⅔ (cerita/catatan/dialog Listening punya pengecoh yang
 *  ikut disebut — tidak bisa dijawab cuma dgn menangkap 1 kata; bentuk
 *  Cambridge Reading/Grammar), hindari `avoidBases` kalau stoknya cukup. */
export function pickIds(level: LevelKey, skill: SkillKey, count: number, avoidBases: string[] = []): string[] {
  const all = candidates(level, skill);
  const avoid = new Set(avoidBases);
  const fresh = all.filter((c) => !avoid.has(c.base));
  const pool = fresh.length >= count ? fresh : all;
  const special = pool.filter((c) => c.special);
  const core = pool.filter((c) => !c.special);
  const quota = special.length && core.length ? Math.min(special.length, Math.ceil((count * 2) / 3)) : special.length ? count : 0;
  const chosen = [...spread(special, quota), ...spread(core, count - Math.min(quota, special.length))];
  if (chosen.length < count) chosen.push(...spread(pool.filter((c) => !chosen.includes(c)), count - chosen.length));
  return shuffle(chosen)
    .slice(0, count)
    .map((c) => c.variants[Math.floor(Math.random() * c.variants.length)]);
}

function spread(list: Candidate[], n: number): Candidate[] {
  if (n <= 0 || !list.length) return [];
  const groups = new Map<string, Candidate[]>();
  for (const c of shuffle(list)) {
    if (!groups.has(c.topicId)) groups.set(c.topicId, []);
    groups.get(c.topicId)!.push(c);
  }
  const order = shuffle([...groups.keys()]);
  const out: Candidate[] = [];
  while (out.length < n) {
    let took = false;
    for (const k of order) {
      const g = groups.get(k)!;
      if (g.length && out.length < n) {
        out.push(g.shift()!);
        took = true;
      }
    }
    if (!took) break;
  }
  return out;
}

/* ------------------------------------------------------------- builder -- */

const cache = new Map<string, BossQ | null>();

/** Soal dibangun sekali per sesi (urutan opsi stabil saat dibuka ulang). */
export function buildQuestion(level: LevelKey, id: string): BossQ | null {
  const key = `${level}|${id}`;
  if (!cache.has(key)) cache.set(key, safeBuild(level, id));
  return cache.get(key) ?? null;
}

/** 🔒 Jumlah opsi WAJIB genap (2/4/6) — sisa ganjil (mis. stok pengecoh
 *  kurang, soal Reading 3 opsi) → 1 opsi salah dibuang. */
function evenChoices(q: BossQ | null): BossQ | null {
  if (!q || q.kind !== 'choice' || q.options.length % 2 === 0) return q;
  const wrong = q.options.filter((o) => !o.ok);
  const drop = shuffle(wrong)[0];
  return drop ? { ...q, options: q.options.filter((o) => o !== drop) } : q;
}

function safeBuild(level: LevelKey, id: string): BossQ | null {
  return evenChoices(buildRaw(level, id));
}

function buildRaw(level: LevelKey, id: string): BossQ | null {
  try {
    const parts = id.split(SEP);
    const [p, topicId] = parts;
    const rest = parts.slice(2);
    if (p === 'v') return vocabQ(level, id, topicId, Number(rest[0]), rest[1]);
    if (p === 'l') return listeningQ(level, id, topicId, rest[0], Number(rest[1]));
    if (p === 'r') return readingQ(level, id, topicId, rest[0], Number(rest[1]), Number(rest[2]));
    if (p === 'g') return grammarQ(level, id, topicId, rest);
    if (p === 's') return speakingQ(level, id, topicId, rest[0], Number(rest[1]));
  } catch {
    /* soal basi (konten berubah) → null, dilewati pemanggil */
  }
  return null;
}

function vocabQ(level: LevelKey, id: string, topicId: string, idx: number, kind: string): BossChoiceQ | null {
  const topic = vocabTopics(level).find((t) => t.id === topicId);
  const it = topic?.items[idx];
  if (!topic || !it) return null;
  const above = isAboveStarter(level);
  const leaky = isNumberTopic(topic) || isShapeTopic(topic) || isDayTopic(topic);
  const emo = (o: VocabItem): string => {
    if (above) return '';
    if (kind === 'sentence' && (leaky || isColorTopic(topic))) return '';
    if (isColorTopic(topic)) return o.example.emoji;
    return leaky ? '' : itemGlyph(topic.id, o);
  };
  const labelOf = (o: VocabItem): string => (kind === 'toId' || (kind === 'hear' && above) ? o.id : o.en);
  const count = isFlyersOrAbove(level) ? 5 : 3;
  const seenLabels = new Set([labelOf(it).toLowerCase()]);
  const seenEmoji = new Set([emo(it)]);
  const distract: VocabItem[] = [];
  for (const o of shuffle(topic.items)) {
    if (distract.length >= count || o === it) continue;
    const l = labelOf(o).toLowerCase();
    const e = emo(o);
    if (seenLabels.has(l) || (e && seenEmoji.has(e))) continue;
    seenLabels.add(l);
    if (e) seenEmoji.add(e);
    distract.push(o);
  }
  if (distract.length < 2) return null;
  const picOnly = kind === 'hear' && !above;
  const opts = shuffle([it, ...distract]).map((o) => ({ emoji: emo(o), label: picOnly ? undefined : labelOf(o), ok: o === it }));
  let body = '';
  let play: (() => void) | undefined;
  let badge = '🎧 Dengar & Pilih';
  if (kind === 'hear') {
    body = `<p class="reading-question">${above ? 'Dengar katanya, lalu pilih artinya.' : 'Dengar, lalu pilih yang kamu dengar.'}</p>`;
    play = () => speak(it.en);
  } else if (kind === 'toEn') {
    badge = '🇬🇧 Apa Bahasa Inggrisnya?';
    body = `<p class="reading-question">Apa bahasa Inggrisnya <b>"${escapeHtml(it.id)}"</b>?</p>`;
    play = () => speakLocalized(it.id, 'id-ID');
  } else if (kind === 'toId') {
    badge = '🇮🇩 Apa Artinya?';
    body = `<p class="reading-question">Apa bahasa Indonesianya <b>"${escapeHtml(it.en)}"</b>?</p>`;
    play = () => speak(it.en);
  } else {
    badge = '✏️ Lengkapi Kalimat';
    body = `<div class="en-text">${escapeHtml(blankSentence(it.example.en, it.en))}</div><div class="id-text">${escapeHtml(it.example.id)}</div>`;
  }
  return {
    kind: 'choice',
    id,
    topicId,
    badge,
    body,
    play,
    autoPlay: !!play,
    options: opts,
    layout: opts.every((o) => o.emoji) ? 'cards' : 'list',
    answerText: labelOf(it),
    sayAnswer: kind === 'toId' ? () => speakLocalized(it.id, 'id-ID') : kind === 'sentence' ? () => speak(it.example.en) : () => speak(it.en),
  };
}

/** Kartu gambar Listening: kalau ada 1 opsi tanpa gambar, SEMUA jadi teks
 *  (CLAUDE.md "Ikon … seragam"). Gambar saja (tanpa tulisan) kalau semua
 *  opsi bergambar — tes dengar, bukan cocok tulisan. */
function listenOpts(raw: { emoji: string; label: string; ok: boolean }[]): { options: BossOpt[]; layout: 'cards' | 'list' } {
  const pics = raw.every((o) => o.emoji) && new Set(raw.map((o) => o.emoji)).size === raw.length;
  // Gambar + tulisan (sama kartu Latihan Inti) — gambar saja ambigu utk
  // jawaban abstrak (Kind/Angry/Quiet …).
  const options = shuffle(raw).map((o) => (pics ? { emoji: o.emoji, label: o.label, ok: o.ok } : { label: o.label, ok: o.ok }));
  return { options, layout: pics ? 'cards' : 'list' };
}

function listeningQ(level: LevelKey, id: string, topicId: string, kind: string, idx: number): BossChoiceQ | null {
  const topic = ((LISTENING_TOPICS_BY_LEVEL[level] ?? []) as AnyListeningTopic[]).find((t) => t.id === topicId);
  if (!topic) return null;
  const gap = listeningGapMs(level);
  if (kind === 'i' || kind === 'k') {
    const item = 'items' in topic ? topic.items[idx] : topic.kenalanGame[idx];
    if (!item) return null;
    // Kalimat tes khusus (pengecoh ikut disebut) kalau ada — lihat types.ts `test`.
    const line = item.test?.en ?? item.example.en;
    const { options, layout } = listenOpts(item.question.options.map((o) => ({ emoji: o.emoji, label: o.text, ok: o.ok })));
    const ok = item.question.options.find((o) => o.ok);
    return {
      kind: 'choice',
      id,
      topicId,
      badge: '🎧 Dengar & Jawab',
      body: `<p class="reading-question">${escapeHtml(item.question.en)}</p>`,
      play: () => speakSequence([line, item.question.en], gap),
      autoPlay: true,
      options,
      layout,
      answerText: ok?.text ?? '',
      sayAnswer: () => speak(line),
    };
  }
  if (kind === 's' && !('items' in topic)) {
    const q = topic.question;
    const raw = withDecoysEven(q.opts, q.decoys ?? [], (o) => o.lbl ?? '', (o) => !!o.ok, topic.story.join(' '), (d) => ({ ...d, ok: false })).map((o) => ({ emoji: o.emoji, label: o.lbl ?? o.emoji, ok: !!o.ok }));
    const labeled = raw.every((o) => o.label && o.label !== o.emoji);
    const options = shuffle(raw).map((o) => ({ emoji: o.emoji, label: labeled ? o.label : undefined, ok: o.ok }));
    const voices = topic.storyVoices;
    const lines = [...topic.story, q.en];
    return {
      kind: 'choice',
      id,
      topicId,
      badge: '🌟 Dengar Cerita',
      body: `<p class="reading-question">${escapeHtml(q.en)}</p>`,
      play: () =>
        voices?.length
          ? speakDialogue(lines.map((text, i) => ({ text, gender: voices[i] ?? 'female' })), gap)
          : speakSequence(lines, gap),
      autoPlay: true,
      playLabel: '🔊 Dengar Cerita',
      options,
      layout: 'cards',
      answerText: raw.find((o) => o.ok)?.label ?? '',
    };
  }
  if (kind === 'g' && 'noteGaps' in topic) {
    const g = topic.noteGaps[idx];
    if (!g) return null;
    const passage = topic.notePassage;
    const text = passage.map((l) => l.en).join(' ');
    const labels = shuffle(withDecoysEven(g.options, g.decoys ?? [], (s) => s, (o) => o === g.answer, text, (d) => d));
    const withSpeaker = passage.every((l) => l.speaker);
    const genders = withSpeaker ? dialogueGenders(passage.map((l) => ({ speaker: l.speaker!, en: l.en, id: l.id }))) : null;
    return {
      kind: 'choice',
      id,
      topicId,
      badge: '📝 Lengkapi Catatan',
      body: `
        <div class="note-card"><div class="note-heading">${escapeHtml(topic.noteHeading)}</div>
          <div class="note-line"><span class="note-label">${g.emoji} ${escapeHtml(g.label)}:</span> <span class="note-blank">______</span></div>
        </div>
        <p class="reading-question">${escapeHtml(g.question)}</p>`,
      play: () =>
        genders
          ? speakDialogue(passage.map((l) => ({ text: l.en, gender: genders.get(l.speaker!) ?? 'female' })), gap)
          : speakSequence(passage.map((l) => l.en), gap),
      autoPlay: true,
      playLabel: '🔊 Dengar Percakapan',
      options: labels.map((l) => ({ label: l, ok: l === g.answer })),
      layout: 'list',
      answerText: g.answer,
    };
  }
  if (kind === 'q' && 'inferenceQuestions' in topic) {
    const q = topic.inferenceQuestions[idx];
    if (!q) return null;
    const lines: ListeningDialogueLine[] = topic.dialogueLines;
    const genders = dialogueGenders(lines);
    const opts = shuffle(withDecoysEven(q.options, q.decoys ?? [], (o) => o.text, (o) => o.ok, lines.map((l) => l.en).join(' '), (d) => ({ ...d, ok: false })));
    return {
      kind: 'choice',
      id,
      topicId,
      badge: '🧩 Dengar & Simpulkan',
      body: `<div class="note-card"><div class="note-heading">${escapeHtml(topic.dialogueHeading)}</div></div><p class="reading-question">${escapeHtml(q.question)}</p>`,
      play: () => speakDialogue(lines.map((l) => ({ text: l.en, gender: genders.get(l.speaker) ?? 'female' })), gap),
      autoPlay: true,
      playLabel: '🔊 Dengar Percakapan',
      options: opts.map((o) => ({ label: `${o.emoji} ${o.text}`, ok: o.ok })),
      layout: 'list',
      answerText: opts.find((o) => o.ok)?.text ?? '',
    };
  }
  return null;
}

const READ_STOP = new Set(['the', 'and', 'but', 'with', 'this', 'that', 'there', 'they', 'them', 'then', 'have', 'has', 'had', 'was', 'were', 'are', 'for', 'from', 'you', 'your', 'she', 'her', 'his', 'him', 'our', 'its', 'not', 'very', 'can', 'will', 'into', 'onto', 'too', 'also', 'what', 'when', 'who', 'how', 'why']);

const NUMBER_WORDS = new Set(['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'twenty', 'thirty', 'fifty', 'hundred']);

/** Pengecoh "Lengkapi Cerita"/"Tunjuk Rujukan": kata dari teks yang SAMA
 *  (anak tetap harus membaca), TAPI (1) bukan dari baris bukti — kata di
 *  baris bukti paling mungkin ikut cocok mengisi rumpang, (2) jenisnya
 *  dicocokkan: nama (huruf besar) ↔ nama, angka ↔ angka, kata biasa ↔
 *  kata biasa, supaya pengecoh tidak langsung ketahuan dari bentuknya. */
function gapDistractors(x: ReadingText, word: string, q: string, evidence: number[] = []): string[] {
  const w = word.toLowerCase();
  const kindOf = (raw: string): string => (NUMBER_WORDS.has(raw.toLowerCase().split('-')[0]) || /^\d/.test(raw) ? 'num' : /^[A-Z]/.test(raw) ? 'name' : 'word');
  const want = kindOf(word);
  const inQ = new Set(q.toLowerCase().replace(/[^a-z' ]/g, ' ').split(/\s+/));
  const tokens = (lines: number[]) =>
    lines.flatMap((li) => {
      const l = x.lines[li];
      if (!l) return [];
      const t = x.genre === 'dialog' && l.en.indexOf(': ') > 0 ? l.en.slice(l.en.indexOf(': ') + 2) : l.en;
      // Kata pertama kalimat berhuruf besar krn posisi, bukan nama → huruf kecil.
      return t.replace(/[^A-Za-z0-9'\- ]/g, ' ').split(/\s+/).filter((raw) => raw && raw !== '-').map((raw, i) => (i === 0 ? raw.toLowerCase() : raw));
    });
  const evidenceWords = new Set(tokens(evidence).map((t) => t.toLowerCase()));
  const other = x.lines.map((_, i) => i).filter((i) => !evidence.includes(i));
  const pick = (pool: string[], sameKind: boolean): string[] => {
    const uniq = new Map<string, string>();
    for (const raw of pool) {
      const k = raw.toLowerCase();
      if (k.length < 3 || READ_STOP.has(k) || k.includes("'") || k === w || inQ.has(k) || uniq.has(k) || evidenceWords.has(k)) continue;
      if (sameKind && kindOf(raw) !== want) continue;
      uniq.set(k, raw);
    }
    return shuffle([...uniq.values()]);
  };
  const out = pick(tokens(other), true);
  if (out.length < 3) out.push(...pick(tokens(other), false).filter((t) => !out.includes(t)));
  return out.slice(0, 3);
}

function readingQ(level: LevelKey, id: string, topicId: string, set: string, xi: number, qi: number): BossChoiceQ | null {
  const topic = ((READING_TOPICS_BY_LEVEL[level] ?? []) as AnyReadingTopic[]).find((t) => t.id === topicId);
  const x = (set === 'n' ? topic?.newTexts : topic?.texts)?.[xi];
  const raw = x?.questions[qi];
  if (!topic || !x || !raw) return null;
  const q = evenPictureQuestion(x, raw);
  const k = q.kind ?? 'text';
  const young = level === 'little-stars' || level === 'starter';
  const answer = q.options[q.answer] ?? '';
  if (k === 'picture') {
    const line = x.lines[q.about ?? 0];
    return {
      kind: 'choice',
      id,
      topicId,
      badge: '📖 Baca & Tunjuk',
      body: `<p class="reading-question">Baca, lalu pilih gambarnya.</p><div class="en-text">${escapeHtml(line.en)}</div>`,
      play: young ? () => speak(line.en) : undefined,
      options: shuffle(q.options.map((e, i) => ({ emoji: e, ok: i === q.answer }))),
      layout: 'cards',
      answerText: line.en,
    };
  }
  if (k === 'truefalse') {
    return {
      kind: 'choice',
      id,
      topicId,
      badge: '🤔 Benar atau Salah?',
      body: `<div class="boss-pic" aria-hidden="true">${picHtml(q.picture)}</div><div class="en-text">${escapeHtml(q.q)}</div>`,
      play: young ? () => speak(q.q) : undefined,
      options: [
        { label: '✅ Benar', ok: q.answer === 0 },
        { label: '❌ Salah', ok: q.answer === 1 },
      ],
      layout: 'tf',
      answerText: q.answer === 0 ? 'Benar' : 'Salah',
    };
  }
  const card = textCardHtml(x, k === 'reply' || k === 'missing' ? { hide: q.hide } : {});
  if (k === 'gap' || k === 'ref') {
    const word = q.word ?? '';
    const labels = shuffle([word, ...gapDistractors(x, word, q.q, q.evidence)]);
    return {
      kind: 'choice',
      id,
      topicId,
      badge: k === 'gap' ? '🧩 Lengkapi Cerita' : '🔗 Tunjuk Rujukan',
      body: `${card}<p class="reading-question">${escapeHtml(q.q)}</p>`,
      options: labels.map((l) => ({ label: l, ok: l === word })),
      layout: 'list',
      answerText: word,
    };
  }
  const badge = k === 'reply' ? '🗨️ Pilih Jawaban Dialog' : k === 'missing' ? '🧩 Kalimat yang Hilang' : k === 'tfn' ? '✅ Cek Pernyataan' : '🔎 Baca & Jawab';
  const tfnLabel = (s: string) => (s === 'True' ? '✅ True' : s === 'False' ? '❌ False' : `🤷 ${s}`);
  const idxs = k === 'tfn' ? q.options.map((_, i) => i) : shuffle(q.options.map((_, i) => i));
  return {
    kind: 'choice',
    id,
    topicId,
    badge,
    body: `${card}<p class="reading-question">${escapeHtml(q.q)}</p>`,
    options: idxs.map((i) => ({ label: k === 'tfn' ? tfnLabel(q.options[i]) : q.options[i], ok: i === q.answer })),
    layout: 'list',
    answerText: answer,
  };
}

/** Kosongkan kemunculan PERTAMA `key` (kata utuh) — null kalau tidak ketemu. */
function blankFirst(sentence: string, key: string): string | null {
  const re = new RegExp(`\\b${key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
  return re.test(sentence) ? sentence.replace(re, '___') : null;
}

function grammarQ(level: LevelKey, id: string, topicId: string, rest: string[]): BossChoiceQ | null {
  const topic = ((GRAMMAR_TOPICS_BY_LEVEL[level] ?? []) as AnyGrammarTopic[]).find((t) => t.id === topicId);
  if (!topic) return null;
  if ('items' in topic) {
    const item = topic.items[Number(rest[0])];
    if (!item) return null;
    const wantB = rest[1] === 'B';
    const form = wantB ? item.formB : item.formA;
    const visual = topic.contrastVisual ?? 'quantity';
    const labeled = LABELED_VISUALS.has(visual);
    const other = shuffle(topic.items.filter((o) => o !== item && o.emoji !== item.emoji))[0];
    const cards = [
      { it: item, b: false },
      { it: item, b: true },
      ...(other ? [{ it: other, b: false }, { it: other, b: true }] : []),
    ];
    return {
      kind: 'choice',
      id,
      topicId,
      badge: '👂 Dengar & Tunjuk',
      body: `<p class="reading-question">Dengar kalimatnya, lalu pilih gambar yang cocok.</p>`,
      play: () => speak(form.en),
      autoPlay: true,
      options: shuffle(cards).map((c) => ({
        html: `${contrastVisualInner(c.it.emoji, c.b, visual, 1.15, !labeled)}${labeled ? `<span class="pattern-card-label">${choiceLabel(topic, c.it, c.b)}</span>` : ''}`,
        ok: c.it === item && c.b === wantB,
      })),
      layout: 'cards',
      answerText: form.en,
      sayAnswer: () => speak(form.en),
    };
  }
  if ('transforms' in topic) {
    const t = topic.transforms[Number(rest[0])];
    if (!t) return null;
    const ui = transformUi(topic);
    const reported = t.reportedOptions.find((o) => o.ok)?.text ?? '';
    if (rest[1] === 'rev') {
      const opts = shuffle([t.original, ...t.originalOptions]);
      return {
        kind: 'choice',
        id,
        topicId,
        badge: ui.tantangan,
        body: `<div class="en-text">${escapeHtml(reported)}</div><p class="reading-question">${ui.tantanganAsk}</p>`,
        options: opts.map((o) => ({ label: escapeHtml(sourceText(t, o)), ok: o === t.original })),
        layout: 'list',
        answerText: sourceText(t),
      };
    }
    return {
      kind: 'choice',
      id,
      topicId,
      badge: ui.latihan,
      body: `<div class="en-text">${escapeHtml(sourceText(t))}</div><p class="reading-question">Pilih kalimat yang benar.</p>`,
      options: shuffle(t.reportedOptions).map((o) => ({ label: escapeHtml(o.text), ok: o.ok })),
      layout: 'list',
      answerText: reported,
    };
  }
  const showMeaning = !!topic.meaningNeeded || level === 'explorer';
  if (rest[0] === 'x') {
    const tx = (topic.texts ?? [])[Number(rest[1])];
    if (!tx) return null;
    const last = tx.en[tx.en.length - 1];
    const blanked = blankFirst(last, tx.key);
    if (!blanked) return null;
    return {
      kind: 'choice',
      id,
      topicId,
      badge: '📖 Baca Dulu, Lalu Pilih',
      body: `<div class="rt-card"><div class="rt-line">${[...tx.en.slice(0, -1), blanked].map(escapeHtml).join(' ')}</div></div>`,
      options: shuffle([tx.key, ...tx.wrong]).map((w) => ({ label: escapeHtml(w), ok: w === tx.key })),
      layout: 'list',
      answerText: tx.key,
    };
  }
  const st = topic.sentences[Number(rest[1])];
  const blanked = st ? blankFirst(st.en, st.key) : null;
  if (!st || !blanked) return null;
  return {
    kind: 'choice',
    id,
    topicId,
    badge: '🔎 Pilih Bentuk yang Pas',
    body: `<div class="en-text">${escapeHtml(blanked)}</div>${showMeaning ? `<div class="id-text">${escapeHtml(st.id)}</div>` : ''}`,
    options: shuffle([st.key, ...st.wrong]).map((w) => ({ label: escapeHtml(w), ok: w === st.key })),
    layout: 'list',
    answerText: st.key,
    sayAnswer: () => speak(st.en),
  };
}

function speakingQ(level: LevelKey, id: string, topicId: string, kind: string, idx: number): BossSpeakQ | null {
  const topic = ((SPEAKING_TOPICS_BY_LEVEL[level] ?? []) as AnySpeakingTopic[]).find((t) => t.id === topicId);
  if (!topic) return null;
  const say = (en: string, idText: string, emoji?: string): string =>
    `${emoji ? `<div class="boss-pic" aria-hidden="true">${picHtml(emoji)}</div>` : ''}<div class="en-text">"${escapeHtml(en)}"</div><div class="id-text">${escapeHtml(idText)}</div>`;
  if (kind === 'p' && 'items' in topic) {
    const it = topic.items[idx];
    if (!it) return null;
    return { kind: 'speak', id, topicId, badge: '🎤 Tirukan', body: say(it.phrase.en, it.phrase.id, it.phrase.emoji || it.emoji), target: it.phrase.en, play: () => speak(it.phrase.en), autoPlay: true, showTarget: true };
  }
  if (kind === 't' && 'turns' in topic) {
    const turn = topic.turns[idx];
    if (!turn) return null;
    const ans = turn.choices?.[0] ?? { en: turn.peerAnswer.en, id: turn.peerAnswer.id };
    return {
      kind: 'speak',
      id,
      topicId,
      badge: '💬 Jawab Pertanyaan',
      body: `<p class="reading-question">${escapeHtml(turn.question.en)}</p><p class="meta">Ucapkan jawaban ini:</p>${say(ans.en, ans.id, turn.emoji)}`,
      target: ans.en,
      play: () => speak(turn.question.en),
      autoPlay: true,
      showTarget: true,
    };
  }
  if (kind === 'c' && 'stories' in topic) {
    const s = topic.stories[idx];
    if (!s) return null;
    return {
      kind: 'speak',
      id,
      topicId,
      badge: '🕵️ Cerita & Jawab',
      body: `<div class="rt-card">${s.lines.map((l) => `<div class="rt-line">${escapeHtml(l.en)}</div>`).join('')}</div><p class="reading-question">${escapeHtml(s.question.en)}</p>`,
      target: s.answer.en,
      play: () => speakSequence([...s.lines.map((l) => l.en), s.question.en], listeningGapMs(level)),
      autoPlay: true,
      showTarget: false,
    };
  }
  if ('drill' in topic) {
    if (kind === 'd') {
      const l = topic.drill[idx];
      if (!l) return null;
      return { kind: 'speak', id, topicId, badge: '🎤 Tirukan', body: say(l.en, l.id, l.emoji), target: l.en, play: () => speak(l.en), autoPlay: true, showTarget: true };
    }
    const r = topic.roleplay[idx];
    if (!r) return null;
    return {
      kind: 'speak',
      id,
      topicId,
      badge: '💬 Jawab Pertanyaan',
      body: `<p class="reading-question">${escapeHtml(r.q.en)}</p><p class="meta">Ucapkan jawaban ini:</p>${say(r.answer.en, r.answer.id, r.answer.emoji ?? r.emoji)}`,
      target: r.answer.en,
      play: () => speak(r.q.en),
      autoPlay: true,
      showTarget: true,
    };
  }
  return null;
}

