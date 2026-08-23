# Materi Reading — Analisis, Riset, & Roadmap per Level

Permintaan user: "lakukan research bagaimana rule dan flow di modul reading, lihat aplikasi kompetitor, lembaga bahasa inggris indonesia maupun luar negri tapi fokus ke dalam negri karena target market nya anak indonesia, dan coba buat 1 materi di little stars". Revisi tengah sesi: **"pastikan jangan meniru 100%, wajib ada improvement"** — keputusan desain di §4 secara eksplisit dipilih supaya BUKAN cuma re-skin pola kompetitor.

Beda dari `materi/vocab.md`/`materi/listening.md` (riset diminta utk SEMUA 6 level dari awal) — sesi ini scope-nya **riset flow Reading secara umum + 1 level (Little Stars)**, bukan mandat riset 6 level sekaligus. Level lain (Starter/Explorer/Achiever/Trailblazer) dicatat sbg gap terbuka di §7, bukan diriset penuh sesi ini.

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
| Little Stars | KEDUA (`ReadingWordTopic`, "Baca Kata") | 1 (`kata-hewan`) | Belum (1/10) |
| Starter | — | 0 | Belum mulai |
| Explorer | — | 0 | Belum mulai |
| Adventurer | LAMA (`ReadingTopic`) | 2 (Di Kebun Binatang, Hari Libur) | Belum (2/10) |
| Achiever | — | 0 | Belum mulai |
| Trailblazer | — | 0 | Belum mulai |

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

- **Reading Little Stars baru 1 dari target ≥10 topik** (CLAUDE.md "Target Kelengkapan Konten per Modul") — tema lanjutan yang disarankan (dari domain Vocab Little Stars yg belum disentuh Reading): `salam-sopan-santun`, `kenal-warna`, `bentuk`, `keluargaku`, `tubuhku`, `buah-buahan`, `mainan`, `pakaian`, `kendaraan`, `perasaanku` — 9 topik tersisa, pola pemetaan 1:1 yang sama dgn `kata-hewan`.
- **Reading BELUM ada sama sekali** di Starter, Explorer, Achiever, Trailblazer — riset per-level yg lebih dalam (spt `materi/listening.md` §3 utk SEMUA 6 level) belum dilakukan sesi ini, cuma Little Stars. Dugaan awal (belum diriset dalam): Starter kemungkinan masih pas dgn format KEDUA (whole-word, kompleksitas naik dikit — kata lebih panjang/frasa pendek), Explorer/Adventurer/Achiever kemungkinan mulai bisa pakai format LAMA (baca kalimat, krn usia 7+ mulai melek huruf) — TAPI ini HIPOTESIS, bukan keputusan, perlu riset eksplisit sebelum implementasi (pola sama Vocab/Listening: tanya dulu sebelum bangun).
- **Adventurer (format lama) masih 2 topik**, TIDAK ikut digenapkan sesi ini (di luar scope — formatnya sendiri sudah dikonfirmasi cocok di PRD §15.2, jadi genapkan ke ≥10 murni kerja data kapan pun dibutuhkan, bukan riset ulang).
- **Format lama Reading (Adventurer) belum dapat perbaikan pola manual retry/hint** yg sudah dibangun di Vocab/Listening DAN format kedua Little Stars (§4 CLAUDE.md "Belum dikerjakan") — auto-advance `setTimeout` masih dipakai apa adanya, menunggu arahan baru user.

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
