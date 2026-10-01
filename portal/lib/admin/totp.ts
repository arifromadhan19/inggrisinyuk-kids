/** TOTP RFC 6238 (SHA1, 6 digit, 30 dtk) — kompatibel Google Authenticator/
 *  Authy. Ditulis sendiri (±40 baris) supaya tidak menambah dependency. */
import { createHmac, randomBytes, timingSafeEqual } from 'crypto';

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

export function generateTotpSecret(): string {
  const bytes = randomBytes(20);
  let bits = '';
  for (const b of bytes) bits += b.toString(2).padStart(8, '0');
  let out = '';
  for (let i = 0; i + 5 <= bits.length; i += 5) out += ALPHABET[parseInt(bits.slice(i, i + 5), 2)];
  return out;
}

function base32Decode(secret: string): Buffer {
  const clean = secret.replace(/=+$/, '').replace(/\s/g, '').toUpperCase();
  let bits = '';
  for (const ch of clean) {
    const v = ALPHABET.indexOf(ch);
    if (v < 0) throw new Error('invalid base32');
    bits += v.toString(2).padStart(5, '0');
  }
  const bytes: number[] = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) bytes.push(parseInt(bits.slice(i, i + 8), 2));
  return Buffer.from(bytes);
}

function codeAt(key: Buffer, counter: number): string {
  const buf = Buffer.alloc(8);
  buf.writeBigUInt64BE(BigInt(counter));
  const hmac = createHmac('sha1', key).update(buf).digest();
  const offset = hmac[hmac.length - 1] & 0xf;
  const bin = (hmac.readUInt32BE(offset) & 0x7fffffff) % 1_000_000;
  return String(bin).padStart(6, '0');
}

/** Terima kode periode sekarang ±1 (jam HP boleh meleset ±30 dtk). */
export function verifyTotp(secret: string, code: string): boolean {
  if (!/^\d{6}$/.test(code)) return false;
  const key = base32Decode(secret);
  const counter = Math.floor(Date.now() / 30_000);
  for (const d of [-1, 0, 1]) {
    const expected = Buffer.from(codeAt(key, counter + d));
    if (timingSafeEqual(expected, Buffer.from(code))) return true;
  }
  return false;
}

export function totpUri(username: string, secret: string): string {
  const label = encodeURIComponent(`InggrisinYuk Kids CS:${username}`);
  return `otpauth://totp/${label}?secret=${secret}&issuer=${encodeURIComponent('InggrisinYuk Kids CS')}`;
}
