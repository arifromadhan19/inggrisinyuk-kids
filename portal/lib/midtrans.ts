import { createHash, timingSafeEqual } from 'crypto';

/**
 * Midtrans Snap — 1 transaksi = halaman bayar hosted Midtrans (QRIS, e-wallet,
 * VA). App anak tidak perlu menampilkan pilihan metode bayar sendiri.
 * Sandbox vs Production ditentukan `MIDTRANS_IS_PRODUCTION`.
 */
const EXPIRY_HOURS = 24;

function isProduction(): boolean {
  return process.env.MIDTRANS_IS_PRODUCTION === 'true';
}

function getServerKey(): string {
  const serverKey = process.env.MIDTRANS_SERVER_KEY;
  if (!serverKey) throw new Error('MIDTRANS_SERVER_KEY is not set');
  return serverKey;
}

function snapEndpoint(): string {
  return isProduction()
    ? 'https://app.midtrans.com/snap/v1/transactions'
    : 'https://app.sandbox.midtrans.com/snap/v1/transactions';
}

export interface CreateSnapParams {
  orderId: string;
  amount: number;
  itemName: string;
  customerName: string;
  email: string;
  phone: string;
  finishUrl: string;
}

export async function createSnapTransaction(
  params: CreateSnapParams
): Promise<{ token: string; redirectUrl: string }> {
  const res = await fetch(snapEndpoint(), {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      Authorization: `Basic ${Buffer.from(`${getServerKey()}:`).toString('base64')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      transaction_details: { order_id: params.orderId, gross_amount: params.amount },
      // Midtrans membatasi nama item 50 karakter.
      item_details: [{ id: 'akses-selamanya', price: params.amount, quantity: 1, name: params.itemName.slice(0, 50) }],
      customer_details: { first_name: params.customerName, email: params.email, phone: params.phone },
      callbacks: { finish: params.finishUrl },
      expiry: { unit: 'hours', duration: EXPIRY_HOURS },
    }),
  });
  if (!res.ok) {
    throw new Error(`Midtrans create transaction failed: ${res.status} ${await res.text()}`);
  }
  const data = (await res.json()) as { token: string; redirect_url: string };
  return { token: data.token, redirectUrl: data.redirect_url };
}

/** Notifikasi asli dari Midtrans: signature_key =
 *  SHA512(order_id + status_code + gross_amount + ServerKey). */
export function isValidNotificationSignature(payload: {
  order_id: string;
  status_code: string;
  gross_amount: string;
  signature_key: string;
}): boolean {
  const expected = createHash('sha512')
    .update(`${payload.order_id}${payload.status_code}${payload.gross_amount}${getServerKey()}`)
    .digest('hex');
  const a = Buffer.from(expected);
  const b = Buffer.from(payload.signature_key);
  return a.length === b.length && timingSafeEqual(a, b);
}

/** Mode tes lokal TANPA payment gateway: pesanan dianggap langsung lunas.
 *  Wajib diaktifkan eksplisit (`PAYMENT_MOCK=1`) & mati total di production. */
export function isMockPayment(): boolean {
  return process.env.PAYMENT_MOCK === '1' && process.env.NODE_ENV !== 'production';
}
