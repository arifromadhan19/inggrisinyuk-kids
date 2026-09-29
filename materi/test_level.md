# Tes Akhir Level — Kapan Anak Naik, Kapan Tetap di Level

Permintaan user (2026-09-29): audit soal setiap materi (Vocabulary, Listening, Reading, Grammar, Speaking), riset ke Cambridge, LIA, EF, dan lembaga lain (prioritas dalam negeri) tentang cara mengukur kemampuan anak untuk **naik** atau **tetap** di level, lalu tentukan bentuk tes akhir level yang tepat.

Dokumen ini melanjutkan [test_perlevel.md](test_perlevel.md). Dokumen itu membahas jumlah soal dan durasi Tantangan Raja. Dokumen ini membahas hal yang belum pernah diputuskan: **aturan naik atau tetap**.

**Lingkup (keputusan user 2026-09-29): keputusan naik/tetap HANYA dari tes kemampuan.** Syarat kehadiran/penyelesaian materi (padanan "absen" di lembaga) tidak dipakai. Fakta absen di §3 tetap dicatat sebagai hasil riset saja.

Status: **✅ diimplementasikan 2026-09-29 di semua 6 level** (§9). Keputusan user: §7. Keputusan Opsi A mengganti aturan lama PRD §4.6/§14.8 (Tantangan Raja tidak pernah menahan anak); PRD & CLAUDE.md ikut diubah saat implementasi (§8.3).

---

## 1. Ringkasan

1. **Sekarang Tantangan Raja belum bisa dipakai untuk memutuskan naik atau tetap.**
   - Anak selalu menang, apa pun skornya.
   - Tes bisa dikerjakan tanpa menyentuh satu modul pun.
   - Ada kebocoran jawaban berat: di Listening, jawaban benar selalu di kartu pertama.
   - 4 dari 6 level masih memakai versi lama: 8 soal dan tanpa Reading.
   - Detailnya di §2.
2. **Lembaga Indonesia (LIA, EF/English 1, ILP, TBI, Cakap, English Academy) tidak mempublikasikan nilai minimum naik level.** Yang terbuka ke publik:
   - Syarat kehadiran. Contoh: LIA GEYL maksimal 8 kali absen.
   - Promotion test tertulis + lisan di akhir term 3 bulan.
   - Laporan ke orang tua.
   - Satu-satunya angka publik: Kampung Inggris LC Pare, hadir ≥80% dan nilai ≥50.
3. **Cambridge YLE (usia anak) tidak memakai lulus/gagal.**
   - Nilai dilaporkan 1–5 shields per skill.
   - Anak dianggap siap ke jenjang berikutnya kalau dapat **4–5 shields di SETIAP skill**. Aturannya minimum per skill, bukan total.
4. **Cambridge A2 Key / B1 Preliminary (±11 th ke atas) memakai skor total.**
   - Lulus ≈ 60–72% benar.
   - Grade A (≈ 85–93%) berarti anak sudah berada di level CEFR berikutnya.
5. **Kurikulum Merdeka sudah mengganti KKM dengan KKTP.**
   - Contoh interval: 66–85 "tercapai", 86–100 "sangat tercapai".
   - Anak yang belum mencapai KKTP wajib diberi pendampingan dulu.
   - Tinggal kelas diminta "sangat hati-hati". Riset menunjukkan tinggal kelas rata-rata merugikan: Hattie d ≈ −0,32.
6. **Rekomendasi (§5):** naik level = **tiap skill objektif (Vocab, Listening, Reading, Grammar) ≥ 80% benar di tes akhir** (keputusan user). Speaking cuma dilaporkan. Tidak ada syarat materi/kehadiran.
   - Jumlah soal naik bertahap per level: +3 soal per skill objektif tiap naik level (5→20). Soal Speaking tetap seperti usulan awal (3/3/4/4/5/5).
   - Speaking cuma sinyal pendukung, bukan gerbang, karena speech recognition untuk anak belum andal.
   - Kalau belum lolos: anak **tetap** di level dengan misi latihan terarah untuk topik yang lemah. Tidak mengulang seluruh level dan tidak pernah turun level.
   - Tes bisa diulang tanpa batas dengan soal baru.

---

## 2. Audit Tes Sekarang (Tantangan Raja, `games/boss.ts`)

### 2.1 Cara kerja

| Aspek | Level pilot (Little Stars, Explorer) | Level lain (Starter, Adventurer, Achiever, Trailblazer) |
|---|---|---|
| Skill | 5 (Vocab, Listening, Reading, Grammar, Speaking) | 4, **tanpa Reading** |
| Soal | 5 per skill, total 25 | 2 per skill, total 8 |
| Skor | Percobaan pertama, lalu 1–5 bintang | Tidak ada kartu skor |
| Estimasi waktu | Ditampilkan | Tidak ada |

Cara soal diambil (semua level):
- Acak murni dari semua item semua topik di level itu: `shuffle(...).slice(0, N)`.
- Tidak dijaga per topik, jadi 5 soal bisa datang dari 1 topik saja.
- Tidak ada bank soal khusus tes. Semua soal adalah item materi yang sudah anak lihat verbatim.

Akhir tes:
- `finish()` selalu memanggil `onWin` (`boss.ts:841`). **Tidak ada ambang.**
- Lalu `markBossCleared`, level berikutnya terbuka, dan header naik level.

Tidak ada prasyarat:
- Tes bisa dicoba tanpa membuka modul apa pun (`app.ts:1234`, `1777`).

Hasil tidak disimpan:
- `BossResult` dibuang setelah layar menang.
- Event `boss_clear` tidak membawa skor.
- Jawaban tes malah ikut tercampur ke akurasi global Rapor lewat `recordAttempt`.

### 2.2 Temuan per skill

**🎧 Listening — paling parah**
- **Jawaban benar selalu di kartu pertama.** Data menaruh jawaban benar di indeks 0 untuk 100% soal di 6 level, dan `boss.ts:551` merender opsi tanpa `shuffle`. Ini melanggar aturan CLAUDE.md "Opsi format lama WAJIB diacak". Sudah saya cek langsung di kode.
- **Pertanyaannya tidak pernah dibacakan atau ditampilkan.** Yang diputar cuma kalimatnya. Tugasnya jadi "cari kata benda yang terdengar": label jawaban benar terdengar di kalimat pada ±95% soal, sedangkan label pengecoh tidak pernah terdengar.
- Explorer/Adventurer: pool cuma ±20 soal, dan 16 dari 19 soal punya 2 opsi saja (tebakan 50%).
- Achiever/Trailblazer diuji dengan soal kalimat pendek. Format khas level itu (Lengkapi Catatan, Dengar & Simpulkan) tidak pernah dipakai.
- Little Stars: ada kartu emoji kosong, emoji kembar, dan 25 soal kartu teks-saja untuk anak yang belum bisa membaca.

**📚 Vocabulary**
- Cuma 1 arah (dengar lalu pilih emoji). Latihan Inti punya 4 arah.
- Pengecoh diambil dari topik lain, jadi mudah dibedakan.
- Emoji kembar dalam 1 level:
  - Explorer: 🏅 untuk 7 ordinal (Fourth sampai Tenth). Kata "fifth" praktis tidak teruji.
  - Starter: 🏫 untuk Monday dan Classroom.
  - Achiever: ⬆️ untuk Straight dan Upload.
- Topik `iconAmbiguous` dan override gambar custom tidak dipakai.
- Kosakata abstrak Trailblazer (Curriculum, Summarize) diuji lewat emoji. Kurang valid.

**📖 Reading (cuma di level pilot)**
- Little Stars: kalimat ke gambar. Cocok dengan materinya.
- Explorer: yang tampil cuma baris bukti. Pada 144 dari 197 soal, teks jawaban benar muncul persis di baris itu. Jadi soalnya cocok-string, bukan membaca.
- Bom waktu kalau pilot diperluas ke level atas:
  - `gap`/`ref` cuma punya 1 opsi.
  - `reply`/`missing` menampilkan jawabannya sendiri.
  - `tfn` kehilangan pilihan "Doesn't say".
- Starter, Adventurer, Achiever, dan Trailblazer tidak diuji Reading sama sekali.

**✏️ Grammar**
- Semua format diratakan jadi susun kata, tanpa prompt, tanpa arti, tanpa kata jebakan. Huruf kapital kata pertama membocorkan posisi awal.
- Kata pola (`key`/`wrong`) tidak pernah diuji. Yang diuji cuma urutan kata, bukan pilihan bentuk.
- Little Stars/Starter: pra-pembaca disuruh menyusun chip teks, padahal materinya kontras audio-gambar. Cuma `formA` yang dipakai, jadi bentuk jamak/negatif tidak pernah keluar.
- Trailblazer: kutipan langsungnya tidak ditampilkan, jadi transformasi reported speech tidak teruji.

**🗣️ Speaking**
- Tugasnya membaca teks/menirukan. Bentuk Tantangan level atas (Pilih & Ucapkan, Bertanya, Cerita & Jawab) tidak diuji.
- Trailblazer memakai jawaban Bima, rata-rata 19 kata.
- Skor dihitung dengan mencocokkan kata tanpa peduli urutan (`wordMatchDetail`), dan ASR anak di browser tidak andal. **Tidak layak jadi gerbang.**

**Celah skor (semua skill)**
- Setelah salah, tap pill skill yang sama mereset `firstTry` (`boss.ts:456`).
- Tap dobel di jawaban benar menghitung soal 2 kali (`boss.ts:501`). Mic juga (`boss.ts:792`).
- Mengulang skill memakai set soal yang sama, jadi skor bisa naik karena hafal.

### 2.3 Jumlah konten per level (bahan bank soal)

| Level | Vocab | Listening (pool tes) | Reading | Grammar | Speaking (pool tes) |
|---|---|---|---|---|---|
| Little Stars | 12 topik / 120 | 110 | 10 / 200 | 10 / 100 | 120 |
| Starter | 10 / 100 | 100 | 11 / 220 | 10 / 100 | 100 |
| Explorer | 10 / 100 | **19** | 11 / 197 | 10 / 100 | **35** |
| Adventurer | 13 / 130 | **20** | 11 / 196 | 10 / 100 | **35** |
| Achiever | 10 / 100 | 100 | 11 / 195 | 11 / 110 | **36** |
| Trailblazer | 10 / 100 | 100 | 11 / 208 | 10 / 100 | 85 |

- Kontennya cukup untuk tes 8–10 soal per skill.
- Pengecualian: Listening Explorer/Adventurer dan Speaking Explorer–Achiever. Pool-nya kecil kalau cuma mengambil `drill`. Pool bisa diperluas dengan mengambil juga `kenalanGame` dan `story`.
- Id topik unik lintas level. Jadi progres per topik (`Store.sections`) bisa dipetakan ke level tanpa migrasi data.

---

## 3. Riset Lembaga

Kode sumber: **[V]** = dicek di sumber resmi. **[S]** = sumber sekunder (cabang, blog, pihak ketiga). **[TV]** = sudah dicari, tidak ditemukan di sumber publik.

### 3.1 Dalam negeri

**LIA — GEYL (SD) / GET (SMP)** [S]
- GEYL: 6 level. 1 term = ±3 bulan, 22 sesi.
- 22 sesi itu sudah termasuk midterm + final (promotion) test, tertulis + lisan (Oral).
- **Syarat ikut promotion test:** absen maksimal 8 sesi (GEYL) atau 6 sesi (program lain), dan biaya lunas. Lewat batas absen berarti tidak boleh ikut tes.
- Ada make-up test. Hasil diumumkan per kelas.
- "Jika lulus Promotion Test, lanjut ke level berikutnya". Artinya anak **bisa** tidak naik.
- Nilai minimum, bobot nilai, dan prosedur mengulang: **[TV]**.

**EF → English 1 (Small Stars 3–6, High Flyers 7–9, Trailblazers 10–14)** [V/S]
- Penempatan awal: tes online adaptif (reading, listening, vocab, grammar) + tes lisan.
- Naik level ±3 bulan sekali. Tes level = 2 tes tertulis + 1 speaking/interview [S].
- Progress Advisor + hasil asesmen bisa dipantau orang tua di aplikasi [V].
- Pass mark untuk anak: **[TV]**. Sebagai pembanding, EF English Live (dewasa) memakai lulus ≥70/100 dan boleh diulang [S].

**Lembaga lain**

| Lembaga | Yang diketahui |
|---|---|
| ILP Kids | Level Green/Red/Blue, "diuji dengan tes Cambridge". Kriteria naik [TV]. |
| TBI | Ada placement test. Tes akhir anak [TV]. |
| IALF YL | Asesmen **berkelanjutan berbasis tugas** yang dihitung ke asesmen akhir level (1 level = 16 pertemuan) [S]. |
| English Academy (Ruangguru) | ±6 kuis unit + 1 ujian akhir per program, ±6 minggu per level. Guru menilai penguasaan tiap sesi. Parent-Teacher Conference [S]. |
| Cakap Kids | Evaluasi bulanan + pertemuan 1-on-1 orang tua-guru [S]. |
| Kampung Inggris LC | Sertifikat butuh **hadir ≥80% + nilai ≥50** [S]. Satu-satunya angka publik. |
| Kumon | Maju berdasarkan penguasaan (**waktu + ketepatan**) per lembar kerja. Ada Achievement Test di akhir level. Kalau belum siap, anak meneruskan di level yang sama. Ambang English [TV]. |

**Kurikulum Merdeka (sekolah)** [S, merangkum Panduan Pembelajaran & Asesmen 2024]
- Asesmen sumatif menjadi dasar kenaikan kelas. Caranya membandingkan capaian anak dengan **KKTP**, bukan KKM.
- KKTP boleh berbentuk deskripsi, rubrik, atau interval. Contoh interval:

  | Nilai | Kategori |
  |---|---|
  | 0–40 | perlu bimbingan |
  | 41–65 | cukup |
  | 66–85 | tercapai |
  | 86–100 | sangat tercapai |

- Kalau KKTP belum tercapai, sekolah wajib memberi pendampingan/remedial dulu.
- Tinggal kelas diperbolehkan tapi "sangat hati-hati", karena mengulang setahun penuh tidak membuat anak setara teman sebaya.

### 3.2 Cambridge

**Pre A1 Starters / A1 Movers / A2 Flyers (YLE)** [V]

| Ujian | Listening | Reading & Writing | Speaking |
|---|---|---|---|
| Starters | 20 soal, ±20 mnt | 25 soal, 20 mnt | 3–5 mnt |
| Movers | 25 soal, ±25 mnt | 35 soal, 30 mnt | 5–7 mnt |
| Flyers | 25 soal, ±25 mnt | 44 soal, 40 mnt | 7–9 mnt |

- **"There is no pass or fail."** Semua anak dapat sertifikat.
- Tiap skill dinilai 1–5 shields. Hasilnya disertai kekuatan dan area yang perlu ditingkatkan.
- Anak dengan **4–5 shields di setiap skill** siap mulai ke ujian level berikutnya.
- Batas shield disetarakan antar versi tes. Ambang skor mentah tidak dipublikasikan dan tidak tetap.
- **Speaking** dinilai examiner 1-on-1. Ada 3 kriteria, masing-masing 0–5: Vocabulary (+Grammar untuk Movers/Flyers), Pronunciation, Interaction. Kalau anak bicara terlalu sedikit, nilai Pronunciation maksimal 3.
- Aturan "10 dari 15 shields, tidak ada skill di bawah 2" yang sering beredar **bukan aturan resmi Cambridge**. Sumbernya situs pihak ketiga.

**A2 Key / B1 Preliminary for Schools** [V]
- Skor per skill dalam Cambridge English Scale, bobot sama. Hasil akhir = rata-rata, **tanpa minimum per paper**.
- Batas skor mentah di tes latihan resmi:

  | Ujian | Lulus di level ini | Grade A (≈ level CEFR berikutnya) |
  |---|---|---|
  | A2 Key | Reading 20/30 (67%), Listening 17/25 (68%), Writing & Speaking 60% | ≈ 87–93% |
  | B1 PET | Reading 23/32 (72%), Listening 18/25 (72%), Writing & Speaking 60% | ≈ 85–91% |

- Cambridge sendiri memperingatkan: skor latihan yang cuma ±3 poin skala dari batas belum tentu tercapai di ujian sungguhan. **Skor di zona batas perlu dicek ulang.**

### 3.3 Internasional lain

| Lembaga/produk | Cara menentukan level |
|---|---|
| Trinity GESE Grade 1–3 (speaking, 5–7 mnt) | 1 kriteria "task fulfilment", nilai A Distinction / B Merit / C Pass / D Fail + area perbaikan [V]. |
| Pearson English Benchmark YL (6–13 th) | 38–41 soal, 20–40 mnt. Tidak ada lulus/gagal; hasilnya **rekomendasi level** + sub-skor per skill + can-do. Level 1 tidak menilai Writing. Jeda minimal 120 jam belajar antar tes [V]. |
| Oxford YL Placement Test | 30 soal adaptif (Language Use + Listening), hasil CEFR [S]. |
| Khan Academy | Attempted → Familiar (70–85%) → Proficient → Mastered. **Mastered harus dibuktikan ulang di tes kumulatif**, bukan cukup sekali benar [S]. |
| Novakid | Tidak ada tes akhir. Naik setelah semua pelajaran selesai **dan guru yakin** [S]. |
| Duolingo ABC / Lingokids | Adaptif, konsep sulit diulang otomatis. Ambang [TV]. |
| British Council kids | Asesmen berkelanjutan + observasi, laporan can-do [S]. Aturan naik [TV]. |

### 3.4 Riset pendidikan

- **Mastery learning (Bloom, Guskey):**
  - Ambang umumnya **80–90%**.
  - Anak di bawah ambang mendapat *correctives*: latihan terarah per tujuan yang belum dikuasai, **bukan** mengulang seluruh materi.
  - Anak yang sudah menguasai mendapat pengayaan.
- **Tinggal kelas merugikan:**
  - Hattie: peringkat 136 dari 138, d ≈ −0,32.
  - Jimerson (2001): 47% analisis memihak anak yang dinaikkan, hanya 5% memihak anak yang ditinggal. Kerugian terbesar ada di reading.
- **Reliabilitas:**
  - Makin sedikit soal, makin tidak reliabel (Spearman-Brown). Subskor per skill yang pendek jauh lebih goyah dari skor total.
  - Tes yang dipakai untuk keputusan memakai ±20 soal per skill (Cambridge) atau ±40 total (Pearson).
  - **5 soal per skill terlalu sedikit untuk keputusan naik/tetap.**
- **Speech recognition anak:** model Whisper yang sudah dilatih khusus suara anak masih meleset ±9% kata pada anak penutur asli, dan bisa 2x lebih buruk untuk anak non-native di ruangan berisik. **Tidak ada lembaga yang memakai ASR sebagai gerbang naik level anak.**
- **"Not Yet" (Dweck):** label "belum" menggantikan "gagal". Cocok dengan aturan kid-friendly app ini.

### 3.5 Pola yang berulang

1. **Tiga model keputusan:**
   - **Gerbang total**: Key/PET, kursus Indonesia.
   - **Minimum per skill**: Cambridge YLE.
   - **Mastery + pertimbangan manusia/sistem**: Kumon, Khan, Novakid, IALF, Merdeka.
2. **Hampir semua kursus menggabungkan tes akhir dengan syarat penyelesaian kursus** (kehadiran, jumlah sesi). **Tidak dipakai di app ini** (keputusan user): keputusan murni dari tes kemampuan.
3. **Ambang berkumpul di dua titik:**
   - **≈60–70%** = cukup / lulus di level ini (Cambridge 120/140, EF 70, KKTP 66+, Khan Familiar).
   - **≈85–90%** = menguasai / siap lompat (Grade A, Bloom, KKTP 86+).
4. **Untuk anak, pola dominan non-punitive:**
   - Laporan kekuatan + area perbaikan.
   - Remedial terarah didahulukan.
   - Tidak ada status "gagal".
5. **Speaking selalu dinilai manusia dengan rubrik.** Aplikasi mandiri tidak punya penilai manusia, jadi bobot Speaking harus kecil.

---

## 4. Prinsip Desain untuk App Ini

1. **"Tetap di level" tidak sama dengan "tinggal kelas".**
   - Anak tidak mengulang seluruh level, tidak pernah turun level, dan level yang sudah terbuka tetap terbuka.
   - Yang dibuka ulang cuma topik/skill yang lemah, sebagai misi (correctives Bloom).
2. **Teks tetap non-evaluatif.** "Belum… yuk latihan lagi!", bukan "gagal"/"tidak lulus".
   - Bintang per skill untuk anak (seperti shields).
   - Angka persen hanya untuk orang tua di Rapor.
3. **Tidak ada timer. Retry tetap tanpa batas.** Skor tetap dihitung dari percobaan pertama, sedangkan retry dipakai untuk belajar.
4. **Tes harus mengukur kemampuan, bukan hafalan:**
   - Soal diambil per topik (stratified).
   - Opsi dijamin diacak.
   - Bentuk soal setara Tantangan level itu.
   - Tiap percobaan ulang memakai soal berbeda.
5. **Keputusan hanya dari tes kemampuan** (keputusan user). Karena itu tesnya harus cukup panjang supaya reliabel: jumlah soal naik tiap level (§5.2) dan ada soal tambahan di zona batas.
6. **Placement test tidak berubah.** Tetap jalur resmi untuk "lompat level" (`unlockLevelsUpTo`).

---

## 5. Rekomendasi Tes Akhir Level

### 5.1 Aturan naik level

Anak **naik level** kalau memenuhi dua syarat. Tidak ada syarat materi/kehadiran; tes bisa dicoba kapan saja.

1. **Syarat per skill (keputusan user): tiap skill objektif (Vocab, Listening, Reading, Grammar) ≥ 80% benar, di SEMUA level.**
2. Skor total otomatis ≥ 80% kalau syarat 1 terpenuhi, jadi tidak perlu syarat total terpisah.
   - Mengikuti Cambridge YLE "setiap skill", supaya skill yang lemah tidak tertutup skill lain.

**Speaking hanya dilaporkan (keputusan user).** Bintangnya tampil di hasil & Rapor, tapi tidak memengaruhi naik/tetap. Di perangkat tanpa mic, Speaking dilewati.

Kenapa 80% per skill cocok dengan riset: setara Cambridge YLE "4–5 shields di SETIAP skill" (shield 4 ≈ 80%) dan ambang mastery Bloom 80–90%. Lebih ketat dari batas lulus Key/PET (60–72%), jadi anak yang naik benar-benar sudah menguasai level itu.

### 5.2 Ambang dan jumlah soal per level

Aturan jumlah soal (keputusan user): mulai dari Little Stars **5 soal per skill objektif**, lalu tiap naik 1 level **+3 soal per skill objektif**. **Soal Speaking tetap seperti usulan awal** (3/3/4/4/5/5), karena Speaking cuma pendukung.

| Level | Tier | Soal per skill (Vocab, Listening, Reading, Grammar) | Soal Speaking | Total soal | Lulus per skill (≥ 80%) | Perkiraan lama total | Per sesi skill |
|---|---|---|---|---|---|---|---|
| Little Stars | Dasar | 5 | 3 | **23** | ≥ 4 dari 5 | ±12–15 mnt | ±3 mnt |
| Starter | Dasar | 8 | 3 | **35** | ≥ 7 dari 8 | ±18–23 mnt | ±4–5 mnt |
| Explorer | Menengah | 11 | 4 | **48** | ≥ 9 dari 11 | ±25–32 mnt | ±6–7 mnt |
| Adventurer | Menengah | 14 | 4 | **60** | ≥ 12 dari 14 | ±31–39 mnt | ±7–9 mnt |
| Achiever | Lanjut | 17 | 5 | **73** | ≥ 14 dari 17 | ±38–48 mnt | ±9–11 mnt |
| Trailblazer | Lanjut | 20 | 5 | **85** | ≥ 16 dari 20 | ±44–55 mnt | ±10–13 mnt |

Cara menghitung waktu: ±30–38 detik per soal objektif (termasuk dengar audio & feedback) dan ±45–55 detik per soal Speaking. Kolom "per sesi skill" = 1 skill objektif sekali duduk.

Rasional:
- Ambang 80% sama di semua level (keputusan user). Jumlah benar minimal = 80% dibulatkan ke atas, jadi di beberapa level syarat sebenarnya sedikit di atas 80% (Starter 7/8 = 87,5%, Adventurer 12/14 = 86%, Explorer 9/11 = 82%, Achiever 14/17 = 82%).
- ⚠️ Risiko: Little Stars (3–5 th) cuma boleh salah 1 dari 5 per skill, dan 1 tap tidak sengaja sudah bisa menahan anak. Mitigasinya: zona batas (di bawah) + tes ulang tanpa batas dengan soal baru.
- Karena keputusan murni dari tes, jumlah soal di level atas mendekati ujian sungguhan: Trailblazer 20 soal per skill = setara Cambridge (20–25 soal per paper Listening).
- Semua jumlah soal objektif (5, 8, 11, 14, 17, 20) bisa menghasilkan bintang 0–5 lengkap (dicek skrip). **Catatan Speaking:** 3 soal cuma bisa 0/2/3/5 bintang dan 4 soal tidak bisa 2 bintang ([test_perlevel.md](test_perlevel.md) §8.2). Diterima sadar (keputusan user): Speaking hanya dilaporkan, tidak memengaruhi keputusan naik.

Catatan penting:
- **Tes WAJIB dipecah per skill** (bukan cuma boleh). Mulai Starter total waktunya di atas rentang perhatian anak kalau sekali duduk (Starter ±18–23 mnt, Trailblazer ±44–55 mnt). Tiap skill jadi 1 sesi sendiri (±3–13 mnt), kemajuan tersimpan, anak boleh istirahat antar skill. Ini juga pola Cambridge (paper terpisah).
- **Pool soal Listening Explorer/Adventurer harus diperluas dulu.** Pool sekarang cuma 19/20 soal, padahal tes butuh 11/14. Tes ulang akan hampir pasti mengulang soal yang sama. Sumber tambahan: `kenalanGame` (10 per topik) dan `story` + `question`. Speaking Explorer–Achiever (pool 35–36, butuh 4–5) masih cukup untuk 3–4 kali tes tanpa banyak pengulangan.

**Zona batas.** Kalau sebuah skill kurang TEPAT 1 jawaban dari syarat lulus, tambahkan 3 soal ekstra untuk skill itu. Kalau 3 soal ekstra benar semua, skill itu dianggap lolos. Ini mengikuti peringatan Cambridge "±3 poin".

### 5.3 Tiga hasil yang tampil ke anak

| Hasil | Syarat | Yang terjadi |
|---|---|---|
| 🌟 **"Raja Ditaklukkan! Kamu Hebat!"** | Semua skill ≥ 95% | Naik level + lencana emas (setara Grade A). |
| 👑 **"Raja Ditaklukkan!"** | Semua skill ≥ 80% | Naik level + 1–2 misi penguatan di skill terendah (opsional). |
| 💪 **"Hampir! Yuk latih ini dulu"** | Ada skill < 80% | Tetap di level. Muncul misi: 2–3 topik dengan salah terbanyak di tes (dari `topicId` soal), langsung ke Latihan Inti. |

Setelah hasil 💪:
- Tes boleh diulang kapan saja, dengan soal baru.
- Rekomendasi ringan: tombol "Tantang Lagi" paling menonjol setelah minimal 1 misi dikerjakan, tapi tidak dikunci.

### 5.4 Bentuk soal per skill

Prinsip: soal tes = bentuk **Tantangan** level itu, ditarik acak per topik (1 topik maksimal 1–2 soal per skill), opsi selalu diacak.

| Skill | Dasar (Little Stars / Starter) | Menengah (Explorer / Adventurer) | Lanjut (Achiever / Trailblazer) |
|---|---|---|---|
| Vocab | Dengar kata → pilih gambar (kata ber-ikon aman saja) | Campur: dengar → teks, "Apa bahasa Inggrisnya…?", isi kalimat | + 5 opsi, kata abstrak lewat kalimat, bukan emoji |
| Listening | Kalimat + **pertanyaan diputar**, pilih gambar | Kalimat + pertanyaan, 3–4 opsi (tambah `decoys`) | Achiever: Lengkapi Catatan. Trailblazer: Dengar & Simpulkan |
| Reading | Little Stars: kalimat → gambar. Starter: gambar → kalimat (pengecoh `near`) | Teks tampil utuh (bukan cuma baris bukti), Benar/Salah, detail, Lengkapi Cerita | Cek Pernyataan (True/False/Doesn't say), Kalimat yang Hilang, sikap penulis |
| Grammar | Dengar → tunjuk kartu kontras (formA **dan** formB) | Pilih Bentuk yang Pas (4 opsi dari `wrong`) | Achiever: teks pendek + rumpang. Trailblazer: pilih hasil transformasi dari kutipan |
| Speaking (pendukung) | Tirukan frasa | Pilih & Ucapkan | Pilih & Ucapkan / jawab cerita |

Bank soal:
- Pakai item materi, tapi **arah atau bentuknya diubah** dari yang terakhir anak lihat. Contoh: Latihan Inti "baca → gambar", tes "gambar → kalimat".
- Hindari pengulangan dalam 3 percobaan terakhir.
- Tidak perlu authoring bank terpisah dulu. Itu bisa jadi tahap berikutnya kalau ada data.

### 5.5 Laporan ke orang tua (Rapor)

Pola Cambridge Statement of Results + Pearson + English 1:
- Riwayat Tantangan Raja per level: tanggal, bintang per skill, hasil (🌟/👑/💪).
- Kalimat "Anak bisa…" per skill, dari deskriptor CEFR young learners.
- Contoh untuk Starter Listening: "Bisa memahami kalimat pendek tentang benda di sekitarnya."
- Dihubungkan ke kartu yang sudah ada ("Kekuatan Sekarang" / "Misi Berikutnya").

---

## 6. Perbaikan yang Dibutuhkan (Urut Prioritas)

Poin 1–3 berlaku apa pun keputusan di §7, karena itu bug validitas.

1. **Acak opsi Listening di tes** dan putar/tampilkan pertanyaannya. Sekarang kartu pertama selalu benar.
2. **Tutup celah skor:**
   - Kunci tombol setelah jawaban benar.
   - Tap pill tidak boleh mereset `firstTry`.
   - Mengulang skill harus memakai set soal baru.
   - Cek `isConnected` di `setTimeout`.
3. **Pisahkan jawaban tes dari akurasi global Rapor.**
4. **Perbaiki adapter per skill** supaya setara Tantangan level (§5.4):
   - Grammar: menguji `key`/`wrong`.
   - Reading: teks utuh + bentuk `gap`/`ref`/`reply`/`missing`/`tfn` yang benar.
   - Listening: memakai format catatan/dialog di Achiever/Trailblazer.
   - Vocab: menyaring emoji kembar, `iconAmbiguous`, dan memakai override gambar.
5. **Ambil soal per topik (stratified)** dan perluas pool Listening/Speaking Explorer–Achiever (`kenalanGame`, `story`).
6. **Genapkan ke 6 level** (hapus jalur legacy 8 soal).
7. **Simpan hasil tes** di `Store`: `bossResults[level]` berisi tanggal, skor per skill, dan hasil. Sync ke portal. Tampilkan di Rapor.
8. **Implementasi aturan §5** (kalau disetujui):
   - Ambang per level.
   - Jumlah soal per level (§5.2) + tes dipecah per skill.
   - Tiga hasil.
   - Misi dari topik yang lemah.
   - Copy Arena.
9. **Perbaiki tampilan lain:**
   - `mapBossPct` di Peta Level memakai hitungan global, bukan per level (`app.ts:1195`).
   - [test_perlevel.md](test_perlevel.md) sudah basi soal format Reading.

---

## 7. Keputusan User

1. **✅ Diputuskan: Opsi A** — Tantangan Raja boleh menahan anak di level (dengan 3 hasil non-punitive §5.3). Pertanyaan awalnya: **Apakah Tantangan Raja boleh menahan anak di level?** Ini mengubah PRD §4.6/§14.8 ("menang = semua ronde dicoba").
   - **Opsi A (rekomendasi):** boleh, dengan 3 hasil non-punitive di §5.3. Ini pola semua lembaga di Indonesia (LIA/EF: promotion test) dan Kurikulum Merdeka.
   - **Opsi B:** tetap selalu naik. Skor cuma dilaporkan ke orang tua (pola Cambridge YLE murni). Kalau pilih ini, §6 poin 1–7 tetap perlu supaya laporannya benar.

   **Contoh — Dina, level Starter (8 soal per skill, lulus ≥ 7 dari 8):**

   | Skill | Benar | Status |
   |---|---|---|
   | Vocabulary | 8/8 | lolos |
   | Listening | 6/8 | kurang 1 |
   | Reading | 7/8 | lolos |
   | Grammar | 7/8 | lolos |
   | Speaking | ⭐⭐⭐ | dilaporkan saja |

   - **Opsi A:**
     1. Listening kurang tepat 1, jadi muncul 3 soal Listening tambahan (zona batas).
     2. Kalau 3 soal itu benar semua: layar 👑 "Raja Ditaklukkan!", Explorer terbuka.
     3. Kalau tidak: layar 💪 "Hampir! Yuk latih Listening dulu". Dina tetap di Starter, semua materi Starter tetap terbuka, dan muncul 2–3 misi dari topik Listening yang salah (mis. "Di Sekolah", "Hewan"). Tombol "Tantang Lagi" bisa ditekan kapan saja dengan soal baru. Explorer baru terbuka setelah Dina lolos.
   - **Opsi B:**
     1. Layar langsung "Raja Ditaklukkan!", Explorer terbuka, apa pun skornya.
     2. Bintang per skill tampil di layar.
     3. Rapor orang tua mencatat "Listening 6/8 (75%) — perlu dilatih: Di Sekolah, Hewan". Dina bisa latihan kalau mau, tapi tidak wajib.

   **Contoh 2 — Raka, Starter, Listening cuma 3/8:** Opsi A → 💪, tetap di Starter (selisihnya jauh, tidak ada soal tambahan). Opsi B → tetap naik ke Explorer, padahal Listening-nya belum siap untuk materi Explorer.
2. ~~Syarat materi 80% topik~~ → **diputuskan: tidak dipakai**, fokus ke tes kemampuan.
3. ~~Angka ambang~~ → **diputuskan: lulus wajib ≥ 80% di tiap skill objektif, semua level.**
4. ~~Speaking~~ → **diputuskan: cukup dilaporkan.**
5. ~~Jumlah soal~~ → **diputuskan: +3 per skill objektif per level; Speaking tetap 3/3/4/4/5/5** (§5.2).

---

## 8. Kesiapan Implementasi

### 8.1 Yang sudah siap
- Semua keputusan produk sudah diambil (§7): Opsi A, lulus ≥ 80% per skill, Speaking hanya dilaporkan, jumlah soal §5.2, tanpa syarat materi.
- Bentuk soal per skill per tier (§5.4) dan daftar bug (§6).
- Konten cukup untuk semua skill **kecuali** stok Listening Explorer/Adventurer (perlu diambil juga dari `kenalanGame`, tanpa authoring baru).

### 8.2 Default yang dipakai (tanpa perlu keputusan baru, bisa diubah)
1. **Anak yang SUDAH menaklukkan Raja di versi lama tetap dianggap lolos.** Tidak ada anak yang tiba-tiba terkunci setelah update (non-punitive).
2. **Placement test tidak berubah** — tetap bisa membuka beberapa level sekaligus.
3. **Tes ulang tanpa jeda waktu**, soal baru tiap percobaan (tidak mengulang soal dari 3 percobaan terakhir sejauh stok cukup).
4. **Kemajuan per skill tersimpan**; anak boleh berhenti di tengah dan lanjut nanti. Skill yang sudah lolos tidak perlu diulang di percobaan berikutnya (cukup skill yang belum lolos).
5. **Misi setelah 💪** = 2–3 topik dengan jawaban salah terbanyak di skill yang belum lolos, membuka Latihan Inti topik itu.
6. **Level di bawah level anak tetap terbuka penuh** (aturan CLAUDE.md tidak berubah).

### 8.3 Dokumen yang ikut diubah saat implementasi
- PRD §4.6/§14.8 dan CLAUDE.md: "Tantangan Raja tidak pernah menahan" diganti aturan baru ini.
- [test_perlevel.md](test_perlevel.md): tandai sebagai digantikan dokumen ini untuk jumlah soal & aturan naik.

### 8.4 Tahapan
| Tahap | Isi | Hasil yang bisa dicek |
|---|---|---|
| 1. Perbaikan validitas | §6 poin 1–3: acak opsi Listening + putar pertanyaan, tutup celah skor, pisahkan akurasi tes dari Rapor | Tes lama langsung lebih jujur |
| 2. Bentuk soal per skill | §5.4 / §6 poin 4–6: adapter setara Tantangan per tier, sampling per topik, stok Listening, jumlah soal §5.2, semua 6 level | Tiap level menguji materinya sendiri |
| 3. Aturan naik/tetap | §5.1–§5.3: ≥ 80% per skill, zona batas, 3 hasil, misi, tes per skill, penyimpanan hasil + sync | Anak bisa tertahan secara non-punitive |
| 4. Rapor | §5.5: riwayat tes + bintang per skill + kalimat "Anak bisa…" | Orang tua melihat hasil tes |

Tiap tahap diverifikasi `npm run build` + browser 390px & 1280px di 6 level.

---

## 9. Implementasi (2026-09-29)

| Bagian | File |
|---|---|
| Bank soal per skill & tier, jumlah soal, ambang 80%, soal bonus | `app/src/games/boss-bank.ts` |
| Arena 5 babak, soal ber-bullet progress, hasil babak, misi, menang | `app/src/games/boss.ts` |
| Penyimpanan run/lolos/skor terbaik/riwayat (`Store.bossTests`), event `boss_skill` | `app/src/progress.ts` |
| Layar Arena & menang, misi → Latihan Inti, persentase "menuju level", kartu Rapor "🏰 Hasil Tantangan Raja" | `app/src/app.ts` |
| Tampilan (`.boss-hub`, `.boss-skill-*`, `.boss-list`, `.boss-tf`, `.boss-playing`) | `app/public/styles.css` |

- Tahap 1 (bug): opsi Listening selalu diacak & pertanyaan dibacakan + ditampilkan; 1 tap = jawaban terkunci (tap dobel / tap pill tidak bisa menggandakan atau mereset skor); jawaban tes tidak masuk akurasi global; `setTimeout` lama diganti tombol "Lanjut".
- Tahap 2 (soal): bentuk soal = Tantangan level (§5.4), merata per topik, hindari soal 3 percobaan terakhir; stok Listening Explorer/Adventurer diperluas dari `kenalanGame` + cerita (± 100 soal/level). Jalur legacy 8 soal & `PILOT_LEVELS` dihapus.
- Tahap 3 (aturan): ≥ 80% per babak utama, 3 soal bonus kalau kurang tepat 1, 3 hasil (lolos / hampir → bonus / belum lolos + misi), Speaking bonus. "Menuju level berikutnya" = ½ materi level ini tuntas + ½ babak lolos (dulu salah hitung lintas level).
- Tahap 4 (Rapor): kartu bintang terbaik tiap babak + status per level.
- **Verifikasi**: `npm run build` lolos (termasuk `scripts/verify-boss-bank.mjs`, permanen); skrip bank (semua soal 6 level × 5 skill, sampel 30 pick/skill) → 0 soal tanpa tepat 1 jawaban benar / opsi kembar; Playwright 390px & 1280px di 6 level (Arena + soal pertama tiap babak + jawab) → 0 pageerror, tanpa scroll horizontal; alur lolos → menang ("Raja Kelinci Ditaklukkan!"), hampir → soal bonus → belum lolos → misi membuka Latihan Inti topik yang tepat, lanjut setelah reload (soal 6/20), popup keluar hanya di layar soal, kartu Rapor tampil.
- **Lanjutan (sesi yang sama)**:
  - *Anti-tebak*: Vocab "dengar" Dasar = kartu gambar saja (tulisan = bunyi yang diucapkan); topik tanpa gambar aman / `iconAmbiguous` tidak dapat tipe ini. Reading Lengkapi Cerita/Rujukan: pengecoh dari baris SELAIN bukti & sejenis (nama↔nama, angka↔angka, kata awal kalimat bukan nama). Soal bentuk khas level (cerita/catatan/dialog ber-pengecoh, bentuk Cambridge) dijatah ⅔.
  - *Speaking*: diuji dgn mic tiruan (Playwright, SpeechRecognition palsu + perangkat audio palsu) di 5 level — skor proporsional (ucapan lengkap ⭐⭐⭐, separuh ⭐⭐, lain ⭐), "▶️ Play Suaramu" aktif, hasil bonus tercatat.
  - *Sinkron antar perangkat*: kolom `child_progress_state.boss_tests` (JSONB, migrasi `20260929090000_add_boss_tests`), disimpan `upsertStoreSnapshot` & dikirim balik `rebuildStoreForChild`; `mergeFromServer` → `mergeBossTests` (babak lolos union, skor terbaik max, riwayat digabung, run yang sedang dikerjakan di perangkat ini menang). Diuji: SQL simpan/baca (transaksi ROLLBACK) & skenario 2 perangkat.
  - *Rapor*: kalimat "Anak bisa…" (✓ hijau) di bawah tiap babak lolos, 3 tier (`CAN_DO`, `app.ts`).
  - `scripts/verify-boss-bank.mjs` masuk `npm run build`; CSS `.boss-phase*` lama dihapus.
- **Masih terbuka (butuh orang/konten)**: uji ke anak sungguhan (ambang 80% di Little Stars paling ketat); di Listening Dasar kata jawaban memang terdengar di kalimat (perlu penulisan ulang konten ala Cambridge — pengecoh ikut disebut); uji mic di HP asli.

---

## Sumber

**Indonesia**
- [LIA Depok FAQ (syarat absen promotion test)](https://www.lia-depok.ac.id/faq)
- [LIA Depok Promotion Test](https://www.lia-depok.ac.id/promotion-test)
- [LIA Depok GEYL](https://www.lia-depok.ac.id/program/reguler/?id=11)
- [LIA Kalideres GEYL](https://lbliakalideres.com/general-english-for-young-learners/)
- [LIA FAQ](https://lia.ac.id/index/faq)
- [LIA Pamulang FAQ](https://sites.google.com/view/lbliapamulang/faqs)
- [English 1 (EF Indonesia)](https://english1.co.id/)
- [English 1 Small Stars](https://english1.co.id/program/smallstars/)
- [EF info lama](https://www.english1.com/blog/about-ef/tefl-partners-info/)
- [Pengalaman tes level EF](http://inipengalaman.blogspot.com/2015/07/ikut-test-di-ef-english-first.html)
- [Review orang tua EF](https://keluargasirkus.com/kursus-bahasa-inggris-ef-english-first-review-oleh-keluarga-sirkus/)
- [ILP Kids](https://www.ilp.co.id/ilp-kids)
- [TBI](https://corporate.tbi.co.id/)
- [IALF Young Learners](https://www.ialf.edu/english-for-young-learners-in-bali)
- [Kampung Inggris LC Kids](https://www.kampunginggris.id/english-smart-kids-teens-1-bulan)
- [English Academy FAQ](https://www.english-academy.id/faq)
- [Cakap Kids](https://cakap.com/kids-academy/cakap-kids-offline/)
- [Skripsi UMS (Kumon SWP)](https://eprints.ums.ac.id/39824/30/publikasi.pdf)
- [Kumon English (cabang)](https://kumonbandarsunway.wordpress.com/2008/09/24/understanding-kumon-english/)
- [Twinkl — kenaikan kelas Kurikulum Merdeka](https://www.twinkl.com/teaching-wiki/kriteria-kenaikan-kelas-kurikulum-merdeka)
- [Kumparan — kriteria kenaikan kelas](https://kumparan.com/ragam-info/kriteria-kenaikan-kelas-kurikulum-merdeka-yang-wajib-diketahui-22syoO15tSK)
- [KKTP — digitaleducation.id](https://digitaleducation.id/blog/kktp-kurikulum-merdeka-pengertian-cara-membuat-contoh-format)
- [Panduan Pembelajaran & Asesmen 2024](https://www.slideshare.net/slideshow/panduan-pembelajaran-dan-asesmen-ed-2024-pdf/270659878)
- [Tinggal kelas Kurikulum Merdeka](https://mamakpintar.com/siswa-tak-naik-kelas-pada-kurikulum-merdeka/)
- [CP Bahasa Inggris SD](https://meqaplus.com/capaian-pembelajaran-cp-bahasa-inggris-sd-fase-b-dan-c-kurikulum-merdeka/)

**Cambridge**
- [Starters results](https://www.cambridgeenglish.org/exams-and-tests/starters/results/)
- [Starters format](https://www.cambridgeenglish.org/exams-and-tests/qualifications/young-learners/paper/starters/format/)
- [Movers format](https://www.cambridgeenglish.org/exams-and-tests/qualifications/young-learners/paper/movers/format/)
- [Flyers format](https://www.cambridgeenglish.org/exams-and-tests/qualifications/young-learners/paper/flyers/format/)
- [YLE FAQ (PDF)](https://www.cambridgeenglish.org/Images/722414-cambridge-english-qualifications-for-young-learners-faqs.pdf)
- [YLE Handbook for teachers](https://res.cloudinary.com/swiss-exams/image/upload/v1697905392/Cambridge_Pre_A1_A2_Young_Learners_Handbook_for_teachers_pdf_dc10b199e4.pdf)
- [Konversi skor tes latihan ke Cambridge English Scale (2023)](https://www.cambridgeenglish.org/Images/210434-converting-practice-test-scores-to-cambridge-english-scale-scores.pdf)
- [British Council — B1 Preliminary](https://www.britishcouncil.ro/en/exam/cambridge/english-levels/b1-preliminary-pet)
- [Keselarasan YLE–KET](https://www.31boulevards.com/single-post/2018/02/25/the-alignment-of-starters-movers-and-flyers-and-key-for-schools)
- [flyer.us — shields (pihak ketiga)](https://flyer.us/shields-in-starters-movers-and-flyers-exams/)
- [Cambridge Primary Checkpoint](https://www.cambridgeinternational.org/programmes-and-qualifications/cambridge-primary/assessment/cambridge-primary-checkpoint/)

**Internasional lain**
- [Trinity GESE Initial guide](https://www.trinitycollege.com/resource?id=5650)
- [Trinity GESE results](https://www.trinitycollege.com/qualifications/SELT/GESE-results)
- [Pearson English Tests for Young Learners — spesifikasi](https://www.pearson.com/content/dam/one-dot-com/one-dot-com/pearson-languages/en-gb/pdfs/Pearson-English-Tests-for-Young-Learners-public-specification.pdf)
- [Oxford Young Learners Placement Test](https://elt.oup.com/feature/global/young-learners-placement/)
- [British Council Primary English Test](https://www.britishcouncil.org/exam/english/english-assessment-schools/primary-english-test)
- [Khan Academy mastery levels](https://support.khanacademy.org/hc/en-us/articles/5548760867853--How-do-Khan-Academy-s-Mastery-levels-work)
- [Novakid certificate](https://www.novakidschool.com/blog/novakid-certificate/)
- [Duolingo ABC](https://abc.duolingo.com/how-we-teach)
- [Lingokids level](https://help.lingokids.com/hc/en-us/articles/360019924937-How-do-I-know-what-my-kid-s-level-is)
- [Buddy.ai speech recognition](https://www.unite.ai/buddy-ai-children-language-learning-speech-recognition/)

**Riset**
- [Mastery learning](https://en.wikipedia.org/wiki/Mastery_learning)
- [Guskey — mastery learning (ERIC)](https://files.eric.ed.gov/fulltext/ED490412.pdf)
- [Jimerson 2001 — grade retention](https://eric.ed.gov/?id=EJ667518)
- [Hattie — effect sizes](https://www.edweek.org/leadership/opinion-john-hattie-isnt-wrong-you-are-misusing-his-research/2018/06)
- [Meta-analisis tinggal kelas](https://pubmed.ncbi.nlm.nih.gov/20717492/)
- [British Council — assessing young learners](https://www.britishcouncil.org/research-insight/assessing-language-young-learners)
- [Council of Europe — descriptors young learners](https://www.coe.int/en/web/common-european-framework-reference-languages/bank-of-supplementary-descriptors)
- [Deskriptor CEFR usia 7–10](https://logos.edu.iwate-u.ac.jp/jhoffice/wp-content/uploads/sites/6/2019/04/COLLATED-REPRESENTATIVE-SAMPLES-DESCRIPTORS-YOUNG-LEARNERS-VOLUME-1-AGES-7-10-2018-Just-A1.pdf)
- [Deskriptor Pre-A1](https://dgff.de/assets/Uploads/ZFF-2-2019-05-McElwee-Devine-Saville.pdf)
- [Spearman-Brown (JALT)](https://teval.jalt.org/test/bro_9.htm)
- [Kid-Whisper (ASR anak)](https://arxiv.org/html/2309.07927)
- [Child speech recognition gap](https://the-learning-agency.com/guides-resources/closing-the-child-speech-recognition-gap-evidence-limitations-and-paths-forward/)
- ["The power of Not Yet"](https://www.teachertoolkit.co.uk/2014/12/24/the-power-of-not-yet-by-teachertoolkit/)
