/** @type {import('next').NextConfig} */
const nextConfig = {
  // Dev lokal dibuka lewat 127.0.0.1 (lihat middleware.ts twinOrigin).
  allowedDevOrigins: ['127.0.0.1'],
  poweredByHeader: false,
  async headers() {
    return [
      {
        // Semua halaman (panel CS tersembunyi): jangan diindeks, jangan di-iframe,
        // jangan bocorkan URL rahasia lewat Referer ke situs lain (wa.me). BUKAN
        // 'no-referrer': itu membuat form mengirim Origin: null → server action ditolak.
        source: '/:path((?!api/).*)',
        headers: [
          { key: 'X-Robots-Tag', value: 'noindex, nofollow, noarchive' },
          { key: 'Referrer-Policy', value: 'same-origin' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Cache-Control', value: 'no-store' },
        ],
      },
    ];
  },
};

export default nextConfig;
