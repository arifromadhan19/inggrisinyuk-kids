import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionParentId } from '@/lib/session';
import { scorePlacement, type PlacementAnswer } from '@/lib/placement-scoring';
import { withErrorHandling } from '@/lib/api-error';
import { MAX_ATTEMPTS, resolveAttemptsUsed } from '@/lib/placement-attempts';

/**
 * Server re-scoring dari jawaban mentah — pola sama dengan
 * inggrisinyuk-app/app/api/placement-test/route.ts ("jangan percaya angka
 * dari client"). Body cuma berisi jawaban mentah, TIDAK ada field skor.
 */
export const POST = withErrorHandling(async (req: NextRequest): Promise<NextResponse> => {
  const parentId = await getSessionParentId();
  if (!parentId) return NextResponse.json({ error: 'Belum login.' }, { status: 401 });

  const body = (await req.json().catch(() => null)) as { answers?: PlacementAnswer[]; skip?: boolean } | null;

  const child = await db.childProfile.findFirst({
    where: { parentId },
    orderBy: { createdAt: 'asc' },
    include: { parent: { select: { phone: true } } },
  });
  if (!child) return NextResponse.json({ error: 'Profil anak tidak ditemukan.' }, { status: 404 });

  const rawAttemptsUsed = await db.placementTestResult.count({ where: { childId: child.id } });
  // Akun tes "124" (portal/lib/placement-attempts.ts) selalu dianggap 0
  // percobaan terpakai — permintaan user, supaya limit 2x tidak pernah
  // kena buat akun yang memang khusus dipakai coba-coba berkali-kali.
  const attemptsUsed = resolveAttemptsUsed(child.parent.phone, rawAttemptsUsed);

  if (body?.skip) {
    // "Nanti Aja" — non-punitive, level tetap default level pertama (PRD §14 & §4.5: tanpa tekanan).
    const updated = await db.childProfile.update({
      where: { id: child.id },
      data: { dismissedPlacementTest: true },
    });
    return NextResponse.json({ ok: true, level: updated.level, skipped: true, attemptsUsed, attemptsRemaining: MAX_ATTEMPTS - attemptsUsed });
  }

  if (attemptsUsed >= MAX_ATTEMPTS) {
    // Non-punitive framing tetap dijaga di copy: bukan "ditolak", cuma "sudah dipakai" —
    // client (renderPlacementLimitReached) yang menampilkan pesan hangatnya.
    return NextResponse.json(
      { error: 'Sudah dicoba maksimal 2 kali.', limitReached: true, level: child.level, attemptsUsed, attemptsRemaining: 0 },
      { status: 403 }
    );
  }

  const answers = Array.isArray(body?.answers) ? body.answers : [];
  const result = scorePlacement(answers);
  const attemptNumber = attemptsUsed + 1;

  await db.$transaction([
    db.placementTestResult.create({
      data: {
        childId: child.id,
        levelRecommended: result.levelRecommended,
        correctByLevel: result.correctByLevel,
        totalCorrect: result.totalCorrect,
        totalItems: result.totalItems,
        attemptNumber,
        // Prisma Json input wants a plain-structural value, bukan interface
        // yang di-brand TypeScript — round-trip lewat JSON cukup & aman utk
        // array kecil ini.
        speakingSignals: JSON.parse(JSON.stringify(result.speakingSignals)),
      },
    }),
    db.childProfile.update({
      where: { id: child.id },
      data: { level: result.levelRecommended, placementTestDone: true },
    }),
  ]);

  return NextResponse.json({
    ok: true,
    ...result,
    skipped: false,
    attemptNumber,
    attemptsUsed: attemptNumber,
    attemptsRemaining: MAX_ATTEMPTS - attemptNumber,
  });
});
