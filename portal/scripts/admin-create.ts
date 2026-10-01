/**
 * Buat / reset akun admin panel manajemen user (CS). Tidak ada halaman
 * daftar — akun admin HANYA dibuat lewat CLI ini di server.
 *
 *   ADMIN_PASSWORD='...' npm run admin:create -- <username> [--role owner|cs] [--no-totp]
 *   npm run admin:create -- <username> --disable
 *
 * Tanpa ADMIN_PASSWORD → password acak dibuat & dicetak SEKALI.
 * TOTP (Google Authenticator) dibuat baru tiap kali dijalankan & dicetak —
 * masukkan ke aplikasi authenticator CS. `--no-totp` hanya utk dev lokal
 * (production menolak login tanpa TOTP).
 */
import 'dotenv/config';
import { randomBytes } from 'crypto';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { generateTotpSecret, totpUri } from '../lib/admin/totp';

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const username = args.find((a) => !a.startsWith('--'))?.trim().toLowerCase();
  if (!username || !/^[a-z0-9._-]{3,40}$/.test(username)) {
    console.error('Pakai: npm run admin:create -- <username> [--role owner|cs] [--no-totp] [--disable]');
    process.exit(1);
  }
  const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

  if (args.includes('--disable')) {
    await db.adminUser.update({ where: { username }, data: { isActive: false } });
    console.log(`Admin "${username}" dinonaktifkan (sesi aktifnya langsung terputus).`);
    await db.$disconnect();
    return;
  }

  const roleIdx = args.indexOf('--role');
  const role = roleIdx >= 0 ? args[roleIdx + 1] : 'cs';
  if (role !== 'owner' && role !== 'cs') throw new Error('--role harus owner atau cs');

  const envPass = process.env.ADMIN_PASSWORD;
  const password = envPass ?? randomBytes(18).toString('base64url');
  if (password.length < 12) throw new Error('Password minimal 12 karakter');
  const passwordHash = await bcrypt.hash(password, 12);
  const totpSecret = args.includes('--no-totp') ? null : generateTotpSecret();

  await db.adminUser.upsert({
    where: { username },
    create: { username, passwordHash, totpSecret, role },
    update: { passwordHash, totpSecret, role, isActive: true },
  });

  console.log(`\nAdmin "${username}" (role: ${role}) siap.`);
  if (!envPass) console.log(`Password (catat sekarang, tidak ditampilkan lagi): ${password}`);
  if (totpSecret) {
    console.log(`\nKode 2FA — tambahkan di Google Authenticator / Authy ("Masukkan kunci"):`);
    console.log(`  ${totpSecret}`);
    console.log(`atau buka link ini di HP yang punya app authenticator:`);
    console.log(`  ${totpUri(username, totpSecret)}\n`);
  }
  await db.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
