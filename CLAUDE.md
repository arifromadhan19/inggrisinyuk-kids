# CLAUDE.md

Panduan kerja untuk Claude Code di repo ini. Konteks produk lengkap ada di [PRD.md](PRD.md) (keputusan final) dan [RESEARCH.md](RESEARCH.md) (riset & rationale di baliknya) — baca dulu sebelum mengerjakan task apa pun di repo ini.

## 🔒 Aturan Wajib: Semua Referensi Difilter Lewat Lensa Kid-Friendly

Project ini ("InggrisinYuk Kids") sering mengambil inspirasi dari referensi yang **tidak dibuat untuk anak** — kompetitor, game dewasa (mis. konsep "Anglora" di `inggrisinyuk/prd_user_game.md` & `architecture_game.md`, audiens 15+), pola app ESL dewasa (`inggrisinyuk-app`), dst. **Setiap kali mengadaptasi konsep dari referensi semacam itu, filter berikut wajib diterapkan di SEMUA dimensi, bukan cuma salah satu:**

1. **Desain visual** — hangat, playful, tidak menakutkan. Hindari nuansa gelap/intens, elemen pertarungan yang berat, atau horor sekalipun implisit.
2. **Kata-kata/copy** — sederhana, hangat, sesuai usia. Hindari bahasa klinis/evaluatif ("gagal", "salah", skor sebagai hukuman). Kalau ada framing game (mis. "boss"/"raja"), nadanya ringan ala Mario/Pokémon — seru, bukan menegangkan.
3. **Alur cerita/narasi** — tidak berbasis rasa takut (referensi dewasa boleh punya tema gelap/psikologis — itu terlalu berat untuk anak). Framing petualangan/RPG boleh dipakai, tapi harus merayakan progres, bukan menekan.
4. **Alur/flow interaksi** — retry non-punitive, tanpa timer/status gagal, target tap besar, label dibacakan TTS untuk yang belum bisa baca, tidak ada layar dead-end yang menakutkan.

**Prinsip inti**: mengambil *struktur/mekanik* dari referensi itu boleh dan berguna (tidak perlu reinvent semua dari nol), tapi *substansinya* (nada, bahasa, visual, tingkat stres) harus selalu dites ulang: "apakah ini masuk akal untuk anak usia 5–13 tahun?" — bukan diasumsikan otomatis cocok karena polanya terbukti di produk lain. Contoh penerapan nyata: PRD.md §12.

Aturan yang sama berlaku persis di PRD.md — dua dokumen ini harus tetap sinkron soal ini kalau salah satunya diupdate.

## Keputusan lain yang sudah dikunci (jangan diubah tanpa alasan baru)

- **Tanpa backend, database, auth, atau AI API di v1** — client-side murni (PRD §5). Kalau nanti ada logic backend, wajib TypeScript.
- **Tanpa coin/mata uang, tanpa leaderboard, tanpa antrian review yang diekspos ke anak** — reward pakai bintang/stiker, non-punitive (PRD §4.6).
- Struktur kode: `app/` adalah aplikasi TypeScript utama (lihat [app/README.md](app/README.md) untuk cara build/run/deploy). File HTML lepas di root repo adalah prototipe cepat, bukan sumber kebenaran produksi.
- **Deploy pakai VPS murah** — target spesifikasi kelas 2 core / 4GB RAM (bukan platform serverless/managed mahal). Pertimbangkan ini saat menyarankan arsitektur, teknologi, atau dependency baru — hindari yang butuh resource besar atau layanan cloud mahal secara default.
