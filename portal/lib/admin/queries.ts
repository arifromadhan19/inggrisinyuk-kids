/** Query panel manajemen user — angka ringkas & daftar. Semua hitungan
 *  "aktif" memakai `child_daily_stats` (1 baris = anak aktif hari itu,
 *  tanggal lokal perangkat) dan MENGABAIKAN akun yang sudah dihapus. */
import { Prisma } from '@prisma/client';
import { db } from '@/lib/db';

/** YYYY-MM-DD di zona Asia/Jakarta, `offsetDays` hari ke belakang. */
export function jakartaDay(offsetDays = 0): string {
  const d = new Date(Date.now() - offsetDays * 86_400_000);
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' }).format(d);
}

export interface WindowStats {
  users: number;
  attempts: number;
  correct: number;
  topicsDone: number;
  xp: number;
  minutes: number;
}

export interface DashboardStats {
  registered: number;
  paid: number;
  manual: number;
  removed: number;
  refunded: number;
  leads: number;
  revenue: number;
  newToday: number;
  new7d: number;
  dau: WindowStats;
  wau: WindowStats;
  mau: WindowStats;
  daily: { day: string; users: number; attempts: number }[];
  /** Akun orang tua dibuat per hari (WIB) — termasuk yang kemudian dihapus. */
  registrations: { day: string; count: number; removed: number }[];
}

type Row = Record<string, bigint | number | string | null>;
const n = (v: unknown): number => (v === null || v === undefined ? 0 : Number(v));

export async function getDashboardStats(): Promise<DashboardStats> {
  const today = jakartaDay(0);
  const d7 = jakartaDay(6);
  const d30 = jakartaDay(29);
  const startToday = new Date(`${today}T00:00:00+07:00`);
  const start7 = new Date(`${d7}T00:00:00+07:00`);

  const [accounts] = await db.$queryRaw<Row[]>`
    SELECT
      count(*) FILTER (WHERE p.removed_at IS NULL) AS registered,
      count(*) FILTER (WHERE p.removed_at IS NOT NULL) AS removed,
      count(*) FILTER (WHERE p.removed_at IS NULL AND EXISTS (
        SELECT 1 FROM transactions t WHERE t.parent_id = p.id AND t.status = 'success')) AS paid,
      count(*) FILTER (WHERE p.removed_at IS NULL AND p.created_at >= ${startToday}) AS new_today,
      count(*) FILTER (WHERE p.removed_at IS NULL AND p.created_at >= ${start7}) AS new_7d
    FROM parent_accounts p`;

  const [money] = await db.$queryRaw<Row[]>`
    SELECT
      coalesce(sum(amount) FILTER (WHERE status = 'success'), 0) AS revenue,
      count(*) FILTER (WHERE status = 'refunded') AS refunded
    FROM transactions`;

  const [leads] = await db.$queryRaw<Row[]>`
    SELECT count(DISTINCT t.phone) AS leads
    FROM transactions t
    WHERE t.status NOT IN ('success', 'refunded')
      AND NOT EXISTS (
        SELECT 1 FROM parent_accounts p
        WHERE (p.phone = t.phone OR p.email = t.email) AND p.removed_at IS NULL)`;

  // Semua aktivitas 30 hari terakhir sekali ambil, lalu dipotong per jendela.
  const [act] = await db.$queryRaw<Row[]>`
    SELECT
      count(DISTINCT s.child_id) FILTER (WHERE s.day >= ${today}) AS dau_users,
      coalesce(sum(s.attempts) FILTER (WHERE s.day >= ${today}), 0) AS dau_attempts,
      coalesce(sum(s.correct) FILTER (WHERE s.day >= ${today}), 0) AS dau_correct,
      coalesce(sum(s.topics_done) FILTER (WHERE s.day >= ${today}), 0) AS dau_topics,
      coalesce(sum(s.xp_gained) FILTER (WHERE s.day >= ${today}), 0) AS dau_xp,
      count(DISTINCT s.child_id) FILTER (WHERE s.day >= ${d7}) AS wau_users,
      coalesce(sum(s.attempts) FILTER (WHERE s.day >= ${d7}), 0) AS wau_attempts,
      coalesce(sum(s.correct) FILTER (WHERE s.day >= ${d7}), 0) AS wau_correct,
      coalesce(sum(s.topics_done) FILTER (WHERE s.day >= ${d7}), 0) AS wau_topics,
      coalesce(sum(s.xp_gained) FILTER (WHERE s.day >= ${d7}), 0) AS wau_xp,
      count(DISTINCT s.child_id) AS mau_users,
      coalesce(sum(s.attempts), 0) AS mau_attempts,
      coalesce(sum(s.correct), 0) AS mau_correct,
      coalesce(sum(s.topics_done), 0) AS mau_topics,
      coalesce(sum(s.xp_gained), 0) AS mau_xp
    FROM child_daily_stats s
    JOIN child_profiles c ON c.id = s.child_id
    JOIN parent_accounts p ON p.id = c.parent_id AND p.removed_at IS NULL
    WHERE s.day >= ${d30}`;

  // Menit belajar: `active_ms` = JSON {"YYYY-MM-DD": ms} per anak (Rapor).
  const [mins] = await db.$queryRaw<Row[]>`
    SELECT
      coalesce(sum(v::numeric) FILTER (WHERE k >= ${today}), 0) / 60000 AS dau,
      coalesce(sum(v::numeric) FILTER (WHERE k >= ${d7}), 0) / 60000 AS wau,
      coalesce(sum(v::numeric), 0) / 60000 AS mau
    FROM child_progress_state st
    JOIN child_profiles c ON c.id = st.child_id
    JOIN parent_accounts p ON p.id = c.parent_id AND p.removed_at IS NULL
    CROSS JOIN LATERAL jsonb_each_text(coalesce(st.active_ms, '{}'::jsonb)) AS e(k, v)
    WHERE k >= ${d30} AND v ~ '^[0-9]+(\\.[0-9]+)?$'`;

  const daily = await db.$queryRaw<Row[]>`
    SELECT s.day, count(DISTINCT s.child_id) AS users, coalesce(sum(s.attempts), 0) AS attempts
    FROM child_daily_stats s
    JOIN child_profiles c ON c.id = s.child_id
    JOIN parent_accounts p ON p.id = c.parent_id AND p.removed_at IS NULL
    WHERE s.day >= ${d30} AND s.day <= ${today}
    GROUP BY s.day ORDER BY s.day`;

  const regs = await db.$queryRaw<Row[]>`
    SELECT to_char(p.created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Jakarta', 'YYYY-MM-DD') AS day,
      count(*) AS count, count(*) FILTER (WHERE p.removed_at IS NOT NULL) AS removed
    FROM parent_accounts p
    WHERE p.created_at >= ${new Date(`${d30}T00:00:00+07:00`)}
    GROUP BY 1`;
  const regByDay = new Map(regs.map((r) => [String(r.day), r]));

  const byDay = new Map(daily.map((r) => [String(r.day), r]));
  const series: DashboardStats['daily'] = [];
  const registrations: DashboardStats['registrations'] = [];
  for (let i = 29; i >= 0; i--) {
    const day = jakartaDay(i);
    const r = byDay.get(day);
    series.push({ day, users: n(r?.users), attempts: n(r?.attempts) });
    const g = regByDay.get(day);
    registrations.push({ day, count: n(g?.count), removed: n(g?.removed) });
  }

  const win = (p: 'dau' | 'wau' | 'mau'): WindowStats => ({
    users: n(act[`${p}_users`]),
    attempts: n(act[`${p}_attempts`]),
    correct: n(act[`${p}_correct`]),
    topicsDone: n(act[`${p}_topics`]),
    xp: n(act[`${p}_xp`]),
    minutes: Math.round(n(mins?.[p])),
  });

  const registered = n(accounts.registered);
  const paid = n(accounts.paid);
  return {
    registered,
    paid,
    manual: registered - paid,
    removed: n(accounts.removed),
    refunded: n(money.refunded),
    leads: n(leads.leads),
    revenue: n(money.revenue),
    newToday: n(accounts.new_today),
    new7d: n(accounts.new_7d),
    dau: win('dau'),
    wau: win('wau'),
    mau: win('mau'),
    daily: series,
    registrations,
  };
}

export type UserFilter = 'all' | 'paid' | 'manual' | 'removed';
export const PAGE_SIZE = 50;

export async function listUsers(filter: UserFilter, q: string, page: number) {
  const where: Prisma.ParentAccountWhereInput = {};
  if (filter === 'removed') where.removedAt = { not: null };
  else where.removedAt = null;
  if (filter === 'paid') where.transactions = { some: { status: 'success' } };
  if (filter === 'manual') where.transactions = { none: { status: 'success' } };

  const term = q.trim();
  if (term) {
    const digits = term.replace(/[^\d]/g, '');
    const phoneTerm = digits.startsWith('0') ? `62${digits.slice(1)}` : digits;
    where.OR = [
      { email: { contains: term.toLowerCase(), mode: 'insensitive' } },
      { children: { some: { name: { contains: term, mode: 'insensitive' } } } },
      { transactions: { some: { orderId: { contains: term, mode: 'insensitive' } } } },
      ...(phoneTerm ? [{ phone: { contains: phoneTerm } }] : []),
    ];
  }

  const [total, parents] = await Promise.all([
    db.parentAccount.count({ where }),
    db.parentAccount.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        children: { select: { id: true, name: true, level: true, progressState: { select: { xp: true } } } },
        transactions: { where: { status: { in: ['success', 'refunded'] } }, select: { status: true } },
      },
    }),
  ]);

  const ids = parents.map((p) => p.id);
  const activity = ids.length
    ? await db.$queryRaw<Row[]>`
        SELECT c.parent_id, max(s.day) AS last_day, count(*) AS active_days,
               coalesce(sum(s.attempts), 0) AS attempts
        FROM child_daily_stats s JOIN child_profiles c ON c.id = s.child_id
        WHERE c.parent_id IN (${Prisma.join(ids)})
        GROUP BY c.parent_id`
    : [];
  const topics = ids.length
    ? await db.$queryRaw<Row[]>`
        SELECT c.parent_id, count(*) AS topics
        FROM topic_completions t JOIN child_profiles c ON c.id = t.child_id
        WHERE c.parent_id IN (${Prisma.join(ids)})
        GROUP BY c.parent_id`
    : [];
  const actBy = new Map(activity.map((r) => [String(r.parent_id), r]));
  const topBy = new Map(topics.map((r) => [String(r.parent_id), n(r.topics)]));

  const rows = parents.map((p) => {
    const a = actBy.get(p.id);
    const child = p.children[0];
    return {
      id: p.id,
      phone: p.phone,
      email: p.email,
      createdAt: p.createdAt,
      removedAt: p.removedAt,
      childName: child?.name ?? null,
      level: child?.level ?? null,
      xp: child?.progressState?.xp ?? 0,
      paid: p.transactions.some((t) => t.status === 'success'),
      refunded: p.transactions.some((t) => t.status === 'refunded'),
      lastActiveDay: a?.last_day ? String(a.last_day) : null,
      activeDays: n(a?.active_days),
      attempts: n(a?.attempts),
      topicsDone: topBy.get(p.id) ?? 0,
    };
  });
  return { total, rows };
}

export async function getUserDetail(id: string) {
  const parent = await db.parentAccount.findUnique({
    where: { id },
    include: {
      children: {
        include: {
          progressState: { select: { xp: true, correctAttempts: true, totalAttempts: true, nickname: true, lastActiveDay: true } },
          _count: { select: { topicCompletions: true, bossClearances: true, placementResults: true } },
        },
      },
      transactions: { orderBy: { createdAt: 'desc' } },
    },
  });
  if (!parent) return null;

  const childIds = parent.children.map((c) => c.id);
  const recent = childIds.length
    ? await db.childDailyStat.findMany({
        where: { childId: { in: childIds } },
        orderBy: { day: 'desc' },
        take: 14,
      })
    : [];
  const [totals] = childIds.length
    ? await db.$queryRaw<Row[]>`
        SELECT count(*) AS active_days, coalesce(sum(attempts), 0) AS attempts,
               coalesce(sum(correct), 0) AS correct, max(day) AS last_day
        FROM child_daily_stats WHERE child_id IN (${Prisma.join(childIds)})`
    : [{}];
  const logs = await db.adminAuditLog.findMany({
    where: { targetParentId: id },
    orderBy: { createdAt: 'desc' },
    take: 30,
    include: { admin: { select: { username: true } } },
  });
  // Checkout lain dgn WA/email yang sama (mis. salah ketik lalu daftar ulang).
  const otherTrx = await db.transaction.findMany({
    where: {
      parentId: { not: id },
      OR: [...(parent.phone ? [{ phone: parent.phone }] : []), ...(parent.email ? [{ email: parent.email }] : [])],
    },
    orderBy: { createdAt: 'desc' },
    take: 10,
  });

  return {
    parent,
    recent,
    totals: {
      activeDays: n(totals?.active_days),
      attempts: n(totals?.attempts),
      correct: n(totals?.correct),
      lastDay: totals?.last_day ? String(totals.last_day) : null,
    },
    logs,
    otherTrx: parent.phone || parent.email ? otherTrx : [],
  };
}

/** Checkout yang belum lunas & orangnya belum punya akun aktif — daftar
 *  follow-up CS (1 baris per no WA, checkout terakhir). */
export async function listLeads(q: string) {
  const term = `%${q.trim().toLowerCase()}%`;
  return db.$queryRaw<
    { order_id: string; phone: string; email: string; child_name: string; status: string; created_at: Date; tries: bigint }[]
  >`
    SELECT DISTINCT ON (t.phone) t.order_id, t.phone, t.email, t.child_name, t.status, t.created_at,
      count(*) OVER (PARTITION BY t.phone) AS tries
    FROM transactions t
    WHERE t.status NOT IN ('success', 'refunded')
      AND NOT EXISTS (
        SELECT 1 FROM parent_accounts p
        WHERE (p.phone = t.phone OR p.email = t.email) AND p.removed_at IS NULL)
      AND (${q.trim() === ''} OR lower(t.phone || ' ' || t.email || ' ' || t.child_name || ' ' || t.order_id) LIKE ${term})
    ORDER BY t.phone, t.created_at DESC
    LIMIT 500`;
}

export async function listAudit(limit = 200) {
  return db.adminAuditLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: { admin: { select: { username: true } } },
  });
}
