/** TTS & STT lewat Web Speech API bawaan browser — sama persis pola di daily-conversation-asr.html. */

export const ttsSupported = 'speechSynthesis' in window;

/* ---------- Kecepatan & pilihan suara (diport dari daily-conversation-asr (1).html) ---------- */

export const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5] as const;
// Sedikit lebih pelan dari normal (1x) supaya lebih mudah diikuti anak —
// HARUS salah satu nilai `SPEEDS` di atas, supaya pill kecepatan yang
// cocok bisa ditandai aktif sejak awal (permintaan user: "tandai default
// nya di berapa", lihat `voice-panel.ts`).
export const DEFAULT_RATE: (typeof SPEEDS)[number] = 0.75;
export type VoiceGender = 'female' | 'male';
export type VoiceAccent = 'us' | 'uk';

let playbackRate: number = DEFAULT_RATE;
let allVoices: SpeechSynthesisVoice[] = [];
let selectedAccent: VoiceAccent = 'us'; // default aplikasi: US
let selectedGender: VoiceGender = 'female';
let selectedVoice: SpeechSynthesisVoice | null = null;
let onVoicesReady: (() => void) | null = null;

export function getPlaybackRate(): number {
  return playbackRate;
}
export function setPlaybackRate(rate: number): void {
  playbackRate = rate;
}
export function getVoiceGender(): VoiceGender {
  return selectedGender;
}
export function setVoiceGender(g: VoiceGender): void {
  selectedGender = g;
  selectedVoice = pickVoice(selectedAccent, selectedGender);
}
export function getVoiceAccent(): VoiceAccent {
  return selectedAccent;
}
export function setVoiceAccent(a: VoiceAccent): void {
  selectedAccent = a;
  selectedVoice = pickVoice(selectedAccent, selectedGender);
}
export function onVoicesChanged(cb: () => void): void {
  onVoicesReady = cb;
}

/**
 * Web Speech API tidak punya field "gender" asli, dan browser/OS beda-beda soal
 * suara apa yang tersedia. Strategi berlapis per kombinasi aksen × gender:
 * 1) cocokkan ke nama voice pilihan UNTUK aksen itu (mis. "Alex"/"Samantha" utk US,
 *    "Daniel"/"Flo" utk UK) yang juga cocok tag bahasanya (en-US / en-GB).
 * 2) cocokkan nama pilihan itu tanpa syarat tag bahasa (beberapa OS salah label).
 * 3) voice apa pun yang tag bahasanya cocok + lolos tebakan gender dari nama.
 * 4) voice apa pun yang tag bahasanya cocok (aksen benar, gender tak terjamin).
 * 5) coba aksen satunya dengan pola nama yang sama.
 * 6) voice pertama yang lolos tebakan gender, atau voice pertama yang ada.
 */
/**
 * Pilihan UTAMA per kombinasi (permintaan user): US female → "Google US
 * English", UK female → "Google UK English Female", US male → "Aaron", UK
 * male → "Google UK English Male" — ditaruh PALING DEPAN tiap daftar
 * (urutan array = prioritas match, lihat `findByName`). Nama-nama lain
 * tetap disimpan sebagai fallback — voice "Google ..." itu spesifik Chrome,
 * browser/OS lain (Safari, Firefox) tidak selalu punya, jadi kalau tidak
 * ketemu, strategi berlapis di atas otomatis lanjut ke nama berikutnya.
 */
const PREFERRED_NAMES: Record<VoiceAccent, Record<VoiceGender, string[]>> = {
  us: {
    female: ['Google US English', 'Samantha', 'Victoria', 'Ava', 'Susan', 'Allison'],
    male: ['Aaron', 'Alex', 'Fred', 'Google US English'],
  },
  uk: {
    female: ['Google UK English Female', 'Flo', 'Kate', 'Serena', 'Moira'],
    male: ['Google UK English Male', 'Daniel', 'Arthur'],
  },
};
const LANG_PREFIX: Record<VoiceAccent, string> = { us: 'en-us', uk: 'en-gb' };

const FEMALE_HINTS = [
  'female', 'woman', 'samantha', 'victoria', 'karen', 'moira', 'tessa', 'fiona', 'zira', 'susan',
  'allison', 'ava', 'serena', 'kate', 'amelie', 'anna', 'emma', 'joanna', 'salli', 'kimberly',
  'ivy', 'kendra', 'olivia', 'sonia', 'libby', 'aria', 'jenny', 'flo',
];
const MALE_HINTS = [
  'male', 'man', 'alex', 'daniel', 'fred', 'aaron', 'david', 'mark', 'george', 'oliver',
  'arthur', 'ryan', 'justin', 'matthew', 'brian', 'russell', 'joey', 'guy', 'eric', 'christopher',
];

function guessGenderFromName(voice: SpeechSynthesisVoice): VoiceGender | 'unknown' {
  const n = voice.name.toLowerCase();
  if (FEMALE_HINTS.some((h) => n.includes(h))) return 'female';
  if (MALE_HINTS.some((h) => n.includes(h))) return 'male';
  return 'unknown';
}

function findByName(names: string[], requireLangPrefix?: string): SpeechSynthesisVoice | undefined {
  for (const name of names) {
    const match = allVoices.find((v) => {
      const nameHit = v.name.toLowerCase().includes(name.toLowerCase());
      if (!nameHit) return false;
      return requireLangPrefix ? (v.lang?.toLowerCase().startsWith(requireLangPrefix) ?? false) : true;
    });
    if (match) return match;
  }
  return undefined;
}

function pickVoice(accent: VoiceAccent, gender: VoiceGender): SpeechSynthesisVoice | null {
  if (!allVoices.length) return null;
  const names = PREFERRED_NAMES[accent][gender];
  const langPrefix = LANG_PREFIX[accent];

  return (
    findByName(names, langPrefix) ??
    findByName(names) ??
    allVoices.find((v) => v.lang?.toLowerCase().startsWith(langPrefix) && guessGenderFromName(v) === gender) ??
    allVoices.find((v) => v.lang?.toLowerCase().startsWith(langPrefix)) ??
    findByName(PREFERRED_NAMES[accent === 'us' ? 'uk' : 'us'][gender]) ??
    allVoices.find((v) => guessGenderFromName(v) === gender) ??
    allVoices[0]
  );
}

/** Daftar voice MENTAH (semua bahasa) — `allVoices` di atas sengaja disaring
 *  ke Inggris saja utk konten belajar. `allVoicesRaw` dipakai khusus
 *  `speakLocalized()` (soal Vocab arah Indonesia→Inggris, First Placement
 *  Test) yang butuh cari voice di luar Inggris. */
let allVoicesRaw: SpeechSynthesisVoice[] = [];

function loadVoices(): void {
  const voices = window.speechSynthesis.getVoices();
  allVoicesRaw = voices;
  const english = voices.filter((v) => v.lang?.toLowerCase().startsWith('en'));
  allVoices = english.length ? english : voices;
  selectedVoice = pickVoice(selectedAccent, selectedGender);
  onVoicesReady?.();
}

if (ttsSupported) {
  loadVoices(); // bisa kosong di panggilan pertama — Chrome load voice secara async
  if ('onvoiceschanged' in window.speechSynthesis) {
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }
}

/* ---------- Bicara ---------- */

function utteranceLang(): string {
  return selectedAccent === 'uk' ? 'en-GB' : 'en-US';
}

/**
 * `speakSequence()` menjadwalkan tiap kalimat lewat `setTimeout` terpisah.
 * Kalau dipanggil lagi (soal berikutnya) SEBELUM semua kalimat sequence
 * sebelumnya sempat bicara, `speechSynthesis.cancel()` cuma menghentikan
 * yang sedang/sudah diputar — timer yang masih menunggu TETAP jalan
 * belakangan dan manggil speak() di waktu yang salah, tabrakan dengan
 * sequence baru (lalu Chrome diam-diam mengabaikan speak() berikutnya,
 * gejalanya persis "kadang harus tekan Dengar Lagi"). `pendingTimers`
 * dibatalkan eksplisit di awal tiap speak()/speakSequence() supaya sisa
 * jadwal lama tidak pernah lolos.
 */
let pendingTimers: ReturnType<typeof setTimeout>[] = [];

function clearPendingTimers(): void {
  pendingTimers.forEach((t) => clearTimeout(t));
  pendingTimers = [];
}

/**
 * Jeda wajib SETELAH cancel() SEBELUM speak() baru dipanggil — tanpa ini,
 * Chrome kadang diam-diam MENGABAIKAN speak() yang dipanggil terlalu rapat
 * setelah cancel() (race condition Web Speech API, sudah kejadian berulang
 * kali: soal vocab yang di-tap cepat, transisi antar-ronde, dan pujian TTS
 * begitu jawaban benar di-tap sementara soal masih dibacakan). Ditaruh DI
 * SINI (bukan di tiap pemanggil) supaya SEMUA pemanggil speak()/
 * speakSequence() — sekarang dan yang ditambah nanti — otomatis aman.
 */
const SPEAK_SAFETY_DELAY_MS = 120;

/** TTS umumnya diam/salah lafal kalau dikasih emoji — buang dulu sebelum
 *  diucapkan (emoji di teks tetap tampil normal di layar, ini cuma utk
 *  yang dikirim ke speechSynthesis). */
function stripEmojiForSpeech(text: string): string {
  return text.replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{2190}-\u{21FF}\u{2B00}-\u{2BFF}]/gu, '').trim();
}

export function speak(text: string): void {
  if (!ttsSupported) return;
  stopListening(); // lihat komentar di atas `stopListening()` — cegah race condition mic vs TTS
  clearPendingTimers();
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(stripEmojiForSpeech(text));
  u.lang = utteranceLang();
  u.rate = playbackRate;
  if (selectedVoice) u.voice = selectedVoice;
  const timerId = setTimeout(() => window.speechSynthesis.speak(u), SPEAK_SAFETY_DELAY_MS);
  pendingTimers.push(timerId);
}

/** OS/browser sering punya LEBIH dari 1 voice utk bahasa yang sama — mis.
 *  macOS default cuma bawa voice "compact" (mis. "Damayanti" utk id-ID,
 *  kualitas robotic), sedangkan varian "Enhanced"/"Premium" (diunduh manual
 *  lewat Pengaturan > Aksesibilitas > Spoken Content > Kelola Voice) muncul
 *  sbg voice TERPISAH dgn nama yang sama + kata kualitas ini, jauh lebih
 *  natural. Chrome kadang jg punya "Google [Bahasa]" utk beberapa bahasa,
 *  serupa kualitasnya. `speakLocalized` di bawah PRIORITASKAN voice yang
 *  namanya mengandung salah satu kata ini kalau ada beberapa kandidat utk
 *  bahasa yang sama — 0 biaya/tanpa backend (masih Web Speech API bawaan
 *  browser, PRD §5), cuma pilih yang TERBAIK dari yang SUDAH tersedia di
 *  device, BUKAN mendatangkan voice baru. Kalau device cuma punya 1 voice
 *  compact utk bahasa itu (paling umum di macOS bawaan), TTS tetap kedengaran
 *  spt sebelumnya — batasan Web Speech API, bukan sesuatu yang app ini bisa
 *  perbaiki lagi tanpa TTS cloud berbayar (di luar scope v1, CLAUDE.md §5). */
const QUALITY_VOICE_HINTS = ['google', 'enhanced', 'premium', 'neural', 'natural', 'wavenet'];

/**
 * Ucapkan teks dalam bahasa LAIN dari konten belajar Inggris (mis. soal
 * Vocab arah Indonesia→Inggris di First Placement Test). `selectedVoice`
 * (untuk Inggris) SENGAJA tidak dipakai di sini — voice punya bahasanya
 * sendiri yang menang atas `u.lang` kalau dipaksa, jadi teks Indonesia
 * pakai voice Inggris akan salah lafal total. Cari voice `lang`-nya cocok
 * dari daftar MENTAH (`allVoicesRaw`, semua bahasa) — kalau ADA beberapa
 * kandidat, ambil yang paling "natural" dulu (`QUALITY_VOICE_HINTS`); kalau
 * tidak ada satu pun voice cocok, biarkan browser pilih default-nya sendiri
 * utk `lang` itu (masih lebih baik drpd dipaksa voice Inggris).
 */
export function speakLocalized(text: string, lang: string): void {
  if (!ttsSupported) return;
  stopListening();
  clearPendingTimers();
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(stripEmojiForSpeech(text));
  u.lang = lang;
  u.rate = playbackRate;
  const prefix = lang.slice(0, 2).toLowerCase();
  const candidates = allVoicesRaw.filter((v) => v.lang?.toLowerCase().startsWith(prefix));
  const localizedVoice = candidates.find((v) => QUALITY_VOICE_HINTS.some((h) => v.name.toLowerCase().includes(h))) ?? candidates[0];
  if (localizedVoice) u.voice = localizedVoice;
  const timerId = setTimeout(() => window.speechSynthesis.speak(u), SPEAK_SAFETY_DELAY_MS);
  pendingTimers.push(timerId);
}

/** Ucapkan beberapa kalimat berurutan dengan jeda, mis. untuk cerita mini Listening. */
export function speakSequence(lines: string[], gapMs = 1600): void {
  if (!ttsSupported || lines.length === 0) return;
  stopListening();
  clearPendingTimers();
  window.speechSynthesis.cancel();
  const gap = gapMs / playbackRate; // jeda ikut memanjang di kecepatan rendah biar tidak numpuk
  lines.forEach((line, i) => {
    const u = new SpeechSynthesisUtterance(stripEmojiForSpeech(line));
    u.lang = utteranceLang();
    u.rate = playbackRate;
    if (selectedVoice) u.voice = selectedVoice;
    const timerId = setTimeout(() => window.speechSynthesis.speak(u), SPEAK_SAFETY_DELAY_MS + i * gap);
    pendingTimers.push(timerId);
  });
}

/**
 * Hentikan bicara SEKARANG JUGA — dipanggil begitu anak tap jawaban, BUKAN
 * ditunggu sampai layar berikutnya manggil speak() lagi. Tanpa ini, audio
 * lama (apalagi speakSequence panjang: pertanyaan + beberapa opsi) bisa
 * terus bicara menembus layar feedback bahkan sampai ke soal berikutnya —
 * `speak()`/`speakSequence()` cuma cancel() OTOMATIS pas dipanggil ULANG,
 * jadi ada jeda kosong (sepanjang delay sebelum soal berikutnya) di mana
 * audio lama masih bebas jalan kalau tidak dihentikan eksplisit di sini.
 */
export function stopSpeaking(): void {
  clearPendingTimers();
  if (ttsSupported) window.speechSynthesis.cancel();
}

const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
export const sttSupported = !!SR;

/**
 * Jenis error dipisah per `event.error` asli SpeechRecognition (referensi:
 * backup/daily-conversation-asr (1).html — sebelumnya semua kondisi ini
 * digepyok jadi 1 pesan generik "Belum kedengaran, coba lagi", padahal
 * "izin mikrofon ditolak" butuh tindakan beda total dari "belum ada suara
 * terdengar" — anak/ortu bisa tap ulang selamanya tanpa pernah berhasil
 * kalau pesannya tidak actionable).
 */
/** `'aborted'` — SENGAJA dipisah dari `'error'` (bukan cuma "gagal dengar"):
 *  ini kondisi mic DIHENTIKAN PAKSA oleh `stopListening()` (lihat di bawah),
 *  bukan STT gagal mendengar anak. Pemanggil WAJIB membedakan — kalau
 *  disamakan dengan error biasa, anak akan melihat pesan "Belum kedengaran,
 *  coba lagi" padahal dia belum sempat selesai bicara sama sekali (dihentikan
 *  krn tap "Dengar Contoh"), yang salah/menyesatkan. */
export type ListenErrorKind = 'unsupported' | 'no-speech' | 'not-allowed' | 'audio-capture' | 'network' | 'aborted' | 'error';

function mapSpeechErrorKind(rawError: string): ListenErrorKind {
  if (rawError === 'no-speech') return 'no-speech';
  if (rawError === 'not-allowed' || rawError === 'service-not-allowed') return 'not-allowed';
  if (rawError === 'audio-capture') return 'audio-capture';
  if (rawError === 'network') return 'network';
  if (rawError === 'aborted') return 'aborted';
  return 'error';
}

/**
 * Jeda tunggu SETELAH anak berhenti bicara sebelum dianggap BENERAN selesai
 * (dilaporkan user: kalimat panjang mis. "The doctor helps sick people."
 * sudah dinilai padahal belum selesai diucapkan). Akar masalahnya BUKAN ada
 * "sleep" yang sengaja dipasang — sebaliknya, TIDAK ADA jeda sama sekali:
 * default browser `continuous=false` bikin SpeechRecognition berhenti &
 * langsung memicu `onresult` FINAL di JEDA PERTAMA yang terdeteksi (anak
 * ambil napas sebentar di tengah kalimat pun sudah dianggap "selesai
 * ngomong"), lalu itu langsung dinilai — bukan menunggu kalimat utuh.
 * Perbaikan: `continuous=true` (recognition tidak berhenti sendiri di jeda
 * pertama) + jeda tunggu MANUAL `SILENCE_GRACE_MS` yang di-reset tiap ada
 * hasil/suara baru — baru dianggap selesai kalau BENERAN tidak ada suara
 * baru selama itu, lihat `wireContinuousListen`. */
const SILENCE_GRACE_MS = 1300;
/** Jaga-jaga kalau browser tidak pernah trigger onend/onerror sendiri (jarang,
 *  tapi tanpa ini mic bisa nyala tanpa batas). */
const MAX_LISTEN_MS = 15000;

/**
 * Bungkus 1 instance SpeechRecognition dengan pola "tunggu sampai BENERAN
 * diam" di atas — dipakai `listenOnce`/`listenAndRecordOnce` supaya kedua-
 * duanya otomatis kebagian perbaikan yang sama, bukan patch dobel di 2
 * tempat. Transkrip FINAL digabung tiap `onresult` progresif (bukan cuma
 * dibaca sekali di akhir) — ini yang membuat kalimat panjang dgn jeda napas
 * di tengah tetap terkumpul utuh, bukan cuma potongan pertama.
 */
/** Instance SpeechRecognition yang lagi aktif (kalau ada) — dipakai
 *  `stopListening()` supaya `speak()`/`speakSequence()` bisa menghentikan
 *  mic PAKSA sebelum bicara (lihat `stopListening()`). Cuma 1 sesi listen
 *  yang mungkin aktif di satu waktu (UI selalu 1 tombol mic per layar). */
let activeRec: SpeechRecognition | null = null;

function wireContinuousListen(
  rec: SpeechRecognition,
  onFinal: (transcript: string, confidence: number) => void,
  onErr: (kind: ListenErrorKind) => void
): void {
  // Hentikan TTS SEBELUM mulai rekam (dilaporkan user: "Play Suaramu"
  // kedengaran ada gema di awal walau anak bicara normal) — akar masalahnya
  // BUKAN gema beneran, tapi rekaman mulai SEBELUM audio "🔊 Dengar
  // Contoh"/TTS lain selesai bicara (anak sering tap mic sebelum TTS
  // tuntas), jadi ekor suara TTS ikut terekam tepat di awal klip, lalu
  // suara anak menimpa di atasnya — kedengarannya seperti gema/dobel
  // suara. Ditaruh DI SINI (bukan di tiap pemanggil `listenOnce`/
  // `listenAndRecordOnce`, ada 6 titik panggil lintas file) supaya SEMUA
  // otomatis aman, sama pola dgn `SPEAK_SAFETY_DELAY_MS` di atas.
  stopSpeaking();

  rec.continuous = true;
  rec.interimResults = true;

  let finalTranscript = '';
  let lastConfidence = 0;
  let silenceTimer: ReturnType<typeof setTimeout> | undefined;
  let maxTimer: ReturnType<typeof setTimeout> | undefined;
  let settled = false;

  const stopNow = (): void => {
    clearTimeout(silenceTimer);
    clearTimeout(maxTimer);
    try {
      rec.stop();
    } catch {
      /* sudah berhenti sendiri — diabaikan dengan sengaja */
    }
  };
  // Dipanggil tiap ada suara/hasil baru — mundurkan jeda tunggu, JANGAN
  // langsung stop() dari sini (itu sebabnya bug lama muncul: berhenti di
  // jeda PERTAMA, bukan nunggu diam beneran).
  const resetSilenceTimer = (): void => {
    clearTimeout(silenceTimer);
    silenceTimer = setTimeout(stopNow, SILENCE_GRACE_MS);
  };

  rec.onresult = (e) => {
    for (let i = e.resultIndex; i < e.results.length; i += 1) {
      const result = e.results[i];
      if (result.isFinal) {
        finalTranscript = `${finalTranscript} ${result[0].transcript}`.trim();
        lastConfidence = result[0].confidence;
      }
    }
    resetSilenceTimer();
  };
  rec.onspeechstart = () => resetSilenceTimer();
  rec.onerror = (e) => {
    if (settled) return; // `onend` selalu menyusul onerror — jangan dobel panggil
    settled = true;
    if (activeRec === rec) activeRec = null;
    clearTimeout(silenceTimer);
    clearTimeout(maxTimer);
    // "no-speech" tapi transkrip SUDAH ada (browser menganggap jeda napas
    // di tengah kalimat sbg "diam total") — tetap pakai yang sudah
    // terkumpul, jangan dibuang sebagai error (non-punitive: anak sudah
    // coba ngomong, jangan disuruh ulang dari nol krn kesalahan deteksi).
    // KHUSUS 'aborted' (`stopListening()` dipanggil paksa, mis. anak tap
    // "Dengar Contoh" pas mic masih aktif) — JANGAN salvage finalTranscript
    // sekalipun sudah ada isinya: transkrip itu berpotensi tercampur ekor
    // audio TTS yang baru mau diputar, bukan murni ucapan anak.
    if (finalTranscript && e.error === 'no-speech') onFinal(finalTranscript, lastConfidence);
    else onErr(mapSpeechErrorKind(e.error));
  };
  rec.onend = () => {
    if (settled) return;
    settled = true;
    if (activeRec === rec) activeRec = null;
    clearTimeout(silenceTimer);
    clearTimeout(maxTimer);
    if (finalTranscript) onFinal(finalTranscript, lastConfidence);
    else onErr('no-speech');
  };

  maxTimer = setTimeout(stopNow, MAX_LISTEN_MS);
  activeRec = rec;
  rec.start();
}

/**
 * Hentikan sesi SpeechRecognition yang lagi aktif (kalau ada) SEKARANG JUGA —
 * dipanggil otomatis di awal `speak()`/`speakLocalized()`/`speakSequence()`
 * (simetris dgn `stopSpeaking()` yang sudah dipanggil di awal
 * `wireContinuousListen()`, lihat komentar di atasnya). Tanpa ini: anak tap
 * 🎤 (mic mulai dengar), lalu ragu & tap "🔊 Dengar Contoh"/"Dengar Lagi" —
 * audio TTS yang keluar dari speaker IKUT TEREKAM mic yang masih aktif &
 * dianggap sbg ucapan anak (race condition dilaporkan user: "jawabannya
 * hasil dari sistem bukan user"). `.abort()` (bukan `.stop()`) supaya
 * transkrip yang sudah terkumpul BENAR-BENAR dibuang, bukan diproses sbg
 * hasil — browser memicu `onerror` dgn `event.error === 'aborted'`
 * (`mapSpeechErrorKind`), yang diteruskan ke pemanggil sbg
 * `ListenErrorKind: 'aborted'` supaya UI-nya reset diam-diam (BUKAN pesan
 * "belum kedengaran, coba lagi" — itu akan menyalahkan anak padahal
 * sistem sendiri yang menyela). Juga melepas `MediaRecorder` paralel
 * (`releaseMicStream`) supaya rekaman utk "Play Suaramu" tidak ikut
 * kebawa suara TTS yang menyela.
 */
export function stopListening(): void {
  if (activeRec) {
    try {
      activeRec.abort();
    } catch {
      /* sudah berhenti sendiri — diabaikan dengan sengaja */
    }
    activeRec = null;
  }
  releaseMicStream();
}

/**
 * Rekam 1 ucapan anak, panggil onResult dengan transkrip mentah dari browser.
 * `confidence` (0-1) datang gratis dalam paket respons yang sama — nol biaya
 * tambahan (doc/first_placement_test.md §7.2a). Peringatan: tidak konsisten
 * antar-browser (Firefox dilaporkan selalu balikin 1), jadi cuma layak
 * dipakai sebagai sinyal tambahan/bonus, bukan syarat tunggal — lihat
 * pemakaiannya di games/placement.ts (evaluasi openmic).
 */
export function listenOnce(
  onResult: (said: string, confidence: number) => void,
  onError: (kind: ListenErrorKind) => void
): void {
  if (!SR) {
    onError('unsupported');
    return;
  }
  const rec = new SR();
  rec.lang = 'en-US';
  rec.maxAlternatives = 1;
  wireContinuousListen(rec, onResult, onError);
}

/* ---------- Rekam suara mentah utk "Play Suaramu" (CLAUDE.md: wajib tiap ---------- */
/* ada Speaking) — SpeechRecognition TIDAK PERNAH mengekspos audio mentahnya */
/* (cuma transkrip+confidence), jadi direkam TERPISAH lewat MediaRecorder,  */
/* paralel dgn SpeechRecognition. Pola porting dari referensi              */
/* backup/daily-conversation-asr (1).html (ensureMicStream/releaseMic).    */

let recordingStream: MediaStream | null = null;
let activeRecorder: MediaRecorder | null = null;

/** SATU stream mic dipakai ulang tiap giliran (bukan getUserMedia() baru
 *  tiap tap) — tanpa ini browser nge-prompt ulang izin mikrofon terus,
 *  dobel dengan prompt izin milik SpeechRecognition sendiri. */
function ensureMicStream(onReady: (stream: MediaStream) => void, onError: () => void): void {
  if (recordingStream && recordingStream.active) {
    onReady(recordingStream);
    return;
  }
  if (!navigator.mediaDevices?.getUserMedia) {
    onError();
    return;
  }
  navigator.mediaDevices
    // Constraint EKSPLISIT (bukan cuma `{ audio: true }` polos) — bantu
    // cegah gema/feedback beneran di perangkat dgn speaker+mic berdekatan
    // (tablet/laptop, umum di app ini). Browser modern default-nya biasanya
    // sudah begini, tapi tidak semua — minta eksplisit lebih aman lintas
    // perangkat drpd mengandalkan default yg tidak konsisten.
    .getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } })
    .then((stream) => {
      recordingStream = stream;
      onReady(stream);
    })
    .catch(onError);
}

/** Lepas mic SEPENUHNYA begitu 1 giliran rekam selesai — supaya indikator
 *  "sedang merekam" di tab browser cuma nyala SELAMA benar-benar merekam,
 *  bukan sepanjang sesi. */
function releaseMicStream(): void {
  if (activeRecorder && activeRecorder.state !== 'inactive') {
    try {
      activeRecorder.stop();
    } catch {
      /* diabaikan dengan sengaja */
    }
  }
  activeRecorder = null;
  if (recordingStream) {
    recordingStream.getTracks().forEach((t) => t.stop());
    recordingStream = null;
  }
}

/**
 * Sama seperti `listenOnce()`, TAPI juga merekam audio mentah anak lewat
 * MediaRecorder secara paralel, best-effort — kalau getUserMedia gagal/
 * ditolak/tidak didukung, `onResult`/`onError` tetap jalan normal persis
 * `listenOnce()` biasa, cuma `onAudioReady` yang tidak akan pernah dipanggil
 * (caller cukup biarkan tombol "Play Suaramu" tetap nonaktif — bukan
 * dead-end, cuma satu fitur pelengkap yang tidak muncul).
 * `onAudioReady` BISA menyala SETELAH `onResult` (MediaRecorder.onstop
 * bersifat async) — caller perlu nge-patch tombolnya belakangan begitu
 * siap, bukan menunggunya di dalam `onResult`.
 */
export function listenAndRecordOnce(
  onResult: (said: string, confidence: number) => void,
  onError: (kind: ListenErrorKind) => void,
  onAudioReady: (audioUrl: string) => void
): void {
  if (!SR) {
    onError('unsupported');
    return;
  }
  const rec = new SR();
  rec.lang = 'en-US';
  rec.maxAlternatives = 1;

  ensureMicStream(
    (stream) => {
      const chunks: BlobPart[] = [];
      try {
        const recorder = new MediaRecorder(stream);
        activeRecorder = recorder;
        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) chunks.push(e.data);
        };
        recorder.onstop = () => {
          if (!chunks.length) return;
          onAudioReady(URL.createObjectURL(new Blob(chunks, { type: recorder.mimeType || 'audio/webm' })));
        };
        recorder.start();
      } catch {
        activeRecorder = null;
      }
    },
    () => {
      /* diabaikan dengan sengaja — lihat catatan di atas */
    }
  );

  wireContinuousListen(
    rec,
    (transcript, confidence) => {
      releaseMicStream();
      onResult(transcript, confidence);
    },
    (kind) => {
      releaseMicStream();
      onError(kind);
    }
  );
}

export function normalize(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Cek longgar: minimal separuh kata kunci (>2 huruf) di kalimat target
 * kedengaran di ucapan anak. Non-punitive by design — bukan exact match.
 */
export function looseMatch(said: string, target: string): boolean {
  const s = normalize(said);
  const t = normalize(target);
  if (!s) return false;
  const tWords = t.split(' ').filter((w) => w.length > 2);
  const hit = tWords.filter((w) => s.includes(w)).length;
  return hit >= Math.max(1, Math.ceil(tWords.length * 0.5));
}

export interface WordMatch {
  word: string;
  matched: boolean;
}

/**
 * Rincian per-kata (bukan cuma boolean seperti looseMatch) — dipakai untuk
 * highlight kata per kata di layar hasil Speaking (referensi:
 * backup/daily-conversation-asr (1).html `renderResult`). Tiap kata di
 * `target` dicek ada/tidaknya di ucapan yang terdengar — longgar (cukup
 * KATA-nya ada di transkrip, bukan urutan/tata bahasa persis), konsisten
 * dgn semangat non-punitive looseMatch().
 */
export function wordMatchDetail(said: string, target: string): WordMatch[] {
  const heardWords = new Set(normalize(said).split(' ').filter(Boolean));
  return normalize(target)
    .split(' ')
    .filter(Boolean)
    .map((word) => ({ word, matched: heardWords.has(word) }));
}

/* ---------- Nada benar/salah (Web Audio API — nol biaya, tanpa file audio) ---------- */

let audioCtx: AudioContext | null = null;

/** Satu instance dipakai ulang (browser membatasi jumlah AudioContext) —
 *  dibuat baru cuma kalau belum ada/gagal, dan di-resume kalau browser
 *  men-suspend-nya (kebijakan autoplay — aman di sini karena selalu
 *  dipanggil dari dalam handler tap anak, bukan otomatis). */
function getAudioCtx(): AudioContext | null {
  try {
    if (!audioCtx) {
      const Ctor = window.AudioContext ?? window.webkitAudioContext;
      if (!Ctor) return null;
      audioCtx = new Ctor();
    }
    if (audioCtx.state === 'suspended') void audioCtx.resume();
    return audioCtx;
  } catch {
    return null;
  }
}

function playTone(ctx: AudioContext, freq: number, startOffset: number, duration: number, peakGain: number): void {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.value = freq;
  const t0 = ctx.currentTime + startOffset;
  gain.gain.setValueAtTime(0, t0);
  gain.gain.linearRampToValueAtTime(peakGain, t0 + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.001, t0 + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(t0);
  osc.stop(t0 + duration + 0.02);
}

/** Nada jawaban benar — 2 nada naik (C5→E5), ceria & pendek. Dipanggil dari
 *  handler tap (user gesture), jadi tidak kena blokir autoplay browser. */
export function playCorrectTone(): void {
  const ctx = getAudioCtx();
  if (!ctx) return;
  try {
    playTone(ctx, 523.25, 0, 0.12, 0.15); // C5
    playTone(ctx, 659.25, 0.1, 0.18, 0.15); // E5
  } catch {
    /* diabaikan dengan sengaja — animasi & teks tetap tampil tanpa nada */
  }
}

/** Nada jawaban kurang tepat — 1 nada rendah & lembut (BUKAN buzzer/alarm
 *  yang mengagetkan — CLAUDE.md poin 1: hindari nuansa menegangkan). */
export function playTryAgainTone(): void {
  const ctx = getAudioCtx();
  if (!ctx) return;
  try {
    playTone(ctx, 293.66, 0, 0.22, 0.1); // D4, lembut
  } catch {
    /* diabaikan dengan sengaja — animasi & teks tetap tampil tanpa nada */
  }
}

/* ---------- Getar (Vibration API — nol biaya; tidak didukung iOS Safari, ---------- */
/* diabaikan diam-diam di situ, bukan error yang perlu ditangani caller). */

export function vibrateDevice(pattern: number | number[]): void {
  try {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  } catch {
    /* diabaikan dengan sengaja */
  }
}
