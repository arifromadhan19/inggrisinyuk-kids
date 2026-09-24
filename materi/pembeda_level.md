# Vocabulary

Status: **diimplementasikan** (`app/src/games/vocabulary.ts`). Model pembeda-nya 2 sumbu bertingkat, keduanya dihitung dari `contentLevel` (level TOPIK yang sedang dimainkan — lihat "⚠️ Gotcha" di bawah, BUKAN level badge asli anak), bukan cuma "flat semua level sama" atau "tiap level beda sendiri-sendiri tanpa pola". Riset acuan: progresi Cambridge YLE Movers→Flyers→KET/PET (lihat "Rujukan Institusi" di bawah).

## Ringkasan (High-Level)

| Level | Tier | Kartu jawaban Latihan Inti | Jumlah opsi MCQ | 💡 Petunjuk eliminasi | Reveal jawaban otomatis | Kata jebakan Susun Kalimat |
|---|---|---|---|---|---|---|
| Little Stars | Dasar | Gambar + teks | 4 | 2 opsi | setelah 2x salah | 0 |
| Starter | Dasar | Gambar + teks | 4 | 2 opsi | setelah 2x salah | 0 |
| Explorer | Menengah | **Teks-saja** | 4 | 2 opsi | setelah 2x salah | **2** |
| Adventurer | Menengah | Teks-saja | 4 | 2 opsi | setelah 2x salah | 2 |
| Achiever | Lanjut | Teks-saja | **5** | **1 opsi** | **setelah 3x salah** | **3** |
| Trailblazer | Lanjut | Teks-saja | 5 | 1 opsi | setelah 3x salah | **4** |

Intinya: **Little Stars/Starter** = tanpa perubahan (materi masih pra/awal-literasi, gambar tetap wajib jadi bantuan). **Explorer/Adventurer** = 1 tingkat lebih sulit dari dasar (gambar dicabut dari Latihan Inti + jebakan kata mulai muncul di Susun Kalimat), TAPI masih "murah hati" soal bantuan. **Achiever/Trailblazer** = tingkat paling sulit — opsi jawaban lebih banyak, jebakan lebih banyak, bantuan (hint & reveal) lebih pelit — mendekati gaya ujian Cambridge KET/PET yang scaffolding-nya paling minim.

Kenalan "🎮 Main" **SENGAJA TIDAK ikut dibedakan** — tetap gambar+teks penuh + hint eliminasi 2 opsi di SEMUA level, karena Kenalan itu tahap "pemanasan"/exposure (keputusan produk lama), bukan tahap uji — lihat "Yang Sengaja Tidak Disentuh" di bawah.

## Detail Teknis

### Sumbu 1 — `isAboveStarter(contentLevel)`: Little Stars/Starter vs Explorer ke atas

```ts
function isAboveStarter(contentLevel: LevelKey): boolean {
  const starterIdx = LEVELS.findIndex((l) => l.key === 'starter');
  const idx = LEVELS.findIndex((l) => l.key === contentLevel);
  return idx > starterIdx;
}
```

Dipakai di 2 tempat:
1. **`runLatihanInti` → `drawAudio`/`drawSentence`** — kartu jawaban (`answerCardsHtml`) jadi TEKS-SAJA (emoji dikosongkan) begitu `isAboveStarter(contentLevel)` true, tidak peduli topiknya normal/warna/angka/bentuk/hari (dicek PALING AWAL sebelum cabang per-topik lain). Little Stars/Starter tetap ikut aturan lama per-topik (gambar+teks utk topik normal, ilustrasi aman utk warna, dst — lihat `materi/vocab.md`/CLAUDE.md "Soal Tidak Boleh Bisa Ditebak Tanpa Paham").
2. **`runSusunKalimat` → `pickDecoyWords`** — bank kata dapat kata jebakan tambahan (jumlah exact di Sumbu 2) begitu `isAboveStarter(contentLevel)` true; Little Stars/Starter bank-nya PERSIS sejumlah kata jawaban, tidak pernah ada jebakan.

### Sumbu 2 — `isFlyersOrAbove(contentLevel)`: Explorer/Adventurer vs Achiever/Trailblazer

Tingkat KEDUA, di ATAS Sumbu 1 (bukan gantiin) — Achiever/Trailblazer dapat treatment "berat", Explorer/Adventurer tetap treatment "ringan" dari Sumbu 1:

```ts
function isFlyersOrAbove(contentLevel: LevelKey): boolean {
  return contentLevel === 'achiever' || contentLevel === 'trailblazer';
}
```

4 fungsi turunan, masing-masing 1 sumbu kesulitan konkret:

| Fungsi | Explorer/Adventurer | Achiever/Trailblazer | Dipakai di |
|---|---|---|---|
| `susunDecoyCount(contentLevel)` | 2 | Achiever 3, Trailblazer 4 | `runSusunKalimat` → `pickDecoyWords(..., count)` |
| `latihanDistractorCount(contentLevel)` | 3 (→ 4 opsi total) | 4 (→ 5 opsi total) | `runLatihanInti` → `order` (slice distraktor) |
| `latihanHintEliminateCount(contentLevel)` | 2 | 1 | `drawAudio`/`drawSentence` → `wireHint(..., eliminateCount)` |
| `tantanganRevealThreshold(contentLevel)` | 2 | 3 | `runEjaKata`/`runSusunKalimat` → `showAnswer = wrongSoFar >= threshold` |

Catatan implementasi non-obvious:
- **`pickDecoyWords`** ambil kata jebakan dari kalimat contoh item LAIN di topik yang SAMA (bukan kosakata acak di luar topik) — supaya kata yang muncul sudah dikenal anak lewat kata lain di topik ini, bukan kosakata baru yang membingungkan. Kata yang sudah ada di kalimat target (case-insensitive) dikecualikan biar tidak ada 2 chip kembar.
- **`wireHint`** parameter `eliminateCount` defaultnya `2` — SEMUA pemanggil LAMA (Kenalan Main punya 4 varian: `drawListenPointQuestion`, `drawListenTextQuestion`, `drawWordQuestion`, `drawPictureWordQuestion`, lewat `wireHint`/`wireHintCorrect`) TIDAK diubah, cuma `drawAudio`/`drawSentence` (Latihan Inti) yang kirim angka dinamis.
- **CSS**: 5 opsi (kartu ganjil) butuh fix layout — `.opt-grid > *:last-child:nth-child(odd)` bikin kartu TERAKHIR melebar 1 baris penuh kalau total kartu ganjil (3 atau 5), supaya tidak nyisa sendirian di kolom kiri dgn ruang kosong di kanan. Kasus 4 kartu (paling umum) tidak kena selector ini.

### ⚠️ Gotcha: `contentLevel` vs `level` (praise) — JANGAN ketuker

`runLatihanInti`/`runTantangan`/`runSusunKalimat`/`runEjaKata` masing-masing punya **2 parameter level BEDA**, jangan disamakan:
- **`level`** (lama) — level BADGE ASLI anak (`app.ts` `praiseLevel = currentLevelMeta().key`), dipakai SATU-SATUNYA buat bahasa pujian (`pickPraise()`/`pickEncourage()`, `praise.ts`). TIDAK PERNAH dipakai utk keputusan kesulitan.
- **`contentLevel`** (baru, sesi ini) — level TOPIK yang SEDANG ditampilkan (`app.ts` `runStage()`'s `contentLevel = browsingLevel().key`), dipakai SATU-SATUNYA utk `isAboveStarter`/`isFlyersOrAbove`.

Kenapa dipisah: anak level badge Little Stars bisa saja lagi review topik Explorer (semua level di bawah level anak otomatis terbuka, CLAUDE.md "Semua Level DI BAWAH Level Anak Sekarang Harus Sudah Terbuka Penuh") — topik Explorer itu HARUS tetap dapat treatment kesulitan Explorer (teks-saja, jebakan, dst), BUKAN treatment Little Stars cuma karena badge anaknya masih Little Stars. Sebaliknya anak Achiever yang nostalgia balik ke topik Little Stars TIDAK boleh dipaksa mode sulit di materi baby itu. CLAUDE.md sudah pernah catat bug PERSIS soal ini ketuker di `renderKenalan` — jangan diulang di fungsi manapun yang nanti nambah pembeda serupa.

### Yang SENGAJA Tidak Disentuh

1. **Kenalan "🎮 Main"** (`drawListenPointQuestion`/`drawListenTextQuestion`/`drawWordQuestion`/`drawPictureWordQuestion`/`drawListenSpeakQuestion`) — TIDAK menerima `contentLevel` sama sekali, TETAP gambar+teks + hint eliminasi 2 opsi di SEMUA 6 level. Alasan: Kenalan adalah tahap "pemanasan"/exposure murni (keputusan produk lama, CLAUDE.md "Format Wajib Materi Vocabulary" poin 1 — "kenalan itu sebagai pemanasan... scaffolding tambahan WAJAR"), bukan tahap uji, jadi TIDAK ikut logika "makin sulit seiring level".
2. **Konten kata/kalimat itu sendiri** (jumlah topik, kompleksitas kosakata, CEFR tier) — sudah beda dari sononya lewat AUTHORING (`materi/vocab.md`), bukan lewat mekanik yang didokumentasikan di sini. Dokumen ini murni soal INTERAKSI/MEKANIK, bukan isi materi.

## Rujukan Institusi

Backbone CEFR 4 level "di atas Starter" ini kebetulan pas map ke tangga Cambridge YLE/KET/PET asli (`materi/vocab.md` §3D–§3F):

| Level app ini | Backbone exam | Ciri scaffolding di exam asli |
|---|---|---|
| Explorer | Pre-A1 Starters → A1 Movers | Masih ada picture-matching, mulai dikurangi |
| Adventurer | A1 Movers penuh | Gap-fill+gambar, opsi jawaban mulai lebih banyak |
| Achiever | A2 Flyers | Nyaris tanpa gambar; ada "note completion" — isi kata TANPA pilihan ganda |
| Trailblazer | A2 Key(KET)/B1 Prelim(PET) | Multiple matching (opsi ekstra sengaja tidak kepake), open cloze (isi kosong tanpa opsi) |

3 sumbu nyata yang institusi pakai seiring tier naik: **(a)** opsi jawaban makin banyak (odds nebak makin kecil), **(b)** opsi berlebih/jebakan makin sering muncul, **(c)** bantuan (hint/reveal) makin pelit/telat — SEMUA 4 fungsi turunan di atas map langsung ke 3 sumbu ini.

## Backlog (Belum Diimplementasi)

**Recall murni (diketik, bukan MCQ) di Latihan Inti Trailblazer** — niru "open cloze"/"note completion" KET/PET, sumbu ke-4 yang institusi pakai justru PALING kentara di tier atas tapi belum ada padanannya di app ini (app ini sengaja tap-based, non-typing, di semua level). Detail penuh + alasan kenapa ditunda + langkah yang disarankan: `materi/vocab.md` §6.1.

## Pola yang Bisa Ditiru ke Skill Lain (Listening/Speaking/Grammar/Reading)

Template 2-sumbu di atas GENERIK, bukan spesifik Vocabulary — kalau mau direplikasi ke skill lain, pola yang sama:
1. Definisikan helper tiering LOKAL di file game skill itu (`isAboveStarter`/`isFlyersOrAbove`-setara), pakai `contentLevel` (bukan `level`/praise) sbg satu-satunya input.
2. Terapkan HANYA ke tahap UJI (Latihan Inti/Tantangan) — jangan sentuh tahap exposure/pemanasan (Kenalan) kalau skill itu juga punya konsep serupa.
3. Pilih dari 3 sumbu nyata Cambridge (opsi makin banyak, jebakan makin banyak, bantuan makin pelit) — sesuaikan mana yang applicable ke mekanik skill itu (mis. Listening mungkin tidak punya "Susun Kalimat", tapi bisa punya "jumlah pilihan jawaban MCQ" atau "ambang reveal transkrip").
4. Jangan lupa gotcha `contentLevel` vs `level` (praise) — WAJIB dipisah sejak awal, bukan ditambal belakangan.

**Status skill lain**: Listening — sudah diimplementasikan (section bawah). Speaking — riset selesai 2026-09-24, usulan di section Speaking (BELUM diimplementasi). Grammar/Reading — placeholder masih kosong.

# Listening

Status: **riset selesai 2026-09-21; SEMUA usulan (#1–#5) sudah DIIMPLEMENTASIKAN di hari yang sama — tahap 1 (kecepatan/jeda/2 suara Trailblazer/petunjuk) dan tahap 2 (proporsi per level: distraktor halus, cerita dialog, opsi jebakan; lihat "Tahap 2")** — semua angka & aturan di bawah bertanda **[F]** (fakta dari sumber) atau **[U]** (usulan desain, belum diuji). Pertanyaan yang dijawab: selain FORMAT soal, apa yang membedakan level Listening di lembaga lain, dan mana yang layak ditiru app ini.

Listening punya **2 lapis pembeda**, jangan dicampur:
1. **Lapis format (SUDAH ADA)** — 4 format berdampingan (dikte → mini-cerita → note completion → dialog+inferensi), alasan & riset per level: [listening.md](listening.md) §0 & §3. Dokumen ini TIDAK mengulang itu.
2. **Lapis mekanik (dokumen ini)** — kecepatan/jeda suara, suara pembicara, distraktor di dalam audio, bentuk bantuan. Di sini pola Vocabulary (opsi makin banyak, hint makin pelit) **tidak bisa disalin mentah** — lihat temuan 2 di bawah.

## Ringkasan (High-Level)

Temuan inti:
1. **[F]** Lembaga membedakan level Listening lewat 4 hal: (a) panjang & jenis teks, (b) jenis respons (menunjuk → menulis → inferensi), (c) distraktor **di dalam audio** (penutur ikut menyebut pilihan yang salah), (d) cara penyampaian (kecepatan, jeda, artikulasi, aksen — deskriptor CEFR).
2. **[F]** Yang **KONSTAN** antar level, jadi bukan pembeda: rekaman **diputar 2x di SEMUA level Cambridge** (Starters sampai PET), dan opsi pilihan ganda tetap **3** (Starters sampai KET). Jadi "opsi 4→5" ala Vocab tidak punya dasar di Listening.
3. **[F]** Putar 2x menaikkan skor & menurunkan kecemasan (Field/Holzknecht) → replay tanpa batas di app sudah searah riset, jangan dijadikan pembeda.
4. **[F]** TOEFL Primary memakai tipe tugas yang sama di Step 1 & 2, tapi kompleksitas bahasa dan cakupan topik dibedakan; tugas "cocokkan 1 kata–gambar" terlalu mudah untuk pemelajar kuat, tugas "jawab soal setelah teks panjang" terlalu berat untuk pemelajar lemah → mendukung format berdampingan per level, bukan 1 format untuk semua.
5. **Gap terbesar (sebelum implementasi 2026-09-21; poin i, ii, iv kini tertutup)**: (i) dialog 2 tokoh dibacakan **1 suara** (Cambridge selalu membedakan penutur lewat usia/gender), (ii) kecepatan suara global (default 0.75x), bukan per level, (iii) Explorer & Adventurer mekaniknya identik, (iv) "penutur menyebut jawaban salah" belum jadi aturan authoring.

### Tier yang Diimplementasikan (nilai kecepatan/jeda = usulan, belum diuji telinga)

| Level | Tier | Kecepatan default TTS | Jeda antar kalimat | Suara | Distraktor di audio | 💡 Petunjuk |
|---|---|---|---|---|---|---|
| Little Stars | Dasar | 0.75x | panjang (≥2000 ms) | 1 suara | tidak ada | teks EN+ID + eliminasi 2 (sudah) |
| Starter | Dasar | 0.75x | panjang (≥2000 ms) | 1 suara | tidak ada | sama (sudah) |
| Explorer | Menengah | 0.75x | 1900 ms (cerita) | kalimat tanya-jawab Kenalan 2 suara; 3 dari 10 cerita dialog 2 suara | halus 40% + opsi jebakan acak | eliminasi 2 (sudah) |
| Adventurer | Menengah | 1x | 1900 ms (cerita) | kalimat tanya-jawab Kenalan 2 suara; 4 dari 10 cerita dialog 2 suara | halus 60% + 4 dari 10 soal punya opsi ke-3 + jebakan acak | eliminasi 2 (sudah) |
| Achiever | Lanjut | 1x | 1200 ms | 5 dari 10 catatan dialog 2 suara, sisanya narasi 1 suara | halus 75% + jebakan acak | teks EN+ID, **tanpa eliminasi** |
| Trailblazer | Lanjut | 1x | 1200 ms | **2 suara (wanita+pria)**, 10/10 | halus 77% + jebakan acak | teks EN+ID, **tanpa eliminasi** |

Nilai kecepatan/jeda adalah **usulan** (CEFR hanya kualitatif) — wajib diuji telinga; pill kecepatan user (0.5–1.5x) tetap menang atas default level. "Jeda" = jarak **start-ke-start** antar kalimat (`speakSequence`, dibagi kecepatan), bukan jeda hening murni — kalimat yang lebih panjang dari jarak itu langsung antre. Explorer/Adventurer format lama tetap `speakSequence` 1900 ms (tidak diubah).

## Kondisi Sekarang (Baseline di Kode)

| Aspek | Sekarang | Beda per level? |
|---|---|---|
| Format & panjang teks | 4 format | **Ya** (lapis 1, sudah) |
| Jumlah opsi MCQ | 4 di semua | Tidak |
| Replay 🔊 | tanpa batas | Tidak |
| 💡 Petunjuk Latihan Inti (format `items`) | teks EN+ID + eliminasi 2; **Achiever/Trailblazer: teks saja** | **Ya** (baru) |
| Reveal jawaban Susun Kalimat | setelah 2x salah | Tidak |
| Kata jebakan Susun Kalimat | 2 kata (level di atas Starter saja, `applyDecoys`) | Sebagian |
| Kecepatan suara | default 0.75x; Latihan Inti/Tantangan Listening: Adventurer/Achiever/Trailblazer **1x** (`listeningDefaultRate`), pill user menang | **Ya** (baru) |
| Jeda antar kalimat | Latihan Inti/catatan/dialog: 2000 ms (Little Stars/Starter) vs 1200 ms (Achiever/Trailblazer); Kenalan 1600, story lama 1900 | **Ya** (baru) |
| Suara dialog 2 tokoh | wanita+pria bergantian (`speakDialogue`): Trailblazer 10/10, Achiever 5/10 catatan, Explorer 2/10 & Adventurer 4/10 cerita + primer tanya-jawab | **Ya** (baru) |
| Aksen | pilihan user US/UK, global | Tidak |
| Distraktor di audio | ≥1 gap/catatan Achiever menyebut pilihan salah (5 catatan baru diedit, 5 sudah punya) | **Ya** (baru, Achiever) |

## Bukti Riset per Sumbu

| Sumbu | Temuan | Sumber |
|---|---|---|
| **Kecepatan & jeda** | CEFR A1: "very slow and carefully articulated, with long pauses"; A2: "clearly and slowly articulated"; B1: "clearly articulated, generally familiar accent/standard dialect". Makin tinggi level, makin dekat ke tempo alami. Angka wpm tidak ada di sumber resmi. | CEFR (via EF SET) |
| **Penutur** | Starters Part 3, Movers Part 4, Flyers Part 4: dialog di mana penutur "clearly differentiated by age or gender". Versi tes memuat aksen British DAN American. | Handbook YLE |
| **Distraktor di audio** | Movers P1: 1 nama ekstra tidak disebut; Movers P3: 1 hari tidak dipakai; Starters P4: 1 dari 7 objek mirip; Flyers P3: penutur juga membicarakan 2 gambar yang salah; Flyers P4: jawaban bisa di titik mana pun, bukan hal terakhir; Flyers P5: bahasa pembeda 2 objek/orang mirip. | Handbook YLE |
| **Jenis respons** | Starters P2 tulis nama/angka (angka **1–20 saja**, nama dieja huruf demi huruf); Movers/Flyers P2 isi form/catatan (kata/angka); KET P2 isi celah catatan dari monolog; PET P3 isi 6 celah, P4 interview → sikap & opini. Movers P2 diakui "often difficult". | Handbook YLE, Cambridge KET/PET |
| **Kontrol bahasa** | Cambridge menerbitkan daftar kosakata & struktur penuh per level; Movers P3 khusus bentuk lampau. TOEFL Primary Step 1: topik tidak keluar dari pengalaman pribadi & lingkungan sehari-hari; Step 2: cerita/percakapan di luar pengalaman pribadi + kata asing dengan petunjuk konteks. | Handbook YLE, ETS RM-16-02 |
| **Pengulangan** | Rekaman 2x di Starters–PET. Riset: putar 2x → skor lebih tinggi, cemas lebih rendah, pemrosesan kognitif lebih dalam. | Cambridge; Field/Holzknecht |
| **Bantuan pra-dengar** | Anak diberi waktu melihat gambar sebelum rekaman (Starters P3). Tidak ada hint/transkrip saat tes. | Handbook YLE |
| **Strategi menyimak** | EF Trailblazers (10–14 th): "diajarkan teknik mendengarkan yang efektif", "menghubungkan informasi baru dengan pengetahuan yang sudah dimiliki". Handbook YLE: "dengarkan seluruh dialog sebelum menjawab". | EF/English1, Handbook YLE |
| **Filosofi dasar** | LIA GEYL (6 level, ±1 tahun/level, kelas 1–6): anak dalam fase *akuisisi* lewat "pendengaran yang berulang", musik, game. | LIA Semarang/Depok |

## Rujukan Institusi

**Cambridge — struktur Listening per tingkat** (semua: rekaman diputar 2x)

| Level app | Backbone | Soal/durasi | Bagian & ciri |
|---|---|---|---|
| Explorer | Pre A1 Starters | 20 / ~20 mnt, 4 bagian | tarik garis nama→lokasi; tulis nama/angka 1–20; pilih 1 dari 3 gambar; warnai 1 dari 7 objek mirip |
| Adventurer | A1 Movers | 25 / ~25 mnt, 5 bagian | + isi form (kata/angka), + hari→gambar (lampau), 1 nama/hari ekstra tidak dipakai |
| Achiever | A2 Flyers | 25 / ~25 mnt, 5 bagian | + cocokkan gambar↔kata, penutur ikut menyebut gambar yang salah, jawaban tidak selalu terakhir |
| Trailblazer | A2 Key → B1 Preliminary | 25 / 30 mnt | KET: 3-opsi, celah catatan, gist, matching. PET: 7+6+6+6 soal, monolog isi celah, interview sikap & opini |

**TOEFL Primary (ETS RM-16-02)** — 30 soal/tes, ±30 mnt

| Tipe tugas | Step 1 (≈A1) | Step 2 (≈A2–B1) |
|---|---|---|
| Listen and match (kalimat→gambar) | 7 | — |
| Follow directions | 7 | 6 |
| Question-response (3 versi percakapan 2-giliran) | 6 | — |
| Dialogue | 5 | 5 |
| Social-navigational monologue (pesan/pengumuman) | 5 | 5 |
| Narrative (cerita) | — | 8 |
| Academic monologue | — | 6 |

**Kurikulum Merdeka, LIA, EF** — detail per level ada di [listening.md](listening.md) §3. Tambahan sesi ini: LIA GEYL 6 level (kelas 1–6, ±1 tahun/level), EF High Flyers (7–9 th, ±8 level, "berlatih mendengar & tata bahasa dalam kalimat" → "memahami percakapan & merespon"), EF Trailblazers (10–14 th, target CEFR A2–B1). LIA & EF **tidak menerbitkan** rincian mekanik listening per level (kecepatan/opsi/jumlah putar) — hanya metode & tujuan.

## Status Implementasi (2026-09-21)

Status per usulan (tahap 1 → tahap 2): **#1 ✅** (Trailblazer 10/10 → +Achiever 5/10, +Explorer 2/10, +Adventurer 4/10 + primer tanya-jawab), **#2 ✅**, **#3 ✅** (Achiever → +Explorer, Adventurer, Trailblazer; klaim awal "tidak berlaku di Trailblazer" DIKOREKSI — bisa lewat penyangkalan/lampau di dialog), **#4 ✅**, **#5 ✅** (lewat kombinasi proporsi di "Tahap 2", tanpa format baru).

| # | Usulan | Dasar bukti | Usaha | Catatan |
|---|---|---|---|---|
| 1 | **2 suara utk dialog** (`runTantanganDialogue` Trailblazer, `runTantanganNote` Achiever; `primer` Explorer–Adventurer hanya jika berupa dialog) | Handbook YLE: penutur dibedakan usia/gender di 3 tingkat | Sedang | Tokoh `speaker` sudah ada di data, tapi TTS 1 suara. Voice gender di browser hanya tebakan nama (`speech.ts`) → siapkan fallback beda `pitch` (belum diuji) |
| 2 | **Kecepatan & jeda default per level** | CEFR A1→B1 | Rendah | Pakai `contentLevel` (bukan `level`), default saja — pill user menang |
| 3 | **Aturan authoring distraktor lisan** utk Achiever/Trailblazer (+ 1 item ekstra di Adventurer) | Flyers P3/P4, Movers P1/P3 | Sedang (konten) | Audit dulu apakah `notePassage`/`dialogueLines` sekarang menyebut pilihan salah; verifikasi otomatis sulit |
| 4 | **Petunjuk bertingkat**: Lanjut = transkrip tanpa eliminasi | EF "teknik mendengarkan", handbook "dengar sampai akhir" | Rendah | Turunan pola Vocab Sumbu 2 |
| 5 | **Bedakan Explorer vs Adventurer** (mekanik identik) | Starters→Movers menambah form/matching + distraktor ekstra | Tinggi | Sudah dicatat listening.md §3D/§5; butuh keputusan user (format baru atau cukup #3) |

## Yang SENGAJA Tidak Dibedakan

1. **Replay tanpa batas** — Cambridge 2x di semua tingkat; riset menunjukkan pengulangan menurunkan cemas. Batas replay = melawan aturan non-punitive CLAUDE.md.
2. **Jumlah opsi 4** — Cambridge tetap 3 di semua tingkat; tidak ada dasar naik ke 5.
3. **Respons menulis (ketik nama/angka)** — Cambridge memakai (Starters P2, Movers/Flyers P2), tapi CLAUDE.md sudah memutuskan menulis = skill Vocab (Eja Kata dihapus dari Listening), app tap-based. Padanan Listening = tap (note completion Achiever).
4. **Tombol Coba Lagi/Lanjut, nada+confetti, non-punitive** — standar app-wide, bukan pembeda level (listening.md §0).
5. **Kenalan** — tahap exposure, sama seperti keputusan Vocabulary.

### 🔒 Revisi 2026-09-22 — Kenalan "🎮 Main" DISERAGAMKAN lintas level (bukan lagi Little Stars sendirian)

Permintaan user langsung: "samakan UI Listening kenalan 'main' di level starter, explorer, adventure dan trailblazer dimana UI nya samakan dengan Listening kenalan 'main' di level little star". Temuan sebelum perbaikan ini: poin 5 di atas ("Kenalan — tahap exposure, sama seperti Vocabulary") itu sendiri TERNYATA belum genuinely dipatuhi kode — `runItemMiniGame` (`games/listening.ts`) py 1 flag internal `isLittleStars` yang bikin Little Stars dapat treatment BEDA (teks pre-revealed, hint eliminasi + bullet-progress lintas soal, tetap di dalam mini-game) drpd Starter/Achiever/Trailblazer (teks tersembunyi, hint reveal-saja, keluar ke daftar Kenalan tiap 1 soal) — WALAUPUN kodenya literally sama (`renderKenalanSentence`/`runItemMiniGame` di-reuse SEMUA level `items`-based). Ini gap implementasi, bukan keputusan desain yang didokumentasikan di sini.

**Fix**: flag di-rename `useLittleStarsFlow`, diperlebar ke `little-stars`/`starter`/`explorer`/`adventurer`/`trailblazer` — **Achiever SENGAJA TIDAK ikut** (user tidak memintanya scope ini; kandidat kalau diminta lanjut nanti, cukup tambah `'achiever'` ke daftar). Explorer/Adventurer (format LAMA `ListeningTopic`, sebelumnya TIDAK PUNYA "🎮 Main" sama sekali — Kenalan-nya cuma daftar `primer` + tombol "Lanjut") dapat 1 tombol baru "🎮 Main dengan Kalimat Ini" di bawah daftar primer (bukan per-baris, krn `primer` cuma sepasang tanya-jawab per topik, bukan array 10-item) — dibuka lewat adapter `{id,title,desc,items:kenalanGame}` yang dilempar LANGSUNG ke `runItemMiniGame` yang SAMA (bukan re-implementasi), jadi UI-nya otomatis identik. Field data baru `ListeningTopic.kenalanGame?: ListeningSentenceItem[]` (types.ts, opsional, reuse tipe existing) — 1 comprehension question per topik (20 topik Explorer+Adventurer diisi manual, `example` = pasangan primer digabung/diparafrase kalau cuma 1 baris, `question`+4 opsi MCQ sebagian reuse ikon sibling `drill`/`story`/`question` di topik yang sama, sebagian teks-saja kalau kata kuncinya hewan tanpa varian "kepala" resmi — CLAUDE.md "Emoji Hewan WAJIB Kepala Saja"). `verify-content-duplicates.mjs` diperluas ikut cek field baru ini (kalimat `kenalanGame` tidak boleh 100% sama dgn `primer`/`drill`/`story`/`question` topik yang sama).

**Konsekuensi utk dokumen ini**: poin 5 "Yang SENGAJA Tidak Dibedakan" di atas SEKARANG genuinely akurat — Kenalan Main sama persis di 5 dari 6 level (Achiever adalah SATU-SATUNYA pengecualian, bukan lagi "Little Stars sendirian vs 5 level lain").

### 🔒 Revisi lanjutan — Kenalan format lama = 10 kalimat, `primer` dihapus

Permintaan user: "samakan Kenalan Explorer/Adventurer dgn level lain". Sebelum ini Kenalan 2 level itu justru PALING tipis di seluruh app — 1–2 kalimat `primer` dgn 🔊 saja (tanpa ikon per baris, tanpa 🎤) + 1 tombol "🎮 Main" berisi 1 soal. Sekarang `renderKenalan` memanggil `renderKenalanSentence` yang SAMA dgn level lain: 10 kalimat, ikon + 🔊/🎤/🎮 per baris, Main 10 soal ber-quiz-dot. `kenalanGame` digenapkan jadi 10 item × 20 topik; `primer` dihapus dari types & data; 2 suara tanya-jawab dipertahankan lewat `splitQuestionAnswer`+`twoVoiceQA`. Latihan Inti & Tantangan 2 level ini TIDAK disentuh, jadi proporsi distraktor/dialog/jebakan di tabel Tahap 2 tetap berlaku (cerita dialog Explorer naik 2/10 → 3/10 krn topik `perkenalan` ditulis ulang jadi dialog).

### Tahap 2 — Proporsi per Level (2026-09-21, keputusan user)

Keputusan: distraktor **halus** = penyangkalan/koreksi diri/lampau ("…, not …", "…, but …", "I was worried, but…"), bukan sekadar menyebut pilihan salah. Target minimum **40/50/60/70%** (Explorer/Adventurer/Achiever/Trailblazer); cerita dialog **20/40/50%** (Explorer/Adventurer/Achiever; Trailblazer sudah 100%); opsi ke-3 authored **20%** Explorer, **40%** Adventurer. Hasil terukur (`node app/scripts/report-listening-distractors.mjs`, heuristik kata — pendekatan, bukan bukti semantik):

| Level | Pilihan salah disebut di audio | Halus (target) | Cerita dialog | Opsi ke-3 authored | Jebakan acak |
|---|---|---|---|---|---|
| Explorer | 10/10 | **40%** (40) | 2/10 | 2/10 | 10/10 topik |
| Adventurer | 9/10 | **60%** (50) | 4/10 | 4/10 | 10/10 topik |
| Achiever | 78% gap | **75%** (60) | 5/10 catatan | 3 opsi (semua) | 36/36 gap |
| Trailblazer | 77% soal | **77%** (70) | 10/10 | 4 opsi (semua) | 30/30 soal |

Angka Adventurer/Achiever/Trailblazer sedikit di atas target karena heuristik ikut menghitung penyangkalan di giliran dialog berikutnya — target diperlakukan sebagai batas minimum.

- **Temuan penting sebelum tahap 2**: 19 dari 20 topik Explorer & Adventurer SUDAH menyebut kedua pilihan di cerita (100% / 90%) — jadi "proporsi distraktor" hanya bermakna kalau dihitung yang HALUS. Baseline halus sebelum tahap 2: 10% / 10% / 14% / 3%.
- **Bug lama ditemukan & diperbaiki**: format lama Explorer/Adventurer menaruh jawaban benar SELALU di kartu pertama (28/28 soal latihan + 20/20 soal akhir) — opsi sekarang diacak (Latihan Inti per soal, Tantangan per sesi).
- **Jebakan acak ("kata random ala Vocab") di Tantangan level di atas Starter**: tiap soal Tantangan menyisipkan 1 opsi jebakan acak dari kandidat authored (`question.decoys` Explorer/Adventurer, `gap.decoys` Achiever, `inferenceQuestion.decoys` Trailblazer) yang TIDAK disebut di audio → total opsi Explorer 3–4, Adventurer 3–4, Achiever 4, Trailblazer 5 (maks 5 = sama dgn tier Lanjut Vocab). Kandidat authored (bukan diambil acak dari topik lain) krn pool lintas topik sempat menghasilkan jebakan yang bisa jadi parafrase jawaban benar (mis. "Returning an Item" utk "Exchange a Jacket"). Aturan "tidak disebut": lebih dari separuh kata inti kandidat tidak boleh ada di audio (kata yang ada di SEMUA opsi, mis. "Book", diabaikan) — dicek runtime (`pickDecoy`) & saat build (`checkListeningTantanganData`).
- **2 suara di format lama**: `ListeningTopic.storyVoices` (gender per baris `story`); kalimat Kenalan berbentuk tanya-jawab ("…? …") otomatis wanita (tanya) lalu pria (jawab) lewat `splitQuestionAnswer`/`twoVoiceQA` — dulu lewat `primer`/`primerGender`, keduanya sudah DIHAPUS. Achiever: `notePassage[].speaker` (semua baris atau tidak sama sekali).

### Detail Implementasi

- **Kecepatan default** — `speech.ts`: `setPlaybackRate()` (dipanggil pill user) menandai `rateChosenByUser`; `applyDefaultRate(rate)` no-op kalau flag itu true. `app.ts` `renderActivity()` memanggilnya tiap render: Listening step ≥1 → `listeningDefaultRate(contentLevel)` (Little Stars/Starter/Explorer 0.75x; Adventurer/Achiever/Trailblazer 1x), selain itu (Kenalan, skill lain) 0.75x. State kecepatan cuma di memori (reload = default lagi).
- **2 suara** — `speech.ts` `speakDialogue(lines: {text, gender}[], gapMs)`: voice wanita/pria dari `pickVoice(aksen, gender)`; kalau keduanya resolve ke voice yang sama, dibedakan `pitch` (1.25 vs 0.75, belum diuji di device 1-voice). Pilihan gender global user tidak dipakai di dialog. Gender tokoh: tabel nama `MALE_SPEAKERS` di `games/listening.ts` (`dialogueGenders`); 2 tokoh yang kebetulan sama gender otomatis dipaksa beda. **Tokoh dialog baru → tambahkan nama pria ke `MALE_SPEAKERS`** (nama lain dianggap wanita).
- **Tier helper** (`games/listening.ts`): `listeningDefaultRate`, `listeningGapMs`, `hintEliminatesOptions`, semuanya dari `contentLevel`. `runLatihanIntiSentence`/`runTantanganNote`/`runTantanganDialogue` sekarang menerima parameter `contentLevel` (setelah `level`).
- **Distraktor lisan** — 5 `notePassage` Achiever diedit (1 kalimat/topik, jumlah kalimat tetap): `siapa-dia` (usia "eleven" disebut), `akhir-pekan-seru` (video game), `di-taman-bermain` (under the slide), `teman-baikku` (heights), `di-toko-kerajinan` (glitter pertama "dark"; pertanyaan gap diubah jadi "How is the glitter that Made picks?" biar tidak ambigu). 5 topik lain sudah menyebut pilihan salah secara insidental. Aturan authoring: sebut pilihan salah sebagai hal yang **bukan** jawaban ("but…", "instead"), jangan bikin 2 opsi sama-sama benar.
- **Diverifikasi live** (Playwright, 390px & 1280px): pill kecepatan tertandai benar per level & pilihan manual bertahan saat pindah tahap; Petunjuk Latihan Inti eliminasi 2 (Little Stars) vs 0 (Achiever/Trailblazer); dialog Trailblazer bergantian Samantha/Aaron dengan jarak 1200 ms; `npm run build` lolos.

## Gotcha

- Pakai **`contentLevel`** (level topik yang tampil), BUKAN `level` (badge/praise anak). Listening sudah punya contoh benar: `renderKenalanSentence`/`runSusunKalimatSentence` menerima `contentLevel`. Fungsi format lama (`runLatihanInti`/`runTantangan` Explorer–Adventurer) belum menerima parameter itu — tambahkan bila usulan #2–#4 dikerjakan.
- `setPlaybackRate` hanya menerima nilai `SPEEDS` (0.5, 0.75, 1, 1.25, 1.5); default per level harus salah satunya (`listeningDefaultRate` mengembalikan `0.75 | 1`).

## Batasan Riset (Jujur)

- Deskriptor CEFR dibaca dari halaman sekunder (EF SET, cefr.app, ringkasan pencarian) karena PDF Council of Europe menolak akses (403) — kutipan A1/A2/B1 konsisten antar sumber, tapi bukan dari teks primer.
- Angka wpm tidak ditemukan di sumber resmi; hanya ringkasan sekunder (±100–120 wpm utk A1–A2) yang **tidak dipakai** sebagai dasar angka.
- Handbook YLE & ETS RM-16-02 dibaca langsung (teks penuh diekstrak) — confidence tinggi. Halaman format Cambridge, LIA, EF via ringkasan fetch — confidence sedang.
- PTE Young Learners (Pearson) dicek tapi datanya tidak konsisten → tidak dipakai. Kumon/Cakap: tidak ada rincian listening per level.

## Sumber

- Cambridge YLE Handbook for Teachers: https://www.britishschoolrc.com/userfiles/files/Young_Learners_English_Handbook.pdf
- Cambridge format: [Starters](https://www.cambridgeenglish.org/exams-and-tests/qualifications/young-learners/paper/starters/format/), [Movers](https://www.cambridgeenglish.org/exams-and-tests/qualifications/young-learners/paper/movers/format/), [Flyers](https://www.cambridgeenglish.org/exams-and-tests/qualifications/young-learners/paper/flyers/format/), [A2 Key](https://www.cambridgeenglish.org/exams-and-tests/qualifications/key/format/), [B1 Preliminary](https://www.cambridgeenglish.org/exams-and-tests/qualifications/preliminary/format/)
- ETS RM-16-02 Designing the TOEFL Primary Tests: https://www.ets.org/Media/Research/pdf/RM-16-02.pdf ; konten tes: https://www.ets.org/toefl/primary/test-content.html
- CEFR listening (A1/B1): https://www.efset.org/cefr/a1/ , https://www.efset.org/cefr/b1/ , https://cefr.app/insight/reception
- Double play: https://eprints.lancs.ac.uk/id/eprint/139699/ (Field/Holzknecht), TESOL Quarterly 2024: https://onlinelibrary.wiley.com/doi/full/10.1002/tesq.3249
- LIA GEYL: https://www.lia-depok.ac.id/program/reguler/?id=11 , https://liasemarang.com/programs/untuk-siswa-sd/english-for-chidren-ec/
- EF (English1): https://english1.co.id/highflyers , https://english1.co.id/trailblazers

# Speaking

Status: **riset selesai 2026-09-24; usulan #1–#8 SUDAH DIIMPLEMENTASIKAN** (`games/speaking.ts`, bersamaan dgn penyeragaman alur Speaking semua level — `speaking.md` §19–§20). Angka tetap [U] sampai diuji ke anak & mic sungguhan — semua angka & aturan bertanda **[F]** (fakta dari sumber) atau **[U]** (usulan desain, belum diuji). Pertanyaan yang dijawab: selain FORMAT soal, apa yang membedakan level Speaking di lembaga lain, dan mana yang layak ditiru app ini.

Speaking punya **2 lapis pembeda**, jangan dicampur (pola sama Listening):
1. **Lapis format & konten (SUDAH ADA)** — 4 format berdampingan (frasa → model/drill/roleplay → cerita → interview) + konten yang naik (sebut benda → deskripsi+"because" → opini+perbandingan → interview). Alasan & riset: [speaking.md](speaking.md) §0, §4, §13–§14, §18 (pilot "Ngobrol" Little Stars). Dokumen ini TIDAK mengulang itu.
2. **Lapis mekanik (dokumen ini)** — panjang jawaban yang diharapkan, ketatnya skor, banyaknya bantuan/contoh, kecepatan contoh suara, waktu berpikir.

## Ringkasan (High-Level)

Temuan inti:
1. **[F]** Cambridge membedakan level Speaking lewat 5 hal: (a) **panjang jawaban** (1 kata → frasa/kalimat → "extended responses" → "extended stretches of language"), (b) **banyaknya bantuan penguji** ("help sometimes" → "very little help" → "minimal"), (c) **aspek pelafalan yang dinilai** (Starters: bunyi & tekanan kata saja, intonasi TIDAK dinilai; Movers ke atas + intonasi; KET: "intelligibility is key"; PET: + tekanan kalimat), (d) **kriteria baru yang muncul** (Movers: "extended responses"; Flyers: + grammar & vocabulary; PET: + discourse management/kohesi), (e) **siapa yang bertanya** (Flyers Part 2: anak ikut MEMBUAT pertanyaan; KET/PET: berpasangan).
2. **[F]** Yang **KONSTAN** di semua level YLE: penguji selalu boleh memberi "help and encouragement" (skrip resmi), pendamping ("usher") menjelaskan tes dalam **bahasa ibu anak**, dan jeda/ragu wajar di band tertinggi pun ("occasional pauses", "minor hesitations"). Jadi instruksi berbahasa Indonesia & retry bebas **bukan** pembeda — tetap di semua level.
3. **[F]** Handbook YLE memperingatkan anak jangan memaksa "jawaban panjang yang tidak perlu" dan menerima jawaban sederhana ("Here red and here yellow" untuk "find the differences") — panjang jawaban naik PELAN, bukan dipaksakan.
4. **[F]** TOEFL Primary membagi tugas Speaking jadi 2 skala: tugas pendek (deskripsi, permintaan, bertanya, perasaan/opini — skor 0–3) vs tugas panjang (menceritakan urutan kejadian, memberi arah — skor 0–5, menilai "connecting devices"). Skor terendah = "a single word or a few words", tertinggi = "full and complete... connecting devices".
5. **Gap terbesar di app sekarang**: mekanik Speaking **identik di 6 level** — ambang bintang (≥80% = ⭐⭐⭐, ≥40% = ⭐⭐), kecepatan contoh suara (0.75x), waktu tunggu mic (1,3 dtk hening / maks 15 dtk), 💡 Petunjuk tersedia sejak awal, jawaban diskor thd frasa target tanpa melihat PANJANG ucapan. Lapis 1 (format/konten) sudah beda, lapis 2 nol.

### Tier yang Diusulkan (semua [U], belum diuji ke anak)

| Level | Tier | Panjang jawaban Tantangan | Ambang ⭐⭐⭐ / ⭐⭐ | 💡 Petunjuk | Jangkar Indonesia | Kecepatan contoh | Hening sebelum mic berhenti |
|---|---|---|---|---|---|---|---|
| Little Stars | Dasar | 1 kata → 1 frasa pendek | **60% / 30%** | sejak awal | ada (kata + arti) | 0.75x | **2 dtk** |
| Starter | Dasar | 1 frasa / kalimat pendek | 60% / 30% | sejak awal | ada | 0.75x | 2 dtk |
| Explorer | Menengah | 1 kalimat | 80% / 40% (sekarang) | sejak awal | pertanyaan saja | 0.75x | 1,6 dtk |
| Adventurer | Menengah | 1–2 kalimat + alasan ("because") | 80% / 40% | sejak awal | pertanyaan saja | **1x** | 1,6 dtk |
| Achiever | Lanjut | 2–3 kalimat + penghubung | 80% / 40% + **bonus penghubung** | **setelah 1x coba** | tidak ada | 1x | 1,3 dtk (sekarang) |
| Trailblazer | Lanjut | 3+ kalimat (~30 dtk), opini + alasan | 80% / 40% + bonus penghubung | setelah 1x coba | tidak ada | 1x | 1,3 dtk |

Intinya: **Dasar** = skor longgar, waktu berpikir panjang, bantuan penuh (ASR suara anak kecil paling tidak akurat, dan Starters sendiri cuma minta 1 kata). **Menengah** = sama seperti sekarang, tapi jawaban Tantangan mulai dituntut berupa kalimat. **Lanjut** = jawaban lebih panjang & tersambung, bantuan baru dibuka setelah mencoba — mendekati KET/PET ("very little prompting and support").

## Kondisi Sekarang (Baseline di Kode)

| Aspek | Sekarang | Beda per level? |
|---|---|---|
| Format & konten | 4 format + konten naik | **Ya** (lapis 1) |
| Ambang bintang mic | `scoreMic`: ≥0.8 ⭐⭐⭐, ≥0.4 ⭐⭐, min ⭐ (sama di `boss.ts`, `vocabulary.ts`) | Tidak |
| Yang diskor | rasio kata target yang terdengar (`wordMatchDetail`); pilot "Ngobrol" giliran 2: kata kunci isi (`talkKeywords`) | Tidak |
| Panjang ucapan | tidak dinilai sama sekali | Tidak |
| Contoh suara (model) | Latihan Inti selalu auto-play; interview Trailblazer: Bima auto di Latihan Inti, lewat Petunjuk di Tantangan | Sebagian (per format) |
| 💡 Petunjuk Tantangan | tersedia sejak awal di semua format | Tidak |
| Kecepatan TTS | `DEFAULT_RATE` 0.75x (Speaking tidak ikut `listeningDefaultRate`) | Tidak |
| Waktu tunggu mic | `SILENCE_GRACE_MS` 1300, `MAX_LISTEN_MS` 15000 (`speech.ts`, global) | Tidak |
| Retry / Lanjut / Play Suaramu | tanpa batas, selalu ada | Tidak (sengaja) |
| Parameter `contentLevel` | TIDAK ADA di `games/speaking.ts` — cuma `level` (praise) | — |

## Bukti Riset per Sumbu

| Sumbu | Temuan | Sumber |
|---|---|---|
| **Panjang jawaban** | Starters P3: "answer simple questions about a picture (with one-word answers)" — *What's this? (elephant)*. Movers: dinilai "production of appropriate and **extended** responses", cerita 4 gambar tapi "only expected to say a few words about each picture". Flyers: + cerita 5 gambar; rubrik band 5 "single words, phrases, and long sentences". KET band 5: "constructs **longer utterances**"; band 3: "very short – words or phrases". PET: long turn **1 menit** per kandidat (deskripsi foto); Part 3 = kesempatan utama menilai *discourse management* di "extended speech". CEFR produksi lisan: A1 "simple, mainly isolated phrases" → A2 "series of simple phrases and sentences linked into a list" → B1 "straightforward description... as a linear sequence of points". | Handbook YLE; flyer.us (rubrik YLE); Cambridge A2 Key & B1 Preliminary *Assessing speaking*; CEFR |
| **Bantuan penguji** | Semua level YLE: skrip "gives examiners scope to offer help and encouragement"; Movers/Flyers: "The examiner will prompt by asking a question if a candidate needs help". Band 5 per level: Starters "requires help sometimes", Movers "very little help", Flyers "minimal assistance... immediate responses". KET: band 5 "very little prompting and support", band 3 "requires prompting and support". | Handbook YLE; flyer.us; A2 Key guide |
| **Pelafalan** | Starters: bunyi & tekanan kata, **intonasi tidak dinilai**. Movers/Flyers: + intonasi kata & kalimat. KET: "at A2 level **intelligibility** is key". PET: + tekanan kalimat & intonasi "generally appropriate". | flyer.us; A2 Key guide; B1 Preliminary guide |
| **Kriteria bertambah** | Starters: *interactive listening, production of words and phrases, pronunciation*. Movers: + "extended responses". Flyers: + **grammar and vocabulary**. KET: G&V, pronunciation, interactive communication. PET: + **discourse management** (organisasi, penghubung/"cohesive devices") & G&V band 5 "attempts some complex grammatical forms". TOEFL Primary tugas panjang: "coherence may be assisted by use of connecting devices". | Handbook YLE; A2 Key & B1 Preliminary guides; ETS scoring guide |
| **Kelancaran / jeda** | Band 5 pun masih boleh ragu: Starters "occasional pauses", Movers "occasional pauses", Flyers "occasionally minor hesitations"; KET band 5 "despite hesitation". Toleransi jeda turun pelan, tidak pernah nol. | flyer.us; A2 Key guide |
| **Siapa yang bertanya** | Flyers P2: anak menjawab LALU **membuat pertanyaan** ("question-word questions" Who/What/When/Where/How old). KET/PET: berpasangan, "initiates and responds". | Handbook YLE; A2 Key & B1 Preliminary guides |
| **Bahasa pengantar** | Semua level YLE: usher "explains the test format in the child's first language". | Handbook YLE |
| **Kurikulum Merdeka** | Fase A: salam, kenalan, info diri. Fase B: "mengubah/mengganti sebagian elemen kalimat" (pola tetap) utk perasaan/kebutuhan/minta tolong. Fase C: + "membuat pertanyaan sederhana, meminta klarifikasi". Fase D: "bertukar ide, pengalaman... memberikan pendapat, membuat perbandingan, menyampaikan preferensi... menjelaskan dan memperjelas jawaban". | CP Kemendikbud (ringkasan pencarian) |
| **LIA / EF** | LIA GEYL: 6 level per kelas SD, metode storytelling + role-play + proyek (tidak menerbitkan mekanik per level). EF: Small Stars 3–6, High Flyers 7–9/10, Trailblazers 10–14 (presentasi/opini — detail lama di speaking.md §4.2). Keduanya **tidak menerbitkan** rincian skor/bantuan per level. | LIA Depok/Semarang; EF/English1 |

## Rujukan Institusi

**Cambridge — struktur Speaking per tingkat**

| Level app | Backbone | Durasi | Bagian | Yang dinilai |
|---|---|---|---|---|
| Little Stars/Starter | (pra-Starters) | — | — | — |
| Explorer | Pre A1 Starters | 3–5 mnt, 5 bagian, 1 anak + 1 penguji | tunjuk di gambar; taruh kartu; jawab pertanyaan gambar (1 kata); tanya soal kartu benda; pertanyaan pribadi | mendengar-interaktif, kata & frasa, pelafalan (tanpa intonasi) |
| Adventurer | A1 Movers | 5–7 mnt, 4 bagian | 4 perbedaan; cerita 4 gambar; odd one out + alasan; pertanyaan pribadi | + jawaban panjang ("extended"), + intonasi |
| Achiever | A2 Flyers | 7–9 mnt, 4 bagian | 6 perbedaan dari pernyataan penguji; **jawab & buat pertanyaan**; cerita 5 gambar; pertanyaan pribadi | + grammar & vocabulary |
| Trailblazer | A2 Key → B1 Preliminary | KET 8–10 mnt / PET 10–12 mnt, **berpasangan** | KET: interview + diskusi berpasangan. PET: interview, deskripsi foto 1 mnt, diskusi kolaboratif, diskusi umum | G&V, pelafalan, interaksi; PET + discourse management |

**TOEFL Primary Speaking (ETS)** — tugas pendek (skor 0–3): *express emotions/opinions, give simple descriptions, make requests, ask questions*; tugas panjang (skor 0–5): *explain & sequence simple events, give directions*. Skor 1 = "a single word or a few words related to the prompt"; skor 5 = "full and complete... connecting devices... fluid, confident".

## Status Implementasi (2026-09-24)

| # | Status | Di kode |
|---|---|---|
| 1 | ✅ | `STAR_CUTS` (Dasar 0.6/0.3) — berlaku semua mic Speaking termasuk Kenalan (keadilan ASR, bukan tingkat kesulitan) |
| 2 | ✅ | `TARGET_WORDS` (0/0/4/8/12/18 kata) — baris "🎯 Minimal N kata" + lencana "🗣️ N kata"; skor jawaban bebas = panjang/target |
| 3 | ✅ | `CONNECTORS` — lencana "🔗 Pakai …" + 1 ⭐ bonus (jawaban bebas) di Achiever/Trailblazer |
| 4 | ✅ | 💡 Petunjuk Tantangan 🔒 sampai 1x coba di tier Lanjut |
| 5 | ✅ | Dasar: chip kata Indonesia; Menengah: arti pertanyaan tampil; Lanjut: arti disembunyikan sampai Petunjuk. Latihan Inti tetap tampil arti di semua level (jangkar "Lengkapi Kalimat") |
| 6 | ✅ | `speakingDefaultRate` dipanggil `app.ts` `renderActivity` (Latihan Inti & Tantangan) |
| 7 | ✅ | `SILENCE_MS` → `listenAndRecordOnce(..., { silenceMs })`, default global tetap 1300 |
| 8 | ✅ | Tantangan tab "🙋 Giliranmu Bertanya" (mulai Starter): Starter "Tebak Isi Kotak" ("Is it … ?"), Explorer+ "Tanya Temanmu" (ucapkan pertanyaan dari artinya; chip kata tanya di Menengah). Tanpa LLM — pertanyaan & jawaban teman diambil dari data yang sudah ada. Versi berpasangan sungguhan (2 anak) tetap di luar jangkauan app solo |

## Usulan (Riset Awal)

| # | Usulan | Dasar bukti | Usaha | Catatan |
|---|---|---|---|---|
| 1 | **Ambang bintang per tier** — Dasar 60%/30%, Menengah & Lanjut tetap 80%/40% | Starters cuma 1 kata & tanpa intonasi; ASR suara anak kecil paling meleset | Rendah | `scoreMic` terima `contentLevel`. **Jangan naikkan** ambang Lanjut — skor app mengukur kata yang dikenali ASR, BUKAN pelafalan, jadi "lebih ketat" hanya menghukum ASR |
| 2 | **Target panjang jawaban di Tantangan jawaban-bebas** (roleplay, interview, pilot "Ngobrol" giliran 2) — Explorer 1 kalimat, Adventurer 1–2 + "because", Achiever 2–3, Trailblazer 3+ | Movers "extended", KET "longer utterances", PET long turn 1 mnt, CEFR A1→B1 | Sedang | Tampil sbg indikator ramah ("🗣️ 2 kalimat ✓"), bukan syarat lanjut; hitung kata/kalimat dari transkrip |
| 3 | **Bonus penghubung** (Achiever/Trailblazer): ⭐ ekstra kalau terdengar *because/and/but/so/then/however* | Discourse management PET, "connecting devices" TOEFL Primary | Rendah | Bonus saja, tidak pernah mengurangi bintang |
| 4 | **Petunjuk bertingkat** — Dasar/Menengah sejak awal; Lanjut baru terbuka setelah 1x coba | KET "very little prompting", Flyers "minimal assistance" | Rendah | Pola sama `clueButtonsHtml` Listening (gated `attempted`) |
| 5 | **Jangkar Indonesia makin tipis** — Dasar: kata + arti; Menengah: arti pertanyaan saja; Lanjut: Inggris saja (arti via Petunjuk) | Fase A–B masih pola tetap; Fase D bertukar ide dlm Inggris | Rendah | Instruksi layar tetap Indonesia di semua level (usher YLE pakai bahasa ibu) |
| 6 | **Kecepatan contoh per level** — samakan dgn Listening (0.75x s.d. Explorer, 1x Adventurer ke atas) | CEFR A1 "very slow" → B1 "clearly articulated" | Rendah | `applyDefaultRate` di `renderActivity` sudah ada, tinggal ikutkan Speaking; pill user tetap menang |
| 7 | **Waktu berpikir** — hening sebelum mic berhenti 2 dtk (Dasar), 1,6 dtk (Menengah), 1,3 dtk (Lanjut, sekarang) | Starters band 5 masih "occasional pauses"; anak kecil butuh waktu mulai bicara | Sedang | `SILENCE_GRACE_MS` sekarang global di `speech.ts` → perlu parameter; dipakai juga Vocab/Placement, jangan ubah default global |
| 8 | **Anak bertanya** (Flyers P2) & **berpasangan** (KET/PET) | Handbook YLE, KET/PET | Tinggi | Ini lapis 1 (format), sudah dicatat sbg rencana di speaking.md §18.6 |

Urutan yang disarankan kalau dikerjakan: #1, #6, #4, #5 (murah, mekanik saja) → #3, #2 (butuh hitung transkrip) → #7 (menyentuh `speech.ts` bersama) → #8 (format baru, keputusan user).

## Yang SENGAJA Tidak Dibedakan

1. **Retry tanpa batas, "Lanjut" selalu ada, bintang minimal 1, ▶️ Play Suaramu** — Aturan Wajib Speaking & non-punitive (CLAUDE.md); penguji YLE di semua level pun diberi ruang "help and encouragement".
2. **Instruksi layar berbahasa Indonesia** — usher YLE menjelaskan dalam bahasa ibu di SEMUA level.
3. **Intonasi & tekanan kalimat** — dinilai Cambridge mulai Movers, tapi Web Speech API tidak mengekspos data pelafalan; app hanya tahu kata apa yang dikenali. Jangan klaim menilai intonasi.
4. **Skor mic tidak masuk akurasi** (`recordAttempt`) — tetap di semua level (ASR anak tidak selalu akurat).
5. **Kenalan** — tahap exposure, sama keputusan Vocabulary/Listening.

## Gotcha

- `games/speaking.ts` **belum menerima `contentLevel`** — semua fungsi cuma dapat `level` (badge/praise). Tambahkan parameter terpisah sebelum mengerjakan usulan mana pun (lihat "⚠️ Gotcha" Vocabulary di atas).
- Ambang `hitRatio >= 0.8 / 0.4` diduplikasi di `speaking.ts`, `boss.ts`, `vocabulary.ts` (3 tempat). Usulan #1 cuma untuk skill Speaking; mic di Vocab/Boss tidak ikut kecuali diputuskan.
- `SILENCE_GRACE_MS` dipakai semua mic app (termasuk First Placement Test) — usulan #7 harus lewat parameter opsional, default tetap 1300.

## Batasan Riset (Jujur)

- Handbook YLE dibaca langsung (teks penuh diekstrak) & panduan *Assessing speaking* A2 Key dibaca langsung → confidence tinggi. Rubrik band per level YLE (help sometimes/very little/minimal) dari ringkasan pihak ketiga (flyer.us) → confidence sedang.
- Panduan B1 Preliminary hanya sebagian terbaca (kutipan "attempts some complex grammatical forms", long turn 1 menit, Part 3 = discourse management); deskriptor lengkap tiap band tidak terekstrak.
- Kurikulum Merdeka dari ringkasan hasil pencarian (situs Kemendikbud tidak bisa diakses dari sesi ini).
- LIA & EF tidak menerbitkan mekanik speaking per level; Kumon/Cakap tidak dicek ulang (sesi lama tidak menemukan rincian).
- Semua angka usulan (60/30%, 2 dtk, jumlah kalimat) adalah **desain**, bukan angka dari sumber — wajib diuji ke anak & ASR sungguhan.

## Sumber

- Cambridge YLE Handbook for Teachers: https://www.britishschoolrc.com/userfiles/files/Young_Learners_English_Handbook.pdf
- Rubrik Speaking Starters/Movers/Flyers (ringkasan): https://flyer.us/cambridge-starters-movers-flyers-speaking-criteria-detailed-band-scores/
- A2 Key — Assessing speaking (teacher guide): https://www.cambridgeenglish.org/Images/735386-a2-key-teacher-guide-assessing-speaking.pdf
- B1 Preliminary — Assessing speaking performance: https://www.cambridgeenglish.org/Images/563276-b1-preliminary-assessing-speaking.pdf
- Cambridge blog, speaking A2 Key & B1 Preliminary: https://www.cambridge.org/elt/blog/2026/01/29/your-guide-to-teaching-speaking-skills-for-a2-key-and-b1-preliminary-exams/
- TOEFL Primary Speaking scoring guide: https://www.ets.org/s/toefl_primary/pdf/toefl_primary_speaking_scoring_guide.pdf
- CEFR spoken production (A1/A2/B1): https://www.coe.int/en/web/common-european-framework-reference-languages/level-descriptions , https://www.kcl.ac.uk/language-centre/assets/can-do-statements-cefr.pdf
- Kurikulum Merdeka CP Bahasa Inggris: https://guru.kemdikbud.go.id/kurikulum/referensi-penerapan/capaian-pembelajaran/sd-sma/bahasa-inggris/fase-b/ , …/fase-c/ , …/fase-d/
- LIA GEYL: https://www.lia-depok.ac.id/program/reguler/?id=11 , https://liasemarang.com/programs/untuk-siswa-sd/english-for-chidren-ec/
- EF (English1): https://english1.co.id/smallstars , https://english1.co.id/highflyers , https://english1.co.id/trailblazers


# Grammar

# Reading
