/**
 * Sesi login orang tua — JWT (jose). `portal/` sekarang API murni (tanpa
 * halaman sendiri, PRD §14/§16) yang dipanggil `app/` (statis, origin beda)
 * lewat fetch — jadi TOKEN di response body + header `Authorization: Bearer`
 * yang jadi jalur utama (disimpan `app/` di localStorage), bukan cookie
 * cross-origin (ribet: perlu SameSite=None+Secure, gampang gagal beda
 * browser). Cookie tetap dipasang sebagai fallback ringan (mis. kalau nanti
 * ada pemanggilan same-origin), tapi tidak jadi sumber kebenaran utama.
 */
import { SignJWT, jwtVerify } from 'jose';
import { cookies, headers } from 'next/headers';

const COOKIE_NAME = 'portal_session';
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

function getSecretKey(): Uint8Array {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error('SESSION_SECRET is not set');
  return new TextEncoder().encode(secret);
}

export async function signSessionToken(parentId: string): Promise<string> {
  return new SignJWT({ sub: parentId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE_SECONDS}s`)
    .sign(getSecretKey());
}

export async function createSession(parentId: string): Promise<string> {
  const token = await signSessionToken(parentId);
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: MAX_AGE_SECONDS,
  });
  return token;
}

async function verify(token: string): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    return typeof payload.sub === 'string' ? payload.sub : null;
  } catch {
    return null;
  }
}

export async function getSessionParentId(): Promise<string | null> {
  const hdrs = await headers();
  const authHeader = hdrs.get('authorization');
  const bearer = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (bearer) return verify(bearer);

  const cookieStore = await cookies();
  const cookieToken = cookieStore.get(COOKIE_NAME)?.value;
  if (cookieToken) return verify(cookieToken);

  return null;
}

export async function clearSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}
