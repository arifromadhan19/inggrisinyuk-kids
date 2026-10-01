import Link from 'next/link';
import { requireAdmin } from '@/lib/admin/session';
import { getDashboardStats, type WindowStats } from '@/lib/admin/queries';
import { dayLabel, num, pct, rupiah } from '@/lib/admin/format';

function ActiveCard({ title, desc, w, registered }: { title: string; desc: string; w: WindowStats; registered: number }) {
  return (
    <div className="card">
      <h3>{title}</h3>
      <div className="big">{num(w.users)}</div>
      <div className="kv">
        <span>dari user terdaftar</span><span>{pct(w.users, registered)}</span>
        <span>Soal dijawab</span><span>{num(w.attempts)}</span>
        <span>Jawaban tepat</span><span>{num(w.correct)} ({pct(w.correct, w.attempts)})</span>
        <span>Modul tuntas</span><span>{num(w.topicsDone)}</span>
        <span>XP didapat</span><span>{num(w.xp)}</span>
        <span>Menit belajar</span><span>{num(w.minutes)}</span>
        <span>Rata-rata soal / user aktif</span><span>{w.users ? num(Math.round(w.attempts / w.users)) : '—'}</span>
      </div>
      <p className="muted" style={{ margin: '8px 0 0', fontSize: 12 }}>{desc}</p>
    </div>
  );
}

function DailyBars({ label, unit, total, points }: { label: string; unit: string; total?: string; points: { day: string; value: number; tip: string }[] }) {
  const max = Math.max(1, ...points.map((p) => p.value));
  return (
    <div className="card">
      <div className="bars" aria-label={label}>
        {points.map((p) => (
          <div key={p.day} style={{ height: `${(p.value / max) * 100}%` }} title={`${dayLabel(p.day)}: ${p.tip}`} />
        ))}
      </div>
      <div className="bars-x">
        <span>{dayLabel(points[0].day)}</span>
        <span>{total ? `${total} · ` : ''}puncak {num(max)} {unit}</span>
        <span>{dayLabel(points[points.length - 1].day)}</span>
      </div>
    </div>
  );
}

export default async function Dashboard(props: PageProps<'/[gate]'>) {
  const { gate } = await props.params;
  await requireAdmin(gate);
  const s = await getDashboardStats();

  return (
    <>
      <h1>Ringkasan</h1>
      <p className="sub">Tanggal mengikuti WIB. Akun yang sudah dihapus tidak dihitung aktif.</p>

      <div className="grid g4">
        <Link className="card kpi" href={`/${gate}/users`}>
          <div className="lbl">Total user terdaftar</div>
          <div className="val">{num(s.registered)}</div>
          <div className="hint">+{num(s.newToday)} hari ini · +{num(s.new7d)} 7 hari</div>
        </Link>
        <Link className="card kpi" href={`/${gate}/users?f=paid`}>
          <div className="lbl">Sudah bayar</div>
          <div className="val">{num(s.paid)}</div>
          <div className="hint">{rupiah(s.revenue)} masuk</div>
        </Link>
        <Link className="card kpi" href={`/${gate}/leads`}>
          <div className="lbl">Belum bayar (checkout gagal/pending)</div>
          <div className="val">{num(s.leads)}</div>
          <div className="hint">bisa di-follow up via WA</div>
        </Link>
        <Link className="card kpi" href={`/${gate}/users?f=removed`}>
          <div className="lbl">Dihapus</div>
          <div className="val">{num(s.removed)}</div>
          <div className="hint">{num(s.refunded)} transaksi di-refund</div>
        </Link>
      </div>
      {s.manual > 0 && (
        <p className="muted" style={{ fontSize: 12 }}>
          {num(s.manual)} akun terdaftar tanpa transaksi lunas (akun tes/manual) —{' '}
          <Link href={`/${gate}/users?f=manual`}>lihat</Link>.
        </p>
      )}

      <h2>User aktif (anak yang membuka & belajar)</h2>
      <div className="act">
        <ActiveCard title="Harian (DAU)" desc="Aktif hari ini." w={s.dau} registered={s.registered} />
        <ActiveCard title="Mingguan (WAU)" desc="Aktif ≥1 hari dalam 7 hari terakhir." w={s.wau} registered={s.registered} />
        <ActiveCard title="Bulanan (MAU)" desc="Aktif ≥1 hari dalam 30 hari terakhir." w={s.mau} registered={s.registered} />
      </div>
      <p className="muted" style={{ fontSize: 12 }}>
        Kelekatan (DAU ÷ MAU): <b>{pct(s.dau.users, s.mau.users)}</b>. Makin tinggi, makin banyak yang belajar tiap hari.
        Angka progres datang saat app anak sinkron (online & login).
      </p>

      <h2>User aktif per hari — 30 hari</h2>
      <DailyBars
        label="Grafik user aktif per hari"
        unit="user aktif/hari"
        points={s.daily.map((d) => ({ day: d.day, value: d.users, tip: `${d.users} user aktif, ${d.attempts} soal` }))}
      />

      <h2>User registered per hari — 30 hari</h2>
      <DailyBars
        label="Grafik user registered per hari"
        unit="daftar/hari"
        total={`${num(s.registrations.reduce((a, r) => a + r.count, 0))} daftar dalam 30 hari`}
        points={s.registrations.map((r) => ({
          day: r.day,
          value: r.count,
          tip: `${r.count} daftar${r.removed ? ` (${r.removed} kemudian dihapus)` : ''}`,
        }))}
      />
    </>
  );
}
