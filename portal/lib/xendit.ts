/**
 * Xendit Invoice API — disalin dari inggrisinyuk-app (`lib/xendit.ts`), pola
 * sama: 1 invoice = halaman bayar hosted Xendit (QRIS, e-wallet, VA) —
 * app anak tidak perlu menampilkan pilihan metode bayar sendiri.
 */
const INVOICES_ENDPOINT = 'https://api.xendit.co/v2/invoices';
const INVOICE_DURATION_SECONDS = 60 * 60 * 24; // 24 jam

function getSecretKey(): string {
  const secretKey = process.env.XENDIT_SECRET_KEY;
  if (!secretKey) throw new Error('XENDIT_SECRET_KEY is not set');
  return secretKey;
}

export interface CreateInvoiceParams {
  externalId: string;
  amount: number;
  description: string;
  payerEmail?: string;
  successRedirectURL: string;
  failureRedirectURL: string;
  metadata?: Record<string, string>;
}

export async function createInvoice(params: CreateInvoiceParams): Promise<{ id: string; invoiceUrl: string }> {
  const res = await fetch(INVOICES_ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${getSecretKey()}:`).toString('base64')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      external_id: params.externalId,
      amount: params.amount,
      description: params.description,
      payer_email: params.payerEmail,
      currency: 'IDR',
      invoice_duration: INVOICE_DURATION_SECONDS,
      success_redirect_url: params.successRedirectURL,
      failure_redirect_url: params.failureRedirectURL,
      metadata: params.metadata,
    }),
  });
  if (!res.ok) {
    throw new Error(`Xendit create invoice failed: ${res.status} ${await res.text()}`);
  }
  const data = (await res.json()) as { id: string; invoice_url: string };
  return { id: data.id, invoiceUrl: data.invoice_url };
}

export function isValidWebhookToken(headerToken: string | null): boolean {
  const expected = process.env.XENDIT_WEBHOOK_TOKEN;
  if (!expected) {
    console.error('[xendit] XENDIT_WEBHOOK_TOKEN is not set — webhook ditolak');
    return false;
  }
  return headerToken === expected;
}

/** Mode tes lokal TANPA akun Xendit: invoice dianggap langsung lunas.
 *  Wajib diaktifkan eksplisit (`XENDIT_MOCK=1`) & mati total di production. */
export function isMockPayment(): boolean {
  return process.env.XENDIT_MOCK === '1' && process.env.NODE_ENV !== 'production';
}
