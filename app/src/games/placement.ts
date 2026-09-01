/**
 * "First Placement Test" — kid-friendly filter WAJIB (CLAUDE.md): TANPA timer
 * countdown (versi dewasa 30 menit — ditolak, PRD §4.6), audio-first tap-
 * emoji, copy ajakan bukan evaluatif, retry-friendly per soal, skip jelas
 * tanpa rasa bersalah ("Nanti Aja"). 5 skill sekarang mekanik NYATA, bukan
 * cuma pill di intro (doc/first_placement_test.md §4):
 *   - Vocab: dua arah (TTS Indonesia→teks Inggris, atau TTS Inggris→teks Indonesia) — tap teks.
 *   - Reading: baca `story` SENDIRI (silent, tanpa TTS) → jawab `question` → tap gambar,
 *     format riset Cambridge Pre A1 Starters Reading Task 2/5 (§Reading).
 *   - Listening: reuse pola games/listening.ts `runTantangan` — cerita mini → 1 pertanyaan → tap emoji.
 *   - Speaking lapis 1 (DI-SKOR): format recognition (preseden TOEFL Primary) — deterministik.
 *   - Speaking lapis 2 (TIDAK menentukan level, TAPI ikut angka skor total — 13 soal
 *     pilihan-ganda + 3 item mic = 16, lihat portal/lib/placement-scoring.ts): mic terbuka,
 *     selalu berhasil ke anak; skor kata proporsional (`wordRatio`) + `matched` (turunan ambang
 *     dari rasio yang sama) + `confidence` tetap dievaluasi & dikirim sebagai sinyal internal
 *     (PRD §13.1 — ASR anak tidak selalu akurat, jadi tidak boleh sampai menurunkan level).
 * Maks 2 percobaan per anak (permintaan user — supaya kalau Iterasi 2 pakai
 * LLM gratis, penggunaannya otomatis ikut terkontrol) — digating di app.ts
 * SEBELUM layar ini dibuka (renderPlacementLimitReached), bukan di sini.
 */
import { setHandlers } from '../interaction';
import {
  listenAndRecordOnce,
  playCorrectTone,
  playTryAgainTone,
  speak,
  speakLocalized,
  speakSequence,
  stopSpeaking,
  sttSupported,
  vibrateDevice,
  wordMatchDetail,
} from '../speech';
import { PLACEMENT_OPENMIC_ITEMS, PLACEMENT_QUESTIONS, type PlacementQuestion } from '../placement-test-data';
import { BOSS_NAME, LEVELS } from '../content';
import {
  skipPlacementTest,
  submitPlacementTest,
  ApiRequestError,
  type PlacementAnswer,
} from '../account';
import type { OnDone } from '../types';
import { shuffle } from '../util';

export const LEVEL_LABEL: Record<string, string> = {
  starter: '🌱 Starter',
  explorer: '🧭 Explorer',
  adventurer: '🚀 Adventurer',
};

/**
 * Feedback jawaban — teks + animasi saja, TANPA suara (permintaan user:
 * ketersediaan voice Bahasa Indonesia di browser tidak konsisten, jadi
 * lebih aman diam saja daripada kadang salah lafal). Animasi "benar" ada
 * di CSS `.pt-celebrate` (burst bintang). Santai ala teman tapi sopan,
 * dirotasi acak biar tidak berasa robot diulang 15x. "Salah" TETAP tidak
 * pernah ditulis eksplisit (CLAUDE.md poin 2) — nadanya tetap mengajak
 * lanjut, bukan menghakimi.
 */
const CORRECT_TEXTS = ['Wow, hebaaaat! 🎉', 'Keren banget, lanjut yuk! ✨', 'Betul tuh, mantap! 🌟', 'Yes, kamu jago! 🎈', 'Asyiiik, tepat sekali! 🎊'];
const WRONG_TEXTS = ['Hampir! Yuk lanjut ke soal berikutnya 💪', 'Nggak apa-apa, kita lanjut ya! 🌈', 'Oke, coba soal lainnya yuk 😊', 'Santai aja, lanjut terus! 🍀'];
/** Speaking (mic) 1-2 bintang — TETAP positif, cuma nadanya "terus
 *  berlatih" bukan "wow sempurna" (proporsional, referensi daily-
 *  conversation-asr), tidak pernah menyebut kata "salah"/"kurang". */
const MIC_ENCOURAGE_TEXTS = ['Bagus, terus berlatih! 💪', 'Sudah berani ngomong, mantap! 🌟', 'Oke, makin lama makin lancar! ✨', 'Keren, coba terus ya! 🌈'];
function pickText(list: string[]): string {
  return list[Math.floor(Math.random() * list.length)];
}

/**
 * Ambang batas "matched" openmic — sinyal internal dikirim ke server (PRD
 * §13.1) yang di sana dipakai sebagai 1 poin di angka skor total (BUKAN untuk
 * memutuskan level), TERPISAH dari bintang yang dilihat anak. Dulu dihitung pakai
 * `looseMatch()` (cuma kata >2 huruf, lolos di 50% dari SUBSET itu) — untuk
 * kalimat 4 kata spt "I like my school" ("i"/"my" kependekan, tersisa cuma
 * "like"+"school"), 1 kata kedengaran ("school" doang) sudah lolos ambang
 * 50% dari 2 = 1, jadi `matched: true` walau cuma 1 dari 4 kata sungguhan
 * kedengaran — TIDAK sinkron dengan bintang (yang menghitung SEMUA kata,
 * hasilnya 1 bintang/lemah, dilaporkan user). Sekarang `matched` dihitung
 * dari `hitRatio` yang SAMA dipakai bintang, jadi dua sinyal ini selalu
 * konsisten satu sama lain.
 */
const OPENMIC_MATCHED_THRESHOLD = 0.6;

export interface PlacementRank {
  /** Badge CEFR level itu sendiri (content.ts `LEVELS[].cefr`, mis. "≈ A1")
   *  — bukan skala terpisah lagi. */
  cefr: string;
  levelName: string;
  emoji: string;
  /** "Raja X" level itu (content.ts `BOSS_NAME`) — dipakai ganti "Bos" generik. */
  bossName: string;
}

/**
 * Rank petualang — SEKARANG cuma restatement `levelRecommended` dalam
 * istilah CEFR yang SUDAH dipakai di Peta Level (content.ts `LEVELS[].cefr`:
 * Pre-A1/A1/A1→A2/dst), BUKAN skala terpisah S/A/B/C/D + gelar "Petualang
 * Legendaris" seperti sebelumnya (permintaan user: istilah baru begitu
 * bentrok/konflik dengan CEFR yang sudah established di peta — rank & level
 * harus "satu pasangan", dipetakan LANGSUNG ke level Bos yang sama, bukan
 * sistem pengukuran skill terpisah dari rasio skor). Diekspor — dipakai
 * ulang di app.ts `renderHome` untuk badge rank TUNGGAL di Peta Petualangan
 * (bukan diulang per-perhentian, biar tidak redundan dgn status Bos/level
 * yang sudah ada di tiap perhentian — permintaan user).
 */
export function pickRank(levelRecommended: string): PlacementRank | null {
  const lvl = LEVELS.find((l) => l.key === levelRecommended);
  if (!lvl) return null;
  return { cefr: lvl.cefr || lvl.name, levelName: lvl.name, emoji: lvl.emoji, bossName: BOSS_NAME[lvl.key] };
}

/** Warna per pill SAMA dengan token per-skill yang sudah dipakai di Belajar
 *  (--c-vocab/--c-gram/--c-listen/--c-speak, content.ts SKILL_META) —
 *  permintaan user "bedakan warna", reuse identitas warna yang sudah ada
 *  di app ini, bukan bikin palet baru. */
const SKILL_TASTE: [string, string, string][] = [
  ['📚', 'Vocab', 'pt-vocab'],
  ['✏️', 'Grammar', 'pt-gram'],
  ['📖', 'Reading', 'pt-read'],
  ['🎧', 'Listening', 'pt-listen'],
  ['🗣️', 'Speaking', 'pt-speak'],
];

/**
 * Diringkas (CLAUDE.md "Teks Singkat, Padat, Jelas"): kalimat intro
 * dipendekkan, box narasi `.pt-story` LAMA ("Ini langkah pertama di Jalur
 * Petualanganmu — dari Little Stars sampai Trailblazer, singa bakal
 * nemenin...") DIHAPUS total — flavor text itu tidak fungsional (anak tidak
 * butuh tahu ini sebelum mulai tes, dan bakal dialami langsung lewat tombol
 * "Lihat di Peta Petualangan" begitu tes selesai), 2 baris "⏱️.../Kalau
 * di-skip..." digabung jadi 1 kalimat.
 *
 * Catatan "Untuk Orang Tua" (permintaan user) — SENGAJA ditujukan ke ORANG
 * TUA (pendamping), bukan anak: minta jangan dibantu jawab supaya hasil
 * placement test benar-benar mencerminkan kemampuan asli anak (bukan
 * kemampuan orang tuanya). Reuse `.note-card` yang SUDAH jadi bahasa visual
 * "catatan buat orang tua" di app ini (mis. Pengaturan) — BUKAN warna
 * merah/`--try` (warna itu dipakai jawaban salah, kalau dipakai di sini
 * anak bisa salah baca sbg "ada yang salah" sebelum tes mulai, bentrok
 * CLAUDE.md kid-friendly poin 2), tetap hangat tapi beda dari kartu putih
 * di sekitarnya jadi cukup menonjol utk dibaca.
 */
export function renderPlacementIntro(container: HTMLElement, onStart: OnDone, onSkip: OnDone): void {
  container.innerHTML = `
    <span class="stage-badge">🎈 SEBELUM MULAI</span>
    <h2 class="h2" style="margin:12px 0 10px">First Placement Test</h2>

    <p class="lede" style="margin-bottom:14px">5 kegiatan seru buat nentuin titik mulaimu:</p>
    <div class="pt-skills">
      ${SKILL_TASTE.map(([emoji, label, cls]) => `<span class="pt-skill-pill ${cls}">${emoji} ${label}</span>`).join('')}
    </div>

    <p class="meta" style="margin:14px 0 22px">⏱️ Sekitar 10 menit, santai aja — bisa di-skip &amp; dicoba lagi kapan saja.</p>

    <div class="card note-card" style="margin-bottom:22px">
      <div class="card-title">👨‍👩‍👧 Untuk Orang Tua</div>
      <p>Biarkan anak menjawab sendiri, ya — biar hasilnya menunjukkan kemampuan asli anak, bukan dibantu.</p>
    </div>

    <button class="primary-btn pt-cta" type="button" data-action="ptStart">▶️ Yuk Mulai</button>
    <button class="ghost-btn" type="button" data-action="ptSkip">Nanti Aja</button>
  `;
  setHandlers({ ptStart: onStart, ptSkip: onSkip });
}

/** Layar non-punitive saat kuota 2x percobaan sudah habis (§"max 2 kali").
 *  Dibingkai sebagai "kamu sudah eksplorasi", bukan "ditolak"/"gagal".
 *  Cuma 1 tombol (permintaan user, "Peta Petualangan jadi Beranda") — dulu
 *  ada tombol kedua "Lihat di Peta Petualangan" terpisah dari "Ke Beranda",
 *  sekarang keduanya mendarat di layar YANG SAMA jadi tombol kedua itu cuma
 *  duplikat tujuan, bukan pilihan beda lagi. */
export function renderPlacementLimitReached(container: HTMLElement, level: string | undefined, onHome: OnDone): void {
  container.innerHTML = `
    <div style="text-align:center">
      <span class="stage-badge">🎈 SUDAH DICOBA</span>
      <h2 class="h2" style="margin:12px 0 6px">Keren, sudah eksplorasi 2 kali!</h2>
      <p class="lede" style="margin-bottom:16px">First Placement Test cuma bisa dicoba maksimal 2 kali — titik mulaimu sekarang:</p>
      <div style="font-size:48px;margin-bottom:6px">${level ? (LEVEL_LABEL[level]?.slice(0, 2) ?? '🌱') : '🌱'}</div>
      <h2 class="h2" style="margin-bottom:22px">${level ? (LEVEL_LABEL[level] ?? level) : '—'}</h2>
      <button class="primary-btn" type="button" data-action="ptHome">🗺️ Ke Peta Petualangan</button>
    </div>
  `;
  setHandlers({ ptHome: onHome });
}

/**
 * Konfirmasi keluar di tengah tes (permintaan user) — dipanggil dari
 * app.ts saat anak tap tombol balik/nav LAIN sementara `runPlacementQuestions`
 * masih berjalan (jawaban belum tersimpan). Overlay ditempel ke
 * `document.body` (bukan mengganti isi `container`) supaya layar soal di
 * baliknya tidak hilang kalau anak batal keluar. Delegasi klik sudah
 * dipasang di `document.body` (interaction.ts), jadi `data-action` di sini
 * otomatis kena tanpa perlu wiring tambahan.
 */
export function renderExitConfirm(onStay: OnDone, onExit: OnDone): void {
  const overlay = document.createElement('div');
  overlay.className = 'pt-confirm-overlay';
  overlay.innerHTML = `
    <div class="pt-confirm-card">
      <div style="font-size:40px;margin-bottom:10px">🤔</div>
      <h3 class="h2" style="margin-bottom:8px">Yakin mau keluar?</h3>
      <p class="meta" style="margin-bottom:20px">Progres yang sudah dikerjakan bakal hilang kalau keluar sekarang.</p>
      <button class="primary-btn" type="button" data-action="ptConfirmStay" style="width:100%;margin-bottom:10px">Yuk Lanjut</button>
      <button class="ghost-btn" type="button" data-action="ptConfirmExit" style="width:100%">Keluar</button>
    </div>
  `;
  document.body.appendChild(overlay);
  setHandlers({
    ptConfirmStay: () => {
      overlay.remove();
      onStay();
    },
    ptConfirmExit: () => {
      overlay.remove();
      onExit();
    },
  });
}

export interface PlacementOutcome {
  levelRecommended?: string;
  error?: string;
  /** Cuma terisi kalau submit asli (bukan skip) — dipakai layar hasil (§ skor + mapping level). */
  totalCorrect?: number;
  totalItems?: number;
}

/** Layar transisi antar-ronde — tap-through (bukan auto-timeout, supaya
 *  tidak ada risiko lompat sebelum anak siap) + brain-break kecil (§6.3). */
function celebrateRound(container: HTMLElement, doneLabel: string, nextLabel: string, onNext: () => void): void {
  container.innerHTML = `
    <div style="text-align:center;padding:18px 0">
      <div style="font-size:44px;margin-bottom:10px">🌟</div>
      <div class="id-text" style="margin-bottom:4px">${doneLabel} beres!</div>
      <p class="meta" style="margin-bottom:20px">Lanjut ke ${nextLabel} yuk</p>
      <button class="primary-btn" type="button" data-action="ptNextRound">Lanjut →</button>
    </div>
  `;
  setHandlers({ ptNextRound: onNext });
}

/** Bar progress mengikuti soal SUNGGUHAN yang sedang dijawab (permintaan
 *  user) — "Soal X dari Y", bukan "Ronde N dari 4" seperti sebelumnya.
 *  `label` tetap disertakan biar anak tahu lagi di kegiatan apa. */
function questionBadge(current: number, total: number, label: string): string {
  const segments = Array.from({ length: total }, (_, i) => `<span class="${i < current ? 'done' : ''}"></span>`).join('');
  return `<div class="pt-progress">${segments}</div><div class="id-text" style="text-align:center;margin-bottom:4px">Soal ${current} dari ${total} · ${label}</div>`;
}

export function runPlacementQuestions(container: HTMLElement, onDone: (outcome: PlacementOutcome) => void): void {
  const answers: PlacementAnswer[] = [];
  const vocabItems = PLACEMENT_QUESTIONS.filter((q) => q.kind === 'vocab');
  const readingItems = PLACEMENT_QUESTIONS.filter((q) => q.kind === 'reading');
  const listeningItems = PLACEMENT_QUESTIONS.filter((q) => q.kind === 'listening');
  const speakingItems = PLACEMENT_QUESTIONS.filter((q) => q.kind === 'speakingRecognition');
  const openMicItems = PLACEMENT_OPENMIC_ITEMS;
  const TOTAL_ITEMS =
    vocabItems.length + readingItems.length + listeningItems.length + speakingItems.length + openMicItems.length;

  function drawMcqStep(
    items: PlacementQuestion[],
    index: number,
    offsetBefore: number,
    roundLabel: string,
    onRoundDone: () => void
  ): void {
    if (index >= items.length) return onRoundDone();
    const q = items[index];
    const isListening = q.kind === 'listening';
    const isSpeaking = q.kind === 'speakingRecognition';
    // Reading (riset Cambridge Pre A1 Starters Reading Task 2/5, doc/
    // first_placement_test.md §Reading): baca `story` SENDIRI (silent,
    // SENGAJA tanpa tombol audio — kalau dibacakan TTS, ini jadi tes
    // listening lagi, bukan tes baca), jawab `question` dengan tap GAMBAR.
    // Anak yang belum bisa baca tetap bisa menebak & lanjut seperti biasa
    // (non-punitive tetap terjaga, tidak ada layar "kamu belum bisa baca").
    const isReading = q.kind === 'reading';
    // Vocab (permintaan user): dua arah — 'idToEn' soal diucapkan TTS
    // Indonesia (speakLocalized), cari arti Inggris di opsi teks. 'enToId'
    // soal diucapkan TTS Inggris (speak biasa), cari arti Indonesia di
    // opsi teks. Tetap tanpa gambar sama sekali (opsi teks bukan emoji)
    // biar tidak bisa ditebak dari ikon.
    const isVocab = q.kind === 'vocab';
    // Cuma vocab yang opsinya teks-saja sekarang — reading balik jadi
    // grid gambar (spt listening/speaking), TAPI TANPA label (lihat di
    // bawah): kalau label ditampilkan, kata di opsi bisa identik dgn kata
    // di `story`/`question`, anak tinggal cocokkan teks tanpa benar-benar
    // membaca (bug nyata, dilaporkan user).
    const isTextOnly = isVocab;
    // Diacak per tampilan soal (bukan di data) — TANPA ini, jawaban benar
    // selalu di posisi yang sama persis dengan urutan di data (dilaporkan
    // user: rata-rata di posisi awal), anak bisa hafal pola posisi tanpa
    // benar-benar paham katanya. Dipakai konsisten di render, urutan TTS
    // (speakingRecognition), DAN pencocokan tap — bukan cuma tampilan.
    const opts = shuffle(q.options);
    // idToEn: soal Indonesia (wordId) diucapkan+ditampilkan. enToId: soal
    // Inggris (word) diucapkan+ditampilkan — arah kebalikannya.
    const vocabPromptText = q.direction === 'idToEn' ? q.wordId : q.word;

    container.innerHTML = `
      ${questionBadge(offsetBefore + index + 1, TOTAL_ITEMS, roundLabel)}
      ${
        isReading
          ? `<div class="reading-passage">${(q.story ?? []).map((line) => `<p>${line}</p>`).join('')}</div>
             <p class="reading-question">${q.question ?? ''}</p>`
          : isVocab
            ? `<p class="lede" style="text-align:center;margin-bottom:6px">Pilih jawaban yang benar:</p>
               <div class="en-text" style="text-align:center;font-size:2.25rem;margin:0 0 10px">${vocabPromptText}</div>
               <div class="speak-row"><button class="speak-btn" data-action="ptReplay">🔊 Dengar Lagi</button></div>`
            : `<div class="speak-row"><button class="speak-btn" data-action="ptReplay">🔊 Dengar Lagi</button></div>`
      }
      <div class="opt-grid ${!isTextOnly && opts.length > 2 ? 'three' : ''}">
        ${opts
          .map(
            (o, i) =>
              `<button class="opt-btn ${isVocab ? 'opt-btn-text' : ''}" type="button" data-action="ptPick" data-payload="${i}">${
                isVocab
                  ? (o.label ?? '')
                  : `${o.emoji}${o.label && !isReading ? `<span class="lbl">${o.label}</span>` : ''}`
              }</button>`
          )
          .join('')}
      </div>
      <div class="feedback" id="fb"></div>
    `;

    // playPrompt() dibungkus try/catch dan handler DIPASANG DULU sebelum
    // audio diputar — kalau TTS gagal/throw (edge-case browser tertentu),
    // tap target tetap hidup, bukan layar mati (CLAUDE.md poin 4: tanpa
    // layar dead-end).
    function playPrompt(): void {
      if (isReading) return; // sengaja no-op — lihat catatan di atas
      try {
        if (isListening) {
          speakSequence([...(q.story ?? []), q.question ?? '']);
        } else if (isSpeaking) {
          // Cuma `question` yang dibacakan (permintaan user) — opsi jawaban
          // sudah tertulis di layar, anak baca sendiri, TTS tidak perlu
          // mendiktekannya (dulu ikut dibacakan via speakSequence, bikin
          // opsi kedengar sebelum sempat dibaca sendiri).
          speak(q.question ?? '');
        } else if (isVocab && q.direction === 'idToEn') {
          speakLocalized(q.wordId ?? '', 'id-ID');
        } else {
          speak(q.word ?? '');
        }
      } catch {
        /* diabaikan dengan sengaja — anak masih bisa tap tanpa audio */
      }
    }

    // Dikunci sekali soal ini terjawab — placement test satu kali jawab per
    // soal (beda dari game latihan biasa yang boleh coba lagi sampai benar),
    // jaga-jaga dobel-tap juga tidak dorong 2 jawaban / lompat soal.
    let answered = false;

    setHandlers({
      ptReplay: () => playPrompt(),
      ptPick: (payload) => {
        if (answered) return;
        answered = true;
        // Hentikan audio soal SEKARANG — tanpa ini, speakSequence panjang
        // (pertanyaan + beberapa opsi) bisa terus bicara menembus layar
        // feedback bahkan sampai soal berikutnya (dilaporkan user).
        stopSpeaking();
        const i = Number(payload);
        const chosen = opts[i];
        answers.push({ questionId: q.id, chosenEmoji: chosen.emoji });

        const btn = container.querySelectorAll<HTMLElement>('.opt-btn')[i];
        const fb = container.querySelector<HTMLElement>('#fb')!;
        if (chosen.correct) {
          // Apresiasi teks + animasi + nada (Web Audio API, nol biaya) —
          // TANPA suara TTS/ucapan (beda dari nada!), karena voice Bahasa
          // Indonesia tidak konsisten tersedia di browser.
          btn.classList.add('correct', 'pt-celebrate');
          fb.textContent = pickText(CORRECT_TEXTS);
          fb.className = 'feedback good';
          playCorrectTone();
        } else {
          // Nada lembut (BUKAN alarm) + getar HP singkat — animasi shake
          // sudah ada dari class 'wrong' (CSS). Getar diam-diam diabaikan
          // di perangkat yang tidak dukung (mis. iOS Safari).
          btn.classList.add('wrong');
          fb.textContent = pickText(WRONG_TEXTS);
          fb.className = 'feedback bad';
          playTryAgainTone();
          vibrateDevice(120);
        }

        // Jeda sebelum soal berikutnya — dinaikkan dari 900ms (permintaan
        // user: sempat kebaca dulu feedback-nya, jangan buru-buru pindah).
        setTimeout(() => drawMcqStep(items, index + 1, offsetBefore, roundLabel, onRoundDone), 1600);
      },
    });

    playPrompt();
  }

  function drawOpenMic(index: number): void {
    const item = openMicItems[index];
    if (!item) {
      void finish();
      return;
    }
    const isLast = index === openMicItems.length - 1;
    const isFirst = index === 0;
    const globalPos = vocabItems.length + readingItems.length + listeningItems.length + speakingItems.length + index + 1;

    container.innerHTML = `
      ${questionBadge(globalPos, TOTAL_ITEMS, '🗣️ Speaking')}
      <div class="id-text" style="text-align:center;margin-bottom:6px">${isLast ? 'Terakhir — coba ucapkan satu kalimat penuh, ya!' : 'Coba ucapkan, ya!'}</div>
      ${isFirst ? `<p class="meta" style="text-align:center;margin-bottom:10px">🎈 Sekarang giliran ngomong pakai mic — santai aja, yang penting kamu berani coba ya!</p>` : ''}
      <div class="en-text" style="text-align:center">"${item.phrase}"</div>
      <div class="speak-row"><button class="speak-btn" data-action="ptReplay">🔊 Dengar Contoh</button></div>
      <div class="mic-wrap">
        <button class="mic-btn" id="micBtn" type="button" data-action="ptMic">🎤</button>
        <div class="mic-hint">${sttSupported ? 'Tap mic, lalu ucapkan kalimatnya' : 'Mikrofon tidak didukung browser ini'}</div>
      </div>
      <div id="micResult"></div>
      <div class="feedback" id="fb"></div>
      ${sttSupported ? '' : `<button class="ghost-btn" type="button" data-action="ptMicSkip">✅ Aku Sudah Coba Ucapkan</button>`}
    `;

    function safeSpeak(): void {
      try {
        speak(item.phrase);
      } catch {
        /* diabaikan dengan sengaja — mic tetap bisa dipakai tanpa audio contoh */
      }
    }

    // Kalau mic-nya bermasalah dengan cara yang tap-ulang TIDAK akan
    // menyelesaikan (izin ditolak / tidak ada mic di perangkat), tampilkan
    // tombol lewati — supaya anak tidak terjebak tap tanpa hasil selamanya
    // (CLAUDE.md poin 4: tanpa layar dead-end). Skip di sini melewati SISA
    // item mic (bukan cuma yang ini) — kalau izin/hardware bermasalah, item
    // berikutnya bakal gagal dengan cara yang sama juga.
    function revealSkipButton(): void {
      if (container.querySelector('[data-action="ptMicSkip"]')) return;
      container.querySelector('.mic-wrap')!.insertAdjacentHTML(
        'afterend',
        `<button class="ghost-btn" type="button" data-action="ptMicSkip" style="margin-top:10px">✅ Lewati, Lanjut Aja</button>`
      );
    }

    // Dikunci begitu 1x hasil mic keluar — placement test tidak punya
    // "Coba Lagi" untuk item ini (beda dari referensi daily-conversation-
    // asr), TAPI lanjut ke item berikutnya sekarang lewat tombol "Lanjut"
    // yang anak sendiri yang tap (permintaan user) — dulu otomatis lompat
    // sendiri lewat timer, anak yang masih baca hasilnya bisa kelewat.
    let answered = false;
    // Diisi async oleh `onAudioReady` (MediaRecorder.onstop, bisa nyala
    // SETELAH hasil mic dirender) — dibaca tombol "Play Suaramu" (CLAUDE.md:
    // wajib tiap ada Speaking) & di-patch live begitu siap kalau tombolnya
    // sudah kadung dirender nonaktif.
    let recordedAudioUrl: string | null = null;

    setHandlers({
      ptReplay: () => safeSpeak(),
      ptMicSkip: () => void finish(),
      ptMicNext: () => drawOpenMic(index + 1),
      ptPlayMine: () => {
        if (recordedAudioUrl) new Audio(recordedAudioUrl).play().catch(() => {});
      },
      ptMic: () => {
        if (answered) return;
        const btn = container.querySelector<HTMLElement>('#micBtn')!;
        btn.classList.add('listening');
        listenAndRecordOnce(
          (said, confidence) => {
            if (answered) return;
            answered = true;
            stopSpeaking(); // kalau "Dengar Contoh" masih bicara pas hasil mic keluar
            btn.classList.remove('listening');
            btn.setAttribute('disabled', 'true');

            // Bintang + highlight per-kata (referensi: backup/daily-
            // conversation-asr (1).html) — TETAP non-punitive: tidak ada
            // kata "salah", cuma warna beda per kata, dan feedback teks
            // selalu positif (proporsional ke jumlah bintang, bukan
            // menghakimi). matched/confidence dikirim sebagai sinyal
            // internal (PRD §13.1) — bintang di sini murni tampilan
            // lokal, TIDAK pernah mempengaruhi levelRecommended.
            const words = wordMatchDetail(said, item.phrase);
            const matchedCount = words.filter((w) => w.matched).length;
            const hitRatio = words.length ? matchedCount / words.length : 0;
            const stars = hitRatio >= 0.8 ? 3 : hitRatio >= 0.4 ? 2 : 1;
            const starRow = '⭐'.repeat(stars) + '☆'.repeat(3 - stars);
            const praise = stars === 3 ? pickText(CORRECT_TEXTS) : pickText(MIC_ENCOURAGE_TEXTS);
            const wordsHtml = words.map((w) => `<span class="${w.matched ? 'ok' : 'miss'}">${w.word}</span>`).join('');
            // Skor kata angka (permintaan user) — pelengkap bintang, BUKAN
            // pengganti: bintang tetap yang utama/ramah-anak (non-evaluatif,
            // CLAUDE.md poin 2), angka di sini cuma rincian kecil di
            // bawahnya, sama pola dgn layar hasil akhir (§ skor + bintang).
            const scorePct = Math.round(hitRatio * 100);

            container.querySelector<HTMLElement>('#micResult')!.innerHTML = `
              <div style="font-size:22px;letter-spacing:3px;text-align:center;margin-top:14px" aria-hidden="true">${starRow}</div>
              <p class="mic-score">🎯 ${matchedCount} dari ${words.length} kata kedengaran <span class="mic-score-pct">(${scorePct}%)</span></p>
              <div class="word-diff">${wordsHtml}</div>
              <div class="heard-text">Terdengar: "${said}"</div>
              <div class="speak-row"><button class="speak-btn" type="button" id="playMineBtn" data-action="ptPlayMine" ${recordedAudioUrl ? '' : 'disabled'}>▶️ Play Suaramu</button></div>
            `;
            const fb = container.querySelector<HTMLElement>('#fb')!;
            fb.textContent = praise;
            fb.className = 'feedback good';

            answers.push({
              kind: 'openmic',
              questionId: item.id,
              wordRatio: hitRatio,
              matched: hitRatio >= OPENMIC_MATCHED_THRESHOLD,
              confidence: Number.isFinite(confidence) ? confidence : 0,
            });
            // Tombol "Lanjut" (permintaan user) menggantikan auto-advance via
            // timer — anak sendiri yang tap begitu siap, jadi tidak kelewat
            // baca hasilnya (bintang + skor kata + transkrip) sebelum layar
            // pindah sendiri.
            fb.insertAdjacentHTML(
              'afterend',
              `<button class="primary-btn" type="button" data-action="ptMicNext" style="margin-top:14px">${isLast ? 'Selesai →' : 'Lanjut →'}</button>`
            );
          },
          (kind) => {
            btn.classList.remove('listening');
            // 'aborted' = mic DIHENTIKAN PAKSA krn anak tap "🔊 Dengar
            // Contoh" pas mic masih aktif (`speech.ts` `stopListening()`)
            // — bukan STT gagal dengar, jadi reset diam-diam, JANGAN
            // tampilkan "belum kedengaran, coba lagi" (salah/menyalahkan
            // anak, dilaporkan user sbg race condition).
            if (kind === 'aborted') return;
            const fb = container.querySelector<HTMLElement>('#fb')!;
            // Pesan per jenis error (referensi: backup/daily-conversation-asr
            // (1).html) — "izin ditolak" butuh tindakan beda dari "belum
            // kedengaran", nada tetap hangat/actionable, bukan teknis.
            if (kind === 'not-allowed') {
              fb.textContent = 'Mikrofon belum diizinkan — klik ikon 🔒 di sebelah alamat browser, izinkan mikrofon, lalu coba lagi';
              revealSkipButton();
            } else if (kind === 'audio-capture' || kind === 'unsupported') {
              fb.textContent = 'Mikrofon tidak didukung/tidak ditemukan di perangkat ini';
              revealSkipButton();
            } else if (kind === 'network') {
              fb.textContent = 'Koneksi lagi bermasalah, coba lagi sebentar ya 🌐';
            } else {
              fb.textContent = 'Belum kedengaran, coba lagi 🎧';
            }
          },
          (audioUrl) => {
            // Bisa nyala setelah hasil mic sudah dirender (async) — patch
            // tombolnya jadi aktif kalau sudah kadung dirender nonaktif.
            recordedAudioUrl = audioUrl;
            const playBtn = container.querySelector<HTMLButtonElement>('#playMineBtn');
            if (playBtn) playBtn.disabled = false;
          }
        );
      },
    });

    safeSpeak();
  }

  async function finish(): Promise<void> {
    container.innerHTML = `<p class="lede">Menyimpan hasil…</p>`;
    try {
      const result = await submitPlacementTest(answers);
      onDone({ levelRecommended: result.levelRecommended, totalCorrect: result.totalCorrect, totalItems: result.totalItems });
    } catch (err) {
      onDone({ error: err instanceof ApiRequestError ? err.message : 'Gagal menyimpan, coba lagi.' });
    }
  }

  // Ronde 1 → 2 → 3 → 4 → 5, dengan layar perayaan kecil di antaranya (§6.3).
  // Offset kumulatif (bukan nomor ronde) supaya bar progress mengikuti
  // nomor soal sungguhan lintas ronde (permintaan user), bukan reset tiap
  // ronde ganti.
  const afterVocab = vocabItems.length;
  const afterReading = afterVocab + readingItems.length;
  const afterListening = afterReading + listeningItems.length;
  drawMcqStep(vocabItems, 0, 0, '📚 Vocab', () =>
    celebrateRound(container, '📚 Vocab', '📖 Reading', () =>
      drawMcqStep(readingItems, 0, afterVocab, '📖 Reading', () =>
        celebrateRound(container, '📖 Reading', '🎧 Listening', () =>
          drawMcqStep(listeningItems, 0, afterReading, '🎧 Listening', () =>
            celebrateRound(container, '🎧 Listening', '🗣️ Speaking', () =>
              drawMcqStep(speakingItems, 0, afterListening, '🗣️ Speaking', () =>
                celebrateRound(container, '🗣️ Speaking (pilihan)', '🗣️ Speaking (ucapkan)', () => drawOpenMic(0))
              )
            )
          )
        )
      )
    )
  );
}

/** Entry point ke Peta Petualangan (permintaan user) — begitu anak tahu
 *  levelnya, langsung bisa lihat posisinya di peta, bukan cuma nama level
 *  polos. Peta Level (sekarang bagian dari Beranda, `renderHome` di app.ts)
 *  sudah otomatis nyorot "Kamu di sini" di level itu — tidak perlu
 *  diteruskan manual dari sini. Cuma 1 tombol (bukan 2 lagi) — dulu "Lanjut"
 *  & "Lihat di Peta Petualangan" beda tujuan (Beranda vs Peta Level layar
 *  terpisah), sekarang keduanya mendarat di layar yang sama. */
export function renderPlacementResult(
  container: HTMLElement,
  levelRecommended: string,
  onContinue: OnDone,
  totalCorrect?: number,
  totalItems?: number
): void {
  // Skor + mapping ke level (permintaan user) — bintang tetap yang utama
  // (non-evaluatif, CLAUDE.md poin 2, pola sama dgn kartu hasil di
  // Beranda), angka mentah ditampilkan sebagai info kecil di bawahnya,
  // bukan headline. Kalau hasil dari skip (tanpa totalCorrect/totalItems),
  // bagian ini otomatis tidak tampil.
  const hasScore = typeof totalCorrect === 'number' && typeof totalItems === 'number' && totalItems > 0;
  const ratio = hasScore ? totalCorrect / totalItems : 0;
  const stars = hasScore ? (ratio >= 0.8 ? 3 : ratio >= 0.5 ? 2 : 1) : 0;
  const starRow = hasScore ? '⭐'.repeat(stars) + '☆'.repeat(3 - stars) : '';
  const rank = hasScore ? pickRank(levelRecommended) : null;

  // Simplify (permintaan user + CLAUDE.md "singkat padat jelas"): versi lama
  // menampilkan level yang SAMA 2x (emoji Adventurer muncul dobel, "Rank
  // ≈A1/Raja Naga" di 1 box lalu "🚀 Adventurer" + kalimat panjang lagi di
  // bawahnya) — padahal cuma 1 fakta ("kamu mulai di Adventurer"). Digabung
  // jadi SATU kartu; 2 kalimat penjelas panjang dipangkas jadi label
  // singkat/parentetis.
  const cardBody = rank
    ? `<div style="font-size:44px;line-height:1;margin-bottom:6px">${rank.emoji}</div>
       <div class="h2" style="margin:0 0 4px;color:var(--brand-700)">${rank.levelName}</div>
       <p class="meta" style="margin:0">Rank ${rank.cefr} · Setara ${rank.bossName}</p>`
    : `<div style="font-size:44px;line-height:1;margin-bottom:6px">${LEVEL_LABEL[levelRecommended]?.slice(0, 2) ?? '🌱'}</div>
       <div class="h2" style="margin:0;color:var(--brand-700)">${LEVEL_LABEL[levelRecommended] ?? levelRecommended}</div>`;

  container.innerHTML = `
    <div style="text-align:center">
      <span class="stage-badge">🎉 SELESAI</span>
      <h2 class="h2" style="margin:12px 0 6px">Keren, sudah dicoba semua!</h2>
      ${
        hasScore
          ? `<div style="font-size:22px;letter-spacing:3px;margin-bottom:4px" aria-hidden="true">${starRow}</div>
             <p class="meta" style="margin-bottom:18px">${totalCorrect} dari ${totalItems} jawaban tepat <span style="color:var(--ink-3)">(termasuk mic 🎤)</span></p>`
          : ''
      }
      <p class="lede" style="margin-bottom:8px">Titik mulaimu di Jalur Petualangan:</p>
      <div style="background:var(--brand-50);border:1px solid var(--brand-100);border-radius:var(--r-md);padding:18px;margin-bottom:22px">
        ${cardBody}
      </div>
      <button class="primary-btn" type="button" data-action="ptContinue">🗺️ Lanjut ke Peta Petualangan</button>
    </div>
  `;
  setHandlers({ ptContinue: onContinue });
}

export async function doSkipPlacementTest(): Promise<PlacementOutcome> {
  try {
    const result = await skipPlacementTest();
    return { levelRecommended: result.level };
  } catch (err) {
    return { error: err instanceof ApiRequestError ? err.message : 'Gagal menyimpan, coba lagi.' };
  }
}
