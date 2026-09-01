/**
 * Sound Hunt — Misi Pemburu Suara. Raja Game Hub ke-6 (app.ts RAJA_LIST,
 * ditaruh persis di bawah Raja Ingatan — permintaan user), fokus MURNI
 * Listening: dengar 1 instruksi Bahasa Inggris lalu tunjuk gambar yang
 * cocok dari 4 kartu. Dibungkus tema "petualangan cari Sound Crystal di
 * Hutan Ajaib" (Forest Map dgn 6 markas berurutan, tiap markas = 1 level)
 * supaya terasa game, bukan kuis — pola SAMA PERSIS raja lain
 * (`games/wordmatch.ts`/`games/balloonpop.ts`/`games/memorymatch.ts`): 1
 * file berdiri sendiri, bank soal DATA-DRIVEN sendiri (`SOUND_HUNT_LEVELS`
 * di bawah, tambah level baru = tambah 1 entri array, TANPA sentuh logic),
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
 * Non-punitive (CLAUDE.md): tap "Lanjut" SELALU membuka markas berikutnya
 * apa pun hasil jawabannya — Sound Crystal 💎 cuma didapat kalau BENAR,
 * tapi jawaban salah TIDAK PERNAH mengunci/menahan anak di 1 markas.
 */
import { isDevTestAccount } from '../account';
import { setGameRoundActive, setHandlers } from '../interaction';
import { recordAttempt } from '../progress';
import { speak, speakLocalized, playCorrectTone, playTryAgainTone } from '../speech';
import { pickPraise, pickEncourage } from '../praise';
import { fireConfetti } from '../confetti';
import { GAME_STAR_FIELD } from '../scenery';
import type { LevelKey, OnDone, WordMatchDifficulty } from '../types';

/** `RajaKey` game ini — dikirim ke `recordAttempt()`, lihat komentar
 *  `GAME_KEY` `games/wordmatch.ts`. */
const GAME_KEY = 'soundhunt';

/** Label tag kesulitan (`.tag.diff-*`, `public/styles.css`) — duplikat
 *  lokal ringan (cuma label, bukan bank/pairCount penuh spt
 *  `DIFFICULTY_META` game lain, krn Sound Hunt kontennya per-markas
 *  data-driven sendiri, bukan digenerate dari 1 bank+meta). */
const DIFFICULTY_LABEL: Record<WordMatchDifficulty, string> = {
  pemanasan: 'Pemanasan',
  mudah: 'Mudah',
  sedang: 'Sedang',
  sulit: 'Sulit',
  jago: 'Jago',
  legendaris: 'Legendaris',
};

export interface SoundHuntOption {
  id: string;
  emoji: string;
  label: string;
  correct: boolean;
  /** Swatch warna opsional di belakang emoji — mis. bedakan "blue star" vs
   *  "yellow star" (emoji bintang sama persis, warna jadi satu-satunya
   *  pembeda visual, pola sama filter kid-friendly "iconAmbiguous"). */
  tint?: string;
  /** Skala ukuran opsional — level "small cat vs big cat", ukuran ITU
   *  SENDIRI bagian dari soal, bukan sekadar dekorasi. */
  size?: 'sm' | 'lg';
}

export interface SoundHuntLevel {
  node: string;
  nodeEmoji: string;
  /** Tag kesulitan markas ini (BARU, lihat komentar puncak file) — SATU-
   *  SATUNYA pemakaian union `WordMatchDifficulty` di luar game bank+meta,
   *  murni label tampilan (`DIFFICULTY_LABEL`), tidak mengatur bank/skala
   *  apa pun spt di game lain krn tiap markas di sini SUDAH ditulis manual
   *  1-1 (bukan digenerate). */
  difficulty: WordMatchDifficulty;
  /** Kalimat instruksi Inggris — diputar via TTS, TIDAK PERNAH ditampilkan
   *  sbg teks kecuali anak tap 💡 Petunjuk (audio jadi sumber utama). */
  instruction: string;
  instructionId: string;
  guideLine: string;
  options: SoundHuntOption[];
}

/** 6 markas Hutan Ajaib (MVP, CEFR A1 — markas ke-0 `pemanasan` BARU,
 *  permintaan user "tambahkan 1 sehingga ada 6"). Data-driven: tambah
 *  level baru = tambah 1 entri di sini. */
export const SOUND_HUNT_LEVELS: SoundHuntLevel[] = [
  {
    node: 'Village Edge',
    nodeEmoji: '🏡',
    difficulty: 'pemanasan',
    instruction: 'Find the dog.',
    instructionId: 'Temukan anjingnya.',
    guideLine: 'Yuk pemanasan dulu di tepi desa sebelum masuk hutan!',
    options: [
      { id: 'dog', emoji: '🐶', label: 'Dog', correct: true },
      { id: 'cat', emoji: '🐱', label: 'Cat', correct: false },
      { id: 'bird', emoji: '🐦', label: 'Bird', correct: false },
      { id: 'fish', emoji: '🐟', label: 'Fish', correct: false },
    ],
  },
  {
    node: 'Forest Entrance',
    nodeEmoji: '🌲',
    difficulty: 'mudah',
    instruction: 'Find the elephant.',
    instructionId: 'Temukan gajahnya.',
    guideLine: 'Selamat datang di gerbang hutan! Dengarkan baik-baik, ya.',
    options: [
      { id: 'elephant', emoji: '🐘', label: 'Elephant', correct: true },
      { id: 'lion', emoji: '🦁', label: 'Lion', correct: false },
      { id: 'monkey', emoji: '🐵', label: 'Monkey', correct: false },
      { id: 'tiger', emoji: '🐯', label: 'Tiger', correct: false },
    ],
  },
  {
    node: 'Whispering Woods',
    nodeEmoji: '🌳',
    difficulty: 'sedang',
    instruction: 'Find the red apple.',
    instructionId: 'Temukan apel merahnya.',
    guideLine: 'Pohon-pohon di sini suka berbisik... coba dengar apa katanya!',
    options: [
      { id: 'red-apple', emoji: '🍎', label: 'Red Apple', correct: true },
      { id: 'green-apple', emoji: '🍏', label: 'Green Apple', correct: false },
      { id: 'banana', emoji: '🍌', label: 'Banana', correct: false },
      { id: 'orange', emoji: '🍊', label: 'Orange', correct: false },
    ],
  },
  {
    node: 'Mushroom Garden',
    nodeEmoji: '🍄',
    difficulty: 'sulit',
    instruction: 'Touch the blue star.',
    instructionId: 'Sentuh bintang birunya.',
    guideLine: 'Taman jamur ini penuh warna-warni ajaib, lho!',
    options: [
      { id: 'blue-star', emoji: '⭐', label: 'Blue Star', correct: true, tint: '#4DABF7' },
      { id: 'yellow-star', emoji: '⭐', label: 'Yellow Star', correct: false, tint: '#FFD43B' },
      { id: 'red-heart', emoji: '❤️', label: 'Red Heart', correct: false },
      { id: 'moon', emoji: '🌙', label: 'Moon', correct: false },
    ],
  },
  {
    node: 'Crystal Cave',
    nodeEmoji: '💎',
    difficulty: 'jago',
    instruction: 'Find the small cat.',
    instructionId: 'Temukan kucing kecilnya.',
    guideLine: 'Gua ini gelap berkilau... awas, banyak hewan lucu bersembunyi!',
    options: [
      { id: 'small-cat', emoji: '🐱', label: 'Small Cat', correct: true, size: 'sm' },
      { id: 'big-cat', emoji: '🐱', label: 'Big Cat', correct: false, size: 'lg' },
      { id: 'small-dog', emoji: '🐶', label: 'Small Dog', correct: false, size: 'sm' },
      { id: 'big-elephant', emoji: '🐘', label: 'Big Elephant', correct: false, size: 'lg' },
    ],
  },
  {
    node: 'Castle Gate',
    nodeEmoji: '🏰',
    difficulty: 'legendaris',
    instruction: 'Find the rabbit.',
    instructionId: 'Temukan kelincinya.',
    guideLine: 'Hampir sampai gerbang istana Raja! Satu Sound Crystal lagi...',
    options: [
      { id: 'rabbit', emoji: '🐰', label: 'Rabbit', correct: true },
      { id: 'dog', emoji: '🐶', label: 'Dog', correct: false },
      { id: 'cat', emoji: '🐱', label: 'Cat', correct: false },
      { id: 'mouse', emoji: '🐭', label: 'Mouse', correct: false },
    ],
  },
];

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

/** Kartu jawaban gambar+teks (`.opt-btn.answer-card`, sama komponen dgn
 *  Listening/Reading dst) — `tint`/`size` opsional per opsi jadi satu-
 *  satunya pembeda visual utk soal warna/ukuran (lihat komentar interface
 *  di atas), lewat inline style supaya tidak perlu CSS baru. */
function optionCardsHtml(options: SoundHuntOption[]): string {
  return `<div class="opt-grid">
    ${options
      .map((o, i) => {
        const style = [
          o.tint ? `background:${o.tint};border-radius:50%;width:38px;height:38px;display:grid;place-items:center;` : '',
          o.size === 'sm' ? 'font-size:20px;' : '',
          o.size === 'lg' ? 'font-size:40px;' : '',
        ]
          .filter(Boolean)
          .join('');
        return `
      <button class="opt-btn answer-card" type="button" data-action="pick" data-payload="${i}">
        <span class="answer-card-emoji" ${style ? `style="${style}"` : ''} aria-hidden="true">${o.emoji}</span>
        <span class="answer-card-bottom">
          <span class="answer-card-label">${o.label}</span>
          <span class="answer-card-badge" aria-hidden="true">${ANSWER_LETTERS[i] ?? i + 1}</span>
        </span>
      </button>`;
      })
      .join('')}
  </div>`;
}

export function runSoundHunt(container: HTMLElement, onDone: OnDone, level: LevelKey): void {
  const total = SOUND_HUNT_LEVELS.length;
  const visited = new Set<number>();
  const crystals = new Set<number>();

  /** Forest Map — grid `.raja-grid`/`.raja-card`, SAMA PERSIS roster `/game`
   *  (permintaan user "jadikan 1 card an seperti di halaman game dimana 1
   *  row jadi 2 card" — riwayat desain lengkap: komentar `renderMap()`
   *  `games/wordmatch.ts`). 🔒 SEKARANG layar PERTAMA yang tampil (Welcome
   *  screen "🚀 Mulai Petualangan", `renderWelcome()`, SUDAH DIHAPUS TOTAL —
   *  permintaan user "hilangkan halaman mulai petualang... langsung sub
   *  list game per level", pola SAMA `games/wordmatch.ts` yang jg TANPA
   *  Welcome screen terpisah). Markas ke-i cuma bisa dijelajah kalau markas
   *  ke-(i-1) sudah PERNAH dikunjungi (bukan harus benar — non-punitive),
   *  markas yang belum terjangkau tampil terkunci (`disabled`+redup). Beda
   *  dari Kata/Balon: badge di sini pakai `cleared` (crystal DIDAPAT), BUKAN
   *  `wasVisited` (pernah dikunjungi TANPA dapat crystal-nya — jawaban salah
   *  tetap boleh lanjut, non-punitive) — markas yang pernah dikunjungi tapi
   *  belum dapat crystal TETAP dianggap "is-open" (dapat halo, boleh
   *  diulang), bukan "is-cleared". 🔒 Kartu jg dapat `map-card` ("lebih kids
   *  friendly seperti sebelumnya", analisis giggleacademy.com/learning-course
   *  — rona warna Raja lembut GANTI putih polos, lihat komentar `.map-card`
   *  `public/styles.css`); 🔒 SEKARANG jg py tag kesulitan (`diff-${lvl.
   *  difficulty}`, permintaan user "levelnya ada pemanasan, mudah, sedang,
   *  sulit, jago, legendaris" — dulu Sound Hunt SATU-SATUNYA raja
   *  bertingkat tanpa tag ini, lihat komentar puncak file). */
  function renderMap(): void {
    // 🔒 Back dari layar Map TIDAK perlu pop up konfirmasi lagi (permintaan
    // user) — lihat komentar `isGameRoundActive` `interaction.ts`.
    setGameRoundActive(false);
    const stops = SOUND_HUNT_LEVELS.map((lvl, i) => {
      const cleared = crystals.has(i);
      // Akun tes dev ("124") lihat SEMUA markas terbuka — lihat account.ts isDevTestAccount().
      const unlocked = isDevTestAccount() || i === 0 || visited.has(i - 1);
      const stateClass = cleared ? 'is-cleared' : unlocked ? 'is-open' : 'is-locked';
      // 🔒 Badge kunci/centang (ikon) DIGANTI persentase — pola SAMA PERSIS
      // `games/wordmatch.ts` `renderMap()` (permintaan user "tambahkan
      // percentage di setiap card"), lihat komentar lengkap di sana.
      const pct = cleared ? 100 : 0;
      const badge = `<span class="skill-pct${pct >= 100 ? ' done' : ''}">${pct}%</span>`;
      return `
      <button class="raja-card map-card ${stateClass}" type="button" data-action="enterNode" data-payload="${i}" ${unlocked ? '' : 'disabled aria-disabled="true"'} style="--band-deep:var(--c-read)">
        ${badge}
        <span class="raja-card-icon" aria-hidden="true"><span class="mascot-idle" style="font-size:clamp(52px,14vw,68px);animation-delay:${(i * 0.15).toFixed(2)}s">${lvl.nodeEmoji}</span></span>
        <h3>${lvl.node}</h3>
        <span class="tag diff-${lvl.difficulty}">${DIFFICULTY_LABEL[lvl.difficulty]}</span>
      </button>`;
    }).join('');

    const dots = SOUND_HUNT_LEVELS.map((_, i) => {
      const done = crystals.has(i);
      return `<span class="game-progress-dot${done ? ' done' : ''}" aria-hidden="true">${done ? '✓' : ''}</span>`;
    }).join('');

    container.innerHTML = `
      <div class="raja-map-wrap">
        ${GAME_STAR_FIELD}
        <div class="card game-progress-card">
          <h2>Taklukkan markas satu per satu, ya!</h2>
          <div class="game-progress-dots">${dots}<span class="game-progress-label">Selesai ${crystals.size} dari ${total}</span></div>
        </div>
        <div class="raja-grid">${stops}</div>
        ${gameHowToHtml([
          'Dengar instruksi Bahasa Inggrisnya',
          'Tap gambar yang sesuai',
          'Sound Crystal muncul kalau jawabannya tepat',
          'Taklukkan markas satu per satu sampai tuntas!',
        ])}
      </div>`;
    setHandlers({ enterNode: (payload) => drawLevel(Number(payload)) });
  }

  function drawLevel(idx: number): void {
    setGameRoundActive(true); // masuk markas = "halaman mengerjakan", popup keluar aktif lagi
    const lvl = SOUND_HUNT_LEVELS[idx];
    let revealed = false;
    const play = () => speak(lvl.instruction);

    function paint(): void {
      container.innerHTML = `
        <div class="latihan-head">
          <span class="stage-badge">${lvl.nodeEmoji} ${lvl.node}</span>
          <span class="tag accent" id="shCrystalTag">💎 ${crystals.size}/${total}</span>
        </div>
        <p class="meta" style="margin-top:var(--s3)">🧙‍♂️ "${lvl.guideLine}"</p>
        <div class="speak-row">
          <button class="speak-btn pt-cta" type="button" data-action="listen">🔊 Dengar</button>
          <button class="speak-btn-ghost" type="button" data-action="hint">💡 Petunjuk</button>
        </div>
        ${revealed ? `<div class="en-text">${lvl.instruction}</div><div class="id-text">${lvl.instructionId}</div>` : ''}
        ${optionCardsHtml(lvl.options)}
        <div class="feedback" id="fb"></div>`;
      setHandlers({
        listen: play,
        hint: () => {
          revealed = true;
          play();
          setTimeout(() => speakLocalized(lvl.instructionId, 'id-ID'), 1500);
          paint();
        },
        pick: (payload) => onPick(Number(payload)),
      });
    }

    function onPick(i: number): void {
      const opt = lvl.options[i];
      const btn = container.querySelectorAll<HTMLButtonElement>('.opt-btn')[i];
      const fb = container.querySelector<HTMLElement>('#fb')!;
      lockOptionButtons(container);
      recordAttempt(opt.correct, GAME_KEY);

      if (opt.correct) {
        btn.classList.add('correct', 'win-burst');
        crystals.add(idx);
        const crystalTag = container.querySelector<HTMLElement>('#shCrystalTag');
        if (crystalTag) crystalTag.textContent = `💎 ${crystals.size}/${total}`;
        playCorrectTone();
        fireConfetti();
        fb.textContent = pickPraise(level);
        fb.className = 'feedback good';
      } else {
        btn.classList.add('wrong');
        playTryAgainTone();
        fb.textContent = pickEncourage(level);
        fb.className = 'feedback bad';
      }

      fb.insertAdjacentHTML('afterend', roundActionsHtml(idx === total - 1));
      setHandlers({
        tryAgainRound: () => {
          revealed = false;
          paint();
          play();
        },
        nextRound: () => {
          visited.add(idx);
          if (visited.size >= total) renderMissionComplete();
          else renderMap();
        },
      });
    }

    paint();
    play();
  }

  function renderMissionComplete(): void {
    setGameRoundActive(false); // layar selesai, tidak ada progres yang bisa hilang
    container.innerHTML = `
      <div class="done-wrap win">
        <div class="sunburst lg mascot-pop" aria-hidden="true"><span class="face">💎</span><span class="crown">✨</span></div>
        <h2 class="win-banner">Misi Hutan Selesai!</h2>
        <p class="done-sub">"Hebaaat! Kamu menemukan ${crystals.size} dari ${total} Sound Crystal." — Penjaga Hutan</p>
        <p class="done-sub">👑 Raja akan sangat senang! <span class="tag ok">🏆 Sound Hunter Badge</span></p>
        <button class="primary-btn" type="button" data-action="continueAdventure">Continue Adventure ➡️</button>
      </div>`;
    setHandlers({ continueAdventure: () => onDone() });
  }

  renderMap();
}
