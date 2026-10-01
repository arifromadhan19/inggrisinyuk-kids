'use server';

import bcrypt from 'bcryptjs';
import { Prisma } from '@prisma/client';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { assertGate, getClientIp } from '@/lib/admin/gate';
import { clearFails, isLocked, recordFail } from '@/lib/admin/rate-limit';
import { endAdminSession, requireAdmin, startAdminSession } from '@/lib/admin/session';
import { verifyTotp } from '@/lib/admin/totp';
import { isValidEmail, isValidPhone, normalizePhone } from '@/lib/phone';

// Hash tiruan: username salah tetap menjalankan bcrypt → waktu respons sama.
const DUMMY_HASH = '$2b$12$WV8g4gOimVFiprH5SeHoiOeimiJ4rJ2khTLUm4k42n4Tro1Rhs/Za';

function str(fd: FormData, key: string): string {
  const v = fd.get(key);
  return typeof v === 'string' ? v.trim() : '';
}

async function audit(
  adminId: string | null,
  action: string,
  targetParentId: string | null,
  detail: Prisma.InputJsonValue
): Promise<void> {
  await db.adminAuditLog.create({ data: { adminId, action, targetParentId, detail, ip: await getClientIp() } });
}

export async function loginAction(fd: FormData): Promise<void> {
  const gate = await assertGate(str(fd, 'gate'));
  const username = str(fd, 'username').toLowerCase();
  const password = typeof fd.get('password') === 'string' ? (fd.get('password') as string) : '';
  const code = str(fd, 'code').replace(/\s/g, '');
  const ip = await getClientIp();
  const keys = [`ip:${ip}`, `u:${username}`];
  const fail = (reason: string): never => redirect(`/${gate}/login?err=${reason}`);

  if (isLocked(keys)) fail('locked');

  const admin = username ? await db.adminUser.findUnique({ where: { username } }) : null;
  const passOk = await bcrypt.compare(password, admin?.passwordHash ?? DUMMY_HASH);
  const totpRequired = Boolean(admin?.totpSecret) || process.env.NODE_ENV === 'production';
  const totpOk = admin?.totpSecret ? verifyTotp(admin.totpSecret, code) : !totpRequired;

  if (!admin || !admin.isActive || !passOk || !totpOk) {
    recordFail(keys);
    await audit(admin?.id ?? null, 'login_failed', null, { username });
    fail('invalid');
  }

  clearFails(keys);
  await db.adminUser.update({ where: { id: admin!.id }, data: { lastLoginAt: new Date() } });
  await audit(admin!.id, 'login', null, {});
  await startAdminSession(gate, admin!.id);
  redirect(`/${gate}`);
}

export async function logoutAction(fd: FormData): Promise<void> {
  const gate = await assertGate(str(fd, 'gate'));
  await endAdminSession(gate);
  redirect(`/${gate}/login`);
}

/** Edit WA/email/nama anak — kasus utama: orang tua salah ketik saat
 *  daftar, jadi tidak bisa login (login passwordless = cocokkan WA/email). */
export async function updateUserAction(fd: FormData): Promise<void> {
  const gate = str(fd, 'gate');
  const admin = await requireAdmin(gate);
  const id = str(fd, 'id');
  const back = (q: string): never => redirect(`/${gate}/users/${id}?${q}`);

  const parent = await db.parentAccount.findUnique({ where: { id }, include: { children: true } });
  if (!parent) back('err=notfound');

  const rawPhone = str(fd, 'phone');
  const phone = rawPhone ? normalizePhone(rawPhone) : null;
  const email = str(fd, 'email').toLowerCase() || null;
  const childName = str(fd, 'childName').slice(0, 40) || null;

  if (!phone && !email) back('err=empty');
  // Nomor lama non-standar (akun tes "123") boleh tetap apa adanya.
  if (phone && phone !== parent!.phone && !isValidPhone(phone)) back('err=phone');
  if (email && !isValidEmail(email)) back('err=email');

  const clash = await db.parentAccount.findFirst({
    where: {
      id: { not: id },
      OR: [...(phone ? [{ phone }] : []), ...(email ? [{ email }] : [])],
    },
    select: { id: true, phone: true, email: true },
  });
  if (clash) back(`err=taken&other=${clash.id}`);

  const child = parent!.children[0];
  const before = { phone: parent!.phone, email: parent!.email, childName: child?.name ?? null };
  const after = { phone, email, childName };
  if (JSON.stringify(before) === JSON.stringify(after)) back('msg=nochange');

  await db.$transaction(async (tx) => {
    await tx.parentAccount.update({ where: { id }, data: { phone, email } });
    if (child && childName !== child.name) {
      await tx.childProfile.update({ where: { id: child.id }, data: { name: childName } });
    }
  });
  await audit(admin.id, 'user_update', id, { before, after, note: str(fd, 'note') || null });
  revalidatePath(`/${gate}/users`);
  back('msg=saved');
}

const REASONS = new Set(['refund', 'permintaan_user', 'duplikat', 'lainnya']);

/** Hapus = SOFT delete (data progres tetap). Alasan "refund" juga menandai
 *  transaksi lunasnya `refunded` supaya tidak dihitung pendapatan. */
export async function removeUserAction(fd: FormData): Promise<void> {
  const gate = str(fd, 'gate');
  const admin = await requireAdmin(gate);
  const id = str(fd, 'id');
  const reason = str(fd, 'reason');
  const note = str(fd, 'note').slice(0, 300);
  const back = (q: string): never => redirect(`/${gate}/users/${id}?${q}`);

  if (!REASONS.has(reason)) back('err=reason');
  if (str(fd, 'confirm') !== 'HAPUS') back('err=confirm');

  const parent = await db.parentAccount.findUnique({ where: { id } });
  if (!parent) back('err=notfound');
  if (parent!.removedAt) back('msg=already');

  let refundedOrders: string[] = [];
  await db.$transaction(async (tx) => {
    await tx.parentAccount.update({
      where: { id },
      data: { removedAt: new Date(), removedReason: note ? `${reason}: ${note}` : reason },
    });
    if (reason === 'refund') {
      const paid = await tx.transaction.findMany({ where: { parentId: id, status: 'success' } });
      refundedOrders = paid.map((t) => t.orderId);
      await tx.transaction.updateMany({ where: { parentId: id, status: 'success' }, data: { status: 'refunded' } });
    }
  });
  await audit(admin.id, 'user_remove', id, { reason, note: note || null, refundedOrders });
  revalidatePath(`/${gate}`);
  back('msg=removed');
}

export async function restoreUserAction(fd: FormData): Promise<void> {
  const gate = str(fd, 'gate');
  const admin = await requireAdmin(gate);
  const id = str(fd, 'id');
  const back = (q: string): never => redirect(`/${gate}/users/${id}?${q}`);

  const parent = await db.parentAccount.findUnique({ where: { id } });
  if (!parent?.removedAt) back('msg=notremoved');

  // WA/email yang sama bisa sudah dipakai akun baru selama akun ini terhapus.
  const clash = await db.parentAccount.findFirst({
    where: {
      id: { not: id },
      removedAt: null,
      OR: [...(parent!.phone ? [{ phone: parent!.phone }] : []), ...(parent!.email ? [{ email: parent!.email }] : [])],
    },
    select: { id: true },
  });
  if (clash) back(`err=taken&other=${clash.id}`);

  const undoRefund = str(fd, 'undoRefund') === '1';
  await db.$transaction(async (tx) => {
    await tx.parentAccount.update({ where: { id }, data: { removedAt: null, removedReason: null } });
    if (undoRefund) {
      await tx.transaction.updateMany({ where: { parentId: id, status: 'refunded' }, data: { status: 'success' } });
    }
  });
  await audit(admin.id, 'user_restore', id, { previousReason: parent!.removedReason, undoRefund });
  revalidatePath(`/${gate}`);
  back('msg=restored');
}
