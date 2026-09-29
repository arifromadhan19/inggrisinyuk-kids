/**
 * Story Quest — Petualangan Cerita. Raja Game Hub, ditaruh TEPAT DI BAWAH
 * Sound Hunt (permintaan user "simpan di bawah game sound hunt", urutan
 * array `RAJA_LIST` di app.ts = urutan render `renderGame`). Fokus MURNI
 * Reading comprehension: baca 1 halaman cerita pendek lalu jawab 1
 * pertanyaan sederhana. Pola SAMA PERSIS raja lain (`games/wordmatch.ts`
 * dst): 1 file berdiri sendiri, cerita DATA-DRIVEN (`STORY_BOOKS` di bawah
 * — tambah cerita baru = tambah 1 entri array, TANPA sentuh logic/komponen
 * render sama sekali), TIDAK terikat topik/level Vocab manapun (generik
 * lintas level app, sama seperti raja lain).
 *
 * 🔒 **Revisi TOTAL (permintaan user "update game story quest dengan
 * konsep yang sama dengan game lain nya jadi ada sub list game, pemanasan,
 * mudah dan seterusnya")** — dulu file ini MVP "buku ajaib" (Magic
 * Library): 1 cerita lengkap ("The Lost Puppy", 5 halaman linear) + rak
 * 3 buku placeholder "🔒 Segera Hadir" (`UPCOMING_BOOKS`, sekadar sense of
 * progression tanpa konten beneran) — SATU-SATUNYA raja Game Hub yang
 * BELUM ikut pola Map Kerajaan 6-markas (Pemanasan→Legendaris) yang sudah
 * dipakai raja lain (`games/wordmatch.ts`/`balloonpop.ts`/
 * `sentencepuzzle.ts`/`memorymatch.ts`/`soundhunt.ts`). SEKARANG:
 * `UPCOMING_BOOKS`/`renderLibrary()` (rak buku placeholder) DIHAPUS TOTAL —
 * gantinya **Map Kerajaan Cerita 6-markas**, tiap markas = 1 cerita BERDIRI
 * SENDIRI (bukan lagi 1 cerita + rak kosong): `STORY_BOOKS` sekarang py 6
 * entri (`day-at-park`/Pemanasan BARU, `lost-puppy`/Mudah — cerita LAMA,
 * TIDAK diubah 1 kalimat pun, `missing-kite`/Sedang BARU,
 * `science-fair`/Sulit BARU, `mountain-rescue`/Jago BARU,
 * `time-capsule`/Legendaris BARU), tiap `StoryBook` dapat field BARU
 * `difficulty: WordMatchDifficulty` (reuse union yang SAMA dgn raja
 * lain, BUKAN bikin tipe baru). `runStoryQuest()` (nama EXPORT TETAP SAMA,
 * dipanggil `app.ts`) SEKARANG orkestrator penuh: **Map Kerajaan Cerita**
 * (`renderMap()`, grid `.raja-grid`/`.raja-card` — lihat riwayat desain
 * lengkap komponen ini di komentar `renderMap()` `games/wordmatch.ts`,
 * TIDAK diulang di sini) → tap markas → 1 cerita penuh via
 * `runStoryBookRound()` (dulu bernama `drawPage`+`renderComplete`, jadi
 * fungsi INTERNAL) → balik ke Map → markas ke-6 tuntas → "Semua Cerita
 * Selesai!" → `onDone()`. Mekanik BACA 1 CERITA ITU SENDIRI (halaman-demi-
 * halaman, TTS opt-in, hint, jawaban salah non-punitive TAPI cerita baru
 * lanjut halaman setelah jawaban BENAR) TIDAK berubah sama sekali — lihat
 * paragraf di bawah, itu SATU-SATUNYA bagian raja ini yang beda dari raja
 * lain (mekanik internalnya "baca halaman→jawab", bukan "cocokkan
 * pasangan"/dst), tapi BUNGKUSNYA (Map 6-markas, tag kesulitan, GAME_STAR_
 * FIELD, "Cara Main", footer standar, back-button popup hanya di halaman
 * mengerjakan) SEKARANG SAMA PERSIS raja lain.
 *
 * 🔒 TTS SENGAJA OPT-IN LEWAT TOMBOL, TIDAK PERNAH auto-play (beda dari
 * kebanyakan Kenalan skill lain) — CLAUDE.md eksplisit memperingatkan lensa
 * Reading "diucapkan TTS jadi diam-diam menguji Listening, bukan Reading".
 * "🔊 Dengar" tetap disediakan sbg bantuan opsional pembaca pemula, TIDAK
 * pernah otomatis berbunyi saat halaman dibuka.
 *
 * Jawaban SALAH tidak pernah dead-end (non-punitive, CLAUDE.md) — opsi yang
 * salah cuma dinonaktifkan SENDIRI (anak langsung bisa tap opsi lain tanpa
 * tombol "Coba Lagi" terpisah), "💡 Petunjuk" tersedia sejak awal (eliminasi
 * 2 opsi salah + bocorkan 1 kalimat penuntun, BUKAN jawabannya langsung).
 * Cerita SENGAJA baru lanjut ke halaman berikutnya setelah jawaban BENAR
 * (bukan "Lanjut selalu aktif apa pun hasilnya" spt raja lain) — comprehension
 * check di sini memang gerbang lembut alur inti fitur ini ("Read → Understand
 * → Choose → Continue the Adventure"), bukan sekadar catatan progres.
 *
 * 🔒 **Revisi 2026-09-29 (permintaan user "sesuai level ada pembeda & ada
 * beberapa soal di dalamnya")**: data pindah ke `storyquest-data.ts` (dicek
 * build). Tiap markas = 1 cerita 5 halaman (dulu 3–5), dan yang naik tiap
 * markas = JENIS pemahaman (tersurat → kata ganti → parafrase → simpulkan →
 * gabung beberapa kalimat), bentuk jawaban (gambar → gambar+teks → teks),
 * & bantuan (🔊 + coret opsi → sorot kalimat → 🔒 sampai 1x coba). Dulu
 * semua soal "cari fakta tertulis", 21/25 bisa dijawab dgn mencocokkan
 * kata, dan Petunjuk menyebut langsung kalimat ke berapa. Paragraf
 * "jawaban SALAH ... baru lanjut setelah BENAR" di atas SUDAH TIDAK
 * BERLAKU — sekarang pola Coba Lagi/Lanjut sama raja lain.
 *
 * State internal (markas mana yang sudah tuntas, halaman berapa yang lagi
 * dibaca) HANYA hidup selama 1 sesi main, direset tiap "▶️ Main"/"🔁 Main
 * Lagi" dari Game Hub — konsisten pola raja lain, TIDAK disimpan ke
 * progress.ts/localStorage lintas sesi (di luar scope MVP). `onDone()`
 * tetap menambah XP via app.ts sama seperti raja lain.
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
import type { LevelKey, OnDone } from '../types';
import { STORY_BOOKS, TIER_CONFIG, type AnswerStyle, type StoryBook, type StoryPage } from './storyquest-data';

/** `RajaKey` game ini — dikirim ke `recordAttempt()`, lihat komentar
 *  `GAME_KEY` `games/wordmatch.ts`. */
const GAME_KEY = 'storyquest';

const ANSWER_LETTERS = ['A', 'B', 'C', 'D'];

/** Kartu jawaban — bentuknya ikut tier (`TIER_CONFIG.answer`): gambar saja
 *  (Pemanasan, label cuma `aria-label`), gambar + teks (Mudah), atau teks
 *  saja dalam daftar 1 kolom (Sedang ke atas, jawaban berupa kalimat).
 *  `order` = urutan tampil (indeks opsi asli), diacak per halaman. */
function optionCardsHtml(page: StoryPage, order: number[], style: AnswerStyle, wrong: Set<number>, eliminated: Set<number>): string {
  const cards = order
    .map((oi, pos) => {
      const o = page.options[oi];
      const classes = ['opt-btn', 'answer-card'];
      if (wrong.has(oi)) classes.push('wrong');
      if (eliminated.has(oi)) classes.push('eliminated');
      const disabled = wrong.has(oi) || eliminated.has(oi) ? 'disabled' : '';
      const emoji = style !== 'text' && o.emoji ? `<span class="answer-card-emoji" aria-hidden="true">${picHtml(o.emoji)}</span>` : '';
      const label = style !== 'picture' ? `<span class="answer-card-label">${o.text}</span>` : '';
      return `
      <button class="${classes.join(' ')}" type="button" data-action="pick" data-payload="${oi}" aria-label="${o.text}" ${disabled}>
        ${emoji}
        <span class="answer-card-bottom">
          ${label}
          <span class="answer-card-badge" aria-hidden="true">${ANSWER_LETTERS[pos] ?? pos + 1}</span>
        </span>
      </button>`;
    })
    .join('');
  return `<div class="opt-grid${style === 'text' ? ' sq-list' : ''}">${cards}</div>`;
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

function lockAllOptions(container: HTMLElement): void {
  container.querySelectorAll<HTMLButtonElement>('.opt-btn').forEach((b) => (b.disabled = true));
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

/** Opsional — dipasok `runStoryQuest()` (orkestrator Map Kerajaan Cerita)
 *  supaya 1 markas tahu posisinya, pola SAMA PERSIS `RoundJourneyCtx`
 *  `games/wordmatch.ts`. */
interface RoundJourneyCtx {
  isLast: boolean;
  headerHtml: string;
}

/** Header dalam layar 1 markas (dipasok ke `runStoryBookRound()` via
 *  `journey.headerHtml`) — pola SAMA PERSIS `games/wordmatch.ts`
 *  `nodeHeaderHtml()`, `book.subtitle` dipakai LANGSUNG sbg "guideLine"
 *  (lihat komentar `StoryBook.subtitle`). */
function bookHeaderHtml(book: StoryBook, doneCount: number, total: number): string {
  return `
    <div class="latihan-head">
      <span class="stage-badge">${book.coverEmoji} ${book.title}</span>
      <span class="tag accent">📖 ${doneCount}/${total}</span>
    </div>
    <p class="meta" style="margin-top:var(--s3)">📯 "${book.subtitle}"</p>`;
}

/** Mesin 1 markas — baca 1 cerita penuh, 1 halaman = 1 soal (5 soal per
 *  markas). Bentuk jawaban, 🔊 Dengar & 💡 Petunjuk ikut `TIER_CONFIG`
 *  (`storyquest-data.ts`). Jawaban salah = pola raja lain: merah + getar +
 *  tetot, lalu "🔁 Coba Lagi" (halaman sama, Petunjuk yang sudah terbuka
 *  tetap) / "Lanjut ➡️" (non-punitive, halaman salah tetap boleh dilewati) —
 *  dulu opsi salah cuma dinonaktifkan sampai anak menemukan jawabannya
 *  (bisa ditebak dgn mengetuk satu per satu). */
function runStoryBookRound(container: HTMLElement, book: StoryBook, onDone: OnDone, level: LevelKey, journey?: RoundJourneyCtx): void {
  const total = book.pages.length;
  const cfg = TIER_CONFIG[book.difficulty];

  function drawPage(idx: number): void {
    const page = book.pages[idx];
    const order = shuffle(page.options.map((_, i) => i));
    const wrong = new Set<number>();
    const eliminated = new Set<number>();
    // Petunjuk & status "sudah mencoba" bertahan saat "Coba Lagi" (halaman
    // sama), direset hanya saat pindah halaman (`drawPage`).
    let hintUsed = false;
    let attempted = false;
    let answered = false;

    function dotsHtml(): string {
      const dots = book.pages
        .map((_, i) => {
          const done = i < idx || (i === idx && answered);
          const cls = [done ? 'done' : '', i === idx ? 'current' : ''].filter(Boolean).join(' ');
          return `<span class="quiz-dot static ${cls}" aria-hidden="true">${done ? '✓' : i + 1}</span>`;
        })
        .join('');
      return `<div class="quiz-nav"><div class="quiz-dots">${dots}</div></div>`;
    }

    function hintButtonHtml(): string {
      if (answered || hintUsed) return '';
      if (cfg.hintGated && !attempted) return `<button class="speak-btn-ghost" type="button" disabled aria-disabled="true">🔒 Petunjuk</button>`;
      return `<button class="speak-btn-ghost" type="button" data-action="hint"><span class="hint-bulb">💡</span> Petunjuk</button>`;
    }

    function paint(): void {
      const lines = page.lines
        .map((l, i) => `<p class="story-line${hintUsed && page.evidence.includes(i) ? ' is-evidence' : ''}">${l}</p>`)
        .join('');
      const listenBtn = cfg.listen ? `<button class="speak-btn-ghost" type="button" data-action="listen">🔊 Dengar</button>` : '';
      container.innerHTML = `
        ${journey?.headerHtml ?? ''}
        <div class="latihan-head">
          <span class="stage-badge">📖 ${page.title}</span>
          <span class="tag accent">Halaman ${idx + 1}/${total}</span>
        </div>
        ${dotsHtml()}
        <div class="story-page story-page-enter">
          <div class="story-scene" aria-hidden="true"><span>${picHtml(page.sceneEmoji)}</span></div>
          ${lines}
        </div>
        <div class="speak-row">${listenBtn}${hintButtonHtml()}</div>
        ${hintUsed ? `<p class="meta story-clue">💭 ${page.clue}</p>` : ''}
        <div class="story-divider" aria-hidden="true">✨ · · · ✨</div>
        <p class="sh-badge">${cfg.badge}</p>
        <p class="story-question">${page.question}</p>
        ${optionCardsHtml(page, order, cfg.answer, wrong, eliminated)}
        <div class="feedback" id="fb"></div>
      `;
      setHandlers({
        listen: () => speak([...page.lines, page.question].join(' ')),
        hint: () => {
          if (hintUsed) return;
          hintUsed = true;
          if (cfg.eliminate) {
            const untried = page.options.map((_, i) => i).filter((i) => i !== page.answer && !wrong.has(i));
            shuffle(untried)
              .slice(0, 2)
              .forEach((i) => eliminated.add(i));
          }
          paint();
        },
        pick: (payload) => onPick(Number(payload)),
      });
    }

    function onPick(i: number): void {
      if (answered) return;
      const correct = i === page.answer;
      recordAttempt(correct, GAME_KEY);
      answered = true;
      attempted = true;
      if (!correct) wrong.add(i);
      paint();
      lockAllOptions(container);
      const fb = container.querySelector<HTMLElement>('#fb')!;
      const btn = container.querySelector<HTMLButtonElement>(`.opt-btn[data-payload="${i}"]`);
      if (correct) {
        btn?.classList.add('correct', 'win-burst');
        playCorrectTone();
        fireConfetti();
        fb.textContent = pickPraise(level);
        fb.className = 'feedback good';
      } else {
        playWrongTone();
        vibrateDevice(160);
        fb.textContent = pickEncourage(level);
        fb.className = 'feedback bad';
      }
      const isLastPage = idx === total - 1;
      fb.insertAdjacentHTML('afterend', roundActionsHtml(isLastPage && (journey?.isLast ?? true)));
      setHandlers({
        tryAgainRound: () => {
          answered = false;
          wrong.clear();
          paint();
        },
        nextRound: () => (isLastPage ? onDone() : drawPage(idx + 1)),
      });
    }

    paint();
  }

  drawPage(0);
}

/**
 * Story Quest — orkestrator penuh (dipanggil `app.ts runRajaRound`), pola
 * SAMA PERSIS `games/wordmatch.ts` `runWordMatch()` — Map Kerajaan Cerita
 * 6-markas → tap markas → 1 cerita penuh via `runStoryBookRound()` →
 * balik ke Map → markas ke-6 tuntas → "Semua Cerita Selesai!" →
 * `onDone()`. State `visited` cuma hidup di closure ini, TIDAK disimpan
 * progress.ts/localStorage, konsisten semua raja Game Hub lain.
 */
export function runStoryQuest(container: HTMLElement, onDone: OnDone, level: LevelKey): void {
  const total = STORY_BOOKS.length;
  const visited = new Set<number>();

  function renderMap(): void {
    // 🔒 Back dari layar Map TIDAK perlu pop up konfirmasi lagi (permintaan
    // user) — lihat komentar `isGameRoundActive` `interaction.ts`.
    setGameRoundActive(false);
    const stops = STORY_BOOKS.map((book, i) => {
      const cleared = visited.has(i);
      // Akun tes dev ("124") lihat SEMUA markas terbuka — lihat account.ts isDevTestAccount().
      const unlocked = isDevTestAccount() || i === 0 || visited.has(i - 1);
      const stateClass = cleared ? 'is-cleared' : unlocked ? 'is-open' : 'is-locked';
      const pct = cleared ? 100 : 0;
      const badge = `<span class="skill-pct${pct >= 100 ? ' done' : ''}">${pct}%</span>`;
      const meta = TIER_CONFIG[book.difficulty];
      return `
      <button class="raja-card terrain-card ${stateClass}" type="button" data-action="enterNode" data-payload="${i}" ${unlocked ? '' : 'disabled aria-disabled="true"'} style="--band-deep:var(--brand-500)">
        ${badge}
        <span class="raja-card-icon" aria-hidden="true"><span class="mascot-idle" style="font-size:clamp(52px,14vw,68px);animation-delay:${(i * 0.15).toFixed(2)}s">${book.coverEmoji}</span></span>
        <h3>${book.title}</h3>
        <span class="tag diff-${book.difficulty}">${meta.label}</span>
      </button>`;
    }).join('');

    // 🔒 `current` = markas berikutnya yang belum ditaklukkan (posisi anak
    // sekarang), permintaan user "beri pembeda di progress yang sedang
    // disinggahi" — lihat komentar `.game-progress-dot.current` styles.css.
    const nextIdx = STORY_BOOKS.findIndex((_, i) => !visited.has(i));
    const dots = STORY_BOOKS.map((_, i) => {
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
          'Baca tiap halaman cerita pelan-pelan',
          'Jawab pertanyaan di bawahnya (tiap markas 5 halaman)',
          'Makin jauh markasnya, pertanyaannya makin butuh berpikir',
          'Taklukkan markas satu per satu sampai tuntas!',
        ])}
      </div>`;
    setHandlers({ enterNode: (payload) => playStage(Number(payload)) });
  }

  function playStage(idx: number): void {
    setGameRoundActive(true, renderMap); // masuk markas = "halaman mengerjakan", popup keluar aktif lagi; keluar = balik ke Map
    const book = STORY_BOOKS[idx];
    const isLast = idx === total - 1;
    runStoryBookRound(
      container,
      book,
      () => {
        visited.add(idx);
        if (visited.size >= total) renderMissionComplete();
        else renderMap();
      },
      level,
      { isLast, headerHtml: bookHeaderHtml(book, visited.size, total) }
    );
  }

  function renderMissionComplete(): void {
    setGameRoundActive(false); // layar selesai, tidak ada progres yang bisa hilang
    container.innerHTML = `
      <div class="done-wrap win">
        <div class="sunburst lg mascot-pop" aria-hidden="true"><span class="face">📖</span><span class="crown">✨</span></div>
        <h2 class="win-banner">Semua Cerita Selesai!</h2>
        <p class="done-sub">Kamu berhasil menjelajahi seluruh Kerajaan Cerita & menamatkan semua kisahnya!</p>
        <button class="primary-btn" type="button" data-action="finish">Selesai ✅</button>
      </div>`;
    setHandlers({ finish: () => onDone() });
  }

  renderMap();
}
