import { requireAdmin } from '@/lib/admin/session';
import { listLeads } from '@/lib/admin/queries';
import { dateTime, num, waLink } from '@/lib/admin/format';

const PILL: Record<string, string> = { pending: 'warn', expired: 'mute', failed: 'bad' };

export default async function LeadsPage(props: PageProps<'/[gate]/leads'>) {
  const { gate } = await props.params;
  await requireAdmin(gate);
  const sp = await props.searchParams;
  const q = typeof sp.q === 'string' ? sp.q.slice(0, 80) : '';
  const rows = await listLeads(q);
  return (
    <>
      <h1>Belum Bayar</h1>
      <p className="sub">
        Sudah isi form Daftar tapi pembayarannya belum lunas (pending/kedaluwarsa/gagal) & belum punya akun. Akun baru
        dibuat otomatis begitu lunas. {num(rows.length)} orang.
      </p>
      <form className="search">
        <input name="q" defaultValue={q} placeholder="Cari no WA, email, nama anak, order ID" />
        <button type="submit">Cari</button>
      </form>
      <div className="tbl-wrap">
        <table>
          <thead><tr><th>No WA</th><th>Email</th><th>Anak</th><th>Status terakhir</th><th className="num">Percobaan</th><th>Terakhir checkout</th><th>Order ID</th></tr></thead>
          <tbody>
            {rows.length === 0 && <tr><td colSpan={7} className="muted">Tidak ada.</td></tr>}
            {rows.map((r) => {
              const wa = waLink(r.phone);
              return (
                <tr key={r.order_id}>
                  <td>{wa ? <a href={`${wa}?text=${encodeURIComponent(`Halo, kami dari InggrisinYuk Kids. Pendaftaran untuk ${r.child_name} belum selesai — ada yang bisa kami bantu?`)}`} target="_blank" rel="noopener noreferrer">{r.phone} ↗</a> : r.phone}</td>
                  <td>{r.email}</td>
                  <td>{r.child_name}</td>
                  <td><span className={`pill ${PILL[r.status] ?? 'mute'}`}>{r.status}</span></td>
                  <td className="num">{num(Number(r.tries))}</td>
                  <td>{dateTime(r.created_at)}</td>
                  <td><code>{r.order_id}</code></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
