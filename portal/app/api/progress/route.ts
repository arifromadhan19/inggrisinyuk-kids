import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionParentId } from '@/lib/session';
import { withErrorHandling } from '@/lib/api-error';
import {
  insertLearningEvents,
  rebuildStoreForChild,
  recomputeDailyStats,
  upsertStoreSnapshot,
  type LearningEventInput,
  type StoreInput,
} from '@/lib/progress-write';

/**
 * Sync progres main anak (bintang/XP/streak/status soal per section/log
 * tiap percobaan, dst — app/src/progress.ts) — permintaan user "simpan
 * setiap progress ke database" utk analitik & rapor anak. Skema terstruktur
 * (bukan blob JSON lagi) — desain lengkap: TRD.md. localStorage TETAP
 * sumber kebenaran utama offline (PRD §5/§14.4); route ini murni backup/
 * sync + analitik begitu anak online & sudah login.
 */
async function findChild(parentId: string) {
  return db.childProfile.findFirst({ where: { parentId }, orderBy: { createdAt: 'asc' } });
}

/** GET tetap mengembalikan bentuk `Store` (dirakit dari tabel, TRD.md §8.1)
 *  supaya `app/src/progress.ts` `mergeFromServer` tidak perlu berubah. */
export const GET = withErrorHandling(async (): Promise<NextResponse> => {
  const parentId = await getSessionParentId();
  if (!parentId) return NextResponse.json({ error: 'Belum login.' }, { status: 401 });

  const child = await findChild(parentId);
  if (!child) return NextResponse.json({ error: 'Profil anak tidak ditemukan.' }, { status: 404 });

  const data = await rebuildStoreForChild(child.id);
  return NextResponse.json({ data, updatedAt: new Date().toISOString() });
});

// Proteksi murah utk VPS kecil (TRD.md §7.0) — sisanya ditolak dengan halus
// (200 + acceptedEvents < events.length), client kirim sisanya di burst berikutnya.
const MAX_EVENTS_PER_REQUEST = 200;

export const PUT = withErrorHandling(async (req: NextRequest): Promise<NextResponse> => {
  const parentId = await getSessionParentId();
  if (!parentId) return NextResponse.json({ error: 'Belum login.' }, { status: 401 });

  const body = (await req.json().catch(() => null)) as { data?: unknown; events?: unknown } | null;
  if (!body || typeof body.data !== 'object' || body.data === null) {
    return NextResponse.json({ error: 'Data progres tidak valid.' }, { status: 400 });
  }

  const child = await findChild(parentId);
  if (!child) return NextResponse.json({ error: 'Profil anak tidak ditemukan.' }, { status: 404 });

  // Round-trip lewat JSON — nilai struktural murni, bukan objek yang
  // mungkin punya prototipe/field aneh dari body request (pola sama dgn
  // placement-test/route.ts `speakingSignals`).
  const data = JSON.parse(JSON.stringify(body.data)) as StoreInput;
  const rawEvents = Array.isArray(body.events) ? body.events : [];
  const events = JSON.parse(JSON.stringify(rawEvents.slice(0, MAX_EVENTS_PER_REQUEST))) as LearningEventInput[];

  // (1) State — SELALU jalan, self-healing, tidak pernah bergantung pada
  // event log (TRD.md §3/§I2). (2) Log + rollup — aditif, kegagalannya
  // cuma mengurangi detail analitik, TIDAK merusak progres di (1).
  await upsertStoreSnapshot(child.id, child.level, data);

  let acceptedEvents = 0;
  if (events.length > 0) {
    const touchedDays = await insertLearningEvents(child.id, events);
    acceptedEvents = events.length;
    for (const day of touchedDays) await recomputeDailyStats(child.id, day);
  }

  return NextResponse.json({ ok: true, updatedAt: new Date().toISOString(), acceptedEvents, totalEvents: rawEvents.length });
});
