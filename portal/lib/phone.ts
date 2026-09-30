/** No WA dinormalisasi ke format 62xxxx (pola inggrisinyuk-app
 *  `normalizeWaNumber`) — "0812…", "+62 812…", "812…" jadi satu bentuk. */
export function normalizePhone(input: string): string {
  const digits = input.replace(/[^\d]/g, '');
  if (digits.startsWith('0')) return `62${digits.slice(1)}`;
  if (digits.startsWith('8')) return `62${digits}`;
  return digits;
}

/** 62 + 8–13 digit (no HP Indonesia). */
export function isValidPhone(normalized: string): boolean {
  return /^628\d{7,12}$/.test(normalized);
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
