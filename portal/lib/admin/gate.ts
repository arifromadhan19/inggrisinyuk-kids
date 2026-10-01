/**
 * Panel manajemen user TIDAK tinggal di /admin (gampang ditebak/di-scan bot).
 * URL-nya = `/<ADMIN_GATE>` — string acak panjang dari env (min 24 karakter),
 * dibaca oleh route dinamis `app/[gate]/`. URL lain apa pun (termasuk tebakan
 * yang salah) mendapat 404 yang SAMA PERSIS dgn halaman tidak ada, jadi dari
 * luar tidak kelihatan bahwa panel ini ada.
 *
 * Lapis pengaman (semua wajib lolos):
 *  1. Gate URL rahasia (ini).
 *  2. Opsional: ADMIN_IP_ALLOWLIST (IP kantor/VPN CS).
 *  3. Login akun admin (username + password bcrypt + TOTP 6 digit).
 *  4. Cookie sesi terpisah dari akun orang tua (secret beda, httpOnly,
 *     SameSite=Strict, dibatasi ke path gate, 8 jam).
 *  5. Audit log tiap perubahan data.
 */
import { timingSafeEqual } from 'crypto';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';

export function getGate(): string | null {
  const gate = process.env.ADMIN_GATE?.trim() ?? '';
  // Gate pendek = gampang ditebak → panel dianggap MATI sampai diisi benar.
  if (gate.length < 24 || !/^[A-Za-z0-9_-]+$/.test(gate)) return null;
  return gate;
}

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

export async function getClientIp(): Promise<string> {
  const h = await headers();
  // Di VPS, Nginx/Caddy WAJIB meneruskan X-Real-IP (lihat README).
  return (h.get('x-real-ip') ?? h.get('x-forwarded-for')?.split(',')[0] ?? '').trim();
}

async function ipAllowed(): Promise<boolean> {
  const list = (process.env.ADMIN_IP_ALLOWLIST ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  if (list.length === 0) return true;
  return list.includes(await getClientIp());
}

/** Panggil di SETIAP layout/page/action panel — gate salah → 404 biasa. */
export async function assertGate(gate: string): Promise<string> {
  const real = getGate();
  if (!real || !safeEqual(gate, real) || !(await ipAllowed())) notFound();
  return real;
}
