import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { createSession } from '@/lib/session';

/**
 * Passwordless — persis pola inggrisinyuk asli: cukup no HP atau email yang
 * SUDAH terdaftar (lihat RESEARCH.md §16). Tidak ada pengecekan password
 * sama sekali, karena memang tidak ada field itu di skema.
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  const body = (await req.json().catch(() => null)) as { identifier?: string } | null;
  const identifier = body?.identifier?.trim() ?? '';

  if (!identifier) {
    return NextResponse.json({ error: 'Isi no HP atau email dulu, ya.' }, { status: 400 });
  }

  const parent = await db.parentAccount.findFirst({
    where: { OR: [{ phone: identifier }, { email: identifier.toLowerCase() }] },
  });

  if (!parent || parent.isSuspended) {
    return NextResponse.json({ error: 'No HP/email ini belum terdaftar.' }, { status: 404 });
  }

  await db.parentAccount.update({ where: { id: parent.id }, data: { lastLoginAt: new Date() } });
  const token = await createSession(parent.id);
  return NextResponse.json({ ok: true, token, identifier: parent.phone ?? parent.email });
}
