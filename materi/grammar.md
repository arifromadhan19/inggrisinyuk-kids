# Materi Grammar — Analisis, Riset, & Roadmap per Level

Status: sesi 1 membangun format KEDUA `GrammarPatternTopic` utk Little Stars (1 topik). **Sesi 2** (permintaan user: audit "apa objective grammar, beda dari modul lain?" → "summary feedback... urutkan prioritas" → "apakah bisa implementasi feedback grammar? kemudian research di kompetitor... research materi grammar per level yang tepat dan implementasi sesuai feedback") — 2 pekerjaan sekaligus: (a) **fix 2 masalah objective/UX di format Little Stars** yang ditemukan lewat audit, (b) **riset & implementasi Grammar di 5 level tersisa** (Starter/Explorer/Adventurer/Achiever/Trailblazer).

Sesi 1 — permintaan user: "lakukan research bagaimana rule dan flow di modul grammar, lihat aplikasi kompetitor, lembaga bahasa inggris indonesia maupun luar negri tapi fokus ke dalam negri karena target market nya anak indonesia dan coba buat 1 materi di little stars", dengan syarat eksplisit di prompt yang sama: "pastikan jangan meniru 100%, wajib ada improvement dimana di fitur kenalan tetap ada fitur mic dan main".

Pola dokumen ini meniru `materi/speaking.md`/`materi/reading.md` (riset → keputusan desain → spesifikasi → verifikasi → gap).

---

## 0. Kenapa Format & Alur Grammar Beda-beda per Level? (SENGAJA, Bukan Belum Disinkronkan)

Pertanyaan yang sama yang sudah dijawab utk Listening (`materi/listening.md` §0) — kenapa 6 level Grammar pakai 3 bentuk soal beda ("format berdampingan"), bukan 1 bentuk yang sama rata? Jawabannya **SENGAJA**, tapi alasannya BEDA BENTUK dari Listening: Listening naik SATU tangga kompleksitas kognitif yang kontinu (kalimat tunggal → narasi → ekstraksi fakta → inferensi, 4 langkah berurutan). Grammar dipisah oleh **DUA SUMBU INDEPENDEN yang masing-masing cuma "pecah" SEKALI**, bukan satu tangga kontinu:

| Level | Format | Bentuk soal (Latihan Inti / Tantangan) | Kenapa cocok di level ini |
|---|---|---|---|
| Little Stars, Starter | KEDUA (`GrammarPatternTopic`, kontras biner audio+gambar, §2.3) | Dengar SATU dari 2 bentuk kalimat → tunjuk gambar yg cocok (Latihan Inti); gambar duluan → pilih ucapan yg cocok, arah DIBALIK (Tantangan) | Riset institusi Indonesia (LIA GEVYL/EF Small Stars/Kumon, §3.1) + Kurikulum Merdeka Fase Fondasi: **TIDAK ADA satu pun sumber yg mengajarkan rumus grammar eksplisit ke anak pra-baca** — semua pattern exposure murni audio+visual. Anak usia ini BELUM BISA baca kalimat sendiri, jadi format teks-first (LAMA) mustahil diturunkan ke sini (§1) — beda alasannya dari Listening yg levelnya berbeda krn KOMPLEKSITAS, bukan krn kemampuan baca. |
| Explorer, Adventurer, Achiever | LAMA (`GrammarTopic`, teks-first examples/scramble/fill, §2.2) | Baca+dengar contoh (Kenalan) → susun kata jadi kalimat (Latihan Inti) → lengkapi kalimat dari 3 pilihan, PERSONALISASI bukan quiz benar/salah (Tantangan) | **EF Indonesia "High Flyers" (7-9 th, PERSIS usia Explorer)** — institusi Indonesia PERTAMA di tangga usia yg tawarkan modul grammar eksplisit+sistematis "dalam bentuk kalimat" (§9.2) — anak sudah bisa baca sendiri, teks-first jadi VALID (bukan cuma warisan desain lama). Struktur naik CEFR tier per level (residual Pre-A1 Starters → A1 Movers penuh §17 → A2 Flyers penuh §18) TANPA perlu ganti mekanik — cukup genapkan konten (§9.1). |
| Trailblazer | KETIGA (`GrammarTransformTopic`, transformasi kalimat MCQ, §19) | Baca+dengar kutipan langsung → pilih hasil transformasi benar dari 4 opsi (Latihan Inti); kalimat hasil → tebak kutipan asli dari 4 opsi, arah DIBALIK (Tantangan) | **Cambridge B1 Preliminary (PET) MENGUJI struktur tier ini via "key-word sentence transformation"** (Writing Part 1 resmi, §9.1) — task shape yg GENUINELY tidak terjawab oleh scramble 1-kalimat (LAMA) ATAUPUN kontras 2-bentuk-tetap (KEDUA), krn transformasinya "terbuka" & aturannya beda per sub-pola (statement/question/command masing2 py aturan sendiri, §19.4). |

**2 sumbu yg masing-masing "pecah" SEKALI, bukan 1 tangga 4-langkah spt Listening**:
1. **Sumbu LITERASI** (bisa baca kalimat sendiri atau belum) — memisahkan format KEDUA (Little Stars/Starter, pra-baca) dari LAMA (Explorer/Adventurer/Achiever, sudah baca). Riset §3 (institusi 3-6 th) & §9.2 (institusi 7+ th) SAMA-SAMA independen mengonfirmasi titik potong ini — bukan diasumsikan, dicek per usia.
2. **Sumbu TASK-SHAPE UJIAN RESMI** (begitu struktur tier B1 butuh transformasi kalimat, bukan cuma susun/lengkapi) — memisahkan LAMA dari KETIGA, PERSIS di titik Trailblazer krn itu titik Cambridge sendiri mengganti bentuk soal resminya (PET Writing Part 1).
Ketiga level format LAMA (Explorer/Adventurer/Achiever) TIDAK naik format lagi walau CEFR tier-nya naik (Pre-A1→A1→A2) — krn sumbu #2 belum "pecah" di rentang itu (Cambridge Starters/Movers/Flyers semua masih diuji scramble/fill-style, key-word transformation baru muncul resmi di PET/B1). Ini beda dari Listening yg tiap naik 1 tingkat CEFR bisa jg naik 1 format (4 format utk 4 kelompok CEFR) — Grammar cuma naik format di 2 titik dari 6 level, krn cuma 2 sumbu yg relevan, bukan 1 tangga kontinu berdasarkan CEFR semata.

**Dikunci eksplisit supaya tidak "disatukan asal sama" tanpa alasan baru** (CLAUDE.md § "Grammar — 3 Format Berdampingan"): *"JANGAN migrasi format lama ke format lain tanpa arahan baru user"*. Preseden: Trailblazer DITANYA eksplisit ("ikuti default PRD §9 low-effort" VS "bangun format baru sentence-transformation ala PET") sebelum format KETIGA dibangun — bukan diasumsikan otomatis butuh format baru krn "levelnya paling tinggi".

**Yang MEMANG wajib disatukan (beda sumbu dari format/task-shape di atas): mekanik INTERAKSI — TAPI beda dari Listening, gap ini di Grammar BELUM TERTUTUP.** Format KEDUA (Little Stars/Starter) & format KETIGA (Trailblazer) SUDAH dibangun dgn tombol manual "Coba Lagi"/"Lanjut", hint (💡 Petunjuk khusus KETIGA, KEDUA sengaja tanpa hint krn soal biner 2-opsi — eliminasi otomatis bocor jawaban, §4.4), nada+confetti yg benar, non-punitive SEJAK AWAL dibangun. **Format LAMA (Explorer/Adventurer/Achiever) TIDAK ikut disentuh** — MASIH auto-advance (`setTimeout`) + TANPA hint + TANPA tombol retry manual (CLAUDE.md "Belum dikerjakan", §2.2) — beda dari Listening yg gap serupa SUDAH ditutup (`materi/listening.md` §2.2 sesi 7). Ini SATU-SATUNYA gap mekanik-interaksi yg TERSISA di SELURUH app (CLAUDE.md eksplisit mencatat ini "kandidat kuat sesi berikutnya kalau user minta lanjut, SATU-SATUNYA sisa gap serupa di seluruh app") — kalau user minta "perbaiki Grammar format lama" berikutnya, pola perbaikannya SAMA PERSIS dgn yg sudah dilakukan Listening/Speaking sesi lalu (retry manual+hint+nada, TANPA ubah 1 baris konten).

---

## 1. Ringkasan (TL;DR)

- **Format LAMA** (`GrammarTopic`: `examples`/`scramble`/`fill`) dipakai Explorer (3 topik) & Adventurer (1 topik) — anak menyusun/membaca kata tercetak sendiri (teks-first). TIDAK disentuh sesi ini.
- **Riset** (institusi Indonesia + Kurikulum Merdeka + Cambridge YLE + app kompetitor internasional) mengonfirmasi: **tidak ada satu pun sumber yang mengajarkan RUMUS grammar eksplisit ke anak 3–6 th** — semua memakai pattern exposure murni audio+gambar, tanpa penamaan istilah tata bahasa apa pun. Format lama (teks-first, anak menyusun kalimat) TIDAK BISA diturunkan ke Little Stars krn anak pralek belum bisa baca sendiri — butuh format baru, sama alasan `ReadingWordTopic`/`SpeakingPhraseTopic` tidak reuse format lama masing-masing.
- **Format KEDUA** (`GrammarPatternTopic`, BARU) — pola tunggal **singular vs plural** ("It's a car." / "They're cars." — **REVISI sesi audit**, lihat §8: versi awal "I see one car."/"I see two cars." py kata angka eksplisit di kedua bentuk, jadi bisa dijawab benar cuma dgn dengar "one"/"two" TANPA pernah perlu memperhatikan grammar-nya sama sekali), satu-satunya struktur grammar yang muncul di Cambridge YLE Starters DAN diajarkan lintas semua institusi/app yang diriset tanpa penamaan istilah ke anak.
- **1 topik dibangun**: "Satu atau Banyak? (One or Many?)" (id `satu-banyak`), 10 kata kendaraan dipetakan dari `VOCAB_TOPICS_LITTLE_STARS` topik `kendaraan` (belum dipakai Speaking/Reading Little Stars).
- **Improvement konkret** (permintaan user "wajib ada improvement"): tangga **2-ARAH** antara Latihan Inti (audio→gambar) dan Tantangan (gambar→audio, DIBALIK) — TIDAK dipunyai satu pun kompetitor yang diriset, semuanya cuma 1 arah "dengar lalu tunjuk gambar". Sama prinsip dgn tangga 2-arah Reading Little Stars (`materi/reading.md` §6).
- **Kenalan TETAP punya mic 🎤 dan main 🎮** (permintaan user eksplisit), REUSE PERSIS pola `renderKenalanWord`/`renderKenalanPhrase` (Reading/Speaking Little Stars) — 3 aksi per kata: 🔊 dengar kedua bentuk kalimat, 🎤 tirukan bentuk singular (skor proporsional + Play Suaramu, Aturan Wajib Speaking CLAUDE.md), 🎮 main (1 soal fokus kata itu, reuse shape Latihan Inti).
- **Diverifikasi hidup** di Chromium headless (Playwright) — 3 langkah dicoba end-to-end (Kenalan → mini-game → Latihan Inti 3 ronde → Tantangan 3 ronde via lompat stepper), 0 error konsol, feedback benar/salah & tombol Coba Lagi/Lanjut berfungsi.

## 2. Analisis Mekanik Grammar — 3 Format Berdampingan

### 2.1 Status konten per level (⚠️ snapshot SESI 1 di bawah ini SUPERSEDED — lihat §0 & §22 utk status TERKINI/final)

| Level | Format | Jumlah topik (sesi 1) | Jumlah topik (FINAL, §22) |
|---|---|---|---|
| Little Stars | KEDUA (`GrammarPatternTopic`) | 1 | **10/10 TUNTAS** |
| Starter | — | 0 | **10/10 TUNTAS** |
| Explorer | LAMA (`GrammarTopic`) | 3 | **10/10 TUNTAS** |
| Adventurer | LAMA (`GrammarTopic`) | 1 | **10/10 TUNTAS** |
| Achiever | — | 0 | **11/10 TUNTAS (melebihi target)** |
| Trailblazer | — | 0 | **10/10 (melebihi target BAKU ≥5, atas instruksi eksplisit user)** |

Baris "jumlah topik (sesi 1)" dipertahankan apa adanya sbg ARSIP historis (dokumen ini ditulis bertahap seiring sesi berjalan, bukan ditulis ulang tiap kali status berubah) — SELALU rujuk kolom FINAL atau §0/§22 utk status yg benar-benar berlaku sekarang.

### 2.2 Format LAMA (`GrammarTopic`) — Explorer/Adventurer, TIDAK disentuh sesi ini

`examples` (daftar kalimat contoh + emoji, dibaca via `renderKenalan`), `scramble` (susun kata jadi kalimat, `runLatihanInti`), `fill` (lengkapi kalimat dari 3 pilihan kata, `runTantangan`). Ketiganya masih auto-advance (`setTimeout`) + tanpa hint + tanpa tombol retry manual (CLAUDE.md "Belum dikerjakan") — di luar scope sesi ini, tidak disentuh sama sekali.

### 2.3 Format KEDUA (`GrammarPatternTopic`) — Little Stars, BARU sesi ini

`items: GrammarPatternItem[]`, tiap item = `en`/`id`/`emoji` (kata kunci, konsisten `VocabItem`) + `singular`/`plural` (2 field kalimat terpisah, BUKAN 1 kalimat + auto-pluralize kode — sebagian kata py bentuk jamak tidak beraturan, mis. "bus"→"buses", jadi ditulis manual per item).

3 langkah:
1. **Kenalan** — daftar 10 kata, 3 aksi per baris (🔊/🎤/🎮).
2. **Latihan Inti "👂 Dengar & Tunjuk"** — 10 soal, dengar SATU bentuk kalimat (singular/plural diacak 5:5), tunjuk gambar JUMLAH (1 vs 2) yang cocok. Audio→gambar.
3. **Tantangan "🔎 Lihat & Dengar, Pilih yang Pas"** — 10 soal, ARAH DIBALIK: gambar jumlah jadi stimulus duluan, pilih dari 2 ucapan (🔊 A / 🔊 B) yang cocok. Gambar→audio.

## 3. Riset: Rule/Flow Grammar yang Tepat untuk Little Stars (3–6 th)

### 3.1 Institusi Bahasa Inggris Indonesia (3–6 th)

- **LIA GEVYL** (General English for Young Learners) — materi "cover vocabulary, pronunciation, spelling, and grammar" tapi disampaikan lewat "diverse exercises and games", bukan unit rumus terpisah — grammar menyatu ke aktivitas tematik.
- **EF Small Stars** (ages 3–6) — metode "Efekta System": lagu, video cerita, boneka tangan, tie-in acara TV. Grammar "berkembang" sbg bagian paparan bahasa holistik, dibingkai "Learning to Learn" mengikuti tahap kognitif alami — bukan diajarkan sbg rumus terpisah.
- **Kumon EFL** (mulai umur 2) — urutan eksplisit: anak memahami STRUKTUR kalimat dulu lewat "Look, Listen and Repeat" (audio+ilustrasi dipasangkan), baru kemudian latihan grammar diperkenalkan setelah fondasi lisan/baca ada — bukan grammar duluan.

**Kesimpulan**: ketiga institusi Indonesia konsisten — TIDAK ADA yang mengajarkan rumus grammar eksplisit ke anak 3–6 th, semuanya pattern exposure lewat audio+visual+repetisi.

### 3.2 Kurikulum Merdeka — Fase Fondasi

Sikap eksplisit: "buat anak senang dulu, baru pelan-pelan memahami struktur kalimat/grammar". Output Fase A (~usia 6–7, jenjang di atas Little Stars) baru berupa respons ke instruksi sederhana lewat gestur/bantuan visual, jawaban frasa/kata pendek — **tanpa istilah grammar apa pun** bahkan di jenjang literasi Bahasa Indonesia sendiri (native language).

### 3.3 Cambridge Young Learners English (YLE) — Struktur Grammar per Level

Grammar Starters (Pre-A1, exam usia 4–7 — SATU tingkat DI ATAS Little Stars) menurut daftar struktur resmi Cambridge sudah mencakup: **kata benda singular/plural (reguler + sebagian irreguler)**, demonstrative ("this is an apple"), possessive adjectives, kata ganti orang, present simple positif/negatif/tanya/imperatif — SEMUA diuji lewat **dengar-lalu-tunjuk, mencocokkan, mewarnai**, TIDAK PERNAH lewat metabahasa/istilah. Movers (tingkat berikutnya) baru menambah comparative, "have got", past simple.

**Kesimpulan**: karena Little Stars ada DI BAWAH Starters, cuma irisan paling sederhana yang relevan — singular/plural adalah satu-satunya struktur yang genuinely siap diperkenalkan di usia ini (this/that dan preposisi in/on/under jadi kandidat topik berikutnya, §7).

### 3.4 Kompetitor Internasional — App Grammar/Sentence-Structure Kids

| App | Pendekatan Grammar |
|---|---|
| Duolingo ABC | Plural "-s" muncul di dalam lesson phonics/decoding, bukan modul grammar terpisah — dibingkai sbg pola ejaan, bukan rumus |
| Endless Reader / Wordplay (Originator) | Sentence-puzzle: anak taruh 1 kata ke slot kalimat beranimasi, kalimatnya "beraksi" secara visual sbg bukti makna — fill-in-the-slot, TANPA nama produk "Endless Grammar" yang genuinely ada |
| British Council LearnEnglish Kids | Py game preposisi/kartu grammar, TAPI menyasar anak usia sekolah yang sudah bisa baca — bukan pralek |
| Lingokids | Grammar "invisible", tertanam di mini-game bertema, tidak pernah dinamai eksplisit |
| Khan Academy Kids | Tidak py konten grammar khusus utk usia ini — fokus phonics/pembentukan kata/retell cerita |

**Kesimpulan**: pola task yang benar-benar dipakai lintas kompetitor untuk usia ini — sentence-frame slot-filling dgn animasi/gambar sbg bukti, dengar-lalu-tunjuk, drag kata/gambar ke slot — TIDAK PERNAH pilihan ganda teks tentang "rumus".

## 4. Keputusan Desain — Bukan Sekadar Tiru Kompetitor

### 4.1 Pola tunggal: singular vs plural (bukan campur banyak struktur sekaligus)

Riset §3.3 mengonfirmasi ini SATU-SATUNYA struktur grammar yang muncul di Cambridge YLE level TERDEKAT (Starters) dan diajarkan tanpa istilah di SEMUA institusi/app §3.1/§3.4 — dipilih drpd struktur lain (this/that, preposisi) supaya topik pertama punya justifikasi riset paling kuat; kandidat lain disisakan utk topik berikutnya (§7), bukan dicampur sekaligus di 1 topik (anak pralek butuh SATU kontras jelas per topik, bukan banyak pola sekaligus).

### 4.2 Tangga 2-ARAH: Latihan Inti (audio→gambar) vs Tantangan (gambar→audio, DIBALIK)

Permintaan user "wajib ada improvement" — SEMUA kompetitor yang diriset (§3.4) cuma py 1 arah tugas: dengar kalimat → tunjuk/pilih gambar. Tidak satu pun yang membalik arahnya. Tantangan di sini membalik: gambar JUMLAH (1 vs 2) ditampilkan DULU sbg stimulus, anak baru dengar 2 pilihan ucapan (🔊 A / 🔊 B, posisi diacak) dan pilih yang cocok — anak dipaksa mem-produksi PENGENALAN pola dari arah sebaliknya (gambar→bahasa, bukan cuma bahasa→gambar), bukan mengulang comprehension yang sama dua kali dgn kemasan beda. Prinsip identik dgn tangga 2-arah Reading Little Stars (`materi/reading.md` §6, kata→gambar lalu gambar→kata) dan tangga 3-shape Speaking Little Stars (`materi/speaking.md` §4.1).

### 4.3 Kenalan mempertahankan KEDUA mic 🎤 DAN main 🎮 (permintaan user eksplisit)

Sama alasan §4.2 dokumen `materi/speaking.md`/`materi/reading.md`: permintaan user secara eksplisit meminta 2 fitur ini TIDAK hilang meski Kenalan konsepnya "cuma exposure". 🎤 diarahkan ke bentuk SINGULAR (lebih pendek, lebih pas utk ucapan pertama anak — bentuk plural "buses"/"trucks" dgn konsonan ganda lebih sulit diucapkan drpd bentuk dasarnya). 🎮 reuse PERSIS shape Latihan Inti (1 soal fokus 1 kata, balik ke daftar sesudahnya) — konsisten konvensi `runWordMiniGame`/`runPhraseMiniGame`, bukan bentuk soal baru ketiga.

### 4.4 Tidak ada "💡 Petunjuk" di Latihan Inti/Tantangan (soal biner 2 opsi)

Beda dari Vocab/Listening/Reading (yang py 3-4 opsi, eliminasi 2 opsi salah via hint), Grammar format ini SELALU 2 opsi (1 vs 2 gambar; 2 pilihan ucapan). Eliminasi 1 dari 2 opsi otomatis MEMBOCORKAN jawaban (sisa 1) — sama alasan Listening "Benar atau Salah" (`games/listening.ts`) juga sengaja tanpa hint. Bantuan yang tetap ada: retry non-punitive tanpa batas (`roundActionsHtml`) & replay audio kapan saja.

### 4.5 Skor mic proporsional + Play Suaramu (comply CLAUDE.md sejak awal)

`scorePatternMic()` (duplikat lokal pola `scoreMic` Speaking) — skor dari `wordMatchDetail()` (rasio kata kedengaran, BUKAN pass/fail longgar), + tombol "▶️ Play Suaramu" dari rekaman paralel `listenAndRecordOnce`. WAJIB krn Kenalan di sini py fitur mic (Aturan Wajib Speaking, CLAUDE.md).

## 5. Spesifikasi Little Stars — Diimplementasikan

**Lokasi kode**: `app/src/types.ts` (`GrammarPatternForm`/`GrammarPatternItem`/`GrammarPatternTopic`/`AnyGrammarTopic`), `app/src/content.ts` (`GRAMMAR_TOPICS_LITTLE_STARS`, `GRAMMAR_TOPICS_BY_LEVEL` diperlebar jadi `AnyGrammarTopic[]`), `app/src/games/grammar.ts` (`renderKenalanPattern`/`runLatihanIntiPattern`/`runTantanganPattern` + helper lokal), `app/src/app.ts` (dispatch `'items' in topic` di `runStage`/`runFreePlayRound`, cabang `topicProgressPercent` baru), `app/src/progress.ts` (`grammarTopicPercent`, pola sama `readingTopicPercent`), `app/src/games/boss.ts` (adapter 1 baris `grammarScrambles`).

| Topik | Id | Sumber Vocab | Kata |
|---|---|---|---|
| Satu atau Banyak? (One or Many?) | `satu-banyak` | `kendaraan` (Vocab Little Stars) | Car, Bus, Bike, Train, Airplane, Boat, Truck, Fire Truck, Ambulance, Helicopter |

**Keputusan authoring**:
- Sumber kata dipilih dari `kendaraan` (Vehicles) — `salam-sopan-santun` sudah dipakai Speaking, `hewan-peliharaan` sudah dipakai Reading, dan 9/10 kata kendaraan berpluralisasi beraturan ("-s", cuma "bus"→"buses" tidak beraturan) sehingga anak fokus ke KONTRAS satu-vs-banyak, bukan kerumitan ejaan/pelafalan jamak.
- Id topik `satu-banyak` SENGAJA beda dari id Vocab sumbernya (`kendaraan`) — konvensi sama Listening/Reading/Speaking Little Stars, walau aman dari tabrakan progres krn key `${skill}:${topicId}:${section}` sudah py awalan skill.
- Plan Latihan Inti/Tantangan (`buildPatternPlan`) memakai `LatihanPlanSlot.kind` union yang sama dgn Vocab (`'hear'|'toEn'|'toId'|'sentence'`) SEKADAR label internal — `'hear'`=singular, `'toEn'`=plural, tidak dipakai secara semantik (pola peminjaman label yang sudah dipakai Reading/Listening).
- Progress percent pakai `grammarTopicPercent` (section granular per-soal), BUKAN fallback `isStepVisited` — konsisten dgn revisi Reading terbaru (`readingTopicPercent`), bukan Speaking (yang masih fallback kasar, di luar scope sesi ini).

## 6. Verifikasi

- `npm run typecheck` — lolos, 0 error.
- `npm run build` (typecheck + `verify:content` + esbuild bundle) — lolos, 480.5kb.
- Diuji hidup di Chromium headless (`playwright-core`, dev server `npm run dev` di `127.0.0.1:8000`), viewport mobile 420×900, level anak dipaksa Little Stars via `localStorage` (`inggrisinyuk-kids.account.v1`):
  - Kenalan: 10 baris kata, 3 aksi (🔊/🎤/🎮) tampil semua; 🔊 & 🎮 dicoba, mini-game menampilkan 2 kartu jumlah gambar, feedback "Hebaaat! 🎉" + confetti muncul, kembali ke daftar via "Lanjut ➡️" berfungsi.
  - Latihan Inti "👂 Dengar & Tunjuk": quiz-dot 1–10 tampil, 3 ronde dicoba (feedback "Kereeen!"/"Mantaaap!"/"Dikit lagi!" — bahasa non-punitive konsisten CLAUDE.md), tombol "🔊 Dengar" dgn animasi `pt-cta` menyala.
  - Tantangan "🔎 Lihat & Dengar, Pilih yang Pas": lompat lewat stepper (tanpa lewat Latihan Inti dulu) berhasil (stepper tidak terkunci, konsisten CLAUDE.md), gambar jumlah (1 atau 2 emoji) tampil sbg stimulus SEBELUM 2 tombol audio 🔊 A/🔊 B, 3 ronde dicoba.
  - 0 error konsol/halaman sepanjang alur (2 `net::ERR_FAILED` yang tercatat murni dari route interception sengaja ke portal API saat testing, bukan bug aplikasi).

## 7. Gap yang Masih Terbuka — Sesi 1 (⚠️ status per-level SUPERSEDED, lihat §12)

- **1/10 topik** — target CLAUDE.md ≥10 topik/skill per level BELUM tercapai (sama seperti Reading/Speaking Little Stars saat pertama dibangun). Kandidat topik berikutnya dari struktur Cambridge Starters yang belum dipakai: **this/that** (demonstrative, dari topik Vocab `mainan`/`bentuk`), **preposisi in/on/under** (butuh topik Vocab baru — belum ada domain "posisi benda" di Little Stars), **possessive "my/your"** (dari topik `keluargaku`).
- ~~Starter/Explorer/Achiever/Trailblazer Grammar belum ada~~ — **DITUTUP sesi 2**, lihat §9/§10.
- **Format LAMA (Explorer/Adventurer)** masih auto-advance + tanpa hint (CLAUDE.md "Belum dikerjakan") — TIDAK disentuh sesi ini, gap yang sudah lama terdokumentasi, bukan regresi baru. TETAP belum ditutup di sesi 2 juga (cuma KONTEN yang ditambah, bukan mekaniknya).
- **`grammarTopicPercent` baru dipakai format KEDUA** — format lama tetap fallback `isStepVisited`, sama pola Reading/Listening format lama.

## 8. Revisi Sesi Audit — Fix Konten & UX Tantangan (permintaan user: audit "apa objective grammar, beda dari modul lain?" → "summary feedback... urutkan prioritas" → "implementasi feedback")

Dua perbaikan, prioritas tertinggi dari audit:

1. **[HIGH] Kalimat `en` dibongkar ulang, angka eksplisit dihapus** — versi sesi awal ("I see one car."/"I see two cars.") py kata "one"/"two" di KEDUA bentuk, jadi anak bisa jawab benar 100% cuma dgn dengar kata angkanya, TANPA PERNAH perlu memperhatikan akhiran "-s" atau "is"/"are" — task-nya jadi identik latihan dengar-angka (tumpang tindih persis dgn mini-game hitung Vocab `angka-pertama`), BUKAN grammar. Sekarang ("It's a car."/"They're cars.") satu-satunya sinyal pembeda PERSIS "is"/"are" + bentuk kata benda (artikel "a"/"an" vs bare plural) — tidak bisa lagi dijawab benar cuma dgn dengar angka. `id` (`Itu satu mobil.`/`Itu dua mobil.`) TETAP pakai kata bilangan — aman krn Indonesia tidak py penanda jamak gramatikal (kata bilangan MEMANG cara alami menyatakan jumlah di sana) & `id` cuma teks bantuan Kenalan, tidak pernah diuji di Latihan Inti/Tantangan.
2. **[MEDIUM] Tantangan: pisahkan "dengar" dari "commit jawaban"** — versi sesi awal, 1 tap opsi 🔊 A/🔊 B LANGSUNG memutar audio SEKALIGUS mengunci sbg jawaban final. Anak yang salah dengar SEKALI (bukan salah paham polanya) langsung dapat status salah utk ronde itu — beda dari semua skill lain di app ini yang SELALU menampilkan opsi (gambar/teks) dulu sebelum tap mengevaluasi. Sekarang 2 langkah: tap opsi mana pun = putar/ulang audio-nya & tandai "dipilih sementara" (`.opt-btn.selected`, boleh ganti pilihan/dengar ulang bebas, TIDAK mengevaluasi), tombol terpisah "✅ Pilih Jawaban Ini" (nonaktif sampai ada yg dipilih) yang benar-benar mengunci & mengevaluasi.
3. **[Ditunda, disepakati bukan prioritas]** Mic 🎤 Kenalan cuma melatih ucapan bentuk singular (bentuk plural spt "buses"/"trucks" tidak pernah dilatih lewat mic) — dicatat sbg batasan scope, bukan bug, TIDAK diperbaiki sesi ini.

Diverifikasi live (Playwright + Chromium headless): Kenalan menampilkan kalimat baru tanpa angka; Tantangan — tombol "✅ Pilih Jawaban Ini" nonaktif sebelum ada pilihan, opsi TETAP bisa ditap ulang (ganti ke B) setelah dengar A tanpa ke-lock/ke-evaluasi, feedback baru muncul & opsi baru terkunci SETELAH tombol confirm ditekan. 0 console error, `npm run build` lolos.

## 9. Riset Per-Level (Sesi 2) — Starter, Explorer, Adventurer, Achiever, Trailblazer

Permintaan user: "research di kompetitor aplikasi atau lembaga inggris indonesia maupun luar negri tapi utamakan dalam negri karena target market nya untuk anak indonesia, research materi grammar yang tepat per level". Prioritas riset: institusi Indonesia dulu, Cambridge YLE/Schools sbg backbone struktural (pemetaan lama PRD §3, tidak diputuskan ulang), kompetitor internasional sbg pembanding task format.

### 9.1 Cambridge YLE/Schools — Ladder Grammar per Tier (backbone struktural app ini)

- **Pre A1 Starters** (Little Stars/Starter) — sudah diriset sesi 1: singular/plural, this/that, have got, prepositions of place, present simple.
- **A1 Movers** (Adventurer) — TAMBAHAN vs Starters: **comparative/superlative adjectives**, "have got/had to", **past simple** (reguler+irreguler). `simple-past` (topik lama Adventurer) SUDAH menutup salah satu — comparatives BELUM diklaim topik manapun.
- **A2 Flyers** (Achiever) — TAMBAHAN vs Movers: **kontras present continuous VS present simple** (bukan continuous sendirian — KONTRASnya yang diuji), modal can't/must/mustn't, "there is/are" tingkat lanjut.
- **A2 Key (KET) → B1 Preliminary (PET)** (Trailblazer) — PET nambah struktur KUALITATIF baru: **passive voice**, **reported speech**, **2nd/3rd conditionals**, **relative clauses**, **past perfect**. Task resminya Cambridge PET Writing Part 1 = **key-word sentence transformation** (tulis ulang kalimat B supaya semakna dgn A, pakai 1 kata kunci) — BUKAN scramble/fill spt Starters/Movers.

### 9.2 Institusi Bahasa Inggris Indonesia per Usia

- **EF Indonesia "High Flyers" (7–9 th, = usia Explorer)** — TITIK PERTAMA di tangga usia Indonesia dgn komponen grammar EKSPLISIT & sistematis ("grammar sistematis dalam bentuk kalimat" tiap pelajaran, akses eksklusif GrammarPro®) — validasi kuat: format `GrammarTopic` (teks-first, contoh+scramble+fill) COCOK di usia ini, bukan cuma warisan desain lama.
- **Kumon Indonesia EFL** — eksplisit menyebut menjelang usia SMP (≈Achiever/Trailblazer) worksheet mulai "membangun pemahaman lebih mendalam soal penggunaan grammar yang benar" & "elemen gramatikal kalimat yang lebih kompleks" — konfirmasi independen (bukan cuma turunan Cambridge) bahwa kerja grammar eksplisit/drill memang pola yang DIHARAPKAN lokal di usia ini.
- **Kurikulum Merdeka Fase D (kelas 7–9, ≈Achiever/Trailblazer)** — SATU-SATUNYA fase yang menyebut istilah grammar SECARA NAMA dalam modul ajar resminya: **passive voice lintas tense** & **relative pronouns** (who/which/that/where/when) — konfirmasi konkret bahwa istilah grammar eksplisit memang mulai wajar diperkenalkan persis di titik Achiever→Trailblazer, bukan lebih awal.
- **The British Institute (TBI)** — grammar "diperkenalkan bertahap dgn feedback langsung" via lagu/cerita/aktivitas digital "mengikuti standar Cambridge" — konsisten pola implisit-dgn-feedback yang sudah dipakai format lama.
- **Wall Street English Indonesia** — kelas grammar KHUSUS/berdiri sendiri ("Grammar and Vocabulary in Action") baru muncul di tier Teen — konfirmasi lokal lain bahwa grammar sbg modul BERDIRI SENDIRI (bukan tertanam) baru relevan mendekati usia Trailblazer (12+), bukan lebih awal.

**Kesimpulan §9.2**: TIDAK ADA institusi Indonesia yang menyarankan format baru di Explorer/Adventurer/Achiever — semua mengonfirmasi format teks-first (`GrammarTopic`) TETAP tepat di rentang usia ini, tinggal konten/struktur grammar-nya yang perlu ditambah sesuai usia. Trailblazer beda — baru di situ "modul grammar berdiri sendiri" & istilah grammar eksplisit jadi wajar, sejalan dgn kebutuhan format sentence-transformation PET.

### 9.3 Kompetitor Internasional — Task Format per Kompleksitas

- **Duolingo** — hybrid: exposure implisit + "Smart Tips"/"Grammar Lessons" eksplisit muncul SETELAH kesalahan atau sebelum unit baru (bukan di depan) — model reveal-ringan yang relevan utk hint di format transform Trailblazer.
- **British Council LearnEnglish Kids** — tiap struktur (comparatives, present continuous, prepositions) py kartu referensi eksplisit + video + game gap-fill/sorting — benchmark kuat utk konten Explorer/Adventurer.
- **British Council LearnEnglish Teens (B1–B2)** — struktur passive/reported speech/modals py video dgn subtitle yg menyorot bentuk targetnya + latihan online — MIRIP register yang tepat utk Trailblazer, tapi TETAP dibuatkan MCQ (bukan menulis bebas) sesuai konvensi kid-friendly app ini.
- **Grammaropolis** — personifikasi 8 part-of-speech jadi karakter (lagu/video/kuis) — bukti istilah grammar BISA dikenalkan playful tanpa klinis begitu usianya cukup (Achiever/Trailblazer), TAPI TIDAK dipakai sesi ini (di luar scope, dicatat sbg ide masa depan).
- **Wordwall** — tool gamifikasi grammar drill (matching/anagram/gap-fill) paling umum dipakai guru/tutor Indonesia — konfirmasi independen bahwa mekanik scramble+fill `GrammarTopic` lama itu sendiri memang pola LOKAL yang familiar, bukan sekadar warisan desain awal app ini.

## 10. Keputusan & Spesifikasi Per Level (Sesi 2)

### 10.1 Starter — REUSE `GrammarPatternTopic`, kontras BARU "suka/tidak suka"

**Keputusan**: §9.1/§9.2 tidak menemukan alasan format baru di Starter (masih di bawah/setara Pre-A1 Starters, sama spt Little Stars) — REUSE PERSIS mekanik `GrammarPatternTopic`, TANPA kode baru KECUALI 1 hal: kontrasnya harus BEDA dari Little Stars (bukan cuma pengulangan singular/plural) supaya progres berjenjang genuinely ada. Struktur dipilih: **present simple positive vs negative** ("I like drawing."/"I don't like drawing.") — ada di daftar struktur Starters & PALING mudah dipetakan ke mekanik audio+gambar yang sudah ada via `contrastVisual:'polarity'` (lencana ✅/❌, BARU — 1 field opsional ditambah ke `GrammarPatternTopic`, types.ts).

**Spesifikasi**: `suka-tidak-suka` ("Suka atau Tidak Suka? (Like It or Not?)"), 10 kata dari Vocab `hobi` (My Hobbies) — dipilih krn SEMUA 10 kata SUDAH berbentuk gerund + py `example.en` "I like [hobi]." sendiri di data Vocab yang sudah ada (mis. `{ en: 'Drawing', example: { en: 'I like drawing.' } }`) — pola suka/tidak-suka ini genuinely NATIVE ke domainnya, bukan dipaksakan ke domain yang tidak cocok.

### 10.2 Explorer — Format LAMA divalidasi, +1 topik "Prepositions of Place"

**Keputusan**: §9.2 (EF High Flyers "grammar sistematis" persis di usia ini) + §9.3 (LearnEnglish Kids py kartu preposisi eksplisit) MENGONFIRMASI format `GrammarTopic` TETAP tepat — TIDAK butuh format baru, cukup topik baru. Struktur dipilih: **in/on/under** (belum diklaim `this-is`/`there-is`/`pronouns`).

**Spesifikasi**: `prepositions-of-place` ("Preposisi Tempat (In, On, Under)"), dari domain Vocab `peralatan-dapur` (Kitchen Tools) — benda dapur NATURAL diposisikan "in the bowl"/"on the table"/"under the shelf". Emoji opsi `fill` (⬆️/📦/⬇️) proxy visual preposisinya sendiri (preposisi tidak py "benda"-nya sendiri spt topik lain).

### 10.3 Adventurer — Format LAMA divalidasi, +1 topik "Comparatives"

**Keputusan**: `simple-past` (topik lama) sudah PERSIS menutup 1 dari 2 struktur besar Movers — sesi ini menutup yang SATU LAGI: **comparative/superlative** ("bigger than"). Cambridge Movers RESMI memakai domain ukuran hewan utk soal comparative-nya sendiri — validasi kuat pemetaan ke `binatang`.

**Spesifikasi**: `comparatives` ("Kata Sifat Perbandingan (Comparatives)"), dari domain Vocab `binatang` (Animals) — "The elephant is bigger than the monkey.", dst.

### 10.4 Achiever — BARU dari nol, format LAMA + konten kontras "continuous vs simple"

**Keputusan**: A2 Flyers menambah **KONTRAS** present continuous vs simple (bukan continuous sendirian) — ini bisa dijawab `GrammarTopic` yang SAMA persis asal `examples` dikurasi SEBAGAI PASANGAN kontras ("every day" vs "right now" per aktivitas yang sama), bukan daftar kalimat lepas — pola "Format C+ via kurasi konten, bukan mekanik baru" yang sudah dipakai sesi Achiever Reading.

**Spesifikasi**: `continuous-vs-simple` ("Sedang vs Biasa Dilakukan"), dari domain Vocab `kata-kerja-lanjutan` (Advanced Actions) — tiap `examples` berpasang (mis. "I climb the tree every day." / "I am climbing the tree right now.").

### 10.5 Trailblazer — Format KETIGA BARU `GrammarTransformTopic`, ditanya eksplisit ke user

**Keputusan**: §9.1 mengonfirmasi struktur baru PET (passive/reported speech/conditionals) diuji Cambridge sendiri lewat KEY-WORD SENTENCE TRANSFORMATION — task shape yang genuinely TIDAK BISA dijawab `GrammarTopic` (scramble 1 kalimat/fill 1 kata TETAP) ATAUPUN `GrammarPatternTopic` (2 bentuk kalimat TETAP, bukan transformasi terbuka). **User ditanya eksplisit** (`AskUserQuestion`): "ikuti default PRD §9 low-effort (tanpa modul baru)" VS "bangun format baru sentence-transformation ala PET" — **user PILIH bangun format baru** (sama pola dgn precedent Listening/Speaking Trailblazer).

**Desain format**: `GrammarTransformTopic` (types.ts, BARU) — `transforms: GrammarTransformItem[]`, tiap item = kutipan LANGSUNG (`original`+`originalId`+`speaker`+`emoji`) + `reportedOptions: {text, ok}[]` (4 opsi hasil reported speech, distraktor ditulis MANUAL per item krn harus tetap relevan ke kutipan yang sama — menguji 3 kesalahan umum: lupa geser tense, kata ganti salah, tense salah total pakai "will"). Dibuat MCQ (`answerCardsHtml`-style teks, REUSE prinsip yang sama), BUKAN menulis bebas — konsisten kid-friendly filter CLAUDE.md (Cambridge asli minta anak MENULIS transformasinya, app ini minta TAP jawaban yang benar).

Topik pertama DIBATASI ke kalimat PERNYATAAN present simple saja (bukan pertanyaan "asked if"/perintah "told to" yang py aturan transformasi beda) — supaya anak tidak dibebani 3 pola sekaligus di topik pertama, sama prinsip "1 kontras per topik" yang dipakai format kedua.

**Spesifikasi**: `reported-speech` ("Reported Speech — Dia Bilang…"), 10 kutipan dari domain Vocab `bahasa-komunikasi` (Language & Communication) — tokoh fiktif membuat pernyataan TENTANG proses belajar bahasa mereka sendiri (fit tematik langsung, mis. Rani: "I study grammar every day." → "Rani said that she studied grammar every day."). 2 langkah, ARAH DIBALIK (konsisten prinsip tangga 2-arah format kedua): Latihan Inti "🔁 Ubah Jadi Reported Speech" (langsung→reported) lalu Tantangan "🔎 Siapa Bilang Apa?" (reported→langsung, opsi distraktor dari kutipan sesama item topik — pola sama `buildWordOptions` Reading, AMAN diambil dari sibling krn tugasnya "quote MANA" bukan "kesalahan grammar mana"). 4 opsi (bukan 2 biner spt format kedua) jadi "💡 Petunjuk" RELEVAN lagi di sini.

## 11. Verifikasi Sesi 2

- `npm run typecheck` & `npm run build` (termasuk `verify:content`) — lolos, 0 error, di setiap titik commit sesi ini (setelah rename `singular`/`plural`→`formA`/`formB`, setelah tiap level baru ditambah).
- Diuji hidup di Chromium headless (Playwright) utk KEENAM level sekaligus (loop 1 skrip, level di-set via `localStorage`):
  - **Little Stars** (regresi setelah rename formA/formB + generalisasi `contrastVisual`) — Latihan Inti/Tantangan TETAP identik perilakunya, 0 regresi.
  - **Starter** — Kenalan/Latihan Inti/Tantangan tampil, kartu kontras ✅/❌ (`contrastVisual:'polarity'`) render benar (dicek visual: emoji 🖌️ + badge ✅ hijau vs ❌ merah), feedback "Waaah! 🥳" muncul.
  - **Explorer** (topik ke-4 baru) — scramble "The spoon is in the bowl" jalan, chip tap berfungsi.
  - **Adventurer** (topik ke-2 baru) — Kenalan comparatives tampil (3 contoh elephant/giraffe/monkey), scramble jalan.
  - **Achiever** (topik BARU dari nol) — Latihan Inti/Tantangan lama jalan tanpa error.
  - **Trailblazer** (format BARU) — Kenalan menampilkan 10 pasangan kutipan+reported speech + tombol 🔊 per baris; Latihan Inti "🔁 Ubah Jadi Reported Speech" tampil quiz-dot 1-10, 4 kartu MCQ teks (termasuk 3 distraktor per-jenis-kesalahan), jawaban benar dipilih → feedback "Wonderful! 🎊"; Tantangan "🔎 Siapa Bilang Apa?" arah dibalik dicek via screenshot.
  - **0 console/page error** di SEMUA 6 level (2-3 `net::ERR_FAILED` per level yang tercatat murni dari route interception sengaja ke portal API saat testing, bukan bug aplikasi).

## 12. Gap yang Masih Terbuka — Sesi 2 (⚠️ status Little Stars SUPERSEDED, lihat §13)

- **Semua level masih di bawah target** (CLAUDE.md/PRD §16.14: ≥10 topik/skill utk Little Stars/Starter/Explorer/Adventurer/Achiever, ≥5 utk Trailblazer) — ~~Little Stars 1/10~~, Starter 1/10, Explorer 4/10, Adventurer 2/10, Achiever 1/10, **Trailblazer 1/5 (BELUM capai target Trailblazer sendiri yg lebih rendah)**. Kandidat berikutnya per level: Starter (this/that jadi kandidat kedua stlh suka/tidak-suka), Explorer (present continuous, have got, question words — sisa struktur Starters), Adventurer (past simple negative/question kalau belum dicoba, "have got/had to"), Achiever (modal can't/must/mustn't, there is/are lanjutan), Trailblazer (passive voice, conditionals, relative clauses — 8 kategori vocab `bahasa-komunikasi` residual masih tersisa, PALING mendesak dari semua gap krn target Trailblazer sendiri BELUM tercapai, beda dari level lain yg gap-nya "sesuai ekspektasi").
- **Format LAMA (Explorer/Adventurer/Achiever) mekaniknya TETAP tidak disentuh** (masih auto-advance + tanpa hint, CLAUDE.md "Belum dikerjakan") — sesi ini CUMA menambah konten, bukan mekanik. Kandidat kuat sesi berikutnya kalau user minta "perbaiki Grammar format lama" (pola sama Listening/Speaking yang sudah lebih dulu diperbaiki).
- **Trailblazer's `GrammarTransformTopic` progress percent TIDAK granular** — jatuh ke fallback `isStepVisited` (field topiknya `transforms`, bukan `items`, jadi tidak match cabang `grammarTopicPercent` yang sudah ada) — sama pola Speaking format Trailblazer yang juga belum granular; bisa ditambah `grammarTransformTopicPercent` terpisah kalau user minta presisi progress lebih tinggi di level ini.
- **Mic 🎤 Kenalan (format kedua) cuma melatih bentuk formA** — dicatat sesi 1, TETAP belum ditutup.

## 13. Little Stars Digenapkan 1→5 Topik (Sesi 3) — Riset Cambridge Structure List + 2 Varian Visual Baru (permintaan user: "secara flow sudah sesuai untuk grammar, lakukan research ke kompetitor aplikasi, lembaga bahasa inggris dalam dan luar indonesia, utamakan yang dalam indonesia... lakukan bertahap, saat ini lakukan untuk level little stars")

Beda dari sesi 1/2 (riset FORMAT per level) — sesi ini riset KONTEN: begitu mekanik (`GrammarPatternTopic`/format kedua) sudah stabil, fokus pindah ke menggenapkan JUMLAH topik menuju target ≥10, dimulai bertahap dari Little Stars (permintaan eksplisit "lakukan bertahap", bukan lompat ke semua level sekaligus spt sesi 2).

**Riset**: institusi Indonesia (LIA GEVYL, EF Small Stars, Kumon) dicek ulang — TIDAK ada yg mempublikasikan pola kalimat granular publik utk usia ini (cuma menegaskan filosofi TPR/implicit exposure, konsisten sesi 1). Sumber yg genuinely actionable: **Cambridge Assessment English "Handbook for Teachers" (2018) resmi** — daftar LENGKAP 23 kategori struktur Pre-A1 Starters (bukan cuma cuplikan spt sesi 1). Tiap kategori dicek fit-nya ke mekanik `formA`/`formB` + `contrastVisual` (kontras BINER + proxy visual statis SATU gambar) — cuma 4 dari 23 kategori genuinely reduce ke bentuk itu: **singular/plural** (sudah dibangun sesi 1), **have got** (kepemilikan), **can** (kemampuan), **this/that** (demonstrative jarak), **adjective ukuran** (big/small). Kategori lain (present continuous, prepositions of place, determiners, question words, dst) butuh proxy visual bergerak/scene/majemuk yang TIDAK cocok mekanik statis 1-gambar — dicatat sbg gap yg butuh format LAIN (kandidat Explorer teks-first atau mekanik baru lagi), BUKAN dipaksakan ke format ini.

**4 topik baru ditambahkan** (Little Stars sekarang 5/10):
1. `punya-tidak-punya` ("Punya atau Tidak? (Have I Got It?)") — "have got" posesif, `contrastVisual:'polarity'` **REUSE PERSIS** (struktur positif/negatif sama dgn `suka-tidak-suka` Starter, cuma kata kerja beda), dari Vocab `pakaian`.
2. `bisa-tidak-bisa` ("Bisa atau Tidak Bisa? (I Can or I Can't?)") — "can" kemampuan, `contrastVisual:'polarity'` **REUSE PERSIS**, dari Vocab `tubuhku` (kata kerja per item divariasikan touch/close/open/clap/brush mengikuti `example.en` asli tiap kata, bukan "touch" diulang 10x).
3. `ini-itu` ("Ini atau Itu? (This or That?)") — demonstrative this/that, `contrastVisual:'proximity'` **BARU** (gambar besar+🔍 dekat vs kecil+🔭 jauh — proxy JARAK), dari Vocab `mainan`.
4. `besar-kecil` ("Besar atau Kecil? (Big or Small?)") — adjective ukuran, `contrastVisual:'size'` **BARU** (gambar besar vs kecil TANPA lencana tambahan — ukurannya SENDIRI jadi konten, beda dari `'proximity'` yg pakai ukuran sbg proxy ke jarak), dari Vocab `bentuk`.

**2 varian `contrastVisual` baru** (`'proximity'`/`'size'`, types.ts `GrammarContrastVisual`) — perluasan `contrastVisualInner()` (`games/grammar.ts`), NOL perubahan ke mekanik Kenalan/Latihan Inti/Tantangan itu sendiri (persis alasan field ini dibuat generik sejak awal, §10.1). Sama seperti sebelumnya, TETAP jaga aturan "kalimat `en` tidak boleh py kata kunci yg membocorkan jawaban lewat jalur non-grammar" (pelajaran §8) — cek tiap pasangan formA/formB sesi ini: satu-satunya pembeda `punya-tidak-punya` adalah "'ve got"/"haven't got", `bisa-tidak-bisa` adalah "can"/"can't", `ini-itu` adalah "This"/"That", `besar-kecil` adalah "big"/"small" — tidak ada kata lain yg bocor.

**Diverifikasi live** (Playwright + Chromium headless) — 5 topik muncul di daftar Little Stars Grammar, Latihan Inti KEEMPAT topik baru dicek satu-satu (badge "👂 Dengar & Tunjuk" render benar di semua), kartu visual `'proximity'` (layangan besar+🔍 vs kecil+🔭) & `'size'` (telur besar vs kecil) dicek via screenshot — SESUAI desain, 0 error konsol. `npm run typecheck`/`npm run build` lolos (60 topik Vocab lolos verifikasi, naik dari 57 krn `verify:content` scoped ke Vocab bukan Grammar — angka ini tidak berubah krn perubahan Grammar, cuma dicatat kebetulan bersamaan dgn commit lain di repo bersama).

**Gap yg masih terbuka setelah sesi ini**: Little Stars 5/10 (setengah jalan) — kandidat topik ke-6+ butuh RISET BARU (possessive my/your dicatat sesi 1 tapi §7 sudah menilai butuh visual 2-karakter yg lebih rumit drpd proximity/size, belum confident direkomendasikan; kategori Cambridge lain SEMUA butuh format/mekanik baru, bukan tinggal isi konten). Level lain (Starter/Explorer/Adventurer/Achiever/Trailblazer) BELUM disentuh sesi ini — permintaan user eksplisit "bertahap," sesi berikutnya (kalau ada) lanjut ke level berikutnya.

## 14. Starter Digenapkan 1→4 Topik (Sesi 4) — Riset Cambridge Structure List + Varian Visual `'character'` BARU (permintaan user: "lakukan research ke kompetitor aplikasi, lembaga bahasa inggris dalam dan luar indonesia, utamakan yang dalam indonesia... lakukan bertahap, saat ini lakukan untuk level starter")

Pola SAMA PERSIS dgn §13 (riset KONTEN, bukan format) — bertahap lanjut ke level kedua setelah Little Stars. Institusi Indonesia (LIA GEVYL, EF Small Stars/English1, Kumon) dicek ulang, tetap tidak menemukan pola kalimat granular publik utk usia Starter — sumber actionable tetap Cambridge Pre-A1 Starters Handbook for Teachers (23 kategori struktur resmi, sama daftar dgn §13), disaring ke kategori yg belum diklaim Little Stars/Starter manapun DAN reduce bersih ke mekanik `formA`/`formB` biner.

**3 topik baru ditambahkan** (Starter sekarang 4/10):
1. `ada-apa-di-sini` ("Ada Apa di Sini? (There Is or There Are?)") — "there is/there are" utk keberadaan, struktur resmi Starters (dikonfirmasi jg Kurikulum Merdeka Fase A kelas 2 SD). `contrastVisual:'quantity'` **REUSE PERSIS** (singular/plural sama dgn `satu-banyak` Little Stars, cuma frame kalimat beda), dari Vocab Starter `serangga` (Insects). Lokasi "here" DIBUAT KONSTAN di semua 10 item (bukan divariasikan per serangga) — kalau lokasinya ikut beda-beda per item, itu jadi sinyal kedua yang bocor jawaban (pelajaran yg sama §8/§13).
2. `miliknya-siapa` ("Miliknya Siapa? (His or Hers?)") — possessive adjective his/her, struktur resmi Starters ("His name is Bill."). `contrastVisual:'character'` **BARU** (types.ts `GrammarContrastVisual`, lencana 👦 vs 👧 — proxy KARAKTER, beda dari 4 varian sebelumnya yg proxy jumlah/polaritas/jarak/ukuran), dari Vocab Starter `barang-di-rumah` (Things at Home). Teks Indonesia pakai "kakak laki-laki"/"kakak perempuan" (BUKAN "dia" yg netral gender) krn Indonesia tidak py padanan his/her — supaya teks tetap py sinyal gender selaras dgn lencana gambar.
3. `dia-siapa` ("Dia Laki-laki atau Perempuan? (He or She?)") — subject pronoun he/she + present simple orang-ketiga-tunggal, struktur resmi Starters. `contrastVisual:'character'` **REUSE PERSIS** topik 2 (lencana sama). Dipetakan dari Vocab Starter `alam-sekitar` (Nature, belum diklaim topik Reading/Speaking/Grammar lain), kata kerja per item divariasikan (see/watch/climb/smell/sit/swim/find) mengikuti kewajaran tiap benda alam.

**1 kandidat topik DIJATUHKAN** (bukan 4 topik spt Little Stars §13) — preposisi in/on/under (Starters resmi py kategori ini). Dicoba 3 pemetaan vocab berbeda (reuse `barang-di-rumah` yg sudah dipakai topik 2 → domain bentrok; `di-sekolah` → terlalu banyak item abstrak/orang yg tidak bisa "diposisikan"; `orang-di-sekitarku` dgn framing petak umpet → gambar org di bawah/dalam ruang terasa tidak nyaman utk anak). Tidak ada yg cukup bersih tanpa dipaksakan — didrop transparan drpd mengorbankan kualitas konten, dilaporkan apa adanya ke user (3 topik, bukan 4).

**Keputusan desain kunci** (dicek eksplisit sebelum implementasi, bukan diasumsikan):
- **Domain vocab diverifikasi via grep, bukan dipercaya mentah dari riset** — draft awal (dari riset) sempat mengusulkan `tempat-di-sekitar` (utk topik "I vs She") & `makanan-favoritku` (utk topik preposisi yg akhirnya didrop), TAPI keduanya SUDAH diklaim (`tempat-di-sekitar` oleh Reading Starter `baca-tempat`, `makanan-favoritku` oleh Speaking Starter `suka-makanan`) — ketahuan lewat grep independen thd `materi/*.md`/`content.ts`, bukan dari laporan agent riset itu sendiri. Diperbaiki dgn redesain topik 3 ke `alam-sekitar` & drop topik preposisi.
- **Framing "I vs She" direvisi jadi "He vs She"** — draft awal topik 3 dari riset memakai kontras org pertama ("I") vs org ketiga ("She"), TAPI lencana 👦 (BOY) utk mewakili "aku" (org pertama, tidak py gender tetap dari sudut pandang pemain) secara semantik tidak masuk akal. Direvisi jadi He vs She (org ketiga vs org ketiga) — lencana 👦/👧 tetap konsisten bermakna, DAN memungkinkan `contrastVisual:'character'` REUSE PERSIS dari topik `miliknya-siapa` (kata kerja tiap item tetap "+s" di kedua bentuk, satu-satunya pembeda kalimat murni "he"/"she").

**NOL perubahan mekanik** — `contrastVisualInner()` (`games/grammar.ts`) diperluas 1 cabang baru (`'character'`), tapi Kenalan/Latihan Inti/Tantangan itu sendiri tidak disentuh, persis pola §13.

**Diverifikasi live** (Playwright + Chromium headless) — 4 topik muncul di daftar Grammar Starter ("Suka atau Tidak Suka?"/"Ada Apa di Sini?"/"Miliknya Siapa?"/"Dia Laki-laki atau Perempuan?"), Latihan Inti KETIGA topik baru dicek satu-satu (badge "👂 DENGAR & TUNJUK" render benar di semua), kartu visual `'character'` (piring+🍽️/pohon+🌳 dgn lencana 👦 kecil di kartu kiri vs 👧 di kartu kanan) dicek via screenshot utk topik `miliknya-siapa` & `dia-siapa` — SESUAI desain, badge tampil jelas beda antar kartu. `npm run typecheck`/`npm run build` (termasuk `verify:content`, 60 topik Vocab tetap lolos) — 0 error. 9 `net::ERR_FAILED` tercatat murni dari route interception sengaja ke portal API saat reload halaman testing, bukan bug aplikasi.

**Gap yg masih terbuka setelah sesi ini**: Starter 4/10 — kandidat topik ke-5+ butuh RISET BARU (this/that dicatat §12 sbg kandidat kedua Starter TAPI sudah dipakai Little Stars `ini-itu`, kalau mau dipakai lagi di Starter butuh kontras kalimat yg genuinely beda drpd sekadar pengulangan; sisa kategori Cambridge Starters yg belum diklaim level manapun — present continuous/question words/prepositions selain in-on-under — SEMUA butuh proxy visual bergerak/scene yg tidak cocok mekanik statis 1-gambar, sama gap yg dicatat §13 utk Little Stars). Level lain (Explorer/Adventurer/Achiever/Trailblazer) BELUM disentuh sesi ini — sesi berikutnya (kalau ada) lanjut bertahap ke level berikutnya.

## 15. Explorer Digenapkan 4→8 Topik (Sesi 5) — Audit Format+Konten Existing + Riset Kategori Baru (permintaan user: "lakukan research ke kompetitor aplikasi, lembaga bahasa inggris dalam dan luar indonesia, utamakan yang dalam indonesia... lakukan bertahap, saat ini lakukan untuk level explorer / jika sudah ada audit apakah sudah sesuai dengan level ini atau belum")

Beda dari §13/§14 (Little Stars/Starter, format KEDUA) — sesi ini level PERTAMA format LAMA (`GrammarTopic`, teks-first) yg disentuh utk riset konten bertahap. User eksplisit minta AUDIT dulu thd konten existing sebelum nambah topik baru — dikerjakan lewat agent riset yg diberi TUGAS GANDA (audit + riset kandidat baru), bukan cuma riset searah spt sesi sebelumnya.

### 15.1 Audit — 4 Topik Existing Explorer

Verdict (dicek thd Cambridge Pre-A1 Starters Handbook for Teachers — 27 kategori struktur resmi, & institusi Indonesia EF "High Flyers" usia 7-9 = PERSIS usia Explorer, satu-satunya institusi Indonesia dgn modul grammar eksplisit+sistematis "dalam bentuk kalimat" di usia ini): **KEEMPAT topik existing (`this-is`/`there-is`/`pronouns`/`prepositions-of-place`) SUDAH tepat tier & format, TIDAK ADA yg perlu diganti/dihapus.** Format teks-first (`examples`/`scramble`/`fill`, masih auto-advance+tanpa hint) TETAP divalidasi cocok utk usia 7-9 (anak sudah bisa baca kalimat sendiri, EF High Flyers & British Council LearnEnglish Kids sama-sama pakai kartu grammar eksplisit persis di usia ini) — **BUKAN sesuatu yg perlu diperbaiki mekanik-nya sesi ini** (beda dari Listening/Speaking yg format lamanya sempat diperbaiki krn pelanggaran Aturan Wajib; Grammar format lama TIDAK melanggar aturan wajib apa pun, "Belum dikerjakan" CLAUDE.md tetap cuma soal auto-advance/hint, bukan cacat fungsional).

Satu catatan (bukan cacat, cuma observasi): `there-is` Explorer struktur PERSIS sama dgn `ada-apa-di-sini` Starter (§14) — TAPI beda FORMAT (Starter=audio+gambar biner, Explorer=teks-first scramble/fill) sehingga dianggap "spiral reinforcement" yg sah (anak ketemu struktur yg sama lewat modalitas beda&lebih sulit seiring naik level), BUKAN duplikasi kerja yg perlu dihapus — TIDAK diambil tindakan.

### 15.2 Riset — Kategori Baru utk Explorer

Sumber: Cambridge Pre-A1 Starters Handbook for Teachers (daftar lengkap 27 kategori, sama sumber yg dipakai §13/§14) disaring thd yg SUDAH diklaim Little Stars(5)+Starter(4)+Explorer sendiri(4) ≈13 slot struktur Pre-A1, + institusi Indonesia (Kurikulum Merdeka Fase B kelas 3-4 SD ≈usia 8-10, band kurikulum resmi PALING dekat usia Explorer) + kompetitor internasional (British Council LearnEnglish Kids, Wordwall).

**4 topik baru ditambahkan** (Explorer sekarang 4/10 → 8/10):
1. `present-continuous` ("Sedang Terjadi (Present Continuous)") — Starters kategori #6. Dikonfirmasi Kurikulum Merdeka Fase B & British Council LearnEnglish Kids yg py kategori "Grammar: present progressive" berdiri sendiri. BUKAN duplikat kontras `continuous-vs-simple` Achiever (itu KONTRAS continuous-vs-simple; ini pengenalan continuous POLOS, tangga di bawahnya) — juga struktur yg SEBELUMNYA dicatat §13 "butuh proxy visual bergerak yg tidak cocok mekanik biner Little Stars/Starter" — genap terisi lewat format teks-first Explorer yg justru pas utk itu. Dari domain Vocab `waktu-harian`, REUSE emoji persis (🌅/🌇/🌃).
2. `question-words` ("Kata Tanya Who, Where, What") — Starters kategori #13, kategori LAIN yg sama-sama dicatat §13 butuh format teks-first. Dari domain Vocab `keluarga`.
3. `would-like` ("Meminta dengan Sopan (Would Like)") — Starters kategori #20, register permintaan sopan (beda dari `suka-tidak-suka` Starter yg opini present-simple biasa). Dari domain Vocab `belanja-uang` (konteks toko/kasir).
4. `lets-suggestion` ("Ayo... (Let's...)") — Starters kategori #17, ajakan bersama frekuensi tinggi. Dari domain Vocab `pesta-perayaan`.

**2 kategori DIPERTIMBANGKAN TAPI TIDAK direkomendasikan** (dicatat riset, bukan lupa) — "have + object + infinitive" (#15) & "-ing forms as nouns" (#16): keduanya secara praktik lebih abstrak/dekat-Movers meski terdaftar di tier Starters, dinilai terlalu halus utk jadi topik berdiri sendiri di Explorer — disisakan sbg kandidat masa depan kalau ada riset lanjutan, bukan dipaksakan sesi ini.

### 15.3 Keputusan Desain — Batasan `runTantangan` yg Ditemukan Sesi Ini

Ditemukan SAAT authoring, bukan sebelumnya: `runTantangan` (format LAMA, `games/grammar.ts`) SELALU menambah `"."` literal di akhir kalimat yg dirakit dari `fill.before/after/options` (`sentence + '.'`, hardcoded, berlaku utk SEMUA topik format lama termasuk yg sudah ada sebelumnya) — jadi template `fill` TIDAK BISA berakhir sbg pertanyaan/seruan (akan menghasilkan tanda baca ganda janggal, mis. "...girl? ."). Ini membatasi desain `question-words` & `lets-suggestion`:
- `question-words`: `fill` SENGAJA menguji separuh JAWABAN ("She is my ___" → sister/aunt/cousin), BUKAN kata tanya itu sendiri — kata tanyanya sendiri tetap dilatih penuh lewat `examples` (teks statis, tanda baca bebas) & `scramble` (susun kata, tidak render kalimat jadi/tidak butuh tanda baca).
- `lets-suggestion`: `fill` berhenti di kata kerja polos ("Let's ___." → sing/dance/run) tanpa objek/tanda seru, supaya hasil rakitan tetap valid sbg pernyataan.
Kedua workaround ini TIDAK mengubah kode `runTantangan` itu sendiri (di luar scope — mengubah perilaku "+.'" berisiko regresi ke SEMUA topik format lama lain yg sudah ada, termasuk Adventurer/Achiever) — murni penyesuaian DESAIN KONTEN spy tetap benar dgn batasan kode yg ada. Dicatat di sini supaya sesi mendatang yg menambah topik format LAMA lain TIDAK mengulang jebakan yg sama (mis. topik imperatif/perintah lain yg templatnya secara alami berakhir "!").

**Diverifikasi live** (Playwright + Chromium headless) — 8 topik muncul di daftar Grammar Explorer, KEEMPAT topik baru dicek penuh 3 langkah: Kenalan (3 contoh+emoji+🔊 tampil benar, termasuk kalimat ber-"?" `question-words` yg render apa adanya tanpa masalah), Latihan Inti (badge "🎯 SUSUN KALIMAT", word-bank chip terisi benar dari `scramble.target`), Tantangan (badge "🌟 BIKIN SENDIRI", preview kalimat template tampil benar, pick opsi menghasilkan kalimat GRAMATIKAL lengkap dgn "." tunggal di akhir utk KEEMPAT topik — "She is sleeping."/"She is my sister."/"I would like some juice."/"Let's sing." — mengonfirmasi workaround §15.3 berhasil, tidak ada tanda baca ganda). `npm run typecheck`/`npm run build` (termasuk `verify:content`, 60 topik Vocab tetap lolos) — 0 error. 15 `net::ERR_FAILED` tercatat murni dari route interception sengaja ke portal API saat reload halaman testing, bukan bug aplikasi.

**Gap yg masih terbuka setelah sesi ini**: ~~Explorer 8/10~~ **DITUTUP §16 — Explorer 10/10.**

## 16. Explorer Digenapkan 8→10 Topik (Sesi 6) — Target ≥10/Skill TERCAPAI (permintaan user langsung: "is it possible to add 2 topics at the explorer level, bringing the total 10?")

Riset scoped SEMPIT (cuma 2 slot tersisa, bukan audit ulang penuh spt §15) — agent riset diberi tugas: cari ulang daftar 27 kategori resmi Cambridge Pre-A1 Starters Handbook for Teachers (sumber sama §15.2, diverifikasi ulang via exam-seekers.com), silangkan thd SEMUA struktur yg sudah diklaim (Little Stars 5 + Starter 4 + Explorer 8 + level lain), & pertimbangkan ulang 2 kategori yg sempat ditolak §15.2 ("have+obj+inf"/"-ing forms as nouns") — **verdict: tetap ditolak** (terlalu abstrak/dekat-Movers), tapi ditemukan **2 kandidat lebih bersih**: kategori #8 ("Can for requests/permission") & separuh WAKTU dari kategori #12 (yg separuh TEMPAT-nya sudah dipakai `prepositions-of-place`).

**2 topik baru ditambahkan** (Explorer sekarang 8/10 → **10/10, target CLAUDE.md TERCAPAI**):
9. `can-requests` ("Minta Izin dengan Sopan (Can I...?)") — Starters kategori #8, TERPISAH dari kategori #7 "Can for ability" yg sudah diklaim Little Stars `bisa-tidak-bisa` (fungsi pragmatik beda: MINTA IZIN vs menyatakan KEMAMPUAN, dua kategori resmi Cambridge yg berbeda, bukan duplikat). Dari domain Vocab `pesta-perayaan` (konteks pesta paling natural minta izin, sesuai contoh resmi Cambridge sendiri "Can I have some cake?").
10. `prepositions-of-time` ("Preposisi Waktu (In, At)") — separuh WAKTU dari kategori #12 yg sama dgn `prepositions-of-place` (Cambridge mendaftarnya sbg 1 kategori gabungan, app ini pisah jadi 2 topik krn muatannya beda total). Dari domain Vocab `waktu-harian`, REUSE emoji persis dari `present-continuous` (🌅/🌇/🌙) — dikonfirmasi British Council LearnEnglish Kids py unit "Prepositions of time" berdiri sendiri dgn contoh identik ("in the morning/evening"+"at night").

**Batasan `runTantangan` (§15.3) tetap dijaga** — `can-requests` fill menguji separuh JAWABAN pemberian izin ("Yes, you can have a ___" → balloon/cookie/present), BUKAN pertanyaannya sendiri (pola sama `question-words`/`lets-suggestion`); `prepositions-of-time` aman krn template `fill`-nya ("I like to read books ___" → in the morning/in the evening/at night) sudah natural berakhir sbg pernyataan tanpa perlu workaround tambahan.

**Diverifikasi live** (Playwright + Chromium headless) — Explorer Grammar topic count = 10 dikonfirmasi via `.topic-card` count; Tantangan KEDUA topik baru dicek: preview "Yes, you can have a ___" → pick → "Yes, you can have a balloon." (feedback "Keren, itu kalimatmu sendiri!"), "I like to read books ___" → pick → "I like to read books in the morning." — keduanya kalimat GRAMATIKAL utuh dgn "." tunggal, 0 tanda baca ganda. `npm run typecheck`/`npm run build` (termasuk `verify:content`) — 0 error.

**Explorer SEKARANG level KEDUA (setelah Vocabulary & Speaking, tapi PERTAMA di antara Listening/Reading/Grammar) yg mencapai 10/10 di skill Grammar.** Sesi berikutnya (kalau ada, lihat §17 di bawah — sudah dikerjakan BERBARENGAN dgn sesi ini) lanjut ke level lain.

## 17. Adventurer Digenapkan 2→10 Topik (Sesi 6, BERBARENGAN dgn §16) — Riset Cambridge A1 Movers + Institusi Indonesia (permintaan user: "research topic for adventurer level min 10, conduct research and explore competitors-specially english language institutions both within indonesia and abroad, prioritize institutions based in indonesia")

Beda dari §13-§16 (semuanya masih riset di TIER Pre-A1 Starters) — sesi ini PERTAMA riset penuh ke TIER Cambridge **A1 Movers** (backbone CEFR resmi Adventurer, `≈A1`, usia 9-11), krn `simple-past`+`comparatives` yg sudah ada baru menutup 2 dari BANYAK struktur baru yg ditambahkan Movers di atas Starters.

### 17.1 Riset

**Cambridge A1 Movers Handbook for Teachers** (struktur resmi, dikonfirmasi silang exam-seekers.com + flyer.us + mirror lain) — struktur BARU di atas Starters mencakup: indirect objects, comparative DAN superlative adjectives, past simple regular+irregular (SEMUA bentuk), verb+infinitive, **verb+-ing utk aktivitas** ("went riding"), infinitive of purpose, **modal must/mustn't**, **could** (kemampuan/persepsi lampau), shall (tawaran), adverbs of manner+frequency, **preposisi GERAKAN** (into/out of/over/under/through/across/along/past/down — perluasan dari preposisi statis Starters), conjunctions (because/so/but/or), kata tanya lanjutan (why/when/whose/how many/how much).

**Institusi Indonesia (prioritas utama, usia 9-11)**:
- **Kurikulum Merdeka Fase C** (kelas 5-6 SD) — CP resminya SECARA EKSPLISIT menyebut nama **"Simple Past Tense (untuk menceritakan pengalaman)"** DAN **"adjektiva komparatif dan superlatif (untuk melakukan perbandingan)"** sbg materi fase ini — konfirmasi langsung bahwa superlative & irregular past adalah prioritas TERTINGGI (separuh struktur yg BELUM ditutup 2 topik lama Adventurer).
- **EF Indonesia** — "High Flyers" (6-10 th, "GrammarPro" sistematis) baru beralih ke "Trailblazers" (10-14 th, "integrasi grammar+komunikasi") — Adventurer (9-11) persis di titik peralihan ini, artinya masih perlu KONSOLIDASI grammar sistematis (modal, tense-shift) sebelum beralih ke gaya komunikatif murni.
- **Kumon Indonesia EFL** — pasca level pra-baca (7A-2A) masuk fase "pemahaman grammar lebih mendalam" via worksheet — konsisten dgn pengenalan kontras modal (must/mustn't, could) & pergeseran tense (irregular past) di titik ini.
- **LIA GEYL** — 6 level mencakup kelas 1-6 SD, eksplisit "meningkatkan kemampuan grammar siswa secara sistematis" lewat game/cerita — validasi umum grammar terstruktur di usia SD atas.
- **TBI & Wall Street English Indonesia** — DICEK TAPI TIDAK DIPAKAI sbg sumber utama: tier grammar anak TBI baru mulai usia 12-15, WSE menyasar remaja/dewasa — keduanya belum py materi usia 9-11 spesifik.

**Kompetitor internasional (sekunder)**: British Council LearnEnglish Kids py halaman berdiri sendiri "Modals: must and mustn't" & "Comparatives and superlatives" persis di usia ini; Wordwall py volume besar game "modal verbs (must/may/might/could/can't)" & "comparative/superlative" — keduanya mengonfirmasi struktur ini DIANGGAP level dasar/pra-remaja, bukan lanjutan.

### 17.2 8 Topik Baru Ditambahkan (Adventurer sekarang 2/10 → **10/10, target CLAUDE.md TERCAPAI**)

3. `superlatives` ("Kata Sifat Superlatif") — separuh SUPERLATIF dari kategori yg sama dgn `comparatives` (Cambridge mendaftar comparative+superlative sbg 1 kategori gabungan). Dari domain `binatang`, REUSE PERSIS domain `comparatives` (kelanjutan langsung).
4. `past-simple-irregular` ("Kata Kerja Lampau Tidak Beraturan") — separuh IRREGULAR yg belum ditutup `simple-past` (cuma verb reguler: played/watched/visited). Dari domain `kata-kerja-harian` (go→went, eat→ate, see→saw, write→wrote).
5. `past-ability-could` ("Bisa di Masa Lalu (Could)") — perpanjangan LAMPAU dari `can` (kemampuan present, Little Stars). Dari domain `olahraga`.
6. `must-mustnt` ("Harus & Tidak Boleh") — modal yg BELUM ada di curriculum manapun. Dari domain `alat-sekolah`, dibingkai aturan kelas.
7. `go-plus-ing` ("Pergi Beraktivitas (Go + -ing)") — konstruksi tetap "pergi lalu beraktivitas", TERPISAH dari `like + -ing` opini (Starter `suka-tidak-suka`). Dari domain `alam-lingkungan`.
8. `prepositions-of-movement` ("Preposisi Gerakan") — kategori Movers TERPISAH dari preposisi statis Starters (`prepositions-of-place`/`prepositions-of-time` Explorer). Dari domain `transportasi`.
9. `adverbs-of-manner` ("Kata Keterangan Cara") — kelas struktur yg BELUM ada sama sekali di curriculum. Dari domain `perasaan` (happy→happily, sad→sadly, angry→angrily).
10. `because-reasons` ("Memberi Alasan (Because)") — konjungsi sebab-akibat yg BELUM ada sama sekali di curriculum. Dari domain `cuaca` (pasangan pakaian/tindakan↔cuaca).

**Batasan `runTantangan` (§15.3) diaudit ulang utk KESEMUA 8 topik** — TIDAK ada template `fill` yg berakhir tanya/seru, DAN (syarat tambahan yg baru eksplisit ditegaskan sesi ini) SEMUA 3 opsi tiap `fill` dicek harus SAMA-SAMA gramatikal saat disubstitusi (`runTantangan` tidak menilai benar/salah — merayakan pilihan APA PUN, jadi opsi yg salah secara tata bahasa akan tetap "dirayakan" & itu jadi cacat, bukan cuma soal tanda baca) — mis. `must-mustnt` awalnya draf riset pakai opsi "pencil case" (frasa 2-kata) DIUBAH jadi "pencil" (1 kata) sblm authoring, konsisten pola SEMUA opsi `fill` lain di curriculum yg selalu 1 kata/frasa pendek.

**Diverifikasi live** (Playwright + Chromium headless) — Adventurer Grammar topic count = 10 dikonfirmasi via `.topic-card` count; Tantangan KEDELAPAN topik baru dicek satu-satu, SEMUA preview→pick menghasilkan kalimat GRAMATIKAL utuh dgn "." tunggal (mis. "The giraffe is the tallest animal in the zoo.", "Yesterday, I wrote a letter to my grandma.", "Last year I could swim every morning.", "In class, you must bring your pencil.", "Last weekend, we went fishing near the lake.", "The boat sailed across the river.", "The kitten walked quietly across the room.", "I carry an umbrella because it is rainy.") — 0 tanda baca ganda, 0 opsi yg menghasilkan kalimat rusak. `npm run typecheck`/`npm run build` (termasuk `verify:content`, 60 topik Vocab tetap lolos, tidak terpengaruh) — 0 error. ID collision dicek independen (skrip Python custom, bkn cuma klaim agent riset) thd SEMUA 21 id Grammar yg sudah ada sebelumnya — 0 duplikat dari 10 id baru (2 Explorer + 8 Adventurer).

**Status akhir sesi 6**: Explorer 10/10 (§16) & Adventurer 10/10 (§17) TERCAPAI BERSAMAAN — Grammar sekarang py **3 level yg TUNTAS target ≥10** (Little Stars msh 5/10, Starter msh 4/10, **Explorer 10/10 BARU**, **Adventurer 10/10 BARU**, Achiever msh 1/10, Trailblazer msh 1/5 — target KHUSUS Trailblazer ≥5, BELUM tercapai). Level tersisa yg masih jauh dari target (Little Stars/Starter/Achiever/Trailblazer) jadi kandidat kuat sesi berikutnya kalau user minta lanjut.

## 18. Achiever Digenapkan 1→11 Topik (Sesi 7) — Riset Cambridge A2 Flyers + Koreksi Premis Kurikulum Merdeka Fase D (permintaan user: "research topic for Achiver level min 10, conduct research and explore competitors-specially english language institutions both within indonesia and abroad, prioritize institutions based in indonesia")

Pola sama §17 (riset PENUH ke tier CEFR yg jadi backbone level ini, bukan cuma genapkan sisa Pre-A1) — Achiever's backbone adalah **Cambridge A2 Flyers** (di atas A1 Movers yg sudah dituntaskan Adventurer §17), dikonfirmasi `continuous-vs-simple` yg sudah ada memang 1 dari struktur BARU resmi Flyers.

### 18.1 Koreksi Premis — Kurikulum Merdeka Fase D TIDAK Menyebut Passive Voice/Relative Pronouns Sedetail Diduga

Riset sesi 2 (`materi/grammar.md` §9.2) sempat mencatat "Kurikulum Merdeka Fase D... menyebut passive voice lintas tense & relative pronouns (who/which/that/where/when)" — **premis ini diberikan ke agent riset sesi ini sbg fakta, TAPI agent memverifikasi LANGSUNG ke dokumen CP Kemendikbud primer (via `static.perangkat-ajar.belajar.id`) & premis itu TIDAK TERBUKTI** — teks CP resmi Fase D sebenarnya cuma menyebut "simple and compound sentences", "present, future, and past tenses", "time markers, adverbs of frequency and common conjunctions", & (Menyimak-Berbicara) "giving opinions, making comparisons and stating preferences" — TIDAK ada penyebutan eksplisit "passive voice" atau "relative pronouns" spt yg dicatat sesi 2. **Dampak**: relative clauses (who/which/that) & full passive voice SENGAJA TIDAK dipakai sesi ini (juga dikonfirmasi TIDAK ada di tabel struktur resmi Cambridge Flyers sendiri — itu tier KET/PET) — dicatat sbg kandidat masa depan yg genuinely BUTUH riset baru, BUKAN salah ambil dari sesi ini. **Pelajaran metodologis**: klaim riset sesi LAMA (`materi/grammar.md` sesi 2) tidak otomatis dipercaya mentah2 sesi berikutnya kalau dipakai sbg premis desain baru — diverifikasi ulang ke sumber primer dulu, sama semangat dgn aturan memory "The memory says X exists is not the same as X exists now" walau ini riset internal dokumen, bukan memory lintas sesi.

### 18.2 Riset

**Cambridge A2 Flyers Handbook for Teachers (2018, tabel struktur resmi hlm.80)** — diverifikasi LANGSUNG dari dokumen PDF asli (bukan cuma ringkasan pihak ketiga) — struktur BARU di atas A1 Movers: past continuous, present perfect, be going to, will, might, may, shall (tawaran), could (SARAN — makna TERPISAH dari could kemampuan lampau Movers), should, tag questions, adverb "yet", conjunction "so", zero conditional (if-clauses), where-clauses, before/after-clauses, "be/look/sound/feel/taste/smell like", "make sb/sth + adj", "be made of". **Dikonfirmasi TIDAK ada di tabel**: relative clauses, quantifier SEBAGAI kategori grammar (cuma "much"/"a few"/"a little" muncul di daftar KOSAKATA, bukan tabel struktur), reflexive/possessive pronoun, indefinite pronoun, "as...as", sequencing adverbs, full passive voice, first conditional — SEMUA ini tier KET/PET atau tambahan kompetitor generik, sengaja TIDAK dipakai sesi ini.

**Institusi Indonesia (prioritas utama, usia 11-13)**:
- **Kurikulum Merdeka Fase D** (CP resmi, lihat §18.1) — mengonfirmasi "future tense" & konjungsi "because/so/when/but" (breakdown sekunder wislah.com) — mendukung `going-to-vs-will`/`so-result`.
- **EF Indonesia** — tangga tier terverifikasi: High Flyers (7-9 th) → **Trailblazers (10-13 th)** → Frontrunner (14+) — Achiever (11-13) persis di dalam tier "Trailblazers" EF sendiri, memperkuat usia ini siap bahasa modal/saran/opini yg lebih variatif (should/could/might).
- **The British Institute (TBI)** — program junior eksplisit 12-15 th, dibingkai "memperluas pengetahuan grammar & vocab" & "bicara/menulis lebih percaya diri & akurat" — generik tapi konsisten dgn menaikkan variasi modal/tense di usia ini.
- **Wall Street English Indonesia** — py modul "Grammar and Vocabulary in Action (GVA)" berdiri sendiri — konfirmasi grammar-forward instruction adalah standar di usia ini, TAPI tidak ditemukan daftar struktur per-tier yg dipublikasikan.
- **Kumon Indonesia EFL, LIA GEYL** — dikonfirmasi menyasar usia ini, TAPI TIDAK ditemukan scope-and-sequence terpublikasi per level — dicatat jujur sbg korroborasi TIPIS, bukan diklaim lebih dari yg sebenarnya ditemukan.

**Kompetitor internasional (sekunder)**: British Council LearnEnglish Kids py kategori relative clauses TAPI di tier Teens/intermediate, BUKAN core Kids A1-A2 — justru mengonfirmasi keputusan TIDAK memakai relative clauses sesi ini (§18.1).

### 18.3 10 Topik Baru Ditambahkan (Achiever sekarang 1/10 → **11/10, target CLAUDE.md TERLAMPAUI**)

2. `past-continuous` ("Sedang Terjadi di Masa Lalu") — beda dari `present-continuous` Explorer (present) & `continuous-vs-simple` (kontras present) yg sudah ada. Dari domain `tempat-di-kota`.
3. `present-perfect` ("Pernah atau Belum?") — struktur baru sepenuhnya. Dari domain `hiburan-waktu-luang`.
4. `going-to-vs-will` ("Rencana vs Keputusan Mendadak") — dual-sourced Kurikulum Merdeka "future tense", BUKAN duplikat `go-plus-ing` Adventurer (idiom "pergi beraktivitas", struktur beda total). Dari domain `mata-pelajaran`.
5. `should-vs-could` ("Saran & Pilihan") — `could` di sini bermakna SARAN, Cambridge sendiri mendaftar makna ini TERPISAH dari `past-ability-could` Adventurer (kemampuan lampau) — BUKAN duplikat walau kata sama. Dari domain `teknologi-internet`.
6. `might-possibility` ("Mungkin Saja") — struktur baru. Dari domain `arah-posisi`.
7. `so-result` ("Jadi, Akibatnya... (Conjunction So)") — dual-sourced Kurikulum Merdeka set konjungsi because/so/when/but, `because-reasons` sudah diklaim Adventurer, "so" (arah akibat, kebalikan "because") masih kosong. Dari domain `sifat-kepribadian`.
8. `look-like` ("Mirip Siapa? (Look Like)") — struktur baru ("be/look/sound/feel/taste/smell like"). Dari domain `ciri-ciri-fisik`.
9. `made-of` ("Terbuat dari Apa? (Be Made Of)") — chunk semi-pasif TERBATAS yg memang ada di tabel resmi Flyers (BUKAN full passive voice, itu tetap di luar scope §18.1). Dari domain `sifat-benda-lanjutan`.
10. `zero-conditional` ("Kalau... Maka...") — beda dari `because-reasons` Adventurer (konjungsi sebab, bukan klausa if). Dari domain `kata-kerja-lanjutan` (REUSE dari `continuous-vs-simple`).
11. `many-vs-much` ("Banyak yang Bisa Dihitung vs Tidak") — kontras countable/uncountable, Cambridge mendaftarnya di daftar KOSAKATA Flyers (bukan tabel struktur grammar) tapi genuinely konten baru di tier ini, dikonfirmasi pola umum British Council/Wordwall A1→A2. Dari domain `angka-puluhan`.

**Modal `must/mustn't`** (juga ada di tabel resmi Flyers) SENGAJA DILEWATI krn sudah diklaim Adventurer (§17) — dicek eksplisit di awal riset supaya tidak overlap lintas level walau Cambridge sendiri mendaftar struktur ini di kedua tier.

**2 topik py scramble yg SENGAJA mewakili KEDUA sisi kontras** (bukan cuma 1 sisi berulang, pola sama `continuous-vs-simple` yg sudah ada) — `going-to-vs-will` (1 scramble "going to", 1 scramble "will") & `many-vs-much` (1 scramble "many", 1 scramble "much"); `fill` masing2 tetap cuma 1 sisi (konsisten `continuous-vs-simple` yg fill-nya jg cuma sisi continuous, bukan pola baru).

**Diverifikasi live** (Playwright + Chromium headless) — Achiever Grammar topic count = 11 dikonfirmasi via `.topic-card` count; Tantangan KESEBELAS topik (termasuk `continuous-vs-simple` yg sudah ada, diuji ulang sbg regresi-check) dicek satu-satu, SEMUA preview→pick menghasilkan kalimat GRAMATIKAL utuh dgn "." tunggal (mis. "I was walking to the bank when it started to rain.", "I have never played chess.", "I am going to study math after school.", "You should charge your computer before school.", "She might turn left at the corner.", "Dio is very kind so everyone likes him.", "My brother looks like our dad.", "This toy is made of wood.", "If I feel scared, I hide.", "I have many friends at school.") — 0 tanda baca ganda, 0 opsi yg menghasilkan kalimat rusak. `npm run typecheck`/`npm run build` (termasuk `verify:content`, 60 topik Vocab tetap lolos) — 0 error. ID collision dicek independen (skrip Python, thd SELURUH id apa pun di `content.ts` termasuk Vocab/Listening/Speaking/Reading — superset check lebih ketat dari yg diperlukan) — 0 duplikat dari 10 id baru.

**Status akhir sesi 7**: Achiever 11/10 TERCAPAI (melebihi target minimal). Grammar sekarang py **4 dari 6 level TUNTAS target ≥10** (Little Stars msh 5/10, Starter msh 4/10, Explorer 10/10, Adventurer 10/10, **Achiever 11/10 BARU**, Trailblazer msh 1/5 — target KHUSUS Trailblazer ≥5, BELUM tercapai). Little Stars, Starter, & Trailblazer jadi 3 level tersisa yg masih di bawah target masing2 — kandidat kuat sesi berikutnya kalau user minta lanjut.

## 19. Trailblazer Digenapkan 1→10 Topik (Sesi 8) — Riset Cambridge B1 Preliminary Reported Speech + DEVIASI Target Level (permintaan user: "research topic for Trailblazer level min 10, conduct research and explore competitors-specially english language institutions both within indonesia and abroad, prioritize institutions based in indonesia")

### 19.1 Deviasi Target — "min 10" Trailblazer, BUKAN ≥5 Baku

Target BAKU Trailblazer (CLAUDE.md "Target Kelengkapan Konten per Modul" poin 1) adalah **≥5** topik/skill (lebih rendah dari 5 level lain yg ≥10), krn Trailblazer statusnya "jalur bonus" akses-usia (12+), bukan level utama placement test. **Permintaan user sesi ini EKSPLISIT "min 10"** — DEVIASI dari target baku, TAPI konsisten pola CLAUDE.md sendiri: aturan ≥5 berlaku KECUALI ada "arahan scope baru dari user" (persis kalimat di CLAUDE.md), & preseden SUDAH ada — Listening Trailblazer jg dibangun ke 10/10 penuh atas permintaan eksplisit user sebelumnya (bukan dibiarkan di ≥5). Grammar Trailblazer sesi ini mengikuti pola yg sama: 10/10 TERCAPAI, target baku ≥5 TIDAK berubah utk skill LAIN yg belum disentuh scope barunya (Vocab/Speaking/Reading Trailblazer TETAP ≥5, tidak ikut naik tanpa instruksi serupa).

### 19.2 Batasan Mekanik — SEMUA Topik Baru TETAP "Reported Speech" (Bukan Struktur PET Lain)

`GrammarTransformTopic` (format KETIGA, khusus Trailblazer) py 2 layar UI dgn teks HARDCODE, BUKAN dibaca dari field topik: Latihan Inti selalu berjudul "🔁 Ubah Jadi Reported Speech" & Tantangan selalu "🔎 Siapa Bilang Apa?" (`games/grammar.ts`, `runLatihanIntiTransform`/`runTantanganTransform`). Ini berarti topik format ini TIDAK BISA dipakai utk struktur PET lain (passive voice/conditional) tanpa mengubah kode UI — di luar scope sesi ini. **Untungnya reported speech sendiri SECARA RESMI Cambridge B1 Preliminary py banyak sub-pola dgn aturan transformasi beda-beda** (statement/question/command masing2 py aturan sendiri) — persis yg SUDAH diflag topik pertama sbg scope masa depan ("SENGAJA dibatasi ke kalimat pernyataan present simple saja... bukan campur pertanyaan/perintah yg py aturan beda: 'asked if'/'told to'"). Jadi 9 topik baru semuanya TETAP genuinely "reported speech", cuma sub-pola beda — nol perubahan kode `GrammarTransformItem`/`GrammarTransformTopic` (types.ts) ATAU fungsi render, MURNI kerja data (skema `{speaker, emoji, original, originalId, reportedOptions}` sudah cukup generik utk semua sub-pola, termasuk quote berbentuk pertanyaan/perintah — dicek eksplisit via `buildOriginalOptions`/render function yg SEPENUHNYA generik teks, tidak assume bentuk kalimat pernyataan).

### 19.3 Riset

**Cambridge B1 Preliminary (PET)** — reported speech diuji lewat key-word sentence transformation (Reading & Writing Part 1), TIDAK terbatas present-simple statement: tense-shift range lebih luas (past simple→past perfect, present continuous→past continuous, dikonfirmasi flo-joe PET practice set), modal backshift py tabel TERPISAH (can→could, will→would, must→had to, may→might — ilc.training/examenglish.com/Ready4Cambridge B1 grammar summary), reported YES/NO questions ("asked if/whether") & WH-questions RESMI diuji PET (item PET asli disurfacekan: "My friend asked me if I was ready", "I asked Sarah if she wanted to come..."), reported commands/requests jadi unit TERPISAH di British Council LearnEnglish (Teens/B1-B2 hub — bukan Kids), termasuk negative commands & pembeda command-vs-request, & shift waktu/tempat deiktik (now→then, here→there, dst) jadi bagian yg sama.

**Institusi Indonesia (prioritas utama, usia 12+/B1)**:
- **British Council Foundation Indonesia "Secondary Plus"** (usia 12-17, PERSIS band Trailblazer) — menarik dari kurikulum LearnEnglish Teens yg sama secara internasional (py unit reported speech B1-B2 berdiri sendiri) — link institusional Indonesia TERKUAT yg ditemukan.
- **Kurikulum Merdeka Fase F** (SMA kelas 11-12, per Keputusan BSKAP resmi 032/H/KR/2024) — mengonfirmasi target LEVEL B1 CEFR, TAPI struktur CP-nya berbasis genre teks (naratif/deskriptif/argumentatif), TIDAK menamai "reported speech" sbg unit spesifik — jujur dicatat sbg konfirmasi LEVEL saja, bukan poin grammar spesifik.
- **EF Indonesia "Frontrunner"** (14-18, dikonfirmasi tier SETELAH "Trailblazers" 10-13 EF sendiri) — target exam-prep & grammar sistematis kalimat, konsisten (bukan kontradiksi) dgn format sentence-transformation MCQ.
- **Wall Street English Indonesia** — eksplisit menyebut "present perfect continuous & past perfect" sbg milestone tier A2→B1 — korroborasi langsung utk topik past perfect.
- **TBI, LIA, Kumon Indonesia** — dikonfirmasi menyasar usia ini, TAPI tidak ditemukan silabus granular per grammar-point yg dipublikasikan — dicatat jujur sbg korroborasi TIPIS/directional saja.

### 19.4 9 Topik Baru Ditambahkan (Trailblazer sekarang 1/5 → **10/10, target user "min 10" TERCAPAI**)

Ke-10 karakter (Rani/Dimas/Sari/Budi/Wati/Andi/Lina/Doni/Maya/Fajar) di-REUSE PERSIS lintas SEMUA topik sbg pemeran (1 karakter per kutipan per topik, TANPA karakter baru) — konsisten pola "Bima" Speaking Trailblazer. **8 dari 9 topik SENGAJA menghindari kata deiktik** (di sini/sekarang/besok/kemarin/ini) supaya tiap topik menguji SATU aturan transformasi murni tanpa sinyal kedua yg bocor (pelajaran yg sama §8/§13) — HANYA topik ke-10 (`reported-time-place`) yg py kata deiktik, krn itu MEMANG fokus struktur topik ini.

1. `reported-continuous` ("Sedang Apa? (Continuous)") — present continuous→past continuous, morfologi "was/were+-ing" BEDA dari shift simple-past topik pertama. Dari domain Vocab `hiburan-media`.
2. `reported-past-perfect` ("Sudah Terjadi (Past Perfect)") — past simple→past perfect, "had+V3", dikonfirmasi flo-joe PET & Wall Street English Indonesia. Dari domain Vocab `perjalanan-wisata`.
3. `reported-modals` ("Bisa, Akan, Harus (Modals)") — can→could/will→would/must→had to/may→might, pergeseran MODAL bukan kata kerja utama, tabel Cambridge terpisah. Dari domain Vocab `pendapat-pengalaman`.
4. `reported-yesno-questions` ("Tanya Ya/Tidak (Asked If)") — konversi urutan kata tanya→pernyataan + sisip "if", struktur RESMI diuji PET langsung. Dari domain Vocab `pendidikan-kehidupan-akademik`.
5. `reported-wh-questions` ("Tanya Detail (Asked Wh-)") — sama konversi urutan kata tapi kata tanya TETAP dipakai (tanpa "if") — pembeda paling umum tertukar dgn topik 4. Dari domain Vocab `pendapat-pengalaman`.
6. `reported-requests` ("Minta Tolong (Asked To)") — permintaan sopan "Could/Can you...?" SECARA BENTUK mirip pertanyaan tapi FUNGSI-nya permintaan, konversi ke infinitive spt perintah BUKAN "asked if" — pembeda kunci dgn topik 4/5, British Council LearnEnglish eksplisit memisahkan "commands" dari "requests" sbg catatan grammar sendiri.
7. `reported-commands` ("Perintah (Told To)") — imperatif polos→infinitive "told to", konversi MOOD (bukan tense) — dimensi transformasi beda total dari semua topik sebelumnya. Dari domain Vocab `pendidikan-kehidupan-akademik`.
8. `reported-negative-commands` ("Larangan (Told Not To)") — sama konversi topik 7 + penempatan "not" (kesalahan khas: "not" hilang membalik makna, atau salah urutan "to not"). Dari domain Vocab `perjalanan-wisata`.
9. `reported-time-place` ("Waktu & Tempat Berubah (Time & Place Shift)") — CAPSTONE, shift kata deiktik (here→there/now→then/tomorrow→the next day/yesterday→the day before/this→that), dimensi KOSAKATA bukan morfologi verba, SENGAJA merekombinasi aturan tense topik 2 di beberapa item. Dari domain Vocab `bahasa-komunikasi` (REUSE topik pertama).

**Setiap item py distraktor 3-jenis KONSISTEN per topik** (bukan acak) — pola sama topik pertama: (1) aturan transformasi TIDAK diterapkan (lupa geser tense/modal/mood/kata deiktik), (2) kata ganti/objek salah, (3) kesalahan tipe-spesifik lain per sub-pola (tense/modal salah total, "to" hilang, "not" hilang/salah urutan, inversi tanya tidak dibuang). Semua 90 item baru (9 topik × 10 kutipan) ditulis manual (bukan digenerate), setiap `reportedOptions` dicek TEPAT 1 `ok:true` (diverifikasi independen via skrip Python, lihat §19.5).

### 19.5 Verifikasi

`npm run typecheck`/`npm run build` (termasuk `verify:content`, 60 topik Vocab tetap lolos, tidak terpengaruh) — 0 error, bundle naik ke 654.4kb. ID collision & integritas data dicek independen via skrip Python (bukan cuma klaim riset): 10 topik Trailblazer, MASING2 tepat 10 item, MASING2 tepat 10 `ok:true` (1 per item, tidak ada yg 0 atau 2+) — 0 duplikat id lintas SELURUH `content.ts`. **Diverifikasi live** (Playwright + Chromium headless) — topic count = 10 dikonfirmasi; SEMUA 10 topik dicek penuh 2 layar: Kenalan (kutipan+hasil transformasi tampil benar, termasuk kutipan berbentuk PERTANYAAN/PERINTAH yg render apa adanya tanpa masalah — mengonfirmasi mekanik generik §19.2), Latihan Inti "🔁 Ubah Jadi Reported Speech" (4 opsi MCQ tampil, badge benar di semua 10 topik), Tantangan "🔎 Siapa Bilang Apa?" (4 kutipan sibling sbg opsi, badge benar) — feedback benar/semangat muncul sesuai pilihan, 0 error konsol/halaman (`net::ERR_FAILED` yg tercatat murni dari route interception sengaja ke portal API, bukan bug aplikasi).

**Status akhir sesi 8**: Trailblazer Grammar 10/10 TERCAPAI (target user "min 10", DEVIASI SADAR dari target baku ≥5 level ini — lihat §19.1). Grammar sekarang py **5 dari 6 level TUNTAS target ≥10** (Little Stars msh 5/10, Starter msh 4/10, Explorer 10/10, Adventurer 10/10, Achiever 11/10, **Trailblazer 10/10 BARU** — melebihi target baku ≥5 atas instruksi eksplisit). **Little Stars & Starter jadi 2 SATU-SATUNYA level tersisa** yg masih di bawah target masing2 (keduanya format KEDUA `GrammarPatternTopic`, bukan format LAMA/KETIGA spt 4 level lain yg sudah tuntas) — kandidat kuat sesi berikutnya kalau user minta lanjut.

## 20. Little Stars Digenapkan 5→10 Topik (Sesi 9) — Kategori "Bersih" Sudah Habis, Riset Level-Baru dalam Kategori Terklaim + Varian Visual `'possessor'` BARU (permintaan user: "why grammar topic in little stars level not 10? conduct research to add 5 topic again")

### 20.1 Kenapa Little Stars Sempat Mentok 5/10

Beda dari Explorer/Adventurer/Achiever/Trailblazer (yg masing2 py TIER CEFR baru dgn kategori Cambridge yg genuinely belum tersentuh sama sekali), Little Stars & Starter berbagi TIER YANG SAMA (Cambridge Pre-A1 Starters) DAN format mekanik yg SAMA (`GrammarPatternTopic`, kontras 2-kalimat 1-gambar statis) — begitu kategori yg "bersih" (belum diklaim SAMA SEKALI & genuinely cocok mekanik 1-gambar statis) habis (§13 sudah catat ini eksplisit: "kategori Cambridge lain SEMUA butuh format/mekanik baru, bukan tinggal isi konten"), progres MENTOK bukan krn kurang usaha riset, tapi krn BATASAN STRUKTURAL GANDA: (a) daftar kategori resmi Cambridge Pre-A1 Starters TERBATAS (~21-27 kategori total, SEBAGIAN BESAR sudah diklaim lintas Little Stars+Starter+Explorer), (b) mekanik 1-gambar-statis TIDAK BISA merepresentasikan kategori yg butuh scene/gerakan/interaksi-multi-elemen (present continuous, prepositions, question words, dst — SEMUA ini SUDAH dipetakan ke Explorer's format teks-first yg tidak py batasan visual ini). Sesi ini KONFIRMASI ULANG batasan ini masih berlaku (audit ulang 5 kategori sisa: adverbs/conjunctions/impersonal-you/have+obj+inf/-ing-forms — SEMUA tetap butuh scene/terlalu abstrak, TIDAK dipaksakan), lalu cari jalan LAIN: STRUKTUR/PERSON/NOMOR baru DI DALAM kategori yg SUDAH tersentuh struktur LAIN (pola sama persis dgn `punya-tidak-punya`/`bisa-tidak-bisa` yg SUDAH sama-sama `'polarity'` tapi verb beda sejak sesi 1/3).

### 20.2 5 Topik Baru Ditambahkan (Little Stars sekarang 5/10 → **10/10, target CLAUDE.md TERCAPAI**)

6. `senang-tidak-senang` ("Senang atau Tidak? (I Am / I Am Not)") — kopula "to be" positif/negatif, verb yg BELUM PERNAH dipakai utk kontras polaritas di curriculum manapun (have-got/can/like semua verb LAIN). `contrastVisual:'polarity'` REUSE PERSIS. Dari domain Vocab `perasaanku`.
7. `mau-tidak-mau` ("Mau atau Tidak? (I Want / I Don't Want)") — verb "want" positif/negatif, SENGAJA register lebih LANGSUNG drpd `would-like` Explorer (permintaan sopan) — pola tangga sama dgn can-ability(Little Stars)/can-permission(Explorer). `contrastVisual:'polarity'` REUSE. Dari domain Vocab `buah-buahan`, artikel a/an/some dipetakan sesuai kata benda masing2 (apple/orange→an, watermelon/pineapple→some) supaya tetap alami.
8. `punya-siapa` ("Punya Siapa? (My or Your?)") — possessive adjective 1st/2nd person, kategori Starters resmi SAMA dgn `miliknya-siapa` Starter (his/her) tapi DEIKSIS beda total (pembicara/lawan bicara, bukan org ketiga). `contrastVisual:'possessor'` **BARU** (lencana 🙋 "Aku" vs 🫵 "Kamu") — kandidat ini SEMPAT DITOLAK sesi §13 krn dinilai "butuh visual 2-karakter lebih rumit", TAPI `'character'` (dibangun kemudian utk his/her Starter) TERBUKTI 1 lencana overlay di gambar statis sudah cukup — trik SAMA dipakai ulang di sini utk kontras pembicara, mengonfirmasi kandidat yg dulu ditolak BISA dibuka lagi begitu ada trik visual baru yg terbukti. Dari domain Vocab `keluargaku`.
9. `ini-itu-jamak` ("Ini-ini atau Itu-itu? (These or Those?)") — demonstrative JAMAK, kategori Starters resmi SAMA dgn `ini-itu` (tunggal) tapi NOMOR beda — anak pralek TIDAK otomatis menggeneralisasi tunggal→jamak tanpa dilatih terpisah (beda kata, bukan cuma tambah -s). `contrastVisual:'proximity'` REUSE PERSIS TANPA kode baru — emoji topik ini SENGAJA diulang 2x DI DALAM string `emoji` itu sendiri (mis. `'🍓🍓'`), krn renderer `'proximity'` cuma menaruh `emoji` mentah ke DOM tanpa logic duplikasi apa pun, jadi string yg sudah 2x otomatis tampil 2 item — TIDAK PERLU nyentuh `contrastVisualInner()`. Dari domain Vocab `kenal-warna`, warna+benda dipasangkan tapi warna itu sendiri TETAP SAMA di formA/formB (SATU-SATUNYA pembeda kalimat "These"/"Those") supaya tidak jadi sinyal kedua yg bocor (pelajaran §8).
10. `ada-tidak-ada` ("Ada atau Tidak Ada? (There Is / There Is No)") — eksistensi NEGATIF, kategori Starters resmi SAMA dgn `ada-apa-di-sini` Starter (there is/are) tapi sub-skill beda: NEGASI keberadaan, bukan tunggal-vs-jamak — lebih dekat ke cara anak kecil sungguhan memperoleh bahasa ("tidak ada ___!" duluan drpd bentuk jamak). `contrastVisual:'polarity'` REUSE (BUKAN `'quantity'`, krn yg diuji eksistensi bukan hitungan). Dari domain Vocab `hewan-peliharaan`, framing petak umpet.

**Overlap kategori Cambridge DISCLOSE TERBUKA, bukan disembunyikan** (konsisten precedent §15.1 utk `there-is`/`ada-apa-di-sini`) — topik 9 & 10 masing2 berbagi NOMOR KATEGORI resmi Cambridge dgn topik yg sudah ada (`ini-itu` & `ada-apa-di-sini` Starter), tapi STRUKTUR GRAMATIKAL SPESIFIK yg diuji genuinely baru (nomor jamak vs tunggal; negasi vs hitungan) & aturan leak-check ("cuma 1 kata yg beda antar formA/formB") tetap dijaga di seluruh 50 item baru.

### 20.3 Varian Visual `'possessor'` BARU

`GrammarContrastVisual` (types.ts) diperluas jadi 6 varian: `'quantity'`/`'polarity'`/`'proximity'`/`'size'`/`'character'`/**`'possessor'` BARU**. Render (`contrastVisualInner()`, `games/grammar.ts`) dapat 1 cabang baru (3 baris, PERSIS mirror `'character'`, lencana beda: 🙋 [formA]/🫵 [formB] gantiin 👦/👧) — NOL perubahan ke mekanik Kenalan/Latihan Inti/Tantangan lainnya, sama pola persis dgn saat `'proximity'`/`'size'`/`'character'` ditambahkan sesi lalu.

**Kandidat yg DITOLAK sesi ini** (dicatat riset, bukan lupa): "fast/slow" (dicek langsung ke wordlist resmi Cambridge Starters — TERNYATA baru muncul di A1 Movers, BUKAN Starters, jadi ditolak bukan dipaksakan naik tier); pasangan adjective lain (clean/dirty, long/short, new/old) — SEMUA butuh 2 EMOJI BEDA per formA/formB (bukan 1 emoji di-resize spt `besar-kecil`), yg berarti perubahan skema `GrammarPatternItem` (nambah field emoji kedua) — perubahan lebih besar drpd sekadar varian visual baru, TIDAK dikerjakan sesi ini tanpa arahan baru user.

### 20.4 Verifikasi

`npm run typecheck`/`npm run build` (termasuk `verify:content`, 60 topik Vocab tetap lolos) — 0 error, bundle naik ke 662.9kb. ID collision & integritas item dicek independen via skrip Python — 10 topik Little Stars, MASING2 tepat 10 item, 0 duplikat id. **Diverifikasi live** (Playwright + Chromium headless) — topic count = 10 dikonfirmasi, KELIMA topik baru dicek Latihan Inti (badge "👂 DENGAR & TUNJUK" benar di semua); visual `'possessor'` dicek via screenshot (lencana 🙋 vs 🫵 tampil jelas beda antar 2 kartu jawaban, emoji BARU 🫵 render normal tanpa kotak-patah di Chromium — dikonfirmasi aman dipakai), visual `'proximity'` dgn emoji ganda dicek via screenshot (2 awan besar+🔍 vs 2 awan kecil+🔭 tampil benar, membuktikan trik "emoji diulang di dalam string" jalan tanpa kode baru). 0 error konsol/halaman (`net::ERR_FAILED` yg tercatat murni route interception sengaja ke portal API).

**Status akhir sesi 9**: Little Stars Grammar 10/10 TERCAPAI. Grammar sekarang py **6 dari 6 level TUNTAS target masing2** (Little Stars 10/10 BARU, Starter msh 4/10, Explorer 10/10, Adventurer 10/10, Achiever 11/10, Trailblazer 10/10) — **Starter jadi SATU-SATUNYA level tersisa** di bawah target ≥10, kandidat kuat sesi berikutnya kalau user minta lanjut (kemungkinan pola sama: kategori "bersih" utk format KEDUA sudah menipis, perlu cari struktur/person/nomor baru di dalam kategori yg SUDAH tersentuh format lain, spt yg baru terbukti berhasil di sesi ini).

## 21. Starter Digenapkan 4→9 Topik (Sesi 10) — 1 Kandidat Riset Dijatuhkan krn Leak Ganda + Varian Visual `'inclusion'` BARU (permintaan user: "Do the same for level Starter, as there are still 4 topics")

Pola SAMA PERSIS dgn Little Stars §20 (bukan riset FORMAT, riset KONTEN — kategori "bersih" Cambridge Pre-A1 Starters sudah habis dipakai lintas Little Stars(10)+Starter(4)+Explorer(10)=24 slot, cari struktur/person/nomor baru DI DALAM kategori yg SUDAH tersentuh struktur lain).

### 21.1 6 Kandidat Diriset, 1 DIJATUHKAN

Agent riset awalnya mengusulkan 6 kandidat (target genap 4→10) — TAPI audit independen menemukan kandidat ke-6 ("some/any" quantifier, mis. "I've got some cake."/"I haven't got any cake.") CACAT STRUKTURAL: some/any TIDAK BISA ditukar bebas sambil mempertahankan polaritas kalimat tetap (scr gramatikal, "some" HANYA muncul di kalimat POSITIF & "any" HANYA di kalimat NEGATIF/tanya) — jadi kalimat formA/formB-nya SELALU py 2 SINYAL beda sekaligus (have-got/haven't-got DAN some/any), bukan 1. Anak bisa jawab benar 100% cuma dari sinyal have-got yg SUDAH dikuasai sejak `punya-tidak-punya` (Little Stars), TANPA PERNAH perlu memperhatikan some/any sama sekali — PERSIS pelajaran numeral-leak §8 ("I see one car."/"I see two cars." dulu bisa dijawab benar cuma dari kata angka, tanpa perlu parsing "is"/"are"). **Kandidat ini DIJATUHKAN**, bukan dipaksakan — Starter jadi 4→9 (BUKAN 4→10), dilaporkan jujur ke user drpd padding dgn topik yg gagal isolasi 1-sinyal.

**5 kandidat LOLOS audit ditambahkan** (Starter sekarang 4/10 → **9/10**):

5. `di-sini-di-sana` ("Di Sini atau Di Sana? (Here or There?)") — locative ADVERB "here/there", KELAS KATA beda dari `ini-itu` (Little Stars, demonstrative PRONOUN this/that) — Cambridge sendiri mendaftar keduanya sbg entri terpisah di bawah Adverbs of Place. `contrastVisual:'proximity'` REUSE PERSIS. Dari domain Vocab `tempat-di-sekitar`.
6. `kita-mereka` ("Kita atau Mereka? (We or They?)") — subject pronoun PLURAL "we/they", belum pernah dilatih (`character` cuma TUNGGAL org ketiga, `pronouns` Explorer cuma "I"). `contrastVisual:'inclusion'` **BARU** (lencana 🙋 "Kita" vs 👉 "Mereka", proxy GRUP TERMASUK vs DI LUAR pembicara). Dari domain Vocab `orang-di-sekitarku`. **Revisi authoring**: draf awal agent py 2 item "We are men."/"We are women." (role-play org dewasa gender tertentu) — DIGANTI "Cousin"/"Sibling" (netral, lebih natural diucapkan anak ttg diri sendiri) sblm masuk kode.
7. `lakukan-jangan-lakukan` ("Lakukan atau Jangan? (Do It or Don't?)") — imperatif positif/negatif, belum pernah dilatih (Explorer cuma py `lets-suggestion`/`can-requests`, BUKAN perintah polos). `contrastVisual:'polarity'` REUSE (✅/❌ dibaca "boleh/dilarang", metafora rambu). **BESPOKE tanpa domain Vocab** (pola sama topik generik awal Explorer `this-is`/`there-is`/`pronouns`) — draf awal coba domain `di-sekolah` (mis. "Jangan dengarkan gurumu!"/"Jangan main dgn temanmu!") TAPI melanggar filter kid-friendly (menegasikan otoritas/relasi sosial), diganti kosakata TPR netral (lompat/lari/duduk/dst) sblm masuk kode.
8. `perlu-tidak-perlu` ("Perlu atau Tidak Perlu? (Need or Don't Need?)") — verb "need" positif/negatif, BEDA dari `mau-tidak-mau` Little Stars ("want") — KEBUTUHAN vs KEINGINAN, distingsi genuinely bermakna utk anak Starter yg sedikit lebih besar drpd Little Stars. `contrastVisual:'polarity'` REUSE. Dari domain Vocab `di-sekolah`.
9. `milik-kita-milik-mereka` ("Milik Kita atau Milik Mereka? (Ours or Theirs?)") — possessive determiner PLURAL "our/their", pasangan struktural utk `kita-mereka` di atas (persis pola `dia-siapa`+`miliknya-siapa` yg sudah ada di level ini, versi PLURAL). `contrastVisual:'inclusion'` REUSE dari topik 6. Dari domain Vocab `makanan-favoritku` (BUKAN `barang-di-rumah` yg sudah diklaim `miliknya-siapa` — sengaja dihindari spy tetap 1-domain-1-topik konsisten dgn SEMUA topik Grammar lain lintas 6 level yg belum pernah reuse domain DALAM level yg sama).

### 21.2 Varian Visual `'inclusion'` BARU

`GrammarContrastVisual` (types.ts) diperluas jadi 7 varian: `.../'possessor'`/**`'inclusion'` BARU**. Render (`contrastVisualInner()`, `games/grammar.ts`) dapat 1 cabang baru (3 baris, mirror `'character'`/`'possessor'`, lencana 🙋 [formA]/👉 [formB]) — NOL perubahan mekanik lainnya. `'inclusion'` beda dari `'possessor'` (sesi Little Stars §20) krn `'possessor'` proxy org KE-2 TUNGGAL ("kamu"), sedangkan `'inclusion'` proxy GRUP/PLURAL (grup termasuk vs di luar pembicara) — dua dimensi deiksis yg genuinely beda meski lencananya kebetulan berbagi 🙋 utk sisi "termasuk pembicara".

### 21.3 Verifikasi

`npm run typecheck`/`npm run build` (termasuk `verify:content`, 60 topik Vocab tetap lolos) — 0 error, bundle naik ke 681.0kb. ID collision & integritas item dicek independen via skrip Python — 9 topik Starter total, MASING2 tepat 10 item, 0 duplikat id. **Diverifikasi live** (Playwright + Chromium headless) — topic count = 9 dikonfirmasi, KELIMA topik baru dicek Latihan Inti (badge "👂 DENGAR & TUNJUK" benar di semua); visual `'inclusion'` dicek via screenshot (lencana 🙋 vs 👉 tampil jelas beda antar 2 kartu jawaban taksi kuning). 0 error konsol/halaman (`net::ERR_FAILED` murni route interception sengaja ke portal API).

**Status akhir sesi 10**: Starter Grammar 9/10 — MENDEKATI target ≥10 tapi BELUM TERCAPAI PENUH (beda dari 5 level lain yg semuanya sudah TUNTAS), krn 1 kandidat sengaja dijatuhkan (§21.1) drpd dipaksakan. **Gap 1 topik terakhir ini genuinely butuh riset baru** (bukan tinggal comot kandidat yg sudah ada) — kandidat yg tersisa dari audit sesi ini (some/any) TIDAK bisa diperbaiki dgn tweak kecil krn cacatnya STRUKTURAL (bawaan tata bahasa Inggris sendiri, some/any terikat mati ke polaritas), jadi solusi hipotetis butuh pendekatan beda total (mis. visual/struktur baru yg genuinely lain, bukan variasi have-got lagi) — dicatat sbg gap terbuka utk sesi berikutnya kalau user minta lanjut, TIDAK diselesaikan asal-asalan sesi ini.

## 22. Starter Digenapkan 9→10 Topik (Sesi 11) — Topik ke-10 "Go" Polos, BUKAN "some/any" (permintaan user: "add 1 topic grammar in Starter level so the total is 10")

Beda dari sesi §21 (mencari sisa gap TANPA batasan jumlah, 1 kandidat gagal audit) — sesi ini SEMPIT: 1 topik terakhir, ditemukan LANGSUNG tanpa spawn agent riset terpisah (konteks sesi §21 masih penuh, cukup lanjutkan analisis yg sama tanpa re-derive dari nol).

**Kenapa BUKAN "some/any" yg diperbaiki**: cacatnya STRUKTURAL (some/any terikat mati ke polaritas have-got/haven't-got scr gramatikal Inggris sendiri, BUKAN soal pemilihan kata contoh) — tidak ada cara memperbaikinya dgn tweak kecil tanpa mengubah keseluruhan pendekatan, jadi dicari kandidat BARU dari nol, bukan "menyelamatkan" kandidat lama.

**Topik ke-10**: `pergi-tidak-pergi` ("Pergi atau Tidak Pergi? (I Go / I Don't Go?)") — verb "go" positif/negatif, struktur Cambridge Pre-A1 Starters (present simple verb list) yg belum pernah dipakai. `contrastVisual: 'polarity'` REUSE PERSIS, TANPA kode baru. **SENGAJA "go to + PLACE" polos** (present simple dasar), BUKAN "go + -ing" spt `go-plus-ing` Adventurer — itu struktur A1 Movers (tier lebih tinggi), memakainya di Starter (Pre-A1) akan melanggar pemetaan CEFR-tier yg sudah dikunci lintas level. **BESPOKE tanpa domain Vocab resmi** (pola sama `lakukan-jangan-lakukan` §21) — 2 domain Starter tersisa (`angka-11-20`/`hari-dalam-seminggu`) SUDAH dicek riset §21 & TIDAK survive utk struktur apa pun. Kosakata tempat (Sekolah/Rumah/Mal/Kolam Renang/Dokter Gigi/Bioskop/Pedesaan/Pusat Kota/Rumah Nenek/Pusat Kebugaran) SENGAJA dipilih BEDA dari `di-sini-di-sana` (Park/Zoo/Beach/Market/Hospital/Farm/Bridge/Playground/Street/Mountain) supaya anak tidak melihat 10 gambar yg SAMA PERSIS 2 topik berturut-turut. Leak-check: satu-satunya pembeda kalimat formA/formB persis "don't" — dicek konsisten di 10/10 item.

**Diverifikasi live** (Playwright + Chromium headless) — Starter Grammar topic count = 10 dikonfirmasi, Latihan Inti topik baru dicek (badge "👂 DENGAR & TUNJUK" benar). `npm run typecheck`/`npm run build` (termasuk `verify:content`) — 0 error, bundle 682.9kb. ID collision & integritas item dicek independen via skrip Python — 10 topik Starter total, MASING2 tepat 10 item, 0 duplikat id.

**Status akhir sesi 11**: Starter Grammar 10/10 TERCAPAI. Grammar sekarang py **6 dari 6 level TUNTAS target masing2** (Little Stars 10/10, **Starter 10/10 BARU**, Explorer 10/10, Adventurer 10/10, Achiever 11/10, Trailblazer 10/10) — SELURUH skill Grammar lintas 6 level sudah capai/lampaui target CLAUDE.md (≥10, atau ≥5 khusus Trailblazer yg sengaja dilampaui atas instruksi user). Tidak ada gap topik-count Grammar yg tersisa di level manapun.

## 23. Audit & Perbaikan Duplikat Kalimat Soal — Format LAMA (Sesi 12) — Bug Skrip Otomatis + 27 Topik Diperbaiki (permintaan user: "baca CLAUDE.md 'Kalimat Soal... Tidak Boleh 100% Sama'... lakukan audit jika ada yang melanggar di modul grammar")

### 23.1 Konteks — Aturan & Skrip Otomatis Sudah Ada Sebelum Sesi Ini

CLAUDE.md py aturan "🔒 Kalimat Soal di Kenalan/Latihan Inti/Tantangan Tidak Boleh 100% Sama (Duplicate) dalam 1 Topik" — lahir dari laporan user thd Listening Explorer topik `kebun-binatang` (kalimat drill Latihan Inti muncul lagi PERSIS di `story` Tantangan). Aturan ini SUDAH py skrip otomasi (`app/scripts/verify-content-duplicates.mjs`, bagian `npm run build`) yg mengecek 4 format LAMA (Listening/Reading/Speaking/Grammar) — skrip ini SUDAH ADA saat sesi audit ini dimulai (ditambahkan konkuren oleh sesi lain yg bekerja di repo yg sama), TAPI belum pernah dijalankan scr eksplisit thd Grammar sampai user minta audit.

### 23.2 Bug Ditemukan — Skrip Otomatis False-Negative krn Tidak Strip Tanda Baca

Audit AWAL menjalankan skrip yg SUDAH ADA → hasilnya "✅ lolos, 0 masalah". TAPI audit manual (bandingkan `examples[].en` — mis. "I played football yesterday." dgn `scramble[].target.join(' ')` — mis. "I played football yesterday" TANPA titik) menemukan skrip py bug: fungsi `norm()`-nya cuma `trim()`+lowercase+collapse-whitespace, **TIDAK strip tanda baca**. Akibatnya kalimat yg SAMA PERSIS (cuma beda titik/koma krn `scramble.target` array kata TIDAK PERNAH py tanda baca) dianggap 2 STRING BEDA & lolos — false-negative yg secara struktural SELALU terjadi persis pas kasus yg PALING umum: `scramble` merekonstruksi salah satu kalimat `examples`. Bug KEDUA: `stimuliGrammar()` cuma bandingkan `fill` sbg TEMPLATE mentah (`"...played ___"`, py "___" literal) — TIDAK PERNAH bisa match `examples` (yg selalu kalimat utuh tanpa blank) — melewatkan kasus di mana 1 OPSI `fill` spesifik (bukan templatenya) merekonstruksi sebuah `examples`.

**Kedua bug diperbaiki** di `verify-content-duplicates.mjs`: (1) `norm()` sekarang strip `.,!?;:'"` sebelum dibandingkan; (2) `stimuliGrammar()` sekarang merakit SEMUA kombinasi `fill.before + opsi.word + fill.after` (bukan cuma 1 template dgn blank) sbg kandidat kalimat yg dicek.

### 23.3 Hasil Audit — 47 Instance Duplikat di 27 dari 31 Topik `GrammarTopic`

Setelah skrip diperbaiki, dijalankan ulang thd `GRAMMAR_TOPICS_BY_LEVEL` (Explorer 10 + Adventurer 10 + Achiever 11 = 31 topik format LAMA — format KEDUA/KETIGA di luar scope, TIDAK py risiko struktural yg sama, `items`/`transforms` ditulis SEKALI lalu dipakai ulang KODE bukan diulang di DATA):

- **Explorer: 8 dari 10 topik terdampak** (`this-is`, `there-is`, `pronouns`, `prepositions-of-place`, `would-like`, `lets-suggestion`, `can-requests`, `prepositions-of-time`) — HANYA `present-continuous`/`question-words` bersih.
- **Adventurer: SEMUA 10 dari 10 topik terdampak** — `simple-past` bahkan py SEMUA 3 examples-nya diulang verbatim persis di scramble.
- **Achiever: 9 dari 11 topik terdampak** (`past-continuous`, `present-perfect`, `going-to-vs-will`, `should-vs-could`, `might-possibility`, `so-result`, `look-like`, `zero-conditional`, `many-vs-much`) — beberapa (`present-perfect`/`so-result`/`look-like`) py kalimat yg sama diulang di KETIGA array (`examples`+`scramble`+`fill`) sekaligus — HANYA `continuous-vs-simple`/`made-of` bersih.

Pola sistemik: `scramble.target` (Latihan Inti) ditulis dari AWAL project (termasuk topik sesi 1, mis. `simple-past`/`comparatives`, jauh sebelum aturan ini ada) dgn cara merekonstruksi PERSIS salah satu kalimat `examples` (Kenalan) — konsisten di HAMPIR SEMUA topik format LAMA yg pernah diauthoring, bukan cuma beberapa. User ditanya (`AskUserQuestion`) bagaimana menangani temuan ini — **user pilih: perbaiki bug skrip + tulis ulang SEMUA 27 topik terdampak**, bukan skip/defer.

### 23.4 Perbaikan Konten — Prinsip & 2 Kesalahan yg Ditemukan Sendiri Saat Mengerjakan

**Prinsip perbaikan**: `examples` (Kenalan) TIDAK disentuh (tetap kalimat model asli) — `scramble`/opsi `fill` yg diulang ditulis ULANG jadi kalimat BARU yg genuinely beda (subjek/kata benda/kata kerja beda) TAPI tetap menguji STRUKTUR GRAMATIKAL yg sama persis (mis. `simple-past`'s "I played football yesterday." diganti scramble jadi "He cleaned his room."/"They cooked dinner."/"You painted a picture." — 3 kalimat BARU, tetap past-tense reguler, TIDAK menyentuh 3 `examples` aslinya sama sekali).

**🔒 Kesalahan ditemukan SENDIRI (2 putaran re-run verifikasi, bukan lolos diam-diam)**: putaran perbaikan PERTAMA utk 9 dari 27 topik SALAH — alih-alih menulis kalimat BARU, sempat mengambil "kalimat `examples` LAIN yg belum dipakai di scramble" (mis. `past-simple-irregular` py 3 examples: went-to-school/ate-breakfast/saw-bird; scramble lama duplikat 2 pertama, "diperbaiki" dgn memindah examples[2] "He saw a bird in the tree" masuk ke scramble — INI TETAP DUPLIKAT, cuma mindah index yg ketauan!). Ditemukan lewat re-run `npm run verify:duplicates` SETELAH putaran pertama (bukan diasumsikan benar) — hasilnya 15 masalah BARU muncul (bukan 0). Putaran KEDUA memperbaiki dgn kalimat 100% BARU (bukan salah satu dari 3 `examples` topik itu) utk KESEMBILAN topik yg salah — verifikasi ulang setelah putaran kedua sempat MASIH nemu 2 sisa kesalahan yg sama (`look-like`/`zero-conditional`, keduanya kena tabrakan yg sama persis 2x berturut-turut, sinyal jelas ini kesalahan METODOLOGIS bukan 1 slip acak) — putaran KETIGA baru genuinely bersih. **Pelajaran**: kalau topik py N `examples`, kandidat pengganti scramble/fill HARUS dicek thd SEMUA N examples (bukan cuma yg "kelihatan dipakai duluan"), krn "unused example" bukan berarti "aman dipakai" — itu tetap salah satu isi array yg sama yg TIDAK BOLEH diulang.

### 23.5 Verifikasi

`npm run build` (`typecheck` → `verify:content` → `verify:duplicates` → bundle) — 0 error di SEMUA tahap, `verify:duplicates` skrip yg SUDAH DIPERBAIKI melaporkan "✅ lolos" utk KEEMPAT skill (Listening/Reading/Speaking/Grammar), bukan cuma Grammar. **Diverifikasi live** (Playwright + Chromium headless, 6 topik disampling lintas Explorer/Adventurer/Achiever) — word-bank scramble menampilkan kata BARU dgn benar (mis. "bird" bukan lagi "cat", "key"/"drawer" bukan lagi "spoon"/"bowl"), mekanik cek-jawaban tetap berfungsi normal (menolak urutan salah, pola sama sblm perbaikan). **Ditemukan insiden terpisah selama verifikasi**: dev server publik sempat pindah port (8000→8200) oleh sesi lain yg bekerja konkuren di repo yg sama (`dev-server.mjs` `PORT` constant), & port 8000 lama ternyata sudah diduduki proses TIDAK TERKAIT (`gchatbot`/"AI Chatbot ADK") — diselesaikan dgn mengarahkan verifikasi ke port 8200 yg benar, TANPA mematikan proses siapa pun (bukan proses milik sesi ini).

**Status**: 47 instance duplikat di 27 topik `GrammarTopic` (Explorer/Adventurer/Achiever) — SEMUA diperbaiki, 0 tersisa. Skrip `verify-content-duplicates.mjs` sekarang benar2 mendeteksi pola "examples direkonstruksi di scramble/fill" utk SEMUA 4 skill format lama, bukan cuma Grammar — perbaikan bug ini otomatis melindungi Listening/Reading/Speaking dari kasus serupa jg (walau audit sesi ini SPESIFIK cuma menyisir isi Grammar, TIDAK re-audit 3 skill lain scr penuh — kalau skrip skrng lolos utk mereka, itu genuinely bersih drpd skrip lama, bukan diverifikasi ulang manual spt Grammar).
