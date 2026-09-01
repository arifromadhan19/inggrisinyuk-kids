// Dev server dengan SPA fallback — dibutuhkan sejak app.ts pakai History API
// routing beneran (bukan hash, lihat app.ts bagian "URL routing"): reload
// langsung di path seperti /belajar tidak punya file aslinya, jadi harus
// diarahkan balik ke index.html supaya router client-side yang urus. Esbuild
// CLI (`--servedir`) tidak punya opsi fallback ini secara built-in — jadi di
// sini dipakai esbuild JS API + proxy http kecil di depannya. Pola resminya
// esbuild sendiri utk "single-page app", bukan trik custom.
import * as esbuild from 'esbuild';
import http from 'node:http';

const HOST = '127.0.0.1';
const PORT = 8200;
// Port internal esbuild HARUS beda dari PORT publik di atas & host-nya
// eksplisit '127.0.0.1' — tanpa host/port eksplisit, esbuild default ke
// host '0.0.0.0' (target connect yang tidak reliable dari proxy) DAN port
// 8000 juga (bentrok langsung sama server publik kita) — inilah penyebab
// asli EMFILE/hang yang sempat muncul, bukan cuma soal keepAlive.
const INTERNAL_PORT = 8100;

const ctx = await esbuild.context({
  entryPoints: ['src/main.ts'],
  bundle: true,
  outfile: 'public/bundle.js',
  format: 'iife',
  target: 'es2019',
});

await ctx.watch();
const { host, port } = await ctx.serve({ servedir: 'public', host: '127.0.0.1', port: INTERNAL_PORT });

// keepAlive: satu koneksi dipakai ulang lintas request, bukan buka socket
// baru tiap kali proxy ke server internal esbuild — tanpa ini gampang
// kehabisan file descriptor (EMFILE) di sesi dev yang lama/banyak reload.
const internalAgent = new http.Agent({ keepAlive: true, maxSockets: 32 });

function respondError(res, err) {
  console.error('[dev-server] proxy error:', err.message);
  if (res.headersSent) return res.end();
  res.writeHead(502, { 'Content-Type': 'text/plain' });
  res.end('Dev server sedang bermasalah menghubungi esbuild internal — coba reload.');
}

const server = http.createServer((req, res) => {
  const forward = { hostname: host, port, path: req.url, method: req.method, headers: req.headers, agent: internalAgent };
  const proxyReq = http.request(forward, (proxyRes) => {
    if (proxyRes.statusCode === 404) {
      // Path SPA tanpa file asli (mis. /belajar) -> index.html, router
      // client-side yang render layar yang benar dari location.pathname.
      proxyRes.resume(); // buang body 404 supaya socket-nya bisa dipakai ulang (keepAlive)
      const fallbackReq = http.request({ ...forward, path: '/index.html' }, (fallbackRes) => {
        res.writeHead(fallbackRes.statusCode ?? 200, fallbackRes.headers);
        fallbackRes.pipe(res, { end: true });
      });
      fallbackReq.on('error', (err) => respondError(res, err));
      fallbackReq.end();
      return;
    }
    res.writeHead(proxyRes.statusCode ?? 200, proxyRes.headers);
    proxyRes.pipe(res, { end: true });
  });
  // WAJIB — tanpa listener ini, error transient (mis. EMFILE, ECONNRESET)
  // jadi unhandled 'error' event dan mematikan seluruh proses Node.
  proxyReq.on('error', (err) => respondError(res, err));
  req.pipe(proxyReq, { end: true });
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`[dev-server] Port ${PORT} sudah dipakai proses lain — matikan dulu prosesnya, atau cek 'lsof -ti:${PORT}'.`);
    process.exit(1);
  }
  console.error('[dev-server] server error:', err);
});

server.listen(PORT, HOST, () => {
  console.log(`Dev server: http://${HOST}:${PORT} (auto-rebuild + SPA fallback aktif)`);
});
