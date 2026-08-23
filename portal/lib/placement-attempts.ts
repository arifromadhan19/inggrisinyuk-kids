/**
 * Batas percobaan First Placement Test — dipusatkan di sini (dulu
 * `MAX_ATTEMPTS` didefinisikan dobel, sendiri-sendiri, di route `me` dan
 * `placement-test`).
 *
 * Nomor HP di `UNLIMITED_ATTEMPT_PHONES` SELALU dianggap 0 percobaan
 * terpakai (permintaan user) — akun tes dev (`portal/prisma/seed.ts`, no HP
 * "124", dibuat khusus buat iterasi First Placement Test) supaya bisa
 * dicoba berkali-kali tanpa kena limit 2x dan tanpa harus `npm run db:seed`
 * ulang tiap kali kena limit. Baris `PlacementTestResult` akun ini TETAP
 * tersimpan apa adanya (tidak dihapus otomatis) — cuma limit/tampilan
 * "attempts used"-nya yang selalu dibaca 0, riwayat asli masih ada di DB
 * kalau perlu dicek manual.
 */
export const MAX_ATTEMPTS = 2;

const UNLIMITED_ATTEMPT_PHONES = ['124'];

export function resolveAttemptsUsed(phone: string | null | undefined, rawAttemptsUsed: number): number {
  if (phone && UNLIMITED_ATTEMPT_PHONES.includes(phone)) return 0;
  return rawAttemptsUsed;
}
