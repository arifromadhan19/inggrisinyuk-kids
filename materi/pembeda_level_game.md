# Pembeda Level — Game Hub

Pasangan [pembeda_level.md](pembeda_level.md): dokumen itu untuk **materi** (Vocab/Listening/Speaking/Grammar/Reading per level anak), dokumen ini untuk **game** di Game Hub (`/game`). "Level" di sini = **6 markas** di Map tiap game (Pemanasan → Mudah → Sedang → Sulit → Jago → Legendaris), BUKAN `LevelKey` anak — markas game tidak mengikuti level anak & menang di game tidak membuka level materi (`gameXp`, bukan `bossCleared`).

Preseden: Word Quest (`games/wordmatch-data.ts`) sudah dirombak dengan prinsip **"tiap markas menambah SATU jenis tantangan baru"** (kata mirip bentuk → satu kategori → suara → petunjuk definisi), bukan cuma kata makin panjang. Game lain sebaiknya ikut prinsip yang sama.

Penanda: **[F]** = fakta (dari kode/sumber), **[U]** = usulan (belum diuji ke anak).

---

# Word Quest (Raja Kata)

Status: **sudah diimplementasi** (2026-09-25). Kode: `app/src/games/wordmatch.ts` (mesin & Map), `app/src/games/wordmatch-data.ts` (tabel tier + bank kata — satu-satunya tempat mengubah pembeda/kata). Di roster namanya "Word Quest" (`key: 'kata'`, `/game/raja-kata`).

## Ringkasan (High-Level)

**Sebelum**: keenam markas punya tugas identik (tap kata Inggris ↔ tap gambar). Pembedanya cuma **jumlah pasangan** (2 → 7) dan **kata makin panjang/langka** (Ball → Rollercoaster, Accordion). Makin tinggi markas = makin *banyak*, bukan makin *menantang*.

**Sekarang**: tiap markas menambah **SATU jenis tantangan baru**, papan maksimal 5 pasang, 10 papan per markas, bank kata naik wordlist Cambridge (Starters → Movers → Flyers).

## Kondisi Sebelum Dirombak [F]

- 1 markas = 1 papan saja; pembeda = `DIFFICULTY_META.pairCount` (2/3/4/5/6/7) + `BANK_BY_DIFFICULTY`.
- Layout 2 baris (kata di atas, gambar di bawah); tanpa audio, tanpa bantuan.
- Legendaris 7 pasang — kalau dikali 10 papan = ±70 pencocokan dari bank ±10 kata (lelah & banyak ulangan).
- Bank melanggar "Kepala SAJA": Fish 🐟, Bee 🐝, Butterfly 🦋, Penguin 🐧, Dolphin 🐬, Kangaroo 🦘, Elephant 🐘, Crocodile 🐊, Scorpion 🦂, Hedgehog 🦔, Peacock 🦚, Flamingo 🦩, Chameleon 🦎, Dinosaur 🦖, Octopus 🐙, Astronaut 🧑‍🚀, Firefighter 🧑‍🚒; plus 🎃 Pumpkin (Halloween). Tidak ketahuan build krn bank tidak dicek skrip mana pun.

## Tangga Tier (Terimplementasi) [F]

| Markas | Kartu kiri ↔ kanan | Papan dibentuk dari | Pasang | 💡 Petunjuk (1x/papan) | Tantangan baru |
|---|---|---|---|---|---|
| Pemanasan (Desa Kata) | kata ↔ gambar, **tap kata dibacakan 🔊** | acak, kata sangat beda | 3 | — | kenal kata dibantu suara |
| Mudah (Gerbang Kata) | kata ↔ gambar | acak | 4 | — | baca kata sendiri |
| Sedang (Istana Kata) | kata ↔ gambar | **2 grup kata mirip bentuk** × 2 (Mouse/House, Moon/Spoon, Cat/Car/Cap) | 4 | gambar pasangan 1 kata berdenyut | baca teliti huruf per huruf |
| Sulit (Balairung Kata) | kata ↔ gambar | **1 kategori** per papan (Hewan/Buah/Kendaraan/Pakaian/Alat Musik), berganti tiap papan | 5 | gambar pasangan 1 kata berdenyut | bedakan kata sekelompok |
| Jago (Menara Kata) | **🔊 suara bernomor ↔ gambar** (tanpa tulisan) | acak | 5 | tulisan kata muncul di kartu 🔊 | kenali kata dari bunyi |
| Legendaris (Ruang Harta Kata) | **petunjuk definisi ↔ kata**, tanpa gambar ("A place where you can borrow books." ↔ Library) | acak | 5 | arti Indonesia tiap petunjuk | kenali kata dari makna (Flyers R&W Part 1) |

Berlaku di semua markas:
- **10 papan per markas** (`BOARD_COUNT`), bullet progress 1–10 di atas papan; papan tuntas → "🔁 Coba Lagi" (papan sama) / "Lanjut ➡️" (papan berikutnya); papan ke-10 → balik ke Map.
- Kata diambil dari antrian yang diacak: semua kata/grup keluar dulu sebelum ada yang berulang, tidak ada kata kembar dalam 1 papan.
- Layout **vertikal**: kolom kiri (kata/🔊/petunjuk) ↔ kolom kanan (gambar/kata), tinggi kartu seragam supaya baris sejajar, garis penghubung dari tepi ke tepi.
- 1 baris instruksi di atas papan berubah per tugas (`TIER_CONFIG.task`, Sulit menyebut nama kategorinya).

## Bukti Riset per Sumbu

| Sumbu | Temuan | Dipakai di |
|---|---|---|
| **Jenis tugas** | Pengetahuan kata berjenjang: *recognition* lebih mudah dari *recall*; bentuk ↔ makna (Sevigny dkk. 2024; Pignot-Shahov). Cambridge naik dari gambar + kalimat Benar/Salah (Starters R&W Part 1) ke **cocokkan definisi** tanpa gambar (Flyers R&W Part 1). | Legendaris (petunjuk ↔ kata) |
| **Kualitas pengecoh** | Game menaikkan kesulitan dgn pengecoh **mirip bentuk/salah eja** (sightwords.com); sistem adaptif memilih pengecoh makin sulit (paten USPTO 10147336). Anak kesulitan membedakan kata mirip ortografis; latihan kontras kata mirip justru menajamkan representasi kata (Frontiers 2021). | Sedang (grup kata mirip) |
| **Interferensi semantik** | Kata satu kategori yang dipelajari bersamaan saling mengganggu → lebih sulit (Tinkham 1997; meta-analisis semantic clustering 2026). | Sulit (1 kategori/papan) — sengaja di markas atas, bukan awal |
| **Modalitas** | Duolingo "tap the pairs" punya varian **audio ↔ kata**, naik bertahap dari dukungan bahasa ibu ke full target. | Jago (suara ↔ gambar) |
| **Fading bantuan** | Bantuan dikurangi bertahap seiring kemampuan (Insendi; Wellesley game scaffolding). | Pemanasan dibacakan → Mudah tanpa suara → 💡 per markas atas |
| **Ukuran papan** | Menambah pasangan = variasi paling dasar (sightwords.com), tapi bukan satu-satunya sumbu. | Dibatasi 3 → 5 pasang; tantangan dari tugas, bukan jumlah |

## Implementasi [F]

- `TIER_CONFIG` (`wordmatch-data.ts`): per markas `pairCount`, `mode` (`picture`/`audio`/`clue`), `picker` (`random`/`lookalike`/`category`), `speakOnTap`, `hint`, `task`.
- Bank: `RANDOM_BANK` (Pemanasan/Mudah/Jago/Legendaris), `LOOKALIKE_GROUPS` (12 grup, Sedang), `CATEGORY_GROUPS` (5 kategori × 8 kata, Sulit). Legendaris: 13 kata ber-`clue` + `clueId`.
- Build (`verify-vocab-content.mjs`) mengecek bank Word Quest: denylist emoji makhluk hidup, tiap kata Legendaris wajib `clue`+`clueId`, `clue` tidak boleh memuat katanya sendiri (bocor jawaban).
- CSS `.wm-*` (`public/styles.css`): `.wm-board.is-clue` (kolom 3:2, kartu lebih tinggi; `.show-id` saat 💡), `.wm-audio`, `.wm-card.is-hint` (denyut `ctaPulse`).
- Keluar dari markas (tombol balik / "Keluar" di popup) → balik ke Map Kerajaan Kata (`setGameRoundActive(true, renderMap)`).

## Yang SENGAJA Tidak Dibedakan

- **Tanpa timer, nyawa, skor kecepatan** di markas mana pun.
- **Salah = merah + getar + tetot**, kartu tetap bisa ditap lagi (non-punitive).
- **Unlock markas "cukup pernah dicoba"**, progres markas tidak disimpan (hidup di sesi main saja), konsisten game lain.
- **Tidak ditautkan ke `LevelKey` anak.**

## Gotcha

- Menambah grup Sedang: kata harus beda 1–2 huruf **dan** emoji-nya jelas beda (jangan Hat/Cap — dua-duanya topi). Hindari hewan badan utuh (Goat 🐐, Bee 🐝 dilewati krn itu).
- Menambah kategori Sulit: minimal 5 kata, emoji di dalam kategori tidak boleh mirip satu sama lain (Mango vs Orange masih aman).
- Menambah kata Legendaris: petunjuk sederhana ala Flyers, jangan sebut katanya, dan jangan buat 2 petunjuk yang sama-sama cocok ke 1 kata (Telescope "stars" vs Microscope "very small things").
- Pemanasan & Jago memakai `speak()` (TTS Inggris) — kata Jago jangan homofon (see/sea), dari suara saja keduanya benar.
- Tap kata yang sudah terpilih = batal pilih; 💡 di Sedang/Sulit memilihkan 1 kata sekaligus menandai gambarnya.

## Pertanyaan Terbuka

1. Legendaris di HP perlu scroll sedikit (5 kartu petunjuk tinggi) — biarkan, atau turunkan jadi 4 pasang?
2. Bank Jago (14) & Legendaris (13) masih kecil untuk 10 papan × 5 pasang — perlu ditambah supaya pengulangan kata lebih jarang?

## Sumber

- Kode: `app/src/games/wordmatch.ts`, `app/src/games/wordmatch-data.ts`, `app/scripts/verify-vocab-content.mjs`
- [Sevigny dkk. (2024), High-Frequency Vocabulary: Moving From Recognition to Recall Level on Quizlet](https://journals.sagepub.com/doi/10.1177/21582440241242604)
- [Pignot-Shahov, Measuring L2 Receptive and Productive Vocabulary](https://www.reading.ac.uk/elal/-/media/project/uor-main/schools-departments/elal/lswp/lswp-4/elal_lswp_vol_4_pignot_shahov.pdf)
- [Cambridge A2 Flyers Reading & Writing Part 1](https://www.cambridgeenglish.org/Images/584855--online-teaching-a2-flyers-reading-and-writing-part-1.pdf)
- [Sight Words Matching (sightwords.com)](https://sightwords.com/sight-words/matching/)
- [Systems and methods for generating distractors in language learning (USPTO)](https://image-ppubs.uspto.gov/dirsearch-public/print/downloadPdf/10147336)
- [Orthographic Similarity — overview (ScienceDirect)](https://www.sciencedirect.com/topics/psychology/orthographic-similarity)
- [Contrasting Similar Words Facilitates L2 Vocabulary Learning in Children (Frontiers 2021)](https://www.frontiersin.org/journals/psychology/articles/10.3389/fpsyg.2021.688160/full)
- [Tinkham (1997), The effects of semantic and thematic clustering on L2 vocabulary learning](https://journals.sagepub.com/doi/10.1191/026765897672376469)
- [The effectiveness of semantic clustering on vocabulary learning: A multilevel meta-analysis](https://www.sciencedirect.com/science/article/pii/S0346251X26001727)
- [Duolingo Wiki — Exercise](https://duolingo.fandom.com/wiki/Exercise) · [DuoRadio listening practice](https://blog.duolingo.com/duoradio-listening-practice)
- [Scaffolding, Modelling and Fading in Learning Design (Insendi)](https://insights.insendi.com/read/scaffolding-modelling-and-fading-in-learning-design)
- [Scaffolding in educational video games (Wellesley)](https://cs.wellesley.edu/~aloparev/papers/fie2015.pdf)

---

# Taman Balon (Balloon Hunt)

Status: **sudah diimplementasi** (2026-09-29) — lihat "Implementasi" di bawah; bagian "Kondisi Sekarang" & "Temuan Masalah" = kondisi SEBELUM dirombak. Kode: `app/src/games/balloonpop.ts` (mesin & Map), `app/src/games/balloonpop-data.ts` (tabel tier + bank, satu-satunya tempat mengubah pembeda/kata). Di roster namanya "Balloon Hunt" (`key: 'balon'`); "Taman Balon" = nama tempat markas ke-2, dipakai user untuk menyebut game ini secara keseluruhan.

## Ringkasan (High-Level)

**Verdict: pembeda markas sekarang BELUM sesuai tantangannya.** Keenam markas punya bentuk soal yang identik (baca kata Indonesia → tap 1 dari 4 balon kata Inggris). Yang berubah cuma 2 hal, dan dua-duanya salah sasaran:

1. **Kecepatan balon** (16–20 dtk → 5–6,5 dtk) — yang naik adalah tantangan **motorik** (mengejar target bergerak), bukan bahasa.
2. **Kata makin panjang/jarang** — dipilih dari panjang huruf, bukan dari wordlist. Akibatnya markas "lebih sulit" justru **lebih mudah ditebak** karena penuh kognat (Satelit→Satellite, Helikopter→Helicopter, Flamingo→Flamingo), dan 90% kata Legendaris di luar wordlist Cambridge YLE.

| Markas | Kecepatan (dtk/lintasan) | Rata² huruf | Kognat ID≈EN | Di wordlist YLE (S/M/F) | Bentuk soal |
|---|---|---|---|---|---|
| Pemanasan | 16–20 | 3,1 | 2/10 | 8/10 | ID teks → 4 balon EN |
| Mudah | 13–17 | 3,4 | **0/10** | 10/10 | sama |
| Sedang | 10–13 | 7,1 | 3/12 | 11/12 | sama |
| Sulit | 7,5–9,5 | 8,0 | **6/12** | 6/12 | sama |
| Jago | 6–8 | 8,3 | 1/10 | 3/10 (2 di antaranya Starters: Kite, Skateboard) | sama |
| Legendaris | 5–6,5 | 8,3 | **6/10** | **1/10** | sama |

## Kondisi Sekarang (Baseline di Kode) [F]

- **Satu bentuk soal di semua markas**: `runBalloonPopRound()` — prompt `🎈 Letupkan balon: "<id>"` (teks Indonesia, **tanpa audio**), 4 balon berisi kata Inggris (`OPTION_COUNT = 4`), 10 kata per markas (`WORD_COUNT`).
- **Pembeda cuma `DIFFICULTY_META` (kecepatan+goyang) + `BANK_BY_DIFFICULTY` (bank kata)**. Jumlah balon, jumlah kata, jenis prompt, dan bantuan sama di semua markas.
- **Pengecoh acak** dari bank yang sama (`buildOptions`) — tidak diatur mirip bentuk/mirip arti, jadi kesulitan pengecoh tidak naik.
- **Tidak ada audio sama sekali** (tidak import `speak`), padahal "Cara Main" menulis "Baca/**dengar** kata yang diminta". Anak yang belum lancar membaca (Little Stars, sebagian Starter) tidak bisa main di markas mana pun.
- **Tidak ada bantuan & jawaban tidak pernah ditunjukkan.** Salah tap cuma goyang + tetot. Anak bisa menyelesaikan semua markas dengan mengetuk balon satu per satu (maks 3 salah per kata) tanpa paham.
- **Teks balon kecil**: `clamp(11px, 2.6vw, 13px)` di balon lebar `clamp(58px, 18vw, 100px)`. Di Legendaris, kata 10–11 huruf (Skyscraper, Firefighter) tampil paling kecil di balon paling cepat — kesulitannya jadi soal *keterbacaan*, bukan bahasa. (Perlu dicek live; belum di-screenshot.)
- **Perkiraan kecepatan layar HP** (papan ≈ 490px, lintasan 140% tinggi papan ≈ 685px): Pemanasan ±34–43 px/dtk, Legendaris ±105–137 px/dtk (desktop sampai ±174 px/dtk). Balon terlihat di papan ±0,87 × durasi, jadi Legendaris hanya ±4,4–5,7 dtk per lintasan untuk membaca 4 kata panjang.
- **Kata aneh posisinya**: Kite (Starters, 4 huruf) ada di Jago; "Coral Reef" 2 kata; Pig & Hen tidak ada di wordlist YLE padahal di Pemanasan.

## Temuan Masalah (Urut Prioritas)

1. **Kebocoran kognat** — melanggar CLAUDE.md "Soal Tidak Boleh Bisa Ditebak Tanpa Paham" pola #2 (teks prompt ≈ teks jawaban). Sulit 6/12 dan Legendaris 6/10 bisa dijawab cuma dengan mencocokkan ejaan. Markas tersulit adalah markas yang paling bisa ditebak.
2. **Satu bentuk soal diulang 6x** — anak tidak pernah dapat jenis tantangan baru. Bertentangan dengan prinsip Word Quest dan aturan Listening "SETIAP tier WAJIB task shape beda".
3. **Kecepatan jadi sumbu utama** — di app tanpa timer, kecepatan tinggi berperan seperti timer terselubung (tekanan waktu untuk membaca + motorik). Kesulitan naik di sisi yang tidak diajarkan.
4. **Tidak playable untuk non-pembaca** — tidak ada audio, padahal Game Hub terbuka untuk semua level (termasuk Little Stars 3–5 th).
5. **Kata dipilih dari panjang/kelangkaan, bukan wordlist** — Legendaris 9/10 di luar YLE (Carousel, Accordion, Labyrinth, Windmill…), kosakata yang tidak dipakai di materi mana pun di app.
6. **Tanpa bantuan & tebak-tap tanpa batas** — tantangan runtuh jadi "ketuk sampai meletup".

## Bukti Riset per Sumbu

| Sumbu | Temuan | Konsekuensi untuk Taman Balon |
|---|---|---|
| **Kecepatan target bergerak** | Akurasi mengintersep target bergerak naik linear dengan usia; anak kecil lebih lambat & kurang mampu memprediksi lintasan (PubMed 23611011). Anak 3–6 th sulit mengenai target akurat di layar sentuh (IJHCS 2014). Fitts' law memodelkan sentuhan anak 5–10 th (R² 0,93) — target kecil + jauh = lambat & meleset. | Kecepatan & ukuran balon menguji **usia/motorik**, bukan Inggris. Boleh naik sedikit sebagai bumbu, jangan jadi sumbu utama; ukuran balon & teks jangan mengecil. |
| **Kognat/kata serapan** | Kognat & kata serapan menggelembungkan skor tes kosakata; efeknya lebih besar di bahasa yang banyak menyerap dari Inggris (Laufer & McLean 2016; *VST cognate inflation*, ScienceDirect). | Bahasa Indonesia banyak menyerap kata Inggris → kata kognat harus dikeluarkan dari soal ID→EN (atau dipakai sengaja di markas awal sebagai "jembatan", bukan di markas sulit). |
| **Penentu sulitnya kata** | Frekuensi kata = prediktor kesulitan L2 terkuat; panjang kata & jumlah suku kata berpengaruh kecil setelah frekuensi dikontrol (Hashimoto 2019; *word frequency effect*, ERIC ED564187). Game literasi adaptif mengatur kesulitan lewat frekuensi & fitur bahasa, tidak hanya panjang (Benton 2021, BJET). | Naik tingkat = naik wordlist **Starters → Movers → Flyers**, bukan "makin panjang/langka". |
| **Pengecoh** | Pengecoh yang mirip bentuk (ortografis) & mirip arti (semantis) menaikkan kesulitan & daya beda soal (Ludewig dkk. 2023; *Language Testing in Asia* 2013). | Kesulitan bisa dinaikkan lewat **pengecoh**, tanpa mengganti kata target jadi kata langka. |
| **Kekuatan pengetahuan kata** | Hierarki: *meaning recognition < form recognition < meaning recall < form recall* (Laufer & Goldstein 2004). | Tangga yang wajar: gambar/arti → kenali bentuk tulis → kenali dari suara/konteks. Balon cocok untuk tahap *recognition*; *recall* (menulis) tetap urusan Vocab. |
| **Flow** | Tantangan naik lebih cepat dari skill → cemas; lebih lambat → bosan (Gamedeveloper "Flow Channel"). | Naikkan SATU hal per markas supaya lompatan tidak terasa tiba-tiba. |
| **Kompetitor balon** | *Kids Balloon Pop Language Game*: kesulitan diatur dari "balon besar & lambat" ke "kecil & cepat" — motorik murni, untuk balita. *Balloon Pop Education*: balon **dibacakan**. Wordwall Whack-a-mole: opsi "Level Speed" naik per level + poin bonus kecepatan. | Kompetitor memakai kecepatan karena targetnya balita/permainan refleks. Kita **ambil** pola audio-dibacakan; **tidak ambil** kecepatan sebagai sumbu utama & bonus kecepatan (tekanan waktu, CLAUDE.md filter kid-friendly). |

## Rujukan Institusi / Wordlist [F]

Wordlist resmi Cambridge YLE 2018 (Pre A1 Starters, A1 Movers, A2 Flyers) — dicek otomatis per kata terhadap daftar A–Z gabungan bertanda S/M/F:

- **Pemanasan**: S = Ball, Hat, Box, Bed, Cow, Bus, Pen · M = Cup · — = Pig, Hen
- **Mudah**: S = Cat, Dog, Sun, Tree, Fish, Egg, Car, Bee · M = Moon, Star
- **Sedang**: S = Elephant, Banana, Guitar · M = Rabbit, Rainbow, Penguin, Dolphin, Kangaroo · F = Umbrella, Butterfly, Castle · — = Pumpkin
- **Sulit**: S = Crocodile, Helicopter · F = Dinosaur, Octopus, Astronaut, Rocket · — = Telescope, Volcano, Scorpion, Hedgehog, Peacock, Flamingo
- **Jago**: S = Skateboard, Kite · F = Backpack · — = Firefighter, Crescent, Coral Reef, Lightning, Compass, Chameleon, Chimney
- **Legendaris**: F = Skyscraper · — = Comet, Satellite, Carousel, Accordion, Trumpet, Microscope, Firework, Windmill, Labyrinth

Kognat (kemiripan ejaan ID↔EN ≥ 0,6, `difflib`): Bus, Pena · Gitar, Pinguin, Kanguru · Dinosaurus, Teleskop, Astronot, Helikopter, Roket, Flamingo · Kompas · Komet, Satelit, Akordeon, Terompet, Mikroskop, Labirin.

## Usulan Tier (Riset Awal) [U → sudah diimplementasi, lihat "Implementasi"]

Prinsip: **1 jenis tantangan baru per markas** (pola Word Quest), bentuk balon tetap (balon naik, tap untuk meletupkan), kata naik wordlist, kecepatan cuma naik tipis & ada batas bawah.

| Markas | Prompt | Isi balon | Pengecoh | Jumlah balon | Kecepatan [U] | Bantuan | Tantangan baru |
|---|---|---|---|---|---|---|---|
| Pemanasan | 🔊 kata Inggris dibacakan (+ tombol dengar lagi) | **Gambar** (tanpa tulisan) | acak, beda jauh | 3 | paling pelan (±18 dtk) | balon benar berkedip setelah 2x salah | dengar → tunjuk (bisa dimainkan non-pembaca) |
| Mudah | gambar + kata Indonesia (dibacakan 🔊) | kata Inggris | acak | 3 | ±16 dtk | 💡 coret 1 balon | baca kata Inggris |
| Sedang | kata Indonesia (dibacakan 🔊) | kata Inggris | **mirip bentuk** (Cat/Cap/Car) | 4 | ±14 dtk | 💡 coret 1 balon | baca teliti huruf per huruf |
| Sulit | kata Indonesia (teks saja) | kata Inggris | **satu kategori** (semua buah, semua kendaraan) | 4 | ±12 dtk | 💡 coret 1 balon | bedakan arti kata sekelompok |
| Jago | 🔊 kata Inggris saja (tanpa teks) | kata Inggris | mirip bunyi/bentuk | 4 | ±11 dtk | 💡 tampilkan arti Indonesia | cocokkan bunyi ↔ ejaan |
| Legendaris | **kalimat Inggris rumpang** ("I brush my teeth with a ___.") + arti via 💡 | kata Inggris | cocok bentuk, salah konteks | 5 | ±10 dtk (batas bawah) | 💡 tampilkan arti kalimat | pilih kata dari konteks kalimat (Flyers R&W) |

Detail usulan:
- **Bank kata**: Pemanasan/Mudah = Starters, Sedang/Sulit = Starters–Movers, Jago/Legendaris = Movers–Flyers. **Tanpa kognat** di markas Sedang ke atas; kognat hanya boleh di Pemanasan/Mudah kalau memang sengaja sebagai kata "jembatan".
- **Bank dipisah ke `games/balloonpop-data.ts`** dan dicek otomatis di `verify-vocab-content.mjs` (pola Word Quest): denylist emoji makhluk hidup, larangan kognat (skor kemiripan ID↔EN), kata tidak kembar antar markas.
- **Legendaris — alternatif**: "Letupkan SEMUA balon buah" (2–3 target dari 5 balon, kategori `materi/game.md` §4 #13 yang belum pernah dipakai). Pilih salah satu; kalimat rumpang lebih dekat ke format Cambridge, multi-target lebih "game".
- **Hindari tumpang tindih dengan Word Quest**: Word Quest sudah memakai *suara ↔ gambar* (Jago) & *petunjuk definisi* (Legendaris). Taman Balon di atas memakai *suara ↔ ejaan* & *kalimat rumpang*, jadi dua game tetap terasa beda.
- **Ukuran**: teks balon min ±15px, balon tidak mengecil di markas tinggi; kata >8 huruf boleh balon lebih lebar.
- **Kecepatan** tetap berbeda per markas supaya terasa "naik", tapi rentangnya dipersempit (±18 → ±10 dtk, bukan 20 → 5) karena anak level mana pun bisa mencapai Legendaris.

## Implementasi (2026-09-29) [F]

Pertanyaan terbuka dijawab dengan rekomendasi: Legendaris = **kalimat rumpang**, markas tetap sama untuk semua anak (tidak ditautkan ke `LevelKey`).

| Markas | Prompt | Isi balon | Pengecoh | Balon | Kecepatan | 💡 Bantuan |
|---|---|---|---|---|---|---|
| Pemanasan (Halaman Balon) | 🔊 "Pop the apple!" (otomatis + tombol Dengar) | **gambar** | acak, beda jauh | 3 | 17–19 dtk | balon benar berkedip setelah 2x salah |
| Mudah (Taman Balon) | gambar + kata Indonesia (dibacakan 🔊 Indonesia) | kata Inggris | acak | 3 | 15–17 dtk | coret 1 balon |
| Sedang (Pasar Balon) | kata Indonesia | kata Inggris | **mirip bentuk** (Boat/Goat/Coat) | 4 | 13–15 dtk | coret 1 balon |
| Sulit (Awan Balon) | kata Indonesia | kata Inggris | **1 kategori** (Buah/Kendaraan/Pakaian/Hewan) | 4 | 12–13,5 dtk | coret 1 balon |
| Jago (Puncak Balon) | 🔊 kata Inggris **saja**, tanpa tulisan | kata Inggris | **mirip bunyi** (Ship/Sheep/Shop/Chip, Fan/Van/Fun) | 4 | 11–12 dtk | arti Indonesia |
| Legendaris (Balon Emas) | **kalimat Inggris rumpang** ("I brush my teeth with a ___.") | kata Inggris | cocok bentuk, salah makna | 4 | 10–11 dtk | arti kalimat (tetap berlubang) |

- **10 kata per markas** (`WORD_COUNT`), diambil dari antrian acak (semua keluar dulu sebelum berulang).
- **Beda dari usulan**: Legendaris 4 balon (bukan 5) — 5 balon di papan HP 390px terlalu rapat untuk diketuk.
- **`DIFFICULTY_META`/`BANK_BY_DIFFICULTY` & bank lama dihapus.** Bank baru: `WARMUP_BANK` (12, bergambar), `EASY_BANK` (12, gambar + ID), `LOOKALIKE_GROUPS` (7 grup × 3), `CATEGORY_GROUPS` (4 kategori × 5–7), `SOUNDALIKE_GROUPS` (8 grup × 3–4, pasangan bunyi yang sering tertukar anak Indonesia: i/ee, f/v, l/r, th/t, e/a), `GAP_BANK` (12 kalimat).
- **Tampilan**: teks balon min ±15px (dulu 11–13px); kata ≥8 huruf dapat balon lebih lebar; balon gambar lebih besar; 💡 diubah langsung di DOM supaya balon yang sedang melayang tidak mulai lagi dari bawah.
- **Build** (`verify-vocab-content.mjs`): emoji wajib & denylist di bank bergambar; **tanpa kognat** di markas berprompt Indonesia (menangkap "Monyet" ↔ "Monkey" saat penulisan → diganti Chicken/Ayam); kata tidak kembar per markas; ukuran grup/kategori cukup; kalimat rumpang: `___` tepat 1x (EN & ID), 4 opsi beda, jawaban tidak tertulis di kalimat, tanpa "an ___", "a ___" tanpa opsi berawalan vokal.
- **Diverifikasi live** (Playwright, 390px & 1280px): keenam markas × 10 kata dituntaskan dalam 1 sesi sampai "Semua Balon Ditemukan!"; di tiap markas 1 balon salah (merah + teks semangat), 💡 dicoba (Pemanasan: balon benar berkedip setelah 2x salah; Mudah–Sulit: 1 balon dicoret; Jago/Legendaris: arti muncul); kata ke-10 = "Lanjut ➡️", markas terakhir = "Selesai ✅"; tanpa scroll horizontal; 0 pageerror. Garis rumpang sempat tampil dobel → diperbaiki.

## Yang SENGAJA Tidak Dibedakan

- **Tanpa timer, nyawa, skor kecepatan, bonus waktu** di markas mana pun (CLAUDE.md, `materi/game.md` §5) — termasuk tidak mengadopsi "Bonus Points for speed" Wordwall.
- **Salah tap tetap non-punitive**: balon tetap naik & bisa ditap lagi; merah + getar + tetot tetap (aturan Notifikasi Jawaban Salah).
- **Unlock markas tetap "cukup pernah dicoba"**, bukan harus menang.
- **Tidak ditautkan ke `LevelKey` anak** (konsisten dengan Word Quest & game lain). Pertanyaan terbuka di bawah.

## Gotcha

- Kata yang sama di Word Quest & Taman Balon boleh, tapi **jangan** pakai pasangan kata mirip-bentuk yang persis sama di markas Sedang kedua game, supaya tidak terasa diulang.
- Pengecoh "mirip bunyi" di Jago harus tetap beda arti & beda ejaan; jangan pakai homofon (see/sea) karena dari suara saja keduanya benar.
- Kalimat rumpang Legendaris: pastikan hanya 1 balon yang gramatikal **dan** bermakna (pelajaran Grammar `fill`: dulu semua opsi benar → soal tidak menguji apa pun).
- Kalau prompt dibacakan TTS Indonesia (Mudah/Sedang), pakai `speakLocalized(…, 'id-ID')`; pujian tetap audio Inggris (aturan praise).

## Keputusan yang Diambil (dulu Pertanyaan Terbuka)

1. Legendaris = **kalimat rumpang** (lebih dekat format Cambridge; "letupkan semua balon satu kategori" tidak dipakai).
2. Markas **tetap sama untuk semua anak**, tidak ditautkan ke level anak (konsisten 6 game lain).
3. Kecepatan & ukuran = nilai di tabel Implementasi; belum dicoba di HP fisik anak.

## Batasan Riset (Jujur)

- Tidak ditemukan studi yang khusus meneliti game balon kosakata untuk anak Indonesia; bukti diambil dari riset motorik anak, tes kosakata L2, dan app kompetitor.
- Studi kognat yang ditemukan kebanyakan Jepang/Polandia/Spanyol; untuk Indonesia disimpulkan dari prinsipnya (Indonesia banyak menyerap kata Inggris), belum diukur langsung.
- Angka kecepatan px/dtk = perkiraan dari CSS (tinggi papan 58vh di layar 844px), belum diukur di perangkat nyata; keterbacaan teks 11–13px di balon bergerak belum di-screenshot.
- Keanggotaan wordlist dicek dengan skrip terhadap PDF resmi Cambridge; bentuk jamak/varian (mis. "fireman" vs "firefighter") bisa terlewat.

## Sumber

- Kode: `app/src/games/balloonpop.ts`, `app/public/styles.css` (`.bp-*`), preseden `app/src/games/wordmatch-data.ts`
- Cambridge English, [Pre A1 Starters, A1 Movers and A2 Flyers Wordlists (from 2018)](https://www.cambridgeenglish.org/images/149681-yle-flyers-word-list.pdf)
- [Children's age-related speed–accuracy strategies in intercepting moving targets (PubMed)](https://pubmed.ncbi.nlm.nih.gov/23611011/)
- [Touch interaction for children aged 3 to 6 years (IJHCS)](https://www.sciencedirect.com/science/article/abs/pii/S1071581914001426)
- [Physical dimensions of children's touchscreen interactions — MTAGIC (IJHCS)](https://www.sciencedirect.com/science/article/abs/pii/S1071581918302441)
- [Laufer & McLean (2016), Loanwords and vocabulary size test scores](https://www.researchgate.net/publication/307091093_Laufer_B_McLean_S_2016_Loanwords_and_vocabulary_size_test_scores_A_case_of_different_estimates_for_different_L1_learners_Language_Assessment_Quarterly_133_202-217)
- [VST as a reliable placement tool despite cognate inflation effects](https://www.sciencedirect.com/science/article/abs/pii/S0889490618301248)
- [Hashimoto (2019), More Than Frequency? Predictors of Word Difficulty for L2 Learners](https://eric.ed.gov/?id=EJ1232965)
- [The word frequency effect on second language vocabulary learning (ERIC)](https://files.eric.ed.gov/fulltext/ED564187.pdf)
- [Ludewig dkk. (2023), Distractor Plausibility in Synonym-Based Vocabulary Tests](https://journals.sagepub.com/doi/10.1177/07342829231167892)
- [Relationship between types of distractor and difficulty of MC vocabulary tests](https://link.springer.com/article/10.1186/2229-0443-3-16)
- [Laufer & Goldstein (2004), Testing Vocabulary Knowledge: Size, Strength, and Computer Adaptiveness](https://onlinelibrary.wiley.com/doi/abs/10.1111/j.0023-8333.2004.00260.x)
- [Benton (2021), Designing for "challenge" in a large-scale adaptive literacy game (BJET)](https://bera-journals.onlinelibrary.wiley.com/doi/10.1111/bjet.13146)
- [Understanding the Flow Channel in Game Design](https://www.gamedeveloper.com/design/understanding-the-flow-channel-in-game-design)
- [Kids Balloon Pop Language Game (App Store)](https://apps.apple.com/us/app/kids-balloon-pop-language-game/id807462011) · [Balloon Pop Education for Kids (App Store)](https://apps.apple.com/us/app/balloon-pop-education-for-kids/id1539410537)
- [Wordwall — How to Create a Whack-a-Mole Activity](https://wordwall.zendesk.com/hc/en-gb/articles/360015910857--How-to-Create-a-Whack-a-Mole-Activity)

---

# Sentence Puzzle (Raja Susun)

Status: **sudah diimplementasi** (2026-09-26) — lihat "Implementasi" di bawah. Kode: `app/src/games/sentencepuzzle.ts` (mesin & Map), `app/src/games/sentencepuzzle-data.ts` (tabel tier + bank kalimat, satu-satunya tempat mengubah pembeda/kalimat). Di roster namanya "Sentence Puzzle" (`key: 'susun'`); 6 markas: Halaman → Taman → Bengkel → Studio → Panggung → Puncak Kalimat.

## Ringkasan (High-Level)

**Verdict: pembeda markas sekarang BELUM sesuai tantangannya.** Keenam markas punya tugas yang sama persis: kalimat Inggris **dibacakan otomatis**, anak menyusun gelembung kata sesuai yang didengar (dikte). Satu-satunya pembeda = **jumlah kata pengecoh** (3 → 9). Kalimatnya sendiri tidak berubah antar markas; panjang & polanya ikut level Vocab anak.

Masalahnya, pengecoh tambahan hampir tidak menambah tantangan bahasa:
- **Pengecoh dari kalimat saudara** biasanya berpola sama ("I see a ___"), jadi yang beda cuma 1 kata benda. Anak yang mendengar audio langsung tahu kata benda mana yang dipakai.
- **Pengecoh "filler"** (quickly, happily, tiny…) tidak pernah ada di audio, jadi bisa langsung diabaikan. Isinya cuma kebisingan visual.
- Yang naik = **beban mencari** di piramida (±7 → ±14 gelembung), bukan pemahaman pola kalimat.

Simulasi 2.000 ronde per markas × level (skrip scratchpad, meniru `buildRound`):

| Markas | Gelembung (rata²) | Pengecoh yang beda dari kata target | …di antaranya filler | Kata pertama bocor lewat huruf kapital |
|---|---|---|---|---|
| Pemanasan | 6,8–8,7 | 1,9–2,5 | ±0,5 | 26–47% ronde |
| Mudah | 8,7–10,7 | 3,6–4,3 | 1,2–1,7 | 23–42% |
| Sedang | 9,8–11,6 | 4,5–5,2 | 2,0–2,6 | 25–39% |
| Sulit | 10,8–12,6 | 4,8–5,9 | 1,4–1,9 | 20–34% |
| Jago | 11,8–13,6 | 5,7–6,9 | 2,0–2,6 | 18–33% |
| Legendaris | 12,8–14,7 | 6,2–7,6 | 1,9–2,6 | 16–31% |

(Rentang = variasi antar level anak Little Stars…Trailblazer.) Panjang kalimat target sama di semua markas: rata² 3,8 kata (Little Stars) sampai 5,7 kata (Trailblazer).

## Kondisi Sekarang (Baseline di Kode) [F]

- **Sumber kalimat**: `VocabItem.example.en` dari topik Vocab **level anak** (`vocabTopicsForLevel(level)` di `app.ts runRajaRound`). Jadi yang menentukan kalimat adalah level anak, bukan markas. Anak Little Stars di Legendaris tetap menyusun kalimat 3–5 kata.
- **Pembeda cuma `DIFFICULTY_META`**: `siblingCount` 1/1/1/2/2/3, `fillerCount` 1/2/3/3/4/5, `maxDistractors` 3/5/6/7/8/9. `ROUND_COUNT = 5` kalimat per markas, sama semua.
- **Audio kalimat target diputar otomatis** tiap ronde (`speak(round.targetWords.join(' '))`) di SEMUA markas. Tugasnya pada dasarnya **dikte dengar** — task shape yang sama dengan Listening Tantangan "🎧 Dengar & Susun" (`runSusunKalimatSentence`).
- **💡 Petunjuk = seluruh kalimat Inggris langsung tampil**, tersedia sejak awal di semua markas. Satu tap langsung menyelesaikan soal; bantuan tidak berkurang di markas atas.
- **Arti Indonesia (`example.id`) tidak pernah dipakai**, padahal datanya ada.
- **Huruf kapital membocorkan kata pertama**: `tokenize` mempertahankan kapital asli, jadi "The"/"She" di awal kalimat kelihatan beda dari gelembung lain (16–47% ronde, lihat tabel).
- **Jawaban dicek string persis** — urutan lain yang juga benar ("Today I play" vs "I play today") dianggap salah. Belum masalah untuk kalimat Vocab yang pendek, tapi akan jadi masalah kalau kalimat dibuat lebih kompleks.
- **Gelembung teks saja, tidak dibacakan saat ditap** → anak yang belum bisa membaca (Little Stars) bisa mendengar kalimat tapi tidak tahu gelembung mana yang cocok.
- Salah: merah + getar + tetot, tanpa pembuka jawaban otomatis (anak bisa pakai Petunjuk).
- **Kalimat diambil acak dengan pengembalian** (topik acak → item acak tiap ronde) → kalimat yang sama bisa muncul 2x dalam 5 soal satu markas.
- **Tanda baca di tengah kalimat ikut masuk gelembung** ("Hello," di 8 kalimat Little Stars) → posisi kata itu ketahuan dari komanya.

**Kemiripan kalimat saudara (bahan pengecoh) per level** — skrip atas `VOCAB_TOPICS_BY_LEVEL`, semua pasangan kalimat dalam 1 topik:

| Level anak | Rata² kata/kalimat (sepertiga pendek → panjang) | Pasangan berbagi ≥50% kata target | Kata pertama sama |
|---|---|---|---|
| Little Stars | 3,8 (3,2 → 4,2) | 61% | 77% |
| Starter | 4,4 (3,4 → 5,6) | 27% | 51% |
| Explorer | 4,6 (3,6 → 5,8) | 23% | 51% |
| Adventurer | 4,5 (3,5 → 5,6) | 14% | 35% |
| Achiever | 4,4 (3,5 → 5,6) | 28% | 61% |
| Trailblazer | 5,7 (4,5 → 6,7) | 8% | 45% |

Artinya: di Starter ke atas, kalimat saudara jarang mirip, jadi pengecohnya gampang dibuang lewat telinga. Kalau kalimat tetap dari Vocab (bukan bank per markas), memilah panjang kalimat per markas masih bisa, tapi selisihnya kecil (±1–2 kata), jadi tidak cukup untuk jadi sumbu utama.

## Temuan Masalah (Urut Prioritas)

1. **Satu bentuk soal diulang 6x** — dikte dengar di semua markas, tanpa jenis tantangan baru. Bertentangan dengan prinsip Word Quest ("1 tantangan baru per markas").
2. **Kalimat tidak ikut naik** — struktur, panjang, dan kosakata ditentukan level anak, bukan markas. Markas atas hanya "lebih ramai".
3. **Pengecoh tidak menguji pola kalimat** — filler tidak terdengar di audio, pengecoh saudara cuma beda kata benda. Tidak ada pengecoh bentuk salah (is/are, play/plays) yang benar-benar menguji tata bahasa.
4. **Petunjuk terlalu kuat & tidak memudar** — satu tap = jawaban utuh, sama di Pemanasan dan Legendaris.
5. **Kebocoran huruf kapital** — melanggar CLAUDE.md "Soal Tidak Boleh Bisa Ditebak Tanpa Paham" (bentuk tulisan membocorkan posisi kata).
6. **Tumpang tindih dengan materi** — sama persis dengan Listening Tantangan "Dengar & Susun", mirip Vocab Tantangan "Susun Kalimat" & Grammar Latihan Inti "Susun Kalimat". Game ini belum punya identitas sendiri.
7. **Tidak ramah non-pembaca** — gelembung tidak dibacakan.

## Bukti Riset per Sumbu

| Sumbu | Temuan | Konsekuensi untuk Sentence Puzzle |
|---|---|---|
| **Urutan pemerolehan struktur** | Processability Theory (Pienemann): pelajar L2 Inggris naik dari frasa hafalan → **SVO sederhana** → tambahan di awal/akhir kalimat (keterangan, wh-question) → **pertanyaan yes/no berinversi** → struktur lebih jauh; urutan ini tidak bisa dilompati lewat pengajaran (Teachability Hypothesis). Anak L1 Inggris juga menguasai kalimat pernyataan & perintah lebih dulu dari pertanyaan & negatif. | Markas naik lewat **pola kalimat**: SVO → + keterangan → negatif/pertanyaan → 2 klausa. Bukan lewat jumlah gelembung. |
| **Penentu sulitnya tugas susun kalimat** | Kesulitan tugas menyusun kata acak dipengaruhi dua sumbu: *reading difficulty* (panjang kalimat, kosakata) dan **kompleksitas sintaksis** (kedalaman struktur); keduanya berpengaruh sistematis (ERIC EJ1149764; riset kompleksitas sintaksis). | Panjang kalimat boleh naik bertahap (3 → 8 kata), tapi yang utama kompleksitas struktur. |
| **Modalitas prompt** | Duolingo membedakan *tap what you hear* (dikte dari audio) dari *translate* (menyusun dari arti bahasa ibu), dan menyusun dari word bank terasa kurang menantang dibanding recall. | Tangga modalitas: dengar + arti (paling dibantu) → dengar saja → **arti Indonesia saja** (anak harus membangun kalimat dari makna, bukan menyalin suara). |
| **Kualitas pengecoh** | Pengecoh yang plausibel (mirip bentuk/arti) menaikkan kesulitan & daya beda soal; pengecoh yang jelas tidak relevan tidak menambah apa-apa (Ludewig dkk. 2023, lihat Taman Balon). Duolingo mengambil pengecoh dari kalimat pelajaran yang sama. | Ganti filler acak dengan **bentuk salah dari kata di kalimat itu** (is/are, do/does, because/so), pola `wrong` yang sudah dipakai Grammar. |
| **Fading bantuan** | Bantuan dikurangi bertahap seiring kemampuan (lihat Word Quest). | Petunjuk: 1 kata berikutnya → dengar kalimat → arti per kata; di markas atas terkunci sampai 1x coba. |
| **Format soal susun kalimat standar** | Lanteigne (2017): soal susun kalimat klasik menyajikan kata **huruf kecil** dan meminta peserta menambahkan kapital & tanda baca sendiri; soal yang lebih baik bersifat kontekstual/bermakna dan bisa menerima lebih dari 1 jawaban benar. | Dasar untuk gelembung huruf kecil, terima `alt`, dan prompt dari makna di markas atas. |
| **Jumlah gelembung vs pencarian visual** | Pada anak, waktu mencari naik linear dengan jumlah pengecoh untuk pencarian yang tidak menonjol; efisiensi mencari matang paling lambat dibanding akurasi (PMC7300101). Kemiripan target-pengecoh lebih berpengaruh daripada jarak/jumlah; anak 4–6 th fiksasi lebih lama dari 7–8 th. | Menambah filler = menambah beban mata, bukan bahasa. Batasi total gelembung (±11) dan naikkan kemiripan pengecoh. |

## Rujukan di App (Preseden Internal) [F]

- **Grammar `GrammarSentenceTopic`** sudah punya data yang pas: `sentences[]` dengan `en`/`id`/`key`/`wrong` (2 bentuk salah per kalimat)/`alt` (urutan lain yang benar), dan Latihan Inti Grammar sudah menyusun kalimat dengan kata jebakan dari `wrong` + menerima `alt`. Game bisa memakai mesin & pola data yang sama.
- **Listening Tantangan "Dengar & Susun"** = dikte dengar (teks Indonesia sengaja disembunyikan). Sentence Puzzle sebaiknya tidak menduplikasi ini di semua markas; cukup di markas awal.
- **Word Quest Pemanasan**: tap kartu kata = dibacakan (`speakOnTap`). Pola ini bisa dipakai supaya gelembung Pemanasan dibacakan saat ditap.

**Supaya tidak duplikat dengan Susun Kalimat di materi:**

| Tempat | Soal dari | Pengecoh |
|---|---|---|
| Listening Tantangan "🎧 Dengar & Susun" | audio | tidak ada |
| Vocab Tantangan "🔤 Susun Kalimat" | arti Indonesia | tidak ada |
| Grammar Latihan Inti "🎯 Susun Kalimat" | kalimat Grammar | kata jebakan `wrong` per tier |
| **Sentence Puzzle (usulan)** | berganti per markas: audio → arti Indonesia | kata tak terdengar → kalimat lain → bentuk salah; pola kalimat naik SVO → 2 klausa |

## Usulan Tier (Riset Awal) [U]

Prinsip: **1 tantangan baru per markas**, bentuk game tetap (piramida gelembung + bar jawaban emas), kalimat diambil dari **bank kalimat per markas** (seperti Word Quest & Taman Balon punya bank sendiri), bukan dari level Vocab anak.

| Markas | Prompt | Pola kalimat (contoh) | Kata | Pengecoh | 💡 Petunjuk | Tantangan baru |
|---|---|---|---|---|---|---|
| Pemanasan | 🔊 otomatis + arti Indonesia; **gelembung dibacakan saat ditap** | SVO sangat pendek ("I like cats.") | 3 | 1 kata yang tidak terdengar | isi 1 kata berikutnya | susun dari dengar, dibantu penuh |
| Mudah | 🔊 otomatis, tanpa arti | SVO + adjektiva/objek ("The ball is red.") | 4–5 | 2 kata dari kalimat lain (beda benda) | isi 1 kata berikutnya | bedakan kata yang benar-benar terdengar |
| Sedang | **arti Indonesia saja** (🔊 lewat Petunjuk) | + keterangan tempat/waktu ("I play football after school.") | 5–6 | 2 kata lain | 🔊 dengar kalimat | bangun kalimat dari makna, bukan menyalin suara |
| Sulit | arti Indonesia | pernyataan dengan bentuk kata kerja yang harus pas ("She plays with her cat.") | 5–7 | **2 bentuk salah** (play/playing, is/are) | 🔊 dengar kalimat | pilih bentuk kata yang benar |
| Jago | arti Indonesia | **negatif & pertanyaan** ("Do you like pizza?", "He doesn't swim.") | 5–7 | bentuk salah (do/does, don't/doesn't) | arti per kata; 🔒 sampai 1x coba | balik urutan untuk bertanya/menyangkal |
| Legendaris | arti Indonesia | **2 klausa + penghubung** ("I stay home because it is raining.") | 7–9 | penghubung salah (because/so/but) | arti per kata; 🔒 sampai 1x coba | gabung 2 ide jadi 1 kalimat |

Detail usulan:
- **Semua gelembung ditulis huruf kecil** (kecuali "I" & nama orang); kapital baru muncul di bar jawaban setelah benar. Menutup kebocoran kata pertama.
- **Filler acak dihapus**; pengecoh = kata dari kalimat lain (Pemanasan–Sedang) atau bentuk salah `wrong` (Sulit–Legendaris). Jumlah gelembung jadi sekitar 4 → 11, naik karena kalimat lebih panjang, bukan karena kebisingan.
- **Terima urutan lain yang benar** (`alt`, pola Grammar) mulai Sedang, karena keterangan waktu & klausa "because" bisa dipindah.
- **Bank kalimat per markas** dipisah ke `games/sentencepuzzle-data.ts` dan dicek build (pola `wordmatch-data.ts`): tiap kalimat punya `id` (arti Indonesia), `wrong` tidak boleh ada di kalimat, `alt` berisi kata yang sama, kosakata naik wordlist Starters → Movers → Flyers.
- **Pembeda dari materi**: Pemanasan–Mudah = dikte (seperti Listening), Sedang ke atas = "terjemahkan dengan menyusun" + pola makin kompleks. Jadi Sentence Puzzle menjadi satu-satunya tempat anak memanjat tangga struktur kalimat dari SVO sampai 2 klausa.
- **5 kalimat per markas dipertahankan** (menyusun kalimat lebih lama dari mencocokkan kata; 10 kalimat 7–9 kata di Legendaris terlalu panjang untuk 1 sesi).

## Yang SENGAJA Tidak Dibedakan

- **Tanpa timer, nyawa, skor kecepatan.**
- **Salah = merah + getar + tetot**, "🔁 Coba Lagi" mempertahankan Petunjuk yang sudah dibuka (non-punitive).
- **Tanpa ikon di layar susun kalimat** (CLAUDE.md "Ikon/Gambar WAJIB Relevan" poin 7).
- **Unlock markas "cukup pernah dicoba"**, tidak ditautkan ke `LevelKey` anak.

## Gotcha

- Kalimat Jago (pertanyaan) berakhir "?" — `tokenize` sekarang membuang tanda baca akhir; kalau tanda tanya perlu tampil di bar jawaban, tambahkan setelah benar, jangan sebagai gelembung (jadi bocoran "ini pertanyaan").
- Pengecoh bentuk salah harus benar-benar tidak gramatikal di kalimat itu (pelajaran Grammar: "asked if he could" ternyata benar juga). Kalau cuma beda arti, arti Indonesia wajib tampil.
- Tanda baca di tengah kalimat ("Hello,") jangan ikut di gelembung — tampilkan di bar jawaban setelah benar, sama seperti kapital.
- Ambil kalimat dari antrian yang diacak (seperti Word Quest), supaya tidak ada kalimat kembar dalam 1 markas.
- Kata yang muncul 2x di kalimat ("the … the") tetap dua gelembung; pengecekan jawaban berbasis kata, bukan indeks gelembung (sudah begitu sekarang).
- Kalau pindah dari level Vocab anak ke bank per markas, kalimat Little Stars/Starter tidak lagi otomatis lebih mudah untuk anak kecil — Pemanasan & Mudah harus tetap bisa dimainkan anak 5–7 th.

## Implementasi (2026-09-26) [F]

Pertanyaan terbuka di bawah dijawab dengan rekomendasi: bank per markas, bank terpisah dari Grammar, gelembung Pemanasan dibacakan saat ditap.

- **`TIER_CONFIG`** (`sentencepuzzle-data.ts`): per markas `prompt` (`audio-meaning`/`audio`/`meaning`), `speakOnTap`, `distractor` (`sibling`/`wrong`) + `distractorCount`, `hint` (`next-word`/`listen`), `hintGated`, rentang `minWords`–`maxWords`, `task` (1 baris instruksi).
- **Bank**: 10 kalimat per markas (60 total), berarti Indonesia; Sulit–Legendaris punya `wrong` (2 bentuk keliru), kalimat ber-keterangan/klausa punya `alt`. 5 kalimat diacak per markas.
- **Beda dari usulan**: Petunjuk Jago/Legendaris = 🔊 dengar kalimat (🔒 sampai 1x coba), bukan "arti per kata" (butuh data glosarium per kata yang belum ada).
- **Mesin** (`runSentencePuzzleRound`): kata pertama dikecilkan (kecuali "I"), filler acak & `DIFFICULTY_META` dihapus, jawaban cocok kalimat utama ATAU `alt`, Petunjuk "isi 1 kata" memotong susunan ke awalan yang sudah benar lalu mengisi 1 kata berikutnya, setelah benar bar jawaban menampilkan kalimat asli (kapital + tanda baca). `runSentencePuzzle(container, onDone, level)` tidak lagi menerima topik Vocab (`app.ts runRajaRound` ikut diubah).
- **Build** (`verify-vocab-content.mjs`): ≥8 kalimat/markas, arti wajib, tanpa koma, jumlah kata sesuai tier, `wrong` tepat 2 & tidak ada di kalimat, `alt` = kata sama persis, tidak ada kalimat kembar antar markas.
- **Diverifikasi live** (Playwright, 390px & 1280px): 6 markas × 5 kalimat tuntas sampai "Semua Kalimat Tersusun!", jawaban keliru → merah + teks semangat, Petunjuk "isi 1 kata" mengisi kata pertama, 🔒 terbuka setelah 1x coba, Petunjuk 🔊 memunculkan tombol Dengar, urutan `alt` diterima, 0 gelembung berhuruf kapital di awal, 0 pageerror.

## Pertanyaan Terbuka (Butuh Keputusan User)

_(Sudah dijawab dengan rekomendasi di "Implementasi"; tetap dicatat kalau mau diubah.)_

1. Sumber kalimat: **bank per markas** (usulan, tangga struktur jelas) atau **tetap dari level Vocab anak** (kosakata sesuai level, tapi markas hanya mengubah bantuan & pengecoh)?
2. Boleh memakai data Grammar `GrammarSentenceTopic` sebagai bank kalimat Sulit–Legendaris, atau bank terpisah supaya game tidak mengulang kalimat materi?
3. Little Stars (belum membaca): cukup gelembung dibacakan saat ditap di Pemanasan, atau game ini disembunyikan/dibatasi untuk mereka?

## Batasan Riset (Jujur)

- Tidak ditemukan studi khusus game "susun gelembung kata" untuk anak Indonesia; tangga struktur diambil dari Processability Theory (L2 umum, bukan khusus anak) dan urutan pemerolehan L1.
- Cambridge YLE tidak punya bagian resmi "susun kata acak"; rujukan Cambridge dipakai untuk wordlist, bukan format tugas.
- Angka simulasi dari skrip yang meniru `buildRound`, belum diukur dari permainan anak sungguhan.

## Sumber

- Kode: `app/src/games/sentencepuzzle.ts`, `app/src/app.ts` (`runRajaRound`), preseden `app/src/games/grammar.ts` & `wordmatch-data.ts`
- [Processability theory (Wikipedia)](https://en.wikipedia.org/wiki/Processability_theory) · [Pienemann's Teachability Hypothesis and Processability Theory](https://scispace.com/pdf/pienemann-s-teachability-hypothesis-and-processability-7g4739n29p.pdf) · [In which order should we teach grammar structures? (The Language Gym)](https://gianfrancoconti.com/2025/02/12/in-which-order-should-we-teach-grammar-structures-manfred-pienemanns-answer/)
- [Language Acquisition Stages in Children](https://speechblubs.com/blog/children-language-acquisition-stages)
- [Unscrambling jumbled sentences: An authentic task (ERIC)](https://files.eric.ed.gov/fulltext/EJ1149764.pdf)
- [Duolingo — approach to writing skills](https://blog.duolingo.com/covering-all-the-bases-duolingos-approach-to-writing-skills/) · [Duolingo — approach to listening skills](https://blog.duolingo.com/covering-all-the-bases-duolingos-approach-to-listening-skills/) · [Duolingo exercise types (Fandom)](https://duolingo.fandom.com/wiki/Exercise)
- [Ludewig dkk. (2023), Distractor Plausibility in Synonym-Based Vocabulary Tests](https://journals.sagepub.com/doi/10.1177/07342829231167892)
- [Efficiency and accuracy of visual search develop at different rates from early childhood through early adulthood (PMC)](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC7300101/) · [Target-distractor similarity has a larger impact on visual search in school-age children than spacing](https://www.academia.edu/128600413/Target_distractor_similarity_has_a_larger_impact_on_visual_search_in_school_age_children_than_spacing)

---

# Memory Hunt (Raja Ingatan)

Status: **sudah diimplementasi** (2026-09-29). Kode: `app/src/games/memorymatch.ts` (mesin & Map), `app/src/games/memorymatch-data.ts` (tabel tier + bank, satu-satunya tempat mengubah pembeda/kata). Di roster namanya "Memory Hunt" (`key: 'ingatan'`, `/game/raja-ingatan`). 6 markas: Beranda Ingatan → Ruang Kenangan → Lorong Ingatan → Perpustakaan Pikiran → Menara Konsentrasi → Puncak Ingatan.

## Ringkasan (High-Level)

**Sebelum**: keenam markas punya tugas identik (buka 2 kartu tertutup, cocokkan gambar + kata Indonesia dengan kata Inggris), 1 papan per markas. Pembedanya cuma **jumlah kartu** (4 → 14, beban ingatan letak, bukan bahasa Inggris) dan **kata makin jarang**, yang di markas atas malah penuh kognat (Teleskop↔Telescope).

**Sekarang**: kartu tertutup & aturan main tetap sama di semua markas (identitas game ini = mengingat letak). Yang naik tiap markas = **aturan pasangan**, SATU jenis baru per markas. Papan maksimal 4 pasang, **5 papan per markas**, bullet progress per papan, sama konsepnya dengan game lain:

| Game | Isi 1 markas | Bullet progress |
|---|---|---|
| Word Quest | 10 papan | per papan |
| Balloon Hunt | 10 kata | per kata |
| Sentence Puzzle | 5 kalimat | per kalimat |
| **Memory Hunt** | **5 papan** | **per papan** |

5 papan, bukan 10: 1 papan memori jauh lebih lama dari 1 papan Word Quest (kartu tertutup, satu pasang butuh beberapa giliran).

## Kondisi Sebelum Dirombak [F]

- **1 markas = 1 papan saja**; bullet progress menghitung pasangan di papan itu, bukan soal.
- Pasang per markas 2/3/4/5/6/7 → 4/6/8/10/12/14 kartu di grid **3 kolom tetap**. 4, 8, 10 & 14 kartu menyisakan kartu ganjil di baris terakhir.
- **Bank kekecilan**: Jago 6 kata untuk 6 pasang, Legendaris 7 kata untuk 7 pasang → isi papan selalu sama persis, cuma posisinya diacak.
- **Kognat (kemiripan ejaan ID↔EN ≥ 0,6)**: Bus↔Bus (**persis sama**), Pena↔Pen, Gitar↔Guitar, Pinguin↔Penguin, Kanguru↔Kangaroo, Dinosaurus↔Dinosaur, Astronot↔Astronaut, Kompas↔Compass, Teleskop↔Telescope, Komet↔Comet, Satelit↔Satellite, Mikroskop↔Microscope, Terompet↔Trumpet, Akordeon↔Accordion — **14 dari 39 kata**, Legendaris **7 dari 7**. Pasangannya bisa ditemukan dari ejaan saja (CLAUDE.md "Soal Tidak Boleh Bisa Ditebak" pola #2).
- **Emoji melanggar "Kepala SAJA"**: 🐟 🐦 🐘 🐧 🦘 (sudah di denylist build) + 🦋 🦖 🐙 🦎 🧑‍🚀 🐔; plus 🎃 (Halloween). Tidak ketahuan build karena bank game ini tidak dicek skrip mana pun.
- Tanpa audio, tanpa bantuan. Kartu Indonesia selalu bergambar, jadi yang dicocokkan sebenarnya gambar ↔ kata Inggris.
- Tumpang tindih dengan Word Quest (keduanya "kata Inggris ↔ gambar"); tidak ramah non-pembaca.

## Tangga Tier (Terimplementasi) [F]

| Markas | Kartu A ↔ Kartu B | Pasang (kartu) | 💡 Bantuan (1x/papan) | Tantangan baru |
|---|---|---|---|---|
| Pemanasan (Beranda Ingatan) | gambar ↔ kata Inggris, **kartu kata dibacakan 🔊 saat dibuka** | 2 (4) | 👀 Intip semua kartu 2 dtk | kenal aturan main; bisa dimainkan non-pembaca |
| Mudah (Ruang Kenangan) | gambar ↔ kata Inggris (tanpa suara) | 3 (6) | 👀 Intip semua kartu | baca kata sendiri sambil mengingat letak |
| Sedang (Lorong Ingatan) | **kata Indonesia ↔ kata Inggris**, tanpa gambar | 3 (6) | 👀 Intip semua kartu | terjemahkan tanpa bantuan gambar (teks lebih sulit diingat → pasang tidak dinaikkan) |
| Sulit (Perpustakaan Pikiran) | **🔊 bunyi ↔ tulisan kata Inggris** (kartu bunyi tanpa tulisan) | 4 (8) | 👀 Intip kartu tulisan saja | cocokkan bunyi ↔ ejaan sambil mengingat letak suara |
| Jago (Menara Konsentrasi) | **kata ↔ lawan katanya** (Big ↔ Small) | 4 (8) | 💡 Arti Indonesia di kartu | relasi makna, bukan terjemahan |
| Legendaris (Puncak Ingatan) | **kalimat rumpang ↔ kata** ("I borrow books from the ___." ↔ Library) | 4 (8) | 💡 Arti Indonesia kalimat (tetap berlubang) | pilih kata dari konteks kalimat (Flyers R&W) |

Berlaku di semua markas:
- **5 papan per markas** (`BOARD_COUNT`), bullet 1–5. Papan tuntas → "🔁 Coba Lagi" (papan sama, posisi diacak ulang, skor balik ke awal papan, bantuan yang sudah dipakai tidak kembali) / "Lanjut ➡️" (papan berikutnya, bantuan tersedia lagi). Papan ke-5 → balik ke Map; di markas terakhir tombolnya "Selesai ✅".
- Pasangan diambil dari antrian yang diacak: semua keluar dulu sebelum ada yang berulang, tidak ada yang kembar dalam 1 papan.
- 1 baris instruksi di atas papan berubah per aturan (`TIER_CONFIG.task`), tombol 💡 di sebelahnya.
- Grid selalu penuh: 4 kartu → 2×2, 6 → 3×2, 8 → 4×2; kartu kalimat Legendaris 2 kolom di HP / 4 di desktop, tinggi ikut isi.
- Pasangan salah → merah + getar + tetot, kedua kartu ditutup lagi (tidak berubah).

## Implementasi [F]

- `TIER_CONFIG` (`memorymatch-data.ts`): per markas `pairCount`, `mode` (`picture`/`translate`/`sound`/`opposite`/`gap`), `speakOnOpen`, `hint` (`peek`/`peek-written`/`meaning`), `task`.
- Bank: `PICTURE_BANK` (Pemanasan & Mudah, 12 kata masing-masing), `TRANSLATE_BANK` (Sedang, 12), `SOUND_BANK` (Sulit, 12), `OPPOSITE_BANK` (Jago, 13 pasang), `GAP_BANK` (Legendaris, 12 kalimat + arti berlubang).
- Mesin (`runMemoryMatchRound`): tiap bank diubah jadi pasangan 2 sisi kartu (`pairBank()`); kartu bunyi terbuka = 🔊 saja (tulisan baru muncul setelah cocok, `aria-label` "Kartu suara" supaya tidak bocor); 👀 Intip menutup kartu yang sedang terbuka, membuka semua (atau cuma kartu tulisan) 2 dtk, lalu menutup lagi — selama itu kartu tidak bisa ditap.
- **Build** (`verify-vocab-content.mjs`): denylist emoji makhluk hidup; larangan kognat (kemiripan Levenshtein ID↔EN ≥ 0,6) di bank gambar/terjemahan/bunyi; kata tidak kembar di seluruh bank; emoji tidak kembar; lawan kata wajib berarti; kalimat rumpang wajib tepat 1 `___` (EN & ID), tidak memuat jawabannya, tanpa "a/an ___"; bank ≥ 2× jumlah pasang.
- CSS `.mm-*` (`public/styles.css`): `.mm-c4/-c8/-c12` (kolom), `.is-text`, `.is-gap`, `.mm-card.is-sound`, `.mm-meaning`.
- **Diverifikasi live** (Playwright, 390px & 1280px): keenam markas × 5 papan dituntaskan dalam 1 sesi sampai "Semua Ingatan Terkumpul!"; papan ke-5 markas lain = "Lanjut ➡️", markas terakhir = "Selesai ✅"; 👀 Intip membuka semua kartu (Sulit: cuma 4 kartu tulisan) lalu menutup lagi; 💡 Arti menampilkan arti Indonesia (kalimat tetap berlubang); kartu bunyi ber-`aria-label` "Kartu suara"; tombol 💡 muncul lagi di papan baru; tanpa scroll horizontal; 0 pageerror. Sempat ketemu 2 masalah tampilan & sudah diperbaiki: grid 8 kartu meluap di HP (`minmax(0,1fr)`), kalimat Legendaris terpotong & tertimpa ✅ (lebar teks 100% + padding atas).

## Bukti Riset per Sumbu

| Sumbu | Temuan | Konsekuensi untuk Memory Hunt |
|---|---|---|
| **Kemampuan memori anak** | Anak 5–9 th bisa menyamai (bahkan mengungguli) orang dewasa di Concentration pada ukuran tertentu (Baker-Ward & Ornstein 1988); anak 5–10 th relatif setara satu sama lain, orang dewasa lebih baik (Schumann-Hengsteler 1996); anak 8 th setara orang dewasa, anak 6 th belum (Consciousness & Cognition 2019). | Ingatan posisi **bukan** keterampilan yang diajarkan app ini dan berkembang sendiri sesuai usia. Jumlah kartu boleh naik sedikit sebagai bumbu, jangan jadi sumbu utama. |
| **Kapasitas memori kerja** | Kapasitas "chunk" naik dari ±2 (usia 5) ke ±4 (usia 14), ±0,5 per tahun (Cowan 2009, 2016). | 12 kartu (6 pasang) cukup sebagai batas atas; 14+ kartu membebani anak kecil yang juga bisa masuk markas Legendaris. |
| **Identitas vs lokasi** | Pemain Concentration jauh lebih akurat mengingat **isi** kartu daripada **letaknya** (Eskritt, Lee & Donald 2001). | Yang sulit bagi anak adalah letak, bukan isi. Ruang tantangan bahasa ada di **aturan pasangan** (apa yang dianggap sepasang), bukan di jumlah kartu. |
| **Gambar vs teks** | *Picture superiority effect*: gambar lebih mudah diingat dari kata tertulis (Paivio, dual coding). | Kartu teks-teks (tanpa gambar) otomatis lebih sulit → jumlah pasangnya harus lebih kecil dari markas bergambar, bukan sama. |
| **Kognat** | Kognat/kata serapan menggelembungkan skor kosakata (Laufer & McLean 2016, lihat Taman Balon). | Dilarang di semua markas (dicek build). |
| **Pasangan relasional** | Duolingo "tap the pairs" memakai pasangan kata↔arti dan audio↔kata; Cambridge Movers/Flyers menguji kata berlawanan & kata dalam kalimat rumpang. | Tangga pasangan: gambar → arti Indonesia → bunyi → lawan kata → kalimat rumpang. |
| **Fading bantuan** | Bantuan dikurangi bertahap (lihat Word Quest). | "💡 Intip" (buka semua kartu sebentar) di markas awal; hilang di markas atas. |

## Yang SENGAJA Tidak Dibedakan

- **Tanpa timer, nyawa, batas giliran, skor kecepatan.** Skor tetap +10 per pasangan, tanpa pengurangan saat meleset. Intip 2 dtk bukan timer (tidak ada yang hilang kalau tidak sempat dilihat).
- **Salah = merah + getar + tetot**, lalu kedua kartu ditutup lagi (non-punitive).
- **Unlock markas "cukup pernah dicoba"**, progres markas tidak disimpan, tidak ditautkan ke `LevelKey` anak (konsisten game lain).

## Gotcha

- Menambah kata gambar/terjemahan/bunyi: emoji tidak boleh dipakai kata lain di bank mana pun dan bukan kognat (build menolak kemiripan ≥ 0,6; kata serapan yang lolos tetap cek manual — "Tenda" ↔ "Tent" jangan).
- Bank bunyi: jangan homofon (see/sea) — dari suara saja keduanya benar.
- Lawan kata: tiap kata cuma di 1 pasangan, dan jangan taruh 2 pasangan yang bisa "silang". Tall/Short + Big/Small (Small↔Tall terasa berlawanan) dan Hard/Soft + Loud/Quiet (Loud↔Soft lawan kata yang sah) SENGAJA dibuang. Hindari juga kata yang punya 2 lawan (Old: New/Young — cuma boleh salah satunya ada di bank).
- Kalimat rumpang: harus cuma cocok ke 1 kata di bank, dan kata sandang jangan membocorkan ("an ___" cuma cocok kata berawalan vokal; "with ___" tanpa sandang cuma cocok kata jamak) — pakai "my/the". Arti Indonesia tetap berlubang supaya 💡 Arti tidak membocorkan jawaban.
- Mengubah jumlah pasang: jaga jumlah kartu 4/6/8/12, jangan 10 atau 14 (atau tambah kelas kolom baru).
- Pemanasan & Sulit memakai `speak()`; berhenti otomatis saat keluar (aturan audio).

## Keputusan yang Diambil (dulu Pertanyaan Terbuka)

1. Tangga aturan pasangan **diimplementasikan** (permintaan user "kerjakan sehingga statusnya selesai semua").
2. Legendaris = **kalimat rumpang ↔ kata**, bukan kata ↔ kategori (kategori sudah dipakai Word Quest Sulit).
3. **5 papan per markas**, tidak disamakan ke 10.
4. Bank ±12 per markas → dengan 4 pasang × 5 papan tiap kata muncul ±1,7x per markas. Boleh diperbesar kalau terasa berulang.

## Batasan Riset (Jujur)

- Studi Concentration memakai gambar, bukan pasangan kata dua bahasa; efek "teks lebih sulit diingat" disimpulkan dari picture superiority, belum diukur di game ini.
- Keanggotaan wordlist Cambridge YLE untuk bank baru **belum dicek dengan skrip** seperti Taman Balon.
- Tangga belum diuji ke anak; lama Intip (2 dtk) & jumlah pasang perlu dicoba langsung.

## Sumber

- Kode: `app/src/games/memorymatch.ts`, `app/src/games/memorymatch-data.ts`, `app/scripts/verify-vocab-content.mjs`, `app/public/styles.css` (`.mm-*`)
- [Baker-Ward & Ornstein (1988), Age differences in visual-spatial memory performance: Do children really out-perform adults when playing Concentration?](https://link.springer.com/article/10.3758/BF03337672)
- [Schumann-Hengsteler (1996), Children's and Adults' Visuospatial Memory: The Game Concentration](https://www.tandfonline.com/doi/abs/10.1080/00221325.1996.9914847)
- [Eight-year-olds, but not six-year-olds, perform just as well as adults when playing Concentration (Consciousness and Cognition 2019)](https://pubmed.ncbi.nlm.nih.gov/30731396/)
- [Eskritt, Lee & Donald (2001), The influence of symbolic literacy on memory: Testing Plato's hypothesis](https://pubmed.ncbi.nlm.nih.gov/11301727/)
- [Cowan dkk. (2009), Investigating the childhood development of working memory using sentences](https://pubmed.ncbi.nlm.nih.gov/19539305/) · [Cowan (2016), Working memory maturation](https://memory.psych.missouri.edu/assets/doc/articles/2016/cowan-pps-2016-working-memory-maturation.pdf)
- [Laufer & McLean (2016), Loanwords and vocabulary size test scores](https://www.researchgate.net/publication/307091093_Laufer_B_McLean_S_2016_Loanwords_and_vocabulary_size_test_scores_A_case_of_different_estimates_for_different_L1_learners_Language_Assessment_Quarterly_133_202-217)
- [Duolingo Wiki — Exercise](https://duolingo.fandom.com/wiki/Exercise) · [Cambridge A2 Flyers Reading & Writing Part 1](https://www.cambridgeenglish.org/Images/584855--online-teaching-a2-flyers-reading-and-writing-part-1.pdf)

---

# Sound Hunt (Raja Pemburu Suara)

Status: **sudah diimplementasi** (2026-09-29). Kode: `app/src/games/soundhunt.ts` (mesin & Map), `app/src/games/soundhunt-data.ts` (tabel tier + bank soal, satu-satunya tempat mengubah pembeda/soal). Di roster namanya "Sound Hunt" (`key: 'soundhunt'`, `/game/sound-hunt`). 6 markas Hutan Ajaib: Village Edge → Forest Entrance → Whispering Woods → Mushroom Garden → Crystal Cave → Castle Gate.

## Ringkasan (High-Level)

**Sebelum**: 1 markas = **1 soal saja** (seluruh game 6 soal). Keenam soal punya bentuk sama (dengar 1 instruksi → tap 1 dari 4 kartu) dan urutannya tidak naik: Legendaris "Find the rabbit." justru lebih mudah dari Sulit "Touch the blue star.".

**Sekarang**: bentuk game tetap (dengar → tap gambar), tapi tiap markas menambah **SATU hal baru di instruksi yang didengar**: 1 kata → 1 kata dengan pengecoh sekelompok → warna + benda → angka + benda → 2 perintah berurutan → tebak dari deskripsi. **10 soal per markas**, bullet progress per soal, sama konsepnya dengan game lain:

| Game | Isi 1 markas | Bullet progress |
|---|---|---|
| Word Quest | 10 papan | per papan |
| Balloon Hunt | 10 kata | per kata |
| Sentence Puzzle | 5 kalimat | per kalimat |
| Memory Hunt | 5 papan | per papan |
| **Sound Hunt** | **10 soal** | **per soal** |

10 soal (bukan 5): 1 soal Sound Hunt cuma 1x dengar + 1 tap, secepat 1 balon di Balloon Hunt.

## Kondisi Sebelum Dirombak [F]

| Markas | Soal (satu-satunya) | Masalah |
|---|---|---|
| Pemanasan | Find the dog. | pengecoh 🐦 Bird & 🐟 Fish melanggar "Kepala SAJA" |
| Mudah | Find the elephant. | 🐘 melanggar "Kepala SAJA" |
| Sedang | Find the red apple. | 🍎 vs 🍏 — cuma 1 warna yang dibedakan |
| Sulit | Touch the blue star. | "blue star" = ⭐ **kuning** di atas lingkaran biru (tidak ada emoji bintang biru) → gambar & kata tidak cocok |
| Jago | Find the small cat. | ukuran lewat `font-size` 20px vs 40px |
| Legendaris | Find the rabbit. | **lebih mudah** dari Sulit & Jago (1 kata benda polos) |

- **Kartu jawaban berlabel teks** ("Blue Star", "Small Cat") → anak yang bisa membaca cukup mencocokkan tulisan, tidak perlu mendengar (CLAUDE.md "Soal Tidak Boleh Bisa Ditebak" pola #2; tugas Listening jadi Reading).
- Bullet progress = markas yang sudah dikunjungi, bukan soal.
- Data soal tidak dicek build.

## Tangga Tier (Terimplementasi) [F]

| Markas | Instruksi (contoh) | Pengecoh (4 kartu gambar) | 💡 Petunjuk | Tantangan baru |
|---|---|---|---|---|
| Pemanasan (Village Edge) | "Find the dog." | benda dari kelompok beda (anjing, bola, kue, pohon) | langsung | kenal 1 kata dari suara |
| Mudah (Forest Entrance) | "Find the pear." | **satu kelompok** (4 buah / 4 hewan / 4 kendaraan / 4 makanan) | langsung | bedakan kata sekelompok dari suara |
| Sedang (Whispering Woods) | "Find the blue book." | benda sama beda warna + warna sama beda benda (📘 📕 💙 ❤️) | langsung | dengar **2 kata** sekaligus (warna + benda) — Starters Listening Part 4 "listen and colour" |
| Sulit (Mushroom Garden) | "Find four stars." | jumlah ±1 + benda lain jumlah sama (⭐⭐⭐⭐ ⭐⭐⭐ 📖📖📖📖 📖📖📖) | langsung | dengar **angka** + benda jamak — Starters Listening Part 2 |
| Jago (Crystal Cave) | "Tap the cow, then tap the bus." | 4 benda acak; tap **2 berurutan** (kartu diberi nomor 1, 2) | 🔒 sampai 1x coba | ikuti **perintah 2 langkah** (simpan urutan di ingatan) |
| Legendaris (Castle Gate) | "It says moo. It gives us milk." | 3 benda yang cocok **sebagian** ciri (babi, kuda, anjing) | 🔒 sampai 1x coba | pahami **deskripsi** tanpa nama bendanya |

Berlaku di semua markas:
- **10 soal per markas** (`ROUND_COUNT`), bullet 1–10. Instruksi diputar otomatis tiap soal dibuka + tombol "🔊 Dengar" (bebas diulang).
- **Kartu jawaban gambar saja**, tanpa tulisan (label cuma `aria-label`).
- 💡 Petunjuk = teks Inggris + arti Indonesia (arti dibacakan). Yang sudah terbuka tetap terbuka saat "Coba Lagi".
- Benar → nada + confetti + pujian + 💎 (1 Sound Crystal per soal, total 60). Salah → merah + getar + tetot + teks semangat. Selalu ada "🔁 Coba Lagi" / "Lanjut ➡️" (non-punitive, soal salah tetap boleh dilewati).
- Soal diambil dari antrian acak (semua keluar dulu sebelum berulang), posisi jawaban diacak.

## Implementasi [F]

- `TIER_CONFIG` (`soundhunt-data.ts`): per markas `mode` (`find`/`color`/`count`/`sequence`/`riddle`), `hintGated`, `badge` (label jenis soal di atas tombol Dengar).
- Bank: `WARMUP_BANK` (12 benda, Pemanasan), `GROUP_BANK` (4 kelompok × 7–8, Mudah), `COLOR_BANK` + `COLOR_ID` (5 benda berwarna, Sedang), `COUNT_BANK` + `NUMBER_WORDS` (8 benda × angka 2–5, Sulit), Jago memakai gabungan bank Pemanasan+Mudah, `RIDDLE_BANK` (12 teka-teki, Legendaris).
- Mesin (`buildQuestions()` di `soundhunt.ts`): soal dibuat saat markas dibuka; mode `sequence` punya 2 indeks jawaban yang harus ditap berurutan (tap pertama benar → kartu hijau bernomor 1 + nada benar kecil, tunggu tap kedua).
- **Build** (`verify-vocab-content.mjs`): denylist emoji makhluk hidup; emoji tidak kembar di bank Pemanasan+Mudah (dipakai bersama di Jago); tiap kelompok ≥4 benda; tiap warna dimiliki ≥2 benda & tiap benda ≥2 warna; teka-teki 4 opsi beda, berarti, dan tidak menyebut nama jawabannya.
- CSS (`public/styles.css`): `.sh-badge`, `.sh-card`, `.sh-picked`, `.sh-order`. Dihapus: hack `tint`/`size` inline.
- 6 markas lama tetap (nama, emoji, urutan); kalimat pemandu disesuaikan dengan jenis soal barunya.
- **Diverifikasi live** (Playwright, 390px & 1280px): keenam markas × 10 soal dituntaskan dalam 1 sesi sampai "Misi Hutan Selesai!" (60/60 💎); di tiap markas 1 jawaban salah diuji (kartu merah), 🔒 Petunjuk Jago/Legendaris terbuka setelah 1x coba, Petunjuk tetap terbuka saat "Coba Lagi"; soal ke-10 = "Lanjut ➡️", markas terakhir = "Selesai ✅"; tanpa scroll horizontal; 0 pageerror.

## Bukti Riset per Sumbu

| Sumbu | Temuan | Dipakai di |
|---|---|---|
| **Format tes Listening anak** | Cambridge Pre A1 Starters Listening: Part 2 tulis nama/angka, Part 3 dengar lalu centang 1 dari 3 gambar, Part 4 **dengar lalu warnai** benda sesuai instruksi. | Pemanasan–Mudah (tunjuk gambar), Sedang (warna), Sulit (angka) |
| **Interferensi semantik** | Kata satu kategori yang muncul bersamaan saling mengganggu → lebih sulit (Tinkham 1997, lihat Word Quest). | Mudah (4 kartu sekelompok) |
| **Pengecoh 2 dimensi** | Pengecoh yang mirip di satu ciri & beda di ciri lain memaksa anak memperhatikan kedua ciri (distractor plausibility, Ludewig dkk. 2023). | Sedang & Sulit (pengecoh warna/benda, angka/benda) |
| **Perintah bertahap** | Mengikuti instruksi lisan beberapa langkah membebani memori kerja; kemampuan ini naik seiring usia dan bervariasi antar anak (Gathercole dkk. 2008; studi 2026 soal waktu & pengulangan instruksi). | Jago (2 langkah — bukan 3, supaya tetap terjangkau anak kecil; replay tanpa batas) |
| **Deskripsi → benda** | Tingkat atas Cambridge (Flyers R&W Part 1) mencocokkan definisi dengan kata; dalam Listening berarti memahami seluruh kalimat, bukan 1 kata kunci. | Legendaris (teka-teki, pengecoh cocok sebagian ciri) |
| **Fading bantuan** | Bantuan dikurangi bertahap (lihat Word Quest). | Petunjuk langsung di 4 markas awal, 🔒 sampai 1x coba di Jago/Legendaris |

## Yang SENGAJA Tidak Dibedakan

- **Tanpa timer, nyawa, batas dengar ulang.** Replay bebas di semua markas (riset Listening app ini: putar ulang menurunkan cemas, `pembeda_level.md` § Listening).
- **Kecepatan suara** ikut setelan app (0.75x default), tidak dipercepat di markas atas.
- **4 kartu di semua markas** (grid 2×2 rapi di HP & desktop).
- **Unlock markas "cukup pernah dituntaskan"**, progres tidak disimpan, tidak ditautkan ke `LevelKey` anak (konsisten game lain).

## Gotcha

- Kartu **tanpa tulisan** itu sengaja — jangan tambahkan label kembali (game ini Listening, bukan Reading).
- Menambah warna Sedang: warna itu harus dimiliki ≥2 benda (📙 oranye dibuang karena cuma buku yang punya). Jangan pakai "tint" di belakang emoji untuk memalsukan warna.
- Angka Sulit maksimal 5 (lebih dari itu ikon jadi terlalu kecil di kartu); pakai benda yang emojinya 1 benda tunggal (bukan 🍇 setandan — aturan Jumlah Ikon).
- Teka-teki: jangan sebut nama bendanya (dicek build), pengecoh cocok sebagian ciri tapi **tidak** seluruhnya (Lemon kuning tapi tidak panjang). Hindari pengecoh yang juga cocok seluruhnya (sofa untuk "You sleep on it").
- Jago: benda di bank Pemanasan+Mudah tidak boleh ber-emoji sama (build), kalau tidak anak tidak bisa membedakan 2 kartu.
- TTS: instruksi Inggris lewat `speak()`, arti Petunjuk lewat `speakLater(speakLocalized(...))` supaya ikut berhenti saat keluar (aturan audio).

## Batasan Riset (Jujur)

- Belum ada studi khusus game "dengar & tunjuk" untuk anak Indonesia; tangga diambil dari format Cambridge YLE & riset memori kerja umum.
- Kata di bank belum dicek dengan skrip ke wordlist Cambridge; sebagian (pineapple, helicopter, watermelon) mungkin di atas Starters walau dipakai di markas Mudah — dengan kartu bergambar risikonya kecil.
- Tangga belum diuji ke anak.

## Sumber

- Kode: `app/src/games/soundhunt.ts`, `app/src/games/soundhunt-data.ts`, `app/scripts/verify-vocab-content.mjs`
- [Cambridge Pre A1 Starters, A1 Movers & A2 Flyers Sample Papers (2018)](https://www.cambridgeenglish.org/images/young-learners-sample-papers-2018-vol1.pdf) · [Sample Papers Volume 2](https://www.cambridgeenglish.org/Images/722536-cambridge-english-young-learners-sample-papers-volume-2.pdf)
- [Collins — Pre A1 Starters Teacher's Guide (format tiap Part)](https://resources.collins.co.uk/Samples/ELT/74863_Pre_A1_Starters_Teacher's_Guide.pdf)
- [Gathercole dkk. (2008), Working memory abilities and children's performance in laboratory analogues of classroom activities](https://onlinelibrary.wiley.com/doi/10.1002/acp.1407)
- [Following Spoken Instructions in School-Aged Children and Young Adults: Does Giving More Time or Repeating Instructions Help? (2026)](https://www.tandfonline.com/doi/full/10.1080/15248372.2026.2649214)
- [Tinkham (1997), The effects of semantic and thematic clustering on L2 vocabulary learning](https://journals.sagepub.com/doi/10.1191/026765897672376469)
- [Ludewig dkk. (2023), Distractor Plausibility in Synonym-Based Vocabulary Tests](https://journals.sagepub.com/doi/10.1177/07342829231167892)
- [Cambridge A2 Flyers Reading & Writing Part 1](https://www.cambridgeenglish.org/Images/584855--online-teaching-a2-flyers-reading-and-writing-part-1.pdf)

---

# Story Quest (Raja Cerita)

Status: **sudah diimplementasi** (2026-09-29). Kode: `app/src/games/storyquest.ts` (mesin & Map), `app/src/games/storyquest-data.ts` (tabel tier + 6 cerita, satu-satunya tempat mengubah pembeda/cerita). Di roster namanya "Story Quest" (`key: 'storyquest'`, `/game/story-quest`). 6 markas = 6 cerita: Mia at the Park → The Lost Puppy → The Missing Kite → Rani's Science Project → Rescue on the Hill → The Time Capsule Mystery.

## Ringkasan (High-Level)

**Sebelum**: sudah ada beberapa soal per markas (1 cerita, 3–5 halaman, 1 soal per halaman), tapi **pembedanya cuma cerita makin panjang & kosakata makin sulit**. Semua 25 soal bertipe sama, "cari fakta yang tertulis", dan **21 dari 25 bisa dijawab dengan mencocokkan kata** (jawaban benar = satu-satunya opsi yang paling banyak memakai kata dari teks: "A red collar" ↔ "a red collar"). 💡 Petunjuk menyebut langsung "baca kalimat kedua".

**Sekarang**: tiap markas = 1 cerita **5 halaman = 5 soal** (sama dengan Sentence Puzzle & Memory Hunt), dan yang naik tiap markas = **jenis pemahaman** yang diuji, bentuk jawaban, dan bantuan:

| Game | Isi 1 markas | Bullet progress |
|---|---|---|
| Word Quest | 10 papan | per papan |
| Balloon Hunt | 10 kata | per kata |
| Sentence Puzzle | 5 kalimat | per kalimat |
| Memory Hunt | 5 papan | per papan |
| Sound Hunt | 10 soal | per soal |
| **Story Quest** | **5 halaman** | **per halaman** |

5 halaman (bukan 10): 1 soal Story Quest = membaca 2–4 kalimat dulu, lebih lama dari 1 soal game lain.

## Kondisi Sebelum Dirombak [F]

Skrip ukur (kata isi, tanpa kata tugas; jamak disamakan):

| Markas | Halaman | Jawaban benar = satu-satunya opsi yang berbagi kata dgn teks | Jawaban benar = opsi paling banyak berbagi kata |
|---|---|---|---|
| Pemanasan | 3 | 1/3 | 2/3 |
| Mudah | 5 | 4/5 | 4/5 |
| Sedang | 4 | 4/4 | 4/4 |
| Sulit | 4 | 2/4 | 4/4 |
| Jago | 4 | 2/4 | 3/4 |
| Legendaris | 5 | 2/5 | 4/5 |

- **Satu jenis soal di semua markas**: info tersurat ("What does Tom see?", "Where is the kite stuck?"). Soal "How does X feel?" pun jawabannya hampir tertulis ("smiles" → Happy).
- **Petunjuk menunjuk kalimat** ("Kalimat kedua bilang…") + coret 2 opsi, sama di Pemanasan & Legendaris.
- **Opsi salah cuma dinonaktifkan** sampai anak menemukan jawaban → bisa diketuk satu per satu (maks 3 salah).
- **Jumlah halaman tidak rata** (3/5/4/4/4/5).
- **Ikon**: 🐦 & 👴 (denylist build), 🦅 elang badan penuh (sampul & halaman), 🐛; ikon tidak relevan untuk jawaban abstrak (🔴 untuk "a red collar", 🤝 untuk "Tightly", 🧵 untuk "cuts the wire", 😴 untuk "Loosely").
- 🔊 Dengar (TTS opt-in) tersedia di semua markas.

## Tangga Tier (Terimplementasi) [F]

| Markas | Teks/halaman | Jenis soal (baru) | Contoh | Opsi | 🔊 Dengar | 💡 Petunjuk |
|---|---|---|---|---|---|---|
| Pemanasan | 2 kalimat | info tersurat, **jawab dengan gambar** | "Mia has a kite." → tunjuk 🪁 | gambar saja | ada | sorot kalimat bukti + coret 2 |
| Mudah | 3 kalimat | info tersurat, **pengecoh ikut disebut di teks** | "Tom gives it some water, not food." → Water (bukan Food) | gambar + teks | ada | sorot kalimat bukti + coret 2 |
| Sedang | 3 kalimat | **rujukan kata ganti** (she/he/it/"the boy" = siapa?) | "At the market, Sam meets Mrs. Rosa and Mr. Tono. She saw the kite…" → Mrs. Rosa | teks | — | sorot kalimat bukti |
| Sulit | 3 kalimat | **parafrase** (jawaban benar pakai kata lain, pengecoh pakai kata dari teks) | "nothing has come out of the soil" → "The plant has not grown." | teks | — | sorot kalimat bukti |
| Jago | 3 kalimat | **simpulkan yang tidak tertulis** (perasaan, alasan, siapa) | "…a small 'meow' from a tall tree." → A kitten | teks | — | 🔒 sampai 1x coba, sorot kalimat |
| Legendaris | 4 kalimat | **gabungkan beberapa kalimat** (hitung, lokasi, tebak kelanjutan) | "two letters… gives one letter to his teacher" → One | teks | — | 🔒 sampai 1x coba, sorot kalimat |

Berlaku di semua markas:
- **5 halaman per markas**, bullet 1–5, posisi opsi diacak tiap halaman.
- Jawaban salah = pola raja lain: kartu merah + getar + tetot + teks semangat, lalu "🔁 Coba Lagi" (halaman sama, Petunjuk yang sudah terbuka tetap) / "Lanjut ➡️" (non-punitive). Jawaban benar = nada + confetti + pujian.
- 💡 Petunjuk menyorot kalimat bukti di halaman + 1 kalimat penuntun Indonesia yang **tidak** menyebut jawaban dan tidak lagi menyebut nomor kalimat.
- Jawaban berupa kalimat (Sedang ke atas) tampil sebagai daftar 1 kolom supaya tidak terpotong.

## Implementasi [F]

- `TIER_CONFIG` (`storyquest-data.ts`): per markas `answer` (`picture`/`picture-text`/`text`), `listen`, `eliminate`, `hintGated`, `badge` (label jenis soal di atas pertanyaan).
- `StoryPage`: `lines`, `question`, `options` (`emoji` hanya di markas bergambar), `answer`, `evidence` (indeks kalimat bukti), `clue`.
- Mesin (`runStoryBookRound`): opsi diacak per halaman, kalimat bukti diberi `.is-evidence` saat 💡, 🔒 Petunjuk terbuka setelah 1x mencoba.
- **Build** (`verify-vocab-content.mjs`): tiap cerita tepat 5 halaman; 4 opsi beda; jawaban & bukti valid; clue wajib; emoji wajib di markas bergambar; denylist emoji (sampul, adegan, opsi); **anti-tebak**: jawaban benar tidak boleh jadi satu-satunya opsi yang paling banyak memakai kata dari teks halaman (cek ini langsung menangkap 2 soal saat penulisan & sudah diperbaiki).
- CSS (`public/styles.css`): `.story-line.is-evidence`, `.opt-grid.sq-list`; `.sh-badge` dipakai bersama Sound Hunt.
- Cerita: "The Lost Puppy" (Mudah), "The Missing Kite" (Sedang), "The Time Capsule Mystery" (Legendaris) dipertahankan tokohnya tapi ditulis ulang per jenis soal; Pemanasan, Sulit ("Rani's Science Project"), & Jago ("Rescue on the Hill", pengganti elang badan penuh → anak kucing) ditulis baru/dirombak.
- **Diverifikasi live** (Playwright, 390px & 1280px): keenam markas × 5 halaman dituntaskan dalam 1 sesi sampai "Semua Cerita Selesai!"; di tiap halaman 1 jawaban salah (merah + teks semangat) → Coba Lagi → Petunjuk (kalimat bukti tersorot; coret 2 opsi hanya di Pemanasan/Mudah; 🔒 di Jago/Legendaris sebelum mencoba) → jawaban benar; kartu gambar saja di Pemanasan, gambar+teks di Mudah, teks di atasnya; 🔊 cuma di Pemanasan/Mudah; halaman 5 markas terakhir = "Selesai ✅"; tanpa scroll horizontal; 0 pageerror.

## Bukti Riset per Sumbu

| Sumbu | Temuan | Dipakai di |
|---|---|---|
| **Proses membaca** | PIRLS membagi pemahaman jadi 4 proses: temukan info tersurat → simpulkan yang lugas → tafsirkan & gabungkan → evaluasi. Taksonomi Barrett: literal → reorganisasi → inferensi → evaluasi. | Urutan markas: tersurat → kata ganti → parafrase → simpulkan → gabungkan |
| **Rujukan kata ganti** | Menentukan rujukan kata ganti (anaphora) adalah keterampilan kohesi yang sulit bagi pembaca pemula & L2. Reading Achiever di app ini juga sudah punya soal "🔗 Tunjuk Rujukan" (`pembeda_level.md` § Reading). | Sedang |
| **Parafrase** | Soal yang jawabannya memakai kata sama persis dengan teks cuma menguji pencocokan kata (*lexical matching*), bukan pemahaman; soal yang baik memparafrase. | Sulit + cek anti-tebak build |
| **Pengecoh dari teks** | Pengecoh yang disebut di teks (tapi bukan jawaban) lebih plausibel & menaikkan daya beda soal (Ludewig dkk. 2023). | Mudah ("not food", "stays home") dan semua markas teks |
| **Format Cambridge** | Starters R&W: baca kalimat → tunjuk/centang gambar; Movers/Flyers: cerita + jawab/lengkapi, pilih jawaban dari beberapa kalimat. | Pemanasan (gambar), Mudah–Legendaris (cerita + opsi) |
| **Fading bantuan** | Bantuan dikurangi bertahap (lihat Word Quest); lensa CLAUDE.md: Reading yang dibacakan TTS diam-diam menguji Listening. | 🔊 cuma di 2 markas awal; coret opsi → sorot kalimat → 🔒 |

## Yang SENGAJA Tidak Dibedakan

- **Tanpa timer, nyawa, skor kecepatan.** Halaman salah tetap boleh dilewati.
- **🔊 Dengar tidak pernah auto-play** (Reading, bukan Listening) — cuma tombol di Pemanasan/Mudah.
- **4 opsi di semua markas.**
- **Unlock markas "cukup pernah dituntaskan"**, progres tidak disimpan, tidak ditautkan ke `LevelKey` anak.

## Gotcha

- Menulis soal baru: jawaban benar **jangan** menyalin kata dari kalimat bukti; pengecoh justru boleh memakai kata dari teks (build menolak jawaban yang jadi satu-satunya opsi paling mirip teks).
- Soal Sedang (kata ganti): teks harus menyebut ≥2 orang/benda supaya "she/he/it" memang perlu dipecahkan (contoh perbaikan: "Mrs. Rosa and Mr. Tono … She saw the kite, but he did not").
- Soal Jago: jawabannya **tidak boleh tertulis** di teks, tapi harus bisa disimpulkan dengan pasti (hindari pengecoh yang juga masuk akal, mis. "Hungry" untuk anak kucing yang menangis — diganti "Proud"/"Bored").
- Soal Legendaris hitungan: angka di teks & di opsi harus ditulis sama (kata "one/two/three"), supaya opsi salah juga memakai angka dari teks.
- Opsi markas teks **tanpa emoji** — jawaban berupa kalimat tidak punya ikon yang relevan (aturan Ikon Wajib Relevan).
- `clue` jangan menyebut nomor kalimat — 💡 sudah menyorot kalimatnya.

## Batasan Riset (Jujur)

- Tangga PIRLS/Barrett disusun untuk bahasa ibu; untuk anak Indonesia yang membaca bahasa Inggris, urutan kesulitan kata ganti vs parafrase belum diukur langsung.
- Cek anti-tebak memakai heuristik kata sederhana (tanpa sinonim/lema), jadi lolos cek ≠ pasti tidak bisa ditebak; tetap perlu dibaca manual.
- 1 cerita per markas → mengulang markas = cerita yang sama (urutan opsi saja yang berubah). Menambah cerita kedua per markas bisa jadi langkah berikutnya.
- Tangga belum diuji ke anak.

## Sumber

- Kode: `app/src/games/storyquest.ts`, `app/src/games/storyquest-data.ts`, `app/scripts/verify-vocab-content.mjs`
- [PIRLS 2021 Assessment Framework — Processes of Comprehension](https://pirls2021.org/frameworks/home/reading-assessment-framework/processes-of-comprehension/index.html)
- [The Barrett Taxonomy of Cognitive and Affective Dimensions of Reading](http://www.joebyrne.net/Curriculum/barrett.pdf)
- [Ludewig dkk. (2023), Distractor Plausibility in Synonym-Based Vocabulary Tests](https://journals.sagepub.com/doi/10.1177/07342829231167892)
- [Cambridge Pre A1 Starters, A1 Movers & A2 Flyers Sample Papers (2018)](https://www.cambridgeenglish.org/images/young-learners-sample-papers-2018-vol1.pdf)
- [Cambridge A2 Flyers Reading & Writing Part 1](https://www.cambridgeenglish.org/Images/584855--online-teaching-a2-flyers-reading-and-writing-part-1.pdf)

---

# Raja Kelompok

Status: **sudah diimplementasi — Opsi B** (2026-09-30, lihat "Implementasi" di bawah; bagian "Kondisi Sekarang" & "Temuan Masalah" = kondisi SEBELUM dirombak). Kode: `app/src/games/kelompok.ts` (mesin & Map), `app/src/games/kelompok-data.ts` (tabel tier + bank, satu-satunya tempat mengubah pembeda/kata). Dulu: `runKelompokkan`/`drawSortQuestion` di `games/vocabulary.ts` (SUDAH DIHAPUS). `key: 'kelompok'`, `/game/raja-kelompok`, ikon 🧺 "Kelompokkan katanya".

## Ringkasan (High-Level)

**Verdict: Raja Kelompok belum sejajar dengan 6 game lain, dan tugasnya belum menguji bahasa Inggris.**

1. **Tidak punya markas & tidak punya pembeda.** Game ini langsung 1 aktivitas; tidak ada Map 6 markas, tidak ada tingkat.
2. **Cuma 1 topik yang bisa dipakai** (Little Stars "Bentuk (Shapes)", pilot), jadi **game ini tersembunyi untuk 5 dari 6 level** (roster memfilternya kalau level anak tidak punya topik "sortable").
3. **Keputusannya tidak butuh bahasa Inggris.** Anak melihat gambar bentuk, lalu memilih keranjang berlabel **Indonesia** ("Bundar"/"Bersudut"). Bentuk bulat atau bersudut bisa dinilai dari gambarnya saja; kata Inggris ("Circle") cuma ditampilkan & dibacakan, tidak pernah dipakai untuk menjawab.

## Kondisi Sebelum Dirombak [F]

- **Sumber soal**: topik Vocab level anak yang punya `sortBaskets` DAN item ber-`group` (`isSortableTopic`). Saat ini hanya `bentuk` (Little Stars): 8 dari 10 kata diberi kelompok (Cross & Arrow sengaja dilepas).
- **1 sesi = 8 soal** biner (2 keranjang), urutan dari plan yang disimpan (`ensureTantanganPlan`), jadi urutannya sama tiap kali dimainkan ulang.
- **Layar soal**: gambar bentuk + kata Inggris tertulis + 🔊 dibacakan otomatis + 2 tombol teks Indonesia.
- **Kelompok yang ambigu**: ❤️ Heart & 🌙 Crescent dimasukkan ke **"Bundar"**, padahal hati punya ujung lancip di bawah & bulan sabit punya 2 ujung lancip. Anak yang menjawab "Bersudut" dengan alasan masuk akal dianggap salah.
- **Tebakan 50%** — 2 pilihan, tanpa bantuan (tidak ada 💡).
- **Progres ikut tersimpan di data skill Vocabulary** (`markSlotAnswered('vocabulary', 'bentuk', 'tantangan-kelompok', …)`), beda dari 6 game lain yang progresnya hanya hidup selama 1 sesi. Section ini tidak ikut dihitung ke persen topik (`vocabTopicPercent`), jadi tidak merusak Menu Belajar, tapi datanya bercampur dengan data materi.
- **Melanggar 2 aturan wajib "Selesai ✅"** (CLAUDE.md): bullet progress bisa dilompat (`wireQuizNav`), tetapi tombol "Selesai ✅" dihitung dari posisi (`round === items.length - 1`) dan "Lanjut" memakai `round += 1` polos. Anak yang lompat ke soal terakhir dulu melihat "Selesai ✅" padahal soal lain belum dikerjakan (harusnya `allSlotsDone` + `nextUnfinishedRound`).
- **Riwayat**: mekanik "Kelompokkan" dulu juga dipakai di Kenalan 🎮 Main topik Bentuk, lalu **diganti atas permintaan user** setelah 2 laporan "soal & jawaban tidak match" (komentar `vocabulary.ts` di atas `drawPictureWordQuestion`). Game Hub masih memakai mekanik lama itu.

## Temuan Masalah (Urut Prioritas)

1. **Tidak menguji bahasa Inggris** — melanggar semangat CLAUDE.md "Soal Tidak Boleh Bisa Ditebak Tanpa Paham": anak bisa benar 100% tanpa mengerti satu kata Inggris pun.
2. **Tersembunyi di 5 dari 6 level** — satu-satunya Raja yang tidak bisa dimainkan semua anak.
3. **Kelompok ambigu** (Heart, Crescent) → jawaban masuk akal dianggap salah.
4. **Tidak ada markas, pembeda, atau bantuan** — tidak ikut konsep Game Hub.
5. **Bug "Selesai ✅" prematur & "Lanjut" yang bisa melewati soal** (aturan wajib).
6. **Kategorisasi bentuk bulat/bersudut sulit diperluas** — sudah dicoba di Kenalan dan ditolak user; menambah `sortBaskets` ke topik lain level lain (warna? fungsi?) berisiko kategori yang terasa dipaksakan.

## Bukti Riset per Sumbu

| Sumbu | Temuan | Konsekuensi |
|---|---|---|
| **Kategorisasi dalam belajar kosakata** | Kategorisasi/mengelompokkan kata adalah kategori mekanik yang luas dipakai kompetitor tapi belum dimiliki app ini (`materi/game.md` §4 kandidat #13). Mengelompokkan menurut makna melatih jaringan makna kata (semantic mapping). | Mekaniknya layak dipertahankan, asal keputusan mengelompokkan **bergantung pada arti kata Inggris**. |
| **Interferensi semantik** | Kata satu kategori yang dipelajari bersamaan saling mengganggu (Tinkham 1997). | Keranjang harus kategori yang **jelas beda** (Animals vs Food), jangan kategori yang saling tumpang tindih. |
| **Kategori yang jelas untuk anak** | Anak kecil mengelompokkan benda sehari-hari (hewan, makanan, pakaian) jauh sebelum kategori abstrak (bentuk geometri, sifat). Label kategori bentuk (bundar/bersudut) bergantung persepsi & rawan ambigu. | Ganti kategori geometri dengan kategori benda sehari-hari yang tidak ambigu. |
| **Format Cambridge** | Starters–Flyers menguji pengetahuan kata lewat gambar, definisi, & kategori kata (wordlist Cambridge sendiri disusun per kategori: Animals, Food, Clothes, Places, …). | Bank bisa disusun per kategori wordlist Cambridge, naik Starters → Movers → Flyers. |
| **Pola Game Hub** | 6 Raja lain sudah memakai Map 6 markas + beberapa soal per markas + 1 tantangan baru per markas. | Raja Kelompok sebaiknya ikut pola yang sama supaya muncul di semua level. |

## Usulan (Riset Awal) [U → Opsi B sudah diimplementasi]

**Opsi A — perbaiki kecil, tetap khusus Little Stars.** Pindahkan Heart & Crescent keluar dari kelompok (atau ganti dengan bentuk yang tidak ambigu), perbaiki bug "Selesai ✅"/"Lanjut", tambah 💡. Masalah #1, #2, #4 tetap ada.

**Opsi B (rekomendasi) — jadikan game penuh seperti Raja lain.** Bank sendiri (`kelompok-data.ts`, dicek build), Map 6 markas, **10 soal per markas**, tidak lagi bergantung pada topik Vocab (jadi muncul di semua level), progres per sesi seperti game lain. Keputusan mengelompokkan **harus** memakai arti kata Inggris:

| Markas | Yang dikelompokkan | Keranjang | Tantangan baru | 💡 Bantuan |
|---|---|---|---|---|
| Pemanasan | gambar + kata Inggris dibacakan 🔊 | 2, gambar + label Inggris (🐶 Animals / 🍎 Food) | kenal nama kategori Inggris | coret 1 keranjang |
| Mudah | **kata Inggris tertulis, tanpa gambar** | 2, gambar + label Inggris | baca kata sendiri untuk tahu kelompoknya | gambar kata muncul |
| Sedang | kata Inggris tertulis | **3** keranjang (Animals / Food / Clothes) | pilihan lebih banyak | gambar kata muncul |
| Sulit | kata Inggris tertulis | 3, **label Inggris saja tanpa ikon**, kategori tempat (Kitchen / Bathroom / Classroom) | kategori tempat, bukan jenis benda | arti Indonesia kata |
| Jago | **🔊 kata didengar saja** | 3, label Inggris | kenali kata & kelompoknya dari suara | tulisan kata muncul |
| Legendaris | **"Odd One Out"**: 4 kata Inggris, 3 satu kelompok, tap yang BUKAN | — | temukan sendiri kelompoknya (Flyers-style) | nama kelompoknya muncul |

Catatan Opsi B:
- Bentuk Word Quest Sulit (1 kategori/papan), Balloon Hunt Sulit (4 balon sekelompok), dan Sound Hunt Mudah (4 kartu sekelompok) memakai kategori sebagai **pengecoh**; Raja Kelompok memakai kategori sebagai **tugasnya sendiri** (menamai/memilih kelompok), jadi tidak tumpang tindih.
- Topik Vocab `bentuk` tetap punya `sortBaskets` untuk riwayat, tapi tidak lagi dipakai Game Hub (atau `sortBaskets` dihapus bersama `runKelompokkan`).
- Kategori wajib tidak ambigu: satu kata hanya cocok ke satu keranjang (hindari "egg" di Food vs Animals, "tomato" di Fruit vs Vegetable).

## Implementasi (2026-09-30) [F]

User memilih **Opsi B**, Legendaris = **"Odd One Out"**, mekanik lama `runKelompokkan` + `drawSortQuestion` **dihapus** (`sortBaskets` di topik Vocab `bentuk` & `isSortableTopic` tetap, masih dipakai Kenalan 🎮 Main topik itu).

| Markas | Yang dikelompokkan | Keranjang | 💡 Bantuan |
|---|---|---|---|
| Pemanasan (Halaman Keranjang) | gambar + kata, dibacakan 🔊 | 2, ikon + label Inggris (Animals/Food/Clothes/Vehicles) | arti Indonesia nama keranjang (+ nama keranjang dibacakan) |
| Mudah (Lumbung Desa) | **kata Inggris tertulis, tanpa gambar** | 2, ikon + label Inggris | gambar katanya muncul |
| Sedang (Pasar Rakyat) | kata Inggris tertulis | **3** keranjang | gambar katanya muncul |
| Sulit (Rumah Besar) | kata Inggris tertulis | 3 **tempat** (Kitchen/Bathroom/Classroom/Bedroom), ikon 🧺 polos yang sama | arti Indonesia kata |
| Jago (Menara Gema) | **🔊 kata didengar saja** | 3, ikon + label Inggris | 🔒 sampai 1x coba, tulisan kata muncul |
| Legendaris (Istana Teka-teki) | **Odd One Out**: 4 kata (3 satu kelompok + 1 dari kelompok lain; kelompok Colors/Numbers/Days/Feelings/Jobs/Weather/Animals/Vehicles) | — | 🔒 sampai 1x coba, nama kelompok 3 kata lainnya |

- **10 soal per markas**, bullet progress statis (tidak bisa dilompat → bug "Selesai ✅" prematur hilang), jawaban salah = merah + getar + tetot → "🔁 Coba Lagi" (bantuan tetap terbuka) / "Lanjut ➡️".
- **Muncul di semua level** — filter roster (`renderGame`) & Rapor (`gameRosterForRapor`) dihapus.
- **Ikut aturan pop up keluar** (CLAUDE.md): `setGameRoundActive(false)` di Map/selesai, `true` + `renderMap` saat masuk markas.
- Keranjang berlabel **Inggris** (bukan lagi "Bundar/Bersudut"); ikon keranjang bukan ikon salah satu kata (🐾 🍴 👚 🛞) supaya tidak bisa dijawab dengan mencocokkan gambar.
- "Odd One Out" tidak memasangkan Weather & Feelings (sunny/happy bisa terasa mirip).
- **Build** (`verify-vocab-content.mjs`): kata tidak boleh ada di 2 kelompok; nama & arti kelompok wajib; tiap kelompok ≥4 kata; emoji wajib & lolos denylist di markas bergambar; ikon keranjang ≠ ikon kata mana pun.
- **Diverifikasi live** (Playwright, 390px & 1280px): Raja Kelompok tampil di daftar game akun Explorer (dulu tersembunyi); keenam markas × 10 soal dituntaskan dalam 1 sesi sampai "Semua Keranjang Rapi!"; di tiap markas 1 jawaban salah → Coba Lagi → 💡 (arti keranjang / gambar / arti kata / tulisan / nama kelompok sesuai tier; 🔒 di Jago & Legendaris sebelum mencoba); soal ke-10 markas terakhir = "Selesai ✅"; tanpa scroll horizontal; 0 pageerror. Label keranjang sempat tampil 🧺 ganda & terpotong di Sulit → diperbaiki.

## Keputusan yang Diambil (dulu Pertanyaan Terbuka)

1. **Opsi B** — game penuh untuk semua level.
2. Legendaris = **Odd One Out**.
3. `runKelompokkan` + `drawSortQuestion` **dihapus**; `sortBaskets` topik `bentuk` dibiarkan (dipakai `isSortableTopic` di Kenalan).

## Batasan Riset (Jujur)

- Belum ada studi khusus game "kelompokkan kata" untuk anak Indonesia; rekomendasi disusun dari riset kosakata umum, pola Game Hub app ini, dan pengalaman revisi Kenalan Bentuk sebelumnya.
- Kategori tempat (Sulit) memakai kebiasaan umum (sabun di kamar mandi, pensil di kelas); beberapa benda bisa ada di lebih dari 1 ruangan di rumah tertentu — dipilih yang paling khas.
- Tangga belum diuji ke anak.

## Sumber

- Kode: `app/src/games/kelompok.ts`, `app/src/games/kelompok-data.ts`, `app/scripts/verify-vocab-content.mjs`, `app/src/app.ts` (`runRajaRound`); versi lama: `app/src/games/vocabulary.ts` (dihapus), `app/src/content.ts` (topik `bentuk`)
- `materi/game.md` §4 (#13 Urutkan/Kelompokkan) & §7
- [Tinkham (1997), The effects of semantic and thematic clustering on L2 vocabulary learning](https://journals.sagepub.com/doi/10.1191/026765897672376469)
- [Cambridge Pre A1 Starters, A1 Movers & A2 Flyers Wordlists (disusun per kategori)](https://www.cambridgeenglish.org/images/149681-yle-flyers-word-list.pdf)
