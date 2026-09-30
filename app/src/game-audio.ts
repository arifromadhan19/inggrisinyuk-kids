/**
 * Suara Game Hub — musik latar per game + efek suara aksi (Fase 1
 * `materi/suasana_game.md`, permintaan user "kerjakan fase 1 dan 2").
 *
 * 🔒 Musik = FILE Pixabay pilihan user (permintaan user 2026-09-30 "gunakan
 * musik ini... 3 musik tadi di assign ke 7 game", `GAME_TRACK` di bawah),
 * diputar lewat Web Audio (loop mulus, jeda hening MP3 dipangkas). Musik
 * DIBUAT KODE (melodi + bass + ketukan, `THEMES`) tetap ada sbg CADANGAN
 * kalau file gagal dimuat (offline, browser lama). Di layar Map musik
 * sedikit lebih pelan dari di dalam markas.
 *
 * Aturan (riset `materi/suasana_game.md` §3.2 & §3.5):
 * - Musik OTOMATIS mengecil (±−12 dB) selama TTS bicara — anak butuh ucapan
 *   lebih jelas dari orang dewasa di tengah suara lain. Dicek tiap 120 ms
 *   lewat `speechSynthesis.speaking`, jadi berlaku utk SEMUA jalur `speak*()`.
 * - Musik baru mulai setelah anak mengetuk (masuk game = ketukan) — kebijakan
 *   autoplay browser; kalau halaman dibuka langsung, AudioContext di-resume
 *   pada ketukan pertama.
 * - Berhenti saat pindah layar (`render()` app.ts, aturan wajib audio
 *   CLAUDE.md) & dijeda saat tab disembunyikan.
 * - Musik & efek bisa dimatikan terpisah (tombol di header game + Pengaturan),
 *   disimpan per perangkat. Nada benar/salah (`playCorrectTone`/
 *   `playWrongTone`, speech.ts) TIDAK ikut dimatikan — itu umpan balik wajib.
 */
import { getAudioCtx } from './speech';

const SETTINGS_KEY = 'inggrisinyuk-kids.game-audio.v1';

interface AudioSettings {
  music: boolean;
  sfx: boolean;
}

function loadSettings(): AudioSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) {
      const s = JSON.parse(raw) as Partial<AudioSettings>;
      return { music: s.music !== false, sfx: s.sfx !== false };
    }
  } catch {
    /* localStorage bisa diblokir — pakai default */
  }
  return { music: true, sfx: true };
}

let settings = loadSettings();

function saveSettings(): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    /* abaikan */
  }
}

export function isMusicOn(): boolean {
  return settings.music;
}

export function isSfxOn(): boolean {
  return settings.sfx;
}

export function setMusicOn(on: boolean): void {
  settings = { ...settings, music: on };
  saveSettings();
  if (!on) pauseScheduler();
  else if (currentTheme) startGameMusic(currentTheme);
}

export function setSfxOn(on: boolean): void {
  settings = { ...settings, sfx: on };
  saveSettings();
}

/* ------------------------------------------------------------------ tema -- */

type Wave = OscillatorType;

interface Theme {
  bpm: number;
  /** Nada dasar (MIDI). */
  root: number;
  /** Tangga nada (semitone dari root). */
  scale: number[];
  /** Derajat tangga nada per ketukan 1/8 (`null` = diam). Derajat ≥ panjang
   *  tangga nada = oktaf berikutnya. */
  melody: (number | null)[];
  /** Bass per ketukan 1/8, satu oktaf di bawah. */
  bass: (number | null)[];
  lead: Wave;
  /** Ketukan per birama (4 atau 3 utk waltz), dipakai pola ketukan lembut. */
  beats: number;
}

const MAJOR = [0, 2, 4, 5, 7, 9, 11];
const PENTA = [0, 2, 4, 7, 9];
const DORIAN = [0, 2, 3, 5, 7, 9, 10];
const MIXO = [0, 2, 4, 5, 7, 9, 10];

const _ = null;

/** Tema per game (`RajaKey`) + `hub` cadangan. Melodi sengaja riang &
 *  sederhana (kid-friendly: tidak tegang, tidak gelap). */
const THEMES: Record<string, Theme> = {
  // Word Quest — mars kecil yang riang (C mayor).
  kata: {
    bpm: 104, root: 72, scale: MAJOR, lead: 'triangle', beats: 4,
    melody: [0, _, 2, _, 4, _, 2, _, 5, 4, 2, _, 4, _, _, _, 2, _, 4, _, 5, _, 7, _, 5, 4, 2, 1, 0, _, _, _],
    bass: [0, _, _, _, 4, _, _, _, 3, _, _, _, 4, _, _, _, 5, _, _, _, 3, _, _, _, 4, _, _, _, 0, _, _, _],
  },
  // Balloon Hunt — melambung (F mayor, loncatan lebar).
  balon: {
    bpm: 116, root: 77, scale: MAJOR, lead: 'sine', beats: 4,
    melody: [0, 4, 7, _, 4, _, 2, _, 3, 5, 7, _, 5, _, 4, _, 0, 4, 7, _, 9, _, 7, _, 5, 4, 2, _, 0, _, _, _],
    bass: [0, _, 4, _, 0, _, 4, _, 3, _, 5, _, 3, _, 5, _, 0, _, 4, _, 0, _, 4, _, 3, _, 4, _, 0, _, _, _],
  },
  // Sentence Puzzle — langkah kecil berpikir (G mayor).
  susun: {
    bpm: 98, root: 67, scale: MAJOR, lead: 'triangle', beats: 4,
    melody: [4, _, 3, _, 2, _, 3, _, 4, _, 4, _, 4, _, _, _, 3, _, 3, _, 3, _, _, _, 4, _, 6, _, 6, _, _, _],
    bass: [0, _, _, _, 4, _, _, _, 0, _, _, _, 4, _, _, _, 3, _, _, _, 4, _, _, _, 0, _, _, _, 4, _, _, _],
  },
  // Raja Kelompok — riuh pasar (D mixolydian).
  kelompok: {
    bpm: 112, root: 74, scale: MIXO, lead: 'square', beats: 4,
    melody: [0, _, 0, 2, 4, _, 2, _, 6, _, 4, _, 2, _, _, _, 0, _, 0, 2, 4, _, 5, _, 4, 2, 1, _, 0, _, _, _],
    bass: [0, _, _, 0, 4, _, _, _, 6, _, _, 6, 3, _, _, _, 0, _, _, 0, 4, _, _, _, 3, _, 4, _, 0, _, _, _],
  },
  // Memory Hunt — misteri lembut (A dorian, tidak menakutkan).
  ingatan: {
    bpm: 90, root: 69, scale: DORIAN, lead: 'sine', beats: 4,
    melody: [0, _, 2, _, 4, _, 7, _, 6, _, 4, _, 2, _, _, _, 3, _, 4, _, 6, _, 4, _, 2, _, 1, _, 0, _, _, _],
    bass: [0, _, _, _, _, _, _, _, 3, _, _, _, _, _, _, _, 5, _, _, _, _, _, _, _, 4, _, _, _, _, _, _, _],
  },
  // Sound Hunt — suling hutan (E pentatonik).
  soundhunt: {
    bpm: 88, root: 76, scale: PENTA, lead: 'sine', beats: 4,
    melody: [0, _, 1, 2, 4, _, 2, _, 3, _, 2, 1, 0, _, _, _, 2, _, 3, 4, 5, _, 4, _, 3, _, 1, _, 0, _, _, _],
    bass: [0, _, _, _, 3, _, _, _, 2, _, _, _, 3, _, _, _, 0, _, _, _, 3, _, _, _, 4, _, _, _, 0, _, _, _],
  },
  // Story Quest — kotak musik waltz (C mayor, 3/4).
  storyquest: {
    bpm: 132, root: 84, scale: MAJOR, lead: 'sine', beats: 3,
    melody: [0, _, 2, 4, _, 2, 5, _, 4, 2, _, _, 1, _, 2, 3, _, 1, 4, _, 2, 0, _, _],
    bass: [0, _, _, 4, _, _, 3, _, _, 4, _, _, 4, _, _, 1, _, _, 3, _, _, 0, _, _],
  },
};

/* ---------------------------------------------------------- file musik -- */

/** 3 lagu Pixabay (Pixabay Content License — boleh komersial tanpa atribusi,
 *  tidak boleh dibagikan sbg file musik lepas). Dikompres ke 96 kbps.
 *  - "Adventure Game Loop – Fun and Uplifting" (Cyberwave-Orchestra)
 *  - "Upbeat Background Loop – Casual Video Game Music" (Cyberwave-Orchestra)
 *  - "Happy Kids Loop – Ready To Play" (Sonican)
 *  Sumber & link lengkap: `materi/suasana_game.md` §4.6. */
const TRACKS = {
  adventure: '/audio/adventure-game-loop.mp3',
  upbeat: '/audio/upbeat-background-loop.mp3',
  happy: '/audio/happy-kids-loop.mp3',
} as const;

/** Pembagian 3 lagu ke 7 game — TETAP per game (tiap game selalu lagu yang
 *  sama supaya terasa "musik game ini"). */
const GAME_TRACK: Record<string, keyof typeof TRACKS> = {
  kata: 'adventure',
  soundhunt: 'adventure',
  storyquest: 'adventure',
  balon: 'happy',
  kelompok: 'happy',
  susun: 'upbeat',
  ingatan: 'upbeat',
};

/** Volume file musik (file sudah keras; nada benar/salah & TTS harus tetap
 *  menonjol). */
const FILE_LEVEL = 0.32;

const bufferCache = new Map<string, Promise<{ buffer: AudioBuffer; start: number; end: number } | null>>();

/** Muat & decode sekali per lagu, lalu cari batas awal/akhir yang tidak
 *  hening (MP3 selalu punya jeda hening kecil → loop terdengar tersendat). */
function loadTrack(url: string): Promise<{ buffer: AudioBuffer; start: number; end: number } | null> {
  const cached = bufferCache.get(url);
  if (cached) return cached;
  const job = (async () => {
    const ctx = getAudioCtx();
    if (!ctx) return null;
    try {
      const res = await fetch(url);
      if (!res.ok) return null;
      const data = await res.arrayBuffer();
      const buffer = await new Promise<AudioBuffer>((resolve, reject) => ctx.decodeAudioData(data, resolve, reject));
      const ch = buffer.getChannelData(0);
      let first = 0;
      while (first < ch.length && Math.abs(ch[first]) < 0.002) first++;
      let last = ch.length - 1;
      while (last > first && Math.abs(ch[last]) < 0.002) last--;
      return { buffer, start: first / buffer.sampleRate, end: (last + 1) / buffer.sampleRate };
    } catch {
      return null;
    }
  })();
  bufferCache.set(url, job);
  return job;
}

let fileSource: AudioBufferSourceNode | null = null;
/** Naik tiap start/stop — hasil muat lagu yang datang terlambat (anak sudah
 *  pindah layar) diabaikan. */
let playToken = 0;

/* ------------------------------------------------------------- penjadwal -- */

let currentTheme: string | null = null;
let mode: 'map' | 'play' = 'map';
let master: GainNode | null = null;
let timer: number | null = null;
let duckTimer: number | null = null;
let step = 0;
let nextTime = 0;
let ducked = false;

const MUSIC_LEVEL = 1;
const DUCK_LEVEL = 0.25;
const LOOKAHEAD = 0.12;

function midiToFreq(m: number): number {
  return 440 * Math.pow(2, (m - 69) / 12);
}

function degreeToMidi(t: Theme, deg: number, octaveShift = 0): number {
  const n = t.scale.length;
  const oct = Math.floor(deg / n);
  const idx = ((deg % n) + n) % n;
  return t.root + t.scale[idx] + 12 * (oct + octaveShift);
}

function note(ctx: AudioContext, out: AudioNode, freq: number, t0: number, dur: number, peak: number, wave: Wave): void {
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = wave;
  osc.frequency.value = freq;
  g.gain.setValueAtTime(0, t0);
  g.gain.linearRampToValueAtTime(peak, t0 + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0008, t0 + dur);
  osc.connect(g);
  g.connect(out);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

/** Ketukan lembut (noise pendek, difilter) — cuma di dalam markas. */
function tick(ctx: AudioContext, out: AudioNode, t0: number, peak: number): void {
  const len = Math.floor(ctx.sampleRate * 0.05);
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const filt = ctx.createBiquadFilter();
  filt.type = 'highpass';
  filt.frequency.value = 3000;
  const g = ctx.createGain();
  g.gain.value = peak;
  src.connect(filt);
  filt.connect(g);
  g.connect(out);
  src.start(t0);
}

function scheduleStep(ctx: AudioContext, t: Theme, s: number, time: number): void {
  if (!master) return;
  const eighth = 60 / t.bpm / 2;
  const calm = mode === 'map';
  const m = t.melody[s % t.melody.length];
  if (m !== null && (!calm || s % 2 === 0)) {
    // Square terasa tajam — dilunakkan volumenya.
    const peak = (t.lead === 'square' ? 0.018 : 0.04) * (calm ? 0.7 : 1);
    note(ctx, master, midiToFreq(degreeToMidi(t, m)), time, eighth * 1.8, peak, t.lead);
  }
  const b = t.bass[s % t.bass.length];
  if (b !== null) note(ctx, master, midiToFreq(degreeToMidi(t, b, -2)), time, eighth * 3, calm ? 0.035 : 0.05, 'sine');
  if (!calm && s % 2 === 0) {
    const beatInBar = (s / 2) % t.beats;
    tick(ctx, master, time, beatInBar === 0 ? 0.03 : 0.015);
  }
}

function runScheduler(): void {
  const ctx = getAudioCtx();
  if (!ctx || !currentTheme || !master) return;
  const t = THEMES[currentTheme] ?? THEMES.kata;
  const eighth = 60 / t.bpm / 2;
  if (nextTime < ctx.currentTime) nextTime = ctx.currentTime + 0.05;
  while (nextTime < ctx.currentTime + LOOKAHEAD) {
    scheduleStep(ctx, t, step, nextTime);
    step += 1;
    nextTime += eighth;
  }
}

/** Volume dasar: file vs musik buatan kode, peta sedikit lebih pelan. */
function baseLevel(): number {
  return (fileSource ? FILE_LEVEL : MUSIC_LEVEL) * (mode === 'map' ? 0.75 : 1);
}

function pauseScheduler(): void {
  playToken += 1;
  if (fileSource) {
    const src = fileSource;
    fileSource = null;
    window.setTimeout(() => {
      try {
        src.stop();
      } catch {
        /* sudah berhenti */
      }
    }, 400);
  }
  if (timer !== null) window.clearInterval(timer);
  if (duckTimer !== null) window.clearInterval(duckTimer);
  timer = null;
  duckTimer = null;
  if (master) {
    const ctx = getAudioCtx();
    try {
      if (ctx) master.gain.setTargetAtTime(0, ctx.currentTime, 0.05);
    } catch {
      /* abaikan */
    }
    const old = master;
    window.setTimeout(() => old.disconnect(), 400);
    master = null;
  }
}

/** Musik mengecil selama TTS bicara (berlaku utk semua `speak*()`). */
function checkDuck(): void {
  const ctx = getAudioCtx();
  if (!ctx || !master) return;
  const speaking = typeof window.speechSynthesis !== 'undefined' && window.speechSynthesis.speaking;
  if (speaking === ducked) return;
  ducked = speaking;
  master.gain.setTargetAtTime(speaking ? DUCK_LEVEL * baseLevel() : baseLevel(), ctx.currentTime, speaking ? 0.03 : 0.25);
}

/** Mulai musik tema `key` (dipanggil `renderGamePlay`, setelah anak mengetuk
 *  kartu game). Tidak bunyi kalau musik dimatikan. */
export function startGameMusic(key: string): void {
  currentTheme = key;
  if (!settings.music) return;
  pauseScheduler();
  const ctx = getAudioCtx();
  if (!ctx) return;
  const out = ctx.createGain();
  out.gain.value = 0;
  out.connect(ctx.destination);
  master = out;
  ducked = false;
  duckTimer = window.setInterval(checkDuck, 120);
  const token = playToken;
  const url = TRACKS[GAME_TRACK[key] ?? 'adventure'];
  void loadTrack(url).then((track) => {
    // Sudah pindah layar / musik dimatikan selama lagu dimuat → abaikan.
    if (token !== playToken || master !== out) return;
    if (!track) return startSynth(ctx, out);
    const src = ctx.createBufferSource();
    src.buffer = track.buffer;
    src.loop = true;
    src.loopStart = track.start;
    src.loopEnd = track.end;
    src.connect(out);
    fileSource = src;
    src.start(0, track.start);
    out.gain.setTargetAtTime(baseLevel(), ctx.currentTime, 0.4);
  });
}

/** Cadangan: musik buatan kode (tema `THEMES`) kalau file gagal dimuat. */
function startSynth(ctx: AudioContext, out: GainNode): void {
  out.gain.setTargetAtTime(baseLevel(), ctx.currentTime, 0.4);
  step = 0;
  nextTime = ctx.currentTime + 0.1;
  timer = window.setInterval(runScheduler, 30);
  runScheduler();
}

/** Hentikan musik (pindah layar / keluar Game Hub). */
export function stopGameMusic(): void {
  currentTheme = null;
  pauseScheduler();
}

/** Map = versi tenang, markas = versi lengkap (dipanggil otomatis dari
 *  `setGameRoundActive`, interaction.ts). */
export function setGameMusicMode(next: 'map' | 'play'): void {
  mode = next;
  const ctx = getAudioCtx();
  if (ctx && master && !ducked) master.gain.setTargetAtTime(baseLevel(), ctx.currentTime, 0.3);
}

// Tab disembunyikan → jeda; tampil lagi → lanjut (kalau masih di game).
if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      const theme = currentTheme;
      pauseScheduler();
      currentTheme = theme;
    } else if (currentTheme && settings.music && !master) {
      startGameMusic(currentTheme);
    }
  });
  // Halaman game dibuka langsung (tanpa ketukan) → AudioContext suspended;
  // ketukan pertama membangunkannya.
  document.addEventListener('pointerdown', () => void getAudioCtx(), { passive: true });
}

/* ----------------------------------------------------------------- efek -- */

export type SfxName = 'tap' | 'pop' | 'flip' | 'drop' | 'enter' | 'clear' | 'mission';

/** Efek suara aksi — pendek & lembut (makin sering diputar, makin halus). */
export function sfx(name: SfxName): void {
  if (!settings.sfx) return;
  const ctx = getAudioCtx();
  if (!ctx) return;
  const out = ctx.destination;
  const t = ctx.currentTime;
  try {
    switch (name) {
      case 'tap':
        note(ctx, out, 880, t, 0.06, 0.04, 'triangle');
        break;
      case 'pop': {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.frequency.setValueAtTime(900, t);
        osc.frequency.exponentialRampToValueAtTime(180, t + 0.12);
        g.gain.setValueAtTime(0.12, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.14);
        osc.connect(g);
        g.connect(out);
        osc.start(t);
        osc.stop(t + 0.16);
        break;
      }
      case 'flip':
        note(ctx, out, 520, t, 0.07, 0.05, 'triangle');
        note(ctx, out, 780, t + 0.05, 0.07, 0.04, 'triangle');
        break;
      case 'drop':
        note(ctx, out, 392, t, 0.1, 0.06, 'sine');
        note(ctx, out, 523, t + 0.07, 0.12, 0.05, 'sine');
        break;
      case 'enter':
        [523, 659, 784].forEach((f, i) => note(ctx, out, f, t + i * 0.08, 0.18, 0.05, 'triangle'));
        break;
      case 'clear':
        [523, 659, 784, 1047].forEach((f, i) => note(ctx, out, f, t + i * 0.1, 0.3, 0.07, 'triangle'));
        break;
      case 'mission':
        [523, 659, 784, 1047, 784, 1047].forEach((f, i) => note(ctx, out, f, t + i * 0.12, 0.35, 0.08, 'triangle'));
        break;
    }
  } catch {
    /* efek gagal tidak boleh mengganggu game */
  }
}

/* ------------------------------------------------------------- tombol UI -- */

/** Tombol "🎵 Musik: Nyala/Mati" di header game — berlabel jelas (anak sering
 *  bingung ikon 🔇 itu keadaan atau aksi, riset §3.5), target ≥44px. */
export function musicToggleHtml(): string {
  const on = settings.music;
  return `<button class="music-toggle${on ? ' is-on' : ''}" type="button" data-action="toggleGameMusic" role="switch" aria-checked="${on}">${on ? '🎵 Musik: Nyala' : '🔇 Musik: Mati'}</button>`;
}
