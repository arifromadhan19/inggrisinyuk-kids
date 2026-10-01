# Audit Bahasa Materi & Game — Daftar Issue dan Solusi

Tanggal audit: 2026-10-01 · Cakupan: seluruh materi 5 skill × 6 level (`app/src/content.ts`) + data 7 game Game Hub & Placement Test (`app/src/games/*-data.ts`, `app/src/placement-test-data.ts`).

Yang dicek: grammar Inggris (SPOK, tense, artikel, agreement, preposisi), kealamian kalimat Inggris, ketepatan & kealamian terjemahan Indonesia (KBBI/PUEBI), kecocokan `en`↔`id`, kebenaran kunci jawaban (tepat 1 opsi benar, pengecoh memang salah), dan kesesuaian level. Semua data dibaca utuh, tidak disampling.

## 0. Status Perbaikan (2026-10-01)

**Sudah diperbaiki: 9 issue H + ±285 issue M/L** di `app/src/content.ts`, `app/src/games/*-data.ts` (6 file), dan `app/src/placement-test-data.ts`. `npm run build` lolos: typecheck, verify:content, verify:duplicates, dan verify:boss. Cek tampilan live di 390px & 1280px juga lolos: 0 pageerror dan tanpa scroll horizontal.

Ada perbaikan tambahan di luar tabel: pola P5 ("What does **the** seller/coach/conductor/staff member say?", 8 soal), "bak mandi" → "bak rendam" & "Seniman itu sedang melukis." di Reading, Farm = "Pertanian" di Speaking & Grammar Starter, dan Corner = "Pojok"/"tikungan" di Listening Achiever.

Beberapa perbaikan menyimpang dari saran tabel karena saran aslinya melanggar aturan build/proyek:
- **Batas panjang kalimat**: G3 jadi "The door is rectangular.", G14 kalimat dipersingkat.
- **Soal punya 2 jawaban benar**: C4 & C7 tidak memakai past simple di `originalOptions`, karena kalimat past simple bisa dilaporkan tanpa geser tense.
- **Gagal cek build**:
  - A17: kata target "Superhero" harus tetap utuh di kalimat contoh.
  - A49: jawaban Story Quest jadi bisa ditebak dari teks.
  - B17: kata `cue` tidak boleh ada di kalimat berumpang.
  - F26: pertanyaan kembar dengan soal lain.
- **Menghindari sinyal ganda**: B7 "I want a melon.".

**Sengaja tidak diubah**:
- A38 ("Bahasa Inggris" = nama mapel)
- C26 (contoh klasik buku teks)
- C28 ("battery runs out" = habis, bukan lari)
- F33 & id topik lain (kunci progres anak)
- A46 (koma di Sentence Puzzle butuh perubahan `tokenize()`, karena koma akan jadi gelembung kata "cold,")

## 1. Ringkasan

| Bagian | Item dicek (±) | H | M | L | Total |
|---|---|---|---|---|---|
| A. Vocabulary (6 level) + Game Hub + Placement | 1.680 | 3 | 29 | 18 | 50 |
| B. Grammar LS–Achiever + Speaking LS–Adventurer | 1.150 | 1 | 24 | 12 | 37 |
| C. Grammar Trailblazer + Speaking Achiever/Trailblazer | 1.340 | 2 | 16 | 22 | 40 |
| D. Listening Little Stars + Starter | 210 item (≈840 kalimat) | 0 | 15 | 14 | 29 |
| E. Listening Explorer + Adventurer | 290 | 1 | 11 | 13 | 25 |
| F. Listening Achiever + Trailblazer | 1.000 kalimat | 1 | 27 | 16 | 44 |
| G. Reading Little Stars + Starter + Explorer | 1.500 | 1 | 16 | 14 | 31 |
| H. Reading Adventurer + Achiever | 1.050 | 0 | 7 | 14 | 21 |
| I. Reading Trailblazer | 550 | 0 | 13 | 16 | 29 |
| **Total** | **±9.000** | **9** | **158** | **139** | **306** |

**Sev**: **H** = salah grammar / terjemahan salah arti / kunci jawaban salah (soal punya 2+ jawaban benar) — wajib diperbaiki. **M** = gramatikal tapi janggal, atau terjemahan kurang tepat — sebaiknya diperbaiki. **L** = typo, tanda baca, kapital, gaya — opsional.

**Kesimpulan umum**: kualitas bahasa secara keseluruhan **baik**. Kalimat target Inggris hampir tidak ada yang salah grammar. Hampir semua kunci jawaban benar: `wrong[]` Grammar, `reportedOptions`, `evidence` Reading, dan `tfn` sudah dicek dan konsisten. Masalah terbanyak ada di **terjemahan Indonesia yang harfiah atau tidak konsisten** dan **kalimat Inggris yang gramatikal tapi kurang natural**. Ada 9 soal yang harus segera diperbaiki karena kuncinya ambigu atau terjemahannya salah arti.

> Catatan lokasi: kolom "Lokasi field" memakai path data (mis. `items[3].example.id`) di dalam topik dengan `id` yang disebut. Nama field sama dengan di `content.ts`; cari topiknya dengan `id: '<topik>'`, lalu grep teks persisnya.

## 2. Prioritas 1 — 9 Issue Berat (Sev H), nomor K1–K9

| # | Bagian | Topik / lokasi | Masalah | Solusi |
|---|---|---|---|---|
| K1 | E · Listening Explorer | `dari-mana` · `kenalanGame[6].question` "Which city is the capital?" | Negaranya tidak disebut, padahal keempat opsi (Tokyo/Seoul/Bangkok/Jakarta) semuanya ibu kota. Akibatnya **4 jawaban benar**. | "Which city is the capital of Japan?" / "Kota mana yang jadi ibu kota Jepang?" |
| K2 | F · Listening Achiever | `akhir-pekan-seru` · `noteGaps[2].options` Chess / Video Game / Board Game | Catur adalah board game, jadi **2 jawaban benar**. | Ganti "Board Game" dengan "Cards"/"Football" (yang tidak disebut di passage) dan sesuaikan `decoys`. |
| K3 | B · Grammar Achiever | `zero-conditional` · `texts[2]`, key `it`, wrong `he` | Kucing peliharaan wajar disebut "he", jadi pengecoh ikut benar. Kata "it" juga ambigu (bisa merujuk "a can"). | Ganti `he` di `wrong` dengan `them`/`we`. Perjelas: "If Sari opens a can of fish, the cat runs…" atau ubah kunci soal. |
| K4 | C · Grammar Trailblazer | `reported-time-place` · `transforms[6].originalOptions[2]` "I was staying here for two more days." | Past continuous biasanya tidak digeser saat dilaporkan, jadi hasilnya sama dengan kunci. Akibatnya **2 jawaban benar** di Tantangan. | Ganti dengan "I stayed here for two days last month." atau "I have stayed here for two days." |
| K5 | C · Speaking Achiever | `cerita-dan-alasan` · `stories[4].answer` "Tia has the better habit." | Pertanyaan meminta "…and why?", tapi jawaban target tidak berisi alasan. Anak yang menjawab lengkap malah dapat skor lebih rendah. | "Tia's habit is better because she doesn't forget her homework." / "Kebiasaan Tia lebih baik karena dia tidak lupa PR." |
| K6 | G · Reading Starter | `baca-alam` · `newTexts[1].questions[2]` "The moon is round." 🌙 = Salah | Bulan memang bulat, jadi anak yang tahu fakta itu akan menjawab Benar. | "The moon is square." dengan 🌕 (Salah), atau ganti gambarnya ke ⭐. |
| K7 | A · Vocab Explorer | `pesta-perayaan` · `items[8]` "I make a wish." = "Aku membuat harapan." | Terjemahan harfiah yang artinya bergeser. | Kata `id`: "Permohonan"; contoh: "Aku mengucapkan permohonan." |
| K8 | A · Vocab Trailblazer | `peralatan-elektronik` · `items[1].example.id` "Aku menjawab telepon." | "answer the phone" artinya mengangkat telepon. | "Aku mengangkat telepon." |
| K9 | A · Vocab Starter | `hari-dalam-seminggu` · `items[7].example.en` "What day is today?" | Penutur asli bilang "What day is it today?". Kalimat ini juga dipakai di Susun Kalimat dan diucapkan anak. | "What day is it today?" ("today" tetap ada, jadi `blankSentence` aman). |

## 3. Pola Berulang & Solusi Sistematis

Pola di bawah muncul di banyak topik. Lebih efisien diperbaiki per pola (grep lintas `content.ts`) daripada per baris.

### P1. Satu kata, banyak terjemahan Indonesia dalam 1 item/topik
Contoh: Cross = "Tanda Plus" vs "tanda silang"; wajik/belah ketupat; pizza/piza; yogurt/yoghurt; biskuit/kue kering; hadiah/kado; buncis/kacang; petugas/penjaga; IPA/sains; kunci Inggris/kunci pas; `nearId` beda kata dari `id`.
**Solusi**: tetapkan 1 padanan baku per kata dan pakai sama persis di `id`, `example.id`, `practice.id`, `test.id`, `nearId`, dan label opsi. Usulan: tambah cek otomatis di `verify-vocab-content.mjs`, yaitu kata Indonesia item (`item.id`, huruf kecil) harus muncul di `example.id` (warning dulu, bukan error).

### P2. Terjemahan harfiah / kolokasi Indonesia salah
Contoh: "membuat harapan", "menjawab telepon", "berbisik rahasia" (berbisik intransitif → "membisikkan rahasia"), "pertama di antrean", "memenangkan beasiswa", "Tiketnya, tolong!", "Kebun binatang punya hewan besar", "Ruang tamu punya sofa besar", "Kamu merasa apa?", "Tepuk tanganmu!".
**Solusi**: terjemahkan maknanya, bukan kata per kata. Untuk *has* yang bukan kepemilikan pakai "ada"/"memiliki" ("Di kebun binatang ada hewan besar"). Grep pola: `punya`, `berbisik rahasia`, `tolong!`, `di antrean`.

### P3. Kata ganti & sapaan Indonesia
- he/she/his/her diterjemahkan "kakak laki-laki/perempuan" (Grammar Starter `miliknya-siapa`, `dia-siapa`). Ini menambah arti → ganti "Dia (laki-laki)" / "mejanya (dia laki-laki)", pola yang sudah dipakai Explorer. Kalau "kakak" sengaja dipakai sebagai proxy karakter, pindahkan ke **label kartu** saja, bukan ke terjemahan kalimat.
- "We are boys/singers" diterjemahkan "Kita …". Untuk pernyataan ke lawan bicara yang benar **"Kami"** ("Kita" hanya bila lawan bicara ikut termasuk). Grammar Starter `kita-mereka` & `milik-kita-milik-mereka`, label kartu ikut disesuaikan.
- Sapaan kapital (PUEBI): "Terima kasih, Mama!", "Selamat pagi, Bu Guru!"; EN "Mom/Dad" sebagai panggilan juga kapital. Ini muncul di Vocab, Speaking, dan Listening LS.
- Ejaan KBBI: mi (bukan mie), trem, gim, bersenang-senang, tidak apa-apa (bukan "tidak apa"), "menjenguk" hanya untuk orang sakit.

### P4. Kalimat Inggris gramatikal tapi tidak natural
Contoh: "What day is today?", "The zoo is far." → "far away", "It is drizzly" → "It is drizzling", "on your foot" → "on your feet", "in the day" → "during the day", "the left way" → "going left", "Number nine is…" → "The number nine…", "even just a short walk" → "even if it is just a short walk", "at my own speed" → "pace", "Let us eat" → "Let's eat", "I want a grape" → "some grapes", "He could catch the ball yesterday" → "was able to".
**Solusi**: ganti dengan versi di kolom saran. Perhatikan aturan build di §4, misalnya kata target harus tetap ada di kalimat.

### P5. Label penutur/opsi yang dipakai mentah di kalimat
- Soal `reply` Reading Adventurer: "What does Staff/Seller/Conductor say?" → **"What does the seller say?"**. Perbaiki di generator soal (kode yang menyusun pertanyaan dari label `speaker`) agar menambah "the" untuk label peran (bukan nama orang). Cukup sekali di kode, tidak perlu per topik.
- Opsi yang tidak menjawab bentuk pertanyaannya: "How do we sit?" → "Circle" (seharusnya "In a Circle"); "Where does the driver stop?" → "At the Red Light"; "When…?" → "On a Hot Day".

### P6. Pengecoh lisan yang dipaksakan (Listening Achiever/Trailblazer)
Demi aturan "distraktor disebut lewat penyangkalan", sebagian baris jadi janggal ("but her mom does not hear", "not five, but I learn fast", "I do not need the company address"). **Solusi**: tulis penyangkalan yang bermotif ("It is her friend, not her mom, who shouts", "We wanted X, but we play Y instead"). Decoy yang ternyata disebut di audio ("Fifty", "Morning") harus diganti kata yang benar-benar tidak terdengar. Cek dengan `npm run build`.

### P7. Pertanyaan gist Trailblazer: "X dan Y sebenarnya membicarakan apa?"
"mainly" = **"pada intinya/terutama"**, bukan "sebenarnya" (= actually). Terjadi di 10 topik. Solusinya satu grep-replace pada `questionId`/`question.id` gist: "…pada intinya membicarakan apa?".

### P8. Konflik dengan aturan "run" (CLAUDE.md 8b) — perlu keputusan
Ditemukan: Listening Adventurer `hari-olahraga` "She Ran the Fastest" sebagai **jawaban benar** (melanggar, wajib ganti, mis. "She Swam the Fastest"); Sentence Puzzle "because she ran a lot" (ganti "swam"/"played"); Speaking Achiever "I can run and breathe fresh air" (ganti "play"). **Boleh dipertahankan** (makna bukan "lari"): "the battery runs out" di Grammar Trailblazer, tapi kalau ingin aman ganti "the battery might die".

## 4. Cara Memperbaiki dengan Aman

1. Edit di sumber: `app/src/content.ts` (materi), `app/src/games/*-data.ts` (Game Hub), `app/src/placement-test-data.ts`. Jangan edit `public/bundle.js`.
2. Setelah tiap batch, jalankan `cd app && npm run build`. Build akan gagal kalau perubahan melanggar aturan otomatis:
   - **Vocab**: `example.en` wajib memuat `item.en` sebagai kata utuh. Kalau kata target diubah (mis. "Field" → "Rice Field", "Throws" → "Throw", "Car" → "Toy Car"), kalimat contohnya ikut disesuaikan. Kata target baru tidak boleh bentrok dengan kata di topik lain kecuali ada di allowlist.
   - **Judul topik**: pola `Indonesia (English)`, misalnya "Reported Speech — Waktu & Tempat…" juga perlu dirapikan.
   - **Listening**: kalimat utuh & pertanyaan tidak boleh kembar lintas topik/level. `practice` tidak boleh memuat kata opsi salah. `test` LS/Starter maks 10/12 kata. Decoys tidak boleh terdengar.
   - **Grammar**: `key` muncul tepat 1x. `wrong` harus 2 kata yang tidak ada di kalimat. `cue` Achiever ada di kalimat sebelumnya.
   - **Reading**: `near` ≠ kalimat buku, wajib `nearId`, kata `gap`/`ref` utuh di baris bukti.
   - **Boss bank**: tiap soal tepat 1 jawaban benar.
3. Kalau mengganti pertanyaan Listening, pastikan pertanyaan tidak memuat teks opsi jawaban (aturan anti-bocor).
4. Mengubah teks yang dibacakan TTS tidak butuh perubahan kode. Mengubah pola pertanyaan `reply` (P5) butuh edit di `games/reading.ts`.
5. Urutan kerja yang disarankan: **(1)** 9 issue H (§2) → **(2)** grep-replace pola P3/P7 (cepat, berdampak luas) → **(3)** issue M per bagian (§5) → **(4)** issue L bila sempat.
6. Verifikasi live di mobile ~390px & desktop ~1280px untuk soal yang teks opsinya berubah panjang, karena kartu 2×2 bisa meluap.

## 5. Daftar Lengkap Issue per Bagian

Kolom "Saran perbaikan" di tiap tabel adalah solusi untuk issue tersebut.

### A. Vocabulary + Game Hub + Placement

**Cakupan**: `vocab-little-stars/starter/explorer/adventurer/achiever/trailblazer.json` (63 topik × 10 kata = 630 item; tiap item kata + kalimat contoh EN/ID ≈ 1.260 pasangan teks) dan `game-balloonpop/kelompok/memorymatch/placement/sentencepuzzle/soundhunt/storyquest/wordmatch.json` (≈ 400 entri: bank kata, kalimat rumpang, teka-teki, kalimat susun, soal placement, teks instruksi tier). Story Quest: 6 buku × 5 halaman (teks, soal, opsi, petunjuk). Total ≈ 1.680 entri, semuanya dibaca.

**Jumlah temuan**: H = 3 · M = 29 · L = 18 (total 50)

Secara umum datanya bersih: tidak ditemukan kunci jawaban yang salah di bank game/placement, dan pengecoh Sentence Puzzle (`wrong`) semuanya memang tidak gramatikal.

**Pola yang berulang**
1. **Terjemahan Indonesia harfiah/kaku** dari kolokasi Inggris: "make a wish" → "membuat harapan", "answer the telephone" → "menjawab telepon", "whisper a secret" → "berbisik rahasia", "first in line" → "pertama di antrean", "won a scholarship" → "memenangkan beasiswa", "put toothpaste on" → "memakai pasta gigi di".
2. **Pasangan kata EN↔ID yang kurang pas** pada kata tempat/benda: Farm = Ladang, Field = Sawah, Rickshaw = Bajaj, bathtub = bak mandi, Corner = Sudut, Car (mainan) = Mobil-mobilan.
3. **Kalimat Inggris gramatikal tapi janggal** (lebih sering di game & level tengah): "What day is today?", "It is drizzly", "The zoo is far.", "on your foot", "in the day", "ask artificial intelligence a question".
4. Kecil: huruf kapital sapaan (Mom/Mama/Bu Guru) dan kata baku KBBI (mi, bersenang-senang, trem).

| # | Sev | File / topik (id) | Lokasi field | Teks sekarang | Masalah | Saran perbaikan |
|---|---|---|---|---|---|---|
| A1 | H | vocab-explorer / `pesta-perayaan` | `items[8].example.id` | "Aku membuat harapan." (EN "I make a wish.") | Terjemahan harfiah; "make a wish" = mengucapkan permohonan/berdoa dalam hati, bukan "membuat harapan" (artinya bergeser jadi berharap secara umum). Item `id: "Harapan"` juga kurang pas. | `id` kata: "Permohonan"; contoh: "Aku mengucapkan permohonan." / "Aku membuat permohonan." |
| A2 | H | vocab-trailblazer / `peralatan-elektronik` | `items[1].example.id` | "Aku menjawab telepon." (EN "I answer the telephone.") | Arti bergeser: "answer the phone" = mengangkat telepon; "menjawab telepon" terdengar seperti membalas isi pembicaraan. | "Aku mengangkat telepon." |
| A3 | H | vocab-starter / `hari-dalam-seminggu` | `items[7].example.en` | "What day is today?" | Penutur asli mengatakan "What day is it today?" Versi sekarang janggal, padahal ini kalimat model untuk level awal (diucapkan & disusun di Tantangan). | "What day is it today?" (kata "today" tetap ada) |
| A4 | M | vocab-adventurer / `transportasi` | `items[8].en` / `.example.en` | "Rickshaw" = "Bajaj"; "He rides a rickshaw." | "Rickshaw" biasanya berarti becak (dikayuh/ditarik), sedangkan ikon 🛺 & "Bajaj" = auto-rickshaw. EN dan ID tidak cocok. | EN "Auto Rickshaw" (atau "Tuk-tuk"), contoh "He rides an auto rickshaw."; atau ID "Becak" + ikon lain. |
| A5 | M | vocab-starter / `tempat-di-sekitar` | `items[5].id` | "Farm" = "Ladang" | Farm = peternakan/pertanian (tempat hewan & tanaman); ladang = tanah garapan tanaman kering. Kurang tepat, apalagi Little Stars mengajarkan "Farm Animals". | "Peternakan" atau "Pertanian"; contoh: "Petani bekerja di pertanian." |
| A6 | M | vocab-explorer / `keluarga` | `items[7].example.id` | "Traktornya bekerja di ladang." | Mengikuti #5 (farm = ladang). | "Traktor itu bekerja di pertanian." |
| A7 | M | vocab-trailblazer / `pedesaan` | `items[1].id` | "Field" = "Sawah" | Sebagai kata lepas, field = ladang/lapangan; sawah = rice field/paddy. Kalimatnya cocok, tapi pasangan kata (yang diuji di Latihan Inti) menyesatkan. | EN "Rice Field" (contoh "The farmer plants rice in the rice field.") atau ID "Ladang". |
| A8 | M | game-kelompok / `GROUPS.bathroom` | `items[5].id` | "bathtub" = "bak mandi" | "Bak mandi" di Indonesia = bak air untuk mandi pakai gayung, bukan tempat berendam; bathtub = bak rendam/bathtub. | "bak rendam" |
| A9 | M | vocab-achiever / `arah-posisi` | `items[6].id`, `items[5].example.id`, `items[6].example.id` | "Corner" = "Sudut"; "Belok di sudut."; "Tunggu di sudut." | Untuk konteks jalan, corner = tikungan/pojok jalan; "belok di sudut" tidak natural. | "Tikungan"/"Pojok"; "Belok di tikungan." / "Tunggu di pojok jalan." |
| A10 | M | vocab-achiever / `arah-posisi` | `items[4].example.en` | "The zoo is far." | "far" sendirian di kalimat positif terdengar janggal; penutur asli memakai "far away" / "a long way". | "The zoo is far away." |
| A11 | M | vocab-adventurer / `cuaca` | `items[6].en` / `.example.en` | "Drizzly"; "It is drizzly this morning." | "drizzly" jarang dipakai; yang umum "It is drizzling" / "It's a drizzly day". | Contoh: "It is drizzling this morning." (kalau kata target harus "Drizzly": "It is a drizzly morning.") |
| A12 | M | vocab-explorer / `angka` | `items[0..3].example.id` | "Aku pertama di antrean." / "Dia kedua di antrean." / "Dia ketiga di antrean." / "Aku selesai keempat di lomba." | Terjemahan harfiah, kaku. | "Aku urutan pertama dalam antrean." / "Dia urutan kedua…" / "Aku finis keempat dalam lomba." (atau "juara keempat") |
| A13 | M | vocab-explorer / `warna` (Fasilitas Rumah) | `items[7].example.id` | "Silakan duduk di tempat ini." (EN "Take a seat, please.") | Ada informasi tambahan "di tempat ini" yang tidak ada di EN. | "Silakan duduk." |
| A14 | M | vocab-explorer / `warna` | `items[3].example.id` | "Aku memakai pasta gigi di sikat gigiku." | Harfiah; "put toothpaste on" = mengoleskan/menaruh. | "Aku menaruh pasta gigi di sikat gigiku." |
| A15 | M | vocab-explorer / `waktu-harian` | `title` | "Waktu dalam Sehari (Times of Day & Calendar)" | Bagian Indonesia tidak memuat "Kalender", padahal isinya Week/Month/Year/Birthday/Holiday. | "Waktu & Kalender (Times of Day & Calendar)" |
| A16 | M | vocab-achiever / `kata-kerja-lanjutan` | `items[7].example.id` | "Aku berbisik rahasia." | Tidak gramatikal dalam BI; "berbisik" intransitif. | "Aku membisikkan rahasia." |
| A17 | M | vocab-achiever / `hiburan-waktu-luang` | `items[8].example.en` | "I like reading about a superhero." | Janggal; yang natural jamak/umum. | "I like reading about superheroes." (ID: "…tentang pahlawan super.") |
| A18 | M | vocab-achiever / `teknologi-internet` | `items[2].example.en` | "I ask artificial intelligence a question." | Janggal (AI sebagai penerima tanpa artikel/alat). | "I ask an AI app a question." atau "I use artificial intelligence to answer questions." |
| A19 | M | vocab-trailblazer / `peralatan-elektronik` | `items[6].example.en` | "The water heater warms my shower." | Janggal; yang dipanaskan air, bukan "shower". | "The water heater heats the water for my shower." (ID tetap) |
| A20 | M | vocab-trailblazer / `pendidikan-akademik` | `items[2].example.id` | "Dia memenangkan beasiswa untuk kuliah." | Harfiah dari "won"; dalam BI beasiswa "didapat/diraih". | "Dia mendapat beasiswa untuk kuliah." |
| A21 | M | vocab-starter / `perkakas` | `items[0].example.en/.id` | "Dad builds with a hammer." / "Ayah membangun dengan palu." | Janggal di kedua bahasa (palu tidak dipakai untuk "membangun" secara umum). | "Dad hits the nail with a hammer." / "Ayah memukul paku dengan palu." |
| A22 | M | vocab-starter / `hobi` | `items[9].example.en/.id`, `items[9].id` | "I like building." / "Aku suka membangun." | Ambigu ("building" juga = gedung) dan "membangun" sebagai hobi anak janggal. | "I like building things." / "Aku suka membuat bangunan (dari balok)." |
| A23 | M | vocab-little-stars / `mainan` | `items[9]` | "Car" = "Mobil-mobilan"; "I play with a car." | Bertabrakan dengan `kendaraan.items[0]` "Car" = "Mobil" di level yang sama (1 kata EN, 2 arti). Kalimatnya juga janggal (anak bermain dengan mobil sungguhan?). | EN "Toy Car" + "I play with my toy car." |
| A24 | M | vocab-adventurer / `transportasi` | `items[4].example.id` | "Perahu cepat itu laju." | "laju" sebagai kata sifat terdengar kaku/arkais; makna sama dengan "cepat", jadi terasa berulang. | "Speedboat itu melaju cepat." / "Perahu motor itu cepat sekali." |
| A25 | M | vocab-little-stars / `hewan-peliharaan` | `items[5].example.id` | "Kataknya bilang kwak kwak." | Tiruan bunyi katak dalam BI biasanya "kung kong"/"krok krok"; "kwak kwak" mirip bunyi bebek. | "Kataknya bilang krok krok." (atau tetap "ribbit") |
| A26 | M | vocab-little-stars / `salam-sopan-santun` | `items[8].example.id` | "Selamat malam, mama." (EN "Good night, mom.") | "Good night" = ucapan pamit/menjelang tidur; konteks kalimat anak ke mama sebelum tidur → "Selamat tidur". Item kata "Selamat Malam" masih bisa diterima. | "Selamat tidur, Mama." |
| A27 | M | game-placement / `r2` | `question` | "Where does father work?" | Tanpa determiner; ceritanya "My father…". | "Where does her father work?" / "Where does the father work?" |
| A28 | M | game-soundhunt / `RIDDLE_BANK[3]` | `text` | "You wear it on your foot when you go to school." | Sepatu dipakai di kedua kaki; "on your foot" janggal. | "You wear them on your feet when you go to school." (atau jawaban "shoes") |
| A29 | M | game-soundhunt / `RIDDLE_BANK[2]` | `text` | "It is in the sky in the day." | Janggal; frasa natural "during the day". | "It is in the sky during the day. It is hot and yellow." |
| A30 | M | game-memorymatch / `OPPOSITE_BANK[11]` | `aId`/`bId` | "Early" = "Lebih awal" ↔ "Late" = "Terlambat" | "Lebih awal" komparatif, tidak sejajar dengan "Terlambat"; pasangan lawan kata jadi timpang. | "Awal"/"Pagi-pagi" ↔ "Terlambat" (atau "Cepat" ↔ "Telat") |
| A31 | L | vocab-little-stars / `salam-sopan-santun` | `items[2].example.en/.id`, `items[8].example.en` | "Thank you, mom!" / "Terima kasih, mama!" / "Good night, mom." | Sapaan langsung ditulis kapital (EN "Mom", PUEBI "Mama"). | "Thank you, Mom!" / "Terima kasih, Mama!" / "Good night, Mom." |
| A32 | L | vocab-little-stars / `salam-sopan-santun` | `items[6].example.id` | "Selamat pagi, bu guru!" | PUEBI: kata sapaan kapital. | "Selamat pagi, Bu Guru!" |
| A33 | L | vocab-adventurer / `transportasi` | `items[7].example.id` | "Tramnya berhenti di sini." | Tidak konsisten dengan item `id: "Trem"` (KBBI: trem). | "Tremnya berhenti di sini." |
| A34 | L | vocab-adventurer / `makanan` | `items[8].id`, `.example.id` | "Mie"; "Dia suka sup mie." | KBBI baku "mi"; dan "sup mi" lazimnya "mi kuah". | "Mi"; "Dia suka mi kuah." |
| A35 | L | vocab-explorer / `keluarga` | `items[3].example.id` | "Kami senang-senang di taman hiburan." | Bentuk baku "bersenang-senang". | "Kami bersenang-senang di taman hiburan." |
| A36 | L | vocab-explorer / `angka` | `title` | "Nomor Urutan (Ordinal Numbers)" | Istilah yang lazim di sekolah: "Bilangan Urutan"/"Bilangan Bertingkat". | "Bilangan Urutan (Ordinal Numbers)" |
| A37 | L | vocab-achiever / `arah-posisi` | `items[2].example.id` | "Jalan terus lurus." | Urutan kata kurang natural. | "Jalan lurus terus." |
| A38 | L | vocab-achiever / `mata-pelajaran` | `items[2].example.id` | "Aku belajar Bahasa Inggris." | PUEBI: dalam kalimat, "bahasa" kecil kalau bukan nama mata pelajaran resmi (di sini boleh juga dianggap nama mapel — opsional). | "Aku belajar bahasa Inggris." |
| A39 | L | vocab-achiever / `ciri-ciri-fisik` | `items[7].en` | "Wears Glasses" | Bentuk item tidak sejajar (frasa kerja, bukan kata/frasa benda/sifat seperti item lain). | "Glasses" (ID "Kacamata") — contoh tetap "She wears glasses." |
| A40 | L | vocab-trailblazer / `peralatan-kantor` | `items[3].example.id` | "Aku mengirim surat di amplop." | Preposisi kurang tepat. | "Aku mengirim surat dalam amplop." |
| A41 | L | vocab-adventurer / `pekerjaan` | `items[9].example.id` | "Seniman melukis gambar." | Agak janggal ("melukis gambar"). | "Seniman itu melukis sebuah lukisan." / "Seniman itu sedang melukis." |
| A42 | L | vocab-little-stars / `kendaraan` | `items[7].id` | "Truk Pemadam" | Sebutan umum "mobil pemadam kebakaran". | "Mobil Pemadam" / "Mobil Pemadam Kebakaran" |
| A43 | L | vocab-adventurer / `olahraga` | `items[9].example.id` | "Kami pergi boling." | Kurang natural tanpa kata kerja. | "Kami pergi main boling." |
| A44 | L | vocab-explorer & vocab-trailblazer | `keluarga.items[9]` & `perjalanan-wisata.items[7]` | "Ticket" — "I buy a ticket." = "Aku membeli tiket." (sama persis di 2 level) | Kata + kalimat contoh identik di Explorer dan Trailblazer; untuk B1 terlalu mudah & duplikat. | Ganti kalimat Trailblazer, mis. "I booked a train ticket online." / "Aku memesan tiket kereta secara online." |
| A45 | L | game-balloonpop / `LOOKALIKE_GROUPS` "all" | `items[2]` | "Bell" di grup bernama "all" (Ball/Wall) | Tidak berakhiran -all; nama grup tidak cocok (masih "mirip" secara visual, jadi bukan bug fungsional). | Ganti "Tall"/"Hall", atau ganti nama grup. |
| A46 | L | game-sentencepuzzle / `legendaris` | `[0]`, `[1]`, `[2]`, `[5]` `en` | "It is cold so I wear a jacket." / "I like apples but I don't like bananas." / "I was hungry so I ate a sandwich." | Kalimat majemuk dengan so/but biasanya pakai koma (kalau teks kalimat ini ditampilkan sebagai jawaban/kunci). | "It is cold, so I wear a jacket." dst. (cukup di teks tampil; potongan kata puzzle tidak perlu koma) |
| A47 | L | game-sentencepuzzle / `legendaris` | `[4].en` | "She is tired because she ran a lot." | Memakai kata "ran" sebagai inti makna kalimat, padahal aturan proyek menghindari "run" sebagai materi (CLAUDE.md 8b). | "She is tired because she swam a lot." / "…because she played a lot." |
| A48 | M | game-storyquest / `time-capsule` | `pages[0].lines[3]` | "The date next to it is exactly 50 years ago today." | Janggal ("is … ago today"); kalimat ini kunci jawaban soal halaman itu. | "The date next to it is exactly 50 years before today." / "It was written exactly 50 years ago today." |
| A49 | M | game-storyquest / `science-fair` | `pages[2].options[0].text` | "It was buried too low." | Kolokasi tidak natural; untuk biji/tanah dipakai "too deep". (Kalau "deep" sengaja dihindari agar opsi tidak sama dengan teks, pakai "too far down".) | "It was buried too far down." |
| A50 | L | game-storyquest / `missing-kite`, `science-fair` | `pages[3].question`; `pages[2].question` | "What can Sam not reach?" / "Why did the seed not grow?" | Gramatikal tapi kaku; bentuk kontraksi lebih natural. | "What can't Sam reach?" / "Why didn't the seed grow?" |

Catatan (bukan temuan): `Temple` = "Pura" dengan ikon 🛕 (kuil Hindu) masih bisa diterima; inkonsistensi kecil antar-bank seperti Shirt = "Baju" (Vocab) vs "Kaus" (game), Cookie = "Biskuit" vs "kukis", Square = "Persegi" vs "kotak" tidak mengubah makna, jadi tidak dimasukkan. Id topik Explorer `keluarga`/`warna` tidak cocok dengan judulnya (Jalan-jalan Seru / Fasilitas Rumah), tapi itu identitas progres, bukan teks yang tampil.

### B. Grammar Little Stars–Achiever & Speaking Little Stars–Adventurer

**Cakupan**: 9 file dibaca utuh (grammar-little-stars/starter/explorer/adventurer/achiever, speaking-little-stars/starter/explorer/adventurer). Perkiraan ±1.150 butir dicek (≈200 pasangan formA/formB LS, ≈200 Starter, 100 kalimat Explorer, 100 Adventurer, 110 kalimat + 33 teks Achiever beserta setiap `wrong[]`/`alt`/`key`/`cue`; ≈120 frasa+talk LS, ≈100 Starter, ≈95 baris Explorer, ≈130 baris Adventurer).

**Jumlah temuan**: H = 1 · M = 24 · L = 12 (total 37)

Secara umum kualitas tinggi: semua `wrong[]` di topik non-`meaningNeeded` memang tidak gramatikal di kalimatnya, semua `alt` benar, `key` tepat, `cue` Achiever ada di kalimat sebelumnya. Tidak ditemukan salah grammar Inggris di kalimat target.

**Pola berulang**
1. **Terjemahan Indonesia menambah/mengubah informasi** — his/her/he/she diterjemahkan "kakak laki-laki/perempuan", we → "kita" (inklusif) padahal pernyataan ke lawan bicara mestinya "kami", headache → "pusing", good night → "selamat malam".
2. **Indonesia kaku/harfiah** — "melewati atas gunung", "melewati bagian dalam terowongan", "Ini stroberi-stroberi merah", "Tepuk tanganmu!", "Kamu merasa apa?", "X punya Y" untuk benda/tempat ("Ruang tamu punya sofa besar").
3. **Inggris gramatikal tapi kurang natural** — artikel "the" untuk benda tak spesifik ("He sees the cloud"), "could" untuk satu keberhasilan di masa lalu, "the highest building", "look like each other", "because it is rainy".

| # | Sev | File / topik (id) | Lokasi field | Teks sekarang | Masalah | Saran perbaikan |
|---|---|---|---|---|---|---|
| B1 | H | grammar-achiever / zero-conditional | `texts[2]` (key `it`, wrong `he`) | "Sari's cat loves fish." / "If Sari opens a can of fish, it runs to the kitchen." | Pengecoh `he` sebenarnya BENAR: penutur asli lazim menyebut hewan peliharaan "he/she" → 2 jawaban benar. Selain itu "it" ambigu (bisa merujuk ke "a can"). | Hapus `he` dari `wrong` (ganti mis. `them`/`we`), dan perjelas subjek: "If Sari opens a can of fish, the cat … / it" — atau ubah jadi soal yang kuncinya bukan kata ganti hewan. |
| B2 | M | grammar-starter / miliknya-siapa | `items[*].formA.id` / `formB.id` | "This is his table." → "Ini meja milik kakak laki-laki." | his/her ≠ "kakak laki-laki/perempuan" (menambah info usia & hubungan). Mungkin sengaja sbg proxy karakter, tapi arti Indonesianya keliru bila dibaca sbg terjemahan. Juga "his fridge/his television" janggal untuk barang milik seorang kakak. | "Ini mejanya (dia, laki-laki)." / tetap label kartu "kakak laki-laki" tapi terjemahan kalimat "Ini meja miliknya (laki-laki)". Pertimbangkan benda pribadi (bag, cup, toothbrush) alih-alih fridge/TV/broom. |
| B3 | M | grammar-starter / dia-siapa | `items[*].formA.id` | "He sees the sun." → "Kakak laki-laki melihat matahari." | Sama dgn #2: "He" diterjemahkan "Kakak laki-laki". | "Dia (laki-laki) melihat matahari." (pola yang sudah dipakai di grammar-explorer pronouns[2]). |
| B4 | M | grammar-starter / kita-mereka | `items[*].formA.id` | "We are boys." → "Kita anak laki-laki." | "Kita" inklusif (lawan bicara ikut). Pernyataan "We are singers/doctors/boys" ke orang lain dalam BI natural memakai "kami". Bisa salah mengajarkan kita/kami. | Pakai "Kami …" (dan label kartu "Kami"), atau pilih kalimat yang memang inklusif ("We are friends" → "Kita berteman"). |
| B5 | M | grammar-little-stars / ini-itu-jamak | `items[*].formA.id`, `title` | "These strawberries are red." → "Ini stroberi-stroberi merah." ; judul "Ini-ini atau Itu-itu? (These or Those?)" | Indonesia = "These are red strawberries" (struktur berubah) & reduplikasi kaku; judul "Ini-ini/Itu-itu" tidak lazim. | "Stroberi-stroberi ini merah." / "Stroberi yang ini merah." ; judul "Ini atau Itu? (These or Those?)" atau "Yang Ini atau Yang Itu? (These or Those?)". |
| B6 | M | grammar-little-stars / punya-siapa | `items[2]` | "This is my baby." / "This is your baby." → "Ini adik bayiku/adik bayimu." | "my baby" dari mulut anak = "bayiku (anakku)", bukan adik bayi. | "This is my baby brother." / "…baby sister." (atau ganti kata). |
| B7 | M | grammar-little-stars / mau-tidak-mau | `items[3].formA.en` | "I want a grape." | Anak menginginkan 1 butir anggur janggal; natural "some grapes". | "I want some grapes." / "I don't want any grapes." (atau ganti buah lain, mis. "a melon"). |
| B8 | M | grammar-little-stars / ini-itu | `items[9]` | en "Car", "This is a car." → id "Mobil-mobilan", "Ini mobil-mobilan." | en vs id beda arti (mobil vs mainan mobil). | "This is a toy car." atau id "Ini mobil." |
| B9 | M | grammar-starter / suka-tidak-suka | `items[9].formA.en` | "I like building." | "building" ambigu (gedung); butuh objek. | "I like building blocks." / "I like building things." |
| B10 | M | grammar-explorer / question-words | `sentences[7].id` | "Who is at the door?" → "Siapa yang ada di pintu?" | Indonesia harfiah. | "Siapa yang di depan pintu?" / "Siapa itu yang datang?" |
| B11 | M | grammar-adventurer / prepositions-of-movement | `sentences[1].id`, `[8].id`, `[2].id` | "Pesawat itu terbang melewati atas gunung." ; "Burung itu terbang melewati atas rumah." ; "Kereta itu melaju melewati bagian dalam terowongan." | Indonesia kaku/tidak natural. | "Pesawat itu terbang di atas gunung." ; "Burung itu terbang melintas di atas rumah." ; "Kereta itu melaju menembus terowongan." |
| B12 | M | grammar-adventurer / past-ability-could | `sentences[2].en` | "He could catch the ball yesterday." | "could" afirmatif tidak dipakai untuk 1 keberhasilan spesifik di masa lalu (penutur asli: "was able to / managed to"). Mengajarkan pola yang keliru di topik yang justru tentang could. | Ganti ke kemampuan umum: "He could catch a ball when he was three." (alt: "When he was three he could catch a ball"). |
| B13 | M | grammar-adventurer / superlatives | `sentences[8].en` | "That building is the highest in the city." | Untuk gedung lazim "tallest" (highest untuk gunung/titik). | "That mountain is the highest in Indonesia." atau "That building is the tallest in the city." (cek tidak bentrok dgn sentences[0] tallest). |
| B14 | M | grammar-achiever / look-like | `sentences[9].en` | "The twins look like each other." | Natural: "The twins look alike." (kalimat ini kurang lazim). | "The twins look like their mom." (key tetap `look`, wrong `looks` tetap salah). |
| B15 | M | grammar-achiever / made-of | `texts[2]` | "My mom is going to buy a new table next week." / "It will be made of metal, not wood." | Meja yang dibeli sudah ada → natural "It is made of metal"; "will be made" terdengar akan diproduksi. Tidak salah fatal (opsi `is` tidak ada). | Ubah konteks ke benda yang akan dibuat: "Dad is going to build a new table next week. It will be made of metal, not wood." |
| B16 | M | grammar-achiever / zero-conditional | `texts[0].en[1]`, `sentences[6].en` | "If thunder comes, he hides under his blanket." ; "If he studies hard, he passes the test." | "thunder comes" tidak idiomatis; kalimat ke-2 bukan kebenaran umum (lebih natural first conditional). | "When it thunders / If there is thunder, he hides…" ; ganti sentences[6] mis. "If he eats breakfast, he feels strong." |
| B17 | M | grammar-achiever / many-vs-much | `texts[2]` (wrong `many`) | "Grandpa likes coffee in the morning." / "He doesn't drink much in the evening." | "many" bisa diterima kalau penutur membayangkan "cups/coffees" ("He doesn't drink many [cups]") — pengecoh tidak 100% salah. | Tambahkan kata benda tak terhitung di kalimat rumpang: "He doesn't drink much coffee in the evening." (wrong `many` jadi jelas salah). |
| B18 | M | speaking-little-stars / sapaan-sopan | `items[8].phrase` | "Good night, dad!" → "Selamat malam, papa!" | "Good night" = pamit tidur → "Selamat tidur"; "selamat malam" juga berarti good evening. | "Selamat tidur, Papa!" |
| B19 | M | speaking-little-stars / rasa-hatiku | `talk.nameQ.id` | "How do you feel?" → "Kamu merasa apa?" | Indonesia tidak natural. | "Bagaimana perasaanmu?" |
| B20 | M | speaking-little-stars / main-yuk | `talk.followQ.id` | "What do you do with it?" → "Kamu main apa dengannya?" | Arti bergeser ("kamu main apa") & kaku. | "Kamu apakan mainan itu?" / "Mainan itu dipakai untuk apa?" |
| B21 | M | speaking-starter / isi-kelasku | `title` | "Isi Kelasku (At School)" | Indonesia ≠ Inggris; isinya juga bukan hanya isi kelas (coach, principal, library, recess). | "Di Sekolah (At School)". |
| B22 | M | speaking-explorer / sakit-apa | `model[0].id` | "I have a headache." → "Kepalaku pusing." | headache = sakit kepala; pusing = dizzy. Tidak konsisten dgn `roleplay[0].choices[0]` "Kepalaku sakit sekali." | "Kepalaku sakit." / "Aku sakit kepala." |
| B23 | M | speaking-adventurer / membuat-janji | `roleplay[2].choices[0]` | "Five o'clock works because I have lunch first." | Alasan tidak logis (makan siang sebelum jam 5 sore, sementara jawaban lain "selesai sekolah jam tiga"). | "Five o'clock works because I take a nap first." / "…because I do my homework first." |
| B24 | M | speaking-adventurer / cuaca-hari-ini | `model[1].en` | "I bring an umbrella because it is rainy." | Natural: "because it is raining" (atau "it's a rainy day"). | "I bring an umbrella because it is raining." |
| B25 | M | speaking-adventurer / cerita-seru | `stories[1].lines` | "Rudi walks to school in the morning." / "Dark clouds cover the sky." / "He puts an umbrella in his bag." | Urutan janggal (memasukkan payung ke tas saat sudah berjalan). | Line 0: "Rudi gets ready for school in the morning." |
| B26 | L | speaking-explorer / bayar-di-kasir | `roleplay[2].answer.en` | "Yes, I want the receipt." | Kurang sopan/natural di kasir. | "Yes, please." / "Yes, I want the receipt, please." |
| B27 | L | grammar-little-stars / ini-itu | `items[7]` | en "Blocks" → kalimat "This is a block." | Kata target jamak, kalimat tunggal. | en "Block". |
| B28 | L | grammar-starter / dia-siapa | `items[3]`, `[8]`, `[9]` formA/formB.en | "He sees the cloud." / "He finds the stone." / "He sees the star." | "the" untuk benda tak spesifik terasa janggal. | "He sees a cloud." / "He finds a stone." / "He sees a star." |
| B29 | L | grammar-starter / lakukan-jangan-lakukan & speaking-little-stars / sentuh-tubuhku | `items[4].formA.id` ; `items[8].phrase.id` | "Clap your hands!" → "Tepuk tanganmu!" | Indonesia lazim "Tepuk tangan!" | "Tepuk tangan!" / "Jangan tepuk tangan!" |
| B30 | L | grammar-starter / pergi-tidak-pergi | `title` | "Pergi atau Tidak Pergi? (I Go / I Don't Go?)" | Tanda tanya setelah pola garis miring. | "(I Go / I Don't Go)". |
| B31 | L | grammar-explorer / prepositions-of-place | `sentences[7].id` | "Jam ada di (menempel pada) dinding." | Kurung di dalam terjemahan kaku. | "Jam menempel di dinding." |
| B32 | L | grammar-explorer / lets-suggestion | `sentences[2].id`, `[9].id` | "Ayo bermain sebuah permainan!" ; "Ayo naik sepeda kita!" | Harfiah. | "Ayo main game!" ; "Ayo naik sepeda!" |
| B33 | L | grammar-adventurer / prepositions-of-movement | `sentences[6].id`, `[7].id` | "Bola itu jatuh masuk ke dalam air." ; "Kami berjalan melewati tengah taman." | Redundan/kaku. | "Bola itu jatuh ke dalam air." ; "Kami berjalan menembus taman / melintasi taman." |
| B34 | L | grammar-adventurer / adverbs-of-manner | `sentences[4].id` | "Tolong menulis dengan hati-hati." | Imperatif BI tanpa me-. | "Tolong tulis dengan hati-hati." |
| B35 | L | grammar-achiever / going-to-vs-will | `sentences[0].id` | "Aku akan belajar Matematika sepulang sekolah (sudah direncanakan)." | Keterangan di dalam terjemahan, tidak konsisten dgn kalimat lain. | Hapus "(sudah direncanakan)" (sudah dijelaskan `rule`). |
| B36 | L | speaking-little-stars / sapaan-sopan | `items[7].phrase.en`, `items[8].phrase.en` | "Good morning, mom!" / "Good night, dad!" | Mom/Dad sbg sapaan nama → kapital. | "Good morning, Mom!" / "Good night, Dad!" (juga speaking-starter hobiku `items[6]` "with dad", `items[4]` "with mom" → boleh huruf kecil krn bukan sapaan; opsional). |
| B37 | L | speaking-adventurer / ruangan-favoritku | `drill[0].id`, `drill[2]` | "Ruang tamu punya sofa besar." ; "The garden has many flowers." → "Kebunnya punya banyak bunga." | "X punya Y" untuk tempat kaku; "garden" bukan ruangan di topik "My Favorite Room". | "Di ruang tamu ada sofa besar." ; ganti drill[2] mis. "The dining room has a long table." → "Di ruang makan ada meja panjang." |

### C. Grammar Trailblazer & Speaking Achiever/Trailblazer

**Cakupan:** dibaca penuh, tanpa sampling.
- `grammar-trailblazer.json`: 10 topik × 10 transform = 100 item (kalimat asli + arti, 400 `reportedOptions`, 300 `originalOptions`), sekitar 800 kalimat.
- `speaking-achiever.json`: 11 topik (10 model/drill/roleplay + 1 cerita), sekitar 110 kalimat termasuk `choices`.
- `speaking-trailblazer.json`: 11 topik (10 wawancara × 8 giliran + 1 cerita), sekitar 430 kalimat (pertanyaan, `peerAnswer`, 240 `choices`, cerita).
- Total sekitar 1.340 kalimat EN/ID.

**Temuan:** H = 2 · M = 16 · L = 22 (total 40)

**Pola yang berulang**
1. **Kunci jawaban transformasi Grammar umumnya bersih.** Di setiap item tepat 1 opsi benar. Pengecoh memakai kesalahan yang memang tidak gramatikal (`use to`/`used to watched`/`was used to watch`, `is clean by`, `if did she`, `said Doni to`, `to don't`). Masalah yang tersisa ada di `originalOptions`: beberapa kutipan pengecoh tidak natural atau tidak gramatikal (`Would you like solving…`, `When have you studied…`), dan 1 bisa dilaporkan menjadi kalimat yang sama (past continuous).
2. **Terjemahan Indonesia kadang bergeser makna atau terlalu harfiah**: "by Friday" diterjemahkan "sebelum hari Jumat", "share" diterjemahkan "meminjamkan", "hiking … hill" diterjemahkan "mendaki gunung", "Practice your song" diterjemahkan "Latih lagumu", "Aku dwibahasa", "tidak apa" (seharusnya "tidak apa-apa").
3. **Speaking: kalimat model kadang kurang natural**: rujukan kata ganti tidak cocok ("being a teacher … they"), frasa tanpa klausa ("even just a short walk"), "the left way", "Number nine", "at my own speed". Satu jawaban cerita Achiever tidak menjawab bagian "why" dari pertanyaannya.

Semua `choices` "Pilih & Ucapkan" (Achiever dan Trailblazer) sudah dicek: semuanya gramatikal dan nyambung dengan pertanyaannya. Tidak ada pilihan yang salah atau keluar topik.

| # | Sev | File / topik (id) | Lokasi field | Teks sekarang | Masalah | Saran perbaikan |
|---|---|---|---|---|---|---|
| C1 | H | grammar-trailblazer / `reported-time-place` | `transforms[6].originalOptions[2]` | `I was staying here for two more days.` | Kalimat yang dilaporkan: "Wati said that she was staying there for two more days." Past continuous biasanya TIDAK digeser saat dilaporkan (Cambridge/Murphy), jadi kutipan pengecoh ini bisa menghasilkan kalimat laporan yang sama persis. Akibatnya di Tantangan ada 2 jawaban benar. | Ganti dengan kutipan yang hasil laporannya pasti beda, mis. `I have stayed here for two days.` atau `I will stay here for two more days.` (yang ke-2 sudah dipakai di [1], jadi pakai mis. `I stayed here for two days last month.`) |
| C2 | H | speaking-achiever / `cerita-dan-alasan` | `stories[4].answer.en` / `.id` | `Tia has the better habit.` / `Kebiasaan Tia lebih baik.` | Pertanyaannya "Whose habit is better, **and why?**", tapi jawaban kanonis (yang juga jadi target skor kata kunci) tidak menyebut alasannya. Anak yang menjawab lengkap justru tidak cocok dengan targetnya. | `Tia's habit is better because she doesn't forget her homework.` / `Kebiasaan Tia lebih baik karena dia tidak lupa PR.` Atau hapus "and why" dari pertanyaan. |
| C3 | M | grammar-trailblazer / `reported-questions` | `transforms[1].originalOptions[1]` | `Would you like solving math problems?` | Tidak gramatikal: "would like" diikuti to-infinitive. Pengecoh boleh salah isi, tapi bahasa Inggrisnya harus benar. | `Would you like to solve math problems?` (laporannya "if he would like to solve…", beda dari kunci) |
| C4 | M | grammar-trailblazer / `reported-questions` | `transforms[1].originalOptions[0]` | `Have you liked solving math problems?` | Janggal: "like" (stative) jarang dipakai dalam present perfect tanpa keterangan waktu. | `Did you like solving math problems?` |
| C5 | M | grammar-trailblazer / `reported-questions` | `transforms[8].originalOptions[0]` | `When have you studied for exams?` | "When" + present perfect dianggap tidak gramatikal oleh penutur asli. | `When did you study for exams?` atau `When will you study for exams?` (yang ke-2 sudah ada, jadi pakai `When are you studying for exams?`) |
| C6 | M | grammar-trailblazer / `reported-speech` | `transforms[6].originalId` | `Aku dwibahasa.` | Kaku/janggal dalam bahasa Indonesia. | `Aku bisa dua bahasa.` / `Aku menguasai dua bahasa.` |
| C7 | M | grammar-trailblazer / `reported-speech` | `transforms[7].original` (dan `[8]`) | `I translate the sentence.` / `I talk to a native speaker.` | Present simple untuk 1 tindakan tunggal (tanpa makna kebiasaan) terdengar janggal. Item lain di topik ini memakai keterangan kebiasaan. | `I translate sentences every day.` / `I talk to a native speaker every week.` (opsi ikut disesuaikan) |
| C8 | M | grammar-trailblazer / `reported-requests-commands` | `transforms[4].originalId` | `Kembalikan bukumu sebelum hari Jumat.` | "by Friday" berarti paling lambat hari Jumat (Jumat termasuk). "sebelum" berarti Jumat tidak termasuk. | `Kembalikan bukumu paling lambat hari Jumat.` |
| C9 | M | grammar-trailblazer / `reported-requests-commands` | `transforms[2].originalId` | `Bisakah kamu meminjamkan earphone-mu padaku?` | "share … with me" artinya berbagi/memakai bersama, bukan meminjamkan. | `Bisakah kamu berbagi earphone denganku?` |
| C10 | M | grammar-trailblazer / `reported-requests-commands` | `transforms[6].originalId` | `Latih lagumu sebelum konser.` | Terjemahan harfiah yang janggal. | `Latihlah menyanyikan lagumu sebelum konser.` / `Berlatihlah lagumu sebelum konser.` |
| C11 | M | speaking-achiever / `kasih-arahan` | `roleplay[1].answer.en` & `choices[0].en` (+ `q.en`) | `I think the left way is faster…` / `the right way is faster…` / `Which way is faster, left or right?` | "the left way / the right way" tidak natural. | `I think going left is faster because…` / `I think the road on the right is faster because…` |
| C12 | M | speaking-achiever / `angka-di-sekitarku` | `roleplay[2].answer.en` & `choices[0].en` | `Number nine is important to me…` / `Number seven is important to me…` | Butuh artikel: "The number nine…". | `The number nine is important to me because…` |
| C13 | M | speaking-achiever / `cerita-dan-alasan` | `stories[3].question.en` | `How long does the plant take to give tomatoes?` | "give tomatoes" janggal. | `How long does it take for the plant to grow tomatoes?` |
| C14 | M | speaking-trailblazer / `rencana-masa-depan` | `turns[5].peerAnswer.en` & `choices[0].en` | `I think being a teacher is important because they help students learn.` | Kata ganti "they" merujuk ke "being a teacher" (tunggal/abstrak), jadi tidak cocok. | `I think teachers are important because they help students learn.` |
| C15 | M | speaking-trailblazer / `olahraga-kesehatan` | `turns[4].peerAnswer.en` & `choices[0].en` | `I exercise almost every day, even just a short walk.` | Tidak gramatikal: "even just a short walk" berdiri tanpa klausa. | `I exercise almost every day, even if it is just a short walk.` |
| C16 | M | speaking-trailblazer / `akhir-pekanku` | `turns[7].peerAnswer.id` & `choices[0].id` | `Aku mau coba mendaki gunung … Aku belum pernah mendaki bukit` | Bahasa Inggrisnya "hiking … climbed a hill", tapi terjemahannya menyebut "gunung" lalu "bukit", jadi tidak konsisten di dalam 1 jawaban. | `Aku mau coba hiking/mendaki bukit bersama teman-temanku…` |
| C17 | M | speaking-trailblazer / `arti-persahabatan` | `turns[3].question.en` / `.id` | `Is it important to have many friends or a few close ones?` | Pertanyaan pilihan dengan "important" janggal, dan semua jawabannya membandingkan "better". | `Is it better to have many friends or a few close ones?` / `Lebih baik punya banyak teman atau sedikit teman dekat?` |
| C18 | M | speaking-trailblazer / `makanan-favoritku` | `turns[3].peerAnswer.en` & `choices[0].en` | `…because the food feels healthier.` | "food feels healthier" janggal. | `…because the food is healthier.` / `…makanannya lebih sehat.` |
| C19 | L | grammar-trailblazer / `reported-time-place` | `transforms[6].originalOptions[0]` | `I stayed here for two more days.` | "two more days" dengan past simple janggal (kalimat bebas konteks). | `I stayed here for two days.` |
| C20 | L | grammar-trailblazer / `reported-time-place` | `transforms[3].originalId` | `Aku akan menyelesaikan laporan ini hari ini.` | Bahasa Inggrisnya "the report", bukan "this report". | `…menyelesaikan laporannya hari ini.` |
| C21 | L | grammar-trailblazer / `reported-time-place` | `title` | `Reported Speech — Waktu & Tempat Berubah (Time & Place Shift)` | Bagian "Indonesia" diawali istilah Inggris. Tidak konsisten dengan judul topik lain. | `Waktu & Tempat Berubah (Time & Place Shift)` |
| C22 | L | grammar-trailblazer / `passive-past` | `transforms[0].originalId`, `[8].originalId` | `…rumah ini tahun 1990.` / `…pohon-pohon ini tahun 2020.` | Lebih baku dengan kata depan. | `…pada tahun 1990.` / `…pada tahun 2020.` |
| C23 | L | grammar-trailblazer / `reported-requests-commands` | `transforms[1].originalId` | `Bisakah kamu jagain kursiku sebentar?` | Ragam "jagain" (cakapan) bercampur dengan "Bisakah" (baku). | `Bisakah kamu menjaga kursiku sebentar?` |
| C24 | L | grammar-trailblazer / `reported-requests-commands` | `transforms[4].originalOptions[0]` | `Don't return your book by Friday.` | Perintah ini janggal secara makna (sengaja dibuat pengecoh, tapi aneh). | `Don't return your book before Friday.` |
| C25 | L | grammar-trailblazer / `relative-clauses` | `transforms[2].originalId` | `Bu Rina adalah gurunya.` | "gurunya" bisa terbaca "guru dia". | `Bu Rina adalah guru itu.` |
| C26 | L | grammar-trailblazer / `relative-clauses` | `transforms[7].original` / `.originalId` | `Doctors are people. They help sick people.` / `Dokter adalah orang.` | Kalimat 1 terasa hampa ("Dokter adalah orang"). | Boleh dibiarkan (contoh klasik buku teks). Kalau diubah, ubah artinya saja: `Dokter adalah orang. Mereka menolong orang sakit.` menjadi `Dokter itu menolong orang sakit.` (bagian kalimat 1 di `id`) |
| C27 | L | grammar-trailblazer / `relative-clauses` | `transforms[0].originalId` | `Dia berbicara tiga bahasa.` | Lebih natural begini. | `Dia bisa berbicara tiga bahasa.` |
| C28 | L | grammar-trailblazer / `first-conditional` | `transforms[9]` (semua kalimat) | `The battery might run out.` / `If the battery runs out…` | Catatan aturan: kata "run" dihindari. Di sini maknanya "habis" (bukan lari), jadi kemungkinan boleh. Mohon dikonfirmasi. | Kalau mau aman: `The battery might die.` / `If my phone battery is empty…` |
| C29 | L | speaking-achiever / `hiburan-favoritku` | `roleplay[2].answer.en` | `…because I can run and breathe fresh air.` | Catatan aturan: "run" dihindari sebagai kata yang diucapkan anak. | `…because I can play and breathe fresh air.` |
| C30 | L | speaking-achiever / `deskripsi-orang` | `roleplay[1].q.id` | `Ceritakan seseorang di keluargamu.` | "Describe" artinya menggambarkan, bukan menceritakan. | `Gambarkan salah satu anggota keluargamu.` |
| C31 | L | speaking-achiever / `angka-di-sekitarku` | `drill[0].id` | `Aku masih punya tujuh puluh halaman untuk dibaca.` | Terjemahan harfiah. | `Masih ada tujuh puluh halaman lagi yang harus kubaca.` |
| C32 | L | speaking-achiever / `angka-di-sekitarku` | `roleplay[1].answer.id`; `choices[0].en` | `tidak apa untuk ulang tahun…`; `I think it is too much, because a small gift…` | "tidak apa" seharusnya "tidak apa-apa". Koma sebelum "because" tidak perlu. | `tidak apa-apa`; `I think it is too much because…` |
| C33 | L | speaking-achiever / `cerita-dan-alasan` | `stories[1].lines[1].en` | `The trees are moving and the sky is grey.` | "moving" kurang tepat untuk pohon yang tertiup angin. | `The trees are swaying and the sky is grey.` |
| C34 | L | speaking-trailblazer / `olahraga-kesehatan` & `teknologi-media-sosial` | `olahraga-kesehatan.turns[3].choices[1].en`; `teknologi-media-sosial.turns[7].choices[1].en` | `…at my own speed.` | Kolokasi yang natural adalah "at my own pace". | `…at my own pace.` |
| C35 | L | speaking-trailblazer / `akhir-pekanku` | `turns[4].choices[2].id` | `…bangun siang karena lelah sekolah.` | Kata "karena" kurang. | `…karena lelah setelah sekolah.` |
| C36 | L | speaking-trailblazer / `arti-persahabatan` | `turns[2].choices[2].id`; `turns[6].choices[2].en` | `…menggambar komik dan saling berbagi.`; `I prefer real friends because…` | Objek "berbagi" hilang. "real friends" menyiratkan teman online itu palsu. | `…dan saling berbagi komiknya.`; `I prefer friends I can meet in person because…` |
| C37 | L | speaking-trailblazer / `tempat-tinggalku` | `turns[5].choices[2].id`; `turns[7].peerAnswer.en` | `pasar lama yang besar`; `…now than before. However, there are fewer trees than before.` | "pasar tua" lebih natural. "than before" diulang 2x. | `pasar tua yang besar`; `However, there are fewer trees.` |
| C38 | L | speaking-trailblazer / `sekolah-pelajaran` | `turns[0].choices[2].id` | `Pelajaran favoritku olahraga karena aku suka olahraga.` | Pengulangan kata yang janggal. | `Pelajaran favoritku PJOK karena aku suka olahraga.` |
| C39 | L | speaking-trailblazer / `musik-dan-film` | `turns[1].peerAnswer.en` & `choices[0].en` | `Yes, I play the piano a little bit every week.` | Agak janggal. | `Yes, I practice the piano a little every week.` |
| C40 | L | speaking-trailblazer / `makanan-favoritku` / `hari-libur-tradisi-keluarga` / `cerita-dan-simpulkan` | `makanan-favoritku.turns[5].peerAnswer.id` & `choices[0].id`, `choices[2].id`; `hari-libur-tradisi-keluarga.turns[1].peerAnswer.en`/`.id`; `cerita-dan-simpulkan.stories[1].lines[0].id`/`[3].id` | `tidak apa sesekali` / `tidak apa asal…`; `I help her wrap it` / `membantunya membungkus`; `Kota berencana…` | "tidak apa" seharusnya "tidak apa-apa". Selongsong ketupat dianyam, bukan dibungkus. "Kota" sebagai pelaku lebih natural "Pemerintah kota". | `tidak apa-apa`; `I help her weave the casing` / `membantunya menganyam`; `Pemerintah kota berencana…` / `Akhirnya, pemerintah kota memutuskan…` |

### D. Listening Little Stars & Starter

**Cakupan**: `listening-little-stars.json` (11 topik × 10 item = 110 item) + `listening-starter.json` (10 topik × 10 item = 100 item) = **210 item**, masing-masing dicek `example`, `practice`, `test`, `question` (en/id/options). Seluruh file dibaca utuh (tidak sampling). Tidak ada field tambahan (decoys dst.) di kedua file.

**Hasil kunci jawaban**: semua 210 soal punya tepat 1 opsi `ok:true`, dan jawabannya didukung oleh `example`, `practice`, DAN `test`. Pengecoh yang disebut di `test` selalu jelas bukan jawaban (pola "not …"/subjek lain). Tidak ditemukan kunci jawaban salah.

**Jumlah temuan**: H = 0 · M = 15 · L = 14 (total 29)

**Pola berulang**
1. **Label opsi tidak cocok dengan kata tanya** — "How do we sit?" → "Circle", "Where does the driver stop?" → "The Red Light", "When … ice cream?" → "A Hot Day". Maknanya benar, tapi bentuk jawabannya tidak menjawab kata tanyanya (seharusnya "In a Circle", "At the Red Light", "On a Hot Day").
2. **Istilah Indonesia untuk satu kata tidak konsisten antar-field dalam 1 item** — Cross: "tanda plus" vs "tanda silang"; Diamond: "wajik" vs "belah ketupat"; Wrench: "kunci Inggris" vs "kunci pas"; Farm: "Ladang" vs "peternakan"; Pizza: "pizza" vs "piza"; Yogurt: "yogurt" vs "yoghurt"; Cookie: "biskuit" vs "kue kering". Ada yang cuma soal gaya, ada yang mengubah arti (tanda silang = ×, kunci pas ≠ kunci Inggris).
3. **Terjemahan pertanyaan kaku/harfiah** — "Kami bertepuk apa?", "Kami mengunjungi siapa naik pesawat?", "Kami merosot", "Langitnya ada bintang."

| # | Sev | File / topik (id) | Lokasi field | Teks sekarang | Masalah | Saran perbaikan |
|---|---|---|---|---|---|---|
| D1 | M | LS / bentuk-benda | items[8] (Cross): `id`, `example.id`, `practice.id` vs `test.id` | "Tanda Plus" / "Stikernya bukan bintang. Bentuknya tanda silang." | Satu item dua istilah. Dalam Bahasa Indonesia "tanda silang" = ×, sedangkan kata itu diajarkan sebagai "tanda plus" (+). Anak dapat dua arti berbeda untuk "cross". Hal yang sama ada di items[9].test.id "bukan tanda silang". | Seragamkan: `test.id` "…Bentuknya tanda plus." dan items[9] "…bukan tanda plus." |
| D2 | M | Starter / pergi-ke-mana | items[5] `id` vs `example.id`/`practice.id`/`test.id` | "Ladang" / "Kami memberi makan sapi di peternakan." | Kata targetnya diterjemahkan "Ladang" (lahan tanaman), padahal semua kalimatnya tentang sapi dan memakai "peternakan". items[4].test.id juga memakai "Petani bekerja di kebun". | `id` → "Peternakan" (atau "Pertanian/Peternakan"). Konsistenkan terjemahan "farm" di topik ini. |
| D3 | M | Starter / perkakas-tukang | items[2] `test.id` | "Dia memperbaiki sepeda dengan kunci pas, …" | Kata itu diajarkan sebagai "kunci Inggris"; "kunci pas" alat yang berbeda. | "…dengan kunci Inggris, …" |
| D4 | M | LS / di-sekolah | items[8] `question.en` + opsi | "How do we sit?" → "Circle" | "Circle" tidak menjawab "How". Anak mendengar "We sit in a circle" tapi memilih label yang tidak cocok secara gramatikal. | Opsi: "In a Circle / In a Square / In a Triangle / In a Star", atau tanya "What shape do we sit in?" |
| D5 | M | LS / baju-favorit | items[1] `question.en` | "What long clothes does she wear?" | Tidak natural ("long clothes"). | "What does she wear on her legs?" / id "Dia memakai apa di kakinya?" (atau "What long pants…" dihindari krn bocor). |
| D6 | M | LS / baju-favorit | items[4] `question.en` | "What warm clothes does she wear?" | Tidak natural, dan Gloves/Scarf di opsi juga "warm clothes". Jawaban tetap terbantu stimulus, tapi kalimat tanyanya janggal. | "What does she wear on her feet?" / id "Dia memakai apa di kakinya?" |
| D7 | M | LS / di-sekolah | items[7] `question.id` | "Kami bertepuk apa?" | "Bertepuk tangan" frasa tetap; kalimatnya harfiah dan janggal. | "Apa yang kami tepukkan?" |
| D8 | M | LS / naik-apa | items[4] `question.id` | "Kami mengunjungi siapa naik pesawat?" | Urutan kata kaku. | "Kami naik pesawat untuk mengunjungi siapa?" |
| D9 | M | LS / bentuk-benda | items[3] `example.en` / `example.id` | "The sky has a star." / "Langitnya ada bintang." | EN kurang natural; ID tidak gramatikal ("Langitnya ada…"). | EN "There is a star in the sky." / ID "Ada bintang di langit." (practice-nya sudah "I see a star in the sky", jadi buat beda: "A star is in the sky.") |
| D10 | M | Starter / pergi-ke-mana | items[7] `example.en`/`.id`, `question.id` | "We slide at the playground." / "Kami merosot di taman bermain." / "Di mana kami merosot?" | "Merosot" (meluncur turun/menurun) tidak dipakai untuk main perosotan. EN "we slide" juga kurang lazim. | EN "We go down the slide at the playground." / ID "Kami main perosotan di taman bermain." / Q.id "Di mana kami main perosotan?" |
| D11 | M | LS / naik-apa | `title` | "Naik Apa? (Let’s Go!)" | Bagian Inggris bukan terjemahan judul Indonesia (aturan "Indonesia (English)"). | "Naik Apa? (How Do We Go?)" atau ubah judul jadi "Ayo Berangkat! (Let's Go!)". |
| D12 | M | Starter / hitung-belasan | items[5] `test.en` | "There were twelve candles last year. Now she counts sixteen." | Lilin ulang tahun 12 lalu 16 setahun kemudian, tidak logis (umur cuma naik 1). | "Her brother has twelve candles on his cake. She counts sixteen." |
| D13 | M | LS / baju-favorit & naik-apa | items[8] `test.en` (baju-favorit); items[0] `test.en` (naik-apa) | "…in the mountains, not the beach." / "…to the park, not school." | Tidak paralel; preposisinya hilang. | "…in the mountains, not at the beach." / "…to the park, not to school." |
| D14 | M | LS / perkenalan-diri | items[3]/[4]/[6] `practice.en` | "Blue is the color Ara likes best." / "An apple is the snack Ara picks." / "Singing songs is what Ara loves." | Kalimat cleft/relatif ini terlalu rumit untuk Little Stars (3–5 th), apalagi ini bentuk dengar saja; kalimat lain di level ini SVO pendek. | "Ara likes blue a lot." / "Ara picks an apple." / "Ara loves to sing songs." |
| D15 | M | LS / di-sekolah | items[4] `test.en` / `test.id` | "Her brother is home. She plays with her friend." / "Saudara laki-lakinya di rumah." | "Her brother is home" tidak benar-benar mengecualikan Brother (kakaknya ada di rumah, bisa saja bermain dengannya). ID "Saudara laki-lakinya di rumah" kaku. | "Her brother is at school. She plays with her friend." / "Kakak laki-lakinya sedang di sekolah. Dia bermain dengan temannya." |
| D16 | L | Starter / siapa-itu | items[7] `question.en` + opsi; `question.id` | "Where does the driver stop?" → "The Red Light"; "Di mana supir itu berhenti?" | Label tanpa preposisi; "supir" tidak baku (KBBI: sopir) dan beda dengan `id` "Sopir". | Opsi "At the Red Light / At the Green Light / …"; Q.id "Di mana sopir itu berhenti?" |
| D17 | L | Starter / waktu-makan | items[3] opsi | "A Hot Day / A Rainy Day / A Cold Night / School Time" | Q "When…?" → seharusnya "On a Hot Day" dst. | "On a Hot Day / On a Rainy Day / On a Cold Night / At School" |
| D18 | L | Starter / hari-di-kalender | items[7] `question.en` | "What day is sunny?" (opsi termasuk "Friday") | "What day" mengharapkan nama hari; kurang pas untuk Today/Tomorrow/Yesterday. | "Which day is sunny?" |
| D19 | L | LS / bentuk-benda | items[5] `test.id` | "…Bentuknya belah ketupat." | Kata target diterjemahkan "wajik" di field lain. Arti benar, tapi tidak konsisten. | "…Bentuknya wajik." |
| D20 | L | LS / bentuk-benda | items[9] `example.id` vs `test.id` | "Rambunya…" / "Papannya berbentuk panah…" | "The sign" diterjemahkan 2 cara dalam 1 item. | Pakai "Rambunya" di keduanya. |
| D21 | L | LS / bentuk-benda | items[6] `example.en` | "The egg is an oval." | Lebih natural "The egg is oval." (practice/test bisa tetap "an oval"). | "The egg is oval." |
| D22 | L | LS / halo-terima-kasih | items[3] `question.en` | "What does she say for the gift?" | Sedikit janggal. | "What does she say when she gets the gift?" |
| D23 | L | LS / di-sekolah | items[4] `practice.id` | "Dia bermain dengan sahabat baiknya." | "good friend" = "teman baik"; "sahabat" = best friend (lebih dari sumbernya). | "Dia bermain dengan teman baiknya." |
| D24 | L | Starter / waktu-makan | items[0] `test.id` | "…berbagi piza hari Jumat." | Field lain di item ini "pizza". | Seragamkan "pizza" (atau "piza" di semua). |
| D25 | L | Starter / waktu-makan | items[9] `test.id` | "…yoghurt dengan buah…" | Field lain "yogurt". | "yogurt" |
| D26 | L | Starter / waktu-makan | items[5] `test.id` | "Dia memanggang kue kering bersama nenek…" | Kata target diterjemahkan "Biskuit". | "Dia memanggang biskuit bersama nenek…" |
| D27 | L | Starter / perkakas-tukang | items[0] `practice.en`, `question.en`; items[1] `question.en`; items[5] `question.en` | "…dad makes a new chair." / "What does dad build?" / "What does mom fix?" / "Where does dad keep his tools?" | "Dad/Mom" dipakai sebagai nama (tanpa "my/the"), jadi huruf kapital; `test.en` di topik ini sudah "Dad"/"Mom". | "Dad"/"Mom" kapital. |
| D28 | L | Starter / hari-di-kalender | items[1] `test.id` | "Kami belajar musik hari Senin dan kelas seni hari Selasa." | "belajar … kelas seni" tidak paralel. | "Kami ada pelajaran musik hari Senin dan kelas seni hari Selasa." |
| D29 | L | LS (beberapa topik) | mis. kegiatan-sehari-hari items[5] `question.id` "Kami…" vs `test.id` "Kita main bola"; naik-apa items[0] "Kami…" vs "Kita naik mobil…"; di-sekolah items[7]/[8]/[9] | "Kami" vs "Kita" | Kata ganti "we" di pertanyaan & kalimat tes beda (kami/kita) dalam 1 item. | Seragamkan per item (mis. "Kami" di semua). |

Catatan di luar temuan (sesuai brief, tidak dihitung): kata "running"/"run" muncul di LS kegiatan-sehari-hari items[0] (test + opsi) dan Starter sekolahku items[9].practice ("we run and play tag"). Dua-duanya cuma pelengkap, bukan materi, jadi masih boleh menurut CLAUDE.md §8b.

### E. Listening Explorer & Adventurer

File: `listening-explorer.json` (`LISTENING_TOPICS`, 10 topik), `listening-adventurer.json` (`LISTENING_TOPICS_ADVENTURER`, 10 topik). Dibaca seluruhnya: 20 topik × (10 `kenalanGame` + 1–2 `drill` + `story` + `question`/`decoys`).

**Ringkasan**
- Item dicek: ±290 (200 kalimat+pertanyaan `kenalanGame`, 39 `drill`, 20 `story`, 20 `question` + 40 `decoys`).
- Temuan: **H = 1**, **M = 11**, **L = 13**.
- Secara umum data bersih: semua `question` Tantangan bisa dijawab dari `story`, tepat 1 opsi benar, dan 39 dari 40 decoy memang tidak disebut di cerita.
- Pola yang berulang:
  1. **Pertanyaan yang terlalu umum/longgar** sehingga opsi lain ikut benar atau jawabannya bisa ditebak (capital tanpa "of Japan", "What looks white?" → "White Teeth", "Money" vs "Coin").
  2. **Bahasa Inggris lisan yang sedikit janggal** di kalimat dialog (Let us eat, Which platform is our train?, How is the train?, spicier than last night, I bring my own bag).
  3. **Terjemahan Indonesia yang pilih kata kurang tepat/kaku** (menjenguk, isi cangkirnya dengan apa, main game, kapital sapaan "dokter").

| # | Sev | File / topik (id) | Lokasi field | Teks sekarang | Masalah | Saran perbaikan |
|---|---|---|---|---|---|---|
| E1 | H | explorer / `dari-mana` | `kenalanGame[6].question.en` (+`.id`) | "Which city is the capital?" / "Kota mana yang jadi ibu kota?" | Pertanyaan tidak menyebut negaranya. Keempat opsi (Tokyo, Seoul, Bangkok, Jakarta) SEMUANYA ibu kota, jadi ada 4 jawaban benar. | "Which city is the capital of Japan?" / "Kota mana yang jadi ibu kota Jepang?" ("Japan" tidak ada di opsi, jadi tidak bocor) |
| E2 | M | adventurer / `depan-cermin` | `kenalanGame[3].question` vs opsi | Q: "What looks white in the mirror?" — opsi benar "White Teeth" | Kata "white" ada di pertanyaan DAN cuma di opsi benar (pola bocor #2), jadi bisa ditebak tanpa mendengar. Opsinya juga berulang ("white? → white teeth"). | Ganti pertanyaan: "What does Dodi see when he smiles?" lalu opsi tanpa kata sifat: "Teeth / Ears / Hair / Nose", atau tetap "White Teeth" tapi pertanyaannya "What makes Dodi say 'wow'?" |
| E3 | M | explorer / `di-kasir` | `kenalanGame[0].question.options` | "Money" (ok) vs "Coin", "Card" | Audio: "Here is my money." Koin (dan kartu) juga termasuk "money", jadi "Coin" bisa dianggap ikut benar. | Ganti pengecoh "Coin" dengan yang jelas bukan alat bayar, mis. "🎫 Ticket" atau "🧸 Toy"; atau ubah kalimat jadi "Here is my paper money." + opsi "Paper Money". |
| E4 | M | explorer / `jadwal-harian` | `question.decoys[0]` | decoy "🌅 Morning" | Decoy wajib TIDAK disebut di audio, padahal `story[0]` = "Farah wakes up in the morning." (Masih salah sebagai jawaban, jadi kuncinya aman; tapi melanggar aturan decoy "tidak terdengar".) | Ganti decoy dengan waktu yang tidak disebut, mis. "🕛 At Noon" / "🌃 Midnight" (Night sudah ada sebagai decoy ke-2). |
| E5 | M | adventurer / `hari-olahraga` | `kenalanGame[1]` (`en`, `question.options[0]`) | "She Ran the Fastest" — "Tina won because she ran the fastest." | Kata "run" dijadikan jawaban benar/materi, padahal sengaja dihindari (CLAUDE.md 8b: tidak boleh jadi jawaban benar). | Ganti lomba lain, mis. "Who won the race? Tina won because she swam the fastest." → "She Swam the Fastest", atau lomba sepeda "she cycled the fastest". |
| E6 | M | adventurer / `makan-malam` | `story[0]`, `story[2]` | "I brought some bread, but we are not eating bread tonight." … "Great! Let us eat noodle soup together." | Baris 1 tidak logis (dia sendiri yang bawa roti lalu bilang tidak dimakan). "Let us eat" kaku; orang Inggris bilang "Let's". | "I brought some bread. Are we eating bread tonight?" / "No, I cooked noodle soup." / "Great! Let's eat noodle soup together." (decoy & jawaban tetap) |
| E7 | M | adventurer / `stasiun-kereta` | `kenalanGame[2].example.en` | "Which platform is our train? It is platform three." | Tidak natural. Penutur asli bilang "Which platform is our train **on**?" | "Which platform is our train on? It is on platform three." |
| E8 | M | adventurer / `stasiun-kereta` | `kenalanGame[0].question.en` | "How is the train?" | "How is X?" menanyakan kabar/keadaan, bukan sifat. Untuk sifat (cepat/lambat) yang benar "What is the train like?" | "What is the train like?" / "Keretanya seperti apa?" |
| E9 | M | adventurer / `stasiun-kereta` | `kenalanGame[6].example.id` & `en`/`id` item | "…untuk menjenguk Nenek." / "Untuk Menjenguk Nenek" | "Menjenguk" (KBBI) dipakai untuk mengunjungi orang sakit. Kalimat Inggrisnya cuma "visit Grandma". | "…untuk mengunjungi Nenek." / "Untuk Mengunjungi Nenek" |
| E10 | M | adventurer / `makan-malam` | `kenalanGame[3].example.en` | "Yes, it is spicier than last night." | Bentuk perbandingannya janggal (ayam dibandingkan dengan "malam"). | "Yes, it is spicier than last night's chicken." / "Yes, even spicier than last night." |
| E11 | M | explorer / `di-kasir` | `kenalanGame[4].example.en` | "No, I bring my own bag." | Saat menjawab di kasir, yang natural adalah lampau/keadaan: "I brought my own bag" / "I have my own bag." | "No, thanks. I brought my own bag." |
| E12 | M | explorer / `perkenalan` | `kenalanGame[0].question` | "What does Rafi say first?" / "Apa yang pertama Rafi sebutkan?" | Audionya cuma "My name is Rafi." Tidak ada urutan, jadi kata "first" membingungkan. | "What does Rafi tell us?" / "Rafi memberi tahu apa?" |
| E13 | L | explorer / `toko` | `story[2]` | "The apple is ten thousand rupiah." | Untuk harga, yang lebih natural adalah "costs". | "The apple costs ten thousand rupiah." |
| E14 | L | explorer / `toko` | `kenalanGame[9].question` | "Which ice cream flavor does Bayu pick?" / "…yang dipilih Bayu?" | Audio: "I like chocolate" (suka, bukan memilih). Kecil, tapi pertanyaannya bisa disesuaikan. | "Which ice cream flavor does Bayu like?" / "Rasa es krim apa yang disukai Bayu?" |
| E15 | L | explorer / `klinik` | `kenalanGame[5].example.id` | "Sekarang aku harus apa, dokter?" | PUEBI: kata yang dipakai sebagai sapaan ditulis kapital. | "…, Dokter?" |
| E16 | L | explorer / `pesta-ulang-tahun` | `kenalanGame[0].question.en` | "What does the guest bring for Galih?" | Audio ("Happy birthday! I have a present for you.") tidak menyebut Galih atau tamu. Masih bisa dijawab, tapi subjeknya muncul tiba-tiba. | "Happy birthday, Galih! I have a present for you." |
| E17 | L | explorer / `di-dapur` | `kenalanGame[7].question.id` | "Ayah mau isi cangkirnya dengan apa?" | Kaku (terjemahan harfiah). | "Ayah mau minum apa di cangkirnya?" |
| E18 | L | adventurer / `bandara` | `drill[1].id` | "Aku perlu check-in tasku." | Campur kode yang tidak perlu. | "Aku perlu memasukkan tasku ke bagasi." |
| E19 | L | adventurer / `bandara` | `kenalanGame[4].example.id` | "Kamu duduk di mana di pesawat, Kevin?" | Kalimat Inggrisnya lampau ("did you sit"); terjemahannya tanpa penanda waktu dan ada "di" ganda. | "Tadi kamu duduk di mana waktu di pesawat, Kevin?" |
| E20 | L | adventurer / `bandara` | `kenalanGame[0].example.en` | "Where is the gate? My flight is delayed." | Dua kalimat kurang nyambung (pesawat tertunda tapi menanyakan gerbang). | "Where is the gate? My flight leaves soon." |
| E21 | L | adventurer / `hari-olahraga` | `kenalanGame[4].example.en` | "How many times can you jump the rope, Andi?" | Ungkapan bakunya "jump rope" (AmE) / "skip" (BrE); "jump the rope" janggal. | "How many times can you jump rope, Andi? I can jump thirty times." |
| E22 | L | adventurer / `makan-malam` | `kenalanGame[5].example.id`, `id` | "…karena kami main game." / "Mereka Main Game" | KBBI: "gim". Lebih natural lagi "main permainan/main bareng". | "…karena kami main gim." / "Mereka Main Gim" |
| E23 | L | adventurer / `ramalan-cuaca` | `story[1]` | "Today the sky is sunny." | Yang cerah adalah cuacanya/harinya, bukan langitnya ("the sky is clear/blue"). | "Today it is sunny." |
| E24 | L | adventurer / `ramalan-cuaca` | `kenalanGame[7].example.id` | "Hari ini aku pakai apa?" | "What should I wear" artinya "sebaiknya/harus pakai apa". | "Hari ini aku harus pakai apa?" |
| E25 | L | adventurer / `depan-cermin` | `kenalanGame[6].question.options` | "The Mom" / "The Dad" | Dalam bahasa Inggris "Mom/Dad" tidak memakai "The". | "Mom" / "Dad" (atau "His Mom"/"His Dad" sesuai pola opsi lain) |

Catatan (bukan temuan): semua `question` Tantangan di kedua level tepat 1 jawaban benar dan didukung `story`. Decoy lain (39/40) tidak disebut di cerita. Opsi teks "Run Home" (`di-kasir` K1) dan "To Run Fast" (`depan-cermin` K9) cuma pengecoh teks, jadi masih dibolehkan oleh aturan 8b.

### F. Listening Achiever & Trailblazer

File: `c/listening-achiever.json` (10 topik, `items` + `notePassage`/`noteGaps`), `c/listening-trailblazer.json` (10 topik, `items` + `dialogueLines`/`inferenceQuestions`).

**Dicek**: 200 item (keyword, example, practice, question + 4 opsi) ≈ 800 kalimat/frasa; 10 catatan (44 baris passage, 35 gap + decoys); 10 dialog (70 baris EN+ID, 30 pertanyaan inferensi + decoys). Semua opsi `ok:true` tepat 1 per soal; `answer` noteGaps selalu ada di `options` (dicek skrip). Decoys dicek otomatis terhadap teks audio.

**Temuan**: H = 1, M = 27, L = 16 (total 44).

**Pola berulang**
1. **Pengecoh lisan yang dipaksakan** — demi aturan "distraktor disebut lewat penyangkalan", beberapa baris jadi janggal/tidak nyambung ("not about the author", "not five", "I do not need the company address", "The size is too small, not the color", "but her mom does not hear"). Kunci jawabannya tetap jelas, tapi kalimatnya tidak natural.
2. **`questionId` pertanyaan gist Trailblazer** selalu "X dan Y **sebenarnya** membicarakan apa?" (10 topik) — "mainly" = "terutama/pada intinya", bukan "sebenarnya" (= actually, menyiratkan ada yang tersembunyi).
3. **Terjemahan kata kunci kurang pas / bentrok**: Cute=Lucu (sama dengan Funny=Lucu), Quiet=Tenang, Litter=Sampah Berserakan (dipakai sebagai kata kerja), Landmark=Tengara (kata langka utk anak), Indonesia harfiah ("mencium roti segar", "berbisik rahasia", "Bahkan dengan laba-laba", "Baik untuk diketahui").

| # | Sev | File / topik (id) | Lokasi field | Teks sekarang | Masalah | Saran perbaikan |
|---|---|---|---|---|---|---|
| F1 | H | achiever / `akhir-pekan-seru` | `noteGaps[2].options` | "Chess / Video Game / Board Game" (jawaban "Chess") | Catur ADALAH permainan papan (board game) — opsi "Board Game" ikut benar, jadi ada 2 jawaban benar. | Ganti opsi "Board Game" dgn hal yang tidak dimainkan, mis. "Cards" atau "Football" (pindahkan decoy "Cards" ke opsi, isi decoy baru mis. "Puzzle"). |
| F2 | M | achiever / `akhir-pekan-seru` | `notePassage[3].en` | "We want to play a video game, but we will play chess together." | Logika janggal: "ingin X tapi akan Y" tanpa alasan. | "We wanted to play a video game, but we will play chess together instead." / id: "Tadinya kami mau main gim video, tapi akhirnya kami main catur bersama." |
| F3 | M | achiever / `menghitung-uang-saku` | `noteGaps[0].decoys`, `noteGaps[1].decoys` | decoy "Fifty" | "fifty" DISEBUT di audio ("not fifty", `notePassage[3]`) — decoy seharusnya kata yang tidak terdengar. | Ganti decoy "Fifty" dgn "Eighty"/"Twenty" (yang tidak disebut di passage). |
| F4 | M | achiever / `di-taman-bermain` | `notePassage[3].en` | "Her friend shouts her name loudly, but her mom does not hear." | Ibu tiba-tiba muncul & tidak nyambung; dipaksa demi pengecoh "Her Mom". | "Her friend shouts her name loudly — her mom stays quiet on the bench." / atau "It is her friend, not her mom, who shouts her name." |
| F5 | M | achiever / `di-taman-bermain` | `items[6].example.en` | "She needs to shout for her friend to wait." | Struktur janggal. | "She shouts to her friend to wait." / id: "Dia berteriak menyuruh temannya menunggu." |
| F6 | M | achiever / `di-taman-bermain` | `items[7].example.id` | "Dia berbisik rahasia padaku." | Indonesia kaku; "berbisik" intransitif. | "Dia membisikkan rahasia kepadaku." |
| F7 | L | achiever / `di-taman-bermain` | `items[2].example.id` | "Dia melempar bola pada temannya." | "pada" utk penerima arah → "kepada". | "Dia melempar bola kepada temannya." |
| F8 | L | achiever / `di-taman-bermain` | `items[2].practice.en` | "His friend gets the ball he throws." | "gets" kurang natural utk menangkap bola. | "His friend catches the ball he throws." |
| F9 | L | achiever / `di-taman-bermain` | `items[2].en`, `items[5].en`, `items[7].en`, `items[9].en` | "Throws", "Cries", "Whispers", "Flies" | Kata kunci campur bentuk -s dan bentuk dasar ("Climb", "Catch", "Hide") dalam 1 topik. | Seragamkan ke bentuk dasar: Throw, Cry, Whisper, Fly (cek `example` masih memuat kata—kalau dicek word-boundary, sesuaikan). |
| F10 | L | achiever / `di-taman-bermain` | `notePassage[0].id` | "Kiki dan teman-temannya bermain di taman." | playground = taman bermain (judul topik pun "Di Taman Bermain"). | "...bermain di taman bermain." |
| F11 | M | achiever / `siapa-dia` | `items[9].id` | "Cute" = "Lucu" | Bentrok dgn Funny=Lucu (`teman-baikku`); cute = imut/menggemaskan. | "Imut" / "Menggemaskan"; example.id "Anak kucing itu terlihat imut." |
| F12 | M | achiever / `siapa-dia` | `items[4].question.en` | "How old is the book?" → "Very Old" | "How old" menanyakan umur (angka); jawaban "Very Old/Very New" tidak cocok. | "What is the book like?" / id "Bagaimana buku itu?" |
| F13 | L | achiever / `siapa-dia` | `notePassage[3].id` | "Semua orang pikir dia sangat ramah." | Kurang baku. | "Semua orang menganggap dia sangat ramah." |
| F14 | M | achiever / `jalan-jalan-kota` | `items[9].example.id` | "Dia mencium roti segar di toko roti." | "mencium roti" terbaca 'mengecup roti'. | "Dia mencium aroma roti segar di toko roti." (practice.id: "Toko roti itu harum roti segar.") |
| F15 | L | achiever / `jalan-jalan-kota`, `akhir-pekan-seru` | `items[7].question.en`; `items[9].question.en`, `items[9].practice.en` | "What does mom buy?", "When does mom read a magazine?", "mom sits down" | "Mom" dipakai sbg sapaan/nama → kapital. | "Mom" |
| F16 | M | achiever / `teman-baikku` | `noteGaps[1].question` | "What is he sharing?" / "Apa yang sedang dia bagikan?" | Passage: "always shares" (kebiasaan), bukan sedang berlangsung. | "What does he always share?" / "Apa yang selalu dia bagikan?" |
| F17 | M | achiever / `teman-baikku` | `items[3].example.id` | "Temannya bercerita lelucon yang lucu." | "bercerita" tidak bisa berobjek. | "Temannya menceritakan lelucon yang lucu." |
| F18 | M | achiever / `teman-baikku` | `items[1].practice` | "Even with a spider, he stays brave." / "Bahkan dengan laba-laba, dia tetap berani." | EN kurang natural; ID harfiah. | "Even when he sees a spider, he stays brave." / "Bahkan saat melihat laba-laba, dia tetap berani." |
| F19 | L | achiever / `teman-baikku` | `items[9].practice.id` | "jadi dia percaya diri untuk ujiannya" | Kolokasi. | "jadi dia percaya diri menghadapi ujiannya" |
| F20 | M | achiever / `jadwal-pelajaran` | `notePassage[0].id` | "Vino, apakah hari ini kamu ada Seni pertama?" | Terjemahan harfiah, janggal. | "Vino, apakah pelajaran pertamamu hari ini Seni?" |
| F21 | L | achiever / `jadwal-pelajaran` | `items[3].example.id`; `items[8].question.id` | "Kami belajar kerajaan kuno..."; "Kita belajar tentang apa di kelas IPS?" | Kurang "tentang"; "Kita" tidak konsisten dgn "Kami" di semua item lain. | "Kami belajar tentang kerajaan kuno..."; "Kami belajar tentang apa di kelas IPS?" |
| F22 | M | achiever / `di-toko-kerajinan` | `notePassage[3].en` | "The first glitter looks dark, so the glitter he picks is very bright." | Struktur janggal. | "The first glitter he sees looks dark, so he picks a very bright one." / id: "Glitter pertama yang dia lihat tampak gelap, jadi dia memilih yang sangat terang." |
| F23 | L | achiever / `di-toko-kerajinan` | `items[8].id` | "Quiet" = "Tenang" | Pasangan Loud="Keras (Suara)"; utk toko/suara lebih pas "Sepi/Hening". | "Sepi" (example.id "Toko kerajinan sepi di pagi hari.") |
| F24 | L | achiever / `di-toko-kerajinan` | `items[7].practice.id` | "Dhuk! Palunya berbunyi sangat keras." | Onomatope Indonesia lazim "Duk!"/"Dok!". | "Dok! Palunya berbunyi sangat keras." |
| F25 | L | achiever / `di-lab-komputer` | `notePassage[4].en` | "At the end, the students upload their homework file." | Bu Lina sebelumnya bicara "we"; tiba-tiba orang ketiga. | "At the end, you upload your homework file. You do not download a song today." |
| F26 | L | achiever / `di-lab-komputer` | `noteGaps[1].question` | "What topic is the website about?" | Redundan. | "What is the website about?" |
| F27 | M | trailblazer / semua 10 topik | `inferenceQuestions[0].questionId` | "Rani dan Dimas sebenarnya membicarakan apa?" (pola sama di 10 topik, termasuk "Percakapan ini sebenarnya tentang apa?") | "mainly" ≠ "sebenarnya" (= actually). | "Rani dan Dimas terutama membicarakan apa?" / "Pada intinya, ... membicarakan apa?" |
| F28 | M | trailblazer / `rencana-liburan` | `dialogueLines[2].en` | "Don't forget your passport, we need it at the airport." | Rani & Dimas (anak Indonesia) terbang ke Bali = penerbangan domestik, tidak perlu paspor — fakta keliru. Juga comma splice. | Ganti tujuan ke luar negeri (mis. Singapore) di dialog & opsi, atau ganti "passport" → "ID card / boarding pass": "Don't forget your ID card. We need it at the airport." |
| F29 | L | trailblazer / `rencana-liburan` | `dialogueLines[4].id` | "jadi kita harus berangkat awal." | "berangkat awal" kurang natural. | "jadi kita harus berangkat pagi-pagi." |
| F30 | M | trailblazer / `belajar-bahasa-baru` | `inferenceQuestions[1].question` | "How does Leo feel about his pronunciation?" → "Not Yet Perfect" | Jawaban bukan perasaan; bentuk tanya & opsi tidak cocok. | "What does Leo think of his pronunciation?" / "Menurut Leo, pengucapannya bagaimana?" |
| F31 | L | trailblazer / `belajar-bahasa-baru` | `items[7].question.id`; `dialogueLines[4].id` | "Sepupunya dwibahasa apa saja?"; "That’s smart." = "Cerdas." | Kaku. | "Sepupunya menguasai dua bahasa apa?"; "Pintar juga caranya." |
| F32 | M | trailblazer / `menelpon-jasa` | `items[3].practice.en` | "She books an appointment on Monday." | Ambigu: memesan pada hari Senin vs janji utk hari Senin (pertanyaan: "What day is the appointment?"). | "She books an appointment for Monday." / "Dia membuat janji temu untuk hari Senin." |
| F33 | L | trailblazer / `menelpon-jasa` | topik `id` | "menelpon-jasa" | Ejaan baku "menelepon" (judul sudah benar). Id dipakai kunci progres — jangan diubah kecuali dgn migrasi; catat saja. | (biarkan, atau ganti hanya bila aman) |
| F34 | M | trailblazer / `tukar-barang` | `title` | "Menukar Barang di Toko (Returning an Item)" | "Menukar" = exchanging; "returning" = mengembalikan. Dialognya justru menolak refund/return. | "Menukar Barang di Toko (Exchanging an Item)" |
| F35 | M | trailblazer / `tukar-barang` | `dialogueLines[0].en` | "The size is too small, not the color." | Janggal: warna tidak bisa "too small". | "The problem is the size, not the color — it's too small." / id: "Masalahnya di ukuran, bukan warna — terlalu kecil." |
| F36 | M | trailblazer / `tukar-barang` | `dialogueLines[3].en` | "Yes, we have one size bigger in the fitting room." | Stok tidak disimpan di ruang pas; tidak natural. | "Yes, we have it one size bigger. You can try it in the fitting room." |
| F37 | M | trailblazer / `sebelum-ujian` | `items[2].practice.en` | "Her test result is a good grade." | Janggal. | "She got a good grade on her test." / "Dia dapat nilai bagus di ujiannya." |
| F38 | L | trailblazer / `sebelum-ujian` | `items[1].example.id`, `items[1].practice.id`, `dialogueLines[1].id` | "setiap sore" (every evening) | evening = malam (sesudah magrib); "sore" = afternoon. | "setiap malam" |
| F39 | M | trailblazer / `pendapat-tentang-buku` | `title` | "Membahas Buku (An Opinion About a Book)" | Pasangan tidak cocok. | "Membahas Buku (Discussing a Book)" atau "Pendapat tentang Buku (An Opinion About a Book)" (id topik pun `pendapat-tentang-buku`). |
| F40 | M | trailblazer / `pendapat-tentang-buku` | `dialogueLines[3].en` | "I guess we disagree a little then, not about the author, but about the beginning." | Penulis tidak pernah dibahas — pengecoh dipaksakan, tidak natural. | "I guess we disagree a little about the beginning, then. But we both like the author. What was your favorite part?" |
| F41 | M | trailblazer / `cari-kafe-baru` | `dialogueLines[1].en`; `dialogueLines[5].en` | "I think it’s located near the park, not near the station, close to the old clock tower landmark."; "Going at night is too late, not a good idea." | Bertumpuk/kaku. | "I think it's near the park, not the station — close to the old clock tower."; "If we go at night, it'll be too late." |
| F42 | M | trailblazer / `cari-kafe-baru` | `items[1].id`; `items[3].example` | "Landmark" = "Tengara"; "The café has a bakery nearby." = "Kafe itu punya toko roti di dekatnya." | "Tengara" kata sangat langka utk anak (pakai "Tempat terkenal/Penanda"); kafe tidak "punya" toko roti. | "Landmark" = "Bangunan Ikonik"; "There is a bakery near the café." / "Ada toko roti di dekat kafe itu." |
| F43 | M | trailblazer / `yuk-daur-ulang` | `items[9].id`; `inferenceQuestions[1].options` | "Litter" = "Sampah Berserakan"; opsi "They Recycle It" | Litter dipakai sbg kata kerja ("don't litter") → kunci "membuang sampah sembarangan". Opsi "Recycle" bisa dianggap benar (kompos = daur ulang sampah organik). | "Membuang Sampah Sembarangan"; ganti opsi "They Recycle It" → "They Burn It". |
| F44 | M | trailblazer / `wawancara-kerja` | `dialogueLines[1].en`; `dialogueLines[5].en`; `dialogueLines[4].id` | "...not five, but I learn fast."; "I do not need the company address."; "Good to know." = "Baik untuk diketahui." | Pengecoh dipaksa (tidak ada yang menyebut lima tahun/alamat); ID harfiah. | "I have two years of experience in graphic design. It's not a lot, but I learn fast."; hapus kalimat alamat (pilihan salah cukup tidak disebut); "Baik, terima kasih infonya." |

### G. Reading Little Stars, Starter & Explorer

File: `c/reading-little-stars.json` (10 topik), `c/reading-starter.json` (11 topik), `c/reading-explorer.json` (11 topik). Semua dibaca utuh (dirender per topik/teks/baris/soal), plus skrip cek: tiap soal teks Starter/Explorer → jawaban benar didukung baris `evidence`, `near` ≠ `en`, index `evidence` valid.

**Jumlah item dicek (perkiraan):** ±690 baris teks (en+id), ±160 pasangan `near/nearId`, ±650 soal (picture / truefalse / soal teks + opsi + `evidence`).

**Temuan:** H = 1 · M = 16 · L = 14 (total 31)

Secara umum data ini **bersih**: semua index `evidence` menunjuk kalimat yang benar, setiap soal teks punya tepat 1 opsi benar yang didukung teks, pengecoh yang ikut muncul di teks memang jelas bukan jawabannya, dan tidak ada `near` yang sama dengan kalimat aslinya. Temuan lebih banyak soal kealamian & konsistensi terjemahan.

**Pola berulang:**
1. **`sister`/`brother` diterjemahkan "Kakakku"** (dan `nearId` tidak konsisten dengan `id` di baris yang sama) — informasi jenis kelamin hilang, padahal beberapa soal justru membedakan *my sister* vs *my brother*.
2. **`nearId` memakai kata Indonesia lain dari `id`** (hadiah↔kado, perahu motor↔speedboat, mengoleksi↔mengumpulkan, pakai↔memakai, "bilang auum"↔"mengaum") — kecil, tapi pengecoh jadi beda di hal yang bukan detail yang diuji.
3. **Kalimat Indonesia "punya" harfiah** utk *has/have* yang bukan kepemilikan ("Kebun binatang punya hewan besar", "Kuenya punya sembilan belas lilin") dan beberapa kalimat Inggris yang janggal untuk penutur asli ("stops fires", "I have a blue bike today", "A rectangle door").

| # | Sev | File / topik (id) | Lokasi field | Teks sekarang | Masalah | Saran perbaikan |
|---|---|---|---|---|---|---|
| G1 | H | starter / baca-alam | `newTexts[1].questions[2]` (truefalse, `picture: '🌙'`, answer = Salah) | "The moon is round." | Kunci ambigu: bulan memang bulat, anak yang tahu fakta ini akan jawab Benar; gambar sabit tidak membuat kalimat "salah" secara meyakinkan. | Ganti pernyataan jadi pengecoh yang jelas, mis. "The moon is square." dgn 🌕 (Salah), atau pakai gambar lain (⭐) untuk "The moon is round." |
| G2 | M | little-stars / kata-hewan | `texts[0].lines[4]` | "I see my farm!" / "Aku lihat kebunku!" | *farm* berisi sapi/babi/kuda = peternakan, bukan "kebun". "I see my farm" juga janggal. | "This is my farm!" / "Ini peternakanku!" |
| G3 | M | little-stars / kata-bentuk | `newTexts[0].lines[0]`, `lines[3]` | "A rectangle door." / "A rectangle book." | *rectangle* sbg kata sifat kurang baku (baku: *rectangular*); kalimat lain di buku yang sama memakai pola "The X is …". | "The door is a rectangle." / "The book is a rectangle." (near: "The door is round." dst) |
| G4 | M | little-stars / kata-keluarga | `newTexts[0].lines[2].nearId`, `lines[3].nearId` | `id`: "Saudara perempuanku bernyanyi." — `nearId`: "Kakakku menggambar."; `id`: "Saudara laki-lakiku menggambar." — `nearId`: "Kakakku bernyanyi." | `nearId` tidak konsisten dgn `id`; "Kakakku" dipakai utk *sister* & *brother* sekaligus. | `nearId`: "Saudara perempuanku menggambar." / "Saudara laki-lakiku bernyanyi." |
| G5 | M | starter / baca-hobi | `newTexts[0].lines[2].id`, `lines[3].id` | "My brother plays the drum." → "Kakakku main drum."; "My sister plays the violin." → "Kakakku main biola." | Dua tokoh beda diterjemahkan sama; soal Q4 "Who plays the violin?" (My sister vs My brother) — terjemahan di Petunjuk tidak membantu sama sekali. | "Kakak laki-lakiku main drum." / "Kakak perempuanku main biola." |
| G6 | M | starter / baca-angka | `texts[1].lines[0].id`, `lines[2].id`, `questions[1].qId` | "My brother is thirteen years old." → "Kakakku tiga belas tahun."; "My sister is eleven years old." → "Kakakku sebelas tahun." | Sama: gender hilang; plus kurang "berumur". | "Kakak laki-lakiku berumur tiga belas tahun." / "Kakak perempuanku berumur sebelas tahun." |
| G7 | M | starter / baca-tempat | `texts[1].lines[2].id` | "The zoo has big animals." / "Kebun binatang punya hewan besar." | "punya" harfiah, tidak natural. | "Di kebun binatang ada hewan besar." |
| G8 | M | starter / baca-angka | `texts[1].lines[4].id` | "Kuenya punya sembilan belas lilin." | "punya" harfiah. | "Ada sembilan belas lilin di kuenya." |
| G9 | M | starter / baca-angka | `newTexts[1].lines[4]` (+ `near`) | "We win eighteen medals." / "Kami menang delapan belas medali." | "menang medali" tidak baku; seharusnya transitif. | "Kami meraih/memenangkan delapan belas medali." (nearId: "Kami meraih delapan medali.") |
| G10 | M | starter / baca-orang | `newTexts[0].lines[0].en` | "The firefighter stops fires." | Kolokasi tidak natural; penutur asli: *puts out fires*. | "The firefighter puts out fires." |
| G11 | M | starter / buku-di-pantai | `texts[1].lines[3]` | "I jump in the water." / "Aku lompat di genangan air." | `en` vs `id` tidak cocok: *water* (bisa laut/kolam) vs "genangan" (*puddle*). | "I jump in puddles." / "Aku melompat di genangan air." (evidenceWord → "puddles") |
| G12 | M | explorer / cek-keluarga | `newTexts[1].lines[3].en` | "I have a blue bike today." | Janggal; maksudnya kendaraan yang dibawa hari ini. `id` "bawa sepeda biru" juga lebih spesifik dari `en`. | "I'm riding a blue bike today." / "Hari ini aku naik sepeda biru." |
| G13 | M | explorer / cek-angka | `texts[0].lines[1].id` | "Two bags of rice." / "Dua karung beras." | *karung* = sak besar (25–50 kg), tidak wajar disuruh beli anak; *bag* di sini kantong. | "Dua kantong beras." |
| G14 | M | explorer / cek-angka | `texts[1].lines[5]` | "We are open from seven to nine." / "Kami buka jam tujuh sampai sembilan." | Ambigu (terbaca toko buka cuma 2 jam). | "We are open from seven in the morning to nine at night." / "Kami buka dari jam tujuh pagi sampai jam sembilan malam." |
| G15 | M | explorer / undangan-ulang-tahun | `newTexts[0].lines[5].id`, `questions[3].qId` | "Please tell my mom by Friday." → "Tolong kabari ibuku sebelum hari Jumat." | *by Friday* = paling lambat Jumat (Jumat masih boleh); "sebelum hari Jumat" mengubah batas waktu. | "Tolong kabari ibuku paling lambat hari Jumat." (qId: "… paling lambat hari Jumat?") |
| G16 | M | explorer / cek-dapur | `newTexts[0].lines[0].en` | "You need a banana, apple and grapes." | Artikel hilang di depan *apple*; tidak baku. | "You need a banana, an apple and some grapes." |
| G17 | M | explorer / cek-dapur | `texts[1].lines[4].en` | "Put more bread on top." | Janggal untuk 1 lapis roti penutup. | "Put another slice of bread on top." |
| G18 | L | little-stars / kata-hewan | `newTexts[1].lines[3].nearId`, `lines[4].nearId` | `id` "Katak bilang kwak." vs `nearId` "Dua katak bilang kwek."; `id` "Singa bilang auum." vs `nearId` "Dua singa mengaum." | Bunyi/pola tidak konsisten antara `id` dan `nearId`. | "Dua katak bilang kwak." / "Dua singa bilang auum." |
| G19 | L | little-stars / kata-angka | `newTexts[0].lines[1].nearId` | "Aku lihat satu kado." (id: "dua hadiah") | Istilah beda dari `id`. | "Aku lihat satu hadiah." |
| G20 | L | little-stars / kata-mainan | `newTexts[0].lines[1].nearId` | "Aku dapat dua kado." (id: "Aku dapat hadiah.") | Istilah beda dari `id`. | "Aku dapat dua hadiah." |
| G21 | L | little-stars / kata-kendaraan | `newTexts[1].lines[2].nearId`, `lines[4].nearId` | "Aku lihat dua speedboat." (id: "perahu motor"); "Aku lihat dua feri." (id: "kapal feri") | Istilah beda dari `id`. | "Aku lihat dua perahu motor." / "Aku lihat dua kapal feri." |
| G22 | L | little-stars / kata-kendaraan | `texts[1].lines[0].id` | "Aku lihat mobil pemadam." | Kurang lengkap. | "Aku lihat mobil pemadam kebakaran." |
| G23 | L | little-stars / kata-kendaraan | `texts[0].lines[0..4]` | "Go by car!" … "Go by plane!" | Perintah polos agak janggal untuk buku anak. | "Let's go by car!" / "Ayo naik mobil!" (dst) |
| G24 | L | little-stars / kata-warna | `newTexts[0].lines[1].near` | "The grapes are green." | Anggur hijau ada di dunia nyata; aman krn gambar 🍇 ungu, tapi pengecoh lebih jelas kalau warna mustahil. | "The grapes are blue." / "Anggurnya biru." |
| G25 | L | starter / baca-hobi | `newTexts[1].lines[3].nearId` | "Aku mengumpulkan satu stiker." (id: "Aku mengoleksi stiker.") | Kata kerja beda dari `id`. | "Aku mengoleksi satu stiker." |
| G26 | L | starter / baca-angka | `newTexts[1].lines[1].nearId` | "Empat anak memakai sepatu baru." (id: "… pakai sepatu baru.") | Gaya beda dari `id`. | "Empat anak pakai sepatu baru." |
| G27 | L | starter / baca-hari | `newTexts[0].questions[4].qId` | "Kapan aku makan piza?" | Ejaan beda dari baris teks ("pizza"). | "Kapan aku makan pizza?" |
| G28 | L | starter / baca-tempat | `newTexts[1].lines[0].id` | "Ayah berhenti isi bensin." | Kurang kata penghubung. | "Ayah berhenti untuk isi bensin." |
| G29 | L | starter / baca-orang | `newTexts[0].lines[3].en` | "The builder makes a house." | Kolokasi lebih natural: *builds*. | "The builder builds a house." |
| G30 | L | explorer / cek-kesehatan | `texts[0].questions[2].qId`; `texts[0].lines[4].id` | "Budi akan tinggal di mana?"; "Dia akan di rumah dan istirahat." | "tinggal" terbaca "bertempat tinggal"; kalimat kedua kaku. | "Budi akan berada di mana?"; "Dia akan beristirahat di rumah." |
| G31 | L | explorer / undangan-ulang-tahun; cek-kesehatan | `texts[0].lines[4].id`; `newTexts[1].questions[1].options` | "Kita akan makan kue dan main games."; opsi "One time", "Two times" | Campur Inggris ("games"); *once/twice* lebih natural dari "one time/two times". | "… main permainan/gim."; opsi "Once", "Twice" |

Catatan kecil lain (tidak dimasukkan tabel, sangat minor): Explorer `baca-dan-cek` "He sleeps a lot in the day." (lebih natural "during the day"); Explorer `cek-warna` "Wear an old shirt." → "Pakai kemeja lama" ("baju/kaus lama" lebih umum); Starter/Explorer "… sepuluh tahun" tanpa "berumur" di beberapa baris — boleh dirapikan sekalian kalau menyentuh baris itu.

### H. Reading Adventurer & Achiever

File: `c/reading-adventurer.json` (11 topik), `c/reading-achiever.json` (11 topik). Dibaca utuh: 22 topik × 4 teks (texts + newTexts), ±310 baris teks EN/ID + 220 soal (reply/gap/tfn/ref/detail) ≈ 1.050 item dicek.

**Ringkasan:** H = 0, M = 6, L = 15 (total 21).

Semua kunci jawaban dicek ulang terhadap teks: tiap soal tepat 1 opsi benar, `evidence` menunjuk baris yang benar, `tfn` (True/False/Doesn't say) konsisten, `ref` menunjuk kata yang tepat, `reply` — baris pengecoh jelas tidak cocok dengan konteks dialog, hitungan (mis. 900.000 + 30 × 20.000 = 1.500.000) benar. Tidak ditemukan kunci jawaban salah atau grammar Inggris yang salah fatal.

Pola berulang:
1. **Soal `reply` memakai label penutur tanpa artikel** — "What does Staff/Seller/Conductor say?" (label baris dialog dipakai mentah sebagai subjek).
2. **Terjemahan Indonesia harfiah/kaku** di beberapa papan/pengumuman ("Selalu tetap di jalur", "Pertunjukan makan penguin", "Tiketnya, tolong!") dan pola "___ miliknya" di kalimat rumpang.
3. **Ketidakkonsistenan kecil antar kalimat dalam 1 teks/topik** — istilah ID berganti (buncis↔kacang, petugas↔penjaga, IPA↔sains, lari santai↔lomba lari), dan 1 soal "Doesn't say" yang sebenarnya dijawab oleh teks lain di topik yang sama.

| # | Sev | File / topik (id) | Lokasi field | Teks sekarang | Masalah | Saran perbaikan |
|---|---|---|---|---|---|---|
| H1 | M | adventurer / kebun-binatang | `newTexts[0].questions[0].q` & `[3].q` | "What does Staff say?" | Label penutur dipakai sebagai nama; "Staff" tanpa artikel tidak gramatikal sebagai subjek tunggal. | "What does the staff member say?" (atau ganti label baris jadi "Guard"/"Ticket man" dan tanyakan "What does the guard say?") |
| H2 | M | adventurer / belanja-di-pasar | `newTexts[0].questions[0].q` & `[3].q` | "What does Seller say?" | Sama — perlu artikel. | "What does the seller say?" |
| H3 | M | adventurer / perjalanan-kereta | `newTexts[0].questions[0].q` & `[3].q` | "What does Conductor say?" | Sama — perlu artikel. | "What does the conductor say?" |
| H4 | M | adventurer / kebun-binatang | `texts[1].lines[4].id` | "Pertunjukan makan penguin jam 2 siang." | Ambigu: terbaca "pertunjukan memakan penguin". Maknanya penguin diberi makan. | "Pertunjukan memberi makan penguin jam 2 siang." |
| H5 | M | adventurer / perjalanan-kereta | `newTexts[0].lines[0].id` | "Kondektur: Tiketnya, tolong!" | Terjemahan harfiah "please"; tidak natural di Indonesia. | "Kondektur: Tiketnya, silakan!" / "Mohon tunjukkan tiketnya!" |
| H6 | M | achiever / murid-baru-di-kelas | `texts[0].lines[8].en` | "Now they walk home together every day." | Kalimat sebelumnya: Putri menunjukkan jalan ke **halte bus** (Aisha naik bus) — "walk home together" jadi tidak logis. | "Now they walk to the bus stop together every day." / ID "Sekarang mereka berjalan ke halte bersama setiap hari." (Q4 opsi benar ikut disesuaikan) |
| H7 | M | achiever / menggalang-dana-sekolah | `newTexts[0].questions[3]` (tfn) | "Class 6B raised the money with a bake sale." → Doesn't say | Benar untuk email itu saja, tapi cerita `texts[0]` di topik yang sama menyatakan mereka mengadakan *cake sale* — anak yang ingat cerita akan menjawab True. Berisiko dianggap 2 jawaban benar. | Ganti pernyataan dengan hal yang tidak disebut di teks mana pun, mis. "The new books cost 1,000,000 rupiah." / "Class 6B will choose the next books." |
| H8 | L | adventurer / kebun-binatang | `texts[1].lines[3].id` | "Selalu tetap di jalur." | Kaku. | "Selalu berjalan di jalur yang tersedia." |
| H9 | L | adventurer / kebun-binatang & perjalanan-kereta | `texts[1].questions[4].qId` (keduanya) | "Di mana kamu melihat papan ini?" / "Di mana kamu melihat pengumuman ini?" | "would see" = kemungkinan; ID hilang modalnya. (Hari-kemah sudah benar: "akan melihat".) | "Di mana kamu bisa melihat papan/pengumuman ini?" |
| H10 | L | adventurer / kebun-binatang | `texts[0].lines[4].id` | "Lalu, mereka melihat singa tidur di bawah matahari." | Harfiah. | "…singa tidur berjemur di bawah sinar matahari." |
| H11 | L | adventurer / kebun-binatang | `newTexts[1].lines[5].id` | "Nama teratas adalah Bella, Lulu, dan Mimi." | "top names" = nama terfavorit; "teratas" kaku. | "Tiga nama favorit adalah Bella, Lulu, dan Mimi." |
| H12 | L | adventurer / hari-sekolah | `newTexts[1].questions[1].qId` vs `lines[2].id` | "Anak-anak menanam kacang dan ___." (baris: "tomat dan buncis") | Istilah beans tidak konsisten (buncis vs kacang). | "Anak-anak menanam buncis dan ___." |
| H13 | L | adventurer / hari-sekolah | `newTexts[0].questions[2].q` | "It was on the teacher's ___." | Teks tidak pernah menyebut Pak Budi guru (hanya "Mr. Budi's desk"); inferensi kecil. | "It was on Mr. Budi's ___." / ID "…ada di ___ Pak Budi." |
| H14 | L | adventurer / hari-hujan | `newTexts[1].questions[3]` (gap) | "There were ___ frogs." → word "Ten" | Kata yang diketuk berkapital (awal kalimat di teks), jadi jawaban terbaca "There were Ten frogs." | Ubah rumpang jadi "___ little frogs were singing." atau tampilkan jawaban huruf kecil. |
| H15 | L | adventurer / perjalanan-kereta | `newTexts[1].questions[3]` | q: "The guard asked his question with a ___." / qId "Penjaga bertanya sambil ___." (baris: "petugas") | Inggris bertele-tele; ID ganti istilah petugas→penjaga. | "The guard asked with a ___." / "Petugas bertanya sambil ___." |
| H16 | L | adventurer / beberapa topik | `qId` gap: hari-hujan `newTexts[0].questions[1]`, belanja-di-pasar `newTexts[1].questions[1]`, perjalanan-kereta `newTexts[0].questions[4]`, hari-kemah `newTexts[1].questions[3]` | "Adi tidak membawa ___ miliknya." / "Ayah tidak bisa menemukan ___ miliknya." / "…membaca ___ miliknya." / "Nia menggambarnya di ___ miliknya." | "___ miliknya" kaku/terjemahan harfiah his/her. | "Adi tidak membawa ___." / "Ayah tidak bisa menemukan ___-nya." / "Riko akan membaca ___-nya." / "Nia menggambarnya di ___-nya." |
| H17 | L | adventurer / taman-bermain | `newTexts[1].lines[6].id` | "…dan menggesek kaki Nia." | Kurang tepat ("rubbed against"); soal Q3 sudah memakai "menggesekkan badan". | "…dan menggesekkan badannya ke kaki Nia." |
| H18 | L | achiever / hari-piknik | `texts[0].questions[3].q` | "What does 'it' mean in 'We shared it with the other teams'?" | Untuk rujukan kata ganti lebih tepat "refer to" (dipakai di semua soal lain). | "What does 'it' refer to in '…'?" / qId "Apa yang dimaksud 'it'…" |
| H19 | L | achiever / akhir-pekan-di-rumah | `texts[1].questions[1].options[0]` | "Tidy her room and feed the cat" | Jenis kelamin Kiki tidak disebut di teks. | "Tidy the room and feed the cat" |
| H20 | L | achiever / menggalang-dana-sekolah | `newTexts[0].questions[0].qId` & `newTexts[1].questions[3].qId` | "Semua buku barunya tentang sains." (baris: "IPA") / "Lomba lari selalu…" (baris: "lari santai") | Istilah tidak konsisten dengan terjemahan teksnya. | "…tentang IPA." / "Lari santai selalu…" |
| H21 | L | achiever / mencari-sahabat-pena | `texts[1].lines[2].id` & `lines[6].id` | "Aku dua belas tahun…" / "Dia cokelat dan sangat jinak." | Kurang natural. | "Umurku dua belas tahun…" / "Warnanya cokelat dan dia sangat jinak." |

Catatan (bukan temuan): soal `ref` yang jawabannya potongan frasa ("pals" untuk *pen pals*, "club" untuk *joining a club*, "weekend" untuk *screen-free weekend*, "homework" untuk *giving homework online*) masih bisa diterima karena mekaniknya tap 1 kata; kalau ingin lebih presisi, pilih kalimat rujukan yang anteseden-nya 1 kata benda.

### I. Reading Trailblazer

**Cakupan**: 11 topik × 4 teks (`texts[0..1]` + `newTexts[0..1]`) = 44 teks, ±330 baris EN/ID + 220 soal (±64 soal `kind:'missing'`, ±22 soal sikap/tujuan/ide pokok) — dibaca utuh, tidak disampling. Total ±550 item dicek.

**Temuan**: H = 0 · M = 13 · L = 16

Kualitas file ini secara umum bagus: grammar B1 rapi, konektor however/although/instead/while dipakai dengan benar, setiap soal punya tepat 1 jawaban yang didukung teks, dan pengecoh `missing` hampir semuanya jelas bertentangan dengan konteks. Tidak ada kunci jawaban yang salah.

**Pola berulang**
1. **Terjemahan Indonesia terlalu harfiah/terpotong** — mis. "tidak perlu pernah main di tim", "bergantung pada lebih dari penembak terbaiknya", "mengambil terlalu banyak", "di depan semua" (kurang "orang"), "jadi tetap tahun depan".
2. **Nuansa modal/kondisional hilang di ID** — "would be a serious mistake" → "adalah kesalahan besar"; "you should be proud" → "kamu harus bangga" (kewajiban, bukan "patut").
3. **Beberapa pengecoh `missing` hanya gugur lewat detail kecil** (jadwal/kata "However") sehingga masih terasa bisa nyambung — melemahkan aturan "3 pengecoh WAJIB jelas tidak nyambung".

| # | Sev | File / topik (id) | Lokasi field | Teks sekarang | Masalah | Saran perbaikan |
|---|---|---|---|---|---|---|
| I1 | M | memilih-klub-sekolah | `newTexts[1].lines[5].en` | By the third week, I won my first game against an older student. | "By + waktu" menuntut past perfect; pengecoh di soal yang sama (`questions[3].options[1]`) malah memakai "By the third week, I had stopped…" → tidak konsisten di teks model B1. | "By the third week, I had won my first game against an older student." (ubah juga `questions[3].options[0]`) atau "In the third week, I won…" |
| I2 | M | liburan-yang-berubah | `texts[0].lines[1].en` (+ `questions[0].options[0]`) | However, two days before we left, Dad's flight was cancelled. | Liburan sekeluarga, tapi yang batal hanya "penerbangan Ayah" — tidak logis kenapa seluruh keluarga batal; juga "before we left" padahal tidak jadi berangkat. | "However, two days before we were due to leave, our flight was cancelled." / opsi: "Their flight was cancelled." |
| I3 | M | kerja-sukarela | `texts[0].questions[3]` | Why is the manager's comment special? → "Bruno rarely trusts new people." | Jawaban hanya mengulang isi komentar, bukan alasan istimewanya (yaitu Bruno ternyata percaya pada penulis). Soal inferensi jadi cocok-teks. | Opsi benar: "It shows Bruno trusted the writer quickly." (pengecoh tetap) |
| I4 | M | proyek-lingkungan | `texts[0].questions[3].qId` | Jumlahnya turun sekitar berapa botol sehari? | Ambigu: "turun berapa" bisa dibaca "turun jadi berapa" → pengecoh "About 40" ikut terasa benar dalam terjemahan. | "Jumlahnya berkurang sekitar berapa botol sehari (selisihnya)?" |
| I5 | M | proyek-lingkungan | `texts[1].lines[5].en` / `.id` | Parents are welcome to help, although they must register first. / Orang tua boleh membantu, walaupun harus mendaftar dulu. | "although" untuk syarat terasa janggal (penutur asli: "but"/"as long as"); ID "walaupun" juga tidak natural untuk syarat. | EN: "Parents are welcome to help, but they must register first." ID: "Orang tua boleh membantu, asalkan mendaftar dulu." |
| I6 | M | seleksi-tim-basket | `texts[1].lines[4].id` | Kamu tidak perlu pernah main di tim sebelumnya. | Terjemahan harfiah, kaku. | "Kamu tidak harus pernah bermain dalam tim sebelumnya." / "Belum pernah main di tim? Tidak apa-apa." |
| I7 | M | seleksi-tim-basket | `newTexts[1].lines[1].id` | Namun, tim yang bagus bergantung pada lebih dari penembak terbaiknya. | Harfiah, sulit dipahami. | "Namun, tim yang bagus tidak hanya mengandalkan penembak terbaiknya." |
| I8 | M | kerja-sukarela | `newTexts[1].lines[4].id` | Namun, para ahli mengingatkan remaja jangan mengambil terlalu banyak. | "take on too much" = memikul terlalu banyak kegiatan; "mengambil terlalu banyak" tidak jelas mengambil apa. | "Namun, para ahli mengingatkan agar remaja tidak mengambil terlalu banyak kegiatan." |
| I9 | M | pameran-seni-sekolah | `newTexts[1].lines[6].id` | Menghapusnya adalah kesalahan besar. | EN "would be" (pengandaian) diterjemahkan sebagai fakta. | "Menghapusnya akan menjadi kesalahan besar." |
| I10 | M | pameran-seni-sekolah | `newTexts[0].lines[6].id` | Menang atau tidak, kamu harus benar-benar bangga. Rina | "should be proud" = patut/pantas bangga, bukan kewajiban "harus". | "Menang atau tidak, kamu patut bangga sekali. Rina" |
| I11 | M | pesta-kejutan-sahabat | `newTexts[1].lines[2].en` (+ `questions[1].options[0]`) | The more people know, the more likely someone will slip. | "slip" sendirian janggal untuk "keceplosan"; idiomnya "slip up" / "let it slip". | "The more people know, the more likely it is that someone will let it slip." |
| I12 | M | liburan-yang-berubah | `newTexts[1].questions[3].options[3]` (`kind:'missing'`, hide 5) | However, the village hall was locked all night. | Pengecoh masih bisa nyambung (kontras dengan "move everyone to the village hall", dan baris 6–7 tidak membantahnya) → kurang "jelas tidak nyambung". | Ganti, mis. "There, the group set up their tents on the beach." atau "Then everyone went to sleep in the wet tents again." |
| I13 | M | memilih-klub-sekolah | `newTexts[0].questions[3].options[1..2]` (`kind:'missing'`, hide 5) | Saturdays, 7–9 a.m. Bring your camera! / Fridays, 3–5 p.m. Bring an apron! | Bagian jadwal sama-sama masuk akal untuk Drama Club; pengecoh hanya gugur karena ekornya (camera/apron), jadi kurang jelas tidak nyambung. | Pakai pengecoh yang isinya jelas salah, mis. "Cameras are not allowed in the old town." / "Please bring your own vegetables." |
| I14 | L | wawancara-radio-sekolah | `texts[0].lines[1].id` | Nadia: Terima kasih sudah mengundang! Aku masih agak kaget. | Objek hilang, terasa terpotong. | "Terima kasih sudah mengundangku!" |
| I15 | L | wawancara-radio-sekolah | `newTexts[0].lines[3].id` | Bu Siti: Mi ayam, walaupun nasi goreng hampir menyamai. | "a close second" kurang tersampaikan; agak kaku. | "Mi ayam, walaupun nasi goreng menyusul tipis di urutan kedua." |
| I16 | L | wawancara-radio-sekolah | `newTexts[1].lines[6].id` | Menurut saya, setiap sekolah sebaiknya punya satu. | "punya satu" harfiah dari "have one". | "Menurut saya, setiap sekolah sebaiknya punya stasiun radio." |
| I17 | L | liburan-yang-berubah | `newTexts[1].lines[4].id` / `lines[6].id` | …memindahkan semua ke balai desa. / …di depan semua. | Kata "orang/anggota" hilang. | "…memindahkan semua anggota ke balai desa." / "…di depan semua orang." |
| I18 | L | proyek-lingkungan | `texts[0].lines[7].id` | Kami berharap tantangan ini jadi tetap tahun depan. | "jadi tetap" janggal untuk "permanent". | "Kami berharap tantangan ini jadi kegiatan rutin mulai tahun depan." |
| I19 | L | proyek-lingkungan | `newTexts[0].lines[5].id` | Namun, taman itu kotor lagi setelah dua hari. | "only" tidak diterjemahkan (penekanan hilang). | "Namun, taman itu kotor lagi hanya dua hari kemudian." |
| I20 | L | kompetisi-robot | `newTexts[0].lines[7].id` | Selamat berakhir pekan! Pelatih Arya | Bentuk tidak baku. | "Selamat menikmati akhir pekan! Pelatih Arya" |
| I21 | L | seleksi-tim-basket | `texts[0].lines[6].en` / `.id` | At the end, Dina's name was on the list. / Di akhir, nama Dina ada di daftar. | Makna "pada akhirnya" = "In the end"; "At the end" butuh "of …". | "In the end, Dina's name was on the list." / "Akhirnya, nama Dina ada di daftar." |
| I22 | L | seleksi-tim-basket | `newTexts[1].lines[6].id` | Singkatnya, basket mengajarkan pelajaran untuk hidup. | Harfiah. | "Singkatnya, basket memberi pelajaran hidup." |
| I23 | L | pameran-seni-sekolah | `newTexts[0].lines[4].id` | Tetesan malam yang kecil-kecil itu tampak hampir nyata! | "malam" (lilin batik) benar tapi mudah dibaca "night" oleh anak. | "Tetesan lilin batik yang kecil-kecil itu tampak hampir nyata!" |
| I24 | L | kelas-memasak-mingguan | `texts[0].lines[6].id` | …aku belajar lebih banyak dari dua minggu pertama. | "dari" ambigu (sumber vs perbandingan). | "…aku belajar lebih banyak dibanding dua minggu pertama." |
| I25 | L | kelas-memasak-mingguan | `texts[1].lines[4].id` | Segera beri tahu chef kalau kamu teriris atau terkena panas. | "burn yourself" = terkena luka bakar, bukan sekadar "kena panas". | "…kalau kamu teriris atau terluka bakar." |
| I26 | L | kelas-memasak-mingguan | `newTexts[0].lines[4].en` | Students with allergies to peanuts should tell me before Monday. | Kurang natural. | "Students with peanut allergies should tell me before Monday." |
| I27 | L | pesta-kejutan-sahabat | `texts[1].lines[5].id` | Semua: datang sebelum jam 16.30… | "by 4:30" = paling lambat 16.30, bukan "sebelum". | "Semua: datang paling lambat jam 16.30…" |
| I28 | L | menabung-untuk-sepeda | `texts[0].lines[7].id` / `newTexts[0].lines[6].id` | …karena dia bekerja keras untuknya. / …Sayang, Arga | "untuknya" harfiah; "Sayang, Arga" untuk "Love," janggal (topik lain memakai "Salam sayang"). | "…karena dia bekerja keras untuk mendapatkannya." / "Salam sayang, Arga" |
| I29 | L | memilih-klub-sekolah | `texts[0].questions[0].qId` / `newTexts[0].lines[5].en` | Klub mana yang akhirnya dipilih Laras? / Sundays, 10 a.m.–12 p.m. | "prefer" ≠ "dipilih" (Laras belum memastikan); "12 p.m." sering membingungkan. | "Klub mana yang akhirnya lebih disukai Laras?" / "Sundays, 10 a.m. to 12 noon." |
