import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionParentId } from '@/lib/session';
import { withErrorHandling } from '@/lib/api-error';
import { MAX_ATTEMPTS, resolveAttemptsUsed } from '@/lib/placement-attempts';

export const GET = withErrorHandling(async (): Promise<NextResponse> => {
  const parentId = await getSessionParentId();
  if (!parentId) return NextResponse.json({ error: 'Belum login.' }, { status: 401 });

  const parent = await db.parentAccount.findUnique({
    where: { id: parentId },
    include: { children: { orderBy: { createdAt: 'asc' }, take: 1 } },
  });
  if (!parent) return NextResponse.json({ error: 'Akun tidak ditemukan.' }, { status: 404 });

  const child = parent.children[0] ?? null;

  // Dipakai Beranda (app/) buat kartu hasil di bawah "Progres Harian" (user
  // request) + gating tombol "Main Lagi" begitu attemptsUsed >= MAX_ATTEMPTS.
  let attemptsUsed = 0;
  let latestPlacementResult: {
    levelRecommended: string;
    totalCorrect: number;
    totalItems: number;
    attemptNumber: number;
    takenAt: string;
  } | null = null;

  if (child) {
    const [count, latest] = await Promise.all([
      db.placementTestResult.count({ where: { childId: child.id } }),
      db.placementTestResult.findFirst({ where: { childId: child.id }, orderBy: { takenAt: 'desc' } }),
    ]);
    attemptsUsed = resolveAttemptsUsed(parent.phone, count);
    latestPlacementResult = latest
      ? {
          levelRecommended: latest.levelRecommended,
          totalCorrect: latest.totalCorrect,
          totalItems: latest.totalItems,
          attemptNumber: latest.attemptNumber,
          takenAt: latest.takenAt.toISOString(),
        }
      : null;
  }

  return NextResponse.json({
    parent: { id: parent.id, phone: parent.phone, email: parent.email },
    child: child
      ? {
          id: child.id,
          name: child.name,
          level: child.level,
          placementTestDone: child.placementTestDone,
          dismissedPlacementTest: child.dismissedPlacementTest,
          placementAttemptsUsed: attemptsUsed,
          placementAttemptsRemaining: Math.max(0, MAX_ATTEMPTS - attemptsUsed),
          latestPlacementResult,
        }
      : null,
  });
});
