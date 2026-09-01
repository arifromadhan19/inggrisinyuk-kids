import type {
  LevelKey,
  ListeningDialogueTopic,
  ListeningInferenceQuestion,
  ListeningItemsTopic,
  ListeningNoteGap,
  ListeningNoteTopic,
  ListeningQuestionOption,
  ListeningSentenceItem,
  ListeningSentenceTopic,
  ListeningTopic,
  OnDone,
} from '../types';
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
import { listenAndRecordOnce, playCorrectTone, playTryAgainTone, speak, speakLocalized, speakSequence, sttSupported, wordMatchDetail } from '../speech';
import { pickEncourage, pickPraise } from '../praise';
import { shuffle } from '../util';

export function renderKenalan(container: HTMLElement, topic: ListeningTopic, onNext: OnDone): void {
  container.innerHTML = `
    <div class="big-emoji">${topic.scene}</div>
    <div class="id-text" style="margin-bottom:10px;">Dengar dulu contoh kalimatnya</div>
    <div class="primer-list">
      ${topic.primer
        .map(
          (p, i) => `
        <div class="primer-item">
          <div class="txt"><b>${p.en}</b><span>${p.id}</span></div>
          <div class="mini-play" data-action="play" data-payload="${i}">🔊</div>
        </div>`
        )
        .join('')}
    </div>
    <button class="primary-btn" data-action="advance">Lanjut ke Latihan Inti →</button>
  `;
  setHandlers({
    play: (payload) => speak(topic.primer[Number(payload)].en),
    advance: () => onNext(),
  });
}

/**
 * 💡 Petunjuk utk format LAMA (`ListeningDrill`/`question.opts`, keduanya
 * `ListeningOption[]` — cuma py `.ok`, beda dari `ListeningQuestionOption`
 * yg format baru pakai lewat `wireHint`) — logic-nya IDENTIK `wireHint` di
 * bawah (eliminasi sampai 2 opsi salah), tapi diduplikasi jadi fungsi kecil
 * sendiri drpd maksa `wireHint` nerima tipe yg beda field-nya, biar tidak
 * ganggu fungsi yg sudah diverifikasi di format baru (§CLAUDE.md "Listening
 * — 4 Format Berdampingan": helper generik DIDUPLIKASI, bukan dishare,
 * supaya tidak ada risiko regresi silang format).
 */
function wireOldFormatHint(container: HTMLElement, opts: { ok?: boolean }[]): void {
  let used = false;
  setHandlers({
    hint: () => {
      if (used) return;
      const btns = container.querySelectorAll<HTMLButtonElement>('.opt-btn');
      const wrongIdx = opts.map((_, i) => i).filter((i) => !opts[i].ok && !btns[i]?.disabled);
      if (!wrongIdx.length) return;
      used = true;
      const toEliminate = shuffle(wrongIdx).slice(0, Math.min(2, wrongIdx.length));
      toEliminate.forEach((pick) => {
        btns[pick].disabled = true;
        btns[pick].classList.add('eliminated');
      });
      const hintBtn = container.querySelector<HTMLButtonElement>('#hintBtn');
      if (hintBtn) hintBtn.disabled = true;
    },
  });
}

/**
 * Format LAMA — revisi (analisis user "apa yang perlu di-improve"): dulu
 * auto-advance via `setTimeout` (anak tidak bisa atur pace sendiri, TIDAK
 * ada hint) & TIDAK PERNAH manggil `playCorrectTone`/`playTryAgainTone`/
 * `fireConfetti` sama sekali — melanggar "🔒 Aturan Wajib: Setiap Percobaan
 * Anak Harus Direspons" (CLAUDE.md, berlaku "di game mana pun") krn feedback
 * cuma teks polos tanpa nada/animasi festive. Sekarang disamakan ke pola
 * non-punitive yg sudah jadi standar app (Vocab/format baru Listening):
 * tombol manual 🔁 Coba Lagi/➡️ Lanjut (`roundActionsHtml`), 💡 Petunjuk
 * (`wireOldFormatHint`), nada+confetti benar mengikuti aturan wajib di atas.
 * Konten (`drill`/`story`/`question`) TIDAK diubah sama sekali — murni
 * modernisasi interaksi, bukan migrasi format (`'items' in topic` tetap
 * `false` utk topik ini, `app.ts` dispatch tidak berubah).
 */
export function runLatihanInti(container: HTMLElement, topic: ListeningTopic, onDone: OnDone): void {
  let round = 0;

  function draw(): void {
    if (round >= topic.drill.length) return onDone();
    const d = topic.drill[round];
    const play = () => speak(d.en);
    container.innerHTML = `
      <div class="latihan-head">
        <span class="stage-badge">🎯 Dengar &amp; Pilih</span>
        ${hintButtonHtml}
      </div>
      <div class="id-text">Soal ${round + 1} dari ${topic.drill.length}</div>
      <div class="speak-row"><button class="speak-btn" data-action="replay">🔊 Putar Kalimat</button></div>
      <div class="opt-grid ${d.opts.length > 2 ? 'three' : ''}">
        ${d.opts.map((o, i) => `<button class="opt-btn" type="button" data-action="pick" data-payload="${i}">${o.emoji}</button>`).join('')}
      </div>
      <div class="feedback" id="fb"></div>
    `;
    play();
    wireOldFormatHint(container, d.opts);

    setHandlers({
      replay: play,
      pick: (payload) => {
        const i = Number(payload);
        const btn = container.querySelectorAll<HTMLElement>('.opt-btn')[i];
        const fb = container.querySelector<HTMLElement>('#fb')!;
        const correct = !!d.opts[i].ok;
        lockOptionButtons(container);
        recordAttempt(correct);
        if (correct) {
          btn.classList.add('correct', 'win-burst');
          playCorrectTone();
          fireConfetti();
          fb.textContent = 'Tepat! 🎉';
          fb.className = 'feedback good';
        } else {
          btn.classList.add('wrong');
          playTryAgainTone();
          fb.textContent = 'Dengar lagi, yuk 💪';
          fb.className = 'feedback bad';
        }
        fb.insertAdjacentHTML('afterend', roundActionsHtml(round === topic.drill.length - 1));
        setHandlers({
          tryAgainRound: () => draw(),
          nextRound: () => {
            round += 1;
            draw();
          },
        });
      },
    });
  }

  draw();
}

export function runTantangan(container: HTMLElement, topic: ListeningTopic, onDone: OnDone): void {
  function draw(): void {
    const playStory = () => speakSequence(topic.story, 1900);
    container.innerHTML = `
      <div class="latihan-head">
        <span class="stage-badge">🌟 Dengar Cerita Mini</span>
        ${hintButtonHtml}
      </div>
      <div class="big-emoji">${topic.scene}</div>
      <div class="speak-row"><button class="speak-btn" data-action="playStory">▶️ Putar Ceritanya</button></div>
      <div class="en-text" style="margin-top:10px;">${topic.question.en}</div>
      ${answerCardsHtml(
        topic.question.opts.map((o) => ({ emoji: o.emoji, label: o.lbl ?? '' })),
        'answer'
      )}
      <div class="feedback" id="fb"></div>
    `;
    playStory();
    wireOldFormatHint(container, topic.question.opts);

    setHandlers({
      playStory,
      answer: (payload) => {
        const i = Number(payload);
        const btn = container.querySelectorAll<HTMLElement>('.opt-btn')[i];
        const fb = container.querySelector<HTMLElement>('#fb')!;
        const correct = !!topic.question.opts[i].ok;
        lockOptionButtons(container);
        recordAttempt(correct);
        if (correct) {
          btn.classList.add('correct', 'win-burst');
          playCorrectTone();
          fireConfetti();
          fb.textContent = 'Ceritanya kedengeran ya! 🎉';
          fb.className = 'feedback good';
        } else {
          btn.classList.add('wrong');
          playTryAgainTone();
          fb.textContent = 'Coba putar & dengar lagi 💪';
          fb.className = 'feedback bad';
        }
        fb.insertAdjacentHTML('afterend', roundActionsHtml(true));
        setHandlers({
          tryAgainRound: () => draw(),
          nextRound: () => onDone(),
        });
      },
    });
  }

  draw();
}

/**
 * ================================================================
 * Format BARU (`ListeningSentenceTopic`, types.ts) — permintaan user
 * "format dan flow nya mengikuti vocab": Kenalan (🔊/🎤/🎮 per kalimat),
 * Latihan Inti (10 soal dgn kartu jawaban+hint), Tantangan (3 tab: Eja
 * Kata/Susun Kalimat/Penggunaan). Diadaptasi (bukan reuse import) dari
 * `games/vocabulary.ts` — file itu SENGAJA tidak disentuh (risiko regresi
 * ke 6 level yang sudah diverifikasi), jadi helper generik (roundActions/
 * quizNav/answerCards/hint/dst) diduplikasi & disesuaikan ke bentuk
 * `ListeningSentenceItem` (en/id/emoji = kata kunci Eja Kata, example =
 * kalimat lengkap Susun Kalimat/Penggunaan/Kenalan, question = BARU utk
 * Listening). Fungsi lama di atas (`renderKenalan`/`runLatihanInti`/
 * `runTantangan`) TETAP dipakai apa adanya utk Explorer/Adventurer
 * (`ListeningTopic` lama) — `app.ts` membedakan lewat `'items' in topic`.
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

const hintButtonHtml = `<button class="ghost-btn hint-chip" type="button" id="hintBtn" data-action="hint">💡 Petunjuk</button>`;

/**
 * Clue "Tampilkan Teks"/"Tampilkan Terjemahan" (permintaan user) — dipakai
 * di Kenalan "Main" & KEDUA jenis soal Latihan Inti. Beda dari 💡 Petunjuk
 * (`wireHint`, tersedia dari awal, eliminasi 2 opsi salah): clue ini
 * TERKUNCI sampai anak sudah 1x mencoba jawab soal ini (`attempted`,
 * permintaan user "dengan syarat harus 1x mencoba dulu") — dengar-dulu jadi
 * jalur UTAMA, teks/terjemahan jadi bantuan yang DIPEROLEH lewat usaha,
 * bukan langsung kelihatan. Sekali dipakai per soal (tombolnya nonaktif
 * begitu ditap), TAPI tetap kelihatan (non-punitive) begitu "Coba Lagi" —
 * caller WAJIB redraw pakai fungsi yang TIDAK me-reset `attempted`/
 * `showText`/`showTranslation` (lihat `redraw()` vs `draw()` di
 * `runLatihanIntiSentence`), kalau tidak clue-nya kekunci lagi stlh retry.
 */
function clueButtonsHtml(attempted: boolean, showText: boolean, showTranslation: boolean): string {
  if (!attempted) return '';
  return `<div class="letter-actions">
    <button class="ghost-btn slim" type="button" data-action="clueText" ${showText ? 'disabled' : ''}>📝 Tampilkan Teks</button>
    <button class="ghost-btn slim" type="button" data-action="clueTranslate" ${showTranslation ? 'disabled' : ''}>🌐 Tampilkan Terjemahan</button>
  </div>`;
}

/**
 * Petunjuk SEDERHANA "💡 Petunjuk" (permintaan user, revisi khusus utk
 * Kenalan "Main" & Tantangan: "simplify jadi button petunjuk jadi
 * tampilkan text dan tampilkan terjemahan... ketika diklik maka muncul
 * text serta terjemahannya... dimana petunjuk langsung ada di depan tidak
 * perlu nunggu sekali coba dulu") — BEDA dari `clueButtonsHtml` di atas
 * (2 tombol terpisah, terkunci sampai 1x attempt, dipakai Latihan Inti —
 * TIDAK diubah, user tidak minta itu disentuh sesi ini): di sini SATU
 * tombol, TERSEDIA SEJAK AWAL (tanpa gating), sekali tap langsung ungkap
 * teks Inggris + terjemahan Indonesia SEKALIGUS. Dipakai `runItemMiniGame`
 * (Kenalan) & `runSusunKalimatSentence`/`drawSusun` (Tantangan).
 *
 * Posisi & ukuran (revisi user berikutnya: "update posisi petunjuk sebelah
 * kanan button dengarkan... ukurannya di samakan") — ditaruh DI DALAM
 * `.speak-row` yang sama dgn "🔊 Dengar Lagi" (sebelah kanannya, bukan di
 * `.letter-actions` terpisah lagi), pakai class `.speak-btn-ghost`
 * (styles.css) — SAMA UKURAN (padding/font-size/border-radius pill) dgn
 * `.speak-btn`, cuma beda warna (ghost/outline, bukan solid) biar tetap
 * kebeda sbg aksi sekunder.
 */
function petunjukButtonHtml(revealed: boolean): string {
  return `<button class="speak-btn-ghost" type="button" data-action="petunjuk" ${revealed ? 'disabled' : ''}>💡 Petunjuk</button>`;
}

/** Ucapkan teks Inggris DULU, baru terjemahan Indonesia SETELAH jeda
 *  (permintaan user: "muncul text serta terjemahannya") — tidak bisa pakai
 *  `speakSequence` (1 bahasa saja utk semua baris), jadi 2 panggilan
 *  terpisah (`speak` lalu `speakLocalized`) dgn `setTimeout` spt jeda
 *  `speakSequence` (1600ms) supaya utterance pertama tidak langsung
 *  ke-cancel oleh yang kedua (`speak()`/`speakLocalized()` sama2 manggil
 *  `speechSynthesis.cancel()` di awal). */
function speakBilingual(en: string, id: string): void {
  speak(en);
  setTimeout(() => speakLocalized(id, 'id-ID'), 1600);
}

/** Kenalan — 1 baris per kalimat: 🔊 dengar, 🎤 ucap ulang (skor proporsional
 *  + Play Suaramu, Aturan Wajib Speaking CLAUDE.md), 🎮 main (1 soal
 *  komprehensi fokus kalimat itu, balik ke daftar sesudahnya). */
export function renderKenalanSentence(container: HTMLElement, topic: ListeningItemsTopic, level: LevelKey): void {
  const doneCls = (i: number, action: 'listen' | 'mic' | 'game'): string =>
    hasWordInteraction('listening', topic.id, i, action) ? ' done' : '';

  drawList();

  function drawList(): void {
    container.innerHTML = `
      <div class="id-text" style="margin-bottom:10px;">Dengarkan kalimatnya dulu, tap 🔊 untuk mengulang${sttSupported ? ', tap 🎤 buat coba ucapkan' : ''}, atau tap 🎮 buat main sama kalimat itu</div>
      <div class="primer-list">
        ${topic.items
          .map(
            (it, i) => `
          <div class="primer-item">
            <div style="font-size:26px">${it.emoji}</div>
            <div class="txt"><b>${it.example.en}</b><span>${it.example.id}</span></div>
            <div class="mini-play${doneCls(i, 'listen')}" data-action="playSentence" data-payload="${i}">🔊</div>
            ${sttSupported ? `<div class="mini-play${doneCls(i, 'mic')}" id="micMini${i}" data-action="micSentence" data-payload="${i}">🎤</div>` : ''}
            <div class="mini-play${doneCls(i, 'game')}" data-action="gameSentence" data-payload="${i}">🎮</div>
          </div>`
          )
          .join('')}
      </div>
    `;
    setHandlers({
      playSentence: (payload) => {
        const i = Number(payload);
        markWordInteraction('listening', topic.id, i, 'listen', topic.items[i].example.en);
        speak(topic.items[i].example.en);
        drawList();
      },
      micSentence: (payload) => {
        const i = Number(payload);
        markWordInteraction('listening', topic.id, i, 'mic', topic.items[i].example.en);
        recordEvent({
          kind: 'interact',
          skill: 'listening',
          topicId: topic.id,
          section: 'kenalan',
          slot: i,
          itemRef: topic.items[i].example.en,
          activity: 'mic',
        });
        drawList();
        micFor(i);
      },
      gameSentence: (payload) => {
        const i = Number(payload);
        markWordInteraction('listening', topic.id, i, 'game', topic.items[i].example.en);
        recordEvent({
          kind: 'interact',
          skill: 'listening',
          topicId: topic.id,
          section: 'kenalan',
          slot: i,
          itemRef: topic.items[i].example.en,
          activity: 'game',
        });
        runItemMiniGame(container, topic, topic.items[i], drawList, level);
      },
    });
  }

  function openMicResultPopup(it: ListeningSentenceItem, index: number, said: string | null, errorText: string | null): void {
    const overlay = document.createElement('div');
    overlay.className = 'mic-pop-overlay';

    let starRow = '';
    let wordsHtml = '';
    let heardLine = '';
    let praiseLine = '';
    let perfect = false;
    if (said !== null) {
      const words = wordMatchDetail(said, it.example.en);
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
        skill: 'listening',
        topicId: topic.id,
        section: 'kenalan',
        slot: index,
        itemRef: it.example.en,
        activity: 'mic',
        graded: false,
        score: Math.round(hitRatio * 100),
        detail: { heard: said, words },
      });
    }

    overlay.innerHTML = `
      <div class="mic-pop-card">
        <div style="font-size:38px" aria-hidden="true">${it.emoji}</div>
        <div class="en-text" style="margin:2px 0 10px">${it.example.en}</div>
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

/**
 * Tombol 🎮 per kalimat di Kenalan — revisi user: "di 'main' tab kenalan
 * tambahkan pertanyaan di akhir kalimat" (balik pakai `item.question`,
 * bukan picture-tap murni spt sesi sebelumnya) + "buat jawabannya 2 card
 * 2 card" (`answerCardsHtml`, kartu 2×2, sama visual dgn Latihan Inti
 * "Dengar & Jawab"). Beda dari Latihan Inti TETAP ada — bukan dari bentuk
 * soal lagi, tapi dari: (a) 1 soal casual per-kalimat, balik ke daftar
 * sesudahnya, BUKAN bagian dari urutan 10-soal quiz-dot Latihan Inti; (b)
 * teks kalimat/pertanyaan default TERSEMBUNYI (audio-only) — cuma
 * kelihatan lewat "💡 Petunjuk" (`petunjukButtonHtml()` di atas — revisi
 * user: SATU tombol, TERSEDIA SEJAK AWAL, TIDAK menunggu 1x attempt lagi
 * spt versi clue sebelumnya).
 */
function runItemMiniGame(
  container: HTMLElement,
  topic: ListeningItemsTopic,
  item: ListeningSentenceItem,
  onBack: OnDone,
  level: LevelKey
): void {
  const opts = shuffle(item.question.options);
  let revealed = false;
  let answered = false;

  const playPrompt = () => speakSequence([item.example.en, item.question.en]);

  function paint(): void {
    container.innerHTML = `
      <span class="stage-badge">🎮 Main · Dengar &amp; Jawab</span>
      <div class="id-text">Dengarkan dulu, lalu jawab pertanyaannya</div>
      <div class="speak-row">
        <button class="speak-btn pt-cta" type="button" data-action="replay">🔊 Dengar</button>
        ${answered ? '' : petunjukButtonHtml(revealed)}
      </div>
      ${
        revealed
          ? `<div class="en-text">${item.example.en} ${item.question.en}</div><div class="id-text">${item.example.id} ${item.question.id}</div>`
          : ''
      }
      ${answerCardsHtml(
        opts.map((o) => ({ emoji: o.emoji, label: o.text })),
        'pick'
      )}
      <div class="feedback" id="fb"></div>
    `;
    setHandlers({
      replay: playPrompt,
      petunjuk: () => {
        if (revealed || answered) return;
        revealed = true;
        speakBilingual(`${item.example.en} ${item.question.en}`, `${item.example.id} ${item.question.id}`);
        paint();
      },
      pick: (payload) => {
        if (answered) return;
        const i = Number(payload);
        onAnswer(opts[i].ok, i);
      },
    });
  }

  function onAnswer(correct: boolean, i: number): void {
    answered = true;
    lockOptionButtons(container);
    container.querySelector('.letter-actions')?.remove();
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
    recordEvent({ kind: 'answer', skill: 'listening', topicId: topic.id, itemRef: item.example.en, activity: 'sentence-mini', correct });
    fb.insertAdjacentHTML('afterend', roundActionsHtml(true));
    setHandlers({
      tryAgainRound: () => {
        answered = false;
        paint();
      },
      nextRound: () => onBack(),
    });
  }

  playPrompt();
  paint();
}

function wireHint(container: HTMLElement, opts: ListeningQuestionOption[], onUsed?: () => void): void {
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
 *  berulang — sama pola dgn `games/vocabulary.ts` `pickItemsForCount`. */
function pickItemsForCount(items: ListeningSentenceItem[], count: number): ListeningSentenceItem[] {
  let pool: ListeningSentenceItem[] = [];
  while (pool.length < count) pool = pool.concat(shuffle(items));
  return pool.slice(0, count);
}

const LATIHAN_ROUND_SIZE = 10;

/**
 * Latihan Inti — 10 soal, tiap kalimat topik keluar dulu sebelum berulang,
 * SEKARANG 2 jenis soal dicampur 5/5 (revisi user: riset kompetitor/lembaga
 * bahasa — Cambridge YLE Listening py 5 part dgn BENTUK TASK BEDA-BEDA,
 * bukan 1 bentuk diulang; lihat CLAUDE.md "Listening — 2 Format
 * Berdampingan" utk rincian & sumber):
 *  - **'hear' → "🎧 Dengar & Jawab"** (bentuk lama, TETAP ADA) — dengar
 *    kalimat+pertanyaan, pilih dari `item.question.options` (kartu 2×2).
 *  - **'toId' (dipakai ULANG sbg penanda "Benar/Salah", BUKAN makna aslinya
 *    di Vocab) → "🤔 Benar atau Salah?"** — pola Cambridge Movers/Flyers:
 *    dengar kalimat, lihat SATU klaim (gambar+teks, diambil dari salah satu
 *    `item.question.options` — 50% opsi benar, 50% salah, TIDAK ada
 *    authoring data baru), jawab Benar/Salah. TANPA tombol Petunjuk (soal
 *    biner, hint tidak relevan di sini beda dari 'hear').
 * Field `kind` (`LatihanPlanSlot`, progress.ts) union-nya tetap ikut Vocab
 * (`hear|toEn|toId|sentence`) TAPI cuma `hear`/`toId` yang benar2 dipakai di
 * sini, artinya cukup dipinjam labelnya — TIDAK perlu ubah tipe shared.
 */
type ListeningLatihanKind = 'hear' | 'toId';
const LATIHAN_KIND_MIX: ListeningLatihanKind[] = [...Array(5).fill('hear'), ...Array(5).fill('toId')];

export function runLatihanIntiSentence(container: HTMLElement, topic: ListeningItemsTopic, onDone: OnDone, level: LevelKey): void {
  const buildPlan = (): LatihanPlanSlot[] => {
    const targets = pickItemsForCount(topic.items, LATIHAN_ROUND_SIZE);
    const kinds = shuffle(LATIHAN_KIND_MIX);
    return targets.map((it, i) => ({ kind: kinds[i] ?? 'hear', item: topic.items.indexOf(it) }));
  };
  let section = ensureSection('listening', topic.id, 'latihan', buildPlan);
  const expectedCoverage = Math.min(topic.items.length, LATIHAN_ROUND_SIZE);
  const plan = section.plan ?? [];
  const actualCoverage = new Set(plan.map((s) => s.item)).size;
  const hasBothKinds = new Set(plan.map((s) => s.kind)).size >= 2;
  const isStalePlan = plan.length !== LATIHAN_ROUND_SIZE || actualCoverage < expectedCoverage || !hasBothKinds;
  if (isStalePlan) {
    resetSectionPlan('listening', topic.id, 'latihan', buildPlan());
    section = ensureSection('listening', topic.id, 'latihan');
  }
  const order: { item: ListeningSentenceItem; kind: ListeningLatihanKind }[] = (section.plan ?? []).map((slot) => ({
    item: topic.items[slot.item] ?? topic.items[0],
    kind: slot.kind === 'toId' ? 'toId' : 'hear',
  }));
  let round = Math.min(Math.max(section.cursor, 0), order.length - 1);
  let hintUsedThisSlot = false;
  // Clue "Tampilkan Teks"/"Tampilkan Terjemahan" (permintaan user, lihat
  // `clueButtonsHtml`) — state per SOAL, direset di `draw()` (soal BARU),
  // TAPI TIDAK direset di `redraw()` (redraw soal yang SAMA, dipakai
  // "Coba Lagi") — kalau ikut direset di situ, clue yang baru saja
  // "diperoleh" lewat 1x mencoba bakal terkunci lagi begitu diulang.
  let attemptedThisSlot = false;
  let showTextThisSlot = false;
  let showTranslationThisSlot = false;

  const slotStatus = (i: number): 0 | 1 | 2 => getSlot('listening', topic.id, 'latihan', i)?.st ?? 0;

  function goTo(i: number): void {
    round = Math.min(Math.max(i, 0), order.length - 1);
    setSectionCursor('listening', topic.id, 'latihan', round);
    draw();
  }

  function draw(): void {
    if (round >= order.length) return onDone();
    hintUsedThisSlot = false;
    attemptedThisSlot = false;
    showTextThisSlot = false;
    showTranslationThisSlot = false;
    redraw();
  }

  function redraw(): void {
    const slot = order[round];
    if (slot.kind === 'toId') drawTrueFalse(slot.item);
    else drawAskQuestion(slot.item);
  }

  function onAnswer(correct: boolean, btn: HTMLElement, item: ListeningSentenceItem, activity: string): void {
    attemptedThisSlot = true;
    lockOptionButtons(container);
    container.querySelector('.letter-actions')?.remove();
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
    markSlotAnswered('listening', topic.id, 'latihan', round, correct, { hint: hintUsedThisSlot, itemRef: item.example.en });
    recordEvent({
      kind: 'answer',
      skill: 'listening',
      topicId: topic.id,
      section: 'latihan',
      slot: round,
      itemRef: item.example.en,
      activity,
      correct,
      hintUsed: hintUsedThisSlot,
    });
    fb.insertAdjacentHTML('afterend', roundActionsHtml(round === order.length - 1));
    setHandlers({
      tryAgainRound: () => redraw(),
      nextRound: () => {
        round += 1;
        setSectionCursor('listening', topic.id, 'latihan', Math.min(round, order.length - 1));
        draw();
      },
    });
  }

  function drawAskQuestion(item: ListeningSentenceItem): void {
    const opts = shuffle(item.question.options);
    const playPrompt = () => speakSequence([item.example.en, item.question.en]);

    container.innerHTML = `
      <div class="latihan-head">
        <span class="stage-badge">🎧 Dengar &amp; Jawab</span>
        ${hintButtonHtml}
      </div>
      ${quizNavHtml(round, order.length, slotStatus)}
      <div class="id-text">Soal ${round + 1} dari ${order.length}</div>
      <div class="speak-row"><button class="speak-btn pt-cta" data-action="replay">🔊 Dengar</button></div>
      ${showTextThisSlot ? `<div class="en-text">${item.example.en}</div><p class="reading-question">${item.question.en}</p>` : ''}
      ${showTranslationThisSlot ? `<div class="id-text">${item.example.id}</div><div class="id-text">${item.question.id}</div>` : ''}
      ${clueButtonsHtml(attemptedThisSlot, showTextThisSlot, showTranslationThisSlot)}
      ${answerCardsHtml(
        opts.map((o) => ({ emoji: o.emoji, label: o.text })),
        'pick'
      )}
      <div class="feedback" id="fb"></div>
    `;
    playPrompt();
    wireHint(container, opts, () => (hintUsedThisSlot = true));
    wireQuizNav(goTo);

    setHandlers({
      replay: playPrompt,
      clueText: () => {
        if (!attemptedThisSlot || showTextThisSlot) return;
        showTextThisSlot = true;
        speak(`${item.example.en} ${item.question.en}`);
        redraw();
      },
      clueTranslate: () => {
        if (!attemptedThisSlot || showTranslationThisSlot) return;
        showTranslationThisSlot = true;
        speakLocalized(`${item.example.id} ${item.question.id}`, 'id-ID');
        redraw();
      },
      pick: (payload) => {
        const i = Number(payload);
        onAnswer(opts[i].ok, container.querySelectorAll<HTMLElement>('.opt-btn')[i], item, 'hear');
      },
    });
  }

  /** "🤔 Benar atau Salah?" — pola Cambridge Movers/Flyers, dibangun TANPA
   *  data baru: 1 klaim diambil acak dari `item.question.options` (50%
   *  peluang klaim yang BENAR, 50% salah satu yang salah), anak menjawab
   *  Benar/Salah lewat 2 tombol besar (bukan kartu 2×2) — bentuk task-nya
   *  genuinely beda dari "Dengar & Jawab" (bukan cuma re-skin). */
  function drawTrueFalse(item: ListeningSentenceItem): void {
    const claim = item.question.options[Math.floor(Math.random() * item.question.options.length)];
    const playPrompt = () => speak(item.example.en);

    container.innerHTML = `
      <div class="latihan-head">
        <span class="stage-badge">🤔 Benar atau Salah?</span>
      </div>
      ${quizNavHtml(round, order.length, slotStatus)}
      <div class="id-text">Soal ${round + 1} dari ${order.length}</div>
      <div class="speak-row"><button class="speak-btn pt-cta" data-action="replay">🔊 Dengar</button></div>
      ${showTextThisSlot ? `<div class="en-text">${item.example.en}</div>` : ''}
      ${showTranslationThisSlot ? `<div class="id-text">${item.example.id}</div>` : ''}
      ${clueButtonsHtml(attemptedThisSlot, showTextThisSlot, showTranslationThisSlot)}
      <div class="big-emoji" style="font-size:44px">${claim.emoji}</div>
      <p class="reading-question">${claim.text}?</p>
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
    playPrompt();
    wireQuizNav(goTo);

    setHandlers({
      replay: playPrompt,
      clueText: () => {
        if (!attemptedThisSlot || showTextThisSlot) return;
        showTextThisSlot = true;
        speak(item.example.en);
        redraw();
      },
      clueTranslate: () => {
        if (!attemptedThisSlot || showTranslationThisSlot) return;
        showTranslationThisSlot = true;
        speakLocalized(item.example.id, 'id-ID');
        redraw();
      },
      pick: (payload) => {
        const said = payload === 'true';
        const btnIndex = said ? 0 : 1;
        onAnswer(said === claim.ok, container.querySelectorAll<HTMLElement>('.opt-btn')[btnIndex], item, 'truefalse');
      },
    });
  }

  draw();
}

// Permintaan user: "tambahkan aturan di listening dimana soal untuk
// tantangan nya 10" — beda dari Vocab (`TANTANGAN_TAB_SIZE` = 5 di
// `games/vocabulary.ts`, 3 tab × 5 = 15 total) krn Tantangan Listening
// SEKARANG cuma 1 aktivitas (Susun Kalimat, lihat CLAUDE.md "Listening —
// 2 Format Berdampingan"), jadi 10 di sini != 15 di Vocab, keduanya SENGAJA
// independen (bukan lupa disamakan).
const TANTANGAN_TAB_SIZE = 10;

function ensureTantanganPlan(topicId: string, section: SectionName, eligible: ListeningSentenceItem[]): ListeningSentenceItem[] {
  const buildPlan = (): LatihanPlanSlot[] =>
    pickItemsForCount(eligible, TANTANGAN_TAB_SIZE).map((it) => ({ kind: 'sentence', item: eligible.indexOf(it) }));
  const s = ensureSection('listening', topicId, section, buildPlan);
  if (!s.plan || s.plan.length !== TANTANGAN_TAB_SIZE) {
    resetSectionPlan('listening', topicId, section, buildPlan());
  }
  return (getSection('listening', topicId, section)!.plan ?? []).map((slot) => eligible[slot.item] ?? eligible[0]);
}

/**
 * Tantangan — SATU aktivitas (bukan 3 tab lagi, permintaan user: "remove
 * tantangan eja kata... remove tab penggunaan karena ini fokus listening")
 * — Susun Kalimat (`runSusunKalimatSentence`), redesain jadi murni dikte
 * dengar (lihat komentar di fungsi itu). Eja Kata (spelling) & Penggunaan
 * (mic) DIHAPUS TOTAL dari Listening — bukan cocok utk skill "dengar &
 * pahami": Eja Kata itu latihan MENULIS, Penggunaan itu latihan BICARA
 * (sudah py rumah sendiri: Vocab utk Eja Kata, Speaking skill nanti utk
 * Penggunaan). Tab bar dihapus juga krn cuma 1 aktivitas tersisa — tab
 * bar 1-tombol cuma noise visual, bukan navigasi yang berguna.
 */
export function runTantanganSentence(container: HTMLElement, topic: ListeningSentenceTopic, onDone: OnDone, level: LevelKey): void {
  runSusunKalimatSentence(container, topic.id, topic.items, onDone, level);
}

/**
 * Susun Kalimat — SATU-SATUNYA aktivitas Tantangan Listening sekarang
 * (permintaan user, redesain konsep — beda dari versi awal yang nge-port
 * `games/vocabulary.ts` `runSusunKalimat` apa adanya): dulu soalnya kalimat
 * INDONESIA dibaca ("Susun jadi Bahasa Inggris dari kalimat ini"), jadi
 * sebetulnya latihan TERJEMAHAN, bukan Listening. Sekarang murni DIKTE
 * DENGAR — "aplikasi bicara kemudian user susun menjadi kalimat"
 * (permintaan user persis): `speak(ex.en)` diputar OTOMATIS begitu soal
 * dibuka (+ tombol "🔊 Dengar Lagi" replay), TIDAK ADA teks Indonesia
 * ditampilkan sbg petunjuk (`ex.id` sengaja dihapus dari prompt — kalau
 * masih ditampilkan, anak bisa skip dengar & langsung terjemahkan dari
 * teks, balik lagi jadi soal terjemahan). Anak menyusun kata Inggris
 * (`example.en`) dari word bank PERSIS seperti yang mereka dengar — bantuan
 * satu-satunya tetap "💡 Jawabannya: ..." setelah 2x gagal (`answerHintHtml`,
 * pola sama Vocab), bukan teks terjemahan di awal.
 */
function runSusunKalimatSentence(
  container: HTMLElement,
  topicId: string,
  allItems: ListeningSentenceItem[],
  onDone: OnDone,
  level: LevelKey
): void {
  const items = ensureTantanganPlan(topicId, 'tantangan-susun', allItems);
  let round = Math.min(Math.max(getSection('listening', topicId, 'tantangan-susun')?.cursor ?? 0, 0), items.length - 1);

  const susunStatus = (i: number): 0 | 1 | 2 => getSlot('listening', topicId, 'tantangan-susun', i)?.st ?? 0;

  function draw(): void {
    if (round >= items.length) return onDone();
    drawSusun(items[round]);
  }

  function goTo(i: number): void {
    round = Math.min(Math.max(i, 0), items.length - 1);
    setSectionCursor('listening', topicId, 'tantangan-susun', round);
    drawSusun(items[round]);
  }

  function drawSusun(it: ListeningSentenceItem): void {
    const ex = it.example;
    const words = ex.en.replace('.', '').split(' ');
    let answer: { w: string; idx: number }[] = [];
    let bank = shuffle(words.map((w, i) => ({ w, used: false, idx: i })));
    let answered = false;
    // "💡 Petunjuk" (permintaan user: "ini berlaku di fitur kenalan dan
    // tantangan... petunjuk langsung ada di depan tidak perlu nunggu sekali
    // coba dulu") — TERSEDIA SEJAK AWAL (beda dari clue Latihan Inti yang
    // gated 1x attempt, TIDAK diubah), reset tiap soal BARU (`drawSusun`
    // dipanggil ulang), TAPI TIDAK direset oleh `tryAgainRound` (non-
    // punitive, hint yang sudah diambil tetap ada begitu diulang).
    let revealed = false;

    // Diputar SEKALI begitu soal ini pertama dibuka (bukan tiap `paint()` —
    // itu re-render tiap kali anak taruh/hapus kata, jadi audio tidak boleh
    // ikut retrigger tiap tap, cuma lewat tombol "🔊 Dengar Lagi" manual).
    speak(ex.en);

    function paint(): void {
      const wrongSoFar = getSlot('listening', topicId, 'tantangan-susun', round)?.w ?? 0;
      const answerHintHtml =
        wrongSoFar >= 2 ? `<p class="meta" style="margin:6px 0 0;text-align:center">💡 Jawabannya: <b>${ex.en}</b></p>` : '';

      container.innerHTML = `
        <span class="stage-badge">🎧 Dengar &amp; Susun</span>
        ${quizNavHtml(round, items.length, susunStatus)}
        <div class="id-text">Dengarkan kalimatnya, lalu susun jadi kalimat yang kamu dengar · ${round + 1} dari ${items.length}</div>
        <div class="big-emoji" style="font-size:36px;">${ex.emoji}</div>
        <div class="speak-row">
          <button class="speak-btn pt-cta" type="button" data-action="replay">🔊 Dengar</button>
          ${answered ? '' : petunjukButtonHtml(revealed)}
        </div>
        ${revealed ? `<div class="en-text">${ex.en}</div><div class="id-text">${ex.id}</div>` : ''}
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
          <button class="ghost-btn slim" type="button" data-action="removeLastWord" ${answer.length === 0 ? 'disabled' : ''}>⌫ Hapus Kata</button>
          <button class="ghost-btn slim" type="button" data-action="clear">🔄 Bersihkan</button>
        </div>`
        }
      `;
      wireQuizNav(goTo);

      setHandlers({
        replay: () => speak(ex.en),
        petunjuk: () => {
          if (revealed || answered) return;
          revealed = true;
          speakBilingual(ex.en, ex.id);
          paint();
        },
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
      if (answered || !answer.length) return;
      answered = true;
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
      markSlotAnswered('listening', topicId, 'tantangan-susun', round, correct, { itemRef: it.en });
      recordEvent({
        kind: 'answer',
        skill: 'listening',
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
          setSectionCursor('listening', topicId, 'tantangan-susun', Math.min(round, items.length - 1));
          draw();
        },
      });
    }

    paint();
  }

  draw();
}

/**
 * Tantangan KHUSUS Achiever — "📝 Lengkapi Catatan" (note completion), pola
 * Cambridge A2 Flyers Listening Part 2 (`materi/listening.md` §3E/§4E) —
 * dengar 1 percakapan/monolog pendek (`topic.notePassage`), lalu lengkapi
 * beberapa field kosong di sebuah catatan (`topic.noteGaps`) SATU per SATU,
 * bukan dikte kalimat spt `runSusunKalimatSentence`. Anak TAP pilihan kata/
 * angka (kartu jawaban `answerCardsHtml`, sama komponennya dgn "Dengar &
 * Jawab" — TAPI bentuk soalnya beda total: 1 sesi dengar dipakai utk
 * BEBERAPA pertanyaan berurutan yang saling terkait, bukan 1 kalimat = 1
 * pertanyaan berdiri sendiri) — kid-friendly, BUKAN menulis bebas spt versi
 * asli Cambridge (anak SD belum pas dites lewat ejaan/tulisan tangan).
 *
 * TIDAK pakai `pickItemsForCount`/`ensureSection`+plan spt Susun Kalimat —
 * gap-nya TETAP & urut sesuai `topic.noteGaps` (bukan diacak dari pool),
 * krn urutan gap memang mengikuti urutan info di `notePassage`. Progres
 * per-gap disimpan lewat `markSlotAnswered('listening', topicId,
 * 'tantangan-note', gapIndex, ...)` — section BARU, TIDAK bentrok dgn
 * `'tantangan-susun'` (Little Stars/Starter), dibaca `listeningTopicPercent`
 * lewat parameter `tantangan` baru (`progress.ts`, `app.ts`
 * `topicProgressPercent`).
 */
export function runTantanganNote(container: HTMLElement, topic: ListeningNoteTopic, onDone: OnDone, level: LevelKey): void {
  const topicId = topic.id;
  const section = 'tantangan-note';
  const gaps = topic.noteGaps;
  let cursor = Math.min(Math.max(getSection('listening', topicId, section)?.cursor ?? 0, 0), gaps.length - 1);

  const gapStatus = (i: number): 0 | 1 | 2 => getSlot('listening', topicId, section, i)?.st ?? 0;
  const filledAnswer = (i: number): string | null => (gapStatus(i) === 2 ? gaps[i].answer : null);

  function playPassage(): void {
    speakSequence(topic.notePassage.map((p) => p.en));
  }

  /** `activeUnanswered` — sembunyikan jawaban gap yang SEDANG ditanya ulang
   *  (mis. anak lompat-mundur ke gap yang sudah pernah dijawab via quiz-dot)
   *  supaya catatan tidak membocorkan jawaban sebelum anak coba lagi;
   *  gap LAIN yang sudah lewat tetap tampil terisi apa adanya. */
  function noteCardHtml(activeUnanswered: boolean): string {
    return `
      <div class="listen-note-card">
        <div class="note-heading">${topic.noteHeading}</div>
        ${gaps
          .map((g, i) => {
            const filled = i === cursor && activeUnanswered ? null : filledAnswer(i);
            return `<div class="note-line"><span class="note-label">${g.label}:</span> <span class="note-blank ${filled ? 'filled' : ''}" data-idx="${i}">${filled ?? '_____'}</span></div>`;
          })
          .join('')}
      </div>
    `;
  }

  function draw(): void {
    if (cursor >= gaps.length) return onDone();
    drawGap(gaps[cursor]);
  }

  function goTo(i: number): void {
    cursor = Math.min(Math.max(i, 0), gaps.length - 1);
    setSectionCursor('listening', topicId, section, cursor);
    drawGap(gaps[cursor]);
  }

  function drawGap(gap: ListeningNoteGap): void {
    // SELALU mulai fresh (bukan cek `gapStatus(cursor) === 2`) — konsisten
    // dgn `runSusunKalimatSentence`'s `goTo`: lompat quiz-dot ke gap manapun
    // (termasuk yang sudah dijawab) selalu render ulang soal blank baru,
    // BUKAN "terkunci selesai" — dot hijau di `quizNavHtml` cuma penanda
    // visual progres, bukan kunci replay. Catatan (`noteCardHtml`) tetap
    // menampilkan jawaban BENAR utk gap lain yang sudah dilewati (st===2,
    // terlepas benar/salah saat dijawab — non-punitive, sama prinsipnya dgn
    // "💡 Jawabannya: ..." Susun Kalimat yang muncul walau anak tidak pernah
    // menjawab tepat).
    let answered = false;
    let revealed = false;
    let order = shuffle(gap.options.map((_, i) => i));

    function paint(): void {
      container.innerHTML = `
        <span class="stage-badge">📝 Lengkapi Catatan</span>
        ${quizNavHtml(cursor, gaps.length, gapStatus)}
        <div class="id-text">Dengar percakapannya, lalu lengkapi catatannya · ${cursor + 1} dari ${gaps.length}</div>
        <div class="speak-row">
          <button class="speak-btn pt-cta" type="button" data-action="replay">🔊 Dengar Percakapan</button>
          ${answered ? '' : petunjukButtonHtml(revealed)}
        </div>
        ${
          revealed
            ? topic.notePassage.map((p) => `<div class="en-text">${p.en}</div><div class="id-text">${p.id}</div>`).join('')
            : ''
        }
        ${noteCardHtml(!answered)}
        ${
          answered
            ? ''
            : `<p class="reading-question">${gap.question}</p>
               ${answerCardsHtml(
                 order.map((i) => ({ emoji: gap.emoji, label: gap.options[i] })),
                 'pick'
               )}`
        }
        <div class="feedback" id="fb"></div>
      `;
      wireQuizNav(goTo);

      setHandlers({
        replay: playPassage,
        petunjuk: () => {
          if (revealed || answered) return;
          revealed = true;
          paint();
        },
        pick: (payload) => {
          if (answered) return;
          const picked = gap.options[order[Number(payload)]];
          const correct = picked === gap.answer;
          answered = true;

          markSlotAnswered('listening', topicId, section, cursor, correct);
          recordEvent({
            kind: 'answer',
            skill: 'listening',
            topicId,
            section,
            slot: cursor,
            itemRef: gap.answer,
            activity: 'note',
            correct,
          });

          paint();
          const fb = container.querySelector<HTMLElement>('#fb')!;
          if (correct) {
            playCorrectTone();
            fireConfetti();
            fb.textContent = pickPraise(level);
            fb.className = 'feedback good';
          } else {
            playTryAgainTone();
            fb.textContent = pickEncourage(level);
            fb.className = 'feedback bad';
          }
          fb.insertAdjacentHTML('afterend', roundActionsHtml(cursor === gaps.length - 1));
          setHandlers({
            tryAgainRound: () => {
              answered = false;
              order = shuffle(gap.options.map((_, i) => i));
              paint();
            },
            nextRound: () => {
              cursor += 1;
              setSectionCursor('listening', topicId, section, Math.min(cursor, gaps.length - 1));
              draw();
            },
          });
        },
      });
    }

    playPassage();
    paint();
  }

  draw();
}

/**
 * Tantangan KHUSUS Trailblazer — "🧩 Dengar & Simpulkan" (gist/inference),
 * pola Cambridge KET/PET Listening bagian "identify main idea" & "extended
 * interview + inferensi sikap/opini" (`materi/listening.md` §3F/§4F) — beda
 * dari note completion Achiever (isi FAKTA spesifik dari 1 passage pendek):
 * di sini anak dengar 1 PERCAKAPAN 2-arah lebih panjang (`dialogueLines`)
 * SEKALI (diputar penuh via `speakSequence` begitu soal dibuka), lalu jawab
 * `inferenceQuestions` satu per satu — pertanyaannya BUTUH memahami
 * KESELURUHAN percakapan (topik utama, sikap tokoh, dugaan tindakan
 * selanjutnya), bukan tangkap 1 baris tertentu. Transkrip (nama tokoh +
 * teks) cuma kelihatan lewat 💡 Petunjuk (audio-first, sama prinsipnya dgn
 * `notePassage` Achiever) — direset per pertanyaan (konsisten dgn pola
 * `revealed` Achiever, BUKAN krn dialognya berubah, sekadar konsistensi UX
 * lintas format baru).
 */
export function runTantanganDialogue(container: HTMLElement, topic: ListeningDialogueTopic, onDone: OnDone, level: LevelKey): void {
  const topicId = topic.id;
  const section = 'tantangan-dialog';
  const qs = topic.inferenceQuestions;
  let cursor = Math.min(Math.max(getSection('listening', topicId, section)?.cursor ?? 0, 0), qs.length - 1);

  const qStatus = (i: number): 0 | 1 | 2 => getSlot('listening', topicId, section, i)?.st ?? 0;

  function playDialogue(): void {
    speakSequence(topic.dialogueLines.map((l) => l.en));
  }

  function transcriptHtml(): string {
    return `
      <div class="listen-note-card">
        <div class="note-heading">🗨️ ${topic.dialogueHeading}</div>
        ${topic.dialogueLines
          .map(
            (l) =>
              `<div class="dialogue-line"><span class="dialogue-speaker">${l.speaker}:</span> ${l.en}</div><div class="id-text" style="margin:0 0 6px">${l.id}</div>`
          )
          .join('')}
      </div>
    `;
  }

  function draw(): void {
    if (cursor >= qs.length) return onDone();
    drawQuestion(qs[cursor]);
  }

  function goTo(i: number): void {
    cursor = Math.min(Math.max(i, 0), qs.length - 1);
    setSectionCursor('listening', topicId, section, cursor);
    drawQuestion(qs[cursor]);
  }

  function drawQuestion(q: ListeningInferenceQuestion): void {
    // SELALU mulai fresh (bukan cek slot tersimpan) — konsisten dgn
    // `runTantanganNote`'s `drawGap`: lompat quiz-dot ke pertanyaan manapun
    // (termasuk yang sudah dijawab) selalu render ulang soal blank baru.
    let answered = false;
    let revealed = false;
    let order = shuffle(q.options.map((_, i) => i));

    function paint(): void {
      container.innerHTML = `
        <span class="stage-badge">🧩 Dengar &amp; Simpulkan</span>
        ${quizNavHtml(cursor, qs.length, qStatus)}
        <div class="id-text">Dengar percakapannya, lalu jawab pertanyaannya · ${cursor + 1} dari ${qs.length}</div>
        <div class="speak-row">
          <button class="speak-btn pt-cta" type="button" data-action="replay">🔊 Dengar Percakapan</button>
          ${petunjukButtonHtml(revealed)}
        </div>
        ${revealed ? transcriptHtml() : ''}
        <p class="reading-question">${q.question}</p>
        ${answerCardsHtml(
          order.map((i) => ({ emoji: q.options[i].emoji, label: q.options[i].text })),
          'pick'
        )}
        <div class="feedback" id="fb"></div>
      `;
      wireQuizNav(goTo);

      setHandlers({
        replay: playDialogue,
        petunjuk: () => {
          if (revealed || answered) return;
          revealed = true;
          paint();
        },
        pick: (payload) => {
          if (answered) return;
          const idx = Number(payload);
          const opt = q.options[order[idx]];
          const correct = opt.ok;
          answered = true;

          container.querySelectorAll<HTMLButtonElement>('.opt-btn').forEach((b) => (b.disabled = true));
          container.querySelectorAll<HTMLElement>('.opt-btn')[idx]?.classList.add(correct ? 'correct' : 'wrong');

          markSlotAnswered('listening', topicId, section, cursor, correct);
          recordEvent({
            kind: 'answer',
            skill: 'listening',
            topicId,
            section,
            slot: cursor,
            itemRef: q.question,
            activity: 'infer',
            correct,
          });

          const fb = container.querySelector<HTMLElement>('#fb')!;
          if (correct) {
            playCorrectTone();
            fireConfetti();
            fb.textContent = pickPraise(level);
            fb.className = 'feedback good';
          } else {
            playTryAgainTone();
            fb.textContent = pickEncourage(level);
            fb.className = 'feedback bad';
          }
          fb.insertAdjacentHTML('afterend', roundActionsHtml(cursor === qs.length - 1));
          setHandlers({
            tryAgainRound: () => {
              answered = false;
              order = shuffle(q.options.map((_, i) => i));
              paint();
            },
            nextRound: () => {
              cursor += 1;
              setSectionCursor('listening', topicId, section, Math.min(cursor, qs.length - 1));
              draw();
            },
          });
        },
      });
    }

    playDialogue();
    paint();
  }

  draw();
}
