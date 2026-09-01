/**
 * Story Quest — Petualangan Cerita. Raja Game Hub, ditaruh TEPAT DI BAWAH
 * Sound Hunt (permintaan user "simpan di bawah game sound hunt", urutan
 * array `RAJA_LIST` di app.ts = urutan render `renderGame`). Fokus MURNI
 * Reading comprehension: baca 1 halaman cerita pendek lalu jawab 1
 * pertanyaan sederhana — dibungkus tema "buku ajaib" (Magic Library, buku
 * lain sengaja "Segera Hadir" sbg sense of progression) supaya terasa
 * interactive storybook, BUKAN kuis 10-soal-sekaligus. Pola SAMA PERSIS
 * raja lain (`games/soundhunt.ts` dst): 1 file berdiri sendiri, cerita
 * DATA-DRIVEN (`STORY_BOOKS` di bawah — tambah cerita baru = tambah 1
 * entri array + pindahkan judulnya keluar dari `UPCOMING_BOOKS`, TANPA
 * sentuh logic/komponen render sama sekali), TIDAK terikat topik/level
 * Vocab manapun (generik lintas level app, sama seperti raja lain).
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
 * State internal (halaman berapa, buku mana yang lagi dibaca) HANYA hidup
 * selama 1 sesi main, direset tiap "▶️ Main"/"🔁 Main Lagi" dari Game Hub —
 * konsisten pola raja lain, TIDAK disimpan ke progress.ts/localStorage
 * lintas sesi (di luar scope MVP). `onDone()` tetap menambah XP via app.ts
 * sama seperti raja lain — MVP baru py 1 buku penuh ("The Lost Puppy").
 */
import { setHandlers } from '../interaction';
import { recordAttempt } from '../progress';
import { speak, playCorrectTone, playTryAgainTone } from '../speech';
import { pickPraise, pickEncourage } from '../praise';
import { fireConfetti } from '../confetti';
import { shuffle } from '../util';
import type { LevelKey, OnDone } from '../types';

export interface StoryOption {
  emoji: string;
  text: string;
}

export interface StoryPage {
  title: string;
  sceneEmoji: string;
  /** Kalimat cerita, dirender 1 baris per kalimat (bukan 1 paragraf padat)
   *  supaya terasa halaman buku, bukan blok teks ujian. */
  lines: string[];
  question: string;
  options: StoryOption[];
  correctIndex: number;
  /** Kalimat penuntun singkat diungkap lewat "💡 Petunjuk" — BUKAN jawaban
   *  langsung, cuma mengarahkan anak baca ulang bagian yang relevan. */
  clue: string;
}

export interface StoryBook {
  id: string;
  title: string;
  subtitle: string;
  coverEmoji: string;
  level: string;
  pages: StoryPage[];
}

/** MVP: 1 cerita lengkap, 5 halaman (Beginning → Discovery → Problem →
 *  Adventure → Happy Ending, CLAUDE.md storytelling arc). Bahasa Inggris
 *  A1: kalimat pendek, kosakata umum. Tiap halaman menguji comprehension
 *  BEDA (tempat/benda/isi-teks/tokoh/emosi) — bukan 1 pola soal diulang. */
export const STORY_BOOKS: StoryBook[] = [
  {
    id: 'lost-puppy',
    title: 'The Lost Puppy',
    subtitle: 'Bantu Tom menemukan pemilik anak anjing itu!',
    coverEmoji: '🐶',
    level: 'A1',
    pages: [
      {
        title: 'The Village',
        sceneEmoji: '🌉',
        lines: ['Tom lives in a small village.', 'One sunny morning, he walks to the square.', 'Near an old bridge, he sees something small and brown.'],
        question: 'Where does Tom see the puppy?',
        options: [
          { emoji: '🌲', text: 'In the forest' },
          { emoji: '🌉', text: 'Near the bridge' },
          { emoji: '🏰', text: 'In the castle' },
          { emoji: '🏫', text: 'At school' },
        ],
        correctIndex: 1,
        clue: 'Baca ulang kalimat terakhir — di dekat apa Tom berdiri?',
      },
      {
        title: 'The Puppy',
        sceneEmoji: '🐶',
        lines: ['The puppy looks very scared.', 'Tom sits down and gives it some water.', 'Then he notices a red collar around its neck.'],
        question: 'What does Tom see on the puppy?',
        options: [
          { emoji: '🎩', text: 'A blue hat' },
          { emoji: '🔴', text: 'A red collar' },
          { emoji: '🎒', text: 'A big bag' },
          { emoji: '📕', text: 'A yellow book' },
        ],
        correctIndex: 1,
        clue: 'Coba dengar lagi — apa warna benda di leher anak anjing itu?',
      },
      {
        title: 'A Little Mystery',
        sceneEmoji: '🏷️',
        lines: ['The collar has a small silver tag.', 'Tom reads a name and a phone number on it.', 'But there is no owner nearby — where did the puppy come from?'],
        question: 'What is written on the tag?',
        options: [
          { emoji: '📛', text: 'A name and a phone number' },
          { emoji: '🐱', text: 'A picture of a cat' },
          { emoji: '🎂', text: 'A birthday date' },
          { emoji: '🗺️', text: 'A secret map' },
        ],
        correctIndex: 0,
        clue: 'Kalimat kedua bilang apa yang Tom baca di tag itu.',
      },
      {
        title: 'The Search',
        sceneEmoji: '🍞',
        lines: ['Tom decides to help the puppy find its home.', 'He walks around the village and asks his neighbors.', 'An old baker points to a small house near the school.'],
        question: 'Who helps Tom find the way?',
        options: [
          { emoji: '🍞', text: 'A baker' },
          { emoji: '🩺', text: 'A doctor' },
          { emoji: '🚒', text: 'A firefighter' },
          { emoji: '✈️', text: 'A pilot' },
        ],
        correctIndex: 0,
        clue: 'Siapa yang menunjuk arah rumah kecil itu di kalimat terakhir?',
      },
      {
        title: 'Happy Ending',
        sceneEmoji: '🥰',
        lines: ['Tom knocks on the door of the small house.', 'A little girl opens it and sees her puppy.', 'She hugs the puppy and thanks Tom with a big smile.'],
        question: 'How does the girl feel?',
        options: [
          { emoji: '😠', text: 'Angry' },
          { emoji: '😢', text: 'Sad' },
          { emoji: '😊', text: 'Happy' },
          { emoji: '😴', text: 'Tired' },
        ],
        correctIndex: 2,
        clue: 'Dia memeluk anak anjingnya sambil tersenyum lebar — bagaimana perasaannya?',
      },
    ],
  },
];

/** Buku lain yang BELUM dibuat — cuma dipajang "🔒 Segera Hadir" di Magic
 *  Library supaya anak merasakan sense of progression tanpa placeholder
 *  rusak (CLAUDE.md kid-friendly: locked state tetap ramah, bukan dead-end
 *  menakutkan). Tambah cerita baru sungguhan = pindahkan judulnya ke
 *  `STORY_BOOKS` di atas (dgn halaman lengkap) + hapus barisnya di sini. */
const UPCOMING_BOOKS: { title: string; coverEmoji: string }[] = [
  { title: 'The Magic Forest', coverEmoji: '🌳' },
  { title: 'The Secret Castle', coverEmoji: '🏰' },
  { title: "The Dragon's Treasure", coverEmoji: '🐉' },
];

const ANSWER_LETTERS = ['A', 'B', 'C', 'D'];

/** Duplikat lokal `.opt-btn.answer-card` (konvensi app ini: helper generik
 *  diduplikasi per file game — lihat games/soundhunt.ts dst). */
function optionCardsHtml(options: StoryOption[], wrong: Set<number>, eliminated: Set<number>): string {
  return `<div class="opt-grid">
    ${options
      .map((o, i) => {
        const classes = ['opt-btn', 'answer-card'];
        if (wrong.has(i)) classes.push('wrong');
        if (eliminated.has(i)) classes.push('eliminated');
        const disabled = wrong.has(i) || eliminated.has(i) ? 'disabled' : '';
        return `
      <button class="${classes.join(' ')}" type="button" data-action="pick" data-payload="${i}" ${disabled}>
        <span class="answer-card-emoji" aria-hidden="true">${o.emoji}</span>
        <span class="answer-card-bottom">
          <span class="answer-card-label">${o.text}</span>
          <span class="answer-card-badge" aria-hidden="true">${ANSWER_LETTERS[i] ?? i + 1}</span>
        </span>
      </button>`;
      })
      .join('')}
  </div>`;
}

function lockAllOptions(container: HTMLElement): void {
  container.querySelectorAll<HTMLButtonElement>('.opt-btn').forEach((b) => (b.disabled = true));
}

export function runStoryQuest(container: HTMLElement, onDone: OnDone, level: LevelKey): void {
  const book = STORY_BOOKS[0];
  const total = book.pages.length;

  function renderCover(): void {
    container.innerHTML = `
      <div class="done-wrap">
        <div class="sunburst lg mascot-pop" aria-hidden="true"><span class="face">📖</span><span class="crown">✨</span></div>
        <h2>Story Quest</h2>
        <p class="done-sub">Petualangan Cerita</p>
        <div class="story-scene" aria-hidden="true"><span>${book.coverEmoji}</span></div>
        <h3 style="margin:0 0 4px">${book.title}</h3>
        <p class="meta">${book.subtitle}</p>
        <button class="primary-btn" type="button" data-action="start">▶️ Mulai Membaca</button>
      </div>`;
    setHandlers({ start: () => drawPage(0) });
  }

  function drawPage(idx: number): void {
    const page = book.pages[idx];
    const wrong = new Set<number>();
    const eliminated = new Set<number>();
    let hintUsed = false;
    let answered = false;

    function dotsHtml(): string {
      const dots = book.pages
        .map((_, i) => {
          const cls = i < idx ? 'done' : i === idx ? 'current' : '';
          return `<span class="quiz-dot static ${cls}" aria-hidden="true">${i < idx ? '✓' : i + 1}</span>`;
        })
        .join('');
      return `<div class="quiz-nav"><div class="quiz-dots">${dots}</div></div>`;
    }

    function paint(): void {
      container.innerHTML = `
        <div class="latihan-head">
          <span class="stage-badge">📖 ${page.title}</span>
          <span class="tag accent">Halaman ${idx + 1}/${total}</span>
        </div>
        ${dotsHtml()}
        <div class="story-page story-page-enter">
          <div class="story-scene" aria-hidden="true"><span>${page.sceneEmoji}</span></div>
          ${page.lines.map((l) => `<p class="story-line">${l}</p>`).join('')}
        </div>
        <div class="speak-row">
          <button class="speak-btn-ghost" type="button" data-action="listen">🔊 Dengar</button>
          ${!answered && !hintUsed ? `<button class="speak-btn-ghost" type="button" data-action="hint">💡 Petunjuk</button>` : ''}
        </div>
        ${hintUsed ? `<p class="meta story-clue">💭 ${page.clue}</p>` : ''}
        <div class="story-divider" aria-hidden="true">✨ · · · ✨</div>
        <p class="story-question">${page.question}</p>
        ${optionCardsHtml(page.options, wrong, eliminated)}
        <div class="feedback" id="fb"></div>
      `;
      setHandlers({
        listen: () => speak([...page.lines, page.question].join(' ')),
        hint: () => {
          if (hintUsed) return;
          hintUsed = true;
          const untried = page.options.map((_, i) => i).filter((i) => i !== page.correctIndex && !wrong.has(i));
          shuffle(untried)
            .slice(0, 2)
            .forEach((i) => eliminated.add(i));
          paint();
        },
        pick: (payload) => onPick(Number(payload)),
      });
    }

    function onPick(i: number): void {
      if (answered || wrong.has(i) || eliminated.has(i)) return;
      const correct = i === page.correctIndex;
      recordAttempt(correct);
      const fb = container.querySelector<HTMLElement>('#fb')!;
      const btn = container.querySelectorAll<HTMLButtonElement>('.opt-btn')[i];

      if (correct) {
        answered = true;
        lockAllOptions(container);
        btn.classList.add('correct', 'win-burst');
        playCorrectTone();
        fireConfetti();
        fb.textContent = pickPraise(level);
        fb.className = 'feedback good';
        const isLast = idx === total - 1;
        fb.insertAdjacentHTML(
          'afterend',
          `<div class="round-actions"><button class="primary-btn" type="button" data-action="nextRound" style="margin-top:0">${isLast ? 'Selesai ✅' : 'Lanjut ➡️'}</button></div>`
        );
        setHandlers({ nextRound: () => (isLast ? renderComplete() : drawPage(idx + 1)) });
      } else {
        wrong.add(i);
        btn.classList.add('wrong');
        btn.disabled = true;
        playTryAgainTone();
        fb.textContent = pickEncourage(level);
        fb.className = 'feedback bad';
      }
    }

    paint();
  }

  function renderComplete(): void {
    container.innerHTML = `
      <div class="done-wrap win">
        <div class="sunburst lg mascot-pop" aria-hidden="true"><span class="face">📖</span><span class="crown">✨</span></div>
        <h2 class="win-banner">Story Complete!</h2>
        <p class="done-sub">"Hebaaat! Kamu membantu Tom menemukan pemilik anak anjingnya." 🐶</p>
        <p class="done-sub">🏆 <span class="tag ok">Adventure Complete</span> <span class="tag accent">📕 Buku Ajaib Terbuka</span></p>
        <button class="primary-btn" type="button" data-action="openLibrary">📚 Buka Perpustakaan</button>
        <button class="ghost-btn" type="button" data-action="continueAdventure">🗺️ Continue Adventure</button>
      </div>`;
    setHandlers({ openLibrary: () => renderLibrary(), continueAdventure: () => onDone() });
  }

  function renderLibrary(): void {
    const cards = [
      { title: book.title, coverEmoji: book.coverEmoji, locked: false },
      ...UPCOMING_BOOKS.map((b) => ({ ...b, locked: true })),
    ];
    container.innerHTML = `
      <div class="done-wrap">
        <div class="sunburst lg mascot-pop" aria-hidden="true"><span class="face">📚</span><span class="crown">✨</span></div>
        <h2>Magic Library</h2>
        <p class="done-sub">Koleksi buku ajaibmu</p>
      </div>
      <div class="library-grid">
        ${cards
          .map(
            (c) => `
          <div class="library-card ${c.locked ? 'locked' : ''}">
            <div class="library-cover" aria-hidden="true">${c.locked ? '🔒' : c.coverEmoji}</div>
            <p class="library-title">${c.title}</p>
            <span class="tag ${c.locked ? '' : 'ok'}">${c.locked ? 'Segera Hadir' : '✓ Selesai'}</span>
          </div>`
          )
          .join('')}
      </div>
      <button class="primary-btn" type="button" data-action="continueAdventure">🗺️ Continue Adventure</button>
    `;
    setHandlers({ continueAdventure: () => onDone() });
  }

  renderCover();
}
