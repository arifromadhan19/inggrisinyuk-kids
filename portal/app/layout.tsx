import type { Metadata } from 'next';
import type { ReactNode } from 'react';

/** Root layout — dibutuhkan Next utk halaman. Satu-satunya halaman di
 *  portal/ adalah panel manajemen user tersembunyi (`app/[gate]/`). */
export const metadata: Metadata = {
  title: 'InggrisinYuk Kids',
  robots: { index: false, follow: false, nocache: true },
  referrer: 'same-origin',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
