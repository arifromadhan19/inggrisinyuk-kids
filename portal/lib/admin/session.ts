/**
 * Sesi admin — TERPISAH dari sesi orang tua (`lib/session.ts`): secret beda
 * (ADMIN_SESSION_SECRET), cookie beda, audience beda. Token orang tua tidak
 * akan pernah lolos verifikasi di sini, dan sebaliknya.
 */
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { assertGate } from '@/lib/admin/gate';

const COOKIE_NAME = 'iyk_ops';
const MAX_AGE_SECONDS = 8 * 60 * 60;
const AUDIENCE = 'iyk-admin';

function key(): Uint8Array {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret || secret.length < 32) throw new Error('ADMIN_SESSION_SECRET belum diisi (min 32 karakter)');
  if (secret === process.env.SESSION_SECRET) throw new Error('ADMIN_SESSION_SECRET harus beda dari SESSION_SECRET');
  return new TextEncoder().encode(secret);
}

export interface AdminSession {
  id: string;
  username: string;
  role: string;
}

export async function startAdminSession(gate: string, adminId: string): Promise<void> {
  const token = await new SignJWT({ sub: adminId })
    .setProtectedHeader({ alg: 'HS256' })
    .setAudience(AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE_SECONDS}s`)
    .sign(key());
  (await cookies()).set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: `/${gate}`,
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function endAdminSession(gate: string): Promise<void> {
  (await cookies()).set(COOKIE_NAME, '', { path: `/${gate}`, maxAge: 0 });
}

export async function getAdminSession(): Promise<AdminSession | null> {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, key(), { audience: AUDIENCE });
    if (typeof payload.sub !== 'string') return null;
    // Cek DB tiap request: admin yang dinonaktifkan langsung terputus.
    const admin = await db.adminUser.findUnique({ where: { id: payload.sub } });
    if (!admin || !admin.isActive) return null;
    return { id: admin.id, username: admin.username, role: admin.role };
  } catch {
    return null;
  }
}

/** Gate + login wajib — dipakai tiap halaman/aksi panel selain login. */
export async function requireAdmin(gate: string): Promise<AdminSession> {
  const real = await assertGate(gate);
  const session = await getAdminSession();
  if (!session) redirect(`/${real}/login`);
  return session;
}
