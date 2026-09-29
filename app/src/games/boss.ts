/**
 * Tantangan Raja — tes akhir level (`materi/test_level.md`, keputusan user
 * 2026-09-29, menggantikan desain "selalu menang" `test_perlevel.md`).
 *
 * 🔒 Aturan naik level (Opsi A): anak naik level HANYA kalau ke-4 babak
 * objektif (Vocabulary, Listening, Reading, Grammar) masing-masing ≥ 80%
 * benar (`passNeed`). Speaking = babak bonus, skornya dilaporkan saja
 * (ASR anak belum andal). Tidak ada syarat materi/kehadiran.
 *
 * Alur:
 *  - **Arena** (`renderHub`) — 5 babak, dikerjakan satu-satu (tes panjang
 *    di level atas dipecah per skill, kemajuan tersimpan di `Store.bossTests`
 *    sehingga boleh berhenti & lanjut nanti). Babak yang sudah lolos tidak
 *    perlu diulang.
 *  - **Soal** (`drawQuestion`) — bullet progress bisa diklik, 1 tap = jawaban
 *    (skor = percobaan pertama). Benar → pujian + nada + confetti; belum
 *    tepat → merah + getar + "tetot" + jawabannya ditunjukkan. Tanpa timer.
 *  - **Zona batas** — kurang TEPAT 1 dari syarat → 3 soal bonus; benar semua
 *    = lolos (peringatan Cambridge: skor pas di batas perlu dicek ulang).
 *  - **Hasil babak** (`renderResult`) — lolos ✅ / "Belum lolos, gapapa!" +
 *    misi latihan (topik yang paling banyak meleset) + coba lagi dgn soal
 *    baru. Tidak ada status "gagal", tidak pernah turun level.
 *  - Semua babak objektif lolos → `onWin` (app.ts `markBossCleared`).
 *
 * Soal dibangun `boss-bank.ts` (bentuk Tantangan per tier, merata per topik,
 * menghindari soal percobaan sebelumnya). Jawaban tes TIDAK masuk akurasi
 * global Rapor (`recordAttempt` tidak dipanggil) — ringkasan per babak
 * dikirim sbg event `boss_skill`.
 */
import { GRAMMAR_TOPICS_BY_LEVEL, LISTENING_TOPICS_BY_LEVEL, READING_TOPICS_BY_LEVEL, SPEAKING_TOPICS_BY_LEVEL, VOCAB_TOPICS_BY_LEVEL } from '../content';
import { readingPicHtml as picHtml } from '../reading-pic';
import { setGameRoundActive, setHandlers } from '../interaction';
import { getBossTest, isBossCleared, recordEvent, requestSync, saveBossTest, type BossLevelTest, type BossSkillRun } from '../progress';
import {
  listenAndRecordOnce,
  playCorrectTone,
  playRecording,
  playTryAgainTone,
  playWrongTone,
  speakLater,
  sttSupported,
  vibrateDevice,
  wordMatchDetail,
} from '../speech';
import { pickEncourage, pickPraise } from '../praise';
import { fireConfetti } from '../confetti';
import type { LevelKey, SkillKey } from '../types';
import { escapeHtml } from '../util';
import {
  ALL_SKILLS,
  baseOf,
  buildQuestion,
  EXTRA_COUNT,
  minutesFor,
  OBJECTIVE_SKILLS,
  passNeed,
  pickIds,
  questionCount,
  type BossChoiceQ,
  type BossQ,
  type BossSpeakQ,
} from './boss-bank';

/** Skor terbaik per babak (0–100, null = belum pernah selesai). */
export type BossResult = Record<SkillKey, number | null>;

export interface BossCallbacks {
  onWin: (result: BossResult) => void;
  /** Tap misi latihan → buka Latihan Inti topik itu. */
  onPractice: (skill: SkillKey, topicId: string) => void;
}

const SKILL_UI: Record<SkillKey, { label: string; emoji: string }> = {
  vocabulary: { label: 'Vocabulary', emoji: '📚' },
  listening: { label: 'Listening', emoji: '🎧' },
  reading: { label: 'Reading', emoji: '📖' },
  grammar: { label: 'Grammar', emoji: '✏️' },
  speaking: { label: 'Speaking', emoji: '🗣️' },
};

const LETTERS = 'ABCDE';

/** Total perkiraan menit semua babak (info Arena, bukan timer). */
export function estimatedMinutesFor(level: LevelKey): [number, number] {
  return ALL_SKILLS.reduce<[number, number]>((acc, s) => {
    const [a, b] = minutesFor(level, s);
    return [acc[0] + a, acc[1] + b];
  }, [0, 0]);
}

function starsHtml(pct: number): string {
  const n = Math.max(0, Math.min(5, Math.round(pct / 20)));
  return `<span class="boss-stars" aria-label="${n} dari 5 bintang">${'⭐'.repeat(n)}${'☆'.repeat(5 - n)}</span>`;
}

function topicTitle(level: LevelKey, skill: SkillKey, topicId: string): string {
  const pools: Record<SkillKey, { id: string; title: string }[]> = {
    vocabulary: VOCAB_TOPICS_BY_LEVEL[level] ?? [],
    listening: LISTENING_TOPICS_BY_LEVEL[level] ?? [],
    reading: READING_TOPICS_BY_LEVEL[level] ?? [],
    grammar: GRAMMAR_TOPICS_BY_LEVEL[level] ?? [],
    speaking: SPEAKING_TOPICS_BY_LEVEL[level] ?? [],
  };
  const t = pools[skill].find((x) => x.id === topicId);
  // Judul "Indonesia (English)" — cukup bagian Indonesia di chip misi.
  return t ? t.title.replace(/\s*\(.*\)\s*$/, '') : topicId;
}

const topicOf = (id: string): string => id.split('~')[1] ?? '';

/** Hitung hasil 1 run. Speaking: rata-rata skor mic yang terhitung. */
function runScore(skill: SkillKey, run: BossSkillRun): { correct: number; total: number; pct: number } {
  if (skill === 'speaking') {
    const counted = run.res.filter((r): r is number => r !== null && r >= 0);
    const pct = counted.length ? Math.round((counted.reduce((a, b) => a + b, 0) / counted.length) * 100) : 0;
    return { correct: counted.length, total: run.res.length, pct };
  }
  const correct = run.res.filter((r) => r === 1).length;
  return { correct, total: run.res.length, pct: run.res.length ? Math.round((correct / run.res.length) * 100) : 0 };
}

export function runBoss(container: HTMLElement, cb: BossCallbacks, level: LevelKey): void {
  let test: BossLevelTest = getBossTest(level);
  const save = () => saveBossTest(level, test);

  function newRun(skill: SkillKey): BossSkillRun {
    const n = questionCount(level, skill);
    const ids = pickIds(level, skill, n, test.recent[skill] ?? []).filter((id) => buildQuestion(level, id));
    const run: BossSkillRun = { ids, res: ids.map(() => null) };
    test.runs[skill] = run;
    save();
    return run;
  }

  function allObjectivePassed(): boolean {
    return OBJECTIVE_SKILLS.every((s) => test.passed.includes(s));
  }

  function resultForWin(): BossResult {
    const out = {} as BossResult;
    for (const s of ALL_SKILLS) out[s] = test.best[s] ?? null;
    return out;
  }

  /* ---------------------------------------------------------- Arena -- */

  /** Layar soal: banner Arena disembunyikan supaya soal & pilihan muat
   *  1 layar HP (`.boss-playing`, styles.css). */
  function setPlaying(on: boolean): void {
    container.parentElement?.classList.toggle('boss-playing', on);
    if (on) container.scrollIntoView({ block: 'start' });
  }

  function renderHub(): void {
    setGameRoundActive(false);
    setPlaying(false);
    const n = questionCount(level, 'vocabulary');
    const cleared = isBossCleared(level);
    const rows = ALL_SKILLS.map((skill) => {
      const ui = SKILL_UI[skill];
      const run = test.runs[skill];
      const passed = test.passed.includes(skill);
      const bonus = skill === 'speaking';
      const total = questionCount(level, skill);
      const [mLo, mHi] = minutesFor(level, skill);
      let status = `${total} soal · ±${mLo === mHi ? mLo : `${mLo}–${mHi}`} menit`;
      let end = '<span class="boss-skill-go">Mulai ▶</span>';
      let cls = '';
      let bar = '';
      if (run && !run.done) {
        const answered = run.res.filter((r) => r !== null).length + (run.extra?.res.filter((r) => r !== null).length ?? 0);
        const all = run.res.length + (run.extra?.res.length ?? 0);
        status = run.extra ? `Soal bonus ${run.extra.res.filter((r) => r !== null).length + 1} dari ${run.extra.res.length}` : `Soal ${Math.min(answered + 1, all)} dari ${all}`;
        bar = `<span class="boss-skill-bar" aria-hidden="true"><span style="width:${Math.round((answered / Math.max(all, 1)) * 100)}%"></span></span>`;
        end = '<span class="boss-skill-go">Lanjut ▶</span>';
        cls = 'is-progress';
      } else if (passed || (bonus && test.best.speaking !== undefined)) {
        const best = test.best[skill] ?? 0;
        status = bonus ? 'Bonus selesai 🎁' : 'Lolos ✅';
        end = starsHtml(best);
        cls = 'is-passed';
      } else if (run?.done) {
        const sc = runScore(skill, run);
        status = `Belum lolos · ${sc.correct} dari ${sc.total} (target ${passNeed(sc.total)})`;
        end = '<span class="boss-skill-go">Coba lagi 💪</span>';
        cls = 'is-retry';
      }
      const mission = !passed && !bonus && run?.done ? missionHtml(skill, run) : '';
      return `
        <li class="boss-skill ${cls}">
          <button class="boss-skill-row" type="button" data-action="bossSkill" data-payload="${skill}">
            <span class="boss-skill-ic" aria-hidden="true">${ui.emoji}</span>
            <span class="boss-skill-txt">
              <b>${ui.label}${bonus ? ' <span class="tag">Bonus</span>' : ''}</b>
              <span class="boss-skill-status">${status}</span>
              ${bar}
            </span>
            <span class="boss-skill-end">${end}</span>
          </button>
          ${mission}
        </li>`;
    }).join('');
    const passedCount = OBJECTIVE_SKILLS.filter((s) => test.passed.includes(s)).length;
    const [tLo, tHi] = estimatedMinutesFor(level);
    const winReady = allObjectivePassed();
    container.innerHTML = `
      <div class="boss-hub">
        <div class="boss-target">
          <span class="boss-target-ic" aria-hidden="true">🎯</span>
          <div><b>Target tiap babak: benar ${passNeed(n)} dari ${n} soal</b>
          <span>${passedCount} dari 4 babak utama lolos${cleared ? ' · 👑 Raja sudah ditaklukkan' : ''}</span></div>
        </div>
        <div class="boss-hub-dots" aria-hidden="true">${OBJECTIVE_SKILLS.map((s) => `<span class="${test.passed.includes(s) ? 'done' : ''}">${test.passed.includes(s) ? '✓' : SKILL_UI[s].emoji}</span>`).join('')}</div>
        <ul class="boss-skill-list">${rows}</ul>
        ${winReady ? `<button class="primary-btn" type="button" data-action="bossWin">👑 Taklukkan Raja!</button>` : ''}
        <p class="meta boss-hub-note">⏱️ Semua babak ±${tLo}–${tHi} menit. Boleh dikerjakan satu-satu, tidak ada hitungan mundur.</p>
        ${cleared && passedCount > 0 ? `<button class="ghost-btn slim" type="button" data-action="bossReset">🔁 Ulang Semua Babak</button>` : ''}
      </div>`;
    setHandlers({
      bossSkill: (payload) => openSkill(payload as SkillKey),
      bossPractice: (payload) => {
        const [skill, topicId] = (payload ?? '').split('|');
        cb.onPractice(skill as SkillKey, topicId);
      },
      bossWin: () => cb.onWin(resultForWin()),
      bossReset: () => {
        test = { runs: {}, passed: [], best: {}, recent: test.recent, history: test.history };
        save();
        renderHub();
      },
    });
  }

  function missionHtml(skill: SkillKey, run: BossSkillRun): string {
    const counts = new Map<string, number>();
    const tally = (ids: string[], res: (number | null)[]) =>
      ids.forEach((id, i) => {
        if (res[i] === 0) counts.set(topicOf(id), (counts.get(topicOf(id)) ?? 0) + 1);
      });
    tally(run.ids, run.res);
    if (run.extra) tally(run.extra.ids, run.extra.res);
    const top = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3);
    if (!top.length) return '';
    return `<div class="boss-mission"><span>🗺️ Latihan dulu:</span>${top
      .map(([t]) => `<button class="boss-mission-chip" type="button" data-action="bossPractice" data-payload="${skill}|${t}">${escapeHtml(topicTitle(level, skill, t))}</button>`)
      .join('')}</div>`;
  }

  function openSkill(skill: SkillKey): void {
    const run = test.runs[skill];
    if (run && !run.done) return resume(skill, run);
    if (run?.done) return renderResult(skill);
    resume(skill, newRun(skill));
  }

  function resume(skill: SkillKey, run: BossSkillRun): void {
    if (run.extra) {
      const i = run.extra.res.findIndex((r) => r === null);
      return i < 0 ? renderResult(skill) : drawQuestion(skill, i, true);
    }
    const i = run.res.findIndex((r) => r === null);
    if (i < 0) return renderResult(skill);
    drawQuestion(skill, i, false);
  }

  /* ------------------------------------------------------------ soal -- */

  function slotsOf(run: BossSkillRun, extra: boolean): { ids: string[]; res: (number | null)[] } {
    return extra && run.extra ? run.extra : run;
  }

  function dotsHtml(res: (number | null)[], current: number): string {
    const dense = res.length > 10 ? ' dense' : '';
    const dots = res
      .map((r, i) => {
        const cls = [i === current ? 'current' : '', r !== null ? 'done' : ''].filter(Boolean).join(' ');
        return `<button type="button" class="quiz-dot ${cls}" data-action="bossJump" data-payload="${i}" aria-label="Ke soal ${i + 1}">${i + 1}</button>`;
      })
      .join('');
    return `<div class="quiz-nav"><div class="quiz-dots${dense}">${dots}</div></div>`;
  }

  function nextUnanswered(res: (number | null)[], from: number): number {
    for (let step = 1; step <= res.length; step++) {
      const i = (from + step) % res.length;
      if (res[i] === null) return i;
    }
    return -1;
  }

  function drawQuestion(skill: SkillKey, i: number, extra: boolean): void {
    const run = test.runs[skill];
    if (!run) return renderHub();
    const slots = slotsOf(run, extra);
    const q = buildQuestion(level, slots.ids[i]);
    if (!q) {
      // Soal basi (konten berubah) — anggap tidak ada, tidak menghukum anak.
      slots.res[i] = skill === 'speaking' ? -1 : 1;
      save();
      return advance(skill, i, extra);
    }
    setGameRoundActive(true, renderHub);
    setPlaying(true);
    const ui = SKILL_UI[skill];
    const answered = slots.res[i] !== null;
    container.innerHTML = `
      <div class="boss-q-head">
        <button class="boss-back-pill" type="button" data-action="bossHub">🏰 Semua Babak</button>
        <span class="boss-skill-tag">${ui.emoji} ${ui.label}${extra ? ' · Bonus' : ''}</span>
      </div>
      <div class="latihan-head"><span class="stage-badge">${q.badge}</span></div>
      ${dotsHtml(slots.res, i)}
      <div class="id-text">Soal ${i + 1} dari ${slots.res.length}</div>
      ${q.kind === 'choice' ? choiceBody(q) : speakBody(q, answered)}
      <div class="feedback" id="fb"></div>
      <div id="bossActions"></div>`;
    setHandlers({
      bossHub: renderHub,
      bossJump: (payload) => drawQuestion(skill, Number(payload), extra),
      bossPlay: () => q.play?.(),
    });
    if (q.kind === 'choice') wireChoice(skill, q, i, extra, answered);
    else wireSpeak(skill, q, i, extra, answered);
    if (!answered && q.autoPlay) q.play?.();
  }

  function playBtn(q: BossQ): string {
    return q.play ? `<div class="speak-row"><button class="speak-btn pt-cta" type="button" data-action="bossPlay">${(q.kind === 'choice' && q.playLabel) || '🔊 Dengar'}</button></div>` : '';
  }

  function choiceBody(q: BossChoiceQ): string {
    let opts: string;
    if (q.layout === 'tf') {
      opts = `<div class="boss-tf">${q.options.map((o, i) => `<button class="opt-btn opt-btn-text" type="button" data-action="bossPick" data-payload="${i}">${o.label}</button>`).join('')}</div>`;
    } else if (q.layout === 'list') {
      opts = `<div class="boss-list">${q.options
        .map((o, i) => `<button class="opt-btn opt-btn-text boss-list-opt" type="button" data-action="bossPick" data-payload="${i}"><span class="boss-letter" aria-hidden="true">${LETTERS[i]}</span><span>${o.emoji ? `${picHtml(o.emoji)} ` : ''}${o.label ?? ''}</span></button>`)
        .join('')}</div>`;
    } else {
      const three = q.options.length === 3 ? ' three' : '';
      opts = `<div class="opt-grid${three}">${q.options
        .map((o, i) =>
          o.html
            ? `<button class="opt-btn" type="button" data-action="bossPick" data-payload="${i}">${o.html}</button>`
            : `<button class="opt-btn answer-card" type="button" data-action="bossPick" data-payload="${i}" ${o.label ? '' : `aria-label="Pilihan ${LETTERS[i]}"`}>
                <span class="answer-card-emoji" aria-hidden="true">${picHtml(o.emoji)}</span>
                <span class="answer-card-bottom">${o.label ? `<span class="answer-card-label">${o.label}</span>` : ''}<span class="answer-card-badge" aria-hidden="true">${LETTERS[i]}</span></span>
              </button>`
        )
        .join('')}</div>`;
    }
    return `${q.body}${playBtn(q)}${opts}`;
  }

  function actionsHtml(res: (number | null)[]): string {
    const last = res.every((r) => r !== null);
    return `<div class="round-actions single"><button class="primary-btn" type="button" data-action="bossNext" style="margin-top:0">${last ? 'Lihat Hasil 🏁' : 'Lanjut ➡️'}</button></div>`;
  }

  function lock(): void {
    container.querySelectorAll<HTMLButtonElement>('[data-action="bossPick"]').forEach((b) => (b.disabled = true));
  }

  function wireChoice(skill: SkillKey, q: BossChoiceQ, i: number, extra: boolean, answered: boolean): void {
    const run = test.runs[skill]!;
    const slots = slotsOf(run, extra);
    const btns = () => container.querySelectorAll<HTMLElement>('[data-action="bossPick"]');
    const okIdx = q.options.findIndex((o) => o.ok);
    const fb = () => container.querySelector<HTMLElement>('#fb')!;
    const showActions = () => {
      container.querySelector('#bossActions')!.innerHTML = actionsHtml(slots.res);
      setHandlers({ bossNext: () => advance(skill, i, extra) });
    };
    if (answered) {
      lock();
      btns()[okIdx]?.classList.add('reveal');
      fb().textContent = slots.res[i] === 1 ? 'Soal ini sudah kamu jawab dengan tepat 👍' : `Soal ini sudah dijawab. Jawabannya: ${q.answerText}`;
      fb().className = 'feedback';
      showActions();
      return;
    }
    setHandlers({
      bossPick: (payload) => {
        if (slots.res[i] !== null) return;
        const k = Number(payload);
        const ok = !!q.options[k]?.ok;
        slots.res[i] = ok ? 1 : 0;
        save();
        lock();
        const btn = btns()[k];
        if (ok) {
          btn?.classList.add('correct', 'win-burst');
          playCorrectTone();
          fireConfetti();
          fb().textContent = pickPraise(level);
          fb().className = 'feedback good';
          if (q.sayAnswer) {
            const say = q.sayAnswer;
            speakLater(() => container.isConnected && say(), 1500);
          }
        } else {
          btn?.classList.add('wrong');
          btns()[okIdx]?.classList.add('reveal');
          playWrongTone();
          vibrateDevice(160);
          fb().innerHTML = `${escapeHtml(pickEncourage(level))}<br><span class="boss-answer">Jawabannya: <b>${escapeHtml(q.answerText)}</b></span>`;
          fb().className = 'feedback bad';
        }
        showActions();
      },
    });
  }

  function speakBody(q: BossSpeakQ, answered: boolean): string {
    const note = '<p class="meta boss-bonus-note">🎁 Babak bonus — tidak menentukan naik level.</p>';
    const mic = answered
      ? ''
      : `<div class="mic-wrap">
          <button class="mic-btn" id="micBtn" type="button" data-action="bossMic" ${sttSupported ? '' : 'disabled'}>🎤</button>
          <div class="mic-hint">${sttSupported ? 'Tap mic, lalu ucapkan' : 'Mikrofon tidak tersedia di browser ini'}</div>
        </div>
        ${sttSupported ? '' : '<button class="ghost-btn" type="button" data-action="bossSkip">⏭️ Lewati Soal Ini</button>'}`;
    return `${note}${q.body}${playBtn(q)}${mic}<div id="micResult"></div>`;
  }

  function wireSpeak(skill: SkillKey, q: BossSpeakQ, i: number, extra: boolean, answered: boolean): void {
    const run = test.runs[skill]!;
    const slots = slotsOf(run, extra);
    const fb = () => container.querySelector<HTMLElement>('#fb')!;
    const showActions = () => {
      container.querySelector('#bossActions')!.innerHTML = actionsHtml(slots.res);
      setHandlers({ bossNext: () => advance(skill, i, extra) });
    };
    if (answered) {
      fb().textContent = slots.res[i] === -1 ? 'Soal ini dilewati.' : 'Soal ini sudah kamu ucapkan 👍';
      fb().className = 'feedback';
      showActions();
      return;
    }
    setHandlers({
      bossSkip: () => {
        slots.res[i] = -1;
        save();
        advance(skill, i, extra);
      },
      bossMic: () => {
        const btn = container.querySelector<HTMLElement>('#micBtn');
        if (!btn || slots.res[i] !== null) return;
        btn.classList.add('listening');
        let audioUrl: string | null = null;
        listenAndRecordOnce(
          (said) => {
            if (!container.isConnected) return;
            btn.classList.remove('listening');
            const words = wordMatchDetail(said, q.target);
            const ratio = words.length ? words.filter((w) => w.matched).length / words.length : 0;
            slots.res[i] = Math.round(ratio * 100) / 100;
            save();
            recordEvent({ kind: 'speak', skill: 'speaking', topicId: q.topicId, activity: 'boss', graded: false, score: Math.round(ratio * 100), level, detail: { heard: said } });
            const stars = ratio >= 0.8 ? 3 : ratio >= 0.4 ? 2 : 1;
            if (stars === 3) {
              playCorrectTone();
              fireConfetti();
            } else playTryAgainTone();
            container.querySelector('.mic-wrap')?.remove();
            container.querySelector<HTMLElement>('#micResult')!.innerHTML = `
              <div class="boss-mic-stars" aria-hidden="true">${'⭐'.repeat(stars)}${'☆'.repeat(3 - stars)}</div>
              ${q.showTarget ? '' : `<p class="meta">Contoh jawaban: <b>${escapeHtml(q.target)}</b></p>`}
              <div class="word-diff">${words.map((w) => `<span class="${w.matched ? 'ok' : 'miss'}">${escapeHtml(w.word)}</span>`).join('')}</div>
              <div class="heard-text">Terdengar: "${escapeHtml(said)}"</div>
              <div class="speak-row"><button class="speak-btn" type="button" id="playMineBtn" data-action="bossPlayMine" ${audioUrl ? '' : 'disabled'}>▶️ Play Suaramu</button></div>`;
            setHandlers({ bossPlayMine: () => audioUrl && playRecording(audioUrl) });
            fb().textContent = stars === 3 ? pickPraise(level) : pickEncourage(level);
            fb().className = 'feedback good';
            showActions();
          },
          (kind) => {
            btn.classList.remove('listening');
            if (kind === 'aborted' || !container.isConnected) return;
            fb().textContent = 'Belum kedengaran, coba tap mic lagi 🎧';
            fb().className = 'feedback';
          },
          (url) => {
            audioUrl = url;
            const b = container.querySelector<HTMLButtonElement>('#playMineBtn');
            if (b) b.disabled = false;
          }
        );
      },
    });
  }

  function advance(skill: SkillKey, i: number, extra: boolean): void {
    const run = test.runs[skill];
    if (!run) return renderHub();
    const slots = slotsOf(run, extra);
    const next = nextUnanswered(slots.res, i);
    if (next < 0) return renderResult(skill);
    drawQuestion(skill, next, extra);
  }

  /* ----------------------------------------------------------- hasil -- */

  function finalize(skill: SkillKey, run: BossSkillRun, passed: boolean): void {
    const sc = runScore(skill, run);
    run.done = true;
    run.passed = passed;
    if (passed && skill !== 'speaking' && !test.passed.includes(skill)) test.passed.push(skill);
    test.best[skill] = Math.max(test.best[skill] ?? 0, sc.pct);
    const bases = [...run.ids, ...(run.extra?.ids ?? [])].map(baseOf);
    test.recent[skill] = [...(test.recent[skill] ?? []), ...bases].slice(-questionCount(level, skill) * 3);
    test.history.push({ at: new Date().toISOString(), skill, correct: sc.correct, total: sc.total, passed });
    save();
    recordEvent({
      kind: 'boss_skill',
      level,
      skill,
      graded: skill !== 'speaking',
      correct: passed,
      score: sc.pct,
      detail: { correct: sc.correct, total: sc.total, extra: run.extra ? run.extra.res.filter((r) => r === 1).length : null },
    });
    requestSync();
  }

  function renderResult(skill: SkillKey): void {
    setGameRoundActive(false);
    setPlaying(false);
    const run = test.runs[skill];
    if (!run) return renderHub();
    const ui = SKILL_UI[skill];
    const sc = runScore(skill, run);
    const need = passNeed(sc.total);

    if (!run.done) {
      if (skill === 'speaking') finalize(skill, run, true);
      else if (run.extra) finalize(skill, run, run.extra.res.every((r) => r === 1));
      else if (sc.correct >= need) finalize(skill, run, true);
      else if (sc.correct === need - 1) {
        const avoid = [...(test.recent[skill] ?? []), ...run.ids.map(baseOf)];
        const ids = pickIds(level, skill, EXTRA_COUNT, avoid).filter((id) => buildQuestion(level, id));
        if (ids.length) {
          run.extra = { ids, res: ids.map(() => null) };
          save();
          return renderBonusOffer(skill, sc.correct, sc.total);
        }
        finalize(skill, run, false);
      } else finalize(skill, run, false);
    }

    const passed = !!run.passed;
    const nextSkill = OBJECTIVE_SKILLS.find((s) => !test.passed.includes(s)) ?? (test.best.speaking === undefined ? 'speaking' : null);
    const winReady = allObjectivePassed();
    const extraLine = run.extra ? `<p class="done-sub">Soal bonus: ${run.extra.res.filter((r) => r === 1).length} dari ${run.extra.res.length} benar</p>` : '';
    let html: string;
    if (skill === 'speaking') {
      html = `
        <div class="done-wrap win">
          <div class="sunburst mascot-pop" aria-hidden="true"><span class="face">${ui.emoji}</span><span class="crown">🎁</span></div>
          <h2 class="win-banner">Babak Bonus Selesai!</h2>
          <div class="boss-result-stars">${starsHtml(sc.pct)}</div>
          <p class="done-sub">Kamu berani ngomong ${sc.correct} kalimat. Hebat! (tidak menentukan naik level)</p>`;
    } else if (passed) {
      html = `
        <div class="done-wrap win">
          <div class="sunburst mascot-pop" aria-hidden="true"><span class="face">${ui.emoji}</span><span class="crown">✅</span></div>
          <h2 class="win-banner">Babak ${ui.label} Lolos!</h2>
          <div class="boss-result-stars">${starsHtml(sc.pct)}</div>
          <p class="done-sub">Benar <b>${sc.correct} dari ${sc.total}</b> soal.</p>${extraLine}`;
    } else {
      html = `
        <div class="done-wrap">
          <div class="sunburst mascot-pop" aria-hidden="true"><span class="face">💪</span></div>
          <h2 class="h2" style="text-align:center">Belum lolos, gapapa!</h2>
          <div class="boss-result-stars">${starsHtml(sc.pct)}</div>
          <p class="done-sub">Benar <b>${sc.correct} dari ${sc.total}</b>. Target: ${need} dari ${sc.total}.</p>${extraLine}
          ${missionHtml(skill, run)}
          <p class="done-sub">Latihan dulu, lalu coba lagi dengan soal baru, ya!</p>`;
    }
    const buttons = [
      winReady ? `<button class="primary-btn" type="button" data-action="bossWin">👑 Taklukkan Raja!</button>` : '',
      !passed && skill !== 'speaking' ? `<button class="primary-btn" type="button" data-action="bossRetry">🔁 Coba Lagi (soal baru)</button>` : '',
      !winReady && (passed || skill === 'speaking') && nextSkill && nextSkill !== skill
        ? `<button class="primary-btn" type="button" data-action="bossGoSkill" data-payload="${nextSkill}">Babak Berikutnya: ${SKILL_UI[nextSkill].emoji} ${SKILL_UI[nextSkill].label} ➡️</button>`
        : '',
      (passed || skill === 'speaking') ? `<button class="ghost-btn" type="button" data-action="bossRetry">🔁 Main Lagi Babak Ini</button>` : '',
      `<button class="ghost-btn" type="button" data-action="bossHub">🏰 Semua Babak</button>`,
    ].join('');
    container.innerHTML = `${html}<div class="boss-result-actions">${buttons}</div></div>`;
    if (passed || skill === 'speaking') {
      playCorrectTone();
      fireConfetti(40);
    }
    setHandlers({
      bossWin: () => cb.onWin(resultForWin()),
      bossRetry: () => resume(skill, newRun(skill)),
      bossGoSkill: (payload) => openSkill(payload as SkillKey),
      bossHub: renderHub,
      bossPractice: (payload) => {
        const [s, t] = (payload ?? '').split('|');
        cb.onPractice(s as SkillKey, t);
      },
    });
  }

  function renderBonusOffer(skill: SkillKey, correct: number, total: number): void {
    setGameRoundActive(false);
    setPlaying(false);
    const ui = SKILL_UI[skill];
    container.innerHTML = `
      <div class="done-wrap">
        <div class="sunburst mascot-pop" aria-hidden="true"><span class="face">${ui.emoji}</span><span class="crown">✨</span></div>
        <h2 class="h2" style="text-align:center">Hampir lolos!</h2>
        <p class="done-sub">Benar <b>${correct} dari ${total}</b> — kurang 1 lagi.</p>
        <p class="done-sub">Jawab <b>${EXTRA_COUNT} soal bonus</b>. Benar semua = lolos! 💪</p>
        <div class="boss-result-actions">
          <button class="primary-btn" type="button" data-action="bossBonus">▶️ Mulai Soal Bonus</button>
          <button class="ghost-btn" type="button" data-action="bossHub">🏰 Nanti Saja</button>
        </div>
      </div>`;
    setHandlers({ bossBonus: () => drawQuestion(skill, 0, true), bossHub: renderHub });
  }

  renderHub();
}
