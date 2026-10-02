import { readingPicHtml as picHtml } from '../reading-pic';
import type {
  GrammarContrastVisual,
  GrammarPatternItem,
  GrammarPatternTopic,
  GrammarSentence,
  GrammarSentenceTopic,
  GrammarTransformItem,
  GrammarTransformKind,
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
  isHintUnlocked,
  markSlotHint,
  hasWordInteraction,
  markSlotAnswered,
  markWordInteraction,
  recordAttempt,
  recordEvent,
  requestSync,
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
  playRecording,
  micErrorText,
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

function hintChipHtml(locked: boolean, used: boolean, label = 'Petunjuk'): string {
  return `<button class="ghost-btn hint-chip" type="button" data-action="petunjuk" ${locked || used ? 'disabled' : ''}><span class="hint-bulb">${locked ? '🔒' : '💡'}</span> ${label}</button>`;
}

export function renderKenalanSentence(container: HTMLElement, topic: GrammarSentenceTopic, _onNext: OnDone, contentLevel: LevelKey): void {
  // Kolom ikon dijaga sejajar: kalau SEBAGIAN kalimat py ikon, kalimat tanpa
  // ikon tetap dapat kotak kosong (permintaan user "buat UI yang rapih").
  const anyIcon = topic.sentences.some((s) => !!s.emoji);
  const showRule = grammarTier(contentLevel) === 'lanjut' && !!topic.rule;
  container.innerHTML = `
    <div class="id-text" style="margin-bottom:10px;">Perhatikan kata yang disorot di tiap kalimat</div>
    ${showRule ? `<div class="g-rule"><span aria-hidden="true">💡</span> ${topic.rule}</div>` : ''}
    <div class="primer-list">
      ${topic.sentences
        .map(
          (s, i) => `
        <div class="primer-item">
          ${s.emoji ? `<div class="primer-ic">${picHtml(s.emoji)}</div>` : anyIcon ? '<div class="primer-ic" aria-hidden="true"></div>' : ''}
          <div class="txt"><b>${highlightedSentence(s)}</b><span class="g-id">${s.id}</span></div>
          <div class="mini-play" data-action="play" data-payload="${i}">🔊</div>
        </div>`
        )
        .join('')}
    </div>
  `;
  setHandlers({
    play: (payload) => speak(topic.sentences[Number(payload)].en),
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
  // 💡 Petunjuk mengisi kata-kata pertama (pola Vocab `runSusunKalimat`).
  // Kalau arti SUDAH tampil (Explorer, topik `meaningNeeded`) itu langsung
  // tap pertama; Adventurer+ (arti tersembunyi) Petunjuk 2 TAHAP (permintaan
  // user): tap 1 = arti, tap 2 = ±50% kata tersusun. Dipertahankan lewat
  // "Coba Lagi".
  let wordsHinted = false;

  const slotStatus = (i: number): 0 | 1 | 2 => getSlot('grammar', topic.id, 'latihan', i)?.st ?? 0;

  function goTo(i: number): void {
    round = Math.min(Math.max(i, 0), order.length - 1);
    setSectionCursor('grammar', topic.id, 'latihan', round);
    draw();
  }

  function draw(): void {
    if (round >= order.length) return onDone();
    revealed = false;
    // Sekali terbuka (pernah dijawab / Petunjuk pernah diklik) tidak terkunci lagi.
    attempted = isHintUnlocked('grammar', topic.id, 'latihan', round);
    wordsHinted = false;
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
    const meaningAlwaysShown = cfg.showMeaning || !!topic.meaningNeeded;
    // idx 0..words.length-1 di `freshBank` = kata ke-i kalimat target.
    // Berhenti SEBELUM kata pola (`key`) supaya Petunjuk tidak menjawab
    // bagian yang diuji ("Is that your pencil?" → cuma "Is"); kalau `key`
    // kata pertama, isi seperti biasa (tidak ada kata lain di depannya).
    const keyPos = words.indexOf(s.key);
    const hintCount = (): number => {
      if (!wordsHinted) return 0;
      const base = Math.max(1, Math.round(words.length * (contentLevel === 'explorer' ? 0.6 : 0.5)));
      return keyPos > 0 ? Math.min(base, keyPos) : base;
    };
    function resetBoard(): void {
      bank = freshBank();
      answer = [];
      for (let i = 0; i < hintCount(); i++) {
        const tile = bank.find((b) => b.idx === i)!;
        tile.used = true;
        answer.push(tile);
      }
    }
    resetBoard();

    function paint(): void {
      const wrongSoFar = getSlot('grammar', topic.id, 'latihan', round)?.w ?? 0;
      const hintUsed = wordsHinted;
      const hc = hintCount();
      const hintLabel = !meaningAlwaysShown && revealed ? 'Petunjuk 2' : 'Petunjuk';
      container.innerHTML = `
        <div class="latihan-head no-wrap">
          <span class="stage-badge">🎯 Susun Kalimat</span>
          ${answered ? '' : hintChipHtml(cfg.hintGate && !attempted, hintUsed, hintLabel)}
        </div>
        ${quizNavHtml(round, order.length, slotStatus)}
        ${
          // Soal dibuat dominan (permintaan user "seperti susun kalimat di
          // vocab"): arti Indonesia = teks besar berwarna; kalau arti
          // disembunyikan tier ini (Adventurer+ sebelum 💡 Petunjuk), yang
          // besar instruksinya.
          meaningShown()
            ? `<div class="id-text">Susun jadi Bahasa Inggris dari kalimat ini · ${round + 1} dari ${order.length}</div>
        <div class="en-text" style="color:var(--c-gram)">"${s.id}"</div>`
            : `<div class="id-text">Arti kalimatnya ada di 💡 Petunjuk · ${round + 1} dari ${order.length}</div>
        <div class="en-text" style="color:var(--c-gram)">Susun jadi kalimat yang benar</div>`
        }
        ${decoys.length ? `<p class="meta g-decoy-note">Ada ${decoys.length} kata jebakan — tidak dipakai</p>` : ''}
        <div class="answer-row ${answer.length ? '' : 'empty'}" style="margin-top:10px">
          ${answer.map((a, ai) => `<span class="chip placed${ai < hc ? ' hint' : ''}" data-action="unpick" data-payload="${ai}">${a.w}</span>`).join('')}
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
          <button class="ghost-btn slim" type="button" data-action="removeLastWord" ${answer.length <= hc ? 'disabled' : ''}>⌫ Hapus Kata</button>
          <button class="ghost-btn slim" type="button" data-action="clear">🔄 Bersihkan</button>
        </div>`
        }
      `;
      wireQuizNav(goTo);
      setHandlers({
        petunjuk: () => {
          if (answered || hintUsed || (cfg.hintGate && !attempted)) return;
          markSlotHint('grammar', topic.id, 'latihan', round);
          attempted = true;
          if (meaningAlwaysShown || revealed) {
            wordsHinted = true;
            resetBoard();
          } else revealed = true;
          paint();
        },
        clear: () => {
          if (answered) return;
          resetBoard();
          paint();
        },
        removeLastWord: () => {
          if (answered || answer.length <= hc) return;
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
          if (ai < hc) return; // kata dari Petunjuk tidak bisa dilepas
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
      markSlotAnswered('grammar', topic.id, 'latihan', round, correct, { hint: revealed || wordsHinted, itemRef: s.en });
      recordEvent({ kind: 'answer', skill: 'grammar', topicId: topic.id, section: 'latihan', slot: round, itemRef: s.en, activity: 'scramble', correct, hintUsed: revealed || wordsHinted });
      fb.insertAdjacentHTML('afterend', roundActionsHtml(allSlotsDone(order.length, slotStatus)));
      setHandlers({
        tryAgainRound: () => {
          answered = false;
          resetBoard();
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
  wrong: [string, string, string];
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
function runTantanganSentenceMain(container: HTMLElement, topic: GrammarSentenceTopic, onDone: OnDone, level: LevelKey, contentLevel: LevelKey): void {
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
    attempted = isHintUnlocked('grammar', topic.id, SECTION, round);
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
        <span class="stage-badge${isText ? '' : ' tab-dup'}">${isText ? '📖 Baca Dulu, Lalu Pilih' : '🔎 Pilih Bentuk yang Pas'}</span>
        ${hintChipHtml(cfg.hintGate && !attempted, revealed)}
      </div>
      ${quizNavHtml(round, order.length, slotStatus)}
      <div class="id-text">Soal ${round + 1} dari ${order.length}</div>
      ${isText ? '<p class="meta g-text-note">Petunjuknya ada di kalimat sebelumnya 👀</p>' : ''}
      <div id="gContext">${contextHtml(q, false)}</div>
      <div class="en-text" id="gSentence">${q.line.replace(keyRe(q.key), '$1<span class="g-blank">___</span>')}</div>
      ${meaningShown ? `<div class="g-trans">🇮🇩 ${q.id}</div>` : ''}
      <div class="opt-grid g-choose${options.some((o) => o.includes(' ') || o.length > 9) ? ' long' : ''}">
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
        markSlotHint('grammar', topic.id, SECTION, round);
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

/**
 * ================================================================
 * TANTANGAN = 2 TAB (permintaan user "pada tantangan grammar tambahkan susun
 * kalimat 5 soal saja, konsep sama seperti susun kalimat di tantangan
 * vocabulary, sesuaikan dengan levelnya") — tab 1 = soal Tantangan format
 * masing² (10 soal), tab 2 = "🔤 Susun Kalimat" (5 soal, section
 * `tantangan-susun`). Pola SAMA Vocab `runTantangan`: tab bisa dipindah
 * manual, tuntas tab 1 otomatis lanjut ke tab 2, `onDone` cuma sesudah tab 2.
 * Konsep Vocab `runSusunKalimat`: kalimat Indonesia jadi soal, anak susun
 * kata Inggris dari bank; 💡 Petunjuk isi sebagian kata pertama; jawaban
 * muncul otomatis setelah N kali salah. Trailblazer: kutipan langsung jadi
 * soal, susun kalimat reported speech-nya. (Dicabut 2026-09-28 — Trailblazer
 * Tantangan kini 1 aktivitas, lihat `runTantanganTransform`.)
 * Explorer–Achiever SUDAH punya Susun Kalimat di Latihan Inti → tab 2 mereka
 * diganti "🕵️ Detektif Kalimat" (`runDetektifTab`, keputusan user: Susun
 * Kalimat di Tantangan terasa mengulang Latihan Inti).
 * ================================================================
 */
const SUSUN_SECTION = 'tantangan-susun';
const SUSUN_COUNT = 5;

interface SusunTier {
  /** Kata jebakan tambahan di bank. */
  decoys: number;
  /** "💡 Jawabannya" otomatis setelah N kali salah. */
  revealAfter: number;
  /** 💡 Petunjuk terkunci 🔒 sampai anak mencoba 1x. */
  hintGate: boolean;
  /** Porsi kata pertama yang diisi 💡 Petunjuk. */
  hintRatio: number;
}

/** Dipakai Little Stars/Starter (Dasar) & Trailblazer — Explorer–Achiever
 *  tidak punya tab Susun Kalimat (lihat `runDetektifTab`). */
function susunTier(contentLevel: LevelKey): SusunTier {
  if (grammarTier(contentLevel) === 'dasar') return { decoys: 0, revealAfter: 2, hintGate: false, hintRatio: 0.6 };
  return { decoys: 3, revealAfter: 4, hintGate: true, hintRatio: 0.4 };
}

interface SusunQuestion {
  /** Kalimat soal, sudah berbentuk teks tampil (Indonesia dlm tanda kutip;
   *  Trailblazer = "Nama: “kutipan”"). */
  prompt: string;
  /** Keterangan kecil di atas soal. */
  instruction: string;
  target: string;
  alt?: string[];
  /** Kandidat kata jebakan, urut prioritas (bentuk salah dulu). */
  decoyPool: string[];
  itemRef: string;
}

/** Plan 5 soal (indeks kandidat) dipersist per topik — sama pola
 *  `ensureSentencePlan`, basi kalau panjang/indeks tidak cocok lagi. */
function ensureSusunPlan(topicId: string, candidates: number): number[] {
  return ensureSusunPlanFor(topicId, SUSUN_SECTION, candidates);
}

function ensureSusunPlanFor(topicId: string, section: string, candidates: number): number[] {
  const count = Math.min(SUSUN_COUNT, candidates);
  const build = (): LatihanPlanSlot[] => shuffle(Array.from({ length: candidates }, (_, i) => i)).slice(0, count).map((item) => ({ kind: SENTENCE_KIND, item }));
  let sec = ensureSection('grammar', topicId, section, build);
  const plan = sec.plan ?? [];
  const stale = plan.length !== count || plan.some((p) => p.kind !== SENTENCE_KIND || p.item >= candidates);
  if (stale) {
    resetSectionPlan('grammar', topicId, section, build());
    sec = ensureSection('grammar', topicId, section);
  }
  return (sec.plan ?? []).map((p) => p.item);
}

/** Little Stars/Starter — 1 kalimat per kata (formA/formB diacak), hanya
 *  kalimat ≥3 kata (mis. "Jump!" tidak bisa disusun). Tanpa kata jebakan. */
function patternSusunQuestions(topic: GrammarPatternTopic): SusunQuestion[] {
  const out: SusunQuestion[] = [];
  topic.items.forEach((it) => {
    const forms = shuffle([it.formA, it.formB]).filter((f) => sentenceTokens(f.en).length >= 3);
    if (!forms.length) return;
    out.push({ prompt: `"${forms[0].id}"`, instruction: 'Susun jadi Bahasa Inggris dari kalimat ini', target: forms[0].en, decoyPool: [], itemRef: forms[0].en });
  });
  return out;
}

/** Teks layar per jenis ubahan (`GrammarTransformTopic.kind`) — Trailblazer
 *  dulu 10/10 reported speech dgn judul hardcode; audit `materi/grammar.md`
 *  §28 menambah passive/conditional/relative clause/used to. */
interface TransformUi {
  kenalan: string;
  latihan: string;
  tantangan: string;
  tantanganAsk: string;
}
const TRANSFORM_UI: Record<GrammarTransformKind, TransformUi> = {
  reported: {
    kenalan: 'Perhatikan bagaimana ucapan langsung berubah jadi reported speech',
    latihan: '🔁 Ubah Jadi Reported Speech',
    tantangan: '🔎 Siapa Bilang Apa?',
    tantanganAsk: 'Kutipan langsung mana yang aslinya?',
  },
  passive: {
    kenalan: 'Perhatikan bagaimana kalimat aktif berubah jadi kalimat pasif',
    latihan: '🔁 Ubah Jadi Kalimat Pasif',
    tantangan: '🔎 Kalimat Aktifnya Apa?',
    tantanganAsk: 'Kalimat aktif mana yang artinya sama?',
  },
  conditional: {
    kenalan: 'Perhatikan bagaimana 2 ide digabung jadi kalimat "If…"',
    latihan: '🔁 Gabung Jadi Kalimat "If…"',
    tantangan: '🔎 Maksudnya Apa?',
    tantanganAsk: 'Kalimat mana yang artinya sama dengan kalimat "If…" ini?',
  },
  relative: {
    kenalan: 'Perhatikan bagaimana 2 kalimat digabung pakai who / which',
    latihan: '🔁 Gabung Pakai Who / Which',
    tantangan: '🔎 Asalnya Kalimat Apa?',
    tantanganAsk: 'Dua kalimat mana yang artinya sama?',
  },
  usedTo: {
    kenalan: 'Perhatikan bagaimana kebiasaan dulu berubah jadi kalimat "used to"',
    latihan: '🔁 Ubah Jadi "Used To"',
    tantangan: '🔎 Maksudnya Apa?',
    tantanganAsk: 'Kalimat mana yang artinya sama?',
  },
};
export function transformUi(topic: GrammarTransformTopic): TransformUi {
  return TRANSFORM_UI[topic.kind ?? 'reported'];
}
/** Kalimat asal tampil: reported speech = "Nama: “kutipan”", materi lain
 *  (tanpa tokoh) = kalimatnya saja. */
export function sourceText(t: GrammarTransformItem, text = t.original): string {
  return t.speaker ? `${t.speaker}: “${text}”` : text;
}

/** Tab "🔤 Susun Kalimat" — konsep Vocab `runSusunKalimat`, setelan dari
 *  `susunTier`. Evaluasi otomatis begitu jumlah kata = panjang kalimat. */
function runSusunTab(container: HTMLElement, topicId: string, all: SusunQuestion[], onDone: OnDone, level: LevelKey, contentLevel: LevelKey): void {
  const cfg = susunTier(contentLevel);
  const order = ensureSusunPlan(topicId, all.length).map((i) => all[i] ?? all[0]);
  let round = firstUnansweredSlot('grammar', topicId, SUSUN_SECTION, order.length);
  const status = (i: number): 0 | 1 | 2 => getSlot('grammar', topicId, SUSUN_SECTION, i)?.st ?? 0;

  function goTo(i: number): void {
    round = Math.min(Math.max(i, 0), order.length - 1);
    setSectionCursor('grammar', topicId, SUSUN_SECTION, round);
    draw();
  }

  function draw(): void {
    if (round >= order.length) return onDone();
    const q = order[round];
    const words = sentenceTokens(q.target);
    const targetLower = new Set(words.map((w) => w.toLowerCase()));
    const decoys: string[] = [];
    for (const w of q.decoyPool) {
      if (decoys.length >= cfg.decoys) break;
      const lw = w.toLowerCase();
      if (!targetLower.has(lw) && !decoys.some((d) => d.toLowerCase() === lw)) decoys.push(w);
    }
    const accepted = [words, ...(q.alt ?? []).map(sentenceTokens)].map(normTokens);
    const buildBank = () => shuffle([...words, ...decoys].map((w, idx) => ({ w, used: false, idx })));
    let bank = buildBank();
    let answer: { w: string; idx: number }[] = [];
    let answered = false;
    let attempted = isHintUnlocked('grammar', topicId, SUSUN_SECTION, round);
    let hintUsed = false;
    let hintCount = 0;

    function applyHint(): void {
      hintUsed = true;
      hintCount = Math.max(1, Math.round(words.length * cfg.hintRatio));
      bank = buildBank();
      answer = [];
      for (let i = 0; i < hintCount; i++) {
        const tile = bank.find((b) => b.idx === i)!;
        tile.used = true;
        answer.push(tile);
      }
    }

    function paint(): void {
      const wrongSoFar = getSlot('grammar', topicId, SUSUN_SECTION, round)?.w ?? 0;
      const locked = cfg.hintGate && !attempted;
      container.innerHTML = `
        ${quizNavHtml(round, order.length, status)}
        <div class="id-text">${q.instruction} · ${round + 1} dari ${order.length}</div>
        <div class="en-text" style="color:var(--c-gram)">${q.prompt}</div>
        ${decoys.length ? `<p class="meta g-decoy-note">Ada ${decoys.length} kata jebakan — tidak dipakai</p>` : ''}
        ${wrongSoFar >= cfg.revealAfter ? `<p class="meta" style="margin:6px 0 0;text-align:center">💡 Jawabannya: <b>${words.join(' ')}</b></p>` : ''}
        <div class="answer-row ${answer.length ? '' : 'empty'}" style="margin-top:10px">
          ${answer.map((a, ai) => `<span class="chip placed${ai < hintCount ? ' hint' : ''}" data-action="unpick" data-payload="${ai}">${a.w}</span>`).join('')}
        </div>
        <div class="bank-row">
          ${bank.map((b, bi) => `<span class="chip ${b.used ? 'hidden' : ''}" data-action="pick" data-payload="${bi}">${b.w}</span>`).join('')}
        </div>
        <div class="feedback" id="fb"></div>
        ${
          answered
            ? ''
            : `<div class="letter-actions">
          <button class="ghost-btn slim" type="button" data-action="hint" ${hintUsed || locked ? 'disabled' : ''}><span class="hint-bulb">${locked ? '🔒' : '💡'}</span> Petunjuk</button>
          <button class="ghost-btn slim" type="button" data-action="removeLastWord" ${answer.length <= hintCount ? 'disabled' : ''}>⌫ Hapus Kata</button>
          <button class="ghost-btn slim" type="button" data-action="clear">🔄 Bersihkan</button>
        </div>`
        }
      `;
      wireQuizNav(goTo);
      setHandlers({
        hint: () => {
          if (hintUsed || answered || (cfg.hintGate && !attempted)) return;
          markSlotHint('grammar', topicId, SUSUN_SECTION, round);
          applyHint();
          paint();
        },
        clear: () => {
          if (answered) return;
          answer = answer.slice(0, hintCount);
          bank.forEach((b) => {
            b.used = answer.some((a) => a.idx === b.idx);
          });
          paint();
        },
        removeLastWord: () => {
          if (answered || answer.length <= hintCount) return;
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
          if (ai < hintCount) return;
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
      container.querySelector('.letter-actions')?.remove();
      const fb = container.querySelector<HTMLElement>('#fb')!;
      const correct = accepted.includes(normTokens(answer.map((a) => a.w)));
      if (correct) {
        recordAttempt(true);
        playCorrectTone();
        fireConfetti();
        fb.textContent = pickPraise(level);
        fb.className = 'feedback good';
        speak(q.target);
      } else {
        recordAttempt(false);
        container.querySelector('.answer-row')?.classList.add('is-wrong');
        playWrongTone();
        vibrateDevice(160);
        fb.textContent = pickEncourage(level);
        fb.className = 'feedback bad';
      }
      markSlotAnswered('grammar', topicId, SUSUN_SECTION, round, correct, { hint: hintUsed, itemRef: q.itemRef });
      recordEvent({ kind: 'answer', skill: 'grammar', topicId, section: SUSUN_SECTION, slot: round, itemRef: q.itemRef, activity: 'susun', correct, hintUsed });
      fb.insertAdjacentHTML('afterend', roundActionsHtml(allSlotsDone(order.length, status)));
      setHandlers({
        tryAgainRound: () => {
          // Bagian Petunjuk TETAP dipertahankan (non-punitive, pola Vocab).
          answered = false;
          answer = answer.slice(0, hintCount);
          bank.forEach((b) => {
            b.used = answer.some((a) => a.idx === b.idx);
          });
          paint();
        },
        nextRound: () => {
          round = nextUnfinishedRound(round, order.length, status);
          setSectionCursor('grammar', topicId, SUSUN_SECTION, Math.min(round, order.length - 1));
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
 * Tab "🕵️ Detektif Kalimat" — Explorer, Adventurer, Achiever (5 soal,
 * section `tantangan-detektif`). Permintaan user: Susun Kalimat di Tantangan
 * mengulang Latihan Inti level ini → diganti tugas BARU: 1 kalimat yang SATU
 * katanya diganti bentuk keliru (`wrong`, dijamin tidak gramatikal), anak tap
 * kata yang keliru itu. Latihan Inti = menyusun, tab 1 = memilih bentuk, tab
 * ini = menemukan kesalahan (error recognition, akrab di sekolah Indonesia).
 * Teks ke anak TIDAK memakai "salah" — "keliru"/"kurang pas".
 * Tier: Explorer arti tampil; Adventurer arti lewat 💡 Petunjuk; Achiever
 * arti lewat Petunjuk 🔒 + sesudah menemukan kata, pilih juga bentuk yang
 * benar. Topik `meaningNeeded` (bentuk keliru gramatikal tapi beda arti):
 * arti SELALU tampil.
 * ================================================================
 */
const DETEKTIF_SECTION = 'tantangan-detektif';

interface DetektifTier {
  showMeaning: boolean;
  hintGate: boolean;
  /** Sesudah menemukan kata keliru, pilih juga bentuk yang benar. */
  fixStep: boolean;
  /** Kata keliru otomatis ditunjukkan setelah N kali meleset. */
  revealAfter: number;
}

function detektifTier(contentLevel: LevelKey): DetektifTier {
  if (contentLevel === 'explorer') return { showMeaning: true, hintGate: false, fixStep: false, revealAfter: 2 };
  if (contentLevel === 'adventurer') return { showMeaning: false, hintGate: false, fixStep: false, revealAfter: 2 };
  return { showMeaning: false, hintGate: true, fixStep: true, revealAfter: 3 };
}

function runDetektifTab(container: HTMLElement, topic: GrammarSentenceTopic, onDone: OnDone, level: LevelKey, contentLevel: LevelKey): void {
  const cfg = detektifTier(contentLevel);
  const plan = ensureSusunPlanFor(topic.id, DETEKTIF_SECTION, topic.sentences.length);
  const order = plan.map((i) => topic.sentences[i] ?? topic.sentences[0]);
  let round = firstUnansweredSlot('grammar', topic.id, DETEKTIF_SECTION, order.length);
  const status = (i: number): 0 | 1 | 2 => getSlot('grammar', topic.id, DETEKTIF_SECTION, i)?.st ?? 0;

  function goTo(i: number): void {
    round = Math.min(Math.max(i, 0), order.length - 1);
    setSectionCursor('grammar', topic.id, DETEKTIF_SECTION, round);
    draw();
  }

  function draw(): void {
    if (round >= order.length) return onDone();
    const s = order[round];
    const tokens = s.en.split(/\s+/);
    const keyIdx = tokens.findIndex((t) => t.replace(/[.,!?]/g, '') === s.key);
    // Bentuk keliru dipilih tetap per soal (bukan acak tiap redraw) —
    // bergantian wrong[0]/wrong[1] mengikuti nomor soal.
    const rawWrong = s.wrong[round % 2];
    const wrongWord = keyIdx === 0 ? rawWrong[0].toUpperCase() + rawWrong.slice(1) : rawWrong;
    const shown = tokens.map((t, i) => (i === keyIdx ? t.replace(s.key, wrongWord) : t));
    const fixOptions = shuffle([s.key, ...s.wrong]);
    let found = false; // kata keliru sudah ditemukan (tahap 1 beres)
    let answered = false;
    let attempted = isHintUnlocked('grammar', topic.id, DETEKTIF_SECTION, round);
    let revealed = false;
    let tappedWrong: number | null = null;
    const meaningShown = () => cfg.showMeaning || !!topic.meaningNeeded || revealed;

    function sentenceHtml(): string {
      return shown
        .map((t, i) => {
          const cls = found && i === keyIdx ? ' dt-found' : tappedWrong === i ? ' dt-miss' : '';
          const txt = answered && found && i === keyIdx ? t.replace(wrongWord, `<s>${wrongWord}</s> ${s.key}`) : t;
          return `<span class="chip dt-word${cls}" data-action="tapWord" data-payload="${i}">${txt}</span>`;
        })
        .join('');
    }

    function paint(): void {
      const missSoFar = getSlot('grammar', topic.id, DETEKTIF_SECTION, round)?.w ?? 0;
      const showHint = !cfg.showMeaning && !topic.meaningNeeded && !answered;
      container.innerHTML = `
        ${showHint ? `<div class="latihan-head no-wrap" style="justify-content:flex-end">${hintChipHtml(cfg.hintGate && !attempted, revealed)}</div>` : ''}
        ${quizNavHtml(round, order.length, status)}
        ${
          // Terjemahan dibuat dominan (permintaan user: "user kurang aware"),
          // pola sama Susun Kalimat Latihan Inti.
          meaningShown()
            ? `<div class="id-text">Ada 1 kata yang kurang pas — tap kata itu · ${round + 1} dari ${order.length}</div>
        <div class="g-trans">🇮🇩 ${s.id}</div>`
            : `<div class="id-text">Arti kalimatnya ada di 💡 Petunjuk · ${round + 1} dari ${order.length}</div>
        <div class="g-trans">Temukan 1 kata yang kurang pas</div>`
        }
        <div class="bank-row dt-sentence" style="margin-top:10px">${sentenceHtml()}</div>
        ${!found && missSoFar >= cfg.revealAfter ? `<p class="meta" style="margin:6px 0 0;text-align:center">💡 Kata yang kurang pas: <b>${wrongWord}</b></p>` : ''}
        ${
          found && cfg.fixStep && !answered
            ? `<div class="id-text" style="font-weight:800;margin:10px 0 4px">Ketemu! Sekarang pilih bentuk yang pas:</div>
        <div class="opt-grid g-choose${fixOptions.some((o) => o.includes(' ') || o.length > 9) ? ' long' : ''}">${fixOptions.map((o, i) => `<button class="opt-btn opt-btn-text" type="button" data-action="fix" data-payload="${i}">${o}</button>`).join('')}</div>`
            : ''
        }
        <div class="feedback" id="fb"></div>
      `;
      wireQuizNav(goTo);
      setHandlers({
        petunjuk: () => {
          if (revealed || (cfg.hintGate && !attempted)) return;
          markSlotHint('grammar', topic.id, DETEKTIF_SECTION, round);
          revealed = true;
          paint();
        },
        tapWord: (payload) => {
          if (answered || found) return;
          const i = Number(payload);
          attempted = true;
          if (i === keyIdx) {
            found = true;
            tappedWrong = null;
            if (cfg.fixStep) {
              playCorrectTone();
              paint();
            } else finish(true);
          } else {
            tappedWrong = i;
            finish(false);
          }
        },
        fix: (payload) => {
          if (answered) return;
          const chosen = fixOptions[Number(payload)];
          const ok = chosen === s.key;
          container.querySelectorAll<HTMLButtonElement>('.opt-btn').forEach((b, bi) => {
            b.disabled = true;
            if (fixOptions[bi] === s.key && ok) b.classList.add('correct');
            if (bi === Number(payload) && !ok) b.classList.add('wrong');
          });
          finish(ok);
        },
      });
    }

    function finish(correct: boolean): void {
      answered = true;
      paint();
      const fb = container.querySelector<HTMLElement>('#fb')!;
      if (correct) {
        recordAttempt(true);
        playCorrectTone();
        fireConfetti();
        fb.innerHTML = `${pickPraise(level)}<div class="id-text" style="margin-top:6px">✅ ${s.en}</div>`;
        fb.className = 'feedback good';
        speak(s.en);
      } else {
        recordAttempt(false);
        container.querySelector('.dt-miss')?.classList.add('is-wrong');
        playWrongTone();
        vibrateDevice(160);
        fb.textContent = pickEncourage(level);
        fb.className = 'feedback bad';
      }
      markSlotAnswered('grammar', topic.id, DETEKTIF_SECTION, round, correct, { hint: revealed, itemRef: s.en });
      recordEvent({ kind: 'answer', skill: 'grammar', topicId: topic.id, section: DETEKTIF_SECTION, slot: round, itemRef: s.en, activity: 'detektif', correct, hintUsed: revealed });
      fb.insertAdjacentHTML('afterend', roundActionsHtml(allSlotsDone(order.length, status)));
      setHandlers({
        tryAgainRound: () => {
          // Kata yang sudah ditemukan TETAP ditemukan (non-punitive) —
          // Achiever yang keliru di tahap 2 cukup mengulang pilih bentuk.
          answered = false;
          tappedWrong = null;
          paint();
        },
        nextRound: () => {
          round = nextUnfinishedRound(round, order.length, status);
          setSectionCursor('grammar', topic.id, DETEKTIF_SECTION, Math.min(round, order.length - 1));
          draw();
        },
      });
    }

    paint();
  }

  draw();
}

/** Pembungkus 2 tab (pola Vocab `runTantangan`). Tab 2 = Susun Kalimat,
 *  KECUALI Explorer–Achiever = "🕵️ Detektif Kalimat" (`secondLabel`). */
function runTantanganTabs(container: HTMLElement, mainLabel: string, runMain: (stage: HTMLElement, done: OnDone) => void, runSusun: (stage: HTMLElement, done: OnDone) => void, onDone: OnDone, secondLabel = '🔤 Susun Kalimat'): void {
  function shellHtml(active: 'main' | 'susun'): string {
    return `
      <div class="tantangan-tabs">
        <button class="tantangan-tab ${active === 'main' ? 'active' : ''}" type="button" data-action="tabMain">${mainLabel}</button>
        <button class="tantangan-tab ${active === 'susun' ? 'active' : ''}" type="button" data-action="tabSusun">${secondLabel}</button>
      </div>
      <div id="tantanganStage"></div>
    `;
  }
  function openMain(): void {
    container.innerHTML = shellHtml('main');
    setHandlers({ tabMain: openMain, tabSusun: openSusun });
    runMain(container.querySelector<HTMLElement>('#tantanganStage')!, () => {
      requestSync();
      openSusun();
    });
  }
  function openSusun(): void {
    container.innerHTML = shellHtml('susun');
    setHandlers({ tabMain: openMain, tabSusun: openSusun });
    runSusun(container.querySelector<HTMLElement>('#tantanganStage')!, onDone);
  }
  openMain();
}

export function runTantanganPattern(container: HTMLElement, topic: GrammarPatternTopic, onDone: OnDone, level: LevelKey, contentLevel: LevelKey): void {
  runTantanganTabs(
    container,
    '🔎 Pilih yang Pas',
    (stage, done) => runTantanganPatternMain(stage, topic, done, level),
    (stage, done) => runSusunTab(stage, topic.id, patternSusunQuestions(topic), done, level, contentLevel),
    onDone
  );
}

export function runTantanganSentence(container: HTMLElement, topic: GrammarSentenceTopic, onDone: OnDone, level: LevelKey, contentLevel: LevelKey): void {
  runTantanganTabs(
    container,
    '🔎 Pilih Bentuk',
    (stage, done) => runTantanganSentenceMain(stage, topic, done, level, contentLevel),
    (stage, done) => runDetektifTab(stage, topic, done, level, contentLevel),
    onDone,
    '🕵️ Detektif Kalimat'
  );
}

/** Trailblazer: Tantangan = 1 aktivitas saja (permintaan user "hilangkan
 *  susun kalimat di tantangan") — tanpa tab ke-2 Susun Kalimat. */
export function runTantanganTransform(container: HTMLElement, topic: GrammarTransformTopic, onDone: OnDone, level: LevelKey, contentLevel: LevelKey): void {
  runTantanganTransformMain(container, topic, onDone, level, contentLevel);
}

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
 * NEGATIF = jawaban — dipakai "suka/tidak-suka" MAUPUN "have"/"can" krn
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
/** `badges:false` = kartu sudah berlabel teks (🎮 Main, atau `LABELED_VISUALS`
 *  di Latihan Inti/Tantangan) — lencana ✅/❌, 🔍/🔭, angka 1/2, dst jadi
 *  dobel info & disembunyikan (permintaan user: "ketika sudah ada text remove
 *  saja icon di atas text biar tidak redundan"). Beda ukuran gambar
 *  (proximity/size) & jumlah gambar (quantity) tetap. */
export function contrastVisualInner(emoji: string, isFormB: boolean, visual: GrammarContrastVisual, scale = 1, badges = true): string {
  // Ukuran dasar dikali `scale` — kartu Latihan Inti 1.3, gambar Kenalan Main
  // & stimulus Tantangan lebih besar lagi (permintaan user: "gambar/icon
  // sedikit besar supaya jelas"). Lencana (✅/😊/🔍/👦 …) ikut membesar,
  // dulu cuma 13px sehingga tanda pembedanya justru paling susah dilihat.
  const px = (n: number) => Math.round(n * scale);
  const pic = (size: number, extra = '') => `<span style="font-size:${px(size)}px;display:block;line-height:1.15${extra}" aria-hidden="true">${emoji}</span>`;
  const badge = (b: string) => (badges ? `<span class="lbl cv-badge" style="font-size:${px(22)}px" aria-hidden="true">${b}</span>` : '');
  if (visual === 'polarity') return pic(34) + badge(isFormB ? '❌' : '✅');
  if (visual === 'liking') return pic(34) + badge(isFormB ? '😖' : '😊');
  if (visual === 'proximity') return pic(isFormB ? 22 : 44) + badge(isFormB ? '🔭' : '🔍');
  if (visual === 'size') return pic(isFormB ? 20 : 46);
  if (visual === 'character') return pic(34) + badge(isFormB ? '👧' : '👦');
  if (visual === 'possessor') return pic(34) + badge(isFormB ? '🫵' : '🙋');
  if (visual === 'inclusion') return pic(34) + badge(isFormB ? '👉' : '🙋');
  const count = isFormB ? 2 : 1;
  return `<span style="font-size:${px(34)}px;display:block;line-height:1.15${count > 1 ? ';letter-spacing:6px' : ''}" aria-hidden="true">${emoji.repeat(count)}</span>${badges ? `<span class="lbl cv-badge" style="font-size:${px(18)}px">${count}</span>` : ''}`;
}

/** 🔒 Kontras yang lencananya TIDAK langsung terbaca anak → kartu Latihan
 *  Inti & gambar Tantangan diberi label teks (sama dgn label kartu 🎮 Main,
 *  `topic.choice`). Permintaan user: "jika icon nya tidak straightforward
 *  relevan maka tambahkan text" (audit `materi/grammar.md` §26):
 *  - polarity ✅/❌ terbaca "benar/salah", bukan "mau/tidak mau";
 *  - liking 😖 bisa terbaca sakit/sedih, bukan "tidak suka";
 *  - proximity 🔍/🔭 (kaca pembesar/teleskop) asing utk anak 3–7 th;
 *  - possessor 🙋/🫵 & inclusion 🙋/👉 (aku/kamu, kita/mereka) abstrak;
 *  - quantity, size & character — permintaan user: samakan teks dgn 🎮 Main
 *    ("Satu"/"Banyak", "Besar"/"Kecil", "Meja kakak laki-laki"/"… kakak
 *    perempuan"). Sekarang SEMUA varian berlabel.
 *  Label = terjemahan konsep (Indonesia), bukan teks kalimat
 *  Inggris → anak tetap harus paham kata Inggris yang didengar. */
export const LABELED_VISUALS: ReadonlySet<GrammarContrastVisual> = new Set(['quantity', 'size', 'character', 'polarity', 'liking', 'proximity', 'possessor', 'inclusion']);

/** Label kartu kontras — `topic.choice.a/b`, `{x}` diganti nama benda item
 *  itu (mis. "Senang atau Tidak?": "Sedih"/"Tidak sedih" utk item sad). */
export function choiceLabel(topic: GrammarPatternTopic, item: GrammarPatternItem, isFormB: boolean): string {
  const raw = (isFormB ? topic.choice.b : topic.choice.a).replace(/\{x\}/g, choiceNoun(item.id));
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

interface ContrastCard {
  item: GrammarPatternItem;
  emoji: string;
  isFormB: boolean;
  ok: boolean;
}

/** Kartu jawaban kontras Latihan Inti — 🔒 WAJIB beda dari Kenalan "🎮 Main"
 *  (permintaan user: di "Satu atau Banyak" keduanya sempat 100% sama). Main =
 *  2 kartu 1 benda + label konsep ("Satu"/"Banyak"); Latihan Inti = 4 kartu
 *  berisi 2 benda × 2 bentuk di SEMUA level (permintaan user "cukup 4 opsi
 *  saja" — dulu Starter 3 benda = 6 kartu), mis. 🚗 / 🚗🚗 / 🚌 /
 *  🚌🚌 — anak harus menangkap BENDA dan BENTUK grammar-nya sekaligus (pola
 *  Cambridge Starters "seluruh kalimat harus cocok"). Posisi kartu diacak;
 *  benda lain dipilih bergilir per soal supaya pasangannya berganti. */
function buildContrastCards(topic: GrammarPatternTopic, target: GrammarPatternItem, wantFormB: boolean, round: number): ContrastCard[] {
  const nObjects = 2;
  // Benda pembanding TIDAK diambil dari tetangga dekat target di daftar topik
  // (kata mirip biasanya berdampingan, mis. 🎨 drawing & 🖌️ painting) —
  // supaya yang diuji bentuk grammar-nya, bukan membedakan 2 gambar mirip.
  const ti = topic.items.indexOf(target);
  const n = topic.items.length;
  const far = topic.items.filter((it, i) => it.emoji !== target.emoji && Math.min(Math.abs(i - ti), n - Math.abs(i - ti)) >= 2);
  const others = far.length ? far : topic.items.filter((it) => it.emoji !== target.emoji);
  const picked: GrammarPatternItem[] = [];
  for (let k = 0; picked.length < nObjects - 1 && k < others.length * 2; k++) {
    const cand = others[(round + k * 3) % others.length];
    const nearPicked = picked.some((p) => {
      const d = Math.abs(topic.items.indexOf(p) - topic.items.indexOf(cand));
      return p.emoji === cand.emoji || Math.min(d, n - d) < 2;
    });
    if (!nearPicked) picked.push(cand);
  }
  const cards: ContrastCard[] = [];
  for (const it of [target, ...picked]) {
    for (const isB of [false, true]) cards.push({ item: it, emoji: it.emoji, isFormB: isB, ok: it === target && isB === wantFormB });
  }
  return shuffle(cards);
}

function contrastCardsHtml(cards: ContrastCard[], topic: GrammarPatternTopic): string {
  const visual: GrammarContrastVisual = topic.contrastVisual ?? 'quantity';
  const scale = cards.length > 4 ? 1.1 : 1.3;
  const label = (c: ContrastCard) => (LABELED_VISUALS.has(visual) ? `<span class="pattern-card-label">${choiceLabel(topic, c.item, c.isFormB)}</span>` : '');
  return `<div class="opt-grid pattern-cards${cards.length > 4 ? ' six' : ''}">
    ${cards.map((c, i) => `<button class="opt-btn" type="button" data-action="pick" data-payload="${i}">${contrastVisualInner(c.emoji, c.isFormB, visual, scale, !LABELED_VISUALS.has(visual))}${label(c)}</button>`).join('')}
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
export function renderKenalanPattern(container: HTMLElement, topic: GrammarPatternTopic, _onNext: OnDone, level: LevelKey): void {
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
        if (url) playRecording(url);
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
        openMicResultPopup(it, index, null, micErrorText(kind));
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

/** Keterangan Indonesia dgn kata yang MEMBEDAKAN 2 bentuk ditebalkan (mis.
 *  "Aku <b>tidak</b> suka menggambar."), dihitung dari selisih kata `formA.id`
 *  vs `formB.id` — tanpa data baru. */
function contrastCaptionHtml(text: string, other: string): string {
  const norm = (w: string) => w.toLowerCase().replace(/[^a-z0-9-]/g, '');
  const otherWords = new Set(other.split(/\s+/).map(norm));
  return text
    .split(/\s+/)
    .map((w) => (norm(w) && !otherWords.has(norm(w)) ? `<b>${w}</b>` : w))
    .join(' ');
}

/** Nama benda utk `{x}` di pertanyaan Main — huruf kecil ("Mobil" → "mobil"),
 *  KECUALI singkatan (PR) & nama diri (Inggris). */
function choiceNoun(name: string): string {
  return name
    .split(' ')
    .map((w) => (w.length > 1 && w === w.toUpperCase()) || w === 'Inggris' ? w : w.toLowerCase())
    .join(' ');
}

/** 🎮 Main · Dengar & Pilih — dipicu dari Kenalan, mulai di kata yang
 *  ditap (CLAUDE.md "Section Ber-Bullet-Progress" pengecualian Kenalan Main),
 *  lanjut ke kata lain lewat bullet progress. Anak dengar SATU kalimat, lalu
 *  jawab pertanyaan KHUSUS TOPIK (`topic.choice`, mis. "Satu atau banyak?" →
 *  🚗 Satu / 🚗🚗 Banyak, "Punyaku atau punyamu?") lewat 2 kartu gambar
 *  kontras berlabel. Permintaan user: sempat 1 format generik "Sama atau
 *  Beda?" utk semua topik — "jangan dipukul rata, sesuaikan konteks".
 *  2 panel bernomor: ① soal (dengar kalimat), ② jawaban (pertanyaan topik +
 *  2 kartu, pertanyaan diawali kata tanya + nama benda, mis. "Apakah satu
 *  atau banyak mobil?"). Sesudah menjawab kalimat Inggris + artinya tampil (kata pembeda
 *  ditebalkan). 💡 Petunjuk = teks Inggris kalimatnya + terjemahannya di
 *  sebelahnya (sesudah menjawab, arti tampil lewat caption di bawahnya). */
function runPatternMiniGame(container: HTMLElement, topic: GrammarPatternTopic, startIndex: number, onBack: OnDone, level: LevelKey): void {
  const visual: GrammarContrastVisual = topic.contrastVisual ?? 'quantity';
  const total = topic.items.length;
  let current = startIndex;
  let sentenceIsFormB = false;
  let answered = false;
  let revealed = false;

  const kenalanStatus = (i: number): 0 | 1 | 2 => getSlot('grammar', topic.id, 'kenalan', i)?.st ?? 0;
  const sentence = () => (sentenceIsFormB ? topic.items[current].formB : topic.items[current].formA);

  function paint(): void {
    const item = topic.items[current];
    const said = sentence();
    const other = sentenceIsFormB ? item.formA : item.formB;
    const choiceCard = (isB: boolean) => `
          <button class="opt-btn gm-ans gm-choice ${isB ? 'gm-ans-b' : 'gm-ans-a'}" type="button" data-action="pick" data-payload="${isB ? 1 : 0}">
            <span class="gm-choice-pic">${contrastVisualInner(item.emoji, isB, visual, 1.4, false)}</span>
            <span class="gm-ans-label">${choiceLabel(topic, item, isB)}</span>
          </button>`;
    container.innerHTML = `
      <div class="latihan-head no-wrap">
        <span class="stage-badge">🎮 Main · Dengar &amp; Pilih</span>
        ${answered ? '' : `<button class="ghost-btn hint-chip" type="button" data-action="petunjuk" ${revealed ? 'disabled' : ''}><span class="hint-bulb">💡</span> Petunjuk</button>`}
      </div>
      ${quizNavHtml(current, total, kenalanStatus)}
      <section class="gm-panel gm-question" aria-label="Soal">
        <div class="gm-step">Dengarkan kalimatnya</div>
        <div class="gm-listen">
          <button class="speak-btn pt-cta" type="button" data-action="replay">🔊 Dengar</button>
          ${revealed || answered ? `<div class="gm-said">"${said.en}"${revealed && !answered ? ` <span class="gm-said-id">${said.id}</span>` : ''}</div>` : ''}
          ${answered ? `<div class="gm-caption">${contrastCaptionHtml(said.id, other.id)}</div>` : ''}
        </div>
      </section>
      <section class="gm-panel gm-answer" aria-label="Jawaban">
        <div class="gm-step">${topic.choice.question.replace(/\{x\}/g, choiceNoun(item.id))}</div>
        <div class="opt-grid gm-answers">${choiceCard(false)}${choiceCard(true)}
        </div>
      </section>
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
        const i = Number(payload);
        onAnswer(i === (sentenceIsFormB ? 1 : 0), i);
      },
    });
  }

  function goTo(i: number): void {
    current = Math.min(Math.max(i, 0), total - 1);
    sentenceIsFormB = Math.random() < 0.5;
    answered = false;
    revealed = false;
    speak(sentence().en);
    paint();
  }

  function onAnswer(correct: boolean, i: number): void {
    const said = sentence();
    answered = true;
    markSlotAnswered('grammar', topic.id, 'kenalan', current, correct, { itemRef: topic.items[current].formA.en });
    // Gambar ulang: kalimat Inggris & artinya kini tampil di panel ①.
    paint();
    lockOptionButtons(container);
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

  sentenceIsFormB = Math.random() < 0.5;
  speak(sentence().en);
  paint();
}

/**
 * Latihan Inti "👂 Dengar & Tunjuk" — 10 soal (plan `buildPatternPlan`, tiap
 * kata keluar tepat 1x, bentuk formA/formB diacak terpisah 5:5): dengar SATU
 * bentuk kalimat (auto-play + "🔊 Dengar" replay manual), tunjuk kartu
 * kontras yang cocok — audio→gambar, comprehension murni.
 */
export function runLatihanIntiPattern(container: HTMLElement, topic: GrammarPatternTopic, onDone: OnDone, level: LevelKey, _contentLevel: LevelKey): void {
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
    cards = buildContrastCards(topic, order[round].item, order[round].wantFormB, round);
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
      <div class="id-text" style="font-weight:800;margin:6px 0 4px">Cari gambar yang pas dengan kalimatnya</div>
      ${contrastCardsHtml(cards, topic)}
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
        markSlotAnswered('grammar', topic.id, 'latihan', round, correct, { hint: revealed, itemRef: form.en });
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
function runTantanganPatternMain(container: HTMLElement, topic: GrammarPatternTopic, onDone: OnDone, level: LevelKey): void {
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
          <span class="stage-badge tab-dup">🔎 Lihat &amp; Dengar, Pilih yang Pas</span>
          <button class="ghost-btn hint-chip" type="button" data-action="petunjuk" ${revealed ? 'disabled' : ''}><span class="hint-bulb">💡</span> Petunjuk</button>
        </div>
        ${quizNavHtml(round, order.length, slotStatus)}
        <div class="id-text">Soal ${round + 1} dari ${order.length}</div>
        <div class="g-listen-pic">${contrastVisualInner(target.emoji, wantFormB, visual, 1.7, !LABELED_VISUALS.has(visual))}${LABELED_VISUALS.has(visual) ? `<span class="pattern-card-label big">${choiceLabel(topic, target, wantFormB)}</span>` : ''}</div>
        <div class="id-text" style="font-weight:800;margin:6px 0 4px">Dengarkan tiap pilihan (boleh berkali-kali), lalu pilih yang cocok dengan gambar ini</div>
        <div class="opt-grid g-listen">
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
      markSlotAnswered('grammar', topic.id, 'tantangan-pola', round, correct, { hint: revealed, itemRef: target.en });
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
  // Opsi = kalimat utuh → daftar 1 kolom (2×2 bikin kalimat panjang sempit di HP).
  return `<div class="opt-grid g-transform">
    ${options.map((text, i) => `<button class="opt-btn opt-btn-text" type="button" data-action="pick" data-payload="${i}">${text}</button>`).join('')}
  </div>`;
}

/** Tier Lanjut (Trailblazer): 🔒 terkunci sampai 1x coba (pembeda level,
 *  `materi/pembeda_level.md` § Grammar #5). */
function transformHintButtonHtml(locked: boolean): string {
  return `<button class="ghost-btn hint-chip" type="button" id="hintBtn" data-action="hint" ${locked ? 'disabled' : ''}><span class="hint-bulb">${locked ? '🔒' : '💡'}</span> Petunjuk</button>`;
}

/** Jumlah opsi salah yang dicoret Petunjuk: 2 dari 4 (sisa 50/50) —
 *  permintaan user 2026-09-28 (dulu tier Lanjut cuma 1). */
function transformEliminateCount(_contentLevel: LevelKey): number {
  return 2;
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

export function renderKenalanTransform(container: HTMLElement, topic: GrammarTransformTopic, _onNext: OnDone): void {
  container.innerHTML = `
    <div class="id-text" style="margin-bottom:10px;">${transformUi(topic).kenalan}</div>
    <div class="primer-list">
      ${topic.transforms
        .map((t, i) => {
          const correct = t.reportedOptions.find((o) => o.ok)!;
          return `
        <div class="primer-item" style="align-items:flex-start">
          <div class="primer-ic">${picHtml(t.emoji)}</div>
          <div class="txt">
            <b>${sourceText(t)}</b>
            <span style="display:block;margin-top:4px">→ ${correct.text}</span>
          </div>
          <div class="mini-play" data-action="play" data-payload="${i}">🔊</div>
        </div>`;
        })
        .join('')}
    </div>
  `;
  setHandlers({
    play: (payload) => {
      const t = topic.transforms[Number(payload)];
      const correct = t.reportedOptions.find((o) => o.ok)!;
      speakSequence([t.original, correct.text]);
    },
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
    attempted = isHintUnlocked('grammar', topic.id, 'latihan', round);
    redraw();
  }

  function redraw(): void {
    const target = order[round];
    const options = shuffle(target.reportedOptions);

    container.innerHTML = `
      <div class="latihan-head no-wrap">
        <span class="stage-badge">${transformUi(topic).latihan}</span>
        ${transformHintButtonHtml(hintGate && !attempted)}
      </div>
      ${quizNavHtml(round, order.length, slotStatus)}
      <div class="id-text">Soal ${round + 1} dari ${order.length}</div>
      <div class="big-emoji" style="font-size:40px">${picHtml(target.emoji)}</div>
      <div class="en-text">${sourceText(target)}</div>
      <div class="speak-row"><button class="speak-btn-ghost" type="button" data-action="replay">🔊 Dengar</button></div>
      ${transformOptionsHtml(options.map((o) => o.text))}
      <div class="feedback" id="fb"></div>
    `;
    wireTransformHint(
      container,
      options.map((o) => o.ok),
      transformEliminateCount(contentLevel),
      () => {
        hintUsedThisSlot = true;
        markSlotHint('grammar', topic.id, 'latihan', round);
      }
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
function runTantanganTransformMain(container: HTMLElement, topic: GrammarTransformTopic, onDone: OnDone, level: LevelKey, contentLevel: LevelKey): void {
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
    attempted = isHintUnlocked('grammar', topic.id, 'tantangan-transform', round);
    options = buildOriginalOptions(order[round]);
    redraw();
  }

  function redraw(): void {
    const target = order[round];
    const correct = target.reportedOptions.find((o) => o.ok)!;

    container.innerHTML = `
      <div class="latihan-head no-wrap">
        <span class="stage-badge">${transformUi(topic).tantangan}</span>
        ${transformHintButtonHtml(hintGate && !attempted)}
      </div>
      ${quizNavHtml(round, order.length, slotStatus)}
      <div class="id-text">Soal ${round + 1} dari ${order.length}</div>
      <div class="big-emoji" style="font-size:40px">${picHtml(target.emoji)}</div>
      <div class="en-text">${correct.text}</div>
      <div class="speak-row"><button class="speak-btn-ghost" type="button" data-action="replay">🔊 Dengar</button></div>
      <div class="id-text" style="font-weight:800;margin:6px 0 4px">${transformUi(topic).tantanganAsk}</div>
      ${transformOptionsHtml(options.map((o) => sourceText(target, o)))}
      <div class="feedback" id="fb"></div>
    `;
    wireTransformHint(
      container,
      options.map((o) => o === target.original),
      transformEliminateCount(contentLevel),
      () => {
        hintUsedThisSlot = true;
        markSlotHint('grammar', topic.id, 'tantangan-transform', round);
      }
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
