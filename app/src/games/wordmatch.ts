/**
 * Raja Kata — Word Match. Boss berdiri sendiri, khusus Vocab, TERPISAH dari
 * tangga Raja [Hewan] per level (app.ts BOSS_NAME/BOSS_AVATAR/bossCleared) —
 * tingkat kesulitannya BUKAN mengikuti LevelKey, dan menang di sini TIDAK
 * PERNAH membuka level baru (progress.ts `gameXp`, bukan `bossCleared`).
 *
 * Mekanik: tap kata lalu tap gambar yang cocok (atau sebaliknya) — bukan
 * drag, supaya presisi sentuh tetap ramah anak kecil di layar sentuh. Pasangan
 * benar digambar garis penghubung animasi (SVG overlay) sbg reward visual
 * (terinspirasi referensi "connect the word to the picture" tapi tanpa perlu
 * drag beneran). Salah = goyang halus, non-punitive — kartu TETAP bisa ditap
 * lagi sesudahnya, tidak pernah terkunci.
 *
 * 🔒 **`runWordMatch()` sekarang konsep PETUALANGAN ala `games/soundhunt.ts`
 * — Map Kerajaan Kata 5-markas, TANPA picker tingkat kesulitan** (rentetan
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
 * 5 markas bertema Gerbang/Istana/Balairung/Menara/Ruang Harta Kata =
 * Mudah/Sedang/Sulit/Jago/Legendaris, reuse `.trail.raja-trail` PERSIS
 * `games/soundhunt.ts`) → tap markas yang kebuka → 1 ronde → balik ke Map
 * → markas berikutnya kebuka (BUKAN auto-lanjut ke tahap berikutnya —
 * anak sendiri yang tap markas baru, itu yang bikin terasa "jalan-jalan")
 * → markas ke-5 tuntas → "Semua Kepingan Ditemukan!" → `onDone()`.
 * "Dikunci jika belum selesai" TETAP terjaga lewat `unlocked = i===0 ||
 * visited.has(i-1)` di `renderMap()` — markas berikutnya betul² tidak bisa
 * disentuh (`🔒 Terkunci`, tombol disabled) sebelum markas sebelumnya
 * PERNAH dikunjungi, non-punitive (bukan harus MENANG dulu, cukup pernah
 * dicoba — persis `visited` Sound Hunt).
 *
 * Mesin 1-tahap/1-ronde LAMA (dulu bernama sama persis, dipanggil `payload
 * as WordMatchDifficulty`) TIDAK dihapus — sekarang jadi fungsi INTERNAL
 * `runWordMatchRound()`, dipakai `runWordMatch()` di atas (1× tiap kali
 * markas ditap, via `playStage()`). (Pemanggil KEDUA yang dulu ada di sini,
 * app.ts's Door Flow "Buka Pintu Kastil", SUDAH DIHAPUS TOTAL — permintaan
 * user — jangan cari referensinya lagi.)
 */
import { isDevTestAccount } from '../account';
import { setHandlers } from '../interaction';
import { recordAttempt } from '../progress';
import { playCorrectTone, playTryAgainTone } from '../speech';
import { pickPraise, pickEncourage } from '../praise';
import { fireConfetti } from '../confetti';
import { shuffle } from '../util';
import type { LevelKey, OnDone, WordMatchDifficulty } from '../types';

interface WordBankEntry {
  en: string;
  emoji: string;
}

const BANK_MUDAH: WordBankEntry[] = [
  { en: 'Cat', emoji: '🐱' },
  { en: 'Dog', emoji: '🐶' },
  { en: 'Sun', emoji: '☀️' },
  { en: 'Moon', emoji: '🌙' },
  { en: 'Star', emoji: '⭐' },
  { en: 'Tree', emoji: '🌳' },
  { en: 'Fish', emoji: '🐟' },
  { en: 'Egg', emoji: '🥚' },
  { en: 'Car', emoji: '🚗' },
  { en: 'Bee', emoji: '🐝' },
];

const BANK_SEDANG: WordBankEntry[] = [
  { en: 'Rabbit', emoji: '🐰' },
  { en: 'Elephant', emoji: '🐘' },
  { en: 'Banana', emoji: '🍌' },
  { en: 'Umbrella', emoji: '☂️' },
  { en: 'Guitar', emoji: '🎸' },
  { en: 'Rainbow', emoji: '🌈' },
  { en: 'Butterfly', emoji: '🦋' },
  { en: 'Penguin', emoji: '🐧' },
  { en: 'Pumpkin', emoji: '🎃' },
  { en: 'Dolphin', emoji: '🐬' },
  { en: 'Kangaroo', emoji: '🦘' },
  { en: 'Castle', emoji: '🏰' },
];

const BANK_SULIT: WordBankEntry[] = [
  { en: 'Dinosaur', emoji: '🦖' },
  { en: 'Octopus', emoji: '🐙' },
  { en: 'Telescope', emoji: '🔭' },
  { en: 'Volcano', emoji: '🌋' },
  { en: 'Astronaut', emoji: '🧑‍🚀' },
  { en: 'Crocodile', emoji: '🐊' },
  { en: 'Scorpion', emoji: '🦂' },
  { en: 'Helicopter', emoji: '🚁' },
  { en: 'Rocket', emoji: '🚀' },
  { en: 'Hedgehog', emoji: '🦔' },
  { en: 'Peacock', emoji: '🦚' },
  { en: 'Flamingo', emoji: '🦩' },
];

/** Tingkat ke-4/5 (BARU, permintaan user "untuk raja kata minimal 5
 *  kerajaan") — kata lebih panjang/jarang dari BANK_SULIT, TIDAK ada kata
 *  yang tumpang tindih dgn 3 bank di atas (biar kurva kesulitan tetap naik
 *  genuine, bukan anak ketemu kata yang sama persis di kerajaan "lebih
 *  susah"). */
const BANK_JAGO: WordBankEntry[] = [
  { en: 'Firefighter', emoji: '🧑‍🚒' },
  { en: 'Motorcycle', emoji: '🏍️' },
  { en: 'Parachute', emoji: '🪂' },
  { en: 'Thermometer', emoji: '🌡️' },
  { en: 'Compass', emoji: '🧭' },
  { en: 'Backpack', emoji: '🎒' },
  { en: 'Stethoscope', emoji: '🩺' },
  { en: 'Skateboard', emoji: '🛹' },
  { en: 'Chameleon', emoji: '🦎' },
  { en: 'Wheelchair', emoji: '🦽' },
];

const BANK_LEGENDARIS: WordBankEntry[] = [
  { en: 'Skyscraper', emoji: '🏙️' },
  { en: 'Tornado', emoji: '🌪️' },
  { en: 'Meteor', emoji: '☄️' },
  { en: 'Satellite', emoji: '🛰️' },
  { en: 'Rollercoaster', emoji: '🎢' },
  { en: 'Accordion', emoji: '🪗' },
  { en: 'Saxophone', emoji: '🎷' },
  { en: 'Microscope', emoji: '🔬' },
  { en: 'Firework', emoji: '🎆' },
  { en: 'Trumpet', emoji: '🎺' },
];

export interface DifficultyMeta {
  label: string;
  sub: string;
  pairCount: number;
}

export const DIFFICULTY_META: Record<WordMatchDifficulty, DifficultyMeta> = {
  mudah: { label: 'Mudah', sub: '3 pasang kata', pairCount: 3 },
  sedang: { label: 'Sedang', sub: '4 pasang kata', pairCount: 4 },
  sulit: { label: 'Sulit', sub: '5 pasang kata', pairCount: 5 },
  jago: { label: 'Jago', sub: '6 pasang kata', pairCount: 6 },
  legendaris: { label: 'Legendaris', sub: '7 pasang kata', pairCount: 7 },
};

const BANK_BY_DIFFICULTY: Record<WordMatchDifficulty, WordBankEntry[]> = {
  mudah: BANK_MUDAH,
  sedang: BANK_SEDANG,
  sulit: BANK_SULIT,
  jago: BANK_JAGO,
  legendaris: BANK_LEGENDARIS,
};

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
      <button class="primary-btn" type="button" data-action="nextRound" style="margin-top:0">${isLast ? 'Selesai ✅' : 'Lanjut ➡️'}</button>
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
  const bank = BANK_BY_DIFFICULTY[difficulty];
  const pairCount = DIFFICULTY_META[difficulty].pairCount;
  const pairs: WordBankEntry[] = shuffle(bank).slice(0, pairCount);

  let wordRow: MatchCard[] = [];
  let picRow: MatchCard[] = [];
  let selectedWord: number | null = null;
  let selectedPic: number | null = null;
  let shakeWord: number | null = null;
  let shakePic: number | null = null;
  let busy = false;
  let matchedCount = 0;

  function freshRound(): void {
    wordRow = shuffle(pairs.map((entry, i) => ({ pairId: i, entry, matched: false })));
    picRow = shuffle(pairs.map((entry, i) => ({ pairId: i, entry, matched: false })));
    selectedWord = null;
    selectedPic = null;
    shakeWord = null;
    shakePic = null;
    busy = false;
    matchedCount = 0;
  }
  freshRound();

  function cardClass(row: MatchCard[], i: number, isWord: boolean): string {
    const c = row[i];
    const classes = ['wm-card'];
    if (c.matched) classes.push('is-matched');
    else if ((isWord && selectedWord === i) || (!isWord && selectedPic === i)) classes.push('is-selected');
    if ((isWord && shakeWord === i) || (!isWord && shakePic === i)) classes.push('is-wrong');
    return classes.join(' ');
  }

  function cardHtml(row: MatchCard[], i: number, isWord: boolean): string {
    const c = row[i];
    const rowName = isWord ? 'word' : 'pic';
    const label = isWord
      ? `<span class="wm-word-text">${c.entry.en}</span>`
      : `<span class="wm-emoji" aria-hidden="true">${c.entry.emoji}</span>`;
    return `
      <button class="${cardClass(row, i, isWord)}" type="button" data-row="${rowName}" data-pair="${c.pairId}"
        data-action="tapCard" data-payload="${rowName}:${i}" ${c.matched ? 'disabled' : ''}
        aria-label="${isWord ? c.entry.en : c.entry.en + ' picture'}">
        ${c.matched ? '<span class="wm-check" aria-hidden="true">✅</span>' : ''}${label}
      </button>`;
  }

  function paint(justMatchedPairId: number | null): void {
    container.innerHTML = `
      ${journey?.headerHtml ?? ''}
      <div class="wm-head"><span class="tag">${matchedCount}/${pairCount} pasangan</span></div>
      <div class="wm-board" id="wmBoard">
        <svg class="wm-lines" id="wmLines" aria-hidden="true"></svg>
        <div class="wm-row" id="wmWordRow">${wordRow.map((_, i) => cardHtml(wordRow, i, true)).join('')}</div>
        <div class="wm-row" id="wmPicRow">${picRow.map((_, i) => cardHtml(picRow, i, false)).join('')}</div>
      </div>
      <div class="feedback" id="fb"></div>
    `;
    setHandlers({ tapCard: (payload) => onTap(payload ?? '') });
    drawLines(justMatchedPairId);
  }

  /** Ukur posisi kartu SETELAH repaint (rAF), gambar garis SVG antar pusat
   *  kartu kata↔gambar yang sudah cocok. `pathLength="1"` dipasang di tiap
   *  <line> supaya CSS bisa animasikan stroke-dashoffset 1→0 tanpa hitung
   *  panjang garis manual di JS. Cuma pasangan yang BARU cocok dapat class
   *  `.wm-line-new` (memicu animasi gambar-garis) — pasangan lama digambar
   *  statis supaya repaint berikutnya tidak mengulang animasinya. */
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
          line.setAttribute('x1', String(wr.left - boardRect.left + wr.width / 2));
          line.setAttribute('y1', String(wr.top - boardRect.top + wr.height / 2));
          line.setAttribute('x2', String(pr.left - boardRect.left + pr.width / 2));
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

    if (isWord) selectedWord = selectedWord === i ? null : i;
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
      matchedCount += 1;
      recordAttempt(true);
      playCorrectTone();
      fireConfetti();
      paint(pairId);
      const fb = container.querySelector<HTMLElement>('#fb');
      if (fb) {
        fb.textContent = pickPraise(level);
        fb.className = 'feedback good';
      }
      if (matchedCount >= pairCount) {
        fb?.insertAdjacentHTML('afterend', roundActionsHtml(journey?.isLast ?? true));
        setHandlers({
          tryAgainRound: () => {
            wordRow.forEach((c) => (c.matched = false));
            picRow.forEach((c) => (c.matched = false));
            wordRow = shuffle(wordRow);
            picRow = shuffle(picRow);
            matchedCount = 0;
            paint(null);
          },
          nextRound: () => onDone(),
        });
      }
    } else {
      recordAttempt(false);
      playTryAgainTone();
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

/** 5 markas Kerajaan Kata (permintaan user "untuk raja kata minimal 5
 *  kerajaan", digenapkan dari 3), urut Mudah→Sedang→Sulit→Jago→Legendaris —
 *  nama tempat cuma bungkus tema, `difficulty` di baliknya TETAP
 *  `WordMatchDifficulty` asli (bank kata & `pairCount` sama persis
 *  `DIFFICULTY_META`, tidak diduplikasi di sini). "Balairung" (bukan "Ruang
 *  Tahta") SENGAJA dipilih beda dari "Throne Room" (dulu `games/
 *  talktotheking.ts`, SUDAH DIHAPUS TOTAL — nama ditulis waktu itu masih
 *  ada 2 game bertema Raja, sengaja hindari nama lokasi yang persis sama
 *  biar tidak tertukar di kepala anak). */
const JOURNEY_NODES: JourneyNode[] = [
  { difficulty: 'mudah', place: 'Gerbang Kata', emoji: '🚪', guideLine: 'Selamat datang di gerbang Kerajaan Kata! Ayo cocokkan kata-kata pertama ini.' },
  { difficulty: 'sedang', place: 'Istana Kata', emoji: '🏯', guideLine: 'Kamu sudah masuk istana! Kata-katanya mulai sedikit lebih menantang, nih.' },
  { difficulty: 'sulit', place: 'Balairung Kata', emoji: '🏛️', guideLine: 'Hampir sampai balairung! Ini kata-kata paling menantang di seluruh kerajaan.' },
  { difficulty: 'jago', place: 'Menara Kata', emoji: '🗼', guideLine: 'Kamu sudah tinggi di menara! Kata-katanya makin panjang dan jarang terdengar.' },
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
 * (`renderMap()`, reuse PERSIS `.trail.raja-trail` — 3 markas besar
 * berikon, selang-seling kiri/kanan, markas ke-i cuma bisa dijelajah kalau
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
   *  terjangkau tampil terkunci. Catatan aturan 1-kalimat (permintaan user
   *  "di atas berikan catatan 1 atau kalimat untuk rule game ini")
   *  menggantikan paragraf blurb Welcome yang dihapus — cukup 1 baris,
   *  bukan story panjang lagi. */
  function renderMap(): void {
    const stops = JOURNEY_NODES.map((node, i) => {
      const cleared = visited.has(i);
      // Akun tes dev ("124") lihat SEMUA markas terbuka — lihat account.ts isDevTestAccount().
      const unlocked = isDevTestAccount() || i === 0 || visited.has(i - 1);
      const action = unlocked
        ? `<button class="primary-btn" type="button" data-action="enterNode" data-payload="${i}">${cleared ? '🔁 Main Lagi' : '▶️ Jelajahi'}</button>`
        : `<button class="ghost-btn" type="button" disabled aria-disabled="true">🔒 Terkunci</button>`;
      const statusText = cleared ? 'Kepingan ditemukan 🧩' : unlocked ? 'Menunggu dijelajahi' : 'Masih tersegel';
      const meta = DIFFICULTY_META[node.difficulty];
      return `
      <li class="trail-stop ${i % 2 === 1 ? 'icon-right' : ''}" style="--band-deep:var(--c-vocab)">
        <div class="raja-stop-inner">
          <span class="raja-icon" aria-hidden="true"><span class="mascot-idle" style="font-size:clamp(68px,17vw,92px);animation-delay:${(i * 0.15).toFixed(2)}s">${node.emoji}</span></span>
          <div class="trail-card">
            <span class="trail-place">🗺️ Kerajaan Kata</span>
            <h3>${node.place}</h3>
            <div class="trail-meta"><span class="meta">${meta.label} · ${meta.sub}</span></div>
            <div class="trail-meta"><span class="meta">${statusText}</span></div>
            <div class="trail-actions">${action}</div>
          </div>
        </div>
      </li>`;
    }).join('');

    container.innerHTML = `
      <div class="greet">
        <p class="lede">🔒 Selesaikan satu kerajaan dulu sebelum kerajaan berikutnya terbuka!</p>
        <p class="lede">🧩 <b>${visited.size} / ${total}</b> Kepingan ditemukan</p>
      </div>
      <ol class="trail raja-trail">${stops}</ol>`;
    setHandlers({ enterNode: (payload) => playStage(Number(payload)) });
  }

  function playStage(idx: number): void {
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
