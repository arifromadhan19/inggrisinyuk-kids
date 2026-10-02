# InggrisinYuk Kids — Backend Akun Orang Tua (API-only)

**Bukan aplikasi yang dibuka langsung** (kecuali panel CS tersembunyi, lihat bawah) — ini API murni (Next.js Route Handlers + Prisma + PostgreSQL) yang dipanggil `../app/` (aplikasi anak, satu-satunya yang dibuka user) lewat `fetch()`. Tidak ada halaman/URL yang perlu dikunjungi di sini. Lihat `PRD.md` §14/§16 untuk rationale lengkap.

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
| `POST /api/checkout` | `{childName, email, phone}` | `{invoiceUrl, orderId}` — halaman Daftar app, transaksi Midtrans Snap Rp 99.000 |
| `GET /api/checkout/finalize?orderId=` | — | `{status}`; sekali saat lunas: `{status:'success', token, identifier}` |
| `POST /api/webhooks/midtrans` | notifikasi Midtrans (dicek `signature_key`) | lunas → buat akun orang tua + profil anak |

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
- `MIDTRANS_SERVER_KEY` (Production) & `MIDTRANS_IS_PRODUCTION="true"`, hapus `PAYMENT_MOCK`. Di Dashboard Midtrans (Environment Production) → Settings → Payment, isi Notification URL `https://<domain>/api/webhooks/midtrans` & Finish URL ke halaman app `/pembayaran`.

Tes lokal tanpa payment gateway: `PAYMENT_MOCK="1"` di `.env` → pembayaran di halaman Daftar dianggap langsung lunas (otomatis mati kalau `NODE_ENV=production`).

## Panel Manajemen User (CS) — URL rahasia, BUKAN `/admin`

Satu-satunya halaman di portal: ringkasan (total terdaftar, sudah/belum bayar, dihapus/refund, DAU/WAU/MAU + progres), daftar & edit user (WA/email salah → CS perbaiki), daftar "Belum Bayar" (checkout tidak lunas, tombol WA follow-up), hapus/pulihkan (soft delete, refund), dan log aktivitas tim.

- **URL** = `https://<domain-api>/<ADMIN_GATE>/` (kode di `app/[gate]/`). Path lain apa pun — termasuk `/admin` & gate yang salah — balas 404 biasa. `ADMIN_GATE` kosong/<24 karakter = panel mati.
- **Login** = username + password (bcrypt) + kode 2FA TOTP. 5x gagal/15 menit → dikunci. Sesi 8 jam, cookie `SameSite=Strict` dibatasi ke path gate, secret `ADMIN_SESSION_SECRET` terpisah dari sesi orang tua.
- **Opsional** `ADMIN_IP_ALLOWLIST` (IP kantor/VPN). Di belakang Nginx/Caddy, teruskan `X-Real-IP`.
- **Akun admin** hanya lewat CLI di server:
  ```bash
  ADMIN_PASSWORD='...' npm run admin:create -- <username> --role owner   # cetak kode 2FA
  npm run admin:create -- <username> --disable                           # cabut akses
  ```
- **Hapus user** = soft delete (`removed_at`): login & token lama langsung ditolak, progres tetap ada. Alasan *Refund* menandai transaksi `refunded` (uangnya tetap dikembalikan manual lewat Midtrans). Kalau orang yang sama bayar lagi, akun lamanya dipulihkan otomatis.
- Angka "aktif" dari `child_daily_stats` (tanggal lokal perangkat, cutoff WIB) — hanya anak yang sudah sinkron (login & online).
