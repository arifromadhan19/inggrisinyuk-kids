import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionParentId } from '@/lib/session';
import { withErrorHandling } from '@/lib/api-error';

/**
 * Papan Peringkat XP — permintaan user, revisi dari keputusan lama PRD §4.6/
 * §13 ("tanpa leaderboard, hindari kecemasan sosial") yang sekarang dibolehkan
 * KHUSUS karena progres sudah disimpan di database (`child_progress_state`)
 * & login sudah jadi gerbang wajib. Filter kid-friendly TETAP berlaku penuh
 * (CLAUDE.md §1): dianonimkan total, bukan cuma "tanpa nama asli" tapi juga
 * TANPA angka peringkat eksplisit per anak — cukup daftar top N.
 *
 * SENGAJA cuma mengembalikan `avatar` (1 dari 12 emoji hewan tetap,
 * `ANIMAL_AVATARS` app/src/progress.ts — bukan foto) + `xp`, TIDAK PERNAH
 * `nickname` (`ChildProgressState.nickname`, alias `Store.name`) — field itu
 * teks bebas yang anak ISI SENDIRI (dipakai jadi sapaan "Hi {name}" di
 * header), jadi BISA berisi nama asli walau field-nya secara teknis terpisah
 * dari `ChildProfile.name` (yang diisi orang tua). Leaderboard yang genuinely
 * anonim tidak boleh bergantung pada teks bebas apa pun dari anak.
 */
const TOP_N = 10;

export const GET = withErrorHandling(async (): Promise<NextResponse> => {
  const parentId = await getSessionParentId();
  if (!parentId) return NextResponse.json({ error: 'Belum login.' }, { status: 401 });

  const rows = await db.childProgressState.findMany({
    where: { xp: { gt: 0 } },
    orderBy: { xp: 'desc' },
    take: TOP_N,
    select: { avatar: true, xp: true },
  });

  const top = rows.map((r) => ({ avatar: r.avatar || '🦁', xp: r.xp }));
  return NextResponse.json({ top });
});
