/**
 * Raja Ingatan — Memory Match "dedicated" (permintaan user). Sebelumnya
 * entry point "Raja Ingatan" (app.ts RAJA_LIST) cuma reuse GENERIK
 * `vocabularyGame.runMemoryMatch` dengan 1 topik Vocab yang dipilih ACAK
 * tiap main — beda dari Raja Kata/Raja Balon/Sentence Puzzle yang
 * masing-masing sudah punya file & bank kata SENDIRI, tidak terikat topik/
 * level Vocab manapun. File ini menyamakan Raja Ingatan ke pola yang sama
 * (persis `wordmatch.ts`/`balloonpop.ts`): bank kata EN↔ID generik sendiri,
 * dipilih ulang tiap ronde dari bank yang lebih besar (variasi antar-main,
 * pola sama `shuffle(bank).slice(...)` Balon).
 *
 * `vocabularyGame.runMemoryMatch` (games/vocabulary.ts) TIDAK dihapus —
 * tetap fungsi generik yang bisa dipakai ulang kalau nanti ada kebutuhan
 * lain reuse-topik-Vocab-acak. File ini murni menggantikan PEMANGGILAN di
 * Game Hub ("Raja Ingatan"), bukan menghapus fungsi lama itu. (Open the
 * Door "Buka Pintu Kastil", app.ts `runDoorFlow` — yang dulu jg
 * memanggilnya sbg "Pintu 3" — SUDAH DIHAPUS TOTAL, permintaan user.)
 *
 * 🔒 **Revisi (permintaan user "update... seperti konsepnya Raja Kata
 * dimana ada sub list game per level dan ada game nya 5 di setiap sub list
 * game per level")** — pola SAMA PERSIS `games/wordmatch.ts` `runWordMatch()`:
 * bank kata TUNGGAL lama dipecah jadi 5 bank per tingkat (`BANK_MUDAH`..
 * `BANK_LEGENDARIS`, kata makin panjang/jarang), `runMemoryMatch()` (nama
 * EXPORT TETAP SAMA, dipanggil `app.ts`) SEKARANG orkestrator penuh: Map
 * Kerajaan Ingatan 6-markas (`renderMap()`, grid `.raja-grid`/`.raja-card` —
 * markas ke-0 `pemanasan` BARU ditambah paling depan sesi lanjutan,
 * permintaan user "tambahkan 1 sehingga ada 6... levelnya ada pemanasan,
 * mudah, sedang, sulit, jago, legendaris") → tap markas → 1 ronde
 * `runMemoryMatchRound()` di markas itu → balik ke Map → markas ke-6
 * tuntas → "Semua Ingatan Terkumpul!" → `onDone()`. Mesin 1-ronde LAMA
 * (dulu bernama sama persis `runMemoryMatch`) TIDAK dihapus, cuma direname
 * `runMemoryMatchRound()` — riwayat desain lengkap (kenapa grid, kenapa
 * persentase, kenapa halo, kenapa "Cara Main"/footer standar): lihat
 * komentar `games/wordmatch.ts`, TIDAK diulang detail di sini.
 */
import { isDevTestAccount } from '../account';
import { setGameRoundActive, setHandlers } from '../interaction';
import { recordAttempt } from '../progress';
import { playCorrectTone, playTryAgainTone } from '../speech';
import { pickPraise, pickEncourage } from '../praise';
import { fireConfetti } from '../confetti';
import { GAME_STAR_FIELD } from '../scenery';
import { shuffle } from '../util';
import type { LevelKey, OnDone, WordMatchDifficulty } from '../types';

/** `RajaKey` game ini — dikirim ke `recordAttempt()`, lihat komentar
 *  `GAME_KEY` `games/wordmatch.ts`. */
const GAME_KEY = 'ingatan';

interface MemoryWord {
  id: string;
  en: string;
  emoji: string;
}

/** 5 bank kata per tingkat (permintaan user "seperti konsepnya Raja Kata"
 *  — dulu 1 bank tunggal `BANK`, SUDAH DIPECAH), pola SAMA PERSIS
 *  `games/wordmatch.ts` (kata makin panjang/jarang tiap tingkat, TIDAK ada
 *  kata yang tumpang tindih antar-bank biar kurva kesulitan genuine naik).
 *  Emoji SELALU unik per kata (kartu sisi ID emoji+teks tidak pernah
 *  ambigu). */
/** Tingkat PEMANASAN (BARU, permintaan user "tambahkan 1 sehingga ada 6...
 *  levelnya ada pemanasan, mudah, sedang, sulit, jago, legendaris") — kata
 *  sesederhana BANK_MUDAH, tapi `pairCount`-nya paling kecil (2, lihat
 *  DIFFICULTY_META). TIDAK ada kata yang tumpang tindih dgn bank lain. */
const BANK_PEMANASAN: MemoryWord[] = [
  { id: 'Topi', en: 'Hat', emoji: '🎩' },
  { id: 'Cangkir', en: 'Cup', emoji: '☕' },
  { id: 'Kotak', en: 'Box', emoji: '📦' },
  { id: 'Sapi', en: 'Cow', emoji: '🐮' },
  { id: 'Babi', en: 'Pig', emoji: '🐷' },
  { id: 'Ayam Betina', en: 'Hen', emoji: '🐔' },
  { id: 'Bus', en: 'Bus', emoji: '🚌' },
  { id: 'Pena', en: 'Pen', emoji: '🖊️' },
];

const BANK_MUDAH: MemoryWord[] = [
  { id: 'Kucing', en: 'Cat', emoji: '🐱' },
  { id: 'Anjing', en: 'Dog', emoji: '🐶' },
  { id: 'Ikan', en: 'Fish', emoji: '🐟' },
  { id: 'Bola', en: 'Ball', emoji: '⚽' },
  { id: 'Matahari', en: 'Sun', emoji: '☀️' },
];

const BANK_SEDANG: MemoryWord[] = [
  { id: 'Kelinci', en: 'Rabbit', emoji: '🐰' },
  { id: 'Burung', en: 'Bird', emoji: '🐦' },
  { id: 'Pisang', en: 'Banana', emoji: '🍌' },
  { id: 'Bunga', en: 'Flower', emoji: '🌸' },
  { id: 'Payung', en: 'Umbrella', emoji: '☂️' },
  { id: 'Bulan', en: 'Moon', emoji: '🌙' },
];

const BANK_SULIT: MemoryWord[] = [
  { id: 'Kupu-kupu', en: 'Butterfly', emoji: '🦋' },
  { id: 'Gajah', en: 'Elephant', emoji: '🐘' },
  { id: 'Pelangi', en: 'Rainbow', emoji: '🌈' },
  { id: 'Gitar', en: 'Guitar', emoji: '🎸' },
  { id: 'Pinguin', en: 'Penguin', emoji: '🐧' },
  { id: 'Labu', en: 'Pumpkin', emoji: '🎃' },
  { id: 'Kanguru', en: 'Kangaroo', emoji: '🦘' },
];

const BANK_JAGO: MemoryWord[] = [
  { id: 'Dinosaurus', en: 'Dinosaur', emoji: '🦖' },
  { id: 'Gurita', en: 'Octopus', emoji: '🐙' },
  { id: 'Astronot', en: 'Astronaut', emoji: '🧑‍🚀' },
  { id: 'Kompas', en: 'Compass', emoji: '🧭' },
  { id: 'Ransel', en: 'Backpack', emoji: '🎒' },
  { id: 'Bunglon', en: 'Chameleon', emoji: '🦎' },
];

const BANK_LEGENDARIS: MemoryWord[] = [
  { id: 'Teleskop', en: 'Telescope', emoji: '🔭' },
  { id: 'Komet', en: 'Comet', emoji: '☄️' },
  { id: 'Satelit', en: 'Satellite', emoji: '🛰️' },
  { id: 'Mikroskop', en: 'Microscope', emoji: '🔬' },
  { id: 'Kembang Api', en: 'Firework', emoji: '🎆' },
  { id: 'Terompet', en: 'Trumpet', emoji: '🎺' },
  { id: 'Akordeon', en: 'Accordion', emoji: '🪗' },
];

export interface DifficultyMeta {
  label: string;
  sub: string;
  pairCount: number;
}

/** Pasangan makin banyak tiap tingkat (3→7), pola SAMA persis
 *  `WordMatchDifficulty.pairCount` `games/wordmatch.ts`. */
export const DIFFICULTY_META: Record<WordMatchDifficulty, DifficultyMeta> = {
  pemanasan: { label: 'Pemanasan', sub: '2 pasang kartu', pairCount: 2 },
  mudah: { label: 'Mudah', sub: '3 pasang kartu', pairCount: 3 },
  sedang: { label: 'Sedang', sub: '4 pasang kartu', pairCount: 4 },
  sulit: { label: 'Sulit', sub: '5 pasang kartu', pairCount: 5 },
  jago: { label: 'Jago', sub: '6 pasang kartu', pairCount: 6 },
  legendaris: { label: 'Legendaris', sub: '7 pasang kartu', pairCount: 7 },
};

const BANK_BY_DIFFICULTY: Record<WordMatchDifficulty, MemoryWord[]> = {
  pemanasan: BANK_PEMANASAN,
  mudah: BANK_MUDAH,
  sedang: BANK_SEDANG,
  sulit: BANK_SULIT,
  jago: BANK_JAGO,
  legendaris: BANK_LEGENDARIS,
};

interface MemoryCard {
  pairId: number;
  face: 'id' | 'en';
  matched: boolean;
}

/** Duplikat lokal `roundActionsHtml` (konvensi app ini: helper generik
 *  diduplikasi per file game — lihat games/wordmatch.ts dst). */
function roundActionsHtml(isLast: boolean): string {
  return `
    <div class="round-actions">
      <button class="ghost-btn" type="button" data-action="tryAgainRound">🔁 Coba Lagi</button>
      <button class="primary-btn" type="button" data-action="nextRound" style="margin-top:0">${isLast ? 'Selesai ✅' : 'Lanjut ➡️'}</button>
    </div>`;
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

/** Opsional — dipasok `runMemoryMatch()` (orkestrator Map Kerajaan Ingatan)
 *  supaya 1 markas tahu posisinya, pola SAMA PERSIS `RoundJourneyCtx`
 *  `games/wordmatch.ts`. */
interface RoundJourneyCtx {
  isLast: boolean;
  headerHtml: string;
}

/** Mesin 1 markas/1 tingkat kesulitan — dulu bernama `runMemoryMatch` &
 *  jadi entry point tunggal (SUDAH DIHAPUS, lihat komentar puncak file).
 *  Sekarang dipakai `runMemoryMatch()` orkestrator di bawah (dipanggil 1×
 *  tiap markas ditap). */
function runMemoryMatchRound(container: HTMLElement, difficulty: WordMatchDifficulty, onDone: OnDone, level: LevelKey, journey?: RoundJourneyCtx): void {
  const bank = BANK_BY_DIFFICULTY[difficulty];
  const pairCount = DIFFICULTY_META[difficulty].pairCount;
  let words: MemoryWord[] = shuffle(bank).slice(0, Math.min(pairCount, bank.length));
  let cards: MemoryCard[] = buildCards(words);
  let opened: number[] = [];
  let score = 0;
  let busy = false;

  function buildCards(w: MemoryWord[]): MemoryCard[] {
    return shuffle(
      w.flatMap((_, i) => [
        { pairId: i, face: 'id' as const, matched: false },
        { pairId: i, face: 'en' as const, matched: false },
      ])
    );
  }

  function cardLabel(c: MemoryCard): { emoji: string; text: string } {
    const w = words[c.pairId];
    return c.face === 'id' ? { emoji: w.emoji, text: w.id } : { emoji: '', text: w.en };
  }

  function paint(): void {
    const matchedPairs = cards.filter((c) => c.matched).length / 2;
    container.innerHTML = `
      ${journey?.headerHtml ?? ''}
      <div class="mm-head">
        <span class="mm-score">SKOR: <b>${score}</b></span>
        <span class="tag">${matchedPairs}/${words.length}</span>
      </div>
      <div class="mm-grid">
        ${cards
          .map((c, i) => {
            const isOpen = c.matched || opened.includes(i);
            const label = cardLabel(c);
            return `
            <button class="mm-card ${isOpen ? 'is-open' : ''} ${c.matched ? 'is-matched' : ''}" type="button"
              data-action="flip" data-payload="${i}" ${isOpen ? 'disabled' : ''} aria-label="${isOpen ? label.text : 'Kartu tertutup'}">
              ${
                isOpen
                  ? `${c.matched ? '<span class="mm-check" aria-hidden="true">✅</span>' : ''}${label.emoji ? `<span class="mm-emoji">${label.emoji}</span>` : ''}<span class="mm-text">${label.text}</span>`
                  : `<span class="mm-mark" aria-hidden="true">❓</span>`
              }
            </button>`;
          })
          .join('')}
      </div>
      <div class="feedback" id="fb"></div>
    `;
    setHandlers({ flip: (payload) => flip(Number(payload)) });
  }

  function flip(i: number): void {
    if (busy || cards[i].matched || opened.includes(i) || opened.length >= 2) return;
    opened.push(i);
    paint();
    if (opened.length < 2) return;

    busy = true;
    const [a, b] = opened;
    const isMatch = cards[a].pairId === cards[b].pairId && cards[a].face !== cards[b].face;
    setTimeout(() => {
      const fb = container.querySelector<HTMLElement>('#fb');
      if (isMatch) {
        cards[a].matched = true;
        cards[b].matched = true;
        score += 10;
        recordAttempt(true, GAME_KEY);
        playCorrectTone();
        fireConfetti();
        if (fb) {
          fb.textContent = pickPraise(level);
          fb.className = 'feedback good';
        }
      } else {
        recordAttempt(false, GAME_KEY);
        playTryAgainTone();
        if (fb) {
          fb.textContent = pickEncourage(level);
          fb.className = 'feedback bad';
        }
      }
      opened = [];
      busy = false;
      paint();

      if (cards.every((c) => c.matched)) {
        const doneFb = container.querySelector<HTMLElement>('#fb');
        if (doneFb) doneFb.insertAdjacentHTML('afterend', roundActionsHtml(journey?.isLast ?? true));
        setHandlers({
          tryAgainRound: () => {
            words = shuffle(bank).slice(0, Math.min(pairCount, bank.length));
            cards = buildCards(words);
            opened = [];
            score = 0;
            paint();
          },
          nextRound: () => onDone(),
        });
      }
    }, 700);
  }

  paint();
}

interface JourneyNode {
  difficulty: WordMatchDifficulty;
  place: string;
  emoji: string;
  guideLine: string;
}

/** 6 markas Kerajaan Ingatan, urut Pemanasan→Mudah→Sedang→Sulit→Jago→
 *  Legendaris (markas ke-0 `pemanasan` BARU, permintaan user "tambahkan 1
 *  sehingga ada 6... levelnya ada pemanasan, mudah, sedang, sulit, jago,
 *  legendaris") — nama tempat SENGAJA beda dari Kerajaan Kata/Balon/Susun
 *  (hindari nama lokasi persis sama biar tidak tertukar di kepala anak,
 *  pola SAMA alasan `games/wordmatch.ts`). */
const JOURNEY_NODES: JourneyNode[] = [
  { difficulty: 'pemanasan', place: 'Beranda Ingatan', emoji: '🏡', guideLine: 'Yuk pemanasan dulu di Beranda Ingatan sebelum masuk Ruang Kenangan!' },
  { difficulty: 'mudah', place: 'Ruang Kenangan', emoji: '🗝️', guideLine: 'Selamat datang di Ruang Kenangan! Ayo cari pasangan kartu pertama ini.' },
  { difficulty: 'sedang', place: 'Lorong Ingatan', emoji: '🕯️', guideLine: 'Kamu masuk lebih dalam ke Lorong Ingatan! Kartunya makin banyak, nih.' },
  { difficulty: 'sulit', place: 'Perpustakaan Pikiran', emoji: '📖', guideLine: 'Sampai di Perpustakaan Pikiran! Ingat baik-baik posisi tiap kartu.' },
  { difficulty: 'jago', place: 'Menara Konsentrasi', emoji: '🧠', guideLine: 'Kamu di Menara Konsentrasi! Makin banyak kartu, makin seru diingat.' },
  { difficulty: 'legendaris', place: 'Puncak Ingatan', emoji: '⭐', guideLine: 'Ini dia Puncak Ingatan! Buktikan kamu benar-benar Jago Ingatan sejati.' },
];

/** Header dalam layar 1 markas — pola SAMA PERSIS `nodeHeaderHtml()`
 *  `games/wordmatch.ts`. */
function nodeHeaderHtml(node: JourneyNode, foundCount: number, total: number): string {
  return `
    <div class="latihan-head">
      <span class="stage-badge">${node.emoji} ${node.place}</span>
      <span class="tag accent">🧠 ${foundCount}/${total}</span>
    </div>
    <p class="meta" style="margin-top:var(--s3)">📯 "${node.guideLine}"</p>`;
}

/**
 * Raja Ingatan — orkestrator penuh (dipanggil `app.ts runRajaRound`), pola
 * SAMA PERSIS `games/wordmatch.ts` `runWordMatch()` — Map Kerajaan Ingatan
 * 6-markas → tap markas → 1 ronde `runMemoryMatchRound()` di markas itu →
 * balik ke Map → markas ke-6 tuntas → "Semua Ingatan Terkumpul!" →
 * `onDone()`. State `visited` cuma hidup di closure ini, TIDAK disimpan
 * progress.ts/localStorage, konsisten semua raja Game Hub lain.
 */
export function runMemoryMatch(container: HTMLElement, onDone: OnDone, level: LevelKey): void {
  const total = JOURNEY_NODES.length;
  const visited = new Set<number>();

  function renderMap(): void {
    // 🔒 Back dari layar Map TIDAK perlu pop up konfirmasi lagi (permintaan
    // user) — lihat komentar `isGameRoundActive` `interaction.ts`.
    setGameRoundActive(false);
    const stops = JOURNEY_NODES.map((node, i) => {
      const cleared = visited.has(i);
      // Akun tes dev ("124") lihat SEMUA markas terbuka — lihat account.ts isDevTestAccount().
      const unlocked = isDevTestAccount() || i === 0 || visited.has(i - 1);
      const stateClass = cleared ? 'is-cleared' : unlocked ? 'is-open' : 'is-locked';
      const pct = cleared ? 100 : 0;
      const badge = `<span class="skill-pct${pct >= 100 ? ' done' : ''}">${pct}%</span>`;
      const meta = DIFFICULTY_META[node.difficulty];
      return `
      <button class="raja-card map-card ${stateClass}" type="button" data-action="enterNode" data-payload="${i}" ${unlocked ? '' : 'disabled aria-disabled="true"'} style="--band-deep:var(--c-speak)">
        ${badge}
        <span class="raja-card-icon" aria-hidden="true"><span class="mascot-idle" style="font-size:clamp(52px,14vw,68px);animation-delay:${(i * 0.15).toFixed(2)}s">${node.emoji}</span></span>
        <h3>${node.place}</h3>
        <span class="tag diff-${node.difficulty}">${meta.label}</span>
      </button>`;
    }).join('');

    const dots = JOURNEY_NODES.map((_, i) => {
      const done = visited.has(i);
      return `<span class="game-progress-dot${done ? ' done' : ''}" aria-hidden="true">${done ? '✓' : ''}</span>`;
    }).join('');

    container.innerHTML = `
      <div class="raja-map-wrap">
        ${GAME_STAR_FIELD}
        <div class="card game-progress-card">
          <h2>Taklukkan markas satu per satu, ya!</h2>
          <div class="game-progress-dots">${dots}<span class="game-progress-label">Selesai ${visited.size} dari ${total}</span></div>
        </div>
        <div class="raja-grid">${stops}</div>
        ${gameHowToHtml([
          'Tap 1 kartu, lalu tap 1 kartu lain',
          'Ingat posisi kartu yang sudah dibuka',
          'Cocok kalau kata & artinya sepasang',
          'Taklukkan markas satu per satu sampai tuntas!',
        ])}
      </div>`;
    setHandlers({ enterNode: (payload) => playStage(Number(payload)) });
  }

  function playStage(idx: number): void {
    setGameRoundActive(true); // masuk markas = "halaman mengerjakan", popup keluar aktif lagi
    const node = JOURNEY_NODES[idx];
    const isLast = idx === total - 1;
    runMemoryMatchRound(
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
    container.innerHTML = `
      <div class="done-wrap win">
        <div class="sunburst lg mascot-pop" aria-hidden="true"><span class="face">🧠</span><span class="crown">🏆</span></div>
        <h2 class="win-banner">Semua Ingatan Terkumpul!</h2>
        <p class="done-sub">Kamu berhasil menjelajahi seluruh Kerajaan Ingatan & mencocokkan semua kartu!</p>
        <button class="primary-btn" type="button" data-action="finish">Selesai ✅</button>
      </div>`;
    setHandlers({ finish: () => onDone() });
  }

  renderMap();
}
