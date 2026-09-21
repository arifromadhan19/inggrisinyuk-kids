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
  requestSync,
  resetSectionPlan,
  setSectionCursor,
} from '../progress';
import {
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
import { shuffle } from '../util';
import { LEVELS } from '../content';

/**
 * Level KONTEN topik yang lagi dimainkan (`contentLevel`, param BARU di
 * `runLatihanInti`/`runTantangan`/`runSusunKalimat`) — BUKAN `level`
 * (praise language, `app.ts` `praiseLevel = currentLevelMeta().key`, badge
 * ASLI anak, dipertahankan APA ADANYA di semua fungsi ini) — permintaan
 * user "analisis kesulitan setiap level ... di atas level starter": makin
 * tinggi level KONTEN-nya (bukan level badge anak), makin sedikit bantuan
 * visual yang wajar, sama filosofi Reading (TTS dicabut mulai Adventurer)/
 * Speaking (produktif sejak Explorer). `contentLevel` HARUS dari `app.ts`
 * `contentLevel`/`browsingLevel()` (topik yang SEDANG ditampilkan), BUKAN
 * `praiseLevel` — 2 hal beda, CLAUDE.md sudah catat bug serupa pernah
 * kejadian krn ketuker (`renderKenalan`), jangan diulang di sini.
 */
function isAboveStarter(contentLevel: LevelKey): boolean {
  const starterIdx = LEVELS.findIndex((l) => l.key === 'starter');
  const idx = LEVELS.findIndex((l) => l.key === contentLevel);
  return idx > starterIdx;
}

/**
 * 4 pembeda kesulitan TAMBAHAN antar level "di atas Starter" (permintaan
 * user langsung, riset acuan Cambridge YLE/KET nyata — bukan cuma
 * "Explorer=Adventurer=Achiever=Trailblazer" 1 tier rata spt fix
 * icon-removal/decoy-word sebelumnya): Movers→Flyers→KET/PET progresif
 * mengurangi TIGA hal sekaligus seiring tier naik — opsi jawaban makin
 * banyak (odds nebak makin kecil), opsi berlebih/jebakan makin banyak, dan
 * bantuan (hint/reveal) makin pelit/telat. Explorer≈Movers & Adventurer≈A1
 * Movers penuh TETAP dapat treatment "ringan" (spt semula: 2 jebakan/3
 * distraktor/hint 2-eliminasi/reveal-2x-salah), Achiever≈A2 Flyers &
 * Trailblazer≈KET/PET dapat treatment "berat" — SATU tier lagi di ATAS
 * `isAboveStarter`, bukan gantiin.
 */
function isFlyersOrAbove(contentLevel: LevelKey): boolean {
  return contentLevel === 'achiever' || contentLevel === 'trailblazer';
}

/** #1 — jumlah kata jebakan Susun Kalimat: 2 (Explorer/Adventurer) → 3
 *  (Achiever) → 4 (Trailblazer), bukan flat 2 di semua 4 level. */
function susunDecoyCount(contentLevel: LevelKey): number {
  if (contentLevel === 'trailblazer') return 4;
  if (contentLevel === 'achiever') return 3;
  return 2;
}

/** #2 — jumlah distraktor MCQ Latihan Inti: 3 (4 opsi total, Explorer/
 *  Adventurer, spt semula) → 4 (5 opsi total, Achiever/Trailblazer). */
function latihanDistractorCount(contentLevel: LevelKey): number {
  return isFlyersOrAbove(contentLevel) ? 4 : 3;
}

/** #4 — jumlah opsi salah yang dieliminasi tombol "💡 Petunjuk" Latihan
 *  Inti: 2 (Explorer/Adventurer, spt semula — dari 4 opsi nyisa 2) → 1
 *  (Achiever/Trailblazer — dari 5 opsi nyisa 4, bantuan lebih pelit).
 *  KHUSUS Latihan Inti (bukan Kenalan Main — itu tetap "pemanasan",
 *  scaffolding penuh semua level, tidak disentuh permintaan ini). */
function latihanHintEliminateCount(contentLevel: LevelKey): number {
  return isFlyersOrAbove(contentLevel) ? 1 : 2;
}

/** #3 — ambang jumlah salah sebelum jawaban di-reveal otomatis (Eja Kata/
 *  Susun Kalimat Tantangan): 2x (Explorer/Adventurer, spt semula) → 3x
 *  (Achiever/Trailblazer, bantuan telat muncul). */
function tantanganRevealThreshold(contentLevel: LevelKey): number {
  return isFlyersOrAbove(contentLevel) ? 3 : 2;
}

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

  // 🔒 Permintaan user, SCOPE SESEMPIT MUNGKIN ("hanya di sini saja") —
  // tombol 🎤 per-kata di Kenalan DIHILANGKAN KHUSUS topik "Salam & Sopan
  // Santun" (Little Stars), TIDAK ADA topik lain yang boleh ikut (jangan
  // generalisasi ke `topic.iconAmbiguous` atau kondisi lain yang lebih luas
  // — itu flag beda, dipakai `drawListenSpeakQuestion` di 🎮 Main, BUKAN
  // penentu tombol 🎤 ini). 🎮 "Dengar & Ucapkan" (mic-based, ditambahkan
  // sesi sebelumnya) TETAP ADA — permintaan ini cuma soal tombol 🎤 mandiri
  // di daftar kata, bukan mic di dalam mini-game.
  //
  // 🐛 Bug yg sempat kejadian & diperbaiki di sini: parameter `level` fungsi
  // ini BUKAN level konten yang sedang ditampilkan — dipanggil dari app.ts
  // `praiseLevel = currentLevelMeta().key` (level BADGE ASLI anak, dipakai
  // `pickPraise()`/`pickEncourage()`), yang bisa BEDA dari level topik yang
  // lagi dibrowsing (mis. anak levelnya Explorer tapi lagi meninjau ulang
  // materi Little Stars lewat dropdown "nempel"). Cek `level === 'little-
  // stars'` di sini TIDAK PERNAH kena buat anak yang levelnya bukan Little
  // Stars — checknya jadi salah, bukan cuma berlebihan. Untungnya id topik
  // Vocabulary UNIK LINTAS LEVEL (CLAUDE.md — 'salam-sopan-santun' cuma ada
  // 1 definisi, di VOCAB_TOPICS_LITTLE_STARS), jadi `topic.id` SENDIRIAN
  // sudah cukup & benar utk mengenali topik ini, tanpa perlu (dan tanpa
  // salah pakai) parameter level sama sekali.
  const hideMicHere = topic.id === 'salam-sopan-santun';
  const showMic = sttSupported && !hideMicHere;

  drawWordList();

  function drawWordList(): void {
    container.innerHTML = `
      <div class="id-text" style="margin-bottom:10px;">Dengarkan kata-katanya dulu, tap 🔊 untuk mengulang${showMic ? ', tap 🎤 buat coba ucapkan' : ''}, atau tap 🎮 buat main sama kata itu</div>
      <div class="primer-list">
        ${topic.items
          .map(
            (it, i) => {
            const opp = oppositeItem(topic, it);
            const oppHtml = opp
              ? `<span class="opp">↔ ${itemGlyph(topic.id, opp)} <b>${opp.en}</b> (${opp.id})</span>`
              : '';
            return `
          <div class="primer-item">
            ${primerIconHtml(topic, it)}
            <div class="txt"><b>${it.en}</b><span>${it.id}</span>${oppHtml}</div>
            <div class="mini-play${doneCls(i, 'listen')}" data-action="playWord" data-payload="${i}">🔊</div>
            ${showMic ? `<div class="mini-play${doneCls(i, 'mic')}" id="micMini${i}" data-action="micWord" data-payload="${i}">🎤</div>` : ''}
            <div class="mini-play${doneCls(i, 'game')}" data-action="gameWord" data-payload="${i}">🎮</div>
          </div>`;
          }
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
        runWordMiniGame(container, topic, i, drawWordList, level);
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
        ${isDayTopic(topic) ? '' : `<div style="font-size:38px" aria-hidden="true">${itemGlyph(topic.id, it)}</div>`}
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
 * 2 tipe soal, dipilih otomatis dari BENTUK topiknya sendiri (`isNumberTopic`,
 * bukan hardcode topic id — supaya topik angka baru di level lain ikut
 * kebaca otomatis):
 *  - Topik Angka: gambar buah diulang SESUAI NILAI kata target (bukan angka
 *    acak lagi), jawaban pilihan ganda KATA Inggris-nya (One/Two/…, bukan
 *    digit) — sesuai kosakata yang sedang dipelajari (permintaan user).
 *  - Topik lain: **"Dengar & Tunjuk"** (`drawListenPointQuestion`, REVISI —
 *    dulu "Apa bahasa Inggrisnya [kata Indonesia]?" + pilihan teks, TAPI itu
 *    task IDENTIK dgn Latihan Inti tipe `'toEn'`, cuma beda kemasan visual —
 *    audit user: "Kenalan Main duplikat Latihan Inti"). Sekarang dengar TTS
 *    kata itu SAJA (tanpa bahasa terjemahan/arah), tunjuk gambar emoji polos
 *    yang cocok dari 3-4 pilihan (punya sendiri vs kata lain di topik yang
 *    sama) — task shape genuinely beda dari SEMUA 4 tipe Latihan Inti
 *    (`hear`/`toEn`/`toId`/`sentence`, semua berbasis pilihan TEKS).
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

/** Topik warna (bentuk topik, bukan hardcode id — pola sama `isNumberTopic`)
 *  — item.emoji topik ini SENGAJA cuma swatch warna polos (🔴/⚫/dst, bukan
 *  gambar benda), jadi aman/perlu dibedakan dari topik biasa di 2 tempat:
 *  (1) `drawSentence` boleh nampilin `example.emoji` sbg ilustrasi kalimat
 *  TANPA takut bocorin jawaban (kata target warna = adjective, gambarnya
 *  benda/noun yg dideskripsikan — dua konsep beda, aman); (2) kartu jawaban
 *  `drawAudio` pakai `example.emoji` (benda BERWARNA, mis. 🍓 utk Red)
 *  ketimbang swatch polos supaya lebih hidup & kid-friendly (permintaan
 *  user, laporan topik "Kenal Warna"). */
const COLOR_WORDS = ['red', 'blue', 'yellow', 'green', 'orange', 'purple', 'pink', 'black', 'white', 'brown', 'gray', 'grey'];
function isColorTopic(topic: VocabTopic): boolean {
  return topic.items.every((it) => COLOR_WORDS.includes(it.en.trim().toLowerCase()));
}

/** Topik bentuk (structural, bukan hardcode id — pola sama `isColorTopic`/
 *  `isNumberTopic`) — item.emoji topik ini SENGAJA glyph bentuknya sendiri
 *  (⚪/🔺/⭐/❤️/dst, `example.emoji` = emoji YANG SAMA PERSIS), 1:1 literal
 *  encoding dari jawaban — leak SAMA PERSIS pola warna/angka (audit user
 *  dari screenshot Latihan Inti "Lengkapi Kalimat" topik Bentuk: kartu
 *  jawaban "Heart" pakai ikon ❤️ yang LITERALLY bentuk hati, anak bisa
 *  cocokkan teks id "Ini hati" ke ikon tanpa pernah paham kata Inggrisnya
 *  sama sekali — CLAUDE.md "Soal Tidak Boleh Bisa Ditebak Tanpa Paham").
 *  Ditangani co-alasan dgn `numberTopic`: kartu jawaban (`drawAudio`/
 *  `drawSentence`) strip ikon (teks tetap tampil, beda dari warna yang
 *  strip TEKS); `drawSentence` boleh nampilin `example.emoji` sbg SATU
 *  ilustrasi di scene (bukan diulang di tiap kartu jawaban) — itu memang
 *  gambar bentuk yang lagi dideskripsikan kalimatnya, aman & perlu utk
 *  konteks visual "This is a ___.". */
const SHAPE_WORDS = ['circle', 'square', 'triangle', 'star', 'heart', 'diamond', 'oval', 'cross', 'arrow', 'moon'];
function isShapeTopic(topic: VocabTopic): boolean {
  return topic.items.every((it) => SHAPE_WORDS.includes(it.en.trim().toLowerCase()));
}

/** Topik hari (structural, pola sama `isColorTopic`/`isShapeTopic`) —
 *  `item.emoji` topik ini SENGAJA ikon aktivitas sembarang (mis. 🏫 utk
 *  "Monday", 🎨 utk "Tuesday") yang TIDAK merepresentasikan harinya sendiri
 *  (beda dari warna/bentuk/angka yang emoji-nya proxy asli konsepnya) —
 *  laporan user: ikon itu "tidak relevan", jangan dipaksakan (CLAUDE.md
 *  "Ikon/Gambar WAJIB Relevan & Merepresentasikan Materi"). Disembunyikan
 *  di SEMUA tempat `item.emoji` dipakai sbg representasi KATA ITU SENDIRI
 *  (isolated word, tanpa konteks kalimat) — Kenalan list, popup mic Kenalan
 *  (`openMicResultPopup`), 🎮 Main mic (`drawListenSpeakQuestion`), Eja Kata
 *  (`runEjaKata`), & kartu jawaban Latihan Inti (`optEmoji`/`drawSentence`).
 *  `example.emoji` di Susun Kalimat/Penggunaan (`runSusunKalimat`/`runUcapan`)
 *  TIDAK disembunyikan — itu mengilustrasikan kata BENDA yang genuinely ada
 *  di kalimat contoh yang ditampilkan (mis. "school" di "School starts on
 *  Monday."), bukan representasi hari itu sendiri, jadi tetap relevan (pola
 *  sama `scene` warna/bentuk yg mengilustrasikan objek dlm kalimat).
 *  `isDayItems()` versi `VocabItem[]` polos — dipakai fungsi Tantangan
 *  (`runEjaKata`/`runSusunKalimat`/`runUcapan`) yang cuma terima `allItems`,
 *  bukan `VocabTopic` utuh. */
const DAY_WORDS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday', 'today', 'tomorrow', 'yesterday'];
function isDayItems(items: VocabItem[]): boolean {
  return items.every((it) => DAY_WORDS.includes(it.en.trim().toLowerCase()));
}
function isDayTopic(topic: VocabTopic): boolean {
  return isDayItems(topic.items);
}

/** Override gambar custom per kata (permintaan user, scope SESEMPIT MUNGKIN
 *  — pola sama `hideMicHere = topic.id === 'salam-sopan-santun'` di atas):
 *  kata tertentu di `tempat-di-sekitar` (Vocab Starter) pakai BADGE
 *  ILUSTRASI CUSTOM (aset user, sudah diverifikasi bukan logo bermerek
 *  dagang) menggantikan emoji — 🔒 revisi user: awalnya cuma Kenalan,
 *  SEKARANG di SEMUA tempat ikon kata itu tampil (Kenalan, popup mic, 🎮
 *  Main, Latihan Inti, Tantangan Eja Kata/Susun Kalimat/Penggunaan) supaya
 *  konsisten 1 kata = 1 ikon di seluruh flow, bukan cuma di 1 layar. Tabel
 *  `topicId -> word -> path` supaya nambah kata lain di topik yang sama
 *  tinggal nambah baris, TANPA field baru di `VocabItem`. Kalau topik/skill
 *  LAIN nanti minta pola serupa, pertimbangkan generalisasi baru, JANGAN
 *  taruh di tabel ini begitu saja. */
const KENALAN_ICON_IMAGE_OVERRIDES: Record<string, Record<string, string>> = {
  'tempat-di-sekitar': {
    Zoo: '/img/zoo.jpeg',
    Market: '/img/market.jpeg',
    Farm: '/img/farm.jpeg',
  },
  'barang-di-rumah': {
    Table: '/img/table.svg',
    Fridge: '/img/fridge.svg',
  },
  'di-sekolah': {
    Coach: '/img/coach-icon.png',
    Classroom: '/img/classroom-icon.png',
  },
  'kata-sifat': {
    Dirty: '/img/dirty-icon.png',
    Slow: '/img/slow-icon.png',
  },
  'keluarga': {
    Cafe: '/img/cafe-icon.png',
  },
  'pedesaan': {
    Meadow: '/img/meadow.svg',
    Path: '/img/path.svg',
    Pond: '/img/pond.svg',
    Orchard: '/img/orchard.svg',
    Countryside: '/img/countryside.svg',
    Vineyard: '/img/vineyard.svg',
  },
};

/** Pasangan lawan kata per topik (CLAUDE.md "Aturan Wajib: Topik Lawan Kata
 *  WAJIB Tampilkan Pasangannya di Kenalan") — permintaan user: gambar
 *  tunggal (mis. 🚲 utk "Slow") tidak cukup mengajarkan makna RELATIF kata
 *  sifat, anak butuh lihat KONTRASnya (🚲 Slow vs 🏎️ Fast) biar paham lewat
 *  perbandingan, bukan cuma hafal 1 sisi. Scope SESEMPIT MUNGKIN, pola sama
 *  `KENALAN_ICON_IMAGE_OVERRIDES` — topik baru yang py struktur pasangan
 *  lawan kata eksplisit tinggal ditambah baris di sini. */
const OPPOSITE_PAIRS: Record<string, Record<string, string>> = {
  'kata-sifat': {
    Big: 'Small', Small: 'Big',
    Fast: 'Slow', Slow: 'Fast',
    Long: 'Short', Short: 'Long',
    Heavy: 'Light', Light: 'Heavy',
    Clean: 'Dirty', Dirty: 'Clean',
  },
};
function oppositeItem(topic: VocabTopic, it: VocabItem): VocabItem | null {
  const oppEn = OPPOSITE_PAIRS[topic.id]?.[it.en];
  return oppEn ? (topic.items.find((x) => x.en === oppEn) ?? null) : null;
}

/** Glyph HTML gambar custom (kalau ada override) — `1em` supaya otomatis
 *  ikut ukuran font-size kontainer pembungkusnya (persis pola scaling emoji
 *  karakter biasa), dipakai gantikan `it.emoji`/`ex.emoji` polos di titik
 *  manapun yang merepresentasikan KATA itu (bukan generic image tag baru
 *  per pemanggil). `topicId` string (bukan `VocabTopic`) supaya fungsi
 *  Tantangan (`runEjaKata`/`runSusunKalimat`/`runUcapan`, cuma terima
 *  `topicId`+`allItems`) bisa ikut pakai tanpa perlu `VocabTopic` utuh. */
function overrideIconHtml(topicId: string, en: string): string | null {
  const path = KENALAN_ICON_IMAGE_OVERRIDES[topicId]?.[en];
  return path ? `<img src="${path}" alt="" style="width:1em;height:1em;object-fit:cover;border-radius:20%;vertical-align:-0.2em" />` : null;
}
function itemGlyph(topicId: string, it: VocabItem): string {
  return overrideIconHtml(topicId, it.en) ?? it.emoji;
}
function exampleGlyph(topicId: string, it: VocabItem): string {
  return overrideIconHtml(topicId, it.en) ?? it.example.emoji;
}

function primerIconHtml(topic: VocabTopic, it: VocabItem): string {
  const override = overrideIconHtml(topic.id, it.en);
  if (override) return `<div class="primer-ic is-img">${override}</div>`;
  if (isDayTopic(topic)) return '';
  return `<div class="primer-ic">${it.emoji}</div>`;
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
  options: { en: string; emoji: string }[];
}

function buildNumberQuestion(topic: VocabTopic, item: VocabItem): WordQuestion {
  const count = numberWordValue(item.en)!;
  const obj = COUNT_OBJECTS[Math.floor(Math.random() * COUNT_OBJECTS.length)];
  const distractors = shuffle(topic.items.filter((i) => i !== item)).slice(0, 3);
  return {
    visual: `<div class="big-emoji" style="letter-spacing:8px;font-size:clamp(34px,9vw,52px)" aria-hidden="true">${obj.emoji.repeat(count)}</div>`,
    prompt: `Ada berapa ${obj.id} ini?`,
    target: item.en,
    options: shuffle([item, ...distractors]).map((i) => ({ en: i.en, emoji: i.emoji })),
  };
}

/** Kartu jawaban 2×2 (permintaan user: layar ini sempat pakai pil teks polos
 *  3-kolom yang nyisa 1 kartu sendirian di baris kedua utk 4 opsi — REUSE
 *  `answerCardsHtml` yang sama dgn Latihan Inti, bukan gaya baru, supaya
 *  konsisten & selalu rapi 2 kartu/baris apa pun jumlah opsinya).
 *
 * 🔒 Revisi user (samakan pola header+Petunjuk ke SEMUA varian MCQ 🎮 Main)
 * — badge pindah ke `.latihan-head` (kiri) + "💡 Petunjuk" (kanan) di ATAS
 * bullet progress (`navHtml`, param BARU), Petunjuk eliminasi 2 opsi salah
 * via `wireHintCorrect` (dibandingkan ke `q.target`, bukan referensi objek
 * — `q.options` bukan `VocabItem[]`).
 *
 * 🔒 Revisi user lagi ("samakan konsepnya di kenalan main, latihan inti,
 * tambahkan image atau text di jawabannya") — `o.emoji` topik Angka SENGAJA
 * DIHAPUS dari kartu jawaban (`emoji` dikosongkan, TEKS-SAJA), co-alasan
 * dgn `drawSentence`/`drawAudio` Latihan Inti (numberTopic): `item.emoji`
 * topik Angka literally DIGIT jawabannya sendiri (mis. "3️⃣" utk "Three") —
 * bocoran PALING telanjang (anak bisa cocokkan digit tanpa paham kata
 * Inggrisnya sama sekali), sama kategori dgn swatch warna. Fungsi ini
 * SATU-SATUNYA pemanggilnya adalah topik Angka (lihat `runWordMiniGame`),
 * jadi aman di-strip unconditional TANPA perlu cek `isNumberTopic` lagi di
 * sini. */
function drawWordQuestion(container: HTMLElement, badge: string, idText: string, q: WordQuestion, navHtml = ''): void {
  container.innerHTML = `
    <div class="latihan-head">
      <span class="stage-badge">${badge}</span>
      ${hintButtonHtml}
    </div>
    ${navHtml}
    <div class="id-text">${idText}</div>
    ${q.visual}
    <p class="reading-question">${q.prompt}</p>
    ${answerCardsHtml(q.options.map((o) => ({ emoji: '', label: o.en })), 'pick')}
    <div class="feedback" id="fb"></div>
  `;
  wireHintCorrect(container, q.options.map((o) => o.en === q.target));
}

/**
 * Soal "Dengar & Tunjuk" utk topik NON-angka (permintaan user: fix
 * redundansi — versi lama SELALU tanya "Apa bahasa Inggrisnya '[ID]'?"
 * (`buildTranslateQuestion`, DIHAPUS total sesi ini), task-nya IDENTIK
 * dgn Latihan Inti tipe `'toEn'`, cuma beda kemasan visual (teks polos vs
 * kartu 2×2) — 2 layar nanya soal yang SAMA PERSIS. Sekarang: dengar KATA
 * (TTS), tunjuk 1 dari 3-4 GAMBAR yang cocok (punya sendiri vs kata lain di
 * topik yang sama) — TANPA bahasa terjemahan/arah sama sekali, jadi task
 * shape-nya tetap beda dari SEMUA 4 tipe Latihan Inti (yang semua berbasis
 * PROMPT teks, di sini prompt-nya audio).
 *
 * 🔒 Revisi user: kartu jawaban SEKARANG pakai `answerCardsHtml` (gambar +
 * label teks Inggris di bawahnya, BUKAN lagi gambar polos tanpa teks) —
 * permintaan eksplisit "di kenalan main, pada box jawaban selain gambar
 * tambahkan text di bawahnya", berlaku SEMUA level (Little Stars s/d
 * Trailblazer, tanpa terkecuali) krn alasan user: "kenalan itu sebagai
 * pemanasan" — bukan tahap uji sungguhan spt Latihan Inti/Tantangan, jadi
 * scaffolding tambahan (teks + gambar + audio sekaligus) di sini WAJAR,
 * beda kebutuhan dari Latihan Inti yang MEMANG harus tetap teks-only murni.
 *
 * 🔒 Revisi user lagi — header disamakan pola `.latihan-head` Latihan Inti
 * ("pindahkan text ... di atas kiri bullet progress ... tambahkan button
 * 'petunjuk' di kanan atas, di atas bullet progress"): badge kiri + tombol
 * "💡 Petunjuk" kanan dalam 1 baris (`.latihan-head`), bullet progress
 * (`navHtml`, param BARU) di bawahnya — persis urutan `drawAudio`/
 * `drawSentence`. Petunjuk pakai `wireHint()` yang SAMA (eliminasi 2 opsi
 * salah dari 4, sekali pakai) — makanya opsi jawaban di sini DIBANGUN dari
 * `VocabItem[]` langsung (`opts`, bukan lagi wrapper `{en,emoji,ok}` custom)
 * spy bisa reuse `wireHint(container, opts, item)` apa adanya (reference-
 * equality check `opts[i] !== target`), sama pola `drawAudio`/`drawSentence`.
 *
 * 🔒 Revisi user lagi ("samakan konsepnya di kenalan main, latihan inti,
 * tambahkan image atau text di jawabannya") — topik Warna (`isColorTopic`,
 * jatuh ke fungsi INI krn tidak py cabang khusus sendiri di dispatcher)
 * SEMPAT pakai `item.emoji` apa adanya di kartu jawaban — itu SWATCH WARNA
 * POLOS (mis. "🔴" utk "Red"), bocoran visual paling telanjang (anak bisa
 * cocokkan warna murni dari mata tanpa paham kata Inggrisnya sama sekali).
 * Diganti gambar BENDA berwarna (`example.emoji`, mis. 🍓 utk Red — bukan
 * swatch), sama pola `drawAudio` Latihan Inti.
 *
 * 🔒 Revisi user LAGI ("revisi aturan sebelumnya" — sempat gambar-SAJA di
 * sini tanpa teks, laporan user: "tidak konsisten, kadang gak ada
 * text/gambar" dibanding tab lain) — teks label warna TIDAK LAGI
 * dikosongkan, SELALU gambar+teks BERSAMAAN (disamakan ke `drawAudio`
 * Latihan Inti yang jg sudah direvisi sama, & ke topik biasa di fungsi ini
 * yang emang dari awal sudah gambar+teks). AMAN krn fungsi ini TIDAK py
 * `scene` terpisah spt `drawSentence` (lihat komentar `drawAudio` soal
 * kenapa `drawSentence` beda sendiri, TETAP teks-saja di sana).
 */
function drawListenPointQuestion(
  container: HTMLElement,
  topic: VocabTopic,
  item: VocabItem,
  onAnswer: (correct: boolean, btn: HTMLElement) => void,
  navHtml = ''
): void {
  const distractorPool = topic.items.filter((i) => i !== item && i.emoji !== item.emoji);
  const distractors = shuffle(distractorPool).slice(0, Math.min(3, distractorPool.length));
  const opts = shuffle([item, ...distractors]);
  const colorTopic = isColorTopic(topic);
  container.innerHTML = `
    <div class="latihan-head">
      <span class="stage-badge">🎮 MAIN · Dengar &amp; Tunjuk</span>
      ${hintButtonHtml}
    </div>
    ${navHtml}
    <div class="id-text">Dengarkan katanya, lalu tunjuk gambar yang cocok</div>
    <div class="speak-row"><button class="speak-btn" type="button" data-action="replay">🔊 Dengar Lagi</button></div>
    ${answerCardsHtml(
      opts.map((o) =>
        colorTopic
          ? { emoji: o.example.emoji, label: o.en }
          : { emoji: overrideIconHtml(topic.id, o.en) ?? o.emoji, label: o.en }
      ),
      'pick'
    )}
    <div class="feedback" id="fb"></div>
  `;
  speak(item.en);
  wireHint(container, opts, item);
  setHandlers({
    replay: () => speak(item.en),
    pick: (payload) => {
      const i = Number(payload);
      onAnswer(opts[i] === item, container.querySelectorAll<HTMLElement>('.opt-btn')[i]);
    },
  });
}

/**
 * Soal "Dengar & Pilih" — KHUSUS topik hari (`isDayTopic`, permintaan user:
 * "kenalan 🎮 Main jadi ada voice dan pilihan jawaban yang hanya berupa
 * text"). Topik ini `iconAmbiguous:true` (CLAUDE.md "Ikon/Gambar WAJIB
 * Relevan" — ikon aktivitas sembarang tidak merepresentasikan harinya
 * sendiri) jadi TIDAK bisa pakai `drawListenPointQuestion` (gambar) SEPERTI
 * topik biasa, TAPI juga TIDAK dipaksa ikut default mic `iconAmbiguous`
 * (`drawListenSpeakQuestion`) — user secara eksplisit minta MCQ teks, bukan
 * mic. Dengar TTS kata (`speak(item.en)`, tanpa bahasa terjemahan/arah —
 * pola sama `drawListenPointQuestion`), pilih 1 dari 3-4 OPSI TEKS hari lain
 * di topik yang sama (kartu `answerCardsHtml` dgn `emoji:''` — skip render
 * span emoji otomatis, pola sama kartu teks-saja topik Warna/Bentuk/Angka).
 * Dicek SEBELUM `topic.iconAmbiguous` generik di `runWordMiniGame` supaya
 * topik hari tidak jatuh ke cabang mic itu duluan.
 *
 * 🔒 Revisi user (samakan pola header+Petunjuk ke SEMUA varian MCQ 🎮 Main,
 * bukan cuma "Dengar & Tunjuk") — badge pindah ke `.latihan-head` (kiri) +
 * "💡 Petunjuk" (kanan) di ATAS bullet progress (`navHtml`, param BARU),
 * Petunjuk eliminasi 2 opsi salah via `wireHintCorrect` (opsi di sini bukan
 * `VocabItem` polos... eh, sebenarnya IYA `VocabItem[]` di sini, tapi tetap
 * pakai `wireHintCorrect` biar konsisten pola dgn varian MCQ lain di file
 * ini yang opsinya BUKAN `VocabItem`).
 */
function drawListenTextQuestion(
  container: HTMLElement,
  topic: VocabTopic,
  item: VocabItem,
  onAnswer: (correct: boolean, btn: HTMLElement) => void,
  navHtml = ''
): void {
  const distractorPool = topic.items.filter((i) => i !== item);
  const distractors = shuffle(distractorPool).slice(0, Math.min(3, distractorPool.length));
  const options = shuffle([item, ...distractors]);
  container.innerHTML = `
    <div class="latihan-head">
      <span class="stage-badge">🎮 MAIN · Dengar &amp; Pilih</span>
      ${hintButtonHtml}
    </div>
    ${navHtml}
    <div class="id-text">Dengarkan katanya, lalu pilih jawaban yang cocok</div>
    <div class="speak-row"><button class="speak-btn" type="button" data-action="replay">🔊 Dengar Lagi</button></div>
    ${answerCardsHtml(options.map((o) => ({ emoji: '', label: o.en })), 'pick')}
    <div class="feedback" id="fb"></div>
  `;
  speak(item.en);
  wireHintCorrect(container, options.map((o) => o === item));
  setHandlers({
    replay: () => speak(item.en),
    pick: (payload) => {
      const i = Number(payload);
      onAnswer(options[i] === item, container.querySelectorAll<HTMLElement>('.opt-btn')[i]);
    },
  });
}

/**
 * Soal "Dengar & Ucapkan" — KHUSUS topik `iconAmbiguous` (permintaan user,
 * audit "Salam & Sopan Santun": emoji speech-act/gestur di topik ini
 * — 🙏🥺😔🙋 dst — genuinely multi-tafsir buat soal tunjuk-gambar
 * `drawListenPointQuestion` (mis. 🙏 kebaca "berdoa" bukan "terima kasih").
 * GANTI task shape total: dengar kata lalu UCAPKAN balik via mic (skor
 * proporsional `wordMatchDetail` + "▶️ Play Suaramu", CLAUDE.md Aturan Wajib
 * Speaking) — bukan cuma menyiasati ambiguitas ikon, tapi lebih pas secara
 * pedagogis: frasa sapaan/sopan-santun memang fungsinya DIUCAPKAN di situasi
 * sosial, bukan dikenali dari gambar diam. Pola SAMA PERSIS `runUcapan` (di
 * bawah file ini, tab Tantangan "🗣️ Penggunaan") — cuma 1 soal ad-hoc (bukan
 * bagian plan 10-soal), jadi TANPA section-cursor sendiri (nav dot-nya tetap
 * ada, dikirim `runWordMiniGame` lewat param `navHtml`). TIDAK masuk
 * `recordAttempt()`/akurasi (`graded:false` di `recordEvent`, non-punitive,
 * SELALU boleh lanjut apa pun skornya) — beda dari `onAnswer` generik yang
 * dipakai 2 tipe soal lain di atas (itu MCQ biner objektif, ASR anak TIDAK
 * selalu akurat jadi tidak boleh disamakan).
 *
 * 🔒 Revisi user (samakan pola header ke SEMUA varian 🎮 Main — badge di
 * ATAS bullet progress) — badge dipindah ke atas `navHtml` (param BARU,
 * dikirim langsung SEBAGAI BAGIAN render, bukan lagi ditempel dari luar via
 * `insertAdjacentHTML`, supaya urutannya tetap benar begitu pun soal ini
 * di-retry lewat `draw()` lokalnya sendiri di bawah). TANPA tombol "💡
 * Petunjuk" — beda dari SEMUA varian MCQ lain di file ini, soal ini murni
 * mic (dengar lalu ucapkan), tidak py opsi jawaban salah yang bisa
 * dieliminasi sama sekali (co-alasan dgn Speaking format lama, CLAUDE.md:
 * "Speaking TIDAK py hint apa pun... tidak ada opsi salah utk dieliminasi").
 */
function drawListenSpeakQuestion(
  container: HTMLElement,
  topic: VocabTopic,
  item: VocabItem,
  itemIndex: number,
  onDone: OnDone,
  level: LevelKey,
  navHtml = ''
): void {
  function draw(): void {
    container.innerHTML = `
      <span class="stage-badge">🎮 MAIN · Dengar &amp; Ucapkan</span>
      ${navHtml}
      <div class="id-text">Dengarkan katanya, lalu ucapkan lagi ya</div>
      ${isDayTopic(topic) ? '' : `<div class="big-emoji">${item.emoji}</div>`}
      <div class="speak-row">
        <button class="speak-btn" type="button" data-action="replay">🔊 Dengar Lagi</button>
        ${sttSupported ? `<button class="speak-btn" id="micBtn" type="button" data-action="mic">🎤 Ucapkan</button>` : ''}
      </div>
      <div id="micResult"></div>
      <div class="feedback" id="fb"></div>
      ${sttSupported ? '' : `<p class="meta" style="text-align:center">Mikrofon tidak didukung browser ini</p><button class="ghost-btn" type="button" data-action="skip">✅ Aku Sudah Coba Ucapkan</button>`}
    `;
    speak(item.en);

    let recordedAudioUrl: string | null = null;

    setHandlers({
      replay: () => speak(item.en),
      skip: onDone,
      playMine: () => {
        if (recordedAudioUrl) new Audio(recordedAudioUrl).play().catch(() => {});
      },
      mic: () => {
        const btn = container.querySelector<HTMLElement>('#micBtn')!;
        if (btn.classList.contains('listening')) return;
        btn.classList.add('listening');
        listenAndRecordOnce(
          (said) => {
            btn.classList.remove('listening');
            btn.setAttribute('disabled', 'true');
            const words = wordMatchDetail(said, item.en);
            const hitRatio = words.length ? words.filter((w) => w.matched).length / words.length : 0;
            const stars = hitRatio >= 0.8 ? 3 : hitRatio >= 0.4 ? 2 : 1;
            const starRow = '⭐'.repeat(stars) + '☆'.repeat(3 - stars);
            const wordsHtml = words.map((w) => `<span class="${w.matched ? 'ok' : 'miss'}">${w.word}</span>`).join('');
            const perfect = stars === 3;
            const score = Math.round(hitRatio * 100);
            // Dot bullet-progress berubah "done" DI SINI (mic BENERAN
            // disubmit), bukan pas loncat/tap dot — sama alasan `onAnswer`
            // MCQ di `runWordMiniGame` (mic tidak biner, non-punitive tetap
            // menandai dicoba apa pun skornya).
            markSlotAnswered('vocabulary', topic.id, 'kenalan', itemIndex, perfect, { score, itemRef: item.en });
            if (perfect) {
              btn.classList.add('win-burst');
              playCorrectTone();
              fireConfetti();
            } else {
              playTryAgainTone();
            }
            recordEvent({
              kind: 'speak',
              skill: 'vocabulary',
              topicId: topic.id,
              section: 'kenalan',
              itemRef: item.en,
              activity: 'word-mini',
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
            fb.insertAdjacentHTML('afterend', roundActionsHtml(true));
            setHandlers({
              tryAgainRound: () => draw(),
              nextRound: onDone,
            });
          },
          (kind) => {
            btn.classList.remove('listening');
            if (kind === 'aborted') return; // lihat komentar setara `runUcapan` di bawah file ini
            container.querySelector<HTMLElement>('#fb')!.textContent = 'Belum kedengaran, coba lagi 🎧';
          },
          (audioUrl) => {
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
 * Mini-game "Kelompokkan" (`materi/game.md` §4/§7 kandidat #1 — kategori
 * "Urutkan/Kelompokkan" yang sebelumnya BELUM pernah dipakai di app manapun)
 * — dipilih otomatis dari BENTUK topik (`sortBaskets` + `item.group`, pola
 * sama `isNumberTopic`), bukan hardcode topic id. Beda task-shape dari
 * `drawListenPointQuestion` (itu "dengar kata → tunjuk gambar yang SAMA
 * PERSIS", recognition murni) — ini "lihat 1 benda → putuskan itu masuk
 * kelompok MANA dari 2 pilihan", melatih kategorisasi (klasifikasi relatif
 * antar-konsep dalam topik), bukan sekadar cocok-gambar.
 */
export function isSortableTopic(
  topic: VocabTopic
): topic is VocabTopic & { sortBaskets: NonNullable<VocabTopic['sortBaskets']> } {
  if (!topic.sortBaskets) return false;
  const hasA = topic.items.some((i) => i.group === 'a');
  const hasB = topic.items.some((i) => i.group === 'b');
  return hasA && hasB;
}

/** `navHtml` opsional (default kosong) — diisi `quizNavHtml(...)` oleh
 *  `runKelompokkan` (ronde berdiri sendiri, Raja Kelompok Game Hub), kosong
 *  di pemanggilan lama (`runWordMiniGame`, 1 soal fokus 1 kata di Kenalan,
 *  tidak butuh navigasi antar-soal).
 *
 * 🔒 Revisi (laporan user, topik "Bentuk"): dulu tiap tombol jawaban py
 * ikon KERANJANG yang TETAP (⚪ utk Bundar, 🔺 utk Bersudut) di SAMPING
 * labelnya — dimaksud sbg "lambang kategori", TAPI setiap game LAIN di app
 * ini (Dengar & Tunjuk, answerCardsHtml, dst) selalu render ikon MILIK
 * item itu sendiri sbg jawaban, jadi anak/ortu wajar mengira ikon di tombol
 * jawaban SEHARUSNYA gambar yang sama dgn yang ditanyakan — begitu item-nya
 * BUKAN ⚪/🔺 persis (mis. Square/Star/Heart/Diamond), ikon keranjang yang
 * tidak berubah itu kebaca sbg "jawabannya tidak ada yang cocok". Sekarang
 * tombol TEKS SAJA (`baskets[k].label`, ikon keranjang dibuang) — tidak ada
 * lagi gambar yang bisa disalahartikan sbg "harus sama persis dgn soal".
 * Ditambah `speak(item.en)` otomatis + tombol "🔊 Dengar" replay (celah yg
 * ketemu sekalian — SEBELUMNYA soal ini SAMA SEKALI tidak py audio, beda
 * dari `drawListenPointQuestion` sibling-nya yg auto-speak, padahal topik
 * pilot ini Little Stars/pra-baca, butuh jalur dengar bukan cuma baca teks
 * "Bundar"/"Bersudut" di tombol). */
function drawSortQuestion(
  container: HTMLElement,
  baskets: NonNullable<VocabTopic['sortBaskets']>,
  item: VocabItem,
  onAnswer: (correct: boolean, btn: HTMLElement) => void,
  navHtml = ''
): void {
  // Urutan 2 keranjang diacak tiap soal — supaya jawaban benar tidak selalu
  // di posisi yang sama (anti-tebak-posisi, konsisten pola opsi acak di
  // seluruh file ini).
  const order: ('a' | 'b')[] = Math.random() < 0.5 ? ['a', 'b'] : ['b', 'a'];
  container.innerHTML = `
    ${navHtml}
    <span class="stage-badge">🎮 MAIN · Kelompokkan</span>
    <div class="id-text">Ini masuk kelompok yang mana?</div>
    <div class="big-emoji" style="font-size:clamp(40px,10vw,60px)" aria-hidden="true">${item.emoji}</div>
    <p class="reading-question">${item.en}</p>
    <div class="speak-row"><button class="speak-btn" type="button" data-action="replay">🔊 Dengar</button></div>
    <div class="opt-grid">
      ${order.map((k, i) => `<button class="opt-btn opt-btn-text" type="button" data-action="pick" data-payload="${i}">${baskets[k].label}</button>`).join('')}
    </div>
    <div class="feedback" id="fb"></div>
  `;
  speak(item.en);
  setHandlers({
    replay: () => speak(item.en),
    pick: (payload) => {
      const i = Number(payload);
      onAnswer(order[i] === item.group, container.querySelectorAll<HTMLElement>('.opt-btn')[i]);
    },
  });
}

/**
 * Kenalan "🎮 Main" utk topik "sortable" (Bentuk/Shapes) — REVISI TOTAL
 * (permintaan user langsung, setelah 2 laporan berulang "soal & jawaban
 * tidak match" thd `drawSortQuestion`/Kelompokkan: dulu round/cornered
 * categorization py ikon keranjang generik yang tidak pernah menggambar
 * ITEM yang ditanyakan, jadi anak/ortu wajar mengira jawabannya harus
 * MIRIP GAMBAR — begitu diberi teks-saja pun konsepnya (kategorisasi
 * abstrak) tetap dianggap membingungkan). User eksplisit minta ganti task
 * SHAPE total: "cukup berikan gambar dan ada text pilihan jawaban dalam
 * bahasa inggris... misal gambar heart ini (HANYA gambar) dan pilihannya
 * text 1. heart, 2. circle, dst" — murni "lihat gambar → pilih KATA
 * Inggris yang cocok", TANPA reveal `item.en` di layar (dulu `drawSortQuestion`
 * bocor jawaban lewat label teks di bawah gambar) & TANPA audio (bunyi
 * kata itu sendiri = jawabannya, jadi `speak()` di sini justru membocorkan,
 * beda dari `drawListenPointQuestion` yang MEMANG audio-first). Distraktor
 * 3 kata Inggris SIBLING dari topik yang sama (pola sama
 * `drawListenPointQuestion`, cuma bentuk opsinya teks bukan gambar). Dipilih
 * via `isSortableTopic(topic)` SAJA (bukan lagi `&& item.group` — supaya
 * SEMUA 10 kata topik ini, TERMASUK Cross/Arrow yang sudah dilepas dari
 * `group`, konsisten pakai mekanik yang sama, bukan campur 2 task shape
 * beda dalam 1 topik). `drawSortQuestion`/Kelompokkan TETAP DIPERTAHANKAN
 * apa adanya (teks-only, sudah diperbaiki sesi sebelumnya) — TETAP dipakai
 * `runKelompokkan` (ronde terpisah "Raja Kelompok" Game Hub, DI LUAR scope
 * permintaan ini yang cuma soal Kenalan).
 *
 * 🔒 Revisi user (samakan pola header+Petunjuk ke SEMUA varian MCQ 🎮 Main)
 * — badge pindah ke `.latihan-head` (kiri) + "💡 Petunjuk" (kanan) di ATAS
 * bullet progress (`navHtml`, param BARU), Petunjuk eliminasi 2 opsi salah
 * via `wireHintCorrect` (dibandingkan ke `option.ok`, bukan referensi objek).
 */
function drawPictureWordQuestion(
  container: HTMLElement,
  topic: VocabTopic,
  item: VocabItem,
  onAnswer: (correct: boolean, btn: HTMLElement) => void,
  navHtml = ''
): void {
  const distractorPool = topic.items.filter((i) => i !== item && i.en !== item.en);
  const distractors = shuffle(distractorPool).slice(0, Math.min(3, distractorPool.length));
  const options = shuffle([{ en: item.en, ok: true }, ...distractors.map((d) => ({ en: d.en, ok: false }))]);
  container.innerHTML = `
    <div class="latihan-head">
      <span class="stage-badge">🎮 MAIN · Lihat &amp; Pilih</span>
      ${hintButtonHtml}
    </div>
    ${navHtml}
    <div class="id-text">Ini gambar apa? Pilih kata Inggrisnya!</div>
    <div class="big-emoji" style="font-size:clamp(40px,10vw,60px)" aria-hidden="true">${item.emoji}</div>
    <div class="opt-grid ${options.length === 3 ? 'three' : ''}">
      ${options.map((o, i) => `<button class="opt-btn opt-btn-text" type="button" data-action="pick" data-payload="${i}">${o.en}</button>`).join('')}
    </div>
    <div class="feedback" id="fb"></div>
  `;
  wireHintCorrect(container, options.map((o) => o.ok));
  setHandlers({
    pick: (payload) => {
      const i = Number(payload);
      onAnswer(options[i].ok, container.querySelectorAll<HTMLElement>('.opt-btn')[i]);
    },
  });
}

/** Tombol 🎮 per kata di daftar Kenalan (permintaan user: "kenapa belum ada
 *  button main di setiap kata") — 1 soal fokus ke kata itu saja, balik ke
 *  daftar kata sesudahnya, BUKAN lanjut ke Latihan Inti. 3 bentuk soal,
 *  dipilih otomatis dari BENTUK topik+item (bukan hardcode topic id):
 *  topik Angka → `buildNumberQuestion` (hitung gambar); topik "sortable" DAN
 *  item ini punya `group` → `drawSortQuestion` (Kelompokkan); sisanya →
 *  `drawListenPointQuestion` (Dengar & Tunjuk, default lama). */
function runWordMiniGame(container: HTMLElement, topic: VocabTopic, startIndex: number, onBack: OnDone, level: LevelKey): void {
  let index = startIndex;
  let item = topic.items[index];

  // 🔒 Bullet-progress bisa diklik (permintaan user, revisi dari Sebelumnya/
  // Lanjut: "biar bisa coba di urutan berapa pun") — REUSE PERSIS
  // `quizNavHtml`/`wireQuizNav` yang sudah ada (pola sama navigasi soal di
  // tempat lain, bukan komponen baru).
  //
  // 🔒 REVISI (permintaan user: dot cuma boleh berubah warna begitu anak
  // BENERAN mengerjakan/submit, BUKAN cuma loncat/tap dot-nya) — dot ini
  // SEMPAT baca `hasWordInteraction(..., 'game')`, flag yang SAMA dipakai
  // ikon 🎮 di daftar Kenalan (`doneCls`, sengaja "nyala begitu ditap", lihat
  // CLAUDE.md) — akibatnya `goToIndex` ikut menandai flag itu supaya dot
  // yang dituju via loncat juga "done", padahal anak belum jawab apa-apa di
  // soal itu. Sekarang dot pakai penanda TERPISAH: slot section 'kenalan'
  // (section yang SAMA dgn tap 🔊/🎤/🎮 di daftar, TAPI field `st` beda —
  // `markSlotInteraction`/tap cuma naikkan ke `st:1`, `markSlotAnswered` di
  // `onAnswer`/mic sukses di bawah yang naikkan ke `st:2`), section ini
  // SUDAH dikecualikan dari persentase topik & insight Rapor (`isGradedSection`
  // di progress.ts, `=== 'kenalan'`), jadi aman tanpa field/migrasi baru.
  // `goToIndex` sekarang MURNI pindah tampilan, tidak menyentuh progres.
  const wordStatus = (i: number): 0 | 1 | 2 => getSlot('vocabulary', topic.id, 'kenalan', i)?.st ?? 0;

  function goToIndex(i: number): void {
    if (i < 0 || i >= topic.items.length || i === index) return;
    index = i;
    draw();
  }

  // 🔒 Revisi user (samakan pola header+Petunjuk ke SEMUA varian 🎮 Main,
  // bukan cuma "Dengar & Tunjuk") — SEMUA cabang sekarang kirim `navHtml`
  // LANGSUNG sbg parameter tiap fungsi `drawXxxQuestion`, yang merender
  // navHtml itu SENDIRI di bawah header `.latihan-head` (badge+Petunjuk) di
  // dalam `innerHTML`-nya masing-masing — BUKAN lagi ditempel dari luar via
  // `insertAdjacentHTML('afterbegin', ...)` generik (pola LAMA yang taruh
  // bullet progress di paling atas, SEBELUM badge — urutan yang salah,
  // makanya harus diganti per-fungsi, bukan cukup direorder di sini saja).
  // Pengecualian: `drawListenSpeakQuestion` (mic, iconAmbiguous) TETAP TANPA
  // tombol Petunjuk — soal itu tidak py opsi jawaban salah yang bisa
  // dieliminasi (mic bebas, bukan MCQ), tapi badge-nya TETAP dipindah ke
  // atas navHtml (lihat komentar fungsi itu sendiri).
  function draw(): void {
    item = topic.items[index];
    const navHtml = quizNavHtml(index, topic.items.length, wordStatus);
    if (isDayTopic(topic)) {
      // Topik hari: iconAmbiguous jg (ikon aktivitas sembarang, lihat
      // `isDayTopic`), TAPI user minta MCQ teks di sini (bukan mic spt
      // default `iconAmbiguous` di bawah) — dicek LEBIH DULU supaya tidak
      // jatuh ke cabang mic itu.
      drawListenTextQuestion(container, topic, item, onAnswer, navHtml);
    } else if (topic.iconAmbiguous) {
      // Emoji topik ini genuinely multi-tafsir (lihat komentar
      // `drawListenSpeakQuestion`) — soal tunjuk-gambar bisa salah baca
      // ikon, bukan salah paham materi. Dengar & Ucapkan (mic) menghindari
      // masalah itu total krn tidak ada ikon yang perlu ditafsirkan.
      drawListenSpeakQuestion(container, topic, item, index, onBack, level, navHtml);
    } else if (isNumberTopic(topic)) {
      // 🔒 Revisi user ("samakan konsepnya di kenalan main, latihan inti,
      // tambahkan image atau text di jawabannya") — badge SEMPAT literally
      // menaruh `item.en` (mis. "🎮 MAIN · One", jawaban soal "Ada berapa
      // pisang ini?" itu SENDIRI) di headernya — bocoran paling telanjang
      // (bukan cuma di kartu jawaban, tapi di judul layarnya), ditemukan
      // dari audit sesi sebelumnya. Ganti ke label generik netral, konsisten
      // pola badge tipe soal lain di file ini (`🎮 MAIN · Dengar & Tunjuk`
      // dst — tidak pernah menyebut jawaban).
      const q = buildNumberQuestion(topic, item);
      drawWordQuestion(container, '🎮 MAIN · Hitung Yuk!', 'Yuk coba!', q, navHtml);
      setHandlers({
        pick: (payload) => {
          const i = Number(payload);
          onAnswer(q.options[i].en === q.target, container.querySelectorAll<HTMLElement>('.opt-btn')[i]);
        },
      });
    } else if (isSortableTopic(topic)) {
      drawPictureWordQuestion(container, topic, item, onAnswer, navHtml);
    } else {
      drawListenPointQuestion(container, topic, item, onAnswer, navHtml);
    }
    wireQuizNav(goToIndex);
  }

  function onAnswer(correct: boolean, btn: HTMLElement): void {
    lockOptionButtons(container);
    const fb = container.querySelector<HTMLElement>('#fb')!;
    // Dot bullet-progress baru berubah "done" DI SINI (soal beneran dijawab),
    // bukan pas loncat/tap dot — lihat komentar `wordStatus` di atas.
    markSlotAnswered('vocabulary', topic.id, 'kenalan', index, correct, { itemRef: item.en });
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
/** `eliminateCount` (param BARU, default 2 — SEMUA pemanggil lama TIDAK
 *  berubah) — Latihan Inti Achiever/Trailblazer kirim 1 (`latihanHintEliminateCount`,
 *  permintaan user "pembeda antar level di atas starter": bantuan makin
 *  pelit seiring tier naik, dari 5 opsi nyisa 4 bukan nyisa 2). */
function wireHint(container: HTMLElement, opts: VocabItem[], target: VocabItem, onUsed?: () => void, eliminateCount = 2): void {
  let used = false;
  setHandlers({
    hint: () => {
      if (used) return;
      const btns = container.querySelectorAll<HTMLButtonElement>('.opt-btn');
      const wrongIdx = opts.map((_, i) => i).filter((i) => opts[i] !== target && !btns[i].disabled);
      if (wrongIdx.length) {
        used = true;
        const toEliminate = shuffle(wrongIdx).slice(0, Math.min(eliminateCount, wrongIdx.length));
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

/** Versi generik `wireHint` (permintaan user: samakan pola Petunjuk-eliminasi
 *  ke SEMUA varian 🎮 Main Kenalan yang berbentuk MCQ, bukan cuma "Dengar &
 *  Tunjuk") — beberapa varian ini opsinya BUKAN `VocabItem[]` polos (mis.
 *  `WordQuestion.options` cuma `{en,emoji}`, `drawPictureWordQuestion` cuma
 *  `{en,ok}`), jadi tidak bisa reuse `wireHint` yang butuh cocok referensi
 *  objek `target`. Di sini cukup kirim array boolean "opsi ke-i ini benar?"
 *  (SEARAH index dgn tombol `.opt-btn` yang dirender) — perilaku eliminasi
 *  (2 opsi salah acak dari sisa, sekali pakai) IDENTIK `wireHint`. */
function wireHintCorrect(container: HTMLElement, isCorrect: boolean[], onUsed?: () => void): void {
  let used = false;
  setHandlers({
    hint: () => {
      if (used) return;
      const btns = container.querySelectorAll<HTMLButtonElement>('.opt-btn');
      const wrongIdx = isCorrect.map((_, i) => i).filter((i) => !isCorrect[i] && !btns[i].disabled);
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
/** `emoji`/`label` masing² boleh string kosong (permintaan user, topik
 *  warna): (a) `emoji:''` — kartu Lengkapi Kalimat warna, swatch warna
 *  membocorkan jawaban lewat warna ikonnya sendiri, teks-saja; (b)
 *  `label:''` — kartu Dengar/toEn/toId warna, TEKS-nya yang membocorkan
 *  (anak bisa cocok bunyi kata yang didengar ke ejaan tertulisnya tanpa
 *  paham arti/warnanya sama sekali, apalagi Little Stars belum bisa baca)
 *  → gambar-saja, gambar dibesarkan (co-class `.opt-btn`/`.answer-card`
 *  yang sama, cuma isi dalamnya beda). 🔒 Lencana huruf A/B/C/D DIHAPUS
 *  TOTAL (permintaan user "hilangkan A,B,C,D") — kartu sudah cukup jelas
 *  dibedakan lewat gambar+posisi, lencana jadi dekorasi berlebih. */
function answerCardsHtml(options: { emoji: string; label: string }[], action: string): string {
  return `<div class="opt-grid">
    ${options
      .map(
        (o, i) => `
      <button class="opt-btn answer-card" type="button" data-action="${action}" data-payload="${i}">
        ${o.emoji ? `<span class="answer-card-emoji" aria-hidden="true">${o.emoji}</span>` : ''}
        ${o.label ? `<span class="answer-card-bottom"><span class="answer-card-label">${o.label}</span></span>` : ''}
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
 *
 * `contentLevel` (param BARU, lihat komentar `isAboveStarter`) — Explorer ke
 * atas kartu jawaban `drawAudio`/`drawSentence` jadi TEKS-SAJA (permintaan
 * user "analisis kesulitan ... di latihan inti dihilangkan icon/image nya
 * supaya mengurangi menebak"), Little Stars/Starter TETAP gambar+teks apa
 * adanya (permintaan user eksplisit "masih seperti saat ini").
 */
export function runLatihanInti(container: HTMLElement, topic: VocabTopic, onDone: OnDone, level: LevelKey, contentLevel: LevelKey): void {
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
  // 🔒 Jumlah distraktor naik di Achiever/Trailblazer (`latihanDistractorCount`,
  // 3→4, jadi 5 opsi bukan 4 — permintaan user "pembeda antar level di atas
  // starter", riset Cambridge Flyers/KET: opsi jawaban makin banyak seiring
  // tier naik, odds nebak makin kecil).
  const distractorCount = latihanDistractorCount(contentLevel);
  const order: LatihanQuestion[] = (section.plan ?? []).map((slot) => {
    const target = topic.items[slot.item] ?? topic.items[0];
    return { kind: slot.kind, target, distractors: shuffle(topic.items.filter((i) => i !== target)).slice(0, distractorCount) };
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
      playWrongTone();
      vibrateDevice(160);
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
    // Topik warna: gambar kid-friendly (`example.emoji` — benda/binatang/
    // buah/bintang konkret, mis. 🍓/⭐/🐻, BUKAN swatch warna polos) SUPAYA
    // anak genuinely paham makna kata yang didengar, bukan cocok-cocok
    // warna murni dari mata (leak swatch, ditemukan sesi lalu). Topik lain
    // TIDAK disentuh (item.emoji-nya sendiri gambar konkret objek yg
    // DITANYA, aman apa adanya).
    // Topik angka: `item.emoji`-nya SENDIRI adalah digit (mis. "2️⃣" utk
    // "Two") — bocor literally angkanya sendiri, anak bisa cocokkan tanpa
    // paham kata Inggrisnya sama sekali — laporan user. Ikon digitnya
    // dihapus (kartu jadi teks-saja — angka TIDAK py "gambar benda konkret"
    // pengganti yang aman/relevan spt 🍓/⭐ warna, ilustrasi hitung sudah
    // ada di scene `drawSentence`).
    //
    // 🔒 Revisi user ("revisi aturan sebelumnya" — topik warna sempat
    // GAMBAR-SAJA di sini/tab 'hear'/'toEn'/'toId' TAPI teks-saja di
    // `drawSentence`, dianggap tidak konsisten: "kadang gak ada text, kadang
    // gak ada gambar") — teks label warna TIDAK LAGI dikosongkan di sini,
    // SELALU gambar+teks BERSAMAAN persis topik biasa (kartu 'hear' topik
    // biasa MEMANG sudah lama begini — audio Inggris + teks Inggris yang
    // SAMA, jadi warna dulu sengaja beda sendiri, sekarang disamakan).
    // AMAN krn gambar yang dipakai tetap ilustrasi (bukan swatch) — beda
    // dari `drawSentence` (poin di bawah, TIDAK ikut diubah): topik warna/
    // angka/bentuk di SANA py `scene` (gambar milik jawaban BENAR SAJA
    // ditampilkan duluan di atas kalimat) — kalau kartu jawaban di situ IKUT
    // dikasih gambar per-opsi, anak tinggal cocokkan gambar scene vs gambar
    // kartu (leak match-gambar yang lebih parah dari leak lama), makanya
    // `drawSentence` WAJIB tetap teks-saja utk 3 topik itu, TIDAK sama dgn
    // fungsi ini yang TIDAK py scene sama sekali.
    const colorTopic = isColorTopic(topic);
    const numberTopic = isNumberTopic(topic);
    const shapeTopic = isShapeTopic(topic);
    const dayTopic = isDayTopic(topic);
    // 🔒 Explorer ke atas: SEMUA kartu jawaban teks-saja tanpa terkecuali
    // (permintaan user, lihat komentar `isAboveStarter`) — dicek PALING
    // DULU sebelum cabang per-topik lain, supaya konsisten "harder tier"
    // menang drpd treatment khusus warna/dst (yang notabene topiknya cuma
    // ada di Little Stars/Starter, jadi tidak akan pernah tabrakan nyata).
    const aboveStarter = isAboveStarter(contentLevel);
    const optEmoji = (o: VocabItem) =>
      aboveStarter ? '' : colorTopic ? o.example.emoji : numberTopic || shapeTopic || dayTopic ? '' : itemGlyph(topic.id, o);

    let promptHtml: string;
    let cardsHtml: string;
    let playPrompt: () => void;
    if (q.kind === 'toEn') {
      // Tanpa emoji target di prompt (dulu ada) — sekarang tiap kartu opsi
      // py emoji-nya sendiri, jadi emoji di prompt cuma jadi celah nebak
      // lewat cocok-gambar tanpa perlu paham arti kata (permintaan user:
      // gambar sbg analogi per PILIHAN, bukan bocoran jawaban).
      promptHtml = `<p class="reading-question">Apa bahasa Inggrisnya <b>"${q.target.id}"</b>?</p><div class="speak-row"><button class="speak-btn" type="button" data-action="replay">🔊 Dengar Lagi</button></div>`;
      cardsHtml = answerCardsHtml(opts.map((o) => ({ emoji: optEmoji(o), label: o.en })), 'pick');
      playPrompt = () => speakLocalized(q.target.id, 'id-ID');
    } else if (q.kind === 'toId') {
      promptHtml = `<p class="reading-question">Apa bahasa Indonesianya <b>"${q.target.en}"</b>?</p><div class="speak-row"><button class="speak-btn" type="button" data-action="replay">🔊 Dengar Lagi</button></div>`;
      cardsHtml = answerCardsHtml(opts.map((o) => ({ emoji: optEmoji(o), label: o.id })), 'pick');
      playPrompt = () => speak(q.target.en);
    } else {
      // Kartu SELALU emoji+teks (permintaan user) — bekas cabang
      // `iconAmbiguous` emoji-only vs teks-only sudah tidak perlu lagi:
      // teks di tiap kartu otomatis menghilangkan ambiguitas emoji ekspresi,
      // jadi berlaku sama utk topik biasa maupun `iconAmbiguous`. Teks
      // Indonesia di topik `iconAmbiguous` tetap dipertahankan sbg konteks
      // TAMBAHAN (bukan pengganti kartu).
      promptHtml = `<div class="speak-row"><button class="speak-btn" data-action="replay">🔊 Dengar Lagi</button></div>${topic.iconAmbiguous ? `<div class="id-text">${q.target.id}</div>` : ''}`;
      cardsHtml = answerCardsHtml(opts.map((o) => ({ emoji: optEmoji(o), label: o.en })), 'pick');
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
    wireHint(container, opts, q.target, () => (hintUsedThisSlot = true), latihanHintEliminateCount(contentLevel));
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
    // Topik warna: kata target (adjective) tidak pernah = benda yg
    // digambarkan (noun) di example.emoji, jadi ilustrasi ini aman
    // ditampilkan tanpa bocorin jawaban — laporan user: kalimat spt "The
    // hat is ___." tampil TANPA gambar topi sama sekali sebelum ini.
    // Topik angka: sama persis, kalimat spt "I see ___ stars." jg tampil
    // TANPA gambar bintangnya (laporan user) — bedanya ilustrasi angka
    // WAJIB diulang SESUAI NILAI kata target (mis. "two dogs" → 🐶🐶, bukan
    // 🐶 tunggal, pola sama `buildNumberQuestion`) supaya anak bisa MENGHITUNG
    // gambarnya sbg bantuan visual — `example.emoji` dinormalisasi jadi
    // SATU emoji saja di content.ts (bukan pre-diulang manual), diulang di
    // sini via `numberWordValue()` biar konsisten semua item.
    const colorTopic = isColorTopic(topic);
    const numberTopic = isNumberTopic(topic);
    const shapeTopic = isShapeTopic(topic);
    const dayTopic = isDayTopic(topic);
    // 🔒 Explorer ke atas: kartu jawaban teks-saja jg di sini (co-alasan dgn
    // `drawAudio`, lihat komentar `isAboveStarter`) — topik biasa (non
    // color/number/shape/day) di level ini TIDAK PERNAH py `scene` sama
    // sekali (lihat blok if/else di bawah, cuma 3 topik itu yang py scene),
    // jadi aman, tidak ada risiko leak match-gambar spt yang dijelaskan di
    // `drawAudio` (itu KHUSUS 3 topik yang py scene, semuanya cuma ada di
    // Little Stars/Starter — tidak pernah kena `aboveStarter` scr nyata).
    const aboveStarter = isAboveStarter(contentLevel);
    let scene = '';
    if (colorTopic) {
      scene = `<div class="big-emoji" aria-hidden="true">${q.target.example.emoji}</div>`;
    } else if (numberTopic) {
      const count = numberWordValue(q.target.en) ?? 1;
      scene = `<div class="big-emoji" style="letter-spacing:8px;font-size:clamp(30px,8vw,48px)" aria-hidden="true">${q.target.example.emoji.repeat(count)}</div>`;
    } else if (shapeTopic) {
      scene = `<div class="big-emoji" aria-hidden="true">${q.target.example.emoji}</div>`;
    }

    container.innerHTML = `
      <div class="latihan-head">
        <span class="stage-badge">🎯 Lengkapi Kalimat</span>
        ${hintButtonHtml}
      </div>
      ${quizNavHtml(round, order.length, slotStatus)}
      <div class="id-text">Soal ${round + 1} dari ${order.length}</div>
      ${scene}
      <div class="en-text">${blanked}</div>
      <div class="id-text">${q.target.example.id}</div>
      ${answerCardsHtml(
        // Topik angka & bentuk: ikon opsi (digit "3️⃣" / glyph bentuk "❤️")
        // literally = jawabannya sendiri — dihapus jg, co-alasan dgn topik
        // warna (yang gambarnya sudah dipindah ke satu-satunya `scene` di
        // atas, bukan diulang lagi di tiap kartu jawaban). Topik hari: ikon
        // opsi (aktivitas sembarang, mis. 🏫 utk "Monday") TIDAK merepresentasikan
        // jawabannya sama sekali (beda dari angka/bentuk yg literally leak) —
        // tetap dihapus krn cuma dekorasi tidak relevan yg berpotensi
        // mengajarkan asosiasi keliru, BUKAN diganti scene apa pun (topik hari
        // tidak py ilustrasi pengganti yg aman/relevan spt warna/bentuk).
        opts.map((o) => ({ emoji: aboveStarter || colorTopic || numberTopic || shapeTopic || dayTopic ? '' : itemGlyph(topic.id, o), label: o.en })),
        'pickWord'
      )}
      <div class="feedback" id="fb"></div>
    `;
    wireHint(container, opts, q.target, () => (hintUsedThisSlot = true), latihanHintEliminateCount(contentLevel));
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

export function runTantangan(container: HTMLElement, topic: VocabTopic, onDone: OnDone, level: LevelKey, contentLevel: LevelKey): void {
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
  // requestSync() dipanggil pas TIAP tab Tantangan tuntas (bukan cuma di
  // akhir semua 3 tab) — permintaan user "submit ke db pas section selesai,
  // bukan auto-sync tiap progress kecil", 3 dari 4 titik trigger yang
  // diminta (1 lagi: Latihan Inti, dipasang di app.ts `runStage`).
  function openEja(): void {
    container.innerHTML = shellHtml('eja');
    setHandlers({ tabEja: openEja, tabSusun: openSusun, tabPenggunaan: openPenggunaan });
    runEjaKata(
      container.querySelector<HTMLElement>('#tantanganStage')!,
      topic.id,
      topic.items,
      () => {
        requestSync();
        openSusun();
      },
      level,
      contentLevel
    );
  }

  function openSusun(): void {
    container.innerHTML = shellHtml('susun');
    setHandlers({ tabEja: openEja, tabSusun: openSusun, tabPenggunaan: openPenggunaan });
    runSusunKalimat(
      container.querySelector<HTMLElement>('#tantanganStage')!,
      topic.id,
      topic.items,
      () => {
        requestSync();
        openPenggunaan();
      },
      level,
      contentLevel
    );
  }

  function openPenggunaan(): void {
    container.innerHTML = shellHtml('penggunaan');
    setHandlers({ tabEja: openEja, tabSusun: openSusun, tabPenggunaan: openPenggunaan });
    runUcapan(
      container.querySelector<HTMLElement>('#tantanganStage')!,
      topic.id,
      topic.items,
      () => {
        requestSync();
        onDone();
      },
      level
    );
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

/**
 * 7 topik PERTAMA Little Stars (permintaan user: "biar anak kecil tidak
 * kaget, dikasih yang mudah dulu sebagai pengenalan") — Eja Kata & Susun
 * Kalimat di Tantangan utk topik-topik ini AUTO nunjukin petunjuk (bukan
 * nunggu tap tombol), dari topik ke-8 (`buah-buahan`) dst kembali ke
 * perilaku normal (petunjuk cuma muncul kalau di-tap). Daftar id EKSPLISIT
 * (bukan "7 pertama di array VOCAB_TOPICS_LITTLE_STARS" yang dihitung
 * runtime) — sengaja, supaya kalau urutan topik di content.ts berubah/ada
 * topik baru disisipkan nanti, cakupan "7 topik pengenalan" ini TETAP
 * merujuk topik yang SAMA persis (bukan ikut geser diam-diam).
 */
const EASY_ONBOARDING_TOPIC_IDS = new Set([
  'salam-sopan-santun', // 1. Salam & Sopan Santun (Greetings & Manners)
  'kenal-warna', // 2. Kenal Warna (Colors)
  'angka-pertama', // 3. Angka 1–10 (Numbers 1–10)
  'bentuk', // 4. Bentuk (Shapes)
  'keluargaku', // 5. Keluargaku (My Family)
  'tubuhku', // 6. Anggota Tubuhku (My Body)
  'hewan-peliharaan', // 7. Hewan Peliharaan & Ternak (Pets & Farm Animals)
]);

function isEasyOnboardingTopic(topicId: string): boolean {
  return EASY_ONBOARDING_TOPIC_IDS.has(topicId);
}

/** Bagian 1 dari Tantangan: eja kata lewat chip huruf acak — TANPA hint
 *  (permintaan user: Tantangan sengaja tanpa clue, beda dari Latihan Inti).
 *  PERSIS `TANTANGAN_TAB_SIZE` soal, kata tunggal saja (`ensureTantanganPlan`
 *  + `singleWordItems`).
 *
 * `contentLevel` (param BARU, lihat komentar `tantanganRevealThreshold`) —
 * ambang reveal otomatis "💡 Jawabannya" mundur dari 2x salah jadi 3x salah
 * di Achiever/Trailblazer (permintaan user "pembeda antar level di atas
 * starter"), Explorer/Adventurer TETAP 2x spt semula. */
export function runEjaKata(
  container: HTMLElement,
  topicId: string,
  allItems: VocabItem[],
  onDone: OnDone,
  level: LevelKey,
  contentLevel: LevelKey
): void {
  const dayItems = isDayItems(allItems);
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

  // 🔒 Auto-hint 7 topik pengenalan Little Stars (permintaan user, lihat
  // komentar `EASY_ONBOARDING_TOPIC_IDS`) — SAMA PERSIS logic tombol "hint"
  // manual di bawah (60% posisi acak), cuma dipicu otomatis tiap kata baru
  // (bukan nunggu tap), supaya anak yang baru pertama kali main tidak
  // kaget lihat papan huruf kosong. Topik ke-8 dst TIDAK kena ini sama
  // sekali — tetap tombol manual apa adanya.
  function maybeAutoHint(it: VocabItem): void {
    if (!isEasyOnboardingTopic(topicId)) return;
    hintUsed = true;
    const hintCount = Math.round(it.en.length * 0.6);
    const positions = shuffle(Array.from({ length: it.en.length }, (_, i) => i));
    hintedSlots = new Set(positions.slice(0, hintCount));
  }

  function goTo(i: number): void {
    round = Math.min(Math.max(i, 0), items.length - 1);
    setSectionCursor('vocabulary', topicId, 'tantangan-eja', round);
    const it = items[round];
    answered = false;
    hintUsed = false;
    hintedSlots = new Set();
    maybeAutoHint(it);
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
    maybeAutoHint(it);
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
    // 7 topik pengenalan Little Stars (`isEasyOnboardingTopic`) juga
    // menampilkan jawaban ini SEJAK AWAL (bukan cuma setelah 2x gagal) —
    // permintaan user: tahap pengenalan biar anak lihat langsung
    // jawabannya di bawah tombol "🔊 Dengar Kata", papan susun tetap wajib
    // diisi manual (bukan otomatis terisi penuh).
    const showAnswer = isEasyOnboardingTopic(topicId) || wrongSoFar >= tantanganRevealThreshold(contentLevel);
    const answerHintHtml =
      showAnswer ? `<p class="meta" style="margin:4px 0 0;text-align:center">💡 Jawabannya: <b>${it.en.toUpperCase()}</b></p>` : '';

    container.innerHTML = `
      ${quizNavHtml(round, items.length, slotStatus)}
      <div class="id-text">Kata ${round + 1} dari ${items.length}</div>
      ${dayItems ? '' : `<div class="big-emoji">${itemGlyph(topicId, it)}</div>`}
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
            container.querySelector('.answer-row')?.classList.add('is-wrong');
            playWrongTone();
            vibrateDevice(160);
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
      <div class="big-emoji" style="font-size:40px;">${exampleGlyph(topicId, it)}</div>
      <div class="en-text">${ex.en}</div>
      <div class="id-text">${ex.id}</div>
      <div class="speak-row">
        <button class="speak-btn" data-action="replay">🔊 Dengar Contoh</button>
        ${sttSupported ? `<button class="speak-btn" id="micBtn" data-action="mic">🎤 Ucapkan</button>` : ''}
      </div>
      <div id="micResult"></div>
      <div class="feedback" id="fb"></div>
      ${sttSupported ? '' : `<p class="meta" style="text-align:center">Mikrofon tidak didukung browser ini</p><button class="ghost-btn" data-action="skip">✅ Aku Sudah Coba Ucapkan</button>`}
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
 * Kata "jebakan" (decoy) ACAK ≥2 dari kata SIBLING (kalimat contoh item LAIN
 * di topik yang sama) — permintaan user: "pada susun kalimat di atas level
 * starter tambahkan min 2 kata random tambahan untuk jebakan" (Explorer ke
 * atas: bank kata TIDAK LAGI persis sejumlah kata jawaban, jadi anak tidak
 * bisa asal taruh SEMUA kata yg tersedia — WAJIB paham urutan/makna kalimat
 * buat menyisihkan kata yg tidak relevan). Diambil dari kata SIBLING (bukan
 * kosakata acak di luar topik) — konsisten pola distraktor MCQ lain di file
 * ini (SELALU dari topik yang sama, sudah dikenal anak lewat kata lain di
 * topik ini, bukan kosakata baru yg membingungkan). Kata yang SUDAH ada di
 * kalimat target (case-insensitive) DIKECUALIKAN, biar tidak ada 2 chip
 * kembar yg membingungkan mana yang "asli". Little Stars/Starter TIDAK
 * PERNAH manggil fungsi ini (caller cek `isAboveStarter` dulu) — tetap SAMA
 * PERSIS spt sebelumnya (permintaan user eksplisit "masih seperti sekarang").
 *
 * 🔒 `count` (param BARU) — jumlahnya naik bertahap per level (`susunDecoyCount`,
 * 2 Explorer/Adventurer → 3 Achiever → 4 Trailblazer), bukan flat 2 di semua
 * 4 level "di atas Starter" (permintaan user: "pembeda antar level di atas
 * starter", riset Cambridge Movers→Flyers→KET progresif nambah opsi
 * berlebih/jebakan seiring tier naik).
 */
function pickDecoyWords(allItems: VocabItem[], current: VocabItem, targetWords: string[], count: number): string[] {
  const exclude = new Set(targetWords.map((w) => w.toLowerCase()));
  const pool = new Set<string>();
  allItems
    .filter((it) => it !== current)
    .forEach((it) => {
      it.example.en
        .replace('.', '')
        .split(' ')
        .forEach((w) => {
          if (!exclude.has(w.toLowerCase())) pool.add(w);
        });
    });
  return shuffle(Array.from(pool)).slice(0, Math.min(count, pool.size));
}

/**
 * Tab "🔤 Susun Kalimat" — kalimat Indonesia (`example.id`) ditampilkan sbg
 * soal, anak susun kata Inggris (`example.en`) jadi terjemahannya lewat word
 * bank. TANPA hint sebelum 2x gagal (Tantangan). Dulu "fase susun" di dalam
 * Contoh Penggunaan (`runContohPenggunaan`) — sekarang tab BERDIRI SENDIRI
 * (permintaan user: 3 tab terpisah, 5 soal masing-masing).
 *
 * `contentLevel` (param BARU, lihat komentar `isAboveStarter`/
 * `pickDecoyWords`) — Explorer ke atas bank kata dapat ≥2 kata jebakan
 * tambahan, Little Stars/Starter TETAP persis kata jawaban saja spt semula.
 */
export function runSusunKalimat(container: HTMLElement, topicId: string, allItems: VocabItem[], onDone: OnDone, level: LevelKey, contentLevel: LevelKey): void {
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
    // 🔒 Kata jebakan (permintaan user, lihat komentar `pickDecoyWords`) —
    // dihitung SEKALI per soal (bukan di-reroll tiap `paint()`/hint), idx-nya
    // MULAI dari `words.length` supaya tidak pernah tabrakan dgn idx kata
    // jawaban asli (0..words.length-1) yang dipakai `applyHint()`/`unpick`/
    // `removeLastWord` buat cocok-cocokkan tile.
    const decoyWords = isAboveStarter(contentLevel)
      ? pickDecoyWords(allItems, it, words, susunDecoyCount(contentLevel))
      : [];
    function buildBank(): { w: string; used: boolean; idx: number }[] {
      const real = words.map((w, i) => ({ w, used: false, idx: i }));
      const decoys = decoyWords.map((w, i) => ({ w, used: false, idx: words.length + i }));
      return shuffle([...real, ...decoys]);
    }
    let answer: { w: string; idx: number }[] = [];
    let bank = buildBank();
    let answered = false;
    // 🔒 "💡 Petunjuk" BARU (permintaan user "tambahkan petunjuk di susun
    // kalimat" — dulu di sini TANPA hint eksplisit sama sekali, cuma reveal
    // otomatis "💡 Jawabannya" setelah 2x gagal) — pola SAMA PERSIS Eja Kata:
    // pre-isi SEBAGIAN (60%) jawaban, anak tetap menyusun SISANYA sendiri
    // (bukan reveal teks penuh). Beda dari Eja Kata (slot independen per
    // huruf): kata di sini harus BERURUTAN, jadi yang di-hint SELALU
    // `hintCount` kata PERTAMA (bukan posisi acak) — kata sisanya baru
    // disusun anak dari bank. `hintCount` dipakai jg buat MELINDUNGI bagian
    // hint dari terhapus (clear/removeLastWord/unpick), non-punitive sama
    // spt Eja Kata "Coba Lagi tetap pertahankan hint".
    let hintUsed = false;
    let hintCount = 0;

    function applyHint(): void {
      hintUsed = true;
      hintCount = Math.round(words.length * 0.6);
      bank = buildBank();
      answer = [];
      for (let i = 0; i < hintCount; i++) {
        const tile = bank.find((b) => b.idx === i)!;
        tile.used = true;
        answer.push(tile);
      }
    }

    // Auto-hint 7 topik pengenalan Little Stars (permintaan user, lihat
    // komentar `EASY_ONBOARDING_TOPIC_IDS`) — sama alasan Eja Kata.
    if (isEasyOnboardingTopic(topicId)) applyHint();

    function paint(): void {
      // "Petunjuk" jawaban setelah 2x gagal — TETAP ada sbg jaring pengaman
      // (permintaan user cuma minta TAMBAH tombol manual, bukan mencabut
      // reveal otomatis ini) — dibaca dari `wrongCount` slot yang sudah
      // tersimpan, bukan counter baru.
      const wrongSoFar = getSlot('vocabulary', topicId, 'tantangan-susun', round)?.w ?? 0;
      // Sama pola Eja Kata di atas — 7 topik pengenalan Little Stars
      // tampilkan jawaban ini sejak awal, di bawah teks soal (`.en-text`),
      // papan susun kata tetap wajib diisi manual oleh anak.
      const showAnswer = isEasyOnboardingTopic(topicId) || wrongSoFar >= tantanganRevealThreshold(contentLevel);
      const answerHintHtml =
        showAnswer ? `<p class="meta" style="margin:6px 0 0;text-align:center">💡 Jawabannya: <b>${ex.en}</b></p>` : '';

      container.innerHTML = `
        <span class="stage-badge">🌟 Terjemahkan</span>
        ${quizNavHtml(round, items.length, susunStatus)}
        <div class="id-text">Susun jadi Bahasa Inggris dari kalimat ini · ${round + 1} dari ${items.length}</div>
        <div class="en-text" style="color:var(--c-vocab)">"${ex.id}"</div>
        ${answerHintHtml}
        <div class="answer-row ${answer.length ? '' : 'empty'}" style="margin-top:10px">
          ${answer.map((a, ai) => `<span class="chip placed${ai < hintCount ? ' hint' : ''}" data-action="unpick" data-payload="${ai}">${a.w}</span>`).join('')}
        </div>
        <div class="bank-row">
          ${bank.map((b, bi) => `<span class="chip ${b.used ? 'hidden' : ''}" data-action="pick" data-payload="${bi}">${b.w}</span>`).join('')}
        </div>
        <div class="feedback" id="fb"></div>
        ${
          answered
            ? ''
            : `<div class="letter-actions">
          <button class="ghost-btn slim" type="button" id="hintBtn" data-action="hint" ${hintUsed ? 'disabled' : ''}>💡 Petunjuk</button>
          <button class="ghost-btn" type="button" data-action="removeLastWord" ${answer.length <= hintCount ? 'disabled' : ''}>⌫ Hapus Kata</button>
          <button class="ghost-btn" type="button" data-action="clear">🔄 Bersihkan</button>
        </div>`
        }
      `;
      wireQuizNav(goTo);

      setHandlers({
        hint: () => {
          if (hintUsed || answered) return;
          applyHint();
          paint();
        },
        clear: () => {
          if (answered) return;
          // Bagian hint TETAP dipertahankan (non-punitive, sama pola Eja
          // Kata) — "Bersihkan" cuma buang kata yang anak taruh SENDIRI.
          answer = answer.slice(0, hintCount);
          bank.forEach((b) => {
            b.used = b.idx < hintCount;
          });
          paint();
        },
        // Hapus SATU kata terakhir yang ditaruh (permintaan user: fitur
        // remove per-kata, berdampingan dgn "Bersihkan") — beda dari
        // `unpick` yang bisa hapus kata mana pun (klik chip-nya langsung).
        // Kata hint (index < hintCount) TIDAK bisa dihapus lewat sini.
        removeLastWord: () => {
          if (answered || answer.length <= hintCount) return;
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
          if (ai < hintCount) return; // kata hint tidak bisa dilepas lewat klik langsung
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
        playCorrectTone();
        fireConfetti();
        fb.textContent = pickPraise(level);
        fb.className = 'feedback good';
        speak(ex.en);
      } else {
        recordAttempt(false);
        container.querySelector('.answer-row')?.classList.add('is-wrong');
        playWrongTone();
        vibrateDevice(160);
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
          // Hint yang sudah dipakai TETAP dipertahankan (non-punitive, sama
          // pola Eja Kata) — bukan reset bersih spt sebelumnya.
          if (hintUsed) applyHint();
          else {
            answer = [];
            bank = shuffle(words.map((w, i) => ({ w, used: false, idx: i })));
          }
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

/**
 * Ronde "Kelompokkan" berdiri sendiri — dipakai Raja Kelompok Game Hub
 * (`app.ts`, `materi/game.md` §7 kandidat #1), BUKAN bagian dari Tantangan
 * Vocab 3-tab. Reuse PERSIS `drawSortQuestion` (mekanik sama dgn mini-game
 * Kenalan 🎮), tapi jadi rangkaian N soal quiz-dot — pola sama persis
 * `runEjaKata`/`runSusunKalimat` di atas (plan tersimpan per section,
 * resumable, TANPA hint krn soal biner 2 opsi, sama alasan Grammar/Listening
 * "Benar atau Salah"). Section name `'tantangan-kelompok'` — BARU, beda dari
 * 3 section Tantangan lama (`tantangan-eja`/`tantangan-susun`/`tantangan-
 * ucap`) supaya progresnya tidak numpuk sama Tantangan asli topik itu.
 * Caller (app.ts) WAJIB sudah memfilter topik lewat `isSortableTopic()`
 * sebelum manggil ini — fungsi ini sendiri tidak fallback kalau topiknya
 * ternyata tidak sortable.
 */
export function runKelompokkan(
  container: HTMLElement,
  topicId: string,
  allItems: VocabItem[],
  baskets: NonNullable<VocabTopic['sortBaskets']>,
  onDone: OnDone,
  level: LevelKey
): void {
  const eligible = allItems.filter((it) => it.group === 'a' || it.group === 'b');
  const items = ensureTantanganPlan(topicId, 'tantangan-kelompok', eligible);
  let round = Math.min(Math.max(getSection('vocabulary', topicId, 'tantangan-kelompok')?.cursor ?? 0, 0), items.length - 1);

  const slotStatus = (i: number): 0 | 1 | 2 => getSlot('vocabulary', topicId, 'tantangan-kelompok', i)?.st ?? 0;

  function goTo(i: number): void {
    round = Math.min(Math.max(i, 0), items.length - 1);
    setSectionCursor('vocabulary', topicId, 'tantangan-kelompok', round);
    draw();
  }

  function draw(): void {
    if (round >= items.length) return onDone();
    const it = items[round];
    drawSortQuestion(container, baskets, it, onAnswer, quizNavHtml(round, items.length, slotStatus));
    wireQuizNav(goTo);
  }

  function onAnswer(correct: boolean, btn: HTMLElement): void {
    lockOptionButtons(container);
    const fb = container.querySelector<HTMLElement>('#fb')!;
    const it = items[round];
    // 'kelompok' — SATU-SATUNYA `recordAttempt` di file ini yang kirim
    // `gameKey` (fungsi lain di sini murni Vocab skill, bukan Game Hub) —
    // lihat komentar `GAME_KEY` `games/wordmatch.ts`.
    if (correct) {
      recordAttempt(true, 'kelompok');
      btn.classList.add('correct', 'win-burst');
      playCorrectTone();
      fireConfetti();
      fb.textContent = pickPraise(level);
      fb.className = 'feedback good';
    } else {
      recordAttempt(false, 'kelompok');
      btn.classList.add('wrong');
      playWrongTone();
      vibrateDevice(160);
      fb.textContent = pickEncourage(level);
      fb.className = 'feedback bad';
    }
    markSlotAnswered('vocabulary', topicId, 'tantangan-kelompok', round, correct, { itemRef: it.en });
    recordEvent({
      kind: 'answer',
      skill: 'vocabulary',
      topicId,
      section: 'tantangan-kelompok',
      slot: round,
      itemRef: it.en,
      activity: 'sort',
      correct,
    });
    fb.insertAdjacentHTML('afterend', roundActionsHtml(round === items.length - 1));
    setHandlers({
      tryAgainRound: () => draw(),
      nextRound: () => {
        round += 1;
        setSectionCursor('vocabulary', topicId, 'tantangan-kelompok', Math.min(round, items.length - 1));
        draw();
      },
    });
  }

  draw();
}

/**
 * "Ingat & Buka" / Memory Match — Raja Ingatan Game Hub (`materi/game.md`
 * §4/§7 kandidat #2, "Ingat & Buka" — GAP sebelumnya, belum pernah dipakai
 * di skill manapun). Beda task-shape dari SEMUA mekanik lain di file ini:
 * bukan 1 soal-1 jawaban berurutan, tapi grid kartu tertutup — anak buka 2
 * kartu tiap giliran, cari PASANGAN yang cocok (working memory spasial,
 * bukan sekadar recognition). Pasangan dikonstruksi LANGSUNG dari
 * `VocabItem` yang sudah ada (kartu A = emoji+`id`, kartu B = teks `en`) —
 * TANPA data baru, jadi bisa jalan di topik VOCAB MANAPUN di level manapun,
 * beda dari Kelompokkan yang butuh `sortBaskets` per topik.
 */
const MEMORY_PAIR_COUNT = 3;

interface MemoryCard {
  pairId: number;
  face: 'id' | 'en';
  matched: boolean;
}

export function runMemoryMatch(container: HTMLElement, topic: VocabTopic, onDone: OnDone, level: LevelKey): void {
  const pairItems = shuffle(topic.items).slice(0, Math.min(MEMORY_PAIR_COUNT, topic.items.length));
  let cards: MemoryCard[] = shuffle(
    pairItems.flatMap((_, i) => [
      { pairId: i, face: 'id' as const, matched: false },
      { pairId: i, face: 'en' as const, matched: false },
    ])
  );
  let opened: number[] = [];
  let score = 0;
  let busy = false;
  // 🔒 Indeks 2 kartu yang lagi di-flash MERAH (CLAUDE.md "🔒 Aturan Wajib:
  // Notifikasi Jawaban Salah") — kosong lagi begitu ditutup, TIDAK dipakai
  // utk logic apa pun selain render `.is-wrong`.
  let wrongPair: number[] = [];

  function cardLabel(c: MemoryCard): { emoji: string; text: string } {
    const it = pairItems[c.pairId];
    return c.face === 'id' ? { emoji: it.emoji, text: it.id } : { emoji: '', text: it.en };
  }

  function paint(): void {
    const matchedPairs = cards.filter((c) => c.matched).length / 2;
    container.innerHTML = `
      <div class="mm-head">
        <span class="mm-score">SKOR: <b>${score}</b></span>
        <span class="tag">${matchedPairs}/${pairItems.length}</span>
      </div>
      <div class="mm-grid">
        ${cards
          .map((c, i) => {
            const isOpen = c.matched || opened.includes(i);
            const label = cardLabel(c);
            return `
            <button class="mm-card ${isOpen ? 'is-open' : ''} ${c.matched ? 'is-matched' : ''} ${wrongPair.includes(i) ? 'is-wrong' : ''}" type="button"
              data-action="flip" data-payload="${i}" ${isOpen ? 'disabled' : ''} aria-label="${isOpen ? label.text : 'Kartu tertutup'}">
              ${
                isOpen
                  ? `${c.matched ? '<span class="mm-check" aria-hidden="true">✅</span>' : ''}${label.emoji ? `<span class="mm-emoji">${label.emoji}</span>` : ''}<span class="mm-text">${label.text}</span>`
                  : `<span class="mm-mark" aria-hidden="true">❓</span>`
              }
            </button>`;
          })
          .join('')}
      </div>
      <div class="feedback" id="fb"></div>
    `;
    setHandlers({ flip: (payload) => flip(Number(payload)) });
  }

  function flip(i: number): void {
    if (busy || cards[i].matched || opened.includes(i) || opened.length >= 2) return;
    opened.push(i);
    paint();
    if (opened.length < 2) return;

    busy = true;
    const [a, b] = opened;
    const isMatch = cards[a].pairId === cards[b].pairId && cards[a].face !== cards[b].face;
    setTimeout(() => {
      const fb = container.querySelector<HTMLElement>('#fb');
      if (isMatch) {
        cards[a].matched = true;
        cards[b].matched = true;
        score += 10;
        recordAttempt(true);
        playCorrectTone();
        fireConfetti();
        if (fb) {
          fb.textContent = pickPraise(level);
          fb.className = 'feedback good';
        }
      } else {
        recordAttempt(false);
        playWrongTone();
        vibrateDevice(160);
        if (fb) {
          fb.textContent = pickEncourage(level);
          fb.className = 'feedback bad';
        }
        // Flash merah dulu SELAGI 2 kartu masih terbuka (`opened` belum
        // dikosongkan) — baru ditutup lagi setelah shake sempat kebaca,
        // bukan langsung ketutup di frame yang sama (CLAUDE.md "🔒 Aturan
        // Wajib: Notifikasi Jawaban Salah").
        wrongPair = [a, b];
        paint();
        setTimeout(() => {
          wrongPair = [];
          opened = [];
          busy = false;
          paint();
        }, 380);
        return;
      }
      opened = [];
      busy = false;
      paint();

      if (cards.every((c) => c.matched)) {
        recordEvent({ kind: 'answer', skill: 'vocabulary', topicId: topic.id, activity: 'memory-match', correct: true, score });
        const doneFb = container.querySelector<HTMLElement>('#fb');
        if (doneFb) doneFb.insertAdjacentHTML('afterend', roundActionsHtml(true));
        setHandlers({
          tryAgainRound: () => {
            cards = shuffle(cards.map((c) => ({ ...c, matched: false })));
            opened = [];
            score = 0;
            paint();
          },
          nextRound: () => onDone(),
        });
      }
    }, 700);
  }

  paint();
}
