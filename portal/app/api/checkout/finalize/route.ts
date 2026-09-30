import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withErrorHandling } from '@/lib/api-error';
import { signSessionToken } from '@/lib/session';

/**
 * Dipolling halaman `/pembayaran` app anak tiap 2 dtk sampai webhook Xendit
 * menandai lunas. Begitu lunas, token login diberikan SEKALI
 * (`tokenClaimedAt`) — polling berikutnya cuma dapat `claimed: true` (orang
 * tua tinggal masuk pakai no WA/email).
 */
export const GET = withErrorHandling(async (req: NextRequest): Promise<NextResponse> => {
  const orderId = req.nextUrl.searchParams.get('orderId') ?? '';
  if (!orderId) return NextResponse.json({ error: 'orderId wajib diisi.' }, { status: 400 });

  const trx = await db.transaction.findUnique({ where: { orderId } });
  if (!trx) return NextResponse.json({ status: 'not_found' }, { status: 404 });
  if (trx.status !== 'success' || !trx.parentId) {
    return NextResponse.json({ status: trx.status === 'success' ? 'pending' : trx.status });
  }

  const claim = await db.transaction.updateMany({
    where: { orderId, tokenClaimedAt: null },
    data: { tokenClaimedAt: new Date() },
  });
  if (claim.count === 0) return NextResponse.json({ status: 'success', claimed: true });

  const parent = await db.parentAccount.update({
    where: { id: trx.parentId },
    data: { lastLoginAt: new Date() },
  });
  const token = await signSessionToken(parent.id);
  return NextResponse.json({ status: 'success', token, identifier: parent.phone ?? parent.email });
});
