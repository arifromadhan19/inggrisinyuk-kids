import type { LevelKey, OnDone, SpeakingInterviewTopic, SpeakingPhraseItem, SpeakingPhraseTopic, SpeakingStoryTopic, SpeakingTopic } from '../types';
import { setHandlers } from '../interaction';
import type { LatihanPlanSlot } from '../progress';
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
import { listenAndRecordOnce, playCorrectTone, playTryAgainTone, speak, speakLocalized, speakSequence, sttSupported, wordMatchDetail } from '../speech';
import { pickEncourage, pickPraise } from '../praise';
import { fireConfetti } from '../confetti';
import { shuffle } from '../util';

export function renderKenalan(container: HTMLElement, topic: SpeakingTopic, onNext: OnDone): void {
  container.innerHTML = `
    <div class="id-text" style="margin-bottom:10px;">Dengarkan cara mengucapkannya dulu, ya!</div>
    <div class="primer-list">
      ${topic.model
        .map(
          (m, i) => `
        <div class="primer-item">
          <div class="txt"><b>${m}</b></div>
          <div class="mini-play" data-action="play" data-payload="${i}">🔊</div>
        </div>`
        )
        .join('')}
    </div>
    <button class="primary-btn" data-action="advance">Lanjut ke Latihan Inti →</button>
  `;
  setHandlers({
    play: (payload) => speak(topic.model[Number(payload)]),
    advance: () => onNext(),
  });
}

/**
 * 🔒 Fix Aturan Wajib Speaking (permintaan user, audit sesi Little Stars):
 * versi lama fungsi ini SEBELUMNYA pakai `looseMatch` biner + auto-advance
 * HANYA kalau match ("Kamu bilang..." lalu diam kalau meleset, `setTimeout`
 * kalau berhasil) — PELANGGARAN LANGSUNG ke Aturan Wajib CLAUDE.md di atas
 * (skor proporsional + Play Suaramu WAJIB, bukan cuma "rekam lalu selesai"),
 * DAN gating "harus match dulu baru lanjut" tidak adil krn ASR anak tidak
 * selalu akurat (`progress.ts` `Store.correctAttempts` comment: "ASR anak
 * tidak selalu akurat"). Sekarang REUSE `scoreMic()`/`listenAndRecordOnce`/
 * `roundActionsHtml` yang sama dgn format BARU di bawah (1 file, fungsi
 * generik dipakai bersama — bukan duplikat lagi krn levelnya sama-sama
 * `games/speaking.ts`) — skor proporsional + Play Suaramu + SELALU tampil
 * "Lanjut" apa pun skornya (non-punitive, konsisten `games/vocabulary.ts`
 * `runUcapan` yang jadi acuan pola ini). Skor mic TETAP TIDAK masuk
 * `recordAttempt()` (konsisten format baru, alasan sama).
 */
export function runLatihanInti(container: HTMLElement, topic: SpeakingTopic, onDone: OnDone, level: LevelKey): void {
  let round = 0;

  function draw(): void {
    if (round >= topic.drill.length) return onDone();
    const phrase = topic.drill[round];
    container.innerHTML = `
      <span class="stage-badge">🎯 Ucapkan &amp; Cek</span>
      <div class="id-text">Soal ${round + 1} dari ${topic.drill.length}</div>
      <div class="en-text">"${phrase}"</div>
      <div class="speak-row"><button class="speak-btn" type="button" data-action="replay">🔊 Dengar Contoh</button></div>
      <div class="mic-wrap">
        <button class="mic-btn" id="micBtn" type="button" data-action="mic">🎤</button>
        <div class="mic-hint">${sttSupported ? 'Tap mic, lalu ucapkan kalimatnya' : 'Mikrofon tidak didukung browser ini'}</div>
      </div>
      <div id="micResult"></div>
      <div class="feedback" id="fb"></div>
      ${sttSupported ? '' : `<button class="ghost-btn" type="button" data-action="skip">✅ Aku Sudah Coba Ucapkan</button>`}
    `;

    setHandlers({
      replay: () => speak(phrase),
      skip: () => {
        round += 1;
        draw();
      },
      mic: () => micFor(),
    });

    function micFor(): void {
      const btn = container.querySelector<HTMLElement>('#micBtn')!;
      if (btn.classList.contains('listening')) return;
      btn.classList.add('listening');
      let recordedAudioUrl: string | null = null;
      listenAndRecordOnce(
        (said) => {
          btn.classList.remove('listening');
          btn.setAttribute('disabled', 'true');
          const s = scoreMic(said, phrase);
          if (s.perfect) {
            playCorrectTone();
            fireConfetti();
          } else playTryAgainTone();
          recordEvent({
            kind: 'speak',
            skill: 'speaking',
            topicId: topic.id,
            section: 'latihan',
            slot: round,
            itemRef: phrase,
            activity: 'mic',
            graded: false,
            score: Math.round(s.hitRatio * 100),
            detail: { heard: said },
          });
          container.querySelector<HTMLElement>('#micResult')!.innerHTML = `
          <div class="${s.perfect ? 'win-burst' : ''}" style="font-size:22px;letter-spacing:3px;text-align:center;margin-top:14px" aria-hidden="true">${s.starRow}</div>
          <p class="mic-score">🎯 ${s.matchedCount} dari ${s.totalCount} kata kedengaran <span class="mic-score-pct">(${Math.round(s.hitRatio * 100)}%)</span></p>
          <div class="word-diff">${s.wordsHtml}</div>
          <div class="heard-text">Terdengar: "${said}"</div>
          <div class="speak-row"><button class="speak-btn" type="button" id="playMineBtn" data-action="playMine" disabled>▶️ Play Suaramu</button></div>
        `;
          const fb = container.querySelector<HTMLElement>('#fb')!;
          fb.textContent = s.perfect ? pickPraise(level) : pickEncourage(level);
          fb.className = 'feedback good';
          fb.insertAdjacentHTML('afterend', roundActionsHtml(round === topic.drill.length - 1));
          setHandlers({
            replay: () => speak(phrase),
            playMine: () => {
              if (recordedAudioUrl) new Audio(recordedAudioUrl).play().catch(() => {});
            },
            tryAgainRound: () => draw(),
            nextRound: () => {
              round += 1;
              draw();
            },
          });
        },
        (kind) => {
          btn.classList.remove('listening');
          // 'aborted' — mic dihentikan paksa krn "🔊 Dengar Contoh"
          // ditap pas masih dengar (speech.ts `stopListening()`), bukan
          // STT gagal — reset diam-diam.
          if (kind === 'aborted') return;
          container.querySelector<HTMLElement>('#fb')!.textContent = 'Belum kedengaran, coba lagi 🎧';
        },
        (audioUrl) => {
          recordedAudioUrl = audioUrl;
          const playBtn = container.querySelector<HTMLButtonElement>('#playMineBtn');
          if (playBtn) playBtn.disabled = false;
        }
      );
    }
  }

  draw();
}

/**
 * 🔒 Fix Aturan Wajib Speaking (sama alasan `runLatihanInti` di atas) — beda
 * dari `drill`, `roleplay` di sini TIDAK PUNYA target tetap (pertanyaan
 * dijawab BEBAS, mis. "What's your name?") — jadi skor proporsional
 * `wordMatchDetail` TIDAK BERLAKU di sini (tidak ada "kata target" utk
 * dibandingkan, konsisten kenapa aturan itu selalu berbunyi "rasio kata
 * TARGET vs yang kedengaran"). "▶️ Play Suaramu" TETAP WAJIB (bagian dari
 * aturan yang TIDAK bersyarat ada-tidaknya target) — direkam via
 * `listenAndRecordOnce` (bukan `listenOnce` lagi), + tombol manual
 * "Lanjut ➡️" (BUKAN auto-advance `setTimeout` lagi) supaya anak sempat
 * dengar suaranya sendiri dulu kalau mau, baru lanjut giliran berikutnya.
 */
export function runTantangan(container: HTMLElement, topic: SpeakingTopic, onDone: OnDone, level: LevelKey): void {
  let turn = 0;

  function draw(): void {
    if (turn >= topic.roleplay.length) return onDone();
    const q = topic.roleplay[turn];
    container.innerHTML = `
      <span class="stage-badge">🌟 Mini-Roleplay</span>
      <div class="turn-dots">${topic.roleplay.map((_, i) => `<div class="turn-dot ${i <= turn ? 'on' : ''}"></div>`).join('')}</div>
      <div class="id-text">Giliran ${turn + 1} dari ${topic.roleplay.length}</div>
      <div class="en-text">🦁 "${q}"</div>
      <div class="speak-row"><button class="speak-btn" type="button" data-action="replay">🔊 Dengar Lagi</button></div>
      <div class="mic-wrap">
        <button class="mic-btn" id="micBtn" type="button" data-action="mic">🎤</button>
        <div class="mic-hint">${sttSupported ? 'Tap mic, jawab pertanyaannya bebas' : 'Mikrofon tidak didukung browser ini'}</div>
      </div>
      <div id="micResult"></div>
      <div class="feedback" id="fb"></div>
      ${sttSupported ? '' : `<button class="ghost-btn" type="button" data-action="skip">✅ Aku Sudah Jawab</button>`}
    `;
    speak(q);

    setHandlers({
      replay: () => speak(q),
      skip: () => {
        turn += 1;
        draw();
      },
      mic: () => micFor(),
    });

    function micFor(): void {
      const btn = container.querySelector<HTMLElement>('#micBtn')!;
      if (btn.classList.contains('listening')) return;
      btn.classList.add('listening');
      let recordedAudioUrl: string | null = null;
      listenAndRecordOnce(
        (said) => {
          btn.classList.remove('listening');
          btn.setAttribute('disabled', 'true');
          playCorrectTone();
          fireConfetti();
          recordEvent({
            kind: 'speak',
            skill: 'speaking',
            topicId: topic.id,
            section: 'tantangan',
            slot: turn,
            itemRef: q,
            activity: 'roleplay',
            graded: false,
            detail: { heard: said },
          });
          container.querySelector<HTMLElement>('#micResult')!.innerHTML = `
            <div class="heard-text">Kamu jawab: "${said}"</div>
            <div class="speak-row"><button class="speak-btn" type="button" id="playMineBtn" data-action="playMine" disabled>▶️ Play Suaramu</button></div>
          `;
          const fb = container.querySelector<HTMLElement>('#fb')!;
          fb.textContent = pickPraise(level);
          fb.className = 'feedback good';
          fb.insertAdjacentHTML('afterend', roundActionsHtml(turn === topic.roleplay.length - 1));
          setHandlers({
            playMine: () => {
              if (recordedAudioUrl) new Audio(recordedAudioUrl).play().catch(() => {});
            },
            tryAgainRound: () => draw(),
            nextRound: () => {
              turn += 1;
              draw();
            },
          });
        },
        (kind) => {
          btn.classList.remove('listening');
          if (kind === 'aborted') return; // lihat komentar setara di runLatihanInti di atas
          container.querySelector<HTMLElement>('#fb')!.textContent = 'Belum kedengaran, coba lagi 🎧';
        },
        (audioUrl) => {
          recordedAudioUrl = audioUrl;
          const playBtn = container.querySelector<HTMLButtonElement>('#playMineBtn');
          if (playBtn) playBtn.disabled = false;
        }
      );
    }
  }

  draw();
}

/**
 * ================================================================
 * Format KEDUA (`SpeakingPhraseTopic`, types.ts) — khusus Little Stars.
 * Riset lengkap + rationale desain: `materi/speaking.md`. Fungsi lama di
 * atas (`renderKenalan`/`runLatihanInti`/`runTantangan`) TETAP dipakai apa
 * adanya utk Explorer/Adventurer (`SpeakingTopic` lama, roleplay bebas) —
 * `app.ts` membedakan lewat `'items' in topic` (types.ts `AnySpeakingTopic`).
 *
 * 3 langkah, tangga TASK SHAPE naik (permintaan user "wajib ada
 * improvement" — SEMUA kompetitor yang diriset, LIA/EF/Kumon/Duolingo,
 * cuma py 1 bentuk tugas: dengar→tirukan/echo, `materi/speaking.md` §4):
 *   1. Kenalan "🎮 Main · Dengar & Tunjuk" — RECOGNIZE: dengar frasa, tunjuk
 *      gambar yang cocok (comprehension-first, blm diminta produksi sendiri
 *      — pola Cambridge Starters Part 1 "listen, point").
 *   2. Latihan Inti "🎤 Tirukan Ucapannya!" — IMITATE: frasa+terjemahan
 *      KELIHATAN, dengar contoh, tirukan lewat mic — pola universal semua
 *      kompetitor (Kumon "Look, Listen, Repeat", LIA/EF TPR).
 *   3. Tantangan "🗣️ Coba Ucapkan dalam Bahasa Inggris" — **🔒 REVISI, lihat
 *      komentar lengkap di `runTantanganPhrase` di bawah**: awalnya RECALL
 *      murni (cuma gambar, TANPA teks/audio apa pun) — dinilai "sangat susah"
 *      utk usia ini (blind recall tanpa anchor), diganti TRANSLATE & SPEAK
 *      (terjemahan Indonesia SELALU tampil sbg anchor, anak produksi versi
 *      Inggrisnya) — TETAP beda & lebih sulit dari Latihan Inti (produksi
 *      dari MAKNA, bukan cuma tirukan bunyi yang baru didengar).
 * Recognize < Imitate < Recall — 3 keterampilan beda yang saling melengkapi,
 * prinsip sama dgn kenapa Latihan Inti Vocab py 4 tipe soal (bukan 1 tipe
 * diulang) & tangga 2-arah Reading Little Stars (`materi/reading.md` §4.1).
 *
 * 🔒 Mic di SEMUA 3 langkah WAJIB ikut "Aturan Wajib: Setiap Fitur Speaking
 * Butuh Skor Proporsional + 'Play Suaramu'" (CLAUDE.md) — `scoreMic()` di
 * bawah (skor dari `wordMatchDetail`, BUKAN `looseMatch` biner spt fungsi
 * lama di atas) + `listenAndRecordOnce` (rekam paralel utk "▶️ Play
 * Suaramu"), REUSE PERSIS pola `games/placement.ts` `drawOpenMic` &
 * `games/listening.ts`/`games/reading.ts` Kenalan — duplikat lokal
 * (konvensi sama: helper generik diduplikasi per file game, BUKAN diimpor
 * lintas file skill, supaya fungsi lama yang stabil tidak ikut berisiko
 * regresi). Skor mic SENGAJA TIDAK masuk `recordAttempt()`/akurasi (`kind:
 * 'speak', graded:false` di `recordEvent` — konsisten komentar
 * `progress.ts` `Store.correctAttempts`: ASR anak tidak selalu akurat,
 * menghitungnya bikin angka akurasi menyesatkan) — cuma mini-game "Main"
 * (soal pilihan ganda objektif) yang panggil `recordAttempt`.
 * ================================================================
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
}

/** Navigasi bullet-progress (lompat ke soal manapun, titik hijau = sudah
 *  dicoba) — permintaan user "berikan bullet progress seperti di materi
 *  vocab", duplikat lokal dari `games/vocabulary.ts` (konvensi sama: helper
 *  UI generik diduplikasi per file game, BUKAN diimpor lintas file).
 *  Dipakai `runLatihanIntiPhrase`/`runTantanganPhrase` (format KEDUA) &
 *  `runLatihanIntiInterview`/`runTantanganInterview` (format KETIGA) —
 *  format LAMA (`SpeakingTopic`, Explorer/Adventurer/Achiever) TIDAK
 *  disentuh, konsisten pola "format lama tidak ikut UX baru" yang sudah
 *  dipakai Listening/Reading/Grammar. */
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

/** Plan `topic.items.length` slot diacak SEKALI & dipersist — supaya urutan
 *  soal STABIL lintas resume/lompat quiz-dot (bukan shuffle baru tiap
 *  render). Dipakai `runLatihanIntiPhrase`/`runTantanganPhrase` — masing²
 *  section (`'latihan'`/`'tantangan-recall'`) py plan SENDIRI (assignment
 *  acaknya independen), pola sama `buildPatternPlan` `games/grammar.ts`. */
function buildPhrasePlan(topic: SpeakingPhraseTopic): LatihanPlanSlot[] {
  return shuffle(topic.items.map((_, i) => i)).map((item) => ({ kind: 'hear', item }));
}

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

/** Petunjuk SEDERHANA "💡 Petunjuk" — SATU tombol, tersedia SEJAK AWAL (tanpa
 *  gating attempt), dipakai Tantangan supaya anak yang beneran lupa bisa
 *  minta dengar+lihat frasanya lagi — non-punitive scaffold, pola sama
 *  `games/listening.ts` `petunjukButtonHtml`. */
function petunjukButtonHtml(revealed: boolean): string {
  return `<button class="speak-btn-ghost" type="button" data-action="petunjuk" ${revealed ? 'disabled' : ''}>💡 Petunjuk</button>`;
}

/** Ucapkan frasa Inggris DULU, baru terjemahan Indonesia SETELAH jeda —
 *  sama pola `games/listening.ts` `speakBilingual`. */
function speakBilingual(en: string, id: string): void {
  speak(en);
  setTimeout(() => speakLocalized(id, 'id-ID'), 1600);
}

/** 4 opsi mini-game "Main" = target + 3 distraktor acak dari kata LAIN di
 *  topik yang sama (pola sama `games/reading.ts` `buildWordOptions`) —
 *  bukan diauthoring manual per-item, lihat komentar `SpeakingPhraseItem`
 *  (types.ts) kenapa. */
function buildPhraseOptions(topic: SpeakingPhraseTopic, target: SpeakingPhraseItem): SpeakingPhraseItem[] {
  const distractors = shuffle(topic.items.filter((it) => it !== target)).slice(0, 3);
  return shuffle([target, ...distractors]);
}

interface MicScore {
  hitRatio: number;
  stars: 1 | 2 | 3;
  perfect: boolean;
  starRow: string;
  wordsHtml: string;
  matchedCount: number;
  totalCount: number;
}

/** Skor proporsional dari ucapan anak vs frasa target (`wordMatchDetail`,
 *  BUKAN `looseMatch` biner) — dipakai KETIGA langkah format baru ini.
 *  Bintang tidak pernah 0 (non-punitive, CLAUDE.md poin 2) — 1 bintang
 *  minimal tetap diberi walau tidak ada kata yang kedengaran sama sekali. */
function scoreMic(said: string, target: string): MicScore {
  const words = wordMatchDetail(said, target);
  const matchedCount = words.filter((w) => w.matched).length;
  const totalCount = words.length;
  const hitRatio = totalCount ? matchedCount / totalCount : 0;
  const stars: 1 | 2 | 3 = hitRatio >= 0.8 ? 3 : hitRatio >= 0.4 ? 2 : 1;
  return {
    hitRatio,
    stars,
    perfect: stars === 3,
    starRow: '⭐'.repeat(stars) + '☆'.repeat(3 - stars),
    wordsHtml: words.map((w) => `<span class="${w.matched ? 'ok' : 'miss'}">${w.word}</span>`).join(''),
    matchedCount,
    totalCount,
  };
}

/** Kenalan — 1 baris per frasa: 🔊 dengar, 🎤 tirukan (skor proporsional +
 *  Play Suaramu), 🎮 main (1 soal dengar&tunjuk fokus frasa itu, balik ke
 *  daftar sesudahnya) — permintaan user eksplisit: "di fitur kenalan tetap
 *  ada fitur mic dan main", REUSE PERSIS pola `games/reading.ts`
 *  `renderKenalanWord` (3 aksi yang sama), cuma stimulusnya audio (frasa
 *  diucapkan), bukan kata tercetak. Tombol "Lanjut ke Latihan Inti →" tetap
 *  ada (sama pola Reading, bukan andalkan stepper doang spt Listening). */
export function renderKenalanPhrase(container: HTMLElement, topic: SpeakingPhraseTopic, onNext: OnDone, level: LevelKey): void {
  const doneCls = (i: number, action: 'listen' | 'mic' | 'game'): string =>
    hasWordInteraction('speaking', topic.id, i, action) ? ' done' : '';

  drawList();

  function drawList(): void {
    container.innerHTML = `
      <div class="id-text" style="margin-bottom:10px;">Dengarkan ucapannya dulu, tap 🔊 untuk mengulang${sttSupported ? ', tap 🎤 buat coba tirukan' : ''}, atau tap 🎮 buat main sama ucapan itu</div>
      <div class="primer-list">
        ${topic.items
          .map(
            (it, i) => `
          <div class="primer-item">
            <div style="font-size:26px">${it.emoji}</div>
            <div class="txt"><b>${it.phrase.en}</b><span>${it.phrase.id}</span></div>
            <div class="mini-play${doneCls(i, 'listen')}" data-action="playPhrase" data-payload="${i}">🔊</div>
            ${sttSupported ? `<div class="mini-play${doneCls(i, 'mic')}" id="micMini${i}" data-action="micPhrase" data-payload="${i}">🎤</div>` : ''}
            <div class="mini-play${doneCls(i, 'game')}" data-action="gamePhrase" data-payload="${i}">🎮</div>
          </div>`
          )
          .join('')}
      </div>
      <button class="primary-btn" data-action="advance">Lanjut ke Latihan Inti →</button>
    `;
    setHandlers({
      playPhrase: (payload) => {
        const i = Number(payload);
        markWordInteraction('speaking', topic.id, i, 'listen', topic.items[i].phrase.en);
        speak(topic.items[i].phrase.en);
        drawList();
      },
      micPhrase: (payload) => {
        const i = Number(payload);
        markWordInteraction('speaking', topic.id, i, 'mic', topic.items[i].phrase.en);
        recordEvent({ kind: 'interact', skill: 'speaking', topicId: topic.id, section: 'kenalan', slot: i, itemRef: topic.items[i].phrase.en, activity: 'mic' });
        drawList();
        micFor(i);
      },
      gamePhrase: (payload) => {
        const i = Number(payload);
        markWordInteraction('speaking', topic.id, i, 'game', topic.items[i].phrase.en);
        recordEvent({ kind: 'interact', skill: 'speaking', topicId: topic.id, section: 'kenalan', slot: i, itemRef: topic.items[i].phrase.en, activity: 'game' });
        runPhraseMiniGame(container, topic, topic.items[i], drawList, level);
      },
      advance: () => onNext(),
    });
  }

  function openMicResultPopup(it: SpeakingPhraseItem, index: number, said: string | null, errorText: string | null): void {
    const overlay = document.createElement('div');
    overlay.className = 'mic-pop-overlay';

    let bodyHtml = '';
    if (said !== null) {
      const s = scoreMic(said, it.phrase.en);
      if (s.perfect) {
        playCorrectTone();
        fireConfetti();
      } else playTryAgainTone();
      recordEvent({
        kind: 'speak',
        skill: 'speaking',
        topicId: topic.id,
        section: 'kenalan',
        slot: index,
        itemRef: it.phrase.en,
        activity: 'mic',
        graded: false,
        score: Math.round(s.hitRatio * 100),
        detail: { heard: said },
      });
      bodyHtml = `
        <div class="${s.perfect ? 'win-burst' : ''}" style="font-size:20px;letter-spacing:3px" aria-hidden="true">${s.starRow}</div>
        <div class="word-diff" style="margin:8px 0">${s.wordsHtml}</div>
        <div class="heard-text">Terdengar: "${said}"</div>
        <div class="feedback good" style="margin-top:6px">${s.perfect ? pickPraise(level) : pickEncourage(level)}</div>
        <div class="speak-row" style="margin:12px 0 2px">
          <button class="speak-btn" type="button" id="micPopPlayMine" data-action="micPopPlayMine" disabled>▶️ Play Suaramu</button>
        </div>`;
    } else {
      bodyHtml = `<p class="meta" style="margin:10px 0">${errorText}</p>`;
    }

    overlay.innerHTML = `
      <div class="mic-pop-card">
        <div style="font-size:38px" aria-hidden="true">${it.emoji}</div>
        <div class="en-text" style="margin:2px 0 10px">${it.phrase.en}</div>
        ${bodyHtml}
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
        if (kind === 'aborted') return;
        openMicResultPopup(it, index, null, 'Belum kedengaran, coba lagi ya 🎧');
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
}

/** 🎮 Main · Dengar & Tunjuk — RECOGNIZE, langkah pertama tangga (lihat
 *  komentar di atas file ini): anak DENGAR frasa (auto-play + replay
 *  manual), lalu tunjuk kartu gambar yang cocok dari 4 opsi (`answerCardsHtml`,
 *  target + 3 distraktor sesama topik via `buildPhraseOptions`) — comprehension
 *  murni, BELUM diminta bicara sama sekali (pola Cambridge Starters Part 1
 *  "listen, point" — `materi/speaking.md` §3.2). */
function runPhraseMiniGame(container: HTMLElement, topic: SpeakingPhraseTopic, item: SpeakingPhraseItem, onBack: OnDone, level: LevelKey): void {
  const opts = buildPhraseOptions(topic, item);
  let answered = false;

  function paint(): void {
    container.innerHTML = `
      <span class="stage-badge">🎮 Main · Dengar &amp; Tunjuk</span>
      <div class="id-text">Dengarkan dulu, lalu tunjuk gambar yang cocok</div>
      <div class="speak-row"><button class="speak-btn pt-cta" type="button" data-action="replay">🔊 Dengar</button></div>
      ${answerCardsHtml(
        opts.map((o) => ({ emoji: o.emoji, label: o.en })),
        'pick'
      )}
      <div class="feedback" id="fb"></div>
    `;
    setHandlers({
      replay: () => speak(item.phrase.en),
      pick: (payload) => {
        if (answered) return;
        const i = Number(payload);
        onAnswer(opts[i] === item, i);
      },
    });
  }

  function onAnswer(correct: boolean, i: number): void {
    answered = true;
    lockOptionButtons(container);
    const btn = container.querySelectorAll<HTMLElement>('.opt-btn')[i];
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
    recordEvent({ kind: 'answer', skill: 'speaking', topicId: topic.id, itemRef: item.phrase.en, activity: 'phrase-mini', correct });
    fb.insertAdjacentHTML('afterend', roundActionsHtml(true));
    setHandlers({
      tryAgainRound: () => {
        answered = false;
        paint();
      },
      nextRound: () => onBack(),
    });
  }

  speak(item.phrase.en);
  paint();
}

/**
 * Latihan Inti "🎤 Tirukan Ucapannya!" — IMITATE, langkah kedua tangga: 10
 * soal (1 per frasa, diacak), frasa+terjemahan+emoji SELALU kelihatan (beda
 * dari Tantangan di bawah) krn ini tugas ECHO — anak dengar contoh (auto-
 * play begitu soal dibuka + "🔊 Dengar Contoh" replay manual), lalu tirukan
 * lewat mic. Skor proporsional + "▶️ Play Suaramu" tampil INLINE di layar
 * (bukan popup — beda dari Kenalan yang berbentuk daftar+modal, di sini
 * sudah 1 layar penuh per soal, pola sama `games/placement.ts` `drawOpenMic`).
 * Retry & Lanjut SELALU tersedia berapa pun bintangnya (non-punitive).
 *
 * 🔒 Bullet-progress (`quizNavHtml`, permintaan user "seperti di materi
 * vocab") — urutan 10 frasa sekarang PERSISTEN (`buildPhrasePlan`+
 * `ensureSection`, bukan `shuffle()` mentah tiap panggil) supaya "soal ke-N"
 * punya identitas stabil lintas resume/lompat quiz-dot, titik hijau = pernah
 * DICOBA (skor 3-bintang ATAU bukan — `markSlotAnswered` dipanggil apa pun
 * hasilnya, konsisten filosofi non-punitive), bukan syarat lanjut.
 */
export function runLatihanIntiPhrase(container: HTMLElement, topic: SpeakingPhraseTopic, onDone: OnDone, level: LevelKey): void {
  const buildPlan = () => buildPhrasePlan(topic);
  let section = ensureSection('speaking', topic.id, 'latihan', buildPlan);
  const isStalePlan = (section.plan ?? []).length !== topic.items.length;
  if (isStalePlan) {
    resetSectionPlan('speaking', topic.id, 'latihan', buildPlan());
    section = ensureSection('speaking', topic.id, 'latihan');
  }
  const order = (section.plan ?? []).map((slot) => topic.items[slot.item] ?? topic.items[0]);
  let round = Math.min(Math.max(section.cursor, 0), order.length - 1);

  const slotStatus = (i: number): 0 | 1 | 2 => getSlot('speaking', topic.id, 'latihan', i)?.st ?? 0;

  function goTo(i: number): void {
    round = Math.min(Math.max(i, 0), order.length - 1);
    setSectionCursor('speaking', topic.id, 'latihan', round);
    draw();
  }

  function draw(): void {
    if (round >= order.length) return onDone();
    const target = order[round];
    container.innerHTML = `
      <span class="stage-badge">🎤 Tirukan Ucapannya!</span>
      ${quizNavHtml(round, order.length, slotStatus)}
      <div class="id-text">Soal ${round + 1} dari ${order.length}</div>
      <div class="big-emoji">${target.emoji}</div>
      <div class="en-text">${target.phrase.en}</div>
      <div class="id-text">${target.phrase.id}</div>
      <div class="speak-row"><button class="speak-btn pt-cta" type="button" data-action="replay">🔊 Dengar Contoh</button></div>
      <div class="mic-wrap">
        <button class="mic-btn" id="micBtn" type="button" data-action="mic">🎤</button>
        <div class="mic-hint">${sttSupported ? 'Tap mic, lalu tirukan ucapannya' : 'Mikrofon tidak didukung browser ini'}</div>
      </div>
      <div id="micResult"></div>
      <div class="feedback" id="fb"></div>
      ${sttSupported ? '' : `<button class="ghost-btn" type="button" data-action="skip">✅ Aku Sudah Coba Ucapkan</button>`}
    `;
    wireQuizNav(goTo);

    setHandlers({
      replay: () => speak(target.phrase.en),
      skip: () => {
        round += 1;
        setSectionCursor('speaking', topic.id, 'latihan', Math.min(round, order.length - 1));
        draw();
      },
      mic: () => micFor(),
    });

    speak(target.phrase.en);

    function micFor(): void {
      const btn = container.querySelector<HTMLElement>('#micBtn')!;
      if (btn.classList.contains('listening')) return;
      btn.classList.add('listening');
      let recordedAudioUrl: string | null = null;
      listenAndRecordOnce(
        (said) => {
          btn.classList.remove('listening');
          btn.setAttribute('disabled', 'true');
          const s = scoreMic(said, target.phrase.en);
          if (s.perfect) {
            playCorrectTone();
            fireConfetti();
          } else playTryAgainTone();
          markSlotAnswered('speaking', topic.id, 'latihan', round, s.perfect, { score: Math.round(s.hitRatio * 100), itemRef: target.phrase.en });
          recordEvent({
            kind: 'speak',
            skill: 'speaking',
            topicId: topic.id,
            section: 'latihan',
            slot: round,
            itemRef: target.phrase.en,
            activity: 'mic',
            graded: false,
            score: Math.round(s.hitRatio * 100),
            detail: { heard: said },
          });
          container.querySelector<HTMLElement>('#micResult')!.innerHTML = `
          <div class="${s.perfect ? 'win-burst' : ''}" style="font-size:22px;letter-spacing:3px;text-align:center;margin-top:14px" aria-hidden="true">${s.starRow}</div>
          <p class="mic-score">🎯 ${s.matchedCount} dari ${s.totalCount} kata kedengaran <span class="mic-score-pct">(${Math.round(s.hitRatio * 100)}%)</span></p>
          <div class="word-diff">${s.wordsHtml}</div>
          <div class="heard-text">Terdengar: "${said}"</div>
          <div class="speak-row"><button class="speak-btn" type="button" id="playMineBtn" data-action="playMine" disabled>▶️ Play Suaramu</button></div>
        `;
          const fb = container.querySelector<HTMLElement>('#fb')!;
          fb.textContent = s.perfect ? pickPraise(level) : pickEncourage(level);
          fb.className = 'feedback good';
          fb.insertAdjacentHTML('afterend', roundActionsHtml(round === order.length - 1));
          setHandlers({
            replay: () => speak(target.phrase.en),
            playMine: () => {
              if (recordedAudioUrl) new Audio(recordedAudioUrl).play().catch(() => {});
            },
            tryAgainRound: () => draw(),
            nextRound: () => {
              round += 1;
              setSectionCursor('speaking', topic.id, 'latihan', Math.min(round, order.length - 1));
              draw();
            },
          });
        },
        (kind) => {
          btn.classList.remove('listening');
          if (kind === 'aborted') return; // lihat komentar setara di fungsi lama di atas file ini
          container.querySelector<HTMLElement>('#fb')!.textContent = 'Belum kedengaran, coba lagi 🎧';
        },
        (audioUrl) => {
          recordedAudioUrl = audioUrl;
          const playBtn = container.querySelector<HTMLButtonElement>('#playMineBtn');
          if (playBtn) playBtn.disabled = false;
        }
      );
    }
  }

  draw();
}

/**
 * Tantangan "🖼️ Sebutkan Sendiri!" — TRANSLATE & SPEAK, langkah TERSULIT
 * tangga. **🔒 REVISI (permintaan user: konsep RECALL lama — gambar SAJA,
 * tanpa teks/audio apa pun — dinilai "sangat susah" utk anak 3-7 th, blind
 * recall tanpa anchor apa pun)** — sekarang terjemahan Indonesia (`phrase.id`)
 * SELALU tampil+diucapkan sbg anchor permanen (bukan lagi disembunyikan di
 * balik Petunjuk), anak menerjemahkan+mengucapkan versi Inggrisnya sendiri —
 * TETAP beda & TETAP lebih sulit dari Latihan Inti (yang echo: dengar Inggris
 * → tirukan Inggris), krn di sini anak harus PRODUKSI dari MAKNA, bukan cuma
 * tirukan bunyi yang baru didengar — pola sama tipe soal `'toEn'` Vocab
 * ("Apa bahasa Inggrisnya '...'?"), cuma dipindah ke mic krn Speaking wajib
 * tetap produktif. "💡 Petunjuk" (tersedia SEJAK AWAL, TANPA gating attempt)
 * SEKARANG cuma membacakan+menampilkan bentuk INGGRISnya saja (Indonesia
 * sudah kelihatan dari awal, tidak perlu diulang) kalau anak beneran belum
 * tahu — non-punitive scaffold. Frasa target SELALU ditampilkan di hasil
 * sesudah mic (apa pun skornya) supaya anak tetap belajar dari percobaannya.
 *
 * 🔒 Bullet-progress (`quizNavHtml`, permintaan user "seperti di materi
 * vocab") — plan section TERPISAH (`'tantangan-recall'`) dari Latihan Inti,
 * assignment acaknya independen — pola sama Grammar `tantangan-pola`.
 */
export function runTantanganPhrase(container: HTMLElement, topic: SpeakingPhraseTopic, onDone: OnDone, level: LevelKey): void {
  const buildPlan = () => buildPhrasePlan(topic);
  let section = ensureSection('speaking', topic.id, 'tantangan-recall', buildPlan);
  const isStalePlan = (section.plan ?? []).length !== topic.items.length;
  if (isStalePlan) {
    resetSectionPlan('speaking', topic.id, 'tantangan-recall', buildPlan());
    section = ensureSection('speaking', topic.id, 'tantangan-recall');
  }
  const order = (section.plan ?? []).map((slot) => topic.items[slot.item] ?? topic.items[0]);
  let round = Math.min(Math.max(section.cursor, 0), order.length - 1);

  const slotStatus = (i: number): 0 | 1 | 2 => getSlot('speaking', topic.id, 'tantangan-recall', i)?.st ?? 0;

  function goTo(i: number): void {
    round = Math.min(Math.max(i, 0), order.length - 1);
    setSectionCursor('speaking', topic.id, 'tantangan-recall', round);
    draw();
  }

  function draw(): void {
    if (round >= order.length) return onDone();
    const target = order[round];
    let revealed = false;

    function paint(): void {
      container.innerHTML = `
        <span class="stage-badge">🗣️ Coba Ucapkan dalam Bahasa Inggris</span>
        ${quizNavHtml(round, order.length, slotStatus)}
        <div class="id-text">Soal ${round + 1} dari ${order.length}</div>
        <div class="big-emoji">${target.emoji}</div>
        <p class="reading-question">"${target.phrase.id}"</p>
        <div class="speak-row">${petunjukButtonHtml(revealed)}</div>
        ${revealed ? `<div class="en-text">${target.phrase.en}</div>` : ''}
        <div class="mic-wrap">
          <button class="mic-btn" id="micBtn" type="button" data-action="mic">🎤</button>
          <div class="mic-hint">${sttSupported ? 'Ucapkan versi Inggrisnya, ya' : 'Mikrofon tidak didukung browser ini'}</div>
        </div>
        <div id="micResult"></div>
        <div class="feedback" id="fb"></div>
        ${sttSupported ? '' : `<button class="ghost-btn" type="button" data-action="skip">✅ Aku Sudah Coba Ucapkan</button>`}
      `;
      wireQuizNav(goTo);
      speakLocalized(target.phrase.id, 'id-ID');
      setHandlers({
        petunjuk: () => {
          if (revealed) return;
          revealed = true;
          speak(target.phrase.en);
          paint();
        },
        skip: () => {
          round += 1;
          setSectionCursor('speaking', topic.id, 'tantangan-recall', Math.min(round, order.length - 1));
          draw();
        },
        mic: () => micFor(),
      });
    }

    function micFor(): void {
      const btn = container.querySelector<HTMLElement>('#micBtn')!;
      if (btn.classList.contains('listening')) return;
      btn.classList.add('listening');
      let recordedAudioUrl: string | null = null;
      listenAndRecordOnce(
        (said) => {
          btn.classList.remove('listening');
          btn.setAttribute('disabled', 'true');
          const s = scoreMic(said, target.phrase.en);
          if (s.perfect) {
            playCorrectTone();
            fireConfetti();
          } else playTryAgainTone();
          markSlotAnswered('speaking', topic.id, 'tantangan-recall', round, s.perfect, { score: Math.round(s.hitRatio * 100), itemRef: target.phrase.en });
          recordEvent({
            kind: 'speak',
            skill: 'speaking',
            topicId: topic.id,
            section: 'tantangan-recall',
            slot: round,
            itemRef: target.phrase.en,
            activity: 'mic',
            graded: false,
            score: Math.round(s.hitRatio * 100),
            detail: { heard: said },
          });
          container.querySelector<HTMLElement>('#micResult')!.innerHTML = `
            <div class="${s.perfect ? 'win-burst' : ''}" style="font-size:22px;letter-spacing:3px;text-align:center;margin-top:14px" aria-hidden="true">${s.starRow}</div>
            <p class="mic-score">🎯 ${s.matchedCount} dari ${s.totalCount} kata kedengaran <span class="mic-score-pct">(${Math.round(s.hitRatio * 100)}%)</span></p>
            <div class="word-diff">${s.wordsHtml}</div>
            <div class="heard-text">Terdengar: "${said}"</div>
            <div class="en-text" style="margin-top:8px">Jawabannya: "${target.phrase.en}"</div>
            <div class="speak-row"><button class="speak-btn" type="button" id="playMineBtn" data-action="playMine" disabled>▶️ Play Suaramu</button></div>
          `;
          const fb = container.querySelector<HTMLElement>('#fb')!;
          fb.textContent = s.perfect ? pickPraise(level) : pickEncourage(level);
          fb.className = 'feedback good';
          fb.insertAdjacentHTML('afterend', roundActionsHtml(round === order.length - 1));
          setHandlers({
            playMine: () => {
              if (recordedAudioUrl) new Audio(recordedAudioUrl).play().catch(() => {});
            },
            tryAgainRound: () => {
              revealed = true; // non-punitive: percobaan ulang tetap boleh lihat jawaban yang baru saja terungkap
              paint();
            },
            nextRound: () => {
              round += 1;
              setSectionCursor('speaking', topic.id, 'tantangan-recall', Math.min(round, order.length - 1));
              draw();
            },
          });
        },
        (kind) => {
          btn.classList.remove('listening');
          if (kind === 'aborted') return; // lihat komentar setara di fungsi lama di atas file ini
          container.querySelector<HTMLElement>('#fb')!.textContent = 'Belum kedengaran, coba lagi 🎧';
        },
        (audioUrl) => {
          recordedAudioUrl = audioUrl;
          const playBtn = container.querySelector<HTMLButtonElement>('#playMineBtn');
          if (playBtn) playBtn.disabled = false;
        }
      );
    }

    paint();
  }

  draw();
}

/**
 * ================================================================
 * Format KETIGA (`SpeakingInterviewTopic`, types.ts) — khusus Trailblazer.
 * Permintaan riset user: Cambridge KET→PET (backbone Trailblazer) py
 * Speaking test format INTERVIEW ANTAR-KANDIDAT — solo-app diakali dgn
 * "kandidat A" fiktif (`topic.peerName`) yang menjawab pertanyaan DULU
 * (model jawaban natural) sbg TTS, baru giliran anak menjawab dgn kata²
 * sendiri via mic. Jawaban anak TIDAK diskor proporsional (personal/
 * terbuka, sama alasan `roleplay` di atas) — Play Suaramu TETAP wajib.
 * Riset lengkap: `materi/speaking.md` §9.
 * ================================================================
 */

/** Kenalan — daftar SEMUA giliran (pertanyaan + jawaban `peerName`), 🔊
 *  dengar keduanya berurutan, 🎤 opsional coba jawab sendiri (TIDAK diskor,
 *  TIDAK gating — murni exposure+keberanian awal, pola sama `roleplay`).
 *  Tidak ada mini-game 🎮 (beda dari Kenalan format KEDUA) krn tidak ada
 *  target tertutup utk dikuiskan — konten di sini genuinely terbuka. */
export function renderKenalanInterview(container: HTMLElement, topic: SpeakingInterviewTopic, onNext: OnDone): void {
  container.innerHTML = `
    <div class="id-text" style="margin-bottom:10px;">Dengarkan dulu pertanyaan &amp; jawaban ${topic.peerName}, lalu coba jawab sendiri kalau mau (${sttSupported ? 'tap 🎤' : 'mic tidak didukung browser ini'})</div>
    <div class="primer-list">
      ${topic.turns
        .map(
          (t, i) => `
        <div class="primer-item" style="align-items:flex-start">
          <div class="txt">
            <b>${t.question.en}</b><span>${t.question.id}</span>
            <div class="dialogue-line" style="margin-top:6px"><span class="dialogue-speaker">${topic.peerName}</span> ${t.peerAnswer.en}</div>
            <span>${t.peerAnswer.id}</span>
          </div>
          <div class="mini-play" data-action="play" data-payload="${i}">🔊</div>
          ${sttSupported ? `<div class="mini-play" id="micMini${i}" data-action="mic" data-payload="${i}">🎤</div>` : ''}
        </div>`
        )
        .join('')}
    </div>
    <button class="primary-btn" data-action="advance">Lanjut ke Latihan Inti →</button>
  `;

  function micFor(index: number): void {
    const t = topic.turns[index];
    const btn = document.getElementById(`micMini${index}`);
    if (!btn || btn.classList.contains('listening')) return;
    btn.classList.add('listening');
    listenAndRecordOnce(
      (said) => {
        btn.classList.remove('listening');
        recordEvent({ kind: 'speak', skill: 'speaking', topicId: topic.id, section: 'kenalan', slot: index, itemRef: t.question.en, activity: 'mic', graded: false, detail: { heard: said } });
        openPracticePopup(said, null);
      },
      (kind) => {
        btn.classList.remove('listening');
        if (kind === 'aborted') return;
        openPracticePopup(null, 'Belum kedengaran, coba lagi ya 🎧');
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

  function openPracticePopup(said: string | null, errorText: string | null): void {
    const overlay = document.createElement('div');
    overlay.className = 'mic-pop-overlay';
    overlay.innerHTML = `
      <div class="mic-pop-card">
        ${
          said !== null
            ? `<div class="heard-text">Kamu jawab: "${said}"</div>
               <div class="feedback good" style="margin-top:6px">Bagus, sudah berani coba! 🎉</div>
               <div class="speak-row" style="margin:12px 0 2px">
                 <button class="speak-btn" type="button" id="micPopPlayMine" data-action="micPopPlayMine" disabled>▶️ Play Suaramu</button>
               </div>`
            : `<p class="meta" style="margin:10px 0">${errorText}</p>`
        }
        <div class="round-actions">
          <button class="primary-btn" type="button" data-action="micPopClose" style="margin-top:0">Lanjut ➡️</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
    setHandlers({
      micPopClose: () => overlay.remove(),
      micPopPlayMine: () => {
        const url = overlay.dataset.audioUrl;
        if (url) new Audio(url).play().catch(() => {});
      },
    });
  }

  setHandlers({
    play: (payload) => {
      const t = topic.turns[Number(payload)];
      speakSequence([t.question.en, t.peerAnswer.en]);
    },
    mic: (payload) => micFor(Number(payload)),
    advance: () => onNext(),
  });
}

/**
 * Latihan Inti "🎙️ Giliranmu Menjawab!" — IMITATE-setara: examiner (narator)
 * bertanya, `peerName` menjawab DULU (auto-play berurutan begitu soal
 * dibuka), lalu giliran anak menjawab pertanyaan yg SAMA dgn kata²nya
 * sendiri via mic — jawaban personal, TIDAK diskor proporsional (tidak ada
 * "jawaban benar" tunggal), Play Suaramu wajib. Retry & Lanjut SELALU
 * tersedia (non-punitive, sama pola `roleplay`).
 *
 * 🔒 Bullet-progress (`quizNavHtml`, permintaan user "seperti di materi
 * vocab") — giliran TIDAK diacak (interview harus urut alami spt percakapan
 * sungguhan), jadi TANPA `ensureSection`/plan (beda dari format KEDUA di
 * atas) — cursor & status per-slot cukup dibaca/ditulis LANGSUNG pakai index
 * `topic.turns` asli (`getSlot`/`setSectionCursor`/`markSlotAnswered` sudah
 * generik lintas skill, tidak perlu materialisasi plan sama sekali kalau
 * urutannya memang sudah tetap).
 */
export function runLatihanIntiInterview(container: HTMLElement, topic: SpeakingInterviewTopic, onDone: OnDone, level: LevelKey): void {
  let round = Math.min(Math.max(getSection('speaking', topic.id, 'latihan')?.cursor ?? 0, 0), topic.turns.length - 1);

  const slotStatus = (i: number): 0 | 1 | 2 => getSlot('speaking', topic.id, 'latihan', i)?.st ?? 0;

  function goTo(i: number): void {
    round = Math.min(Math.max(i, 0), topic.turns.length - 1);
    setSectionCursor('speaking', topic.id, 'latihan', round);
    draw();
  }

  function draw(): void {
    if (round >= topic.turns.length) return onDone();
    const t = topic.turns[round];
    container.innerHTML = `
      <span class="stage-badge">🎙️ Giliranmu Menjawab!</span>
      ${quizNavHtml(round, topic.turns.length, slotStatus)}
      <div class="id-text">Giliran ${round + 1} dari ${topic.turns.length}</div>
      <div class="en-text">"${t.question.en}"</div>
      <div class="id-text">${t.question.id}</div>
      <div class="dialogue-line"><span class="dialogue-speaker">${topic.peerName}</span> ${t.peerAnswer.en}</div>
      <div class="id-text">${t.peerAnswer.id}</div>
      <div class="speak-row"><button class="speak-btn" type="button" data-action="replay">🔊 Dengar Lagi</button></div>
      <div class="mic-wrap">
        <button class="mic-btn" id="micBtn" type="button" data-action="mic">🎤</button>
        <div class="mic-hint">${sttSupported ? `Sekarang giliranmu — jawab dgn kata-katamu sendiri` : 'Mikrofon tidak didukung browser ini'}</div>
      </div>
      <div id="micResult"></div>
      <div class="feedback" id="fb"></div>
      ${sttSupported ? '' : `<button class="ghost-btn" type="button" data-action="skip">✅ Aku Sudah Jawab</button>`}
    `;
    wireQuizNav(goTo);
    speakSequence([t.question.en, t.peerAnswer.en]);

    setHandlers({
      replay: () => speakSequence([t.question.en, t.peerAnswer.en]),
      skip: () => {
        round += 1;
        setSectionCursor('speaking', topic.id, 'latihan', Math.min(round, topic.turns.length - 1));
        draw();
      },
      mic: () => micFor(),
    });

    function micFor(): void {
      const btn = container.querySelector<HTMLElement>('#micBtn')!;
      if (btn.classList.contains('listening')) return;
      btn.classList.add('listening');
      let recordedAudioUrl: string | null = null;
      listenAndRecordOnce(
        (said) => {
          btn.classList.remove('listening');
          btn.setAttribute('disabled', 'true');
          playCorrectTone();
          fireConfetti();
          markSlotAnswered('speaking', topic.id, 'latihan', round, true, { itemRef: t.question.en });
          recordEvent({ kind: 'speak', skill: 'speaking', topicId: topic.id, section: 'latihan', slot: round, itemRef: t.question.en, activity: 'interview', graded: false, detail: { heard: said } });
          container.querySelector<HTMLElement>('#micResult')!.innerHTML = `
            <div class="heard-text">Kamu jawab: "${said}"</div>
            <div class="speak-row"><button class="speak-btn" type="button" id="playMineBtn" data-action="playMine" disabled>▶️ Play Suaramu</button></div>
          `;
          const fb = container.querySelector<HTMLElement>('#fb')!;
          fb.textContent = pickPraise(level);
          fb.className = 'feedback good';
          fb.insertAdjacentHTML('afterend', roundActionsHtml(round === topic.turns.length - 1));
          setHandlers({
            playMine: () => {
              if (recordedAudioUrl) new Audio(recordedAudioUrl).play().catch(() => {});
            },
            tryAgainRound: () => draw(),
            nextRound: () => {
              round += 1;
              setSectionCursor('speaking', topic.id, 'latihan', Math.min(round, topic.turns.length - 1));
              draw();
            },
          });
        },
        (kind) => {
          btn.classList.remove('listening');
          if (kind === 'aborted') return;
          container.querySelector<HTMLElement>('#fb')!.textContent = 'Belum kedengaran, coba lagi 🎧';
        },
        (audioUrl) => {
          recordedAudioUrl = audioUrl;
          const playBtn = container.querySelector<HTMLButtonElement>('#playMineBtn');
          if (playBtn) playBtn.disabled = false;
        }
      );
    }
  }

  draw();
}

/**
 * Tantangan "🗣️ Wawancara Lengkap!" — RECALL-setara, tugas TERSULIT: examiner
 * bertanya TAPI `peerName` TIDAK auto-jawab lagi (beda dari Latihan Inti) —
 * anak menjawab independen dari kata²nya sendiri, jawaban model cuma
 * kelihatan lewat "💡 Dengar Contoh [peerName]" (tersedia sejak awal, sama
 * pola `petunjukButtonHtml`, TANPA gating attempt) kalau anak beneran butuh
 * contoh. Play Suaramu wajib, jawaban tetap tidak diskor (personal/terbuka).
 *
 * 🔒 Bullet-progress (`quizNavHtml`, permintaan user "seperti di materi
 * vocab") — sama alasan `runLatihanIntiInterview` di atas: giliran TIDAK
 * diacak, jadi TANPA `ensureSection`/plan, cursor & status baca/tulis
 * LANGSUNG pakai index `topic.turns` asli.
 */
export function runTantanganInterview(container: HTMLElement, topic: SpeakingInterviewTopic, onDone: OnDone, level: LevelKey): void {
  let round = Math.min(Math.max(getSection('speaking', topic.id, 'tantangan')?.cursor ?? 0, 0), topic.turns.length - 1);

  const slotStatus = (i: number): 0 | 1 | 2 => getSlot('speaking', topic.id, 'tantangan', i)?.st ?? 0;

  function goTo(i: number): void {
    round = Math.min(Math.max(i, 0), topic.turns.length - 1);
    setSectionCursor('speaking', topic.id, 'tantangan', round);
    draw();
  }

  function draw(): void {
    if (round >= topic.turns.length) return onDone();
    const t = topic.turns[round];
    let revealed = false;

    function paint(): void {
      container.innerHTML = `
        <span class="stage-badge">🗣️ Wawancara Lengkap!</span>
        ${quizNavHtml(round, topic.turns.length, slotStatus)}
        <div class="id-text">Giliran ${round + 1} dari ${topic.turns.length}</div>
        <div class="en-text">"${t.question.en}"</div>
        <div class="id-text">${t.question.id}</div>
        <div class="speak-row">
          <button class="speak-btn" type="button" data-action="replay">🔊 Dengar Lagi</button>
          <button class="speak-btn-ghost" type="button" data-action="petunjuk" ${revealed ? 'disabled' : ''}>💡 Dengar Contoh ${topic.peerName}</button>
        </div>
        ${revealed ? `<div class="dialogue-line"><span class="dialogue-speaker">${topic.peerName}</span> ${t.peerAnswer.en}</div><div class="id-text">${t.peerAnswer.id}</div>` : ''}
        <div class="mic-wrap">
          <button class="mic-btn" id="micBtn" type="button" data-action="mic">🎤</button>
          <div class="mic-hint">${sttSupported ? 'Jawab pertanyaannya sendiri, ya' : 'Mikrofon tidak didukung browser ini'}</div>
        </div>
        <div id="micResult"></div>
        <div class="feedback" id="fb"></div>
        ${sttSupported ? '' : `<button class="ghost-btn" type="button" data-action="skip">✅ Aku Sudah Jawab</button>`}
      `;
      wireQuizNav(goTo);
      setHandlers({
        replay: () => speak(t.question.en),
        petunjuk: () => {
          if (revealed) return;
          revealed = true;
          speakBilingual(t.peerAnswer.en, t.peerAnswer.id);
          paint();
        },
        skip: () => {
          round += 1;
          setSectionCursor('speaking', topic.id, 'tantangan', Math.min(round, topic.turns.length - 1));
          draw();
        },
        mic: () => micFor(),
      });
    }

    function micFor(): void {
      const btn = container.querySelector<HTMLElement>('#micBtn')!;
      if (btn.classList.contains('listening')) return;
      btn.classList.add('listening');
      let recordedAudioUrl: string | null = null;
      listenAndRecordOnce(
        (said) => {
          btn.classList.remove('listening');
          btn.setAttribute('disabled', 'true');
          playCorrectTone();
          fireConfetti();
          markSlotAnswered('speaking', topic.id, 'tantangan', round, true, { itemRef: t.question.en });
          recordEvent({ kind: 'speak', skill: 'speaking', topicId: topic.id, section: 'tantangan', slot: round, itemRef: t.question.en, activity: 'interview', graded: false, detail: { heard: said } });
          container.querySelector<HTMLElement>('#micResult')!.innerHTML = `
            <div class="heard-text">Kamu jawab: "${said}"</div>
            <div class="speak-row"><button class="speak-btn" type="button" id="playMineBtn" data-action="playMine" disabled>▶️ Play Suaramu</button></div>
          `;
          const fb = container.querySelector<HTMLElement>('#fb')!;
          fb.textContent = pickPraise(level);
          fb.className = 'feedback good';
          fb.insertAdjacentHTML('afterend', roundActionsHtml(round === topic.turns.length - 1));
          setHandlers({
            playMine: () => {
              if (recordedAudioUrl) new Audio(recordedAudioUrl).play().catch(() => {});
            },
            tryAgainRound: () => {
              revealed = true; // non-punitive: percobaan ulang tetap boleh lihat jawaban yang baru saja terungkap
              paint();
            },
            nextRound: () => {
              round += 1;
              setSectionCursor('speaking', topic.id, 'tantangan', Math.min(round, topic.turns.length - 1));
              draw();
            },
          });
        },
        (kind) => {
          btn.classList.remove('listening');
          if (kind === 'aborted') return;
          container.querySelector<HTMLElement>('#fb')!.textContent = 'Belum kedengaran, coba lagi 🎧';
        },
        (audioUrl) => {
          recordedAudioUrl = audioUrl;
          const playBtn = container.querySelector<HTMLButtonElement>('#playMineBtn');
          if (playBtn) playBtn.disabled = false;
        }
      );
    }

    paint();
  }

  draw();
}

/**
 * ================================================================
 * Format KEEMPAT (`SpeakingStoryTopic`, types.ts) — pilot Explorer (topik
 * `cerita-dan-jawab`, `content.ts`). Audit user: Kenalan/Latihan Inti/
 * Tantangan 3 format Speaking di atas SAMA-SAMA menguji "ucapkan frasa/
 * kalimat target", cuma beda level bantuan (Recognize→Imitate→Recall/
 * Interview) — TASK SHAPE-nya tidak pernah berubah dari "dengar lalu
 * tirukan/produksi". Format ini genuinely beda: anak baca/dengar cerita
 * mini 2 kalimat (SATU sengaja fakta pengecoh — pola PERSIS
 * `ListeningTopic.story`/`ReadingTopic.story` yang sudah battle-tested di
 * file lain, cuma dipindah ke `SpeakingStoryItem` biar berdiri sendiri),
 * lalu MENJAWAB PERTANYAAN KOMPREHENSI dgn SUARA (bukan tap gambar spt
 * Listening/Reading) — comprehension+extraction, bukan echo/imitate.
 * Contoh dari user sendiri ("Andi likes dogs... Andi has a cat... What
 * does Andi have?") dipakai verbatim sbg cerita pertama pilot ini.
 *
 * 🔒 Kenalan REVISI (permintaan user: "tetap tambahkan button sound, mic
 * dan play di section kenalan" — sama pola 3-aksi 🔊/🎤/🎮 yang SUDAH jadi
 * konvensi baku di SEMUA Kenalan lain (Vocab/Listening/Reading Format
 * KEDUA/Speaking Format KEDUA `renderKenalanPhrase`), jadi Kenalan format
 * ini TIDAK LAGI beda sendirian) — versi pertama pilot ini SENGAJA
 * dibiarkan cuma 🔊 (exposure murni, alasan lengkap masih relevan di
 * bawah: task shape Latihan Inti/Tantangan tetap beda krn 2 langkah itu
 * TETAP menguji ekstraksi jawaban dari cerita, bukan cuma echo frasa spt
 * mic Kenalan di sini) — TAPI user eksplisit minta mic+main tetap ada,
 * konsisten pola lintas skill lain. 🎤 & 🎮 di sini skor/target-nya
 * `story.answer.en` (kalimat jawaban, satu-satunya "target tertutup" yang
 * dipunyai tiap cerita) — REUSE PERSIS `openMicResultPopup`-style dari
 * `renderKenalanPhrase` (skor proporsional + Play Suaramu) & mini-game
 * RECOGNIZE ala `runPhraseMiniGame` (dengar cerita+pertanyaan, pilih
 * jawaban teks yang cocok dari 4 kartu, distraktor dari jawaban cerita
 * LAIN di topik yang sama).
 *
 * 🔒 Bullet-progress (`quizNavHtml`/`getSlot`/`markSlotAnswered`/
 * `setSectionCursor`) — urutan cerita TETAP (tidak diacak, konsisten
 * `runLatihanIntiInterview`/`runTantanganInterview` format KETIGA: makna
 * "cerita ke-N" stabil tanpa perlu plan acak), jadi TANPA `ensureSection`/
 * plan spt format KEDUA — cursor & status per-slot baca/tulis LANGSUNG
 * pakai index `topic.stories` asli.
 * ================================================================
 */

function storyPassageHtml(lines: { en: string; id: string }[]): string {
  return `<div class="reading-passage">${lines.map((l) => `<p>${l.en}</p><p class="id-text" style="margin:-2px 0 8px">${l.id}</p>`).join('')}</div>`;
}

/** 4 opsi mini-game "Main" = jawaban cerita ini + 3 distraktor dari jawaban
 *  cerita LAIN di topik yang sama (pola sama `buildPhraseOptions`). */
function buildStoryAnswerOptions(topic: SpeakingStoryTopic, target: SpeakingStoryTopic['stories'][number]): SpeakingStoryTopic['stories'] {
  const distractors = shuffle(topic.stories.filter((s) => s !== target)).slice(0, 3);
  return shuffle([target, ...distractors]);
}

/** Kenalan — daftar SEMUA cerita, tiap baris py TIGA aksi: 🔊 dengar
 *  cerita+pertanyaan berurutan, 🎤 coba ucapkan jawabannya (skor
 *  proporsional + Play Suaramu), 🎮 main (1 soal dengar&pilih-jawaban
 *  fokus cerita itu, balik ke daftar sesudahnya) — permintaan user
 *  eksplisit "tetap tambahkan button sound, mic dan play", REUSE PERSIS
 *  pola `renderKenalanPhrase` (3 aksi yang sama), lihat komentar format
 *  di atas file ini. */
export function renderKenalanStory(container: HTMLElement, topic: SpeakingStoryTopic, onNext: OnDone, level: LevelKey): void {
  const doneCls = (i: number, action: 'listen' | 'mic' | 'game'): string =>
    hasWordInteraction('speaking', topic.id, i, action) ? ' done' : '';

  drawList();

  function drawList(): void {
    container.innerHTML = `
      <div class="id-text" style="margin-bottom:10px;">Baca ceritanya, tap 🔊 buat dengar${sttSupported ? ', tap 🎤 buat coba ucapkan jawabannya' : ''}, atau tap 🎮 buat main sama cerita itu</div>
      <div class="primer-list">
        ${topic.stories
          .map(
            (s, i) => `
          <div class="primer-item" style="align-items:flex-start">
            <div style="font-size:26px">${s.emoji}</div>
            <div class="txt">
              ${s.lines.map((l) => `<div><b>${l.en}</b><span>${l.id}</span></div>`).join('')}
              <div class="dialogue-line" style="margin-top:6px">❓ ${s.question.en}</div>
              <span>${s.question.id}</span>
            </div>
            <div class="mini-play${doneCls(i, 'listen')}" data-action="playStory" data-payload="${i}">🔊</div>
            ${sttSupported ? `<div class="mini-play${doneCls(i, 'mic')}" id="micMini${i}" data-action="micStory" data-payload="${i}">🎤</div>` : ''}
            <div class="mini-play${doneCls(i, 'game')}" data-action="gameStory" data-payload="${i}">🎮</div>
          </div>`
          )
          .join('')}
      </div>
      <button class="primary-btn" data-action="advance">Lanjut ke Latihan Inti →</button>
    `;
    setHandlers({
      playStory: (payload) => {
        const i = Number(payload);
        const s = topic.stories[i];
        markWordInteraction('speaking', topic.id, i, 'listen', s.answer.en);
        speakSequence([...s.lines.map((l) => l.en), s.question.en]);
        drawList();
      },
      micStory: (payload) => {
        const i = Number(payload);
        const s = topic.stories[i];
        markWordInteraction('speaking', topic.id, i, 'mic', s.answer.en);
        recordEvent({ kind: 'interact', skill: 'speaking', topicId: topic.id, section: 'kenalan', slot: i, itemRef: s.answer.en, activity: 'mic' });
        drawList();
        micFor(i);
      },
      gameStory: (payload) => {
        const i = Number(payload);
        const s = topic.stories[i];
        markWordInteraction('speaking', topic.id, i, 'game', s.answer.en);
        recordEvent({ kind: 'interact', skill: 'speaking', topicId: topic.id, section: 'kenalan', slot: i, itemRef: s.answer.en, activity: 'game' });
        runStoryMiniGame(container, topic, s, drawList, level);
      },
      advance: () => onNext(),
    });
  }

  function openMicResultPopup(story: SpeakingStoryTopic['stories'][number], index: number, said: string | null, errorText: string | null): void {
    const overlay = document.createElement('div');
    overlay.className = 'mic-pop-overlay';

    let bodyHtml = '';
    if (said !== null) {
      const s = scoreMic(said, story.answer.en);
      if (s.perfect) {
        playCorrectTone();
        fireConfetti();
      } else playTryAgainTone();
      recordEvent({
        kind: 'speak',
        skill: 'speaking',
        topicId: topic.id,
        section: 'kenalan',
        slot: index,
        itemRef: story.answer.en,
        activity: 'mic',
        graded: false,
        score: Math.round(s.hitRatio * 100),
        detail: { heard: said },
      });
      bodyHtml = `
        <div class="${s.perfect ? 'win-burst' : ''}" style="font-size:20px;letter-spacing:3px" aria-hidden="true">${s.starRow}</div>
        <div class="word-diff" style="margin:8px 0">${s.wordsHtml}</div>
        <div class="heard-text">Terdengar: "${said}"</div>
        <div class="feedback good" style="margin-top:6px">${s.perfect ? pickPraise(level) : pickEncourage(level)}</div>
        <div class="speak-row" style="margin:12px 0 2px">
          <button class="speak-btn" type="button" id="micPopPlayMine" data-action="micPopPlayMine" disabled>▶️ Play Suaramu</button>
        </div>`;
    } else {
      bodyHtml = `<p class="meta" style="margin:10px 0">${errorText}</p>`;
    }

    overlay.innerHTML = `
      <div class="mic-pop-card">
        <div style="font-size:38px" aria-hidden="true">${story.emoji}</div>
        <div class="id-text" style="margin:2px 0 6px">Coba ucapkan jawabannya:</div>
        <div class="en-text" style="margin:2px 0 10px">${story.answer.en}</div>
        ${bodyHtml}
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
    const story = topic.stories[index];
    const btn = document.getElementById(`micMini${index}`);
    if (!btn || btn.classList.contains('listening')) return;
    btn.classList.add('listening');
    listenAndRecordOnce(
      (said) => {
        btn.classList.remove('listening');
        openMicResultPopup(story, index, said, null);
      },
      (kind) => {
        btn.classList.remove('listening');
        if (kind === 'aborted') return;
        openMicResultPopup(story, index, null, 'Belum kedengaran, coba lagi ya 🎧');
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
}

/** 🎮 Main · Dengar & Jawab — RECOGNIZE, 1 soal fokus SATU cerita: anak
 *  dengar cerita+pertanyaan (auto-play + replay manual), lalu pilih kartu
 *  jawaban teks yang cocok dari 4 opsi (`answerCardsHtml`, target + 3
 *  distraktor jawaban cerita LAIN via `buildStoryAnswerOptions`) — pola
 *  sama persis `runPhraseMiniGame` (format KEDUA), cuma stimulusnya cerita
 *  2 kalimat bukan 1 frasa. */
function runStoryMiniGame(
  container: HTMLElement,
  topic: SpeakingStoryTopic,
  story: SpeakingStoryTopic['stories'][number],
  onBack: OnDone,
  level: LevelKey
): void {
  const opts = buildStoryAnswerOptions(topic, story);
  let answered = false;

  function paint(): void {
    container.innerHTML = `
      <span class="stage-badge">🎮 Main · Dengar &amp; Jawab</span>
      <div class="id-text">Dengarkan ceritanya, lalu pilih jawaban yang tepat</div>
      <div class="big-emoji">${story.emoji}</div>
      <div class="speak-row"><button class="speak-btn pt-cta" type="button" data-action="replay">🔊 Dengar</button></div>
      <p class="reading-question">${story.question.en}</p>
      <div class="id-text" style="margin-bottom:8px">${story.question.id}</div>
      ${answerCardsHtml(
        opts.map((o) => ({ emoji: o.emoji, label: o.answer.en })),
        'pick'
      )}
      <div class="feedback" id="fb"></div>
    `;
    setHandlers({
      replay: () => speakSequence([...story.lines.map((l) => l.en), story.question.en]),
      pick: (payload) => {
        if (answered) return;
        const i = Number(payload);
        onAnswer(opts[i] === story, i);
      },
    });
  }

  function onAnswer(correct: boolean, i: number): void {
    answered = true;
    lockOptionButtons(container);
    const btn = container.querySelectorAll<HTMLElement>('.opt-btn')[i];
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
    recordEvent({ kind: 'answer', skill: 'speaking', topicId: topic.id, itemRef: story.answer.en, activity: 'story-mini', correct });
    fb.insertAdjacentHTML('afterend', roundActionsHtml(true));
    setHandlers({
      tryAgainRound: () => {
        answered = false;
        paint();
      },
      nextRound: () => onBack(),
    });
  }

  speakSequence([...story.lines.map((l) => l.en), story.question.en]);
  paint();
}

/**
 * Latihan Inti "📖 Baca & Jawab" — cerita+pertanyaan+JAWABAN SELALU
 * kelihatan (scaffold penuh, echo — anak baru diminta ucapkan jawaban yang
 * sudah tertulis, belum diminta menemukan sendiri, itu tugas Tantangan di
 * bawah). Skor proporsional (`scoreMic`) thd `story.answer.en` + Play
 * Suaramu, non-punitive (Lanjut selalu ada apa pun skornya).
 */
export function runLatihanIntiStory(container: HTMLElement, topic: SpeakingStoryTopic, onDone: OnDone, level: LevelKey): void {
  let round = Math.min(Math.max(getSection('speaking', topic.id, 'latihan')?.cursor ?? 0, 0), topic.stories.length - 1);

  const slotStatus = (i: number): 0 | 1 | 2 => getSlot('speaking', topic.id, 'latihan', i)?.st ?? 0;

  function goTo(i: number): void {
    round = Math.min(Math.max(i, 0), topic.stories.length - 1);
    setSectionCursor('speaking', topic.id, 'latihan', round);
    draw();
  }

  function draw(): void {
    if (round >= topic.stories.length) return onDone();
    const s = topic.stories[round];
    container.innerHTML = `
      <span class="stage-badge">📖 Baca &amp; Jawab</span>
      ${quizNavHtml(round, topic.stories.length, slotStatus)}
      <div class="id-text">Cerita ${round + 1} dari ${topic.stories.length}</div>
      <div class="big-emoji">${s.emoji}</div>
      ${storyPassageHtml(s.lines)}
      <p class="reading-question">${s.question.en}</p>
      <div class="id-text" style="margin-bottom:8px">${s.question.id}</div>
      <div class="speak-row"><button class="speak-btn pt-cta" type="button" data-action="replay">🔊 Dengar Cerita</button></div>
      <div class="en-text">🗣️ Ucapkan: "${s.answer.en}"</div>
      <div class="id-text">${s.answer.id}</div>
      <div class="mic-wrap">
        <button class="mic-btn" id="micBtn" type="button" data-action="mic">🎤</button>
        <div class="mic-hint">${sttSupported ? 'Tap mic, lalu ucapkan jawabannya' : 'Mikrofon tidak didukung browser ini'}</div>
      </div>
      <div id="micResult"></div>
      <div class="feedback" id="fb"></div>
      ${sttSupported ? '' : `<button class="ghost-btn" type="button" data-action="skip">✅ Aku Sudah Coba Ucapkan</button>`}
    `;
    wireQuizNav(goTo);

    setHandlers({
      replay: () => speakSequence([...s.lines.map((l) => l.en), s.question.en]),
      skip: () => {
        round += 1;
        setSectionCursor('speaking', topic.id, 'latihan', Math.min(round, topic.stories.length - 1));
        draw();
      },
      mic: () => micFor(),
    });

    function micFor(): void {
      const btn = container.querySelector<HTMLElement>('#micBtn')!;
      if (btn.classList.contains('listening')) return;
      btn.classList.add('listening');
      let recordedAudioUrl: string | null = null;
      listenAndRecordOnce(
        (said) => {
          btn.classList.remove('listening');
          btn.setAttribute('disabled', 'true');
          const sc = scoreMic(said, s.answer.en);
          if (sc.perfect) {
            playCorrectTone();
            fireConfetti();
          } else playTryAgainTone();
          markSlotAnswered('speaking', topic.id, 'latihan', round, sc.perfect, { score: Math.round(sc.hitRatio * 100), itemRef: s.answer.en });
          recordEvent({
            kind: 'speak',
            skill: 'speaking',
            topicId: topic.id,
            section: 'latihan',
            slot: round,
            itemRef: s.answer.en,
            activity: 'story',
            graded: false,
            score: Math.round(sc.hitRatio * 100),
            detail: { heard: said },
          });
          container.querySelector<HTMLElement>('#micResult')!.innerHTML = `
          <div class="${sc.perfect ? 'win-burst' : ''}" style="font-size:22px;letter-spacing:3px;text-align:center;margin-top:14px" aria-hidden="true">${sc.starRow}</div>
          <p class="mic-score">🎯 ${sc.matchedCount} dari ${sc.totalCount} kata kedengaran <span class="mic-score-pct">(${Math.round(sc.hitRatio * 100)}%)</span></p>
          <div class="word-diff">${sc.wordsHtml}</div>
          <div class="heard-text">Terdengar: "${said}"</div>
          <div class="speak-row"><button class="speak-btn" type="button" id="playMineBtn" data-action="playMine" disabled>▶️ Play Suaramu</button></div>
        `;
          const fb = container.querySelector<HTMLElement>('#fb')!;
          fb.textContent = sc.perfect ? pickPraise(level) : pickEncourage(level);
          fb.className = 'feedback good';
          fb.insertAdjacentHTML('afterend', roundActionsHtml(round === topic.stories.length - 1));
          setHandlers({
            replay: () => speakSequence([...s.lines.map((l) => l.en), s.question.en]),
            playMine: () => {
              if (recordedAudioUrl) new Audio(recordedAudioUrl).play().catch(() => {});
            },
            tryAgainRound: () => draw(),
            nextRound: () => {
              round += 1;
              setSectionCursor('speaking', topic.id, 'latihan', Math.min(round, topic.stories.length - 1));
              draw();
            },
          });
        },
        (kind) => {
          btn.classList.remove('listening');
          if (kind === 'aborted') return; // lihat komentar setara di fungsi lama di atas file ini
          container.querySelector<HTMLElement>('#fb')!.textContent = 'Belum kedengaran, coba lagi 🎧';
        },
        (audioUrl) => {
          recordedAudioUrl = audioUrl;
          const playBtn = container.querySelector<HTMLButtonElement>('#playMineBtn');
          if (playBtn) playBtn.disabled = false;
        }
      );
    }
  }

  draw();
}

/**
 * Tantangan "🕵️ Cerita & Jawab Sendiri" — jawaban TIDAK ditampilkan
 * (beda dari Latihan Inti) — cerita+pertanyaan tetap kelihatan (skill yang
 * diuji: memilah fakta relevan dari cerita, bukan menghafal ceritanya),
 * anak menyusun+mengucapkan jawabannya SENDIRI dari situ. TANPA "💡
 * Petunjuk" upfront (beda dari format lain yg py target tertutup) —
 * menyebut jawabannya di awal langsung membocorkan tugas ekstraksi yang
 * mau dilatih di sini. Jawaban kanonis SELALU diungkap SESUDAH mic (apa
 * pun skornya, non-punitive) supaya anak tetap belajar dari percobaannya.
 */
export function runTantanganStory(container: HTMLElement, topic: SpeakingStoryTopic, onDone: OnDone, level: LevelKey): void {
  let round = Math.min(Math.max(getSection('speaking', topic.id, 'tantangan')?.cursor ?? 0, 0), topic.stories.length - 1);

  const slotStatus = (i: number): 0 | 1 | 2 => getSlot('speaking', topic.id, 'tantangan', i)?.st ?? 0;

  function goTo(i: number): void {
    round = Math.min(Math.max(i, 0), topic.stories.length - 1);
    setSectionCursor('speaking', topic.id, 'tantangan', round);
    draw();
  }

  function draw(): void {
    if (round >= topic.stories.length) return onDone();
    const s = topic.stories[round];
    container.innerHTML = `
      <span class="stage-badge">🕵️ Cerita &amp; Jawab Sendiri</span>
      ${quizNavHtml(round, topic.stories.length, slotStatus)}
      <div class="id-text">Cerita ${round + 1} dari ${topic.stories.length}</div>
      <div class="big-emoji">${s.emoji}</div>
      ${storyPassageHtml(s.lines)}
      <p class="reading-question">${s.question.en}</p>
      <div class="id-text" style="margin-bottom:8px">${s.question.id}</div>
      <div class="speak-row"><button class="speak-btn" type="button" data-action="replay">🔊 Dengar Lagi</button></div>
      <div class="mic-wrap">
        <button class="mic-btn" id="micBtn" type="button" data-action="mic">🎤</button>
        <div class="mic-hint">${sttSupported ? 'Jawab pertanyaannya dgn kata-katamu' : 'Mikrofon tidak didukung browser ini'}</div>
      </div>
      <div id="micResult"></div>
      <div class="feedback" id="fb"></div>
      ${sttSupported ? '' : `<button class="ghost-btn" type="button" data-action="skip">✅ Aku Sudah Coba Jawab</button>`}
    `;
    wireQuizNav(goTo);

    setHandlers({
      replay: () => speakSequence([...s.lines.map((l) => l.en), s.question.en]),
      skip: () => {
        round += 1;
        setSectionCursor('speaking', topic.id, 'tantangan', Math.min(round, topic.stories.length - 1));
        draw();
      },
      mic: () => micFor(),
    });

    function micFor(): void {
      const btn = container.querySelector<HTMLElement>('#micBtn')!;
      if (btn.classList.contains('listening')) return;
      btn.classList.add('listening');
      let recordedAudioUrl: string | null = null;
      listenAndRecordOnce(
        (said) => {
          btn.classList.remove('listening');
          btn.setAttribute('disabled', 'true');
          const sc = scoreMic(said, s.answer.en);
          if (sc.perfect) {
            playCorrectTone();
            fireConfetti();
          } else playTryAgainTone();
          markSlotAnswered('speaking', topic.id, 'tantangan', round, sc.perfect, { score: Math.round(sc.hitRatio * 100), itemRef: s.answer.en });
          recordEvent({
            kind: 'speak',
            skill: 'speaking',
            topicId: topic.id,
            section: 'tantangan',
            slot: round,
            itemRef: s.answer.en,
            activity: 'story',
            graded: false,
            score: Math.round(sc.hitRatio * 100),
            detail: { heard: said },
          });
          container.querySelector<HTMLElement>('#micResult')!.innerHTML = `
            <div class="${sc.perfect ? 'win-burst' : ''}" style="font-size:22px;letter-spacing:3px;text-align:center;margin-top:14px" aria-hidden="true">${sc.starRow}</div>
            <p class="mic-score">🎯 ${sc.matchedCount} dari ${sc.totalCount} kata kedengaran <span class="mic-score-pct">(${Math.round(sc.hitRatio * 100)}%)</span></p>
            <div class="word-diff">${sc.wordsHtml}</div>
            <div class="heard-text">Terdengar: "${said}"</div>
            <div class="en-text" style="margin-top:8px">Jawabannya: "${s.answer.en}"</div>
            <div class="id-text">${s.answer.id}</div>
            <div class="speak-row"><button class="speak-btn" type="button" id="playMineBtn" data-action="playMine" disabled>▶️ Play Suaramu</button></div>
          `;
          const fb = container.querySelector<HTMLElement>('#fb')!;
          fb.textContent = sc.perfect ? pickPraise(level) : pickEncourage(level);
          fb.className = 'feedback good';
          fb.insertAdjacentHTML('afterend', roundActionsHtml(round === topic.stories.length - 1));
          setHandlers({
            playMine: () => {
              if (recordedAudioUrl) new Audio(recordedAudioUrl).play().catch(() => {});
            },
            tryAgainRound: () => draw(),
            nextRound: () => {
              round += 1;
              setSectionCursor('speaking', topic.id, 'tantangan', Math.min(round, topic.stories.length - 1));
              draw();
            },
          });
        },
        (kind) => {
          btn.classList.remove('listening');
          if (kind === 'aborted') return; // lihat komentar setara di fungsi lama di atas file ini
          container.querySelector<HTMLElement>('#fb')!.textContent = 'Belum kedengaran, coba lagi 🎧';
        },
        (audioUrl) => {
          recordedAudioUrl = audioUrl;
          const playBtn = container.querySelector<HTMLButtonElement>('#playMineBtn');
          if (playBtn) playBtn.disabled = false;
        }
      );
    }
  }

  draw();
}
