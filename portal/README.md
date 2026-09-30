# InggrisinYuk Kids — Backend Akun Orang Tua (API-only)

**Bukan aplikasi yang dibuka langsung** — ini API murni (Next.js Route Handlers + Prisma + PostgreSQL) yang dipanggil `../app/` (aplikasi anak, satu-satunya yang dibuka user) lewat `fetch()`. Tidak ada halaman/URL yang perlu dikunjungi di sini. Lihat `PRD.md` §14/§16 untuk rationale lengkap.

`app/` murni statis (esbuild, tanpa server) dan tidak bisa menjalankan Postgres/Prisma sendiri — makanya proses backend ini tetap harus ada & terus jalan, tapi sepenuhnya di belakang layar.

## Kenapa token, bukan cookie

`app/` dan backend ini jalan di origin berbeda (port beda saat dev, kemungkinan domain beda saat production). Cookie session lintas-origin butuh `SameSite=None; Secure` yang gampang bermasalah beda browser/HTTP vs HTTPS. Solusinya: login/registrasi mengembalikan **token** di response body, `app/` simpan di `localStorage`-nya sendiri, lalu kirim balik lewat header `Authorization: Bearer <token>` di tiap panggilan API berikutnya.

## Endpoint

| Endpoint | Body | Balikan |
|---|---|---|
| `POST /api/auth/register` | `{phone?, email?, password}` | `{ok, token, identifier}` |
| `POST /api/auth/login` | `{identifier, password}` | `{ok, token, identifier}` |
| `POST /api/auth/logout` | — | `{ok}` (client cukup hapus token lokal, ini formalitas) |
| `GET /api/me` | header `Authorization: Bearer <token>` | `{parent, child}` |
| `POST /api/placement-test` | `{answers}` atau `{skip:true}` | `{ok, levelRecommended, correctByLevel, totalCorrect}` |
| `POST /api/checkout` | `{childName, email, phone}` | `{invoiceUrl, orderId}` — halaman Daftar app, invoice Xendit Rp 99.000 |
| `GET /api/checkout/finalize?orderId=` | — | `{status}`; sekali saat lunas: `{status:'success', token, identifier}` |
| `POST /api/webhooks/xendit` | callback Xendit (header `x-callback-token`) | lunas → buat akun orang tua + profil anak |

## Menjalankan (development)

```bash
npm install
cp .env.example .env      # isi DATABASE_URL, SESSION_SECRET, APP_ORIGIN
npx prisma migrate dev
npm run db:seed            # akun tes: no HP "123", password "111"
npm run dev                 # http://localhost:3000 (cuma API, tidak ada UI)
```

`app/` (npm run dev di folder lain, port 8000) yang manggil API ini — lihat `app/src/account.ts`.

## Yang perlu diisi sebelum production

- `SESSION_SECRET` asli.
- `DATABASE_URL` ke Postgres production.
- `APP_ORIGIN` ke domain `app/` yang sebenarnya (buat CORS & URL balik dari halaman bayar).
- `XENDIT_SECRET_KEY` (Live) & `XENDIT_WEBHOOK_TOKEN`, hapus `XENDIT_MOCK`. Di Dashboard Xendit, arahkan webhook "Invoice paid" ke `https://<domain>/api/webhooks/xendit`.

Tes lokal tanpa akun Xendit: `XENDIT_MOCK="1"` di `.env` → pembayaran di halaman Daftar dianggap langsung lunas (otomatis mati kalau `NODE_ENV=production`).
