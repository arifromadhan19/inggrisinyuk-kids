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
 *
 * 🔒 **Revisi 2026-09-29 (permintaan user "samakan konsepnya dgn Word
 * Quest/Balloon Hunt/Sentence Puzzle — beberapa soal per markas")**: 1 markas
 * = `BOARD_COUNT` (5) papan, bullet progress = papan (bukan pasangan), kata
 * diambil dari antrian tanpa ulang. Bank & jumlah pasangan pindah ke
 * `memorymatch-data.ts` (dicek build), bank lama diganti krn melanggar
 * aturan wajib (emoji badan utuh 🐟🐦🐘🐧🦘🦋🦖🐙🦎, 🎃, kognat "Bus"↔"Bus",
 * Teleskop↔Telescope dst).
 *
 * 🔒 **Pembeda markas (permintaan user "kerjakan sehingga statusnya selesai
 * semua")**: tiap markas = 1 ATURAN PASANGAN baru (gambar+suara → gambar →
 * kata ID↔EN → bunyi↔tulisan → lawan kata → kalimat rumpang↔kata), 💡
 * bantuan 1x/papan (Intip → Intip Tulisan → Arti). Tabel lengkap di komentar
 * puncak `memorymatch-data.ts`; riset: `materi/pembeda_level_game.md`
 * § Memory Hunt.
 */
import { journeyMapHtml, markasIntro } from '../game-ui';
import { sfx } from '../game-audio';
import { readingPicHtml as picHtml } from '../reading-pic';
import { setGameRoundActive, setHandlers } from '../interaction';
import { recordAttempt } from '../progress';
import { playCorrectTone, playWrongTone, speak, vibrateDevice } from '../speech';
import { pickPraise, pickEncourage } from '../praise';
import { fireConfetti } from '../confetti';
import { GAME_STAR_FIELD } from '../scenery';
import { shuffle } from '../util';
import type { LevelKey, OnDone, WordMatchDifficulty } from '../types';
import { BOARD_COUNT, GAP_BANK, OPPOSITE_BANK, PICTURE_BANK, SOUND_BANK, TIER_CONFIG, TRANSLATE_BANK, type HintKind } from './memorymatch-data';

/** `RajaKey` game ini — dikirim ke `recordAttempt()`, lihat komentar
 *  `GAME_KEY` `games/wordmatch.ts`. */
const GAME_KEY = 'ingatan';

/** Label + sub-teks kartu markas di Map — dihitung dari `TIER_CONFIG`
 *  (`memorymatch-data.ts`, satu-satunya tempat mengubah pasangan/bank). */
export const DIFFICULTY_META: Record<WordMatchDifficulty, { label: string; sub: string; pairCount: number }> = Object.fromEntries(
  Object.entries(TIER_CONFIG).map(([k, t]) => [k, { label: t.label, sub: `${t.pairCount} pasang kartu`, pairCount: t.pairCount }])
) as Record<WordMatchDifficulty, { label: string; sub: string; pairCount: number }>;

interface MemoryCard {
  pairId: number;
  side: 0 | 1;
  matched: boolean;
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

/** Opsional — dipasok `runMemoryMatch()` (orkestrator Map Kerajaan Ingatan)
 *  supaya 1 markas tahu posisinya, pola SAMA PERSIS `RoundJourneyCtx`
 *  `games/wordmatch.ts`. */
interface RoundJourneyCtx {
  isLast: boolean;
  headerHtml: string;
}

/** 1 sisi kartu. `label` = aria-label saat terbuka (kartu bunyi TIDAK boleh
 *  membocorkan katanya lewat aria-label sebelum cocok). */
interface Face {
  text: string;
  emoji?: string;
  /** Arti Indonesia — tampil kalau 💡 Arti dipakai (Jago/Legendaris). */
  meaning?: string;
  /** Dibacakan TTS saat kartu dibuka. */
  speak?: string;
  /** Kartu bunyi (Sulit): terbuka = 🔊 saja, tulisan baru muncul setelah cocok. */
  sound?: boolean;
  /** Kartu kalimat (Legendaris) — lebih lebar, teks rata kiri. */
  long?: boolean;
  label: string;
}

interface BoardPair {
  key: string;
  faces: [Face, Face];
}

/** Bank per markas → daftar pasangan kartu siap pakai (lihat tabel tier
 *  `memorymatch-data.ts`). */
function pairBank(difficulty: WordMatchDifficulty): BoardPair[] {
  const cfg = TIER_CONFIG[difficulty];
  switch (cfg.mode) {
    case 'picture':
      return PICTURE_BANK[difficulty as 'pemanasan' | 'mudah'].map((w) => ({
        key: w.en,
        faces: [
          { text: '', emoji: w.emoji, label: w.id },
          { text: w.en, label: w.en, speak: cfg.speakOnOpen ? w.en : undefined },
        ],
      }));
    case 'translate':
      return TRANSLATE_BANK.map((w) => ({ key: w.en, faces: [{ text: w.id, label: w.id }, { text: w.en, label: w.en }] }));
    case 'sound':
      return SOUND_BANK.map((w) => ({
        key: w.en,
        faces: [
          { text: w.en, sound: true, speak: w.en, label: 'Kartu suara' },
          { text: w.en, label: w.en },
        ],
      }));
    case 'opposite':
      return OPPOSITE_BANK.map((p) => ({
        key: p.a,
        faces: [
          { text: p.a, meaning: p.aId, label: p.a },
          { text: p.b, meaning: p.bId, label: p.b },
        ],
      }));
    case 'gap':
      return GAP_BANK.map((g) => ({
        key: g.answer,
        faces: [
          { text: g.sentence, meaning: g.sentenceId, long: true, label: g.sentence },
          { text: g.answer, label: g.answer },
        ],
      }));
  }
}

const HINT_LABEL: Record<HintKind, string> = {
  peek: 'Intip',
  'peek-written': 'Intip Tulisan',
  meaning: 'Arti',
};

/** Lama "Intip" (ms) — cukup untuk melihat sekilas, bukan untuk menghafal. */
const PEEK_MS = 2000;

/** Mesin 1 markas — `BOARD_COUNT` papan (dipanggil `runMemoryMatch()`
 *  orkestrator di bawah tiap markas ditap). Aturan pasangan & bantuan
 *  diambil dari `TIER_CONFIG` (`memorymatch-data.ts`). */
function runMemoryMatchRound(container: HTMLElement, difficulty: WordMatchDifficulty, onDone: OnDone, level: LevelKey, journey?: RoundJourneyCtx): void {
  const cfg = TIER_CONFIG[difficulty];
  const bank = pairBank(difficulty);
  const pairCount = Math.min(cfg.pairCount, bank.length);
  // 🔒 1 markas = BOARD_COUNT papan (pola Word Quest). Antrian diacak supaya
  // semua pasangan keluar dulu sebelum ada yang berulang & tidak ada yang
  // kembar dalam 1 papan.
  let boardIndex = 0;
  let queue: BoardPair[] = [];
  function nextPairs(): BoardPair[] {
    const picked: BoardPair[] = [];
    while (picked.length < pairCount) {
      if (queue.length === 0) queue = shuffle(bank);
      const p = queue.shift()!;
      if (picked.some((x) => x.key === p.key)) {
        queue.push(p);
        continue;
      }
      picked.push(p);
    }
    return picked;
  }
  let pairs: BoardPair[] = nextPairs();
  let cards: MemoryCard[] = buildCards(pairs);
  let opened: number[] = [];
  let score = 0;
  let boardStartScore = 0;
  let busy = false;
  // 🔒 Indeks 2 kartu yang lagi di-flash MERAH (CLAUDE.md "🔒 Aturan Wajib:
  // Notifikasi Jawaban Salah") — kosong lagi begitu ditutup.
  let wrongPair: number[] = [];
  // 💡 Bantuan 1x per papan. "Coba Lagi" (papan sama) TIDAK mereset —
  // bantuan yang sudah diambil tetap (non-punitive); papan baru mereset.
  let hintUsed = false;
  let peeking = false;
  let showMeaning = false;

  function buildCards(p: BoardPair[]): MemoryCard[] {
    return shuffle(
      p.flatMap((_, i) => [
        { pairId: i, side: 0 as const, matched: false },
        { pairId: i, side: 1 as const, matched: false },
      ])
    );
  }

  function faceOf(c: MemoryCard): Face {
    return pairs[c.pairId].faces[c.side];
  }

  function isPeekOpen(c: MemoryCard): boolean {
    if (!peeking) return false;
    return cfg.hint === 'peek' || (cfg.hint === 'peek-written' && !faceOf(c).sound);
  }

  function faceHtml(c: MemoryCard): string {
    const f = faceOf(c);
    const check = c.matched ? '<span class="mm-check" aria-hidden="true">✅</span>' : '';
    if (f.sound) {
      return `${check}<span class="mm-emoji" aria-hidden="true">🔊</span>${c.matched ? `<span class="mm-text">${f.text}</span>` : ''}`;
    }
    const emoji = f.emoji ? `<span class="mm-emoji">${picHtml(f.emoji)}</span>` : '';
    const text = f.text ? `<span class="mm-text">${f.text}</span>` : '';
    const meaning = showMeaning && f.meaning ? `<span class="mm-meaning">${f.meaning}</span>` : '';
    return `${check}${emoji}${text}${meaning}`;
  }

  function paint(): void {
    const matchedPairs = cards.filter((c) => c.matched).length / 2;
    const boardDone = matchedPairs >= pairs.length;
    const hintBtn = !hintUsed && !boardDone
      ? `<button class="speak-btn-ghost" type="button" data-action="hint"><span class="hint-bulb">💡</span> ${HINT_LABEL[cfg.hint]}</button>`
      : '';
    const gridCls = [`mm-grid`, `mm-c${cards.length}`, cfg.mode === 'gap' ? 'is-gap' : '', cfg.mode !== 'picture' ? 'is-text' : ''].filter(Boolean).join(' ');
    container.innerHTML = `
      ${journey?.headerHtml ?? ''}
      ${progressDotsHtml(BOARD_COUNT, (i) => i < boardIndex || (i === boardIndex && boardDone), boardIndex)}
      <div class="mm-head">
        <span class="mm-score">⭐ <b>${score}</b></span>
        <span class="mm-score">Pasangan: <b>${matchedPairs}/${pairs.length}</b></span>
      </div>
      <div class="wm-head"><p class="wm-task">${cfg.task}</p>${hintBtn}</div>
      <div class="${gridCls}">
        ${cards
          .map((c, i) => {
            const isOpen = c.matched || opened.includes(i) || isPeekOpen(c);
            const f = faceOf(c);
            const label = c.matched ? f.text : f.label;
            return `
            <button class="mm-card ${isOpen ? 'is-open' : ''} ${c.matched ? 'is-matched' : ''} ${f.long ? 'is-long' : ''} ${f.sound ? 'is-sound' : ''} ${wrongPair.includes(i) ? 'is-wrong' : ''}" type="button"
              data-action="flip" data-payload="${i}" ${isOpen || peeking ? 'disabled' : ''} aria-label="${isOpen ? label : 'Kartu tertutup'}">
              ${isOpen ? faceHtml(c) : `<span class="mm-mark" aria-hidden="true">❓</span>`}
            </button>`;
          })
          .join('')}
      </div>
      <div class="feedback" id="fb"></div>
    `;
    setHandlers({ flip: (payload) => flip(Number(payload)), hint: useHint });
  }

  function useHint(): void {
    if (hintUsed || busy) return;
    hintUsed = true;
    if (cfg.hint === 'meaning') {
      showMeaning = true;
      paint();
      return;
    }
    // Intip: tutup dulu kartu yang sedang terbuka (belum cocok), buka semua
    // sebentar, lalu tutup lagi.
    opened = [];
    peeking = true;
    busy = true;
    paint();
    setTimeout(() => {
      if (!container.isConnected) return;
      peeking = false;
      busy = false;
      paint();
    }, PEEK_MS);
  }

  function flip(i: number): void {
    if (busy || cards[i].matched || opened.includes(i) || opened.length >= 2) return;
    opened.push(i);
    sfx('flip');
    const f = faceOf(cards[i]);
    if (f.speak) speak(f.speak);
    paint();
    if (opened.length < 2) return;

    busy = true;
    const [a, b] = opened;
    const isMatch = cards[a].pairId === cards[b].pairId && cards[a].side !== cards[b].side;
    setTimeout(() => {
      if (!container.isConnected) return;
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
        playWrongTone();
        vibrateDevice(160);
        if (fb) {
          fb.textContent = pickEncourage(level);
          fb.className = 'feedback bad';
        }
        // Flash merah dulu selagi 2 kartu masih terbuka, baru ditutup lagi
        // (CLAUDE.md "🔒 Aturan Wajib: Notifikasi Jawaban Salah").
        wrongPair = [a, b];
        paint();
        const keepFb = { text: fb?.textContent ?? '', cls: fb?.className ?? '' };
        setTimeout(() => {
          if (!container.isConnected) return;
          wrongPair = [];
          opened = [];
          busy = false;
          paint();
          const fb2 = container.querySelector<HTMLElement>('#fb');
          if (fb2) {
            fb2.textContent = keepFb.text;
            fb2.className = keepFb.cls;
          }
        }, 380);
        return;
      }
      opened = [];
      busy = false;
      const praise = { text: fb?.textContent ?? '', cls: fb?.className ?? '' };
      paint();
      const fbNow = container.querySelector<HTMLElement>('#fb');
      if (fbNow) {
        fbNow.textContent = praise.text;
        fbNow.className = praise.cls;
      }

      if (cards.every((c) => c.matched)) {
        const lastBoard = boardIndex === BOARD_COUNT - 1;
        fbNow?.insertAdjacentHTML('afterend', roundActionsHtml(lastBoard && (journey?.isLast ?? true)));
        setHandlers({
          // Coba Lagi = papan yang SAMA (pasangan sama, posisi diacak ulang).
          tryAgainRound: () => {
            cards = buildCards(pairs);
            opened = [];
            score = boardStartScore;
            paint();
          },
          nextRound: () => {
            if (lastBoard) return onDone();
            boardIndex += 1;
            boardStartScore = score;
            pairs = nextPairs();
            cards = buildCards(pairs);
            opened = [];
            hintUsed = false;
            showMeaning = false;
            paint();
          },
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
    const stops = journeyMapHtml('ingatan', JOURNEY_NODES.map((n) => ({ name: n.place, emoji: n.emoji, difficulty: n.difficulty, label: DIFFICULTY_META[n.difficulty].label })), visited);

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
          'Tap 1 kartu, lalu tap 1 kartu lain',
          'Ingat posisi kartu yang sudah dibuka',
          'Tiap markas punya aturan pasangan sendiri — baca petunjuk di atas kartu',
          `Tiap markas ada ${BOARD_COUNT} papan — tuntaskan semuanya!`,
        ])}
      </div>`;
    setHandlers({ enterNode: (payload) => playStage(Number(payload)) });
  }

  function playStage(idx: number): void {
    setGameRoundActive(true, renderMap); // masuk markas = "halaman mengerjakan", popup keluar aktif lagi; keluar = balik ke Map
    markasIntro(JOURNEY_NODES[idx].emoji, JOURNEY_NODES[idx].place);
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
    sfx('mission');
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
