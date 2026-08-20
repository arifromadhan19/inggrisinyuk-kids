import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionParentId } from '@/lib/session';
import { scorePlacement, type PlacementAnswer } from '@/lib/placement-scoring';

/** Iterasi 2 (LLM opsional, doc/first_placement_test.md §8) bisa mengonsumsi
 *  kuota gratis per anak per percobaan — makanya jumlah percobaan DIBATASI
 *  di sini juga (bukan cuma alasan non-teknis), supaya kalau lapis LLM itu
 *  suatu saat dibangun, penggunaannya otomatis ikut terkontrol. Dihitung
 *  dari jumlah baris `PlacementTestResult` (append-only, §schema) — bukan
 *  counter terpisah yang bisa nyimpang dari riwayat asli. `skip` TIDAK
 *  membuat baris di sini, jadi TIDAK ikut kepotong kuota (skip tidak pernah
 *  memanggil apa pun yang mahal). */
const MAX_ATTEMPTS = 2;

/**
 * Server re-scoring dari jawaban mentah — pola sama dengan
 * inggrisinyuk-app/app/api/placement-test/route.ts ("jangan percaya angka
 * dari client"). Body cuma berisi jawaban mentah, TIDAK ada field skor.
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  const parentId = await getSessionParentId();
  if (!parentId) return NextResponse.json({ error: 'Belum login.' }, { status: 401 });

  const body = (await req.json().catch(() => null)) as { answers?: PlacementAnswer[]; skip?: boolean } | null;

  const child = await db.childProfile.findFirst({ where: { parentId }, orderBy: { createdAt: 'asc' } });
  if (!child) return NextResponse.json({ error: 'Profil anak tidak ditemukan.' }, { status: 404 });

  const attemptsUsed = await db.placementTestResult.count({ where: { childId: child.id } });

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
}
