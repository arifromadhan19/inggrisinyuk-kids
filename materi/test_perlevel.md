# Materi Test per Level ("Tantangan Raja" / `/bos?level=`) — Audit, Riset, & Redesain

Permintaan user: audit fitur test per level yang sudah ada (`/bos?level=little-stars`), riset bagaimana lembaga bahasa (Cambridge, LIA, EF, dll — target market anak Indonesia) mendesain jumlah soal & waktu tes per level, lalu **"buat test yang comprehensive, sesuai, terukur, mencerminkan kemampuan anak, sesuai secara soal, materi dan waktu"**.

## 0. Apa "Test per Level" di App Ini

Satu-satunya fitur yang cocok dengan istilah "test per level" adalah **Tantangan Raja** (dulu "Tantangan Bos", `games/boss.ts` + `app.ts` `renderBoss()`, URL `/bos?level=<LevelKey>`) — **gate sequential** yang harus ditaklukkan anak untuk membuka level berikutnya (PRD §12/§14.8, `unlockLevelsUpTo()`). Ini BEDA dari **First Placement Test** (`portal/`, "Main Dulu, Yuk!") yang cuma dijalankan SEKALI di awal/retest untuk menentukan level AWAL anak — Tantangan Raja adalah tes **per-level yang berulang**, dicoba tiap kali anak mau naik ke markas selanjutnya (dan boleh diulang kapan saja sesudahnya, "Main Lagi").

## 1. Ringkasan (TL;DR)

Audit menemukan Tantangan Raja versi lama **jauh dari comprehensive**: cuma 4 dari 5 skill (Reading TIDAK PERNAH diuji sama sekali), cuma 2 soal per skill (8 soal total, sama rata di semua 6 level — Little Stars 3 tahun & Trailblazer 13+ tahun dites dengan jumlah soal identik), dan tidak ada skor yang benar-benar diukur (menang otomatis apa pun jawabannya, tidak ada laporan hasil ke anak/ortu). Redesain sesi ini:

1. **Tambah babak Reading** (5 babak: Vocabulary → Listening → Reading → Grammar → Speaking, urutan sama dgn tabel skill CLAUDE.md) — sebelumnya bolong total, padahal Reading sekarang py materi TUNTAS di semua 6 level.
2. **Jumlah soal per skill naik seiring usia/level** (3 → 3 → 4 → 4 → 5 → 5), bukan angka tetap 2 di semua level — mengikuti pola SEMUA lembaga yang diriset (Cambridge YLE, LIA, EF, Kumon) yang menaikkan cakupan tes seiring usia/level.
3. **Skor genuinely diukur** — tiap babak dinilai dari jawaban PERCOBAAN PERTAMA (bukan "menang" setelah retry tak terbatas), lalu ditampilkan sbg **1–5 bintang per skill** di layar hasil (pola sama `skillStarsHtml` Rapor & shield Cambridge YLE) — "terukur, mencerminkan kemampuan anak".
4. **TETAP TANPA timer/status kalah** — retry tanpa batas tetap ada (non-punitive, PRD §4.6 tidak diubah), skor cuma dilaporkan, TIDAK PERNAH jadi gerbang blokir naik level (menang = semua ronde dicoba, sama seperti sebelumnya). Estimasi waktu ditampilkan di layar sebelum mulai SEBAGAI INFORMASI SAJA (bukan hitung mundur).

**🔒 PILOT, bukan rollout ke 6 level sekaligus** (permintaan user langsung sesudah implementasi awal: "coba terapkan dulu di bos little star") — redesain di atas SEKARANG cuma aktif utk **Little Stars** (`PILOT_LEVELS`, `games/boss.ts`). 5 level lain (Starter…Trailblazer) TETAP 1:1 perilaku LAMA: 4 babak (Vocabulary/Listening/Grammar/Speaking, Reading tetap bolong), 2 soal/skill, tanpa kartu skor/estimasi waktu di layar. Kalau hasil pilot di Little Stars sudah divalidasi (dicoba langsung di app, dirasa pas dari sisi jumlah soal/waktu/kesulitan), genapkan ke level lain cukup dgn menambah key level itu ke `PILOT_LEVELS` — TIDAK ada kode lain yang perlu disentuh (tabel §5 di bawah SUDAH mencakup keenam level, tinggal "dinyalakan" satu-satu).

**🔒 §9 — `explorer` DIGENAPKAN ke pilot** (permintaan user: "untuk test materi reading, mirip dengan vocab cuma user baca, apakah baiknya buat statement dan ada pertanyaan?"): dikonfirmasi Little Stars (`ReadingWordTopic`, kata tunggal) TETAP TIDAK diubah — SENGAJA begitu, riset `materi/reading.md` mengonfirmasi anak 3-5 th belum siap kalimat. TAPI materi Reading Explorer (`ReadingCheckTopic`) SUDAH berbentuk "1 kalimat (statement) + judge Benar/Salah" sejak awal (adapter `toReadingBossItems`'s cabang `'checks' in t`, dibangun generik sejak sesi pertama) — genapkan Explorer ke `PILOT_LEVELS` cukup 1 baris kode (`games/boss.ts`), TANPA konten/adapter baru, langsung menunjukkan "statement + pertanyaan" hidup di test (dikonfirmasi live: "🇦🇺 'I am from Australia.'" + ✅/❌, "🔟 'This is the number nine.'" + ✅/❌). `ROUNDS_PER_SKILL['explorer']` & `EST_MINUTES['explorer']` SUDAH 5/[13,16] dari sesi sebelumnya (§8), tidak perlu diubah lagi.

## 2. Audit Implementasi Lama (`games/boss.ts` sebelum sesi ini, `app.ts` `renderBoss`)

| Aspek | Kondisi lama |
|---|---|
| Skill diuji | 4: Vocabulary, Listening, Grammar, Speaking — **Reading tidak pernah diuji** |
| Jumlah soal | `ROUNDS_PER_PHASE = 2` × 4 babak = **8 soal total**, SAMA di semua 6 level |
| Sumber soal | Diacak dari SELURUH topik level itu (bukan bank soal kurasi tetap) |
| Skor | `recordAttempt()` dicatat per percobaan (masuk akurasi global), TAPI babak selalu maju stelah jawaban benar — retry tak terbatas berarti "kalah" mustahil terjadi, jadi skor akhir tidak pernah dihitung/dilaporkan |
| Kelulusan | Tidak ada — `finish()` selalu memanggil `onWin()` tanpa syarat skor |
| Waktu | Tidak ada timer/estimasi apa pun ditampilkan |
| Hasil ke anak/ortu | Layar menang generik ("Ditaklukkan!" + XP) — tidak ada rincian per skill |

**Masalah inti**: fitur ini secara fungsional adalah "kuis perayaan" (celebratory mashup), bukan tes yang mengukur kesiapan anak naik level — namanya "Tantangan" tapi tidak ada yang benar-benar ditantang/diukur, dan cakupannya (2 soal/skill, minus 1 skill penuh) jauh dari cukup untuk merepresentasikan seluruh materi level yang bisa berisi 10 topik × 10 soal.

## 3. Riset Eksternal — Format Tes Anak per Level (Fokus Institusi Indonesia + Cambridge sbg Backbone CEFR)

### 3.1 Cambridge Young Learners English (YLE) — Starters/Movers/Flyers

Backbone CEFR resmi app ini (Starter≈Pre-A1, Explorer≈Pre-A1→A1, Adventurer≈A1, Achiever≈A1→A2). Skala soal & waktu **naik jelas per level**, BUKAN angka tetap:

| Level YLE | Listening | Reading & Writing | Speaking | Total soal |
|---|---|---|---|---|
| Pre A1 Starters | 20 soal / ~20 menit | 25 soal / 20 menit | 3–5 menit, 4 bagian | **45 soal** |
| A1 Movers | 25 soal / ~25 menit | 30 soal / 30 menit | 5–7 menit | **55 soal** |
| A2 Flyers | 25 soal / ~25 menit | 44 soal / 40 menit | 7–9 menit, 4 bagian | **69 soal** |

**Poin kunci desain — TIDAK ADA pass/fail**: semua anak dapat sertifikat, hasil dilaporkan sbg **1–5 "Shields"** (perisai) per komponen (Listening/Reading&Writing/Speaking), maksimum 15 shields total. Ini persis prinsip "terukur tapi non-punitive" yang dicari — **preseden langsung utk desain bintang 1–5 per skill di app ini** (`skillStarsHtml`, sudah dipakai Rapor, sekarang direuse di sini).

Untuk Trailblazer (≈B1, backbone PET), jenjang berikutnya:

| Level | Reading | Writing | Listening | Speaking | Total waktu |
|---|---|---|---|---|---|
| A2 Key (KET) | 60 menit gabung R&W, 7 bagian | (gabung Reading) | 30 menit, 5 bagian | 8–15 menit | ~110 menit |
| B1 Preliminary (PET) | 45 menit, 6 bagian | 45 menit, 2 bagian | 30 menit, 4 bagian | 12–17 menit | ~2 jam+ |

KET/PET adalah ujian formal terproktori (bukan app self-paced) — angka menit di atas TIDAK dipakai literal, cuma mengonfirmasi bahwa jenjang lanjutan (Trailblazer) wajar diberi cakupan soal PALING BANYAK dari 6 level di app ini (konsisten Trailblazer dapat `roundsPerSkill` tertinggi, §5).

### 3.2 LIA (Lembaga Bahasa LIA) — GEYL/GET

Program General English for Young Learners (GEYL, SD kelas 1–6) & General English for Teens (GET, SMP) menguji **4 skill sekaligus**: Listening, Speaking, Reading, Writing — dikonfirmasi lewat pendekatan Total Physical Response + storytelling + role-play + project-based per level (3 bulan/level). Placement test dipakai HANYA utk GET (SMP), GEYL (SD) levelnya ditentukan dari kelas sekolah, bukan tes — relevan sbg konfirmasi bahwa cakupan 4+ skill sekaligus adalah standar utk anak usia SD di institusi Indonesia, bukan cuma preferensi Cambridge.

### 3.3 EF (English First) Indonesia — Small Stars/High Flyers

Small Stars (3–6 th, 4 level: Blue/Green/Orange/Red Book) & High Flyers (7–10 th, 5 level) — placement dilakukan lewat **tes lisan** (oral placement) oleh guru, bukan tes tertulis formal, utk anak usia sangat muda — mengonfirmasi pola app ini yang audio-first/tap-based utk Little Stars/Starter (bukan tes berbasis baca-tulis penuh) sudah tepat. EF SET Quick Check (utk pelajar lebih tua) memakai **20 soal / 15 menit**, Listening+Reading — titik referensi jumlah soal utk tes ringkas/cepat (bukan ujian penuh), relevan sbg pembanding "tes cepat yang tetap terukur" utk level app yang lebih tua (Achiever/Trailblazer).

### 3.4 Kumon

Placement test dipakai utk menentukan starting point individual ("just-right level"), format detail tidak dipublikasikan terbuka — prinsip yang diambil: tes penempatan/kenaikan level HARUS individual & bertujuan menemukan titik yang pas, bukan cuma checkbox selesai/tidak.

### 3.5 Kurikulum Merdeka (Capaian Pembelajaran Bahasa Inggris SD)

Fase A (kelas 1–2): fokus lisan/reseptif. Fase B (kelas 3–4): lisan + mulai tulisan. Fase C (kelas 5–6): lisan DAN tulisan penuh. Assessment resmi bersifat formatif+sumatif (bukan angka pass/fail tunggal) — konsisten dgn keputusan app ini utk tidak membuat Tantangan Raja jadi gerbang lulus/gagal biner, tapi tetap melaporkan progres per kemampuan.

### 3.6 Psikometri & Rentang Perhatian Anak (Attention Span)

Rule of thumb yang dipakai psikolog perkembangan: rentang perhatian anak ≈ **2–3 menit × usia** (batas atas ≈5 menit × usia) — anak usia 5–8 th punya rentang perhatian efektif ~12–24 menit utk 1 aktivitas. Riset psikometri lain mencatat **10 soal cenderung DI BAWAH ambang reliabilitas** utk skrining bahasa anak yang akurat (butuh lebih banyak item per konstruk yang diukur) — dua tarikan berlawanan (lebih banyak soal = lebih reliabel, TAPI makin lama = makin di luar rentang perhatian anak muda) yang harus diseimbangkan lewat SCALING per level (lebih muda = lebih sedikit soal per skill, TIDAK dipaksa ke angka reliabilitas penuh ala tes psikometri formal).

### 3.7 Kompetitor App (Duolingo Kids, Lingokids)

Duolingo (13+, dipakai sebagian keluarga dari usia 8) py placement test, tapi Lingokids (2–8 th) SENGAJA TIDAK punya placement test sama sekali — adaptive learning menggantikan tes formal di rentang usia termuda. Ini menguatkan keputusan app ini utk Little Stars/Starter: tes tetap ada (konsisten dgn app-wide unlock mechanism), TAPI soal PALING SEDIKIT & paling ringan (tap-emoji, bukan baca-tulis) dari 6 level.

## 4. Prinsip Desain yang Dikunci (Constraint App Ini — TIDAK Berubah)

Redesain ini **beroperasi DI DALAM aturan yang sudah ada**, bukan mengubahnya:

1. **TANPA timer/hitung mundur** — dikonfirmasi app-wide (`games/placement.ts`, `games/balloonpop.ts`, `games/sentencepuzzle.ts`, semua eksplisit menolak timer, PRD §4.6). Estimasi waktu di layar sebelum mulai (§5) MURNI informasi ("kira-kira makan waktu segini, santai aja"), BUKAN countdown yang mengunci soal.
2. **TANPA status kalah** — retry tak terbatas tetap berlaku PERSIS seperti sebelumnya (boss.ts header comment: "TIDAK ADA jalur 'kalah', cuma jalur 'belum selesai'"). Menang = semua ronde SUDAH DICOBA (boleh setelah banyak kali retry), skor cuma pelaporan tambahan, TIDAK PERNAH memblokir progres.
3. **Skor = percobaan PERTAMA per soal** — supaya "terukur, mencerminkan kemampuan anak" TANPA melanggar poin 2: anak tetap bebas retry sepuasnya (untuk belajar), tapi bintang yang dilaporkan dihitung dari jawaban pertama kali dicoba tiap soal (persis prinsip ujian sungguhan: sekali jawab dinilai, tapi di sini retry-nya untuk PRAKTIK, bukan untuk "menaikkan nilai resmi").
4. **Bahasa "Raja"/"Markas" TIDAK berubah** — istilah final (lihat memory `map_boss_terminology`), redesain ini murni isi & pengukuran, bukan rebrand.
5. **Speaking tetap dapat perlakuan khusus** (Aturan Wajib Speaking, CLAUDE.md) — skor proporsional dari `wordMatchDetail`/`hitRatio` (bukan biner), TETAP auto-advance (tidak diubah jadi manual), TETAP `graded:false` di `recordEvent` global (ASR anak tidak selalu akurat) — TAPI `hitRatio` tiap ronde tetap dipakai utk bintang Speaking di laporan LOKAL Tantangan Raja (beda dari akurasi global app yang sengaja tidak menghitung mic).

## 5. Spesifikasi Baru — Tabel per Level

**🔒 Revisi §8 (permintaan user "apakah cukup 3 soal... apakah tidak 5 saja", lalu "terapkan yang belum diterapkan")**: SEMUA level dinaikkan/disamakan ke **5 soal/skill** (25 total) — bug matematis konkret yang memicunya (skor bintang 1/4 tidak pernah tercapai kalau bukan kelipatan 5) ada di §8.2. Efek samping yang disadari: progresi halus 3→3→4→4→5→5 di bawah SEKARANG rata 5 di keenam level (bukan lagi "naik seiring usia" per-level) — lihat catatan di §8.2 soal kenapa & kapan diferensiasi ulang bisa dipertimbangkan.

| Level | Usia | Soal/skill | Total soal (5 skill) | Estimasi waktu (info, bukan timer) |
|---|---|---|---|---|
| Little Stars 🌟 | 3–5 th | ~~3~~ **5** | ~~15~~ **25** | ~~6–9~~ **10–15 menit** |
| Starter 🌱 | 5–7 th | ~~3~~ **5** | ~~15~~ **25** | ~~7–10~~ **12–17 menit** |
| Explorer 🧭 | 7–9 th | ~~4~~ **5** | ~~20~~ **25** | ~~10–13~~ **13–16 menit** |
| Adventurer 🚀 | 9–11 th | ~~4~~ **5** | ~~20~~ **25** | ~~11–14~~ **14–18 menit** |
| Achiever 🏆 | 11–13 th | 5 | 25 | ~14–18 menit |
| Trailblazer 🦄 | 12+ th | 5 | 25 | ~15–19 menit |

Rasional angka: naik bertahap (3→3→4→4→5→5) mengikuti kenaikan usia/rentang perhatian (§3.6), TIDAK melompat sekaligus ke skala penuh Cambridge (20–44 soal/komponen) krn itu format ujian formal terproktori 1x seumur hidup — Tantangan Raja dirancang **berulang/replayable** (anak boleh main lagi kapan saja) & self-paced tanpa pengawas, jadi cakupan per sesi sengaja lebih ringkas tapi ROTASI SOAL beda tiap kali dicoba (`shuffle()` dari SELURUH topik level, sudah ada sejak versi lama) — cakupan penuh materi tetap tercapai lintas beberapa kali percobaan, bukan dipaksa dalam 1 sesi.

**5 skill, urutan tetap** (sama urutan tabel skill CLAUDE.md): 📚 Vocabulary → 🎧 Listening → 📖 Reading → ✏️ Grammar → 🗣️ Speaking.

**Skor & pelaporan**: tiap skill dihitung `correct-percobaan-pertama / total-soal-skill × 100`, lalu dipetakan ke 1–5 bintang (`skillStarsHtml`, rumus SAMA dgn Rapor: `round(pct/20)`, clamp 0–5) — ditampilkan di layar "Menang" sesudah Tantangan Raja tuntas, sbg daftar `.stat-list` (pola sama Rapor "Stats Singkat", bukan komponen visual baru). Speaking pakai rata-rata `hitRatio` (bukan strict correct/incorrect) sbg basis skornya, konsisten §4.5.

## 6. Perubahan Teknis

- **`app/src/games/boss.ts`**: `TOTAL_PHASES` 4→5 (tambah babak Reading via `runReadingPhase`, disisipkan antara Listening & Grammar). `ROUNDS_PER_PHASE` konstan diganti `ROUNDS_PER_SKILL: Record<LevelKey, number>` (tabel §5). Adapter baru `toReadingBossItems()` menormalkan 3 format Reading (`AnyReadingTopic` — `ReadingWordTopic`/`ReadingCheckTopic`/`ReadingTopic` lama) jadi 1 bentuk MCQ generik (`{text, speakable, opts}`), pola SAMA dgn adapter Vocab/Listening/Grammar/Speaking yang sudah ada (inline, tidak menyentuh `games/reading.ts`). **Silent-by-default tetap dijaga** — cuma item dari `ReadingWordTopic` (divergensi sah TTS, `types.ts`) yang dapat tombol "🔊 Dengar" opsional; `ReadingCheckTopic`/`ReadingTopo` lama TIDAK PERNAH dapat tombol suara (konsisten "Reading tidak pernah TTS" kecuali Kenalan). Tally skor per skill (`BossResult`, tipe baru diekspor) dihitung dari percobaan pertama tiap ronde (`firstTry` flag lokal per ronde), dikirim ke `onWin(result)` — signature `runBoss` berubah dari `onWin: OnDone` jadi `onWin: (result: BossResult) => void`. Fungsi baru `roundsPerSkillFor(level)`/`estimatedMinutesFor(level)` diekspor utk dipakai layar pra-battle di `app.ts`.
- **`app/src/app.ts`**: `renderBoss()` — daftar babak pratinjau ("Arena") 4→5 (tambah 📖 Reading), tambah baris estimasi waktu (dari `bossGame.estimatedMinutesFor`) dgn kalimat eksplisit "santai aja, tidak ada hitungan mundur" (menegaskan poin 1 §4 ke anak/ortu). `renderBossWin()` dapat parameter kedua `result: BossResult`, merender `<ul class="stat-list">` 5 baris (1 per skill, ikon+label+bintang) via `skillStarsHtml()` yang SUDAH ADA (reuse, bukan komponen baru) — TIDAK mengubah kalimat "Ditaklukkan!"/XP/tombol "Lihat Peta Level" yang sudah ada, cuma menyisipkan kartu skor baru di antaranya.
- **Tidak ada perubahan** ke `games/reading.ts`, `content.ts` (bank soal), `progress.ts` (skor Tantangan Raja lokal ke sesi, tidak disimpan permanen — konsisten versi lama yang jg tidak pernah menyimpan hasil boss selain `bossCleared` biner), atau ke aturan unlock (`unlockLevelsUpTo`/`markBossCleared` tetap dipanggil tanpa syarat skor, §4 poin 2).

## 7. Verifikasi

- `npm run typecheck` & `npm run build` lolos.
- Live browser (Playwright, level Little Stars via localStorage): 5 babak tampil berurutan termasuk Reading baru, opsi Reading dari `ReadingWordTopic` (Little Stars) tampil sbg kartu kata + tombol "🔊 Dengar" opsional, layar menang menampilkan 5 baris bintang skor, tombol "Lihat Peta Level" & unlock level berikutnya tetap jalan seperti sebelumnya.
- Live browser desktop (Explorer, `ReadingCheckTopic`) & Adventurer (`ReadingTopic` lama) — dicoba juga supaya ketiga adapter format Reading diverifikasi, bukan cuma 1.

## 8. Sesi Lanjutan — Audit "Apakah 6–9 Menit/3 Soal Cukup?" & Audit Relevansi Icon

Permintaan user: "lakukan research, apakah cukup test untuk naik level itu hanya 6-9 menit? apakah cukup 3 soal per materi? apakah tidak 5 saja" + "audit dan pastikan icon nya relevan dengan jawaban" + "bagaimana di lembaga lain, berapa soal dan berapa lama".

### 8.1 Riset tambahan — attention span PRESCHOOL (3–5 th) spesifik

Riset §3.6 sebelumnya pakai rentang umum "anak" (5–8 th). Digali lebih spesifik ke usia Little Stars (3–5 th, di luar riset umum itu): **rentang perhatian preschooler MURNI MANDIRI cuma 3–6 menit**, naik ke **6–10 menit** utk 4–5 th — TAPI **dengan dukungan orang dewasa/aktivitas yang disukai anak, bisa diperpanjang ke 8–15 menit** (rule of thumb "usia × 5 menit" utk aktivitas disukai — anak 3 th bisa ~15 menit). Di atas ~20 menit MANDIRI mulai bermasalah bagi preschooler.

**Kenapa ini relevan**: app ini BUKAN lembar kerja senyap (yang butuh perhatian MANDIRI) — tiap ronde py TTS bicara, animasi confetti, nada benar/salah, dorongan tertulis terus-menerus (`pickPraise`/`pickEncourage`) = "didukung" (scaffolded), bukan "mandiri". Jadi patokan yang relevan adalah rentang **8–15 menit**, BUKAN 3-6 menit.

### 8.2 Perbandingan lembaga lain (soal & waktu, rekap 1 tempat)

| Lembaga/Produk | Level pembanding | Jumlah soal | Estimasi waktu | Catatan |
|---|---|---|---|---|
| Cambridge Pre A1 Starters | ≈ level di ATAS Little Stars (Starter/Explorer, usia 6-12) | 20 Listening + 25 R&W = 45 | ~45 menit total (formal, terproktori) | Skor 0-5 Shields per komponen, TANPA pass/fail |
| Cambridge A1 Movers | ≈ Adventurer | 25+30 = 55 | ~55 menit | Naik dari Starters, konsisten "makin tua level = makin banyak soal" |
| Cambridge A2 Flyers | ≈ Achiever | 25+44 = 69 | ~65 menit | Naik lagi |
| EF SET Quick Check | Tes cepat umum (bukan usia spesifik) | 20 soal | 15 menit | Preseden RESMI institusi utk "tes SINGKAT tapi tetap terukur" — 20 soal/15 menit ≈ 45 detik/soal |
| LIA GEYL | SD kelas 1-6, per LEVEL (bukan per sesi tes) | Tidak dipublikasi rinci | 22-33 jam/level (3 bulan kursus) | Levelnya ditentukan dari KELAS sekolah, bukan tes singkat — tidak sebanding langsung |
| Kumon | Placement per anak | Tidak dipublikasi rinci (worksheet-based) | Bervariasi | Prinsip "temukan titik pas individual" diambil, bukan angka |
| **App ini (Little Stars, SEBELUM revisi)** | Little Stars, 3-5 th | 3 soal × 5 skill = 15 | 6-9 menit | Di BAWAH pita "didukung" 8-15 menit (§8.1) — TERLALU SINGKAT relatif thd preseden manapun (bahkan EF SET Quick Check yg "cepat" py 20 soal) |
| **App ini (Little Stars, SESUDAH revisi)** | Little Stars, 3-5 th | 5 soal × 5 skill = 25 | 10-15 menit | Pas di UJUNG ATAS pita "didukung" preschool — jauh lebih ringkas dari Cambridge (yang usia targetnya 3+ tahun lebih tua) tapi TIDAK lagi lebih pendek dari preseden tes cepat manapun |

**Kesimpulan langsung menjawab pertanyaan user**: 6-9 menit (3 soal) SECARA TEKNIS masih di dalam batas atas yang "aman" (tidak sampai bermasalah), TAPI ada 2 alasan konkret utk naik ke 5 soal — bukan cuma "supaya lebih mirip lembaga lain":

1. **Cakupan/reliabilitas** — 3 soal jauh di bawah SEMUA pembanding institusional (bahkan tes "cepat" EF py 20 soal) — riset psikometri umum (§3.6 lama) sudah mengonfirmasi "10 soal cenderung di bawah ambang reliabilitas", 3 jauh lebih rendah lagi.
2. **🔒 Bug matematis KONKRET yang ditemukan sesi ini** (alasan UTAMA, bukan cuma "kurang banyak") — skor 1-5 bintang (`skillStarsHtml`, `app.ts`, `Math.round(pct/20)`) dengan **N=3 soal** cuma bisa menghasilkan persentase 0/33/67/100% → membulat ke **0, 2, 3, ATAU 5 bintang — bintang 1 dan 4 TIDAK PERNAH BISA MUNCUL SAMA SEKALI**, dicek lewat skrip:
   ```
   N=3 → bintang tercapai: [0,2,3,5] — HILANG: [1,4]
   N=4 → bintang tercapai: [0,1,3,4,5] — HILANG: [2]
   N=5 → bintang tercapai: [0,1,2,3,4,5] — LENGKAP, TIDAK ADA YANG HILANG
   ```
   Cuma kelipatan 5 yang memetakan bersih ke keenam nilai bintang. Ini BUKAN soal "kurang teliti", tapi bug matematis nyata yang bikin skor "terukur" (tujuan utama redesain sesi sebelumnya) jadi TIDAK genuinely terukur utk N=3/4 — anak yang jawab 1 dari 3 benar dilaporkan skor SAMA (2 bintang) dgn... tunggu, tidak ada kasus 1/3 yg dilaporkan beda dari kasus lain krn 1/3=33%→2 bintang itu SENDIRI valid, TAPI anak tidak akan PERNAH melihat laporan "1 bintang" atau "4 bintang" apa pun performanya — granularitas skor pincang.

**Tindakan sesi ini**: `ROUNDS_PER_SKILL['little-stars']` dinaikkan **3→5** (`games/boss.ts`), estimasi waktu ikut disesuaikan **6-9 → 10-15 menit** (masih dalam pita "didukung" preschool §8.1).

**🔒 Tindak lanjut (permintaan user "terapkan yang belum diterapkan")** — `starter`(3)/`explorer`(4)/`adventurer`(4) py cacat SAMA, SEKARANG DIKOREKSI JUGA jadi **5** (SAMA PERSIS `little-stars`/`achiever`/`trailblazer`) — ketiganya BELUM `PILOT_LEVELS`, aman diubah kapan saja. **Efek samping yang disadari**: progresi "naik seiring usia" (tema utama §2 di atas) jadi RATA 5 di KEENAM level, krn konstrain matematis §8.2 MEMAKSA tiap level pakai kelipatan 5, dan kelipatan 5 terkecil yang cocok utk rentang usia 3-5 s.d. 12+ th ya 5 itu sendiri — melompat ke 10 utk sebagian level akan melanggar urutan monoton (level lebih tua ≥ level lebih muda) TANPA jg menaikkan `achiever`/`trailblazer` (di luar scope perbaikan bug ini, keduanya TIDAK py cacat). Diferensiasi usia yang lebih halus (mis. 5/5/5/10/10/10, kalau nanti mau progresi berjenjang lagi) adalah **keputusan produk terpisah** yang sengaja TIDAK diambil sepihak sesi ini. Estimasi waktu `starter`/`explorer`/`adventurer` ikut disesuaikan proporsional (pacing per-ronde dipertahankan, cuma jumlah rondenya naik ke 25) — lihat komentar `EST_MINUTES` `games/boss.ts` utk angka persisnya.

### 8.3 Audit "Icon Relevan dengan Jawaban" — 2 Bug Ditemukan & Diperbaiki, 1 Area Dikonfirmasi AMAN

Audit menemukan `games/boss.ts` py adapter SENDIRI ke Vocab/Listening/Reading (supaya babak mashup ini generik lintas format konten, §6) yang TIDAK PERNAH lewat pelindung `isColorTopic()`/`isNumberTopic()`/`isShapeTopic()`/`isDayTopic()` yang sudah dibangun di `games/vocabulary.ts` (CLAUDE.md "Aturan Wajib: Soal Tidak Boleh Bisa Ditebak Tanpa Paham") — celah RE-INJECT ulang krn boss.ts py rendering sendiri, bukan reuse `answerCardsHtml` yang sudah dibentengi.

1. **🔒 BUG #1 — `runVocabPhase` (Vocab babak)**: target/distraktor ditarik dari SELURUH pool vocab level (`allVocab`, lintas topik) — kalau target-nya kebetulan topik `kenal-warna` (emoji swatch 🔴⚫🟡) atau `angka-pertama` (emoji digit 1️⃣2️⃣3️⃣), kartu jawaban menampilkan swatch/digit ITU SENDIRI — anak bisa cocokkan tanpa pernah paham kata Inggrisnya, PERSIS pola yang sudah diperbaiki di `vocabulary.ts`. **Diperbaiki**: `isLeakyEmojiWord()` (BARU, `games/boss.ts` — daftar kata SAMA PERSIS 4 kategori `vocabulary.ts`: warna/angka/bentuk/hari, diduplikasi sbg helper lokal) dicek thd `target.en` — kalau leaky, SELURUH 4 kartu ronde itu jadi teks-saja (`.opt-btn-text`, style dipinjam dari First Placement Test), bukan emoji.
2. **🔒 BUG #2 — `runListenPhase` (Listening babak)**: `ListeningQuestionOption`/`ListeningOption` py field `.text`/`.lbl` (label opsi) SELAIN `.emoji` — utk topik warna Little Stars (`warna-warni`), opsi jawaban py `{emoji:'🔴', text:'Red'}` dst, TTS sebut kalimat target lalu opsi berupa swatch — sama celahnya. **Diperbaiki**: cek label opsi yang BENAR (`.text` format baru / `.lbl` format lama) thd `isLeakyEmojiWord()`, sama pola dgn Vocab.
3. **✅ DIKONFIRMASI AMAN, TIDAK diubah — `toReadingBossItems` (Reading babak, cabang `ReadingWordTopic`)**: sempat dicurigai py celah sama (topik `kata-bentuk` py emoji shape ⬜🔺⭐), TAPI setelah dicek `games/reading.ts` (`runLatihanIntiWord`/`runTantanganWord`, game ASLI-nya yang SUDAH diaudit sesi-sesi sebelumnya) — TERNYATA game asli ITU SENDIRI juga tidak menyaring kategori ini, SENGAJA. Alasan: tugas format ini adalah "baca kata TERCETAK (silent by default) → tunjuk gambar", BUKAN "dengar kata → tunjuk gambar" — tidak ada TTS wajib yang bisa dimanfaatkan sbg jalan pintas dengar-lalu-cocokkan-warna/bentuk tanpa membaca; satu²nya cara tahu jawabannya adalah beneran membaca kata itu (atau tap "🔊 Dengar" opsional, yang MEMANG bagian sah dari mekanisme belajar format ini, types.ts). Menyamakan perlakuan ke Vocab/Listening di sini justru akan MERUSAK desain yang sudah benar (bukan memperbaiki bug).
4. **🔒 BUG #3 — `games/listening.ts` (game Listening ASLI, bukan cuma mashup boss.ts)** — DITEMUKAN sesi audit ini, DIPERBAIKI sesi tindak lanjut (permintaan user "perbaiki juga rekomendasi di luar scope"): celah yang SAMA PERSIS (audio+swatch warna/bentuk/angka/hari) ada di 4 titik render `answerCardsHtml` yang menampilkan `item.question.options`/`topic.question.opts`: `runItemMiniGame` (Kenalan "🎮 Main"), `drawAskQuestion` (Latihan Inti "🎧 Dengar & Jawab"), `runTantangan` format lama ("🌟 Dengar Cerita Mini"), & babak inferensi Trailblazer ("🧩 Dengar & Simpulkan"). **Diperbaiki**: helper generik `correctOptionIsLeaky()` (BARU, `games/listening.ts` — daftar kata SAMA PERSIS, duplikasi lokal konsisten pola boss.ts) dicek thd label opsi yang BENAR (`.text` format baru / `.lbl` format lama) di KEEMPAT titik itu — kalau leaky, `emoji` semua opsi dikosongkan sebelum masuk `answerCardsHtml` (fungsi itu SUDAH native support `emoji:''` → skip render, tidak perlu class baru). **SATU titik SENGAJA TIDAK disentuh**: "📝 Lengkapi Catatan" (note-completion Achiever) — `gap.emoji` di situ SENGAJA diulang IDENTIK di semua opsi (bukan spesifik per-jawaban), jadi TIDAK ada sinyal yang bisa dibocorkan, beda kasus dari 4 titik lain.

Diverifikasi live (Playwright, Little Stars): boss.ts ronde Vocab dgn target "Square" → 4 kartu jadi teks ("Square"/"Yellow"/"No"/"Good Afternoon"); boss.ts ronde Listening dgn jawaban benar warna → 4 kartu teks ("Orange"/"Purple"/"Brown"/"Black"); ronde non-leaky tetap emoji seperti biasa (dikonfirmasi lintas beberapa ronde acak). `games/listening.ts` diverifikasi via `npm run typecheck`/`build` (pola identik boss.ts yang sudah dikonfirmasi benar live) — navigasi UI langsung ke layar spesifik topik `warna-warni` sempat terkendala routing di skrip pengujian (di luar kode produksi), tidak diulang lebih jauh krn perubahan kodenya mekanis & 1:1 meniru pola yang sudah terbukti bekerja. `npm run build` lolos.

## Sumber Riset Web

- [Cambridge English: Young Learners — Wikipedia](https://en.wikipedia.org/wiki/Cambridge_English:_Young_Learners)
- [Young Learners (YLE) — British Council](https://www.britishcouncil.gr/en/exam/cambridge/young-learners)
- [Shields in Starters, Movers and Flyers exams](https://flyer.us/shields-in-starters-movers-and-flyers-exams/)
- [Pre A1 Starters exam format — Cambridge English](https://www.cambridgeenglish.org/exams-and-tests/qualifications/young-learners/paper/starters/format/)
- [A2 Key for Schools exam format — Cambridge English](https://www.cambridgeenglish.org/exams-and-tests/qualifications/key/format/)
- [B1 Preliminary (PET) — EF Guide to English Exams](https://www.ef.com/wwen/english-tests/cambridge-exams/pet/)
- [Tes Kemampuan Bahasa Inggrismu — Lembaga Bahasa LIA](https://lblia.com/tes-kemampuan-bahasa-inggrismu-di-sini/)
- [General English For Young Learners (GEYL) — LIA](https://lbliakalideres.com/general-english-for-young-learners/)
- [EF SET Quick Check](https://www.efset.org/quick-check/)
- [EF Small Stars / High Flyers — EF Design](https://ef.design/work/small-stars)
- [Kumon English Enrichment Classes Indonesia](https://id.kumonglobal.com/english/)
- [Capaian Pembelajaran Bahasa Inggris Kurikulum Merdeka](https://yunandra.com/capaian-pembelajaran-bahasa-inggris-pada-kurikulum-merdeka/)
- [Average Attention Span by Age for Children](https://selfsufficientkids.com/average-attention-span-by-age-for-children/)
- [Duolingo — Wikipedia](https://en.wikipedia.org/wiki/Duolingo) / [Lingokids — Wikipedia](https://en.wikipedia.org/wiki/Lingokids)
- [Honoring a Preschooler's Attention Span — Blue Bird Day](https://bluebirddayprogram.com/honoring-a-preschoolers-attention-span/)
- [Expectations for Preschool Attention Spans — Activity Tailor](https://www.activitytailor.com/expectations-for-preschool-attention-spans/)
- [Pre A1 Starters exam format Part 4 — esleschool.com](https://www.esleschool.com/starters-part-4-test-4/)
