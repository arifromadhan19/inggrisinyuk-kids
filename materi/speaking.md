# Materi Speaking — Analisis, Riset, & Roadmap per Level

Permintaan user: "lakukan research bagaimana rule dan flow di modul speaking, lihat aplikasi kompetitor, lembaga bahasa inggris indonesia maupun luar negri tapi fokus ke dalam negri karena target market nya anak indonesia... dan coba buat 1 materi di little stars". Revisi/klarifikasi di prompt yang sama: **"pastikan jangan meniru 100%, wajib ada improvement dimana di fitur kenalan tetap ada fitur mic dan main"** — dua syarat eksplisit: (1) desain BUKAN cuma re-skin pola kompetitor (§4), (2) Kenalan WAJIB pertahankan KEDUA aksi mic 🎤 DAN main 🎮 (bukan salah satu), pola yang sama seperti revisi Reading Little Stars sebelumnya (`materi/reading.md` §4, dikonfirmasi ulang & diterapkan sejak awal sesi ini, bukan revisi di tengah jalan).

Beda dari `materi/listening.md` (riset diminta utk SEMUA 6 level dari awal) — sesi ini scope-nya **riset flow Speaking secara umum + 1 level (Little Stars)**, pola yang sama dgn `materi/reading.md`. Level lain (Starter/Explorer sudah py materi lama/Adventurer sudah py materi lama juga, Achiever/Trailblazer) dicatat sbg gap terbuka di §7, bukan diriset penuh sesi ini.

---

## 1. Ringkasan (TL;DR)

- Speaking di app ini SUDAH ada 1 format sebelum sesi ini: `SpeakingTopic` (Explorer 3 topik, Adventurer topiknya sendiri) — `model` (contoh diucapkan) → `drill` ("Ucapkan & Cek", target tertutup tapi skor BINER `looseMatch`) → `roleplay` ("Mini-Roleplay", jawaban BEBAS diterima apa pun, tanpa target). Cocok utk anak yang sudah bisa berkonversasi pendek merdeka.
- Pertanyaan inti sesi ini: apakah format yang sama bisa digenapkan turun ke Little Stars (3–5 th)? **Riset menjawab TIDAK** — 3 sumber independen (LIA GEVYL, EF Indonesia/English1 Small Stars, Kumon Indonesia EFL) SEMUA berhenti di pola "dengar model → tirukan" (echo/imitation) di usia ini, TPR-berat, TANPA percakapan bebas sama sekali. `roleplay` open-ended terlalu maju.
- Solusi: format KEDUA `SpeakingPhraseTopic` — 3 langkah tangga TASK SHAPE naik (recognize → imitate → recall), BUKAN 1 bentuk tugas diulang spt SEMUA kompetitor yang diriset.
- 1 topik dibangun: `sapaan-sopan` ("Sapaan & Sopan Santun / Greetings & Manners"), 10 frasa dari domain Vocab Little Stars `salam-sopan-santun` — dipilih krn Kurikulum Merdeka Fase Fondasi eksplisit menyebut "mengucapkan kata tolong, maaf, terima kasih" sbg benchmark keterampilan sosial-bahasa usia ini.
- **Improvement di luar copy-paste kompetitor** (§4): tangga 3-shape (Kenalan "Dengar & Tunjuk" murni RECOGNIZE → Latihan Inti "Tirukan Ucapannya" IMITATE → Tantangan "Sebutkan Sendiri" RECALL tanpa model) — 0 dari kompetitor yang diriset (LIA/EF/Kumon/Duolingo/ELSA/Buddy.ai) py tugas produksi murni dari memori tanpa model tepat sebelumnya, semuanya berhenti di imitasi/echo.
- **Kenalan mempertahankan KEDUA aksi mic 🎤 DAN main 🎮** (permintaan user eksplisit) — REUSE PERSIS pola `renderKenalanWord` Reading Little Stars (3 aksi: 🔊/🎤/🎮 per baris), diadaptasi audio-first (stimulusnya frasa DIUCAPKAN, bukan kata TERCETAK).
- **Skor mic proporsional (`wordMatchDetail`) + "▶️ Play Suaramu" di SEMUA 3 langkah** — bukan cuma memenuhi Aturan Wajib CLAUDE.md, tapi juga jadi bagian dari perbaikan dari format LAMA (`looseMatch` biner) yang sesi ini TIDAK disentuh (di luar scope, tetap dipakai apa adanya di Explorer/Adventurer).
- Diverifikasi: `npm run typecheck` & `npm run build` lolos, alur PENUH diuji live di browser (Playwright + Chromium headless, `SpeechRecognition` di-mock utk simulasi hasil mic) — Kenalan (3 aksi + mini-game) → Latihan Inti (10 ronde, transkrip cocok → 3 bintang + confetti, transkrip meleset → 1 bintang + semangat) → Tantangan (10 ronde, teks tersembunyi default, Petunjuk mengungkap, jawaban selalu terungkap sesudah mic) → "Kerja Bagus!" — 0 console/page error di sepanjang alur.

---

## 2. Analisis Mekanik Speaking — 2 Format Berdampingan

### 2.1 Status konten per level

| Level | Format | Jumlah topik | Status target ≥10/skill |
|---|---|---|---|
| Little Stars | KEDUA (`SpeakingPhraseTopic`, "Sapaan & Sopan Santun") | 1 (`sapaan-sopan`) | Belum (1/10) |
| Starter | — | 0 | Belum mulai |
| Explorer | LAMA (`SpeakingTopic`) | 3 | Belum (3/10) |
| Adventurer | LAMA (`SpeakingTopic`) | topik sendiri | Belum (di luar scope sesi ini) |
| Achiever | — | 0 | Belum mulai |
| Trailblazer | — | 0 | Belum mulai |

### 2.2 Format LAMA (`SpeakingTopic`) — Explorer/Adventurer, TIDAK disentuh sesi ini

`model: string[]` (Kenalan, dengar contoh) → `drill: string[]` (Latihan Inti "🎯 Ucapkan & Cek", target tertutup tapi skor **`looseMatch` biner** — minimal separuh kata kunci kedengaran = lolos) → `roleplay: string[]` (Tantangan "🌟 Mini-Roleplay", pertanyaan dijawab BEBAS, apa pun yang terucap dianggap "sudah berani jawab", tanpa target/skor sama sekali). Fungsi (`renderKenalan`/`runLatihanInti`/`runTantangan`, `games/speaking.ts`) masih auto-advance via `setTimeout`, tanpa hint, tanpa "▶️ Play Suaramu" — pola yang SUDAH digantikan Vocab/Listening/Reading (tombol manual "Coba Lagi"/"Lanjut", skor proporsional) tapi BELUM menyentuh Speaking format ini (CLAUDE.md "Belum dikerjakan" — TETAP berlaku, sesi ini tidak menutup gap itu, cuma menambah format BARU di level lain).

`games/boss.ts` (`runSpeakPhase`) konsumsi `t.drill` (array string) apa adanya — TIDAK diubah perilakunya, cuma dapat 1 baris adapter (`'items' in t ? ... : t.drill`, §6) supaya tetap kompatibel skalipun `SPEAKING_TOPICS_BY_LEVEL` sekarang bisa berisi format baru juga.

### 2.3 Format KEDUA (`SpeakingPhraseTopic`) — Little Stars, BARU sesi ini

`items: SpeakingPhraseItem[]` (`en`/`id`/`emoji` = kata kunci tunggal, konsisten `VocabItem`/`ListeningSentenceItem`; `phrase: VocabExample` = 2–4 kata yang HARUS diucapkan anak — field terpisah dari `en` supaya `wordMatchDetail` py >1 kata buat dibandingkan, skor benar² proporsional bukan biner). Pembeda runtime dari format lama: `'items' in topic` (`types.ts` `AnySpeakingTopic`, pola identik `AnyListeningTopic`/`AnyReadingTopic`).

3 langkah, tangga TASK SHAPE naik (detail penuh + rationale di §4):
1. **Kenalan** — daftar frasa, TIGA aksi per baris (🔊 dengar / 🎤 tirukan / 🎮 main), MURNI kenalan+recognize (mic di sini pun skor proporsional, bukan cuma "coba-coba").
2. **Latihan Inti "🎤 Tirukan Ucapannya!"** — IMITATE: frasa+terjemahan SELALU kelihatan, dengar contoh (auto-play), tirukan lewat mic.
3. **Tantangan "🖼️ Sebutkan Sendiri!"** — RECALL: CUMA gambar (tanpa teks/audio default), anak ingat & ucapkan sendiri; "💡 Petunjuk" tersedia sejak awal (scaffold non-punitive), jawaban selalu terungkap di hasil sesudah mic apa pun skornya.

Semua mic (Kenalan/Latihan Inti/Tantangan) pakai `scoreMic()` (`games/speaking.ts`, dari `wordMatchDetail` — BUKAN `looseMatch` biner format lama) + `listenAndRecordOnce` (rekam paralel "▶️ Play Suaramu") — memenuhi Aturan Wajib Speaking CLAUDE.md penuh, di KETIGA langkah, bukan cuma salah satu.

---

## 3. Riset: Rule/Flow Speaking yang Tepat untuk Little Stars (3–5 th)

Instruksi user eksplisit: prioritaskan lembaga bahasa Inggris Indonesia dulu, kompetitor internasional sbg pembanding — pola sama `materi/listening.md`/`materi/reading.md`.

### 3.1 Institusi Bahasa Inggris Indonesia (3–6 th)

- **LIA — GEVYL (4–6 th)**: "Kegiatan kelas terdiri dari rutinitas yang melibatkan beragam kegiatan, seperti bernyanyi, menari, mengidentifikasi objek, menebak gambar" — metode TPR (Total Physical Response): gerak fisik sbg respons ke instruksi verbal. TIDAK ADA komponen "percakapan bebas"/roleplay terbuka disebutkan di usia ini. Sumber: [lblia.com/kursus-bahasa-inggris-anak](https://lblia.com/kursus-bahasa-inggris-anak/).
- **EF Indonesia / English1 — "Small Stars" (3–6 th)**: metode TPR yang sama ("membantu siswa menghubungkan bahasa lisan dengan gerakan fisik, memudahkan mengingat kosakata & frasa"), **DAN eksplisit menyebut**: *"Guru menekankan pengucapan Bahasa Inggris untuk membantu siswa membangun kepercayaan diri mereka"* — pronunciation ditekankan LEWAT TIRUAN/imitasi berulang dgn feedback guru, bukan lewat tes bicara mandiri. Sumber: [english1.co.id/smallstars](https://english1.co.id/smallstars), [english1.co.id/program/smallstars](https://english1.co.id/program/smallstars/).
- **Kumon Indonesia (EFL, mulai usia 2 th)**: program **"Look, Listen and Repeat"** — worksheet berilustrasi + audio CD, anak DENGAR kata Inggris lalu MENIRUKAN mengucapkannya, ritme diatur oleh CD (bukan bebas). Level paling awal (7A/6A/5A) mulai dari KATA TUNGGAL dgn efek suara pendamping (mis. suara gonggongan utk "dog") sbg jembatan makna. **Ini pola echo/imitation paling eksplisit & paling murni di antara 3 sumber Indonesia** — "dengar → tirukan", tanpa komponen tanya-jawab bebas sama sekali di level pemula. Sumber: [id.kumonglobal.com/english-efl](https://id.kumonglobal.com/english-efl/), [sites.google.com/.../kumon-english-program](https://sites.google.com/brac.net/kumon-efl-program/kumon-english-program).
- **Kesimpulan**: SEMUA TIGA institusi Indonesia yang diriset berhenti persis di "dengar model → tirukan" utk usia 3–6 th — TIDAK SATU PUN py komponen percakapan bebas/tanya-jawab terbuka di level ini (baru muncul di jenjang lebih tinggi/usia lebih besar, di luar cakupan riset ini). `roleplay` (Speaking format lama) genuinely terlalu maju utk Little Stars, bukan sekadar "belum ada datanya".

### 3.2 Kurikulum Merdeka — Fase Fondasi (literasi/bahasa umum, bukan spesifik Bahasa Inggris)

Fase Fondasi (0–6 th) — elemen "Keterampilan Sosial dan Bahasa" eksplisit mencakup **"kemampuan mengucapkan kata tolong, maaf, terima kasih"** sbg salah satu capaian, plus "kemampuan menyimak instruksi sederhana" dan "kemampuan menunggu giliran". Kurikulum ini TIDAK spesifik Bahasa Inggris (Fase Fondasi PAUD Indonesia, bahasa ibu) — tapi jadi sinyal PALING LANGSUNG soal domain/topik yg cocok utk kemampuan verbal awal anak usia ini: kata-kata sopan-santun fungsional pendek, bukan kalimat kompleks. Ini yang mendasari pemilihan topik pertama Speaking Little Stars (§5) — beda dari Listening/Reading yg topik pertamanya bebas dipilih, Speaking py sinyal kurikulum yg PERSIS cocok. Sumber: [paud.id/capaian-pembelajaran-paud-kurikulum-merdeka](https://www.paud.id/capaian-pembelajaran-paud-kurikulum-merdeka/).

### 3.3 Cambridge Young Learners English (YLE) — Komponen Speaking

Cambridge Pre A1 Starters (backbone struktural Explorer, PRD §3 — bukan Little Stars, tapi paling dekat & satu-satunya exam family YLE yang py komponen Speaking terdokumentasi) py **Speaking Test 4 part, dipandu EXAMINER** (bukan self-service spt app ini), berbasis kartu gambar & sangat ramah anak:
- Part 1: anak melihat 1 gambar besar + beberapa kartu kecil, examiner minta "taruh kartu X di gambar" — respons FISIK dulu, verbal menyusul.
- Assessment: kosakata, pengucapan, & interaksi — **jawaban pendek DITERIMA** (mis. examiner tanya "What color is the car?", jawab "Red" saja sudah cukup — TIDAK perlu kalimat lengkap).
- **Scaffold anti-panik**: kalau anak tidak merespons setelah beberapa detik, examiner MEMBANTU dgn pertanyaan tertutup ("Is this the apple?") — supaya anak tidak "membeku"/cemas, bukan dibiarkan gagal diam-diam.
Sumber: [englishspeakingtest.com/a1-starters-speaking-test](https://englishspeakingtest.com/a1-starters-speaking-test.html), [exam-seekers.com/.../starters-speaking-exam](https://exam-seekers.com/2021/06/14/ee-026c-yle-pre-a1-starters-speaking-exam/).

**Insight**: pola "object naming pendek" (Part 1) & "scaffold anti-panik lewat pertanyaan tertutup" langsung menginspirasi 2 keputusan desain: (a) mini-game Kenalan "Dengar & Tunjuk" = versi digital dari "examiner minta taruh kartu di gambar" (tap gambar yg cocok, bukan taruh kartu fisik); (b) tombol "💡 Petunjuk" di Tantangan = versi digital dari examiner yg membantu anak yg membeku, BUKAN dead-end diam kalau anak lupa (§4.3).

### 3.4 Kompetitor Internasional — App Speaking/Pronunciation Kids

| App | Mekanisme inti | Task shape |
|---|---|---|
| **Duolingo (ABC/Kids)** | AI speech recognition, feedback pengucapan lewat voice recognition + elemen AR | Dengar → ucap → skor otomatis (1 shape) |
| **Lingokids** | "Scaffolded play-based learning" — lebih ke exposure/permainan drpd speech-recognition intensif | Bervariasi, tapi TIDAK berpusat di 1 tugas bicara terukur |
| **ELSA Speak** | Speech Analyzer level FONEM (aksen, fluency, rhythm, clarity) — ditujukan penutur NON-native, termasuk anak ESL | Dengar → ucap → skor fonem detail (evaluatif/klinis — TIDAK kid-friendly apa adanya, CLAUDE.md §1) |
| **Buddy.ai** | Speech recognizer dilatih KHUSUS suara anak (lintas usia/aksen/lingkungan rumah yg berisik) — dibangun dari nol utk anak, bukan API dewasa yg ditempel | Percakapan terpandu (lebih dekat ke `roleplay` Explorer/Adventurer — di luar scope Little Stars) |
| **Khan Academy Kids** | Adaptive visual learning, minim Bahasa Inggris dibutuhkan utk mulai | Bukan speech-recognition-sentris |
| **Kritik industri (51talk.com dkk)** | "*Skor pengucapan otomatis... bilang ada yg salah TANPA bilang apa/gimana benerinnya*" | — |

**Insight paling penting**: baik institusi Indonesia (§3.1) MAUPUN kompetitor internasional (tabel di atas) **SEMUA konvergen ke 1 bentuk tugas inti**: dengar model → tirukan/ucap → skor (kadang biner pass/fail, kadang skor fonem opaque yg dikritik "tidak actionable"). **0 dari SEMUA sumber yang diriset py tugas RECALL murni** (ucapkan dari memori TANPA model langsung sebelumnya) sbg bagian dari alur belajarnya — baik institusi Indonesia (semua cuma echo) maupun app luar negeri (semua cuma echo+skor, walau canggih di sisi teknis ASR-nya). Ini KESIMPULAN RISET yang jadi dasar improvement di §4.

---

## 4. Keputusan Desain — Bukan Sekadar Tiru Kompetitor

Permintaan user eksplisit di prompt yang sama dgn permintaan riset: **"wajib ada improvement dimana di fitur kenalan tetap ada fitur mic dan main"**. 2 keputusan konkret:

### 4.1 Tangga 3-shape: Recognize → Imitate → Recall (bukan 1 bentuk tugas diulang)

Temuan riset §3.4: SEMUA kompetitor (LIA/EF/Kumon/Duolingo/ELSA/Buddy.ai) berhenti di 1 bentuk tugas — dengar+tirukan (echo/imitation), dibedakan cuma dari SISI TEKNIS skor (biner vs fonem-level), bukan dari SISI PEDAGOGIS jenis tugasnya. App ini menambah 1 tingkat kesulitan yg genuinely baru: **Tantangan "Sebutkan Sendiri!"** — anak diminta bicara TANPA model yg baru saja diputar, murni dari INGATAN atas apa yg sudah dipelajari di Kenalan/Latihan Inti sebelumnya. 3 keterampilan berbeda yg saling melengkapi (bukan 1 tugas dipoles ulang):
- **Recognize** (Kenalan "Main · Dengar & Tunjuk") — anak paham MAKNA frasa yg didengar, respons via TAP (bukan bicara sama sekali) — level kesulitan paling rendah, murni komprehensi.
- **Imitate** (Latihan Inti "Tirukan Ucapannya!") — anak MENIRUKAN persis apa yg baru didengar, model & teks selalu tersedia sbg sandaran — level kesulitan sedang, produksi TERBANTU.
- **Recall** (Tantangan "Sebutkan Sendiri!") — anak MEMPRODUKSI dari memori, tanpa sandaran default — level kesulitan tertinggi, produksi MANDIRI.

Prinsip sama dgn kenapa Latihan Inti Vocab py 4 tipe soal (bukan 1 diulang, CLAUDE.md) & tangga 2-arah Reading Little Stars (`materi/reading.md` §4.1) — variasi SHAPE tugas, bukan cuma variasi tema/kata.

### 4.2 Kenalan mempertahankan KEDUA mic 🎤 DAN main 🎮 (permintaan user eksplisit)

Beda dari opsi yg mungkin diambil (mis. Kenalan murni exposure tanpa tugas apa pun, spt Reading Little Stars yg SENGAJA tanpa mini-game krn anak belum siap tugas literasi apa pun di usia ini, `materi/reading.md` §4.2's poin "murni EXPOSURE") — user secara SPESIFIK meminta Kenalan Speaking TETAP py KEDUA aksi ini. Ini masuk akal krn Speaking beda karakter dari Reading: Reading di usia ini anak BELUM siap tugas literasi sama sekali (riset `materi/reading.md` §3 mengonfirmasi ini), tapi Speaking (bicara) justru sudah jadi kemampuan aktif anak sejak bayi (bahasa ibu) — memberi kesempatan coba bicara SEJAK Kenalan (bukan ditunda ke Latihan Inti) sejalan dgn filosofi "exposure-berulang" Kumon/EF/LIA yg SEMUA memulai imitasi/pengucapan sejak sesi pertama, bukan menunda ke tahap lebih lanjut. `renderKenalanPhrase` (`games/speaking.ts`) REUSE PERSIS pola `renderKenalanWord` Reading (3 aksi 🔊/🎤/🎮 per baris + popup hasil mic proporsional), diadaptasi audio-first.

### 4.3 "💡 Petunjuk" di Tantangan = digitalisasi scaffold anti-panik Cambridge Starters

Temuan §3.3 (examiner Cambridge membantu anak yg membeku lewat pertanyaan tertutup, bukan dibiarkan gagal diam) langsung diadopsi: Tantangan "Sebutkan Sendiri!" (tugas paling sulit) py tombol "💡 Petunjuk" TERSEDIA SEJAK AWAL (bukan terkunci nunggu attempt) yg membacakan+menampilkan frasa lengkap kalau anak beneran lupa — non-punitive, konsisten CLAUDE.md poin 4 ("tanpa layar dead-end yang menakutkan"). Jawaban target JUGA selalu terungkap di hasil sesudah mic (apa pun skornya) — anak yg lupa & tidak sempat pakai Petunjuk pun tetap belajar dari percobaannya, bukan ditinggal bingung.

### 4.4 Skor proporsional + Play Suaramu di KETIGA langkah (bukan cuma memenuhi minimum CLAUDE.md)

Format LAMA (`SpeakingTopic`, §2.2) pakai `looseMatch` biner (≥50% kata kunci = lolos) DAN tidak py "Play Suaramu" sama sekali — TIDAK comply penuh ke Aturan Wajib CLAUDE.md (gap lama yg didokumentasikan tapi belum ditutup, di luar scope sesi ini). Format BARU ini dibangun comply PENUH sejak awal (`scoreMic()`, `wordMatchDetail`, `listenAndRecordOnce`) di SEMUA 3 langkah — bukan cuma Kenalan spt kalau sekadar niru pola Reading/Listening apa adanya, krn Speaking JUSTRU skill yg paling langsung disebut aturan itu.

---

## 5. Spesifikasi Little Stars — Diimplementasikan

**Lokasi kode**: tipe baru `SpeakingPhraseItem`/`SpeakingPhraseTopic`/`AnySpeakingTopic` (`app/src/types.ts`), data `SPEAKING_TOPICS_LITTLE_STARS` (`app/src/content.ts`), fungsi baru `renderKenalanPhrase`/`runLatihanIntiPhrase`/`runTantanganPhrase` + helper lokal (`games/speaking.ts`), dispatcher `app.ts` `runStage`/`runFreePlayRound` dicabangkan via `'items' in topic`, adapter `games/boss.ts` `runSpeakPhase`. **Tidak ada perubahan `progress.ts`** — pola sama Reading Little Stars (`materi/reading.md` §5): belum py section granular per-soal, `topicProgressPercent()`/`nextStep()` (`app.ts`) sudah generik lintas skill lewat `isStepVisited`/`markStepVisited`, jatuh ke situ apa adanya.

| # | id | Title | Tema diambil dari (Vocab Little Stars) |
|---|---|---|---|
| 1 | `sapaan-sopan` | Sapaan & Sopan Santun (Greetings & Manners) | `salam-sopan-santun` |

10 frasa topik ini (kata kunci sama dgn Vocab, kalimat/frasa target ditulis ULANG baru — prinsip "modalitas beda, bukan duplikasi" konsisten dgn Listening/Reading Little Stars):

| Kata kunci | Frasa yang diucapkan (EN) | Terjemahan (ID) |
|---|---|---|
| Hello | Hello, everyone! | Halo, semuanya! |
| Goodbye | Goodbye, see you! | Dadah, sampai jumpa! |
| Please | Please, sit down. | Tolong, duduklah. |
| Thank You | Thank you so much! | Terima kasih banyak! |
| Sorry | Sorry, my friend. | Maaf, temanku. |
| Yes | Yes, I can! | Iya, aku bisa! |
| No | No, not now. | Tidak, nanti dulu. |
| Good Morning | Good morning, mom! | Selamat pagi, mama! |
| Good Night | Good night, dad! | Selamat malam, papa! |
| Excuse Me | Excuse me, teacher. | Permisi, Bu Guru. |

Keputusan authoring:

- **Id topik SENGAJA beda dari id Vocab/Listening sumbernya** (`sapaan-sopan`, vs Vocab `salam-sopan-santun` & Listening `halo-terima-kasih`) — konvensi sama Listening/Reading Little Stars, aman dari tabrakan progres krn key `${skill}:${topicId}:${section}` sudah py awalan skill.
- **Tidak ada field `options`/`question` per-item** (beda dari `ListeningSentenceItem`) — 4 opsi kartu mini-game "Main" Kenalan dibangun DINAMIS dari sesama `items` topik yg sama (`buildPhraseOptions`, pola sama `ReadingWordTopic`/`buildWordOptions`) — mini-game-nya murni "kata mana yg baru kamu dengar", jawabannya SELALU salah satu kata sesama topik, jadi tidak perlu opsi hand-picked spt Listening (yg butuh pertanyaan komprehensi genuinely berbeda per kalimat).
- Frasa target 2–4 kata (bukan 1 kata) — supaya `wordMatchDetail` (skor proporsional) py >1 kata utk dibandingkan, sesuai Aturan Wajib CLAUDE.md ("skor benar² proporsional, bukan biner").
- Bahasa & konteks disaring lewat filter kid-friendly (CLAUDE.md §1) — semua frasa netral/positif, tidak ada framing menegangkan.

---

## 6. Verifikasi

- `npm run typecheck` (tsc --noEmit) — lolos, 0 error.
- `npm run build` (typecheck + esbuild bundle+minify) — lolos, `public/bundle.js` ter-generate.
- **Diuji live di browser** (Playwright + Chromium headless — `chromium-cli` tidak tersedia di environment ini, dipakai driver `playwright-core` langsung terhubung ke binary Chromium yg sudah ter-cache; `SpeechRecognition`/`webkitSpeechRecognition` di-mock via `page.addInitScript` supaya bisa mensimulasikan hasil mic tanpa mic sungguhan, `/api/me` di-mock supaya level anak ter-set `little-stars` tanpa portal beneran jalan):
  - **Kenalan**: 10 baris frasa tampil (emoji+EN+ID+🔊+🎤+🎮), tap 🎮 membuka mini-game "🎮 Main · Dengar & Tunjuk" dgn kartu jawaban 2×2 (emoji+label+lencana A/B/C/D) — dijawab benar → confetti+pujian+"Lanjut" kembali ke daftar. Tap 🎤 pada baris memicu alur mic (popup hasil, best-effort di headless).
  - **Latihan Inti**: stage badge "🎤 Tirukan Ucapannya!", 10 ronde — frasa+terjemahan+emoji SELALU kelihatan, mic dgn transkrip yg cocok persis → ⭐⭐⭐ + confetti + "3 dari 3 kata kedengaran (100%)" + kata di-highlight hijau + "▶️ Play Suaramu" + pujian Indonesia (Little Stars); transkrip meleset → ⭐☆☆ + "0 dari 3 kata kedengaran (0%)" + semangat "Dikit lagi! ✨" (non-punitive, BUKAN kata "salah"). Semua 10 ronde selesai → app auto-lanjut ke Tantangan.
  - **Tantangan**: stage badge "🖼️ Sebutkan Sendiri!", 10 ronde — HANYA emoji besar tampil (TIDAK ADA teks/audio default, dikonfirmasi via screenshot), "💡 Petunjuk" tersedia sejak awal & mengungkap frasa+terjemahan sekali tap; hasil mic SELALU menampilkan "Jawabannya: ..." apa pun skornya. Selesaikan semua 10 ronde → layar "Kerja Bagus!" (3 bintang, confetti, "🔁 Ulangi Modul Ini"/"📋 Pilih Materi Lain", TANPA "Beranda" — konsisten CLAUDE.md).
  - **0 `pageerror`/console error** tercatat di SELURUH alur (Kenalan+mini-game+mic, Latihan Inti 10 ronde skor benar & salah, Tantangan 10 ronde + Petunjuk + completion).

---

## 7. Gap yang Masih Terbuka (dilaporkan, bukan dianggap selesai)

- **Speaking Little Stars baru 1 dari target ≥10 topik** (CLAUDE.md "Target Kelengkapan Konten per Modul") — tema lanjutan yg disarankan (dari domain Vocab Little Stars yg belum disentuh Speaking): `kenal-warna`, `bentuk`, `keluargaku`, `tubuhku`, `hewan-peliharaan`, `buah-buahan`, `mainan`, `pakaian`, `kendaraan`, `perasaanku` — 9+ topik tersisa, pola pemetaan 1:1 yg sama dgn `sapaan-sopan`.
- **Speaking BELUM ada sama sekali di Starter, Achiever, Trailblazer** — riset per-level lebih dalam (spt `materi/listening.md` §3 utk SEMUA 6 level) belum dilakukan sesi ini, cuma Little Stars. Dugaan awal (belum diriset dalam, BUKAN keputusan): Starter kemungkinan masih pas dgn format `SpeakingPhraseTopic` (frasa sedikit lebih panjang/abstrak, sama pola Listening Starter naik dari Little Stars), Explorer SUDAH py format lama sendiri (3 topik, tinggal digenapkan-data), Achiever/Trailblazer kemungkinan mulai bisa pakai `roleplay` format lama (usia lebih besar, mulai siap konversasi bebas pendek) — TAPI ini HIPOTESIS, perlu riset eksplisit dulu sebelum implementasi, pola sama Vocab/Listening/Reading.
- **Explorer (format lama) masih 3 topik, Adventurer topiknya sendiri** — TIDAK ikut digenapkan sesi ini (di luar scope) — genapkan ke ≥10 murni kerja data kapan pun dibutuhkan.
- **Format lama Speaking (Explorer/Adventurer) belum dapat perbaikan skor proporsional/Play Suaramu/retry manual** yg sudah dibangun di format baru ini — `looseMatch` biner + auto-advance `setTimeout` masih dipakai apa adanya, menunggu arahan baru user (CLAUDE.md "Belum dikerjakan" TETAP berlaku utk bagian ini, sesi ini cuma menambah format baru di level lain, tidak menutup gap lama).
- **`roleplay` open-ended (format lama) belum py padanan di format baru** — Tantangan `SpeakingPhraseTopic` sengaja TARGET TERTUTUP (bisa diskor), bukan percakapan bebas spt `roleplay` — kalau nanti Starter/level naik butuh jembatan ke percakapan bebas, perlu keputusan desain baru (mungkin format KETIGA), bukan diasumsikan otomatis dari sesi ini.

---

## Sumber Riset Web

### Institusi Bahasa Inggris Indonesia
- LIA GEVYL: https://lblia.com/kursus-bahasa-inggris-anak/
- EF Indonesia / English1 Small Stars: https://english1.co.id/smallstars · https://english1.co.id/program/smallstars/
- Kumon Indonesia EFL: https://id.kumonglobal.com/english-efl/ · https://sites.google.com/brac.net/kumon-efl-program/kumon-english-program

### Kurikulum Merdeka
- https://www.paud.id/capaian-pembelajaran-paud-kurikulum-merdeka/

### Cambridge YLE Speaking
- https://englishspeakingtest.com/a1-starters-speaking-test.html
- https://exam-seekers.com/2021/06/14/ee-026c-yle-pre-a1-starters-speaking-exam/
- https://www.cambridgeenglish.org/exams-and-tests/qualifications/young-learners/paper/starters/format/

### Kompetitor Internasional (speaking/pronunciation apps)
- Duolingo/Lingokids/alternatif: https://lingopie.com/blog/best-language-learning-apps-for-kids/ · https://preply.com/en/blog/best-language-apps-for-kids/
- Kritik skor pengucapan otomatis: https://www.51talk.com/articles/does-an-app-harm-child-pronunciation/
- ELSA Speak: https://elsaspeak.com/en/product-learn-english-elsa-speak/
- Buddy.ai: https://www.unite.ai/buddy-ai-children-language-learning-speech-recognition/
