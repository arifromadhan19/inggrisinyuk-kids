/**
 * Reading — beda prinsip dari Listening: `passage`/`story` dibaca SENDIRI,
 * TIDAK PERNAH diucapkan TTS di kind ini (konsisten dgn `reading` di First
 * Placement Test, doc/first_placement_test.md §Reading — kalau dibacakan,
 * ini jadi tes dengar lagi, bukan tes baca). Reuse styling `.reading-passage`
 * / `.reading-question` yang sudah ada (placement.ts), sama warna token
 * --c-read/--c-read-bg dgn SKILL_META.reading.
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
import type { LevelKey, OnDone, ReadingTopic, ReadingWordItem, ReadingWordTopic } from '../types';
import { setHandlers } from '../interaction';
import { hasWordInteraction, markWordInteraction, recordAttempt, recordEvent } from '../progress';
import { listenAndRecordOnce, playCorrectTone, playTryAgainTone, speak, sttSupported, wordMatchDetail } from '../speech';
import { pickEncourage, pickPraise } from '../praise';
import { fireConfetti } from '../confetti';
import { shuffle } from '../util';

function passageHtml(lines: string[]): string {
  return `<div class="reading-passage">${lines.map((l) => `<p>${l}</p>`).join('')}</div>`;
}

export function renderKenalan(container: HTMLElement, topic: ReadingTopic, onNext: OnDone): void {
  container.innerHTML = `
    <div class="big-emoji">${topic.scene}</div>
    <div class="id-text" style="margin-bottom:10px;">Baca sendiri dulu, ya — pelan-pelan juga tidak apa</div>
    <div class="primer-list">
      ${topic.primer
        .map(
          (p) => `
        <div class="primer-item" style="align-items:flex-start">
          <div class="txt">
            ${p.passage.map((l) => `<b style="display:block">${l}</b>`).join('')}
            <span>${p.id}</span>
          </div>
        </div>`
        )
        .join('')}
    </div>
    <button class="primary-btn" data-action="advance">Lanjut ke Latihan Inti →</button>
  `;
  setHandlers({ advance: () => onNext() });
}

export function runLatihanInti(container: HTMLElement, topic: ReadingTopic, onDone: OnDone, level: LevelKey): void {
  let round = 0;

  function draw(): void {
    if (round >= topic.drill.length) return onDone();
    const d = topic.drill[round];
    container.innerHTML = `
      <span class="stage-badge">🎯 Baca &amp; Jawab</span>
      <div class="id-text">Soal ${round + 1} dari ${topic.drill.length}</div>
      ${passageHtml(d.passage)}
      <p class="reading-question">${d.question}</p>
      <div class="opt-grid ${d.opts.length > 2 ? 'three' : ''}">
        ${d.opts.map((o, i) => optHtml(o, i, 'pick')).join('')}
      </div>
      <div class="feedback" id="fb"></div>
    `;

    setHandlers({
      pick: (payload) => {
        const i = Number(payload);
        const btn = container.querySelectorAll<HTMLElement>('.opt-btn')[i];
        const fb = container.querySelector<HTMLElement>('#fb')!;
        if (d.opts[i].ok) {
          recordAttempt(true);
          btn.classList.add('correct', 'win-burst');
          playCorrectTone();
          fireConfetti();
          fb.textContent = pickPraise(level);
          fb.className = 'feedback good';
          round += 1;
          setTimeout(draw, 900);
        } else {
          recordAttempt(false);
          btn.classList.add('wrong');
          fb.textContent = pickEncourage(level);
          fb.className = 'feedback bad';
          setTimeout(() => btn.classList.remove('wrong'), 350);
        }
      },
    });
  }

  draw();
}

export function runTantangan(container: HTMLElement, topic: ReadingTopic, onDone: OnDone, level: LevelKey): void {
  container.innerHTML = `
    <span class="stage-badge">🌟 Cerita Mini</span>
    <div class="big-emoji">${topic.scene}</div>
    <div class="id-text" style="margin-bottom:6px;">Baca ceritanya sendiri, lalu jawab pertanyaannya</div>
    ${passageHtml(topic.story)}
    <p class="reading-question">${topic.question.text}</p>
    <div class="opt-grid ${topic.question.opts.length > 2 ? 'three' : ''}">
      ${topic.question.opts.map((o, i) => optHtml(o, i, 'answer')).join('')}
    </div>
    <div class="feedback" id="fb"></div>
  `;

  setHandlers({
    answer: (payload) => {
      const i = Number(payload);
      const btn = container.querySelectorAll<HTMLElement>('.opt-btn')[i];
      const fb = container.querySelector<HTMLElement>('#fb')!;
      if (topic.question.opts[i].ok) {
        recordAttempt(true);
        btn.classList.add('correct', 'win-burst');
        playCorrectTone();
        fireConfetti();
        fb.textContent = pickPraise(level);
        fb.className = 'feedback good';
        setTimeout(onDone, 900);
      } else {
        recordAttempt(false);
        btn.classList.add('wrong');
        playTryAgainTone();
        fb.textContent = pickEncourage(level);
        fb.className = 'feedback bad';
        setTimeout(() => btn.classList.remove('wrong'), 350);
      }
    },
  });
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
}

/** 4 opsi = target + 3 distraktor acak dari kata LAIN di topik yang sama
 *  (fallback kalau topiknya kebetulan <4 kata). */
function buildWordOptions(topic: ReadingWordTopic, target: ReadingWordItem): ReadingWordItem[] {
  const distractors = shuffle(topic.items.filter((it) => it !== target)).slice(0, 3);
  return shuffle([target, ...distractors]);
}

/**
 * Kenalan — daftar kata, tiap baris: emoji + KATA TERCETAK (besar, ala
 * flashcard lewat `.primer-item .txt b`) + terjemahan Indonesia + tombol
 * "🔊 Dengar" (bunyikan cara bacanya). Murni EXPOSURE (pasangkan
 * bentuk-cetak↔bunyi↔makna), tanpa mini-game — konsisten dgn `renderKenalan`
 * format lama (juga murni baca, tanpa game per-kata) & TIDAK dihitung ke
 * progress topik (CLAUDE.md poin 6, Kenalan skill manapun tidak pernah
 * dihitung). `hasWordInteraction`/`markWordInteraction` MURNI penanda visual
 * "sudah ditap" di tombolnya sendiri (pola sama Vocab/Listening Kenalan).
 */
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
  const order = shuffle(topic.items);
  let round = 0;

  function draw(): void {
    if (round >= order.length) return onDone();
    const target = order[round];
    const opts = buildWordOptions(topic, target).map((it) => ({ emoji: it.emoji, lbl: it.en, ok: it === target }));

    container.innerHTML = `
      <span class="stage-badge">🎯 Baca &amp; Tunjuk</span>
      <div class="id-text">Soal ${round + 1} dari ${order.length}</div>
      <div class="reading-word-card"><b>${target.en}</b></div>
      <div class="speak-row"><button class="speak-btn-ghost" type="button" data-action="replay">🔊 Dengar</button></div>
      <p class="reading-question">Mana gambar yang cocok?</p>
      <div class="opt-grid">
        ${opts.map((o, i) => optHtml(o, i, 'pick')).join('')}
      </div>
      <div class="feedback" id="fb"></div>
    `;

    setHandlers({
      replay: () => speak(target.en),
      pick: (payload) => {
        const i = Number(payload);
        const btn = container.querySelectorAll<HTMLElement>('.opt-btn')[i];
        const fb = container.querySelector<HTMLElement>('#fb')!;
        if (opts[i].ok) {
          recordAttempt(true);
          lockOptionButtons(container);
          btn.classList.add('correct', 'win-burst');
          playCorrectTone();
          fireConfetti();
          fb.textContent = pickPraise(level);
          fb.className = 'feedback good';
          fb.insertAdjacentHTML('afterend', roundActionsHtml(round === order.length - 1));
          setHandlers({
            tryAgainRound: () => draw(),
            nextRound: () => {
              round += 1;
              draw();
            },
          });
        } else {
          recordAttempt(false);
          btn.classList.add('wrong');
          playTryAgainTone();
          fb.textContent = pickEncourage(level);
          fb.className = 'feedback bad';
          setTimeout(() => btn.classList.remove('wrong'), 350);
        }
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
  const order = shuffle(topic.items);
  let round = 0;

  function draw(): void {
    if (round >= order.length) return onDone();
    const target = order[round];
    const opts = buildWordOptions(topic, target);

    container.innerHTML = `
      <span class="stage-badge">🖼️ Lihat &amp; Baca</span>
      <div class="id-text">Soal ${round + 1} dari ${order.length}</div>
      <div class="big-emoji">${target.emoji}</div>
      <p class="reading-question">Kata mana yang cocok dengan gambar ini?</p>
      <div class="opt-grid">
        ${opts.map((o, i) => `<button class="opt-btn opt-btn-text" type="button" data-action="pick" data-payload="${i}">${o.en}</button>`).join('')}
      </div>
      <div class="speak-row"><button class="speak-btn-ghost" type="button" data-action="hint">💡 Dengar</button></div>
      <div class="feedback" id="fb"></div>
    `;

    setHandlers({
      hint: () => speak(target.en),
      pick: (payload) => {
        const i = Number(payload);
        const btn = container.querySelectorAll<HTMLElement>('.opt-btn')[i];
        const fb = container.querySelector<HTMLElement>('#fb')!;
        if (opts[i] === target) {
          recordAttempt(true);
          lockOptionButtons(container);
          btn.classList.add('correct', 'win-burst');
          playCorrectTone();
          fireConfetti();
          fb.textContent = pickPraise(level);
          fb.className = 'feedback good';
          fb.insertAdjacentHTML('afterend', roundActionsHtml(round === order.length - 1));
          setHandlers({
            tryAgainRound: () => draw(),
            nextRound: () => {
              round += 1;
              draw();
            },
          });
        } else {
          recordAttempt(false);
          btn.classList.add('wrong');
          playTryAgainTone();
          fb.textContent = pickEncourage(level);
          fb.className = 'feedback bad';
          setTimeout(() => btn.classList.remove('wrong'), 350);
        }
      },
    });
  }

  draw();
}
