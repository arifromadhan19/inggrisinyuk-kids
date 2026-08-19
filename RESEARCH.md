# Riset: Sistem Level Bahasa Inggris untuk Anak

Terakhir diupdate: 2026-08-19

Dokumen ini adalah **riset mentah** (bukan keputusan produk) tentang bagaimana lembaga bahasa Inggris internasional dan Indonesia melevelkan kemampuan anak. Kesimpulan & rekomendasi final untuk leveling aplikasi ada di [PRD.md](PRD.md) — dokumen ini jadi rujukan/backing data-nya.

---

## 1. Konteks

Di repo ini sudah ada beberapa prototipe HTML yang mengarah ke aplikasi latihan bahasa Inggris untuk pemula/anak:

- `bro_arule_kampung_inggris_vocabulary_practice.html` — latihan vocabulary
- `percakapan_perkenalan_interactive_app.html` — latihan percakapan perkenalan diri
- `daily-conversation-asr.html` — latihan percakapan harian (belanja di toko) dengan ASR (speech recognition)

Pertanyaan yang perlu dijawab sebelum lanjut coding: **apakah ada standar level kemampuan bahasa Inggris untuk anak**, sebagaimana CEFR (A1–C2) untuk orang dewasa? Jawabannya: **ada, tapi tidak tunggal** — ada beberapa sistem dari lembaga internasional yang mengadaptasi CEFR untuk anak, dan kurikulum nasional Indonesia punya sistem "Fase" sendiri yang di-referensikan longgar ke CEFR. Detail di bawah.

---

## 2. Recap: CEFR untuk Dewasa

CEFR (*Common European Framework of Reference for Languages*) punya 6 level dalam 3 blok:

| Blok | Level | Deskripsi |
|---|---|---|
| A — Basic User | A1, A2 | Pemula, komunikasi dasar |
| B — Independent User | B1, B2 | Bisa berkomunikasi mandiri di berbagai konteks |
| C — Proficient User | C1, C2 | Mahir, mendekati penutur asli |

CEFR dirancang generik untuk **semua usia**, tapi deskriptornya ("dapat menulis surat resmi", "dapat mendiskusikan topik abstrak") kurang relevan untuk anak kecil — anak usia 6 tahun yang cakap secara sosial-emosional tetap tidak akan pernah mencapai deskriptor B1 versi dewasa karena konteksnya memang bukan untuk anak. Ini yang mendorong lembaga-lembaga besar membuat **turunan CEFR khusus anak**.

---

## 3. Sistem Leveling Anak dari Lembaga Internasional

### 3.1 Cambridge English Qualifications for Young Learners (YLE)

Paling banyak dipakai sebagai acuan global untuk anak usia SD. Tiga tingkat, tiap tingkat punya 3 komponen (Listening, Reading/Writing, Speaking):

| Level Cambridge | Setara CEFR | Usia indikatif (tidak baku) | Kemampuan inti |
|---|---|---|---|
| Pre A1 Starters | Pre-A1 | ~6–8 tahun | Eja nama sendiri, sebut umur, kosakata dasar |
| A1 Movers | A1 | ~7–9 tahun | Percakapan sederhana, jawab pertanyaan seputar kehidupan sehari-hari |
| A2 Flyers | A2 | ~8–11 tahun | Menyusun & menyambung kalimat, cerita pengalaman |

Setelah Flyers, jalur berlanjut ke ujian "for Schools" versi remaja: A2 Key for Schools (A2), B1 Preliminary for Schools (B1), B2 First for Schools (B2).

Sumber: [Cambridge English Qualifications for young learners](https://www.cambridgeenglish.org/exams-and-tests/qualifications/young-learners/), [Wikipedia — Cambridge English: Young Learners](https://en.wikipedia.org/wiki/Cambridge_English:_Young_Learners), [Starters, Movers and Flyers overview](https://issuu.com/cambridgeupelt/docs/357180-starters-movers-and-flyers-handbook-for-tea/s/17218595)

### 3.2 Pearson — Global Scale of English (GSE), Young Learners Framework

- Skala numerik granular 10–90 (bukan cuma 6 huruf seperti CEFR), memetakan learning objectives yang sangat spesifik per skill (speaking/listening/reading/writing).
- Ada framework terpisah untuk **Pre-primary**, **Young Learners (usia 6–14 tahun)**, general adult, professional, academic.
- Tes "English Benchmark – Young Learners" untuk usia 6–13 tahun, mencakup GSE skala 10–58 (kira-kira Pre-A1 s/d awal B1).

Kelebihan GSE: lebih granular dari CEFR sehingga progres anak antar level terasa lebih halus (cocok untuk gamifikasi/badge di aplikasi).

Sumber: [The Global Scale of English for educators](https://www.pearson.com/languages/en-us/why-pearson/the-global-scale-of-english/educators.html), [GSE Assessment Framework – Young Learners (PDF)](https://www.pearson.com/content/dam/one-dot-com/one-dot-com/pearson-languages/en-gb/pdfs/gse/gse-resources/gse-assessment-framework-young-learners.pdf), [Benchmark Test – Young Learners](https://www.pearson.com/languages/educators/connected-english-learning-program/benchmark-test-young-learners.html)

### 3.3 ETS — TOEFL Primary & TOEFL Junior

- **TOEFL Primary**: untuk anak lebih muda (mulai usia 8 tahun), 2 tingkat (Step 1 & Step 2), skor dipetakan ke CEFR A1–B2.
- **TOEFL Junior**: untuk usia 11+, skor Standard test dipetakan ke Below A2 / A2 / B1 / B2.

Karakteristik: berbasis skor numerik (bukan pass/fail per level seperti Cambridge YLE), lalu dipetakan ke pita CEFR.

Sumber: [Mapping of the TOEFL Primary tests](https://www.etsglobal.org/re/en/help-center/test-content/are-toefl-primary-test-scores-mapped-to-the-cefr), [Mapping of the TOEFL Junior tests](https://www.etsglobal.org/ma/en/help-center/test-content/are-toefl-junior-standard-test-scores-mapped-to-the-cefr)

### 3.4 British Council — Panduan Usia-ke-CEFR (bukan level formal)

British Council tidak membuat "CEFR anak" sebagai produk sertifikasi terpisah untuk semua jenjang, tapi menerbitkan **panduan ekspektasi**: untuk sebagian besar anak usia 3–10 tahun, **A2 di akhir SD adalah target yang bagus**. Poin pentingnya: *CEFR mencerminkan apa yang bisa dilakukan anak, bukan usianya* — tidak ada "level yang benar" untuk usia tertentu.

Untuk usia lebih muda (2–6 tahun), British Council punya produk terpisah **"Learning Time with Timmy"** (kategori **"Early Years"**) — berbasis bermain dengan karakter animasi Aardman, dan secara sengaja **tidak diberi label CEFR** karena di usia ini fokusnya paparan/eksposur, bukan pengukuran proficiency.

Sumber: [Assessing the language of young learners — British Council](https://www.britishcouncil.org/assessing-language-young-learners-0), [How our levels work for kids and teens](https://www.britishcouncil.cz/en/english/courses-children/levels), [Learning Time with Timmy](https://www.britishcouncil.org/english/timmy), [About Learning Time with Timmy](https://www.britishcouncil.org/english/timmy/about)

### 3.5 EF Kids & Teens — Segmentasi Usia (bukan CEFR murni)

EF (lembaga kursus, juga beroperasi di Indonesia dengan 65+ cabang) membagi produk berdasarkan **rentang usia**, bukan skala kemampuan:

| Produk EF | Usia |
|---|---|
| Small Stars | 3–6 tahun |
| High Flyers | 6–10 tahun |
| Trailblazers | 10–14 tahun |
| Front Runners | 14–18 tahun |

Progres CEFR tetap ada di dalam kurikulum tiap band usia, tapi yang di-market ke orang tua adalah kelompok usia, bukan istilah CEFR — pertimbangan yang relevan untuk UX aplikasi anak (orang tua lebih familiar dengan "usia 6–8 tahun" daripada "A1").

Sumber: [EF Kids & Teens](https://ef.design/work/ef-kids-teens), [EF Indonesia](https://www.ef.co.id/)

---

## 4. Kurikulum & Lembaga di Indonesia

### 4.1 Kurikulum Merdeka (Kemendikbudristek) — Sistem "Fase"

Kurikulum nasional tidak memakai istilah CEFR per grade seperti Cambridge, tapi memakai **Fase A–F** (dipakai lintas semua mata pelajaran, bukan cuma Bahasa Inggris):

| Fase | Jenjang/Kelas | Usia indikatif | Fokus Bahasa Inggris | Referensi CEFR |
|---|---|---|---|---|
| A | Kelas 1–2 SD | ~6–8 th | Bahasa Inggris **belum wajib formal** — fokus literasi Bahasa Indonesia dulu | — |
| B | Kelas 3–4 SD | ~8–10 th | Bahasa Inggris **mulai wajib**; fokus lisan (speaking) + pengenalan bahasa tulis | tidak dipatok angka spesifik |
| C | Kelas 5–6 SD | ~10–12 th | Penguatan speaking + writing untuk topik kehidupan sehari-hari (akhir SD) | tidak dipatok angka spesifik |
| D | Kelas 7–9 SMP | ~12–15 th | Interaksi & komunikasi dalam konteks lebih beragam, situasi formal & informal | menuju A2–B1 |
| E | Kelas 10 SMA | ~15–16 th | Penguatan lisan & tulisan | B1 |
| F | Kelas 11–12 SMA | ~16–18 th | Lanjutan Fase E, capaian akhir jenjang menengah | B1–B2 |

**Insight penting**: dokumen resmi (SK BSKAP No. 032/2024) menyatakan capaian pembelajaran Bahasa Inggris keseluruhan **"setara level B1"** sebagai target di akhir jenjang (Fase F), tapi **tidak memberi angka CEFR spesifik per fase A/B/C** seperti yang dilakukan Cambridge YLE (Pre-A1/A1/A2). Jadi tidak ada "CEFR resmi pemerintah untuk tiap kelas SD" — yang ada deskripsi kemampuan kualitatif per fase, dengan CEFR hanya jadi acuan/istilah di level kebijakan makro.

Sumber: [Capaian Pembelajaran Bahasa Inggris pada Kurikulum Merdeka](https://kurikulummerdeka.com/capaian-pembelajaran-bahasa-inggris-pada-kurikulum-merdeka/), [CP Bahasa Inggris SD Fase B dan C — BSKAP 032/2024](https://meqaplus.com/capaian-pembelajaran-cp-bahasa-inggris-sd-fase-b-dan-c-kurikulum-merdeka/), [CP Bahasa Inggris SMA Fase E–F](https://kepalasekolah.id/cp-bahasa-inggris-sma-smk-2025-fase-e-f/), [Panduan Mapel Bahasa Inggris Fase B–F (Kemendikdasmen, PDF)](https://kurikulum.kemendikdasmen.go.id/file/panduan/dokumen/3.%20Final%20Panduan%20Mata%20Pelajaran%20Bahasa%20Inggris_12_09_2025_Revisi%203.pdf)

### 4.2 Lembaga Kursus Swasta di Indonesia

Berbeda dari kurikulum sekolah negeri, lembaga kursus privat justru **eksplisit memakai CEFR** sebagai jualan ke orang tua karena lebih terukur dan diakui internasional:

- **EF Kids Indonesia** — pakai band usia (lihat 3.5) dengan progres internal ke arah CEFR.
- **LIA (Lembaga Bahasa LIA)** — lembaga tertua di Indonesia (berdiri 1959), ada kelas anak, remaja, dewasa, plus prep TOEFL/TOEIC/IELTS.
- **ILP** — ILP Teens untuk usia 12–15 tahun.
- **Wall Street English** — masuk Indonesia belakangan, berbasis metode internasional (asal Italia, 1972).
- **IELC** dan kursus sejenis — eksplisit memakai CEFR sebagai struktur kurikulum, dengan textbook dari Cambridge University Press, Pearson, Macmillan, Oxford.

Sumber: [10 rekomendasi kursus Bahasa Inggris — IELC](https://ielc.co.id/10-rekomendasi-kursus-bahasa-inggris-terbaik-di-indonesia/), [8 kursus Bahasa Inggris untuk anak — IELC](https://ielc.co.id/8-kursus-bahasa-inggris-terbaik-untuk-anak-di-indonesia/)

---

## 5. Tabel Ringkasan Lintas Sistem

| Usia | CEFR (adaptasi anak) | Cambridge YLE | Pearson GSE (approx.) | TOEFL Primary/Junior | Fase Kurikulum Merdeka |
|---|---|---|---|---|---|
| 3–6 | Pre-A1 (pra-baca/tulis) | — | Pre-primary framework | — | (PAUD / Fase Fondasi) |
| 6–8 | Pre-A1 → A1 | Pre A1 Starters | ~10–29 | TOEFL Primary Step 1 | Fase A (belum wajib formal) |
| 8–10 | A1 | A1 Movers | ~22–42 | TOEFL Primary Step 2 | Fase B |
| 10–12 | A1–A2 | A2 Flyers | ~30–50 | TOEFL Junior (mulai 11+) | Fase C |
| 12–15 | A2–B1 | A2 Key for Schools | ~36–58 | TOEFL Junior Standard | Fase D |
| 15–18 | B1–B2 | B1 Preliminary / B2 First for Schools | 58+ | — | Fase E–F |

> Catatan: angka usia & GSE di tabel ini bersifat **indikatif**, dirangkum dari beberapa sumber berbeda yang tidak selalu sepenuhnya konsisten satu sama lain (wajar — CEFR mengukur kemampuan, bukan usia). Gunakan sebagai peta kasar, bukan aturan kaku.

---

## 6. Insight untuk Produk

1. **Tidak ada satu "CEFR anak" resmi tunggal** — yang ada adalah beberapa adaptasi (Cambridge YLE, Pearson GSE Young Learners, TOEFL Primary/Junior) yang semuanya bermuara balik ke CEFR Pre-A1 s/d B2, plus sistem usia nasional (Fase Kurikulum Merdeka) yang lebih longgar dan tidak memberi angka CEFR per jenjang SD.
2. **Untuk anak usia SD (target pasar paling mungkin untuk app ini berdasarkan prototipe yang ada — vocabulary dasar, perkenalan diri, percakapan belanja), rentang level yang relevan cuma 3: Pre-A1, A1, A2.** Ini menyederhanakan desain leveling — tidak perlu meniru 6 level CEFR penuh.
3. **Orang tua Indonesia lebih familiar dengan usia/kelas SD daripada istilah CEFR** (pola EF & kurikulum nasional) — sebaiknya UI aplikasi menampilkan level dengan nama yang ramah anak/orang tua (mis. "Level 1: Pemula"), dengan CEFR sebagai label teknis sekunder (mis. badge kecil "≈ A1") untuk kredibilitas, bukan istilah utama.
4. **Skala granular ala GSE (10–90)** bisa jadi inspirasi bagus untuk sistem XP/progress bar di aplikasi — CEFR/Cambridge YLE terlalu kasar (cuma 3 tingkat) untuk motivasi jangka panjang berbasis gamifikasi.
5. Materi yang sudah ada di prototipe (perkenalan diri, belanja di toko, vocabulary dasar) **konsisten dengan level Pre-A1–A1** menurut semua sistem di atas.

---

## 7. Pertimbangan & Rationale Keputusan Produk

Catatan diskusi di balik keputusan level final di [PRD.md](PRD.md) — disimpan di sini supaya PRD tetap ringkas.

**Kenapa 5 level, sampai B1 (bukan berhenti di A2):**
Awalnya diusulkan berhenti di A2 karena B1 penuh butuh gramatika & topik abstrak setingkat SMP–SMA (effort konten jauh lebih besar). Tapi ada referensi kompetitor (screenshot UI) yang punya pill level Pre-A1/A1/A2/B1 dengan B1 ditandai "usia 12+ · jalur lanjutan · 2 modul" — B1 ditawarkan sebagai pilihan ringkas berbasis usia, bukan kurikulum penuh. Pola ini selaras dengan riset: Fase D Kurikulum Merdeka (SMP, 12–15 th) menargetkan A2→B1 (§4.1), dan Cambridge sendiri punya jalur A2 Key for Schools → B1 Preliminary for Schools di usia yang sama (§3.1). Kesimpulan: B1 dimasukkan tapi diperlakukan sebagai **"jalur lanjutan"** (pilihan berbasis usia, modul terbatas/preview) — bukan level berurutan wajib seperti Level 1–4, supaya bisa menjangkau usia SMP awal tanpa komitmen konten sebesar 4 level SD sekaligus.

**Kenapa placement test adaptif tidak dipakai di v1:**
Placement test adaptif butuh bank soal + algoritma scoring — investasi besar yang tidak sepadan untuk baru 4–5 level. Onboarding usia/kelas (dengan opsi override manual) dianggap cukup untuk membedakan level di tahap ini; adaptive test bisa ditambahkan nanti kalau jumlah level sudah lebih banyak.

**Kenapa usia 3–4 tahun (Little Stars / Early Years) dipisah dari tangga 5 level, bukan jadi "Level 0":**
Awalnya muncul ide memasukkan usia 3–4 karena tren PAUD/KOBER/TK yang tumbuh di Indonesia. Tapi usia ini **tidak berada di tangga CEFR sama sekali** — semua lembaga besar memperlakukannya sebagai kategori terpisah berbasis usia & metode ("bermain"), bukan proficiency:

| Sumber | Nama segmen | Usia | Catatan |
|---|---|---|---|
| Pearson (GSE) | "Pre-primary" | umumnya < 6 th | Framework terpisah dari "Young Learners" (6–14), bukan skala 10–90 yang sama (§3.2) |
| British Council | "Early Years" — produk *Learning Time with Timmy* | 2–6 th | Play-based, karakter animasi, tanpa label CEFR (§3.4) |
| EF | "Small Stars" | 3–6 th | Lini produk sendiri, terpisah dari "High Flyers" (6–10) yang baru align ke CEFR (§3.5) |
| Cambridge (YLE) | *(tidak ada produk)* | — | YLE baru mulai dari Pre A1 Starters usia ~6+ |
| Kurikulum Merdeka (RI) | "Fase Fondasi" (PAUD/TK) | sebelum Fase A | Istilah pemerintah untuk pra-SD, tanpa target bahasa asing formal (§4.1) |

Konsekuensi teknis & pedagogis kalau segmen ini digarap:
- **Pra-literasi**: anak usia ini belum bisa baca (bahkan Bahasa Indonesia), sementara 3 prototipe existing berbasis teks/dialog.
- **ASR tidak reliable** untuk artikulasi anak usia 3–4 — berisiko langsung untuk prototipe `daily-conversation-asr.html`.
- **Mode belajar beda**: butuh lagu, flashcard, gerakan fisik, didampingi orang tua (parent-assisted), sesi pendek (~5 menit), tanpa badge CEFR sama sekali.

Kesimpulan: dijadikan kandidat track terpisah (nama kerja **"Little Stars"**) untuk fase roadmap berikutnya, bukan bagian dari tangga 5 level maupun MVP.

---

## 8. Referensi Internal: Struktur Konten Project `inggrisinyuk` (Dewasa)

Sebelum menentukan struktur materi & teknologi untuk versi anak, dicek dulu project sepupu `inggrisinyuk` (versi dewasa, di luar repo ini) sebagai referensi:

**Struktur konten**: 6 modul skill — Vocabulary, Grammar, Speaking, Listening, Roleplay, Professional — masing-masing berisi 30 topik ("Day 1–30") per level CEFR, plus Day 31 = placement/level test, dan checkpoint review tiap 5 hari (5/10/15/20).

**Game/mini-aktivitas** (hub terpisah "Latihan Bebas"), 3 jenis, semua tap-based (bukan ketik):
- **Vocab Mission** — cloze/isian cerita, tap chip kata lalu tap ke bagian kosong; chip ditandai hijau (review) vs kuning (challenge/baru); jawaban benar terkunci permanen.
- **Sentence Scramble** ("Susun Kalimat") — susun ulang kalimat dari kata acak dengan tap; melatih urutan kata/sintaksis.
- **Error Spotting** ("Detektif Kalimat") — tap satu kata yang salah di kalimat; feedback instan + penjelasan kontrastif dgn Bahasa Indonesia.

**Leveling & progress**: CEFR A1–C2 penuh, ditentukan lewat placement test & Day-31 test tiap level; progress disimpan di database (Prisma/Postgres) per user/modul/level/hari.

**Tech stack**: Next.js 16 + React 19 + TypeScript + Prisma + PostgreSQL, auth via WhatsApp/Google, pembayaran via Xendit — model bisnis "prompt-delivery" (banyak modul deep-link ke ChatGPT dengan prompt siap pakai, bukan AI in-app). ID ini penting karena **kontras langsung** dengan arah teknologi yang dipilih untuk versi anak (lihat PRD §4) — versi anak sengaja **tidak** mereplikasi backend/DB/auth/payment ini.

**Insight yang dipakai untuk versi anak**:
- Pola "4 kategori skill inti (Vocabulary, Grammar, Listening, Speaking)" relevan dan diadopsi. *(Catatan revisi: draft awal di sini sempat menunda Grammar sampai Achiever — setelah riset lanjutan & konfirmasi kompetitor, keputusan ini direvisi; Grammar ternyata ada dari level termuda di semua kurikulum nyata, cuma beda kompleksitas topik. Detail: §9–10.)*
- Mekanik **Sentence Scramble** & **Vocab Mission** dinilai cocok direplikasi (tap-based, tidak perlu mengetik — ramah anak & pre-reader), tapi **Error Spotting** kurang cocok untuk anak kecil (butuh kemampuan analisis kesalahan yang terlalu tinggi untuk Pre-A1–A1) — kandidat untuk Trailblazer saja.
- "Roleplay" tidak perlu jadi kategori terpisah — 2 dari 3 prototipe existing (perkenalan, belanja) sudah *adalah* roleplay yang menyatu dengan Speaking.
- Modul "Professional" tidak relevan untuk anak.
- Docs desain "Anglora" (game-app RPG belum dibangun, isekai/kingdom/boss-fight framing untuk tiap level CEFR) relevan sebagai referensi gamifikasi jangka panjang, bukan untuk v1.

Sibling folder lain yang dicek: `inggrisin-yuk-kids` (4 file HTML yang sama persis dengan prototipe di repo ini — tampaknya salinan/eksperimen awal, bukan proyek aktif terpisah) dan `inggrisinyuk_backup` (backup `materi_v1`, arsip lama, tidak aktif).

---

## 9. Grammar untuk Anak: Kapan Diajarkan? (Cambridge, Oxford, LIA, Kurikulum Merdeka)

Riset tambahan untuk mengecek ulang keputusan awal ("Grammar eksplisit ditunda sampai Achiever") — apakah lembaga lain benar-benar menunda grammar di level termuda, atau sudah ada dari awal dengan bentuk berbeda.

**Cambridge YLE — grammar list resmi ada di SEMUA level, termasuk Pre A1 Starters:**

| Level Cambridge | Contoh struktur grammar (bukan daftar lengkap) |
|---|---|
| Pre A1 Starters | this/that/these/those, singular/plural nouns, there is/there are, preposisi tempat (in/on/under), simple present, imperative, can (ability), possessive (my/your), kata tanya (what/where/who) |
| A1 Movers | past simple, comparative/superlative, must/mustn't, verb + infinitive/-ing, relative clause (who/which/where), preposisi waktu |
| A2 Flyers | present simple passive, past continuous, present perfect, going to/will, might/may, tag question, zero conditional |

Sumber: [23 Must-Known Topics in Cambridge Starters Grammar](https://flyer.us/cambridge-starters-grammar/), [Grammar and Structures Lists for Movers and Flyers](http://englishmilagrosa.blogspot.com/2015/04/grammar-and-structures-lists-for-movers.html), [Pre A1 Starters, A1 Movers and A2 Flyers Wordlists (resmi, PDF)](https://www.cambridgeenglish.org/Images/739104-starters-movers-flyers-word-list-2025.pdf)

**Oxford Discover / Family and Friends** — dua seri buku ajar young learners terbesar, keduanya punya *grammar syllabus* eksplisit dari Level 1 (usia termuda), disajikan lewat pendekatan inquiry-based/in-context (grammar-in-use lewat teks & tema), bukan hafalan rumus. Ada progres eksplisit per level dengan modul "grammar book" terpisah mulai level 1.

Sumber: [Oxford Discover Level 1 Grammar Book](https://elt.oup.com/catalogue/items/global/young_learners/oxford_discover_second_edition/oxford_discover_second_edition_level_1/9780194052658)

**LIA (Indonesia)** — program "General English for Young Learners" untuk SD kelas 1–6 sudah mencakup "menyusun kalimat untuk percakapan sederhana" (bukan cuma vocabulary) sejak level awal.

Sumber: [General English For Young Learners — LIA](https://lblia.com/kursus-bahasa-inggris-anak-sd/)

**Kurikulum Merdeka** — CP Fase A eksplisit menyebut "unsur kebahasaan" (elemen struktural) sudah jadi bagian capaian sejak fase paling awal (merespons instruksi sederhana, menjawab dengan kata/frasa/kalimat sederhana), bukan ditunda ke fase lebih tinggi. Pendekatannya berbasis teks: makna didukung oleh "fungsi sosial, struktur organisasi, dan unsur kebahasaan yang tepat".

Sumber: [Capaian Pembelajaran Bahasa Inggris pada Kurikulum Merdeka](https://yunandra.com/capaian-pembelajaran-bahasa-inggris-pada-kurikulum-merdeka/)

**Kesimpulan riset**: tidak ada satu pun lembaga besar yang benar-benar meniadakan grammar di level termuda. Yang membedakan Starter dari Achiever bukan ada/tidaknya grammar, tapi:
1. **Framing** — level bawah: pola kalimat kontekstual tanpa istilah/aturan eksplisit ("I am...", "This is...", "There is/are..."); level atas: aturan eksplisit dengan terminologi & koreksi kesalahan.
2. **Abstraksi struktur** — level bawah: present tense, this/that, there is/are; level atas: past/present perfect, passive, conditional.

Keputusan produk direvisi berdasarkan ini — lihat PRD.md §3.

**Konfirmasi dari kompetitor (screenshot UI "Peta Belajarmu", referensi internal — bukan link publik)**: kompetitor punya filter Skill (Vocabulary, Grammar, Listening, Speaking, Reading) × Level (Pre-A1, A1, A2, B1), dan Grammar **memang ada mulai dari Pre-A1**, bukan ditunda:

| Level kompetitor | Usia | Jumlah modul Grammar | Contoh topik |
|---|---|---|---|
| Pre-A1 | 3–8 th | 3 modul | Kata Ganti Orang (Pronouns), Kata Ganti Milik (Possessives), Pola "I am / She is" (To Be) |
| A1 | 8–10 th | 11 modul | Simple Present, Present Continuous, Object Pronouns, Prepositions, Kata Tunjuk & Kata Tanya, Plural & Articles, Can/Can't, There is/are & Kepemilikan, Countable & Uncountable, Conjunctions, Comparative & Superlative |
| A2 | 10–12 th | 8 modul | Simple Past (Regular & Irregular), Adverbs, Modal Verbs, Gerund & Infinitive, Communication Verbs, Future (will/going to), Conditional Tipe 0–1 |
| B1 | 12+ th, ditandai "jalur lanjutan" | 2 modul | Reporting Verbs, Conditional Tipe 2–3 |

Pola ini menguatkan dua hal: (1) grammar Pre-A1 memang berputar di tema **perkenalan diri** (pronouns, to be, possessives) — selaras dengan materi Explorer yang sudah ada (`percakapan_perkenalan_interactive_app.html`); (2) pola "B1 = jalur lanjutan dengan modul jauh lebih sedikit (2 vs 8–11)" konsisten dengan keputusan Trailblazer kita sebelumnya (lihat §7).

Skill kategori kompetitor juga mencakup **"Reading"** sebagai kategori ke-5 (di luar Vocabulary/Grammar/Listening/Speaking) — dicatat sebagai kandidat kategori tambahan, belum diputuskan masuk v1 (lihat PRD.md §3, dibahas sebagai out-of-scope untuk sekarang karena arah teknologi v1 audio-first/TTS-STT, bukan text-heavy).

---

## 11. Kompetitor Aplikasi & Prinsip Desain Loop Aktivitas untuk Anak

Riset tambahan: membandingkan struktur per-modul kompetitor (screenshot "Peta Belajarmu" — loop **Baca Materi → Susun Kata → Kuis Latihan → Ulangi Kuis**, plus coin/XP/streak/SRS-flashcard di top bar) dengan app-app yang memang didesain khusus untuk anak, supaya keputusan loop aktivitas produk kita tidak sekadar contek tapi lebih sesuai anak.

### 11.1 Lanskap Kompetitor (Aplikasi)

| Aplikasi | Tipe | Usia | Pola desain kunci |
|---|---|---|---|
| Kompetitor "Peta Belajarmu" (screenshot, internal) | App lokal, mirip struktur `inggrisinyuk` dewasa | tidak diketahui pasti, filter usia 3–12+ | Skill×Level grid; loop Baca Materi→Susun Kata→Kuis→Ulangi Kuis; coin, XP, streak, kartu SRS "siap direview", label "Akurasi %" |
| Duolingo ABC | Literasi huruf/fonik (native, bukan ESL) | anak pra-baca | Mini-game multi-sensor (tap/trace/drag), jalur sekuensial jelas |
| Khan Academy Kids | Belajar umum | 2–8 th | Gratis, **tanpa iklan/IAP**, non-kompetitif, jalur personalisasi |
| Lingokids | ESL/edu umum | 2–8 th | Metodologi **"Playlearning"**: playlist mini-game + lagu + video (bukan quiz-sentris); sesi dibatasi 15–20 menit, 3x/minggu; laporan progres mingguan ke orang tua; materi dari Oxford University Press |
| Novakid | Kursus + App | 4–12 th | Kombinasi guru manusia (live) + AI utk latihan mandiri, game-based lesson |
| Buddy.ai | App AI speaking partner | anak | Karakter kartun, fokus vocabulary+pronunciation+listening lewat speech AI |
| ELSA Speak | App AI pronunciation (dewasa) | dewasa (referensi mekanik) | Feedback pronunciation granular real-time — relevan sebagai referensi UX utk game "Ucapkan & Cek" kita |
| Endless Alphabet / Endless Reader | App vocab/reading | pra-baca | **Filosofi eksplisit: tanpa timer, tanpa skor tinggi, tanpa banner "coba lagi"** — animasi monster + audio, retry tanpa tekanan |
| Reading Eggs | App phonics/reading | anak | Fonik & sight words bertahap |
| Cakap Kids | Kursus + App lokal Indonesia | 4–12 th | Kurikulum + kelas live, materi Oxford, app pendukung |

Sumber: [Best Early Learning Apps — Khan Academy blog](https://blog.khanacademy.org/best-early-learning-apps-for-kids/), [Duolingo ABC — Google Play](https://play.google.com/store/apps/details?id=com.duolingo.literacy), [Lingokids — Common Sense Media review](https://www.commonsensemedia.org/app-reviews/lingokids-play-and-learn), [Lingokids English for Kids](https://lingokids.com/english-for-kids), [Novakid English learning app](https://www.novakidschool.com/english-learning-app/), [Buddy.ai — Google Play](https://play.google.com/store/apps/details/Buddy_ai_English_for_kids?id=ai.mybuddy.talkingflashcards_new), [ELSA Speak](https://elsaspeak.com/en), [Endless Alphabet — Originator](https://www.originatorkids.com/endless-alphabet/), [Endless Alphabet review — LearningWorks for Kids](https://learningworksforkids.com/apps/endless-alphabet/), [10 Aplikasi Belajar Bahasa Inggris Anak — Cakap](https://blog.cakap.com/aplikasi-belajar-bahasa-inggris-untuk-anak/)

### 11.2 Insight Kunci: Kenapa Loop Kompetitor Tidak Dicontek 100%

**Loop kompetitor (Baca Materi → Susun Kata → Kuis Latihan → Ulangi Kuis) adalah pola app ESL dewasa**, wajar karena strukturnya mirip `inggrisinyuk` (dewasa) yang sudah diriset di §8 — kemungkinan tim yang sama menerapkan pola serupa ke produk anak tanpa banyak penyesuaian. Tiga gap dibanding app yang memang didesain untuk anak:

1. **"Baca Materi" mengasumsikan anak bisa membaca teks penjelasan** — untuk Little Stars–Explorer (banyak pre-reader), ini gap besar. App anak yang mapan (Khan Academy Kids, Lingokids, Endless Alphabet) selalu pakai audio+animasi ("show, don't explain"), bukan paragraf teks.
2. **"Kuis Latihan" dengan skor akurasi % dan status "Belum dicoba"** memakai bahasa evaluatif/klinis khas app dewasa. Endless Alphabet secara eksplisit didesain **tanpa timer, skor tinggi, atau banner kegagalan** — filosofi "no stress, no failure" terbukti lebih cocok untuk anak kecil.
3. **"Ulangi Kuis" dengan kartu SRS eksplisit ("2 kartu siap direview")** adalah pola aplikasi flashcard dewasa (Anki, Quizlet, DuoCards). Tidak ditemukan riset yang memvalidasi UI "jadwal review" eksplisit ini untuk anak kecil — app anak umumnya menyembunyikan pengulangan di balik variasi game, bukan menampilkannya sebagai antrian tugas.
4. **Coin sebagai satuan reward** berisiko kena kategori "dark pattern" ringan untuk anak — riset gamifikasi etis menyarankan reward non-moneter (bintang, stiker) dan pembelian dalam-app harus sepenuhnya di luar jangkauan anak, dikontrol orang tua. Ini juga align dengan keputusan kita: tanpa backend/pembayaran sama sekali di v1 (§5 Teknologi PRD).

Sumber: [Endless Alphabet review — LearningWorks for Kids](https://learningworksforkids.com/apps/endless-alphabet/), [Playful but Persuasive: Deceptive Designs in Popular Mobile Apps for Children (arXiv)](https://arxiv.org/pdf/2512.17819), [5 Ethical Gamification Principles — Gamification Hub](https://www.gamificationhub.org/ethical-gamification-principles/), [UX Design for Kids — Gapsy](https://gapsystudio.com/blog/ux-design-for-kids/)

### 11.3 Model Pedagogis Pendukung: PPP (Presentation–Practice–Production)

Model klasik ESL "Presentation → Practice → Production" relevan sebagai kerangka loop 3 langkah (Presentation ≈ "Kenalan", Practice ≈ "Main/Latihan", Production ≈ tantangan bebas/roleplay) — cocok untuk pemula, tapi untuk anak sangat muda perlu porsi Practice yang lebih besar & scaffolding lebih lama sebelum masuk Production murni.

Sumber: [What is PPP Method? — Allright](https://allright.com/en/blog/teacher_blog_en/what-is-presentation-practice-and-production-ppp), [PPP Method: A Classic Framework — Teast](https://teast.co/blog/ppp-method)

**Keputusan produk berdasarkan riset §11**: loop aktivitas didesain ulang jadi 2 varian per kelompok usia (bukan 1 loop seragam ala kompetitor), reward non-moneter, dan pengulangan (repetition) disembunyikan di balik variasi game alih-alih UI jadwal review eksplisit — detail lengkap di PRD.md bagian Struktur Materi.

---

## 12. Redesain Visual Desktop & Mobile

Kompetitor menunjukkan screenshot desktop DAN mobile dari app mereka, lalu diminta: buat layout serupa (desktop+mobile dari kode yang sama) tapi **tidak boleh mirip, harus lebih bagus**. Dikerjakan lewat agent terpisah (model Opus, dipilih user secara eksplisit untuk penilaian desain yang lebih kuat) dengan mandat ketat: cuma redesain shell/layout/identitas visual, **tidak boleh** mereplikasi fitur yang sudah sengaja ditolak di §11.2/PRD §4.6 (coin, antrian review kartu, leaderboard, trophy/streak row), dan **tidak boleh** menambah nav ke fitur yang belum ada (Game/Memory/Percakapan ala kompetitor).

**Struktur kompetitor yang jadi acuan pola (bukan acuan visual)**: sidebar kiri (~300px) berisi logo + 5 nav item + Profil/Pengaturan di bawah, untuk desktop; berubah jadi tab bar bawah fixed untuk mobile, konten di-stack 1 kolom. Warna dominan kompetitor: indigo/ungu (~#6D4FE0-ish) sebagai primary, lavender sebagai secondary background.

**Kenapa warna primer app kita dipindah dari purple**: token lama (`--purple-text:#6D4FE0`, dipakai sbg salah satu warna skill Vocabulary) kebetulan sangat dekat dengan warna utama kompetitor — risiko nyata dibilang "mirip" kalau dipertahankan sebagai warna dominan. Solusi: warna brand baru **teal "Lagoon"** (`--brand-700:#0B6E6B`) + aksen **"Mango"** (`--sun-500:#FFB53D`) — beda ~75° hue dari indigo kompetitor (teal ~178° vs indigo ~253°). Warna per-skill (Vocabulary/Listening/Speaking/Grammar) tetap ada tapi jadi warna sekunder (cuma tampil di dalam konteks skill itu sendiri, bukan warna UI utama) — Vocabulary sendiri dipindah dari indigo ke grape (`#9B2FA8`) supaya makin jauh dari warna kompetitor. Tipografi (Baloo 2 + Nunito) dipertahankan — itu identitas yang sudah konsisten lintas produk (3 prototipe HTML lain di repo ini + turunan referensi yang sama dengan `inggrisinyuk-app`), jadi yang diubah bukan jenis fontnya, tapi skala & hierarkinya (clamp() fluid type scale, eyebrow label 11px tracked, dst).

**Breakpoint responsif** (1 codebase, bukan 2 desain terpisah):

| Lebar | Navigasi | Konten |
|---|---|---|
| < 768px | Tab bar bawah (fixed) | 1 kolom, panel suara turun ke bawah panggung game |
| 768–1079px | Rail ikon ringkas (92px) | 1 kolom lebih lebar, kartu 2–4 kolom |
| ≥ 1080px | Rail penuh (252px + wordmark) | 2 kolom: konten utama + panel pendamping (level/bintang, cara main, atau stepper aktivitas) |

**Navigasi — 3 tujuan nyata** (bukan dipaksa 5 seperti kompetitor): Beranda (kartu "lanjutkan" ke materi terakhir + level + bintang), Belajar (skill picker → materi → alur 3 langkah yang sudah ada), Pengaturan (panel suara/kecepatan dipindah ke sini secara global, plus lihat/reset progres, catatan untuk orang tua). Alasan eksplisit: link ke fitur yang belum dibangun (Game/Memory/Percakapan) adalah navigasi yang menyesatkan.

**Ikon**: chrome aplikasi (nav, tombol kembali, centang status) sekarang pakai SVG inline `currentColor`, bukan emoji — emoji dicadangkan murni untuk konten pelajaran (kata, gambar soal) supaya perannya jelas dan tidak ambigu (emoji navigasi vs emoji konten sering tertukar makna di app anak).

**Progres**: modul `app/src/progress.ts` baru — `localStorage` mencatat modul yang tuntas (1 bintang per modul, bukan skor numerik) dan materi terakhir dibuka (untuk tombol "lanjutkan" di Beranda). Tidak ada coin, tidak ada antrian kartu review yang diekspos, tidak ada leaderboard — konsisten dengan §11.2.

**Verifikasi**: `npm run build` lolos type-check bersih (bundle 41.9kb), agent mengecek visual di headless Chrome pada 3 lebar (390/834/1440px), dan sesi utama re-verifikasi setelahnya: build ulang bersih, dev server (`npm run dev`, esbuild `--servedir`) merespons 200 untuk `index.html`, `styles.css`, dan `bundle.js`.

**File baru**: `app/public/styles.css` (token desain + semua komponen, ~700 baris, dipisah dari inline `<style>` sebelumnya), `app/src/icons.ts`, `app/src/progress.ts`. **File diubah**: `app/public/index.html`, `app/src/app.ts`, `app/src/types.ts`, `app/src/content.ts`, `app/src/interaction.ts` (perbaikan aksesibilitas: tombol Enter tidak lagi dobel-trigger di elemen `<button>` native, tombol Spasi kini mengaktifkan elemen `role="button"`), `app/src/games/grammar.ts` (perbaikan copy: pesan salah yang sebelumnya salah tertulis "masih pas"), `app/README.md`.

Sumber: screenshot kompetitor (referensi internal, desktop & mobile — bukan link publik).

---

## 13. Adaptasi Konsep "Anglora" (Game Dewasa) → Peta Level Anak

Diminta: baca 2 dokumen konsep produk **game dewasa terpisah** — `inggrisinyuk/prd_user_game.md` ("Anglora", audiens 15+, isekai-RPG) dan `inggrisinyuk/architecture_game.md` — lalu adaptasi ide "tiap misi menaikkan level ala Solo Leveling" + "level terkunci sekuensial kecuali langsung kalahkan boss level itu" ke app anak ini. Dikerjakan lewat agent terpisah (model Sonnet, dipilih user secara eksplisit), dengan mandat ketat: **filter lewat aturan kid-friendly yang baru ditulis di PRD.md/CLAUDE.md** — ambil struktur/mekanik, buang substansi yang tidak cocok untuk anak.

### 13.1 Konsep Anglora yang Relevan

- **World Map 6 negeri (prd_user_game.md §3.5, architecture_game.md §3, §5.1–5.3)**: negeri berikutnya cuma terbuka kalau (1) dibayar **dan** (2) Duel Pembisu (boss, Day 31) negeri sebelumnya dimenangkan.
- **Duel Verifikasi (§3.4)**: user boleh coba langsung mulai di level plafon (skip negeri di bawahnya) dengan mengalahkan Duel Pembisu level **satu tingkat di bawah** plafon — kalau lulus, resmi mulai di level itu; kalau gagal, satu kesempatan habis, turun 1 level, wajib beli & main penuh dari sana.
- **Filosofi §6.1**: "tiap misi menaikkan level, ala Solo Leveling" — progres harus **terlihat** menambah lembar status, bukan checklist yang dilupakan. Stat dihitung `runtime` dari data yang sudah ada (`mission_progress` dkk × bobot), bukan tabel/kolom terpisah (architecture_game.md §6.5) — pola "derived, bukan sumber kebenaran baru" ini juga kita pakai buat XP.
- **Padang Latih (§4.9)**: sparring opsional, hub mini-game, **tidak** menaikkan Stat cerita utama & **tidak ada** progress tracking negeri — murni suplemen.

### 13.2 Kenapa Sebagian Besar SENGAJA Tidak Dipakai

| Elemen Anglora | Kenapa tidak dipakai mentah | Diganti dengan |
|---|---|---|
| Duel Pembisu = pertarungan dialog AI, panggil LLM berbayar | PRD §5 mengunci **tanpa backend/AI API di v1** — bukan boleh/tidak boleh, sudah keputusan final | Tantangan Bos 100% hardcoded/client-side: mashup ~8 ronde dari mini-game yang sudah ada, ditarik dari semua topik level (§12.2 PRD) |
| Gagal Duel Pembisu = uang hangus / turun level paksa, "satu kesempatan" | Bentrok langsung dengan prinsip non-punitive yang sudah dikunci (PRD §4.5/§4.6, RESEARCH §11.2) — dan lagipula tidak ada uang di app ini sama sekali | Tidak ada status kalah sama sekali — retry tanpa batas, sama seperti aturan selesai modul biasa, cuma skalanya lebih besar |
| Nuansa "Kabut Bisu" — dunia yang mencuri suara, metafora ketakutan bicara, audiens 15+ | Terlalu berat/gelap untuk usia 5–13 th — ini justru pelanggaran langsung terhadap aturan kid-friendly yang baru ditulis | Framing "boss" ringan ala Mario/Pokémon gym-leader — 👑, animasi bintang, bahasa "Kena!"/"Pas banget!" |
| Nama kerajaan fantasi (Gua Kata, Menara Tata, Arena Suara, dst) — itu mapping ke *skill module* | Sumbu berbeda dari level CEFR kita; nama level kita (Little Stars…Trailblazer) sudah mapan di PRD §3, tidak perlu dan tidak boleh diganti | Nama level tetap seperti PRD §3; Tantangan Bos cukup dilabeli "Tantangan Bos {nama level}" |
| Padang Latih = efek nol total ke Stat | User secara eksplisit minta sebaliknya di tengah sesi ini — Game harus terasa berarti, bukan cuma pengisi waktu | Game tetap tidak pengaruhi bintang/buka-level (Belajar tetap inti), tapi kasih **XP kecil** per ronde (§12.4 PRD) |
| Stat Kefasihan (6 kategori: Kosakata, Tata Bahasa, dst) sebagai lembar status detail | Skala berlebihan untuk 1 level (Explorer) yang baru punya konten — kandidat fase depan kalau semua level sudah ada materi | XP tunggal (satu angka, bukan 6 kategori) — cukup untuk "kelihatan tumbuh" tanpa kompleksitas UI lembar status penuh |

### 13.3 Batas Scope yang Disengaja

Cuma **Explorer** yang punya materi asli di app ini (§8). Membangun 6 negeri Anglora penuh (30 misi × tiap level) tidak realistis di satu sesi — jadi yang dibangun adalah **mekanismenya** (Peta Level, status kunci/buka, tipe game Bos, flag `bossCleared`+XP di `progress.ts`), dipasang sepenuhnya jalan untuk Explorer, sementara 5 level lain tampil di Peta Level sebagai locked/"materi belum ada" yang jujur (bukan link mati, bukan konten palsu) — siap diisi begitu level lain benar-benar diauthoring (di luar scope sesi ini, lihat PRD §9).

### 13.4 Verifikasi

`npm run build` bersih (0 error TypeScript, bundle 56.6kb), dev server (`npm run dev`) merespons 200 untuk `index.html`/`styles.css`/`bundle.js`. Ditinjau ulang manual: bahasa di `games/boss.ts` & layar menang (`app.ts`) dicek tidak ada kata "gagal"/"kalah"/status stres — konsisten dengan aturan kid-friendly PRD.md/CLAUDE.md.

**File baru**: `app/src/games/boss.ts`. **File diubah**: `app/src/types.ts`, `app/src/content.ts`, `app/src/progress.ts`, `app/src/icons.ts`, `app/src/app.ts`, `app/public/styles.css`.

Sumber: `inggrisinyuk/prd_user_game.md`, `inggrisinyuk/architecture_game.md` (dokumen internal, produk terpisah — bukan link publik).

---

## 14. Sumber Referensi

- Cambridge — [Qualifications for young learners](https://www.cambridgeenglish.org/exams-and-tests/qualifications/young-learners/), [Wikipedia: Cambridge English Young Learners](https://en.wikipedia.org/wiki/Cambridge_English:_Young_Learners)
- Pearson — [Global Scale of English for educators](https://www.pearson.com/languages/en-us/why-pearson/the-global-scale-of-english/educators.html), [GSE Assessment Framework Young Learners (PDF)](https://www.pearson.com/content/dam/one-dot-com/one-dot-com/pearson-languages/en-gb/pdfs/gse/gse-resources/gse-assessment-framework-young-learners.pdf)
- ETS — [TOEFL Primary ↔ CEFR mapping](https://www.etsglobal.org/re/en/help-center/test-content/are-toefl-primary-test-scores-mapped-to-the-cefr), [TOEFL Junior ↔ CEFR mapping](https://www.etsglobal.org/ma/en/help-center/test-content/are-toefl-junior-standard-test-scores-mapped-to-the-cefr)
- British Council — [Assessing the language of young learners](https://www.britishcouncil.org/assessing-language-young-learners-0), [Levels for kids and teens](https://www.britishcouncil.cz/en/english/courses-children/levels)
- EF — [EF Kids & Teens](https://ef.design/work/ef-kids-teens), [EF Indonesia](https://www.ef.co.id/)
- Kurikulum Merdeka (Kemendikbudristek) — [Capaian Pembelajaran Bahasa Inggris](https://kurikulummerdeka.com/capaian-pembelajaran-bahasa-inggris-pada-kurikulum-merdeka/), [CP Fase B & C SD](https://meqaplus.com/capaian-pembelajaran-cp-bahasa-inggris-sd-fase-b-dan-c-kurikulum-merdeka/), [CP Fase D SMP](https://kurikulummerdeka.com/capaian-pembelajaran-cp-b-inggris-smp-fase-d-kurikulum-merdeka-2024/), [CP Fase E–F SMA](https://kepalasekolah.id/cp-bahasa-inggris-sma-smk-2025-fase-e-f/), [Panduan Mapel Bahasa Inggris Fase B–F (PDF resmi)](https://kurikulum.kemendikdasmen.go.id/file/panduan/dokumen/3.%20Final%20Panduan%20Mata%20Pelajaran%20Bahasa%20Inggris_12_09_2025_Revisi%203.pdf)
- Lembaga kursus Indonesia — [8 kursus Bahasa Inggris anak terbaik](https://ielc.co.id/8-kursus-bahasa-inggris-terbaik-untuk-anak-di-indonesia/), [10 rekomendasi kursus Bahasa Inggris](https://ielc.co.id/10-rekomendasi-kursus-bahasa-inggris-terbaik-di-indonesia/)
- [Apa Itu CEFR untuk Anak? — KovaClass](https://www.kovaclass.com/blog/cefr-bahasa-inggris-anak/)
