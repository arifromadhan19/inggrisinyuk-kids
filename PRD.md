# PRD — Aplikasi Bahasa Inggris untuk Anak (Working Title: InggrisinYuk Kids)

Status: **Final — sistem leveling & struktur materi v1**
Terakhir diupdate: 2026-08-19

> Riset & rationale di balik setiap keputusan di dokumen ini ada di [RESEARCH.md](RESEARCH.md).

---

> ## 🔒 Aturan Wajib: Semua Referensi Difilter Lewat Lensa Kid-Friendly
>
> Project ini sering mengambil inspirasi dari referensi yang **tidak dibuat untuk anak** — kompetitor, game dewasa (mis. konsep "Anglora" di `inggrisinyuk/prd_user_game.md` & `architecture_game.md`, audiens 15+), pola app ESL dewasa (`inggrisinyuk-app`), dst. **Setiap kali mengadaptasi konsep dari referensi semacam itu, filter berikut wajib diterapkan di SEMUA dimensi, bukan cuma salah satu:**
>
> 1. **Desain visual** — hangat, playful, tidak menakutkan. Hindari nuansa gelap/intens, elemen pertarungan yang berat, atau horor sekalipun implisit.
> 2. **Kata-kata/copy** — sederhana, hangat, sesuai usia. Hindari bahasa klinis/evaluatif ("gagal", "salah", skor sebagai hukuman). Kalau ada framing game (mis. "boss"/"raja"), nadanya ringan ala Mario/Pokémon — seru, bukan menegangkan.
> 3. **Alur cerita/narasi** — tidak berbasis rasa takut (referensi dewasa boleh punya tema gelap/psikologis — itu terlalu berat untuk anak). Framing petualangan/RPG boleh dipakai, tapi harus merayakan progres, bukan menekan.
> 4. **Alur/flow interaksi** — retry non-punitive, tanpa timer/status gagal, target tap besar, label dibacakan TTS untuk yang belum bisa baca, tidak ada layar dead-end yang menakutkan.
>
> **Prinsip inti**: mengambil *struktur/mekanik* dari referensi itu boleh dan berguna (tidak perlu reinvent semua dari nol), tapi *substansinya* (nada, bahasa, visual, tingkat stres) harus selalu dites ulang: "apakah ini masuk akal untuk anak usia 5–13 tahun?" — bukan diasumsikan otomatis cocok karena polanya terbukti di produk lain. Contoh penerapan nyata: §12.
>
> Aturan yang sama berlaku persis di [CLAUDE.md](CLAUDE.md) — dua dokumen ini harus tetap sinkron soal ini.

---

## 1. Konteks

Repo ini sudah punya 3 prototipe HTML yang jadi basis penentuan level & scope:

| Prototipe | File |
|---|---|
| Vocabulary practice | `bro_arule_kampung_inggris_vocabulary_practice.html` |
| Percakapan perkenalan diri | `percakapan_perkenalan_interactive_app.html` |
| Daily conversation (belanja, ASR) | `daily-conversation-asr.html` |

---

## 2. Kompetitor

Lanskap pembanding — kursus lokal, kurikulum resmi, dan **aplikasi** (baik ESL anak maupun edu-app anak secara umum). Detail per-item & sumber: RESEARCH.md §4, §11.

| Kompetitor | Tipe | Pola kunci yang relevan |
|---|---|---|
| Kompetitor "Peta Belajarmu" (screenshot referensi) | App lokal, struktur mirip `inggrisinyuk` dewasa | Skill×Level grid lengkap (Vocabulary/Grammar/Listening/Speaking/Reading), Grammar dari Pre-A1; loop per-modul **Baca Materi → Susun Kata → Kuis → Ulangi Kuis** + coin/XP/streak/SRS |
| Duolingo ABC | App literasi huruf/fonik | Mini-game multi-sensor (tap/trace/drag), jalur sekuensial |
| Khan Academy Kids | App belajar umum, 2–8 th | Gratis, tanpa iklan/IAP, non-kompetitif |
| Lingokids | App ESL/edu, 2–8 th | "Playlearning": playlist mini-game+lagu+video, sesi dibatasi 15–20 menit, laporan mingguan ke orang tua |
| Novakid | Kursus + App, 4–12 th | Guru live + AI utk latihan mandiri |
| Buddy.ai | App AI speaking partner | Karakter kartun, fokus vocabulary+pronunciation via speech AI |
| ELSA Speak | App AI pronunciation (dewasa) | Referensi mekanik feedback real-time utk game "Ucapkan & Cek" |
| Endless Alphabet / Endless Reader | App vocab/reading | Filosofi eksplisit **tanpa timer, skor, atau banner gagal** |
| Cakap Kids | Kursus + App lokal Indonesia | Kurikulum + kelas live, materi Oxford |
| EF Kids, LIA, ILP, Wall Street English, IELC | Kursus lokal (non-app) | Band usia (EF), CEFR eksplisit (IELC), grammar/struktur kalimat sejak SD awal (LIA) |

**Insight utama**: loop "Baca Materi → Kuis dengan skor %" ala kompetitor adalah pola app ESL **dewasa** (mirip `inggrisinyuk`) yang diterapkan ke produk anak. App yang benar-benar didesain untuk anak (Khan Academy Kids, Lingokids, Endless Alphabet) justru **tidak** memakai teks panjang atau skor evaluatif — pakai audio+animasi dan tanpa tekanan gagal. Ini jadi dasar redesain loop aktivitas di §4.

---

## 3. Sistem Level

| # | Level | Badge CEFR | Usia | Cambridge YLE/Schools terdekat | Status |
|---|---|---|---|---|---|
| 0 | **Little Stars** (Early Years) | — (di luar CEFR) | 3–5 th | — | Roadmap masa depan |
| 1 | **Starter** 🌱 | ≈ Pre-A1 | 5–7 th | (pra-Starters) | MVP (v1) |
| 2 | **Explorer** 🧭 | ≈ Pre-A1 → A1 | 7–9 th | Pre A1 Starters | MVP (v1) |
| 3 | **Adventurer** 🚀 | ≈ A1 | 9–11 th | A1 Movers | MVP (v1) |
| 4 | **Achiever** 🏆 | ≈ A1 → A2 | 11–13 th | A2 Flyers | Next phase |
| 5 | **Trailblazer** ✨ *(jalur lanjutan)* | ≈ B1 | 12+ th | A2 Key → B1 Preliminary for Schools | Next phase (low-effort, 1–2 modul) |

---

## 4. Struktur Materi: Kategori Skill, Modul Grammar & Loop Aktivitas

### 4.1 Kategori Skill per Level

| Kategori Skill | Little Stars | Starter | Explorer | Adventurer | Achiever | Trailblazer |
|---|---|---|---|---|---|---|
| Vocabulary | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Listening | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Speaking (+ roleplay) | — | ✅ | ✅ | ✅ | ✅ | ✅ |
| Grammar | — | ✅ | ✅ | ✅ | ✅ | ✅ *(jalur lanjutan, modul dikit)* |

Grammar hadir dari Starter, **bukan** ditunda sampai Achiever — Cambridge YLE (grammar list resmi sejak Pre A1 Starters) dan kompetitor (Pre-A1 mereka sudah punya 3 modul grammar) sama-sama menunjukkan ini. Yang berubah per level cuma kompleksitas topik. Hanya Little Stars (di luar tangga CEFR) yang tanpa Grammar eksplisit.

### 4.2 Modul Grammar per Level (contoh topik)

| Level | Contoh Modul Grammar |
|---|---|
| Starter (≈Pre-A1) | Kata Ganti Orang (Pronouns), Pola "I am / You are" (To Be), Kata Ganti Milik (Possessives) — tema perkenalan diri |
| Explorer (≈Pre-A1→A1) | This/That/These/Those, There is/There are, Kata Tunjuk & Kata Tanya, Jamak & Artikel |
| Adventurer (≈A1) | Simple Present, Present Continuous, Can/Can't, Preposisi Tempat, Kata Ganti Objek, Countable & Uncountable, Comparative & Superlative |
| Achiever (≈A1→A2) | Simple Past (reguler & tak beraturan), Kata Keterangan (Adverbs), Modal Verbs, Future (will/going to), Gerund & Infinitive |
| Trailblazer (≈B1, jalur lanjutan) | Reported Speech, Conditional lanjutan — tetap 1–2 modul saja |

### 4.3 Prinsip Loop Aktivitas

Kompetitor pakai 1 loop seragam di semua submodul: **Baca Materi → Susun Kata → Kuis Latihan → Ulangi Kuis** (skor akurasi %, kartu SRS "siap direview", coin) — termasuk "Susun Kata" muncul juga di dalam modul **Vocabulary**, bukan cuma Grammar. **Sengaja tidak dicontek 100%**, tapi shell-nya (1 pola langkah yang konsisten dipakai di 4 submodul) dipertahankan karena bagus untuk anak — sekali paham alurnya di satu submodul, anak langsung paham di submodul lain. Yang diubah: isi tiap langkah & jumlah langkah beda menurut usia.

- **Loop A** (Little Stars–Explorer, usia 3–9, banyak pre-reader): 3 langkah — **Kenalan → Latihan Inti → Main Lagi**
- **Loop B** (Adventurer–Trailblazer, usia 9+, lebih melek huruf): 4 langkah — **Kenalan → Latihan Inti → Tantangan → Asah Lagi**

"Main Lagi"/"Asah Lagi" bukan layar terpisah berisi kartu SRS ("2 kartu siap direview") seperti kompetitor — item yang pernah salah/perlu diulang cukup diselipkan otomatis ke ronde Latihan Inti berikutnya (logic pemilihan di `localStorage`, bobot lebih tinggi untuk item yang baru salah). Anak tidak pernah melihat "antrian review", cuma main seperti biasa.

### 4.4 Alur Konkret per Submodul

Isi tiap langkah, disesuaikan skill — pakai contoh topik yang sudah ada di prototipe:

| Submodul | Kenalan | Latihan Inti | Tantangan (Loop B saja) |
|---|---|---|---|
| **Vocabulary** | TTS ucapkan kata + gambar/emoji muncul (kata ikut ter-highlight kalau anak sudah mulai baca) | **Tebak & Cocokkan** — beberapa gambar tampil, TTS ucapkan 1 kata, anak tap gambar yang cocok | 2 giliran: **(1) Eja Kata** — huruf kata diacak jadi chip, anak susun jadi kata yang benar (di level huruf, bukan kalimat — baru masuk dari Explorer ke atas). **(2) Contoh Penggunaan** — kata dipakai dalam 1 kalimat konteks (mis. "two" → "Budi has two apples" + terjemahan), anak dengar lalu **coba ucapkan** (reuse mekanik Ucapkan & Cek), lalu **susun kata** kalimat itu dari chip acak (reuse mekanik Susun Kalimat) |
| **Listening** | TTS mainkan 1 kalimat pendek dalam konteks (mis. adegan belanja) + gambar suasana | **Dengar & Pilih** — TTS ucapkan kata/kalimat, anak tap gambar/opsi yang benar | **Dengar Cerita Pendek** — TTS mainkan mini-dialog 2–3 kalimat, anak jawab 1 pertanyaan (siapa/apa/di mana) dengan tap |
| **Speaking** | TTS contohkan pengucapan frasa target — anak dengar dulu sebelum praktik | **Ucapkan & Cek** — anak tap mic, ucapkan frasa, STT bandingkan, feedback cocok/mirip/ulangi (non-punitive, retry tanpa batas) | **Mini-Roleplay** — 2–3 giliran tanya-jawab beruntun (pola dari `daily-conversation-asr.html`) |
| **Grammar** | Pola dikenalkan lewat 2 contoh audio+gambar berpasangan (mis. "This is a cat" + gambar kucing, "This is a dog" + gambar anjing) — bukan penjelasan aturan | **Susun Kalimat** — chip kata diacak, anak susun jadi kalimat sesuai pola | **Bikin Sendiri** — anak pilih kata dari 2–3 opsi untuk melengkapi kalimat baru tentang dirinya sendiri (jembatan ke Speaking) |

Roleplay tidak jadi kategori terpisah — sudah menyatu di Speaking (2 dari 3 prototipe existing memang berbentuk roleplay). Modul "Professional" dari `inggrisinyuk` tidak diadopsi. **"Reading"** (kategori ke-5 di kompetitor) dicatat sebagai kandidat, belum masuk v1 — arah teknologi v1 audio-first, bukan text-heavy.

**Kenapa Vocabulary butuh "Contoh Penggunaan"**: Tebak & Cocokkan dan Eja Kata sama-sama melatih kata **secara terisolasi** — bagus untuk pengenalan, tapi belum tentu nempel maknanya kalau kata cuma berdiri sendiri. Contoh Penggunaan menaruh kata dalam kalimat nyata + minta anak dengar-ucapkan-susun, jadi 1 kata dilatih lewat 3 indera sekaligus (dengar, ucap, susun) dan reuse mekanik yang sudah ada (Ucapkan & Cek dari Speaking, Susun Kalimat dari Grammar) — tanpa bikin game baru. Ini juga menyamai kompetitor yang memang punya "Susun Kata" di dalam modul Vocabulary (RESEARCH.md §11), bedanya di kita digabung dengan latihan Speaking dulu, bukan berdiri sendiri.

### 4.5 Aturan Selesai & Pengulangan

- **Selesai = 1 putaran Latihan Inti tuntas** (semua item di set topik itu sudah dicoba), **bukan skor minimum** — retry unlimited, tidak ada gate nilai. Ini yang mengizinkan progres naik level tanpa tekanan gagal (§4.3, filosofi Endless Alphabet).
- Tantangan (Loop B) bersifat bonus/opsional — tidak menghalangi modul ditandai selesai kalau dilewati.
- Item yang salah/lambat dijawab otomatis punya bobot lebih tinggi untuk muncul lagi di sesi Latihan Inti berikutnya — bukan ditampilkan sebagai daftar review terpisah ke anak.

### 4.6 Prinsip Gamifikasi

- Reward pakai **bintang/stiker**, bukan "coin" — hindari framing mata uang ke anak.
- Tidak ada leaderboard/perbandingan antar-anak di v1 — hindari kecemasan sosial di usia ini.
- State kosong (skor 0, streak 0) tidak ditampilkan mencolok di layar awal.
- Semua label tombol/instruksi dibacakan lewat TTS, tidak cuma teks — penting untuk Little Stars–Explorer yang pre-reader.

---

## 5. Teknologi

- **Client-side sepenuhnya**, mengikuti pola 3 prototipe yang sudah ada. **Tidak ada backend, database, auth, atau pemanggilan AI API** di v1 — beda arah dari `inggrisinyuk` (dewasa) yang pakai Next.js/Prisma/Postgres/ChatGPT-prompt (lihat RESEARCH.md §8). Ini keputusan sadar, bukan gap.
- **Logic ditulis TypeScript** (bukan JS biasa, bukan full Next.js/React) — source di [`app/src/`](app/src/), di-bundle jadi `app/public/bundle.js` lewat esbuild, sehingga `app/public/` jadi 1 folder statis yang self-contained (siap upload ke VPS apa adanya, tanpa proses Node yang perlu terus nyala — beda dari `inggrisinyuk-app` yang butuh `next start` + PM2). Development lokal pakai `npm run dev` (esbuild `--servedir`, jalan di `http://127.0.0.1:8000`) — sengaja localhost, bukan buka file langsung, supaya izin mikrofon (Speaking) tersimpan permanen di browser. Detail run & deploy: [`app/README.md`](app/README.md).
- Prototipe cepat tanpa build step (`alur-modul-belajar-prototype.html`, single HTML file) tetap dipertahankan sebagai demo alur — versi TypeScript di `app/` adalah pondasi untuk pengembangan selanjutnya.
- **TTS & STT pakai Web Speech API bawaan browser**, persis seperti di `daily-conversation-asr (1).html`: `speechSynthesis`/`SpeechSynthesisUtterance` untuk suara, `SpeechRecognition`/`webkitSpeechRecognition` untuk mendengar ucapan anak.
- **Progress disimpan di `localStorage`** (per perangkat, tanpa login) untuk v1 — cukup untuk melacak level & modul yang selesai tanpa kompleksitas akun/database.
- **Kalau nanti ada logic backend** (fase berikutnya — mis. sinkronisasi progres lintas perangkat, laporan orang tua, dsb.), **wajib pakai TypeScript**, bukan JS biasa — keputusan ke depan, belum relevan di v1 karena v1 sengaja tanpa backend (lihat poin pertama).

---

## 6. Penentuan & Progres Level

- Onboarding: tanya usia/kelas anak → sistem sarankan level default → orang tua/anak boleh override manual.
- Tidak ada placement test adaptif di v1.
- Progres naik level berbasis **penyelesaian modul (mastery)**, bukan waktu atau kenaikan kelas sekolah.
- Trailblazer (B1) diakses berbasis usia (12+), bukan hasil progres linear dari Achiever.

---

## 7. Tampilan Level di UI

- Nama + emoji level → tampilan utama untuk anak.
- Badge CEFR kecil → sekunder, untuk orang tua (kredibilitas/laporan progres).
- Little Stars: tanpa badge CEFR sama sekali.

---

## 8. Pemetaan Konten Existing → Level

| Prototipe | Level |
|---|---|
| Vocabulary practice | Starter–Explorer |
| Perkenalan diri | Explorer |
| Daily conversation – belanja (ASR) | Adventurer |

---

## 9. Scope

- **In scope (v1):** Level 1–3 — Starter, Explorer, Adventurer (Pre-A1–A1)
- **Next phase:** Level 4 — Achiever (A2)
- **Next phase (low-effort):** Level 5 — Trailblazer (B1 jalur lanjutan, 1–2 modul preview)
- **Roadmap masa depan (belum discope):** Little Stars (Early Years, 3–5 th) — paradigma produk berbeda, bukan sekadar level tambahan
- **Out of scope:** kurikulum B1 penuh, level B2+, placement test adaptif, backend/database/akun pengguna, kategori Reading

---

## 10. Asumsi

- Target utama: anak usia SD (~6–12 th), dengan jangkauan tambahan ke SMP awal (12–14 th) khusus lewat Trailblazer.
- Leveling tidak diikat ke kelas sekolah formal — self-paced berbasis kemampuan.
- Platform: web app client-side, tanpa backend (detail di §5 Teknologi).

Koreksi kalau ada asumsi di atas yang meleset — bagian PRD lain (fitur, tech stack, dsb.) menyusul setelah ini disepakati.

---

## 11. Desain Visual & Layout Responsif

- **Desktop + mobile dari 1 codebase, bukan 2 desain terpisah**: rail navigasi (sidebar) di layar lebar — penuh 252px di ≥1080px, versi ringkas 92px-ikon di 768–1079px — dan tab bar bawah fixed di mobile (<768px). Konten di-reflow per breakpoint (1 kolom di mobile, kartu 2–4 kolom & panel pendamping di desktop).
- **Identitas visual sengaja dibuat beda dari kompetitor, bukan reskin**: warna primer teal "Lagoon" (`--brand-700 #0B6E6B`) + aksen mango (`--sun-500 #FFB53D`) — bukan indigo/ungu seperti kompetitor (beda ~75° hue secara sadar). Warna per-skill (Vocabulary/Listening/Speaking/Grammar) tetap ada tapi statusnya sekunder (cuma dipakai di dalam konteks skill-nya) — Vocabulary khususnya dipindah dari indigo `#6D4FE0` (kebetulan dekat dengan warna utama kompetitor) ke grape `#9B2FA8`. Tipografi tetap **Baloo 2 (heading) + Nunito (body)** — dipertahankan karena sudah jadi identitas konsisten di seluruh keluarga produk ini (3 prototipe lain + diturunkan dari referensi yang sama dgn `inggrisinyuk-app`), diperkuat lewat skala tipe yang lebih jelas, bukan diganti.
- **Navigasi 4 tujuan, semuanya nyata**: Beranda (ringkasan + lanjutkan + Peta Level), **Belajar** (skill → materi → aktivitas → Tantangan Bos — tetap **inti**/jalur utama), **Game** (main bebas/replay, lihat §12.3 — tidak menggerakkan progres), Pengaturan (suara/kecepatan + progres). Awalnya cuma 3 (tanpa Game) karena fitur itu belum nyata; sekarang Game dibangun sungguhan (bukan link kosong) jadi masuk nav — beda dari kompetitor yang juga punya Memory/Percakapan yang **tidak** kita tiru karena belum ada fiturnya.
- **Ikon chrome pakai SVG inline, bukan emoji** — emoji dicadangkan untuk konten pelajaran (kata, gambar soal); ikon UI (navigasi, kembali, centang) pakai SVG stroke currentColor supaya konsisten & scalable di semua ukuran layar.
- **Progres nyata, bukan gamifikasi ala kompetitor**: `localStorage` cuma mencatat modul yang tuntas (= 1 bintang, bukan skor) & materi terakhir dibuka (buat tombol "lanjutkan" di Beranda) — tetap tanpa coin, tanpa antrian review kartu yang diekspos ke anak, tanpa leaderboard/streak (selaras §4.6).
- Detail token warna lengkap (nilai hex + alasan tiap warna) & perbandingan struktural dengan layar kompetitor: RESEARCH.md §12. Source: [`app/public/styles.css`](app/public/styles.css).

---

## 12. Peta Level Sequential, Tantangan Bos & Game Hub

Konsep dipinjam dari dokumen game dewasa **"Anglora"** (`inggrisinyuk/prd_user_game.md` & `architecture_game.md` — produk lain, terpisah, audiens 15+) — **diadaptasi berat lewat aturan kid-friendly di atas**, bukan diporting. Detail perbandingan & alasan tiap penyesuaian: RESEARCH.md §13.

### 12.1 Aturan Buka/Kunci Level

6 level (§3) tersusun sekuensial di **Peta Level**: normalnya terkunci sampai Tantangan Bos level sebelumnya ditaklukkan, **kecuali** anak langsung menaklukkan Bos level itu sendiri (skip-ahead) — versi ramah-anak dari konsep "Duel Verifikasi" di Anglora, tanpa bayar & tanpa AI.

- Level pertama di tangga selalu terbuka.
- Level tanpa materi (di luar v1 — lihat §9) tidak pernah jadi gerbang nyata: status-nya cuma diteruskan dari level sebelumnya, tidak ada Bos yang bisa ditagih ke anak.
- **Menang Tantangan Bos = level berikutnya kebuka.** Tidak ada status "kalah" — retry tanpa batas, sama seperti aturan selesai modul biasa (§4.5), cuma bentuknya lebih besar.

### 12.2 Tantangan Bos — Bukan AI, Bukan Duel Berbayar

Beda paling penting dari Anglora: **Duel Pembisu** mereka adalah pertarungan dialog AI sungguhan (panggil LLM, berbayar, bisa "kalah"). Versi kita **100% hardcoded & client-side** (sesuai §5 — tanpa backend/AI di v1): mashup ~8 ronde dari mini-game yang sudah ada (Tebak & Cocokkan, Dengar & Pilih, Susun Kalimat, Ucapkan & Cek), ditarik dari **semua topik** level itu sekaligus (bukan cuma 1 topik) supaya terasa lebih besar — tapi tetap retry-tanpa-batas, tanpa timer, tanpa status kalah. "Menang" = semua ronde tuntas dicoba, dirayakan dengan animasi bintang + XP, framing "boss" ringan ala Mario/Pokémon gym-leader — bukan tegang.

### 12.3 Game — Hub Main Bebas (Bukan Jalur Progres)

Setara "Padang Latih" di Anglora: replay bebas mini-game yang sudah dibuka lewat Belajar, kapan saja, **tidak menambah bintang dan tidak dihitung untuk buka level baru** — Belajar tetap satu-satunya jalur ke progres/level baru ("Belajar adalah inti"). Bedanya dari Anglora (yang di sana efeknya nol total): Game di sini tetap memberi **XP kecil** per ronde supaya terasa berarti, bukan cuma pengisi waktu — lihat §12.4.

### 12.4 XP — Angka Pertumbuhan yang Cuma Naik

Terinspirasi "Stat Kefasihan yang tumbuh tiap misi ala Solo Leveling" di Anglora, tapi **sepenuhnya non-punitive**: XP cuma pernah bertambah, tidak pernah berkurang — tidak ada mekanik HP/nyawa yang bisa habis (sengaja tidak dibuat — bar kesehatan yang berkurang bentrok langsung dengan prinsip "tanpa status gagal" di §4.5/§4.6). Modul Belajar & Tantangan Bos memberi XP lebih besar daripada Game, supaya insentifnya tetap searah dengan "Belajar adalah inti". Ditampilkan di Beranda, murni motivasi — tidak membuka apa pun, tidak bisa dibelanjakan (tidak ada ekonomi coin, §4.6).
