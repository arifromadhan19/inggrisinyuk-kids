import { NextRequest, NextResponse } from 'next/server';

/**
 * portal/ sekarang API murni (tanpa halaman, PRD §16) yang dipanggil `app/`
 * (origin beda — statis di port lain) lewat fetch, jadi butuh CORS. Auth
 * sendiri TIDAK digerbang di sini — tiap route (`app/api/**`) cek
 * `getSessionParentId()` sendiri-sendiri (pola yang sama dgn
 * `inggrisinyuk-app/middleware.ts`: middleware cuma untuk hal lintas-route,
 * bukan auth per-endpoint).
 */
const PRIMARY_ORIGIN = process.env.APP_ORIGIN ?? 'http://127.0.0.1:8200';

/** `localhost` dan `127.0.0.1` itu origin BEDA di mata browser — dulu cuma
 *  APP_ORIGIN persis yang diizinkan, jadi app yang dibuka lewat
 *  `localhost:8200` gagal login dgn pesan generik (lihat
 *  issue/20260924_login_124_issue.md). Kembaran host-nya ikut diizinkan. */
function twinOrigin(origin: string): string | null {
  if (origin.includes('://127.0.0.1')) return origin.replace('://127.0.0.1', '://localhost');
  if (origin.includes('://localhost')) return origin.replace('://localhost', '://127.0.0.1');
  return null;
}

const ALLOWED_ORIGINS = new Set(
  PRIMARY_ORIGIN.split(',')
    .map((o) => o.trim())
    .filter(Boolean)
    .flatMap((o) => [o, twinOrigin(o)].filter((x): x is string => x !== null))
);

function corsHeaders(req: NextRequest): Record<string, string> {
  const origin = req.headers.get('origin') ?? '';
  return {
    'Access-Control-Allow-Origin': ALLOWED_ORIGINS.has(origin) ? origin : [...ALLOWED_ORIGINS][0],
    'Access-Control-Allow-Methods': 'GET,POST,PUT,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    Vary: 'Origin',
  };
}

export function middleware(req: NextRequest): NextResponse {
  if (req.method === 'OPTIONS') {
    return new NextResponse(null, { status: 204, headers: corsHeaders(req) });
  }
  const res = NextResponse.next();
  for (const [key, value] of Object.entries(corsHeaders(req))) {
    res.headers.set(key, value);
  }
  return res;
}

export const config = {
  matcher: ['/api/:path*'],
};
