/**
 * Raja Balon — Balloon Pop. Game Hub "pure game" baru (permintaan user,
 * terinspirasi referensi kompetitor "letupkan balon" — kompetisi kata ID→EN
 * dikemas balon meletup), ditaruh TEPAT DI BAWAH Raja Kata di roster
 * (app.ts RAJA_LIST) sesuai permintaan "simpan di bawah game match word".
 *
 * Filter kid-friendly WAJIB diterapkan (CLAUDE.md): referensi aslinya py
 * timer countdown + hearts/nyawa + badge kesulitan bertekanan — SEMUA
 * dibuang di sini (materi/game.md §5: timer memicu stres neurologis, hearts
 * = status "kalah" implisit, keduanya dilarang keras). Yang diambil MURNI
 * bentuk visual (balon naik dari bawah ke atas, tap yang cocok utk
 * meletupkannya) — bukan mekanik gagalnya.
 *
 * Mekanik: 1 prompt Bahasa Indonesia tampil di atas ("Letupkan balon:
 * ..."), beberapa balon berisi kata Inggris naik terus-menerus dari bawah
 * papan ke atas (CSS animation loop, TANPA JS per-frame) — anak tap balon
 * yang jawabannya cocok. Benar → meletup (pop+confetti+skor), lanjut ke
 * kata berikutnya. Salah → balon goyang halus TAPI TETAP naik (non-
 * punitive, tidak pernah hilang/habis kesempatan) — anak bisa tap ulang
 * kapan saja balon lain masih melayang.
 *
 * 🔒 **Revisi user (sesi 2)** ("semua balon harus dari bawah munculnya dan
 * kurangi kecepatan, kecepatan sama seperti game match word ada level mudah/
 * sedang/sulit" + "soalnya pun sesuaikan dengan level") — pola SAMA PERSIS
 * `games/wordmatch.ts`: `DIFFICULTY_META`/`BANK_BY_DIFFICULTY` per tingkat,
 * dipilih dulu lewat `renderBalonTierPicker` (app.ts) sebelum main. Mudah =
 * balon paling lambat + kata terpendek, Sulit = balon tercepat + kata
 * terpanjang (tetap lebih lambat dari kecepatan tunggal versi sebelumnya).
 * Delay animasi SEKARANG POSITIF & bertingkat per balon (`i * 0.35s`, BUKAN
 * delay NEGATIF acak spt versi awal) + `animation-fill-mode:backwards`
 * (`styles.css`) — supaya title tiap balon KONSISTEN mulai dari bawah papan
 * (bukan muncul di tengah/dekat atas begitu ronde dibuka), baru naik
 * bertahap satu-satu spt cascade. Loop berikutnya (`infinite`) otomatis
 * tetap "muncul dari bawah" tiap siklus krn keyframe 0% = `bottom:-22%`.
 *
 * 🔒 **Revisi user (sesi 3) — "remove tingkat kesulitan jadikan konsepnya
 * seperti Raja Kata"**: picker tingkat kesulitan di depan (`renderBalonTierPicker`,
 * app.ts, SUDAH DIHAPUS TOTAL) diganti **Map Kerajaan Balon 6-markas**, pola
 * SAMA PERSIS `games/wordmatch.ts` `runWordMatch()`/`JOURNEY_NODES` — anak
 * TIDAK lagi memilih tingkat sendiri, langsung disambut Map (`renderMap()`)
 * begitu Raja Balon dibuka. Markas ke-i cuma bisa dijelajah kalau markas
 * ke-(i-1) sudah PERNAH dikunjungi (non-punitive — cukup pernah dicoba,
 * bukan harus menang). `DIFFICULTY_META`/`BANK_BY_DIFFICULTY` (pemanasan→
 * legendaris) TIDAK dihapus — tingkat kesulitan lama SEKARANG jadi isi
 * markas Map (`JOURNEY_NODES`), digenapkan 3→5 (`jago`/`legendaris` baru)
 * lalu 5→6 (`pemanasan` baru, permintaan user "tambahkan 1 sehingga ada
 * 6... levelnya ada pemanasan, mudah, sedang, sulit, jago, legendaris",
 * `BalloonDifficulty` di types.ts ikut diperluas tiap kali) supaya jumlah
 * markasnya PERSIS sama dgn Kerajaan Kata/Kalimat/Ingatan/Sound Hunt.
 * Mesin 1-markas/1-tingkat LAMA (dulu `runBalloonPop`, dipanggil picker)
 * TIDAK dihapus, cuma direname `runBalloonPopRound()` & jadi fungsi
 * INTERNAL yang dipakai orkestrator `runBalloonPop()` (nama BARU, exported,
 * dipanggil app.ts — signature BARU TANPA parameter `difficulty` lagi, sama
 * persis pola `runWordMatch`).
 *
 * 🔒 **Revisi 2026-09-29 (permintaan user "kerjakan Balloon Hunt", riset
 * `materi/pembeda_level_game.md` § Taman Balon)**: `DIFFICULTY_META`/
 * `BANK_BY_DIFFICULTY` DIHAPUS — pembeda lama cuma KECEPATAN (tantangan
 * motorik) + kata makin panjang/langka (penuh kognat, Satelit↔Satellite,
 * bisa dijawab dgn mencocokkan ejaan), tanpa audio sama sekali. Sekarang
 * tabel tier + bank di `balloonpop-data.ts` (dicek build): tiap markas
 * menambah 1 tantangan bahasa (dengar→gambar, gambar+kata ID→kata EN, kata
 * mirip bentuk, 1 kategori, suara→ejaan mirip bunyi, kalimat rumpang),
 * kecepatan cuma naik tipis (18 → 10 dtk). Paragraf di atas yang menyebut
 * `DIFFICULTY_META` = catatan historis.
 */
import { journeyMapHtml, markasIntro } from '../game-ui';
import { sfx } from '../game-audio';
import { setGameRoundActive, setHandlers } from '../interaction';
import { markGameHint, recordAttempt, setGameMarkas } from '../progress';
import { playCorrectTone, playWrongTone, speak, speakLocalized, vibrateDevice } from '../speech';
import { pickPraise, pickEncourage } from '../praise';
import { fireConfetti } from '../confetti';
import { GAME_STAR_FIELD } from '../scenery';
import { shuffle } from '../util';
import type { BalloonDifficulty, LevelKey, OnDone } from '../types';
import { CATEGORY_GROUPS, EASY_BANK, GAP_BANK, LOOKALIKE_GROUPS, SOUNDALIKE_GROUPS, TIER_CONFIG, WARMUP_BANK, WORD_COUNT, type BalloonWord, type HintKind } from './balloonpop-data';

/** `RajaKey` game ini — dikirim ke `recordAttempt()`, lihat komentar
 *  `GAME_KEY` `games/wordmatch.ts`. */
const GAME_KEY = 'balon';

/** Jeda mulai antar-balon (detik) — POSITIF & bertingkat per slot (bukan
 *  delay negatif acak spt versi awal) supaya SEMUA balon konsisten mulai
 *  dari bawah papan dalam urutan cascade, bukan langsung muncul di tengah
 *  udara begitu ronde dibuka (permintaan user). */
const SPAWN_STAGGER = 0.35;
const BALLOON_COLORS = ['#FF6F6F', '#4FC3E8', '#FFC24B', '#6FCF7A', '#B98CE8', '#FF8FB8'];

/** Duplikat lokal `roundActionsHtml` (konvensi app ini: helper generik
 *  diduplikasi per file game — lihat games/wordmatch.ts dst). */
function roundActionsHtml(isLast: boolean): string {
  return `
    <div class="round-actions">
      <button class="ghost-btn" type="button" data-action="tryAgainRound">🔁 Coba Lagi</button>
      <button class="primary-btn" type="button" data-action="nextRound" style="margin-top:0">${isLast ? 'Selesai ✅' : 'Jalan terus ➡️'}</button>
    </div>`;
}

/** Bullet progress read-only di dalam 1 markas (permintaan user "pada game
 *  tambahkan bullet progress juga") — pola SAMA PERSIS `games/storyquest.ts`
 *  `dotsHtml()` (`.quiz-dot.static`, warna ikut Raja lewat `.raja-stage`).
 *  Duplikat lokal per file game (konvensi sama `roundActionsHtml`). */
function progressDotsHtml(total: number, isDone: (i: number) => boolean, current: number): string {
  const dots = Array.from({ length: total }, (_, i) => {
    const done = isDone(i);
    const cls = [done ? 'done' : '', i === current ? 'current' : ''].filter(Boolean).join(' ');
    return `<span class="quiz-dot static ${cls}" aria-hidden="true">${done ? '✓' : i + 1}</span>`;
  }).join('');
  return `<div class="quiz-nav"><div class="quiz-dots">${dots}</div></div>`;
}

/** "Cara Main" — duplikat lokal, lihat komentar lengkap `gameHowToHtml`
 *  `games/wordmatch.ts` (permintaan user, referensi screenshot + "footer
 *  tambahkan seperti original footer... seperti di halaman yang lain"). */
function gameHowToHtml(steps: string[]): string {
  return `
    <h2 class="game-howto-title">Cara Main</h2>
    <div class="card game-howto-card">
      <ol class="game-howto-list">
        ${steps.map((s, i) => `<li><span class="game-howto-num" aria-hidden="true">${i + 1}</span><span>${s}</span></li>`).join('')}
      </ol>
    </div>`;
}

/** Opsional — dipasok `runBalloonPop()` (orkestrator Map Kerajaan Balon)
 *  supaya 1 markas tahu posisinya di tangga Mudah→Legendaris: `isLast`
 *  menentukan label tombol akhir ("Lanjut ➡️" vs "Selesai ✅"), `headerHtml`
 *  disisipkan PALING ATAS papan (strip status markas). Dibiarkan `undefined`
 *  kalau dipanggil tanpa konteks markas — `isLast` default `true` (pola
 *  SAMA PERSIS `RoundJourneyCtx` di `games/wordmatch.ts`). */
interface RoundJourneyCtx {
  isLast: boolean;
  headerHtml: string;
}

/** 1 soal siap tampil. */
interface BalloonQ {
  options: { text: string; emoji?: string }[];
  answer: number;
  /** Kata Inggris jawaban (aria/log). */
  en: string;
  /** Teks prompt Indonesia (Mudah/Sedang/Sulit). */
  id?: string;
  emoji?: string;
  /** Kalimat rumpang (Legendaris). */
  sentence?: string;
  /** Arti yang dibuka 💡 (Jago: arti kata, Legendaris: arti kalimat). */
  meaning?: string;
  /** Nama kelompok (instruksi Sulit). */
  category?: string;
}

/** Antrian acak tanpa ulang (semua keluar dulu sebelum ada yang berulang). */
function makeQueue<T>(items: T[]): () => T {
  let q: T[] = [];
  return () => {
    if (q.length === 0) q = shuffle(items);
    return q.shift()!;
  };
}

function others<T extends { en: string }>(pool: T[], exclude: string[], n: number): T[] {
  return shuffle(pool.filter((w) => !exclude.includes(w.en))).slice(0, n);
}

function assemble(target: { text: string; emoji?: string }, rest: { text: string; emoji?: string }[], extra: Omit<BalloonQ, 'options' | 'answer'>): BalloonQ {
  const options = shuffle([target, ...rest]);
  return { options, answer: options.indexOf(target), ...extra };
}

/** `WORD_COUNT` soal untuk 1 markas, sesuai tier (`balloonpop-data.ts`). */
function buildQuestions(difficulty: BalloonDifficulty): BalloonQ[] {
  const cfg = TIER_CONFIG[difficulty];
  const n = cfg.balloons - 1;
  const out: BalloonQ[] = [];
  const word = (w: BalloonWord) => ({ text: w.en, emoji: cfg.balloonPicture ? w.emoji : undefined });
  for (let i = 0; i < WORD_COUNT; i++) out.push(null as unknown as BalloonQ);
  if (difficulty === 'pemanasan' || difficulty === 'mudah') {
    const bank = difficulty === 'pemanasan' ? WARMUP_BANK : EASY_BANK;
    const next = makeQueue(bank);
    return out.map(() => {
      const t = next();
      return assemble(word(t), others(bank, [t.en], n).map(word), { en: t.en, id: t.id, emoji: t.emoji });
    });
  }
  if (difficulty === 'sedang' || difficulty === 'jago') {
    const groups = difficulty === 'sedang' ? LOOKALIKE_GROUPS : SOUNDALIKE_GROUPS;
    const all = groups.flatMap((g) => g.items.map((w) => ({ w, g })));
    const next = makeQueue(all);
    return out.map(() => {
      const { w, g } = next();
      // Semua kata mirip dalam grup dulu, sisanya diisi kata grup lain.
      const same = others(g.items, [w.en], n);
      const fill = others(all.map((x) => x.w), [w.en, ...same.map((x) => x.en)], n - same.length);
      return assemble(word(w), [...same, ...fill].map(word), { en: w.en, id: w.id, meaning: `Artinya: ${w.id}` });
    });
  }
  if (difficulty === 'sulit') {
    const nextGroup = makeQueue(CATEGORY_GROUPS);
    const perGroup = new Map(CATEGORY_GROUPS.map((g) => [g, makeQueue(g.items)]));
    return out.map(() => {
      const g = nextGroup();
      const t = perGroup.get(g)!();
      return assemble(word(t), others(g.items, [t.en], n).map(word), { en: t.en, id: t.id, category: g.name });
    });
  }
  const next = makeQueue(GAP_BANK);
  return out.map(() => {
    const s = next();
    return assemble({ text: s.options[0] }, s.options.slice(1).map((text) => ({ text })), { en: s.options[0], sentence: s.sentence, meaning: s.sentenceId });
  });
}

const HINT_LABEL: Record<HintKind, string> = { flash: 'Petunjuk', strike: 'Petunjuk', meaning: 'Arti' };

/** Mesin 1 markas — `WORD_COUNT` soal, bentuk prompt/balon/bantuan dari
 *  `TIER_CONFIG` (`balloonpop-data.ts`). Dipanggil `runBalloonPop()`
 *  orkestrator di bawah tiap markas ditap. */
function runBalloonPopRound(container: HTMLElement, difficulty: BalloonDifficulty, onDone: OnDone, level: LevelKey, journey?: RoundJourneyCtx): void {
  const cfg = TIER_CONFIG[difficulty];
  let questions = buildQuestions(difficulty);
  let wordIndex = 0;
  let busy = false;
  let roundDone = false;
  let wrongCount = 0;
  let hintUsed = false;

  const q = () => questions[wordIndex];
  const lanes = cfg.balloons === 3 ? [20, 50, 80] : [15, 39, 62, 86];

  function playPrompt(): void {
    if (cfg.prompt === 'audio') speak(`Pop the ${q().en}!`);
    else if (cfg.prompt === 'audio-only') speak(q().en);
    else if (cfg.prompt === 'picture-id' && q().id) speakLocalized(q().id!, 'id-ID');
  }

  function balloonHtml(opt: { text: string; emoji?: string }, i: number): string {
    const lane = lanes[i % lanes.length];
    const jitter = Math.random() * 8 - 4;
    const dur = (cfg.durMin + Math.random() * (cfg.durMax - cfg.durMin)).toFixed(2);
    const delay = (i * SPAWN_STAGGER).toFixed(2);
    const sway = (cfg.swayMin + Math.random() * (cfg.swayMax - cfg.swayMin)).toFixed(2);
    const bg = BALLOON_COLORS[Math.floor(Math.random() * BALLOON_COLORS.length)];
    const inner = opt.emoji ? `<span class="bp-balloon-pic">${opt.emoji}</span>` : `<span class="bp-balloon-text">${opt.text}</span>`;
    const long = !opt.emoji && opt.text.length >= 8 ? ' is-long' : '';
    return `
      <button class="bp-balloon${long}" type="button" data-action="popBalloon" data-payload="${i}"
        style="--x:${(lane + jitter).toFixed(1)}%; --dur:${dur}s; --delay:${delay}s; --sway:${sway}s; --bg:${bg};"
        aria-label="${opt.text}">
        <span class="bp-balloon-body">${inner}</span>
        <span class="bp-balloon-string" aria-hidden="true"></span>
      </button>`;
  }

  function promptHtml(): string {
    const cur = q();
    const listen = `<button class="speak-btn pt-cta" type="button" data-action="listen">🔊 Dengar</button>`;
    switch (cfg.prompt) {
      case 'audio':
        return `<div class="speak-row">${listen}</div>`;
      case 'picture-id':
        return `<p class="bp-prompt"><span class="bp-prompt-pic" aria-hidden="true">${cur.emoji}</span> <b>&ldquo;${cur.id}&rdquo;</b> <button class="bp-say" type="button" data-action="listen" aria-label="Dengar">🔊</button></p>`;
      case 'id':
        return `<p class="bp-prompt">🎈 Letupkan balon: <b>&ldquo;${cur.id}&rdquo;</b></p>`;
      case 'audio-only':
        return `<div class="speak-row">${listen}</div>`;
      case 'gap':
        return `<p class="bp-prompt bp-sentence">${cur.sentence!.replace('___', '<span class="bp-gap" aria-label="kosong"></span>')}</p>`;
    }
  }

  function paint(): void {
    busy = false;
    wrongCount = 0;
    hintUsed = false;
    const task = cfg.task.replace('{cat}', q().category ?? '');
    const hintBtn = cfg.hint === 'flash' ? '' : `<button class="speak-btn-ghost" type="button" data-action="hint"><span class="hint-bulb">💡</span> ${HINT_LABEL[cfg.hint]}</button>`;
    container.innerHTML = `
      ${journey?.headerHtml ?? ''}
      ${progressDotsHtml(WORD_COUNT, (i) => i < wordIndex || roundDone, wordIndex)}
      <div class="wm-head"><p class="wm-task">${task}</p>${hintBtn}</div>
      ${promptHtml()}
      <p class="bp-meaning" id="bpMeaning" hidden></p>
      <div class="bp-board${cfg.balloonPicture ? ' is-picture' : ''}">${q().options.map((opt, i) => balloonHtml(opt, i)).join('')}</div>
      <div class="feedback" id="fb"></div>
    `;
    setHandlers({ popBalloon: (payload) => onPop(Number(payload)), listen: playPrompt, hint: useHint });
    playPrompt();
  }

  function balloonEl(i: number): HTMLButtonElement | null {
    return container.querySelector<HTMLButtonElement>(`.bp-balloon[data-payload="${i}"]`);
  }

  /** 💡 diubah langsung di DOM (tanpa paint ulang) supaya balon yang sedang
   *  melayang tidak mulai lagi dari bawah. */
  function useHint(): void {
    if (hintUsed || busy || roundDone) return;
    hintUsed = true;
    markGameHint(GAME_KEY);
    container.querySelector('[data-action="hint"]')?.remove();
    if (cfg.hint === 'strike') {
      const cand = shuffle(q().options.map((_, i) => i).filter((i) => i !== q().answer && !balloonEl(i)?.disabled));
      const el = cand.length ? balloonEl(cand[0]) : null;
      el?.classList.add('is-struck');
      if (el) el.disabled = true;
    } else if (cfg.hint === 'meaning') {
      const m = container.querySelector<HTMLElement>('#bpMeaning');
      if (m) {
        m.textContent = `💭 ${q().meaning}`;
        m.hidden = false;
      }
    }
  }

  function onPop(i: number): void {
    if (busy || roundDone) return;
    const btn = balloonEl(i);
    const fb = container.querySelector<HTMLElement>('#fb');
    if (!btn || btn.disabled) return;

    if (i === q().answer) {
      busy = true;
      btn.classList.add('is-pop');
      sfx('pop');
      btn.disabled = true;
      recordAttempt(true, GAME_KEY);
      playCorrectTone();
      fireConfetti();
      if (fb) {
        fb.textContent = pickPraise(level);
        fb.className = 'feedback good';
      }
      setTimeout(() => {
        if (!container.isConnected) return;
        wordIndex += 1;
        if (wordIndex >= WORD_COUNT) {
          wordIndex = WORD_COUNT - 1;
          roundDone = true;
          const dots = container.querySelector('.quiz-nav');
          if (dots) dots.outerHTML = progressDotsHtml(WORD_COUNT, () => true, WORD_COUNT - 1);
          container.querySelector('[data-action="hint"]')?.remove();
          fb?.insertAdjacentHTML('afterend', roundActionsHtml(journey?.isLast ?? true));
          setHandlers({
            tryAgainRound: () => {
              questions = buildQuestions(difficulty);
              wordIndex = 0;
              roundDone = false;
              paint();
            },
            nextRound: () => onDone(),
          });
        } else {
          paint();
        }
      }, 420);
    } else {
      recordAttempt(false, GAME_KEY);
      playWrongTone();
      vibrateDevice(160);
      btn.classList.add('is-wrong');
      setTimeout(() => btn.classList.remove('is-wrong'), 380);
      wrongCount += 1;
      // Pemanasan: setelah 2x salah, balon yang benar berkedip.
      if (cfg.hint === 'flash' && wrongCount >= 2) balloonEl(q().answer)?.classList.add('is-hint');
      if (fb) {
        fb.textContent = pickEncourage(level);
        fb.className = 'feedback bad';
      }
    }
  }

  paint();
}

interface JourneyNode {
  difficulty: BalloonDifficulty;
  place: string;
  emoji: string;
  /** Baris sapaan singkat penjaga markas — flavor petualangan, TIDAK
   *  diucapkan TTS (pola SAMA `JourneyNode.guideLine` di `games/wordmatch.ts`). */
  guideLine: string;
}

/** 6 markas Map Kerajaan Balon ("jadikan konsepnya seperti Raja Kata", lalu
 *  "tambahkan 1 sehingga ada 6... levelnya ada pemanasan, mudah, sedang,
 *  sulit, jago, legendaris" — markas ke-0 `pemanasan` BARU ditambah PALING
 *  DEPAN), urut Pemanasan→Mudah→Sedang→Sulit→Jago→Legendaris — nama tempat
 *  cuma bungkus tema, `difficulty` di baliknya TETAP `BalloonDifficulty`
 *  asli (bank kata & kecepatan sama persis `DIFFICULTY_META`, tidak
 *  diduplikasi di sini). Nama SENGAJA beda dari `JOURNEY_NODES` Kerajaan
 *  Kata (Desa/Gerbang/Istana/Balairung/Menara/Ruang Harta) biar 2 game Raja
 *  tidak terasa ketuker di kepala anak, pola sama alasan "Balairung" vs
 *  "Throne Room". */
const JOURNEY_NODES: JourneyNode[] = [
  { difficulty: 'pemanasan', place: 'Halaman Balon', emoji: '🏡', guideLine: 'Yuk pemanasan! Dengarkan katanya, lalu letupkan gambarnya.' },
  { difficulty: 'mudah', place: 'Taman Balon', emoji: '🎈', guideLine: 'Selamat datang di Taman Balon! Sekarang balonnya berisi kata Inggris.' },
  { difficulty: 'sedang', place: 'Pasar Balon', emoji: '🎪', guideLine: 'Pasar ini penuh kata kembar! Hurufnya cuma beda sedikit, baca teliti.' },
  { difficulty: 'sulit', place: 'Awan Balon', emoji: '☁️', guideLine: 'Wah, sudah setinggi awan! Semua balon di sini satu kelompok.' },
  { difficulty: 'jago', place: 'Puncak Balon', emoji: '🏔️', guideLine: 'Ini puncak tertinggi! Tidak ada tulisan, cuma suara — bunyinya mirip-mirip.' },
  { difficulty: 'legendaris', place: 'Balon Emas', emoji: '🏆', guideLine: 'Balon Emas terakhir! Cari kata yang pas untuk melengkapi kalimatnya.' },
];

/** Header dalam layar 1 markas (dipasok ke `runBalloonPopRound()` via
 *  `journey.headerHtml`) — pola SAMA PERSIS `games/wordmatch.ts` `nodeHeaderHtml()`. */
function nodeHeaderHtml(node: JourneyNode, foundCount: number, total: number): string {
  return `
    <div class="latihan-head">
      <span class="stage-badge">${node.emoji} ${node.place}</span>
      <span class="tag accent">🎈 ${foundCount}/${total}</span>
    </div>
    <p class="meta" style="margin-top:var(--s3)">📯 "${node.guideLine}"</p>`;
}

/**
 * Raja Balon — orkestrator penuh, SEKARANG entry point utama file ini
 * (dipanggil app.ts `runRajaRound`, TANPA picker tingkat kesulitan lagi —
 * lihat komentar di puncak file). **Konsep petualangan ala `games/
 * wordmatch.ts` `runWordMatch()`**: langsung buka **Map Kerajaan Balon**
 * (`renderMap()`, grid `.raja-grid`/`.raja-card` — lihat riwayat desain
 * lengkap di komentar `renderMap()`, markas ke-i cuma bisa dijelajah kalau
 * markas ke-(i-1) sudah PERNAH dikunjungi, non-punitive: BUKAN harus benar,
 * cukup pernah dicoba) → tap markas → 1 ronde `runBalloonPopRound()` di
 * markas itu → balik ke Map → markas berikutnya kebuka → markas ke-6
 * tuntas → "Semua Balon Ditemukan!" → `onDone()`. State `visited` cuma
 * hidup di closure ini, TIDAK disimpan progress.ts/localStorage, konsisten
 * semua raja Game Hub lain.
 */
export function runBalloonPop(container: HTMLElement, onDone: OnDone, level: LevelKey): void {
  const total = JOURNEY_NODES.length;
  const visited = new Set<number>();

  /** 🔒 Pola SAMA PERSIS `games/wordmatch.ts` `renderMap()` (permintaan user
   *  "jadikan 1 card an seperti di halaman game dimana 1 row jadi 2 card",
   *  lalu "lebih kids friendly seperti sebelumnya" — kartu dapat rona warna
   *  Raja sendiri via `map-card` + tag kesulitan berwarna via `diff-*`) —
   *  reuse grid `.raja-grid`/`.raja-card` roster `/game`. Detail lengkap
   *  riwayat desain: komentar `renderMap()` `games/wordmatch.ts`. */
  function renderMap(): void {
    // 🔒 Back dari layar Map TIDAK perlu pop up konfirmasi lagi (permintaan
    // user) — lihat komentar `isGameRoundActive` `interaction.ts`.
    setGameRoundActive(false);
    const stops = journeyMapHtml('balon', JOURNEY_NODES.map((n) => ({ name: n.place, emoji: n.emoji, difficulty: n.difficulty, label: TIER_CONFIG[n.difficulty].label })), visited);

    // 🔒 `current` = markas berikutnya yang belum ditaklukkan (posisi anak
    // sekarang), permintaan user "beri pembeda di progress yang sedang
    // disinggahi" — lihat komentar `.game-progress-dot.current` styles.css.
    const nextIdx = JOURNEY_NODES.findIndex((_, i) => !visited.has(i));
    const dots = JOURNEY_NODES.map((_, i) => {
      const done = visited.has(i);
      const cls = [done ? 'done' : '', i === nextIdx ? 'current' : ''].filter(Boolean).join(' ');
      return `<span class="game-progress-dot${cls ? ' ' + cls : ''}" aria-hidden="true">${done ? '✓' : ''}</span>`;
    }).join('');

    container.innerHTML = `
      <div class="raja-map-wrap">
        ${GAME_STAR_FIELD}
        <div class="card game-progress-card">
          ${GAME_STAR_FIELD}
          <h2>Taklukkan markas satu per satu, ya!</h2>
          <div class="game-progress-dots">${dots}<span class="game-progress-label">Selesai ${visited.size} dari ${total}</span></div>
        </div>
        ${stops}
        ${gameHowToHtml([
          'Baca/dengar kata yang diminta',
          'Tap balon yang jawabannya cocok (tiap markas 10 kata)',
          'Makin jauh markasnya, soalnya makin menantang — bukan cuma makin cepat',
          'Taklukkan markas satu per satu sampai tuntas!',
        ])}
      </div>`;
    setHandlers({ enterNode: (payload) => playStage(Number(payload)) });
  }

  function playStage(idx: number): void {
    setGameRoundActive(true, renderMap); // masuk markas = "halaman mengerjakan", popup keluar aktif lagi; keluar = balik ke Map
    markasIntro(JOURNEY_NODES[idx].emoji, JOURNEY_NODES[idx].place);
    setGameMarkas(GAME_KEY, idx, JOURNEY_NODES[idx].place, JOURNEY_NODES[idx].emoji);
    const node = JOURNEY_NODES[idx];
    const isLast = idx === total - 1;
    runBalloonPopRound(
      container,
      node.difficulty,
      () => {
        visited.add(idx);
        if (visited.size >= total) renderMissionComplete();
        else renderMap();
      },
      level,
      { isLast, headerHtml: nodeHeaderHtml(node, visited.size, total) }
    );
  }

  function renderMissionComplete(): void {
    setGameRoundActive(false); // layar selesai, tidak ada progres yang bisa hilang
    sfx('mission');
    container.innerHTML = `
      <div class="done-wrap win">
        <div class="sunburst lg mascot-pop" aria-hidden="true"><span class="face">🎈</span><span class="crown">🏆</span></div>
        <h2 class="win-banner">Semua Balon Ditemukan!</h2>
        <p class="done-sub">Kamu berhasil menjelajahi seluruh Kerajaan Balon & meletupkan semua balon!</p>
        <button class="primary-btn" type="button" data-action="finish">Selesai ✅</button>
      </div>`;
    setHandlers({ finish: () => onDone() });
  }

  renderMap();
}
