import type {
  GrammarContrastVisual,
  GrammarPatternItem,
  GrammarPatternTopic,
  GrammarSentence,
  GrammarSentenceTopic,
  GrammarTransformItem,
  GrammarTransformTopic,
  LevelKey,
  OnDone,
} from '../types';
import { setHandlers } from '../interaction';
import type { LatihanPlanSlot } from '../progress';
import {
  ensureSection,
  getSlot,
  firstUnansweredSlot,
  hasWordInteraction,
  markSlotAnswered,
  markWordInteraction,
  recordAttempt,
  recordEvent,
  resetSectionPlan,
  setSectionCursor,
} from '../progress';
import {
  listenAndRecordOnce,
  playCorrectTone,
  playTryAgainTone,
  playWrongTone,
  speak,
  speakSequence,
  sttSupported,
  vibrateDevice,
  wordMatchDetail,
} from '../speech';
import { pickEncourage, pickPraise } from '../praise';
import { fireConfetti } from '../confetti';
import { shuffle } from '../util';

/**
 * ================================================================
 * PEMBEDA LEVEL (tier) — `materi/pembeda_level.md` § Grammar. Dihitung dari
 * `contentLevel` (level TOPIK yang dimainkan), BUKAN `level` (badge/praise).
 * Dasar = Little Stars/Starter, Menengah = Explorer/Adventurer, Lanjut =
 * Achiever/Trailblazer (pola sama `isAboveStarter`/`isFlyersOrAbove` Vocab).
 * ================================================================
 */
type GrammarTier = 'dasar' | 'menengah' | 'lanjut';

function grammarTier(contentLevel: LevelKey): GrammarTier {
  if (contentLevel === 'little-stars' || contentLevel === 'starter') return 'dasar';
  if (contentLevel === 'explorer' || contentLevel === 'adventurer') return 'menengah';
  return 'lanjut';
}

/** Kecepatan audio Latihan Inti/Tantangan — sama tangga Listening (0.75x
 *  s.d. Explorer, 1x Adventurer ke atas). Dipanggil `app.ts` lewat
 *  `applyDefaultRate` (pill kecepatan pilihan user tetap menang). */
export function grammarDefaultRate(contentLevel: LevelKey): 0.75 | 1 {
  return contentLevel === 'little-stars' || contentLevel === 'starter' || contentLevel === 'explorer' ? 0.75 : 1;
}

interface SentenceTierSettings {
  /** Jumlah kata jebakan (bentuk salah dari `wrong`) di bank Susun Kalimat. */
  decoys: number;
  /** Arti Indonesia langsung tampil (Explorer); selain itu lewat 💡 Petunjuk. */
  showMeaning: boolean;
  /** "💡 Jawabannya" otomatis muncul setelah N kali salah. */
  revealAfter: number;
  /** 💡 Petunjuk terkunci 🔒 sampai anak mencoba 1x. */
  hintGate: boolean;
}

function sentenceSettings(contentLevel: LevelKey): SentenceTierSettings {
  if (contentLevel === 'explorer') return { decoys: 1, showMeaning: true, revealAfter: 2, hintGate: false };
  if (grammarTier(contentLevel) === 'menengah') return { decoys: 2, showMeaning: false, revealAfter: 2, hintGate: false };
  return { decoys: 2, showMeaning: false, revealAfter: 3, hintGate: true };
}

/**
 * ================================================================
 * FORMAT KALIMAT (`GrammarSentenceTopic`) — Explorer, Adventurer, Achiever.
 * 10 kalimat per topik, tiap kalimat dipakai lintas 3 tahap:
 *   1. Kenalan — daftar kalimat + arti, kata pola (`key`) disorot; tier
 *      Lanjut dapat aturan 1 baris (`topic.rule`).
 *   2. Latihan Inti "🎯 Susun Kalimat" — 10 soal (1 per kalimat), bank kata
 *      + kata jebakan (bentuk salah dari `wrong`, jumlah per tier).
 *   3. Tantangan "🔎 Pilih Bentuk yang Pas" — 10 soal, kalimat dgn `key`
 *      dikosongkan, 3 opsi (1 benar + 2 bentuk salah) — pola Cambridge
 *      Movers/Flyers Part 6 "grammatical focus".
 * Topik `meaningNeeded` (preposisi/kata tanya/because-so): arti SELALU
 * tampil, krn opsi salahnya gramatikal & cuma beda arti.
 * ================================================================
 */

const SENTENCE_KIND = 'sentence' as const;

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Regex kata utuh `key` (apostrof dihitung bagian kata, mis. "mustn't"). */
function keyRe(key: string): RegExp {
  return new RegExp(`(^|[^A-Za-z'])${escapeRe(key)}(?=[^A-Za-z']|$)`);
}

function sentenceTokens(text: string): string[] {
  return text.replace(/[.,!?]/g, '').split(/\s+/).filter(Boolean);
}

function normTokens(tokens: string[]): string {
  return tokens.join(' ').toLowerCase();
}

function highlightedSentence(s: GrammarSentence): string {
  return s.en.replace(keyRe(s.key), `$1<mark class="g-key">${s.key}</mark>`);
}

/** Plan = SEMUA kalimat topik, masing² tepat 1x, urutan diacak & dipersist.
 *  `kind:'sentence'` jadi penanda format — plan format lama (`kind:'hear'`,
 *  indeks ke array `scramble` 1–3 item) otomatis dianggap basi & dibangun
 *  ulang (status soalnya ikut direset, `resetSectionPlan`). */
function ensureSentencePlan(topic: GrammarSentenceTopic, section: string): { item: number }[] {
  const total = topic.sentences.length;
  const build = (): LatihanPlanSlot[] => shuffle(topic.sentences.map((_, i) => i)).map((item) => ({ kind: SENTENCE_KIND, item }));
  let s = ensureSection('grammar', topic.id, section, build);
  const plan = s.plan ?? [];
  const stale = plan.length !== total || plan.some((p) => p.kind !== SENTENCE_KIND) || new Set(plan.map((p) => p.item)).size !== total;
  if (stale) {
    resetSectionPlan('grammar', topic.id, section, build());
    s = ensureSection('grammar', topic.id, section);
  }
  return s.plan ?? [];
}

function meaningHtml(s: GrammarSentence): string {
  return `<div class="id-text g-meaning">🇮🇩 ${s.id}</div>`;
}

function hintChipHtml(locked: boolean, used: boolean): string {
  return `<button class="ghost-btn hint-chip" type="button" data-action="petunjuk" ${locked || used ? 'disabled' : ''}><span class="hint-bulb">${locked ? '🔒' : '💡'}</span> Petunjuk</button>`;
}

export function renderKenalanSentence(container: HTMLElement, topic: GrammarSentenceTopic, onNext: OnDone, contentLevel: LevelKey): void {
  const showRule = grammarTier(contentLevel) === 'lanjut' && !!topic.rule;
  container.innerHTML = `
    <div class="id-text" style="margin-bottom:10px;">Perhatikan kata yang disorot di tiap kalimat</div>
    ${showRule ? `<div class="g-rule"><span aria-hidden="true">💡</span> ${topic.rule}</div>` : ''}
    <div class="primer-list">
      ${topic.sentences
        .map(
          (s, i) => `
        <div class="primer-item">
          ${s.emoji ? `<div class="primer-ic">${s.emoji}</div>` : ''}
          <div class="txt"><b>${highlightedSentence(s)}</b><span class="g-id">${s.id}</span></div>
          <div class="mini-play" data-action="play" data-payload="${i}">🔊</div>
        </div>`
        )
        .join('')}
    </div>
    <button class="primary-btn" data-action="advance">Lanjut ke Latihan Inti →</button>
  `;
  setHandlers({
    play: (payload) => speak(topic.sentences[Number(payload)].en),
    advance: () => onNext(),
  });
}

/**
 * Latihan Inti "🎯 Susun Kalimat" — evaluasi otomatis begitu jumlah kata =
 * panjang kalimat (kata jebakan tidak ikut dihitung). Semua urutan di `alt`
 * juga diterima. Tanpa ikon (aturan Susun Kalimat CLAUDE.md).
 */
export function runLatihanIntiSentence(container: HTMLElement, topic: GrammarSentenceTopic, onDone: OnDone, level: LevelKey, contentLevel: LevelKey): void {
  const cfg = sentenceSettings(contentLevel);
  const plan = ensureSentencePlan(topic, 'latihan');
  const order = plan.map((p) => topic.sentences[p.item] ?? topic.sentences[0]);
  let round = firstUnansweredSlot('grammar', topic.id, 'latihan', order.length);
  // Per soal: direset di `draw()` (soal BARU), dipertahankan lewat "Coba
  // Lagi" (non-punitive, pola sama Listening/Reading).
  let revealed = false;
  let attempted = false;

  const slotStatus = (i: number): 0 | 1 | 2 => getSlot('grammar', topic.id, 'latihan', i)?.st ?? 0;

  function goTo(i: number): void {
    round = Math.min(Math.max(i, 0), order.length - 1);
    setSectionCursor('grammar', topic.id, 'latihan', round);
    draw();
  }

  function draw(): void {
    if (round >= order.length) return onDone();
    revealed = false;
    attempted = false;
    redraw();
  }

  function redraw(): void {
    const s = order[round];
    const words = sentenceTokens(s.en);
    const capitalize = (w: string) => (s.key[0] === s.key[0].toUpperCase() ? w[0].toUpperCase() + w.slice(1) : w);
    const decoys = s.wrong.slice(0, cfg.decoys).map(capitalize);
    const accepted = [words, ...(s.alt ?? []).map(sentenceTokens)].map(normTokens);
    const freshBank = () => shuffle([...words, ...decoys].map((w, i) => ({ w, used: false, idx: i })));
    let bank = freshBank();
    let answer: { w: string; idx: number }[] = [];
    let answered = false;
    const meaningShown = () => cfg.showMeaning || !!topic.meaningNeeded || revealed;

    function paint(): void {
      const wrongSoFar = getSlot('grammar', topic.id, 'latihan', round)?.w ?? 0;
      const showHint = !cfg.showMeaning && !topic.meaningNeeded;
      container.innerHTML = `
        <div class="latihan-head no-wrap">
          <span class="stage-badge">🎯 Susun Kalimat</span>
          ${showHint && !answered ? hintChipHtml(cfg.hintGate && !attempted, revealed) : ''}
        </div>
        ${quizNavHtml(round, order.length, slotStatus)}
        <div class="id-text">Soal ${round + 1} dari ${order.length}</div>
        ${meaningShown() ? meaningHtml(s) : ''}
        ${decoys.length ? `<p class="meta g-decoy-note">Ada ${decoys.length} kata jebakan — tidak dipakai</p>` : ''}
        <div class="answer-row ${answer.length ? '' : 'empty'}">
          ${answer.map((a, ai) => `<span class="chip placed" data-action="unpick" data-payload="${ai}">${a.w}</span>`).join('')}
        </div>
        ${wrongSoFar >= cfg.revealAfter ? `<p class="meta" style="margin:6px 0 0;text-align:center">💡 Jawabannya: <b>${words.join(' ')}</b></p>` : ''}
        <div class="bank-row">
          ${bank.map((b, bi) => `<span class="chip ${b.used ? 'hidden' : ''}" data-action="pick" data-payload="${bi}">${b.w}</span>`).join('')}
        </div>
        <div class="feedback" id="fb"></div>
        ${
          answered
            ? ''
            : `<div class="letter-actions">
          <button class="ghost-btn slim" type="button" data-action="removeLastWord" ${answer.length === 0 ? 'disabled' : ''}>⌫ Hapus Kata</button>
          <button class="ghost-btn slim" type="button" data-action="clear">🔄 Bersihkan</button>
        </div>`
        }
      `;
      wireQuizNav(goTo);
      setHandlers({
        petunjuk: () => {
          if (revealed || (cfg.hintGate && !attempted)) return;
          revealed = true;
          paint();
        },
        clear: () => {
          if (answered) return;
          answer = [];
          bank = freshBank();
          paint();
        },
        removeLastWord: () => {
          if (answered || answer.length === 0) return;
          const last = answer[answer.length - 1];
          answer = answer.slice(0, -1);
          bank.find((b) => b.idx === last.idx)!.used = false;
          paint();
        },
        pick: (payload) => {
          if (answered) return;
          const bi = Number(payload);
          if (bank[bi].used) return;
          bank[bi].used = true;
          answer.push(bank[bi]);
          paint();
          if (answer.length === words.length) checkAnswer();
        },
        unpick: (payload) => {
          if (answered) return;
          const ai = Number(payload);
          const item = answer[ai];
          answer.splice(ai, 1);
          bank.find((b) => b.idx === item.idx)!.used = false;
          paint();
        },
      });
    }

    function checkAnswer(): void {
      if (answered || !answer.length) return;
      answered = true;
      attempted = true;
      const correct = accepted.includes(normTokens(answer.map((a) => a.w)));
      paint();
      const fb = container.querySelector<HTMLElement>('#fb')!;
      if (correct) {
        recordAttempt(true);
        playCorrectTone();
        fireConfetti();
        fb.textContent = pickPraise(level);
        fb.className = 'feedback good';
        speak(s.en);
      } else {
        recordAttempt(false);
        container.querySelector('.answer-row')?.classList.add('is-wrong');
        playWrongTone();
        vibrateDevice(160);
        fb.textContent = pickEncourage(level);
        fb.className = 'feedback bad';
      }
      markSlotAnswered('grammar', topic.id, 'latihan', round, correct, { hint: revealed, itemRef: s.en });
      recordEvent({ kind: 'answer', skill: 'grammar', topicId: topic.id, section: 'latihan', slot: round, itemRef: s.en, activity: 'scramble', correct, hintUsed: revealed });
      fb.insertAdjacentHTML('afterend', roundActionsHtml(allSlotsDone(order.length, slotStatus)));
      setHandlers({
        tryAgainRound: () => {
          answered = false;
          answer = [];
          bank = freshBank();
          paint();
        },
        nextRound: () => {
          round = nextUnfinishedRound(round, order.length, slotStatus);
          setSectionCursor('grammar', topic.id, 'latihan', Math.min(round, order.length - 1));
          draw();
        },
      });
    }

    paint();
  }

  draw();
}

/** Kind plan utk soal teks pendek di Tantangan — label `'toEn'` dipinjam
 *  dari union `LatihanPlanSlot.kind` (progress.ts) SAJA, tidak bermakna
 *  "ke bahasa Inggris" (pola peminjaman label yang sama Reading/Listening). */
const TEXT_KIND = 'toEn' as const;
/** Jumlah soal teks pendek yang menggantikan soal kalimat di Tantangan. */
const TANTANGAN_TEXT_COUNT = 3;

/** 1 soal Tantangan — bentuk seragam utk kalimat tunggal & teks pendek. */
interface ChooseFormQuestion {
  /** Kalimat sebelum kalimat berumpang (kosong utk soal kalimat). */
  before: string[];
  line: string;
  key: string;
  wrong: [string, string];
  id: string;
  /** Kata kunci di `before` (teks pendek saja). */
  cue?: string;
}

/** Plan Tantangan: topik tanpa `texts` = semua kalimat (sama Latihan Inti);
 *  topik dgn `texts` (Achiever) = 3 teks + (total−3) kalimat acak, diacak &
 *  dipersist. Plan lama yang bentuknya beda otomatis dibangun ulang. */
function ensureTantanganPlan(topic: GrammarSentenceTopic, section: string): LatihanPlanSlot[] {
  const texts = topic.texts ?? [];
  if (!texts.length) return ensureSentencePlan(topic, section) as LatihanPlanSlot[];
  const total = topic.sentences.length;
  const nText = Math.min(TANTANGAN_TEXT_COUNT, texts.length);
  const build = (): LatihanPlanSlot[] =>
    shuffle([
      ...shuffle(topic.sentences.map((_, i) => i))
        .slice(0, total - nText)
        .map((item) => ({ kind: SENTENCE_KIND, item })),
      ...shuffle(texts.map((_, i) => i))
        .slice(0, nText)
        .map((item) => ({ kind: TEXT_KIND, item })),
    ]);
  let s = ensureSection('grammar', topic.id, section, build);
  const plan = s.plan ?? [];
  const sentSlots = plan.filter((p) => p.kind === SENTENCE_KIND);
  const textSlots = plan.filter((p) => p.kind === TEXT_KIND);
  const stale =
    plan.length !== total ||
    textSlots.length !== nText ||
    sentSlots.length !== total - nText ||
    new Set(sentSlots.map((p) => p.item)).size !== sentSlots.length ||
    new Set(textSlots.map((p) => p.item)).size !== textSlots.length ||
    textSlots.some((p) => !texts[p.item]);
  if (stale) {
    resetSectionPlan('grammar', topic.id, section, build());
    s = ensureSection('grammar', topic.id, section);
  }
  return s.plan ?? [];
}

function toQuestion(topic: GrammarSentenceTopic, slot: LatihanPlanSlot): ChooseFormQuestion {
  if (slot.kind === TEXT_KIND && topic.texts?.[slot.item]) {
    const t = topic.texts[slot.item];
    return { before: t.en.slice(0, -1), line: t.en[t.en.length - 1], key: t.key, wrong: t.wrong, id: t.id, cue: t.cue };
  }
  const s = topic.sentences[slot.item] ?? topic.sentences[0];
  return { before: [], line: s.en, key: s.key, wrong: s.wrong, id: s.id };
}

function cueRe(cue: string): RegExp {
  return new RegExp(`(^|[^A-Za-z'])(${escapeRe(cue)})(?=[^A-Za-z']|$)`, 'i');
}

/**
 * Tantangan "🔎 Pilih Bentuk yang Pas" — kalimat dgn kata pola dikosongkan,
 * 3 opsi teks (1 benar + 2 bentuk salah). 💡 Petunjuk: ungkap arti (kalau
 * belum tampil) + coret 1 opsi salah; terkunci 🔒 sampai 1x coba di tier
 * Lanjut. Achiever: 3 dari 10 soal berupa TEKS PENDEK (`topic.texts`) —
 * jawabannya bergantung kalimat sebelumnya (Cambridge Flyers Part 7);
 * sesudah dijawab, kata kuncinya disorot ("🔑 Kuncinya").
 */
export function runTantanganSentence(container: HTMLElement, topic: GrammarSentenceTopic, onDone: OnDone, level: LevelKey, contentLevel: LevelKey): void {
  const cfg = sentenceSettings(contentLevel);
  const SECTION = 'tantangan-bentuk';
  const plan = ensureTantanganPlan(topic, SECTION);
  const order = plan.map((p) => toQuestion(topic, p));
  let round = firstUnansweredSlot('grammar', topic.id, SECTION, order.length);
  let options: string[] = [];
  let revealed = false;
  let attempted = false;
  let eliminated = -1;

  const slotStatus = (i: number): 0 | 1 | 2 => getSlot('grammar', topic.id, SECTION, i)?.st ?? 0;

  function goTo(i: number): void {
    round = Math.min(Math.max(i, 0), order.length - 1);
    setSectionCursor('grammar', topic.id, SECTION, round);
    draw();
  }

  function draw(): void {
    if (round >= order.length) return onDone();
    const q = order[round];
    options = shuffle([q.key, ...q.wrong]);
    revealed = false;
    attempted = false;
    eliminated = -1;
    redraw();
  }

  function contextHtml(q: ChooseFormQuestion, showCue: boolean): string {
    if (!q.before.length) return '';
    const lines = q.before.map((l) => (showCue && q.cue ? l.replace(cueRe(q.cue), '$1<mark class="g-cue">$2</mark>') : l));
    return `<div class="g-context">${lines.map((l) => `<p>${l}</p>`).join('')}</div>`;
  }

  function redraw(): void {
    const q = order[round];
    const isText = q.before.length > 0;
    const meaningShown = cfg.showMeaning || !!topic.meaningNeeded || revealed;
    container.innerHTML = `
      <div class="latihan-head no-wrap">
        <span class="stage-badge">${isText ? '📖 Baca Dulu, Lalu Pilih' : '🔎 Pilih Bentuk yang Pas'}</span>
        ${hintChipHtml(cfg.hintGate && !attempted, revealed)}
      </div>
      ${quizNavHtml(round, order.length, slotStatus)}
      <div class="id-text">Soal ${round + 1} dari ${order.length}</div>
      ${isText ? '<p class="meta g-text-note">Petunjuknya ada di kalimat sebelumnya 👀</p>' : ''}
      <div id="gContext">${contextHtml(q, false)}</div>
      <div class="en-text" id="gSentence">${q.line.replace(keyRe(q.key), '$1<span class="g-blank">___</span>')}</div>
      ${meaningShown ? `<div class="id-text g-meaning">🇮🇩 ${q.id}</div>` : ''}
      <div class="opt-grid three">
        ${options
          .map(
            (o, i) =>
              `<button class="opt-btn opt-btn-text${i === eliminated ? ' eliminated' : ''}" type="button" data-action="pick" data-payload="${i}" ${i === eliminated ? 'disabled' : ''}>${o}</button>`
          )
          .join('')}
      </div>
      <div class="feedback" id="fb"></div>
    `;
    wireQuizNav(goTo);
    setHandlers({
      petunjuk: () => {
        if (revealed || (cfg.hintGate && !attempted)) return;
        revealed = true;
        const wrongIdx = options.map((_, i) => i).filter((i) => options[i] !== q.key);
        eliminated = shuffle(wrongIdx)[0];
        redraw();
      },
      pick: (payload) => {
        const i = Number(payload);
        const btn = container.querySelectorAll<HTMLElement>('.opt-btn')[i];
        const fb = container.querySelector<HTMLElement>('#fb')!;
        const correct = options[i] === q.key;
        const fullText = [...q.before, q.line].join(' ');
        attempted = true;
        lockOptionButtons(container);
        container.querySelector('[data-action="petunjuk"]')?.remove();
        if (correct) {
          recordAttempt(true);
          btn.classList.add('correct', 'win-burst');
          container.querySelector<HTMLElement>('#gSentence')!.innerHTML = q.line.replace(keyRe(q.key), `$1<mark class="g-key">${q.key}</mark>`);
          playCorrectTone();
          fireConfetti();
          fb.textContent = pickPraise(level);
          fb.className = 'feedback good';
          speak(fullText);
        } else {
          recordAttempt(false);
          btn.classList.add('wrong');
          playWrongTone();
          vibrateDevice(160);
          fb.textContent = pickEncourage(level);
          fb.className = 'feedback bad';
        }
        // Teks pendek: sorot kata kunci di kalimat sebelumnya — apa pun
        // hasilnya, supaya anak belajar DARI MANA jawabannya ditentukan.
        if (q.cue) {
          container.querySelector<HTMLElement>('#gContext')!.innerHTML = contextHtml(q, true);
          fb.insertAdjacentHTML('afterend', `<p class="meta g-cue-note">🔑 Kuncinya: <b>${q.cue}</b></p>`);
        }
        markSlotAnswered('grammar', topic.id, SECTION, round, correct, { hint: revealed, itemRef: fullText });
        recordEvent({ kind: 'answer', skill: 'grammar', topicId: topic.id, section: SECTION, slot: round, itemRef: fullText, activity: isText ? 'choose-form-text' : 'choose-form', correct, hintUsed: revealed });
        (container.querySelector('.g-cue-note') ?? fb).insertAdjacentHTML('afterend', roundActionsHtml(allSlotsDone(order.length, slotStatus)));
        setHandlers({
          tryAgainRound: () => redraw(),
          nextRound: () => {
            round = nextUnfinishedRound(round, order.length, slotStatus);
            setSectionCursor('grammar', topic.id, SECTION, Math.min(round, order.length - 1));
            draw();
          },
        });
      },
    });
  }

  draw();
}

/**
 * ================================================================
 * FORMAT KEDUA — kontras 2-kalimat audio+gambar (`GrammarPatternTopic`),
 * dipakai Little Stars ("Satu atau Banyak?", singular/plural) & Starter
 * ("Suka atau Tidak Suka?", present simple positive/negative). Lihat
 * komentar `GrammarPatternTopic`/`GrammarPatternItem` (types.ts) & `materi/
 * grammar.md` §4/§9 untuk alasan lengkap kenapa formatnya beda total dari
 * `GrammarSentenceTopic` di atas (Explorer/Adventurer/Achiever, teks-first
 * — anak Little Stars/Starter belum bisa baca kalimat sendiri). `app.ts`
 * membedakan lewat `'items' in topic` (types.ts `AnyGrammarTopic`).
 *
 * **Direname `singular`/`plural` → `formA`/`formB`** (riset per-level
 * meluas ke Starter) — SATU mekanik generik ini sekarang dipakai utk 2
 * kontras grammar BEDA (singular/plural DAN suka/tidak-suka), dibedakan
 * lewat `contrastVisual` topik (`'quantity'` vs `'polarity'`,
 * `contrastVisualInner()` di bawah) — supaya level BERIKUTNYA yang juga
 * cocok dgn mekanik "dengar 1 bentuk → tunjuk gambar cocok" bisa nebeng
 * tanpa mekanik baru lagi, cuma nambah 1 kontras visual baru kalau perlu.
 *
 * 2 langkah inti, ARAH DIBALIK antar keduanya (permintaan user "wajib ada
 * improvement" — riset `materi/grammar.md` §3/§4 mengonfirmasi SEMUA
 * kompetitor yang diriset cuma py 1 ARAH tugas: dengar kalimat → cocokkan
 * gambar, tidak pernah dibalik, sama pola dgn tangga 2-arah Reading Little
 * Stars `materi/reading.md` §6):
 *   1. Latihan Inti "👂 Dengar & Tunjuk" — dengar SATU bentuk kalimat
 *      (formA ATAU formB, diacak 5:5 lewat `buildPatternPlan`), tunjuk
 *      kartu kontras yang cocok — audio→gambar, pola universal "listen &
 *      point" (Cambridge Starters, Kumon "Look, Listen, Repeat").
 *   2. Tantangan "🔎 Lihat & Dengar, Pilih yang Pas" — ARAH DIBALIK: kartu
 *      kontras jadi stimulus duluan, anak dengar 2 pilihan ucapan (🔊 A /
 *      🔊 B, salah satu formA salah satu formB, posisi diacak) & pilih
 *      yang cocok dgn gambarnya — gambar→audio. Ini yang jadi improvement
 *      konkret, TIDAK dipunyai kompetitor manapun yang diriset.
 * Kedua langkah py "💡 Petunjuk" di kanan badge (permintaan user) — BUKAN
 * eliminasi opsi (soal biner 2 opsi, eliminasi = bocor jawaban), tapi
 * ungkap teks EN+ID: Latihan Inti = kalimat yang diputar, Tantangan = teks
 * di bawah tiap pilihan 🔊 A/B.
 *
 * Kenalan (`renderKenalanPattern`) — TIGA aksi per kata (permintaan user
 * eksplisit: "di fitur kenalan tetap ada fitur mic dan main"), REUSE PERSIS
 * pola `games/reading.ts` `renderKenalanWord`/`games/speaking.ts`
 * `renderKenalanPhrase`: 🔊 dengar KEDUA bentuk kalimat berurutan
 * (`speakSequence`), 🎤 tirukan bentuk formA (skor proporsional + Play
 * Suaramu — WAJIB krn ini fitur mic, "Aturan Wajib: Setiap Fitur Speaking
 * Butuh Skor Proporsional" CLAUDE.md), 🎮 main (1 soal fokus kata itu, REUSE
 * PERSIS shape Latihan Inti, balik ke daftar sesudahnya — konvensi sama
 * `runWordMiniGame`/`runPhraseMiniGame`).
 *
 * Helper generik (`roundActionsHtml`/`quizNavHtml`/dst) diduplikasi lokal ke
 * file ini (konvensi sama `games/listening.ts`/`games/reading.ts`/
 * `games/speaking.ts` — helper UI generik diduplikasi per file game, BUKAN
 * diimpor lintas file, supaya fungsi lama yang stabil tidak ikut berisiko
 * regresi).
 * ================================================================
 */

function roundActionsHtml(isLast: boolean): string {
  return `
    <div class="round-actions">
      <button class="ghost-btn" type="button" data-action="tryAgainRound">🔁 Coba Lagi</button>
      <button class="primary-btn" type="button" data-action="nextRound" style="margin-top:0">${isLast ? 'Selesai ✅' : 'Lanjut ➡️'}</button>
    </div>`;
}

function lockOptionButtons(container: HTMLElement): void {
  container.querySelectorAll<HTMLButtonElement>('.opt-btn').forEach((b) => (b.disabled = true));
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

/**
 * "Selesai ✅" di `roundActionsHtml` HANYA boleh muncul kalau SEMUA soal di
 * section ini sudah dikerjakan — bukan cuma soal yang SEDANG dijawab
 * kebetulan berada di posisi TERAKHIR (permintaan user, bug: quiz-dot boleh
 * dilompat bebas ke soal mana pun, jadi anak yang lompat langsung ke soal
 * terakhir & menjawabnya BISA dapat "Selesai" walau soal 1–9 belum pernah
 * disentuh). Cek lewat `statusOf` yang SAMA dgn yang dikirim ke
 * `quizNavHtml` (st===2 tiap slot), BUKAN `round === total - 1` lagi —
 * berlaku di SEMUA skill (Vocab/Listening/Reading/Grammar/Speaking) yang
 * punya quiz-dot bebas lompat.
 */
function allSlotsDone(total: number, statusOf: (i: number) => 0 | 1 | 2): boolean {
  for (let i = 0; i < total; i++) if (statusOf(i) !== 2) return false;
  return true;
}

/**
 * Tombol "Lanjut" (soal INI sudah dijawab) pindah ke soal BELUM dikerjakan
 * berikutnya — bukan cuma `round + 1` polos, krn quiz-dot boleh dilompat
 * bebas (mis. anak sempat jawab soal 10 duluan, 1–9 belum). Kalau SEMUA
 * slot (0..total-1) sudah `st===2`, kembalikan `total` (sinyal section ini
 * kelar — `draw()` akan panggil `onDone()`, pola SAMA persis sblm fix ini).
 */
function nextUnfinishedRound(round: number, total: number, statusOf: (i: number) => 0 | 1 | 2): number {
  for (let step = 1; step <= total; step++) {
    const i = (round + step) % total;
    if (statusOf(i) !== 2) return i;
  }
  return total;
}

/** Ambil `count` item dari `items`, SEMUA item muncul dulu sebelum ada yang
 *  berulang — duplikat lokal dari pola `pickItemsForCount` Vocab/Listening/
 *  Reading. */
function pickItemsForCount(items: GrammarPatternItem[], count: number): GrammarPatternItem[] {
  let pool: GrammarPatternItem[] = [];
  while (pool.length < count) pool = pool.concat(shuffle(items));
  return pool.slice(0, count);
}

const LATIHAN_ROUND_SIZE = 10;
const TANTANGAN_ROUND_SIZE = 10;

/** Plan `count` slot: SEMUA kata topik keluar dulu sebelum berulang (via
 *  `pickItemsForCount`), bentuk formA/formB-nya diacak TERPISAH dari urutan
 *  kata (dibagi rata `count/2`:`count/2` — pola sama `LATIHAN_KIND_MIX`
 *  Listening `games/listening.ts`) — `kind` union `LatihanPlanSlot`
 *  (`'hear'|'toEn'|'toId'|'sentence'`, progress.ts) dipinjam labelnya SAJA
 *  (`'hear'` = formA, `'toEn'` = formB, tidak dipakai secara semantik), sama
 *  pola peminjaman label yang sudah dipakai Reading/Listening. */
function buildPatternPlan(topic: GrammarPatternTopic, count: number): LatihanPlanSlot[] {
  const targets = pickItemsForCount(topic.items, count);
  const half = Math.floor(count / 2);
  const kinds = shuffle([...Array(half).fill('hear'), ...Array(count - half).fill('toEn')]) as LatihanPlanSlot['kind'][];
  return targets.map((it, i) => ({ kind: kinds[i], item: topic.items.indexOf(it) }));
}

interface MicScore {
  hitRatio: number;
  stars: 1 | 2 | 3;
  perfect: boolean;
  starRow: string;
  wordsHtml: string;
  matchedCount: number;
  totalCount: number;
}

/** Skor proporsional dari ucapan anak vs kalimat formA target
 *  (`wordMatchDetail`, BUKAN pass/fail biner) — duplikat lokal pola
 *  `games/speaking.ts` `scoreMic`, WAJIB krn Kenalan di sini py fitur mic. */
function scorePatternMic(said: string, target: string): MicScore {
  const words = wordMatchDetail(said, target);
  const matchedCount = words.filter((w) => w.matched).length;
  const totalCount = words.length;
  const hitRatio = totalCount ? matchedCount / totalCount : 0;
  const stars: 1 | 2 | 3 = hitRatio >= 0.8 ? 3 : hitRatio >= 0.4 ? 2 : 1;
  return {
    hitRatio,
    stars,
    perfect: stars === 3,
    starRow: '⭐'.repeat(stars) + '☆'.repeat(3 - stars),
    wordsHtml: words.map((w) => `<span class="${w.matched ? 'ok' : 'miss'}">${w.word}</span>`).join(''),
    matchedCount,
    totalCount,
  };
}

/**
 * Render ISI 1 kartu kontras (dipakai kartu jawaban Kenalan-mini-game/Latihan
 * Inti DAN panggung stimulus Tantangan) — cabang berdasar `contrastVisual`
 * topik (types.ts `GrammarContrastVisual`, komentar lengkap di sana): 5
 * varian — `'quantity'` (gambar diulang 1x/2x, JUMLAH = jawaban, dipakai jg
 * utk "there is/there are"), `'polarity'` (gambar + lencana ✅/❌, POSITIF/
 * NEGATIF = jawaban — dipakai "suka/tidak-suka" MAUPUN "have got"/"can" krn
 * strukturnya sama-sama positif-vs-negatif), `'proximity'` (gambar besar+🔍
 * vs kecil+🔭, JARAK dekat/jauh = jawaban, utk this/that), `'size'` (gambar
 * besar vs kecil TANPA lencana tambahan, UKURAN itu sendiri = jawaban, utk
 * big/small), `'character'` (gambar + lencana 👦/👧, KARAKTER org ketiga =
 * jawaban, dipakai utk possessive his/her MAUPUN subject pronoun he/she),
 * `'possessor'` (gambar + lencana 🙋/🫵, PEMBICARA vs LAWAN BICARA =
 * jawaban, dipakai utk possessive 1st/2nd person my/your — beda deiksis dari
 * `'character'` yg org ketiga), `'inclusion'` (BARU — gambar + lencana
 * 🙋/👉, GRUP TERMASUK vs DI LUAR pembicara = jawaban, dipakai utk subject
 * pronoun we/they & possessive our/their — beda dari `'possessor'` yg
 * TUNGGAL org ke-2, ini PLURAL/grup). SATU fungsi
 * ini yang bikin mekanik Kenalan/Latihan Inti/Tantangan di bawah bisa
 * dipakai ulang lintas kontras grammar BEDA tanpa mekanik baru per level —
 * cuma variasi visual, bukan variasi task shape.
 */
function contrastVisualInner(emoji: string, isFormB: boolean, visual: GrammarContrastVisual): string {
  if (visual === 'polarity') {
    return `<span style="font-size:34px;display:block" aria-hidden="true">${emoji}</span><span class="lbl">${isFormB ? '❌' : '✅'}</span>`;
  }
  if (visual === 'proximity') {
    return `<span style="font-size:${isFormB ? 22 : 44}px;display:block" aria-hidden="true">${emoji}</span><span class="lbl">${isFormB ? '🔭' : '🔍'}</span>`;
  }
  if (visual === 'size') {
    return `<span style="font-size:${isFormB ? 20 : 46}px;display:block" aria-hidden="true">${emoji}</span>`;
  }
  if (visual === 'character') {
    return `<span style="font-size:34px;display:block" aria-hidden="true">${emoji}</span><span class="lbl">${isFormB ? '👧' : '👦'}</span>`;
  }
  if (visual === 'possessor') {
    return `<span style="font-size:34px;display:block" aria-hidden="true">${emoji}</span><span class="lbl">${isFormB ? '🫵' : '🙋'}</span>`;
  }
  if (visual === 'inclusion') {
    return `<span style="font-size:34px;display:block" aria-hidden="true">${emoji}</span><span class="lbl">${isFormB ? '👉' : '🙋'}</span>`;
  }
  const count = isFormB ? 2 : 1;
  return `<span style="font-size:34px;display:block${count > 1 ? ';letter-spacing:6px' : ''}" aria-hidden="true">${emoji.repeat(count)}</span><span class="lbl">${count}</span>`;
}

interface ContrastCard {
  emoji: string;
  isFormB: boolean;
  ok: boolean;
}

/** Kartu jawaban kontras Latihan Inti. 2 kartu (Little Stars): posisi TETAP
 *  formA kiri, formB kanan (jawabannya melekat ke ISI gambar). Starter dapat kartu
 *  ke-3 (pembeda level, `materi/pembeda_level.md` § Grammar #6): bentuk SAMA
 *  dgn yang didengar tapi benda LAIN dari topik — pola Cambridge Starters
 *  "kalau ada bagian kalimat yang tidak cocok, jawabannya no", anak harus
 *  dengar SELURUH kalimat, bukan cuma bentuknya. Posisi 3 kartu diacak. */
function buildContrastCards(topic: GrammarPatternTopic, target: GrammarPatternItem, wantFormB: boolean, round: number, contentLevel: LevelKey): ContrastCard[] {
  const pair: ContrastCard[] = [
    { emoji: target.emoji, isFormB: false, ok: !wantFormB },
    { emoji: target.emoji, isFormB: true, ok: wantFormB },
  ];
  if (contentLevel !== 'starter') return pair;
  const others = topic.items.filter((it) => it.emoji !== target.emoji);
  if (!others.length) return pair;
  const other = others[round % others.length];
  return shuffle([...pair, { emoji: other.emoji, isFormB: wantFormB, ok: false }]);
}

function contrastCardsHtml(cards: ContrastCard[], visual: GrammarContrastVisual): string {
  return `<div class="opt-grid${cards.length === 3 ? ' three' : ''}">
    ${cards.map((c, i) => `<button class="opt-btn" type="button" data-action="pick" data-payload="${i}">${contrastVisualInner(c.emoji, c.isFormB, visual)}</button>`).join('')}
  </div>`;
}

const CHOICE_LETTERS = ['A', 'B'];

/**
 * Kenalan — 1 baris per kata: 🔊 dengar KEDUA bentuk (formA lalu formB,
 * `speakSequence`), 🎤 tirukan bentuk formA (skor proporsional + Play
 * Suaramu), 🎮 main (1 soal dengar&tunjuk fokus kata itu, balik ke daftar
 * sesudahnya) — permintaan user eksplisit: "di fitur kenalan tetap ada
 * fitur mic dan main", REUSE PERSIS pola `games/reading.ts`
 * `renderKenalanWord` (3 aksi yang sama).
 */
export function renderKenalanPattern(container: HTMLElement, topic: GrammarPatternTopic, onNext: OnDone, level: LevelKey): void {
  const doneCls = (i: number, action: 'listen' | 'mic' | 'game'): string =>
    hasWordInteraction('grammar', topic.id, i, action) ? ' done' : '';

  drawList();

  function drawList(): void {
    container.innerHTML = `
      <div class="id-text" style="margin-bottom:10px;">Dengarkan pola kalimatnya, tap 🔊 utk mengulang${sttSupported ? ', tap 🎤 buat coba tirukan' : ''}, atau tap 🎮 buat main sama polanya</div>
      <div class="primer-list">
        ${topic.items
          .map(
            (it, i) => `
          <div class="primer-item" style="align-items:flex-start">
            <div class="primer-ic">${it.emoji}</div>
            <div class="txt">
              <b>${it.formA.en}</b><span>${it.formA.id}</span>
              <b style="display:block;margin-top:6px">${it.formB.en}</b><span>${it.formB.id}</span>
            </div>
            <div class="mini-play${doneCls(i, 'listen')}" data-action="playPattern" data-payload="${i}">🔊</div>
            ${sttSupported ? `<div class="mini-play${doneCls(i, 'mic')}" id="micMini${i}" data-action="micPattern" data-payload="${i}">🎤</div>` : ''}
            <div class="mini-play${doneCls(i, 'game')}" data-action="gamePattern" data-payload="${i}">🎮</div>
          </div>`
          )
          .join('')}
      </div>
      <button class="primary-btn" data-action="advance">Lanjut ke Latihan Inti →</button>
    `;
    setHandlers({
      playPattern: (payload) => {
        const i = Number(payload);
        markWordInteraction('grammar', topic.id, i, 'listen', topic.items[i].formA.en);
        speakSequence([topic.items[i].formA.en, topic.items[i].formB.en]);
        drawList();
      },
      micPattern: (payload) => {
        const i = Number(payload);
        markWordInteraction('grammar', topic.id, i, 'mic', topic.items[i].formA.en);
        recordEvent({ kind: 'interact', skill: 'grammar', topicId: topic.id, section: 'kenalan', slot: i, itemRef: topic.items[i].formA.en, activity: 'mic' });
        drawList();
        micFor(i);
      },
      gamePattern: (payload) => {
        const i = Number(payload);
        markWordInteraction('grammar', topic.id, i, 'game', topic.items[i].formA.en);
        recordEvent({ kind: 'interact', skill: 'grammar', topicId: topic.id, section: 'kenalan', slot: i, itemRef: topic.items[i].formA.en, activity: 'game' });
        runPatternMiniGame(container, topic, i, drawList, level);
      },
      advance: () => onNext(),
    });
  }

  function openMicResultPopup(it: GrammarPatternItem, index: number, said: string | null, errorText: string | null): void {
    const overlay = document.createElement('div');
    overlay.className = 'mic-pop-overlay';

    let bodyHtml = '';
    if (said !== null) {
      const s = scorePatternMic(said, it.formA.en);
      if (s.perfect) {
        playCorrectTone();
        fireConfetti();
      } else playTryAgainTone();
      recordEvent({
        kind: 'speak',
        skill: 'grammar',
        topicId: topic.id,
        section: 'kenalan',
        slot: index,
        itemRef: it.formA.en,
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
        <div style="font-size:38px" aria-hidden="true">${it.emoji}</div>
        <div class="en-text" style="margin:2px 0 10px">${it.formA.en}</div>
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
    const it = topic.items[index];
    const btn = document.getElementById(`micMini${index}`);
    if (!btn || btn.classList.contains('listening')) return;
    btn.classList.add('listening');
    listenAndRecordOnce(
      (said) => {
        btn.classList.remove('listening');
        openMicResultPopup(it, index, said, null);
      },
      (kind) => {
        btn.classList.remove('listening');
        if (kind === 'aborted') return;
        openMicResultPopup(it, index, null, 'Belum kedengaran, coba lagi ya 🎧');
      },
      (audioUrl) => {
        const overlay = document.querySelector<HTMLElement>('.mic-pop-overlay');
        if (!overlay) return;
        overlay.dataset.audioUrl = audioUrl;
        const playBtn = overlay.querySelector<HTMLButtonElement>('#micPopPlayMine');
        if (playBtn) playBtn.disabled = false;
      }
    );
  }
}

/** 🎮 Main · Cocok atau Tidak? — dipicu dari Kenalan, mulai di kata yang
 *  ditap (CLAUDE.md "Section Ber-Bullet-Progress" pengecualian Kenalan Main),
 *  lanjut ke kata lain lewat bullet progress (pola sama `games/listening.ts`
 *  `runItemMiniGame`). Permintaan user: dulu shape-nya IDENTIK Latihan Inti
 *  (dengar 1 kalimat → tunjuk 1 dari 2 gambar), sekarang task shape BEDA:
 *  SATU gambar kontras + SATU kalimat didengar → anak NILAI cocok/tidak
 *  (👍/👎 — BUKAN ✅/❌ krn visual `'polarity'` sudah pakai lencana ✅/❌ di
 *  gambarnya sendiri). 3 tahap jadi: Main = verifikasi, Latihan Inti =
 *  kalimat→pilih gambar, Tantangan = gambar→pilih kalimat. Gambar & kalimat
 *  diacak INDEPENDEN (50% cocok), zero data baru. Dot "done" cuma saat soal
 *  BENERAN dijawab (`markSlotAnswered` section 'kenalan' — dikecualikan dari
 *  persentase topik). "💡 Petunjuk" di kanan badge: ungkap teks Inggris +
 *  Indonesia kalimat yang diputar; tetap terungkap lewat "Coba Lagi",
 *  direset saat pindah soal. */
function runPatternMiniGame(container: HTMLElement, topic: GrammarPatternTopic, startIndex: number, onBack: OnDone, level: LevelKey): void {
  const visual: GrammarContrastVisual = topic.contrastVisual ?? 'quantity';
  const total = topic.items.length;
  let current = startIndex;
  let pictureIsFormB = false;
  let sentenceIsFormB = false;
  let answered = false;
  let revealed = false;

  const kenalanStatus = (i: number): 0 | 1 | 2 => getSlot('grammar', topic.id, 'kenalan', i)?.st ?? 0;
  const sentence = () => (sentenceIsFormB ? topic.items[current].formB : topic.items[current].formA);

  function roll(): void {
    pictureIsFormB = Math.random() < 0.5;
    sentenceIsFormB = Math.random() < 0.5;
  }

  function paint(): void {
    const item = topic.items[current];
    const said = sentence();
    container.innerHTML = `
      <div class="latihan-head no-wrap">
        <span class="stage-badge">🎮 Main · Cocok?</span>
        <button class="ghost-btn hint-chip" type="button" data-action="petunjuk" ${revealed ? 'disabled' : ''}><span class="hint-bulb">💡</span> Petunjuk</button>
      </div>
      ${quizNavHtml(current, total, kenalanStatus)}
      <div class="id-text">Lihat gambarnya, dengarkan kalimatnya. Cocok, nggak?</div>
      <div class="pattern-scene">${contrastVisualInner(item.emoji, pictureIsFormB, visual)}</div>
      <div class="speak-row"><button class="speak-btn pt-cta" type="button" data-action="replay">🔊 Dengar</button></div>
      ${revealed ? `<div class="en-text">${said.en}</div><div class="id-text">${said.id}</div>` : ''}
      <div class="opt-grid">
        <button class="opt-btn answer-card" type="button" data-action="pick" data-payload="yes">
          <span class="answer-card-emoji" aria-hidden="true">👍</span>
          <span class="answer-card-bottom"><span class="answer-card-label">Cocok</span></span>
        </button>
        <button class="opt-btn answer-card" type="button" data-action="pick" data-payload="no">
          <span class="answer-card-emoji" aria-hidden="true">👎</span>
          <span class="answer-card-bottom"><span class="answer-card-label">Tidak Cocok</span></span>
        </button>
      </div>
      <div class="feedback" id="fb"></div>
    `;
    wireQuizNav(goTo);
    setHandlers({
      replay: () => speak(sentence().en),
      petunjuk: () => {
        if (revealed) return;
        revealed = true;
        paint();
      },
      pick: (payload) => {
        if (answered) return;
        const saidMatch = payload === 'yes';
        onAnswer(saidMatch === (pictureIsFormB === sentenceIsFormB), saidMatch ? 0 : 1);
      },
    });
  }

  function goTo(i: number): void {
    current = Math.min(Math.max(i, 0), total - 1);
    roll();
    answered = false;
    revealed = false;
    speak(sentence().en);
    paint();
  }

  function onAnswer(correct: boolean, i: number): void {
    const said = sentence();
    answered = true;
    markSlotAnswered('grammar', topic.id, 'kenalan', current, correct, { itemRef: topic.items[current].formA.en });
    lockOptionButtons(container);
    container.querySelector<HTMLButtonElement>('[data-action="petunjuk"]')?.remove();
    const btn = container.querySelectorAll<HTMLElement>('.opt-btn')[i];
    const fb = container.querySelector<HTMLElement>('#fb')!;
    if (correct) {
      recordAttempt(true);
      btn.classList.add('correct', 'win-burst');
      playCorrectTone();
      fireConfetti();
      fb.textContent = pickPraise(level);
      fb.className = 'feedback good';
    } else {
      recordAttempt(false);
      btn.classList.add('wrong');
      playWrongTone();
      vibrateDevice(160);
      fb.textContent = pickEncourage(level);
      fb.className = 'feedback bad';
    }
    recordEvent({ kind: 'answer', skill: 'grammar', topicId: topic.id, itemRef: said.en, activity: 'pattern-mini', correct });
    fb.insertAdjacentHTML('afterend', roundActionsHtml(allSlotsDone(total, kenalanStatus)));
    setHandlers({
      tryAgainRound: () => {
        answered = false;
        paint();
      },
      nextRound: () => {
        const next = nextUnfinishedRound(current, total, kenalanStatus);
        if (next < total) goTo(next);
        else onBack();
      },
    });
  }

  roll();
  speak(sentence().en);
  paint();
}

/**
 * Latihan Inti "👂 Dengar & Tunjuk" — 10 soal (plan `buildPatternPlan`, tiap
 * kata keluar tepat 1x, bentuk formA/formB diacak terpisah 5:5): dengar SATU
 * bentuk kalimat (auto-play + "🔊 Dengar" replay manual), tunjuk kartu
 * kontras yang cocok — audio→gambar, comprehension murni.
 */
export function runLatihanIntiPattern(container: HTMLElement, topic: GrammarPatternTopic, onDone: OnDone, level: LevelKey, contentLevel: LevelKey): void {
  const visual: GrammarContrastVisual = topic.contrastVisual ?? 'quantity';
  const buildPlan = () => buildPatternPlan(topic, LATIHAN_ROUND_SIZE);
  let section = ensureSection('grammar', topic.id, 'latihan', buildPlan);
  const expectedCoverage = Math.min(topic.items.length, LATIHAN_ROUND_SIZE);
  const plan = section.plan ?? [];
  const actualCoverage = new Set(plan.map((s) => s.item)).size;
  const isStalePlan = plan.length !== LATIHAN_ROUND_SIZE || actualCoverage < expectedCoverage;
  if (isStalePlan) {
    resetSectionPlan('grammar', topic.id, 'latihan', buildPlan());
    section = ensureSection('grammar', topic.id, 'latihan');
  }
  const order = (section.plan ?? []).map((slot) => ({ item: topic.items[slot.item] ?? topic.items[0], wantFormB: slot.kind === 'toEn' }));
  let round = firstUnansweredSlot('grammar', topic.id, 'latihan', order.length);
  // 💡 Petunjuk (permintaan user) — ungkap teks EN+ID kalimat yang diputar.
  // Direset di `draw()` (soal BARU), TIDAK di `redraw()` (Coba Lagi /
  // tap Petunjuk itu sendiri) — non-punitive, pola sama Kenalan Main.
  let revealed = false;

  const slotStatus = (i: number): 0 | 1 | 2 => getSlot('grammar', topic.id, 'latihan', i)?.st ?? 0;

  function goTo(i: number): void {
    round = Math.min(Math.max(i, 0), order.length - 1);
    setSectionCursor('grammar', topic.id, 'latihan', round);
    draw();
  }

  // Kartu diacak SEKALI per soal (bukan tiap redraw — tap Petunjuk tidak
  // boleh memindah posisi kartu).
  let cards: ContrastCard[] = [];

  function draw(): void {
    if (round >= order.length) return onDone();
    revealed = false;
    cards = buildContrastCards(topic, order[round].item, order[round].wantFormB, round, contentLevel);
    redraw();
  }

  function redraw(playAudio = true): void {
    const { item: target, wantFormB } = order[round];
    const form = wantFormB ? target.formB : target.formA;

    container.innerHTML = `
      <div class="latihan-head no-wrap">
        <span class="stage-badge">👂 Dengar &amp; Tunjuk</span>
        <button class="ghost-btn hint-chip" type="button" data-action="petunjuk" ${revealed ? 'disabled' : ''}><span class="hint-bulb">💡</span> Petunjuk</button>
      </div>
      ${quizNavHtml(round, order.length, slotStatus)}
      <div class="id-text">Soal ${round + 1} dari ${order.length}</div>
      <div class="speak-row"><button class="speak-btn pt-cta" type="button" data-action="replay">🔊 Dengar</button></div>
      ${revealed ? `<div class="en-text">${form.en}</div><div class="id-text">${form.id}</div>` : ''}
      <div class="id-text" style="font-weight:800;margin:6px 0 4px">Mana yang cocok dengan yang kamu dengar?</div>
      ${contrastCardsHtml(cards, visual)}
      <div class="feedback" id="fb"></div>
    `;
    wireQuizNav(goTo);

    setHandlers({
      replay: () => speak(form.en),
      petunjuk: () => {
        if (revealed) return;
        revealed = true;
        redraw(false);
      },
      pick: (payload) => {
        const i = Number(payload);
        const btn = container.querySelectorAll<HTMLElement>('.opt-btn')[i];
        const fb = container.querySelector<HTMLElement>('#fb')!;
        const correct = cards[i].ok;
        lockOptionButtons(container);
        container.querySelector('[data-action="petunjuk"]')?.remove();
        if (correct) {
          recordAttempt(true);
          btn.classList.add('correct', 'win-burst');
          playCorrectTone();
          fireConfetti();
          fb.textContent = pickPraise(level);
          fb.className = 'feedback good';
        } else {
          recordAttempt(false);
          btn.classList.add('wrong');
          playWrongTone();
          vibrateDevice(160);
          fb.textContent = pickEncourage(level);
          fb.className = 'feedback bad';
        }
        markSlotAnswered('grammar', topic.id, 'latihan', round, correct, { itemRef: form.en });
        recordEvent({
          kind: 'answer',
          skill: 'grammar',
          topicId: topic.id,
          section: 'latihan',
          slot: round,
          itemRef: form.en,
          activity: 'hear-to-qty',
          correct,
        });
        fb.insertAdjacentHTML('afterend', roundActionsHtml(allSlotsDone(order.length, slotStatus)));
        setHandlers({
          tryAgainRound: () => redraw(),
          nextRound: () => {
            round = nextUnfinishedRound(round, order.length, slotStatus);
            setSectionCursor('grammar', topic.id, 'latihan', Math.min(round, order.length - 1));
            draw();
          },
        });
      },
    });

    if (playAudio) speak(form.en);
  }

  draw();
}

/**
 * Tantangan "🔎 Lihat & Dengar, Pilih yang Pas" — 10 soal, ARAH DIBALIK dari
 * Latihan Inti (permintaan user "wajib ada improvement", `materi/
 * grammar.md` §4): kartu kontras (dari plan section TERPISAH `tantangan-pola`
 * — assignment formA/formB-nya independen dari Latihan Inti) jadi stimulus
 * duluan, anak dengar 2 pilihan ucapan (🔊 A / 🔊 B, posisi diacak) & pilih
 * yang cocok — gambar→audio, kebalikan comprehension Latihan Inti (tangga
 * 2-arah, sama prinsip Reading Little Stars).
 */
export function runTantanganPattern(container: HTMLElement, topic: GrammarPatternTopic, onDone: OnDone, level: LevelKey): void {
  const visual: GrammarContrastVisual = topic.contrastVisual ?? 'quantity';
  const buildPlan = () => buildPatternPlan(topic, TANTANGAN_ROUND_SIZE);
  let section = ensureSection('grammar', topic.id, 'tantangan-pola', buildPlan);
  const expectedCoverage = Math.min(topic.items.length, TANTANGAN_ROUND_SIZE);
  const plan = section.plan ?? [];
  const actualCoverage = new Set(plan.map((s) => s.item)).size;
  const isStalePlan = plan.length !== TANTANGAN_ROUND_SIZE || actualCoverage < expectedCoverage;
  if (isStalePlan) {
    resetSectionPlan('grammar', topic.id, 'tantangan-pola', buildPlan());
    section = ensureSection('grammar', topic.id, 'tantangan-pola');
  }
  const order = (section.plan ?? []).map((slot) => ({ item: topic.items[slot.item] ?? topic.items[0], wantFormB: slot.kind === 'toEn' }));
  let round = firstUnansweredSlot('grammar', topic.id, 'tantangan-pola', order.length);
  // 💡 Petunjuk (permintaan user) — ungkap teks EN+ID di bawah tiap pilihan
  // 🔊 A/B. Direset di `draw()` (soal BARU), TIDAK di "Coba Lagi".
  let revealed = false;

  const slotStatus = (i: number): 0 | 1 | 2 => getSlot('grammar', topic.id, 'tantangan-pola', i)?.st ?? 0;

  function goTo(i: number): void {
    round = Math.min(Math.max(i, 0), order.length - 1);
    setSectionCursor('grammar', topic.id, 'tantangan-pola', round);
    draw();
  }

  function draw(): void {
    if (round >= order.length) return onDone();
    revealed = false;
    redraw();
  }

  function redraw(): void {
    const { item: target, wantFormB } = order[round];
    const choices = shuffle([
      { wantFormB: false, form: target.formA },
      { wantFormB: true, form: target.formB },
    ]);
    // Dengar (`listenChoice`) & pilih (`confirmChoice`) SENGAJA 2 langkah
    // terpisah (revisi audit user: sebelumnya 1 tap = dengar SEKALIGUS
    // langsung terkunci sbg jawaban final — anak yang salah dengar SEKALI
    // (bukan salah paham) langsung dapat status salah). Sekarang anak boleh
    // dengar ulang/ganti pilihan bebas (`selected` berpindah, TIDAK
    // mengevaluasi apa pun), baru commit lewat tombol terpisah "✅ Pilih
    // Jawaban Ini" begitu sudah yakin — konsisten dgn skill lain yang SELALU
    // menampilkan opsi (gambar/teks) dulu sebelum tap mengevaluasi; di sini
    // "opsi"-nya audio tersembunyi, jadi butuh tahap dengar eksplisit.
    let selected: number | null = null;
    // Animasi "sedang bersuara" di ikon 🔊 pilihan yang diputar (permintaan
    // user). `playToken` menyaring callback basi: ucapan yang dibatalkan tap
    // berikutnya tetap memicu onend, jangan sampai mematikan animasi baru.
    let playingIdx: number | null = null;
    let playToken = 0;

    function stopPlaying(token: number): void {
      if (token !== playToken) return;
      playingIdx = null;
      container.querySelectorAll('.sound-ic.playing').forEach((el) => el.classList.remove('playing'));
    }

    function paint(): void {
      container.innerHTML = `
        <div class="latihan-head no-wrap">
          <span class="stage-badge">🔎 Lihat &amp; Dengar, Pilih yang Pas</span>
          <button class="ghost-btn hint-chip" type="button" data-action="petunjuk" ${revealed ? 'disabled' : ''}><span class="hint-bulb">💡</span> Petunjuk</button>
        </div>
        ${quizNavHtml(round, order.length, slotStatus)}
        <div class="id-text">Soal ${round + 1} dari ${order.length}</div>
        <div style="text-align:center;margin:14px 0" aria-hidden="true">${contrastVisualInner(target.emoji, wantFormB, visual)}</div>
        <div class="id-text" style="font-weight:800;margin:6px 0 4px">Dengarkan tiap pilihan (boleh berkali-kali), lalu pilih yang cocok dengan gambar ini</div>
        <div class="opt-grid">
          ${choices
            .map(
              (_, i) => `
          <button class="opt-btn${selected === i ? ' selected' : ''}" type="button" data-action="listenChoice" data-payload="${i}"><span class="sound-ic${playingIdx === i ? ' playing' : ''}" aria-hidden="true">🔊</span><span class="lbl">${CHOICE_LETTERS[i]}</span>${
            revealed ? `<span class="choice-hint"><b>${choices[i].form.en}</b>${choices[i].form.id}</span>` : ''
          }</button>`
            )
            .join('')}
        </div>
        <button class="primary-btn" type="button" data-action="confirmChoice" style="margin-top:14px" ${selected === null ? 'disabled' : ''}>✅ Pilih Jawaban Ini</button>
        <div class="feedback" id="fb"></div>
      `;
      wireQuizNav(goTo);
      setHandlers({
        petunjuk: () => {
          if (revealed) return;
          revealed = true;
          paint();
        },
        listenChoice: (payload) => {
          selected = Number(payload);
          playingIdx = selected;
          const token = ++playToken;
          paint();
          speak(choices[selected].form.en, () => stopPlaying(token));
          setTimeout(() => stopPlaying(token), 8000);
        },
        confirmChoice: () => {
          if (selected === null) return;
          onAnswer(selected);
        },
      });
    }

    function onAnswer(i: number): void {
      stopPlaying(playToken);
      const btn = container.querySelectorAll<HTMLElement>('.opt-btn')[i];
      const fb = container.querySelector<HTMLElement>('#fb')!;
      const correct = choices[i].wantFormB === wantFormB;
      lockOptionButtons(container);
      container.querySelector<HTMLButtonElement>('[data-action="confirmChoice"]')!.disabled = true;
      container.querySelector('[data-action="petunjuk"]')?.remove();
      if (correct) {
        recordAttempt(true);
        btn.classList.add('correct', 'win-burst');
        playCorrectTone();
        fireConfetti();
        fb.textContent = pickPraise(level);
        fb.className = 'feedback good';
      } else {
        recordAttempt(false);
        btn.classList.add('wrong');
        playWrongTone();
        vibrateDevice(160);
        fb.textContent = pickEncourage(level);
        fb.className = 'feedback bad';
      }
      markSlotAnswered('grammar', topic.id, 'tantangan-pola', round, correct, { itemRef: target.en });
      recordEvent({
        kind: 'answer',
        skill: 'grammar',
        topicId: topic.id,
        section: 'tantangan-pola',
        slot: round,
        itemRef: target.en,
        activity: 'qty-to-hear',
        correct,
      });
      fb.insertAdjacentHTML('afterend', roundActionsHtml(allSlotsDone(order.length, slotStatus)));
      setHandlers({
        tryAgainRound: () => redraw(),
        nextRound: () => {
          round = nextUnfinishedRound(round, order.length, slotStatus);
          setSectionCursor('grammar', topic.id, 'tantangan-pola', Math.min(round, order.length - 1));
          draw();
        },
      });
    }

    paint();
  }

  draw();
}

/**
 * ================================================================
 * FORMAT KETIGA Grammar — transformasi kalimat MCQ (`GrammarTransformTopic`),
 * khusus Trailblazer (12+ th, ≈B1). Lihat komentar `GrammarTransformTopic`
 * (types.ts) & `materi/grammar.md` §9 utk alasan lengkap kenapa formatnya
 * BEDA TOTAL dari 2 format di atas (Cambridge PET menguji passive/reported
 * speech/conditionals lewat KEY-WORD TRANSFORMATION — tulis ulang kalimat
 * supaya bermakna sama, bukan susun-kata/isi-blank/kontras-2-kalimat-tetap).
 * **User ditanya eksplisit** sebelum dibangun ("ikuti default PRD §9
 * low-effort" vs "bangun format baru sentence-transformation ala PET") —
 * PILIH bangun format baru.
 *
 * 2 langkah, ARAH DIBALIK (konsisten prinsip tangga 2-arah format kedua di
 * atas & Reading Little Stars):
 *   1. Latihan Inti "🔁 Ubah Jadi Reported Speech" — baca+dengar kutipan
 *      LANGSUNG (`original`), pilih hasil REPORTED SPEECH yang benar dari 4
 *      opsi teks (`reportedOptions`, distraktor ditulis manual per item —
 *      types.ts, krn harus tetap relevan ke kutipan yg sama).
 *   2. Tantangan "🔎 Siapa Bilang Apa?" — ARAH DIBALIK: baca+dengar kalimat
 *      REPORTED (hasil benar), tebak kutipan LANGSUNG aslinya dari 4 opsi
 *      (`original` + 3 `originalOptions`: isi sama, bentuk beda).
 * Trailblazer (12+ th) sudah bisa baca fasih — SEMUA teks kelihatan (beda
 * dari format audio-first Little Stars/Starter di atas), TTS cuma bantuan
 * dengar, bukan satu-satunya sumber informasi. 4 opsi (bukan 2 biner) jadi
 * "💡 Petunjuk" relevan — di tier Lanjut terkunci 🔒 sampai 1x coba & cuma
 * mencoret 1 opsi salah (pembeda level).
 *
 * Kenalan (`renderKenalanTransform`) — daftar teks kutipan+hasil
 * transformasinya berdampingan + 🔊 baca, TANPA mic/game (beda dari format
 * kedua di atas — "tetap ada fitur mic dan main" itu permintaan KHUSUS
 * konteks Little Stars, bukan aturan wajib semua format Grammar baru; format
 * ini teks-first spt `GrammarSentenceTopic` yang Kenalan-nya jg cuma daftar+
 * baca, bukan audio-first spt Little Stars/Starter).
 * ================================================================
 */

function transformOptionsHtml(options: string[]): string {
  return `<div class="opt-grid">
    ${options.map((text, i) => `<button class="opt-btn opt-btn-text" type="button" data-action="pick" data-payload="${i}">${text}</button>`).join('')}
  </div>`;
}

/** Tier Lanjut (Trailblazer): 🔒 terkunci sampai 1x coba (pembeda level,
 *  `materi/pembeda_level.md` § Grammar #5). */
function transformHintButtonHtml(locked: boolean): string {
  return `<button class="ghost-btn hint-chip" type="button" id="hintBtn" data-action="hint" ${locked ? 'disabled' : ''}><span class="hint-bulb">${locked ? '🔒' : '💡'}</span> Petunjuk</button>`;
}

/** Jumlah opsi salah yang dicoret Petunjuk: 2 (sisa 50/50) di bawah tier
 *  Lanjut, 1 di tier Lanjut. */
function transformEliminateCount(contentLevel: LevelKey): number {
  return grammarTier(contentLevel) === 'lanjut' ? 1 : 2;
}

/** 💡 Petunjuk — coret `count` opsi salah secara acak (pola `wireHint`
 *  Vocab/Listening/Reading). Sekali pakai per soal. */
function wireTransformHint(container: HTMLElement, okFlags: boolean[], count: number, onUsed?: () => void): void {
  let used = false;
  setHandlers({
    hint: () => {
      if (used) return;
      const btns = container.querySelectorAll<HTMLButtonElement>('.opt-btn');
      const wrongIdx = okFlags.map((_, i) => i).filter((i) => !okFlags[i] && !btns[i].disabled);
      if (wrongIdx.length) {
        used = true;
        const toEliminate = shuffle(wrongIdx).slice(0, Math.min(count, wrongIdx.length));
        toEliminate.forEach((pick) => {
          btns[pick].disabled = true;
          btns[pick].classList.add('eliminated');
        });
        const hintBtn = container.querySelector<HTMLButtonElement>('#hintBtn');
        if (hintBtn) hintBtn.disabled = true;
        onUsed?.();
      }
    },
  });
}

/** Plan `topic.transforms.length` slot (SELALU = jumlah item topik, tanpa
 *  perlu `pickItemsForCount` krn tidak ada pengulangan) diacak SEKALI &
 *  dipersist (`plan`) — supaya urutan soal STABIL lintas resume (`round`
 *  yang dibaca dari `section.cursor` harus menunjuk kutipan yang SAMA
 *  setiap kali layar ini dibuka ulang, bukan shuffle baru tiap render). */
function buildTransformPlan(topic: GrammarTransformTopic): LatihanPlanSlot[] {
  return shuffle(topic.transforms.map((_, i) => i)).map((item) => ({ kind: 'hear', item }));
}

export function renderKenalanTransform(container: HTMLElement, topic: GrammarTransformTopic, onNext: OnDone): void {
  container.innerHTML = `
    <div class="id-text" style="margin-bottom:10px;">Perhatikan bagaimana ucapan langsung berubah jadi reported speech</div>
    <div class="primer-list">
      ${topic.transforms
        .map((t, i) => {
          const correct = t.reportedOptions.find((o) => o.ok)!;
          return `
        <div class="primer-item" style="align-items:flex-start">
          <div class="primer-ic">${t.emoji}</div>
          <div class="txt">
            <b>${t.speaker}: "${t.original}"</b>
            <span style="display:block;margin-top:4px">→ ${correct.text}</span>
          </div>
          <div class="mini-play" data-action="play" data-payload="${i}">🔊</div>
        </div>`;
        })
        .join('')}
    </div>
    <button class="primary-btn" data-action="advance">Lanjut ke Latihan Inti →</button>
  `;
  setHandlers({
    play: (payload) => {
      const t = topic.transforms[Number(payload)];
      const correct = t.reportedOptions.find((o) => o.ok)!;
      speakSequence([t.original, correct.text]);
    },
    advance: () => onNext(),
  });
}

/**
 * Latihan Inti "🔁 Ubah Jadi Reported Speech" — 10 soal (1 per kutipan):
 * baca+dengar kutipan langsung, pilih hasil reported speech yang benar dari
 * 4 opsi teks.
 */
export function runLatihanIntiTransform(container: HTMLElement, topic: GrammarTransformTopic, onDone: OnDone, level: LevelKey, contentLevel: LevelKey): void {
  const hintGate = grammarTier(contentLevel) === 'lanjut';
  const buildPlan = () => buildTransformPlan(topic);
  let section = ensureSection('grammar', topic.id, 'latihan', buildPlan);
  const isStalePlan = (section.plan ?? []).length !== topic.transforms.length;
  if (isStalePlan) {
    resetSectionPlan('grammar', topic.id, 'latihan', buildPlan());
    section = ensureSection('grammar', topic.id, 'latihan');
  }
  const order = (section.plan ?? []).map((slot) => topic.transforms[slot.item] ?? topic.transforms[0]);
  let round = firstUnansweredSlot('grammar', topic.id, 'latihan', order.length);
  let hintUsedThisSlot = false;
  let attempted = false;

  const slotStatus = (i: number): 0 | 1 | 2 => getSlot('grammar', topic.id, 'latihan', i)?.st ?? 0;

  function goTo(i: number): void {
    round = Math.min(Math.max(i, 0), order.length - 1);
    setSectionCursor('grammar', topic.id, 'latihan', round);
    draw();
  }

  function draw(): void {
    if (round >= order.length) return onDone();
    hintUsedThisSlot = false;
    attempted = false;
    redraw();
  }

  function redraw(): void {
    const target = order[round];
    const options = shuffle(target.reportedOptions);

    container.innerHTML = `
      <div class="latihan-head no-wrap">
        <span class="stage-badge">🔁 Ubah Jadi Reported Speech</span>
        ${transformHintButtonHtml(hintGate && !attempted)}
      </div>
      ${quizNavHtml(round, order.length, slotStatus)}
      <div class="id-text">Soal ${round + 1} dari ${order.length}</div>
      <div class="big-emoji" style="font-size:40px">${target.emoji}</div>
      <div class="en-text">${target.speaker}: "${target.original}"</div>
      <div class="speak-row"><button class="speak-btn-ghost" type="button" data-action="replay">🔊 Dengar</button></div>
      ${transformOptionsHtml(options.map((o) => o.text))}
      <div class="feedback" id="fb"></div>
    `;
    wireTransformHint(
      container,
      options.map((o) => o.ok),
      transformEliminateCount(contentLevel),
      () => (hintUsedThisSlot = true)
    );
    wireQuizNav(goTo);

    setHandlers({
      replay: () => speak(target.original),
      pick: (payload) => {
        const i = Number(payload);
        const btn = container.querySelectorAll<HTMLElement>('.opt-btn')[i];
        const fb = container.querySelector<HTMLElement>('#fb')!;
        const correct = options[i].ok;
        attempted = true;
        lockOptionButtons(container);
        container.querySelector<HTMLButtonElement>('#hintBtn')?.remove();
        if (correct) {
          recordAttempt(true);
          btn.classList.add('correct', 'win-burst');
          playCorrectTone();
          fireConfetti();
          fb.textContent = pickPraise(level);
          fb.className = 'feedback good';
        } else {
          recordAttempt(false);
          btn.classList.add('wrong');
          playWrongTone();
          vibrateDevice(160);
          fb.textContent = pickEncourage(level);
          fb.className = 'feedback bad';
        }
        markSlotAnswered('grammar', topic.id, 'latihan', round, correct, { hint: hintUsedThisSlot, itemRef: target.original });
        recordEvent({
          kind: 'answer',
          skill: 'grammar',
          topicId: topic.id,
          section: 'latihan',
          slot: round,
          itemRef: target.original,
          activity: 'direct-to-reported',
          correct,
          hintUsed: hintUsedThisSlot,
        });
        fb.insertAdjacentHTML('afterend', roundActionsHtml(allSlotsDone(order.length, slotStatus)));
        setHandlers({
          tryAgainRound: () => redraw(),
          nextRound: () => {
            round = nextUnfinishedRound(round, order.length, slotStatus);
            setSectionCursor('grammar', topic.id, 'latihan', Math.min(round, order.length - 1));
            draw();
          },
        });
      },
    });

    speak(target.original);
  }

  draw();
}

/** 4 opsi kutipan langsung = `original` + 3 `originalOptions` — isi SAMA,
 *  bentuk beda (tense/modal/jenis kalimat), jadi yang diuji perubahan
 *  bentuknya, bukan mencocokkan kata benda (audit 2026-09-24: opsi dari
 *  kutipan sesama item bisa ditebak 98/100). */
function buildOriginalOptions(target: GrammarTransformItem): string[] {
  return shuffle([target.original, ...target.originalOptions]);
}

/**
 * Tantangan "🔎 Siapa Bilang Apa?" — 10 soal, ARAH DIBALIK dari Latihan
 * Inti: baca+dengar kalimat REPORTED (hasil benar), tebak kutipan LANGSUNG
 * aslinya dari 4 opsi — reported→original, kebalikan comprehension Latihan
 * Inti (tangga 2-arah, sama prinsip format kedua Little Stars/Starter).
 */
export function runTantanganTransform(container: HTMLElement, topic: GrammarTransformTopic, onDone: OnDone, level: LevelKey, contentLevel: LevelKey): void {
  const hintGate = grammarTier(contentLevel) === 'lanjut';
  const buildPlan = () => buildTransformPlan(topic);
  let section = ensureSection('grammar', topic.id, 'tantangan-transform', buildPlan);
  const isStalePlan = (section.plan ?? []).length !== topic.transforms.length;
  if (isStalePlan) {
    resetSectionPlan('grammar', topic.id, 'tantangan-transform', buildPlan());
    section = ensureSection('grammar', topic.id, 'tantangan-transform');
  }
  const order = (section.plan ?? []).map((slot) => topic.transforms[slot.item] ?? topic.transforms[0]);
  let round = firstUnansweredSlot('grammar', topic.id, 'tantangan-transform', order.length);
  let hintUsedThisSlot = false;
  let attempted = false;
  let options: string[] = [];

  const slotStatus = (i: number): 0 | 1 | 2 => getSlot('grammar', topic.id, 'tantangan-transform', i)?.st ?? 0;

  function goTo(i: number): void {
    round = Math.min(Math.max(i, 0), order.length - 1);
    setSectionCursor('grammar', topic.id, 'tantangan-transform', round);
    draw();
  }

  function draw(): void {
    if (round >= order.length) return onDone();
    hintUsedThisSlot = false;
    attempted = false;
    options = buildOriginalOptions(order[round]);
    redraw();
  }

  function redraw(): void {
    const target = order[round];
    const correct = target.reportedOptions.find((o) => o.ok)!;

    container.innerHTML = `
      <div class="latihan-head no-wrap">
        <span class="stage-badge">🔎 Siapa Bilang Apa?</span>
        ${transformHintButtonHtml(hintGate && !attempted)}
      </div>
      ${quizNavHtml(round, order.length, slotStatus)}
      <div class="id-text">Soal ${round + 1} dari ${order.length}</div>
      <div class="big-emoji" style="font-size:40px">${target.emoji}</div>
      <div class="en-text">${correct.text}</div>
      <div class="speak-row"><button class="speak-btn-ghost" type="button" data-action="replay">🔊 Dengar</button></div>
      <div class="id-text" style="font-weight:800;margin:6px 0 4px">Kutipan langsung mana yang aslinya?</div>
      ${transformOptionsHtml(options.map((o) => `${target.speaker}: "${o}"`))}
      <div class="feedback" id="fb"></div>
    `;
    wireTransformHint(
      container,
      options.map((o) => o === target.original),
      transformEliminateCount(contentLevel),
      () => (hintUsedThisSlot = true)
    );
    wireQuizNav(goTo);

    setHandlers({
      replay: () => speak(correct.text),
      pick: (payload) => {
        const i = Number(payload);
        const btn = container.querySelectorAll<HTMLElement>('.opt-btn')[i];
        const fb = container.querySelector<HTMLElement>('#fb')!;
        const correctPick = options[i] === target.original;
        attempted = true;
        lockOptionButtons(container);
        container.querySelector<HTMLButtonElement>('#hintBtn')?.remove();
        if (correctPick) {
          recordAttempt(true);
          btn.classList.add('correct', 'win-burst');
          playCorrectTone();
          fireConfetti();
          fb.textContent = pickPraise(level);
          fb.className = 'feedback good';
        } else {
          recordAttempt(false);
          btn.classList.add('wrong');
          playWrongTone();
          vibrateDevice(160);
          fb.textContent = pickEncourage(level);
          fb.className = 'feedback bad';
        }
        markSlotAnswered('grammar', topic.id, 'tantangan-transform', round, correctPick, { hint: hintUsedThisSlot, itemRef: target.original });
        recordEvent({
          kind: 'answer',
          skill: 'grammar',
          topicId: topic.id,
          section: 'tantangan-transform',
          slot: round,
          itemRef: target.original,
          activity: 'reported-to-direct',
          correct: correctPick,
          hintUsed: hintUsedThisSlot,
        });
        fb.insertAdjacentHTML('afterend', roundActionsHtml(allSlotsDone(order.length, slotStatus)));
        setHandlers({
          tryAgainRound: () => redraw(),
          nextRound: () => {
            round = nextUnfinishedRound(round, order.length, slotStatus);
            setSectionCursor('grammar', topic.id, 'tantangan-transform', Math.min(round, order.length - 1));
            draw();
          },
        });
      },
    });

    speak(correct.text);
  }

  draw();
}
