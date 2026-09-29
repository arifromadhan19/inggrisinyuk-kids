/**
 * Reading — format "Baca Teks" (`ReadingTextTopic`) di SEMUA level
 * (`materi/reading.md` §19–§22, pembeda level `materi/pembeda_level.md`
 * § Reading). Menggantikan 3 format lama ("Baca Kata" kata↔gambar, "Baca &
 * Nilai" kalimat sifat benda, cerita+soal gambar) yang terlalu mirip
 * Vocabulary (audit user 2026-09-24).
 *
 * Identitas Reading: satuan terkecil = TEKS utuh (buku gambar mini, pesan,
 * papan, cerita, diary, email, artikel), teks SELALU tetap di layar (beda
 * dari Listening), dan jawaban bisa DITUNJUK di teks (🔎 bukti) — beda dari
 * Vocab yang menguji arti kata lepas.
 */
import { readingPicHtml } from '../reading-pic';
import type { LevelKey, OnDone, ReadingText, ReadingTextQuestion, ReadingTextTopic } from '../types';
import { setHandlers } from '../interaction';
import {
  getSlot,
  isHintUnlocked,
  markSlotHint,
  firstUnansweredSlot,
  hasWordInteraction,
  markSlotAnswered,
  markWordInteraction,
  recordAttempt,
  recordEvent,
  setSectionCursor,
} from '../progress';
import {
  getPlaybackRate,
  listenAndRecordOnce,
  playCorrectTone,
  playTryAgainTone,
  playWrongTone,
  speak,
  speakLocalized,
  sttSupported,
  vibrateDevice,
  wordMatchDetail,
} from '../speech';
import { pickEncourage, pickPraise } from '../praise';
import { fireConfetti } from '../confetti';
import { shuffle } from '../util';

/**
 * "Selesai ✅" di `roundActionsHtml` HANYA boleh muncul kalau SEMUA soal di
 * section ini sudah dikerjakan — bukan cuma soal yang SEDANG dijawab
 * kebetulan berada di posisi TERAKHIR (permintaan user, bug: quiz-dot boleh
 * dilompat bebas ke soal mana pun, jadi anak yang lompat langsung ke soal
 * terakhir & menjawabnya BISA dapat "Selesai" walau soal 1–9 belum pernah
 * disentuh). Cek lewat `statusOf` yang SAMA dgn yang dikirim ke
 * `quizNavHtml` (st===2 tiap slot), BUKAN `round === total - 1` lagi —
 * berlaku di SEMUA skill (Vocab/Listening/Reading/Grammar/Speaking) yang
 * punya quiz-dot bebas lompat.
 */
function allSlotsDone(total: number, statusOf: (i: number) => 0 | 1 | 2): boolean {
  for (let i = 0; i < total; i++) if (statusOf(i) !== 2) return false;
  return true;
}

/**
 * Tombol "Lanjut" (soal INI sudah dijawab) pindah ke soal BELUM dikerjakan
 * berikutnya — bukan cuma `round + 1` polos, krn quiz-dot boleh dilompat
 * bebas (mis. anak sempat jawab soal 10 duluan, 1–9 belum). Kalau SEMUA
 * slot (0..total-1) sudah `st===2`, kembalikan `total` (sinyal section ini
 * kelar — `draw()` akan panggil `onDone()`, pola SAMA persis sblm fix ini).
 */
function nextUnfinishedRound(round: number, total: number, statusOf: (i: number) => 0 | 1 | 2): number {
  for (let step = 1; step <= total; step++) {
    const i = (round + step) % total;
    if (statusOf(i) !== 2) return i;
  }
  return total;
}

/** Opsi gambar (emoji) — `lbl` cuma `aria-label`, SENGAJA tidak tampil
 *  (supaya anak tidak mencocokkan teks label dgn kata di kalimat). */
function optHtml(o: { emoji: string; lbl?: string; ok?: boolean }, i: number, action: string): string {
  return `<button class="opt-btn" data-action="${action}" data-payload="${i}" ${o.lbl ? `aria-label="${o.lbl}"` : ''}>${readingPicHtml(o.emoji)}</button>`;
}

function roundActionsHtml(isLast: boolean): string {
  return `
    <div class="round-actions">
      <button class="ghost-btn" type="button" data-action="tryAgainRound">🔁 Coba Lagi</button>
      <button class="primary-btn" type="button" data-action="nextRound" style="margin-top:0">${isLast ? 'Selesai ✅' : 'Lanjut ➡️'}</button>
    </div>`;
}

function lockOptionButtons(container: HTMLElement): void {
  container.querySelectorAll<HTMLButtonElement>('.opt-btn').forEach((b) => (b.disabled = true));
  const hintBtn = container.querySelector<HTMLButtonElement>('#hintBtn');
  if (hintBtn) hintBtn.disabled = true;
}

/** Navigasi quiz-dot (lompat ke soal manapun, titik hijau = sudah dijawab) —
 *  duplikat lokal dari `games/vocabulary.ts`/`games/listening.ts` (konvensi
 *  sama: helper generik diduplikasi per file game). Sebelum revisi ini,
 *  Reading tidak punya navigasi ini sama sekali (feedback user: "kesenjangan
 *  teknis vs Vocab/Listening") — sekarang dipakai `runLatihanIntiWord` &
 *  `runTantanganWord`. */
/** Navigasi quiz-dot (lompat ke soal manapun, titik hijau = sudah dijawab) —
 *  duplikat lokal dari `games/vocabulary.ts`/`games/listening.ts` (konvensi:
 *  helper generik diduplikasi per file game). */
function quizNavHtml(current: number, total: number, statusOf: (i: number) => 0 | 1 | 2): string {
  const dots = Array.from({ length: total }, (_, i) => {
    const cls = [i === current ? 'current' : '', statusOf(i) === 2 ? 'done' : ''].filter(Boolean).join(' ');
    return `<button type="button" class="quiz-dot ${cls}" data-action="quizJump" data-payload="${i}" aria-label="Ke soal ${i + 1}">${i + 1}</button>`;
  }).join('');
  return `<div class="quiz-nav"><div class="quiz-dots">${dots}</div></div>`;
}

function wireQuizNav(goTo: (i: number) => void): void {
  setHandlers({ quizJump: (payload) => goTo(Number(payload)) });
}

/* ================================================================
 * Format KEEMPAT "Baca Teks" (`ReadingTextTopic`) — materi/reading.md
 * §19–§21. Satuan terkecil = TEKS utuh (buku gambar mini, undangan, pesan,
 * cerita, papan aturan, diary, artikel, email), BUKAN kata lepas — beda
 * sengaja dari Vocab. SATU mesin utk semua level; beda level lewat konten +
 * `textTier(contentLevel)` (pembeda_level.md § Reading):
 *  1. Kenalan "📖 Baca Bareng" — buku: 1 halaman/layar (gambar besar + kata
 *     disorot saat dibacakan); teks: kartu per halaman. 🔊/🎤/🌐/🎮.
 *  2. Latihan Inti "🔎 Baca & Temukan" — pertanyaan atas teks YANG SAMA,
 *     lalu tunjuk bukti (kalimat; PAUD/Starter: kata).
 *  3. Tantangan "📚 Baca Sendiri" — teks BARU sejenis.
 * Teks SELALU tetap di layar (boleh dibaca ulang) — pembeda dari Listening.
 * ================================================================ */

/** Slot mini-game 🎮 di section 'kenalan' digeser +100 supaya tidak
 *  bercampur dgn slot per-halaman yg dipakai penanda 🔊/🎤/🎮. */
const TEXT_GAME_SLOT_BASE = 100;
/** Penanda 🔊/🎤/🎮 per HALAMAN teks di section 'kenalan' digeser +200 —
 *  id topik lama dipertahankan, jadi slot 0..9 bisa berisi penanda kata dari
 *  format lama (tombol jangan tampil "sudah" padahal belum ditap). */
const TEXT_PAGE_SLOT_BASE = 200;

type TextAudio = 'auto' | 'button' | 'none';
interface TextTier {
  latihanAudio: TextAudio;
  tantanganAudio: TextAudio;
  /** translate = arti Indonesia kalimat; question = arti pertanyaan;
   *  evidence = sorot kalimat bukti; eliminate = matikan 1 opsi salah. */
  hint: 'translate' | 'question' | 'evidence' | 'eliminate';
  /** Petunjuk 🔒 sampai anak sudah 1x mencoba soal itu. */
  hintGate: boolean;
}

/** Tier mekanik "Baca Teks" per level KONTEN (bukan badge anak) —
 *  pembeda_level.md § Reading: Dasar dibacakan (Fase A), Menengah tanpa
 *  audio & bantuan jadi "lihat bagian ini", Lanjut bantuan dikunci. */
function textTier(level: LevelKey): TextTier {
  switch (level) {
    case 'little-stars':
      return { latihanAudio: 'auto', tantanganAudio: 'button', hint: 'translate', hintGate: false };
    case 'starter':
      return { latihanAudio: 'button', tantanganAudio: 'button', hint: 'translate', hintGate: false };
    case 'explorer':
      return { latihanAudio: 'none', tantanganAudio: 'none', hint: 'question', hintGate: false };
    case 'adventurer':
      return { latihanAudio: 'none', tantanganAudio: 'none', hint: 'evidence', hintGate: false };
    case 'achiever':
      return { latihanAudio: 'none', tantanganAudio: 'none', hint: 'evidence', hintGate: true };
    default:
      return { latihanAudio: 'none', tantanganAudio: 'none', hint: 'eliminate', hintGate: true };
  }
}

const normWord = (w: string): string => w.toLowerCase().replace(/[^a-z0-9']/g, '');

/** Kalimat dipecah per kata (span `.rt-word`) — dipakai sorot karaoke &
 *  "👆 Mana tulisannya?". */
function wordsHtml(sentence: string, tappable = true): string {
  return sentence
    .split(' ')
    .map((w, i) => (tappable ? `<span class="rt-word" data-action="rtWord" data-payload="${i}">${w}</span>` : `<span class="rt-word">${w}</span>`))
    .join(' ');
}

/** "🔈" kecil — instruksi dibacakan Bahasa Indonesia (anak PAUD belum bisa
 *  membaca instruksi). */
function sayHtml(text: string): string {
  return `<button class="rt-say" type="button" data-action="rtSay" data-payload="${encodeURIComponent(text)}" aria-label="Dengarkan petunjuk">🔈</button>`;
}
function wireSay(): void {
  setHandlers({ rtSay: (payload) => speakLocalized(decodeURIComponent(String(payload)), 'id-ID') });
}

let karaokeTimers: number[] = [];
/** Naik tiap `stopKaraoke()` — ucapan lama yang dibatalkan (`cancel()` memicu
 *  `onerror`/`onend`-nya) tidak boleh lanjut ke baris berikutnya. */
let karaokeGen = 0;
function stopKaraoke(): void {
  karaokeGen++;
  karaokeTimers.forEach((t) => clearTimeout(t));
  karaokeTimers = [];
  document.querySelectorAll('.rt-word.lit').forEach((w) => w.classList.remove('lit'));
}
/** Perkiraan durasi per huruf pada kecepatan 1x (±14 huruf/detik — tempo
 *  voice Web Speech rata-rata). Dibagi `getPlaybackRate()` supaya sorot kata
 *  ikut pill kecepatan (0.5x → 2x lebih lambat, 1.5x → lebih cepat). */
const KARAOKE_MS_PER_CHAR = 70;

/** Ucapkan 1 baris + sorot `.rt-word`-nya selaras suara. Kalau browser
 *  mengirim event `boundary` per kata, sorot mengikuti event itu (paling
 *  akurat, otomatis ikut kecepatan & voice); kalau tidak, pakai perkiraan
 *  waktu dari panjang kata ÷ kecepatan, dihitung sejak suara benar-benar
 *  mulai (`onStart`). `onDone` dipanggil sekali begitu baris selesai. */
function karaokeLine(words: ArrayLike<HTMLElement>, sentence: string, onDone?: () => void): void {
  const list = Array.from(words);
  const gen = karaokeGen;
  const lit = (i: number): void => {
    if (gen !== karaokeGen) return;
    list.forEach((x) => x.classList.remove('lit'));
    list[i]?.classList.add('lit');
  };
  const rate = getPlaybackRate();
  const perChar = KARAOKE_MS_PER_CHAR / rate;
  const estTimers: number[] = [];
  let usingBoundary = false;
  let started = false;
  let finished = false;
  const startEstimate = (): void => {
    if (started) return;
    started = true;
    let t = 0;
    list.forEach((w, i) => {
      estTimers.push(window.setTimeout(() => !usingBoundary && lit(i), t));
      t += ((w.textContent ?? '').length + 1) * perChar;
    });
    karaokeTimers.push(...estTimers);
  };
  const finish = (): void => {
    if (finished) return;
    finished = true;
    estTimers.forEach((t) => clearTimeout(t));
    if (gen !== karaokeGen) return;
    list.forEach((x) => x.classList.remove('lit'));
    onDone?.();
  };
  speak(sentence, finish, {
    onStart: startEstimate,
    onWord: (i) => {
      usingBoundary = true;
      started = true;
      lit(i);
    },
  });
  // Cadangan: `onstart` tidak datang (TTS tidak didukung/terpotong) → mulai
  // perkiraan sendiri; `onEnd` tidak datang → akhiri setelah perkiraan penuh.
  const chars = list.reduce((n, w) => n + (w.textContent ?? '').length + 1, 0);
  karaokeTimers.push(window.setTimeout(startEstimate, 400));
  karaokeTimers.push(window.setTimeout(finish, 400 + chars * perChar + 2000));
}

/** Bacakan kalimat + sorot kata satu per satu, selaras kecepatan suara. */
function readAlong(scope: HTMLElement, sentence: string): void {
  stopKaraoke();
  karaokeLine(scope.querySelectorAll<HTMLElement>('.rt-word'), sentence);
}

/** Bacakan SEMUA baris kartu teks berurutan + sorot kata per baris (pola
 *  karaoke buku Little Stars, permintaan user utk semua level). Baris
 *  berikutnya mulai begitu ucapan baris ini selesai. */
function readLinesAlong(card: HTMLElement, lines: string[]): void {
  stopKaraoke();
  const lineEls = card.querySelectorAll<HTMLElement>('.rt-line');
  const play = (li: number): void => {
    if (li >= lines.length) return;
    const words = lineEls[li]?.querySelectorAll<HTMLElement>('.rt-word') ?? [];
    karaokeLine(words, lines[li], () => karaokeTimers.push(window.setTimeout(() => play(li + 1), 350)));
  };
  play(0);
}

function lineHtml(text: ReadingText, l: { en: string; id: string; br?: boolean }, i: number, o: { showId?: boolean; selected?: number | null; hinted?: number[]; words?: boolean }): string {
  const cls = ['rt-line', l.br ? 'rt-br' : '', o.selected === i ? 'selected' : '', o.hinted?.includes(i) ? 'hinted' : ''].filter(Boolean).join(' ');
  // `words`: tiap kata jadi span `.rt-word` (TANPA data-action — tap tetap
  // ke baris) supaya bisa disorot karaoke di Kenalan.
  const fmt = (t: string): string => (o.words ? wordsHtml(t, false) : t);
  let body = fmt(l.en);
  if (text.genre === 'dialog') {
    const k = l.en.indexOf(': ');
    if (k > 0) body = `<b class="rt-speaker">${fmt(l.en.slice(0, k) + ':')}</b> ${fmt(l.en.slice(k + 2))}`;
  }
  return `<div class="${cls}" data-action="rtLine" data-payload="${i}"><span class="rt-en">${body}</span>${o.showId ? `<span class="rt-id">${l.id}</span>` : ''}</div>`;
}

function textCardHtml(text: ReadingText, o: { showId?: boolean; selected?: number | null; tappable?: boolean; hinted?: number[]; words?: boolean } = {}): string {
  return `
    <div class="rt-card rt-${text.genre}${o.tappable ? ' tappable' : ''}">
      <div class="rt-heading">${text.heading}</div>
      ${text.lines.map((l, i) => lineHtml(text, l, i, o)).join('')}
    </div>`;
}

/** Popup hasil 🎤 baca nyaring — pola sama `renderKenalan`/`renderKenalanWord`
 *  (skor proporsional `wordMatchDetail` + ▶️ Play Suaramu, Aturan Wajib
 *  Speaking). */
function readAloudPopup(topicId: string, target: string, slot: number, said: string | null, errorText: string | null, level: LevelKey, onRetry: () => void): void {
  const overlay = document.createElement('div');
  overlay.className = 'mic-pop-overlay';
  let body = `<p class="meta" style="margin:10px 0">${errorText ?? ''}</p>`;
  if (said !== null) {
    const words = wordMatchDetail(said, target);
    const hitRatio = words.length ? words.filter((w) => w.matched).length / words.length : 0;
    const stars = hitRatio >= 0.8 ? 3 : hitRatio >= 0.4 ? 2 : 1;
    const perfect = stars === 3;
    if (perfect) {
      playCorrectTone();
      fireConfetti();
    } else playTryAgainTone();
    recordEvent({ kind: 'speak', skill: 'reading', topicId, section: 'kenalan', slot, itemRef: target, activity: 'mic', graded: false, score: Math.round(hitRatio * 100), detail: { heard: said, words } });
    body = `
      <div class="${perfect ? 'win-burst' : ''}" style="font-size:20px;letter-spacing:3px" aria-hidden="true">${'⭐'.repeat(stars) + '☆'.repeat(3 - stars)}</div>
      <div class="word-diff" style="margin:8px 0">${words.map((w) => `<span class="${w.matched ? 'ok' : 'miss'}">${w.word}</span>`).join('')}</div>
      <div class="heard-text">Terdengar: "${said}"</div>
      <div class="feedback good" style="margin-top:6px">${perfect ? pickPraise(level) : pickEncourage(level)}</div>
      <div class="speak-row" style="margin:12px 0 2px">
        <button class="speak-btn" type="button" id="micPopPlayMine" data-action="micPopPlayMine" disabled>▶️ Play Suaramu</button>
      </div>`;
  }
  overlay.innerHTML = `
    <div class="mic-pop-card">
      <div class="en-text" style="margin:2px 0 10px">${target}</div>
      ${body}
      <div class="round-actions">
        <button class="ghost-btn" type="button" data-action="micPopTryAgain">🔁 Coba Lagi</button>
        <button class="primary-btn" type="button" data-action="micPopClose" style="margin-top:0">Lanjut ➡️</button>
      </div>
    </div>`;
  document.body.appendChild(overlay);
  setHandlers({
    micPopClose: () => overlay.remove(),
    micPopTryAgain: () => {
      overlay.remove();
      onRetry();
    },
    micPopPlayMine: () => {
      const url = overlay.dataset.audioUrl;
      if (url) new Audio(url).play().catch(() => {});
    },
  });
}

export function renderKenalanText(container: HTMLElement, topic: ReadingTextTopic, onNext: OnDone, level: LevelKey, _contentLevel: LevelKey): void {
  let page = 0;
  let sub = 0; // halaman di dalam buku (genre 'book')
  let selected = -1; // baris yang ditap anak (-1 = belum ada — jangan tutupi sorot karaoke)
  // Halaman yang sudah dibuka di sesi ini (bullet progress halaman buku —
  // hijau = sudah dibaca). Kenalan tidak dihitung ke progres topik.
  const seen = new Set<string>();
  const positions = topic.texts.flatMap((t, ti) => (t.genre === 'book' ? t.lines.map((_, li) => ({ page: ti, sub: li })) : [{ page: ti, sub: 0 }]));
  const doneCls = (action: 'listen' | 'mic' | 'game'): string => (hasWordInteraction('reading', topic.id, TEXT_PAGE_SLOT_BASE + page, action) ? ' done' : '');

  function gameLabel(text: ReadingText): string | null {
    // Buku mini (Little Stars/Starter) SENGAJA tanpa 🎮 — "Urutkan Halaman"
    // dihapus (feedback user: sulit & tidak jelas, cuma uji hafalan urutan).
    if (text.sequence?.length) return '🎮 Urutkan Cerita';
    if (text.lines.some((l) => l.pic !== undefined) && text.genre !== 'book') return '🎮 Tunjuk di Gambar';
    return null;
  }

  function draw(autoRead = false): void {
    stopKaraoke();
    const text = topic.texts[page];
    const isBook = text.genre === 'book';
    const lastPage = page === topic.texts.length - 1;
    const atEnd = lastPage && (!isBook || sub === text.lines.length - 1);
    const game = gameLabel(text);
    const line = text.lines[isBook ? sub : Math.max(selected, 0)];
    const pageLabel = isBook ? `Buku ${page + 1} · Halaman ${sub + 1}/${text.lines.length}` : `Halaman ${page + 1} dari ${topic.texts.length}`;
    seen.add(`${page}:${sub}`);
    // Bullet progress = SATU deret utk semua halaman di topik (buku: per
    // halaman buku; teks lain: per kartu) — satu-satunya navigasi halaman.
    const posIndex = positions.findIndex((q) => q.page === page && q.sub === sub);
    const pageDots =
      positions.length > 1 ? quizNavHtml(posIndex, positions.length, (i) => (seen.has(`${positions[i].page}:${positions[i].sub}`) ? 2 : 0)) : '';
    const instr = isBook ? 'Dengarkan ceritanya. Tap satu kata untuk dengar lagi.' : 'Baca kartunya pelan-pelan. Tap satu kalimat buat dengar kalimat itu.';
    const body = isBook
      ? `<div class="rt-book-page">
           <div class="rt-heading">${text.heading}</div>
           <div class="rt-book-pic" aria-hidden="true">${readingPicHtml(text.pictures?.[line.pic ?? -1]?.emoji)}</div>
           <div class="rt-book-text">${wordsHtml(line.en)}</div>
           <div class="rt-id rt-book-id">${line.id}</div>
         </div>`
      : textCardHtml(text, { showId: true, selected, tappable: true, words: true });
    container.innerHTML = `
      <div class="latihan-head">
        <span class="stage-badge">📖 Baca Bareng</span>
        <span class="rt-page">${pageLabel}</span>
      </div>
      ${pageDots ? `<div class="rt-page-nav">${pageDots}</div>` : ''}
      <div class="id-text rt-instr">${instr} ${sayHtml(instr)}</div>
      ${body}
      <div class="rt-actions">
        <button class="rt-act${doneCls('listen')}" type="button" data-action="rtListen">${isBook ? '🔊 Dengar' : '🔊 Dengar Semua'}</button>
        ${sttSupported ? `<button class="rt-act${doneCls('mic')}" type="button" id="rtMic" data-action="rtMic">${isBook ? '🎤 Ikut Baca' : '🎤 Baca Nyaring'}</button>` : ''}
        ${game ? `<button class="rt-act${doneCls('game')}" type="button" data-action="rtGame">${game}</button>` : ''}
      </div>
      ${atEnd ? `<div class="round-actions"><button class="primary-btn" type="button" data-action="rtNext" style="margin-top:0">Lanjut ke Latihan Inti →</button></div>` : ''}
    `;
    wireSay();
    wireQuizNav((i) => {
      ({ page, sub } = positions[i]);
      selected = -1;
      draw(true);
    });
    const scope = container.querySelector<HTMLElement>('.rt-book-text');
    setHandlers({
      rtLine: (payload) => {
        if (isBook) return;
        selected = Number(payload);
        draw();
        const el = container.querySelectorAll<HTMLElement>('.rt-card .rt-line')[selected];
        if (el) readAlong(el, text.lines[selected].en);
      },
      rtWord: (payload) => {
        const w = line.en.split(' ')[Number(payload)];
        if (w) speak(w.replace(/[^A-Za-z']/g, ''));
      },
      rtListen: () => {
        markWordInteraction('reading', topic.id, TEXT_PAGE_SLOT_BASE + page, 'listen', text.heading);
        if (isBook && scope) {
          container.querySelector('[data-action="rtListen"]')?.classList.add('done');
          readAlong(scope, line.en);
        } else {
          draw();
          readAllLines();
        }
      },
      rtMic: () => micFor(line.en),
      rtGame: () => {
        markWordInteraction('reading', topic.id, TEXT_PAGE_SLOT_BASE + page, 'game', text.heading);
        recordEvent({ kind: 'interact', skill: 'reading', topicId: topic.id, section: 'kenalan', slot: page, itemRef: text.heading, activity: 'game' });
        stopKaraoke();
        if (text.sequence?.length) runTextOrderGame(container, topic, page, () => draw(), level);
        else runTextPointGame(container, topic, page, () => draw(), level);
      },
      rtNext: () => onNext(),
    });
    if (autoRead && isBook && scope) readAlong(scope, line.en);
    else if (autoRead && !isBook) readAllLines();
  }

  function readAllLines(): void {
    const card = container.querySelector<HTMLElement>('.rt-card');
    if (card) readLinesAlong(card, topic.texts[page].lines.map((l) => l.en));
  }

  function micFor(target: string): void {
    const btn = document.getElementById('rtMic');
    if (!btn || btn.classList.contains('listening')) return;
    stopKaraoke();
    markWordInteraction('reading', topic.id, TEXT_PAGE_SLOT_BASE + page, 'mic', target);
    btn.classList.add('listening');
    btn.textContent = '🎙️ Mendengarkan…';
    const retry = () => {
      draw();
      micFor(target);
    };
    listenAndRecordOnce(
      (said) => {
        draw();
        readAloudPopup(topic.id, target, page, said, null, level, retry);
      },
      (kind) => {
        draw();
        if (kind === 'aborted') return;
        readAloudPopup(topic.id, target, page, null, 'Belum kedengaran, coba lagi ya 🎧', level, retry);
      },
      (audioUrl) => {
        const overlay = document.querySelector<HTMLElement>('.mic-pop-overlay');
        if (!overlay) return;
        overlay.dataset.audioUrl = audioUrl;
        const playBtn = overlay.querySelector<HTMLButtonElement>('#micPopPlayMine');
        if (playBtn) playBtn.disabled = false;
      }
    );
  }

  draw(true);
}

/** 🎮 "Tunjuk di Gambar" — baca 1 kalimat, tap gambar adegan yang cocok
 *  (Starters P1: kalimat ↔ gambar). Bullet progress lintas semua kalimat
 *  bergambar di topik, mulai di halaman yang sedang dibuka. */
function runTextPointGame(container: HTMLElement, topic: ReadingTextTopic, startPage: number, onBack: OnDone, level: LevelKey): void {
  const rounds = topic.texts.flatMap((t, ti) => t.lines.map((l, li) => ({ ti, li, pic: l.pic })).filter((r) => r.pic !== undefined));
  const total = rounds.length;
  const status = (i: number): 0 | 1 | 2 => getSlot('reading', topic.id, 'kenalan', TEXT_GAME_SLOT_BASE + i)?.st ?? 0;
  let current = Math.max(0, rounds.findIndex((r) => r.ti === startPage));

  function draw(): void {
    const r = rounds[current];
    const text = topic.texts[r.ti];
    // Maks 4 gambar (1 benar + 3 pengecoh acak) — grid 2×2 rapi, tanpa kartu
    // ganjil sendirian di baris terakhir (CLAUDE.md "Desain Mobile & Desktop").
    const all = (text.pictures ?? []).map((p, i) => ({ emoji: p.emoji, lbl: p.label, ok: i === r.pic }));
    const pics = shuffle([...all.filter((o) => o.ok), ...shuffle(all.filter((o) => !o.ok)).slice(0, 3)]);
    container.innerHTML = `
      <span class="stage-badge">🎮 Main · Tunjuk di Gambar</span>
      ${quizNavHtml(current, total, status)}
      <div class="reading-passage"><p>${text.lines[r.li].en}</p></div>
      <p class="reading-question">Mana gambar yang cocok dengan kalimat ini?</p>
      <div class="opt-grid">${pics.map((o, i) => optHtml(o, i, 'pick')).join('')}</div>
      <div class="feedback" id="fb"></div>
    `;
    wireQuizNav((i) => {
      current = i;
      draw();
    });
    setHandlers({
      pick: (payload) => {
        const i = Number(payload);
        const correct = !!pics[i].ok;
        const btn = container.querySelectorAll<HTMLElement>('.opt-btn')[i];
        lockOptionButtons(container);
        markSlotAnswered('reading', topic.id, 'kenalan', TEXT_GAME_SLOT_BASE + current, correct, { itemRef: text.lines[r.li].en });
        const fb = container.querySelector<HTMLElement>('#fb')!;
        recordAttempt(correct);
        if (correct) {
          btn.classList.add('correct', 'win-burst');
          playCorrectTone();
          fireConfetti();
          fb.textContent = pickPraise(level);
          fb.className = 'feedback good';
        } else {
          btn.classList.add('wrong');
          playWrongTone();
          vibrateDevice(160);
          fb.textContent = pickEncourage(level);
          fb.className = 'feedback bad';
        }
        recordEvent({ kind: 'answer', skill: 'reading', topicId: topic.id, itemRef: text.lines[r.li].en, activity: 'text-point', correct });
        fb.insertAdjacentHTML('afterend', roundActionsHtml(allSlotsDone(total, status)));
        setHandlers({
          tryAgainRound: () => draw(),
          nextRound: () => {
            const next = nextUnfinishedRound(current, total, status);
            if (next < total) {
              current = next;
              draw();
            } else onBack();
          },
        });
      },
    });
  }

  draw();
}

/** 🎮 "Urutkan Cerita" — tap kartu kalimat kejadian sesuai urutan di teks
 *  (urutan cerita). 1 ronde per teks yang punya `sequence`; bullet progress
 *  lintas teks, mulai di teks yang sedang dibuka. Buku mini TIDAK pakai ini
 *  lagi (dulu "Urutkan Halaman", dihapus atas permintaan user). */
function runTextOrderGame(container: HTMLElement, topic: ReadingTextTopic, startPage: number, onBack: OnDone, level: LevelKey): void {
  const rounds = topic.texts.map((t, ti) => ({ t, ti })).filter((r) => r.t.sequence?.length);
  const total = rounds.length;
  const status = (i: number): 0 | 1 | 2 => getSlot('reading', topic.id, 'kenalan', TEXT_GAME_SLOT_BASE + i)?.st ?? 0;
  let current = Math.max(0, rounds.findIndex((r) => r.ti === startPage));

  function draw(): void {
    const { t } = rounds[current];
    const seq = t.sequence!;
    const cards = shuffle(seq.map((li, pos) => ({ li, pos })));
    let next = 0;
    let mistakes = 0;
    const instr = 'Tap kejadiannya sesuai urutan di cerita: yang terjadi duluan dulu.';
    const cardHtml = (c: { li: number; pos: number }, i: number): string =>
      `<button class="opt-btn opt-btn-text rt-order-card" type="button" data-action="rtOrder" data-payload="${i}"><span class="rt-order-no"></span>${t.lines[c.li].en}</button>`;
    container.innerHTML = `
      <span class="stage-badge">🎮 Main · Urutkan Cerita</span>
      ${total > 1 ? quizNavHtml(current, total, status) : ''}
      <div class="id-text rt-instr">${instr} ${sayHtml(instr)}</div>
      <div class="rt-heading" style="margin:6px 0 10px">${t.heading}</div>
      <div class="opt-grid rt-opts">${cards.map(cardHtml).join('')}</div>
      <div class="feedback" id="fb"></div>
    `;
    wireSay();
    if (total > 1)
      wireQuizNav((i) => {
        current = i;
        draw();
      });
    setHandlers({
      rtOrder: (payload) => {
        const i = Number(payload);
        const btn = container.querySelectorAll<HTMLElement>('.rt-order-card')[i];
        const fb = container.querySelector<HTMLElement>('#fb')!;
        if (btn.classList.contains('correct')) return;
        if (cards[i].pos === next) {
          next += 1;
          btn.classList.add('correct');
          btn.querySelector('.rt-order-no')!.textContent = String(next);
          if (next < seq.length) {
            playCorrectTone();
            fb.textContent = 'Betul! Lanjut yang berikutnya 👉';
            fb.className = 'feedback good';
            return;
          }
          lockOptionButtons(container);
          markSlotAnswered('reading', topic.id, 'kenalan', TEXT_GAME_SLOT_BASE + current, mistakes === 0, { itemRef: t.heading });
          recordAttempt(mistakes === 0);
          recordEvent({ kind: 'answer', skill: 'reading', topicId: topic.id, itemRef: t.heading, activity: 'text-order', correct: mistakes === 0 });
          playCorrectTone();
          fireConfetti();
          fb.textContent = pickPraise(level);
          fb.className = 'feedback good';
          fb.insertAdjacentHTML('afterend', roundActionsHtml(allSlotsDone(total, status)));
          setHandlers({
            tryAgainRound: () => draw(),
            nextRound: () => {
              const n = nextUnfinishedRound(current, total, status);
              if (n < total) {
                current = n;
                draw();
              } else onBack();
            },
          });
        } else {
          mistakes += 1;
          btn.classList.remove('wrong');
          void btn.offsetWidth;
          btn.classList.add('wrong');
          window.setTimeout(() => btn.classList.remove('wrong'), 700);
          playWrongTone();
          vibrateDevice(160);
          fb.textContent = pickEncourage(level);
          fb.className = 'feedback bad';
        }
      },
    });
  }

  draw();
}

/** Mesin bersama Latihan Inti & Tantangan format "Baca Teks": 1 soal = 1
 *  pertanyaan atas 1 teks (urutan TETAP per teks). 3 bentuk soal:
 *  `text` (kartu + opsi teks + 🔎 tunjuk kalimat bukti), `picture`
 *  (kalimat → gambar, lalu 👆 tunjuk kata), `truefalse` (gambar +
 *  pernyataan → ✅/❌). Lanjut SELALU tersedia (langkah bukti = bonus). */
function runTextQuizSet(
  container: HTMLElement,
  topic: ReadingTextTopic,
  texts: ReadingText[],
  section: string,
  badge: string,
  onDone: OnDone,
  level: LevelKey,
  contentLevel: LevelKey,
  audio: TextAudio,
  reverse = false
): void {
  const tier = textTier(contentLevel);
  const items: { text: ReadingText; q: ReadingTextQuestion }[] = texts.flatMap((text) => text.questions.map((q) => ({ text, q })));
  const total = items.length;
  const status = (i: number): 0 | 1 | 2 => getSlot('reading', topic.id, section, i)?.st ?? 0;
  let round = firstUnansweredSlot('reading', topic.id, section, total);
  let revealed = false;
  /** Tahap Petunjuk yang sudah dibuka. Soal "gambar → pilih kalimat"
   *  (Tantangan buku mini) py 2 tahap: 1 = arti kalimat, 2 = coret 1 opsi. */
  let hintStep = 0;
  let sayTimer: number | undefined;
  let attempted = false;
  let eliminated = -1;
  let order: number[] = [];
  // Mode terbalik (Tantangan buku mini): soal `picture` jadi GAMBAR →
  // pilih KALIMAT. revOpts[0] = kalimat benar, sisanya pengecoh.
  let revOpts: string[] = [];
  const isRev = (q: ReadingTextQuestion): boolean => reverse && q.kind === 'picture';
  const answerIdx = (q: ReadingTextQuestion): number => (isRev(q) ? 0 : q.answer);
  const hintSteps = (q: ReadingTextQuestion): number => (isRev(q) ? 2 : 1);
  const hintLabel = (q: ReadingTextQuestion): string => (isRev(q) && hintStep === 1 ? 'Petunjuk 2' : 'Petunjuk');

  /** Pengecoh = kalimat buku yang gambarnya jadi pengecoh di data; kalau
   *  gambar pengecoh tidak punya kalimat (mis. topik angka), ambil kalimat
   *  lain di buku yang sama. */
  function reverseOptions(text: ReadingText, q: ReadingTextQuestion): string[] {
    const right = text.lines[q.about ?? 0].en;
    const fromPics = q.options
      .filter((_, i) => i !== q.answer)
      .map((e) => text.lines.find((l) => l.pic !== undefined && text.pictures?.[l.pic]?.emoji === e)?.en)
      .filter((en): en is string => !!en && en !== right);
    const others = shuffle(text.lines.map((l) => l.en).filter((en) => en !== right && !fromPics.includes(en)));
    const wrong = [...new Set([...fromPics, ...others])].slice(0, Math.max(2, q.options.length - 1));
    return [right, ...wrong];
  }

  function goTo(i: number): void {
    round = i;
    draw();
  }

  function draw(): void {
    stopKaraoke();
    window.clearTimeout(sayTimer);
    revealed = false;
    hintStep = 0;
    // 🔒 Petunjuk yang sudah terbuka (pernah dijawab / pernah diklik) TETAP
    // terbuka saat soal ini dibuka lagi (bullet progress/reload).
    attempted = isHintUnlocked('reading', topic.id, section, round);
    eliminated = -1;
    const { text, q } = items[round];
    revOpts = isRev(q) ? reverseOptions(text, q) : [];
    order = q.kind === 'truefalse' ? [0, 1] : shuffle((isRev(q) ? revOpts : q.options).map((_, i) => i));
    redraw();
    const scope = container.querySelector<HTMLElement>('.rt-book-text');
    if (audio === 'auto' && scope) readAlong(scope, sentenceOf(items[round]));
  }

  function sentenceOf(it: { text: ReadingText; q: ReadingTextQuestion }): string {
    return it.q.kind === 'truefalse' ? it.q.q : it.q.kind === 'picture' ? it.text.lines[it.q.about ?? 0].en : it.q.q;
  }

  function hintText(it: { text: ReadingText; q: ReadingTextQuestion }): string {
    if (it.q.kind === 'picture') return it.text.lines[it.q.about ?? 0].id;
    return it.q.qId;
  }

  function redraw(): void {
    stopKaraoke();
    window.clearTimeout(sayTimer);
    setSectionCursor('reading', topic.id, section, round);
    const it = items[round];
    const { text, q } = it;
    const kind = q.kind ?? 'text';
    const locked = tier.hintGate && !attempted;
    const hintedLines = revealed && tier.hint === 'evidence' ? q.evidence : [];
    const hintMode = isRev(q) ? 'eliminate' : tier.hint;
    const showHintText = revealed && hintMode !== 'eliminate' && (tier.hint === 'translate' || tier.hint === 'question' || (tier.hint === 'evidence' && !q.evidence.length));
    const hintBtn = `<button class="ghost-btn hint-chip" type="button" id="hintBtn" data-action="rtHint" ${hintStep >= hintSteps(q) || locked ? 'disabled' : ''}><span class="hint-bulb">${locked ? '🔒' : '💡'}</span> ${hintLabel(q)}</button>`;
    const listenBtn = audio !== 'none' ? `<div class="speak-row"><button class="speak-btn pt-cta" type="button" data-action="rtListenQ">🔊 Dengar</button></div>` : '';
    // Soal kalimat buku (Little Stars/Starter): terjemahan tampil DI DALAM
    // kartu, tepat di bawah kalimat Inggrisnya (bukan di bawah tombol Dengar).
    const hintInCard = showHintText && !isRev(q) && (kind === 'picture' || kind === 'truefalse');
    const inlineHint = hintInCard ? `<div class="rt-book-id">${hintText(it)}</div>` : '';
    let stimulus = '';
    let optionsHtml = '';
    if (isRev(q)) {
      // Arah DIBALIK dari Latihan Inti: gambar → baca & pilih kalimatnya.
      // Tanpa 🔊 (membacakan kalimat = membocorkan jawaban).
      const instr = 'Lihat gambarnya, lalu pilih kalimat yang cocok.';
      stimulus = `
        <div class="id-text rt-instr">${instr} ${sayHtml(instr)}</div>
        <div class="rt-book-page rt-quiz-sentence rt-rev-pic"><div class="rt-book-pic" aria-hidden="true">${readingPicHtml(q.options[q.answer])}</div>${hintStep >= 1 ? `<div class="rt-book-id">${hintText(it)}</div>` : ''}</div>`;
      optionsHtml = `<div class="opt-grid rt-opts">${order.map((oi, i) => `<button class="opt-btn opt-btn-text" type="button" data-action="rtPick" data-payload="${i}">${revOpts[oi]}</button>`).join('')}</div>`;
    } else if (kind === 'picture') {
      const instr = 'Baca kalimatnya, lalu tunjuk gambarnya.';
      stimulus = `
        <div class="id-text rt-instr">${instr} ${sayHtml(instr)}</div>
        <div class="rt-book-page rt-quiz-sentence"><div class="rt-book-text">${wordsHtml(text.lines[q.about ?? 0].en)}</div>${inlineHint}</div>
        ${listenBtn}`;
      optionsHtml = `<div class="opt-grid ${order.length === 3 ? 'three' : ''}">${order.map((oi, i) => `<button class="opt-btn rt-pic-opt" type="button" data-action="rtPick" data-payload="${i}">${readingPicHtml(q.options[oi])}</button>`).join('')}</div>`;
    } else if (kind === 'truefalse') {
      const instr = 'Lihat gambarnya. Apakah kalimatnya cocok dengan gambar?';
      stimulus = `
        <div class="id-text rt-instr">${instr} ${sayHtml(instr)}</div>
        <div class="rt-book-page rt-quiz-sentence">
          <div class="rt-book-pic" aria-hidden="true">${readingPicHtml(q.picture)}</div>
          <div class="rt-book-text">${wordsHtml(q.q)}</div>
          ${inlineHint}
        </div>
        ${listenBtn}`;
      optionsHtml = `<div class="opt-grid rt-tf">
        <button class="opt-btn opt-btn-text" type="button" data-action="rtPick" data-payload="0">✅ Cocok</button>
        <button class="opt-btn opt-btn-text" type="button" data-action="rtPick" data-payload="1">❌ Tidak Cocok</button>
      </div>`;
    } else {
      const firstOfText = round === 0 || items[round - 1].text !== text;
      stimulus = `
        ${firstOfText && status(round) !== 2 ? `<div class="id-text" style="margin-bottom:8px">Baca dulu teksnya sampai habis, baru jawab ya.</div>` : ''}
        ${textCardHtml(text, { hinted: hintedLines })}
        <p class="reading-question">${q.q}</p>`;
      optionsHtml = `<div class="opt-grid rt-opts">${order.map((oi, i) => `<button class="opt-btn opt-btn-text" type="button" data-action="rtPick" data-payload="${i}">${q.options[oi]}</button>`).join('')}</div>`;
    }
    container.innerHTML = `
      <div class="latihan-head">
        <span class="stage-badge">${badge}</span>
        ${hintBtn}
      </div>
      ${quizNavHtml(round, total, status)}
      ${stimulus}
      ${showHintText && !hintInCard ? `<div class="id-text rt-hint-text">💡 ${hintText(it)}</div>` : ''}
      ${optionsHtml}
      <div class="feedback" id="fb"></div>
      <div class="rt-evidence" id="rtEvidence"></div>
    `;
    wireSay();
    wireQuizNav(goTo);
    if (eliminated >= 0) {
      const b = container.querySelectorAll<HTMLButtonElement>('.opt-btn')[order.indexOf(eliminated)];
      if (b) {
        b.disabled = true;
        b.classList.add('eliminated');
      }
    }
    setHandlers({
      rtHint: () => {
        if (hintStep >= hintSteps(q) || (tier.hintGate && !attempted)) return;
        markSlotHint('reading', topic.id, section, round);
        revealed = true;
        hintStep += 1;
        // 2 tahap (gambar → kalimat): tap 1 cuma arti, tap 2 baru coret 1 opsi.
        if (hintMode === 'eliminate' && (!isRev(q) || hintStep === 2)) {
          const n = isRev(q) ? revOpts.length : q.options.length;
          const wrong = Array.from({ length: n }, (_, i) => i).filter((i) => i !== answerIdx(q));
          eliminated = shuffle(wrong)[0] ?? -1;
        }
        redraw();
      },
      rtListenQ: () => {
        const scope = container.querySelector<HTMLElement>('.rt-book-text');
        if (scope) readAlong(scope, sentenceOf(it));
      },
      rtPick: (payload) => onAnswer(Number(payload)),
      rtLine: () => {},
      rtWord: (payload) => {
        if (audio === 'none') return;
        const w = sentenceOf(it).split(' ')[Number(payload)];
        if (w) speak(w.replace(/[^A-Za-z']/g, ''));
      },
    });
  }

  function onAnswer(i: number): void {
    const it = items[round];
    const { q } = it;
    const correct = order[i] === answerIdx(q);
    stopKaraoke();
    lockOptionButtons(container);
    const btn = container.querySelectorAll<HTMLElement>('.opt-btn')[i];
    const fb = container.querySelector<HTMLElement>('#fb')!;
    markSlotAnswered('reading', topic.id, section, round, correct, { hint: revealed, itemRef: sentenceOf(it) });
    recordAttempt(correct);
    recordEvent({ kind: 'answer', skill: 'reading', topicId: topic.id, section, slot: round, itemRef: sentenceOf(it), activity: `text-${q.kind ?? 'text'}`, correct });
    if (correct) {
      btn.classList.add('correct', 'win-burst');
      playCorrectTone();
      fireConfetti();
      const praise = pickPraise(level); // tetap dipanggil: suara pujian (TTS)
      const followWord = q.kind === 'picture' && !!q.evidenceWord && !isRev(q);
      // Ada pertanyaan lanjutan 👆 → teks pujian TIDAK ditampilkan (permintaan
      // user) supaya perhatian anak langsung ke pertanyaan berikutnya; pujian
      // tertulis muncul sesudah tulisannya ketemu ("👆 Ketemu! …").
      if (!followWord) {
        fb.textContent = praise;
        fb.className = 'feedback good';
      }
      if (followWord) askWord(it);
      // Tantangan buku mini: jawaban benar → kalimatnya dibacakan (sesudah
      // suara pujian), jadi anak mendengar kalimat yang baru ia baca sendiri.
      if (reverse && (q.kind === 'picture' || q.kind === 'truefalse')) {
        window.clearTimeout(sayTimer);
        sayTimer = window.setTimeout(() => speak(sentenceOf(it)), 1500);
      }
      else if ((q.kind ?? 'text') === 'text' && q.evidence.length) askEvidence(it);
    } else {
      attempted = true;
      btn.classList.add('wrong');
      playWrongTone();
      vibrateDevice(160);
      fb.textContent = pickEncourage(level);
      fb.className = 'feedback bad';
      const hb = container.querySelector<HTMLButtonElement>('#hintBtn');
      if (hb && hintStep < hintSteps(q)) {
        hb.disabled = false;
        hb.innerHTML = `<span class="hint-bulb">💡</span> ${hintLabel(q)}`;
      }
    }
    container.querySelector('#rtEvidence')!.insertAdjacentHTML('afterend', roundActionsHtml(allSlotsDone(total, status)));
    setHandlers({
      tryAgainRound: () => redraw(),
      nextRound: () => {
        window.clearTimeout(sayTimer);
        const next = nextUnfinishedRound(round, total, status);
        if (next < total) goTo(next);
        else onDone();
      },
    });
  }

  /** 👆 "Mana tulisan X?" (PAUD/Starter) — kata di kalimat jadi bisa ditap.
   *  Benar → hijau + tone + confetti; salah → merah + getar + tetot. */
  function askWord(it: { text: ReadingText; q: ReadingTextQuestion }): void {
    const box = container.querySelector<HTMLElement>('#rtEvidence');
    const scope = container.querySelector<HTMLElement>('.rt-book-text');
    const target = normWord(it.q.evidenceWord ?? '');
    if (!box || !scope || !target) return;
    scope.classList.add('asking');
    box.innerHTML = `<div class="rt-evidence-ask rt-ask-word"><span>👆 Mana tulisan <b>${it.q.evidenceWord}</b>?</span> <button class="rt-say" type="button" data-action="rtSayWord" aria-label="Dengarkan kata">🔊</button></div>`;
    window.setTimeout(() => speak(it.q.evidenceWord ?? ''), 900);
    let found = false;
    setHandlers({
      rtSayWord: () => speak(it.q.evidenceWord ?? ''),
      rtWord: (payload) => {
        if (found) return;
        const wi = Number(payload);
        const words = scope.querySelectorAll<HTMLElement>('.rt-word');
        const el = words[wi];
        if (normWord(el.textContent ?? '') === target) {
          found = true;
          words.forEach((w) => w.classList.remove('is-wrong'));
          el.classList.add('is-evidence');
          scope.classList.remove('asking');
          playCorrectTone();
          fireConfetti();
          box.innerHTML = `<div class="feedback good">👆 Ketemu! ${pickPraise(level)}</div>`;
          recordEvent({ kind: 'answer', skill: 'reading', topicId: topic.id, itemRef: it.q.evidenceWord ?? '', activity: 'text-word', correct: true });
        } else {
          el.classList.remove('is-wrong');
          void el.offsetWidth;
          el.classList.add('is-wrong');
          playWrongTone();
          vibrateDevice(160);
          recordEvent({ kind: 'answer', skill: 'reading', topicId: topic.id, itemRef: it.q.evidenceWord ?? '', activity: 'text-word', correct: false });
        }
      },
    });
  }

  /** 🔎 Buktinya di mana? — kalimat di kartu jadi bisa ditap. Benar →
   *  hijau + tone + confetti; salah → merah + getar + tetot (Aturan Wajib
   *  Notifikasi Jawaban Salah), boleh tap lagi. */
  function askEvidence(it: { text: ReadingText; q: ReadingTextQuestion }): void {
    const { text, q } = it;
    const card = container.querySelector<HTMLElement>('.rt-card');
    const box = container.querySelector<HTMLElement>('#rtEvidence');
    if (!card || !box) return;
    card.classList.add('tappable', 'asking');
    box.innerHTML = `<div class="rt-evidence-ask">🔎 Buktinya di mana? Tap kalimatnya di kartu.</div>`;
    let found = false;
    setHandlers({
      rtLine: (payload) => {
        if (found) return;
        const li = Number(payload);
        const lines = card.querySelectorAll<HTMLElement>('.rt-line');
        const line = lines[li];
        if (q.evidence.includes(li)) {
          found = true;
          lines.forEach((el) => el.classList.remove('is-wrong'));
          q.evidence.forEach((ei) => lines[ei]?.classList.add('is-evidence'));
          card.classList.remove('tappable', 'asking');
          playCorrectTone();
          fireConfetti();
          box.innerHTML = `<div class="feedback good">🔎 Ketemu! ${pickPraise(level)}</div>`;
          recordEvent({ kind: 'answer', skill: 'reading', topicId: topic.id, itemRef: text.lines[li].en, activity: 'text-evidence', correct: true });
        } else {
          line.classList.remove('is-wrong');
          void line.offsetWidth;
          line.classList.add('is-wrong');
          playWrongTone();
          vibrateDevice(160);
          box.innerHTML = `<div class="rt-evidence-ask">${pickEncourage(level)} Coba kalimat lain, ya.</div>`;
          recordEvent({ kind: 'answer', skill: 'reading', topicId: topic.id, itemRef: text.lines[li].en, activity: 'text-evidence', correct: false });
        }
      },
    });
  }

  draw();
}

export function runLatihanIntiText(container: HTMLElement, topic: ReadingTextTopic, onDone: OnDone, level: LevelKey, contentLevel: LevelKey): void {
  runTextQuizSet(container, topic, topic.texts, 'latihan-teks', '🔎 Baca &amp; Temukan', onDone, level, contentLevel, textTier(contentLevel).latihanAudio);
}

export function runTantanganText(container: HTMLElement, topic: ReadingTextTopic, onDone: OnDone, level: LevelKey, contentLevel: LevelKey): void {
  runTextQuizSet(container, topic, topic.newTexts, 'tantangan-teks', '📚 Baca Sendiri', onDone, level, contentLevel, textTier(contentLevel).tantanganAudio, true);
}

export function textQuizTotals(topic: ReadingTextTopic): { latihan: number; tantangan: number } {
  const count = (ts: ReadingText[]) => ts.reduce((n, t) => n + t.questions.length, 0);
  return { latihan: count(topic.texts), tantangan: count(topic.newTexts) };
}
