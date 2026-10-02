import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withErrorHandling } from '@/lib/api-error';
import { isValidNotificationSignature } from '@/lib/midtrans';
import { markTransactionPaid } from '@/lib/checkout';

/** Notifikasi pembayaran Midtrans (atur di Dashboard Midtrans → Settings →
 *  Payment → Notification URL: https://<domain-api>/api/webhooks/midtrans). */
export const POST = withErrorHandling(async (req: NextRequest): Promise<NextResponse> => {
  const payload = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const str = (key: string): string => (typeof payload?.[key] === 'string' ? (payload[key] as string) : '');
  const orderId = str('order_id');
  const signature = {
    order_id: orderId,
    status_code: str('status_code'),
    gross_amount: str('gross_amount'),
    signature_key: str('signature_key'),
  };
  if (!orderId || !signature.signature_key || !isValidNotificationSignature(signature)) {
    return NextResponse.json({ error: 'invalid_signature' }, { status: 401 });
  }

  // Order yang tidak dikenal (mis. tombol "Test notification" di dashboard) dibalas 200
  // supaya Midtrans tidak mengirim ulang terus.
  const trx = await db.transaction.findUnique({ where: { orderId } });
  if (!trx) return NextResponse.json({ ok: true, ignored: 'transaction_not_found' });
  if (trx.status === 'success' || trx.status === 'refunded') return NextResponse.json({ ok: true });

  const status = str('transaction_status');
  const fraud = str('fraud_status');
  if (status === 'settlement' || (status === 'capture' && fraud !== 'challenge' && fraud !== 'deny')) {
    await markTransactionPaid(orderId, str('payment_type') || null);
  } else if (status === 'expire') {
    await db.transaction.update({ where: { orderId }, data: { status: 'expired' } });
  } else if (status === 'cancel' || status === 'deny' || status === 'failure') {
    await db.transaction.update({ where: { orderId }, data: { status: 'failed' } });
  }
  return NextResponse.json({ ok: true });
});
