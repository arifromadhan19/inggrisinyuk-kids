import type {
  LevelKey,
  ListeningDialogueLine,
  ListeningDialogueTopic,
  ListeningDrill,
  ListeningInferenceQuestion,
  ListeningInferenceOption,
  ListeningItemsTopic,
  ListeningNoteGap,
  ListeningNoteTopic,
  ListeningOption,
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
import {
  listenAndRecordOnce,
  playCorrectTone,
  playTryAgainTone,
  playWrongTone,
  speak,
  speakDialogue,
  speakSequence,
  sttSupported,
  vibrateDevice,
  wordMatchDetail,
} from '../speech';
import type { VoiceGender } from '../speech';
import { pickEncourage, pickPraise } from '../praise';
import { shuffle } from '../util';

/* ---------- Tier mekanik Listening (materi/pembeda_level.md, section Listening) ----------
 * Semua dihitung dari `contentLevel` (level TOPIK yang tampil), BUKAN `level`
 * (badge anak / bahasa pujian). Tahap Kenalan sengaja tidak ikut ditier. */

function isFlyersOrAbove(contentLevel: LevelKey): boolean {
  return contentLevel === 'achiever' || contentLevel === 'trailblazer';
}

/** Default kecepatan suara di Latihan Inti/Tantangan — CEFR: A1 "very slow" →
 *  B1 mendekati tempo alami. Pill kecepatan user tetap menang (`applyDefaultRate`). */
export function listeningDefaultRate(contentLevel: LevelKey): 0.75 | 1 {
  return contentLevel === 'adventurer' || isFlyersOrAbove(contentLevel) ? 1 : 0.75;
}

/** Jarak antar kalimat (ms, start-ke-start) — makin tinggi level makin rapat. */
function listeningGapMs(contentLevel: LevelKey): number {
  return isFlyersOrAbove(contentLevel) ? 1200 : 2000;
}

/** Petunjuk Latihan Inti: level Dasar/Menengah = teks + eliminasi 2 opsi;
 *  Achiever/Trailblazer = teks saja (bantuan lebih pelit, ala ujian KET/PET). */
function hintEliminatesOptions(contentLevel: LevelKey): boolean {
  return !isFlyersOrAbove(contentLevel);
}

// Nama tokoh dialog Trailblazer → gender suara. Dipakai `dialogueGenders`;
// nama yang tidak terdaftar dianggap wanita, dan 2 tokoh yang kebetulan
// sama gender otomatis dipaksa beda (penutur harus terdengar berbeda).
const MALE_SPEAKERS = new Set(['Dimas', 'Leo', 'Pak Joko', 'Kak Rian', 'Fajar', 'Yoga', 'Bima', 'Andi', 'Rio', 'Doni', 'Dito', 'Pak Budi', 'Bimo', 'Vino']);

function dialogueGenders(lines: ListeningDialogueLine[]): Map<string, VoiceGender> {
  const genders = new Map<string, VoiceGender>();
  for (const l of lines) {
    if (!genders.has(l.speaker)) genders.set(l.speaker, MALE_SPEAKERS.has(l.speaker) ? 'male' : 'female');
  }
  const names = [...genders.keys()];
  if (names.length >= 2 && new Set(genders.values()).size === 1) {
    genders.set(names[1], genders.get(names[0]) === 'female' ? 'male' : 'female');
  }
  return genders;
}

/** Primer format lama berbentuk tanya-jawab (baris pertama diakhiri "?") →
 *  baris genap dibacakan suara wanita, baris ganjil pria; selain itu null
 *  (1 penutur, pakai suara pilihan user). */
function primerGender(topic: ListeningTopic, i: number): VoiceGender | null {
  if (topic.primer.length < 2 || !topic.primer[0].en.trim().endsWith('?')) return null;
  return i % 2 === 0 ? 'female' : 'male';
}

const STOP_WORDS = new Set([
  'the', 'a', 'an', 'her', 'his', 'my', 'of', 'in', 'to', 'for', 'on', 'at', 'with', 'from', 'after', 'before', 'is',
  'it', 'and', 'by', 'near', 'behind', 'front', 'between', 'one', 'two', 'very', 'every', 'each', 'new', 'old', 'all',
  'no', 'not', 'was', 'too', 'only', 'their', 'they', 'he', 'she', 'we', 'i', 'you', 'are', 'have', 'has',
  'o', 'clock',
]);

function coreWords(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z' ]/g, ' ')
    .split(/\s+/)
    .filter((w) => w && !STOP_WORDS.has(w))
    .map((w) => w.replace(/(ing|es|ed|s)$/, ''));
}

/** Opsi jebakan acak dari daftar kandidat: buang yang sama dgn opsi yang ada
 *  (case-insensitive) atau yang "disebut" di audio (lebih dari separuh kata
 *  intinya terdengar; kata yang ada di SEMUA opsi yang sudah ada — mis.
 *  "Book" di "The Title of the Book" — diabaikan) supaya tetap "tidak
 *  disebut" & tidak jadi jawaban kedua yang benar. */
function isDecoyHeard(label: string, existing: string[], audioText: string): boolean {
  const heard = new Set(coreWords(audioText));
  const cores = existing.map((e) => new Set(coreWords(e)));
  const frame = cores.length ? [...cores[0]].filter((w) => cores.every((c) => c.has(w))) : [];
  const words = coreWords(label).filter((w) => !frame.includes(w));
  return words.filter((w) => heard.has(w)).length > words.length / 2;
}

function pickDecoy<T>(candidates: T[], label: (c: T) => string, existing: string[], audioText: string): T | null {
  const have = new Set(existing.map((e) => e.toLowerCase()));
  const usable = candidates.filter((c) => {
    const l = label(c);
    return l && !have.has(l.toLowerCase()) && !isDecoyHeard(l, existing, audioText);
  });
  return usable.length ? usable[Math.floor(Math.random() * usable.length)] : null;
}

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
    play: (payload) => {
      const i = Number(payload);
      const gender = primerGender(topic, i);
      if (gender) speakDialogue([{ text: topic.primer[i].en, gender }]);
      else speak(topic.primer[i].en);
    },
    advance: () => onNext(),
  });
}

/**
 * 💡 Petunjuk (eliminasi 2 opsi salah) utk `runTantangan` FORMAT LAMA
 * SAJA ("🌟 Dengar Cerita Mini", `ListeningOption[]` — cuma py `.ok`,
 * beda dari `ListeningQuestionOption` yg format baru pakai) — TIDAK
 * dipakai lagi di `runLatihanInti` (Latihan Inti format lama SEKARANG
 * gabung teks+eliminasi dalam 1 handler `hint`, lihat komentar di sana),
 * cuma tersisa di `runTantangan` yg tidak disentuh sesi itu.
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
 *
 * 🔒 Revisi lanjutan (permintaan user "tambahkan petunjuk berupa text en
 * dan id... berlaku semua level") — format LAMA (Explorer/Adventurer) dulu
 * TIDAK PERNAH py cara menampilkan teks/terjemahan kalimat drill sama
 * sekali. Butuh `ListeningDrill.id`/`ListeningTopic.question.id` BARU
 * (types.ts, diauthoring manual utk semua topik existing Explorer+
 * Adventurer).
 *
 * 🔒 Revisi lanjutan LAGI (permintaan user: "remove 'tampilkan text' jadi
 * ketika klik 'petunjuk' maka 1. menampilkan text inggris dan indonesia
 * 2. eliminasi 2 jawaban salah") — "📖 Tampilkan Teks" & 💡 Petunjuk
 * (eliminasi) yg SEBELUMNYA 2 tombol terpisah SEKARANG DIGABUNG jadi SATU
 * tombol "💡 Petunjuk" (`hintButtonHtml`) — sekali tap langsung ungkap
 * teks EN+ID SEKALIGUS **DAN** eliminasi 2 opsi salah. `eliminated`
 * (indeks opsi yg dieliminasi) DIHITUNG sekali saat tap & DISIMPAN
 * (bukan lagi dihitung ulang tiap render kayak `wireOldFormatHint` lama)
 * supaya tetap konsisten kalau di-redraw (mis. "Coba Lagi") — direset di
 * `draw()` (soal BARU), TAPI TIDAK di `redraw()` (retry soal SAMA),
 * SAMA PERSIS pola `revealed`. `wireOldFormatHint` (versi lama, tanpa
 * reveal) TIDAK dipakai lagi di sini — TETAP dipakai apa adanya di
 * `runTantangan` (format lama, di atas) yg tidak disentuh sesi ini.
 */
/** `topic.drill` seringkali cuma 1–2 kalimat (jauh dari target ≥10 soal
 *  CLAUDE.md) — di-cycle via `shuffle()` sampai `LISTENING_OLD_ROUND_SIZE`,
 *  pola SAMA PERSIS `pickDrillForCount` (`games/reading.ts`). */
const LISTENING_OLD_ROUND_SIZE = 10;
function pickOldDrillForCount(items: ListeningDrill[], count: number): ListeningDrill[] {
  let pool: ListeningDrill[] = [];
  while (pool.length < count) pool = pool.concat(shuffle(items));
  return pool.slice(0, count);
}

/**
 * 🔒 Redesain (permintaan user, audit "format dot" — quiz-dot Vocab/
 * Listening Little Stars belum konsisten di semua level/skill): dulu
 * sequential polos tanpa persist (reload = balik ke soal 1) & `topic.drill`
 * cuma 1–2 kalimat (jauh dari target ≥10). Sekarang: persist per-soal
 * (`ensureSection`/`getSlot`/`markSlotAnswered`/`setSectionCursor`),
 * quiz-dot bisa diklik bebas (`quizNavHtml`/`wireQuizNav`), `topic.drill`
 * di-cycle ke `LISTENING_OLD_ROUND_SIZE` (`pickOldDrillForCount`, pola
 * `pickDrillForCount` Reading). `level` param BARU (dulu tidak ada —
 * feedback hardcode 1 bahasa "Tepat! 🎉", sekarang `pickPraise`/
 * `pickEncourage` spt skill lain, `app.ts` diupdate). Hint (eliminate 2 +
 * reveal en/id) & tombol manual TIDAK diubah, sudah ada dari sesi
 * sebelumnya — cuma dibungkus persist+quiz-dot+cycling. `runTantangan` di
 * bawah SENGAJA TIDAK disentuh: itu genuinely 1 ronde per topik (1 cerita+
 * 1 pertanyaan, `topic.story`/`topic.question` bukan array) — tidak ada
 * "ronde lain" utk quiz-dot dilompati, beda dari `drill` di sini yang
 * array (walau pendek) sehingga BISA di-cycle.
 */
export function runLatihanInti(container: HTMLElement, topic: ListeningTopic, onDone: OnDone, level: LevelKey): void {
  const buildPlan = (): LatihanPlanSlot[] =>
    pickOldDrillForCount(topic.drill, LISTENING_OLD_ROUND_SIZE).map((d) => ({ kind: 'hear', item: topic.drill.indexOf(d) }));
  let section = ensureSection('listening', topic.id, 'latihan', buildPlan);
  if ((section.plan ?? []).length !== LISTENING_OLD_ROUND_SIZE) {
    resetSectionPlan('listening', topic.id, 'latihan', buildPlan());
    section = ensureSection('listening', topic.id, 'latihan');
  }
  const order: ListeningDrill[] = (section.plan ?? []).map((slot) => topic.drill[slot.item] ?? topic.drill[0]);
  let round = Math.min(Math.max(section.cursor, 0), order.length - 1);
  let revealed = false;
  let eliminated: number[] = [];
  // Opsi drill diauthoring dgn jawaban benar di indeks 0 — WAJIB diacak, kalau
  // tidak anak bisa selalu tap kartu pertama. Diacak sekali per soal (`draw`),
  // TIDAK diacak ulang di `redraw` (Coba Lagi/Petunjuk) supaya posisi stabil.
  let opts: ListeningOption[] = [];

  const slotStatus = (i: number): 0 | 1 | 2 => getSlot('listening', topic.id, 'latihan', i)?.st ?? 0;

  function goTo(i: number): void {
    round = Math.min(Math.max(i, 0), order.length - 1);
    setSectionCursor('listening', topic.id, 'latihan', round);
    draw();
  }

  function draw(): void {
    if (round >= order.length) return onDone();
    revealed = false;
    eliminated = [];
    opts = shuffle(order[round].opts);
    redraw();
  }

  function redraw(): void {
    const d = order[round];
    const play = () => speak(d.en);
    container.innerHTML = `
      <div class="latihan-head">
        <span class="stage-badge">🎯 Dengar &amp; Pilih</span>
        ${hintButtonHtml(revealed)}
      </div>
      ${quizNavHtml(round, order.length, slotStatus)}
      <div class="id-text">Soal ${round + 1} dari ${order.length}</div>
      <div class="speak-row">
        <button class="speak-btn" data-action="replay">🔊 Putar Kalimat</button>
      </div>
      ${revealed ? `<div class="en-text">${d.en}</div><div class="id-text">${d.id}</div>` : ''}
      <div class="opt-grid ${opts.length > 2 ? 'three' : ''}">
        ${opts
          .map(
            (o, i) =>
              `<button class="opt-btn ${eliminated.includes(i) ? 'eliminated' : ''}" type="button" data-action="pick" data-payload="${i}" ${eliminated.includes(i) ? 'disabled' : ''}>${o.emoji}</button>`
          )
          .join('')}
      </div>
      <div class="feedback" id="fb"></div>
    `;
    play();
    wireQuizNav(goTo);

    setHandlers({
      replay: play,
      hint: () => {
        if (revealed) return;
        revealed = true;
        speak(d.en);
        const wrongIdx = opts.map((_, i) => i).filter((i) => !opts[i].ok);
        eliminated = shuffle(wrongIdx).slice(0, Math.min(2, wrongIdx.length));
        redraw();
      },
      pick: (payload) => {
        const i = Number(payload);
        const btn = container.querySelectorAll<HTMLElement>('.opt-btn')[i];
        const fb = container.querySelector<HTMLElement>('#fb')!;
        const correct = !!opts[i].ok;
        lockOptionButtons(container);
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
        markSlotAnswered('listening', topic.id, 'latihan', round, correct, { itemRef: d.en });
        recordEvent({
          kind: 'answer',
          skill: 'listening',
          topicId: topic.id,
          section: 'latihan',
          slot: round,
          itemRef: d.en,
          activity: 'old-drill',
          correct,
        });
        fb.insertAdjacentHTML('afterend', roundActionsHtml(allSlotsDone(order.length, slotStatus)));
        setHandlers({
          tryAgainRound: () => redraw(),
          nextRound: () => {
            round = nextUnfinishedRound(round, order.length, slotStatus);
            setSectionCursor('listening', topic.id, 'latihan', Math.min(round, order.length - 1));
            draw();
          },
        });
      },
    });
  }

  draw();
}

export function runTantangan(container: HTMLElement, topic: ListeningTopic, onDone: OnDone): void {
  // Opsi = opsi authored + 1 jebakan acak (`question.decoys`, tidak disebut di
  // audio), diacak sekali per sesi — jawaban benar authored di indeks 0, jadi
  // WAJIB diacak; "Coba Lagi" memakai susunan yang sama.
  const decoy = pickDecoy(
    topic.question.decoys ?? [],
    (d) => d.lbl ?? '',
    topic.question.opts.map((o) => o.lbl ?? ''),
    topic.story.join(' ')
  );
  const opts: ListeningOption[] = shuffle(decoy ? [...topic.question.opts, { ...decoy, ok: false }] : [...topic.question.opts]);

  function draw(): void {
    const playStory = () => {
      const voices = topic.storyVoices;
      if (voices && voices.length === topic.story.length) {
        speakDialogue(
          topic.story.map((text, i) => ({ text, gender: voices[i] })),
          1900
        );
      } else {
        speakSequence(topic.story, 1900);
      }
    };
    container.innerHTML = `
      <div class="latihan-head">
        <span class="stage-badge">🌟 Dengar Cerita Mini</span>
        ${hintButtonHtml(false)}
      </div>
      <div class="big-emoji">${topic.scene}</div>
      <div class="speak-row"><button class="speak-btn" data-action="playStory">▶️ Putar Ceritanya</button></div>
      <div class="en-text" style="margin-top:10px;">${topic.question.en}</div>
      ${answerCardsHtml(
        opts.map((o) => ({ emoji: o.emoji, label: o.lbl ?? '' })),
        'answer'
      )}
      <div class="feedback" id="fb"></div>
    `;
    playStory();
    wireOldFormatHint(container, opts);

    setHandlers({
      playStory,
      answer: (payload) => {
        const i = Number(payload);
        const btn = container.querySelectorAll<HTMLElement>('.opt-btn')[i];
        const fb = container.querySelector<HTMLElement>('#fb')!;
        const correct = !!opts[i].ok;
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
          playWrongTone();
          vibrateDevice(160);
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

/**
 * "Selesai ✅" di `roundActionsHtml` HANYA boleh muncul kalau SEMUA soal di
 * section ini sudah dikerjakan — bukan cuma soal yang SEDANG dijawab
 * kebetulan berada di posisi TERAKHIR (permintaan user, bug: quiz-dot boleh
 * dilompat bebas ke soal mana pun, jadi anak yang lompat langsung ke soal
 * terakhir & menjawabnya BISA dapat "Selesai" walau soal 1–9 belum pernah
 * disentuh). Cek lewat `statusOf` yang SAMA dgn yang dikirim ke
 * `quizNavHtml` (st===2 tiap slot), BUKAN posisi `round === total - 1` lagi
 * — berlaku di SEMUA skill (Vocab/Listening/Reading/Grammar/Speaking) yang
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

/**
 * 🔒 Revisi user: "ketika jawabannya warna maka mudah mencari icon nya,
 * maka ketika mudah tambahkan icon, ini berlaku untuk yang lain juga" —
 * `LEAKY_EMOJI_WORDS`/`isLeakyEmojiWord`/`correctOptionIsLeaky` (port dari
 * `games/vocabulary.ts`'s `isColorTopic`/`isNumberTopic`/dst, sesi
 * `games/boss.ts` audit — strip SEMUA ikon kalau jawaban benarnya kata
 * warna/angka/bentuk/hari) DIHAPUS TOTAL dari file ini, BUKAN dipertahankan
 * dormant. User dikonfirmasi eksplisit (ditanya dulu krn ini kontradiksi
 * langsung dgn "Aturan Wajib: Soal Tidak Boleh Ditebak" CLAUDE.md) — utk
 * Listening SPESIFIK, swatch warna/dst diterima krn prompt soalnya AUDIO
 * (tidak ada gambar warna/bentuk di soal utk dicocokkan langsung spt di
 * Vocab's matching-game), jadi risiko "tebak-lewat-cocok-ikon" jauh lebih
 * kecil drpd konteks Vocab yang jadi asal rule ini. `answerCardsHtml`
 * SEKARANG dipanggil dgn `o.emoji` APA ADANYA lagi di SEMUA titik file ini
 * (Kenalan Main, Latihan Inti 2 jenis soal, Tantangan Dialogue+Inferensi,
 * `runTantangan` format lama) — TIDAK ada lagi conditional `leaky ? '' :`.
 * Aturan Vocab (`games/vocabulary.ts`) TIDAK berubah — scope revisi ini
 * CUMA `games/listening.ts`.
 */

/** 🔒 Lencana huruf A/B/C/D DIHAPUS TOTAL (permintaan user "hilangkan
 *  A,B,C,D") — gambar+label sudah cukup jelas. */
function answerCardsHtml(options: { emoji: string; label: string }[], action: string): string {
  return `<div class="opt-grid">
    ${options
      .map(
        (o, i) => `
      <button class="opt-btn answer-card" type="button" data-action="${action}" data-payload="${i}">
        ${o.emoji ? `<span class="answer-card-emoji" aria-hidden="true">${o.emoji}</span>` : ''}
        <span class="answer-card-bottom">
          <span class="answer-card-label">${o.label}</span>
        </span>
      </button>`
      )
      .join('')}
  </div>`;
}

/** `disabled` eksplisit di template (bukan cuma dimatiin manual via DOM
 *  sesudah render) — dibutuhkan sejak Latihan Inti Petunjuk digabung jadi
 *  1 aksi (teks+eliminasi, lihat komentar `textClueButtonHtml` di bawah)
 *  yang state-nya WAJIB persis lewat `redraw()`. Titik yang TIDAK butuh
 *  persist (`runTantangan` format lama, elimination-only tanpa reveal
 *  state) cukup panggil `hintButtonHtml(false)`. */
function hintButtonHtml(disabled: boolean): string {
  return `<button class="ghost-btn hint-chip pt-cta" type="button" id="hintBtn" data-action="hint" ${disabled ? 'disabled' : ''}>💡 Petunjuk</button>`;
}

/**
 * 🔒 Revisi user LANJUTAN: "remove 'tampilkan text' jadi ketika klik
 * 'petunjuk' maka 1. menampilkan text inggris dan indonesia 2. eliminasi
 * 2 jawaban salah" — tombol teks terpisah ("📖 Tampilkan Teks", sempat ada
 * di sini) DIHAPUS TOTAL, DIGABUNG ke `hintButtonHtml` ("💡 Petunjuk") di
 * SEMUA titik Latihan Inti (format lama `runLatihanInti` & format baru
 * `drawAskQuestion`/`drawTrueFalse`) — sekali tap SEKARANG ungkap teks
 * EN+ID **DAN** eliminasi 2 opsi salah (kalau ada opsi yang bisa
 * dieliminasi — `drawTrueFalse` biner, cuma reveal teks, TIDAK ada yang
 * dieliminasi). Lihat komentar `hintButtonHtml` & `applyElimination` di
 * atas utk detail state persist-nya.
 */

/**
 * Petunjuk SEDERHANA "💡 Petunjuk" (permintaan user, revisi khusus utk
 * Kenalan "Main" & Tantangan: "simplify jadi button petunjuk jadi
 * tampilkan text dan tampilkan terjemahan... ketika diklik maka muncul
 * text serta terjemahannya... dimana petunjuk langsung ada di depan tidak
 * perlu nunggu sekali coba dulu") — SATU tombol, TERSEDIA SEJAK AWAL
 * (tanpa gating), sekali tap langsung ungkap teks Inggris + terjemahan
 * Indonesia SEKALIGUS. Dipakai `runItemMiniGame` (Kenalan, non-Little
 * Stars — Little Stars py hint eliminasi SENDIRI, lihat `hintButtonHtml`
 * di `paint()`-nya) & `runSusunKalimatSentence`/`drawSusun`/
 * `runTantanganNote`/`runTantanganDialogue` (Tantangan).
 *
 * Posisi & ukuran — 2 VARIAN, dipilih via param `compact`:
 * - `compact=false` (default, Kenalan Main) — DI DALAM `.speak-row` yang
 *   sama dgn "🔊 Dengar" (sebelah kanannya), pakai class `.speak-btn-ghost`
 *   (styles.css) — SAMA UKURAN (padding/font-size/border-radius pill) dgn
 *   `.speak-btn`, cuma beda warna (ghost/outline, bukan solid) biar tetap
 *   kebeda sbg aksi sekunder.
 * - `compact=true` (permintaan user lanjutan: "pindahkan button petunjuk
 *   di kanan atas di atas bullet progress sama seperti yang sudah
 *   dilakukan di section latihan inti") — dipindah ke HEADER (`.latihan-
 *   head`, sejajar `.stage-badge`, DI ATAS `quizNavHtml`), pakai class
 *   `.ghost-btn.hint-chip` — SAMA PERSIS `hintButtonHtml` Latihan Inti,
 *   krn sekarang posisinya jg identik (kanan atas, atas bullet progress).
 *   Dipakai 3 fungsi Tantangan di atas (SEMUA py bullet progress).
 */
function petunjukButtonHtml(revealed: boolean, compact = false): string {
  const cls = compact ? 'ghost-btn hint-chip pt-cta' : 'speak-btn-ghost pt-cta';
  return `<button class="${cls}" type="button" data-action="petunjuk" ${revealed ? 'disabled' : ''}>💡 Petunjuk</button>`;
}

/** Kenalan — 1 baris per kalimat: 🔊 dengar, 🎤 ucap ulang (skor proporsional
 *  + Play Suaramu, Aturan Wajib Speaking CLAUDE.md), 🎮 main (1 soal
 *  komprehensi fokus kalimat itu, balik ke daftar sesudahnya).
 *
 * 🔒 `level` (=`praiseLevel`, badge ASLI anak) vs `contentLevel` (topik yang
 * SEDANG ditampilkan) SENGAJA 2 parameter beda (pola sama `runStage`
 * `app.ts` — lihat komentarnya) — bug yang sempat kejadian: `runItemMiniGame`
 * pakai `level` buat cek "ini Little Stars atau bukan", jadi behavior
 * bullet-dot/tanpa-Petunjuk cuma nyala kalau BADGE anak literally Little
 * Stars, BUKAN pas topik Little Stars yang ditampilkan (mis. anak level
 * lain jelajah/fallback ke topik Little Stars). WAJIB pakai `contentLevel`
 * utk itu, `level` TETAP cuma buat bahasa pujian (`pickPraise`/
 * `pickEncourage`) — jangan gabung lagi. */
export function renderKenalanSentence(
  container: HTMLElement,
  topic: ListeningItemsTopic,
  level: LevelKey,
  contentLevel: LevelKey
): void {
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
            <div class="primer-ic">${it.emoji}</div>
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
        runItemMiniGame(container, topic, i, drawList, level, contentLevel);
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
 * "Dengar & Jawab").
 *
 * 🔒 Revisi user lanjutan, KHUSUS Little Stars ("tidak perlu button
 * petunjuk tapi langsung tampilkan tekstnya saja... tambahkan bullet
 * progress dan bedakan warna untuk yang sedang dibuka") — level ini
 * TIDAK PAKAI Petunjuk sama sekali (`revealed` dikunci `true` terus,
 * teks kalimat+pertanyaan SELALU tampil dari awal, anak paling kecil
 * butuh scaffold lebih drpd audio-only) DAN dapat navigasi bullet-dot
 * (`quizNavHtml`/`wireQuizNav`, pola sama Latihan Inti) lintas SEMUA
 * kalimat topik via `goTo` — dot "sedang dibuka" beda warna (`.current`,
 * CSS sudah ada), dot yang sudah pernah dimainkan ditandai `.done`
 * (`hasWordInteraction` action 'game'). "Lanjut ➡️" jadi advance ke
 * kalimat berikutnya (bukan balik ke daftar lagi tiap soal — biar bullet
 * progress-nya genuinely berarti), "Selesai ✅" di kalimat terakhir baru
 * balik ke daftar Kenalan.
 *
 * Level LAIN (Starter/Explorer/dst) TETAP pola lama: 1 kalimat casual per
 * tap 🎮, balik ke daftar sesudahnya (BUKAN bagian urutan quiz-dot), teks
 * default TERSEMBUNYI — cuma kelihatan lewat "💡 Petunjuk" SATU tombol
 * (`petunjukButtonHtml()`, TERSEDIA SEJAK AWAL, tanpa gating attempt).
 *
 * 🔒 Audio Petunjuk SEKARANG Inggris SAJA di KEDUA jalur (permintaan user
 * "cukup audio bahasa inggris nya saja tidak perlu audio bahasa
 * indonesia") — `speak()` polos, BUKAN `speakBilingual()` lagi. Teks
 * Indonesia TETAP tampil visual (tidak dihapus, cuma audionya).
 */
function runItemMiniGame(
  container: HTMLElement,
  topic: ListeningItemsTopic,
  startIndex: number,
  onBack: OnDone,
  level: LevelKey,
  contentLevel: LevelKey
): void {
  const isLittleStars = contentLevel === 'little-stars';
  let current = startIndex;
  let opts = shuffle(topic.items[current].question.options);
  let revealed = isLittleStars;
  let answered = false;
  // 💡 Petunjuk eliminasi-SAJA, KHUSUS Little Stars (permintaan user:
  // "pada kenalan main, tambahkan petunjuk di kanan atas di atas bullet
  // progress sama seperti yang sudah dilakukan di section latihan inti,
  // ketika di klik maka eliminasi 2 jawaban salah") — teks EN+ID di sini
  // SUDAH selalu tampil dari awal (`revealed` dikunci `true`), jadi
  // Petunjuk TIDAK perlu ungkap apa-apa lagi, cuma eliminasi. Level lain
  // TETAP pakai `petunjukButtonHtml`/`revealed` di speak-row (tidak
  // disentuh). Direset di `goTo()` (soal BARU), TAPI TIDAK di
  // `tryAgainRound` (non-punitive, sama pola `eliminated`/
  // `eliminatedThisSlot` di Latihan Inti).
  let eliminated: number[] = [];

  const kenalanStatus = (i: number): 0 | 1 | 2 => getSlot('listening', topic.id, 'kenalan', i)?.st ?? 0;

  const playPrompt = () => {
    const item = topic.items[current];
    speakSequence([item.example.en, item.question.en]);
  };

  // 🔒 Dot bullet-progress cuma boleh "done" begitu soal itu BENERAN dijawab
  // (permintaan user), bukan pas anak loncat/tap dot ke soal itu — pakai
  // slot section 'kenalan' (section YANG SAMA dgn tap 🔊/🎤/🎮 di daftar,
  // TAPI `st` dinaikkan ke 2 lewat `markSlotAnswered` di `onAnswer`, BUKAN
  // `markSlotInteraction`/tap yang cuma naikkan ke `st:1`) — section ini
  // sudah dikecualikan dari persentase topik & insight Rapor
  // (`isGradedSection` progress.ts, `=== 'kenalan'`), aman tanpa field/
  // migrasi baru. Ikon 🎮 di DAFTAR Kenalan (`doneCls`, `drawList` di atas)
  // TETAP pakai `hasWordInteraction` yang ditandai saat tap 🎮 di daftar
  // (sebelum fungsi ini dipanggil) — dua penanda ini SENGAJA independen.
  function markAnswered(i: number, correct: boolean, itemRef: string): void {
    markSlotAnswered('listening', topic.id, 'kenalan', i, correct, { itemRef });
  }

  function paint(): void {
    const item = topic.items[current];
    container.innerHTML = `
      <div class="latihan-head">
        <span class="stage-badge">🎮 Main · Dengar &amp; Jawab</span>
        ${isLittleStars ? hintButtonHtml(eliminated.length > 0) : ''}
      </div>
      ${
        isLittleStars
          ? quizNavHtml(current, topic.items.length, kenalanStatus)
          : ''
      }
      <div class="speak-row">
        <button class="speak-btn pt-cta" type="button" data-action="replay">🔊 Dengar</button>
        ${!isLittleStars && !answered ? petunjukButtonHtml(revealed) : ''}
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
    if (isLittleStars) wireQuizNav(goTo);
    applyElimination(container, eliminated);
    setHandlers({
      replay: playPrompt,
      petunjuk: () => {
        if (revealed || answered) return;
        revealed = true;
        speak(`${item.example.en} ${item.question.en}`);
        paint();
      },
      hint: () => {
        if (eliminated.length) return;
        const wrongIdx = opts.map((_, i) => i).filter((i) => !opts[i].ok);
        eliminated = shuffle(wrongIdx).slice(0, Math.min(2, wrongIdx.length));
        paint();
      },
      pick: (payload) => {
        if (answered) return;
        const i = Number(payload);
        onAnswer(opts[i].ok, i);
      },
    });
  }

  function goTo(i: number): void {
    current = i;
    opts = shuffle(topic.items[current].question.options);
    answered = false;
    eliminated = [];
    playPrompt();
    paint();
  }

  function onAnswer(correct: boolean, i: number): void {
    const item = topic.items[current];
    answered = true;
    markAnswered(current, correct, item.example.en);
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
      playWrongTone();
      vibrateDevice(160);
      fb.textContent = pickEncourage(level);
      fb.className = 'feedback bad';
    }
    recordEvent({ kind: 'answer', skill: 'listening', topicId: topic.id, itemRef: item.example.en, activity: 'sentence-mini', correct });
    const isLast = !isLittleStars || allSlotsDone(topic.items.length, kenalanStatus);
    fb.insertAdjacentHTML('afterend', roundActionsHtml(isLast));
    setHandlers({
      tryAgainRound: () => {
        answered = false;
        paint();
      },
      nextRound: () => {
        const next = isLittleStars ? nextUnfinishedRound(current, topic.items.length, kenalanStatus) : topic.items.length;
        if (next < topic.items.length) goTo(next);
        else onBack();
      },
    });
  }

  playPrompt();
  paint();
}

/** Terapkan eliminasi yang SUDAH dihitung/disimpan (`indices`) ke tombol
 *  `.opt-btn` yang BARU dirender — dipakai bareng state `eliminated`/
 *  `eliminatedThisSlot` yang persist lintas `redraw()`/`paint()` (indeks
 *  dihitung SEKALI saat tap "💡 Petunjuk", lalu diterapkan ulang di
 *  SETIAP render soal itu selama belum pindah ke soal lain — non-punitive,
 *  sama pola `revealed`). */
function applyElimination(container: HTMLElement, indices: number[]): void {
  if (!indices.length) return;
  const btns = container.querySelectorAll<HTMLButtonElement>('.opt-btn');
  indices.forEach((i) => {
    if (btns[i]) {
      btns[i].disabled = true;
      btns[i].classList.add('eliminated');
    }
  });
}

/** Ambil `count` item dari `items`, SEMUA item muncul dulu sebelum ada yang
 *  berulang — sama pola dgn `games/vocabulary.ts` `pickItemsForCount`. */
function pickItemsForCount(items: ListeningSentenceItem[], count: number): ListeningSentenceItem[] {
  let pool: ListeningSentenceItem[] = [];
  while (pool.length < count) pool = pool.concat(shuffle(items));
  return pool.slice(0, count);
}

/** Jarak edit (Levenshtein) antara 2 string, case-insensitive — dipakai
 *  `pickDecoyWords` buat ranking "seberapa mirip" 2 kata, BUKAN cek
 *  identik (itu sudah difilter terpisah lewat exact-match lowercase). */
function editDistance(a: string, b: string): number {
  const al = a.length;
  const bl = b.length;
  const dp: number[][] = Array.from({ length: al + 1 }, () => new Array(bl + 1).fill(0));
  for (let i = 0; i <= al; i++) dp[i][0] = i;
  for (let j = 0; j <= bl; j++) dp[0][j] = j;
  for (let i = 1; i <= al; i++) {
    for (let j = 1; j <= bl; j++) {
      dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[al][bl];
}

/**
 * Ambil `count` kata "jebakan" (permintaan user: "tambahkan 2 kata sebagai
 * jebakan"). Kata diambil dari kalimat item LAIN di topik yang SAMA (bukan
 * dikarang bebas — biar tetap sewarna/masuk akal dgn tema topiknya),
 * difilter TIDAK boleh ada di kalimat target (`excludeWords`, case-
 * insensitive — kalau ikut masuk, chip jebakan akan identik dgn chip asli)
 * & dideduplikasi antar-sesama jebakan.
 *
 * 🔒 Revisi user: "cari kata yang mirip sehingga semakin menjebak" — dari
 * versi awal (`shuffle().slice()`, ACAK polos) jadi DIURUTKAN pakai
 * `editDistance` ke kata target TERDEKAT (bukan diacak lagi) — kandidat
 * yang secara EJAAN paling mirip salah satu kata target (mis. "read" vs
 * "red", "was" vs "has") diprioritaskan duluan, supaya chip jebakan
 * genuinely menggoda (anak yang tidak dengar teliti bisa salah pilih),
 * bukan cuma kata acak yang jelas beda.
 */
function pickDecoyWords(pool: ListeningSentenceItem[], current: ListeningSentenceItem, excludeWords: string[], count: number): string[] {
  const excludeLower = new Set(excludeWords.map((w) => w.toLowerCase()));
  const candidates = pool
    .filter((it) => it !== current)
    .flatMap((it) => it.example.en.replace('.', '').split(' '))
    .filter((w) => !excludeLower.has(w.toLowerCase()));
  const unique = [...new Map(candidates.map((w) => [w.toLowerCase(), w])).values()];
  const ranked = unique
    .map((w) => ({ w, dist: Math.min(...excludeWords.map((t) => editDistance(w.toLowerCase(), t.toLowerCase()))) }))
    .sort((a, b) => a.dist - b.dist);
  return ranked.slice(0, count).map((r) => r.w);
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

export function runLatihanIntiSentence(
  container: HTMLElement,
  topic: ListeningItemsTopic,
  onDone: OnDone,
  level: LevelKey,
  contentLevel: LevelKey
): void {
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
  // "💡 Petunjuk" gabungan (permintaan user: "ketika klik petunjuk maka 1.
  // menampilkan text inggris dan indonesia 2. eliminasi 2 jawaban salah")
  // — state per SOAL, direset di `draw()` (soal BARU), TAPI TIDAK direset
  // di `redraw()` (redraw soal yang SAMA, dipakai "Coba Lagi") — kalau
  // ikut direset di situ, hint yang baru saja "diperoleh" bakal terkunci
  // lagi begitu diulang. `eliminatedThisSlot` (indeks opsi tereliminasi,
  // KOSONG utk `drawTrueFalse` krn biner — eliminasi tidak relevan)
  // DIHITUNG sekali saat tap, bukan dihitung ulang tiap render, supaya
  // tetap konsisten lintas redraw. `optsCache` (dipakai `drawAskQuestion`
  // saja) MENGUNCI urutan shuffle opsi per SOAL — tanpa ini, tiap
  // `redraw()` (termasuk yang dipicu tap Petunjuk sendiri) bakal
  // nge-shuffle ULANG opsinya, bikin indeks `eliminatedThisSlot` nyasar ke
  // opsi yang salah setelah redraw.
  //
  // 🔒 BUG DITEMUKAN (permintaan user: "no 6 dan 10, ketika di klik
  // petunjuk, icon dan text pertanyaan nya berubah") — `drawTrueFalse`
  // (kind 'toId') dulu MEMILIH `claim` (klaim Benar/Salah yang ditampilkan
  // — icon+teks pertanyaannya) via `Math.random()` LANGSUNG di badan
  // fungsi, BUKAN dicache spt `optsCache` di atas — jadi tiap `redraw()`
  // (dipicu tap "💡 Petunjuk" ATAU "🔁 Coba Lagi") nge-roll ULANG klaim
  // BARU, icon/teks yang tadi kelihatan berubah jadi klaim lain padahal
  // masih soal yang sama. `claimCache` di bawah MENGUNCI klaim per SOAL,
  // pola SAMA PERSIS `optsCache` — reset di `draw()`, TIDAK di `redraw()`.
  let revealedThisSlot = false;
  let eliminatedThisSlot: number[] = [];
  let optsCache: ListeningQuestionOption[] | null = null;
  let claimCache: ListeningQuestionOption | null = null;

  const slotStatus = (i: number): 0 | 1 | 2 => getSlot('listening', topic.id, 'latihan', i)?.st ?? 0;

  function goTo(i: number): void {
    round = Math.min(Math.max(i, 0), order.length - 1);
    setSectionCursor('listening', topic.id, 'latihan', round);
    draw();
  }

  function draw(): void {
    if (round >= order.length) return onDone();
    hintUsedThisSlot = false;
    revealedThisSlot = false;
    eliminatedThisSlot = [];
    optsCache = null;
    claimCache = null;
    redraw();
  }

  function redraw(): void {
    const slot = order[round];
    if (slot.kind === 'toId') drawTrueFalse(slot.item);
    else drawAskQuestion(slot.item);
  }

  function onAnswer(correct: boolean, btn: HTMLElement, item: ListeningSentenceItem, activity: string): void {
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
      // Permintaan user: munculkan teks Inggris+Indonesia begitu jawaban
      // BENAR (independen dari "💡 Petunjuk" pra-jawab) — skip kalau Petunjuk
      // sudah dipakai (teks yg sama sudah tampil di atas, jangan duplikat).
      // Teks Inggris dikecilkan sedikit drpd `.en-text` default (clamp
      // 1.25–1.625rem) — permintaan user "kecilkan sedikit".
      if (!revealedThisSlot) {
        const line = item.practice ?? item.example;
        const en = activity === 'hear' ? `${line.en} ${item.question.en}` : line.en;
        const id = activity === 'hear' ? `${line.id} ${item.question.id}` : line.id;
        fb.insertAdjacentHTML(
          'beforebegin',
          `<div class="en-text" style="font-size:1.05rem">${en}</div><div class="id-text">${id}</div>`
        );
      }
    } else {
      recordAttempt(false);
      btn.classList.add('wrong');
      playWrongTone();
      vibrateDevice(160);
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
    fb.insertAdjacentHTML('afterend', roundActionsHtml(allSlotsDone(order.length, slotStatus)));
    setHandlers({
      tryAgainRound: () => redraw(),
      nextRound: () => {
        round = nextUnfinishedRound(round, order.length, slotStatus);
        setSectionCursor('listening', topic.id, 'latihan', Math.min(round, order.length - 1));
        draw();
      },
    });
  }

  function drawAskQuestion(item: ListeningSentenceItem): void {
    if (!optsCache) optsCache = shuffle(item.question.options);
    const opts = optsCache;
    const line = item.practice ?? item.example;
    const playPrompt = () => speakSequence([line.en, item.question.en], listeningGapMs(contentLevel));

    container.innerHTML = `
      <div class="latihan-head">
        <span class="stage-badge">🎧 Dengar &amp; Jawab</span>
        ${hintButtonHtml(revealedThisSlot)}
      </div>
      ${quizNavHtml(round, order.length, slotStatus)}
      <div class="id-text">Soal ${round + 1} dari ${order.length}</div>
      <div class="speak-row">
        <button class="speak-btn pt-cta" data-action="replay">🔊 Dengar</button>
      </div>
      ${
        revealedThisSlot
          ? `<div class="en-text">${line.en} ${item.question.en}</div><div class="id-text">${line.id} ${item.question.id}</div>`
          : ''
      }
      ${answerCardsHtml(
        opts.map((o) => ({ emoji: o.emoji, label: o.text })),
        'pick'
      )}
      <div class="feedback" id="fb"></div>
    `;
    playPrompt();
    applyElimination(container, eliminatedThisSlot);
    wireQuizNav(goTo);

    setHandlers({
      replay: playPrompt,
      hint: () => {
        if (revealedThisSlot) return;
        revealedThisSlot = true;
        hintUsedThisSlot = true;
        speak(`${line.en} ${item.question.en}`);
        if (hintEliminatesOptions(contentLevel)) {
          const wrongIdx = opts.map((_, i) => i).filter((i) => !opts[i].ok);
          eliminatedThisSlot = shuffle(wrongIdx).slice(0, Math.min(2, wrongIdx.length));
        }
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
    if (!claimCache) claimCache = item.question.options[Math.floor(Math.random() * item.question.options.length)];
    const claim = claimCache;
    const line = item.practice ?? item.example;
    const playPrompt = () => speak(line.en);

    container.innerHTML = `
      <div class="latihan-head">
        <span class="stage-badge">🤔 Benar atau Salah?</span>
        ${hintButtonHtml(revealedThisSlot)}
      </div>
      ${quizNavHtml(round, order.length, slotStatus)}
      <div class="id-text">Soal ${round + 1} dari ${order.length}</div>
      <div class="speak-row">
        <button class="speak-btn pt-cta" data-action="replay">🔊 Dengar</button>
      </div>
      ${revealedThisSlot ? `<div class="en-text">${line.en}</div><div class="id-text">${line.id}</div>` : ''}
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
      hint: () => {
        if (revealedThisSlot) return;
        revealedThisSlot = true;
        speak(line.en);
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
export function runTantanganSentence(
  container: HTMLElement,
  topic: ListeningSentenceTopic,
  onDone: OnDone,
  level: LevelKey,
  contentLevel: LevelKey
): void {
  runSusunKalimatSentence(container, topic.id, topic.items, onDone, level, contentLevel);
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
  level: LevelKey,
  contentLevel: LevelKey
): void {
  // 🔒 Revisi user: "jebakan 2 kata berlaku untuk level di atas starter...
  // untuk level little star dan starter tidak ada kata random sebagai
  // tambahan" — `contentLevel` (topik yang SEDANG ditampilkan, BUKAN
  // `level`/praiseLevel badge anak — pola sama bug yg sudah pernah
  // ditemukan & diperbaiki di `runItemMiniGame`) yang nentuin gate ini.
  // Catatan penting: SAAT INI cuma Little Stars & Starter yang benar²
  // pakai `runSusunKalimatSentence` (Explorer/Adventurer format lama beda
  // total, Achiever/Trailblazer format Note/Dialogue tanpa word bank) —
  // jadi praktiknya `applyDecoys` di bawah SELALU `false` utk konten yang
  // ada SEKARANG, TAPI kode ini tetap ditulis level-aware (bukan
  // dihapus/dihardcode) supaya begitu ADA level baru di atas Starter yang
  // pakai format ini nanti, jebakan otomatis aktif tanpa perlu disentuh
  // lagi.
  const applyDecoys = contentLevel !== 'little-stars' && contentLevel !== 'starter';
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
    // 2 kata "jebakan" (permintaan user, lihat `pickDecoyWords`) — DIHITUNG
    // SEKALI per soal (bukan tiap `paint()`/reset), supaya tetap konsisten
    // lintas "🔄 Bersihkan"/"Coba Lagi" (posisinya di bank boleh acak ulang,
    // TAPI kata jebakannya sendiri jangan ganti-ganti).
    const bankWords = applyDecoys ? [...words, ...pickDecoyWords(allItems, it, words, 2)] : words;
    let answer: { w: string; idx: number }[] = [];
    let bank = shuffle(bankWords.map((w, i) => ({ w, used: false, idx: i })));
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
        <div class="latihan-head">
          <span class="stage-badge">🎧 Dengar &amp; Susun</span>
          ${answered ? '' : petunjukButtonHtml(revealed, true)}
        </div>
        ${quizNavHtml(round, items.length, susunStatus)}
        <div class="id-text">Dengarkan kalimatnya, lalu susun jadi kalimat</div>
        <div class="speak-row">
          <button class="speak-btn pt-cta" type="button" data-action="replay">🔊 Dengar</button>
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
          speak(ex.en);
          paint();
        },
        clear: () => {
          if (answered) return;
          answer = [];
          bank = shuffle(bankWords.map((w, i) => ({ w, used: false, idx: i })));
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
        playCorrectTone();
        fireConfetti();
        fb.textContent = pickPraise(level);
        fb.className = 'feedback good';
        speak(ex.en);
        // Permintaan user: selain audio, terjemahan Indonesia-nya jg
        // ditampilkan sbg teks — DI BAWAH section susun kalimat (bank-row),
        // sebelum feedback pujian, cuma muncul begitu jawabannya BENAR.
        // Ukuran disamakan dgn `.feedback` (1.0625rem) — permintaan user
        // "sedikit di besarkan setara ukuran pujian".
        fb.insertAdjacentHTML(
          'beforebegin',
          `<div class="id-text" style="margin-top:6px;font-size:1.0625rem">${ex.id}</div>`
        );
      } else {
        recordAttempt(false);
        // Permintaan user: "kasih getar dan sound tetot seperti di susun
        // kalimat di vocab" — pola SAMA PERSIS `runSusunKalimat` Vocab
        // (CLAUDE.md "Notifikasi Jawaban Salah"), yang sebelumnya TIDAK
        // ikut dipasang sesi format lama Listening ini.
        container.querySelector('.answer-row')?.classList.add('is-wrong');
        playWrongTone();
        vibrateDevice(160);
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
      fb.insertAdjacentHTML('afterend', roundActionsHtml(allSlotsDone(items.length, susunStatus)));
      setHandlers({
        tryAgainRound: () => {
          answered = false;
          answer = [];
          bank = shuffle(bankWords.map((w, i) => ({ w, used: false, idx: i })));
          paint();
        },
        nextRound: () => {
          round = nextUnfinishedRound(round, items.length, susunStatus);
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
export function runTantanganNote(
  container: HTMLElement,
  topic: ListeningNoteTopic,
  onDone: OnDone,
  level: LevelKey,
  contentLevel: LevelKey
): void {
  const topicId = topic.id;
  const section = 'tantangan-note';
  const gaps = topic.noteGaps;
  let cursor = Math.min(Math.max(getSection('listening', topicId, section)?.cursor ?? 0, 0), gaps.length - 1);

  const gapStatus = (i: number): 0 | 1 | 2 => getSlot('listening', topicId, section, i)?.st ?? 0;
  const filledAnswer = (i: number): string | null => (gapStatus(i) === 2 ? gaps[i].answer : null);

  const passageSpeakers = topic.notePassage.every((p) => p.speaker);
  const passageGenders = passageSpeakers
    ? dialogueGenders(topic.notePassage.map((p) => ({ speaker: p.speaker as string, en: p.en, id: p.id })))
    : null;

  function playPassage(): void {
    if (passageGenders) {
      speakDialogue(
        topic.notePassage.map((p) => ({ text: p.en, gender: passageGenders.get(p.speaker as string) ?? 'female' })),
        listeningGapMs(contentLevel)
      );
    } else {
      speakSequence(
        topic.notePassage.map((p) => p.en),
        listeningGapMs(contentLevel)
      );
    }
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
    // Opsi authored + 1 jebakan acak (`gap.decoys`) yang tidak disebut di audio.
    const decoy = pickDecoy(gap.decoys ?? [], (d) => d, gap.options, topic.notePassage.map((p) => p.en).join(' '));
    const options = decoy ? [...gap.options, decoy] : gap.options;
    let order = shuffle(options.map((_, i) => i));

    function paint(): void {
      container.innerHTML = `
        <div class="latihan-head">
          <span class="stage-badge">📝 Lengkapi Catatan</span>
          ${answered ? '' : petunjukButtonHtml(revealed, true)}
        </div>
        ${quizNavHtml(cursor, gaps.length, gapStatus)}
        <div class="id-text">Dengar percakapannya, lalu lengkapi catatannya · ${cursor + 1} dari ${gaps.length}</div>
        <div class="speak-row">
          <button class="speak-btn pt-cta" type="button" data-action="replay">🔊 Dengar Percakapan</button>
        </div>
        ${
          revealed
            ? topic.notePassage
                .map((p) =>
                  p.speaker
                    ? `<div class="dialogue-line"><span class="dialogue-speaker">${p.speaker}:</span> ${p.en}</div><div class="id-text" style="margin:0 0 6px">${p.id}</div>`
                    : `<div class="en-text">${p.en}</div><div class="id-text">${p.id}</div>`
                )
                .join('')
            : ''
        }
        ${noteCardHtml(!answered)}
        ${
          answered
            ? ''
            : `<p class="reading-question">${gap.question}</p>
               ${answerCardsHtml(
                 order.map((i) => ({ emoji: gap.emoji, label: options[i] })),
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
          playPassage();
          paint();
        },
        pick: (payload) => {
          if (answered) return;
          const picked = options[order[Number(payload)]];
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
            playWrongTone();
            vibrateDevice(160);
            fb.textContent = pickEncourage(level);
            fb.className = 'feedback bad';
          }
          fb.insertAdjacentHTML('afterend', roundActionsHtml(allSlotsDone(gaps.length, gapStatus)));
          setHandlers({
            tryAgainRound: () => {
              answered = false;
              order = shuffle(options.map((_, i) => i));
              paint();
            },
            nextRound: () => {
              cursor = nextUnfinishedRound(cursor, gaps.length, gapStatus);
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
export function runTantanganDialogue(
  container: HTMLElement,
  topic: ListeningDialogueTopic,
  onDone: OnDone,
  level: LevelKey,
  contentLevel: LevelKey
): void {
  const topicId = topic.id;
  const section = 'tantangan-dialog';
  const qs = topic.inferenceQuestions;
  let cursor = Math.min(Math.max(getSection('listening', topicId, section)?.cursor ?? 0, 0), qs.length - 1);

  const qStatus = (i: number): 0 | 1 | 2 => getSlot('listening', topicId, section, i)?.st ?? 0;

  const genders = dialogueGenders(topic.dialogueLines);

  function playDialogue(): void {
    speakDialogue(
      topic.dialogueLines.map((l) => ({ text: l.en, gender: genders.get(l.speaker) ?? 'female' })),
      listeningGapMs(contentLevel)
    );
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
    // Jebakan acak: 1 dari `q.decoys` (authored, tidak disebut di dialog).
    const decoy = pickDecoy(
      q.decoys ?? [],
      (o) => o.text,
      q.options.map((o) => o.text),
      topic.dialogueLines.map((l) => l.en).join(' ')
    );
    const options: ListeningInferenceOption[] = decoy ? [...q.options, { ...decoy, ok: false }] : q.options;
    let order = shuffle(options.map((_, i) => i));

    function paint(): void {
      container.innerHTML = `
        <div class="latihan-head">
          <span class="stage-badge">🧩 Dengar &amp; Simpulkan</span>
          ${petunjukButtonHtml(revealed, true)}
        </div>
        ${quizNavHtml(cursor, qs.length, qStatus)}
        <div class="id-text">Dengar percakapannya, lalu jawab pertanyaannya · ${cursor + 1} dari ${qs.length}</div>
        <div class="speak-row">
          <button class="speak-btn pt-cta" type="button" data-action="replay">🔊 Dengar Percakapan</button>
        </div>
        ${revealed ? transcriptHtml() : ''}
        <p class="reading-question">${q.question}</p>
        ${answerCardsHtml(
          order.map((i) => ({ emoji: options[i].emoji, label: options[i].text })),
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
          playDialogue();
          paint();
        },
        pick: (payload) => {
          if (answered) return;
          const idx = Number(payload);
          const opt = options[order[idx]];
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
            playWrongTone();
            vibrateDevice(160);
            fb.textContent = pickEncourage(level);
            fb.className = 'feedback bad';
          }
          fb.insertAdjacentHTML('afterend', roundActionsHtml(allSlotsDone(qs.length, qStatus)));
          setHandlers({
            tryAgainRound: () => {
              answered = false;
              order = shuffle(options.map((_, i) => i));
              paint();
            },
            nextRound: () => {
              cursor = nextUnfinishedRound(cursor, qs.length, qStatus);
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
