/**
 * Raja Balon — Balloon Pop. Game Hub "pure game" baru (permintaan user,
 * terinspirasi referensi kompetitor "letupkan balon" — kompetisi kata ID→EN
 * dikemas balon meletup), ditaruh TEPAT DI BAWAH Raja Kata di roster
 * (app.ts RAJA_LIST) sesuai permintaan "simpan di bawah game match word".
 *
 * Filter kid-friendly WAJIB diterapkan (CLAUDE.md): referensi aslinya py
 * timer countdown + hearts/nyawa + badge kesulitan bertekanan — SEMUA
 * dibuang di sini (materi/game.md §5: timer memicu stres neurologis, hearts
 * = status "kalah" implisit, keduanya dilarang keras). Yang diambil MURNI
 * bentuk visual (balon naik dari bawah ke atas, tap yang cocok utk
 * meletupkannya) — bukan mekanik gagalnya.
 *
 * Mekanik: 1 prompt Bahasa Indonesia tampil di atas ("Letupkan balon:
 * ..."), beberapa balon berisi kata Inggris naik terus-menerus dari bawah
 * papan ke atas (CSS animation loop, TANPA JS per-frame) — anak tap balon
 * yang jawabannya cocok. Benar → meletup (pop+confetti+skor), lanjut ke
 * kata berikutnya. Salah → balon goyang halus TAPI TETAP naik (non-
 * punitive, tidak pernah hilang/habis kesempatan) — anak bisa tap ulang
 * kapan saja balon lain masih melayang.
 *
 * 🔒 **Revisi user (sesi 2)** ("semua balon harus dari bawah munculnya dan
 * kurangi kecepatan, kecepatan sama seperti game match word ada level mudah/
 * sedang/sulit" + "soalnya pun sesuaikan dengan level") — pola SAMA PERSIS
 * `games/wordmatch.ts`: `DIFFICULTY_META`/`BANK_BY_DIFFICULTY` per tingkat,
 * dipilih dulu lewat `renderBalonTierPicker` (app.ts) sebelum main. Mudah =
 * balon paling lambat + kata terpendek, Sulit = balon tercepat + kata
 * terpanjang (tetap lebih lambat dari kecepatan tunggal versi sebelumnya).
 * Delay animasi SEKARANG POSITIF & bertingkat per balon (`i * 0.35s`, BUKAN
 * delay NEGATIF acak spt versi awal) + `animation-fill-mode:backwards`
 * (`styles.css`) — supaya title tiap balon KONSISTEN mulai dari bawah papan
 * (bukan muncul di tengah/dekat atas begitu ronde dibuka), baru naik
 * bertahap satu-satu spt cascade. Loop berikutnya (`infinite`) otomatis
 * tetap "muncul dari bawah" tiap siklus krn keyframe 0% = `bottom:-22%`.
 *
 * 🔒 **Revisi user (sesi 3) — "remove tingkat kesulitan jadikan konsepnya
 * seperti Raja Kata"**: picker tingkat kesulitan di depan (`renderBalonTierPicker`,
 * app.ts, SUDAH DIHAPUS TOTAL) diganti **Map Kerajaan Balon 5-markas**, pola
 * SAMA PERSIS `games/wordmatch.ts` `runWordMatch()`/`JOURNEY_NODES` — anak
 * TIDAK lagi memilih tingkat sendiri, langsung disambut Map (`renderMap()`)
 * begitu Raja Balon dibuka. Markas ke-i cuma bisa dijelajah kalau markas
 * ke-(i-1) sudah PERNAH dikunjungi (non-punitive — cukup pernah dicoba,
 * bukan harus menang). `DIFFICULTY_META`/`BANK_BY_DIFFICULTY` (mudah→
 * legendaris) TIDAK dihapus — 5 tingkat kesulitan lama SEKARANG jadi isi
 * 5 markas Map (`JOURNEY_NODES`), digenapkan 3→5 (`jago`/`legendaris` baru,
 * `BalloonDifficulty` di types.ts ikut diperluas) supaya jumlah markasnya
 * PERSIS sama dgn Kerajaan Kata. Mesin 1-markas/1-tingkat LAMA (dulu
 * `runBalloonPop`, dipanggil picker) TIDAK dihapus, cuma direname
 * `runBalloonPopRound()` & jadi fungsi INTERNAL yang dipakai orkestrator
 * `runBalloonPop()` (nama BARU, exported, dipanggil app.ts — signature
 * BARU TANPA parameter `difficulty` lagi, sama persis pola `runWordMatch`).
 */
import { isDevTestAccount } from '../account';
import { setHandlers } from '../interaction';
import { recordAttempt } from '../progress';
import { playCorrectTone, playTryAgainTone } from '../speech';
import { pickPraise, pickEncourage } from '../praise';
import { fireConfetti } from '../confetti';
import { shuffle } from '../util';
import type { BalloonDifficulty, LevelKey, OnDone } from '../types';

interface BalloonWord {
  id: string;
  en: string;
}

/** 3 bank kata sendiri per tingkat (bukan reuse topik Vocab manapun — pola
 *  sama Raja Kata `games/wordmatch.ts` BANK_MUDAH/SEDANG/SULIT), kata makin
 *  panjang/jarang seiring naik tingkat supaya "soalnya pun sesuaikan dengan
 *  level" (permintaan user), bukan cuma kecepatan yang beda. */
const BANK_MUDAH: BalloonWord[] = [
  { id: 'Kucing', en: 'Cat' },
  { id: 'Anjing', en: 'Dog' },
  { id: 'Matahari', en: 'Sun' },
  { id: 'Bulan', en: 'Moon' },
  { id: 'Bintang', en: 'Star' },
  { id: 'Pohon', en: 'Tree' },
  { id: 'Ikan', en: 'Fish' },
  { id: 'Telur', en: 'Egg' },
  { id: 'Mobil', en: 'Car' },
  { id: 'Lebah', en: 'Bee' },
];

const BANK_SEDANG: BalloonWord[] = [
  { id: 'Kelinci', en: 'Rabbit' },
  { id: 'Gajah', en: 'Elephant' },
  { id: 'Pisang', en: 'Banana' },
  { id: 'Payung', en: 'Umbrella' },
  { id: 'Gitar', en: 'Guitar' },
  { id: 'Pelangi', en: 'Rainbow' },
  { id: 'Kupu-kupu', en: 'Butterfly' },
  { id: 'Pinguin', en: 'Penguin' },
  { id: 'Labu', en: 'Pumpkin' },
  { id: 'Lumba-lumba', en: 'Dolphin' },
  { id: 'Kanguru', en: 'Kangaroo' },
  { id: 'Istana', en: 'Castle' },
];

const BANK_SULIT: BalloonWord[] = [
  { id: 'Dinosaurus', en: 'Dinosaur' },
  { id: 'Gurita', en: 'Octopus' },
  { id: 'Teleskop', en: 'Telescope' },
  { id: 'Gunung Berapi', en: 'Volcano' },
  { id: 'Astronot', en: 'Astronaut' },
  { id: 'Buaya', en: 'Crocodile' },
  { id: 'Kalajengking', en: 'Scorpion' },
  { id: 'Helikopter', en: 'Helicopter' },
  { id: 'Roket', en: 'Rocket' },
  { id: 'Landak', en: 'Hedgehog' },
  { id: 'Merak', en: 'Peacock' },
  { id: 'Flamingo', en: 'Flamingo' },
];

/** Tingkat ke-4/5 (BARU, "jadikan konsepnya seperti Raja Kata" — 5 markas
 *  Map, pola SAMA `BANK_JAGO`/`BANK_LEGENDARIS` di `games/wordmatch.ts`),
 *  kata lebih panjang/jarang dari BANK_SULIT & SENGAJA tidak tumpang tindih
 *  dgn bank Raja Kata (biar 2 game berasa beda meski sama-sama "kata
 *  susah"). */
const BANK_JAGO: BalloonWord[] = [
  { id: 'Pemadam Kebakaran', en: 'Firefighter' },
  { id: 'Bulan Sabit', en: 'Crescent' },
  { id: 'Terumbu Karang', en: 'Coral Reef' },
  { id: 'Petir', en: 'Lightning' },
  { id: 'Kompas', en: 'Compass' },
  { id: 'Ransel', en: 'Backpack' },
  { id: 'Bunglon', en: 'Chameleon' },
  { id: 'Papan Seluncur', en: 'Skateboard' },
  { id: 'Cerobong Asap', en: 'Chimney' },
  { id: 'Layang-layang', en: 'Kite' },
];

const BANK_LEGENDARIS: BalloonWord[] = [
  { id: 'Gedung Pencakar Langit', en: 'Skyscraper' },
  { id: 'Komet', en: 'Comet' },
  { id: 'Satelit', en: 'Satellite' },
  { id: 'Komidi Putar', en: 'Carousel' },
  { id: 'Akordeon', en: 'Accordion' },
  { id: 'Terompet', en: 'Trumpet' },
  { id: 'Mikroskop', en: 'Microscope' },
  { id: 'Kembang Api', en: 'Firework' },
  { id: 'Kincir Angin', en: 'Windmill' },
  { id: 'Labirin', en: 'Labyrinth' },
];

export interface DifficultyMeta {
  label: string;
  sub: string;
  /** Rentang detik 1 balon menempuh papan bawah→atas (dur makin besar =
   *  makin LAMBAT) — mudah paling besar, legendaris paling kecil. */
  durMin: number;
  durMax: number;
  swayMin: number;
  swayMax: number;
}

export const DIFFICULTY_META: Record<BalloonDifficulty, DifficultyMeta> = {
  mudah: { label: 'Mudah', sub: 'Balon pelan, kata pendek', durMin: 13, durMax: 17, swayMin: 3.2, swayMax: 4.2 },
  sedang: { label: 'Sedang', sub: 'Balon sedang, kata menengah', durMin: 10, durMax: 13, swayMin: 2.6, swayMax: 3.4 },
  sulit: { label: 'Sulit', sub: 'Balon lebih cepat, kata panjang', durMin: 7.5, durMax: 9.5, swayMin: 2, swayMax: 2.6 },
  jago: { label: 'Jago', sub: 'Balon makin cepat, kata makin jarang', durMin: 6, durMax: 8, swayMin: 1.6, swayMax: 2.2 },
  legendaris: { label: 'Legendaris', sub: 'Balon tercepat, kata paling langka', durMin: 5, durMax: 6.5, swayMin: 1.3, swayMax: 1.8 },
};

const BANK_BY_DIFFICULTY: Record<BalloonDifficulty, BalloonWord[]> = {
  mudah: BANK_MUDAH,
  sedang: BANK_SEDANG,
  sulit: BANK_SULIT,
  jago: BANK_JAGO,
  legendaris: BANK_LEGENDARIS,
};

const WORD_COUNT = 10;
const OPTION_COUNT = 4;
/** Posisi TENGAH tiap slot balon (persen, dipasangkan dgn `transform:
 *  translateX(-50%)` di CSS) — dijitter dikit di JS supaya tidak selalu
 *  presisi sama tiap ronde tapi tidak pernah bertabrakan/terlalu mepet tepi. */
const LANES = [15, 39, 62, 86];
/** Jeda mulai antar-balon (detik) — POSITIF & bertingkat per slot (bukan
 *  delay negatif acak spt versi awal) supaya SEMUA balon konsisten mulai
 *  dari bawah papan dalam urutan cascade, bukan langsung muncul di tengah
 *  udara begitu ronde dibuka (permintaan user). */
const SPAWN_STAGGER = 0.35;
const BALLOON_COLORS = ['#FF6F6F', '#4FC3E8', '#FFC24B', '#6FCF7A', '#B98CE8', '#FF8FB8'];

/** Duplikat lokal `roundActionsHtml` (konvensi app ini: helper generik
 *  diduplikasi per file game — lihat games/wordmatch.ts dst). */
function roundActionsHtml(isLast: boolean): string {
  return `
    <div class="round-actions">
      <button class="ghost-btn" type="button" data-action="tryAgainRound">🔁 Coba Lagi</button>
      <button class="primary-btn" type="button" data-action="nextRound" style="margin-top:0">${isLast ? 'Selesai ✅' : 'Lanjut ➡️'}</button>
    </div>`;
}

/** Opsional — dipasok `runBalloonPop()` (orkestrator Map Kerajaan Balon)
 *  supaya 1 markas tahu posisinya di tangga Mudah→Legendaris: `isLast`
 *  menentukan label tombol akhir ("Lanjut ➡️" vs "Selesai ✅"), `headerHtml`
 *  disisipkan PALING ATAS papan (strip status markas). Dibiarkan `undefined`
 *  kalau dipanggil tanpa konteks markas — `isLast` default `true` (pola
 *  SAMA PERSIS `RoundJourneyCtx` di `games/wordmatch.ts`). */
interface RoundJourneyCtx {
  isLast: boolean;
  headerHtml: string;
}

/** Mesin 1 markas/1 tingkat kesulitan — dulu bernama `runBalloonPop` &
 *  dipanggil langsung dari picker tingkat kesulitan (app.ts, SUDAH DIHAPUS
 *  lihat komentar file). Sekarang dipakai `runBalloonPop()` orkestrator di
 *  bawah (dipanggil 1× tiap markas ditap). */
function runBalloonPopRound(container: HTMLElement, difficulty: BalloonDifficulty, onDone: OnDone, level: LevelKey, journey?: RoundJourneyCtx): void {
  const bank = BANK_BY_DIFFICULTY[difficulty];
  const meta = DIFFICULTY_META[difficulty];
  let words: BalloonWord[] = shuffle(bank).slice(0, Math.min(WORD_COUNT, bank.length));
  let wordIndex = 0;
  let currentOptions: BalloonWord[] = [];
  let busy = false;
  let roundDone = false;

  function buildOptions(target: BalloonWord): BalloonWord[] {
    const distractors = shuffle(bank.filter((w) => w.en !== target.en)).slice(0, OPTION_COUNT - 1);
    return shuffle([target, ...distractors]);
  }

  function balloonHtml(opt: BalloonWord, i: number): string {
    const lane = LANES[i % LANES.length];
    const jitter = Math.random() * 8 - 4;
    const dur = (meta.durMin + Math.random() * (meta.durMax - meta.durMin)).toFixed(2);
    const delay = (i * SPAWN_STAGGER).toFixed(2);
    const sway = (meta.swayMin + Math.random() * (meta.swayMax - meta.swayMin)).toFixed(2);
    const bg = BALLOON_COLORS[Math.floor(Math.random() * BALLOON_COLORS.length)];
    return `
      <button class="bp-balloon" type="button" data-action="popBalloon" data-payload="${i}"
        style="--x:${(lane + jitter).toFixed(1)}%; --dur:${dur}s; --delay:${delay}s; --sway:${sway}s; --bg:${bg};"
        aria-label="${opt.en}">
        <span class="bp-balloon-body"><span class="bp-balloon-text">${opt.en}</span></span>
        <span class="bp-balloon-string" aria-hidden="true"></span>
      </button>`;
  }

  function paint(): void {
    const target = words[wordIndex];
    currentOptions = buildOptions(target);
    busy = false;
    container.innerHTML = `
      ${journey?.headerHtml ?? ''}
      <div class="bp-head"><span class="tag">${meta.label}</span><span class="tag">${wordIndex + 1}/${words.length} kata</span></div>
      <p class="bp-prompt">🎈 Letupkan balon: <b>&ldquo;${target.id}&rdquo;</b></p>
      <div class="bp-board">${currentOptions.map((opt, i) => balloonHtml(opt, i)).join('')}</div>
      <div class="feedback" id="fb"></div>
    `;
    setHandlers({ popBalloon: (payload) => onPop(Number(payload)) });
  }

  function onPop(i: number): void {
    if (busy || roundDone) return;
    const opt = currentOptions[i];
    const target = words[wordIndex];
    const btn = container.querySelector<HTMLButtonElement>(`.bp-balloon[data-payload="${i}"]`);
    const fb = container.querySelector<HTMLElement>('#fb');
    if (!opt) return;

    if (opt.en === target.en) {
      busy = true;
      btn?.classList.add('is-pop');
      btn?.setAttribute('disabled', 'true');
      recordAttempt(true);
      playCorrectTone();
      fireConfetti();
      if (fb) {
        fb.textContent = pickPraise(level);
        fb.className = 'feedback good';
      }
      setTimeout(() => {
        wordIndex += 1;
        if (wordIndex >= words.length) {
          roundDone = true;
          if (fb) {
            fb.insertAdjacentHTML('afterend', roundActionsHtml(journey?.isLast ?? true));
            setHandlers({
              tryAgainRound: () => {
                words = shuffle(bank).slice(0, Math.min(WORD_COUNT, bank.length));
                wordIndex = 0;
                roundDone = false;
                paint();
              },
              nextRound: () => onDone(),
            });
          }
        } else {
          paint();
        }
      }, 420);
    } else {
      recordAttempt(false);
      playTryAgainTone();
      btn?.classList.add('is-wrong');
      setTimeout(() => btn?.classList.remove('is-wrong'), 380);
      if (fb) {
        fb.textContent = pickEncourage(level);
        fb.className = 'feedback bad';
      }
    }
  }

  paint();
}

interface JourneyNode {
  difficulty: BalloonDifficulty;
  place: string;
  emoji: string;
  /** Baris sapaan singkat penjaga markas — flavor petualangan, TIDAK
   *  diucapkan TTS (pola SAMA `JourneyNode.guideLine` di `games/wordmatch.ts`). */
  guideLine: string;
}

/** 5 markas Map Kerajaan Balon ("jadikan konsepnya seperti Raja Kata"), urut
 *  Mudah→Sedang→Sulit→Jago→Legendaris — nama tempat cuma bungkus tema,
 *  `difficulty` di baliknya TETAP `BalloonDifficulty` asli (bank kata &
 *  kecepatan sama persis `DIFFICULTY_META`, tidak diduplikasi di sini). Nama
 *  SENGAJA beda dari `JOURNEY_NODES` Kerajaan Kata (Gerbang/Istana/
 *  Balairung/Menara/Ruang Harta) biar 2 game Raja tidak terasa ketuker di
 *  kepala anak, pola sama alasan "Balairung" vs "Throne Room". */
const JOURNEY_NODES: JourneyNode[] = [
  { difficulty: 'mudah', place: 'Taman Balon', emoji: '🎈', guideLine: 'Selamat datang di Taman Balon! Ayo letupkan balon kata pertama ini.' },
  { difficulty: 'sedang', place: 'Pasar Balon', emoji: '🎪', guideLine: 'Balonnya makin ramai di pasar ini! Cari kata yang pas sebelum melayang jauh.' },
  { difficulty: 'sulit', place: 'Awan Balon', emoji: '☁️', guideLine: 'Wah, sudah setinggi awan! Balonnya melaju lebih cepat dari sebelumnya.' },
  { difficulty: 'jago', place: 'Puncak Balon', emoji: '🏔️', guideLine: 'Ini puncak tertinggi! Kata-katanya makin jarang terdengar, tapi kamu pasti bisa.' },
  { difficulty: 'legendaris', place: 'Balon Emas', emoji: '🏆', guideLine: 'Selamat datang di Balon Emas terakhir! Buktikan kamu Jago Balon sejati.' },
];

/** Header dalam layar 1 markas (dipasok ke `runBalloonPopRound()` via
 *  `journey.headerHtml`) — pola SAMA PERSIS `games/wordmatch.ts` `nodeHeaderHtml()`. */
function nodeHeaderHtml(node: JourneyNode, foundCount: number, total: number): string {
  return `
    <div class="latihan-head">
      <span class="stage-badge">${node.emoji} ${node.place}</span>
      <span class="tag accent">🎈 ${foundCount}/${total}</span>
    </div>
    <p class="meta" style="margin-top:var(--s3)">📯 "${node.guideLine}"</p>`;
}

/**
 * Raja Balon — orkestrator penuh, SEKARANG entry point utama file ini
 * (dipanggil app.ts `runRajaRound`, TANPA picker tingkat kesulitan lagi —
 * lihat komentar di puncak file). **Konsep petualangan ala `games/
 * wordmatch.ts` `runWordMatch()`**: langsung buka **Map Kerajaan Balon**
 * (`renderMap()`, reuse PERSIS `.trail.raja-trail` — 5 markas besar berikon,
 * selang-seling kiri/kanan, markas ke-i cuma bisa dijelajah kalau markas
 * ke-(i-1) sudah PERNAH dikunjungi, non-punitive: BUKAN harus benar, cukup
 * pernah dicoba) → tap markas → 1 ronde `runBalloonPopRound()` di markas
 * itu → balik ke Map → markas berikutnya kebuka → markas ke-5 tuntas →
 * "Semua Balon Ditemukan!" → `onDone()`. State `visited` cuma hidup di
 * closure ini, TIDAK disimpan progress.ts/localStorage, konsisten semua
 * raja Game Hub lain.
 */
export function runBalloonPop(container: HTMLElement, onDone: OnDone, level: LevelKey): void {
  const total = JOURNEY_NODES.length;
  const visited = new Set<number>();

  function renderMap(): void {
    const stops = JOURNEY_NODES.map((node, i) => {
      const cleared = visited.has(i);
      // Akun tes dev ("124") lihat SEMUA markas terbuka — lihat account.ts isDevTestAccount().
      const unlocked = isDevTestAccount() || i === 0 || visited.has(i - 1);
      const action = unlocked
        ? `<button class="primary-btn" type="button" data-action="enterNode" data-payload="${i}">${cleared ? '🔁 Main Lagi' : '▶️ Jelajahi'}</button>`
        : `<button class="ghost-btn" type="button" disabled aria-disabled="true">🔒 Terkunci</button>`;
      const statusText = cleared ? 'Balon ditemukan 🎈' : unlocked ? 'Menunggu dijelajahi' : 'Masih tersegel';
      const meta = DIFFICULTY_META[node.difficulty];
      return `
      <li class="trail-stop ${i % 2 === 1 ? 'icon-right' : ''}" style="--band-deep:var(--sun-500)">
        <div class="raja-stop-inner">
          <span class="raja-icon" aria-hidden="true"><span class="mascot-idle" style="font-size:clamp(68px,17vw,92px);animation-delay:${(i * 0.15).toFixed(2)}s">${node.emoji}</span></span>
          <div class="trail-card">
            <span class="trail-place">🗺️ Kerajaan Balon</span>
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
        <p class="lede">🎈 <b>${visited.size} / ${total}</b> Balon ditemukan</p>
      </div>
      <ol class="trail raja-trail">${stops}</ol>`;
    setHandlers({ enterNode: (payload) => playStage(Number(payload)) });
  }

  function playStage(idx: number): void {
    const node = JOURNEY_NODES[idx];
    const isLast = idx === total - 1;
    runBalloonPopRound(
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
        <div class="sunburst lg mascot-pop" aria-hidden="true"><span class="face">🎈</span><span class="crown">🏆</span></div>
        <h2 class="win-banner">Semua Balon Ditemukan!</h2>
        <p class="done-sub">Kamu berhasil menjelajahi seluruh Kerajaan Balon & meletupkan semua balon!</p>
        <button class="primary-btn" type="button" data-action="finish">Selesai ✅</button>
      </div>`;
    setHandlers({ finish: () => onDone() });
  }

  renderMap();
}
