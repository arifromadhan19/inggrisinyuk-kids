# PRD — Aplikasi Bahasa Inggris untuk Anak (Working Title: InggrisinYuk Kids)

Status: **Final — sistem leveling & struktur materi v1**
Terakhir diupdate: 2026-08-21

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
| 0 | **Little Stars** (Early Years) | — (di luar CEFR) | 3–5 th | — | **Revisi §16.9**: Vocabulary & Listening sudah diauthoring (`hasContent:true`, keduanya 10/10 topik) — **Revisi §16.10**: Reading juga sudah mulai (1 topik, format KEDUA khusus "Baca Kata" whole-word) — Speaking juga sudah mulai (1 topik, format KEDUA `SpeakingPhraseTopic`) — **Revisi §16.12**: Grammar juga sudah mulai (1 topik, format KEDUA `GrammarPatternTopic` "Satu atau Banyak?") |
| 1 | **Starter** 🌱 | ≈ Pre-A1 | 5–7 th | (pra-Starters) | **Revisi §16.9**: Vocabulary & Listening sudah diauthoring (`hasContent:true`, keduanya 10/10 topik) — **Revisi §16.13**: Reading juga sudah mulai (1 topik, format KEDUA "Baca Kata" spt Little Stars) — Speaking juga sudah mulai (1 topik, format KEDUA `SpeakingPhraseTopic` "Makanan Kesukaanku") — **Revisi §16.15**: Grammar juga sudah mulai (1 topik, format KEDUA `GrammarPatternTopic` "Suka atau Tidak Suka?") |
| 2 | **Explorer** 🧭 | ≈ Pre-A1 → A1 | 7–9 th | Pre A1 Starters | **Materi nyata ada** (`hasContent:true`) — 4 skill: Vocabulary, Listening (**Revisi §16.9**: sekarang 10/10 topik), Speaking, Grammar (**Revisi §16.15**: 3→4 topik, +"Prepositions of Place"). **Revisi §16.13**: Reading sekarang JUGA ada — 1 topik, format KETIGA BARU `ReadingCheckTopic` ("Baca & Nilai", 1 kalimat+gambar → Benar/Salah) |
| 3 | **Adventurer** 🚀 | ≈ A1 | 9–11 th | A1 Movers | **Materi nyata ada** (`hasContent:true`, diauthoring §15.1) — 5 skill termasuk Reading (§15.2), **Revisi §16.9**: Listening sekarang 10/10 topik. **Revisi §16.13**: Reading digenapkan 2→10/10 topik — level Reading PERTAMA yg capai target ≥10. **Revisi §16.15**: Grammar 1→2 topik, +"Comparatives" |
| 4 | **Achiever** 🏆 | ≈ A1 → A2 | 11–13 th | A2 Flyers | **Revisi §16.9**: Vocabulary & Listening sudah diauthoring (`hasContent:true`, keduanya 10/10 topik — Listening pakai format BARU "note completion", `ListeningNoteTopic`) — **Revisi §16.13**: Reading juga sudah mulai (1 topik, format lama `ReadingTopic` reuse dgn konten "Format C+" — passage lebih panjang + 1 pertanyaan inferensi) — Speaking juga sudah mulai (1 topik BARU dari nol, format LAMA `SpeakingTopic` "Describing People"). **Revisi §16.15**: Grammar juga sudah mulai (1 topik BARU dari nol, format LAMA `GrammarTopic` dgn konten kontras "Present Continuous vs Simple") |
| 5 | **Trailblazer** ✨ *(jalur lanjutan)* | ≈ B1 | 12+ th | A2 Key → B1 Preliminary for Schools | **Revisi §16.9**: Vocabulary TETAP PERSIS 2 modul sesuai scope lama (§9, blm disentuh sesi §16.14) — Listening REVISI SCOPE eksplisit, sekarang 10/10 topik (format BARU KEEMPAT "dialog + inferensi", `ListeningDialogueTopic`) — **Revisi §16.14**: target Trailblazer dinaikkan jadi ≥5 topik/skill (§9), Reading sekarang 5/5 topik (format lama `ReadingTopic` reuse, konten B1) — Speaking juga sudah mulai (1/5 topik, format KETIGA BARU `SpeakingInterviewTopic` "Future Plans"). **Revisi §16.15**: Grammar juga sudah mulai (1/5 topik, format KETIGA BARU `GrammarTransformTopic` "Reported Speech" — transformasi kalimat MCQ ala PET Writing Part 1, user memilih revisi penuh drpd default low-effort; BELUM capai target Trailblazer ≥5). **Revisi §16.6c**: Vocabulary SEKARANG 10/10 topik juga (melebihi target baku ≥5, atas instruksi eksplisit user — 5 topik lama diaudit dulu, 0 pelanggaran, baru 5 topik baru ditambah) |

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

**Tagline & mode kognitif tiap skill** — independen dari level, dipakai sebagai lensa tiap kali menambah materi baru supaya tiap skill tetap pada fokus ujinya sendiri, tidak tumpang tindih dengan skill lain:

| Skill | Tagline | Core mode | Yang diuji |
|---|---|---|---|
| Vocabulary | "Kenal kata baru" | Receptive + select | Anak tahu arti sebuah kata (dua arah EN↔ID)? |
| Listening | "Dengar & pahami" | Receptive (telinga) | Anak bisa memahami Bahasa Inggris yang diucapkan? |
| Reading | "Baca & pahami sendiri" | Receptive (mata) | Anak bisa memahami Bahasa Inggris tertulis sendiri? |
| Grammar | "Susun pola kalimat" | Receptive + select | Anak tahu bagaimana kata-kata digabung jadi pola yang benar? |
| Speaking | "Berani ngomong" | Productive (suara) | Anak bisa menghasilkan ucapan Bahasa Inggris sendiri? |

Vocabulary dan Grammar sama-sama "receptive + select" (anak MEMILIH dari opsi, bukan menghasilkan sendiri) tapi beda objek uji (arti kata vs pola susunan); Listening dan Reading sama-sama receptive tapi beda indera (telinga vs mata) — ini alasan struktural kenapa Reading `passage`/`story` **tidak pernah** diucapkan TTS (§4.4) sementara Listening selalu audio-first: membacakan teks Reading via TTS akan membuatnya diam-diam jadi tes Listening, menghapus perbedaan indera yang justru jadi alasan skill ini eksis terpisah. Speaking satu-satunya skill **productive** (anak menghasilkan ucapan sendiri, bukan memilih opsi) — ini yang mendasari kenapa skill ini butuh aturan skor & "Play Suaramu" sendiri (§15.5) yang tidak berlaku ke skill lain.

### 4.2 Modul Grammar per Level (contoh topik)

| Level | Contoh Modul Grammar |
|---|---|
| Starter (≈Pre-A1) | Kata Ganti Orang (Pronouns), Pola "I am / You are" (To Be), Kata Ganti Milik (Possessives) — tema perkenalan diri |
| Explorer (≈Pre-A1→A1) | This/That/These/Those, There is/There are, Kata Tunjuk & Kata Tanya, Jamak & Artikel |
| Adventurer (≈A1) | Simple Present, Present Continuous, Can/Can't, Preposisi Tempat, Kata Ganti Objek, Countable & Uncountable, Comparative & Superlative |
| Achiever (≈A1→A2) | Simple Past (reguler & tak beraturan), Kata Keterangan (Adverbs), Modal Verbs, Future (will/going to), Gerund & Infinitive |
| Trailblazer (≈B1, jalur lanjutan) | Reported Speech, Conditional lanjutan — tetap 1–2 modul saja |

### 4.3 Prinsip Loop Aktivitas

Kompetitor pakai 1 loop seragam di semua submodul: **Baca Materi → Susun Kata → Kuis Latihan → Ulangi Kuis** (skor akurasi %, kartu SRS "siap direview", coin) — termasuk "Susun Kata" muncul juga di dalam modul **Vocabulary**, bukan cuma Grammar. **Sengaja tidak dicontek 100%**, tapi shell-nya (1 pola langkah yang konsisten dipakai di semua submodul) dipertahankan karena bagus untuk anak — sekali paham alurnya di satu submodul, anak langsung paham di submodul lain.

**Revisi dari rencana awal — implementasi akhir SATU loop seragam di semua level/skill, bukan Loop A/B terpisah per usia**: `STEP_LABELS` (`app/src/app.ts`) adalah array tetap **3 langkah — Kenalan → Latihan Inti → Tantangan** — dipakai persis sama untuk Little Stars sampai Trailblazer, Vocabulary sampai Grammar, tanpa cabang usia. Rencana awal dokumen ini (Loop A 3-langkah tanpa Tantangan utk usia muda vs Loop B 4-langkah dgn "Asah Lagi" utk usia besar) **tidak jadi dibangun seperti itu** — dianggap kompleksitas ekstra yang tidak terbukti perlu begitu implementasi jalan: Tantangan sendiri sudah opsional/bonus (§4.5), jadi anak yang belum siap otomatis bisa berhenti di Latihan Inti tanpa perlu loop terpisah. "Main Lagi"/"Asah Lagi" sebagai langkah ke-4 eksplisit **tidak pernah dibangun** — prinsip di baliknya (item yang salah otomatis diselipkan ke ronde berikutnya, bukan antrian review terpisah) masih berlaku sebagai *aspirasi* backlog, belum ada implementasinya di kode manapun hari ini (retry sekarang murni "tap opsi lain di soal yang sama sampai benar", bukan penjadwalan ulang berbasis riwayat).

### 4.4 Alur Konkret per Submodul

Isi tiap langkah, disesuaikan skill — pakai contoh topik yang sudah ada di prototipe. **Kolom Tantangan Vocabulary di tabel ini rencana AWAL (Loop B), sudah digantikan implementasi 3-tab di §15.6** (Eja Kata/Susun Kalimat/Penggunaan, bukan lagi "2 giliran" digabung) — baca §15.6 utk struktur Tantangan Vocab yang sebenarnya berjalan:

| Submodul | Kenalan | Latihan Inti | Tantangan (Loop B saja) |
|---|---|---|---|
| **Vocabulary** | TTS ucapkan kata + gambar/emoji muncul (kata ikut ter-highlight kalau anak sudah mulai baca) | **Tebak & Cocokkan** — beberapa gambar tampil, TTS ucapkan 1 kata, anak tap gambar yang cocok | 2 giliran: **(1) Eja Kata** — huruf kata diacak jadi chip, anak susun jadi kata yang benar (di level huruf, bukan kalimat — baru masuk dari Explorer ke atas). **(2) Contoh Penggunaan** — kata dipakai dalam 1 kalimat konteks (mis. "two" → "Budi has two apples" + terjemahan), anak dengar lalu **coba ucapkan** (reuse mekanik Ucapkan & Cek), lalu **susun kata** kalimat itu dari chip acak (reuse mekanik Susun Kalimat) |
| **Listening** | TTS mainkan 1 kalimat pendek dalam konteks (mis. adegan belanja) + gambar suasana | **Dengar & Pilih** — TTS ucapkan kata/kalimat, anak tap gambar/opsi yang benar | **Dengar Cerita Pendek** — TTS mainkan mini-dialog 2–3 kalimat, anak jawab 1 pertanyaan (siapa/apa/di mana) dengan tap |
| **Speaking** | TTS contohkan pengucapan frasa target — anak dengar dulu sebelum praktik | **Ucapkan & Cek** — anak tap mic, ucapkan frasa, STT bandingkan, feedback cocok/mirip/ulangi (non-punitive, retry tanpa batas) | **Mini-Roleplay** — 2–3 giliran tanya-jawab beruntun (pola dari `daily-conversation-asr.html`) |
| **Grammar** | Pola dikenalkan lewat 2 contoh audio+gambar berpasangan (mis. "This is a cat" + gambar kucing, "This is a dog" + gambar anjing) — bukan penjelasan aturan | **Susun Kalimat** — chip kata diacak, anak susun jadi kalimat sesuai pola | **Bikin Sendiri** — anak pilih kata dari 2–3 opsi untuk melengkapi kalimat baru tentang dirinya sendiri (jembatan ke Speaking) |

Roleplay tidak jadi kategori terpisah — sudah menyatu di Speaking (2 dari 3 prototipe existing memang berbentuk roleplay). Modul "Professional" dari `inggrisinyuk` tidak diadopsi. **"Reading"** (kategori ke-5 di kompetitor) — *revisi*: sekarang SUDAH masuk v1 (bukan lagi kandidat/out-of-scope), diauthoring untuk Adventurer (§15.2). Beda prinsip dari Listening: teks `passage`/`story` di Reading **TIDAK PERNAH diucapkan TTS** (dibaca sendiri oleh anak, silent) — kalau dibacakan, itu jadi tes dengar lagi, bukan tes baca. Ini kebalikan dari alasan awal "arah v1 audio-first" — begitu ada level dengan anak yang mulai melek huruf (Adventurer, ≈9–11 th), justru dibutuhkan format yang secara eksplisit MELATIH baca-sendiri, bukan didikte TTS terus.

**Kenapa Vocabulary butuh "Contoh Penggunaan"**: Tebak & Cocokkan dan Eja Kata sama-sama melatih kata **secara terisolasi** — bagus untuk pengenalan, tapi belum tentu nempel maknanya kalau kata cuma berdiri sendiri. Contoh Penggunaan menaruh kata dalam kalimat nyata + minta anak dengar-ucapkan-susun, jadi 1 kata dilatih lewat 3 indera sekaligus (dengar, ucap, susun) dan reuse mekanik yang sudah ada (Ucapkan & Cek dari Speaking, Susun Kalimat dari Grammar) — tanpa bikin game baru. Ini juga menyamai kompetitor yang memang punya "Susun Kata" di dalam modul Vocabulary (RESEARCH.md §11), bedanya di kita digabung dengan latihan Speaking dulu, bukan berdiri sendiri.

### 4.5 Aturan Selesai & Pengulangan

- **Selesai = 1 putaran Latihan Inti tuntas** (semua item di set topik itu sudah dicoba), **bukan skor minimum** — retry unlimited, tidak ada gate nilai. Ini yang mengizinkan progres naik level tanpa tekanan gagal (§4.3, filosofi Endless Alphabet).
- Tantangan (Loop B) bersifat bonus/opsional — tidak menghalangi modul ditandai selesai kalau dilewati.
- Item yang salah/lambat dijawab otomatis punya bobot lebih tinggi untuk muncul lagi di sesi Latihan Inti berikutnya — bukan ditampilkan sebagai daftar review terpisah ke anak.

### 4.6 Prinsip Gamifikasi

- Reward pakai **bintang/stiker**, bukan "coin" — hindari framing mata uang ke anak.
- ~~Tidak ada leaderboard/perbandingan antar-anak di v1 — hindari kecemasan sosial di usia ini.~~ — **direvisi di §17**: leaderboard XP sekarang ADA (permintaan user, alasan "progres sudah disimpan di database"), TAPI dianonimkan total (avatar hewan + XP saja, tanpa nama/ranking eksplisit per anak) — filter kid-friendly tetap berlaku penuh, cuma bentuknya yang berubah dari "tidak ada sama sekali" jadi "ada, tapi aman".
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

- **In scope (v1):** Level 1–3 — Starter, Explorer, Adventurer (Pre-A1–A1). **Materi nyata sejauh ini**: Explorer (4 skill, Vocabulary *revisi §16* sekarang 10/10 topik) & Adventurer (5 skill termasuk Reading) — Starter *revisi §16*: Vocabulary sudah diauthoring, skill lain menyusul.
- **Reading** — *revisi*: sekarang in-scope (bukan lagi out-of-scope), diauthoring utk Adventurer (§15.2).
- **Next phase:** Level 4 — Achiever (A2) — *revisi §16*: Vocabulary sudah diauthoring, skill lain menyusul
- **Next phase (low-effort, TAPI target dinaikkan — 🔒 revisi user):** Level 5 — Trailblazer (B1 jalur lanjutan) — target lama "1–2 modul preview" DINAIKKAN jadi **minimal 5 topik/skill** (CLAUDE.md "Target Kelengkapan Konten per Modul" poin 1), TETAP lebih ringan dari 5 level lain (≥10 topik/skill) krn levelnya tetap "jalur lanjutan" opsional (usia 12+, bukan hasil placement test) — bukan disamakan penuh. Revisi ini TARGET KE DEPAN per-skill, BUKAN mandat retroaktif — skill yang sudah dikunci ke target LAMA dgn keputusan sadar sebelumnya tidak otomatis perlu digenapkan sekarang, target baru berlaku begitu skill itu disentuh lagi. *Revisi §16*: **Reading §16.14 SUDAH capai target BARU (5/5 topik)** — **Revisi §16.6c: Vocabulary SUDAH disentuh & MELEBIHI target BARU (10/10 topik, bukan cuma ≥5)** — skill lain (Grammar/Speaking, per §16.15) menyusul kemudian.
- **Little Stars (Early Years, 3–5 th)**: *revisi §16* — Vocabulary & Listening sudah diauthoring 10/10 topik, Reading/Speaking/Grammar juga sudah mulai (masing-masing 1 topik, format kedua khusus level ini, §16.10/§16.12)
- **Out of scope:** kurikulum B1 penuh, level B2+, placement test adaptif (AI-driven), backend/database/akun pengguna di luar §14 (login orang tua + placement test)

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
- **Navigasi 5 tujuan, semuanya nyata**: Beranda (ringkasan + lanjutkan + Peta Level), **Belajar** (skill → materi → aktivitas → Tantangan Bos — tetap **inti**/jalur utama), **Game** (main bebas/replay, lihat §12.3 — tidak menggerakkan progres), **Rapor** (laporan progres lengkap buat orang tua — Progresmu + Skor Tiap Skill + Progres Harian + Hasil Placement Test + Papan Peringkat, lihat `renderRapor`/CLAUDE.md "Tab Rapor" — beda dari ringkasan cepat yang tetap ada di Beranda), Pengaturan (suara/kecepatan + akun). Awalnya cuma 3 (tanpa Game) karena fitur itu belum nyata; Game dibangun sungguhan (bukan link kosong) jadi masuk nav, lalu Rapor ditambah belakangan sbg tab tersendiri — beda dari kompetitor yang juga punya Memory/Percakapan yang **tidak** kita tiru karena belum ada fiturnya.
- **Ikon chrome pakai SVG inline, bukan emoji** — emoji dicadangkan untuk konten pelajaran (kata, gambar soal); ikon UI (navigasi, kembali, centang) pakai SVG stroke currentColor supaya konsisten & scalable di semua ukuran layar.
- **Progres nyata, bukan gamifikasi ala kompetitor**: `localStorage` cuma mencatat modul yang tuntas (= 1 bintang, bukan skor) & materi terakhir dibuka (buat tombol "lanjutkan" di Beranda) — tetap tanpa coin, tanpa antrian review kartu yang diekspos ke anak (selaras §4.6). *(Streak sempat ditolak juga di titik ini — direvisi ulang di §13 dengan aturan non-punitive baru; leaderboard juga sempat ditolak total di titik ini — direvisi di §17 jadi versi dianonimkan — keduanya bukan dihapus dari keputusan ini secara diam-diam, tapi direvisi eksplisit di dokumen ini sendiri.)*
- Detail token warna lengkap (nilai hex + alasan tiap warna) & perbandingan struktural dengan layar kompetitor: RESEARCH.md §12. Source: [`app/public/styles.css`](app/public/styles.css).
- **Iterasi kedua — dari "SaaS dashboard" ke "dunia petualangan"**: identitas warna teal+mango di atas dipertahankan (rationale-nya masih berlaku), tapi *ground*-nya diganti dari mint dingin (`#F2F7F7`, sehue dengan brand — inilah yang bikin kesan "app dewasa") jadi pasir hangat (`--paper:#FCF4E6`), supaya teal terasa seperti air laguna di atas pasir, bukan warna primer SaaS. **Peta Level** dirombak dari daftar vertikal jadi peta perjalanan sungguhan — jalur titik-titik berkelok menghubungkan 6 **markas** (istilah final, lihat §15.7 — sebelumnya "perhentian"), tiap markas punya siluet medan sendiri (padang pasir → kebun bunga → pantai biru → sungai deras → gunung senja → puncak bintang, lihat [`app/src/scenery.ts`](app/src/scenery.ts)) dan maskot 🦁 menandai posisi anak sekarang. **Label medan** murni dekoratif kecil di atas nama level — nama & emoji level (Little Stars…Trailblazer) tetap yang utama dan tidak diganti nama fantasi, konsisten dengan RESEARCH §13.2. Mood glossy/hangat diambil dari referensi kompetitor, mekaniknya (coin, akurasi, kalender hadiah harian terkunci) sengaja tidak diambil (masih ditolak saat itu, §4.6/§12.4) — **akurasi & streak direvisi ulang setelahnya, lihat §13**; coin & kalender hadiah harian tetap ditolak permanen.

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
- **Placement test** ("First Placement Test" / "Main Dulu, Yuk!") — deterministik/non-AI, scoring mastery/ceiling (mulai dari level pertama, naik selama threshold band terpenuhi, berhenti di kegagalan pertama), **server re-scoring** dari jawaban mentah (client tidak dipercaya) — pola yang sama persis dengan placement test `inggrisinyuk` dewasa, cuma jumlah soal & level jauh lebih sedikit (3 band: Starter/Explorer/Adventurer, bukan 6 CEFR). *Revisi dari draf awal (5 skill, bukan cuma Tebak & Cocokkan)* — detail lengkap format & skor: §15.4.
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

4. **Semua level DI BAWAH level anak sekarang harus sudah terbuka PENUH** (konfirmasi user, testing akun Adventurer) — begitu anak berada di level X (dari placement test maupun progres main biasa), setiap level sebelum X yang punya materi (`hasContent:true`) wajib tampil dengan **dua tombol aktif**: "📋 Buka Menu Belajar" DAN "🔁 Main Lagi Lawan Bos" (Bos-nya berstatus SUDAH ditaklukkan, bukan "🎯 Coba Tantangan Bos" yang masih perlu dimenangkan lagi) — anak tidak pernah diminta mengulang perjuangan level yang sudah dilewati. Konsekuensi langsung dari poin di atas (`unlockLevelsUpTo` menandai `markBossCleared` utk semua level < X), dicatat eksplisit di sini supaya tidak regresi kalau logic unlock/Peta Level disentuh lagi.

---

## 15. Iterasi Setelah §14 — Konten per Level, Reading, Apresiasi & First Placement Test Diperluas

Rangkaian revisi lanjutan, semua permintaan user langsung (bukan riset baru) — menyambung §14 tanpa membalik keputusan yang sudah dikunci di sana.

### 15.1 Konten per Level — Adventurer Diauthoring, Bukan Lagi Cuma Explorer

Sampai sebelum iterasi ini, `app/` cuma pernah punya **satu set konten global** (`VOCAB_TOPICS`, dst) yang dipakai apa adanya berapa pun level anak — jadi meski `hasContent` di §3 bisa ditandai true/false per level, PRAKTIKNYA setiap anak selalu lihat konten Explorer, termasuk anak yang placement test-nya (§14) merekomendasikan Adventurer. Direvisi:

- Konten sekarang **per-level sungguhan** (`*_TOPICS_BY_LEVEL` di `content.ts`) — Explorer & Adventurer masing-masing punya topik sendiri per skill, bukan satu set yang dipakai bersama.
- **Adventurer diauthoring duluan** (permintaan user eksplisit: "fokus pada materi di level adventure dulu") — Vocabulary (Pekerjaan/Jobs, Binatang/Animals — 10 kata masing-masing), Listening (Di Bandara), Speaking (Membuat Janji), Grammar (Simple Past), Reading (§15.2). `hasContent` Adventurer di §3 sekarang **true**, bukan lagi placeholder.
- **Fallback "level konten terdekat"** — kalau level BADGE asli anak (mis. Starter, atau Little Stars) tidak punya materi sama sekali, Menu Belajar/Game tidak dibiarkan kosong: konten yang ditampilkan jatuh ke level ber-materi terdekat (biasanya Explorer), sementara badge/chip level TETAP menampilkan level asli anak apa adanya — dua hal ini sengaja dipisah (implementasi: `currentPlayableLevel()` vs `currentLevelMeta()`, `app.ts`). Pola fallback yang sama juga dipakai Tantangan Bos (`games/boss.ts`) dan link "Buka App Anak" di dashboard orang tua (`portal/lib/placement-scoring.ts` `resolvePlayableLevel`) — tiga tempat independen, prinsipnya sama: anak tidak pernah mendarat di layar kosong/rusak cuma karena levelnya belum diauthoring.
- **Tantangan Bos ikut level yang ditantang** — sebelumnya Tantangan Bos SELALU menyoal dari konten Explorer apa pun level yang sedang ditantang (bug, ketahuan begitu Adventurer dapat konten sendiri). Sekarang bos level X menyoal dari materi level X (jatuh ke Explorer kalau level itu kosong utk skill tertentu).

### 15.2 Reading — Skill ke-5, Mulai dari Adventurer

Menjawab §4.4 & §9 (dulu "kandidat, belum masuk v1" / out-of-scope) — Reading sekarang **skill nyata kelima** di Menu Belajar (Vocabulary, Listening, Reading, Speaking, Grammar), token warna sudah disiapkan sejak awal (`--c-read`/`--c-read-bg`, dipakai First Placement Test) tinggal dipakai ulang. Loop 3-langkah yang sama (§4.3): Kenalan (baca contoh pendek + terjemahan), Latihan Inti (baca 1-2 kalimat pendek → jawab pertanyaan dgn tap gambar), Tantangan (cerita mini lebih panjang → 1 pertanyaan).

Prinsip yang sama dengan Reading di First Placement Test (§14.3) dipertahankan ketat: **teksnya TIDAK PERNAH diucapkan TTS** di kind ini — beda dari Listening (yang memang diucapkan). Kalau dibacakan, itu jadi tes dengar lagi, bukan tes baca sendiri. **Revisi §16.15** — pengecualian TERBATAS ditambahkan KHUSUS di Kenalan (bukan Latihan Inti/Tantangan, yang TETAP ketat tanpa TTS): Kenalan murni exposure (terjemahan sudah ditampilkan gratis, tidak ada yang diuji), jadi boleh py 🔊/🎤/🎮 spt skill lain — 2 tahap yang benar² menguji dekoding mandiri TIDAK berubah.

Baru diauthoring untuk Adventurer (2 topik: Di Kebun Binatang, Hari Libur — **Revisi §16.13**: digenapkan jadi 10 topik) — Explorer (**Revisi §16.13**: sekarang JUGA ada, lewat format KETIGA `ReadingCheckTopic` yang berbeda, bukan genapan format ini). Menu Belajar otomatis **menyembunyikan** kartu skill yang topiknya kosong di level aktif (bukan menampilkan "Reading · 0 materi" yang kelihatan rusak) — **Revisi §16.14**: Reading sekarang ADA di SEMUA 6 level termasuk Trailblazer (5 topik), jadi mekanisme sembunyi ini sekarang tidak lagi teraktivasi utk skill Reading di level manapun.

**Revisi §16.10** — Reading sekarang JUGA ada di Little Stars, TAPI lewat format KEDUA yang berbeda total dari 2 paragraf di atas (bukan genapkan format Adventurer ke bawah) — riset mengonfirmasi anak 3–5 th (bahkan di Bahasa Indonesia sendiri) belum siap dekoding kalimat, jadi aktivitas pembukanya whole-word/sight-word ↔ gambar, bukan baca kalimat/cerita. Detail lengkap di CLAUDE.md § "Reading — 2 Format Berdampingan" & `materi/reading.md`.

### 15.3 Setiap Percobaan Anak Wajib Direspons — Apresiasi & Bahasa Ikut Level

Permintaan user eksplisit, berlaku lintas skill (bukan cuma satu game) — tiap kali anak mencoba apa pun (jawab soal, tap opsi, susun kata, ucapkan lewat mic), WAJIB ada respons, tidak boleh diam:

- **Benar** → teks pujian singkat satu-kata-seru (mis. "Hebaaat!"/"Awesome!"), nada benar (`playCorrectTone()`), animasi celebrate yang festive (`.win-burst` — lebih ramai dari burst kecil First Placement Test, karena ini dilihat berkali-kali tiap sesi latihan biasa), DAN diucapkan lewat TTS (bukan cuma teks).
- **Belum tepat** → teks dorongan singkat (mis. "Semangaaat!"/"Keep going!") — TETAP tidak pernah pakai kata "salah"/"gagal" (§4.6/CLAUDE.md poin 2), nada lembut, bukan alarm.
- **Bahasa pujian/semangat ikut level anak** — level awal (Little Stars/Starter/Explorer) masih butuh dukungan bahasa ibu → Indonesia; level tinggi (Adventurer/Achiever/Trailblazer) sudah mulai dibiasakan full-Inggris → Inggris. Implementasi generik satu tempat (`app/src/praise.ts`), dipakai lintas game — bukan teks pujian hardcode sendiri-sendiri per skill. **Aturan ini cuma utk TEKS yang tampil** — audio TTS pujian (revisi user) WAJIB bahasa Inggris di SEMUA level tanpa kecuali, tidak ikut tabel di atas; anak level awal tetap lihat teks Indonesia di layar, tapi begitu jawaban benar diucapkan lewat suara, suaranya selalu Inggris (imersi dengar tetap jalan sejak level pertama, walau bacaannya masih Indonesia).

### 15.4 First Placement Test Diperluas — 16 Item, Skor Termasuk Mic, Rank = CEFR

Beberapa revisi menyusul §14.3, semua dari testing/feedback user langsung:

- **Skor akhir sekarang dari 16 item** (13 soal pilihan-ganda + 3 latihan mic terbuka), bukan cuma 13 — dulu skor akhir cuma menghitung 13 pilihan-ganda padahal progress bar SELAMA tes sudah menghitung 16, bikin 3 kegiatan mic terakhir terasa "hilang" dari hasil. Mic item dihitung "benar" kalau rasio kata yang kedengaran lolos ambang tertentu (`wordRatio`, konsisten dgn bintang yang anak lihat) — **levelRecommended TETAP murni dari 13 soal pilihan-ganda**, mic tidak pernah ikut menentukan level (aturan §14.3 soal ASR anak tidak selalu akurat, TIDAK dibalik, cuma angka skor totalnya yang diperluas).
- **Rank petualang = CEFR level, bukan skala S/A/B/C/D terpisah** — draf awal rank pakai tier gaya game ("Rank S — Petualang Legendaris") independen dari skor; user minta disesuaikan supaya tidak bentrok dengan badge CEFR yang sudah dipakai di Peta Level (Pre-A1/A1/dst) — sekarang Rank cuma restatement CEFR dari `levelRecommended` itu sendiri (mis. "Rank ≈ A1 — Setara Bos Adventurer"), dipetakan eksplisit ke level & Bos-nya, bukan skala kompetitif terpisah.
- **Peta Petualangan disinkronkan dengan hasil test** — sebelumnya "Kamu di sini" di Peta Level bisa melenceng jauh dari `levelRecommended` (mis. direkomendasikan Adventurer, peta malah menunjukkan perhentian terakhir/Trailblazer) karena logic fallback yang salah kaprah kalau level rekomendasi tidak punya materi. Diperbaiki: peta sekarang berhenti PERSIS di level yang direkomendasikan, dengan kartu jujur "materi masih disiapkan" (§15.5 di bawah) kalau level itu belum diauthoring — bukan lompat ke ujung tangga.
- **Layar "Materi Segera Hadir"** (`renderLevelSoon`, `/materi-segera?level=`) — perhentian peta yang terbuka tapi belum ada materinya sekarang punya tombol nyata (bukan teks polos tanpa aksi) yang mengarah ke layar honest placeholder ini, bukan link mati.

### 15.5 Speaking — Skor Proporsional & "Play Suaramu" (Wajib Lintas Game)

Ditemukan lewat testing: fitur mic (baik di First Placement Test maupun game Vocab/Speaking biasa) dulu cuma "rekam lalu selesai" — anak tidak bisa dengar ulang suaranya sendiri, dan sinyal "cocok/tidak" yang dikirim kadang terlalu longgar (separuh kata kunci kedengaran = dianggap lolos penuh, walau cuma sepotong kalimat yang benar-benar terucap). Direvisi jadi standar wajib lintas semua fitur Speaking:

1. **Skor proporsional** — rasio kata target yang benar-benar kedengaran, bukan pass/fail longgar. Tampilan ke anak tetap non-punitive (bintang, bukan angka mentah jadi headline), tapi sinyal internalnya jujur.
2. **Tombol "▶️ Play Suaramu"** — anak bisa dengar ulang rekaman suaranya sendiri, terpisah dari "🔊 Dengar Contoh" (versi TTS/model). Direkam lewat `MediaRecorder` berjalan paralel dengan `SpeechRecognition` (API STT tidak pernah mengekspos audio mentahnya) — best-effort, kalau gagal fitur inti tetap jalan, cuma tombol ini yang tidak muncul.

Juga ditambahkan ke Kenalan Vocabulary (bukan cuma Speaking/First Placement Test) — anak sekarang bisa tap 🎤 di tiap kata utk coba mengucapkannya, dapat feedback kompak (bintang + kata yang kedengaran + Play Suaramu) lewat popup ringkas, bukan layar penuh terpisah.

### 15.6 Format Wajib Materi Vocabulary — Dibangun & Diverifikasi utk Adventurer

Permintaan user — kontrak format Kenalan/Latihan Inti/Tantangan Vocabulary yang berlaku di **semua level**. *Revisi dari draf awal (sempat dicatat "belum sepenuhnya dibangun")* — sekarang **sepenuhnya dibangun & diverifikasi live** di `games/vocabulary.ts`, diuji end-to-end memakai 10 topik Adventurer (§15.1):

1. **Kenalan** — dengarkan (🔊), mic (🎤, §15.5), dan **main** 🎮 (tombol per KATA saja — tombol "Main Semua Kata" di bawah daftar sudah dihapus per permintaan user, stepper Kenalan/Latihan Inti/Tantangan yang tidak terkunci sudah cukup buat pindah ke Latihan Inti). *Revisi dari draf awal setelah audit user*: soal WAJIB nyambung ke kosakata topiknya, bukan satu template "ada berapa X ini" dipaksakan ke semua topik — sekarang otomatis pilih tipe soal dari bentuk topiknya: topik Angka → gambar buah diulang sejumlah nilai kata target + pilihan ganda kata Inggris (TIDAK diubah). **🔒 Topik lain → "Dengar & Tunjuk"** (revisi LANJUTAN, audit user berikutnya: "Kenalan Main duplikat Latihan Inti") — versi sebelumnya ("Apa bahasa Inggrisnya [kata Indonesia]?" + pilihan teks) ternyata task-nya IDENTIK dgn soal tipe `toEn` di Latihan Inti (poin 2 di bawah), cuma beda kemasan visual — 2 layar nanya soal yang sama persis. Sekarang: dengar kata itu SAJA (TTS, tanpa bahasa terjemahan sama sekali), tunjuk 1 dari 3-4 gambar emoji polos yang cocok (emoji kata itu vs kata lain di topik yang sama) — bentuk soal genuinely beda dari SEMUA 4 tipe Latihan Inti, pola sama dgn "Dengar & Tunjuk" yang sudah dipakai Listening.
2. **Latihan Inti** — 10 soal, komposisi TETAP 4 tipe berlaku **semua level/topik** (revisi user — dulu cuma 2 tipe rata per kata; **objective-nya anak paham Inggris DAN Indonesianya, paham penggunaan, bukan cuma satu arah dengar**): 2× dengar TTS Inggris → tebak jawabannya, 2× "Apa bahasa Inggrisnya '[Indonesia]'?" + TTS Indonesia → pilihan ganda Inggris, 3× "Apa bahasa Indonesianya '[Inggris]'?" + TTS Inggris → pilihan ganda Indonesia, 3× kalimat kata-kosong → pilihan ganda. **SEMUA kata topik wajib keluar dulu sebelum ada yang berulang** (revisi user: "soal kata yang dilatih harus berbeda-beda") — 10 kata target diambil sekaligus (cakupan penuh dulu, baru repeat kalau topiknya <10 kata), tipe soal dipasangkan acak & independen ke kata-kata itu, bukan pilih kata per-tipe terpisah (yang bisa bikin 1 kata terulang sementara kata lain tidak pernah muncul). Plus **hint** — tombol "💡 Petunjuk" pola 50/50 (mematikan 2 dari 4 opsi salah, sisa persis 2), sekali pakai per soal.
   **Kartu jawaban gambar+teks+lencana huruf, ala referensi kompetitor** (revisi user: "ada analogi dibantu oleh image" — kid-friendly, teks tetap besar tapi proporsional ke gambar) — SEMUA 4 tipe soal di atas pakai grid kartu 2×2, tiap kartu bergambar EMOJI MILIK OPSI ITU SENDIRI (bukan emoji target) + label teks + lencana A/B/C/D. Ini menggantikan 2 pola lama: (a) emoji-only vs teks-only berdasar topik `iconAmbiguous` — sudah tidak perlu lagi krn kartu SELALU emoji+teks, ambiguitas emoji ekspresi (mis. "Sorry" → 😔 terbaca "sedih") otomatis hilang di semua topik, `iconAmbiguous` sekarang cuma nambah teks Indonesia sbg konteks di tipe dengar; (b) emoji besar di atas prompt (dulu dipakai sbg "clue visual") DIHAPUS — begitu tiap opsi py gambar sendiri, emoji target terpisah di atas cuma jadi celah nebak-lewat-cocok-gambar sebelum anak sempat mikir artinya. **Status: dipilot di Little Stars topik pertama (Salam & Sopan Santun), diverifikasi berlaku otomatis ke SEMUA topik Vocab Little Stars (12/12), Starter (10/10), Explorer (10/10), Achiever (10/10) & Trailblazer (2/2)** tanpa perubahan kode — mekaniknya generik per skill, bukan per topik, jadi tinggal diaudit datanya (contoh kalimat, item multi-kata) & dicoba live per topik.
3. **Tantangan** — TANPA hint sebelum 2x gagal, KECUALI Eja Kata (satu-satunya yang punya hint eksplisit). **3 tab independen, PERSIS 5 soal tiap tab (total 15 soal)** (revisi user, dulu 2 tab yang tidak fixed-count): (1) **Eja Kata** — susun huruf, kata TUNGGAL saja (frasa 2+ kata mis. "Good Morning" disaring keluar — bank huruf jadi perlu tile SPASI yang membingungkan anak; spelling frasa multi-kata belum didukung, berlaku semua level/topik yang punya kata frasa, bukan cuma Little Stars). **Tombol "💡 Petunjuk"** (revisi user, di sebelah kiri "Hapus Huruf"/"Ulang Susunan", ketiganya versi ramping/slim) — sekali tap, isi 60% huruf otomatis di POSISI ACAK (bukan urutan dari awal — revisi user), sisa 40% dikosongkan buat anak lengkapi sendiri; huruf hint ditandai visual beda (outline putus-putus) dari huruf yang anak taruh sendiri; "Hapus Huruf"/"Ulang Susunan" tetap berfungsi normal walau posisi hint acak (selalu tepat hapus punya anak sendiri, tidak pernah kena huruf hint); sekali pakai per kata, tapi "Coba Lagi"/"Ulang Susunan" tetap mempertahankan hint yang sudah diambil (non-punitive); (2) **Susun Kalimat** — kalimat Indonesia ditampilkan sbg soal, anak susun terjemahan Inggrisnya dari word bank (dulu "fase" nempel di Contoh Penggunaan, sekarang tab sendiri); tombol "Cek Jawaban" dihapus (revisi user) — begitu semua kata tersusun, langsung evaluasi otomatis, tidak perlu tap tombol cek; (3) **Penggunaan** (label diperingkas dari "Contoh Penggunaan") — mic (ikut §15.5 penuh — skor proporsional + Play Suaramu, bukan lagi pass/fail biner; dulu "fase" lain di tab yang sama, sekarang berdiri sendiri juga). Tab bisa dipindah manual kapan saja tanpa kehilangan progres — TAPI menuntaskan 5 soal tab yang sedang dibuka otomatis lanjut ke tab berikutnya (**Eja Kata → Susun Kalimat → Penggunaan → layar "Kerja Bagus!"**), bukan langsung ke layar selesai begitu 1 tab tuntas (revisi user — versi awal restrukturisasi 3-tab sempat begitu, dilaporkan salah). Layar "Kerja Bagus!" di akhir tombolnya cuma "🔁 Ulangi Modul Ini" & "📋 Pilih Materi Lain" — tombol "🏠 Beranda" dihapus (permintaan user, screen ini muncul di tengah alur belajar, bukan titik keluar natural).
4. **Tombol "Coba Lagi" & "Lanjut" eksplisit di tiap soal** — auto-advance via timer dihapus total dari Vocabulary, semua titik jawaban berhenti & menunggu anak tap salah satu tombol — "Lanjut" selalu aktif berapa pun hasilnya (non-punitive, tidak pernah memaksa benar dulu). **Tombol edit-jawaban (Petunjuk/Hapus Huruf/Ulang Susunan di Eja Kata; Hapus Kata/Bersihkan di Susun Kalimat) hilang begitu soal terjawab, muncul lagi begitu "Coba Lagi" ditekan** (revisi user, bug ditemukan: tanpa ini, tombol "Ulang Susunan" bisa ditekan setelah benar/salah dan bikin papan macet — kelihatan kosong tapi tidak bisa diisi lagi).
5. **Kenalan/Latihan Inti/Tantangan bisa diklik bebas** (permintaan user eksplisit) — TIDAK ada penguncian sequential di dalam satu materi; anak boleh loncat ke Tantangan tanpa lewat Kenalan/Latihan Inti dulu kalau mau.
6. **Kenalan tidak masuk hitungan progress mana pun** (permintaan user) — persentase "X% materi topik ini" (kartu topik, Menu Belajar, Peta Level) cuma rata-rata Latihan Inti + Tantangan; Kenalan tetap punya tanda "sudah dicoba" sendiri per kata (tombol 🔊/🎤/🎮 berubah warna) tapi itu murni visual di layarnya sendiri, tidak ikut dihitung ke persentase topik.
7. **🔒 "Sudah selesai" DAN layar "Kerja Bagus!" itu sendiri wajib persis progress 100% — BERLAKU DI SEMUA SKILL (Vocab, Listening, Reading, Grammar, Speaking), bukan cuma Vocab.** Dua tahap permintaan user:
   - Tahap 1 (bug: topik Vocab kepentok "Sudah selesai" padahal cuma 70%) — centang/warna/teks "Sudah selesai" di kartu topik & kartu skill murni ikut persentase (>=100), bukan "pernah 1x nyampe Kerja Bagus". Target "Yuk Lanjutkan/Mulai" ikut aturan sama.
   - Tahap 2 (permintaan user berikutnya, bug lanjutan: "munculkan modul selesai setelah statusnya 100%, bukan berarti mengerjakan yang terakhir kemudian dikerjakan maka muncul selesai") — layar CELEBRATION "Kerja Bagus!" itu sendiri ternyata BELUM ikut dicek ke aturan Tahap 1 — anak yang loncat LANGSUNG ke Tantangan (poin 5 di atas) & menuntaskannya bisa dapat "Kerja Bagus" walau Latihan Inti masih 0%, DI SKILL/LEVEL MANA PUN (mekanisme lama skill-agnostic, jadi bug-nya jg skill-agnostic). Sekarang layar itu WAJIB nunggu progress topik BENERAN 100% dulu — kalau step terakhir tuntas tapi topik belum 100%, anak diarahkan balik ke daftar materi (bukan diam/dead-end), BUKAN dikasih perayaan palsu. Skill TANPA section granular per-soal (Listening format lama, Speaking, Grammar, Reading) pakai penanda lebih kasar ("Latihan Inti & Tantangan masing² pernah dituntaskan 1x", bukan per-soal) — tetap cukup menutup bug utama (step yang belum disentuh tidak akan lolos). Detail teknis di CLAUDE.md.
8. **🔒 Verifikasi konten Vocab otomatis, bukan skrip manual sekali-pakai lagi** (permintaan user, audit "verifikasi konten masih manual, rawan kelewat" — bug "Twin"/"twins" `materi/vocab.md` §7 perlu 1 sesi penuh utk ketemu krn skrip lamanya tidak disimpan & bisa lupa dijalankan) — `app/scripts/verify-vocab-content.mjs` (BARU, permanen di repo) sekarang bagian dari `npm run build`, cek id topik unik lintas level, tiap topik ≥10 kata, dan `example.en` memuat kata target sbg whole word. Tidak bisa lagi lolos tanpa disadari selama build normal dijalankan. Detail teknis di CLAUDE.md.

**Sengaja belum diperluas** ke skill lain (Listening/Speaking/Grammar/Reading) — permintaan user eksplisit "fokus vocab dulu", dievaluasi dulu sebelum dibawa ke skill lain. Detail teknis: [CLAUDE.md](CLAUDE.md) §"Format Wajib Materi Vocabulary".

### 15.7 Progres Materi & Sync ke Database

Permintaan user — tiga hal:

1. **Progress bar per daftar materi** (mis. `/materi?skill=vocabulary&topic=0`) — "X dari N materi (Y%)" di atas grid, pola sama dgn progress bar level di Beranda/Peta Level, SELALU tampil termasuk 0%.
2. **Warna berbeda begitu sudah dikerjakan** — kartu materi (`renderTopics`) tint hijau (`--ok`/`--ok-bg`) begitu `isDone`; DI DALAM Kenalan, tombol 🔊/🎤/🎮 per KATA juga berubah warna begitu anak tap (interaksi baru `wordInteractions` di `progress.ts`, murni visual "sudah dicoba", tidak dipakai skor/gating).
3. **Sync progres ke database** — `ChildProgress` (Prisma model baru, `portal/prisma/schema.prisma`) simpan progres SEBAGAI SATU BLOB JSON per anak, bentuknya persis `Store` di `progress.ts`. Bukan pengganti localStorage: localStorage TETAP sumber kebenaran offline (§5/§14.4 — main tanpa akun harus tetap penuh); DB murni backup/multi-perangkat utk akun yang sudah login — `app.ts` `wireProgressSync()` (debounce 1.5 detik tiap `write()` progress.ts) push ke server, `mergeFromServer()` tarik & GABUNG (union array/max angka, bukan overwrite) tiap boot & sesudah login, supaya progres di perangkat manapun tidak pernah hilang. Endpoint: `portal/app/api/progress/route.ts` (GET/PUT, auth sama dgn `/api/me`).

### 15.7 Istilah Peta & Bos Direvisi — "Markas" & "Raja X", Bukan "Perhentian"/"Bos"

Permintaan user: "Perhentian" (istilah bus/kereta) dan "Bos" dinilai kurang familiar/kurang menarik untuk anak SD. Setelah beberapa iterasi ("Pos" → "Gerbang", ditolak karena masih berasa formal — lihat riwayat lengkap di [`app/src/scenery.ts`](app/src/scenery.ts)), istilah final yang **dikunci**:

- **"Markas"** menggantikan "Perhentian" — 1 markas = 1 level, label tempat di peta (mis. "🏰 Markas 3 · Pantai Biru").
- **"Raja [Hewan]"** menggantikan "Bos" — dipetakan 1:1 ke emoji `BOSS_AVATAR` yang sudah ada (`app.ts`) via map baru `BOSS_NAME` (`content.ts`): Little Stars=Raja Kelinci🐰, Starter=Raja Serigala🐺, Explorer=Raja Singa🦁, Adventurer=Raja Naga🐉, Achiever=Raja Elang🦅, Trailblazer=Raja Unicorn🦄.
- Keduanya digabung jadi **"Markas Raja [Hewan]"** di judul arena Tantangan Bos (mis. "🏰 Markas Raja Singa") dengan ikon istana 🏰 sebagai penanda visual markas/arena.
- Semua string "Bos"/"Perhentian" yang tampil ke anak (peta, teaser menu, arena, layar menang, placement test rank) sudah diganti — cek `BOSS_NAME`/`bossLabel()` (`app.ts`) sebelum menambah string baru bertema bos supaya tetap konsisten, jangan hardcode "Bos" lagi.

---

## 16. Vocabulary Diauthoring Bertahap per Level — Revisi Status "Roadmap"/"Belum Diauthoring"

Permintaan user ("lakukan bertahap") — Vocabulary diauthoring satu level per sesi, tiap level langsung diimplementasi (bukan cuma didokumentasikan dulu). Riset lengkap tiap level (analisis mekanik existing, riset kurikulum lintas institusi, spesifikasi topik×kata lengkap) ada di dokumen terpisah **[materi/vocab.md](materi/vocab.md)** — dijaga di luar PRD ini karena scope-nya spesifik 1 skill & terus bertambah per level, bukan keputusan sistem yang perlu diulang di sini tiap kali kontennya berubah.

### 16.1 Little Stars (sesi pertama)

Membalik status Little Stars di §3/§9 — dari "Roadmap masa depan, belum discope, paradigma produk beda" jadi level pertama yang keluar dari status placeholder, mulai dari skill Vocabulary.

- **Kenapa "paradigma produk berbeda" (§9 lama) tidak jadi penghalang**: riset ([materi/vocab.md](materi/vocab.md) §3) mengonfirmasi Little Stars (3–5 th) memang di luar tangga CEFR (Cambridge YLE termuda untuk usia 6–12, British Council punya produk usia 2–6 terpisah tanpa label CEFR) — bukan berarti tidak bisa dikerjakan, cuma perlu daftar tema & pendekatan sendiri (bukan "starter dari starter"), yang sudah dikerjakan lewat riset tsb, bukan diasumsikan.
- **`hasContent:true` dinyalakan meski baru Vocabulary yang diauthoring** (Listening PRD §4.1 masih menyusul) — aman karena `visibleSkillKeys()`/`poolFor()` (`app.ts`/`games/boss.ts`) sudah generik menyembunyikan skill kosong & fallback ke Explorer, pola yang sama dengan rollout Reading (§15.2) yang cuma ada di Adventurer duluan.
- **Little Stars TIDAK pernah jadi hasil First Placement Test** (§14 — `PlacementLevelKey` cuma `starter/explorer/adventurer`), jadi revisi ini tidak menyentuh `portal/lib/placement-scoring.ts` sama sekali — anak sampai ke Little Stars murni lewat level default/manual, bukan rekomendasi test.

### 16.2 Starter (sesi kedua)

Starter beda posisi dari Little Stars: sudah lama tercatat **"In scope (v1)"** di §9 (satu dari 3 level MVP — Starter/Explorer/Adventurer) tapi justru level yang paling lama belum diauthoring sama sekali. Sesi ini menutup gap itu, mulai dari Vocabulary (10 topik × 10 kata, dipetakan langsung dari **wordlist resmi Cambridge Pre A1 Starters** — riset & sumber lengkap: `materi/vocab.md` §3B).

- Starter posisinya "pra-Starters" di tangga YLE (§3 tabel) — pas di depan gerbang ujian resmi Cambridge (usia 6–12), beda dari Little Stars yang di luar tangga CEFR sama sekali. Ini kenapa topik Starter langsung dipetakan dari 20 kategori wordlist Cambridge, bukan riset tema preschool umum seperti Little Stars.
- **`CONTENT_AVAILABLE` di `portal/lib/placement-scoring.ts` DIUPDATE** (`['starter', 'explorer', 'adventurer']`) — beda dari Little Stars: Starter ADA di `PlacementLevelKey`, jadi anak yang direkomendasikan Starter dari First Placement Test sekarang benar-benar melihat materi Starter, bukan fallback ke Explorer lagi.
- Target akhir Starter (PRD §4.1) LEBIH BESAR dari Little Stars — Vocabulary+Listening+Speaking+Grammar (4 skill, Little Stars cuma 2) — jadi gap yang tersisa lebih banyak, dicatat eksplisit di `materi/vocab.md` §6, bukan dianggap selesai.

### 16.3 Explorer (sesi ketiga)

Beda lagi posisinya dari 2 sesi sebelumnya: Explorer sudah `hasContent:true` & live sejak awal dengan 3 topik (`keluarga`/`angka`/`warna`), tapi belum penuhi target CLAUDE.md ≥10 topik/skill. Sesi ini menggenapkannya ke 10 topik — 3 topik lama TIDAK diubah (progres anak yang sudah ada tetap aman), 7 topik baru ditambahkan langsung ke array yang sama, dipetakan dari **wordlist resmi Cambridge A1 Movers** (tingkat YLE SETELAH Pre A1 Starters yang dipakai Starter — sesuai posisi CEFR Explorer "→ A1" — riset & sumber lengkap: `materi/vocab.md` §3C).

- Beda dari 2 sesi sebelumnya: **tidak ada perubahan wiring** (`LEVELS`/`CONTENT_AVAILABLE`) sama sekali — Explorer sudah live, sesi ini murni nambah data ke array yang sudah dipetakan.
- Dengan ini, **ke-4 level yang punya materi Vocabulary (Little Stars, Starter, Explorer, Adventurer) semuanya sudah penuhi target ≥10 topik/skill** — pertama kalinya sejak target ini ditulis di CLAUDE.md.

### 16.4 Adventurer (sesi keempat)

Beda lagi posisinya dari 3 sesi sebelumnya: Adventurer sudah penuhi target 10/10 topik SEBELUM sesi ini — tidak ada gap yang perlu ditutup. Riset (`materi/vocab.md` §3D) menemukan wordlist Cambridge **A1 Movers** (tingkat YLE resmi Adventurer, §3 tabel) SUDAH HABIS TERPAKAI lintas 4 level lain begitu sesi Explorer selesai (setiap 1 dari 20 kategori Movers sudah punya "rumah" di level lain) — konsekuensi tidak terduga dari topik Explorer yang sengaja dipetakan dari Movers.

- 3 topik tambahan (§5D `materi/vocab.md`) SENGAJA loncat ke wordlist **A2 Flyers** (tingkat SETELAH Movers), TAPI porsinya dijaga kecil (cuma 3 dari 20 kategori, termasuk cuma 10 dari 65 kata kategori "Acts") — **17 kategori sisanya, termasuk 3 kategori terbesar (Acts residual, Characteristics 49, Places 47), sengaja dibiarkan utuh** utk sesi Achiever (level yang §3 tabel memang tandai transisi A1→A2) supaya masih ada wordlist resmi segar buat dipetakan nanti.
- Tidak ada perubahan wiring (`LEVELS`/`CONTENT_AVAILABLE`) — sama seperti Explorer, Adventurer sudah live, sesi ini murni nambah data.
- Adventurer sekarang **13 topik** — melebihi target ≥10, bukan sekadar tepat seperti Starter/Explorer.

### 16.5 Achiever (sesi kelima)

Mulai dari NOL (`hasContent:false` sebelum sesi ini) — sama posisinya dgn Starter/Little Stars, beda dari Adventurer yang cuma digenapkan bonus. 10 topik (`materi/vocab.md` §5E) memakai LANGSUNG kategori Cambridge **A2 Flyers** yang sengaja disisakan sesi Adventurer (§16.4 — Characteristics 49 kata, Places and Directions 47 kata, Leisure 26 kata, Acts sisa >50 kata) — tanpa perlu riset wordlist ulang, cuma dipetakan ke sudut yang belum kepakai.

- Ditambah 1 domain baru di luar wordlist Cambridge — **Teknologi & Internet** — dari riset ESL usia 11-13 & Kurikulum Merdeka Fase D. Sengaja HANYA kosakata perangkat/istilah teknis (Computer/Password/Download), TANPA kosakata media sosial (like/share/follower), selaras filter kid-friendly.
- **Temuan penting**: Cambridge A2 Key for Schools (KET, tingkat SETELAH Flyers) eksplisit MENGECUALIKAN topik sensitif (perang, politik) dari wordlist resminya — konfirmasi independen dari luar bahwa filter kid-friendly CLAUDE.md selaras standar industri ESL anak, bukan preferensi sepihak (`materi/vocab.md` §3E.3).
- Tidak ada perubahan wiring `CONTENT_AVAILABLE` — Achiever, spt Little Stars, di luar `PlacementLevelKey` sama sekali.
- **5 dari 6 level sekarang punya materi Vocabulary nyata** — cuma Trailblazer yang tersisa.

### 16.6 Trailblazer (sesi keenam — TERAKHIR)

Beda paling besar dari 5 sesi sebelumnya: PRD §9/§3 SUDAH mengunci Trailblazer sbg "low-effort, 1–2 modul preview" SEBELUM inisiatif Vocabulary ini dimulai — jadi target CLAUDE.md ≥10 topik/skill **sengaja TIDAK dipaksakan** di sini, beda dari 5 level lain yang semuanya diusahakan mencapai/melebihi 10 topik. 2 topik (`materi/vocab.md` §5F) dipetakan dari tema Cambridge **B1 Preliminary for Schools (PET)** yang genuinely paling segar — Travel & Tourism, dan Language & Communication (satu-satunya tema PET yang belum disentuh SAMA SEKALI di 5 level lain, sekaligus meta-tematik: app pengajar bahasa mengajarkan kata TENTANG bahasa).

- Tidak ada perubahan wiring `CONTENT_AVAILABLE` — Trailblazer, spt Little Stars & Achiever, di luar `PlacementLevelKey` sama sekali (§6 PRD malah eksplisit bilang Trailblazer diakses berbasis usia 12+, bukan lewat placement test).
- **Ini menandai SELESAINYA inisiatif Vocabulary bertahap per level TAHAP AWAL** — 6 dari 6 level sekarang punya materi Vocabulary nyata (waktu itu: 57 topik, ~570 kata total). 20 tema PET lain sudah diriset & siap dipetakan (`materi/vocab.md` §3F.2) kalau Trailblazer diperluas — persis yang terjadi sesi lanjutan (§16.6b di bawah).

### 16.6b Trailblazer Digenapkan 2→5 Topik (Sesi Lanjutan)

Permintaan user: *"research materi vocab yang sesuai dengan level trailblazer ini, research ke lembaga bahasa inggris lainnya terutama yang dalam negri, buatkan minimal 5"*. Ini menyusul revisi CLAUDE.md "Target Kelengkapan Konten per Modul" poin 1 (target Trailblazer dinaikkan dari "1-2 modul" ke "minimal 5 topik/skill") yang sudah dikunci SEBELUM sesi ini — bukan keputusan scope baru dalam sesi ini sendiri, tapi PENERAPAN target yang sudah direvisi.

- **Riset ulang lembaga Indonesia** (permintaan eksplisit "terutama dalam negri"): Kurikulum Merdeka Fase F (kelas 11-12) menekankan bahasa "kritis, reflektif, akademik"; LIA General English for Teens menekankan "critical thinking" lewat project-based learning; EF Indonesia Trailblazers menekankan "critical thinking and presentation skills". Tidak satu pun sumber Indonesia mengusulkan tema konkret baru di luar 22 tema PET yang sudah diriset (§16.6) — riset ini mengonfirmasi ARAH (akademik/reflektif/opini/presentasi), bukan daftar tema baru.
- **3 topik baru** dipetakan dari residual tema PET yang paling match arah itu: `pendidikan-akademik` (Education — kehidupan kampus/ujian, beda sudut dari nama mapel Achiever), `pendapat-pengalaman` (Personal Feelings/Opinions/Experiences — kosakata utk berpendapat: Agree/Disagree/Prefer/Suggest), `hiburan-media` (Entertainment and Media — kosakata media: Documentary/Broadcast/Review/Streaming, melengkapi Achiever yang sengaja cuma kosakata perangkat tanpa medsos). Detail lengkap & tabel sumber: `materi/vocab.md` §3F.4/§3F.5.
- **Total Vocabulary sekarang 60 topik, ~600 kata**, tetap 0 id bentrok — dicek OTOMATIS via `app/scripts/verify-vocab-content.mjs` (BARU, permanen di repo, bagian `npm run build`) — bukan skrip manual sekali-pakai lagi (lihat §16.7 poin verifikasi & CLAUDE.md).

### 16.6c Trailblazer Digenapkan Lagi 5→10 Topik + Audit 5 Topik Lama (Sesi Lanjutan Lagi)

Permintaan user: *"tambahkan 5 materi vocab untuk level trailblazer dan audit apakah 5 materi saat ini sudah sesuai"*. Ini deviasi SADAR di atas target BAKU Trailblazer (tetap ≥5, §16.6b — TIDAK direvisi lagi jadi ≥10) atas instruksi eksplisit user — preseden identik dgn Grammar/Listening/Speaking/Reading Trailblazer yang sama-sama sudah digenapkan ke 10/10 lewat instruksi serupa di sesi masing-masing.

- **Audit 5 topik lama (bagian pertama permintaan)**: dicek struktural — mekanik game (`games/vocabulary.ts`) generik tanpa percabangan per-level (`level` cuma dipakai utk bahasa pujian, bukan logic soal), jumlah topik/kata cocok status yang diklaim, 0 duplikat `example.en`/`example.id`/emoji DALAM 1 topik yang sama (dicek skrip ad-hoc, lebih ketat dari `verify-vocab-content.mjs`). **Hasil: 0 pelanggaran ditemukan** — 5 topik lama sudah sesuai standar sejak ditulis §16.6b.
- **5 topik baru** (bagian kedua permintaan): 4 dari tema PET residual yang §16.6b sebelumnya catat "belum dipetakan" (Appliances, Buildings, Places Countryside, Services — 1 di antaranya, Services, ternyata SEMPAT keliru dianggap "sudah tercakup" `tempat-di-kota` Achiever; dicek ulang isi kata-per-kata `tempat-di-kota`, ternyata 0 katanya genuinely "layanan" — semua tempat rekreasi/belanja, jadi Services tetap genuinely fresh), 1 diturunkan dari ARAH riset presentasi/critical-thinking EF+LIA yang sudah divalidasi §16.6b (bukan tema PET mentah, pola sama `pendidikan-akademik`/`pendapat-pengalaman` sebelumnya): `layanan-masyarakat` (Public Services), `peralatan-elektronik` (Home Appliances, beda sudut dari kitchen tools manual `peralatan-dapur` Explorer), `bangunan-sekitar` (Buildings, beda sudut dari tempat fungsional `tempat-di-kota` Achiever), `pedesaan` (Countryside, beda sudut dari alam kosmik Adventurer & alam dasar Starter), `presentasi-diskusi` (Presentation & Discussion).
- **Audit kata duplikat lintas-topik PREVENTIF sebelum ditulis**: tiap kandidat kata dicek `grep` thd SELURUH 60 topik Vocab existing — 4 kata kena tabrakan (`Bridge`/`Farm` sudah dipakai Starter, `Television` sudah dipakai Starter, `Confident` sudah dipakai Achiever) — SEMUA diganti sebelum kode ditulis (`Apartment`/`Vineyard`/dihindari total/`Persuade`). Detail lengkap tiap topik + tabel sumber: `materi/vocab.md` §3F.6.
- **Total Vocabulary sekarang 65 topik, ~650 kata**, tetap 0 id bentrok — diverifikasi `npm run typecheck` + `npm run build` (`verify:content` + `verify:duplicates` + esbuild) lolos. **Keterbatasan diakui eksplisit**: live browser QA (Playwright) TIDAK dijalankan sesi ini (dependency tidak ter-provision lokal saat itu) — verifikasi murni struktural/otomatis, bukan diklaim "sudah dicoba di browser".

### 16.7 Prinsip yang Berlaku di Semua Sesi

- **Id topik Vocabulary WAJIB unik lintas SEMUA level** (bukan cuma dalam 1 level) — progress key `${skill}:${topicId}:${section}` (`progress.ts`) TIDAK di-namespace per level, jadi id yang sama di dua level bisa menimpa/menukar progres. Dicek OTOMATIS tiap `npm run build` sekarang (`app/scripts/verify-vocab-content.mjs`, bukan skrip manual sekali-pakai lagi — lihat §16.6b/§16.6c) — 65 id topik Vocabulary sekarang (Little Stars 12 + Starter 10 + Explorer 10 + Adventurer 13 + Achiever 10 + Trailblazer 10), semuanya unik.
- Mekanik game (Kenalan/Latihan Inti/Tantangan, §15.6) dipakai apa adanya tanpa modifikasi di semua level — menambah level baru Vocabulary murni kerja data (`content.ts`), bukan kode baru.
- Gap yang masih terbuka (dilaporkan, bukan dianggap selesai diam-diam) — SEMUANYA sekarang di luar skill Vocabulary: Speaking/Grammar Starter & Little Stars, Speaking/Grammar/Reading Explorer/Adventurer/Achiever/Trailblazer, Listening Trailblazer (0 topik) — urutan pengerjaan disarankan di `materi/vocab.md` §6 & `materi/listening.md` §5. **Revisi §16.9**: Listening Little Stars, Starter, Explorer, Adventurer & Achiever SEKARANG **10/10 topik masing-masing** (target ≥10 topik/skill tercapai di kelimanya, riset lengkap `materi/listening.md`) — bukan lagi "sengaja baru 1/2" atau "belum ada"/"kurang topik" spt sesi-sesi sebelumnya. Achiever pakai format KETIGA `ListeningNoteTopic` (note completion) — satu-satunya level yg Tantangan-nya bukan dikte/cerita-mini.

### 16.8 Listening Little Stars — Format Baru Ala Vocab (permintaan user: "buat 1 materi listening di level little start... format dan flow nya mengikuti vocab")

Inisiatif TERPISAH dari rollout Vocabulary 6-level di atas — ini port PERTAMA pola Kenalan/Latihan Inti/Tantangan ala Vocab ke skill LAIN, dimulai dari Listening (bukan Vocab lagi). Bukan migrasi total: Explorer & Adventurer TETAP pakai format Listening lama (`ListeningTopic`: scene/primer/drill/story/1 pertanyaan di ujung, `games/listening.ts` fungsi lama tidak disentuh) — keputusan eksplisit user saat ditanya scope-nya, supaya materi yang sudah jalan di 2 level itu tidak berisiko regresi.

- **2 topik pada sesi-sesi awal** — "Kegiatan Sehari-hari (Daily Activities)" + "Di Sekolah (At School)" — **sekarang 10 topik (§16.9)**, `LISTENING_TOPICS_LITTLE_STARS`, masing² 10 kalimat sederhana dari kosakata yang sudah dikenal anak Little Stars.
- **Tipe data** (`types.ts`) — `ListeningSentenceTopic`/`ListeningSentenceItem`, SENGAJA berbentuk mirip `VocabItem` (`en`/`id`/`emoji` = kata kunci tunggal, `example` = kalimat lengkap) PLUS `question: {en, id, options}` yang BARU (tidak ada di Vocab) — jawaban laporan user awal "di latihan sudah benar, tapi tidak ada pertanyaan": tiap kalimat WAJIB py pertanyaan komprehensi, diucapkan via `speakSequence([kalimat, pertanyaan])`.
- **🔒 3-tier task-type ladder, bukan 1 bentuk soal diulang** (revisi user: "kenapa masih redundant play di kenalan dengan latihan inti" — user eksplisit minta riset kompetitor/lembaga bahasa dalam & luar negeri sebelum redesain). Riset: Cambridge Young Learners English (Starters/Movers/Flyers — exam family basis wordlist Vocab app ini juga) strukturkan Listening jadi 5 PART dgn BENTUK TASK BEDA per part (match/tunjuk, tulis/dikte, tick/pilih gambar, benar-salah), bukan 1 bentuk diulang; TPR pedagogy jg tegas: tahap exposure ("listen & point") harus lebih ringan & beda bentuk dari tahap tes komprehensi. Ladder barunya (detail teknis di CLAUDE.md):
  1. **Kenalan "🎮 Main · Dengar & Jawab"** — sempat diganti "Dengar & Tunjuk" picture-only (exposure murni, TPR "listen & point") di sesi ini, TAPI dibalik lagi permintaan user turun berikutnya: "di 'main' tab kenalan tambahkan pertanyaan di akhir kalimat" + "buat jawabannya 2 card 2 card" — balik pakai `item.question` + kartu 2×2. Beda dari Latihan Inti sekarang bukan lagi soal ada/tidaknya pertanyaan, tapi: 1 soal casual berdiri sendiri (bukan bagian 10-soal quiz-dot) + teks default tersembunyi (lihat clue, poin di bawah).
  2. **Latihan Inti mix 5/5** — "🎧 Dengar & Jawab" (dengar+pertanyaan+kartu teks) DICAMPUR dgn "🤔 Benar atau Salah?" BARU (pola Cambridge Movers/Flyers true/false — dengar kalimat, lihat 1 klaim diambil acak dari opsi yang SUDAH ADA, jawab Benar/Salah; TIDAK ADA data baru diauthoring utk fitur ini).
  3. **Tantangan "Dengar & Susun"** (sudah didesain ulang sesi sebelumnya jadi dikte dengar) — tier paling sulit. Sempat "TANPA clue apa pun" di sesi ini, TAPI direvisi sesi berikutnya: sekarang PUNYA "💡 Petunjuk" juga (lihat poin clue di bawah) — beda dari Latihan Inti bukan lagi soal ada/tidaknya bantuan, tapi BENTUK bantuannya (1 tombol ungkap semua vs 2 tombol terkunci). **🔒 PERSIS 10 soal** (permintaan user eksplisit sesi berikutnya: "tambahkan aturan di listening dimana soal untuk tantangan nya 10", `TANTANGAN_TAB_SIZE` di `games/listening.ts` naik dari 5→10) — SENGAJA beda dari Vocab (`TANTANGAN_TAB_SIZE`=5, tapi 3 tab×5=15 total) krn Tantangan Listening cuma 1 aktivitas, bukan 3 — jangan disamakan ke 5 tanpa arahan baru.
  Prinsipnya: SETIAP tier WAJIB task SHAPE beda (bukan cuma tema/kata beda) — dicatat sbg aturan berlaku ke depan, bukan cuma keputusan sesi ini.
- **🔒 DUA sistem bantuan teks, dipakai di tempat berbeda** — revisi user turun berikutnya menyederhanakan pola awal:
  1. **Latihan Inti (kedua jenis soal)** — TETAP 2 tombol clue terpisah ("📝 Tampilkan Teks"/"🌐 Tampilkan Terjemahan"), TERKUNCI sampai anak 1x mencoba jawab dulu ("dengan syarat harus 1x mencoba dulu" — versi awal). TIDAK diubah sesi berikutnya.
  2. **Kenalan "Main" & Tantangan** — permintaan user berikutnya: "simplify jadi button petunjuk... ketika diklik maka muncul text serta terjemahannya... petunjuk langsung ada di depan tidak perlu nunggu sekali coba dulu" — di 2 layar ini disederhanakan jadi SATU tombol "💡 Petunjuk", TERSEDIA SEJAK AWAL (tanpa gating 1x-attempt), sekali tap ungkap teks Inggris + terjemahan Indonesia sekaligus (bukan 2 aksi terpisah). Di Tantangan, tombol ini melengkapi (bukan menggantikan) reveal-jawaban-otomatis yang sudah ada setelah 2x gagal. **Posisi & ukuran** (permintaan user turun berikutnya lagi: "update posisi petunjuk sebelah kanan button dengarkan... ukurannya di samakan") — tombol ini ditaruh SEBARIS di sebelah kanan "🔊 Dengar" (bukan di baris aksi terpisah di bawah lagi), ukuran (tinggi/padding/bentuk pil) disamakan persis dgn tombol Dengar, cuma warnanya ghost/outline supaya tetap kebeda sbg aksi sekunder.
  3. **🔒 Copywriting "Dengar Lagi" → "Dengar" + animasi glow** (permintaan user: "update copy writing 'dengar lagi' menjadi 'dengar'... tambahkan animasi seperti menyala seperti di button 'main' di placement test") — berlaku di SEMUA 4 tombol dengar Listening format baru (Kenalan, Latihan Inti kedua jenis soal, Tantangan). Animasinya REUSE PERSIS dari tombol "▶️ Yuk Mulai" First Placement Test (cincin bayangan mango melebar + scale halus, terus berulang) — bukan animasi baru, sengaja konsisten sbg bahasa visual "lihat sini, tap ini" yang sudah ada di app. Format Listening lama (Explorer/Adventurer) & skill lain (Vocab/Speaking/Grammar) tidak ikut berubah.
  Opsi jawaban di Kenalan/Latihan Inti SELALU py persis 1 jawaban benar (`item.question.options`, tidak diubah oleh clue manapun) — "pastikan jawabannya ada yang benar" otomatis terpenuhi dari struktur data. Detail teknis (termasuk bug ordering yang harus dijaga di pola 1: reset state clue di "soal baru" TAPI TIDAK di "redraw soal yang sama") di CLAUDE.md.
- **`games/listening.ts` py 2 set fungsi berdampingan**, dibedakan runtime lewat `'items' in topic` — helper generik (kartu jawaban, quiz nav, dst) DIDUPLIKASI dari `games/vocabulary.ts` (bukan diimpor) supaya file Vocab yang sudah diverifikasi 6 level tidak ikut disentuh.
- **`games/boss.ts` (Tantangan Bos) diberi adapter** supaya topik format baru tidak bikin babak Listening di Bos crash (`t.drill` tidak ada di format baru) — diadaptasi on-the-fly jadi bentuk drill lama, diverifikasi live tidak error.
- Progress tetap 1 sistem generik yang sama (`progress.ts`, skill='listening'). `topicFinished()` Listening format baru SEKARANG pakai `listeningTopicPercent()` (BARU, sesi berikutnya — pola sama `vocabTopicPercent` Vocab, per-soal, bukan `isDone()` biner lagi) — lihat §15.6 poin 7 "Kerja Bagus 100%" (rule ini ternyata berlaku semua skill, bukan cuma Vocab).

### 16.9 Listening — Riset 6 Level + SEMUA 6 Level ke 10 Topik, 2 Format BARU (Note Completion utk Achiever, Dialog+Inferensi utk Trailblazer) (permintaan user: "lakukan research materi listening yang tepat untuk semua level... cek kompetitor & lembaga lain... kemudian implementasi dulu untuk level little start", lalu sesi lanjutan "lanjutkan ke level starter", lalu "lanjutkan ke level explorer", lalu "lanjutkan ke level adventure", lalu "lanjutkan ke level achiver", lalu "lanjutkan ke level trailblazer")

Beda dari §16.8 (yang scope-nya cuma Little Stars sejak awal), sesi ini eksplisit diminta riset utk **SEMUA 6 level** dulu (bukan cuma level yang mau diimplementasi), dgn instruksi tambahan user di tengah sesi: **prioritaskan lembaga/kurikulum Bahasa Inggris Indonesia** (Kurikulum Merdeka, LIA, EF Indonesia/English 1, Kumon, dst) di atas Cambridge YLE, krn target pengguna app ini anak Indonesia — Cambridge YLE tetap dipakai sbg backbone struktural CEFR semata (pemetaan lama PRD §3, tidak diputuskan ulang). Riset lengkap + sumber: `materi/listening.md` (dokumen baru, pola/skeleton meniru `materi/vocab.md`). Implementasi dikerjakan bertahap per level (sama pola dgn rollout Vocab dulu):

- **Sesi 1 — Little Stars**: `LISTENING_TOPICS_LITTLE_STARS` digenapkan dari 2 jadi **10 topik** (8 topik baru: `halo-terima-kasih`, `warna-warni`, `bentuk-benda`, `keluarga-kita`, `kepala-pundak`, `baju-favorit`, `naik-apa`, `senang-sedih`), tema dipetakan 1:1 ke 8 topik `VOCAB_TOPICS_LITTLE_STARS` yang belum pernah disentuh Listening.
- **Sesi 2 — Starter** ("lanjutkan ke level starter"): `LISTENING_TOPICS_STARTER` dibuat dari NOL — **10 topik baru** (`hitung-belasan`, `hari-di-kalender`, `pergi-ke-mana`, `serangga-kecil`, `waktu-makan`, `di-dalam-rumah`, `sekolahku`, `siapa-itu`, `pemandangan-alam`, `hobi-seru`), tema dipetakan 1:1 ke SELURUH 10 topik `VOCAB_TOPICS_STARTER` — `LISTENING_TOPICS_BY_LEVEL['starter']` ditambahkan (sebelumnya Starter fallback ke Explorer utk Listening).
- **Sesi 3 — Explorer** ("lanjutkan ke level explorer"): `LISTENING_TOPICS` (Explorer) digenapkan dari 3 jadi **10 topik** — beda dari sesi 1/2, sesi ini pakai **format LAMA `ListeningTopic` apa adanya** (bukan format baru), krn riset §3C sudah konfirmasi format itu SUDAH cocok utk level ini — 7 topik baru (`klinik`, `kebun-binatang`, `di-kasir`, `jadwal-harian`, `dari-mana`, `pesta-ulang-tahun`, `di-dapur`), masing² dipetakan ke 1 domain `VOCAB_TOPICS` Explorer yang belum disentuh Listening (kesehatan, kata-sifat, belanja-uang, waktu-harian, negara, pesta-perayaan, peralatan-dapur).
- **Sesi 4 — Adventurer** ("lanjutkan ke level adventure"): `LISTENING_TOPICS_ADVENTURER` digenapkan dari 1 jadi **10 topik**, TETAP format LAMA (pola identik sesi 3) — 9 topik baru (`cita-citaku`, `petualangan-safari`, `makan-malam`, `kelas-seni`, `ramalan-cuaca`, `depan-cermin`, `stasiun-kereta`, `hari-olahraga`, `beres-beres`), masing² dipetakan ke 9 dari 10 domain "inti" `VOCAB_TOPICS_ADVENTURER` (pekerjaan, binatang, makanan, alat-sekolah, cuaca, anggota-tubuh, transportasi, olahraga, rumah — `perasaan` sengaja dilewati, sudah terwakili di level lain).
- **Sesi 5 — Achiever** ("lanjutkan ke level achiver", lalu ditanya eksplisit "genapkan format lama VS bangun note-completion beneran" — **user pilih bangun beneran**): `LISTENING_TOPICS_ACHIEVER` dibuat dari NOL dgn format KETIGA `ListeningNoteTopic` (BARU, `types.ts`) — Cambridge A2 Flyers (backbone struktural Achiever) py Listening Part 2 resmi "note completion" (dengar percakapan pendek, lengkapi form kosong), belum ada padanannya di level manapun sebelum ini. Kenalan & Latihan Inti REUSE PERSIS `items: ListeningSentenceItem[]` (fungsi generik yg sudah ada, cukup diperlebar tipenya via union `ListeningItemsTopic`) — yang genuinely BARU cuma Tantangan: "📝 Lengkapi Catatan" (`runTantanganNote`, `games/listening.ts`, BARU) — dengar 1 percakapan pendek (`notePassage`), lalu TAP isi 3–4 field kosong catatan (`noteGaps`) satu per satu (bukan menulis bebas spt Cambridge asli — kid-friendly). 10 topik dipetakan 1:1 ke SELURUH 10 topik `VOCAB_TOPICS_ACHIEVER`.
- **Sesi 6 — Trailblazer** ("lanjutkan ke level trailblazer", lalu ditanya eksplisit "ikuti kunci lama PRD §9 low-effort (1-2 topik) VS revisi penuh (10 topik + format baru)" — **user pilih revisi penuh**, KHUSUS Listening): `LISTENING_TOPICS_TRAILBLAZER` dibuat dari NOL dgn format KEEMPAT `ListeningDialogueTopic` (BARU, `types.ts`) — Cambridge KET→PET (backbone struktural Trailblazer) py lompatan format "gist pendek" → "extended interview + inferensi sikap/opini", belum ada padanannya di level manapun sebelum ini. Kenalan & Latihan Inti REUSE PERSIS `items` (sama pola dgn Achiever) — yang BARU cuma Tantangan: "🧩 Dengar & Simpulkan" (`runTantanganDialogue`, `games/listening.ts`, BARU) — dengar 1 percakapan 2 tokoh lebih panjang (`dialogueLines`), lalu jawab TEPAT 3 `inferenceQuestions` (gist→sikap tokoh→dugaan tindakan) yg butuh memahami KESELURUHAN percakapan, bukan 1 fakta spesifik spt note completion Achiever. 10 topik dipetakan ke 10 tema Cambridge B1 Preliminary (PET) — 2 topik pertama reuse kata `VOCAB_TOPICS_TRAILBLAZER` yang sudah ada, 8 sisanya "menagih" 8 dari 20 tema PET residual yg `materi/vocab.md` §3F.2 sudah riset tapi belum dipetakan ke topik manapun (krn scope Vocab Trailblazer SAAT ITU dikunci 2 topik, TIDAK ikut direvisi sesi ini). **Revisi scope ini KHUSUS Listening saat itu** — Vocab Trailblazer sejak itu juga sudah digenapkan lebih jauh (10/10, §16.6c) lewat topik BEDA dari Listening, bukan migrasi bersama.
- **Target CLAUDE.md ≥10 topik/skill TERCAPAI di SELURUH 6 level** untuk Listening — Little Stars, Starter, Explorer, Adventurer, Achiever & Trailblazer menuntaskan target ini, **4 format Listening berbeda sekaligus** (baru-dikte utk Little Stars/Starter, lama utk Explorer/Adventurer, baru-note-completion utk Achiever, baru-dialog+inferensi utk Trailblazer). (Vocab Trailblazer saat sesi ini masih 2 modul by design — sejak itu jg digenapkan ke 10/10, §16.6c.)
- **Perubahan mekanik/tipe data di sesi 5 & 6** (sesi 1–4 murni data): `types.ts` (`ListeningNoteGap`/`ListeningNoteTopic`/`ListeningDialogueLine`/`ListeningInferenceOption`/`ListeningInferenceQuestion`/`ListeningDialogueTopic`/`ListeningItemsTopic` BARU, `AnyListeningTopic` diperlebar jadi union 4), `progress.ts` (`listeningTopicPercent` terima parameter opsional `tantangan:{section,total}`, default TETAP perilaku lama — dipakai ulang APA ADANYA sesi 6, tidak diubah lagi), `app.ts` (`topicProgressPercent` & `runStage` dapat pembeda ketiga `'dialogueLines' in topic` setelah `'noteGaps' in topic`), `games/listening.ts` (`runTantanganNote` sesi 5 + `runTantanganDialogue` sesi 6 BARU, `renderKenalanSentence`/`runLatihanIntiSentence` diperlebar tipenya jadi union 3), `public/styles.css` (kelas `.note-*` sesi 5 + `.dialogue-*` sesi 6 BARU). **`games/boss.ts` TIDAK perlu diubah di kedua sesi** — adapter `'items' in t` yg sudah ada otomatis kompatibel. Diverifikasi lewat skrip ad-hoc tiap sesi (60 id topik Listening unik lintas skill, 400 item format-baru + 20 topik format-lama + 10 topik format-note + 10 topik format-dialog lolos cek struktural — 5 jebakan tunggal/jamak/konjugasi + 10 duplikat emoji dalam 1 topik ditemukan & diperbaiki total (`Star`→`Stars` di Starter, `Throw/Cry/Whisper/Fly`→bentuk terkonjugasi di Achiever, 10 emoji duplikat di 5 topik Trailblazer), `npm run typecheck` & `npm run build` lolos di keenam sesi — detail `materi/listening.md` §6).
- **Setiap sesi diuji coba LIVE di browser** (Playwright + Chromium headless, login akun tes, klik-navigasi penuh Kenalan→Latihan Inti→Tantangan) — 0 console/page error di keenamnya. Sesi 5 khusus diverifikasi: catatan terisi progresif per gap (jawaban benar tetap muncul walau anak sempat salah, non-punitive), lompat quiz-dot ke gap yg sudah lewat me-render ulang fresh TANPA bocorin jawaban gap aktif, persentase topik 50% saat baru Tantangan yg disentuh (rata-rata 2 tahap bekerja benar). Sesi 6 khusus diverifikasi: transkrip percakapan tersembunyi default, tampil lengkap (nama tokoh + EN/ID) via 💡 Petunjuk, direset tiap ganti pertanyaan; 3 `inferenceQuestions` terjawab berurutan; persentase topik 50% dgn mekanisme `tantangan:{section,total}` yg sama dgn Achiever (tidak perlu kode progress baru). **Sesi 3–6 butuh 1 teknik QA tambahan**: akun tes levelnya Starter (level di atasnya terkunci normal di UI), jadi `bossCleared` di localStorage ditambah level-level sebelumnya secara manual (setara menang boss tiap markas) supaya level berikutnya terbuka utk diuji — murni teknik pengujian 1 sesi browser lokal, bukan perubahan kode/akun permanen.
- **Listening sekarang tuntas ≥10 topik di SELURUH 6 level** — tidak ada level yg tersisa dari scope riset awal (Little Stars, Starter, Explorer, Adventurer, Achiever, Trailblazer semua 10/10). Adventurer masih menyisakan 3 domain Vocab bonus (`bahan-material`, `kata-kerja-harian`, `alam-lingkungan`) yang belum dipetakan ke Listening — bukan gap mendesak (target sudah tercapai), dicatat sbg cadangan tema. 12 dari 20 tema PET residual (`materi/vocab.md` §3F.2) juga masih belum dipetakan — cadangan tema kalau Trailblazer mau diperluas >10 topik nanti. Format note-completion sejauh ini HANYA dipakai Achiever, format dialog+inferensi HANYA dipakai Trailblazer — level lain TIDAK ikut dimigrasi (di luar scope, keputusan terpisah kalau diminta nanti).
- **Ditemukan drift arsitektur di luar scope sesi ini, dilaporkan ke user**: `app/` (yang PRD §5 kunci "tanpa backend/auth di v1") ternyata SEKARANG py layar login (no HP/email, passwordless) yang memanggil `portal` (`account.ts` `API_BASE`), DAN sesi ini menemukan pekerjaan paralel lanjutannya — halaman **landing/marketing BARU** (`renderLandingPage`, screen `'landing'`, slug root `/`) muncul di antara sesi 4 & 5, mengubah alur non-login dari "langsung ke form masuk" jadi "landing dulu → CTA → form masuk di `/masuk`". Keduanya TIDAK disentuh/diubah sesi ini (di luar scope Listening), cuma dicatat supaya §5 PRD diperbarui oleh user kalau memang perubahan permanen.

### 16.10 Reading Little Stars — Riset Flow/Rule Reading + Format KEDUA "Baca Kata" (permintaan user: "lakukan research bagaimana rule dan flow di modul reading, lihat aplikasi kompetitor, lembaga bahasa inggris indonesia maupun luar negri tapi fokus ke dalam negri... coba buat 1 materi di little stars", lalu revisi tengah sesi "pastikan jangan meniru 100%, wajib ada improvement")

Beda dari §16.8/§16.9 (Listening, yang formatnya lanjut format "py `items`" ala Vocab apa adanya) — sesi ini menemukan `ReadingTopic` (format Adventurer, baca kalimat/cerita → jawab pertanyaan, TANPA TTS §15.2) **tidak bisa digenapkan begitu saja ke Little Stars**: riset (`materi/reading.md` §3, prioritas lembaga Indonesia sesuai instruksi user) mengonfirmasi anak 3–5 th belum siap dekoding kalimat — bahkan Kurikulum Merdeka Fase Fondasi baru menargetkan pengenalan huruf/kata di usia 5–6 utk Bahasa Indonesia sendiri (native language), dan SEMUA kompetitor early-literacy yang diriset (Reading Eggs, Endless Reader, HOMER, Starfall, Teach Your Monster to Read) + institusi Indonesia (EF Small Stars, Kumon, LIA) mulai dari pengenalan KATA TUNGGAL (whole-word/sight-word ↔ gambar), bukan kalimat.

- **Format KEDUA `ReadingWordTopic`** (BARU, `types.ts`) — `items: ReadingWordItem[]` (`en`/`id`/`emoji`, struktur mirip `VocabItem` tanpa `example`). Pembeda runtime dari `ReadingTopic` lama: `'items' in topic` (`AnyReadingTopic`, sama pola persis dgn `AnyListeningTopic`) — `app.ts` `runStage`/`runFreePlayRound` dicabangkan, fungsi lama (`renderKenalan`/`runLatihanInti`/`runTantangan`) di `games/reading.ts` TIDAK disentuh sama sekali (tetap dipakai apa adanya utk Adventurer).
- **🔒 Divergensi SENGAJA dari aturan "Reading tidak pernah TTS"** (§15.2/CLAUDE.md) — KHUSUS format ini, kata BOLEH diucapkan `speak()`. Alasan: tujuan `ReadingTopic` lama adalah menguji DEKODING MANDIRI (anak sudah bisa baca, jangan dibantu dengar); tujuan format ini beda total — MEMBANGUN asosiasi bentuk-cetak↔bunyi↔makna (print awareness) utk anak yang belum bisa decode, jadi bantuan dengar itu sendiri bagian dari mekanisme belajarnya (persis pola Reading Eggs/HOMER/Kumon). Divergensi ini TIDAK berlaku ke `ReadingTopic` lama (Adventurer).
- **3 langkah, task SHAPE beda tiap langkah** (permintaan user "wajib ada improvement" — bukan cuma tiru mentah pola "kata→gambar" kompetitor, `materi/reading.md` §4): (1) **Kenalan** — daftar kata (emoji + kata tercetak besar + terjemahan), TIDAK dihitung ke progress topik manapun; **revisi user berikutnya "tetap ada fitur mic dan main"** — 🔊 Dengar + 🎤 coba ucapkan (WAJIB skor proporsional + "Play Suaramu", CLAUDE.md, krn anak bicara lewat mic) + 🎮 Main (1 soal kata↔gambar fokus 1 kata, reuse mekanik Latihan Inti), PERSIS pola Kenalan Vocab/Listening — bukan lagi cuma 🔊 spt versi pertama sesi ini; (2) **Latihan Inti "🎯 Baca & Tunjuk"** — 10 soal, kata tercetak (`.reading-word-card`, flashcard besar+letter-spacing) jadi stimulus UTAMA (bukan audio, 🔊 cuma bantuan opsional TIDAK auto-play), pilih GAMBAR yang cocok dari 4 opsi emoji-only (`optHtml`, tanpa label teks kelihatan — cegah celah cocok-bentuk-teks, pola sama `ReadingTopic` lama); (3) **Tantangan "🖼️ Lihat & Baca"** — 10 soal, ARAH DIBALIK: gambar jadi stimulus, pilih KATA TERCETAK yang cocok dari 4 opsi teks (`.opt-btn-text`, dipinjam gaya First Placement Test) — tangga 2-arah yang TIDAK dipunyai kompetitor manapun yang diriset (semuanya cuma 1 arah: word→meaning), improvement konkret di luar sekadar "kata→gambar" generik. Semua langkah pakai tombol manual "🔁 Coba Lagi"/"Lanjut ➡️" (`roundActionsHtml`, duplikat lokal ke `games/reading.ts` — konvensi sama dgn `games/listening.ts`), BUKAN `setTimeout` auto-advance spt fungsi lama — perbaikan yang sudah lebih dulu dibangun di Vocab/Listening, sekarang ikut menyentuh (bagian dari) Reading, TAPI HANYA format baru ini.
- **1 topik pertama** (permintaan user "coba buat 1 materi") — `kata-hewan` ("Membaca Kata: Hewan"), 10 kata dipetakan 1:1 dari `VOCAB_TOPICS_LITTLE_STARS` topik `hewan-peliharaan` (Dog/Cat/Fish/Bird/Cow/Duck/Horse/Sheep/Pig/Rabbit — kata pendek, emoji sangat khas/tidak ambigu, kosakata yang anak SUDAH kenal dari Vocab, dilatih ulang lewat modalitas baca). Id topik sengaja beda dari id Vocab-nya (konvensi sama dgn Listening Little Stars, `materi/listening.md` §4A).
- **Progress/completion TIDAK butuh kode baru** — Reading (kedua format) belum py section granular per-soal (spt Vocab/Listening format baru), jadi tetap jatuh ke fallback `isStepVisited` yang SUDAH generik lintas skill (`app.ts` `topicProgressPercent`, poin (c)) — nol perubahan di `progress.ts`. Diverifikasi live: layar "Kerja Bagus!" baru muncul setelah Latihan Inti DAN Tantangan sungguh-sungguh dituntaskan, bukan cuma salah satu.
- **Diverifikasi live di browser** (Playwright + Chromium headless, level di-set Little Stars via localStorage) — 0 JS error; alur penuh Kenalan (tap 🔊, warna tombol berubah jadi "done") → Latihan Inti 10 soal (kartu kata besar, opsi gambar, retry/praise/encourage jalan) → Tantangan 10 soal (arah dibalik, opsi teks) → layar "Kerja Bagus!" + 3 bintang + confetti, "Ulangi Modul Ini"/"Pilih Materi Lain" (tanpa "Beranda", konsisten §15.6 poin 3).
- **Riset lengkap + sumber**: `materi/reading.md` (dokumen baru, pola/skeleton meniru `materi/vocab.md`/`materi/listening.md`) — prioritas institusi Indonesia (LIA, EF Indonesia/English1, Kumon) & Kurikulum Merdeka Fase Fondasi sesuai instruksi user, disandingkan riset kompetitor internasional (Reading Eggs, Endless Reader/Alphabet, Starfall, HOMER, ABCmouse, Teach Your Monster to Read).
- **Gap yang masih terbuka** (dilaporkan, bukan dianggap selesai) — Reading MASIH belum ada di Starter/Explorer/Achiever/Trailblazer; Little Stars sendiri baru 1 dari target ≥10 topik (CLAUDE.md); Adventurer (format lama) masih tetap 2 topik, TIDAK ikut digenapkan sesi ini (di luar scope, format-nya juga tidak butuh riset ulang — sudah confirmed cocok di §15.2). Urutan pengerjaan disarankan `materi/reading.md` §6. **Revisi §16.11**: gap "Reading belum ada di 4 level ini" sekarang sudah py riset lengkap (bukan lagi hipotesis) — implementasi kontennya masih menunggu keputusan scope user.

### 16.11 Reading — Perbaikan Kesenjangan Teknis vs Vocab/Listening + Riset 5 Level Tersisa (permintaan user: audit "objective Reading vs modul lain?" → "summary feedback apa yang perlu di-improve" → "implementasi feedback reading, research materi reading per level yang tepat, prioritaskan lembaga Indonesia")

Dua bagian, detail teknis penuh di CLAUDE.md § "Reading — 2 Format Berdampingan" poin 3 & `materi/reading.md` §8–9 (bukan diulang di sini):

- **Perbaikan teknis** (KEDUA fungsi format kedua Little Stars SAJA, format lama Adventurer TIDAK disentuh) — 4 dari 7 poin feedback high/medium-priority: (1) resume/persist progres per-soal (`ensureSection`/`setSectionCursor`, sebelumnya `round` cuma variabel memori — anak yg keluar tengah sesi dulu HARUS mengulang dari soal 1); (2) navigasi quiz-dot (lompat ke soal manapun); (3) 💡 Petunjuk eliminasi 2 opsi (sebelumnya Reading cuma py bantuan audio replay, TANPA eliminasi opsi spt Vocab/Listening); (4) persentase progres naik bertahap per soal (`readingTopicPercent()`, BARU, `progress.ts`) — sebelumnya lompat kasar 0%→100%. 1 poin tambahan diselaraskan: pola jawab "1 tap→terkunci→Coba Lagi/Lanjut" (sebelumnya beda dari pola Vocab/Listening yg sudah mapan). 2 poin feedback SENGAJA tidak diubah (Kenalan seragam dgn Vocab/Listening, Reading tidak ikut Tantangan Bos) — dicatat sbg keputusan/pertanyaan terbuka.
- **Riset 5 level tersisa, prioritas institusi Indonesia** (LIA, EF Indonesia/English1, Kumon, Kurikulum Merdeka Fase A–D) disandingkan Cambridge YLE/Schools Reading & Writing paper resmi tiap level — hasil kunci: **Adventurer TERVALIDASI ULANG** (format existing sudah cocok, TIDAK perlu diganti); **Starter** = perluasan langsung format kedua (kata→frasa pendek); **Explorer BUTUH FORMAT BARU** ("Format B" — 1 kalimat+gambar → Benar/Salah, silent, dikalibrasi Cambridge Pre A1 Starters — beda struktural dari Movers, TIDAK bisa gabung ke format Adventurer spt Listening dulu menggabung Explorer+Adventurer); **Achiever** = perluasan "Format C+" dari format Adventurer (passage lebih panjang + cloze + 1 soal inferensi wajib, dikalibrasi A2 Flyers); **Trailblazer** = TIDAK ditemukan alasan kuat utk revisi penuh (beda dari Listening dulu) — tetap §9 "low-effort" sampai ada instruksi baru.
- **Implementasi Format B (Explorer) & Format C+ (Achiever) BELUM dikerjakan** — keduanya komitmen desain baru (tipe data + render function baru), sengaja MENUNGGU konfirmasi scope eksplisit user dulu, pola persis sama dgn precedent Listening §16.9 sesi 5–6 (Achiever/Trailblazer, "ditanya eksplisit sebelum dikerjakan").
- **Diverifikasi live di browser** (Playwright + Chromium headless) — 10 quiz-dot muncul, jawaban salah mengunci semua opsi & tampilkan Coba Lagi/Lanjut, lompat quiz-dot berfungsi, 💡 Petunjuk eliminasi tepat 2 opsi, **reload browser di tengah soal ke-3 correctly resume di soal ke-3** (bukan reset) — 0 JS error, `npm run typecheck`/`npm run build` lolos.

### 16.12 Grammar Little Stars — Riset Flow/Rule Grammar + Format KEDUA "Satu atau Banyak?" (permintaan user: "lakukan research bagaimana rule dan flow di modul grammar, lihat aplikasi kompetitor, lembaga bahasa inggris indonesia maupun luar negri tapi fokus ke dalam negri... coba buat 1 materi di little stars", + syarat eksplisit di prompt yang sama: "pastikan jangan meniru 100%, wajib ada improvement dimana di fitur kenalan tetap ada fitur mic dan main")

Pola sesi identik §16.10 (Reading Little Stars) — riset dulu, lalu format baru khusus Little Stars, format lama Explorer/Adventurer TIDAK disentuh. Detail teknis penuh di CLAUDE.md § "Grammar — 2 Format Berdampingan" & `materi/grammar.md` (bukan diulang semua di sini):

- Riset (institusi Indonesia — LIA GEVYL, EF Small Stars, Kumon Indonesia EFL; Kurikulum Merdeka Fase Fondasi; Cambridge YLE Starters; kompetitor internasional — Duolingo ABC, Endless Reader, British Council LearnEnglish Kids, Lingokids, Khan Academy Kids) mengonfirmasi **tidak ada satu pun sumber yang mengajarkan rumus grammar eksplisit ke anak 3–6 th** — semua pattern exposure murni audio+gambar. `GrammarTopic` lama (`examples`/`scramble`/`fill`, teks-first) TIDAK BISA diturunkan ke Little Stars krn anak pralek belum bisa baca kalimat sendiri, sama alasan `ReadingWordTopic`/`SpeakingPhraseTopic` (§16.10, PRD 15.5) tidak reuse format lama masing-masing.
- **Format KEDUA `GrammarPatternTopic`** (BARU, `types.ts`) — pola tunggal **singular vs plural** ("It's a car." / "They're cars." — **revisi audit sesi lanjutan**: versi awal "I see one car."/"I see two cars." py kata angka eksplisit di kedua bentuk, bisa dijawab benar cuma dgn dengar "one"/"two" tanpa pernah perlu memperhatikan grammar-nya; dihapus supaya sinyal pembeda satu-satunya jadi "is"/"are" + bentuk kata benda) — satu-satunya struktur grammar yang dikonfirmasi riset muncul di Cambridge YLE Starters (1 tingkat DI ATAS Little Stars) DAN diajarkan tanpa penamaan istilah lintas semua institusi/app yang diriset. `items: GrammarPatternItem[]` (`en`/`id`/`emoji` kata kunci + `singular`/`plural: GrammarPatternForm` 2 kalimat terpisah, ditulis manual per item krn sebagian jamak tidak beraturan mis. "bus"→"buses").
- **2 langkah, ARAH DIBALIK antar keduanya** (permintaan user "wajib ada improvement" — SEMUA kompetitor diriset cuma 1 arah tugas): (1) **Latihan Inti "👂 Dengar & Tunjuk"** — dengar SATU bentuk kalimat (singular/plural diacak 5:5), tunjuk gambar JUMLAH (1 vs 2) yang cocok, audio→gambar; (2) **Tantangan "🔎 Lihat & Dengar, Pilih yang Pas"** — ARAH DIBALIK: gambar jumlah jadi stimulus duluan, pilih dari 2 pilihan ucapan (🔊 A/🔊 B) yang cocok, gambar→audio. Tangga 2-arah ini improvement konkret, TIDAK dipunyai kompetitor manapun yang diriset — prinsip sama §16.10 poin tangga 2-arah Reading. **Kenalan TETAP TIGA aksi** (permintaan user eksplisit "tetap ada fitur mic dan main") — 🔊 dengar kedua bentuk, 🎤 tirukan bentuk singular (skor proporsional + Play Suaramu, §15.5), 🎮 main (1 soal reuse shape Latihan Inti).
- **1 topik pertama** (permintaan user "coba buat 1 materi") — `satu-banyak` ("Satu atau Banyak? (One or Many?)"), 10 kata kendaraan dipetakan dari `VOCAB_TOPICS_LITTLE_STARS` topik `kendaraan` (belum dipakai Speaking/Reading Little Stars; 9/10 kata berpluralisasi beraturan "-s").
- **Progress/percent pakai `grammarTopicPercent()`** (BARU, `progress.ts`, section granular per-soal — pola sama `readingTopicPercent()` §16.11, BUKAN fallback kasar `isStepVisited`).
- **Diverifikasi live di browser** (Playwright + Chromium headless, level di-set Little Stars via localStorage) — 0 JS error; alur penuh Kenalan (🔊/🎤/🎮 tampil semua, mini-game + confetti jalan) → Latihan Inti 3 dari 10 soal dicoba (quiz-dot, feedback benar/salah non-punitive) → Tantangan 3 dari 10 soal dicoba via lompat stepper bebas (gambar jumlah tampil sbg stimulus SEBELUM 2 tombol audio) — `npm run typecheck`/`npm run build` lolos.
- **Gap yang masih terbuka** (dilaporkan, bukan dianggap selesai) — Grammar Little Stars baru 1 dari target ≥10 topik (CLAUDE.md); Starter/Explorer/Achiever/Trailblazer format kedua belum ada (di luar scope sesi ini, permintaan user eksplisit "coba buat 1 materi di little stars"); format LAMA Explorer/Adventurer TIDAK ikut digenapkan/diperbaiki (masih auto-advance + tanpa hint, gap lama yang sudah terdokumentasi). Kandidat topik berikutnya dari struktur Cambridge Starters yang belum dipakai: this/that (demonstrative), preposisi in/on/under, possessive "my/your" — detail `materi/grammar.md` §7.

### 16.13 Reading — Implementasi Hasil Riset §16.11: Format KETIGA (Explorer) + Konten Starter/Adventurer/Achiever (user memilih SEMUA 4 opsi implementasi sekaligus dari hasil riset 5 level §16.11: "Starter (1 topik), Genapkan Adventurer, Explorer (format baru), Achiever (perluasan format)")

Detail teknis penuh: CLAUDE.md § "Reading — 3 Format Berdampingan" poin 4 & `materi/reading.md` §10 (tidak diulang semua di sini).

- **Starter** — `READING_TOPICS_STARTER` (BARU), 1 topik `baca-tempat` ("Membaca Frasa: Tempat") — REUSE PERSIS format KEDUA (`ReadingWordTopic`) Little Stars, cuma unit naik dari kata tunggal ke FRASA 2–3 kata ("At The Zoo", "On The Mountain") dipetakan dari `VOCAB_TOPICS_STARTER` topik `tempat-di-sekitar` — ZERO kode baru, murni kerja data (riset §16.11 sudah konfirmasi Starter belum perlu format baru).
- **Explorer — Format KETIGA BARU `ReadingCheckTopic`** (`types.ts`) — "Baca & Nilai": `checks: ReadingCheckItem[]` (`emoji`/`trueSentence`/`falseSentence`/`id`). 1 topik `baca-dan-cek` ("Baca & Cek: Sifat Benda"), 10 item dipetakan dari `VOCAB_TOPICS` (Explorer) topik `kata-sifat` (Adjectives & Opposites — tiap kata sudah py lawan kata alami, `falseSentence` cukup ganti PERSIS 1 kata sifat). Masuk keluarga **"silent reading"** sama dgn format lama Adventurer (TTS TIDAK PERNAH dipakai di kind manapun format ini) — beda sengaja dari format kedua Little Stars/Starter yg audio-nya aktif. 3 fungsi baru `games/reading.ts`: Kenalan silent tanpa mic/game (`renderKenalanCheck`), Latihan Inti "🤔 Benar atau Salah?" (`runLatihanIntiCheck`, gambar+kalimat dipilih acak benar/salah 50/50, TANPA hint krn biner), Tantangan "🔍 Baca & Temukan" (`runTantanganCheck`, task shape DIBALIK — kalimat sendirian → pilih gambar dari 4 opsi, DENGAN hint). Section persistence & `readingTopicPercent()` (progress.ts, diparameterkan ulang terima `tantangan?: {section,total}` spt `listeningTopicPercent`) dipasang SEJAK AWAL, bukan retrofit spt format kedua kemarin.
- **Adventurer digenapkan 2→10 topik** (target CLAUDE.md ≥10/skill TERCAPAI, level Reading PERTAMA yg capai ini) — 8 topik baru skenario keseharian anak 9–11 th (`hari-sekolah`, `pesta-ulang-tahun`, `belanja-di-pasar`, `hari-hujan`, `hari-olahraga`, `memasak-di-dapur`, `taman-bermain`, `perjalanan-kereta`), format LAMA (`ReadingTopic`) APA ADANYA — riset §16.11 sudah tervalidasi ulang, murni kerja data, TIDAK ada perubahan mekanik.
- **Achiever BARU dari NOL** — `READING_TOPICS_ACHIEVER`, 1 topik `hari-piknik` ("Picnic Day"), TETAP format LAMA `ReadingTopic` (BUKAN tipe baru) — "Format C+" dicapai lewat KONTEN lebih berat: `story` 4 kalimat (naik dari 3) + `question` akhir WAJIB pertanyaan INFERENSI (jawaban tidak pernah ditulis literal, anak gabungkan ≥2 info dari cerita).
- **`games/boss.ts` TETAP TIDAK disentuh** — ketiga format Reading semuanya di luar `poolFor()`, tidak ada adapter yang diperlukan.
- **Diverifikasi live di browser** (Playwright + Chromium headless) di KEEMPAT level — kartu Reading muncul, semua topik baru ter-render benar; Format KETIGA (Explorer) diuji penuh: 💡 Petunjuk eliminasi tepat 2 dari 4 opsi, lompat quiz-dot ke soal ke-5 lalu **reload browser correctly resume di soal ke-5** (persistence baru jalan benar sejak awal, tidak perlu perbaikan susulan spt format kedua) — 0 JS error di semua 4 level, `npm run typecheck`/`npm run build` lolos.
- **Gap yang masih terbuka** (dilaporkan, bukan dianggap selesai) — Starter/Explorer/Achiever masing² baru 1 dari target ≥10 topik (Adventurer & **Revisi §16.14** Trailblazer satu-satunya yg sudah capai target masing²: 10/10 & 5/5); cloze-dalam-passage (pelengkap opsional dari riset §16.11 utk Adventurer/Achiever) belum dibangun — butuh mekanik baru (blank+word-bank di tengah kalimat), bukan sekadar data. Urutan pengerjaan disarankan `materi/reading.md` §11.

### 16.14 Reading Trailblazer + 🔒 Revisi Target Kelengkapan Konten Trailblazer (permintaan user: "apakah bisa untuk Trailblazer minimal 5 topik, jadi Little Stars/Starter/Explorer/Adventurer/Achiever min 10 topik. tambahkan rule ini di PRD.md dan CLAUDE.md. dan kerjakan untuk Trailblazer")

**Revisi kebijakan** (bukan cuma konten Reading) — target lama "Trailblazer low-effort, 1–2 modul preview" (§9, dikunci sejak sesi Vocabulary §16.6) DINAIKKAN jadi **minimal 5 topik/skill**, dicatat resmi di §9 & CLAUDE.md "🎯 Target Kelengkapan Konten per Modul" poin 1. Trailblazer TETAP lebih ringan dari 5 level lain (≥10 topik/skill) — levelnya tetap "jalur lanjutan" opsional (usia 12+, di luar `PlacementLevelKey`), bukan disamakan penuh. **Revisi ini TARGET KE DEPAN per-skill, BUKAN mandat retroaktif** — skill yang sudah dikunci ke target lama dgn keputusan sadar sebelumnya TIDAK otomatis perlu digenapkan sekarang; target baru berlaku begitu skill itu disentuh lagi di sesi mendatang (Vocabulary Trailblazer sejak itu SUDAH disentuh lagi & melebihi target baru, 10/10 topik, §16.6c).

**Implementasi Reading** (skill pertama yang mengadopsi target baru ini) — `READING_TOPICS_TRAILBLAZER` (BARU, `content.ts`), **5 topik**, TETAP format LAMA `ReadingTopic` (reuse tipe Adventurer/Achiever — riset §16.11/`materi/reading.md` §9.5 sudah konfirmasi TIDAK ADA alasan kuat utk revisi mekanik penuh spt Listening dulu): `wawancara-radio-sekolah` (School Radio Interview), `liburan-yang-berubah` (A Holiday That Changed), `proyek-lingkungan` (Environmental Project), `kompetisi-robot` (Robotics Competition), `kerja-sukarela` (Volunteer Day) — 5 tema PET-appropriate remaja 12+ (komunikasi/perjalanan/lingkungan/teknologi/kerja sosial), konten dinaikkan LEBIH JAUH dari Achiever (kalimat majemuk, konektor "however/although/instead"), SEMUA `question` akhir INFERENSI (pola sama Achiever §16.13, konsisten lintas 2 level "lanjutan").

**Diverifikasi live di browser** (Playwright + Chromium headless) — kartu Reading muncul utk Trailblazer, KELIMA topik ter-render benar (dicek satu per satu by title), cerita 4-kalimat + pertanyaan inferensi tampil sempurna via mekanik `ReadingTopic` yg sama persis, chip level "✨ Trailblazer" benar — 0 JS error, `npm run typecheck`/`npm run build` lolos.

**Reading sekarang skill KEDUA (setelah cuma Adventurer sebelumnya) yg capai target lengkap di 2 level sekaligus** (Adventurer 10/10, Trailblazer 5/5) — Starter/Explorer/Achiever masih 1/10 masing², dilaporkan sbg gap terbuka (`materi/reading.md` §11), bukan dianggap selesai.

### 16.15 Grammar — Fix Objective/UX Little Stars + Riset & Implementasi 5 Level Tersisa (permintaan user: audit "apa objective grammar, beda dari modul lain?" → "summary feedback... urutkan prioritas" → "apakah bisa implementasi feedback grammar? research di kompetitor... research materi grammar per level yang tepat dan implementasi sesuai feedback")

Dua bagian, detail teknis penuh di CLAUDE.md § "Grammar — 3 Format Berdampingan" & `materi/grammar.md` §8-12 (bukan diulang semua di sini):

- **Fix objective/UX Little Stars** (audit menemukan §16.12 py 2 kelemahan) — (1) kalimat `en` versi awal ("I see one car."/"I see two cars.") py kata angka eksplisit di KEDUA bentuk, jadi bisa dijawab benar 100% cuma dgn dengar "one"/"two" tanpa pernah perlu memperhatikan grammar-nya — diperbaiki jadi "It's a car."/"They're cars." (satu-satunya sinyal pembeda sekarang PERSIS "is"/"are" + bentuk kata benda); (2) Tantangan versi awal 1 tap = dengar SEKALIGUS langsung terkunci sbg jawaban final — diperbaiki jadi 2 langkah (tap = preview/ganti pilihan bebas, tombol terpisah "✅ Pilih Jawaban Ini" utk commit).
- **Riset & implementasi 5 level tersisa** (Cambridge YLE/Schools ladder + institusi Indonesia — EF Indonesia High Flyers, Kumon, Kurikulum Merdeka Fase D, TBI, Wall Street English — disandingkan kompetitor internasional): **Starter** REUSE format kedua (`GrammarPatternTopic`, direname `singular`/`plural`→`formA`/`formB` + field baru `contrastVisual` supaya generik lintas kontras) dgn kontras BARU "suka/tidak suka" (present simple positive/negative); **Explorer/Adventurer** format LAMA (`GrammarTopic`) DIVALIDASI ULANG cocok (EF Indonesia High Flyers "grammar sistematis" persis di usia ini), masing² +1 topik (prepositions of place / comparatives); **Achiever** BARU dari nol, format LAMA + konten dikurasi sbg KONTRAS (present continuous vs simple, pola "Format C+ via konten" sama Achiever Reading); **Trailblazer** format KETIGA BARU `GrammarTransformTopic` (transformasi kalimat MCQ, mengikuti task resmi Cambridge PET Writing Part 1 "key-word transformation") — **user ditanya eksplisit** ("ikuti default low-effort" vs "bangun format baru") → **user PILIH bangun format baru**, 1 topik reported-speech (10 kutipan, dibatasi kalimat pernyataan present simple saja).
- **Diverifikasi live di browser** (Playwright + Chromium headless) utk KEENAM level dlm 1 skrip — Little Stars (regresi 0 setelah rename formA/formB), Starter (kartu polarity ✅/❌ render benar), Explorer/Adventurer (topik baru scramble jalan), Achiever (format lama konten baru jalan), Trailblazer (format transform baru — Kenalan 10 pasangan kutipan+reported speech, Latihan Inti 4-opsi MCQ, Tantangan arah dibalik) — 0 JS error di semua level, `npm run typecheck`/`npm run build` lolos.
- **Grammar sekarang skill KETIGA (setelah Speaking, lalu bareng sesi ini) yg py materi di SEMUA 6 level sekaligus, TAPI belum satu pun level capai target lengkap** (≥10 utk 5 level, ≥5 utk Trailblazer per §16.14) — **Trailblazer PALING mendesak** (1/5, belum capai target Trailblazer sendiri yg lebih rendah, beda dari 5 level lain yg gap-nya "sesuai ekspektasi 1 topik pertama") — dilaporkan sbg gap terbuka (`materi/grammar.md` §12), bukan dianggap selesai.

### 16.16 Reading — Kenalan Format Lama Dapat 🔊/🎤/🎮 (permintaan user: "fokus ke materi reading adventure 'Di Kebun Binatang'... apakah di kenalan bisa ditambahkan button sound, mic, dan main? buat simple question/game di button main")

Detail teknis penuh: CLAUDE.md § "Reading — 3 Format Berdampingan" poin 5 & `materi/reading.md` §10.7 (tidak diulang semua di sini).

Sebelum revisi ini, Kenalan format LAMA (`renderKenalan`, `games/reading.ts` — dipakai SEMUA 16 topik Adventurer/Achiever/Trailblazer) murni daftar teks statis + terjemahan, tanpa interaksi apa pun selain tombol lanjut. Sekarang 3 aksi per ADEGAN (`primer[i]`), pola sama Kenalan format kedua/ketiga:

- **🔊 Dengar** — baca SEMUA baris adegan itu (`speakSequence`).
- **🎤 Coba ucapkan** (`sttSupported` saja) — skor proporsional (`wordMatchDetail` thd gabungan baris adegan) + "▶️ Play Suaramu", WAJIB ikut Aturan Wajib Speaking (§15.5) krn anak bicara lewat mic.
- **🎮 Main** (BARU, `runSceneMiniGame`) — permintaan user eksplisit "simple question/game".

**🔒 Revisi user lanjutan** ("untuk fitur 🎮 di reading, apakah bisa buat simple sehingga beda dengan latihan inti") — versi PERTAMA 🎮 Main reuse `drill[i]` verbatim (passage BARU + MCQ gambar), yang ternyata task shape-nya IDENTIK dgn soal Latihan Inti (cuma beda kemasan) — bug redundansi yang sama persis dgn yg pernah ditemukan di Kenalan "Main" Listening. Diganti jadi **Susun Kalimat sederhana**: ambil kalimat PERTAMA dari `primer[i].passage` (yang baru saja dibaca anak di daftar atas), acak kata-katanya, anak susun ulang jadi urutan benar (tap kata dari bank, evaluasi otomatis begitu lengkap — pola sama persis `runSusunKalimat` Vocab Tantangan). Task shape ini genuinely beda dari Latihan Inti — MENGONSTRUKSI kalimat yang sudah dibaca, bukan MEMILIH jawaban dari kalimat baru — dan ZERO data baru diauthoring (kata-katanya ditokenize langsung dari teks `primer` yang sudah ada).

**Divergensi TERBATAS dari prinsip "Reading tidak pernah TTS" (§15.2)** — HANYA di Kenalan, Latihan Inti & Tantangan TETAP silent tanpa perubahan apa pun. Alasan: Kenalan murni exposure (terjemahan Indonesia sudah ditampilkan gratis di sebelah kalimatnya, tidak ada yang "diuji" di tahap ini) — 2 tahap yang benar-benar menguji dekoding mandiri (kalimat BARU yang belum pernah anak baca) tidak disentuh sama sekali.

**Diverifikasi live di browser** — topik "Di Kebun Binatang" (Adventurer, sesuai fokus user): 2 adegan, masing-masing 3 tombol tampil; 🎮 Main scene 1 → susun 4 kata acak ("zoo"/"the"/"visits"/"Zoe") jadi "Zoe visits the zoo" → evaluasi otomatis → confetti + praise + kembali ke daftar dgn tombol jadi hijau "done"; 🔊 scene 2 diputar tanpa crash. 0 JS error, `npm run typecheck`/`npm run build` lolos.

### 16.17 Reading — Latihan Inti/Tantangan Format Lama Diredesain Total: Quiz-Dot + Petunjuk + 10 Soal (permintaan user langsung setelah §16.16: "di 🎮 sama kan dengan latihan inti tapi di 🎮 ada translasi bahasa indonesia sedangkan di latihan inti dan tantangan translasinya berupa klik button petunjuk dan di latihan inti dan tantangan minimal 10 soal dan di atasnya tambahkan bullet progress yang bisa di klik seperti flow di materi lain di modul vocab")

Detail teknis penuh: CLAUDE.md § "Reading — 3 Format Berdampingan" poin 6 & `materi/reading.md` §12 (tidak diulang semua di sini).

Sebelum sesi ini, `runLatihanInti`/`runTantangan` format LAMA (`games/reading.ts`, dipakai SEMUA 16 topik Adventurer/Achiever/Trailblazer) adalah SATU-SATUNYA bagian Reading yang belum ikut pola mapan Vocab/Listening: auto-advance (`setTimeout`), tanpa hint, tanpa navigasi quiz-dot, & Latihan Inti cuma 2 soal/Tantangan cuma 1 soal — jauh di bawah target ≥10 topik CLAUDE.md (yang selama ini merujuk ke JUMLAH TOPIK, bukan jumlah soal per sesi — gap soal-per-sesi ini baru terungkap lewat permintaan eksplisit user sesi ini). Sesi ini menutup semuanya sekaligus lewat 1 engine generik bersama (`runReadingQuizSet()`), mengadopsi persis pola yang sudah mapan di modul Vocab: navigasi bullet/quiz-dot yang bisa diklik bebas, tombol manual "🔁 Coba Lagi"/"Lanjut ➡️" gantikan auto-advance, dan "💡 Petunjuk" (satu tombol, tersedia sejak awal, mengungkap terjemahan Indonesia gabungan `passage`+`question` sekaligus) menggantikan terjemahan yang dulu TIDAK PERNAH ada sama sekali di 2 tahap ini (beda dari Kenalan yang terjemahannya selalu terlihat gratis).

Field baru diauthoring manual untuk mendukung Petunjuk: `ReadingDrill.id`/`questionId` & `ReadingTopic.storyId`/`question.id` (types.ts) — 96 string terjemahan baru di 16 topik (`content.ts`). 10 soal minimum dicapai lewat cycling (`pickDrillForCount()`, pola sama Vocab): Latihan Inti mengulang 2 `drill` asli topik; Tantangan (yang cuma punya 1 cerita+1 pertanyaan alami) menggabungkan `drill`+`story` jadi 1 pool "beberapa cerita mini" (`tantanganPool()` — keputusan desain lewat pilihan eksplisit user: "Gabung drill + cerita jadi 1 pool"), lalu di-cycle ke 10 soal — tiap soal (bukan tiap cerita) tetap jadi 1 bullet dot tersendiri (ditegaskan user via revisi lanjutan).

**Diverifikasi live di browser (Playwright)** — topik "Di Kebun Binatang": 10 quiz-dot tampil & bisa diklik lompat ke soal manapun di kedua tahap; "💡 Petunjuk" mengungkap kedua terjemahan sekaligus; Tantangan menyiklus 3 cerita mini unik (2 drill + 1 story) dengan urutan teracak; menuntaskan Latihan Inti (10/10) lalu Tantangan (10/10) berurutan memunculkan layar "Kerja Bagus!" (gate `topicFinished()` §"Sudah selesai" poin 7 tetap berlaku benar); reload/kunjungi ulang topik yang sudah selesai resume tepat di soal terakhir, bukan balik ke soal 1. 0 JS error, `npm run typecheck`/`npm run build` lolos.

**Reading sekarang konsisten penuh dengan Vocab/Listening di SEMUA 3 format sekaligus** (bukan cuma format kedua/ketiga seperti sebelumnya) — Grammar format lama (Explorer/Adventurer/Achiever) jadi satu-satunya sisa gap serupa (auto-advance+tanpa hint) di seluruh app.

### 16.18 🔒 Aturan Baru: Kalimat Soal Tidak Boleh Duplicate Lintas Tahap + Verifikasi Otomatis (permintaan user: "kenapa ada soal di latihan inti yang sama 100% dengan tantangan? di level explore materi kebun binatang" → "buat aturan dimana soal di kenalan, latihan inti, tantangan disetiap model di setiap materi tidak boleh 100% sama atau duplicate")

User melaporkan Listening Explorer topik `kebun-binatang` py kalimat drill Latihan Inti "The turtle is slow." yang muncul LAGI persis sama (character-for-character) sbg salah satu baris `story` di Tantangan. Rule baru dicatat resmi di CLAUDE.md "🔒 Aturan Wajib: Kalimat Soal... Tidak Boleh 100% Sama" (tidak diulang detailnya di sini): dalam 1 topik skill/level manapun, kalimat stimulus yang dipakai sbg soal TIDAK BOLEH diulang 100% sama persis di ≥2 tahap (Kenalan/Latihan Inti/Tantangan) — kosakata yang sama lintas tahap TETAP wajar/perlu (itu tujuan alur expose→practice→challenge), yang dilarang adalah KALIMAT PERSIS SAMA yang ditulis ulang.

**Otomasi, bukan cuma dokumentasi** — konsisten pola `verify-vocab-content.mjs` (§16.x lama, "verifikasi manual rawan kelewat"): `app/scripts/verify-content-duplicates.mjs` (BARU) di-bundle esbuild utk `import` `content.ts` asli, dijalankan sbg bagian `npm run build` (package.json `verify:duplicates`, sejajar `verify:content`) — jadi TIDAK BISA lagi lolos diam-diam. Scope: KEEMPAT format LAMA yang py risiko struktural ini (`ListeningTopic`/`ReadingTopic`/`SpeakingTopic`/`GrammarTopic`, masing² py beberapa array sibling diauthor terpisah dlm 1 topik — primer/drill/story/question, model/drill/roleplay, examples/scramble/fill). Format `items`-based (Vocab & semua format BARU) di luar scope krn TIDAK py risiko yang sama secara struktural — 1 kalimat cuma ditulis SEKALI di data lalu dipakai ulang oleh KODE lintas tahap (bukan diulang-tulis di data).

**3 duplikat ditemukan skrip (1 dilaporkan user + 2 baru ketemu), semua diperbaiki via reword tanpa ubah opsi jawaban/logic**: Listening Explorer `kebun-binatang` (drill vs story "The turtle is slow."), Listening Adventurer `ramalan-cuaca` (primer vs question "What is the weather like today?"), Speaking Explorer `kamu-dari-mana` (model vs roleplay "Where are you from?" — bug tambahan: roleplay yang seharusnya prompt jawaban BEBAS jadi cuma mengulang kalimat yang baru ditirukan di model). `npm run build` lolos bersih sesudah ketiganya diperbaiki.

### 16.19 Reading Little Stars Digenapkan 1→10 Topik (permintaan user: "di level little stars materi reading masih 1, buatkan minimal 10 dan research materi yang relevan dengan level little stars... bisa research ke lembaga bahasa inggris dalam negeri maupun luar tapi utamakan dalam negri")

Detail teknis penuh: CLAUDE.md § "Reading — 3 Format Berdampingan" poin 2 & `materi/reading.md` §13 (tidak diulang semua di sini).

Little Stars sempat jadi satu-satunya level Reading yang masih 1/10 topik sejak pilot sesi pertama (`kata-hewan`). Riset konfirmasi ke LIA GEYL, EF Small Stars, Kumon Indonesia menegaskan ulang pola "look, listen, repeat" via kartu kata-gambar konkret sbg gerbang pertama sebelum phonics — konsisten dgn kesimpulan riset format ini sejak awal, tidak ada sumber yg menyarankan urutan kategori beda dari yg sudah dipakai `VOCAB_TOPICS_LITTLE_STARS`. Keputusan: genapkan lewat 9 topik baru dipetakan 1:1 dari domain Vocab Little Stars yg belum disentuh Reading (`kata-warna`/`kata-angka`/`kata-bentuk`/`kata-keluarga`/`kata-tubuh`/`kata-buah`/`kata-mainan`/`kata-pakaian`/`kata-kendaraan`), urutan reuse urutan asli Vocab. 2 domain sengaja dilewati: `salam-sopan-santun` (satu-satunya domain `iconAmbiguous` di Vocab — emoji gestur/ekspresi multi-tafsir tanpa teks penjelas, fatal utk Latihan Inti Reading yang jawabannya murni gambar tanpa label) & `perasaanku` (konsep emosi abstrak, ditaruh paling akhir di urutan asli Vocab krn kompleksitas kognitif lebih tinggi — disisakan utk sesi mendatang kalau mau digenapkan lebih jauh dari target baku ≥10).

Diverifikasi: `npm run typecheck`/`verify:content`/`verify:duplicates`/`build` semua lolos; live di browser (Playwright) — 10 kartu topik tampil di Menu Materi, Kenalan & Latihan Inti topik baru render normal, 0 JS error.

**Reading sekarang 10/10 di 3 dari 6 level** (Little Stars, Adventurer, Trailblazer target-khusus 5/5) — Starter/Explorer/Achiever masih 1/10 masing², dilaporkan sbg gap terbuka, bukan dianggap selesai.

### 16.20 Reading Starter Digenapkan 1→10 Topik (permintaan user: "di level starter materi reading masih 1, buatkan minimal 10 dan research materi yang relevan dengan level starter... utamakan dalam negri")

Detail teknis penuh: CLAUDE.md § "Reading — 3 Format Berdampingan" poin 2 & `materi/reading.md` §14 (tidak diulang semua di sini).

Pola identik §16.19 (Little Stars), giliran Starter. Riset konfirmasi ulang (LIA GEYL, EF Small Stars, Kumon Indonesia) tidak menemukan alasan utk urutan kategori beda dari `VOCAB_TOPICS_STARTER` yg sudah ada. Genapkan lewat 9 topik baru dipetakan dari SEMUA 9 domain Vocab Starter yg belum disentuh Reading (`baca-angka`/`baca-hari`/`baca-serangga`/`baca-makanan`/`baca-barang`/`baca-sekolah`/`baca-orang`/`baca-alam`/`baca-hobi`) — beda dari Little Stars, 0 domain dilewati krn Vocab Starter tidak punya domain `iconAmbiguous` atau seabstrak `perasaanku`. Frasa 2-3 kata (konsisten desain Starter, bukan kata tunggal spt Little Stars) dikonstruksi natural per-domain mengikuti kealamian bahasa Inggrisnya sendiri — bukan 1 template dipaksakan ke semua domain (pola sama `baca-tempat` yg sudah mencampur "At The X"/"On The X" dalam 1 topik): `The X` (serangga/barang rumah/alam), `I Like X` (makanan/hobi, reuse `item.example.en`), `My X` (hal personal), `On <Hari>` dicampur `I Play(ed) Today/Tomorrow/Yesterday` (tense disesuaikan biar tetap gramatikal), `<Angka> <Benda Jamak>`. Zero kosakata baru.

Diverifikasi: `npm run build` (typecheck+verify:content+verify:duplicates) lolos bersih; live di browser (Playwright) — 10 kartu topik tampil, Kenalan/Latihan Inti/Tantangan semua render normal (termasuk Tantangan topik `baca-hari` dgn 10 quiz-dot), 0 JS error.

**Reading sekarang 10/10 di 4 dari 6 level** (Little Stars, Starter, Adventurer, Trailblazer target-khusus 5/5) — Explorer/Achiever masih 1/10 masing², dilaporkan sbg gap terbuka, bukan dianggap selesai.

### 16.21 Reading Explorer Digenapkan 1→10 Topik (permintaan user: "di level explorer materi reading masih 1, buatkan minimal 10 dan research materi yang relevan dengan level explorer... utamakan dalam negri")

Detail teknis penuh: CLAUDE.md § "Reading — 3 Format Berdampingan" poin 3 & `materi/reading.md` §15 (tidak diulang semua di sini).

Pola serupa §16.19/§16.20, giliran Explorer (format `ReadingCheckTopic`, "Baca & Nilai" Benar/Salah). Kendala baru dibanding Little Stars/Starter: topik pertama (`baca-dan-cek`) dipetakan dari domain ADJECTIVE `kata-sifat` (py lawan kata alami big↔small), sedangkan 9 domain `VOCAB_TOPICS` (Explorer) sisa SEMUANYA kata benda tanpa antonim alami. Riset (WebSearch, LIA GEYL) mengonfirmasi program GEYL usia 7-12 (irisan penuh dgn Explorer 7-9) eksplisit mencakup kosakata keluarga/uang/waktu/negara — tidak ada alasan menyimpang dari domain Vocab yg sudah ada.

Genapkan lewat 9 topik baru (`cek-keluarga`/`cek-angka`/`cek-warna`/`cek-kesehatan`/`cek-uang`/`cek-waktu`/`cek-negara`/`cek-pesta`/`cek-dapur`) dgn mekanik `falseSentence` diadaptasi per tipe domain: `cek-warna` reuse persis pola adjective asli (kalimat Vocab sendiri sudah "The X is <warna>.", swap warna ke sibling); 8 domain benda murni lainnya pakai frasa natural per-domain seragam ("This is a/an X."/"I am from X."/"It is X."/dst), `falseSentence` swap ke item sibling dalam topik yang sama — tetap kalimat gramatikal utuh (bukan absurd), konsisten prinsip "near-miss masuk akal" topik pertama.

Verifikasi tambahan di luar `npm run build`: skrip ad-hoc mengecek 100/100 checks (10 topik × 10 item) tidak ada `trueSentence === falseSentence` (bug yg bikin soal selalu "benar") — 0 masalah ditemukan. Dicatat: `npm run verify:duplicates` (§16.18) TIDAK cover `ReadingCheckTopic`, scope-nya cuma 4 format lama yg py sibling array — gap otomasi kalau nanti mau diperluas.

Diverifikasi: `npm run build` lolos bersih; live di browser (Playwright) — 10 kartu topik tampil, Kenalan/Latihan Inti ("🤔 Benar atau Salah?")/Tantangan ("🔍 Baca & Temukan", 10 quiz-dot) semua render normal, 0 JS error.

**Reading sekarang 10/10 di 5 dari 6 level** (Little Stars, Starter, Explorer, Adventurer, Trailblazer target-khusus 5/5) — HANYA Achiever yang masih 1/10, dilaporkan sbg gap terbuka, bukan dianggap selesai.

### 16.22 Audit Reading Adventurer (permintaan user: "audit materi reading di adventure apakah sudah sesuai dengan levelnya? dan sudah research ke lembaga bahasa inggris lain?")

Detail penuh: `materi/reading.md` §16 (tidak diulang semua di sini). Audit murni — TIDAK ada perubahan `content.ts`/kode, hanya dokumentasi diperkuat.

Semua 10 topik `READING_TOPICS_ADVENTURER` dibaca ulang baris-per-baris — verdict: konten SESUAI level (kalimat A1 Movers, kosakata dalam rentang A1-A2, pola anti-tebak konsisten di 10/10 topik, variasi tipe pertanyaan bagus), 0 bug ditemukan. Riset format (§9.3) sebelumnya cuma 2 sumber (Kurikulum Merdeka Fase C + Cambridge A1 Movers) — lebih tipis dari level/skill lain yang juga cek institusi swasta Indonesia (LIA/EF/Kumon). Riset tambahan sesi audit ini menutup gap itu: EF Indonesia (konfirmasi tier High Flyers 6-10 → Trailblazers 10-14, Adventurer 9-11 persis di titik peralihan, konsisten temuan Grammar), LIA GEYL (usia 7-12, domain keluarga/uang/waktu/negara cocok), Kumon Indonesia (level D2 ~9-11 th sudah ajarkan inferensi — lebih maju dari desain app ini yang sengaja tunda inferensi ke Achiever mengikuti backbone Cambridge Movers, BUKAN kesalahan, cuma data poin dicatat sbg opsi masa depan).

**Verdict akhir: format & konten Reading Adventurer TIDAK PERLU diubah** — riset tambahan memperkuat (bukan membantah) validasi yang sudah ada.

### 16.23 Reading Achiever Digenapkan 1→10 Topik — 🎉 Reading TUNTAS ≥10 Topik di SEMUA 6 Level (permintaan user: "di level achiver materi reading masih 1, buatkan minimal 10 dan research materi yang relevan dengan level achiver... utamakan dalam negri")

Detail teknis penuh: CLAUDE.md § "Reading — 3 Format Berdampingan" poin 1 & `materi/reading.md` §17 (tidak diulang semua di sini). Level TERAKHIR yang masih di bawah target ≥10 — sesi ini menutup skill Reading secara penuh di seluruh 6 level.

Riset (WebSearch) mengonfirmasi EF Indonesia Trailblazers (10-14 th, irisan penuh Achiever 11-13) fokus "topik relevan kehidupan nyata + critical thinking", dan Kumon EFL fokus "reading comprehension + critical thinking tingkat lanjut" — keduanya memperkuat arah yang sudah dipilih sesi awal (§16.11/materi/reading.md §9.4): skenario kehidupan nyata + wajib pertanyaan inferensi. Tidak ada alasan mengubah format, murni genapkan konten.

9 topik baru, masing² dipetakan dari 1 domain `VOCAB_TOPICS_ACHIEVER` yang belum disentuh Reading, dibungkus jadi skenario naratif remaja 11-13 th: `mencari-sahabat-pena` (ciri-ciri-fisik), `jalan-jalan-di-kota` (tempat-di-kota), `mencari-alamat` (arah-posisi), `akhir-pekan-di-rumah` (hiburan-waktu-luang), `main-petak-umpet` (kata-kerja-lanjutan), `tugas-sekolah-online` (teknologi-internet), `murid-baru-di-kelas` (sifat-kepribadian), `memilih-proyek-sekolah` (mata-pelajaran), `menggalang-dana-sekolah` (angka-puluhan). 1 domain (`sifat-benda-lanjutan`) sengaja dilewati — paling sulit dirangkai jadi narasi personal dibanding 9 domain lain.

Semua 9 topik konsisten "Format C+": `story` 4 kalimat, `question` akhir wajib inferensi (jawaban tidak pernah ditulis literal) — dengan variasi mekanisme inferensi yang sengaja dijaga tidak monoton: pola-tindakan-berulang (kepribadian disimpulkan dari tindakan berulang, bukan disebut langsung), observasi-tanpa-penghubung (pola sama `hari-piknik`), gabung-info-lintas-bagian (primer+story), dan perhitungan-matematika-aktual (anak harus menjumlahkan sendiri 90rb+10×1rb=100rb).

Diverifikasi: `npm run build` (typecheck+verify:content+verify:duplicates) lolos bersih; live di browser (Playwright) — 10 kartu topik tampil, Kenalan/Latihan Inti/Tantangan semua render normal, "💡 Petunjuk" mengungkap terjemahan, 0 JS error.

**🎉 Reading sekarang TUNTAS ≥10 topik di SEMUA 6 level** (Little Stars/Starter/Explorer/Adventurer/Achiever 10/10, Trailblazer target-khusus 5/5 tercapai) — skill KEDUA (setelah Vocabulary) yang mencapai status ini secara utuh di seluruh tangga level.

### 16.24 Reading Trailblazer Digenapkan 5→10 Topik + Audit Konten Existing (permintaan user: "apakah bisa tambah 5 materi untuk level trailblazer dan audit juga materi saat ini apakah sudah relevan?")

Detail teknis penuh: CLAUDE.md § "Reading — 3 Format Berdampingan" poin 1 & `materi/reading.md` §18 (tidak diulang semua di sini).

Audit terhadap 5 topik existing (dibaca ulang penuh + `grep` sistematis) menemukan gap nyata: dokumentasi desain topik mengklaim ciri pembeda B1 dari Achiever adalah "konektor however/although/instead", tapi korpus aktualnya 0× memakai "however"/"although" sama sekali — cuma "but" (konektor dasar A1) dan "instead". Diperbaiki: 3 dari 5 topik lama direvisi ringan (1 kata sambung diganti per topik, makna & opsi jawaban tidak berubah) supaya benar-benar menyumbang variasi konektor B1.

Riset (WebSearch, tema resmi Cambridge B1 Preliminary/PET untuk remaja) mengonfirmasi tema sports & fitness, art, food & cooking, friends & parties, money & saving belum tersentuh 5 topik lama — 5 topik baru dipetakan ke situ (`seleksi-tim-basket`, `pameran-seni-sekolah`, `kelas-memasak-mingguan`, `pesta-kejutan-sahabat`, `menabung-untuk-sepeda`), ditulis dengan konektor B1 genuine sejak awal (bukan retrofit) plus struktur kalimat lebih kompleks (klausa relatif, klausa konsesif). Total korpus 10 topik sekarang punya 9× "however", 8× "although", 3× "even though".

Deviasi sadar dari target baku Trailblazer (≥5) — user eksplisit minta tambahan, preseden sama dengan Listening & Grammar Trailblazer yang juga sudah dibangun ke 10/10 penuh atas permintaan eksplisit sebelumnya.

Diverifikasi: `npm run build` lolos bersih; live di browser (Playwright) — 10 kartu topik tampil, Kenalan/Latihan Inti render normal, 0 JS error.

**Reading Trailblazer sekarang 10/10 topik** (melebihi target baku ≥5) — konsisten dengan Listening & Grammar Trailblazer.

---

## 17. Papan Peringkat XP (Leaderboard) — Revisi §4.6, Dibolehkan Karena Progres Sudah di Database

Permintaan user langsung ("untuk game ini ada leaderboard nya karena di simpan di database... yuk implementasi satu persatu") — pembalikan sadar dari keputusan §4.6/§13 yang sejak awal proyek eksplisit menolak leaderboard demi menghindari kecemasan sosial anak. **Alasan kenapa sekarang boleh**: dua prasyarat yang membuat larangan lama relevan sudah berubah — (1) progres kini tersimpan di database (`portal/` `ChildProgressState`, bukan cuma localStorage per perangkat), dan (2) login sudah jadi **gerbang wajib** (revisi terpisah, di luar scope dokumen ini — lihat `app/src/app.ts` `render()`), jadi setiap anak yang memakai app pasti punya identitas akun untuk dibandingkan. Riset kompetitor/lembaga yang dikumpulkan di `materi/game.md` (§3/§5) dipakai untuk memastikan fiturnya tetap aman secara psikologis, bukan sekadar meniru leaderboard Duolingo/Kahoot mentah-mentah.

**Keputusan desain (dikonfirmasi eksplisit ke user via 3 pertanyaan sebelum implementasi)**:

1. **Dianonimkan total** — leaderboard cuma menampilkan **avatar hewan** (1 dari 12 emoji tetap, `ANIMAL_AVATARS`, TIDAK PERNAH foto/nama asli) + **XP total** (akumulasi Belajar + Tantangan Bos + Game Hub, angka yang sama dengan §12.4). **SENGAJA tidak menampilkan `nickname`/`Store.name`** sekalipun field itu secara teknis terpisah dari nama asli di `ChildProfile` — alasannya field itu teks bebas yang ANAK isi sendiri (dipakai jadi sapaan "Hi {name}" di header) dan berisiko memuat nama asli kalau anak menuliskannya sendiri di sana. Anonimitas leaderboard harus berdiri di atas field yang STRUKTURAL aman (avatar dari set tetap), bukan konvensi/harapan bahwa anak tidak akan menulis nama asli di kolom bebas.
2. **Tanpa ranking eksplisit per anak** — TIDAK ada "kamu peringkat #4.532 dari 10.000" atau semacamnya. Cuma daftar **Top 10** (posisi 1–10 dgn medali 🥇🥈🥉 buat 3 besar, dekoratif) yang berfungsi sbg "hall of fame" aspirasional, BUKAN pembanding langsung "kamu vs anak lain" yang eksplisit. Anak tidak pernah tahu di mana posisi dirinya sendiri dalam daftar itu (dan sistem tidak berusaha mendeteksinya) — cukup melihat XP-nya sendiri di panel Progresmu (sudah ada, §12.4) secara terpisah.
3. **Metrik: XP total** (bukan skor Game Hub saja, atau jumlah Bos ditaklukkan, atau streak) — dipilih user krn ini angka pertumbuhan yang sudah eksis & sudah non-punitive by design (cuma naik, §12.4).

**Implementasi** (permintaan user "satu persatu" — leaderboard dikerjakan duluan dari daftar kandidat mekanik baru `materi/game.md` §7):
- **Backend** — `portal/app/api/leaderboard/route.ts` (BARU), GET saja, wajib login (`getSessionParentId`, konsisten semua route lain). Query `ChildProgressState` (`xp > 0`, `ORDER BY xp DESC`, `LIMIT 10`), `SELECT avatar, xp` saja (tidak pernah `nickname`/`childId`/field lain). **Tidak butuh migrasi skema** — `avatar` & `xp` sudah ada di `ChildProgressState` sejak desain sync progres (TRD.md), leaderboard ini murni endpoint baca baru di atas data yang sudah ada.
- **Frontend** — `app/src/account.ts` (`refreshLeaderboard`/`getCachedLeaderboard`, pola sama persis `refreshChildStatus`) + `app/src/app.ts` (`buildLeaderboardCard`, dipakai Beranda & Rapor, sama pola `buildProgressPanel`/`buildDailyCard`) — kartu disembunyikan total (bukan kartu kosong) kalau belum ada data/list kosong, konsisten §4.6 "state kosong tidak ditampilkan mencolok".
- Karena login sekarang gerbang wajib (lihat catatan di atas), `renderHome`/`renderRapor` TIDAK PERNAH dirender untuk anak yang belum login — jadi kartu ini tidak perlu cabang "belum login" sama sekali, cukup cabang "belum ada data" yang sudah ditangani `buildPlacementResultCard` dkk.

**Yang TETAP tidak berubah dari §4.6**: coin/mata uang tetap dilarang, akurasi/streak tetap tidak pernah menggerbang progres, tidak ada framing "kalah" di mana pun pada fitur ini.
