/**
 * Raja Susun — Sentence Puzzle. Gaya "bubble pyramid" (gelembung kata
 * tersusun piramida + bar jawaban emas), posisi di roster tepat di bawah
 * Raja Balon (`app.ts` RAJA_LIST, key `'susun'` TIDAK diganti supaya XP lama
 * anak tidak hilang). Vocab Tantangan "🔤 Susun Kalimat" (`games/
 * vocabulary.ts` `runSusunKalimat`) terpisah & tidak disentuh file ini.
 *
 * Map Kerajaan Kalimat 6-markas (pola SAMA `games/wordmatch.ts`), 1 markas =
 * 5 kalimat (`ROUND_COUNT`).
 *
 * 🔒 **Pembeda markas (riset `materi/pembeda_level_game.md` § Sentence
 * Puzzle)** — dulu keenam markas = dikte dengar yang sama persis, cuma jumlah
 * pengecoh yang naik (filler acak + kata kalimat saudara dari topik Vocab
 * level anak). Sekarang tiap markas py BANK KALIMAT sendiri dgn pola kalimat
 * yang naik (SVO → + keterangan → bentuk kata → tanya/"tidak" → 2 klausa) +
 * 1 jenis tantangan baru (prompt dengar → arti Indonesia saja, pengecoh kata
 * lain → bentuk keliru, Petunjuk "isi 1 kata" → "dengar kalimat" 🔒). Tabel
 * tier & bank: `games/sentencepuzzle-data.ts` (satu-satunya tempat mengubah
 * pembeda/kalimat, dicek build).
 *
 * Kid-friendly (CLAUDE.md): TANPA timer/nyawa, non-punitive (belum pas cuma
 * "Semangaat" + merah/getar/tetot, tetap bisa ulang/lanjut), TANPA ikon di
 * layar susun kalimat. Gelembung ditulis huruf kecil (kecuali "I" & nama)
 * supaya huruf kapital tidak membocorkan kata pertama.
 */
import { journeyMapHtml, markasIntro } from '../game-ui';
import { sfx } from '../game-audio';
import { setGameRoundActive, setHandlers } from '../interaction';
import { markGameHint, recordAttempt, setGameMarkas } from '../progress';
import { playCorrectTone, playWrongTone, speak, vibrateDevice } from '../speech';
import { pickPraise, pickEncourage } from '../praise';
import { fireConfetti } from '../confetti';
import { GAME_STAR_FIELD } from '../scenery';
import { shuffle } from '../util';
import type { LevelKey, OnDone, WordMatchDifficulty } from '../types';
import { SENTENCE_BANK, TIER_CONFIG, tokenize, type PuzzleSentence } from './sentencepuzzle-data';

/** `RajaKey` game ini — dikirim ke `recordAttempt()`, lihat komentar
 *  `GAME_KEY` `games/wordmatch.ts`. */
const GAME_KEY = 'susun';

const ROUND_COUNT = 5;

interface Bubble {
  /** Teks yang tampil (kata pertama kalimat sudah dikecilkan). */
  text: string;
  /** Kunci pembanding (huruf kecil). */
  key: string;
}

interface PuzzleRound {
  sentence: PuzzleSentence;
  /** Urutan kunci yang diterima: kalimat utama + `alt`. */
  answers: string[][];
  bubbles: Bubble[];
}

const keyOf = (w: string): string => w.toLowerCase();

/** Kecilkan HANYA kata pertama (kecuali "I") — kata lain (nama hari, TV)
 *  dibiarkan apa adanya. Jadi tidak ada gelembung yang "kelihatan paling
 *  depan" gara-gara huruf kapital. */
function displayWords(sentence: string): string[] {
  return tokenize(sentence).map((w, i) => (i === 0 && w !== 'I' ? w.charAt(0).toLowerCase() + w.slice(1) : w));
}

function buildRound(sentence: PuzzleSentence, difficulty: WordMatchDifficulty): PuzzleRound {
  const cfg = TIER_CONFIG[difficulty];
  const words = displayWords(sentence.en);
  const targetKeys = new Set(words.map(keyOf));
  let distractors: string[];
  if (cfg.distractor === 'wrong') {
    distractors = (sentence.wrong ?? []).slice(0, cfg.distractorCount);
  } else {
    // Kata dari kalimat LAIN di markas yang sama, yang tidak ada di kalimat
    // target (huruf kecil, unik) — tidak ada filler acak lagi.
    const pool = new Map<string, string>();
    for (const other of shuffle(SENTENCE_BANK[difficulty].filter((s) => s !== sentence))) {
      for (const w of displayWords(other.en)) {
        const k = keyOf(w);
        if (!targetKeys.has(k) && !pool.has(k)) pool.set(k, w);
      }
    }
    distractors = shuffle([...pool.values()]).slice(0, cfg.distractorCount);
  }
  const answers = [sentence.en, ...(sentence.alt ?? [])].map((s) => tokenize(s).map(keyOf));
  const bubbles = shuffle([...words, ...distractors]).map((text) => ({ text, key: keyOf(text) }));
  return { sentence, answers, bubbles };
}

/** Susunan baris piramida (jumlah bubble per baris) — makin ke bawah makin
 *  lebar, meniru referensi (baris atas sedikit, bawah banyak). Struktural
 *  berdasar TOTAL bubble, bukan hardcode angka tetap, krn total bervariasi
 *  tergantung panjang kalimat topik yang dipetik & tingkat kesulitan. */
function pyramidRows(total: number): number[] {
  if (total <= 3) return [total];
  if (total <= 7) {
    const first = Math.ceil(total / 2);
    return [first, total - first];
  }
  const r1 = Math.max(1, Math.round(total * 0.16));
  const r2 = Math.max(2, Math.round(total * 0.38));
  const r3 = Math.max(1, total - r1 - r2);
  return [r1, r2, r3];
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
 *  `games/wordmatch.ts`. */
function gameHowToHtml(steps: string[]): string {
  return `
    <h2 class="game-howto-title">Cara Main</h2>
    <div class="card game-howto-card">
      <ol class="game-howto-list">
        ${steps.map((s, i) => `<li><span class="game-howto-num" aria-hidden="true">${i + 1}</span><span>${s}</span></li>`).join('')}
      </ol>
    </div>`;
}

/** Opsional — dipasok `runSentencePuzzle()` (orkestrator Map Kerajaan
 *  Kalimat) supaya 1 markas tahu posisinya, pola SAMA PERSIS
 *  `RoundJourneyCtx` `games/wordmatch.ts`. */
interface RoundJourneyCtx {
  isLast: boolean;
  headerHtml: string;
}

/** Mesin 1 markas — 5 kalimat berturut-turut dari bank markas itu. Dipakai
 *  `runSentencePuzzle()` orkestrator di bawah (1× tiap markas ditap). */
function runSentencePuzzleRound(
  container: HTMLElement,
  difficulty: WordMatchDifficulty,
  onDone: OnDone,
  level: LevelKey,
  journey?: RoundJourneyCtx
): void {
  const cfg = TIER_CONFIG[difficulty];
  const sentences = shuffle(SENTENCE_BANK[difficulty]).slice(0, ROUND_COUNT);
  let roundIndex = 0;
  let round: PuzzleRound;
  let rows: number[] = [];
  let used: boolean[] = [];
  let answer: number[] = [];
  let answered = false;
  let solved = false;
  /** Petunjuk per kalimat: 'next-word' = sudah dipakai, 'listen' = 🔊 sudah dibuka. */
  let hintUsed = false;
  let attempted = false;

  const hearsByDefault = cfg.prompt !== 'meaning';

  function newRound(): void {
    round = buildRound(sentences[roundIndex], difficulty);
    rows = pyramidRows(round.bubbles.length);
    used = round.bubbles.map(() => false);
    answer = [];
    answered = false;
    solved = false;
    hintUsed = false;
    attempted = false;
    paint();
    if (hearsByDefault) speak(round.sentence.en);
  }

  function answerText(): string {
    return answer.map((i) => round.bubbles[i].text).join(' ');
  }

  function bubbleHtml(b: Bubble, i: number): string {
    // Begitu ronde terjawab, SEMUA bubble diredupkan (bukan cuma yang
    // dipakai) — supaya kelihatan jelas ronde ini sudah terkunci.
    const isUsed = used[i] || answered;
    return `<button class="sp-bubble${isUsed ? ' is-used' : ''}" type="button" data-action="tapBubble" data-payload="${i}" ${
      isUsed ? 'disabled' : ''
    }>${b.text}</button>`;
  }

  function rowsHtml(): string {
    let idx = 0;
    return rows
      .map((count) => {
        const cells = round.bubbles
          .slice(idx, idx + count)
          .map((b, j) => bubbleHtml(b, idx + j))
          .join('');
        idx += count;
        return `<div class="sp-row">${cells}</div>`;
      })
      .join('');
  }

  function hintButtonHtml(): string {
    if (answered) return '';
    if (cfg.hint === 'listen' && hintUsed) return '';
    const locked = cfg.hintGated && !attempted;
    const disabled = hintUsed || locked;
    return `<button class="speak-btn-ghost" type="button" data-action="hint" ${disabled ? 'disabled' : ''}>${
      locked ? '🔒' : '<span class="hint-bulb">💡</span>'
    } Petunjuk</button>`;
  }

  function paint(): void {
    const built = answerText();
    const showListen = hearsByDefault || (cfg.hint === 'listen' && hintUsed) || answered;
    const showMeaning = cfg.prompt !== 'audio' || answered;
    container.innerHTML = `
      ${journey?.headerHtml ?? ''}
      ${progressDotsHtml(ROUND_COUNT, (i) => i < roundIndex || (i === roundIndex && answered), roundIndex)}
      <p class="sp-task">${cfg.task}</p>
      ${showMeaning ? `<p class="sp-meaning">🇮🇩 <b>${round.sentence.id}</b></p>` : ''}
      <div class="speak-row">
        ${showListen ? '<button class="speak-btn pt-cta" type="button" data-action="hearSentence">🔊 Dengar</button>' : ''}
        ${hintButtonHtml()}
      </div>
      <div class="sp-pyramid">${rowsHtml()}</div>
      <div class="sp-answer-bar${built ? '' : ' empty'}">${solved ? round.sentence.en : built || 'Tap gelembung katanya 👆'}</div>
      <div class="feedback" id="fb"></div>
      ${
        answered
          ? ''
          : `<div class="letter-actions">
        <button class="ghost-btn slim" type="button" data-action="removeLastBubble" ${answer.length === 0 ? 'disabled' : ''}>⌫ Hapus Kata</button>
        <button class="ghost-btn slim" type="button" data-action="resetBubbles" ${answer.length === 0 ? 'disabled' : ''}>🔄 Ulang Susunan</button>
      </div>`
      }
    `;
    setHandlers({
      tapBubble: (payload) => onTapBubble(Number(payload)),
      hearSentence: () => speak(round.sentence.en),
      hint: useHint,
      removeLastBubble: () => {
        if (answered || answer.length === 0) return;
        const last = answer.pop()!;
        used[last] = false;
        paint();
      },
      resetBubbles: () => {
        if (answered || answer.length === 0) return;
        answer.forEach((i) => (used[i] = false));
        answer = [];
        paint();
      },
    });
  }

  function useHint(): void {
    if (answered || hintUsed || (cfg.hintGated && !attempted)) return;
    hintUsed = true;
    markGameHint(GAME_KEY);
    if (cfg.hint === 'listen') {
      paint();
      speak(round.sentence.en);
      return;
    }
    // 'next-word': potong susunan ke awalan yang sudah benar, lalu isi 1 kata
    // berikutnya (non-punitive — kata yang sudah pas tidak dihapus).
    const target = round.answers[0];
    let keep = 0;
    while (keep < answer.length && round.bubbles[answer[keep]].key === target[keep]) keep += 1;
    for (const i of answer.slice(keep)) used[i] = false;
    answer = answer.slice(0, keep);
    const next = round.bubbles.findIndex((b, i) => !used[i] && b.key === target[keep]);
    if (next >= 0) {
      used[next] = true;
      answer.push(next);
    }
    paint();
    if (answer.length === target.length) checkAnswer();
  }

  function onTapBubble(i: number): void {
    if (answered || used[i]) return;
    if (cfg.speakOnTap) speak(round.bubbles[i].text);
    used[i] = true;
    answer.push(i);
    paint();
    if (answer.length === round.answers[0].length) checkAnswer();
  }

  function checkAnswer(): void {
    answered = true;
    attempted = true;
    // Hapus `.letter-actions` langsung dari DOM (CLAUDE.md poin 4) — repaint
    // dari `onTapBubble` barusan sudah kepakai sebelum `answered` jadi true.
    container.querySelector('.letter-actions')?.remove();
    const keys = answer.map((i) => round.bubbles[i].key).join(' ');
    const correct = round.answers.some((a) => a.join(' ') === keys);
    if (correct) {
      solved = true;
      paint();
      recordAttempt(true, GAME_KEY);
      playCorrectTone();
      fireConfetti();
    } else {
      recordAttempt(false, GAME_KEY);
      container.querySelector('.sp-answer-bar')?.classList.add('is-wrong');
      playWrongTone();
      vibrateDevice(160);
    }
    const fb = container.querySelector<HTMLElement>('#fb')!;
    fb.textContent = correct ? pickPraise(level) : pickEncourage(level);
    fb.className = correct ? 'feedback good' : 'feedback bad';
    const isLastRoundOfMarkas = roundIndex === ROUND_COUNT - 1;
    fb.insertAdjacentHTML('afterend', roundActionsHtml(isLastRoundOfMarkas && (journey?.isLast ?? true)));
    setHandlers({
      hearSentence: () => speak(round.sentence.en),
      tryAgainRound: () => {
        // `answered = false` WAJIB sebelum `paint()` (CLAUDE.md poin 4) —
        // Petunjuk yang sudah dibuka tetap (non-punitive), `attempted` tetap
        // true (🔒 Petunjuk Jago/Legendaris jadi terbuka).
        answered = false;
        solved = false;
        answer = [];
        used = round.bubbles.map(() => false);
        paint();
      },
      nextRound: () => {
        roundIndex += 1;
        if (roundIndex >= ROUND_COUNT) {
          onDone();
          return;
        }
        newRound();
      },
    });
  }

  newRound();
}

interface JourneyNode {
  difficulty: WordMatchDifficulty;
  place: string;
  emoji: string;
  guideLine: string;
}

/** 6 markas Kerajaan Kalimat, urut Pemanasan→Mudah→Sedang→Sulit→Jago→
 *  Legendaris (markas ke-0 `pemanasan` BARU, permintaan user "tambahkan 1
 *  sehingga ada 6... levelnya ada pemanasan, mudah, sedang, sulit, jago,
 *  legendaris") — nama tempat SENGAJA beda dari Kerajaan Kata/Balon/Ingatan
 *  (hindari nama lokasi persis sama biar tidak tertukar di kepala anak,
 *  pola SAMA alasan `games/wordmatch.ts`). */
const JOURNEY_NODES: JourneyNode[] = [
  { difficulty: 'pemanasan', place: 'Halaman Kalimat', emoji: '🏡', guideLine: 'Yuk pemanasan! Dengar kalimat pendeknya, lalu susun.' },
  { difficulty: 'mudah', place: 'Taman Kalimat', emoji: '🌻', guideLine: 'Selamat datang di Taman Kalimat! Kalimatnya sedikit lebih panjang, dengar baik-baik.' },
  { difficulty: 'sedang', place: 'Bengkel Kalimat', emoji: '🔧', guideLine: 'Di Bengkel Kalimat kamu menyusun dari artinya. Suaranya ada di Petunjuk.' },
  { difficulty: 'sulit', place: 'Studio Kalimat', emoji: '🎨', guideLine: 'Sampai di Studio Kalimat! Pilih bentuk kata yang pas, ya.' },
  { difficulty: 'jago', place: 'Panggung Kalimat', emoji: '🎭', guideLine: 'Kamu di Panggung Kalimat! Sekarang ada kalimat tanya dan kalimat "tidak".' },
  { difficulty: 'legendaris', place: 'Puncak Kalimat', emoji: '🏔️', guideLine: 'Ini dia Puncak Kalimat! Gabungkan 2 ide jadi 1 kalimat panjang.' },
];

/** Header dalam layar 1 markas — pola SAMA PERSIS `nodeHeaderHtml()`
 *  `games/wordmatch.ts`. */
function nodeHeaderHtml(node: JourneyNode, foundCount: number, total: number): string {
  return `
    <div class="latihan-head">
      <span class="stage-badge">${node.emoji} ${node.place}</span>
      <span class="tag accent">🧩 ${foundCount}/${total}</span>
    </div>
    <p class="meta" style="margin-top:var(--s3)">📯 "${node.guideLine}"</p>`;
}

/**
 * Raja Susun — orkestrator penuh (dipanggil `app.ts runRajaRound`), pola
 * SAMA PERSIS `games/wordmatch.ts` `runWordMatch()` — Map Kerajaan Kalimat
 * 6-markas → tap markas → 1 markas = 5 kalimat via
 * `runSentencePuzzleRound()` → balik ke Map → markas ke-6 tuntas →
 * "Semua Kalimat Tersusun!" → `onDone()`. State `visited` cuma hidup di
 * closure ini, TIDAK disimpan progress.ts/localStorage, konsisten semua
 * raja Game Hub lain.
 */
export function runSentencePuzzle(container: HTMLElement, onDone: OnDone, level: LevelKey): void {
  const total = JOURNEY_NODES.length;
  const visited = new Set<number>();

  function renderMap(): void {
    // 🔒 Back dari layar Map TIDAK perlu pop up konfirmasi lagi (permintaan
    // user) — lihat komentar `isGameRoundActive` `interaction.ts`.
    setGameRoundActive(false);
    const stops = journeyMapHtml('susun', JOURNEY_NODES.map((n) => ({ name: n.place, emoji: n.emoji, difficulty: n.difficulty, label: TIER_CONFIG[n.difficulty].label })), visited);

    // 🔒 `current` = markas berikutnya yang belum ditaklukkan (posisi anak
    // sekarang), permintaan user "beri pembeda di progress yang sedang
    // disinggahi" — lihat komentar `.game-progress-dot.current` styles.css.
    const nextIdx = JOURNEY_NODES.findIndex((_, i) => !visited.has(i));
    const dots = JOURNEY_NODES.map((_, i) => {
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
          'Dengar kalimatnya atau baca artinya',
          'Tap gelembung kata untuk menyusun kalimat',
          'Tiap markas punya tantangan baru, 5 kalimat per markas',
          'Taklukkan markas satu per satu sampai tuntas!',
        ])}
      </div>`;
    setHandlers({ enterNode: (payload) => playStage(Number(payload)) });
  }

  function playStage(idx: number): void {
    setGameRoundActive(true, renderMap); // masuk markas = "halaman mengerjakan", popup keluar aktif lagi; keluar = balik ke Map
    markasIntro(JOURNEY_NODES[idx].emoji, JOURNEY_NODES[idx].place);
    setGameMarkas(GAME_KEY, idx, JOURNEY_NODES[idx].place, JOURNEY_NODES[idx].emoji);
    const node = JOURNEY_NODES[idx];
    const isLast = idx === total - 1;
    runSentencePuzzleRound(
      container,
      node.difficulty,
      () => {
        visited.add(idx);
        if (visited.size >= total) renderMissionComplete();
        else renderMap();
      },
      level,
      { isLast, headerHtml: nodeHeaderHtml(node, visited.size, total) }
    );
  }

  function renderMissionComplete(): void {
    setGameRoundActive(false); // layar selesai, tidak ada progres yang bisa hilang
    sfx('mission');
    container.innerHTML = `
      <div class="done-wrap win">
        <div class="sunburst lg mascot-pop" aria-hidden="true"><span class="face">🧩</span><span class="crown">🏆</span></div>
        <h2 class="win-banner">Semua Kalimat Tersusun!</h2>
        <p class="done-sub">Kamu berhasil menjelajahi seluruh Kerajaan Kalimat & menyusun semua kalimatnya!</p>
        <button class="primary-btn" type="button" data-action="finish">Selesai ✅</button>
      </div>`;
    setHandlers({ finish: () => onDone() });
  }

  renderMap();
}
