import Link from 'next/link';
import { requireAdmin } from '@/lib/admin/session';
import { listAudit } from '@/lib/admin/queries';
import { dateTime } from '@/lib/admin/format';

const LABEL: Record<string, string> = {
  login: 'Login', login_failed: 'Login gagal', user_update: 'Edit data user', user_remove: 'Hapus user', user_restore: 'Pulihkan user',
};

function summary(action: string, detail: unknown): string {
  const d = (detail ?? {}) as Record<string, unknown>;
  if (action === 'user_update') {
    const b = (d.before ?? {}) as Record<string, unknown>;
    const a = (d.after ?? {}) as Record<string, unknown>;
    return ['phone', 'email', 'childName']
      .filter((k) => b[k] !== a[k])
      .map((k) => `${k}: ${b[k] ?? '—'} → ${a[k] ?? '—'}`)
      .join(' · ');
  }
  if (action === 'user_remove') return `alasan: ${d.reason}${d.note ? ` (${d.note})` : ''}`;
  if (action === 'login_failed') return `username: ${d.username || '—'}`;
  return '';
}

export default async function AuditPage(props: PageProps<'/[gate]/audit'>) {
  const { gate } = await props.params;
  await requireAdmin(gate);
  const logs = await listAudit();
  return (
    <>
      <h1>Log Aktivitas Tim</h1>
      <p className="sub">200 kejadian terakhir — siapa mengubah apa & kapan.</p>
      <div className="tbl-wrap">
        <table>
          <thead><tr><th>Waktu</th><th>Admin</th><th>Aksi</th><th>User</th><th>Detail</th><th>IP</th></tr></thead>
          <tbody>
            {logs.length === 0 && <tr><td colSpan={6} className="muted">Belum ada.</td></tr>}
            {logs.map((l) => (
              <tr key={l.id}>
                <td>{dateTime(l.createdAt)}</td>
                <td>{l.admin?.username ?? '—'}</td>
                <td>{l.action === 'login_failed' ? <span className="pill bad">{LABEL[l.action]}</span> : LABEL[l.action] ?? l.action}</td>
                <td>{l.targetParentId ? <Link href={`/${gate}/users/${l.targetParentId}`}>lihat</Link> : '—'}</td>
                <td style={{ whiteSpace: 'normal', minWidth: 240 }}>{summary(l.action, l.detail)}</td>
                <td className="muted">{l.ip || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
