import type {
  AnyListeningTopic,
  AnyReadingTopic,
  AnySpeakingTopic,
  GrammarTopic,
  LevelKey,
  LevelMeta,
  ListeningDialogueTopic,
  ListeningNoteTopic,
  ListeningSentenceTopic,
  ListeningTopic,
  ReadingTopic,
  ReadingWordTopic,
  SkillKey,
  SkillMeta,
  SpeakingPhraseTopic,
  SpeakingTopic,
  VocabTopic,
} from './types';

/**
 * 6 level di tangga PRD §3, dalam urutan Peta Level. SEMUA 6 level sekarang
 * punya materi Vocabulary nyata (`hasContent:true`, lihat
 * `*_TOPICS_BY_LEVEL` di bawah) — bukan link mati atau konten palsu (lihat
 * §9 scope guardrail). Little Stars sengaja tanpa badge CEFR (PRD §7).
 * Trailblazer SENGAJA cuma 2 topik (bukan ≥10 spt 5 level lain) — PRD §9
 * mengunci level ini "low-effort, 1-2 modul preview", pengecualian yang
 * disahkan, bukan belum selesai.
 *
 * Little Stars, Starter, Achiever & Trailblazer `hasContent` DINYALAKAN
 * meski BARU Vocabulary yang diauthoring per level (Little Stars: Listening
 * PRD §4.1 belum; Starter/Achiever/Trailblazer: Listening/Speaking/Grammar/
 * Reading PRD §4.1 belum). Ini aman & disengaja: `visibleSkillKeys()`
 * (app.ts) otomatis SEMBUNYIKAN kartu skill yang topiknya kosong (pola sama
 * dgn Reading yang cuma ada di Adventurer), dan `poolFor()` (games/boss.ts)
 * otomatis JATUH ke pool Explorer utk skill yang masih kosong di level itu
 * — jadi Tantangan Bos tetap jalan (Vocabulary dari materi sendiri, skill
 * lain sementara dari Explorer) tanpa layar kosong/rusak. GAP YANG BELUM
 * DITUTUP (laporkan ke user, jangan dianggap selesai diam-diam): lihat
 * `materi/vocab.md` §6 — begitu skill baru diauthoring, tambahkan ke
 * `*_TOPICS_BY_LEVEL` yang sesuai, tidak perlu ubah flag `hasContent` lagi.
 * Starter JUGA butuh `CONTENT_AVAILABLE` di `portal/lib/placement-
 * scoring.ts` diupdate (sudah dilakukan) — Achiever & Trailblazer, spt
 * Little Stars, di luar `PlacementLevelKey` sama sekali (cek `portal/lib/
 * placement-test-data.ts` — cuma `'starter'|'explorer'|'adventurer'`), jadi
 * TIDAK perlu `CONTENT_AVAILABLE` diupdate utk keduanya.
 */
export const LEVELS: LevelMeta[] = [
  { key: 'little-stars', name: 'Little Stars', emoji: '🌟', cefr: '', age: 'Usia 3–5 tahun', hasContent: true },
  // Starter `hasContent:true` sejak Vocabulary diauthoring (materi/vocab.md
  // §3B/§5B) — Listening/Speaking/Grammar level ini (PRD §4.1, target akhir
  // beda dari Little Stars yang cuma Vocab+Listening) masih menyusul, sama
  // pola fallback dgn Little Stars (lihat komentar di atas).
  { key: 'starter', name: 'Starter', emoji: '🌱', cefr: '≈ Pre-A1', age: 'Usia 5–7 tahun', hasContent: true },
  { key: 'explorer', name: 'Explorer', emoji: '🧭', cefr: '≈ Pre-A1 → A1', age: 'Usia 7–9 tahun', hasContent: true },
  { key: 'adventurer', name: 'Adventurer', emoji: '🚀', cefr: '≈ A1', age: 'Usia 9–11 tahun', hasContent: true },
  // Achiever `hasContent:true` sejak Vocabulary diauthoring (materi/vocab.md
  // §3E/§5E) — level ini mulai dari NOL topik (beda dari Adventurer yang
  // cuma digenapkan), 10 topik dipetakan dari wordlist Cambridge A2 Flyers
  // yang sengaja disisakan sesi Adventurer sebelumnya.
  { key: 'achiever', name: 'Achiever', emoji: '🏆', cefr: '≈ A1 → A2', age: 'Usia 11–13 tahun', hasContent: true },
  // Trailblazer `hasContent:true` sejak Vocabulary diauthoring — TAPI cuma
  // 2 topik (materi/vocab.md §3F/§5F), bukan ≥10 spt level lain, krn PRD §9
  // SUDAH mengunci level ini sbg "low-effort, 1-2 modul preview" sejak
  // sebelum inisiatif Vocabulary ini — pengecualian yang disahkan, jangan
  // "digenapkan" ke 10 topik tanpa alasan baru dari user.
  {
    key: 'trailblazer',
    name: 'Trailblazer',
    emoji: '✨',
    cefr: '≈ B1',
    age: 'Usia 12+ tahun · jalur lanjutan',
    hasContent: true,
  },
];

/** Level aktif v1 — dipakai di header/rail (PRD §7: nama+emoji utama, CEFR sekunder). */
export const LEVEL: LevelMeta = LEVELS.find((l) => l.key === 'explorer')!;

/**
 * Nama "raja" Tantangan Bos per level — istilah "Bos" sendirian dianggap
 * terlalu generik/dewasa (permintaan user), diganti "Raja" + nama hewan yang
 * SAMA dengan emoji `BOSS_AVATAR` di app.ts (🐰🐺🦁🐉🦅🦄) supaya nama & wajah
 * bosnya konsisten satu sama lain. Dipasangkan dengan "Markas" di peta
 * (mis. "Markas Raja Singa") — lihat scenery.ts untuk riwayat iterasi nama
 * "markas".
 */
export const BOSS_NAME: Record<LevelKey, string> = {
  'little-stars': 'Raja Kelinci',
  starter: 'Raja Serigala',
  explorer: 'Raja Singa',
  adventurer: 'Raja Naga',
  achiever: 'Raja Elang',
  trailblazer: 'Raja Unicorn',
};

/**
 * Warna per-skill = warna sekunder (cuma muncul di dalam konteks skill-nya),
 * bukan warna merek. Vocabulary sengaja dipindah dari indigo ke grape supaya
 * tidak berdekatan dengan warna utama app pembanding.
 */
export const SKILL_META: Record<SkillKey, SkillMeta> = {
  vocabulary: {
    label: 'Vocabulary',
    emoji: '📚',
    tagline: 'Kenal kata baru',
    activities: ['Tebak & Cocokkan', 'Eja Kata', 'Contoh Penggunaan'],
    accent: 'var(--c-vocab)',
    accentBg: 'var(--c-vocab-bg)',
  },
  listening: {
    label: 'Listening',
    emoji: '🎧',
    tagline: 'Dengar & pahami',
    activities: ['Dengar & Pilih', 'Cerita Mini'],
    accent: 'var(--c-listen)',
    accentBg: 'var(--c-listen-bg)',
  },
  speaking: {
    label: 'Speaking',
    emoji: '🗣️',
    tagline: 'Berani ngomong',
    activities: ['Ucapkan & Cek', 'Mini-Roleplay'],
    accent: 'var(--c-speak)',
    accentBg: 'var(--c-speak-bg)',
  },
  grammar: {
    label: 'Grammar',
    emoji: '✏️',
    tagline: 'Susun pola kalimat',
    activities: ['Susun Kalimat', 'Bikin Sendiri'],
    accent: 'var(--c-gram)',
    accentBg: 'var(--c-gram-bg)',
  },
  // Token warna --c-read/--c-read-bg sudah ada sejak First Placement Test
  // (reading-passage), dipakai ulang di sini, bukan warna baru.
  reading: {
    label: 'Reading',
    emoji: '📖',
    tagline: 'Baca & pahami sendiri',
    activities: ['Baca & Jawab', 'Cerita Mini'],
    accent: 'var(--c-read)',
    accentBg: 'var(--c-read-bg)',
  },
};

/**
 * Explorer (≈Pre-A1 → A1, 7–9 th) — level KETIGA yang diperluas (Little
 * Stars & Starter sudah lebih dulu, materi/vocab.md §3A/§3B). Beda dari dua
 * level itu: Explorer SUDAH punya 3 topik sejak awal (`keluarga`/`angka`/
 * `warna`, TIDAK diubah/dihapus di sini — anak yang progresnya sudah ada di
 * 3 topik itu tidak boleh kehilangan data), cuma belum penuhi target
 * CLAUDE.md ≥10 topik/skill. 7 topik BARU di bawah (setelah 'warna')
 * menggenapkannya ke 10, dipetakan dari wordlist RESMI Cambridge A1 Movers
 * (riset & sumber lengkap: materi/vocab.md §3C) — beda dari Starter yang
 * dipetakan dari Pre A1 Starters, Explorer naik satu tingkat krn CEFR
 * target levelnya sendiri sudah "→ A1", bukan lagi "pra-Starters".
 * 6 kategori Movers yang overlap berat dgn level lain (Clothes, Body,
 * Transport, Sports, Numbers-1-10-ish, Feelings) SENGAJA dilewati (pola sama
 * dgn Starter §3B.2) — 7 kategori yang dipilih (Health, Characteristics,
 * Places/Shopping, Time, World Around Us/Countries, Leisure/Party, School)
 * genuinely belum disentuh level manapun. Id topik dicek terhadap SEMUA id
 * yang sudah dipakai 4 level lain (materi/vocab.md §2.2/§4) — tidak ada yang
 * tabrakan.
 */
export const VOCAB_TOPICS: VocabTopic[] = [
  {
    id: 'keluarga',
    // Judul bilingual (permintaan user) — Indonesia dulu, Inggris di
    // kurung, konsisten di semua topik Vocab.
    title: 'Anggota Keluarga (Family Members)',
    desc: '10 kata',
    items: [
      { en: 'Mother', id: 'Ibu', emoji: '👩', example: { en: 'This is my mother.', id: 'Ini ibuku.', emoji: '👩' } },
      { en: 'Father', id: 'Ayah', emoji: '👨', example: { en: 'This is my father.', id: 'Ini ayahku.', emoji: '👨' } },
      { en: 'Sister', id: 'Kakak/Adik Perempuan', emoji: '👧', example: { en: 'I love my sister.', id: 'Aku sayang kakak/adik perempuanku.', emoji: '👧' } },
      { en: 'Brother', id: 'Kakak/Adik Laki-laki', emoji: '👦', example: { en: 'I play with my brother.', id: 'Aku main dengan kakak/adik laki-lakiku.', emoji: '👦' } },
      { en: 'Grandmother', id: 'Nenek', emoji: '👵', example: { en: 'This is my grandmother.', id: 'Ini nenekku.', emoji: '👵' } },
      { en: 'Grandfather', id: 'Kakek', emoji: '👴', example: { en: 'This is my grandfather.', id: 'Ini kakekku.', emoji: '👴' } },
      { en: 'Uncle', id: 'Paman', emoji: '🧔', example: { en: 'This is my uncle.', id: 'Ini pamanku.', emoji: '🧔' } },
      { en: 'Aunt', id: 'Bibi', emoji: '👩‍🦱', example: { en: 'This is my aunt.', id: 'Ini bibiku.', emoji: '👩‍🦱' } },
      { en: 'Cousin', id: 'Sepupu', emoji: '🧑', example: { en: 'I play with my cousin.', id: 'Aku main dengan sepupuku.', emoji: '🧑' } },
      { en: 'Baby', id: 'Bayi', emoji: '👶', example: { en: 'The baby is sleeping.', id: 'Bayinya sedang tidur.', emoji: '👶' } },
    ],
  },
  {
    id: 'angka',
    title: 'Angka 1–10 (Numbers 1–10)',
    desc: '10 kata',
    items: [
      { en: 'One', id: 'Satu', emoji: '1️⃣', example: { en: 'I have one apple.', id: 'Aku punya satu apel.', emoji: '🍎' } },
      { en: 'Two', id: 'Dua', emoji: '2️⃣', example: { en: 'Budi has two apples.', id: 'Budi punya dua apel.', emoji: '🍎🍎' } },
      { en: 'Three', id: 'Tiga', emoji: '3️⃣', example: { en: 'I see three cats.', id: 'Aku lihat tiga kucing.', emoji: '🐱🐱🐱' } },
      { en: 'Four', id: 'Empat', emoji: '4️⃣', example: { en: 'She has four balls.', id: 'Dia punya empat bola.', emoji: '⚽⚽⚽⚽' } },
      { en: 'Five', id: 'Lima', emoji: '5️⃣', example: { en: 'I have five fingers.', id: 'Aku punya lima jari.', emoji: '✋' } },
      { en: 'Six', id: 'Enam', emoji: '6️⃣', example: { en: 'There are six eggs.', id: 'Ada enam telur.', emoji: '🥚' } },
      { en: 'Seven', id: 'Tujuh', emoji: '7️⃣', example: { en: 'She has seven pencils.', id: 'Dia punya tujuh pensil.', emoji: '✏️' } },
      { en: 'Eight', id: 'Delapan', emoji: '8️⃣', example: { en: 'I see eight stars.', id: 'Aku lihat delapan bintang.', emoji: '⭐' } },
      { en: 'Nine', id: 'Sembilan', emoji: '9️⃣', example: { en: 'We have nine books.', id: 'Kami punya sembilan buku.', emoji: '📚' } },
      { en: 'Ten', id: 'Sepuluh', emoji: '🔟', example: { en: 'He has ten fish.', id: 'Dia punya sepuluh ikan.', emoji: '🐟' } },
    ],
  },
  {
    id: 'warna',
    title: 'Warna (Colors)',
    desc: '10 kata',
    // "Sun/Matahari" dulu ikut di sini padahal bukan nama warna — diganti
    // set warna asli (permintaan user: minimal 10 kata per materi), pola
    // circle emoji sama dgn s2 di placement-test-data.ts (merah/biru/
    // hijau/kuning/putih/hitam) + oranye/ungu/pink/cokelat.
    items: [
      { en: 'Red', id: 'Merah', emoji: '🔴', example: { en: 'The apple is red.', id: 'Apel itu merah.', emoji: '🍎' } },
      { en: 'Blue', id: 'Biru', emoji: '🔵', example: { en: 'The sky is blue.', id: 'Langitnya biru.', emoji: '🌤️' } },
      { en: 'Green', id: 'Hijau', emoji: '🟢', example: { en: 'The grass is green.', id: 'Rumputnya hijau.', emoji: '🌿' } },
      { en: 'Yellow', id: 'Kuning', emoji: '🟡', example: { en: 'The banana is yellow.', id: 'Pisangnya kuning.', emoji: '🍌' } },
      { en: 'Orange', id: 'Oranye', emoji: '🟠', example: { en: 'The orange is orange.', id: 'Jeruknya berwarna oranye.', emoji: '🍊' } },
      { en: 'Purple', id: 'Ungu', emoji: '🟣', example: { en: 'The grapes are purple.', id: 'Anggurnya ungu.', emoji: '🍇' } },
      { en: 'Pink', id: 'Merah Muda', emoji: '🩷', example: { en: 'Her dress is pink.', id: 'Gaunnya merah muda.', emoji: '👗' } },
      { en: 'Black', id: 'Hitam', emoji: '⚫', example: { en: 'The cat is black.', id: 'Kucingnya hitam.', emoji: '🐈‍⬛' } },
      { en: 'White', id: 'Putih', emoji: '⚪', example: { en: 'The cloud is white.', id: 'Awannya putih.', emoji: '☁️' } },
      { en: 'Brown', id: 'Cokelat', emoji: '🟤', example: { en: 'The bear is brown.', id: 'Beruangnya cokelat.', emoji: '🐻' } },
    ],
  },
  {
    id: 'kesehatan',
    title: 'Kesehatan (Health)',
    desc: '10 kata',
    items: [
      { en: 'Cough', id: 'Batuk', emoji: '😷', example: { en: 'I have a cough.', id: 'Aku batuk.', emoji: '😷' } },
      { en: 'Fever', id: 'Demam', emoji: '🤒', example: { en: 'I have a fever.', id: 'Aku demam.', emoji: '🤒' } },
      { en: 'Headache', id: 'Sakit Kepala', emoji: '🤕', example: { en: 'I have a headache.', id: 'Aku sakit kepala.', emoji: '🤕' } },
      { en: 'Stomachache', id: 'Sakit Perut', emoji: '😖', example: { en: 'I have a stomachache.', id: 'Aku sakit perut.', emoji: '😖' } },
      { en: 'Bandage', id: 'Perban', emoji: '🩹', example: { en: 'I wear a bandage.', id: 'Aku memakai perban.', emoji: '🩹' } },
      { en: 'Medicine', id: 'Obat', emoji: '💊', example: { en: 'I take medicine.', id: 'Aku minum obat.', emoji: '💊' } },
      { en: 'Injection', id: 'Suntikan', emoji: '💉', example: { en: 'I get an injection.', id: 'Aku mendapat suntikan.', emoji: '💉' } },
      { en: 'Sneeze', id: 'Bersin', emoji: '🤧', example: { en: 'I sneeze a lot.', id: 'Aku banyak bersin.', emoji: '🤧' } },
      { en: 'Rest', id: 'Istirahat', emoji: '🛌', example: { en: 'I need rest.', id: 'Aku butuh istirahat.', emoji: '🛌' } },
      { en: 'Healthy', id: 'Sehat', emoji: '💪', example: { en: 'I am healthy.', id: 'Aku sehat.', emoji: '💪' } },
    ],
  },
  {
    id: 'kata-sifat',
    title: 'Kata Sifat & Lawan Kata (Adjectives & Opposites)',
    desc: '10 kata',
    items: [
      { en: 'Big', id: 'Besar', emoji: '🐘', example: { en: 'The elephant is big.', id: 'Gajahnya besar.', emoji: '🐘' } },
      { en: 'Small', id: 'Kecil', emoji: '🐭', example: { en: 'The mouse is small.', id: 'Tikusnya kecil.', emoji: '🐭' } },
      { en: 'Fast', id: 'Cepat', emoji: '🐆', example: { en: 'The cheetah is fast.', id: 'Citahnya cepat.', emoji: '🐆' } },
      { en: 'Slow', id: 'Lambat', emoji: '🐢', example: { en: 'The turtle is slow.', id: 'Kura-kuranya lambat.', emoji: '🐢' } },
      { en: 'Long', id: 'Panjang', emoji: '🐍', example: { en: 'The snake is long.', id: 'Ularnya panjang.', emoji: '🐍' } },
      { en: 'Short', id: 'Pendek', emoji: '✏️', example: { en: 'The pencil is short.', id: 'Pensilnya pendek.', emoji: '✏️' } },
      { en: 'Heavy', id: 'Berat', emoji: '🪨', example: { en: 'The rock is heavy.', id: 'Batunya berat.', emoji: '🪨' } },
      { en: 'Light', id: 'Ringan', emoji: '🪶', example: { en: 'The feather is light.', id: 'Bulunya ringan.', emoji: '🪶' } },
      { en: 'Clean', id: 'Bersih', emoji: '🧼', example: { en: 'My hands are clean.', id: 'Tanganku bersih.', emoji: '🧼' } },
      { en: 'Dirty', id: 'Kotor', emoji: '🐷', example: { en: 'The pig is dirty.', id: 'Babinya kotor.', emoji: '🐷' } },
    ],
  },
  {
    id: 'belanja-uang',
    title: 'Belanja & Uang (Shopping & Money)',
    desc: '10 kata',
    items: [
      { en: 'Money', id: 'Uang', emoji: '💵', example: { en: 'I have money.', id: 'Aku punya uang.', emoji: '💵' } },
      { en: 'Coin', id: 'Koin', emoji: '🪙', example: { en: 'I have a coin.', id: 'Aku punya koin.', emoji: '🪙' } },
      { en: 'Price', id: 'Harga', emoji: '🏷️', example: { en: 'What is the price?', id: 'Berapa harganya?', emoji: '🏷️' } },
      { en: 'Expensive', id: 'Mahal', emoji: '💎', example: { en: 'This is expensive.', id: 'Ini mahal.', emoji: '💎' } },
      { en: 'Wallet', id: 'Dompet', emoji: '👛', example: { en: 'I keep money in my wallet.', id: 'Aku menyimpan uang di dompetku.', emoji: '👛' } },
      { en: 'Basket', id: 'Keranjang', emoji: '🧺', example: { en: 'I put fruit in the basket.', id: 'Aku memasukkan buah ke keranjang.', emoji: '🧺' } },
      { en: 'Cashier', id: 'Kasir', emoji: '🧑‍💼', example: { en: 'The cashier helps me pay.', id: 'Kasir membantuku membayar.', emoji: '🧑‍💼' } },
      { en: 'Receipt', id: 'Struk', emoji: '🧾', example: { en: 'I get a receipt.', id: 'Aku dapat struk.', emoji: '🧾' } },
      { en: 'Cart', id: 'Troli', emoji: '🛒', example: { en: 'I push the cart.', id: 'Aku mendorong troli.', emoji: '🛒' } },
      { en: 'Piggy Bank', id: 'Celengan', emoji: '🐷', example: { en: 'I save money in my piggy bank.', id: 'Aku menabung di celenganku.', emoji: '🐷' } },
    ],
  },
  {
    id: 'waktu-harian',
    title: 'Waktu dalam Sehari (Times of Day & Calendar)',
    desc: '10 kata',
    items: [
      { en: 'Morning', id: 'Pagi', emoji: '🌅', example: { en: 'I wake up in the morning.', id: 'Aku bangun di pagi hari.', emoji: '🌅' } },
      { en: 'Afternoon', id: 'Siang', emoji: '☀️', example: { en: 'I eat lunch in the afternoon.', id: 'Aku makan siang di waktu siang.', emoji: '☀️' } },
      { en: 'Evening', id: 'Sore', emoji: '🌇', example: { en: 'I play in the evening.', id: 'Aku bermain di waktu sore.', emoji: '🌇' } },
      { en: 'Night', id: 'Malam', emoji: '🌃', example: { en: 'I sleep at night.', id: 'Aku tidur di malam hari.', emoji: '🌃' } },
      { en: 'Noon', id: 'Tengah Hari', emoji: '🕛', example: { en: 'We eat at noon.', id: 'Kami makan di tengah hari.', emoji: '🕛' } },
      { en: 'Week', id: 'Seminggu', emoji: '🗓️', example: { en: 'I go to school every week.', id: 'Aku pergi ke sekolah setiap minggu.', emoji: '🗓️' } },
      { en: 'Month', id: 'Bulan', emoji: '📅', example: { en: 'I visit grandma every month.', id: 'Aku mengunjungi nenek setiap bulan.', emoji: '📅' } },
      { en: 'Year', id: 'Tahun', emoji: '🎊', example: { en: 'I have a birthday every year.', id: 'Aku ulang tahun setiap tahun.', emoji: '🎊' } },
      { en: 'Birthday', id: 'Ulang Tahun', emoji: '🎂', example: { en: 'Happy birthday!', id: 'Selamat ulang tahun!', emoji: '🎂' } },
      { en: 'Holiday', id: 'Liburan', emoji: '🏖️', example: { en: 'We go on holiday.', id: 'Kami pergi berlibur.', emoji: '🏖️' } },
    ],
  },
  {
    id: 'negara',
    title: 'Negara-negara Dunia (Countries of the World)',
    desc: '10 kata',
    items: [
      { en: 'Indonesia', id: 'Indonesia', emoji: '🇮🇩', example: { en: 'I am from Indonesia.', id: 'Aku berasal dari Indonesia.', emoji: '🇮🇩' } },
      { en: 'England', id: 'Inggris', emoji: '🇬🇧', example: { en: 'She is from England.', id: 'Dia berasal dari Inggris.', emoji: '🇬🇧' } },
      { en: 'America', id: 'Amerika', emoji: '🇺🇸', example: { en: 'He is from America.', id: 'Dia berasal dari Amerika.', emoji: '🇺🇸' } },
      { en: 'Japan', id: 'Jepang', emoji: '🇯🇵', example: { en: 'I visit Japan.', id: 'Aku mengunjungi Jepang.', emoji: '🇯🇵' } },
      { en: 'China', id: 'Tiongkok', emoji: '🇨🇳', example: { en: 'I visit China.', id: 'Aku mengunjungi Tiongkok.', emoji: '🇨🇳' } },
      { en: 'Korea', id: 'Korea', emoji: '🇰🇷', example: { en: 'I visit Korea.', id: 'Aku mengunjungi Korea.', emoji: '🇰🇷' } },
      { en: 'France', id: 'Prancis', emoji: '🇫🇷', example: { en: 'I visit France.', id: 'Aku mengunjungi Prancis.', emoji: '🇫🇷' } },
      { en: 'Australia', id: 'Australia', emoji: '🇦🇺', example: { en: 'I visit Australia.', id: 'Aku mengunjungi Australia.', emoji: '🇦🇺' } },
      { en: 'India', id: 'India', emoji: '🇮🇳', example: { en: 'I visit India.', id: 'Aku mengunjungi India.', emoji: '🇮🇳' } },
      { en: 'Germany', id: 'Jerman', emoji: '🇩🇪', example: { en: 'I visit Germany.', id: 'Aku mengunjungi Jerman.', emoji: '🇩🇪' } },
    ],
  },
  {
    id: 'pesta-perayaan',
    title: 'Pesta & Perayaan (Party & Celebrations)',
    desc: '10 kata',
    items: [
      { en: 'Party', id: 'Pesta', emoji: '🎉', example: { en: 'I have a party.', id: 'Aku mengadakan pesta.', emoji: '🎉' } },
      { en: 'Present', id: 'Hadiah', emoji: '🎁', example: { en: 'I open my present.', id: 'Aku membuka hadiahku.', emoji: '🎁' } },
      { en: 'Candle', id: 'Lilin', emoji: '🕯️', example: { en: 'I blow the candle.', id: 'Aku meniup lilin.', emoji: '🕯️' } },
      { en: 'Invitation', id: 'Undangan', emoji: '💌', example: { en: 'I send an invitation.', id: 'Aku mengirim undangan.', emoji: '💌' } },
      { en: 'Guest', id: 'Tamu', emoji: '🧑‍🤝‍🧑', example: { en: 'We welcome the guest.', id: 'Kami menyambut tamu.', emoji: '🧑‍🤝‍🧑' } },
      { en: 'Decoration', id: 'Hiasan', emoji: '🎊', example: { en: 'We put up decoration.', id: 'Kami memasang hiasan.', emoji: '🎊' } },
      { en: 'Celebration', id: 'Perayaan', emoji: '🥳', example: { en: 'We have a celebration.', id: 'Kami mengadakan perayaan.', emoji: '🥳' } },
      { en: 'Card', id: 'Kartu', emoji: '✉️', example: { en: 'I make a card.', id: 'Aku membuat kartu.', emoji: '✉️' } },
      { en: 'Wish', id: 'Harapan', emoji: '⭐', example: { en: 'I make a wish.', id: 'Aku membuat harapan.', emoji: '⭐' } },
      { en: 'Surprise', id: 'Kejutan', emoji: '😲', example: { en: 'This is a surprise!', id: 'Ini kejutan!', emoji: '😲' } },
    ],
  },
  {
    id: 'peralatan-dapur',
    title: 'Peralatan Dapur (Kitchen Tools)',
    desc: '10 kata',
    items: [
      { en: 'Pot', id: 'Panci', emoji: '🍲', example: { en: 'Mom cooks in the pot.', id: 'Ibu memasak di panci.', emoji: '🍲' } },
      { en: 'Pan', id: 'Wajan', emoji: '🍳', example: { en: 'Dad fries eggs in the pan.', id: 'Ayah menggoreng telur di wajan.', emoji: '🍳' } },
      { en: 'Spoon', id: 'Sendok', emoji: '🥄', example: { en: 'I eat with a spoon.', id: 'Aku makan dengan sendok.', emoji: '🥄' } },
      { en: 'Fork', id: 'Garpu', emoji: '🍴', example: { en: 'I eat with a fork.', id: 'Aku makan dengan garpu.', emoji: '🍴' } },
      { en: 'Knife', id: 'Pisau', emoji: '🔪', example: { en: 'Mom cuts with a knife.', id: 'Ibu memotong dengan pisau.', emoji: '🔪' } },
      { en: 'Plate', id: 'Piring', emoji: '🍽️', example: { en: 'I put food on the plate.', id: 'Aku menaruh makanan di piring.', emoji: '🍽️' } },
      { en: 'Bowl', id: 'Mangkuk', emoji: '🥣', example: { en: 'I eat soup from a bowl.', id: 'Aku makan sup dari mangkuk.', emoji: '🥣' } },
      { en: 'Cup', id: 'Cangkir', emoji: '☕', example: { en: 'I drink from a cup.', id: 'Aku minum dari cangkir.', emoji: '☕' } },
      { en: 'Kettle', id: 'Ketel', emoji: '🫖', example: { en: 'Mom boils water in the kettle.', id: 'Ibu merebus air di ketel.', emoji: '🫖' } },
      { en: 'Chopsticks', id: 'Sumpit', emoji: '🥢', example: { en: 'I eat with chopsticks.', id: 'Aku makan dengan sumpit.', emoji: '🥢' } },
    ],
  },
];

export const LISTENING_TOPICS: ListeningTopic[] = [
  {
    id: 'toko',
    title: 'Di Toko',
    scene: '🏪',
    desc: 'Cerita belanja',
    primer: [
      { en: 'How much is this?', id: 'Berapa harganya?' },
      { en: 'I want to buy an apple.', id: 'Saya mau beli apel.' },
    ],
    drill: [
      { en: 'I want a red apple.', opts: [{ emoji: '🍎', ok: true }, { emoji: '🍌' }, { emoji: '🍇' }] },
      { en: 'Can I have a banana?', opts: [{ emoji: '🍌', ok: true }, { emoji: '🍉' }, { emoji: '🍎' }] },
    ],
    // `story` di 3 topik Listening ini (+ READING_TOPICS_ADVENTURER di
    // bawah) SENGAJA menyebut distraktor JUGA di teks (mis. "sees a
    // banana" — dilihat, bukan dibeli), bukan cuma jawaban benar — supaya
    // anak wajib bedakan lewat kata kerja/konteks yang tepat, tidak bisa
    // ditembak dari 1 kata benda yang kebetulan kedengaran (bias
    // "construct-irrelevant variance", dilaporkan user — pola sama dgn
    // perbaikan Reading First Placement Test, `placement-test-data.ts`).
    story: ['Andi sees a banana.', 'He buys a red apple.', 'The apple is one dollar.'],
    question: {
      en: 'What did Andi buy?',
      opts: [{ emoji: '🍎', lbl: 'Apple', ok: true }, { emoji: '🍌', lbl: 'Banana' }, { emoji: '🍇', lbl: 'Grape' }],
    },
  },
  {
    id: 'perkenalan',
    title: 'Perkenalan',
    scene: '👋',
    desc: 'Cerita kenalan',
    primer: [{ en: 'What is your name?', id: 'Siapa namamu?' }],
    drill: [{ en: 'She is my sister.', opts: [{ emoji: '👧', ok: true }, { emoji: '👴' }] }],
    // Distraktor "red" disebut lewat NEGASI ("does not like") — anak wajib
    // proses "does not" dulu, bukan cuma menangkap kata warna pertama yang
    // kedengaran.
    story: ['This is Ara.', 'Ara does not like red.', 'Ara likes blue.'],
    question: { en: 'What color does Ara like?', opts: [{ emoji: '🔵', lbl: 'Blue', ok: true }, { emoji: '🔴', lbl: 'Red' }] },
  },
  {
    id: 'sekolah',
    title: 'Di Sekolah',
    scene: '🏫',
    desc: 'Cerita sekolah',
    primer: [{ en: 'This is my classroom.', id: 'Ini kelasku.' }],
    drill: [{ en: 'I have a pencil.', opts: [{ emoji: '✏️', ok: true }, { emoji: '📕' }] }],
    // "green" dilekatkan ke tas TEMANNYA (bukan tas Budi) — anak wajib
    // bedakan SIAPA pemilik tas warna apa, bukan cuma tangkap 1 kata warna.
    story: ['Budi is at school.', 'His friend has a green bag.', 'Budi has a blue bag.'],
    question: { en: "What color is Budi's bag?", opts: [{ emoji: '🔵', lbl: 'Blue', ok: true }, { emoji: '🟢', lbl: 'Green' }] },
  },
  /**
   * 7 topik tambahan (sesi ini) — menggenapkan Listening Explorer dari 3
   * jadi 10 topik (target CLAUDE.md ≥10 topik/skill). Riset & rasional
   * lengkap: `materi/listening.md` §3C/§5 — format LAMA (`ListeningTopic`)
   * dikonfirmasi SUDAH cocok utk level ini (Kurikulum Merdeka Fase B + EF
   * Indonesia "High Flyers"), jadi TIDAK didesain ulang, murni data baru
   * dgn bentuk primer/drill/story/question yang identik dgn 3 topik lama.
   * Tiap topik dipetakan ke 1 domain `VOCAB_TOPICS` (Explorer) yang belum
   * disentuh Listening (kesehatan, kata-sifat, belanja-uang, waktu-harian,
   * negara, pesta-perayaan, peralatan-dapur) — sama prinsipnya dgn Little
   * Stars/Starter: melatih ulang kosakata yang sudah dikenal lewat
   * modalitas dengar+cerita mini, bukan tema baru di luar Vocab. Pola
   * distraktor "disebut jelas di teks, dilekatkan ke ORANG/waktu/hal yang
   * SALAH" (§16.9/komentar topik lama di atas) dipertahankan di SEMUA
   * `story` baru di bawah.
   */
  {
    id: 'klinik',
    title: 'Di Klinik (At the Clinic)',
    scene: '🏥',
    desc: 'Cerita klinik',
    primer: [
      { en: 'What is wrong?', id: 'Ada apa?' },
      { en: 'I have a fever.', id: 'Aku demam.' },
    ],
    drill: [
      { en: 'I have a headache.', opts: [{ emoji: '🤕', ok: true }, { emoji: '😷' }, { emoji: '🤒' }] },
      { en: 'The doctor gives me medicine.', opts: [{ emoji: '💊', ok: true }, { emoji: '💉' }] },
    ],
    story: ['Rani is at the clinic.', 'Her brother has a cough.', 'Rani has a fever.'],
    question: { en: 'What does Rani have?', opts: [{ emoji: '🤒', lbl: 'Fever', ok: true }, { emoji: '😷', lbl: 'Cough' }] },
  },
  {
    id: 'kebun-binatang',
    title: 'Di Kebun Binatang (At the Zoo)',
    scene: '🦁',
    desc: 'Cerita kebun binatang',
    primer: [
      { en: 'Look at that animal!', id: 'Lihat hewan itu!' },
      { en: 'It is very big.', id: 'Itu sangat besar.' },
    ],
    drill: [
      { en: 'The elephant is big.', opts: [{ emoji: '🐘', ok: true }, { emoji: '🐭' }] },
      { en: 'The turtle is slow.', opts: [{ emoji: '🐢', ok: true }, { emoji: '🐆' }] },
    ],
    story: ['Dimas sees a turtle first.', 'The turtle is slow.', 'Then he sees a cheetah, and it is fast.'],
    question: { en: 'Which animal is fast?', opts: [{ emoji: '🐆', lbl: 'Cheetah', ok: true }, { emoji: '🐢', lbl: 'Turtle' }] },
  },
  {
    id: 'di-kasir',
    title: 'Di Kasir (At the Cashier)',
    scene: '🧑‍💼',
    desc: 'Cerita kasir',
    primer: [
      { en: 'How much is the total?', id: 'Berapa totalnya?' },
      { en: 'Here is my money.', id: 'Ini uangku.' },
    ],
    drill: [
      { en: 'I pay with a coin.', opts: [{ emoji: '🪙', ok: true }, { emoji: '💵' }] },
      { en: 'The cashier gives me a receipt.', opts: [{ emoji: '🧾', ok: true }, { emoji: '👛' }] },
    ],
    story: ['Sinta goes to the cashier.', 'Her friend pays with a coin.', 'Sinta pays with paper money.'],
    question: { en: 'How does Sinta pay?', opts: [{ emoji: '💵', lbl: 'Paper Money', ok: true }, { emoji: '🪙', lbl: 'Coin' }] },
  },
  {
    id: 'jadwal-harian',
    title: 'Jadwalku Hari Ini (My Daily Schedule)',
    scene: '🗓️',
    desc: 'Cerita jadwal',
    primer: [{ en: 'What do you do in the morning?', id: 'Apa yang kamu lakukan di pagi hari?' }],
    drill: [
      { en: 'I wake up in the morning.', opts: [{ emoji: '🌅', ok: true }, { emoji: '🌃' }] },
      { en: 'I eat lunch at noon.', opts: [{ emoji: '🕛', ok: true }, { emoji: '🌇' }] },
    ],
    story: ['Farah wakes up in the morning.', 'Her sister sleeps in the afternoon.', 'Farah plays in the evening.'],
    question: { en: 'When does Farah play?', opts: [{ emoji: '🌇', lbl: 'Evening', ok: true }, { emoji: '☀️', lbl: 'Afternoon' }] },
  },
  {
    id: 'dari-mana',
    title: 'Kamu dari Mana? (Where Are You From?)',
    scene: '🌍',
    desc: 'Cerita asal negara',
    primer: [
      { en: 'Where are you from?', id: 'Kamu dari mana?' },
      { en: 'I am from Indonesia.', id: 'Aku dari Indonesia.' },
    ],
    drill: [
      { en: 'She is from Japan.', opts: [{ emoji: '🇯🇵', ok: true }, { emoji: '🇰🇷' }] },
      { en: 'He is from France.', opts: [{ emoji: '🇫🇷', ok: true }, { emoji: '🇩🇪' }] },
    ],
    story: ['Leo has a new friend.', 'His friend is from Korea.', 'Leo is from Indonesia.'],
    question: { en: 'Where is Leo from?', opts: [{ emoji: '🇮🇩', lbl: 'Indonesia', ok: true }, { emoji: '🇰🇷', lbl: 'Korea' }] },
  },
  {
    id: 'pesta-ulang-tahun',
    title: 'Pesta Ulang Tahun (Birthday Party)',
    scene: '🎉',
    desc: 'Cerita ulang tahun',
    primer: [
      { en: 'Happy birthday!', id: 'Selamat ulang tahun!' },
      { en: 'I have a present for you.', id: 'Aku punya hadiah untukmu.' },
    ],
    drill: [
      { en: 'I blow the candle.', opts: [{ emoji: '🕯️', ok: true }, { emoji: '🎁' }] },
      { en: 'We sing a song at the party.', opts: [{ emoji: '🎵', ok: true }, { emoji: '🎂' }] },
    ],
    story: ['Today is Nina’s birthday.', 'Her friend brings a card.', 'Nina opens her present.'],
    question: { en: 'What does Nina open?', opts: [{ emoji: '🎁', lbl: 'Present', ok: true }, { emoji: '✉️', lbl: 'Card' }] },
  },
  {
    id: 'di-dapur',
    title: 'Di Dapur (In the Kitchen)',
    scene: '🍳',
    desc: 'Cerita dapur',
    primer: [
      { en: 'What are you cooking?', id: 'Kamu memasak apa?' },
      { en: 'I am cooking soup.', id: 'Aku memasak sup.' },
    ],
    drill: [
      { en: 'I eat soup with a spoon.', opts: [{ emoji: '🥄', ok: true }, { emoji: '🍴' }] },
      { en: 'Mom cuts vegetables with a knife.', opts: [{ emoji: '🔪', ok: true }, { emoji: '🍽️' }] },
    ],
    story: ['Mom cooks in the kitchen.', 'Dad washes the fork.', 'Mom washes the spoon.'],
    question: { en: 'What does Mom wash?', opts: [{ emoji: '🥄', lbl: 'Spoon', ok: true }, { emoji: '🍴', lbl: 'Fork' }] },
  },
];

export const SPEAKING_TOPICS: SpeakingTopic[] = [
  {
    id: 'kenalan-teman',
    title: 'Kenalan dengan Teman',
    desc: '2 latihan bicara',
    model: ['Hello, my name is Ara.', 'Nice to meet you.'],
    drill: ['My name is Ara.', 'I am seven years old.'],
    roleplay: ["What's your name?", 'How old are you?', 'What is your favorite color?'],
  },
  {
    id: 'beli-toko',
    title: 'Beli di Toko',
    desc: '2 latihan bicara',
    model: ['How much is this?'],
    drill: ['I want an apple, please.'],
    roleplay: ['What do you want to buy?', 'How many do you want?'],
  },
  {
    id: 'tanya-kabar',
    title: 'Tanya Kabar',
    desc: '2 latihan bicara',
    model: ['How are you?'],
    drill: ['I am fine, thank you.'],
    roleplay: ['How are you today?', 'Are you happy?'],
  },
];

export const GRAMMAR_TOPICS: GrammarTopic[] = [
  {
    id: 'this-is',
    title: 'Pola "This is..."',
    desc: 'To be — perkenalan',
    examples: [{ en: 'This is a cat.', emoji: '🐱' }, { en: 'This is a dog.', emoji: '🐶' }],
    scramble: [
      { emoji: '🐱', target: ['This', 'is', 'a', 'cat'] },
      { emoji: '⚽', target: ['This', 'is', 'a', 'ball'] },
    ],
    fill: {
      before: ['This', 'is', 'my'],
      after: [],
      options: [{ word: 'book', emoji: '📕' }, { word: 'ball', emoji: '⚽' }, { word: 'cat', emoji: '🐱' }],
    },
  },
  {
    id: 'there-is',
    title: 'There is / There are',
    desc: 'Menyebut benda',
    examples: [{ en: 'There is a ball.', emoji: '⚽' }, { en: 'There are two cats.', emoji: '🐱🐱' }],
    scramble: [{ emoji: '⚽', target: ['There', 'is', 'a', 'ball'] }],
    fill: {
      before: ['There', 'is', 'a'],
      after: [],
      options: [{ word: 'cat', emoji: '🐱' }, { word: 'dog', emoji: '🐶' }, { word: 'book', emoji: '📕' }],
    },
  },
  {
    id: 'pronouns',
    title: 'Kata Ganti Orang',
    desc: 'I / You / He / She',
    examples: [{ en: 'I am happy.', emoji: '😊' }, { en: 'She is my sister.', emoji: '👧' }],
    scramble: [{ emoji: '😊', target: ['I', 'am', 'happy'] }],
    fill: {
      before: ['I', 'like'],
      after: [],
      options: [{ word: 'apples', emoji: '🍎' }, { word: 'blue', emoji: '🔵' }, { word: 'football', emoji: '⚽' }],
    },
  },
];

/**
 * Konten Adventurer (≈A1) — permintaan user: fokus authoring materi di
 * level ini dulu, supaya anak yang direkomendasikan Adventurer dari
 * placement test dapat materi SUNGGUHAN (sebelumnya cuma layar "materi
 * segera hadir", lihat `renderLevelSoon` di app.ts), bukan cuma Explorer.
 * Array TERPISAH dari yang di atas (BUKAN nge-replace VOCAB_TOPICS dkk,
 * yang tetap isi Explorer) — dipetakan ke level lewat `*_TOPICS_BY_LEVEL`
 * di bawah, dibaca `app.ts` via `currentLevelMeta()`.
 *
 * 10 topik pertama (`pekerjaan`…`perasaan`) SUDAH penuhi target CLAUDE.md
 * ≥10 topik/skill sejak sebelum sesi ini — beda dari Starter/Explorer yang
 * masih ada gap topik. 3 topik TERAKHIR (`bahan-material`, `kata-kerja-
 * harian`, `alam-lingkungan`) ditambahkan di sesi lanjutan (materi/vocab.md
 * §3D/§5D) — riset menemukan wordlist Cambridge **A1 Movers** (tingkat YLE
 * resmi Adventurer, PRD §3) SUDAH HABIS/tercakup penuh lintas 4 level begitu
 * Explorer selesai (setiap 1 dari 20 kategori Movers sudah ada rumahnya di
 * level lain) — jadi topik tambahan Adventurer ini SENGAJA loncat ke
 * wordlist **A2 Flyers** (tingkat SETELAH Movers), TAPI dijaga sengaja
 * SEDIKIT (cuma 3 topik, bukan digenapkan besar-besaran spt Explorer ke
 * Movers) — supaya sebagian besar A2 Flyers (Characteristics 49 kata,
 * Places 47 kata, Leisure 26 kata residual, dst) TETAP tersisa utk sesi
 * Achiever (≈A1→A2, level yang PRD §3 memang tandai transisi ke A2) nanti,
 * bukan keburu dihabiskan Adventurer.
 */
export const VOCAB_TOPICS_ADVENTURER: VocabTopic[] = [
  {
    id: 'pekerjaan',
    title: 'Pekerjaan (Jobs)',
    desc: '10 kata',
    items: [
      { en: 'Doctor', id: 'Dokter', emoji: '🧑‍⚕️', example: { en: 'The doctor helps sick people.', id: 'Dokter menolong orang sakit.', emoji: '🧑‍⚕️' } },
      { en: 'Teacher', id: 'Guru', emoji: '🧑‍🏫', example: { en: 'The teacher teaches at school.', id: 'Guru mengajar di sekolah.', emoji: '🧑‍🏫' } },
      { en: 'Police Officer', id: 'Polisi', emoji: '👮', example: { en: 'The police officer keeps us safe.', id: 'Polisi menjaga keamanan kita.', emoji: '👮' } },
      { en: 'Chef', id: 'Koki', emoji: '🧑‍🍳', example: { en: 'The chef cooks delicious food.', id: 'Koki memasak makanan enak.', emoji: '🧑‍🍳' } },
      { en: 'Farmer', id: 'Petani', emoji: '👨‍🌾', example: { en: 'The farmer grows rice.', id: 'Petani menanam padi.', emoji: '👨‍🌾' } },
      { en: 'Firefighter', id: 'Pemadam Kebakaran', emoji: '👩‍🚒', example: { en: 'The firefighter puts out fires.', id: 'Pemadam kebakaran memadamkan api.', emoji: '👩‍🚒' } },
      { en: 'Pilot', id: 'Pilot', emoji: '🧑‍✈️', example: { en: 'The pilot flies the plane.', id: 'Pilot menerbangkan pesawat.', emoji: '🧑‍✈️' } },
      { en: 'Singer', id: 'Penyanyi', emoji: '🧑‍🎤', example: { en: 'The singer sings a song.', id: 'Penyanyi menyanyikan lagu.', emoji: '🧑‍🎤' } },
      { en: 'Astronaut', id: 'Astronaut', emoji: '🧑‍🚀', example: { en: 'The astronaut goes to space.', id: 'Astronaut pergi ke luar angkasa.', emoji: '🧑‍🚀' } },
      { en: 'Artist', id: 'Seniman', emoji: '🧑‍🎨', example: { en: 'The artist paints a picture.', id: 'Seniman melukis gambar.', emoji: '🧑‍🎨' } },
    ],
  },
  {
    id: 'binatang',
    title: 'Binatang (Animals)',
    desc: '10 kata',
    items: [
      { en: 'Elephant', id: 'Gajah', emoji: '🐘', example: { en: 'The elephant is very big.', id: 'Gajahnya sangat besar.', emoji: '🐘' } },
      { en: 'Lion', id: 'Singa', emoji: '🦁', example: { en: 'The lion lives in the jungle.', id: 'Singa tinggal di hutan.', emoji: '🦁' } },
      { en: 'Tiger', id: 'Harimau', emoji: '🐯', example: { en: 'The tiger has orange stripes.', id: 'Harimau punya garis oranye.', emoji: '🐯' } },
      { en: 'Monkey', id: 'Monyet', emoji: '🐒', example: { en: 'The monkey climbs the tree.', id: 'Monyet memanjat pohon.', emoji: '🐒' } },
      { en: 'Giraffe', id: 'Jerapah', emoji: '🦒', example: { en: 'The giraffe has a long neck.', id: 'Jerapah punya leher panjang.', emoji: '🦒' } },
      { en: 'Zebra', id: 'Zebra', emoji: '🦓', example: { en: 'The zebra has black and white stripes.', id: 'Zebra punya garis hitam putih.', emoji: '🦓' } },
      { en: 'Bear', id: 'Beruang', emoji: '🐻', example: { en: 'The bear sleeps in winter.', id: 'Beruang tidur di musim dingin.', emoji: '🐻' } },
      { en: 'Penguin', id: 'Pinguin', emoji: '🐧', example: { en: 'The penguin lives in the snow.', id: 'Pinguin tinggal di salju.', emoji: '🐧' } },
      { en: 'Kangaroo', id: 'Kanguru', emoji: '🦘', example: { en: 'The kangaroo can jump high.', id: 'Kanguru bisa melompat tinggi.', emoji: '🦘' } },
      { en: 'Panda', id: 'Panda', emoji: '🐼', example: { en: 'The panda eats bamboo.', id: 'Panda makan bambu.', emoji: '🐼' } },
    ],
  },
  {
    id: 'makanan',
    title: 'Makanan (Food)',
    desc: '10 kata',
    items: [
      { en: 'Bread', id: 'Roti', emoji: '🍞', example: { en: 'I eat bread for breakfast.', id: 'Aku makan roti untuk sarapan.', emoji: '🍞' } },
      { en: 'Rice', id: 'Nasi', emoji: '🍚', example: { en: 'We eat rice every day.', id: 'Kami makan nasi setiap hari.', emoji: '🍚' } },
      { en: 'Egg', id: 'Telur', emoji: '🥚', example: { en: 'She cooks an egg.', id: 'Dia memasak telur.', emoji: '🥚' } },
      { en: 'Milk', id: 'Susu', emoji: '🥛', example: { en: 'I drink milk every morning.', id: 'Aku minum susu setiap pagi.', emoji: '🥛' } },
      { en: 'Water', id: 'Air', emoji: '💧', example: { en: 'He drinks water.', id: 'Dia minum air.', emoji: '💧' } },
      { en: 'Meat', id: 'Daging', emoji: '🍖', example: { en: 'We eat meat on Sunday.', id: 'Kami makan daging pada hari Minggu.', emoji: '🍖' } },
      { en: 'Vegetable', id: 'Sayur', emoji: '🥦', example: { en: 'I like vegetable soup.', id: 'Aku suka sup sayur.', emoji: '🥦' } },
      { en: 'Fruit', id: 'Buah', emoji: '🍎', example: { en: 'I eat fruit every day.', id: 'Aku makan buah setiap hari.', emoji: '🍎' } },
      { en: 'Noodle', id: 'Mie', emoji: '🍜', example: { en: 'She likes noodle soup.', id: 'Dia suka sup mie.', emoji: '🍜' } },
      { en: 'Soup', id: 'Sup', emoji: '🍲', example: { en: 'We eat soup for dinner.', id: 'Kami makan sup untuk makan malam.', emoji: '🍲' } },
    ],
  },
  {
    id: 'alat-sekolah',
    title: 'Alat Sekolah (School Supplies)',
    desc: '10 kata',
    items: [
      { en: 'Pencil', id: 'Pensil', emoji: '✏️', example: { en: 'I write with a pencil.', id: 'Aku menulis dengan pensil.', emoji: '✏️' } },
      { en: 'Book', id: 'Buku', emoji: '📕', example: { en: 'She reads a book.', id: 'Dia membaca buku.', emoji: '📕' } },
      { en: 'Bag', id: 'Tas', emoji: '🎒', example: { en: 'He carries a bag.', id: 'Dia membawa tas.', emoji: '🎒' } },
      { en: 'Ruler', id: 'Penggaris', emoji: '📏', example: { en: 'I use a ruler to draw a line.', id: 'Aku pakai penggaris untuk menggambar garis.', emoji: '📏' } },
      { en: 'Notebook', id: 'Buku Tulis', emoji: '📓', example: { en: 'I keep a notebook.', id: 'Aku punya buku tulis.', emoji: '📓' } },
      { en: 'Chair', id: 'Kursi', emoji: '🪑', example: { en: 'She sits on a chair.', id: 'Dia duduk di kursi.', emoji: '🪑' } },
      { en: 'Scissors', id: 'Gunting', emoji: '✂️', example: { en: 'I cut paper with scissors.', id: 'Aku memotong kertas dengan gunting.', emoji: '✂️' } },
      { en: 'Crayon', id: 'Krayon', emoji: '🖍️', example: { en: 'I color with a crayon.', id: 'Aku mewarnai dengan krayon.', emoji: '🖍️' } },
      { en: 'Paint', id: 'Cat', emoji: '🎨', example: { en: 'She uses paint to draw.', id: 'Dia memakai cat untuk menggambar.', emoji: '🎨' } },
      { en: 'Clock', id: 'Jam', emoji: '🕐', example: { en: 'The clock is on the wall.', id: 'Jamnya ada di dinding.', emoji: '🕐' } },
    ],
  },
  {
    id: 'cuaca',
    title: 'Cuaca (Weather)',
    desc: '10 kata',
    items: [
      { en: 'Sunny', id: 'Cerah', emoji: '☀️', example: { en: 'Today is sunny.', id: 'Hari ini cerah.', emoji: '☀️' } },
      { en: 'Rainy', id: 'Hujan', emoji: '🌧️', example: { en: 'It is rainy today.', id: 'Hari ini hujan.', emoji: '🌧️' } },
      { en: 'Cloudy', id: 'Berawan', emoji: '☁️', example: { en: 'The sky is cloudy.', id: 'Langitnya berawan.', emoji: '☁️' } },
      { en: 'Windy', id: 'Berangin', emoji: '💨', example: { en: 'It is windy outside.', id: 'Di luar berangin.', emoji: '💨' } },
      { en: 'Snowy', id: 'Bersalju', emoji: '❄️', example: { en: 'It is snowy in winter.', id: 'Bersalju saat musim dingin.', emoji: '❄️' } },
      { en: 'Hot', id: 'Panas', emoji: '🌡️', example: { en: 'Today is hot.', id: 'Hari ini panas.', emoji: '🌡️' } },
      { en: 'Cold', id: 'Dingin', emoji: '🥶', example: { en: 'Today is cold.', id: 'Hari ini dingin.', emoji: '🥶' } },
      { en: 'Stormy', id: 'Badai', emoji: '⛈️', example: { en: 'It is stormy today.', id: 'Hari ini badai.', emoji: '⛈️' } },
      { en: 'Foggy', id: 'Berkabut', emoji: '🌫️', example: { en: 'It is foggy this morning.', id: 'Pagi ini berkabut.', emoji: '🌫️' } },
      { en: 'Rainbow', id: 'Pelangi', emoji: '🌈', example: { en: 'I see a rainbow.', id: 'Aku lihat pelangi.', emoji: '🌈' } },
    ],
  },
  {
    id: 'anggota-tubuh',
    title: 'Anggota Tubuh (Body Parts)',
    desc: '10 kata',
    items: [
      { en: 'Eye', id: 'Mata', emoji: '👁️', example: { en: 'I close my eye.', id: 'Aku menutup mataku.', emoji: '👁️' } },
      { en: 'Ear', id: 'Telinga', emoji: '👂', example: { en: 'I clean my ear.', id: 'Aku membersihkan telingaku.', emoji: '👂' } },
      { en: 'Nose', id: 'Hidung', emoji: '👃', example: { en: 'My nose is small.', id: 'Hidungku kecil.', emoji: '👃' } },
      { en: 'Mouth', id: 'Mulut', emoji: '👄', example: { en: 'Open your mouth.', id: 'Buka mulutmu.', emoji: '👄' } },
      { en: 'Hand', id: 'Tangan', emoji: '✋', example: { en: 'I wave my hand.', id: 'Aku melambaikan tanganku.', emoji: '✋' } },
      { en: 'Foot', id: 'Kaki', emoji: '🦶', example: { en: 'I wash my foot.', id: 'Aku mencuci kakiku.', emoji: '🦶' } },
      { en: 'Tooth', id: 'Gigi', emoji: '🦷', example: { en: 'I brush my tooth.', id: 'Aku menyikat gigiku.', emoji: '🦷' } },
      { en: 'Tongue', id: 'Lidah', emoji: '👅', example: { en: 'I stick out my tongue.', id: 'Aku menjulurkan lidahku.', emoji: '👅' } },
      { en: 'Finger', id: 'Jari', emoji: '👆', example: { en: 'I point with my finger.', id: 'Aku menunjuk dengan jariku.', emoji: '👆' } },
      { en: 'Arm', id: 'Lengan', emoji: '💪', example: { en: 'I flex my arm.', id: 'Aku menekuk lenganku.', emoji: '💪' } },
    ],
  },
  {
    id: 'transportasi',
    title: 'Transportasi (Transportation)',
    desc: '10 kata',
    items: [
      { en: 'Car', id: 'Mobil', emoji: '🚗', example: { en: 'We travel by car.', id: 'Kami bepergian naik mobil.', emoji: '🚗' } },
      { en: 'Bus', id: 'Bus', emoji: '🚌', example: { en: 'I go to school by bus.', id: 'Aku ke sekolah naik bus.', emoji: '🚌' } },
      { en: 'Train', id: 'Kereta', emoji: '🚆', example: { en: 'The train is fast.', id: 'Keretanya cepat.', emoji: '🚆' } },
      { en: 'Bicycle', id: 'Sepeda', emoji: '🚲', example: { en: 'He rides a bicycle.', id: 'Dia naik sepeda.', emoji: '🚲' } },
      { en: 'Motorcycle', id: 'Motor', emoji: '🏍️', example: { en: 'She rides a motorcycle.', id: 'Dia naik motor.', emoji: '🏍️' } },
      { en: 'Airplane', id: 'Pesawat', emoji: '✈️', example: { en: 'We fly by airplane.', id: 'Kami terbang naik pesawat.', emoji: '✈️' } },
      { en: 'Boat', id: 'Perahu', emoji: '🛶', example: { en: 'They sail a boat.', id: 'Mereka berlayar naik perahu.', emoji: '🛶' } },
      { en: 'Taxi', id: 'Taksi', emoji: '🚕', example: { en: 'I take a taxi.', id: 'Aku naik taksi.', emoji: '🚕' } },
      { en: 'Truck', id: 'Truk', emoji: '🚚', example: { en: 'The truck is big.', id: 'Truknya besar.', emoji: '🚚' } },
      { en: 'Ship', id: 'Kapal', emoji: '🚢', example: { en: 'The ship crosses the sea.', id: 'Kapal itu menyeberangi laut.', emoji: '🚢' } },
    ],
  },
  {
    id: 'olahraga',
    title: 'Olahraga (Sports)',
    desc: '10 kata',
    items: [
      { en: 'Football', id: 'Sepak Bola', emoji: '⚽', example: { en: 'I play football.', id: 'Aku main sepak bola.', emoji: '⚽' } },
      { en: 'Basketball', id: 'Bola Basket', emoji: '🏀', example: { en: 'He plays basketball.', id: 'Dia main bola basket.', emoji: '🏀' } },
      { en: 'Swimming', id: 'Berenang', emoji: '🏊', example: { en: 'She likes swimming.', id: 'Dia suka berenang.', emoji: '🏊' } },
      { en: 'Running', id: 'Berlari', emoji: '🏃', example: { en: 'I like running.', id: 'Aku suka berlari.', emoji: '🏃' } },
      { en: 'Badminton', id: 'Bulu Tangkis', emoji: '🏸', example: { en: 'We play badminton.', id: 'Kami main bulu tangkis.', emoji: '🏸' } },
      { en: 'Volleyball', id: 'Bola Voli', emoji: '🏐', example: { en: 'They play volleyball.', id: 'Mereka main bola voli.', emoji: '🏐' } },
      { en: 'Tennis', id: 'Tenis', emoji: '🎾', example: { en: 'He plays tennis.', id: 'Dia main tenis.', emoji: '🎾' } },
      { en: 'Cycling', id: 'Bersepeda', emoji: '🚴', example: { en: 'I enjoy cycling.', id: 'Aku suka bersepeda.', emoji: '🚴' } },
      { en: 'Jumping', id: 'Melompat', emoji: '🤸', example: { en: 'The kids are jumping.', id: 'Anak-anak sedang melompat.', emoji: '🤸' } },
      { en: 'Dancing', id: 'Menari', emoji: '💃', example: { en: 'She loves dancing.', id: 'Dia suka menari.', emoji: '💃' } },
    ],
  },
  {
    id: 'rumah',
    title: 'Bagian Rumah (Parts of the House)',
    desc: '10 kata',
    items: [
      { en: 'Kitchen', id: 'Dapur', emoji: '🍳', example: { en: 'Mom cooks in the kitchen.', id: 'Ibu memasak di dapur.', emoji: '🍳' } },
      { en: 'Bedroom', id: 'Kamar Tidur', emoji: '🛏️', example: { en: 'I sleep in my bedroom.', id: 'Aku tidur di kamar tidurku.', emoji: '🛏️' } },
      { en: 'Bathroom', id: 'Kamar Mandi', emoji: '🚿', example: { en: 'I take a shower in the bathroom.', id: 'Aku mandi di kamar mandi.', emoji: '🚿' } },
      { en: 'Living Room', id: 'Ruang Tamu', emoji: '🛋️', example: { en: 'We watch TV in the living room.', id: 'Kami nonton TV di ruang tamu.', emoji: '🛋️' } },
      { en: 'Door', id: 'Pintu', emoji: '🚪', example: { en: 'Close the door.', id: 'Tutup pintunya.', emoji: '🚪' } },
      { en: 'Window', id: 'Jendela', emoji: '🪟', example: { en: 'Open the window.', id: 'Buka jendelanya.', emoji: '🪟' } },
      { en: 'Roof', id: 'Atap', emoji: '🏠', example: { en: 'The roof is red.', id: 'Atapnya merah.', emoji: '🏠' } },
      { en: 'Garden', id: 'Kebun', emoji: '🌻', example: { en: 'We play in the garden.', id: 'Kami main di kebun.', emoji: '🌻' } },
      { en: 'Wall', id: 'Dinding', emoji: '🧱', example: { en: 'The wall is red.', id: 'Dindingnya merah.', emoji: '🧱' } },
      { en: 'Floor', id: 'Lantai', emoji: '🪵', example: { en: 'The floor is clean.', id: 'Lantainya bersih.', emoji: '🪵' } },
    ],
  },
  {
    id: 'perasaan',
    title: 'Perasaan (Feelings)',
    desc: '10 kata',
    items: [
      { en: 'Happy', id: 'Senang', emoji: '😊', example: { en: 'I feel happy today.', id: 'Aku merasa senang hari ini.', emoji: '😊' } },
      { en: 'Sad', id: 'Sedih', emoji: '😢', example: { en: 'She feels sad.', id: 'Dia merasa sedih.', emoji: '😢' } },
      { en: 'Angry', id: 'Marah', emoji: '😠', example: { en: 'He is angry.', id: 'Dia marah.', emoji: '😠' } },
      { en: 'Scared', id: 'Takut', emoji: '😨', example: { en: 'I am scared of the dark.', id: 'Aku takut gelap.', emoji: '😨' } },
      { en: 'Surprised', id: 'Terkejut', emoji: '😲', example: { en: 'We are surprised.', id: 'Kami terkejut.', emoji: '😲' } },
      { en: 'Excited', id: 'Bersemangat', emoji: '🤩', example: { en: 'I am excited for the trip.', id: 'Aku bersemangat untuk perjalanan itu.', emoji: '🤩' } },
      { en: 'Tired', id: 'Lelah', emoji: '😴', example: { en: 'She is tired.', id: 'Dia lelah.', emoji: '😴' } },
      { en: 'Bored', id: 'Bosan', emoji: '😑', example: { en: 'He is bored.', id: 'Dia bosan.', emoji: '😑' } },
      { en: 'Proud', id: 'Bangga', emoji: '🥹', example: { en: 'My mom is proud of me.', id: 'Ibuku bangga padaku.', emoji: '🥹' } },
      { en: 'Shy', id: 'Malu', emoji: '😳', example: { en: 'The boy is shy.', id: 'Anak laki-laki itu malu.', emoji: '😳' } },
    ],
  },
  {
    id: 'bahan-material',
    title: 'Bahan & Material (Materials)',
    desc: '10 kata',
    items: [
      { en: 'Wood', id: 'Kayu', emoji: '🪵', example: { en: 'The table is made of wood.', id: 'Mejanya terbuat dari kayu.', emoji: '🪵' } },
      { en: 'Plastic', id: 'Plastik', emoji: '🧴', example: { en: 'The bottle is made of plastic.', id: 'Botolnya terbuat dari plastik.', emoji: '🧴' } },
      { en: 'Metal', id: 'Logam', emoji: '🔩', example: { en: 'The spoon is made of metal.', id: 'Sendoknya terbuat dari logam.', emoji: '🔩' } },
      { en: 'Glass', id: 'Kaca', emoji: '🪟', example: { en: 'The window is made of glass.', id: 'Jendelanya terbuat dari kaca.', emoji: '🪟' } },
      { en: 'Paper', id: 'Kertas', emoji: '📄', example: { en: 'I write on paper.', id: 'Aku menulis di kertas.', emoji: '📄' } },
      { en: 'Cotton', id: 'Katun', emoji: '👕', example: { en: 'My shirt is made of cotton.', id: 'Bajuku terbuat dari katun.', emoji: '👕' } },
      { en: 'Wool', id: 'Wol', emoji: '🧶', example: { en: 'The sweater is made of wool.', id: 'Sweternya terbuat dari wol.', emoji: '🧶' } },
      { en: 'Leather', id: 'Kulit', emoji: '👞', example: { en: 'The shoes are made of leather.', id: 'Sepatunya terbuat dari kulit.', emoji: '👞' } },
      { en: 'Rubber', id: 'Karet', emoji: '🎈', example: { en: 'The balloon is made of rubber.', id: 'Balonnya terbuat dari karet.', emoji: '🎈' } },
      { en: 'Silk', id: 'Sutra', emoji: '👘', example: { en: 'The kimono is made of silk.', id: 'Kimononya terbuat dari sutra.', emoji: '👘' } },
    ],
  },
  {
    id: 'kata-kerja-harian',
    title: 'Kata Kerja Sehari-hari (Everyday Actions)',
    desc: '10 kata',
    items: [
      { en: 'Cook', id: 'Memasak', emoji: '🍳', example: { en: 'I cook dinner.', id: 'Aku memasak makan malam.', emoji: '🍳' } },
      { en: 'Sweep', id: 'Menyapu', emoji: '🧹', example: { en: 'I sweep the floor.', id: 'Aku menyapu lantai.', emoji: '🧹' } },
      { en: 'Write', id: 'Menulis', emoji: '✍️', example: { en: 'I write a letter.', id: 'Aku menulis surat.', emoji: '✍️' } },
      { en: 'Draw', id: 'Menggambar', emoji: '✏️', example: { en: 'I draw a house.', id: 'Aku menggambar rumah.', emoji: '✏️' } },
      { en: 'Cut', id: 'Memotong', emoji: '✂️', example: { en: 'I cut the paper.', id: 'Aku memotong kertas.', emoji: '✂️' } },
      { en: 'Wash', id: 'Mencuci', emoji: '🧼', example: { en: 'I wash my hands.', id: 'Aku mencuci tanganku.', emoji: '🧼' } },
      { en: 'Open', id: 'Buka', emoji: '🔓', example: { en: 'I open the door.', id: 'Aku membuka pintu.', emoji: '🔓' } },
      { en: 'Close', id: 'Tutup', emoji: '🔒', example: { en: 'I close the door.', id: 'Aku menutup pintu.', emoji: '🔒' } },
      { en: 'Push', id: 'Dorong', emoji: '👉', example: { en: 'I push the swing.', id: 'Aku mendorong ayunan.', emoji: '👉' } },
      { en: 'Pull', id: 'Tarik', emoji: '👈', example: { en: 'I pull the rope.', id: 'Aku menarik tali.', emoji: '👈' } },
    ],
  },
  {
    id: 'alam-lingkungan',
    title: 'Alam & Lingkungan (Nature & Environment)',
    desc: '10 kata',
    items: [
      { en: 'Planet', id: 'Planet', emoji: '🪐', example: { en: 'I see a planet.', id: 'Aku melihat planet.', emoji: '🪐' } },
      { en: 'Earth', id: 'Bumi', emoji: '🌍', example: { en: 'We live on Earth.', id: 'Kami tinggal di Bumi.', emoji: '🌍' } },
      { en: 'Space', id: 'Luar Angkasa', emoji: '🚀', example: { en: 'I want to go to space.', id: 'Aku ingin pergi ke luar angkasa.', emoji: '🚀' } },
      { en: 'Forest', id: 'Hutan', emoji: '🌲', example: { en: 'Animals live in the forest.', id: 'Hewan tinggal di hutan.', emoji: '🌲' } },
      { en: 'Ocean', id: 'Samudra', emoji: '🌊', example: { en: 'Fish live in the ocean.', id: 'Ikan tinggal di samudra.', emoji: '🌊' } },
      { en: 'Desert', id: 'Gurun', emoji: '🏜️', example: { en: 'It is hot in the desert.', id: 'Gurun itu panas.', emoji: '🏜️' } },
      { en: 'Volcano', id: 'Gunung Berapi', emoji: '🌋', example: { en: 'The volcano erupts.', id: 'Gunung berapi itu meletus.', emoji: '🌋' } },
      { en: 'Island', id: 'Pulau', emoji: '🏝️', example: { en: 'We visit an island.', id: 'Kami mengunjungi pulau.', emoji: '🏝️' } },
      { en: 'Pollution', id: 'Polusi', emoji: '🏭', example: { en: 'Pollution is bad for Earth.', id: 'Polusi buruk untuk Bumi.', emoji: '🏭' } },
      { en: 'Recycle', id: 'Daur Ulang', emoji: '♻️', example: { en: 'We recycle plastic.', id: 'Kami mendaur ulang plastik.', emoji: '♻️' } },
    ],
  },
];

export const LISTENING_TOPICS_ADVENTURER: ListeningTopic[] = [
  {
    id: 'bandara',
    title: 'Di Bandara (At the Airport)',
    scene: '🛫',
    desc: 'Cerita bandara',
    primer: [
      { en: 'Where is the gate?', id: 'Di mana gerbangnya?' },
      { en: 'My flight is delayed.', id: 'Penerbanganku tertunda.' },
    ],
    drill: [
      { en: 'The plane is blue and white.', opts: [{ emoji: '✈️', ok: true }, { emoji: '🚗' }, { emoji: '🚢' }] },
      { en: 'I need to check in my bag.', opts: [{ emoji: '🧳', ok: true }, { emoji: '🎒' }, { emoji: '📱' }] },
    ],
    // "10 o'clock" dilekatkan ke penerbangan TEMANNYA (bukan Rio) — anak
    // wajib bedakan penerbangan siapa yang ditanya, bukan cuma tangkap 1
    // angka jam yang kebetulan kedengaran (lihat komentar prinsip yang
    // sama di LISTENING_TOPICS di atas).
    story: ['Rio is at the airport.', 'His friend’s flight is at ten o’clock.', 'Rio’s flight is at nine o’clock.'],
    question: {
      en: 'What time is Rio’s flight?',
      opts: [{ emoji: '9️⃣', lbl: '9 o’clock', ok: true }, { emoji: '🔟', lbl: '10 o’clock' }],
    },
  },
  /**
   * 9 topik tambahan (sesi ini) — menggenapkan Listening Adventurer dari 1
   * jadi 10 topik (target CLAUDE.md ≥10 topik/skill). Riset & rasional
   * lengkap: `materi/listening.md` §3D/§5 — format LAMA `ListeningTopic`
   * dipertahankan APA ADANYA (sama pola dgn genapkan Explorer sesi
   * sebelumnya), murni data baru. Tiap topik dipetakan ke 1 dari 10 domain
   * "inti" `VOCAB_TOPICS_ADVENTURER` (pekerjaan…perasaan, lihat komentar di
   * atas array itu) yang belum disentuh Listening — 9 dari 10 dipetakan
   * (`perasaan` SENGAJA dilewati sesi ini, sudah cukup terwakili lewat
   * Little Stars `senang-sedih` & Explorer, bukan gap yang perlu ditutup
   * segera), 3 domain bonus Adventurer (`bahan-material`, `kata-kerja-
   * harian`, `alam-lingkungan`) juga belum disentuh — cadangan tema siap
   * pakai kalau level ini diperluas lagi nanti. Pola distraktor "disebut
   * jelas di teks, dilekatkan ke ORANG/waktu/urutan yang SALAH" (§16.9/
   * komentar topik `bandara` di atas) dipertahankan di semua `story` baru.
   */
  {
    id: 'cita-citaku',
    title: 'Cita-citaku (My Dream Job)',
    scene: '🌟',
    desc: 'Cerita cita-cita',
    primer: [
      { en: 'What do you want to be?', id: 'Kamu mau jadi apa?' },
      { en: 'I want to be a doctor.', id: 'Aku mau jadi dokter.' },
    ],
    drill: [
      { en: 'The firefighter puts out fires.', opts: [{ emoji: '👩‍🚒', ok: true }, { emoji: '👮' }, { emoji: '🧑‍🍳' }] },
      { en: 'The pilot flies the plane.', opts: [{ emoji: '🧑‍✈️', ok: true }, { emoji: '🧑‍🚀' }] },
    ],
    story: ['Sari visits the doctor.', 'Her mom is a teacher.', 'Sari wants to be a doctor too.'],
    question: { en: 'What does Sari want to be?', opts: [{ emoji: '🧑‍⚕️', lbl: 'Doctor', ok: true }, { emoji: '🧑‍🏫', lbl: 'Teacher' }] },
  },
  {
    id: 'petualangan-safari',
    title: 'Petualangan Safari (Safari Adventure)',
    scene: '🦒',
    desc: 'Cerita safari',
    primer: [
      { en: 'Look, an elephant!', id: 'Lihat, ada gajah!' },
      { en: 'It is very big.', id: 'Itu sangat besar.' },
    ],
    drill: [
      { en: 'The giraffe has a long neck.', opts: [{ emoji: '🦒', ok: true }, { emoji: '🦓' }] },
      { en: 'The monkey climbs the tree.', opts: [{ emoji: '🐒', ok: true }, { emoji: '🐻' }] },
    ],
    story: ['Toni goes on a safari.', 'He sees a zebra first.', 'Then he sees a lion resting.'],
    question: { en: 'What does Toni see resting?', opts: [{ emoji: '🦁', lbl: 'Lion', ok: true }, { emoji: '🦓', lbl: 'Zebra' }] },
  },
  {
    id: 'makan-malam',
    title: 'Makan Malam Keluarga (Family Dinner)',
    scene: '🍽️',
    desc: 'Cerita makan malam',
    primer: [
      { en: 'What is for dinner?', id: 'Makan malamnya apa?' },
      { en: 'We have rice and soup.', id: 'Kami makan nasi dan sup.' },
    ],
    drill: [
      { en: 'Mom cooks vegetable soup.', opts: [{ emoji: '🥦', ok: true }, { emoji: '🍞' }] },
      { en: 'I drink a glass of milk.', opts: [{ emoji: '🥛', ok: true }, { emoji: '💧' }] },
    ],
    story: ['Dad brings bread home.', 'Mom cooks noodle soup.', 'The family eats noodle soup together.'],
    question: { en: 'What does the family eat?', opts: [{ emoji: '🍜', lbl: 'Noodle Soup', ok: true }, { emoji: '🍞', lbl: 'Bread' }] },
  },
  {
    id: 'kelas-seni',
    title: 'Kelas Seni (Art Class)',
    scene: '🎨',
    desc: 'Cerita kelas seni',
    primer: [
      { en: 'What do you need for art class?', id: 'Kamu butuh apa untuk kelas seni?' },
      { en: 'I need paint and crayons.', id: 'Aku butuh cat dan krayon.' },
    ],
    drill: [
      { en: 'I draw a line with a ruler.', opts: [{ emoji: '📏', ok: true }, { emoji: '✂️' }] },
      { en: 'I cut paper with scissors.', opts: [{ emoji: '✂️', ok: true }, { emoji: '🖍️' }] },
    ],
    story: ['Kiki brings a notebook.', 'Her friend brings crayons.', 'Kiki paints a picture.'],
    question: { en: 'What does Kiki use to paint?', opts: [{ emoji: '🎨', lbl: 'Paint', ok: true }, { emoji: '🖍️', lbl: 'Crayons' }] },
  },
  {
    id: 'ramalan-cuaca',
    title: 'Ramalan Cuaca (Weather Forecast)',
    scene: '⛅',
    desc: 'Cerita cuaca',
    primer: [
      { en: 'What is the weather like today?', id: 'Bagaimana cuaca hari ini?' },
      { en: 'It is sunny and hot.', id: 'Cuacanya cerah dan panas.' },
    ],
    drill: [
      { en: 'It is rainy today.', opts: [{ emoji: '🌧️', ok: true }, { emoji: '☀️' }] },
      { en: 'The wind is strong and windy.', opts: [{ emoji: '💨', ok: true }, { emoji: '❄️' }] },
    ],
    story: ['Yesterday was cloudy.', 'Today the sky is sunny.', 'Tomorrow it will be rainy.'],
    question: { en: 'What is the weather like today?', opts: [{ emoji: '☀️', lbl: 'Sunny', ok: true }, { emoji: '☁️', lbl: 'Cloudy' }] },
  },
  {
    id: 'depan-cermin',
    title: 'Di Depan Cermin (In Front of the Mirror)',
    scene: '🪞',
    desc: 'Cerita depan cermin',
    primer: [
      { en: 'What are you doing?', id: 'Kamu sedang apa?' },
      { en: 'I am brushing my tooth.', id: 'Aku sedang menyikat gigiku.' },
    ],
    drill: [
      { en: 'I wash my hand.', opts: [{ emoji: '✋', ok: true }, { emoji: '🦶' }] },
      { en: 'I point with my finger.', opts: [{ emoji: '👆', ok: true }, { emoji: '💪' }] },
    ],
    story: ['Budi looks in the mirror.', 'He washes his hand first.', 'Then he brushes his tooth.'],
    question: { en: 'What does Budi do first?', opts: [{ emoji: '✋', lbl: 'Wash His Hand', ok: true }, { emoji: '🦷', lbl: 'Brush His Tooth' }] },
  },
  {
    id: 'stasiun-kereta',
    title: 'Di Stasiun Kereta (At the Train Station)',
    scene: '🚆',
    desc: 'Cerita stasiun kereta',
    primer: [
      { en: 'When does the train leave?', id: 'Kapan keretanya berangkat?' },
      { en: 'The train is fast.', id: 'Keretanya cepat.' },
    ],
    drill: [
      { en: 'I ride a bicycle to the station.', opts: [{ emoji: '🚲', ok: true }, { emoji: '🚗' }] },
      { en: 'The taxi waits outside.', opts: [{ emoji: '🚕', ok: true }, { emoji: '🚚' }] },
    ],
    story: ['Dewi takes a taxi to the station.', 'Her brother rides a bus.', 'Dewi boards the train.'],
    question: { en: 'What does Dewi board?', opts: [{ emoji: '🚆', lbl: 'The Train', ok: true }, { emoji: '🚌', lbl: 'The Bus' }] },
  },
  {
    id: 'hari-olahraga',
    title: 'Hari Olahraga (Sports Day)',
    scene: '🏅',
    desc: 'Cerita hari olahraga',
    primer: [
      { en: 'What sport do you like?', id: 'Olahraga apa yang kamu suka?' },
      { en: 'I like playing football.', id: 'Aku suka main sepak bola.' },
    ],
    drill: [
      { en: 'She plays basketball well.', opts: [{ emoji: '🏀', ok: true }, { emoji: '🎾' }] },
      { en: 'He enjoys cycling every weekend.', opts: [{ emoji: '🚴', ok: true }, { emoji: '🏊' }] },
    ],
    story: ['Rio plays badminton first.', 'His friend plays tennis.', 'Then Rio goes swimming.'],
    question: { en: 'What does Rio do after badminton?', opts: [{ emoji: '🏊', lbl: 'Swimming', ok: true }, { emoji: '🎾', lbl: 'Tennis' }] },
  },
  {
    id: 'beres-beres',
    title: 'Beres-beres Rumah (Tidying the House)',
    scene: '🧹',
    desc: 'Cerita beres-beres',
    primer: [
      { en: 'Can you help me clean?', id: 'Bisa bantu aku bersih-bersih?' },
      { en: 'I will sweep the floor.', id: 'Aku akan menyapu lantai.' },
    ],
    drill: [
      { en: 'I open the window.', opts: [{ emoji: '🪟', ok: true }, { emoji: '🚪' }] },
      { en: 'She waters the garden.', opts: [{ emoji: '🌻', ok: true }, { emoji: '🧱' }] },
    ],
    story: ['Ani cleans the living room.', 'Her sister cleans the bedroom.', 'Ani sweeps the kitchen floor.'],
    question: { en: 'What does Ani sweep?', opts: [{ emoji: '🍳', lbl: 'The Kitchen Floor', ok: true }, { emoji: '🛏️', lbl: 'The Bedroom' }] },
  },
];

/**
 * Listening Little Stars — materi PERTAMA yang pakai format baru
 * `ListeningSentenceTopic` (permintaan user: "format dan flow nya mengikuti
 * vocab") — Explorer/Adventurer TIDAK disentuh (types.ts
 * `AnyListeningTopic`). Tiap item = 1 kalimat sederhana (kata-kata dari
 * kosakata Little Stars yang sudah dikenal — lihat `VOCAB_TOPICS_LITTLE_STARS`
 * di atas, riset & pemetaan tema lengkap: `materi/listening.md`)
 * DENGAN pertanyaan komprehensi di akhir (permintaan user: "tidak ada
 * pertanyaan, maka tambahkan pertanyaan di akhir kalimat") — beda dari
 * `LISTENING_TOPICS` (Explorer) yang cuma py 1 pertanyaan di ujung SEMUA
 * drill (Tantangan), di sini SETIAP kalimat py pertanyaannya sendiri.
 * `en`/`id` = kata kunci tunggal, dipakai sbg `itemRef` di event
 * logging (BUKAN target Eja Kata — fungsi itu sudah dihapus total dari
 * `games/listening.ts`, Tantangan sekarang cuma 1 aktivitas Susun Kalimat).
 * `example` = kalimat lengkap (target Susun Kalimat/Kenalan 🔊/mic) — kata
 * kunci sebaiknya tetap muncul persis di `example.en` (whole-word, konvensi
 * kualitas data yang sama dgn VocabItem, diverifikasi manual per sesi —
 * TIDAK ada runtime enforcement spt `blankSentence()` Vocab).
 */
export const LISTENING_TOPICS_LITTLE_STARS: ListeningSentenceTopic[] = [
  {
    id: 'kegiatan-sehari-hari',
    title: 'Kegiatan Sehari-hari (Daily Activities)',
    desc: '10 kalimat',
    items: [
      {
        en: 'Cat',
        id: 'Kucing',
        emoji: '🐱',
        example: { en: 'The cat is sleeping.', id: 'Kucingnya sedang tidur.', emoji: '😴' },
        question: {
          en: 'What is the cat doing?',
          id: 'Kucing itu sedang apa?',
          options: [
            { emoji: '😴', text: 'Sleeping', ok: true },
            { emoji: '🏃', text: 'Running', ok: false },
            { emoji: '🍽️', text: 'Eating', ok: false },
            { emoji: '🤸', text: 'Jumping', ok: false },
          ],
        },
      },
      {
        en: 'Dog',
        id: 'Anjing',
        emoji: '🐶',
        example: { en: 'The dog can run fast.', id: 'Anjing itu bisa lari cepat.', emoji: '🏃' },
        question: {
          en: 'What can the dog do?',
          id: 'Anjing itu bisa apa?',
          options: [
            { emoji: '🏃', text: 'Run', ok: true },
            { emoji: '✈️', text: 'Fly', ok: false },
            { emoji: '🏊', text: 'Swim', ok: false },
            { emoji: '🎤', text: 'Sing', ok: false },
          ],
        },
      },
      {
        en: 'Apple',
        id: 'Apel',
        emoji: '🍎',
        example: { en: 'I eat a red apple.', id: 'Aku makan apel merah.', emoji: '🍎' },
        question: {
          en: 'What color is the apple?',
          id: 'Apa warna apelnya?',
          options: [
            { emoji: '🔴', text: 'Red', ok: true },
            { emoji: '🔵', text: 'Blue', ok: false },
            { emoji: '🟢', text: 'Green', ok: false },
            { emoji: '🟡', text: 'Yellow', ok: false },
          ],
        },
      },
      {
        en: 'Milk',
        id: 'Susu',
        emoji: '🥛',
        example: { en: 'I drink milk every day.', id: 'Aku minum susu setiap hari.', emoji: '🥛' },
        question: {
          en: 'What does she drink?',
          id: 'Dia minum apa?',
          options: [
            { emoji: '🥛', text: 'Milk', ok: true },
            { emoji: '🧃', text: 'Juice', ok: false },
            { emoji: '💧', text: 'Water', ok: false },
            { emoji: '🍵', text: 'Tea', ok: false },
          ],
        },
      },
      {
        en: 'Book',
        id: 'Buku',
        emoji: '📖',
        example: { en: 'I read a book at night.', id: 'Aku membaca buku di malam hari.', emoji: '📖' },
        question: {
          en: 'When does she read?',
          id: 'Kapan dia membaca?',
          options: [
            { emoji: '🌙', text: 'Night', ok: true },
            { emoji: '🌅', text: 'Morning', ok: false },
            { emoji: '☀️', text: 'Noon', ok: false },
            { emoji: '🏫', text: 'School', ok: false },
          ],
        },
      },
      {
        en: 'Ball',
        id: 'Bola',
        emoji: '⚽',
        example: { en: 'We play with a ball.', id: 'Kami bermain dengan bola.', emoji: '⚽' },
        question: {
          en: 'What do we play with?',
          id: 'Kami bermain dengan apa?',
          options: [
            { emoji: '⚽', text: 'Ball', ok: true },
            { emoji: '🪁', text: 'Kite', ok: false },
            { emoji: '🪆', text: 'Doll', ok: false },
            { emoji: '🚗', text: 'Car', ok: false },
          ],
        },
      },
      {
        en: 'Bird',
        id: 'Burung',
        emoji: '🐦',
        example: { en: 'The bird can sing.', id: 'Burung itu bisa bernyanyi.', emoji: '🎤' },
        question: {
          en: 'What can the bird do?',
          id: 'Burung itu bisa apa?',
          options: [
            { emoji: '🎤', text: 'Sing', ok: true },
            { emoji: '🏊', text: 'Swim', ok: false },
            { emoji: '🍳', text: 'Cook', ok: false },
            { emoji: '🤸', text: 'Jump', ok: false },
          ],
        },
      },
      {
        en: 'Frog',
        id: 'Katak',
        emoji: '🐸',
        example: { en: 'The frog can jump high.', id: 'Katak itu bisa melompat tinggi.', emoji: '🤸' },
        question: {
          en: 'What can the frog do?',
          id: 'Katak itu bisa apa?',
          options: [
            { emoji: '🤸', text: 'Jump', ok: true },
            { emoji: '✈️', text: 'Fly', ok: false },
            { emoji: '🎤', text: 'Sing', ok: false },
            { emoji: '😴', text: 'Sleep', ok: false },
          ],
        },
      },
      {
        en: 'Hands',
        id: 'Tangan',
        emoji: '🙌',
        example: { en: 'He washes his hands.', id: 'Dia mencuci tangannya.', emoji: '🙌' },
        question: {
          en: 'What does he wash?',
          id: 'Dia mencuci apa?',
          options: [
            { emoji: '🙌', text: 'Hands', ok: true },
            { emoji: '😊', text: 'Face', ok: false },
            { emoji: '🦶', text: 'Feet', ok: false },
            { emoji: '💇', text: 'Hair', ok: false },
          ],
        },
      },
      {
        en: 'Happy',
        id: 'Bahagia',
        emoji: '😊',
        example: { en: 'She smiles because she is happy.', id: 'Dia tersenyum karena dia bahagia.', emoji: '😊' },
        question: {
          en: 'How does she feel?',
          id: 'Bagaimana perasaannya?',
          options: [
            { emoji: '😊', text: 'Happy', ok: true },
            { emoji: '😢', text: 'Sad', ok: false },
            { emoji: '😠', text: 'Angry', ok: false },
            { emoji: '😴', text: 'Tired', ok: false },
          ],
        },
      },
    ],
  },
  /**
   * Topik ke-2 Listening Little Stars (permintaan user: "buat materi baru
   * jadi di bawah Kegiatan Sehari-hari") — dipakai sekaligus utk
   * memverifikasi redesain flow (Kenalan "Dengar & Tunjuk" tanpa
   * pertanyaan, Latihan Inti mix "Dengar & Jawab"+"Benar atau Salah",
   * `games/listening.ts`). `example.emoji` tiap item SENGAJA semua beda
   * (dipakai sbg gambar jawaban di Kenalan "Dengar & Tunjuk" — kalau ada
   * duplikat, distraktor bisa kebetulan sama dgn jawaban benar).
   */
  {
    id: 'di-sekolah',
    title: 'Di Sekolah (At School)',
    desc: '10 kalimat',
    items: [
      {
        en: 'Bag',
        id: 'Tas',
        emoji: '🎒',
        // Sengaja BUKAN soal warna (bug dilaporkan user: dulu "I carry a
        // blue bag" tapi emoji 🎒 renders coklat/merah di semua platform,
        // bukan biru — Unicode tidak punya varian warna utk emoji tas).
        // Diganti soal "isi tas" yang objeknya SEMUA py emoji warna tetap
        // yang cocok (buku/pensil/bola/boneka), tidak bergantung asumsi
        // warna sembarang emoji.
        example: { en: 'I put my book in the bag.', id: 'Aku memasukkan bukuku ke dalam tas.', emoji: '🎒' },
        question: {
          en: 'What does she put in the bag?',
          id: 'Dia memasukkan apa ke dalam tas?',
          options: [
            { emoji: '📖', text: 'Book', ok: true },
            { emoji: '✏️', text: 'Pencil', ok: false },
            { emoji: '⚽', text: 'Ball', ok: false },
            { emoji: '🧸', text: 'Toy', ok: false },
          ],
        },
      },
      {
        en: 'Pencil',
        id: 'Pensil',
        emoji: '✏️',
        example: { en: 'I write with a pencil.', id: 'Aku menulis dengan pensil.', emoji: '✏️' },
        question: {
          en: 'What does she write with?',
          id: 'Dia menulis dengan apa?',
          options: [
            { emoji: '✏️', text: 'Pencil', ok: true },
            { emoji: '📖', text: 'Book', ok: false },
            { emoji: '🪑', text: 'Chair', ok: false },
            { emoji: '🎒', text: 'Bag', ok: false },
          ],
        },
      },
      {
        en: 'Chair',
        id: 'Kursi',
        emoji: '🪑',
        example: { en: 'I sit on a chair.', id: 'Aku duduk di kursi.', emoji: '🪑' },
        question: {
          en: 'What does she sit on?',
          id: 'Dia duduk di atas apa?',
          options: [
            { emoji: '🪑', text: 'Chair', ok: true },
            { emoji: '🛏️', text: 'Bed', ok: false },
            { emoji: '🛋️', text: 'Sofa', ok: false },
            { emoji: '📦', text: 'Box', ok: false },
          ],
        },
      },
      {
        en: 'Kind',
        id: 'Baik Hati',
        emoji: '🤗',
        example: { en: 'The teacher is kind.', id: 'Gurunya baik hati.', emoji: '🤗' },
        question: {
          en: 'How is the teacher?',
          id: 'Bagaimana gurunya?',
          options: [
            { emoji: '🤗', text: 'Kind', ok: true },
            { emoji: '😠', text: 'Angry', ok: false },
            { emoji: '😢', text: 'Sad', ok: false },
            { emoji: '😴', text: 'Sleepy', ok: false },
          ],
        },
      },
      {
        en: 'Friend',
        id: 'Teman',
        emoji: '🧑‍🤝‍🧑',
        example: { en: 'I play with my friend.', id: 'Aku bermain dengan temanku.', emoji: '🧑‍🤝‍🧑' },
        question: {
          en: 'Who does she play with?',
          id: 'Dia bermain dengan siapa?',
          options: [
            { emoji: '🧑‍🤝‍🧑', text: 'Friend', ok: true },
            { emoji: '👧', text: 'Sister', ok: false },
            { emoji: '🧑‍🏫', text: 'Teacher', ok: false },
            { emoji: '👦', text: 'Brother', ok: false },
          ],
        },
      },
      {
        en: 'Draw',
        id: 'Menggambar',
        emoji: '🎨',
        example: { en: 'I can draw a cat.', id: 'Aku bisa menggambar kucing.', emoji: '🐱' },
        question: {
          en: 'What can she draw?',
          id: 'Dia bisa menggambar apa?',
          options: [
            { emoji: '🐱', text: 'Cat', ok: true },
            { emoji: '🐶', text: 'Dog', ok: false },
            { emoji: '☀️', text: 'Sun', ok: false },
            { emoji: '⭐', text: 'Star', ok: false },
          ],
        },
      },
      {
        en: 'Five',
        id: 'Lima',
        emoji: '5️⃣',
        example: { en: 'I count to five.', id: 'Aku menghitung sampai lima.', emoji: '5️⃣' },
        question: {
          en: 'What number does she count to?',
          id: 'Dia menghitung sampai angka berapa?',
          options: [
            { emoji: '5️⃣', text: 'Five', ok: true },
            { emoji: '3️⃣', text: 'Three', ok: false },
            { emoji: '7️⃣', text: 'Seven', ok: false },
            { emoji: '🔟', text: 'Ten', ok: false },
          ],
        },
      },
      {
        en: 'Hands',
        id: 'Tangan',
        emoji: '👏',
        example: { en: 'We clap our hands.', id: 'Kami bertepuk tangan.', emoji: '👏' },
        question: {
          en: 'What do we clap?',
          id: 'Kami bertepuk apa?',
          options: [
            { emoji: '👏', text: 'Hands', ok: true },
            { emoji: '🦶', text: 'Feet', ok: false },
            { emoji: '🦵', text: 'Knees', ok: false },
            { emoji: '😀', text: 'Face', ok: false },
          ],
        },
      },
      {
        en: 'Circle',
        id: 'Lingkaran',
        emoji: '⭕',
        example: { en: 'We sit in a circle.', id: 'Kami duduk melingkar.', emoji: '⭕' },
        question: {
          en: 'How do we sit?',
          id: 'Bagaimana kami duduk?',
          options: [
            { emoji: '⭕', text: 'Circle', ok: true },
            { emoji: '⬜', text: 'Square', ok: false },
            { emoji: '🔺', text: 'Triangle', ok: false },
            { emoji: '⭐', text: 'Star', ok: false },
          ],
        },
      },
      {
        en: 'Song',
        id: 'Lagu',
        emoji: '🎵',
        example: { en: 'We sing a song together.', id: 'Kami menyanyikan lagu bersama.', emoji: '🎵' },
        question: {
          en: 'What do we sing?',
          id: 'Kami menyanyikan apa?',
          options: [
            { emoji: '🎵', text: 'Song', ok: true },
            { emoji: '📖', text: 'Story', ok: false },
            { emoji: '📝', text: 'Poem', ok: false },
            { emoji: '🎮', text: 'Game', ok: false },
          ],
        },
      },
    ],
  },
  /**
   * 8 topik tambahan (sesi ini) — menggenapkan Listening Little Stars dari
   * 2 jadi 10 topik (target CLAUDE.md ≥10 topik/skill). Riset & rasional
   * lengkap: `materi/listening.md` §5. Tema dipetakan dari 8 topik
   * `VOCAB_TOPICS_LITTLE_STARS` yang belum pernah disentuh Listening
   * (salam-sopan-santun, kenal-warna, bentuk, keluargaku, tubuhku, pakaian,
   * kendaraan, perasaanku) — kosakata sudah dikenal anak lewat Vocab,
   * dilatih ulang di sini lewat modalitas beda (kalimat+pertanyaan dengar),
   * bukan duplikasi. `example.emoji` tiap item dijaga beda dalam 1 topik
   * (konvensi data, lihat komentar topik "Di Sekolah" di atas).
   */
  {
    id: 'halo-terima-kasih',
    title: 'Halo & Terima Kasih (Hello & Thank You)',
    desc: '10 kalimat',
    items: [
      {
        en: 'Hello',
        id: 'Halo',
        emoji: '🙋',
        example: { en: 'I wave and say hello.', id: 'Aku melambai dan mengucapkan halo.', emoji: '👋' },
        question: {
          en: 'What does she say?',
          id: 'Dia mengucapkan apa?',
          options: [
            { emoji: '👋', text: 'Hello', ok: true },
            { emoji: '🤗', text: 'Thank You', ok: false },
            { emoji: '🙏', text: 'Please', ok: false },
            { emoji: '😔', text: 'Sorry', ok: false },
          ],
        },
      },
      {
        en: 'Goodbye',
        id: 'Sampai Jumpa',
        emoji: '👋',
        example: { en: 'I say goodbye to my teacher.', id: 'Aku mengucapkan sampai jumpa pada guruku.', emoji: '🚶' },
        question: {
          en: 'Who does she say goodbye to?',
          id: 'Dia mengucapkan sampai jumpa pada siapa?',
          options: [
            { emoji: '🧑‍🏫', text: 'Teacher', ok: true },
            { emoji: '👧', text: 'Sister', ok: false },
            { emoji: '🐶', text: 'Dog', ok: false },
            { emoji: '👶', text: 'Baby', ok: false },
          ],
        },
      },
      {
        en: 'Please',
        id: 'Tolong',
        emoji: '🙏',
        example: { en: 'I say please when I ask.', id: 'Aku mengucapkan tolong saat meminta.', emoji: '🙏' },
        question: {
          en: 'What does she say when she asks?',
          id: 'Dia mengucapkan apa saat meminta?',
          options: [
            { emoji: '🙏', text: 'Please', ok: true },
            { emoji: '👋', text: 'Hello', ok: false },
            { emoji: '😔', text: 'Sorry', ok: false },
            { emoji: '👍', text: 'Yes', ok: false },
          ],
        },
      },
      {
        en: 'Thank You',
        id: 'Terima Kasih',
        emoji: '🤗',
        example: { en: 'I say thank you for the gift.', id: 'Aku mengucapkan terima kasih atas hadiahnya.', emoji: '🎁' },
        question: {
          en: 'What does she say for the gift?',
          id: 'Dia mengucapkan apa atas hadiahnya?',
          options: [
            { emoji: '🤗', text: 'Thank You', ok: true },
            { emoji: '😔', text: 'Sorry', ok: false },
            { emoji: '👋', text: 'Goodbye', ok: false },
            { emoji: '🙏', text: 'Please', ok: false },
          ],
        },
      },
      {
        en: 'Sorry',
        id: 'Maaf',
        emoji: '😔',
        example: { en: 'I say sorry to my friend.', id: 'Aku mengucapkan maaf pada temanku.', emoji: '😔' },
        question: {
          en: 'Who does she say sorry to?',
          id: 'Dia mengucapkan maaf pada siapa?',
          options: [
            { emoji: '🧑‍🤝‍🧑', text: 'Friend', ok: true },
            { emoji: '👩', text: 'Mom', ok: false },
            { emoji: '🧑‍🏫', text: 'Teacher', ok: false },
            { emoji: '👶', text: 'Baby', ok: false },
          ],
        },
      },
      {
        en: 'Excuse Me',
        id: 'Permisi',
        emoji: '✋',
        example: { en: 'I say excuse me to pass by.', id: 'Aku mengucapkan permisi untuk lewat.', emoji: '✋' },
        question: {
          en: 'What does she say to pass by?',
          id: 'Dia mengucapkan apa untuk lewat?',
          options: [
            { emoji: '✋', text: 'Excuse Me', ok: true },
            { emoji: '👋', text: 'Hello', ok: false },
            { emoji: '🙏', text: 'Please', ok: false },
            { emoji: '🤗', text: 'Thank You', ok: false },
          ],
        },
      },
      {
        en: 'Yes',
        id: 'Ya',
        emoji: '👍',
        example: { en: 'I say yes when I agree.', id: 'Aku mengucapkan ya saat setuju.', emoji: '👍' },
        question: {
          en: 'What does she say when she agrees?',
          id: 'Dia mengucapkan apa saat setuju?',
          options: [
            { emoji: '👍', text: 'Yes', ok: true },
            { emoji: '👎', text: 'No', ok: false },
            { emoji: '😔', text: 'Sorry', ok: false },
            { emoji: '🙏', text: 'Please', ok: false },
          ],
        },
      },
      {
        en: 'No',
        id: 'Tidak',
        emoji: '👎',
        example: { en: 'I say no when I disagree.', id: 'Aku mengucapkan tidak saat tidak setuju.', emoji: '👎' },
        question: {
          en: 'What does she say when she disagrees?',
          id: 'Dia mengucapkan apa saat tidak setuju?',
          options: [
            { emoji: '👎', text: 'No', ok: true },
            { emoji: '👍', text: 'Yes', ok: false },
            { emoji: '👋', text: 'Hello', ok: false },
            { emoji: '😔', text: 'Sorry', ok: false },
          ],
        },
      },
      {
        en: 'Good Morning',
        id: 'Selamat Pagi',
        emoji: '🌅',
        example: { en: 'I say good morning to my mom.', id: 'Aku mengucapkan selamat pagi pada ibuku.', emoji: '🌅' },
        question: {
          en: 'Who does she say good morning to?',
          id: 'Dia mengucapkan selamat pagi pada siapa?',
          options: [
            { emoji: '👩', text: 'Mom', ok: true },
            { emoji: '👨', text: 'Dad', ok: false },
            { emoji: '🧑‍🏫', text: 'Teacher', ok: false },
            { emoji: '👴', text: 'Grandpa', ok: false },
          ],
        },
      },
      {
        en: 'Good Night',
        id: 'Selamat Malam',
        emoji: '🌙',
        example: { en: 'I say good night before I sleep.', id: 'Aku mengucapkan selamat malam sebelum tidur.', emoji: '🌙' },
        question: {
          en: 'When does she say good night?',
          id: 'Kapan dia mengucapkan selamat malam?',
          options: [
            { emoji: '🌙', text: 'Before Sleep', ok: true },
            { emoji: '🌅', text: 'Morning', ok: false },
            { emoji: '🏫', text: 'At School', ok: false },
            { emoji: '🍽️', text: 'At Lunch', ok: false },
          ],
        },
      },
    ],
  },
  {
    id: 'warna-warni',
    title: 'Warna-Warni (Colors)',
    desc: '10 kalimat',
    items: [
      {
        en: 'Red',
        id: 'Merah',
        emoji: '🔴',
        example: { en: 'The ball is red.', id: 'Bolanya berwarna merah.', emoji: '🔴' },
        question: {
          en: 'What color is the ball?',
          id: 'Apa warna bolanya?',
          options: [
            { emoji: '🔴', text: 'Red', ok: true },
            { emoji: '🔵', text: 'Blue', ok: false },
            { emoji: '🟢', text: 'Green', ok: false },
            { emoji: '🟡', text: 'Yellow', ok: false },
          ],
        },
      },
      {
        en: 'Orange',
        id: 'Oranye',
        emoji: '🟠',
        example: { en: 'The pumpkin is orange.', id: 'Labunya berwarna oranye.', emoji: '🟠' },
        question: {
          en: 'What color is the pumpkin?',
          id: 'Apa warna labunya?',
          options: [
            { emoji: '🟠', text: 'Orange', ok: true },
            { emoji: '🟣', text: 'Purple', ok: false },
            { emoji: '🟤', text: 'Brown', ok: false },
            { emoji: '⚫', text: 'Black', ok: false },
          ],
        },
      },
      {
        en: 'Yellow',
        id: 'Kuning',
        emoji: '🟡',
        example: { en: 'The banana is yellow.', id: 'Pisangnya berwarna kuning.', emoji: '🟡' },
        question: {
          en: 'What color is the banana?',
          id: 'Apa warna pisangnya?',
          options: [
            { emoji: '🟡', text: 'Yellow', ok: true },
            { emoji: '⚪', text: 'White', ok: false },
            { emoji: '🩷', text: 'Pink', ok: false },
            { emoji: '🟢', text: 'Green', ok: false },
          ],
        },
      },
      {
        en: 'Green',
        id: 'Hijau',
        emoji: '🟢',
        example: { en: 'The leaf is green.', id: 'Daunnya berwarna hijau.', emoji: '🟢' },
        question: {
          en: 'What color is the leaf?',
          id: 'Apa warna daunnya?',
          options: [
            { emoji: '🟢', text: 'Green', ok: true },
            { emoji: '🔴', text: 'Red', ok: false },
            { emoji: '🟠', text: 'Orange', ok: false },
            { emoji: '🔵', text: 'Blue', ok: false },
          ],
        },
      },
      {
        en: 'Blue',
        id: 'Biru',
        emoji: '🔵',
        example: { en: 'The sky is blue.', id: 'Langitnya berwarna biru.', emoji: '🔵' },
        question: {
          en: 'What color is the sky?',
          id: 'Apa warna langitnya?',
          options: [
            { emoji: '🔵', text: 'Blue', ok: true },
            { emoji: '🟡', text: 'Yellow', ok: false },
            { emoji: '🟣', text: 'Purple', ok: false },
            { emoji: '🟤', text: 'Brown', ok: false },
          ],
        },
      },
      {
        en: 'Purple',
        id: 'Ungu',
        emoji: '🟣',
        example: { en: 'The grapes are purple.', id: 'Anggurnya berwarna ungu.', emoji: '🟣' },
        question: {
          en: 'What color are the grapes?',
          id: 'Apa warna anggurnya?',
          options: [
            { emoji: '🟣', text: 'Purple', ok: true },
            { emoji: '🟢', text: 'Green', ok: false },
            { emoji: '⚫', text: 'Black', ok: false },
            { emoji: '🩷', text: 'Pink', ok: false },
          ],
        },
      },
      {
        en: 'Brown',
        id: 'Cokelat',
        emoji: '🟤',
        example: { en: 'The tree trunk is brown.', id: 'Batang pohonnya berwarna cokelat.', emoji: '🟤' },
        question: {
          en: 'What color is the tree trunk?',
          id: 'Apa warna batang pohonnya?',
          options: [
            { emoji: '🟤', text: 'Brown', ok: true },
            { emoji: '⚪', text: 'White', ok: false },
            { emoji: '🔴', text: 'Red', ok: false },
            { emoji: '🟠', text: 'Orange', ok: false },
          ],
        },
      },
      {
        en: 'Black',
        id: 'Hitam',
        emoji: '⚫',
        example: { en: 'The cat is black.', id: 'Kucingnya berwarna hitam.', emoji: '⚫' },
        question: {
          en: 'What color is the cat?',
          id: 'Apa warna kucingnya?',
          options: [
            { emoji: '⚫', text: 'Black', ok: true },
            { emoji: '⚪', text: 'White', ok: false },
            { emoji: '🟡', text: 'Yellow', ok: false },
            { emoji: '🟣', text: 'Purple', ok: false },
          ],
        },
      },
      {
        en: 'White',
        id: 'Putih',
        emoji: '⚪',
        example: { en: 'The cloud is white.', id: 'Awannya berwarna putih.', emoji: '⚪' },
        question: {
          en: 'What color is the cloud?',
          id: 'Apa warna awannya?',
          options: [
            { emoji: '⚪', text: 'White', ok: true },
            { emoji: '⚫', text: 'Black', ok: false },
            { emoji: '🔵', text: 'Blue', ok: false },
            { emoji: '🟤', text: 'Brown', ok: false },
          ],
        },
      },
      {
        en: 'Pink',
        id: 'Merah Muda',
        emoji: '🩷',
        example: { en: 'The flower is pink.', id: 'Bunganya berwarna merah muda.', emoji: '🩷' },
        question: {
          en: 'What color is the flower?',
          id: 'Apa warna bunganya?',
          options: [
            { emoji: '🩷', text: 'Pink', ok: true },
            { emoji: '🔴', text: 'Red', ok: false },
            { emoji: '🟢', text: 'Green', ok: false },
            { emoji: '🟠', text: 'Orange', ok: false },
          ],
        },
      },
    ],
  },
  {
    id: 'bentuk-benda',
    title: 'Bentuk Benda (Shapes)',
    desc: '10 kalimat',
    items: [
      {
        en: 'Circle',
        id: 'Lingkaran',
        emoji: '⭕',
        example: { en: 'The clock is a circle.', id: 'Jamnya berbentuk lingkaran.', emoji: '⭕' },
        question: {
          en: 'What shape is the clock?',
          id: 'Apa bentuk jamnya?',
          options: [
            { emoji: '⭕', text: 'Circle', ok: true },
            { emoji: '⬜', text: 'Square', ok: false },
            { emoji: '🔺', text: 'Triangle', ok: false },
            { emoji: '⭐', text: 'Star', ok: false },
          ],
        },
      },
      {
        en: 'Square',
        id: 'Persegi',
        emoji: '⬜',
        example: { en: 'The window is a square.', id: 'Jendelanya berbentuk persegi.', emoji: '⬜' },
        question: {
          en: 'What shape is the window?',
          id: 'Apa bentuk jendelanya?',
          options: [
            { emoji: '⬜', text: 'Square', ok: true },
            { emoji: '⭕', text: 'Circle', ok: false },
            { emoji: '❤️', text: 'Heart', ok: false },
            { emoji: '💎', text: 'Diamond', ok: false },
          ],
        },
      },
      {
        en: 'Triangle',
        id: 'Segitiga',
        emoji: '🔺',
        example: { en: 'The mountain is a triangle.', id: 'Gunungnya berbentuk segitiga.', emoji: '🔺' },
        question: {
          en: 'What shape is the mountain?',
          id: 'Apa bentuk gunungnya?',
          options: [
            { emoji: '🔺', text: 'Triangle', ok: true },
            { emoji: '⬜', text: 'Square', ok: false },
            { emoji: '🥚', text: 'Oval', ok: false },
            { emoji: '➕', text: 'Cross', ok: false },
          ],
        },
      },
      {
        en: 'Star',
        id: 'Bintang',
        emoji: '⭐',
        example: { en: 'The sky has a star.', id: 'Langitnya ada bintang.', emoji: '⭐' },
        question: {
          en: 'What shape is in the sky?',
          id: 'Apa bentuk yang ada di langit?',
          options: [
            { emoji: '⭐', text: 'Star', ok: true },
            { emoji: '🌙', text: 'Crescent', ok: false },
            { emoji: '⭕', text: 'Circle', ok: false },
            { emoji: '➡️', text: 'Arrow', ok: false },
          ],
        },
      },
      {
        en: 'Heart',
        id: 'Hati',
        emoji: '❤️',
        example: { en: 'The card has a heart.', id: 'Kartunya ada gambar hati.', emoji: '❤️' },
        question: {
          en: 'What shape is on the card?',
          id: 'Apa bentuk yang ada di kartunya?',
          options: [
            { emoji: '❤️', text: 'Heart', ok: true },
            { emoji: '⭐', text: 'Star', ok: false },
            { emoji: '💎', text: 'Diamond', ok: false },
            { emoji: '⭕', text: 'Circle', ok: false },
          ],
        },
      },
      {
        en: 'Diamond',
        id: 'Wajik',
        emoji: '💎',
        example: { en: 'The kite is a diamond.', id: 'Layangannya berbentuk wajik.', emoji: '💎' },
        question: {
          en: 'What shape is the kite?',
          id: 'Apa bentuk layangannya?',
          options: [
            { emoji: '💎', text: 'Diamond', ok: true },
            { emoji: '🔺', text: 'Triangle', ok: false },
            { emoji: '⬜', text: 'Square', ok: false },
            { emoji: '🌙', text: 'Crescent', ok: false },
          ],
        },
      },
      {
        en: 'Oval',
        id: 'Oval',
        emoji: '🥚',
        example: { en: 'The egg is an oval.', id: 'Telurnya berbentuk oval.', emoji: '🥚' },
        question: {
          en: 'What shape is the egg?',
          id: 'Apa bentuk telurnya?',
          options: [
            { emoji: '🥚', text: 'Oval', ok: true },
            { emoji: '⭕', text: 'Circle', ok: false },
            { emoji: '⭐', text: 'Star', ok: false },
            { emoji: '➕', text: 'Cross', ok: false },
          ],
        },
      },
      {
        en: 'Crescent',
        id: 'Bulan Sabit',
        emoji: '🌙',
        example: { en: 'The moon is a crescent tonight.', id: 'Bulannya berbentuk sabit malam ini.', emoji: '🌙' },
        question: {
          en: 'What shape is the moon tonight?',
          id: 'Apa bentuk bulan malam ini?',
          options: [
            { emoji: '🌙', text: 'Crescent', ok: true },
            { emoji: '⭕', text: 'Circle', ok: false },
            { emoji: '🔺', text: 'Triangle', ok: false },
            { emoji: '❤️', text: 'Heart', ok: false },
          ],
        },
      },
      {
        en: 'Cross',
        id: 'Silang',
        emoji: '➕',
        example: { en: 'This sticker is a cross.', id: 'Stikernya berbentuk silang.', emoji: '➕' },
        question: {
          en: 'What shape is the sticker?',
          id: 'Apa bentuk stikernya?',
          options: [
            { emoji: '➕', text: 'Cross', ok: true },
            { emoji: '⭐', text: 'Star', ok: false },
            { emoji: '➡️', text: 'Arrow', ok: false },
            { emoji: '⬜', text: 'Square', ok: false },
          ],
        },
      },
      {
        en: 'Arrow',
        id: 'Panah',
        emoji: '➡️',
        example: { en: 'The sign is an arrow.', id: 'Rambunya berbentuk panah.', emoji: '➡️' },
        question: {
          en: 'What shape is the sign?',
          id: 'Apa bentuk rambunya?',
          options: [
            { emoji: '➡️', text: 'Arrow', ok: true },
            { emoji: '➕', text: 'Cross', ok: false },
            { emoji: '🥚', text: 'Oval', ok: false },
            { emoji: '💎', text: 'Diamond', ok: false },
          ],
        },
      },
    ],
  },
  {
    id: 'keluarga-kita',
    title: 'Keluarga Kita (My Family)',
    desc: '10 kalimat',
    items: [
      {
        en: 'Mom',
        id: 'Ibu',
        emoji: '👩',
        example: { en: 'My mom cooks dinner.', id: 'Ibuku memasak makan malam.', emoji: '🍳' },
        question: {
          en: 'Who cooks dinner?',
          id: 'Siapa yang memasak makan malam?',
          options: [
            { emoji: '👩', text: 'Mom', ok: true },
            { emoji: '👨', text: 'Dad', ok: false },
            { emoji: '👧', text: 'Sister', ok: false },
            { emoji: '👵', text: 'Grandma', ok: false },
          ],
        },
      },
      {
        en: 'Dad',
        id: 'Ayah',
        emoji: '👨',
        example: { en: 'My dad drives the car.', id: 'Ayahku mengemudikan mobil.', emoji: '🚗' },
        question: {
          en: 'Who drives the car?',
          id: 'Siapa yang mengemudikan mobil?',
          options: [
            { emoji: '👨', text: 'Dad', ok: true },
            { emoji: '👩', text: 'Mom', ok: false },
            { emoji: '👦', text: 'Brother', ok: false },
            { emoji: '👴', text: 'Grandpa', ok: false },
          ],
        },
      },
      {
        en: 'Sister',
        id: 'Kakak/Adik Perempuan',
        emoji: '👧',
        example: { en: 'My sister sings a song.', id: 'Kakak perempuanku menyanyikan lagu.', emoji: '🎤' },
        question: {
          en: 'Who sings a song?',
          id: 'Siapa yang menyanyikan lagu?',
          options: [
            { emoji: '👧', text: 'Sister', ok: true },
            { emoji: '👦', text: 'Brother', ok: false },
            { emoji: '👶', text: 'Baby', ok: false },
            { emoji: '👩‍🦰', text: 'Aunt', ok: false },
          ],
        },
      },
      {
        en: 'Brother',
        id: 'Kakak/Adik Laki-laki',
        emoji: '👦',
        example: { en: 'My brother rides a bike.', id: 'Kakak laki-lakiku mengendarai sepeda.', emoji: '🚲' },
        question: {
          en: 'Who rides a bike?',
          id: 'Siapa yang mengendarai sepeda?',
          options: [
            { emoji: '👦', text: 'Brother', ok: true },
            { emoji: '👧', text: 'Sister', ok: false },
            { emoji: '🧑', text: 'Cousin', ok: false },
            { emoji: '🧔', text: 'Uncle', ok: false },
          ],
        },
      },
      {
        en: 'Grandma',
        id: 'Nenek',
        emoji: '👵',
        example: { en: 'My grandma tells a story.', id: 'Nenekku bercerita.', emoji: '📖' },
        question: {
          en: 'Who tells a story?',
          id: 'Siapa yang bercerita?',
          options: [
            { emoji: '👵', text: 'Grandma', ok: true },
            { emoji: '👴', text: 'Grandpa', ok: false },
            { emoji: '👩', text: 'Mom', ok: false },
            { emoji: '👨', text: 'Dad', ok: false },
          ],
        },
      },
      {
        en: 'Grandpa',
        id: 'Kakek',
        emoji: '👴',
        example: { en: 'My grandpa waters the plants.', id: 'Kakekku menyiram tanaman.', emoji: '🌱' },
        question: {
          en: 'Who waters the plants?',
          id: 'Siapa yang menyiram tanaman?',
          options: [
            { emoji: '👴', text: 'Grandpa', ok: true },
            { emoji: '👵', text: 'Grandma', ok: false },
            { emoji: '🧔', text: 'Uncle', ok: false },
            { emoji: '👨', text: 'Dad', ok: false },
          ],
        },
      },
      {
        en: 'Baby',
        id: 'Bayi',
        emoji: '👶',
        example: { en: 'The baby sleeps all day.', id: 'Bayinya tidur sepanjang hari.', emoji: '😴' },
        question: {
          en: 'Who sleeps all day?',
          id: 'Siapa yang tidur sepanjang hari?',
          options: [
            { emoji: '👶', text: 'Baby', ok: true },
            { emoji: '👩', text: 'Mom', ok: false },
            { emoji: '👧', text: 'Sister', ok: false },
            { emoji: '👵', text: 'Grandma', ok: false },
          ],
        },
      },
      {
        en: 'Uncle',
        id: 'Paman',
        emoji: '🧔',
        example: { en: 'My uncle plays guitar.', id: 'Pamanku bermain gitar.', emoji: '🎸' },
        question: {
          en: 'Who plays guitar?',
          id: 'Siapa yang bermain gitar?',
          options: [
            { emoji: '🧔', text: 'Uncle', ok: true },
            { emoji: '👨', text: 'Dad', ok: false },
            { emoji: '🧑', text: 'Cousin', ok: false },
            { emoji: '👴', text: 'Grandpa', ok: false },
          ],
        },
      },
      {
        en: 'Aunt',
        id: 'Bibi',
        emoji: '👩‍🦰',
        example: { en: 'My aunt bakes a cake.', id: 'Bibiku membuat kue.', emoji: '🎂' },
        question: {
          en: 'Who bakes a cake?',
          id: 'Siapa yang membuat kue?',
          options: [
            { emoji: '👩‍🦰', text: 'Aunt', ok: true },
            { emoji: '👩', text: 'Mom', ok: false },
            { emoji: '👵', text: 'Grandma', ok: false },
            { emoji: '👧', text: 'Sister', ok: false },
          ],
        },
      },
      {
        en: 'Cousin',
        id: 'Sepupu',
        emoji: '🧑',
        example: { en: 'My cousin flies a kite.', id: 'Sepupuku menerbangkan layangan.', emoji: '🪁' },
        question: {
          en: 'Who flies a kite?',
          id: 'Siapa yang menerbangkan layangan?',
          options: [
            { emoji: '🧑', text: 'Cousin', ok: true },
            { emoji: '👦', text: 'Brother', ok: false },
            { emoji: '🧔', text: 'Uncle', ok: false },
            { emoji: '👶', text: 'Baby', ok: false },
          ],
        },
      },
    ],
  },
  {
    id: 'kepala-pundak',
    title: 'Kepala, Pundak, Lutut, Kaki (Head, Shoulders, Knees & Toes)',
    desc: '10 kalimat',
    items: [
      {
        en: 'Head',
        id: 'Kepala',
        emoji: '👤',
        example: { en: 'I nod my head.', id: 'Aku menganggukkan kepalaku.', emoji: '👤' },
        question: {
          en: 'What does she nod?',
          id: 'Apa yang dia anggukkan?',
          options: [
            { emoji: '👤', text: 'Head', ok: true },
            { emoji: '🙌', text: 'Hands', ok: false },
            { emoji: '👣', text: 'Feet', ok: false },
            { emoji: '👃', text: 'Nose', ok: false },
          ],
        },
      },
      {
        en: 'Shoulders',
        id: 'Pundak',
        emoji: '🤷',
        example: { en: 'I shrug my shoulders.', id: 'Aku mengangkat pundakku.', emoji: '🤷' },
        question: {
          en: 'What does she shrug?',
          id: 'Apa yang dia angkat?',
          options: [
            { emoji: '🤷', text: 'Shoulders', ok: true },
            { emoji: '🦵', text: 'Knees', ok: false },
            { emoji: '👂', text: 'Ears', ok: false },
            { emoji: '👄', text: 'Mouth', ok: false },
          ],
        },
      },
      {
        en: 'Knees',
        id: 'Lutut',
        emoji: '🦵',
        example: { en: 'I bend my knees.', id: 'Aku menekuk lututku.', emoji: '🦵' },
        question: {
          en: 'What does she bend?',
          id: 'Apa yang dia tekuk?',
          options: [
            { emoji: '🦵', text: 'Knees', ok: true },
            { emoji: '🦶', text: 'Toes', ok: false },
            { emoji: '👤', text: 'Head', ok: false },
            { emoji: '🙌', text: 'Hands', ok: false },
          ],
        },
      },
      {
        en: 'Toes',
        id: 'Jari Kaki',
        emoji: '🦶',
        example: { en: 'I wiggle my toes.', id: 'Aku menggoyangkan jari kakiku.', emoji: '🦶' },
        question: {
          en: 'What does she wiggle?',
          id: 'Apa yang dia goyangkan?',
          options: [
            { emoji: '🦶', text: 'Toes', ok: true },
            { emoji: '👣', text: 'Feet', ok: false },
            { emoji: '👀', text: 'Eyes', ok: false },
            { emoji: '👂', text: 'Ears', ok: false },
          ],
        },
      },
      {
        en: 'Eyes',
        id: 'Mata',
        emoji: '👀',
        example: { en: 'I close my eyes.', id: 'Aku menutup mataku.', emoji: '👀' },
        question: {
          en: 'What does she close?',
          id: 'Apa yang dia tutup?',
          options: [
            { emoji: '👀', text: 'Eyes', ok: true },
            { emoji: '👄', text: 'Mouth', ok: false },
            { emoji: '🙌', text: 'Hands', ok: false },
            { emoji: '🦵', text: 'Knees', ok: false },
          ],
        },
      },
      {
        en: 'Ears',
        id: 'Telinga',
        emoji: '👂',
        example: { en: 'I cover my ears.', id: 'Aku menutup telingaku.', emoji: '👂' },
        question: {
          en: 'What does she cover?',
          id: 'Apa yang dia tutup?',
          options: [
            { emoji: '👂', text: 'Ears', ok: true },
            { emoji: '👀', text: 'Eyes', ok: false },
            { emoji: '👃', text: 'Nose', ok: false },
            { emoji: '👣', text: 'Feet', ok: false },
          ],
        },
      },
      {
        en: 'Mouth',
        id: 'Mulut',
        emoji: '👄',
        example: { en: 'I open my mouth.', id: 'Aku membuka mulutku.', emoji: '👄' },
        question: {
          en: 'What does she open?',
          id: 'Apa yang dia buka?',
          options: [
            { emoji: '👄', text: 'Mouth', ok: true },
            { emoji: '👀', text: 'Eyes', ok: false },
            { emoji: '🙌', text: 'Hands', ok: false },
            { emoji: '🤷', text: 'Shoulders', ok: false },
          ],
        },
      },
      {
        en: 'Nose',
        id: 'Hidung',
        emoji: '👃',
        example: { en: 'I touch my nose.', id: 'Aku menyentuh hidungku.', emoji: '👃' },
        question: {
          en: 'What does she touch?',
          id: 'Apa yang dia sentuh?',
          options: [
            { emoji: '👃', text: 'Nose', ok: true },
            { emoji: '👂', text: 'Ears', ok: false },
            { emoji: '🦶', text: 'Toes', ok: false },
            { emoji: '👤', text: 'Head', ok: false },
          ],
        },
      },
      {
        en: 'Hands',
        id: 'Tangan',
        emoji: '🙌',
        example: { en: 'I clap my hands loudly.', id: 'Aku bertepuk tangan dengan keras.', emoji: '🙌' },
        question: {
          en: 'What does she clap?',
          id: 'Apa yang dia tepuk?',
          options: [
            { emoji: '🙌', text: 'Hands', ok: true },
            { emoji: '👣', text: 'Feet', ok: false },
            { emoji: '🦵', text: 'Knees', ok: false },
            { emoji: '🤷', text: 'Shoulders', ok: false },
          ],
        },
      },
      {
        en: 'Feet',
        id: 'Kaki',
        emoji: '👣',
        example: { en: 'I stomp my feet.', id: 'Aku menghentakkan kakiku.', emoji: '👣' },
        question: {
          en: 'What does she stomp?',
          id: 'Apa yang dia hentakkan?',
          options: [
            { emoji: '👣', text: 'Feet', ok: true },
            { emoji: '🙌', text: 'Hands', ok: false },
            { emoji: '👤', text: 'Head', ok: false },
            { emoji: '👄', text: 'Mouth', ok: false },
          ],
        },
      },
    ],
  },
  {
    id: 'baju-favorit',
    title: 'Baju Favorit (Favorite Clothes)',
    desc: '10 kalimat',
    items: [
      {
        en: 'Shirt',
        id: 'Kemeja',
        emoji: '👕',
        example: { en: 'I wear a blue shirt.', id: 'Aku memakai kemeja biru.', emoji: '👕' },
        question: {
          en: 'What does she wear?',
          id: 'Dia memakai apa?',
          options: [
            { emoji: '👕', text: 'Shirt', ok: true },
            { emoji: '👖', text: 'Pants', ok: false },
            { emoji: '👗', text: 'Dress', ok: false },
            { emoji: '🧢', text: 'Hat', ok: false },
          ],
        },
      },
      {
        en: 'Pants',
        id: 'Celana Panjang',
        emoji: '👖',
        example: { en: 'I wear long pants.', id: 'Aku memakai celana panjang.', emoji: '👖' },
        question: {
          en: 'What does she wear?',
          id: 'Dia memakai apa?',
          options: [
            { emoji: '👖', text: 'Pants', ok: true },
            { emoji: '🩳', text: 'Shorts', ok: false },
            { emoji: '👕', text: 'Shirt', ok: false },
            { emoji: '🧦', text: 'Socks', ok: false },
          ],
        },
      },
      {
        en: 'Dress',
        id: 'Gaun',
        emoji: '👗',
        example: { en: 'She wears a pink dress.', id: 'Dia memakai gaun merah muda.', emoji: '👗' },
        question: {
          en: 'What does she wear?',
          id: 'Dia memakai apa?',
          options: [
            { emoji: '👗', text: 'Dress', ok: true },
            { emoji: '👕', text: 'Shirt', ok: false },
            { emoji: '🧥', text: 'Jacket', ok: false },
            { emoji: '🧣', text: 'Scarf', ok: false },
          ],
        },
      },
      {
        en: 'Shoes',
        id: 'Sepatu',
        emoji: '👟',
        example: { en: 'I put on my shoes.', id: 'Aku memakai sepatuku.', emoji: '👟' },
        question: {
          en: 'What does she put on?',
          id: 'Dia memakai apa?',
          options: [
            { emoji: '👟', text: 'Shoes', ok: true },
            { emoji: '🧦', text: 'Socks', ok: false },
            { emoji: '🧤', text: 'Gloves', ok: false },
            { emoji: '🧢', text: 'Hat', ok: false },
          ],
        },
      },
      {
        en: 'Socks',
        id: 'Kaus Kaki',
        emoji: '🧦',
        example: { en: 'I wear warm socks.', id: 'Aku memakai kaus kaki hangat.', emoji: '🧦' },
        question: {
          en: 'What does she wear?',
          id: 'Dia memakai apa?',
          options: [
            { emoji: '🧦', text: 'Socks', ok: true },
            { emoji: '👟', text: 'Shoes', ok: false },
            { emoji: '🧤', text: 'Gloves', ok: false },
            { emoji: '🧣', text: 'Scarf', ok: false },
          ],
        },
      },
      {
        en: 'Hat',
        id: 'Topi',
        emoji: '🧢',
        example: { en: 'I wear a hat on a sunny day.', id: 'Aku memakai topi saat matahari terik.', emoji: '🧢' },
        question: {
          en: 'When does she wear a hat?',
          id: 'Kapan dia memakai topi?',
          options: [
            { emoji: '☀️', text: 'Sunny Day', ok: true },
            { emoji: '🌧️', text: 'Rainy Day', ok: false },
            { emoji: '🌙', text: 'Night', ok: false },
            { emoji: '🏫', text: 'School', ok: false },
          ],
        },
      },
      {
        en: 'Jacket',
        id: 'Jaket',
        emoji: '🧥',
        example: { en: 'I wear a jacket when it is cold.', id: 'Aku memakai jaket saat dingin.', emoji: '🧥' },
        question: {
          en: 'When does she wear a jacket?',
          id: 'Kapan dia memakai jaket?',
          options: [
            { emoji: '🥶', text: 'Cold', ok: true },
            { emoji: '🥵', text: 'Hot', ok: false },
            { emoji: '☀️', text: 'Sunny', ok: false },
            { emoji: '🏖️', text: 'Beach', ok: false },
          ],
        },
      },
      {
        en: 'Shorts',
        id: 'Celana Pendek',
        emoji: '🩳',
        example: { en: 'I wear shorts at the beach.', id: 'Aku memakai celana pendek di pantai.', emoji: '🩳' },
        question: {
          en: 'Where does she wear shorts?',
          id: 'Di mana dia memakai celana pendek?',
          options: [
            { emoji: '🏖️', text: 'Beach', ok: true },
            { emoji: '🏫', text: 'School', ok: false },
            { emoji: '🛏️', text: 'Bed', ok: false },
            { emoji: '⛪', text: 'Church', ok: false },
          ],
        },
      },
      {
        en: 'Scarf',
        id: 'Syal',
        emoji: '🧣',
        example: { en: 'I wear a scarf in winter.', id: 'Aku memakai syal saat musim dingin.', emoji: '🧣' },
        question: {
          en: 'When does she wear a scarf?',
          id: 'Kapan dia memakai syal?',
          options: [
            { emoji: '❄️', text: 'Winter', ok: true },
            { emoji: '☀️', text: 'Summer', ok: false },
            { emoji: '🌸', text: 'Spring', ok: false },
            { emoji: '🍂', text: 'Fall', ok: false },
          ],
        },
      },
      {
        en: 'Gloves',
        id: 'Sarung Tangan',
        emoji: '🧤',
        example: { en: 'I wear gloves to keep warm.', id: 'Aku memakai sarung tangan agar hangat.', emoji: '🧤' },
        question: {
          en: 'Why does she wear gloves?',
          id: 'Kenapa dia memakai sarung tangan?',
          options: [
            { emoji: '🥶', text: 'To Keep Warm', ok: true },
            { emoji: '🎨', text: 'To Paint', ok: false },
            { emoji: '🏊', text: 'To Swim', ok: false },
            { emoji: '🎮', text: 'To Play', ok: false },
          ],
        },
      },
    ],
  },
  {
    id: 'naik-apa',
    title: 'Naik Apa? (Let’s Go!)',
    desc: '10 kalimat',
    items: [
      {
        en: 'Car',
        id: 'Mobil',
        emoji: '🚗',
        example: { en: 'We drive to the park in a car.', id: 'Kami naik mobil ke taman.', emoji: '🚗' },
        question: {
          en: 'Where do we drive to?',
          id: 'Kami mengemudi ke mana?',
          options: [
            { emoji: '🏞️', text: 'Park', ok: true },
            { emoji: '🏫', text: 'School', ok: false },
            { emoji: '🏖️', text: 'Beach', ok: false },
            { emoji: '🏠', text: 'Home', ok: false },
          ],
        },
      },
      {
        en: 'Bus',
        id: 'Bus',
        emoji: '🚌',
        example: { en: 'I ride the bus to school.', id: 'Aku naik bus ke sekolah.', emoji: '🚌' },
        question: {
          en: 'Where does she ride the bus to?',
          id: 'Dia naik bus ke mana?',
          options: [
            { emoji: '🏫', text: 'School', ok: true },
            { emoji: '🏠', text: 'Home', ok: false },
            { emoji: '🏞️', text: 'Park', ok: false },
            { emoji: '🦁', text: 'Zoo', ok: false },
          ],
        },
      },
      {
        en: 'Bike',
        id: 'Sepeda',
        emoji: '🚲',
        example: { en: 'I ride my bike in the park.', id: 'Aku bersepeda di taman.', emoji: '🚲' },
        question: {
          en: 'Where does she ride her bike?',
          id: 'Dia bersepeda di mana?',
          options: [
            { emoji: '🏞️', text: 'Park', ok: true },
            { emoji: '🏫', text: 'School', ok: false },
            { emoji: '🏖️', text: 'Beach', ok: false },
            { emoji: '🏪', text: 'Store', ok: false },
          ],
        },
      },
      {
        en: 'Train',
        id: 'Kereta',
        emoji: '🚂',
        example: { en: 'We travel by train to the city.', id: 'Kami naik kereta ke kota.', emoji: '🚂' },
        question: {
          en: 'Where do we travel to?',
          id: 'Kami bepergian ke mana?',
          options: [
            { emoji: '🏙️', text: 'City', ok: true },
            { emoji: '🏡', text: 'Village', ok: false },
            { emoji: '🏖️', text: 'Beach', ok: false },
            { emoji: '⛰️', text: 'Mountain', ok: false },
          ],
        },
      },
      {
        en: 'Plane',
        id: 'Pesawat',
        emoji: '✈️',
        example: { en: 'We fly in a plane to visit grandma.', id: 'Kami naik pesawat untuk mengunjungi nenek.', emoji: '🛫' },
        question: {
          en: 'Who do we visit by plane?',
          id: 'Kami mengunjungi siapa naik pesawat?',
          options: [
            { emoji: '👵', text: 'Grandma', ok: true },
            { emoji: '👴', text: 'Grandpa', ok: false },
            { emoji: '👩‍🦰', text: 'Aunt', ok: false },
            { emoji: '🧔', text: 'Uncle', ok: false },
          ],
        },
      },
      {
        en: 'Boat',
        id: 'Perahu',
        emoji: '⛵',
        example: { en: 'We sail on a boat in the sea.', id: 'Kami berlayar naik perahu di laut.', emoji: '⛵' },
        question: {
          en: 'Where do we sail?',
          id: 'Kami berlayar di mana?',
          options: [
            { emoji: '🌊', text: 'Sea', ok: true },
            { emoji: '🏞️', text: 'River', ok: false },
            { emoji: '🏊', text: 'Pool', ok: false },
            { emoji: '💧', text: 'Lake', ok: false },
          ],
        },
      },
      {
        en: 'Motorcycle',
        id: 'Motor',
        emoji: '🏍️',
        example: { en: 'Dad rides a motorcycle to work.', id: 'Ayah naik motor ke kantor.', emoji: '🏍️' },
        question: {
          en: 'Who rides a motorcycle?',
          id: 'Siapa yang naik motor?',
          options: [
            { emoji: '👨', text: 'Dad', ok: true },
            { emoji: '👩', text: 'Mom', ok: false },
            { emoji: '👧', text: 'Sister', ok: false },
            { emoji: '👴', text: 'Grandpa', ok: false },
          ],
        },
      },
      {
        en: 'Taxi',
        id: 'Taksi',
        emoji: '🚕',
        example: { en: 'We take a taxi to the airport.', id: 'Kami naik taksi ke bandara.', emoji: '🚕' },
        question: {
          en: 'Where do we take a taxi to?',
          id: 'Kami naik taksi ke mana?',
          options: [
            { emoji: '🛫', text: 'Airport', ok: true },
            { emoji: '🚉', text: 'Station', ok: false },
            { emoji: '🏬', text: 'Mall', ok: false },
            { emoji: '🏫', text: 'School', ok: false },
          ],
        },
      },
      {
        en: 'Truck',
        id: 'Truk',
        emoji: '🚚',
        example: { en: 'The truck carries big boxes.', id: 'Truk itu membawa kotak-kotak besar.', emoji: '🚚' },
        question: {
          en: 'What does the truck carry?',
          id: 'Truk itu membawa apa?',
          options: [
            { emoji: '📦', text: 'Boxes', ok: true },
            { emoji: '🐄', text: 'Animals', ok: false },
            { emoji: '🧑', text: 'People', ok: false },
            { emoji: '🍎', text: 'Food', ok: false },
          ],
        },
      },
      {
        en: 'Helicopter',
        id: 'Helikopter',
        emoji: '🚁',
        example: { en: 'The helicopter flies over the city.', id: 'Helikopter itu terbang di atas kota.', emoji: '🚁' },
        question: {
          en: 'Where does the helicopter fly?',
          id: 'Helikopter itu terbang di mana?',
          options: [
            { emoji: '🏙️', text: 'The City', ok: true },
            { emoji: '🌊', text: 'The Sea', ok: false },
            { emoji: '⛰️', text: 'The Mountain', ok: false },
            { emoji: '🌲', text: 'The Forest', ok: false },
          ],
        },
      },
    ],
  },
  {
    id: 'senang-sedih',
    title: 'Senang atau Sedih? (Happy or Sad?)',
    desc: '10 kalimat',
    items: [
      {
        en: 'Happy',
        id: 'Bahagia',
        emoji: '😊',
        example: { en: 'I feel happy on my birthday.', id: 'Aku merasa bahagia saat ulang tahunku.', emoji: '😊' },
        question: {
          en: 'How does she feel on her birthday?',
          id: 'Bagaimana perasaannya saat ulang tahun?',
          options: [
            { emoji: '😊', text: 'Happy', ok: true },
            { emoji: '😢', text: 'Sad', ok: false },
            { emoji: '😠', text: 'Angry', ok: false },
            { emoji: '😴', text: 'Tired', ok: false },
          ],
        },
      },
      {
        en: 'Sad',
        id: 'Sedih',
        emoji: '😢',
        example: { en: 'I feel sad when I lose my toy.', id: 'Aku merasa sedih saat kehilangan mainanku.', emoji: '😢' },
        question: {
          en: 'How does she feel when she loses her toy?',
          id: 'Bagaimana perasaannya saat kehilangan mainan?',
          options: [
            { emoji: '😢', text: 'Sad', ok: true },
            { emoji: '😊', text: 'Happy', ok: false },
            { emoji: '🤩', text: 'Excited', ok: false },
            { emoji: '😤', text: 'Proud', ok: false },
          ],
        },
      },
      {
        en: 'Angry',
        id: 'Marah',
        emoji: '😠',
        example: { en: 'I feel angry when I lose a game.', id: 'Aku merasa marah saat kalah bermain.', emoji: '😠' },
        question: {
          en: 'How does she feel when she loses a game?',
          id: 'Bagaimana perasaannya saat kalah bermain?',
          options: [
            { emoji: '😠', text: 'Angry', ok: true },
            { emoji: '😊', text: 'Happy', ok: false },
            { emoji: '🤩', text: 'Excited', ok: false },
            { emoji: '😳', text: 'Shy', ok: false },
          ],
        },
      },
      {
        en: 'Scared',
        id: 'Takut',
        emoji: '😱',
        example: { en: 'I feel scared in the dark.', id: 'Aku merasa takut dalam gelap.', emoji: '😱' },
        question: {
          en: 'How does she feel in the dark?',
          id: 'Bagaimana perasaannya dalam gelap?',
          options: [
            { emoji: '😱', text: 'Scared', ok: true },
            { emoji: '🤩', text: 'Excited', ok: false },
            { emoji: '😑', text: 'Bored', ok: false },
            { emoji: '😤', text: 'Proud', ok: false },
          ],
        },
      },
      {
        en: 'Excited',
        id: 'Bersemangat',
        emoji: '🤩',
        example: { en: 'I feel excited to go to the zoo.', id: 'Aku merasa bersemangat pergi ke kebun binatang.', emoji: '🤩' },
        question: {
          en: 'How does she feel about the zoo?',
          id: 'Bagaimana perasaannya tentang kebun binatang?',
          options: [
            { emoji: '🤩', text: 'Excited', ok: true },
            { emoji: '😑', text: 'Bored', ok: false },
            { emoji: '😢', text: 'Sad', ok: false },
            { emoji: '😠', text: 'Angry', ok: false },
          ],
        },
      },
      {
        en: 'Tired',
        id: 'Lelah',
        emoji: '😴',
        example: { en: 'I feel tired after playing all day.', id: 'Aku merasa lelah setelah bermain seharian.', emoji: '😴' },
        question: {
          en: 'How does she feel after playing?',
          id: 'Bagaimana perasaannya setelah bermain?',
          options: [
            { emoji: '😴', text: 'Tired', ok: true },
            { emoji: '🤩', text: 'Excited', ok: false },
            { emoji: '😠', text: 'Angry', ok: false },
            { emoji: '😲', text: 'Surprised', ok: false },
          ],
        },
      },
      {
        en: 'Surprised',
        id: 'Terkejut',
        emoji: '😲',
        example: { en: 'I feel surprised by the gift.', id: 'Aku merasa terkejut oleh hadiahnya.', emoji: '😲' },
        question: {
          en: 'How does she feel about the gift?',
          id: 'Bagaimana perasaannya tentang hadiahnya?',
          options: [
            { emoji: '😲', text: 'Surprised', ok: true },
            { emoji: '😑', text: 'Bored', ok: false },
            { emoji: '😢', text: 'Sad', ok: false },
            { emoji: '😳', text: 'Shy', ok: false },
          ],
        },
      },
      {
        en: 'Shy',
        id: 'Malu',
        emoji: '😳',
        example: { en: 'I feel shy in front of new people.', id: 'Aku merasa malu di depan orang baru.', emoji: '😳' },
        question: {
          en: 'How does she feel in front of new people?',
          id: 'Bagaimana perasaannya di depan orang baru?',
          options: [
            { emoji: '😳', text: 'Shy', ok: true },
            { emoji: '😤', text: 'Proud', ok: false },
            { emoji: '😠', text: 'Angry', ok: false },
            { emoji: '😴', text: 'Tired', ok: false },
          ],
        },
      },
      {
        en: 'Proud',
        id: 'Bangga',
        emoji: '😤',
        example: { en: 'I feel proud of my drawing.', id: 'Aku merasa bangga dengan gambarku.', emoji: '😤' },
        question: {
          en: 'What is she proud of?',
          id: 'Dia bangga akan apa?',
          options: [
            { emoji: '🎨', text: 'Her Drawing', ok: true },
            { emoji: '🧸', text: 'Her Toy', ok: false },
            { emoji: '👟', text: 'Her Shoes', ok: false },
            { emoji: '📖', text: 'Her Book', ok: false },
          ],
        },
      },
      {
        en: 'Bored',
        id: 'Bosan',
        emoji: '😑',
        example: { en: 'I feel bored on a rainy day.', id: 'Aku merasa bosan di hari hujan.', emoji: '😑' },
        question: {
          en: 'How does she feel on a rainy day?',
          id: 'Bagaimana perasaannya di hari hujan?',
          options: [
            { emoji: '😑', text: 'Bored', ok: true },
            { emoji: '🤩', text: 'Excited', ok: false },
            { emoji: '😊', text: 'Happy', ok: false },
            { emoji: '😤', text: 'Proud', ok: false },
          ],
        },
      },
    ],
  },
];

export const SPEAKING_TOPICS_ADVENTURER: SpeakingTopic[] = [
  {
    id: 'membuat-janji',
    title: 'Membuat Janji (Making Plans)',
    desc: '2 latihan bicara',
    model: ['Do you want to play together?', 'What time should we meet?'],
    drill: ['Let’s meet at the park.', 'I will see you tomorrow.'],
    roleplay: ['What are you doing this weekend?', 'Do you want to come to my house?', 'What time works for you?'],
  },
];

export const GRAMMAR_TOPICS_ADVENTURER: GrammarTopic[] = [
  {
    id: 'simple-past',
    title: 'Kata Kerja Lampau (Simple Past)',
    desc: 'Cerita kejadian kemarin',
    examples: [
      { en: 'I played football yesterday.', emoji: '⚽' },
      { en: 'She watched a movie.', emoji: '🎬' },
      { en: 'We visited grandma.', emoji: '👵' },
    ],
    scramble: [
      { emoji: '⚽', target: ['I', 'played', 'football', 'yesterday'] },
      { emoji: '🎬', target: ['She', 'watched', 'a', 'movie'] },
      { emoji: '👵', target: ['We', 'visited', 'grandma'] },
    ],
    fill: {
      before: ['Yesterday,', 'I'],
      after: [],
      options: [{ word: 'played', emoji: '⚽' }, { word: 'walked', emoji: '🚶' }, { word: 'cooked', emoji: '🍳' }],
    },
  },
];

/**
 * Reading — cuma Adventurer dulu (permintaan user: fokus Adventurer),
 * belum ada versi Explorer. Menu Belajar otomatis MENYEMBUNYIKAN skill
 * yang topiknya kosong di level aktif (`app.ts` `visibleSkillKeys`) — jadi
 * Explorer TIDAK menampilkan kartu Reading kosong/rusak, bukan bug.
 * `passage`/`story` SENGAJA TIDAK PERNAH diucapkan TTS di mana pun (lihat
 * games/reading.ts) — beda dari Listening, ini menguji baca sendiri.
 */
export const READING_TOPICS_ADVENTURER: ReadingTopic[] = [
  {
    id: 'kebun-binatang',
    title: 'Di Kebun Binatang (At the Zoo)',
    scene: '🦁',
    desc: '2 bacaan pendek',
    primer: [
      { passage: ['Zoe visits the zoo.', 'She sees a big elephant.'], id: 'Zoe mengunjungi kebun binatang. Dia melihat gajah besar.' },
      { passage: ['The lion is sleeping.', 'It looks very tired.'], id: 'Singanya sedang tidur. Kelihatan sangat lelah.' },
    ],
    // `drill` di bawah SENGAJA menyebut distraktor JUGA di teks (bukan
    // cuma jawaban benar) — pola sama dgn `story` di topik ini (soal
    // "hewan favorit Zoe": lion & elephant disebut juga, bukan cuma
    // panda) dan perbaikan Reading First Placement Test
    // (`placement-test-data.ts`) — supaya anak wajib bedakan lewat
    // konteks yang tepat, tidak bisa ditembak dari 1 kata benda yang
    // kebetulan match gambar (bias "construct-irrelevant variance",
    // dilaporkan user).
    drill: [
      {
        passage: ['Zoe brings an apple for a snack.', 'The giraffe eats leaves from a tree.'],
        question: 'What does the giraffe eat?',
        opts: [{ emoji: '🍃', lbl: 'Leaves', ok: true }, { emoji: '🍎', lbl: 'Apple' }, { emoji: '🐟', lbl: 'Fish' }],
      },
      {
        passage: ['The lion is sleeping under a tree.', 'The monkey jumps from branch to branch.'],
        question: 'What is the monkey doing?',
        opts: [{ emoji: '🐒', lbl: 'Jumping', ok: true }, { emoji: '😴', lbl: 'Sleeping' }, { emoji: '🍽️', lbl: 'Eating' }],
      },
    ],
    story: ['Zoe and her family go to the zoo.', 'They see elephants, lions, and monkeys.', 'Her favorite animal is the panda.'],
    question: {
      text: 'What is Zoe’s favorite animal?',
      opts: [{ emoji: '🐼', lbl: 'Panda', ok: true }, { emoji: '🦁', lbl: 'Lion' }, { emoji: '🐘', lbl: 'Elephant' }],
    },
  },
  {
    id: 'hari-libur',
    title: 'Hari Libur (Holiday)',
    scene: '🏖️',
    desc: '2 bacaan pendek',
    primer: [
      { passage: ['Rio goes on holiday.', 'He travels to the beach.'], id: 'Rio pergi berlibur. Dia pergi ke pantai.' },
      { passage: ['The weather is sunny.', 'Everyone is happy.'], id: 'Cuacanya cerah. Semua orang senang.' },
    ],
    // Sama prinsip anti-tebak dgn topik 'kebun-binatang' di atas —
    // distraktor disebut juga di teks, dilekatkan ke hal/orang LAIN
    // (bukan jawaban yg ditanya) supaya anak wajib bedakan lewat konteks.
    drill: [
      {
        passage: ['Rio wears a blue shirt.', 'He builds a sandcastle with a red bucket.'],
        question: 'What color is the bucket?',
        opts: [{ emoji: '🔴', lbl: 'Red', ok: true }, { emoji: '🔵', lbl: 'Blue' }, { emoji: '🟢', lbl: 'Green' }],
      },
      {
        passage: ['Rio takes a shower before lunch.', 'Then he swims in the sea.'],
        question: 'Where does Rio swim?',
        opts: [{ emoji: '🌊', lbl: 'Sea', ok: true }, { emoji: '🏊', lbl: 'Pool' }, { emoji: '🚿', lbl: 'Shower' }],
      },
    ],
    story: ['Rio and his family go to the beach.', 'His sister has strawberry ice cream.', 'Rio has chocolate ice cream.'],
    question: {
      text: 'What flavor ice cream does Rio have?',
      opts: [{ emoji: '🍫', lbl: 'Chocolate', ok: true }, { emoji: '🍓', lbl: 'Strawberry' }, { emoji: '🍋', lbl: 'Lemon' }],
    },
  },
];

/**
 * Konten Little Stars (Early Years, 3–5 th) — level pertama yang keluar dari
 * status "Roadmap masa depan" (PRD §3/§9 lama) ke materi sungguhan, mulai
 * dari Vocabulary (permintaan user, riset bertahap per skill). Dasar
 * pemilihan 12 topik di bawah bukan tebakan — riset web eksplisit thd
 * kurikulum early-years nyata:
 *  - Cambridge YLE Pre-A1 Starters ternyata untuk usia 6-12, BUKAN 3-5 —
 *    mengkonfirmasi Little Stars memang di luar tangga CEFR sepenuhnya
 *    (selaras `cefr:''` di LEVELS), butuh materi sendiri, bukan versi
 *    "starter dari starter".
 *  - Kurikulum PAUD/TK Indonesia: pendekatan tematik, tema inti = anggota
 *    keluarga/warna/hewan/salam, lagu "Head, Shoulders, Knees and Toes"
 *    utk anggota tubuh — persis dipakai sbg dasar topik #5/#6 di bawah.
 *  - Lingokids: kurikulum 60 topik, 5-10 kata/topik, tema preschool-readiness
 *    (2D shapes, hitung 1-10, warna) + tema umum (family/toys/pets/transport).
 *  - Riset ESL preschool umum: tema #1 yang selalu direkomendasikan duluan
 *    justru "greetings & basic politeness" (salam/tolong/terima kasih),
 *    bukan kosakata benda — jadi topik #1 di bawah, bukan Warna/Angka.
 *    Relevan khusus di Little Stars krn level ini BELUM punya skill Speaking
 *    (PRD §4.1) — frasa fungsional (Hello/Please/Thank You dst) jadi
 *    tanggung jawab Vocabulary di sini, beda dari level lain yang bisa
 *    menaruhnya di Speaking.
 *  - Endless Alphabet (kompetitor, PRD §2) memvalidasi mekanik Eja Kata yang
 *    SUDAH ada di `games/vocabulary.ts` (`runEjaKata`) — anak ≤5 tahun di
 *    app itu juga menyusun kata lewat drag huruf, bukan mengetik/membaca
 *    penuh. Jadi mekanik yang sama TIDAK perlu dibikin versi lebih mudah
 *    khusus Little Stars (selaras CLAUDE.md: satu loop seragam lintas
 *    level) — cukup pilih kata pendek & TETAP sediakan reveal-jawaban
 *    setelah 2x salah yang sudah ada di `runEjaKata`/`drawSusun`.
 *
 * PENTING — id topik SENGAJA beda dari Explorer/Adventurer meski konsepnya
 * mirip (mis. 'keluargaku' bukan 'keluarga', 'tubuhku' bukan
 * 'anggota-tubuh', 'hewan-peliharaan' bukan 'binatang', 'perasaanku' bukan
 * 'perasaan', 'angka-pertama' bukan 'angka', 'kenal-warna' bukan 'warna').
 * Progress tersimpan pakai key `${skill}:${topicId}:${section}`
 * (progress.ts `sectionKey`/`tag`) — TIDAK diberi awalan level — jadi kalau
 * id topik SAMA PERSIS dipakai di dua level, progres salah satu level bisa
 * ketimpa/ketuker punya level lain. Jangan pernah kasih topik Vocabulary
 * baru id yang sudah dipakai topik Vocabulary level LAIN, di level manapun.
 */
export const VOCAB_TOPICS_LITTLE_STARS: VocabTopic[] = [
  {
    id: 'salam-sopan-santun',
    title: 'Salam & Sopan Santun (Greetings & Manners)',
    desc: '10 kata',
    // Frasa/speech-act, bukan benda konkret — emoji-nya (🥺🙏😔🙅🙋 dst) cuma
    // proxy ekspresi/gestur yang bisa multi tafsir (mis. 😔 "Sorry" terbaca
    // "sedih"), lihat catatan `iconAmbiguous` di types.ts.
    iconAmbiguous: true,
    items: [
      { en: 'Hello', id: 'Halo', emoji: '👋', example: { en: 'Hello, friend!', id: 'Halo, teman!', emoji: '👋' } },
      { en: 'Goodbye', id: 'Dadah', emoji: '🚶', example: { en: 'Goodbye, mom!', id: 'Dadah, mama!', emoji: '🚶' } },
      { en: 'Please', id: 'Tolong', emoji: '🥺', example: { en: 'Please help me.', id: 'Tolong bantu aku.', emoji: '🥺' } },
      { en: 'Thank You', id: 'Terima Kasih', emoji: '🙏', example: { en: 'Thank you, mom!', id: 'Terima kasih, mama!', emoji: '🙏' } },
      { en: 'Sorry', id: 'Maaf', emoji: '😔', example: { en: 'I am sorry.', id: 'Aku minta maaf.', emoji: '😔' } },
      { en: 'Yes', id: 'Iya', emoji: '✅', example: { en: 'Yes, I can.', id: 'Iya, aku bisa.', emoji: '✅' } },
      { en: 'No', id: 'Tidak', emoji: '🙅', example: { en: 'No, thank you.', id: 'Tidak, terima kasih.', emoji: '🙅' } },
      { en: 'Good Morning', id: 'Selamat Pagi', emoji: '☀️', example: { en: 'Good morning, teacher!', id: 'Selamat pagi, bu guru!', emoji: '☀️' } },
      { en: 'Good Night', id: 'Selamat Malam', emoji: '🌙', example: { en: 'Good night, mom.', id: 'Selamat malam, mama.', emoji: '🌙' } },
      { en: 'Excuse Me', id: 'Permisi', emoji: '🙋', example: { en: 'Excuse me, please.', id: 'Permisi, ya.', emoji: '🙋' } },
    ],
  },
  {
    id: 'kenal-warna',
    title: 'Kenal Warna (Colors)',
    desc: '10 kata',
    items: [
      { en: 'Red', id: 'Merah', emoji: '🔴', example: { en: 'The strawberry is red.', id: 'Stroberinya merah.', emoji: '🍓' } },
      { en: 'Blue', id: 'Biru', emoji: '🔵', example: { en: 'The sky is blue.', id: 'Langitnya biru.', emoji: '🌤️' } },
      { en: 'Yellow', id: 'Kuning', emoji: '🟡', example: { en: 'The star is yellow.', id: 'Bintangnya kuning.', emoji: '⭐' } },
      { en: 'Green', id: 'Hijau', emoji: '🟢', example: { en: 'The leaf is green.', id: 'Daunnya hijau.', emoji: '🍃' } },
      { en: 'Orange', id: 'Oranye', emoji: '🟠', example: { en: 'The carrot is orange.', id: 'Wortelnya oranye.', emoji: '🥕' } },
      { en: 'Purple', id: 'Ungu', emoji: '🟣', example: { en: 'The grape is purple.', id: 'Anggurnya ungu.', emoji: '🍇' } },
      { en: 'Pink', id: 'Merah Muda', emoji: '🩷', example: { en: 'The flower is pink.', id: 'Bunganya merah muda.', emoji: '🌸' } },
      { en: 'Black', id: 'Hitam', emoji: '⚫', example: { en: 'The hat is black.', id: 'Topinya hitam.', emoji: '🎩' } },
      { en: 'White', id: 'Putih', emoji: '⚪', example: { en: 'The milk is white.', id: 'Susunya putih.', emoji: '🥛' } },
      { en: 'Brown', id: 'Cokelat', emoji: '🟤', example: { en: 'The bear is brown.', id: 'Beruangnya cokelat.', emoji: '🐻' } },
    ],
  },
  {
    id: 'angka-pertama',
    title: 'Angka 1–10 (Numbers 1–10)',
    desc: '10 kata',
    items: [
      { en: 'One', id: 'Satu', emoji: '1️⃣', example: { en: 'I have one ball.', id: 'Aku punya satu bola.', emoji: '⚽' } },
      { en: 'Two', id: 'Dua', emoji: '2️⃣', example: { en: 'I see two dogs.', id: 'Aku lihat dua anjing.', emoji: '🐶🐶' } },
      { en: 'Three', id: 'Tiga', emoji: '3️⃣', example: { en: 'I have three apples.', id: 'Aku punya tiga apel.', emoji: '🍎🍎🍎' } },
      { en: 'Four', id: 'Empat', emoji: '4️⃣', example: { en: 'I see four birds.', id: 'Aku lihat empat burung.', emoji: '🐦🐦🐦🐦' } },
      { en: 'Five', id: 'Lima', emoji: '5️⃣', example: { en: 'I have five fingers.', id: 'Aku punya lima jari.', emoji: '✋' } },
      { en: 'Six', id: 'Enam', emoji: '6️⃣', example: { en: 'I see six eggs.', id: 'Aku lihat enam telur.', emoji: '🥚' } },
      { en: 'Seven', id: 'Tujuh', emoji: '7️⃣', example: { en: 'I have seven crayons.', id: 'Aku punya tujuh krayon.', emoji: '🖍️' } },
      { en: 'Eight', id: 'Delapan', emoji: '8️⃣', example: { en: 'I see eight stars.', id: 'Aku lihat delapan bintang.', emoji: '⭐' } },
      { en: 'Nine', id: 'Sembilan', emoji: '9️⃣', example: { en: 'I have nine grapes.', id: 'Aku punya sembilan anggur.', emoji: '🍇' } },
      { en: 'Ten', id: 'Sepuluh', emoji: '🔟', example: { en: 'I see ten toes.', id: 'Aku lihat sepuluh jari kaki.', emoji: '🦶' } },
    ],
  },
  {
    id: 'bentuk',
    title: 'Bentuk (Shapes)',
    desc: '10 kata',
    items: [
      { en: 'Circle', id: 'Lingkaran', emoji: '⚪', example: { en: 'This is a circle.', id: 'Ini lingkaran.', emoji: '⚪' } },
      { en: 'Square', id: 'Persegi', emoji: '⬜', example: { en: 'This is a square.', id: 'Ini persegi.', emoji: '⬜' } },
      { en: 'Triangle', id: 'Segitiga', emoji: '🔺', example: { en: 'This is a triangle.', id: 'Ini segitiga.', emoji: '🔺' } },
      { en: 'Star', id: 'Bintang', emoji: '⭐', example: { en: 'This is a star.', id: 'Ini bintang.', emoji: '⭐' } },
      { en: 'Heart', id: 'Hati', emoji: '❤️', example: { en: 'This is a heart.', id: 'Ini hati.', emoji: '❤️' } },
      { en: 'Diamond', id: 'Berlian', emoji: '🔷', example: { en: 'This is a diamond.', id: 'Ini berlian.', emoji: '🔷' } },
      { en: 'Oval', id: 'Oval', emoji: '🥚', example: { en: 'This is an oval.', id: 'Ini bentuk oval.', emoji: '🥚' } },
      { en: 'Cross', id: 'Silang', emoji: '➕', example: { en: 'This is a cross.', id: 'Ini tanda silang.', emoji: '➕' } },
      { en: 'Arrow', id: 'Panah', emoji: '➡️', example: { en: 'This is an arrow.', id: 'Ini panah.', emoji: '➡️' } },
      { en: 'Moon', id: 'Bulan', emoji: '🌙', example: { en: 'This is the moon.', id: 'Ini bulan.', emoji: '🌙' } },
    ],
  },
  {
    id: 'keluargaku',
    title: 'Keluargaku (My Family)',
    desc: '10 kata',
    items: [
      { en: 'Mom', id: 'Mama', emoji: '👩', example: { en: 'I love my mom.', id: 'Aku sayang mamaku.', emoji: '👩' } },
      { en: 'Dad', id: 'Papa', emoji: '👨', example: { en: 'I love my dad.', id: 'Aku sayang papaku.', emoji: '👨' } },
      { en: 'Baby', id: 'Bayi', emoji: '👶', example: { en: 'The baby is sleeping.', id: 'Bayinya sedang tidur.', emoji: '👶' } },
      { en: 'Sister', id: 'Kakak/Adik Perempuan', emoji: '👧', example: { en: 'I play with my sister.', id: 'Aku main dengan kakak/adik perempuanku.', emoji: '👧' } },
      { en: 'Brother', id: 'Kakak/Adik Laki-laki', emoji: '👦', example: { en: 'I play with my brother.', id: 'Aku main dengan kakak/adik laki-lakiku.', emoji: '👦' } },
      { en: 'Grandma', id: 'Nenek', emoji: '👵', example: { en: 'I hug my grandma.', id: 'Aku memeluk nenekku.', emoji: '👵' } },
      { en: 'Grandpa', id: 'Kakek', emoji: '👴', example: { en: 'I hug my grandpa.', id: 'Aku memeluk kakekku.', emoji: '👴' } },
      { en: 'Aunt', id: 'Bibi', emoji: '👩‍🦱', example: { en: 'This is my aunt.', id: 'Ini bibiku.', emoji: '👩‍🦱' } },
      { en: 'Uncle', id: 'Paman', emoji: '🧔', example: { en: 'This is my uncle.', id: 'Ini pamanku.', emoji: '🧔' } },
      { en: 'Family', id: 'Keluarga', emoji: '👨‍👩‍👧‍👦', example: { en: 'I love my family.', id: 'Aku sayang keluargaku.', emoji: '👨‍👩‍👧‍👦' } },
    ],
  },
  {
    id: 'tubuhku',
    title: 'Anggota Tubuhku (My Body)',
    desc: '10 kata',
    items: [
      { en: 'Head', id: 'Kepala', emoji: '🙂', example: { en: 'Touch your head.', id: 'Sentuh kepalamu.', emoji: '🙂' } },
      { en: 'Shoulders', id: 'Bahu', emoji: '🤷', example: { en: 'Touch your shoulders.', id: 'Sentuh bahumu.', emoji: '🤷' } },
      { en: 'Knees', id: 'Lutut', emoji: '🦵', example: { en: 'Touch your knees.', id: 'Sentuh lututmu.', emoji: '🦵' } },
      { en: 'Toes', id: 'Jari Kaki', emoji: '🦶', example: { en: 'Touch your toes.', id: 'Sentuh jari kakimu.', emoji: '🦶' } },
      { en: 'Eyes', id: 'Mata', emoji: '👀', example: { en: 'I open my eyes.', id: 'Aku membuka mataku.', emoji: '👀' } },
      { en: 'Ears', id: 'Telinga', emoji: '👂', example: { en: 'I clean my ears.', id: 'Aku membersihkan telingaku.', emoji: '👂' } },
      { en: 'Nose', id: 'Hidung', emoji: '👃', example: { en: 'I touch my nose.', id: 'Aku menyentuh hidungku.', emoji: '👃' } },
      { en: 'Mouth', id: 'Mulut', emoji: '👄', example: { en: 'Open your mouth.', id: 'Buka mulutmu.', emoji: '👄' } },
      { en: 'Hands', id: 'Tangan', emoji: '🙌', example: { en: 'I clap my hands.', id: 'Aku bertepuk tangan.', emoji: '🙌' } },
      { en: 'Hair', id: 'Rambut', emoji: '💇', example: { en: 'I brush my hair.', id: 'Aku menyisir rambutku.', emoji: '💇' } },
    ],
  },
  {
    id: 'hewan-peliharaan',
    title: 'Hewan Peliharaan & Ternak (Pets & Farm Animals)',
    desc: '10 kata',
    items: [
      { en: 'Dog', id: 'Anjing', emoji: '🐶', example: { en: 'I have a dog.', id: 'Aku punya anjing.', emoji: '🐶' } },
      { en: 'Cat', id: 'Kucing', emoji: '🐱', example: { en: 'I have a cat.', id: 'Aku punya kucing.', emoji: '🐱' } },
      { en: 'Fish', id: 'Ikan', emoji: '🐟', example: { en: 'The fish can swim.', id: 'Ikan itu bisa berenang.', emoji: '🐟' } },
      { en: 'Bird', id: 'Burung', emoji: '🐦', example: { en: 'The bird can fly.', id: 'Burung itu bisa terbang.', emoji: '🐦' } },
      { en: 'Cow', id: 'Sapi', emoji: '🐄', example: { en: 'The cow says moo.', id: 'Sapinya bilang moo.', emoji: '🐄' } },
      { en: 'Duck', id: 'Bebek', emoji: '🦆', example: { en: 'The duck says quack.', id: 'Bebeknya bilang kwek.', emoji: '🦆' } },
      { en: 'Horse', id: 'Kuda', emoji: '🐴', example: { en: 'The horse can run.', id: 'Kuda itu bisa berlari.', emoji: '🐴' } },
      { en: 'Sheep', id: 'Domba', emoji: '🐑', example: { en: 'The sheep is white.', id: 'Dombanya putih.', emoji: '🐑' } },
      { en: 'Pig', id: 'Babi', emoji: '🐷', example: { en: 'The pig says oink.', id: 'Babinya bilang oink.', emoji: '🐷' } },
      { en: 'Rabbit', id: 'Kelinci', emoji: '🐰', example: { en: 'The rabbit can hop.', id: 'Kelinci itu bisa melompat.', emoji: '🐰' } },
    ],
  },
  {
    id: 'buah-buahan',
    title: 'Buah-buahan (Fruits)',
    desc: '10 kata',
    items: [
      { en: 'Apple', id: 'Apel', emoji: '🍎', example: { en: 'I eat an apple.', id: 'Aku makan apel.', emoji: '🍎' } },
      { en: 'Banana', id: 'Pisang', emoji: '🍌', example: { en: 'I eat a banana.', id: 'Aku makan pisang.', emoji: '🍌' } },
      { en: 'Orange', id: 'Jeruk', emoji: '🍊', example: { en: 'I eat an orange.', id: 'Aku makan jeruk.', emoji: '🍊' } },
      { en: 'Grape', id: 'Anggur', emoji: '🍇', example: { en: 'I eat a grape.', id: 'Aku makan anggur.', emoji: '🍇' } },
      { en: 'Watermelon', id: 'Semangka', emoji: '🍉', example: { en: 'I eat watermelon.', id: 'Aku makan semangka.', emoji: '🍉' } },
      { en: 'Strawberry', id: 'Stroberi', emoji: '🍓', example: { en: 'I eat a strawberry.', id: 'Aku makan stroberi.', emoji: '🍓' } },
      { en: 'Mango', id: 'Mangga', emoji: '🥭', example: { en: 'I eat a mango.', id: 'Aku makan mangga.', emoji: '🥭' } },
      { en: 'Pineapple', id: 'Nanas', emoji: '🍍', example: { en: 'I eat pineapple.', id: 'Aku makan nanas.', emoji: '🍍' } },
      { en: 'Pear', id: 'Pir', emoji: '🍐', example: { en: 'I eat a pear.', id: 'Aku makan pir.', emoji: '🍐' } },
      { en: 'Peach', id: 'Persik', emoji: '🍑', example: { en: 'I eat a peach.', id: 'Aku makan persik.', emoji: '🍑' } },
    ],
  },
  {
    id: 'mainan',
    title: 'Mainan (Toys)',
    desc: '10 kata',
    items: [
      { en: 'Ball', id: 'Bola', emoji: '⚽', example: { en: 'I play with a ball.', id: 'Aku main bola.', emoji: '⚽' } },
      { en: 'Doll', id: 'Boneka', emoji: '🪆', example: { en: 'I play with a doll.', id: 'Aku main boneka.', emoji: '🪆' } },
      { en: 'Kite', id: 'Layangan', emoji: '🪁', example: { en: 'I fly a kite.', id: 'Aku menerbangkan layangan.', emoji: '🪁' } },
      { en: 'Balloon', id: 'Balon', emoji: '🎈', example: { en: 'I hold a balloon.', id: 'Aku memegang balon.', emoji: '🎈' } },
      { en: 'Puzzle', id: 'Puzzle', emoji: '🧩', example: { en: 'I like my puzzle.', id: 'Aku suka puzzle-ku.', emoji: '🧩' } },
      { en: 'Robot', id: 'Robot', emoji: '🤖', example: { en: 'I play with a robot.', id: 'Aku main robot-robotan.', emoji: '🤖' } },
      { en: 'Drum', id: 'Drum', emoji: '🥁', example: { en: 'I play the drum.', id: 'Aku main drum.', emoji: '🥁' } },
      { en: 'Blocks', id: 'Balok', emoji: '🧱', example: { en: 'I build with blocks.', id: 'Aku membangun dengan balok.', emoji: '🧱' } },
      { en: 'Yoyo', id: 'Yoyo', emoji: '🪀', example: { en: 'I play with a yoyo.', id: 'Aku main yoyo.', emoji: '🪀' } },
      { en: 'Teddy', id: 'Boneka Beruang', emoji: '🧸', example: { en: 'I hug my teddy.', id: 'Aku memeluk boneka beruangku.', emoji: '🧸' } },
    ],
  },
  {
    id: 'pakaian',
    title: 'Pakaian (Clothes)',
    desc: '10 kata',
    items: [
      { en: 'Shirt', id: 'Baju', emoji: '👕', example: { en: 'I wear a shirt.', id: 'Aku memakai baju.', emoji: '👕' } },
      { en: 'Pants', id: 'Celana Panjang', emoji: '👖', example: { en: 'I wear pants.', id: 'Aku memakai celana panjang.', emoji: '👖' } },
      { en: 'Shoes', id: 'Sepatu', emoji: '👟', example: { en: 'I wear shoes.', id: 'Aku memakai sepatu.', emoji: '👟' } },
      { en: 'Socks', id: 'Kaos Kaki', emoji: '🧦', example: { en: 'I wear socks.', id: 'Aku memakai kaos kaki.', emoji: '🧦' } },
      { en: 'Hat', id: 'Topi', emoji: '🧢', example: { en: 'I wear a hat.', id: 'Aku memakai topi.', emoji: '🧢' } },
      { en: 'Dress', id: 'Gaun', emoji: '👗', example: { en: 'I wear a dress.', id: 'Aku memakai gaun.', emoji: '👗' } },
      { en: 'Jacket', id: 'Jaket', emoji: '🧥', example: { en: 'I wear a jacket.', id: 'Aku memakai jaket.', emoji: '🧥' } },
      { en: 'Shorts', id: 'Celana Pendek', emoji: '🩳', example: { en: 'I wear shorts.', id: 'Aku memakai celana pendek.', emoji: '🩳' } },
      { en: 'Gloves', id: 'Sarung Tangan', emoji: '🧤', example: { en: 'I wear gloves.', id: 'Aku memakai sarung tangan.', emoji: '🧤' } },
      { en: 'Scarf', id: 'Syal', emoji: '🧣', example: { en: 'I wear a scarf.', id: 'Aku memakai syal.', emoji: '🧣' } },
    ],
  },
  {
    id: 'kendaraan',
    title: 'Kendaraan (Vehicles)',
    desc: '10 kata',
    items: [
      { en: 'Car', id: 'Mobil', emoji: '🚗', example: { en: 'I see a car.', id: 'Aku lihat mobil.', emoji: '🚗' } },
      { en: 'Bus', id: 'Bus', emoji: '🚌', example: { en: 'I see a bus.', id: 'Aku lihat bus.', emoji: '🚌' } },
      { en: 'Bike', id: 'Sepeda', emoji: '🚲', example: { en: 'I ride my bike.', id: 'Aku naik sepedaku.', emoji: '🚲' } },
      { en: 'Train', id: 'Kereta', emoji: '🚆', example: { en: 'I see a train.', id: 'Aku lihat kereta.', emoji: '🚆' } },
      { en: 'Airplane', id: 'Pesawat', emoji: '✈️', example: { en: 'I see an airplane.', id: 'Aku lihat pesawat.', emoji: '✈️' } },
      { en: 'Boat', id: 'Perahu', emoji: '⛵', example: { en: 'I see a boat.', id: 'Aku lihat perahu.', emoji: '⛵' } },
      { en: 'Truck', id: 'Truk', emoji: '🚚', example: { en: 'I see a truck.', id: 'Aku lihat truk.', emoji: '🚚' } },
      { en: 'Fire Truck', id: 'Truk Pemadam', emoji: '🚒', example: { en: 'The fire truck is red.', id: 'Truk pemadamnya merah.', emoji: '🚒' } },
      { en: 'Ambulance', id: 'Ambulans', emoji: '🚑', example: { en: 'The ambulance is fast.', id: 'Ambulansnya cepat.', emoji: '🚑' } },
      { en: 'Helicopter', id: 'Helikopter', emoji: '🚁', example: { en: 'I see a helicopter.', id: 'Aku lihat helikopter.', emoji: '🚁' } },
    ],
  },
  {
    id: 'perasaanku',
    title: 'Perasaanku (My Feelings)',
    desc: '10 kata',
    items: [
      { en: 'Happy', id: 'Senang', emoji: '😊', example: { en: 'I am happy.', id: 'Aku senang.', emoji: '😊' } },
      { en: 'Sad', id: 'Sedih', emoji: '😢', example: { en: 'I am sad.', id: 'Aku sedih.', emoji: '😢' } },
      { en: 'Angry', id: 'Marah', emoji: '😠', example: { en: 'I am angry.', id: 'Aku marah.', emoji: '😠' } },
      { en: 'Scared', id: 'Takut', emoji: '😨', example: { en: 'I am scared.', id: 'Aku takut.', emoji: '😨' } },
      { en: 'Sleepy', id: 'Mengantuk', emoji: '😴', example: { en: 'I am sleepy.', id: 'Aku mengantuk.', emoji: '😴' } },
      { en: 'Hungry', id: 'Lapar', emoji: '😋', example: { en: 'I am hungry.', id: 'Aku lapar.', emoji: '😋' } },
      { en: 'Thirsty', id: 'Haus', emoji: '🥤', example: { en: 'I am thirsty.', id: 'Aku haus.', emoji: '🥤' } },
      { en: 'Sick', id: 'Sakit', emoji: '🤒', example: { en: 'I am sick.', id: 'Aku sakit.', emoji: '🤒' } },
      { en: 'Silly', id: 'Konyol', emoji: '🤪', example: { en: 'I am silly.', id: 'Aku konyol.', emoji: '🤪' } },
      { en: 'Excited', id: 'Bersemangat', emoji: '🤩', example: { en: 'I am excited.', id: 'Aku bersemangat.', emoji: '🤩' } },
    ],
  },
];

/**
 * Konten Starter (≈Pre-A1, 5–7 th) — level KEDUA yang keluar dari status
 * placeholder, dan SATU-SATUNYA dari 3 level "In scope (v1)" (PRD §9:
 * Starter/Explorer/Adventurer) yang belum pernah diauthoring sebelum ini.
 * Beda dari Little Stars (materi/vocab.md — pure exposure/play, di luar
 * tangga CEFR sama sekali), Starter posisinya PERSIS "pra-Starters": pas di
 * depan gerbang ujian resmi Cambridge Pre A1 Starters (usia 6–12) — jadi 10
 * topik di bawah SENGAJA dipetakan dari wordlist RESMI Cambridge (20
 * kategori: Animals, Body, Clothes, Colours, Family & Friends, Food & Drink,
 * Health, Home, Materials, Numbers, Places & Directions, School/Work,
 * Sports & Leisure, Time, Toys/Transport, Weather/World Around Us — riset
 * lengkap & sumber: materi/vocab.md §3B), bukan tebakan tema kayak Little
 * Stars. Kategori yang SUDAH kepakai berat di level lain (Colours, Toys,
 * Transport, Sports, Body — lihat id yang sudah ada di bawah) SENGAJA
 * dilewati/diberi angle beda supaya genuinely progresif, bukan pengulangan
 * kata yang sama persis di level berbeda:
 *  - Numbers → lanjutan 11–20 (bukan ulang 1–10 yang sudah Little
 *    Stars/Explorer), tetap kebaca `isNumberTopic()` otomatis (semua kata
 *    ada di `NUMBER_WORDS` sampai 'twenty').
 *  - Animals → sudut serangga/makhluk kecil (Cambridge tetap 1 kategori
 *    "Animals", tapi belum ada level yang authoring sudut ini — Little Stars
 *    pets/farm, Adventurer wild/zoo).
 *  - Home/School → sudut barang/orang yang beda dari nama ruangan
 *    (Adventurer `rumah`) & alat tulis (Adventurer `alat-sekolah`).
 *  - Places & Directions dan Time (hari dalam seminggu) BENAR-BENAR baru,
 *    belum pernah disentuh level manapun.
 * Kalimat contoh sedikit lebih kaya dari Little Stars (bukan cuma "I am X"),
 * konsisten kompleksitas Explorer yang sudah ada — sesuai anak 5–7 th mulai
 * mengenal struktur kalimat lewat modul Grammar (PRD §4.2: Pronouns/To
 * Be/Possessives dimulai di Starter).
 *
 * Id topik tetap WAJIB unik lintas SEMUA level Vocabulary (lihat komentar di
 * atas `VOCAB_TOPICS_LITTLE_STARS` soal progress key `${skill}:${topicId}:
 * ${section}` yang TIDAK di-namespace per level) — dicek lagi di sini
 * terhadap id yang sudah dipakai Little Stars/Explorer/Adventurer.
 */
export const VOCAB_TOPICS_STARTER: VocabTopic[] = [
  {
    id: 'angka-11-20',
    title: 'Angka 11–20 (Numbers 11–20)',
    desc: '10 kata',
    items: [
      { en: 'Eleven', id: 'Sebelas', emoji: '1️⃣1️⃣', example: { en: 'I have eleven stickers.', id: 'Aku punya sebelas stiker.', emoji: '🏷️' } },
      { en: 'Twelve', id: 'Dua Belas', emoji: '1️⃣2️⃣', example: { en: 'I see twelve apples.', id: 'Aku lihat dua belas apel.', emoji: '🍎' } },
      { en: 'Thirteen', id: 'Tiga Belas', emoji: '1️⃣3️⃣', example: { en: 'I have thirteen balloons.', id: 'Aku punya tiga belas balon.', emoji: '🎈' } },
      { en: 'Fourteen', id: 'Empat Belas', emoji: '1️⃣4️⃣', example: { en: 'I see fourteen birds.', id: 'Aku lihat empat belas burung.', emoji: '🐦' } },
      { en: 'Fifteen', id: 'Lima Belas', emoji: '1️⃣5️⃣', example: { en: 'I have fifteen candies.', id: 'Aku punya lima belas permen.', emoji: '🍬' } },
      { en: 'Sixteen', id: 'Enam Belas', emoji: '1️⃣6️⃣', example: { en: 'I see sixteen ants.', id: 'Aku lihat enam belas semut.', emoji: '🐜' } },
      { en: 'Seventeen', id: 'Tujuh Belas', emoji: '1️⃣7️⃣', example: { en: 'I have seventeen coins.', id: 'Aku punya tujuh belas koin.', emoji: '🪙' } },
      { en: 'Eighteen', id: 'Delapan Belas', emoji: '1️⃣8️⃣', example: { en: 'I see eighteen flowers.', id: 'Aku lihat delapan belas bunga.', emoji: '🌸' } },
      { en: 'Nineteen', id: 'Sembilan Belas', emoji: '1️⃣9️⃣', example: { en: 'I have nineteen crackers.', id: 'Aku punya sembilan belas biskuit.', emoji: '🍪' } },
      { en: 'Twenty', id: 'Dua Puluh', emoji: '2️⃣0️⃣', example: { en: 'I see twenty fish.', id: 'Aku lihat dua puluh ikan.', emoji: '🐟' } },
    ],
  },
  {
    id: 'hari-dalam-seminggu',
    title: 'Hari dalam Seminggu (Days of the Week)',
    desc: '10 kata',
    items: [
      { en: 'Monday', id: 'Senin', emoji: '🏫', example: { en: 'School starts on Monday.', id: 'Sekolah dimulai hari Senin.', emoji: '🏫' } },
      { en: 'Tuesday', id: 'Selasa', emoji: '🎨', example: { en: 'We paint on Tuesday.', id: 'Kami melukis hari Selasa.', emoji: '🎨' } },
      { en: 'Wednesday', id: 'Rabu', emoji: '🎵', example: { en: 'We sing on Wednesday.', id: 'Kami bernyanyi hari Rabu.', emoji: '🎵' } },
      { en: 'Thursday', id: 'Kamis', emoji: '⚽', example: { en: 'We play sports on Thursday.', id: 'Kami berolahraga hari Kamis.', emoji: '⚽' } },
      { en: 'Friday', id: 'Jumat', emoji: '🎈', example: { en: 'Friday is fun.', id: 'Hari Jumat itu seru.', emoji: '🎈' } },
      { en: 'Saturday', id: 'Sabtu', emoji: '🎉', example: { en: 'Saturday is a holiday.', id: 'Hari Sabtu itu libur.', emoji: '🎉' } },
      { en: 'Sunday', id: 'Minggu', emoji: '🌳', example: { en: 'We go to the park on Sunday.', id: 'Kami pergi ke taman hari Minggu.', emoji: '🌳' } },
      { en: 'Today', id: 'Hari Ini', emoji: '👉', example: { en: 'What day is today?', id: 'Hari ini hari apa?', emoji: '👉' } },
      { en: 'Tomorrow', id: 'Besok', emoji: '🌅', example: { en: 'See you tomorrow.', id: 'Sampai jumpa besok.', emoji: '🌅' } },
      { en: 'Yesterday', id: 'Kemarin', emoji: '🌇', example: { en: 'I played yesterday.', id: 'Aku bermain kemarin.', emoji: '🌇' } },
    ],
  },
  {
    id: 'tempat-di-sekitar',
    title: 'Tempat di Sekitar Kita (Places Around Us)',
    desc: '10 kata',
    items: [
      { en: 'Park', id: 'Taman', emoji: '🏞️', example: { en: 'We play at the park.', id: 'Kami bermain di taman.', emoji: '🏞️' } },
      { en: 'Zoo', id: 'Kebun Binatang', emoji: '🦓', example: { en: 'We visit the zoo.', id: 'Kami mengunjungi kebun binatang.', emoji: '🦓' } },
      { en: 'Beach', id: 'Pantai', emoji: '🏖️', example: { en: 'We swim at the beach.', id: 'Kami berenang di pantai.', emoji: '🏖️' } },
      { en: 'Market', id: 'Pasar', emoji: '🛒', example: { en: 'Mom shops at the market.', id: 'Ibu belanja di pasar.', emoji: '🛒' } },
      { en: 'Hospital', id: 'Rumah Sakit', emoji: '🏥', example: { en: 'The doctor works at the hospital.', id: 'Dokter bekerja di rumah sakit.', emoji: '🏥' } },
      { en: 'Farm', id: 'Ladang', emoji: '🚜', example: { en: 'The farmer works on the farm.', id: 'Petani bekerja di ladang.', emoji: '🚜' } },
      { en: 'Bridge', id: 'Jembatan', emoji: '🌉', example: { en: 'We cross the bridge.', id: 'Kami menyeberangi jembatan.', emoji: '🌉' } },
      { en: 'Playground', id: 'Taman Bermain', emoji: '🛝', example: { en: 'I play at the playground.', id: 'Aku bermain di taman bermain.', emoji: '🛝' } },
      { en: 'Street', id: 'Jalan', emoji: '🛣️', example: { en: 'Cars drive on the street.', id: 'Mobil melaju di jalan.', emoji: '🛣️' } },
      { en: 'Mountain', id: 'Gunung', emoji: '⛰️', example: { en: 'We climb the mountain.', id: 'Kami mendaki gunung.', emoji: '⛰️' } },
    ],
  },
  {
    id: 'serangga',
    title: 'Serangga & Makhluk Kecil (Insects & Small Creatures)',
    desc: '10 kata',
    items: [
      { en: 'Butterfly', id: 'Kupu-kupu', emoji: '🦋', example: { en: 'The butterfly is beautiful.', id: 'Kupu-kupunya cantik.', emoji: '🦋' } },
      { en: 'Bee', id: 'Lebah', emoji: '🐝', example: { en: 'The bee makes honey.', id: 'Lebah membuat madu.', emoji: '🐝' } },
      { en: 'Ant', id: 'Semut', emoji: '🐜', example: { en: 'The ant is small.', id: 'Semutnya kecil.', emoji: '🐜' } },
      { en: 'Ladybug', id: 'Kepik', emoji: '🐞', example: { en: 'I see a ladybug.', id: 'Aku lihat kepik.', emoji: '🐞' } },
      { en: 'Spider', id: 'Laba-laba', emoji: '🕷️', example: { en: 'The spider makes a web.', id: 'Laba-laba membuat sarang.', emoji: '🕷️' } },
      { en: 'Snail', id: 'Siput', emoji: '🐌', example: { en: 'The snail is slow.', id: 'Siputnya lambat.', emoji: '🐌' } },
      { en: 'Frog', id: 'Katak', emoji: '🐸', example: { en: 'The frog can jump.', id: 'Katak bisa melompat.', emoji: '🐸' } },
      { en: 'Turtle', id: 'Kura-kura', emoji: '🐢', example: { en: 'The turtle has a shell.', id: 'Kura-kura punya cangkang.', emoji: '🐢' } },
      { en: 'Crab', id: 'Kepiting', emoji: '🦀', example: { en: 'The crab walks sideways.', id: 'Kepiting berjalan menyamping.', emoji: '🦀' } },
      { en: 'Worm', id: 'Cacing', emoji: '🪱', example: { en: 'The worm lives in soil.', id: 'Cacing hidup di tanah.', emoji: '🪱' } },
    ],
  },
  {
    id: 'makanan-favoritku',
    title: 'Makanan Favoritku (My Favorite Food)',
    desc: '10 kata',
    items: [
      { en: 'Pizza', id: 'Pizza', emoji: '🍕', example: { en: 'I like pizza.', id: 'Aku suka pizza.', emoji: '🍕' } },
      { en: 'Burger', id: 'Burger', emoji: '🍔', example: { en: 'I like a burger.', id: 'Aku suka burger.', emoji: '🍔' } },
      { en: 'Sandwich', id: 'Sandwich', emoji: '🥪', example: { en: 'I eat a sandwich.', id: 'Aku makan sandwich.', emoji: '🥪' } },
      { en: 'Ice Cream', id: 'Es Krim', emoji: '🍦', example: { en: 'I like ice cream.', id: 'Aku suka es krim.', emoji: '🍦' } },
      { en: 'Cake', id: 'Kue', emoji: '🍰', example: { en: 'I eat cake on my birthday.', id: 'Aku makan kue saat ulang tahunku.', emoji: '🍰' } },
      { en: 'Cookie', id: 'Biskuit', emoji: '🍪', example: { en: 'I like a cookie.', id: 'Aku suka biskuit.', emoji: '🍪' } },
      { en: 'Chocolate', id: 'Cokelat', emoji: '🍫', example: { en: 'I love chocolate.', id: 'Aku suka cokelat.', emoji: '🍫' } },
      { en: 'Cheese', id: 'Keju', emoji: '🧀', example: { en: 'I eat cheese.', id: 'Aku makan keju.', emoji: '🧀' } },
      { en: 'Juice', id: 'Jus', emoji: '🧃', example: { en: 'I drink juice.', id: 'Aku minum jus.', emoji: '🧃' } },
      { en: 'Yogurt', id: 'Yogurt', emoji: '🥣', example: { en: 'I eat yogurt.', id: 'Aku makan yogurt.', emoji: '🥣' } },
    ],
  },
  {
    id: 'barang-di-rumah',
    title: 'Barang di Rumah (Things at Home)',
    desc: '10 kata',
    items: [
      { en: 'Table', id: 'Meja', emoji: '🍽️', example: { en: 'We eat at the table.', id: 'Kami makan di meja.', emoji: '🍽️' } },
      { en: 'Bed', id: 'Tempat Tidur', emoji: '🛏️', example: { en: 'I sleep in my bed.', id: 'Aku tidur di tempat tidurku.', emoji: '🛏️' } },
      { en: 'Sofa', id: 'Sofa', emoji: '🛋️', example: { en: 'We sit on the sofa.', id: 'Kami duduk di sofa.', emoji: '🛋️' } },
      { en: 'Lamp', id: 'Lampu', emoji: '💡', example: { en: 'Turn on the lamp.', id: 'Nyalakan lampunya.', emoji: '💡' } },
      { en: 'Television', id: 'Televisi', emoji: '📺', example: { en: 'We watch television.', id: 'Kami menonton televisi.', emoji: '📺' } },
      { en: 'Fridge', id: 'Kulkas', emoji: '🧊', example: { en: 'Milk is in the fridge.', id: 'Susunya ada di kulkas.', emoji: '🧊' } },
      { en: 'Mirror', id: 'Cermin', emoji: '🪞', example: { en: 'I look in the mirror.', id: 'Aku bercermin.', emoji: '🪞' } },
      { en: 'Phone', id: 'Telepon', emoji: '📱', example: { en: 'Mom uses the phone.', id: 'Ibu memakai telepon.', emoji: '📱' } },
      { en: 'Cupboard', id: 'Lemari', emoji: '🗄️', example: { en: 'Plates are in the cupboard.', id: 'Piring ada di lemari.', emoji: '🗄️' } },
      { en: 'Broom', id: 'Sapu', emoji: '🧹', example: { en: 'I sweep the floor with a broom.', id: 'Aku menyapu lantai dengan sapu.', emoji: '🧹' } },
    ],
  },
  {
    id: 'di-sekolah',
    title: 'Di Sekolah (At School)',
    desc: '10 kata',
    items: [
      { en: 'Coach', id: 'Pelatih', emoji: '📣', example: { en: 'The coach helps us play.', id: 'Pelatih membantu kami bermain.', emoji: '📣' } },
      { en: 'Classroom', id: 'Ruang Kelas', emoji: '🏫', example: { en: 'We learn in the classroom.', id: 'Kami belajar di ruang kelas.', emoji: '🏫' } },
      { en: 'Friend', id: 'Teman', emoji: '🧑‍🤝‍🧑', example: { en: 'She is my friend.', id: 'Dia temanku.', emoji: '🧑‍🤝‍🧑' } },
      { en: 'Principal', id: 'Kepala Sekolah', emoji: '🧑‍💼', example: { en: 'The principal is at school.', id: 'Kepala sekolah ada di sekolah.', emoji: '🧑‍💼' } },
      { en: 'Library', id: 'Perpustakaan', emoji: '📚', example: { en: 'I read books in the library.', id: 'Aku membaca buku di perpustakaan.', emoji: '📚' } },
      { en: 'Lunchbox', id: 'Kotak Bekal', emoji: '🍱', example: { en: 'I bring my lunchbox.', id: 'Aku membawa kotak bekalku.', emoji: '🍱' } },
      { en: 'Uniform', id: 'Seragam', emoji: '👕', example: { en: 'I wear my school uniform.', id: 'Aku memakai seragam sekolahku.', emoji: '👕' } },
      { en: 'Bell', id: 'Bel', emoji: '🔔', example: { en: 'The bell rings.', id: 'Belnya berbunyi.', emoji: '🔔' } },
      { en: 'Homework', id: 'PR', emoji: '📓', example: { en: 'I do my homework.', id: 'Aku mengerjakan PR-ku.', emoji: '📓' } },
      { en: 'Recess', id: 'Istirahat', emoji: '🥪', example: { en: 'We eat snacks at recess.', id: 'Kami makan camilan saat istirahat.', emoji: '🥪' } },
    ],
  },
  {
    id: 'orang-di-sekitarku',
    title: 'Orang di Sekitarku (People Around Me)',
    desc: '10 kata',
    items: [
      { en: 'Neighbor', id: 'Tetangga', emoji: '🏘️', example: { en: 'My neighbor is friendly.', id: 'Tetanggaku ramah.', emoji: '🏘️' } },
      { en: 'Classmate', id: 'Teman Sekelas', emoji: '🧑‍🎓', example: { en: 'He is my classmate.', id: 'Dia teman sekelasku.', emoji: '🧑‍🎓' } },
      { en: 'Boy', id: 'Anak Laki-laki', emoji: '👦', example: { en: 'The boy is playing.', id: 'Anak laki-laki itu sedang bermain.', emoji: '👦' } },
      { en: 'Girl', id: 'Anak Perempuan', emoji: '👧', example: { en: 'The girl is singing.', id: 'Anak perempuan itu sedang bernyanyi.', emoji: '👧' } },
      { en: 'Man', id: 'Pria', emoji: '👨', example: { en: 'The man is tall.', id: 'Pria itu tinggi.', emoji: '👨' } },
      { en: 'Woman', id: 'Wanita', emoji: '👩', example: { en: 'The woman is smiling.', id: 'Wanita itu tersenyum.', emoji: '👩' } },
      { en: 'Baby', id: 'Bayi', emoji: '👶', example: { en: 'The baby is cute.', id: 'Bayinya lucu.', emoji: '👶' } },
      { en: 'Driver', id: 'Supir', emoji: '🚕', example: { en: 'The driver drives the car.', id: 'Supir itu mengemudikan mobil.', emoji: '🚕' } },
      { en: 'Best Friend', id: 'Sahabat', emoji: '🤝', example: { en: 'You are my best friend.', id: 'Kamu sahabatku.', emoji: '🤝' } },
      { en: 'Twin', id: 'Anak Kembar', emoji: '👯', example: { en: 'This is my twin.', id: 'Ini kembaranku.', emoji: '👯' } },
    ],
  },
  {
    id: 'alam-sekitar',
    title: 'Alam di Sekitar Kita (Nature Around Us)',
    desc: '10 kata',
    items: [
      { en: 'Sun', id: 'Matahari', emoji: '☀️', example: { en: 'The sun is bright.', id: 'Mataharinya terang.', emoji: '☀️' } },
      { en: 'Moon', id: 'Bulan', emoji: '🌙', example: { en: 'I see the moon at night.', id: 'Aku melihat bulan di malam hari.', emoji: '🌙' } },
      { en: 'Sky', id: 'Langit', emoji: '🌤️', example: { en: 'The sky is blue.', id: 'Langitnya biru.', emoji: '🌤️' } },
      { en: 'Cloud', id: 'Awan', emoji: '☁️', example: { en: 'I see a cloud.', id: 'Aku melihat awan.', emoji: '☁️' } },
      { en: 'Tree', id: 'Pohon', emoji: '🌳', example: { en: 'The tree is tall.', id: 'Pohonnya tinggi.', emoji: '🌳' } },
      { en: 'Flower', id: 'Bunga', emoji: '🌸', example: { en: 'The flower is pretty.', id: 'Bunganya cantik.', emoji: '🌸' } },
      { en: 'Grass', id: 'Rumput', emoji: '🌿', example: { en: 'The grass is green.', id: 'Rumputnya hijau.', emoji: '🌿' } },
      { en: 'River', id: 'Sungai', emoji: '🌊', example: { en: 'We swim in the river.', id: 'Kami berenang di sungai.', emoji: '🌊' } },
      { en: 'Stone', id: 'Batu', emoji: '🪨', example: { en: 'I found a stone.', id: 'Aku menemukan batu.', emoji: '🪨' } },
      { en: 'Star', id: 'Bintang', emoji: '⭐', example: { en: 'I see a star.', id: 'Aku lihat bintang.', emoji: '⭐' } },
    ],
  },
  {
    id: 'hobi',
    title: 'Hobiku (My Hobbies)',
    desc: '10 kata',
    items: [
      { en: 'Drawing', id: 'Menggambar', emoji: '🎨', example: { en: 'I like drawing.', id: 'Aku suka menggambar.', emoji: '🎨' } },
      { en: 'Singing', id: 'Bernyanyi', emoji: '🎤', example: { en: 'I like singing.', id: 'Aku suka bernyanyi.', emoji: '🎤' } },
      { en: 'Reading', id: 'Membaca', emoji: '📖', example: { en: 'I like reading.', id: 'Aku suka membaca.', emoji: '📖' } },
      { en: 'Painting', id: 'Melukis', emoji: '🖌️', example: { en: 'I like painting.', id: 'Aku suka melukis.', emoji: '🖌️' } },
      { en: 'Cooking', id: 'Memasak', emoji: '🍳', example: { en: 'I like cooking.', id: 'Aku suka memasak.', emoji: '🍳' } },
      { en: 'Camping', id: 'Berkemah', emoji: '⛺', example: { en: 'I like camping.', id: 'Aku suka berkemah.', emoji: '⛺' } },
      { en: 'Fishing', id: 'Memancing', emoji: '🎣', example: { en: 'I like fishing.', id: 'Aku suka memancing.', emoji: '🎣' } },
      { en: 'Gardening', id: 'Berkebun', emoji: '🌱', example: { en: 'I like gardening.', id: 'Aku suka berkebun.', emoji: '🌱' } },
      { en: 'Collecting', id: 'Mengoleksi', emoji: '🪙', example: { en: 'I like collecting coins.', id: 'Aku suka mengoleksi koin.', emoji: '🪙' } },
      { en: 'Building', id: 'Membangun', emoji: '🧱', example: { en: 'I like building.', id: 'Aku suka membangun.', emoji: '🧱' } },
    ],
  },
];

/**
 * Konten Achiever (≈A1 → A2, 11–13 th) — level KELIMA yang diauthoring
 * (Little Stars, Starter, Explorer, Adventurer sudah lebih dulu, materi/
 * vocab.md §3A–§3D). Beda dari Adventurer (yang sudah py 10 topik & cuma
 * digenapkan bonus): Achiever mulai dari NOL (`hasContent:false` sebelum
 * sesi ini), sama posisinya dgn Starter — 10 topik di bawah dipetakan dari
 * wordlist Cambridge **A2 Flyers** (tingkat YLE resmi Achiever, PRD §3),
 * KHUSUS dari kategori yang SENGAJA disisakan utuh oleh sesi Adventurer
 * (§3D.2 — Characteristics 49 kata, Places and Directions 47 kata, Leisure
 * 26 kata, Acts sisa >50 kata dari 65) supaya tidak reinvent riset dari nol
 * — riset lengkap: materi/vocab.md §3E. Ditambah 1 domain BARU di luar
 * wordlist Cambridge (Teknologi & Internet) yang muncul eksplisit dari riset
 * ESL usia 11-13 (tema teknologi/gawai mulai relevan usia pra-remaja),
 * TANPA elemen media sosial/percakapan online (selaras filter kid-friendly
 * CLAUDE.md — cuma kosakata perangkat/istilah teknis, bukan promosi
 * penggunaan medsos ke anak).
 */
export const VOCAB_TOPICS_ACHIEVER: VocabTopic[] = [
  {
    id: 'ciri-ciri-fisik',
    title: 'Ciri-ciri Fisik (Physical Appearance)',
    desc: '10 kata',
    items: [
      { en: 'Tall', id: 'Tinggi', emoji: '🦒', example: { en: 'He is tall.', id: 'Dia tinggi.', emoji: '🦒' } },
      { en: 'Beautiful', id: 'Cantik', emoji: '😍', example: { en: 'She is beautiful.', id: 'Dia cantik.', emoji: '😍' } },
      { en: 'Handsome', id: 'Tampan', emoji: '😎', example: { en: 'He is handsome.', id: 'Dia tampan.', emoji: '😎' } },
      { en: 'Young', id: 'Muda', emoji: '👶', example: { en: 'My cousin is young.', id: 'Sepupuku muda.', emoji: '👶' } },
      { en: 'Old', id: 'Tua', emoji: '👴', example: { en: 'My grandfather is old.', id: 'Kakekku tua.', emoji: '👴' } },
      { en: 'Curly Hair', id: 'Rambut Keriting', emoji: '🦱', example: { en: 'She has curly hair.', id: 'Dia punya rambut keriting.', emoji: '🦱' } },
      { en: 'Straight Hair', id: 'Rambut Lurus', emoji: '💇', example: { en: 'He has straight hair.', id: 'Dia punya rambut lurus.', emoji: '💇' } },
      { en: 'Slim', id: 'Langsing', emoji: '🧍', example: { en: 'She is slim.', id: 'Dia langsing.', emoji: '🧍' } },
      { en: 'Strong', id: 'Kuat', emoji: '💪', example: { en: 'He is strong.', id: 'Dia kuat.', emoji: '💪' } },
      { en: 'Cute', id: 'Lucu', emoji: '🥰', example: { en: 'The puppy is cute.', id: 'Anak anjingnya lucu.', emoji: '🐶' } },
    ],
  },
  {
    id: 'tempat-di-kota',
    title: 'Tempat di Kota (Places in Town)',
    desc: '10 kata',
    items: [
      { en: 'Bank', id: 'Bank', emoji: '🏦', example: { en: 'I go to the bank.', id: 'Aku pergi ke bank.', emoji: '🏦' } },
      { en: 'Post Office', id: 'Kantor Pos', emoji: '📮', example: { en: 'I go to the post office.', id: 'Aku pergi ke kantor pos.', emoji: '📮' } },
      { en: 'Police Station', id: 'Kantor Polisi', emoji: '🚓', example: { en: 'The police station is near here.', id: 'Kantor polisinya dekat sini.', emoji: '🚓' } },
      { en: 'Restaurant', id: 'Restoran', emoji: '🍽️', example: { en: 'We eat at the restaurant.', id: 'Kami makan di restoran.', emoji: '🍽️' } },
      { en: 'Cinema', id: 'Bioskop', emoji: '🎬', example: { en: 'We watch a movie at the cinema.', id: 'Kami nonton film di bioskop.', emoji: '🎬' } },
      { en: 'Museum', id: 'Museum', emoji: '🏛️', example: { en: 'We visit the museum.', id: 'Kami mengunjungi museum.', emoji: '🏛️' } },
      { en: 'Stadium', id: 'Stadion', emoji: '🏟️', example: { en: 'We watch the game at the stadium.', id: 'Kami nonton pertandingan di stadion.', emoji: '🏟️' } },
      { en: 'Supermarket', id: 'Supermarket', emoji: '🏬', example: { en: 'Mom shops at the supermarket.', id: 'Ibu belanja di supermarket.', emoji: '🏬' } },
      { en: 'Airport', id: 'Bandara', emoji: '✈️', example: { en: 'We fly from the airport.', id: 'Kami terbang dari bandara.', emoji: '✈️' } },
      { en: 'Bakery', id: 'Toko Roti', emoji: '🥖', example: { en: 'I buy bread at the bakery.', id: 'Aku beli roti di toko roti.', emoji: '🥖' } },
    ],
  },
  {
    id: 'arah-posisi',
    title: 'Arah & Posisi (Directions & Position)',
    desc: '10 kata',
    items: [
      { en: 'Left', id: 'Kiri', emoji: '⬅️', example: { en: 'Turn left.', id: 'Belok kiri.', emoji: '⬅️' } },
      { en: 'Right', id: 'Kanan', emoji: '➡️', example: { en: 'Turn right.', id: 'Belok kanan.', emoji: '➡️' } },
      { en: 'Straight', id: 'Lurus', emoji: '⬆️', example: { en: 'Go straight.', id: 'Jalan terus lurus.', emoji: '⬆️' } },
      { en: 'Near', id: 'Dekat', emoji: '📍', example: { en: 'The park is near.', id: 'Tamannya dekat.', emoji: '📍' } },
      { en: 'Far', id: 'Jauh', emoji: '🛣️', example: { en: 'The zoo is far.', id: 'Kebun binatangnya jauh.', emoji: '🛣️' } },
      { en: 'Turn', id: 'Belok', emoji: '🔄', example: { en: 'Turn at the corner.', id: 'Belok di sudut.', emoji: '🔄' } },
      { en: 'Corner', id: 'Sudut', emoji: '📐', example: { en: 'Wait at the corner.', id: 'Tunggu di sudut.', emoji: '📐' } },
      { en: 'Between', id: 'Di Antara', emoji: '↔️', example: { en: 'I sit between my friends.', id: 'Aku duduk di antara teman-temanku.', emoji: '↔️' } },
      { en: 'In Front Of', id: 'Di Depan', emoji: '👉', example: { en: 'The car is in front of the house.', id: 'Mobilnya ada di depan rumah.', emoji: '👉' } },
      { en: 'Behind', id: 'Di Belakang', emoji: '👈', example: { en: 'The tree is behind the house.', id: 'Pohonnya ada di belakang rumah.', emoji: '👈' } },
    ],
  },
  {
    id: 'hiburan-waktu-luang',
    title: 'Waktu Luang & Hiburan (Leisure & Entertainment)',
    desc: '10 kata',
    items: [
      { en: 'Concert', id: 'Konser', emoji: '🎤', example: { en: 'I go to a concert.', id: 'Aku pergi ke konser.', emoji: '🎤' } },
      { en: 'Theater', id: 'Teater', emoji: '🎭', example: { en: 'We watch a play at the theater.', id: 'Kami menonton pertunjukan di teater.', emoji: '🎭' } },
      { en: 'Amusement Park', id: 'Taman Hiburan', emoji: '🎡', example: { en: 'We ride rides at the amusement park.', id: 'Kami naik wahana di taman hiburan.', emoji: '🎡' } },
      { en: 'Board Game', id: 'Permainan Papan', emoji: '🎲', example: { en: 'I play a board game.', id: 'Aku main permainan papan.', emoji: '🎲' } },
      { en: 'Video Game', id: 'Gim Video', emoji: '🕹️', example: { en: 'I play a video game.', id: 'Aku main gim video.', emoji: '🕹️' } },
      { en: 'Chess', id: 'Catur', emoji: '♟️', example: { en: 'I play chess.', id: 'Aku main catur.', emoji: '♟️' } },
      { en: 'Skateboard', id: 'Papan Seluncur', emoji: '🛹', example: { en: 'I ride my skateboard.', id: 'Aku main papan seluncurku.', emoji: '🛹' } },
      { en: 'Camera', id: 'Kamera', emoji: '📷', example: { en: 'I take photos with a camera.', id: 'Aku memotret dengan kamera.', emoji: '📷' } },
      { en: 'Comic Book', id: 'Buku Komik', emoji: '🦸', example: { en: 'I read a comic book.', id: 'Aku membaca buku komik.', emoji: '🦸' } },
      { en: 'Magazine', id: 'Majalah', emoji: '📰', example: { en: 'I read a magazine.', id: 'Aku membaca majalah.', emoji: '📰' } },
    ],
  },
  {
    id: 'kata-kerja-lanjutan',
    title: 'Kata Kerja Lanjutan (Advanced Actions)',
    desc: '10 kata',
    items: [
      { en: 'Climb', id: 'Memanjat', emoji: '🧗', example: { en: 'I climb the tree.', id: 'Aku memanjat pohon.', emoji: '🧗' } },
      { en: 'Catch', id: 'Menangkap', emoji: '🤲', example: { en: 'I catch the ball.', id: 'Aku menangkap bola.', emoji: '🤲' } },
      { en: 'Throw', id: 'Melempar', emoji: '🤾', example: { en: 'I throw the ball.', id: 'Aku melempar bola.', emoji: '🤾' } },
      { en: 'Hide', id: 'Bersembunyi', emoji: '🙈', example: { en: 'I hide behind the tree.', id: 'Aku bersembunyi di belakang pohon.', emoji: '🙈' } },
      { en: 'Laugh', id: 'Tertawa', emoji: '😂', example: { en: 'I laugh at the joke.', id: 'Aku tertawa mendengar lelucon itu.', emoji: '😂' } },
      { en: 'Cry', id: 'Menangis', emoji: '😭', example: { en: 'I cry when I am sad.', id: 'Aku menangis saat aku sedih.', emoji: '😭' } },
      { en: 'Shout', id: 'Berteriak', emoji: '📢', example: { en: 'I shout for help.', id: 'Aku berteriak minta tolong.', emoji: '📢' } },
      { en: 'Whisper', id: 'Berbisik', emoji: '🤫', example: { en: 'I whisper a secret.', id: 'Aku berbisik rahasia.', emoji: '🤫' } },
      { en: 'Jump', id: 'Melompat', emoji: '🤸', example: { en: 'I jump high.', id: 'Aku melompat tinggi.', emoji: '🤸' } },
      { en: 'Fly', id: 'Terbang', emoji: '🕊️', example: { en: 'Birds fly in the sky.', id: 'Burung-burung terbang di langit.', emoji: '🕊️' } },
    ],
  },
  {
    id: 'teknologi-internet',
    title: 'Teknologi & Internet (Technology & Internet)',
    desc: '10 kata',
    items: [
      { en: 'Computer', id: 'Komputer', emoji: '💻', example: { en: 'I use a computer.', id: 'Aku memakai komputer.', emoji: '💻' } },
      { en: 'Internet', id: 'Internet', emoji: '🌐', example: { en: 'I search on the internet.', id: 'Aku mencari di internet.', emoji: '🌐' } },
      { en: 'Website', id: 'Situs Web', emoji: '🔗', example: { en: 'I visit a website.', id: 'Aku mengunjungi situs web.', emoji: '🔗' } },
      { en: 'Email', id: 'Surel', emoji: '📧', example: { en: 'I send an email.', id: 'Aku mengirim surel.', emoji: '📧' } },
      { en: 'Password', id: 'Kata Sandi', emoji: '🔑', example: { en: 'I type my password.', id: 'Aku mengetik kata sandiku.', emoji: '🔑' } },
      { en: 'Download', id: 'Unduh', emoji: '⬇️', example: { en: 'I download a file.', id: 'Aku mengunduh berkas.', emoji: '⬇️' } },
      { en: 'Upload', id: 'Unggah', emoji: '⬆️', example: { en: 'I upload a photo.', id: 'Aku mengunggah foto.', emoji: '⬆️' } },
      { en: 'Screen', id: 'Layar', emoji: '🖥️', example: { en: 'I look at the screen.', id: 'Aku melihat layar.', emoji: '🖥️' } },
      { en: 'Keyboard', id: 'Papan Ketik', emoji: '⌨️', example: { en: 'I type on the keyboard.', id: 'Aku mengetik di papan ketik.', emoji: '⌨️' } },
      { en: 'Mouse', id: 'Tetikus', emoji: '🖱️', example: { en: 'I click the mouse.', id: 'Aku mengklik tetikus.', emoji: '🖱️' } },
    ],
  },
  {
    id: 'sifat-kepribadian',
    title: 'Sifat Kepribadian (Personality Traits)',
    desc: '10 kata',
    items: [
      { en: 'Kind', id: 'Baik Hati', emoji: '🤗', example: { en: 'She is kind.', id: 'Dia baik hati.', emoji: '🤗' } },
      { en: 'Brave', id: 'Berani', emoji: '🦁', example: { en: 'He is brave.', id: 'Dia berani.', emoji: '🦁' } },
      { en: 'Honest', id: 'Jujur', emoji: '🤝', example: { en: 'I am honest.', id: 'Aku jujur.', emoji: '🤝' } },
      { en: 'Funny', id: 'Lucu', emoji: '😂', example: { en: 'He is funny.', id: 'Dia lucu.', emoji: '😂' } },
      { en: 'Clever', id: 'Pintar', emoji: '🧠', example: { en: 'She is clever.', id: 'Dia pintar.', emoji: '🧠' } },
      { en: 'Friendly', id: 'Ramah', emoji: '😊', example: { en: 'He is friendly.', id: 'Dia ramah.', emoji: '😊' } },
      { en: 'Generous', id: 'Dermawan', emoji: '🎁', example: { en: 'She is generous.', id: 'Dia dermawan.', emoji: '🎁' } },
      { en: 'Patient', id: 'Sabar', emoji: '⏳', example: { en: 'I am patient.', id: 'Aku sabar.', emoji: '⏳' } },
      { en: 'Polite', id: 'Sopan', emoji: '🙏', example: { en: 'He is polite.', id: 'Dia sopan.', emoji: '🙏' } },
      { en: 'Confident', id: 'Percaya Diri', emoji: '💪', example: { en: 'She is confident.', id: 'Dia percaya diri.', emoji: '💪' } },
    ],
  },
  {
    id: 'mata-pelajaran',
    title: 'Mata Pelajaran Sekolah (School Subjects)',
    desc: '10 kata',
    items: [
      { en: 'Math', id: 'Matematika', emoji: '🔢', example: { en: 'I like math.', id: 'Aku suka matematika.', emoji: '🔢' } },
      { en: 'Science', id: 'Sains', emoji: '🔬', example: { en: 'I like science.', id: 'Aku suka sains.', emoji: '🔬' } },
      { en: 'English', id: 'Bahasa Inggris', emoji: '🇬🇧', example: { en: 'I study English.', id: 'Aku belajar Bahasa Inggris.', emoji: '🇬🇧' } },
      { en: 'History', id: 'Sejarah', emoji: '📜', example: { en: 'I like history.', id: 'Aku suka sejarah.', emoji: '📜' } },
      { en: 'Art', id: 'Seni', emoji: '🎨', example: { en: 'I like art.', id: 'Aku suka seni.', emoji: '🎨' } },
      { en: 'Music', id: 'Musik', emoji: '🎵', example: { en: 'I like music.', id: 'Aku suka musik.', emoji: '🎵' } },
      { en: 'Geography', id: 'Geografi', emoji: '🗺️', example: { en: 'I like geography.', id: 'Aku suka geografi.', emoji: '🗺️' } },
      { en: 'Physical Education', id: 'Olahraga (PJOK)', emoji: '⚽', example: { en: 'I like Physical Education.', id: 'Aku suka olahraga (PJOK).', emoji: '⚽' } },
      { en: 'Social Studies', id: 'IPS', emoji: '🌏', example: { en: 'I like Social Studies.', id: 'Aku suka IPS.', emoji: '🌏' } },
      { en: 'Civics', id: 'PPKn', emoji: '⚖️', example: { en: 'I like Civics.', id: 'Aku suka PPKn.', emoji: '⚖️' } },
    ],
  },
  {
    id: 'angka-puluhan',
    title: 'Angka Puluhan ke Atas (Bigger Numbers)',
    desc: '10 kata',
    items: [
      { en: 'Thirty', id: 'Tiga Puluh', emoji: '3️⃣0️⃣', example: { en: 'I have thirty stickers.', id: 'Aku punya tiga puluh stiker.', emoji: '🏷️' } },
      { en: 'Forty', id: 'Empat Puluh', emoji: '4️⃣0️⃣', example: { en: 'I have forty marbles.', id: 'Aku punya empat puluh kelereng.', emoji: '🔵' } },
      { en: 'Fifty', id: 'Lima Puluh', emoji: '5️⃣0️⃣', example: { en: 'I have fifty coins.', id: 'Aku punya lima puluh koin.', emoji: '🪙' } },
      { en: 'Sixty', id: 'Enam Puluh', emoji: '6️⃣0️⃣', example: { en: 'I have sixty candies.', id: 'Aku punya enam puluh permen.', emoji: '🍬' } },
      { en: 'Seventy', id: 'Tujuh Puluh', emoji: '7️⃣0️⃣', example: { en: 'I read seventy pages.', id: 'Aku membaca tujuh puluh halaman.', emoji: '📖' } },
      { en: 'Eighty', id: 'Delapan Puluh', emoji: '8️⃣0️⃣', example: { en: 'I have eighty points.', id: 'Aku punya delapan puluh poin.', emoji: '⭐' } },
      { en: 'Ninety', id: 'Sembilan Puluh', emoji: '9️⃣0️⃣', example: { en: 'I have ninety stamps.', id: 'Aku punya sembilan puluh perangko.', emoji: '📮' } },
      { en: 'Hundred', id: 'Seratus', emoji: '💯', example: { en: 'I have one hundred books.', id: 'Aku punya seratus buku.', emoji: '📚' } },
      { en: 'Thousand', id: 'Seribu', emoji: '🔢', example: { en: 'There are one thousand stars.', id: 'Ada seribu bintang.', emoji: '⭐' } },
      { en: 'Million', id: 'Sejuta', emoji: '🌌', example: { en: 'There are a million stars in the sky.', id: 'Ada sejuta bintang di langit.', emoji: '🌌' } },
    ],
  },
  {
    id: 'sifat-benda-lanjutan',
    title: 'Sifat Benda Lanjutan (Object Qualities)',
    desc: '10 kata',
    items: [
      { en: 'Wet', id: 'Basah', emoji: '💦', example: { en: 'My shirt is wet.', id: 'Bajuku basah.', emoji: '💦' } },
      { en: 'Dry', id: 'Kering', emoji: '☀️', example: { en: 'The towel is dry.', id: 'Handuknya kering.', emoji: '☀️' } },
      { en: 'Soft', id: 'Lembut', emoji: '🧸', example: { en: 'The pillow is soft.', id: 'Bantalnya lembut.', emoji: '🧸' } },
      { en: 'Hard', id: 'Keras', emoji: '🪨', example: { en: 'The rock is hard.', id: 'Batunya keras.', emoji: '🪨' } },
      { en: 'Sharp', id: 'Tajam', emoji: '🔪', example: { en: 'The knife is sharp.', id: 'Pisaunya tajam.', emoji: '🔪' } },
      { en: 'Smooth', id: 'Halus', emoji: '👘', example: { en: 'The silk is smooth.', id: 'Sutranya halus.', emoji: '👘' } },
      { en: 'Rough', id: 'Kasar', emoji: '🌵', example: { en: 'The cactus is rough.', id: 'Kaktusnya kasar.', emoji: '🌵' } },
      { en: 'Loud', id: 'Keras (Suara)', emoji: '📢', example: { en: 'The music is loud.', id: 'Musiknya keras.', emoji: '📢' } },
      { en: 'Quiet', id: 'Tenang', emoji: '🤫', example: { en: 'The library is quiet.', id: 'Perpustakaannya tenang.', emoji: '🤫' } },
      { en: 'Bright', id: 'Terang', emoji: '💡', example: { en: 'The light is bright.', id: 'Cahayanya terang.', emoji: '💡' } },
    ],
  },
];

/**
 * Konten Trailblazer (≈B1, "jalur lanjutan", 12+ th) — level TERAKHIR/keenam
 * yang diauthoring (5 level lain sudah lebih dulu, materi/vocab.md
 * §3A–§3E). SENGAJA CUMA 2 TOPIK, bukan 10 seperti level lain — PRD §9
 * SUDAH mengunci Trailblazer sbg "Next phase (low-effort, 1–2 modul
 * preview)" sejak sebelum inisiatif Vocabulary ini dimulai; itu keputusan
 * scope yang sengaja, BUKAN gap yang perlu ditutup ke ≥10 topik spt level
 * lain (target CLAUDE.md ≥10 topik/skill sengaja TIDAK dipaksakan di sini —
 * dicatat eksplisit sbg pengecualian yang disahkan, bukan kelalaian).
 * 2 topik dipilih dari kategori Cambridge **B1 Preliminary for Schools
 * (PET)** yang genuinely BARU (belum tercakup 5 level di bawahnya) — riset
 * lengkap: materi/vocab.md §3F.
 */
export const VOCAB_TOPICS_TRAILBLAZER: VocabTopic[] = [
  {
    id: 'perjalanan-wisata',
    title: 'Perjalanan & Wisata (Travel & Tourism)',
    desc: '10 kata',
    items: [
      { en: 'Passport', id: 'Paspor', emoji: '🛂', example: { en: 'I show my passport.', id: 'Aku menunjukkan pasporku.', emoji: '🛂' } },
      { en: 'Luggage', id: 'Koper', emoji: '🧳', example: { en: 'I pack my luggage.', id: 'Aku mengemas koperku.', emoji: '🧳' } },
      { en: 'Journey', id: 'Perjalanan', emoji: '🗺️', example: { en: 'We enjoy the journey.', id: 'Kami menikmati perjalanan.', emoji: '🗺️' } },
      { en: 'Destination', id: 'Tujuan', emoji: '📍', example: { en: 'Bali is our destination.', id: 'Bali adalah tujuan kami.', emoji: '📍' } },
      { en: 'Tourist', id: 'Turis', emoji: '📸', example: { en: 'The tourist takes photos.', id: 'Turis itu memotret.', emoji: '📸' } },
      { en: 'Souvenir', id: 'Oleh-oleh', emoji: '🎁', example: { en: 'I buy a souvenir.', id: 'Aku membeli oleh-oleh.', emoji: '🎁' } },
      { en: 'Map', id: 'Peta', emoji: '🧭', example: { en: 'I read the map.', id: 'Aku membaca peta.', emoji: '🧭' } },
      { en: 'Ticket', id: 'Tiket', emoji: '🎫', example: { en: 'I buy a ticket.', id: 'Aku membeli tiket.', emoji: '🎫' } },
      { en: 'Hotel', id: 'Hotel', emoji: '🏨', example: { en: 'We stay at a hotel.', id: 'Kami menginap di hotel.', emoji: '🏨' } },
      { en: 'Sightseeing', id: 'Wisata', emoji: '🏞️', example: { en: 'We go sightseeing.', id: 'Kami pergi berwisata.', emoji: '🏞️' } },
    ],
  },
  {
    id: 'bahasa-komunikasi',
    title: 'Bahasa & Komunikasi (Language & Communication)',
    desc: '10 kata',
    items: [
      { en: 'Translate', id: 'Menerjemahkan', emoji: '🔤', example: { en: 'I translate the sentence.', id: 'Aku menerjemahkan kalimat itu.', emoji: '🔤' } },
      { en: 'Interpreter', id: 'Penerjemah Lisan', emoji: '🗣️', example: { en: 'The interpreter helps us talk.', id: 'Penerjemah lisan itu membantu kami bicara.', emoji: '🗣️' } },
      { en: 'Fluent', id: 'Fasih', emoji: '💬', example: { en: 'She is fluent in English.', id: 'Dia fasih berbahasa Inggris.', emoji: '💬' } },
      { en: 'Accent', id: 'Aksen', emoji: '🎤', example: { en: 'He has an English accent.', id: 'Dia punya aksen Inggris.', emoji: '🎤' } },
      { en: 'Pronunciation', id: 'Pengucapan', emoji: '👄', example: { en: 'I practice pronunciation.', id: 'Aku berlatih pengucapan.', emoji: '👄' } },
      { en: 'Vocabulary', id: 'Kosakata', emoji: '📖', example: { en: 'I learn new vocabulary.', id: 'Aku belajar kosakata baru.', emoji: '📖' } },
      { en: 'Dictionary', id: 'Kamus', emoji: '📕', example: { en: 'I look up the word in a dictionary.', id: 'Aku mencari kata itu di kamus.', emoji: '📕' } },
      { en: 'Bilingual', id: 'Dwibahasa', emoji: '🌍', example: { en: 'She is bilingual.', id: 'Dia dwibahasa.', emoji: '🌍' } },
      { en: 'Grammar', id: 'Tata Bahasa', emoji: '✏️', example: { en: 'I study grammar.', id: 'Aku belajar tata bahasa.', emoji: '✏️' } },
      { en: 'Native Speaker', id: 'Penutur Asli', emoji: '🎙️', example: { en: 'I talk to a native speaker.', id: 'Aku bicara dengan penutur asli.', emoji: '🎙️' } },
    ],
  },
];

/**
 * Peta topik per level per skill — SATU-SATUNYA tempat app.ts perlu tanya
 * "topik apa aja yang ada di level X". Level tanpa entri di sini otomatis
 * dianggap kosong ([]) oleh pemanggilnya (`topicsForLevel` di app.ts) —
 * BUKAN error, itu makna `hasContent:false` di `LEVELS` (§ atas).
 */
export const VOCAB_TOPICS_BY_LEVEL: Partial<Record<LevelKey, VocabTopic[]>> = {
  'little-stars': VOCAB_TOPICS_LITTLE_STARS,
  starter: VOCAB_TOPICS_STARTER,
  explorer: VOCAB_TOPICS,
  achiever: VOCAB_TOPICS_ACHIEVER,
  trailblazer: VOCAB_TOPICS_TRAILBLAZER,
  adventurer: VOCAB_TOPICS_ADVENTURER,
};
/**
 * Listening Starter — level KEDUA yang pakai format `ListeningSentenceTopic`
 * (Little Stars format baru pertama, sesi lalu). Riset & pemetaan tema
 * lengkap: `materi/listening.md` §3B/§4. 10 topik dipetakan 1:1 ke 10 topik
 * `VOCAB_TOPICS_STARTER` (kosakata sudah dikenal anak Starter dari Vocab,
 * dilatih ulang lewat modalitas dengar — prinsip sama dgn Little Stars).
 * Kalimat sengaja SEDIKIT lebih panjang/kata lebih abstrak dari Little
 * Stars (riset Kurikulum Merdeka Fase A + `materi/vocab.md` §3B.3 — anak
 * Starter mulai transisi dari murni-lisan ke literasi ringan), TAPI masih
 * 1 kalimat sederhana + 1 pertanyaan per item, format & mekanik generik
 * TIDAK berubah dari Little Stars.
 */
export const LISTENING_TOPICS_STARTER: ListeningSentenceTopic[] = [
  {
    id: 'hitung-belasan',
    title: 'Hitung Belasan (Numbers 11–20)',
    desc: '10 kalimat',
    items: [
      {
        en: 'Eleven',
        id: 'Sebelas',
        emoji: '1️⃣1️⃣',
        example: { en: 'I have eleven marbles.', id: 'Aku punya sebelas kelereng.', emoji: '🔴' },
        question: {
          en: 'How many marbles does she have?',
          id: 'Berapa kelereng yang dia punya?',
          options: [
            { emoji: '1️⃣1️⃣', text: 'Eleven', ok: true },
            { emoji: '1️⃣2️⃣', text: 'Twelve', ok: false },
            { emoji: '🔟', text: 'Ten', ok: false },
            { emoji: '1️⃣3️⃣', text: 'Thirteen', ok: false },
          ],
        },
      },
      {
        en: 'Twelve',
        id: 'Dua Belas',
        emoji: '1️⃣2️⃣',
        example: { en: 'I see twelve ducks.', id: 'Aku lihat dua belas bebek.', emoji: '🦆' },
        question: {
          en: 'How many ducks does she see?',
          id: 'Berapa bebek yang dia lihat?',
          options: [
            { emoji: '1️⃣2️⃣', text: 'Twelve', ok: true },
            { emoji: '1️⃣1️⃣', text: 'Eleven', ok: false },
            { emoji: '1️⃣4️⃣', text: 'Fourteen', ok: false },
            { emoji: '2️⃣0️⃣', text: 'Twenty', ok: false },
          ],
        },
      },
      {
        en: 'Thirteen',
        id: 'Tiga Belas',
        emoji: '1️⃣3️⃣',
        example: { en: 'I count thirteen shells.', id: 'Aku menghitung tiga belas kerang.', emoji: '🐚' },
        question: {
          en: 'How many shells does she count?',
          id: 'Berapa kerang yang dia hitung?',
          options: [
            { emoji: '1️⃣3️⃣', text: 'Thirteen', ok: true },
            { emoji: '1️⃣2️⃣', text: 'Twelve', ok: false },
            { emoji: '1️⃣5️⃣', text: 'Fifteen', ok: false },
            { emoji: '1️⃣8️⃣', text: 'Eighteen', ok: false },
          ],
        },
      },
      {
        en: 'Fourteen',
        id: 'Empat Belas',
        emoji: '1️⃣4️⃣',
        example: { en: 'I have fourteen crayons.', id: 'Aku punya empat belas krayon.', emoji: '🖍️' },
        question: {
          en: 'How many crayons does she have?',
          id: 'Berapa krayon yang dia punya?',
          options: [
            { emoji: '1️⃣4️⃣', text: 'Fourteen', ok: true },
            { emoji: '1️⃣3️⃣', text: 'Thirteen', ok: false },
            { emoji: '1️⃣6️⃣', text: 'Sixteen', ok: false },
            { emoji: '1️⃣1️⃣', text: 'Eleven', ok: false },
          ],
        },
      },
      {
        en: 'Fifteen',
        id: 'Lima Belas',
        emoji: '1️⃣5️⃣',
        example: { en: 'I see fifteen kites.', id: 'Aku lihat lima belas layangan.', emoji: '🪁' },
        question: {
          en: 'How many kites does she see?',
          id: 'Berapa layangan yang dia lihat?',
          options: [
            { emoji: '1️⃣5️⃣', text: 'Fifteen', ok: true },
            { emoji: '1️⃣4️⃣', text: 'Fourteen', ok: false },
            { emoji: '1️⃣7️⃣', text: 'Seventeen', ok: false },
            { emoji: '2️⃣0️⃣', text: 'Twenty', ok: false },
          ],
        },
      },
      {
        en: 'Sixteen',
        id: 'Enam Belas',
        emoji: '1️⃣6️⃣',
        example: { en: 'I count sixteen candles.', id: 'Aku menghitung enam belas lilin.', emoji: '🕯️' },
        question: {
          en: 'How many candles does she count?',
          id: 'Berapa lilin yang dia hitung?',
          options: [
            { emoji: '1️⃣6️⃣', text: 'Sixteen', ok: true },
            { emoji: '1️⃣5️⃣', text: 'Fifteen', ok: false },
            { emoji: '1️⃣8️⃣', text: 'Eighteen', ok: false },
            { emoji: '1️⃣2️⃣', text: 'Twelve', ok: false },
          ],
        },
      },
      {
        en: 'Seventeen',
        id: 'Tujuh Belas',
        emoji: '1️⃣7️⃣',
        example: { en: 'I have seventeen buttons.', id: 'Aku punya tujuh belas kancing.', emoji: '🔘' },
        question: {
          en: 'How many buttons does she have?',
          id: 'Berapa kancing yang dia punya?',
          options: [
            { emoji: '1️⃣7️⃣', text: 'Seventeen', ok: true },
            { emoji: '1️⃣6️⃣', text: 'Sixteen', ok: false },
            { emoji: '1️⃣9️⃣', text: 'Nineteen', ok: false },
            { emoji: '1️⃣1️⃣', text: 'Eleven', ok: false },
          ],
        },
      },
      {
        en: 'Eighteen',
        id: 'Delapan Belas',
        emoji: '1️⃣8️⃣',
        example: { en: 'I see eighteen leaves.', id: 'Aku lihat delapan belas daun.', emoji: '🍂' },
        question: {
          en: 'How many leaves does she see?',
          id: 'Berapa daun yang dia lihat?',
          options: [
            { emoji: '1️⃣8️⃣', text: 'Eighteen', ok: true },
            { emoji: '1️⃣7️⃣', text: 'Seventeen', ok: false },
            { emoji: '2️⃣0️⃣', text: 'Twenty', ok: false },
            { emoji: '1️⃣3️⃣', text: 'Thirteen', ok: false },
          ],
        },
      },
      {
        en: 'Nineteen',
        id: 'Sembilan Belas',
        emoji: '1️⃣9️⃣',
        example: { en: 'I count nineteen bricks.', id: 'Aku menghitung sembilan belas bata.', emoji: '🧱' },
        question: {
          en: 'How many bricks does she count?',
          id: 'Berapa bata yang dia hitung?',
          options: [
            { emoji: '1️⃣9️⃣', text: 'Nineteen', ok: true },
            { emoji: '1️⃣8️⃣', text: 'Eighteen', ok: false },
            { emoji: '2️⃣0️⃣', text: 'Twenty', ok: false },
            { emoji: '1️⃣4️⃣', text: 'Fourteen', ok: false },
          ],
        },
      },
      {
        en: 'Twenty',
        id: 'Dua Puluh',
        emoji: '2️⃣0️⃣',
        example: { en: 'I have twenty balloons.', id: 'Aku punya dua puluh balon.', emoji: '🎈' },
        question: {
          en: 'How many balloons does she have?',
          id: 'Berapa balon yang dia punya?',
          options: [
            { emoji: '2️⃣0️⃣', text: 'Twenty', ok: true },
            { emoji: '1️⃣9️⃣', text: 'Nineteen', ok: false },
            { emoji: '1️⃣8️⃣', text: 'Eighteen', ok: false },
            { emoji: '1️⃣5️⃣', text: 'Fifteen', ok: false },
          ],
        },
      },
    ],
  },
  {
    id: 'hari-di-kalender',
    title: 'Hari di Kalender (Days on the Calendar)',
    desc: '10 kalimat',
    items: [
      {
        en: 'Monday',
        id: 'Senin',
        emoji: '🏫',
        example: { en: 'School starts on Monday.', id: 'Sekolah dimulai hari Senin.', emoji: '🏫' },
        question: {
          en: 'When does school start?',
          id: 'Kapan sekolah dimulai?',
          options: [
            { emoji: '🏫', text: 'Monday', ok: true },
            { emoji: '🎨', text: 'Tuesday', ok: false },
            { emoji: '🌳', text: 'Sunday', ok: false },
            { emoji: '🎈', text: 'Friday', ok: false },
          ],
        },
      },
      {
        en: 'Tuesday',
        id: 'Selasa',
        emoji: '🎨',
        example: { en: 'We have art class on Tuesday.', id: 'Kami ada kelas seni hari Selasa.', emoji: '🎨' },
        question: {
          en: 'When do we have art class?',
          id: 'Kapan kami ada kelas seni?',
          options: [
            { emoji: '🎨', text: 'Tuesday', ok: true },
            { emoji: '🏫', text: 'Monday', ok: false },
            { emoji: '🎵', text: 'Wednesday', ok: false },
            { emoji: '⚽', text: 'Thursday', ok: false },
          ],
        },
      },
      {
        en: 'Wednesday',
        id: 'Rabu',
        emoji: '🎵',
        example: { en: 'We sing songs on Wednesday.', id: 'Kami menyanyi hari Rabu.', emoji: '🎵' },
        question: {
          en: 'When do we sing songs?',
          id: 'Kapan kami menyanyi?',
          options: [
            { emoji: '🎵', text: 'Wednesday', ok: true },
            { emoji: '🎨', text: 'Tuesday', ok: false },
            { emoji: '🎈', text: 'Friday', ok: false },
            { emoji: '🎉', text: 'Saturday', ok: false },
          ],
        },
      },
      {
        en: 'Thursday',
        id: 'Kamis',
        emoji: '⚽',
        example: { en: 'We play sports on Thursday.', id: 'Kami berolahraga hari Kamis.', emoji: '⚽' },
        question: {
          en: 'When do we play sports?',
          id: 'Kapan kami berolahraga?',
          options: [
            { emoji: '⚽', text: 'Thursday', ok: true },
            { emoji: '🎵', text: 'Wednesday', ok: false },
            { emoji: '🎈', text: 'Friday', ok: false },
            { emoji: '🏫', text: 'Monday', ok: false },
          ],
        },
      },
      {
        en: 'Friday',
        id: 'Jumat',
        emoji: '🎈',
        example: { en: 'Friday is my favorite day.', id: 'Hari Jumat itu hari favoritku.', emoji: '😊' },
        question: {
          en: 'What is her favorite day?',
          id: 'Apa hari favoritnya?',
          options: [
            { emoji: '🎈', text: 'Friday', ok: true },
            { emoji: '🏫', text: 'Monday', ok: false },
            { emoji: '🌳', text: 'Sunday', ok: false },
            { emoji: '🎨', text: 'Tuesday', ok: false },
          ],
        },
      },
      {
        en: 'Saturday',
        id: 'Sabtu',
        emoji: '🎉',
        example: { en: 'We visit grandma on Saturday.', id: 'Kami mengunjungi nenek hari Sabtu.', emoji: '👵' },
        question: {
          en: 'When do we visit grandma?',
          id: 'Kapan kami mengunjungi nenek?',
          options: [
            { emoji: '🎉', text: 'Saturday', ok: true },
            { emoji: '🌳', text: 'Sunday', ok: false },
            { emoji: '🎈', text: 'Friday', ok: false },
            { emoji: '🎵', text: 'Wednesday', ok: false },
          ],
        },
      },
      {
        en: 'Sunday',
        id: 'Minggu',
        emoji: '🌳',
        example: { en: 'We rest on Sunday.', id: 'Kami beristirahat hari Minggu.', emoji: '😴' },
        question: {
          en: 'When do we rest?',
          id: 'Kapan kami beristirahat?',
          options: [
            { emoji: '🌳', text: 'Sunday', ok: true },
            { emoji: '🎉', text: 'Saturday', ok: false },
            { emoji: '🏫', text: 'Monday', ok: false },
            { emoji: '⚽', text: 'Thursday', ok: false },
          ],
        },
      },
      {
        en: 'Today',
        id: 'Hari Ini',
        emoji: '👉',
        example: { en: 'Today is a sunny day.', id: 'Hari ini hari yang cerah.', emoji: '☀️' },
        question: {
          en: 'What day is sunny?',
          id: 'Hari apa yang cerah?',
          options: [
            { emoji: '👉', text: 'Today', ok: true },
            { emoji: '🌅', text: 'Tomorrow', ok: false },
            { emoji: '🌇', text: 'Yesterday', ok: false },
            { emoji: '🎈', text: 'Friday', ok: false },
          ],
        },
      },
      {
        en: 'Tomorrow',
        id: 'Besok',
        emoji: '🌅',
        example: { en: 'I will go swimming tomorrow.', id: 'Aku akan berenang besok.', emoji: '🏊' },
        question: {
          en: 'When will she go swimming?',
          id: 'Kapan dia akan berenang?',
          options: [
            { emoji: '🌅', text: 'Tomorrow', ok: true },
            { emoji: '👉', text: 'Today', ok: false },
            { emoji: '🌇', text: 'Yesterday', ok: false },
            { emoji: '🏫', text: 'Monday', ok: false },
          ],
        },
      },
      {
        en: 'Yesterday',
        id: 'Kemarin',
        emoji: '🌇',
        example: { en: 'It rained yesterday.', id: 'Hujan turun kemarin.', emoji: '🌧️' },
        question: {
          en: 'When did it rain?',
          id: 'Kapan hujan turun?',
          options: [
            { emoji: '🌇', text: 'Yesterday', ok: true },
            { emoji: '👉', text: 'Today', ok: false },
            { emoji: '🌅', text: 'Tomorrow', ok: false },
            { emoji: '🌳', text: 'Sunday', ok: false },
          ],
        },
      },
    ],
  },
  {
    id: 'pergi-ke-mana',
    title: 'Pergi ke Mana? (Where Are We Going?)',
    desc: '10 kalimat',
    items: [
      {
        en: 'Park',
        id: 'Taman',
        emoji: '🏞️',
        example: { en: 'We fly kites at the park.', id: 'Kami main layangan di taman.', emoji: '🪁' },
        question: {
          en: 'Where do we fly kites?',
          id: 'Di mana kami main layangan?',
          options: [
            { emoji: '🏞️', text: 'Park', ok: true },
            { emoji: '🦓', text: 'Zoo', ok: false },
            { emoji: '🏖️', text: 'Beach', ok: false },
            { emoji: '🚜', text: 'Farm', ok: false },
          ],
        },
      },
      {
        en: 'Zoo',
        id: 'Kebun Binatang',
        emoji: '🦓',
        example: { en: 'We see lions at the zoo.', id: 'Kami lihat singa di kebun binatang.', emoji: '🦁' },
        question: {
          en: 'Where do we see lions?',
          id: 'Di mana kami lihat singa?',
          options: [
            { emoji: '🦓', text: 'Zoo', ok: true },
            { emoji: '🚜', text: 'Farm', ok: false },
            { emoji: '🏞️', text: 'Park', ok: false },
            { emoji: '⛰️', text: 'Mountain', ok: false },
          ],
        },
      },
      {
        en: 'Beach',
        id: 'Pantai',
        emoji: '🏖️',
        example: { en: 'We build sandcastles at the beach.', id: 'Kami membangun istana pasir di pantai.', emoji: '🏰' },
        question: {
          en: 'Where do we build sandcastles?',
          id: 'Di mana kami membangun istana pasir?',
          options: [
            { emoji: '🏖️', text: 'Beach', ok: true },
            { emoji: '🏞️', text: 'Park', ok: false },
            { emoji: '🛝', text: 'Playground', ok: false },
            { emoji: '🛣️', text: 'Street', ok: false },
          ],
        },
      },
      {
        en: 'Market',
        id: 'Pasar',
        emoji: '🛒',
        example: { en: 'We buy vegetables at the market.', id: 'Kami membeli sayur di pasar.', emoji: '🥕' },
        question: {
          en: 'Where do we buy vegetables?',
          id: 'Di mana kami membeli sayur?',
          options: [
            { emoji: '🛒', text: 'Market', ok: true },
            { emoji: '🏥', text: 'Hospital', ok: false },
            { emoji: '🚜', text: 'Farm', ok: false },
            { emoji: '🦓', text: 'Zoo', ok: false },
          ],
        },
      },
      {
        en: 'Hospital',
        id: 'Rumah Sakit',
        emoji: '🏥',
        example: { en: 'The nurse works at the hospital.', id: 'Perawat bekerja di rumah sakit.', emoji: '👩‍⚕️' },
        question: {
          en: 'Where does the nurse work?',
          id: 'Di mana perawat bekerja?',
          options: [
            { emoji: '🏥', text: 'Hospital', ok: true },
            { emoji: '🛒', text: 'Market', ok: false },
            { emoji: '🏫', text: 'School', ok: false },
            { emoji: '🚜', text: 'Farm', ok: false },
          ],
        },
      },
      {
        en: 'Farm',
        id: 'Ladang',
        emoji: '🚜',
        example: { en: 'We feed cows on the farm.', id: 'Kami memberi makan sapi di ladang.', emoji: '🐄' },
        question: {
          en: 'Where do we feed cows?',
          id: 'Di mana kami memberi makan sapi?',
          options: [
            { emoji: '🚜', text: 'Farm', ok: true },
            { emoji: '🦓', text: 'Zoo', ok: false },
            { emoji: '🏞️', text: 'Park', ok: false },
            { emoji: '🏖️', text: 'Beach', ok: false },
          ],
        },
      },
      {
        en: 'Bridge',
        id: 'Jembatan',
        emoji: '🌉',
        example: { en: 'We walk across the bridge.', id: 'Kami berjalan menyeberangi jembatan.', emoji: '🚶' },
        question: {
          en: 'What do we walk across?',
          id: 'Apa yang kami seberangi?',
          options: [
            { emoji: '🌉', text: 'Bridge', ok: true },
            { emoji: '🛣️', text: 'Street', ok: false },
            { emoji: '⛰️', text: 'Mountain', ok: false },
            { emoji: '🛝', text: 'Playground', ok: false },
          ],
        },
      },
      {
        en: 'Playground',
        id: 'Taman Bermain',
        emoji: '🛝',
        example: { en: 'We slide at the playground.', id: 'Kami merosot di taman bermain.', emoji: '🛝' },
        question: {
          en: 'Where do we slide?',
          id: 'Di mana kami merosot?',
          options: [
            { emoji: '🛝', text: 'Playground', ok: true },
            { emoji: '🏞️', text: 'Park', ok: false },
            { emoji: '🏖️', text: 'Beach', ok: false },
            { emoji: '🛒', text: 'Market', ok: false },
          ],
        },
      },
      {
        en: 'Street',
        id: 'Jalan',
        emoji: '🛣️',
        example: { en: 'Cars honk on the street.', id: 'Mobil membunyikan klakson di jalan.', emoji: '📯' },
        question: {
          en: 'Where do cars honk?',
          id: 'Di mana mobil membunyikan klakson?',
          options: [
            { emoji: '🛣️', text: 'Street', ok: true },
            { emoji: '🌉', text: 'Bridge', ok: false },
            { emoji: '🚜', text: 'Farm', ok: false },
            { emoji: '🦓', text: 'Zoo', ok: false },
          ],
        },
      },
      {
        en: 'Mountain',
        id: 'Gunung',
        emoji: '⛰️',
        example: { en: 'We hike up the mountain.', id: 'Kami mendaki gunung.', emoji: '🥾' },
        question: {
          en: 'What do we hike up?',
          id: 'Apa yang kami daki?',
          options: [
            { emoji: '⛰️', text: 'Mountain', ok: true },
            { emoji: '🌉', text: 'Bridge', ok: false },
            { emoji: '🛣️', text: 'Street', ok: false },
            { emoji: '🏥', text: 'Hospital', ok: false },
          ],
        },
      },
    ],
  },
  {
    id: 'serangga-kecil',
    title: 'Serangga Kecil (Tiny Creatures)',
    desc: '10 kalimat',
    items: [
      {
        en: 'Butterfly',
        id: 'Kupu-kupu',
        emoji: '🦋',
        example: { en: 'The butterfly flies from flower to flower.', id: 'Kupu-kupu terbang dari bunga ke bunga.', emoji: '🌸' },
        question: {
          en: 'What does the butterfly do?',
          id: 'Apa yang dilakukan kupu-kupu?',
          options: [
            { emoji: '🦋', text: 'Flies', ok: true },
            { emoji: '🏊', text: 'Swims', ok: false },
            { emoji: '⛏️', text: 'Digs', ok: false },
            { emoji: '😴', text: 'Sleeps', ok: false },
          ],
        },
      },
      {
        en: 'Bee',
        id: 'Lebah',
        emoji: '🐝',
        example: { en: 'The bee collects honey from flowers.', id: 'Lebah mengumpulkan madu dari bunga.', emoji: '🍯' },
        question: {
          en: 'What does the bee collect?',
          id: 'Apa yang dikumpulkan lebah?',
          options: [
            { emoji: '🍯', text: 'Honey', ok: true },
            { emoji: '💧', text: 'Water', ok: false },
            { emoji: '🍃', text: 'Leaves', ok: false },
            { emoji: '🌾', text: 'Seeds', ok: false },
          ],
        },
      },
      {
        en: 'Ant',
        id: 'Semut',
        emoji: '🐜',
        example: { en: 'The ant carries a heavy leaf.', id: 'Semut membawa daun yang berat.', emoji: '🍃' },
        question: {
          en: 'What does the ant carry?',
          id: 'Apa yang dibawa semut?',
          options: [
            { emoji: '🍃', text: 'A Leaf', ok: true },
            { emoji: '🪨', text: 'A Rock', ok: false },
            { emoji: '🥖', text: 'A Stick', ok: false },
            { emoji: '🌸', text: 'A Flower', ok: false },
          ],
        },
      },
      {
        en: 'Ladybug',
        id: 'Kepik',
        emoji: '🐞',
        example: { en: 'The ladybug has red wings.', id: 'Kepik punya sayap merah.', emoji: '🔴' },
        question: {
          en: 'What color are the ladybug’s wings?',
          id: 'Apa warna sayap kepik itu?',
          options: [
            { emoji: '🔴', text: 'Red', ok: true },
            { emoji: '🔵', text: 'Blue', ok: false },
            { emoji: '🟢', text: 'Green', ok: false },
            { emoji: '🟡', text: 'Yellow', ok: false },
          ],
        },
      },
      {
        en: 'Spider',
        id: 'Laba-laba',
        emoji: '🕷️',
        example: { en: 'The spider spins a web at night.', id: 'Laba-laba membuat sarang di malam hari.', emoji: '🕸️' },
        question: {
          en: 'When does the spider spin a web?',
          id: 'Kapan laba-laba membuat sarang?',
          options: [
            { emoji: '🌙', text: 'Night', ok: true },
            { emoji: '🌅', text: 'Morning', ok: false },
            { emoji: '☀️', text: 'Noon', ok: false },
            { emoji: '🏫', text: 'School Time', ok: false },
          ],
        },
      },
      {
        en: 'Snail',
        id: 'Siput',
        emoji: '🐌',
        example: { en: 'The snail carries its house.', id: 'Siput membawa rumahnya.', emoji: '🏠' },
        question: {
          en: 'What does the snail carry?',
          id: 'Apa yang dibawa siput?',
          options: [
            { emoji: '🏠', text: 'Its House', ok: true },
            { emoji: '🍱', text: 'Its Food', ok: false },
            { emoji: '👶', text: 'Its Baby', ok: false },
            { emoji: '🧑‍🤝‍🧑', text: 'Its Friend', ok: false },
          ],
        },
      },
      {
        en: 'Frog',
        id: 'Katak',
        emoji: '🐸',
        example: { en: 'The frog jumps into the pond.', id: 'Katak melompat ke dalam kolam.', emoji: '💦' },
        question: {
          en: 'Where does the frog jump?',
          id: 'Ke mana katak melompat?',
          options: [
            { emoji: '💦', text: 'Into the Pond', ok: true },
            { emoji: '🏠', text: 'Onto the Roof', ok: false },
            { emoji: '📦', text: 'Into the Box', ok: false },
            { emoji: '🌳', text: 'Onto the Tree', ok: false },
          ],
        },
      },
      {
        en: 'Turtle',
        id: 'Kura-kura',
        emoji: '🐢',
        example: { en: 'The turtle hides in its shell.', id: 'Kura-kura bersembunyi di cangkangnya.', emoji: '🐢' },
        question: {
          en: 'Where does the turtle hide?',
          id: 'Di mana kura-kura bersembunyi?',
          options: [
            { emoji: '🐢', text: 'In Its Shell', ok: true },
            { emoji: '🕳️', text: 'In a Cave', ok: false },
            { emoji: '💧', text: 'In the Water', ok: false },
            { emoji: '📦', text: 'In a Box', ok: false },
          ],
        },
      },
      {
        en: 'Crab',
        id: 'Kepiting',
        emoji: '🦀',
        example: { en: 'The crab walks sideways on the sand.', id: 'Kepiting berjalan menyamping di pasir.', emoji: '🏖️' },
        question: {
          en: 'How does the crab walk?',
          id: 'Bagaimana kepiting berjalan?',
          options: [
            { emoji: '↔️', text: 'Sideways', ok: true },
            { emoji: '⬅️', text: 'Backwards', ok: false },
            { emoji: '➡️', text: 'Forwards', ok: false },
            { emoji: '🙃', text: 'Upside Down', ok: false },
          ],
        },
      },
      {
        en: 'Worm',
        id: 'Cacing',
        emoji: '🪱',
        example: { en: 'The worm digs under the ground.', id: 'Cacing menggali di bawah tanah.', emoji: '⛏️' },
        question: {
          en: 'Where does the worm dig?',
          id: 'Di mana cacing menggali?',
          options: [
            { emoji: '⛏️', text: 'Under the Ground', ok: true },
            { emoji: '🌳', text: 'In the Tree', ok: false },
            { emoji: '💧', text: 'In the Water', ok: false },
            { emoji: '🏠', text: 'On the Roof', ok: false },
          ],
        },
      },
    ],
  },
  {
    id: 'waktu-makan',
    title: 'Waktu Makan (Meal Time)',
    desc: '10 kalimat',
    items: [
      {
        en: 'Pizza',
        id: 'Pizza',
        emoji: '🍕',
        example: { en: 'We share a pizza on Friday.', id: 'Kami berbagi pizza hari Jumat.', emoji: '🍕' },
        question: {
          en: 'When do we share pizza?',
          id: 'Kapan kami berbagi pizza?',
          options: [
            { emoji: '🎈', text: 'Friday', ok: true },
            { emoji: '🏫', text: 'Monday', ok: false },
            { emoji: '🌳', text: 'Sunday', ok: false },
            { emoji: '🎵', text: 'Wednesday', ok: false },
          ],
        },
      },
      {
        en: 'Burger',
        id: 'Burger',
        emoji: '🍔',
        example: { en: 'I eat a burger for lunch.', id: 'Aku makan burger saat makan siang.', emoji: '🍔' },
        question: {
          en: 'When does she eat a burger?',
          id: 'Kapan dia makan burger?',
          options: [
            { emoji: '🍽️', text: 'Lunch', ok: true },
            { emoji: '🌅', text: 'Breakfast', ok: false },
            { emoji: '🌙', text: 'Dinner', ok: false },
            { emoji: '🍪', text: 'Snack Time', ok: false },
          ],
        },
      },
      {
        en: 'Sandwich',
        id: 'Sandwich',
        emoji: '🥪',
        example: { en: 'Mom makes a sandwich for me.', id: 'Ibu membuatkan sandwich untukku.', emoji: '👩' },
        question: {
          en: 'Who makes the sandwich?',
          id: 'Siapa yang membuat sandwich?',
          options: [
            { emoji: '👩', text: 'Mom', ok: true },
            { emoji: '👨', text: 'Dad', ok: false },
            { emoji: '👵', text: 'Grandma', ok: false },
            { emoji: '🧑‍🏫', text: 'Teacher', ok: false },
          ],
        },
      },
      {
        en: 'Ice Cream',
        id: 'Es Krim',
        emoji: '🍦',
        example: { en: 'I eat ice cream on a hot day.', id: 'Aku makan es krim saat hari panas.', emoji: '🍦' },
        question: {
          en: 'When does she eat ice cream?',
          id: 'Kapan dia makan es krim?',
          options: [
            { emoji: '☀️', text: 'A Hot Day', ok: true },
            { emoji: '🌧️', text: 'A Rainy Day', ok: false },
            { emoji: '🌙', text: 'A Cold Night', ok: false },
            { emoji: '🏫', text: 'School Time', ok: false },
          ],
        },
      },
      {
        en: 'Cake',
        id: 'Kue',
        emoji: '🍰',
        example: { en: 'We eat cake at the birthday party.', id: 'Kami makan kue di pesta ulang tahun.', emoji: '🎂' },
        question: {
          en: 'Where do we eat cake?',
          id: 'Di mana kami makan kue?',
          options: [
            { emoji: '🎂', text: 'The Birthday Party', ok: true },
            { emoji: '🦓', text: 'The Zoo', ok: false },
            { emoji: '🏖️', text: 'The Beach', ok: false },
            { emoji: '🏫', text: 'School', ok: false },
          ],
        },
      },
      {
        en: 'Cookie',
        id: 'Biskuit',
        emoji: '🍪',
        example: { en: 'I bake a cookie with grandma.', id: 'Aku membuat biskuit bersama nenek.', emoji: '👵' },
        question: {
          en: 'Who bakes the cookie with her?',
          id: 'Siapa yang membuat biskuit bersamanya?',
          options: [
            { emoji: '👵', text: 'Grandma', ok: true },
            { emoji: '👴', text: 'Grandpa', ok: false },
            { emoji: '👨', text: 'Dad', ok: false },
            { emoji: '🧑‍🏫', text: 'Teacher', ok: false },
          ],
        },
      },
      {
        en: 'Chocolate',
        id: 'Cokelat',
        emoji: '🍫',
        example: { en: 'I share chocolate with my friend.', id: 'Aku berbagi cokelat dengan temanku.', emoji: '🧑‍🤝‍🧑' },
        question: {
          en: 'Who does she share chocolate with?',
          id: 'Dengan siapa dia berbagi cokelat?',
          options: [
            { emoji: '🧑‍🤝‍🧑', text: 'Her Friend', ok: true },
            { emoji: '🧑‍🏫', text: 'Her Teacher', ok: false },
            { emoji: '🐶', text: 'Her Dog', ok: false },
            { emoji: '🏘️', text: 'Her Neighbor', ok: false },
          ],
        },
      },
      {
        en: 'Cheese',
        id: 'Keju',
        emoji: '🧀',
        example: { en: 'The mouse likes cheese.', id: 'Tikus itu suka keju.', emoji: '🐭' },
        question: {
          en: 'Who likes cheese?',
          id: 'Siapa yang suka keju?',
          options: [
            { emoji: '🐭', text: 'The Mouse', ok: true },
            { emoji: '🐱', text: 'The Cat', ok: false },
            { emoji: '🐶', text: 'The Dog', ok: false },
            { emoji: '🐦', text: 'The Bird', ok: false },
          ],
        },
      },
      {
        en: 'Juice',
        id: 'Jus',
        emoji: '🧃',
        example: { en: 'I drink orange juice for breakfast.', id: 'Aku minum jus jeruk saat sarapan.', emoji: '🧃' },
        question: {
          en: 'When does she drink juice?',
          id: 'Kapan dia minum jus?',
          options: [
            { emoji: '🌅', text: 'Breakfast', ok: true },
            { emoji: '🍽️', text: 'Lunch', ok: false },
            { emoji: '🌙', text: 'Dinner', ok: false },
            { emoji: '😴', text: 'Bedtime', ok: false },
          ],
        },
      },
      {
        en: 'Yogurt',
        id: 'Yogurt',
        emoji: '🥣',
        example: { en: 'I eat yogurt with fruit.', id: 'Aku makan yogurt dengan buah.', emoji: '🍓' },
        question: {
          en: 'What does she eat yogurt with?',
          id: 'Dengan apa dia makan yogurt?',
          options: [
            { emoji: '🍓', text: 'Fruit', ok: true },
            { emoji: '🍞', text: 'Bread', ok: false },
            { emoji: '🍚', text: 'Rice', ok: false },
            { emoji: '🍜', text: 'Noodles', ok: false },
          ],
        },
      },
    ],
  },
  {
    id: 'di-dalam-rumah',
    title: 'Di Dalam Rumah (Inside the House)',
    desc: '10 kalimat',
    items: [
      {
        en: 'Table',
        id: 'Meja',
        emoji: '🍽️',
        example: { en: 'We eat dinner at the table.', id: 'Kami makan malam di meja.', emoji: '🍽️' },
        question: {
          en: 'Where do we eat dinner?',
          id: 'Di mana kami makan malam?',
          options: [
            { emoji: '🍽️', text: 'The Table', ok: true },
            { emoji: '🛋️', text: 'The Sofa', ok: false },
            { emoji: '🛏️', text: 'The Bed', ok: false },
            { emoji: '🧹', text: 'The Floor', ok: false },
          ],
        },
      },
      {
        en: 'Bed',
        id: 'Tempat Tidur',
        emoji: '🛏️',
        example: { en: 'I sleep in my bed.', id: 'Aku tidur di tempat tidurku.', emoji: '🛏️' },
        question: {
          en: 'Where does she sleep?',
          id: 'Di mana dia tidur?',
          options: [
            { emoji: '🛏️', text: 'Her Bed', ok: true },
            { emoji: '🛋️', text: 'Her Sofa', ok: false },
            { emoji: '🪑', text: 'Her Chair', ok: false },
            { emoji: '🧹', text: 'The Floor', ok: false },
          ],
        },
      },
      {
        en: 'Sofa',
        id: 'Sofa',
        emoji: '🛋️',
        example: { en: 'We watch movies on the sofa.', id: 'Kami menonton film di sofa.', emoji: '🎬' },
        question: {
          en: 'Where do we watch movies?',
          id: 'Di mana kami menonton film?',
          options: [
            { emoji: '🛋️', text: 'The Sofa', ok: true },
            { emoji: '🛏️', text: 'The Bed', ok: false },
            { emoji: '🍽️', text: 'The Table', ok: false },
            { emoji: '🍳', text: 'The Kitchen', ok: false },
          ],
        },
      },
      {
        en: 'Lamp',
        id: 'Lampu',
        emoji: '💡',
        example: { en: 'I turn on the lamp at night.', id: 'Aku menyalakan lampu di malam hari.', emoji: '💡' },
        question: {
          en: 'When does she turn on the lamp?',
          id: 'Kapan dia menyalakan lampu?',
          options: [
            { emoji: '🌙', text: 'Night', ok: true },
            { emoji: '🌅', text: 'Morning', ok: false },
            { emoji: '☀️', text: 'Noon', ok: false },
            { emoji: '🏫', text: 'School Time', ok: false },
          ],
        },
      },
      {
        en: 'Television',
        id: 'Televisi',
        emoji: '📺',
        example: { en: 'We watch cartoons on television.', id: 'Kami menonton kartun di televisi.', emoji: '📺' },
        question: {
          en: 'What do we watch on television?',
          id: 'Apa yang kami tonton di televisi?',
          options: [
            { emoji: '🎨', text: 'Cartoons', ok: true },
            { emoji: '📰', text: 'News', ok: false },
            { emoji: '⚽', text: 'Sports', ok: false },
            { emoji: '🍳', text: 'Cooking Shows', ok: false },
          ],
        },
      },
      {
        en: 'Fridge',
        id: 'Kulkas',
        emoji: '🧊',
        example: { en: 'I put the milk in the fridge.', id: 'Aku memasukkan susu ke kulkas.', emoji: '🥛' },
        question: {
          en: 'What does she put in the fridge?',
          id: 'Apa yang dia masukkan ke kulkas?',
          options: [
            { emoji: '🥛', text: 'Milk', ok: true },
            { emoji: '🍞', text: 'Bread', ok: false },
            { emoji: '📚', text: 'Books', ok: false },
            { emoji: '🧸', text: 'Toys', ok: false },
          ],
        },
      },
      {
        en: 'Mirror',
        id: 'Cermin',
        emoji: '🪞',
        example: { en: 'I look at my mirror every morning.', id: 'Aku bercermin setiap pagi.', emoji: '🪞' },
        question: {
          en: 'When does she look in the mirror?',
          id: 'Kapan dia bercermin?',
          options: [
            { emoji: '🌅', text: 'Every Morning', ok: true },
            { emoji: '🌙', text: 'Every Night', ok: false },
            { emoji: '🏫', text: 'At School', ok: false },
            { emoji: '🍽️', text: 'At Lunch', ok: false },
          ],
        },
      },
      {
        en: 'Phone',
        id: 'Telepon',
        emoji: '📱',
        example: { en: 'Dad talks on the phone.', id: 'Ayah berbicara lewat telepon.', emoji: '👨' },
        question: {
          en: 'Who talks on the phone?',
          id: 'Siapa yang berbicara lewat telepon?',
          options: [
            { emoji: '👨', text: 'Dad', ok: true },
            { emoji: '👩', text: 'Mom', ok: false },
            { emoji: '👧', text: 'Sister', ok: false },
            { emoji: '👦', text: 'Brother', ok: false },
          ],
        },
      },
      {
        en: 'Cupboard',
        id: 'Lemari',
        emoji: '🗄️',
        example: { en: 'The plates are in the cupboard.', id: 'Piring-piring ada di lemari.', emoji: '🗄️' },
        question: {
          en: 'Where are the plates?',
          id: 'Di mana piring-piring itu?',
          options: [
            { emoji: '🗄️', text: 'The Cupboard', ok: true },
            { emoji: '🧊', text: 'The Fridge', ok: false },
            { emoji: '🍽️', text: 'The Table', ok: false },
            { emoji: '🛋️', text: 'The Sofa', ok: false },
          ],
        },
      },
      {
        en: 'Clock',
        id: 'Jam',
        emoji: '🕐',
        example: { en: 'I check the clock before school.', id: 'Aku melihat jam sebelum sekolah.', emoji: '🕐' },
        question: {
          en: 'When does she check the clock?',
          id: 'Kapan dia melihat jam?',
          options: [
            { emoji: '🏫', text: 'Before School', ok: true },
            { emoji: '🍽️', text: 'After Lunch', ok: false },
            { emoji: '🌙', text: 'At Night', ok: false },
            { emoji: '🛝', text: 'During Recess', ok: false },
          ],
        },
      },
    ],
  },
  {
    id: 'sekolahku',
    title: 'Sekolahku (My School)',
    desc: '10 kalimat',
    items: [
      {
        en: 'Teacher',
        id: 'Guru',
        emoji: '🧑‍🏫',
        example: { en: 'My teacher explains the lesson.', id: 'Guruku menjelaskan pelajaran.', emoji: '🧑‍🏫' },
        question: {
          en: 'Who explains the lesson?',
          id: 'Siapa yang menjelaskan pelajaran?',
          options: [
            { emoji: '🧑‍🏫', text: 'The Teacher', ok: true },
            { emoji: '🧑‍💼', text: 'The Principal', ok: false },
            { emoji: '🧑‍🤝‍🧑', text: 'A Friend', ok: false },
            { emoji: '🧑‍🎓', text: 'A Classmate', ok: false },
          ],
        },
      },
      {
        en: 'Classroom',
        id: 'Ruang Kelas',
        emoji: '🏫',
        example: { en: 'We learn new words in the classroom.', id: 'Kami belajar kata baru di ruang kelas.', emoji: '🏫' },
        question: {
          en: 'Where do we learn new words?',
          id: 'Di mana kami belajar kata baru?',
          options: [
            { emoji: '🏫', text: 'The Classroom', ok: true },
            { emoji: '📚', text: 'The Library', ok: false },
            { emoji: '🛝', text: 'The Playground', ok: false },
            { emoji: '🍱', text: 'The Cafeteria', ok: false },
          ],
        },
      },
      {
        en: 'Friend',
        id: 'Teman',
        emoji: '🧑‍🤝‍🧑',
        example: { en: 'I share my pencil with my friend.', id: 'Aku berbagi pensil dengan temanku.', emoji: '✏️' },
        question: {
          en: 'Who does she share her pencil with?',
          id: 'Dengan siapa dia berbagi pensil?',
          options: [
            { emoji: '🧑‍🤝‍🧑', text: 'Her Friend', ok: true },
            { emoji: '🧑‍🏫', text: 'Her Teacher', ok: false },
            { emoji: '👧', text: 'Her Sister', ok: false },
            { emoji: '🧑‍💼', text: 'The Principal', ok: false },
          ],
        },
      },
      {
        en: 'Principal',
        id: 'Kepala Sekolah',
        emoji: '🧑‍💼',
        example: { en: 'The principal welcomes new students.', id: 'Kepala sekolah menyambut murid baru.', emoji: '🧑‍💼' },
        question: {
          en: 'Who welcomes new students?',
          id: 'Siapa yang menyambut murid baru?',
          options: [
            { emoji: '🧑‍💼', text: 'The Principal', ok: true },
            { emoji: '🧑‍🏫', text: 'The Teacher', ok: false },
            { emoji: '📚', text: 'The Librarian', ok: false },
            { emoji: '🧑‍🤝‍🧑', text: 'A Friend', ok: false },
          ],
        },
      },
      {
        en: 'Library',
        id: 'Perpustakaan',
        emoji: '📚',
        example: { en: 'I borrow a book from the library.', id: 'Aku meminjam buku dari perpustakaan.', emoji: '📚' },
        question: {
          en: 'Where does she borrow a book?',
          id: 'Di mana dia meminjam buku?',
          options: [
            { emoji: '📚', text: 'The Library', ok: true },
            { emoji: '🏫', text: 'The Classroom', ok: false },
            { emoji: '🍱', text: 'The Cafeteria', ok: false },
            { emoji: '🏠', text: 'Home', ok: false },
          ],
        },
      },
      {
        en: 'Lunchbox',
        id: 'Kotak Bekal',
        emoji: '🍱',
        example: { en: 'I open my lunchbox at noon.', id: 'Aku membuka kotak bekalku saat siang.', emoji: '🍱' },
        question: {
          en: 'What does she open at noon?',
          id: 'Apa yang dia buka saat siang?',
          options: [
            { emoji: '🍱', text: 'Her Lunchbox', ok: true },
            { emoji: '📖', text: 'Her Book', ok: false },
            { emoji: '🎒', text: 'Her Bag', ok: false },
            { emoji: '🗄️', text: 'Her Locker', ok: false },
          ],
        },
      },
      {
        en: 'Uniform',
        id: 'Seragam',
        emoji: '👕',
        example: { en: 'I wear my uniform every school day.', id: 'Aku memakai seragam setiap hari sekolah.', emoji: '👕' },
        question: {
          en: 'When does she wear her uniform?',
          id: 'Kapan dia memakai seragamnya?',
          options: [
            { emoji: '🏫', text: 'Every School Day', ok: true },
            { emoji: '🎉', text: 'On Weekends', ok: false },
            { emoji: '🌙', text: 'At Night', ok: false },
            { emoji: '🏖️', text: 'During Holidays', ok: false },
          ],
        },
      },
      {
        en: 'Bell',
        id: 'Bel',
        emoji: '🔔',
        example: { en: 'The bell rings at the end of class.', id: 'Bel berbunyi di akhir pelajaran.', emoji: '🔔' },
        question: {
          en: 'When does the bell ring?',
          id: 'Kapan bel berbunyi?',
          options: [
            { emoji: '🔔', text: 'End of Class', ok: true },
            { emoji: '🍱', text: 'Start of Lunch', ok: false },
            { emoji: '🌙', text: 'Middle of the Night', ok: false },
            { emoji: '🎮', text: 'During a Game', ok: false },
          ],
        },
      },
      {
        en: 'Homework',
        id: 'PR',
        emoji: '📓',
        example: { en: 'I finish my homework before dinner.', id: 'Aku menyelesaikan PR-ku sebelum makan malam.', emoji: '📓' },
        question: {
          en: 'When does she finish her homework?',
          id: 'Kapan dia menyelesaikan PR-nya?',
          options: [
            { emoji: '🌙', text: 'Before Dinner', ok: true },
            { emoji: '😴', text: 'After Bedtime', ok: false },
            { emoji: '🏫', text: 'During Class', ok: false },
            { emoji: '🛝', text: 'At Recess', ok: false },
          ],
        },
      },
      {
        en: 'Recess',
        id: 'Istirahat',
        emoji: '🥪',
        example: { en: 'We play tag during recess.', id: 'Kami main kejar-kejaran saat istirahat.', emoji: '🏃' },
        question: {
          en: 'When do we play tag?',
          id: 'Kapan kami main kejar-kejaran?',
          options: [
            { emoji: '🏃', text: 'Recess', ok: true },
            { emoji: '🏫', text: 'Class Time', ok: false },
            { emoji: '📓', text: 'Homework Time', ok: false },
            { emoji: '😴', text: 'Bedtime', ok: false },
          ],
        },
      },
    ],
  },
  {
    id: 'siapa-itu',
    title: 'Siapa Itu? (Who Is That?)',
    desc: '10 kalimat',
    items: [
      {
        en: 'Neighbor',
        id: 'Tetangga',
        emoji: '🏘️',
        example: { en: 'My neighbor waters her plants every morning.', id: 'Tetanggaku menyiram tanamannya setiap pagi.', emoji: '🌱' },
        question: {
          en: 'When does the neighbor water her plants?',
          id: 'Kapan tetangga itu menyiram tanamannya?',
          options: [
            { emoji: '🌅', text: 'Every Morning', ok: true },
            { emoji: '🌙', text: 'Every Night', ok: false },
            { emoji: '🎉', text: 'Every Weekend', ok: false },
            { emoji: '🍽️', text: 'Every Lunch', ok: false },
          ],
        },
      },
      {
        en: 'Classmate',
        id: 'Teman Sekelas',
        emoji: '🧑‍🎓',
        example: { en: 'My classmate sits next to me.', id: 'Teman sekelasku duduk di sebelahku.', emoji: '🪑' },
        question: {
          en: 'Where does the classmate sit?',
          id: 'Di mana teman sekelas itu duduk?',
          options: [
            { emoji: '➡️', text: 'Next to Her', ok: true },
            { emoji: '⬅️', text: 'Behind Her', ok: false },
            { emoji: '⬆️', text: 'In Front of Her', ok: false },
            { emoji: '↔️', text: 'Far From Her', ok: false },
          ],
        },
      },
      {
        en: 'Boy',
        id: 'Anak Laki-laki',
        emoji: '👦',
        example: { en: 'The boy kicks the ball.', id: 'Anak laki-laki itu menendang bola.', emoji: '⚽' },
        question: {
          en: 'What does the boy kick?',
          id: 'Apa yang ditendang anak laki-laki itu?',
          options: [
            { emoji: '⚽', text: 'The Ball', ok: true },
            { emoji: '📦', text: 'The Box', ok: false },
            { emoji: '🪨', text: 'The Rock', ok: false },
            { emoji: '🥫', text: 'The Can', ok: false },
          ],
        },
      },
      {
        en: 'Girl',
        id: 'Anak Perempuan',
        emoji: '👧',
        example: { en: 'The girl draws a rainbow.', id: 'Anak perempuan itu menggambar pelangi.', emoji: '🌈' },
        question: {
          en: 'What does the girl draw?',
          id: 'Apa yang digambar anak perempuan itu?',
          options: [
            { emoji: '🌈', text: 'A Rainbow', ok: true },
            { emoji: '☀️', text: 'A Sun', ok: false },
            { emoji: '⭐', text: 'A Star', ok: false },
            { emoji: '🌸', text: 'A Flower', ok: false },
          ],
        },
      },
      {
        en: 'Man',
        id: 'Pria',
        emoji: '👨',
        example: { en: 'The man carries a big bag.', id: 'Pria itu membawa tas besar.', emoji: '🎒' },
        question: {
          en: 'What does the man carry?',
          id: 'Apa yang dibawa pria itu?',
          options: [
            { emoji: '🎒', text: 'A Big Bag', ok: true },
            { emoji: '📦', text: 'A Small Box', ok: false },
            { emoji: '⚽', text: 'A Ball', ok: false },
            { emoji: '☂️', text: 'An Umbrella', ok: false },
          ],
        },
      },
      {
        en: 'Woman',
        id: 'Wanita',
        emoji: '👩',
        example: { en: 'The woman waters the garden.', id: 'Wanita itu menyiram kebun.', emoji: '🌻' },
        question: {
          en: 'What does the woman water?',
          id: 'Apa yang disiram wanita itu?',
          options: [
            { emoji: '🌻', text: 'The Garden', ok: true },
            { emoji: '🚗', text: 'The Car', ok: false },
            { emoji: '🧹', text: 'The Floor', ok: false },
            { emoji: '🐶', text: 'The Dog', ok: false },
          ],
        },
      },
      {
        en: 'Baby',
        id: 'Bayi',
        emoji: '👶',
        example: { en: 'The baby laughs at the puppet show.', id: 'Bayi itu tertawa melihat pertunjukan boneka.', emoji: '🎭' },
        question: {
          en: 'What does the baby laugh at?',
          id: 'Apa yang membuat bayi itu tertawa?',
          options: [
            { emoji: '🎭', text: 'The Puppet Show', ok: true },
            { emoji: '🌧️', text: 'The Rain', ok: false },
            { emoji: '📓', text: 'The Homework', ok: false },
            { emoji: '🔔', text: 'The Bell', ok: false },
          ],
        },
      },
      {
        en: 'Driver',
        id: 'Supir',
        emoji: '🚕',
        example: { en: 'The driver stops at the red light.', id: 'Supir itu berhenti di lampu merah.', emoji: '🚦' },
        question: {
          en: 'Where does the driver stop?',
          id: 'Di mana supir itu berhenti?',
          options: [
            { emoji: '🚦', text: 'The Red Light', ok: true },
            { emoji: '🟢', text: 'The Green Light', ok: false },
            { emoji: '🏫', text: 'The School Gate', ok: false },
            { emoji: '🌉', text: 'The Bridge', ok: false },
          ],
        },
      },
      {
        en: 'Best Friend',
        id: 'Sahabat',
        emoji: '🤝',
        example: { en: 'My best friend saves a seat for me.', id: 'Sahabatku menyisakan kursi untukku.', emoji: '💺' },
        question: {
          en: 'What does her best friend save?',
          id: 'Apa yang disisakan sahabatnya?',
          options: [
            { emoji: '💺', text: 'A Seat', ok: true },
            { emoji: '🍪', text: 'A Cookie', ok: false },
            { emoji: '🧸', text: 'A Toy', ok: false },
            { emoji: '📖', text: 'A Book', ok: false },
          ],
        },
      },
      {
        en: 'Twin',
        id: 'Anak Kembar',
        emoji: '👯',
        example: { en: 'My twin wears the same shirt as me.', id: 'Kembaranku memakai baju yang sama denganku.', emoji: '👕' },
        question: {
          en: 'What does her twin wear?',
          id: 'Apa yang dipakai kembarannya?',
          options: [
            { emoji: '👕', text: 'The Same Shirt', ok: true },
            { emoji: '🧢', text: 'A Different Hat', ok: false },
            { emoji: '🎭', text: 'A Costume', ok: false },
            { emoji: '👔', text: 'A Uniform', ok: false },
          ],
        },
      },
    ],
  },
  {
    id: 'pemandangan-alam',
    title: 'Pemandangan Alam (Nature Scenery)',
    desc: '10 kalimat',
    items: [
      {
        en: 'Sun',
        id: 'Matahari',
        emoji: '☀️',
        example: { en: 'The sun warms the earth.', id: 'Matahari menghangatkan bumi.', emoji: '🌍' },
        question: {
          en: 'What does the sun do?',
          id: 'Apa yang dilakukan matahari?',
          options: [
            { emoji: '🌍', text: 'Warms the Earth', ok: true },
            { emoji: '❄️', text: 'Cools the Earth', ok: false },
            { emoji: '💧', text: 'Waters the Earth', ok: false },
            { emoji: '🌪️', text: 'Shakes the Earth', ok: false },
          ],
        },
      },
      {
        en: 'Moon',
        id: 'Bulan',
        emoji: '🌙',
        example: { en: 'The moon shines at night.', id: 'Bulan bersinar di malam hari.', emoji: '🌙' },
        question: {
          en: 'When does the moon shine?',
          id: 'Kapan bulan bersinar?',
          options: [
            { emoji: '🌙', text: 'At Night', ok: true },
            { emoji: '☀️', text: 'At Noon', ok: false },
            { emoji: '🌅', text: 'In the Morning', ok: false },
            { emoji: '🏫', text: 'At School', ok: false },
          ],
        },
      },
      {
        en: 'Sky',
        id: 'Langit',
        emoji: '🌤️',
        example: { en: 'Birds fly across the sky.', id: 'Burung terbang melintasi langit.', emoji: '🐦' },
        question: {
          en: 'What flies across the sky?',
          id: 'Apa yang terbang melintasi langit?',
          options: [
            { emoji: '🐦', text: 'Birds', ok: true },
            { emoji: '🐟', text: 'Fish', ok: false },
            { emoji: '🐸', text: 'Frogs', ok: false },
            { emoji: '🐢', text: 'Turtles', ok: false },
          ],
        },
      },
      {
        en: 'Cloud',
        id: 'Awan',
        emoji: '☁️',
        example: { en: 'The cloud covers the sun.', id: 'Awan menutupi matahari.', emoji: '☁️' },
        question: {
          en: 'What does the cloud cover?',
          id: 'Apa yang ditutupi awan?',
          options: [
            { emoji: '☀️', text: 'The Sun', ok: true },
            { emoji: '🌙', text: 'The Moon', ok: false },
            { emoji: '🌳', text: 'The Tree', ok: false },
            { emoji: '🌊', text: 'The River', ok: false },
          ],
        },
      },
      {
        en: 'Tree',
        id: 'Pohon',
        emoji: '🌳',
        example: { en: 'The bird builds a nest in the tree.', id: 'Burung membuat sarang di pohon.', emoji: '🪹' },
        question: {
          en: 'Where does the bird build a nest?',
          id: 'Di mana burung membuat sarang?',
          options: [
            { emoji: '🌳', text: 'The Tree', ok: true },
            { emoji: '🌿', text: 'The Grass', ok: false },
            { emoji: '🌊', text: 'The River', ok: false },
            { emoji: '🌤️', text: 'The Sky', ok: false },
          ],
        },
      },
      {
        en: 'Flower',
        id: 'Bunga',
        emoji: '🌸',
        example: { en: 'The bee lands on the flower.', id: 'Lebah hinggap di bunga.', emoji: '🐝' },
        question: {
          en: 'Where does the bee land?',
          id: 'Di mana lebah hinggap?',
          options: [
            { emoji: '🌸', text: 'The Flower', ok: true },
            { emoji: '🌳', text: 'The Tree', ok: false },
            { emoji: '🪨', text: 'The Stone', ok: false },
            { emoji: '☁️', text: 'The Cloud', ok: false },
          ],
        },
      },
      {
        en: 'Grass',
        id: 'Rumput',
        emoji: '🌿',
        example: { en: 'We sit on the soft grass.', id: 'Kami duduk di rumput yang lembut.', emoji: '🧺' },
        question: {
          en: 'What do we sit on?',
          id: 'Kami duduk di atas apa?',
          options: [
            { emoji: '🌿', text: 'The Grass', ok: true },
            { emoji: '🪨', text: 'The Stone', ok: false },
            { emoji: '🌊', text: 'The River', ok: false },
            { emoji: '🏖️', text: 'The Sand', ok: false },
          ],
        },
      },
      {
        en: 'River',
        id: 'Sungai',
        emoji: '🌊',
        example: { en: 'Fish swim in the river.', id: 'Ikan berenang di sungai.', emoji: '🐟' },
        question: {
          en: 'Where do fish swim?',
          id: 'Di mana ikan berenang?',
          options: [
            { emoji: '🌊', text: 'The River', ok: true },
            { emoji: '🌤️', text: 'The Sky', ok: false },
            { emoji: '🌳', text: 'The Tree', ok: false },
            { emoji: '🌿', text: 'The Grass', ok: false },
          ],
        },
      },
      {
        en: 'Stone',
        id: 'Batu',
        emoji: '🪨',
        example: { en: 'I skip a stone across the water.', id: 'Aku melempar batu memantul di air.', emoji: '💦' },
        question: {
          en: 'What does she skip across the water?',
          id: 'Apa yang dia lempar memantul di air?',
          options: [
            { emoji: '🪨', text: 'A Stone', ok: true },
            { emoji: '🌸', text: 'A Flower', ok: false },
            { emoji: '🍃', text: 'A Leaf', ok: false },
            { emoji: '⭐', text: 'A Star', ok: false },
          ],
        },
      },
      {
        en: 'Stars',
        id: 'Bintang-bintang',
        emoji: '⭐',
        example: { en: 'I count the stars in the sky.', id: 'Aku menghitung bintang di langit.', emoji: '⭐' },
        question: {
          en: 'What does she count?',
          id: 'Apa yang dia hitung?',
          options: [
            { emoji: '⭐', text: 'The Stars', ok: true },
            { emoji: '☁️', text: 'The Clouds', ok: false },
            { emoji: '🌳', text: 'The Trees', ok: false },
            { emoji: '🌸', text: 'The Flowers', ok: false },
          ],
        },
      },
    ],
  },
  {
    id: 'hobi-seru',
    title: 'Hobi Seru (Fun Hobbies)',
    desc: '10 kalimat',
    items: [
      {
        en: 'Drawing',
        id: 'Menggambar',
        emoji: '🎨',
        example: { en: 'I like drawing animals.', id: 'Aku suka menggambar hewan.', emoji: '🐾' },
        question: {
          en: 'What does she like drawing?',
          id: 'Apa yang suka dia gambar?',
          options: [
            { emoji: '🐾', text: 'Animals', ok: true },
            { emoji: '🚗', text: 'Cars', ok: false },
            { emoji: '🏠', text: 'Houses', ok: false },
            { emoji: '🍎', text: 'Food', ok: false },
          ],
        },
      },
      {
        en: 'Singing',
        id: 'Bernyanyi',
        emoji: '🎤',
        example: { en: 'I like singing in the choir.', id: 'Aku suka bernyanyi di paduan suara.', emoji: '🎤' },
        question: {
          en: 'Where does she like singing?',
          id: 'Di mana dia suka bernyanyi?',
          options: [
            { emoji: '🎤', text: 'The Choir', ok: true },
            { emoji: '🍳', text: 'The Kitchen', ok: false },
            { emoji: '🏫', text: 'The Classroom', ok: false },
            { emoji: '🌻', text: 'The Garden', ok: false },
          ],
        },
      },
      {
        en: 'Reading',
        id: 'Membaca',
        emoji: '📖',
        example: { en: 'I like reading storybooks.', id: 'Aku suka membaca buku cerita.', emoji: '📖' },
        question: {
          en: 'What does she like reading?',
          id: 'Apa yang suka dia baca?',
          options: [
            { emoji: '📖', text: 'Storybooks', ok: true },
            { emoji: '📰', text: 'Newspapers', ok: false },
            { emoji: '✉️', text: 'Letters', ok: false },
            { emoji: '🗺️', text: 'Maps', ok: false },
          ],
        },
      },
      {
        en: 'Painting',
        id: 'Melukis',
        emoji: '🖌️',
        example: { en: 'I like painting with my dad.', id: 'Aku suka melukis bersama ayahku.', emoji: '👨' },
        question: {
          en: 'Who does she paint with?',
          id: 'Dengan siapa dia melukis?',
          options: [
            { emoji: '👨', text: 'Her Dad', ok: true },
            { emoji: '👩', text: 'Her Mom', ok: false },
            { emoji: '🧑‍🏫', text: 'Her Teacher', ok: false },
            { emoji: '🧑‍🤝‍🧑', text: 'Her Friend', ok: false },
          ],
        },
      },
      {
        en: 'Cooking',
        id: 'Memasak',
        emoji: '🍳',
        example: { en: 'I like cooking pasta with mom.', id: 'Aku suka memasak pasta bersama ibu.', emoji: '🍝' },
        question: {
          en: 'What does she like cooking?',
          id: 'Apa yang suka dia masak?',
          options: [
            { emoji: '🍝', text: 'Pasta', ok: true },
            { emoji: '🍚', text: 'Rice', ok: false },
            { emoji: '🍲', text: 'Soup', ok: false },
            { emoji: '🍞', text: 'Bread', ok: false },
          ],
        },
      },
      {
        en: 'Camping',
        id: 'Berkemah',
        emoji: '⛺',
        example: { en: 'I like camping by the lake.', id: 'Aku suka berkemah di dekat danau.', emoji: '🏕️' },
        question: {
          en: 'Where does she like camping?',
          id: 'Di mana dia suka berkemah?',
          options: [
            { emoji: '🏕️', text: 'The Lake', ok: true },
            { emoji: '🏖️', text: 'The Beach', ok: false },
            { emoji: '⛰️', text: 'The Mountain', ok: false },
            { emoji: '🌲', text: 'The Forest', ok: false },
          ],
        },
      },
      {
        en: 'Fishing',
        id: 'Memancing',
        emoji: '🎣',
        example: { en: 'I like fishing with my grandpa.', id: 'Aku suka memancing bersama kakekku.', emoji: '👴' },
        question: {
          en: 'Who does she fish with?',
          id: 'Dengan siapa dia memancing?',
          options: [
            { emoji: '👴', text: 'Her Grandpa', ok: true },
            { emoji: '👵', text: 'Her Grandma', ok: false },
            { emoji: '🧔', text: 'Her Uncle', ok: false },
            { emoji: '🧑‍🤝‍🧑', text: 'Her Friend', ok: false },
          ],
        },
      },
      {
        en: 'Gardening',
        id: 'Berkebun',
        emoji: '🌱',
        example: { en: 'I like gardening in the morning.', id: 'Aku suka berkebun di pagi hari.', emoji: '🌅' },
        question: {
          en: 'When does she like gardening?',
          id: 'Kapan dia suka berkebun?',
          options: [
            { emoji: '🌅', text: 'Morning', ok: true },
            { emoji: '🌙', text: 'Night', ok: false },
            { emoji: '☀️', text: 'Noon', ok: false },
            { emoji: '🛝', text: 'Recess', ok: false },
          ],
        },
      },
      {
        en: 'Collecting',
        id: 'Mengoleksi',
        emoji: '🪙',
        example: { en: 'I like collecting seashells at the beach.', id: 'Aku suka mengoleksi kerang di pantai.', emoji: '🐚' },
        question: {
          en: 'What does she like collecting?',
          id: 'Apa yang suka dia koleksi?',
          options: [
            { emoji: '🐚', text: 'Seashells', ok: true },
            { emoji: '🪙', text: 'Coins', ok: false },
            { emoji: '⭐', text: 'Stickers', ok: false },
            { emoji: '🪨', text: 'Rocks', ok: false },
          ],
        },
      },
      {
        en: 'Building',
        id: 'Membangun',
        emoji: '🧱',
        example: { en: 'I like building towers with blocks.', id: 'Aku suka membangun menara dari balok.', emoji: '🧱' },
        question: {
          en: 'What does she build with blocks?',
          id: 'Apa yang dia bangun dari balok?',
          options: [
            { emoji: '🧱', text: 'Towers', ok: true },
            { emoji: '🌉', text: 'Bridges', ok: false },
            { emoji: '🏠', text: 'Houses', ok: false },
            { emoji: '🚗', text: 'Cars', ok: false },
          ],
        },
      },
    ],
  },
];

/**
 * Listening Achiever — level PERTAMA yang pakai format KETIGA
 * `ListeningNoteTopic` (types.ts) — permintaan riset user: Cambridge A2
 * Flyers (backbone struktural Achiever) py Listening Part 2 resmi "note
 * completion", dianggap terlalu penting sbg pembeda level ini utk sekadar
 * genapkan format lama/dikte spt Explorer/Adventurer. Riset & rasional
 * lengkap: `materi/listening.md` §3E/§4E. Kenalan & Latihan Inti (`items`)
 * identik strukturnya dgn Little Stars/Starter — yang BARU murni Tantangan
 * (`noteHeading`/`notePassage`/`noteGaps`, dirender `runTantanganNote`,
 * `games/listening.ts`). 10 topik dipetakan 1:1 ke SELURUH 10 topik
 * `VOCAB_TOPICS_ACHIEVER` (kosakata sudah dikenal anak dari Vocab, dilatih
 * ulang lewat modalitas dengar — prinsip sama Little Stars/Starter/Explorer/
 * Adventurer). `notePassage` tiap topik SENGAJA memakai beberapa kata kunci
 * topik itu dalam 1 narasi pendek yang nyambung (bukan potongan lepas) —
 * `noteGaps` 3–4 per topik, jawabannya SELALU bisa ditelusuri langsung dari
 * `notePassage` (prinsip yang sama dgn Cambridge Movers/Flyers Part 2 asli).
 */
export const LISTENING_TOPICS_ACHIEVER: ListeningNoteTopic[] = [
  {
    id: 'siapa-dia',
    title: 'Siapa Dia? (Who Is He/She?)',
    desc: '10 kalimat + 1 catatan',
    items: [
      {
        en: 'Tall',
        id: 'Tinggi',
        emoji: '🦒',
        example: { en: 'My uncle is very tall.', id: 'Pamanku sangat tinggi.', emoji: '👴' },
        question: {
          en: 'What is her uncle like?',
          id: 'Bagaimana pamannya?',
          options: [
            { emoji: '🦒', text: 'Very Tall', ok: true },
            { emoji: '🧍', text: 'Very Short', ok: false },
            { emoji: '👶', text: 'Very Young', ok: false },
            { emoji: '📅', text: 'Very Old', ok: false },
          ],
        },
      },
      {
        en: 'Beautiful',
        id: 'Cantik',
        emoji: '😍',
        example: { en: 'The princess in the story is beautiful.', id: 'Sang putri dalam cerita itu cantik.', emoji: '👸' },
        question: {
          en: 'What is the princess like?',
          id: 'Bagaimana sang putri?',
          options: [
            { emoji: '😍', text: 'Beautiful', ok: true },
            { emoji: '📅', text: 'Old', ok: false },
            { emoji: '💪', text: 'Strong', ok: false },
            { emoji: '🧍', text: 'Slim', ok: false },
          ],
        },
      },
      {
        en: 'Handsome',
        id: 'Tampan',
        emoji: '😎',
        example: { en: 'The actor looks handsome.', id: 'Aktor itu terlihat tampan.', emoji: '🎬' },
        question: {
          en: 'How does the actor look?',
          id: 'Bagaimana penampilan aktor itu?',
          options: [
            { emoji: '😎', text: 'Handsome', ok: true },
            { emoji: '👶', text: 'Young', ok: false },
            { emoji: '🦒', text: 'Tall', ok: false },
            { emoji: '🥰', text: 'Cute', ok: false },
          ],
        },
      },
      {
        en: 'Young',
        id: 'Muda',
        emoji: '👶',
        example: { en: 'My little cousin is young.', id: 'Sepupu kecilku masih muda.', emoji: '🧒' },
        question: {
          en: 'What is her cousin like?',
          id: 'Bagaimana sepupunya?',
          options: [
            { emoji: '👶', text: 'Young', ok: true },
            { emoji: '📅', text: 'Old', ok: false },
            { emoji: '💪', text: 'Strong', ok: false },
            { emoji: '🧍', text: 'Slim', ok: false },
          ],
        },
      },
      {
        en: 'Old',
        id: 'Tua',
        emoji: '👴',
        example: { en: 'The library book is very old.', id: 'Buku perpustakaan itu sangat tua.', emoji: '📕' },
        question: {
          en: 'How old is the book?',
          id: 'Seberapa tua bukunya?',
          options: [
            { emoji: '📕', text: 'Very Old', ok: true },
            { emoji: '✨', text: 'Very New', ok: false },
            { emoji: '🐭', text: 'Very Small', ok: false },
            { emoji: '🐘', text: 'Very Big', ok: false },
          ],
        },
      },
      {
        en: 'Curly Hair',
        id: 'Rambut Keriting',
        emoji: '🦱',
        example: { en: 'My sister has curly hair.', id: 'Kakak perempuanku punya rambut keriting.', emoji: '👧' },
        question: {
          en: "What kind of hair does her sister have?",
          id: 'Rambut kakak perempuannya seperti apa?',
          options: [
            { emoji: '🦱', text: 'Curly', ok: true },
            { emoji: '💇', text: 'Straight', ok: false },
            { emoji: '✂️', text: 'Short', ok: false },
            { emoji: '📏', text: 'Long', ok: false },
          ],
        },
      },
      {
        en: 'Straight Hair',
        id: 'Rambut Lurus',
        emoji: '💇',
        example: { en: 'My brother has straight hair.', id: 'Kakak laki-lakiku punya rambut lurus.', emoji: '👦' },
        question: {
          en: "What kind of hair does her brother have?",
          id: 'Rambut kakak laki-lakinya seperti apa?',
          options: [
            { emoji: '💇', text: 'Straight', ok: true },
            { emoji: '🦱', text: 'Curly', ok: false },
            { emoji: '✂️', text: 'Short', ok: false },
            { emoji: '📏', text: 'Long', ok: false },
          ],
        },
      },
      {
        en: 'Slim',
        id: 'Langsing',
        emoji: '🧍',
        example: { en: 'The dancer is slim.', id: 'Penari itu langsing.', emoji: '💃' },
        question: {
          en: 'What is the dancer like?',
          id: 'Bagaimana penari itu?',
          options: [
            { emoji: '🧍', text: 'Slim', ok: true },
            { emoji: '💪', text: 'Strong', ok: false },
            { emoji: '📅', text: 'Old', ok: false },
            { emoji: '👶', text: 'Young', ok: false },
          ],
        },
      },
      {
        en: 'Strong',
        id: 'Kuat',
        emoji: '💪',
        example: { en: 'The wrestler is very strong.', id: 'Pegulat itu sangat kuat.', emoji: '🤼' },
        question: {
          en: 'What is the wrestler like?',
          id: 'Bagaimana pegulat itu?',
          options: [
            { emoji: '💪', text: 'Very Strong', ok: true },
            { emoji: '🧍', text: 'Very Slim', ok: false },
            { emoji: '📅', text: 'Very Old', ok: false },
            { emoji: '👶', text: 'Very Young', ok: false },
          ],
        },
      },
      {
        en: 'Cute',
        id: 'Lucu',
        emoji: '🥰',
        example: { en: 'The kitten looks cute.', id: 'Anak kucing itu terlihat lucu.', emoji: '🐱' },
        question: {
          en: 'How does the kitten look?',
          id: 'Bagaimana penampilan anak kucing itu?',
          options: [
            { emoji: '🥰', text: 'Cute', ok: true },
            { emoji: '📅', text: 'Old', ok: false },
            { emoji: '💪', text: 'Strong', ok: false },
            { emoji: '🦒', text: 'Tall', ok: false },
          ],
        },
      },
    ],
    noteHeading: '📝 Catatan Perkenalan Teman Baru',
    notePassage: [
      { en: 'This is Rani, a new student.', id: 'Ini Rani, murid baru.' },
      { en: 'She is tall and has curly hair.', id: 'Dia tinggi dan punya rambut keriting.' },
      { en: 'She is twelve years old.', id: 'Usianya dua belas tahun.' },
      { en: 'Everyone thinks she is very friendly.', id: 'Semua orang pikir dia sangat ramah.' },
    ],
    noteGaps: [
      {
        label: 'Nama',
        emoji: '🧑',
        question: "What is the new student's name?",
        questionId: 'Siapa nama murid baru itu?',
        options: ['Rani', 'Sari', 'Dina'],
        answer: 'Rani',
      },
      {
        label: 'Tinggi Badan',
        emoji: '📏',
        question: 'Is Rani tall or short?',
        questionId: 'Rani tinggi atau pendek?',
        options: ['Tall', 'Short', 'Slim'],
        answer: 'Tall',
      },
      {
        label: 'Jenis Rambut',
        emoji: '💇',
        question: 'What kind of hair does Rani have?',
        questionId: 'Rambut Rani seperti apa?',
        options: ['Curly', 'Straight', 'Short'],
        answer: 'Curly',
      },
      {
        label: 'Usia',
        emoji: '🎂',
        question: 'How old is Rani?',
        questionId: 'Berapa usia Rani?',
        options: ['Twelve', 'Ten', 'Eleven'],
        answer: 'Twelve',
      },
    ],
  },
  {
    id: 'jalan-jalan-kota',
    title: 'Jalan-jalan di Kota (A Walk in Town)',
    desc: '10 kalimat + 1 catatan',
    items: [
      {
        en: 'Bank',
        id: 'Bank',
        emoji: '🏦',
        example: { en: 'I save my money at the bank.', id: 'Aku menabung uangku di bank.', emoji: '🏦' },
        question: {
          en: 'Where does she save money?',
          id: 'Di mana dia menabung?',
          options: [
            { emoji: '🏦', text: 'The Bank', ok: true },
            { emoji: '📮', text: 'The Post Office', ok: false },
            { emoji: '🏛️', text: 'The Museum', ok: false },
            { emoji: '✈️', text: 'The Airport', ok: false },
          ],
        },
      },
      {
        en: 'Post Office',
        id: 'Kantor Pos',
        emoji: '📮',
        example: { en: 'I send a letter at the post office.', id: 'Aku mengirim surat di kantor pos.', emoji: '✉️' },
        question: {
          en: 'Where does she send a letter?',
          id: 'Di mana dia mengirim surat?',
          options: [
            { emoji: '📮', text: 'The Post Office', ok: true },
            { emoji: '🏦', text: 'The Bank', ok: false },
            { emoji: '🎬', text: 'The Cinema', ok: false },
            { emoji: '🥖', text: 'The Bakery', ok: false },
          ],
        },
      },
      {
        en: 'Police Station',
        id: 'Kantor Polisi',
        emoji: '🚓',
        example: { en: 'The police station keeps the town safe.', id: 'Kantor polisi menjaga keamanan kota.', emoji: '🚓' },
        question: {
          en: 'What keeps the town safe?',
          id: 'Apa yang menjaga keamanan kota?',
          options: [
            { emoji: '🚓', text: 'The Police Station', ok: true },
            { emoji: '🏛️', text: 'The Museum', ok: false },
            { emoji: '🏟️', text: 'The Stadium', ok: false },
            { emoji: '🏬', text: 'The Supermarket', ok: false },
          ],
        },
      },
      {
        en: 'Restaurant',
        id: 'Restoran',
        emoji: '🍽️',
        example: { en: 'We eat pizza at the restaurant.', id: 'Kami makan pizza di restoran.', emoji: '🍕' },
        question: {
          en: 'What do we eat at the restaurant?',
          id: 'Kami makan apa di restoran?',
          options: [
            { emoji: '🍕', text: 'Pizza', ok: true },
            { emoji: '🍞', text: 'Bread', ok: false },
            { emoji: '🍚', text: 'Rice', ok: false },
            { emoji: '🍜', text: 'Noodles', ok: false },
          ],
        },
      },
      {
        en: 'Cinema',
        id: 'Bioskop',
        emoji: '🎬',
        example: { en: 'I watch a new movie at the cinema.', id: 'Aku menonton film baru di bioskop.', emoji: '🎬' },
        question: {
          en: 'Where does she watch a movie?',
          id: 'Di mana dia menonton film?',
          options: [
            { emoji: '🎬', text: 'The Cinema', ok: true },
            { emoji: '🏛️', text: 'The Museum', ok: false },
            { emoji: '🏟️', text: 'The Stadium', ok: false },
            { emoji: '🏦', text: 'The Bank', ok: false },
          ],
        },
      },
      {
        en: 'Museum',
        id: 'Museum',
        emoji: '🏛️',
        example: { en: 'We see old paintings at the museum.', id: 'Kami melihat lukisan tua di museum.', emoji: '🖼️' },
        question: {
          en: 'What do we see at the museum?',
          id: 'Apa yang kami lihat di museum?',
          options: [
            { emoji: '🖼️', text: 'Old Paintings', ok: true },
            { emoji: '🎬', text: 'New Movies', ok: false },
            { emoji: '⚽', text: 'Sports Games', ok: false },
            { emoji: '🍞', text: 'Fresh Bread', ok: false },
          ],
        },
      },
      {
        en: 'Stadium',
        id: 'Stadion',
        emoji: '🏟️',
        example: { en: 'We watch the football game at the stadium.', id: 'Kami menonton pertandingan sepak bola di stadion.', emoji: '⚽' },
        question: {
          en: 'Where do we watch the game?',
          id: 'Di mana kami menonton pertandingan?',
          options: [
            { emoji: '🏟️', text: 'The Stadium', ok: true },
            { emoji: '🎬', text: 'The Cinema', ok: false },
            { emoji: '🏛️', text: 'The Museum', ok: false },
            { emoji: '🏦', text: 'The Bank', ok: false },
          ],
        },
      },
      {
        en: 'Supermarket',
        id: 'Supermarket',
        emoji: '🏬',
        example: { en: 'Mom buys vegetables at the supermarket.', id: 'Ibu membeli sayur di supermarket.', emoji: '🥦' },
        question: {
          en: 'What does mom buy?',
          id: 'Ibu membeli apa?',
          options: [
            { emoji: '🥦', text: 'Vegetables', ok: true },
            { emoji: '✉️', text: 'Letters', ok: false },
            { emoji: '🖼️', text: 'Paintings', ok: false },
            { emoji: '🎟️', text: 'Tickets', ok: false },
          ],
        },
      },
      {
        en: 'Airport',
        id: 'Bandara',
        emoji: '✈️',
        example: { en: 'We fly to Bali from the airport.', id: 'Kami terbang ke Bali dari bandara.', emoji: '✈️' },
        question: {
          en: 'Where do we fly from?',
          id: 'Kami terbang dari mana?',
          options: [
            { emoji: '✈️', text: 'The Airport', ok: true },
            { emoji: '🚉', text: 'The Station', ok: false },
            { emoji: '⚓', text: 'The Port', ok: false },
            { emoji: '🏟️', text: 'The Stadium', ok: false },
          ],
        },
      },
      {
        en: 'Bakery',
        id: 'Toko Roti',
        emoji: '🥖',
        example: { en: 'I smell fresh bread at the bakery.', id: 'Aku mencium roti segar di toko roti.', emoji: '🍞' },
        question: {
          en: 'What does she smell?',
          id: 'Dia mencium bau apa?',
          options: [
            { emoji: '🍞', text: 'Fresh Bread', ok: true },
            { emoji: '🌸', text: 'Fresh Flowers', ok: false },
            { emoji: '🎨', text: 'Fresh Paint', ok: false },
            { emoji: '🍎', text: 'Fresh Fruit', ok: false },
          ],
        },
      },
    ],
    noteHeading: '📝 Catatan Jalan-jalan Akhir Pekan',
    notePassage: [
      { en: 'Dito goes to town with his dad on Saturday.', id: 'Dito pergi ke kota bersama ayahnya hari Sabtu.' },
      { en: 'First they visit the bakery to buy bread.', id: 'Pertama mereka mengunjungi toko roti untuk membeli roti.' },
      { en: 'Then they watch a movie at the cinema.', id: 'Lalu mereka menonton film di bioskop.' },
      { en: 'After that, they eat dinner at a restaurant.', id: 'Setelah itu, mereka makan malam di restoran.' },
    ],
    noteGaps: [
      {
        label: 'Hari',
        emoji: '📅',
        question: 'What day do they go to town?',
        questionId: 'Hari apa mereka pergi ke kota?',
        options: ['Saturday', 'Sunday', 'Monday'],
        answer: 'Saturday',
      },
      {
        label: 'Tempat Pertama',
        emoji: '🥖',
        question: 'Where do they go first?',
        questionId: 'Ke mana mereka pergi pertama?',
        options: ['The Bakery', 'The Cinema', 'The Restaurant'],
        answer: 'The Bakery',
      },
      {
        label: 'Tempat Kedua',
        emoji: '🎬',
        question: 'Where do they watch a movie?',
        questionId: 'Di mana mereka nonton film?',
        options: ['The Cinema', 'The Museum', 'The Stadium'],
        answer: 'The Cinema',
      },
      {
        label: 'Tempat Makan',
        emoji: '🍽️',
        question: 'Where do they eat dinner?',
        questionId: 'Di mana mereka makan malam?',
        options: ['The Restaurant', 'The Bakery', 'The Supermarket'],
        answer: 'The Restaurant',
      },
    ],
  },
  {
    id: 'cari-jalan',
    title: 'Cari Jalan (Finding the Way)',
    desc: '10 kalimat + 1 catatan',
    items: [
      {
        en: 'Left',
        id: 'Kiri',
        emoji: '⬅️',
        example: { en: 'Turn left at the bakery.', id: 'Belok kiri di toko roti.', emoji: '⬅️' },
        question: {
          en: 'Which way do we turn?',
          id: 'Kami belok ke arah mana?',
          options: [
            { emoji: '⬅️', text: 'Left', ok: true },
            { emoji: '➡️', text: 'Right', ok: false },
            { emoji: '⬆️', text: 'Straight', ok: false },
            { emoji: '🔄', text: 'Back', ok: false },
          ],
        },
      },
      {
        en: 'Right',
        id: 'Kanan',
        emoji: '➡️',
        example: { en: 'Turn right at the bank.', id: 'Belok kanan di bank.', emoji: '➡️' },
        question: {
          en: 'Which way do we turn?',
          id: 'Kami belok ke arah mana?',
          options: [
            { emoji: '➡️', text: 'Right', ok: true },
            { emoji: '⬅️', text: 'Left', ok: false },
            { emoji: '⬆️', text: 'Straight', ok: false },
            { emoji: '🔄', text: 'Back', ok: false },
          ],
        },
      },
      {
        en: 'Straight',
        id: 'Lurus',
        emoji: '⬆️',
        example: { en: 'Go straight past the school.', id: 'Jalan terus lurus melewati sekolah.', emoji: '🏫' },
        question: {
          en: 'How do we go past the school?',
          id: 'Bagaimana kami melewati sekolah?',
          options: [
            { emoji: '⬆️', text: 'Straight', ok: true },
            { emoji: '⬅️', text: 'Left', ok: false },
            { emoji: '➡️', text: 'Right', ok: false },
            { emoji: '🔄', text: 'Backward', ok: false },
          ],
        },
      },
      {
        en: 'Near',
        id: 'Dekat',
        emoji: '📍',
        example: { en: 'The park is near my house.', id: 'Tamannya dekat rumahku.', emoji: '🏞️' },
        question: {
          en: 'How far is the park?',
          id: 'Seberapa jauh tamannya?',
          options: [
            { emoji: '📍', text: 'Near', ok: true },
            { emoji: '🛣️', text: 'Far', ok: false },
            { emoji: '↔️', text: 'Between', ok: false },
            { emoji: '👈', text: 'Behind', ok: false },
          ],
        },
      },
      {
        en: 'Far',
        id: 'Jauh',
        emoji: '🛣️',
        example: { en: 'The zoo is far from here.', id: 'Kebun binatangnya jauh dari sini.', emoji: '🦓' },
        question: {
          en: 'How far is the zoo?',
          id: 'Seberapa jauh kebun binatangnya?',
          options: [
            { emoji: '🛣️', text: 'Far', ok: true },
            { emoji: '📍', text: 'Near', ok: false },
            { emoji: '↔️', text: 'Between', ok: false },
            { emoji: '👉', text: 'In Front', ok: false },
          ],
        },
      },
      {
        en: 'Turn',
        id: 'Belok',
        emoji: '🔄',
        example: { en: 'You turn at the second corner.', id: 'Kamu belok di sudut kedua.', emoji: '📐' },
        question: {
          en: 'Where do you turn?',
          id: 'Di mana kamu belok?',
          options: [
            { emoji: '📐', text: 'The Second Corner', ok: true },
            { emoji: '1️⃣', text: 'The First Corner', ok: false },
            { emoji: '🏦', text: 'The Bank', ok: false },
            { emoji: '🏞️', text: 'The Park', ok: false },
          ],
        },
      },
      {
        en: 'Corner',
        id: 'Sudut',
        emoji: '📐',
        example: { en: 'Wait for me at the corner.', id: 'Tunggu aku di sudut jalan.', emoji: '🧍' },
        question: {
          en: 'Where does she wait?',
          id: 'Di mana dia menunggu?',
          options: [
            { emoji: '📐', text: 'The Corner', ok: true },
            { emoji: '🏦', text: 'The Bank', ok: false },
            { emoji: '🏫', text: 'The School', ok: false },
            { emoji: '🏞️', text: 'The Park', ok: false },
          ],
        },
      },
      {
        en: 'Between',
        id: 'Di Antara',
        emoji: '↔️',
        example: { en: 'The bakery is between the bank and the school.', id: 'Toko roti ada di antara bank dan sekolah.', emoji: '🏦' },
        question: {
          en: 'Where is the bakery?',
          id: 'Di mana toko rotinya?',
          options: [
            { emoji: '🏦', text: 'Between the Bank and the School', ok: true },
            { emoji: '🏞️', text: 'Behind the Park', ok: false },
            { emoji: '🦓', text: 'In Front of the Zoo', ok: false },
            { emoji: '🏟️', text: 'Near the Stadium', ok: false },
          ],
        },
      },
      {
        en: 'In Front Of',
        id: 'Di Depan',
        emoji: '👉',
        example: { en: 'The bus stops in front of the school.', id: 'Bus berhenti di depan sekolah.', emoji: '🚌' },
        question: {
          en: 'Where does the bus stop?',
          id: 'Di mana bus berhenti?',
          options: [
            { emoji: '🚌', text: 'In Front of the School', ok: true },
            { emoji: '🏦', text: 'Behind the Bank', ok: false },
            { emoji: '🦓', text: 'Near the Zoo', ok: false },
            { emoji: '↔️', text: 'Between Two Shops', ok: false },
          ],
        },
      },
      {
        en: 'Behind',
        id: 'Di Belakang',
        emoji: '👈',
        example: { en: 'My house is behind the park.', id: 'Rumahku ada di belakang taman.', emoji: '🏡' },
        question: {
          en: 'Where is her house?',
          id: 'Di mana rumahnya?',
          options: [
            { emoji: '🏡', text: 'Behind the Park', ok: true },
            { emoji: '🏦', text: 'In Front of the Bank', ok: false },
            { emoji: '↔️', text: 'Between Two Shops', ok: false },
            { emoji: '🏫', text: 'Near the School', ok: false },
          ],
        },
      },
    ],
    noteHeading: '📝 Catatan Arah ke Rumah Nenek',
    notePassage: [
      { en: "To get to grandma's house, turn left at the bakery.", id: 'Untuk sampai ke rumah nenek, belok kiri di toko roti.' },
      { en: 'Then go straight for two blocks.', id: 'Lalu jalan terus lurus dua blok.' },
      { en: "Her house is between the school and the park.", id: 'Rumahnya ada di antara sekolah dan taman.' },
    ],
    noteGaps: [
      {
        label: 'Belok',
        emoji: '↩️',
        question: 'Which way do you turn at the bakery?',
        questionId: 'Belok ke mana di toko roti?',
        options: ['Left', 'Right', 'Straight'],
        answer: 'Left',
      },
      {
        label: 'Setelah Belok',
        emoji: '⬆️',
        question: 'What do you do after turning?',
        questionId: 'Apa yang dilakukan setelah belok?',
        options: ['Go Straight', 'Turn Again', 'Stop'],
        answer: 'Go Straight',
      },
      {
        label: 'Lokasi Rumah',
        emoji: '🏠',
        question: "Where is grandma's house?",
        questionId: 'Di mana rumah nenek?',
        options: ['Between the School and the Park', 'Behind the Bakery', 'In Front of the Bank'],
        answer: 'Between the School and the Park',
      },
    ],
  },
  {
    id: 'akhir-pekan-seru',
    title: 'Akhir Pekan Seru (A Fun Weekend)',
    desc: '10 kalimat + 1 catatan',
    items: [
      {
        en: 'Concert',
        id: 'Konser',
        emoji: '🎤',
        example: { en: 'I watch a concert with my sister.', id: 'Aku menonton konser bersama kakak perempuanku.', emoji: '👧' },
        question: {
          en: 'Who does she watch the concert with?',
          id: 'Dengan siapa dia menonton konser?',
          options: [
            { emoji: '👧', text: 'Her Sister', ok: true },
            { emoji: '👦', text: 'Her Brother', ok: false },
            { emoji: '👩', text: 'Her Mom', ok: false },
            { emoji: '🧑‍🤝‍🧑', text: 'Her Friend', ok: false },
          ],
        },
      },
      {
        en: 'Theater',
        id: 'Teater',
        emoji: '🎭',
        example: { en: 'We watch a play at the theater.', id: 'Kami menonton pertunjukan di teater.', emoji: '🎭' },
        question: {
          en: 'What do we watch at the theater?',
          id: 'Kami menonton apa di teater?',
          options: [
            { emoji: '🎭', text: 'A Play', ok: true },
            { emoji: '🎬', text: 'A Movie', ok: false },
            { emoji: '🎤', text: 'A Concert', ok: false },
            { emoji: '🎮', text: 'A Game', ok: false },
          ],
        },
      },
      {
        en: 'Amusement Park',
        id: 'Taman Hiburan',
        emoji: '🎡',
        example: { en: 'I ride the roller coaster at the amusement park.', id: 'Aku naik roller coaster di taman hiburan.', emoji: '🎢' },
        question: {
          en: 'What does she ride?',
          id: 'Dia naik apa?',
          options: [
            { emoji: '🎢', text: 'The Roller Coaster', ok: true },
            { emoji: '🚲', text: 'The Bicycle', ok: false },
            { emoji: '🛹', text: 'The Skateboard', ok: false },
            { emoji: '🚆', text: 'The Train', ok: false },
          ],
        },
      },
      {
        en: 'Board Game',
        id: 'Permainan Papan',
        emoji: '🎲',
        example: { en: 'We play a board game on rainy days.', id: 'Kami main permainan papan saat hari hujan.', emoji: '🌧️' },
        question: {
          en: 'When do we play a board game?',
          id: 'Kapan kami main permainan papan?',
          options: [
            { emoji: '🌧️', text: 'Rainy Days', ok: true },
            { emoji: '☀️', text: 'Sunny Days', ok: false },
            { emoji: '🏫', text: 'School Days', ok: false },
            { emoji: '🎉', text: 'Party Days', ok: false },
          ],
        },
      },
      {
        en: 'Video Game',
        id: 'Gim Video',
        emoji: '🕹️',
        example: { en: 'My brother plays a video game after school.', id: 'Kakak laki-lakiku main gim video sepulang sekolah.', emoji: '🏫' },
        question: {
          en: 'When does he play a video game?',
          id: 'Kapan dia main gim video?',
          options: [
            { emoji: '🏫', text: 'After School', ok: true },
            { emoji: '🌅', text: 'Before School', ok: false },
            { emoji: '📖', text: 'During Class', ok: false },
            { emoji: '🌙', text: 'At Night Only', ok: false },
          ],
        },
      },
      {
        en: 'Chess',
        id: 'Catur',
        emoji: '♟️',
        example: { en: 'I play chess with my grandpa.', id: 'Aku main catur bersama kakekku.', emoji: '👴' },
        question: {
          en: 'Who does she play chess with?',
          id: 'Dengan siapa dia main catur?',
          options: [
            { emoji: '👴', text: 'Her Grandpa', ok: true },
            { emoji: '👵', text: 'Her Grandma', ok: false },
            { emoji: '🧑‍🏫', text: 'Her Teacher', ok: false },
            { emoji: '🧑‍🤝‍🧑', text: 'Her Friend', ok: false },
          ],
        },
      },
      {
        en: 'Skateboard',
        id: 'Papan Seluncur',
        emoji: '🛹',
        example: { en: 'He rides his skateboard at the park.', id: 'Dia main papan seluncur di taman.', emoji: '🏞️' },
        question: {
          en: 'Where does he ride his skateboard?',
          id: 'Di mana dia main papan seluncur?',
          options: [
            { emoji: '🏞️', text: 'The Park', ok: true },
            { emoji: '🏫', text: 'The School', ok: false },
            { emoji: '🏛️', text: 'The Museum', ok: false },
            { emoji: '🏦', text: 'The Bank', ok: false },
          ],
        },
      },
      {
        en: 'Camera',
        id: 'Kamera',
        emoji: '📷',
        example: { en: 'I take photos with my camera.', id: 'Aku memotret dengan kameraku.', emoji: '📷' },
        question: {
          en: 'What does she take photos with?',
          id: 'Dia memotret dengan apa?',
          options: [
            { emoji: '📷', text: 'A Camera', ok: true },
            { emoji: '📱', text: 'A Phone', ok: false },
            { emoji: '📖', text: 'A Book', ok: false },
            { emoji: '✏️', text: 'A Pencil', ok: false },
          ],
        },
      },
      {
        en: 'Comic Book',
        id: 'Buku Komik',
        emoji: '🦸',
        example: { en: 'I read a comic book before bed.', id: 'Aku membaca buku komik sebelum tidur.', emoji: '🛏️' },
        question: {
          en: 'When does she read a comic book?',
          id: 'Kapan dia membaca buku komik?',
          options: [
            { emoji: '🛏️', text: 'Before Bed', ok: true },
            { emoji: '🍽️', text: 'After Lunch', ok: false },
            { emoji: '📖', text: 'During Class', ok: false },
            { emoji: '🏫', text: 'At School', ok: false },
          ],
        },
      },
      {
        en: 'Magazine',
        id: 'Majalah',
        emoji: '📰',
        example: { en: 'My mom reads a magazine on the weekend.', id: 'Ibuku membaca majalah di akhir pekan.', emoji: '📅' },
        question: {
          en: 'When does mom read a magazine?',
          id: 'Kapan ibu membaca majalah?',
          options: [
            { emoji: '📅', text: 'The Weekend', ok: true },
            { emoji: '📆', text: 'Monday', ok: false },
            { emoji: '🏫', text: 'School Days', ok: false },
            { emoji: '🌅', text: 'Morning', ok: false },
          ],
        },
      },
    ],
    noteHeading: '📝 Catatan Rencana Akhir Pekan',
    notePassage: [
      { en: 'This weekend, Bimo wants to go to the amusement park.', id: 'Akhir pekan ini, Bimo mau pergi ke taman hiburan.' },
      { en: 'He will ride the roller coaster with his brother.', id: 'Dia akan naik roller coaster bersama kakak laki-lakinya.' },
      { en: 'After that, they will play chess together.', id: 'Setelah itu, mereka akan main catur bersama.' },
      { en: 'In the evening, Bimo will read his new comic book.', id: 'Di malam hari, Bimo akan membaca buku komik barunya.' },
    ],
    noteGaps: [
      {
        label: 'Tujuan',
        emoji: '🎡',
        question: 'Where does Bimo want to go?',
        questionId: 'Bimo mau pergi ke mana?',
        options: ['The Amusement Park', 'The Theater', 'The Museum'],
        answer: 'The Amusement Park',
      },
      {
        label: 'Naik Bersama',
        emoji: '🎢',
        question: 'Who rides the roller coaster with him?',
        questionId: 'Siapa yang naik roller coaster bersamanya?',
        options: ['His Brother', 'His Sister', 'His Friend'],
        answer: 'His Brother',
      },
      {
        label: 'Setelah Itu',
        emoji: '♟️',
        question: 'What do they play after the ride?',
        questionId: 'Mereka main apa setelah naik wahana?',
        options: ['Chess', 'Video Game', 'Board Game'],
        answer: 'Chess',
      },
      {
        label: 'Malam Hari',
        emoji: '📖',
        question: 'What does Bimo read in the evening?',
        questionId: 'Bimo membaca apa di malam hari?',
        options: ['His Comic Book', 'A Magazine', 'A Newspaper'],
        answer: 'His Comic Book',
      },
    ],
  },
  {
    id: 'di-taman-bermain',
    title: 'Di Taman Bermain (At the Playground)',
    desc: '10 kalimat + 1 catatan',
    items: [
      {
        en: 'Climb',
        id: 'Memanjat',
        emoji: '🧗',
        example: { en: 'I climb the tall slide.', id: 'Aku memanjat perosotan yang tinggi.', emoji: '🛝' },
        question: {
          en: 'What does she climb?',
          id: 'Dia memanjat apa?',
          options: [
            { emoji: '🛝', text: 'The Slide', ok: true },
            { emoji: '🎢', text: 'The Swing', ok: false },
            { emoji: '🧱', text: 'The Fence', ok: false },
            { emoji: '🌳', text: 'The Tree', ok: false },
          ],
        },
      },
      {
        en: 'Catch',
        id: 'Menangkap',
        emoji: '🤲',
        example: { en: 'I catch the ball my friend throws.', id: 'Aku menangkap bola yang dilempar temanku.', emoji: '⚽' },
        question: {
          en: 'What does she catch?',
          id: 'Dia menangkap apa?',
          options: [
            { emoji: '⚽', text: 'The Ball', ok: true },
            { emoji: '🥏', text: 'The Frisbee', ok: false },
            { emoji: '🪁', text: 'The Kite', ok: false },
            { emoji: '🎈', text: 'The Balloon', ok: false },
          ],
        },
      },
      {
        en: 'Throws',
        id: 'Melempar',
        emoji: '🤾',
        example: { en: 'He throws the ball to his friend.', id: 'Dia melempar bola pada temannya.', emoji: '🏐' },
        question: {
          en: 'What does he throw?',
          id: 'Dia melempar apa?',
          options: [
            { emoji: '🏐', text: 'The Ball', ok: true },
            { emoji: '🪨', text: 'The Rock', ok: false },
            { emoji: '🥖', text: 'The Stick', ok: false },
            { emoji: '🎒', text: 'The Bag', ok: false },
          ],
        },
      },
      {
        en: 'Hide',
        id: 'Bersembunyi',
        emoji: '🙈',
        example: { en: 'I hide behind the big tree.', id: 'Aku bersembunyi di belakang pohon besar.', emoji: '🌳' },
        question: {
          en: 'Where does she hide?',
          id: 'Di mana dia bersembunyi?',
          options: [
            { emoji: '🌳', text: 'Behind the Tree', ok: true },
            { emoji: '🛝', text: 'Under the Slide', ok: false },
            { emoji: '📦', text: 'Inside the Box', ok: false },
            { emoji: '🧱', text: 'Behind the Fence', ok: false },
          ],
        },
      },
      {
        en: 'Laugh',
        id: 'Tertawa',
        emoji: '😂',
        example: { en: 'We laugh at the funny clown.', id: 'Kami tertawa melihat badut yang lucu.', emoji: '🤡' },
        question: {
          en: 'What do we laugh at?',
          id: 'Kami tertawa melihat apa?',
          options: [
            { emoji: '🤡', text: 'The Funny Clown', ok: true },
            { emoji: '🎬', text: 'The Sad Movie', ok: false },
            { emoji: '📢', text: 'The Loud Noise', ok: false },
            { emoji: '🐶', text: 'The Big Dog', ok: false },
          ],
        },
      },
      {
        en: 'Cries',
        id: 'Menangis',
        emoji: '😭',
        example: { en: 'The baby cries because he is hungry.', id: 'Bayi itu menangis karena lapar.', emoji: '👶' },
        question: {
          en: 'Why does the baby cry?',
          id: 'Kenapa bayi itu menangis?',
          options: [
            { emoji: '👶', text: 'He Is Hungry', ok: true },
            { emoji: '😊', text: 'He Is Happy', ok: false },
            { emoji: '😴', text: 'He Is Sleepy', ok: false },
            { emoji: '🤩', text: 'He Is Excited', ok: false },
          ],
        },
      },
      {
        en: 'Shout',
        id: 'Berteriak',
        emoji: '📢',
        example: { en: 'I shout for my friend to wait.', id: 'Aku berteriak minta temanku menunggu.', emoji: '🧑‍🤝‍🧑' },
        question: {
          en: 'What does she shout?',
          id: 'Dia berteriak apa?',
          options: [
            { emoji: '🧑‍🤝‍🧑', text: 'For Her Friend to Wait', ok: true },
            { emoji: '🆘', text: 'For Help', ok: false },
            { emoji: '⚽', text: 'For a Ball', ok: false },
            { emoji: '🍦', text: 'For Ice Cream', ok: false },
          ],
        },
      },
      {
        en: 'Whispers',
        id: 'Berbisik',
        emoji: '🤫',
        example: { en: 'She whispers a secret to me.', id: 'Dia berbisik rahasia padaku.', emoji: '🤫' },
        question: {
          en: 'What does she whisper?',
          id: 'Dia berbisik apa?',
          options: [
            { emoji: '🤫', text: 'A Secret', ok: true },
            { emoji: '😂', text: 'A Joke', ok: false },
            { emoji: '🎵', text: 'A Song', ok: false },
            { emoji: '📖', text: 'A Story', ok: false },
          ],
        },
      },
      {
        en: 'Jump',
        id: 'Melompat',
        emoji: '🤸',
        example: { en: 'The kids jump over the puddle.', id: 'Anak-anak melompati genangan air.', emoji: '💧' },
        question: {
          en: 'What do the kids jump over?',
          id: 'Anak-anak melompati apa?',
          options: [
            { emoji: '💧', text: 'The Puddle', ok: true },
            { emoji: '🪨', text: 'The Rock', ok: false },
            { emoji: '🧱', text: 'The Fence', ok: false },
            { emoji: '🛝', text: 'The Slide', ok: false },
          ],
        },
      },
      {
        en: 'Flies',
        id: 'Terbang',
        emoji: '🕊️',
        example: { en: 'The kite flies high in the sky.', id: 'Layangan itu terbang tinggi di langit.', emoji: '🪁' },
        question: {
          en: 'Where does the kite fly?',
          id: 'Layangan itu terbang di mana?',
          options: [
            { emoji: '🪁', text: 'High in the Sky', ok: true },
            { emoji: '⬇️', text: 'Low on the Ground', ok: false },
            { emoji: '🌳', text: 'Into the Tree', ok: false },
            { emoji: '🛝', text: 'Behind the Slide', ok: false },
          ],
        },
      },
    ],
    noteHeading: '📝 Catatan Bermain di Taman',
    notePassage: [
      { en: 'Kiki and her friends play at the playground.', id: 'Kiki dan teman-temannya bermain di taman.' },
      { en: 'She climbs the tall slide first.', id: 'Dia memanjat perosotan tinggi lebih dulu.' },
      { en: 'Then she hides behind the big tree.', id: 'Lalu dia bersembunyi di belakang pohon besar.' },
      { en: 'Her friend shouts her name loudly.', id: 'Temannya berteriak keras memanggil namanya.' },
    ],
    noteGaps: [
      {
        label: 'Nama Anak',
        emoji: '🧑',
        question: 'What is her name?',
        questionId: 'Siapa namanya?',
        options: ['Kiki', 'Rani', 'Dina'],
        answer: 'Kiki',
      },
      {
        label: 'Dipanjat Dulu',
        emoji: '🛝',
        question: 'What does she climb first?',
        questionId: 'Apa yang dia panjat dulu?',
        options: ['The Slide', 'The Tree', 'The Fence'],
        answer: 'The Slide',
      },
      {
        label: 'Sembunyi Di',
        emoji: '🙈',
        question: 'Where does she hide?',
        questionId: 'Di mana dia bersembunyi?',
        options: ['Behind the Tree', 'Under the Slide', 'Inside a Box'],
        answer: 'Behind the Tree',
      },
      {
        label: 'Yang Berteriak',
        emoji: '📢',
        question: 'Who shouts her name?',
        questionId: 'Siapa yang berteriak memanggil namanya?',
        options: ['Her Friend', 'Her Mom', 'Her Teacher'],
        answer: 'Her Friend',
      },
    ],
  },
  {
    id: 'di-lab-komputer',
    title: 'Di Lab Komputer (In the Computer Lab)',
    desc: '10 kalimat + 1 catatan',
    items: [
      {
        en: 'Computer',
        id: 'Komputer',
        emoji: '💻',
        example: { en: 'I use a computer in the lab.', id: 'Aku memakai komputer di lab.', emoji: '💻' },
        question: {
          en: 'Where does she use a computer?',
          id: 'Di mana dia memakai komputer?',
          options: [
            { emoji: '💻', text: 'The Lab', ok: true },
            { emoji: '📚', text: 'The Library', ok: false },
            { emoji: '🍳', text: 'The Kitchen', ok: false },
            { emoji: '🌻', text: 'The Garden', ok: false },
          ],
        },
      },
      {
        en: 'Internet',
        id: 'Internet',
        emoji: '🌐',
        example: { en: 'I search for information on the internet.', id: 'Aku mencari informasi di internet.', emoji: '🌐' },
        question: {
          en: 'What does she search for?',
          id: 'Dia mencari apa?',
          options: [
            { emoji: '🌐', text: 'Information', ok: true },
            { emoji: '🕹️', text: 'Games', ok: false },
            { emoji: '🎬', text: 'Movies', ok: false },
            { emoji: '🎵', text: 'Music', ok: false },
          ],
        },
      },
      {
        en: 'Website',
        id: 'Situs Web',
        emoji: '🔗',
        example: { en: 'I visit a website about animals.', id: 'Aku mengunjungi situs web tentang hewan.', emoji: '🐾' },
        question: {
          en: 'What is the website about?',
          id: 'Situs webnya tentang apa?',
          options: [
            { emoji: '🐾', text: 'Animals', ok: true },
            { emoji: '⚽', text: 'Sports', ok: false },
            { emoji: '🍎', text: 'Food', ok: false },
            { emoji: '🚗', text: 'Cars', ok: false },
          ],
        },
      },
      {
        en: 'Email',
        id: 'Surel',
        emoji: '📧',
        example: { en: 'I send an email to my teacher.', id: 'Aku mengirim surel pada guruku.', emoji: '🧑‍🏫' },
        question: {
          en: 'Who does she send an email to?',
          id: 'Dia mengirim surel pada siapa?',
          options: [
            { emoji: '🧑‍🏫', text: 'Her Teacher', ok: true },
            { emoji: '🧑‍🤝‍🧑', text: 'Her Friend', ok: false },
            { emoji: '👩', text: 'Her Mom', ok: false },
            { emoji: '👧', text: 'Her Sister', ok: false },
          ],
        },
      },
      {
        en: 'Password',
        id: 'Kata Sandi',
        emoji: '🔑',
        example: { en: 'I type my password carefully.', id: 'Aku mengetik kata sandiku dengan hati-hati.', emoji: '🔑' },
        question: {
          en: 'What does she type carefully?',
          id: 'Dia mengetik apa dengan hati-hati?',
          options: [
            { emoji: '🔑', text: 'Her Password', ok: true },
            { emoji: '🧑', text: 'Her Name', ok: false },
            { emoji: '📧', text: 'Her Email', ok: false },
            { emoji: '🏠', text: 'Her Address', ok: false },
          ],
        },
      },
      {
        en: 'Download',
        id: 'Unduh',
        emoji: '⬇️',
        example: { en: 'I download a song to listen to.', id: 'Aku mengunduh lagu untuk didengarkan.', emoji: '🎵' },
        question: {
          en: 'What does she download?',
          id: 'Dia mengunduh apa?',
          options: [
            { emoji: '🎵', text: 'A Song', ok: true },
            { emoji: '📷', text: 'A Photo', ok: false },
            { emoji: '🕹️', text: 'A Game', ok: false },
            { emoji: '🎬', text: 'A Video', ok: false },
          ],
        },
      },
      {
        en: 'Upload',
        id: 'Unggah',
        emoji: '⬆️',
        example: { en: 'I upload my homework file.', id: 'Aku mengunggah berkas PR-ku.', emoji: '📓' },
        question: {
          en: 'What does she upload?',
          id: 'Dia mengunggah apa?',
          options: [
            { emoji: '📓', text: 'Her Homework File', ok: true },
            { emoji: '📷', text: 'Her Photo', ok: false },
            { emoji: '🔑', text: 'Her Password', ok: false },
            { emoji: '📧', text: 'Her Email', ok: false },
          ],
        },
      },
      {
        en: 'Screen',
        id: 'Layar',
        emoji: '🖥️',
        example: { en: 'The screen is very bright.', id: 'Layarnya sangat terang.', emoji: '🖥️' },
        question: {
          en: 'What is very bright?',
          id: 'Apa yang sangat terang?',
          options: [
            { emoji: '🖥️', text: 'The Screen', ok: true },
            { emoji: '⌨️', text: 'The Keyboard', ok: false },
            { emoji: '🖱️', text: 'The Mouse', ok: false },
            { emoji: '🔑', text: 'The Password', ok: false },
          ],
        },
      },
      {
        en: 'Keyboard',
        id: 'Papan Ketik',
        emoji: '⌨️',
        example: { en: 'I type fast on the keyboard.', id: 'Aku mengetik cepat di papan ketik.', emoji: '⌨️' },
        question: {
          en: 'What does she type fast on?',
          id: 'Dia mengetik cepat di apa?',
          options: [
            { emoji: '⌨️', text: 'The Keyboard', ok: true },
            { emoji: '🖱️', text: 'The Mouse', ok: false },
            { emoji: '🖥️', text: 'The Screen', ok: false },
            { emoji: '🔑', text: 'The Password', ok: false },
          ],
        },
      },
      {
        en: 'Mouse',
        id: 'Tetikus',
        emoji: '🖱️',
        example: { en: 'I click the mouse to open the file.', id: 'Aku mengklik tetikus untuk membuka berkas.', emoji: '🖱️' },
        question: {
          en: 'What does she click?',
          id: 'Dia mengklik apa?',
          options: [
            { emoji: '🖱️', text: 'The Mouse', ok: true },
            { emoji: '⌨️', text: 'The Keyboard', ok: false },
            { emoji: '🖥️', text: 'The Screen', ok: false },
            { emoji: '🔑', text: 'The Password', ok: false },
          ],
        },
      },
    ],
    noteHeading: '📝 Catatan Kelas Komputer',
    notePassage: [
      { en: 'Today the class learns to use the computer lab.', id: 'Hari ini kelas belajar memakai lab komputer.' },
      { en: 'First, they type a password to log in.', id: 'Pertama, mereka mengetik kata sandi untuk masuk.' },
      { en: 'Then, they visit a website about space.', id: 'Lalu, mereka mengunjungi situs web tentang luar angkasa.' },
      { en: 'At the end, they upload their homework file.', id: 'Di akhir, mereka mengunggah berkas PR mereka.' },
    ],
    noteGaps: [
      {
        label: 'Langkah Pertama',
        emoji: '🔑',
        question: 'What do they type first?',
        questionId: 'Apa yang mereka ketik pertama?',
        options: ['A Password', 'An Email', 'A Website'],
        answer: 'A Password',
      },
      {
        label: 'Topik Situs Web',
        emoji: '🌐',
        question: 'What is the website about?',
        questionId: 'Situs webnya tentang apa?',
        options: ['Space', 'Animals', 'Sports'],
        answer: 'Space',
      },
      {
        label: 'Langkah Terakhir',
        emoji: '⬆️',
        question: 'What do they do at the end?',
        questionId: 'Apa yang dilakukan di akhir?',
        options: ['Upload Their Homework', 'Download a Song', 'Send an Email'],
        answer: 'Upload Their Homework',
      },
    ],
  },
  {
    id: 'teman-baikku',
    title: 'Teman Baikku (My Best Friend)',
    desc: '10 kalimat + 1 catatan',
    items: [
      {
        en: 'Kind',
        id: 'Baik Hati',
        emoji: '🤗',
        example: { en: 'My best friend is very kind.', id: 'Sahabatku sangat baik hati.', emoji: '🧑‍🤝‍🧑' },
        question: {
          en: 'What is her best friend like?',
          id: 'Bagaimana sahabatnya?',
          options: [
            { emoji: '🤗', text: 'Kind', ok: true },
            { emoji: '🦁', text: 'Brave', ok: false },
            { emoji: '😂', text: 'Funny', ok: false },
            { emoji: '🤝', text: 'Honest', ok: false },
          ],
        },
      },
      {
        en: 'Brave',
        id: 'Berani',
        emoji: '🦁',
        example: { en: 'He is brave when he sees a spider.', id: 'Dia berani saat melihat laba-laba.', emoji: '🕷️' },
        question: {
          en: 'What is he like with a spider?',
          id: 'Bagaimana dia menghadapi laba-laba?',
          options: [
            { emoji: '🦁', text: 'Brave', ok: true },
            { emoji: '😨', text: 'Scared', ok: false },
            { emoji: '😳', text: 'Shy', ok: false },
            { emoji: '😠', text: 'Angry', ok: false },
          ],
        },
      },
      {
        en: 'Honest',
        id: 'Jujur',
        emoji: '🤝',
        example: { en: 'She is honest and never lies.', id: 'Dia jujur dan tidak pernah bohong.', emoji: '🤝' },
        question: {
          en: 'What is she like?',
          id: 'Bagaimana dia?',
          options: [
            { emoji: '🤝', text: 'Honest', ok: true },
            { emoji: '😂', text: 'Funny', ok: false },
            { emoji: '🧠', text: 'Clever', ok: false },
            { emoji: '🙏', text: 'Polite', ok: false },
          ],
        },
      },
      {
        en: 'Funny',
        id: 'Lucu',
        emoji: '😂',
        example: { en: 'My friend tells funny jokes.', id: 'Temanku bercerita lelucon yang lucu.', emoji: '😂' },
        question: {
          en: 'What kind of jokes does her friend tell?',
          id: 'Lelucon seperti apa yang diceritakan temannya?',
          options: [
            { emoji: '😂', text: 'Funny', ok: true },
            { emoji: '😢', text: 'Sad', ok: false },
            { emoji: '😱', text: 'Scary', ok: false },
            { emoji: '😑', text: 'Boring', ok: false },
          ],
        },
      },
      {
        en: 'Clever',
        id: 'Pintar',
        emoji: '🧠',
        example: { en: 'She is clever at solving puzzles.', id: 'Dia pintar memecahkan teka-teki.', emoji: '🧩' },
        question: {
          en: 'What is she clever at?',
          id: 'Dia pintar dalam hal apa?',
          options: [
            { emoji: '🧩', text: 'Solving Puzzles', ok: true },
            { emoji: '⚽', text: 'Playing Sports', ok: false },
            { emoji: '🎤', text: 'Singing Songs', ok: false },
            { emoji: '🎨', text: 'Drawing Pictures', ok: false },
          ],
        },
      },
      {
        en: 'Friendly',
        id: 'Ramah',
        emoji: '😊',
        example: { en: 'The new student is very friendly.', id: 'Murid baru itu sangat ramah.', emoji: '🧑‍🎓' },
        question: {
          en: 'What is the new student like?',
          id: 'Bagaimana murid baru itu?',
          options: [
            { emoji: '😊', text: 'Very Friendly', ok: true },
            { emoji: '😳', text: 'Very Shy', ok: false },
            { emoji: '🤫', text: 'Very Quiet', ok: false },
            { emoji: '😐', text: 'Very Serious', ok: false },
          ],
        },
      },
      {
        en: 'Generous',
        id: 'Dermawan',
        emoji: '🎁',
        example: { en: 'He is generous and shares his snacks.', id: 'Dia dermawan dan berbagi camilannya.', emoji: '🍪' },
        question: {
          en: 'What does he share?',
          id: 'Dia berbagi apa?',
          options: [
            { emoji: '🍪', text: 'His Snacks', ok: true },
            { emoji: '🧸', text: 'His Toys', ok: false },
            { emoji: '📖', text: 'His Books', ok: false },
            { emoji: '💵', text: 'His Money', ok: false },
          ],
        },
      },
      {
        en: 'Patient',
        id: 'Sabar',
        emoji: '⏳',
        example: { en: 'My teacher is patient with us.', id: 'Guruku sabar menghadapi kami.', emoji: '🧑‍🏫' },
        question: {
          en: 'What is her teacher like?',
          id: 'Bagaimana gurunya?',
          options: [
            { emoji: '⏳', text: 'Patient', ok: true },
            { emoji: '😠', text: 'Strict', ok: false },
            { emoji: '🏃', text: 'Busy', ok: false },
            { emoji: '😴', text: 'Tired', ok: false },
          ],
        },
      },
      {
        en: 'Polite',
        id: 'Sopan',
        emoji: '🙏',
        example: { en: 'She is polite and says thank you.', id: 'Dia sopan dan mengucapkan terima kasih.', emoji: '🙏' },
        question: {
          en: 'What does she say?',
          id: 'Dia mengucapkan apa?',
          options: [
            { emoji: '🙏', text: 'Thank You', ok: true },
            { emoji: '😔', text: 'Sorry', ok: false },
            { emoji: '👋', text: 'Goodbye', ok: false },
            { emoji: '🤲', text: 'Please', ok: false },
          ],
        },
      },
      {
        en: 'Confident',
        id: 'Percaya Diri',
        emoji: '💪',
        example: { en: 'He feels confident before the test.', id: 'Dia merasa percaya diri sebelum ujian.', emoji: '📝' },
        question: {
          en: 'How does he feel before the test?',
          id: 'Bagaimana perasaannya sebelum ujian?',
          options: [
            { emoji: '💪', text: 'Confident', ok: true },
            { emoji: '😨', text: 'Scared', ok: false },
            { emoji: '😴', text: 'Tired', ok: false },
            { emoji: '😑', text: 'Bored', ok: false },
          ],
        },
      },
    ],
    noteHeading: '📝 Catatan Tentang Teman Baikku',
    notePassage: [
      { en: 'My best friend is named Fajar.', id: 'Sahabatku bernama Fajar.' },
      { en: 'He is kind and always shares his snacks with me.', id: 'Dia baik hati dan selalu berbagi camilan denganku.' },
      { en: 'He is also brave — he is not afraid of the dark.', id: 'Dia juga berani — dia tidak takut gelap.' },
      { en: 'Everyone says he is very funny too.', id: 'Semua orang bilang dia juga sangat lucu.' },
    ],
    noteGaps: [
      {
        label: 'Nama Teman',
        emoji: '🧑',
        question: "What is my best friend's name?",
        questionId: 'Siapa nama teman baikku?',
        options: ['Fajar', 'Budi', 'Rian'],
        answer: 'Fajar',
      },
      {
        label: 'Berbagi',
        emoji: '🎁',
        question: 'What does he share?',
        questionId: 'Apa yang dia bagikan?',
        options: ['His Snacks', 'His Toys', 'His Books'],
        answer: 'His Snacks',
      },
      {
        label: 'Tidak Takut Akan',
        emoji: '🌙',
        question: 'What is he not afraid of?',
        questionId: 'Dia tidak takut apa?',
        options: ['The Dark', 'Spiders', 'Heights'],
        answer: 'The Dark',
      },
      {
        label: 'Sifat Lain',
        emoji: '😂',
        question: 'What else do people say he is?',
        questionId: 'Apa lagi sifat yang orang bilang tentang dia?',
        options: ['Funny', 'Shy', 'Quiet'],
        answer: 'Funny',
      },
    ],
  },
  {
    id: 'jadwal-pelajaran',
    title: 'Jadwal Pelajaran (Class Schedule)',
    desc: '10 kalimat + 1 catatan',
    items: [
      {
        en: 'Math',
        id: 'Matematika',
        emoji: '🔢',
        example: { en: 'I solve math problems every day.', id: 'Aku menyelesaikan soal matematika setiap hari.', emoji: '🔢' },
        question: {
          en: 'What does she solve every day?',
          id: 'Dia menyelesaikan apa setiap hari?',
          options: [
            { emoji: '🔢', text: 'Math Problems', ok: true },
            { emoji: '🔬', text: 'Science Experiments', ok: false },
            { emoji: '🎨', text: 'Art Projects', ok: false },
            { emoji: '🎵', text: 'Music Notes', ok: false },
          ],
        },
      },
      {
        en: 'Science',
        id: 'Sains',
        emoji: '🔬',
        example: { en: 'We do a science experiment in class.', id: 'Kami melakukan eksperimen sains di kelas.', emoji: '🔬' },
        question: {
          en: 'What do we do in class?',
          id: 'Kami melakukan apa di kelas?',
          options: [
            { emoji: '🔬', text: 'A Science Experiment', ok: true },
            { emoji: '🔢', text: 'A Math Test', ok: false },
            { emoji: '🎨', text: 'An Art Project', ok: false },
            { emoji: '📜', text: 'A History Lesson', ok: false },
          ],
        },
      },
      {
        en: 'English',
        id: 'Bahasa Inggris',
        emoji: '🇬🇧',
        example: { en: 'I practice speaking English every week.', id: 'Aku berlatih bicara Bahasa Inggris setiap minggu.', emoji: '🗣️' },
        question: {
          en: 'What does she practice every week?',
          id: 'Dia berlatih apa setiap minggu?',
          options: [
            { emoji: '🗣️', text: 'Speaking English', ok: true },
            { emoji: '🎵', text: 'Playing Music', ok: false },
            { emoji: '🎨', text: 'Drawing Pictures', ok: false },
            { emoji: '🗺️', text: 'Reading Maps', ok: false },
          ],
        },
      },
      {
        en: 'History',
        id: 'Sejarah',
        emoji: '📜',
        example: { en: 'We learn about old kingdoms in history class.', id: 'Kami belajar kerajaan kuno di kelas sejarah.', emoji: '🏰' },
        question: {
          en: 'What do we learn about?',
          id: 'Kami belajar tentang apa?',
          options: [
            { emoji: '🏰', text: 'Old Kingdoms', ok: true },
            { emoji: '💻', text: 'New Computers', ok: false },
            { emoji: '🚗', text: 'Fast Cars', ok: false },
            { emoji: '🐘', text: 'Big Animals', ok: false },
          ],
        },
      },
      {
        en: 'Art',
        id: 'Seni',
        emoji: '🎨',
        example: { en: 'I paint a picture in art class.', id: 'Aku melukis gambar di kelas seni.', emoji: '🖼️' },
        question: {
          en: 'What does she paint?',
          id: 'Dia melukis apa?',
          options: [
            { emoji: '🖼️', text: 'A Picture', ok: true },
            { emoji: '🗺️', text: 'A Map', ok: false },
            { emoji: '🔢', text: 'A Number', ok: false },
            { emoji: '🎵', text: 'A Song', ok: false },
          ],
        },
      },
      {
        en: 'Music',
        id: 'Musik',
        emoji: '🎵',
        example: { en: 'We sing songs in music class.', id: 'Kami menyanyikan lagu di kelas musik.', emoji: '🎤' },
        question: {
          en: 'What do we do in music class?',
          id: 'Kami melakukan apa di kelas musik?',
          options: [
            { emoji: '🎤', text: 'Sing Songs', ok: true },
            { emoji: '🔢', text: 'Solve Math', ok: false },
            { emoji: '🗺️', text: 'Draw Maps', ok: false },
            { emoji: '⚽', text: 'Play Sports', ok: false },
          ],
        },
      },
      {
        en: 'Geography',
        id: 'Geografi',
        emoji: '🗺️',
        example: { en: 'I study maps in geography class.', id: 'Aku mempelajari peta di kelas geografi.', emoji: '🗺️' },
        question: {
          en: 'What does she study?',
          id: 'Dia mempelajari apa?',
          options: [
            { emoji: '🗺️', text: 'Maps', ok: true },
            { emoji: '🎵', text: 'Songs', ok: false },
            { emoji: '🔢', text: 'Numbers', ok: false },
            { emoji: '🖼️', text: 'Paintings', ok: false },
          ],
        },
      },
      {
        en: 'Physical Education',
        id: 'Olahraga (PJOK)',
        emoji: '⚽',
        example: { en: 'We run and play sports in Physical Education.', id: 'Kami lari dan berolahraga di kelas PJOK.', emoji: '🏃' },
        question: {
          en: 'What do we do in Physical Education?',
          id: 'Kami melakukan apa di kelas PJOK?',
          options: [
            { emoji: '🏃', text: 'Run and Play Sports', ok: true },
            { emoji: '🎤', text: 'Sing Songs', ok: false },
            { emoji: '🎨', text: 'Paint Pictures', ok: false },
            { emoji: '🗺️', text: 'Study Maps', ok: false },
          ],
        },
      },
      {
        en: 'Social Studies',
        id: 'IPS',
        emoji: '🌏',
        example: { en: 'We learn about our community in Social Studies.', id: 'Kami belajar tentang komunitas kami di kelas IPS.', emoji: '🏘️' },
        question: {
          en: 'What do we learn about?',
          id: 'Kami belajar tentang apa?',
          options: [
            { emoji: '🏘️', text: 'Our Community', ok: true },
            { emoji: '🏰', text: 'Old Kingdoms', ok: false },
            { emoji: '🚗', text: 'Fast Cars', ok: false },
            { emoji: '🐘', text: 'Big Animals', ok: false },
          ],
        },
      },
      {
        en: 'Civics',
        id: 'PPKn',
        emoji: '⚖️',
        example: { en: 'We learn about good citizens in Civics.', id: 'Kami belajar tentang warga negara yang baik di kelas PPKn.', emoji: '⚖️' },
        question: {
          en: 'What do we learn about in Civics?',
          id: 'Kami belajar tentang apa di kelas PPKn?',
          options: [
            { emoji: '⚖️', text: 'Good Citizens', ok: true },
            { emoji: '🖼️', text: 'Old Paintings', ok: false },
            { emoji: '🚗', text: 'Fast Cars', ok: false },
            { emoji: '🎵', text: 'New Songs', ok: false },
          ],
        },
      },
    ],
    noteHeading: '📝 Catatan Jadwal Hari Ini',
    notePassage: [
      { en: 'Today, Vino has four classes.', id: 'Hari ini, Vino punya empat pelajaran.' },
      { en: "His first class is Math at eight o'clock.", id: 'Pelajaran pertamanya Matematika jam delapan.' },
      { en: 'His second class is Science.', id: 'Pelajaran keduanya Sains.' },
      { en: 'His last class of the day is Physical Education.', id: 'Pelajaran terakhirnya hari ini PJOK.' },
    ],
    noteGaps: [
      {
        label: 'Pelajaran Pertama',
        emoji: '🔢',
        question: 'What is his first class?',
        questionId: 'Pelajaran pertamanya apa?',
        options: ['Math', 'Science', 'Art'],
        answer: 'Math',
      },
      {
        label: 'Jam Pelajaran Pertama',
        emoji: '🕗',
        question: 'What time is his first class?',
        questionId: 'Jam berapa pelajaran pertamanya?',
        options: ["Eight O'Clock", "Nine O'Clock", "Seven O'Clock"],
        answer: "Eight O'Clock",
      },
      {
        label: 'Pelajaran Kedua',
        emoji: '🔬',
        question: 'What is his second class?',
        questionId: 'Pelajaran keduanya apa?',
        options: ['Science', 'English', 'Music'],
        answer: 'Science',
      },
      {
        label: 'Pelajaran Terakhir',
        emoji: '⚽',
        question: 'What is his last class?',
        questionId: 'Pelajaran terakhirnya apa?',
        options: ['Physical Education', 'History', 'Civics'],
        answer: 'Physical Education',
      },
    ],
  },
  {
    id: 'menghitung-uang-saku',
    title: 'Menghitung Uang Saku (Counting Allowance)',
    desc: '10 kalimat + 1 catatan',
    items: [
      {
        en: 'Thirty',
        id: 'Tiga Puluh',
        emoji: '3️⃣0️⃣',
        example: { en: 'I have thirty stickers in my album.', id: 'Aku punya tiga puluh stiker di albumku.', emoji: '🏷️' },
        question: {
          en: 'How many stickers does she have?',
          id: 'Berapa stiker yang dia punya?',
          options: [
            { emoji: '🏷️', text: 'Thirty', ok: true },
            { emoji: '4️⃣0️⃣', text: 'Forty', ok: false },
            { emoji: '2️⃣0️⃣', text: 'Twenty', ok: false },
            { emoji: '5️⃣0️⃣', text: 'Fifty', ok: false },
          ],
        },
      },
      {
        en: 'Forty',
        id: 'Empat Puluh',
        emoji: '4️⃣0️⃣',
        example: { en: 'I have forty marbles in my bag.', id: 'Aku punya empat puluh kelereng di tasku.', emoji: '🔵' },
        question: {
          en: 'How many marbles does she have?',
          id: 'Berapa kelereng yang dia punya?',
          options: [
            { emoji: '🔵', text: 'Forty', ok: true },
            { emoji: '3️⃣0️⃣', text: 'Thirty', ok: false },
            { emoji: '5️⃣0️⃣', text: 'Fifty', ok: false },
            { emoji: '6️⃣0️⃣', text: 'Sixty', ok: false },
          ],
        },
      },
      {
        en: 'Fifty',
        id: 'Lima Puluh',
        emoji: '5️⃣0️⃣',
        example: { en: 'I save fifty coins every month.', id: 'Aku menabung lima puluh koin setiap bulan.', emoji: '🪙' },
        question: {
          en: 'How many coins does she save?',
          id: 'Berapa koin yang dia tabung?',
          options: [
            { emoji: '🪙', text: 'Fifty', ok: true },
            { emoji: '4️⃣0️⃣', text: 'Forty', ok: false },
            { emoji: '6️⃣0️⃣', text: 'Sixty', ok: false },
            { emoji: '7️⃣0️⃣', text: 'Seventy', ok: false },
          ],
        },
      },
      {
        en: 'Sixty',
        id: 'Enam Puluh',
        emoji: '6️⃣0️⃣',
        example: { en: 'I have sixty candies to share.', id: 'Aku punya enam puluh permen untuk dibagi.', emoji: '🍬' },
        question: {
          en: 'How many candies does she have?',
          id: 'Berapa permen yang dia punya?',
          options: [
            { emoji: '🍬', text: 'Sixty', ok: true },
            { emoji: '5️⃣0️⃣', text: 'Fifty', ok: false },
            { emoji: '7️⃣0️⃣', text: 'Seventy', ok: false },
            { emoji: '8️⃣0️⃣', text: 'Eighty', ok: false },
          ],
        },
      },
      {
        en: 'Seventy',
        id: 'Tujuh Puluh',
        emoji: '7️⃣0️⃣',
        example: { en: 'I read seventy pages last night.', id: 'Aku membaca tujuh puluh halaman semalam.', emoji: '📖' },
        question: {
          en: 'How many pages did she read?',
          id: 'Berapa halaman yang dia baca?',
          options: [
            { emoji: '📖', text: 'Seventy', ok: true },
            { emoji: '6️⃣0️⃣', text: 'Sixty', ok: false },
            { emoji: '8️⃣0️⃣', text: 'Eighty', ok: false },
            { emoji: '9️⃣0️⃣', text: 'Ninety', ok: false },
          ],
        },
      },
      {
        en: 'Eighty',
        id: 'Delapan Puluh',
        emoji: '8️⃣0️⃣',
        example: { en: 'I scored eighty points in the game.', id: 'Aku dapat delapan puluh poin di permainan itu.', emoji: '⭐' },
        question: {
          en: 'How many points did she score?',
          id: 'Berapa poin yang dia dapat?',
          options: [
            { emoji: '⭐', text: 'Eighty', ok: true },
            { emoji: '7️⃣0️⃣', text: 'Seventy', ok: false },
            { emoji: '9️⃣0️⃣', text: 'Ninety', ok: false },
            { emoji: '💯', text: 'Hundred', ok: false },
          ],
        },
      },
      {
        en: 'Ninety',
        id: 'Sembilan Puluh',
        emoji: '9️⃣0️⃣',
        example: { en: 'I collected ninety stamps this year.', id: 'Aku mengumpulkan sembilan puluh perangko tahun ini.', emoji: '📮' },
        question: {
          en: 'How many stamps did she collect?',
          id: 'Berapa perangko yang dia kumpulkan?',
          options: [
            { emoji: '📮', text: 'Ninety', ok: true },
            { emoji: '8️⃣0️⃣', text: 'Eighty', ok: false },
            { emoji: '💯', text: 'Hundred', ok: false },
            { emoji: '6️⃣0️⃣', text: 'Sixty', ok: false },
          ],
        },
      },
      {
        en: 'Hundred',
        id: 'Seratus',
        emoji: '💯',
        example: { en: 'I have one hundred books at home.', id: 'Aku punya seratus buku di rumah.', emoji: '📚' },
        question: {
          en: 'How many books does she have?',
          id: 'Berapa buku yang dia punya?',
          options: [
            { emoji: '📚', text: 'One Hundred', ok: true },
            { emoji: '🔢', text: 'One Thousand', ok: false },
            { emoji: '9️⃣0️⃣', text: 'Ninety', ok: false },
            { emoji: '8️⃣0️⃣', text: 'Eighty', ok: false },
          ],
        },
      },
      {
        en: 'Thousand',
        id: 'Seribu',
        emoji: '🔢',
        example: { en: 'There are one thousand people at the concert.', id: 'Ada seribu orang di konser itu.', emoji: '👥' },
        question: {
          en: 'How many people are at the concert?',
          id: 'Berapa orang yang ada di konser itu?',
          options: [
            { emoji: '👥', text: 'One Thousand', ok: true },
            { emoji: '💯', text: 'One Hundred', ok: false },
            { emoji: '🌌', text: 'One Million', ok: false },
            { emoji: '9️⃣0️⃣', text: 'Ninety', ok: false },
          ],
        },
      },
      {
        en: 'Million',
        id: 'Sejuta',
        emoji: '🌌',
        example: { en: 'There are a million stars in the sky.', id: 'Ada sejuta bintang di langit.', emoji: '🌌' },
        question: {
          en: 'How many stars are in the sky?',
          id: 'Berapa bintang yang ada di langit?',
          options: [
            { emoji: '🌌', text: 'A Million', ok: true },
            { emoji: '🔢', text: 'A Thousand', ok: false },
            { emoji: '💯', text: 'A Hundred', ok: false },
            { emoji: '9️⃣0️⃣', text: 'Ninety', ok: false },
          ],
        },
      },
    ],
    noteHeading: '📝 Catatan Uang Saku Minggu Ini',
    notePassage: [
      { en: 'Sinta counts her allowance.', id: 'Sinta menghitung uang sakunya.' },
      { en: 'She has seventy coins in her piggy bank.', id: 'Dia punya tujuh puluh koin di celengannya.' },
      { en: 'She gives thirty coins to her little brother.', id: 'Dia memberi tiga puluh koin pada adik laki-lakinya.' },
      { en: 'Now she has forty coins left.', id: 'Sekarang dia punya empat puluh koin tersisa.' },
    ],
    noteGaps: [
      {
        label: 'Awal',
        emoji: '🪙',
        question: 'How many coins does she have at first?',
        questionId: 'Berapa koin yang dia punya di awal?',
        options: ['Seventy', 'Sixty', 'Eighty'],
        answer: 'Seventy',
      },
      {
        label: 'Diberikan',
        emoji: '🎁',
        question: "How many coins does she give to her brother?",
        questionId: 'Berapa koin yang dia berikan ke adiknya?',
        options: ['Thirty', 'Forty', 'Twenty'],
        answer: 'Thirty',
      },
      {
        label: 'Sisa',
        emoji: '💰',
        question: 'How many coins does she have left?',
        questionId: 'Berapa koin yang tersisa?',
        options: ['Forty', 'Fifty', 'Thirty'],
        answer: 'Forty',
      },
    ],
  },
  {
    id: 'di-toko-kerajinan',
    title: 'Di Toko Kerajinan (At the Craft Shop)',
    desc: '10 kalimat + 1 catatan',
    items: [
      {
        en: 'Wet',
        id: 'Basah',
        emoji: '💦',
        example: { en: 'The clay is wet and soft.', id: 'Tanah liatnya basah dan lembut.', emoji: '🏺' },
        question: {
          en: 'What is the clay like?',
          id: 'Bagaimana tanah liatnya?',
          options: [
            { emoji: '💦', text: 'Wet', ok: true },
            { emoji: '☀️', text: 'Dry', ok: false },
            { emoji: '🪨', text: 'Hard', ok: false },
            { emoji: '🔪', text: 'Sharp', ok: false },
          ],
        },
      },
      {
        en: 'Dry',
        id: 'Kering',
        emoji: '☀️',
        example: { en: 'The paint is already dry.', id: 'Catnya sudah kering.', emoji: '🎨' },
        question: {
          en: 'What is the paint like?',
          id: 'Bagaimana catnya?',
          options: [
            { emoji: '☀️', text: 'Dry', ok: true },
            { emoji: '💦', text: 'Wet', ok: false },
            { emoji: '🔪', text: 'Sharp', ok: false },
            { emoji: '📢', text: 'Loud', ok: false },
          ],
        },
      },
      {
        en: 'Soft',
        id: 'Lembut',
        emoji: '🧸',
        example: { en: 'This cotton feels soft.', id: 'Kapas ini terasa lembut.', emoji: '🧶' },
        question: {
          en: 'What does the cotton feel like?',
          id: 'Kapasnya terasa seperti apa?',
          options: [
            { emoji: '🧶', text: 'Soft', ok: true },
            { emoji: '🪨', text: 'Hard', ok: false },
            { emoji: '🔪', text: 'Sharp', ok: false },
            { emoji: '🌵', text: 'Rough', ok: false },
          ],
        },
      },
      {
        en: 'Hard',
        id: 'Keras',
        emoji: '🪨',
        example: { en: 'The wooden block is hard.', id: 'Balok kayunya keras.', emoji: '🧱' },
        question: {
          en: 'What is the wooden block like?',
          id: 'Bagaimana balok kayunya?',
          options: [
            { emoji: '🧱', text: 'Hard', ok: true },
            { emoji: '🧶', text: 'Soft', ok: false },
            { emoji: '💦', text: 'Wet', ok: false },
            { emoji: '💡', text: 'Bright', ok: false },
          ],
        },
      },
      {
        en: 'Sharp',
        id: 'Tajam',
        emoji: '🔪',
        example: { en: 'Be careful, the scissors are sharp.', id: 'Hati-hati, guntingnya tajam.', emoji: '✂️' },
        question: {
          en: 'What are the scissors like?',
          id: 'Bagaimana guntingnya?',
          options: [
            { emoji: '✂️', text: 'Sharp', ok: true },
            { emoji: '🧶', text: 'Soft', ok: false },
            { emoji: '☀️', text: 'Dry', ok: false },
            { emoji: '🤫', text: 'Quiet', ok: false },
          ],
        },
      },
      {
        en: 'Smooth',
        id: 'Halus',
        emoji: '👘',
        example: { en: 'This silk ribbon feels smooth.', id: 'Pita sutra ini terasa halus.', emoji: '🎀' },
        question: {
          en: 'What does the ribbon feel like?',
          id: 'Pitanya terasa seperti apa?',
          options: [
            { emoji: '🎀', text: 'Smooth', ok: true },
            { emoji: '🌵', text: 'Rough', ok: false },
            { emoji: '🔪', text: 'Sharp', ok: false },
            { emoji: '📢', text: 'Loud', ok: false },
          ],
        },
      },
      {
        en: 'Rough',
        id: 'Kasar',
        emoji: '🌵',
        example: { en: 'The sandpaper feels rough.', id: 'Ampelasnya terasa kasar.', emoji: '🪵' },
        question: {
          en: 'What does the sandpaper feel like?',
          id: 'Ampelasnya terasa seperti apa?',
          options: [
            { emoji: '🪵', text: 'Rough', ok: true },
            { emoji: '🎀', text: 'Smooth', ok: false },
            { emoji: '🧶', text: 'Soft', ok: false },
            { emoji: '💦', text: 'Wet', ok: false },
          ],
        },
      },
      {
        en: 'Loud',
        id: 'Keras (Suara)',
        emoji: '📢',
        example: { en: 'The hammer makes a loud sound.', id: 'Palunya membuat suara yang keras.', emoji: '🔨' },
        question: {
          en: 'What kind of sound does the hammer make?',
          id: 'Suara seperti apa yang dibuat palu itu?',
          options: [
            { emoji: '🔨', text: 'Loud', ok: true },
            { emoji: '🤫', text: 'Quiet', ok: false },
            { emoji: '🧶', text: 'Soft', ok: false },
            { emoji: '💡', text: 'Bright', ok: false },
          ],
        },
      },
      {
        en: 'Quiet',
        id: 'Tenang',
        emoji: '🤫',
        example: { en: 'The craft shop is quiet in the morning.', id: 'Toko kerajinan tenang di pagi hari.', emoji: '🏪' },
        question: {
          en: 'What is the shop like in the morning?',
          id: 'Bagaimana toko itu di pagi hari?',
          options: [
            { emoji: '🏪', text: 'Quiet', ok: true },
            { emoji: '📢', text: 'Loud', ok: false },
            { emoji: '💡', text: 'Bright', ok: false },
            { emoji: '💦', text: 'Wet', ok: false },
          ],
        },
      },
      {
        en: 'Bright',
        id: 'Terang',
        emoji: '💡',
        example: { en: 'The glitter looks bright.', id: 'Glitternya terlihat terang.', emoji: '✨' },
        question: {
          en: 'What does the glitter look like?',
          id: 'Glitternya terlihat seperti apa?',
          options: [
            { emoji: '✨', text: 'Bright', ok: true },
            { emoji: '🌑', text: 'Dark', ok: false },
            { emoji: '🌵', text: 'Rough', ok: false },
            { emoji: '💦', text: 'Wet', ok: false },
          ],
        },
      },
    ],
    noteHeading: '📝 Catatan Belanja di Toko Kerajinan',
    notePassage: [
      { en: 'Made goes to the craft shop.', id: 'Made pergi ke toko kerajinan.' },
      { en: 'He buys soft cotton for a project.', id: 'Dia membeli kapas lembut untuk sebuah proyek.' },
      { en: 'He also buys sharp scissors to cut paper.', id: 'Dia juga membeli gunting tajam untuk memotong kertas.' },
      { en: 'The glitter he picks is very bright.', id: 'Glitter yang dia pilih sangat terang.' },
    ],
    noteGaps: [
      {
        label: 'Kapas',
        emoji: '🧸',
        question: 'What is the cotton like?',
        questionId: 'Kapasnya seperti apa?',
        options: ['Soft', 'Hard', 'Wet'],
        answer: 'Soft',
      },
      {
        label: 'Gunting',
        emoji: '✂️',
        question: 'What are the scissors like?',
        questionId: 'Guntingnya seperti apa?',
        options: ['Sharp', 'Smooth', 'Quiet'],
        answer: 'Sharp',
      },
      {
        label: 'Glitter',
        emoji: '✨',
        question: 'What does the glitter look like?',
        questionId: 'Glitternya seperti apa?',
        options: ['Bright', 'Dark', 'Rough'],
        answer: 'Bright',
      },
    ],
  },
];

/**
 * Listening Trailblazer — level PERTAMA (dan sejauh ini SATU-SATUNYA) yang
 * pakai format KEEMPAT `ListeningDialogueTopic` (types.ts) — REVISI SCOPE
 * eksplisit dari PRD §9 "low-effort, 1-2 modul preview" (yang tetap berlaku
 * penuh utk Vocab Trailblazer, TIDAK diubah) — user ditanya eksplisit "ikuti
 * kunci lama (1-2 topik, format lama) VS full 10 topik + format baru", DAN
 * MEMILIH revisi penuh. Riset: Cambridge KET (A2 Key for Schools) → PET (B1
 * Preliminary for Schools) py Listening "identify gist/main idea" & "extended
 * interview + inferensi sikap/opini" (`materi/listening.md` §3F/§4F) — beda
 * dari note completion Achiever (isi FAKTA spesifik), di sini anak dengar 1
 * PERCAKAPAN 2 tokoh lebih panjang lalu jawab pertanyaan yang butuh
 * MEMAHAMI KESELURUHAN percakapan (gist/sikap/dugaan tindakan), dirender
 * `runTantanganDialogue` (`games/listening.ts`). Kenalan & Latihan Inti
 * REUSE PERSIS `items: ListeningSentenceItem[]` (task shape sama dgn 3 level
 * format-baru lain). 10 topik dipetakan ke 10 tema Cambridge B1 Preliminary
 * (PET) — 2 topik PERTAMA REUSE kata dari `VOCAB_TOPICS_TRAILBLAZER` yang
 * sudah ada (`perjalanan-wisata`/Travel & Tourism, `bahasa-komunikasi`/
 * Language & Communication), 8 topik SISANYA dipetakan ke 8 dari 20 tema PET
 * residual yang `materi/vocab.md` §3F.2 sudah riset & sisakan tapi belum
 * dipetakan ke topik manapun (Services, Shopping, Education, Entertainment
 * and Media, Personal Feelings/Opinions/Experiences, Places (Town and City),
 * Environment/The Natural World, Work and Jobs) — 12 tema PET lainnya masih
 * tersisa utk perluasan masa depan kalau diminta.
 */
export const LISTENING_TOPICS_TRAILBLAZER: ListeningDialogueTopic[] = [
  {
    id: 'rencana-liburan',
    title: 'Rencana Liburan (Holiday Plans)',
    desc: '10 kalimat + 1 percakapan',
    items: [
      {
        en: 'Passport',
        id: 'Paspor',
        emoji: '🛂',
        example: { en: 'I show my passport at the airport.', id: 'Aku menunjukkan pasporku di bandara.', emoji: '🛂' },
        question: {
          en: 'Where does she show her passport?',
          id: 'Di mana dia menunjukkan pasporny?',
          options: [
            { emoji: '✈️', text: 'The Airport', ok: true },
            { emoji: '🏨', text: 'The Hotel', ok: false },
            { emoji: '🚉', text: 'The Station', ok: false },
            { emoji: '🏦', text: 'The Bank', ok: false },
          ],
        },
      },
      {
        en: 'Luggage',
        id: 'Koper',
        emoji: '🧳',
        example: { en: 'I pack my luggage the night before.', id: 'Aku mengemas koperku malam sebelumnya.', emoji: '🧳' },
        question: {
          en: 'When does she pack her luggage?',
          id: 'Kapan dia mengemas kopernya?',
          options: [
            { emoji: '🌙', text: 'The Night Before', ok: true },
            { emoji: '🌅', text: 'The Morning Of', ok: false },
            { emoji: '📅', text: 'A Week Before', ok: false },
            { emoji: '🏁', text: 'After Arriving', ok: false },
          ],
        },
      },
      {
        en: 'Journey',
        id: 'Perjalanan',
        emoji: '🗺️',
        example: { en: 'We enjoy the long journey by train.', id: 'Kami menikmati perjalanan panjang naik kereta.', emoji: '🚆' },
        question: {
          en: 'How do we travel?',
          id: 'Bagaimana kami bepergian?',
          options: [
            { emoji: '🚆', text: 'By Train', ok: true },
            { emoji: '✈️', text: 'By Plane', ok: false },
            { emoji: '🚗', text: 'By Car', ok: false },
            { emoji: '⛵', text: 'By Boat', ok: false },
          ],
        },
      },
      {
        en: 'Destination',
        id: 'Tujuan',
        emoji: '📍',
        example: { en: 'Bali is our final destination.', id: 'Bali adalah tujuan akhir kami.', emoji: '🏝️' },
        question: {
          en: 'What is our destination?',
          id: 'Apa tujuan kami?',
          options: [
            { emoji: '🏝️', text: 'Bali', ok: true },
            { emoji: '🏙️', text: 'Jakarta', ok: false },
            { emoji: '🏞️', text: 'Lombok', ok: false },
            { emoji: '🏯', text: 'Yogyakarta', ok: false },
          ],
        },
      },
      {
        en: 'Tourist',
        id: 'Turis',
        emoji: '📸',
        example: { en: 'The tourist takes many photos.', id: 'Turis itu memotret banyak foto.', emoji: '📸' },
        question: {
          en: 'What does the tourist take?',
          id: 'Apa yang diambil turis itu?',
          options: [
            { emoji: '📸', text: 'Many Photos', ok: true },
            { emoji: '😴', text: 'A Nap', ok: false },
            { emoji: '🚕', text: 'A Taxi', ok: false },
            { emoji: '🗺️', text: 'A Map', ok: false },
          ],
        },
      },
      {
        en: 'Souvenir',
        id: 'Oleh-oleh',
        emoji: '🎁',
        example: { en: 'I buy a souvenir for my sister.', id: 'Aku membeli oleh-oleh untuk kakak perempuanku.', emoji: '🎁' },
        question: {
          en: 'Who does she buy a souvenir for?',
          id: 'Untuk siapa dia membeli oleh-oleh?',
          options: [
            { emoji: '👧', text: 'Her Sister', ok: true },
            { emoji: '👦', text: 'Her Brother', ok: false },
            { emoji: '👩', text: 'Her Mom', ok: false },
            { emoji: '🧑‍🤝‍🧑', text: 'Her Friend', ok: false },
          ],
        },
      },
      {
        en: 'Map',
        id: 'Peta',
        emoji: '🧭',
        example: { en: 'I read the map to find the hotel.', id: 'Aku membaca peta untuk menemukan hotel.', emoji: '🧭' },
        question: {
          en: 'Why does she read the map?',
          id: 'Kenapa dia membaca peta?',
          options: [
            { emoji: '🏨', text: 'To Find the Hotel', ok: true },
            { emoji: '✈️', text: 'To Find the Airport', ok: false },
            { emoji: '🎁', text: 'To Find a Souvenir', ok: false },
            { emoji: '🎫', text: 'To Find a Ticket', ok: false },
          ],
        },
      },
      {
        en: 'Ticket',
        id: 'Tiket',
        emoji: '🎫',
        example: { en: 'I buy a ticket online.', id: 'Aku membeli tiket secara daring.', emoji: '💻' },
        question: {
          en: 'How does she buy a ticket?',
          id: 'Bagaimana dia membeli tiket?',
          options: [
            { emoji: '💻', text: 'Online', ok: true },
            { emoji: '🏦', text: 'At the Counter', ok: false },
            { emoji: '📞', text: 'By Phone', ok: false },
            { emoji: '🧑‍🤝‍🧑', text: 'From a Friend', ok: false },
          ],
        },
      },
      {
        en: 'Hotel',
        id: 'Hotel',
        emoji: '🏨',
        example: { en: 'We stay at a hotel near the beach.', id: 'Kami menginap di hotel dekat pantai.', emoji: '🏖️' },
        question: {
          en: 'Where is the hotel?',
          id: 'Di mana hotelnya?',
          options: [
            { emoji: '🏖️', text: 'Near the Beach', ok: true },
            { emoji: '✈️', text: 'Near the Airport', ok: false },
            { emoji: '⛰️', text: 'Near the Mountain', ok: false },
            { emoji: '🏙️', text: 'Near the City', ok: false },
          ],
        },
      },
      {
        en: 'Sightseeing',
        id: 'Wisata',
        emoji: '🏞️',
        example: { en: 'We go sightseeing after breakfast.', id: 'Kami pergi berwisata setelah sarapan.', emoji: '🥞' },
        question: {
          en: 'When do we go sightseeing?',
          id: 'Kapan kami pergi berwisata?',
          options: [
            { emoji: '🥞', text: 'After Breakfast', ok: true },
            { emoji: '🌙', text: 'Before Breakfast', ok: false },
            { emoji: '🌃', text: 'At Midnight', ok: false },
            { emoji: '🍽️', text: 'During Dinner', ok: false },
          ],
        },
      },
    ],
    dialogueHeading: 'Rencana Liburan',
    dialogueLines: [
      { speaker: 'Rani', en: 'Are you excited about the trip to Bali?', id: 'Kamu senang soal perjalanan ke Bali?' },
      { speaker: 'Dimas', en: 'Yes! I already packed my luggage and printed the ticket.', id: 'Ya! Aku sudah mengemas koper dan mencetak tiketnya.' },
      { speaker: 'Rani', en: "Great. Don't forget your passport, we need it at the airport.", id: 'Bagus. Jangan lupa paspormu, kita butuh itu di bandara.' },
      { speaker: 'Dimas', en: 'I have it right here. What time is our flight?', id: 'Ada di sini. Jam berapa penerbangan kita?' },
      { speaker: 'Rani', en: "It's at nine in the morning, so we should leave early.", id: 'Jam sembilan pagi, jadi kita harus berangkat awal.' },
      { speaker: 'Dimas', en: 'Perfect. I really want to go sightseeing on the first day.', id: 'Bagus. Aku benar-benar mau berwisata di hari pertama.' },
      { speaker: 'Rani', en: 'Me too! I heard the beach near our hotel is beautiful.', id: 'Aku juga! Aku dengar pantai dekat hotel kita indah.' },
    ],
    inferenceQuestions: [
      {
        question: 'What are Rani and Dimas mainly talking about?',
        questionId: 'Rani dan Dimas sebenarnya membicarakan apa?',
        options: [
          { emoji: '🏝️', text: 'Their Trip to Bali', ok: true },
          { emoji: '📝', text: 'A School Exam', ok: false },
          { emoji: '💼', text: 'A Job Interview', ok: false },
          { emoji: '🎬', text: 'A New Movie', ok: false },
        ],
      },
      {
        question: 'How does Dimas feel about the trip?',
        questionId: 'Bagaimana perasaan Dimas soal perjalanan itu?',
        options: [
          { emoji: '🤩', text: 'Excited', ok: true },
          { emoji: '😟', text: 'Worried', ok: false },
          { emoji: '😑', text: 'Bored', ok: false },
          { emoji: '😠', text: 'Angry', ok: false },
        ],
      },
      {
        question: 'What will they probably do first on the trip?',
        questionId: 'Apa yang mungkin mereka lakukan pertama saat liburan?',
        options: [
          { emoji: '🏞️', text: 'Go Sightseeing', ok: true },
          { emoji: '🎁', text: 'Buy a Souvenir', ok: false },
          { emoji: '🧭', text: 'Read a Map', ok: false },
          { emoji: '📸', text: 'Take a Photo', ok: false },
        ],
      },
    ],
  },
  {
    id: 'belajar-bahasa-baru',
    title: 'Belajar Bahasa Baru (Learning a New Language)',
    desc: '10 kalimat + 1 percakapan',
    items: [
      {
        en: 'Translate',
        id: 'Menerjemahkan',
        emoji: '🔤',
        example: { en: 'I translate the letter for my friend.', id: 'Aku menerjemahkan surat itu untuk temanku.', emoji: '✉️' },
        question: {
          en: 'Who does she translate the letter for?',
          id: 'Untuk siapa dia menerjemahkan surat itu?',
          options: [
            { emoji: '🧑‍🤝‍🧑', text: 'Her Friend', ok: true },
            { emoji: '🧑‍🏫', text: 'Her Teacher', ok: false },
            { emoji: '👩', text: 'Her Mom', ok: false },
            { emoji: '🏘️', text: 'Her Neighbor', ok: false },
          ],
        },
      },
      {
        en: 'Interpreter',
        id: 'Penerjemah Lisan',
        emoji: '🗣️',
        example: { en: 'The interpreter helps the tourists talk.', id: 'Penerjemah lisan itu membantu turis-turis bicara.', emoji: '📸' },
        question: {
          en: 'Who does the interpreter help?',
          id: 'Siapa yang dibantu penerjemah lisan itu?',
          options: [
            { emoji: '📸', text: 'The Tourists', ok: true },
            { emoji: '🧑‍🎓', text: 'The Students', ok: false },
            { emoji: '🧑‍⚕️', text: 'The Doctors', ok: false },
            { emoji: '🧑‍🍳', text: 'The Chefs', ok: false },
          ],
        },
      },
      {
        en: 'Fluent',
        id: 'Fasih',
        emoji: '💬',
        example: { en: 'She becomes fluent after one year.', id: 'Dia jadi fasih setelah satu tahun.', emoji: '📅' },
        question: {
          en: 'When does she become fluent?',
          id: 'Kapan dia menjadi fasih?',
          options: [
            { emoji: '📅', text: 'After One Year', ok: true },
            { emoji: '🗓️', text: 'After One Month', ok: false },
            { emoji: '📆', text: 'After One Week', ok: false },
            { emoji: '⏰', text: 'After One Day', ok: false },
          ],
        },
      },
      {
        en: 'Accent',
        id: 'Aksen',
        emoji: '🎤',
        example: { en: 'He has a strong French accent.', id: 'Dia punya aksen Prancis yang kental.', emoji: '🇫🇷' },
        question: {
          en: 'What kind of accent does he have?',
          id: 'Aksen apa yang dia punya?',
          options: [
            { emoji: '🇫🇷', text: 'French', ok: true },
            { emoji: '🇬🇧', text: 'English', ok: false },
            { emoji: '🇪🇸', text: 'Spanish', ok: false },
            { emoji: '🇯🇵', text: 'Japanese', ok: false },
          ],
        },
      },
      {
        en: 'Pronunciation',
        id: 'Pengucapan',
        emoji: '👄',
        example: { en: 'I practice pronunciation every morning.', id: 'Aku berlatih pengucapan setiap pagi.', emoji: '🌅' },
        question: {
          en: 'When does she practice pronunciation?',
          id: 'Kapan dia berlatih pengucapan?',
          options: [
            { emoji: '🌅', text: 'Every Morning', ok: true },
            { emoji: '🌙', text: 'Every Night', ok: false },
            { emoji: '📅', text: 'Every Weekend', ok: false },
            { emoji: '🎉', text: 'Every Holiday', ok: false },
          ],
        },
      },
      {
        en: 'Vocabulary',
        id: 'Kosakata',
        emoji: '📖',
        example: { en: 'I learn ten new vocabulary words a day.', id: 'Aku belajar sepuluh kosakata baru sehari.', emoji: '🔟' },
        question: {
          en: 'How many words does she learn a day?',
          id: 'Berapa kata yang dia pelajari sehari?',
          options: [
            { emoji: '🔟', text: 'Ten', ok: true },
            { emoji: '5️⃣', text: 'Five', ok: false },
            { emoji: '2️⃣0️⃣', text: 'Twenty', ok: false },
            { emoji: '2️⃣', text: 'Two', ok: false },
          ],
        },
      },
      {
        en: 'Dictionary',
        id: 'Kamus',
        emoji: '📕',
        example: { en: 'I check the dictionary for hard words.', id: 'Aku memeriksa kamus untuk kata-kata sulit.', emoji: '📕' },
        question: {
          en: 'What does she check the dictionary for?',
          id: 'Untuk apa dia memeriksa kamus?',
          options: [
            { emoji: '📕', text: 'Hard Words', ok: true },
            { emoji: '😊', text: 'Easy Words', ok: false },
            { emoji: '🧑', text: 'Names', ok: false },
            { emoji: '🔢', text: 'Numbers', ok: false },
          ],
        },
      },
      {
        en: 'Bilingual',
        id: 'Dwibahasa',
        emoji: '🌍',
        example: { en: 'My cousin is bilingual in English and Japanese.', id: 'Sepupuku dwibahasa, Inggris dan Jepang.', emoji: '🌍' },
        question: {
          en: 'What languages is her cousin bilingual in?',
          id: 'Sepupunya dwibahasa apa saja?',
          options: [
            { emoji: '🇬🇧', text: 'English and Japanese', ok: true },
            { emoji: '🇫🇷', text: 'English and French', ok: false },
            { emoji: '🇪🇸', text: 'Spanish and English', ok: false },
            { emoji: '🇰🇷', text: 'Korean and English', ok: false },
          ],
        },
      },
      {
        en: 'Grammar',
        id: 'Tata Bahasa',
        emoji: '✏️',
        example: { en: 'I study grammar before the test.', id: 'Aku belajar tata bahasa sebelum ujian.', emoji: '📝' },
        question: {
          en: 'When does she study grammar?',
          id: 'Kapan dia belajar tata bahasa?',
          options: [
            { emoji: '📝', text: 'Before the Test', ok: true },
            { emoji: '✅', text: 'After the Test', ok: false },
            { emoji: '⏳', text: 'During the Test', ok: false },
            { emoji: '🚫', text: 'Instead of the Test', ok: false },
          ],
        },
      },
      {
        en: 'Native Speaker',
        id: 'Penutur Asli',
        emoji: '🎙️',
        example: { en: 'I talk to a native speaker online.', id: 'Aku bicara dengan penutur asli secara daring.', emoji: '💻' },
        question: {
          en: 'Where does she talk to a native speaker?',
          id: 'Di mana dia bicara dengan penutur asli?',
          options: [
            { emoji: '💻', text: 'Online', ok: true },
            { emoji: '🏫', text: 'At School', ok: false },
            { emoji: '🏠', text: 'At Home', ok: false },
            { emoji: '📚', text: 'At the Library', ok: false },
          ],
        },
      },
    ],
    dialogueHeading: 'Belajar Bahasa Baru',
    dialogueLines: [
      { speaker: 'Sari', en: 'How long have you been learning Indonesian, Leo?', id: 'Sudah berapa lama kamu belajar Bahasa Indonesia, Leo?' },
      { speaker: 'Leo', en: 'About six months. My pronunciation is still not perfect.', id: 'Sekitar enam bulan. Pengucapanku masih belum sempurna.' },
      { speaker: 'Sari', en: "Don't worry, your vocabulary is already really good.", id: 'Tidak usah khawatir, kosakatamu sudah sangat bagus.' },
      { speaker: 'Leo', en: 'Thanks! I use a dictionary app every day to learn new words.', id: 'Terima kasih! Aku pakai aplikasi kamus setiap hari untuk belajar kata baru.' },
      { speaker: 'Sari', en: 'That’s smart. Do you talk to native speakers often?', id: 'Cerdas. Kamu sering bicara dengan penutur asli?' },
      { speaker: 'Leo', en: 'Yes, I have a language partner. She helps me practice grammar too.', id: 'Ya, aku punya teman belajar bahasa. Dia juga membantuku berlatih tata bahasa.' },
      { speaker: 'Sari', en: "That's great. You'll be fluent very soon!", id: 'Bagus sekali. Kamu akan segera fasih!' },
    ],
    inferenceQuestions: [
      {
        question: 'What are Sari and Leo mainly talking about?',
        questionId: 'Sari dan Leo sebenarnya membicarakan apa?',
        options: [
          { emoji: '🗣️', text: 'Learning Indonesian', ok: true },
          { emoji: '🏝️', text: 'Planning a Trip', ok: false },
          { emoji: '📝', text: 'A School Exam', ok: false },
          { emoji: '🎬', text: 'Choosing a Movie', ok: false },
        ],
      },
      {
        question: 'How does Leo feel about his pronunciation?',
        questionId: 'Bagaimana perasaan Leo soal pengucapannya?',
        options: [
          { emoji: '🙂', text: 'Not Yet Perfect', ok: true },
          { emoji: '😎', text: 'Already Perfect', ok: false },
          { emoji: '😢', text: 'Very Bad', ok: false },
          { emoji: '😐', text: "He Doesn't Care", ok: false },
        ],
      },
      {
        question: 'How does Leo practice speaking with native speakers?',
        questionId: 'Bagaimana Leo berlatih bicara dengan penutur asli?',
        options: [
          { emoji: '🧑‍🤝‍🧑', text: 'Through a Language Partner', ok: true },
          { emoji: '📕', text: 'Through a Dictionary App', ok: false },
          { emoji: '📚', text: 'Through Grammar Books', ok: false },
          { emoji: '🏫', text: 'Through School Class', ok: false },
        ],
      },
    ],
  },
  {
    id: 'menelpon-jasa',
    title: 'Menelpon Jasa Reparasi (Calling a Repair Service)',
    desc: '10 kalimat + 1 percakapan',
    items: [
      {
        en: 'Receipt',
        id: 'Struk',
        emoji: '🧾',
        example: { en: 'I keep the receipt in my wallet.', id: 'Aku menyimpan struk di dompetku.', emoji: '👛' },
        question: {
          en: 'Where does she keep the receipt?',
          id: 'Di mana dia menyimpan struknya?',
          options: [
            { emoji: '👛', text: 'Her Wallet', ok: true },
            { emoji: '🎒', text: 'Her Bag', ok: false },
            { emoji: '👖', text: 'Her Pocket', ok: false },
            { emoji: '🗄️', text: 'Her Drawer', ok: false },
          ],
        },
      },
      {
        en: 'Repair',
        id: 'Perbaikan',
        emoji: '🔧',
        example: { en: 'The technician will repair my laptop tomorrow.', id: 'Teknisi itu akan memperbaiki laptopku besok.', emoji: '💻' },
        question: {
          en: 'When will the technician repair it?',
          id: 'Kapan teknisi itu akan memperbaikinya?',
          options: [
            { emoji: '📅', text: 'Tomorrow', ok: true },
            { emoji: '☀️', text: 'Today', ok: false },
            { emoji: '🗓️', text: 'Next Week', ok: false },
            { emoji: '📆', text: 'Next Month', ok: false },
          ],
        },
      },
      {
        en: 'Deliver',
        id: 'Mengirim',
        emoji: '📦',
        example: { en: 'They deliver the package in two days.', id: 'Mereka mengirim paket dalam dua hari.', emoji: '📦' },
        question: {
          en: 'How long until they deliver it?',
          id: 'Berapa lama sampai mereka mengirimnya?',
          options: [
            { emoji: '2️⃣', text: 'Two Days', ok: true },
            { emoji: '1️⃣', text: 'One Day', ok: false },
            { emoji: '🗓️', text: 'One Week', ok: false },
            { emoji: '📆', text: 'One Month', ok: false },
          ],
        },
      },
      {
        en: 'Appointment',
        id: 'Janji Temu',
        emoji: '📅',
        example: { en: 'I make an appointment for Monday.', id: 'Aku membuat janji temu untuk hari Senin.', emoji: '📅' },
        question: {
          en: 'What day is the appointment?',
          id: 'Hari apa janji temunya?',
          options: [
            { emoji: '📅', text: 'Monday', ok: true },
            { emoji: '📆', text: 'Tuesday', ok: false },
            { emoji: '🗓️', text: 'Friday', ok: false },
            { emoji: '☀️', text: 'Sunday', ok: false },
          ],
        },
      },
      {
        en: 'Customer',
        id: 'Pelanggan',
        emoji: '🧑‍🤝‍🧑',
        example: { en: 'The customer waits patiently in line.', id: 'Pelanggan itu menunggu dengan sabar di antrean.', emoji: '⏳' },
        question: {
          en: 'How does the customer wait?',
          id: 'Bagaimana pelanggan itu menunggu?',
          options: [
            { emoji: '⏳', text: 'Patiently', ok: true },
            { emoji: '😠', text: 'Angrily', ok: false },
            { emoji: '📢', text: 'Loudly', ok: false },
            { emoji: '😴', text: 'Sleepily', ok: false },
          ],
        },
      },
      {
        en: 'Refund',
        id: 'Pengembalian Dana',
        emoji: '💵',
        example: { en: 'I ask for a refund because it broke.', id: 'Aku meminta pengembalian dana karena itu rusak.', emoji: '💔' },
        question: {
          en: 'Why does she ask for a refund?',
          id: 'Kenapa dia meminta pengembalian dana?',
          options: [
            { emoji: '💔', text: 'It Broke', ok: true },
            { emoji: '⏰', text: 'It Was Late', ok: false },
            { emoji: '🎨', text: 'It Was Wrong Color', ok: false },
            { emoji: '📏', text: 'It Was Too Big', ok: false },
          ],
        },
      },
      {
        en: 'Complaint',
        id: 'Keluhan',
        emoji: '😤',
        example: { en: 'She makes a complaint about the noise.', id: 'Dia mengajukan keluhan tentang kebisingan.', emoji: '📢' },
        question: {
          en: 'What is the complaint about?',
          id: 'Keluhannya tentang apa?',
          options: [
            { emoji: '📢', text: 'The Noise', ok: true },
            { emoji: '💵', text: 'The Price', ok: false },
            { emoji: '🍽️', text: 'The Food', ok: false },
            { emoji: '⏳', text: 'The Wait', ok: false },
          ],
        },
      },
      {
        en: 'Apology',
        id: 'Permintaan Maaf',
        emoji: '🙏',
        example: { en: 'The manager gives an apology for the delay.', id: 'Manajer itu meminta maaf atas keterlambatan.', emoji: '⏰' },
        question: {
          en: 'What does the manager apologize for?',
          id: 'Manajer itu meminta maaf soal apa?',
          options: [
            { emoji: '⏰', text: 'The Delay', ok: true },
            { emoji: '💵', text: 'The Price', ok: false },
            { emoji: '📢', text: 'The Noise', ok: false },
            { emoji: '❌', text: 'The Mistake', ok: false },
          ],
        },
      },
      {
        en: 'Request',
        id: 'Permintaan',
        emoji: '🙋',
        example: { en: 'I make a request for a later time.', id: 'Aku mengajukan permintaan untuk waktu yang lebih siang.', emoji: '🕒' },
        question: {
          en: 'What does she request?',
          id: 'Apa yang dia minta?',
          options: [
            { emoji: '🕒', text: 'A Later Time', ok: true },
            { emoji: '💵', text: 'A Refund', ok: false },
            { emoji: '🏷️', text: 'A Discount', ok: false },
            { emoji: '🧾', text: 'A Receipt', ok: false },
          ],
        },
      },
      {
        en: 'Service',
        id: 'Layanan',
        emoji: '🛎️',
        example: { en: 'The hotel service is very fast.', id: 'Layanan hotel itu sangat cepat.', emoji: '🏨' },
        question: {
          en: 'What is very fast?',
          id: 'Apa yang sangat cepat?',
          options: [
            { emoji: '🏨', text: 'The Hotel Service', ok: true },
            { emoji: '🍽️', text: 'The Food', ok: false },
            { emoji: '🌐', text: 'The Internet', ok: false },
            { emoji: '🚌', text: 'The Bus', ok: false },
          ],
        },
      },
    ],
    dialogueHeading: 'Menelpon Jasa Reparasi',
    dialogueLines: [
      { speaker: 'Mira', en: 'Hello, my washing machine is broken. Can someone repair it?', id: 'Halo, mesin cuciku rusak. Apa ada yang bisa memperbaikinya?' },
      { speaker: 'Pak Joko', en: 'Of course. Can I make an appointment for tomorrow afternoon?', id: 'Tentu. Bolehkah saya buatkan janji temu untuk besok siang?' },
      { speaker: 'Mira', en: 'That works for me. How long will the repair take?', id: 'Itu cocok untukku. Berapa lama perbaikannya?' },
      { speaker: 'Pak Joko', en: 'Usually about one hour, but it depends on the problem.', id: 'Biasanya sekitar satu jam, tapi tergantung masalahnya.' },
      { speaker: 'Mira', en: 'Okay. Also, I still have the receipt from when I bought it.', id: 'Baik. Aku juga masih punya struk dari waktu membelinya.' },
      { speaker: 'Pak Joko', en: 'Great, please keep that ready for our technician.', id: 'Bagus, tolong siapkan itu untuk teknisi kami.' },
      { speaker: 'Mira', en: 'Thank you, I really appreciate the quick service.', id: 'Terima kasih, aku sangat menghargai layanan yang cepat.' },
    ],
    inferenceQuestions: [
      {
        question: 'What is Mira calling about?',
        questionId: 'Mira menelepon soal apa?',
        options: [
          { emoji: '🧺', text: 'A Broken Washing Machine', ok: true },
          { emoji: '📦', text: 'A Late Delivery', ok: false },
          { emoji: '🛒', text: 'A Wrong Order', ok: false },
          { emoji: '💼', text: 'A Job Interview', ok: false },
        ],
      },
      {
        question: 'When will the technician come?',
        questionId: 'Kapan teknisinya datang?',
        options: [
          { emoji: '📅', text: 'Tomorrow Afternoon', ok: true },
          { emoji: '🌅', text: 'Today Morning', ok: false },
          { emoji: '🗓️', text: 'Next Week', ok: false },
          { emoji: '🌙', text: 'Tonight', ok: false },
        ],
      },
      {
        question: 'How does Mira feel about the service?',
        questionId: 'Bagaimana perasaan Mira soal layanannya?',
        options: [
          { emoji: '🙏', text: 'Appreciative', ok: true },
          { emoji: '😠', text: 'Angry', ok: false },
          { emoji: '😕', text: 'Confused', ok: false },
          { emoji: '😑', text: 'Bored', ok: false },
        ],
      },
    ],
  },
  {
    id: 'tukar-barang',
    title: 'Menukar Barang di Toko (Returning an Item)',
    desc: '10 kalimat + 1 percakapan',
    items: [
      {
        en: 'Exchange',
        id: 'Menukar',
        emoji: '🔁',
        example: { en: 'I want to exchange this shirt for a bigger size.', id: 'Aku mau menukar kemeja ini dengan ukuran lebih besar.', emoji: '👕' },
        question: {
          en: 'Why does she want to exchange it?',
          id: 'Kenapa dia mau menukarnya?',
          options: [
            { emoji: '📏', text: 'For a Bigger Size', ok: true },
            { emoji: '🎨', text: 'For a Different Color', ok: false },
            { emoji: '💵', text: 'For a Refund', ok: false },
            { emoji: '🏷️', text: 'For a Discount', ok: false },
          ],
        },
      },
      {
        en: 'Discount',
        id: 'Diskon',
        emoji: '🏷️',
        example: { en: 'I get a discount because of the sale.', id: 'Aku dapat diskon karena diskon besar.', emoji: '🎉' },
        question: {
          en: 'Why does she get a discount?',
          id: 'Kenapa dia dapat diskon?',
          options: [
            { emoji: '🎉', text: 'The Sale', ok: true },
            { emoji: '🎂', text: 'Her Birthday', ok: false },
            { emoji: '🎟️', text: 'A Coupon', ok: false },
            { emoji: '🪪', text: 'Being a Member', ok: false },
          ],
        },
      },
      {
        en: 'Size',
        id: 'Ukuran',
        emoji: '📏',
        example: { en: 'This shoe is the wrong size for me.', id: 'Sepatu ini ukurannya salah untukku.', emoji: '👟' },
        question: {
          en: 'What is wrong with the shoe?',
          id: 'Apa yang salah dengan sepatunya?',
          options: [
            { emoji: '📏', text: 'The Size', ok: true },
            { emoji: '🎨', text: 'The Color', ok: false },
            { emoji: '💵', text: 'The Price', ok: false },
            { emoji: '🏷️', text: 'The Brand', ok: false },
          ],
        },
      },
      {
        en: 'Fitting Room',
        id: 'Ruang Pas',
        emoji: '🚪',
        example: { en: 'I try on the dress in the fitting room.', id: 'Aku mencoba gaun itu di ruang pas.', emoji: '👗' },
        question: {
          en: 'Where does she try on the dress?',
          id: 'Di mana dia mencoba gaunnya?',
          options: [
            { emoji: '🚪', text: 'The Fitting Room', ok: true },
            { emoji: '🧑‍💼', text: 'The Cashier', ok: false },
            { emoji: '🚶', text: 'The Entrance', ok: false },
            { emoji: '🅿️', text: 'The Parking Lot', ok: false },
          ],
        },
      },
      {
        en: 'Sale',
        id: 'Obral',
        emoji: '🎉',
        example: { en: 'The store has a big sale this weekend.', id: 'Toko itu ada obral besar akhir pekan ini.', emoji: '🏬' },
        question: {
          en: 'When is the sale?',
          id: 'Kapan obralnya?',
          options: [
            { emoji: '📅', text: 'This Weekend', ok: true },
            { emoji: '📆', text: 'Next Month', ok: false },
            { emoji: '🔁', text: 'Every Day', ok: false },
            { emoji: '☀️', text: 'Only Today', ok: false },
          ],
        },
      },
      {
        en: 'Bargain',
        id: 'Barang Murah',
        emoji: '💰',
        example: { en: 'I found a great bargain at the market.', id: 'Aku menemukan barang murah bagus di pasar.', emoji: '🛒' },
        question: {
          en: 'Where did she find a bargain?',
          id: 'Di mana dia menemukan barang murah?',
          options: [
            { emoji: '🛒', text: 'The Market', ok: true },
            { emoji: '🏬', text: 'The Mall', ok: false },
            { emoji: '💻', text: 'The Website', ok: false },
            { emoji: '🚪', text: 'The Fitting Room', ok: false },
          ],
        },
      },
      {
        en: 'Price Tag',
        id: 'Label Harga',
        emoji: '🏷️',
        example: { en: 'I check the price tag before I buy it.', id: 'Aku memeriksa label harga sebelum membelinya.', emoji: '🏷️' },
        question: {
          en: 'What does she check?',
          id: 'Apa yang dia periksa?',
          options: [
            { emoji: '🏷️', text: 'The Price Tag', ok: true },
            { emoji: '📏', text: 'The Size', ok: false },
            { emoji: '🎨', text: 'The Color', ok: false },
            { emoji: '🏬', text: 'The Brand', ok: false },
          ],
        },
      },
      {
        en: 'Cashier',
        id: 'Kasir',
        emoji: '🧑‍💼',
        example: { en: 'The cashier scans my items quickly.', id: 'Kasir itu memindai barangku dengan cepat.', emoji: '🛍️' },
        question: {
          en: 'What does the cashier do?',
          id: 'Apa yang dilakukan kasir itu?',
          options: [
            { emoji: '🛍️', text: 'Scans Items', ok: true },
            { emoji: '👗', text: 'Fits Clothes', ok: false },
            { emoji: '👟', text: 'Fixes Shoes', ok: false },
            { emoji: '🎁', text: 'Wraps Gifts', ok: false },
          ],
        },
      },
      {
        en: 'Warranty',
        id: 'Garansi',
        emoji: '📜',
        example: { en: 'This laptop has a one-year warranty.', id: 'Laptop ini punya garansi satu tahun.', emoji: '💻' },
        question: {
          en: 'How long is the warranty?',
          id: 'Berapa lama garansinya?',
          options: [
            { emoji: '📅', text: 'One Year', ok: true },
            { emoji: '🗓️', text: 'One Month', ok: false },
            { emoji: '📆', text: 'Two Years', ok: false },
            { emoji: '🕕', text: 'Six Months', ok: false },
          ],
        },
      },
      {
        en: 'Return',
        id: 'Mengembalikan',
        emoji: '↩️',
        example: { en: "I return the shoes because they don't fit.", id: 'Aku mengembalikan sepatu itu karena tidak pas.', emoji: '📦' },
        question: {
          en: 'Why does she return the shoes?',
          id: 'Kenapa dia mengembalikan sepatunya?',
          options: [
            { emoji: '📏', text: "They Don't Fit", ok: true },
            { emoji: '🎨', text: 'They Are Ugly', ok: false },
            { emoji: '💵', text: 'They Are Expensive', ok: false },
            { emoji: '💔', text: 'They Are Broken', ok: false },
          ],
        },
      },
    ],
    dialogueHeading: 'Menukar Barang di Toko',
    dialogueLines: [
      { speaker: 'Dina', en: "Excuse me, I'd like to exchange this jacket. The size is too small.", id: 'Permisi, aku mau menukar jaket ini. Ukurannya terlalu kecil.' },
      { speaker: 'Kak Rian', en: 'Sure, do you have the receipt and the price tag?', id: 'Tentu, apakah kamu punya struk dan label harganya?' },
      { speaker: 'Dina', en: 'Yes, here they are. Is there a bigger size available?', id: 'Ya, ini dia. Apakah ada ukuran yang lebih besar?' },
      { speaker: 'Kak Rian', en: 'Let me check... Yes, we have one size bigger in the fitting room.', id: 'Aku periksa dulu... Ya, kami punya satu ukuran lebih besar di ruang pas.' },
      { speaker: 'Dina', en: 'Great, can I try it on first?', id: 'Bagus, boleh aku coba dulu?' },
      { speaker: 'Kak Rian', en: 'Of course, the fitting room is right over there.', id: 'Tentu, ruang pasnya ada di sana.' },
      { speaker: 'Dina', en: 'Perfect, thank you for your help.', id: 'Sempurna, terima kasih atas bantuannya.' },
    ],
    inferenceQuestions: [
      {
        question: 'What does Dina want to do?',
        questionId: 'Apa yang ingin dilakukan Dina?',
        options: [
          { emoji: '🔁', text: 'Exchange a Jacket', ok: true },
          { emoji: '💵', text: 'Get a Refund', ok: false },
          { emoji: '😤', text: 'Make a Complaint', ok: false },
          { emoji: '🏷️', text: 'Ask for a Discount', ok: false },
        ],
      },
      {
        question: "What is wrong with Dina's jacket?",
        questionId: 'Apa yang salah dengan jaket Dina?',
        options: [
          { emoji: '📏', text: 'It Is Too Small', ok: true },
          { emoji: '✂️', text: 'It Is Torn', ok: false },
          { emoji: '🎨', text: 'It Is the Wrong Color', ok: false },
          { emoji: '💵', text: 'It Is Too Expensive', ok: false },
        ],
      },
      {
        question: 'What will Dina probably do next?',
        questionId: 'Apa yang mungkin dilakukan Dina selanjutnya?',
        options: [
          { emoji: '🚪', text: 'Try On a Bigger Size', ok: true },
          { emoji: '💵', text: 'Ask for a Refund', ok: false },
          { emoji: '🚶', text: 'Leave the Store', ok: false },
          { emoji: '👕', text: 'Buy a New Shirt', ok: false },
        ],
      },
    ],
  },
  {
    id: 'sebelum-ujian',
    title: 'Sebelum Ujian (Before the Exam)',
    desc: '10 kalimat + 1 percakapan',
    items: [
      {
        en: 'Exam',
        id: 'Ujian',
        emoji: '📝',
        example: { en: 'The exam starts at eight o’clock.', id: 'Ujiannya mulai jam delapan.', emoji: '🕗' },
        question: {
          en: "What time does the exam start?",
          id: 'Jam berapa ujian dimulai?',
          options: [
            { emoji: '🕗', text: "Eight O'Clock", ok: true },
            { emoji: '🕘', text: "Nine O'Clock", ok: false },
            { emoji: '🕖', text: "Seven O'Clock", ok: false },
            { emoji: '🕙', text: "Ten O'Clock", ok: false },
          ],
        },
      },
      {
        en: 'Revise',
        id: 'Meninjau Ulang',
        emoji: '📓',
        example: { en: 'I revise my notes every evening.', id: 'Aku meninjau ulang catatanku setiap sore.', emoji: '🌇' },
        question: {
          en: 'When does she revise her notes?',
          id: 'Kapan dia meninjau ulang catatannya?',
          options: [
            { emoji: '🌇', text: 'Every Evening', ok: true },
            { emoji: '🌅', text: 'Every Morning', ok: false },
            { emoji: '📅', text: 'Every Weekend', ok: false },
            { emoji: '📆', text: 'Once a Month', ok: false },
          ],
        },
      },
      {
        en: 'Grade',
        id: 'Nilai',
        emoji: '🅰️',
        example: { en: 'I get a good grade on the test.', id: 'Aku dapat nilai bagus di ujian itu.', emoji: '✅' },
        question: {
          en: 'What does she get?',
          id: 'Apa yang dia dapat?',
          options: [
            { emoji: '✅', text: 'A Good Grade', ok: true },
            { emoji: '❌', text: 'A Bad Grade', ok: false },
            { emoji: '🚫', text: 'No Grade', ok: false },
            { emoji: '⏰', text: 'A Late Grade', ok: false },
          ],
        },
      },
      {
        en: 'Homework',
        id: 'PR',
        emoji: '📔',
        example: { en: 'I finish my homework before dinner.', id: 'Aku menyelesaikan PR-ku sebelum makan malam.', emoji: '🍽️' },
        question: {
          en: 'When does she finish homework?',
          id: 'Kapan dia menyelesaikan PR-nya?',
          options: [
            { emoji: '🍽️', text: 'Before Dinner', ok: true },
            { emoji: '🌙', text: 'After Dinner', ok: false },
            { emoji: '🏫', text: 'During Class', ok: false },
            { emoji: '🚶', text: 'At School', ok: false },
          ],
        },
      },
      {
        en: 'Deadline',
        id: 'Tenggat Waktu',
        emoji: '⏳',
        example: { en: 'The deadline for the essay is Friday.', id: 'Tenggat waktu esai itu hari Jumat.', emoji: '📅' },
        question: {
          en: 'When is the deadline?',
          id: 'Kapan tenggat waktunya?',
          options: [
            { emoji: '📅', text: 'Friday', ok: true },
            { emoji: '🗓️', text: 'Monday', ok: false },
            { emoji: '📆', text: 'Wednesday', ok: false },
            { emoji: '☀️', text: 'Sunday', ok: false },
          ],
        },
      },
      {
        en: 'Textbook',
        id: 'Buku Pelajaran',
        emoji: '📚',
        example: { en: 'I borrow a textbook from the library.', id: 'Aku meminjam buku pelajaran dari perpustakaan.', emoji: '📚' },
        question: {
          en: 'Where does she borrow a textbook?',
          id: 'Di mana dia meminjam buku pelajaran?',
          options: [
            { emoji: '📚', text: 'The Library', ok: true },
            { emoji: '🏪', text: 'The Bookstore', ok: false },
            { emoji: '🧑‍🤝‍🧑', text: 'Her Friend', ok: false },
            { emoji: '🧑‍🏫', text: 'The Teacher', ok: false },
          ],
        },
      },
      {
        en: 'Classmate',
        id: 'Teman Sekelas',
        emoji: '🧑‍🎓',
        example: { en: 'My classmate helps me with math.', id: 'Teman sekelasku membantuku dengan matematika.', emoji: '🔢' },
        question: {
          en: 'Who helps her with math?',
          id: 'Siapa yang membantunya dengan matematika?',
          options: [
            { emoji: '🧑‍🎓', text: 'Her Classmate', ok: true },
            { emoji: '🧑‍🏫', text: 'Her Teacher', ok: false },
            { emoji: '👧', text: 'Her Sister', ok: false },
            { emoji: '🏘️', text: 'Her Neighbor', ok: false },
          ],
        },
      },
      {
        en: 'Assignment',
        id: 'Tugas',
        emoji: '📄',
        example: { en: 'I submit my assignment online.', id: 'Aku mengirim tugasku secara daring.', emoji: '💻' },
        question: {
          en: 'How does she submit her assignment?',
          id: 'Bagaimana dia mengirim tugasnya?',
          options: [
            { emoji: '💻', text: 'Online', ok: true },
            { emoji: '✉️', text: 'By Mail', ok: false },
            { emoji: '🚶', text: 'In Person', ok: false },
            { emoji: '📞', text: 'By Phone', ok: false },
          ],
        },
      },
      {
        en: 'Report Card',
        id: 'Rapor',
        emoji: '📋',
        example: { en: 'I show my report card to my parents.', id: 'Aku menunjukkan raporku pada orang tuaku.', emoji: '👨‍👩‍👧' },
        question: {
          en: 'Who does she show her report card to?',
          id: 'Dia menunjukkan rapornya pada siapa?',
          options: [
            { emoji: '👨‍👩‍👧', text: 'Her Parents', ok: true },
            { emoji: '🧑‍🤝‍🧑', text: 'Her Friends', ok: false },
            { emoji: '🧑‍🏫', text: 'Her Teacher', ok: false },
            { emoji: '🧑‍🎓', text: 'Her Classmate', ok: false },
          ],
        },
      },
      {
        en: 'Study',
        id: 'Belajar',
        emoji: '📖',
        example: { en: 'I study with my friends at the library.', id: 'Aku belajar dengan teman-temanku di perpustakaan.', emoji: '🧑‍🤝‍🧑' },
        question: {
          en: 'Where does she study with friends?',
          id: 'Di mana dia belajar dengan teman-temannya?',
          options: [
            { emoji: '📚', text: 'The Library', ok: true },
            { emoji: '🍽️', text: 'The Cafeteria', ok: false },
            { emoji: '🛝', text: 'The Playground', ok: false },
            { emoji: '🏠', text: 'Home', ok: false },
          ],
        },
      },
    ],
    dialogueHeading: 'Sebelum Ujian',
    dialogueLines: [
      { speaker: 'Fajar', en: 'Are you ready for the exam tomorrow?', id: 'Kamu sudah siap untuk ujian besok?' },
      { speaker: 'Nadia', en: "Almost. I've been revising my notes every evening this week.", id: 'Hampir. Aku sudah meninjau ulang catatanku setiap sore minggu ini.' },
      { speaker: 'Fajar', en: "Same here, but I'm still worried about the math section.", id: 'Sama, tapi aku masih khawatir soal bagian matematika.' },
      { speaker: 'Nadia', en: 'Don’t worry, we can study together at the library after school.', id: 'Tenang saja, kita bisa belajar bersama di perpustakaan sepulang sekolah.' },
      { speaker: 'Fajar', en: 'That would help a lot. Did you finish the homework too?', id: 'Itu akan sangat membantu. Kamu sudah selesaikan PR juga?' },
      { speaker: 'Nadia', en: 'Yes, I submitted the assignment online last night before the deadline.', id: 'Ya, aku mengirim tugas secara daring semalam sebelum tenggat waktu.' },
      { speaker: 'Fajar', en: "Great, let's meet at four o'clock then.", id: 'Bagus, ayo kita bertemu jam empat.' },
    ],
    inferenceQuestions: [
      {
        question: 'What are Fajar and Nadia mainly talking about?',
        questionId: 'Fajar dan Nadia sebenarnya membicarakan apa?',
        options: [
          { emoji: '📝', text: 'Preparing for an Exam', ok: true },
          { emoji: '🏝️', text: 'Planning a Trip', ok: false },
          { emoji: '🎬', text: 'Choosing a Movie', ok: false },
          { emoji: '💻', text: 'Fixing a Computer', ok: false },
        ],
      },
      {
        question: 'How does Fajar feel about the math section?',
        questionId: 'Bagaimana perasaan Fajar soal bagian matematika?',
        options: [
          { emoji: '😟', text: 'Worried', ok: true },
          { emoji: '😎', text: 'Confident', ok: false },
          { emoji: '🤩', text: 'Excited', ok: false },
          { emoji: '😑', text: 'Bored', ok: false },
        ],
      },
      {
        question: 'What will they do after school?',
        questionId: 'Apa yang akan mereka lakukan sepulang sekolah?',
        options: [
          { emoji: '📚', text: 'Study Together at the Library', ok: true },
          { emoji: '🎬', text: 'Watch a Movie', ok: false },
          { emoji: '🛍️', text: 'Go Shopping', ok: false },
          { emoji: '⚽', text: 'Play Sports', ok: false },
        ],
      },
    ],
  },
  {
    id: 'pilih-film',
    title: 'Memilih Film (Choosing a Movie)',
    desc: '10 kalimat + 1 percakapan',
    items: [
      {
        en: 'Genre',
        id: 'Genre',
        emoji: '🎬',
        example: { en: 'I like the action genre the most.', id: 'Aku paling suka genre aksi.', emoji: '💥' },
        question: {
          en: 'What genre does she like most?',
          id: 'Genre apa yang paling dia suka?',
          options: [
            { emoji: '💥', text: 'Action', ok: true },
            { emoji: '😂', text: 'Comedy', ok: false },
            { emoji: '👻', text: 'Horror', ok: false },
            { emoji: '💖', text: 'Romance', ok: false },
          ],
        },
      },
      {
        en: 'Trailer',
        id: 'Cuplikan Film',
        emoji: '🎞️',
        example: { en: 'I watch the trailer before buying a ticket.', id: 'Aku menonton cuplikan filmnya sebelum membeli tiket.', emoji: '🎫' },
        question: {
          en: 'When does she watch the trailer?',
          id: 'Kapan dia menonton cuplikan filmnya?',
          options: [
            { emoji: '🎫', text: 'Before Buying a Ticket', ok: true },
            { emoji: '🍿', text: 'After the Movie', ok: false },
            { emoji: '🎬', text: 'During the Movie', ok: false },
            { emoji: '🚫', text: 'Instead of the Movie', ok: false },
          ],
        },
      },
      {
        en: 'Subtitle',
        id: 'Subtitel',
        emoji: '💬',
        example: { en: "I read the subtitle because it's in French.", id: 'Aku membaca subtitel karena filmnya berbahasa Prancis.', emoji: '🇫🇷' },
        question: {
          en: 'Why does she read the subtitle?',
          id: 'Kenapa dia membaca subtitel?',
          options: [
            { emoji: '🇫🇷', text: "It's in French", ok: true },
            { emoji: '🤫', text: "It's Too Quiet", ok: false },
            { emoji: '⚡', text: "It's Too Fast", ok: false },
            { emoji: '😴', text: "It's Boring", ok: false },
          ],
        },
      },
      {
        en: 'Streaming',
        id: 'Layanan Streaming',
        emoji: '📺',
        example: { en: 'I watch movies on a streaming app.', id: 'Aku menonton film di aplikasi streaming.', emoji: '📱' },
        question: {
          en: 'Where does she watch movies?',
          id: 'Di mana dia menonton film?',
          options: [
            { emoji: '📱', text: 'A Streaming App', ok: true },
            { emoji: '🎬', text: 'The Cinema', ok: false },
            { emoji: '📺', text: 'The TV', ok: false },
            { emoji: '💿', text: 'A DVD', ok: false },
          ],
        },
      },
      {
        en: 'Episode',
        id: 'Episode',
        emoji: '📀',
        example: { en: 'I watch one episode every night.', id: 'Aku menonton satu episode setiap malam.', emoji: '🌙' },
        question: {
          en: 'How many episodes does she watch a night?',
          id: 'Berapa episode yang dia tonton per malam?',
          options: [
            { emoji: '1️⃣', text: 'One', ok: true },
            { emoji: '2️⃣', text: 'Two', ok: false },
            { emoji: '3️⃣', text: 'Three', ok: false },
            { emoji: '5️⃣', text: 'Five', ok: false },
          ],
        },
      },
      {
        en: 'Review',
        id: 'Ulasan',
        emoji: '⭐',
        example: { en: 'I read the review before choosing a movie.', id: 'Aku membaca ulasan sebelum memilih film.', emoji: '📝' },
        question: {
          en: 'When does she read the review?',
          id: 'Kapan dia membaca ulasannya?',
          options: [
            { emoji: '📝', text: 'Before Choosing', ok: true },
            { emoji: '🍿', text: 'After Watching', ok: false },
            { emoji: '🎬', text: 'During the Movie', ok: false },
            { emoji: '🚫', text: 'Never', ok: false },
          ],
        },
      },
      {
        en: 'Plot',
        id: 'Alur Cerita',
        emoji: '📖',
        example: { en: 'The plot of the movie is very exciting.', id: 'Alur cerita film itu sangat menegangkan.', emoji: '😲' },
        question: {
          en: 'What is very exciting?',
          id: 'Apa yang sangat menegangkan?',
          options: [
            { emoji: '📖', text: 'The Plot', ok: true },
            { emoji: '🧑‍🎤', text: 'The Actor', ok: false },
            { emoji: '🎵', text: 'The Soundtrack', ok: false },
            { emoji: '🎞️', text: 'The Trailer', ok: false },
          ],
        },
      },
      {
        en: 'Actor',
        id: 'Aktor',
        emoji: '🧑‍🎤',
        example: { en: 'My favorite actor is in the new movie.', id: 'Aktor favoritku ada di film baru itu.', emoji: '⭐' },
        question: {
          en: 'Who is in the new movie?',
          id: 'Siapa yang ada di film baru itu?',
          options: [
            { emoji: '⭐', text: 'Her Favorite Actor', ok: true },
            { emoji: '🧑‍🏫', text: 'Her Teacher', ok: false },
            { emoji: '🧑‍🤝‍🧑', text: 'Her Friend', ok: false },
            { emoji: '🏘️', text: 'Her Neighbor', ok: false },
          ],
        },
      },
      {
        en: 'Soundtrack',
        id: 'Musik Latar',
        emoji: '🎵',
        example: { en: 'I love the soundtrack of that film.', id: 'Aku suka musik latar film itu.', emoji: '🎧' },
        question: {
          en: 'What does she love about the film?',
          id: 'Apa yang dia suka dari film itu?',
          options: [
            { emoji: '🎧', text: 'The Soundtrack', ok: true },
            { emoji: '🧑‍🎤', text: 'The Actor', ok: false },
            { emoji: '📖', text: 'The Plot', ok: false },
            { emoji: '🎬', text: 'The Genre', ok: false },
          ],
        },
      },
      {
        en: 'Premiere',
        id: 'Pemutaran Perdana',
        emoji: '🎥',
        example: { en: 'We go to the movie premiere together.', id: 'Kami pergi ke pemutaran perdana film itu bersama.', emoji: '🧑‍🤝‍🧑' },
        question: {
          en: 'How do they go to the premiere?',
          id: 'Bagaimana mereka pergi ke pemutaran perdana?',
          options: [
            { emoji: '🧑‍🤝‍🧑', text: 'Together', ok: true },
            { emoji: '🧍', text: 'Alone', ok: false },
            { emoji: '🚌', text: 'By Bus', ok: false },
            { emoji: '🚲', text: 'By Bike', ok: false },
          ],
        },
      },
    ],
    dialogueHeading: 'Memilih Film',
    dialogueLines: [
      { speaker: 'Yoga', en: 'What movie should we watch tonight?', id: 'Film apa yang harus kita tonton malam ini?' },
      { speaker: 'Kiki', en: 'I saw the trailer for a new action movie. It looks exciting.', id: 'Aku lihat cuplikan film aksi baru. Kelihatannya seru.' },
      { speaker: 'Yoga', en: 'I read a review that said the plot is really good.', id: 'Aku baca ulasan yang bilang alur ceritanya bagus sekali.' },
      { speaker: 'Kiki', en: 'Perfect, and my favorite actor is in it too.', id: 'Sempurna, dan aktor favoritku juga ada di situ.' },
      { speaker: 'Yoga', en: 'Great, should we watch it on a streaming app or go to the cinema?', id: 'Bagus, kita tonton di aplikasi streaming atau ke bioskop?' },
      { speaker: 'Kiki', en: "Let's go to the cinema, it's more fun with popcorn.", id: 'Ayo ke bioskop, lebih seru dengan popcorn.' },
      { speaker: 'Yoga', en: "Sounds good, let's go after dinner.", id: 'Boleh, ayo pergi setelah makan malam.' },
    ],
    inferenceQuestions: [
      {
        question: 'What are Yoga and Kiki mainly deciding?',
        questionId: 'Yoga dan Kiki sebenarnya sedang memutuskan apa?',
        options: [
          { emoji: '🎬', text: 'Which Movie to Watch', ok: true },
          { emoji: '🍽️', text: 'What to Eat for Dinner', ok: false },
          { emoji: '📚', text: 'Where to Study', ok: false },
          { emoji: '📖', text: 'What Book to Read', ok: false },
        ],
      },
      {
        question: 'Why does Kiki want to watch the movie?',
        questionId: 'Kenapa Kiki ingin menonton film itu?',
        options: [
          { emoji: '⭐', text: 'Her Favorite Actor Is in It', ok: true },
          { emoji: '💬', text: 'It Has Subtitles', ok: false },
          { emoji: '🆓', text: 'It Is Free', ok: false },
          { emoji: '⏱️', text: 'It Is Short', ok: false },
        ],
      },
      {
        question: 'Where will they watch the movie?',
        questionId: 'Di mana mereka akan menonton film itu?',
        options: [
          { emoji: '🎬', text: 'The Cinema', ok: true },
          { emoji: '📱', text: 'A Streaming App', ok: false },
          { emoji: '🏠', text: "Kiki's House", ok: false },
          { emoji: '📚', text: 'The Library', ok: false },
        ],
      },
    ],
  },
  {
    id: 'pendapat-tentang-buku',
    title: 'Membahas Buku (An Opinion About a Book)',
    desc: '10 kalimat + 1 percakapan',
    items: [
      {
        en: 'Opinion',
        id: 'Pendapat',
        emoji: '💭',
        example: { en: 'I share my opinion about the book.', id: 'Aku berbagi pendapatku tentang buku itu.', emoji: '📖' },
        question: {
          en: 'What does she share?',
          id: 'Apa yang dia bagikan?',
          options: [
            { emoji: '💭', text: 'Her Opinion', ok: true },
            { emoji: '🍪', text: 'Her Snack', ok: false },
            { emoji: '📖', text: 'Her Book', ok: false },
            { emoji: '📓', text: 'Her Notes', ok: false },
          ],
        },
      },
      {
        en: 'Agree',
        id: 'Setuju',
        emoji: '👍',
        example: { en: 'I agree with her about the ending.', id: 'Aku setuju dengannya tentang akhir ceritanya.', emoji: '🏁' },
        question: {
          en: 'What does she agree about?',
          id: 'Dia setuju tentang apa?',
          options: [
            { emoji: '🏁', text: 'The Ending', ok: true },
            { emoji: '📕', text: 'The Cover', ok: false },
            { emoji: '💵', text: 'The Price', ok: false },
            { emoji: '✍️', text: 'The Author', ok: false },
          ],
        },
      },
      {
        en: 'Disagree',
        id: 'Tidak Setuju',
        emoji: '👎',
        example: { en: 'I disagree with the negative review.', id: 'Aku tidak setuju dengan ulasan negatif itu.', emoji: '⭐' },
        question: {
          en: 'What does she disagree with?',
          id: 'Dia tidak setuju dengan apa?',
          options: [
            { emoji: '⭐', text: 'The Negative Review', ok: true },
            { emoji: '🌟', text: 'The Positive Review', ok: false },
            { emoji: '✍️', text: 'The Author', ok: false },
            { emoji: '💵', text: 'The Price', ok: false },
          ],
        },
      },
      {
        en: 'Recommend',
        id: 'Merekomendasikan',
        emoji: '👉',
        example: { en: 'I recommend this book to my friend.', id: 'Aku merekomendasikan buku ini pada temanku.', emoji: '🧑‍🤝‍🧑' },
        question: {
          en: 'Who does she recommend the book to?',
          id: 'Dia merekomendasikan buku itu pada siapa?',
          options: [
            { emoji: '🧑‍🤝‍🧑', text: 'Her Friend', ok: true },
            { emoji: '🧑‍🏫', text: 'Her Teacher', ok: false },
            { emoji: '👧', text: 'Her Sister', ok: false },
            { emoji: '🏘️', text: 'Her Neighbor', ok: false },
          ],
        },
      },
      {
        en: 'Impressed',
        id: 'Terkesan',
        emoji: '😍',
        example: { en: 'I am impressed by the ending.', id: 'Aku terkesan dengan akhir ceritanya.', emoji: '🏆' },
        question: {
          en: 'What is she impressed by?',
          id: 'Dia terkesan dengan apa?',
          options: [
            { emoji: '🏁', text: 'The Ending', ok: true },
            { emoji: '📕', text: 'The Cover', ok: false },
            { emoji: '💵', text: 'The Price', ok: false },
            { emoji: '🔤', text: 'The Title', ok: false },
          ],
        },
      },
      {
        en: 'Disappointed',
        id: 'Kecewa',
        emoji: '😞',
        example: { en: 'I am disappointed by the slow start.', id: 'Aku kecewa dengan awal cerita yang lambat.', emoji: '🐌' },
        question: {
          en: 'What is she disappointed by?',
          id: 'Dia kecewa dengan apa?',
          options: [
            { emoji: '🐌', text: 'The Slow Start', ok: true },
            { emoji: '🏁', text: 'The Ending', ok: false },
            { emoji: '📕', text: 'The Cover', ok: false },
            { emoji: '💵', text: 'The Price', ok: false },
          ],
        },
      },
      {
        en: 'Curious',
        id: 'Penasaran',
        emoji: '🤔',
        example: { en: 'I am curious about the next chapter.', id: 'Aku penasaran dengan bab selanjutnya.', emoji: '❓' },
        question: {
          en: 'What is she curious about?',
          id: 'Dia penasaran tentang apa?',
          options: [
            { emoji: '📖', text: 'The Next Chapter', ok: true },
            { emoji: '📕', text: 'The Cover', ok: false },
            { emoji: '✍️', text: 'The Author', ok: false },
            { emoji: '💵', text: 'The Price', ok: false },
          ],
        },
      },
      {
        en: 'Enjoyable',
        id: 'Menyenangkan',
        emoji: '😊',
        example: { en: 'The story is very enjoyable.', id: 'Ceritanya sangat menyenangkan.', emoji: '📚' },
        question: {
          en: 'What is very enjoyable?',
          id: 'Apa yang sangat menyenangkan?',
          options: [
            { emoji: '📖', text: 'The Story', ok: true },
            { emoji: '📕', text: 'The Cover', ok: false },
            { emoji: '💵', text: 'The Price', ok: false },
            { emoji: '🔤', text: 'The Font', ok: false },
          ],
        },
      },
      {
        en: 'Favorite',
        id: 'Favorit',
        emoji: '❤️',
        example: { en: 'This is my favorite book this year.', id: 'Ini buku favoritku tahun ini.', emoji: '❤️' },
        question: {
          en: 'What is her favorite book?',
          id: 'Apa buku favoritnya?',
          options: [
            { emoji: '📖', text: 'This Book', ok: true },
            { emoji: '📚', text: 'A Different Book', ok: false },
            { emoji: '🚫', text: 'No Book', ok: false },
            { emoji: '📚', text: 'Every Book', ok: false },
          ],
        },
      },
      {
        en: 'Interesting',
        id: 'Menarik',
        emoji: '✨',
        example: { en: 'I find the characters very interesting.', id: 'Aku merasa tokoh-tokohnya sangat menarik.', emoji: '🎭' },
        question: {
          en: 'What does she find interesting?',
          id: 'Apa yang dia rasa menarik?',
          options: [
            { emoji: '🧑‍🤝‍🧑', text: 'The Characters', ok: true },
            { emoji: '📕', text: 'The Cover', ok: false },
            { emoji: '💵', text: 'The Price', ok: false },
            { emoji: '🔤', text: 'The Font', ok: false },
          ],
        },
      },
    ],
    dialogueHeading: 'Membahas Buku',
    dialogueLines: [
      { speaker: 'Tania', en: 'Have you finished the book I recommended?', id: 'Kamu sudah selesai baca buku yang aku rekomendasikan?' },
      { speaker: 'Bima', en: 'Yes! I was disappointed by the slow start, but the ending impressed me.', id: 'Ya! Aku kecewa dengan awal yang lambat, tapi akhirnya membuatku terkesan.' },
      { speaker: 'Tania', en: 'Really? I actually really enjoyed it from the beginning.', id: 'Benarkah? Aku malah menikmatinya sejak awal.' },
      { speaker: 'Bima', en: 'I guess we disagree a little then. What was your favorite part?', id: 'Berarti kita sedikit tidak sependapat. Bagian favoritmu apa?' },
      { speaker: 'Tania', en: 'My favorite part was the middle, when the characters became close friends.', id: 'Bagian favoritku adalah pertengahan, saat tokoh-tokohnya jadi sahabat dekat.' },
      { speaker: 'Bima', en: "That's true, the characters were very interesting.", id: 'Benar, tokoh-tokohnya sangat menarik.' },
      { speaker: 'Tania', en: "I'm curious what you think about the next book in the series.", id: 'Aku penasaran pendapatmu soal buku berikutnya di seri ini.' },
    ],
    inferenceQuestions: [
      {
        question: 'What are Tania and Bima mainly talking about?',
        questionId: 'Tania dan Bima sebenarnya membicarakan apa?',
        options: [
          { emoji: '📖', text: 'Their Opinions About a Book', ok: true },
          { emoji: '🎬', text: 'A New Movie', ok: false },
          { emoji: '📝', text: 'An Upcoming Exam', ok: false },
          { emoji: '🏝️', text: 'A Weekend Trip', ok: false },
        ],
      },
      {
        question: 'How does Bima feel about the ending of the book?',
        questionId: 'Bagaimana perasaan Bima soal akhir buku itu?',
        options: [
          { emoji: '😍', text: 'Impressed', ok: true },
          { emoji: '😞', text: 'Disappointed', ok: false },
          { emoji: '😑', text: 'Bored', ok: false },
          { emoji: '😕', text: 'Confused', ok: false },
        ],
      },
      {
        question: 'What do Tania and Bima disagree about?',
        questionId: 'Tania dan Bima tidak sependapat soal apa?',
        options: [
          { emoji: '🐌', text: 'The Beginning of the Book', ok: true },
          { emoji: '🔤', text: 'The Title of the Book', ok: false },
          { emoji: '💵', text: 'The Price of the Book', ok: false },
          { emoji: '✍️', text: 'The Author of the Book', ok: false },
        ],
      },
    ],
  },
  {
    id: 'cari-kafe-baru',
    title: 'Mencari Kafe Baru (Finding a New Café)',
    desc: '10 kalimat + 1 percakapan',
    items: [
      {
        en: 'Neighborhood',
        id: 'Lingkungan Sekitar',
        emoji: '🏘️',
        example: { en: 'I live in a quiet neighborhood.', id: 'Aku tinggal di lingkungan yang tenang.', emoji: '🤫' },
        question: {
          en: 'What kind of neighborhood does she live in?',
          id: 'Lingkungan seperti apa tempat dia tinggal?',
          options: [
            { emoji: '🤫', text: 'Quiet', ok: true },
            { emoji: '📢', text: 'Noisy', ok: false },
            { emoji: '🚦', text: 'Crowded', ok: false },
            { emoji: '🆕', text: 'New', ok: false },
          ],
        },
      },
      {
        en: 'Landmark',
        id: 'Tengara',
        emoji: '🗼',
        example: { en: 'The clock tower is a famous landmark.', id: 'Menara jam itu tengara yang terkenal.', emoji: '🕰️' },
        question: {
          en: 'What is a famous landmark?',
          id: 'Apa tengara yang terkenal?',
          options: [
            { emoji: '🕰️', text: 'The Clock Tower', ok: true },
            { emoji: '☕', text: 'The Café', ok: false },
            { emoji: '🏫', text: 'The School', ok: false },
            { emoji: '🏞️', text: 'The Park', ok: false },
          ],
        },
      },
      {
        en: 'Crowded',
        id: 'Ramai',
        emoji: '🚦',
        example: { en: 'The café is very crowded on weekends.', id: 'Kafe itu sangat ramai di akhir pekan.', emoji: '☕' },
        question: {
          en: 'When is the café crowded?',
          id: 'Kapan kafe itu ramai?',
          options: [
            { emoji: '📅', text: 'Weekends', ok: true },
            { emoji: '🗓️', text: 'Weekdays', ok: false },
            { emoji: '🌅', text: 'Mornings', ok: false },
            { emoji: '🌃', text: 'Midnight', ok: false },
          ],
        },
      },
      {
        en: 'Nearby',
        id: 'Di Dekat Situ',
        emoji: '📍',
        example: { en: 'There is a bakery nearby the café.', id: 'Ada toko roti di dekat kafe itu.', emoji: '🥖' },
        question: {
          en: 'What is nearby the café?',
          id: 'Apa yang ada di dekat kafe itu?',
          options: [
            { emoji: '🥖', text: 'A Bakery', ok: true },
            { emoji: '🏫', text: 'A School', ok: false },
            { emoji: '🏦', text: 'A Bank', ok: false },
            { emoji: '🏥', text: 'A Hospital', ok: false },
          ],
        },
      },
      {
        en: 'Directions',
        id: 'Petunjuk Arah',
        emoji: '🧭',
        example: { en: 'I ask for directions to the café.', id: 'Aku meminta petunjuk arah ke kafe itu.', emoji: '🙋' },
        question: {
          en: 'What does she ask for?',
          id: 'Apa yang dia minta?',
          options: [
            { emoji: '🧭', text: 'Directions', ok: true },
            { emoji: '📜', text: 'A Menu', ok: false },
            { emoji: '🪑', text: 'A Table', ok: false },
            { emoji: '🧾', text: 'A Receipt', ok: false },
          ],
        },
      },
      {
        en: 'Intersection',
        id: 'Persimpangan',
        emoji: '🚸',
        example: { en: 'Turn left at the intersection.', id: 'Belok kiri di persimpangan.', emoji: '⬅️' },
        question: {
          en: 'Where does she turn left?',
          id: 'Di mana dia belok kiri?',
          options: [
            { emoji: '🚸', text: 'The Intersection', ok: true },
            { emoji: '🥖', text: 'The Bakery', ok: false },
            { emoji: '☕', text: 'The Café', ok: false },
            { emoji: '🏞️', text: 'The Park', ok: false },
          ],
        },
      },
      {
        en: 'Downtown',
        id: 'Pusat Kota',
        emoji: '🏙️',
        example: { en: 'The new café is downtown.', id: 'Kafe baru itu ada di pusat kota.', emoji: '🏙️' },
        question: {
          en: 'Where is the new café?',
          id: 'Di mana kafe barunya?',
          options: [
            { emoji: '🏙️', text: 'Downtown', ok: true },
            { emoji: '🏘️', text: 'Uptown', ok: false },
            { emoji: '🌳', text: 'In the Suburbs', ok: false },
            { emoji: '🏖️', text: 'By the Beach', ok: false },
          ],
        },
      },
      {
        en: 'Sidewalk',
        id: 'Trotoar',
        emoji: '🚶',
        example: { en: 'We walk along the sidewalk to the café.', id: 'Kami berjalan di sepanjang trotoar menuju kafe.', emoji: '👣' },
        question: {
          en: 'What do they walk along?',
          id: 'Mereka berjalan di sepanjang apa?',
          options: [
            { emoji: '🚶', text: 'The Sidewalk', ok: true },
            { emoji: '🛣️', text: 'The Road', ok: false },
            { emoji: '🏖️', text: 'The Beach', ok: false },
            { emoji: '🌉', text: 'The Bridge', ok: false },
          ],
        },
      },
      {
        en: 'Signpost',
        id: 'Papan Penunjuk',
        emoji: '🪧',
        example: { en: 'I look for a signpost with the café name.', id: 'Aku mencari papan penunjuk dengan nama kafenya.', emoji: '🔎' },
        question: {
          en: 'What does she look for?',
          id: 'Apa yang dia cari?',
          options: [
            { emoji: '🪧', text: 'A Signpost', ok: true },
            { emoji: '📜', text: 'A Menu', ok: false },
            { emoji: '🎫', text: 'A Ticket', ok: false },
            { emoji: '🗺️', text: 'A Map', ok: false },
          ],
        },
      },
      {
        en: 'Located',
        id: 'Berlokasi',
        emoji: '📌',
        example: { en: 'The café is located near the park.', id: 'Kafe itu berlokasi dekat taman.', emoji: '🏞️' },
        question: {
          en: 'Where is the café located?',
          id: 'Di mana kafe itu berlokasi?',
          options: [
            { emoji: '🏞️', text: 'Near the Park', ok: true },
            { emoji: '🏫', text: 'Near the School', ok: false },
            { emoji: '🏦', text: 'Near the Bank', ok: false },
            { emoji: '🏥', text: 'Near the Hospital', ok: false },
          ],
        },
      },
    ],
    dialogueHeading: 'Mencari Kafe Baru',
    dialogueLines: [
      { speaker: 'Putri', en: 'Do you know where the new café downtown is?', id: 'Kamu tahu di mana kafe baru di pusat kota itu?' },
      { speaker: 'Andi', en: "I think it's located near the park, close to the old clock tower landmark.", id: 'Kurasa berlokasi dekat taman, dekat tengara menara jam tua.' },
      { speaker: 'Putri', en: 'Okay, should we ask for directions when we get there?', id: 'Baik, apakah kita perlu tanya arah kalau sudah sampai sana?' },
      { speaker: 'Andi', en: 'We might need to. The neighborhood has a lot of small streets.', id: 'Mungkin perlu. Lingkungan itu punya banyak jalan kecil.' },
      { speaker: 'Putri', en: "True. I heard the café gets really crowded on weekends.", id: 'Benar. Aku dengar kafe itu sangat ramai di akhir pekan.' },
      { speaker: 'Andi', en: "Let's go early then, before it gets too busy.", id: 'Ayo berangkat lebih awal, sebelum terlalu ramai.' },
      { speaker: 'Putri', en: 'Good idea, we can walk along the sidewalk from here.', id: 'Ide bagus, kita bisa jalan kaki di trotoar dari sini.' },
    ],
    inferenceQuestions: [
      {
        question: 'What are Putri and Andi mainly talking about?',
        questionId: 'Putri dan Andi sebenarnya membicarakan apa?',
        options: [
          { emoji: '☕', text: 'Finding a New Café', ok: true },
          { emoji: '🎬', text: 'Choosing a Movie', ok: false },
          { emoji: '📝', text: 'Studying for an Exam', ok: false },
          { emoji: '🔁', text: 'Returning an Item', ok: false },
        ],
      },
      {
        question: 'Where is the new café located?',
        questionId: 'Di mana kafe baru itu berlokasi?',
        options: [
          { emoji: '🏞️', text: 'Near the Park', ok: true },
          { emoji: '🏫', text: 'Near the School', ok: false },
          { emoji: '🏖️', text: 'Near the Beach', ok: false },
          { emoji: '🚉', text: 'Near the Station', ok: false },
        ],
      },
      {
        question: 'What will they do to avoid the crowd?',
        questionId: 'Apa yang akan mereka lakukan agar tidak kena ramai?',
        options: [
          { emoji: '⏰', text: 'Go Early', ok: true },
          { emoji: '🌙', text: 'Go at Night', ok: false },
          { emoji: '📞', text: 'Call First', ok: false },
          { emoji: '📅', text: 'Go a Different Day', ok: false },
        ],
      },
    ],
  },
  {
    id: 'yuk-daur-ulang',
    title: 'Yuk, Daur Ulang! (Let\'s Recycle)',
    desc: '10 kalimat + 1 percakapan',
    items: [
      {
        en: 'Recycle',
        id: 'Daur Ulang',
        emoji: '♻️',
        example: { en: 'We recycle plastic bottles every week.', id: 'Kami mendaur ulang botol plastik setiap minggu.', emoji: '📅' },
        question: {
          en: 'How often do they recycle?',
          id: 'Seberapa sering mereka mendaur ulang?',
          options: [
            { emoji: '📅', text: 'Every Week', ok: true },
            { emoji: '☀️', text: 'Every Day', ok: false },
            { emoji: '📆', text: 'Once a Year', ok: false },
            { emoji: '🚫', text: 'Never', ok: false },
          ],
        },
      },
      {
        en: 'Environment',
        id: 'Lingkungan',
        emoji: '🌍',
        example: { en: 'We protect the environment together.', id: 'Kami menjaga lingkungan bersama-sama.', emoji: '🌍' },
        question: {
          en: 'What do they protect?',
          id: 'Apa yang mereka jaga?',
          options: [
            { emoji: '🌍', text: 'The Environment', ok: true },
            { emoji: '🏫', text: 'The School', ok: false },
            { emoji: '☕', text: 'The Café', ok: false },
            { emoji: '🏞️', text: 'The Park', ok: false },
          ],
        },
      },
      {
        en: 'Pollution',
        id: 'Polusi',
        emoji: '🏭',
        example: { en: 'The river has less pollution now.', id: 'Sungai itu kini lebih sedikit polusinya.', emoji: '🏞️' },
        question: {
          en: 'What has less pollution?',
          id: 'Apa yang lebih sedikit polusinya?',
          options: [
            { emoji: '🏞️', text: 'The River', ok: true },
            { emoji: '☁️', text: 'The Sky', ok: false },
            { emoji: '🌲', text: 'The Forest', ok: false },
            { emoji: '🏖️', text: 'The Beach', ok: false },
          ],
        },
      },
      {
        en: 'Plastic',
        id: 'Plastik',
        emoji: '🧴',
        example: { en: 'I avoid using plastic bags.', id: 'Aku menghindari pemakaian kantong plastik.', emoji: '🛍️' },
        question: {
          en: 'What does she avoid using?',
          id: 'Apa yang dia hindari?',
          options: [
            { emoji: '🛍️', text: 'Plastic Bags', ok: true },
            { emoji: '📦', text: 'Paper Bags', ok: false },
            { emoji: '👜', text: 'Cloth Bags', ok: false },
            { emoji: '📦', text: 'Boxes', ok: false },
          ],
        },
      },
      {
        en: 'Compost',
        id: 'Kompos',
        emoji: '🍂',
        example: { en: 'We compost our food waste.', id: 'Kami mengomposkan sisa makanan kami.', emoji: '🍽️' },
        question: {
          en: 'What do they compost?',
          id: 'Apa yang mereka komposkan?',
          options: [
            { emoji: '🍽️', text: 'Food Waste', ok: true },
            { emoji: '🧴', text: 'Plastic', ok: false },
            { emoji: '🔩', text: 'Metal', ok: false },
            { emoji: '🪟', text: 'Glass', ok: false },
          ],
        },
      },
      {
        en: 'Reusable',
        id: 'Bisa Dipakai Ulang',
        emoji: '🔄',
        example: { en: 'I bring a reusable water bottle.', id: 'Aku membawa botol minum yang bisa dipakai ulang.', emoji: '🚰' },
        question: {
          en: 'What does she bring?',
          id: 'Apa yang dia bawa?',
          options: [
            { emoji: '🚰', text: 'A Reusable Bottle', ok: true },
            { emoji: '🥤', text: 'A Plastic Cup', ok: false },
            { emoji: '🧃', text: 'A Paper Cup', ok: false },
            { emoji: '🥫', text: 'A Can', ok: false },
          ],
        },
      },
      {
        en: 'Wildlife',
        id: 'Satwa Liar',
        emoji: '🦌',
        example: { en: 'The forest protects a lot of wildlife.', id: 'Hutan itu melindungi banyak satwa liar.', emoji: '🌲' },
        question: {
          en: 'What does the forest protect?',
          id: 'Apa yang dilindungi hutan itu?',
          options: [
            { emoji: '🦌', text: 'Wildlife', ok: true },
            { emoji: '🏢', text: 'Buildings', ok: false },
            { emoji: '🛣️', text: 'Roads', ok: false },
            { emoji: '🏪', text: 'Shops', ok: false },
          ],
        },
      },
      {
        en: 'Conservation',
        id: 'Konservasi',
        emoji: '🌱',
        example: { en: 'The school teaches conservation to students.', id: 'Sekolah mengajarkan konservasi pada murid-murid.', emoji: '🧑‍🎓' },
        question: {
          en: 'What does the school teach?',
          id: 'Apa yang diajarkan sekolah itu?',
          options: [
            { emoji: '🌱', text: 'Conservation', ok: true },
            { emoji: '🍳', text: 'Cooking', ok: false },
            { emoji: '🧵', text: 'Sewing', ok: false },
            { emoji: '🎨', text: 'Painting', ok: false },
          ],
        },
      },
      {
        en: 'Renewable',
        id: 'Terbarukan',
        emoji: '☀️',
        example: { en: 'We use renewable energy at home.', id: 'Kami memakai energi terbarukan di rumah.', emoji: '🏠' },
        question: {
          en: 'What kind of energy do they use?',
          id: 'Energi seperti apa yang mereka pakai?',
          options: [
            { emoji: '☀️', text: 'Renewable', ok: true },
            { emoji: '🕰️', text: 'Old', ok: false },
            { emoji: '💰', text: 'Expensive', ok: false },
            { emoji: '🚢', text: 'Imported', ok: false },
          ],
        },
      },
      {
        en: 'Litter',
        id: 'Sampah Berserakan',
        emoji: '🗑️',
        example: { en: "Please don't litter in the park.", id: 'Tolong jangan membuang sampah sembarangan di taman.', emoji: '🗑️' },
        question: {
          en: 'Where should people not litter?',
          id: 'Di mana orang tidak boleh membuang sampah sembarangan?',
          options: [
            { emoji: '🏞️', text: 'The Park', ok: true },
            { emoji: '🍳', text: 'The Kitchen', ok: false },
            { emoji: '🏫', text: 'The Classroom', ok: false },
            { emoji: '🚗', text: 'The Garage', ok: false },
          ],
        },
      },
    ],
    dialogueHeading: 'Yuk, Daur Ulang!',
    dialogueLines: [
      { speaker: 'Rio', en: 'Sasa, why do you always bring a reusable water bottle?', id: 'Sasa, kenapa kamu selalu bawa botol minum yang bisa dipakai ulang?' },
      { speaker: 'Sasa', en: 'Because I want to reduce plastic waste and help the environment.', id: 'Karena aku mau mengurangi sampah plastik dan membantu lingkungan.' },
      { speaker: 'Rio', en: "That's a good idea. My family started to recycle plastic bottles too.", id: 'Ide yang bagus. Keluargaku juga mulai mendaur ulang botol plastik.' },
      { speaker: 'Sasa', en: 'Great! We also compost our food waste at home now.', id: 'Bagus! Kami juga sudah mengomposkan sisa makanan di rumah sekarang.' },
      { speaker: 'Rio', en: 'Really? Does that help reduce pollution?', id: 'Benarkah? Apakah itu membantu mengurangi polusi?' },
      { speaker: 'Sasa', en: 'Yes, and it also protects wildlife in the nearby forest.', id: 'Ya, dan itu juga melindungi satwa liar di hutan dekat sini.' },
      { speaker: 'Rio', en: 'I should start doing that too. It sounds easy.', id: 'Aku juga harus mulai melakukannya. Kedengarannya mudah.' },
    ],
    inferenceQuestions: [
      {
        question: 'What are Rio and Sasa mainly talking about?',
        questionId: 'Rio dan Sasa sebenarnya membicarakan apa?',
        options: [
          { emoji: '🌍', text: 'Protecting the Environment', ok: true },
          { emoji: '🏝️', text: 'Planning a Trip', ok: false },
          { emoji: '🎬', text: 'Choosing a Movie', ok: false },
          { emoji: '📝', text: 'Studying for an Exam', ok: false },
        ],
      },
      {
        question: "What does Sasa's family do with food waste?",
        questionId: 'Apa yang dilakukan keluarga Sasa dengan sisa makanan?',
        options: [
          { emoji: '🍂', text: 'They Compost It', ok: true },
          { emoji: '♻️', text: 'They Recycle It', ok: false },
          { emoji: '🗑️', text: 'They Throw It Away', ok: false },
          { emoji: '💰', text: 'They Sell It', ok: false },
        ],
      },
      {
        question: 'How does Rio feel about starting these habits?',
        questionId: 'Bagaimana perasaan Rio soal mulai membiasakan hal ini?',
        options: [
          { emoji: '🙂', text: 'Interested', ok: true },
          { emoji: '😐', text: 'Uninterested', ok: false },
          { emoji: '😤', text: 'Annoyed', ok: false },
          { emoji: '😕', text: 'Confused', ok: false },
        ],
      },
    ],
  },
  {
    id: 'wawancara-kerja',
    title: 'Wawancara Kerja (A Job Interview)',
    desc: '10 kalimat + 1 percakapan',
    items: [
      {
        en: 'Interview',
        id: 'Wawancara',
        emoji: '🎙️',
        example: { en: 'I have a job interview tomorrow.', id: 'Aku ada wawancara kerja besok.', emoji: '📅' },
        question: {
          en: 'When is her interview?',
          id: 'Kapan wawancaranya?',
          options: [
            { emoji: '📅', text: 'Tomorrow', ok: true },
            { emoji: '☀️', text: 'Today', ok: false },
            { emoji: '🗓️', text: 'Next Week', ok: false },
            { emoji: '📆', text: 'Next Month', ok: false },
          ],
        },
      },
      {
        en: 'Resume',
        id: 'Resume',
        emoji: '📄',
        example: { en: 'I update my resume before applying.', id: 'Aku memperbarui resumeku sebelum melamar.', emoji: '✏️' },
        question: {
          en: 'When does she update her resume?',
          id: 'Kapan dia memperbarui resumenya?',
          options: [
            { emoji: '✏️', text: 'Before Applying', ok: true },
            { emoji: '✅', text: 'After Getting the Job', ok: false },
            { emoji: '🎙️', text: 'During the Interview', ok: false },
            { emoji: '🚫', text: 'Never', ok: false },
          ],
        },
      },
      {
        en: 'Skill',
        id: 'Keahlian',
        emoji: '💡',
        example: { en: 'I list my computer skill on the form.', id: 'Aku mencantumkan keahlian komputerku di formulir.', emoji: '💻' },
        question: {
          en: 'What does she list?',
          id: 'Apa yang dia cantumkan?',
          options: [
            { emoji: '💻', text: 'Her Computer Skill', ok: true },
            { emoji: '🏠', text: 'Her Address', ok: false },
            { emoji: '🎂', text: 'Her Age', ok: false },
            { emoji: '🎨', text: 'Her Hobby', ok: false },
          ],
        },
      },
      {
        en: 'Experience',
        id: 'Pengalaman',
        emoji: '📈',
        example: { en: 'I have two years of experience.', id: 'Aku punya pengalaman dua tahun.', emoji: '2️⃣' },
        question: {
          en: 'How many years of experience does she have?',
          id: 'Berapa tahun pengalaman yang dia punya?',
          options: [
            { emoji: '2️⃣', text: 'Two', ok: true },
            { emoji: '1️⃣', text: 'One', ok: false },
            { emoji: '5️⃣', text: 'Five', ok: false },
            { emoji: '🔟', text: 'Ten', ok: false },
          ],
        },
      },
      {
        en: 'Employer',
        id: 'Atasan',
        emoji: '🧑‍💼',
        example: { en: 'My employer is very kind.', id: 'Atasanku sangat baik hati.', emoji: '🤗' },
        question: {
          en: 'What is her employer like?',
          id: 'Bagaimana atasannya?',
          options: [
            { emoji: '🤗', text: 'Very Kind', ok: true },
            { emoji: '😠', text: 'Very Strict', ok: false },
            { emoji: '🏃', text: 'Very Busy', ok: false },
            { emoji: '🤫', text: 'Very Quiet', ok: false },
          ],
        },
      },
      {
        en: 'Salary',
        id: 'Gaji',
        emoji: '💰',
        example: { en: 'We discuss the salary at the end.', id: 'Kami membahas gaji di akhir.', emoji: '🏁' },
        question: {
          en: 'When do they discuss the salary?',
          id: 'Kapan mereka membahas gaji?',
          options: [
            { emoji: '🏁', text: 'At the End', ok: true },
            { emoji: '🚦', text: 'At the Start', ok: false },
            { emoji: '🍽️', text: 'During Lunch', ok: false },
            { emoji: '🚫', text: 'Never', ok: false },
          ],
        },
      },
      {
        en: 'Career',
        id: 'Karier',
        emoji: '🚀',
        example: { en: 'I want a career in design.', id: 'Aku ingin berkarier di bidang desain.', emoji: '🎨' },
        question: {
          en: 'What career does she want?',
          id: 'Karier apa yang dia inginkan?',
          options: [
            { emoji: '🎨', text: 'Design', ok: true },
            { emoji: '🧑‍🏫', text: 'Teaching', ok: false },
            { emoji: '🍳', text: 'Cooking', ok: false },
            { emoji: '🌾', text: 'Farming', ok: false },
          ],
        },
      },
      {
        en: 'Qualification',
        id: 'Kualifikasi',
        emoji: '🎓',
        example: { en: 'I have the right qualification for this job.', id: 'Aku punya kualifikasi yang tepat untuk pekerjaan ini.', emoji: '✅' },
        question: {
          en: 'What does she have?',
          id: 'Apa yang dia punya?',
          options: [
            { emoji: '✅', text: 'The Right Qualification', ok: true },
            { emoji: '📄', text: 'A New Resume', ok: false },
            { emoji: '🎫', text: 'A Free Ticket', ok: false },
            { emoji: '🏷️', text: 'A Discount', ok: false },
          ],
        },
      },
      {
        en: 'Colleague',
        id: 'Rekan Kerja',
        emoji: '🧑‍🤝‍🧑',
        example: { en: 'My colleague helps me with the project.', id: 'Rekan kerjaku membantuku dengan proyek itu.', emoji: '📋' },
        question: {
          en: 'Who helps her with the project?',
          id: 'Siapa yang membantunya dengan proyek itu?',
          options: [
            { emoji: '🧑‍🤝‍🧑', text: 'Her Colleague', ok: true },
            { emoji: '🧑‍💼', text: 'Her Employer', ok: false },
            { emoji: '🧑‍🏫', text: 'Her Teacher', ok: false },
            { emoji: '🏘️', text: 'Her Neighbor', ok: false },
          ],
        },
      },
      {
        en: 'Position',
        id: 'Posisi',
        emoji: '📋',
        example: { en: 'I apply for a new position at the company.', id: 'Aku melamar posisi baru di perusahaan itu.', emoji: '🏢' },
        question: {
          en: 'What does she apply for?',
          id: 'Apa yang dia lamar?',
          options: [
            { emoji: '📋', text: 'A New Position', ok: true },
            { emoji: '🏠', text: 'A New House', ok: false },
            { emoji: '📱', text: 'A New Phone', ok: false },
            { emoji: '🚗', text: 'A New Car', ok: false },
          ],
        },
      },
    ],
    dialogueHeading: 'Wawancara Kerja',
    dialogueLines: [
      { speaker: 'Kak Wulan', en: 'Thank you for coming, Doni. Can you tell me about your experience?', id: 'Terima kasih sudah datang, Doni. Bisa ceritakan pengalamanmu?' },
      { speaker: 'Doni', en: 'Of course. I have two years of experience in graphic design.', id: 'Tentu. Aku punya pengalaman dua tahun di desain grafis.' },
      { speaker: 'Kak Wulan', en: "That's great. What skill do you think is your strongest?", id: 'Bagus sekali. Menurutmu keahlian apa yang paling kuat kamu punya?' },
      { speaker: 'Doni', en: 'I think my strongest skill is working well with a team.', id: 'Menurutku keahlian terkuatku adalah bekerja baik dengan tim.' },
      { speaker: 'Kak Wulan', en: 'Good to know. Do you have any questions about the position?', id: 'Baik untuk diketahui. Apakah kamu punya pertanyaan soal posisinya?' },
      { speaker: 'Doni', en: "Yes, I'd like to know more about the salary and the team I'd work with.", id: 'Ya, aku ingin tahu lebih soal gaji dan tim yang akan aku kerjakan bersama.' },
      { speaker: 'Kak Wulan', en: "Sure, let's discuss that now.", id: 'Tentu, mari kita bahas sekarang.' },
    ],
    inferenceQuestions: [
      {
        question: 'What is this conversation mainly about?',
        questionId: 'Percakapan ini sebenarnya tentang apa?',
        options: [
          { emoji: '🎙️', text: 'A Job Interview', ok: true },
          { emoji: '📝', text: 'A School Exam', ok: false },
          { emoji: '🛍️', text: 'A Shopping Trip', ok: false },
          { emoji: '🏝️', text: 'A Holiday Plan', ok: false },
        ],
      },
      {
        question: 'How much experience does Doni have?',
        questionId: 'Berapa pengalaman yang dimiliki Doni?',
        options: [
          { emoji: '2️⃣', text: 'Two Years', ok: true },
          { emoji: '1️⃣', text: 'One Year', ok: false },
          { emoji: '5️⃣', text: 'Five Years', ok: false },
          { emoji: '🚫', text: 'No Experience', ok: false },
        ],
      },
      {
        question: 'What does Doni want to know more about?',
        questionId: 'Doni ingin tahu lebih banyak tentang apa?',
        options: [
          { emoji: '💰', text: 'The Salary and Team', ok: true },
          { emoji: '🏢', text: 'The Company Address', ok: false },
          { emoji: '🧑‍💼', text: "The Interviewer's Name", ok: false },
          { emoji: '📄', text: 'The Application Form', ok: false },
        ],
      },
    ],
  },
];

/** Value bertipe `AnyListeningTopic[]` (types.ts) per level — Explorer/
 *  Adventurer format lama, Little Stars & Starter format baru, berdampingan
 *  di peta yang sama (tiap level tetap HOMOGEN 1 format, union-nya cuma
 *  supaya `Record` value type konsisten & `poolFor` generik di
 *  `games/boss.ts` bisa infer `T` dgn benar — union-of-arrays per-key
 *  bikin TS gagal infer). */
export const LISTENING_TOPICS_BY_LEVEL: Partial<Record<LevelKey, AnyListeningTopic[]>> = {
  'little-stars': LISTENING_TOPICS_LITTLE_STARS,
  starter: LISTENING_TOPICS_STARTER,
  explorer: LISTENING_TOPICS,
  adventurer: LISTENING_TOPICS_ADVENTURER,
  achiever: LISTENING_TOPICS_ACHIEVER,
  trailblazer: LISTENING_TOPICS_TRAILBLAZER,
};
/**
 * Speaking Little Stars (3–5 th) — format KEDUA `SpeakingPhraseTopic`
 * (types.ts), riset & spesifikasi lengkap: `materi/speaking.md`. 1 topik,
 * 10 frasa, dipetakan dari `VOCAB_TOPICS_LITTLE_STARS` topik
 * `salam-sopan-santun` (kata kunci sama, frasa target ditulis ULANG baru —
 * prinsip "modalitas beda, bukan duplikasi" konsisten dgn Listening/Reading
 * Little Stars) — dipilih krn Kurikulum Merdeka Fase Fondasi eksplisit
 * menyebut "mengucapkan kata tolong, maaf, terima kasih" sbg benchmark
 * keterampilan sosial-bahasa usia ini (`materi/speaking.md` §3.3), jadi
 * domain paling langsung didukung riset utk topik SPEAKING pertama (beda
 * dari Vocab/Listening yang topik pertamanya bebas dipilih).
 */
export const SPEAKING_TOPICS_LITTLE_STARS: SpeakingPhraseTopic[] = [
  {
    id: 'sapaan-sopan',
    title: 'Sapaan & Sopan Santun (Greetings & Manners)',
    desc: '10 ucapan',
    items: [
      { en: 'Hello', id: 'Halo', emoji: '👋', phrase: { en: 'Hello, everyone!', id: 'Halo, semuanya!', emoji: '👋' } },
      { en: 'Goodbye', id: 'Dadah', emoji: '🚶', phrase: { en: 'Goodbye, see you!', id: 'Dadah, sampai jumpa!', emoji: '🚶' } },
      { en: 'Please', id: 'Tolong', emoji: '🥺', phrase: { en: 'Please, sit down.', id: 'Tolong, duduklah.', emoji: '🥺' } },
      { en: 'Thank You', id: 'Terima Kasih', emoji: '🙏', phrase: { en: 'Thank you so much!', id: 'Terima kasih banyak!', emoji: '🙏' } },
      { en: 'Sorry', id: 'Maaf', emoji: '😔', phrase: { en: 'Sorry, my friend.', id: 'Maaf, temanku.', emoji: '😔' } },
      { en: 'Yes', id: 'Iya', emoji: '✅', phrase: { en: 'Yes, I can!', id: 'Iya, aku bisa!', emoji: '✅' } },
      { en: 'No', id: 'Tidak', emoji: '🙅', phrase: { en: 'No, not now.', id: 'Tidak, nanti dulu.', emoji: '🙅' } },
      { en: 'Good Morning', id: 'Selamat Pagi', emoji: '☀️', phrase: { en: 'Good morning, mom!', id: 'Selamat pagi, mama!', emoji: '☀️' } },
      { en: 'Good Night', id: 'Selamat Malam', emoji: '🌙', phrase: { en: 'Good night, dad!', id: 'Selamat malam, papa!', emoji: '🌙' } },
      { en: 'Excuse Me', id: 'Permisi', emoji: '🙋', phrase: { en: 'Excuse me, teacher.', id: 'Permisi, Bu Guru.', emoji: '🙋' } },
    ],
  },
];

export const SPEAKING_TOPICS_BY_LEVEL: Partial<Record<LevelKey, AnySpeakingTopic[]>> = {
  'little-stars': SPEAKING_TOPICS_LITTLE_STARS,
  explorer: SPEAKING_TOPICS,
  adventurer: SPEAKING_TOPICS_ADVENTURER,
};
export const GRAMMAR_TOPICS_BY_LEVEL: Partial<Record<LevelKey, GrammarTopic[]>> = {
  explorer: GRAMMAR_TOPICS,
  adventurer: GRAMMAR_TOPICS_ADVENTURER,
};
/**
 * Reading Little Stars (3–5 th) — format KEDUA `ReadingWordTopic` (§types.ts),
 * beda total dari `READING_TOPICS_ADVENTURER` di atas (baca kalimat/cerita →
 * jawab pertanyaan) krn riset (`materi/reading.md` §5) mengonfirmasi anak
 * usia ini di manapun (Indonesia maupun kompetitor internasional) belum siap
 * dekoding kalimat — bahkan literasi Bahasa Indonesia sendiri (Kurikulum
 * Merdeka Fase Fondasi) baru menargetkan pengenalan huruf/kata di usia 5–6,
 * bukan 3–5. Aktivitas pembuka yang tepat: cocokkan KATA TUNGGAL (whole-word/
 * sight-word) dgn gambar — pola yang dipakai SEMUA kompetitor early-literacy
 * (Reading Eggs Junior, Endless Reader, Kumon, HOMER) di gerbang paling awal.
 *
 * **1 topik pertama** (permintaan user "coba buat 1 materi") — `kata-hewan`,
 * 10 kata dipetakan 1:1 dari `VOCAB_TOPICS_LITTLE_STARS` topik
 * `hewan-peliharaan` (kata pendek, emoji sangat khas/tidak ambigu, anak
 * SUDAH kenal maknanya dari Vocab — melatih ULANG lewat modalitas baca,
 * bukan kosakata baru sekaligus 2 skill). Id topik SENGAJA beda dari id
 * Vocab-nya (`kata-hewan` vs `hewan-peliharaan`, walau aman dari tabrakan
 * progres krn key `${skill}:${topicId}:${section}` sudah py awalan skill) —
 * konsisten dgn konvensi penamaan Listening Little Stars (`materi/
 * listening.md` §4A, semua id barunya beda dari id Vocab sumbernya).
 *
 * Sengaja BUKAN cuma tiru mentah pola "kata→gambar" kompetitor (permintaan
 * user "wajib ada improvement", `materi/reading.md` §6) — 2 penambahan:
 * (1) kartu kata dibungkus `.reading-word-card` (font besar+letter-spacing
 * ala flashcard, bukan teks sebaris kecil spt kompetitor kebanyakan) supaya
 * print-awareness bentuk kata lebih menonjol; (2) Tantangan membalik ARAH
 * tugas (gambar→pilih KATA tercetak, bukan kata→pilih gambar lagi spt
 * Latihan Inti) — tangga 2-arah yang TIDAK dipunyai kompetitor manapun yang
 * diriset (semuanya 1 arah: word→meaning), memaksa anak benar-benar
 * membedakan BENTUK CETAK kata (bukan cuma tebak dari familiaritas urutan).
 */
export const READING_TOPICS_LITTLE_STARS: ReadingWordTopic[] = [
  {
    id: 'kata-hewan',
    title: 'Membaca Kata: Hewan (Reading Animal Words)',
    scene: '🐶',
    desc: '10 kata',
    items: [
      { en: 'Dog', id: 'Anjing', emoji: '🐶' },
      { en: 'Cat', id: 'Kucing', emoji: '🐱' },
      { en: 'Fish', id: 'Ikan', emoji: '🐟' },
      { en: 'Bird', id: 'Burung', emoji: '🐦' },
      { en: 'Cow', id: 'Sapi', emoji: '🐄' },
      { en: 'Duck', id: 'Bebek', emoji: '🦆' },
      { en: 'Horse', id: 'Kuda', emoji: '🐴' },
      { en: 'Sheep', id: 'Domba', emoji: '🐑' },
      { en: 'Pig', id: 'Babi', emoji: '🐷' },
      { en: 'Rabbit', id: 'Kelinci', emoji: '🐰' },
    ],
  },
];

export const READING_TOPICS_BY_LEVEL: Partial<Record<LevelKey, AnyReadingTopic[]>> = {
  'little-stars': READING_TOPICS_LITTLE_STARS,
  adventurer: READING_TOPICS_ADVENTURER,
};
