# Daftar Topik Vocabulary (Semua Level) — Referensi Cepat + Audit

Dokumen ini adalah **referensi cepat & snapshot audit** — beda dari [vocab.md](vocab.md) yang isinya log riset kronologis sesi-per-sesi. Di sini isinya: (1) daftar 65 topik Vocab yang HIDUP SAAT INI di `app/src/content.ts` per level, (2) audit redundansi (kata yang dipakai dobel lintas topik), (3) audit kesesuaian level terhadap standar CEFR/kurikulum resmi. Update dokumen ini kalau topik ditambah/diubah lagi — jangan biarkan basi.

Status per hari ini: **65 topik, 6 level, semua `hasContent:true`**. Lihat CLAUDE.md § "Target Kelengkapan Konten per Modul" untuk target resmi (≥10 topik/skill, ≥5 khusus Trailblazer).

## 1. Standar Referensi yang Dipakai

Dua standar dipakai berdampingan untuk menentukan level kesulitan tiap topik (sesuai riset di [vocab.md](vocab.md) §3):

| Standar | Cakupan | Sumber primer |
|---|---|---|
| **Cambridge English Young Learners (YLE)** — Pre-A1 Starters → A1 Movers → A2 Flyers, lanjut ke B1 Preliminary for Schools (PET) untuk Trailblazer | Wordlist resmi per tingkat, ~500 kata/tingkat, kumulatif (tingkat lebih tinggi TETAP menguji sebagian kosakata tingkat sebelumnya + menambah kata baru — bukan mengganti total) | [Pre A1 Starters, A1 Movers and A2 Flyers Wordlists (PDF resmi, Cambridge English)](https://www.cambridgeenglish.org/Images/739104-starters-movers-flyers-word-list-2025.pdf), [12 Cambridge Starters Vocabulary Topics](https://flyer.us/cambridge-starters-vocabulary/), [Cambridge English: Young Learners (Wikipedia, ringkasan struktur)](https://en.wikipedia.org/wiki/Cambridge_English:_Young_Learners) |
| **Kurikulum Merdeka — Capaian Pembelajaran Bahasa Inggris** (Kemendikbudristek, SK Kepala BSKAP No. 8 Tahun 2022) | Fase A (kelas 1–2 SD) → Fase B (kelas 3–4 SD) → Fase C (kelas 5–6 SD) → Fase D (kelas 7–9 SMP) → Fase E–F (SMA, target CEFR B1) | [Capaian Pembelajaran Bahasa Inggris pada Kurikulum Merdeka](https://kurikulummerdeka.com/capaian-pembelajaran-bahasa-inggris-pada-kurikulum-merdeka/) |

**Pemetaan level app ke standar** (established, lihat vocab.md §3 & CLAUDE.md):

| Level app | Usia target | Tingkat Cambridge YLE | Fase Kurikulum Merdeka |
|---|---|---|---|
| Little Stars | ~3–5 th | Pra-Cambridge (PAUD) | Fase Fondasi (PAUD) |
| Starter | ~5–7 th | Pre-A1 Starters | Fase A (kelas 1–2 SD) |
| Explorer | ~7–9 th | A1 Movers | Fase B (kelas 3–4 SD) |
| Adventurer | ~9–11 th | A1 Movers (+porsi kecil A2 Flyers) | Fase C (kelas 5–6 SD) |
| Achiever | ~11–13 th | A2 Flyers | Fase D (kelas 7–9 SMP) |
| Trailblazer | 12+ th (jalur lanjutan, bukan placement test) | B1 Preliminary for Schools (PET) | ≈ arah Fase E–F |

**Catatan penting soal desain kumulatif Cambridge YLE**: wordlist Movers/Flyers TIDAK "mengganti" wordlist Starters — banyak kata dasar (mis. hewan kebun binatang, makanan pokok) tetap official di tingkat lebih tinggi juga. Jadi kata yang SAMA muncul lagi di level lebih tinggi bukan otomatis salah — yang jadi masalah adalah kalau topik di level lebih tinggi **isinya 100% kata ulang tanpa tambahan kata yang genuinely lebih sulit** (lihat §4).

## 2. Daftar Lengkap 65 Topik (per Level)

### Little Stars (12 topik)
| id | Judul | Kata |
|---|---|---|
| `salam-sopan-santun` | Salam & Sopan Santun | Hello, Please, Thank You, Sorry, Yes, No, Good Morning, Good Afternoon, Good Night, Excuse Me |
| `kenal-warna` | Kenal Warna (Colors) | Red, Blue, Yellow, Green, Orange, Purple, Pink, Black, White, Brown |
| `angka-pertama` | Angka 1–10 | One … Ten |
| `bentuk` | Bentuk (Shapes) | Circle, Square, Triangle, Star, Heart, Diamond, Oval, Cross, Arrow, Moon |
| `keluargaku` | Keluargaku (My Family) | Mom, Dad, Baby, Sister, Brother, Grandma, Grandpa, Aunt, Uncle, Family |
| `tubuhku` | Anggota Tubuhku (My Body) | Head, Fingers, Knees, Toes, Eyes, Ears, Nose, Mouth, Hands, Hair |
| `hewan-peliharaan` | Hewan Peliharaan & Ternak | Dog, Cat, Lion, Bird, Cow, Frog, Horse, Mouse, Pig, Rabbit |
| `buah-buahan` | Buah-buahan (Fruits) | Apple, Banana, Orange, Grape, Watermelon, Strawberry, Mango, Pineapple, Pear, Peach |
| `mainan` | Mainan (Toys) | Ball, Doll, Kite, Balloon, Puzzle, Robot, Drum, Blocks, Yoyo, Car |
| `pakaian` | Pakaian (Clothes) | Shirt, Pants, Shoes, Socks, Hat, Dress, Jacket, Shorts, Gloves, Scarf |
| `kendaraan` | Kendaraan (Vehicles) | Car, Bus, Bike, Train, Airplane, Boat, Truck, Fire Truck, Ambulance, Helicopter |
| `perasaanku` | Perasaanku (My Feelings) | Happy, Sad, Angry, Scared, Sleepy, Hungry, Thirsty, Sick, Silly, Excited |

### Starter (10 topik)
| id | Judul | Kata |
|---|---|---|
| `angka-11-20` | Angka 11–20 | Eleven … Twenty |
| `hari-dalam-seminggu` | Hari dalam Seminggu | Monday … Sunday, Today, Tomorrow, Yesterday |
| `tempat-di-sekitar` | Tempat di Sekitar Kita | Park, Zoo, Beach, Market, Hospital, Farm, Bridge, Playground, Street, Mountain |
| `perkakas` | Perkakas & Alat Tukang | Hammer, Screwdriver, Wrench, Saw, Ladder, Toolbox, Bucket, Bolt, Rope, Flashlight |
| `makanan-favoritku` | Makanan Favoritku | Pizza, Burger, Sandwich, Ice Cream, Cake, Cookie, Chocolate, Cheese, Juice, Yogurt |
| `barang-di-rumah` | Barang di Rumah | Table, Bed, Sofa, Lamp, Television, Fridge, Mirror, Phone, Cupboard, Broom |
| `di-sekolah` | Di Sekolah | Coach, Classroom, Friend, Backpack, Library, Lunchbox, Uniform, Bell, Homework, **Locker** |
| `kondisi-cuaca` | Cuaca di Sekitarku | Rain, Wind, Snow, Storm, Rainbow, Hot, Cold, Umbrella, Fog, Lightning |
| `alam-sekitar` | Alam di Sekitar Kita | Sun, Moon, Sky, Cloud, Tree, Flower, Grass, River, Stone, Star |
| `hobi` | Hobiku | Drawing, Singing, Reading, Painting, Cooking, Camping, Fishing, Gardening, Collecting, Building |

### Explorer (10 topik)
| id | Judul | Kata |
|---|---|---|
| `keluarga`¹ | Jalan-jalan Seru (Fun Outings) | Cafe, Car Park, Circus, Funfair, Shopping Centre, Bus Stop, Bus Station, Tractor, Trip, Ticket |
| `angka`¹ | Nomor Urutan (Ordinal Numbers) | First … Tenth |
| `warna`¹ | Fasilitas Rumah (Home Features) | Elevator, Shower, Toothbrush, Toothpaste, Stairs, Downstairs, Mailbox, Seat, Blanket, Upstairs |
| `kesehatan` | Kesehatan | Cough, Fever, Headache, Stomachache, Bandage, Medicine, Injection, Sneeze, Rest, Healthy |
| `kata-sifat` | Kata Sifat & Lawan Kata | Big/Small, Fast/Slow, Long/Short, Heavy/Light, Clean/Dirty |
| `belanja-uang` | Belanja & Uang | Money, Coin, Price, Expensive, Wallet, Basket, Money Bag, Receipt, Cart, Piggy Bank |
| `waktu-harian` | Waktu dalam Sehari | Morning, Afternoon, Evening, Night, Noon, Week, Month, Year, Birthday, Holiday |
| `negara` | Negara-negara Dunia | Indonesia, England, America, Japan, China, Korea, France, Australia, India, Germany |
| `pesta-perayaan` | Pesta & Perayaan | Party, Present, Candle, Invitation, Guest, Decoration, Celebration, Message, Wish, Surprise |
| `peralatan-dapur` | Peralatan Dapur | Pot, Pan, Spoon, Fork, Knife, Plate, Bowl, Cup, Kettle, Chopsticks |

¹ id historis tidak match judul — topik lama direpurpose kontennya tapi id dipertahankan (progress key). Lihat §4.3.

### Adventurer (13 topik)
| id | Judul | Kata |
|---|---|---|
| `pekerjaan` | Pekerjaan (Jobs) | Doctor, Teacher, Police Officer, Chef, Farmer, Firefighter, Pilot, Singer, Astronaut, Artist |
| `alat-musik` | Musik & Alat Musik (Music & Instruments) | Guitar, Piano, Violin, Trumpet, Saxophone, Banjo, Accordion, Microphone, Headphones, Song |
| `makanan` | Makanan Pokok Sehari-hari (Everyday Staple Foods) | Bread, Rice, Egg, Milk, Water, Meat, Vegetable, Fruit, Noodle, Soup |
| `alat-sekolah` | Perlengkapan Belajar (Study Supplies) | Pencil, Book, Bag, Ruler, Notebook, Chair, Scissors, Crayon, Paint, Clock |
| `cuaca` | Cuaca & Musim (Weather & Seasons) | Sunny, Cloudy, Thunder, Breezy, Humid, Freezing, Drizzly, Thermometer, Season, Sunrise |
| `anggota-tubuh` | Tubuh & Otak (Body & Brain) | Eye, Ear, Nose, Mouth, Brain, Foot, Tooth, Tongue, Thumb, Arm |
| `transportasi` | Transportasi Unik Dunia (Unique Transport Around the World) | Scooter, Van, Sailboat, Motorcycle, Speedboat, Cable Car, Taxi, Tram, Rickshaw, Ship |
| `olahraga` | Olahraga (Sports) | Football, Basketball, Swimming, Running, Badminton, Volleyball, Tennis, Cycling, Jumping, Dancing |
| `rumah` | Ruangan di Rumah (Rooms of the House) | Kitchen, Bedroom, Bathroom, Living Room, Door, Window, Roof, Garden, Wall, Floor |
| `perasaan` | Perasaan yang Lebih Rumit (Complex Feelings) | Nervous, Confused, Worried, Amazed, Surprised, Calm, Tired, Bored, Proud, Shy |
| `bahan-material` | Bahan & Material | Wood, Plastic, Metal, Glass, Paper, Cotton, Wool, Leather, Rubber, Silk |
| `kata-kerja-harian` | Kata Kerja Sehari-hari | Cook, Sweep, Write, Draw, Cut, Wash, Open, Close, Push, Pull |
| `alam-lingkungan` | Alam & Lingkungan | Planet, Earth, Space, Forest, Ocean, Desert, Volcano, Island, Pollution, Recycle |

*Topik 1–10 (`pekerjaan`…`perasaan`) dibuat SEBELUM metodologi riset wordlist-per-level ada di project ini — lihat §4.2. Topik 11–13 (`bahan-material`/`kata-kerja-harian`/`alam-lingkungan`) sudah lewat riset A2 Flyers resmi.*

### Achiever (10 topik)
| id | Judul | Kata |
|---|---|---|
| `ciri-ciri-fisik` | Ciri-ciri Fisik | Tall, Beautiful, Handsome, Young, Old, Curly Hair, Straight Hair, Slim, Strong, Cute |
| `tempat-di-kota` | Tempat di Kota | Bank, Post Office, Police Station, Restaurant, Cinema, Museum, Stadium, Supermarket, Airport, Bakery |
| `arah-posisi` | Arah & Posisi | Left, Right, Straight, Near, Far, Turn, Corner, Between, In Front Of, Behind |
| `hiburan-waktu-luang` | Waktu Luang & Hiburan | Concert, Theater, Amusement Park, Board Game, Video Game, Chess, Skateboard, Camera, Comic Book, Magazine |
| `kata-kerja-lanjutan` | Kata Kerja Lanjutan | Climb, Catch, Throw, Hide, Laugh, Cry, Shout, Whisper, Jump, Fly |
| `teknologi-internet` | Teknologi & Internet | Computer, Internet, Website, Email, Password, Download, Upload, Screen, Keyboard, Mouse |
| `sifat-kepribadian` | Sifat Kepribadian | Kind, Brave, Honest, Funny, Clever, Friendly, Generous, Patient, Polite, Confident |
| `mata-pelajaran` | Mata Pelajaran Sekolah | Math, Science, English, History, Art, Music, Geography, Physical Education, Social Studies, Civics |
| `angka-puluhan` | Angka Puluhan ke Atas | Thirty … Million |
| `sifat-benda-lanjutan` | Sifat Benda Lanjutan | Wet, Dry, Soft, Hard, Sharp, Smooth, Rough, Loud, Quiet, Bright |

### Trailblazer (10 topik)
| id | Judul | Kata |
|---|---|---|
| `perjalanan-wisata` | Perjalanan & Wisata | Passport, Luggage, Journey, Destination, Tourist, Souvenir, Map, Ticket, Hotel, Sightseeing |
| `bahasa-komunikasi` | Bahasa & Komunikasi | Translate, Interpreter, Fluent, Accent, Pronunciation, Vocabulary, Dictionary, Bilingual, Grammar, Native Speaker |
| `pendidikan-akademik` | Pendidikan & Kehidupan Akademik | Campus, Degree, Scholarship, Lecture, Essay, Exam, Library, Graduate, Curriculum, Knowledge |
| `pendapat-pengalaman` | Pendapat & Pengalaman | Opinion, Experience, Achievement, Curious, Memorable, Disagree, Agree, Impressed, Prefer, Suggest |
| `hiburan-media` | Hiburan & Media | Documentary, Headline, Broadcast, Review, Subscribe, Streaming, Episode, Interview, Animation, Audience |
| `layanan-masyarakat` | Layanan Masyarakat | Pharmacy, Hairdresser, Dentist, Mechanic, Laundry, Petrol Station, Fire Station, Vet, Optician, Tailor |
| `peralatan-elektronik` | Peralatan Elektronik Rumah | Washing Machine, Air Conditioner, Printer, Radio, Rice Cooker, Electric Fan, Water Heater, Speaker, Charger, Doorbell |
| `bangunan-sekitar` | Bangunan di Sekitar Kita | Castle, Palace, Tower, Skyscraper, Apartment, Factory, Church, Mosque, Temple, Cottage |
| `pedesaan` | Pedesaan | Village, Field, Hill, Meadow, Barn, Path, Pond, Orchard, Countryside, Vineyard |
| `presentasi-diskusi` | Presentasi & Diskusi | Presentation, Debate, Evidence, Conclusion, Discussion, Perspective, Persuade, Summarize, Feedback, Volunteer |

## 3. Audit Redundansi (Kata Dipakai Dobel Lintas Topik)

Dicek via scan penuh 65 topik (bukan manual eyeball) — sekarang jadi **cek otomatis permanen** di `app/scripts/verify-vocab-content.mjs` (aturan #4, bagian `npm run build`). Kata baru yang tabrakan dgn topik lain akan GAGAL build kecuali masuk allowlist `ACCEPTED_CROSS_TOPIC_DUPLICATES` di skrip itu.

### 3.1 Sudah diperbaiki (sesi ini)
| Kata/Topik | Masalah | Perbaikan |
|---|---|---|
| `cuaca` (Adventurer) | 8/10 kata sama dgn `kondisi-cuaca` Starter (Rainy↔Rain, Windy↔Wind, dst — cuma beda bentuk kata) | Diganti 8 kata jadi Thunder/Breezy/Humid/Freezing/Drizzly/Thermometer/Season/Sunrise |
| `transportasi` (Adventurer) | 7/10 kata sama dgn `kendaraan` Little Stars | Diganti 7 kata jadi Scooter/Van/Sailboat/Speedboat/Cable Car/Tram/Rickshaw |
| `perasaan` (Adventurer) | 5/10 kata sama dgn `perasaanku` Little Stars | Diganti 5 kata jadi Nervous/Confused/Worried/Calm/Amazed |
| `anggota-tubuh` (Adventurer) | 6/10 kata sama (beda bentuk tunggal/jamak) dgn `tubuhku` Little Stars | Diganti 2 kata (Hand→Brain, Finger→Thumb) — 4 sisanya (Eye/Ear/Nose/Mouth) TIDAK diganti, lihat §3.2 |
| `Teacher` — `di-sekolah` (Starter) vs `pekerjaan` (Adventurer) | Duplikat PERSIS (kata+translasi+emoji sama) — sempat diperbaiki sesi riset lama ("Teacher→Coach") tapi regresi tertimpa sesi authoring berikutnya | `di-sekolah` kata "Teacher" diganti "Locker" |

### 3.2 Sengaja dibiarkan (masuk allowlist, alasan terdokumentasi)
| Kata | Topik | Kenapa dibiarkan |
|---|---|---|
| Orange | `kenal-warna` vs `buah-buahan` (Little Stars) | Homonim beda makna: warna vs buah, level sama |
| Star, Moon | `bentuk` (Little Stars) vs `alam-sekitar` (Starter) | Homonim beda makna: bentuk geometris vs benda langit |
| Mouse | `hewan-peliharaan` (Little Stars) vs `teknologi-internet` (Achiever) | Homonim total beda (hewan vs perangkat komputer), jarak level sangat jauh |
| Car | `mainan` vs `kendaraan` (Little Stars) | Translasi sudah dibedakan: "Mobil-mobilan" (mainan) vs "Mobil" (kendaraan asli) |
| Library | `di-sekolah` (Starter) vs `pendidikan-akademik` (Trailblazer) | Jarak level sangat jauh, konteks beda (perpustakaan sekolah vs kehidupan akademik) |
| Ticket | `keluarga`/Fun Outings (Explorer) vs `perjalanan-wisata` (Trailblazer) | Jarak level jauh, konteks beda (jalan-jalan santai vs wisata) |
| Lion | `hewan-peliharaan` (Little Stars) vs `binatang` (Adventurer) | Insiden dari fix emoji "kepala saja" (Fish→Lion) — overlap 1 dari 20 kata, bukan disengaja |
| Nose, Mouth | `tubuhku` (Little Stars) vs `anggota-tubuh` (Adventurer) | Residual dari §3.1 — TIDAK ada emoji pengganti yang genuinely relevan utk kata anggota tubuh lain (Shoulder/Neck/Elbow/dst tidak py emoji Unicode), lihat §5 |

### 3.3 Masih terbuka (belum ada keputusan user)
- **Makanan, Alat Sekolah (Adventurer)** — bukan soal *kata dobel* (overlap literal rendah), tapi soal *level* — lihat §4.1. `binatang` SUDAH diperbaiki, lihat §4.1.

### 3.4 Audit Copywriting Judul — "isi beda, judul terlihat sama"

Permintaan user: kata-kata di 8 topik Adventurer di atas SUDAH genuinely beda dari level lain (§3.1), TAPI JUDUL topiknya sendiri masih echo/near-identik ke judul level yang lebih rendah — orang tua yang cuma scroll cepat di Menu Belajar tetap baca "topik yang sama" walau isinya sudah beda. Ini kategori temuan BEDA dari §3 (kata dobel) & §4 (level konten) — soal PERSEPSI dari LABEL, bukan isi. Semua diganti (title-only, `desc`/`items`/emoji TIDAK disentuh):

| Topik (id) | Judul lama | Mirip dgn | Judul baru |
|---|---|---|---|
| `cuaca` (Adventurer) | Cuaca (Weather) | Starter "Cuaca di Sekitarku" | **Cuaca & Musim (Weather & Seasons)** |
| `anggota-tubuh` (Adventurer) | Anggota Tubuh (Body Parts) | Little Stars "Anggota Tubuhku" | **Tubuh & Otak (Body & Brain)** |
| `perasaan` (Adventurer) | Perasaan (Feelings) | Little Stars "Perasaanku" | **Perasaan yang Lebih Rumit (Complex Feelings)** |
| `transportasi` (Adventurer) | Transportasi (Transportation) | Little Stars "Kendaraan" (sinonim!) | **Transportasi Unik Dunia (Unique Transport Around the World)** |
| `makanan` (Adventurer) | Makanan (Food) | Starter "Makanan Favoritku" | **Makanan Pokok Sehari-hari (Everyday Staple Foods)** |
| `alat-sekolah` (Adventurer) | Alat Sekolah | Starter "Di Sekolah" | **Perlengkapan Belajar (Study Supplies)** |
| `rumah` (Adventurer) | Bagian Rumah (Parts of the House) | Explorer "Bagian Rumah **Lainnya**" | **Ruangan di Rumah (Rooms of the House)** |
| `warna` (Explorer) | Bagian Rumah Lainnya (More Parts of the House) | — (temuan tambahan) | **Fasilitas Rumah (Home Features)** |

**Temuan tambahan soal `warna` (Explorer)**: judul lamanya "Bagian Rumah **Lainnya/MORE**" scr bahasa mengasumsikan ada topik "Bagian Rumah" yang LEBIH DASAR & SUDAH dikenal anak SEBELUMNYA — tapi Explorer (~7–9 th) datang SEBELUM Adventurer (~9–11 th) dalam urutan level, jadi anak ketemu "Bagian Rumah Lainnya" duluan, padahal "Bagian Rumah"-nya sendiri belum pernah ada. Urutan logis judulnya kebalik. Diganti jadi "Fasilitas Rumah" (deskriptif, tidak berasumsi kronologi topik lain).

**Prinsip yang dipakai milih judul baru**: bukan cuma "tambah kata pembeda", tapi judul BARU mencerminkan SUDUT/ANGLE spesifik konten yang sudah diperbaiki di §3.1 (mis. `cuaca` sekarang isinya Thunder/Season/Sunrise — fenomena & musim, bukan lagi kata sifat cuaca dasar — judulnya ikut mencerminkan itu, bukan cuma "Cuaca 2").

## 4. Audit Kesesuaian Level/Standar

### 4.1 Temuan: 3 topik Adventurer terlalu dasar untuk tingkatnya

Cambridge Starters (Pre-A1, tingkat PALING DASAR — setara Little Stars/Starter app ini) py 12 topik resmi. Tiga di antaranya HAMPIR IDENTIK dgn topik Adventurer (A1 Movers, 2 tingkat di atasnya):

| Topik resmi Cambridge **Starters** (Pre-A1) | Topik Adventurer app ini | Overlap |
|---|---|---|
| **"At the Zoo"** — *"Animal names like bird, elephant, monkey, tiger, and snake"* | `binatang`: Elephant, Lion, Tiger, Monkey, Giraffe, Zebra, Bear, Penguin, Kangaroo, Panda | Hampir 1:1 — Elephant/Tiger/Monkey persis disebut jadi contoh resmi Starters |
| **"My Favorite Food"** — *"bread, cake, fruit and vegetables"* | `makanan`: Bread, Rice, Egg, Milk, Water, Meat, Vegetable, Fruit, Noodle, Soup | Bread/Fruit/Vegetable persis disebut jadi contoh resmi Starters |
| **"At School"** — *"classroom, pencil, pen"* | `alat-sekolah`: Pencil, Book, Bag, Ruler, Notebook, Chair, Scissors, Crayon, Paint, Clock | Pencil persis disebut, & alat tulis dasar lain sejenis |

**Kesimpulan**: karena wordlist Cambridge YLE kumulatif (§1), reuse kata dasar ITU SENDIRI bukan pelanggaran — tapi ketiga topik ini **isinya 100% kata level Starters, NOL kata yang genuinely level Movers/Flyers**. Ini beda kategori dari redundansi §3 (bukan soal "kata sama persis dgn topik lain di app ini", tapi "topiknya tidak py stretch difficulty sesuai level yang diklaim").

**`binatang` DIGANTI TOTAL jadi `alat-musik` (Musik & Alat Musik / Music & Instruments)** — permintaan user langsung ("remove topic binatang di adventurer atau ganti topik lain"), bukan cuma tambal kata. Sempat diperbaiki 1 putaran dulu (Elephant/Penguin/Kangaroo→Koala/Fox/Wolf, Monkey 🐒→🐵 — cek `unicodedata` resmi Python menemukan Elephant🐘/Penguin🐧/Kangaroo🦘 TERNYATA sudah lebih dulu melanggar aturan "kepala saja" krn cuma py 1 varian Unicode BUKAN "face"/kepala-dominan, tidak pernah ketahuan sebelumnya), TAPI user tetap minta topiknya diganti total — kemungkinan krn subjek "Animals" itu sendiri (apa pun katanya) masih terasa sama dgn Little Stars di mata user, bukan soal kata individual lagi.

**Kenapa DIGANTI, bukan DIHAPUS** — `binatang` dihapus akan menyisakan Adventurer 12 topik (masih ≥10, aman), TAPI Speaking Adventurer (`deskripsi-hewan`) & Grammar Adventurer (`comparatives`/`superlatives`) eksplisit didokumentasikan "REUSE domain binatang" sbg alasan pemilihan konten mereka (lihat CLAUDE.md § Speaking/Grammar) — walau secara KODE independen (bukan import array, jadi tidak akan error), menghapus total ninggalin domain itu tanpa "rumah" Vocab-nya sendiri. Ganti topik dgn subjek BARU (bukan animal) sekaligus MEMPERTAHANKAN 13 topik (Adventurer tetap "melebihi target" sesuai framing yg sudah didokumentasikan di banyak tempat) DAN kasih anak kosakata genuinely baru, bukan cuma mengurangi.

**Kenapa "Musik & Alat Musik"**: dicek dulu ke semua 65 topik existing — domain musik/alat musik BELUM pernah dipakai topik manapun (Little Stars `mainan` cuma py 1 kata "Drum" sbg mainan, bukan topik musik). 10 kata dipilih SEMUA dicek `unicodedata` resmi dulu (Guitar/Piano/Violin/Trumpet/Saxophone/Banjo/Accordion/Microphone/Song semua resolve baik) — 1 kandidat awal (Flute 🪈) DIBUANG krn `unicodedata` Python tidak bisa resolve nama resminya (indikasi emoji itu genuinely BARU/Unicode 15+, risiko tidak render di font/OS lama — diganti Headphones🎧 yg jauh lebih universal support-nya).

**Konsekuensi yg jujur dicatat**: Speaking `deskripsi-hewan` & Grammar `comparatives`/`superlatives` (Adventurer) SEKARANG tidak py "pasangan" Vocab `binatang` lagi — keduanya TETAP jalan normal (data independen, generik lintas skill), cuma rasionalnya "review kosakata sama lewat 2 modalitas" (CLAUDE.md) jadi tidak berlaku lagi utk domain ini spesifik. Anak tetap kenal kosakata hewan dasar dari Little Stars `hewan-peliharaan`.

`makanan` & `alat-sekolah` (temuan sama, "isinya 100% kata Starters-tier") masih belum diperbaiki — nunggu keputusan user apakah mau ditambal kata (pola binatang putaran 1) atau diganti total (pola binatang putaran 2/final).

### 4.2 Kenapa ini terjadi: topik Adventurer #1–10 dibuat sebelum ada metodologi riset

Riwayat di [vocab.md](vocab.md) §3D mengonfirmasi: Adventurer topik 1–10 (`pekerjaan`…`perasaan`) dibuat SEBELUM sesi ini mulai cross-check tiap topik baru ke wordlist Cambridge resmi per level. Topik 11–13 (ditambah belakangan) SUDAH lewat proses riset itu. Level lain (Little Stars/Starter/Explorer 7 topik baru/Achiever/Trailblazer) SEMUA dibangun lewat metodologi riset per-level yang terdokumentasi detail di vocab.md — jadi confidence lebih tinggi topiknya sudah sesuai tingkatnya, meski audit ini TIDAK mengecek ulang kata-per-kata semuanya (lihat §6 keterbatasan).

Dari 10 topik lama itu, yang SUDAH dicek silang thd wordlist Movers resmi di sesi riset lain (vocab.md §3C.2) dan dinyatakan cocok: `pekerjaan` (masuk kategori resmi Movers "Work"), `olahraga` (kategori resmi Movers "Sports"), `rumah` (kategori resmi Movers/Flyers "Home" — nama ruangan spesifik lebih maju dari sekadar "rumah/house" Starters). Ketiganya TIDAK perlu direvisi.

### 4.3 Spot-check topik legacy Explorer (id tidak match judul)

3 topik Explorer (`keluarga`→"Fun Outings", `angka`→"Ordinal Numbers", `warna`→"More Parts of the House") adalah konten PALING PERTAMA dibuat di app ini (sebelum id-nya sempat direpurpose kontennya, tapi id lama dipertahankan demi progress key). Dicek sesi ini terhadap 12 topik resmi Starters (§4.1) — ketiganya **TIDAK muncul** di daftar Starters (Circus/Funfair/Shopping Centre tidak disebut sbg contoh Starters "My Street"; Starters "Numbers" eksplisit cuma "one through twenty" tanpa ordinal; Starters "At Home" cuma sebut furniture dasar tanpa Elevator/Toothbrush/Mailbox) — konsisten dgn cakupan resmi kategori Movers "Places and Directions"/"Numbers"/"Home" yang lebih rinci. **Verdict: sesuai level, tidak perlu direvisi.**

## 5. Keterbatasan Emoji (Kenapa Beberapa Redundansi Tidak Bisa Ditutup Tuntas)

App ini py aturan wajib "emoji hewan WAJIB varian kepala saja" (CLAUDE.md). Ini membatasi kata pengganti yang tersedia:
- Body parts (Shoulder/Neck/Elbow/Chin/Wrist) — TIDAK py emoji Unicode representatif sama sekali → `anggota-tubuh` Adventurer masih nyisa Nose/Mouth dobel dgn Little Stars (§3.2).
- Hewan laut Movers-tier (Dolphin/Shark/Whale/Crocodile) — kebanyakan Unicode-nya full-body, gagal aturan "kepala saja". Ini yg sempat jadi kendala waktu `binatang` masih coba ditambal kata (putaran 1, §4.1) sebelum akhirnya diganti total jadi `alat-musik` — pelajaran: kalau domainnya (hewan) sendiri yg emoji-constrained, kadang lebih murah ganti SUBJEK topiknya drpd maksa cari kata pengganti terus-menerus.

Solusi permanen kalau user mau tuntas: custom icon SVG (pola sama yang sudah dipakai utk Zoo/Market/Classroom/Coach) — butuh keputusan/aset terpisah, bukan bagian audit ini.

## 6. Keterbatasan Audit Ini

- Audit redundansi (§3) MEKANIS & LENGKAP (scan semua 650 kata, sekarang otomatis di build). Bisa dipercaya penuh.
- Audit kesesuaian level (§4) BERSIFAT SPOT-CHECK, bukan cross-check kata-per-kata ke wordlist resmi utk SEMUA 65 topik — itu pekerjaan besar (~650 kata) di luar scope sesi ini. Yang sudah dicek independen sesi ini: 3 topik Adventurer bermasalah (§4.1) + 3 topik legacy Explorer (§4.3). Level lain diasumsikan sesuai berdasarkan riwayat riset vocab.md, bukan diverifikasi ulang dari nol.
- Kalau mau audit §4 diperluas ke SEMUA level/topik dgn tingkat kepercayaan yang sama seperti §4.1, itu pekerjaan riset terpisah (rekomendasi: prioritaskan level yang paling sering "dilompati" anak — Adventurer & Achiever, krn CLAUDE.md's "semua level di bawah harus terbuka penuh" bikin anak level tinggi tetap bisa buka level rendah, jadi mismatch level disini paling kerasa).

## Sumber

- [Pre A1 Starters, A1 Movers and A2 Flyers Wordlists (PDF resmi, Cambridge English)](https://www.cambridgeenglish.org/Images/739104-starters-movers-flyers-word-list-2025.pdf)
- [12 Cambridge Starters Vocabulary Topics (Updated 2025)](https://flyer.us/cambridge-starters-vocabulary/)
- [Cambridge English: Young Learners — Wikipedia](https://en.wikipedia.org/wiki/Cambridge_English:_Young_Learners)
- [A1 Movers Cambridge vocabulary list](https://flyer.us/a1-movers-cambridge-vocabulary-list/)
- [Cambridge A1 Movers Vocabulary: Topic Animals — azVocab](https://blog.azvocab.ai/en/cambridge-a1-movers-vocabulary-topic-animals/)
- [Cambridge Pre-A1 Starters Vocabulary: Topic Animals — azVocab](https://blog.azvocab.ai/en/cambridge-pre-a1-starters-vocabulary-topic-animals/)
- [Capaian Pembelajaran Bahasa Inggris pada Kurikulum Merdeka](https://kurikulummerdeka.com/capaian-pembelajaran-bahasa-inggris-pada-kurikulum-merdeka/)
