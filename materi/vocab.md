# Materi Vocabulary — Analisis, Riset, & Roadmap per Level

Status: **SEMUA 6 LEVEL DIIMPLEMENTASIKAN** — Little Stars 12 topik, Starter 10 topik, Explorer 10 topik, Adventurer 13 topik, Achiever 10 topik (semua × 10 kata), Trailblazer **10** topik × 10 kata (target baku ≥5 sudah TERCAPAI sejak §3F.4/§3F.5, lalu MELEBIHI target ke 10 atas permintaan eksplisit sesi §3F.6 — preseden sama dgn Grammar/Listening Trailblazer). Vocabulary skill kini py materi nyata di seluruh tangga level — sesi berikutnya (kalau ada) bergeser ke skill lain (Listening/Speaking/Grammar/Reading), lihat §6.
Terakhir diupdate: 2026-08-26

> Dokumen ini fokus pada SATU skill: **Vocabulary**. Konteks wajib dibaca dulu: [CLAUDE.md](../CLAUDE.md) (filter kid-friendly wajib, aturan format Vocab, target kelengkapan konten), [PRD.md](../PRD.md) §3 (sistem level), §4 (struktur materi & loop aktivitas), §15.1/§15.6 (konten per level & format Vocab yang sudah dikunci), §16 (revisi status Little Stars/Starter), [RESEARCH.md](../RESEARCH.md) §3–§4 (leveling institusi), §11 (kompetitor aplikasi).

> ## 🔧 Koreksi Audit (2026-08-22)
>
> Audit lintas-sesi (baca ulang 57 topik langsung dari `content.ts` + verifikasi ulang PDF Cambridge resmi + riset baru lembaga Indonesia/internasional) menemukan beberapa hal yang perlu diluruskan dari narasi §3D.2/§3E di bawah — bukan menghapus riwayat keputusan, cuma mengoreksi klaim sumbernya:
>
> 1. **PDF `506886-a2-key-2020-vocabulary-list.pdf` yang jadi rujukan §3D.2/§3E untuk kategori "Characteristics" & "Acts" ternyata bukan A2 Flyers** — sampulnya sendiri bertuliskan "A2 Key / A2 Key for Schools", exam Cambridge yang terpisah dari jalur Young Learners (Starters→Movers→Flyers). **"Characteristics" dan "Acts" BUKAN nama kategori resmi Cambridge YLE** (20 kategori resmi Movers/Flyers: Animals, Body & face, Clothes, Colours, Family & friends, Food & drink, Health, Home, Materials, Names, Numbers, Places & directions, School, Sports & leisure, Time, Toys, Transport, Weather, Work, World around us — tidak ada "Characteristics"/"Acts") — dua label itu tampaknya ikut struktur A2 Key, bukan A2 Flyers. **"Materials" dan "The world around us" (dipakai Adventurer §3D.2/§5D) TETAP kategori Flyers resmi yang valid, tidak terdampak.** Kata-kata yang sudah dipilih untuk Achiever kemungkinan besar tetap wajar (A2 Key & Flyers tumpang tindih berat vocab-nya), tapi klaim "dipetakan dari residual A2 Flyers" perlu dibaca sbg "A2 Key" untuk kategori Characteristics/Acts secara spesifik.
> 2. **Semua angka jumlah kata per kategori** (mis. "School 49 kata", "Places and Directions 57 kata" di §3B.2/§3C.2/§3D.2) **tidak pernah dicetak di dokumen resmi Cambridge manapun** — PDF resmi "Starters Movers Flyers Wordlists" (hal. 38–43) memang punya tabel tematik ~20 kategori, tapi TANPA satu angka pun. Semua angka di atas berasal dari blog pihak ketiga (azvocab.ai) yang tidak mempublikasikan metodologinya — spot-check langsung: kategori resmi "Places & directions" A1 Movers cuma ±29 kata di tabel Cambridge, bukan 57. Perlakukan angka-angka itu sbg estimasi tak terverifikasi, bukan fakta resmi.
> 3. **Sebaliknya, sumber B1 Preliminary (§3F.2, dasar Trailblazer) tetap solid** — PDF resminya (edisi Agustus 2025) eksplisit menyatakan "All the words in the Topic Lists headings now appear on the wordlist," dan 2 topik Trailblazer ("Language", "Travel and Transport") memang nama kategori resmi di situ. Tidak ada koreksi di bagian ini.
> 4. **3 kata diganti di `content.ts` menyusul audit ini** (duplikat lintas topik yang tidak disengaja): Starter `di-sekolah` "Teacher" → **"Coach" (Pelatih)** (identik dgn Adventurer `pekerjaan`); Starter `barang-di-rumah` "Clock" → **"Broom" (Sapu)** (identik dgn Adventurer `alat-sekolah`); Achiever `mata-pelajaran` "Biology"/"Chemistry" → **"Social Studies" (IPS)** / **"Civics" (PPKn)** (bukan bersumber wordlist Cambridge manapun, dan di kurikulum Indonesia baru jadi mapel berdiri sendiri di SMP — agak maju utk ujung bawah Achiever 11 th yang masih SD kelas 6, sesuai temuan urutan bab resmi Kurikulum Merdeka Kelas 6 yang masih 100% tata bahasa tense, belum mapel sains terpisah).

---

> ## 🔒 Filter Kid-Friendly Berlaku Penuh di Dokumen Ini
>
> Referensi riset di bawah (Cambridge YLE, Pearson GSE, EF, Kumon, Wall Street English, kompetitor app dewasa `inggrisinyuk`, dst) **tidak semuanya dibuat dengan filosofi produk ini**. Yang diambil murni *struktur* (daftar tema, wordlist resmi, jumlah kata per tema, mekanik mini-game) — nada, bahasa, dan tingkat tekanan tetap disaring lewat pertanyaan "apakah ini masuk akal untuk anak usia segini?", bukan diasumsikan cocok karena terbukti di produk lain (CLAUDE.md §1).

---

## 0. Kenapa Format & Alur Vocabulary SAMA di Semua Level, tapi Kontennya Beda-beda? (SENGAJA)

Pertanyaan yang sama seperti di [materi/listening.md §0](listening.md) ("kenapa beda-beda per level?"), tapi jawabannya KEBALIKAN dari Listening. Listening py 4 FORMAT soal beda per level (§0 dokumen itu) — Vocab **TIDAK**: satu mekanik yang SAMA PERSIS (Kenalan 🔊🎤🎮 per kata → Latihan Inti 10 soal 4-tipe → Tantangan 3-tab Eja Kata/Susun Kalimat/Penggunaan) dipakai apa adanya di SEMUA 6 level, nol percabangan per-level di `games/vocabulary.ts` (CLAUDE.md "Format Wajib Materi Vocabulary (Semua Level)"). Yang beda-beda per level BUKAN bentuk soal, tapi **TIER WORDLIST** — kosakata makin sulit mengikuti SATU tangga CEFR/Cambridge yang naik terus, dikonfirmasi riset per-level SEBELUM tiap topik ditambahkan (§3A–§3F):

| Level | Tier wordlist | Topik | Kata/topik | Kenapa tier ini |
|---|---|---|---|---|
| Little Stars (3–5 th) | Di luar CEFR — Early Years (§3A.1) | 12 | 10 | Cambridge YLE resmi baru mulai usia 6 th, tidak ada produk resmi utk 3–5 th; fokus exposure/play, bukan pengukuran proficiency |
| Starter (5–7 th) | Cambridge Pre A1 Starters (§3B.2) | 10 | 10 | Persis di ambang bawah exam resmi YLE pertama |
| Explorer (7–9 th) | Cambridge A1 Movers, topik baru (§3C.1) | 10 | 10 | PRD §3 tandai Explorer "transisi ke A1" — dorong ke atas, bukan mengulang tingkat Starter |
| Adventurer (9–11 th) | Cambridge A2 Flyers, porsi kecil sengaja (§3D.1) | 13 | 10 | Wordlist A1 Movers SUDAH HABIS dipakai 4 level lain — terpaksa naik 1 tingkat, tapi disisakan besar-besaran utk Achiever |
| Achiever (11–13 th) | Cambridge A2 Flyers, kategori residual besar (§3E.1) | 10 | 10 | PRD §3 tandai Achiever = A2 Flyers resmi; lanjutkan sisa kategori yg Adventurer sengaja tidak habiskan |
| Trailblazer (12+ th) | Cambridge B1 Preliminary/PET (§3F.2) | 10 (target baku ≥5, dilebihi atas instruksi eksplisit §3F.6) | 10 | PRD §9 kunci scope kecil sengaja ("jalur bonus" berbasis usia 12+, bukan tangga linear progres) |

**Prinsip intinya**: progresi Vocab naik SATU sumbu (tier wordlist Cambridge, kata makin abstrak/sulit) — BEDA dari Listening yang naik DUA sumbu sekaligus (task-shape kognitif + tier wordlist). Ini konsisten dengan tagline Vocab "Kenal kata baru" (PRD §4.1, CLAUDE.md §4.1) — objektifnya SAMA di semua level (anak tahu arti sebuah kata, dua arah EN↔ID), jadi mekaniknya boleh, dan seharusnya, tetap satu. Skill "kenal kata" tidak punya sub-tingkat kognitif seperti Listening ("dengar 1 kalimat" vs "paham dialog+inferensi") — maka format berjenjang seperti Listening/Speaking/Grammar justru akan menambah kerumitan implementasi TANPA manfaat pedagogis baru di sini.

**Dikunci eksplisit**: CLAUDE.md "Format Wajib Materi Vocabulary (Semua Level)" TIDAK punya klausul "boleh beda per level" seperti Listening/Speaking/Grammar — mekaniknya generik dan otomatis berlaku ke topik baru di level manapun tanpa perubahan kode (dibuktikan tiap sesi topik baru ditambahkan §5A–§5F, nol baris kode game diubah, murni kerja data). Kalau nanti ada usulan "Vocab level X soalnya perlu beda dari level lain" (mis. krn kontennya lebih abstrak), itu keputusan produk BARU yang perlu ditanyakan eksplisit ke user dulu — bukan default seperti Listening/Speaking/Grammar yang memang dirancang berjenjang format sejak awal.

---

## 1. Ringkasan (TL;DR)

- **Kondisi sebelum dokumen ini ditulis**: Vocabulary punya materi nyata di 2 level — Explorer (3 topik/30 kata, belum penuhi target CLAUDE.md 10 topik/skill) dan Adventurer (10 topik/100 kata, sudah penuhi target). Little Stars, Starter, Achiever, Trailblazer semua `hasContent:false`.
- **Mekanik Vocab (Kenalan → Latihan Inti → Tantangan) sudah generik & matang** (`app/src/games/vocabulary.ts`) — menambah level baru cuma butuh *data* (topik+kata baru di `content.ts`), bukan kode baru. Ini yang bikin authoring tiap level di dokumen ini murni kerja riset+konten.
- **Sesi 1 — Little Stars (3–5 th)**: riset (§3A) mengonfirmasi level ini genuinely di luar tangga CEFR (Cambridge YLE termuda itu usia 6–12) — 12 topik/120 kata diimplementasi (§5A), tema dari riset kurikulum early-years lintas institusi (Lingokids, PAUD/TK Indonesia, ESL preschool umum, Khan Academy Kids/Endless Alphabet).
- **Sesi 2 — Starter (5–7 th, ≈Pre-A1)**: beda posisi dari Little Stars — sudah lama **"In scope (v1)"** (PRD §9) tapi paling lama belum diauthoring. Riset (§3B) menemukan wordlist RESMI Cambridge Pre A1 Starters (20 kategori) — 10 topik/100 kata diimplementasi (§5B), dipetakan langsung dari kategori itu + analisis kurikulum institusi lain (Kurikulum Merdeka Fase A, EF High Flyers, LIA/Kumon/Wall Street English, Duolingo ABC/Reading Eggs).
- **Sesi 3 — Explorer (7–9 th, ≈Pre-A1 → A1)**: beda lagi dari 2 sesi sebelumnya — Explorer SUDAH live sejak awal dengan 3 topik (`keluarga`/`angka`/`warna`, TIDAK diubah), tapi belum penuhi target CLAUDE.md ≥10 topik/skill. Riset (§3C) menemukan wordlist RESMI Cambridge **A1 Movers** (tingkat SETELAH Pre A1 Starters, sesuai posisi CEFR Explorer yang "→ A1") — 7 topik baru/70 kata ditambahkan (§5C), digenapkan jadi 10 topik/100 kata total, plus analisis Kurikulum Merdeka Fase B, Novakid/Cakap, dan riset ESL elementary umum.
- **Sesi 4 — Adventurer (9–11 th, ≈A1)**: beda lagi — Adventurer SUDAH penuhi target (10/10 topik) sebelum sesi ini, jadi tidak ada gap topik yang perlu ditutup. Riset (§3D) menemukan wordlist Cambridge **A1 Movers** (tingkat YLE resmi Adventurer, PRD §3) SUDAH HABIS TERPAKAI lintas 4 level lain begitu Explorer selesai — jadi 3 topik tambahan (§5D) SENGAJA loncat ke wordlist **A2 Flyers** (tingkat berikutnya), TAPI dijaga porsinya kecil (cuma 3 topik dari 20 kategori Flyers) supaya sebagian besar Flyers tetap tersisa utk sesi Achiever (level yang PRD §3 memang tandai transisi A1→A2) nanti.
- **Sesi 5 — Achiever (11–13 th, ≈A1→A2)**: mulai dari NOL (`hasContent:false`) — sama posisinya dgn Starter/Little Stars, beda dari Adventurer yang cuma digenapkan bonus. Riset (§3E) memakai LANGSUNG kategori Cambridge **A2 Flyers** yang sengaja disisakan sesi Adventurer (Characteristics 49 kata, Places and Directions 47 kata, Leisure 26 kata, Acts sisa >50 kata) — 10 topik/100 kata diimplementasi (§5E), ditambah 1 domain baru di luar wordlist Cambridge (Teknologi & Internet, muncul eksplisit dari riset ESL usia 11–13 & Kurikulum Merdeka Fase D), plus analisis Cambridge A2 Key for Schools (KET, exam SETELAH Flyers — dipakai sbg konfirmasi arah, bukan sumber topik krn Achiever belum di situ) dan EF Trailblazers/Novakid usia ini.
- **Sesi 6 — Trailblazer (12+ th, ≈B1, "jalur lanjutan")**: BEDA PALING BESAR dari 5 sesi sebelumnya — PRD §9 SUDAH mengunci level ini sbg "Next phase (low-effort, 1-2 modul preview)" SEBELUM inisiatif Vocabulary ini dimulai. Jadi target CLAUDE.md ≥10 topik/skill **SENGAJA TIDAK dipaksakan** di sini — 2 topik/20 kata (§5F) dipetakan dari kategori Cambridge **B1 Preliminary for Schools (PET)** yang genuinely baru (Travel & Tourism, Language & Communication — riset §3F).
- **Sesi lanjutan — Trailblazer digenapkan 2→5 topik**: permintaan user berikutnya ("research materi vocab yang sesuai dengan level trailblazer... research ke lembaga bahasa inggris... terutama dalam negri, buatkan minimal 5") — CLAUDE.md target Trailblazer sudah direvisi user dari "1-2 modul" ke "minimal 5 topik/skill" SEBELUM sesi ini. Riset ulang ke lembaga Indonesia (Kurikulum Merdeka Fase F, LIA, EF Trailblazers, §3F.4) mengonfirmasi ARAH (akademik-reflektif, critical-thinking/opini, presentasi/media) — 3 topik baru dipetakan dari residual tema PET yg paling match arah itu (§3F.5): `pendidikan-akademik`, `pendapat-pengalaman`, `hiburan-media`.
- **Sesi lanjutan lagi — Trailblazer digenapkan 5→10 topik**: permintaan user "tambahkan 5 materi vocab untuk level trailblazer" — deviasi SADAR di atas target baku ≥5 (bukan target baru, preseden sama Grammar/Listening Trailblazer). 5 topik baru (§3F.6): `layanan-masyarakat`, `peralatan-elektronik`, `bangunan-sekitar`, `pedesaan`, `presentasi-diskusi` — 4 dari tema PET residual yg sudah dicatat §3F.5, 1 diturunkan dari arah riset §3F.4. Audit paralel thd 5 topik EXISTING (permintaan user yg sama, "audit apakah 5 materi saat ini sudah sesuai") menemukan SEMUANYA sesuai — 0 pelanggaran struktural/mekanik/duplikat kalimat.
- **Total sekarang**: **SEMUA 6 LEVEL** punya materi Vocabulary nyata — **65 topik, ~650 kata** (setelah Trailblazer digenapkan lagi 5→10, §3F.6), 0 id topik bentrok (§7, sekarang dicek otomatis via `verify-vocab-content.mjs` — lihat §7).
- **Gap yang masih terbuka, dilaporkan jujur** (§6): SEMUA gap tersisa sekarang di LUAR skill Vocabulary — Listening Little Stars, Listening/Speaking/Grammar Starter, Listening/Speaking/Grammar/Reading Explorer/Adventurer/Achiever/Trailblazer yang belum ikut digenapkan. Vocabulary sendiri tuntas di 6 dari 6 level.

---

## 2. Analisis Mekanik Vocab (Evergreen — Berlaku Semua Level)

### 2.1 Status konten per level (diupdate tiap sesi)

| Level | Topik | Kata/topik | Total kata | Status vs target CLAUDE.md (≥10 topik/skill, ≥10 kata/topik) |
|---|---|---|---|---|
| Little Stars | 12 (`salam-sopan-santun`…`perasaanku`, §5A) | 10 | 120 | ✅ Melebihi target |
| Starter | 10 (`angka-11-20`…`hobi`, §5B) | 10 | 100 | ✅ Tepat target |
| Explorer | 10 (`keluarga`, `angka`, `warna` + 7 baru §5C) | 10 | 100 | ✅ Tepat target |
| Adventurer | 13 (`pekerjaan`…`perasaan` + 3 baru §5D) | 10 | 130 | ✅ Melebihi target |
| Achiever | 10 (`ciri-ciri-fisik`…`sifat-benda-lanjutan`, §5E) | 10 | 100 | ✅ Tepat target |
| Trailblazer | 10 (`perjalanan-wisata`…`presentasi-diskusi`, §5F) | 10 | 100 | ✅ Melebihi target baku (≥5) atas instruksi eksplisit §3F.6 |

### 2.2 Mekanik yang sudah dibangun (`app/src/games/vocabulary.ts`) — dipakai apa adanya di semua level

Loop 3 langkah `Kenalan → Latihan Inti → Tantangan` (PRD §4.3) sudah generik lintas topik/level, tidak ada logic khusus per level:

1. **Kenalan** (`renderKenalan`) — per kata: 🔊 dengar (TTS), 🎤 mic (`listenAndRecordOnce` + `wordMatchDetail`, skor proporsional + "▶️ Play Suaramu", CLAUDE.md §Speaking), 🎮 main (1 soal fokus kata itu). Plus "🎮 Main Semua Kata!" di bawah daftar (3 soal acak topik). Tipe soal mini-game dipilih otomatis dari **bentuk topik** (`isNumberTopic()` — cek semua `item.en` ada di `NUMBER_WORDS`, sampai `'twenty'`): topik Angka → hitung gambar + pilihan kata Inggris (diverifikasi tetap jalan mulus untuk Angka 11–20 Starter — emoji diulang sampai 16–20× di soal hitung, visual padat tapi tidak error, §7); topik lain → "Apa bahasa Inggrisnya '[kata Indonesia]'?" + pilihan teks.
2. **Latihan Inti** (`runLatihanInti`) — SELALU 10 soal (`LATIHAN_ROUND_SIZE`, `buildLatihanOrder` mengulang pool kalau topik < 10 kata), 2 tipe soal berselang-seling per kata (`'audio'`: TTS+tap emoji; `'sentence'`: kalimat `item.example.en` dengan kata target di-blank via regex `\b<kata>\b`, pilihan teks). Hint "💡 Petunjuk" 50/50 sekali pakai per soal.
3. **Tantangan** (`runTantangan`, 2 tab bisa dibuka bebas) — **Eja Kata** (`runEjaKata`, susun huruf `item.en` dari chip acak, reveal jawaban otomatis setelah 2× salah — diverifikasi jalan mulus utk kata 8+ huruf, mis. "NEIGHBOR" di topik Starter `orang-di-sekitarku`, §7) dan **Contoh Penggunaan** (`runContohPenggunaan`: `drawUcap` mic ke `item.example.en` dengan skor proporsional, lalu `drawSusun` susun kata Inggris dari terjemahan `item.example.id`). Sengaja **tanpa hint** (beda dari Latihan Inti).
4. Semua titik jawaban pakai `roundActionsHtml()` — tombol "🔁 Coba Lagi"/"➡️ Lanjut" eksplisit, tidak ada auto-advance timer. Progres per-soal tersimpan lewat `ensureSection`/`markSlotAnswered` (`progress.ts`), navigasi antar soal bebas lompat (`quizNavHtml`).

**Implikasi buat authoring konten baru** (kenapa ini penting dibaca sebelum menambah topik level manapun):

- `item.example.en` **WAJIB memuat `item.en` persis sebagai whole word** (case-insensitive) — kalau tidak, `blankSentence()` (Latihan Inti tipe `'sentence'`) gagal nge-blank apa pun dan soalnya rusak diam-diam (tidak error, cuma kalimatnya utuh tanpa titik kosong). **Jebakan konkret yang ditemukan saat authoring Starter**: target kata TUNGGAL (mis. `"Twin"`) tapi draf kalimat contoh awal pakai bentuk JAMAK (`"They are twins."`) — regex `\btwin\b` TIDAK match `"twins"` (huruf `s` bikin tidak ada word-boundary setelah `n`). Diperbaiki jadi `"This is my twin."` sebelum commit. Ini kenapa skrip verifikasi (§7) WAJIB dijalankan tiap kali nambah topik, bukan cuma dibaca manual.
- **Id topik BUKAN di-namespace per level.** Progress tersimpan di key `${skill}:${topicId}:${section}` (`progress.ts:279,310` — `tag`/`sectionKey`), TANPA level. Kalau dua level pakai id topik yang sama persis, progres salah satu ketimpa/ketuker punya level lain. Topik Little Stars & Starter di §5A/§5B sengaja dikasih id BEDA dari Explorer/Adventurer meski temanya kadang mirip (`keluargaku` bukan `keluarga`, `tubuhku` bukan `anggota-tubuh`, dst) — daftar lengkap id yang SUDAH dipakai ada di §5A/§5B, cek sebelum menambah topik baru di level manapun berikutnya.
- `item.en` boleh multi-kata (spasi), sudah dipakai di Adventurer (`'Police Officer'`, `'Living Room'`) dan Starter (`'Ice Cream'`, `'Best Friend'`) — Eja Kata memperlakukan spasi sebagai satu chip tersendiri, tidak error.
- Menambah level baru **tidak butuh kode baru** di `games/boss.ts` (`poolFor()` sudah fallback ke pool Explorer kalau skill tertentu masih kosong di level itu) maupun `app.ts` (`visibleSkillKeys()` sudah otomatis sembunyikan kartu skill kosong) — SELAMA cuma menambah entri baru ke `*_TOPICS_BY_LEVEL`, bukan mengubah tipe/kontrak.
- **Kalau level baru ADA di `PlacementLevelKey`** (`portal/lib/placement-test-data.ts` — saat ini `'starter' | 'explorer' | 'adventurer'`), `CONTENT_AVAILABLE` di `portal/lib/placement-scoring.ts` WAJIB diupdate juga (dilakukan utk Starter di §5B, TIDAK berlaku utk Little Stars yang di luar tangga placement test sama sekali — lihat §4 poin 3 di bawah).

---

## 3A. Riset: Materi yang Tepat untuk Little Stars (3–5 th)

Riset web dilakukan eksplisit untuk dokumen ini (bukan diasumsikan dari pengetahuan umum).

### 3A.1 Little Stars genuinely di luar tangga CEFR — bukan "starter dari starter"

Pencarian utk vocabulary list "Cambridge Pre-Starters usia 3–5" balik dengan temuan penting: **level termuda Cambridge YLE (Pre A1 Starters) itu untuk usia 6–12 tahun, bukan 3–5**. Tidak ada produk YLE resmi untuk di bawah usia 6. Ini konsisten dengan riset internal yang sudah ada di [RESEARCH.md §3.4](../RESEARCH.md#34-british-council--panduan-usia-ke-cefr-bukan-level-formal): British Council punya produk **terpisah** untuk usia 2–6 th ("Learning Time with Timmy", kategori "Early Years") yang **sengaja tanpa label CEFR** karena fokusnya paparan bahasa (exposure), bukan pengukuran proficiency. Dua sumber independen (Cambridge + British Council) sama-sama menegaskan: usia 3–5 butuh materi sendiri yang dirancang untuk *exposure/play*, bukan versi "gampangan" dari materi anak SD.

### 3A.2 Apa isi kurikulum early-years yang nyata dipakai (Lingokids, PAUD/TK Indonesia, ESL preschool umum)

| Sumber | Temuan kunci |
|---|---|
| **Lingokids** (app kompetitor, usia 2–8, sudah masuk PRD §2) | Kurikulum 60 topik, **5–10 kata/topik**. Tema eksplisit: transport, kamar mandi, serangga, reptil, jam makan, kebun, sayur, sekolah, memanggang, kendaraan, hewan safari, hewan peliharaan, keluarga, mainan. Modul "Preschool Readiness" terpisah: 2D shapes, hitung 1–10, warna, huruf kecil. |
| **PAUD/TK Indonesia** (riset bahasa Indonesia) | Kurikulum tematik terintegrasi. Tema inti yang disebut eksplisit: **anggota keluarga, warna, hewan, salam**. Metode andalan: lagu "Head, Shoulders, Knees, and Toes" untuk anggota tubuh. Anak diharapkan merespons instruksi sederhana dan frasa salam ("Hello", "Good morning", "Goodbye"). |
| **EF "Small Stars"** (usia 3–6, sudah masuk RESEARCH §3.5) | Kurikulum mencakup vocab+listening+speaking dasar, detail topik per unit tidak dipublikasikan terbuka — dipakai sebagai konfirmasi rentang usia band saja. |
| **Riset ESL preschool umum** (multi-sumber TEFL/ESL) | Tema yang **selalu direkomendasikan lebih dulu**: **"greetings & basic politeness"** — baru setelah itu family/animals/transportation/colors/shapes/clothing/food. Metodologi 3–4 th: **action-based** (games, lagu, gerak), bukan storytelling/roleplay. |
| **Khan Academy Kids & Endless Alphabet** (kompetitor, PRD §2/RESEARCH §11.1) | Endless Alphabet — anak **≤5 tahun** menyusun kata lewat **drag potongan huruf**, tiap huruf berbunyi saat ditempatkan. Ini memvalidasi mekanik **Eja Kata** yang sudah ada (`runEjaKata`) memang cocok dipakai apa adanya untuk usia 5 tahun ke bawah. |

### 3A.3 Insight yang mengubah rencana awal

Draf topik pertama (sebelum riset) langsung lompat ke Warna/Angka/Bentuk sebagai topik #1. Riset "greetings & basic politeness selalu direkomendasikan LEBIH DULU" mengubah urutan: **Salam & Sopan Santun jadi topik #1**. Alasan tambahan spesifik app ini: **Little Stars belum punya skill Speaking** (PRD §4.1), jadi frasa fungsional (Hello/Please/Thank You/dst) di level ini **harus** ditampung di Vocabulary supaya tidak hilang dari kurikulum level ini sama sekali.

---

## 3B. Riset: Materi yang Tepat untuk Starter (5–7 th, ≈Pre-A1)

Riset web terpisah untuk sesi ini — enam pencarian baru, plus fetch langsung wordlist resmi Cambridge.

### 3B.1 Starter = "pra-Starters", pas di depan gerbang ujian resmi Cambridge

Beda dari Little Stars, Starter *nyaris* masuk tangga CEFR resmi — PRD §3 sudah menandai "(pra-Starters)" sebagai YLE terdekat. Riset mengonfirmasi ini: **Cambridge Pre A1 Starters itu untuk usia 6–12** (sama seperti temuan §3A.1), dan Starter (5–7 th) tepat di ambang bawahnya. Konsekuensinya beda dari Little Stars: alih-alih riset tema preschool umum, topik Starter **dipetakan langsung dari wordlist RESMI Cambridge Pre A1 Starters**.

### 3B.2 Wordlist resmi Cambridge Pre A1 Starters — 20 kategori

Cambridge Pre A1 Starters (bagian dari YLE, ~500 kata resmi) diorganisasi jadi 20 kategori topik (diambil dari analisis wordlist Cambridge oleh azvocab.ai, jumlah kata resmi per kategori disebut eksplisit):

| Kategori Cambridge | Jml kata | Dipetakan ke topik Starter (app ini) |
|---|---|---|
| School | 49 | `di-sekolah` (sudut orang/tempat, beda dari alat tulis Adventurer) |
| Grammar | 62 | *(bukan Vocabulary — domain skill Grammar, PRD §4.2)* |
| The Home | 46 | `barang-di-rumah` (sudut perabotan, beda dari nama ruangan Adventurer) |
| Food & Drink | 45 | `makanan-favoritku` (sudut makanan anak-populer, beda dari makanan pokok Adventurer) |
| Animals | 32 | `serangga` (sudut serangga/makhluk kecil, beda dari pets/farm Little Stars & wild/zoo Adventurer) |
| Leisure | 32 | `hobi` |
| Family & Friends | 30 | `orang-di-sekitarku` (sudut orang di luar keluarga inti, beda dari `keluarga`/`keluargaku`) |
| Names | 24 | *(nama orang generik — tidak relevan sbg materi vocab bergambar)* |
| Expression | 25 | *(frasa/ekspresi — sebagian sudah tercakup Little Stars `salam-sopan-santun`)* |
| Numbers | 21 | `angka-11-20` (lanjutan progresif dari Little Stars/Explorer 1–10) |
| Sports | 21 | *(sudah tercakup penuh Adventurer `olahraga`)* |
| Places and Directions | 21 | `tempat-di-sekitar` (kategori BARU, belum disentuh level manapun) |
| Transport | 17 | *(sudah tercakup Little Stars `kendaraan` + Adventurer `transportasi`)* |
| The Body and Face | 15 | *(sudah tercakup Little Stars `tubuhku` + Adventurer `anggota-tubuh`)* |
| Colours | 14 | *(sudah tercakup Little Stars `kenal-warna` + Explorer `warna`)* |
| Time | 12 | `hari-dalam-seminggu` |
| The World Around Us | 7 | `alam-sekitar` (kategori BARU) |
| Toys | 7 | *(sudah tercakup Little Stars `mainan`)* |
| Feelings | 6 | *(sudah tercakup Little Stars `perasaanku` + Adventurer `perasaan`)* |
| Others | 6 | *(kata fungsi/preposisi — domain Grammar, bukan Vocabulary)* |

**Keputusan eksplisit dari tabel ini**: 10 kategori dipilih jadi topik Starter — 5 kategori BARU yang belum pernah disentuh level manapun (School-angle-baru, Home-angle-baru, Food-angle-baru, Places&Directions, Time, World-Around-Us — sebenarnya 6, dihitung dari baris "Dipetakan ke") dan Numbers sebagai **lanjutan progresif** (11–20, bukan pengulangan 1–10). 6 kategori Cambridge yang SUDAH tercakup penuh di level lain (Sports, Transport, Body, Colours, Toys, Feelings) **sengaja dilewati** — bukan berarti tidak resmi, tapi supaya Starter genuinely menambah kosakata baru, bukan duplikasi kata yang sama persis di level berbeda. 2 kategori (Grammar, Others/prepositions) di luar domain Vocabulary sama sekali (masuk skill Grammar, PRD §4.2). Names tidak dipetakan (nama generik tidak cocok jadi materi bergambar).

### 3B.3 Kurikulum & lembaga lain — dalam & luar negeri (usia 5–8 th)

| Sumber | Tipe | Temuan kunci |
|---|---|---|
| **Kurikulum Merdeka Fase A** (Kemendikbudristek, kelas 1–2 SD, ~6–8 th) | Kurikulum nasional Indonesia | Bahasa Inggris **belum wajib formal** di Fase A — fokus paparan lisan (listening+speaking), belum menekankan baca-tulis. Kosakata dasar: angka, warna, benda sehari-hari, lewat permainan & lagu. Ini menguatkan keputusan app: Starter TIDAK perlu materi baca-tulis berat, sejalan dgn loop TTS-first yang sudah ada. |
| **EF "High Flyers"** (usia 6–10, RESEARCH §3.5) | Kursus swasta internasional, cabang Indonesia | 5 level, kurikulum communicative method (listening/speaking/reading/writing), flashcard+phonics+game+song. Konfirmasi rentang usia band, bukan sumber daftar topik detail (materi proprietary tidak dipublikasikan). |
| **LIA — Program GEYL** (usia 7–12) | Kursus swasta lokal tertua (1959) | Metode **Total Physical Response (TPR)** + storytelling + roleplay + menulis, eksplisit fokus **membangun literasi** — beda dari Little Stars yang murni lisan/bermain. Sejalan dgn posisi Starter sbg jembatan menuju Explorer (yang sudah py mekanik teks/pilihan-ganda-teks lebih berat). |
| **Kumon** (mulai usia 6, sistem worksheet) | Kursus swasta lokal, metode drill terstruktur | Progresi eksplisit: alfabet → kata → kalimat → paragraf → bacaan panjang (level lebih tinggi). Konfirmasi arah pedagogis yang sama dgn keputusan produk (progresi bertahap dari kata tunggal), TAPI metode drill/worksheet Kumon **tidak diadopsi** — bentrok dgn filosofi non-punitive (CLAUDE.md), app ini tetap game-based bukan lembar-kerja. |
| **Wall Street English (WSE) Kids** | Kursus swasta internasional | Materi berbasis teknologi, tidak ada detail kurikulum usia dini terbuka — dipakai sbg konfirmasi lanskap kompetitor semata. |
| **Duolingo ABC & Reading Eggs** (app literasi, usia 3–7) | App kompetitor (native literacy, bukan ESL — PRD §2/RESEARCH §11.1) | Kurikulum terstruktur: phonics → sight words → vocabulary → comprehension, ratusan aktivitas bite-sized. Relevan sbg validasi arah (bukan sumber tema): app ini BUKAN app literasi huruf (beda tujuan dari Duolingo ABC), tapi progresi "kata tunggal dulu, baru struktur" yang sama tetap relevan sbg prinsip umum urutan kesulitan. |

**Insight lintas sumber**: baik kurikulum nasional (Kurikulum Merdeka Fase A) maupun kursus swasta (EF, LIA) sama-sama menegaskan usia 5–7/8 th itu transisi dari "lisan murni" (Little Stars) ke "mulai ada literasi ringan" (Explorer ke atas) — TIDAK ada satu pun sumber yang menyarankan lompat langsung ke baca-tulis berat di usia ini. Ini membenarkan keputusan tidak mengubah mekanik game sama sekali untuk Starter (§2.2) — loop TTS-first + pilihan-ganda yang sudah ada sudah pas untuk transisi ini, cukup kontennya yang perlu progresif (kata makin panjang/abstrak: `Neighbor`, `Yesterday`, `Collecting` — dibanding kata Little Stars yang semua ≤7 huruf).

---

## 3C. Riset: Materi yang Tepat untuk Explorer (7–9 th, ≈Pre-A1 → A1)

Riset web terpisah lagi untuk sesi ini — lima pencarian baru, plus fetch langsung wordlist resmi Cambridge A1 Movers.

### 3C.1 Explorer naik satu tingkat CEFR dari Starter — bukan lagi "pra-Starters"

Beda dari Starter yang persis di ambang bawah Cambridge Pre A1 Starters, PRD §3 sudah menandai Explorer sbg "Pre A1 Starters" langsung (bukan lagi "pra-") dengan CEFR target "≈ Pre-A1 → A1" — artinya Explorer levelnya sendiri sedang *transisi ke atas*, menuju tingkat YLE BERIKUTNYA: **A1 Movers**. Konsekuensinya: topik BARU Explorer (7 topik tambahan, §5C) dipetakan dari wordlist A1 Movers (bukan Pre A1 Starters lagi seperti Starter) — supaya konten level ini genuinely mendorong anak ke arah A1, bukan mengulang tingkat Starter dengan kata berbeda.

### 3C.2 Wordlist resmi Cambridge A1 Movers — 20 kategori

A1 Movers (tingkat KEDUA YLE, ~400 kata resmi, CEFR A1) juga diorganisasi jadi 20 kategori (analisis wordlist Cambridge oleh azvocab.ai, halaman kategori "Movers"):

| Kategori Cambridge A1 Movers | Jml kata | Dipetakan ke topik Explorer BARU (app ini) |
|---|---|---|
| Places and Directions | 57 | *(sebagian sudah tercakup Starter `tempat-di-sekitar`; sisanya diarahkan ke `belanja-uang` — tempat belanja & transaksi)* |
| Characteristics | 47 | `kata-sifat` (kategori BARU, belum disentuh level manapun — kata sifat/lawan kata) |
| Grammar | 32 | *(bukan Vocabulary — domain skill Grammar, PRD §4.2)* |
| Time | 30 | `waktu-harian` (beda sudut dari `hari-dalam-seminggu` Starter — pagi/siang/sore/malam + kalender bulan/tahun) |
| Others | 24 | *(kata fungsi — domain Grammar)* |
| Numbers | 22 | *(sudah tercakup Little Stars/Explorer 1–10 + Starter 11–20 — tidak diulang lagi)* |
| Food & drink | 21 | *(sudah tercakup Adventurer `makanan` + Starter `makanan-favoritku`)* |
| The world around us | 20 | `negara` (sudut geografi/negara — kategori BARU) |
| Leisure | 19 | `pesta-perayaan` (sudut pesta, beda dari `hobi` Starter yang sudut aktivitas) |
| Work | 19 | *(sudah tercakup Adventurer `pekerjaan`)* |
| Health | 18 | `kesehatan` (kategori BARU, belum disentuh level manapun) |
| Sports | 16 | *(sudah tercakup Adventurer `olahraga`)* |
| Names | 15 | *(nama generik — tidak relevan sbg materi vocab bergambar, sama seperti alasan Starter §3B.2)* |
| Transport | 14 | *(sudah tercakup Little Stars `kendaraan` + Adventurer `transportasi`)* |
| Weather | 14 | *(sudah tercakup Adventurer `cuaca`)* |
| The body and the face | 13 | *(sudah tercakup Little Stars `tubuhku` + Adventurer `anggota-tubuh`)* |
| Clothes | 11 | *(sudah tercakup Little Stars `pakaian`)* |
| Feelings & Expressions | 9 | *(sudah tercakup Little Stars `perasaanku` + Adventurer `perasaan`)* |
| Family & Friends | 9 | *(sudah tercakup Explorer `keluarga` + Starter `orang-di-sekitarku`)* |
| School | 7 | *(sudah tercakup Starter `di-sekolah` + Adventurer `alat-sekolah`)* — TAPI dapur/masak (`peralatan-dapur`) ditambahkan sbg extension alami dari rutinitas rumah, terinspirasi "The Home" Pre A1 yang sudah sebagian dipakai Starter |

**Keputusan eksplisit dari tabel ini**: 6 kategori Movers dipetakan jadi topik BARU (Characteristics, Time-angle-baru, World Around Us/Countries, Leisure-angle-baru, Health, Places-angle-baru/Shopping) — semua genuinely belum disentuh level manapun atau punya sudut berbeda dari yang sudah ada. 1 topik ke-7 (`peralatan-dapur`) BUKAN dari kategori Movers langsung, tapi extension alami dari domain "rumah" yang relevan & belum ada sudut memasak/dapur di level manapun (Adventurer `rumah` = nama ruangan, Starter `barang-di-rumah` = perabot, belum ada yang mengambil sudut "alat masak"). 13 kategori Movers lainnya sengaja dilewati krn sudah tercakup penuh di level lain — pola konsisten dgn Starter (§3B.2).

### 3C.3 Kurikulum & lembaga lain — dalam & luar negeri (usia 7–9 th)

| Sumber | Tipe | Temuan kunci |
|---|---|---|
| **Kurikulum Merdeka Fase B** (Kemendikbudristek, kelas 3–4 SD, ~8–10 th) | Kurikulum nasional Indonesia | Bahasa Inggris **mulai wajib** di Fase B (beda dari Fase A yang belum wajib) — fokus kosakata tematik, ungkapan fungsional sederhana, struktur kalimat sangat dasar, pelafalan. Anak mulai memahami instruksi & kosakata umum, mengekspresikan ide dasar lewat kegiatan terstruktur. Ini menguatkan posisi Explorer sbg level "mulai serius" — selaras keputusan CLAUDE.md Grammar dimulai dari Starter, diperkuat di Explorer. |
| **Novakid — Junior Program** (usia 7–9) | Kursus online internasional | Campuran game + pembelajaran lebih terstruktur — anak mulai membangun kosakata, memakai grammar sederhana, praktik bicara kalimat pendek. Konfirmasi arah "makin terstruktur" tanpa lompat ke drill berat, sejalan keputusan tidak mengubah mekanik game (tetap game-based). |
| **Cakap Kids** (kursus + app lokal Indonesia, PRD §2) | Kursus swasta lokal | Unit vocab mencakup topik lalu lintas (traffic), hewan+hewan langka, bentuk pertanyaan lintas tense — menunjukkan kompetitor lokal usia ini sudah mulai masuk topik lebih kompleks/abstrak (bukan cuma benda konkret), sejalan pemilihan topik `kata-sifat` (abstrak) & `negara` (geografi) di atas. |
| **Riset ESL elementary umum** (Twinkl, ESL Tower, multi-sumber TEFL) | Referensi tema lintas kursus | Daftar tema umum usia SD kelas 2–3 eksplisit menyebut: **shopping & money, weather & seasons, jobs & work, hobbies, feelings, directions** — mengonfirmasi `belanja-uang` (shopping) sbg tema arus-utama utk usia ini, bukan pilihan asing. |

**Insight lintas sumber**: Fase B (kurikulum nasional) dan Novakid/Cakap (kursus swasta) sama-sama menegaskan usia 7–9 th adalah titik anak mulai **serius belajar** (bukan lagi murni eksposur/bermain seperti Little Stars, atau transisi ringan seperti Starter) — TAPI tetap lewat kegiatan terstruktur/game, bukan drill. Ini membenarkan pemilihan topik Explorer yang lebih abstrak dari 2 level sebelumnya (`kata-sifat`, `negara`) SEKALIGUS memastikan mekanik game tidak berubah (masih Kenalan→Latihan Inti→Tantangan yang sama, §2.2) — kompleksitas naik di KONTEN, bukan di MEKANIK.

---

## 3D. Riset: Materi Tambahan untuk Adventurer (9–11 th, ≈A1)

Beda dari 3 sesi sebelumnya: Adventurer **sudah** penuhi target topik (10/10) SEBELUM sesi ini — jadi riset di sini bukan "menutup gap topik", tapi mengecek apakah masih ada wordlist resmi yang genuinely fresh utk ditambahkan, dan seberapa jauh boleh melangkah tanpa "menghabiskan" jatah level berikutnya.

### 3D.1 Temuan kunci: wordlist A1 Movers (tingkat resmi Adventurer) SUDAH HABIS lintas 4 level

Cross-check eksplisit 20 kategori A1 Movers (§3C.2) terhadap SEMUA topik yang sudah ada di 4 level (Little Stars, Starter, Explorer, Adventurer) menemukan: **setiap satu dari 20 kategori Movers sudah punya "rumah" di suatu level** — tidak ada kategori Movers yang genuinely kosong lagi. Ini konsekuensi tidak terduga dari sesi Explorer (§3C): topik-topik BARU Explorer sengaja dipetakan dari Movers (bukan Starters) supaya beda dari Starter, dan itu kebetulan menghabiskan sisa kategori Movers yang belum kepakai. Jadi topik tambahan Adventurer TIDAK BISA lagi bersumber dari Movers tanpa duplikasi kata — harus naik satu tingkat lagi ke **A2 Flyers**.

### 3D.2 Wordlist resmi Cambridge A2 Flyers — 20 kategori

A2 Flyers (tingkat KETIGA/terakhir YLE, CEFR A2) diorganisasi jadi 20 kategori (analisis wordlist Cambridge oleh azvocab.ai, halaman kategori "Flyers"):

| Kategori Cambridge A2 Flyers | Jml kata | Keputusan |
|---|---|---|
| Acts | 65 | Sebagian kecil (10 kata) → `kata-kerja-harian`. **65 kata SANGAT besar — sengaja cuma diambil sedikit**, sisa >50 kata dibiarkan utk Achiever |
| Characteristics | 49 | *Dilewati total* — sisa penuh utk Achiever (Explorer sudah ambil dari Movers-tier Characteristics, Flyers-tier lebih lanjut biar Achiever) |
| Places and Directions | 47 | *Dilewati total* — sisa penuh utk Achiever |
| Grammar | 30 | *(bukan Vocabulary)* |
| Leisure | 26 | *Dilewati total* — sisa penuh utk Achiever |
| Food & drink | 25 | *Dilewati* — sudah tercakup 2 level (Adventurer `makanan`, Starter `makanan-favoritku`) |
| The home | 21 | *Dilewati* — sudah tercakup 2 level (Adventurer `rumah`, Starter `barang-di-rumah`) |
| Work | 21 | *Dilewati* — sudah tercakup Adventurer `pekerjaan` |
| The world around us | 17 | Diambil penuh (10 kata) → `alam-lingkungan` — sudut geografi/lingkungan, beda dari `negara` Explorer yang sudut negara |
| School | 17 | *Dilewati* — sudah tercakup 2 level |
| Feelings & Expressions | 17 | *Dilewati* — sudah tercakup 2 level |
| Names | 17 | *(nama generik, tidak dipakai — konsisten §3B.2/§3C.2)* |
| Animals | 16 | *Dilewati* — sudah tercakup 2 level (pets/farm + wild) |
| Clothes | 16 | *Dilewati* — sudah tercakup Little Stars |
| Sports | 14 | *Dilewati* — sudah tercakup Adventurer `olahraga` |
| Materials | 10 | Diambil penuh (10 kata) → `bahan-material` — kategori genuinely BARU, belum disentuh level manapun |
| Health | 6 | *Dilewati* — sudah tercakup Explorer `kesehatan` |
| Weather | 4 | *Dilewati* — sudah tercakup Adventurer `cuaca` |
| The body and the face | 4 | *Dilewati* — sudah tercakup 2 level |
| Family & Friends | 3 | *Dilewati* — sudah tercakup 3 level |

**Keputusan eksplisit**: cuma 3 dari 20 kategori dipakai (Materials penuh, World Around Us penuh, Acts sebagian kecil) — SISANYA, termasuk 3 kategori TERBESAR (Acts 65, Characteristics 49, Places 47 = 161 kata, lebih dari sepertiga seluruh wordlist Flyers), **sengaja dibiarkan utuh** utk sesi Achiever nanti. ~14 kategori lain dilewati krn sudah tercakup di level lain manapun (pola konsisten §3B.2/§3C.2).

### 3D.3 Kurikulum & lembaga lain — dalam & luar negeri (usia 9–11 th)

| Sumber | Tipe | Temuan kunci |
|---|---|---|
| **Kurikulum Merdeka Fase C** (Kemendikbudristek, kelas 5–6 SD, ~10–12 th) | Kurikulum nasional Indonesia | Peserta didik diharapkan memahami, merespons, DAN memproduksi teks lisan/tulisan/visual sederhana utk interaksi sehari-hari yang **bisa diprediksi** — mencakup kalimat berpola sederhana, membaca teks deskriptif/naratif/prosedural pendek, menulis pesan mandiri dgn ejaan dasar. Beda dari Fase B (Explorer, sekadar "mulai wajib") — Fase C sudah menuntut PRODUKSI teks, bukan cuma pemahaman. |
| **EF "Trailblazers"** (usia 10–14, RESEARCH §3.5) | Kursus swasta internasional | 5 level, topik "real-world" (memperkenalkan diri, hewan peliharaan, mata pelajaran sekolah, teman, pesta) — >300 kata topik inti + 2500 kosakata total di seluruh course. Tema "pesta" & "teman" ini SUDAH tercakup Explorer (`pesta-perayaan`) & Starter (`orang-di-sekitarku`) — konfirmasi silang, bukan topik baru. |
| **Novakid — usia 10–11 (4th/5th grade)** | Kursus online internasional | Fokus **interactive stories, group discussion, real-life problem solving** — anak mulai berlatih menyampaikan ide dgn percaya diri, critical thinking, percakapan mandiri. Ini domain SPEAKING/GRAMMAR lebih dari Vocabulary murni — dicatat sbg konteks, bukan sumber topik kata benda baru (di luar scope sesi Vocabulary ini). |
| **Riset ESL upper-elementary umum** (Study.com, ESL Brains, Onestopenglish) | Referensi tema lanjutan | Tema "advanced" yang mulai muncul di usia ini: **environment (pollution, recycling), technology, community** — beda dari tema "benda konkret" yang dominan di level bawah. Ini yang mendasari pemilihan `alam-lingkungan` (bukan cuma alam fisik spt `alam-sekitar` Starter, tapi mencakup Pollution/Recycle — kesadaran lingkungan). |

**Insight lintas sumber**: Fase C (produksi teks) dan riset ESL upper-elementary (tema environment/technology) sama-sama menegaskan usia 9–11 th mulai masuk topik **abstrak/isu**, bukan cuma benda konkret — pemilihan `alam-lingkungan` dgn kata "Pollution"/"Recycle" (bukan sekadar "Tree"/"Flower") secara sadar mengikuti insight ini, sambil tetap menjaga mekanik game tidak berubah (§2.2).

---

## 3E. Riset: Materi yang Tepat untuk Achiever (11–13 th, ≈A1 → A2)

Beda dari Adventurer (sesi lalu), Achiever mulai dari NOL topik — riset di sini genuinely "menutup gap topik" lagi, TAPI dgn pekerjaan rumah yang jauh lebih ringan dari sesi Starter/Explorer krn sesi Adventurer SUDAH menyiapkan sebagian besar wordlist A2 Flyers (§3D.2) khusus utk sesi ini.

### 3E.1 Achiever = level YLE resmi A2 Flyers, TIDAK perlu riset wordlist ulang

PRD §3 menandai Achiever sbg "A2 Flyers" (tingkat KETIGA/terakhir YLE) — persis kategori yang sudah dipetakan lengkap di §3D.2 sesi Adventurer. Bedanya dari sesi Adventurer: kalau sesi itu SENGAJA membatasi diri ke 3 kategori kecil (supaya tidak menghabiskan jatah Achiever), sesi ini BOLEH memakai kategori-kategori besar yang sengaja disisakan — **Characteristics (49 kata)**, **Places and Directions (47 kata)**, **Leisure (26 kata)**, dan sisa **Acts (>50 dari 65 kata)** — tanpa perlu fetch ulang wordlist Cambridge, cukup baca ulang tabel §3D.2.

### 3E.2 Pemetaan 4 kategori residual A2 Flyers ke topik Achiever

| Kategori Cambridge A2 Flyers (residual) | Topik Achiever yang dipetakan | Sudut yang diambil |
|---|---|---|
| Characteristics (49 kata, BELUM disentuh sama sekali) | `ciri-ciri-fisik` + `sifat-kepribadian` (2 topik!) | Kategori sebesar ini genuinely muat 2 sudut beda: fisik (Tall/Beautiful/Curly Hair) vs kepribadian (Kind/Brave/Honest) — beda dari `kata-sifat` Explorer yang sudut kontras ukuran benda (Big/Small/Fast/Slow) |
| Places and Directions (47 kata, sebagian dipakai Starter/Explorer) | `tempat-di-kota` + `arah-posisi` (2 topik!) | Tempat spesifik kota (Bank/Cinema/Museum) beda dari tempat umum `tempat-di-sekitar` Starter (Park/Zoo/Farm); arah (Left/Right/Turn/Corner) genuinely kategori baru, belum disentuh level manapun |
| Leisure (26 kata, sebagian dipakai Starter/Explorer) | `hiburan-waktu-luang` | Hiburan luar-rumah (Concert/Cinema/Amusement Park) beda dari `hobi` Starter (aktivitas soliter: Drawing/Gardening) & `pesta-perayaan` Explorer (perayaan) |
| Acts (residual >50 dari 65 kata) | `kata-kerja-lanjutan` | Kata kerja fisik konkret (Climb/Catch/Throw/Hide/Laugh/Cry) — beda bentuk & konteks dari `kata-kerja-harian` Adventurer (Cook/Sweep/Write/Wash, rutinitas domestik) |

4 kategori residual di atas menghasilkan **6 topik** (Characteristics & Places masing-masing dipecah jadi 2 topik krn kata-nya cukup banyak utk 2 sudut beda). Ditambah **4 topik lain**: `teknologi-internet` (domain baru di luar Cambridge, §3E.3), `mata-pelajaran` (dari insight Fase D & EF Trailblazers "school subjects"), `angka-puluhan` (lanjutan progresif dari Numbers 1–10/11–20 yang sudah ada — bukan dari Flyers, krn kategori Numbers Flyers sendiri sudah abis dipakai level bawah), dan `sifat-benda-lanjutan` (residual lanjutan Characteristics utk kualitas BENDA bukan ORANG — Wet/Dry/Hard/Soft — beda dari 2 topik Characteristics di atas yang soal manusia). Total **10 topik genap**.

### 3E.3 Kurikulum & lembaga lain — dalam & luar negeri (usia 11–13 th)

| Sumber | Tipe | Temuan kunci |
|---|---|---|
| **Kurikulum Merdeka Fase D** (Kemendikbudristek, kelas 7–9 SMP, ~12–15 th) | Kurikulum nasional Indonesia | Peserta didik diharapkan **bertukar ide, pengalaman, minat, pendapat, dan pandangan** dgn guru/teman dlm konteks familiar formal & informal — beda dari Fase C (produksi teks sederhana) yg lebih pasif. Achiever (11–13) tumpang tindih ujung Fase C/awal Fase D — kosakata topik makin luas, termasuk "tempat wisata" (selaras `tempat-di-kota`). |
| **Cambridge A2 Key for Schools (KET)** — tingkat SETELAH A2 Flyers | Exam resmi YLE→exam dewasa muda | KET eksplisit MENGECUALIKAN topik sensitif (perang, politik) dari wordlist-nya — **konfirmasi independen** kid-friendly filter yg sudah dipegang app ini sejak awal (CLAUDE.md §1), bukan cuma preferensi internal. Topik KET (family&friends, food&drink, hobbies, travel, places in town) sebagian besar SUDAH tercakup Achiever/level bawah — dipakai sbg konfirmasi arah, BUKAN sumber topik baru (Achiever belum "di" KET, masih A2 Flyers). |
| **EF Trailblazers** (usia 10–14, riset ulang dari sesi Adventurer) | Kursus swasta internasional | Topik "real-world": perkenalan diri, hewan peliharaan, **mata pelajaran sekolah**, teman, pesta — >300 kata topik inti. "Mata pelajaran sekolah" secara eksplisit disebut, jadi dasar kuat utk topik `mata-pelajaran` yg belum ada di level manapun. |
| **Riset ESL usia 11-13 (Twinkl, ESL Brains)** | Referensi tema lanjutan | Tema **teknologi & internet** (perangkat, kata kerja terkait: download/upload/search) mulai eksplisit direkomendasikan di usia pra-remaja — dasar `teknologi-internet`. **Filter kid-friendly diterapkan ketat**: kosakata PERANGKAT/ISTILAH TEKNIS saja (Computer/Internet/Password/Download), TANPA kosakata media sosial/percakapan online (no "like"/"share"/"follower"/"chat") — selaras larangan CLAUDE.md soal fitur sosial ke anak & menghindari topik yg bisa mendorong penggunaan medsos. |

**Insight lintas sumber**: KET eksplisit melarang topik sensitif adalah TEMUAN PALING PENTING sesi ini — bukan cuma menambah materi baru, tapi memvalidasi ulang (dari sumber eksternal independen, bukan asumsi internal) bahwa filter kid-friendly yang sudah dipegang app ini sejak CLAUDE.md ditulis memang selaras standar industri ESL anak, bukan preferensi sepihak.

---

## 3F. Riset: Materi yang Tepat untuk Trailblazer (12+ th, ≈B1, "jalur lanjutan")

Beda PALING BESAR dari 5 sesi sebelumnya: riset di sini BUKAN utk mengejar target ≥10 topik, tapi utk mengisi "1-2 modul preview" yang PRD §9 sudah kunci sejak sebelum inisiatif Vocabulary ini dimulai.

### 3F.1 Kenapa scope-nya sengaja kecil — bukan kelalaian

PRD §9 eksplisit: *"Next phase (low-effort): Level 5 — Trailblazer (B1 jalur lanjutan, 1–2 modul preview)"*. Ini keputusan produk yang SUDAH ada jauh sebelum sesi ini (bukan ditemukan lewat riset baru) — Trailblazer beda sifat dari 5 level lain: bukan tangga progres linear (PRD §6: *"Trailblazer (B1) diakses berbasis usia (12+), bukan hasil progres linear dari Achiever"*), tapi jalur opsional/preview. Target CLAUDE.md "≥10 topik/skill" adalah aspirasi UMUM ("laporkan gap-nya ke user, jangan diam-diam dianggap selesai" — bukan aturan mutlak yang mengalahkan keputusan scope eksplisit yang sudah dikunci). Memaksakan Trailblazer ke 10 topik akan BERTENTANGAN LANGSUNG dengan PRD §9, bukan menutup gap yang sah.

### 3F.2 Wordlist resmi Cambridge B1 Preliminary for Schools (PET)

B1 Preliminary (PET, tingkat KEEMPAT/terakhir YLE-adjacent, CEFR B1 penuh) mencakup 22 tema resmi (dari `examenglish.com`/wordlist resmi Cambridge): Appliances, Buildings, Clothes, Colours, Education, Entertainment and Media, Environment, Food and Drink, Health/Medicine/Exercise, Hobbies and Leisure, House and Home, **Language**, Personal Feelings/Opinions/Experiences, Places (Countryside), Places (Town and City), Services, Shopping, Sport, **Technology and Communications**, The Natural World, **Travel and Transport**, Weather, Work and Jobs.

**Cross-check terhadap 57 topik yang sudah ada di 5 level bawah**: HAMPIR SEMUA tema PET sudah tercakup dalam beberapa bentuk (Clothes→Little Stars, Food→Adventurer/Starter, Health→Explorer, House→Adventurer/Starter, Sport→Adventurer, Weather→Adventurer, Work→Adventurer/Achiever, Technology→Achiever, dst). **2 tema yang genuinely paling segar** dipilih:
- **Travel and Transport** — sudut PERJALANAN (Passport/Luggage/Journey/Destination/Souvenir), BUKAN kendaraan (sudah tercakup Little Stars `kendaraan` + Adventurer `transportasi`) → `perjalanan-wisata`.
- **Language** — SATU-SATUNYA tema PET yang belum disentuh SAMA SEKALI di 5 level manapun, dan punya nilai meta-tematik tinggi: app ini sendiri adalah alat belajar bahasa, jadi kosakata TENTANG belajar bahasa (Translate/Fluent/Accent/Dictionary/Bilingual) terasa sangat relevan buat anak yang sudah sampai level tertinggi → `bahasa-komunikasi`.

20 tema PET lainnya SENGAJA tidak disentuh — bukan krn sudah habis diriset, tapi krn scope "1-2 modul" sudah terpenuhi dgn 2 topik ini.

### 3F.3 Kurikulum & lembaga lain — dalam & luar negeri (usia 12+ th, level B1)

| Sumber | Tipe | Temuan kunci |
|---|---|---|
| **Kurikulum Merdeka Fase E** (Kemendikbudristek, kelas 10 SMA, ~15-16 th — tumpang tindih atas Trailblazer 12+) | Kurikulum nasional Indonesia | Capaian eksplisit ditarget ke **CEFR B1 penuh** — fokus 6 keterampilan berbahasa terintegrasi (bukan cuma kosakata/tata bahasa), jenis teks lebih beragam (narasi/deskripsi/prosedur/eksposisi). Mengonfirmasi B1 sbg target CEFR yang benar utk level ini (selaras PRD §3), tapi levelnya sendiri (SMA kelas 10) sebenarnya DI ATAS rentang usia Trailblazer (12+) — konsisten dgn framing PRD "jalur lanjutan" yang memang mendahului kurikulum sekolah formal. |
| **British Council LearnEnglish Teens (B1 level)** | Platform edukasi non-profit internasional | Tema travel/tourism eksplisit ditonjolkan utk B1 remaja — termasuk "eco-tourism", sisi positif/negatif turisme, World Tourism Day. Menguatkan pilihan `perjalanan-wisata` sbg tema B1 yang genuinely dipakai institusi lain, bukan pilihan sepihak. |

**Insight**: dua sumber independen (PET resmi Cambridge + British Council) sama-sama menonjolkan travel/tourism sbg tema B1 yang matang — memperkuat keyakinan `perjalanan-wisata` adalah pilihan tepat utk 1 dari 2 modul preview ini.

### 3F.4 Sesi lanjutan — target dinaikkan ke ≥5 topik, riset ulang lembaga Indonesia

Permintaan user: "research materi vocab yang sesuai dengan level trailblazer ini, research ke lembaga bahasa inggris lainnya terutama yang dalam negri, buatkan minimal 5". Ini BUKAN membalik keputusan §3F.1 (Trailblazer TETAP jalur bonus lebih ringan) — CLAUDE.md "Target Kelengkapan Konten per Modul" poin 1 sudah direvisi user SEBELUM sesi ini: target lama "1-2 modul" dinaikkan jadi **minimal 5 topik/skill** utk Trailblazer (bukan disamakan ke ≥10 spt 5 level lain, tapi juga tidak dibiarkan mentok di 1-2). Sesi ini genapkan Vocab Trailblazer 2→5, memenuhi target BARU itu.

**Riset ulang lembaga Indonesia** (permintaan eksplisit "terutama yang dalam negri"):

| Sumber | Tipe | Temuan kunci |
|---|---|---|
| **Kurikulum Merdeka Fase F** (kelas 11-12 SMA, ~16-18 th) | Kurikulum nasional Indonesia | Pembelajaran diarahkan supaya peserta didik "mampu menggunakan bahasa secara **kritis, reflektif, dan efektif** dalam berbagai konteks **akademik** maupun kehidupan nyata" — modul ajar kelas 11 eksplisit pakai tema "Healthy Life for a Healthy Future" dgn adjective phrase, tapi FRAMING besarnya (akademik+reflektif+kritis) yang paling relevan di sini, bukan tema kesehatannya sendiri (sudah tercakup Explorer). Ini mengarah ke 2 tema BARU: kosakata seputar KEHIDUPAN AKADEMIK (bukan sekadar nama mapel, yg sudah ada di Achiever `mata-pelajaran`) dan kosakata utk BERPENDAPAT secara reflektif/kritis. |
| **LIA — General English for Teens** | Kursus swasta lokal | Target eksplisit membangun **vocabulary + grammar + pronunciation** SEKALIGUS "21st-century skills": komunikasi, kolaborasi, **critical thinking**, kreativitas — lewat project-based learning. "Critical thinking" yg disebut eksplisit inilah yg mengarahkan ke tema pendapat/opini sbg salah satu dari 3 topik baru, bukan cuma tema fakta konkret spt 5 level di bawah. |
| **EF Indonesia — Trailblazers (11-14 th, nama kebetulan sama dgn level app ini)** | Kursus swasta internasional, cabang Indonesia | Tujuan program eksplisit: "improve speaking and comprehension abilities, strengthen vocabulary and grammar, and **train critical thinking and presentation skills**" — selaras Cambridge/TOEFL/IELTS. "Presentation skills" & "critical thinking" dua sumber independen (LIA+EF) SAMA-SAMA menyebutnya — sinyal kuat bahwa usia 12+ butuh kosakata utk MENYAMPAIKAN pendapat/pengalaman secara terstruktur, bukan cuma tambah kosakata konkret baru. |

**Insight lintas sumber**: TIDAK ada satu pun sumber Indonesia yang mengusulkan tema KONKRET baru yang belum tercakup 5 level bawah (semua tema PET yang "genuinely segar" sudah teridentifikasi §3F.2/di bawah) — riset Indonesia justru mengonfirmasi ARAH/GAYA BAHASA yang dibutuhkan usia ini: akademik-reflektif (Kurikulum Merdeka Fase F) dan kritis/opini-presentasi (LIA, EF) — dua arah ini yang jadi dasar pemilihan 2 dari 3 topik baru di §3F.5, bukan sekadar "tema PET yang belum kepake".

### 3F.5 3 Topik Baru — Dipetakan dari Residual PET, Diarahkan Riset Indonesia

Dari 22 tema PET (§3F.2), setelah `perjalanan-wisata`/`bahasa-komunikasi` (2 topik lama) dan cross-check ulang thd 57 topik 5 level bawah (Clothes/Food/Health/House/Sport/Weather/Work/Technology sudah tercakup; **Hobbies and Leisure** juga SUDAH tercakup Achiever `hiburan-waktu-luang`; **Shopping** sudah Explorer `belanja-uang`; **Places Town and City** & **Services** sudah tercakup Achiever `tempat-di-kota`; **The Natural World** sudah Starter `alam-sekitar`), tema yg BENAR-BENAR belum tersentuh: Appliances, Buildings, **Education**, **Entertainment and Media**, Environment, **Personal Feelings/Opinions/Experiences**, Places (Countryside).

3 dipilih (bukan sekadar tema tersisa acak, tapi yg PALING match dgn arah riset Indonesia §3F.4):

| Topik baru | Tema PET | Kenapa dipilih |
|---|---|---|
| `pendidikan-akademik` — Pendidikan & Kehidupan Akademik | Education | Selaras framing "akademik" Kurikulum Merdeka Fase F — kosakata seputar KEHIDUPAN kampus/ujian/kelulusan (Campus/Degree/Scholarship/Lecture/Essay/Exam/Library/Graduate/Curriculum/Knowledge), BUKAN nama mata pelajaran (sudah Achiever `mata-pelajaran`) — sudut yg genuinely beda. |
| `pendapat-pengalaman` — Pendapat & Pengalaman | Personal Feelings/Opinions/Experiences | Selaras "critical thinking"/"reflektif" (LIA, EF, Kurikulum Merdeka Fase F) — kosakata utk MENYAMPAIKAN pendapat (Opinion/Agree/Disagree/Prefer/Suggest) & pengalaman (Experience/Achievement/Memorable/Impressed/Curious), lebih abstrak drpd kosakata perasaan dasar Little Stars/Adventurer (Happy/Sad/dst). |
| `hiburan-media` — Hiburan & Media | Entertainment and Media | Selaras "presentation skills"/literasi media EF/LIA, DAN melengkapi Achiever `teknologi-internet` yang SENGAJA cuma kosakata perangkat tanpa medsos — di sini kosakata MEDIA (Documentary/Headline/Broadcast/Review/Subscribe/Streaming/Episode/Interview/Animation/Audience), bukan platform medsos spesifik (tetap ikut filter kid-friidly, tidak menyebut nama platform). |

Appliances/Buildings/Environment/Places (Countryside) — 4 tema PET residual TERSISA, TIDAK dipilih sesi ini (bukan krn tidak layak, tapi krn scope "minimal 5" sudah terpenuhi dgn 3 topik ini + 2 topik lama) — dicatat sbg kandidat kalau user minta Trailblazer diperluas lagi ke depan.

**Verifikasi**: `npm run build` (tsc + `verify:content` BARU §7 + esbuild) lolos, 60 topik total (57 lama + 3 baru), 0 id bentrok, semua ≥10 kata, semua `example.en` whole-word match. QA browser live: Menu Belajar Trailblazer "5 materi", kelima topik terlihat & terurut benar; topik `pendidikan-akademik`/`pendapat-pengalaman`/`hiburan-media` dicoba di Kenalan (10 baris @ masing², mini-game "Dengar & Tunjuk" jalan mulus 4 opsi gambar); `pendapat-pengalaman` dicoba sampai Latihan Inti (distribusi 2/2/3/3 benar) & Tantangan Eja Kata ("OPINION" 7 huruf tersusun dari bank acak). 0 error console di semua percobaan.

### 3F.6 Sesi lanjutan lagi — 5→10 topik, "kandidat residual" §3F.5 ditagih penuh

Permintaan user berikutnya: "tambahkan 5 materi vocab untuk level trailblazer". Ini deviasi SADAR dari target BAKU Trailblazer (≥5, §3F.4) — preseden SAMA PERSIS dgn Grammar Trailblazer (digenapkan 1→10 atas permintaan eksplisit "min 10", CLAUDE.md § "Grammar — 3 Format Berdampingan") & Listening Trailblazer (direvisi penuh ke 10/10 atas pilihan eksplisit user) — instruksi user langsung MENGALAHKAN target baku per-sesi, bukan pelanggaran aturan itu sendiri (target baku tetap berlaku sbg DEFAULT kalau tidak ada instruksi baru).

**Sumber topik**: 4 kandidat residual yg SUDAH dicatat §3F.5 ("Appliances, Buildings, Environment, Places (Countryside)") ditagih 3 di antaranya, PLUS 1 tema yg audit ulang sesi ini menemukan MASIH py kosakata segar walau sempat ditandai "sudah tercakup" (§3F.5's "Places Town and City & Services sudah tercakup Achiever tempat-di-kota" — ternyata itu penggabungan longgar 2 tema PET beda; dicek ulang kata-demi-kata isi `tempat-di-kota` (Bank/Post Office/Police Station/Restaurant/Cinema/Museum/Stadium/Supermarket/Airport/Bakery) — SEMUA itu tema "Places Town and City" murni, **tema "Services" murni (bank/kantor pos JUGA masuk situ scr resmi, tapi apotek/tukang cukur/dokter gigi/montir/laundry/bengkel — layanan yg org KUNJUNGI, bukan tempat rekreasi/belanja — belum py "rumah" sama sekali**), jadi genuinely fresh utk topik ke-5), PLUS 1 topik lagi yg BUKAN tema PET mentah tapi diturunkan dari ARAH riset yg SUDAH divalidasi §3F.4 (presentation skills/critical thinking, EF+LIA) — pola yg sama persis dgn cara `pendidikan-akademik`/`pendapat-pengalaman` diturunkan sesi lalu (§3F.4's insight: "TIDAK ada sumber Indonesia yg mengusulkan tema KONKRET baru... riset Indonesia mengonfirmasi ARAH/GAYA BAHASA" — jadi sah menurunkan topik dari arah, bukan cuma dari daftar tema PET mentah).

| Topik baru | Sumber | Kenapa dipilih |
|---|---|---|
| `layanan-masyarakat` — Layanan Masyarakat (Public Services) | Tema PET "Services" (§3F.2), dikoreksi dari asumsi §3F.5 bhw ini sudah tercakup `tempat-di-kota` | Cek ulang isi `tempat-di-kota`: 0 dari 10 katanya genuinely "layanan" (semua tempat rekreasi/belanja/darurat) — Pharmacy/Hairdresser/Dentist/Mechanic/Laundry/Petrol Station/Fire Station/Vet/Optician/Tailor genuinely fresh, 0 tabrakan kata dicek via grep. |
| `peralatan-elektronik` — Peralatan Elektronik Rumah (Home Appliances) | Tema PET "Appliances" (§3F.2/§3F.5 residual) | Beda sudut dari `peralatan-dapur` Explorer (piranti masak MANUAL: panci/wajan/sendok) — di sini piranti LISTRIK (Washing Machine/Air Conditioner/Printer/Radio/Rice Cooker/Electric Fan/Water Heater/Speaker/Charger/Doorbell). Starter `barang-di-rumah` sudah pakai "Lamp"/"Television"/"Fridge"/"Phone" — SEMUA 4 dihindari total (bukan cuma exact-word, konsepnya juga dihindari) supaya topik ini genuinely piranti BARU, bukan sinonim dari yg sudah ada. |
| `bangunan-sekitar` — Bangunan di Sekitar Kita (Buildings Around Us) | Tema PET "Buildings" (§3F.2/§3F.5 residual) | Beda sudut dari `tempat-di-kota` (tempat FUNGSIONAL: bank/bioskop) — di sini JENIS bangunan (Castle/Palace/Tower/Skyscraper/Apartment/Factory/Church/Mosque/Temple/Cottage), termasuk representasi 3 rumah ibadah (Gereja/Masjid/Pura) yg seimbang mencerminkan keberagaman Indonesia, bukan condong ke 1 agama. |
| `pedesaan` — Pedesaan (Countryside) | Tema PET "Places (Countryside)" (§3F.2/§3F.5 residual) | Beda sudut dari `alam-lingkungan` Adventurer (Planet/Ocean/Volcano — skala KOSMIK/geografis) & `alam-sekitar` Starter (Sun/Tree/Flower — alam dasar sekitar rumah) — di sini PEMUKIMAN/pertanian pedesaan (Village/Field/Hill/Meadow/Barn/Path/Pond/Orchard/Countryside/Vineyard), sudut yg genuinely belum tersentuh 2 topik "alam" lain. |
| `presentasi-diskusi` — Presentasi & Diskusi (Presentation & Discussion) | Diturunkan dari ARAH riset §3F.4 (bukan tema PET mentah — pola sama `pendidikan-akademik`/`pendapat-pengalaman`) | EF & LIA (§3F.4) SAMA-SAMA eksplisit sebut "presentation skills" & "critical thinking" sbg kebutuhan usia ini — `pendapat-pengalaman` (sesi lalu) sudah menutup sisi PENDAPAT PRIBADI (Opinion/Agree/Prefer), topik ini menutup sisi STRUKTUR MENYAMPAIKAN pendapat scr terstruktur/akademik (Presentation/Debate/Evidence/Conclusion/Discussion/Perspective/Persuade/Summarize/Feedback/Volunteer) — pelengkap, bukan pengulangan. |

**Audit kata duplikat SEBELUM ditulis** (bukan sesudah, preventif) — tiap kandidat kata dicek via `grep` langsung ke `content.ts` (bukan cuma dibaca ulang manual) thd SELURUH 60 topik Vocab existing sebelum difinalkan: 4 kata awalnya kena tabrakan (`Bridge`/`Farm` sudah dipakai Starter `tempat-di-sekitar`, `Television` sudah dipakai Starter `barang-di-rumah`, `Confident` sudah dipakai Achiever `sifat-kepribadian`) — SEMUA diganti (`Bridge`→dihapus dari `bangunan-sekitar` diganti `Apartment`; `Farm`→dihapus dari `pedesaan` diganti `Vineyard`; `Television`/`Fridge`/`Lamp` dihindari total dari `peralatan-elektronik`; `Confident`→dihapus dari `presentasi-diskusi` diganti `Persuade`) SEBELUM kode ditulis ke `content.ts`, jadi 0 duplikat kata lintas topik di commit final (dicek ulang pasca-tulis, 0 hit).

**Verifikasi**: `npm run build` (tsc + `verify:content` + `verify:duplicates` + esbuild) lolos, **65 topik total** (60 lama + 5 baru), 0 id bentrok, semua ≥10 kata, semua `example.en` whole-word match. Audit tambahan (skrip ad-hoc, di luar `verify-vocab-content.mjs`): dalam 10 topik Trailblazer, 0 `example.en`/`example.id` terduplikasi DALAM 1 topik yang sama (syarat CLAUDE.md § "Kalimat Soal ... Tidak Boleh 100% Sama" — walau Vocab sendiri di luar cakupan wajib aturan itu krn formatnya `items`-based, dicek lebih ketat dari yg diwajibkan), 0 emoji terduplikasi dalam 1 topik. Live browser QA TIDAK dijalankan sesi ini (Playwright tidak terpasang sbg dependency lokal, tidak sempat di-provision) — verifikasi mengandalkan penuh pada cek struktural otomatis di atas, bukan klaim "sudah dicoba di browser".

---

## 4. Guardrail Teknis Non-Obvious (Evergreen)

Ditemukan dengan membaca kode `progress.ts`/`games/boss.ts`/`app.ts`/`portal/lib/placement-*.ts` sebelum menulis konten — dicatat di sini supaya level berikutnya (kalau ada revisi scope Trailblazer, atau skill baru di level manapun) tidak mengulang investigasi yang sama:

1. **Id topik Vocabulary global, bukan per-level** (detail §2.2) — cek daftar id yang SUDAH dipakai di §5A (Little Stars), §5B (Starter), §5C (Explorer, termasuk 3 topik lama `keluarga`/`angka`/`warna`), §5D (Adventurer, termasuk 10 topik lama `pekerjaan`…`perasaan`), §5E (Achiever), §5F (Trailblazer, 10 topik) sebelum kasih id topik baru di level manapun — 65 id total sekarang, SEMUA 6 level sudah terisi.
2. **`hasContent:true` di `LEVELS` aman dinyalakan sebelum SEMUA skill level itu diauthoring** — `visibleSkillKeys()` (`app.ts:174`) otomatis sembunyikan kartu skill kosong, `poolFor()` (`games/boss.ts:36`) otomatis jatuh ke pool Explorer utk skill yang masih kosong. Konsekuensi yang perlu disadari: begitu `hasContent:true`, level itu jadi gerbang nyata di Peta Level (Tantangan Bos bisa ditantang, `unlockLevelsUpTo` ikut menghitungnya) — bukan cuma "tambah data pasif".
3. **`PlacementLevelKey` (`portal/lib/placement-test-data.ts:26`) cuma `'starter' | 'explorer' | 'adventurer'`** — Little Stars, Achiever & Trailblazer **tidak pernah** jadi hasil rekomendasi First Placement Test, jadi `CONTENT_AVAILABLE` di `portal/lib/placement-scoring.ts` tidak perlu menyertakan ketiganya (Trailblazer malah eksplisit diakses berbasis usia per PRD §6, bukan lewat placement test sama sekali). **Starter BEDA** — Starter ADA di `PlacementLevelKey`, jadi `CONTENT_AVAILABLE` **WAJIB** diupdate begitu Starter diauthoring (sudah dilakukan, §5B) — kalau lupa, anak yang direkomendasikan Starter dari placement test tetap di-redirect ke Explorer sia-sia (`resolvePlayableLevel` fallback ke level ber-konten terdekat).
4. **Mini-game hitung (`buildNumberQuestion`, `games/vocabulary.ts`) tidak punya cap jumlah repeat emoji** — untuk topik Angka 11–20 (Starter), soal "ada berapa X ini?" menampilkan emoji diulang sampai 16–20×. Diverifikasi TIDAK error/patah layout (§7), cuma visual jadi padat — dicatat di sini supaya kalau level berikutnya bikin topik Angka lebih tinggi lagi (mis. puluhan/ratusan di level lanjut), sadar konsekuensi visualnya duluan, bukan kaget saat QA.

---

## 5A. Little Stars — Spesifikasi Vocabulary (Diimplementasikan)

**Lokasi kode**: `app/src/content.ts` — `VOCAB_TOPICS_LITTLE_STARS` (const array), didaftarkan di `VOCAB_TOPICS_BY_LEVEL['little-stars']`. `LEVELS` entri `little-stars`: `hasContent: false → true`.

12 topik, urutan pedagogis sengaja (fungsional dulu → visual konkret → diri/keluarga → tubuh → dunia sekitar → abstrak feelings paling akhir), tiap topik 10 kata:

| # | Topik (id) | Judul | Rasional sumber |
|---|---|---|---|
| 1 | `salam-sopan-santun` | Salam & Sopan Santun (Greetings & Manners) | §3A.2 riset ESL "greetings selalu #1" + §3A.3 (Little Stars belum ada Speaking) |
| 2 | `kenal-warna` | Kenal Warna (Colors) | §3A.2 Lingokids "art lessons: colors", PAUD "tema warna" |
| 3 | `angka-pertama` | Angka 1–10 (Numbers 1–10) | §3A.2 Lingokids "counting 1–10" |
| 4 | `bentuk` | Bentuk (Shapes) | §3A.2 Lingokids "2D shapes" |
| 5 | `keluargaku` | Keluargaku (My Family) | §3A.2 PAUD "tema anggota keluarga", Lingokids "family" |
| 6 | `tubuhku` | Anggota Tubuhku (My Body) | §3A.2 lagu "Head, Shoulders, Knees, and Toes" (PAUD) |
| 7 | `hewan-peliharaan` | Hewan Peliharaan & Ternak (Pets & Farm Animals) | §3A.2 PAUD "tema hewan", Lingokids "pets", beda dari hewan eksotis Adventurer |
| 8 | `buah-buahan` | Buah-buahan (Fruits) | §3A.2 ESL umum "food theme" |
| 9 | `mainan` | Mainan (Toys) | §3A.2 ESL umum "toys", Lingokids "toys" |
| 10 | `pakaian` | Pakaian (Clothes) | §3A.2 ESL umum "clothing theme" |
| 11 | `kendaraan` | Kendaraan (Vehicles) | §3A.2 Lingokids "transport, vehicles" |
| 12 | `perasaanku` | Perasaanku (My Feelings) | Tema SEL dasar, sengaja PALING AKHIR (paling abstrak) — subset lebih sederhana dari `perasaan` Adventurer |

Keputusan konten per-kata yang bukan sekadar terjemahan literal: kalimat contoh EXTREMELY simple (3–5 kata: "I am happy.", "This is a circle."); kata dipilih pendek (mayoritas 3–7 huruf) supaya Eja Kata masuk akal dibantu orang tua; kalimat hewan pakai suara ("The cow says moo."); sengaja beda kata dari topik sejenis di level lain (`Mom`/`Dad` informal vs `Mother`/`Father` Explorer).

---

## 5B. Starter — Spesifikasi Vocabulary (Diimplementasikan)

**Lokasi kode**: `app/src/content.ts` — `VOCAB_TOPICS_STARTER` (const array), didaftarkan di `VOCAB_TOPICS_BY_LEVEL['starter']`. `LEVELS` entri `starter`: `hasContent: false → true`. `portal/lib/placement-scoring.ts` `CONTENT_AVAILABLE`: `['explorer','adventurer'] → ['starter','explorer','adventurer']`.

10 topik (persis target CLAUDE.md, tidak dilebihkan seperti Little Stars — kualitas grounding ke wordlist resmi diprioritaskan daripada kuantitas), tiap topik 10 kata — dipetakan dari kategori Cambridge Pre A1 Starters (§3B.2):

| # | Topik (id) | Judul | Kategori Cambridge asal |
|---|---|---|---|
| 1 | `angka-11-20` | Angka 11–20 (Numbers 11–20) | Numbers — lanjutan progresif dari 1–10 |
| 2 | `hari-dalam-seminggu` | Hari dalam Seminggu (Days of the Week) | Time |
| 3 | `tempat-di-sekitar` | Tempat di Sekitar Kita (Places Around Us) | Places and Directions |
| 4 | `serangga` | Serangga & Makhluk Kecil (Insects & Small Creatures) | Animals (sudut baru) |
| 5 | `makanan-favoritku` | Makanan Favoritku (My Favorite Food) | Food & Drink (sudut baru) |
| 6 | `barang-di-rumah` | Barang di Rumah (Things at Home) | The Home (sudut baru) |
| 7 | `di-sekolah` | Di Sekolah (At School) | School (sudut baru) |
| 8 | `orang-di-sekitarku` | Orang di Sekitarku (People Around Me) | Family & Friends (sudut baru) |
| 9 | `alam-sekitar` | Alam di Sekitar Kita (Nature Around Us) | The World Around Us |
| 10 | `hobi` | Hobiku (My Hobbies) | Leisure |

Keputusan konten per-kata:

- **Kalimat contoh sedikit lebih kaya dari Little Stars** (bukan cuma pola "I am X" berulang) — konsisten kompleksitas Explorer yang sudah ada, sesuai anak 5–7 th yang mulai mengenal struktur kalimat lewat modul Grammar (PRD §4.2: Pronouns/To Be/Possessives dimulai di Starter). Pola dominan tetap "I like ___."/"I see a ___."/"The ___ is ___." — masih sangat sederhana, cuma lebih variatif dari Little Stars.
- **`angka-11-20` kebaca otomatis sbg topik Angka** oleh `isNumberTopic()` (semua kata ada di `NUMBER_WORDS` sampai `'twenty'`) — tidak perlu kode baru, diverifikasi langsung di browser (§7) mini-game hitungnya jalan mulus meski emoji-nya diulang belasan kali.
- **Kata lebih panjang/abstrak dari Little Stars secara sengaja** (`Neighbor`, `Classmate`, `Yesterday`, `Collecting`, `Principal`) — sesuai insight §3B.3 (usia ini transisi dari lisan murni ke mulai-ada-literasi), TAPI contoh Eja Kata tetap terverifikasi jalan (kata 8+ huruf tetap bisa disusun via chip, reveal-jawaban-setelah-2x-salah tetap jadi jaring pengaman yang sama seperti level lain).
- **6 kategori Cambridge yang overlap berat dgn level lain sengaja dilewati** (Sports, Transport, Body, Colours, Toys, Feelings — lihat tabel §3B.2) — supaya Starter genuinely menambah kosakata baru.

---

## 5C. Explorer — Spesifikasi Vocabulary (Diimplementasikan)

**Lokasi kode**: `app/src/content.ts` — 7 topik baru ditambahkan LANGSUNG ke const array `VOCAB_TOPICS` yang sudah ada (dipetakan `VOCAB_TOPICS_BY_LEVEL['explorer']` sejak awal) — BUKAN array terpisah, karena `VOCAB_TOPICS` sendiri secara semantik memang "array topik Explorer". 3 topik lama (`keluarga`, `angka`, `warna`) TIDAK diubah/dipindah sama sekali — progres anak yang sudah ada di topik-topik itu tetap aman. `LEVELS`/`CONTENT_AVAILABLE` **tidak perlu diubah** (Explorer sudah `hasContent:true` & ada di `CONTENT_AVAILABLE` sejak sebelum sesi ini).

7 topik baru, tiap topik 10 kata — dipetakan dari kategori Cambridge A1 Movers (§3C.2), menggenapkan Explorer dari 3 jadi 10 topik total:

| # | Topik (id) | Judul | Kategori Cambridge A1 Movers asal |
|---|---|---|---|
| 4 | `kesehatan` | Kesehatan (Health) | Health |
| 5 | `kata-sifat` | Kata Sifat & Lawan Kata (Adjectives & Opposites) | Characteristics |
| 6 | `belanja-uang` | Belanja & Uang (Shopping & Money) | Places and Directions (sudut belanja) |
| 7 | `waktu-harian` | Waktu dalam Sehari (Times of Day & Calendar) | Time (sudut baru, beda dari hari-dalam-seminggu Starter) |
| 8 | `negara` | Negara-negara Dunia (Countries of the World) | The World Around Us |
| 9 | `pesta-perayaan` | Pesta & Perayaan (Party & Celebrations) | Leisure (sudut pesta) |
| 10 | `peralatan-dapur` | Peralatan Dapur (Kitchen Tools) | Extension alami domain rumah, belum ada sudut ini di level manapun |

Keputusan konten per-kata:

- **`negara` pakai emoji BENDERA** (🇮🇩🇬🇧🇺🇸🇯🇵🇨🇳🇰🇷🇫🇷🇦🇺🇮🇳🇩🇪) — beda dari topik lain yang emoji-nya representasi benda/gambar; bendera dipilih krn Unicode punya cakupan lengkap & jelas per-negara (satu-satunya kategori "orang/tempat abstrak" yang punya representasi visual sekonkret ini), diverifikasi render bersih di browser (§7).
- **`kata-sifat` pakai pola kontras** (Big/Small, Fast/Slow, Long/Short, Heavy/Light, Clean/Dirty) — cara paling umum mengajarkan adjective ke anak (kontras berpasangan lebih nempel daripada kata sifat berdiri sendiri), tiap kata tetap 1 carrier-animal/benda visual sendiri (`The elephant is big.` dst) supaya tetap cocok format Kenalan/Latihan Inti yang sudah ada.
- **Kalimat contoh makin bervariasi strukturnya** dari Starter (bukan cuma "I like/I see X") — mulai ada pertanyaan (`"What is the price?"`), seruan (`"Happy birthday!"`, `"This is a surprise!"`), dan kalimat pihak ketiga (`"The cashier helps me pay."`) — konsisten insight §3C.3 (usia ini mulai serius, kompleksitas naik di konten bukan mekanik).
- **13 kategori Movers yang overlap berat dgn level lain sengaja dilewati** (lihat tabel §3C.2) — supaya Explorer genuinely menambah kosakata baru, bukan mengulang kata yang sama persis.

---

## 5D. Adventurer — Spesifikasi Vocabulary Tambahan (Diimplementasikan)

**Lokasi kode**: `app/src/content.ts` — 3 topik baru ditambahkan LANGSUNG ke const array `VOCAB_TOPICS_ADVENTURER` yang sudah ada (setelah `perasaan`, topik ke-10 lama). 10 topik lama TIDAK diubah sama sekali. `LEVELS`/`CONTENT_AVAILABLE` **tidak perlu diubah** (Adventurer sudah `hasContent:true` & ada di `CONTENT_AVAILABLE` sejak sebelum sesi ini).

3 topik baru, tiap topik 10 kata — dipetakan dari kategori Cambridge A2 Flyers (§3D.2), menggenapkan Adventurer dari 10 jadi 13 topik total (MELEBIHI target, bukan sekadar memenuhi — beda dari Starter/Explorer yang pas 10, krn Adventurer memang sudah py 10 topik solid sebelumnya, jadi tambahan ini genuinely bonus):

| # | Topik (id) | Judul | Kategori Cambridge A2 Flyers asal |
|---|---|---|---|
| 11 | `bahan-material` | Bahan & Material (Materials) | Materials (diambil PENUH — kategori genuinely baru) |
| 12 | `kata-kerja-harian` | Kata Kerja Sehari-hari (Everyday Actions) | Acts (10 dari 65 kata — sengaja SEBAGIAN KECIL saja) |
| 13 | `alam-lingkungan` | Alam & Lingkungan (Nature & Environment) | The World Around Us (diambil PENUH) |

Keputusan konten per-kata:

- **`bahan-material` semua kalimat pakai pola "X terbuat dari Y" ("The table is made of wood.")** — pola konsisten yang menekankan hubungan benda-konkret ke bahan-abstrak, sesuai fungsi kategori "Materials" Cambridge (mengajarkan bahan sbg properti benda, bukan benda itu sendiri).
- **`kata-kerja-harian` pakai bentuk kata kerja DASAR** (Cook/Sweep/Write/Draw, bukan Cooking/Sweeping seperti gerund di `hobi` Starter) — sengaja beda bentuk tata bahasa supaya jadi variasi genuine, bukan pengulangan kata yang sama persis dgn akhiran beda.
- **`alam-lingkungan` sengaja masukkan `Pollution`/`Recycle`** (bukan cuma alam fisik) — insight §3D.3 (riset ESL upper-elementary: tema "environment/pollution/recycling" mulai relevan usia ini) — beda sudut dari `alam-sekitar` Starter yang murni alam fisik dasar (Sun/Moon/Tree/Flower).
- **Emoji 🚀 dipakai utk kata "Space"** — kebetulan sama dgn emoji level Adventurer sendiri di `LEVELS`/Peta Level, bukan disengaja tapi cocok tematis (level "petualang" & kata "luar angkasa" sama-sama emoji roket).
- **17 dari 20 kategori A2 Flyers sengaja DIBIARKAN UTUH** utk Achiever (§3D.2) — termasuk 3 kategori terbesar (Acts sisa >50 kata, Characteristics 49, Places 47) — ini bukan kelalaian, tapi keputusan eksplisit forward-planning supaya sesi Achiever nanti masih py wordlist resmi segar buat dipetakan, bukan mulai dari nol tanpa sumber CEFR yang jelas.

---

## 5E. Achiever — Spesifikasi Vocabulary (Diimplementasikan)

**Lokasi kode**: `app/src/content.ts` — `VOCAB_TOPICS_ACHIEVER` (const array baru), didaftarkan di `VOCAB_TOPICS_BY_LEVEL['achiever']`. `LEVELS` entri `achiever`: `hasContent: false → true`. `CONTENT_AVAILABLE` **tidak perlu diubah** — Achiever, spt Little Stars, di luar `PlacementLevelKey` sama sekali (§4 poin 3).

10 topik, tiap topik 10 kata — dipetakan dari residual A2 Flyers (§3E.2) + 1 domain baru (Teknologi):

| # | Topik (id) | Judul | Sumber |
|---|---|---|---|
| 1 | `ciri-ciri-fisik` | Ciri-ciri Fisik (Physical Appearance) | Characteristics (sudut fisik) |
| 2 | `tempat-di-kota` | Tempat di Kota (Places in Town) | Places and Directions (sudut tempat spesifik) |
| 3 | `arah-posisi` | Arah & Posisi (Directions & Position) | Places and Directions (sudut arah) |
| 4 | `hiburan-waktu-luang` | Waktu Luang & Hiburan (Leisure & Entertainment) | Leisure |
| 5 | `kata-kerja-lanjutan` | Kata Kerja Lanjutan (Advanced Actions) | Acts (residual) |
| 6 | `teknologi-internet` | Teknologi & Internet (Technology & Internet) | Domain baru — riset ESL usia 11-13 (§3E.3) |
| 7 | `sifat-kepribadian` | Sifat Kepribadian (Personality Traits) | Characteristics (sudut kepribadian) |
| 8 | `mata-pelajaran` | Mata Pelajaran Sekolah (School Subjects) | EF Trailblazers "school subjects" (§3E.3) |
| 9 | `angka-puluhan` | Angka Puluhan ke Atas (Bigger Numbers) | Lanjutan progresif Numbers 1–10/11–20 |
| 10 | `sifat-benda-lanjutan` | Sifat Benda Lanjutan (Object Qualities) | Characteristics (sudut kualitas benda, bukan orang) |

Keputusan konten & guardrail teknis yang ditemukan sesi ini:

- **`angka-puluhan` SENGAJA tidak masuk `isNumberTopic()`** — `NUMBER_WORDS` di `games/vocabulary.ts` cuma sampai `'twenty'`, jadi `Thirty`…`Million` TIDAK terdeteksi sbg topik angka, otomatis jatuh ke tipe soal "Apa bahasa Inggrisnya…?" (translate), BUKAN mini-game hitung gambar. Ini **benar & disengaja** — coba bayangkan render "1.000.000" emoji diulang di layar kalau `isNumberTopic()` tetap `true`. Diverifikasi langsung di browser (§7): soal muncul sbg pilihan teks, bukan hitung gambar, tanpa perlu ubah kode.
- **`teknologi-internet` sengaja HANYA kosakata perangkat/istilah teknis** (Computer/Internet/Password/Download/Upload/Screen/Keyboard/Mouse), **TANPA** kosakata media sosial/interaksi online (like/share/follower/chat/DM) — filter kid-friendly ketat (§3E.3), konsisten CLAUDE.md soal fitur sosial & app tanpa elemen medsos.
- **Jebakan konjugasi kata kerja** (pelajaran dari bug "Twin"/"twins" sesi Starter, §2.2) diwaspadai eksplisit di `kata-kerja-lanjutan` — semua kalimat contoh pakai subjek "I"/jamak + kata kerja bentuk DASAR ("I cry when I am sad.", "Birds fly in the sky."), BUKAN bentuk orang-ketiga-tunggal ("cries"/"flies") yg akan gagal whole-word match. Diverifikasi otomatis (§7) — 0 bug ditemukan sesi ini.
- **2 topik dari kategori Characteristics yang sama** (`ciri-ciri-fisik` fisik vs `sifat-kepribadian` kepribadian vs `sifat-benda-lanjutan` kualitas benda) sengaja dipisah 3 arah supaya jelas beda subjek (manusia-fisik / manusia-sifat / benda) — bukan 1 topik "Kata Sifat" besar yang membingungkan campur aduk.

---

## 5F. Trailblazer — Spesifikasi Vocabulary (Diimplementasikan)

**Lokasi kode**: `app/src/content.ts` — `VOCAB_TOPICS_TRAILBLAZER` (**10 topik**, digenapkan 2→5 lalu 5→10 lintas 2 sesi lanjutan, §3F.4/§3F.5/§3F.6), didaftarkan di `VOCAB_TOPICS_BY_LEVEL['trailblazer']`. `LEVELS` entri `trailblazer`: `hasContent: false → true`. `CONTENT_AVAILABLE` **tidak perlu diubah** — Trailblazer, spt Little Stars & Achiever, di luar `PlacementLevelKey` sama sekali (§4 poin 3); PRD §6 malah eksplisit bilang Trailblazer diakses berbasis usia, bukan hasil placement test sama sekali.

10 topik, tiap topik 10 kata — **MELEBIHI target BAKU Trailblazer (≥5)** atas permintaan eksplisit user sesi lanjutan §3F.6 ("tambahkan 5 materi vocab untuk level trailblazer"), preseden sama dgn Grammar/Listening Trailblazer yg sama-sama digenapkan ke 10/10 atas instruksi eksplisit serupa:

| # | Topik (id) | Judul | Sumber |
|---|---|---|---|
| 1 | `perjalanan-wisata` | Perjalanan & Wisata (Travel & Tourism) | PET "Travel and Transport" (sudut perjalanan, bukan kendaraan) + British Council teen B1 travel/eco-tourism |
| 2 | `bahasa-komunikasi` | Bahasa & Komunikasi (Language & Communication) | PET "Language" — SATU-SATUNYA tema PET yang belum disentuh level manapun |
| 3 | `pendidikan-akademik` | Pendidikan & Kehidupan Akademik (Education & Academic Life) | PET "Education" + framing "akademik/reflektif" Kurikulum Merdeka Fase F (§3F.4) |
| 4 | `pendapat-pengalaman` | Pendapat & Pengalaman (Opinions & Experiences) | PET "Personal Feelings/Opinions/Experiences" + "critical thinking" LIA/EF Trailblazers (§3F.4) |
| 5 | `hiburan-media` | Hiburan & Media (Entertainment & Media) | PET "Entertainment and Media" + "presentation skills"/literasi media EF/LIA (§3F.4) |
| 6 | `layanan-masyarakat` | Layanan Masyarakat (Public Services) | PET "Services" (§3F.6, dikoreksi dari asumsi "sudah tercakup" sesi lalu) |
| 7 | `peralatan-elektronik` | Peralatan Elektronik Rumah (Home Appliances) | PET "Appliances" (§3F.6) |
| 8 | `bangunan-sekitar` | Bangunan di Sekitar Kita (Buildings Around Us) | PET "Buildings" (§3F.6) |
| 9 | `pedesaan` | Pedesaan (Countryside) | PET "Places (Countryside)" (§3F.6) |
| 10 | `presentasi-diskusi` | Presentasi & Diskusi (Presentation & Discussion) | Diturunkan dari arah "presentation skills"/"critical thinking" EF+LIA (§3F.4/§3F.6), bukan tema PET mentah |

Keputusan konten:

- **`bahasa-komunikasi` sengaja jadi topik ke-2 (bukan cuma 1 topik)** meski scope awal "low-effort" — krn nilai meta-tematiknya tinggi (app pembelajaran bahasa mengajarkan KATA UNTUK bicara tentang bahasa itu sendiri: Translate/Fluent/Accent/Bilingual/Native Speaker) — dinilai layak jadi 1 dari 2 modul preview awal, bukan sekadar tema acak.
- Kata target termasuk yang PALING panjang lintas SEMUA level sejauh ini (`Pronunciation` 13 huruf, `Interpreter` 11 huruf, `Translate` 9 huruf) — diverifikasi tetap jalan mulus di Eja Kata (§7), konsisten prinsip "mekanik sama di semua level, cukup kata yang makin kompleks" yang sudah dipegang sejak sesi Little Stars.
- **3 topik (§3F.5) genapkan 2→5, lalu 5 topik lagi (§3F.6) genapkan 5→10** — target BAKU Trailblazer TETAP "minimal 5" (CLAUDE.md § "Target Kelengkapan Konten per Modul" poin 1 TIDAK berubah), 10 topik di sini murni MELEBIHI target atas instruksi eksplisit sesi §3F.6 — bukan target baku baru utk Trailblazer, jangan diasumsikan level lain/skill lain Trailblazer otomatis juga wajib 10 tanpa instruksi serupa.

---

## 6. Gap yang Masih Terbuka (dilaporkan, bukan dianggap selesai)

Vocabulary sekarang **tuntas di 6 dari 6 level** — semua gap yang tersisa ada di skill LAIN (Listening/Speaking/Grammar/Reading), bukan Vocabulary lagi:

| Gap | Kenapa belum dikerjakan sekarang | Dampak saat ini |
|---|---|---|
| **Listening Little Stars** belum diauthoring | Setiap sesi Vocabulary sengaja dipersempit ke skill itu saja (permintaan user berulang: "untuk vocab") | Tantangan Bos & Menu Belajar fallback ke pool Explorer utk Listening (§4 poin 2) |
| **Listening/Speaking/Grammar Starter** belum diauthoring | idem | Tantangan Bos & Menu Belajar fallback ke pool Explorer utk 3 skill ini |
| **Listening/Speaking/Grammar/Reading Explorer, Adventurer, Achiever & Trailblazer masih tipis/kosong** | idem | Explorer/Adventurer: skill ini SUDAH ada (bukan `hasContent:false`), cuma jauh dari target ≥10 topik/skill. Achiever/Trailblazer: skill ini `poolFor()` fallback ke Explorer, belum py materi sendiri sama sekali |
| **Speaking/Grammar Little Stars** | Di luar cakupan level ini per PRD §4.1 (memang cuma Vocabulary+Listening) — bukan gap, sudah sesuai desain | — |
| ~~Trailblazer cuma 5 topik Vocabulary~~ — **DITUTUP §3F.6**, sekarang 10 topik | Genapkan 5→10 atas permintaan eksplisit user | Melebihi target baku (≥5) — bukan gap lagi |

**Urutan bertahap yang disarankan berikutnya** (belum dikerjakan, murni rekomendasi urutan, SEMUA di luar skill Vocabulary): (1) Listening Starter & Little Stars — menutup skill kedua yang PRD §4.1 janjikan utk kedua level ini, (2) Speaking/Grammar Starter — melengkapi 4 skill penuh level ini, (3) Listening/Speaking/Grammar/Reading Explorer/Adventurer/Achiever digenapkan ke ≥10 topik masing-masing.

---

## 7. Verifikasi

**🔒 SEKARANG OTOMATIS** (permintaan user, audit "verifikasi konten masih manual, rawan kelewat") — dulu dijalankan tiap sesi lewat skrip SEMENTARA (esbuild+node, TIDAK disimpan ke repo) yang ditulis ulang manual tiap sesi; sekarang `app/scripts/verify-vocab-content.mjs` (PERMANEN di repo) jadi bagian `npm run build` (`package.json`: `typecheck && verify:content && esbuild...`) — TIDAK BISA lagi lolos tanpa disadari selama build normal dijalankan. Cek yang sama seperti sebelumnya, tapi otomatis:

- **0 id topik Vocab bentrok** lintas SEMUA 6 level (Little Stars 12 + Starter 10 + Explorer 10 + Adventurer 13 + Achiever 10 + Trailblazer **10** = **65 id topik, semuanya unik**).
- **Semua 65 topik ≥10 kata** (syarat CLAUDE.md per-topik) — Trailblazer sekarang **10** topik (melebihi target baku ≥5, §3F.6), tiap topiknya sendiri tetap penuh 10 kata.
- **Semua ~650 kata** lolos cek `example.en` memuat `en` persis sebagai whole word (regex `\b<kata>\b`, case-insensitive) — syarat teknis `blankSentence()`. Satu bug ditemukan & diperbaiki di sesi Starter: item "Twin" (`orang-di-sekitarku`) awalnya punya contoh berbentuk jamak "They are twins." yang GAGAL match — diperbaiki jadi "This is my twin." (§2.2). Sesi Explorer, Adventurer, Achiever, Trailblazer (2 topik awal + 3 topik §3F.5 + 5 topik §3F.6) semua lolos verifikasi tanpa temuan bug baru (pelajaran dari bug Starter diterapkan preventif di semua kalimat sejak itu — bentuk dasar, bukan orang-ketiga-tunggal).
- `npm run typecheck` (`tsc --noEmit`, `app/` DAN `portal/` — dua project TypeScript terpisah) dan `npm run build` (`typecheck` → `verify:content` → `verify:duplicates` → esbuild) lulus tanpa error sesudah tiap sesi perubahan `content.ts`/`placement-scoring.ts`.
- **QA browser sesi Trailblazer lanjutan (3 topik baru, §3F.5)**: Menu Belajar Trailblazer "5 materi" (dari 2), kelima topik terlihat & terurut benar; `pendidikan-akademik`/`pendapat-pengalaman`/`hiburan-media` dicoba di Kenalan (10 baris @ masing², mini-game "🎮 MAIN · Dengar & Tunjuk" jalan mulus 4 opsi gambar polos); `pendapat-pengalaman` dicoba sampai Latihan Inti (distribusi 2/2/3/3 benar, 4 answer-card per soal) & Tantangan Eja Kata (kata "OPINION" 7 huruf tersusun benar dari bank acak). 0 error console di semua percobaan.
- **Sesi Trailblazer lanjutan lagi (5 topik baru, §3F.6)**: verifikasi struktural PENUH (typecheck, `verify:content`, `verify:duplicates`, esbuild build, plus skrip ad-hoc cek duplikat kata lintas 65 topik/duplikat kalimat & emoji dalam 1 topik/whole-word match — semua lolos, detail §3F.6) — **live browser QA TIDAK dijalankan** sesi ini (Playwright tidak ter-provision sbg dependency lokal saat itu). Dicatat eksplisit sbg keterbatasan, bukan diklaim "sudah dicoba di browser" begitu saja.
- **QA manual di browser** (dev server lokal, level anak dipaksa via localStorage + network route interception ke `portal/` API supaya lolos gerbang login tanpa menyentuh backend sungguhan):
  - Little Stars: Menu Belajar HANYA kartu Vocabulary, 12 topik terlihat, "Kenal Warna" dicoba end-to-end (Kenalan → mini-game → jawab → feedback non-punitive "Semangaaat! 💪") tanpa error console; topik "Bentuk" dicoba sampai Latihan Inti (10 soal) & Tantangan Eja Kata (kata "CIRCLE" tersusun benar dari chip huruf acak) — semua emoji kurang umum (🔷🥚➕➡️🌙) render bersih.
  - Starter: Menu Belajar HANYA kartu Vocabulary, 10 topik terlihat ("Angka 11–20" jadi teaser pertama di Beranda-Belajar), badge "🌱 Starter" & boss "🏰 Markas Raja Serigala" tampil benar; topik "Angka 11–20" dicoba — mini-game hitung menampilkan 16 emoji pisang berjajar utk soal "Sixteen" tanpa error/patah layout; topik "Orang di Sekitarku" dicoba sampai Tantangan Eja Kata — kata 8-huruf "NEIGHBOR" tersusun benar dari chip acak. Nol error console di kedua level.
  - Explorer: Menu Belajar tetap 4 kartu skill (Vocabulary/Listening/Speaking/Grammar — sudah ada sebelum sesi ini), Vocabulary sekarang "10 materi" (dari 3), semua 10 topik lama+baru terlihat di daftar; topik "Negara-negara Dunia" dicoba di Kenalan — 10 emoji bendera (🇮🇩🇬🇧🇺🇸🇯🇵🇨🇳🇰🇷🇫🇷🇦🇺🇮🇳🇩🇪) render bersih; topik "Kata Sifat & Lawan Kata" dicoba sampai Latihan Inti tipe kalimat — soal "My hands are ___." dgn clue 🧼 & pilihan Clean/Heavy/Long/Slow tampil benar (`blankSentence` berhasil nge-blank kata "Clean" dari kalimat). Nol error console.
  - Adventurer: Menu Belajar Vocabulary sekarang "13 materi" (dari 10), badge "🚀 Adventurer" tampil benar, semua 13 topik terlihat di daftar termasuk 3 topik baru; topik "Alam & Lingkungan" dicoba di Kenalan — 10 emoji (🪐🌍🚀🌲🌊🏜️🌋🏝️🏭♻️) render bersih; topik "Kata Kerja Sehari-hari" dicoba sampai Tantangan Eja Kata — kata "COOK" (4 huruf) tersusun benar dari 4 chip huruf acak (C/O/O/K). Nol error console.
  - Achiever: Menu Belajar Vocabulary "10 materi" (dari 0), badge "🏆 Achiever" & boss "🏰 Markas Raja Elang" tampil benar, semua 10 topik terlihat; topik "Teknologi & Internet" dicoba di Kenalan — 10 emoji perangkat (💻🌐🔗📧🔑⬇️⬆️🖥️⌨️🖱️) render bersih; topik "Angka Puluhan ke Atas" dicoba di mini-game — soal muncul sbg "Apa bahasa Inggrisnya 'Lima Puluh'?" + pilihan teks (Sixty/Seventy/Thousand/Fifty), BUKAN mini-game hitung gambar — mengonfirmasi `isNumberTopic()` dgn benar mendeteksi topik ini BUKAN topik angka (kata di luar `NUMBER_WORDS`) tanpa perlu ubah kode. Nol error console.
  - Trailblazer: Menu Belajar Vocabulary "2 materi" (dari 0, SENGAJA cuma 2), badge "✨ Trailblazer" & boss "🏰 Markas Raja Unicorn" tampil benar; topik "Bahasa & Komunikasi" dicoba di Kenalan — 10 kata termasuk yang terpanjang lintas SEMUA level ("Pronunciation" 13 huruf) render bersih; dicoba sampai Tantangan Eja Kata — kata "TRANSLATE" (9 huruf) tersusun benar dari 9 chip huruf acak. Nol error console — ini sesi TERAKHIR dari inisiatif 6-sesi, menandai Vocabulary tuntas di seluruh tangga level.

---

## Sumber Riset Web

### Little Stars (sesi 1)

- [12 Cambridge Starters Vocabulary Topics](https://flyer.us/cambridge-starters-vocabulary/)
- [Cambridge English: Young Learners — Wikipedia](https://en.wikipedia.org/wiki/Cambridge_English:_Young_Learners)
- [Playlearning™ Curriculum — Lingokids](https://lingokids.com/playlearning-curriculum)
- [Lingokids Lessons are Fun Learning Paths Backed by Experts](https://lingokids.com/blog/posts/lingokids-lessons-fun-learning-paths-backed-by-experts)
- [PEMBELAJARAN BAHASA INGGRIS DI TK – PAUD UMS](https://pg-paud.ums.ac.id/pembelajaran-bahasa-inggris-di-tk/)
- [6 Materi Bahasa Inggris Anak TK dan PAUD!](https://jagobahasa.com/for-kids/materi-bahasa-inggris-anak-tk-dan-paud/)
- [Top English Classes For Kids In Jakarta — Little Steps](https://www.littlestepsasia.com/jakarta/learn/after-school-activities/english-classes/)
- [The top 8 English courses for kids in Indonesia — IELC](https://ielc.co.id/en/the-top-8-english-courses-for-kids-in-indonesia/)
- [Themes for a Preschool Curriculum for ESL Students](https://www.brighthubeducation.com/esl-teaching-tips/121975-themes-in-a-preschool-esl-curriculum/)
- [ESL and 10 Common Preschool Themes — ITTT/TEFL Blog](https://www.teflcourse.net/blog/esl-and-10-common-preschool-themes/)
- [Best Early Learning Apps for Kids (PreK–2nd Grade) — Khan Academy](https://blog.khanacademy.org/best-early-learning-apps-for-kids/)
- [Endless Alphabet — dyslexiahelp.umich.edu](https://dyslexiahelp.umich.edu/latest/endless-alphabet/)

### Starter (sesi 2)

- [Cambridge Starters Vocabulary Topics — azvocab.ai (20 kategori + jumlah kata resmi per kategori)](https://blog.azvocab.ai/en/category/cambridge-english/starters/)
- [Pre A1 Starters | Cambridge English (halaman resmi)](https://www.cambridgeenglish.org/exams-and-tests/qualifications/young-learners/paper/starters/)
- [Pre A1 Starters, A1 Movers and A2 Flyers Wordlists 2025 (PDF resmi)](https://www.cambridgeenglish.org/Images/506166-starters-movers-flyers-word-list-2025.pdf)
- [Capaian Pembelajaran Bahasa Inggris Kelas 1 & 2 SD (Fase A) Kurikulum Merdeka](https://wislah.com/capaian-pembelajaran-bahasa-inggris-kelas-1-2-sd-fase-a-kurikulum-merdeka/)
- [EF High Flyers Teaching Methods for Kids](http://ef.englishtown.com/englishfirst/kids/highflyers/methods.aspx)
- [General English For 4 To 6 — Lembaga Bahasa LIA](https://lblia.com/kursus-bahasa-inggris-anak/)
- [8 kursus Bahasa Inggris terbaik untuk anak di Indonesia — IELC](https://ielc.co.id/8-kursus-bahasa-inggris-terbaik-untuk-anak-di-indonesia/)
- [Duolingo ABC Literacy App for Ages 3 to 7 — Imagination Soup](https://imaginationsoup.net/duolingo-abc-literacy-app/)
- [How to Choose the Best Reading Program for Your Kids — Reading Eggs](https://readingeggs.com/articles/best-reading-program-kids/)

Plus riset internal yang sudah ada sebelum dokumen ini: [RESEARCH.md](../RESEARCH.md) §3.4 (British Council Early Years/"Learning Time with Timmy"), §3.5 (EF band usia), §4.2 (lembaga kursus Indonesia), §11.1 (lanskap kompetitor app).

### Explorer (sesi 3)

- [Cambridge A1 Movers Vocabulary Topics — azvocab.ai (20 kategori + jumlah kata resmi per kategori)](https://blog.azvocab.ai/en/category/cambridge-english/movers/)
- [A1 Movers Cambridge vocabulary list — flyer.us](https://flyer.us/a1-movers-cambridge-vocabulary-list/)
- [Pre A1 Starters, A1 Movers and A2 Flyers Wordlists 2025 (PDF resmi)](https://www.cambridgeenglish.org/Images/739104-starters-movers-flyers-word-list-2025.pdf)
- [Preparing for A1 Movers | Cambridge English (halaman resmi)](https://www.cambridgeenglish.org/exams-and-tests/movers/preparation/)
- [CP Bahasa Inggris Fase B SD/MI Kelas 3 dan 4 Kurikulum Merdeka](https://www.pembelajaranmendalam.com/2025/12/cp-bahasa-inggris-fase-b-sd-mi-kelas-3-4-semester-1-2-kurmer-pm.html)
- [English for 8-9 year old kids — Novakid Junior Program](https://www.novakidschool.com/programs/education_8_9/)
- [Curriculum English for Kids — Cakap](https://cakap.com/en/curriculum/english-for-kids/)
- [ESL Vocabulary Topics A–Z — Twinkl](https://www.twinkl.com/resources/esl-resources/young-learners-0-12-esl-tefl-resources/vocab-topics-a-z-young-learners-0-12-esl-tefl-resources)

### Adventurer (sesi 4)

- [Cambridge A2 Flyers Vocabulary Topics — azvocab.ai (20 kategori + jumlah kata resmi per kategori)](https://blog.azvocab.ai/en/category/cambridge-english/flyers/)
- [CP Bahasa Inggris Fase C SD/MI Kelas 5 dan 6 Kurikulum Merdeka](https://www.pembelajaranmendalam.com/2025/12/cp-bahasa-inggris-fase-c-kelas-5-dan-6-sd-mi-semester-1-2-kurmer-pm-terbaru.html)
- [EF Trailblazers, 10-14 years old — learning system](http://ef.englishtown.com/englishfirst/courses/teens/trailblazers/learning.aspx)
- [English for 10-11 year old kids — Novakid](https://www.novakidschool.com/programs/education_10/)
- [Upper Elementary ESL Vocabulary — Study.com](https://study.com/academy/lesson/upper-elementary-esl-vocabulary.html)
- [Environment & Nature Lesson Plans — ESL Brains](https://eslbrains.com/lesson_topic/environment-nature/)

### Achiever (sesi 5)

- [Capaian Pembelajaran (CP) Bahasa Inggris Fase D Kurikulum Merdeka — Websiteedukasi.com](https://www.websiteedukasi.com/cp-bahasa-inggris-fase-d.html)
- [A2 Key and A2 Key for Schools vocabulary list (PDF resmi, Agustus 2025)](https://www.cambridgeenglish.org/images/506886-a2-key-2020-vocabulary-list.pdf)
- [EF Trailblazers, 10-14 years old — course](http://et1.ef-cdn.com/englishfirst/courses/teens/trailblazers.aspx)
- [Technology — Teens ESL Resources — Twinkl](https://www.twinkl.com/resources/teens-browse-by-level-esl-resources/browse-by-topic-teens-esl-resources/technology-browse-by-topic-teens-esl-resources)
- [Social Media Lesson Plans — ESL Brains](https://eslbrains.com/lesson_topic/social-media/)

Plus wordlist Cambridge A2 Flyers (azvocab.ai) yang sudah difetch lengkap di sesi Adventurer (§3D.2 di atas) — dipakai ulang tanpa fetch baru.

### Trailblazer (sesi 6 — TERAKHIR)

- [B1 Vocabulary Topics — examenglish.com (22 tema resmi PET)](https://www.examenglish.com/vocabulary/B1_vocabulary_topics.htm)
- [VOCABULARY LIST B1 Preliminary / B1 Preliminary for Schools (PDF resmi, Agustus 2025)](https://www.cambridgeenglish.org/Images/506887-b1-preliminary-vocabulary-list.pdf)
- [Round the world travellers — TeachingEnglish, British Council](https://www.teachingenglish.org.uk/teaching-resources/teaching-secondary/lesson-plans/intermediate-b1/round-world-travellers)
- [Travel — LearnEnglish Teens, British Council](https://learnenglishteens.britishcouncil.org/topics/travel/term)
- [B1 English level (intermediate) — LearnEnglish Teens, British Council](https://learnenglishteens.britishcouncil.org/english-levels/understand-english-level/b1-intermediate)
- [CP Bahasa Inggris Fase E Kurikulum Merdeka — Websiteedukasi.com](https://www.websiteedukasi.com/cp-bahasa-inggris-fase-e.html)

---

**Inisiatif "materi Vocabulary bertahap per level" SELESAI, lalu Trailblazer digenapkan lebih jauh** — 6 dari 6 level punya materi Vocabulary nyata (**65 topik, ~650 kata** setelah Trailblazer digenapkan 2→5 lalu 5→10, §3F.4/§3F.5/§3F.6), semua terverifikasi (id unik, whole-word match, 0 duplikat kata/kalimat/emoji dalam 1 topik, typecheck, build otomatis via `verify-vocab-content.mjs`). Gap yang tersisa (§6) semuanya di skill LAIN (Listening/Speaking/Grammar/Reading) — kalau user minta lanjut, itu scope baru di luar dokumen ini.
