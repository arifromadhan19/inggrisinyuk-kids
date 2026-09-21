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

**Status skill lain**: Listening — riset selesai, usulan ada di section bawah (BELUM diimplementasi). Speaking/Grammar/Reading — placeholder masih kosong, menunggu giliran/permintaan user berikutnya.

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
| Explorer | Menengah | 0.75x | 1900 ms (cerita) | primer tanya-jawab 2 suara; 2 dari 10 cerita dialog 2 suara | halus 40% + opsi jebakan acak | eliminasi 2 (sudah) |
| Adventurer | Menengah | 1x | 1900 ms (cerita) | primer tanya-jawab 2 suara; 4 dari 10 cerita dialog 2 suara | halus 60% + 4 dari 10 soal punya opsi ke-3 + jebakan acak | eliminasi 2 (sudah) |
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
- **2 suara di format lama**: `ListeningTopic.storyVoices` (gender per baris `story`); primer tanya-jawab (baris pertama berakhiran "?") otomatis wanita/pria bergantian di Kenalan. Achiever: `notePassage[].speaker` (semua baris atau tidak sama sekali).

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

# Grammar

# Reading
