# Suasana Game — Kenapa Game Hub Masih Terasa Seperti Mengerjakan Soal

Permintaan user (2026-09-30): *"game yang ada seperti mengerjakan soal biasa seperti di latihan inti dan tantangan"* — analisis & riset bagaimana Game Hub punya **vibe/suasana game**: musik latar petualangan, UI ala game petualangan, dan lainnya.

Pasangan dokumen: [pembeda_level_game.md](pembeda_level_game.md) (isi & tingkat kesulitan tiap game) dan [game.md](game.md) (mekanik & filter kid-friendly). Dokumen ini membahas **kemasan & rasa**: suara, tampilan, karakter, alur.

Penanda: **[F]** = fakta (dari kode/sumber), **[U]** = usulan (belum dibangun).

---

## 1. Ringkasan

**Diagnosis:** isi 7 game sudah berbeda dari materi, tapi **kemasannya sama persis dengan Latihan Inti/Tantangan**: kartu kuis 2×2, bullet progress bernomor, teks "Yuk coba!", tombol "🔁 Coba Lagi / Lanjut ➡️", tanpa musik, tanpa karakter, tanpa dunia. Anak melihat layar yang sama dengan PR-nya, hanya judulnya berbeda.

**Riset** menunjukkan 3 lapis yang membuat sesuatu terasa game, dan ketiganya belum ada:

1. **Suara** — musik latar lembut + efek suara untuk setiap aksi. Musik latar terbukti menaikkan motivasi & *flow* di game edukasi, **tapi** anak jauh lebih sulit mendengar ucapan di tengah suara lain dibanding orang dewasa → musik wajib **dikecilkan otomatis saat ada suara bicara (TTS)**.
2. **Tampilan & rasa (game feel / "juice")** — dunia bergambar per game, peta berupa jalan (bukan grid kartu), setiap ketukan dijawab animasi + suara, karakter pendamping yang bereaksi.
3. **Alur & tujuan** — ada misi yang jelas ("kumpulkan kristal untuk membuka gerbang istana"), hadiah yang terkumpul, upacara saat markas selesai.

Tapi riset juga memperingatkan **"chocolate-covered broccoli"**: membungkus kuis dengan hiasan game tanpa mengubah cara bermain justru menurunkan motivasi belajar. Jadi selain kemasan, **aksi utama tiap game sebaiknya berupa aksi game** (menyeret ke keranjang, membuka peti, membalik kartu), bukan menekan tombol jawaban.

**Rekomendasi:** 3 fase, mulai dari yang paling murah & paling terasa — **Fase 1: sistem suara** (musik per game + efek + pengecilan otomatis + tombol musik), **Fase 2: tampilan game** (HUD, peta jalan, dunia bergambar, kata-kata game), **Fase 3: karakter & alur** (pendamping bereaksi, koleksi stiker, upacara markas, aksi seret).

---

## 2. Diagnosis — Apa yang Membuat Terasa Seperti Soal [F]

Perbandingan elemen layar Game Hub vs Latihan Inti/Tantangan (dari kode `app/src/games/*.ts` & `public/styles.css`):

| Elemen | Latihan Inti / Tantangan | Game Hub sekarang | Sama? |
|---|---|---|---|
| Kartu jawaban | `.opt-btn.answer-card` 2×2 + lencana A/B/C/D | sama (Sound Hunt, Story Quest, Raja Kelompok Legendaris) | ✅ sama |
| Progres | bullet bernomor 1–10 (`.quiz-dot`) | bullet bernomor 1–10 (`.quiz-dot.static`) | ✅ sama |
| Setelah menjawab | teks "Yuk coba! 😊" + "🔁 Coba Lagi / Lanjut ➡️" | sama persis | ✅ sama |
| Suara | TTS + 3 nada sintetis (`playCorrectTone`/`playWrongTone`/`playTryAgainTone`) | sama, **tanpa musik latar & tanpa efek aksi** | ✅ sama |
| Perayaan benar | confetti (`fireConfetti`) + `.win-burst` | sama | ✅ sama |
| Latar belakang | kartu putih/krem | kartu putih/krem + bintang kecil (`GAME_STAR_FIELD`) | hampir sama |
| Peta markas | — | grid kartu 2 kolom (`.raja-grid`), mirip daftar topik Menu Belajar | mirip menu |
| Karakter | — | tidak ada di layar main (maskot Raja `rajaMascot()` sudah ada di `scenery.ts`, cuma dipakai di roster) | — |
| Kata-kata | "Halaman 1/5", "SKOR", "Soal", "Petunjuk" | sama ("Halaman 1/5" di Story Quest, "SKOR" di Memory Hunt) | ✅ sama |
| Tujuan | selesaikan topik | "Selesai 3 dari 6" — tidak ada misi/cerita | mirip |

**Yang sudah terasa game**: balon bergerak (Balloon Hunt), kartu tertutup yang dibalik (Memory Hunt), garis penghubung (Word Quest), gelembung kata (Sentence Puzzle). Game dengan aksi berbentuk "pilih 1 dari 4 kartu" (Sound Hunt, Story Quest, Raja Kelompok) paling terasa seperti soal.

---

## 3. Riset Eksternal

### 3.1 Jebakan "chocolate-covered broccoli"

- Istilah untuk game edukasi yang membungkus kuis ("brokoli") dengan hiasan game ("cokelat"). Dikritik karena memutus *flow*, hiasannya jadi *seductive detail* yang mengalihkan perhatian, dan mengajari anak bahwa "belajar itu bagian membosankan sebelum bagian seru". Contoh klasik: Math Blaster — "lembar latihan tanpa kertas". ([Frontiers 2021](https://www.frontiersin.org/journals/psychology/articles/10.3389/fpsyg.2021.678380/full), [Tedium](https://tedium.co/2019/05/09/edutainment-math-blaster-chocolate-covered-broccoli/), [Nicky Case](https://blog.ncase.me/curse-of-the-chocolate-covered-broccoli-or-emotion-in-learning/))
- **Integrasi intrinsik** (Habgood & Ainsworth, game *Zombie Division*, anak 7–11 th): materi ditanam di **aksi inti game** (membagi = memilih pedang untuk membelah zombie), bukan kuis di sela permainan. Hasil: anak belajar lebih banyak dalam waktu sama, dan **bermain 7× lebih lama** di waktu bebas dibanding versi yang kuisnya "ditempel". ([Habgood & Ainsworth 2011](https://tecfa.unige.ch/tecfa/teaching/BSEP/articles/Habgood_Ainsworth_2011.pdf), [ERIC](https://eric.ed.gov/?id=EJ922627))

**Artinya untuk app ini:** musik & gambar saja tidak cukup; aksi utama tiap game harus terasa sebagai aksi game (lihat §4.3).

### 3.2 Musik latar

- Musik latar di game edukasi **menaikkan motivasi intrinsik & flow**; efek ke hasil belajar campuran — tidak merugikan kalau pas, bisa menambah beban kognitif kalau berlebihan. ([Background Music in Educational Games](https://www.researchgate.net/publication/220663800_Background_Music_in_Educational_Games_Motivational_Appeal_and_Cognitive_Impact), [Springer 2019](https://link.springer.com/article/10.1007/s40299-019-00450-8), [Wiley 2019](https://onlinelibrary.wiley.com/doi/full/10.1002/acp.3509))
- Studi desain game edukasi anak (musik, kecepatan, warna, benda koleksi) juga membahas musik sebagai salah satu elemen utama suasana. ([ScienceDirect 2025](https://www.sciencedirect.com/science/article/abs/pii/S0023969025000931))
- **Penting untuk app bahasa**: anak butuh sinyal ucapan **±3 dB lebih keras** dari orang dewasa untuk mengerti ucapan di tengah suara lain, dan kemampuan ini baru setara dewasa di usia 9–10 th (bahkan remaja untuk kondisi kompleks). ([ASHA 2017](https://pubs.asha.org/doi/10.1044/2017_JSLHR-H-17-0070), [PMC 2019](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC6733920/)) → Sound Hunt, Balloon Hunt (Pemanasan & Jago), Raja Kelompok (Jago) mengandalkan mendengar; musik yang tidak dikecilkan akan **membuat soal lebih sulit, bukan lebih seru**.
- **Ducking** (musik mengecil otomatis saat ada suara bicara) adalah praktik standar game & video: turunkan ±6–12 dB, mulai ±30–80 ms, pulih ±250–700 ms. ([Game Developer — Ducking](https://www.gamedeveloper.com/audio/game-audio-theory-ducking), [Clueso](https://www.clueso.io/glossary/audio-ducking))

### 3.3 Game feel / "juice"

- *Juice* = banyak umpan balik kecil untuk satu aksi (bergoyang, memantul, berbunyi) sehingga game "terasa hidup". Di satu studi, versi tanpa juice membuat 45 dari 58 pemain bingung soal tujuan game vs 17 dari 54 di versi juicy — **tapi** juice berlebihan mengganggu pemain yang sedang berpikir. ([Juicy Game Design](https://www.researchgate.net/publication/336711817_Juicy_Game_Design_Understanding_the_Impact_of_Visual_Embellishments_on_Player_Experience), [Cal Poly](https://digitalcommons.calpoly.edu/cgi/viewcontent.cgi?article=2345&context=theses), [Good Game Feel](https://www.academia.edu/95999203/Good_Game_Feel_An_Empirically_Grounded_Framework_for_Juicy_Design))
- Panduan suara UX: makin sering sebuah suara diputar, makin **pendek, halus, & hangat** suaranya; aplikasi harus tetap utuh tanpa suara. ([Toptal — UX sounds](https://www.toptal.com/designers/ux/ux-sounds-guide))

### 3.4 Referensi aplikasi anak

| Aplikasi | Yang membuat terasa game | Yang diambil | Yang TIDAK diambil |
|---|---|---|---|
| **Teach Your Monster to Read** | anak mendesain monster sendiri; peta pulau berwarna; bertemu **"Island Kings"**; misi memperbaiki pesawat luar angkasa ([Common Sense](https://www.commonsense.org/education/reviews/teach-your-monster-to-read), [situs resmi](https://www.teachyourmonster.org/teach-your-monster-to-read-mini-games/)) | peta pulau/dunia, "Raja" per dunia (cocok dengan konsep Raja app ini), misi besar yang jelas | — |
| **Khan Academy Kids** | pemandu **Kodi si beruang** yang melompat & bersorak saat benar, berpikir (tangan di dagu) saat anak kesulitan ([Khan Kids characters](https://khankids.zendesk.com/hc/en-us/articles/360049358751-Learn-more-about-the-characters-inside-Khan-Academy-Kids), [svgapp](https://svgapp.ai/app-mascots/khan-academy-kids/)) | karakter pendamping dengan reaksi (senang/berpikir), bukan teks polos | — |
| **Duolingo** | karakter animasi *state machine* (diam → bicara → bereaksi benar/salah), bibir sinkron dengan suara ([dev.to](https://dev.to/uianimation/how-duolingo-uses-rive-for-their-character-animation-and-how-you-can-build-a-similar-rive-mascot-5d19)) | reaksi karakter per kejadian | streak/hati/liga (ditolak app ini) |
| **Candy Crush Saga** | **peta jalan berkelok** (saga map): progres terlihat sebagai perjalanan, level berikutnya selalu terlihat ([Game Developer](https://www.gamedeveloper.com/design/rethinking-progression-in-mobile-puzzle-games), [teardown](https://medium.com/product-teardown/product-teardown-03-candy-crush-saga-24780e21d415)) | peta berupa jalan, bukan grid | level "sulit sengaja" untuk menjual bantuan |
| **Prodigy Math** | pulau petualangan, zona dijaga bos, pertarungan monster dengan soal matematika sebagai mantra ([Prodigy](https://www.prodigygame.com/main-en/blog/what-is-prodigy-math-game), [Wikipedia](https://en.wikipedia.org/wiki/Prodigy_Math_Game)) | cerita besar yang membingkai semua zona | **pertarungan & monster** (filter kid-friendly), membership berbayar di dalam game |

### 3.5 Batasan teknis & lisensi

- **Browser melarang suara otomatis** sebelum pengguna mengetuk layar; `AudioContext` harus di-*resume* setelah ketukan pertama, dan praktik baiknya musik baru mulai setelah interaksi. ([Chrome autoplay](https://developer.chrome.com/blog/autoplay), [Web Audio & games](https://developer.chrome.com/blog/web-audio-autoplay), [MDN](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Best_practices)) → masuk ke 1 game (tap kartu game) sudah cukup sebagai "ketukan pertama".
- **Tombol musik untuk anak**: anak sering bingung apakah ikon 🔇 menunjukkan *keadaan sekarang* atau *aksi*; mereka malah mencabut headphone. ([Fishbone Dice](https://www.fishbonedice.com/a-mute-button-for-kids)) → pakai tombol berlabel jelas ("🎵 Musik: Nyala"), besar (≥44px), dan juga ada di Pengaturan untuk orang tua. Sediakan juga opsi kurangi animasi. ([ungrammary](https://www.ungrammary.com/post/designing-for-kids-ux-design-tips-for-children-apps))
- **Sumber aset suara**:
  - **Kenney** — efek suara & *music jingles* **CC0** (bebas komersial, tanpa atribusi): UI, RPG, impact, jingle. ([Kenney Music Jingles](https://kenney.nl/assets/music-jingles), [UI Audio](https://kenney.nl/assets/ui-audio), [RPG Audio](https://kenney.nl/assets/rpg-audio))
  - **Pixabay Music** — ribuan musik "kids adventure" & loop, boleh komersial tanpa atribusi **selama tidak didistribusikan sebagai file musik mandiri** (dipakai di dalam app = boleh). ([Pixabay FAQ](https://pixabay.com/service/faq/), [Terms](https://pixabay.com/service/terms/), [kids adventure](https://pixabay.com/music/search/kids%20adventure/)) Catatan: beberapa pengulas menyebut risiko klaim hak cipta di platform video — tidak berpengaruh ke app, tapi simpan bukti lisensi per file. ([ulasan 2026](https://www.michaelmusco.com/2026/02/pixabay-music-review.html))

---

## 4. Rekomendasi [U]

Prinsip: **kemasan game + aksi game, tetap kid-friendly** (tanpa timer, nyawa, koin, monster/pertarungan, musik tegang — [game.md](game.md) §5).

### 4.1 Lapis Suara

| Komponen | Usulan | Alasan |
|---|---|---|
| **Musik latar** | 1 loop per game (7 lagu, tiap game punya "dunia" sendiri: hutan untuk Sound Hunt, taman/langit untuk Balloon Hunt, istana cerita untuk Story Quest), instrumental ceria, tempo sedang, 60–120 dtk, diulang mulus. Musik Map berbeda (lebih santai) dari musik di dalam markas. | motivasi & flow (§3.2); membedakan game dari materi yang hening |
| **Volume** | musik ±20–30% dari TTS; **otomatis dikecilkan** (±−12 dB) setiap TTS/`speak()` bicara, kembali pelan setelah selesai; **dimatikan** di layar yang memakai mic | anak butuh ucapan lebih jelas (§3.2) |
| **Efek suara aksi** | ketukan kartu (klik lembut), balon meletup, kartu dibalik, kata masuk keranjang, garis tersambung, halaman dibalik, markas terbuka ("ting" naik), markas tuntas (jingle 2–3 dtk), semua markas tuntas (fanfare). Nada benar/salah sekarang tetap dipakai. | juice (§3.3): setiap aksi dijawab suara |
| **Kontrol** | tombol "🎵 Musik: Nyala/Mati" di header game (besar, berlabel), plus di Pengaturan: Musik & Efek suara terpisah. Disimpan di browser (per perangkat). | aturan UX anak (§3.5) |
| **Aturan berhenti** | musik ikut berhenti saat keluar game/pindah layar (sama aturan wajib audio CLAUDE.md), jeda saat tab disembunyikan | aturan audio yang sudah ada |
| **Aset** | efek: Kenney (CC0). Musik: Pixabay Music atau Kenney jingles; format `.mp3` ±64–96 kbps (±0,5–1 MB per lagu), dimuat hanya saat game dibuka | VPS kecil (CLAUDE.md), lisensi aman |

### 4.2 Lapis Tampilan & Rasa

| Komponen | Sekarang | Usulan |
|---|---|---|
| **Peta markas** | grid kartu 2 kolom | **jalan berkelok** (saga map) dengan 6 titik markas di atas latar dunia game itu; markas terbuka berdenyut, markas tuntas diberi bendera/bintang; animasi karakter berjalan ke markas berikutnya setelah menang. `scenery.ts` sudah punya `TRAIL_BEND_*` & bukit yang bisa dipakai ulang. Di desktop jalan melebar ke samping. |
| **Latar layar main** | kartu krem polos | **pemandangan per game** (ilustrasi/SVG ringan: pepohonan untuk Sound Hunt, langit & awan untuk Balloon Hunt, rak buku untuk Story Quest, pasar untuk Raja Kelompok) di belakang area main; area soal tetap bersih supaya mudah dibaca |
| **HUD** | "SKOR: 40", "🧠 3/6", bullet 1–10 bernomor | bar atas ala game: ikon koleksi game itu (💎 kristal, 🎈 balon, 🧺 keranjang) + jumlahnya, dan **progres markas berupa jejak/langkah bergambar** (bukan angka 1–10) |
| **Kata-kata** | "Halaman 1/5", "SKOR", "Lanjut ➡️", "Coba Lagi", "Yuk coba!" | kata petualangan: "Jalan terus! ➡️", "Coba sekali lagi", "Misi 3 dari 10"; teks pujian tetap `pickPraise()` |
| **Kartu jawaban** | `.answer-card` sama dengan materi | objek game sesuai dunia: peti/kristal (Sound Hunt), keranjang anyaman (Raja Kelompok), halaman buku (Story Quest) — tetap target tap besar |
| **Juice** | confetti + goyang saat salah | setiap ketukan: kartu mengecil sedikit + klik; benar: objek memantul + bintang terbang ke HUD; salah: tetap merah + getar + tetot (aturan wajib); **hormati "kurangi gerakan"** (`prefers-reduced-motion` + opsi di Pengaturan) |
| **Transisi** | layar langsung berganti | masuk markas: judul markas muncul sebentar ("🌳 Whispering Woods") ±1 dtk; markas tuntas: layar kecil perayaan (bukan cuma kembali ke peta) |

### 4.3 Lapis Karakter, Alur & Aksi

| Komponen | Usulan |
|---|---|
| **Pendamping** | tiap game dijaga Raja-nya sendiri (sudah ada `rajaMascot()`), tampil kecil di pojok layar main dengan 3 keadaan: **diam** (berkedip), **senang** (lompat) saat benar, **berpikir** (tangan di dagu) saat salah — pola Kodi (Khan Kids). Mulai dengan SVG + CSS (tanpa library), bisa ditingkatkan ke Rive nanti. Kalimat pemandu (`guideLine`) keluar dari mulut karakter sebagai balon bicara. |
| **Misi besar per game** | kalimat tujuan di peta: Sound Hunt "Kumpulkan Sound Crystal untuk membuka gerbang istana", Balloon Hunt "Bantu Raja Balon menghias langit untuk festival", Raja Kelompok "Rapikan pasar sebelum pesta", dst. Semua markas tuntas → adegan penutup kecil (gerbang terbuka, festival). |
| **Hadiah koleksi** | 1 **stiker** per markas tuntas (42 stiker total), disimpan di halaman "Koleksi" — sesuai aturan PRD (bintang/stiker, **tanpa koin/toko**). |
| **Aksi game (integrasi intrinsik)** | ganti "tap 1 dari 4 kartu" dengan aksi yang sesuai dunia: **Raja Kelompok** — seret kata ke keranjang (tap tetap bisa sebagai alternatif aksesibilitas); **Sound Hunt** — kristal tersembunyi di balik semak/batu, tap semak untuk membukanya; **Story Quest** — halaman dibalik seperti buku, jawaban benar membuka ilustrasi halaman berikutnya. Balloon, Memory, Word Quest, Sentence Puzzle sudah punya aksi game. |
| **Tetap kid-friendly** | Raja = penjaga ramah, bukan bos yang dilawan; tanpa timer, nyawa, koin, leaderboard per game; musik ceria, tidak tegang. |

### 4.4 Tahapan

| Fase | Isi | Perkiraan kerja | Efek |
|---|---|---|---|
| **1. Suara** | modul audio (musik per game, efek aksi, ducking saat TTS, mati saat mic, tombol musik, pengaturan orang tua), pilih & unduh aset berlisensi | kecil–sedang, tanpa ilustrator | **paling terasa**: game langsung beda dari materi yang hening |
| **2. Tampilan** | peta jalan berkelok, latar per game, HUD koleksi, kata-kata petualangan, transisi masuk/tuntas markas, juice ketukan | sedang, butuh aset gambar (SVG sederhana bisa dibuat sendiri; lebih bagus dengan ilustrator) | layar tidak lagi mirip kuis |
| **3. Karakter & alur** | Raja pendamping 3 keadaan, misi & adegan penutup, stiker koleksi, aksi seret/buka untuk 3 game | sedang–besar | game terasa punya cerita & tujuan; paling kuat untuk motivasi jangka panjang |

---

## 5. Risiko & Hal yang Perlu Dijaga

- **Musik mengganggu soal mendengar** — wajib ducking; untuk markas yang intinya mendengar (Sound Hunt, Balloon Pemanasan/Jago, Raja Kelompok Jago) pertimbangkan musik lebih pelan lagi.
- **TTS browser tidak bisa di-duck otomatis oleh sistem** — pengecilan musik harus dipicu manual dari `speak()` (`speech.ts` sudah punya titik mulai/akhir ucapan).
- **iPhone mode senyap** & baterai — musik tidak bunyi di mode senyap iOS (perilaku normal); jangan jadikan musik syarat bermain.
- **Stimulasi berlebihan** — anak 3–5 th mudah kewalahan; batasi animasi bersamaan, sediakan "kurangi gerakan".
- **Ukuran unduhan** — 7 lagu × ±1 MB + efek ±200 KB; muat hanya saat game dibuka, cache browser.
- **Lisensi** — simpan sumber & lisensi tiap file (mis. `public/audio/LICENSES.md`); hindari musik tanpa lisensi jelas.
- **Aturan audio app** — musik termasuk audio yang harus berhenti saat pindah layar (CLAUDE.md "Audio Berhenti Begitu Diinterupsi").

---

## 6. Pertanyaan untuk User

1. Mulai dari **Fase 1 (suara)** dulu, atau langsung Fase 1 + 2?
2. Musik: **1 lagu per game** (7 suasana berbeda) atau **1 tema Game Hub** yang sama untuk semua game (lebih ringan)?
3. Aset: boleh pakai **Pixabay Music + Kenney (gratis)**, atau ada anggaran untuk musik/ilustrasi berbayar atau ilustrator?
4. Musik **menyala otomatis** saat masuk game (bisa dimatikan), atau **mati secara default** dan anak/orang tua yang menyalakan?
5. Untuk Fase 3: setuju mengganti aksi "tap kartu" menjadi **seret ke keranjang** (Raja Kelompok) dan **buka semak/peti** (Sound Hunt)?

---

## Sumber

- Kode: `app/src/games/*.ts`, `app/src/speech.ts` (`playCorrectTone`/`playWrongTone`/`playTryAgainTone`, `AudioContext`), `app/src/confetti.ts`, `app/src/scenery.ts` (`GAME_STAR_FIELD`, `rajaMascot`, `TRAIL_BEND_*`), `app/public/styles.css`
- Chocolate-covered broccoli: [Frontiers 2021](https://www.frontiersin.org/journals/psychology/articles/10.3389/fpsyg.2021.678380/full) · [Tedium](https://tedium.co/2019/05/09/edutainment-math-blaster-chocolate-covered-broccoli/) · [Nicky Case](https://blog.ncase.me/curse-of-the-chocolate-covered-broccoli-or-emotion-in-learning/) · [Edutopia](https://www.edutopia.org/blog/serious-games-not-chocolate-broccoli-matthew-farber)
- Integrasi intrinsik: [Habgood & Ainsworth 2011](https://tecfa.unige.ch/tecfa/teaching/BSEP/articles/Habgood_Ainsworth_2011.pdf) · [ERIC EJ922627](https://eric.ed.gov/?id=EJ922627) · [Habgood 2007 (tesis)](https://eprints.nottingham.ac.uk/10385/1/Habgood_2007_Final.pdf)
- Musik latar: [Background Music in Educational Games](https://www.researchgate.net/publication/220663800_Background_Music_in_Educational_Games_Motivational_Appeal_and_Cognitive_Impact) · [Springer 2019](https://link.springer.com/article/10.1007/s40299-019-00450-8) · [Wiley 2019](https://onlinelibrary.wiley.com/doi/full/10.1002/acp.3509) · [ScienceDirect 2025](https://www.sciencedirect.com/science/article/abs/pii/S0023969025000931)
- Anak & suara latar: [ASHA 2017](https://pubs.asha.org/doi/10.1044/2017_JSLHR-H-17-0070) · [Masked Speech Recognition in School-Age Children (PMC)](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC6733920/)
- Ducking: [Game Developer — Game Audio Theory: Ducking](https://www.gamedeveloper.com/audio/game-audio-theory-ducking) · [Clueso](https://www.clueso.io/glossary/audio-ducking)
- Game feel: [Juicy Game Design](https://www.researchgate.net/publication/336711817_Juicy_Game_Design_Understanding_the_Impact_of_Visual_Embellishments_on_Player_Experience) · [Cal Poly thesis](https://digitalcommons.calpoly.edu/cgi/viewcontent.cgi?article=2345&context=theses) · [Good Game Feel](https://www.academia.edu/95999203/Good_Game_Feel_An_Empirically_Grounded_Framework_for_Juicy_Design) · [Toptal UX sounds](https://www.toptal.com/designers/ux/ux-sounds-guide)
- Aplikasi referensi: [Teach Your Monster to Read (Common Sense)](https://www.commonsense.org/education/reviews/teach-your-monster-to-read) · [TYMTR mini-games](https://www.teachyourmonster.org/teach-your-monster-to-read-mini-games/) · [Khan Kids characters](https://khankids.zendesk.com/hc/en-us/articles/360049358751-Learn-more-about-the-characters-inside-Khan-Academy-Kids) · [Kodi Bear (svgapp)](https://svgapp.ai/app-mascots/khan-academy-kids/) · [Duolingo & Rive](https://dev.to/uianimation/how-duolingo-uses-rive-for-their-character-animation-and-how-you-can-build-a-similar-rive-mascot-5d19) · [Rethinking Progression (Game Developer)](https://www.gamedeveloper.com/design/rethinking-progression-in-mobile-puzzle-games) · [Candy Crush teardown](https://medium.com/product-teardown/product-teardown-03-candy-crush-saga-24780e21d415) · [Prodigy](https://www.prodigygame.com/main-en/blog/what-is-prodigy-math-game) · [Prodigy (Wikipedia)](https://en.wikipedia.org/wiki/Prodigy_Math_Game)
- Teknis & UX: [Chrome autoplay policy](https://developer.chrome.com/blog/autoplay) · [Web Audio, Autoplay & Games](https://developer.chrome.com/blog/web-audio-autoplay) · [MDN Web Audio best practices](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Best_practices) · [Mute button for kids](https://www.fishbonedice.com/a-mute-button-for-kids) · [Designing for kids](https://www.ungrammary.com/post/designing-for-kids-ux-design-tips-for-children-apps)
- Aset: [Kenney Music Jingles](https://kenney.nl/assets/music-jingles) · [Kenney UI Audio](https://kenney.nl/assets/ui-audio) · [Kenney RPG Audio](https://kenney.nl/assets/rpg-audio) · [Pixabay FAQ](https://pixabay.com/service/faq/) · [Pixabay Terms](https://pixabay.com/service/terms/) · [Pixabay kids adventure](https://pixabay.com/music/search/kids%20adventure/) · [Pixabay Music review 2026](https://www.michaelmusco.com/2026/02/pixabay-music-review.html)
