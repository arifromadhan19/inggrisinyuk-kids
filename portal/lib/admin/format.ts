export const num = (v: number): string => new Intl.NumberFormat('id-ID').format(v);
export const rupiah = (v: number): string => `Rp ${num(v)}`;
export const pct = (a: number, b: number): string => (b > 0 ? `${Math.round((a / b) * 100)}%` : '—');

export function dateTime(d: Date | null | undefined): string {
  if (!d) return '—';
  return new Intl.DateTimeFormat('id-ID', { timeZone: 'Asia/Jakarta', dateStyle: 'medium', timeStyle: 'short' }).format(d);
}

export function dateOnly(d: Date | null | undefined): string {
  if (!d) return '—';
  return new Intl.DateTimeFormat('id-ID', { timeZone: 'Asia/Jakarta', dateStyle: 'medium' }).format(d);
}

/** "2026-09-30" → "30 Sep" */
export function dayLabel(day: string | null): string {
  if (!day) return '—';
  const [y, m, d] = day.split('-').map(Number);
  return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', timeZone: 'UTC' }).format(Date.UTC(y, m - 1, d));
}

export function waLink(phone: string | null): string | null {
  return phone && /^62\d{8,13}$/.test(phone) ? `https://wa.me/${phone}` : null;
}
