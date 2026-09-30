import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withErrorHandling } from '@/lib/api-error';
import { isValidWebhookToken } from '@/lib/xendit';
import { markTransactionPaid } from '@/lib/checkout';

/** Callback Invoice Xendit (atur URL-nya di Dashboard Xendit → Settings →
 *  Webhooks → Invoices paid: https://<domain>/api/webhooks/xendit). */
export const POST = withErrorHandling(async (req: NextRequest): Promise<NextResponse> => {
  if (!isValidWebhookToken(req.headers.get('x-callback-token'))) {
    return NextResponse.json({ error: 'invalid_token' }, { status: 401 });
  }

  const payload = (await req.json().catch(() => null)) as
    | { external_id?: unknown; status?: unknown; payment_method?: unknown }
    | null;
  const orderId = typeof payload?.external_id === 'string' ? payload.external_id : '';
  const status = typeof payload?.status === 'string' ? payload.status : '';
  if (!orderId) return NextResponse.json({ error: 'missing_external_id' }, { status: 400 });

  const trx = await db.transaction.findUnique({ where: { orderId } });
  if (!trx) return NextResponse.json({ error: 'transaction_not_found' }, { status: 404 });
  if (trx.status === 'success') return NextResponse.json({ ok: true });

  if (status === 'PAID' || status === 'SETTLED') {
    const method = typeof payload?.payment_method === 'string' ? payload.payment_method : null;
    await markTransactionPaid(orderId, method);
  } else if (status === 'EXPIRED') {
    await db.transaction.update({ where: { orderId }, data: { status: 'expired' } });
  }
  return NextResponse.json({ ok: true });
});
