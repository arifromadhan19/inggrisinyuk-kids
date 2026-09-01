# Materi Reading — Analisis, Riset, & Roadmap per Level

Permintaan user: "lakukan research bagaimana rule dan flow di modul reading, lihat aplikasi kompetitor, lembaga bahasa inggris indonesia maupun luar negri tapi fokus ke dalam negri karena target market nya anak indonesia, dan coba buat 1 materi di little stars". Revisi tengah sesi: **"pastikan jangan meniru 100%, wajib ada improvement"** — keputusan desain di §4 secara eksplisit dipilih supaya BUKAN cuma re-skin pola kompetitor.

Beda dari `materi/vocab.md`/`materi/listening.md` (riset diminta utk SEMUA 6 level dari awal) — sesi ini scope-nya **riset flow Reading secara umum + 1 level (Little Stars)**, bukan mandat riset 6 level sekaligus. Level lain (Starter/Explorer/Achiever/Trailblazer) dicatat sbg gap terbuka di §7, bukan diriset penuh sesi ini.

**Sesi lanjutan** (permintaan user: "summary feedback apa yang perlu di-improve" → "implementasi feedback reading + research materi reading per level yang tepat" → user pilih SEMUA 4 opsi implementasi): §8 menutup 4 kesenjangan teknis vs Vocab/Listening (resume progres, navigasi quiz-dot, hint eliminasi, persentase granular) & §9 meriset SEMUA 5 level tersisa (Starter/Explorer/Adventurer/Achiever/Trailblazer) — §10 mengimplementasikan 4 dari 5 rekomendasi riset (Starter, Explorer FORMAT BARU, Adventurer digenapkan 10/10, Achiever). **Dokumen ini SEKARANG mencakup riset 6 level penuh DAN konten nyata di 5 dari 6 level** (semua kecuali Trailblazer, sengaja ditunda §9.5).

---

## 1. Ringkasan (TL;DR)

- Reading di app ini SUDAH ada 1 format sebelum sesi ini: `ReadingTopic` (Adventurer, 2 topik) — baca kalimat/cerita SENDIRI (silent, TANPA TTS) → jawab pertanyaan pilihan ganda. Cocok utk anak 9–11 th yg sudah bisa decode kalimat.
- Pertanyaan inti sesi ini: apakah format yang sama bisa digenapkan turun ke Little Stars (3–5 th)? **Riset menjawab TIDAK** — anak usia ini (bahkan di Bahasa Indonesia sendiri) belum siap dekoding kalimat sama sekali.
- Solusi: format KEDUA `ReadingWordTopic` — whole-word/sight-word ↔ gambar, PERSIS pola pembuka semua kompetitor early-literacy yang diriset (Reading Eggs, Endless Reader, HOMER, Starfall, Teach Your Monster to Read) dan lembaga Indonesia (EF Small Stars, Kumon).
- 1 topik dibangun: `kata-hewan` ("Membaca Kata: Hewan"), 10 kata dari Vocab Little Stars `hewan-peliharaan`.
- **Improvement di luar copy-paste kompetitor** (§4): tangga 2-arah (Latihan Inti kata→gambar, Tantangan gambar→kata) yang tidak dipunyai satu pun kompetitor yang diriset (semuanya 1 arah), + kartu kata ala flashcard (`.reading-word-card`) yang lebih menonjolkan bentuk cetak drpd teks sebaris kecil kebanyakan kompetitor.
- Diverifikasi: `npm run typecheck` & `npm run build` lolos, alur penuh diuji live di browser (Playwright + Chromium headless) — 0 JS error, Kenalan→Latihan Inti→Tantangan→"Kerja Bagus!" jalan semua.

---

## 2. Analisis Mekanik Reading — 2 Format Berdampingan

### 2.1 Status konten per level

| Level | Format | Jumlah topik | Status target ≥10/skill |
|---|---|---|---|
| Little Stars | KEDUA (`ReadingWordTopic`, "Baca Kata") | **10/10 (§13, TUNTAS)** | ✅ |
| Starter | KEDUA (`ReadingWordTopic`, "Baca Kata") | **10/10 (§14, TUNTAS)** | ✅ |
| Explorer | KETIGA (`ReadingCheckTopic`, "Baca & Nilai") | **10/10 (§15, TUNTAS)** | ✅ |
| Adventurer | LAMA (`ReadingTopic`) | 10/10 (§10.3, TUNTAS) | ✅ |
| Achiever | LAMA (`ReadingTopic`, "Format C+") | **10/10 (§17, TUNTAS)** | ✅ |
| Trailblazer | LAMA (`ReadingTopic`) | **10/10 (§18, melebihi target khusus ≥5 atas permintaan eksplisit)** | ✅ |

*(Tabel di atas ditulis sesi 1 & sempat stale — status terkini per baris di atas, detail lengkap tiap sesi ada di §10/§13, jangan percaya isi §2.2 di bawah ini soal "belum mulai" utk level selain Little Stars/Adventurer, itu narasi ASLI sesi 1 sebelum level lain dikerjakan.)*

### 2.2 Format LAMA (`ReadingTopic`) — Adventurer, TIDAK disentuh sesi ini

`primer: {passage, id}[]` (Kenalan, baca+terjemahan) → `drill: {passage, question, opts}[]` (Latihan Inti, 1-2 kalimat + pertanyaan gambar) → `story` + 1 `question` (Tantangan, cerita mini). **Prinsip inti**: teks TIDAK PERNAH diucapkan TTS — kalau dibacakan, jadi tes dengar lagi, bukan tes baca sendiri (konsisten dgn Reading di First Placement Test, `doc/first_placement_test.md`). Opsi jawaban (`optHtml`, `games/reading.ts`) SENGAJA tidak menampilkan `lbl` scr visual — cegah celah "cocok teks tanpa proses makna" (bug yg sama pernah dilaporkan & diperbaiki di First Placement Test).

Fungsi (`renderKenalan`/`runLatihanInti`/`runTantangan`) masih auto-advance via `setTimeout`, tanpa hint — pola yg SUDAH digantikan Vocab/Listening (tombol manual "Coba Lagi"/"Lanjut") tapi BELUM menyentuh Reading format ini (CLAUDE.md "Belum dikerjakan").

### 2.3 Format KEDUA (`ReadingWordTopic`, "Baca Kata") — Little Stars, BARU sesi ini

`items: ReadingWordItem[]` (`en`/`id`/`emoji` — struktur mirip `VocabItem` tanpa `example`, krn tidak ada kalimat contoh di format ini). Pembeda runtime dari format lama: `'items' in topic` (`types.ts` `AnyReadingTopic`, pola identik `AnyListeningTopic`).

3 langkah, 3 SHAPE tugas berbeda (detail penuh + rationale desain di §4):
1. **Kenalan** — daftar kata, 3 aksi per kata: 🔊 dengar, 🎤 coba ucapkan (skor proporsional + Play Suaramu), 🎮 main (1 soal kata↔gambar fokus 1 kata) — revisi user "tetap ada fitur mic dan main" (§4.4), PERSIS pola Kenalan Vocab/Listening.
2. **Latihan Inti "🎯 Baca & Tunjuk"** — kata tercetak (stimulus utama) → pilih GAMBAR (4 opsi emoji-only).
3. **Tantangan "🖼️ Lihat & Baca"** — gambar (stimulus) → pilih KATA TERCETAK (4 opsi teks).

**Divergensi disengaja dari "Reading tidak pernah TTS"** (§2.2): di format ini, kata BOLEH diucapkan `speak()`. Lihat §4.2 untuk alasan lengkap — jangan generalisasi ke format lama.

---

## 3. Riset: Rule/Flow Reading yang Tepat untuk Little Stars (3–5 th)

Instruksi user eksplisit: **prioritaskan lembaga bahasa Inggris Indonesia** dulu, kompetitor luar negeri sbg pembanding — sama pola prioritas dgn `materi/listening.md` §16.9 PRD.

### 3.1 Institusi Bahasa Inggris Indonesia (3–6 th)

- **LIA — GEVYL (General English for Very Young Learners, 4–6 th)**: PURELY oral/fisik, TIDAK ADA komponen literasi ditemukan. Deskripsi program: "aktivitas kelas... bernyanyi, menari, mengidentifikasi objek, menebak gambar" — TPR-berat (Total Physical Response, respons fisik ke instruksi verbal), materi "worksheet, audio, video, realia", TANPA sebut huruf/phonics/reading sama sekali. Sumber: [lia-depok.ac.id](https://www.lia-depok.ac.id/program/reguler/?id=15), [lblia.com](https://lblia.com/kursus-bahasa-inggris-anak/).
- **EF Indonesia / English1 — "Small Stars" (3–6 th)**: SATU-SATUNYA institusi Indonesia yang diriset yang MEMANG memperkenalkan literasi di usia ini, tapi bertahap. Kutipan langsung: *"Menggunakan memori visual untuk mengenali huruf, kata, dan angka"*, plus modul eksplisit *"Phonics for Pre-Literacy Skills"* dan *"Phonics (bunyi) dan suku kata"*. Menulis berkembang dari *"menirukan bentuk huruf secara baik dan benar"* menuju *"menuliskan kalimat singkat sendiri"* — TAPI output level-kalimat itu eksplisit milestone AKHIR dari rentang 3–6 th, bukan aktivitas pembuka. Sumber: [english1.co.id/program/smallstars](https://english1.co.id/program/smallstars/), [ef.co.id/englishfirst/kids/smallstars](https://www.ef.co.id/englishfirst/kids/smallstars/).
- **Kumon Indonesia (EFL, masuk preschool ~3–4 th)**: Mulai MURNI dari asosiasi gambar-kata, bukan dekoding: *"fun 'Look, Listen and Repeat' worksheets... colorful illustrations help your child to connect words with familiar objects."* Sumber: [id.kumonglobal.com](https://id.kumonglobal.com/for-parents/our-programmes/?lang=en).
- **Kesimpulan**: institusi Indonesia yang PALING literasi-forward di usia ini (EF/English1) tetap memperlakukan kalimat penuh sbg OUTPUT AKHIR rentang 3–6 th, bukan langkah pembuka — dan satu institusi lain (LIA) bahkan skip literasi total di usia ini.

### 3.2 Kurikulum Merdeka PAUD — Fase Fondasi (literasi umum, bukan spesifik Bahasa Inggris)

Fase Fondasi (usia 0–6) py 3 "lingkup capaian" termasuk "dasar literasi dan STEAM". **Krusial**: ekspektasi keaksaraan (kenal simbol huruf, kesadaran bunyi awal, korespondensi bunyi-huruf, baca nama sendiri, paham makna cerita) eksplisit dilekatkan ke **anak usia 5–6 tahun** — yaitu UJUNG ATAS dari rentang 3–5 th yang ditarget Little Stars, BUKAN 3–5 secara umum. Tidak ada klaim setara utk usia 3–5. Kurikulum ini bahkan eksplisit memperingatkan supaya calistung (baca-tulis-hitung) TIDAK dijadikan *"satu-satunya bukti keberhasilan belajar... dan dapat dibangun secara instan"*. Sumber: [paud.id/pengertian-fase-fondasi-paud](https://www.paud.id/pengertian-fase-fondasi-paud/), [paud.id/capaian-pembelajaran-paud-kurikulum-merdeka](https://www.paud.id/capaian-pembelajaran-paud-kurikulum-merdeka/), [paud.id/calistung-di-kurikulum-merdeka](https://www.paud.id/calistung-di-kurikulum-merdeka/).

**Insight**: bahkan literasi Bahasa Indonesia (bahasa IBU anak) baru ditarget mulai usia 5–6 — anak Little Stars (3–5 th) belajar Bahasa INGGRIS (bahasa asing) semestinya diasumsikan BELUM siap membaca kalimat sama sekali, bukan "mungkin sudah bisa sedikit".

### 3.3 Kompetitor Internasional — App/Kurikulum Early-Literacy

Semua 7 program yang diriset menyusun skill dgn urutan yang SAMA — sub-word/whole-word dulu, komprehensi multi-kalimat digerbangi jauh di belakang:

| App | Target skill di band TERMUDA (3–5 th) | Komprehensi multi-kalimat? |
|---|---|---|
| **Endless Alphabet** (3–11 th, inti 3–5) | Phonics huruf→kata, 1 kata per waktu | Tidak — 1 kata saja |
| **Endless Reader** (2–7 th) | Whole-word/sight-word — kata "beranimasi" jadi maknanya (mis. "dog" jadi anjing menggonggong) | Tidak — kata/frasa pendek saja |
| **Reading Eggs** ("Starting Out", 3–6 th) | Nama/bunyi huruf → sight word pertama (*the, I, and, is, see*) → blending kata CVC 3-huruf | Hanya sbg CAPSTONE setelah 40 pelajaran ("cerita sederhana pertama") — "Junior" (2–4 th) malah PRA-baca total, cuma kesadaran fonemik + alfabet |
| **Starfall** (Pre-K) | Kenal huruf/bunyi lewat tap huruf | Cerita ADA tapi dibingkai sbg DIDENGARKAN ("library"), bukan dibaca sendiri+kuis |
| **HOMER** (2–8 th) | Jalur eksplisit: *"letters and sounds → blending and sight words → reading fluency and comprehension"* | Komprehensi = tahap TERAKHIR, bukan pembuka |
| **ABCmouse** (preschool) | Kenal huruf → phonics/blending → sight words | Komprehensi milik tier lebih tinggi/kindergarten |
| **Teach Your Monster to Read** (3–6 th) | *"phonics to reading full sentences"* — cocok huruf/bunyi dulu | Kalimat penuh = AKHIR arc app, bukan awal |

**Kesimpulan**: 0 dari 7 program yang diriset membuka dgn komprehensi baca-sendiri multi-kalimat di band 3–5 th. Semua mulai dari phonics huruf-bunyi dan/atau whole-word/sight-word ↔ gambar.

### 3.4 Cambridge YLE / British Council (konfirmasi, bukan riset baru)

Dikonfirmasi ulang (sudah diketahui dari `materi/vocab.md`/`materi/listening.md`): Pre A1 Starters/A1 Movers/A2 Flyers mencakup usia 6–12, TIDAK ADA komponen resmi Cambridge/British Council utk under-6. Backbone struktural CEFR app ini genuinely tidak berlaku sampai Starter (≈pra-Starters).

---

## 4. Keputusan Desain — Bukan Sekadar Tiru Kompetitor

Revisi eksplisit user di tengah sesi: **"pastikan jangan meniru 100%, wajib ada improvement"**. 2 keputusan konkret yang membedakan dari pola generik "kata→gambar" kompetitor:

### 4.1 Tangga 2-arah (bukan cuma 1 arah spt SEMUA kompetitor yang diriset)

Semua 7 kompetitor di §3.3 SAMA-SAMA cuma 1 arah: kata TERCETAK → makna/gambar (word→meaning). Tidak satu pun membalik arahnya. App ini menambah **Tantangan** sbg arah TERBALIK: gambar → pilih KATA TERCETAK dari beberapa opsi teks yang mirip panjang. Ini memaksa anak benar-benar membedakan BENTUK CETAK kata (bukan cuma menebak dari familiaritas urutan/gambar) — rigor tambahan yang genuinely baru, bukan re-skin.

Kenapa ini valid secara pedagogis (bukan cuma "dibalik asal beda"): tugas kata→gambar melatih RECOGNITION (mengenali kata kalau ditunjukkan), sedangkan gambar→kata melatih RECALL/DISCRIMINATION (memilih bentuk yang benar dari distraktor yang mirip) — 2 keterampilan berbeda yang saling melengkapi, prinsip yang sama dgn kenapa Latihan Inti Vocab (`games/vocabulary.ts`) py 4 tipe soal berbeda, bukan 1 tipe diulang.

### 4.2 Kartu kata ala flashcard (`.reading-word-card`), bukan teks sebaris

Kebanyakan kompetitor (Endless Reader, Reading Eggs) menampilkan kata dlm ukuran teks biasa di antara elemen UI lain. App ini membungkusnya dlm kartu tersendiri (`public/styles.css` `.reading-word-card`) — font besar (`clamp(1.75rem,...,2.75rem)`) + letter-spacing lebar (`.04em`), reuse token warna `--c-read`/`--c-read-bg` (identitas skill Reading yg sudah ada sejak First Placement Test) — supaya kata jadi FOKUS VISUAL TUNGGAL layar (print awareness: "ini 1 objek yang punya bentuk", bukan sekadar teks label kecil di antara elemen lain).

### 4.3 Divergensi TTS disengaja (bukan pelanggaran, keputusan sadar)

Aturan "Reading tidak pernah TTS" (§2.2, dibangun utk Adventurer) SENGAJA tidak berlaku di format ini. Reading Eggs, HOMER, dan Kumon (§3.1/§3.3) semuanya memasangkan audio+cetak persis di tahap paling awal — audio BUKAN kelemahan/jalan pintas di tahap ini, tapi bagian dari MEKANISME belajarnya sendiri (anak belum bisa decode, decoding baru terbentuk lewat asosiasi berulang bentuk-cetak↔bunyi). Beda total dari tujuan Adventurer (menguji anak yang SUDAH bisa decode, supaya tidak diberi jalan pintas dengar). Didokumentasikan eksplisit di `types.ts` (komentar `ReadingWordTopic`) & CLAUDE.md supaya sesi berikutnya tidak salah generalisasi ke format lama.

### 4.4 Revisi: Kenalan tetap py mic & main (permintaan user follow-up: "update dimana di fitur kenalan tetap ada fitur mic dan main")

Versi PERTAMA Kenalan sesi ini (§5 awal) SEMPAT dibangun cuma dgn 🔊 dengar — keputusan sadar berdasar riset §3 ("anak level ini butuh exposure dulu tanpa tugas apa pun"), BUKAN oversight. User lalu eksplisit minta dikembalikan pola Kenalan Vocab/Listening (3 aksi: 🔊/🎤/🎮) — REVISI ini menang atas keputusan riset awal (instruksi eksplisit user selalu diprioritaskan di atas rekomendasi riset generik). Implementasi:

- **🎮 Main** — `runWordMiniGame` (`games/reading.ts`, BARU) REUSE PERSIS mekanik kata↔gambar Latihan Inti (`buildWordOptions`/`optHtml`) utk 1 soal fokus SATU kata, balik ke daftar sesudahnya — pola identik `runWordMiniGame` Vocab (yg jg reuse bentuk soal Latihan Inti-nya sendiri via `buildWordQuestion`), bukan bentuk soal baru.
- **🎤 Mic** — WAJIB ikut "🔒 Aturan Wajib: Setiap Fitur Speaking Butuh Skor Proporsional + 'Play Suaramu'" (CLAUDE.md) krn anak bicara lewat mic. `openMicResultPopup`/`micFor` (`games/reading.ts`, BARU) REUSE PERSIS pola `games/vocabulary.ts` `renderKenalan`: bintang dari `wordMatchDetail(said, item.en)` (proporsional, bukan pass/fail longgar), tombol "▶️ Play Suaramu" dari rekaman paralel `listenAndRecordOnce` (best-effort — kalau STT/mic tidak didukung, `sttSupported` gate seluruh tombol 🎤, alur inti tetap jalan tanpa itu).
- Tombol "Lanjut ke Latihan Inti →" TETAP ada (tidak diubah, di luar scope revisi ini) — beda dari Vocab/Listening yg sudah menghapus tombol itu & mengandalkan stepper saja.
- Diverifikasi live: 🎮 Main 1 soal penuh (kartu kata → pilih gambar → praise/confetti → kembali ke daftar, tombol berubah warna "done"); 🎤 mic masuk status "listening" (visual) tanpa crash — round-trip STT penuh tidak bisa dituntaskan di sandbox Chromium headless (keterbatasan lingkungan uji, bukan bug — mekanismenya reuse verbatim dari Vocab yg sudah terbukti jalan di produksi).

---

## 5. Spesifikasi Little Stars — Diimplementasikan

**Lokasi kode**: `READING_TOPICS_LITTLE_STARS` (`app/src/content.ts`), tipe baru `ReadingWordItem`/`ReadingWordTopic`/`AnyReadingTopic` (`app/src/types.ts`), fungsi baru `renderKenalanWord`/`runWordMiniGame`/`runLatihanIntiWord`/`runTantanganWord` (`app/src/games/reading.ts`), dispatcher `app.ts` `runStage`/`runFreePlayRound` dicabangkan via `'items' in topic`, CSS baru `.reading-word-card` (`public/styles.css`, reuse `.mic-pop-*`/`.primer-*` yg sudah ada utk mic & daftar kata).

| # | id | Title | Tema diambil dari (Vocab Little Stars) |
|---|---|---|---|
| 1 | `kata-hewan` | Membaca Kata: Hewan (Reading Animal Words) | `hewan-peliharaan` |

10 kata topik ini: Dog/Anjing 🐶, Cat/Kucing 🐱, Fish/Ikan 🐟, Bird/Burung 🐦, Cow/Sapi 🐄, Duck/Bebek 🦆, Horse/Kuda 🐴, Sheep/Domba 🐑, Pig/Babi 🐷, Rabbit/Kelinci 🐰 — identik dgn `VOCAB_TOPICS_LITTLE_STARS` topik `hewan-peliharaan`, dipilih krn kata pendek (3–7 huruf), emoji sangat khas/tidak ambigu (tidak ada 2 hewan yg emoji-nya mirip), dan anak SUDAH kenal maknanya dari Vocab — melatih ULANG lewat modalitas baca, bukan kosakata baru sekaligus 2 skill (pola sama Listening Little Stars, `materi/listening.md` §4A).

Keputusan authoring:

- Id topik SENGAJA beda dari id Vocab sumbernya (`kata-hewan` vs `hewan-peliharaan`) — konvensi sama dgn Listening Little Stars (`materi/listening.md` §4A, semua id barunya beda dari id Vocab), walau aman dari tabrakan progres krn key `${skill}:${topicId}:${section}` (`progress.ts`) sudah py awalan skill.
- Kenalan py 3 aksi per kata (🔊/🎤/🎮), PERSIS pola Vocab/Listening — lihat §4.4 utk riwayat revisi (versi pertama sesi ini sempat cuma 🔊, direvisi user).
- Progress/percent REUSE fallback `isStepVisited` yg sudah generik lintas skill (`app.ts` `topicProgressPercent`) — nol perubahan `progress.ts`.
- `games/boss.ts` TIDAK py Reading sama sekali (`poolFor()` cuma pool Vocab/Listening/Grammar/Speaking) — tidak ada adapter yg perlu disentuh.

---

## 6. Verifikasi

- `npm run typecheck` (tsc --noEmit) — lolos, 0 error.
- `npm run build` (typecheck + esbuild bundle+minify) — lolos, `public/bundle.js` ter-generate.
- **Diuji live di browser** (Playwright + Chromium headless, level anak di-set `little-stars` via localStorage + `/api/me` di-mock supaya tidak ke-401 & ke-wipe oleh portal beneran):
  - Menu Belajar: kartu "📖 Reading" muncul utk Little Stars (sebelumnya tersembunyi, `visibleSkillKeys()` — konfirmasi topik baru otomatis kebaca tanpa kode tambahan).
  - Kenalan: 10 baris kata tampil (emoji+EN+ID+🔊+🎤+🎮), tap 🔊 memutar TTS TANPA crash & mengubah tombol jadi warna "done" (persisten, `hasWordInteraction`); tap 🎮 membuka 1 soal kata↔gambar penuh (jawab → praise/confetti → kembali ke daftar, tombol jadi "done"); tap 🎤 masuk status "listening" tanpa crash (round-trip STT penuh tidak bisa dituntaskan di sandbox headless, keterbatasan lingkungan uji — lihat §4.4).
  - Latihan Inti: 10 soal "🎯 Baca & Tunjuk" — kartu kata besar, opsi 4 gambar emoji-only, jawaban salah → "Dikit lagi! ✨" (non-punitive) + tombol tetap bisa dicoba lagi; jawaban benar → confetti + "Hebaaat! 🎉" (Indonesia, sesuai level Little Stars) + tombol "Coba Lagi"/"Lanjut ➡️" (soal ke-10: "Selesai ✅").
  - Tantangan: 10 soal "🖼️ Lihat & Baca" — arah dibalik, gambar besar + 4 opsi teks (`.opt-btn-text`), "💡 Dengar" tersedia tanpa bocorin jawaban.
  - Selesai: layar "Kerja Bagus!" + 3 bintang + confetti + "+15 XP", tombol "Ulangi Modul Ini"/"Pilih Materi Lain" (TANPA "Beranda", konsisten CLAUDE.md poin 3 format wajib Vocab yg berlaku lintas skill).
  - 0 `pageerror` (JS crash) tercatat sepanjang alur. 2 warning jaringan "401" di console murni dari endpoint sync progress terpisah yang TIDAK ikut di-mock (di luar scope pengujian ini, `/api/me` yang relevan sudah di-mock) — tidak mengganggu gameplay krn localStorage tetap sumber kebenaran utama (PRD §5).

---

## 7. Gap yang Masih Terbuka (dilaporkan, bukan dianggap selesai)

- ~~Reading Little Stars baru 1 dari target ≥10 topik~~ — **DITUTUP §13** (digenapkan 1→10, 9 topik baru dipetakan dari domain Vocab Little Stars yg belum disentuh Reading).
- ~~Reading BELUM ada sama sekali di Starter, Explorer, Achiever, Trailblazer~~ — **DITUTUP SEMUA sesi berikutnya** (Starter/Explorer/Achiever §10.1–10.4, Trailblazer §10.6 dgn target BARU 5 topik, bukan lagi 0) — riset lengkap di §9.
- ~~Adventurer (format lama) masih 2 topik~~ — **DITUTUP** (§10.3, digenapkan ke 10/10).
- **Format lama Reading (Adventurer) belum dapat perbaikan pola manual retry/hint/quiz-dot** yg sudah dibangun di Vocab/Listening DAN format kedua Little Stars (§8 di bawah) — auto-advance `setTimeout` masih dipakai apa adanya, menunggu arahan baru user.

---

## 8. Perbaikan Teknis — Respons Feedback User (Kesenjangan vs Vocab/Listening)

Sesi berikutnya, user eksplisit minta audit "apa yang beda Reading dari modul lain" lalu "summary feedback apa yang perlu di-improve". 4 dari 7 poin feedback (prioritas tinggi & sebagian menengah) diimplementasikan sesi ini, ke KEDUA fungsi format kedua (`runLatihanIntiWord`/`runTantanganWord`, `games/reading.ts`) — format lama Adventurer TIDAK disentuh (tetap di luar scope, lihat CLAUDE.md "Belum dikerjakan"):

1. **Resume/persist progres per-soal** — sebelumnya `round` cuma variabel lokal di memori (hilang kalau anak keluar/refresh). Sekarang REUSE PERSIS pola `ensureSection`/`resetSectionPlan`/`setSectionCursor` (`progress.ts`, konvensi sama `games/vocabulary.ts`/`games/listening.ts`) — plan (urutan 10 kata) dimaterialisasi SEKALI & disimpan, cursor (soal terakhir dilihat) ikut disimpan per section (`'latihan'` utk Latihan Inti, `'tantangan-baca'` BARU utk Tantangan — nama section sengaja beda dari `'tantangan-susun'` Vocab/Listening krn mekaniknya beda, walau aman dari tabrakan progres krn key sudah py awalan skill). Diverifikasi live: reload di tengah soal ke-3 → anak kembali PERSIS di soal ke-3, bukan reset ke soal 1.
2. **Navigasi quiz-dot** — `quizNavHtml`/`wireQuizNav` (duplikat lokal dari Vocab/Listening) ditambahkan ke KEDUA soal 10-soal — anak bisa lompat ke soal manapun, titik hijau = sudah dijawab.
3. **💡 Petunjuk (eliminasi 2 opsi salah)** — `wireHint` (duplikat lokal, pola 50/50 sama persis Vocab/Listening) ditambahkan ke KEDUA soal. **Penting**: di Tantangan, tombol replay audio yang sebelumnya bernama "💡 Dengar" (`data-action="hint"`) DIGANTI jadi "💡 Dengar" dgn `data-action="dengar"` — supaya tidak bentrok dgn `data-action="hint"` milik tombol Petunjuk BARU (dua bantuan yang beda: Petunjuk = eliminasi opsi, Dengar = replay audio kata target — saling melengkapi, bukan duplikat, sama prinsip dgn 2 sistem bantuan Listening di CLAUDE.md).
4. **Progress bar granular per-soal** — fungsi baru `readingTopicPercent()` (`progress.ts`, pola identik `listeningTopicPercent`) + cabang baru `key === 'reading'` di `topicProgressPercent()` (`app.ts`, cuma aktif kalau `'items' in topic` — format lama Adventurer TETAP fallback `isStepVisited`). Persentase topik sekarang naik bertahap per soal (rata-rata Latihan Inti + Tantangan), bukan lompat 0%→100% begitu 2 section pernah disentuh sekali.
5. **Pola jawab "1 tap lalu terkunci"** — ternyata versi ASLI Reading (dibangun sesi sebelumnya) beda dari pola Vocab/Listening yang SUDAH established: jawaban SALAH sebelumnya cuma redup 350ms lalu bisa ditap lagi (anak boleh coba berulang dalam 1 render soal yang sama) — ternyata pola Vocab/Listening yang SUDAH mapan justru "1 tap (benar ATAU salah) → SEMUA opsi terkunci → wajib tap 'Coba Lagi' buat render ulang soal fresh". Diselaraskan ke pola yang sudah mapan itu (`lockOptionButtons` dipanggil unconditional, bukan cuma saat benar) — konsistensi UX lintas skill lebih diutamakan drpd mempertahankan variasi kecil yang tidak disengaja.

**Tidak diubah** (2 poin feedback lain, sengaja didokumentasikan sbg keputusan/pertanyaan terbuka, bukan lupa):
- **Aturan TTS bercabang dua** (format lama vs baru) — sudah dinamai eksplisit di komentar `ReadingWordTopic` (types.ts) & CLAUDE.md, tidak perlu kode tambahan, cuma kejelasan dokumentasi.
- **Kenalan seragam dgn Vocab/Listening** & **Reading tidak ikut Tantangan Bos** — TIDAK diubah, sengaja dibiarkan sbg keputusan produk yang sudah eksplisit (Kenalan) atau pertanyaan terbuka ke user (Boss), bukan sesuatu yang "salah" perlu diperbaiki sepihak.

Diverifikasi live di browser (Playwright): 10 quiz-dot muncul di kedua soal, jawaban salah mengunci semua opsi & memunculkan "Coba Lagi"/"Lanjut", lompat quiz-dot ke soal manapun berfungsi, 💡 Petunjuk mengeliminasi tepat 2 opsi salah (device masih bisa jawab benar dari 2 sisa), **reload browser di tengah sesi correctly resume di soal yang sama** (bukan reset), `npm run typecheck`/`npm run build` lolos.

---

## 9. Riset: Materi Reading yang Tepat per Level (Starter/Explorer/Adventurer/Achiever/Trailblazer)

Permintaan user lanjutan: "research di kompetitor aplikasi atau lembaga inggris indonesia maupun luar negri tapi utamakan dalam negri... research materi reading per level yang tepat". Prioritas sama dgn §3 (institusi Indonesia dulu, Cambridge YLE/Schools sbg backbone struktural CEFR).

### 9.1 Starter (5–7 th, ≈Pre-A1)

- **Kurikulum Merdeka Fase A** (kelas 1–2): membaca masih DIBACAKAN GURU ("teks pendek sederhana... yang dibacakan oleh guru"), anak merespons lisan/gestur — BUKAN membaca mandiri. Sumber: [wislah.com](https://wislah.com/capaian-pembelajaran-bahasa-inggris-kelas-1-2-sd-fase-a-kurikulum-merdeka/), [modulguruku.com](https://www.modulguruku.com/2023/07/cp-kurikulum-merdeka-fase-a-kelas-1-dan-2.html).
- **EF Indonesia Small Stars (3–6 th)** — irisan usia dgn Starter — "read words and short phrases" + phonics ringan. **Kumon** mulai dari "Look, Listen and Repeat" (kata↔gambar), belum kalimat. Sumber: [english1.co.id/smallstars](https://english1.co.id/smallstars), [id.kumonglobal.com/english](https://id.kumonglobal.com/english/).
- **Kalibrasi Cambridge**: Pre A1 Starters (exam Explorer, BUKAN Starter) baru diambil rata-rata usia 7–8 stlh ~100 jam belajar — exam ini "ceiling" utk UJUNG ATAS Starter, bukan pijakan awal. Sumber: [flyersenglish.com](https://flyersenglish.com/en/blog/cambridge-starters-movers-flyers-comparison).
- **Rekomendasi**: **BUKAN format baru** — perluasan LANGSUNG dari `ReadingWordTopic` (format Little Stars): mekanik identik, cuma unitnya naik dari kata tunggal ke FRASA pendek (2–4 kata, mis. "a red ball", "I like cats"), TTS TETAP jadi bantuan aktif (JANGAN dicabut — Fase A eksplisit masih dibacakan guru, belum mandiri).

### 9.2 Explorer (7–9 th, ≈Pre-A1→A1)

- **Kurikulum Merdeka Fase B** (kelas 3–4): "Memahami teks tulis pendek sederhana... dan meresponnya" — tahap PERTAMA anak baca teks tertulis SENDIRI, tapi tetap sederhana/keseharian, belum ada tuntutan inferensi. Sumber: [pembelajaranmendalam.com](https://www.pembelajaranmendalam.com/2025/12/cp-bahasa-inggris-fase-b-sd-mi-kelas-3-4-semester-1-2-kurmer-pm.html).
- **EF Indonesia High Flyers (7–9 th)** — konfirmasi staging yg sama: "level awal fokus ejaan & pengenalan kata" sebelum komprehensi/retelling. Sumber: [english1.co.id/highflyers](https://english1.co.id/highflyers).
- **Cambridge Pre A1 Starters Reading & Writing** (backbone struktural Explorer, 5 part, 25 soal, ~20 menit) — **JAUH lebih ringan & bervariasi** dari format Adventurer yang sudah ada: Part 1 baca 1 kalimat ttg gambar → centang/silang benar-salah; Part 2 ya/tidak ttg 1 gambar besar; Part 3 eja kata dari huruf acak (sudah tercakup Eja Kata Vocab); Part 4 cloze dgn word-bank bergambar; Part 5 cerita 3-gambar, jawab 1 kata. Sumber: [cambridgeenglish.org/.../starters/format](https://www.cambridgeenglish.org/exams-and-tests/qualifications/young-learners/paper/starters/format/).
- **Rekomendasi**: **FORMAT BARU** (bukan versi kecil dari format Adventurer) — silent (TANPA TTS, ini titik PERTAMA di tangga Reading yang benar² menguji baca mandiri), 1 KALIMAT ttg 1 gambar → jawab Benar/Salah atau Ya/Tidak (pola Cambridge Starters Part 1/2, gambar tetap jadi jangkar/anchor) — BUKAN passage multi-kalimat + MCQ komprehensi (itu prematur di Fase B, & Starters exam sendiri belum sekompleks itu).

### 9.3 Adventurer (9–11 th, ≈A1) — validasi format existing

- **Kurikulum Merdeka Fase C** (kelas 5–6): "Memahami alur informasi... gagasan utama dan informasi rinci dari beragam teks pendek" — cocok hampir 1:1 dgn "baca passage → jawab MCQ komprehensi" yang SUDAH ada. Sumber: [pembelajaranmendalam.com](https://www.pembelajaranmendalam.com/2025/12/cp-bahasa-inggris-fase-c-kelas-5-dan-6-sd-mi-semester-1-2-kurmer-pm-terbaru.html).
- **Cambridge A1 Movers Reading & Writing** (backbone struktural, 6 part, 35 soal) — Part 5 (cerita 3-panel, lengkapi kalimat 1–3 kata) adalah analog TERDEKAT dari `story`+`question` yang sudah ada (app ini pakai tap-MCQ, bukan isi-sendiri — pilihan kid-friendly yang konsisten). Sumber: [cambridgeenglish.org/.../movers/format](https://www.cambridgeenglish.org/exams-and-tests/qualifications/young-learners/paper/movers/format/).
- **VERDICT: format existing (`ReadingTopic`, primer→drill→story+question, TANPA TTS) TERVALIDASI, TIDAK PERLU diganti.** Movers py variasi tipe soal lebih banyak (matching definisi-kata, lengkapi dialog, cloze+pilih judul) — ide pengembangan masa depan (BUKAN prioritas sesi ini): tambah 1 tipe soal cloze-dalam-passage (blank di tengah kalimat, pilih kata yang tepat) sbg variasi ke-2, bukan ganti format.
- **🔒 Update audit (§16)**: riset di atas cuma 2 sumber (Kurikulum Merdeka + Cambridge), lebih tipis dari level/skill lain — sesi audit terpisah menambah EF Indonesia/LIA GEYL/Kumon Indonesia utk Reading Adventurer spesifik, MEMPERKUAT (bukan membantah) verdict di atas. Detail lengkap §16.

### 9.4 Achiever (11–13 th, ≈A1→A2, di ANTARA Fase C dan D)

- **Kurikulum Merdeka Fase D** (kelas 7–9): tahap PERTAMA yang eksplisit minta inferensi — "mengidentifikasi tujuan teks dan mulai melakukan inferensi utk memahami informasi tersirat" (ceiling ≈B1, LEBIH TINGGI dari target Achiever A1→A2, jadi ambil ARAHNYA bukan kedalaman penuhnya). Sumber: [kumparan.com](https://kumparan.com/ragam-info/capaian-pembelajaran-bahasa-inggris-fase-d-kurikulum-merdeka-245lwEdYQMR).
- **EF Indonesia Trailblazers (10–14 th)** — irisan usia dgn Achiever — eksplisit ajarkan "skimming and scanning", identifikasi detail penting, meringkas, menebak kosakata dari konteks (≈A2–B1). Sumber: [english1.co.id/trailblazers](https://english1.co.id/trailblazers).
- **Cambridge A2 Flyers Reading & Writing** (backbone struktural, 7 part, 44 soal) — Part 4 (10 soal cloze MCQ di teks LEBIH PANJANG, bantuan gambar dikurangi) & Part 6 (cloze surat/diary TANPA word-bank sama sekali) menunjukkan Flyers naik signifikan dari Movers. TIDAK ADA matching-paragraf-ke-judul di level ini (itu muncul di CEFR lebih tinggi). Sumber: [cambridgeenglish.org/.../flyers/format](https://www.cambridgeenglish.org/exams-and-tests/qualifications/young-learners/paper/flyers/format/).
- **Rekomendasi**: **"Format C+"** — perluasan LANGSUNG dari format Adventurer (DNA sama: baca silent → jawab MCQ), BUKAN format baru terpisah: (1) passage lebih panjang (4–6 kalimat, naik dari 1–2), (2) kurangi bantuan gambar di sebagian soal (pola Flyers Part 4/6), (3) tambah 1 tipe soal cloze-dalam-passage, (4) WAJIB tepat 1 pertanyaan INFERENSI per passage (bukan cuma fakta literal) — jembatan menuju Fase D/Trailblazer.

### 9.5 Trailblazer (12+ th, ≈B1, "jalur lanjutan") — apakah butuh revisi penuh spt Listening?

- **Cambridge KET (A2 Key for Schools) → PET (B1 Preliminary for Schools)**: KET 5 part/30 soal (MCQ teks pendek, matching multi-teks, cloze); PET 6 part/32 soal — TAMBAHAN utamanya "**gapped text**" (kalimat UTUH dicabut dari passage, anak masukkan balik ke tempat yang tepat — menguji kohesi antar-kalimat, bukan cuma kosakata/gap kata). Sumber: [cambridgeenglish.org/.../key/format](https://www.cambridgeenglish.org/exams-and-tests/qualifications/key/format/), [test-english.com](https://test-english.com/exams/b1-preliminary/b1-pet-exam-1-reading/).
- **VERDICT: TIDAK ditemukan alasan kuat utk revisi penuh** (beda dari Listening, yang lompatan KET→PET-nya memperkenalkan SKILL BARU — inferensi sikap dari dialog panjang — yang belum ada di level manapun). Lompatan Reading KET→PET lebih ke "tipe soal serupa, teks lebih panjang, lebih banyak isian bebas" — intensitas naik, BUKAN kategori skill baru. **Satu pengecualian**: "gapped text" (kohesi kalimat) genuinely belum ada di tangga Reading manapun — dicatat sbg KANDIDAT format baru, TAPI menunggu keputusan scope eksplisit user (pola sama Listening §3F: PRD §9 "low-effort 1-2 modul" TETAP berlaku sampai ada instruksi baru).

### 9.6 Tangga Kesulitan Reading — 4 Format Lintas 6 Level

Beda dari Listening (Explorer & Adventurer BERBAGI 1 format lama) — bukti Cambridge Starters vs Movers cukup beda strukturnya (benar-salah+matching vs passage+MCQ) sehingga **Explorer butuh formatnya SENDIRI**, tidak bisa gabung ke format Adventurer:

| Format | Level | Mekanik | Status |
|---|---|---|---|
| **A — Kata/frasa↔gambar** | Little Stars, Starter | `ReadingWordTopic` | **DIBANGUN** — Little Stars 1 topik, Starter 1 topik (§10.1) |
| **B — Kalimat tunggal, Benar/Salah** | Explorer | `ReadingCheckTopic` (BARU), TTS TIDAK PERNAH | **DIBANGUN** — 1 topik (§10.2) |
| **C — Passage silent → MCQ** | Adventurer | `ReadingTopic` (TERVALIDASI) | **DIGENAPKAN** — 10/10 topik (§10.3) |
| **C+ — Passage lebih panjang + 1 inferensi** | Achiever | `ReadingTopic` (reuse, konten lebih berat) | **DIBANGUN** — 1 topik (§10.4), cloze BELUM (opsional, gap) |
| **C+ (lanjutan) — Passage B1 + inferensi** | Trailblazer | `ReadingTopic` (reuse, konten lebih berat lagi dari Achiever) | **DIBANGUN** — 5 topik (§10.6), target BARU ≥5 topik TERCAPAI. "Gapped text" (kohesi kalimat PET) TETAP kandidat masa depan, belum dibangun |

---

## 10. Implementasi Sesi Lanjutan — Starter, Explorer, Adventurer, Achiever

Permintaan user: pilih SEMUA 4 opsi ("Starter, Genapkan Adventurer, Explorer format baru, Achiever perluasan format") sekaligus dari hasil riset §9.

### 10.1 Starter — Perluasan Langsung Format A

`READING_TOPICS_STARTER` (`content.ts`) — 1 topik `baca-tempat` ("Membaca Frasa: Tempat"), 10 FRASA (bukan kata tunggal) dipetakan dari `VOCAB_TOPICS_STARTER` topik `tempat-di-sekitar`: "At The Park"/"At The Zoo"/"At The Beach"/dst — preposisi+the+tempat, panjang konsisten 3 kata. **ZERO kode baru** — reuse persis `ReadingWordTopic`/`renderKenalanWord`/`runLatihanIntiWord`/`runTantanganWord`, cuma daftar terdaftar ke `READING_TOPICS_BY_LEVEL['starter']`. TTS tetap aktif (sesuai riset §9.1 — Fase A masih "dibacakan guru").

### 10.2 Explorer — Format KETIGA BARU "Baca & Nilai"

**Tipe baru** (`types.ts`): `ReadingCheckItem` (`emoji`/`trueSentence`/`falseSentence`/`id`) & `ReadingCheckTopic` (`checks: ReadingCheckItem[]`). Pembeda runtime BERTINGKAT: `'items' in topic` (Format A) → `'checks' in topic` (Format B, BARU) → else (Format C, lama). `AnyReadingTopic` diperlebar jadi union 3.

**1 topik**: `baca-dan-cek` ("Baca & Cek: Sifat Benda"), 10 item dipetakan dari `VOCAB_TOPICS` (Explorer) topik `kata-sifat` (Adjectives & Opposites) — domain ini SENGAJA dipilih krn tiap kata sudah py lawan kata alami (big↔small), jadi `falseSentence` cukup ganti PERSIS 1 kata sifat jadi lawannya (near-miss masuk akal, bukan absurd).

**3 fungsi baru** (`games/reading.ts`): `renderKenalanCheck` (silent, TANPA TTS/mic/game — konsisten keluarga "silent reading" dgn format lama, BEDA dari Kenalan Format A yg audio-aktif), `runLatihanIntiCheck` ("🤔 Benar atau Salah?" — gambar+1 kalimat dipilih ACAK true/false 50/50, jawab Benar✅/Salah❌, TANPA hint krn biner), `runTantanganCheck` ("🔍 Baca & Temukan" — kalimat SENDIRIAN tanpa gambar → pilih gambar dari 4 opsi emoji-only, DENGAN hint krn 4 pilihan). Section persistence (`ensureSection`/dst) & `readingTopicPercent()` (diparameterkan ulang terima `tantangan?: {section, total}`, section Explorer `'tantangan-cek'`) dipasang SEJAK AWAL — tidak menunggu retrofit spt Format A kemarin.

**`app.ts`** — `runStage`/`runFreePlayRound`/`topicProgressPercent` dapat cabang KETIGA `'checks' in topic`.

### 10.3 Adventurer — Genapkan 2→10 Topik

8 topik baru ditambahkan LANGSUNG ke `READING_TOPICS_ADVENTURER` (`content.ts`): `hari-sekolah`, `pesta-ulang-tahun`, `belanja-di-pasar`, `hari-hujan`, `hari-olahraga`, `memasak-di-dapur`, `taman-bermain`, `perjalanan-kereta` — skenario keseharian anak 9–11 th, format `ReadingTopic` APA ADANYA (§9.3 sudah konfirmasi TERVALIDASI, tidak perlu diubah). Pola anti-tebak dipertahankan konsisten dgn 2 topik asli: `drill` sengaja sebut distraktor di teks (dilekatkan ke hal LAIN), opsi `story` akhir SEMUA disebut di teks (anak wajib baca semua baris). **Target CLAUDE.md ≥10 topik/skill TERCAPAI** utk Adventurer Reading — level pertama yg mencapai target ini.

### 10.4 Achiever — "Format C+" via Konten, Bukan Mekanik Baru

`READING_TOPICS_ACHIEVER` (BARU, `ReadingTopic` — TIDAK ada tipe baru) — 1 topik `hari-piknik` ("Picnic Day"): `story` diperpanjang jadi 4 kalimat (naik dari 3 kalimat Adventurer), `question` akhir WAJIB **inferensi** (jawaban "bebek memakan sandwich" TIDAK PERNAH ditulis literal — anak gabungkan 2 info: keranjang kosong + bebek jalan pergi di dekatnya). Poin (3) riset §9.4 (cloze-dalam-passage) SENGAJA belum dibangun — di luar scope "reuse tipe existing", dicatat di §11 gap.

### 10.5 Verifikasi

`npm run typecheck`/`npm run build` (+ `verify:content` bawaan repo) lolos di semua tahap. Diuji live di browser (Playwright + Chromium headless) utk KEEMPAT level:
- Menu Belajar: kartu Reading muncul di Starter/Explorer/Adventurer/Achiever (sebelumnya tersembunyi 3 dari 4).
- Starter: format kata↔gambar jalan dgn frasa (bukan kata tunggal) tanpa masalah.
- Explorer (format BARU): "🤔 Benar atau Salah?" — 10 quiz-dot, kalimat silent (TANPA tombol audio sama sekali, dikonfirmasi visual), jawab Benar/Salah. "🔍 Baca & Temukan" — 💡 Petunjuk eliminasi tepat 2 dari 4 opsi, lompat quiz-dot ke soal 5 lalu **reload browser correctly resume di soal 5** (bukan reset) — persistence BARU ini jalan benar sejak awal, tidak perlu retrofit.
- Adventurer: topik baru "Hari Sekolah" ter-render penuh (Kenalan 2 primer, cerita 4 baris di topik lain).
- Achiever: topik "Hari Piknik" — cerita 4 kalimat + pertanyaan inferensi ter-render dgn benar via mekanik `ReadingTopic` yg sama persis.
- 0 `pageerror` di semua 4 level, cuma warning 401 jaringan (sync progress, di luar scope, tidak ganggu gameplay).

### 10.6 Trailblazer — 🔒 Revisi Target (5 Topik, Bukan Lagi "1-2 Modul")

Permintaan user LANJUTAN (bukan bagian 4 opsi §10.1–10.4): **"apakah bisa untuk Trailblazer minimal 5 topik... Little Stars/Starter/Explorer/Adventurer/Achiever min 10 topik"** — merevisi target lama PRD §9 "low-effort, 1-2 modul preview" jadi **minimal 5 topik/skill** utk Trailblazer (TETAP lebih ringan dari 5 level lain ≥10, levelnya tetap "jalur lanjutan"). Rule baru ini ditambahkan ke CLAUDE.md ("🎯 Target Kelengkapan Konten per Modul" poin 1) & PRD.md (§9, §16.14) — **berlaku sbg TARGET KE DEPAN lintas skill**, TIDAK memaksa retroaktif skill yg sudah dikunci ke target lama dgn keputusan sadar (mis. Vocabulary Trailblazer TETAP 2 modul, blm disentuh sesi ini).

**Implementasi Reading**: `READING_TOPICS_TRAILBLAZER` (BARU, `content.ts`) — **5 topik**, TETAP format LAMA `ReadingTopic` (sama tipe dgn Adventurer/Achiever, TIDAK ada tipe baru) — riset §9.5 sudah konfirmasi tidak ada alasan kuat utk revisi mekanik penuh. Konten dinaikkan intensitasnya LEBIH JAUH dari Achiever (kalimat majemuk, konektor "however/although/instead", tema B1 remaja 12+): `wawancara-radio-sekolah` (School Radio Interview), `liburan-yang-berubah` (A Holiday That Changed), `proyek-lingkungan` (Environmental Project), `kompetisi-robot` (Robotics Competition), `kerja-sukarela` (Volunteer Day) — 5 tema PET-appropriate (komunikasi, perjalanan, lingkungan, teknologi, kerja sosial), SEMUA `question` akhir INFERENSI (pola sama Achiever, konsisten lintas 2 level "lanjutan").

**Diverifikasi live di browser** — kartu Reading muncul utk Trailblazer, KELIMA topik ter-render benar (dicek satu per satu by title), cerita 4-kalimat + pertanyaan inferensi tampil sempurna via mekanik `ReadingTopic` yg sama persis, chip level "✨ Trailblazer" benar. 0 `pageerror`, `npm run typecheck`/`npm run build` lolos.

**Target Reading Trailblazer (5/5) SEKARANG TERCAPAI** — level Reading KEDUA (setelah Adventurer 10/10) yg capai target skillnya masing-masing.

### 10.7 Kenalan Format LAMA Sekarang Py 🔊/🎤/🎮 (permintaan user: "fokus ke materi reading adventure 'Di Kebun Binatang'... apakah di kenalan bisa ditambahkan button sound, mic, dan main? buat simple question/game di button main")

Sebelum revisi ini, Kenalan format LAMA (`renderKenalan`, dipakai SEMUA topik Adventurer/Achiever/Trailblazer — 16 topik total) murni daftar teks statis + terjemahan, TANPA interaksi apa pun selain tombol "Lanjut ke Latihan Inti →". User minta ditambah 3 aksi per ADEGAN (`primer` item), pola sama Kenalan format KEDUA/KETIGA:

- **🔊 Dengar** — `speakSequence(primer[i].passage)`, baca SEMUA baris adegan itu berurutan.
- **🎤 Coba ucapkan** (`sttSupported` saja) — popup skor proporsional (`wordMatchDetail` thd `passage.join(' ')`, BUKAN pass/fail longgar) + tombol "▶️ Play Suaramu" (rekaman paralel `listenAndRecordOnce`) — WAJIB ikut "🔒 Aturan Wajib: Setiap Fitur Speaking Butuh Skor Proporsional + Play Suaramu" krn anak bicara lewat mic di sini, REUSE PERSIS pola yg sama dgn Kenalan format KEDUA/`games/vocabulary.ts`.
- **🎮 Main** (`runSceneMiniGame`, BARU) — user eksplisit minta "simple question/game". **Revisi lanjutan** ("apakah bisa buat simple sehingga beda dengan latihan inti") — versi PERTAMA reuse `drill[i]` verbatim (passage BARU+MCQ gambar), TERNYATA task shape-nya IDENTIK dgn soal Latihan Inti (cuma beda kemasan) — bug redundansi persis yg pernah ditemukan di Kenalan "Main" Listening (CLAUDE.md). Sekarang: **Susun Kalimat sederhana** — ambil kalimat PERTAMA `primer[i].passage[0]` (yg baru saja dibaca anak), tokenize jadi kata-kata (strip tanda baca akhir), acak, anak tap kata dari bank utk susun ulang jadi urutan benar (tap kata yg sudah ditaruh utk lepas lagi, "⌫ Hapus Kata"/"🔄 Bersihkan" utk koreksi) — evaluasi OTOMATIS begitu semua kata tersusun (pola SAMA PERSIS `runSusunKalimat` Vocab Tantangan, direplikasi lokal — helper generik diduplikasi per file game). Task SHAPE genuinely beda dari Latihan Inti (KONSTRUKSI kalimat yg sudah dibaca vs MEMILIH jawaban dari kalimat baru). ZERO data baru diauthoring.

**🔒 Divergensi TERBATAS dari "Reading tidak pernah TTS"** — KHUSUS di Kenalan, BUKAN generalisasi ke Latihan Inti/Tantangan (keduanya TETAP silent, TIDAK disentuh sama sekali). Alasan sah: Kenalan murni EXPOSURE — terjemahan Indonesia SUDAH ditampilkan gratis di sebelah tiap kalimat, jadi tidak ada apa pun yang "diuji" di tahap ini; bantuan dengar-opsional tidak mengubah pengukuran dekoding mandiri yg terjadi di 2 tahap lain (kalimat BARU yang belum pernah dibaca anak). Ini pola divergensi ke-2 yang didokumentasikan di file yang sama (format KEDUA/KETIGA py divergensinya sendiri) — types.ts/CLAUDE.md/PRD.md diupdate biar jelas ini scoped, bukan aturan global baru.

**Diverifikasi live di browser** (topik "Di Kebun Binatang", Adventurer, sesuai fokus user) — 2 adegan, masing² 3 tombol tampil; 🎮 Main scene 1 → susun 4 chip acak ("zoo"/"the"/"visits"/"Zoe") jadi "Zoe visits the zoo" → evaluasi otomatis begitu lengkap → confetti + "Amazing! ⭐" + kembali ke daftar dgn tombol 🎮 jadi hijau "done"; 🔊 scene 2 diputar tanpa crash, tombol jadi hijau. 0 `pageerror`, `npm run typecheck`/`npm run build` lolos.

---

## 11. Gap yang Masih Terbuka Setelah §10 (dilaporkan, bukan dianggap selesai)

- ~~Starter, Explorer, Achiever masing² baru 1 topik~~ — **SEMUA DITUTUP** (Starter §14, Explorer §15, Achiever §17 — masing² digenapkan 1→10). **Reading sekarang TUNTAS ≥10 topik di SEMUA 6 level** (Little Stars/Starter/Explorer/Adventurer/Achiever 10/10, Trailblazer target-khusus 5/5) — skill Reading SELESAI penuh, tidak ada level yg tersisa di bawah target.
- **Cloze-dalam-passage** (poin 3 riset §9.3/§9.4, utk Adventurer & Achiever) belum dibangun — pelengkap opsional yg butuh mekanik baru (blank di tengah kalimat + word-bank), bukan sekadar data.
- **"Gapped text"** (kandidat format D Trailblazer, §9.5) masih murni ide riset, belum ada spesifikasi konkret — TIDAK dibangun sesi ini (§10.6 reuse format lama, bukan format baru).
- **Target BARU Trailblazer (≥5 topik) belum diterapkan ke skill LAIN** (Vocab TETAP 2, Speaking/Grammar/Listening di luar scope dokumen ini) — revisi rule di CLAUDE.md/PRD.md berlaku ke depan per-skill, bukan retroaktif otomatis.
- ~~**Latihan Inti/Tantangan format LAMA masih auto-advance + tanpa hint**~~ — **DITUTUP §12** (redesain penuh, berlaku ke SEMUA 16 topik format lama sekaligus).

---

## 12. Latihan Inti/Tantangan Format LAMA — Redesain Penuh (permintaan user, setelah §10.7 Kenalan direvisi): "di 🎮 sama kan dengan latihan inti tapi di 🎮 ada translasi bahasa indonesia sedangkan di latihan inti dan tantangan translasinya berupa klik button petunjuk dan di latihan inti dan tantangan minimal 10 soal dan di atasnya tambahkan bullet progress yang bisa di klik seperti flow di materi lain di modul vocab"

Sebelum sesi ini, `runLatihanInti`/`runTantangan` format LAMA (`games/reading.ts`, dipakai SEMUA 16 topik Adventurer/Achiever/Trailblazer) adalah SATU-SATUNYA bagian Reading yg BELUM ikut pola mapan Vocab/Listening (CLAUDE.md "Belum dikerjakan"): auto-advance (`setTimeout`), TANPA hint, TANPA navigasi quiz-dot, & Latihan Inti cuma 2 soal / Tantangan cuma 1 soal (jauh di bawah target ≥10 CLAUDE.md). Sesi ini menutup SEMUA gap itu sekaligus.

### 12.1 Skema data baru — `ReadingDrill.id`/`questionId`, `ReadingTopic.storyId`/`question.id`

Prasyarat: `passage`/`question`/`story` format lama TIDAK PERNAH punya terjemahan Indonesia tersimpan (beda dari `primer` yg sejak awal punya `id` di sebelah tiap adegan) — krn dulu memang tidak pernah ditampilkan (silent reading murni). Sekarang translasinya WAJIB ada tapi TERSEMBUNYI DEFAULT (lihat §12.3), jadi types.ts nambah field:

```ts
export interface ReadingDrill {
  passage: string[];
  id: string;        // BARU — terjemahan gabungan `passage`
  question: string;
  questionId: string; // BARU — terjemahan `question`
  opts: ListeningOption[];
}
export interface ReadingTopic {
  // ...
  story: string[];
  storyId: string;   // BARU — terjemahan gabungan `story`
  question: { text: string; id: string; opts: ListeningOption[] }; // `id` BARU
}
```

**96 string baru diauthoring manual** (16 topik × [2 drill × (id+questionId) + storyId + question.id] = 16 × 6) — Adventurer 10, Achiever 1, Trailblazer 5. **Catatan TypeScript penting**: `tsc` MELAPORKAN error utk `drill[].id`/`questionId` & `question.id` yg hilang (nested object literal), TAPI TIDAK PERNAH melaporkan `storyId` yg hilang di level topik (`tsc` tampak berhenti cek sibling property di parent begitu sudah nemu error di nested object literal punya parent yg sama) — jadi migrasi field ini TIDAK BISA divalidasi selesai cuma dari `tsc --noEmit` bersih, WAJIB dicek manual `grep -c "storyId:" content.ts` = 16 (jumlah topik) sebelum dianggap tuntas.

### 12.2 Engine bersama — `runReadingQuizSet()`, gantikan 2 fungsi terpisah yg lebih sederhana

`runLatihanInti`/`runTantangan` sekarang cuma pemanggil tipis ke 1 fungsi generik:

```ts
export function runLatihanInti(container, topic, onDone, level) {
  runReadingQuizSet(container, topic, topic.drill, 'latihan', '🎯 Baca & Jawab', onDone, level);
}
export function runTantangan(container, topic, onDone, level) {
  runReadingQuizSet(container, topic, tantanganPool(topic), 'tantangan-cerita', '🌟 Cerita Mini', onDone, level);
}
```

`runReadingQuizSet()` mengadopsi PERSIS pola yg sudah mapan di Vocab/Listening/Grammar (helper diduplikasi lokal ke `games/reading.ts`, BUKAN diimpor lintas file — konvensi yg sama di seluruh codebase): `ensureSection`/`resetSectionPlan`/`setSectionCursor` (persist per-soal, plan stale otomatis dibangun ulang), `quizNavHtml`/`wireQuizNav` (bullet-progress bisa diklik bebas ke soal mana pun), `lockOptionButtons`+`roundActionsHtml` (1 tap → terkunci → "🔁 Coba Lagi"/"Lanjut ➡️"), `recordAttempt`/`recordEvent`, `pickPraise`/`pickEncourage`+`playCorrectTone`/`playTryAgainTone`+`fireConfetti`.

### 12.3 "💡 Petunjuk" — SATU tombol, tersedia sejak awal, ungkap KEDUA terjemahan sekaligus

```ts
function readingHintButtonHtml(revealed: boolean): string {
  return `<button class="ghost-btn slim" type="button" data-action="petunjuk" ${revealed ? 'disabled' : ''}>💡 Petunjuk</button>`;
}
```

Beda sengaja dari pola `clueButtonsHtml` Listening (2 tombol terpisah, TERKUNCI sampai 1x attempt) — di sini SATU tombol, TIDAK digating attempt (permintaan user tersirat dari "translasinya berupa klik button petunjuk" — bantuan tersedia begitu soal dibuka, bukan hadiah setelah nyoba dulu), tap sekali ungkap `d.id` (terjemahan passage) DAN `d.questionId` (terjemahan pertanyaan) SEKALIGUS. State `revealed` di-reset ke `false` di `draw()` (dipanggil pas PINDAH ke soal baru/`nextRound`) TAPI TIDAK di-reset di `redraw()` (dipanggil dari "Coba Lagi") — pola yg SAMA PERSIS dgn bug `attempted`/`answered` yg sudah ditemukan & didokumentasikan sebelumnya di Listening/Vocab (CLAUDE.md): kalau kebalik, Petunjuk yg sudah "diperoleh" lewat tap bakal terkunci lagi begitu anak coba ulang.

### 12.4 10 soal minimum via cycling, `tantanganPool()` gabungkan drill+cerita jadi "beberapa cerita mini"

`READING_ROUND_SIZE = 10`, dicapai lewat `pickDrillForCount()` (cycle pool via `shuffle()` sampai ≥10, pola SAMA PERSIS `pickItemsForCount` Vocab). Latihan Inti cycle `topic.drill` (2 item/topik) apa adanya. Tantangan BUTUH keputusan desain krn topik cuma py 1 `story`+1 `question` alami — user ditanya via pilihan (AskUserQuestion), pilih **"Gabung drill + cerita jadi 1 pool"**:

```ts
function tantanganPool(topic: ReadingTopic): ReadingDrill[] {
  return [
    ...topic.drill,
    { passage: topic.story, id: topic.storyId, question: topic.question.text, questionId: topic.question.id, opts: topic.question.opts },
  ];
}
```

Jadi Tantangan tiap topik py pool 3 "cerita mini" (2 drill + 1 story yg diratakan jadi bentuk `ReadingDrill`), di-cycle ke 10 soal — **revisi user lanjutan** menegaskan: tiap soal (pertanyaan+jawaban) = 1 bullet dot TERSENDIRI, dan cerita-mini yg beda TETAP tampil sbg dot terpisah (bukan digabung jadi 1 dot per cerita) — persis yg sudah terjadi otomatis dari desain `order: ReadingDrill[]` (list flat 10 slot, tiap slot 1 quiz-dot, terlepas dari cerita mini mana asalnya). Diverifikasi live (topik "Di Kebun Binatang"): 10 round menyiklus PERSIS 3 passage unik (2 drill + 1 story), tiap cerita mini muncul beberapa kali dgn urutan teracak antar-siklus — bukan berurutan monoton.

### 12.5 Diverifikasi live (Playwright, topik "Di Kebun Binatang")

- Latihan Inti: 10 quiz-dot tampil & bisa diklik lompat soal manapun; "💡 Petunjuk" ungkap `id`+`questionId` bareng; jawab benar → confetti+pujian+lock+"Lanjut"; lompat dot ke soal 5 render soal yg benar.
- Tantangan: badge "🌟 Cerita Mini", 10 soal menyiklus 3 passage unik (2 drill+1 story) sesuai desain §12.4.
- Selesaikan Latihan Inti (10/10) LALU Tantangan (10/10) berurutan → layar "Kerja Bagus!" muncul (bukan cuma nyampe di step terakhir — `topicFinished()` gate CLAUDE.md poin 7 Tahap 2 tetap berlaku benar di format lama).
- Reload/kunjungi ulang Latihan Inti setelah selesai → resume tepat di soal 10/10 (persistence `ensureSection`/`setSectionCursor` jalan benar), bukan balik ke soal 1.
- 0 `console error`/`pageerror` di semua skenario, `npm run typecheck`/`npm run build` lolos bersih.

**Scope**: HANYA `runLatihanInti`/`runTantangan` format LAMA (`ReadingTopic`, 16 topik) yg disentuh — Kenalan format lama (§10.7, sudah py 🔊/🎤/🎮 sesi sebelumnya) TIDAK diubah lagi, dan format KEDUA/KETIGA (`ReadingWordTopic`/`ReadingCheckTopic`, Little Stars/Starter/Explorer) TIDAK disentuh (sudah py quiz-dot+hint+persist sejak awal dibangun, lihat §10.1/§10.2). **CLAUDE.md "Belum dikerjakan" utk Reading format lama SEKARANG TERTUTUP** — Vocab/Listening/Reading (SEMUA format) sudah konsisten pola quiz-dot+hint+manual-retry; Grammar format lama (Explorer/Adventurer/Achiever) MASIH jadi satu-satunya sisa gap serupa di seluruh app.

---

## 13. Reading Little Stars Digenapkan 1→10 Topik (permintaan user: "di level little stars materi reading masih 1, buatkan minimal 10 dan research materi yang relevan dengan level little stars... prioritaskan lembaga bahasa inggris dalam negeri")

Little Stars sempat jadi SATU-SATUNYA level yang masih 1/10 topik sejak pilot sesi 1 (`kata-hewan`) — dilaporkan sbg gap terbuka di §7 sejak awal, sekarang ditutup lewat riset konfirmasi + genapkan data (bukan format/mekanik baru).

**Riset konfirmasi** (LIA GEYL, EF Small Stars, Kumon Indonesia — WebSearch) — semuanya menegaskan ulang pola "look, listen and repeat" via kartu bergambar-kata KONKRET sebelum phonics/spelling formal, konsisten dgn kesimpulan riset awal §5 (whole-word/sight-word matching, bukan dekoding kalimat). Tidak ditemukan sumber yg menyarankan urutan kategori spesifik berbeda dari yg sudah dipakai `VOCAB_TOPICS_LITTLE_STARS` — jadi keputusan desain: GENAPKAN dari domain Vocab Little Stars yg BELUM disentuh Reading (pola 1:1 yg sama dgn `kata-hewan`←`hewan-peliharaan`), urutan REUSE urutan asli Vocab (progresi "konsep dasar → diri/keluarga → benda sehari-hari" yg sudah mencerminkan Kurikulum Merdeka Fase Fondasi & Kumon level 7A→6A).

**9 topik baru** (`READING_TOPICS_LITTLE_STARS`, `content.ts`) — `kata-warna`/`kata-angka`/`kata-bentuk`/`kata-keluarga`/`kata-tubuh`/`kata-buah`/`kata-mainan`/`kata-pakaian`/`kata-kendaraan`, masing² 10 kata `ReadingWordItem` (`en`/`id`/`emoji`, TANPA `example` — field itu memang tidak ada di tipe ini) disalin 1:1 dari item Vocab `kenal-warna`/`angka-pertama`/`bentuk`/`keluargaku`/`tubuhku`/`buah-buahan`/`mainan`/`pakaian`/`kendaraan`. Id topik SENGAJA beda dari id Vocab sumbernya (konvensi `kata-hewan` yg sudah ada), dicek manual TIDAK bentrok dgn id apa pun lintas skill di `content.ts`.

**2 domain Vocab Little Stars SENGAJA DILEWATI** (bukan lupa — 12 domain Vocab, 1 dipakai sesi awal + 9 sesi ini = 10, 2 sisa):
- `salam-sopan-santun` — SATU-SATUNYA domain yg ditandai `iconAmbiguous:true` di Vocab (emoji gestur/ekspresi mis. 😔 utk "Sorry" multi-tafsir tanpa teks penjelas) — fatal utk Reading krn jawaban Latihan Inti "🎯 Baca & Tunjuk" MURNI gambar emoji tanpa label teks (`optHtml`, sengaja anti-tebak) — anak yg belum bisa baca tidak akan bisa membedakan opsi ambigu. Kata²nya jg frasa 2-3 kata ("Good Morning"/"Excuse Me"), bukan kata benda tunggal spt 9 domain lain.
- `perasaanku` — konsep EMOSI abstrak, ditaruh PALING TERAKHIR di urutan asli `VOCAB_TOPICS_LITTLE_STARS` (posisi ke-12 dari 12) krn kompleksitas kognitifnya lebih tinggi dari kata benda konkret — konsisten dgn keputusan yg sama, disisakan sbg kandidat kalau nanti diminta genapkan lebih jauh dari target baku ≥10 (`kata-hewan` cukup 10 topik, tidak perlu 12 kecuali diminta eksplisit — pola sama dgn Vocab Explorer yg berhenti tepat di 10, bukan overshoot tanpa arahan).

**Diverifikasi**: `npm run typecheck`/`npm run verify:content`/`npm run verify:duplicates`/`npm run build` semua lolos bersih. Live di browser (Playwright + Chromium headless) — Menu Materi Reading Little Stars menampilkan 10 kartu topik (semua judul benar, "Membaca Kata: Hewan/Warna/Angka/Bentuk/Keluarga/Tubuh/Buah/Mainan/Pakaian/Kendaraan"), Kenalan topik `kata-warna` render normal, Latihan Inti topik `kata-kendaraan` (topik terakhir) menampilkan 4 opsi jawaban dgn benar — 0 `pageerror`/console error.

**Reading sekarang 10/10 di 3 dari 6 level** (Little Stars, Adventurer, Trailblazer target-khusus 5/5) — Starter/Explorer/Achiever masih 1/10 masing², dilaporkan sbg gap terbuka (§11), bukan dianggap selesai.

---

## 14. Reading Starter Digenapkan 1→10 Topik (permintaan user: "di level starter materi reading masih 1, buatkan minimal 10 dan research materi yang relevan dengan level starter... prioritaskan lembaga bahasa inggris dalam negeri")

Pola persis §13 (Little Stars), giliran Starter. Riset konfirmasi ulang (LIA GEYL, EF Small Stars, Kumon Indonesia) tidak menemukan alasan utk menyimpang dari domain `VOCAB_TOPICS_STARTER` yg sudah ada — genapkan lewat 9 topik baru dipetakan dari 9 domain Vocab Starter yg belum disentuh Reading (`angka-11-20`/`hari-dalam-seminggu`/`serangga`/`makanan-favoritku`/`barang-di-rumah`/`di-sekolah`/`orang-di-sekitarku`/`alam-sekitar`/`hobi` → `baca-angka`/`baca-hari`/`baca-serangga`/`baca-makanan`/`baca-barang`/`baca-sekolah`/`baca-orang`/`baca-alam`/`baca-hobi`). **Beda dari Little Stars: SEMUA 9 domain dipakai, 0 dilewati** — Vocab Starter tidak punya domain berlabel `iconAmbiguous` (satu-satunya alasan Little Stars melewati `salam-sopan-santun`), dan tidak ada domain seabstrak `perasaanku` di daftar Starter.

**Frasa (bukan kata tunggal, konsisten desain Starter §9.1) dikonstruksi natural per-domain**, mengikuti kealamian bahasa Inggrisnya sendiri (bukan 1 template kaku dipaksakan ke semua — pola yg sama dgn `baca-tempat` yg sudah mencampur "At The X"/"On The X"): `The X` (serangga/barang-di-rumah/alam/sebagian orang — benda/makhluk yg wajar dipakai artikel "the"), `I Like X` (makanan/hobi — utk hobi REUSE PERSIS `item.example.en` yg sudah ada), `My X` (hal personal — teman/kotak bekal/seragam/PR/tetangga/sahabat/kembaran), `On <Hari>` (7 nama hari) dicampur `I Play(ed) Today/Tomorrow/Yesterday` (tense disesuaikan spy tetap gramatikal — present utk today/tomorrow, past utk yesterday, BUKAN dipaksa 1 pola yg salah gramatikal), `<Angka> <Benda Jamak>` (reuse kata benda dari `item.example.en` tiap angka, mis. "Eleven Stickers"). ZERO kosakata baru — semua kata sumbernya sudah ada di Vocab Starter, cuma dirangkai ulang jadi unit frasa baca.

**Diverifikasi**: `npm run typecheck`/`verify:content`/`verify:duplicates`/`build` semua lolos bersih. Live di browser (Playwright + Chromium headless) — Menu Materi Reading Starter menampilkan 10 kartu topik (semua judul benar), Kenalan topik `baca-barang` render normal, Latihan Inti topik `baca-hobi` (topik terakhir) 4 opsi jawaban tampil, Tantangan topik `baca-hari` "🖼️ Lihat & Baca" render 10 quiz-dot + opsi frasa "On Sunday"/"On Fr..." dgn benar — 0 `pageerror`/console error.

**Reading sekarang 10/10 di 4 dari 6 level** (Little Stars, Starter, Adventurer, Trailblazer target-khusus 5/5) — Explorer/Achiever masih 1/10 masing², dilaporkan sbg gap terbuka, bukan dianggap selesai.

---

## 15. Reading Explorer Digenapkan 1→10 Topik (permintaan user: "di level explorer materi reading masih 1, buatkan minimal 10 dan research materi yang relevan dengan level explorer... utamakan dalam negri")

Pola serupa §13/§14, giliran Explorer — TAPI format Explorer (`ReadingCheckTopic`, "Baca & Nilai" Benar/Salah) py kendala baru: topik pertama (`baca-dan-cek`) sengaja dipetakan dari domain `kata-sifat` (Adjectives & Opposites) krn tiap kata sudah py lawan kata alami (big↔small) — 9 domain `VOCAB_TOPICS` (Explorer) sisanya (`keluarga`/`angka`/`warna`/`kesehatan`/`belanja-uang`/`waktu-harian`/`negara`/`pesta-perayaan`/`peralatan-dapur`) SEMUANYA kata benda, TIDAK py pasangan lawan kata alami spt adjective.

**Riset** (WebSearch, LIA GEYL) mengonfirmasi program GEYL (General English for Young Learners, usia 7-12, irisan penuh dgn Explorer 7-9) eksplisit mencakup kosakata keluarga/uang/waktu/negara via pendekatan komunikatif — tidak ada alasan utk menyimpang dari domain `VOCAB_TOPICS` yg sudah ada, konsisten pola §13/§14.

**Adaptasi mekanik `falseSentence` per tipe domain** (bukan 1 pendekatan seragam dipaksakan): (1) domain `warna` REUSE PERSIS pola adjective asli — `item.example.en` Vocab-nya sendiri sudah berbentuk "The X is <warna>." (mis. "The apple is red."), `falseSentence` cukup ganti kata warna ke warna sibling ("The apple is blue.") — paling natural krn warna jg py struktur deskriptif spt kata sifat, TIDAK perlu template baru; (2) 8 domain benda murni lainnya (keluarga/angka/kesehatan/uang/waktu/negara/pesta/dapur) pakai frasa natural per-domain yg SAMA utk semua item dlm 1 topik ("This is a/an X."/"I am from X."/"It is X."/dst — bukan 1 template universal lintas SEMUA 9 topik, tiap domain py frasa sendiri yg paling alami), `falseSentence` ganti KATA BENDA/FAKTA ke item SIBLING dalam topik yang sama (bukan lawan kata krn tidak semua py antonim), umumnya berpasangan 2-arah (mis. Mother↔Father, Coin↔Money) supaya tiap item py near-miss yg jelas beda & mudah dibedakan. Semua `falseSentence` tetap kalimat gramatikal UTUH (bukan kata acak), konsisten prinsip "near-miss masuk akal, bukan absurd" dari topik pertama.

**Verifikasi tambahan KHUSUS sesi ini** (di luar `npm run build`) — dibuat skrip ad-hoc (tidak disimpan ke repo, sama pola sesi lama sblm `verify-vocab-content.mjs` dibangun) yg meng-import `READING_TOPICS_EXPLORER` via esbuild & mengecek TIDAK ADA item dgn `trueSentence === falseSentence` (bug yg akan bikin soal selalu "benar" apa pun dijawab) — **100/100 checks lolos (10 topik × 10 item)**, 0 masalah. `npm run verify:duplicates` TIDAK mencakup `ReadingCheckTopic` (scope-nya cuma 4 format lama yg py sibling array — dicatat sbg gap otomasi kalau nanti mau diperluas), jadi cek manual ini melengkapi gap itu utk sesi ini.

**Diverifikasi**: `npm run typecheck`/`verify:content`/`verify:duplicates`/`build` semua lolos bersih. Live di browser (Playwright + Chromium headless) — Menu Materi Reading Explorer menampilkan 10 kartu topik (semua judul benar), Kenalan topik `cek-kesehatan` render normal, Latihan Inti topik `cek-dapur` (topik terakhir) "🤔 Benar atau Salah?" tampil dgn kalimat+2 tombol, Tantangan topik `cek-angka` "🔍 Baca & Temukan" render 10 quiz-dot + kalimat "This is the number eight." + 4 opsi emoji angka — 0 `pageerror`/console error.

**Reading sekarang 10/10 di 5 dari 6 level** (Little Stars, Starter, Explorer, Adventurer, Trailblazer target-khusus 5/5) — HANYA Achiever yang masih 1/10, dilaporkan sbg gap terbuka, bukan dianggap selesai.

---

## 16. Audit Reading Adventurer (permintaan user: "audit materi reading di adventure apakah sudah sesuai dengan levelnya? dan sudah research ke lembaga bahasa inggris lain?")

**Konten (semua 10 topik, `READING_TOPICS_ADVENTURER`) dibaca ulang penuh baris-per-baris utk audit ini** — verdict: **SESUAI level, kualitas baik, TIDAK ditemukan bug/kesalahan konten**:
- Kalimat konsisten simple present/past, pendek (5–12 kata), tanpa struktur majemuk kompleks — pas A1 Movers.
- Kosakata SEMUA dalam rentang A1–A2 rendah (zoo/school/market/rain/sports/cooking/playground/train — tidak ada kata di luar wordlist YLE).
- **Pola anti-tebak dipertahankan KONSISTEN di 10/10 topik** — distraktor SELALU disebut jelas di teks (bukan cuma jawaban benar) tapi dilekatkan ke subjek/waktu LAIN (mis. `hari-hujan`: Dito melompati genangan besar, KAKAKNYA yg jalan mengitari genangan kecil — anak wajib baca siapa-ngapain, bukan cocok-gambar-hewan-pertama-yg-kelihatan).
- Variasi tipe pertanyaan bagus (what/where/how many/which/why) — `belanja-di-pasar` bahkan py 1 pertanyaan "why" beralasan (jawabannya tetap tersurat di teks, bukan pelanggaran "tanpa inferensi di Adventurer" §9.4).
- 0 kesalahan tata bahasa/typo ditemukan.

**Riset yg SUDAH ada (§9.3) TERNYATA lebih tipis dari level/skill lain** — cuma 2 sumber (Kurikulum Merdeka Fase C + Cambridge A1 Movers), TIDAK ada institusi swasta Indonesia (LIA/EF/Kumon) dicek eksplisit utk Reading Adventurer — beda dari Little Stars/Starter/Explorer Reading (§13/§14/§15, semua cek LIA GEYL/EF Small Stars/Kumon Indonesia) DAN dari Grammar/Speaking/Listening Adventurer (`materi/grammar.md`/`materi/speaking.md`/`materi/listening.md`, semua cek EF Indonesia + LIA + Kumon eksplisit). Riset TAMBAHAN dilakukan sesi audit ini (WebSearch) utk menutup gap itu:

- **EF Indonesia — konfirmasi batas tier**: "High Flyers" resmi utk usia **6–10 th** (bukan 7-9 spt sering dikutip sesi lain — situs resmi english1.co.id mengonfirmasi rentang 6-10), beralih ke "Trailblazers" di usia **10–14 th**. Adventurer (9-11 th) app ini PERSIS di titik peralihan 2 tier EF ini — **konsisten dgn temuan `materi/grammar.md` §17 utk skill Grammar level yg sama** (bukan temuan baru, tapi baru pertama kali dikonfirmasi jg utk Reading). Tidak ada materi baca EF yg dipublikasikan detail (proprietary), jadi cuma konfirmasi RENTANG USIA, bukan daftar topik spesifik.
- **LIA GEYL**: program GEYL usia 7-12 th (levels 1-6, Adventurer masuk level 4-6 berdasar struktur jam belajar) eksplisit cakup vocabulary keluarga/uang/waktu/negara — **PERSIS domain yg sudah dipetakan** ke Reading Explorer sesi §15 (kata-sifat/keluarga/angka/warna/kesehatan/uang/waktu/negara/pesta/dapur) & jadi tema harian di Reading Adventurer (`belanja-di-pasar`≈uang, `hari-hujan`/`hari-olahraga`≈waktu/keseharian) — cocok, tidak ada domain asing.
- **Kumon Indonesia — temuan PALING PENTING**: level D2 (kira-kira ekuivalen usia 9-11) SUDAH eksplisit mengajarkan "**identifying the main idea, summarizing key details, and inferring meaning from context**" — artinya Kumon memperkenalkan INFERENSI lebih awal dari desain app ini (yg sengaja menunda inferensi sampai Achiever, §9.4). **Ini BUKAN berarti Adventurer app ini salah** — backbone resmi yg dipilih app ini utk level ini adalah **Cambridge A1 Movers** (bukan Kumon), dan Movers Reading & Writing resmi TIDAK py komponen inferensi (itu baru muncul di Flyers/Achiever) — keputusan §9.4 (inferensi mulai Achiever) tetap konsisten dgn backbone CEFR yg dipilih. TAPI ini data poin yg jujur perlu dicatat: kalau Kumon (institusi pembanding, bukan backbone) dijadikan acuan, anak Adventurer YANG SUDAH SIAP secara individual mungkin bisa diberi inferensi lebih awal — **dicatat sbg opsi masa depan (BUKAN perubahan sesi ini)**, sama prinsipnya dgn "cloze-dalam-passage" yg juga masih di §11 gap, menunggu keputusan scope eksplisit user.

**VERDICT AUDIT**: Format & konten Reading Adventurer **SESUAI level & TIDAK PERLU diubah** — riset §9.3 yg sudah ada (Kurikulum Merdeka + Cambridge Movers) tetap valid sbg dasar keputusan format, riset tambahan sesi ini (EF/LIA/Kumon) MEMPERKUAT validasi itu (bukan membantahnya) sekaligus mengungkap 1 data poin (Kumon py inferensi lebih awal) yg dicatat sbg kandidat pengembangan opsional, bukan cacat yg wajib diperbaiki.

---

## 17. Reading Achiever Digenapkan 1→10 Topik — Reading TUNTAS di Semua 6 Level (permintaan user: "di level achiver materi reading masih 1, buatkan minimal 10 dan research materi yang relevan dengan level achiver... utamakan dalam negri")

Level TERAKHIR yg masih di bawah target ≥10 — sesi ini menutup Reading skill secara PENUH di seluruh 6 level.

**Riset** (WebSearch) mengonfirmasi **EF Indonesia Trailblazers** (10-14 th, irisan penuh dgn Achiever 11-13) eksplisit fokus "topik-topik menarik yang relevan dengan kehidupan nyata... melatih kreativitas serta kemampuan berpikir kritis", dan **Kumon EFL** eksplisit fokus "reading comprehension dan kemampuan berpikir kritis" tingkat lanjut. Keduanya MEMPERKUAT arah yg sudah dipilih sesi awal (§9.4): skenario kehidupan nyata + WAJIB pertanyaan inferensi — tidak ada alasan mengubah format, murni genapkan konten.

**9 topik baru** (`READING_TOPICS_ACHIEVER`), masing² dipetakan dari 1 domain `VOCAB_TOPICS_ACHIEVER` yg belum disentuh Reading, dibungkus jadi SKENARIO NARATIF (beda dari format `ReadingWordTopic`/`ReadingCheckTopic` yg mapping 1:1 kata→item — format LAMA `ReadingTopic` dari awal memang berbasis CERITA, bukan daftar kata, konsisten pola Adventurer §10.3):

| Domain Vocab | Topik Reading | Skenario |
|---|---|---|
| `ciri-ciri-fisik` | `mencari-sahabat-pena` | Menjemput sahabat pena di bandara, salah kenali orang dari ciri fisik |
| `tempat-di-kota` | `jalan-jalan-di-kota` | Muter kota (bank/kantor pos/supermarket/museum), lomba kejar jam tutup |
| `arah-posisi` | `mencari-alamat` | Nyasar krn 2 jalan nama sama, ikuti arah kiri/kanan/lurus |
| `hiburan-waktu-luang` | `akhir-pekan-di-rumah` | Pilih main gim vs catur dgn kakak yg minta tanding ulang |
| `kata-kerja-lanjutan` | `main-petak-umpet` | Petak umpet, temukan tempat sembunyi dari petunjuk visual |
| `teknologi-internet` | `tugas-sekolah-online` | Tugas online, lupa simpan sebelum komputer mati |
| `sifat-kepribadian` | `murid-baru-di-kelas` | Murid baru pendiam, kepribadiannya disimpulkan dari TINDAKAN (bukan disebut langsung) |
| `mata-pelajaran` | `memilih-proyek-sekolah` | Memilih proyek sekolah, disimpulkan dari kendala waktu+minat |
| `angka-puluhan` | `menggalang-dana-sekolah` | Galang dana sekolah, anak HARUS MENGHITUNG SENDIRI (90rb+10×1rb=100rb) utk simpulkan target tercapai |

**1 domain SENGAJA dilewati** (`sifat-benda-lanjutan` — wet/dry/soft/hard/sharp/dst) — bukan lupa, domain ini paling sulit dirangkai jadi narasi personal dibanding 9 domain lain (lebih cocok framing sains/sensorik drpd recount cerita), disisakan sbg opsi kalau mau digenapkan lebih jauh dari target baku ≥10.

**SEMUA 9 topik konsisten "Format C+" §9.4**: `story` 4 kalimat (naik dari 3 Adventurer), `question` akhir WAJIB INFERENSI — jawaban TIDAK PERNAH ditulis literal di teks manapun, anak gabungkan ≥2 info dari primer/drill/story. Variasi mekanisme inferensi dijaga TIDAK monoton (beda dari sekadar "gabungkan 2 fakta" polos tiap kali): `murid-baru-di-kelas` = simpulkan SIFAT dari pola TINDAKAN berulang (bukan 1 kejadian); `mencari-sahabat-pena` = observasi+outcome tanpa penghubung eksplisit (identik pola `hari-piknik`); `mencari-alamat` = gabungkan info primer (liat toko roti/pasar) dgn detail alamat asli (dekat sekolah) yg baru terungkap di akhir; `menggalang-dana-sekolah` = perhitungan MATEMATIKA aktual (anak harus menjumlahkan sendiri), bukan cuma re-baca fakta.

**Field terjemahan** (`ReadingDrill.id`/`questionId`, `ReadingTopic.storyId`/`question.id`) diauthoring LANGSUNG bersamaan dgn kalimat Inggrisnya (bukan retrofit terpisah spt topik Adventurer sesi sebelumnya) — konsisten skema tipe `ReadingTopic` yg sudah final sejak §12.

**Diverifikasi**: `npm run typecheck`/`verify:content`/`verify:duplicates`/`build` semua lolos bersih (0 duplikat kalimat lintas 10 topik — dicek otomatis via skrip yg sama dgn Adventurer). Live di browser (Playwright + Chromium headless) — Menu Materi Reading Achiever menampilkan 10 kartu topik (semua judul benar), Kenalan topik `memilih-proyek-sekolah` render normal, Latihan Inti topik `menggalang-dana-sekolah` (topik terakhir) 10 quiz-dot + kalimat+opsi tampil, Tantangan topik `mencari-alamat` "🌟 Cerita Mini" render normal, "💡 Petunjuk" mengungkap terjemahan `passage`+`question` — 0 `pageerror`/console error.

**🎉 Reading TUNTAS ≥10 topik di SEMUA 6 level** (Little Stars/Starter/Explorer/Adventurer/Achiever 10/10, Trailblazer target-khusus 5/5 TERCAPAI) — skill KEDUA (setelah Vocabulary) yg mencapai status ini secara utuh di seluruh tangga level.

---

## 18. Reading Trailblazer Digenapkan 5→10 Topik + Audit Konten Existing (permintaan user: "apakah bisa tambah 5 materi untuk level trailblazer dan audit juga materi saat ini apakah sudah relevan?")

**Audit 5 topik existing** (dibaca ulang penuh + `grep` sistematis thd korpus) — hasil: relevansi TEMA bagus (wawancara/liburan-terganggu/lingkungan/robotika/sukarelawan — semuanya tema PET remaja yg valid, tidak ada yg terasa kekanak-kanakan atau terlalu dewasa), pertanyaan inferensi genuinely tidak pernah menyebutkan jawaban literal (bagus). **TAPI ditemukan gap NYATA**: dokumentasi desain topik (komentar di atas `READING_TOPICS_TRAILBLAZER`) mengklaim ciri pembeda B1 dari Achiever adalah "kalimat majemuk, konektor however/although/instead" — dicek via `grep` sistematis thd 5 topik, hasilnya **0× "however", 0× "although"** dipakai sama sekali, cuma "but" (7×, konektor dasar A1) dan "instead" (4×) — korpusnya TIDAK benar² mengirim sinyal B1 yg diklaim, secara struktur kalimat nyaris tidak beda dari Achiever.

**Perbaikan gap itu**: 3 dari 5 topik lama (`liburan-yang-berubah`, `kompetisi-robot`, `proyek-lingkungan`) direvisi RINGAN — 1 kata sambung diganti per topik ("but"→"however"/"although" pada 1 kalimat, makna & opsi jawaban/logic TIDAK berubah sama sekali) — supaya korpus existing ikut menyumbang konektor B1 yg sudah lama diklaim tapi belum pernah benar-benar ada.

**Riset 5 topik baru** (WebSearch, Cambridge B1 Preliminary/PET tema resmi) — konfirmasi tema resmi PET for Schools mencakup "Free time & sport, Music & instruments, Art & galleries, Food & cooking, Friends & relationships, Parties & celebrations, Money & saving, Future plans" — SEMUA belum tersentuh 5 topik lama, jadi 5 topik baru dipetakan ke situ: `seleksi-tim-basket` (sports & fitness), `pameran-seni-sekolah` (art), `kelas-memasak-mingguan` (food & cooking), `pesta-kejutan-sahabat` (friends & parties), `menabung-untuk-sepeda` (money & saving). **Ditulis dgn "however"/"although"/"even though" GENUINE sejak awal** (bukan retrofit spt 3 topik lama di atas) + struktur kalimat lebih kompleks (klausa relatif "who is much taller", klausa konsesif bertumpuk) — total korpus 10 topik sekarang py 9× "however", 8× "although", 3× "even though" (dicek ulang via `grep` pasca-perbaikan). `menabung-untuk-sepeda` REUSE pola "perhitungan matematika aktual" dari Achiever `menggalang-dana-sekolah` (anak hitung sendiri selisih 1.600.000-1.400.000=200.000, bukan re-baca fakta) — variasi mekanisme inferensi tetap dijaga tidak monoton, konsisten prinsip §17.

**Deviasi SADAR dari target baku Trailblazer (≥5)** — user eksplisit minta +5 lagi (bukan diambil inisiatif sendiri), preseden sama dgn Listening Trailblazer (§4F) & Grammar Trailblazer yg jg dibangun ke 10/10 penuh atas permintaan eksplisit sebelumnya — target baku ≥5 TETAP berlaku sbg DEFAULT utk Trailblazer skill lain yg belum diminta lebih.

**Diverifikasi**: `npm run typecheck`/`verify:content`/`verify:duplicates`/`build` semua lolos bersih. Live di browser (Playwright + Chromium headless) — Menu Materi Reading Trailblazer menampilkan 10 kartu topik (semua judul benar, urutan 5 lama + 5 baru), Kenalan topik `pameran-seni-sekolah` render normal, Latihan Inti topik `menabung-untuk-sepeda` (topik terakhir) 10 quiz-dot + kalimat "even though" tampil dgn benar — 0 `pageerror`/console error.

**Reading Trailblazer sekarang 10/10 topik** (melebihi target baku ≥5 atas permintaan eksplisit) — konsisten dgn Listening & Grammar Trailblazer yg jg sudah 10/10, Speaking & Vocab Trailblazer TETAP 5/5 (memenuhi target baku, belum diminta lebih).

---

## Sumber Riset Web

### Institusi Bahasa Inggris Indonesia
- LIA GEVYL: https://www.lia-depok.ac.id/program/reguler/?id=15 · https://lblia.com/kursus-bahasa-inggris-anak/
- EF Indonesia / English1 Small Stars: https://english1.co.id/program/smallstars/ · https://www.ef.co.id/englishfirst/kids/smallstars/ · https://teacherblog.ef.com/total-physical-response-efl-classroom/
- Kumon Indonesia: https://id.kumonglobal.com/for-parents/our-programmes/?lang=en

### Kurikulum Merdeka PAUD
- https://www.paud.id/pengertian-fase-fondasi-paud/
- https://www.paud.id/capaian-pembelajaran-paud-kurikulum-merdeka/
- https://www.paud.id/calistung-di-kurikulum-merdeka/
- https://paudpedia.kemendikdasmen.go.id/download/2024/program-prioritas/V4_Booklet_IKM_PAUD.pdf

### Kompetitor Internasional (early-literacy apps)
- Endless Alphabet / Endless Reader: https://www.educationalappstore.com/app/endless-alphabet · https://www.commonsensemedia.org/app-reviews/endless-alphabet · https://www.commonsensemedia.org/app-reviews/endless-reader
- Reading Eggs: https://readingeggs.com.au/about/lesson-overview/reading/ · https://cathyduffyreviews.com/homeschool-reviews-core-curricula/phonics-reading/phonics-reading-programs/reading-eggs
- Starfall: https://teach.starfall.com/guides/pre-k · https://www.readingrockets.org/resources/literacy-apps/starfall-abcs
- HOMER: https://www.learnwithhomer.com/ages · https://www.hopeinthechaos.com/homer-phonics-app/
- ABCmouse: https://www.abcmouse.com/learn/program/preschool-reading-learning-program
- Teach Your Monster to Read: https://play.google.com/store/apps/details?id=com.teachyourmonstertoread.tmapp&hl=en_US · https://learnspark.io/blog/teach-your-monster-to-read-an-honest-parents-review/

### Cambridge YLE / British Council (konfirmasi)
- https://www.britishcouncil.gr/en/exam/cambridge/young-learners
- https://www.britishcouncil.org.mm/exam/cambridge/which/young-learners
- https://www.cambridgeenglish.org/exams-and-tests/qualifications/young-learners/paper/starters/

### §9 — Starter/Explorer/Adventurer/Achiever/Trailblazer (sesi lanjutan)
- Kurikulum Merdeka Fase A: https://wislah.com/capaian-pembelajaran-bahasa-inggris-kelas-1-2-sd-fase-a-kurikulum-merdeka/ · https://www.modulguruku.com/2023/07/cp-kurikulum-merdeka-fase-a-kelas-1-dan-2.html
- Kurikulum Merdeka Fase B: https://www.pembelajaranmendalam.com/2025/12/cp-bahasa-inggris-fase-b-sd-mi-kelas-3-4-semester-1-2-kurmer-pm.html
- Kurikulum Merdeka Fase C: https://www.pembelajaranmendalam.com/2025/12/cp-bahasa-inggris-fase-c-kelas-5-dan-6-sd-mi-semester-1-2-kurmer-pm-terbaru.html
- Kurikulum Merdeka Fase D: https://kumparan.com/ragam-info/capaian-pembelajaran-bahasa-inggris-fase-d-kurikulum-merdeka-245lwEdYQMR · https://kurikulummerdeka.com/capaian-pembelajaran-cp-b-inggris-smp-fase-d-kurikulum-merdeka-2024/
- EF Indonesia/English1: https://english1.co.id/smallstars · https://english1.co.id/highflyers · https://english1.co.id/trailblazers
- Kumon Indonesia English: https://id.kumonglobal.com/english/
- LIA Kalideres: https://lbliakalideres.com/english-for-teens/
- Cambridge Pre A1 Starters format: https://www.cambridgeenglish.org/exams-and-tests/qualifications/young-learners/paper/starters/format/
- Cambridge A1 Movers format: https://www.cambridgeenglish.org/exams-and-tests/qualifications/young-learners/paper/movers/format/
- Cambridge A2 Flyers format: https://www.cambridgeenglish.org/exams-and-tests/qualifications/young-learners/paper/flyers/format/
- Cambridge A2 Key for Schools (KET) format: https://www.cambridgeenglish.org/exams-and-tests/qualifications/key/format/
- Cambridge B1 Preliminary (PET) Reading: https://www.examenglish.com/PET/PET_reading.html · https://test-english.com/exams/b1-preliminary/b1-pet-exam-1-reading/
- Perbandingan usia Starters/Movers/Flyers: https://flyersenglish.com/en/blog/cambridge-starters-movers-flyers-comparison

### §13 — Reading Little Stars genapkan 1→10 (konfirmasi ulang, bukan riset baru)
- LIA GEYL: https://www.lia-depok.ac.id/program/reguler/?id=11 · https://lblia.com/kursus-bahasa-inggris-anak/ · https://lbliakalideres.com/general-english-for-young-learners/
- Kumon Reading Program (look-listen-repeat → sight words → phonics): https://www.kumon.com/reading-program · https://kumonbooks.com/sight-words-and-phonics-the-kumon-workbooks-way
- EF Small Stars: http://englishtownwww.englishtown.com/englishfirst/kids/smallstars/methods.aspx · https://ef.design/work/small-stars

### §14 — Reading Starter genapkan 1→10 (konfirmasi ulang, sama sumber §9.1/§13, bukan riset baru)
- LIA GEYL, EF Small Stars, Kumon Indonesia — sumber sama §9.1/§13, dikonfirmasi ulang tidak ada urutan kategori Starter yg lebih tepat dari `VOCAB_TOPICS_STARTER` yg sudah ada.

### §15 — Reading Explorer genapkan 1→10
- LIA GEYL (General English for Young Learners, usia 7-12): https://www.lia-depok.ac.id/program/reguler/?id=11 · https://lblia.com/kursus-bahasa-inggris-anak-cara-efektif-bantu-anak-anda-menguasai-bahasa-inggris-lebih-mudah/ — dikonfirmasi eksplisit mencakup kosakata keluarga/uang/waktu/negara via pendekatan komunikatif, cocok domain `VOCAB_TOPICS` (Explorer) yg sudah ada.

### §16 — Audit Reading Adventurer (riset tambahan, sebelumnya cuma py 2 sumber §9.3)
- EF Indonesia High Flyers/Trailblazers (konfirmasi batas tier 6-10 → 10-14): https://www.ef.co.id/englishfirst/kids/highflyers/ · https://english1.co.id/program/highflyers/
- LIA GEYL (usia 7-12, level 4-6 utk band Adventurer): https://www.lia-depok.ac.id/program/reguler/?id=11
- Kumon Indonesia English + Kumon reading level D2 (identifying main idea, inferring meaning from context): https://id.kumonglobal.com/english/ · https://kumonbooks.com/product-category/5ages-9-11

### §17 — Reading Achiever genapkan 1→10
- EF Indonesia Trailblazers (10-14 th, topik relevan kehidupan nyata + critical thinking): https://www.english1.co.id/trailblazers/
- Kumon Indonesia EFL (reading comprehension + critical thinking tingkat lanjut): https://id.kumonglobal.com/?lang=id · https://id.kumonglobal.com/program-kumon/?lang=id

### §18 — Reading Trailblazer genapkan 5→10 + audit
- Cambridge B1 Preliminary (PET) tema resmi remaja (sports/art/food/friends/money): https://www.examenglish.com/PET/PET_reading.html · https://test-english.com/exams/b1-preliminary/b1-pet-exam-1-reading/
