import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withErrorHandling } from '@/lib/api-error';
import { createSnapTransaction, isMockPayment } from '@/lib/midtrans';
import { PRICE_IDR, generateOrderId, getAppUrl, markTransactionPaid } from '@/lib/checkout';
import { isValidEmail, isValidPhone, normalizePhone } from '@/lib/phone';

/**
 * Halaman Daftar (app anak `/daftar`) — nama anak + email & no WA orang tua
 * → buat transaksi Midtrans Snap Rp 99.000 → app diarahkan ke `invoiceUrl`. Akun BELUM
 * dibuat di sini; dibuat webhook saat lunas (`lib/checkout.ts`).
 */
export const POST = withErrorHandling(async (req: NextRequest): Promise<NextResponse> => {
  const body = (await req.json().catch(() => null)) as
    | { childName?: unknown; email?: unknown; phone?: unknown }
    | null;
  const childName = typeof body?.childName === 'string' ? body.childName.trim().slice(0, 40) : '';
  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
  const phone = normalizePhone(typeof body?.phone === 'string' ? body.phone : '');

  if (!childName) return NextResponse.json({ error: 'Isi nama anak dulu, ya.' }, { status: 400 });
  if (!isValidEmail(email)) return NextResponse.json({ error: 'Format email belum benar.' }, { status: 400 });
  if (!isValidPhone(phone)) {
    return NextResponse.json({ error: 'No WhatsApp belum benar (contoh: 08123456789).' }, { status: 400 });
  }

  // Akun yang sudah dihapus CS (refund) boleh membeli lagi — dipulihkan saat lunas.
  const existing = await db.parentAccount.findFirst({ where: { OR: [{ phone }, { email }], removedAt: null } });
  if (existing) {
    return NextResponse.json(
      { error: 'No WA atau email ini sudah terdaftar.', alreadyRegistered: true },
      { status: 409 }
    );
  }

  const orderId = generateOrderId();
  const appUrl = getAppUrl();
  const successUrl = `${appUrl}/pembayaran?orderId=${orderId}`;
  await db.transaction.create({ data: { orderId, phone, email, childName, amount: PRICE_IDR } });

  if (isMockPayment()) {
    await markTransactionPaid(orderId, 'MOCK');
    return NextResponse.json({ invoiceUrl: successUrl, orderId });
  }

  try {
    const snap = await createSnapTransaction({
      orderId,
      amount: PRICE_IDR,
      itemName: 'InggrisinYuk Kids - Akses Selamanya',
      customerName: childName,
      email,
      phone,
      // Tanpa query: Midtrans menambahkan `?order_id=...` sendiri.
      finishUrl: `${appUrl}/pembayaran`,
    });
    await db.transaction.update({ where: { orderId }, data: { paymentRef: snap.token } });
    return NextResponse.json({ invoiceUrl: snap.redirectUrl, orderId });
  } catch (err) {
    await db.transaction.update({ where: { orderId }, data: { status: 'failed' } });
    console.error('[checkout] Midtrans createSnapTransaction failed', err);
    return NextResponse.json({ error: 'Gagal membuat pesanan. Coba lagi sebentar.' }, { status: 502 });
  }
});
