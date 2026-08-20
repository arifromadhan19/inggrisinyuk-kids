/**
 * Seed dev/lokal SAJA — bukan untuk production. Bikin akun dummy yang
 * dianggap "sudah bayar" (checkout/Xendit asli masih backlog, PRD §14) —
 * cuma no HP/email, TANPA password (passwordless, RESEARCH §16). Supaya
 * alur login bisa langsung dicoba tanpa nunggu fitur bayar digarap.
 *
 * 2 akun dgn status placement test beda, buat tes kedua kondisi:
 *  - "123" — SUDAH selesai first placement test (langsung ke Beranda).
 *  - "124" — BELUM (langsung diarahkan ke placement test setelah login).
 */
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

async function main(): Promise<void> {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  const db = new PrismaClient({ adapter });

  const done = await db.parentAccount.upsert({
    where: { phone: '123' },
    update: {},
    create: { phone: '123' },
  });
  const doneChild = await db.childProfile.findFirst({ where: { parentId: done.id } });
  if (!doneChild) {
    await db.childProfile.create({
      data: { parentId: done.id, name: 'Anak Tes (sudah placement test)', level: 'explorer', placementTestDone: true },
    });
  } else if (!doneChild.placementTestDone) {
    await db.childProfile.update({ where: { id: doneChild.id }, data: { level: 'explorer', placementTestDone: true } });
  }

  const notDone = await db.parentAccount.upsert({
    where: { phone: '124' },
    update: {},
    create: { phone: '124' },
  });
  const notDoneChild = await db.childProfile.findFirst({ where: { parentId: notDone.id } });
  if (!notDoneChild) {
    await db.childProfile.create({ data: { parentId: notDone.id, name: 'Anak Tes (belum placement test)' } });
  } else if (notDoneChild.placementTestDone || notDoneChild.dismissedPlacementTest) {
    await db.childProfile.update({
      where: { id: notDoneChild.id },
      data: { level: 'starter', placementTestDone: false, dismissedPlacementTest: false },
    });
  }

  console.log('Seed selesai — 2 akun tes:');
  console.log('  no HP "123" — sudah selesai first placement test (level: explorer)');
  console.log('  no HP "124" — belum placement test sama sekali');
  await db.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
