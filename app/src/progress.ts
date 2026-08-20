import type { LevelKey, LevelMeta, SkillKey } from './types';

/**
 * Progres disimpan di localStorage per perangkat, tanpa akun (PRD §5).
 * Yang dicatat: modul apa saja yang sudah tuntas dicoba (= 1 bintang, PRD §4.5
 * & §4.6 — bukan skor, bukan "coin"), modul terakhir yang dibuka supaya anak
 * bisa langsung lanjut dari Beranda, level mana yang Tantangan Bos-nya sudah
 * ditaklukkan (dipakai Peta Level untuk buka/kunci — lihat `levelUnlockMap`),
 * dan XP — satu angka pertumbuhan yang cuma pernah naik, tidak pernah turun,
 * murni motivasi ("ala Solo Leveling" tapi sepenuhnya non-punitive: tidak ada
 * cara XP berkurang, tidak ada HP yang bisa habis). XP TIDAK dipakai untuk
 * membuka level — itu tetap murni dari `bossCleared` (Belajar tetap inti).
 * Selain itu: streak harian (1 hari pelindung, lihat `getStreak`) dan
 * ketepatan tepat/total (lihat `getAccuracy`) — dua-duanya derived, cuma
 * dihitung dari data yang sudah ada di sini, bukan field sumber kebenaran
 * baru.
 *
 * Tidak ada antrian review yang ditampilkan ke anak (PRD §4.3). Tidak ada
 * coin/mata uang (PRD §4.6) dan tidak ada HP/nyawa yang bisa habis (§12.4).
 */

const KEY = 'inggrisinyuk-kids.progress.v1';

/** Set tetap avatar hewan — dipilih tap, bukan upload foto (PRD: ramah anak,
 *  privasi). Singa duluan karena sudah jadi maskot app di mana-mana. */
export const ANIMAL_AVATARS = ['🦁', '🐯', '🐰', '🐶', '🐱', '🐼', '🦊', '🐨', '🐸', '🐵', '🦄', '🐧'] as const;

export interface LastSpot {
  skill: SkillKey;
  topicIndex: number;
}

interface Store {
  done: string[];
  last: LastSpot | null;
  bossCleared: string[];
  xp: number;
  /** Tanggal (YYYY-MM-DD, lokal perangkat) yang punya aktivitas — dipakai
   *  "Progres Harian" (`getWeekActivity`, murni strip 7 hari tanpa aturan
   *  berturut-turut) DAN streak (`getStreak`, di bawah — permintaan revisi
   *  yang sengaja tidak dipakai di iterasi sebelumnya, sekarang dipasang lagi
   *  dengan 1 hari pelindung supaya tetap non-punitive, lihat `getStreak`). */
  activeDays: string[];
  /** Tepat/total percobaan di soal yang punya jawaban benar-salah objektif
   *  (pilih gambar, susun kata/kalimat) — dipakai utk "Ketepatan" (§ di
   *  bawah). SENGAJA tidak menghitung percobaan lewat mic (Speaking): ASR
   *  anak tidak selalu akurat, jadi mic sudah didesain "selalu dianggap
   *  berhasil" di games/*.ts — menghitungnya di sini cuma akan bikin angka
   *  akurasi menyesatkan, bukan mengukur ketepatan beneran. */
  correctAttempts: number;
  totalAttempts: number;
  /** Nama panggilan anak, buat sapaan "Hi {nama}" di header — murni lokal,
   *  bukan akun (PRD §5, tanpa auth/backend). Boleh kosong. */
  name: string;
  /** Avatar hewan lucu, dipilih dari set tetap (lihat ANIMAL_AVATARS di
   *  progress.ts) — bukan upload foto (privasi anak, murni lokal juga). */
  avatar: string;
}

const EMPTY: Store = {
  done: [],
  last: null,
  bossCleared: [],
  xp: 0,
  activeDays: [],
  correctAttempts: 0,
  totalAttempts: 0,
  name: '',
  avatar: ANIMAL_AVATARS[0],
};

function read(): Store {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...EMPTY };
    const parsed = JSON.parse(raw) as Partial<Store>;
    const num = (v: unknown): number => (typeof v === 'number' && Number.isFinite(v) && v >= 0 ? v : 0);
    return {
      done: Array.isArray(parsed.done) ? parsed.done.filter((d) => typeof d === 'string') : [],
      last: parsed.last ?? null,
      bossCleared: Array.isArray(parsed.bossCleared) ? parsed.bossCleared.filter((d) => typeof d === 'string') : [],
      xp: num(parsed.xp),
      activeDays: Array.isArray(parsed.activeDays) ? parsed.activeDays.filter((d) => typeof d === 'string') : [],
      correctAttempts: num(parsed.correctAttempts),
      totalAttempts: num(parsed.totalAttempts),
      name: typeof parsed.name === 'string' ? parsed.name.slice(0, 24) : '',
      avatar:
        typeof parsed.avatar === 'string' && (ANIMAL_AVATARS as readonly string[]).includes(parsed.avatar)
          ? parsed.avatar
          : ANIMAL_AVATARS[0],
    };
  } catch {
    // Storage bisa diblokir (mode privat). App tetap jalan, cuma tanpa progres.
    return { ...EMPTY };
  }
}

function write(store: Store): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(store));
  } catch {
    /* diabaikan dengan sengaja — progres bersifat opsional */
  }
}

const tag = (skill: SkillKey, topicId: string): string => `${skill}:${topicId}`;

export function markDone(skill: SkillKey, topicId: string): void {
  const store = read();
  const id = tag(skill, topicId);
  if (!store.done.includes(id)) store.done.push(id);
  write(store);
}

export function isDone(skill: SkillKey, topicId: string): boolean {
  return read().done.includes(tag(skill, topicId));
}

export function doneCount(): number {
  return read().done.length;
}

export function doneCountFor(skill: SkillKey, topicIds: readonly string[]): number {
  const done = read().done;
  return topicIds.filter((id) => done.includes(tag(skill, id))).length;
}

export function setLast(spot: LastSpot): void {
  const store = read();
  store.last = spot;
  write(store);
}

export function getLast(): LastSpot | null {
  return read().last;
}

export function resetProgress(): void {
  write({ ...EMPTY });
}

/* ------------------------------------------------------- peta level & bos -- */

export function isBossCleared(level: LevelKey): boolean {
  return read().bossCleared.includes(level);
}

/** Menang Tantangan Bos = level itu "ditaklukkan". Idempotent (aman dipanggil ulang). */
export function markBossCleared(level: LevelKey): void {
  const store = read();
  if (!store.bossCleared.includes(level)) store.bossCleared.push(level);
  write(store);
}

/**
 * Status buka/kunci tiap level di Peta Level (PRD tangga §3), konsep dipinjam
 * dari "World Map gating" + "Duel Verifikasi" `inggrisinyuk` (dewasa) — bukan
 * diporting mentah (lihat catatan di app.ts). Aturannya:
 *  - Level pertama di tangga selalu terbuka.
 *  - Level tanpa materi (`hasContent:false`) tidak pernah jadi gerbang nyata:
 *    kalau level SEBELUMNYA belum punya materi, statusnya cuma "diteruskan"
 *    dari status level sebelum itu lagi (tidak ada Bos yang bisa ditagih).
 *  - Kalau level sebelumnya punya materi, level ini baru terbuka setelah Bos
 *    level sebelumnya ditaklukkan — KECUALI anak menaklukkan Bos level ini
 *    SENDIRI lebih dulu (skip-ahead, versi ramah-anak dari "Duel Verifikasi":
 *    tanpa bayar, tanpa AI, cuma tantangan mini-game campuran yang lebih besar).
 */
export function levelUnlockMap(levels: readonly LevelMeta[]): Record<string, boolean> {
  const cleared = read().bossCleared;
  const map: Record<string, boolean> = {};
  levels.forEach((lvl, i) => {
    if (i === 0) {
      map[lvl.key] = true;
      return;
    }
    const prev = levels[i - 1];
    const selfSkip = cleared.includes(lvl.key);
    map[lvl.key] = prev.hasContent ? cleared.includes(prev.key) || selfSkip : (map[prev.key] ?? false) || selfSkip;
  });
  return map;
}

/* ------------------------------------------------------------------- xp -- */

/**
 * XP = satu angka pertumbuhan yang murni naik (tidak pernah turun/hilang) —
 * ala "Stat Kefasihan yang tumbuh tiap misi" di `inggrisinyuk` (dewasa), tapi
 * TANPA bagian yang bisa berkurang (tidak ada HP yang habis, tidak ada skor
 * yang bisa hilang) supaya tetap non-punitive (PRD §4.5/§4.6). Belajar (modul
 * & Bos) memberi XP lebih besar daripada Game (main bebas) — Belajar tetap
 * jalur inti untuk membuka level baru, Game cuma bikin angkanya makin seru.
 */
export function addXp(amount: number): void {
  const store = read();
  store.xp = Math.max(0, store.xp + amount);
  markActiveToday(store);
  write(store);
}

export function getXp(): number {
  return read().xp;
}

/* ------------------------------------------------------ progres harian -- */

const DAY_LABELS = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

function isoDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Dipanggil tiap ada progres nyata (lewat addXp) — tandai hari ini "aktif". */
function markActiveToday(store: Store): void {
  const today = isoDate(new Date());
  if (!store.activeDays.includes(today)) store.activeDays.push(today);
  // Cukup simpan ~60 hari terakhir — tidak perlu riwayat tak terbatas.
  if (store.activeDays.length > 60) store.activeDays = store.activeDays.slice(-60);
}

export interface DayActivity {
  label: string;
  active: boolean;
  isToday: boolean;
}

/**
 * 7 hari terakhir (hari ini paling kanan) — bukan streak. Tidak ada aturan
 * "berturut-turut", tidak ada yang hilang/reset kalau ada hari kosong di
 * tengah. Murni "ini hari-hari kamu sudah main minggu ini" (PRD §12.4 —
 * semua progres di app ini searah naik/informatif, tidak ada yang punitive).
 */
export function getWeekActivity(): DayActivity[] {
  const active = new Set(read().activeDays);
  const today = new Date();
  const days: DayActivity[] = [];
  for (let i = 6; i >= 0; i -= 1) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    days.push({ label: DAY_LABELS[d.getDay()], active: active.has(isoDate(d)), isToday: i === 0 });
  }
  return days;
}

function toEpochDay(iso: string): number {
  const [y, m, d] = iso.split('-').map(Number);
  return Math.floor(Date.UTC(y, m - 1, d) / 86400000);
}

/**
 * Hari main berturut-turut, dihitung dari `activeDays` yang sama dengan
 * `getWeekActivity` — bukan field tersimpan terpisah (pola "derived, bukan
 * sumber kebenaran baru" yang sama dipakai untuk XP, RESEARCH §13.1).
 *
 * Dikasih **1 hari pelindung**: libur SATU hari tidak langsung memutus
 * hitungan (baru reset kalau libur 2 hari berturut-turut) — supaya tetap
 * non-punitive, beda dari streak ala kompetitor yang putus di hari pertama
 * bolong. Hari ini belum sempat main juga tidak dihitung "bolong".
 */
export function getStreak(): number {
  const activeSet = new Set(read().activeDays.map(toEpochDay));
  if (activeSet.size === 0) return 0;

  let streak = 0;
  let usedGrace = false;
  let cursor = toEpochDay(isoDate(new Date()));
  let checkingToday = true;

  for (;;) {
    if (activeSet.has(cursor)) {
      streak += 1;
      cursor -= 1;
      checkingToday = false;
      continue;
    }
    if (checkingToday) {
      checkingToday = false;
      cursor -= 1;
      continue;
    }
    if (!usedGrace) {
      usedGrace = true;
      cursor -= 1;
      continue;
    }
    return streak;
  }
}

/* -------------------------------------------------------------- akurasi -- */

/**
 * Ketepatan = tepat/total percobaan di soal berjawaban benar-salah objektif
 * (`recordAttempt`, dipanggil dari games/*.ts). `null` kalau belum ada
 * percobaan sama sekali — dipakai UI untuk menyembunyikan angka kosong
 * daripada menampilkan "0%" yang terkesan seperti nilai jelek (PRD §4.6).
 */
export function recordAttempt(correct: boolean): void {
  const store = read();
  store.totalAttempts += 1;
  if (correct) store.correctAttempts += 1;
  write(store);
}

export function getAccuracy(): number | null {
  const { correctAttempts, totalAttempts } = read();
  if (totalAttempts === 0) return null;
  return Math.round((correctAttempts / totalAttempts) * 100);
}

/* ----------------------------------------------------------------- nama -- */

export function getName(): string {
  return read().name.trim();
}

export function setName(name: string): void {
  const store = read();
  store.name = name.trim().slice(0, 24);
  write(store);
}

export function getAvatar(): string {
  return read().avatar;
}

export function setAvatar(avatar: string): void {
  if (!(ANIMAL_AVATARS as readonly string[]).includes(avatar)) return;
  const store = read();
  store.avatar = avatar;
  write(store);
}

