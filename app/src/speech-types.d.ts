/**
 * Web Speech API (SpeechRecognition) belum masuk lib.dom.d.ts TypeScript resmi
 * karena statusnya masih non-standar/experimental. Deklarasi minimal ini cuma
 * cakup bagian yang benar-benar dipakai di src/speech.ts.
 */
interface SpeechRecognitionAlternative {
  transcript: string;
  /** 0-1, tidak konsisten antar-browser (Firefox dilaporkan selalu 1) — lihat listenOnce() di speech.ts. */
  confidence: number;
}

interface SpeechRecognitionResult {
  0: SpeechRecognitionAlternative;
  length: number;
  /** true = hasil ini final (tidak akan berubah lagi) — cuma berarti kalau
   *  `interimResults`/`continuous` dinyalakan, lihat `wireContinuousListen`
   *  di speech.ts. */
  isFinal: boolean;
}

interface SpeechRecognitionResultList {
  [index: number]: SpeechRecognitionResult;
  length: number;
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  /** Index pertama di `results` yang BARU sejak event sebelumnya — dipakai
   *  supaya tiap `onresult` cuma memproses hasil baru, bukan menghitung
   *  ulang semua dari awal (spec-nya begini, bukan kebiasaan lib ini). */
  resultIndex: number;
}

/** `error` — lihat daftar resmi: 'no-speech' | 'audio-capture' | 'not-allowed'
 *  | 'service-not-allowed' | 'network' | dst (MDN SpeechRecognitionErrorEvent). */
interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

interface SpeechRecognition extends EventTarget {
  lang: string;
  maxAlternatives: number;
  /** `false` (default browser) = berhenti di JEDA PERTAMA, walau anak belum
   *  selesai ngomong kalimat panjang — akar masalah "dinilai sebelum
   *  selesai" (lihat `wireContinuousListen`). Dinyalakan `true` supaya jeda
   *  napas di tengah kalimat tidak langsung dianggap selesai. */
  continuous: boolean;
  /** Wajib `true` berpasangan dgn `continuous` — tanpa ini beberapa browser
   *  tidak mengirim `onresult` progresif, cuma diam sampai `onend`. */
  interimResults: boolean;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  /** Suara PERTAMA terdeteksi sesudah jeda — dipakai reset jeda tunggu
   *  supaya napas anak di tengah kalimat tidak dihitung "sudah selesai". */
  onspeechstart: (() => void) | null;
  /** Recognition beneran BERHENTI (manual `stop()` ATAU browser sendiri) —
   *  titik final resmi untuk mengambil transkrip lengkap. */
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  /** Berhenti SEKARANG, buang hasil yang belum final (beda dari `stop()`,
   *  yang masih memproses audio yang sudah terekam) — browser memicu
   *  `onerror` dgn `event.error === 'aborted'`. Dipakai `stopListening()`
   *  di speech.ts supaya audio TTS yang menyela tidak ikut ditranskrip
   *  sbg ucapan anak (race condition mic vs "Dengar Contoh"). */
  abort(): void;
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognition;
}

interface Window {
  SpeechRecognition?: SpeechRecognitionConstructor;
  webkitSpeechRecognition?: SpeechRecognitionConstructor;
  /** Safari lama pakai prefix ini utk AudioContext — lib.dom cuma punya nama tanpa prefix. */
  webkitAudioContext?: typeof AudioContext;
}
