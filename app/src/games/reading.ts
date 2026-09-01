/**
 * Reading — beda prinsip dari Listening: `passage`/`story` dibaca SENDIRI,
 * TIDAK PERNAH diucapkan TTS di kind ini (konsisten dgn `reading` di First
 * Placement Test, doc/first_placement_test.md §Reading — kalau dibacakan,
 * ini jadi tes dengar lagi, bukan tes baca). Reuse styling `.reading-passage`
 * / `.reading-question` yang sudah ada (placement.ts), sama warna token
 * --c-read/--c-read-bg dgn SKILL_META.reading.
 *
 * 🔒 Pengecualian TERBATAS (revisi user, lihat `renderKenalan` di bawah) —
 * KHUSUS Kenalan (bukan Latihan Inti/Tantangan, yang TETAP silent tanpa
 * kecuali) sekarang py 🔊/🎤/🎮. Alasan: Kenalan murni exposure (terjemahan
 * sudah ditampilkan gratis di sebelahnya, tidak ada yang diuji), beda dari 2
 * tahap lain yang benar² menguji dekoding mandiri kalimat BARU.
 *
 * `optHtml()` SENGAJA tidak merender `o.lbl` scr visual (beda dari
 * `games/listening.ts` yang menampilkannya) — `ReadingDrill`/`question`
 * pakai tipe `ListeningOption` yang sama (types.ts), field `lbl` tetap ada
 * di data, tapi kalau ditampilkan di sini kata di label bisa identik
 * dgn kata di `passage`/`question` yang BARU SAJA dibaca anak sendiri —
 * anak tinggal cocokkan teks tanpa benar-benar memproses bacaannya (bug
 * yang sama persis sudah dilaporkan & diperbaiki utk kind 'reading' First
 * Placement Test, `app/src/placement.ts`/`placement-test-data.ts` — celah
 * ini adalah tempat KEDUA yang kena bug sama krn reading.ts belum ikut
 * dapat perbaikan itu). Dipakai sbg `aria-label` saja (aksesibilitas
 * screen-reader), bukan teks kelihatan.
 */
function optHtml(o: { emoji: string; lbl?: string; ok?: boolean }, i: number, action: string): string {
  return `<button class="opt-btn" data-action="${action}" data-payload="${i}" ${o.lbl ? `aria-label="${o.lbl}"` : ''}>${o.emoji}</button>`;
}
import type { LevelKey, OnDone, ReadingCheckItem, ReadingCheckTopic, ReadingDrill, ReadingTopic, ReadingWordItem, ReadingWordTopic } from '../types';
import { setHandlers } from '../interaction';
import type { LatihanPlanSlot } from '../progress';
import {
  ensureSection,
  getSlot,
  hasWordInteraction,
  markSlotAnswered,
  markWordInteraction,
  recordAttempt,
  recordEvent,
  resetSectionPlan,
  setSectionCursor,
} from '../progress';
import { listenAndRecordOnce, playCorrectTone, playTryAgainTone, speak, speakSequence, sttSupported, wordMatchDetail } from '../speech';
import { pickEncourage, pickPraise } from '../praise';
import { fireConfetti } from '../confetti';
import { shuffle } from '../util';

function passageHtml(lines: string[]): string {
  return `<div class="reading-passage">${lines.map((l) => `<p>${l}</p>`).join('')}</div>`;
}

/**
 * Kenalan — format LAMA (`ReadingTopic`, Adventurer/Achiever/Trailblazer).
 * 🔒 Revisi user ("apakah di kenalan bisa ditambahkan button sound, mic,
 * dan main?") — 3 aksi per ADEGAN (`primer` item, indeks `i`): 🔊 dengar
 * (`speakSequence` baca `passage[i]`), 🎤 coba ucapkan (`sttSupported` saja
 * — skor proporsional + Play Suaramu, WAJIB ikut "Aturan Wajib: Setiap
 * Fitur Speaking Butuh Skor Proporsional + Play Suaramu" krn anak bicara
 * lewat mic), 🎮 main (1 soal REUSE PERSIS `drill[i]` yang SELALU sepasang
 * indeks dgn `primer[i]` di semua topik format lama — bukan bikin soal
 * baru, konsisten pola `runWordMiniGame` dkk skill lain).
 *
 * 🔒 Divergensi TERBATAS dari "Reading tidak pernah TTS" (komentar di atas
 * file ini) — HANYA di Kenalan, Latihan Inti & Tantangan TETAP silent tanpa
 * perubahan apa pun. Alasan: Kenalan murni EXPOSURE — terjemahan Indonesia
 * sudah ditampilkan gratis di sebelah kalimatnya, jadi TIDAK ADA yang
 * "diuji" di tahap ini. Latihan Inti/Tantangan yang benar-benar menguji
 * dekoding mandiri (kalimat BARU yang belum pernah anak baca) TETAP TIDAK
 * disentuh — bantuan dengar-opsional di Kenalan tidak mengubah apa yang
 * diukur di 2 tahap itu. **Jangan generalisasi divergensi ini ke Latihan
 * Inti/Tantangan tanpa arahan baru user.**
 */
export function renderKenalan(container: HTMLElement, topic: ReadingTopic, onNext: OnDone, level: LevelKey): void {
  const doneCls = (i: number, action: 'listen' | 'mic' | 'game'): string =>
    hasWordInteraction('reading', topic.id, i, action) ? ' done' : '';

  drawList();

  function drawList(): void {
    container.innerHTML = `
      <div class="big-emoji">${topic.scene}</div>
      <div class="id-text" style="margin-bottom:10px;">Baca sendiri dulu, ya — pelan-pelan juga tidak apa. Tap 🔊 kalau mau dengar cara bacanya${sttSupported ? ', 🎤 buat coba ucapkan' : ''}, atau 🎮 buat main.</div>
      <div class="primer-list">
        ${topic.primer
          .map(
            (p, i) => `
          <div class="primer-item" style="align-items:flex-start">
            <div class="txt">
              ${p.passage.map((l) => `<b style="display:block">${l}</b>`).join('')}
              <span>${p.id}</span>
            </div>
            <div class="mini-play${doneCls(i, 'listen')}" data-action="listenScene" data-payload="${i}">🔊</div>
            ${sttSupported ? `<div class="mini-play${doneCls(i, 'mic')}" id="micMini${i}" data-action="micScene" data-payload="${i}">🎤</div>` : ''}
            <div class="mini-play${doneCls(i, 'game')}" data-action="gameScene" data-payload="${i}">🎮</div>
          </div>`
          )
          .join('')}
      </div>
      <button class="primary-btn" data-action="advance">Lanjut ke Latihan Inti →</button>
    `;

    setHandlers({
      listenScene: (payload) => {
        const i = Number(payload);
        speakSequence(topic.primer[i].passage);
        markWordInteraction('reading', topic.id, i, 'listen');
        drawList();
      },
      micScene: (payload) => {
        const i = Number(payload);
        markWordInteraction('reading', topic.id, i, 'mic');
        recordEvent({ kind: 'interact', skill: 'reading', topicId: topic.id, section: 'kenalan', slot: i, itemRef: topic.primer[i].passage.join(' '), activity: 'mic' });
        drawList();
        micFor(i);
      },
      gameScene: (payload) => {
        const i = Number(payload);
        markWordInteraction('reading', topic.id, i, 'game');
        recordEvent({ kind: 'interact', skill: 'reading', topicId: topic.id, section: 'kenalan', slot: i, itemRef: topic.primer[i].passage.join(' '), activity: 'game' });
        runSceneMiniGame(container, topic, i, drawList, level);
      },
      advance: () => onNext(),
    });
  }

  function openMicResultPopup(index: number, said: string | null, errorText: string | null): void {
    const overlay = document.createElement('div');
    overlay.className = 'mic-pop-overlay';
    const target = topic.primer[index].passage.join(' ');

    let starRow = '';
    let wordsHtml = '';
    let heardLine = '';
    let praiseLine = '';
    let perfect = false;
    if (said !== null) {
      const words = wordMatchDetail(said, target);
      const hitRatio = words.length ? words.filter((w) => w.matched).length / words.length : 0;
      const stars = hitRatio >= 0.8 ? 3 : hitRatio >= 0.4 ? 2 : 1;
      perfect = stars === 3;
      starRow = '⭐'.repeat(stars) + '☆'.repeat(3 - stars);
      wordsHtml = words.map((w) => `<span class="${w.matched ? 'ok' : 'miss'}">${w.word}</span>`).join('');
      heardLine = `<div class="heard-text">Terdengar: "${said}"</div>`;
      if (perfect) {
        playCorrectTone();
        fireConfetti();
      } else playTryAgainTone();
      praiseLine = `<div class="feedback good" style="margin-top:6px">${perfect ? pickPraise(level) : pickEncourage(level)}</div>`;
      recordEvent({
        kind: 'speak',
        skill: 'reading',
        topicId: topic.id,
        section: 'kenalan',
        slot: index,
        itemRef: target,
        activity: 'mic',
        graded: false,
        score: Math.round(hitRatio * 100),
        detail: { heard: said, words },
      });
    }

    overlay.innerHTML = `
      <div class="mic-pop-card">
        <div style="font-size:38px" aria-hidden="true">${topic.scene}</div>
        <div class="en-text" style="margin:2px 0 10px">${topic.primer[index].passage.join(' ')}</div>
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
    const btn = document.getElementById(`micMini${index}`);
    if (!btn || btn.classList.contains('listening')) return;
    btn.classList.add('listening');
    listenAndRecordOnce(
      (said) => {
        btn.classList.remove('listening');
        openMicResultPopup(index, said, null);
      },
      (kind) => {
        btn.classList.remove('listening');
        if (kind === 'aborted') return;
        openMicResultPopup(index, null, 'Belum kedengaran, coba lagi ya 🎧');
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

/**
 * 🎮 Main — 🔒 REVISI (permintaan user: "apakah bisa buat simple sehingga
 * beda dengan latihan inti") — versi PERTAMA reuse `drill[index]` verbatim
 * (passage BARU + MCQ gambar), yang ternyata task shape-nya IDENTIK dgn
 * soal Latihan Inti (cuma beda kemasan) — bug redundansi yang sama persis
 * dgn yg pernah ditemukan di Kenalan "Main" Listening (CLAUDE.md § Listening
 * poin "kenapa masih redundant play di kenalan dengan latihan inti").
 *
 * Sekarang: **Susun Kalimat sederhana** — ambil kalimat PERTAMA dari
 * `primer[index].passage` (yang BARU SAJA dibaca anak di daftar atas),
 * acak kata-katanya, anak susun ulang jadi urutan benar (tap kata dari bank
 * → taruh, tap kata yang sudah ditaruh → lepas lagi, evaluasi OTOMATIS
 * begitu semua kata tersusun — pola SAMA PERSIS dgn `runSusunKalimat` Vocab
 * Tantangan, direplikasi lokal krn helper generik diduplikasi per file
 * game, bukan diimpor lintas skill). Task SHAPE ini genuinely BEDA dari
 * Latihan Inti (baca passage BARU → PILIH jawaban MCQ): di sini anak
 * MENGONSTRUKSI kalimat yang sudah dibaca, bukan memilih dari kalimat baru.
 * ZERO data baru diauthoring — kata-katanya di-tokenize langsung dari teks
 * yang sudah ada di `primer`.
 */
function runSceneMiniGame(container: HTMLElement, topic: ReadingTopic, index: number, onBack: OnDone, level: LevelKey): void {
  const sentence = topic.primer[index].passage[0];
  const words = sentence.replace(/[.!?]$/, '').split(' ');
  let answer: { w: string; idx: number }[] = [];
  let bank = shuffle(words.map((w, i) => ({ w, used: false, idx: i })));
  let answered = false;

  function paint(): void {
    container.innerHTML = `
      <span class="stage-badge">🎮 Main · Susun Kalimat</span>
      <div class="id-text">Susun lagi kalimat yang baru kamu baca!</div>
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

    setHandlers({
      clear: () => {
        if (answered) return;
        answer = [];
        bank = shuffle(words.map((w, i) => ({ w, used: false, idx: i })));
        paint();
      },
      removeLastWord: () => {
        if (answered || answer.length === 0) return;
        const last = answer[answer.length - 1];
        answer = answer.slice(0, -1);
        bank.find((b) => b.idx === last.idx)!.used = false;
        paint();
      },
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
    if (answered) return;
    answered = true;
    // `paint()` yang barusan jalan (dari `pick()`) sudah merender
    // `.letter-actions` sebelum `answered` jadi true — hapus langsung dari
    // DOM di sini (bukan render ulang), pola sama dgn fix Eja Kata Vocab.
    container.querySelector('.letter-actions')?.remove();
    const fb = container.querySelector<HTMLElement>('#fb')!;
    const built = answer.map((a) => a.w).join(' ');
    const correct = built.toLowerCase() === words.join(' ').toLowerCase();
    if (correct) {
      recordAttempt(true);
      playCorrectTone();
      fireConfetti();
      fb.textContent = pickPraise(level);
      fb.className = 'feedback good';
    } else {
      recordAttempt(false);
      fb.textContent = pickEncourage(level);
      fb.className = 'feedback bad';
    }
    recordEvent({ kind: 'answer', skill: 'reading', topicId: topic.id, itemRef: sentence, activity: 'scene-susun', correct });
    fb.insertAdjacentHTML('afterend', roundActionsHtml(true));
    setHandlers({
      tryAgainRound: () => {
        answered = false;
        answer = [];
        bank = shuffle(words.map((w, i) => ({ w, used: false, idx: i })));
        paint();
      },
      nextRound: () => onBack(),
    });
  }

  paint();
}

/**
 * 🔒 REVISI BESAR (permintaan user, 3 bagian, format LAMA `ReadingTopic`
 * — Adventurer/Achiever/Trailblazer): (1) "minimal 10 soal... tambahkan
 * bullet progress yang bisa diklik seperti flow di modul vocab" — Latihan
 * Inti & Tantangan sekarang py navigasi quiz-dot + persist per-soal, sama
 * pola dgn Vocab/format Reading lain; (2) "translasinya berupa klik button
 * petunjuk" (beda dari 🎮 Kenalan yang translasinya langsung terlihat) —
 * `id`/`questionId`/`storyId` (types.ts, BARU) cuma terungkap lewat SATU
 * tombol "💡 Petunjuk" (tersedia sejak awal, sekali tap ungkap SEMUA
 * translasi soal itu sekaligus, non-punitive/persist lewat Coba Lagi);
 * (3) "di Tantangan, cerita mini dipecah jadi beberapa bullet progress,
 * total pertanyaan 10 dari beberapa cerita mini" — Tantangan TIDAK LAGI 1
 * cerita+1 soal statis, tapi POOL 3 "cerita mini" (2 `drill` + 1 dari
 * `story`/`question` topik itu sendiri, diratakan ke bentuk yang sama)
 * di-cycle ke 10 ronde, sama mesin dgn Latihan Inti (`runReadingQuizSet`
 * generik) — bedanya cuma POOL & nama section.
 *
 * Latihan Inti & Tantangan SEKARANG REUSE fungsi generik ini, bukan 2
 * implementasi terpisah lagi — konsisten dgn perbaikan yg sama yg sudah
 * dibangun di format KEDUA/KETIGA Reading & di Vocab/Listening.
 */
const READING_ROUND_SIZE = 10;

function pickDrillForCount(items: ReadingDrill[], count: number): ReadingDrill[] {
  let pool: ReadingDrill[] = [];
  while (pool.length < count) pool = pool.concat(shuffle(items));
  return pool.slice(0, count);
}

/** Tantangan pakai POOL 3 "cerita mini" — 2 `drill` APA ADANYA + 1 diratakan
 *  dari `story`/`question` topik itu sendiri (BUKAN authoring cerita baru).
 *  Beda dari Latihan Inti yang cuma pakai `drill` (2 item) — supaya
 *  Tantangan tetap terasa "lebih banyak/lebih variatif", bukan cuma ulangan
 *  Latihan Inti dgn nama beda. */
function tantanganPool(topic: ReadingTopic): ReadingDrill[] {
  return [
    ...topic.drill,
    { passage: topic.story, id: topic.storyId, question: topic.question.text, questionId: topic.question.id, opts: topic.question.opts },
  ];
}

function readingHintButtonHtml(revealed: boolean): string {
  return `<button class="ghost-btn slim" type="button" data-action="petunjuk" ${revealed ? 'disabled' : ''}>💡 Petunjuk</button>`;
}

function runReadingQuizSet(
  container: HTMLElement,
  topic: ReadingTopic,
  pool: ReadingDrill[],
  section: string,
  badge: string,
  onDone: OnDone,
  level: LevelKey
): void {
  const buildPlan = (): LatihanPlanSlot[] => {
    const targets = pickDrillForCount(pool, READING_ROUND_SIZE);
    return targets.map((it) => ({ kind: 'hear', item: pool.indexOf(it) }));
  };
  let sectionState = ensureSection('reading', topic.id, section, buildPlan);
  const expectedCoverage = Math.min(pool.length, READING_ROUND_SIZE);
  const plan = sectionState.plan ?? [];
  const actualCoverage = new Set(plan.map((s) => s.item)).size;
  const isStalePlan = plan.length !== READING_ROUND_SIZE || actualCoverage < expectedCoverage;
  if (isStalePlan) {
    resetSectionPlan('reading', topic.id, section, buildPlan());
    sectionState = ensureSection('reading', topic.id, section);
  }
  const order: ReadingDrill[] = (sectionState.plan ?? []).map((slot) => pool[slot.item] ?? pool[0]);
  let round = Math.min(Math.max(sectionState.cursor, 0), order.length - 1);
  let revealed = false;

  const slotStatus = (i: number): 0 | 1 | 2 => getSlot('reading', topic.id, section, i)?.st ?? 0;

  function goTo(i: number): void {
    round = Math.min(Math.max(i, 0), order.length - 1);
    setSectionCursor('reading', topic.id, section, round);
    draw();
  }

  function draw(): void {
    if (round >= order.length) return onDone();
    revealed = false;
    redraw();
  }

  function redraw(): void {
    const d = order[round];
    container.innerHTML = `
      <div class="latihan-head">
        <span class="stage-badge">${badge}</span>
        ${readingHintButtonHtml(revealed)}
      </div>
      ${quizNavHtml(round, order.length, slotStatus)}
      <div class="id-text">Soal ${round + 1} dari ${order.length}</div>
      ${passageHtml(d.passage)}
      ${revealed ? `<div class="id-text">${d.id}</div>` : ''}
      <p class="reading-question">${d.question}</p>
      ${revealed ? `<div class="id-text">${d.questionId}</div>` : ''}
      <div class="opt-grid ${d.opts.length > 2 ? 'three' : ''}">
        ${d.opts.map((o, i) => optHtml(o, i, 'pick')).join('')}
      </div>
      <div class="feedback" id="fb"></div>
    `;
    wireQuizNav(goTo);

    setHandlers({
      petunjuk: () => {
        if (revealed) return;
        revealed = true;
        redraw();
      },
      pick: (payload) => {
        const i = Number(payload);
        const btn = container.querySelectorAll<HTMLElement>('.opt-btn')[i];
        const fb = container.querySelector<HTMLElement>('#fb')!;
        const correct = !!d.opts[i].ok;
        lockOptionButtons(container);
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
          playTryAgainTone();
          fb.textContent = pickEncourage(level);
          fb.className = 'feedback bad';
        }
        markSlotAnswered('reading', topic.id, section, round, correct, { itemRef: d.question });
        recordEvent({
          kind: 'answer',
          skill: 'reading',
          topicId: topic.id,
          section,
          slot: round,
          itemRef: d.question,
          activity: 'reading-mcq',
          correct,
        });
        fb.insertAdjacentHTML('afterend', roundActionsHtml(round === order.length - 1));
        setHandlers({
          tryAgainRound: () => redraw(),
          nextRound: () => {
            round += 1;
            setSectionCursor('reading', topic.id, section, Math.min(round, order.length - 1));
            draw();
          },
        });
      },
    });
  }

  draw();
}

export function runLatihanInti(container: HTMLElement, topic: ReadingTopic, onDone: OnDone, level: LevelKey): void {
  runReadingQuizSet(container, topic, topic.drill, 'latihan', '🎯 Baca &amp; Jawab', onDone, level);
}

export function runTantangan(container: HTMLElement, topic: ReadingTopic, onDone: OnDone, level: LevelKey): void {
  runReadingQuizSet(container, topic, tantanganPool(topic), 'tantangan-cerita', '🌟 Cerita Mini', onDone, level);
}

/**
 * ================================================================
 * FORMAT KEDUA — "Baca Kata" (`ReadingWordTopic`, khusus Little Stars).
 * Lihat komentar `ReadingWordTopic` (types.ts) & `materi/reading.md` §5
 * untuk alasan lengkap kenapa formatnya beda total dari `ReadingTopic` di
 * atas (Adventurer). Fungsi lama di atas (`renderKenalan`/`runLatihanInti`/
 * `runTantangan`) TETAP dipakai apa adanya utk Adventurer — `app.ts`
 * membedakan lewat `'items' in topic` (types.ts `AnyReadingTopic`).
 *
 * Beda dari fungsi lama (auto-advance via `setTimeout`), 3 fungsi di bawah
 * PAKAI tombol manual "🔁 Coba Lagi"/"Lanjut ➡️" (`roundActionsHtml`,
 * duplikat lokal — konsisten dgn konvensi `games/listening.ts`: helper UI
 * generik diduplikasi per file game, BUKAN diimpor lintas file, supaya
 * fungsi lama yang sudah stabil tidak ikut berisiko regresi) — perbaikan
 * yang sama yang sudah lebih dulu dibangun di Vocab/Listening.
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
  const hintBtn = container.querySelector<HTMLButtonElement>('#hintBtn');
  if (hintBtn) hintBtn.disabled = true;
}

/** Navigasi quiz-dot (lompat ke soal manapun, titik hijau = sudah dijawab) —
 *  duplikat lokal dari `games/vocabulary.ts`/`games/listening.ts` (konvensi
 *  sama: helper generik diduplikasi per file game). Sebelum revisi ini,
 *  Reading tidak punya navigasi ini sama sekali (feedback user: "kesenjangan
 *  teknis vs Vocab/Listening") — sekarang dipakai `runLatihanIntiWord` &
 *  `runTantanganWord`. */
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

const hintButtonHtml = `<button class="ghost-btn hint-chip" type="button" id="hintBtn" data-action="hint">💡 Petunjuk</button>`;

/** 💡 Petunjuk — matikan 2 dari opsi salah secara acak, sisa persis 2 pilihan
 *  (pola 50/50 yang sama dgn Vocab/Listening `wireHint`). Sekali pakai per
 *  soal. Sebelumnya Reading cuma punya "🔊/💡 Dengar" (replay audio) — bukan
 *  bantuan eliminasi opsi spt skill lain (feedback user). */
function wireHint(container: HTMLElement, opts: { ok?: boolean }[], onUsed?: () => void): void {
  let used = false;
  setHandlers({
    hint: () => {
      if (used) return;
      const btns = container.querySelectorAll<HTMLButtonElement>('.opt-btn');
      const wrongIdx = opts.map((_, i) => i).filter((i) => !opts[i].ok && !btns[i].disabled);
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

/** Ambil `count` item dari `items`, SEMUA item muncul dulu sebelum ada yang
 *  berulang — duplikat lokal dari pola `pickItemsForCount` Vocab/Listening. */
function pickItemsForCount(items: ReadingWordItem[], count: number): ReadingWordItem[] {
  let pool: ReadingWordItem[] = [];
  while (pool.length < count) pool = pool.concat(shuffle(items));
  return pool.slice(0, count);
}

const LATIHAN_ROUND_SIZE = 10;
const TANTANGAN_ROUND_SIZE = 10;

/** 4 opsi = target + 3 distraktor acak dari kata LAIN di topik yang sama
 *  (fallback kalau topiknya kebetulan <4 kata). */
function buildWordOptions(topic: ReadingWordTopic, target: ReadingWordItem): ReadingWordItem[] {
  const distractors = shuffle(topic.items.filter((it) => it !== target)).slice(0, 3);
  return shuffle([target, ...distractors]);
}

/**
 * Kenalan — TIGA aksi per kata (permintaan user: "tetap ada fitur mic dan
 * main", konsisten dgn Kenalan Vocab/Listening `renderKenalan`/
 * `renderKenalanSentence`, BUKAN cuma 🔊 spt versi sebelumnya di sesi ini):
 * 🔊 dengar (TTS), 🎤 coba ucapkan (`sttSupported` saja — device tanpa STT
 * cuma lihat 🔊+🎮), 🎮 main (1 soal kata↔gambar fokus kata itu, balik ke
 * daftar sesudahnya, `runWordMiniGame` di bawah — REUSE PERSIS mekanik
 * `runLatihanIntiWord` via `buildWordOptions`/`optHtml`, bukan bikin ulang).
 * Tombol "Lanjut ke Latihan Inti →" TETAP ada (beda dari Vocab/Listening yg
 * sudah hapus tombol ini & andalkan stepper — di sini tidak diubah, user
 * tidak minta itu disentuh).
 *
 * 🔒 Mic di sini WAJIB ikut "Aturan Wajib: Setiap Fitur Speaking Butuh Skor
 * Proporsional + 'Play Suaramu'" (CLAUDE.md) krn anak bicara lewat mic —
 * `openMicResultPopup`/`micFor` di bawah REUSE PERSIS pola
 * `games/vocabulary.ts` `renderKenalan` (bintang dari `wordMatchDetail`,
 * bukan pass/fail longgar, + tombol "▶️ Play Suaramu" dari rekaman paralel
 * `listenAndRecordOnce`) — duplikat lokal (konvensi sama dgn
 * `games/listening.ts`: helper generik diduplikasi per file game, bukan
 * diimpor lintas file skill).
 */
export function renderKenalanWord(container: HTMLElement, topic: ReadingWordTopic, onNext: OnDone, level: LevelKey): void {
  const doneCls = (i: number, action: 'listen' | 'mic' | 'game'): string =>
    hasWordInteraction('reading', topic.id, i, action) ? ' done' : '';

  drawWordList();

  function drawWordList(): void {
    container.innerHTML = `
      <div class="big-emoji">${topic.scene}</div>
      <div class="id-text" style="margin-bottom:10px;">Lihat kata Inggrisnya, tap 🔊 buat dengar cara bacanya${sttSupported ? ', 🎤 buat coba ucapkan' : ''}, atau 🎮 buat main sama kata itu</div>
      <div class="primer-list">
        ${topic.items
          .map(
            (it, i) => `
          <div class="primer-item">
            <div style="font-size:26px">${it.emoji}</div>
            <div class="txt"><b>${it.en}</b><span>${it.id}</span></div>
            <div class="mini-play${doneCls(i, 'listen')}" data-action="listen" data-payload="${i}">🔊</div>
            ${sttSupported ? `<div class="mini-play${doneCls(i, 'mic')}" id="micMini${i}" data-action="micWord" data-payload="${i}">🎤</div>` : ''}
            <div class="mini-play${doneCls(i, 'game')}" data-action="gameWord" data-payload="${i}">🎮</div>
          </div>`
          )
          .join('')}
      </div>
      <button class="primary-btn" data-action="advance">Lanjut ke Latihan Inti →</button>
    `;

    setHandlers({
      listen: (payload) => {
        const i = Number(payload);
        speak(topic.items[i].en);
        markWordInteraction('reading', topic.id, i, 'listen', topic.items[i].en);
        drawWordList();
      },
      micWord: (payload) => {
        const i = Number(payload);
        markWordInteraction('reading', topic.id, i, 'mic', topic.items[i].en);
        recordEvent({ kind: 'interact', skill: 'reading', topicId: topic.id, section: 'kenalan', slot: i, itemRef: topic.items[i].en, activity: 'mic' });
        drawWordList();
        micFor(i);
      },
      gameWord: (payload) => {
        const i = Number(payload);
        markWordInteraction('reading', topic.id, i, 'game', topic.items[i].en);
        recordEvent({ kind: 'interact', skill: 'reading', topicId: topic.id, section: 'kenalan', slot: i, itemRef: topic.items[i].en, activity: 'game' });
        runWordMiniGame(container, topic, topic.items[i], drawWordList, level);
      },
      advance: () => onNext(),
    });
  }

  function openMicResultPopup(it: ReadingWordItem, index: number, said: string | null, errorText: string | null): void {
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
      if (perfect) {
        playCorrectTone();
        fireConfetti();
      } else playTryAgainTone();
      praiseLine = `<div class="feedback good" style="margin-top:6px">${perfect ? pickPraise(level) : pickEncourage(level)}</div>`;
      recordEvent({
        kind: 'speak',
        skill: 'reading',
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

/** 🎮 Main — 1 soal kata↔gambar fokus SATU kata (dipicu dari Kenalan), balik
 *  ke daftar kata sesudahnya. REUSE PERSIS mekanik `runLatihanIntiWord`
 *  (`buildWordOptions`/`optHtml`, didefinisikan di bawah) — bukan bikin
 *  bentuk soal baru, konsisten dgn `runWordMiniGame` Vocab (`buildWordQuestion`
 *  yg jg reuse bentuk soal Latihan Inti-nya sendiri). */
function runWordMiniGame(container: HTMLElement, topic: ReadingWordTopic, item: ReadingWordItem, onBack: OnDone, level: LevelKey): void {
  function draw(): void {
    const opts = buildWordOptions(topic, item).map((it) => ({ emoji: it.emoji, lbl: it.en, ok: it === item }));
    container.innerHTML = `
      <span class="stage-badge">🎮 Main · ${item.en}</span>
      <div class="reading-word-card"><b>${item.en}</b></div>
      <p class="reading-question">Mana gambar yang cocok?</p>
      <div class="opt-grid">
        ${opts.map((o, i) => optHtml(o, i, 'pick')).join('')}
      </div>
      <div class="feedback" id="fb"></div>
    `;
    setHandlers({
      pick: (payload) => {
        const i = Number(payload);
        onAnswer(opts[i].ok, container.querySelectorAll<HTMLElement>('.opt-btn')[i]);
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
    recordEvent({ kind: 'answer', skill: 'reading', topicId: topic.id, itemRef: item.en, activity: 'word-mini', correct });
    fb.insertAdjacentHTML('afterend', roundActionsHtml(true));
    setHandlers({
      tryAgainRound: () => draw(),
      nextRound: () => onBack(),
    });
  }

  draw();
}

/**
 * Latihan Inti "🎯 Baca & Tunjuk" — 10 soal (1 per kata, diacak): kata
 * tercetak (`.reading-word-card`, besar+letter-spacing ala flashcard) jadi
 * stimulus UTAMA (bukan audio — beda sengaja dari Listening yang audio-
 * first), "🔊 Dengar" cuma bantuan OPSIONAL (tap kalau perlu, TIDAK
 * auto-play — kalau auto-play, tugasnya jadi dengar bukan baca). Opsi
 * jawaban emoji-only (`optHtml`, sudah ada di file ini) — SENGAJA tanpa
 * label teks kelihatan (pola yg sama dgn format lama, lihat komentar
 * `optHtml` di atas file ini): kalau opsi ikut menampilkan teks yang bisa
 * sama persis dgn kata target di atas, anak bisa cocokkan BENTUK tanpa
 * benar-benar membaca maknanya.
 */
export function runLatihanIntiWord(container: HTMLElement, topic: ReadingWordTopic, onDone: OnDone, level: LevelKey): void {
  const buildPlan = (): LatihanPlanSlot[] => {
    const targets = pickItemsForCount(topic.items, LATIHAN_ROUND_SIZE);
    // `kind` union-nya ikut Vocab (`hear|toEn|toId|sentence`, `progress.ts`)
    // TAPI Reading Latihan Inti cuma py 1 SHAPE soal — dipinjam labelnya
    // saja ('hear', tidak dipakai secara semantik), sama pola dgn
    // `games/listening.ts` yang jg meminjam label union ini.
    return targets.map((it) => ({ kind: 'hear', item: topic.items.indexOf(it) }));
  };
  let section = ensureSection('reading', topic.id, 'latihan', buildPlan);
  const expectedCoverage = Math.min(topic.items.length, LATIHAN_ROUND_SIZE);
  const plan = section.plan ?? [];
  const actualCoverage = new Set(plan.map((s) => s.item)).size;
  const isStalePlan = plan.length !== LATIHAN_ROUND_SIZE || actualCoverage < expectedCoverage;
  if (isStalePlan) {
    resetSectionPlan('reading', topic.id, 'latihan', buildPlan());
    section = ensureSection('reading', topic.id, 'latihan');
  }
  const order: ReadingWordItem[] = (section.plan ?? []).map((slot) => topic.items[slot.item] ?? topic.items[0]);
  let round = Math.min(Math.max(section.cursor, 0), order.length - 1);
  let hintUsedThisSlot = false;

  const slotStatus = (i: number): 0 | 1 | 2 => getSlot('reading', topic.id, 'latihan', i)?.st ?? 0;

  function goTo(i: number): void {
    round = Math.min(Math.max(i, 0), order.length - 1);
    setSectionCursor('reading', topic.id, 'latihan', round);
    draw();
  }

  function draw(): void {
    if (round >= order.length) return onDone();
    hintUsedThisSlot = false;
    redraw();
  }

  function redraw(): void {
    const target = order[round];
    const opts = buildWordOptions(topic, target).map((it) => ({ emoji: it.emoji, lbl: it.en, ok: it === target }));

    container.innerHTML = `
      <div class="latihan-head">
        <span class="stage-badge">🎯 Baca &amp; Tunjuk</span>
        ${hintButtonHtml}
      </div>
      ${quizNavHtml(round, order.length, slotStatus)}
      <div class="id-text">Soal ${round + 1} dari ${order.length}</div>
      <div class="reading-word-card"><b>${target.en}</b></div>
      <div class="speak-row"><button class="speak-btn-ghost" type="button" data-action="replay">🔊 Dengar</button></div>
      <p class="reading-question">Mana gambar yang cocok?</p>
      <div class="opt-grid">
        ${opts.map((o, i) => optHtml(o, i, 'pick')).join('')}
      </div>
      <div class="feedback" id="fb"></div>
    `;
    wireHint(container, opts, () => (hintUsedThisSlot = true));
    wireQuizNav(goTo);

    setHandlers({
      replay: () => speak(target.en),
      pick: (payload) => {
        const i = Number(payload);
        const btn = container.querySelectorAll<HTMLElement>('.opt-btn')[i];
        const fb = container.querySelector<HTMLElement>('#fb')!;
        const correct = !!opts[i].ok;
        lockOptionButtons(container);
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
          playTryAgainTone();
          fb.textContent = pickEncourage(level);
          fb.className = 'feedback bad';
        }
        markSlotAnswered('reading', topic.id, 'latihan', round, correct, { hint: hintUsedThisSlot, itemRef: target.en });
        recordEvent({
          kind: 'answer',
          skill: 'reading',
          topicId: topic.id,
          section: 'latihan',
          slot: round,
          itemRef: target.en,
          activity: 'word-to-picture',
          correct,
          hintUsed: hintUsedThisSlot,
        });
        fb.insertAdjacentHTML('afterend', roundActionsHtml(round === order.length - 1));
        setHandlers({
          tryAgainRound: () => redraw(),
          nextRound: () => {
            round += 1;
            setSectionCursor('reading', topic.id, 'latihan', Math.min(round, order.length - 1));
            draw();
          },
        });
      },
    });
  }

  draw();
}

/**
 * Tantangan "🖼️ Lihat & Baca" — 10 soal, ARAH DIBALIK dari Latihan Inti
 * (permintaan user "wajib ada improvement" — tangga 2-arah yang tidak
 * dipunyai kompetitor manapun yang diriset, `materi/reading.md` §6): gambar
 * jadi stimulus, anak pilih KATA TERCETAK yang cocok dari 4 opsi TEKS
 * (`.opt-btn-text`, dipinjam dari gaya opsi teks First Placement Test) —
 * kali ini teks opsi SENGAJA kelihatan (beda dari Latihan Inti) krn justru
 * itu yang mau dilatih: membedakan BENTUK CETAK 4 kata yang mirip-mirip
 * panjang, bukan cuma tebak dari gambar. "💡 Dengar" tetap tersedia sbg
 * bantuan opsional (bukan solusi instan — TTS baca kata TARGET, bukan
 * jawabannya, anak tetap harus cocokkan sendiri).
 */
export function runTantanganWord(container: HTMLElement, topic: ReadingWordTopic, onDone: OnDone, level: LevelKey): void {
  const buildPlan = (): LatihanPlanSlot[] => {
    const targets = pickItemsForCount(topic.items, TANTANGAN_ROUND_SIZE);
    return targets.map((it) => ({ kind: 'hear', item: topic.items.indexOf(it) }));
  };
  let section = ensureSection('reading', topic.id, 'tantangan-baca', buildPlan);
  const expectedCoverage = Math.min(topic.items.length, TANTANGAN_ROUND_SIZE);
  const plan = section.plan ?? [];
  const actualCoverage = new Set(plan.map((s) => s.item)).size;
  const isStalePlan = plan.length !== TANTANGAN_ROUND_SIZE || actualCoverage < expectedCoverage;
  if (isStalePlan) {
    resetSectionPlan('reading', topic.id, 'tantangan-baca', buildPlan());
    section = ensureSection('reading', topic.id, 'tantangan-baca');
  }
  const order: ReadingWordItem[] = (section.plan ?? []).map((slot) => topic.items[slot.item] ?? topic.items[0]);
  let round = Math.min(Math.max(section.cursor, 0), order.length - 1);
  let hintUsedThisSlot = false;

  const slotStatus = (i: number): 0 | 1 | 2 => getSlot('reading', topic.id, 'tantangan-baca', i)?.st ?? 0;

  function goTo(i: number): void {
    round = Math.min(Math.max(i, 0), order.length - 1);
    setSectionCursor('reading', topic.id, 'tantangan-baca', round);
    draw();
  }

  function draw(): void {
    if (round >= order.length) return onDone();
    hintUsedThisSlot = false;
    redraw();
  }

  function redraw(): void {
    const target = order[round];
    const opts = buildWordOptions(topic, target);

    container.innerHTML = `
      <div class="latihan-head">
        <span class="stage-badge">🖼️ Lihat &amp; Baca</span>
        ${hintButtonHtml}
      </div>
      ${quizNavHtml(round, order.length, slotStatus)}
      <div class="id-text">Soal ${round + 1} dari ${order.length}</div>
      <div class="big-emoji">${target.emoji}</div>
      <p class="reading-question">Kata mana yang cocok dengan gambar ini?</p>
      <div class="opt-grid">
        ${opts.map((o, i) => `<button class="opt-btn opt-btn-text" type="button" data-action="pick" data-payload="${i}">${o.en}</button>`).join('')}
      </div>
      <div class="speak-row"><button class="speak-btn-ghost" type="button" data-action="dengar">💡 Dengar</button></div>
      <div class="feedback" id="fb"></div>
    `;
    // 💡 Petunjuk (eliminasi 2 opsi) beda dari "💡 Dengar" (replay audio kata
    // target) — dua bantuan berbeda, keduanya opsional, tidak saling ganti.
    wireHint(
      container,
      opts.map((o) => ({ ok: o === target })),
      () => (hintUsedThisSlot = true)
    );
    wireQuizNav(goTo);

    setHandlers({
      dengar: () => speak(target.en),
      pick: (payload) => {
        const i = Number(payload);
        const btn = container.querySelectorAll<HTMLElement>('.opt-btn')[i];
        const fb = container.querySelector<HTMLElement>('#fb')!;
        const correct = opts[i] === target;
        lockOptionButtons(container);
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
          playTryAgainTone();
          fb.textContent = pickEncourage(level);
          fb.className = 'feedback bad';
        }
        markSlotAnswered('reading', topic.id, 'tantangan-baca', round, correct, { hint: hintUsedThisSlot, itemRef: target.en });
        recordEvent({
          kind: 'answer',
          skill: 'reading',
          topicId: topic.id,
          section: 'tantangan-baca',
          slot: round,
          itemRef: target.en,
          activity: 'picture-to-word',
          correct,
          hintUsed: hintUsedThisSlot,
        });
        fb.insertAdjacentHTML('afterend', roundActionsHtml(round === order.length - 1));
        setHandlers({
          tryAgainRound: () => redraw(),
          nextRound: () => {
            round += 1;
            setSectionCursor('reading', topic.id, 'tantangan-baca', Math.min(round, order.length - 1));
            draw();
          },
        });
      },
    });
  }

  draw();
}

/**
 * ================================================================
 * FORMAT KETIGA — "Baca & Nilai" (`ReadingCheckTopic`, khusus Explorer).
 * Lihat komentar `ReadingCheckTopic` (types.ts) & `materi/reading.md` §9.2
 * utk alasan lengkap kenapa Explorer BUTUH format sendiri (bukan versi kecil
 * `ReadingTopic` Adventurer). Keluarga "silent reading" SAMA dgn
 * `ReadingTopic` — TTS TIDAK PERNAH dipakai di kind manapun di sini
 * (Kenalan/Latihan Inti/Tantangan SEMUA silent), beda dari `ReadingWordTopic`
 * yang audio-nya sengaja aktif utk pra-pembaca. Pembeda runtime dari 2
 * format lain: `'checks' in topic` (types.ts `AnyReadingTopic`).
 * ================================================================
 */

const CHECK_ROUND_SIZE = 10;
const CHECK_TANTANGAN_ROUND_SIZE = 10;

function pickCheckItemsForCount(items: ReadingCheckItem[], count: number): ReadingCheckItem[] {
  let pool: ReadingCheckItem[] = [];
  while (pool.length < count) pool = pool.concat(shuffle(items));
  return pool.slice(0, count);
}

function buildCheckOptions(topic: ReadingCheckTopic, target: ReadingCheckItem): ReadingCheckItem[] {
  const distractors = shuffle(topic.checks.filter((it) => it !== target)).slice(0, 3);
  return shuffle([target, ...distractors]);
}

/**
 * Kenalan — daftar kalimat, murni EXPOSURE & SILENT (konsisten dgn
 * `renderKenalan` format lama Adventurer di atas file ini — TIDAK ada TTS/
 * mic/game di sini, beda sengaja dari `renderKenalanWord`/Little Stars yang
 * audio-first). Emoji + kalimat Inggris BENAR (tercetak besar) + terjemahan.
 */
export function renderKenalanCheck(container: HTMLElement, topic: ReadingCheckTopic, onNext: OnDone): void {
  container.innerHTML = `
    <div class="big-emoji">${topic.scene}</div>
    <div class="id-text" style="margin-bottom:10px;">Baca sendiri dulu, ya — pelan-pelan juga tidak apa</div>
    <div class="primer-list">
      ${topic.checks
        .map(
          (c) => `
        <div class="primer-item" style="align-items:flex-start">
          <div style="font-size:26px">${c.emoji}</div>
          <div class="txt">
            <b style="display:block">${c.trueSentence}</b>
            <span>${c.id}</span>
          </div>
        </div>`
        )
        .join('')}
    </div>
    <button class="primary-btn" data-action="advance">Lanjut ke Latihan Inti →</button>
  `;
  setHandlers({ advance: () => onNext() });
}

/**
 * Latihan Inti "🤔 Benar atau Salah?" — 10 soal: gambar + 1 kalimat (dipilih
 * ACAK `trueSentence`/`falseSentence`, 50/50 — pola sama `games/
 * listening.ts` `drawTrueFalse`), anak BACA SENDIRI (TANPA TTS, titik
 * pertama di tangga Reading yang menguji ini) lalu jawab Benar✅/Salah❌.
 * TANPA tombol Petunjuk — soal biner, sama alasan dgn "Benar atau Salah"
 * Listening (eliminasi opsi tidak relevan di soal 2-pilihan).
 */
export function runLatihanIntiCheck(container: HTMLElement, topic: ReadingCheckTopic, onDone: OnDone, level: LevelKey): void {
  const buildPlan = (): LatihanPlanSlot[] => {
    const targets = pickCheckItemsForCount(topic.checks, CHECK_ROUND_SIZE);
    return targets.map((it) => ({ kind: 'hear', item: topic.checks.indexOf(it) }));
  };
  let section = ensureSection('reading', topic.id, 'latihan', buildPlan);
  const expectedCoverage = Math.min(topic.checks.length, CHECK_ROUND_SIZE);
  const plan = section.plan ?? [];
  const actualCoverage = new Set(plan.map((s) => s.item)).size;
  const isStalePlan = plan.length !== CHECK_ROUND_SIZE || actualCoverage < expectedCoverage;
  if (isStalePlan) {
    resetSectionPlan('reading', topic.id, 'latihan', buildPlan());
    section = ensureSection('reading', topic.id, 'latihan');
  }
  const order: ReadingCheckItem[] = (section.plan ?? []).map((slot) => topic.checks[slot.item] ?? topic.checks[0]);
  let round = Math.min(Math.max(section.cursor, 0), order.length - 1);

  const slotStatus = (i: number): 0 | 1 | 2 => getSlot('reading', topic.id, 'latihan', i)?.st ?? 0;

  function goTo(i: number): void {
    round = Math.min(Math.max(i, 0), order.length - 1);
    setSectionCursor('reading', topic.id, 'latihan', round);
    draw();
  }

  function draw(): void {
    if (round >= order.length) return onDone();
    redraw();
  }

  function redraw(): void {
    const item = order[round];
    const claimTrue = Math.random() < 0.5;
    const claim = claimTrue ? item.trueSentence : item.falseSentence;

    container.innerHTML = `
      <span class="stage-badge">🤔 Benar atau Salah?</span>
      ${quizNavHtml(round, order.length, slotStatus)}
      <div class="id-text">Soal ${round + 1} dari ${order.length}</div>
      <div class="big-emoji">${item.emoji}</div>
      <p class="reading-question">${claim}</p>
      <div class="opt-grid">
        <button class="opt-btn answer-card" type="button" data-action="pick" data-payload="true">
          <span class="answer-card-emoji" aria-hidden="true">✅</span>
          <span class="answer-card-bottom"><span class="answer-card-label">Benar</span></span>
        </button>
        <button class="opt-btn answer-card" type="button" data-action="pick" data-payload="false">
          <span class="answer-card-emoji" aria-hidden="true">❌</span>
          <span class="answer-card-bottom"><span class="answer-card-label">Salah</span></span>
        </button>
      </div>
      <div class="feedback" id="fb"></div>
    `;
    wireQuizNav(goTo);

    setHandlers({
      pick: (payload) => {
        const said = payload === 'true';
        const btn = container.querySelectorAll<HTMLElement>('.opt-btn')[said ? 0 : 1];
        const fb = container.querySelector<HTMLElement>('#fb')!;
        const correct = said === claimTrue;
        lockOptionButtons(container);
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
          playTryAgainTone();
          fb.textContent = pickEncourage(level);
          fb.className = 'feedback bad';
        }
        markSlotAnswered('reading', topic.id, 'latihan', round, correct, { itemRef: item.trueSentence });
        recordEvent({
          kind: 'answer',
          skill: 'reading',
          topicId: topic.id,
          section: 'latihan',
          slot: round,
          itemRef: item.trueSentence,
          activity: 'truefalse',
          correct,
        });
        fb.insertAdjacentHTML('afterend', roundActionsHtml(round === order.length - 1));
        setHandlers({
          tryAgainRound: () => redraw(),
          nextRound: () => {
            round += 1;
            setSectionCursor('reading', topic.id, 'latihan', Math.min(round, order.length - 1));
            draw();
          },
        });
      },
    });
  }

  draw();
}

/**
 * Tantangan "🔍 Baca & Temukan" — 10 soal, task SHAPE beda dari Latihan Inti
 * (permintaan "SETIAP langkah task shape beda", `materi/reading.md` §9.2):
 * kalimat BENAR ditampilkan SENDIRIAN (TANPA gambar — beda dari Latihan Inti
 * yang gambar+kalimat sekaligus), anak baca lalu pilih GAMBAR yang cocok
 * dari 4 opsi emoji-only (`optHtml`, tanpa label teks kelihatan — cegah
 * celah cocok-teks, sama prinsip `runTantanganWord`). "💡 Petunjuk"
 * eliminasi 2 opsi TERSEDIA di sini (4 pilihan, beda dari Latihan Inti yg
 * biner).
 */
export function runTantanganCheck(container: HTMLElement, topic: ReadingCheckTopic, onDone: OnDone, level: LevelKey): void {
  const buildPlan = (): LatihanPlanSlot[] => {
    const targets = pickCheckItemsForCount(topic.checks, CHECK_TANTANGAN_ROUND_SIZE);
    return targets.map((it) => ({ kind: 'hear', item: topic.checks.indexOf(it) }));
  };
  let section = ensureSection('reading', topic.id, 'tantangan-cek', buildPlan);
  const expectedCoverage = Math.min(topic.checks.length, CHECK_TANTANGAN_ROUND_SIZE);
  const plan = section.plan ?? [];
  const actualCoverage = new Set(plan.map((s) => s.item)).size;
  const isStalePlan = plan.length !== CHECK_TANTANGAN_ROUND_SIZE || actualCoverage < expectedCoverage;
  if (isStalePlan) {
    resetSectionPlan('reading', topic.id, 'tantangan-cek', buildPlan());
    section = ensureSection('reading', topic.id, 'tantangan-cek');
  }
  const order: ReadingCheckItem[] = (section.plan ?? []).map((slot) => topic.checks[slot.item] ?? topic.checks[0]);
  let round = Math.min(Math.max(section.cursor, 0), order.length - 1);
  let hintUsedThisSlot = false;

  const slotStatus = (i: number): 0 | 1 | 2 => getSlot('reading', topic.id, 'tantangan-cek', i)?.st ?? 0;

  function goTo(i: number): void {
    round = Math.min(Math.max(i, 0), order.length - 1);
    setSectionCursor('reading', topic.id, 'tantangan-cek', round);
    draw();
  }

  function draw(): void {
    if (round >= order.length) return onDone();
    hintUsedThisSlot = false;
    redraw();
  }

  function redraw(): void {
    const target = order[round];
    const opts = buildCheckOptions(topic, target);

    container.innerHTML = `
      <div class="latihan-head">
        <span class="stage-badge">🔍 Baca &amp; Temukan</span>
        ${hintButtonHtml}
      </div>
      ${quizNavHtml(round, order.length, slotStatus)}
      <div class="id-text">Soal ${round + 1} dari ${order.length}</div>
      <p class="reading-question">${target.trueSentence}</p>
      <div class="opt-grid">
        ${opts.map((o, i) => optHtml({ emoji: o.emoji, lbl: o.trueSentence, ok: o === target }, i, 'pick')).join('')}
      </div>
      <div class="feedback" id="fb"></div>
    `;
    wireHint(
      container,
      opts.map((o) => ({ ok: o === target })),
      () => (hintUsedThisSlot = true)
    );
    wireQuizNav(goTo);

    setHandlers({
      pick: (payload) => {
        const i = Number(payload);
        const btn = container.querySelectorAll<HTMLElement>('.opt-btn')[i];
        const fb = container.querySelector<HTMLElement>('#fb')!;
        const correct = opts[i] === target;
        lockOptionButtons(container);
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
          playTryAgainTone();
          fb.textContent = pickEncourage(level);
          fb.className = 'feedback bad';
        }
        markSlotAnswered('reading', topic.id, 'tantangan-cek', round, correct, { hint: hintUsedThisSlot, itemRef: target.trueSentence });
        recordEvent({
          kind: 'answer',
          skill: 'reading',
          topicId: topic.id,
          section: 'tantangan-cek',
          slot: round,
          itemRef: target.trueSentence,
          activity: 'sentence-to-picture',
          correct,
          hintUsed: hintUsedThisSlot,
        });
        fb.insertAdjacentHTML('afterend', roundActionsHtml(round === order.length - 1));
        setHandlers({
          tryAgainRound: () => redraw(),
          nextRound: () => {
            round += 1;
            setSectionCursor('reading', topic.id, 'tantangan-cek', Math.min(round, order.length - 1));
            draw();
          },
        });
      },
    });
  }

  draw();
}
