import type {
  GrammarContrastVisual,
  GrammarFill,
  GrammarPatternItem,
  GrammarPatternTopic,
  GrammarScramble,
  GrammarTopic,
  GrammarTransformItem,
  GrammarTransformTopic,
  LevelKey,
  OnDone,
} from '../types';
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

export function renderKenalan(container: HTMLElement, topic: GrammarTopic, onNext: OnDone): void {
  container.innerHTML = `
    <div class="id-text" style="margin-bottom:10px;">Perhatikan polanya lewat contoh (bukan rumus!)</div>
    <div class="primer-list">
      ${topic.examples
        .map(
          (ex, i) => `
        <div class="primer-item">
          <div style="font-size:26px">${ex.emoji}</div>
          <div class="txt"><b>${ex.en}</b></div>
          <div class="mini-play" data-action="play" data-payload="${i}">🔊</div>
        </div>`
        )
        .join('')}
    </div>
    <button class="primary-btn" data-action="advance">Lanjut ke Latihan Inti →</button>
  `;
  setHandlers({
    play: (payload) => speak(topic.examples[Number(payload)].en),
    advance: () => onNext(),
  });
}

export function runLatihanInti(container: HTMLElement, topic: GrammarTopic, onDone: OnDone): void {
  let round = 0;
  let answer: { w: string; idx: number }[] = [];
  let bank: { w: string; used: boolean; idx: number }[] = [];

  function setup(sc: GrammarScramble): void {
    answer = [];
    bank = shuffle(sc.target.map((w, i) => ({ w, used: false, idx: i })));
  }

  function draw(): void {
    if (round >= topic.scramble.length) return onDone();
    setup(topic.scramble[round]);
    paint(topic.scramble[round]);
  }

  function paint(sc: GrammarScramble): void {
    container.innerHTML = `
      <span class="stage-badge">🎯 Susun Kalimat</span>
      <div class="id-text">Soal ${round + 1} dari ${topic.scramble.length}</div>
      <div class="big-emoji" style="font-size:44px;">${sc.emoji}</div>
      <div class="answer-row ${answer.length ? '' : 'empty'}">
        ${answer.map((a, ai) => `<span class="chip placed" data-action="unpick" data-payload="${ai}">${a.w}</span>`).join('')}
      </div>
      <div class="bank-row">
        ${bank.map((b, bi) => `<span class="chip ${b.used ? 'hidden' : ''}" data-action="pick" data-payload="${bi}">${b.w}</span>`).join('')}
      </div>
      <div class="feedback" id="fb"></div>
      <button class="primary-btn" data-action="check">Cek Jawaban ✅</button>
      <button class="ghost-btn" data-action="clear">🔄 Bersihkan</button>
    `;

    setHandlers({
      clear: () => {
        setup(sc);
        paint(sc);
      },
      pick: (payload) => {
        const bi = Number(payload);
        if (bank[bi].used) return;
        bank[bi].used = true;
        answer.push(bank[bi]);
        paint(sc);
      },
      unpick: (payload) => {
        const ai = Number(payload);
        const item = answer[ai];
        answer.splice(ai, 1);
        bank.find((b) => b.idx === item.idx)!.used = false;
        paint(sc);
      },
      check: () => {
        const fb = container.querySelector<HTMLElement>('#fb')!;
        const built = answer.map((a) => a.w).join(' ');
        if (built === sc.target.join(' ')) {
          recordAttempt(true);
          fb.textContent = 'Kalimatnya pas! 🎉';
          fb.className = 'feedback good';
          speak(built);
          round += 1;
          setTimeout(draw, 1000);
        } else {
          recordAttempt(false);
          fb.textContent = 'Urutannya belum pas, coba atur lagi 💪';
          fb.className = 'feedback bad';
        }
      },
    });
  }

  draw();
}

export function runTantangan(container: HTMLElement, topic: GrammarTopic, onDone: OnDone): void {
  const fill: GrammarFill = topic.fill;
  container.innerHTML = `
    <span class="stage-badge">🌟 Bikin Sendiri</span>
    <div class="id-text">Lengkapi kalimat ini jadi ceritamu sendiri</div>
    <div class="en-text" id="sentencePreview">${fill.before.join(' ')} ___ ${fill.after.join(' ')}</div>
    <div class="opt-grid three" style="margin-top:16px;">
      ${fill.options
        .map((o, i) => `<button class="opt-btn" data-action="pick" data-payload="${i}">${o.emoji}<span class="lbl">${o.word}</span></button>`)
        .join('')}
    </div>
    <div class="feedback" id="fb"></div>
  `;

  setHandlers({
    pick: (payload) => {
      const i = Number(payload);
      const o = fill.options[i];
      const sentence = [...fill.before, o.word, ...fill.after].join(' ');
      container.querySelector<HTMLElement>('#sentencePreview')!.textContent = sentence + '.';
      container.querySelectorAll<HTMLElement>('.opt-btn').forEach((b) => b.classList.remove('correct'));
      container.querySelectorAll<HTMLElement>('.opt-btn')[i].classList.add('correct');
      const fb = container.querySelector<HTMLElement>('#fb')!;
      fb.textContent = 'Keren, itu kalimatmu sendiri! 🎉';
      fb.className = 'feedback good';
      speak(sentence);
      setTimeout(onDone, 1400);
    },
  });
}

/**
 * ================================================================
 * FORMAT KEDUA — kontras 2-kalimat audio+gambar (`GrammarPatternTopic`),
 * dipakai Little Stars ("Satu atau Banyak?", singular/plural) & Starter
 * ("Suka atau Tidak Suka?", present simple positive/negative). Lihat
 * komentar `GrammarPatternTopic`/`GrammarPatternItem` (types.ts) & `materi/
 * grammar.md` §4/§9 untuk alasan lengkap kenapa formatnya beda total dari
 * `GrammarTopic` di atas (Explorer/Adventurer/Achiever, teks-first
 * scramble/fill — anak pralek Little Stars/Starter belum bisa baca kalimat
 * sendiri). Fungsi lama di atas (`renderKenalan`/`runLatihanInti`/
 * `runTantangan`) TETAP dipakai apa adanya utk level teks-first — `app.ts`
 * membedakan lewat `'items' in topic` (types.ts `AnyGrammarTopic`).
 *
 * **Direname `singular`/`plural` → `formA`/`formB`** (riset per-level
 * meluas ke Starter) — SATU mekanik generik ini sekarang dipakai utk 2
 * kontras grammar BEDA (singular/plural DAN suka/tidak-suka), dibedakan
 * lewat `contrastVisual` topik (`'quantity'` vs `'polarity'`,
 * `contrastVisualInner()` di bawah) — supaya level BERIKUTNYA yang juga
 * cocok dgn mekanik "dengar 1 bentuk → tunjuk gambar cocok" bisa nebeng
 * tanpa mekanik baru lagi, cuma nambah 1 kontras visual baru kalau perlu.
 *
 * 2 langkah inti, ARAH DIBALIK antar keduanya (permintaan user "wajib ada
 * improvement" — riset `materi/grammar.md` §3/§4 mengonfirmasi SEMUA
 * kompetitor yang diriset cuma py 1 ARAH tugas: dengar kalimat → cocokkan
 * gambar, tidak pernah dibalik, sama pola dgn tangga 2-arah Reading Little
 * Stars `materi/reading.md` §6):
 *   1. Latihan Inti "👂 Dengar & Tunjuk" — dengar SATU bentuk kalimat
 *      (formA ATAU formB, diacak 5:5 lewat `buildPatternPlan`), tunjuk
 *      kartu kontras yang cocok — audio→gambar, pola universal "listen &
 *      point" (Cambridge Starters, Kumon "Look, Listen, Repeat").
 *   2. Tantangan "🔎 Lihat & Dengar, Pilih yang Pas" — ARAH DIBALIK: kartu
 *      kontras jadi stimulus duluan, anak dengar 2 pilihan ucapan (🔊 A /
 *      🔊 B, salah satu formA salah satu formB, posisi diacak) & pilih
 *      yang cocok dgn gambarnya — gambar→audio. Ini yang jadi improvement
 *      konkret, TIDAK dipunyai kompetitor manapun yang diriset.
 * Kedua langkah SENGAJA tanpa "💡 Petunjuk" (soal biner 2 opsi — eliminasi
 * opsi salah otomatis membocorkan jawaban, sama alasan Listening "Benar
 * atau Salah" tidak py hint, `games/listening.ts`).
 *
 * Kenalan (`renderKenalanPattern`) — TIGA aksi per kata (permintaan user
 * eksplisit: "di fitur kenalan tetap ada fitur mic dan main"), REUSE PERSIS
 * pola `games/reading.ts` `renderKenalanWord`/`games/speaking.ts`
 * `renderKenalanPhrase`: 🔊 dengar KEDUA bentuk kalimat berurutan
 * (`speakSequence`), 🎤 tirukan bentuk formA (skor proporsional + Play
 * Suaramu — WAJIB krn ini fitur mic, "Aturan Wajib: Setiap Fitur Speaking
 * Butuh Skor Proporsional" CLAUDE.md), 🎮 main (1 soal fokus kata itu, REUSE
 * PERSIS shape Latihan Inti, balik ke daftar sesudahnya — konvensi sama
 * `runWordMiniGame`/`runPhraseMiniGame`).
 *
 * Helper generik (`roundActionsHtml`/`quizNavHtml`/dst) diduplikasi lokal ke
 * file ini (konvensi sama `games/listening.ts`/`games/reading.ts`/
 * `games/speaking.ts` — helper UI generik diduplikasi per file game, BUKAN
 * diimpor lintas file, supaya fungsi lama yang stabil tidak ikut berisiko
 * regresi).
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

/** Ambil `count` item dari `items`, SEMUA item muncul dulu sebelum ada yang
 *  berulang — duplikat lokal dari pola `pickItemsForCount` Vocab/Listening/
 *  Reading. */
function pickItemsForCount(items: GrammarPatternItem[], count: number): GrammarPatternItem[] {
  let pool: GrammarPatternItem[] = [];
  while (pool.length < count) pool = pool.concat(shuffle(items));
  return pool.slice(0, count);
}

const LATIHAN_ROUND_SIZE = 10;
const TANTANGAN_ROUND_SIZE = 10;

/** Plan `count` slot: SEMUA kata topik keluar dulu sebelum berulang (via
 *  `pickItemsForCount`), bentuk formA/formB-nya diacak TERPISAH dari urutan
 *  kata (dibagi rata `count/2`:`count/2` — pola sama `LATIHAN_KIND_MIX`
 *  Listening `games/listening.ts`) — `kind` union `LatihanPlanSlot`
 *  (`'hear'|'toEn'|'toId'|'sentence'`, progress.ts) dipinjam labelnya SAJA
 *  (`'hear'` = formA, `'toEn'` = formB, tidak dipakai secara semantik), sama
 *  pola peminjaman label yang sudah dipakai Reading/Listening. */
function buildPatternPlan(topic: GrammarPatternTopic, count: number): LatihanPlanSlot[] {
  const targets = pickItemsForCount(topic.items, count);
  const half = Math.floor(count / 2);
  const kinds = shuffle([...Array(half).fill('hear'), ...Array(count - half).fill('toEn')]) as LatihanPlanSlot['kind'][];
  return targets.map((it, i) => ({ kind: kinds[i], item: topic.items.indexOf(it) }));
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

/** Skor proporsional dari ucapan anak vs kalimat formA target
 *  (`wordMatchDetail`, BUKAN pass/fail biner) — duplikat lokal pola
 *  `games/speaking.ts` `scoreMic`, WAJIB krn Kenalan di sini py fitur mic. */
function scorePatternMic(said: string, target: string): MicScore {
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

/**
 * Render ISI 1 kartu kontras (dipakai kartu jawaban Kenalan-mini-game/Latihan
 * Inti DAN panggung stimulus Tantangan) — cabang berdasar `contrastVisual`
 * topik (types.ts `GrammarContrastVisual`, komentar lengkap di sana): 5
 * varian — `'quantity'` (gambar diulang 1x/2x, JUMLAH = jawaban, dipakai jg
 * utk "there is/there are"), `'polarity'` (gambar + lencana ✅/❌, POSITIF/
 * NEGATIF = jawaban — dipakai "suka/tidak-suka" MAUPUN "have got"/"can" krn
 * strukturnya sama-sama positif-vs-negatif), `'proximity'` (gambar besar+🔍
 * vs kecil+🔭, JARAK dekat/jauh = jawaban, utk this/that), `'size'` (gambar
 * besar vs kecil TANPA lencana tambahan, UKURAN itu sendiri = jawaban, utk
 * big/small), `'character'` (gambar + lencana 👦/👧, KARAKTER org ketiga =
 * jawaban, dipakai utk possessive his/her MAUPUN subject pronoun he/she),
 * `'possessor'` (gambar + lencana 🙋/🫵, PEMBICARA vs LAWAN BICARA =
 * jawaban, dipakai utk possessive 1st/2nd person my/your — beda deiksis dari
 * `'character'` yg org ketiga), `'inclusion'` (BARU — gambar + lencana
 * 🙋/👉, GRUP TERMASUK vs DI LUAR pembicara = jawaban, dipakai utk subject
 * pronoun we/they & possessive our/their — beda dari `'possessor'` yg
 * TUNGGAL org ke-2, ini PLURAL/grup). SATU fungsi
 * ini yang bikin mekanik Kenalan/Latihan Inti/Tantangan di bawah bisa
 * dipakai ulang lintas kontras grammar BEDA tanpa mekanik baru per level —
 * cuma variasi visual, bukan variasi task shape.
 */
function contrastVisualInner(emoji: string, isFormB: boolean, visual: GrammarContrastVisual): string {
  if (visual === 'polarity') {
    return `<span style="font-size:34px;display:block" aria-hidden="true">${emoji}</span><span class="lbl">${isFormB ? '❌' : '✅'}</span>`;
  }
  if (visual === 'proximity') {
    return `<span style="font-size:${isFormB ? 22 : 44}px;display:block" aria-hidden="true">${emoji}</span><span class="lbl">${isFormB ? '🔭' : '🔍'}</span>`;
  }
  if (visual === 'size') {
    return `<span style="font-size:${isFormB ? 20 : 46}px;display:block" aria-hidden="true">${emoji}</span>`;
  }
  if (visual === 'character') {
    return `<span style="font-size:34px;display:block" aria-hidden="true">${emoji}</span><span class="lbl">${isFormB ? '👧' : '👦'}</span>`;
  }
  if (visual === 'possessor') {
    return `<span style="font-size:34px;display:block" aria-hidden="true">${emoji}</span><span class="lbl">${isFormB ? '🫵' : '🙋'}</span>`;
  }
  if (visual === 'inclusion') {
    return `<span style="font-size:34px;display:block" aria-hidden="true">${emoji}</span><span class="lbl">${isFormB ? '👉' : '🙋'}</span>`;
  }
  const count = isFormB ? 2 : 1;
  return `<span style="font-size:34px;display:block${count > 1 ? ';letter-spacing:6px' : ''}" aria-hidden="true">${emoji.repeat(count)}</span><span class="lbl">${count}</span>`;
}

/** 2 kartu jawaban kontras: index 0 = formA, index 1 = formB — posisi TETAP
 *  (bukan diacak spt opsi teks di skill lain) krn jawabannya sendiri MELEKAT
 *  ke ISI gambar (jumlah atau lencana), bukan disembunyikan di balik posisi
 *  acak. */
function contrastOptionsHtml(emoji: string, visual: GrammarContrastVisual): string {
  return `<div class="opt-grid">
    <button class="opt-btn" type="button" data-action="pick" data-payload="0">${contrastVisualInner(emoji, false, visual)}</button>
    <button class="opt-btn" type="button" data-action="pick" data-payload="1">${contrastVisualInner(emoji, true, visual)}</button>
  </div>`;
}

const CHOICE_LETTERS = ['A', 'B'];

/**
 * Kenalan — 1 baris per kata: 🔊 dengar KEDUA bentuk (formA lalu formB,
 * `speakSequence`), 🎤 tirukan bentuk formA (skor proporsional + Play
 * Suaramu), 🎮 main (1 soal dengar&tunjuk fokus kata itu, balik ke daftar
 * sesudahnya) — permintaan user eksplisit: "di fitur kenalan tetap ada
 * fitur mic dan main", REUSE PERSIS pola `games/reading.ts`
 * `renderKenalanWord` (3 aksi yang sama).
 */
export function renderKenalanPattern(container: HTMLElement, topic: GrammarPatternTopic, onNext: OnDone, level: LevelKey): void {
  const doneCls = (i: number, action: 'listen' | 'mic' | 'game'): string =>
    hasWordInteraction('grammar', topic.id, i, action) ? ' done' : '';

  drawList();

  function drawList(): void {
    container.innerHTML = `
      <div class="id-text" style="margin-bottom:10px;">Dengarkan pola kalimatnya, tap 🔊 utk mengulang${sttSupported ? ', tap 🎤 buat coba tirukan' : ''}, atau tap 🎮 buat main sama polanya</div>
      <div class="primer-list">
        ${topic.items
          .map(
            (it, i) => `
          <div class="primer-item" style="align-items:flex-start">
            <div style="font-size:26px">${it.emoji}</div>
            <div class="txt">
              <b>${it.formA.en}</b><span>${it.formA.id}</span>
              <b style="display:block;margin-top:6px">${it.formB.en}</b><span>${it.formB.id}</span>
            </div>
            <div class="mini-play${doneCls(i, 'listen')}" data-action="playPattern" data-payload="${i}">🔊</div>
            ${sttSupported ? `<div class="mini-play${doneCls(i, 'mic')}" id="micMini${i}" data-action="micPattern" data-payload="${i}">🎤</div>` : ''}
            <div class="mini-play${doneCls(i, 'game')}" data-action="gamePattern" data-payload="${i}">🎮</div>
          </div>`
          )
          .join('')}
      </div>
      <button class="primary-btn" data-action="advance">Lanjut ke Latihan Inti →</button>
    `;
    setHandlers({
      playPattern: (payload) => {
        const i = Number(payload);
        markWordInteraction('grammar', topic.id, i, 'listen', topic.items[i].formA.en);
        speakSequence([topic.items[i].formA.en, topic.items[i].formB.en]);
        drawList();
      },
      micPattern: (payload) => {
        const i = Number(payload);
        markWordInteraction('grammar', topic.id, i, 'mic', topic.items[i].formA.en);
        recordEvent({ kind: 'interact', skill: 'grammar', topicId: topic.id, section: 'kenalan', slot: i, itemRef: topic.items[i].formA.en, activity: 'mic' });
        drawList();
        micFor(i);
      },
      gamePattern: (payload) => {
        const i = Number(payload);
        markWordInteraction('grammar', topic.id, i, 'game', topic.items[i].formA.en);
        recordEvent({ kind: 'interact', skill: 'grammar', topicId: topic.id, section: 'kenalan', slot: i, itemRef: topic.items[i].formA.en, activity: 'game' });
        runPatternMiniGame(container, topic, topic.items[i], drawList, level);
      },
      advance: () => onNext(),
    });
  }

  function openMicResultPopup(it: GrammarPatternItem, index: number, said: string | null, errorText: string | null): void {
    const overlay = document.createElement('div');
    overlay.className = 'mic-pop-overlay';

    let bodyHtml = '';
    if (said !== null) {
      const s = scorePatternMic(said, it.formA.en);
      if (s.perfect) {
        playCorrectTone();
        fireConfetti();
      } else playTryAgainTone();
      recordEvent({
        kind: 'speak',
        skill: 'grammar',
        topicId: topic.id,
        section: 'kenalan',
        slot: index,
        itemRef: it.formA.en,
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
        <div class="en-text" style="margin:2px 0 10px">${it.formA.en}</div>
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

/** 🎮 Main · Dengar & Tunjuk — dipicu dari Kenalan, 1 soal fokus SATU kata:
 *  acak formA/formB, dengar bentuknya, tunjuk kartu kontras yang cocok —
 *  REUSE PERSIS shape Latihan Inti (`contrastOptionsHtml`), balik ke daftar
 *  Kenalan sesudahnya (pola sama `runWordMiniGame`/`runPhraseMiniGame`). */
function runPatternMiniGame(container: HTMLElement, topic: GrammarPatternTopic, item: GrammarPatternItem, onBack: OnDone, level: LevelKey): void {
  const visual: GrammarContrastVisual = topic.contrastVisual ?? 'quantity';
  const wantFormB = Math.random() < 0.5;
  const target = wantFormB ? item.formB : item.formA;
  let answered = false;

  function paint(): void {
    container.innerHTML = `
      <span class="stage-badge">🎮 Main · Dengar &amp; Tunjuk</span>
      <div class="id-text">Dengarkan dulu, lalu tunjuk gambar yang cocok</div>
      <div class="speak-row"><button class="speak-btn pt-cta" type="button" data-action="replay">🔊 Dengar</button></div>
      ${contrastOptionsHtml(item.emoji, visual)}
      <div class="feedback" id="fb"></div>
    `;
    setHandlers({
      replay: () => speak(target.en),
      pick: (payload) => {
        if (answered) return;
        const i = Number(payload);
        onAnswer(wantFormB ? i === 1 : i === 0, i);
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
    recordEvent({ kind: 'answer', skill: 'grammar', topicId: topic.id, itemRef: target.en, activity: 'pattern-mini', correct });
    fb.insertAdjacentHTML('afterend', roundActionsHtml(true));
    setHandlers({
      tryAgainRound: () => {
        answered = false;
        paint();
      },
      nextRound: () => onBack(),
    });
  }

  speak(target.en);
  paint();
}

/**
 * Latihan Inti "👂 Dengar & Tunjuk" — 10 soal (plan `buildPatternPlan`, tiap
 * kata keluar tepat 1x, bentuk formA/formB diacak terpisah 5:5): dengar SATU
 * bentuk kalimat (auto-play + "🔊 Dengar" replay manual), tunjuk kartu
 * kontras yang cocok — audio→gambar, comprehension murni.
 */
export function runLatihanIntiPattern(container: HTMLElement, topic: GrammarPatternTopic, onDone: OnDone, level: LevelKey): void {
  const visual: GrammarContrastVisual = topic.contrastVisual ?? 'quantity';
  const buildPlan = () => buildPatternPlan(topic, LATIHAN_ROUND_SIZE);
  let section = ensureSection('grammar', topic.id, 'latihan', buildPlan);
  const expectedCoverage = Math.min(topic.items.length, LATIHAN_ROUND_SIZE);
  const plan = section.plan ?? [];
  const actualCoverage = new Set(plan.map((s) => s.item)).size;
  const isStalePlan = plan.length !== LATIHAN_ROUND_SIZE || actualCoverage < expectedCoverage;
  if (isStalePlan) {
    resetSectionPlan('grammar', topic.id, 'latihan', buildPlan());
    section = ensureSection('grammar', topic.id, 'latihan');
  }
  const order = (section.plan ?? []).map((slot) => ({ item: topic.items[slot.item] ?? topic.items[0], wantFormB: slot.kind === 'toEn' }));
  let round = Math.min(Math.max(section.cursor, 0), order.length - 1);

  const slotStatus = (i: number): 0 | 1 | 2 => getSlot('grammar', topic.id, 'latihan', i)?.st ?? 0;

  function goTo(i: number): void {
    round = Math.min(Math.max(i, 0), order.length - 1);
    setSectionCursor('grammar', topic.id, 'latihan', round);
    draw();
  }

  function draw(): void {
    if (round >= order.length) return onDone();
    redraw();
  }

  function redraw(): void {
    const { item: target, wantFormB } = order[round];
    const form = wantFormB ? target.formB : target.formA;

    container.innerHTML = `
      <span class="stage-badge">👂 Dengar &amp; Tunjuk</span>
      ${quizNavHtml(round, order.length, slotStatus)}
      <div class="id-text">Soal ${round + 1} dari ${order.length}</div>
      <div class="speak-row"><button class="speak-btn pt-cta" type="button" data-action="replay">🔊 Dengar</button></div>
      <div class="id-text" style="font-weight:800;margin:6px 0 4px">Mana yang cocok dengan yang kamu dengar?</div>
      ${contrastOptionsHtml(target.emoji, visual)}
      <div class="feedback" id="fb"></div>
    `;
    wireQuizNav(goTo);

    setHandlers({
      replay: () => speak(form.en),
      pick: (payload) => {
        const i = Number(payload);
        const btn = container.querySelectorAll<HTMLElement>('.opt-btn')[i];
        const fb = container.querySelector<HTMLElement>('#fb')!;
        const correct = wantFormB ? i === 1 : i === 0;
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
        markSlotAnswered('grammar', topic.id, 'latihan', round, correct, { itemRef: form.en });
        recordEvent({
          kind: 'answer',
          skill: 'grammar',
          topicId: topic.id,
          section: 'latihan',
          slot: round,
          itemRef: form.en,
          activity: 'hear-to-qty',
          correct,
        });
        fb.insertAdjacentHTML('afterend', roundActionsHtml(round === order.length - 1));
        setHandlers({
          tryAgainRound: () => redraw(),
          nextRound: () => {
            round += 1;
            setSectionCursor('grammar', topic.id, 'latihan', Math.min(round, order.length - 1));
            draw();
          },
        });
      },
    });

    speak(form.en);
  }

  draw();
}

/**
 * Tantangan "🔎 Lihat & Dengar, Pilih yang Pas" — 10 soal, ARAH DIBALIK dari
 * Latihan Inti (permintaan user "wajib ada improvement", `materi/
 * grammar.md` §4): kartu kontras (dari plan section TERPISAH `tantangan-pola`
 * — assignment formA/formB-nya independen dari Latihan Inti) jadi stimulus
 * duluan, anak dengar 2 pilihan ucapan (🔊 A / 🔊 B, posisi diacak) & pilih
 * yang cocok — gambar→audio, kebalikan comprehension Latihan Inti (tangga
 * 2-arah, sama prinsip Reading Little Stars).
 */
export function runTantanganPattern(container: HTMLElement, topic: GrammarPatternTopic, onDone: OnDone, level: LevelKey): void {
  const visual: GrammarContrastVisual = topic.contrastVisual ?? 'quantity';
  const buildPlan = () => buildPatternPlan(topic, TANTANGAN_ROUND_SIZE);
  let section = ensureSection('grammar', topic.id, 'tantangan-pola', buildPlan);
  const expectedCoverage = Math.min(topic.items.length, TANTANGAN_ROUND_SIZE);
  const plan = section.plan ?? [];
  const actualCoverage = new Set(plan.map((s) => s.item)).size;
  const isStalePlan = plan.length !== TANTANGAN_ROUND_SIZE || actualCoverage < expectedCoverage;
  if (isStalePlan) {
    resetSectionPlan('grammar', topic.id, 'tantangan-pola', buildPlan());
    section = ensureSection('grammar', topic.id, 'tantangan-pola');
  }
  const order = (section.plan ?? []).map((slot) => ({ item: topic.items[slot.item] ?? topic.items[0], wantFormB: slot.kind === 'toEn' }));
  let round = Math.min(Math.max(section.cursor, 0), order.length - 1);

  const slotStatus = (i: number): 0 | 1 | 2 => getSlot('grammar', topic.id, 'tantangan-pola', i)?.st ?? 0;

  function goTo(i: number): void {
    round = Math.min(Math.max(i, 0), order.length - 1);
    setSectionCursor('grammar', topic.id, 'tantangan-pola', round);
    draw();
  }

  function draw(): void {
    if (round >= order.length) return onDone();
    redraw();
  }

  function redraw(): void {
    const { item: target, wantFormB } = order[round];
    const choices = shuffle([
      { wantFormB: false, form: target.formA },
      { wantFormB: true, form: target.formB },
    ]);
    // Dengar (`listenChoice`) & pilih (`confirmChoice`) SENGAJA 2 langkah
    // terpisah (revisi audit user: sebelumnya 1 tap = dengar SEKALIGUS
    // langsung terkunci sbg jawaban final — anak yang salah dengar SEKALI
    // (bukan salah paham) langsung dapat status salah). Sekarang anak boleh
    // dengar ulang/ganti pilihan bebas (`selected` berpindah, TIDAK
    // mengevaluasi apa pun), baru commit lewat tombol terpisah "✅ Pilih
    // Jawaban Ini" begitu sudah yakin — konsisten dgn skill lain yang SELALU
    // menampilkan opsi (gambar/teks) dulu sebelum tap mengevaluasi; di sini
    // "opsi"-nya audio tersembunyi, jadi butuh tahap dengar eksplisit.
    let selected: number | null = null;

    function paint(): void {
      container.innerHTML = `
        <span class="stage-badge">🔎 Lihat &amp; Dengar, Pilih yang Pas</span>
        ${quizNavHtml(round, order.length, slotStatus)}
        <div class="id-text">Soal ${round + 1} dari ${order.length}</div>
        <div style="text-align:center;margin:14px 0" aria-hidden="true">${contrastVisualInner(target.emoji, wantFormB, visual)}</div>
        <div class="id-text" style="font-weight:800;margin:6px 0 4px">Dengarkan tiap pilihan (boleh berkali-kali), lalu pilih yang cocok dengan gambar ini</div>
        <div class="opt-grid">
          ${choices
            .map(
              (_, i) => `
          <button class="opt-btn${selected === i ? ' selected' : ''}" type="button" data-action="listenChoice" data-payload="${i}">🔊<span class="lbl">${CHOICE_LETTERS[i]}</span></button>`
            )
            .join('')}
        </div>
        <button class="primary-btn" type="button" data-action="confirmChoice" style="margin-top:14px" ${selected === null ? 'disabled' : ''}>✅ Pilih Jawaban Ini</button>
        <div class="feedback" id="fb"></div>
      `;
      wireQuizNav(goTo);
      setHandlers({
        listenChoice: (payload) => {
          selected = Number(payload);
          speak(choices[selected].form.en);
          paint();
        },
        confirmChoice: () => {
          if (selected === null) return;
          onAnswer(selected);
        },
      });
    }

    function onAnswer(i: number): void {
      const btn = container.querySelectorAll<HTMLElement>('.opt-btn')[i];
      const fb = container.querySelector<HTMLElement>('#fb')!;
      const correct = choices[i].wantFormB === wantFormB;
      lockOptionButtons(container);
      container.querySelector<HTMLButtonElement>('[data-action="confirmChoice"]')!.disabled = true;
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
      markSlotAnswered('grammar', topic.id, 'tantangan-pola', round, correct, { itemRef: target.en });
      recordEvent({
        kind: 'answer',
        skill: 'grammar',
        topicId: topic.id,
        section: 'tantangan-pola',
        slot: round,
        itemRef: target.en,
        activity: 'qty-to-hear',
        correct,
      });
      fb.insertAdjacentHTML('afterend', roundActionsHtml(round === order.length - 1));
      setHandlers({
        tryAgainRound: () => redraw(),
        nextRound: () => {
          round += 1;
          setSectionCursor('grammar', topic.id, 'tantangan-pola', Math.min(round, order.length - 1));
          draw();
        },
      });
    }

    paint();
  }

  draw();
}

/**
 * ================================================================
 * FORMAT KETIGA Grammar — transformasi kalimat MCQ (`GrammarTransformTopic`),
 * khusus Trailblazer (12+ th, ≈B1). Lihat komentar `GrammarTransformTopic`
 * (types.ts) & `materi/grammar.md` §9 utk alasan lengkap kenapa formatnya
 * BEDA TOTAL dari 2 format di atas (Cambridge PET menguji passive/reported
 * speech/conditionals lewat KEY-WORD TRANSFORMATION — tulis ulang kalimat
 * supaya bermakna sama, bukan susun-kata/isi-blank/kontras-2-kalimat-tetap).
 * **User ditanya eksplisit** sebelum dibangun ("ikuti default PRD §9
 * low-effort" vs "bangun format baru sentence-transformation ala PET") —
 * PILIH bangun format baru.
 *
 * 2 langkah, ARAH DIBALIK (konsisten prinsip tangga 2-arah format kedua di
 * atas & Reading Little Stars):
 *   1. Latihan Inti "🔁 Ubah Jadi Reported Speech" — baca+dengar kutipan
 *      LANGSUNG (`original`), pilih hasil REPORTED SPEECH yang benar dari 4
 *      opsi teks (`reportedOptions`, distraktor ditulis manual per item —
 *      types.ts, krn harus tetap relevan ke kutipan yg sama).
 *   2. Tantangan "🔎 Siapa Bilang Apa?" — ARAH DIBALIK: baca+dengar kalimat
 *      REPORTED (hasil benar), tebak kutipan LANGSUNG aslinya dari 4 opsi
 *      (opsi = kutipan sendiri + 3 kutipan sesama item topik, pola sama
 *      `buildWordOptions` Reading — aman diambil dari sibling krn tugasnya
 *      "quote MANA", bukan "kesalahan grammar mana").
 * Trailblazer (12+ th) sudah bisa baca fasih — SEMUA teks kelihatan (beda
 * dari format audio-first Little Stars/Starter di atas), TTS cuma bantuan
 * dengar, bukan satu-satunya sumber informasi. 4 opsi (bukan 2 biner) jadi
 * "💡 Petunjuk" (eliminasi 2 opsi salah, pola 50/50 sama Vocab/Listening/
 * Reading) RELEVAN lagi di sini — beda dari format kedua di atas.
 *
 * Kenalan (`renderKenalanTransform`) — daftar teks kutipan+hasil
 * transformasinya berdampingan + 🔊 baca, TANPA mic/game (beda dari format
 * kedua di atas — "tetap ada fitur mic dan main" itu permintaan KHUSUS
 * konteks Little Stars, bukan aturan wajib semua format Grammar baru; format
 * ini teks-first spt `GrammarTopic` lama yang Kenalan-nya jg cuma daftar+
 * baca, bukan audio-first spt Little Stars/Starter).
 * ================================================================
 */

function transformOptionsHtml(options: string[]): string {
  return `<div class="opt-grid">
    ${options.map((text, i) => `<button class="opt-btn opt-btn-text" type="button" data-action="pick" data-payload="${i}">${text}</button>`).join('')}
  </div>`;
}

const transformHintButtonHtml = `<button class="ghost-btn hint-chip" type="button" id="hintBtn" data-action="hint">💡 Petunjuk</button>`;

/** 💡 Petunjuk — matikan 2 dari opsi salah secara acak, sisa persis 2
 *  pilihan (pola 50/50 sama Vocab/Listening/Reading `wireHint`). Sekali
 *  pakai per soal. */
function wireTransformHint(container: HTMLElement, okFlags: boolean[], onUsed?: () => void): void {
  let used = false;
  setHandlers({
    hint: () => {
      if (used) return;
      const btns = container.querySelectorAll<HTMLButtonElement>('.opt-btn');
      const wrongIdx = okFlags.map((_, i) => i).filter((i) => !okFlags[i] && !btns[i].disabled);
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

/** Plan `topic.transforms.length` slot (SELALU = jumlah item topik, tanpa
 *  perlu `pickItemsForCount` krn tidak ada pengulangan) diacak SEKALI &
 *  dipersist (`plan`) — supaya urutan soal STABIL lintas resume (`round`
 *  yang dibaca dari `section.cursor` harus menunjuk kutipan yang SAMA
 *  setiap kali layar ini dibuka ulang, bukan shuffle baru tiap render). */
function buildTransformPlan(topic: GrammarTransformTopic): LatihanPlanSlot[] {
  return shuffle(topic.transforms.map((_, i) => i)).map((item) => ({ kind: 'hear', item }));
}

export function renderKenalanTransform(container: HTMLElement, topic: GrammarTransformTopic, onNext: OnDone): void {
  container.innerHTML = `
    <div class="id-text" style="margin-bottom:10px;">Perhatikan bagaimana ucapan langsung berubah jadi reported speech</div>
    <div class="primer-list">
      ${topic.transforms
        .map((t, i) => {
          const correct = t.reportedOptions.find((o) => o.ok)!;
          return `
        <div class="primer-item" style="align-items:flex-start">
          <div style="font-size:26px">${t.emoji}</div>
          <div class="txt">
            <b>${t.speaker}: "${t.original}"</b>
            <span style="display:block;margin-top:4px">→ ${correct.text}</span>
          </div>
          <div class="mini-play" data-action="play" data-payload="${i}">🔊</div>
        </div>`;
        })
        .join('')}
    </div>
    <button class="primary-btn" data-action="advance">Lanjut ke Latihan Inti →</button>
  `;
  setHandlers({
    play: (payload) => {
      const t = topic.transforms[Number(payload)];
      const correct = t.reportedOptions.find((o) => o.ok)!;
      speakSequence([t.original, correct.text]);
    },
    advance: () => onNext(),
  });
}

/**
 * Latihan Inti "🔁 Ubah Jadi Reported Speech" — 10 soal (1 per kutipan):
 * baca+dengar kutipan langsung, pilih hasil reported speech yang benar dari
 * 4 opsi teks.
 */
export function runLatihanIntiTransform(container: HTMLElement, topic: GrammarTransformTopic, onDone: OnDone, level: LevelKey): void {
  const buildPlan = () => buildTransformPlan(topic);
  let section = ensureSection('grammar', topic.id, 'latihan', buildPlan);
  const isStalePlan = (section.plan ?? []).length !== topic.transforms.length;
  if (isStalePlan) {
    resetSectionPlan('grammar', topic.id, 'latihan', buildPlan());
    section = ensureSection('grammar', topic.id, 'latihan');
  }
  const order = (section.plan ?? []).map((slot) => topic.transforms[slot.item] ?? topic.transforms[0]);
  let round = Math.min(Math.max(section.cursor, 0), order.length - 1);
  let hintUsedThisSlot = false;

  const slotStatus = (i: number): 0 | 1 | 2 => getSlot('grammar', topic.id, 'latihan', i)?.st ?? 0;

  function goTo(i: number): void {
    round = Math.min(Math.max(i, 0), order.length - 1);
    setSectionCursor('grammar', topic.id, 'latihan', round);
    draw();
  }

  function draw(): void {
    if (round >= order.length) return onDone();
    hintUsedThisSlot = false;
    redraw();
  }

  function redraw(): void {
    const target = order[round];
    const options = shuffle(target.reportedOptions);

    container.innerHTML = `
      <div class="latihan-head">
        <span class="stage-badge">🔁 Ubah Jadi Reported Speech</span>
        ${transformHintButtonHtml}
      </div>
      ${quizNavHtml(round, order.length, slotStatus)}
      <div class="id-text">Soal ${round + 1} dari ${order.length}</div>
      <div class="big-emoji" style="font-size:40px">${target.emoji}</div>
      <div class="en-text">${target.speaker}: "${target.original}"</div>
      <div class="speak-row"><button class="speak-btn-ghost" type="button" data-action="replay">🔊 Dengar</button></div>
      ${transformOptionsHtml(options.map((o) => o.text))}
      <div class="feedback" id="fb"></div>
    `;
    wireTransformHint(
      container,
      options.map((o) => o.ok),
      () => (hintUsedThisSlot = true)
    );
    wireQuizNav(goTo);

    setHandlers({
      replay: () => speak(target.original),
      pick: (payload) => {
        const i = Number(payload);
        const btn = container.querySelectorAll<HTMLElement>('.opt-btn')[i];
        const fb = container.querySelector<HTMLElement>('#fb')!;
        const correct = options[i].ok;
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
        markSlotAnswered('grammar', topic.id, 'latihan', round, correct, { hint: hintUsedThisSlot, itemRef: target.original });
        recordEvent({
          kind: 'answer',
          skill: 'grammar',
          topicId: topic.id,
          section: 'latihan',
          slot: round,
          itemRef: target.original,
          activity: 'direct-to-reported',
          correct,
          hintUsed: hintUsedThisSlot,
        });
        fb.insertAdjacentHTML('afterend', roundActionsHtml(round === order.length - 1));
        setHandlers({
          tryAgainRound: () => redraw(),
          nextRound: () => {
            round += 1;
            setSectionCursor('grammar', topic.id, 'latihan', Math.min(round, order.length - 1));
            draw();
          },
        });
      },
    });

    speak(target.original);
  }

  draw();
}

/** 4 opsi kutipan ASLI = target + 3 distraktor acak dari `original` sesama
 *  item topik (pola sama `buildWordOptions` Reading — kutipan tokoh LAIN
 *  otomatis jadi opsi salah yang masuk akal, TIDAK perlu ditulis manual spt
 *  `reportedOptions` krn di sini "salah"-nya cukup "quote yang beda"). */
function buildOriginalOptions(topic: GrammarTransformTopic, target: GrammarTransformItem): GrammarTransformItem[] {
  const distractors = shuffle(topic.transforms.filter((t) => t !== target)).slice(0, 3);
  return shuffle([target, ...distractors]);
}

/**
 * Tantangan "🔎 Siapa Bilang Apa?" — 10 soal, ARAH DIBALIK dari Latihan
 * Inti: baca+dengar kalimat REPORTED (hasil benar), tebak kutipan LANGSUNG
 * aslinya dari 4 opsi — reported→original, kebalikan comprehension Latihan
 * Inti (tangga 2-arah, sama prinsip format kedua Little Stars/Starter).
 */
export function runTantanganTransform(container: HTMLElement, topic: GrammarTransformTopic, onDone: OnDone, level: LevelKey): void {
  const buildPlan = () => buildTransformPlan(topic);
  let section = ensureSection('grammar', topic.id, 'tantangan-transform', buildPlan);
  const isStalePlan = (section.plan ?? []).length !== topic.transforms.length;
  if (isStalePlan) {
    resetSectionPlan('grammar', topic.id, 'tantangan-transform', buildPlan());
    section = ensureSection('grammar', topic.id, 'tantangan-transform');
  }
  const order = (section.plan ?? []).map((slot) => topic.transforms[slot.item] ?? topic.transforms[0]);
  let round = Math.min(Math.max(section.cursor, 0), order.length - 1);
  let hintUsedThisSlot = false;

  const slotStatus = (i: number): 0 | 1 | 2 => getSlot('grammar', topic.id, 'tantangan-transform', i)?.st ?? 0;

  function goTo(i: number): void {
    round = Math.min(Math.max(i, 0), order.length - 1);
    setSectionCursor('grammar', topic.id, 'tantangan-transform', round);
    draw();
  }

  function draw(): void {
    if (round >= order.length) return onDone();
    hintUsedThisSlot = false;
    redraw();
  }

  function redraw(): void {
    const target = order[round];
    const correct = target.reportedOptions.find((o) => o.ok)!;
    const options = buildOriginalOptions(topic, target);

    container.innerHTML = `
      <div class="latihan-head">
        <span class="stage-badge">🔎 Siapa Bilang Apa?</span>
        ${transformHintButtonHtml}
      </div>
      ${quizNavHtml(round, order.length, slotStatus)}
      <div class="id-text">Soal ${round + 1} dari ${order.length}</div>
      <div class="big-emoji" style="font-size:40px">${target.emoji}</div>
      <div class="en-text">${correct.text}</div>
      <div class="speak-row"><button class="speak-btn-ghost" type="button" data-action="replay">🔊 Dengar</button></div>
      <div class="id-text" style="font-weight:800;margin:6px 0 4px">Kutipan langsung mana yang aslinya?</div>
      ${transformOptionsHtml(options.map((o) => `${o.speaker}: "${o.original}"`))}
      <div class="feedback" id="fb"></div>
    `;
    wireTransformHint(
      container,
      options.map((o) => o === target),
      () => (hintUsedThisSlot = true)
    );
    wireQuizNav(goTo);

    setHandlers({
      replay: () => speak(correct.text),
      pick: (payload) => {
        const i = Number(payload);
        const btn = container.querySelectorAll<HTMLElement>('.opt-btn')[i];
        const fb = container.querySelector<HTMLElement>('#fb')!;
        const correctPick = options[i] === target;
        lockOptionButtons(container);
        if (correctPick) {
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
        markSlotAnswered('grammar', topic.id, 'tantangan-transform', round, correctPick, { hint: hintUsedThisSlot, itemRef: target.original });
        recordEvent({
          kind: 'answer',
          skill: 'grammar',
          topicId: topic.id,
          section: 'tantangan-transform',
          slot: round,
          itemRef: target.original,
          activity: 'reported-to-direct',
          correct: correctPick,
          hintUsed: hintUsedThisSlot,
        });
        fb.insertAdjacentHTML('afterend', roundActionsHtml(round === order.length - 1));
        setHandlers({
          tryAgainRound: () => redraw(),
          nextRound: () => {
            round += 1;
            setSectionCursor('grammar', topic.id, 'tantangan-transform', Math.min(round, order.length - 1));
            draw();
          },
        });
      },
    });

    speak(correct.text);
  }

  draw();
}
