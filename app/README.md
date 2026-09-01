# InggrisinYuk Kids — App (TypeScript)

Port TypeScript dari prototipe [`alur-modul-belajar-prototype.html`](../alur-modul-belajar-prototype.html) — logic dan konten sama persis, cuma ditulis type-safe dan dipecah per modul, lalu dibundel jadi 1 file JS statis.

Tetap **client-side murni, tanpa backend/database** (lihat `PRD.md` §5) — cuma nambah 1 langkah build kecil (TypeScript → JS) dibanding prototipe HTML yang bisa langsung dibuka di browser.

## Struktur

```
src/
  types.ts            bentuk data (VocabItem, Topic, AppState, dst)
  speech-types.d.ts    deklarasi minimal Web Speech API (belum ada di lib.dom TypeScript)
  speech.ts            TTS/STT (speechSynthesis + SpeechRecognition)
  content.ts           data topik per submodul (Vocabulary/Listening/Speaking/Grammar)
  interaction.ts       delegasi klik (data-action/data-payload) ke handler aktif
  util.ts              helper kecil (shuffle, qs)
  icons.ts             ikon SVG inline untuk chrome app (navigasi, kembali, centang)
  scenery.ts           dekorasi SVG inline: siluet bukit, awan & jejak Peta Level
  progress.ts          progres di localStorage: modul selesai + materi terakhir dibuka
  voice-panel.ts       panel kecepatan/suara TTS (dipakai di Pengaturan & layar aktivitas)
  app.ts               router/shell: Beranda → Belajar (Daftar Materi → Kenalan/Latihan Inti/Tantangan) → Pengaturan
  games/
    vocabulary.ts      Tebak & Cocokkan, Eja Kata, Contoh Penggunaan
    listening.ts       Dengar & Pilih, Dengar Cerita Mini
    speaking.ts        Ucapkan & Cek, Mini-Roleplay
    grammar.ts         Susun Kalimat, Bikin Sendiri
  main.ts              entry point
public/
  index.html           shell HTML (rail nav, tab bar, mount #crumb/#root), memuat styles.css + bundle.js
  styles.css           design token (warna, tipografi, spasi) + semua komponen UI
  bundle.js            hasil build (di-gitignore, jangan diedit manual)
```

`public/` sengaja jadi 1 folder self-contained (index.html + styles.css + bundle.js) — supaya gampang di-deploy: tinggal upload isi folder ini apa adanya, tidak perlu ikut `src/`, `node_modules/`, atau `package.json`.

## Layout & navigasi

Satu shell dipakai untuk semua layar, dengan 3 tujuan navigasi yang semuanya benar-benar ada:
**Beranda** (lanjutkan belajar, level, bintang), **Belajar** (4 skill → daftar materi → alur 3 langkah),
dan **Pengaturan** (suara/kecepatan TTS, progres, catatan untuk orang tua).

| Lebar layar | Navigasi | Konten |
|---|---|---|
| `< 768px` | tab bar bawah (fixed, ikut safe-area) | 1 kolom, panel suara turun ke bawah panggung game |
| `768–1079px` | rail ikon ringkas (92px) | 1 kolom lebih lebar, kartu jadi 2–4 kolom |
| `≥ 1080px` | rail penuh (252px) + wordmark | 2 kolom: konten utama + kolom pendamping (level/bintang, cara main, stepper aktivitas) |

Token warna & tipografi terkumpul di `:root` `public/styles.css` — warna merek teal "lagoon" + aksen mango
di atas tanah pasir hangat (`--paper`), warna per-skill hanya dipakai di dalam konteks skill-nya lewat
`--accent`/`--accent-bg`, dan warna "tanah" `--t1..--t6` hanya hidup di Peta Level.

**Peta Level** (`renderLevels` di `app.ts` + `scenery.ts`) digambar sebagai satu papan peta: 6 perhentian
bertumpuk, masing-masing punya warna tanah & siluet bukitnya sendiri, dijahit jejak titik-titik yang
berkelok. Medali memakai emoji level, stempel mango = Bos sudah ditaklukkan, gembok = masih tersegel, dan
singa 🦁 menandai perhentian anak sekarang. Status buka/kunci tetap dihitung `progress.ts` — tampilannya
saja yang berubah.

## Menjalankan (development, di localhost)

```bash
npm install     # sekali saja
npm run dev     # bundle (esbuild watch) + serve di http://127.0.0.1:8200, auto-rebuild tiap perubahan
```

Buka **http://127.0.0.1:8200** di browser (bukan buka file `index.html` langsung). Ini penting khusus untuk fitur mikrofon (Speaking) — Chrome cuma nyimpen izin mikrofon secara permanen untuk origin `http://`/`https://` (termasuk localhost), sedangkan untuk `file://` izinnya sering kebersihkan lagi tiap reload sehingga terus-terusan minta izin ulang. Biarkan `npm run dev` tetap berjalan di terminal selama development; berhenti dengan `Ctrl+C`.

`npm run dev` sekarang menjalankan `dev-server.mjs` (esbuild JS API + proxy kecil), bukan langsung CLI `esbuild --servedir` — supaya ada **SPA fallback**: URL layar (`/belajar`, `/pengaturan`, dst — lihat bagian "URL routing" di `app.ts`) bukan file asli, jadi request ke path itu perlu diarahkan balik ke `index.html` supaya router client-side yang render layarnya. Tanpa ini, reload langsung di `/belajar` akan 404 di localhost juga.

## Build untuk produksi / deploy

```bash
npm run build   # type-check (tsc) lalu bundle+minify (esbuild) -> public/bundle.js
```

Setelah ini, folder `public/` sudah lengkap dan siap dipindah ke server mana pun sebagai situs statis.

## Deploy ke VPS

Karena hasilnya cuma file statis (HTML + 1 file JS, tanpa proses Node yang perlu terus nyala), ini **lebih simpel dibanding `inggrisinyuk-app`** yang butuh `next start` + process manager (PM2) + reverse proxy ke port tertentu. Di sini cukup:

1. Build di lokal: `npm run build`
2. Upload folder `public/` ke VPS, misal:
   ```bash
   scp -r public/ user@vps-host:/var/www/inggrisinyuk-kids/
   ```
   (atau `git pull` + `npm install && npm run build` langsung di VPS kalau Node tersedia di sana)
3. Arahkan web server yang sudah ada di VPS (kemungkinan besar nginx, karena dipakai juga untuk `inggrisinyuk-app`) ke folder itu sebagai static root — cukup tambah 1 `server`/`location` block baru, contoh:
   ```nginx
   server {
       listen 80;
       server_name kids.namadomainmu.com;
       root /var/www/inggrisinyuk-kids/public;
       index index.html;
       # SPA fallback WAJIB — app.ts pakai History API routing (URL beneran
       # berubah tiap layar, mis. /belajar, /pengaturan, bukan hash #/...).
       # Tanpa fallback ke index.html ini, reload langsung di path seperti
       # /belajar akan 404 karena file itu memang tidak ada.
       location / { try_files $uri $uri/ /index.html; }
   }
   ```
   lalu `sudo nginx -t && sudo systemctl reload nginx`.
4. Kalau mau HTTPS, tinggal `certbot --nginx -d kids.namadomainmu.com` seperti biasa.

Tidak ada langkah "jalankan app-nya" di server — begitu file ter-upload dan nginx diarahkan, sudah langsung bisa diakses. Tidak ada database/env var/proses background yang perlu dikelola.

## Kenapa TypeScript ringan, bukan Next.js seperti `inggrisinyuk-app`

Keputusan sadar, bukan keterbatasan — lihat `PRD.md` §5 dan `RESEARCH.md` §8: versi anak sengaja tidak meniru arsitektur Next.js/Prisma/Postgres dari `inggrisinyuk-app` (sibling project dewasa) karena scope v1 masih kecil (3 level MVP, 4 submodul) dan sengaja tanpa backend. TypeScript dipakai untuk type-safety di logic yang sudah lumayan kompleks (banyak bentuk data & state game), tapi tetap dibundel jadi output statis — tanpa framework, tanpa server proses yang perlu dikelola, dan deploy-nya jauh lebih sederhana.
