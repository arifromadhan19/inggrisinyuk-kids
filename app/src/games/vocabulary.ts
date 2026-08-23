import type { LevelKey, OnDone, VocabItem, VocabTopic } from '../types';
import { setHandlers } from '../interaction';
import { fireConfetti } from '../confetti';
import type { LatihanPlanSlot, SectionName } from '../progress';
import {
  ensureSection,
  getSection,
  getSlot,
  hasWordInteraction,
  markSlotAnswered,
  markWordInteraction,
  recordAttempt,
  recordEvent,
  resetSectionPlan,
  setSectionCursor,
} from '../progress';
import {
  listenAndRecordOnce,
  playCorrectTone,
  playTryAgainTone,
  speak,
  speakLocalized,
  sttSupported,
  wordMatchDetail,
} from '../speech';
import { pickEncourage, pickPraise } from '../praise';
import { shuffle } from '../util';

/**
 * Tombol "Coba Lagi"/"Lanjut" WAJIB di tiap soal (permintaan user, CLAUDE.md
 * "Format Wajib Materi Vocabulary") — muncul SETELAH jawaban (benar ATAU
 * belum tepat), ganti auto-advance via `setTimeout` yang lama di semua
 * fungsi di file ini. "Lanjut" SELALU aktif berapa pun hasilnya
 * (non-punitive — tidak pernah memaksa benar dulu baru boleh lanjut).
 * "Coba Lagi" mengulang SOAL YANG SAMA (redraw), bukan lompat ke soal lain.
 */
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

/**
 * Navigasi bebas per soal (permintaan user, Latihan Inti & Tantangan) — titik
 * status TAP BESAR (kid-friendly, CLAUDE.md "target tap besar") buat lompat
 * ke soal MANA PUN kapan saja (termasuk yang belum dijawab — tidak pernah
 * mengunci, non-punitive).
 *
 * Revisi #3 (permintaan user: "remove button kembali ... karena sudah ada
 * number di atas yang bisa diklik") — tombol "⬅️ Kembali" terpisah DIHAPUS:
 * nomor soal SEBELUMNYA sendiri sudah bisa ditap buat mundur, jadi tombol
 * "Kembali" berdiri sendiri cuma jadi jalan kedua yang identik dgn tap
 * nomor — satu cara pindah tempat sudah cukup, bukan dua yang tumpang
 * tindih (revisi #2 sebelumnya juga menghapus "➡️ Lanjut" dgn alasan sama:
 * satu-satunya "Lanjut" sekarang cuma yang pasca-jawab, `roundActionsHtml`).
 */
function quizNavHtml(current: number, total: number, statusOf: (i: number) => 0 | 1 | 2): string {
  const dots = Array.from({ length: total }, (_, i) => {
    const cls = [i === current ? 'current' : '', statusOf(i) === 2 ? 'done' : ''].filter(Boolean).join(' ');
    return `<button type="button" class="quiz-dot ${cls}" data-action="quizJump" data-payload="${i}" aria-label="Ke soal ${i + 1}">${i + 1}</button>`;
  }).join('');
  return `<div class="quiz-nav"><div class="quiz-dots">${dots}</div></div>`;
}

function wireQuizNav(goTo: (i: number) => void): void {
  setHandlers({
    quizJump: (payload) => goTo(Number(payload)),
  });
}

export function renderKenalan(container: HTMLElement, topic: VocabTopic, level: LevelKey): void {
  // Warna tombol berubah begitu sudah ditap (permintaan user) — status murni
  // visual "sudah dicoba" dari `hasWordInteraction` (progress.ts), TIDAK
  // dipakai utk skor/gating apa pun.
  const doneCls = (i: number, action: 'listen' | 'mic' | 'game'): string =>
    hasWordInteraction('vocabulary', topic.id, i, action) ? ' done' : '';

  drawWordList();

  function drawWordList(): void {
    container.innerHTML = `
      <div class="id-text" style="margin-bottom:10px;">Dengarkan kata-katanya dulu, tap 🔊 untuk mengulang${sttSupported ? ', tap 🎤 buat coba ucapkan' : ''}, atau tap 🎮 buat main sama kata itu</div>
      <div class="primer-list">
        ${topic.items
          .map(
            (it, i) => `
          <div class="primer-item">
            <div style="font-size:26px">${it.emoji}</div>
            <div class="txt"><b>${it.en}</b><span>${it.id}</span></div>
            <div class="mini-play${doneCls(i, 'listen')}" data-action="playWord" data-payload="${i}">🔊</div>
            ${sttSupported ? `<div class="mini-play${doneCls(i, 'mic')}" id="micMini${i}" data-action="micWord" data-payload="${i}">🎤</div>` : ''}
            <div class="mini-play${doneCls(i, 'game')}" data-action="gameWord" data-payload="${i}">🎮</div>
          </div>`
          )
          .join('')}
      </div>
    `;
    setHandlers({
      playWord: (payload) => {
        const i = Number(payload);
        markWordInteraction('vocabulary', topic.id, i, 'listen', topic.items[i].en);
        speak(topic.items[i].en);
        drawWordList();
      },
      micWord: (payload) => {
        const i = Number(payload);
        markWordInteraction('vocabulary', topic.id, i, 'mic', topic.items[i].en);
        recordEvent({ kind: 'interact', skill: 'vocabulary', topicId: topic.id, section: 'kenalan', slot: i, itemRef: topic.items[i].en, activity: 'mic' });
        drawWordList();
        micFor(i);
      },
      gameWord: (payload) => {
        const i = Number(payload);
        markWordInteraction('vocabulary', topic.id, i, 'game', topic.items[i].en);
        recordEvent({ kind: 'interact', skill: 'vocabulary', topicId: topic.id, section: 'kenalan', slot: i, itemRef: topic.items[i].en, activity: 'game' });
        runWordMiniGame(container, topic, topic.items[i], drawWordList, level);
      },
    });
  }

  // Popup kompak (permintaan user) — beda dari layar mic penuh di First
  // Placement Test (games/placement.ts `drawOpenMic`): di sini cuma 1 kata
  // per item, jadi hasilnya ditumpuk di overlay ringkas, bukan layar
  // sendiri. Tetap ikut CLAUDE.md "Aturan Wajib Speaking": bintang
  // proporsional dari wordMatchDetail (bukan pass/fail longgar) + tombol
  // "Play Suaramu" — direkam paralel via listenAndRecordOnce persis pola
  // yang sama dgn placement test.
  function openMicResultPopup(it: VocabItem, index: number, said: string | null, errorText: string | null): void {
    const overlay = document.createElement('div');
    overlay.className = 'mic-pop-overlay';

    let starRow = '';
    let wordsHtml = '';
    let heardLine = '';
    let praiseLine = '';
    let perfect = false;
    if (said !== null) {
      const words = wordMatchDetail(said, it.en);
      const hitRatio = words.length ? words.filter((w) => w.matched).length / words.length : 0;
      const stars = hitRatio >= 0.8 ? 3 : hitRatio >= 0.4 ? 2 : 1;
      perfect = stars === 3;
      starRow = '⭐'.repeat(stars) + '☆'.repeat(3 - stars);
      wordsHtml = words.map((w) => `<span class="${w.matched ? 'ok' : 'miss'}">${w.word}</span>`).join('');
      heardLine = `<div class="heard-text">Terdengar: "${said}"</div>`;
      // Tone + pujian/semangat (CLAUDE.md Aturan Wajib) — bahasa ikut level
      // (permintaan user: level awal Indonesia, level tinggi Inggris).
      if (perfect) {
        playCorrectTone();
        fireConfetti();
      } else playTryAgainTone();
      praiseLine = `<div class="feedback good" style="margin-top:6px">${perfect ? pickPraise(level) : pickEncourage(level)}</div>`;
      recordEvent({
        kind: 'speak',
        skill: 'vocabulary',
        topicId: topic.id,
        section: 'kenalan',
        slot: index,
        itemRef: it.en,
        activity: 'mic',
        graded: false,
        score: Math.round(hitRatio * 100),
        detail: { heard: said, words },
      });
    }

    overlay.innerHTML = `
      <div class="mic-pop-card">
        <div style="font-size:38px" aria-hidden="true">${it.emoji}</div>
        <div class="en-text" style="margin:2px 0 10px">${it.en}</div>
        ${
          said !== null
            ? `<div class="${perfect ? 'win-burst' : ''}" style="font-size:20px;letter-spacing:3px" aria-hidden="true">${starRow}</div>
               <div class="word-diff" style="margin:8px 0">${wordsHtml}</div>
               ${heardLine}
               ${praiseLine}
               <div class="speak-row" style="margin:12px 0 2px">
                 <button class="speak-btn" type="button" id="micPopPlayMine" data-action="micPopPlayMine" disabled>▶️ Play Suaramu</button>
               </div>`
            : `<p class="meta" style="margin:10px 0">${errorText}</p>`
        }
        <div class="round-actions">
          <button class="ghost-btn" type="button" data-action="micPopTryAgain">🔁 Coba Lagi</button>
          <button class="primary-btn" type="button" data-action="micPopClose" style="margin-top:0">Lanjut ➡️</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
    setHandlers({
      micPopClose: () => overlay.remove(),
      micPopTryAgain: () => {
        overlay.remove();
        micFor(index);
      },
      micPopPlayMine: () => {
        const url = overlay.dataset.audioUrl;
        if (url) new Audio(url).play().catch(() => {});
      },
    });
  }

  function micFor(index: number): void {
    const it = topic.items[index];
    const btn = document.getElementById(`micMini${index}`);
    if (!btn || btn.classList.contains('listening')) return;
    btn.classList.add('listening');
    listenAndRecordOnce(
      (said) => {
        btn.classList.remove('listening');
        openMicResultPopup(it, index, said, null);
      },
      (kind) => {
        btn.classList.remove('listening');
        // 'aborted' = anak tap 🔊 kata lain (atau kata yg sama) pas mic
        // masih aktif — `speech.ts` `stopListening()` menghentikannya
        // paksa supaya audio TTS tidak ikut ketranskrip. Jangan buka popup
        // error, itu bukan STT gagal dengar (race condition, dilaporkan
        // user).
        if (kind === 'aborted') return;
        openMicResultPopup(it, index, null, 'Belum kedengaran, coba lagi ya 🎧');
      },
      (audioUrl) => {
        // Bisa nyala SETELAH popup sudah dirender (MediaRecorder.onstop
        // async, sama pola dgn drawOpenMic) — patch tombolnya belakangan.
        const overlay = document.querySelector<HTMLElement>('.mic-pop-overlay');
        if (!overlay) return;
        overlay.dataset.audioUrl = audioUrl;
        const playBtn = overlay.querySelector<HTMLButtonElement>('#micPopPlayMine');
        if (playBtn) playBtn.disabled = false;
      }
    );
  }
}

/** Ganti kata target di kalimat contoh dgn "___" (case-insensitive, whole
 *  word) — dasar soal "Lengkapi Kalimat" di bawah. Semua `example.en` di
 *  content.ts sudah sengaja memuat kata targetnya persis (mis. "I have one
 *  apple." utk item "One"), jadi replace ini selalu ketemu. */
function blankSentence(sentence: string, word: string): string {
  const re = new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
  return sentence.replace(re, '___');
}

/**
 * Mini-game "Main" di Kenalan (permintaan user, CLAUDE.md "Format Wajib
 * Materi Vocabulary" poin 1) — SOAL WAJIB NYAMBUNG ke kosakata topiknya
 * (audit user: sebelumnya SEMUA topik dipaksa jadi soal "ada berapa X ini"
 * dgn emoji kata itu sendiri diulang — relevan utk topik Angka, tapi random
 * & tidak masuk akal utk topik lain, mis. "ada berapa dokter ini?").
 * Sekarang 2 tipe soal, dipilih otomatis dari BENTUK topiknya sendiri
 * (`isNumberTopic`, bukan hardcode topic id — supaya topik angka baru di
 * level lain ikut kebaca otomatis):
 *  - Topik Angka: gambar buah diulang SESUAI NILAI kata target (bukan angka
 *    acak lagi), jawaban pilihan ganda KATA Inggris-nya (One/Two/…, bukan
 *    digit) — sesuai kosakata yang sedang dipelajari (permintaan user).
 *  - Topik lain: "Apa bahasa Inggrisnya [kata Indonesia]?", pilihan ganda
 *    TEKS Inggris tanpa ikon (permintaan user eksplisit "tanpa pakai icon")
 *    — memaksa anak mengingat kata, bukan cuma cocokkan gambar (yang sudah
 *    jadi tipe soal lain di Latihan Inti).
 */
const NUMBER_WORDS = [
  'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
  'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty',
];

function numberWordValue(en: string): number | null {
  const idx = NUMBER_WORDS.indexOf(en.trim().toLowerCase());
  return idx >= 0 ? idx + 1 : null;
}

function isNumberTopic(topic: VocabTopic): boolean {
  return topic.items.every((it) => numberWordValue(it.en) !== null);
}

/** Objek yang dihitung di soal Angka — bukan emoji kata itu sendiri (kata
 *  angka cuma py emoji digit, mis. "Three" → "3️⃣", tidak bisa diulang jadi
 *  gambar hitungan), diulang SEBANYAK nilai kata target. */
const COUNT_OBJECTS = [
  { emoji: '🍎', id: 'apel' },
  { emoji: '🍌', id: 'pisang' },
  { emoji: '🍇', id: 'anggur' },
  { emoji: '🍊', id: 'jeruk' },
  { emoji: '🍓', id: 'stroberi' },
];

interface WordQuestion {
  visual: string;
  prompt: string;
  target: string;
  options: string[];
}

function buildNumberQuestion(topic: VocabTopic, item: VocabItem): WordQuestion {
  const count = numberWordValue(item.en)!;
  const obj = COUNT_OBJECTS[Math.floor(Math.random() * COUNT_OBJECTS.length)];
  const distractors = shuffle(topic.items.filter((i) => i !== item)).slice(0, 3);
  return {
    visual: `<div class="big-emoji" style="letter-spacing:8px;font-size:clamp(34px,9vw,52px)" aria-hidden="true">${obj.emoji.repeat(count)}</div>`,
    prompt: `Ada berapa ${obj.id} ini?`,
    target: item.en,
    options: shuffle([item, ...distractors]).map((i) => i.en),
  };
}

function buildTranslateQuestion(topic: VocabTopic, item: VocabItem): WordQuestion {
  const distractors = shuffle(topic.items.filter((i) => i !== item)).slice(0, 3);
  return {
    visual: '',
    prompt: `Apa bahasa Inggrisnya <b>"${item.id}"</b>?`,
    target: item.en,
    options: shuffle([item, ...distractors]).map((i) => i.en),
  };
}

function buildWordQuestion(topic: VocabTopic, item: VocabItem): WordQuestion {
  return isNumberTopic(topic) ? buildNumberQuestion(topic, item) : buildTranslateQuestion(topic, item);
}

function drawWordQuestion(container: HTMLElement, badge: string, idText: string, q: WordQuestion): void {
  container.innerHTML = `
    <span class="stage-badge">${badge}</span>
    <div class="id-text">${idText}</div>
    ${q.visual}
    <p class="reading-question">${q.prompt}</p>
    <div class="opt-grid three">
      ${q.options.map((label, i) => `<button class="opt-btn opt-btn-text" data-action="pick" data-payload="${i}">${label}</button>`).join('')}
    </div>
    <div class="feedback" id="fb"></div>
  `;
}

/** Tombol 🎮 per kata di daftar Kenalan (permintaan user: "kenapa belum ada
 *  button main di setiap kata") — 1 soal fokus ke kata itu saja, balik ke
 *  daftar kata sesudahnya, BUKAN lanjut ke Latihan Inti. */
function runWordMiniGame(container: HTMLElement, topic: VocabTopic, item: VocabItem, onBack: OnDone, level: LevelKey): void {
  function draw(): void {
    const q = buildWordQuestion(topic, item);
    drawWordQuestion(container, `🎮 MAIN · ${item.en}`, 'Yuk coba!', q);
    setHandlers({
      pick: (payload) => {
        const i = Number(payload);
        onAnswer(q.options[i] === q.target, container.querySelectorAll<HTMLElement>('.opt-btn')[i]);
      },
    });
  }

  function onAnswer(correct: boolean, btn: HTMLElement): void {
    lockOptionButtons(container);
    const fb = container.querySelector<HTMLElement>('#fb')!;
    if (correct) {
      recordAttempt(true);
      btn.classList.add('correct', 'win-burst');
      playCorrectTone();
      fireConfetti();
      fb.textContent = pickPraise(level);
      fb.className = 'feedback good';
    } else {
      recordAttempt(false);
      btn.classList.add('wrong');
      fb.textContent = pickEncourage(level);
      fb.className = 'feedback bad';
    }
    recordEvent({ kind: 'answer', skill: 'vocabulary', topicId: topic.id, itemRef: item.en, activity: 'word-mini', correct });
    fb.insertAdjacentHTML('afterend', roundActionsHtml(true));
    setHandlers({
      tryAgainRound: () => draw(),
      nextRound: () => onBack(),
    });
  }

  draw();
}

type LatihanKind = 'hear' | 'toEn' | 'toId' | 'sentence';
type LatihanQuestion = { kind: LatihanKind; target: VocabItem; distractors: VocabItem[] };

const LATIHAN_ROUND_SIZE = 10;

/**
 * Komposisi TETAP 4 tipe soal (permintaan user, berlaku SEMUA level/topik
 * Vocab — bukan cuma topik `iconAmbiguous`) — dulu cuma 2 tipe rata (audio+
 * sentence per kata), sekarang di-mix supaya anak latihan DUA ARAH (Inggris→
 * Indonesia DAN Indonesia→Inggris, "paham penggunaan", bukan cuma satu
 * arah dengar):
 *  - 2× 'hear' — dengar TTS Inggris, tebak jawabannya (format lama; emoji
 *    utk topik biasa, teks utk topik `iconAmbiguous` — lihat `drawAudio`).
 *  - 2× 'toEn' — "Apa bahasa Inggrisnya '[Indonesia]'?" + emoji + TTS
 *    Indonesia (`speakLocalized`) → pilihan ganda TEKS INGGRIS.
 *  - 3× 'toId' — "Apa bahasa Indonesianya '[Inggris]'?" + emoji + TTS
 *    Inggris (`speak`) → pilihan ganda TEKS INDONESIA.
 *  - 3× 'sentence' — kalimat contoh dgn kata dikosongkan (format lama,
 *    tidak berubah).
 * PRD §16/CLAUDE.md "Format Wajib Materi Vocabulary" — rule ini berlaku di
 * SEMUA level, jangan diubah balik ke rata 2-tipe tanpa arahan baru user.
 */
const LATIHAN_KIND_COUNTS: [LatihanKind, number][] = [
  ['hear', 2],
  ['toEn', 2],
  ['toId', 3],
  ['sentence', 3],
];

/** Ambil `count` kata dari `items`, SEMUA kata muncul dulu sebelum ada yang
 *  berulang (cycle lewat copy `items` yang di-shuffle ulang tiap putaran,
 *  bukan urutan sama diulang) — dipakai baik utk assign kata Latihan Inti
 *  (permintaan user: "semua kata harus keluar") maupun jatah 5-soal tiap
 *  tab Tantangan. */
function pickItemsForCount(items: VocabItem[], count: number): VocabItem[] {
  let pool: VocabItem[] = [];
  while (pool.length < count) pool = pool.concat(shuffle(items));
  return pool.slice(0, count);
}

/**
 * Kata: SEMUA kata topik WAJIB keluar dulu sebelum ada yang berulang
 * (permintaan user: "semua kata harus keluar, soal kata yang dilatih harus
 * berbeda-beda menyesuaikan kata yang diberikan") — `targets` diambil
 * SEKALIGUS dari 10 slot (bukan per-tipe soal independen spt sebelumnya,
 * yang bisa bikin 1 kata muncul 3× sementara kata lain 0× kalau topiknya
 * pas 10 kata). Tipe soal (`LATIHAN_KIND_COUNTS`, 2/2/3/3) dipasangkan
 * ACAK & INDEPENDEN dari urutan kata, supaya kata yang sama tidak selalu
 * dapat tipe soal yang sama tiap topik dibuka.
 */
function buildLatihanOrder(topic: VocabTopic): LatihanQuestion[] {
  const targets = pickItemsForCount(topic.items, LATIHAN_ROUND_SIZE);
  const kinds = shuffle(LATIHAN_KIND_COUNTS.flatMap(([kind, count]) => Array<LatihanKind>(count).fill(kind)));
  const questions: LatihanQuestion[] = targets.map((item, i) => ({
    kind: kinds[i],
    target: item,
    distractors: shuffle(topic.items.filter((it) => it !== item)).slice(0, 3),
  }));
  return shuffle(questions);
}

/** Hint/clue "didampingi" (permintaan user, CLAUDE.md poin 2 — Latihan Inti
 *  WAJIB ada bantuan, beda dari Tantangan yang sengaja TANPA bantuan) —
 *  pola 50/50 BENERAN (permintaan user: sebelumnya cuma matiin 1 dari 3
 *  opsi salah, sisa 3 pilihan — bukan 50/50): sekali tap, matiin 2 opsi
 *  SALAH acak (dim, tidak bisa ditap) dari 4 opsi, sisa PERSIS 2 (1 benar +
 *  1 salah) — tombolnya sendiri lalu nonaktif (sekali pakai per soal). */
function wireHint(container: HTMLElement, opts: VocabItem[], target: VocabItem, onUsed?: () => void): void {
  let used = false;
  setHandlers({
    hint: () => {
      if (used) return;
      const btns = container.querySelectorAll<HTMLButtonElement>('.opt-btn');
      const wrongIdx = opts.map((_, i) => i).filter((i) => opts[i] !== target && !btns[i].disabled);
      if (wrongIdx.length) {
        used = true;
        const toEliminate = shuffle(wrongIdx).slice(0, Math.min(2, wrongIdx.length));
        toEliminate.forEach((pick) => {
          btns[pick].disabled = true;
          btns[pick].classList.add('eliminated');
        });
        const hintBtn = container.querySelector<HTMLButtonElement>('#hintBtn');
        if (hintBtn) hintBtn.disabled = true;
        onUsed?.();
      }
    },
  });
}

// Tombol Petunjuk pindah ke ATAS, sejajar stage-badge (permintaan user:
// "button petunjuk nya simpan di atas sejajarkan dengan text") — dipasang
// via `.latihan-head` (flex row), bukan `.hint-row` lama (block penuh di
// bawah opsi, sekarang tidak dipakai lagi di sini).
const hintButtonHtml = `<button class="ghost-btn hint-chip" type="button" id="hintBtn" data-action="hint">💡 Petunjuk</button>`;

/**
 * Kartu jawaban 2×2 dgn gambar + teks + lencana huruf (permintaan user: "ada
 * analogi dibantu oleh image", contoh dari kompetitor) — dipilih sbg konsep
 * BARU Latihan Inti Vocab, dipasang PERTAMA di Little Stars topik awal
 * sbg contoh (`drawAudio`/`drawSentence`) sebelum diperluas ke topik/skill
 * lain. `.opt-btn` DIPERTAHANKAN sbg co-class (bukan diganti) — hint/lock
 * logic (`wireHint`, `lockOptionButtons`, `onAnswer`) query lewat
 * `.opt-btn`, jadi semua behavior lama tetap jalan, cuma visualnya yang
 * berubah lewat `.answer-card`. Emoji tiap opsi = emoji KATA opsi itu
 * sendiri (bukan target) — jadi analogi visual per pilihan, bukan cuma
 * dekorasi target seperti sebelumnya (yang bisa jadi celah nebak-lewat-
 * gambar khusus di soal toEn/toId, karena itu emoji target di prompt lama
 * DIHAPUS di `drawAudio`).
 */
const ANSWER_CARD_LETTERS = ['A', 'B', 'C', 'D'];
function answerCardsHtml(options: { emoji: string; label: string }[], action: string): string {
  return `<div class="opt-grid">
    ${options
      .map(
        (o, i) => `
      <button class="opt-btn answer-card" type="button" data-action="${action}" data-payload="${i}">
        <span class="answer-card-emoji" aria-hidden="true">${o.emoji}</span>
        <span class="answer-card-bottom">
          <span class="answer-card-label">${o.label}</span>
          <span class="answer-card-badge" aria-hidden="true">${ANSWER_CARD_LETTERS[i] ?? i + 1}</span>
        </span>
      </button>`
      )
      .join('')}
  </div>`;
}

/**
 * Latihan Inti — permintaan user: status "sudah dikerjakan" per soal WAJIB
 * bertahan begitu topik dibuka ulang, plus navigasi bebas ⬅️ Kembali/➡️
 * Lanjut antar 10 soal. Dua hal itu butuh "soal ke-N" punya IDENTITAS STABIL
 * lintas sesi — `buildLatihanOrder()` sendiri MENGACAK tiap dipanggil, jadi
 * urutannya dimaterialisasi SEKALI jadi `plan` (progress.ts `ensureSection`)
 * & disimpan permanen utk topik ini; dibaca ulang (bukan di-acak lagi) tiap
 * kali Latihan Inti dibuka. Distraktor TETAP boleh beda tiap render — yang
 * harus stabil cuma identitas soal (kind + kata target), bukan posisi opsi.
 */
export function runLatihanInti(container: HTMLElement, topic: VocabTopic, onDone: OnDone, level: LevelKey): void {
  const buildPlan = (): LatihanPlanSlot[] =>
    buildLatihanOrder(topic).map((q) => ({ kind: q.kind, item: topic.items.indexOf(q.target) }));
  let section = ensureSection('vocabulary', topic.id, 'latihan', buildPlan);
  // Plan lama (format sebelum revisi mix 4-tipe DAN sebelum revisi "semua
  // kata harus keluar") tidak pernah beregenerasi sendiri (`ensureSection`
  // cuma build SEKALI) — perangkat yang sudah pernah buka Latihan Inti
  // topik ini SEBELUM salah satu revisi itu nyangkut selamanya di format
  // lama kalau tidak dideteksi & dibangun ulang di sini (dilaporkan user:
  // "kenapa tidak ada perubahan"). Dua sinyal basi: (a) plan pra-4-tipe
  // TIDAK PERNAH punya kind 'toEn'/'toId'; (b) plan pra-cakupan-penuh bisa
  // saja SUDAH punya 'toEn'/'toId' (revisi sebelumnya) tapi kata targetnya
  // belum tentu unik/menutupi semua kata topik (revisi INI).
  const plan = section.plan ?? [];
  const hasNewKinds = plan.some((s) => s.kind === 'toEn' || s.kind === 'toId');
  const expectedCoverage = Math.min(topic.items.length, LATIHAN_ROUND_SIZE);
  const actualCoverage = new Set(plan.map((s) => s.item)).size;
  const isStalePlan = !hasNewKinds || actualCoverage < expectedCoverage;
  if (isStalePlan) {
    resetSectionPlan('vocabulary', topic.id, 'latihan', buildPlan());
    section = ensureSection('vocabulary', topic.id, 'latihan');
  }
  const order: LatihanQuestion[] = (section.plan ?? []).map((slot) => {
    const target = topic.items[slot.item] ?? topic.items[0];
    return { kind: slot.kind, target, distractors: shuffle(topic.items.filter((i) => i !== target)).slice(0, 3) };
  });
  let round = Math.min(Math.max(section.cursor, 0), order.length - 1);
  let hintUsedThisSlot = false;

  const slotStatus = (i: number): 0 | 1 | 2 => getSlot('vocabulary', topic.id, 'latihan', i)?.st ?? 0;

  function goTo(i: number): void {
    round = Math.min(Math.max(i, 0), order.length - 1);
    setSectionCursor('vocabulary', topic.id, 'latihan', round);
    draw();
  }

  function draw(): void {
    if (round >= order.length) return onDone();
    hintUsedThisSlot = false;
    const q = order[round];
    if (q.kind === 'sentence') drawSentence(q);
    else drawAudio(q);
  }

  function redraw(): void {
    const q = order[round];
    if (q.kind === 'sentence') drawSentence(q);
    else drawAudio(q);
  }

  function onAnswer(correct: boolean, btn: HTMLElement): void {
    lockOptionButtons(container);
    const fb = container.querySelector<HTMLElement>('#fb')!;
    const q = order[round];
    if (correct) {
      recordAttempt(true);
      // Celebrate "podium" + tone + pujian sesuai level, diucapkan juga
      // (permintaan user, CLAUDE.md Aturan Wajib apresiasi).
      btn.classList.add('correct', 'win-burst');
      playCorrectTone();
      fireConfetti();
      fb.textContent = pickPraise(level);
      fb.className = 'feedback good';
    } else {
      recordAttempt(false);
      btn.classList.add('wrong');
      fb.textContent = pickEncourage(level);
      fb.className = 'feedback bad';
    }
    // "Setiap mencoba pakai di save" (permintaan user) — penanda per soal
    // (warna dot navigasi) + log mentah buat analitik/rapor.
    markSlotAnswered('vocabulary', topic.id, 'latihan', round, correct, { hint: hintUsedThisSlot, itemRef: q.target.en });
    recordEvent({
      kind: 'answer',
      skill: 'vocabulary',
      topicId: topic.id,
      section: 'latihan',
      slot: round,
      itemRef: q.target.en,
      activity: q.kind,
      correct,
      hintUsed: hintUsedThisSlot,
    });
    fb.insertAdjacentHTML('afterend', roundActionsHtml(round === order.length - 1));
    setHandlers({
      tryAgainRound: () => redraw(),
      // BEDA dari `goTo` (nav bebas, di-clamp ke slot terakhir) — tombol
      // pasca-jawab di soal TERAKHIR harus benar-benar menutup section
      // (round jadi >= order.length, ketangkap guard di `draw()`).
      nextRound: () => {
        round += 1;
        setSectionCursor('vocabulary', topic.id, 'latihan', Math.min(round, order.length - 1));
        draw();
      },
    });
  }

  /**
   * 3 dari 4 tipe soal Latihan Inti (semua kecuali 'sentence', lihat
   * `LATIHAN_KIND_COUNTS`) — permintaan user: "jangan hanya 'goodbye'",
   * di-mix 2 arah lagi selain dengar murni, SEMUA level/topik (bukan cuma
   * topik `iconAmbiguous`), supaya anak latihan paham DUA ARAH (Inggris↔
   * Indonesia, PRD §16 "paham penggunaan bukan cuma satu arah"):
   *  - 'hear' — dengar TTS Inggris, tebak jawabannya. Opsi emoji utk topik
   *    biasa (benda konkret, emoji tidak ambigu); opsi TEKS utk topik
   *    `iconAmbiguous` (emoji-nya proxy ekspresi yang bisa multi tafsir,
   *    mis. Salam & Sopan Santun — audit user).
   *  - 'toEn' — "Apa bahasa Inggrisnya '[Indonesia]'?" + emoji ilustrasi +
   *    TTS Indonesia (`speakLocalized`) → pilihan ganda TEKS INGGRIS.
   *  - 'toId' — "Apa bahasa Indonesianya '[Inggris]'?" + emoji ilustrasi +
   *    TTS Inggris (`speak`) → pilihan ganda TEKS INDONESIA.
   * Emoji di 'toEn'/'toId' SENGAJA cuma ilustrasi (bukan penentu jawaban —
   * opsinya teks), jadi aman dipakai di topik `iconAmbiguous` juga tanpa
   * menghidupkan lagi bug "emoji multi tafsir".
   */
  function drawAudio(q: LatihanQuestion): void {
    const opts = shuffle([q.target, ...q.distractors]);

    let promptHtml: string;
    let cardsHtml: string;
    let playPrompt: () => void;
    if (q.kind === 'toEn') {
      // Tanpa emoji target di prompt (dulu ada) — sekarang tiap kartu opsi
      // py emoji-nya sendiri, jadi emoji di prompt cuma jadi celah nebak
      // lewat cocok-gambar tanpa perlu paham arti kata (permintaan user:
      // gambar sbg analogi per PILIHAN, bukan bocoran jawaban).
      promptHtml = `<p class="reading-question">Apa bahasa Inggrisnya <b>"${q.target.id}"</b>? <button class="speak-btn" type="button" data-action="replay" style="margin-left:6px">🔊</button></p>`;
      cardsHtml = answerCardsHtml(opts.map((o) => ({ emoji: o.emoji, label: o.en })), 'pick');
      playPrompt = () => speakLocalized(q.target.id, 'id-ID');
    } else if (q.kind === 'toId') {
      promptHtml = `<p class="reading-question">Apa bahasa Indonesianya <b>"${q.target.en}"</b>? <button class="speak-btn" type="button" data-action="replay" style="margin-left:6px">🔊</button></p>`;
      cardsHtml = answerCardsHtml(opts.map((o) => ({ emoji: o.emoji, label: o.id })), 'pick');
      playPrompt = () => speak(q.target.en);
    } else {
      // Kartu SELALU emoji+teks (permintaan user) — bekas cabang
      // `iconAmbiguous` emoji-only vs teks-only sudah tidak perlu lagi:
      // teks di tiap kartu otomatis menghilangkan ambiguitas emoji ekspresi,
      // jadi berlaku sama utk topik biasa maupun `iconAmbiguous`. Teks
      // Indonesia di topik `iconAmbiguous` tetap dipertahankan sbg konteks
      // TAMBAHAN (bukan pengganti kartu).
      promptHtml = `<div class="speak-row"><button class="speak-btn" data-action="replay">🔊 Dengar Lagi</button></div>${topic.iconAmbiguous ? `<div class="id-text">${q.target.id}</div>` : ''}`;
      cardsHtml = answerCardsHtml(opts.map((o) => ({ emoji: o.emoji, label: o.en })), 'pick');
      playPrompt = () => speak(q.target.en);
    }

    container.innerHTML = `
      <div class="latihan-head">
        <span class="stage-badge">🎯 Tebak &amp; Cocokkan</span>
        ${hintButtonHtml}
      </div>
      ${quizNavHtml(round, order.length, slotStatus)}
      <div class="id-text">Soal ${round + 1} dari ${order.length}</div>
      ${promptHtml}
      ${cardsHtml}
      <div class="feedback" id="fb"></div>
    `;
    playPrompt();
    wireHint(container, opts, q.target, () => (hintUsedThisSlot = true));
    wireQuizNav(goTo);

    setHandlers({
      replay: playPrompt,
      pick: (payload) => {
        const i = Number(payload);
        onAnswer(opts[i] === q.target, container.querySelectorAll<HTMLElement>('.opt-btn')[i]);
      },
    });
  }

  /** Soal "Lengkapi Kalimat" (permintaan user) — kalimat contoh dari
   *  content.ts dgn kata target dikosongkan, anak pilih kata Inggris yang
   *  pas dari 4 opsi teks (bukan emoji, reuse .opt-btn-text spt vocab
   *  First Placement Test). Terjemahan Indonesia tetap ditampilkan sbg
   *  bantuan konteks — beda dari Reading (First Placement Test) yang
   *  sengaja menyembunyikan terjemahan, Vocab memang tujuannya mengajarkan
   *  pasangan kata EN-ID, bukan tes komprehensi baca. */
  function drawSentence(q: LatihanQuestion): void {
    const opts = shuffle([q.target, ...q.distractors]);
    const blanked = blankSentence(q.target.example.en, q.target.en);

    container.innerHTML = `
      <div class="latihan-head">
        <span class="stage-badge">🎯 Lengkapi Kalimat</span>
        ${hintButtonHtml}
      </div>
      ${quizNavHtml(round, order.length, slotStatus)}
      <div class="id-text">Soal ${round + 1} dari ${order.length}</div>
      <div class="en-text">${blanked}</div>
      <div class="id-text">${q.target.example.id}</div>
      ${answerCardsHtml(
        opts.map((o) => ({ emoji: o.emoji, label: o.en })),
        'pickWord'
      )}
      <div class="feedback" id="fb"></div>
    `;
    wireHint(container, opts, q.target, () => (hintUsedThisSlot = true));
    wireQuizNav(goTo);

    setHandlers({
      pickWord: (payload) => {
        const i = Number(payload);
        onAnswer(opts[i] === q.target, container.querySelectorAll<HTMLElement>('.opt-btn')[i]);
      },
    });
  }

  draw();
}

/**
 * Tantangan — 3 TAB independen (permintaan user: "jadi 3 tab... 5 soal",
 * total 15 soal), masing-masing PERSIS `TANTANGAN_TAB_SIZE` (5) soal.
 * Revisi dari versi 2-tab sebelumnya (Eja Kata ALL kata di topik + Contoh
 * Penggunaan yang menggabung ucap→susun berantai per kata):
 *  1. ✏️ Eja Kata — susun huruf (`runEjaKata`, kata tunggal saja lewat
 *     `singleWordItems`, tidak berubah dari sebelumnya).
 *  2. 🔤 Susun Kalimat — terjemahkan ID→EN dari word bank (`runSusunKalimat`,
 *     dulu "fase susun" di dalam Contoh Penggunaan, sekarang tab sendiri).
 *  3. 🗣️ Contoh Penggunaan — dengar+ucapkan mic (`runUcapan`, dulu "fase
 *     ucap", sekarang tab sendiri — TIDAK lagi otomatis lanjut ke susun
 *     kalimat, karena itu sekarang tab terpisah).
 * Ketiganya independen (permintaan user sebelumnya: "kalau ingin kembali ke
 * tantangan sebelumnya susah") — pindah tab kapan saja, masing-masing resume
 * dari cursor SENDIRI (`ensureTantanganPlan`/`ensureSection`).
 */
const TANTANGAN_TAB_SIZE = 5;

/** Ambil PERSIS `TANTANGAN_TAB_SIZE` kata per tab Tantangan (permintaan
 *  user) dari `eligible` (boleh subset, mis. `singleWordItems` utk Eja
 *  Kata) — plan-nya PERSISTEN per section (reuse tipe `LatihanPlanSlot[]`
 *  punya Latihan Inti; field `kind` diabaikan di sini, selalu diisi
 *  placeholder). Dibangun ulang OTOMATIS kalau plan yang tersimpan beda
 *  format/panjang dari yang diharapkan sekarang — device yang sudah pernah
 *  buka tab ini SEBELUM direstruktur ke 3-tab/5-soal (dulu tanpa `plan`
 *  sama sekali) bakal nyangkut selamanya kalau tidak dideteksi & dibangun
 *  ulang (pola sama dgn fix stale-plan Latihan Inti, dilaporkan user
 *  "kenapa tidak ada perubahan"). */
function ensureTantanganPlan(topicId: string, section: SectionName, eligible: VocabItem[]): VocabItem[] {
  const buildPlan = (): LatihanPlanSlot[] =>
    pickItemsForCount(eligible, TANTANGAN_TAB_SIZE).map((it) => ({ kind: 'sentence', item: eligible.indexOf(it) }));
  const s = ensureSection('vocabulary', topicId, section, buildPlan);
  if (!s.plan || s.plan.length !== TANTANGAN_TAB_SIZE) {
    resetSectionPlan('vocabulary', topicId, section, buildPlan());
  }
  return (getSection('vocabulary', topicId, section)!.plan ?? []).map((slot) => eligible[slot.item] ?? eligible[0]);
}

export function runTantangan(container: HTMLElement, topic: VocabTopic, onDone: OnDone, level: LevelKey): void {
  function shellHtml(active: 'eja' | 'susun' | 'penggunaan'): string {
    return `
      <div class="tantangan-tabs">
        <button class="tantangan-tab ${active === 'eja' ? 'active' : ''}" type="button" data-action="tabEja">✏️ Eja Kata</button>
        <button class="tantangan-tab ${active === 'susun' ? 'active' : ''}" type="button" data-action="tabSusun">🔤 Susun Kalimat</button>
        <button class="tantangan-tab ${active === 'penggunaan' ? 'active' : ''}" type="button" data-action="tabPenggunaan">🗣️ Penggunaan</button>
      </div>
      <div id="tantanganStage"></div>
    `;
  }

  // Tab bisa dipindah MANUAL kapan saja (klik tab-bar, lihat `shellHtml`) —
  // tapi menuntaskan 5 soal tab yang SEDANG dibuka otomatis LANJUT ke tab
  // berikutnya (Eja→Susun→Penggunaan→Selesai), bukan langsung ke layar
  // "Kerja Bagus!" begitu 1 tab selesai (dilaporkan user: nyelesain Eja Kata
  // langsung loncat ke Selesai, padahal Susun Kalimat & Contoh Penggunaan
  // belum disentuh). `onDone` (parameter `runTantangan`, ujungnya
  // `renderSelesai` di app.ts) cuma dipanggil sesudah SEMUA 3 tab tuntas.
  function openEja(): void {
    container.innerHTML = shellHtml('eja');
    setHandlers({ tabEja: openEja, tabSusun: openSusun, tabPenggunaan: openPenggunaan });
    runEjaKata(container.querySelector<HTMLElement>('#tantanganStage')!, topic.id, topic.items, openSusun, level);
  }

  function openSusun(): void {
    container.innerHTML = shellHtml('susun');
    setHandlers({ tabEja: openEja, tabSusun: openSusun, tabPenggunaan: openPenggunaan });
    runSusunKalimat(container.querySelector<HTMLElement>('#tantanganStage')!, topic.id, topic.items, openPenggunaan, level);
  }

  function openPenggunaan(): void {
    container.innerHTML = shellHtml('penggunaan');
    setHandlers({ tabEja: openEja, tabSusun: openSusun, tabPenggunaan: openPenggunaan });
    runUcapan(container.querySelector<HTMLElement>('#tantanganStage')!, topic.id, topic.items, onDone, level);
  }

  openEja();
}

/** Kata SATU KATA saja (permintaan user: "di ejaan kata wajib satu kata
 *  dulu") — frasa 2+ kata (mis. "Good Morning", "Thank You") bikin bank
 *  huruf harus menyertakan tile SPASI, yang membingungkan buat anak (paling
 *  kentara di topik Salam & Sopan Santun, Little Stars — 4 dari 10 kata
 *  frasa). Fallback ke daftar lengkap kalau topiknya KEBETULAN semua frasa
 *  (defensif — supaya tidak pernah render layar kosong). */
function singleWordItems(items: VocabItem[]): VocabItem[] {
  const filtered = items.filter((it) => !it.en.includes(' '));
  return filtered.length > 0 ? filtered : items;
}

/** Bagian 1 dari Tantangan: eja kata lewat chip huruf acak — TANPA hint
 *  (permintaan user: Tantangan sengaja tanpa clue, beda dari Latihan Inti).
 *  PERSIS `TANTANGAN_TAB_SIZE` soal, kata tunggal saja (`ensureTantanganPlan`
 *  + `singleWordItems`). */
function runEjaKata(container: HTMLElement, topicId: string, allItems: VocabItem[], onDone: OnDone, level: LevelKey): void {
  const items = ensureTantanganPlan(topicId, 'tantangan-eja', singleWordItems(allItems));
  let round = Math.min(Math.max(getSection('vocabulary', topicId, 'tantangan-eja')?.cursor ?? 0, 0), items.length - 1);
  let slots: (string | null)[] = [];
  let bank: { ch: string; used: boolean; idx: number }[] = [];
  // Jejak huruf yang ditaruh ANAK SENDIRI (bukan hint) — {slot, bi} per
  // taruhan, BUKAN cuma bank-index (permintaan user: hint sekarang posisi
  // ACAK, bukan prefix berurutan, jadi "huruf terakhir" tidak lagi selalu
  // di index slot yang bisa dihitung dari panjang array — harus disimpan
  // eksplisit slot MANA yang ditaruh, supaya "Hapus Huruf" selalu hapus
  // slot yang benar apa pun posisi hint-nya).
  let placedOrder: { slot: number; bi: number }[] = [];
  let answered = false;
  // Petunjuk Eja Kata (permintaan user: "munculkan ejaan yang tepat 60% dan
  // 40%-nya dikosongkan", lalu direvisi "buat random jangan berurutan") —
  // SATU-satunya hint eksplisit di Tantangan (beda sengaja dari Susun
  // Kalimat/Penggunaan yang tetap tanpa hint sebelum 2x gagal). `hintedSlots`
  // = SET index slot yang diisi otomatis (posisi ACAK, bukan prefix) —
  // sekali pakai per KATA (`hintUsed`, direset tiap kata baru di `draw`/
  // `goTo`) — TAPI "Coba Lagi"/"Ulang Susunan" (`setup`) tetap mempertahankan
  // hint yang sudah diambil, non-punitive, tidak menghukum percobaan ulang.
  let hintUsed = false;
  let hintedSlots: Set<number> = new Set();

  const slotStatus = (i: number): 0 | 1 | 2 => getSlot('vocabulary', topicId, 'tantangan-eja', i)?.st ?? 0;

  function goTo(i: number): void {
    round = Math.min(Math.max(i, 0), items.length - 1);
    setSectionCursor('vocabulary', topicId, 'tantangan-eja', round);
    const it = items[round];
    answered = false;
    hintUsed = false;
    hintedSlots = new Set();
    setup(it);
    paint(it);
    speak(it.en);
  }

  function applyHintedSlots(it: VocabItem): void {
    hintedSlots.forEach((pos) => {
      slots[pos] = it.en[pos].toUpperCase();
      const tile = bank.find((b) => b.idx === pos);
      if (tile) tile.used = true;
    });
  }

  function setup(it: VocabItem): void {
    slots = new Array(it.en.length).fill(null);
    placedOrder = [];
    bank = shuffle(
      it.en
        .toUpperCase()
        .split('')
        .map((ch, i) => ({ ch, used: false, idx: i }))
    );
    applyHintedSlots(it);
  }

  function draw(): void {
    if (round >= items.length) return onDone();
    answered = false;
    hintUsed = false;
    hintedSlots = new Set();
    const it = items[round];
    setup(it);
    paint(it);
    speak(it.en);
  }

  function paint(it: VocabItem): void {
    // "Petunjuk" jawaban PENUH SETELAH 2x gagal (permintaan user) — beda
    // dari tombol "💡 Petunjuk" di atas (60% prefix, sekali pakai, sebelum
    // gagal); `w` (wrongCount) sudah tersimpan+sinkron per slot
    // (progress.ts), jadi baca dari sana, bukan counter baru.
    const wrongSoFar = getSlot('vocabulary', topicId, 'tantangan-eja', round)?.w ?? 0;
    const answerHintHtml =
      wrongSoFar >= 2 ? `<p class="meta" style="margin:4px 0 0;text-align:center">💡 Jawabannya: <b>${it.en.toUpperCase()}</b></p>` : '';

    container.innerHTML = `
      ${quizNavHtml(round, items.length, slotStatus)}
      <div class="id-text">Kata ${round + 1} dari ${items.length}</div>
      <div class="big-emoji">${it.emoji}</div>
      <div class="speak-row"><button class="speak-btn" data-action="replay">🔊 Dengar Kata</button></div>
      ${answerHintHtml}
      <div class="answer-row">
        ${slots
          .map((s, i) =>
            s
              ? `<span class="chip placed letter${hintedSlots.has(i) ? ' hint' : ''}">${s}</span>`
              : `<span class="chip letter" style="opacity:.35">_</span>`
          )
          .join('')}
      </div>
      <div class="bank-row">
        ${bank
          .map((b, bi) => `<span class="chip letter ${b.used ? 'hidden' : ''}" data-action="pickLetter" data-payload="${bi}">${b.ch}</span>`)
          .join('')}
      </div>
      <div class="feedback" id="fb"></div>
      ${
        answered
          ? ''
          : `<div class="letter-actions">
        <button class="ghost-btn slim" type="button" id="hintBtn" data-action="hint" ${hintUsed ? 'disabled' : ''}>💡 Petunjuk</button>
        <button class="ghost-btn slim" type="button" data-action="removeLast" ${placedOrder.length === 0 ? 'disabled' : ''}>⌫ Hapus Huruf</button>
        <button class="ghost-btn slim" type="button" data-action="clearLetters">🔄 Ulang Susunan</button>
      </div>`
      }
    `;
    wireQuizNav(goTo);

    setHandlers({
      replay: () => speak(it.en),
      // Posisi ACAK (permintaan user: "buat random jangan berurutan") —
      // pilih `Math.round(len*0.6)` index unik acak dari seluruh kata,
      // BUKAN prefix dari awal lagi.
      hint: () => {
        if (hintUsed || answered) return;
        hintUsed = true;
        const hintCount = Math.round(it.en.length * 0.6);
        const positions = shuffle(Array.from({ length: it.en.length }, (_, i) => i));
        hintedSlots = new Set(positions.slice(0, hintCount));
        setup(it);
        paint(it);
      },
      // "Ulang Susunan" cuma bersihkan huruf yang anak taruh SENDIRI
      // (`placedOrder`) — huruf hint tetap dipertahankan (`setup` selalu
      // menerapkan ulang `hintedSlots` yang sudah ada).
      clearLetters: () => {
        if (answered) return;
        setup(it);
        paint(it);
      },
      // Hapus SATU huruf terakhir yang ditaruh SENDIRI oleh anak (permintaan
      // user: "remove tapi per karakter", tetap harus berfungsi normal
      // walau hint sekarang posisi acak) — `placedOrder` menyimpan SLOT
      // PERSIS tempat tiap taruhan anak berada, jadi selalu tepat hapus
      // slot yang benar apa pun posisi hint-nya (bukan hitung dari panjang
      // array lagi, yang cuma valid kalau pengisian selalu berurutan).
      removeLast: () => {
        if (answered || placedOrder.length === 0) return;
        const last = placedOrder.pop()!;
        bank[last.bi].used = false;
        slots[last.slot] = null;
        paint(it);
      },
      pickLetter: (payload) => {
        if (answered) return;
        const bi = Number(payload);
        if (bank[bi].used) return;
        const emptyIndex = slots.findIndex((x) => x === null);
        if (emptyIndex === -1) return;
        slots[emptyIndex] = bank[bi].ch;
        bank[bi].used = true;
        placedOrder.push({ slot: emptyIndex, bi });
        paint(it);
        if (slots.every((x) => x !== null)) {
          answered = true;
          // `paint(it)` di atas SUDAH merender `.letter-actions` (`answered`
          // masih false saat itu) — hapus langsung dari DOM di sini, bukan
          // andalkan render ulang, supaya "Petunjuk"/"Hapus Huruf"/"Ulang
          // Susunan" benar-benar hilang begitu soal ini kelar (permintaan
          // user). Krusial utk "Ulang Susunan" — dulu bisa ditap SETELAH
          // benar/salah, `clearLetters` reset papan tapi TIDAK reset
          // `answered`, jadi papan kelihatan kosong tapi `pickLetter` diam-
          // diam selalu `return` duluan (bug "tidak bisa diisi/klik").
          container.querySelector('.letter-actions')?.remove();
          const built = slots.join('');
          const correct = built.toLowerCase() === it.en.toLowerCase();
          const fb = container.querySelector<HTMLElement>('#fb')!;
          if (correct) {
            recordAttempt(true);
            container.querySelector<HTMLElement>('.big-emoji')?.classList.add('win-burst');
            playCorrectTone();
            fireConfetti();
            fb.textContent = pickPraise(level);
            fb.className = 'feedback good';
          } else {
            recordAttempt(false);
            fb.textContent = pickEncourage(level);
            fb.className = 'feedback bad';
          }
          markSlotAnswered('vocabulary', topicId, 'tantangan-eja', round, correct, { itemRef: it.en });
          recordEvent({
            kind: 'answer',
            skill: 'vocabulary',
            topicId,
            section: 'tantangan-eja',
            slot: round,
            itemRef: it.en,
            activity: 'eja',
            correct,
          });
          fb.insertAdjacentHTML('afterend', roundActionsHtml(round === items.length - 1));
          setHandlers({
            tryAgainRound: () => {
              // `answered` HARUS direset SEBELUM `paint(it)` (bug: kalau
              // sesudah, render "Coba Lagi" ini masih baca `answered=true`
              // jadi `.letter-actions` ikut disembunyikan lagi — padahal
              // harusnya Petunjuk/Hapus Huruf/Ulang Susunan tampil normal
              // begitu mulai coba ulang, permintaan user).
              answered = false;
              setup(it);
              paint(it);
            },
            nextRound: () => {
              round += 1;
              setSectionCursor('vocabulary', topicId, 'tantangan-eja', Math.min(round, items.length - 1));
              draw();
            },
          });
        }
      },
    });
  }

  draw();
}

/**
 * Tab "🗣️ Contoh Penggunaan" — dengar+ucapkan (mic) kalimat konteks kata
 * ini (CLAUDE.md "Aturan Wajib" Speaking: skor proporsional `wordMatchDetail`
 * + "Play Suaramu", direkam paralel best-effort). Dulu "fase 1" berantai ke
 * susun kalimat (`runContohPenggunaan`) — sekarang tab BERDIRI SENDIRI
 * (permintaan user: 3 tab terpisah, 5 soal masing-masing), jadi "Lanjut"
 * di sini maju ke soal UCAP berikutnya, bukan pindah ke Susun Kalimat lagi.
 */
function runUcapan(container: HTMLElement, topicId: string, allItems: VocabItem[], onDone: OnDone, level: LevelKey): void {
  const items = ensureTantanganPlan(topicId, 'tantangan-ucap', allItems);
  let round = Math.min(Math.max(getSection('vocabulary', topicId, 'tantangan-ucap')?.cursor ?? 0, 0), items.length - 1);

  const ucapStatus = (i: number): 0 | 1 | 2 => getSlot('vocabulary', topicId, 'tantangan-ucap', i)?.st ?? 0;

  function draw(): void {
    if (round >= items.length) return onDone();
    drawUcap(items[round]);
  }

  function goTo(i: number): void {
    round = Math.min(Math.max(i, 0), items.length - 1);
    setSectionCursor('vocabulary', topicId, 'tantangan-ucap', round);
    drawUcap(items[round]);
  }

  function advance(): void {
    round += 1;
    setSectionCursor('vocabulary', topicId, 'tantangan-ucap', Math.min(round, items.length - 1));
    draw();
  }

  function drawUcap(it: VocabItem): void {
    const ex = it.example;
    container.innerHTML = `
      ${quizNavHtml(round, items.length, ucapStatus)}
      <div class="id-text">Kata "${it.en}" · ${round + 1} dari ${items.length}</div>
      <div class="big-emoji" style="font-size:40px;">${ex.emoji}</div>
      <div class="en-text">${ex.en}</div>
      <div class="id-text">${ex.id}</div>
      <div class="speak-row"><button class="speak-btn" data-action="replay">🔊 Dengar Contoh</button></div>
      <div class="mic-wrap">
        <button class="mic-btn" id="micBtn" data-action="mic">🎤</button>
        <div class="mic-hint">${sttSupported ? 'Tap mic, coba ucapkan kalimatnya' : 'Mikrofon tidak didukung browser ini'}</div>
      </div>
      <div id="micResult"></div>
      <div class="feedback" id="fb"></div>
      ${sttSupported ? '' : `<button class="ghost-btn" data-action="skip">✅ Aku Sudah Coba Ucapkan</button>`}
    `;
    wireQuizNav(goTo);

    let recordedAudioUrl: string | null = null;

    setHandlers({
      replay: () => speak(ex.en),
      skip: advance,
      playMine: () => {
        if (recordedAudioUrl) new Audio(recordedAudioUrl).play().catch(() => {});
      },
      mic: () => {
        const btn = container.querySelector<HTMLElement>('#micBtn')!;
        btn.classList.add('listening');
        listenAndRecordOnce(
          (said) => {
            btn.classList.remove('listening');
            btn.setAttribute('disabled', 'true');
            const words = wordMatchDetail(said, ex.en);
            const hitRatio = words.length ? words.filter((w) => w.matched).length / words.length : 0;
            const stars = hitRatio >= 0.8 ? 3 : hitRatio >= 0.4 ? 2 : 1;
            const starRow = '⭐'.repeat(stars) + '☆'.repeat(3 - stars);
            const wordsHtml = words.map((w) => `<span class="${w.matched ? 'ok' : 'miss'}">${w.word}</span>`).join('');
            const perfect = stars === 3;
            const score = Math.round(hitRatio * 100);
            if (perfect) {
              btn.classList.add('win-burst');
              playCorrectTone();
              fireConfetti();
            } else {
              playTryAgainTone();
            }
            markSlotAnswered('vocabulary', topicId, 'tantangan-ucap', round, perfect, { score, itemRef: it.en });
            recordEvent({
              kind: 'speak',
              skill: 'vocabulary',
              topicId,
              section: 'tantangan-ucap',
              slot: round,
              itemRef: it.en,
              activity: 'ucap',
              graded: false,
              score,
              detail: { heard: said, words },
            });
            container.querySelector<HTMLElement>('#micResult')!.innerHTML = `
              <div style="font-size:20px;letter-spacing:3px;text-align:center;margin-top:10px" aria-hidden="true">${starRow}</div>
              <div class="word-diff" style="margin-top:6px">${wordsHtml}</div>
              <div class="heard-text">Terdengar: "${said}"</div>
              <div class="speak-row" style="margin-top:8px">
                <button class="speak-btn" type="button" id="playMineBtn" data-action="playMine" disabled>▶️ Play Suaramu</button>
              </div>
            `;
            const fb = container.querySelector<HTMLElement>('#fb')!;
            fb.textContent = perfect ? pickPraise(level) : pickEncourage(level);
            fb.className = 'feedback good';
            fb.insertAdjacentHTML('afterend', roundActionsHtml(round === items.length - 1));
            setHandlers({
              tryAgainRound: () => drawUcap(it),
              nextRound: advance,
            });
          },
          (kind) => {
            btn.classList.remove('listening');
            // 'aborted' — lihat komentar `stopListening()` di speech.ts:
            // anak tap "🔊 Dengar Contoh" pas mic masih aktif, reset diam-
            // diam, bukan error STT.
            if (kind === 'aborted') return;
            container.querySelector<HTMLElement>('#fb')!.textContent = 'Belum kedengaran, coba lagi 🎧';
          },
          (audioUrl) => {
            // Bisa nyala SETELAH hasil mic dirender (MediaRecorder.onstop
            // async, sama pola dgn Kenalan/First Placement Test).
            recordedAudioUrl = audioUrl;
            const playBtn = container.querySelector<HTMLButtonElement>('#playMineBtn');
            if (playBtn) playBtn.disabled = false;
          }
        );
      },
    });
  }

  draw();
}

/**
 * Tab "🔤 Susun Kalimat" — kalimat Indonesia (`example.id`) ditampilkan sbg
 * soal, anak susun kata Inggris (`example.en`) jadi terjemahannya lewat word
 * bank. TANPA hint sebelum 2x gagal (Tantangan). Dulu "fase susun" di dalam
 * Contoh Penggunaan (`runContohPenggunaan`) — sekarang tab BERDIRI SENDIRI
 * (permintaan user: 3 tab terpisah, 5 soal masing-masing).
 */
function runSusunKalimat(container: HTMLElement, topicId: string, allItems: VocabItem[], onDone: OnDone, level: LevelKey): void {
  const items = ensureTantanganPlan(topicId, 'tantangan-susun', allItems);
  let round = Math.min(Math.max(getSection('vocabulary', topicId, 'tantangan-susun')?.cursor ?? 0, 0), items.length - 1);

  const susunStatus = (i: number): 0 | 1 | 2 => getSlot('vocabulary', topicId, 'tantangan-susun', i)?.st ?? 0;

  function draw(): void {
    if (round >= items.length) return onDone();
    drawSusun(items[round]);
  }

  function goTo(i: number): void {
    round = Math.min(Math.max(i, 0), items.length - 1);
    setSectionCursor('vocabulary', topicId, 'tantangan-susun', round);
    drawSusun(items[round]);
  }

  function drawSusun(it: VocabItem): void {
    const ex = it.example;
    const words = ex.en.replace('.', '').split(' ');
    let answer: { w: string; idx: number }[] = [];
    let bank = shuffle(words.map((w, i) => ({ w, used: false, idx: i })));
    let answered = false;

    function paint(): void {
      // "Petunjuk" jawaban setelah 2x gagal (permintaan user) — sama
      // seperti Eja Kata, dibaca dari `wrongCount` slot yang sudah
      // tersimpan, bukan counter baru.
      const wrongSoFar = getSlot('vocabulary', topicId, 'tantangan-susun', round)?.w ?? 0;
      const answerHintHtml =
        wrongSoFar >= 2 ? `<p class="meta" style="margin:6px 0 0;text-align:center">💡 Jawabannya: <b>${ex.en}</b></p>` : '';

      container.innerHTML = `
        <span class="stage-badge">🌟 Terjemahkan</span>
        ${quizNavHtml(round, items.length, susunStatus)}
        <div class="id-text">Susun jadi Bahasa Inggris dari kalimat ini · ${round + 1} dari ${items.length}</div>
        <div class="big-emoji" style="font-size:36px;">${ex.emoji}</div>
        <div class="en-text" style="color:var(--c-vocab)">"${ex.id}"</div>
        ${answerHintHtml}
        <div class="answer-row ${answer.length ? '' : 'empty'}" style="margin-top:10px">
          ${answer.map((a, ai) => `<span class="chip placed" data-action="unpick" data-payload="${ai}">${a.w}</span>`).join('')}
        </div>
        <div class="bank-row">
          ${bank.map((b, bi) => `<span class="chip ${b.used ? 'hidden' : ''}" data-action="pick" data-payload="${bi}">${b.w}</span>`).join('')}
        </div>
        <div class="feedback" id="fb"></div>
        ${
          answered
            ? ''
            : `<div class="letter-actions">
          <button class="ghost-btn" type="button" data-action="removeLastWord" ${answer.length === 0 ? 'disabled' : ''}>⌫ Hapus Kata</button>
          <button class="ghost-btn" type="button" data-action="clear">🔄 Bersihkan</button>
        </div>`
        }
      `;
      wireQuizNav(goTo);

      setHandlers({
        clear: () => {
          if (answered) return;
          answer = [];
          bank = shuffle(words.map((w, i) => ({ w, used: false, idx: i })));
          paint();
        },
        // Hapus SATU kata terakhir yang ditaruh (permintaan user: fitur
        // remove per-kata, berdampingan dgn "Bersihkan") — beda dari
        // `unpick` yang bisa hapus kata mana pun (klik chip-nya langsung).
        removeLastWord: () => {
          if (answered || answer.length === 0) return;
          const last = answer[answer.length - 1];
          answer = answer.slice(0, -1);
          bank.find((b) => b.idx === last.idx)!.used = false;
          paint();
        },
        // "Cek Jawaban" DIHAPUS (permintaan user) — begitu semua kata
        // tersusun (`answer.length === words.length`), langsung evaluasi
        // otomatis, anak tidak perlu tap tombol cek lagi.
        pick: (payload) => {
          if (answered) return;
          const bi = Number(payload);
          if (bank[bi].used) return;
          bank[bi].used = true;
          answer.push(bank[bi]);
          paint();
          if (answer.length === words.length) checkAnswer();
        },
        unpick: (payload) => {
          if (answered) return;
          const ai = Number(payload);
          const item = answer[ai];
          answer.splice(ai, 1);
          bank.find((b) => b.idx === item.idx)!.used = false;
          paint();
        },
      });
    }

    function checkAnswer(): void {
      if (answered || !answer.length) return;
      answered = true;
      // `paint()` yang barusan jalan (dari `pick()`) sudah merender
      // `.letter-actions` sebelum `answered` jadi true — hapus langsung dari
      // DOM di sini (bukan render ulang), supaya "Hapus Kata"/"Bersihkan"
      // tidak nyangkut kelihatan aktif sesudah soal ini kelar (konsisten
      // dgn fix serupa di Eja Kata — permintaan user).
      container.querySelector('.letter-actions')?.remove();
      const fb = container.querySelector<HTMLElement>('#fb')!;
      const built = answer.map((a) => a.w).join(' ');
      const correct = built.toLowerCase() === words.join(' ').toLowerCase();
      if (correct) {
        recordAttempt(true);
        container.querySelector<HTMLElement>('.big-emoji')?.classList.add('win-burst');
        playCorrectTone();
        fireConfetti();
        fb.textContent = pickPraise(level);
        fb.className = 'feedback good';
        speak(ex.en);
      } else {
        recordAttempt(false);
        fb.textContent = pickEncourage(level);
        fb.className = 'feedback bad';
      }
      markSlotAnswered('vocabulary', topicId, 'tantangan-susun', round, correct, { itemRef: it.en });
      recordEvent({
        kind: 'answer',
        skill: 'vocabulary',
        topicId,
        section: 'tantangan-susun',
        slot: round,
        itemRef: it.en,
        activity: 'susun',
        correct,
      });
      fb.insertAdjacentHTML('afterend', roundActionsHtml(round === items.length - 1));
      setHandlers({
        tryAgainRound: () => {
          answered = false;
          answer = [];
          bank = shuffle(words.map((w, i) => ({ w, used: false, idx: i })));
          paint();
        },
        nextRound: () => {
          round += 1;
          setSectionCursor('vocabulary', topicId, 'tantangan-susun', Math.min(round, items.length - 1));
          draw();
        },
      });
    }

    paint();
  }

  draw();
}
