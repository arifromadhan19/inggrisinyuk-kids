import Link from 'next/link';
import { requireAdmin } from '@/lib/admin/session';
import { PAGE_SIZE, jakartaDay, listUsers, type UserFilter } from '@/lib/admin/queries';
import { dateOnly, dayLabel, num } from '@/lib/admin/format';

const FILTERS: { key: UserFilter; label: string }[] = [
  { key: 'all', label: 'Semua aktif' },
  { key: 'paid', label: 'Sudah bayar' },
  { key: 'manual', label: 'Tanpa transaksi' },
  { key: 'removed', label: 'Dihapus' },
];

export default async function UsersPage(props: PageProps<'/[gate]/users'>) {
  const { gate } = await props.params;
  await requireAdmin(gate);
  const sp = await props.searchParams;
  const f = (FILTERS.find((x) => x.key === sp.f)?.key ?? 'all') as UserFilter;
  const q = typeof sp.q === 'string' ? sp.q.slice(0, 80) : '';
  const page = Math.max(1, Number(sp.page) || 1);
  const { total, rows } = await listUsers(f, q, page);
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const qs = (o: Record<string, string | number>) =>
    new URLSearchParams({ ...(f !== 'all' ? { f } : {}), ...(q ? { q } : {}), ...Object.fromEntries(Object.entries(o).map(([k, v]) => [k, String(v)])) }).toString();
  const today = jakartaDay(0);
  const d7 = jakartaDay(6);

  return (
    <>
      <h1>User</h1>
      <p className="sub">{num(total)} akun</p>
      <div className="tabs">
        {FILTERS.map((x) => (
          <Link key={x.key} className={x.key === f ? 'on' : ''} href={`/${gate}/users?${new URLSearchParams({ ...(x.key !== 'all' ? { f: x.key } : {}), ...(q ? { q } : {}) })}`}>
            {x.label}
          </Link>
        ))}
      </div>
      <form className="search">
        {f !== 'all' && <input type="hidden" name="f" value={f} />}
        <input name="q" defaultValue={q} placeholder="Cari no WA (0812… boleh), email, nama anak, atau order ID" />
        <button type="submit">Cari</button>
      </form>

      <div className="tbl-wrap">
        <table>
          <thead>
            <tr>
              <th>No WA</th><th>Email</th><th>Anak</th><th>Status</th><th>Terakhir aktif</th>
              <th className="num">Hari aktif</th><th className="num">Soal</th><th className="num">Modul</th><th className="num">XP</th><th>Daftar</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr><td colSpan={10} className="muted">Tidak ada user yang cocok.</td></tr>
            )}
            {rows.map((r) => (
              <tr key={r.id}>
                <td><Link href={`/${gate}/users/${r.id}`}>{r.phone ?? '—'}</Link></td>
                <td><Link href={`/${gate}/users/${r.id}`}>{r.email ?? '—'}</Link></td>
                <td>{r.childName ?? '—'} <span className="muted">{r.level ?? ''}</span></td>
                <td>
                  {r.removedAt ? <span className="pill bad">{r.refunded ? 'Refund' : 'Dihapus'}</span>
                    : r.paid ? <span className="pill ok">Lunas</span>
                    : <span className="pill mute">Tanpa transaksi</span>}
                </td>
                <td>
                  {r.lastActiveDay === null ? <span className="muted">belum pernah</span>
                    : r.lastActiveDay >= today ? <span className="pill ok">hari ini</span>
                    : r.lastActiveDay >= d7 ? dayLabel(r.lastActiveDay)
                    : <span className="muted">{dayLabel(r.lastActiveDay)}</span>}
                </td>
                <td className="num">{num(r.activeDays)}</td>
                <td className="num">{num(r.attempts)}</td>
                <td className="num">{num(r.topicsDone)}</td>
                <td className="num">{num(r.xp)}</td>
                <td>{dateOnly(r.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="pager">
        <span>Hal {page} / {pages}</span>
        <span className="row">
          {page > 1 && <Link href={`/${gate}/users?${qs({ page: page - 1 })}`}>← Sebelumnya</Link>}
          {page < pages && <Link href={`/${gate}/users?${qs({ page: page + 1 })}`}>Berikutnya →</Link>}
        </span>
      </div>
    </>
  );
}
