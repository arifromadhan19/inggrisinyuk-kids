# Materi Game — Analisis Konsep Mini-Game, Riset Kompetitor/Lembaga, & Tangga Kesulitan per Level

Status: **DOKUMEN ANALISIS, BELUM ADA IMPLEMENTASI KODE/KONTEN DARI SESI INI.** Permintaan user eksplisit "coba deep analysis dulu dan simpan di materi/game.md" — beda dari 5 dokumen materi lain (`vocab.md`/`listening.md`/`reading.md`/`speaking.md`/`grammar.md`) yang isinya riset **per skill** untuk authoring **konten**, dokumen ini riset **lintas skill** tentang **mekanik/konsep mini-game itu sendiri** — dasar pertimbangan sebelum menambah/mengubah mekanik game di skill manapun ke depannya.
Terakhir diupdate: 2026-08-27

> Dokumen ini fokus pada **konsep & mekanik mini-game**, bukan konten kata/kalimat. Konteks wajib dibaca dulu: [CLAUDE.md](../CLAUDE.md) (filter kid-friendly wajib, aturan "setiap percobaan direspons", keputusan terkunci soal gamifikasi), [PRD.md](../PRD.md) §3 (sistem level & usia), §4.3–§4.6 (loop aktivitas & prinsip gamifikasi), §12 (Peta Level, Tantangan Bos, Game Hub, XP), §13 (Progresmu — streak/akurasi non-punitive). Dokumen sejenis per-skill: [materi/vocab.md](vocab.md), [materi/listening.md](listening.md), [materi/reading.md](reading.md), [materi/speaking.md](speaking.md), [materi/grammar.md](grammar.md).

---

> ## 🔒 Filter Kid-Friendly Berlaku Penuh di Dokumen Ini
>
> Semua referensi di bawah (Duolingo, Lingokids, Khan Academy Kids, ABCmouse, Reading Eggs, Prodigy Math, Kahoot, Osmo, Cambridge YLE, LIA/EF/Kumon/Wall Street English, DAN dokumen game dewasa `inggrisinyuk/prd_user_game.md` "Anglora") **tidak semuanya dirancang untuk anak, dan sebagian (Duolingo dewasa, Anglora) eksplisit memakai mekanik yang sudah lama ditolak produk ini** (coin, leaderboard, timer, loot box/gacha, status "kalah"). Yang diambil murni **struktur mekanik** (bagaimana sebuah tugas dikemas jadi permainan) — nada, tekanan, dan konsekuensi kegagalan SELALU disaring ulang lewat pertanyaan "apakah ini masuk akal & aman secara psikologis untuk anak 3–13 tahun?", bukan diasumsikan cocok karena terbukti engaging di produk lain (CLAUDE.md §1, PRD §4.6/§13.2).

---

## 0. Kenapa Dokumen Ini Ada — Beda dari 5 Dokumen Materi Lain

5 dokumen `materi/*.md` lain menjawab **"kata/kalimat apa yang tepat untuk level X?"** — jawabannya konten (wordlist, kalimat, distraktor). Dokumen ini menjawab pertanyaan yang berbeda kategorinya: **"jenis permainan/interaksi apa yang tepat untuk melatih skill ini, di level usia ini, dan kenapa?"** — jawabannya bukan konten, tapi **pola mekanik** (mis. "cocokkan gambar", "susun huruf", "putar roda", "kumpulkan stiker di peta").

Dua pertanyaan ini saling melengkapi tapi tidak sama: app ini **sudah punya banyak mekanik jalan** (Kenalan/Latihan Inti/Tantangan tiap skill, Tantangan Bos, Peta Level, XP, streak — semua terdokumentasi detail di CLAUDE.md) yang dibangun **bertahap per sesi kebutuhan konten**, bukan dari 1 riset menyeluruh "apa saja jenis game yang ada, dan mana yang cocok di mana". Permintaan user sesi ini mengisi kekosongan itu: **audit menyeluruh dulu** (apa yang sudah dipakai, apa yang belum, apa yang harus dihindari) sebelum sesi berikutnya (kalau ada) menambah mekanik baru — supaya mekanik baru itu pilihan sadar berdasar riset, bukan tebakan.

**Dua sumber informasi yang disatukan di sini**:
1. **Riset eksternal** (kompetitor & lembaga, §3) — jenis game apa yang mereka pakai, kenapa, untuk usia berapa.
2. **Audit internal** (§2) — jenis game apa yang app ini SUDAH punya (dari CLAUDE.md, sumber kebenaran teknis), supaya rekomendasi di §7 tidak mengusulkan ulang sesuatu yang sudah ada dengan nama beda.

---

## 1. Ringkasan (TL;DR)

- **App ini sudah py keragaman mekanik game yang cukup besar** (§2) — bukan mulai dari nol. 5 skill × 3–4 format tiap skill (lihat CLAUDE.md "Berdampingan" tiap skill) menghasilkan >15 pola task-shape berbeda yang sudah battle-tested & live: tap-tunjuk, cocok-gambar, eja-huruf, susun-kalimat, dengar-pilih, dengar-susun (dikte), benar/salah, kartu-kontras 2-arah, ucap-skor-proporsional, wawancara-bergilir, transformasi-kalimat-MCQ, & mashup bos.
- **Riset kompetitor (§3.1)** — Duolingo (dewasa & ABC/Kids), Lingokids, Khan Academy Kids, ABCmouse, Reading Eggs, Prodigy Math, Kahoot, Osmo — mengonfirmasi pola yang sama sudah dipakai luas (matching, drag-drop, memory, tap-1:1, dikte/tracing), TAPI juga mengungkap mekanik yang secara eksplisit **harus ditolak** (coin/tiket-belanja ABCmouse, leaderboard & liga Duolingo dewasa, hearts/nyawa Duolingo dewasa, loot box/peti harta acak Anglora, timer countdown Kahoot) — semua sudah konsisten dengan larangan yang SUDAH dikunci PRD §4.6/§13.2, riset ini memperkuat *kenapa* keputusan itu benar (§5), bukan mengubahnya.
- **Riset lembaga (§3.2)** — LIA (TPR + roleplay + storytelling), Cambridge YLE (tugas "listen & colour"/"listen & connect" resmi ujian anak, sengaja tanpa timer stres), Kumon (worksheet "Lihat-Dengar-Ucap" bertahap) — semuanya menegaskan progresi **task-shape naik bertahap sesuai usia**, bukan 1 bentuk game diulang selamanya, prinsip yang app ini SUDAH terapkan lewat "ladder" per skill (Listening 4 format, Speaking 4 format, dst, CLAUDE.md).
- **Ada 5 kategori mekanik yang RISET EKSTERNAL pakai luas tapi APP INI BELUM PERNAH PAKAI SAMA SEKALI** (§4, ditandai GAP): (1) **Urutkan/Kelompokkan** (sorting ke ≥2 kategori sekaligus, beda dari Benar/Salah biner Reading), (2) **Ingat & Buka** (memory/concentration flip-card, beda dari cocok-langsung Vocab/Reading), (3) **Roda Acak/Randomizer** (spin-wheel, non-kompetitif — sekadar pemilih giliran/topik, BUKAN mekanik hadiah), (4) **Cari & Temukan** (hidden-object/treasure-hunt, tunjuk 1 objek di antara banyak distraktor visual), (5) **Rangkai Petunjuk Berantai** (escape-room-lite, beberapa mini-tugas berurutan bermuara ke 1 jawaban akhir — kandidat paling besar/kompleks, cocok level atas saja).
- **Tangga level (§6, inti permintaan user)**: kompleksitas mekanik SEHARUSNYA naik 2 sumbu seiring level — (a) **jumlah langkah kognitif** (1 aksi tunggal di Little Stars → multi-step terangkai di Trailblazer) dan (b) **abstraksi tugas** (tunjuk-benda konkret → nilai kebenaran → transformasi/opini abstrak) — bukan cuma "kata makin susah" (itu urusan tier wordlist, sudah dikerjakan §materi lain). App ini SUDAH mengikuti pola ini secara implisit (mis. Reading beda format tiap level, Grammar beda format tiap level) — dokumen ini yang PERTAMA KALI menyatukannya jadi 1 prinsip eksplisit lintas skill, supaya sesi mekanik baru berikutnya (skill manapun) otomatis konsisten.
- **Tidak ada kode/konten yang diubah sesi ini** — murni riset+analisis sesuai permintaan ("dulu"). §7 berisi kandidat konkret buat sesi implementasi berikutnya, tapi menunggu keputusan eksplisit user (skill/level mana duluan), konsisten pola semua dokumen materi lain yang selalu menunggu "lanjutkan ke level X" sebelum authoring.

---

## 2. Inventaris Mekanik Game yang SUDAH Dibangun (Audit Internal)

Ditarik langsung dari CLAUDE.md (sumber kebenaran teknis proyek ini) — bukan re-derive dari kode, supaya konsisten dengan dokumentasi yang sudah diverifikasi tiap sesi sebelumnya.

### 2.1 Per skill × format (task-shape, bukan konten)

| Skill | Format | Kenalan | Latihan Inti | Tantangan |
|---|---|---|---|---|
| **Vocabulary** (1 format, semua level) | `VocabItem` | 🔊 dengar + 🎤 ucap-skor + 🎮 mini-game (hitung-gambar khusus topik Angka; "Dengar & Tunjuk" gambar-emoji utk topik lain) | 10 soal, 4 tipe berselang (`hear`/`toEn`/`toId`/`sentence`), kartu jawaban gambar+teks+lencana A/B/C/D | 3 tab @5 soal: **Eja Kata** (susun huruf, hint 60% acak posisi), **Susun Kalimat** (susun kata dari terjemahan), **Penggunaan** (ucap-skor mic) |
| **Listening** format LAMA (Explorer/Adventurer) | `ListeningTopic` | daftar adegan+teks | dengar kalimat → pilih gambar/opsi | dengar mini-dialog → jawab 1 pertanyaan |
| **Listening** format BARU (Little Stars/Starter) | `ListeningSentenceTopic` | "Main · Dengar & Jawab" (kartu 2×2 per kalimat) | mix 5:5 **"Dengar & Jawab"** (MCQ) + **"Benar atau Salah?"** (2 tombol biner) | **"Dengar & Susun"** — dikte: dengar kalimat, susun dari word bank (teks Indonesia SENGAJA disembunyikan) |
| **Listening** format KETIGA (Achiever) | `ListeningNoteTopic` | (reuse format BARU) | (reuse format BARU) | **"Lengkapi Catatan"** — isi 3–4 gap berurutan dari 1 short-dialogue, tiap gap MCQ tap |
| **Listening** format KEEMPAT (Trailblazer) | `ListeningDialogueTopic` | (reuse format BARU) | (reuse format BARU) | **"Dengar & Simpulkan"** — dialog 2-tokoh 6–8 baris → 3 pertanyaan inferensi (gist→sikap→dugaan tindakan) |
| **Reading** format LAMA (Adventurer/Achiever/Trailblazer) | `ReadingTopic` | 🔊🎤🎮 per adegan + mini "Susun Kalimat" dari kalimat pertama | quiz-dot, "💡 Petunjuk" ungkap terjemahan, MCQ silent-reading | pool "beberapa cerita mini", sama shape tapi cerita beda |
| **Reading** format KEDUA "Baca Kata" (Little Stars/Starter) | `ReadingWordTopic` | 🔊🎤🎮 per kata | **"Baca & Tunjuk"** — kata tercetak → pilih GAMBAR (emoji-only, TANPA teks) | **"Lihat & Baca"** — ARAH DIBALIK: gambar → pilih KATA TERCETAK dari 4 opsi teks |
| **Reading** format KETIGA "Baca & Nilai" (Explorer) | `ReadingCheckTopic` | daftar kalimat, silent | **"Benar atau Salah?"** — gambar+1 kalimat (acak trueSentence/falseSentence) | **"Baca & Temukan"** — ARAH DIBALIK: kalimat SAJA → pilih GAMBAR yang cocok |
| **Speaking** format LAMA (Explorer/Adventurer/Achiever) | `SpeakingTopic` | 🔊 contoh | **"Ucapkan & Cek"** — ucap-skor proporsional | **"Mini-Roleplay"** — 2–3 giliran tanya-jawab bebas |
| **Speaking** format KEDUA (Little Stars/Starter) | `SpeakingPhraseTopic` | 🔊🎤 + 🎮 "Dengar & Tunjuk" | **"Tirukan Ucapannya!"** — IMITATE, echo penuh | **"Sebutkan Sendiri!"** — RECALL, gambar saja tanpa teks/audio default |
| **Speaking** format KETIGA (Trailblazer) | `SpeakingInterviewTopic` | daftar giliran tanya-jawab "Bima" (peer fiktif) | jawaban Bima auto-diputar dulu (scaffold penuh) | Bima TIDAK auto-diputar (jawab independen dulu), petunjuk tersedia |
| **Speaking** format KEEMPAT (pilot Explorer, 1 topik) | `SpeakingStoryTopic` | 🔊🎤🎮 per cerita | **"Baca & Jawab"** — jawaban SELALU kelihatan (echo) | **"Cerita & Jawab Sendiri"** — jawaban disembunyikan, comprehension via SUARA |
| **Grammar** format LAMA (Explorer/Adventurer/Achiever) | `GrammarTopic` | daftar contoh+baca | susun kata dari scramble | lengkapi kalimat (fill, auto-advance — belum diredesain) |
| **Grammar** format KEDUA (Little Stars/Starter) | `GrammarPatternTopic` | 🔊🎤🎮 per kata, `contrastVisual` 7 varian | **"Dengar & Tunjuk"** — audio → kartu kontras | **"Lihat & Dengar, Pilih yang Pas"** — ARAH DIBALIK, PREVIEW-lalu-COMMIT (tap = pratinjau, tombol terpisah = kunci jawaban) |
| **Grammar** format KETIGA (Trailblazer) | `GrammarTransformTopic` | daftar kutipan+hasil transformasi | **"Ubah Jadi Reported Speech"** — MCQ 4 opsi | **"Siapa Bilang Apa?"** — ARAH DIBALIK, tebak kutipan asli |
| **Lintas-skill** | Tantangan Bos "Raja X" | — | — | mashup ~8 ronde ditarik dari SEMUA topik level itu, hardcoded, retry unlimited |
| **Lintas-skill** | Game Hub (main bebas) | — | replay bebas mini-game yang sudah dibuka, +3 XP/ronde, tidak buka level | — |

### 2.2 Kategori mekanik universal yang SUDAH dipakai (diringkas dari tabel di atas)

1. **Tap-tunjuk langsung** (audio/teks/gambar → pilih 1 dari beberapa opsi) — dipakai HAMPIR di semua Latihan Inti.
2. **Cocokkan gambar↔kata↔suara** (2 arah, kadang dibalik sengaja) — Vocab Kenalan, Reading Baca Kata, Reading Baca & Nilai, Grammar Pattern.
3. **Eja/rakit huruf** (anagram huruf → kata) — Vocab Tantangan.
4. **Susun kata jadi kalimat** (word bank → kalimat, kadang dari dengar/dikte bukan baca) — Vocab, Listening dikte, Reading Kenalan.
5. **Benar/Salah biner** — Listening, Reading.
6. **Kartu kontras 2-opsi + arah dibalik** — Grammar Pattern, Reading Baca & Nilai/Baca Kata (pola "ladder 2-arah" ini dipakai berulang, jadi salah satu identitas desain app ini).
7. **Ucap & skor proporsional (mic)** — semua skill yang punya Speaking-adjacent.
8. **Wawancara/dialog bergilir dgn peer fiktif** — Speaking Interview (Trailblazer).
9. **Transformasi kalimat MCQ + arah dibalik** — Grammar Transform (Trailblazer).
10. **Note-completion (isi form dari mendengar)** — Listening (Achiever).
11. **Inferensi multi-pertanyaan dari 1 stimulus panjang** — Listening Dialogue (Trailblazer).
12. **Mashup multi-ronde lintas-topik (boss battle)** — Tantangan Bos, semua level.

**Observasi kunci**: app ini SUDAH konsisten menerapkan 1 prinsip desain tanpa pernah menyebutnya eksplisit — **"ladder 2-arah"** (kerjakan tugas A→B, lalu di tahap lain B→A) muncul di Grammar Pattern, Reading Baca Kata, Reading Baca & Nilai, Grammar Transform. Prinsip ini VALID secara pedagogis (2 arah = 2 sirkuit kognitif beda, comprehension vs production/recall) dan konsisten prinsip "task-shape harus beda tiap tahap" yang sudah dikunci CLAUDE.md ("Kalimat Soal ... Tidak Boleh 100% Sama") — dokumen ini menamainya eksplisit supaya sesi mekanik baru berikutnya sadar pola ini dan mempertimbangkan memakainya lagi kalau relevan.

---

## 3. Riset Eksternal

### 3.1 Aplikasi Kompetitor Anak

| App | Usia | Mekanik utama | Kid-friendly? Apa yang DIAMBIL vs DIHINDARI |
|---|---|---|---|
| **Duolingo** (dewasa, referensi umum) | Remaja–dewasa | XP, liga/leaderboard mingguan, **hearts (nyawa terbatas)**, streak+streak-freeze, "Friend Streak" sosial | ❌ Hearts (bisa "habis" → jelas mekanik gagal/hukuman), ❌ leaderboard/liga (kecemasan sosial, DILARANG PRD §4.6/§13). ✅ XP sebagai metrik tunggal yang menyatukan sistem (app ini SUDAH pakai versi non-punitive-nya, PRD §12.4) — cuma naik, tidak bisa berkurang. ✅ Streak dgn "freeze"/pengampunan (app ini SUDAH adaptasi jadi "1 hari pelindung", PRD §13.1) |
| **Duolingo ABC** (anak 3–8, literasi) | 3–8 th | Tap/drag/dengar/ucap, tracing huruf, STT utk baca huruf/kata nyaring, peta kota sbg progres visual, unlock buku sbg reward | ✅ SANGAT selaras — **tanpa monetisasi, tanpa paywall, tanpa iklan** dikonfirmasi riset; peta kota = versi lain dari Peta Level app ini. ✅ Validasi independen: mekanik tap-drag-dengar-ucap-eja app ini (Vocab/Reading Kenalan) sudah sejalan pola literasi awal yang sama |
| **Lingokids** | 2–8 th | 4000+ mini-game lintas 12 domain skill (bukan cuma bahasa), termasuk Puzzle Path, tracing, coloring, gerak/yoga | ✅ Validasi: keragaman JENIS mini-game (bukan cuma kuis) itu sendiri baik utk retensi minat anak — mendukung §4/§7 (perlu variasi task-shape, bukan 1 bentuk diulang) |
| **Khan Academy Kids** | 2–7 th | Tap 1:1 correspondence, drag-drop (masukkan buah ke blender), stiker tempel bebas, **TANPA timer/tekanan/badge kompetitif** | ✅ SANGAT selaras — riset eksplisit sebut app ini "salah satu dari sedikit app literasi awal yang meraih engagement tinggi TANPA timer, tekanan, atau badge" dan motivasi utamanya "kepuasan internal menguasai sesuatu", bukan reward eksternal — filosofi PERSIS PRD §4.5/§4.6 |
| **ABCmouse** | 2–8 th | "Tiket" didapat tiap aktivitas → dibelanjakan di toko virtual (aksesori avatar/peliharaan) | ❌ Ini ekonomi coin berkedok "tiket" — DILARANG PRD §4.6 ("hindari framing mata uang ke anak"), TIDAK boleh diadopsi dalam bentuk apa pun termasuk rebranding istilah |
| **Reading Eggs** | 3–13 th | Stiker ditempel ke PETA (bukan dibelanjakan) sbg penanda progres, unlock buku/game baru (bukan beli) | ✅ Ini justru VALIDASI pola stiker-di-peta app ini (Peta Level + bintang) — "unlock" sbg reward (bukan "beli") juga konsisten prinsip non-ekonomi |
| **Prodigy Math Game** | 6–13 th | "Battle" turn-based lawan monster: jawab benar = serang, jawab salah = **TIDAK dihukum, cuma tidak maju** (bukan kalah/nyawa berkurang) | ✅ Validasi kuat utk mekanik "Tantangan Bos" app ini (framing pertarungan ringan) — konfirmasi independen bahwa "battle" framing BISA non-punitive kalau didesain sengaja begitu (jawab salah = giliran lewat, bukan HP berkurang) |
| **Osmo** (tangible play, iPad+fisik) | 3–10 th | "Embodied learning" — hubungkan aksi fisik nyata (susun balok huruf, gambar tangan) ke aksi digital, terinspirasi manipulatif Montessori/Fröbel | ⚠️ Relevan sbg TEORI (embodied/hands-on learning), tapi mekanismenya (kamera+cermin fisik) di luar scope app web murni (PRD §5, client-side tanpa hardware tambahan) — dicatat sbg *insight*, bukan fitur yg bisa diporting langsung |
| **Kahoot / Kahoot Kids** | Kelas (semua usia) via guru; Kahoot Kids 3–8 th self-paced | Kuis buzzer, **timer countdown per soal** (bisa dimatikan guru), musik tegang, leaderboard tiap ronde | ❌ Timer countdown = SUMBER STRES TERKONFIRMASI (§3.3) — bahkan Kahoot sendiri menyediakan opsi mematikannya krn disadari "stress-inducing". ❌ Leaderboard tiap ronde. ✅ Versi "Kahoot Kids" (dikurasi ahli literasi dini, self-paced, TTS bawaan, gambar sbg jawaban) justru package tanpa 2 elemen di atas — konfirmasi independen bahwa "kuis-show yang seru" TIDAK BUTUH timer/leaderboard utk tetap menyenangkan anak |

### 3.2 Lembaga Bahasa Inggris (Prioritas Indonesia)

| Lembaga | Metode game/permainan | Insight buat app ini |
|---|---|---|
| **LIA (Lembaga Bahasa LIA)** | TPR (Total Physical Response) dominan di level bawah, roleplay, storytelling per unit, project-based di level atas | Konfirmasi ulang §3.3: TPR relevan khusus Little Stars/Starter (respons fisik/gerak thd instruksi verbal) — app ini SUDAH punya versi digitalnya (Dengar & Tunjuk = TPR minus gerak fisik sungguhan, krn medium web) |
| **Cambridge YLE (Starters/Movers/Flyers)** | Ujian RESMI anak sendiri dikemas jadi "game": Listening "listen & colour"/"listen & connect"/"listen & fill in numbers", Speaking "describe a picture", diberi "shield" (lencana) sbg reward, BUKAN skor gagal/lulus konvensional | Validasi terkuat: **lembaga bahasa Inggris anak PALING otoritatif di dunia sendiri sudah membungkus assessment jadi permainan non-punitive** ("shield" = bintang/lencana, bukan nilai merah) — prinsip inti app ini (retry-tanpa-batas, reward selalu positif) sejalan LANGSUNG dgn cara ujian anak resmi didesain, bukan penyimpangan dari standar |
| **Kumon EFL** | Worksheet "Lihat, Dengar, dan Ucapkan Kembali" — gambar berwarna dihubungkan ke kata, App Kumon terpisah utk latihan digital harian | Pola "lihat-dengar-ucap" ini PERSIS shape Kenalan (🔊🎤) yang sudah dipakai app ini di semua skill — Kumon memvalidasi urutan ini sbg titik awal yang benar sebelum masuk soal berjawab |
| **EF / Wall Street English** | Fokus native-speaker instructor + kurikulum sistematis; materi gamifikasi spesifik tidak dipublikasi terbuka (riset sebelumnya di `materi/*.md` lain juga catat hal sama) | Tidak menambah insight mekanik baru di luar yang sudah dikonfirmasi §materi lain — dipakai sbg konfirmasi tier/usia band saja, bukan sumber mekanik |

### 3.3 Landasan Teori & Riset Kognitif

- **Rentang usia & bentuk interaksi** (NN/g, aufaitux, ramotion — dikonfirmasi silang beberapa sumber): anak 3–5 th atensi cuma 8–10 menit, butuh instruksi visual/audio (bukan teks), 1 aksi sederhana per layar; 6–8 th mulai bisa multi-langkah pendek; 9–12 th mulai bisa instruksi teks + tugas berlapis. **Tombol minimal 48×48dp** dgn jarak antar-tombol supaya tidak salah tap. Ini KONSISTEN dgn keputusan app ini yang SUDAH ada (TTS wajib di semua label, target tap besar, CLAUDE.md kid-friendly poin 4) — riset ini mengonfirmasi angka konkretnya, bukan mengubah arah.
- **TPR (Total Physical Response)**: metode paling cocok anak sangat muda krn meniru cara bayi belajar bahasa ibu (dengar dulu, gerak/tunjuk sbg respons, baru bicara belakangan) — **menurunkan inhibisi & stres** dibanding langsung dituntut bicara/menulis. Mendukung urutan Kenalan (dengar dulu) → Latihan Inti (pilih/tunjuk) → baru Tantangan (produksi aktif: eja/susun/ucap) yang SUDAH jadi arsitektur app ini di semua skill.
- **Embodied learning (Osmo, terinspirasi Montessori/Fröbel)**: belajar makin melekat kalau konsep abstrak dikaitkan ke aksi/objek konkret — relevan sbg alasan KENAPA mekanik "gambar besar + emoji" (bukan teks polos) dipilih app ini utk anak muda, dan kenapa Reading format kedua sengaja whole-word+gambar (bukan abstraksi huruf lepas).
- **Riset psikologi anti-timer**: countdown timer memicu respons "fight or flight" (amigdala membajak fungsi eksekutif korteks prefrontal) — SECARA LITERAL bikin anak makin sulit berpikir jernih justru saat ditekan waktu. Ini **bukti kognitif langsung** kenapa aturan "tanpa timer" CLAUDE.md bukan cuma preferensi gaya, tapi keputusan berbasis sains pembelajaran.
- **Kritik mekanik gamifikasi "pointsification"**: badge/poin/leaderboard yang ditempel di atas konten tanpa mengubah cara belajar disebut kritikus sbg "gamifikasi dangkal" — retensi jangka panjang butuh **retrieval aktif** (mengingat & memproduksi jawaban), bukan cuma pasif menonton lalu dapat lencana. Ini men-support kenapa app ini SELALU meminta anak bertindak (tap/susun/ucap) di tiap soal, bukan sekadar "lanjut" pasif.
- **Riset gamifikasi remaja (12–15 th)**: elemen "childish" (maskot super lucu, animasi berlebihan, reward visual norak) justru bisa terasa merendahkan remaja — riset menegaskan leaderboard/kompetisi/badge² murahan berisiko **efek negatif** (motivasi turun) di rentang usia ini kalau berlebihan. **Konsekuensi langsung buat Trailblazer (§6)**: mekanik "kekanak-kanakan" (roda-acak-warna-warni, tunjuk-gambar-lucu) SEBAIKNYA tidak dipakai lagi di level ini — app ini SUDAH intuitif ke arah sini (Speaking Trailblazer pakai simulasi interview, bukan mini-game gambar), riset ini mengonfirmasi arah itu benar.

### 3.4 Preseden Internal — "Anglora" (`inggrisinyuk/prd_user_game.md`, Game Dewasa 15+)

CLAUDE.md sudah eksplisit menandai dokumen ini sbg salah satu referensi yang WAJIB difilter — dibaca ulang sesi ini utk kelengkapan analisis (bukan sekadar disebut, benar-benar dibuka).

| Mekanik Anglora | Sudah diadaptasi ke app ini? | Kalau belum, boleh diadaptasi? |
|---|---|---|
| **Peta dunia + 6 negeri sekuensial** | ✅ SUDAH — Peta Level 6 markas (PRD §11 iterasi kedua) | — |
| **Bos penjaga per negeri, menang = negeri berikutnya terbuka** | ✅ SUDAH — Tantangan Bos "Raja X" (PRD §12.1/§12.2) | — |
| **XP yang cuma naik, tanpa nyawa/HP yang bisa habis** | ✅ SUDAH — PRD §12.4 eksplisit menyebut Anglora sbg inspirasi TAPI sengaja dibuang mekanik HP-nya | — |
| **Streak/"Obor" + item pengampunan ("Minyak Obor")** | ✅ SUDAH — diadaptasi jadi "1 hari pelindung" (PRD §13.1), lebih sederhana dari versi item Anglora | — |
| **"Jembatan Kabut" — 6 hari transisi konten 50/50 (level ini + preview level berikutnya) sebelum lompat level** | ❌ Belum ada padanan persis. Peta Level app ini buka/kunci "keras" (menang Bos = langsung buka penuh), tanpa masa transisi bertahap | ⚠️ **Berpotensi diadaptasi** — ide "kasih sedikit cicipan materi level berikutnya sebelum resmi pindah" secara pedagogis masuk akal (melandaikan lompatan kesulitan) & TIDAK melanggar filter manapun (tidak punitive, tidak monetisasi). TAPI ini perubahan STRUKTUR PROGRESI (bukan cuma mini-game baru) — di luar scope "konsep game" murni, dicatat sbg ide masa depan terpisah, BUKAN direkomendasikan §7 (perlu keputusan produk sendiri kalau mau dikejar) |
| **"Peti Harta" — reward acak (kartu kata langka, kosmetik, XP boost)** | ❌ Belum, dan **SEBAIKNYA TIDAK PERNAH** — reward RANDOM/variabel adalah mekanik psikologi yang sama dgn loot box/judi (variable-ratio reinforcement), terlepas dari "tanpa uang sungguhan" — tetap melatih pola "berharap-harap cemas" yang tidak pantas ditanamkan ke anak | ❌ **DITOLAK PERMANEN** (§5) |
| **Gelar/Title koleksi ("Penakluk Vokabug")** | ❌ Belum ada, cuma bintang/stiker | ⚠️ **Berpotensi rendah-risiko** — gelar/lencana koleksi (bukan mata uang, bukan random, bukan kompetitif antar-anak) sejalan prinsip "stiker/bintang" yang sudah dipakai (PRD §4.6) — TAPI ini reward LAYER, bukan game CONCEPT, sedikit di luar fokus dokumen ini; dicatat sbg ide sampingan, bukan direkomendasikan §7 |
| **"Duel Pembisu" — pertarungan dialog AI sungguhan (LLM in-app)** | ❌ Sengaja TIDAK — app ini 100% client-side tanpa AI/backend (PRD §5/§12.2) | ❌ **DITOLAK selama v1 tanpa backend AI** (keputusan arsitektur terkunci, bukan soal kid-friendly) |
| **Lore bos berbasis rasa takut (mis. "Fossila", "Nirsuara" = ketakutan diri sendiri, tone psikologis berat)** | ❌ Tidak — Raja X app ini bertema hewan ramah (lihat `BOSS_NAME`) | ❌ **DITOLAK** — CLAUDE.md kid-friendly poin 3 eksplisit: nada boss harus ringan ala Mario/Pokémon, bukan psikologis/menakutkan sekalipun implisit |

**Kesimpulan §3.4**: struktur BESAR Anglora (peta dunia, bos sekuensial, XP tumbuh, streak berampun) **sudah diserap semua** ke app ini dgn filter kid-friendly penuh sejak awal proyek — tidak ada gap besar tersisa dari dokumen ini yang perlu dikejar. Satu-satunya ide baru yang genuinely belum dicoba (Jembatan Kabut) adalah perubahan STRUKTUR PROGRESI, bukan mini-game individual, jadi disinggung tapi tidak masuk rekomendasi inti §7.

---

## 4. Taksonomi Konsep Mini-Game (Kategori Mekanik Universal)

Menggabungkan §2 (yang sudah dipakai) + §3 (yang dipakai kompetitor/lembaga) jadi 1 daftar taksonomi lengkap, supaya sesi berikutnya bisa cek cepat "kategori ini sudah ada belum, di mana".

| # | Kategori | Deskripsi singkat | Skill kognitif dilatih | Status di app ini |
|---|---|---|---|---|
| 1 | **Tap-Tunjuk** | Dengar/baca 1 stimulus → pilih 1 dari beberapa opsi | Recognition/MCQ dasar | ✅ Dipakai luas (hampir semua Latihan Inti) |
| 2 | **Cocok & Pasang (2 arah)** | Hubungkan gambar↔kata↔suara, arah bisa dibalik antar-tahap | Assosiasi bentuk-makna | ✅ Dipakai luas |
| 3 | **Eja/Rakit Huruf** | Anagram huruf acak → kata benar | Spelling/dekoding halus | ✅ Vocab Tantangan |
| 4 | **Susun Kalimat** | Word bank acak → kalimat benar (dari baca ATAU dengar) | Sintaks/urutan kata | ✅ Vocab, Listening (dikte), Reading Kenalan |
| 5 | **Benar/Salah** | 1 pernyataan/gambar → nilai benar atau salah | Judgment biner cepat | ✅ Listening, Reading |
| 6 | **Kartu Kontras + Arah Dibalik** | 2 kalimat/gambar kontras, dites 2 arah beda tahap | Diskriminasi pola/grammar | ✅ Grammar Pattern, Reading |
| 7 | **Ucap & Skor** | Mic, dibandingkan target kata/kalimat, skor proporsional | Produksi lisan | ✅ Semua skill yg py fitur Speaking |
| 8 | **Wawancara Bergilir** | Simulasi dialog turn-based dgn peer/tokoh fiktif TTS | Percakapan 2 arah | ✅ Speaking Interview (Trailblazer) |
| 9 | **Transformasi Kalimat MCQ** | Ubah struktur kalimat (mis. reported speech), pilih hasil benar | Restrukturisasi grammar tingkat lanjut | ✅ Grammar Transform (Trailblazer) |
| 10 | **Note-Completion** | Isi form/gap berurutan dari mendengar 1 stimulus panjang | Extract informasi spesifik dari audio | ✅ Listening (Achiever) |
| 11 | **Inferensi Multi-Pertanyaan** | Serangkaian soal makin sulit dari 1 stimulus (dialog/passage) panjang | Comprehension tingkat tinggi, bukan fakta literal | ✅ Listening Dialogue (Trailblazer), Reading Achiever/Trailblazer |
| 12 | **Mashup Multi-Ronde (Boss)** | Gabungan banyak mekanik di atas jadi 1 sesi besar | Retensi lintas-topik, "ujian" ringan | ✅ Tantangan Bos |
| 13 | **Urutkan/Kelompokkan** | Beberapa item sekaligus disortir ke ≥2 kategori (drag/tap ke keranjang) | Klasifikasi/kategorisasi | 🟡 **GAP** — belum pernah dipakai. Beda dari Benar/Salah (itu 1 item dinilai sendirian, ini BANYAK item dikelompokkan relatif satu sama lain) |
| 14 | **Ingat & Buka (Memory/Concentration)** | Kartu tertutup, buka 2 tiap giliran, cari pasangan tersembunyi | Working memory spasial | 🟡 **GAP** — beda dari Cocok&Pasang (itu opsi SELALU kelihatan, ini sengaja disembunyikan sampai dibuka, melatih ingatan bukan cuma pengenalan) |
| 15 | **Roda Acak (Randomizer, non-hadiah)** | Putar roda utk MEMILIH topik/urutan/giliran berikutnya — bukan pemberi hadiah acak | Variasi/kejutan ringan, TANPA konsekuensi menang-kalah | 🟡 **GAP** — belum dipakai. **Wajib dibedakan dari "Peti Harta" §3.4** (yg ditolak) — di sini keacakan cuma menentukan APA yang dikerjakan, bukan APA yang didapat |
| 16 | **Cari & Temukan (Hidden Object)** | 1 adegan ramai berisi banyak objek, anak mencari & tap 1 target spesifik | Perhatian visual selektif | 🟡 **GAP** — belum pernah dipakai di skill manapun |
| 17 | **Rangkai Petunjuk Berantai (Escape-room-lite)** | Beberapa mini-tugas berurutan, hasil tiap tugas jadi kunci ke tugas berikutnya, bermuara ke 1 "jawaban akhir" | Sintesis lintas-skill, problem-solving berlapis | 🟡 **GAP** — belum ada. Paling kompleks & paling besar effort dari semua kandidat, lihat catatan risiko §7 |

---

## 5. Filter Kid-Friendly — Mekanik yang WAJIB Dihindari (Bukan Sekadar "Kurang Disarankan")

| Mekanik | Ditemukan di | Kenapa ditolak | Bukti/rujukan |
|---|---|---|---|
| **Timer countdown apa pun** (termasuk "opsional"/"bonus") | Kahoot, Anglora (implisit lewat tekanan Duel), banyak app kuis dewasa | Timer memicu respons stres neurologis yang MENGHAMBAT proses belajar itu sendiri, bukan cuma "kurang nyaman" | §3.3 (riset amigdala/fight-or-flight); CLAUDE.md kunci eksplisit "tanpa timer/status gagal" |
| **Nyawa/HP/hearts yang bisa habis** | Duolingo dewasa, game RPG umum | Bertentangan langsung dgn prinsip "XP cuma naik, tidak ada stat yang berkurang" — begitu ada stat yg bisa habis, otomatis ada status "kalah" implisit | PRD §12.4 eksplisit menyebut ini alasan kenapa HP TIDAK dipakai |
| **Leaderboard/liga/perbandingan antar-anak** | Duolingo, Kahoot (papan skor tiap ronde) | Kecemasan sosial di usia ini — anak yg keliatan rendah di papan bisa jadi malu/patah semangat | PRD §4.6/§13 (larangan eksplisit sejak awal) |
| **Ekonomi coin/tiket yang dibelanjakan di toko** | ABCmouse ("tiket" → toko avatar/pet) | Framing mata uang ke anak — bisa membiasakan pola pikir transaksional dini, dan berisiko jadi jalur monetisasi tersembunyi kalau produk berkembang | PRD §4.6 "hindari framing mata uang ke anak" |
| **Reward acak/variable (loot box, "peti harta")** | Anglora "Peti Harta" | Psikologi variable-ratio reinforcement = mekanisme inti judi/gacha, terlepas dari ada/tidaknya uang sungguhan — tidak pantas dilatih ke anak dalam bentuk apa pun | §3.4; prinsip umum psikologi gamifikasi (dikonfirmasi silang riset "negative effects" gamifikasi §3.3) |
| **Lore/tema menakutkan meski implisit** (monster ketakutan diri sendiri, tema "kegagalan permanen"/fosilisasi) | Anglora (Nirsuara, Fossila) | Anak 3–13 th belum siap tema psikologis berat; framing boss WAJIB ringan | CLAUDE.md kid-friendly poin 3 |
| **Dead-end/status gagal permanen di soal manapun** | Umum di app dewasa/kompetitor | Bertentangan dgn "retry non-punitive" yang sudah jadi identitas app ini di semua skill | CLAUDE.md kid-friendly poin 4, PRD §4.5 |
| **Kompleksitas "kekanak-kanakan" berlebihan di level atas (12+)** | Mekanik gambar-lucu/maskot-super-imut yang dipertahankan sampai Trailblazer | Remaja bisa merasa direndahkan, berpotensi menurunkan (bukan menaikkan) motivasi | §3.3 riset gamifikasi remaja |

---

## 6. Tangga Level: Mekanik Mana Cocok di Mana (Inti Analisis)

Prinsip pemetaan: kompleksitas naik di **2 sumbu independen** — (a) **jumlah langkah/beban kognitif per interaksi** dan (b) **abstraksi tugas** (konkret→simbolik→relasional→transformatif). Kolom "Status" menandai apakah mekanik itu SUDAH dipakai di level ini (dari §2) atau baru KANDIDAT (dari §4/§7).

### 6.1 Little Stars (3–5 th) — di luar tangga CEFR

- **Ciri kognitif** (§3.3): atensi 8–10 menit, BELUM baca, butuh instruksi audio+visual, 1 aksi per layar, TPR (dengar→gerak/tunjuk) lebih pas dari storytelling.
- **Cocok & SUDAH dipakai**: Tap-Tunjuk (✅), Cocok&Pasang gambar-suara (✅ semua Kenalan), Kartu Kontras visual sederhana tanpa teks banyak (✅ Grammar Pattern).
- **Cocok tapi BELUM dipakai (kandidat §7)**: Cari & Temukan (tunjuk 1 objek di adegan ramai — natural utk usia ini, TPR-friendly, tanpa perlu baca sama sekali); Urutkan/Kelompokkan versi PALING sederhana (2 keranjang besar saja, mis. "besar" vs "kecil").
- **BELUM cocok**: apa pun berbasis teks tercetak sbg stimulus utama (Reading/Grammar format lama), Ingat&Buka versi grid besar (working memory belum matang utk >4 kartu), mekanik multi-langkah (Rangkai Petunjuk Berantai).

### 6.2 Starter (5–7 th, ≈Pre-A1)

- **Ciri kognitif**: mulai bisa decode kata tunggal/frasa pendek, atensi mulai lebih panjang, sudah bisa 2–3 langkah berurutan.
- **Cocok & SUDAH dipakai**: semua Little Stars + Susun Kalimat sederhana (✅), Benar/Salah (belum di level ini tapi konsepnya sudah ada di app), Cocok&Pasang 2-arah kata-tercetak↔gambar (✅ Reading Baca Kata).
- **Cocok tapi BELUM dipakai**: Ingat&Buka grid kecil (4–6 kartu, 2–3 pasang); Urutkan/Kelompokkan 2–3 kategori (mis. sortir hewan "peliharaan" vs "liar"); Roda Acak sbg pemilih topik latihan bebas (Game Hub) — bukan sbg reward.
- **BELUM cocok**: Transformasi kalimat abstrak, Inferensi multi-pertanyaan, Rangkai Petunjuk Berantai.

### 6.3 Explorer (7–9 th, ≈Pre-A1→A1)

- **Ciri kognitif**: baca lancar frasa/kalimat pendek, mulai nyaman MCQ standar, mulai bisa bermain arah-dibalik (comprehension 2 arah, sudah dibuktikan app ini di Reading Baca & Nilai).
- **Cocok & SUDAH dipakai**: SEMUA kategori 1–9 di §4 relevan & sebagian sudah live (Benar/Salah arah-dibalik ✅, Kartu Kontras ✅ kalau Grammar Pattern diperluas ke level ini).
- **Cocok tapi BELUM dipakai**: Ingat&Buka grid sedang (6–8 kartu); Urutkan/Kelompokkan 3–4 kategori; Roda Acak SEBAGAI bonus-round non-kompetitif di akhir Tantangan (memilih 1 dari beberapa "mode ekstra" ringan, bukan pemberi hadiah); Cari & Temukan versi lebih ramai (lebih banyak distraktor).
- **BELUM cocok**: Rangkai Petunjuk Berantai (masih terlalu abstrak/panjang atensi), Transformasi kalimat penuh.

### 6.4 Adventurer (9–11 th, ≈A1)

- **Ciri kognitif**: mulai bisa deskripsi+alasan ("karena"), mulai suka tantangan yg terasa "achievement" (bukan cuma quiz polos), attention span sudah cukup utk sesi lebih panjang.
- **Cocok & SUDAH dipakai**: Wawancara/roleplay dua-arah pendek (✅ Speaking lama), Susun Kalimat lanjutan, Note-completion versi ringan (belum di level ini tapi shape-nya sudah proven Achiever).
- **Cocok tapi BELUM dipakai**: Ingat&Buka grid besar (8–12 kartu, lintas-topik utk review); Urutkan/Kelompokkan dgn kriteria lebih halus (mis. sortir kata kerja "present" vs "past", bukan cuma kategori benda konkret); reskin visual "papan/jalur" utk navigasi quiz-dot per topik (kosmetik, bukan mekanik baru — biar terasa progresif spt board-game tanpa risiko dadu/kompetisi).
- **Kurang cocok**: Rangkai Petunjuk Berantai (mungkin di batas bawah kesiapan, tapi risiko attention masih ada) — kandidat "coba dulu di Achiever".

### 6.5 Achiever (11–13 th, ≈A1→A2)

- **Ciri kognitif**: sudah bisa opini+perbandingan eksplisit ("in my opinion", "which do you prefer"), comprehension inferensi (sudah dibuktikan Reading/Listening Achiever), mulai menikmati problem-solving berlapis.
- **Cocok & SUDAH dipakai**: Inferensi multi-pertanyaan (✅ Reading/Listening), Note-completion (✅ Listening).
- **Cocok tapi BELUM dipakai**: **Rangkai Petunjuk Berantai versi ringan** (2–3 mini-tugas berantai, BUKAN escape-room penuh dgn timer/tema tegang — cukup "jawaban tugas 1 jadi kunci buka tugas 2", murni struktural tanpa elemen stres apa pun yg biasa menyertai escape-room dewasa); Urutkan/Kelompokkan abstrak (mis. sortir argumen "pro" vs "kontra" dari sebuah opini, menjembatani ke Speaking opini yg sudah ada).
- **Kurang cocok**: mekanik visual "lucu-kekanakan" (Cari&Temukan gaya taman-kanak, Roda Acak warna-warni cerah) — bukan krn terlarang, tapi krn kurang match preferensi usia ini (§3.3 riset remaja).

### 6.6 Trailblazer (12+ th, ≈B1, "jalur lanjutan")

- **Ciri kognitif**: mendekati remaja, riset eksplisit (§3.3) memperingatkan mekanik "childish" berisiko motivasi negatif. Butuh framing lebih "dewasa-ringan" (simulasi, strategi, wawancara) drpd "permainan anak kecil".
- **Cocok & SUDAH dipakai**: Wawancara bergilir dgn peer fiktif (✅ Speaking Interview), Transformasi kalimat MCQ (✅ Grammar Transform), Inferensi (✅ Listening Dialogue).
- **Cocok tapi BELUM dipakai**: **Rangkai Petunjuk Berantai versi penuh** (paling matang secara kognitif utk level ini — kandidat TERBAIK utk mekanik ini scr keseluruhan tangga level); format "diskusi terstruktur" (pilih argumen dari kartu, bukan cuma jawab bebas) sbg jembatan antara "Wawancara" yg sudah ada dan skill opini yg lebih terbuka.
- **Sebaiknya DIHINDARI di level ini**: Roda Acak dgn visual warna-warni playful, Cari & Temukan gaya "petualangan anak", Ingat&Buka polos tanpa konteks naratif — bukan krn melanggar aturan, tapi krn nada terlalu muda utk audiens 12+ (§3.3).

### 6.7 Ringkasan Tabel Tangga

| Level | Beban kognitif/langkah | Abstraksi tugas | Mekanik GAP paling relevan (§4) |
|---|---|---|---|
| Little Stars | 1 aksi | Konkret (tunjuk benda) | Cari & Temukan (simple), Urutkan 2-kategori |
| Starter | 2–3 langkah | Konkret + simbol kata pendek | Ingat&Buka (kecil), Urutkan 2–3 kategori, Roda Acak (pemilih topik) |
| Explorer | Multi-langkah standar | Simbolik penuh (MCQ, arah dibalik) | Ingat&Buka (sedang), Urutkan 3–4 kategori, Roda Acak (bonus-round) |
| Adventurer | Sesi lebih panjang | Deskriptif+alasan | Ingat&Buka (besar/lintas-topik), Urutkan halus, reskin papan-jalur |
| Achiever | Berlapis | Inferensial + opini | Rangkai Petunjuk Berantai (ringan), Urutkan abstrak |
| Trailblazer | Berlapis + mandiri | Transformatif + argumentatif | Rangkai Petunjuk Berantai (penuh), Diskusi terstruktur |

---

## 7. Rekomendasi Konkret — Kandidat Mekanik Baru (Diprioritaskan, Menunggu Keputusan User)

Ini BUKAN keputusan final — daftar kandidat hasil analisis §4–§6, diurutkan dari yang paling siap dikerjakan ke yang paling besar. **Tidak ada yang dikerjakan sesi ini.**

1. **Urutkan/Kelompokkan (sorting ke kategori)** — Effort: **kecil-sedang**. Genuinely gap (beda dari Benar/Salah yang cuma menilai 1 item). Cocok mulai Little Stars (2 keranjang) sampai Achiever (kategori abstrak). Risiko rendah — murni drag/tap ke 1 dari beberapa "wadah" di layar, semua elemen UI (drag/tap, hint, retry) sudah ada polanya di mekanik lain. **✅ PILOT SUDAH DIBANGUN** (permintaan user "yuk implementasi satu persatu", diskop lewat 3 pertanyaan: masuk sbg varian mini-game Kenalan 🎮, bukan tab Tantangan baru/Game Hub — konten diputuskan sesudah 1 prototipe, level pilot Little Stars) — `VocabTopic.sortBaskets` + `VocabItem.group` (types.ts, opsional), `isSortableTopic()`/`drawSortQuestion()` (`games/vocabulary.ts`), 1 topik pilot `bentuk` (Shapes, Little Stars — kategorisasi "Bundar vs Bersudut" melekat di subjek topiknya sendiri). Detail penuh: CLAUDE.md § "Format Wajib Materi Vocabulary" poin 1. **BELUM digenapkan ke topik/level lain** — menunggu arahan user berikutnya.
2. **Ingat & Buka (memory/concentration flip-card)** — Effort: **kecil-sedang**. Genuinely gap. Bagus khususnya sbg mode Game Hub (main bebas, review vocab lintas topik) krn tidak terikat 1 skill spesifik — bisa dipakai lintas Vocab/Listening/Reading sbg reuse konten yg sudah ada (emoji+kata), BUKAN kebutuhan data baru.
3. **Roda Acak (randomizer NON-hadiah)** — Effort: **kecil**. Perlu kehati-hatian framing (WAJIB ditulis jelas: "roda ini memilih topik/giliran berikutnya", BUKAN "putar dapat hadiah") supaya tidak mendekati kesan loot-box meski niatnya beda total. Paling cocok sbg pemilih ringan di Game Hub, bukan di jalur Belajar inti.
4. **Cari & Temukan (hidden object sederhana)** — Effort: **sedang**. Genuinely gap, cocok Little Stars–Starter. Butuh desain layout "adegan ramai" baru (bukan reuse kartu MCQ existing), effort lebih tinggi dari #1–#3.
5. **Rangkai Petunjuk Berantai (escape-room-lite)** — Effort: **besar**. Kandidat paling menjanjikan secara pedagogis utk Achiever/Trailblazer (§6.5/§6.6) TAPI paling kompleks dibangun (perlu state antar-mini-tugas, "kunci" dari 1 tugas membuka tugas berikut) — perlu dirancang HATI-HATI supaya TIDAK ikut menyeret elemen escape-room yg lazim (timer, "kehabisan percobaan") yang justru dilarang §5. Direkomendasikan sbg prototipe 1 topik pilot dulu (pola yg sudah terbukti aman di app ini — semua format baru selalu mulai dari 1 topik pilot sebelum digenapkan, lihat §sesi tiap dokumen materi lain), bukan langsung full rollout.

**Tidak direkomendasikan sbg prioritas** (dicatat sbg ide tapi bukan usulan aktif): "Jembatan Kabut"-style preview level berikutnya (perubahan struktur progresi, bukan mini-game — di luar fokus dokumen), gelar/lencana koleksi tambahan (reward layer, bukan mekanik game, dan bintang/stiker existing sudah memadai perannya).

---

## 8. Gap & Keterbatasan (Dilaporkan Jujur)

- **Dokumen ini murni analisis** — tidak ada file kode (`app/src/games/*.ts`) atau konten (`content.ts`) yang disentuh sesi ini, sesuai instruksi "coba deep analysis dulu".
- **§7 belum diprioritaskan lintas skill/level oleh user** — 5 kandidat di atas semua "bisa" secara analisis, tapi keputusan "yang mana duluan, di skill/level apa" adalah keputusan produk yang perlu ditanyakan eksplisit, konsisten pola semua sesi materi lain (selalu menunggu arahan "lanjutkan ke level/skill X" sebelum authoring).
- **Riset Osmo (tangible/embodied play)** relevan sbg teori tapi TIDAK actionable langsung krn app ini web murni tanpa hardware — dicatat sbg batas cakupan, bukan diabaikan.
- **"Jembatan Kabut"-style preview** sengaja tidak masuk rekomendasi krn beda kategori (struktur progresi vs mini-game) — kalau user tertarik, itu perlu dokumen/keputusan terpisah, bukan bagian dari §7.

---

## Sumber Riset Web

- [Duolingo Gamification: 8 Strategies for E-commerce Growth (nudgenow.com)](https://www.nudgenow.com/blogs/duolingo-gamification-strategy)
- [Duolingo Gamification Strategy: A Full Case Study (trophy.so)](https://trophy.so/blog/duolingo-gamification-case-study)
- [Why Duolingo's Gamification Works (And When It Doesn't) (dev.to)](https://dev.to/pocket_linguist/why-duolingos-gamification-works-and-when-it-doesnt-1d4)
- [Duolingo's Gamification Secrets (orizon.co)](https://www.orizon.co/blog/duolingos-gamification-secrets)
- [Duolingo ABC - Learn to Read - Common Sense Media](https://www.commonsensemedia.org/app-reviews/duolingo-abc-learn-to-read)
- [Learn to Read - Duolingo ABC (ScreensDesign)](https://screensdesign.com/showcase/learn-to-read-duolingo-abc)
- [Duolingo ABC: an in-depth review (Modulo)](https://joinmodulo.com/products/duolingo-abc)
- [Lingokids Games Archive](https://lingokids.com/english-for-kids/games)
- [Lingokids (Wikipedia)](https://en.wikipedia.org/wiki/Lingokids)
- [UI/UX Design for Children: Age-Appropriate App Guidelines (aufaitux.com)](https://www.aufaitux.com/blog/ui-ux-designing-for-children/)
- [Designing for Kids: Cognitive Considerations (NN/g)](https://www.nngroup.com/articles/kids-cognition/)
- [A Practical Guide To Design For Children (Smart Interface Design Patterns)](https://smart-interface-design-patterns.com/articles/design-guidelines-children/)
- [UX Design for Kids (Ramotion)](https://www.ramotion.com/blog/ux-design-for-kids/)
- [How Khan Academy Leverages Gamification (Trophy)](https://trophy.so/blog/khan-academy-gamification-case-study)
- [Best Early Learning Apps for Kids (Khan Academy Blog)](https://blog.khanacademy.org/best-early-learning-apps-for-kids/)
- [Why Khan Academy Kids is the Screen Time You'll Actually... (screenwiseapp.com)](https://screenwiseapp.com/guides/khan-academy-kids-learning-game)
- [ABCmouse Review (testprepinsight.com)](https://testprepinsight.com/kids-education/reviews/abc-mouse/)
- [Comparing ABCmouse Vs. Reading Eggs In 2026 (Pastory)](https://pastory.app/articles/abcmouse-vs-reading-com/)
- [Fun and Educational Learning Games Kids Can Play for Free (Reading Eggs)](https://readingeggs.com/articles/learning-games-for-kids/)
- [The LATEST Cambridge Starters, Movers, and Flyers sample test (flyer.us)](https://flyer.us/the-latest-cambridge-starters-movers-and-flyers-sample-test-with-answers/)
- [Paper-based Cambridge English Qualifications for young learners](https://www.cambridgeenglish.org/exams-and-tests/qualifications/young-learners/paper/)
- [What is Cambridge Movers? (flyer.us)](https://flyer.us/what-is-movers-movers-test-format-and-study-materials/)
- [Metode Pembelajaran Kursus Bahasa Inggris Yang Efektif Di LB LIA](https://lblia.com/metode-pembelajaran-kursus-bahasa-inggris-yang-efektif/)
- [Parents, Bermain Games Dalam Kelas Bahasa Inggris Itu Penting Loh (LIA)](https://lblia.com/parents-bermain-games-dalam-kelas-bahasa-inggris-itu-penting-loh/)
- [Anak Perlu Belajar Tata Bahasa Inggris yang Tepat, Kumon Hadirkan Program EFL (Bobo/Grid.id)](https://bobo.grid.id/read/083531236/anak-perlu-belajar-tata-bahasa-inggris-yang-tepat-kumon-hadirkan-program-efl-sebagai-solusi)
- [Battles (Prodigy Game Wiki)](https://prodigy-game.fandom.com/wiki/Battles)
- [Battling in Prodigy Math (Prodigy Education)](https://prodigygame.zendesk.com/hc/en-us/articles/12910978061844-Battling-in-Prodigy-Math)
- [Osmo by Tangible Play - Good Design](https://good-design.org/projects/osmo-by-tangible-play-inc/)
- [Osmo (game system) — Wikipedia](https://en.wikipedia.org/wiki/Osmo_(game_system))
- [Matching Games for Kids – Memory & Sorting (Keiki)](https://keiki.app/learning-games-for-kids/matching)
- [Best Memory Games for Kids in 2026 (Snappit)](https://www.snappit.app/blog/best-memory-games-for-kids)
- [Total Physical Response | TPR Definition, Method & Examples (Study.com)](https://study.com/academy/lesson/total-physical-response-method-examples.html)
- [Using Total Physical Response Method in Early Childhood Foreign Language Teaching Environments (ScienceDirect)](https://www.sciencedirect.com/science/article/pii/S1877042813035581)
- [But Timers Make My Kid Anxious (learnwithdremily.substack.com)](https://learnwithdremily.substack.com/p/but-timers-make-my-kid-anxious)
- [Why Most Education Apps Fail (carlhendrick.substack.com)](https://carlhendrick.substack.com/p/why-most-education-apps-fail)
- [Why Your Child Can't Stop Using That App (Medium)](https://medium.com/design-bootcamp/why-your-child-cant-stop-using-that-app-a-game-designer-s-warning-f5116c06e0b9)
- [Kahoot! Quiz games (kahoot.com)](https://kahoot.com/home/kahoot-quiz-games/)
- [Make learning fun for kids with Kahoot!+ (kahoot.com)](https://kahoot.com/home/kahoot-kids/)
- [Kahoot!: A Research-Informed Review (Modulo)](https://joinmodulo.com/products/kahoot)
- [Full article: Gamification in mobile-assisted language learning (Tandfonline, systematic review of Duolingo literature)](https://www.tandfonline.com/doi/full/10.1080/09588221.2021.1933540)
- [Gamification in language learning apps: Hidden negative effects (Taalhammer)](https://www.taalhammer.com/gamification-in-language-learning-apps/)
- [Latent factors on the design and adoption of gamified apps in primary education (NCBI)](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC10126543/)
- [Spin the Wheel - ESL Games Plus](https://www.eslgamesplus.com/spin-the-wheel-eslgamesplus/)
- [How to Use Escape Room Activities to Enhance Language Learning (TESOL)](https://www.tesol.org/how-to-use-escape-room-activities-to-enhance-language-learning/)
- [Educational Escape Rooms: Exploring the Potential of Gamification in Learning (Heriot-Watt LTA)](https://lta.hw.ac.uk/educational-escape-rooms-exploring-the-potential-of-gamification-in-learning/)

Referensi internal tambahan (dibaca langsung, bukan web): [`inggrisinyuk/prd_user_game.md`](../../inggrisinyuk/prd_user_game.md) §4–§6 (struktur Anglora — produk dewasa terpisah, dipakai murni sbg pembanding filter kid-friendly §3.4, BUKAN sumber konten).
