import { randomBytes } from 'crypto';
import { db } from '@/lib/db';

export const PRICE_IDR = 99000;

export function generateOrderId(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `IYK-${y}${m}${d}-${randomBytes(4).toString('hex').toUpperCase()}`;
}

/** Origin app anak (halaman /pembayaran & /daftar) — entri PERTAMA
 *  `APP_ORIGIN` (boleh berisi beberapa origin dipisah koma utk CORS). */
export function getAppUrl(): string {
  const first = (process.env.APP_ORIGIN ?? 'http://127.0.0.1:8200').split(',')[0].trim();
  return first.replace(/\/$/, '');
}

/**
 * Tandai transaksi lunas & buat akun orang tua + profil anak — dipanggil
 * webhook Xendit (PAID/SETTLED) & mode tes lokal. Idempoten: webhook yang
 * dikirim ulang tidak membuat akun dobel.
 */
export async function markTransactionPaid(orderId: string, paymentMethod: string | null): Promise<void> {
  await db.$transaction(async (tx) => {
    const trx = await tx.transaction.findUnique({ where: { orderId } });
    if (!trx || trx.status === 'success') return;

    let parent = await tx.parentAccount.findFirst({
      where: { OR: [{ phone: trx.phone }, { email: trx.email }] },
    });
    if (!parent) {
      parent = await tx.parentAccount.create({ data: { phone: trx.phone, email: trx.email } });
    }
    const child = await tx.childProfile.findFirst({ where: { parentId: parent.id } });
    if (!child) {
      await tx.childProfile.create({ data: { parentId: parent.id, name: trx.childName } });
    }

    await tx.transaction.update({
      where: { orderId },
      data: { status: 'success', paidAt: new Date(), parentId: parent.id, paymentMethod },
    });
  });
}
