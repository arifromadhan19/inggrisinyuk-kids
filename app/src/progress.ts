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
 *
 * Tidak ada antrian review yang ditampilkan ke anak (PRD §4.3).
 */

const KEY = 'inggrisinyuk-kids.progress.v1';

export interface LastSpot {
  skill: SkillKey;
  topicIndex: number;
}

interface Store {
  done: string[];
  last: LastSpot | null;
  bossCleared: string[];
  xp: number;
}

const EMPTY: Store = { done: [], last: null, bossCleared: [], xp: 0 };

function read(): Store {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...EMPTY };
    const parsed = JSON.parse(raw) as Partial<Store>;
    return {
      done: Array.isArray(parsed.done) ? parsed.done.filter((d) => typeof d === 'string') : [],
      last: parsed.last ?? null,
      bossCleared: Array.isArray(parsed.bossCleared) ? parsed.bossCleared.filter((d) => typeof d === 'string') : [],
      xp: typeof parsed.xp === 'number' && Number.isFinite(parsed.xp) && parsed.xp >= 0 ? parsed.xp : 0,
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
  write(store);
}

export function getXp(): number {
  return read().xp;
}
