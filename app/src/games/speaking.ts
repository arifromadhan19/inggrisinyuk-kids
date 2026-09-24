import type { AnySpeakingTopic, LevelKey, OnDone, SpeakingLine, SpeakingPhraseItem, SpeakingPhraseTopic } from '../types';
import { setHandlers } from '../interaction';
import type { LatihanPlanSlot } from '../progress';
import {
  ensureSection,
  firstUnansweredSlot,
  getSlot,
  hasWordInteraction,
  markSlotAnswered,
  markWordInteraction,
  recordEvent,
  requestSync,
  resetSectionPlan,
  setSectionCursor,
} from '../progress';
import {
  listenAndRecordOnce,
  normalize,
  playCorrectTone,
  playTryAgainTone,
  speak,
  speakSequence,
  sttSupported,
  wordMatchDetail,
} from '../speech';
import { pickEncourage, pickPraise } from '../praise';
import { fireConfetti } from '../confetti';
import { shuffle } from '../util';

/**
 * ================================================================
 * Speaking — SATU alur untuk SEMUA level (`materi/speaking.md` §18–§19,
 * permintaan user "format dan alur konsisten di setiap level speaking").
 * Pola PPP (Presentation → Practice → Production), riset Cambridge YLE:
 *   1. Kenalan      — 🔊 dengar + 🎤 tirukan tiap kalimat (tanpa 🎮: "dengar &
 *                     tunjuk" itu tugas Listening, anak tidak bicara).
 *   2. Latihan Inti — terkontrol, jawaban pasti: "🔁 Tirukan" + "🧩 Lengkapi
 *                     Kalimat" (kalimat berlubang + arti, ucapkan UTUH).
 *   3. Tantangan    — "💬 Ngobrol Yuk!": anak menjawab pertanyaan dgn kata²
 *                     sendiri, TANPA audio pertanyaan (tugas dibaca dari layar).
 *
 * 4 bentuk data (`AnySpeakingTopic`) tetap ada — beda isi per level — tapi
 * `flowOf()` mengubah semuanya jadi 1 bentuk (baris Kenalan, kalimat latihan,
 * pertanyaan Tantangan), jadi layar & aturan interaksinya identik di 6 level.
 *
 * Yang BEDA per level = isi materi + setelan tier (`materi/pembeda_level.md`
 * § Speaking): ambang bintang (#1), target panjang jawaban (#2), bonus kata
 * penghubung (#3), 💡 Petunjuk terkunci sampai 1x coba (#4), jangkar
 * Indonesia (#5), kecepatan contoh (#6, lewat `speakingDefaultRate` di
 * `app.ts`), waktu berpikir mic (#7). Semua dari `contentLevel` (level
 * topik yang tampil), BUKAN `level` (badge anak, cuma utk bahasa pujian).
 *
 * Aturan Wajib Speaking tetap: skor proporsional + "▶️ Play Suaramu" di tiap
 * mic, bintang minimal 1, "Coba Lagi"/"Lanjut" selalu ada. Skor mic TIDAK
 * masuk `recordAttempt` (ASR anak tidak selalu akurat).
 * ================================================================
 */

type SpeakTier = 'dasar' | 'menengah' | 'lanjut';

function tierOf(level: LevelKey): SpeakTier {
  if (level === 'little-stars' || level === 'starter') return 'dasar';
  if (level === 'explorer' || level === 'adventurer') return 'menengah';
  return 'lanjut';
}

/** #6 — kecepatan default contoh suara (pill kecepatan user tetap menang). */
export function speakingDefaultRate(level: LevelKey): 0.75 | 1 {
  return level === 'little-stars' || level === 'starter' || level === 'explorer' ? 0.75 : 1;
}

/** #1 — ambang ⭐⭐⭐ / ⭐⭐. Dasar lebih longgar (ASR suara anak kecil paling
 *  meleset & Starters cuma minta 1 kata). Lanjut SENGAJA tidak diperketat:
 *  skor ini mengukur kata yang dikenali ASR, bukan pelafalan. */
const STAR_CUTS: Record<SpeakTier, [number, number]> = { dasar: [0.6, 0.3], menengah: [0.8, 0.4], lanjut: [0.8, 0.4] };

/** #7 — jeda hening sebelum mic berhenti (ms). */
const SILENCE_MS: Record<SpeakTier, number> = { dasar: 2000, menengah: 1600, lanjut: 1300 };

/** #2 — target panjang jawaban bebas di Tantangan (kata). 0 = tidak ada. */
const TARGET_WORDS: Record<LevelKey, number> = {
  'little-stars': 0,
  starter: 0,
  explorer: 4,
  adventurer: 8,
  achiever: 12,
  trailblazer: 18,
};

/** #3 — kata penghubung yang diberi bonus di tier Lanjut. */
const CONNECTORS = ['because', 'and', 'but', 'so', 'then', 'however', 'also', 'although', 'when', 'if'];

const micOpts = (level: LevelKey) => ({ silenceMs: SILENCE_MS[tierOf(level)] });

/* ------------------------------------------------------------------ */
/* Bentuk data seragam                                                 */
/* ------------------------------------------------------------------ */

interface KenalanRow {
  emoji: string;
  /** Baris cerita (format cerita) — ditampilkan kecil di atas kalimat. */
  context?: SpeakingLine[];
  /** Pertanyaan yang dijawab kalimat ini (cerita/interview). */
  prompt?: SpeakingLine;
  /** Nama pembicara kalimat (interview: "Bima"). */
  speaker?: string;
  line: SpeakingLine;
}

interface PracticeItem {
  emoji: string;
  line: SpeakingLine;
  /** Bagian sebelum/sesudah kata yang dilubangi utk "🧩 Lengkapi Kalimat". */
  blank: { before: string; after: string } | null;
}

/** 'target' = kalimat/kata pasti (rasio kata target). 'keywords' = jawaban
 *  sudah tertentu isinya tapi susunannya bebas (rasio kata ISI). 'free' =
 *  jawaban pribadi (rasio panjang thd target level + bonus penghubung). */
type Scoring = 'target' | 'keywords' | 'free';

interface TalkTurn {
  kind: 'name' | 'answer';
  question: SpeakingLine;
  answer: SpeakingLine;
  scoring: Scoring;
}

interface TalkPrompt {
  emoji: string;
  context?: SpeakingLine[];
  turns: TalkTurn[];
}

interface SpeakingFlow {
  rows: KenalanRow[];
  practice: PracticeItem[];
  prompts: TalkPrompt[];
  /** Jumlah soal Tantangan (pertanyaan diulang/diacak sampai jumlah ini). */
  tantanganCount: number;
  shufflePrompts: boolean;
}

const LATIHAN_COUNT = 10;
const LATIHAN_POLA_COUNT = 5;
const SECTION_LATIHAN = 'latihan-pola';
const SECTION_TANTANGAN = 'tantangan-ngobrol';

/** Kata fungsi: tidak dijadikan lubang "Lengkapi Kalimat" & tidak dihitung
 *  sbg kata kunci jawaban (anak boleh menyusun kalimatnya sendiri). */
const STOPWORDS = new Set([
  'the', 'a', 'an', 'is', 'am', 'are', 'was', 'were', 'be', 'being', 'i', 'my', 'me', 'your', 'you', 'it', 'its',
  'he', 'she', 'his', 'her', 'we', 'our', 'they', 'their', 'them', 'this', 'that', 'these', 'those', 'to', 'in',
  'on', 'at', 'of', 'with', 'for', 'from', 'by', 'so', 'and', 'but', 'or', 'can', 'do', 'does', 'have', 'has',
  'when', 'very', 'too', 'also', 'because', 'will', 'would', 'what', 'there',
]);

function talkKeywords(text: string): string {
  const words = normalize(text).split(' ').filter((w) => w && !STOPWORDS.has(w));
  return words.length ? words.join(' ') : text;
}

function splitAt(text: string, index: number, length: number): { before: string; after: string } {
  return { before: text.slice(0, index), after: text.slice(index + length) };
}

/** Lubang di kata kunci item (terima bentuk jamak: grape→grapes,
 *  mango→mangoes, strawberry→strawberries). */
function keywordBlank(text: string, keyword: string): { before: string; after: string } | null {
  const base = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const variants = [base.replace(/y$/i, 'ies'), `${base}es`, `${base}s`, base];
  const m = new RegExp(`\\b(${variants.join('|')})\\b`, 'i').exec(text);
  return m ? splitAt(text, m.index, m[0].length) : null;
}

/** Lubang otomatis di kata ISI terpanjang (bukan kata fungsi) — dipakai
 *  kalimat yang tidak punya kata kunci eksplisit (format lama, interview,
 *  cerita). Jangkar jawabannya = arti Indonesia kalimat yang tampil. */
const BLANK_SKIP = new Set([
  'how', 'where', 'who', 'why', 'which', 'hello', 'please', 'thanks', 'thank', 'sometimes', 'should', 'every',
  'usually', 'always', 'never', 'then', 'about', 'after', 'before', 'some', 'many', 'much', 'more', 'most', 'not',
  'think', 'believe', 'opinion', 'like', 'want', 'really',
]);

function autoBlank(text: string): { before: string; after: string } | null {
  let best: RegExpExecArray | null = null;
  let bestIsName = true;
  const re = /[A-Za-z]+/g;
  for (let m = re.exec(text); m; m = re.exec(text)) {
    const lower = m[0].toLowerCase();
    if (m[0].length < 3 || STOPWORDS.has(lower) || BLANK_SKIP.has(lower)) continue;
    // Kata berhuruf kapital di tengah kalimat = nama (Andi, Bima) — jangan
    // dijadikan lubang kalau ada kata biasa (nama tidak bisa ditebak dari arti).
    const isName = m.index > 0 && m[0][0] !== lower[0];
    if (!best || (bestIsName && !isName) || (isName === bestIsName && m[0].length >= best[0].length)) {
      best = m;
      bestIsName = isName;
    }
  }
  return best ? splitAt(text, best.index, best[0].length) : null;
}

function phraseItemBlank(it: SpeakingPhraseItem): { before: string; after: string } | null {
  return keywordBlank(it.phrase.en, it.en) ?? autoBlank(it.phrase.en);
}

function flowOf(topic: AnySpeakingTopic): SpeakingFlow {
  if ('items' in topic) {
    return {
      rows: topic.items.map((it) => ({ emoji: it.emoji, line: it.phrase })),
      practice: topic.items.map((it) => ({ emoji: it.emoji, line: it.phrase, blank: phraseItemBlank(it) })),
      prompts: topic.items.map((it) => ({
        emoji: it.emoji,
        turns: [
          { kind: 'name', question: topic.talk.nameQ, answer: { en: it.en, id: it.id }, scoring: 'target' },
          { kind: 'answer', question: topic.talk.followQ, answer: it.phrase, scoring: 'keywords' },
        ],
      })),
      tantanganCount: topic.items.length,
      shufflePrompts: true,
    };
  }
  if ('turns' in topic) {
    return {
      rows: topic.turns.map((t) => ({ emoji: '', prompt: t.question, speaker: topic.peerName, line: t.peerAnswer })),
      practice: topic.turns.map((t) => ({ emoji: '', line: t.peerAnswer, blank: autoBlank(t.peerAnswer.en) })),
      prompts: topic.turns.map((t) => ({
        emoji: '',
        turns: [{ kind: 'answer', question: t.question, answer: t.peerAnswer, scoring: 'free' }],
      })),
      tantanganCount: topic.turns.length,
      shufflePrompts: false,
    };
  }
  if ('stories' in topic) {
    return {
      rows: topic.stories.map((s) => ({ emoji: s.emoji, context: s.lines, prompt: s.question, line: s.answer })),
      practice: topic.stories.flatMap((s) =>
        [...s.lines, s.answer].map((line) => ({ emoji: s.emoji, line, blank: autoBlank(line.en) }))
      ),
      prompts: topic.stories.map((s) => ({
        emoji: s.emoji,
        context: s.lines,
        turns: [{ kind: 'answer', question: s.question, answer: s.answer, scoring: 'keywords' }],
      })),
      tantanganCount: topic.stories.length,
      shufflePrompts: false,
    };
  }
  const lines = [...topic.model, ...topic.drill];
  return {
    rows: lines.map((line) => ({ emoji: '', line })),
    practice: lines.map((line) => ({ emoji: '', line, blank: autoBlank(line.en) })),
    prompts: topic.roleplay.map((r) => ({
      emoji: '',
      turns: [{ kind: 'answer', question: r.q, answer: r.answer, scoring: 'free' }],
    })),
    tantanganCount: Math.max(LATIHAN_COUNT, topic.roleplay.length),
    shufflePrompts: false,
  };
}

/** Jumlah soal Latihan Inti & Tantangan 1 topik — dipakai `app.ts`
 *  `topicProgressPercent` (`speakingTopicPercent`, pola sama Vocab/Listening). */
export function speakingSlotTotals(topic: AnySpeakingTopic, contentLevel: LevelKey): { latihan: number; tantangan: number; bertanya: number } {
  return { latihan: LATIHAN_COUNT, tantangan: flowOf(topic).tantanganCount, bertanya: bertanyaCount(topic, contentLevel) };
}

/* ------------------------------------------------------------------ */
/* Skor                                                                */
/* ------------------------------------------------------------------ */

interface MicScore {
  hitRatio: number;
  stars: 1 | 2 | 3;
  perfect: boolean;
  starRow: string;
  wordsHtml: string;
  /** Baris angka di bawah bintang (netral, bukan headline). */
  scoreLine: string;
  /** Lencana tambahan (panjang jawaban / kata penghubung). */
  extraHtml: string;
}

function starsFrom(ratio: number, level: LevelKey): 1 | 2 | 3 {
  const [hi, mid] = STAR_CUTS[tierOf(level)];
  return ratio >= hi ? 3 : ratio >= mid ? 2 : 1;
}

function finishScore(ratio: number, stars: 1 | 2 | 3, wordsHtml: string, scoreLine: string, extraHtml = ''): MicScore {
  return {
    hitRatio: ratio,
    stars,
    perfect: stars === 3,
    starRow: '⭐'.repeat(stars) + '☆'.repeat(3 - stars),
    wordsHtml,
    scoreLine,
    extraHtml,
  };
}

/** Skor proporsional thd teks target (`wordMatchDetail`, bukan biner). */
function scoreMic(said: string, target: string, level: LevelKey, unit = 'kata'): MicScore {
  const words = wordMatchDetail(said, target);
  const matched = words.filter((w) => w.matched).length;
  const ratio = words.length ? matched / words.length : 0;
  return finishScore(
    ratio,
    starsFrom(ratio, level),
    words.map((w) => `<span class="${w.matched ? 'ok' : 'miss'}">${w.word}</span>`).join(''),
    `🎯 ${matched} dari ${words.length} ${unit} kedengaran <span class="mic-score-pct">(${Math.round(ratio * 100)}%)</span>`
  );
}

function connectorsIn(said: string): string[] {
  const heard = new Set(normalize(said).split(' '));
  return CONNECTORS.filter((c) => heard.has(c));
}

function lengthBadge(said: string, level: LevelKey): string {
  const target = TARGET_WORDS[level];
  if (!target) return '';
  const n = normalize(said).split(' ').filter(Boolean).length;
  return `<span class="talk-badge${n >= target ? ' ok' : ''}">🗣️ ${n} kata${n >= target ? ' ✓' : ` · target ${target}`}</span>`;
}

function connectorBadge(said: string, level: LevelKey): string {
  if (tierOf(level) !== 'lanjut') return '';
  const found = connectorsIn(said);
  return found.length ? `<span class="talk-badge ok">🔗 Pakai "${found[0]}" — keren!</span>` : '';
}

/** Jawaban pribadi: tidak ada kalimat target, jadi yang diukur kelengkapan
 *  (panjang thd target level) + bonus 1 ⭐ kalau pakai kata penghubung (Lanjut). */
function scoreFree(said: string, level: LevelKey): MicScore {
  const words = normalize(said).split(' ').filter(Boolean);
  const target = TARGET_WORDS[level] || 4;
  const ratio = Math.min(1, words.length / target);
  let stars = starsFrom(ratio, level);
  if (tierOf(level) === 'lanjut' && connectorsIn(said).length && stars < 3) stars = (stars + 1) as 2 | 3;
  return finishScore(
    ratio,
    stars,
    words.map((w) => `<span class="ok">${w}</span>`).join(''),
    '',
    lengthBadge(said, level) + connectorBadge(said, level)
  );
}

function scoreTurn(said: string, turn: TalkTurn, level: LevelKey): MicScore {
  if (turn.scoring === 'free') return scoreFree(said, level);
  if (turn.scoring === 'target') return scoreMic(said, turn.answer.en, level);
  const s = scoreMic(said, talkKeywords(turn.answer.en), level, 'kata kunci');
  s.extraHtml = lengthBadge(said, level) + connectorBadge(said, level);
  return s;
}

/* ------------------------------------------------------------------ */
/* Helper UI (duplikat lokal, konvensi file game lain)                 */
/* ------------------------------------------------------------------ */

function roundActionsHtml(isLast: boolean): string {
  return `
    <div class="round-actions">
      <button class="ghost-btn" type="button" data-action="tryAgainRound">🔁 Coba Lagi</button>
      <button class="primary-btn" type="button" data-action="nextRound" style="margin-top:0">${isLast ? 'Selesai ✅' : 'Lanjut ➡️'}</button>
    </div>`;
}

function quizNavHtml(current: number, total: number, statusOf: (i: number) => 0 | 1 | 2): string {
  const dots = Array.from({ length: total }, (_, i) => {
    const cls = [i === current ? 'current' : '', statusOf(i) === 2 ? 'done' : ''].filter(Boolean).join(' ');
    return `<button type="button" class="quiz-dot ${cls}" data-action="quizJump" data-payload="${i}" aria-label="Ke soal ${i + 1}">${i + 1}</button>`;
  }).join('');
  return `<div class="quiz-nav"><div class="quiz-dots">${dots}</div></div>`;
}

function wireQuizNav(goTo: (i: number) => void): void {
  setHandlers({ quizJump: (payload) => goTo(Number(payload)) });
}

/** "Selesai ✅" hanya kalau SEMUA slot sudah dikerjakan (CLAUDE.md). */
function allSlotsDone(total: number, statusOf: (i: number) => 0 | 1 | 2): boolean {
  for (let i = 0; i < total; i++) if (statusOf(i) !== 2) return false;
  return true;
}

/** "Lanjut" pindah ke slot BELUM dikerjakan berikutnya; `total` = section kelar. */
function nextUnfinishedRound(round: number, total: number, statusOf: (i: number) => 0 | 1 | 2): number {
  for (let step = 1; step <= total; step++) {
    const i = (round + step) % total;
    if (statusOf(i) !== 2) return i;
  }
  return total;
}

/** 💡 Petunjuk — `locked` (tier Lanjut, #4) = baru bisa dibuka setelah 1x coba. */
function petunjukButtonHtml(revealed: boolean, locked = false): string {
  return `<button class="speak-btn-ghost" type="button" data-action="petunjuk" ${revealed || locked ? 'disabled' : ''}${
    locked ? ' title="Coba jawab dulu, ya"' : ''
  }><span class="hint-bulb">💡</span> Petunjuk${locked ? ' 🔒' : ''}</button>`;
}

function micResultHtml(s: MicScore, said: string, answerHtml: string): string {
  return `
    <div class="${s.perfect ? 'win-burst' : ''}" style="font-size:22px;letter-spacing:3px;text-align:center;margin-top:14px" aria-hidden="true">${s.starRow}</div>
    ${s.scoreLine ? `<p class="mic-score">${s.scoreLine}</p>` : ''}
    ${s.extraHtml ? `<div class="talk-badges">${s.extraHtml}</div>` : ''}
    <div class="word-diff">${s.wordsHtml}</div>
    <div class="heard-text">Terdengar: "${said}"</div>
    ${answerHtml}
    <div class="speak-row"><button class="speak-btn" type="button" id="playMineBtn" data-action="playMine" disabled>▶️ Play Suaramu</button></div>`;
}

function emojiHtml(emoji: string): string {
  return emoji ? `<div class="big-emoji">${emoji}</div>` : '';
}

/** Plan slot tersimpan per section; dibangun ulang kalau bentuknya tidak cocok. */
function loadPlan(topicId: string, section: string, build: () => LatihanPlanSlot[], valid: (plan: LatihanPlanSlot[]) => boolean): LatihanPlanSlot[] {
  let s = ensureSection('speaking', topicId, section, build);
  if (!valid(s.plan ?? [])) {
    resetSectionPlan('speaking', topicId, section, build());
    s = ensureSection('speaking', topicId, section);
  }
  return s.plan ?? [];
}

/* ------------------------------------------------------------------ */
/* 1. Kenalan                                                          */
/* ------------------------------------------------------------------ */

export function renderKenalan(container: HTMLElement, topic: AnySpeakingTopic, onNext: OnDone, level: LevelKey, contentLevel: LevelKey): void {
  const { rows } = flowOf(topic);
  const doneCls = (i: number, action: 'listen' | 'mic'): string => (hasWordInteraction('speaking', topic.id, i, action) ? ' done' : '');

  drawList();

  function drawList(): void {
    container.innerHTML = `
      <div class="id-text" style="margin-bottom:10px;">Dengarkan dulu, tap 🔊 untuk mengulang${sttSupported ? ', lalu tap 🎤 buat coba tirukan' : ''}</div>
      <div class="primer-list">
        ${rows
          .map(
            (r, i) => `
          <div class="primer-item">
            ${r.emoji ? `<div class="primer-ic">${r.emoji}</div>` : ''}
            <div class="txt">
              ${r.context ? r.context.map((c) => `<span class="sp-ctx">${c.en}</span>`).join('') : ''}
              ${r.prompt ? `<span class="sp-q">💬 ${r.prompt.en}</span>` : ''}
              <b>${r.speaker ? `${r.speaker}: ` : ''}${r.line.en}</b><span>${r.line.id}</span>
            </div>
            <div class="mini-play${doneCls(i, 'listen')}" data-action="playRow" data-payload="${i}">🔊</div>
            ${sttSupported ? `<div class="mini-play${doneCls(i, 'mic')}" id="micMini${i}" data-action="micRow" data-payload="${i}">🎤</div>` : ''}
          </div>`
          )
          .join('')}
      </div>
      <button class="primary-btn" data-action="advance">Lanjut ke Latihan Inti →</button>
    `;
    setHandlers({
      playRow: (payload) => {
        const i = Number(payload);
        const r = rows[i];
        markWordInteraction('speaking', topic.id, i, 'listen', r.line.en);
        speakSequence([...(r.context ?? []).map((c) => c.en), ...(r.prompt ? [r.prompt.en] : []), r.line.en]);
        drawList();
      },
      micRow: (payload) => {
        const i = Number(payload);
        markWordInteraction('speaking', topic.id, i, 'mic', rows[i].line.en);
        recordEvent({ kind: 'interact', skill: 'speaking', topicId: topic.id, section: 'kenalan', slot: i, itemRef: rows[i].line.en, activity: 'mic' });
        drawList();
        micFor(i);
      },
      advance: () => onNext(),
    });
  }

  function openMicResultPopup(index: number, said: string | null, errorText: string | null): void {
    const r = rows[index];
    const overlay = document.createElement('div');
    overlay.className = 'mic-pop-overlay';
    let bodyHtml = '';
    if (said !== null) {
      const s = scoreMic(said, r.line.en, contentLevel);
      if (s.perfect) {
        playCorrectTone();
        fireConfetti();
      } else playTryAgainTone();
      recordEvent({
        kind: 'speak',
        skill: 'speaking',
        topicId: topic.id,
        section: 'kenalan',
        slot: index,
        itemRef: r.line.en,
        activity: 'mic',
        graded: false,
        score: Math.round(s.hitRatio * 100),
        detail: { heard: said },
      });
      bodyHtml = `
        <div class="${s.perfect ? 'win-burst' : ''}" style="font-size:20px;letter-spacing:3px" aria-hidden="true">${s.starRow}</div>
        <div class="word-diff" style="margin:8px 0">${s.wordsHtml}</div>
        <div class="heard-text">Terdengar: "${said}"</div>
        <div class="feedback good" style="margin-top:6px">${s.perfect ? pickPraise(level) : pickEncourage(level)}</div>
        <div class="speak-row" style="margin:12px 0 2px">
          <button class="speak-btn" type="button" id="micPopPlayMine" data-action="micPopPlayMine" disabled>▶️ Play Suaramu</button>
        </div>`;
    } else {
      bodyHtml = `<p class="meta" style="margin:10px 0">${errorText}</p>`;
    }
    overlay.innerHTML = `
      <div class="mic-pop-card">
        ${r.emoji ? `<div style="font-size:38px" aria-hidden="true">${r.emoji}</div>` : ''}
        <div class="en-text" style="margin:2px 0 10px">${r.line.en}</div>
        ${bodyHtml}
        <div class="round-actions">
          <button class="ghost-btn" type="button" data-action="micPopTryAgain">🔁 Coba Lagi</button>
          <button class="primary-btn" type="button" data-action="micPopClose" style="margin-top:0">Lanjut ➡️</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
    setHandlers({
      micPopClose: () => overlay.remove(),
      micPopTryAgain: () => {
        overlay.remove();
        micFor(index);
      },
      micPopPlayMine: () => {
        const url = overlay.dataset.audioUrl;
        if (url) new Audio(url).play().catch(() => {});
      },
    });
  }

  function micFor(index: number): void {
    const btn = document.getElementById(`micMini${index}`);
    if (!btn || btn.classList.contains('listening')) return;
    btn.classList.add('listening');
    listenAndRecordOnce(
      (said) => {
        btn.classList.remove('listening');
        openMicResultPopup(index, said, null);
      },
      (kind) => {
        btn.classList.remove('listening');
        if (kind === 'aborted') return;
        openMicResultPopup(index, null, 'Belum kedengaran, coba lagi ya 🎧');
      },
      (audioUrl) => {
        const overlay = document.querySelector<HTMLElement>('.mic-pop-overlay');
        if (!overlay) return;
        overlay.dataset.audioUrl = audioUrl;
        const playBtn = overlay.querySelector<HTMLButtonElement>('#micPopPlayMine');
        if (playBtn) playBtn.disabled = false;
      },
      micOpts(contentLevel)
    );
  }
}

/* ------------------------------------------------------------------ */
/* 2. Latihan Inti — 🔁 Tirukan + 🧩 Lengkapi Kalimat                   */
/* ------------------------------------------------------------------ */

function buildLatihanPlan(practice: PracticeItem[]): LatihanPlanSlot[] {
  let pool: number[] = [];
  while (pool.length < LATIHAN_COUNT) pool = pool.concat(shuffle(practice.map((_, i) => i)));
  let pola = 0;
  const slots = pool.slice(0, LATIHAN_COUNT).map((item): LatihanPlanSlot => {
    if (pola < LATIHAN_POLA_COUNT && practice[item].blank) {
      pola++;
      return { kind: 'sentence', item };
    }
    return { kind: 'hear', item };
  });
  return shuffle(slots);
}

export function runLatihanInti(container: HTMLElement, topic: AnySpeakingTopic, onDone: OnDone, level: LevelKey, contentLevel: LevelKey): void {
  const { practice } = flowOf(topic);
  const plan = loadPlan(
    topic.id,
    SECTION_LATIHAN,
    () => buildLatihanPlan(practice),
    (p) => p.length === LATIHAN_COUNT && p.every((sl) => sl.item < practice.length)
  );
  const total = plan.length;
  let round = firstUnansweredSlot('speaking', topic.id, SECTION_LATIHAN, total);
  const slotStatus = (i: number): 0 | 1 | 2 => getSlot('speaking', topic.id, SECTION_LATIHAN, i)?.st ?? 0;

  function goTo(i: number): void {
    round = Math.min(Math.max(i, 0), total - 1);
    setSectionCursor('speaking', topic.id, SECTION_LATIHAN, round);
    draw();
  }

  function advance(): void {
    round = nextUnfinishedRound(round, total, slotStatus);
    setSectionCursor('speaking', topic.id, SECTION_LATIHAN, Math.min(round, total - 1));
    draw();
  }

  function draw(): void {
    if (round >= total) return onDone();
    const target = practice[plan[round].item] ?? practice[0];
    const blank = plan[round].kind === 'sentence' ? target.blank : null;
    let revealed = false;

    const speakFrame = (): void => {
      if (!blank) return;
      speakSequence([blank.before, blank.after].map((t) => t.trim()).filter(Boolean), 1400);
    };

    function paint(): void {
      const body = blank
        ? `
          <span class="stage-badge">🧩 Lengkapi Kalimat</span>
          ${quizNavHtml(round, total, slotStatus)}
          <div class="id-text">Soal ${round + 1} dari ${total}</div>
          ${emojiHtml(target.emoji)}
          <div class="en-text">${blank.before}___${blank.after}</div>
          <div class="id-text">${target.line.id}</div>
          <div class="speak-row">
            <button class="speak-btn pt-cta" type="button" data-action="replay">🔊 Dengar</button>
            ${petunjukButtonHtml(revealed)}
          </div>
          ${revealed ? `<div class="en-text">${target.line.en}</div>` : ''}`
        : `
          <span class="stage-badge">🔁 Tirukan</span>
          ${quizNavHtml(round, total, slotStatus)}
          <div class="id-text">Soal ${round + 1} dari ${total}</div>
          ${emojiHtml(target.emoji)}
          <div class="en-text">${target.line.en}</div>
          <div class="id-text">${target.line.id}</div>
          <div class="speak-row"><button class="speak-btn pt-cta" type="button" data-action="replay">🔊 Dengar Contoh</button></div>`;
      container.innerHTML = `
        ${body}
        <div class="mic-wrap">
          <button class="mic-btn" id="micBtn" type="button" data-action="mic" aria-label="Ucapkan">🎤</button>
          <div class="mic-hint">${sttSupported ? (blank ? 'Tap mic, ucapkan kalimatnya sampai lengkap' : 'Tap mic, lalu tirukan ucapannya') : 'Mikrofon tidak didukung browser ini'}</div>
        </div>
        <div id="micResult"></div>
        <div class="feedback" id="fb"></div>
        ${sttSupported ? '' : `<button class="ghost-btn" type="button" data-action="skip">✅ Aku Sudah Coba Ucapkan</button>`}
      `;
      wireQuizNav(goTo);
      setHandlers({
        replay: () => (blank ? speakFrame() : speak(target.line.en)),
        petunjuk: () => {
          if (revealed) return;
          revealed = true;
          speak(target.line.en);
          paint();
        },
        skip: () => {
          markSlotAnswered('speaking', topic.id, SECTION_LATIHAN, round, true, { itemRef: target.line.en });
          advance();
        },
        mic: () => micFor(),
      });
    }

    function micFor(): void {
      const btn = container.querySelector<HTMLElement>('#micBtn')!;
      if (btn.classList.contains('listening')) return;
      btn.classList.add('listening');
      let recordedAudioUrl: string | null = null;
      listenAndRecordOnce(
        (said) => {
          btn.classList.remove('listening');
          btn.setAttribute('disabled', 'true');
          const s = scoreMic(said, target.line.en, contentLevel);
          if (s.perfect) {
            playCorrectTone();
            fireConfetti();
          } else playTryAgainTone();
          const score = Math.round(s.hitRatio * 100);
          markSlotAnswered('speaking', topic.id, SECTION_LATIHAN, round, s.perfect, { score, itemRef: target.line.en });
          recordEvent({
            kind: 'speak',
            skill: 'speaking',
            topicId: topic.id,
            section: SECTION_LATIHAN,
            slot: round,
            itemRef: target.line.en,
            activity: blank ? 'mic-pola' : 'mic',
            graded: false,
            score,
            detail: { heard: said },
          });
          container.querySelector<HTMLElement>('#micResult')!.innerHTML = micResultHtml(
            s,
            said,
            blank ? `<div class="en-text" style="margin-top:8px">Kalimatnya: "${target.line.en}"</div>` : ''
          );
          const fb = container.querySelector<HTMLElement>('#fb')!;
          fb.textContent = s.perfect ? pickPraise(level) : pickEncourage(level);
          fb.className = 'feedback good';
          fb.insertAdjacentHTML('afterend', roundActionsHtml(allSlotsDone(total, slotStatus)));
          setHandlers({
            playMine: () => {
              if (recordedAudioUrl) new Audio(recordedAudioUrl).play().catch(() => {});
            },
            tryAgainRound: () => paint(),
            nextRound: () => advance(),
          });
        },
        (kind) => {
          btn.classList.remove('listening');
          if (kind === 'aborted') return;
          container.querySelector<HTMLElement>('#fb')!.textContent = 'Belum kedengaran, coba lagi 🎧';
        },
        (audioUrl) => {
          recordedAudioUrl = audioUrl;
          const playBtn = container.querySelector<HTMLButtonElement>('#playMineBtn');
          if (playBtn) playBtn.disabled = false;
        },
        micOpts(contentLevel)
      );
    }

    paint();
    if (blank) speakFrame();
    else speak(target.line.en);
  }

  draw();
}

/* ------------------------------------------------------------------ */
/* 3. Tantangan — 💬 Ngobrol Yuk!                                        */
/* ------------------------------------------------------------------ */

function buildTantanganPlan(flow: SpeakingFlow): LatihanPlanSlot[] {
  const idx = flow.prompts.map((_, i) => i);
  let order: number[];
  if (flow.tantanganCount === idx.length) order = flow.shufflePrompts ? shuffle(idx) : idx;
  else {
    order = [];
    while (order.length < flow.tantanganCount) order = order.concat(shuffle(idx));
    order = order.slice(0, flow.tantanganCount);
  }
  return order.map((item) => ({ kind: 'hear', item }));
}

function runNgobrol(container: HTMLElement, topic: AnySpeakingTopic, onDone: OnDone, level: LevelKey, contentLevel: LevelKey): void {
  const flow = flowOf(topic);
  const tier = tierOf(contentLevel);
  const plan = loadPlan(
    topic.id,
    SECTION_TANTANGAN,
    () => buildTantanganPlan(flow),
    (p) => p.length === flow.tantanganCount && p.every((sl) => sl.item < flow.prompts.length)
  );
  const total = plan.length;
  let round = firstUnansweredSlot('speaking', topic.id, SECTION_TANTANGAN, total);
  const slotStatus = (i: number): 0 | 1 | 2 => getSlot('speaking', topic.id, SECTION_TANTANGAN, i)?.st ?? 0;

  function goTo(i: number): void {
    round = Math.min(Math.max(i, 0), total - 1);
    setSectionCursor('speaking', topic.id, SECTION_TANTANGAN, round);
    draw();
  }

  function advance(): void {
    round = nextUnfinishedRound(round, total, slotStatus);
    setSectionCursor('speaking', topic.id, SECTION_TANTANGAN, Math.min(round, total - 1));
    draw();
  }

  function draw(): void {
    if (round >= total) return onDone();
    const prompt = flow.prompts[plan[round].item] ?? flow.prompts[0];
    let turnIdx = 0;
    let revealed = false;
    let attempted = false;
    let scoreSum = 0;

    const goNextTurn = (): void => {
      turnIdx += 1;
      revealed = false;
      attempted = false;
      paint();
    };

    function paint(): void {
      const turn = prompt.turns[turnIdx];
      const locked = tier === 'lanjut' && !attempted;
      const showQuestionId = tier !== 'lanjut' || revealed;
      const target = TARGET_WORDS[contentLevel];
      const multi = prompt.turns.length > 1;
      const taskHtml =
        turn.kind === 'name'
          ? `<div class="talk-task" aria-label="${turn.answer.id} dalam bahasa Inggris?">
              <span class="talk-chip">🇮🇩 ${turn.answer.id}</span>
              <span class="talk-arrow" aria-hidden="true">➜</span>
              <span class="talk-chip talk-chip--en">🇬🇧 ${revealed ? turn.answer.en : '?'}</span>
            </div>
            <div class="talk-instruct">Apa bahasa Inggrisnya? Ucapkan!</div>`
          : `<p class="reading-question">💬 "${turn.question.en}"</p>
            ${showQuestionId ? `<div class="id-text">${turn.question.id}</div>` : ''}
            <div class="talk-instruct">Jawab pakai kalimat bahasa Inggris, ucapkan!</div>
            ${
              turn.scoring !== 'target' && target
                ? `<div class="talk-target">🎯 Minimal ${target} kata${tier === 'lanjut' ? ' · pakai kata penghubung (because, but, so…)' : ''}</div>`
                : ''
            }`;
      container.innerHTML = `
        <span class="stage-badge">💬 Ngobrol Yuk!</span>
        ${quizNavHtml(round, total, slotStatus)}
        <div class="id-text">Soal ${round + 1} dari ${total}${multi ? ` · Pertanyaan ${turnIdx + 1} dari ${prompt.turns.length}` : ''}</div>
        ${emojiHtml(prompt.emoji)}
        ${prompt.context ? `<div class="note-card sp-story">${prompt.context.map((c) => `<p>${c.en}</p>`).join('')}</div>` : ''}
        ${taskHtml}
        <div class="speak-row">${petunjukButtonHtml(revealed, locked)}</div>
        ${locked ? '<div class="mic-hint">💡 Petunjuk terbuka setelah kamu mencoba sekali</div>' : ''}
        ${
          revealed && turn.kind === 'answer'
            ? `<div class="talk-model"><span class="talk-model-label">Contoh jawaban</span><div class="en-text">${turn.answer.en}</div><div class="id-text">${turn.answer.id}</div></div>`
            : ''
        }
        <div class="mic-wrap">
          <button class="mic-btn pt-cta" id="micBtn" type="button" data-action="mic" aria-label="Ucapkan">🎤</button>
          <div class="mic-hint">${sttSupported ? 'Tap 🎤 lalu ucapkan' : 'Mikrofon tidak didukung browser ini'}</div>
        </div>
        <div id="micResult"></div>
        <div class="feedback" id="fb"></div>
        ${sttSupported ? '' : `<button class="ghost-btn" type="button" data-action="skip">✅ Aku Sudah Jawab</button>`}
      `;
      wireQuizNav(goTo);
      // Tanpa audio pertanyaan — tugas dibaca dari layar (permintaan user).
      setHandlers({
        petunjuk: () => {
          if (revealed || (tier === 'lanjut' && !attempted)) return;
          revealed = true;
          speak(turn.answer.en);
          paint();
        },
        skip: () => {
          if (turnIdx < prompt.turns.length - 1) {
            scoreSum += 100;
            goNextTurn();
            return;
          }
          markSlotAnswered('speaking', topic.id, SECTION_TANTANGAN, round, true, { itemRef: turn.answer.en });
          advance();
        },
        mic: () => micFor(),
      });
    }

    function micFor(): void {
      const btn = container.querySelector<HTMLElement>('#micBtn')!;
      if (btn.classList.contains('listening')) return;
      btn.classList.add('listening');
      const turn = prompt.turns[turnIdx];
      const isLastTurn = turnIdx === prompt.turns.length - 1;
      let recordedAudioUrl: string | null = null;
      listenAndRecordOnce(
        (said) => {
          btn.classList.remove('listening');
          btn.setAttribute('disabled', 'true');
          attempted = true;
          const s = scoreTurn(said, turn, contentLevel);
          if (s.perfect) {
            playCorrectTone();
            fireConfetti();
          } else playTryAgainTone();
          const score = Math.round(s.hitRatio * 100);
          recordEvent({
            kind: 'speak',
            skill: 'speaking',
            topicId: topic.id,
            section: SECTION_TANTANGAN,
            slot: round,
            itemRef: turn.answer.en,
            activity: turn.kind === 'name' ? 'mic-name' : 'mic-talk',
            graded: false,
            score,
            detail: { heard: said },
          });
          // Slot baru ditandai selesai di giliran TERAKHIR, supaya "Selesai ✅"
          // tidak muncul sebelum soal ini benar² tuntas.
          if (isLastTurn) {
            markSlotAnswered('speaking', topic.id, SECTION_TANTANGAN, round, s.perfect, {
              score: Math.round((scoreSum + score) / prompt.turns.length),
              itemRef: turn.answer.en,
            });
          }
          const label = turn.scoring === 'free' ? 'Contoh jawaban' : 'Jawabannya';
          container.querySelector<HTMLElement>('#micResult')!.innerHTML = micResultHtml(
            s,
            said,
            `<div class="en-text" style="margin-top:8px">${label}: "${turn.answer.en}"</div>`
          );
          const fb = container.querySelector<HTMLElement>('#fb')!;
          fb.textContent = s.perfect ? pickPraise(level) : pickEncourage(level);
          fb.className = 'feedback good';
          fb.insertAdjacentHTML('afterend', roundActionsHtml(isLastTurn && allSlotsDone(total, slotStatus)));
          setHandlers({
            playMine: () => {
              if (recordedAudioUrl) new Audio(recordedAudioUrl).play().catch(() => {});
            },
            tryAgainRound: () => paint(),
            nextRound: () => {
              if (isLastTurn) {
                advance();
                return;
              }
              scoreSum += score;
              goNextTurn();
            },
          });
        },
        (kind) => {
          btn.classList.remove('listening');
          if (kind === 'aborted') return;
          container.querySelector<HTMLElement>('#fb')!.textContent = 'Belum kedengaran, coba lagi 🎧';
        },
        (audioUrl) => {
          recordedAudioUrl = audioUrl;
          const playBtn = container.querySelector<HTMLButtonElement>('#playMineBtn');
          if (playBtn) playBtn.disabled = false;
        },
        micOpts(contentLevel)
      );
    }

    paint();
  }

  draw();
}

/* ------------------------------------------------------------------ */
/* 3b. Tantangan — 🙋 Giliranmu Bertanya (section ke-2, mulai Starter)  */
/* ------------------------------------------------------------------ */

/**
 * Anak yang BERTANYA, bukan cuma menjawab (Cambridge Flyers Part 2 "ask
 * questions", KET/PET antar-kandidat — `materi/pembeda_level.md` Speaking
 * usulan #8). Tanpa LLM: pertanyaan yang diharapkan SUDAH ada di data, ucapan
 * anak dicocokkan proporsional (`wordMatchDetail`), lalu teman menjawab
 * dengan jawaban yang sudah ditulis. Little Stars TIDAK dapat section ini.
 *  - Starter: "Tebak Isi Kotak" — 1 kata topik disembunyikan, anak bertanya "Is it … ?"
 *    memakai kata dari topik itu sendiri (pola tunggal, Fase A–B "ganti 1
 *    elemen kalimat"). Dibangun otomatis dari `items`, tanpa data baru.
 *  - Explorer ke atas: "Tanya Temanmu" — arti Indonesia pertanyaan tampil,
 *    anak mengucapkan pertanyaan Inggrisnya; teman menjawab (contoh jawaban
 *    roleplay/cerita/interview yang sudah ada). Menengah dapat chip kata
 *    tanya pembuka; Lanjut tanpa chip & 💡 Petunjuk terkunci sampai 1x coba.
 */
const BERTANYA_COUNT = 5;
const SECTION_BERTANYA = 'tantangan-tanya';

interface AskPrompt {
  question: SpeakingLine;
  answer: SpeakingLine;
}

function askPromptsOf(topic: AnySpeakingTopic): AskPrompt[] {
  if ('items' in topic) return [];
  if ('turns' in topic) return topic.turns.map((t) => ({ question: t.question, answer: t.peerAnswer }));
  if ('stories' in topic) return topic.stories.map((s) => ({ question: s.question, answer: s.answer }));
  return topic.roleplay.filter((r) => r.q.en.trim().endsWith('?')).map((r) => ({ question: r.q, answer: r.answer }));
}

function hasBertanya(topic: AnySpeakingTopic, contentLevel: LevelKey): boolean {
  if (contentLevel === 'little-stars') return false;
  return 'items' in topic ? topic.items.length >= 2 : askPromptsOf(topic).length > 0;
}

function bertanyaCount(topic: AnySpeakingTopic, contentLevel: LevelKey): number {
  return hasBertanya(topic, contentLevel) ? BERTANYA_COUNT : 0;
}

/** Urutan soal: acak & diulang sampai `BERTANYA_COUNT` (sumbernya kadang < 5). */
function buildBertanyaPlan(size: number): LatihanPlanSlot[] {
  let order: number[] = [];
  while (order.length < BERTANYA_COUNT) order = order.concat(shuffle(Array.from({ length: size }, (_, i) => i)));
  return order.slice(0, BERTANYA_COUNT).map((item) => ({ kind: 'hear', item }));
}

function firstWord(text: string): string {
  return text.trim().split(/\s+/)[0].replace(/[^A-Za-z']/g, '');
}

export function runTantangan(container: HTMLElement, topic: AnySpeakingTopic, onDone: OnDone, level: LevelKey, contentLevel: LevelKey): void {
  if (!hasBertanya(topic, contentLevel)) {
    runNgobrol(container, topic, onDone, level, contentLevel);
    return;
  }
  // 2 tab seperti Tantangan Vocab: bisa dipindah manual, tapi menuntaskan
  // "Ngobrol" otomatis lanjut ke "Bertanya"; `onDone` cuma setelah keduanya.
  const shellHtml = (active: 'ngobrol' | 'tanya'): string => `
    <div class="tantangan-tabs">
      <button class="tantangan-tab ${active === 'ngobrol' ? 'active' : ''}" type="button" data-action="tabNgobrol">💬 Ngobrol Yuk!</button>
      <button class="tantangan-tab ${active === 'tanya' ? 'active' : ''}" type="button" data-action="tabTanya">🙋 Giliranmu Bertanya</button>
    </div>
    <div id="tantanganStage"></div>`;

  function openNgobrol(): void {
    container.innerHTML = shellHtml('ngobrol');
    setHandlers({ tabNgobrol: openNgobrol, tabTanya: openTanya });
    runNgobrol(
      container.querySelector<HTMLElement>('#tantanganStage')!,
      topic,
      () => {
        requestSync();
        openTanya();
      },
      level,
      contentLevel
    );
  }

  function openTanya(): void {
    container.innerHTML = shellHtml('tanya');
    setHandlers({ tabNgobrol: openNgobrol, tabTanya: openTanya });
    const stage = container.querySelector<HTMLElement>('#tantanganStage')!;
    if ('items' in topic) runTebakGambar(stage, topic, onDone, level, contentLevel);
    else runTanyaTeman(stage, topic, onDone, level, contentLevel);
  }

  openNgobrol();
}

/** Quiz-dot + resume + "Lanjut ke soal belum dikerjakan" — sama pola section lain. */
function bertanyaNav(topicId: string, total: number, onDone: OnDone, draw: () => void) {
  const nav = {
    round: firstUnansweredSlot('speaking', topicId, SECTION_BERTANYA, total),
    status: (i: number): 0 | 1 | 2 => getSlot('speaking', topicId, SECTION_BERTANYA, i)?.st ?? 0,
    goTo(i: number): void {
      nav.round = Math.min(Math.max(i, 0), total - 1);
      setSectionCursor('speaking', topicId, SECTION_BERTANYA, nav.round);
      draw();
    },
    advance(): void {
      nav.round = nextUnfinishedRound(nav.round, total, nav.status);
      setSectionCursor('speaking', topicId, SECTION_BERTANYA, Math.min(nav.round, total - 1));
      if (nav.round >= total) onDone();
      else draw();
    },
  };
  return nav;
}

function runTebakGambar(container: HTMLElement, topic: SpeakingPhraseTopic, onDone: OnDone, level: LevelKey, contentLevel: LevelKey): void {
  const items = topic.items;
  const plan = loadPlan(
    topic.id,
    SECTION_BERTANYA,
    () => buildBertanyaPlan(items.length),
    (p) => p.length === BERTANYA_COUNT && p.every((sl) => sl.item < items.length)
  );
  const nav = bertanyaNav(topic.id, plan.length, onDone, draw);

  function draw(): void {
    const target = items[plan[nav.round].item] ?? items[0];
    const cands = shuffle([target, ...shuffle(items.filter((it) => it !== target)).slice(0, 3)]);
    const ruledOut = new Set<SpeakingPhraseItem>();
    let solved = false;
    let resultHtml = '';
    let recordedAudioUrl: string | null = null;

    function paint(): void {
      container.innerHTML = `
        <span class="stage-badge">🎁 Tebak Isi Kotak</span>
        ${quizNavHtml(nav.round, plan.length, nav.status)}
        <div class="id-text">Soal ${nav.round + 1} dari ${plan.length}</div>
        <div class="big-emoji guess-box${solved ? ' solved' : ''}">${solved ? target.emoji || `<span class="guess-word">${target.en}</span>` : '🎁'}</div>
        <div class="talk-instruct">${solved ? `Betul, itu ${target.en}!` : 'Ada sesuatu di dalam kotak! Tanya temanmu:'}</div>
        ${solved ? '' : '<div class="talk-task"><span class="talk-chip talk-chip--en">Is it … ?</span></div>'}
        <div class="guess-chips">
          ${cands
            .map((c) => `<span class="guess-chip${ruledOut.has(c) ? ' out' : ''}${solved && c === target ? ' hit' : ''}">${c.emoji ? `${c.emoji} ` : ''}${c.en}</span>`)
            .join('')}
        </div>
        ${
          solved
            ? ''
            : `<div class="mic-wrap">
          <button class="mic-btn pt-cta" id="micBtn" type="button" data-action="mic" aria-label="Ucapkan">🎤</button>
          <div class="mic-hint">${sttSupported ? 'Tap 🎤 lalu tanya, mis. "Is it ' + cands[0].en + '?"' : 'Mikrofon tidak didukung browser ini'}</div>
        </div>`
        }
        <div id="micResult">${resultHtml}</div>
        <div class="feedback" id="fb"></div>
        ${!sttSupported && !solved ? `<button class="ghost-btn" type="button" data-action="skip">✅ Aku Sudah Bertanya</button>` : ''}
        ${solved ? roundActionsHtml(allSlotsDone(plan.length, nav.status)) : ''}
      `;
      wireQuizNav(nav.goTo);
      setHandlers({
        mic: () => micFor(),
        skip: () => {
          markSlotAnswered('speaking', topic.id, SECTION_BERTANYA, nav.round, true, { itemRef: target.en });
          nav.advance();
        },
        playMine: () => {
          if (recordedAudioUrl) new Audio(recordedAudioUrl).play().catch(() => {});
        },
        tryAgainRound: () => draw(),
        nextRound: () => nav.advance(),
      });
    }

    function micFor(): void {
      const btn = container.querySelector<HTMLElement>('#micBtn')!;
      if (btn.classList.contains('listening')) return;
      btn.classList.add('listening');
      recordedAudioUrl = null;
      listenAndRecordOnce(
        (said) => {
          btn.classList.remove('listening');
          const heard = ` ${normalize(said)} `;
          const asked = cands
            .filter((c) => normalize(c.en).split(' ').every((w) => heard.includes(` ${w} `)))
            .sort((a, b) => b.en.length - a.en.length)[0];
          const s = scoreMic(said, `is it ${asked?.en ?? cands.find((c) => !ruledOut.has(c))!.en}`, contentLevel);
          const fb = (): HTMLElement => container.querySelector<HTMLElement>('#fb')!;
          recordEvent({
            kind: 'speak',
            skill: 'speaking',
            topicId: topic.id,
            section: SECTION_BERTANYA,
            slot: nav.round,
            itemRef: target.en,
            activity: 'mic-ask',
            graded: false,
            score: Math.round(s.hitRatio * 100),
            detail: { heard: said },
          });
          resultHtml = micResultHtml(s, said, '');
          if (asked === target) {
            solved = true;
            playCorrectTone();
            fireConfetti();
            markSlotAnswered('speaking', topic.id, SECTION_BERTANYA, nav.round, s.perfect, { score: Math.round(s.hitRatio * 100), itemRef: target.en });
            paint();
            speak('Yes, it is!');
            fb().textContent = pickPraise(level);
            fb().className = 'feedback good';
          } else {
            playTryAgainTone();
            if (asked) ruledOut.add(asked);
            paint();
            if (asked) speak("No, it isn't.");
            fb().textContent = asked ? `Bukan ${asked.en}! ${pickEncourage(level)} Tanya gambar lain, ya.` : `Sebut salah satu gambar, mis. "Is it ${cands.find((c) => !ruledOut.has(c))!.en}?"`;
            fb().className = 'feedback good';
          }
        },
        (kind) => {
          btn.classList.remove('listening');
          if (kind === 'aborted') return;
          container.querySelector<HTMLElement>('#fb')!.textContent = 'Belum kedengaran, coba lagi 🎧';
        },
        (audioUrl) => {
          recordedAudioUrl = audioUrl;
          const playBtn = container.querySelector<HTMLButtonElement>('#playMineBtn');
          if (playBtn) playBtn.disabled = false;
        },
        micOpts(contentLevel)
      );
    }

    paint();
  }

  if (nav.round >= plan.length) onDone();
  else draw();
}

function runTanyaTeman(container: HTMLElement, topic: AnySpeakingTopic, onDone: OnDone, level: LevelKey, contentLevel: LevelKey): void {
  const prompts = askPromptsOf(topic);
  const partner = 'turns' in topic ? topic.peerName : 'temanmu';
  const tier = tierOf(contentLevel);
  const plan = loadPlan(
    topic.id,
    SECTION_BERTANYA,
    () => buildBertanyaPlan(prompts.length),
    (p) => p.length === BERTANYA_COUNT && p.every((sl) => sl.item < prompts.length)
  );
  const nav = bertanyaNav(topic.id, plan.length, onDone, draw);

  function draw(): void {
    const p = prompts[plan[nav.round].item] ?? prompts[0];
    let revealed = false;
    let attempted = false;

    function paint(): void {
      const locked = tier === 'lanjut' && !attempted;
      container.innerHTML = `
        <span class="stage-badge">🙋 Giliranmu Bertanya</span>
        ${quizNavHtml(nav.round, plan.length, nav.status)}
        <div class="id-text">Soal ${nav.round + 1} dari ${plan.length}</div>
        <div class="talk-instruct">Tanyakan ke ${partner} dalam bahasa Inggris:</div>
        <p class="reading-question">🇮🇩 "${p.question.id}"</p>
        ${tier === 'menengah' ? `<div class="talk-task"><span class="talk-chip talk-chip--en">Mulai dengan: ${firstWord(p.question.en)} …</span></div>` : ''}
        <div class="speak-row">${petunjukButtonHtml(revealed, locked)}</div>
        ${locked ? '<div class="mic-hint">💡 Petunjuk terbuka setelah kamu mencoba sekali</div>' : ''}
        ${revealed ? `<div class="talk-model"><span class="talk-model-label">Contoh pertanyaan</span><div class="en-text">${p.question.en}</div></div>` : ''}
        <div class="mic-wrap">
          <button class="mic-btn pt-cta" id="micBtn" type="button" data-action="mic" aria-label="Ucapkan">🎤</button>
          <div class="mic-hint">${sttSupported ? 'Tap 🎤 lalu ucapkan pertanyaanmu' : 'Mikrofon tidak didukung browser ini'}</div>
        </div>
        <div id="micResult"></div>
        <div class="feedback" id="fb"></div>
        ${sttSupported ? '' : `<button class="ghost-btn" type="button" data-action="skip">✅ Aku Sudah Bertanya</button>`}
      `;
      wireQuizNav(nav.goTo);
      setHandlers({
        petunjuk: () => {
          if (revealed || (tier === 'lanjut' && !attempted)) return;
          revealed = true;
          speak(p.question.en);
          paint();
        },
        skip: () => {
          markSlotAnswered('speaking', topic.id, SECTION_BERTANYA, nav.round, true, { itemRef: p.question.en });
          nav.advance();
        },
        mic: () => micFor(),
      });
    }

    function micFor(): void {
      const btn = container.querySelector<HTMLElement>('#micBtn')!;
      if (btn.classList.contains('listening')) return;
      btn.classList.add('listening');
      let recordedAudioUrl: string | null = null;
      listenAndRecordOnce(
        (said) => {
          btn.classList.remove('listening');
          btn.setAttribute('disabled', 'true');
          attempted = true;
          const s = scoreMic(said, p.question.en, contentLevel);
          if (s.perfect) {
            playCorrectTone();
            fireConfetti();
          } else playTryAgainTone();
          const score = Math.round(s.hitRatio * 100);
          markSlotAnswered('speaking', topic.id, SECTION_BERTANYA, nav.round, s.perfect, { score, itemRef: p.question.en });
          recordEvent({
            kind: 'speak',
            skill: 'speaking',
            topicId: topic.id,
            section: SECTION_BERTANYA,
            slot: nav.round,
            itemRef: p.question.en,
            activity: 'mic-ask',
            graded: false,
            score,
            detail: { heard: said },
          });
          // Teman SELALU menjawab (non-punitive) — hadiahnya informasi baru.
          container.querySelector<HTMLElement>('#micResult')!.innerHTML = micResultHtml(
            s,
            said,
            `<div class="en-text" style="margin-top:8px">Pertanyaannya: "${p.question.en}"</div>
             <div class="talk-model"><span class="talk-model-label">💬 Jawaban ${partner}</span><div class="en-text">${p.answer.en}</div><div class="id-text">${p.answer.id}</div></div>`
          );
          speak(p.answer.en);
          const fb = container.querySelector<HTMLElement>('#fb')!;
          fb.textContent = s.perfect ? pickPraise(level) : pickEncourage(level);
          fb.className = 'feedback good';
          fb.insertAdjacentHTML('afterend', roundActionsHtml(allSlotsDone(plan.length, nav.status)));
          setHandlers({
            playMine: () => {
              if (recordedAudioUrl) new Audio(recordedAudioUrl).play().catch(() => {});
            },
            tryAgainRound: () => paint(),
            nextRound: () => nav.advance(),
          });
        },
        (kind) => {
          btn.classList.remove('listening');
          if (kind === 'aborted') return;
          container.querySelector<HTMLElement>('#fb')!.textContent = 'Belum kedengaran, coba lagi 🎧';
        },
        (audioUrl) => {
          recordedAudioUrl = audioUrl;
          const playBtn = container.querySelector<HTMLButtonElement>('#playMineBtn');
          if (playBtn) playBtn.disabled = false;
        },
        micOpts(contentLevel)
      );
    }

    paint();
  }

  if (nav.round >= plan.length) onDone();
  else draw();
}
