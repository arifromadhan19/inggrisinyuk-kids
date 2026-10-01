/** Rate limit login admin, in-memory (1 proses Node di VPS — cukup). Setelah
 *  5 gagal dalam 15 menit per IP ATAU per username → kunci 15 menit. */
const WINDOW_MS = 15 * 60_000;
const MAX_FAILS = 5;
const fails = new Map<string, number[]>();

function recent(key: string): number[] {
  const now = Date.now();
  const list = (fails.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  fails.set(key, list);
  return list;
}

export function isLocked(keys: string[]): boolean {
  return keys.some((k) => recent(k).length >= MAX_FAILS);
}

export function recordFail(keys: string[]): void {
  for (const k of keys) recent(k).push(Date.now());
}

export function clearFails(keys: string[]): void {
  for (const k of keys) fails.delete(k);
}
