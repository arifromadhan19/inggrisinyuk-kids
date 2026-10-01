'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function NavLinks({ gate }: { gate: string }) {
  const path = usePathname();
  const items = [
    { href: `/${gate}`, label: 'Ringkasan', on: path === `/${gate}` },
    { href: `/${gate}/users`, label: 'User', on: path.startsWith(`/${gate}/users`) },
    { href: `/${gate}/leads`, label: 'Belum Bayar', on: path.startsWith(`/${gate}/leads`) },
    { href: `/${gate}/audit`, label: 'Log', on: path.startsWith(`/${gate}/audit`) },
  ];
  return (
    <nav className="nav">
      {items.map((i) => (
        <Link key={i.href} href={i.href} className={i.on ? 'on' : ''}>
          {i.label}
        </Link>
      ))}
    </nav>
  );
}
