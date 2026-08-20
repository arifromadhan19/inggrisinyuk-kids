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

- **Client-side sepenuhnya**, mengikuti pola 3 prototipe yang sudah ada. **Tidak ada backend, database, auth, atau pemanggilan AI API** di v1 — beda arah dari `inggrisinyuk` (dewasa) yang pakai Next.js/Prisma/Postgres/ChatGPT-prompt (lihat RESEARCH.md §8). Ini keputusan sadar, bukan gap. *(Direvisi sebagian di §14 — akun orang tua & placement test sekarang punya backend Next.js+Prisma+Postgres terpisah (`portal/`); `app/` sendiri TIDAK berubah, tetap client-side murni seperti poin ini.)*
- **Logic ditulis TypeScript** (bukan JS biasa, bukan full Next.js/React) — source di [`app/src/`](app/src/), di-bundle jadi `app/public/bundle.js` lewat esbuild, sehingga `app/public/` jadi 1 folder statis yang self-contained (siap upload ke VPS apa adanya, tanpa proses Node yang perlu terus nyala — beda dari `inggrisinyuk-app` yang butuh `next start` + PM2). Development lokal pakai `npm run dev` (esbuild `--servedir`, jalan di `http://127.0.0.1:8000`) — sengaja localhost, bukan buka file langsung, supaya izin mikrofon (Speaking) tersimpan permanen di browser. Detail run & deploy: [`app/README.md`](app/README.md).
- Prototipe cepat tanpa build step (`alur-modul-belajar-prototype.html`, single HTML file) tetap dipertahankan sebagai demo alur — versi TypeScript di `app/` adalah pondasi untuk pengembangan selanjutnya.
- **TTS & STT pakai Web Speech API bawaan browser**, persis seperti di `daily-conversation-asr (1).html`: `speechSynthesis`/`SpeechSynthesisUtterance` untuk suara, `SpeechRecognition`/`webkitSpeechRecognition` untuk mendengar ucapan anak.
- **Progress disimpan di `localStorage`** (per perangkat, tanpa login) untuk v1 — cukup untuk melacak level & modul yang selesai tanpa kompleksitas akun/database. Ini juga TIDAK berubah oleh §14 — `portal/` baru cuma kirim level awal hasil placement test, bukan migrasi seluruh progres ke server (§14, backlog).
- **Kalau nanti ada logic backend** (fase berikutnya — mis. sinkronisasi progres lintas perangkat, laporan orang tua, dsb.), **wajib pakai TypeScript**, bukan JS biasa — keputusan ke depan, belum relevan di v1 karena v1 sengaja tanpa backend (lihat poin pertama). §14 adalah backend PERTAMA yang benar-benar dibangun, dan memang TypeScript (Next.js), konsisten dengan poin ini.

---

## 6. Penentuan & Progres Level

- Onboarding: tanya usia/kelas anak → sistem sarankan level default → orang tua/anak boleh override manual. *(Ini tetap jalur default `app/`, tidak dihapus.)*
- ~~Tidak ada placement test adaptif di v1~~ — **direvisi di §14**: placement test sekarang ada, tapi di `portal/` (akun orang tua), deterministik/non-AI (bukan "adaptif" dalam arti AI-driven), dan hasilnya cuma menentukan level *awal* rekomendasi — bukan menggantikan cara `app/` sendiri menentukan progres (poin di bawah tetap berlaku).
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
- **Progres nyata, bukan gamifikasi ala kompetitor**: `localStorage` cuma mencatat modul yang tuntas (= 1 bintang, bukan skor) & materi terakhir dibuka (buat tombol "lanjutkan" di Beranda) — tetap tanpa coin, tanpa antrian review kartu yang diekspos ke anak, tanpa leaderboard (selaras §4.6). *(Streak sempat ditolak juga di titik ini — direvisi ulang di §13 dengan aturan non-punitive baru, bukan dihapus dari keputusan ini secara diam-diam.)*
- Detail token warna lengkap (nilai hex + alasan tiap warna) & perbandingan struktural dengan layar kompetitor: RESEARCH.md §12. Source: [`app/public/styles.css`](app/public/styles.css).
- **Iterasi kedua — dari "SaaS dashboard" ke "dunia petualangan"**: identitas warna teal+mango di atas dipertahankan (rationale-nya masih berlaku), tapi *ground*-nya diganti dari mint dingin (`#F2F7F7`, sehue dengan brand — inilah yang bikin kesan "app dewasa") jadi pasir hangat (`--paper:#FCF4E6`), supaya teal terasa seperti air laguna di atas pasir, bukan warna primer SaaS. **Peta Level** dirombak dari daftar vertikal jadi peta perjalanan sungguhan — jalur titik-titik berkelok menghubungkan 6 perhentian, tiap perhentian punya siluet medan sendiri (bukit pasir → padang → laguna → sungai → ngarai senja → puncak berbintang, lihat [`app/src/scenery.ts`](app/src/scenery.ts)) dan maskot 🦁 menandai posisi anak sekarang. **Label medan** ("Tepi Lagoon", dst.) murni dekoratif kecil di atas nama level — nama & emoji level (Little Stars…Trailblazer) tetap yang utama dan tidak diganti nama fantasi, konsisten dengan RESEARCH §13.2. Mood glossy/hangat diambil dari referensi kompetitor, mekaniknya (coin, akurasi, kalender hadiah harian terkunci) sengaja tidak diambil (masih ditolak saat itu, §4.6/§12.4) — **akurasi & streak direvisi ulang setelahnya, lihat §13**; coin & kalender hadiah harian tetap ditolak permanen.

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

**Besaran per aksi** (`app/src/app.ts`, `XP_MODULE`/`XP_BOSS`/`XP_FREEPLAY`):

| Aksi | XP | Kenapa segitu |
|---|---|---|
| Selesai 1 modul Belajar (1 putaran Latihan Inti tuntas, §4.5) | **+15** | Unit dasar — jalur paling sering diulang anak |
| Menang Tantangan Bos | **+50** | Paling besar — merayakan pencapaian yang buka level berikutnya (§12.1), sekaligus jaga "Belajar adalah inti" tetap insentif utama |
| 1 ronde di Game (hub main bebas, §12.3) | **+3** | Kecil sengaja — supaya Game tetap terasa berarti (beda dari Anglora yang efeknya nol total) tapi tidak mengalahkan Belajar/Bos sebagai sumber XP utama |

Tidak ada rumus/skala lain di luar tiga angka ini — cukup untuk "kelihatan tumbuh" tanpa kompleksitas sistem level-XP terpisah (§13.2 Anglora: 1 angka tunggal, bukan lembar status).

---

## 13. Progresmu — Panel Progres di Beranda

Kompetitor punya strip stat (koin/XP/streak/akurasi) + progress bar level di Beranda mereka (`progress_kompetitor.jpeg`, referensi internal). Diminta: tiru **konsepnya**, ditaruh di bawah Peta Petualangan mini (§11 iterasi kedua) — bukan tampilannya, dan bukan berarti membatalkan filter kid-friendly yang sudah dipakai di §11/§12. Rationale & histori lengkap tiap keputusan: RESEARCH.md §14.

### 13.1 Yang Ditiru vs Yang Tidak

| Elemen kompetitor | Diadopsi? | Kenapa |
|---|---|---|
| Progress bar menuju level berikutnya | ✅ | Bar-nya sendiri sudah ada sejak §12 (progres ke Tantangan Bos) — cuma dipindah tampil lebih menonjol di panel ini, bukan mekanik baru |
| XP | ✅ (sudah ada) | Tidak berubah dari §12.4 — cuma ikut ditampilkan di panel ini |
| Streak harian | ✅ (direvisi) | Sempat sengaja ditolak (§11 — "tanpa leaderboard/streak") karena streak biasa langsung "putus" begitu libur sehari. Sekarang dipasang dengan **1 hari pelindung**: libur satu hari tidak mereset hitungan, baru reset kalau libur 2 hari berturut-turut — beda dari streak kompetitor & kebanyakan app lain |
| "HP" (istilah RPG/anime) | ❌ | Bentrok langsung dengan §12.4 (tidak boleh ada stat yang bisa habis) — diputuskan cukup XP saja, tanpa stat kedua yang berpotensi dibaca sebagai health bar |
| Akurasi (tepat/total) | ✅ (direvisi) | Sempat ditolak sebagai bahasa "evaluatif" ala app dewasa (RESEARCH §11.2). Sekarang ditampilkan dengan label "Ketepatan" (bukan "skor"/"nilai") dan disembunyikan jadi "–" kalau belum ada percobaan sama sekali (state kosong tidak ditampilkan mencolok, §4.6). Cuma menghitung soal berjawaban objektif (pilih gambar, susun kata/kalimat) — **tidak** menghitung percobaan lewat mic (Speaking), karena ASR anak tidak selalu akurat & mic memang sudah didesain "selalu dianggap berhasil" (lihat games/*.ts) |
| Coin | ❌ | Tetap ditolak — §4.6 mengunci tanpa mata uang, tidak berubah |
| Kalender hadiah harian (terkunci per-hari) | ❌ | Tidak diminta di revisi ini & tetap berisiko dark-pattern (buka kunci berbasis waktu/kunjungan harian) — di luar scope |

### 13.2 Non-Punitive Tetap Dijaga

- Streak & akurasi **tidak pernah** menggerbang progres (buka level/modul baru) — itu tetap murni dari penyelesaian modul & Tantangan Bos (§4.5/§12.1). Keduanya cuma tampilan motivasi tambahan.
- Streak yang reset (setelah lewat 1 hari pelindung) kembali diam-diam ke 0 — tanpa notifikasi, banner, atau bahasa "streak-mu hilang".
- Akurasi rendah tidak pernah ditandai warna "gagal" (merah) atau kata evaluatif — tetap palet brand yang sama, cuma angka + label "Ketepatan".

---

## 14. Akun Orang Tua (Login) & Placement Test

Pivot besar: `inggrisinyuk-kids` sekarang punya backend **untuk pertama kalinya** — `portal/`, proyek Next.js+Prisma+PostgreSQL terpisah di root repo. Ini membalik sebagian §5 (yang sebelumnya eksplisit "tanpa backend/database/auth ... keputusan sadar, bukan gap") — pembalikan ini SENDIRI juga keputusan sadar, diminta eksplisit oleh user, bukan scope creep diam-diam.

**Penting — arsitektur direvisi di tengah sesi ini**: desain awal `portal/` adalah aplikasi Next.js dengan halaman sendiri (login/dashboard/placement-test di URL/port terpisah, dibuka via link "Buka App Anak" dari `app/`). User lalu eksplisit minta: **"tidak usah dipisah jadi login tetap di app anak"** dan **"fokus ke app anak, jangan pernah buat apps lain"** — jadi `portal/` DIROMBAK jadi API murni tanpa halaman sama sekali (dihapus semua `page.tsx`/`layout.tsx`), dan SEMUA tampilan (login, daftar, placement test, retest) dipindah jadi layar baru DI DALAM `app/` yang sudah ada. User cuma pernah buka **satu URL** (`app/`); `portal/` murni proses backend di belakang layar yang dipanggil lewat `fetch()`, tidak pernah dibuka langsung. Detail teknis: §14.6.

Rationale & histori lengkap (termasuk temuan 3 subagent yang membaca kode asli `inggrisinyuk` dewasa): RESEARCH.md §15.

### 14.1 Kenapa Beda dari `inggrisinyuk` Dewasa di Titik Auth

`inggrisinyuk` (dewasa) ternyata **tidak punya password sama sekali** untuk user biasa — login via nomor WA (lookup) atau Google OAuth, password cuma dipakai admin panel. Setelah dikonfirmasi ulang, user tetap memilih **password-based login** (no HP/email + password) untuk kids-app ini — pilihan sadar yang beda dari pola asli, bukan salah paham soal bagaimana `inggrisinyuk` bekerja.

### 14.2 Scope: Login + Placement Test — Sisanya Backlog

Dipersempit di tengah diskusi ("saat ini cukup login saja dan placement test, sisanya masuk backlog dulu"):

**Dibangun**:
- Registrasi & login orang tua (`ParentAccount` — no HP/email + password, bcrypt, sesi JWT dikirim sbg token — bukan cookie, lihat §14.6) — layarnya di `app/` (Pengaturan → Masuk/Daftar).
- **Placement test** ("Main Dulu, Yuk!") — deterministik/non-AI, scoring mastery/ceiling (mulai dari level pertama, naik selama threshold band terpenuhi, berhenti di kegagalan pertama), **server re-scoring** dari jawaban mentah (client tidak dipercaya) — pola yang sama persis dengan placement test `inggrisinyuk` dewasa, cuma jumlah soal & level jauh lebih sedikit (9 soal, 3 band: Starter/Explorer/Adventurer, bukan 40 soal/6 CEFR). Layarnya reuse mekanik Tebak & Cocokkan yang sudah ada di `app/src/games/`.
- Skip ("Nanti Aja") → level default ke level pertama (Starter) — persis kalimat user "jika belum ambil maka akan mulai dari level awal".
- Kartu "Akun Orang Tua" di Pengaturan: kalau sudah login, tampil no HP/email + "Ulangi Placement Test" + "Keluar" (logout).
- **Nudge placement test** di layar Belajar — tampil selama placement test belum benar-benar selesai (termasuk sempat di-skip), hilang begitu selesai (§14.7).
- **3 cara buka level** & **boss sequential** (revisi PRD §12.1) — §14.8.

**Backlog** (dicatat eksplisit, bukan hilang):
- Checkout/pembayaran (Xendit) — awalnya diminta "password diberikan setelah sukses beli" (pola gated-beli mirip `inggrisinyuk` dewasa), sekarang **registrasi langsung** dulu (orang tua bikin password sendiri, tanpa pembayaran).
- Notifikasi WA/email (pengiriman kredensial dsb.) — belum ada akun WA Business API, di-scaffold nanti kalau checkout digarap.
- Dashboard orang tua penuh (riwayat progres, dsb.), multi-anak per akun, sinkronisasi penuh progres `app/` (localStorage) ke server.

### 14.3 Kid-Friendly Filter di Placement Test (CLAUDE.md, wajib)

Placement test versi dewasa (40 soal, timer 30 menit, teks grammar/reading berat) **tidak diporting mentah** — difilter:
- **Tanpa timer** — versi dewasa 30 menit; ditolak karena bentrok §4.6/RESEARCH §11.2 (filosofi "tanpa timer/skor/gagal").
- **Audio-first, tap-emoji** — reuse mekanik **Tebak & Cocokkan** yang sudah ada di `app/src/games/vocabulary.ts` (TTS ucapkan kata, anak tap gambar), bukan soal bacaan (target usia 5–13 th, banyak pre-reader).
- **Framing hangat**: "Main Dulu, Yuk!" bukan "Tes Penempatan", retry-friendly, skip jelas tanpa rasa bersalah.
- Prinsip **non-AI/deterministik** dari versi dewasa dipertahankan penuh — selaras §5 (tanpa AI API).

### 14.4 (Superseded) Jembatan Link — Digantikan Panggilan API Langsung

*Desain awal* (sempat dibangun, lalu diganti): dashboard `portal/` yang terpisah kirim level hasil test lewat query param (`?assignedLevel=`) ke `app/`. **Sudah tidak berlaku** — sejak login pindah ke dalam `app/` (§14.6), tidak ada lagi link/handoff sama sekali; `app/` panggil API `portal/` langsung lewat `fetch()` kapan saja (saat app dibuka & setelah placement test), jadi datanya selalu segar, bukan snapshot satu kali dari sebuah link.

### 14.5 Login TIDAK untuk Anak

Konfirmasi user: login cuma untuk orang tua ("1 akun keluarga"). Anak main di `app/` seperti biasa dalam sesi yang sama — tidak ada layar login WAJIB, semua layar akun (Masuk/Daftar/Placement Test) diakses lewat kartu opsional di Pengaturan, bukan gerbang di depan app.

### 14.6 Arsitektur: `portal/` API Murni, Semua Tampilan di `app/`

Keputusan final (setelah revisi arsitektur di §14 pembuka):

- **`app/` tetap satu-satunya yang dibuka user** — statis, esbuild, PRD §5 tidak berubah. Login/Daftar/Placement Test sekarang jadi *screen* baru di `app/src/app.ts` (`renderAccount`, `renderPlacementTestScreen`), reuse shell/nav/desain yang sama persis dengan layar lain.
- **`portal/` jadi API murni** — tanpa satu pun halaman (`app/page.tsx`/`layout.tsx`/dst dihapus semua), cuma `app/api/**/route.ts`. Tetap butuh proses Node + Postgres yang terus nyala (`app/` statis tidak bisa menjalankan database sendiri) — tapi user tidak pernah berinteraksi dengannya sebagai "aplikasi", murni backend di belakang layar.
- **Auth pakai TOKEN, bukan cookie** — `app/` (origin beda, port beda) dan `portal/` adalah dua origin terpisah; cookie session lintas-origin butuh `SameSite=None; Secure` yang gampang bermasalah beda browser/protokol (HTTP di dev). Solusinya: login/registrasi balikin token di response body, `app/` simpan di `localStorage` sendiri (modul baru `app/src/account.ts`), dikirim lewat header `Authorization: Bearer` di tiap panggilan berikutnya.
- **CORS** — `portal/middleware.ts` (bukan lagi page-guard, karena tidak ada halaman) sekarang isinya cuma header CORS (`Access-Control-Allow-Origin` ke origin `app/`) + tangani preflight `OPTIONS`.
- Kenapa tidak digabung total jadi satu Next.js seperti `inggrisinyuk-app` (sempat ditanya user): technically bisa, tapi berarti menulis ulang SELURUH `app/` (semua game/Peta Level/dst) dari TypeScript-vanilla ke React — proyek yang jauh lebih besar daripada menambah login+placement test. Dipertahankan sebagai kandidat masa depan, bukan dikerjakan sekarang.

### 14.7 Nudge Placement Test di Layar Belajar

"Muncul di Belajar selama belum sampai akhir mengerjakan placement test" (kalimat user) — logic-nya di `renderMenu()` (`app.ts`): nudge tampil kalau `getCachedChildStatus().placementTestDone === false` (pernah login, TAPI belum benar-benar selesai — termasuk yang sempat di-skip), dan **disembunyikan total** (bukan `false`, tapi `null`) kalau belum pernah login sama sekali — supaya user yang tidak pakai fitur akun tidak di-nudge terus (`app/` tetap jalan penuh standalone, §14.5). Cache ini disegarkan tiap `app/` dibuka (`refreshChildStatus` di `initApp`) dan tiap habis placement test — bukan real-time, tapi cukup segar untuk kebutuhan ini.

### 14.8 Tiga Cara Buka Level & Boss Sequential (revisi §12.1)

Permintaan user eksplisit — 3 jalur buka level yang berlaku bersamaan:

1. **First placement test** menentukan level awal — hasil test langsung dipakai untuk unlock (bukan cuma "rekomendasi kosmetik"), lihat mekanisme di bawah.
2. **Tantang Bos langsung, TAPI sequential** — §12.1 lama membolehkan skip-ahead ke level manapun yang masih terkunci. **Direvisi**: cuma level terkunci **pertama** (persis di depan batas level yang sudah terbuka) yang tombol Tantangan Bos-nya hidup ("🎯 Coba Tantangan Bos, Buka Duluan"); level yang lebih jauh tombolnya **mati** ("🔒 Bos Terkunci", disabled) sampai level di depannya ditaklukkan dulu secara berurutan. Implementasi: `firstLockedIndex` di `renderLevels()` (`app.ts`) — `levelUnlockMap` sendiri (progress.ts) TIDAK berubah, cuma affordance UI yang dibatasi.
3. **Belajar di level sekarang + placement test** — dikonfirmasi user: ini BUKAN game baru, ini Tantangan Bos yang sudah ada (poin 2) plus placement test (poin 1) — dua mekanisme yang sudah ada, bukan mekanisme ketiga yang perlu dibangun terpisah.

**Placement test ada di 2 titik**: (1) placement test pertama (saat baru login/daftar, otomatis diarahkan), (2) retest kapan saja dari Pengaturan. Keduanya pakai fungsi `unlockLevelsUpTo()` yang sama (`app.ts`) — kalau hasilnya level X, semua level SEBELUM X ditandai Bos-nya "ditaklukkan" (`markBossCleared`, reuse fungsi yang sudah ada di `progress.ts` — bukan field baru). Ini yang bikin **"retest naik level = beberapa level otomatis kebuka"**: karena level tanpa materi (`hasContent:false`) mewarisi status unlock dari level sebelumnya (`levelUnlockMap` yang sudah ada), menaklukkan 1 boss lewat placement test bisa mengalir buka 2-3 level sekaligus (level asli + level-level kosong di belakangnya) — perilaku yang sudah ada, bukan logic baru, cuma sekarang punya jalur baru (placement test) untuk memicunya selain menang Tantangan Bos manual.
