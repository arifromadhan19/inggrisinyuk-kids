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

Status: **riset saja, belum diimplementasi** (2026-09-25). Kode: `app/src/games/balloonpop.ts`. Di roster namanya "Balloon Hunt" (`key: 'balon'`); "Taman Balon" = nama tempat markas ke-2, dipakai user untuk menyebut game ini secara keseluruhan.

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

## Pertanyaan Terbuka (Butuh Keputusan User)

1. Legendaris: **kalimat rumpang** atau **letupkan semua balon satu kategori**?
2. Perlukah markas awal disesuaikan dengan level anak (mis. Little Stars otomatis mulai & berhenti di Pemanasan–Mudah), atau tetap sama untuk semua anak seperti game lain?
3. Nilai kecepatan & ukuran di tabel = usulan; perlu dicoba langsung di HP sebelum dikunci.

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
