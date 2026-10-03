# Deploy ke VPS — InggrisinYuk Kids

Panduan untuk VPS Ubuntu 24.04 (contoh: Biznet Gio NEO Lite 2 vCPU / 4 GB / 60 GB).
Tanpa Docker: **nginx** menyajikan app anak (file statis) dan meneruskan
`/api/` + panel admin ke **portal** (Next.js, dijalankan systemd), datanya di
**PostgreSQL** di server yang sama.

```
Internet ──HTTPS──> nginx ─┬─ /                 app/public (statis, SPA)
                           ├─ /api/             ┐
                           ├─ /<ADMIN_GATE>/    ├─> portal 127.0.0.1:3000 ──> PostgreSQL (localhost)
                           └─ /_next/           ┘
```

Alamat production: **https://inggrisinyuk.com** (domain di Hostinger;
`www.inggrisinyuk.com` otomatis dialihkan ke sini). Perintah di bawah dijalankan di VPS; ganti `IP_VPS` dengan IP publik VPS
(Biznet Gio → server → tab *Network and Security*).

---

## 0. Persiapan (sekali)

1. **DNS di Hostinger** — hPanel → Domains → `inggrisinyuk.com` → DNS / Nameservers →
   DNS Records:

   | Type | Name | Points to | TTL | Aksi |
   |---|---|---|---|---|
   | A | `@` | `IP_VPS` | 300 | **ubah** (sekarang `2.57.91.91` = halaman parkir Hostinger) |
   | CNAME | `www` | `inggrisinyuk.com` | — | biarkan |

   Pastikan tidak ada record **AAAA** untuk `@`/`www` (saat ini tidak ada), dan tidak ada
   A record `@` kedua yang masih ke `2.57.91.91`.
   Cek dari laptop (5–30 menit): `dig +short inggrisinyuk.com` dan `dig +short www.inggrisinyuk.com`
   → keduanya keluar `IP_VPS`.
   Sambil menunggu, kerjakan langkah 1–6. Aktifkan juga **auto-renew** domain
   (berlaku s/d 22 Juni 2027).
2. **Biznet Gio → Security Group** — izinkan masuk (inbound) TCP **22, 80, 443** saja.
3. **Midtrans** — siapkan Server Key **Sandbox** dulu (Dashboard Midtrans → Environment Sandbox → Settings → Access Keys).

## 1. Masuk & amankan server

```bash
ssh root@IP_VPS            # atau user bawaan Biznet, lalu sudo -i

apt update && apt upgrade -y
adduser deploy             # user untuk menjalankan app (bukan root)
usermod -aG sudo deploy
rsync -a ~/.ssh /home/deploy/ && chown -R deploy:deploy /home/deploy/.ssh   # pakai SSH key yang sama

ufw allow OpenSSH && ufw --force enable    # port 80/443 dibuka di langkah 2
systemctl enable ufw                        # image Biznet: service ufw mati -> firewall hilang setelah reboot
apt install -y unattended-upgrades                                  # update keamanan otomatis
```

Mulai dari sini login sebagai `deploy`: `ssh deploy@IP_VPS`.

## 2. Pasang software

```bash
# Node.js 22 LTS
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs git nginx postgresql certbot python3-certbot-nginx
node -v    # v22.x
sudo ufw allow 'Nginx Full'
```

Opsional (disarankan): swap 2 GB supaya `next build` tidak kehabisan RAM.

```bash
sudo fallocate -l 2G /swapfile && sudo chmod 600 /swapfile && sudo mkswap /swapfile && sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

## 3. Database

```bash
DBPASS=$(openssl rand -hex 24); echo "Simpan password DB ini: $DBPASS"
sudo -u postgres psql -c "CREATE USER inggrisinyuk WITH PASSWORD '$DBPASS';"
sudo -u postgres psql -c "CREATE DATABASE inggrisinyuk_kids_portal OWNER inggrisinyuk;"
```

Postgres Ubuntu default hanya mendengarkan `localhost` — **jangan** dibuka ke internet.

## 4. Ambil kode

```bash
sudo mkdir -p /srv/inggrisinyuk-kids /srv/backups && sudo chown -R deploy:deploy /srv/inggrisinyuk-kids /srv/backups
git clone https://github.com/arifromadhan19/inggrisinyuk-kids.git /srv/inggrisinyuk-kids
```

> Repo **private**? Buat deploy key: `ssh-keygen -t ed25519 -f ~/.ssh/github_deploy -N ""`,
> tempel isi `~/.ssh/github_deploy.pub` di GitHub → repo → Settings → Deploy keys (read-only),
> lalu clone pakai `GIT_SSH_COMMAND="ssh -i ~/.ssh/github_deploy" git clone git@github.com:arifromadhan19/inggrisinyuk-kids.git /srv/inggrisinyuk-kids`.

## 5. Isi `portal/.env` (rahasia production)

```bash
cd /srv/inggrisinyuk-kids/portal
cp .env.example .env && chmod 600 .env
nano .env
```

| Variabel | Nilai production |
|---|---|
| `DATABASE_URL` | `postgresql://inggrisinyuk:PASSWORD_DB@localhost:5432/inggrisinyuk_kids_portal?sslmode=disable` |
| `SESSION_SECRET` | hasil `openssl rand -base64 32` |
| `APP_ORIGIN` | `https://inggrisinyuk.com` |
| `MIDTRANS_SERVER_KEY` | Server Key Midtrans (`SB-Mid-server-…` Sandbox dulu, lalu Production `Mid-server-…`) |
| `MIDTRANS_IS_PRODUCTION` | `"false"` (Sandbox) → `"true"` setelah akun Production aktif |
| `PAYMENT_MOCK` | **hapus baris ini** (jangan ada di production) |
| `ADMIN_GATE` | hasil `openssl rand -hex 16` (URL panel CS, rahasiakan) |
| `ADMIN_SESSION_SECRET` | hasil `openssl rand -base64 48` (beda dari SESSION_SECRET) |
| `ADMIN_IP_ALLOWLIST` | opsional, IP kantor/VPN CS |

**Jangan** jalankan `npm run db:seed` di production (itu akun tes "123"/"124").

## 6. Build pertama

```bash
cd /srv/inggrisinyuk-kids
echo 'deploy ALL=(root) NOPASSWD: /usr/bin/systemctl restart inggrisinyuk-kids-portal' | sudo tee /etc/sudoers.d/inggrisinyuk-kids
sudo cp deploy/inggrisinyuk-kids-portal.service /etc/systemd/system/
sudo systemctl daemon-reload && sudo systemctl enable inggrisinyuk-kids-portal
./deploy/deploy.sh main          # build app + portal, migrasi DB, nyalakan portal
curl -s http://127.0.0.1:3000/api/me     # {"error":"Belum login."} = portal hidup
```

## 7. nginx

```bash
DOMAIN=inggrisinyuk.com
cd /srv/inggrisinyuk-kids
sudo cp deploy/nginx-proxy-snippet.conf /etc/nginx/snippets/inggrisinyuk-proxy.conf
sudo cp deploy/nginx.conf /etc/nginx/sites-available/inggrisinyuk-kids
GATE=$(grep '^ADMIN_GATE=' portal/.env | cut -d= -f2- | tr -d '"')
sudo sed -i "s/DOMAINMU/$DOMAIN/g; s/GANTI_ADMIN_GATE/$GATE/" /etc/nginx/sites-available/inggrisinyuk-kids
sudo ln -s /etc/nginx/sites-available/inggrisinyuk-kids /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx
```

Folder `/srv/inggrisinyuk-kids` harus bisa dibaca nginx: `chmod 755 /srv/inggrisinyuk-kids`.

## 8. HTTPS (wajib — mic Speaking hanya jalan di HTTPS)

Jalankan setelah `dig +short inggrisinyuk.com` **dan** `dig +short www.inggrisinyuk.com` sudah menampilkan IP VPS.

```bash
sudo certbot --nginx -d inggrisinyuk.com -d www.inggrisinyuk.com --redirect -m EMAIL_KAMU --agree-tos -n   # ganti EMAIL_KAMU
```

Sertifikat diperpanjang otomatis oleh certbot.

## 9. Midtrans

1. Dashboard Midtrans → Environment **Sandbox** → Settings → Payment (Notification URL):
   - **Payment Notification URL**: `https://inggrisinyuk.com/api/webhooks/midtrans`
   - **Finish Redirect URL**: `https://inggrisinyuk.com/pembayaran`
2. Coba beli lewat `https://inggrisinyuk.com/daftar` dengan **Server Key Sandbox**, bayar pakai
   https://simulator.sandbox.midtrans.com. Berhasil = setelah bayar diarahkan ke `/pembayaran`,
   lalu otomatis masuk ke Placement Test.
3. Aktivasi akun Production (Business registration di dashboard, isi website `https://inggrisinyuk.com`).
   Setelah disetujui: isi URL yang sama di Environment **Production**, ganti `MIDTRANS_SERVER_KEY`
   ke key Production & `MIDTRANS_IS_PRODUCTION="true"`, lalu `sudo systemctl restart inggrisinyuk-kids-portal`.

## 10. Backup database harian

```bash
echo "localhost:5432:inggrisinyuk_kids_portal:inggrisinyuk:PASSWORD_DB" > ~/.pgpass && chmod 600 ~/.pgpass
crontab -e
# tambahkan baris:
30 2 * * * /srv/inggrisinyuk-kids/deploy/backup-db.sh
```

Backup tersimpan di `/srv/backups/db` (14 hari). Salin juga ke luar VPS secara berkala
(mis. Biznet Snapshot / Object Storage, atau `scp` ke laptop).

## 11. Cek akhir

- [ ] `https://inggrisinyuk.com` → homepage tampil, gembok HTTPS aktif
- [ ] Reload di `https://inggrisinyuk.com/daftar` tidak 404
- [ ] `https://www.inggrisinyuk.com` pindah otomatis ke `https://inggrisinyuk.com`
- [ ] Daftar → bayar (Test) → otomatis masuk
- [ ] Logout → Masuk pakai no WA (format `08…`) berhasil
- [ ] Speaking: mic minta izin & merekam
- [ ] Panel CS: `https://inggrisinyuk.com/<ADMIN_GATE>/login`

---

## Update rutin (setelah ada perubahan di GitHub)

```bash
ssh deploy@IP_VPS
/srv/inggrisinyuk-kids/deploy/deploy.sh main
```

## Kalau ada masalah

| Gejala | Cek |
|---|---|
| Login/Daftar "Server akun tidak bisa dihubungi" | `systemctl status inggrisinyuk-kids-portal`, `journalctl -u inggrisinyuk-kids-portal -n 100` |
| 502 Bad Gateway | portal mati → perintah di atas |
| Halaman putih / file tidak update | `sudo tail -50 /var/log/nginx/error.log`, lalu hard reload browser |
| Bayar sukses tapi tidak masuk | Dashboard Midtrans → Transaction → detail → riwayat notifikasi; Notification URL & Server Key (Sandbox vs Production) cocok? |
| Build gagal kehabisan memori | pastikan swap aktif (`free -h`) |

## Catatan

### Deploy masih manual (belum otomatis)

Push ke `main` di GitHub **tidak** otomatis meng-update VPS. Website baru berubah
setelah perintah ini dijalankan (dari laptop yang SSH key-nya sudah terdaftar):

```bash
ssh deploy@139.190.100.39 '/srv/inggrisinyuk-kids/deploy/deploy.sh main'
```

Isinya: tarik `main` terbaru → build app & portal → migrasi database → restart portal.

### Kalau nanti mau deploy otomatis tiap push ke `main`

Cara yang disarankan: **GitHub Actions** yang masuk ke VPS lewat SSH lalu menjalankan
`deploy.sh` yang sama. Hasil berhasil/gagal terlihat di tab **Actions** GitHub
(+ email kalau gagal). Yang perlu disiapkan:

1. **SSH key khusus GitHub** — dibuat baru khusus deploy (bukan key laptop), public key-nya
   didaftarkan ke `/home/deploy/.ssh/authorized_keys` di VPS.
2. **GitHub Secrets** — private key tadi disimpan di repo → Settings → Secrets → Actions
   (jangan pernah di-commit).
3. **File `.github/workflows/deploy.yml`** — dipicu `push` ke `main`, menjalankan
   `ssh deploy@139.190.100.39 '/srv/inggrisinyuk-kids/deploy/deploy.sh main'`.

Pertimbangan sebelum mengaktifkan:

- **Tiap push ke `main` langsung tayang ke pengguna** — bug ikut tayang. Cocok dipasangkan
  dengan proteksi `main`: perubahan lewat Pull Request dulu, deploy jalan setelah PR di-merge.
- **Jeda singkat saat build portal** (±1 menit): login, daftar, & sinkron progres bisa gagal
  sesaat; halaman app anak tetap tampil. Berlaku juga untuk deploy manual sekarang.
  Perbaikan yang bisa dilakukan: build dulu di folder terpisah lalu ditukar (tanpa jeda).
- **Build gagal bisa ikut menghentikan portal lama.** Perbaikan yang bisa dilakukan:
  `deploy.sh` hanya restart portal kalau build berhasil.
