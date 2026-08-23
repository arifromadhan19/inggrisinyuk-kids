/**
 * Akun orang tua — login/registrasi & placement test (PRD §14/§16). Backend-
 * nya `portal/` (Next.js API murni, tanpa halaman sendiri — origin beda,
 * lihat `portal/README.md`). Auth pakai TOKEN (bukan cookie): disimpan di
 * localStorage di sini, dikirim lewat header `Authorization: Bearer` — lebih
 * simpel & robust lintas-origin daripada cookie SameSite=None.
 *
 * SEMUA soal placement test opsional — anak tetap bisa main penuh tanpa
 * pernah login sama sekali (PRD §14.4/§14.5: fitur ini murni tambahan buat
 * orang tua, bukan gerbang wajib).
 */
import type { LevelKey } from './types';

const KEY = 'inggrisinyuk-kids.account.v1';

// Ganti ke domain production sebelum deploy sungguhan — belum ada sistem
// env-var build-time di app/ (sama seperti PORTAL_URL lama, lihat app.ts).
const API_BASE = 'http://127.0.0.1:3000';

/** Hasil percobaan placement test terakhir — dipakai kartu "Hasil Placement
 *  Test" di Beranda, di bawah Progres Harian (permintaan user). */
export interface CachedPlacementResult {
  levelRecommended: LevelKey;
  totalCorrect: number;
  totalItems: number;
  attemptNumber: number;
  takenAt: string;
}

interface AccountStore {
  token: string | null;
  identifier: string | null;
  /** Cache hasil `/api/me` terakhir — biar Belajar/Pengaturan bisa render
   *  langsung tanpa nunggu fetch tiap kali. Disegarkan di background saat
   *  app dibuka (lihat `refreshChildStatus` di app.ts). */
  childLevel: LevelKey | null;
  placementTestDone: boolean | null;
  /** Maks 2 percobaan (doc/first_placement_test.md §"max 2 kali") — dipakai
   *  gating tombol "Yuk Mulai"/"Main Lagi" tanpa perlu fetch dulu. */
  placementAttemptsUsed: number;
  latestPlacementResult: CachedPlacementResult | null;
}

const EMPTY: AccountStore = {
  token: null,
  identifier: null,
  childLevel: null,
  placementTestDone: null,
  placementAttemptsUsed: 0,
  latestPlacementResult: null,
};

function read(): AccountStore {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...EMPTY };
    const parsed = JSON.parse(raw) as Partial<AccountStore>;
    return {
      token: typeof parsed.token === 'string' ? parsed.token : null,
      identifier: typeof parsed.identifier === 'string' ? parsed.identifier : null,
      childLevel: typeof parsed.childLevel === 'string' ? (parsed.childLevel as LevelKey) : null,
      placementTestDone: typeof parsed.placementTestDone === 'boolean' ? parsed.placementTestDone : null,
      placementAttemptsUsed: typeof parsed.placementAttemptsUsed === 'number' ? parsed.placementAttemptsUsed : 0,
      latestPlacementResult: parsed.latestPlacementResult ?? null,
    };
  } catch {
    return { ...EMPTY };
  }
}

function write(store: AccountStore): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(store));
  } catch {
    /* diabaikan dengan sengaja */
  }
}

export function getToken(): string | null {
  return read().token;
}

export function getIdentifier(): string | null {
  return read().identifier;
}

export function isLoggedIn(): boolean {
  return read().token !== null;
}

export function cacheChildStatus(
  level: LevelKey | null,
  placementTestDone: boolean | null,
  placementAttemptsUsed = 0,
  latestPlacementResult: CachedPlacementResult | null = null
): void {
  const store = read();
  store.childLevel = level;
  store.placementTestDone = placementTestDone;
  store.placementAttemptsUsed = placementAttemptsUsed;
  store.latestPlacementResult = latestPlacementResult;
  write(store);
}

const MAX_PLACEMENT_ATTEMPTS = 2;

export function getCachedChildStatus(): {
  level: LevelKey | null;
  placementTestDone: boolean | null;
  placementAttemptsUsed: number;
  placementAttemptsRemaining: number;
  latestPlacementResult: CachedPlacementResult | null;
} {
  const { childLevel, placementTestDone, placementAttemptsUsed, latestPlacementResult } = read();
  return {
    level: childLevel,
    placementTestDone,
    placementAttemptsUsed,
    placementAttemptsRemaining: Math.max(0, MAX_PLACEMENT_ATTEMPTS - placementAttemptsUsed),
    latestPlacementResult,
  };
}

export function logout(): void {
  write({ ...EMPTY });
  fetch(`${API_BASE}/api/auth/logout`, { method: 'POST' }).catch(() => {
    /* cuma formalitas hapus cookie fallback — kegagalan tidak fatal */
  });
}

export class ApiRequestError extends Error {
  status: number;
  /** Body respons mentah (parsed JSON) — dipakai caller yang butuh field
   *  tambahan di luar `message`, mis. `limitReached`/`level` dari
   *  POST /api/placement-test saat kuota 2x habis. */
  data: Record<string, unknown>;
  constructor(message: string, status: number, data: Record<string, unknown> = {}) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) ?? {}),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) {
    const message = typeof data.error === 'string' ? data.error : 'Terjadi kesalahan, coba lagi.';
    throw new ApiRequestError(message, res.status, data);
  }
  return data as T;
}

export interface AuthResult {
  token: string;
  identifier: string | null;
}

/**
 * Passwordless (RESEARCH §16) — cukup no HP atau email yang SUDAH terdaftar.
 * Tidak ada lagi `register()`: akun cuma dibuat lewat sukses bayar (masih
 * backlog, PRD §14) — bukan daftar sendiri di app. Sebelum fitur bayar
 * digarap, akun dibuat manual via `portal/prisma/seed.ts`.
 */
export async function login(identifier: string): Promise<void> {
  const data = await apiFetch<AuthResult>('/api/auth/login', { method: 'POST', body: JSON.stringify({ identifier }) });
  write({
    token: data.token,
    identifier: data.identifier,
    childLevel: null,
    placementTestDone: null,
    placementAttemptsUsed: 0,
    latestPlacementResult: null,
  });
}

export interface ChildInfo {
  id: string;
  name: string | null;
  level: LevelKey;
  placementTestDone: boolean;
  dismissedPlacementTest: boolean;
  placementAttemptsUsed: number;
  placementAttemptsRemaining: number;
  latestPlacementResult: CachedPlacementResult | null;
}

export interface MeResult {
  parent: { id: string; phone: string | null; email: string | null };
  child: ChildInfo | null;
}

/** Dipanggil di background saat app dibuka (kalau sudah login) & setelah
 *  placement test — nyegerin cache lokal dari server. Token invalid/expired
 *  (401) otomatis logout diam-diam, bukan nyangkut di state "login" palsu. */
export async function refreshChildStatus(): Promise<void> {
  if (!isLoggedIn()) return;
  try {
    const data = await apiFetch<MeResult>('/api/me', { method: 'GET' });
    cacheChildStatus(
      data.child?.level ?? null,
      data.child?.placementTestDone ?? null,
      data.child?.placementAttemptsUsed ?? 0,
      data.child?.latestPlacementResult ?? null
    );
  } catch (err) {
    if (err instanceof ApiRequestError && err.status === 401) {
      write({ ...EMPTY });
    }
  }
}

/** Jawaban pilihan-ganda (vocab/listening/speakingRecognition) — di-skor
 *  server. `kind` opsional/default 'mcq' biar body tetap ringkas dari
 *  client (persis bentuk lama), portal yang menandai eksplisit. */
export interface PlacementMcqAnswer {
  kind?: 'mcq';
  questionId: string;
  chosenEmoji: string;
}

/** Jawaban mic terbuka (openmic) — TIDAK di-skor untuk level (PRD §13.1),
 *  tapi `matched` ikut dihitung server di angka skor total (`totalCorrect`/
 *  `totalItems` = 16, lihat portal/lib/placement-scoring.ts).
 *  `matched`/`wordRatio`/`confidence` dihitung di client karena ASR jalan
 *  di browser (server tidak pernah dengar audionya) — dikirim apa adanya
 *  sebagai sinyal, bukan sebagai skor level. */
export interface PlacementOpenmicAnswer {
  kind: 'openmic';
  questionId: string;
  /** Turunan `wordRatio >= ambang` (lihat games/placement.ts) — bukan lagi
   *  fungsi longgar terpisah, supaya konsisten dengan bintang yang anak
   *  lihat di layar. */
  matched: boolean;
  /** Rasio kata target yang kedengaran (0-1) — skor proporsional
   *  sesungguhnya, dipakai juga untuk bintang di layar. Contoh: "I like my
   *  school" yang cuma kedengaran "school" → ~0.25, BUKAN skor penuh. */
  wordRatio: number;
  confidence: number;
}

export type PlacementAnswer = PlacementMcqAnswer | PlacementOpenmicAnswer;

export interface PlacementResult {
  ok: boolean;
  levelRecommended?: LevelKey;
  skipped: boolean;
  level?: LevelKey;
  attemptNumber?: number;
  attemptsUsed?: number;
  attemptsRemaining?: number;
  /** Cuma ada di hasil submit asli (bukan skip) — dipakai layar hasil buat
   *  nampilin skor+mapping ke level (permintaan user). Server yang hitung,
   *  bukan client. */
  totalCorrect?: number;
  totalItems?: number;
  correctByLevel?: Record<string, number>;
}

export async function submitPlacementTest(answers: PlacementAnswer[]): Promise<PlacementResult> {
  const result = await apiFetch<PlacementResult>('/api/placement-test', {
    method: 'POST',
    body: JSON.stringify({ answers }),
  });
  if (result.levelRecommended) {
    cacheChildStatus(result.levelRecommended, true, result.attemptsUsed ?? 0, null);
    void refreshChildStatus(); // segarkan latestPlacementResult dari server di background
  }
  return result;
}

export async function skipPlacementTest(): Promise<PlacementResult> {
  const result = await apiFetch<PlacementResult>('/api/placement-test', {
    method: 'POST',
    body: JSON.stringify({ skip: true }),
  });
  if (result.level) cacheChildStatus(result.level, false, result.attemptsUsed ?? 0, null);
  return result;
}

/**
 * Sync progres main (bintang/XP/streak/interaksi kata, dst — `progress.ts`)
 * ke `portal/` (permintaan user: "simpan setiap progress ke database").
 * Blob JSON apa adanya — bentuknya dipegang `progress.ts` (`Store`), file ini
 * cuma jadi jalur HTTP-nya, tidak perlu tahu isinya. Cuma jalan kalau sudah
 * login (`progress.ts` yang cek lewat `setSyncHandler`) — offline/tanpa akun
 * tetap main penuh dari localStorage saja (PRD §5/§14.4).
 */
export async function getProgress(): Promise<Record<string, unknown> | null> {
  const data = await apiFetch<{ data: Record<string, unknown> | null }>('/api/progress', { method: 'GET' });
  return data.data;
}

/** `events` — outbox `LearningEventInput[]` (progress.ts `peekOutbox`) dikirim
 *  bareng snapshot `Store` di request YANG SAMA (TRD.md §7.0: 1 request/burst,
 *  bukan 1 HTTP per tap). Tipe di sini sengaja `unknown[]`: bentuk persisnya
 *  dipegang `progress.ts`, file ini murni jalur HTTP. */
export async function saveProgress(data: Record<string, unknown>, events: unknown[] = []): Promise<void> {
  await apiFetch('/api/progress', { method: 'PUT', body: JSON.stringify({ data, events }) });
}
