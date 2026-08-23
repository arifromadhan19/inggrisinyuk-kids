import { NextResponse } from 'next/server';
import { clearSession } from '@/lib/session';
import { withErrorHandling } from '@/lib/api-error';

export const POST = withErrorHandling(async (): Promise<NextResponse> => {
  await clearSession();
  return NextResponse.json({ ok: true });
});
