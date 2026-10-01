import { redirect } from 'next/navigation';
import { assertGate } from '@/lib/admin/gate';
import { getAdminSession } from '@/lib/admin/session';
import { loginAction } from '../actions';

const ERR: Record<string, string> = {
  invalid: 'Username, password, atau kode 2FA salah.',
  locked: 'Terlalu banyak percobaan. Coba lagi 15 menit lagi.',
};

export default async function LoginPage(props: PageProps<'/[gate]/login'>) {
  const gate = await assertGate((await props.params).gate);
  if (await getAdminSession()) redirect(`/${gate}`);
  const err = (await props.searchParams).err;
  const msg = typeof err === 'string' ? ERR[err] : undefined;
  return (
    <div className="login card">
      <h1>Masuk</h1>
      <p className="sub">Panel tim InggrisinYuk Kids</p>
      {msg && <div className="flash bad">{msg}</div>}
      <form action={loginAction}>
        <input type="hidden" name="gate" value={gate} />
        <label htmlFor="u">Username</label>
        <input id="u" name="username" autoComplete="username" required autoCapitalize="none" />
        <label htmlFor="p">Password</label>
        <input id="p" name="password" type="password" autoComplete="current-password" required />
        <label htmlFor="c">Kode 2FA (6 digit dari app authenticator)</label>
        <input id="c" name="code" inputMode="numeric" autoComplete="one-time-code" maxLength={6} pattern="[0-9]*" />
        <button type="submit" className="mt" style={{ width: '100%' }}>
          Masuk
        </button>
      </form>
    </div>
  );
}
