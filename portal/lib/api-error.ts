import { NextResponse } from 'next/server';

/**
 * Bungkus tiap route handler API dengan ini — TANPA ini, exception tak
 * terduga (mismatch skema Prisma, koneksi DB putus, dst) bikin Next.js
 * membalas 500 dengan body KOSONG (bukan JSON), dan client cuma bisa
 * menampilkan pesan generik "Terjadi kesalahan, coba lagi." yang menyamarkan
 * akar masalah aslinya. Lihat issue/20260820_1737_issue.md.
 */
export function withErrorHandling<Args extends unknown[]>(
  handler: (...args: Args) => Promise<NextResponse>
): (...args: Args) => Promise<NextResponse> {
  return async (...args: Args) => {
    try {
      return await handler(...args);
    } catch (err) {
      console.error('[api] unhandled error:', err);
      return NextResponse.json({ error: 'Terjadi kesalahan di server, coba lagi.' }, { status: 500 });
    }
  };
}
