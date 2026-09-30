/**
 * Raja Kelompok — kelompokkan kata Inggris menurut ARTInya. Pola SAMA
 * PERSIS raja lain (`games/soundhunt.ts`/`games/memorymatch.ts`): Map 6
 * markas (Pemanasan→Legendaris), 10 soal per markas, bank sendiri
 * (`kelompok-data.ts`, dicek build), progres cuma hidup selama 1 sesi main.
 *
 * 🔒 Menggantikan versi lama (`runKelompokkan`/`drawSortQuestion` di
 * `games/vocabulary.ts`, SUDAH DIHAPUS — permintaan user "lakukan opsi B",
 * analisis `materi/pembeda_level_game.md` § Raja Kelompok): dulu 1 aktivitas
 * dari topik Vocab ber-`sortBaskets` (cuma Little Stars "Bentuk" → game
 * tersembunyi di 5 dari 6 level), keranjang berlabel Indonesia
 * "Bundar/Bersudut" yang bisa dijawab dari gambar tanpa bahasa Inggris,
 * Heart & Crescent masuk "Bundar" padahal lancip, dan "Selesai ✅" bisa
 * muncul sebelum semua soal dikerjakan. Sekarang keranjang berlabel
 * INGGRIS dan kata yang dikelompokkan makin lepas dari gambar (gambar →
 * tulisan → 3 keranjang → tempat tanpa ikon → suara → Odd One Out).
 * Tabel lengkap: komentar puncak `kelompok-data.ts`.
 *
 * Game ini SEKARANG punya layar Map → ikut aturan pop up keluar CLAUDE.md:
 * `setGameRoundActive(false)` di Map/selesai, `true` + `renderMap` saat masuk
 * markas.
 */
import { readingPicHtml as picHtml } from '../reading-pic';
import { isDevTestAccount } from '../account';
import { setGameRoundActive, setHandlers } from '../interaction';
import { recordAttempt } from '../progress';
import { speak, playCorrectTone, playWrongTone, vibrateDevice } from '../speech';
import { pickPraise, pickEncourage } from '../praise';
import { fireConfetti } from '../confetti';
import { GAME_STAR_FIELD } from '../scenery';
import { shuffle } from '../util';
import type { LevelKey, OnDone, WordMatchDifficulty } from '../types';
import { GROUPS, ODD_BLOCKED_PAIRS, ROUND_COUNT, TIER_CONFIG, type KItem } from './kelompok-data';

/** `RajaKey` game ini — dikirim ke `recordAttempt()`. */
const GAME_KEY = 'kelompok';

interface KNode {
  place: string;
  emoji: string;
  difficulty: WordMatchDifficulty;
  guideLine: string;
}

const NODES: KNode[] = [
  { place: 'Halaman Keranjang', emoji: '🧺', difficulty: 'pemanasan', guideLine: 'Yuk pemanasan! Lihat gambarnya, lalu masukkan ke keranjang yang pas.' },
  { place: 'Lumbung Desa', emoji: '🌾', difficulty: 'mudah', guideLine: 'Di lumbung ini tidak ada gambar — baca katanya dulu, ya!' },
  { place: 'Pasar Rakyat', emoji: '🏪', difficulty: 'sedang', guideLine: 'Pasar ini ramai! Sekarang ada 3 keranjang.' },
  { place: 'Rumah Besar', emoji: '🏡', difficulty: 'sulit', guideLine: 'Bantu rapikan rumah! Benda ini biasanya ada di ruangan mana?' },
  { place: 'Menara Gema', emoji: '🗼', difficulty: 'jago', guideLine: 'Di menara ini kata-katanya cuma terdengar. Dengarkan baik-baik!' },
  { place: 'Istana Teka-teki', emoji: '🏰', difficulty: 'legendaris', guideLine: 'Tiga kata di sini berteman. Temukan satu yang bukan temannya!' },
];

interface SortQ {
  kind: 'sort';
  item: KItem;
  baskets: string[];
  answer: number;
}

interface OddQ {
  kind: 'odd';
  words: KItem[];
  answer: number;
  /** Kelompok 3 kata lainnya (dibuka 💡). */
  group: string;
}

type KQuestion = SortQ | OddQ;

function makeQueue<T>(items: T[]): () => T {
  let q: T[] = [];
  return () => {
    if (q.length === 0) q = shuffle(items);
    return q.shift()!;
  };
}

function isBlocked(a: string, b: string): boolean {
  return ODD_BLOCKED_PAIRS.some(([x, y]) => (x === a && y === b) || (x === b && y === a));
}

/** `ROUND_COUNT` soal untuk 1 markas, sesuai tier. */
function buildQuestions(difficulty: WordMatchDifficulty): KQuestion[] {
  const cfg = TIER_CONFIG[difficulty];
  const out: KQuestion[] = [];
  if (cfg.mode === 'sort') {
    const pool = cfg.groups.flatMap((g) => GROUPS[g].items.map((item) => ({ item, g })));
    const next = makeQueue(pool);
    for (let i = 0; i < ROUND_COUNT; i++) {
      const { item, g } = next();
      const baskets = shuffle([g, ...shuffle(cfg.groups.filter((x) => x !== g)).slice(0, cfg.baskets - 1)]);
      out.push({ kind: 'sort', item, baskets, answer: baskets.indexOf(g) });
    }
    return out;
  }
  const nextGroup = makeQueue(cfg.groups);
  for (let i = 0; i < ROUND_COUNT; i++) {
    const g = nextGroup();
    const three = shuffle(GROUPS[g].items).slice(0, 3);
    const oddGroup = shuffle(cfg.groups.filter((x) => x !== g && !isBlocked(x, g)))[0];
    const odd = shuffle(GROUPS[oddGroup].items)[0];
    const words = shuffle([...three, odd]);
    out.push({ kind: 'odd', words, answer: words.indexOf(odd), group: g });
  }
  return out;
}

function roundActionsHtml(isLast: boolean): string {
  return `
    <div class="round-actions">
      <button class="ghost-btn" type="button" data-action="tryAgainRound">🔁 Coba Lagi</button>
      <button class="primary-btn" type="button" data-action="nextRound" style="margin-top:0">${isLast ? 'Selesai ✅' : 'Lanjut ➡️'}</button>
    </div>`;
}

/** Bullet progress read-only (pola raja lain) — TIDAK bisa dilompat, jadi
 *  "Selesai ✅" cuma muncul setelah 10 soal dilewati berurutan. */
function progressDotsHtml(total: number, isDone: (i: number) => boolean, current: number): string {
  const dots = Array.from({ length: total }, (_, i) => {
    const done = isDone(i);
    const cls = [done ? 'done' : '', i === current ? 'current' : ''].filter(Boolean).join(' ');
    return `<span class="quiz-dot static ${cls}" aria-hidden="true">${done ? '✓' : i + 1}</span>`;
  }).join('');
  return `<div class="quiz-nav"><div class="quiz-dots">${dots}</div></div>`;
}

function gameHowToHtml(steps: string[]): string {
  return `
    <h2 class="game-howto-title">Cara Main</h2>
    <div class="card game-howto-card">
      <ol class="game-howto-list">
        ${steps.map((s, i) => `<li><span class="game-howto-num" aria-hidden="true">${i + 1}</span><span>${s}</span></li>`).join('')}
      </ol>
    </div>`;
}

const ANSWER_LETTERS = ['A', 'B', 'C', 'D'];

export function runKelompok(container: HTMLElement, onDone: OnDone, level: LevelKey): void {
  const total = NODES.length;
  const visited = new Set<number>();

  function renderMap(): void {
    // 🔒 Back dari layar Map tidak perlu pop up konfirmasi (CLAUDE.md).
    setGameRoundActive(false);
    const stops = NODES.map((node, i) => {
      const cleared = visited.has(i);
      // Akun tes dev ("124") lihat SEMUA markas terbuka — lihat account.ts isDevTestAccount().
      const unlocked = isDevTestAccount() || i === 0 || visited.has(i - 1);
      const stateClass = cleared ? 'is-cleared' : unlocked ? 'is-open' : 'is-locked';
      const pct = cleared ? 100 : 0;
      return `
      <button class="raja-card terrain-card ${stateClass}" type="button" data-action="enterNode" data-payload="${i}" ${unlocked ? '' : 'disabled aria-disabled="true"'} style="--band-deep:var(--c-listen)">
        <span class="skill-pct${pct >= 100 ? ' done' : ''}">${pct}%</span>
        <span class="raja-card-icon" aria-hidden="true"><span class="mascot-idle" style="font-size:clamp(52px,14vw,68px);animation-delay:${(i * 0.15).toFixed(2)}s">${node.emoji}</span></span>
        <h3>${node.place}</h3>
        <span class="tag diff-${node.difficulty}">${TIER_CONFIG[node.difficulty].label}</span>
      </button>`;
    }).join('');

    const nextIdx = NODES.findIndex((_, i) => !visited.has(i));
    const dots = NODES.map((_, i) => {
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
        <div class="raja-grid">${stops}</div>
        ${gameHowToHtml([
          'Lihat, baca, atau dengar katanya',
          'Masukkan ke keranjang yang artinya pas',
          `Tiap markas ada ${ROUND_COUNT} soal — makin jauh, makin menantang`,
          'Taklukkan markas satu per satu sampai tuntas!',
        ])}
      </div>`;
    setHandlers({ enterNode: (payload) => playStage(Number(payload)) });
  }

  function playStage(idx: number): void {
    setGameRoundActive(true, renderMap); // masuk markas = "halaman mengerjakan"; keluar = balik ke Map
    const node = NODES[idx];
    const cfg = TIER_CONFIG[node.difficulty];
    const questions = buildQuestions(node.difficulty);
    let round = 0;
    // State per soal — direset HANYA saat pindah soal, BUKAN saat "Coba
    // Lagi" (bantuan yang sudah dibuka tetap terbuka).
    let hintUsed = false;
    let attempted = false;
    let answered = false;

    const q = () => questions[round];

    function playWord(): void {
      const cur = q();
      if (cur.kind === 'sort' && (cfg.show === 'picture' || cfg.show === 'audio')) speak(cur.item.en);
    }

    function hintHtml(): string {
      if (hintUsed) return '';
      if (cfg.hintGated && !attempted) return `<button class="speak-btn-ghost" type="button" disabled aria-disabled="true">🔒 Petunjuk</button>`;
      return `<button class="speak-btn-ghost" type="button" data-action="hint"><span class="hint-bulb">💡</span> Petunjuk</button>`;
    }

    function itemHtml(cur: SortQ): string {
      const it = cur.item;
      if (cfg.show === 'picture') {
        return `
          <div class="kl-item"><span class="kl-pic" aria-hidden="true">${picHtml(it.emoji)}</span><span class="kl-word">${it.en}</span></div>
          <div class="speak-row"><button class="speak-btn pt-cta" type="button" data-action="listen">🔊 Dengar</button></div>`;
      }
      const extra =
        hintUsed && cfg.hint === 'picture' && it.emoji ? `<span class="kl-pic" aria-hidden="true">${picHtml(it.emoji)}</span>`
        : hintUsed && cfg.hint === 'meaning' ? `<span class="kl-meaning">Artinya: ${it.id}</span>`
        : '';
      if (cfg.show === 'audio') {
        return `
          <div class="speak-row"><button class="speak-btn pt-cta" type="button" data-action="listen">🔊 Dengar</button></div>
          ${hintUsed ? `<div class="kl-item"><span class="kl-word">${it.en}</span></div>` : ''}`;
      }
      return `<div class="kl-item">${extra}<span class="kl-word">${it.en}</span></div>`;
    }

    function basketsHtml(cur: SortQ): string {
      return `<div class="kl-baskets kl-n${cur.baskets.length}">
        ${cur.baskets
          .map((g, i) => {
            const grp = GROUPS[g];
            // Keranjang tanpa ikon kelompok (Sulit) tetap bergambar 🧺 polos
            // yang sama di semua keranjang — tidak membocorkan kelompoknya.
            const icon = `<span class="kl-basket-icon" aria-hidden="true">${cfg.basketIcon && grp.emoji ? grp.emoji : '🧺'}</span>`;
            const meaning = hintUsed && cfg.hint === 'basket-meaning' ? `<span class="kl-meaning">${grp.id}</span>` : '';
            return `<button class="opt-btn kl-basket" type="button" data-action="pick" data-payload="${i}">${icon}<span class="kl-basket-label">${grp.en}</span>${meaning}</button>`;
          })
          .join('')}
      </div>`;
    }

    function oddHtml(cur: OddQ): string {
      return `
        ${hintUsed ? `<p class="kl-meaning" style="text-align:center">💭 Tiga kata ini kelompok <b>${GROUPS[cur.group].en}</b> (${GROUPS[cur.group].id}).</p>` : ''}
        <div class="opt-grid">
          ${cur.words
            .map((w, i) => `<button class="opt-btn answer-card" type="button" data-action="pick" data-payload="${i}" aria-label="${w.en}"><span class="answer-card-bottom"><span class="answer-card-label">${w.en}</span><span class="answer-card-badge" aria-hidden="true">${ANSWER_LETTERS[i]}</span></span></button>`)
            .join('')}
        </div>`;
    }

    function paint(): void {
      const cur = q();
      container.innerHTML = `
        <div class="latihan-head">
          <span class="stage-badge">${node.emoji} ${node.place}</span>
          <span class="tag accent">🧺 ${visited.size}/${total}</span>
        </div>
        <p class="meta" style="margin-top:var(--s3)">📯 "${node.guideLine}"</p>
        ${progressDotsHtml(ROUND_COUNT, (i) => i < round || (i === round && answered), round)}
        <div class="wm-head"><p class="wm-task">${cfg.task}</p>${hintHtml()}</div>
        ${cur.kind === 'sort' ? itemHtml(cur) + basketsHtml(cur) : oddHtml(cur)}
        <div class="feedback" id="fb"></div>`;
      setHandlers({ listen: playWord, hint: useHint, pick: (payload) => onPick(Number(payload)) });
    }

    /** 💡 — dipaint ulang; kalau soal sudah dijawab, feedback & tombol
     *  Coba Lagi/Lanjut dipasang kembali. */
    function useHint(): void {
      if (hintUsed) return;
      hintUsed = true;
      const cur = q();
      const fbHtml = answered ? container.querySelector('#fb')?.outerHTML ?? '' : '';
      const actions = answered ? container.querySelector('.round-actions')?.outerHTML ?? '' : '';
      const marks = answered ? Array.from(container.querySelectorAll<HTMLElement>('.opt-btn')).map((b) => b.className) : [];
      paint();
      if (answered) {
        container.querySelectorAll<HTMLButtonElement>('.opt-btn').forEach((b, i) => {
          b.disabled = true;
          if (marks[i]) b.className = marks[i];
        });
        container.querySelector('#fb')!.outerHTML = fbHtml + actions;
        setHandlers({ tryAgainRound, nextRound, listen: playWord, hint: useHint });
      }
      if (cfg.hint === 'basket-meaning' && cur.kind === 'sort') speak(cur.baskets.map((g) => GROUPS[g].en).join(', '));
    }

    function startRound(): void {
      hintUsed = false;
      attempted = false;
      answered = false;
      paint();
      playWord();
    }

    function tryAgainRound(): void {
      answered = false;
      paint();
      playWord();
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
      const correct = i === q().answer;
      answered = true;
      attempted = true;
      recordAttempt(correct, GAME_KEY);
      paint();
      const btns = container.querySelectorAll<HTMLButtonElement>('.opt-btn');
      btns.forEach((b) => (b.disabled = true));
      const fb = container.querySelector<HTMLElement>('#fb')!;
      if (correct) {
        btns[i].classList.add('correct', 'win-burst');
        playCorrectTone();
        fireConfetti();
        fb.textContent = pickPraise(level);
        fb.className = 'feedback good';
      } else {
        btns[i].classList.add('wrong');
        playWrongTone();
        vibrateDevice(160);
        fb.textContent = pickEncourage(level);
        fb.className = 'feedback bad';
      }
      fb.insertAdjacentHTML('afterend', roundActionsHtml(round === ROUND_COUNT - 1 && idx === total - 1));
      setHandlers({ tryAgainRound, nextRound, listen: playWord, hint: useHint });
    }

    startRound();
  }

  function renderMissionComplete(): void {
    setGameRoundActive(false); // layar selesai, tidak ada progres yang bisa hilang
    container.innerHTML = `
      <div class="done-wrap win">
        <div class="sunburst lg mascot-pop" aria-hidden="true"><span class="face">🧺</span><span class="crown">🏆</span></div>
        <h2 class="win-banner">Semua Keranjang Rapi!</h2>
        <p class="done-sub">Kamu berhasil menjelajahi seluruh Kerajaan Kelompok & mengelompokkan semua katanya!</p>
        <button class="primary-btn" type="button" data-action="finish">Selesai ✅</button>
      </div>`;
    setHandlers({ finish: () => onDone() });
  }

  renderMap();
}
