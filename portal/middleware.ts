import { NextRequest, NextResponse } from 'next/server';

/**
 * portal/ sekarang API murni (tanpa halaman, PRD §16) yang dipanggil `app/`
 * (origin beda — statis di port lain) lewat fetch, jadi butuh CORS. Auth
 * sendiri TIDAK digerbang di sini — tiap route (`app/api/**`) cek
 * `getSessionParentId()` sendiri-sendiri (pola yang sama dgn
 * `inggrisinyuk-app/middleware.ts`: middleware cuma untuk hal lintas-route,
 * bukan auth per-endpoint).
 */
const ALLOWED_ORIGIN = process.env.APP_ORIGIN ?? 'http://127.0.0.1:8000';

function corsHeaders(): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}

export function middleware(req: NextRequest): NextResponse {
  if (req.method === 'OPTIONS') {
    return new NextResponse(null, { status: 204, headers: corsHeaders() });
  }
  const res = NextResponse.next();
  for (const [key, value] of Object.entries(corsHeaders())) {
    res.headers.set(key, value);
  }
  return res;
}

export const config = {
  matcher: ['/api/:path*'],
};
