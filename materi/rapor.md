# Rapor — Nilai, Formula, dan Tampilan untuk Orang Tua

Permintaan user (2026-09-30): audit halaman Rapor (UI, nilai yang ditampilkan, formula), riset ke Cambridge, LIA, EF, dan lembaga/aplikasi lain, lalu sesuaikan ke app ini. Termasuk 2 screenshot Rapor kompetitor sebagai referensi.

Status: **§4 sudah diimplementasikan 2026-09-30.** §5 = daftar rekomendasi awal. **§6 = analisis ulang & rekomendasi akhir** (menggantikan urutan prioritas §5). **Fase 1 (§6.5), Fase 2 (§6.6) & Fase 3 (§6.7) selesai 2026-09-30.** Email laporan mingguan **dibatalkan** (keputusan user 2026-09-30: semua laporan cukup di dalam aplikasi).

Kode terkait: `app/src/app.ts` (`renderRapor`, `renderRaporDetail`, `buildProgressPanel`, `startActiveTimer`), `app/src/progress.ts` (`computeInsights`, `getActiveDaysInLast`, `getWeekMinutes`, `getAvgDailyMinutes`).

---

## 1. Ringkasan

1. **Rumus lama banyak yang tidak mengukur hal yang disebutnya.** Contoh: "Skor Tiap Skill" ternyata jumlah materi selesai, bukan kemampuan. Lalu "Modul tuntas" di Menu Belajar bisa lewat 100%. Rinciannya di §2.
2. **Pola umum lembaga & aplikasi anak** (§3):
   - Nilai kemampuan per skill (Cambridge: 1–5 perisai).
   - Kekuatan + hal yang perlu ditingkatkan (Cambridge, Kurikulum Merdeka).
   - Kehadiran & latihan selesai (EF).
   - Waktu & ketepatan (Kumon).
   - Laporan mingguan waktu belajar & kata dipelajari (Lingokids, Khan Academy Kids).
3. **Yang sudah diterapkan** (§4):
   - Bintang skill jadi ukuran kemampuan.
   - Soal mic dikeluarkan dari hitungan "meleset".
   - "Kata dikuasai" pakai jawaban terakhir.
   - Hitungan modul tuntas disatukan.
   - Hari aktif pakai jendela 30 hari.
   - Kartu baru: ringkasan untuk orang tua, Progres per Level, waktu belajar, game dimainkan, rasio pakai Petunjuk, dan Detail Rapor (aturan nilai + cara data dicatat).
4. **Rekomendasi akhir** (§6): **bukan revamp total.** Data & rumus sudah benar. Yang perlu dirombak adalah **susunan halaman**: sekarang terlalu panjang (±5,5 layar HP), banyak angka tampil 2–3 kali, dan urutannya tidak menjawab pertanyaan orang tua. Kerjakan 3 fase: susun ulang halaman → lengkapi rumus → sinkron server & laporan mingguan.

---

## 2. Audit Rapor Sebelum Perbaikan

| # | Nilai | Rumus lama | Masalah |
|---|---|---|---|
| 1 | Bintang "Skor Tiap Skill" | modul tuntas ÷ total modul skill di level ini | Namanya "skor", isinya kelengkapan. Anak yang menyelesaikan 10 modul dengan banyak salah tetap 5 bintang. |
| 2 | Misi Berikutnya, Kekuatan, Kata yang Masih Dilatih | wrong-rate semua soal ber-`SlotState.n` | Soal mic (Speaking, Vocab "🗣️ Penggunaan") ikut dihitung. Ucapan yang tidak tertangkap sempurna oleh ASR terbaca "meleset". Ini bertentangan dengan Ketepatan yang sejak awal tidak menghitung mic. Fallback tanpa mic yang ditandai tepat juga bisa membuat Speaking salah masuk "Kekuatan". |
| 3 | Kata dikuasai | kata Vocab yang pernah tepat 1x (`ok`) | Terlalu longgar. Sekali kebetulan tepat lalu berkali-kali meleset tetap "dikuasai". |
| 4 | Modul tuntas (Rapor) & progres Menu Belajar | `doneCount()` (semua level) ÷ total modul 1 level | Menu Belajar bisa > 100%. Beda sumber dengan progres level (`topicFinished`). |
| 5 | Hari aktif | jumlah `activeDays` | `activeDays` cuma menyimpan 60 hari, jadi total "sepanjang waktu" diam-diam berhenti di 60. |
| 6 | Durasi belajar | — | Tidak dicatat sama sekali. |
| 7 | Tampilan | — | Kartu Skill: bintang menutupi teks di HP. Tidak ada ringkasan 1 kalimat untuk orang tua. |

Yang sudah benar dan dipertahankan:
- XP cuma naik.
- Hari beruntun punya 1 hari pelindung.
- Misi Berikutnya baru muncul setelah ≥ 3 jawaban. Ini lebih baik dari kompetitor yang menampilkan topik 0% (belum dicoba) sebagai "perlu diperkuat".
- Papan peringkat dianonimkan.
- Kata "salah/gagal" tidak dipakai.

---

## 3. Riset Lembaga & Aplikasi

### 3.1 Cambridge Young Learners (Starters, Movers, Flyers)
- Tiap skill (Listening, Reading & Writing, Speaking) dapat **1–5 perisai** dari **seberapa tepat jawaban**.
- Tidak ada lulus/gagal.
- Statement of Results memuat kekuatan, hal yang bisa ditingkatkan, dan ide cara meningkatkannya.
- **4–5 perisai di setiap skill = siap ke jenjang berikutnya.**
- Relevansi: dasar bintang skill = kemampuan, dan dasar kartu Kekuatan/Misi.

### 3.2 EF English First (Kids & Teens, termasuk Indonesia)
- Aplikasi EF Parents menampilkan materi di kelas, PR, **kehadiran**, latihan yang diselesaikan, nilai tes, dan feedback guru.
- Relevansi: "Hari aktif", "Modul tuntas", "Soal dijawab". Tidak ada guru di app ini, jadi feedback guru diganti Ringkasan untuk Orang Tua + Misi Berikutnya yang dihitung otomatis.

### 3.3 LIA
- Tidak ditemukan format rapor/nilai yang dipublikasikan. Laman publik hanya menjelaskan program per usia.
- Karena itu **tidak dipakai sebagai acuan rumus**. Riset `test_level.md` §3 mencatat syarat kehadiran LIA GEYL (maks 8x absen) dan promotion test tiap term.

### 3.4 Kumon
- Laporan memuat worksheet selesai, **waktu pengerjaan** (dibanding Standard Completion Time, diberi warna) dan **ketepatan**.
- Kumon memakai keduanya untuk memutuskan ulang/lanjut.
- Relevansi: mendukung pencatatan waktu belajar. **Waktu per soal tidak diambil**: app ini tanpa timer & non-punitive, jadi kecepatan bukan ukuran kemampuan di sini.

### 3.5 Khan Academy Kids & Lingokids
- **Khan Academy Kids:** laporan aktivitas selesai, tanda warna per materi (hijau dikuasai / kuning sedang / merah berkembang), bisa dikirim ke email orang tua.
- **Lingokids:** laporan mingguan berisi aktivitas selesai, **waktu belajar**, kata/konsep yang dipelajari, skill paling sering dilatih, dan area yang perlu latihan.
- Relevansi: "Waktu belajar 7 hari terakhir", "Kata dikuasai", kandidat laporan mingguan (§5).

### 3.6 Kurikulum Merdeka (rapor sekolah Indonesia)
- Deskripsi capaian disusun dari **capaian tertinggi dan terendah** anak, dalam kalimat, bukan hanya angka.
- Relevansi: kartu "📝 Ringkasan untuk Orang Tua". Bentuk ini paling dikenal orang tua Indonesia.

### 3.7 Definisi ukuran "dikuasai"
- Ada 2 definisi umum: **first-attempt accuracy** (ketat) dan **mastery = hasil terakhir** (meleset lalu diulang & tepat tetap dihitung).
- Label "akurasi" sebaiknya jelas mengukur yang mana.
- Relevansi: "Kata dikuasai" pakai jawaban terakhir, dan Detail Rapor menjelaskan bahwa Ketepatan menghitung tiap percobaan.

### 3.8 Kompetitor (screenshot user)

| Elemen kompetitor | Keputusan |
|---|---|
| Ubin koin | ❌ Ditolak. Tanpa koin/mata uang (PRD §4.6). |
| Ubin XP, hari beruntun, akurasi | ✅ Sudah ada (panel Progresmu). |
| Bar "Level 1 → 40% menuju Level 2" | ✅ Sudah ada. |
| Hadiah Harian (kalender hadiah terkunci) | ❌ Ditolak permanen (PRD §11). |
| Progress Belajar per CEFR | ✅ Diadaptasi jadi "🗺️ Progres per Level" (6 level + label CEFR). |
| Stats Singkat berbentuk baris | ✅ Sudah ada. Ditambah "Game dimainkan". |
| "Akurasi rata-rata" di Stats Singkat | ❌ Duplikat ubin Ketepatan (aturan "1 fakta tampil sekali"). |
| "Perlu Diperkuat" berisi topik 0% | ❌ Topik belum dicoba bukan kelemahan. Punya kita butuh ≥ 3 jawaban & tombol latihan per topik. |

---

## 4. Yang Sudah Diterapkan (2026-09-30)

### 4.1 Rumus

| Nilai | Rumus baru |
|---|---|
| Bintang skill | Jawaban tepat ÷ semua jawaban di skill itu (`computeInsights().skillAccuracy`). Tiap 20% = 1 bintang, dibulatkan. Speaking: rata-rata skor mic terbaik tiap soal (`sc`). Materi tuntas tampil terpisah (teks + bar tipis). |
| Misi Berikutnya / Kekuatan / Kata yang Masih Dilatih | Sama seperti dulu (≥ 3 jawaban; meleset ≥ 34% / ≤ 10%), tapi **soal mic tidak ikut** (`isMicSection`). |
| Kata dikuasai | Kata Vocab yang **jawaban terakhirnya** tepat (`lc === 1`). |
| Modul tuntas | `finishedTopicsForLevel` (`topicFinished`), dijumlah dari semua level. Menu Belajar memakai rumus yang sama per level. |
| Hari aktif | Hari aktif dalam 30 hari terakhir (`getActiveDaysInLast(30)`), tampil "x/30". |
| Waktu belajar | Tiap 15 dtk ditambah ke hari ini kalau app tampil & ada sentuhan ≤ 60 dtk terakhir (`startActiveTimer`). Ditampilkan: total 7 hari & rata-rata per hari belajar. |
| Ringkasan untuk Orang Tua | Skill dengan ketepatan tertinggi & terendah, cuma skill dengan ≥ 10 jawaban, **tanpa Speaking** (skor mic bukan jenis angka yang sama). |
| Progres per Level | Modul tuntas ÷ semua modul di level itu, untuk tiap level yang punya materi. |
| Pakai Petunjuk (ditambah 2026-09-30) | Soal yang 💡 Petunjuknya dibuka ÷ semua soal yang sudah dikerjakan (per soal, `SlotState.h`), di Latihan Inti & Tantangan semua skill, tanpa Kenalan & tanpa "💡 Jawabannya" otomatis. Tampil total di Stats Singkat & per skill di kartu skill. Makin kecil = makin mandiri (pola bantuan bertahap/*scaffolding*: bantuan dikurangi seiring anak mampu). Sebelumnya beberapa Petunjuk belum tercatat (Vocab Eja Kata & Susun Kalimat, Listening format lama/Susun/catatan/dialog/Benar-Salah, Grammar pola, Speaking Latihan Inti), jadi rasio data lama cenderung lebih kecil dari aslinya. |

### 4.2 Tampilan
- Tombol "📖 Detail Rapor" di kanan judul Progresmu (hanya di Rapor).
- Layar Detail Rapor: arti & cara hitung tiap nilai, plus kartu "📡 Cara Data Dicatat".
- Kartu baru: "📝 Ringkasan untuk Orang Tua", "🗺️ Progres per Level".
- Stats Singkat baru: Game dimainkan, Waktu belajar 7 hari, Rata-rata belajar/hari.
- Kartu skill: bintang pindah ke baris sendiri (tidak menutupi teks di HP).

### 4.3 Cara data dicatat (tertulis di Detail Rapor)
- Tiap jawaban disimpan di perangkat. App tetap jalan tanpa internet.
- Dikirim ke akun hanya saat 1 bagian selesai: Latihan Inti, tiap tab Tantangan, tiap babak Tantangan Raja, 1 markas game. Kenalan saja tidak memicu pengiriman.
- Saat dikirim, **seluruh data perangkat ikut terkirim**, termasuk jawaban bagian yang baru setengah jalan.
- Data dari beberapa perangkat digabung (nilai tertinggi & soal yang sudah dikerjakan tidak hilang).
- Waktu belajar & bintang game masih lokal di perangkat.

---

## 5. Rekomendasi Berikutnya (Urut Prioritas, Belum Dikerjakan)

1. **Sinkron waktu belajar & nilai game ke akun.**
   - Sekarang `activeMs` & `gameStats` hanya di perangkat, jadi orang tua yang membuka Rapor di HP lain melihat angka beda.
   - Kerjanya: kolom baru di server (mis. `minutes` di `child_daily_stats`, `game_stats` di `child_progress_state`) + migrasi + digabung dengan nilai maksimum per hari.
   - Alasan: EF & Lingokids menampilkan data yang sama di perangkat mana pun.
2. **Samakan rumus Ketepatan di panel Progresmu dengan ketepatan per skill.**
   - Sekarang ubin 🎯 memakai `recordAttempt` (termasuk game & tiap "Coba Lagi"), sedangkan bintang skill memakai status soal per section. Angkanya bisa beda dan membingungkan.
   - Usul: ubin 🎯 = gabungan 4 skill objektif dari `computeInsights`, dan nilai game tetap di kartu Game.
3. **Kalimat "Anak bisa…" per skill** (Statement of Results Cambridge, deskripsi Kurikulum Merdeka).
   - Tampilkan `CAN_DO` untuk skill yang sudah 4–5 bintang dengan ≥ 10 jawaban, bukan cuma setelah lolos Tantangan Raja.
   - Tambahkan juga penanda "Siap Tantangan Raja" kalau 4 skill objektif ≥ 4 bintang (aturan kesiapan Cambridge).
4. **Laporan mingguan** (Lingokids, Khan Academy Kids).
   - Kartu "Minggu Ini": menit belajar, soal dijawab, kata baru dikuasai, materi yang naik/turun dibanding minggu lalu.
   - ~~Kirim ke email orang tua~~ — dibatalkan user, laporan hanya di dalam aplikasi (§6.7).
5. **Grafik tren 4 minggu** (Kumon progress chart).
   - Ketepatan & menit per minggu, supaya orang tua melihat arah, bukan satu angka saja.
   - Butuh data per minggu tersimpan; event log `LearningEvent` di server sudah punya `localDay`.
6. **Kirim hanya bagian yang selesai** (kalau diinginkan).
   - Sekarang pemicunya bagian selesai, tapi isinya seluruh data perangkat.
   - Kalau yang dimau benar-benar "hanya yang selesai masuk database", `scheduleProgressSync` perlu memfilter `sections` yang semua slotnya `st === 2`. Konsekuensinya: resume lintas perangkat untuk bagian setengah jalan hilang.
7. **Suara Rapor konsisten ke orang tua.**
   - Beberapa kalimat masih ke anak ("Ini hari-hari kamu sudah main…", "Ayo mulai…"), karena komponennya dipakai bersama Beranda.
   - Usul: versi kalimat orang tua khusus Rapor ("Anak belajar 5 dari 7 hari minggu ini").
8. **Pengingat waktu layar yang lembut** (WHO: usia 2–4 tahun ≤ 1 jam layar/hari).
   - Untuk Little Stars, kalau rata-rata > 60 menit/hari, tampilkan catatan netral untuk orang tua.
   - Bukan batasan otomatis, tanpa nada menghukum.

**Tidak direkomendasikan:**
- Waktu per soal ala Kumon (bertentangan dengan tanpa timer).
- Peringkat posisi anak (aturan leaderboard anonim).
- Koin & hadiah harian terkunci.

## 6. Analisis Ulang & Rekomendasi Akhir (2026-09-30)

Dianalisis ulang setelah semua perbaikan §4, memakai data contoh yang cukup lengkap (4 materi dikerjakan, 9 hari aktif, hasil placement test & papan peringkat terisi).

### 6.1 Kondisi sekarang

**Rumus & data: sudah sehat.**
- Tiap nilai punya sumber tunggal (`computeInsights`, `topicFinished`, `activeDays`, `activeMs`) dan dijelaskan di Detail Rapor.
- Soal mic tidak lagi dianggap meleset.
- Tidak ada angka yang bisa lewat 100%.
- Sisa masalah rumus cuma 2: ubin 🎯 Ketepatan beda sumber dengan bintang skill, dan waktu belajar & nilai game belum ikut akun.

**Tampilan: ini masalah utamanya.**

| Ukuran | HP (390px) | Desktop (1280px) |
|---|---|---|
| Tinggi halaman | ±4.640px (±5,5 layar) | ±3.480px |
| Jumlah kartu | 12 | 12 |
| Kartu terpanjang | "Skor Belajar & Game" ±1.490px (32% halaman): 5 kartu skill + 7 kartu game | sama |
| Stats Singkat | 11 baris, ±635px | sama |

Temuan:
1. **Satu fakta tampil 2–3 kali** (melanggar aturan "1 fakta = 1 kali tampil"):
   - Kelengkapan materi: bar Progresmu, Progres per Level, dan "x/10 materi tuntas" di tiap kartu skill.
   - Hal yang lemah: Ringkasan untuk Orang Tua, Misi Berikutnya, dan Kata yang Masih Dilatih.
   - Kehadiran: hari beruntun (Progresmu), Rekor beruntun & Hari aktif (Stats Singkat), dan Progres Harian (7 hari).
   - Ketepatan: ubin 🎯 dan bintang tiap skill.
2. **Urutannya tidak menjawab pertanyaan orang tua.** Pertanyaan orang tua kira-kira: "Anakku bagaimana?" → "Kuat/lemah di mana?" → "Aku harus bantu apa?" → "Rajin atau tidak?". Sekarang jawaban "harus bantu apa" (Misi Berikutnya) baru muncul setelah ±3.000px di HP, di bawah 7 kartu game yang kebanyakan "Belum dimainkan".
3. **Hasil Tantangan Raja**, satu-satunya nilai tes kemampuan resmi (setara Statement of Results Cambridge), ada di kolom samping, jadi di HP tampil paling bawah.
4. **Campur suara anak & orang tua.** Rapor untuk orang tua, tapi beberapa kalimat masih menyapa anak ("Ayo mulai…", "Ini hari-hari kamu…").
5. **Kartu "Untuk orang tua"** di bawah mengulang aturan yang sudah ada di Detail Rapor.

### 6.2 Keputusan: revamp total atau tidak?

**Rekomendasi: bukan revamp total. Susun ulang halaman (revamp tata letak), dengan komponen & rumus yang sudah ada.**

| Opsi | Isi | Penilaian |
|---|---|---|
| A. Tambal kecil | Hapus duplikat saja, urutan tetap | ❌ Masalah urutan & panjang halaman tidak selesai. |
| **B. Susun ulang (disarankan)** | Kelompokkan jadi 4 bagian yang menjawab pertanyaan orang tua. Gabung kartu yang dobel. Kartu game jadi daftar ringkas. Bagian sekunder dilipat. | ✅ Rumus & data yang sudah diperbaiki tetap dipakai. Kerja hanya di `renderRapor` + CSS, tanpa migrasi. |
| C. Revamp total | Desain & rumus baru dari nol (dashboard, grafik, dsb.) | ❌ Membuang rumus yang baru saja diperbaiki. Grafik tren butuh data per minggu dari server yang belum ada. |

Alasan B:
- Riset §3 menunjukkan isi Rapor sudah lengkap. Yang kurang dari rapor lembaga (Cambridge Statement of Results, deskripsi Kurikulum Merdeka) justru **ringkas & berurutan**: kesimpulan dulu, rincian belakangan.
- Kompetitor pun menaruh ringkasan angka di atas dan detail di bawah.

### 6.3 Susunan baru yang disarankan

Target: bagian utama (1–3) muat ±2–2,5 layar HP. Bagian 4 dilipat.

1. **Sekilas** (layar pertama)
   - Progresmu: level + bar + XP · hari beruntun · ketepatan, tombol Detail Rapor.
   - Ringkasan untuk Orang Tua, diperluas jadi 2–3 kalimat: skill terkuat, skill yang perlu latihan, dan status kesiapan Tantangan Raja ("Siap mencoba Tantangan Raja" kalau 4 skill objektif ≥ 4 bintang, aturan kesiapan Cambridge).
   - Strip "Minggu Ini": 7 bulatan hari + menit belajar + soal dijawab. Ini menggantikan kartu Progres Harian dan 3 baris Stats Singkat.
2. **Kemampuan**
   - 5 skill dalam 1 daftar ringkas (1 baris per skill: bintang, ketepatan, 💡 petunjuk, materi tuntas). Bukan 5 kartu besar.
   - Kalimat "Anak bisa…" di skill yang sudah 4–5 bintang.
   - Hasil Tantangan Raja (dipindah dari kolom samping ke sini).
3. **Yang Perlu Dilakukan**
   - Misi Berikutnya, dengan "Kata yang Masih Dilatih" dimasukkan ke kartu yang sama sebagai chip.
   - Kekuatan Sekarang ("Uji Lagi").
4. **Rincian** (dilipat, tap untuk buka)
   - Game: 7 game dalam 1 daftar ringkas, yang belum dimainkan digabung jadi 1 baris "Belum dimainkan: …".
   - Progres per Level.
   - Statistik sepanjang waktu (modul tuntas, kata dikuasai, markas ditaklukkan, rekor beruntun, rata-rata menit/hari).
   - Hasil Placement Test, Papan Peringkat.

Dihapus/digabung:
- Kartu Progres Harian → strip Minggu Ini.
- Kartu "Untuk orang tua" → isinya sudah ada di Detail Rapor.
- Baris Stats Singkat yang dobel dengan Progresmu.
- Kartu Kata yang Masih Dilatih → masuk ke Misi Berikutnya.

Desktop: bagian 1 selebar penuh, bagian 2 & 3 berdampingan (2 kolom), bagian 4 di bawah.

Kalimat Rapor diganti suara orang tua ("Anak belajar 5 dari 7 hari minggu ini"), tanpa mengubah Beranda.

### 6.4 Rencana 3 fase

| Fase | Isi | Butuh server? | Perkiraan |
|---|---|---|---|
| **1. Susun ulang halaman** | §6.3 seluruhnya: 4 bagian, gabung duplikat, daftar ringkas skill & game, lipat bagian rincian, suara orang tua, Tantangan Raja pindah ke Kemampuan. Uji HP & desktop. | Tidak | 1 sesi |
| **2. Lengkapi rumus** | Ubin 🎯 = gabungan 4 skill objektif (§5 no. 2). "Anak bisa…" per skill & status "Siap Tantangan Raja" (§5 no. 3). Catatan waktu layar lembut untuk Little Stars (§5 no. 8). | Tidak | 1 sesi |
| **3. Server & laporan** | Sinkron `activeMs` & `gameStats` ke akun (§5 no. 1, butuh migrasi). Laporan mingguan + email orang tua (§5 no. 4). Grafik tren 4 minggu (§5 no. 5). | Ya | 2+ sesi |

Opsional, butuh keputusan user: "kirim hanya bagian yang selesai" (§5 no. 6). **Tidak disarankan**, karena melanjutkan pekerjaan setengah jalan di perangkat lain jadi tidak bisa, sedangkan manfaatnya kecil (pengiriman sudah hanya dipicu saat bagian selesai).

Tetap ditolak: koin, hadiah harian terkunci, peringkat posisi anak, waktu per soal.

### 6.5 Hasil Fase 1 (2026-09-30)

Dikerjakan sesuai §6.3, di `renderRapor` (`app/src/app.ts`) + CSS `.rapor-*` (`app/public/styles.css`). Tanpa perubahan server.

| Ukuran (data contoh sama dgn §6.1) | Sebelum | Sesudah |
|---|---|---|
| Tinggi halaman HP (Rincian tertutup) | ±4.640px | ±2.020px |
| Tinggi halaman desktop | ±3.480px | ±1.070px |
| "Yang Perlu Dilakukan" mulai di (HP) | ±3.000px | ±1.340px |
| Kartu tampil tanpa membuka Rincian | 12 | 6 |

Susunan sekarang:
1. **Sekilas:** Progresmu + kartu "Ringkasan untuk Orang Tua" yang berisi 2–3 kalimat (skill terkuat, skill yang perlu latihan, kesiapan Tantangan Raja) dan strip "Minggu Ini" (7 hari, menit, soal). Desktop: 2 kartu berdampingan.
2. **Kemampuan:** daftar 5 skill (1 baris: bintang, ketepatan, 💡 petunjuk, materi tuntas, "✅ Anak bisa…" kalau ≥ 4 bintang & ≥ 10 jawaban, bukan Speaking) + Hasil Tantangan Raja.
3. **Yang Perlu Dilakukan:** Misi Berikutnya (kata yang masih dilatih jadi chip di kartu yang sama) + Kekuatan Sekarang. Kalau belum ada sinyal: 1 kalimat penjelasan.
4. **Rincian lainnya** (dilipat, status buka/tutup diingat per perangkat): Game (daftar ringkas, yang belum dimainkan digabung 1 kalimat), Progres per Level, Statistik, Placement Test, Papan Peringkat.

Digabung/dihapus: kartu Progres Harian (→ Minggu Ini), kartu Kata yang Masih Dilatih (→ Misi Berikutnya), kartu "Untuk orang tua" (→ subjudul Detail Rapor), baris Stats Singkat yang dobel (waktu 7 hari, game dimainkan), 7 kartu game besar, 5 kartu skill besar. Fungsi `buildDailyCard` dihapus (tidak dipakai lagi).

Suara orang tua: caption progres ("Belum ada modul yang tuntas di level ini."), Misi/Kekuatan, Placement Test, Papan Peringkat. Beranda tidak berubah.

Rumus baru di Fase 1: kesiapan Tantangan Raja (semua skill objektif ≥ 4 bintang & ≥ 10 jawaban), "soal minggu ini" (`computeInsights().weekAnswered`, per soal dari `SlotState.t`). Detail Rapor ditambah aturan Minggu Ini & Tantangan Raja.

Sisa untuk Fase 2: ubin 🎯 Ketepatan masih memakai `recordAttempt` (beda sumber dengan bintang skill), dan catatan waktu layar Little Stars.

### 6.6 Hasil Fase 2 (2026-09-30)

1. **Ubin 🎯 Ketepatan = gabungan 4 skill objektif** (`computeInsights().objectiveAccuracy`: jawaban tepat ÷ semua jawaban di Vocabulary, Listening, Reading, Grammar, tanpa mic).
   - Sekarang 1 sumber dengan bintang skill, jadi angka ubin selalu sejalan dengan daftar skill.
   - Dulu memakai `getAccuracy()` (`recordAttempt`), yang ikut menghitung game. Contoh data uji: ubin lama 99%, padahal skill-nya 60% & 90%. Ubin baru 75%.
   - Nilai game tetap di bagian Game (Rincian). `recordAttempt`/`getAccuracy` tetap ada (masih mengisi `gameStats` & data server), cuma tidak dipakai di ubin lagi.
2. **"Anak bisa…" per skill & status "Siap mencoba Tantangan Raja"**: sudah ikut dikerjakan di Fase 1 (§6.5).
3. **Catatan waktu layar yang lembut** di kartu Ringkasan untuk Orang Tua.
   - Muncul hanya kalau level anak Little Stars (usia 3–5) DAN rata-rata belajar > 60 menit/hari (`SCREEN_NOTE_MINUTES`).
   - Dasarnya pedoman WHO: usia 3–4 tahun maksimal 1 jam layar per hari.
   - Cuma informasi untuk orang tua. Tidak ada pembatasan otomatis, tidak ada nada menghukum.
4. Detail Rapor ikut diperbarui (arti & cara hitung Ketepatan, catatan waktu layar).

Diuji live di HP (390px) & desktop (1280px): ubin 🎯 memakai angka gabungan; catatan waktu layar muncul untuk Little Stars 75 menit/hari, tidak muncul untuk Little Stars 40 menit/hari maupun Explorer 75 menit/hari.

Sisa untuk Fase 3 (butuh server): sinkron waktu belajar & nilai game ke akun, laporan mingguan + email orang tua, grafik tren 4 minggu.

### 6.7 Hasil Fase 3 (2026-09-30)

1. **Data Rapor ikut akun.** Migrasi `portal/prisma/migrations/20260930090000_add_rapor_sync` menambah 4 kolom JSONB di `child_progress_state`:

   | Kolom | Isi (`Store`) | Cara gabung |
   |---|---|---|
   | `active_ms` | menit belajar aktif per hari | nilai terbesar per hari |
   | `daily_answers` | jawaban per hari `{n, ok}` (soal pilih/susun, tanpa mic & Kenalan) | pasangan dengan `n` terbesar |
   | `game_stats` | nilai tiap game `{correct, total}` | pasangan dengan `total` terbesar |
   | `game_xp` | XP tiap game | nilai terbesar per game |

   - Digabung 2 kali: di server (`upsertStoreSnapshot`, baca nilai lama dulu dalam transaksi yang sama) dan di app (`mergeFromServer`). Jadi 2 perangkat yang sama-sama aktif tidak saling menghapus.
   - Server membuang data tidak valid (kunci bukan tanggal, angka negatif, tepat > total) & menyimpan maks 60 hari.
   - Pengiriman tetap lewat jalur lama (saat 1 bagian selesai), tanpa request baru.
   - **Deploy:** jalankan `npx prisma migrate deploy` di `portal/` sebelum app baru dipakai.
2. **Jawaban per hari** (`Store.dailyAnswers`) dicatat di `markSlotAnswered`, definisi sama dengan ketepatan skill. Mulai terisi sejak Fase 3, jadi periode sebelum itu kosong.
3. **Kartu "📈 Tren 4 Minggu"** di bagian Kemampuan: 4 periode 7 hari (bergulir, bukan minggu kalender), tiap baris = bar menit belajar + angka menit + ketepatan periode itu (`getWeeklyTrend`). Menit & ketepatan sengaja kolom terpisah (beda satuan, tidak digabung 1 sumbu). Disembunyikan kalau belum ada data.
4. **Perbandingan mingguan** di strip Minggu Ini: "7 hari sebelumnya: X menit · ketepatan Y%". Netral, tanpa panah naik/turun.
5. Detail Rapor: aturan Tren 4 Minggu; "Cara Data Dicatat" & "Waktu belajar" sekarang menyebut data ikut akun.

Diuji:
- Server langsung ke Postgres lokal dengan akun+anak sementara (dihapus sesudahnya): 2 snapshot "perangkat" digabung benar; data tidak valid dibuang.
- `mergeFromServer` & `getWeeklyTrend` lewat skrip (localStorage tiruan): mic & Kenalan tidak masuk jawaban harian; data server 8 hari lalu masuk ke periode yang benar.
- Rapor live di HP (390px) & desktop (1280px), 0 error.
- **Belum diuji:** alur login → sync → buka di perangkat kedua lewat HTTP asli (butuh sesi login portal). Disarankan dicoba di staging.

**🔒 Email laporan mingguan TIDAK dibuat** (keputusan user 2026-09-30): semua laporan hanya di dalam aplikasi (Rapor). Jangan tambahkan email/notifikasi laporan ke luar aplikasi tanpa arahan baru. Pengganti laporan mingguan = strip Minggu Ini + kartu Tren 4 Minggu.

### 6.8 Hasil Game (Opsi B, 2026-09-30)

Permintaan user: "untuk game apakah masuk rapor? maksudnya hasil game". Sebelumnya hasil game cuma 1 kartu di Rincian (dilipat), hanya total per game, Petunjuk game tidak tercatat, dan menit Minggu Ini diam-diam termasuk game. User memilih Opsi B (rapikan tanpa mengubah rumus nilai skill).

1. **Bagian baru "🎮 Hasil Game"** di area utama (setelah Yang Perlu Dilakukan, sebelum Rincian). Susunan Rapor jadi 5 bagian.
   - Per game: tepat/total, 💡 jumlah soal yang Petunjuknya dibuka, dan "paling sulit: markas X (y%)" (ketepatan terendah, minimal 3 jawaban, minimal 2 markas).
   - Tap game → rincian tiap markas (bintang, tepat/total, 💡).
   - Game yang belum dimainkan digabung 1 kalimat. Catatan: nilai game terpisah dari nilai skill.
2. **Pencatatan per markas** (`Store.gameMarkas`): tiap game memanggil `setGameMarkas(GAME_KEY, idx, nama, emoji)` saat masuk markas; `recordAttempt(…, GAME_KEY)` otomatis menambah angka markas itu. Petunjuk game dicatat `markGameHint(GAME_KEY)` (sekali per soal). Terpasang di 7 game.
3. **Ikut akun:** migrasi `20260930100000_add_game_markas` (kolom `game_markas` JSONB), digabung per markas (total terbesar menang, petunjuk terbesar) di server & app.
4. **Minggu Ini:** "menit (termasuk game)" & "soal belajar" supaya jelas.
5. Nilai game tetap TIDAK masuk bintang skill, ketepatan 🎯, ringkasan, Misi/Kekuatan, dan tren.

Data lama: total per game (`gameStats`) sudah ada sejak dulu; rincian per markas & Petunjuk baru tercatat mulai sekarang, jadi jumlah markas bisa lebih kecil dari total.

Diuji: Sound Hunt & Story Quest dimainkan live (masuk markas, buka Petunjuk, menjawab) → tercatat per markas dengan nama markasnya; Rapor Hasil Game di HP 390px & desktop 1280px; 0 error. Deploy: `npx prisma migrate deploy` di `portal/`.

---

## Sumber
- [Cambridge English – Results for young learners](https://www.cambridgeenglish.org/exams-and-tests/qualifications/results/young-learners/)
- [Shields in Starters, Movers and Flyers exams](https://flyer.us/shields-in-starters-movers-and-flyers-exams/)
- [EF Parents (Google Play)](https://play.google.com/store/apps/details?id=com.ef.parents&hl=en)
- [LBLIA – Program](https://lblia.com/programlblia)
- [Kumon – Understanding completion time](https://www.kumon.com/resources/understanding-completion-time-in-kumon-a-parents-practical-guide/)
- [Kumon – Understanding student progress](https://www.kumon.com/resources/understanding-student-progress-in-kumon-what-to-look-for-and-where-to-find-it/)
- [Khan Academy Kids – Progress reports](https://khankids.zendesk.com/hc/en-us/articles/4403614100109-Progress-reports-in-the-Khan-Academy-Kids-app)
- [Lingokids review (ling-app)](https://ling-app.com/blog/lingokids-review/)
- [Contoh deskripsi rapor Kurikulum Merdeka (kumparan)](https://kumparan.com/ragam-info/5-contoh-deskripsi-raport-kurikulum-merdeka-singkat-22sTYYurSMd)
- [Learning Metrics 101: Completion, Progress, Mastery](https://www.forasoft.com/learn/elearning-video/articles-elearning/learning-metrics-101)
- [WHO – Guidelines on physical activity, sedentary behaviour and sleep for children under 5](https://iris.who.int/server/api/core/bitstreams/bfce7d1e-43d8-4e28-ba1b-8f6cf9da2661/content)
