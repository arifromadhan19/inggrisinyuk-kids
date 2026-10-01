import { Fragment } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireAdmin } from '@/lib/admin/session';
import { getUserDetail } from '@/lib/admin/queries';
import { dateTime, dayLabel, num, pct, rupiah, waLink } from '@/lib/admin/format';
import { removeUserAction, restoreUserAction, updateUserAction } from '../../actions';

const MSG: Record<string, string> = {
  saved: 'Perubahan disimpan. User sekarang bisa login dgn WA/email yang baru.',
  nochange: 'Tidak ada yang berubah.',
  removed: 'User dihapus. Login & sesi lamanya sudah tidak berlaku.',
  restored: 'User dipulihkan dan bisa login lagi.',
  already: 'User ini sudah dihapus sebelumnya.',
  notremoved: 'User ini tidak dalam status dihapus.',
};
const ERR: Record<string, string> = {
  empty: 'Isi minimal salah satu: no WA atau email.',
  phone: 'Format no WA belum benar (contoh 08123456789).',
  email: 'Format email belum benar.',
  taken: 'No WA atau email itu sudah dipakai akun lain.',
  reason: 'Pilih alasan penghapusan.',
  confirm: 'Ketik HAPUS (huruf besar) untuk konfirmasi.',
  notfound: 'User tidak ditemukan.',
};
const ACTION_LABEL: Record<string, string> = {
  user_update: 'Edit data', user_remove: 'Dihapus', user_restore: 'Dipulihkan',
};
const TRX_PILL: Record<string, string> = { success: 'ok', refunded: 'bad', pending: 'warn', expired: 'mute', failed: 'bad' };

export default async function UserDetail(props: PageProps<'/[gate]/users/[id]'>) {
  const { gate, id } = await props.params;
  await requireAdmin(gate);
  const sp = await props.searchParams;
  const d = await getUserDetail(id);
  if (!d) notFound();
  const { parent, totals } = d;
  const child = parent.children[0];
  const st = child?.progressState;
  const wa = waLink(parent.phone);
  const msg = typeof sp.msg === 'string' ? MSG[sp.msg] : undefined;
  const err = typeof sp.err === 'string' ? ERR[sp.err] : undefined;
  const other = typeof sp.other === 'string' ? sp.other : null;
  const hasRefund = parent.transactions.some((t) => t.status === 'refunded');

  return (
    <>
      <p><Link href={`/${gate}/users`}>← Daftar user</Link></p>
      <h1 className="row">
        {parent.phone ?? parent.email}
        {parent.removedAt ? <span className="pill bad">Dihapus</span>
          : parent.transactions.some((t) => t.status === 'success') ? <span className="pill ok">Lunas</span>
          : <span className="pill mute">Tanpa transaksi</span>}
      </h1>
      <p className="sub">
        Daftar {dateTime(parent.createdAt)} · login terakhir {dateTime(parent.lastLoginAt)}
        {wa && <> · <a href={wa} target="_blank" rel="noopener noreferrer">Chat WA ↗</a></>}
      </p>
      {msg && <div className="flash ok">{msg}</div>}
      {err && (
        <div className="flash bad">
          {err} {other && <Link href={`/${gate}/users/${other}`}>Lihat akun itu →</Link>}
        </div>
      )}
      {parent.removedAt && (
        <div className="flash bad">Dihapus {dateTime(parent.removedAt)} — alasan: {parent.removedReason ?? '—'}</div>
      )}

      <div className="two">
        <div className="card">
          <h2 style={{ marginTop: 0 }}>Edit data login</h2>
          <p className="muted" style={{ marginTop: 0, fontSize: 12 }}>
            Login cukup pakai no WA <b>atau</b> email. Kalau orang tua salah ketik saat daftar, perbaiki di sini.
          </p>
          <form action={updateUserAction}>
            <input type="hidden" name="gate" value={gate} />
            <input type="hidden" name="id" value={parent.id} />
            <label htmlFor="phone">No WhatsApp</label>
            <input id="phone" name="phone" defaultValue={parent.phone ?? ''} inputMode="tel" placeholder="0812…" />
            <label htmlFor="email">Email</label>
            <input id="email" name="email" type="email" defaultValue={parent.email ?? ''} />
            <label htmlFor="childName">Nama anak</label>
            <input id="childName" name="childName" defaultValue={child?.name ?? ''} maxLength={40} />
            <label htmlFor="note">Catatan (opsional, masuk log)</label>
            <input id="note" name="note" placeholder="mis. salah ketik 1 digit, dikonfirmasi via WA" maxLength={200} />
            <button type="submit" className="mt">Simpan</button>
          </form>
        </div>

        <div className="card">
          <h2 style={{ marginTop: 0 }}>Progres belajar</h2>
          {child ? (
            <div className="kv">
              <span>Nama anak / panggilan</span><span>{child.name ?? '—'} / {st?.nickname ?? '—'}</span>
              <span>Level</span><span>{child.level}</span>
              <span>Placement test</span><span>{child.placementTestDone ? `selesai (${child._count.placementResults}x)` : 'belum'}</span>
              <span>Terakhir aktif</span><span>{dayLabel(totals.lastDay)}</span>
              <span>Total hari aktif</span><span>{num(totals.activeDays)}</span>
              <span>Soal dijawab</span><span>{num(totals.attempts)}</span>
              <span>Ketepatan</span><span>{pct(totals.correct, totals.attempts)}</span>
              <span>Modul tuntas</span><span>{num(child._count.topicCompletions)}</span>
              <span>Raja ditaklukkan</span><span>{num(child._count.bossClearances)}</span>
              <span>XP</span><span>{num(st?.xp ?? 0)}</span>
            </div>
          ) : (
            <p className="muted">Belum ada profil anak.</p>
          )}
          {d.recent.length > 0 && (
            <>
              <h2>14 hari aktif terakhir</h2>
              <div className="kv">
                {d.recent.map((r) => (
                  <Fragment key={r.id}><span>{dayLabel(r.day)}</span><span>{num(r.attempts)} soal · {num(r.xpGained)} XP</span></Fragment>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <h2>Transaksi</h2>
      <div className="tbl-wrap">
        <table>
          <thead><tr><th>Order ID</th><th>Status</th><th className="num">Jumlah</th><th>Metode</th><th>Dibuat</th><th>Lunas</th><th>WA / email saat checkout</th></tr></thead>
          <tbody>
            {[...parent.transactions, ...d.otherTrx].length === 0 && <tr><td colSpan={7} className="muted">Tidak ada transaksi (akun tes/manual).</td></tr>}
            {[...parent.transactions, ...d.otherTrx].map((t) => (
              <tr key={t.orderId}>
                <td><code>{t.orderId}</code>{t.parentId !== parent.id && <span className="muted"> (belum tertaut)</span>}</td>
                <td><span className={`pill ${TRX_PILL[t.status] ?? 'mute'}`}>{t.status}</span></td>
                <td className="num">{rupiah(t.amount)}</td>
                <td>{t.paymentMethod ?? '—'}</td>
                <td>{dateTime(t.createdAt)}</td>
                <td>{dateTime(t.paidAt)}</td>
                <td>{t.phone} · {t.email}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="two mt">
        {parent.removedAt ? (
          <div className="card">
            <h2 style={{ marginTop: 0 }}>Pulihkan user</h2>
            <form action={restoreUserAction}>
              <input type="hidden" name="gate" value={gate} />
              <input type="hidden" name="id" value={parent.id} />
              {hasRefund && (
                <label className="row" style={{ color: 'var(--ink)' }}>
                  <input type="checkbox" name="undoRefund" value="1" style={{ width: 'auto' }} /> Batalkan status refund (transaksi jadi lunas lagi)
                </label>
              )}
              <button type="submit" className="mt">Pulihkan</button>
            </form>
          </div>
        ) : (
          <div className="card">
            <h2 style={{ marginTop: 0 }}>Hapus user</h2>
            <p className="muted" style={{ marginTop: 0, fontSize: 12 }}>
              Akun tidak bisa login lagi, tapi data progres tetap disimpan & bisa dipulihkan. Alasan <b>Refund</b> juga
              menandai transaksinya refund (tidak dihitung pendapatan). Uang refund tetap dikirim manual lewat Xendit.
            </p>
            <form action={removeUserAction}>
              <input type="hidden" name="gate" value={gate} />
              <input type="hidden" name="id" value={parent.id} />
              <label htmlFor="reason">Alasan</label>
              <select id="reason" name="reason" required defaultValue="">
                <option value="" disabled>Pilih…</option>
                <option value="refund">Refund</option>
                <option value="permintaan_user">Permintaan user</option>
                <option value="duplikat">Akun duplikat</option>
                <option value="lainnya">Lainnya</option>
              </select>
              <label htmlFor="rnote">Catatan</label>
              <input id="rnote" name="note" maxLength={300} />
              <label htmlFor="confirm">Ketik HAPUS untuk konfirmasi</label>
              <input id="confirm" name="confirm" autoComplete="off" />
              <button type="submit" className="danger mt">Hapus user</button>
            </form>
          </div>
        )}

        <div className="card">
          <h2 style={{ marginTop: 0 }}>Riwayat perubahan</h2>
          {d.logs.length === 0 ? <p className="muted">Belum ada.</p> : (
            <div className="kv">
              {d.logs.map((l) => (
                <Fragment key={l.id}><span>{ACTION_LABEL[l.action] ?? l.action} · {l.admin?.username ?? '—'}</span><span>{dateTime(l.createdAt)}</span></Fragment>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
