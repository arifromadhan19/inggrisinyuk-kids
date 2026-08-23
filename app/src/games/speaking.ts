import type { LevelKey, OnDone, SpeakingPhraseItem, SpeakingPhraseTopic, SpeakingTopic } from '../types';
import { setHandlers } from '../interaction';
import { hasWordInteraction, markWordInteraction, recordAttempt, recordEvent } from '../progress';
import { listenAndRecordOnce, listenOnce, looseMatch, playCorrectTone, playTryAgainTone, speak, speakLocalized, sttSupported, wordMatchDetail } from '../speech';
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

export function runLatihanInti(container: HTMLElement, topic: SpeakingTopic, onDone: OnDone): void {
  let round = 0;

  function draw(): void {
    if (round >= topic.drill.length) return onDone();
    const phrase = topic.drill[round];
    container.innerHTML = `
      <span class="stage-badge">🎯 Ucapkan &amp; Cek</span>
      <div class="id-text">Soal ${round + 1} dari ${topic.drill.length}</div>
      <div class="en-text">"${phrase}"</div>
      <div class="speak-row"><button class="speak-btn" data-action="replay">🔊 Dengar Contoh</button></div>
      <div class="mic-wrap">
        <button class="mic-btn" id="micBtn" data-action="mic">🎤</button>
        <div class="mic-hint">${sttSupported ? 'Tap mic, lalu ucapkan kalimatnya' : 'Mikrofon tidak didukung browser ini'}</div>
      </div>
      <div class="heard-text" id="heard"></div>
      <div class="feedback" id="fb"></div>
      ${sttSupported ? '' : `<button class="ghost-btn" data-action="skip">✅ Aku Sudah Coba Ucapkan</button>`}
    `;

    setHandlers({
      replay: () => speak(phrase),
      skip: () => {
        round += 1;
        draw();
      },
      mic: () => {
        const btn = container.querySelector<HTMLElement>('#micBtn')!;
        btn.classList.add('listening');
        listenOnce(
          (said) => {
            btn.classList.remove('listening');
            container.querySelector<HTMLElement>('#heard')!.textContent = `Kamu bilang: "${said}"`;
            const fb = container.querySelector<HTMLElement>('#fb')!;
            if (looseMatch(said, phrase)) {
              recordAttempt(true);
              fb.textContent = 'Keren banget! 🎉';
              fb.className = 'feedback good';
              round += 1;
              setTimeout(draw, 900);
            } else {
              recordAttempt(false);
              fb.textContent = 'Hampir! Coba sekali lagi 💪';
              fb.className = 'feedback bad';
            }
          },
          (kind) => {
            btn.classList.remove('listening');
            // 'aborted' — mic dihentikan paksa krn "🔊 Dengar Contoh"
            // ditap pas masih dengar (speech.ts `stopListening()`), bukan
            // STT gagal — reset diam-diam.
            if (kind === 'aborted') return;
            container.querySelector<HTMLElement>('#fb')!.textContent = 'Belum kedengaran, coba lagi 🎧';
          }
        );
      },
    });
  }

  draw();
}

export function runTantangan(container: HTMLElement, topic: SpeakingTopic, onDone: OnDone): void {
  let turn = 0;

  function draw(): void {
    if (turn >= topic.roleplay.length) return onDone();
    const q = topic.roleplay[turn];
    container.innerHTML = `
      <span class="stage-badge">🌟 Mini-Roleplay</span>
      <div class="turn-dots">${topic.roleplay.map((_, i) => `<div class="turn-dot ${i <= turn ? 'on' : ''}"></div>`).join('')}</div>
      <div class="id-text">Giliran ${turn + 1} dari ${topic.roleplay.length}</div>
      <div class="en-text">🦁 "${q}"</div>
      <div class="speak-row"><button class="speak-btn" data-action="replay">🔊 Dengar Lagi</button></div>
      <div class="mic-wrap">
        <button class="mic-btn" id="micBtn" data-action="mic">🎤</button>
        <div class="mic-hint">${sttSupported ? 'Tap mic, jawab pertanyaannya bebas' : 'Mikrofon tidak didukung browser ini'}</div>
      </div>
      <div class="heard-text" id="heard"></div>
      <div class="feedback" id="fb"></div>
      ${sttSupported ? '' : `<button class="ghost-btn" data-action="skip">✅ Aku Sudah Jawab</button>`}
    `;
    speak(q);

    setHandlers({
      replay: () => speak(q),
      skip: () => {
        turn += 1;
        draw();
      },
      mic: () => {
        const btn = container.querySelector<HTMLElement>('#micBtn')!;
        btn.classList.add('listening');
        listenOnce(
          (said) => {
            btn.classList.remove('listening');
            container.querySelector<HTMLElement>('#heard')!.textContent = `Kamu jawab: "${said}"`;
            const fb = container.querySelector<HTMLElement>('#fb')!;
            fb.textContent = 'Bagus, sudah berani jawab! 🎉';
            fb.className = 'feedback good';
            turn += 1;
            setTimeout(draw, 1000);
          },
          (kind) => {
            btn.classList.remove('listening');
            if (kind === 'aborted') return; // lihat komentar setara di runLatihanInti di atas
            container.querySelector<HTMLElement>('#fb')!.textContent = 'Belum kedengaran, coba lagi 🎧';
          }
        );
      },
    });
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
 *   3. Tantangan "🖼️ Sebutkan Sendiri!" — RECALL: cuma gambar (TANPA teks/
 *      audio default), anak harus INGAT & ucapkan sendiri frasanya — tugas
 *      produksi murni dari memori, BUKAN cuma tirukan. Ini yang jadi
 *      improvement konkret: 0 dari kompetitor yang diriset py tugas recall
 *      tanpa model tepat sebelumnya, semuanya berhenti di imitasi.
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
 */
export function runLatihanIntiPhrase(container: HTMLElement, topic: SpeakingPhraseTopic, onDone: OnDone, level: LevelKey): void {
  const order = shuffle(topic.items);
  let round = 0;

  function draw(): void {
    if (round >= order.length) return onDone();
    const target = order[round];
    container.innerHTML = `
      <span class="stage-badge">🎤 Tirukan Ucapannya!</span>
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

    setHandlers({
      replay: () => speak(target.phrase.en),
      skip: () => {
        round += 1;
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
 * Tantangan "🖼️ Sebutkan Sendiri!" — RECALL, langkah TERSULIT tangga
 * (permintaan user "wajib ada improvement", lihat komentar panjang di atas
 * file ini): cuma gambar besar yang tampil, TANPA teks/audio default — anak
 * harus INGAT sendiri frasa Inggrisnya dari Kenalan/Latihan Inti sebelumnya,
 * baru ucapkan lewat mic. "💡 Petunjuk" (tersedia SEJAK AWAL, TANPA gating
 * attempt — beda dari fase Kenalan/Latihan Inti yang teksnya sudah kelihatan
 * dari awal) membacakan+menampilkan frasa+terjemahan kalau anak beneran lupa
 * — non-punitive scaffold, pola sama examiner Cambridge Starters yang
 * membantu anak yang membeku ("Is this the apple?", `materi/speaking.md`
 * §3.2). Frasa target SELALU ditampilkan di hasil sesudah mic (apa pun
 * skornya) supaya anak tetap belajar dari percobaannya.
 */
export function runTantanganPhrase(container: HTMLElement, topic: SpeakingPhraseTopic, onDone: OnDone, level: LevelKey): void {
  const order = shuffle(topic.items);
  let round = 0;

  function draw(): void {
    if (round >= order.length) return onDone();
    const target = order[round];
    let revealed = false;

    function paint(): void {
      container.innerHTML = `
        <span class="stage-badge">🖼️ Sebutkan Sendiri!</span>
        <div class="id-text">Soal ${round + 1} dari ${order.length}</div>
        <div class="big-emoji">${target.emoji}</div>
        <div class="speak-row">${petunjukButtonHtml(revealed)}</div>
        ${revealed ? `<div class="en-text">${target.phrase.en}</div><div class="id-text">${target.phrase.id}</div>` : ''}
        <div class="mic-wrap">
          <button class="mic-btn" id="micBtn" type="button" data-action="mic">🎤</button>
          <div class="mic-hint">${sttSupported ? 'Ingat-ingat, lalu ucapkan sendiri ya' : 'Mikrofon tidak didukung browser ini'}</div>
        </div>
        <div id="micResult"></div>
        <div class="feedback" id="fb"></div>
        ${sttSupported ? '' : `<button class="ghost-btn" type="button" data-action="skip">✅ Aku Sudah Coba Ucapkan</button>`}
      `;
      setHandlers({
        petunjuk: () => {
          if (revealed) return;
          revealed = true;
          speakBilingual(target.phrase.en, target.phrase.id);
          paint();
        },
        skip: () => {
          round += 1;
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
