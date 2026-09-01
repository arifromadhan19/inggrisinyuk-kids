# Materi Speaking — Analisis, Riset, & Roadmap per Level

Status: sesi 1 membangun format KEDUA `SpeakingPhraseTopic` utk Little Stars (1 topik). Sesi 2 — (a) menutup pelanggaran Aturan Wajib Speaking di format LAMA (Explorer/Adventurer), (b) riset & implementasi per level (Starter, Achiever, Little Stars→2 topik), (c) Trailblazer format KETIGA `SpeakingInterviewTopic` (keputusan user: revisi penuh). Sesi 3 — Little Stars digenapkan ke 12/12 topik. Sesi 4 — Starter digenapkan ke 10/10 topik. Sesi 5 — Explorer digenapkan ke 10/10 topik. Sesi 6 — Adventurer digenapkan ke 10/10 topik, konten digeser ke pola deskripsi+alasan. Sesi 7 — Achiever digenapkan ke 10/10 topik, konten dinaikkan ke pola opini+perbandingan+preferensi. **Sesi 8** (permintaan user: "lakukan serupa untuk level Trailblazer") — **Trailblazer digenapkan dari 1 jadi 5/5 topik — TARGET BERBEDA dari 5 level lain (≥5, BUKAN ≥10, sesuai revisi resmi CLAUDE.md "Target Kelengkapan Konten per Modul" poin 1 khusus Trailblazer)**. **SEMUA 6 LEVEL SPEAKING SEKARANG MENCAPAI TARGETNYA MASING-MASING.** Detail sesi 8: §15. **Sesi 9** — format KEEMPAT `SpeakingStoryTopic`, pilot 1 topik Explorer (§16), lalu Kenalan-nya direvisi py mic+main (§16.6), lalu audit "kalimat soal tidak boleh 100% sama" ketemu+perbaiki 4 duplikat (§16.7). **Sesi 10** (permintaan user: "tambahkan 5 materi speaking untuk level trailblazer dan audit apakah 5 materi saat ini sudah sesuai") — **Trailblazer digenapkan LAGI dari 5 jadi 10/10 topik (deviasi sadar dari target baku ≥5, preseden sama Listening/Grammar Trailblazer)**, 5 topik lama diaudit dulu (hasil bersih). Detail sesi 10: §17.

Terakhir diupdate: 2026-08-24

> Dokumen ini fokus pada SATU skill: **Speaking**. Konteks wajib dibaca dulu: [CLAUDE.md](../CLAUDE.md) (filter kid-friendly wajib + Aturan Wajib Speaking), [PRD.md](../PRD.md) §3 (sistem level & CEFR/YLE), [materi/vocab.md](vocab.md)/[materi/listening.md](listening.md)/[materi/reading.md](reading.md) (pola/skeleton dokumen ini + riset institusi Indonesia yang dipakai bersama).

---

## 0. Kenapa Format & Alur Speaking Beda-beda per Level? (SENGAJA, Bukan Belum Disinkronkan)

Pertanyaan yang sama polanya dgn `listening.md` §0: kenapa 6 level Speaking pakai 4 format beda ("format berdampingan", §2.1), bukan 1 bentuk yang sama rata? Jawabannya **SENGAJA** — progresi ini mengikuti LOMPATAN FORMAT RESMI Cambridge YLE/KET/PET Speaking sendiri per tingkatan (§4.1), dikonfirmasi riset per-level SEBELUM tiap format/konten dibangun:

| Level | Format | Bentuk soal inti (Tantangan) | Kenapa cocok di level ini |
|---|---|---|---|
| Little Stars, Starter | KEDUA (`SpeakingPhraseTopic`, §2.3) | Tangga Recognize→Imitate→Recall: dengar & tunjuk gambar → tirukan frasa lewat mic → ucapkan sendiri dari terjemahan Indonesia | 3 institusi Indonesia (LIA/EF/Kumon, §3) semua berhenti di pola "dengar model → tirukan" polos utk usia 3–7 th — app naikkan 1 tangga (recall) sbg improvement, TAPI tetap frasa TERTUTUP (bukan opini bebas) krn usia ini belum siap produksi bebas |
| Explorer | LAMA (`SpeakingTopic`) + pilot KEEMPAT (`SpeakingStoryTopic`, 1 topik, §16) | Ucapkan kalimat target dari `drill` + jawab bebas di mini-roleplay; pilot: dengar cerita mini lalu jawab pertanyaan komprehensinya via mic | Cambridge Pre A1 Starters Speaking (backbone Explorer) masih "object naming pendek + jawaban singkat" (§4.1) — `model`/`drill`/`roleplay` pendek sudah pas, TIDAK butuh desain ulang mekanik |
| Adventurer | LAMA (`SpeakingTopic`), KONTEN digeser (§13) | Shape SAMA dgn Explorer (`drill`/`roleplay`) TAPI kalimat WAJIB deskriptif+kata sifat+alasan "because" | Cambridge A1 Movers (backbone Adventurer) mulai py komponen "describe 4 differences... give a reason" (§4.1) — BUKAN naming polos lagi, jadi KONTEN yang digeser, bukan mekaniknya |
| Achiever | LAMA (`SpeakingTopic`), KONTEN dinaikkan lagi (§14) | Shape SAMA lagi TAPI kalimat WAJIB opini eksplisit ("In my opinion...") + perbandingan/preferensi | Cambridge A2 Flyers "info-exchange 2 arah" + EF Indonesia "Trailblazers" (10–14 th) eksplisit sebut titik infleksi "opini/presentasi" pas di rentang usia Achiever (§4.2/§4.3) |
| Trailblazer | KETIGA (`SpeakingInterviewTopic`, §9), 10 topik (§15+§17) | Simulasi interview: peer fiktif "Bima" (TTS) jawab dulu sbg model, baru anak jawab sendiri via mic, 8 giliran per topik | Cambridge KET→PET Speaking test INHERENTLY py struktur ANTAR-KANDIDAT (2 anak saling bicara+examiner) — beda KATEGORI dari Starters/Movers/Flyers (1 anak vs examiner saja, §4.1) — solo-app diakali dgn peer TTS, keputusan user EKSPLISIT (bukan default PRD §9) |

**Prinsip intinya SAMA dgn Listening**: progresi naik tangga KOMPLEKSITAS KOGNITIF+LINGUISTIK (tirukan tertutup → naming/dialog situasional → deskripsi+alasan → opini+perbandingan → interview 2-arah), bukan cuma kalimat yang makin panjang.

**BEDA penting dari Listening — Speaking pakai DUA sumbu perubahan yang independen, jangan disamakan**:
1. **Sumbu MEKANIK/format** (`SpeakingTopic` vs `SpeakingPhraseTopic` vs `SpeakingInterviewTopic` vs `SpeakingStoryTopic`) — cuma berubah di 3 titik: Little Stars/Starter (KEDUA), Trailblazer (KETIGA), & pilot Explorer (KEEMPAT, §16). Listening ganti format di HAMPIR SETIAP lompatan level; Speaking TIDAK.
2. **Sumbu KONTEN** (kompleksitas kalimat yang WAJIB dipakai dlm topik) — Explorer→Adventurer→Achiever TETAP pakai mekanik LAMA yang SAMA PERSIS (`SpeakingTopic`: `model`/`drill`/`roleplay`), kompleksitas naik lewat KONTEN SAJA (naming → deskripsi+alasan → opini+perbandingan) — BUKAN lewat format baru. Ini kenapa §13/§14 disebut "konten digeser", bukan "format baru dibangun" — beda kategori kerja dari §9/§16 yang benar² bangun tipe data baru.

**Dikunci eksplisit supaya tidak "disatukan asal sama" tanpa alasan baru**: CLAUDE.md — *"JANGAN migrasi format lama (Explorer/Adventurer/Achiever) ke format lain tanpa arahan baru user"* (§ "Speaking — 4 Format Berdampingan"). Preseden: Trailblazer DITANYA eksplisit dulu ("ikuti default PRD §9 low-effort" VS "desain interview baru", §9) sebelum format ketiga dibangun — user pilih revisi, bukan default. Pilot Explorer (§16) juga lahir dari audit user LANGSUNG ("exercises are all basically the same"), bukan inisiatif sepihak menambah format.

**Yang MEMANG wajib disatukan (beda sumbu dari format/konten di atas): Aturan Wajib Speaking.** Skor mic proporsional (`wordMatchDetail`, BUKAN `looseMatch` biner) + "▶️ Play Suaramu" WAJIB di SETIAP fitur mic, di SEMUA format/level tanpa kecuali (CLAUDE.md "Aturan Wajib: Setiap Fitur Speaking Butuh Skor Proporsional + 'Play Suaramu'") — gap ini SEMPAT ada di format LAMA (Explorer/Adventurer masih `looseMatch` + tanpa Play Suaramu sampai ditemukan lewat audit sesi 2, §2.2) dan sudah ditutup PENUH di semua 4 format sejak itu. Jangan bangun format/level baru yang lewatkan aturan ini — itu bukan "beda per level yang sah" spt tabel di atas, itu regresi.

---

## 1. Ringkasan (TL;DR)

- **Sesi 1** (riset+1 topik Little Stars): lihat §3–§5 di bawah, tidak diulang di sini — kesimpulan intinya: 3 institusi Indonesia (LIA GEVYL, EF Indonesia/English1 Small Stars, Kumon EFL) semua berhenti di pola "dengar model → tirukan" utk usia 3–6, jadi dibangun format `SpeakingPhraseTopic` dengan tangga 3-shape (Recognize → Imitate → Recall) sbg improvement — 0 kompetitor yang diriset py tugas recall murni.
- **Sesi 2, bagian (a) — Fix pelanggaran Aturan Wajib di format LAMA**: audit menemukan `SpeakingTopic` (Explorer/Adventurer) & `games/boss.ts` `runSpeakPhase` masih pakai `looseMatch` BINER (bukan proporsional) DAN TIDAK PUNYA "▶️ Play Suaramu" sama sekali — pelanggaran LANGSUNG ke Aturan Wajib Speaking CLAUDE.md yang eksplisit menyebut KETIGA lokasi ini (`games/speaking.ts`, `games/vocabulary.ts`, `games/boss.ts`) sbg wajib comply. Ditemukan juga: `drill` ("Ucapkan & Cek") lama HANYA auto-advance kalau `looseMatch` SUKSES — anak yang mic-nya salah tangkap ASR (bukan salah ngomong) jadi macet tidak bisa lanjut. **Diperbaiki KETIGA lokasi** (`games/speaking.ts` `runLatihanInti`/`runTantangan`, `games/boss.ts` `runSpeakPhase`) — skor proporsional (`wordMatchDetail`) + Play Suaramu + SELALU bisa "Lanjut" apa pun skornya (non-punitive, konsisten `games/vocabulary.ts` `runUcapan` yang jadi acuan pola). `roleplay` (jawaban bebas, tanpa target) TETAP tidak diskor proporsional (tidak ada "kata target" utk dibandingkan) TAPI sekarang WAJIB py Play Suaramu + tombol manual (bukan auto-advance lagi).
- **Sesi 2, bagian (b) — Riset & implementasi per level** (Indonesia diprioritaskan, §6): Cambridge YLE Speaking naik kompleksitas jelas per level (Starters "listen & point/short answer" → Movers "describe 4 differences + give a reason" → Flyers "info-exchange 2 gambar mirip" → KET/PET "interview antar-kandidat", §6.2–§6.4) — dipakai sbg dasar keputusan FORMAT per level, bukan cuma keputusan topik:
  - **Starter (5–7 th)**: lanjutan LANGSUNG format `SpeakingPhraseTopic` Little Stars (kalimat sedikit lebih panjang, domain "minta makanan" — `suka-makanan`, 10 frasa) — Kurikulum Merdeka Fase A & riset akademik PAUD (sudah dikonfirmasi materi Listening Starter, `listening.md` §3B) sama-sama bilang usia ini belum siap lompat jauh dari Little Stars.
  - **Achiever (11–13 th)**: TETAP format LAMA `SpeakingTopic` (model/drill/roleplay) — BUKAN `SpeakingPhraseTopic` — krn Cambridge A2 Flyers (backbone Achiever) & EF Indonesia "Trailblazers" (10–14 th, eksplisit "kepercayaan diri mengekspresikan pendapat") SAMA-SAMA menunjukkan usia ini sudah siap produksi kalimat DESKRIPTIF & opini terbuka, bukan lagi cuma tirukan frasa tertutup. 1 topik BARU dari nol: `deskripsi-orang` (Describing People), dipetakan dari `VOCAB_TOPICS_ACHIEVER` `ciri-ciri-fisik`.
  - **Little Stars** digenapkan dari 1 jadi **2 topik** (`kenalkan-keluarga`/Introduce My Family, dari `VOCAB_TOPICS_LITTLE_STARS` `keluargaku`).
  - **Explorer/Adventurer**: format LAMA dikonfirmasi ULANG cocok (Cambridge Starters/Movers-nya sendiri examiner-guided + short-answer/describe, persis pola `model`/`drill`/`roleplay`) — TIDAK diganti, cuma dapat fix compliance (a) di atas. Jumlah topik TIDAK digenapkan sesi ini (di luar scope, §7).
  - **Trailblazer**: DITANYA eksplisit ("ikuti default PRD §9 low-effort" VS "desain elemen baru ala interview KET/PET") — **user PILIH desain baru**. Format KETIGA `SpeakingInterviewTopic` dibangun dari nol: solo-app disiasati dgn "kandidat A" fiktif (`peerName`, TTS) yg menjawab tiap pertanyaan DULU sbg model, baru giliran anak menjawab dgn kata²nya sendiri via mic (jawaban personal, tidak diskor proporsional — sama alasan `roleplay` — TAPI Play Suaramu tetap wajib). 1 topik: `rencana-masa-depan` (Future Plans), 8 giliran wawancara. Detail penuh: §9.
- Diverifikasi: `npm run build` (typecheck + `verify:content` + bundle) lolos. Diuji live di browser (Playwright + Chromium headless, `SpeechRecognition` di-mock): Explorer's "Ucapkan & Cek" dgn transkrip MELESET total sekarang tetap menampilkan "Lanjut ➡️" (dulu macet) + skor proporsional + Play Suaramu; Explorer's "Mini-Roleplay" sekarang py Play Suaramu; Achiever's topik baru (Kenalan+Latihan Inti) jalan dgn skor 100%/3-bintang utk transkrip yang cocok; Starter's topik baru (format `SpeakingPhraseTopic`) Kenalan tampil 10 baris 🔊/🎤/🎮; Little Stars topik ke-2 muncul di daftar materi; **Trailblazer's format KETIGA "interview" (§9) diuji penuh 8 giliran Latihan Inti + 8 giliran Tantangan → "Kerja Bagus!"**, jawaban Bima terbukti tersembunyi default di Tantangan & terungkap via Petunjuk. 0 console/page error di seluruh alur.

---

## 2. Analisis Mekanik Speaking — Status Terkini (Setelah Sesi 2)

### 2.1 Status konten per level

| Level | Format | Jumlah topik | Status target ≥10/skill |
|---|---|---|---|
| Little Stars | KEDUA (`SpeakingPhraseTopic`) | **12** (full parity dgn Vocab, §10) | ✅ Tercapai |
| Starter | KEDUA (`SpeakingPhraseTopic`) | **10** (full parity dgn Vocab, §11) | ✅ Tercapai |
| Explorer | LAMA (`SpeakingTopic`) | **10** (§12) | ✅ Tercapai |
| Adventurer | LAMA (`SpeakingTopic`) | **10** (§13, konten digeser ke pola deskripsi+alasan) | ✅ Tercapai |
| Achiever | LAMA (`SpeakingTopic`) | **10** (§14, konten digeser ke pola opini+perbandingan) | ✅ Tercapai |
| Trailblazer | KETIGA (`SpeakingInterviewTopic`) | **5** (§15, target ≥5 KHUSUS Trailblazer — BUKAN ≥10) | ✅ Tercapai |

### 2.2 Fix Aturan Wajib Speaking di format LAMA (Explorer/Adventurer, `games/speaking.ts`)

**Sebelum sesi ini**, `runLatihanInti`/`runTantangan` (format lama, `model`/`drill`/`roleplay`) py 2 masalah:
1. Skor `looseMatch()` BINER (≥50% kata kunci = lolos) — bukan proporsional (`wordMatchDetail`), pelanggaran langsung ke kalimat pertama Aturan Wajib Speaking CLAUDE.md.
2. TIDAK PUNYA "▶️ Play Suaramu" sama sekali — pelanggaran ke kalimat kedua aturan yang sama.
3. `drill` ("Ucapkan & Cek") auto-advance HANYA kalau `looseMatch` SUKSES — anak yang ASR-nya salah tangkap (confidence rendah/noise, BUKAN salah ngomong beneran) macet di soal yang sama tanpa jalan keluar selain terus coba, kontras dgn `games/vocabulary.ts` `runUcapan` (Vocab, tab "🗣️ Penggunaan") yang SUDAH lebih dulu diupgrade ke pola "skor proporsional + SELALU bisa lanjut apa pun hasilnya" (`materi/speaking.md` sesi 1 sempat mengira format lama "belum dikerjakan" itu murni utang UX, ternyata JUGA utang compliance yang lebih serius).

**Sesudah sesi ini**: `runLatihanInti`/`runTantangan` REUSE `scoreMic()`/`roundActionsHtml`/`listenAndRecordOnce` yang SAMA persis dgn fungsi format BARU di file yang sama (bukan duplikat kode terpisah lagi — keduanya sekarang legitimately berbagi helper krn levelnya sama, `games/speaking.ts`) — kedua fungsi lama dapat parameter BARU `level: LevelKey` (dipakai `pickPraise`/`pickEncourage`, breaking change signature, semua pemanggil di `app.ts` ikut diupdate).
- `drill` (ada target tetap) → skor proporsional PENUH (bintang, word-diff, Play Suaramu), "Lanjut" SELALU muncul apa pun skornya (tidak lagi menunggu match).
- `roleplay` (jawaban bebas, TIDAK ADA target) → skor proporsional SENGAJA TIDAK diterapkan (tidak ada "kata target" utk dibandingkan — konsisten kenapa aturan itu selalu berbunyi "rasio kata TARGET vs yang kedengaran"), TAPI Play Suaramu tetap WAJIB (bagian aturan yang tidak bersyarat py-target-atau-tidak) + tombol manual "Lanjut" (bukan `setTimeout` auto-advance lagi).

`games/boss.ts` `runSpeakPhase` (dipakai lintas SEMUA level di Tantangan Bos) dapat perbaikan yang SAMA — CLAUDE.md sendiri menyebut file ini eksplisit sbg salah satu lokasi wajib. TETAP auto-advance (konsisten pace 3 babak lain di gauntlet, bukan diubah jadi manual spt `games/speaking.ts`) & TETAP maju apa pun hasilnya (sudah begitu dari awal di sini, cuma sekarang py tampilan skor proporsional + Play Suaramu, jeda diperpanjang 850ms→1400ms biar sempat kebaca).

### 2.3 Format KEDUA (`SpeakingPhraseTopic`) — Little Stars & Starter

Tidak berubah dari sesi 1 (§4/§5 sesi 1 di bawah) — Starter REUSE fungsi generik APA ADANYA (`renderKenalanPhrase`/`runLatihanIntiPhrase`/`runTantanganPhrase`), 0 baris kode baru, murni data baru (`SPEAKING_TOPICS_STARTER`, `content.ts`).

---

## 3. Riset Sesi 1 (Little Stars) — Ringkasan, Detail Lengkap di Bawah §8

3 institusi Indonesia (LIA GEVYL, EF Indonesia/English1 Small Stars, Kumon Indonesia EFL) semua berhenti di pola "dengar model → tirukan" (echo/imitation) utk usia 3–6 th, TANPA percakapan bebas. Cambridge Pre A1 Starters Speaking (backbone Explorer) — object naming pendek + scaffold anti-panik examiner ("Is this the apple?"). Kompetitor internasional (Duolingo/Lingokids/ELSA/Buddy.ai) semua juga cuma echo+skor, 0 py tugas recall murni. Detail lengkap: §8.

---

## 4. Riset Sesi 2 — Speaking per Level (Prioritas Indonesia)

### 4.1 Cambridge YLE/KET/PET Speaking — Tangga Kompleksitas per Level (Backbone Struktural)

| Level app | Backbone CEFR/YLE | Format Speaking resmi | Insight |
|---|---|---|---|
| Little Stars/Starter | (di bawah Pre A1) | — (tidak ada exam resmi di usia ini) | Echo/imitation (§3) |
| Explorer | Pre A1 Starters | 4 part, examiner taruh kartu di gambar besar, jawaban pendek diterima ("Red" saja cukup), scaffold anti-panik | Object naming + short answer — cocok `model`/`drill` pendek + `roleplay` personal Q&A sederhana |
| Adventurer | A1 Movers | 4 part: **describe 4 differences antar-gambar**, lanjutkan cerita 4-gambar, **odd-one-out + kasih alasan**, personal questions | Mulai py komponen DESKRIPSI multi-kalimat & ALASAN ("because") — lebih dari sekadar naming |
| Achiever | A2 Flyers | Mirip Movers TAPI describe-differences jadi INFO-EXCHANGE 2 arah (2 gambar mirip beda, examiner sebut 6 kalimat, anak sebut versi bedanya) + cerita gambar | Butuh MENDENGAR detail lalu MERESPONS dgn versi sendiri — governance lebih rumit dari app solo bisa simulasikan penuh, tapi arah "deskripsi + opini" jelas |
| Trailblazer | A2 Key (KET) → B1 Preliminary (PET) | KET: 2 part, 8–10 menit; PET: 4 part, 10–12 menit — **ANTAR-KANDIDAT** (2 anak saling bicara + examiner), bukan lagi 1 anak vs examiner | Format INHERENTLY butuh 2 partisipan manusia — solo-app tidak bisa simulasikan tanpa keputusan desain baru (voice bot palsu berperan sbg "kandidat lain"?) |

Sumber: [flyer.us A1 Movers](https://flyer.us/a1-cambridge-movers-exam-format/), [cambridgeenglish.org Movers format](https://www.cambridgeenglish.org/exams-and-tests/qualifications/young-learners/paper/movers/format/), [flyer.us Flyers speaking](https://flyer.us/achieve-5-shields-in-the-cambridge-flyers-speaking-test/), [cambridgeenglish.org Flyers format](https://www.cambridgeenglish.org/exams-and-tests/flyers/test-format/), [engxam.com A2 Key](https://engxam.com/cambridge-english-exams/a2-key-ket/), [kseacademy.com B1 Preliminary Speaking](https://kseacademy.com/en/cambridge/b1-preliminary-pet/speaking/).

### 4.2 EF Indonesia / English1 — Tier Usia Lanjutan (Konfirmasi Indonesia)

- **"High Flyers" (7–9 th — PERSIS rentang usia Explorer)**: kursus 8-level, tujuan eksplisit "strengthen foundation, **improve speaking skills**, build confidence... gradually". Sumber: [english1.co.id/highflyers](https://english1.co.id/highflyers), [english1.co.id/program/highflyers](https://english1.co.id/program/highflyers/).
- **"Trailblazers" EF Indonesia (10–14 th — overlap Achiever DAN app's Trailblazer)**: "develop more complex communication skills... confidence **in expressing opinions**... critical thinking and presentation skills". Sumber: [english1.co.id/program/trailblazers](https://english1.co.id/program/trailblazers/), [english1.gimana.how/trailblazers](https://english1.gimana.how/trailblazers/). *(Catatan: nama "Trailblazers" EF INI beda dari nama level "Trailblazer" app ini — EF rentang usianya 10–14, app "Trailblazer" 12+ — overlap sebagian, bukan identik, dicatat sbg temuan riset bukan klaim hubungan.)*
- **Insight**: EF Indonesia sendiri menaruh titik infleksi "mulai py speaking berbasis OPINI/presentasi" di rentang 10–14 th — PAS beririsan dgn Achiever (11–13) — mengonfirmasi keputusan §5B (Achiever pakai format LAMA `roleplay` opini-terbuka, bukan `SpeakingPhraseTopic` tertutup).

### 4.3 Insight Gabungan → Keputusan Format per Level

- **Little Stars/Starter**: `SpeakingPhraseTopic` (recognize→imitate→recall, target tertutup) — usia belum siap opini/deskripsi bebas (§3).
- **Explorer/Adventurer**: `SpeakingTopic` lama (model/drill/roleplay) SUDAH pas — Starters/Movers-nya sendiri masih examiner-guided dgn jawaban pendek/deskripsi sederhana, format ini menampungnya tanpa desain ulang, TINGGAL genapkan topik & konten sesuai tema Movers (describe/alasan) kapan pun dibutuhkan (§7 gap).
- **Achiever**: `SpeakingTopic` lama JUGA dipakai (bukan format baru) TAPI kontennya SENGAJA digeser ke arah deskripsi+opini (bukan cuma naming) — 2 sumber independen (Flyers "describe differences", EF Indonesia "opini usia 10-14") mengonfirmasi ini pas.
- **Trailblazer**: BELUM ada keputusan format — KET/PET py struktur ANTAR-KANDIDAT yang genuinely beda dari SEMUA level di bawahnya (bukan cuma "naikkan kompleksitas kalimat" lagi, tapi "butuh lawan bicara") — keputusan ini SENGAJA dieskalasi ke user dulu (§7), pola sama persis dgn Listening Trailblazer yang ditanya dulu sebelum `ListeningDialogueTopic` dibangun.

---

## 5. Spesifikasi Sesi 2 — Diimplementasikan

### 5A. Little Stars topik ke-2

**Lokasi kode**: ditambahkan LANGSUNG ke `SPEAKING_TOPICS_LITTLE_STARS` (`content.ts`) — array yang sama dgn topik 1, topik 1 TIDAK diubah.

| id | Title | Tema (Vocab Little Stars) |
|---|---|---|
| `kenalkan-keluarga` | Kenalkan Keluargaku (Introduce My Family) | `keluargaku` |

10 frasa (pola "This is my.../I have a.../I love my..." — introduksi keluarga, bukan sekadar label kata): Mom→"This is my mom.", Dad→"This is my dad.", Sister→"I have a sister.", Brother→"I have a brother.", Baby→"The baby is cute.", Grandma→"I love my grandma.", Grandpa→"I love my grandpa.", Aunt→"This is my aunt.", Uncle→"This is my uncle.", Family→"I love my family!".

### 5B. Starter — BARU dari nol

**Lokasi kode**: `SPEAKING_TOPICS_STARTER` (BARU, `content.ts`), ditambahkan ke `SPEAKING_TOPICS_BY_LEVEL['starter']` (sebelumnya Starter fallback ke Explorer format lama utk Speaking).

| id | Title | Tema (Vocab Starter) |
|---|---|---|
| `suka-makanan` | Makanan Kesukaanku (My Favorite Food) | `makanan-favoritku` |

10 frasa, pola permintaan/pendapat pendek (bukan cuma "I like X" diulang — variasi speech-act: pernyataan suka, permintaan sopan "Can I have...?"/"I want..."): Pizza→"I like pizza.", Burger→"I want a burger.", Sandwich→"I made a sandwich.", Ice Cream→"I love ice cream!", Cake→"Can I have cake?", Cookie→"I eat a cookie.", Chocolate→"I love chocolate.", Cheese→"I like cheese.", Juice→"I want some juice.", Yogurt→"I eat yogurt."

### 5C. Achiever — BARU dari nol, format LAMA `SpeakingTopic`

**Lokasi kode**: `SPEAKING_TOPICS_ACHIEVER` (BARU, `content.ts`), ditambahkan ke `SPEAKING_TOPICS_BY_LEVEL['achiever']`. **Tidak ada kode baru** — `types.ts`/`games/speaking.ts`/`app.ts`/`games/boss.ts` semua SUDAH generik lewat `'items' in topic` (Achiever's topik TIDAK py `items`, jadi otomatis jatuh ke cabang format lama yang SUDAH diperbaiki di §2.2).

| id | Title | Tema (Vocab Achiever) |
|---|---|---|
| `deskripsi-orang` | Deskripsi Orang (Describing People) | `ciri-ciri-fisik` |

- `model` (2 kalimat dengar): "She has curly hair." / "He is tall and strong."
- `drill` (4 kalimat diucapkan, TERTUTUP — bisa diskor proporsional): "My friend has curly hair.", "My dad is tall.", "My sister is beautiful.", "My grandfather is old."
- `roleplay` (3 pertanyaan BEBAS, gaya Flyers/EF "describe & opini"): "What does your best friend look like?", "Describe someone in your family.", "Who is the tallest person you know?"

---

## 6. Riset Sesi 2 — Sumber Institusi Indonesia (Prioritas Utama, Konfirmasi Ulang)

Instruksi user eksplisit (konsisten sesi 1): prioritaskan lembaga bahasa Inggris Indonesia dulu. Sesi 2 tidak menemukan sumber Indonesia BARU yang eksplisit soal speaking di usia Starter/Achiever selain EF Indonesia (§4.2) — LIA/Kumon (§3, sesi 1) tidak py tier terpisah yang terdokumentasi utk usia 5–13 dengan detail speaking sedetail EF. Kurikulum Merdeka Fase B/C/D (Explorer/Adventurer/Achiever) TIDAK py capaian SPESIFIK speaking terpisah dari "komunikasi lisan" umum (sudah dikonfirmasi generik di riset Listening `listening.md` §3C–§3E, tidak diulang detail di sini) — dipakai sbg konfirmasi arah umum, bukan sumber utama keputusan format (Cambridge YLE tetap backbone struktural PRD §3 yang lebih presisi per level utk skill INI spesifik, sama alasan yang dipakai sesi 1).

---

## 7. Gap yang Masih Terbuka (dilaporkan, bukan dianggap selesai)

- **SEMUA 6 LEVEL SPEAKING SEKARANG MENCAPAI TARGET KELENGKAPAN KONTENnya masing-masing** — Little Stars 12/12 (§10), Starter 10/10 (§11), Explorer 10/10 (§12), Adventurer 10/10 (§13), Achiever 10/10 (§14, target ≥10), Trailblazer 5/5 (§15, target ≥5 KHUSUS level ini). **TIDAK ADA LAGI gap "jumlah topik" utk skill Speaking** — gap yang tersisa (kalau ada sesi lanjutan) murni soal MEMPERLUAS lebih jauh dari target minimum (mis. Trailblazer bisa ditambah lagi meski sudah py 5, atau level lain ditambah lebih dari 10) — bukan lagi menutup kekosongan.
- **Explorer (3 topik) & Adventurer (topik sendiri) TIDAK digenapkan** sesi ini — formatnya sendiri sudah dikonfirmasi cocok (§4.3), genapkan ke ≥10 murni kerja data data kapan pun dibutuhkan, idealnya kontennya digeser sedikit ke arah "describe 4 differences + give a reason" (tema Movers, §4.1) supaya levelnya makin dibedakan dari Explorer, bukan cuma naming berulang dgn kalimat lebih panjang.
- **Trailblazer (`rencana-masa-depan`) baru 1 dari target ≥10 topik** — SUDAH py format (`SpeakingInterviewTopic`, §9), tinggal kerja data: tema PET residual lain yg belum dipetakan topik manapun (`materi/vocab.md` §3F.2) bisa jadi topik interview ke-2/3/dst, pola pemetaan yg sama (1 "kandidat" `peerName`, ~8 giliran tanya-jawab personal per topik).
- **`recordAttempt()` mic tetap sengaja tidak dihitung ke akurasi** (semua level, semua format, by design — bukan gap, dicatat supaya tidak "diperbaiki" keliru di masa depan).

---

## 8. Riset Sesi 1 Lengkap (Little Stars) — Diarsipkan dari Versi Sebelumnya

### 8.1 Institusi Bahasa Inggris Indonesia (3–6 th)

- **LIA — GEVYL (4–6 th)**: metode TPR, TIDAK ADA komponen percakapan bebas/roleplay terbuka disebutkan. Sumber: [lblia.com/kursus-bahasa-inggris-anak](https://lblia.com/kursus-bahasa-inggris-anak/).
- **EF Indonesia / English1 — "Small Stars" (3–6 th)**: metode TPR + **"Guru menekankan pengucapan Bahasa Inggris untuk membantu siswa membangun kepercayaan diri mereka"** — pronunciation ditekankan lewat tiruan berulang dgn feedback guru. Sumber: [english1.co.id/smallstars](https://english1.co.id/smallstars), [english1.co.id/program/smallstars](https://english1.co.id/program/smallstars/).
- **Kumon Indonesia (EFL, mulai usia 2 th)**: **"Look, Listen and Repeat"** — worksheet+audio, anak dengar lalu menirukan, level awal (7A/6A/5A) mulai dari KATA TUNGGAL dgn efek suara pendamping. Sumber: [id.kumonglobal.com/english-efl](https://id.kumonglobal.com/english-efl/).
- **Kesimpulan**: SEMUA TIGA institusi berhenti di "dengar model → tirukan" utk usia 3–6, TIDAK SATU PUN py percakapan bebas di level ini.

### 8.2 Kurikulum Merdeka — Fase Fondasi

Elemen "Keterampilan Sosial dan Bahasa" eksplisit mencakup **"kemampuan mengucapkan kata tolong, maaf, terima kasih"** — dasar pemilihan topik pertama `sapaan-sopan`. Sumber: [paud.id/capaian-pembelajaran-paud-kurikulum-merdeka](https://www.paud.id/capaian-pembelajaran-paud-kurikulum-merdeka/).

### 8.3 Cambridge YLE — Komponen Speaking (Pre A1 Starters)

4 part dipandu examiner, kartu gambar; jawaban pendek diterima; scaffold anti-panik ("Is this the apple?") kalau anak membeku. Sumber: [englishspeakingtest.com/a1-starters-speaking-test](https://englishspeakingtest.com/a1-starters-speaking-test.html), [exam-seekers.com starters-speaking-exam](https://exam-seekers.com/2021/06/14/ee-026c-yle-pre-a1-starters-speaking-exam/).

### 8.4 Kompetitor Internasional

Duolingo (AI speech recognition+feedback), Lingokids (play-based, bukan speech-sentris), ELSA Speak (skor fonem detail, terlalu klinis/evaluatif utk anak), Buddy.ai (ASR dilatih khusus suara anak, percakapan terpandu — lebih dekat `roleplay` level lebih tua). **Kesimpulan riset kunci**: 0 dari SEMUA sumber (Indonesia maupun internasional) py tugas RECALL murni (ucap dari memori TANPA model langsung sebelumnya) — jadi tangga 3-shape (Recognize→Imitate→Recall) jadi improvement genuinely baru, bukan re-skin.

### 8.5 Keputusan Desain Sesi 1 (Ringkas)

1. **Tangga 3-shape**: Kenalan "Main·Dengar & Tunjuk" (Recognize) → Latihan Inti "Tirukan Ucapannya!" (Imitate) → Tantangan "Sebutkan Sendiri!" (Recall, TANPA model default, "💡 Petunjuk" scaffold sejak awal).
2. **Kenalan pertahankan KEDUA mic 🎤 & main 🎮** (permintaan user eksplisit) — REUSE pola `renderKenalanWord` Reading Little Stars, diadaptasi audio-first.
3. **Skor proporsional + Play Suaramu di KETIGA langkah** sejak awal (beda dari format lama yang baru diperbaiki sesi 2, §2.2).

---

## 9. Trailblazer — Format KETIGA "Simulasi Interview" (Keputusan User: Revisi Penuh, Bukan Default §9)

Ditanya eksplisit sebelum dikerjakan (pola sama Listening Trailblazer, `listening.md` §2.5): **(a) ikuti default PRD §9** (1-2 topik `SpeakingTopic` format lama, opini/personal Q&A tanpa fitur baru, cepat) **VS (b) desain elemen baru meniru semangat interview KET/PET** (app memerankan "kandidat lain" via TTS yang bicara duluan, anak merespons — riset+desain lebih dalam). **User memilih (b).**

### 9.1 Kenapa Format Lama/Kedua Tidak Cukup

Cambridge A2 Key (KET) → B1 Preliminary (PET) — backbone struktural Trailblazer — Speaking test-nya **format INTERVIEW ANTAR-KANDIDAT**: 2 anak duduk bersama + 1 examiner, saling menjawab & berinteraksi satu sama lain (Part 2/4 PET eksplisit "candidates interact with each other"), BUKAN lagi 1 anak vs examiner spt Starters/Movers/Flyers. Ini beda KATEGORI, bukan cuma "naikkan kompleksitas kalimat" — `SpeakingPhraseTopic` (target tertutup) jelas terlalu sederhana, tapi `SpeakingTopic` lama (`roleplay` bebas) JUGA tidak menangkap ciri khas "menjawab SETELAH mendengar orang lain menjawab dulu" yang jadi inti pengalaman interview.

### 9.2 Solusi: "Kandidat A" Fiktif via TTS

Solo-app tidak bisa menghadirkan partner sungguhan — diakali dengan karakter fiktif konsisten (`peerName`, sesi ini "Bima") yang **menjawab tiap pertanyaan DULU** (model jawaban natural + alasan "because...", diputar TTS) sebelum giliran anak menjawab pertanyaan yang SAMA dengan kata-katanya sendiri lewat mic. Pola "giliran" (ambil giliran mendengar dulu, baru bicara) inilah yang mensimulasikan RASA interview 2-arah tanpa butuh partner manusia sungguhan — bukan solusi sempurna (anak tidak benar² berinteraksi dgn "Bima", "Bima" tidak bisa merespons balik jawaban anak), tapi menangkap struktur "dengar orang lain jawab dulu, baru gantian" yang jadi ciri paling mencolok KET/PET dibanding level di bawahnya.

Nama tokoh `peerName` ditampilkan sbg LABEL teks saja (reuse `.dialogue-line`/`.dialogue-speaker` dari format Listening Trailblazer, `ListeningDialogueLine`) — TIDAK PERNAH diucapkan sendiri oleh TTS (cuma isi jawabannya, `peerAnswer.en`), sama pola persis `ListeningDialogueLine.speaker` supaya tidak ada percobaan "TTS mengucapkan nama Indonesia dgn logat Inggris yang salah".

### 9.3 3 Langkah (Tangga Scaffold → Independen, Bukan Recognize/Imitate/Recall)

Beda dari tangga Little Stars/Starter (target tertutup, recall dari memori) — di sini konten SELALU terbuka (jawaban personal), jadi tangganya soal SEBERAPA BANYAK scaffold yang tersedia, bukan soal menghafal kata:

1. **Kenalan** (`renderKenalanInterview`) — daftar SEMUA giliran (pertanyaan + jawaban Bima) sekaligus, 🔊 dengar keduanya berurutan, 🎤 opsional coba jawab (TIDAK diskor/gating — murni exposure+keberanian awal, sama filosofi `roleplay`). TIDAK ADA mini-game 🎮 (beda dari Little Stars/Starter) — tidak ada target tertutup yg bisa dikuiskan di konten yang genuinely terbuka begini.
2. **Latihan Inti "🎙️ Giliranmu Menjawab!"** (`runLatihanIntiInterview`) — 8 giliran: pertanyaan + jawaban Bima **SELALU terdengar & terlihat** (auto-play berurutan), BARU mic anak — scaffold penuh, murni latihan "berani ambil giliran".
3. **Tantangan "🗣️ Wawancara Lengkap!"** (`runTantanganInterview`) — 8 giliran yang SAMA, TAPI jawaban Bima **TIDAK auto-diputar lagi** — anak menjawab independen dulu, "💡 Dengar Contoh Bima" tersedia SEJAK AWAL (tanpa gating attempt, pola sama `petunjukButtonHtml` level lain) kalau butuh bantuan. Ini yang jadi tugas "lebih mandiri" — bukan lebih sulit secara linguistik, tapi lebih sedikit sandaran.

Jawaban anak di KEDUA langkah 2 & 3 TIDAK diskor proporsional (tidak ada satu "jawaban benar" — personal/opini) — TETAP wajib "▶️ Play Suaramu" (`listenAndRecordOnce`) & `recordEvent({kind:'speak', graded:false})`, konsisten Aturan Wajib Speaking utk bagian yang tidak bersyarat py-target.

### 9.4 Konten: `rencana-masa-depan` (Future Plans)

Domain dipilih krn PET Speaking Part 1 (perkenalan personal) SERING menanyakan cita-cita/rencana masa depan — representatif utk format interview ini, dan BELUM dipakai topik Vocab/Listening Trailblazer manapun (residual tema PET, `materi/vocab.md` §3F.2). 8 giliran, tokoh "Bima": cita-cita, pelajaran favorit masa depan, kota besar/kecil, skill baru, bepergian ke negara lain, pekerjaan penting masa depan, kontribusi ke lingkungan, impian terbesar — semua py pola jawaban "opini + alasan (because)" yang jadi ciri linguistik PET (bukan cuma jawaban 1 kata spt Starters).

### 9.5 Kode

**Lokasi**: tipe baru `SpeakingInterviewTurn`/`SpeakingInterviewTopic` (`types.ts`, `AnySpeakingTopic` diperluas jadi union 3), `SPEAKING_TOPICS_TRAILBLAZER` (`content.ts`), 3 fungsi baru `renderKenalanInterview`/`runLatihanIntiInterview`/`runTantanganInterview` (`games/speaking.ts`, REUSE helper `roundActionsHtml`/`speakBilingual` yang sama dgn format kedua di file yang sama). Dispatcher `app.ts` (`runStage`/`runFreePlayRound`) dapat pembeda KEDUA `'turns' in topic` (setelah `'items' in topic`, sama pola `'noteGaps' in topic`/`'dialogueLines' in topic` Listening). `games/boss.ts` (`runSpeakPhase`) dapat cabang adapter ketiga (jawaban Bima diratakan jadi "phrase" gauntlet biasa, anak menirukannya — tidak menyimulasikan giliran penuh di sana, cukup utk babak cepat). **Tidak ada perubahan `progress.ts`** — pola sama format kedua, fallback `isStepVisited`.

### 9.6 Verifikasi

Diuji live (Playwright + Chromium headless, `SpeechRecognition` di-mock): Kenalan tampil 8 giliran (pertanyaan+jawaban Bima+🔊+🎤); Latihan Inti round 1 menampilkan jawaban Bima SEBELUM mic anak, sesudah mic menampilkan "Kamu jawab: ...", Play Suaramu, "Amazing! 🌟" (praise Inggris, sesuai level Trailblazer), tanpa skor; Tantangan round 1 MENYEMBUNYIKAN jawaban Bima default, "💡 Dengar Contoh Bima" mengungkapnya sekali tap; seluruh 8 giliran Latihan Inti + 8 giliran Tantangan diselesaikan → layar "Kerja Bagus!" (3 bintang, confetti, +15 XP). 0 console/page error.

---

## 10. Sesi 3 — Little Stars Digenapkan ke 12/12 Topik (Target ≥10 TERCAPAI)

Permintaan user: "lakukan research untuk membuat materi speaking per level minimal 10, lakukan research lihat di kompetitor seperti terutama di lembaga bahasa inggris indonesia... lakukan dulu di level little stars". Beda dari sesi 1/2 (riset FORMAT/mekanik), sesi ini fokus riset **URUTAN & PRIORITAS DOMAIN** — pertanyaan yang belum terjawab: dari 12 domain Vocab Little Stars, kalau harus genapkan Speaking ke ≥10 topik, domain mana yang paling didukung riset utk diprioritaskan duluan (bukan cuma "pilih bebas")?

### 10.1 Riset Tambahan: Urutan Topik Kumon Indonesia EFL per Level

Kumon EFL (sudah jadi salah satu 3 sumber utama sesi 1, `§8.1`) py **urutan topik per level yang terdokumentasi eksplisit**, sumber baru yang lebih detail dari riset sesi 1:
- **Level 7A (paling awal)**: siswa dengar KATA TUNGGAL dengan efek suara pendamping — contoh yang disebut EKSPLISIT: **"dog" dengan suara gonggongan, "truck" dengan suara motor**. Domain: HEWAN & KENDARAAN.
- **Level 6A**: **angka, warna, dan berbagai kata sifat DITAMBAHKAN**.
- **Level 5A**: mulai keterampilan pre-membaca (di luar scope Speaking).

Sumber: [pdfcoffee.com/kumon-table-of-learning-materials-7a-2a](https://pdfcoffee.com/kumon-table-of-learning-materials-7a-2a-pdf-free.html), [sites.google.com/kumon-english-program](https://sites.google.com/brac.net/kumon-efl-program/kumon-english-program).

**Insight**: ini memberi urutan PRIORITAS yang eksplisit didukung riset (bukan cuma "domain mana pun boleh") — Hewan & Kendaraan (level 7A, paling awal/paling dasar) didahulukan drpd Angka & Warna (level 6A, ditambahkan belakangan). Urutan topik baru di §10.2 mengikuti prioritas ini.

### 10.2 Implementasi: 10 Topik Baru, Little Stars Sekarang 12/12

Digenapkan LANGSUNG ke `SPEAKING_TOPICS_LITTLE_STARS` (array yang sama, 2 topik sesi sebelumnya TIDAK diubah) — **FULL PARITAS** dgn `VOCAB_TOPICS_LITTLE_STARS` (setiap 1 dari 12 domain Vocab Little Stars sekarang py padanan Speaking-nya sendiri, bukan cuma sebagian):

| # | id | Title | Domain Vocab | Prioritas riset |
|---|---|---|---|---|
| 1 | `sapaan-sopan` | Sapaan & Sopan Santun | `salam-sopan-santun` | *(sesi 1)* |
| 2 | `kenalkan-keluarga` | Kenalkan Keluargaku | `keluargaku` | *(sesi 2)* |
| 3 | `bunyi-hewan` | Bunyi Hewan (Animal Sounds) | `hewan-peliharaan` | Kumon 7A |
| 4 | `naik-kendaraan` | Yuk Naik Kendaraan (Let's Ride!) | `kendaraan` | Kumon 7A |
| 5 | `sentuh-tubuhku` | Sentuh & Sebutkan (Touch & Say) | `tubuhku` | TPR staple (`listening.md` §4A "Head, Shoulders, Knees & Toes") |
| 6 | `warna-favorit` | Warna Favoritku | `kenal-warna` | Kumon 6A |
| 7 | `hitung-yuk` | Ayo Menghitung (Let's Count!) | `angka-pertama` | Kumon 6A |
| 8 | `cari-bentuk` | Cari Bentuknya (Find the Shape) | `bentuk` | Perluasan alami dari angka/warna |
| 9 | `buah-favorit` | Buah Favoritku | `buah-buahan` | Perluasan tema makanan (konsisten Starter `suka-makanan`) |
| 10 | `rasa-hatiku` | Perasaanku (How I Feel) | `perasaanku` | EF/LIA "membangun kepercayaan diri berekspresi" |
| 11 | `main-yuk` | Yuk Main! (Let's Play!) | `mainan` | Domain sisa, kosakata sangat konkret/mudah diucapkan |
| 12 | `pakai-baju` | Pakaianku (What I Wear) | `pakaian` | Domain sisa |

Keputusan authoring:

- **Kata kunci & emoji SAMA dgn Vocab** (konsistensi lintas skill — anak yg sudah kenal kata dari Vocab langsung mengenali di Speaking), **frasa target ditulis ULANG baru** (prinsip "modalitas beda, bukan duplikasi", konsisten Listening/Reading Little Stars) — mis. Vocab `hewan-peliharaan`'s "I have a dog." jadi Speaking `bunyi-hewan`'s "The dog says woof!" (menekankan BUNYI/onomatope, bukan kepemilikan — genuinely task yg beda: melafalkan bunyi tiruan itu sendiri sebuah latihan artikulasi klasik, sejalan pola Kumon yg eksplisit memasangkan kata+efek-suara).
- **`sentuh-tubuhku` pakai kalimat PERINTAH** ("Touch your head!"/"Sentuh kepalamu!") bukan pernyataan — satu-satunya topik Little Stars Speaking yg pola kalimatnya imperatif, sengaja mencerminkan TPR (anak mengucapkan SEKALIGUS melakukan gerakannya, bukan cuma bicara pasif) — konsisten filosofi TPR yg jadi tema berulang di riset institusi Indonesia (LIA/EF, §3.1/§8.1).
- **Tidak ada kata "musim dingin"** di topik `pakai-baju` (Jaket/Sarung Tangan/Syal) — direvisi jadi "saat dingin"/"supaya hangat" (BUKAN "winter") krn Indonesia tidak punya musim dingin, filter kid-friendly/lokal (CLAUDE.md §1 — konten harus masuk akal utk anak Indonesia, bukan diterjemahkan mentah dari konteks negara 4-musim).
- **Vocab's kata "Orange" muncul 2x** (warna DAN buah, keduanya sudah py Speaking-nya sendiri: `warna-favorit`/`buah-favorit`) — konsisten dgn Vocab sendiri yg juga py duplikasi `en` string ini di 2 `VocabTopic` berbeda (bukan bug baru, mengikuti pola yg sudah ada).
- Progres AMAN dari tabrakan — semua 10 id topik baru BEDA dari id Vocab-nya (`bunyi-hewan` vs `hewan-peliharaan`, dst, konvensi sama sesi 1/2) DAN beda dari id Listening Little Stars (`kepala-pundak` dst) — key `${skill}:${topicId}:${section}` sudah py awalan skill jadi aman regardless, tapi tetap dibedakan tekstual sesuai konvensi.

### 10.3 Verifikasi

`npm run build` (typecheck + `verify:content` + bundle) lolos. Diuji live (Playwright + Chromium headless): daftar materi Speaking Little Stars menampilkan **12 materi** (bukan lagi 2); SEMUA 12 topik (index 0–11) berhasil dibuka tanpa error di Kenalan; topik baru `bunyi-hewan` diuji penuh sampai Latihan Inti — render benar ("The fish can swim! / Ikannya bisa berenang!"). 0 console/page error di seluruh alur.

### 10.4 Status Setelah Sesi Ini

**Little Stars SEKARANG 12/12 topik — target ≥10/skill TERCAPAI, level Speaking PERTAMA yang mencapai ini.** Starter (1/10), Explorer (3/10), Adventurer (topik sendiri, belum digenapkan), Achiever (1/10), Trailblazer (1/10) MASIH di bawah target — permintaan user sesi ini eksplisit scope-nya "lakukan dulu di level little stars", jadi level lain BELUM disentuh sesi ini, dicatat sbg kandidat sesi lanjutan (pola pemetaan 1 domain Vocab/level → 1 topik Speaking yang sama bisa direplikasi persis).

---

## 11. Sesi 4 — Starter Digenapkan ke 10/10 Topik (Target ≥10 TERCAPAI)

Permintaan user: "lakukan hal yang sama untuk level starter... research materi yang sesuai dengan level ini, research ke lembaga bahasa inggris lainnya terutama yang dalam negri" — pola persis sesi 3, level berikutnya.

### 11.1 Riset Tambahan: Kurikulum Merdeka Fase A (Kelas 1–2 SD) — Urutan Unit Eksplisit

Beda dari sesi 3 (fokus urutan LEVEL Kumon), sesi ini menemukan sumber Indonesia yang LEBIH SPESIFIK dari riset sesi 1/2 (yang cuma mengonfirmasi "Fase A minta instruksi sederhana dgn bantuan visual", generik): kurikulum kelas 2 SD Fase A terstruktur **13 unit pembelajaran** dgn urutan tema eksplisit — *"perkenalan diri, angka, benda di kelas, warna, bentuk, hewan peliharaan, anggota keluarga, hingga buah-buahan kesukaan"*. **Temuan kunci**: unit **keluarga** eksplisit mengajarkan **deskripsi** ("memberikan deskripsi... dengan kata sifat seperti big, small, short, tall") — bukan cuma sebut nama anggota keluarga, tapi PRODUKSI KALIMAT deskriptif tentang mereka. Sumber: [golden-course.com/materi-bahasa-inggris-kelas-2-sd-kurikulum-merdeka](https://golden-course.com/materi-bahasa-inggris-kelas-2-sd-kurikulum-merdeka/).

**Insight**: (a) Angka & benda-di-kelas termasuk unit PALING AWAL kurikulum resmi kelas 1-2 SD — jadi `sebut-angka`/`isi-kelasku` diprioritaskan tinggi di urutan array (§11.2); (b) tema "orang" (keluarga/orang di sekitar) SECARA RESMI dituntut menghasilkan KALIMAT DESKRIPTIF (bukan cuma naming) — mengonfirmasi keputusan `kenalkan-orang` pakai kalimat deskriptif penuh ("The man is tall.", bukan cuma "Man.") sudah SELARAS kurikulum resmi, bukan sekadar pilihan authoring bebas.

### 11.2 Implementasi: 9 Topik Baru, Starter Sekarang 10/10

Digenapkan LANGSUNG ke `SPEAKING_TOPICS_STARTER` (array yang sama, `suka-makanan` sesi sebelumnya TIDAK diubah) — **FULL PARITAS** dgn `VOCAB_TOPICS_STARTER`:

| # | id | Title | Domain Vocab | Prioritas riset |
|---|---|---|---|---|
| 1 | `suka-makanan` | Makanan Kesukaanku | `makanan-favoritku` | *(sesi 2)* |
| 2 | `sebut-angka` | Sebut Angkanya (Numbers 11–20) | `angka-11-20` | Kurikulum Merdeka Fase A unit awal (§11.1) |
| 3 | `hari-apa-ini` | Hari Apa Ini? | `hari-dalam-seminggu` | Rutinitas kalender kelas awal SD |
| 4 | `isi-kelasku` | Isi Kelasku (At School) | `di-sekolah` | Kurikulum Merdeka Fase A unit "benda di kelas" |
| 5 | `kenalkan-orang` | Kenalkan Orangnya | `orang-di-sekitarku` | Kurikulum Merdeka unit keluarga/orang — WAJIB kalimat deskriptif (§11.1) |
| 6 | `makhluk-kecil` | Makhluk Kecil (Insects) | `serangga` | Perluasan alami tema hewan |
| 7 | `jalan-jalan` | Yuk Jalan-Jalan | `tempat-di-sekitar` | — |
| 8 | `isi-rumahku` | Isi Rumahku | `barang-di-rumah` | — |
| 9 | `alam-di-sekitarku` | Alam di Sekitarku | `alam-sekitar` | — |
| 10 | `hobiku` | Hobiku | `hobi` | Tema paling abstrak (verba -ing), ditaruh terakhir |

Keputusan authoring:

- **`kenalkan-orang` SATU-SATUNYA topik yg SEMUA 10 frasanya berupa kalimat deskriptif penuh** ("The man is tall.", "The woman is smiling.", bukan pola "I [verb] a/the [noun]" spt topik lain) — langsung menjawab temuan §11.1 (kurikulum resmi menuntut deskripsi utk tema orang/keluarga di usia ini), bukan authoring bebas.
- **Id `makhluk-kecil` SENGAJA beda dari id Listening Starter `serangga-kecil`** (domain Vocab yg sama, `serangga`) — murni menghindari kebingungan baca kode/dokumen (2 id string identik lintas skill berbeda), TIDAK ada risiko tabrakan progres sungguhan (key `${skill}:${topicId}:${section}` sudah py awalan skill).
- Variasi pola kalimat dijaga (statement/exclamation/imperative/pertanyaan) — mis. `hari-apa-ini` py "What day is today?" (pertanyaan) & "See you tomorrow!" (seruan perpisahan), `isi-rumahku` py "Please turn on the lamp." (permintaan sopan) — bukan "I have a/an X" diulang 10x monoton.
- Kata kunci & emoji SAMA dgn Vocab (konsistensi lintas skill), frasa target ditulis ULANG baru (prinsip "modalitas beda, bukan duplikasi", konsisten §10).

### 11.3 Verifikasi

`npm run build` (typecheck + `verify:content` + bundle) lolos. Diuji live (Playwright + Chromium headless): daftar materi Speaking Starter menampilkan **10 materi** (bukan lagi 1); SEMUA 10 topik (index 0–9) berhasil dibuka tanpa error di Kenalan; topik baru `isi-kelasku` diuji sampai Latihan Inti — render benar ("The coach helps us play. / Pelatih membantu kami bermain."). 0 console/page error di seluruh alur.

### 11.4 Status Setelah Sesi Ini

**Starter SEKARANG 10/10 topik — target ≥10/skill TERCAPAI, level Speaking KEDUA (setelah Little Stars) yang mencapai ini.** Explorer (3/10), Adventurer (topik sendiri, belum digenapkan), Achiever (1/10), Trailblazer (1/10) masih di bawah target — scope sesi ini eksplisit "level starter" saja, level lain dicatat sbg kandidat sesi lanjutan (pola pemetaan yang sama, 1 domain Vocab/level → 1 topik Speaking, bisa direplikasi persis).

---

## 12. Sesi 5 — Explorer Digenapkan ke 10/10 Topik (Target ≥10 TERCAPAI, Format LAMA)

Permintaan user: "lakukan hal yang sama untuk level explorer... research materi yang sesuai dengan level explorer ini, research ke lembaga bahasa inggris lainnya terutama yang dalam negri" — pola persis sesi 3/4, level berikutnya. **Beda penting dari sesi 3/4**: Explorer pakai format LAMA `SpeakingTopic` (`model`/`drill`/`roleplay`, roleplay bebas), BUKAN `SpeakingPhraseTopic` — jadi sesi ini murni GENAPKAN KONTEN pakai format yang SUDAH ADA & sudah dikonfirmasi cocok (sesi 2 §4.3), bukan authoring format baru.

### 12.1 Riset Tambahan: LIA GEYL Eksplisit Menyebut "Role Play" sbg Metode Inti (6–12 th)

Riset sesi 1/2 sebelumnya mengutip LIA GEYL untuk usia 4–6 (TPR-berat). Sesi ini menemukan konfirmasi LEBIH LANGSUNG: LIA GEYL (**General English for Young Learners**) sebenarnya mencakup rentang usia **6–12 tahun** (PERSIS meliputi Explorer 7–9), dengan deskripsi resmi materi ajar eksplisit menyebut: *"kombinasi storytelling di setiap unit, diintegrasikan dengan aktivitas **role-playing** dan menulis untuk mengembangkan keempat keterampilan Bahasa Inggris (menyimak, **berbicara**, membaca, menulis)"*. Sumber: [lbliakalideres.com/general-english-for-young-learners](https://lbliakalideres.com/general-english-for-young-learners/), [liasemarang.com/english-for-children-ec](https://liasemarang.com/programs/untuk-siswa-sd/english-for-chidren-ec/).

**Insight**: ini KONFIRMASI LANGSUNG (bukan cuma inferensi dari EF Indonesia sesi 2) bahwa "role-play" adalah metode BERNAMA eksplisit dari institusi Indonesia besar utk rentang usia Explorer — memvalidasi ULANG (bukan cuma "sudah dikonfirmasi dulu") bahwa format `SpeakingTopic` (`model`→dengar contoh, `drill`→ucap kalimat tertutup, `roleplay`→simulasi dialog bebas) TIDAK perlu diganti, genapkan isi jadi satu-satunya kerja yang tersisa.

### 12.2 Implementasi: 7 Topik Baru, Explorer Sekarang 10/10

Digenapkan LANGSUNG ke `SPEAKING_TOPICS` (array yang sama, 3 topik lama — `kenalan-teman`/`beli-toko`/`tanya-kabar` — TIDAK diubah):

| # | id | Title | Domain Vocab Explorer |
|---|---|---|---|
| 1–3 | `kenalan-teman`/`beli-toko`/`tanya-kabar` | *(sudah ada)* | — |
| 4 | `sakit-apa` | Sakit Apa? (What's Wrong?) | `kesehatan` |
| 5 | `lawan-kata` | Lawan Kata (Opposites) | `kata-sifat` |
| 6 | `bayar-di-kasir` | Bayar di Kasir (Pay at the Cashier) | `belanja-uang` |
| 7 | `jadwal-hariku` | Jadwalku Hari Ini (My Daily Schedule) | `waktu-harian` |
| 8 | `kamu-dari-mana` | Kamu dari Mana? (Where Are You From?) | `negara` |
| 9 | `pesta-ulang-tahunku` | Pesta Ulang Tahunku (My Birthday Party) | `pesta-perayaan` |
| 10 | `masak-yuk` | Masak Yuk! (Let's Cook!) | `peralatan-dapur` |

Keputusan authoring:

- **7 domain BARU dipetakan PERSIS SAMA dgn 7 domain yang Listening Explorer sudah pakai** (`klinik`/`kebun-binatang`/`di-kasir`/`jadwal-harian`/`dari-mana`/`pesta-ulang-tahun`/`di-dapur`, `materi/listening.md` §4C) — SENGAJA domain yang SAMA (bukan cari domain lain) supaya anak me-review kosakata yang sama lewat 2 modalitas berbeda (dengar vs ucap), bukan supaya "menghindari overlap" — prinsip beda dari Little Stars/Starter (yang MEMANG hindari overlap krn 1 kata cuma py 1 padanan Speaking). Id topik Speaking SENGAJA beda dari id Listening (`sakit-apa` vs `klinik`, dst) — konvensi sama sesi 3/4, murni menghindari kerancuan baca kode.
- **Setiap topik diperkaya jadi 3 `drill` + 3 `roleplay`** (naik dari 1-2/2-3 di 3 topik lama) — lebih dekat ke semangat "10 materi" CLAUDE.md walau format lama ini secara struktural TIDAK punya slot 10-item per topik spt Vocab (drill/roleplay memang didesain sbg beberapa giliran latihan, bukan daftar kata).
- `model`/`drill`/`roleplay` ditulis BARU (bukan disalin dari `VOCAB_TOPICS`/`LISTENING_TOPICS`) tapi kosakata kuncinya diambil dari domain Vocab yang sama (mis. `sakit-apa` pakai "headache"/"fever"/"tummy hurts"/"rest" dari `kesehatan`) — konsisten prinsip "modalitas beda, bukan duplikasi".
- Tidak ada perubahan `types.ts`/`games/speaking.ts`/`app.ts`/`games/boss.ts` — SEMUA sudah generik lewat `'items' in topic` (topik baru ini otomatis jatuh ke cabang format lama yg SUDAH diperbaiki sesi 2, §2.2 — skor proporsional + Play Suaramu + selalu-bisa-lanjut langsung berlaku tanpa kerja tambahan).

### 12.3 Verifikasi

`npm run build` (typecheck + `verify:content` + bundle) lolos. Cek programatik (skrip Node terpisah, bukan `verify-vocab-content.mjs` yg khusus Vocab) mengonfirmasi 0 id topik Speaking yang tabrakan lintas SEMUA level (35 topik total lintas 6 level, semua unik). Diuji live (Playwright + Chromium headless, mic di-mock): daftar materi Speaking Explorer menampilkan **10 materi** (bukan lagi 3); topik baru `sakit-apa` diuji penuh — Latihan Inti dgn transkrip cocok persis menampilkan ⭐⭐⭐/100%/word-diff/Play Suaramu/"Hebaaat!" (praise Indonesia, sesuai level Explorer) + "Lanjut" tetap ada (mengonfirmasi fix sesi 2 tetap berlaku di konten baru); Tantangan (Mini-Roleplay) topik yg sama merender pertanyaan baru dgn benar. 0 console/page error di seluruh alur.

### 12.4 Status Setelah Sesi Ini

**Explorer SEKARANG 10/10 topik — target ≥10/skill TERCAPAI, level Speaking KETIGA yang mencapai ini (setelah Little Stars & Starter), DAN level PERTAMA berformat LAMA yang mencapainya.** Adventurer (topik sendiri, format LAMA yang sama, belum digenapkan) & Achiever (1/10) masih di bawah target — scope sesi ini eksplisit "level explorer" saja. Pola genapkan Adventurer SELANJUTNYA bisa REPLIKASI PERSIS pendekatan sesi ini (pilih domain Vocab Adventurer yang belum disentuh Speaking, tulis model/drill/roleplay baru, format TIDAK perlu diubah) — TIDAK perlu riset format baru lagi, cukup riset domain/konten spesifik Adventurer kalau diminta.

---

## 13. Sesi 6 — Adventurer Digenapkan ke 10/10 Topik, Konten Digeser ke Deskripsi+Alasan

Permintaan user: audit dulu ("apakah materi speaking saat ini di level adventure sudah sesuai dengan levelnya?"), dijawab TIDAK PENUH (format oke, tapi 1 topik yang ada — `membuat-janji` — kompleksitasnya IDENTIK dgn Explorer, bukan genuinely lebih maju), lalu user eksplisit "yes proceed". **Beda krusial dari genapkan Explorer (sesi 5)**: sesi itu murni tambah topik DENGAN kompleksitas yang SAMA (krn Explorer memang belum py gap kompleksitas). Sesi ini WAJIB menggeser kompleksitas KONTEN juga, bukan cuma jumlah topik — kalau tidak, Adventurer tetap terasa "Explorer dengan kalimat lebih panjang", bukan level yang genuinely lebih maju.

### 13.1 Riset Tambahan: Kurikulum Merdeka Fase C (Kelas 5–6 SD) — Konfirmasi Langsung Pola "Deskripsi + Kata Sifat"

Beda dari riset sesi 2 (yang cuma mengutip Cambridge A1 Movers sbg backbone struktural CEFR), sesi ini menemukan KONFIRMASI LANGSUNG dari kurikulum resmi Indonesia: modul ajar Bahasa Inggris Fase C (kelas 5-6 SD, PERSIS rentang usia Adventurer 9-11 th) eksplisit mengajarkan **mendeskripsikan gambar memakai ADJECTIVE** — *"Guru memberikan instruksi sederhana kepada peserta didik untuk mengatakan tentang gambar dengan menggunakan adjective... Look at the picture. Where are they? How do they look? What animals are there? **Is the elephant big or small?**"*. Sumber: [modulguruku.com/modul-ajar-bahasa-inggris-kelas-5-sd-fase-c](https://www.modulguruku.com/2023/07/modul-ajar-bahasa-inggris-kelas-5-sd-fase-c.html).

**Insight kunci**: contoh pertanyaan resmi ini ("Is the elephant big or small?") PERSIS SAMA dgn tema Cambridge A1 Movers Speaking test (describe differences + comparison) — 2 sumber INDEPENDEN (kurikulum nasional Indonesia & badan sertifikasi internasional) KONVERGEN ke kesimpulan yang sama: usia 9-11 th WAJIB mulai py kalimat deskriptif berkata-sifat + perbandingan, bukan cuma pertukaran kalimat pendek. Ini bukan opsional/nice-to-have — ini benchmark resmi kurikulum nasional utk usia ini, jadi genapkan Adventurer TANPA menggeser kompleksitas kontennya akan literally gagal memenuhi capaian pembelajaran resminya sendiri.

### 13.2 Implementasi: 9 Topik Baru, Adventurer Sekarang 10/10, SEMUA Berpola Deskripsi+Alasan

Digenapkan LANGSUNG ke `SPEAKING_TOPICS_ADVENTURER` (array yang sama, `membuat-janji` TIDAK diubah):

| # | id | Title | Domain Vocab Adventurer |
|---|---|---|---|
| 1 | `membuat-janji` | *(sudah ada)* | — |
| 2 | `jadi-apa-nanti` | Jadi Apa Nanti? (What Do You Want to Be?) | `pekerjaan` |
| 3 | `deskripsi-hewan` | Deskripsi Hewan (Describe the Animal) | `binatang` |
| 4 | `rasanya-gimana` | Rasanya Gimana? (How Does It Taste?) | `makanan` |
| 5 | `di-tas-sekolahku` | Di Tas Sekolahku (In My School Bag) | `alat-sekolah` |
| 6 | `cuaca-hari-ini` | Cuaca Hari Ini (Today's Weather) | `cuaca` |
| 7 | `apa-fungsinya` | Apa Fungsinya? (What's It For?) | `anggota-tubuh` |
| 8 | `naik-apa-ke-sekolah` | Naik Apa ke Sekolah? | `transportasi` |
| 9 | `olahraga-favoritku` | Olahraga Favoritku | `olahraga` |
| 10 | `ruangan-favoritku` | Ruangan Favoritku | `rumah` |

Keputusan authoring:

- **SEMUA 9 topik baru WAJIB py minimal 1 kalimat deskriptif berkata-sifat DAN 1 pertanyaan "why"/alasan** — pembeda konkret & terukur dari Explorer (yang topiknya TIDAK py kriteria ini sama sekali). Contoh: `deskripsi-hewan` model "The giraffe has a long neck."/"The elephant is bigger than the cat." (deskripsi+perbandingan, PERSIS pola "Is the elephant big or small?" dari riset §13.1) + roleplay "Why do you like your favorite animal?" (alasan). `apa-fungsinya` mengambil sudut BEDA dari `anggota-tubuh` versi Little Stars/Starter (yang cuma "touch your X") — di sini FUNGSI/ALASAN ("I use my eyes to SEE"), bukan cuma nama bagian tubuh, supaya genuinely lebih maju dari 2 level di bawahnya yg pakai domain sama.
- **9 domain dipetakan SAMA dgn 9 domain yg Listening Adventurer sudah pakai** (`pekerjaan`/`binatang`/`makanan`/`alat-sekolah`/`cuaca`/`anggota-tubuh`/`transportasi`/`olahraga`/`rumah`) — pola sama Explorer (sesi 5): supaya anak review kosakata sama lewat 2 modalitas. `perasaan`/`bahan-material`/`kata-kerja-harian`/`alam-lingkungan` (4 domain Vocab Adventurer sisa) sengaja dilewati, sama alasan Listening.
- Id topik Speaking BEDA dari id Listening Adventurer (konvensi sama Explorer) — tidak ada tabrakan progres krn key `${skill}:${topicId}:${section}` sudah py awalan skill, dicek programatik 0 dupe (§13.3).
- Tidak ada perubahan `types.ts`/`games/speaking.ts`/`app.ts`/`games/boss.ts` — format lama sudah generik, fix compliance sesi 2 (skor proporsional+Play Suaramu+selalu-bisa-lanjut) otomatis berlaku ke konten baru ini tanpa kerja tambahan.

### 13.3 Verifikasi

`npm run build` (typecheck + `verify:content` + bundle) lolos. Skrip Node terpisah mengonfirmasi 0 id topik Speaking yang tabrakan lintas SEMUA level (44 topik total lintas 6 level). Diuji live (Playwright + Chromium headless, mic di-mock): daftar materi Speaking Adventurer menampilkan **10 materi** (bukan lagi 1); SEMUA 10 topik berhasil dibuka tanpa error; topik baru `deskripsi-hewan` diuji sampai Latihan Inti (transkrip MELESET total tetap menampilkan skor proporsional 1/5=20% + "Keep going! 💪" [praise Inggris, sesuai level Adventurer] + "Lanjut" tetap ada, mengonfirmasi fix sesi 2 tetap berlaku) & Tantangan (roleplay menampilkan pertanyaan deskriptif "What does a giraffe look like?" dgn benar). 0 console/page error di seluruh alur.

### 13.4 Status Setelah Sesi Ini

**Adventurer SEKARANG 10/10 topik — target ≥10/skill TERCAPAI, level Speaking KEEMPAT yang mencapai ini, DAN satu-satunya (bersama audit yang memicunya) yang kontennya SENGAJA digeser kompleksitasnya, bukan cuma digenapkan jumlahnya.** Achiever (1/10) masih di bawah target — Cambridge A2 Flyers (backbone Achiever) py 1 lompatan kompleksitas LAGI dari Movers (info-exchange 2-arah, bukan cuma describe+alasan searah) yang bisa jadi arah riset kalau diminta lanjut ke Achiever.

---

## 14. Sesi 7 — Achiever Digenapkan ke 10/10 Topik, Konten Naik ke Opini+Perbandingan

Permintaan user: "continue" (lanjutan langsung dari audit+genapkan Adventurer sesi 6, tanpa audit ulang eksplisit — konsisten pola "genapkan level berikutnya" yang sudah berjalan sesi 3-6). **Prinsip sama dgn sesi 6**: BUKAN cuma tambah topik dgn kompleksitas SAMA — riset ditutup dulu utk memastikan kontennya genuinely 1 tingkat LEBIH MAJU dari Adventurer, bukan Adventurer dgn topik lebih banyak.

### 14.1 Riset: Kurikulum Merdeka Fase D (Kelas 7–9 SMP) — Opini, Perbandingan, Preferensi Bernama Eksplisit

Sumber resmi kurikulum Fase D (kelas 7-9 SMP — Achiever, per riset sesi 2, diposisikan "ANTARA Fase C & Fase D") eksplisit: *"Peserta didik terlibat dalam diskusi, misalnya memberikan **PENDAPAT**, membuat **PERBANDINGAN**, dan menyampaikan **PREFERENSI**"* — dgn frasa fungsional BERNAMA eksplisit: **"In my opinion…", "What do you think about…", "I believe that…"**. Sumber: [pembelajaranmendalam.com/cp-bahasa-inggris-fase-d](https://www.pembelajaranmendalam.com/2025/12/cp-bahasa-inggris-fase-d-smp-mts-kelas-7-8-9-semester-1-2-kurmer-pm-terbaru.html).

**Insight**: ini SATU TINGKAT LEBIH MAJU dari temuan Fase C (sesi 6, §13.1 — "deskripsi + kata sifat", mis. "Is the elephant big or small?") — Fase D menuntut OPINI dgn frasa penanda eksplisit ("In my opinion") + PERBANDINGAN bernilai ("Which is better...") + PREFERENSI ("I prefer..."), bukan cuma deskripsi objektif+alasan sederhana ("because"). Pembeda konkret: Adventurer's "because" menjelaskan FAKTA ("I like ice cream because it is sweet" — pernyataan objektif ttg rasa), sedangkan Achiever's "In my opinion X is better than Y" adalah PENILAIAN SUBJEKTIF yg membandingkan 2 hal — kompleksitas kognitif & linguistik lebih tinggi (perlu struktur komparatif "more...than"/"better than", bukan cuma "adjective + because").

### 14.2 Implementasi: 9 Topik Baru, Achiever Sekarang 10/10, SEMUA Berpola Opini+Perbandingan

Digenapkan LANGSUNG ke `SPEAKING_TOPICS_ACHIEVER` (array yang sama, `deskripsi-orang` TIDAK diubah):

| # | id | Title | Domain Vocab Achiever |
|---|---|---|---|
| 1 | `deskripsi-orang` | *(sudah ada)* | `ciri-ciri-fisik` |
| 2 | `tempat-favorit-di-kota` | Tempat Favoritku di Kota | `tempat-di-kota` |
| 3 | `kasih-arahan` | Kasih Arahan (Giving Directions) | `arah-posisi` |
| 4 | `hiburan-favoritku` | Hiburan Favoritku | `hiburan-waktu-luang` |
| 5 | `kebiasaan-baikku` | Kebiasaan Baikku (My Good Habits) | `kata-kerja-lanjutan` |
| 6 | `pendapatku-soal-teknologi` | Pendapatku Soal Teknologi | `teknologi-internet` |
| 7 | `kepribadian-idolaku` | Kepribadian Idolaku | `sifat-kepribadian` |
| 8 | `pelajaran-favoritku` | Pelajaran Favoritku | `mata-pelajaran` |
| 9 | `angka-di-sekitarku` | Angka di Sekitarku | `angka-puluhan` |
| 10 | `benda-favoritku` | Benda Favoritku | `sifat-benda-lanjutan` |

Keputusan authoring:

- **SEMUA 9 topik baru WAJIB py ≥1 frasa opini eksplisit ("In my opinion"/"I believe"/"I think") DAN ≥1 pertanyaan perbandingan/preferensi ("Which do you prefer...", "..., or...? Why?")** — pembeda konkret & terukur dari Adventurer (yang cuma py "because", tanpa framing opini/komparatif eksplisit). Contoh: `pendapatku-soal-teknologi` model "In my opinion, tablets are useful for learning." + drill "A smartphone is more portable than a laptop." (komparatif) + roleplay "Which is better, a laptop or a smartphone? Why?" (preferensi+alasan) — PERSIS pola "In my opinion.../Which is better" dari riset §14.1.
- **`angka-di-sekitarku` (domain angka) SENGAJA dibingkai opini ttg NILAI/JUMLAH** ("I think fifty dollars is expensive for a toy" — apakah suatu jumlah MAHAL/WAJAR itu OPINI, bukan fakta), bukan cuma sebut angka besar — supaya tetap konsisten pola opini+perbandingan topik lain, bukan domain yang dipaksakan.
- **9 domain dipetakan ke SEMUA 9 domain Vocab Achiever yg belum disentuh Speaking** — SAMA 9 domain (+ `ciri-ciri-fisik` yg sudah ada = genap 10) yg Listening Achiever SUDAH pakai SEMUA 10-nya, pola sama Explorer/Adventurer (id topik Speaking beda dari id Listening Achiever, aman dari tabrakan progres krn key sudah py awalan skill).
- Tidak ada perubahan `types.ts`/`games/speaking.ts`/`app.ts`/`games/boss.ts` — format lama sudah generik, fix compliance sesi 2 otomatis berlaku ke konten baru ini.

### 14.3 Verifikasi

`npm run build` (typecheck + `verify:content` + bundle) lolos. Skrip Node terpisah mengonfirmasi 0 id topik Speaking yang tabrakan lintas SEMUA level (53 topik total lintas 6 level). Diuji live (Playwright + Chromium headless, mic di-mock): daftar materi Speaking Achiever menampilkan **10 materi** (bukan lagi 1); SEMUA 10 topik berhasil dibuka tanpa error; topik baru `tempat-favorit-di-kota` diuji sampai Latihan Inti (transkrip COCOK persis dgn kalimat komparatif "The museum is more interesting than the mall." menampilkan ⭐⭐⭐/100%/"Awesome! 🎉" [praise Inggris, sesuai level Achiever]/Play Suaramu) & Tantangan (roleplay menampilkan pertanyaan preferensi "What is your favorite place in town?" dgn benar). 0 console/page error di seluruh alur.

### 14.4 Status Setelah Sesi Ini

**Achiever SEKARANG 10/10 topik — target ≥10/skill TERCAPAI, level Speaking KELIMA yang mencapai ini.** SEMUA 5 level di bawah Trailblazer (Little Stars/Starter/Explorer/Adventurer/Achiever) sekarang capai target, DAN masing² kontennya genuinely NAIK TANGGA (recognize/imitate/recall → deskripsi tunggal → deskripsi+kata-sifat+alasan → opini+perbandingan+preferensi) — bukan cuma jumlah topik yang bertambah rata di semua level. **Trailblazer (1/10, `rencana-masa-depan`) satu-satunya level Speaking yang masih di bawah target** — beda dari 5 level lain, genapkan-nya BUKAN kerja data biasa (format `SpeakingInterviewTopic` py struktur `turns`/`peerName` yang lebih rumit dari `model`/`drill`/`roleplay`), jadi kalau diminta lanjut, effort per-topiknya akan lebih besar dari 5 sesi sebelumnya.

---

## 15. Sesi 8 — Trailblazer Digenapkan ke 5/5 Topik (Target ≥5 KHUSUS Level Ini TERCAPAI)

Permintaan user: "lakukan serupa untuk level Trailblazer" (lanjutan langsung dari Achiever, pola sama "genapkan level berikutnya" sesi 3-7). **Beda krusial dari sesi 3-7**: target Trailblazer BUKAN ≥10 topik spt 5 level lain — CLAUDE.md "🎯 Target Kelengkapan Konten per Modul" poin 1 secara EKSPLISIT mengunci Trailblazer di **≥5 topik/skill** (revisi resmi user dari default lama "1-2 modul preview", TAPI SENGAJA tidak disamakan penuh ke 10 spy tetap terasa "jalur bonus", bukan level utama). Sebelum menulis konten, dicek dulu angka target yang BENAR (bukan diasumsikan ≥10 spt level lain) — kalau tidak dicek, resikonya menggenapkan ke 10 topik padahal targetnya cuma 5 (over-engineering di luar scope yang diminta user).

### 15.1 Tidak Ada Riset Baru — Format & Prinsip Sudah Mapan dari Sesi 2

Beda dari sesi 6/7 (yang masing² butuh riset kurikulum baru utk memvalidasi PERGESERAN kompleksitas konten), sesi ini TIDAK perlu riset tambahan — format `SpeakingInterviewTopic` & prinsip "Bima menjawab dulu, baru giliran anak" sudah divalidasi penuh di sesi 2 (Cambridge KET→PET interview antar-kandidat, `materi/speaking.md` §9). Kerja sesi ini murni: (a) pilih 4 tema PET Speaking Part 1 yang genuinely umum & belum dipakai topik Vocab/Listening Trailblazer manapun, (b) tulis giliran tanya-jawab baru dgn pola yang SAMA persis dgn `rencana-masa-depan`.

### 15.2 Implementasi: 4 Topik Baru, Trailblazer Sekarang 5/5

Digenapkan LANGSUNG ke `SPEAKING_TOPICS_TRAILBLAZER` (array yang sama, `rencana-masa-depan` TIDAK diubah):

| # | id | Title | Tema PET Speaking Part 1 |
|---|---|---|---|
| 1 | `rencana-masa-depan` | *(sudah ada)* | Personal Feelings/Opinions-adjacent |
| 2 | `akhir-pekanku` | Akhir Pekanku (My Weekend) | Free Time & Leisure |
| 3 | `olahraga-kesehatan` | Olahraga & Kesehatan (Sports & Health) | Health & Exercise |
| 4 | `arti-persahabatan` | Arti Persahabatan (The Meaning of Friendship) | Personal Relationships |
| 5 | `tempat-tinggalku` | Tempat Tinggalku (Where I Live) | Places/Home Town |

Keputusan authoring:

- **4 tema dipilih krn genuinely UMUM di PET Speaking Part 1 asli** (perkenalan personal — weekend, olahraga, pertemanan, tempat tinggal SEMUA pertanyaan standar interview KET/PET) DAN belum dipakai topik Vocab/Listening Trailblazer manapun (yang sudah pakai: Travel & Tourism, Language, Services, Shopping, Education, Entertainment/Media, Personal Feelings/Opinions [lewat buku, bukan lewat weekend/olahraga], Places/Town [lewat cari kafe, bukan lewat rumah sendiri], Environment, Work) — sudut yg dipakai di sini genuinely beda dari yg sudah ada walau kategori besarnya bisa terdengar mirip (mis. "Places" Listening = "cari kafe baru di kota", "Places" Speaking di sini = "ceritakan tempat tinggalmu sendiri" — angle personal vs angle transaksional).
- **`arti-persahabatan` topik PALING OPINI-BERAT** (5 dari 8 giliran eksplisit minta pendapat: "What makes a good friend?", "Is it important to have many friends or a few?", "What do you think about making friends online?") — cocok utk Trailblazer (12+) yg per riset sesi 7 (Kurikulum Merdeka Fase D) sudah py landasan resmi utk opini/pendapat matang.
- **`peerName` KONSISTEN "Bima" di SEMUA 5 topik** (bukan karakter baru tiap topik) — anak jadi terbiasa dgn "1 teman ngobrol tetap" sepanjang level ini, bukan variasi karakter yang tidak perlu.
- Semua 4 topik baru pakai 8 giliran (sama scale dgn `rencana-masa-depan`), pola SAMA PERSIS (Bima jawab dulu + alasan "because"/opini, baru giliran anak) — TIDAK ada eksperimen struktur baru, murni genapkan data dgn pola yang sudah terbukti.
- Tidak ada perubahan `types.ts`/`games/speaking.ts`/`app.ts`/`games/boss.ts` — format `SpeakingInterviewTopic` sudah generik sejak sesi 2, konten baru otomatis jalan tanpa kerja tambahan.

### 15.3 Verifikasi

`npm run build` (typecheck + `verify:content` + bundle) lolos. Skrip Node terpisah mengonfirmasi 0 id topik Speaking yang tabrakan lintas SEMUA level (**57 topik total lintas 6 level**). Diuji live (Playwright + Chromium headless, mic di-mock): daftar materi Speaking Trailblazer menampilkan **5 materi** (bukan lagi 1); topik baru `arti-persahabatan` diuji penuh — Kenalan & Latihan Inti menampilkan jawaban Bima SEBELUM mic anak (scaffold, sesuai desain), mic anak menghasilkan "Kamu jawab: ..."+Play Suaramu+"Fantastic! 🌟" (praise Inggris, TANPA skor — sesuai desain jawaban personal), Tantangan MENYEMBUNYIKAN jawaban Bima default dgn "💡 Dengar Contoh Bima" tersedia. 0 console/page error di seluruh alur.

### 15.4 Status Setelah Sesi Ini

**Trailblazer SEKARANG 5/5 topik — target ≥5/skill (KHUSUS level ini) TERCAPAI.** Dengan ini, **SEMUA 6 LEVEL SPEAKING sudah mencapai target kelengkapan kontennya masing-masing** — Little Stars/Starter/Explorer/Adventurer (masing² ≥10), Achiever (≥10, konten opini+perbandingan), Trailblazer (≥5, konten interview 2-kandidat). Speaking adalah skill PERTAMA di app ini yang mencapai status ini secara utuh di seluruh 6 level (Vocabulary & Listening juga sudah tuntas di semua level, tapi Trailblazer keduanya masih dikunci di target LAMA "1-2 modul" belum direvisi retroaktif — beda dari Speaking & Reading yang SUDAH ikut target BARU ≥5). Gap yang tersisa (kalau ada sesi lanjutan) murni perluasan LEBIH JAUH dari target minimum, bukan lagi menutup kekosongan dasar.

---

## 16. Sesi 9 — Format KEEMPAT `SpeakingStoryTopic`: Pilot Explorer (Audit "Semua Format Terasa Sama")

### 16.1 Audit User

Setelah 8 sesi menggenapkan konten di seluruh 6 level, user mengaudit Kenalan/Latihan Inti/Tantangan Speaking secara langsung: *"exercises are all basically the same"* — dan mengusulkan contoh konkret sendiri: cerita mini teks+gambar dgn 1 fakta pengecoh, diikuti pertanyaan komprehensi ("Andi likes dogs, and Andi has a cat. What does Andi have?"). Diagnosis: 3 format Speaking (`SpeakingTopic` lama, `SpeakingPhraseTopic`, `SpeakingInterviewTopic`) SEMUANYA menguji "ucapkan frasa/kalimat target", cuma beda level scaffold (Recognize→Imitate→Recall/Interview) — TASK SHAPE-nya tidak pernah berubah dari "dengar lalu tirukan/produksi". Tidak ada satu pun yang menguji comprehension+extraction (baca cerita, pilah fakta relevan, jawab pertanyaan) sebelum berbicara.

### 16.2 Desain: Reuse Pola Listening/Reading `story`+`question`, Dipindah ke Jalur SUARA

Bukan riset eksternal baru — solusinya REUSE pola `story: string[]` + `question` yang SUDAH battle-tested di `ListeningTopic`/`ReadingTopic` (`content.ts`, mis. topik `pesta-ulang-tahunku`/`di-dapur`), dipindah ke `SpeakingStoryItem` BARU (types.ts) supaya cerita+jawabannya berdiri sendiri (`SpeakingStoryTopic.stories`). Beda kunci dari precedent-nya: jawaban pertanyaan diucapkan lewat MIC (`wordMatchDetail` proporsional + Play Suaramu), bukan ditap dari opsi gambar — inilah yang genuinely membuat task shape-nya beda dari Listening/Reading (comprehension via SUARA), sekaligus beda dari 3 format Speaking lain (comprehension DULU, produksi belakangan — bukan produksi/echo semata).

**3 langkah, comprehension naik bertahap:**
1. **Kenalan** (`renderKenalanStory`) — daftar SEMUA cerita, TIGA aksi per cerita: 🔊 dengar cerita+pertanyaan berurutan, 🎤 coba ucapkan jawabannya, 🎮 main (1 soal dengar&pilih-jawaban fokus cerita itu). 🔒 **Revisi §16.6** — versi pertama SENGAJA TANPA mic/main (exposure murni), TAPI direvisi lagi krn permintaan user eksplisit "tetap tambahkan button sound, mic dan play" — lihat §16.6.
2. **Latihan Inti "📖 Baca & Jawab"** (`runLatihanIntiStory`) — cerita+pertanyaan+JAWABAN SELALU kelihatan (scaffold penuh, echo) — anak baru diminta ucapkan jawaban yang sudah tertulis.
3. **Tantangan "🕵️ Cerita & Jawab Sendiri"** (`runTantanganStory`) — jawaban DISEMBUNYIKAN (cerita+pertanyaan tetap kelihatan, krn skill yg diuji adalah memilah fakta, bukan menghafal cerita) — anak menyusun+mengucapkan jawaban SENDIRI. Jawaban kanonis SELALU diungkap SESUDAH mic (apa pun skornya, non-punitive).

Skor `scoreMic()`/Play Suaramu di Latihan Inti & Tantangan REUSE PERSIS helper yg sudah ada di `games/speaking.ts` (comply penuh Aturan Wajib Speaking CLAUDE.md). Bullet-progress (`quizNavHtml`/`getSlot`/`markSlotAnswered`/`setSectionCursor`) ikut pola granular yg sudah ada di format KEDUA/KETIGA file ini — urutan cerita TETAP (tidak diacak, sama alasan `runLatihanIntiInterview`: makna "cerita ke-N" stabil), jadi tanpa `ensureSection`/plan seperti format KEDUA.

### 16.3 Implementasi

- **`types.ts`**: `SpeakingStoryLine`/`SpeakingStoryItem`/`SpeakingStoryTopic` BARU; `AnySpeakingTopic` diperlebar jadi union 4 (`SpeakingTopic | SpeakingPhraseTopic | SpeakingInterviewTopic | SpeakingStoryTopic`).
- **`content.ts`**: `SPEAKING_TOPICS` (Explorer) diperlebar tipenya jadi `AnySpeakingTopic[]`, ditambah **1 topik pilot** `cerita-dan-jawab` (5 cerita, cerita pertama pakai contoh user sendiri verbatim: "Andi likes dogs."/"Andi has a cat."/"What does Andi have?") — Explorer sekarang **11 topik** (10 format lama + 1 format baru, MIXED dalam array yang sama — pola baru: format berbeda bisa hidup di array level yg sama, krn dispatch selalu per-topik lewat `in` checks, bukan per-level).
- **`games/speaking.ts`**: 3 fungsi baru (`renderKenalanStory`/`runLatihanIntiStory`/`runTantanganStory`) ditambahkan di akhir file, reuse helper generik yg sudah ada (`scoreMic`/`roundActionsHtml`/`quizNavHtml`/`wireQuizNav`).
- **`app.ts`**: dispatcher `runStage`(`case 'speaking'`) & `runFreePlayRound` dapat cabang `'stories' in topic` baru, dicek SETELAH `'items'`/`'turns'`, SEBELUM fallback format lama.
- **`games/boss.ts`**: adapter `speakPhrases` (Tantangan Bos) dapat cabang `'stories' in t ? t.stories.map(s => s.answer.en) : ...` — jawaban kanonis tiap cerita diratakan jadi "phrase" gauntlet biasa, konsisten pola adapter format KEDUA/KETIGA.
- **Tidak ada perubahan `progress.ts`/`topicProgressPercent`** — skill `'speaking'` TIDAK punya cabang granular sama sekali (semua 4 format jatuh ke fallback `isStepVisited`, keputusan lama yg sudah konsisten lintas format KEDUA/KETIGA — mic score sengaja tidak masuk akurasi).

### 16.4 Verifikasi

`npm run build` (typecheck + `verify:content` + bundle) lolos bersih. Diuji live (Playwright + Chromium headless, `SpeechRecognition`+`getUserMedia` di-mock via `--use-fake-device-for-media-stream`, login+level di-mock via `localStorage`, navigasi langsung ke `/aktivitas?skill=speaking&topic=10&level=explorer`): Kenalan menampilkan **5 cerita, 0 tombol mic** (sesuai desain); Latihan Inti menampilkan jawaban target SEBELUM mic, skor 3 bintang/100% match utk ucapan cocok, quiz-dot 5 titik & lompat soal berfungsi; Tantangan **MENYEMBUNYIKAN jawaban SEBELUM percobaan** (dikonfirmasi false) lalu **MENGUNGKAP SESUDAHNYA** (dikonfirmasi true), skor+Play Suaramu tampil. 0 console/page error di seluruh alur.

### 16.5 Status Setelah Sesi Ini — PILOT, Belum Rollout Penuh

Ini SATU topik di SATU level (Explorer 11/10, sudah lewat target dgn pilot ini) — belum diperluas ke level/topik lain. Rollout lebih lanjut (topik `cerita-dan-jawab` tambahan di level lain, atau menambah cerita baru ke topik yg sudah ada) menunggu feedback user thd pilot ini dulu, bukan diasumsikan otomatis disetujui.

### 16.6 Revisi Langsung — Kenalan Diberi Balik Mic+Main ("tetap tambahkan button sound, mic dan play")

Segera setelah pilot §16.1–§16.5 dilaporkan, user meminta: *"tetap tambahkan button sound, mic dan play di section kenalan reading"* — maksudnya Kenalan format ini (disebut "reading" krn teksnya "Baca ceritanya, lalu tap 🔊 buat dengar"), minta 3 aksi standar 🔊/🎤/🎮 ("sound"/"mic"/"main"="play") ditambahkan JUGA di sini, menyamakan dgn konvensi Kenalan SEMUA format lain (Vocab, Listening, Reading Format KEDUA, Speaking Format KEDUA `renderKenalanPhrase`) — jadi keputusan desain "Kenalan sengaja tanpa mic" di §16.2 poin 1 DIBATALKAN, bukan lagi berlaku.

**Implementasi** (`renderKenalanStory`, `games/speaking.ts`):
- Tiap baris cerita SEKARANG py 3 tombol `mini-play`: 🔊 (`playStory`, sama seperti sebelumnya, TTS berurutan), 🎤 (`micStory`, hanya muncul kalau `sttSupported`), 🎮 (`gameStory`).
- **🎤 mic** — target skornya `story.answer.en` (kalimat jawaban cerita itu, SATU-SATUNYA "target tertutup" yg dipunyai tiap cerita — beda dari format KEDUA/KETIGA yg py 1 frasa/giliran per baris) — REUSE PERSIS `openMicResultPopup` dari `renderKenalanPhrase`: popup skor proporsional (`scoreMic`) + word-diff + "▶️ Play Suaramu" + Coba Lagi/Lanjut, comply penuh Aturan Wajib Speaking.
- **🎮 Main "Dengar & Jawab"** (`runStoryMiniGame`, BARU) — dengar cerita+pertanyaan (auto-play + "🔊 Dengar" replay), pilih jawaban TEKS yang cocok dari 4 kartu (`answerCardsHtml`) — opsi = jawaban cerita ini + 3 distraktor dari jawaban cerita LAIN di topik yang sama (`buildStoryAnswerOptions`, pola sama `buildPhraseOptions`), REUSE PERSIS shape `runPhraseMiniGame`. Ini soal MCQ objektif (beda dari mic) — panggil `recordAttempt()` seperti mini-game format lain.
- `hasWordInteraction`/`markWordInteraction` dipakai per baris (index cerita, bukan kata) — badge "done" ijo begitu 1 dari 3 aksi ditap, konsisten pola Vocab/Reading/Speaking Format KEDUA.
- **`app.ts`**: `renderKenalanStory` sekarang butuh parameter `level: LevelKey` (utk `pickPraise`/`pickEncourage` di popup mic & mini-game) — call site `runStage`(`case 'speaking'`, step 0) diupdate kirim `praiseLevel`.
- **Latihan Inti/Tantangan TIDAK diubah** — mic di Kenalan ini SEKADAR latihan awal opsional/non-gating (anak boleh coba jawaban lebih dulu di sini), Latihan Inti (echo, jawaban kelihatan) & Tantangan (ekstraksi, jawaban disembunyikan) TETAP jadi progresi utama yg genuinely beda task shape — audit user "semua terasa sama" itu soal Latihan Inti/Tantangan yg IDENTIK antar 3 format lain, BUKAN soal Kenalan py mic atau tidak. Menambahkan mic di Kenalan TIDAK membalikkan perbaikan itu.

**Verifikasi**: `npm run build` lolos bersih. Diuji live (Playwright, mic+STT di-mock, level explorer): 5 tombol 🔊 + 5 tombol 🎤 + 5 tombol 🎮 muncul di daftar Kenalan; tap 🎤 memunculkan popup skor 3 bintang + Play Suaramu; tap 🎮 membuka mini-game 4 opsi, jawab lalu balik ke daftar Kenalan dgn benar. 0 console/page error.

### 16.7 Audit — "Kalimat Soal Tidak Boleh 100% Sama" (CLAUDE.md), Ketemu 4 Duplikat di Pilot

Permintaan user: audit modul Speaking thd aturan CLAUDE.md "🔒 Kalimat Soal di Kenalan/Latihan Inti/Tantangan Tidak Boleh 100% Sama (Duplicate) dalam 1 Topik". `app/scripts/verify-content-duplicates.mjs` (skrip otomatis yang sudah ada) TERNYATA scoped HANYA ke 4 format LAMA (`ListeningTopic`/`ReadingTopic`/`SpeakingTopic`/`GrammarTopic`) — `SpeakingStoryTopic` (format KEEMPAT, §16) BELUM py cabang deteksi sama sekali, padahal strukturnya (per-cerita py `lines`/`question`/`answer` diauthor TERPISAH) py risiko struktural yang SAMA dgn 4 format lama itu.

**Ditambahkan cabang baru** `checkSpeakingStoryDuplicates()` — dicek PER CERITA (bukan digabung 1 topik spt `checkTopics` existing, supaya 2 cerita BEDA dlm 1 topik yang kebetulan pakai kata mirip tidak salah kena flag): `story.answer.en` tidak boleh 100% sama persis (verbatim, case+tanda-baca-insensitive) dgn salah satu `story.lines[].en`.

**Hasil**: 4 dari 5 cerita `cerita-dan-jawab` (Explorer) GAGAL — `answer` verbatim sama dgn salah satu `lines` (cerita #2 "Rani"/tas dari awal SUDAH benar, jadi pola acuan perbaikannya). Diperbaiki dgn parafrase (makna sama, kata beda, TANPA ubah `lines`/`question`/logic):

| Cerita | `answer` lama | `answer` baru |
|---|---|---|
| #1 Andi/kucing | "Andi has a cat." (= `lines[1]`) | "The pet is a cat." |
| #3 Budi/jerapah | "Budi feeds a giraffe." (= `lines[1]`) | "The animal is a giraffe." |
| #4 Sari/basket | "Sari plays basketball." (= `lines[1]`) | "The sport is basketball." |
| #5 Dimas/nasi | "Dimas eats rice for dinner." (= `lines[1]`) | "The dinner food is rice." |

Terjemahan Indonesia (`id`) ikut diparafrase senada ("Peliharaannya kucing.", dst) — bukan cuma versi Inggrisnya. `npm run verify:duplicates` sekarang 0 pelanggaran utk Speaking (SEMUA format: LAMA/KEDUA/KETIGA/KEEMPAT).

**Temuan terpisah, DI LUAR SCOPE audit ini** (dilaporkan jujur, bukan diam-diam dianggap beres) — sesi lain (paralel) memperkuat `norm()` skrip yang sama (strip tanda baca) yang jadi mengungkap **46 duplikat PRE-EXISTING di Grammar** (format LAMA Adventurer/Achiever, pola `examples` yang direkonstruksi ulang persis jadi `scramble`/`fill`) — TIDAK disentuh sesi ini krn scope eksplisit user "modul speaking" saja. **Update**: sesi paralel itu sudah menutup gap-nya sendiri belakangan — `npm run verify:duplicates`/`npm run build` project HIJAU lagi sejak §17 di bawah.

---

## 17. Sesi 10 — Trailblazer Digenapkan Lagi ke 10/10 (Permintaan Eksplisit User "min 10") + Audit 5 Topik Lama

Permintaan user: *"tambahkan 5 materi speaking untuk level trailblazer dan audit apakah 5 materi saat ini sudah sesuai"* — DUA bagian: (a) audit 5 topik EXISTING (§15) thd rule compliance, (b) tambah 5 topik baru. **🔒 DEVIASI SADAR dari target BAKU Trailblazer (≥5, BUKAN ≥10)** — preseden SAMA PERSIS dgn Listening Trailblazer (`materi/listening.md`) & Grammar Trailblazer (`materi/grammar.md`) yang sama-sama sempat 5/5 lalu digenapkan ke 10/10 atas permintaan eksplisit user "min 10" — CLAUDE.md "Target Kelengkapan Konten per Modul" poin 1 TETAP menyebut target BAKU Trailblazer ≥5 (bukan target ini dicabut), tapi instruksi eksplisit user di SESI INI mengalahkan target baku itu utk skill ini, sama alasan 2 preseden di atas.

### 17.1 Audit 5 Topik Existing (§15) — HASIL: Bersih, Tidak Ada Perbaikan Diperlukan

Dicek terhadap SEMUA aturan wajib yang relevan:
- **Kid-friendly filter** (CLAUDE.md) — kelima topik (`rencana-masa-depan`/`akhir-pekanku`/`olahraga-kesehatan`/`arti-persahabatan`/`tempat-tinggalku`) hangat, personal, aspiratif — tidak ada tema gelap/menakutkan. ✅
- **"Kalimat Soal Tidak Boleh 100% Sama"** (CLAUDE.md, audit §16.7 sebelumnya sudah cek SELURUH `SpeakingInterviewTopic` lintas level, TERMASUK 5 topik ini) — dicek ulang khusus scope 5 topik ini: `question` vs `peerAnswer` per giliran, DAN antar-giliran dalam 1 topik (skrip ad-hoc, esbuild import `content.ts` asli) — **0 tabrakan**. ✅
- **Format/mekanik** (`SpeakingInterviewTopic`, dispatch `app.ts`/`games/boss.ts`) — sudah diverifikasi generik di audit sesi sebelumnya (jawaban §"apakah modul speaking sesuai tabel"), 5 topik ini otomatis ikut lewat cabang `'turns' in topic`. ✅
- **`peerName`/jumlah giliran** — kelimanya konsisten `peerName: 'Bima'`, 8 giliran/topik. ✅
- **Id topik unik lintas SEMUA level Speaking** (progress key `${skill}:${topicId}:${section}` TANPA level) — dicek ulang, 0 tabrakan. ✅

**Kesimpulan**: 5 topik existing SUDAH SESUAI di semua sumbu yang dicek — TIDAK ada perbaikan konten yang diperlukan, murni tinggal digenapkan jumlahnya.

### 17.2 5 Topik Baru — Riset Domain, Format APA ADANYA (Reuse `SpeakingInterviewTopic`)

TIDAK ada riset eksternal baru dibutuhkan — format+pola SUDAH mapan sejak §9 (interview simulasi via peer fiktif "Bima", scaffold penuh di Latihan Inti lalu independen di Tantangan). Kerja sesi ini murni AUTHORING DATA: pilih 5 domain PET Speaking Part 1 yang genuinely umum & BELUM dipakai topik Speaking manapun di Trailblazer (dicek silang thd domain Vocab/Listening/Reading/Grammar Trailblazer juga, supaya tetap terasa beda modalitas walau kadang domain sedikit overlap lintas SKILL — itu pola yang sudah diterima, mis. "travel" dipakai Vocab DAN Listening Trailblazer dgn treatment beda):

| Topik baru | Domain | Kenapa dipilih |
|---|---|---|
| `sekolah-pelajaran` | Sekolah & Pelajaran (School & Studies) | PET Part 1 standar, belum dipakai Speaking (Vocab py `pendidikan-akademik`, Reading py `wawancara-radio-sekolah` — treatment beda: vocab kata, reading baca-cerita, sini interview lisan) |
| `musik-dan-film` | Musik & Film (Music & Movies) | PET Part 1 standar, belum dipakai Speaking (Listening py `pilih-film`/`pendapat-tentang-buku` sbg dialog dgn distraktor, BUKAN interview personal) |
| `makanan-favoritku` | Makanan Favoritku (My Favorite Food) | Domain SEGAR — belum dipakai skill manapun di Trailblazer sama sekali |
| `teknologi-media-sosial` | Teknologi & Media Sosial (Technology & Social Media) | PET Part 1 umum utk remaja 12+, belum dipakai Speaking Trailblazer (Achiever py topik teknologi SENDIRI di level BEDA, bukan tabrakan) |
| `hari-libur-tradisi-keluarga` | Hari Libur & Tradisi Keluarga (Holidays & Family Traditions) | Beda ANGLE dari Listening `rencana-liburan` (perencanaan) & Reading `liburan-yang-berubah` (narasi) — di sini fokus tradisi keluarga+opini pribadi |

Semua 5 topik baru pakai 8 giliran (sama scale dgn 5 topik lama), pola SAMA PERSIS (Bima jawab dulu + alasan "because"/opini "I think"/"In my opinion", baru giliran anak) — `peerName` KONSISTEN "Bima". Tidak ada perubahan `types.ts`/`games/speaking.ts`/`app.ts`/`games/boss.ts` — format `SpeakingInterviewTopic` sudah generik, konten baru otomatis jalan.

### 17.3 Verifikasi

`npm run build` (typecheck + `verify:content` + `verify:duplicates` + bundle) lolos bersih. Skrip ad-hoc (esbuild import `content.ts` asli) mengonfirmasi: 10 topik total, masing² 8 giliran, `peerName` konsisten "Bima", 0 id topik Speaking yang tabrakan lintas SEMUA level, 0 tabrakan `question`/`peerAnswer` di 5 topik baru. Diuji live (Playwright + Chromium headless, level `trailblazer`): Menu Belajar Speaking menampilkan **10 materi** (bukan lagi 5); topik baru `sekolah-pelajaran` (index 5) & `hari-libur-tradisi-keluarga` (index 9, topik TERAKHIR) diuji penuh — Kenalan menampilkan daftar giliran+jawaban Bima dgn benar, Latihan Inti menampilkan quiz-dot 8 titik & giliran pertama dgn benar. 0 console/page error.

### 17.4 Status Setelah Sesi Ini

**Trailblazer Speaking sekarang 10/10 topik** — melebihi target BAKU (≥5), atas instruksi eksplisit user, preseden sama dgn Listening & Grammar Trailblazer yang sudah lebih dulu di 10/10. **SEMUA skill yang py Trailblazer 10/10 sekarang**: Listening, Grammar, Speaking. Vocab/Reading Trailblazer TETAP di target baku (5/5) — belum ada instruksi baru utk menggenapkan keduanya, JANGAN "genapkan" tanpa arahan scope baru dari user (CLAUDE.md "Target Kelengkapan Konten per Modul" poin 1 TETAP berlaku sbg default utk skill yang belum disentuh instruksi "min 10").

---

## Sumber Riset Web (Sesi 1–8)

### Institusi Bahasa Inggris Indonesia
- LIA GEVYL: https://lblia.com/kursus-bahasa-inggris-anak/
- EF Indonesia / English1 Small Stars: https://english1.co.id/smallstars · https://english1.co.id/program/smallstars/
- EF Indonesia / English1 High Flyers (7–9 th): https://english1.co.id/highflyers · https://english1.co.id/program/highflyers/
- EF Indonesia / English1 Trailblazers (10–14 th): https://english1.co.id/program/trailblazers/ · https://english1.gimana.how/trailblazers/
- Kumon Indonesia EFL: https://id.kumonglobal.com/english-efl/
- Kumon EFL urutan topik per level (7A/6A/5A): https://pdfcoffee.com/kumon-table-of-learning-materials-7a-2a-pdf-free.html · https://sites.google.com/brac.net/kumon-efl-program/kumon-english-program
- Kurikulum Merdeka Fase A kelas 1-2 SD, urutan 13 unit + tema deskripsi keluarga: https://golden-course.com/materi-bahasa-inggris-kelas-2-sd-kurikulum-merdeka/
- LIA GEYL (6-12 th) eksplisit "role-playing" sbg metode inti: https://lbliakalideres.com/general-english-for-young-learners/ · https://liasemarang.com/programs/untuk-siswa-sd/english-for-chidren-ec/
- Kurikulum Merdeka Fase C kelas 5-6 SD, deskripsi gambar + kata sifat: https://www.modulguruku.com/2023/07/modul-ajar-bahasa-inggris-kelas-5-sd-fase-c.html
- Kurikulum Merdeka Fase D kelas 7-9 SMP, opini/perbandingan/preferensi: https://www.pembelajaranmendalam.com/2025/12/cp-bahasa-inggris-fase-d-smp-mts-kelas-7-8-9-semester-1-2-kurmer-pm-terbaru.html

### Kurikulum Merdeka
- https://www.paud.id/capaian-pembelajaran-paud-kurikulum-merdeka/

### Cambridge YLE / KET / PET Speaking
- Starters: https://englishspeakingtest.com/a1-starters-speaking-test.html · https://exam-seekers.com/2021/06/14/ee-026c-yle-pre-a1-starters-speaking-exam/
- Movers: https://flyer.us/a1-cambridge-movers-exam-format/ · https://www.cambridgeenglish.org/exams-and-tests/qualifications/young-learners/paper/movers/format/
- Flyers: https://flyer.us/achieve-5-shields-in-the-cambridge-flyers-speaking-test/ · https://www.cambridgeenglish.org/exams-and-tests/flyers/test-format/
- A2 Key (KET) / B1 Preliminary (PET): https://engxam.com/cambridge-english-exams/a2-key-ket/ · https://kseacademy.com/en/cambridge/b1-preliminary-pet/speaking/

### Kompetitor Internasional (speaking/pronunciation apps)
- https://lingopie.com/blog/best-language-learning-apps-for-kids/ · https://preply.com/en/blog/best-language-apps-for-kids/
- https://www.51talk.com/articles/does-an-app-harm-child-pronunciation/
- https://elsaspeak.com/en/product-learn-english-elsa-speak/
- https://www.unite.ai/buddy-ai-children-language-learning-speech-recognition/
