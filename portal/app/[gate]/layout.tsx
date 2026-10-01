import type { ReactNode } from 'react';
import { assertGate } from '@/lib/admin/gate';
import { getAdminSession } from '@/lib/admin/session';
import { logoutAction } from './actions';
import { NavLinks } from './nav';
import './ops.css';

export const dynamic = 'force-dynamic';

export default async function OpsLayout({ children, params }: { children: ReactNode; params: Promise<{ gate: string }> }) {
  const gate = await assertGate((await params).gate);
  const admin = await getAdminSession();
  return (
    <>
      {admin && (
        <header className="top">
          <div className="top-in">
            <span className="brand">InggrisinYuk Kids · CS</span>
            <NavLinks gate={gate} />
            <form action={logoutAction} className="who">
              <input type="hidden" name="gate" value={gate} />
              <span>👤 {admin.username}</span>
              <button className="ghost" type="submit">Keluar</button>
            </form>
          </div>
        </header>
      )}
      <main>{children}</main>
    </>
  );
}
