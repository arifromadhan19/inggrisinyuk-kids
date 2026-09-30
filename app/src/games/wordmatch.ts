/**
 * Raja Kata — Word Match. Boss berdiri sendiri, khusus Vocab, TERPISAH dari
 * tangga Raja [Hewan] per level (app.ts BOSS_NAME/BOSS_AVATAR/bossCleared) —
 * tingkat kesulitannya BUKAN mengikuti LevelKey, dan menang di sini TIDAK
 * PERNAH membuka level baru (progress.ts `gameXp`, bukan `bossCleared`).
 *
 * 🔒 Pembeda tiap markas (Pemanasan→Legendaris) BUKAN cuma jumlah kata — tiap
 * markas menambah 1 jenis tantangan (kata mirip bentuk, satu kategori, suara,
 * petunjuk definisi). Tabel lengkap + bank kata: `games/wordmatch-data.ts`.
 *
 * Mekanik: tap kata lalu tap gambar yang cocok (atau sebaliknya) — bukan
 * drag, supaya presisi sentuh tetap ramah anak kecil di layar sentuh. Pasangan
 * benar digambar garis penghubung animasi (SVG overlay) sbg reward visual
 * (terinspirasi referensi "connect the word to the picture" tapi tanpa perlu
 * drag beneran). Salah = goyang halus, non-punitive — kartu TETAP bisa ditap
 * lagi sesudahnya, tidak pernah terkunci.
 *
 * 🔒 **`runWordMatch()` sekarang konsep PETUALANGAN ala `games/soundhunt.ts`
 * — Map Kerajaan Kata 6-markas, TANPA picker tingkat kesulitan** (rentetan
 * revisi user: (1) "update game Raja Kata dimana konsep nya seperti game
 * Talk to the King jadi tidak ada level cukup dari awal sampai akhir dan
 * dikunci jika belum selesai" — versi PERTAMA jadi alur linear murni tanpa
 * picker; (2) "kenapa game raja kata tidak seperti Sound Hunt yang ada
 * konsep petualang", ditanya map-style Sound Hunt vs bullet-dot Story
 * Quest → user pilih map-style + "tp konsep nya lebih ke arah
 * berpetualang" — jadi Map 3-markas; (3) "untuk raja kata minimal 5
 * kerajaan" — digenapkan 3→5 markas (`JOURNEY_NODES`, 2 tingkat kesulitan
 * BARU `jago`/`legendaris` ditambah ke `WordMatchDifficulty`); (4) "remoeve
 * page ini jadi ketika klik game raja-kata maka direct ke list kerajaan
 * nya dan di atas berikan catatan 1 atau kalimat untuk rule game ini" —
 * layar Welcome terpisah DIHAPUS, `runWordMatch()` SEKARANG langsung buka
 * `renderMap()`, blurb story panjang diganti 1 kalimat aturan singkat
 * "🔒 Selesaikan satu kerajaan dulu sebelum kerajaan berikutnya terbuka!"
 * di puncak Map) — dulu anak pilih Mudah/Sedang/Sulit sendiri lewat picker
 * di app.ts (`renderKataTierPicker`, SUDAH DIHAPUS) sebelum mulai 1 ronde.
 * Sekarang `runWordMatch()` (exported, dipanggil app.ts) ADALAH orkestrator
 * penuh: **Map Kerajaan Kata** (`renderMap()`, layar PERTAMA yang tampil —
 * 6 markas bertema Desa/Gerbang/Istana/Balairung/Menara/Ruang Harta Kata =
 * Pemanasan/Mudah/Sedang/Sulit/Jago/Legendaris, grid `.raja-grid`/
 * `.raja-card` — lihat komentar `renderMap()` di bawah utk riwayat
 * desainnya) → tap markas yang kebuka → 1 ronde → balik ke Map
 * → markas berikutnya kebuka (BUKAN auto-lanjut ke tahap berikutnya —
 * anak sendiri yang tap markas baru, itu yang bikin terasa "jalan-jalan")
 * → markas ke-6 tuntas → "Semua Kepingan Ditemukan!" → `onDone()`.
 * "Dikunci jika belum selesai" TETAP terjaga lewat `unlocked = i===0 ||
 * visited.has(i-1)` di `renderMap()` — markas berikutnya betul² tidak bisa
 * disentuh (`🔒 Terkunci`, tombol disabled) sebelum markas sebelumnya
 * PERNAH dikunjungi, non-punitive (bukan harus MENANG dulu, cukup pernah
 * dicoba — persis `visited` Sound Hunt).
 *
 * 🔒 **Revisi "6 markas" (permintaan user "setiap game ditambahkan 1
 * sehingga ada 6... levelnya ada pemanasan, mudah, sedang, sulit, jago,
 * legendaris")** — markas ke-0 BARU `pemanasan`/"Desa Kata" ditambah PALING
 * DEPAN (`JOURNEY_NODES[0]`, `BANK_PEMANASAN`), diterapkan SERAGAM ke
 * SEMUA game bertingkat (`games/balloonpop.ts`/`sentencepuzzle.ts`/
 * `memorymatch.ts`/`soundhunt.ts`) supaya penamaan tingkat konsisten lintas
 * Game Hub — nol perubahan pada 5 markas lama, cuma disisipi 1 di depan.
 * Grid desktop (`.raja-grid`) TETAP 3 kolom di lebar berapa pun ≥640px
 * supaya 6 kartu selalu rapi 2 baris × 3 — 🔒 SEKARANG jadi aturan DASAR
 * (bukan lagi override khusus `.raja-map-wrap`) sejak roster `/game` JUGA
 * diminta 3 kolom di desktop (permintaan user terpisah, lihat komentar
 * `.raja-grid` `public/styles.css`).
 *
 * Mesin 1-tahap/1-ronde LAMA (dulu bernama sama persis, dipanggil `payload
 * as WordMatchDifficulty`) TIDAK dihapus — sekarang jadi fungsi INTERNAL
 * `runWordMatchRound()`, dipakai `runWordMatch()` di atas (1× tiap kali
 * markas ditap, via `playStage()`). (Pemanggil KEDUA yang dulu ada di sini,
 * app.ts's Door Flow "Buka Pintu Kastil", SUDAH DIHAPUS TOTAL — permintaan
 * user — jangan cari referensinya lagi.)
 */
import { journeyMapHtml, markasIntro } from '../game-ui';
import { sfx } from '../game-audio';
import { readingPicHtml as picHtml } from '../reading-pic';
import { setGameRoundActive, setHandlers } from '../interaction';
import { markGameHint, recordAttempt, setGameMarkas } from '../progress';
import { playCorrectTone, playWrongTone, speak, vibrateDevice } from '../speech';
import { pickPraise, pickEncourage } from '../praise';
import { fireConfetti } from '../confetti';
import { GAME_STAR_FIELD } from '../scenery';
import { shuffle } from '../util';
import type { LevelKey, OnDone, WordMatchDifficulty } from '../types';
import { CATEGORY_GROUPS, LOOKALIKE_GROUPS, RANDOM_BANK, TIER_CONFIG, type WordBankEntry } from './wordmatch-data';

/** `RajaKey` game ini (app.ts `RAJA_LIST`) — dikirim ke `recordAttempt()`
 *  supaya percobaan main tercatat per-game (`Store.gameStats`, permintaan
 *  user "update rapor dimana masukan nilai dari hasil main game"), bukan
 *  cuma akurasi global. String literal (bukan import `RajaKey` — file ini
 *  sengaja tidak tahu apa-apa soal Game Hub selain kunci sendiri). */
const GAME_KEY = 'kata';

/** Jumlah papan per markas (lihat `runWordMatchRound`). */
const BOARD_COUNT = 10;

interface MatchCard {
  pairId: number;
  entry: WordBankEntry;
  matched: boolean;
}

/** Duplikat lokal `roundActionsHtml` (konvensi app ini: helper generik
 *  diduplikasi per file game, bukan diimpor lintas file — lihat
 *  games/listening.ts, games/reading.ts, dst). */
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

/** "Cara Main" — bagian bawah Map Kerajaan (permintaan user, referensi
 *  screenshot: judul tengah + kartu daftar bernomor), GANTIKAN pesan
 *  penutup custom "Itu semua markas..." (`gameMapFooterHtml()`, versi
 *  SEBELUMNYA — footer BRAND yang beneran sekarang ditaruh sekali di level
 *  screen, `app.ts renderGamePlay()` `.standalone-footer`). Duplikat lokal
 *  per file game (konvensi sama `roundActionsHtml`), langkah-langkah
 *  diteruskan sbg parameter krn mekanik tiap game beda (match/pop/dengar). */
function gameHowToHtml(steps: string[]): string {
  return `
    <h2 class="game-howto-title">Cara Main</h2>
    <div class="card game-howto-card">
      <ol class="game-howto-list">
        ${steps.map((s, i) => `<li><span class="game-howto-num" aria-hidden="true">${i + 1}</span><span>${s}</span></li>`).join('')}
      </ol>
    </div>`;
}

/** Opsional — dipasok `runWordMatch()` (orkestrator 3-tahap) supaya 1 ronde
 *  tahu posisinya di tahap Mudah→Sedang→Sulit: `isLast` menentukan label
 *  tombol akhir ("Lanjut ➡️" vs "Selesai ✅"), `headerHtml` disisipkan PALING
 *  ATAS papan (strip status tahap, `stageStripHtml()`). Dibiarkan `undefined`
 *  kalau dipanggil tanpa konteks tahap — `isLast` default `true` (label
 *  "Selesai ✅" spt sebelumnya). */
interface RoundJourneyCtx {
  isLast: boolean;
  headerHtml: string;
}

/** Mesin 1 ronde/1 tingkat kesulitan — dulu bernama `runWordMatch` &
 *  dipanggil langsung dari picker tingkat kesulitan (app.ts, SUDAH DIHAPUS
 *  lihat komentar file). Sekarang dipakai `runWordMatch()` orkestrator di
 *  bawah (dipanggil 3× berurutan). (Pemanggil KEDUA yang dulu ada, app.ts's
 *  Door Flow "Buka Pintu Kastil" via `runDoorFlow`, SUDAH DIHAPUS TOTAL —
 *  permintaan user — `export` dibiarkan apa adanya, bukan lagi dipanggil
 *  lintas-file.) */
export function runWordMatchRound(container: HTMLElement, difficulty: WordMatchDifficulty, onDone: OnDone, level: LevelKey, journey?: RoundJourneyCtx): void {
  const cfg = TIER_CONFIG[difficulty];
  const pairCount = cfg.pairCount;
  // 🔒 1 markas = BOARD_COUNT papan (permintaan user "1 sub game ada 10").
  // Tiap picker memakai antrian yang diacak supaya semua kata/grup keluar dulu
  // sebelum ada yang berulang, & tidak ada kata kembar dalam 1 papan.
  let boardIndex = 0;
  let wordQueue: WordBankEntry[] = [];
  let groupQueue: number[] = [];
  let categoryName = '';

  function takeGroup(len: number): number {
    if (groupQueue.length === 0) groupQueue = shuffle(Array.from({ length: len }, (_, i) => i));
    return groupQueue.shift()!;
  }

  function nextPairs(): WordBankEntry[] {
    if (cfg.picker === 'lookalike') {
      // 2 grup kata mirip bentuk × 2 kata → setiap kata py "kembaran" pengecoh.
      const picked: WordBankEntry[] = [];
      while (picked.length < pairCount) {
        const g = LOOKALIKE_GROUPS[takeGroup(LOOKALIKE_GROUPS.length)];
        const fresh = shuffle(g).filter((e) => !picked.some((p) => p.en === e.en));
        picked.push(...fresh.slice(0, Math.min(2, pairCount - picked.length)));
      }
      return picked;
    }
    if (cfg.picker === 'category') {
      const g = CATEGORY_GROUPS[takeGroup(CATEGORY_GROUPS.length)];
      categoryName = g.name;
      return shuffle(g.items).slice(0, pairCount);
    }
    const bank = RANDOM_BANK[difficulty];
    const picked: WordBankEntry[] = [];
    while (picked.length < Math.min(pairCount, bank.length)) {
      if (wordQueue.length === 0) wordQueue = shuffle(bank);
      const e = wordQueue.shift()!;
      if (picked.some((p) => p.en === e.en)) {
        wordQueue.push(e);
        continue;
      }
      picked.push(e);
    }
    return picked;
  }
  let pairs: WordBankEntry[] = nextPairs();

  let wordRow: MatchCard[] = [];
  let picRow: MatchCard[] = [];
  let selectedWord: number | null = null;
  let selectedPic: number | null = null;
  let shakeWord: number | null = null;
  let shakePic: number | null = null;
  let busy = false;
  let matchedCount = 0;
  // 💡 Petunjuk — sekali per papan, arti bantuannya beda per mode (lihat
  // tabel `wordmatch-data.ts`): picture = tandai 1 pasangan, audio =
  // tampilkan tulisan kata, clue = tampilkan arti Indonesia petunjuk.
  let hintUsed = false;
  let hintPairId: number | null = null;

  function freshRound(): void {
    wordRow = shuffle(pairs.map((entry, i) => ({ pairId: i, entry, matched: false })));
    picRow = shuffle(pairs.map((entry, i) => ({ pairId: i, entry, matched: false })));
    selectedWord = null;
    selectedPic = null;
    shakeWord = null;
    shakePic = null;
    busy = false;
    matchedCount = 0;
    hintUsed = false;
    hintPairId = null;
  }
  freshRound();

  function cardClass(row: MatchCard[], i: number, isWord: boolean): string {
    const c = row[i];
    const classes = ['wm-card'];
    if (!isWord && cfg.mode === 'clue') classes.push('is-text');
    if (isWord && cfg.mode === 'clue') classes.push('is-clue');
    if (c.matched) classes.push('is-matched');
    else if ((isWord && selectedWord === i) || (!isWord && selectedPic === i)) classes.push('is-selected');
    else if (!isWord && hintPairId === c.pairId) classes.push('is-hint');
    if ((isWord && shakeWord === i) || (!isWord && shakePic === i)) classes.push('is-wrong');
    return classes.join(' ');
  }

  /** Isi kartu kiri — kata (picture), 🔊 bernomor (audio), atau petunjuk (clue). */
  function leftLabel(c: MatchCard, i: number): { html: string; aria: string } {
    if (cfg.mode === 'audio') {
      const shown = hintUsed || c.matched;
      return {
        html: `<span class="wm-audio">🔊 ${i + 1}</span>${shown ? `<span class="wm-audio-word">${c.entry.en}</span>` : ''}`,
        aria: shown ? c.entry.en : `Suara ${i + 1}`,
      };
    }
    if (cfg.mode === 'clue') {
      return {
        html: `<span class="wm-clue">${c.entry.clue ?? ''}${hintUsed ? `<span class="wm-clue-id">${c.entry.clueId ?? ''}</span>` : ''}</span>`,
        aria: c.entry.clue ?? '',
      };
    }
    return { html: `<span class="wm-word-text">${c.entry.en}</span>`, aria: c.entry.en };
  }

  function cardHtml(row: MatchCard[], i: number, isWord: boolean): string {
    const c = row[i];
    const rowName = isWord ? 'word' : 'pic';
    let label: string;
    let aria: string;
    if (isWord) ({ html: label, aria } = leftLabel(c, i));
    else if (cfg.mode === 'clue') {
      label = `<span class="wm-word-text">${c.entry.en}</span>`;
      aria = c.entry.en;
    } else {
      label = `<span class="wm-emoji" aria-hidden="true">${picHtml(c.entry.emoji)}</span>`;
      aria = `${c.entry.en} picture`;
    }
    return `
      <button class="${cardClass(row, i, isWord)}" type="button" data-row="${rowName}" data-pair="${c.pairId}"
        data-action="tapCard" data-payload="${rowName}:${i}" ${c.matched ? 'disabled' : ''} aria-label="${aria}">
        ${c.matched ? '<span class="wm-check" aria-hidden="true">✅</span>' : ''}${label}
      </button>`;
  }

  function paint(justMatchedPairId: number | null): void {
    const done = matchedCount >= pairCount;
    const task = cfg.task.replace('{cat}', categoryName);
    const hintBtn =
      cfg.hint && !hintUsed && !done
        ? `<button class="speak-btn-ghost" type="button" data-action="hint"><span class="hint-bulb">💡</span> Petunjuk</button>`
        : '';
    container.innerHTML = `
      ${journey?.headerHtml ?? ''}
      ${progressDotsHtml(BOARD_COUNT, (i) => i < boardIndex || (i === boardIndex && done), boardIndex)}
      <div class="wm-head"><p class="wm-task">${task}</p>${hintBtn}</div>
      <div class="wm-board${cfg.mode === 'clue' ? ' is-clue' : ''}${cfg.mode === 'clue' && hintUsed ? ' show-id' : ''}" id="wmBoard">
        <svg class="wm-lines" id="wmLines" aria-hidden="true"></svg>
        <div class="wm-row" id="wmWordRow">${wordRow.map((_, i) => cardHtml(wordRow, i, true)).join('')}</div>
        <div class="wm-row" id="wmPicRow">${picRow.map((_, i) => cardHtml(picRow, i, false)).join('')}</div>
      </div>
      <div class="feedback" id="fb"></div>
    `;
    setHandlers({ tapCard: (payload) => onTap(payload ?? ''), hint: onHint });
    drawLines(justMatchedPairId);
  }

  function onHint(): void {
    if (hintUsed || busy) return;
    hintUsed = true;
    markGameHint(GAME_KEY);
    if (cfg.mode === 'picture') {
      // Pilihkan 1 kata yang belum cocok & tandai gambar pasangannya.
      const wi = selectedWord !== null && !wordRow[selectedWord].matched ? selectedWord : wordRow.findIndex((c) => !c.matched);
      if (wi >= 0) {
        selectedWord = wi;
        selectedPic = null;
        hintPairId = wordRow[wi].pairId;
      }
    }
    paint(null);
  }

  /** Garis dari tepi kanan kartu kiri ke tepi kiri kartu kanan (kolom kiri ↔
   *  kanan), digambar ulang setelah repaint (rAF). `pathLength="1"` supaya CSS
   *  bisa animasikan stroke-dashoffset; cuma pasangan BARU yang dapat
   *  `.wm-line-new` biar repaint tidak mengulang animasi pasangan lama. */
  function drawLines(justMatchedPairId: number | null): void {
    requestAnimationFrame(() => {
      const board = container.querySelector<HTMLElement>('#wmBoard');
      const svg = container.querySelector<SVGSVGElement>('#wmLines');
      if (!board || !svg) return;
      const boardRect = board.getBoundingClientRect();
      svg.setAttribute('width', String(boardRect.width));
      svg.setAttribute('height', String(boardRect.height));
      svg.innerHTML = '';
      wordRow
        .filter((c) => c.matched)
        .forEach((c) => {
          const pairId = c.pairId;
          const wordEl = container.querySelector<HTMLElement>(`.wm-card[data-row="word"][data-pair="${pairId}"]`);
          const picEl = container.querySelector<HTMLElement>(`.wm-card[data-row="pic"][data-pair="${pairId}"]`);
          if (!wordEl || !picEl) return;
          const wr = wordEl.getBoundingClientRect();
          const pr = picEl.getBoundingClientRect();
          const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
          line.setAttribute('x1', String(wr.right - boardRect.left));
          line.setAttribute('y1', String(wr.top - boardRect.top + wr.height / 2));
          line.setAttribute('x2', String(pr.left - boardRect.left));
          line.setAttribute('y2', String(pr.top - boardRect.top + pr.height / 2));
          line.setAttribute('pathLength', '1');
          line.setAttribute('class', pairId === justMatchedPairId ? 'wm-line wm-line-new' : 'wm-line');
          svg.appendChild(line);
        });
    });
  }

  function onTap(payload: string): void {
    if (busy) return;
    const [rowName, idxStr] = payload.split(':');
    const i = Number(idxStr);
    if (!Number.isFinite(i)) return;
    const isWord = rowName === 'word';
    const row = isWord ? wordRow : picRow;
    if (!row[i] || row[i].matched) return;

    if (isWord && cfg.speakOnTap) speak(row[i].entry.en);
    if (isWord) selectedWord = selectedWord === i && cfg.mode !== 'audio' ? null : i;
    else selectedPic = selectedPic === i ? null : i;

    if (selectedWord === null || selectedPic === null) {
      paint(null);
      return;
    }

    const wi = selectedWord;
    const pi = selectedPic;
    const isMatch = wordRow[wi].pairId === picRow[pi].pairId;

    if (isMatch) {
      const pairId = wordRow[wi].pairId;
      wordRow[wi].matched = true;
      picRow[pi].matched = true;
      selectedWord = null;
      selectedPic = null;
      if (hintPairId === pairId) hintPairId = null;
      matchedCount += 1;
      recordAttempt(true, GAME_KEY);
      playCorrectTone();
      fireConfetti();
      paint(pairId);
      const fb = container.querySelector<HTMLElement>('#fb');
      if (fb) {
        fb.textContent = pickPraise(level);
        fb.className = 'feedback good';
      }
      if (matchedCount >= pairCount) {
        const lastBoard = boardIndex === BOARD_COUNT - 1;
        fb?.insertAdjacentHTML('afterend', roundActionsHtml(lastBoard && (journey?.isLast ?? true)));
        setHandlers({
          tryAgainRound: () => {
            freshRound();
            paint(null);
          },
          nextRound: () => {
            if (lastBoard) return onDone();
            boardIndex += 1;
            pairs = nextPairs();
            freshRound();
            paint(null);
          },
        });
      }
    } else {
      recordAttempt(false, GAME_KEY);
      playWrongTone();
      vibrateDevice(160);
      busy = true;
      shakeWord = wi;
      shakePic = pi;
      selectedWord = null;
      selectedPic = null;
      paint(null);
      const fb = container.querySelector<HTMLElement>('#fb');
      if (fb) {
        fb.textContent = pickEncourage(level);
        fb.className = 'feedback bad';
      }
      setTimeout(() => {
        shakeWord = null;
        shakePic = null;
        busy = false;
        paint(null);
      }, 380);
    }
  }

  paint(null);
}

interface JourneyNode {
  difficulty: WordMatchDifficulty;
  place: string;
  emoji: string;
  /** Baris sapaan singkat penjaga markas — flavor petualangan, TIDAK
   *  diucapkan TTS (raja lain yg py guide bicara, mis. Sound Hunt, JUGA
   *  tidak pernah TTS-kan guide line-nya — murni teks). */
  guideLine: string;
}

/** 6 markas Kerajaan Kata (permintaan user "untuk raja kata minimal 5
 *  kerajaan", digenapkan dari 3, lalu "tambahkan 1 sehingga ada 6...
 *  levelnya ada pemanasan, mudah, sedang, sulit, jago, legendaris" —
 *  markas ke-0 `pemanasan` BARU ditambah PALING DEPAN), urut
 *  Pemanasan→Mudah→Sedang→Sulit→Jago→Legendaris — nama tempat cuma bungkus
 *  tema, `difficulty` di baliknya TETAP `WordMatchDifficulty` asli (bank
 *  kata & `pairCount` sama persis `TIER_CONFIG` (`wordmatch-data.ts`), tidak diduplikasi di
 *  sini). "Balairung" (bukan "Ruang Tahta") SENGAJA dipilih beda dari
 *  "Throne Room" (dulu `games/talktotheking.ts`, SUDAH DIHAPUS TOTAL —
 *  nama ditulis waktu itu masih ada 2 game bertema Raja, sengaja hindari
 *  nama lokasi yang persis sama biar tidak tertukar di kepala anak). */
const JOURNEY_NODES: JourneyNode[] = [
  { difficulty: 'pemanasan', place: 'Desa Kata', emoji: '🏘️', guideLine: 'Yuk pemanasan dulu di Desa Kata sebelum masuk gerbang kerajaan!' },
  { difficulty: 'mudah', place: 'Gerbang Kata', emoji: '🚪', guideLine: 'Selamat datang di gerbang Kerajaan Kata! Ayo cocokkan kata-kata pertama ini.' },
  { difficulty: 'sedang', place: 'Istana Kata', emoji: '🏯', guideLine: 'Kamu sudah masuk istana! Kata-katanya mulai sedikit lebih menantang, nih.' },
  { difficulty: 'sulit', place: 'Balairung Kata', emoji: '🏛️', guideLine: 'Hampir sampai balairung! Kamu sudah makin jago.' },
  { difficulty: 'jago', place: 'Menara Kata', emoji: '🗼', guideLine: 'Kamu sudah tinggi di menara! Sekarang andalkan telingamu.' },
  { difficulty: 'legendaris', place: 'Ruang Harta Kata', emoji: '💎', guideLine: 'Ini dia ruang harta terakhir! Buktikan kamu benar-benar Jago Kata sejati.' },
];

/** Header dalam layar 1 markas (dipasok ke `runWordMatchRound()` via
 *  `journey.headerHtml`) — pola SAMA PERSIS `games/soundhunt.ts`
 *  `drawLevel()`'s `.latihan-head`+guide-line, BUKAN lagi strip pil datar
 *  (revisi user: "tp konsep nya lebih ke arah berpetualang" — 1 markas =
 *  1 tempat bernama+ikon+sapaan, bukan cuma label tingkat kesulitan). */
function nodeHeaderHtml(node: JourneyNode, foundCount: number, total: number): string {
  return `
    <div class="latihan-head">
      <span class="stage-badge">${node.emoji} ${node.place}</span>
      <span class="tag accent">🧩 ${foundCount}/${total}</span>
    </div>
    <p class="meta" style="margin-top:var(--s3)">📯 "${node.guideLine}"</p>`;
}

/**
 * Raja Kata — orkestrator penuh, SEKARANG entry point utama file ini
 * (dipanggil app.ts `runRajaRound`, TANPA picker tingkat kesulitan lagi —
 * lihat komentar di puncak file). **Konsep petualangan ala `games/
 * soundhunt.ts`** (permintaan user langsung: "kenapa game raja kata tidak
 * seperti Sound Hunt yang ada konsep petualang" → ditanya map-style Sound
 * Hunt vs bullet-dot Story Quest → user pilih map-style, lalu "tp konsep
 * nya lebih ke arah berpetualang"): Welcome → **Map Kerajaan Kata**
 * (`renderMap()`, grid `.raja-grid`/`.raja-card` — lihat riwayat desain
 * lengkap di komentar `renderMap()`, markas ke-i cuma bisa dijelajah kalau
 * markas ke-(i-1) sudah PERNAH dikunjungi, non-punitive: BUKAN harus
 * benar, cukup pernah dicoba) → tap markas → 1 ronde `runWordMatchRound()`
 * di markas itu → balik ke Map (BUKAN auto-lanjut markas berikutnya spt
 * desain linear sebelumnya — anak sendiri yang tap markas baru yang
 * kebuka, itu yang bikin terasa "jalan-jalan" bukan cuma "level 1-2-3") →
 * markas ke-3 tuntas → "Semua Kepingan Ditemukan!" → `onDone()`.
 * Kepingan puzzle (🧩) di sini analog persis Sound Crystal (💎) Sound
 * Hunt — collectible per markas, direset tiap sesi main baru (state
 * `visited` cuma hidup di closure ini, TIDAK disimpan progress.ts/
 * localStorage, konsisten semua raja Game Hub lain).
 */
export function runWordMatch(container: HTMLElement, onDone: OnDone, level: LevelKey): void {
  const total = JOURNEY_NODES.length;
  const visited = new Set<number>();

  /** Map — SEKARANG layar PERTAMA yang tampil (Welcome screen terpisah
   *  DIHAPUS, permintaan user "remove page ini jadi ketika klik game
   *  raja-kata maka direct ke list kerajaan nya") — reuse PERSIS `.trail.
   *  raja-trail` (app.ts `renderGame()`/`games/soundhunt.ts` `renderMap()`,
   *  ikon besar+kartu selang-seling). Markas ke-i cuma bisa dijelajah kalau
   *  markas ke-(i-1) sudah PERNAH dikunjungi — non-punitive (bukan harus
   *  MENANG, cukup pernah dicoba, persis Sound Hunt), markas yang belum
   *  terjangkau tampil terkunci.
   *
   *  🔒 **Revisi (permintaan user "jadikan 1 card an seperti di halaman
   *  game dimana 1 row jadi 2 card")** — SEKARANG reuse PERSIS grid
   *  `.raja-grid`/`.raja-card` yang sama dgn roster `/game` (app.ts
   *  `renderGame()`), BUKAN lagi jalur trail 1-kolom (versi SEBELUMNYA di
   *  sini, "1 kartu lebar dgn strip terrain" — SUDAH DIGANTI TOTAL, jangan
   *  cari `terrainForIndex`/`.raja-trail` lagi di file ini). Tiap markas =
   *  1 tombol kartu (icon+judul+tag, TANPA teks "Jelajahi"/"Terkunci" lagi)
   *  dalam grid 2-kolom. Status via class `is-locked`/`is-cleared`/`is-open`
   *  (CSS lengkap: komentar `.raja-grid`/`.raja-card` di `public/
   *  styles.css`) — terkunci = kartu `disabled` + redup, tuntas = badge
   *  persentase 100% (hijau), & markas berikutnya yang boleh dijelajah
   *  dapat halo denyut mango di ikonnya (`hereHalo`, SATU titik fokus
   *  jelas, gantikan tombol pulsing sebelumnya).
   *
   *  🔒 **Revisi lanjutan ("lebih kids friendly seperti sebelumnya",
   *  analisis giggleacademy.com/learning-course)** — kartu grid di atas
   *  awalnya 1:1 ikut gaya roster `/game` (putih/krem polos), dinilai
   *  terlalu datar utk Map Kerajaan. Class `map-card` (BARU, `public/
   *  styles.css` — HANYA nempel di sini, roster `/game` TIDAK ikut berubah)
   *  kasih kartu rona warna Raja-nya sendiri yang LEMBUT (`color-mix`
   *  rendah, bukan latar saturasi penuh — riset sendiri konfirmasi Giggle
   *  Academy dominan putih/krem, warna cuma aksen). Tag tingkat kesulitan
   *  (`diff-${node.difficulty}`, BARU) sekarang berwarna beda tiap tingkat
   *  (reuse 5 token warna yang SUDAH ADA — mudah=hijau, sedang=biru,
   *  sulit=oranye, jago=ungu, legendaris=mango) GANTI `.tag` abu-abu netral
   *  yang sama semua tingkat, biar kerasa "naik tangga" tiap markas. */
  function renderMap(): void {
    // 🔒 Back dari layar Map TIDAK perlu pop up konfirmasi lagi (permintaan
    // user) — lihat komentar `isGameRoundActive` `interaction.ts`.
    setGameRoundActive(false);
    const stops = journeyMapHtml('kata', JOURNEY_NODES.map((n) => ({ name: n.place, emoji: n.emoji, difficulty: n.difficulty, label: TIER_CONFIG[n.difficulty].label })), visited);

    // 🔒 Kartu ringkasan puncak (permintaan user, referensi "Tantangan
    // Harian" — "buat sesimple mungkin secara text"): ikon+label kecil,
    // judul singkat, baris titik progres tiap markas + "Selesai X dari Y".
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
          'Tap kartu kiri, lalu kartu kanan yang cocok',
          'Tiap markas tantangannya beda: kata mirip, satu kelompok, dengar suara, tebak dari petunjuk',
          'Selesaikan 10 papan di tiap markas',
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
    runWordMatchRound(
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
        <h2 class="win-banner">Semua Kepingan Ditemukan!</h2>
        <p class="done-sub">Kamu berhasil menjelajahi seluruh Kerajaan Kata & mencocokkan semua kata!</p>
        <button class="primary-btn" type="button" data-action="finish">Selesai ✅</button>
      </div>`;
    setHandlers({ finish: () => onDone() });
  }

  renderMap();
}
