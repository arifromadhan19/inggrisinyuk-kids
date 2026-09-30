/**
 * Sound Hunt — Misi Pemburu Suara. Raja Game Hub ke-6 (app.ts RAJA_LIST,
 * ditaruh persis di bawah Raja Ingatan — permintaan user), fokus MURNI
 * Listening: dengar 1 instruksi Bahasa Inggris lalu tunjuk gambar yang
 * cocok dari 4 kartu. Dibungkus tema "petualangan cari Sound Crystal di
 * Hutan Ajaib" (Forest Map dgn 6 markas berurutan, tiap markas = 1 level)
 * supaya terasa game, bukan kuis — pola SAMA PERSIS raja lain
 * (`games/wordmatch.ts`/`games/balloonpop.ts`/`games/memorymatch.ts`): 1
 * file berdiri sendiri, bank soal DATA-DRIVEN sendiri (`soundhunt-data.ts`),
 * TIDAK terikat topik/level Vocab manapun (generik lintas level app).
 *
 * 🔒 **Revisi (permintaan user "tambahkan 1 sehingga ada 6... levelnya ada
 * pemanasan, mudah, sedang, sulit, jago, legendaris")** — dulu Sound Hunt
 * SATU-SATUNYA raja bertingkat yang TIDAK py tag kesulitan sama sekali
 * (5 markas polos, cuma nama tempat). Sekarang `SoundHuntLevel` dapat field
 * BARU `difficulty: WordMatchDifficulty` (reuse union yang SAMA dgn Raja
 * Kata/Balon/Susun/Ingatan, BUKAN bikin tipe baru) supaya penamaan tingkat
 * konsisten lintas Game Hub — 5 markas lama TETAP APA ADANYA kontennya,
 * cuma diberi label `mudah`→`legendaris` sesuai urutan progres yang SUDAH
 * ada (guideLine-nya sendiri sudah menaik dari "gerbang hutan" ke "hampir
 * sampai istana"); markas ke-0 BARU `pemanasan`/"Village Edge" ditambah
 * PALING DEPAN, instruksi paling sederhana (1 kata benda umum).
 *
 * Audio: SELALU lewat `speak()` (speech.ts, Web Speech API) — TIDAK ada
 * file audio terpisah, konsisten SELURUH app ini (bukan cuma game ini).
 *
 * State internal (markas terbuka/Sound Crystal ditemukan) HANYA hidup
 * selama 1 sesi main, direset lagi tiap "▶️ Main"/"🔁 Main Lagi" dari Game
 * Hub — konsisten pola raja lain (`freshRound()`), TIDAK disimpan ke
 * progress.ts/localStorage lintas sesi (di luar scope MVP, `onDone()`
 * tetap menambah XP via app.ts sama seperti raja lain).
 *
 * 🔒 **Revisi 2026-09-29 (permintaan user "sesuai level ada pembeda & ada
 * beberapa soal di dalamnya", pola Word Quest/Memory Hunt)**: 1 markas =
 * `ROUND_COUNT` (10) soal, dibuat dari bank per tier (`soundhunt-data.ts`,
 * dicek build). Tiap markas menambah 1 hal baru di instruksi yang DIDENGAR:
 * 1 kata (pengecoh beda kelompok) → 1 kata (pengecoh sekelompok) → warna +
 * benda → angka + benda → 2 perintah berurutan → tebak dari deskripsi.
 * Kartu jawaban gambar SAJA (dulu berlabel → bisa dijawab dgn membaca).
 * Dulu 1 soal per markas & Legendaris ("Find the rabbit") lebih mudah dari
 * Sulit; tint/size hack (bintang kuning di lingkaran biru) dihapus. Tabel
 * lengkap: komentar puncak `soundhunt-data.ts`.
 *
 * Non-punitive (CLAUDE.md): tap "Lanjut" SELALU membuka markas berikutnya
 * apa pun hasil jawabannya — Sound Crystal 💎 cuma didapat kalau BENAR,
 * tapi jawaban salah TIDAK PERNAH mengunci/menahan anak di 1 markas.
 */
import { journeyMapHtml, markasIntro } from '../game-ui';
import { sfx } from '../game-audio';
import { readingPicHtml as picHtml } from '../reading-pic';
import { setGameRoundActive, setHandlers } from '../interaction';
import { recordAttempt } from '../progress';
import { speak, speakLocalized, speakLater, playCorrectTone, playWrongTone, vibrateDevice } from '../speech';
import { pickPraise, pickEncourage } from '../praise';
import { fireConfetti } from '../confetti';
import { GAME_STAR_FIELD } from '../scenery';
import { shuffle } from '../util';
import type { LevelKey, OnDone, WordMatchDifficulty } from '../types';
import { COLOR_BANK, COLOR_ID, COUNT_BANK, GROUP_BANK, NUMBER_WORDS, RIDDLE_BANK, ROUND_COUNT, TIER_CONFIG, WARMUP_BANK, type Thing } from './soundhunt-data';

/** `RajaKey` game ini — dikirim ke `recordAttempt()`, lihat komentar
 *  `GAME_KEY` `games/wordmatch.ts`. */
const GAME_KEY = 'soundhunt';

/** 6 markas Hutan Ajaib — nama tempat & kalimat pemandu. ISI soal tiap
 *  markas dibuat dari bank per tier (`soundhunt-data.ts`), bukan lagi 1
 *  soal tulisan tangan per markas. */
export interface SoundHuntNode {
  node: string;
  nodeEmoji: string;
  difficulty: WordMatchDifficulty;
  guideLine: string;
}

export const SOUND_HUNT_NODES: SoundHuntNode[] = [
  { node: 'Village Edge', nodeEmoji: '🏡', difficulty: 'pemanasan', guideLine: 'Yuk pemanasan dulu di tepi desa sebelum masuk hutan!' },
  { node: 'Forest Entrance', nodeEmoji: '🌲', difficulty: 'mudah', guideLine: 'Selamat datang di gerbang hutan! Gambarnya mirip-mirip, dengarkan baik-baik, ya.' },
  { node: 'Whispering Woods', nodeEmoji: '🌳', difficulty: 'sedang', guideLine: 'Pohon-pohon di sini suka berbisik warna... dengar warnanya juga!' },
  { node: 'Mushroom Garden', nodeEmoji: '🍄', difficulty: 'sulit', guideLine: 'Taman jamur ini penuh benda ajaib. Dengar berapa jumlahnya!' },
  { node: 'Crystal Cave', nodeEmoji: '💎', difficulty: 'jago', guideLine: 'Di gua ini ada 2 perintah sekaligus. Ingat urutannya, ya!' },
  { node: 'Castle Gate', nodeEmoji: '🏰', difficulty: 'legendaris', guideLine: 'Penjaga istana memberi teka-teki. Tebak bendanya dari ciri-cirinya!' },
];

/** 1 soal siap tampil. `answer` = indeks opsi yang benar, urut (mode
 *  `sequence` = 2 indeks, harus ditap berurutan). */
interface Question {
  instruction: string;
  instructionId: string;
  options: { emoji: string; label: string }[];
  answer: number[];
}

/** Antrian acak tanpa ulang (semua keluar dulu sebelum ada yang berulang). */
function makeQueue<T>(items: T[]): () => T {
  let q: T[] = [];
  return () => {
    if (q.length === 0) q = shuffle(items);
    return q.shift()!;
  };
}

function pickOthers<T>(pool: T[], exclude: T[], n: number): T[] {
  return shuffle(pool.filter((x) => !exclude.includes(x))).slice(0, n);
}

/** Susun opsi (acak posisinya) + indeks jawabannya. */
function assemble(instruction: string, instructionId: string, correct: { emoji: string; label: string }[], others: { emoji: string; label: string }[]): Question {
  const options = shuffle([...correct, ...others]);
  return { instruction, instructionId, options, answer: correct.map((c) => options.indexOf(c)) };
}

const thingOpt = (t: Thing) => ({ emoji: t.emoji, label: t.en });

/** `ROUND_COUNT` soal untuk 1 markas, sesuai mode tier-nya. */
function buildQuestions(difficulty: WordMatchDifficulty): Question[] {
  const mode = TIER_CONFIG[difficulty].mode;
  const out: Question[] = [];
  if (mode === 'find' && difficulty === 'pemanasan') {
    const next = makeQueue(WARMUP_BANK);
    for (let i = 0; i < ROUND_COUNT; i++) {
      const t = next();
      out.push(assemble(`Find the ${t.en}.`, `Temukan ${t.id}.`, [thingOpt(t)], pickOthers(WARMUP_BANK, [t], 3).map(thingOpt)));
    }
  } else if (mode === 'find') {
    const nextGroup = makeQueue(GROUP_BANK);
    const perGroup = new Map(GROUP_BANK.map((g) => [g, makeQueue(g.items)]));
    for (let i = 0; i < ROUND_COUNT; i++) {
      const g = nextGroup();
      const t = perGroup.get(g)!();
      out.push(assemble(`Find the ${t.en}.`, `Temukan ${t.id}.`, [thingOpt(t)], pickOthers(g.items, [t], 3).map(thingOpt)));
    }
  } else if (mode === 'color') {
    const combos = COLOR_BANK.flatMap((n) => Object.keys(n.colors).map((c) => ({ n, c })));
    const next = makeQueue(combos);
    for (let i = 0; i < ROUND_COUNT; i++) {
      const { n, c } = next();
      const opt = (noun: typeof n, color: string) => ({ emoji: noun.colors[color], label: `${color} ${noun.en}` });
      const otherColor = shuffle(Object.keys(n.colors).filter((x) => x !== c))[0];
      // Benda lain yang juga punya warna target + 1 warna lain.
      const y = shuffle(COLOR_BANK.filter((m) => m !== n && m.colors[c] && Object.keys(m.colors).length > 1))[0];
      const yOther = Object.keys(y.colors).includes(otherColor) && otherColor !== c ? otherColor : shuffle(Object.keys(y.colors).filter((x) => x !== c))[0];
      out.push(
        assemble(`Find the ${c} ${n.en}.`, `Temukan ${n.id} ${COLOR_ID[c]}.`, [opt(n, c)], [opt(n, otherColor), opt(y, c), opt(y, yOther)])
      );
    }
  } else if (mode === 'count') {
    const combos = COUNT_BANK.flatMap((t) => NUMBER_WORDS.map((w) => ({ t, w })));
    const next = makeQueue(combos);
    for (let i = 0; i < ROUND_COUNT; i++) {
      const { t, w } = next();
      const near = NUMBER_WORDS.filter((x) => Math.abs(x.n - w.n) === 1);
      const nw = shuffle(near)[0];
      const y = shuffle(COUNT_BANK.filter((x) => x !== t))[0];
      const opt = (thing: typeof t, num: typeof w) => ({ emoji: thing.emoji.repeat(num.n), label: `${num.en} ${thing.plural}` });
      out.push(assemble(`Find ${w.en} ${t.plural}.`, `Temukan ${w.id} ${t.id}.`, [opt(t, w)], [opt(t, nw), opt(y, w), opt(y, nw)]));
    }
  } else if (mode === 'sequence') {
    const pool = [...WARMUP_BANK, ...GROUP_BANK.flatMap((g) => g.items)];
    for (let i = 0; i < ROUND_COUNT; i++) {
      const [a, b, ...rest] = shuffle(pool).slice(0, 4);
      out.push(assemble(`Tap the ${a.en}, then tap the ${b.en}.`, `Tap ${a.id}, lalu tap ${b.id}.`, [thingOpt(a), thingOpt(b)], rest.map(thingOpt)));
    }
  } else {
    const next = makeQueue(RIDDLE_BANK);
    for (let i = 0; i < ROUND_COUNT; i++) {
      const r = next();
      out.push(assemble(r.text, r.textId, [thingOpt(r.options[0])], r.options.slice(1).map(thingOpt)));
    }
  }
  return out;
}

/** Duplikat lokal `roundActionsHtml` (konvensi app ini: helper generik
 *  diduplikasi per file game — lihat games/wordmatch.ts dst). */
function roundActionsHtml(isLast: boolean): string {
  return `
    <div class="round-actions">
      <button class="ghost-btn" type="button" data-action="tryAgainRound">🔁 Coba Lagi</button>
      <button class="primary-btn" type="button" data-action="nextRound" style="margin-top:0">${isLast ? 'Selesai ✅' : 'Jalan terus ➡️'}</button>
    </div>`;
}

/** Bullet progress read-only di dalam 1 markas (permintaan user "pada game
 *  tambahkan bullet progress juga") — pola SAMA PERSIS `games/storyquest.ts`
 *  `dotsHtml()` (`.quiz-dot.static`, warna ikut Raja lewat `.raja-stage`).
 *  Duplikat lokal per file game (konvensi sama `roundActionsHtml`). */
function progressDotsHtml(total: number, isDone: (i: number) => boolean, current: number): string {
  const dots = Array.from({ length: total }, (_, i) => {
    const done = isDone(i);
    const cls = [done ? 'done' : '', i === current ? 'current' : ''].filter(Boolean).join(' ');
    return `<span class="quiz-dot static ${cls}" aria-hidden="true">${done ? '✓' : i + 1}</span>`;
  }).join('');
  return `<div class="quiz-nav"><div class="quiz-dots">${dots}</div></div>`;
}

/** "Cara Main" — duplikat lokal, lihat komentar lengkap `gameHowToHtml`
 *  `games/wordmatch.ts` (permintaan user, referensi screenshot + "footer
 *  tambahkan seperti original footer... seperti di halaman yang lain"). */
function gameHowToHtml(steps: string[]): string {
  return `
    <h2 class="game-howto-title">Cara Main</h2>
    <div class="card game-howto-card">
      <ol class="game-howto-list">
        ${steps.map((s, i) => `<li><span class="game-howto-num" aria-hidden="true">${i + 1}</span><span>${s}</span></li>`).join('')}
      </ol>
    </div>`;
}

function lockOptionButtons(container: HTMLElement): void {
  container.querySelectorAll<HTMLButtonElement>('.opt-btn').forEach((b) => (b.disabled = true));
}

const ANSWER_LETTERS = ['A', 'B', 'C', 'D'];

/** Kartu jawaban GAMBAR SAJA (`.opt-btn.answer-card`) — tanpa tulisan,
 *  supaya tugasnya mendengar, bukan membaca (dulu kartu berlabel "Blue Star"
 *  membocorkan jawaban lewat teks). Label cuma utk `aria-label`. `order` =
 *  nomor urutan yang sudah ditap benar (mode 2 perintah). */
function optionCardsHtml(options: { emoji: string; label: string }[], order: number[]): string {
  return `<div class="opt-grid">
    ${options
      .map((o, i) => {
        const pos = order.indexOf(i);
        return `
      <button class="opt-btn answer-card sh-card${pos >= 0 ? ' sh-picked' : ''}" type="button" data-action="pick" data-payload="${i}" aria-label="${o.label}">
        ${pos >= 0 ? `<span class="sh-order" aria-hidden="true">${pos + 1}</span>` : ''}
        <span class="answer-card-emoji" aria-hidden="true">${picHtml(o.emoji)}</span>
        <span class="answer-card-bottom"><span class="answer-card-badge" aria-hidden="true">${ANSWER_LETTERS[i] ?? i + 1}</span></span>
      </button>`;
      })
      .join('')}
  </div>`;
}

export function runSoundHunt(container: HTMLElement, onDone: OnDone, level: LevelKey): void {
  const total = SOUND_HUNT_NODES.length;
  const visited = new Set<number>();
  // 💎 1 Sound Crystal per soal yang terjawab benar (boleh lewat "Coba
  // Lagi" — non-punitive), dihitung sekali per soal.
  const crystals = new Set<string>();
  const crystalTotal = total * ROUND_COUNT;

  /** Forest Map — grid `.raja-grid`/`.raja-card`, SAMA PERSIS roster `/game`
   *  (riwayat desain: komentar `renderMap()` `games/wordmatch.ts`). Markas
   *  ke-i terbuka kalau markas ke-(i-1) sudah pernah dituntaskan (10 soal
   *  dilewati, benar/salah — non-punitive). */
  function renderMap(): void {
    // 🔒 Back dari layar Map TIDAK perlu pop up konfirmasi (lihat komentar
    // `isGameRoundActive` `interaction.ts`).
    setGameRoundActive(false);
    const stops = journeyMapHtml('soundhunt', SOUND_HUNT_NODES.map((n) => ({ name: n.node, emoji: n.nodeEmoji, difficulty: n.difficulty, label: TIER_CONFIG[n.difficulty].label })), visited);

    // 🔒 `current` = markas berikutnya yang belum ditaklukkan (lihat komentar
    // `.game-progress-dot.current` styles.css).
    const nextIdx = SOUND_HUNT_NODES.findIndex((_, i) => !visited.has(i));
    const dots = SOUND_HUNT_NODES.map((_, i) => {
      const done = visited.has(i);
      const cls = [done ? 'done' : '', i === nextIdx ? 'current' : ''].filter(Boolean).join(' ');
      return `<span class="game-progress-dot${cls ? ' ' + cls : ''}" aria-hidden="true">${done ? '✓' : ''}</span>`;
    }).join('');

    container.innerHTML = `
      <div class="raja-map-wrap">
        ${GAME_STAR_FIELD}
        <div class="card game-progress-card">
          ${GAME_STAR_FIELD}
          <h2>Taklukkan markas satu per satu, ya!</h2>
          <div class="game-progress-dots">${dots}<span class="game-progress-label">Selesai ${visited.size} dari ${total}</span></div>
        </div>
        ${stops}
        ${gameHowToHtml([
          'Dengar instruksi Bahasa Inggrisnya',
          'Tap gambar yang sesuai',
          `Tiap markas ada ${ROUND_COUNT} soal — makin jauh, instruksinya makin menantang`,
          'Taklukkan markas satu per satu sampai tuntas!',
        ])}
      </div>`;
    setHandlers({ enterNode: (payload) => drawLevel(Number(payload)) });
  }

  /** 1 markas = `ROUND_COUNT` soal (pola Balloon Hunt/Word Quest), bentuk
   *  soal dari `TIER_CONFIG` (`soundhunt-data.ts`). */
  function drawLevel(idx: number): void {
    setGameRoundActive(true, renderMap); // masuk markas = "halaman mengerjakan"; keluar = balik ke Map
    markasIntro(SOUND_HUNT_NODES[idx].nodeEmoji, SOUND_HUNT_NODES[idx].node);
    const node = SOUND_HUNT_NODES[idx];
    const cfg = TIER_CONFIG[node.difficulty];
    const questions = buildQuestions(node.difficulty);
    let round = 0;
    // State per soal — direset HANYA saat pindah soal (`startRound`), BUKAN
    // saat "Coba Lagi" (Petunjuk yang sudah terbuka tetap terbuka).
    let revealed = false;
    let attempted = false;
    let picks: number[] = [];
    let answered = false;

    const q = () => questions[round];
    const play = () => speak(q().instruction);

    function paint(): void {
      const hintLocked = cfg.hintGated && !attempted;
      const hintBtn = hintLocked
        ? `<button class="speak-btn-ghost" type="button" disabled aria-disabled="true">🔒 Petunjuk</button>`
        : `<button class="speak-btn-ghost" type="button" data-action="hint"><span class="hint-bulb">💡</span> Petunjuk</button>`;
      container.innerHTML = `
        <div class="latihan-head">
          <span class="stage-badge">${node.nodeEmoji} ${node.node}</span>
          <span class="tag accent">💎 ${crystals.size}/${crystalTotal}</span>
        </div>
        <p class="meta" style="margin-top:var(--s3)">🧙‍♂️ "${node.guideLine}"</p>
        ${progressDotsHtml(ROUND_COUNT, (i) => i < round || (i === round && answered), round)}
        <p class="sh-badge">${cfg.badge}</p>
        <div class="speak-row">
          <button class="speak-btn pt-cta" type="button" data-action="listen">🔊 Dengar</button>
          ${hintBtn}
        </div>
        ${revealed ? `<div class="en-text">${q().instruction}</div><div class="id-text">${q().instructionId}</div>` : ''}
        ${optionCardsHtml(q().options, picks)}
        <div class="feedback" id="fb"></div>`;
      setHandlers({
        listen: play,
        hint: () => {
          revealed = true;
          play();
          speakLater(() => speakLocalized(q().instructionId, 'id-ID'), 1600);
          paint();
        },
        pick: (payload) => onPick(Number(payload)),
      });
    }

    function startRound(): void {
      revealed = false;
      attempted = false;
      picks = [];
      answered = false;
      paint();
      play();
    }

    function finish(correct: boolean, btn: HTMLButtonElement | undefined): void {
      answered = true;
      attempted = true;
      recordAttempt(correct, GAME_KEY);
      lockOptionButtons(container);
      const fb = container.querySelector<HTMLElement>('#fb')!;
      if (correct) {
        btn?.classList.add('correct', 'win-burst');
        crystals.add(`${idx}:${round}`);
        playCorrectTone();
        fireConfetti();
        fb.textContent = pickPraise(level);
        fb.className = 'feedback good';
      } else {
        btn?.classList.add('wrong');
        playWrongTone();
        vibrateDevice(160);
        fb.textContent = pickEncourage(level);
        fb.className = 'feedback bad';
      }
      const dots = container.querySelector('.quiz-nav');
      if (dots) dots.outerHTML = progressDotsHtml(ROUND_COUNT, (i) => i <= round, round);
      const tag = container.querySelector<HTMLElement>('.latihan-head .tag');
      if (tag) tag.textContent = `💎 ${crystals.size}/${crystalTotal}`;
      // Petunjuk bergerbang terbuka setelah 1x coba.
      if (cfg.hintGated) {
        const lockedHint = container.querySelector<HTMLButtonElement>('.speak-row .speak-btn-ghost[disabled]');
        if (lockedHint) lockedHint.outerHTML = `<button class="speak-btn-ghost" type="button" data-action="hint"><span class="hint-bulb">💡</span> Petunjuk</button>`;
      }
      const lastRound = round === ROUND_COUNT - 1;
      fb.insertAdjacentHTML('afterend', roundActionsHtml(lastRound && idx === total - 1));
      setHandlers({
        listen: play,
        hint: () => {
          revealed = true;
          play();
          speakLater(() => speakLocalized(q().instructionId, 'id-ID'), 1600);
          const actions = container.querySelector('.round-actions')?.outerHTML ?? '';
          const fbState = { text: fb.textContent, cls: fb.className };
          paint();
          lockOptionButtons(container);
          const fb2 = container.querySelector<HTMLElement>('#fb')!;
          fb2.textContent = fbState.text;
          fb2.className = fbState.cls;
          fb2.insertAdjacentHTML('afterend', actions);
          setHandlers({ tryAgainRound, nextRound });
        },
        tryAgainRound,
        nextRound,
      });
    }

    function tryAgainRound(): void {
      picks = [];
      answered = false;
      paint();
      play();
    }

    function nextRound(): void {
      if (round < ROUND_COUNT - 1) {
        round += 1;
        startRound();
        return;
      }
      visited.add(idx);
      if (visited.size >= total) renderMissionComplete();
      else renderMap();
    }

    function onPick(i: number): void {
      if (answered) return;
      const btns = container.querySelectorAll<HTMLButtonElement>('.opt-btn');
      const expected = q().answer[picks.length];
      if (i !== expected) return finish(false, btns[i]);
      picks.push(i);
      if (q().answer.length > 1) {
        // Mode 2 perintah — tandai urutan tiap kartu yang ditap benar.
        btns[i].classList.add('sh-picked');
        btns[i].insertAdjacentHTML('afterbegin', `<span class="sh-order" aria-hidden="true">${picks.length}</span>`);
      }
      if (picks.length < q().answer.length) {
        btns[i].disabled = true;
        playCorrectTone();
        return;
      }
      finish(true, btns[i]);
    }

    startRound();
  }

  function renderMissionComplete(): void {
    setGameRoundActive(false); // layar selesai, tidak ada progres yang bisa hilang
    sfx('mission');
    container.innerHTML = `
      <div class="done-wrap win">
        <div class="sunburst lg mascot-pop" aria-hidden="true"><span class="face">💎</span><span class="crown">✨</span></div>
        <h2 class="win-banner">Misi Hutan Selesai!</h2>
        <p class="done-sub">"Hebaaat! Kamu menemukan ${crystals.size} dari ${crystalTotal} Sound Crystal." — Penjaga Hutan</p>
        <p class="done-sub">👑 Raja akan sangat senang! <span class="tag ok">🏆 Sound Hunter Badge</span></p>
        <button class="primary-btn" type="button" data-action="continueAdventure">Continue Adventure ➡️</button>
      </div>`;
    setHandlers({ continueAdventure: () => onDone() });
  }

  renderMap();
}
