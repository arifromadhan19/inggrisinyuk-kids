/** TTS & STT lewat Web Speech API bawaan browser — sama persis pola di daily-conversation-asr.html. */

export const ttsSupported = 'speechSynthesis' in window;

/* ---------- Kecepatan & pilihan suara (diport dari daily-conversation-asr (1).html) ---------- */

export const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5] as const;
export type VoiceGender = 'female' | 'male';
export type VoiceAccent = 'us' | 'uk';

let playbackRate = 0.9;
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
const PREFERRED_NAMES: Record<VoiceAccent, Record<VoiceGender, string[]>> = {
  us: {
    female: ['Samantha', 'Victoria', 'Ava', 'Susan', 'Allison', 'Google US English'],
    male: ['Alex', 'Fred', 'Aaron', 'Google US English'],
  },
  uk: {
    female: ['Flo', 'Kate', 'Serena', 'Moira', 'Google UK English Female'],
    male: ['Daniel', 'Arthur', 'Google UK English Male'],
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

function loadVoices(): void {
  const voices = window.speechSynthesis.getVoices();
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

export function speak(text: string): void {
  if (!ttsSupported) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = utteranceLang();
  u.rate = playbackRate;
  if (selectedVoice) u.voice = selectedVoice;
  window.speechSynthesis.speak(u);
}

/** Ucapkan beberapa kalimat berurutan dengan jeda, mis. untuk cerita mini Listening. */
export function speakSequence(lines: string[], gapMs = 1600): void {
  if (!ttsSupported || lines.length === 0) return;
  window.speechSynthesis.cancel();
  const gap = gapMs / playbackRate; // jeda ikut memanjang di kecepatan rendah biar tidak numpuk
  lines.forEach((line, i) => {
    const u = new SpeechSynthesisUtterance(line);
    u.lang = utteranceLang();
    u.rate = playbackRate;
    if (selectedVoice) u.voice = selectedVoice;
    setTimeout(() => window.speechSynthesis.speak(u), i * gap);
  });
}

const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
export const sttSupported = !!SR;

export type ListenErrorKind = 'unsupported' | 'error';

/** Rekam 1 ucapan anak, panggil onResult dengan transkrip mentah dari browser. */
export function listenOnce(
  onResult: (said: string) => void,
  onError: (kind: ListenErrorKind) => void
): void {
  if (!SR) {
    onError('unsupported');
    return;
  }
  const rec = new SR();
  rec.lang = 'en-US';
  rec.maxAlternatives = 1;
  rec.onresult = (e) => onResult(e.results[0][0].transcript);
  rec.onerror = () => onError('error');
  rec.start();
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
