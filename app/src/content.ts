import type {
  AnyGrammarTopic,
  AnyListeningTopic,
  AnyReadingTopic,
  AnySpeakingTopic,
  GrammarPatternTopic,
  GrammarTopic,
  GrammarTransformTopic,
  LevelKey,
  LevelMeta,
  ListeningDialogueTopic,
  ListeningNoteTopic,
  ListeningSentenceTopic,
  ListeningTopic,
  ReadingCheckTopic,
  ReadingTopic,
  ReadingWordTopic,
  SkillKey,
  SkillMeta,
  SpeakingInterviewTopic,
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
    story: ['Dimas sees a turtle first.', 'It moves very slowly.', 'Then he sees a cheetah, and it is fast.'],
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

export const SPEAKING_TOPICS: AnySpeakingTopic[] = [
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
  /**
   * 7 topik tambahan (sesi ini) — menggenapkan Speaking Explorer dari 3 jadi
   * 10 topik (target CLAUDE.md ≥10 topik/skill). Riset & rasional lengkap:
   * `materi/speaking.md` §12 — format LAMA `SpeakingTopic` (model/drill/
   * roleplay) dikonfirmasi ULANG cocok utk level ini (LIA GEYL usia 6-12
   * eksplisit menyebut "role play" sbg metode inti, EF Indonesia High
   * Flyers 7-9 "dialog situasional & role-play"), jadi TIDAK didesain ulang
   * — murni data baru. Tiap topik dipetakan ke 1 domain `VOCAB_TOPICS`
   * (Explorer) yang belum disentuh Speaking, SAMA 7 domain yang sudah
   * dipetakan Listening Explorer (`klinik`/`kebun-binatang`/`di-kasir`/
   * `jadwal-harian`/`dari-mana`/`pesta-ulang-tahun`/`di-dapur`) — sengaja
   * domain yang SAMA (bukan domain lain) supaya anak me-review kosakata yang
   * sama lewat 2 modalitas berbeda (dengar vs ucap), id topik BEDA dari
   * Listening-nya (konvensi sama Little Stars/Starter) walau aman dari
   * tabrakan progres krn key `${skill}:${topicId}:${section}` sudah py
   * awalan skill. `drill`/`roleplay` ditulis ULANG baru (bukan disalin dari
   * `VOCAB_TOPICS`/`LISTENING_TOPICS`), diperkaya jadi 3 item drill + 3
   * roleplay tiap topik (LEBIH BANYAK dari 3 topik lama yg cuma 1-2/2-3 —
   * konsisten arah "dekatkan ke 10" CLAUDE.md walau format lama ini sendiri
   * tidak py struktur 10-item spt Vocab).
   */
  {
    id: 'sakit-apa',
    title: 'Sakit Apa? (What\'s Wrong?)',
    desc: '3 latihan bicara',
    model: ['I have a headache.', 'I need medicine.'],
    drill: ['I have a fever.', 'My tummy hurts.', 'I need to rest.'],
    roleplay: ['What is wrong with you?', 'Do you have a fever?', 'Where does it hurt?'],
  },
  {
    id: 'lawan-kata',
    title: 'Lawan Kata (Opposites)',
    desc: '3 latihan bicara',
    model: ['The elephant is big.', 'The mouse is small.'],
    drill: ['The cheetah is fast.', 'The turtle is slow.', 'The snake is long.'],
    roleplay: ['Is the elephant big or small?', 'Which is faster, a cheetah or a turtle?', 'What is the opposite of heavy?'],
  },
  {
    id: 'bayar-di-kasir',
    title: 'Bayar di Kasir (Pay at the Cashier)',
    desc: '3 latihan bicara',
    model: ['How much is the price?', 'Here is your receipt.'],
    drill: ['I have five coins.', 'This is expensive.', 'I keep my money in my wallet.'],
    roleplay: ['How much money do you have?', 'Can I pay with a coin?', 'Do you want a receipt?'],
  },
  {
    id: 'jadwal-hariku',
    title: 'Jadwalku Hari Ini (My Daily Schedule)',
    desc: '3 latihan bicara',
    model: ['I wake up in the morning.', 'I sleep at night.'],
    drill: ['I eat lunch in the afternoon.', 'I play in the evening.', 'I go to school every week.'],
    roleplay: ['What do you do in the morning?', 'What time do you sleep at night?', 'What do you do every week?'],
  },
  {
    id: 'kamu-dari-mana',
    title: 'Kamu dari Mana? (Where Are You From?)',
    desc: '3 latihan bicara',
    model: ['I am from Indonesia.', 'Where are you from?'],
    drill: ['I live in Indonesia.', 'I want to visit Japan.', 'She is from England.'],
    roleplay: ['Can you tell me where you are from?', 'Which country do you want to visit?', 'Do you know someone from another country?'],
  },
  {
    id: 'pesta-ulang-tahunku',
    title: 'Pesta Ulang Tahunku (My Birthday Party)',
    desc: '3 latihan bicara',
    model: ['Happy birthday!', 'I blow the candle.'],
    drill: ['I open my present.', 'I invite my friends.', 'We have a celebration.'],
    roleplay: ['When is your birthday?', 'What present do you want?', 'Who do you want to invite?'],
  },
  {
    id: 'masak-yuk',
    title: 'Masak Yuk! (Let\'s Cook!)',
    desc: '3 latihan bicara',
    model: ['I eat with a spoon.', 'Mom cooks in the pot.'],
    drill: ['I need a fork.', 'Dad fries eggs in the pan.', 'I drink from a cup.'],
    roleplay: ['What do you use to eat soup?', 'Can you help me cook?', 'What is your favorite food to cook?'],
  },
  /**
   * Topik ke-11 (PILOT) — format KEEMPAT `SpeakingStoryTopic` (types.ts).
   * Audit user: "'main', 'core practice', dan 'challenge' speaking section...
   * exercises are all basically the same" — 3 topik `model`/`drill`/`roleplay`
   * di atas SEMUANYA murni produksi tanpa lapisan KOMPREHENSI (anak tidak
   * pernah memilah beberapa fakta dulu sebelum bicara). Ide konkret dari user
   * sendiri (contoh persis dipakai): "simple stories... accompanied by
   * questions" ("Andi likes dogs, and Andi has a cat. — What does Andi
   * have?"). REUSE pola "cerita mini + 1 fakta pengecoh + pertanyaan" yang
   * SUDAH terbukti di `LISTENING_TOPICS`/`READING_TOPICS_ADVENTURER` (`story`
   * + `question`, lihat topik `pesta-ulang-tahun`/`di-dapur` di atas) — BEDA
   * krusial: jawabannya WAJIB DIUCAPKAN via mic (skor proporsional
   * `wordMatchDetail`), bukan tap gambar. Dicampur LANGSUNG ke array
   * `SPEAKING_TOPICS` yang sama (bukan array terpisah) — dispatch selalu
   * per-topik (`'stories' in topic`), bukan per-level, jadi 1 level boleh
   * campur format lama & format ini (arsitektur SUDAH mendukung ini sejak
   * awal, baru sesi ini benar-benar dipakai). Pilot 5 cerita, kalau
   * feedback-nya positif baru diperluas ke level lain / topik lain.
   */
  {
    id: 'cerita-dan-jawab',
    title: 'Cerita & Jawab (Story & Answer)',
    desc: '5 cerita mini',
    stories: [
      {
        emoji: '🐱',
        lines: [
          { en: 'Andi likes dogs.', id: 'Andi suka anjing.' },
          { en: 'Andi has a cat.', id: 'Andi punya kucing.' },
        ],
        question: { en: 'What does Andi have?', id: 'Andi punya apa?' },
        answer: { en: 'The pet is a cat.', id: 'Peliharaannya kucing.' },
      },
      {
        emoji: '🎒',
        lines: [
          { en: 'Rani wants a red bag.', id: 'Rani mau tas merah.' },
          { en: 'Rani buys a blue bag.', id: 'Rani membeli tas biru.' },
        ],
        question: { en: 'What color is the bag Rani buys?', id: 'Apa warna tas yang Rani beli?' },
        answer: { en: 'The bag is blue.', id: 'Tasnya biru.' },
      },
      {
        emoji: '🦒',
        lines: [
          { en: 'Budi sees a lion at the zoo.', id: 'Budi melihat singa di kebun binatang.' },
          { en: 'Budi feeds a giraffe.', id: 'Budi memberi makan jerapah.' },
        ],
        question: { en: 'What does Budi feed?', id: 'Budi memberi makan apa?' },
        answer: { en: 'The animal is a giraffe.', id: 'Hewannya jerapah.' },
      },
      {
        emoji: '🏀',
        lines: [
          { en: 'Sari’s brother plays football.', id: 'Kakak Sari bermain sepak bola.' },
          { en: 'Sari plays basketball.', id: 'Sari bermain basket.' },
        ],
        question: { en: 'What sport does Sari play?', id: 'Sari bermain olahraga apa?' },
        answer: { en: 'The sport is basketball.', id: 'Olahraganya basket.' },
      },
      {
        emoji: '🍚',
        lines: [
          { en: 'Dimas eats a sandwich for breakfast.', id: 'Dimas makan sandwich saat sarapan.' },
          { en: 'Dimas eats rice for dinner.', id: 'Dimas makan nasi saat makan malam.' },
        ],
        question: { en: 'What does Dimas eat for dinner?', id: 'Dimas makan apa saat makan malam?' },
        answer: { en: 'The dinner food is rice.', id: 'Makan malamnya nasi.' },
      },
    ],
  },
];

export const GRAMMAR_TOPICS: GrammarTopic[] = [
  {
    id: 'this-is',
    title: 'Pola "This is..."',
    desc: 'To be — perkenalan',
    examples: [{ en: 'This is a cat.', emoji: '🐱' }, { en: 'This is a dog.', emoji: '🐶' }],
    scramble: [
      { emoji: '🐦', target: ['This', 'is', 'a', 'bird'] },
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
    scramble: [{ emoji: '📦', target: ['There', 'is', 'a', 'box'] }],
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
    scramble: [{ emoji: '😴', target: ['He', 'is', 'tired'] }],
    fill: {
      before: ['I', 'like'],
      after: [],
      options: [{ word: 'apples', emoji: '🍎' }, { word: 'blue', emoji: '🔵' }, { word: 'football', emoji: '⚽' }],
    },
  },
  /**
   * Topik ke-4 (permintaan riset per-level, `materi/grammar.md` §9) —
   * "Prepositions of Place" (in/on/under) — struktur Cambridge YLE Starters
   * yang belum diklaim topik Explorer manapun (`this-is`/`there-is`/
   * `pronouns`). Dipetakan dari `VOCAB_TOPICS` `peralatan-dapur` (Kitchen
   * Tools) — benda dapur naturally duduk "in the bowl"/"on the table"/"under
   * the shelf", validasi kuat EF Indonesia High Flyers (7–9 th) "grammar
   * sistematis dalam bentuk kalimat" & LearnEnglish Kids yang py kartu
   * referensi + game preposisi eksplisit di usia ini. Emoji opsi `fill`
   * (⬆️/📦/⬇️) proxy VISUAL preposisinya sendiri (bukan kata benda konkret,
   * beda dari 3 topik di atas) krn preposisi tidak py "benda"-nya sendiri.
   */
  {
    id: 'prepositions-of-place',
    title: 'Preposisi Tempat (In, On, Under)',
    desc: 'In / On / Under',
    examples: [
      { en: 'The spoon is in the bowl.', emoji: '🥄' },
      { en: 'The cup is on the table.', emoji: '☕' },
      { en: 'The pan is under the shelf.', emoji: '🍳' },
    ],
    scramble: [
      { emoji: '🔑', target: ['The', 'key', 'is', 'in', 'the', 'drawer'] },
      { emoji: '💡', target: ['The', 'lamp', 'is', 'on', 'the', 'desk'] },
    ],
    fill: {
      before: ['The', 'fork', 'is'],
      after: ['the', 'plate'],
      options: [
        { word: 'on', emoji: '⬆️' },
        { word: 'in', emoji: '📦' },
        { word: 'under', emoji: '⬇️' },
      ],
    },
  },
  /**
   * Topik ke-5 (riset per-level lanjutan, `materi/grammar.md` §15) —
   * "Present Continuous" (Cambridge Pre-A1 Starters kategori #6, "What are
   * you doing? / The cat's sleeping.", dikonfirmasi jg Kurikulum Merdeka
   * Fase B kelas 3-4 SD & British Council LearnEnglish Kids yg py kategori
   * "Grammar: present progressive" berdiri sendiri persis di usia ini).
   * BUKAN duplikat kontras `continuous-vs-simple` Achiever — itu KONTRAS
   * continuous VS simple, ini pengenalan continuous POLOS (tangga di
   * BAWAHNYA, genuinely unclaimed struktur). Dipetakan dari domain Vocab
   * `waktu-harian` (Times of Day) — scene aktivitas harian di waktu
   * tertentu (pagi/sore/malam), REUSE domain+emoji yg SAMA PERSIS dgn item
   * Vocab-nya (🌅/🌇/🌃), bukan kata baru.
   */
  {
    id: 'present-continuous',
    title: 'Sedang Terjadi (Present Continuous)',
    desc: 'Sedang Apa Sekarang?',
    examples: [
      { en: 'She is eating breakfast in the morning.', emoji: '🌅' },
      { en: 'He is doing homework in the evening.', emoji: '🌇' },
      { en: 'They are sleeping at night.', emoji: '🌃' },
    ],
    scramble: [
      { emoji: '🌅', target: ['She', 'is', 'eating', 'breakfast'] },
      { emoji: '🌃', target: ['They', 'are', 'sleeping'] },
    ],
    fill: {
      before: ['She', 'is'],
      after: [],
      options: [
        { word: 'sleeping', emoji: '😴' },
        { word: 'eating', emoji: '🍽️' },
        { word: 'playing', emoji: '⚽' },
      ],
    },
  },
  /**
   * Topik ke-6 — "Question Words" (Starters kategori #13, "Who is that
   * man? / Where is Alex?") — kategori yg SEBELUMNYA dicatat sesi Little
   * Stars (§13) butuh format teks-first (bukan mekanik kontras biner),
   * sekarang genap terisi di sini. Dipetakan dari domain Vocab `keluarga`
   * (Family) — pola tanya "Siapa dia?/Di mana dia?" paling natural
   * ditanyakan TENTANG anggota keluarga, emoji jawaban REUSE PERSIS dari
   * item Vocab-nya (👧 Sister/👵 Grandmother/🧑 Cousin/👩‍🦱 Aunt).
   *
   * `fill` (Tantangan) SENGAJA menguji separuh JAWABAN ("She is my ___"),
   * BUKAN kata tanya itu sendiri — batasan struktural `runTantangan` yg
   * SELALU menambah "." di akhir kalimat (lihat `sentence + '.'` di kode),
   * jadi template ber-"?" akan menghasilkan tanda baca ganda yg janggal
   * ("...girl? ."). Kata tanya-nya sendiri TETAP dilatih penuh lewat
   * `examples` (tampil apa adanya, tanda baca bebas krn cuma teks statis)
   * & `scramble` (susun urutan kata tanya — tidak butuh tanda baca sama
   * sekali krn dicek kata-per-kata, bukan kalimat jadi).
   */
  {
    id: 'question-words',
    title: 'Kata Tanya Who, Where, What (Question Words)',
    desc: 'Siapa, Di Mana, Apa',
    examples: [
      { en: 'Who is that girl? She is my sister.', emoji: '👧' },
      { en: 'Where is your grandmother? She is in the garden.', emoji: '👵' },
      { en: 'What is his name? His name is Kevin.', emoji: '👦' },
    ],
    scramble: [
      { emoji: '👧', target: ['Who', 'is', 'that', 'girl'] },
      { emoji: '👵', target: ['Where', 'is', 'your', 'grandmother'] },
    ],
    fill: {
      before: ['She', 'is', 'my'],
      after: [],
      options: [
        { word: 'sister', emoji: '👧' },
        { word: 'aunt', emoji: '👩‍🦱' },
        { word: 'cousin', emoji: '🧑' },
      ],
    },
  },
  /**
   * Topik ke-7 — "Would Like + Noun" (Starters kategori #20, "I would like
   * some grapes. / Would you like to colour that ball?") — register
   * permintaan SOPAN, beda dari `suka-tidak-suka` Starter (present simple
   * OPINI "I like painting", bukan permintaan). Dipetakan dari domain
   * Vocab `belanja-uang` (Shopping & Money) — konteks toko/kasir adalah
   * panggung paling natural utk "would like" dlm bahasa Inggris anak
   * (dialog klasik "May I help you? I would like..."), walau kata benda
   * yg diminta (apel/roti/jus) bukan item vocab domain itu sendiri — pola
   * yg SAMA dgn `prepositions-of-place` di atas (domain jadi PANGGUNG,
   * bukan sumber kata harfiah). Kata benda dipilih TAK-TERHITUNG ("some
   * X") di `fill` supaya opsi tidak perlu mengurus beda artikel a/an.
   */
  {
    id: 'would-like',
    title: 'Meminta dengan Sopan (Would Like)',
    desc: 'I Would Like...',
    examples: [
      { en: 'I would like an apple, please.', emoji: '🍎' },
      { en: 'She would like some bread.', emoji: '🍞' },
      { en: 'Would you like some juice?', emoji: '🧃' },
    ],
    scramble: [
      { emoji: '🍎', target: ['I', 'would', 'like', 'an', 'apple'] },
      { emoji: '🍰', target: ['He', 'would', 'like', 'some', 'cake'] },
    ],
    fill: {
      before: ['I', 'would', 'like', 'some'],
      after: [],
      options: [
        { word: 'juice', emoji: '🧃' },
        { word: 'bread', emoji: '🍞' },
        { word: 'rice', emoji: '🍚' },
      ],
    },
  },
  /**
   * Topik ke-8 — "Let's..." (Starters kategori #17, "Let's go to the
   * zoo!") — pola ajakan frekuensi tinggi, dipetakan dari domain Vocab
   * `pesta-perayaan` (Celebrations) krn ajakan bersama paling natural
   * muncul di konteks perayaan/pesta. `fill` SENGAJA berhenti di kata
   * kerja polos ("Let's ___.") tanpa objek/tanda seru — alasan sama dgn
   * `question-words` di atas: `runTantangan` selalu menambah "." di
   * akhir, jadi template dijaga selalu berakhir wajar sbg pernyataan,
   * bukan seruan bertanda ganda.
   */
  {
    id: 'lets-suggestion',
    title: "Ayo... (Let's...)",
    desc: 'Mengajak Bersama',
    examples: [
      { en: "Let's sing a song!", emoji: '🎤' },
      { en: "Let's eat the cake!", emoji: '🎂' },
      { en: "Let's play a game!", emoji: '🎮' },
    ],
    scramble: [
      { emoji: '📖', target: ["Let's", 'read', 'a', 'book'] },
      { emoji: '🎨', target: ["Let's", 'draw', 'a', 'picture'] },
    ],
    fill: {
      before: ["Let's"],
      after: [],
      options: [
        { word: 'sing', emoji: '🎤' },
        { word: 'dance', emoji: '💃' },
        { word: 'run', emoji: '🏃' },
      ],
    },
  },
  /**
   * Topik ke-9 (riset per-level lanjutan, `materi/grammar.md` §16) — "Can
   * for Requests/Permission" (Cambridge Pre-A1 Starters kategori #8, kategori
   * TERPISAH dari "Can for ability" kategori #7 yg sudah diklaim Little
   * Stars `bisa-tidak-bisa` — fungsi pragmatiknya beda: MINTA IZIN, bukan
   * menyatakan KEMAMPUAN, jadi genuinely bukan duplikat). Dipetakan dari
   * domain Vocab `pesta-perayaan` (Celebrations) — konteks pesta paling
   * natural utk minta izin ("Can I have some cake?", contoh resmi Cambridge
   * sendiri). `fill` menguji separuh JAWABAN pemberian izin ("Yes, you can
   * have a ___"), BUKAN pertanyaannya sendiri — pola sama `question-words`/
   * `lets-suggestion` di atas krn `runTantangan` selalu menambah "." di
   * akhir (kalimat tanya "Can I...?" tidak bisa jadi template fill tanpa
   * tanda baca ganda). Pertanyaannya sendiri tetap dilatih penuh lewat
   * `examples` (teks statis) & `scramble` (susun kata, tanpa tanda baca).
   */
  {
    id: 'can-requests',
    title: 'Minta Izin dengan Sopan (Can I...?)',
    desc: 'Can I...? / Boleh Aku...?',
    examples: [
      { en: 'Can I have a balloon, please?', emoji: '🎈' },
      { en: 'Can I play with the ball?', emoji: '⚽' },
      { en: 'Can I have some cake, please?', emoji: '🎂' },
    ],
    scramble: [
      { emoji: '🪟', target: ['Can', 'I', 'open', 'the', 'window'] },
      { emoji: '🐶', target: ['Can', 'I', 'hold', 'the', 'puppy'] },
    ],
    fill: {
      before: ['Yes,', 'you', 'can', 'have', 'a'],
      after: [],
      options: [
        { word: 'balloon', emoji: '🎈' },
        { word: 'cookie', emoji: '🍪' },
        { word: 'present', emoji: '🎁' },
      ],
    },
  },
  /**
   * Topik ke-10 — "Prepositions of Time" (Cambridge Pre-A1 Starters kategori
   * #12, separuh WAKTU dari kategori yg sama dgn `prepositions-of-place`
   * (separuh TEMPAT) di atas — Cambridge sendiri mendaftar keduanya sbg 1
   * kategori, tapi app ini sudah pisah jadi 2 topik krn muatannya beda
   * total (posisi statis benda vs waktu kejadian). Dipetakan dari domain
   * Vocab `waktu-harian` (Times of Day, REUSE dari `present-continuous` di
   * atas — emoji sama 🌅/🌇/🌙) — British Council LearnEnglish Kids py unit
   * "Prepositions of time" berdiri sendiri persis dgn contoh "in the
   * morning/evening"+"at night" yg sama, mengonfirmasi kategori ini genuinely
   * dilatih terpisah dari preposisi tempat di usia ini.
   */
  {
    id: 'prepositions-of-time',
    title: 'Preposisi Waktu (In, At)',
    desc: 'In the Morning / At Night',
    examples: [
      { en: 'We go to school in the morning.', emoji: '🌅' },
      { en: 'I do my homework in the evening.', emoji: '🌇' },
      { en: 'They go to sleep at night.', emoji: '🌙' },
    ],
    scramble: [
      { emoji: '🍳', target: ['She', 'eats', 'breakfast', 'in', 'the', 'morning'] },
      { emoji: '📺', target: ['He', 'watches', 'TV', 'in', 'the', 'evening'] },
    ],
    fill: {
      before: ['I', 'like', 'to', 'read', 'books'],
      after: [],
      options: [
        { word: 'in the morning', emoji: '🌅' },
        { word: 'in the evening', emoji: '🌇' },
        { word: 'at night', emoji: '🌙' },
      ],
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
      { en: 'How is the weather today?', id: 'Bagaimana cuaca hari ini?' },
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

/**
 * 9 topik tambahan (sesi ini) — menggenapkan Speaking Adventurer dari 1 jadi
 * 10 topik (target CLAUDE.md ≥10 topik/skill). Riset & rasional lengkap:
 * `materi/speaking.md` §13. Beda dari genapkan Explorer (sesi sebelumnya,
 * murni tambah topik dgn kompleksitas SAMA): riset (Cambridge A1 Movers
 * Speaking test "describe 4 differences + give a reason" DAN Kurikulum
 * Merdeka Fase C kelas 5-6 SD — "guru memberikan instruksi... mengatakan
 * tentang gambar dengan menggunakan ADJECTIVE... Is the elephant big or
 * small?") SAMA-SAMA menunjukkan Adventurer WAJIB mulai py kalimat
 * DESKRIPTIF (kata sifat) + ALASAN ("because"), bukan cuma pertukaran
 * kalimat pendek spt Explorer — kalau tidak, level ini jadi cuma "Explorer
 * dgn kalimat lebih panjang", bukan genuinely lebih maju. SEMUA 9 topik di
 * bawah WAJIB py minimal 1 kalimat deskriptif (kata sifat) & 1 pertanyaan
 * "why"/alasan di `roleplay` — pembeda konkret dari Explorer. Domain
 * dipetakan ke 9 dari 13 domain `VOCAB_TOPICS_ADVENTURER` yg SAMA dgn 9
 * domain yg Listening Adventurer sudah pakai (`pekerjaan`/`binatang`/
 * `makanan`/`alat-sekolah`/`cuaca`/`anggota-tubuh`/`transportasi`/
 * `olahraga`/`rumah` — `perasaan`/`bahan-material`/`kata-kerja-harian`/
 * `alam-lingkungan` sengaja dilewati, sama alasan Listening: representasi
 * cukup di level lain), pola sama Explorer (id topik Speaking BEDA dari id
 * Listening biar tidak rancu baca kode, walau aman dari tabrakan progres).
 */
export const SPEAKING_TOPICS_ADVENTURER: SpeakingTopic[] = [
  {
    id: 'membuat-janji',
    title: 'Membuat Janji (Making Plans)',
    desc: '2 latihan bicara',
    model: ['Do you want to play together?', 'What time should we meet?'],
    drill: ['Let’s meet at the park.', 'I will see you tomorrow.'],
    roleplay: ['What are you doing this weekend?', 'Do you want to come to my house?', 'What time works for you?'],
  },
  {
    id: 'jadi-apa-nanti',
    title: 'Jadi Apa Nanti? (What Do You Want to Be?)',
    desc: '3 latihan bicara',
    model: ['A doctor helps sick people.', 'I want to be a teacher because I like helping others.'],
    drill: ['A firefighter is very brave.', 'A chef cooks delicious food.', 'A pilot flies an airplane.'],
    roleplay: ['What job do you want to have?', 'Why do you want that job?', 'What does a doctor do?'],
  },
  {
    id: 'deskripsi-hewan',
    title: 'Deskripsi Hewan (Describe the Animal)',
    desc: '3 latihan bicara',
    model: ['The giraffe has a long neck.', 'The elephant is bigger than the cat.'],
    drill: ['The lion is very strong.', 'The monkey is playful and funny.', 'The tortoise is slower than the rabbit.'],
    roleplay: ['What does a giraffe look like?', 'Which is bigger, an elephant or a mouse?', 'Why do you like your favorite animal?'],
  },
  {
    id: 'rasanya-gimana',
    title: 'Rasanya Gimana? (How Does It Taste?)',
    desc: '3 latihan bicara',
    model: ['This soup tastes spicy.', 'I like noodles because they are delicious.'],
    drill: ['The cake is sweet and soft.', 'The lemon tastes very sour.', 'This rice is warm and fluffy.'],
    roleplay: ['What is your favorite food?', 'Why do you like it?', 'How does it taste?'],
  },
  {
    id: 'di-tas-sekolahku',
    title: 'Di Tas Sekolahku (In My School Bag)',
    desc: '3 latihan bicara',
    model: ['I need a ruler to draw a straight line.', 'This eraser is small but useful.'],
    drill: ['I use a sharpener to sharpen my pencil.', 'My backpack is heavy today.', 'This notebook has many pages.'],
    roleplay: ['What is in your school bag?', 'Why do you need a ruler?', 'Which school supply is your favorite?'],
  },
  {
    id: 'cuaca-hari-ini',
    title: 'Cuaca Hari Ini (Today\'s Weather)',
    desc: '3 latihan bicara',
    model: ['It is sunny and hot today.', 'I bring an umbrella because it is rainy.'],
    drill: ['The wind is blowing strongly.', 'It is cold and cloudy outside.', 'I wear a jacket because it is windy.'],
    roleplay: ['What is the weather like today?', 'What do you wear when it is cold?', 'Do you like rainy days? Why?'],
  },
  {
    id: 'apa-fungsinya',
    title: 'Apa Fungsinya? (What\'s It For?)',
    desc: '3 latihan bicara',
    model: ['I use my eyes to see.', 'I use my legs to run fast.'],
    drill: ['I use my ears to hear music.', 'I use my hands to write.', 'I use my nose to smell flowers.'],
    roleplay: ['What do you use your eyes for?', 'Why are your legs important?', 'Which body part do you use the most?'],
  },
  {
    id: 'naik-apa-ke-sekolah',
    title: 'Naik Apa ke Sekolah? (How Do You Get to School?)',
    desc: '3 latihan bicara',
    model: ['I go to school by bus.', 'I like riding a bike because it is fun.'],
    drill: ['The train is faster than the bus.', 'A bicycle does not need fuel.', 'An airplane can fly very high.'],
    roleplay: ['How do you go to school?', 'Which transportation do you like best?', 'Why is a bicycle good for the environment?'],
  },
  {
    id: 'olahraga-favoritku',
    title: 'Olahraga Favoritku (My Favorite Sport)',
    desc: '3 latihan bicara',
    model: ['I play football with my friends.', 'I like swimming because it is relaxing.'],
    drill: ['Basketball needs a big ball.', 'Badminton is played with a racket.', 'Running makes me strong and healthy.'],
    roleplay: ['What sport do you like?', 'Why do you enjoy it?', 'What do you need to play badminton?'],
  },
  {
    id: 'ruangan-favoritku',
    title: 'Ruangan Favoritku (My Favorite Room)',
    desc: '3 latihan bicara',
    model: ['My bedroom is small but cozy.', 'I like the kitchen because it smells good.'],
    drill: ['The living room has a big sofa.', 'The bathroom is clean and bright.', 'The garden has many flowers.'],
    roleplay: ['What is your favorite room?', 'Why do you like it?', 'What do you do in the living room?'],
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
      { emoji: '🧹', target: ['He', 'cleaned', 'his', 'room'] },
      { emoji: '🍲', target: ['They', 'cooked', 'dinner'] },
      { emoji: '🎨', target: ['You', 'painted', 'a', 'picture'] },
    ],
    fill: {
      before: ['Yesterday,', 'I'],
      after: [],
      options: [{ word: 'played', emoji: '⚽' }, { word: 'walked', emoji: '🚶' }, { word: 'cooked', emoji: '🍳' }],
    },
  },
  /**
   * Topik ke-2 (permintaan riset per-level, `materi/grammar.md` §9) —
   * "Comparatives" (bigger/smaller/taller than) — struktur TERBESAR yang
   * ditambahkan Cambridge A1 Movers di atas Starters (dikonfirmasi riset:
   * Movers py comparative/superlative, have got/had to, past simple —
   * `simple-past` di atas sudah menutup satu, ini menutup yang lain).
   * Dipetakan dari `VOCAB_TOPICS_ADVENTURER` `binatang` (Animals) — ukuran
   * hewan adalah domain comparative KLASIK yang dipakai Cambridge Movers
   * sendiri di soal officialnya ("The elephant is bigger than the cat.").
   */
  {
    id: 'comparatives',
    title: 'Kata Sifat Perbandingan (Comparatives)',
    desc: 'Bigger / Smaller / Taller Than',
    examples: [
      { en: 'The elephant is bigger than the monkey.', emoji: '🐘' },
      { en: 'The giraffe is taller than the zebra.', emoji: '🦒' },
      { en: 'The monkey is smaller than the lion.', emoji: '🐒' },
    ],
    scramble: [
      { emoji: '🦁', target: ['The', 'lion', 'is', 'bigger', 'than', 'the', 'monkey'] },
      { emoji: '🐻', target: ['The', 'bear', 'is', 'bigger', 'than', 'the', 'panda'] },
    ],
    fill: {
      before: ['The', 'elephant', 'is', 'bigger', 'than', 'the'],
      after: [],
      options: [
        { word: 'zebra', emoji: '🦓' },
        { word: 'panda', emoji: '🐼' },
        { word: 'penguin', emoji: '🐧' },
      ],
    },
  },
  /**
   * 8 topik lanjutan (riset per-level, `materi/grammar.md` §17) — struktur
   * Cambridge A1 Movers (Handbook for Teachers) di ATAS `simple-past`/
   * `comparatives` yg sudah ada, dikonfirmasi Kurikulum Merdeka Fase C
   * (kelas 5-6 SD, ≈usia Adventurer) yg secara eksplisit menyebut nama
   * "Simple Past Tense" & "adjektiva komparatif DAN SUPERLATIF" sbg CP
   * fase ini — superlative & irregular past jadi prioritas krn keduanya
   * separuh struktur yg BELUM ditutup 2 topik lama (`simple-past` cuma
   * verb reguler, `comparatives` cuma comparative). Modal `can` (ability)
   * sudah diklaim Little Stars — modal Movers LAIN (`must`/`mustn't`,
   * `could` bentuk lampau) genuinely struktur baru, dikonfirmasi British
   * Council LearnEnglish Kids py unit "Modals: must and mustn't" berdiri
   * sendiri di usia ini. `prepositions-of-movement` beda dari
   * `prepositions-of-place`/`prepositions-of-time` Explorer (posisi/waktu
   * STATIS) — Movers resmi menambah preposisi GERAKAN (into/over/across/
   * through/dst) sbg kategori terpisah. Semua 8 dipetakan ke domain Vocab
   * Adventurer yg BELUM dipakai topik Grammar lain (`binatang` REUSE dari
   * `comparatives` sengaja, kelanjutan langsung; sisanya domain baru).
   */
  /**
   * Topik ke-3 — "Superlatives" (Cambridge Movers, "Anna is my best
   * friend.") — separuh SUPERLATIF dari kategori yg sama dgn
   * `comparatives` (Cambridge sendiri mendaftar comparative+superlative
   * sbg 1 kategori, app ini pisah jadi 2 topik krn muatannya beda cukup
   * jauh utk anak). Dari domain `binatang`, REUSE PERSIS domain
   * `comparatives` (kelanjutan langsung, bukan topik baru tanpa konteks).
   */
  {
    id: 'superlatives',
    title: 'Kata Sifat Superlatif (Superlatives)',
    desc: 'The Biggest / The Fastest',
    examples: [
      { en: 'The elephant is the biggest animal.', emoji: '🐘' },
      { en: 'The cheetah is the fastest animal.', emoji: '🐆' },
      { en: 'The snail is the slowest animal.', emoji: '🐌' },
    ],
    scramble: [
      { emoji: '🦒', target: ['The', 'giraffe', 'is', 'the', 'tallest', 'animal'] },
      { emoji: '🐜', target: ['The', 'ant', 'is', 'the', 'smallest', 'animal'] },
    ],
    fill: {
      before: ['The', 'giraffe', 'is', 'the'],
      after: ['animal', 'in', 'the', 'zoo'],
      options: [
        { word: 'tallest', emoji: '🦒' },
        { word: 'biggest', emoji: '🐘' },
        { word: 'smallest', emoji: '🐭' },
      ],
    },
  },
  /**
   * Topik ke-4 — "Irregular Past Simple" (Cambridge Movers, "past simple
   * regular AND IRREGULAR forms") — separuh IRREGULAR yg belum ditutup
   * `simple-past` (cuma verb reguler: played/watched/visited). Dari domain
   * `kata-kerja-harian` — kata kerja umum sehari-hari natural memunculkan
   * bentuk lampau tak-beraturan (go→went, eat→ate, see→saw, write→wrote).
   */
  {
    id: 'past-simple-irregular',
    title: 'Kata Kerja Lampau Tidak Beraturan (Irregular Past Simple)',
    desc: 'Went, Ate, Saw, Wrote...',
    examples: [
      { en: 'I went to school yesterday.', emoji: '🚶' },
      { en: 'She ate breakfast this morning.', emoji: '🍳' },
      { en: 'He saw a bird in the tree.', emoji: '🐦' },
    ],
    scramble: [
      { emoji: '✍️', target: ['She', 'wrote', 'a', 'letter', 'to', 'her', 'friend'] },
      { emoji: '🏃', target: ['They', 'ran', 'to', 'the', 'park'] },
    ],
    fill: {
      before: ['Yesterday,', 'I'],
      after: ['a', 'letter', 'to', 'my', 'grandma'],
      options: [
        { word: 'wrote', emoji: '✍️' },
        { word: 'sent', emoji: '📮' },
        { word: 'read', emoji: '📖' },
      ],
    },
  },
  /**
   * Topik ke-5 — "Could" (Cambridge Movers, modal lampau — "I could see
   * some birds in the tree.") — perpanjangan bentuk LAMPAU dari `can`
   * (kemampuan present, sudah diklaim Little Stars `bisa-tidak-bisa`),
   * genuinely struktur baru bukan re-skin. Dari domain `olahraga`.
   */
  {
    id: 'past-ability-could',
    title: 'Bisa di Masa Lalu (Could)',
    desc: 'Dulu Aku Bisa...',
    examples: [
      { en: 'I could swim when I was five.', emoji: '🏊' },
      { en: 'She could run fast last year.', emoji: '🏃' },
      { en: 'He could catch the ball yesterday.', emoji: '⚾' },
    ],
    scramble: [
      { emoji: '🎤', target: ['He', 'could', 'sing', 'very', 'well'] },
      { emoji: '🤸', target: ['They', 'could', 'jump', 'high', 'last', 'summer'] },
    ],
    fill: {
      before: ['Last', 'year', 'I', 'could'],
      after: ['every', 'morning'],
      options: [
        { word: 'swim', emoji: '🏊' },
        { word: 'run', emoji: '🏃' },
        { word: 'jump', emoji: '🤸' },
      ],
    },
  },
  /**
   * Topik ke-6 — "Must / Mustn't" (Cambridge Movers modal — "He must do
   * his homework." / "You mustn't give the rabbit cheese.") — modal yg
   * BELUM ada di curriculum manapun (Little Stars/Starter cuma py `can`).
   * Dari domain `alat-sekolah`, dibingkai aturan kelas.
   */
  {
    id: 'must-mustnt',
    title: "Harus & Tidak Boleh (Must / Mustn't)",
    desc: 'Aturan di Kelas',
    examples: [
      { en: 'You must bring your pencil case.', emoji: '✏️' },
      { en: 'You must bring your book to class.', emoji: '📚' },
      { en: "You mustn't forget your ruler.", emoji: '📏' },
    ],
    scramble: [
      { emoji: '👕', target: ['You', 'must', 'wear', 'your', 'uniform'] },
      { emoji: '🏃', target: ["You", "mustn't", 'run', 'in', 'the', 'hallway'] },
    ],
    fill: {
      before: ['In', 'class,', 'you', 'must', 'bring', 'your'],
      after: [],
      options: [
        { word: 'pencil', emoji: '✏️' },
        { word: 'ruler', emoji: '📏' },
        { word: 'eraser', emoji: '🧽' },
      ],
    },
  },
  /**
   * Topik ke-7 — "Go + -ing" (Cambridge Movers, "I went riding on
   * Saturday.") — pola idiomatik TERPISAH dari `like + -ing` (opini,
   * sudah diklaim Starter `suka-tidak-suka`) — ini konstruksi tetap
   * "pergi lalu beraktivitas". Dari domain `alam-lingkungan`.
   */
  {
    id: 'go-plus-ing',
    title: 'Pergi Beraktivitas (Go + -ing)',
    desc: 'Go Camping, Go Fishing',
    examples: [
      { en: 'We went camping in the mountains.', emoji: '⛺' },
      { en: 'They went fishing by the river.', emoji: '🎣' },
      { en: 'I went hiking in the forest.', emoji: '🥾' },
    ],
    scramble: [
      { emoji: '⛸️', target: ['He', 'went', 'skating', 'at', 'the', 'park'] },
      { emoji: '🏊', target: ['She', 'went', 'swimming', 'at', 'the', 'beach'] },
    ],
    fill: {
      before: ['Last', 'weekend,', 'we', 'went'],
      after: ['near', 'the', 'lake'],
      options: [
        { word: 'fishing', emoji: '🎣' },
        { word: 'swimming', emoji: '🏊' },
        { word: 'camping', emoji: '⛺' },
      ],
    },
  },
  /**
   * Topik ke-8 — "Prepositions of Movement" (Cambridge Movers, kategori
   * TERPISAH dari preposisi statis Starters — into/out of/over/across/
   * through/dst) — beda total dari `prepositions-of-place`/`prepositions-
   * of-time` Explorer (posisi/waktu STATIS). Dari domain `transportasi`.
   */
  {
    id: 'prepositions-of-movement',
    title: 'Preposisi Gerakan (Prepositions of Movement)',
    desc: 'Over / Under / Across / Through',
    examples: [
      { en: 'The car drove under the bridge.', emoji: '🚗' },
      { en: 'The plane flew over the mountain.', emoji: '✈️' },
      { en: 'The train went through the tunnel.', emoji: '🚆' },
    ],
    scramble: [
      { emoji: '⚽', target: ['The', 'ball', 'rolled', 'along', 'the', 'street'] },
      { emoji: '🐦', target: ['The', 'bird', 'flew', 'across', 'the', 'sky'] },
    ],
    fill: {
      before: ['The', 'boat', 'sailed'],
      after: ['the', 'river'],
      options: [
        { word: 'across', emoji: '↔️' },
        { word: 'along', emoji: '➡️' },
        { word: 'down', emoji: '🔽' },
      ],
    },
  },
  /**
   * Topik ke-9 — "Adverbs of Manner" (Cambridge Movers kategori Adverbs,
   * "He sang loudly.") — kelas struktur yg BELUM ada sama sekali di
   * curriculum (bukan cuma belum di Adventurer). Dari domain `perasaan`
   * (kata sifat perasaan → bentuk adverbianya: happy→happily, sad→sadly).
   */
  {
    id: 'adverbs-of-manner',
    title: 'Kata Keterangan Cara (Adverbs of Manner)',
    desc: 'Happily, Slowly, Loudly',
    examples: [
      { en: 'She smiled happily.', emoji: '😊' },
      { en: 'He shouted angrily.', emoji: '😠' },
      { en: 'The boy cried sadly.', emoji: '😢' },
    ],
    scramble: [
      { emoji: '🐱', target: ['The', 'cat', 'walked', 'quietly'] },
      { emoji: '📢', target: ['The', 'girl', 'sang', 'loudly'] },
    ],
    fill: {
      before: ['The', 'kitten', 'walked'],
      after: ['across', 'the', 'room'],
      options: [
        { word: 'quietly', emoji: '🤫' },
        { word: 'slowly', emoji: '🐢' },
        { word: 'happily', emoji: '😊' },
      ],
    },
  },
  /**
   * Topik ke-10 — "Because" (Cambridge Movers kategori Conjunctions —
   * because/so/but/or) — struktur penghubung sebab-akibat yg BELUM ada
   * sama sekali di curriculum. Dari domain `cuaca` — pasangan sebab-akibat
   * pakaian/tindakan↔cuaca paling natural utk anak.
   */
  {
    id: 'because-reasons',
    title: 'Memberi Alasan (Because)',
    desc: 'Karena Cuacanya...',
    examples: [
      { en: 'I wear a coat because it is cold.', emoji: '🧥' },
      { en: 'We stay inside because it is raining.', emoji: '☔' },
      { en: 'She wears sunglasses because it is sunny.', emoji: '🕶️' },
    ],
    scramble: [
      { emoji: '🌡️', target: ['He', 'turns', 'on', 'the', 'fan', 'because', 'it', 'is', 'hot'] },
      { emoji: '🌬️', target: ['He', 'closes', 'the', 'window', 'because', 'it', 'is', 'windy'] },
    ],
    fill: {
      before: ['I', 'carry', 'an', 'umbrella', 'because', 'it', 'is'],
      after: [],
      options: [
        { word: 'rainy', emoji: '🌧️' },
        { word: 'cloudy', emoji: '☁️' },
        { word: 'windy', emoji: '🌬️' },
      ],
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
        id: 'Zoe membawa apel untuk cemilan. Jerapah itu makan daun dari pohon.',
        question: 'What does the giraffe eat?',
        questionId: 'Apa yang dimakan jerapah itu?',
        opts: [{ emoji: '🍃', lbl: 'Leaves', ok: true }, { emoji: '🍎', lbl: 'Apple' }, { emoji: '🐟', lbl: 'Fish' }],
      },
      {
        passage: ['The lion is sleeping under a tree.', 'The monkey jumps from branch to branch.'],
        id: 'Singanya sedang tidur di bawah pohon. Monyet itu melompat dari dahan ke dahan.',
        question: 'What is the monkey doing?',
        questionId: 'Apa yang sedang dilakukan monyet itu?',
        opts: [{ emoji: '🐒', lbl: 'Jumping', ok: true }, { emoji: '😴', lbl: 'Sleeping' }, { emoji: '🍽️', lbl: 'Eating' }],
      },
    ],
    story: ['Zoe and her family go to the zoo.', 'They see elephants, lions, and monkeys.', 'Her favorite animal is the panda.'],
    storyId: 'Zoe dan keluarganya pergi ke kebun binatang. Mereka melihat gajah, singa, dan monyet. Hewan favoritnya adalah panda.',
    question: {
      text: 'What is Zoe’s favorite animal?',
      id: 'Apa hewan favorit Zoe?',
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
        id: 'Rio memakai kaos biru. Dia membuat istana pasir dengan ember merah.',
        question: 'What color is the bucket?',
        questionId: 'Apa warna embernya?',
        opts: [{ emoji: '🔴', lbl: 'Red', ok: true }, { emoji: '🔵', lbl: 'Blue' }, { emoji: '🟢', lbl: 'Green' }],
      },
      {
        passage: ['Rio takes a shower before lunch.', 'Then he swims in the sea.'],
        id: 'Rio mandi sebelum makan siang. Lalu dia berenang di laut.',
        question: 'Where does Rio swim?',
        questionId: 'Di mana Rio berenang?',
        opts: [{ emoji: '🌊', lbl: 'Sea', ok: true }, { emoji: '🏊', lbl: 'Pool' }, { emoji: '🚿', lbl: 'Shower' }],
      },
    ],
    story: ['Rio and his family go to the beach.', 'His sister has strawberry ice cream.', 'Rio has chocolate ice cream.'],
    storyId: 'Rio dan keluarganya pergi ke pantai. Kakaknya makan es krim stroberi. Rio makan es krim cokelat.',
    question: {
      text: 'What flavor ice cream does Rio have?',
      id: 'Rasa es krim apa yang dimakan Rio?',
      opts: [{ emoji: '🍫', lbl: 'Chocolate', ok: true }, { emoji: '🍓', lbl: 'Strawberry' }, { emoji: '🍋', lbl: 'Lemon' }],
    },
  },
  // 8 topik BARU (genapkan dari 2 ke 10, target CLAUDE.md ≥10 topik/skill,
  // `materi/reading.md` §9.3 — format TERVALIDASI ULANG oleh riset, murni
  // kerja data, TIDAK ada perubahan mekanik) — skenario keseharian anak
  // 9-11 th, pola anti-tebak yang sama (distraktor `drill` disebut di teks
  // tapi dilekatkan ke hal LAIN, opsi `story` akhir semuanya disebut di teks
  // spy anak wajib baca semua baris, bukan cuma cocok-gambar).
  {
    id: 'hari-sekolah',
    title: 'Hari Sekolah (School Day)',
    scene: '🎒',
    desc: '2 bacaan pendek',
    primer: [
      { passage: ['Zara wakes up early for school.', 'She wears her blue uniform.'], id: 'Zara bangun pagi untuk sekolah. Dia memakai seragam birunya.' },
      { passage: ['She packs her bag with books and pencils.', 'Then she eats breakfast quickly.'], id: 'Dia mengemas tasnya dengan buku dan pensil. Lalu dia sarapan dengan cepat.' },
    ],
    drill: [
      {
        passage: ['Zara puts a red apple and a sandwich in her lunch box.', 'Her friend Dini brings a banana and some crackers.'],
        id: 'Zara menaruh apel merah dan sandwich di kotak makannya. Temannya Dini membawa pisang dan beberapa biskuit.',
        question: 'What does Zara bring for lunch?',
        questionId: 'Apa yang dibawa Zara untuk makan siang?',
        opts: [{ emoji: '🍎', lbl: 'Apple and sandwich', ok: true }, { emoji: '🍌', lbl: 'Banana and crackers' }, { emoji: '🍬', lbl: 'Candy' }],
      },
      {
        passage: ['The math class starts first, then art class.', 'Zara loves art class the most.'],
        id: 'Kelas matematika dimulai duluan, lalu kelas seni. Zara paling suka kelas seni.',
        question: 'Which class starts first?',
        questionId: 'Kelas apa yang dimulai duluan?',
        opts: [{ emoji: '🔢', lbl: 'Math', ok: true }, { emoji: '🎨', lbl: 'Art' }, { emoji: '🎵', lbl: 'Music' }],
      },
    ],
    story: ['Zara and her classmates go to the library after lunch.', 'They read books about animals, space, and dinosaurs.', 'Zara says the book about the moon is her favorite.'],
    storyId: 'Zara dan teman-teman sekelasnya pergi ke perpustakaan setelah makan siang. Mereka membaca buku tentang hewan, luar angkasa, dan dinosaurus. Zara bilang buku tentang bulan adalah favoritnya.',
    question: {
      text: 'What is Zara’s favorite book about?',
      id: 'Buku tentang apa yang jadi favorit Zara?',
      opts: [{ emoji: '🌙', lbl: 'The moon', ok: true }, { emoji: '🦕', lbl: 'Dinosaurs' }, { emoji: '🐘', lbl: 'Animals' }],
    },
  },
  {
    id: 'pesta-ulang-tahun',
    title: 'Pesta Ulang Tahun (Birthday Party)',
    scene: '🎂',
    desc: '2 bacaan pendek',
    primer: [
      { passage: ['Toni is having a birthday party today.', 'His mom bakes a chocolate cake.'], id: 'Toni sedang mengadakan pesta ulang tahun hari ini. Ibunya memanggang kue cokelat.' },
      { passage: ['Toni invites his friends from school.', 'They bring balloons and gifts.'], id: 'Toni mengundang teman-temannya dari sekolah. Mereka membawa balon dan hadiah.' },
    ],
    drill: [
      {
        passage: ['Toni’s friends bring a red balloon and a blue balloon.', 'Toni ties the red balloon to his chair.'],
        id: 'Teman-teman Toni membawa balon merah dan balon biru. Toni mengikat balon merah ke kursinya.',
        question: 'Which balloon does Toni tie to his chair?',
        questionId: 'Balon mana yang diikat Toni ke kursinya?',
        opts: [{ emoji: '🔴', lbl: 'Red', ok: true }, { emoji: '🔵', lbl: 'Blue' }, { emoji: '🟡', lbl: 'Yellow' }],
      },
      {
        passage: ['Dini gives Toni a storybook, and Budi gives him a toy car.', 'Toni says the toy car is his favorite gift.'],
        id: 'Dini memberi Toni buku cerita, dan Budi memberinya mobil mainan. Toni bilang mobil mainan itu hadiah favoritnya.',
        question: 'What is Toni’s favorite gift?',
        questionId: 'Apa hadiah favorit Toni?',
        opts: [{ emoji: '🚗', lbl: 'Toy car', ok: true }, { emoji: '📖', lbl: 'Storybook' }, { emoji: '🎈', lbl: 'Balloon' }],
      },
    ],
    story: ['All the friends sing a happy birthday song for Toni.', 'Toni closes his eyes and blows out the candles.', 'Everyone claps and eats chocolate cake together.'],
    storyId: 'Semua teman menyanyikan lagu ulang tahun untuk Toni. Toni menutup matanya dan meniup lilinnya. Semua orang bertepuk tangan dan makan kue cokelat bersama.',
    question: {
      text: 'What does Toni do after he closes his eyes?',
      id: 'Apa yang dilakukan Toni setelah menutup matanya?',
      opts: [{ emoji: '🕯️', lbl: 'Blows out the candles', ok: true }, { emoji: '👏', lbl: 'Claps his hands' }, { emoji: '🎂', lbl: 'Eats the cake' }],
    },
  },
  {
    id: 'belanja-di-pasar',
    title: 'Belanja di Pasar (Shopping at the Market)',
    scene: '🛒',
    desc: '2 bacaan pendek',
    primer: [
      { passage: ['Mother goes to the market on Saturday.', 'She brings a big shopping bag.'], id: 'Ibu pergi ke pasar hari Sabtu. Dia membawa tas belanja besar.' },
      { passage: ['She buys fresh vegetables and fruits.', 'The market is busy and colorful.'], id: 'Dia membeli sayur dan buah segar. Pasarnya ramai dan berwarna-warni.' },
    ],
    drill: [
      {
        passage: ['Mother buys three tomatoes and two carrots.', 'She also buys a bag of rice.'],
        id: 'Ibu membeli tiga tomat dan dua wortel. Dia juga membeli sekantong beras.',
        question: 'How many tomatoes does mother buy?',
        questionId: 'Berapa banyak tomat yang dibeli ibu?',
        opts: [{ emoji: '3️⃣', lbl: 'Three', ok: true }, { emoji: '2️⃣', lbl: 'Two' }, { emoji: '1️⃣', lbl: 'One' }],
      },
      {
        passage: ['The fruit seller offers mangoes and grapes.', 'Mother chooses the sweet mangoes for dessert.'],
        id: 'Penjual buah menawarkan mangga dan anggur. Ibu memilih mangga manis untuk pencuci mulut.',
        question: 'What fruit does mother choose?',
        questionId: 'Buah apa yang dipilih ibu?',
        opts: [{ emoji: '🥭', lbl: 'Mangoes', ok: true }, { emoji: '🍇', lbl: 'Grapes' }, { emoji: '🍌', lbl: 'Bananas' }],
      },
    ],
    story: ['At the market, mother meets her friend Mrs. Sari.', 'They talk while looking at fresh fish and eggs.', 'Mother decides to buy eggs, but not fish, because they already have fish at home.'],
    storyId: 'Di pasar, ibu bertemu temannya, Bu Sari. Mereka mengobrol sambil melihat ikan dan telur segar. Ibu memutuskan membeli telur, tapi tidak ikan, karena mereka sudah punya ikan di rumah.',
    question: {
      text: 'Why does mother not buy fish?',
      id: 'Kenapa ibu tidak membeli ikan?',
      opts: [{ emoji: '🏠', lbl: 'They already have fish at home', ok: true }, { emoji: '💰', lbl: 'It is too expensive' }, { emoji: '🐟', lbl: 'It is not fresh' }],
    },
  },
  {
    id: 'hari-hujan',
    title: 'Hari Hujan (Rainy Day)',
    scene: '🌧️',
    desc: '2 bacaan pendek',
    primer: [
      { passage: ['It is raining outside today.', 'Dito wears his yellow raincoat.'], id: 'Hari ini hujan di luar. Dito memakai jas hujan kuningnya.' },
      { passage: ['He carries a blue umbrella too.', 'The streets are wet and shiny.'], id: 'Dia juga membawa payung biru. Jalanan basah dan berkilau.' },
    ],
    drill: [
      {
        passage: ['Dito jumps over a big puddle near the school gate.', 'His sister walks around a small puddle instead.'],
        id: 'Dito melompati genangan air besar dekat gerbang sekolah. Kakaknya malah berjalan mengitari genangan air kecil.',
        question: 'What does Dito do at the puddle?',
        questionId: 'Apa yang dilakukan Dito di genangan air itu?',
        opts: [{ emoji: '🦘', lbl: 'Jumps over it', ok: true }, { emoji: '🚶', lbl: 'Walks around it' }, { emoji: '🛑', lbl: 'Stops there' }],
      },
      {
        passage: ['Thunder booms loudly, and Dito’s little brother feels scared.', 'Dito hugs his brother and says it is okay.'],
        id: 'Petir menggelegar keras, dan adik Dito merasa takut. Dito memeluk adiknya dan bilang tidak apa-apa.',
        question: 'How does Dito’s brother feel?',
        questionId: 'Bagaimana perasaan adik Dito?',
        opts: [{ emoji: '😨', lbl: 'Scared', ok: true }, { emoji: '😊', lbl: 'Happy' }, { emoji: '😴', lbl: 'Sleepy' }],
      },
    ],
    story: ['After school, the rain stops and the sun comes out.', 'Dito sees a beautiful rainbow in the sky.', 'He counts the colors and finds seven of them.'],
    storyId: 'Setelah sekolah, hujan berhenti dan matahari muncul. Dito melihat pelangi indah di langit. Dia menghitung warnanya dan menemukan tujuh warna.',
    question: {
      text: 'What does Dito see in the sky?',
      id: 'Apa yang dilihat Dito di langit?',
      opts: [{ emoji: '🌈', lbl: 'A rainbow', ok: true }, { emoji: '☀️', lbl: 'The sun' }, { emoji: '🌧️', lbl: 'The rain' }],
    },
  },
  {
    id: 'hari-olahraga',
    title: 'Hari Olahraga (Sports Day)',
    scene: '⚽',
    desc: '2 bacaan pendek',
    primer: [
      { passage: ['Today is Sports Day at school.', 'All students wear their sports uniform.'], id: 'Hari ini Hari Olahraga di sekolah. Semua murid memakai seragam olahraga.' },
      { passage: ['Students can join running or jumping games.', 'Everyone is excited and cheering.'], id: 'Murid-murid bisa ikut lomba lari atau lompat. Semuanya bersemangat dan bersorak.' },
    ],
    drill: [
      {
        passage: ['Rian joins the running race, and his friend Budi joins the jumping game.', 'Rian finishes the race in second place.'],
        id: 'Rian ikut lomba lari, dan temannya Budi ikut lomba lompat. Rian menyelesaikan lomba di posisi kedua.',
        question: 'What race does Rian join?',
        questionId: 'Lomba apa yang diikuti Rian?',
        opts: [{ emoji: '🏃', lbl: 'Running', ok: true }, { emoji: '🤸', lbl: 'Jumping' }, { emoji: '🏊', lbl: 'Swimming' }],
      },
      {
        passage: ['The red team scores two points, and the blue team scores three points.', 'The blue team wins the game.'],
        id: 'Tim merah mendapat dua poin, dan tim biru mendapat tiga poin. Tim biru memenangkan pertandingan.',
        question: 'Which team wins the game?',
        questionId: 'Tim mana yang memenangkan pertandingan?',
        opts: [{ emoji: '🔵', lbl: 'Blue team', ok: true }, { emoji: '🔴', lbl: 'Red team' }, { emoji: '🟢', lbl: 'Green team' }],
      },
    ],
    story: ['At the end of the day, the teacher gives out medals.', 'Rian gets a silver medal for second place.', 'His friend Budi gets a gold medal for first place in jumping.'],
    storyId: 'Di akhir hari, gurunya membagikan medali. Rian mendapat medali perak untuk posisi kedua. Temannya Budi mendapat medali emas untuk posisi pertama di lomba lompat.',
    question: {
      text: 'What medal does Budi get?',
      id: 'Medali apa yang didapat Budi?',
      opts: [{ emoji: '🥇', lbl: 'Gold medal', ok: true }, { emoji: '🥈', lbl: 'Silver medal' }, { emoji: '🥉', lbl: 'Bronze medal' }],
    },
  },
  {
    id: 'memasak-di-dapur',
    title: 'Memasak di Dapur (Cooking in the Kitchen)',
    scene: '🍳',
    desc: '2 bacaan pendek',
    primer: [
      { passage: ['Grandma cooks fried rice in the kitchen.', 'She uses eggs, rice, and vegetables.'], id: 'Nenek memasak nasi goreng di dapur. Dia memakai telur, nasi, dan sayuran.' },
      { passage: ['The kitchen smells delicious.', 'Everyone comes to see what is cooking.'], id: 'Dapurnya berbau lezat. Semua orang datang untuk melihat apa yang sedang dimasak.' },
    ],
    drill: [
      {
        passage: ['Grandma cracks two eggs into the pan.', 'She saves one egg for breakfast tomorrow.'],
        id: 'Nenek memecahkan dua telur ke wajan. Dia menyimpan satu telur untuk sarapan besok.',
        question: 'How many eggs does grandma cook now?',
        questionId: 'Berapa banyak telur yang dimasak nenek sekarang?',
        opts: [{ emoji: '2️⃣', lbl: 'Two', ok: true }, { emoji: '1️⃣', lbl: 'One' }, { emoji: '3️⃣', lbl: 'Three' }],
      },
      {
        passage: ['Grandma adds carrots and peas to the rice.', 'She does not add corn because nobody likes it.'],
        id: 'Nenek menambahkan wortel dan kacang polong ke nasinya. Dia tidak menambahkan jagung karena tidak ada yang suka.',
        question: 'What vegetable does grandma NOT add?',
        questionId: 'Sayuran apa yang TIDAK ditambahkan nenek?',
        opts: [{ emoji: '🌽', lbl: 'Corn', ok: true }, { emoji: '🥕', lbl: 'Carrots' }, { emoji: '🫛', lbl: 'Peas' }],
      },
    ],
    story: ['When the fried rice is ready, grandma calls everyone to the table.', 'She also makes a plate of sliced cucumbers and tomatoes.', 'Dito eats two plates because it tastes so good.'],
    storyId: 'Ketika nasi gorengnya siap, nenek memanggil semua orang ke meja. Dia juga membuat satu piring irisan timun dan tomat. Dito makan dua piring karena rasanya sangat enak.',
    question: {
      text: 'How many plates does Dito eat?',
      id: 'Berapa piring yang dimakan Dito?',
      opts: [{ emoji: '2️⃣', lbl: 'Two plates', ok: true }, { emoji: '1️⃣', lbl: 'One plate' }, { emoji: '3️⃣', lbl: 'Three plates' }],
    },
  },
  {
    id: 'taman-bermain',
    title: 'Di Taman Bermain (At the Playground)',
    scene: '🛝',
    desc: '2 bacaan pendek',
    primer: [
      { passage: ['Maya goes to the playground after school.', 'She wants to play on the slide.'], id: 'Maya pergi ke taman bermain setelah sekolah. Dia ingin main perosotan.' },
      { passage: ['Her brother prefers the swing.', 'They play together happily.'], id: 'Kakaknya lebih suka ayunan. Mereka bermain bersama dengan senang.' },
    ],
    drill: [
      {
        passage: ['Maya climbs up the ladder and slides down fast.', 'Her brother pushes the swing higher and higher.'],
        id: 'Maya memanjat tangga dan meluncur turun dengan cepat. Kakaknya mendorong ayunan makin tinggi.',
        question: 'What does Maya slide down?',
        questionId: 'Apa yang diluncuri Maya?',
        opts: [{ emoji: '🛝', lbl: 'The slide', ok: true }, { emoji: '🎢', lbl: 'A roller coaster' }, { emoji: '🪜', lbl: 'A ladder' }],
      },
      {
        passage: ['Three kids wait in line for the seesaw.', 'Maya and her brother wait for the monkey bars instead.'],
        id: 'Tiga anak antre untuk jungkat-jungkit. Maya dan kakaknya malah menunggu giliran panjatan monyet.',
        question: 'What do Maya and her brother wait for?',
        questionId: 'Apa yang ditunggu Maya dan kakaknya?',
        opts: [{ emoji: '🐒', lbl: 'The monkey bars', ok: true }, { emoji: '⚖️', lbl: 'The seesaw' }, { emoji: '🛝', lbl: 'The slide' }],
      },
    ],
    story: ['After playing for an hour, Maya feels thirsty.', 'She asks her brother to share his water bottle.', 'They sit on a bench and rest before going home.'],
    storyId: 'Setelah bermain satu jam, Maya merasa haus. Dia meminta kakaknya berbagi botol minumnya. Mereka duduk di bangku dan beristirahat sebelum pulang.',
    question: {
      text: 'Where do Maya and her brother rest?',
      id: 'Di mana Maya dan kakaknya beristirahat?',
      opts: [{ emoji: '🪑', lbl: 'On a bench', ok: true }, { emoji: '🌱', lbl: 'On the grass' }, { emoji: '🛝', lbl: 'On the slide' }],
    },
  },
  {
    id: 'perjalanan-kereta',
    title: 'Perjalanan Kereta (Train Trip)',
    scene: '🚆',
    desc: '2 bacaan pendek',
    primer: [
      { passage: ['Fajar takes a train to visit his grandpa.', 'He sits by the window.'], id: 'Fajar naik kereta untuk mengunjungi kakeknya. Dia duduk dekat jendela.' },
      { passage: ['The train passes rice fields and rivers.', 'Fajar watches everything with excitement.'], id: 'Kereta melewati sawah dan sungai. Fajar mengamati semuanya dengan senang.' },
    ],
    drill: [
      {
        passage: ['The train stops at two small stations before the big city.', 'Fajar counts the stations on his fingers.'],
        id: 'Kereta berhenti di dua stasiun kecil sebelum kota besar. Fajar menghitung stasiunnya dengan jari.',
        question: 'How many small stations does the train stop at?',
        questionId: 'Berapa stasiun kecil yang disinggahi kereta?',
        opts: [{ emoji: '2️⃣', lbl: 'Two', ok: true }, { emoji: '1️⃣', lbl: 'One' }, { emoji: '3️⃣', lbl: 'Three' }],
      },
      {
        passage: ['Fajar buys a snack from the train seller.', 'He chooses crackers instead of candy.'],
        id: 'Fajar membeli camilan dari penjual di kereta. Dia memilih biskuit, bukan permen.',
        question: 'What snack does Fajar choose?',
        questionId: 'Camilan apa yang dipilih Fajar?',
        opts: [{ emoji: '🍪', lbl: 'Crackers', ok: true }, { emoji: '🍬', lbl: 'Candy' }, { emoji: '🍫', lbl: 'Chocolate' }],
      },
    ],
    story: ['When the train arrives, grandpa is waiting at the station.', 'He is holding a bunch of yellow bananas for Fajar.', 'Fajar runs and gives grandpa a big hug.'],
    storyId: 'Ketika kereta tiba, kakek sudah menunggu di stasiun. Dia membawa sesisir pisang kuning untuk Fajar. Fajar berlari dan memeluk kakek erat-erat.',
    question: {
      text: 'What is grandpa holding at the station?',
      id: 'Apa yang dibawa kakek di stasiun?',
      opts: [{ emoji: '🍌', lbl: 'Bananas', ok: true }, { emoji: '🎈', lbl: 'Balloons' }, { emoji: '📷', lbl: 'A camera' }],
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
    // Pilot mini-game "Kelompokkan" (`materi/game.md` §7 kandidat #1,
    // CLAUDE.md "Format Wajib Materi Vocabulary" poin 1) — dipilih topik ini
    // krn kategorisasinya genuinely melekat di SUBJEK topiknya sendiri
    // (bentuk bulat vs bentuk bersudut), bukan dimensi lain yang dipaksakan
    // (mis. warna/fungsi) yang bisa terasa arbitrer buat anak 3-5 th.
    sortBaskets: { a: { label: 'Bundar', emoji: '⚪' }, b: { label: 'Bersudut', emoji: '🔺' } },
    items: [
      { en: 'Circle', id: 'Lingkaran', emoji: '⚪', example: { en: 'This is a circle.', id: 'Ini lingkaran.', emoji: '⚪' }, group: 'a' },
      { en: 'Square', id: 'Persegi', emoji: '⬜', example: { en: 'This is a square.', id: 'Ini persegi.', emoji: '⬜' }, group: 'b' },
      { en: 'Triangle', id: 'Segitiga', emoji: '🔺', example: { en: 'This is a triangle.', id: 'Ini segitiga.', emoji: '🔺' }, group: 'b' },
      { en: 'Star', id: 'Bintang', emoji: '⭐', example: { en: 'This is a star.', id: 'Ini bintang.', emoji: '⭐' }, group: 'b' },
      { en: 'Heart', id: 'Hati', emoji: '❤️', example: { en: 'This is a heart.', id: 'Ini hati.', emoji: '❤️' }, group: 'a' },
      { en: 'Diamond', id: 'Berlian', emoji: '🔷', example: { en: 'This is a diamond.', id: 'Ini berlian.', emoji: '🔷' }, group: 'b' },
      { en: 'Oval', id: 'Oval', emoji: '🥚', example: { en: 'This is an oval.', id: 'Ini bentuk oval.', emoji: '🥚' }, group: 'a' },
      { en: 'Cross', id: 'Silang', emoji: '➕', example: { en: 'This is a cross.', id: 'Ini tanda silang.', emoji: '➕' }, group: 'b' },
      { en: 'Arrow', id: 'Panah', emoji: '➡️', example: { en: 'This is an arrow.', id: 'Ini panah.', emoji: '➡️' }, group: 'b' },
      { en: 'Moon', id: 'Bulan', emoji: '🌙', example: { en: 'This is the moon.', id: 'Ini bulan.', emoji: '🌙' }, group: 'a' },
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
 * Konten Trailblazer (≈B1, "jalur lanjutan", 12+ th). PRD §9 mengunci level
 * ini sbg "low-effort, 1–2 modul preview" — 2 topik pertama (`perjalanan-
 * wisata`/`bahasa-komunikasi`) dipetakan dari situ, riset lengkap materi/
 * vocab.md §3F. **Target itu DINAIKKAN** (CLAUDE.md "Target Kelengkapan
 * Konten per Modul" poin 1, revisi user) — Trailblazer TETAP jalur bonus
 * yang lebih ringan drpd 5 level lain (bukan disamakan ke ≥10), TAPI
 * minimal ≥5 topik/skill, bukan 1-2 lagi. 3 topik BARU (`pendidikan-
 * akademik`/`pendapat-pengalaman`/`hiburan-media`) menggenapkan 2→5 —
 * riset ulang eksplisit ke lembaga Indonesia (Kurikulum Merdeka Fase E/F,
 * LIA, EF Trailblazers) sbg konfirmasi ARAH (akademik/reflektif/critical-
 * thinking), 3 TEMA dipilih dari residual Cambridge **B1 Preliminary (PET)**
 * yang genuinely belum tersentuh 5 level bawah (materi/vocab.md §3F.2 sudah
 * riset 20 tema PET, tinggal dipetakan) — riset lengkap materi/vocab.md
 * §3F.4/§3F.5.
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
  {
    id: 'pendidikan-akademik',
    title: 'Pendidikan & Kehidupan Akademik (Education & Academic Life)',
    desc: '10 kata',
    items: [
      { en: 'Campus', id: 'Kampus', emoji: '🏫', example: { en: 'I study at a big campus.', id: 'Aku belajar di kampus yang besar.', emoji: '🏫' } },
      { en: 'Degree', id: 'Gelar', emoji: '🎓', example: { en: 'She earned a degree in science.', id: 'Dia mendapatkan gelar di bidang sains.', emoji: '🎓' } },
      { en: 'Scholarship', id: 'Beasiswa', emoji: '💰', example: { en: 'He won a scholarship for university.', id: 'Dia memenangkan beasiswa untuk kuliah.', emoji: '💰' } },
      { en: 'Lecture', id: 'Kuliah', emoji: '🧑‍🏫', example: { en: 'We listened to an interesting lecture.', id: 'Kami mendengarkan kuliah yang menarik.', emoji: '🧑‍🏫' } },
      { en: 'Essay', id: 'Esai', emoji: '📝', example: { en: 'I wrote an essay about my future.', id: 'Aku menulis esai tentang masa depanku.', emoji: '📝' } },
      { en: 'Exam', id: 'Ujian', emoji: '📄', example: { en: 'I studied hard for the exam.', id: 'Aku belajar keras untuk ujian itu.', emoji: '📄' } },
      { en: 'Library', id: 'Perpustakaan', emoji: '📚', example: { en: 'I borrow books from the library.', id: 'Aku meminjam buku dari perpustakaan.', emoji: '📚' } },
      { en: 'Graduate', id: 'Lulus', emoji: '🎉', example: { en: 'She will graduate next year.', id: 'Dia akan lulus tahun depan.', emoji: '🎉' } },
      { en: 'Curriculum', id: 'Kurikulum', emoji: '📋', example: { en: 'Our curriculum includes many subjects.', id: 'Kurikulum kami mencakup banyak mata pelajaran.', emoji: '📋' } },
      { en: 'Knowledge', id: 'Pengetahuan', emoji: '🧠', example: { en: 'Reading gives you more knowledge.', id: 'Membaca memberimu lebih banyak pengetahuan.', emoji: '🧠' } },
    ],
  },
  {
    id: 'pendapat-pengalaman',
    title: 'Pendapat & Pengalaman (Opinions & Experiences)',
    desc: '10 kata',
    items: [
      { en: 'Opinion', id: 'Pendapat', emoji: '💭', example: { en: 'I have an opinion about this movie.', id: 'Aku punya pendapat tentang film ini.', emoji: '💭' } },
      { en: 'Experience', id: 'Pengalaman', emoji: '🌟', example: { en: 'Traveling was a great experience.', id: 'Bepergian adalah pengalaman yang seru.', emoji: '🌟' } },
      { en: 'Achievement', id: 'Prestasi', emoji: '🏆', example: { en: 'Winning the contest was my achievement.', id: 'Menang lomba itu adalah prestasiku.', emoji: '🏆' } },
      { en: 'Curious', id: 'Penasaran', emoji: '🤔', example: { en: 'I am curious about space.', id: 'Aku penasaran tentang luar angkasa.', emoji: '🤔' } },
      { en: 'Memorable', id: 'Berkesan', emoji: '📸', example: { en: 'It was a memorable day.', id: 'Itu adalah hari yang berkesan.', emoji: '📸' } },
      { en: 'Disagree', id: 'Tidak Setuju', emoji: '🙅', example: { en: 'I disagree with that idea.', id: 'Aku tidak setuju dengan ide itu.', emoji: '🙅' } },
      { en: 'Agree', id: 'Setuju', emoji: '🙆', example: { en: 'I agree with your plan.', id: 'Aku setuju dengan rencanamu.', emoji: '🙆' } },
      { en: 'Impressed', id: 'Terkesan', emoji: '😲', example: { en: 'I am impressed by her talent.', id: 'Aku terkesan dengan talentanya.', emoji: '😲' } },
      { en: 'Prefer', id: 'Lebih Suka', emoji: '❤️', example: { en: 'I prefer tea over coffee.', id: 'Aku lebih suka teh daripada kopi.', emoji: '❤️' } },
      { en: 'Suggest', id: 'Menyarankan', emoji: '💡', example: { en: 'I suggest we try this game.', id: 'Aku menyarankan kita coba permainan ini.', emoji: '💡' } },
    ],
  },
  {
    id: 'hiburan-media',
    title: 'Hiburan & Media (Entertainment & Media)',
    desc: '10 kata',
    items: [
      { en: 'Documentary', id: 'Dokumenter', emoji: '🎥', example: { en: 'I watched a documentary about animals.', id: 'Aku menonton dokumenter tentang hewan.', emoji: '🎥' } },
      { en: 'Headline', id: 'Judul Berita', emoji: '📰', example: { en: 'The headline caught my attention.', id: 'Judul berita itu menarik perhatianku.', emoji: '📰' } },
      { en: 'Broadcast', id: 'Siaran', emoji: '📡', example: { en: 'The news broadcast starts at seven.', id: 'Siaran berita dimulai pukul tujuh.', emoji: '📡' } },
      { en: 'Review', id: 'Ulasan', emoji: '⭐', example: { en: 'I read a review before watching it.', id: 'Aku membaca ulasan sebelum menontonnya.', emoji: '⭐' } },
      { en: 'Subscribe', id: 'Berlangganan', emoji: '🔔', example: { en: 'I subscribe to my favorite channel.', id: 'Aku berlangganan kanal favoritku.', emoji: '🔔' } },
      { en: 'Streaming', id: 'Streaming', emoji: '📱', example: { en: 'We enjoy streaming movies at home.', id: 'Kami suka streaming film di rumah.', emoji: '📱' } },
      { en: 'Episode', id: 'Episode', emoji: '🎬', example: { en: 'This episode was really exciting.', id: 'Episode ini sangat mengasyikkan.', emoji: '🎬' } },
      { en: 'Interview', id: 'Wawancara', emoji: '🎤', example: { en: 'The reporter did an interview with the actor.', id: 'Reporter itu mewawancarai aktor itu.', emoji: '🎤' } },
      { en: 'Animation', id: 'Animasi', emoji: '🎨', example: { en: 'I love watching animation movies.', id: 'Aku suka menonton film animasi.', emoji: '🎨' } },
      { en: 'Audience', id: 'Penonton', emoji: '👥', example: { en: 'The audience clapped loudly.', id: 'Penonton bertepuk tangan dengan keras.', emoji: '👥' } },
    ],
  },
  {
    id: 'layanan-masyarakat',
    title: 'Layanan Masyarakat (Public Services)',
    desc: '10 kata',
    items: [
      { en: 'Pharmacy', id: 'Apotek', emoji: '💊', example: { en: 'I buy medicine at the pharmacy.', id: 'Aku membeli obat di apotek.', emoji: '💊' } },
      { en: 'Hairdresser', id: 'Tukang Cukur', emoji: '💇', example: { en: 'I get a haircut at the hairdresser.', id: 'Aku potong rambut di tukang cukur.', emoji: '💇' } },
      { en: 'Dentist', id: 'Dokter Gigi', emoji: '🦷', example: { en: 'I visit the dentist every year.', id: 'Aku mengunjungi dokter gigi setiap tahun.', emoji: '🦷' } },
      { en: 'Mechanic', id: 'Montir', emoji: '🔧', example: { en: 'The mechanic fixes our car.', id: 'Montir itu memperbaiki mobil kami.', emoji: '🔧' } },
      { en: 'Laundry', id: 'Laundry', emoji: '🧺', example: { en: 'I take my clothes to the laundry.', id: 'Aku membawa bajuku ke laundry.', emoji: '🧺' } },
      { en: 'Petrol Station', id: 'Pom Bensin', emoji: '⛽', example: { en: 'We stop at the petrol station.', id: 'Kami berhenti di pom bensin.', emoji: '⛽' } },
      { en: 'Fire Station', id: 'Pos Pemadam Kebakaran', emoji: '🚒', example: { en: 'The fire station is close to my house.', id: 'Pos pemadam kebakaran itu dekat rumahku.', emoji: '🚒' } },
      { en: 'Vet', id: 'Dokter Hewan', emoji: '🐾', example: { en: 'I take my cat to the vet.', id: 'Aku membawa kucingku ke dokter hewan.', emoji: '🐾' } },
      { en: 'Optician', id: 'Toko Kacamata', emoji: '👓', example: { en: 'I get new glasses at the optician.', id: 'Aku membeli kacamata baru di toko kacamata.', emoji: '👓' } },
      { en: 'Tailor', id: 'Penjahit', emoji: '✂️', example: { en: 'The tailor makes my school uniform.', id: 'Penjahit itu membuat seragam sekolahku.', emoji: '✂️' } },
    ],
  },
  {
    id: 'peralatan-elektronik',
    title: 'Peralatan Elektronik Rumah (Home Appliances)',
    desc: '10 kata',
    items: [
      { en: 'Washing Machine', id: 'Mesin Cuci', emoji: '🫧', example: { en: 'Mom washes clothes in the washing machine.', id: 'Ibu mencuci baju di mesin cuci.', emoji: '🫧' } },
      { en: 'Air Conditioner', id: 'AC', emoji: '❄️', example: { en: 'The air conditioner keeps the room cool.', id: 'AC itu membuat ruangan sejuk.', emoji: '❄️' } },
      { en: 'Printer', id: 'Printer', emoji: '🖨️', example: { en: 'I print my homework with the printer.', id: 'Aku mencetak PR-ku dengan printer.', emoji: '🖨️' } },
      { en: 'Radio', id: 'Radio', emoji: '📻', example: { en: 'Dad listens to the radio every morning.', id: 'Ayah mendengarkan radio setiap pagi.', emoji: '📻' } },
      { en: 'Rice Cooker', id: 'Penanak Nasi', emoji: '🍚', example: { en: 'The rice cooker makes rice every day.', id: 'Penanak nasi itu memasak nasi setiap hari.', emoji: '🍚' } },
      { en: 'Electric Fan', id: 'Kipas Angin', emoji: '🌀', example: { en: 'The electric fan cools the room.', id: 'Kipas angin itu menyejukkan ruangan.', emoji: '🌀' } },
      { en: 'Water Heater', id: 'Pemanas Air', emoji: '🚿', example: { en: 'The water heater warms my shower.', id: 'Pemanas air itu menghangatkan air mandiku.', emoji: '🚿' } },
      { en: 'Speaker', id: 'Speaker', emoji: '🔊', example: { en: 'We play music on the speaker.', id: 'Kami memutar musik di speaker.', emoji: '🔊' } },
      { en: 'Charger', id: 'Charger', emoji: '🔌', example: { en: 'I plug in the charger at night.', id: 'Aku mencolokkan charger di malam hari.', emoji: '🔌' } },
      { en: 'Doorbell', id: 'Bel Pintu', emoji: '🔔', example: { en: 'The doorbell rings when a guest arrives.', id: 'Bel pintu berbunyi ketika tamu datang.', emoji: '🔔' } },
    ],
  },
  {
    id: 'bangunan-sekitar',
    title: 'Bangunan di Sekitar Kita (Buildings Around Us)',
    desc: '10 kata',
    items: [
      { en: 'Castle', id: 'Kastil', emoji: '🏰', example: { en: 'The princess lives in a castle.', id: 'Sang putri tinggal di kastil.', emoji: '🏰' } },
      { en: 'Palace', id: 'Istana', emoji: '🏯', example: { en: 'The king lives in a palace.', id: 'Sang raja tinggal di istana.', emoji: '🏯' } },
      { en: 'Tower', id: 'Menara', emoji: '🗼', example: { en: 'We climb the tall tower.', id: 'Kami menaiki menara yang tinggi.', emoji: '🗼' } },
      { en: 'Skyscraper', id: 'Gedung Pencakar Langit', emoji: '🏙️', example: { en: 'The skyscraper is very tall.', id: 'Gedung pencakar langit itu sangat tinggi.', emoji: '🏙️' } },
      { en: 'Apartment', id: 'Apartemen', emoji: '🏢', example: { en: 'My cousin lives in an apartment.', id: 'Sepupuku tinggal di apartemen.', emoji: '🏢' } },
      { en: 'Factory', id: 'Pabrik', emoji: '🏭', example: { en: 'Dad works at a factory.', id: 'Ayah bekerja di pabrik.', emoji: '🏭' } },
      { en: 'Church', id: 'Gereja', emoji: '⛪', example: { en: 'They go to church on Sunday.', id: 'Mereka pergi ke gereja pada hari Minggu.', emoji: '⛪' } },
      { en: 'Mosque', id: 'Masjid', emoji: '🕌', example: { en: 'We pray at the mosque.', id: 'Kami salat di masjid.', emoji: '🕌' } },
      { en: 'Temple', id: 'Pura', emoji: '🛕', example: { en: 'They visit the temple together.', id: 'Mereka mengunjungi pura bersama.', emoji: '🛕' } },
      { en: 'Cottage', id: 'Pondok', emoji: '🏡', example: { en: 'We stay in a cozy cottage.', id: 'Kami menginap di pondok yang nyaman.', emoji: '🏡' } },
    ],
  },
  {
    id: 'pedesaan',
    title: 'Pedesaan (Countryside)',
    desc: '10 kata',
    items: [
      { en: 'Village', id: 'Desa', emoji: '🏘️', example: { en: 'My grandmother lives in a small village.', id: 'Nenekku tinggal di desa kecil.', emoji: '🏘️' } },
      { en: 'Field', id: 'Sawah', emoji: '🌾', example: { en: 'The farmer plants rice in the field.', id: 'Petani menanam padi di sawah.', emoji: '🌾' } },
      { en: 'Hill', id: 'Bukit', emoji: '⛰️', example: { en: 'We climb the green hill.', id: 'Kami mendaki bukit yang hijau.', emoji: '⛰️' } },
      { en: 'Meadow', id: 'Padang Rumput', emoji: '🌼', example: { en: 'Cows eat grass in the meadow.', id: 'Sapi makan rumput di padang rumput.', emoji: '🌼' } },
      { en: 'Barn', id: 'Kandang', emoji: '🛖', example: { en: 'The farmer keeps cows in the barn.', id: 'Petani menyimpan sapi di kandang.', emoji: '🛖' } },
      { en: 'Path', id: 'Jalan Setapak', emoji: '🥾', example: { en: 'We walk on a narrow path.', id: 'Kami berjalan di jalan setapak yang sempit.', emoji: '🥾' } },
      { en: 'Pond', id: 'Kolam', emoji: '🦆', example: { en: 'Ducks swim in the pond.', id: 'Bebek berenang di kolam.', emoji: '🦆' } },
      { en: 'Orchard', id: 'Kebun Buah', emoji: '🥭', example: { en: 'We pick mangoes in the orchard.', id: 'Kami memetik mangga di kebun buah.', emoji: '🥭' } },
      { en: 'Countryside', id: 'Pedesaan', emoji: '🌄', example: { en: 'I love visiting the countryside.', id: 'Aku suka mengunjungi pedesaan.', emoji: '🌄' } },
      { en: 'Vineyard', id: 'Kebun Anggur', emoji: '🍇', example: { en: 'They grow grapes in the vineyard.', id: 'Mereka menanam anggur di kebun anggur.', emoji: '🍇' } },
    ],
  },
  {
    id: 'presentasi-diskusi',
    title: 'Presentasi & Diskusi (Presentation & Discussion)',
    desc: '10 kata',
    items: [
      { en: 'Presentation', id: 'Presentasi', emoji: '📊', example: { en: 'I give a presentation in class.', id: 'Aku memberikan presentasi di kelas.', emoji: '📊' } },
      { en: 'Debate', id: 'Debat', emoji: '⚖️', example: { en: 'We have a debate about school rules.', id: 'Kami berdebat tentang aturan sekolah.', emoji: '⚖️' } },
      { en: 'Evidence', id: 'Bukti', emoji: '🔍', example: { en: 'I need evidence to support my idea.', id: 'Aku butuh bukti untuk mendukung ideku.', emoji: '🔍' } },
      { en: 'Conclusion', id: 'Kesimpulan', emoji: '✅', example: { en: 'I write a conclusion at the end.', id: 'Aku menulis kesimpulan di akhir.', emoji: '✅' } },
      { en: 'Discussion', id: 'Diskusi', emoji: '💬', example: { en: 'We join a group discussion.', id: 'Kami mengikuti diskusi kelompok.', emoji: '💬' } },
      { en: 'Perspective', id: 'Sudut Pandang', emoji: '👀', example: { en: 'Everyone has a different perspective.', id: 'Setiap orang punya sudut pandang berbeda.', emoji: '👀' } },
      { en: 'Persuade', id: 'Meyakinkan', emoji: '🤝', example: { en: 'I try to persuade my friend.', id: 'Aku mencoba meyakinkan temanku.', emoji: '🤝' } },
      { en: 'Summarize', id: 'Meringkas', emoji: '📋', example: { en: 'I summarize the story in three sentences.', id: 'Aku meringkas cerita itu dalam tiga kalimat.', emoji: '📋' } },
      { en: 'Feedback', id: 'Masukan', emoji: '🔄', example: { en: 'My teacher gives feedback on my essay.', id: 'Guruku memberi masukan untuk esaiku.', emoji: '🔄' } },
      { en: 'Volunteer', id: 'Mengajukan Diri', emoji: '✋', example: { en: 'I volunteer to answer the question.', id: 'Aku mengajukan diri untuk menjawab pertanyaan.', emoji: '✋' } },
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
 * (types.ts), riset & spesifikasi lengkap: `materi/speaking.md` §10.
 * **12/12 topik — target ≥10/skill (CLAUDE.md) TERCAPAI**, genapkan dari 2
 * topik (`sapaan-sopan`/`kenalkan-keluarga`, sesi sebelumnya) jadi FULL
 * PARITAS dgn `VOCAB_TOPICS_LITTLE_STARS` (setiap 1 dari 12 domain Vocab
 * dipetakan ke tepat 1 topik Speaking) — kata kunci & emoji SAMA dgn Vocab,
 * frasa target ditulis ULANG baru (prinsip "modalitas beda, bukan
 * duplikasi", konsisten Listening/Reading Little Stars). Urutan prioritas
 * domain BUKAN sembarang — riset Kumon Indonesia EFL (`materi/speaking.md`
 * §10.1) mengonfirmasi level 7A (paling awal) py tema HEWAN (dgn efek
 * suara, persis pola `bunyi-hewan` di sini) & KENDARAAN duluan, BARU level
 * 6A menambah ANGKA & WARNA — urutan array di bawah mengikuti prioritas
 * riset ini (hewan→kendaraan→tubuh→warna→angka→bentuk→dst), bukan urutan
 * Vocab aslinya.
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
  {
    id: 'kenalkan-keluarga',
    title: 'Kenalkan Keluargaku (Introduce My Family)',
    desc: '10 ucapan',
    items: [
      { en: 'Mom', id: 'Mama', emoji: '👩', phrase: { en: 'This is my mom.', id: 'Ini mamaku.', emoji: '👩' } },
      { en: 'Dad', id: 'Papa', emoji: '👨', phrase: { en: 'This is my dad.', id: 'Ini papaku.', emoji: '👨' } },
      { en: 'Sister', id: 'Kakak/Adik Perempuan', emoji: '👧', phrase: { en: 'I have a sister.', id: 'Aku punya kakak perempuan.', emoji: '👧' } },
      { en: 'Brother', id: 'Kakak/Adik Laki-laki', emoji: '👦', phrase: { en: 'I have a brother.', id: 'Aku punya kakak laki-laki.', emoji: '👦' } },
      { en: 'Baby', id: 'Bayi', emoji: '👶', phrase: { en: 'The baby is cute.', id: 'Bayinya lucu.', emoji: '👶' } },
      { en: 'Grandma', id: 'Nenek', emoji: '👵', phrase: { en: 'I love my grandma.', id: 'Aku sayang nenekku.', emoji: '👵' } },
      { en: 'Grandpa', id: 'Kakek', emoji: '👴', phrase: { en: 'I love my grandpa.', id: 'Aku sayang kakekku.', emoji: '👴' } },
      { en: 'Aunt', id: 'Bibi', emoji: '👩‍🦱', phrase: { en: 'This is my aunt.', id: 'Ini bibiku.', emoji: '👩‍🦱' } },
      { en: 'Uncle', id: 'Paman', emoji: '🧔', phrase: { en: 'This is my uncle.', id: 'Ini pamanku.', emoji: '🧔' } },
      { en: 'Family', id: 'Keluarga', emoji: '👨‍👩‍👧‍👦', phrase: { en: 'I love my family!', id: 'Aku sayang keluargaku!', emoji: '👨‍👩‍👧‍👦' } },
    ],
  },
  {
    id: 'bunyi-hewan',
    title: 'Bunyi Hewan (Animal Sounds)',
    desc: '10 ucapan',
    items: [
      { en: 'Dog', id: 'Anjing', emoji: '🐶', phrase: { en: 'The dog says woof!', id: 'Anjingnya bilang guk guk!', emoji: '🐶' } },
      { en: 'Cat', id: 'Kucing', emoji: '🐱', phrase: { en: 'The cat says meow!', id: 'Kucingnya bilang meong!', emoji: '🐱' } },
      { en: 'Fish', id: 'Ikan', emoji: '🐟', phrase: { en: 'The fish can swim!', id: 'Ikannya bisa berenang!', emoji: '🐟' } },
      { en: 'Bird', id: 'Burung', emoji: '🐦', phrase: { en: 'The bird can fly!', id: 'Burungnya bisa terbang!', emoji: '🐦' } },
      { en: 'Cow', id: 'Sapi', emoji: '🐄', phrase: { en: 'The cow says moo!', id: 'Sapinya bilang moo!', emoji: '🐄' } },
      { en: 'Duck', id: 'Bebek', emoji: '🦆', phrase: { en: 'The duck says quack!', id: 'Bebeknya bilang kwek!', emoji: '🦆' } },
      { en: 'Horse', id: 'Kuda', emoji: '🐴', phrase: { en: 'The horse can run!', id: 'Kudanya bisa berlari!', emoji: '🐴' } },
      { en: 'Sheep', id: 'Domba', emoji: '🐑', phrase: { en: 'The sheep says baa!', id: 'Dombanya bilang mbee!', emoji: '🐑' } },
      { en: 'Pig', id: 'Babi', emoji: '🐷', phrase: { en: 'The pig says oink!', id: 'Babinya bilang oink!', emoji: '🐷' } },
      { en: 'Rabbit', id: 'Kelinci', emoji: '🐰', phrase: { en: 'The rabbit can hop!', id: 'Kelincinya bisa melompat!', emoji: '🐰' } },
    ],
  },
  {
    id: 'naik-kendaraan',
    title: 'Yuk Naik Kendaraan (Let’s Ride!)',
    desc: '10 ucapan',
    items: [
      { en: 'Car', id: 'Mobil', emoji: '🚗', phrase: { en: 'Vroom, here comes the car!', id: 'Vroom, mobilnya datang!', emoji: '🚗' } },
      { en: 'Bus', id: 'Bus', emoji: '🚌', phrase: { en: 'I ride the bus to school.', id: 'Aku naik bus ke sekolah.', emoji: '🚌' } },
      { en: 'Bike', id: 'Sepeda', emoji: '🚲', phrase: { en: 'I ride my bike fast.', id: 'Aku naik sepedaku dengan cepat.', emoji: '🚲' } },
      { en: 'Train', id: 'Kereta', emoji: '🚆', phrase: { en: 'Choo choo goes the train!', id: 'Ciat ciut, keretanya jalan!', emoji: '🚆' } },
      { en: 'Airplane', id: 'Pesawat', emoji: '✈️', phrase: { en: 'The airplane flies high.', id: 'Pesawatnya terbang tinggi.', emoji: '✈️' } },
      { en: 'Boat', id: 'Perahu', emoji: '⛵', phrase: { en: 'The boat floats on water.', id: 'Perahunya mengapung di air.', emoji: '⛵' } },
      { en: 'Truck', id: 'Truk', emoji: '🚚', phrase: { en: 'The truck carries boxes.', id: 'Truknya mengangkut kotak.', emoji: '🚚' } },
      { en: 'Fire Truck', id: 'Truk Pemadam', emoji: '🚒', phrase: { en: 'The fire truck is fast!', id: 'Truk pemadamnya cepat!', emoji: '🚒' } },
      { en: 'Ambulance', id: 'Ambulans', emoji: '🚑', phrase: { en: 'Wee-woo goes the ambulance!', id: 'Nguing nguing, ambulansnya lewat!', emoji: '🚑' } },
      { en: 'Helicopter', id: 'Helikopter', emoji: '🚁', phrase: { en: 'The helicopter flies up!', id: 'Helikopternya terbang ke atas!', emoji: '🚁' } },
    ],
  },
  {
    id: 'sentuh-tubuhku',
    title: 'Sentuh & Sebutkan (Touch & Say)',
    desc: '10 ucapan',
    items: [
      { en: 'Head', id: 'Kepala', emoji: '🙂', phrase: { en: 'Touch your head!', id: 'Sentuh kepalamu!', emoji: '🙂' } },
      { en: 'Shoulders', id: 'Bahu', emoji: '🤷', phrase: { en: 'Touch your shoulders!', id: 'Sentuh bahumu!', emoji: '🤷' } },
      { en: 'Knees', id: 'Lutut', emoji: '🦵', phrase: { en: 'Touch your knees!', id: 'Sentuh lututmu!', emoji: '🦵' } },
      { en: 'Toes', id: 'Jari Kaki', emoji: '🦶', phrase: { en: 'Touch your toes!', id: 'Sentuh jari kakimu!', emoji: '🦶' } },
      { en: 'Eyes', id: 'Mata', emoji: '👀', phrase: { en: 'Blink your eyes!', id: 'Kedipkan matamu!', emoji: '👀' } },
      { en: 'Ears', id: 'Telinga', emoji: '👂', phrase: { en: 'Wiggle your ears!', id: 'Gerakkan telingamu!', emoji: '👂' } },
      { en: 'Nose', id: 'Hidung', emoji: '👃', phrase: { en: 'Touch your nose!', id: 'Sentuh hidungmu!', emoji: '👃' } },
      { en: 'Mouth', id: 'Mulut', emoji: '👄', phrase: { en: 'Open your mouth!', id: 'Buka mulutmu!', emoji: '👄' } },
      { en: 'Hands', id: 'Tangan', emoji: '🙌', phrase: { en: 'Clap your hands!', id: 'Tepuk tanganmu!', emoji: '🙌' } },
      { en: 'Hair', id: 'Rambut', emoji: '💇', phrase: { en: 'Brush your hair!', id: 'Sisir rambutmu!', emoji: '💇' } },
    ],
  },
  {
    id: 'warna-favorit',
    title: 'Warna Favoritku (My Favorite Color)',
    desc: '10 ucapan',
    items: [
      { en: 'Red', id: 'Merah', emoji: '🔴', phrase: { en: 'I like red.', id: 'Aku suka merah.', emoji: '🔴' } },
      { en: 'Blue', id: 'Biru', emoji: '🔵', phrase: { en: 'I like blue.', id: 'Aku suka biru.', emoji: '🔵' } },
      { en: 'Yellow', id: 'Kuning', emoji: '🟡', phrase: { en: 'The sun is yellow.', id: 'Mataharinya kuning.', emoji: '🟡' } },
      { en: 'Green', id: 'Hijau', emoji: '🟢', phrase: { en: 'I like green.', id: 'Aku suka hijau.', emoji: '🟢' } },
      { en: 'Orange', id: 'Oranye', emoji: '🟠', phrase: { en: 'The pumpkin is orange.', id: 'Labunya oranye.', emoji: '🟠' } },
      { en: 'Purple', id: 'Ungu', emoji: '🟣', phrase: { en: 'I like purple.', id: 'Aku suka ungu.', emoji: '🟣' } },
      { en: 'Pink', id: 'Merah Muda', emoji: '🩷', phrase: { en: 'My shoes are pink.', id: 'Sepatuku merah muda.', emoji: '🩷' } },
      { en: 'Black', id: 'Hitam', emoji: '⚫', phrase: { en: 'My cat is black.', id: 'Kucingku hitam.', emoji: '⚫' } },
      { en: 'White', id: 'Putih', emoji: '⚪', phrase: { en: 'My shirt is white.', id: 'Bajuku putih.', emoji: '⚪' } },
      { en: 'Brown', id: 'Cokelat', emoji: '🟤', phrase: { en: 'I like brown.', id: 'Aku suka cokelat.', emoji: '🟤' } },
    ],
  },
  {
    id: 'hitung-yuk',
    title: 'Ayo Menghitung (Let’s Count!)',
    desc: '10 ucapan',
    items: [
      { en: 'One', id: 'Satu', emoji: '1️⃣', phrase: { en: 'I see one star.', id: 'Aku lihat satu bintang.', emoji: '1️⃣' } },
      { en: 'Two', id: 'Dua', emoji: '2️⃣', phrase: { en: 'I have two hands.', id: 'Aku punya dua tangan.', emoji: '2️⃣' } },
      { en: 'Three', id: 'Tiga', emoji: '3️⃣', phrase: { en: 'I see three cats.', id: 'Aku lihat tiga kucing.', emoji: '3️⃣' } },
      { en: 'Four', id: 'Empat', emoji: '4️⃣', phrase: { en: 'I have four crayons.', id: 'Aku punya empat krayon.', emoji: '4️⃣' } },
      { en: 'Five', id: 'Lima', emoji: '5️⃣', phrase: { en: 'High five!', id: 'Tos lima jari!', emoji: '5️⃣' } },
      { en: 'Six', id: 'Enam', emoji: '6️⃣', phrase: { en: 'I see six balloons.', id: 'Aku lihat enam balon.', emoji: '6️⃣' } },
      { en: 'Seven', id: 'Tujuh', emoji: '7️⃣', phrase: { en: 'I have seven candies.', id: 'Aku punya tujuh permen.', emoji: '7️⃣' } },
      { en: 'Eight', id: 'Delapan', emoji: '8️⃣', phrase: { en: 'I see eight fish.', id: 'Aku lihat delapan ikan.', emoji: '8️⃣' } },
      { en: 'Nine', id: 'Sembilan', emoji: '9️⃣', phrase: { en: 'I have nine blocks.', id: 'Aku punya sembilan balok.', emoji: '9️⃣' } },
      { en: 'Ten', id: 'Sepuluh', emoji: '🔟', phrase: { en: 'Let’s count to ten!', id: 'Ayo hitung sampai sepuluh!', emoji: '🔟' } },
    ],
  },
  {
    id: 'cari-bentuk',
    title: 'Cari Bentuknya (Find the Shape)',
    desc: '10 ucapan',
    items: [
      { en: 'Circle', id: 'Lingkaran', emoji: '⚪', phrase: { en: 'I see a circle.', id: 'Aku lihat lingkaran.', emoji: '⚪' } },
      { en: 'Square', id: 'Persegi', emoji: '⬜', phrase: { en: 'This box is a square.', id: 'Kotak ini persegi.', emoji: '⬜' } },
      { en: 'Triangle', id: 'Segitiga', emoji: '🔺', phrase: { en: 'I see a triangle.', id: 'Aku lihat segitiga.', emoji: '🔺' } },
      { en: 'Star', id: 'Bintang', emoji: '⭐', phrase: { en: 'The star has five points.', id: 'Bintangnya punya lima ujung.', emoji: '⭐' } },
      { en: 'Heart', id: 'Hati', emoji: '❤️', phrase: { en: 'I draw a heart.', id: 'Aku menggambar hati.', emoji: '❤️' } },
      { en: 'Diamond', id: 'Berlian', emoji: '🔷', phrase: { en: 'I see a diamond.', id: 'Aku lihat berlian.', emoji: '🔷' } },
      { en: 'Oval', id: 'Oval', emoji: '🥚', phrase: { en: 'The egg is an oval.', id: 'Telurnya berbentuk oval.', emoji: '🥚' } },
      { en: 'Cross', id: 'Silang', emoji: '➕', phrase: { en: 'I draw a cross.', id: 'Aku menggambar tanda silang.', emoji: '➕' } },
      { en: 'Arrow', id: 'Panah', emoji: '➡️', phrase: { en: 'The arrow points up.', id: 'Panahnya menunjuk ke atas.', emoji: '➡️' } },
      { en: 'Moon', id: 'Bulan', emoji: '🌙', phrase: { en: 'I see the moon.', id: 'Aku lihat bulan.', emoji: '🌙' } },
    ],
  },
  {
    id: 'buah-favorit',
    title: 'Buah Favoritku (My Favorite Fruit)',
    desc: '10 ucapan',
    items: [
      { en: 'Apple', id: 'Apel', emoji: '🍎', phrase: { en: 'I want an apple.', id: 'Aku mau apel.', emoji: '🍎' } },
      { en: 'Banana', id: 'Pisang', emoji: '🍌', phrase: { en: 'I like bananas.', id: 'Aku suka pisang.', emoji: '🍌' } },
      { en: 'Orange', id: 'Jeruk', emoji: '🍊', phrase: { en: 'I eat an orange.', id: 'Aku makan jeruk.', emoji: '🍊' } },
      { en: 'Grape', id: 'Anggur', emoji: '🍇', phrase: { en: 'I like grapes.', id: 'Aku suka anggur.', emoji: '🍇' } },
      { en: 'Watermelon', id: 'Semangka', emoji: '🍉', phrase: { en: 'I want watermelon.', id: 'Aku mau semangka.', emoji: '🍉' } },
      { en: 'Strawberry', id: 'Stroberi', emoji: '🍓', phrase: { en: 'I love strawberries!', id: 'Aku suka stroberi!', emoji: '🍓' } },
      { en: 'Mango', id: 'Mangga', emoji: '🥭', phrase: { en: 'I like mangoes.', id: 'Aku suka mangga.', emoji: '🥭' } },
      { en: 'Pineapple', id: 'Nanas', emoji: '🍍', phrase: { en: 'I want pineapple.', id: 'Aku mau nanas.', emoji: '🍍' } },
      { en: 'Pear', id: 'Pir', emoji: '🍐', phrase: { en: 'I eat a pear.', id: 'Aku makan pir.', emoji: '🍐' } },
      { en: 'Peach', id: 'Persik', emoji: '🍑', phrase: { en: 'I like peaches.', id: 'Aku suka persik.', emoji: '🍑' } },
    ],
  },
  {
    id: 'rasa-hatiku',
    title: 'Perasaanku (How I Feel)',
    desc: '10 ucapan',
    items: [
      { en: 'Happy', id: 'Senang', emoji: '😊', phrase: { en: 'I am happy today!', id: 'Aku senang hari ini!', emoji: '😊' } },
      { en: 'Sad', id: 'Sedih', emoji: '😢', phrase: { en: 'I feel sad.', id: 'Aku merasa sedih.', emoji: '😢' } },
      { en: 'Angry', id: 'Marah', emoji: '😠', phrase: { en: 'I am a little angry.', id: 'Aku agak marah.', emoji: '😠' } },
      { en: 'Scared', id: 'Takut', emoji: '😨', phrase: { en: 'I feel scared.', id: 'Aku merasa takut.', emoji: '😨' } },
      { en: 'Sleepy', id: 'Mengantuk', emoji: '😴', phrase: { en: 'I am sleepy now.', id: 'Aku mengantuk sekarang.', emoji: '😴' } },
      { en: 'Hungry', id: 'Lapar', emoji: '😋', phrase: { en: 'I am hungry!', id: 'Aku lapar!', emoji: '😋' } },
      { en: 'Thirsty', id: 'Haus', emoji: '🥤', phrase: { en: 'I am thirsty.', id: 'Aku haus.', emoji: '🥤' } },
      { en: 'Sick', id: 'Sakit', emoji: '🤒', phrase: { en: 'I feel sick today.', id: 'Aku merasa sakit hari ini.', emoji: '🤒' } },
      { en: 'Silly', id: 'Konyol', emoji: '🤪', phrase: { en: 'I am being silly!', id: 'Aku lagi konyol!', emoji: '🤪' } },
      { en: 'Excited', id: 'Bersemangat', emoji: '🤩', phrase: { en: 'I am so excited!', id: 'Aku sangat bersemangat!', emoji: '🤩' } },
    ],
  },
  {
    id: 'main-yuk',
    title: 'Yuk Main! (Let’s Play!)',
    desc: '10 ucapan',
    items: [
      { en: 'Ball', id: 'Bola', emoji: '⚽', phrase: { en: 'I play with a ball.', id: 'Aku main bola.', emoji: '⚽' } },
      { en: 'Doll', id: 'Boneka', emoji: '🪆', phrase: { en: 'I like my doll.', id: 'Aku suka bonekaku.', emoji: '🪆' } },
      { en: 'Kite', id: 'Layangan', emoji: '🪁', phrase: { en: 'I fly a kite.', id: 'Aku menerbangkan layangan.', emoji: '🪁' } },
      { en: 'Balloon', id: 'Balon', emoji: '🎈', phrase: { en: 'I hold a balloon.', id: 'Aku memegang balon.', emoji: '🎈' } },
      { en: 'Puzzle', id: 'Puzzle', emoji: '🧩', phrase: { en: 'I like puzzles.', id: 'Aku suka puzzle.', emoji: '🧩' } },
      { en: 'Robot', id: 'Robot', emoji: '🤖', phrase: { en: 'I play with a robot.', id: 'Aku main robot-robotan.', emoji: '🤖' } },
      { en: 'Drum', id: 'Drum', emoji: '🥁', phrase: { en: 'I play the drum.', id: 'Aku main drum.', emoji: '🥁' } },
      { en: 'Blocks', id: 'Balok', emoji: '🧱', phrase: { en: 'I build with blocks.', id: 'Aku membangun dengan balok.', emoji: '🧱' } },
      { en: 'Yoyo', id: 'Yoyo', emoji: '🪀', phrase: { en: 'I play with a yoyo.', id: 'Aku main yoyo.', emoji: '🪀' } },
      { en: 'Teddy', id: 'Boneka Beruang', emoji: '🧸', phrase: { en: 'I hug my teddy.', id: 'Aku memeluk boneka beruangku.', emoji: '🧸' } },
    ],
  },
  {
    id: 'pakai-baju',
    title: 'Pakaianku (What I Wear)',
    desc: '10 ucapan',
    items: [
      { en: 'Shirt', id: 'Baju', emoji: '👕', phrase: { en: 'I wear a blue shirt.', id: 'Aku memakai baju biru.', emoji: '👕' } },
      { en: 'Pants', id: 'Celana Panjang', emoji: '👖', phrase: { en: 'Can I wear my pants?', id: 'Boleh aku pakai celana panjangku?', emoji: '👖' } },
      { en: 'Shoes', id: 'Sepatu', emoji: '👟', phrase: { en: 'I wear my shoes outside.', id: 'Aku memakai sepatu di luar.', emoji: '👟' } },
      { en: 'Socks', id: 'Kaos Kaki', emoji: '🧦', phrase: { en: 'I wear warm socks.', id: 'Aku memakai kaos kaki hangat.', emoji: '🧦' } },
      { en: 'Hat', id: 'Topi', emoji: '🧢', phrase: { en: 'I wear a hat in the sun.', id: 'Aku memakai topi saat panas.', emoji: '🧢' } },
      { en: 'Dress', id: 'Gaun', emoji: '👗', phrase: { en: 'I wear a pretty dress.', id: 'Aku memakai gaun cantik.', emoji: '👗' } },
      { en: 'Jacket', id: 'Jaket', emoji: '🧥', phrase: { en: 'I wear a jacket when it’s cold.', id: 'Aku memakai jaket saat dingin.', emoji: '🧥' } },
      { en: 'Shorts', id: 'Celana Pendek', emoji: '🩳', phrase: { en: 'I wear shorts today.', id: 'Aku memakai celana pendek hari ini.', emoji: '🩳' } },
      { en: 'Gloves', id: 'Sarung Tangan', emoji: '🧤', phrase: { en: 'I wear gloves to stay warm.', id: 'Aku memakai sarung tangan supaya hangat.', emoji: '🧤' } },
      { en: 'Scarf', id: 'Syal', emoji: '🧣', phrase: { en: 'I wear a soft scarf.', id: 'Aku memakai syal yang lembut.', emoji: '🧣' } },
    ],
  },
];

/**
 * Speaking Starter (5–7 th) — format KEDUA `SpeakingPhraseTopic` (types.ts),
 * kelanjutan langsung dari Little Stars (riset `materi/speaking.md` §11,
 * pola sama Vocab/Listening/Grammar Starter: kalimat sedikit lebih panjang &
 * kata lebih abstrak, BUKAN lompat ke kompleksitas baru). **10/10 topik —
 * target ≥10/skill (CLAUDE.md) TERCAPAI, FULL PARITAS dgn
 * `VOCAB_TOPICS_STARTER`** (setiap 1 dari 10 domain Vocab Starter dipetakan
 * ke tepat 1 topik Speaking) — kata kunci & emoji SAMA dgn Vocab, frasa
 * target ditulis ULANG baru (prinsip "modalitas beda, bukan duplikasi").
 * Urutan array mengikuti prioritas riset kurikulum Indonesia (Kurikulum
 * Merdeka Fase A kelas 1-2 SD, `materi/speaking.md` §11.1 — angka & benda di
 * kelas termasuk unit paling awal, tema keluarga/orang eksplisit menekankan
 * PRODUKSI KALIMAT DESKRIPTIF, bukan cuma sebut kata) — `makanan-favoritku`
 * (sesi sebelumnya) tetap topik pertama, 9 topik lain BARU sesi ini.
 */
export const SPEAKING_TOPICS_STARTER: SpeakingPhraseTopic[] = [
  {
    id: 'suka-makanan',
    title: 'Makanan Kesukaanku (My Favorite Food)',
    desc: '10 ucapan',
    items: [
      { en: 'Pizza', id: 'Pizza', emoji: '🍕', phrase: { en: 'I like pizza.', id: 'Aku suka pizza.', emoji: '🍕' } },
      { en: 'Burger', id: 'Burger', emoji: '🍔', phrase: { en: 'I want a burger.', id: 'Aku mau burger.', emoji: '🍔' } },
      { en: 'Sandwich', id: 'Sandwich', emoji: '🥪', phrase: { en: 'I made a sandwich.', id: 'Aku bikin sandwich.', emoji: '🥪' } },
      { en: 'Ice Cream', id: 'Es Krim', emoji: '🍦', phrase: { en: 'I love ice cream!', id: 'Aku suka es krim!', emoji: '🍦' } },
      { en: 'Cake', id: 'Kue', emoji: '🍰', phrase: { en: 'Can I have cake?', id: 'Boleh aku minta kue?', emoji: '🍰' } },
      { en: 'Cookie', id: 'Biskuit', emoji: '🍪', phrase: { en: 'I eat a cookie.', id: 'Aku makan biskuit.', emoji: '🍪' } },
      { en: 'Chocolate', id: 'Cokelat', emoji: '🍫', phrase: { en: 'I love chocolate.', id: 'Aku suka cokelat.', emoji: '🍫' } },
      { en: 'Cheese', id: 'Keju', emoji: '🧀', phrase: { en: 'I like cheese.', id: 'Aku suka keju.', emoji: '🧀' } },
      { en: 'Juice', id: 'Jus', emoji: '🧃', phrase: { en: 'I want some juice.', id: 'Aku mau jus.', emoji: '🧃' } },
      { en: 'Yogurt', id: 'Yogurt', emoji: '🥣', phrase: { en: 'I eat yogurt.', id: 'Aku makan yogurt.', emoji: '🥣' } },
    ],
  },
  {
    id: 'sebut-angka',
    title: 'Sebut Angkanya (Numbers 11–20)',
    desc: '10 ucapan',
    items: [
      { en: 'Eleven', id: 'Sebelas', emoji: '1️⃣1️⃣', phrase: { en: 'I count eleven stars.', id: 'Aku menghitung sebelas bintang.', emoji: '1️⃣1️⃣' } },
      { en: 'Twelve', id: 'Dua Belas', emoji: '1️⃣2️⃣', phrase: { en: 'I have twelve stickers.', id: 'Aku punya dua belas stiker.', emoji: '1️⃣2️⃣' } },
      { en: 'Thirteen', id: 'Tiga Belas', emoji: '1️⃣3️⃣', phrase: { en: 'I see thirteen birds.', id: 'Aku lihat tiga belas burung.', emoji: '1️⃣3️⃣' } },
      { en: 'Fourteen', id: 'Empat Belas', emoji: '1️⃣4️⃣', phrase: { en: 'I have fourteen coins.', id: 'Aku punya empat belas koin.', emoji: '1️⃣4️⃣' } },
      { en: 'Fifteen', id: 'Lima Belas', emoji: '1️⃣5️⃣', phrase: { en: 'I count fifteen candies.', id: 'Aku menghitung lima belas permen.', emoji: '1️⃣5️⃣' } },
      { en: 'Sixteen', id: 'Enam Belas', emoji: '1️⃣6️⃣', phrase: { en: 'I see sixteen ants.', id: 'Aku lihat enam belas semut.', emoji: '1️⃣6️⃣' } },
      { en: 'Seventeen', id: 'Tujuh Belas', emoji: '1️⃣7️⃣', phrase: { en: 'I have seventeen crayons.', id: 'Aku punya tujuh belas krayon.', emoji: '1️⃣7️⃣' } },
      { en: 'Eighteen', id: 'Delapan Belas', emoji: '1️⃣8️⃣', phrase: { en: 'I count eighteen flowers.', id: 'Aku menghitung delapan belas bunga.', emoji: '1️⃣8️⃣' } },
      { en: 'Nineteen', id: 'Sembilan Belas', emoji: '1️⃣9️⃣', phrase: { en: 'I have nineteen books.', id: 'Aku punya sembilan belas buku.', emoji: '1️⃣9️⃣' } },
      { en: 'Twenty', id: 'Dua Puluh', emoji: '2️⃣0️⃣', phrase: { en: 'Let’s count to twenty!', id: 'Ayo hitung sampai dua puluh!', emoji: '2️⃣0️⃣' } },
    ],
  },
  {
    id: 'hari-apa-ini',
    title: 'Hari Apa Ini? (What Day Is It?)',
    desc: '10 ucapan',
    items: [
      { en: 'Monday', id: 'Senin', emoji: '🏫', phrase: { en: 'School starts on Monday.', id: 'Sekolah dimulai hari Senin.', emoji: '🏫' } },
      { en: 'Tuesday', id: 'Selasa', emoji: '🎨', phrase: { en: 'I paint on Tuesday.', id: 'Aku melukis hari Selasa.', emoji: '🎨' } },
      { en: 'Wednesday', id: 'Rabu', emoji: '🎵', phrase: { en: 'We sing on Wednesday.', id: 'Kami bernyanyi hari Rabu.', emoji: '🎵' } },
      { en: 'Thursday', id: 'Kamis', emoji: '⚽', phrase: { en: 'I play sports on Thursday.', id: 'Aku berolahraga hari Kamis.', emoji: '⚽' } },
      { en: 'Friday', id: 'Jumat', emoji: '🎈', phrase: { en: 'Friday is my favorite day!', id: 'Hari Jumat hari favoritku!', emoji: '🎈' } },
      { en: 'Saturday', id: 'Sabtu', emoji: '🎉', phrase: { en: 'Saturday is a holiday.', id: 'Hari Sabtu itu libur.', emoji: '🎉' } },
      { en: 'Sunday', id: 'Minggu', emoji: '🌳', phrase: { en: 'We go to the park on Sunday.', id: 'Kami pergi ke taman hari Minggu.', emoji: '🌳' } },
      { en: 'Today', id: 'Hari Ini', emoji: '👉', phrase: { en: 'What day is today?', id: 'Hari ini hari apa?', emoji: '👉' } },
      { en: 'Tomorrow', id: 'Besok', emoji: '🌅', phrase: { en: 'See you tomorrow!', id: 'Sampai jumpa besok!', emoji: '🌅' } },
      { en: 'Yesterday', id: 'Kemarin', emoji: '🌇', phrase: { en: 'I played yesterday.', id: 'Aku bermain kemarin.', emoji: '🌇' } },
    ],
  },
  {
    id: 'isi-kelasku',
    title: 'Isi Kelasku (At School)',
    desc: '10 ucapan',
    items: [
      { en: 'Coach', id: 'Pelatih', emoji: '📣', phrase: { en: 'The coach helps us play.', id: 'Pelatih membantu kami bermain.', emoji: '📣' } },
      { en: 'Classroom', id: 'Ruang Kelas', emoji: '🏫', phrase: { en: 'I learn in the classroom.', id: 'Aku belajar di ruang kelas.', emoji: '🏫' } },
      { en: 'Friend', id: 'Teman', emoji: '🧑‍🤝‍🧑', phrase: { en: 'She is my friend.', id: 'Dia temanku.', emoji: '🧑‍🤝‍🧑' } },
      { en: 'Principal', id: 'Kepala Sekolah', emoji: '🧑‍💼', phrase: { en: 'I greet the principal.', id: 'Aku menyapa kepala sekolah.', emoji: '🧑‍💼' } },
      { en: 'Library', id: 'Perpustakaan', emoji: '📚', phrase: { en: 'I read in the library.', id: 'Aku membaca di perpustakaan.', emoji: '📚' } },
      { en: 'Lunchbox', id: 'Kotak Bekal', emoji: '🍱', phrase: { en: 'I bring my lunchbox.', id: 'Aku membawa kotak bekalku.', emoji: '🍱' } },
      { en: 'Uniform', id: 'Seragam', emoji: '👕', phrase: { en: 'I wear my uniform.', id: 'Aku memakai seragamku.', emoji: '👕' } },
      { en: 'Bell', id: 'Bel', emoji: '🔔', phrase: { en: 'The bell is ringing!', id: 'Belnya berbunyi!', emoji: '🔔' } },
      { en: 'Homework', id: 'PR', emoji: '📓', phrase: { en: 'I finish my homework.', id: 'Aku menyelesaikan PR-ku.', emoji: '📓' } },
      { en: 'Recess', id: 'Istirahat', emoji: '🥪', phrase: { en: 'I love recess time!', id: 'Aku suka waktu istirahat!', emoji: '🥪' } },
    ],
  },
  {
    id: 'kenalkan-orang',
    title: 'Kenalkan Orangnya (People Around Me)',
    desc: '10 ucapan',
    items: [
      { en: 'Neighbor', id: 'Tetangga', emoji: '🏘️', phrase: { en: 'My neighbor is kind.', id: 'Tetanggaku baik hati.', emoji: '🏘️' } },
      { en: 'Classmate', id: 'Teman Sekelas', emoji: '🧑‍🎓', phrase: { en: 'He is my classmate.', id: 'Dia teman sekelasku.', emoji: '🧑‍🎓' } },
      { en: 'Boy', id: 'Anak Laki-laki', emoji: '👦', phrase: { en: 'The boy is running.', id: 'Anak laki-laki itu sedang berlari.', emoji: '👦' } },
      { en: 'Girl', id: 'Anak Perempuan', emoji: '👧', phrase: { en: 'The girl is singing.', id: 'Anak perempuan itu sedang bernyanyi.', emoji: '👧' } },
      { en: 'Man', id: 'Pria', emoji: '👨', phrase: { en: 'The man is tall.', id: 'Pria itu tinggi.', emoji: '👨' } },
      { en: 'Woman', id: 'Wanita', emoji: '👩', phrase: { en: 'The woman is smiling.', id: 'Wanita itu tersenyum.', emoji: '👩' } },
      { en: 'Baby', id: 'Bayi', emoji: '👶', phrase: { en: 'The baby is cute.', id: 'Bayinya lucu.', emoji: '👶' } },
      { en: 'Driver', id: 'Supir', emoji: '🚕', phrase: { en: 'The driver drives safely.', id: 'Supir itu mengemudi dengan hati-hati.', emoji: '🚕' } },
      { en: 'Best Friend', id: 'Sahabat', emoji: '🤝', phrase: { en: 'You are my best friend!', id: 'Kamu sahabatku!', emoji: '🤝' } },
      { en: 'Twin', id: 'Anak Kembar', emoji: '👯', phrase: { en: 'This is my twin.', id: 'Ini kembaranku.', emoji: '👯' } },
    ],
  },
  {
    id: 'makhluk-kecil',
    title: 'Makhluk Kecil (Insects & Small Creatures)',
    desc: '10 ucapan',
    items: [
      { en: 'Butterfly', id: 'Kupu-kupu', emoji: '🦋', phrase: { en: 'The butterfly is beautiful.', id: 'Kupu-kupunya cantik.', emoji: '🦋' } },
      { en: 'Bee', id: 'Lebah', emoji: '🐝', phrase: { en: 'The bee makes honey.', id: 'Lebah membuat madu.', emoji: '🐝' } },
      { en: 'Ant', id: 'Semut', emoji: '🐜', phrase: { en: 'I see a tiny ant.', id: 'Aku lihat semut kecil.', emoji: '🐜' } },
      { en: 'Ladybug', id: 'Kepik', emoji: '🐞', phrase: { en: 'I found a ladybug.', id: 'Aku menemukan kepik.', emoji: '🐞' } },
      { en: 'Spider', id: 'Laba-laba', emoji: '🕷️', phrase: { en: 'The spider spins a web.', id: 'Laba-laba memintal sarang.', emoji: '🕷️' } },
      { en: 'Snail', id: 'Siput', emoji: '🐌', phrase: { en: 'The snail moves slowly.', id: 'Siputnya bergerak lambat.', emoji: '🐌' } },
      { en: 'Frog', id: 'Katak', emoji: '🐸', phrase: { en: 'The frog can jump high.', id: 'Katak bisa melompat tinggi.', emoji: '🐸' } },
      { en: 'Turtle', id: 'Kura-kura', emoji: '🐢', phrase: { en: 'The turtle has a shell.', id: 'Kura-kura punya cangkang.', emoji: '🐢' } },
      { en: 'Crab', id: 'Kepiting', emoji: '🦀', phrase: { en: 'The crab walks sideways.', id: 'Kepiting berjalan menyamping.', emoji: '🦀' } },
      { en: 'Worm', id: 'Cacing', emoji: '🪱', phrase: { en: 'The worm lives in the soil.', id: 'Cacing hidup di dalam tanah.', emoji: '🪱' } },
    ],
  },
  {
    id: 'jalan-jalan',
    title: 'Yuk Jalan-Jalan (Places Around Us)',
    desc: '10 ucapan',
    items: [
      { en: 'Park', id: 'Taman', emoji: '🏞️', phrase: { en: 'Let’s go to the park!', id: 'Ayo pergi ke taman!', emoji: '🏞️' } },
      { en: 'Zoo', id: 'Kebun Binatang', emoji: '🦓', phrase: { en: 'I want to visit the zoo.', id: 'Aku mau mengunjungi kebun binatang.', emoji: '🦓' } },
      { en: 'Beach', id: 'Pantai', emoji: '🏖️', phrase: { en: 'We swim at the beach.', id: 'Kami berenang di pantai.', emoji: '🏖️' } },
      { en: 'Market', id: 'Pasar', emoji: '🛒', phrase: { en: 'Mom shops at the market.', id: 'Ibu belanja di pasar.', emoji: '🛒' } },
      { en: 'Hospital', id: 'Rumah Sakit', emoji: '🏥', phrase: { en: 'The doctor works at the hospital.', id: 'Dokter bekerja di rumah sakit.', emoji: '🏥' } },
      { en: 'Farm', id: 'Ladang', emoji: '🚜', phrase: { en: 'The farmer works on the farm.', id: 'Petani bekerja di ladang.', emoji: '🚜' } },
      { en: 'Bridge', id: 'Jembatan', emoji: '🌉', phrase: { en: 'We walk across the bridge.', id: 'Kami berjalan menyeberangi jembatan.', emoji: '🌉' } },
      { en: 'Playground', id: 'Taman Bermain', emoji: '🛝', phrase: { en: 'I play at the playground.', id: 'Aku bermain di taman bermain.', emoji: '🛝' } },
      { en: 'Street', id: 'Jalan', emoji: '🛣️', phrase: { en: 'Cars drive on the street.', id: 'Mobil melaju di jalan.', emoji: '🛣️' } },
      { en: 'Mountain', id: 'Gunung', emoji: '⛰️', phrase: { en: 'We hike up the mountain.', id: 'Kami mendaki gunung.', emoji: '⛰️' } },
    ],
  },
  {
    id: 'isi-rumahku',
    title: 'Isi Rumahku (Things at Home)',
    desc: '10 ucapan',
    items: [
      { en: 'Table', id: 'Meja', emoji: '🍽️', phrase: { en: 'We eat at the table.', id: 'Kami makan di meja.', emoji: '🍽️' } },
      { en: 'Bed', id: 'Tempat Tidur', emoji: '🛏️', phrase: { en: 'I sleep in my bed.', id: 'Aku tidur di tempat tidurku.', emoji: '🛏️' } },
      { en: 'Sofa', id: 'Sofa', emoji: '🛋️', phrase: { en: 'We sit on the sofa.', id: 'Kami duduk di sofa.', emoji: '🛋️' } },
      { en: 'Lamp', id: 'Lampu', emoji: '💡', phrase: { en: 'Please turn on the lamp.', id: 'Tolong nyalakan lampunya.', emoji: '💡' } },
      { en: 'Television', id: 'Televisi', emoji: '📺', phrase: { en: 'We watch television together.', id: 'Kami menonton televisi bersama.', emoji: '📺' } },
      { en: 'Fridge', id: 'Kulkas', emoji: '🧊', phrase: { en: 'The milk is in the fridge.', id: 'Susunya ada di kulkas.', emoji: '🧊' } },
      { en: 'Mirror', id: 'Cermin', emoji: '🪞', phrase: { en: 'I look in the mirror.', id: 'Aku bercermin.', emoji: '🪞' } },
      { en: 'Phone', id: 'Telepon', emoji: '📱', phrase: { en: 'Mom is using the phone.', id: 'Ibu sedang memakai telepon.', emoji: '📱' } },
      { en: 'Cupboard', id: 'Lemari', emoji: '🗄️', phrase: { en: 'The plates are in the cupboard.', id: 'Piringnya ada di lemari.', emoji: '🗄️' } },
      { en: 'Broom', id: 'Sapu', emoji: '🧹', phrase: { en: 'I sweep with a broom.', id: 'Aku menyapu dengan sapu.', emoji: '🧹' } },
    ],
  },
  {
    id: 'alam-di-sekitarku',
    title: 'Alam di Sekitarku (Nature Around Us)',
    desc: '10 ucapan',
    items: [
      { en: 'Sun', id: 'Matahari', emoji: '☀️', phrase: { en: 'The sun is so bright!', id: 'Mataharinya terang sekali!', emoji: '☀️' } },
      { en: 'Moon', id: 'Bulan', emoji: '🌙', phrase: { en: 'I see the moon tonight.', id: 'Aku melihat bulan malam ini.', emoji: '🌙' } },
      { en: 'Sky', id: 'Langit', emoji: '🌤️', phrase: { en: 'The sky is blue today.', id: 'Langitnya biru hari ini.', emoji: '🌤️' } },
      { en: 'Cloud', id: 'Awan', emoji: '☁️', phrase: { en: 'I see a fluffy cloud.', id: 'Aku melihat awan yang lembut.', emoji: '☁️' } },
      { en: 'Tree', id: 'Pohon', emoji: '🌳', phrase: { en: 'The tree is very tall.', id: 'Pohonnya sangat tinggi.', emoji: '🌳' } },
      { en: 'Flower', id: 'Bunga', emoji: '🌸', phrase: { en: 'The flower smells nice.', id: 'Bunganya harum.', emoji: '🌸' } },
      { en: 'Grass', id: 'Rumput', emoji: '🌿', phrase: { en: 'The grass feels soft.', id: 'Rumputnya terasa lembut.', emoji: '🌿' } },
      { en: 'River', id: 'Sungai', emoji: '🌊', phrase: { en: 'We swim in the river.', id: 'Kami berenang di sungai.', emoji: '🌊' } },
      { en: 'Stone', id: 'Batu', emoji: '🪨', phrase: { en: 'I found a smooth stone.', id: 'Aku menemukan batu yang halus.', emoji: '🪨' } },
      { en: 'Star', id: 'Bintang', emoji: '⭐', phrase: { en: 'I see a shining star.', id: 'Aku melihat bintang yang bersinar.', emoji: '⭐' } },
    ],
  },
  {
    id: 'hobiku',
    title: 'Hobiku (My Hobbies)',
    desc: '10 ucapan',
    items: [
      { en: 'Drawing', id: 'Menggambar', emoji: '🎨', phrase: { en: 'I love drawing pictures.', id: 'Aku suka menggambar.', emoji: '🎨' } },
      { en: 'Singing', id: 'Bernyanyi', emoji: '🎤', phrase: { en: 'I enjoy singing songs.', id: 'Aku suka bernyanyi.', emoji: '🎤' } },
      { en: 'Reading', id: 'Membaca', emoji: '📖', phrase: { en: 'I like reading books.', id: 'Aku suka membaca buku.', emoji: '📖' } },
      { en: 'Painting', id: 'Melukis', emoji: '🖌️', phrase: { en: 'I enjoy painting pictures.', id: 'Aku suka melukis.', emoji: '🖌️' } },
      { en: 'Cooking', id: 'Memasak', emoji: '🍳', phrase: { en: 'I like cooking with mom.', id: 'Aku suka memasak bersama ibu.', emoji: '🍳' } },
      { en: 'Camping', id: 'Berkemah', emoji: '⛺', phrase: { en: 'I love camping outside.', id: 'Aku suka berkemah di luar.', emoji: '⛺' } },
      { en: 'Fishing', id: 'Memancing', emoji: '🎣', phrase: { en: 'I go fishing with dad.', id: 'Aku memancing bersama ayah.', emoji: '🎣' } },
      { en: 'Gardening', id: 'Berkebun', emoji: '🌱', phrase: { en: 'I enjoy gardening at home.', id: 'Aku suka berkebun di rumah.', emoji: '🌱' } },
      { en: 'Collecting', id: 'Mengoleksi', emoji: '🪙', phrase: { en: 'I like collecting coins.', id: 'Aku suka mengoleksi koin.', emoji: '🪙' } },
      { en: 'Building', id: 'Membangun', emoji: '🧱', phrase: { en: 'I love building towers.', id: 'Aku suka membangun menara.', emoji: '🧱' } },
    ],
  },
];

/**
 * Speaking Achiever (11–13 th, ≈A1→A2) — TETAP format LAMA `SpeakingTopic`
 * (model/drill/roleplay), BUKAN `SpeakingPhraseTopic` — riset
 * (`materi/speaking.md` §3 revisi sesi ini): Cambridge A2 Flyers Speaking
 * (backbone struktural Achiever) py task "describe picture differences" +
 * "give a reason" (deskripsi & alasan, BUKAN sekadar ulang kata tunggal),
 * dan EF Indonesia "Trailblazers" (10–14 th, overlap usia Achiever) eksplisit
 * menyebut "membangun kepercayaan diri mengekspresikan pendapat" — DUA
 * sumber independen menunjuk ke arah yang SAMA: usia ini sudah siap produksi
 * kalimat DESKRIPTIF & jawaban OPINI terbuka, bukan lagi cuma tirukan frasa
 * tertutup (`SpeakingPhraseTopic`, cocok utk Little Stars/Starter yang belum
 * siap itu). `drill` dipakai utk kalimat deskriptif tertutup (bisa diskor
 * proporsional), `roleplay` utk pertanyaan opini/deskripsi BEBAS (jawaban
 * personal, tidak ada 1 jawaban benar — pola sama `roleplay` Explorer/
 * Adventurer). Kata kunci dipetakan dari `VOCAB_TOPICS_ACHIEVER` topik
 * `ciri-ciri-fisik` (Physical Appearance).
 */
/**
 * 9 topik tambahan (sesi ini) — menggenapkan Speaking Achiever dari 1 jadi
 * 10 topik (target CLAUDE.md ≥10 topik/skill). Riset & rasional lengkap:
 * `materi/speaking.md` §14. Sama prinsip dgn genapkan Adventurer (sesi
 * sebelumnya): BUKAN cuma tambah topik dgn kompleksitas SAMA — Kurikulum
 * Merdeka **Fase D** (kelas 7-9 SMP, backbone Achiever py posisi "antara
 * Fase C & D") eksplisit menuntut *"peserta didik terlibat dalam diskusi,
 * misalnya memberikan PENDAPAT, membuat PERBANDINGAN, dan menyampaikan
 * PREFERENSI"* dgn frasa fungsional bernama eksplisit ("In my opinion...",
 * "What do you think about...", "I believe that...") — SATU TINGKAT LEBIH
 * MAJU dari pola deskripsi+alasan ("because") yang baru dipakai Adventurer.
 * SEMUA 9 topik baru WAJIB py ≥1 frasa OPINI eksplisit ("In my opinion"/
 * "I believe"/"I think") DAN ≥1 pertanyaan PERBANDINGAN/PREFERENSI
 * ("Which do you prefer...", "..., or...? Why?") — pembeda konkret dari
 * Adventurer (yang cuma py "because", tanpa framing opini/perbandingan
 * eksplisit). Domain dipetakan ke 9 dari 10 domain `VOCAB_TOPICS_ACHIEVER`
 * yg belum disentuh Speaking — SAMA 9 domain (+`ciri-ciri-fisik` yg sudah
 * ada) yg Listening Achiever SUDAH pakai SEMUA 10-nya, pola sama Explorer/
 * Adventurer (id topik Speaking beda dari id Listening).
 */
export const SPEAKING_TOPICS_ACHIEVER: SpeakingTopic[] = [
  {
    id: 'deskripsi-orang',
    title: 'Deskripsi Orang (Describing People)',
    desc: '4 latihan bicara',
    model: ['She has curly hair.', 'He is tall and strong.'],
    drill: ['My friend has curly hair.', 'My dad is tall.', 'My sister is beautiful.', 'My grandfather is old.'],
    roleplay: ['What does your best friend look like?', 'Describe someone in your family.', 'Who is the tallest person you know?'],
  },
  {
    id: 'tempat-favorit-di-kota',
    title: 'Tempat Favoritku di Kota (My Favorite Place in Town)',
    desc: '3 latihan bicara',
    model: ['In my opinion, the library is the best place to relax.', 'I prefer the park to the mall because it is quieter.'],
    drill: ['The museum is more interesting than the mall.', 'I think the stadium is exciting on game day.', 'The market is busier than the library.'],
    roleplay: ['What is your favorite place in town?', 'Which do you prefer, the park or the mall?', 'What do you think about visiting a museum?'],
  },
  {
    id: 'kasih-arahan',
    title: 'Kasih Arahan (Giving Directions)',
    desc: '3 latihan bicara',
    model: ['Turn left at the corner.', 'I believe this is the fastest way to school.'],
    drill: ['Go straight, then turn right.', 'The bank is between the school and the park.', 'I think this shortcut is better than the main road.'],
    roleplay: ['How do you get to your school?', 'Which way is faster, left or right?', 'What do you think is the best way to the park?'],
  },
  {
    id: 'hiburan-favoritku',
    title: 'Hiburan Favoritku (My Favorite Entertainment)',
    desc: '3 latihan bicara',
    model: ['In my opinion, watching movies is more fun than playing video games.', 'I prefer reading comics because they are relaxing.'],
    drill: ['I think concerts are exciting.', 'Board games are more fun with friends.', 'I believe outdoor activities are healthier than screen time.'],
    roleplay: ['What do you like to do in your free time?', 'What do you think about video games?', 'Do you prefer indoor or outdoor activities? Why?'],
  },
  {
    id: 'kebiasaan-baikku',
    title: 'Kebiasaan Baikku (My Good Habits)',
    desc: '3 latihan bicara',
    model: ['I believe that exercising every day improves my health.', 'I prefer organizing my room before studying.'],
    drill: ['I try to achieve my goals every week.', 'I think practicing makes you better at anything.', 'She decided to join the school club.'],
    roleplay: ['What habit do you want to improve?', 'What do you think helps you study better?', 'Do you prefer planning ahead or doing things spontaneously?'],
  },
  {
    id: 'pendapatku-soal-teknologi',
    title: 'Pendapatku Soal Teknologi (My Opinion on Technology)',
    desc: '3 latihan bicara',
    model: ['In my opinion, tablets are useful for learning.', 'I believe the internet helps us learn new things.'],
    drill: ['I think computers are faster than tablets for typing.', 'A smartphone is more portable than a laptop.', 'I believe technology should be used carefully.'],
    roleplay: ['What do you think about using a tablet for school?', 'Which is better, a laptop or a smartphone? Why?', 'How does technology help you learn?'],
  },
  {
    id: 'kepribadian-idolaku',
    title: 'Kepribadian Idolaku (Personality I Admire)',
    desc: '3 latihan bicara',
    model: ['I admire people who are honest.', 'In my opinion, being kind is more important than being smart.'],
    drill: ['I think confident people are inspiring.', 'A generous friend is a good friend.', 'I believe patience is an important trait.'],
    roleplay: ['What personality trait do you admire most?', 'Do you think kindness is more important than intelligence? Why?', 'Describe someone with a good personality.'],
  },
  {
    id: 'pelajaran-favoritku',
    title: 'Pelajaran Favoritku (My Favorite Subject)',
    desc: '3 latihan bicara',
    model: ['In my opinion, science is the most interesting subject.', 'I prefer math because it is challenging.'],
    drill: ['I think art class is more relaxing than math.', 'History helps us understand the past.', 'I believe English is useful for the future.'],
    roleplay: ['What is your favorite subject?', 'Which subject do you find difficult? Why?', 'What do you think about learning a new language?'],
  },
  {
    id: 'angka-di-sekitarku',
    title: 'Angka di Sekitarku (Numbers Around Me)',
    desc: '3 latihan bicara',
    model: ['I think fifty dollars is expensive for a toy.', 'In my opinion, saving one hundred dollars a month is a good goal.'],
    drill: ['I have seventy pages left to read.', 'The trip costs around two hundred dollars.', 'I believe ninety percent effort is enough to pass.'],
    roleplay: ['How much money do you save each month?', 'Do you think one hundred dollars is a lot for a gift?', 'What number is important to you?'],
  },
  {
    id: 'benda-favoritku',
    title: 'Benda Favoritku (My Favorite Things)',
    desc: '3 latihan bicara',
    model: ['I think this backpack is durable and comfortable.', 'In my opinion, a flexible schedule is better than a strict one.'],
    drill: ['This material is stronger than plastic.', 'I believe a lightweight bag is more practical for school.', 'The fabric feels smooth and soft.'],
    roleplay: ['What object do you use every day?', 'Which is better, a strong material or a light one? Why?', 'Describe your favorite thing and why you like it.'],
  },
];

/**
 * Speaking Trailblazer (12+ th, ≈B1) — format KETIGA `SpeakingInterviewTopic`
 * (types.ts), BARU dari nol. Keputusan user (ditanya eksplisit: ikuti default
 * PRD §9 "low-effort 1-2 topik" VS desain elemen baru ala interview KET/PET
 * — user PILIH desain baru) — riset `materi/speaking.md` §9: Cambridge A2
 * Key (KET) → B1 Preliminary (PET) py Speaking test format INTERVIEW
 * ANTAR-KANDIDAT, ciri khas yg genuinely beda dari semua level di bawahnya
 * (bukan cuma "naikkan kompleksitas kalimat"). "Kandidat A" fiktif (`Bima`)
 * menjawab TIAP pertanyaan DULU (model jawaban natural + alasan "because"),
 * baru giliran anak menjawab dgn kata-katanya sendiri via mic — jawaban anak
 * TIDAK diskor proporsional (personal/terbuka, sama alasan `roleplay`
 * `SpeakingTopic` lama), TETAP wajib py "▶️ Play Suaramu".
 *
 * **5/5 topik — target Trailblazer TERCAPAI** (CLAUDE.md poin 1: Trailblazer
 * SENGAJA target ≥5, BUKAN ≥10 spt 5 level lain, biar tetap terasa "jalur
 * bonus" — bukan target lama "1-2 modul" lagi, sudah direvisi user). 1 topik
 * (`rencana-masa-depan`) dari sesi awal + 4 topik BARU (`akhir-pekanku`/
 * `olahraga-kesehatan`/`arti-persahabatan`/`tempat-tinggalku`) — semua tema
 * PET Speaking Part 1 yg genuinely umum (weekend/hobi, olahraga&kesehatan,
 * makna persahabatan, deskripsi tempat tinggal) & BELUM dipakai topik
 * Vocab/Listening Trailblazer manapun. `peerName` KONSISTEN "Bima" di
 * SEMUA 5 topik (bukan ganti-ganti nama tiap topik) — supaya anak terbiasa
 * dgn "1 teman ngobrol tetap" di seluruh level ini, bukan karakter baru tiap
 * kali (konsistensi pengalaman, bukan variasi sembarangan).
 */
export const SPEAKING_TOPICS_TRAILBLAZER: SpeakingInterviewTopic[] = [
  {
    id: 'rencana-masa-depan',
    title: 'Rencana Masa Depan (Future Plans)',
    desc: '8 giliran wawancara',
    peerName: 'Bima',
    turns: [
      {
        question: { en: 'What do you want to be when you grow up?', id: 'Apa cita-citamu kalau sudah besar?' },
        peerAnswer: { en: 'I want to be a doctor because I want to help people.', id: 'Aku mau jadi dokter karena aku mau membantu orang.' },
      },
      {
        question: { en: 'What subject do you want to study more in the future?', id: 'Pelajaran apa yang mau kamu pelajari lebih dalam di masa depan?' },
        peerAnswer: { en: "I want to study science because it's very interesting.", id: 'Aku mau belajar sains karena sangat menarik.' },
      },
      {
        question: { en: 'Do you want to live in a big city or a small town?', id: 'Kamu mau tinggal di kota besar atau kota kecil?' },
        peerAnswer: { en: 'I want to live in a big city because there are many things to do.', id: 'Aku mau tinggal di kota besar karena banyak hal yang bisa dilakukan.' },
      },
      {
        question: { en: 'What new skill do you want to learn?', id: 'Keahlian baru apa yang mau kamu pelajari?' },
        peerAnswer: { en: 'I want to learn how to play the guitar.', id: 'Aku mau belajar main gitar.' },
      },
      {
        question: { en: 'Do you want to travel to another country someday?', id: 'Apakah kamu mau bepergian ke negara lain suatu hari nanti?' },
        peerAnswer: { en: 'Yes, I want to visit Japan because I love the culture.', id: 'Iya, aku mau mengunjungi Jepang karena aku suka budayanya.' },
      },
      {
        question: { en: 'What kind of job do you think is important for the future?', id: 'Menurutmu, pekerjaan apa yang penting untuk masa depan?' },
        peerAnswer: { en: 'I think being a teacher is important because they help students learn.', id: 'Menurutku jadi guru itu penting karena mereka membantu murid belajar.' },
      },
      {
        question: { en: 'How do you want to help your community when you are older?', id: 'Bagaimana kamu ingin membantu lingkunganmu saat sudah besar nanti?' },
        peerAnswer: { en: 'I want to plant more trees to keep the air clean.', id: 'Aku mau menanam lebih banyak pohon supaya udaranya tetap bersih.' },
      },
      {
        question: { en: 'What is your biggest dream?', id: 'Apa impian terbesarmu?' },
        peerAnswer: { en: 'My biggest dream is to build my own school for children.', id: 'Impian terbesarku adalah membangun sekolahku sendiri untuk anak-anak.' },
      },
    ],
  },
  {
    id: 'akhir-pekanku',
    title: 'Akhir Pekanku (My Weekend)',
    desc: '8 giliran wawancara',
    peerName: 'Bima',
    turns: [
      {
        question: { en: 'What do you usually do on weekends?', id: 'Apa yang biasanya kamu lakukan di akhir pekan?' },
        peerAnswer: { en: 'I usually play basketball with my friends because it keeps me active.', id: 'Aku biasanya main basket dengan teman-temanku karena itu membuatku tetap aktif.' },
      },
      {
        question: { en: 'Do you prefer staying at home or going out on weekends?', id: 'Kamu lebih suka di rumah atau pergi keluar saat akhir pekan?' },
        peerAnswer: { en: 'I prefer going out because I like visiting new places.', id: 'Aku lebih suka pergi keluar karena aku suka mengunjungi tempat baru.' },
      },
      {
        question: { en: 'What is your favorite weekend activity?', id: 'Apa aktivitas akhir pekan favoritmu?' },
        peerAnswer: { en: 'My favorite activity is watching movies with my family.', id: 'Aktivitas favoritku adalah menonton film bersama keluargaku.' },
      },
      {
        question: { en: 'Do you do any chores on the weekend?', id: 'Apakah kamu mengerjakan pekerjaan rumah saat akhir pekan?' },
        peerAnswer: { en: 'Yes, I help clean the house every Saturday morning.', id: 'Iya, aku bantu bersih-bersih rumah setiap Sabtu pagi.' },
      },
      {
        question: { en: 'How do you relax after a busy week?', id: 'Bagaimana kamu bersantai setelah minggu yang sibuk?' },
        peerAnswer: { en: 'I relax by listening to music and reading books.', id: 'Aku bersantai dengan mendengarkan musik dan membaca buku.' },
      },
      {
        question: { en: 'Do you spend your weekend with friends or family?', id: 'Kamu menghabiskan akhir pekan dengan teman atau keluarga?' },
        peerAnswer: { en: 'I spend most of my weekend with my family.', id: 'Aku menghabiskan sebagian besar akhir pekanku dengan keluargaku.' },
      },
      {
        question: { en: 'Would you rather have a longer weekend or a shorter week?', id: 'Kamu lebih suka akhir pekan lebih panjang atau minggu kerja lebih pendek?' },
        peerAnswer: { en: 'I would rather have a longer weekend to rest more.', id: 'Aku lebih suka akhir pekan yang lebih panjang supaya bisa istirahat lebih banyak.' },
      },
      {
        question: { en: 'What is something new you want to try next weekend?', id: 'Apa hal baru yang ingin kamu coba akhir pekan depan?' },
        peerAnswer: { en: 'I want to try hiking with my friends next weekend.', id: 'Aku mau coba mendaki gunung bersama teman-temanku akhir pekan depan.' },
      },
    ],
  },
  {
    id: 'olahraga-kesehatan',
    title: 'Olahraga & Kesehatan (Sports & Health)',
    desc: '8 giliran wawancara',
    peerName: 'Bima',
    turns: [
      {
        question: { en: 'Do you play any sports?', id: 'Apakah kamu bermain olahraga?' },
        peerAnswer: { en: 'Yes, I play badminton twice a week.', id: 'Iya, aku main bulu tangkis dua kali seminggu.' },
      },
      {
        question: { en: 'Why do you think exercise is important?', id: 'Menurutmu kenapa olahraga itu penting?' },
        peerAnswer: { en: 'I think exercise is important because it keeps our body strong and healthy.', id: 'Menurutku olahraga itu penting karena membuat tubuh kita kuat dan sehat.' },
      },
      {
        question: { en: 'What sport would you like to try?', id: 'Olahraga apa yang ingin kamu coba?' },
        peerAnswer: { en: 'I would like to try swimming because it looks fun.', id: 'Aku ingin coba berenang karena kelihatannya seru.' },
      },
      {
        question: { en: 'Do you prefer team sports or individual sports?', id: 'Kamu lebih suka olahraga tim atau perorangan?' },
        peerAnswer: { en: 'I prefer team sports because I enjoy playing with friends.', id: 'Aku lebih suka olahraga tim karena aku suka bermain bersama teman.' },
      },
      {
        question: { en: 'How often do you exercise?', id: 'Seberapa sering kamu berolahraga?' },
        peerAnswer: { en: 'I exercise almost every day, even just a short walk.', id: 'Aku berolahraga hampir setiap hari, walau cuma jalan kaki sebentar.' },
      },
      {
        question: { en: 'What do you eat to stay healthy?', id: 'Apa yang kamu makan supaya tetap sehat?' },
        peerAnswer: { en: 'I try to eat more vegetables and drink plenty of water.', id: 'Aku berusaha makan lebih banyak sayur dan minum banyak air.' },
      },
      {
        question: { en: 'Who is your favorite athlete?', id: 'Siapa atlet favoritmu?' },
        peerAnswer: { en: 'My favorite athlete is a badminton player because he never gives up.', id: 'Atlet favoritku adalah pemain bulu tangkis karena dia tidak pernah menyerah.' },
      },
      {
        question: { en: 'Do you think schools should have more sports classes?', id: 'Menurutmu apakah sekolah harus punya lebih banyak kelas olahraga?' },
        peerAnswer: { en: 'Yes, I believe more sports classes would make students healthier.', id: 'Iya, aku percaya lebih banyak kelas olahraga akan membuat murid lebih sehat.' },
      },
    ],
  },
  {
    id: 'arti-persahabatan',
    title: 'Arti Persahabatan (The Meaning of Friendship)',
    desc: '8 giliran wawancara',
    peerName: 'Bima',
    turns: [
      {
        question: { en: 'What makes a good friend?', id: 'Apa yang membuat seseorang jadi teman yang baik?' },
        peerAnswer: { en: 'I think a good friend is someone who is honest and supportive.', id: 'Menurutku teman yang baik adalah orang yang jujur dan suportif.' },
      },
      {
        question: { en: 'How many close friends do you have?', id: 'Berapa banyak teman dekat yang kamu punya?' },
        peerAnswer: { en: 'I have three close friends that I trust the most.', id: 'Aku punya tiga teman dekat yang paling aku percaya.' },
      },
      {
        question: { en: 'What do you and your friends usually do together?', id: 'Apa yang biasa kamu dan temanmu lakukan bersama?' },
        peerAnswer: { en: 'We usually play games and study together.', id: 'Kami biasanya main game dan belajar bersama.' },
      },
      {
        question: { en: 'Is it important to have many friends or a few close ones?', id: 'Apakah penting punya banyak teman atau sedikit tapi dekat?' },
        peerAnswer: { en: 'In my opinion, having a few close friends is better than having many.', id: 'Menurutku, punya sedikit teman dekat lebih baik daripada banyak teman.' },
      },
      {
        question: { en: 'How do you help a friend who is sad?', id: 'Bagaimana kamu membantu teman yang sedang sedih?' },
        peerAnswer: { en: 'I listen to them and try to cheer them up.', id: 'Aku mendengarkan mereka dan berusaha menghibur mereka.' },
      },
      {
        question: { en: 'Have you ever had a disagreement with a friend?', id: 'Pernahkah kamu berselisih pendapat dengan teman?' },
        peerAnswer: { en: 'Yes, but we talked about it and became friends again.', id: 'Pernah, tapi kami membicarakannya dan berteman lagi.' },
      },
      {
        question: { en: 'What do you think about making friends online?', id: 'Bagaimana pendapatmu soal berteman secara daring?' },
        peerAnswer: { en: 'I think it can be nice, but meeting in person is more meaningful.', id: 'Menurutku itu bisa menyenangkan, tapi bertemu langsung lebih berarti.' },
      },
      {
        question: { en: 'Why is friendship important to you?', id: 'Kenapa persahabatan penting untukmu?' },
        peerAnswer: { en: 'Friendship is important because it makes life happier and easier.', id: 'Persahabatan penting karena membuat hidup lebih bahagia dan lebih mudah.' },
      },
    ],
  },
  {
    id: 'tempat-tinggalku',
    title: 'Tempat Tinggalku (Where I Live)',
    desc: '8 giliran wawancara',
    peerName: 'Bima',
    turns: [
      {
        question: { en: 'Can you describe the place where you live?', id: 'Bisakah kamu menjelaskan tempat tinggalmu?' },
        peerAnswer: { en: 'I live in a small house near a park.', id: 'Aku tinggal di rumah kecil dekat taman.' },
      },
      {
        question: { en: 'What do you like most about your neighborhood?', id: 'Apa yang paling kamu suka dari lingkungan tempat tinggalmu?' },
        peerAnswer: { en: 'I like that it is quiet and friendly.', id: 'Aku suka karena tempatnya tenang dan ramah.' },
      },
      {
        question: { en: 'Is your home in a city or a village?', id: 'Apakah rumahmu di kota atau di desa?' },
        peerAnswer: { en: 'My home is in a small town, between a city and a village.', id: 'Rumahku ada di kota kecil, di antara kota besar dan desa.' },
      },
      {
        question: { en: 'What would you change about your neighborhood?', id: 'Apa yang ingin kamu ubah dari lingkunganmu?' },
        peerAnswer: { en: 'I would like more parks for children to play in.', id: 'Aku ingin lebih banyak taman untuk anak-anak bermain.' },
      },
      {
        question: { en: 'Do you know your neighbors well?', id: 'Apakah kamu kenal baik dengan tetanggamu?' },
        peerAnswer: { en: 'Yes, my neighbors are very friendly and helpful.', id: 'Iya, tetanggaku sangat ramah dan suka membantu.' },
      },
      {
        question: { en: 'What is special about the place where you live?', id: 'Apa yang istimewa dari tempat tinggalmu?' },
        peerAnswer: { en: 'My town is famous for its delicious street food.', id: 'Kotaku terkenal dengan jajanan kaki lima yang enak.' },
      },
      {
        question: { en: 'Would you like to live somewhere else in the future?', id: 'Apakah kamu ingin tinggal di tempat lain di masa depan?' },
        peerAnswer: { en: 'I would like to live near the beach someday.', id: 'Aku ingin tinggal dekat pantai suatu hari nanti.' },
      },
      {
        question: { en: 'How has your neighborhood changed over the years?', id: 'Bagaimana lingkunganmu berubah selama bertahun-tahun?' },
        peerAnswer: { en: 'There are more shops and buildings now than before.', id: 'Sekarang ada lebih banyak toko dan bangunan dibanding dulu.' },
      },
    ],
  },
  {
    id: 'sekolah-pelajaran',
    title: 'Sekolah & Pelajaran (School & Studies)',
    desc: '8 giliran wawancara',
    peerName: 'Bima',
    turns: [
      {
        question: { en: 'What is your favorite subject at school?', id: 'Apa pelajaran favoritmu di sekolah?' },
        peerAnswer: { en: 'My favorite subject is science because I love doing experiments.', id: 'Pelajaran favoritku sains karena aku suka melakukan percobaan.' },
      },
      {
        question: { en: 'Is there a subject you find difficult?', id: 'Apakah ada pelajaran yang menurutmu sulit?' },
        peerAnswer: { en: 'Yes, math is difficult for me because the formulas are hard to remember.', id: 'Iya, matematika sulit buatku karena rumusnya susah diingat.' },
      },
      {
        question: { en: 'Who is your favorite teacher?', id: 'Siapa guru favoritmu?' },
        peerAnswer: { en: 'My favorite teacher is my English teacher because she makes lessons fun.', id: 'Guru favoritku adalah guru Bahasa Inggrisku karena dia membuat pelajaran jadi seru.' },
      },
      {
        question: { en: 'What do you usually do during recess?', id: 'Apa yang biasanya kamu lakukan saat istirahat?' },
        peerAnswer: { en: 'I usually chat with my friends and eat a snack.', id: 'Aku biasanya mengobrol dengan teman-teman dan makan camilan.' },
      },
      {
        question: { en: 'How do you get to school every day?', id: 'Bagaimana kamu pergi ke sekolah setiap hari?' },
        peerAnswer: { en: 'I go to school by bicycle because it is close to my house.', id: 'Aku naik sepeda ke sekolah karena rumahku dekat.' },
      },
      {
        question: { en: 'What do you think makes a good student?', id: 'Menurutmu apa yang membuat seorang murid jadi baik?' },
        peerAnswer: { en: 'I think a good student listens carefully and asks questions.', id: 'Menurutku murid yang baik mendengarkan dengan saksama dan bertanya.' },
      },
      {
        question: { en: 'Do you prefer studying alone or in a group?', id: 'Kamu lebih suka belajar sendiri atau berkelompok?' },
        peerAnswer: { en: 'I prefer studying in a group because we can help each other.', id: 'Aku lebih suka belajar berkelompok karena kami bisa saling membantu.' },
      },
      {
        question: { en: 'What is your dream school project?', id: 'Apa proyek sekolah impianmu?' },
        peerAnswer: { en: 'My dream project is building a small robot for the science fair.', id: 'Proyek impianku adalah membuat robot kecil untuk pameran sains.' },
      },
    ],
  },
  {
    id: 'musik-dan-film',
    title: 'Musik & Film (Music & Movies)',
    desc: '8 giliran wawancara',
    peerName: 'Bima',
    turns: [
      {
        question: { en: 'What kind of music do you like?', id: 'Musik apa yang kamu sukai?' },
        peerAnswer: { en: 'I like pop music because the songs are catchy and fun.', id: 'Aku suka musik pop karena lagunya catchy dan menyenangkan.' },
      },
      {
        question: { en: 'Do you play a musical instrument?', id: 'Apakah kamu bisa memainkan alat musik?' },
        peerAnswer: { en: 'Yes, I play the piano a little bit every week.', id: 'Iya, aku main piano sedikit setiap minggu.' },
      },
      {
        question: { en: 'What is your favorite movie?', id: 'Apa film favoritmu?' },
        peerAnswer: { en: 'My favorite movie is an animated film because the story is touching.', id: 'Film favoritku adalah film animasi karena ceritanya menyentuh.' },
      },
      {
        question: { en: 'Do you prefer watching movies at home or at the cinema?', id: 'Kamu lebih suka nonton film di rumah atau di bioskop?' },
        peerAnswer: { en: 'I prefer the cinema because the big screen feels more exciting.', id: 'Aku lebih suka di bioskop karena layar besarnya terasa lebih seru.' },
      },
      {
        question: { en: 'Who is your favorite singer or band?', id: 'Siapa penyanyi atau band favoritmu?' },
        peerAnswer: { en: 'My favorite singer writes songs about friendship and hope.', id: 'Penyanyi favoritku menulis lagu tentang persahabatan dan harapan.' },
      },
      {
        question: { en: 'How does music make you feel?', id: 'Bagaimana perasaanmu saat mendengarkan musik?' },
        peerAnswer: { en: 'Music makes me feel calm and happy at the same time.', id: 'Musik membuatku merasa tenang sekaligus senang.' },
      },
      {
        question: { en: 'Do you think music class is important at school?', id: 'Menurutmu apakah pelajaran musik penting di sekolah?' },
        peerAnswer: { en: 'Yes, I think music class helps students express their feelings.', id: 'Iya, menurutku pelajaran musik membantu murid mengungkapkan perasaan mereka.' },
      },
      {
        question: { en: 'If you could learn a new instrument, what would it be?', id: 'Kalau bisa belajar alat musik baru, kamu mau belajar apa?' },
        peerAnswer: { en: 'I would like to learn the guitar because it looks fun to play.', id: 'Aku mau belajar gitar karena kelihatannya seru dimainkan.' },
      },
    ],
  },
  {
    id: 'makanan-favoritku',
    title: 'Makanan Favoritku (My Favorite Food)',
    desc: '8 giliran wawancara',
    peerName: 'Bima',
    turns: [
      {
        question: { en: 'What is your favorite food?', id: 'Apa makanan favoritmu?' },
        peerAnswer: { en: 'My favorite food is fried rice because it reminds me of home.', id: 'Makanan favoritku nasi goreng karena mengingatkanku pada rumah.' },
      },
      {
        question: { en: 'Do you like cooking?', id: 'Apakah kamu suka memasak?' },
        peerAnswer: { en: 'Yes, I like cooking simple dishes with my mom on weekends.', id: 'Iya, aku suka memasak masakan sederhana bersama mama di akhir pekan.' },
      },
      {
        question: { en: 'What food do you dislike?', id: 'Makanan apa yang tidak kamu suka?' },
        peerAnswer: { en: 'I dislike spicy food because it makes my stomach hurt.', id: 'Aku tidak suka makanan pedas karena bikin perutku sakit.' },
      },
      {
        question: { en: 'Do you prefer eating at home or at a restaurant?', id: 'Kamu lebih suka makan di rumah atau di restoran?' },
        peerAnswer: { en: 'I prefer eating at home because the food feels healthier.', id: 'Aku lebih suka makan di rumah karena makanannya terasa lebih sehat.' },
      },
      {
        question: { en: 'What is a traditional food from your hometown?', id: 'Apa makanan tradisional dari kotamu?' },
        peerAnswer: { en: 'A traditional food from my hometown is satay with peanut sauce.', id: 'Makanan tradisional dari kotaku adalah sate dengan bumbu kacang.' },
      },
      {
        question: { en: 'Do you think fast food is bad for health?', id: 'Menurutmu apakah makanan cepat saji buruk untuk kesehatan?' },
        peerAnswer: { en: 'I think fast food is fine sometimes, but not every day.', id: 'Menurutku makanan cepat saji tidak apa sesekali, tapi jangan tiap hari.' },
      },
      {
        question: { en: 'What new food would you like to try?', id: 'Makanan baru apa yang ingin kamu coba?' },
        peerAnswer: { en: 'I would like to try sushi because I have never tasted it before.', id: 'Aku ingin coba sushi karena belum pernah mencicipinya.' },
      },
      {
        question: { en: 'Who usually cooks in your family?', id: 'Siapa yang biasanya memasak di keluargamu?' },
        peerAnswer: { en: 'My mom usually cooks, but my dad cooks on weekends.', id: 'Mamaku biasanya memasak, tapi papaku memasak di akhir pekan.' },
      },
    ],
  },
  {
    id: 'teknologi-media-sosial',
    title: 'Teknologi & Media Sosial (Technology & Social Media)',
    desc: '8 giliran wawancara',
    peerName: 'Bima',
    turns: [
      {
        question: { en: 'How much time do you spend on your phone every day?', id: 'Berapa lama waktu yang kamu habiskan di ponsel setiap hari?' },
        peerAnswer: { en: 'I spend about two hours on my phone every day.', id: 'Aku menghabiskan sekitar dua jam di ponsel setiap hari.' },
      },
      {
        question: { en: 'What do you usually do online?', id: 'Apa yang biasanya kamu lakukan saat online?' },
        peerAnswer: { en: 'I usually watch videos and chat with my friends online.', id: 'Aku biasanya menonton video dan mengobrol dengan teman-teman secara daring.' },
      },
      {
        question: { en: 'Do you think social media is good or bad for teenagers?', id: 'Menurutmu apakah media sosial baik atau buruk untuk remaja?' },
        peerAnswer: { en: 'I think social media can be good, but too much of it is not healthy.', id: 'Menurutku media sosial bisa baik, tapi terlalu banyak juga tidak sehat.' },
      },
      {
        question: { en: 'What is your favorite app?', id: 'Apa aplikasi favoritmu?' },
        peerAnswer: { en: 'My favorite app is a video app because it has funny and creative content.', id: 'Aplikasi favoritku aplikasi video karena isinya lucu dan kreatif.' },
      },
      {
        question: { en: 'Do your parents set rules about screen time?', id: 'Apakah orang tuamu membuat aturan soal waktu layar?' },
        peerAnswer: { en: 'Yes, my parents only let me use my phone for one hour after homework.', id: 'Iya, orang tuaku cuma mengizinkanku pakai ponsel satu jam setelah PR selesai.' },
      },
      {
        question: { en: 'How do you stay safe online?', id: 'Bagaimana kamu tetap aman saat online?' },
        peerAnswer: { en: 'I never share my personal information with strangers online.', id: 'Aku tidak pernah membagikan data pribadiku ke orang asing secara daring.' },
      },
      {
        question: { en: 'What technology do you think will change in the future?', id: 'Menurutmu teknologi apa yang akan berubah di masa depan?' },
        peerAnswer: { en: 'I think phones will become even smarter and more helpful.', id: 'Menurutku ponsel akan makin pintar dan makin membantu.' },
      },
      {
        question: { en: 'Would you rather read a book or watch a video to learn something new?', id: 'Kamu lebih suka membaca buku atau menonton video untuk belajar hal baru?' },
        peerAnswer: { en: 'I would rather watch a video because it is easier to understand.', id: 'Aku lebih suka menonton video karena lebih mudah dipahami.' },
      },
    ],
  },
  {
    id: 'hari-libur-tradisi-keluarga',
    title: 'Hari Libur & Tradisi Keluarga (Holidays & Family Traditions)',
    desc: '8 giliran wawancara',
    peerName: 'Bima',
    turns: [
      {
        question: { en: 'What is your favorite holiday?', id: 'Apa hari libur favoritmu?' },
        peerAnswer: { en: 'My favorite holiday is Eid because I get to meet my whole family.', id: 'Hari libur favoritku Lebaran karena aku bisa bertemu seluruh keluargaku.' },
      },
      {
        question: { en: 'Does your family have any special traditions?', id: 'Apakah keluargamu punya tradisi khusus?' },
        peerAnswer: { en: 'Yes, we always cook special food together before the holiday.', id: 'Iya, kami selalu memasak makanan spesial bersama sebelum hari raya.' },
      },
      {
        question: { en: 'How do you usually celebrate your birthday?', id: 'Bagaimana biasanya kamu merayakan ulang tahunmu?' },
        peerAnswer: { en: 'I usually celebrate with a small party and my favorite cake.', id: 'Aku biasanya merayakannya dengan pesta kecil dan kue favoritku.' },
      },
      {
        question: { en: 'Do you prefer celebrating at home or traveling somewhere?', id: 'Kamu lebih suka merayakan di rumah atau bepergian ke suatu tempat?' },
        peerAnswer: { en: 'I prefer traveling because it feels like a new adventure.', id: 'Aku lebih suka bepergian karena rasanya seperti petualangan baru.' },
      },
      {
        question: { en: 'What gift would you like to receive?', id: 'Hadiah apa yang ingin kamu terima?' },
        peerAnswer: { en: 'I would like to receive a new book because I love reading.', id: 'Aku ingin menerima buku baru karena aku suka membaca.' },
      },
      {
        question: { en: 'Who do you usually spend holidays with?', id: 'Dengan siapa kamu biasanya menghabiskan hari libur?' },
        peerAnswer: { en: 'I usually spend holidays with my grandparents and cousins.', id: 'Aku biasanya menghabiskan hari libur bersama kakek nenek dan sepupuku.' },
      },
      {
        question: { en: 'What do you think is the best part of a holiday?', id: 'Menurutmu apa bagian terbaik dari hari libur?' },
        peerAnswer: { en: 'I think the best part is spending time with family without rushing.', id: 'Menurutku bagian terbaiknya adalah menghabiskan waktu bersama keluarga tanpa terburu-buru.' },
      },
      {
        question: { en: 'Is there a holiday from another country you find interesting?', id: 'Adakah hari libur dari negara lain yang menurutmu menarik?' },
        peerAnswer: { en: 'Yes, I find Chinese New Year interesting because of the lion dance.', id: 'Iya, aku merasa Tahun Baru Imlek menarik karena ada tarian baronsai.' },
      },
    ],
  },
];

export const SPEAKING_TOPICS_BY_LEVEL: Partial<Record<LevelKey, AnySpeakingTopic[]>> = {
  'little-stars': SPEAKING_TOPICS_LITTLE_STARS,
  starter: SPEAKING_TOPICS_STARTER,
  explorer: SPEAKING_TOPICS,
  adventurer: SPEAKING_TOPICS_ADVENTURER,
  trailblazer: SPEAKING_TOPICS_TRAILBLAZER,
  achiever: SPEAKING_TOPICS_ACHIEVER,
};
/**
 * Grammar Little Stars (3–6 th) — format KEDUA `GrammarPatternTopic`
 * (types.ts), riset & spesifikasi lengkap: `materi/grammar.md`. 1 topik, 10
 * kata, dipetakan dari `VOCAB_TOPICS_LITTLE_STARS` topik `kendaraan` (kata
 * kunci + emoji sama, kalimat pola `formA`/`formB` — **direname dari
 * `singular`/`plural` saat riset per-level meluas ke Starter**, lihat
 * komentar `GrammarPatternItem` types.ts — ditulis ULANG baru —
 * prinsip "modalitas beda, bukan duplikasi", konsisten Listening/Reading/
 * Speaking Little Stars) — dipilih krn SEMUA 10 kata kendaraan adalah benda
 * hitung (countable) & 9/10-nya berpluralisasi beraturan ("-s", cuma
 * "bus"→"buses" tidak beraturan), jadi anak bisa fokus ke KONTRAS satu vs
 * banyaknya, bukan kerumitan ejaan. `salam-sopan-santun` sudah dipakai
 * Speaking, `hewan-peliharaan` sudah dipakai Reading — `kendaraan` masih
 * kosong dari 2 skill lain itu.
 *
 * 🔒 REVISI (audit user: "apa objective grammar, beda dari modul lain?") —
 * kalimat `en` SENGAJA TIDAK menyebut angka ("It's a car."/"They're cars.",
 * BUKAN lagi "I see one car."/"I see two cars.") — versi awal py kata "one"/
 * "two" eksplisit di KEDUA bentuk, jadi anak bisa jawab benar 100% cukup
 * dengar kata angkanya SAJA, tanpa pernah perlu memperhatikan akhiran "-s"
 * atau "is"/"are" — task-nya jadi identik dgn latihan dengar-angka (tumpang
 * tindih persis dgn mini-game hitung Vocab `angka-pertama`), BUKAN grammar.
 * Sekarang satu-satunya sinyal pembeda singular/plural PERSIS "is"/"are" +
 * bentuk kata benda (artikel "a"/"an" vs bare plural) — struktur asli
 * Cambridge YLE Starters ("singular/plural nouns", `materi/grammar.md` §3.3),
 * tidak bisa lagi dijawab benar cuma dgn dengar kata angka. `id` TETAP pakai
 * "satu"/"dua" (Indonesia tidak py penanda jamak gramatikal, jadi kata
 * bilangan MEMANG cara alami menyatakan jumlah di sana) — aman krn `id` cuma
 * teks bantuan terjemahan di Kenalan, TIDAK PERNAH diputar/dites di Latihan
 * Inti/Tantangan (yang diuji cuma `en`).
 */
export const GRAMMAR_TOPICS_LITTLE_STARS: GrammarPatternTopic[] = [
  {
    id: 'satu-banyak',
    title: 'Satu atau Banyak? (One or Many?)',
    desc: '10 kata',
    items: [
      {
        en: 'Car',
        id: 'Mobil',
        emoji: '🚗',
        formA: { en: "It's a car.", id: 'Itu satu mobil.' },
        formB: { en: "They're cars.", id: 'Itu dua mobil.' },
      },
      {
        en: 'Bus',
        id: 'Bus',
        emoji: '🚌',
        formA: { en: "It's a bus.", id: 'Itu satu bus.' },
        formB: { en: "They're buses.", id: 'Itu dua bus.' },
      },
      {
        en: 'Bike',
        id: 'Sepeda',
        emoji: '🚲',
        formA: { en: "It's a bike.", id: 'Itu satu sepeda.' },
        formB: { en: "They're bikes.", id: 'Itu dua sepeda.' },
      },
      {
        en: 'Train',
        id: 'Kereta',
        emoji: '🚆',
        formA: { en: "It's a train.", id: 'Itu satu kereta.' },
        formB: { en: "They're trains.", id: 'Itu dua kereta.' },
      },
      {
        en: 'Airplane',
        id: 'Pesawat',
        emoji: '✈️',
        formA: { en: "It's an airplane.", id: 'Itu satu pesawat.' },
        formB: { en: "They're airplanes.", id: 'Itu dua pesawat.' },
      },
      {
        en: 'Boat',
        id: 'Perahu',
        emoji: '⛵',
        formA: { en: "It's a boat.", id: 'Itu satu perahu.' },
        formB: { en: "They're boats.", id: 'Itu dua perahu.' },
      },
      {
        en: 'Truck',
        id: 'Truk',
        emoji: '🚚',
        formA: { en: "It's a truck.", id: 'Itu satu truk.' },
        formB: { en: "They're trucks.", id: 'Itu dua truk.' },
      },
      {
        en: 'Fire Truck',
        id: 'Truk Pemadam',
        emoji: '🚒',
        formA: { en: "It's a fire truck.", id: 'Itu satu truk pemadam.' },
        formB: { en: "They're fire trucks.", id: 'Itu dua truk pemadam.' },
      },
      {
        en: 'Ambulance',
        id: 'Ambulans',
        emoji: '🚑',
        formA: { en: "It's an ambulance.", id: 'Itu satu ambulans.' },
        formB: { en: "They're ambulances.", id: 'Itu dua ambulans.' },
      },
      {
        en: 'Helicopter',
        id: 'Helikopter',
        emoji: '🚁',
        formA: { en: "It's a helicopter.", id: 'Itu satu helikopter.' },
        formB: { en: "They're helicopters.", id: 'Itu dua helikopter.' },
      },
    ],
  },
  /**
   * Topik 2 (riset lanjutan "genapkan Grammar Little Stars", `materi/
   * grammar.md` §13) — "have got" utk kepemilikan, struktur RESMI Cambridge
   * Pre-A1 Starters ("Have you got a pen?"). `contrastVisual: 'polarity'`
   * (REUSE PERSIS, TANPA kode baru) — struktur positif/negatif yang SAMA
   * bentuknya dgn "suka/tidak-suka" Starter, cuma kata kerjanya beda ("'ve
   * got"/"haven't got" vs "like"/"don't like"). Dipetakan dari
   * `VOCAB_TOPICS_LITTLE_STARS` `pakaian` (Clothes, belum diklaim topik
   * Grammar/Speaking/Reading manapun).
   */
  {
    id: 'punya-tidak-punya',
    title: 'Punya atau Tidak? (Have I Got It?)',
    desc: '10 kata',
    contrastVisual: 'polarity',
    items: [
      { en: 'Shirt', id: 'Baju', emoji: '👕', formA: { en: "I've got a shirt.", id: 'Aku punya baju.' }, formB: { en: "I haven't got a shirt.", id: 'Aku tidak punya baju.' } },
      { en: 'Pants', id: 'Celana Panjang', emoji: '👖', formA: { en: "I've got pants.", id: 'Aku punya celana panjang.' }, formB: { en: "I haven't got pants.", id: 'Aku tidak punya celana panjang.' } },
      { en: 'Shoes', id: 'Sepatu', emoji: '👟', formA: { en: "I've got shoes.", id: 'Aku punya sepatu.' }, formB: { en: "I haven't got shoes.", id: 'Aku tidak punya sepatu.' } },
      { en: 'Socks', id: 'Kaos Kaki', emoji: '🧦', formA: { en: "I've got socks.", id: 'Aku punya kaos kaki.' }, formB: { en: "I haven't got socks.", id: 'Aku tidak punya kaos kaki.' } },
      { en: 'Hat', id: 'Topi', emoji: '🧢', formA: { en: "I've got a hat.", id: 'Aku punya topi.' }, formB: { en: "I haven't got a hat.", id: 'Aku tidak punya topi.' } },
      { en: 'Dress', id: 'Gaun', emoji: '👗', formA: { en: "I've got a dress.", id: 'Aku punya gaun.' }, formB: { en: "I haven't got a dress.", id: 'Aku tidak punya gaun.' } },
      { en: 'Jacket', id: 'Jaket', emoji: '🧥', formA: { en: "I've got a jacket.", id: 'Aku punya jaket.' }, formB: { en: "I haven't got a jacket.", id: 'Aku tidak punya jaket.' } },
      { en: 'Shorts', id: 'Celana Pendek', emoji: '🩳', formA: { en: "I've got shorts.", id: 'Aku punya celana pendek.' }, formB: { en: "I haven't got shorts.", id: 'Aku tidak punya celana pendek.' } },
      { en: 'Gloves', id: 'Sarung Tangan', emoji: '🧤', formA: { en: "I've got gloves.", id: 'Aku punya sarung tangan.' }, formB: { en: "I haven't got gloves.", id: 'Aku tidak punya sarung tangan.' } },
      { en: 'Scarf', id: 'Syal', emoji: '🧣', formA: { en: "I've got a scarf.", id: 'Aku punya syal.' }, formB: { en: "I haven't got a scarf.", id: 'Aku tidak punya syal.' } },
    ],
  },
  /**
   * Topik 3 — "can" utk kemampuan, struktur RESMI Cambridge Pre-A1 Starters
   * ("The baby can wave."). `contrastVisual: 'polarity'` (REUSE PERSIS) —
   * positif/negatif "can"/"can't". Dipetakan dari `VOCAB_TOPICS_LITTLE_STARS`
   * `tubuhku` (My Body) — kata kerja per item SENGAJA divariasikan (touch/
   * close/open/clap/brush) mengikuti `example.en` asli tiap kata di Vocab
   * (bukan "touch" diulang 10x) supaya tetap natural per anggota tubuh.
   */
  {
    id: 'bisa-tidak-bisa',
    title: 'Bisa atau Tidak Bisa? (I Can or I Can\'t?)',
    desc: '10 kata',
    contrastVisual: 'polarity',
    items: [
      { en: 'Head', id: 'Kepala', emoji: '🙂', formA: { en: 'I can touch my head.', id: 'Aku bisa menyentuh kepalaku.' }, formB: { en: "I can't touch my head.", id: 'Aku tidak bisa menyentuh kepalaku.' } },
      { en: 'Shoulders', id: 'Bahu', emoji: '🤷', formA: { en: 'I can touch my shoulders.', id: 'Aku bisa menyentuh bahuku.' }, formB: { en: "I can't touch my shoulders.", id: 'Aku tidak bisa menyentuh bahuku.' } },
      { en: 'Knees', id: 'Lutut', emoji: '🦵', formA: { en: 'I can touch my knees.', id: 'Aku bisa menyentuh lututku.' }, formB: { en: "I can't touch my knees.", id: 'Aku tidak bisa menyentuh lututku.' } },
      { en: 'Toes', id: 'Jari Kaki', emoji: '🦶', formA: { en: 'I can touch my toes.', id: 'Aku bisa menyentuh jari kakiku.' }, formB: { en: "I can't touch my toes.", id: 'Aku tidak bisa menyentuh jari kakiku.' } },
      { en: 'Eyes', id: 'Mata', emoji: '👀', formA: { en: 'I can close my eyes.', id: 'Aku bisa menutup mataku.' }, formB: { en: "I can't close my eyes.", id: 'Aku tidak bisa menutup mataku.' } },
      { en: 'Ears', id: 'Telinga', emoji: '👂', formA: { en: 'I can touch my ears.', id: 'Aku bisa menyentuh telingaku.' }, formB: { en: "I can't touch my ears.", id: 'Aku tidak bisa menyentuh telingaku.' } },
      { en: 'Nose', id: 'Hidung', emoji: '👃', formA: { en: 'I can touch my nose.', id: 'Aku bisa menyentuh hidungku.' }, formB: { en: "I can't touch my nose.", id: 'Aku tidak bisa menyentuh hidungku.' } },
      { en: 'Mouth', id: 'Mulut', emoji: '👄', formA: { en: 'I can open my mouth.', id: 'Aku bisa membuka mulutku.' }, formB: { en: "I can't open my mouth.", id: 'Aku tidak bisa membuka mulutku.' } },
      { en: 'Hands', id: 'Tangan', emoji: '🙌', formA: { en: 'I can clap my hands.', id: 'Aku bisa bertepuk tangan.' }, formB: { en: "I can't clap my hands.", id: 'Aku tidak bisa bertepuk tangan.' } },
      { en: 'Hair', id: 'Rambut', emoji: '💇', formA: { en: 'I can brush my hair.', id: 'Aku bisa menyisir rambutku.' }, formB: { en: "I can't brush my hair.", id: 'Aku tidak bisa menyisir rambutku.' } },
    ],
  },
  /**
   * Topik 4 — demonstrative this/that, struktur RESMI Cambridge Pre-A1
   * Starters ("This is my car." / "Is that yours?"). `contrastVisual:
   * 'proximity'` (BARU, types.ts) — proxy JARAK (gambar besar+🔍 dekat vs
   * kecil+🔭 jauh), BUKAN jumlah/polaritas. Dipetakan dari
   * `VOCAB_TOPICS_LITTLE_STARS` `mainan` (Toys). Item "Blocks" (plural di
   * Vocab) SENGAJA ditulis singular "a block" di sini — demonstrative
   * this/that butuh kata benda singular, "These/those are blocks" akan
   * mencampur pola jamak ke topik yang fokusnya jarak, bukan jumlah.
   */
  {
    id: 'ini-itu',
    title: 'Ini atau Itu? (This or That?)',
    desc: '10 kata',
    contrastVisual: 'proximity',
    items: [
      { en: 'Ball', id: 'Bola', emoji: '⚽', formA: { en: 'This is a ball.', id: 'Ini bola.' }, formB: { en: 'That is a ball.', id: 'Itu bola.' } },
      { en: 'Doll', id: 'Boneka', emoji: '🪆', formA: { en: 'This is a doll.', id: 'Ini boneka.' }, formB: { en: 'That is a doll.', id: 'Itu boneka.' } },
      { en: 'Kite', id: 'Layangan', emoji: '🪁', formA: { en: 'This is a kite.', id: 'Ini layangan.' }, formB: { en: 'That is a kite.', id: 'Itu layangan.' } },
      { en: 'Balloon', id: 'Balon', emoji: '🎈', formA: { en: 'This is a balloon.', id: 'Ini balon.' }, formB: { en: 'That is a balloon.', id: 'Itu balon.' } },
      { en: 'Puzzle', id: 'Puzzle', emoji: '🧩', formA: { en: 'This is a puzzle.', id: 'Ini puzzle.' }, formB: { en: 'That is a puzzle.', id: 'Itu puzzle.' } },
      { en: 'Robot', id: 'Robot', emoji: '🤖', formA: { en: 'This is a robot.', id: 'Ini robot.' }, formB: { en: 'That is a robot.', id: 'Itu robot.' } },
      { en: 'Drum', id: 'Drum', emoji: '🥁', formA: { en: 'This is a drum.', id: 'Ini drum.' }, formB: { en: 'That is a drum.', id: 'Itu drum.' } },
      { en: 'Blocks', id: 'Balok', emoji: '🧱', formA: { en: 'This is a block.', id: 'Ini balok.' }, formB: { en: 'That is a block.', id: 'Itu balok.' } },
      { en: 'Yoyo', id: 'Yoyo', emoji: '🪀', formA: { en: 'This is a yoyo.', id: 'Ini yoyo.' }, formB: { en: 'That is a yoyo.', id: 'Itu yoyo.' } },
      { en: 'Teddy', id: 'Boneka Beruang', emoji: '🧸', formA: { en: 'This is a teddy.', id: 'Ini boneka beruang.' }, formB: { en: 'That is a teddy.', id: 'Itu boneka beruang.' } },
    ],
  },
  /**
   * Topik 5 — adjective ukuran (big/small), struktur RESMI Cambridge Pre-A1
   * Starters ("He's a small boy."). `contrastVisual: 'size'` (BARU,
   * types.ts) — gambar besar vs kecil TANPA lencana tambahan, krn ukurannya
   * SENDIRI yang jadi konten (beda dari `'proximity'` yang pakai ukuran sbg
   * PROXY ke konsep jarak). Dipetakan dari `VOCAB_TOPICS_LITTLE_STARS`
   * `bentuk` (Shapes) — bentuk geometris netral, skala besar/kecil jelas
   * tanpa makna lain yang mengganggu.
   */
  {
    id: 'besar-kecil',
    title: 'Besar atau Kecil? (Big or Small?)',
    desc: '10 kata',
    contrastVisual: 'size',
    items: [
      { en: 'Circle', id: 'Lingkaran', emoji: '⚪', formA: { en: "It's a big circle.", id: 'Itu lingkaran besar.' }, formB: { en: "It's a small circle.", id: 'Itu lingkaran kecil.' } },
      { en: 'Square', id: 'Persegi', emoji: '⬜', formA: { en: "It's a big square.", id: 'Itu persegi besar.' }, formB: { en: "It's a small square.", id: 'Itu persegi kecil.' } },
      { en: 'Triangle', id: 'Segitiga', emoji: '🔺', formA: { en: "It's a big triangle.", id: 'Itu segitiga besar.' }, formB: { en: "It's a small triangle.", id: 'Itu segitiga kecil.' } },
      { en: 'Star', id: 'Bintang', emoji: '⭐', formA: { en: "It's a big star.", id: 'Itu bintang besar.' }, formB: { en: "It's a small star.", id: 'Itu bintang kecil.' } },
      { en: 'Heart', id: 'Hati', emoji: '❤️', formA: { en: "It's a big heart.", id: 'Itu hati besar.' }, formB: { en: "It's a small heart.", id: 'Itu hati kecil.' } },
      { en: 'Diamond', id: 'Berlian', emoji: '🔷', formA: { en: "It's a big diamond.", id: 'Itu berlian besar.' }, formB: { en: "It's a small diamond.", id: 'Itu berlian kecil.' } },
      { en: 'Oval', id: 'Oval', emoji: '🥚', formA: { en: "It's a big oval.", id: 'Itu oval besar.' }, formB: { en: "It's a small oval.", id: 'Itu oval kecil.' } },
      { en: 'Cross', id: 'Silang', emoji: '➕', formA: { en: "It's a big cross.", id: 'Itu tanda silang besar.' }, formB: { en: "It's a small cross.", id: 'Itu tanda silang kecil.' } },
      { en: 'Arrow', id: 'Panah', emoji: '➡️', formA: { en: "It's a big arrow.", id: 'Itu panah besar.' }, formB: { en: "It's a small arrow.", id: 'Itu panah kecil.' } },
      { en: 'Moon', id: 'Bulan', emoji: '🌙', formA: { en: "It's a big moon.", id: 'Itu bulan besar.' }, formB: { en: "It's a small moon.", id: 'Itu bulan kecil.' } },
    ],
  },
  /**
   * 5 topik lanjutan (riset per-level, `materi/grammar.md` §20) — target
   * jauh lebih sulit dari sesi §13 krn kategori Cambridge Pre-A1 Starters yg
   * "bersih" (genuinely belum diklaim & genuinely cocok mekanik 1-gambar
   * statis) SUDAH HABIS sesi lalu — 5 kategori sisa (adverbs/conjunctions/
   * impersonal-you/have+obj+inf/-ing forms) SEMUA butuh scene/gerakan/terlalu
   * abstrak, dikonfirmasi TIDAK dipaksakan. 5 topik di bawah SEMUANYA
   * merupakan STRUKTUR/PERSON/NOMOR baru di dalam kategori yg SUDAH disentuh
   * struktur LAIN (pola sama persis dgn `punya-tidak-punya`/`bisa-tidak-bisa`
   * yg sama-sama `'polarity'` tapi verb beda) — bukan padding, tiap topik
   * genuinely mengajarkan kata kerja/person/nomor yg belum pernah dilatih.
   */
  /**
   * Topik ke-6 — "to be" positif/negatif utk perasaan (Cambridge Pre-A1
   * Starters kategori Verbs — kopula "to be" BELUM pernah dipakai utk
   * kontras polaritas di curriculum manapun, have-got/can/like semua verb
   * LAIN). `contrastVisual: 'polarity'` (REUSE PERSIS). Dari domain Vocab
   * `perasaanku` (My Feelings).
   */
  {
    id: 'senang-tidak-senang',
    title: 'Senang atau Tidak? (I Am / I Am Not)',
    desc: '10 kata',
    contrastVisual: 'polarity',
    items: [
      { en: 'Happy', id: 'Senang', emoji: '😊', formA: { en: 'I am happy.', id: 'Aku senang.' }, formB: { en: 'I am not happy.', id: 'Aku tidak senang.' } },
      { en: 'Sad', id: 'Sedih', emoji: '😢', formA: { en: 'I am sad.', id: 'Aku sedih.' }, formB: { en: 'I am not sad.', id: 'Aku tidak sedih.' } },
      { en: 'Angry', id: 'Marah', emoji: '😠', formA: { en: 'I am angry.', id: 'Aku marah.' }, formB: { en: 'I am not angry.', id: 'Aku tidak marah.' } },
      { en: 'Scared', id: 'Takut', emoji: '😨', formA: { en: 'I am scared.', id: 'Aku takut.' }, formB: { en: 'I am not scared.', id: 'Aku tidak takut.' } },
      { en: 'Sleepy', id: 'Mengantuk', emoji: '😴', formA: { en: 'I am sleepy.', id: 'Aku mengantuk.' }, formB: { en: 'I am not sleepy.', id: 'Aku tidak mengantuk.' } },
      { en: 'Hungry', id: 'Lapar', emoji: '😋', formA: { en: 'I am hungry.', id: 'Aku lapar.' }, formB: { en: 'I am not hungry.', id: 'Aku tidak lapar.' } },
      { en: 'Thirsty', id: 'Haus', emoji: '🥤', formA: { en: 'I am thirsty.', id: 'Aku haus.' }, formB: { en: 'I am not thirsty.', id: 'Aku tidak haus.' } },
      { en: 'Sick', id: 'Sakit', emoji: '🤒', formA: { en: 'I am sick.', id: 'Aku sakit.' }, formB: { en: 'I am not sick.', id: 'Aku tidak sakit.' } },
      { en: 'Silly', id: 'Konyol', emoji: '🤪', formA: { en: 'I am silly.', id: 'Aku konyol.' }, formB: { en: 'I am not silly.', id: 'Aku tidak konyol.' } },
      { en: 'Excited', id: 'Bersemangat', emoji: '🤩', formA: { en: 'I am excited.', id: 'Aku bersemangat.' }, formB: { en: 'I am not excited.', id: 'Aku tidak bersemangat.' } },
    ],
  },
  /**
   * Topik ke-7 — "want" positif/negatif, struktur RESMI Cambridge Pre-A1
   * Starters ("I want some milk."). SENGAJA register lebih LANGSUNG drpd
   * `would-like` Explorer (permintaan sopan) — pola tangga sama dgn can-
   * ability(Little Stars)/can-permission(Explorer) & like(Starter)/would-
   * like(Explorer). `contrastVisual: 'polarity'` (REUSE PERSIS). Dari domain
   * Vocab `buah-buahan` (Fruits) — artikel a/an/some dipetakan PERSIS sesuai
   * kata bendanya (apple/orange pakai "an", watermelon/pineapple pakai
   * "some" krn tak-terhitung) supaya kalimatnya tetap alami.
   */
  {
    id: 'mau-tidak-mau',
    title: 'Mau atau Tidak? (I Want / I Don\'t Want)',
    desc: '10 kata',
    contrastVisual: 'polarity',
    items: [
      { en: 'Apple', id: 'Apel', emoji: '🍎', formA: { en: 'I want an apple.', id: 'Aku mau apel.' }, formB: { en: "I don't want an apple.", id: 'Aku tidak mau apel.' } },
      { en: 'Banana', id: 'Pisang', emoji: '🍌', formA: { en: 'I want a banana.', id: 'Aku mau pisang.' }, formB: { en: "I don't want a banana.", id: 'Aku tidak mau pisang.' } },
      { en: 'Orange', id: 'Jeruk', emoji: '🍊', formA: { en: 'I want an orange.', id: 'Aku mau jeruk.' }, formB: { en: "I don't want an orange.", id: 'Aku tidak mau jeruk.' } },
      { en: 'Grape', id: 'Anggur', emoji: '🍇', formA: { en: 'I want a grape.', id: 'Aku mau anggur.' }, formB: { en: "I don't want a grape.", id: 'Aku tidak mau anggur.' } },
      { en: 'Watermelon', id: 'Semangka', emoji: '🍉', formA: { en: 'I want some watermelon.', id: 'Aku mau semangka.' }, formB: { en: "I don't want any watermelon.", id: 'Aku tidak mau semangka.' } },
      { en: 'Strawberry', id: 'Stroberi', emoji: '🍓', formA: { en: 'I want a strawberry.', id: 'Aku mau stroberi.' }, formB: { en: "I don't want a strawberry.", id: 'Aku tidak mau stroberi.' } },
      { en: 'Mango', id: 'Mangga', emoji: '🥭', formA: { en: 'I want a mango.', id: 'Aku mau mangga.' }, formB: { en: "I don't want a mango.", id: 'Aku tidak mau mangga.' } },
      { en: 'Pineapple', id: 'Nanas', emoji: '🍍', formA: { en: 'I want some pineapple.', id: 'Aku mau nanas.' }, formB: { en: "I don't want any pineapple.", id: 'Aku tidak mau nanas.' } },
      { en: 'Pear', id: 'Pir', emoji: '🍐', formA: { en: 'I want a pear.', id: 'Aku mau pir.' }, formB: { en: "I don't want a pear.", id: 'Aku tidak mau pir.' } },
      { en: 'Peach', id: 'Persik', emoji: '🍑', formA: { en: 'I want a peach.', id: 'Aku mau persik.' }, formB: { en: "I don't want a peach.", id: 'Aku tidak mau persik.' } },
    ],
  },
  /**
   * Topik ke-8 — possessive adjective 1st/2nd person "my/your", struktur
   * RESMI Cambridge Pre-A1 Starters, kategori SAMA dgn `miliknya-siapa`
   * Starter (his/her) tapi DEIKSIS beda total (pembicara/lawan bicara,
   * bukan org ketiga) — genuinely belum pernah dilatih. `contrastVisual:
   * 'possessor'` (BARU, types.ts — lencana 🙋 "Aku"/formA vs 🫵 "Kamu"/
   * formB, proxy PEMBICARA vs LAWAN BICARA, REUSE mekanik render `'character'`
   * TAPI beda makna lencana) — kandidat ini SEMPAT ditolak sesi §13 krn
   * dinilai "butuh visual 2-karakter lebih rumit drpd proximity/size", TAPI
   * `'character'` (utk his/her Starter) kemudian TERBUKTI 1 lencana overlay
   * di gambar STATIS sudah cukup mewakili kontras org — trik yg SAMA
   * dipakai di sini utk kontras pembicara. Dari domain Vocab `keluargaku`
   * (My Family).
   */
  {
    id: 'punya-siapa',
    title: 'Punya Siapa? (My or Your?)',
    desc: '10 kata',
    contrastVisual: 'possessor',
    items: [
      { en: 'Mom', id: 'Mama', emoji: '👩', formA: { en: 'This is my mom.', id: 'Ini mamaku.' }, formB: { en: 'This is your mom.', id: 'Ini mamamu.' } },
      { en: 'Dad', id: 'Papa', emoji: '👨', formA: { en: 'This is my dad.', id: 'Ini papaku.' }, formB: { en: 'This is your dad.', id: 'Ini papamu.' } },
      { en: 'Baby', id: 'Adik Bayi', emoji: '👶', formA: { en: 'This is my baby.', id: 'Ini adik bayiku.' }, formB: { en: 'This is your baby.', id: 'Ini adik bayimu.' } },
      { en: 'Sister', id: 'Kakak/Adik Perempuan', emoji: '👧', formA: { en: 'This is my sister.', id: 'Ini kakak/adik perempuanku.' }, formB: { en: 'This is your sister.', id: 'Ini kakak/adik perempuanmu.' } },
      { en: 'Brother', id: 'Kakak/Adik Laki-laki', emoji: '👦', formA: { en: 'This is my brother.', id: 'Ini kakak/adik laki-lakiku.' }, formB: { en: 'This is your brother.', id: 'Ini kakak/adik laki-lakimu.' } },
      { en: 'Grandma', id: 'Nenek', emoji: '👵', formA: { en: 'This is my grandma.', id: 'Ini nenekku.' }, formB: { en: 'This is your grandma.', id: 'Ini nenekmu.' } },
      { en: 'Grandpa', id: 'Kakek', emoji: '👴', formA: { en: 'This is my grandpa.', id: 'Ini kakekku.' }, formB: { en: 'This is your grandpa.', id: 'Ini kakekmu.' } },
      { en: 'Aunt', id: 'Bibi', emoji: '👩‍🦱', formA: { en: 'This is my aunt.', id: 'Ini bibiku.' }, formB: { en: 'This is your aunt.', id: 'Ini bibimu.' } },
      { en: 'Uncle', id: 'Paman', emoji: '🧔', formA: { en: 'This is my uncle.', id: 'Ini pamanku.' }, formB: { en: 'This is your uncle.', id: 'Ini pamanmu.' } },
      { en: 'Family', id: 'Keluarga', emoji: '👨‍👩‍👧‍👦', formA: { en: 'This is my family.', id: 'Ini keluargaku.' }, formB: { en: 'This is your family.', id: 'Ini keluargamu.' } },
    ],
  },
  /**
   * Topik ke-9 — demonstrative JAMAK "these/those", kategori Starters resmi
   * SAMA dgn `ini-itu` (this/that TUNGGAL) tapi nomor beda — anak pralek
   * TIDAK otomatis menggeneralisasi bentuk tunggal ke jamak tanpa dilatih
   * terpisah (beda kata, bukan cuma tambah -s). `contrastVisual: 'proximity'`
   * (REUSE PERSIS, TANPA kode baru — emoji topik ini SENGAJA diulang 2x
   * dlm string `emoji` itu sendiri, mis. '🍓🍓', krn renderer `'proximity'`
   * cuma menaruh `emoji` mentah di DOM, otomatis tampil 2 item). Dari domain
   * Vocab `kenal-warna` (Colors) — tiap warna dipasangkan benda konkret yg
   * wajar jamak, warna itu sendiri TETAP SAMA di kedua bentuk (formA/formB)
   * supaya tidak jadi sinyal kedua yg bocor — SATU-SATUNYA pembeda kalimat
   * cuma "These"/"Those".
   */
  {
    id: 'ini-itu-jamak',
    title: 'Ini-ini atau Itu-itu? (These or Those?)',
    desc: '10 kata',
    contrastVisual: 'proximity',
    items: [
      { en: 'Red Strawberries', id: 'Stroberi Merah', emoji: '🍓🍓', formA: { en: 'These strawberries are red.', id: 'Ini stroberi-stroberi merah.' }, formB: { en: 'Those strawberries are red.', id: 'Itu stroberi-stroberi merah.' } },
      { en: 'Blue Balloons', id: 'Balon Biru', emoji: '🎈🎈', formA: { en: 'These balloons are blue.', id: 'Ini balon-balon biru.' }, formB: { en: 'Those balloons are blue.', id: 'Itu balon-balon biru.' } },
      { en: 'Yellow Stars', id: 'Bintang Kuning', emoji: '⭐⭐', formA: { en: 'These stars are yellow.', id: 'Ini bintang-bintang kuning.' }, formB: { en: 'Those stars are yellow.', id: 'Itu bintang-bintang kuning.' } },
      { en: 'Green Leaves', id: 'Daun Hijau', emoji: '🍃🍃', formA: { en: 'These leaves are green.', id: 'Ini daun-daun hijau.' }, formB: { en: 'Those leaves are green.', id: 'Itu daun-daun hijau.' } },
      { en: 'Orange Carrots', id: 'Wortel Oranye', emoji: '🥕🥕', formA: { en: 'These carrots are orange.', id: 'Ini wortel-wortel oranye.' }, formB: { en: 'Those carrots are orange.', id: 'Itu wortel-wortel oranye.' } },
      { en: 'Purple Grapes', id: 'Anggur Ungu', emoji: '🍇🍇', formA: { en: 'These grapes are purple.', id: 'Ini anggur-anggur ungu.' }, formB: { en: 'Those grapes are purple.', id: 'Itu anggur-anggur ungu.' } },
      { en: 'Pink Flowers', id: 'Bunga Merah Muda', emoji: '🌸🌸', formA: { en: 'These flowers are pink.', id: 'Ini bunga-bunga merah muda.' }, formB: { en: 'Those flowers are pink.', id: 'Itu bunga-bunga merah muda.' } },
      { en: 'Black Hats', id: 'Topi Hitam', emoji: '🎩🎩', formA: { en: 'These hats are black.', id: 'Ini topi-topi hitam.' }, formB: { en: 'Those hats are black.', id: 'Itu topi-topi hitam.' } },
      { en: 'White Clouds', id: 'Awan Putih', emoji: '☁️☁️', formA: { en: 'These clouds are white.', id: 'Ini awan-awan putih.' }, formB: { en: 'Those clouds are white.', id: 'Itu awan-awan putih.' } },
      { en: 'Brown Bears', id: 'Beruang Cokelat', emoji: '🐻🐻', formA: { en: 'These bears are brown.', id: 'Ini beruang-beruang cokelat.' }, formB: { en: 'Those bears are brown.', id: 'Itu beruang-beruang cokelat.' } },
    ],
  },
  /**
   * Topik ke-10 — eksistensi negatif "there is (a)/there is no", kategori
   * Starters resmi SAMA dgn `ada-apa-di-sini` Starter (there is/are) tapi
   * sub-skill beda: NEGASI keberadaan, bukan jumlah tunggal-vs-jamak — jauh
   * lebih dekat ke cara anak kecil sungguhan memperoleh bahasa ("tidak
   * ada ___!" duluan drpd bentuk jamak). `contrastVisual: 'polarity'`
   * (REUSE — BUKAN `'quantity'`, krn yg diuji eksistensi, bukan hitungan).
   * Dari domain Vocab `hewan-peliharaan` (Pets & Farm Animals) — framing
   * petak umpet natural. Satu-satunya pembeda kalimat: "a"/"no".
   */
  {
    id: 'ada-tidak-ada',
    title: 'Ada atau Tidak Ada? (There Is / There Is No)',
    desc: '10 kata',
    contrastVisual: 'polarity',
    items: [
      { en: 'Dog', id: 'Anjing', emoji: '🐶', formA: { en: 'There is a dog.', id: 'Ada anjing.' }, formB: { en: 'There is no dog.', id: 'Tidak ada anjing.' } },
      { en: 'Cat', id: 'Kucing', emoji: '🐱', formA: { en: 'There is a cat.', id: 'Ada kucing.' }, formB: { en: 'There is no cat.', id: 'Tidak ada kucing.' } },
      { en: 'Fish', id: 'Ikan', emoji: '🐟', formA: { en: 'There is a fish.', id: 'Ada ikan.' }, formB: { en: 'There is no fish.', id: 'Tidak ada ikan.' } },
      { en: 'Bird', id: 'Burung', emoji: '🐦', formA: { en: 'There is a bird.', id: 'Ada burung.' }, formB: { en: 'There is no bird.', id: 'Tidak ada burung.' } },
      { en: 'Cow', id: 'Sapi', emoji: '🐄', formA: { en: 'There is a cow.', id: 'Ada sapi.' }, formB: { en: 'There is no cow.', id: 'Tidak ada sapi.' } },
      { en: 'Duck', id: 'Bebek', emoji: '🦆', formA: { en: 'There is a duck.', id: 'Ada bebek.' }, formB: { en: 'There is no duck.', id: 'Tidak ada bebek.' } },
      { en: 'Horse', id: 'Kuda', emoji: '🐴', formA: { en: 'There is a horse.', id: 'Ada kuda.' }, formB: { en: 'There is no horse.', id: 'Tidak ada kuda.' } },
      { en: 'Sheep', id: 'Domba', emoji: '🐑', formA: { en: 'There is a sheep.', id: 'Ada domba.' }, formB: { en: 'There is no sheep.', id: 'Tidak ada domba.' } },
      { en: 'Pig', id: 'Babi', emoji: '🐷', formA: { en: 'There is a pig.', id: 'Ada babi.' }, formB: { en: 'There is no pig.', id: 'Tidak ada babi.' } },
      { en: 'Rabbit', id: 'Kelinci', emoji: '🐰', formA: { en: 'There is a rabbit.', id: 'Ada kelinci.' }, formB: { en: 'There is no rabbit.', id: 'Tidak ada kelinci.' } },
    ],
  },
];

/**
 * Grammar Starter (5–7 th) — REUSE PERSIS format KEDUA `GrammarPatternTopic`
 * (types.ts) yang sama dgn Little Stars, TANPA mekanik baru (riset per-level,
 * `materi/grammar.md` §9, konsisten pola Reading Starter "perluasan langsung
 * dari format Little Stars"). Struktur BEDA dari Little Stars supaya bukan
 * cuma pengulangan: **present simple positive vs negative** ("I like
 * drawing." / "I don't like drawing.") — struktur inti Cambridge Starters
 * yang belum diklaim topik Little Stars manapun. `contrastVisual: 'polarity'`
 * (BARU, types.ts) — kartu jumlah 1-vs-2 Little Stars tidak relevan di sini
 * (bukan soal jumlah), diganti lencana ✅/❌ suka-tidak-suka.
 *
 * Dipetakan dari `VOCAB_TOPICS_STARTER` `hobi` (My Hobbies) — SEMUA 10 kata
 * SUDAH berbentuk gerund + py `example.en` "I like [hobi]." sendiri (mis.
 * `{ en: 'Drawing', example: { en: 'I like drawing.' } }`), jadi pola
 * suka/tidak-suka ini genuinely native ke domain-nya, bukan dipaksakan.
 */
export const GRAMMAR_TOPICS_STARTER: GrammarPatternTopic[] = [
  {
    id: 'suka-tidak-suka',
    title: 'Suka atau Tidak Suka? (Like It or Not?)',
    desc: '10 kata',
    contrastVisual: 'polarity',
    items: [
      { en: 'Drawing', id: 'Menggambar', emoji: '🎨', formA: { en: 'I like drawing.', id: 'Aku suka menggambar.' }, formB: { en: "I don't like drawing.", id: 'Aku tidak suka menggambar.' } },
      { en: 'Singing', id: 'Bernyanyi', emoji: '🎤', formA: { en: 'I like singing.', id: 'Aku suka bernyanyi.' }, formB: { en: "I don't like singing.", id: 'Aku tidak suka bernyanyi.' } },
      { en: 'Reading', id: 'Membaca', emoji: '📖', formA: { en: 'I like reading.', id: 'Aku suka membaca.' }, formB: { en: "I don't like reading.", id: 'Aku tidak suka membaca.' } },
      { en: 'Painting', id: 'Melukis', emoji: '🖌️', formA: { en: 'I like painting.', id: 'Aku suka melukis.' }, formB: { en: "I don't like painting.", id: 'Aku tidak suka melukis.' } },
      { en: 'Cooking', id: 'Memasak', emoji: '🍳', formA: { en: 'I like cooking.', id: 'Aku suka memasak.' }, formB: { en: "I don't like cooking.", id: 'Aku tidak suka memasak.' } },
      { en: 'Camping', id: 'Berkemah', emoji: '⛺', formA: { en: 'I like camping.', id: 'Aku suka berkemah.' }, formB: { en: "I don't like camping.", id: 'Aku tidak suka berkemah.' } },
      { en: 'Fishing', id: 'Memancing', emoji: '🎣', formA: { en: 'I like fishing.', id: 'Aku suka memancing.' }, formB: { en: "I don't like fishing.", id: 'Aku tidak suka memancing.' } },
      { en: 'Gardening', id: 'Berkebun', emoji: '🌱', formA: { en: 'I like gardening.', id: 'Aku suka berkebun.' }, formB: { en: "I don't like gardening.", id: 'Aku tidak suka berkebun.' } },
      { en: 'Collecting', id: 'Mengoleksi', emoji: '🪙', formA: { en: 'I like collecting coins.', id: 'Aku suka mengoleksi koin.' }, formB: { en: "I don't like collecting coins.", id: 'Aku tidak suka mengoleksi koin.' } },
      { en: 'Building', id: 'Membangun', emoji: '🧱', formA: { en: 'I like building.', id: 'Aku suka membangun.' }, formB: { en: "I don't like building.", id: 'Aku tidak suka membangun.' } },
    ],
  },
  /**
   * Topik 2 (riset lanjutan "genapkan Grammar bertahap per level", `materi/
   * grammar.md` §14) — "there is/there are" utk keberadaan, struktur RESMI
   * Cambridge Pre-A1 Starters, dikonfirmasi jg oleh materi kelas 2 SD
   * Indonesia (Kurikulum Merdeka Fase A). `contrastVisual: 'quantity'`
   * (REUSE PERSIS, TANPA kode baru) — strukturnya singular-vs-plural yang
   * SAMA dgn `satu-banyak` Little Stars, cuma frame kalimatnya beda ("there
   * is/are" vs "it's/they're"). Dipetakan dari `VOCAB_TOPICS_STARTER`
   * `serangga` (Insects, belum diklaim topik lain). Lokasi "here" DIBUAT
   * KONSTAN di semua item (bukan divariasikan per serangga) — kalau
   * lokasinya beda-beda per item, itu jadi sinyal kedua yang bocor,
   * pelajaran yang sama dgn §8/§13.
   */
  {
    id: 'ada-apa-di-sini',
    title: 'Ada Apa di Sini? (There Is or There Are?)',
    desc: '10 kata',
    contrastVisual: 'quantity',
    items: [
      { en: 'Butterfly', id: 'Kupu-kupu', emoji: '🦋', formA: { en: 'There is a butterfly here.', id: 'Ada satu kupu-kupu di sini.' }, formB: { en: 'There are butterflies here.', id: 'Ada banyak kupu-kupu di sini.' } },
      { en: 'Bee', id: 'Lebah', emoji: '🐝', formA: { en: 'There is a bee here.', id: 'Ada satu lebah di sini.' }, formB: { en: 'There are bees here.', id: 'Ada banyak lebah di sini.' } },
      { en: 'Ant', id: 'Semut', emoji: '🐜', formA: { en: 'There is an ant here.', id: 'Ada satu semut di sini.' }, formB: { en: 'There are ants here.', id: 'Ada banyak semut di sini.' } },
      { en: 'Ladybug', id: 'Kepik', emoji: '🐞', formA: { en: 'There is a ladybug here.', id: 'Ada satu kepik di sini.' }, formB: { en: 'There are ladybugs here.', id: 'Ada banyak kepik di sini.' } },
      { en: 'Spider', id: 'Laba-laba', emoji: '🕷️', formA: { en: 'There is a spider here.', id: 'Ada satu laba-laba di sini.' }, formB: { en: 'There are spiders here.', id: 'Ada banyak laba-laba di sini.' } },
      { en: 'Snail', id: 'Siput', emoji: '🐌', formA: { en: 'There is a snail here.', id: 'Ada satu siput di sini.' }, formB: { en: 'There are snails here.', id: 'Ada banyak siput di sini.' } },
      { en: 'Frog', id: 'Katak', emoji: '🐸', formA: { en: 'There is a frog here.', id: 'Ada satu katak di sini.' }, formB: { en: 'There are frogs here.', id: 'Ada banyak katak di sini.' } },
      { en: 'Turtle', id: 'Kura-kura', emoji: '🐢', formA: { en: 'There is a turtle here.', id: 'Ada satu kura-kura di sini.' }, formB: { en: 'There are turtles here.', id: 'Ada banyak kura-kura di sini.' } },
      { en: 'Crab', id: 'Kepiting', emoji: '🦀', formA: { en: 'There is a crab here.', id: 'Ada satu kepiting di sini.' }, formB: { en: 'There are crabs here.', id: 'Ada banyak kepiting di sini.' } },
      { en: 'Worm', id: 'Cacing', emoji: '🪱', formA: { en: 'There is a worm here.', id: 'Ada satu cacing di sini.' }, formB: { en: 'There are worms here.', id: 'Ada banyak cacing di sini.' } },
    ],
  },
  /**
   * Topik 3 — possessive adjective his/her, struktur RESMI Cambridge Pre-A1
   * Starters ("His name is Bill."). `contrastVisual: 'character'` (BARU,
   * types.ts) — proxy KARAKTER (lencana 👦 vs 👧), BUKAN jumlah/polaritas/
   * jarak/ukuran spt 4 varian sebelumnya. Dipetakan dari
   * `VOCAB_TOPICS_STARTER` `barang-di-rumah` (Things at Home, belum diklaim
   * topik lain) — semua 10 kata benda fisik yg wajar "dimiliki". `id` pakai
   * "kakak laki-laki"/"kakak perempuan" (BUKAN "dia", yg netral gender di
   * Indonesia — tidak py padanan his/her) supaya teks Indonesia TETAP py
   * sinyal gender yg jelas, selaras dgn lencana gambar.
   */
  {
    id: 'miliknya-siapa',
    title: 'Miliknya Siapa? (His or Hers?)',
    desc: '10 kata',
    contrastVisual: 'character',
    items: [
      { en: 'Table', id: 'Meja', emoji: '🍽️', formA: { en: 'This is his table.', id: 'Ini meja milik kakak laki-laki.' }, formB: { en: 'This is her table.', id: 'Ini meja milik kakak perempuan.' } },
      { en: 'Bed', id: 'Tempat Tidur', emoji: '🛏️', formA: { en: 'This is his bed.', id: 'Ini tempat tidur milik kakak laki-laki.' }, formB: { en: 'This is her bed.', id: 'Ini tempat tidur milik kakak perempuan.' } },
      { en: 'Sofa', id: 'Sofa', emoji: '🛋️', formA: { en: 'This is his sofa.', id: 'Ini sofa milik kakak laki-laki.' }, formB: { en: 'This is her sofa.', id: 'Ini sofa milik kakak perempuan.' } },
      { en: 'Lamp', id: 'Lampu', emoji: '💡', formA: { en: 'This is his lamp.', id: 'Ini lampu milik kakak laki-laki.' }, formB: { en: 'This is her lamp.', id: 'Ini lampu milik kakak perempuan.' } },
      { en: 'Television', id: 'Televisi', emoji: '📺', formA: { en: 'This is his television.', id: 'Ini televisi milik kakak laki-laki.' }, formB: { en: 'This is her television.', id: 'Ini televisi milik kakak perempuan.' } },
      { en: 'Fridge', id: 'Kulkas', emoji: '🧊', formA: { en: 'This is his fridge.', id: 'Ini kulkas milik kakak laki-laki.' }, formB: { en: 'This is her fridge.', id: 'Ini kulkas milik kakak perempuan.' } },
      { en: 'Mirror', id: 'Cermin', emoji: '🪞', formA: { en: 'This is his mirror.', id: 'Ini cermin milik kakak laki-laki.' }, formB: { en: 'This is her mirror.', id: 'Ini cermin milik kakak perempuan.' } },
      { en: 'Phone', id: 'Telepon', emoji: '📱', formA: { en: 'This is his phone.', id: 'Ini telepon milik kakak laki-laki.' }, formB: { en: 'This is her phone.', id: 'Ini telepon milik kakak perempuan.' } },
      { en: 'Cupboard', id: 'Lemari', emoji: '🗄️', formA: { en: 'This is his cupboard.', id: 'Ini lemari milik kakak laki-laki.' }, formB: { en: 'This is her cupboard.', id: 'Ini lemari milik kakak perempuan.' } },
      { en: 'Broom', id: 'Sapu', emoji: '🧹', formA: { en: 'This is his broom.', id: 'Ini sapu milik kakak laki-laki.' }, formB: { en: 'This is her broom.', id: 'Ini sapu milik kakak perempuan.' } },
    ],
  },
  /**
   * Topik 4 — subject pronoun he/she + present simple 3rd-person agreement,
   * struktur RESMI Cambridge Pre-A1 Starters (mis. "Anna ___ a cat."/personal
   * pronouns). `contrastVisual: 'character'` (REUSE PERSIS topik 3, lencana
   * 👦/👧 sama) — SENGAJA "he vs she" (BUKAN "I vs she") supaya lencana
   * karakter tetap konsisten bermakna org KETIGA di kedua bentuk (kalau
   * formA "I", lencana 👦 utk "aku" jadi tidak masuk akal krn "aku" tidak
   * py gender tetap). Kata kerja tiap item SELALU "+s" di KEDUA bentuk
   * (he/she sama-sama org ketiga tunggal) — satu-satunya pembeda kalimat
   * PERSIS "he"/"she", bukan bentuk kata kerja. Dipetakan dari
   * `VOCAB_TOPICS_STARTER` `alam-sekitar` (Nature, belum diklaim topik
   * lain), kata kerja per item divariasikan (see/watch/climb/smell/sit/
   * swim/find) mengikuti kewajaran tiap benda alam, bukan 1 kata kerja
   * diulang 10x.
   */
  {
    id: 'dia-siapa',
    title: 'Dia Laki-laki atau Perempuan? (He or She?)',
    desc: '10 kata',
    contrastVisual: 'character',
    items: [
      { en: 'Sun', id: 'Matahari', emoji: '☀️', formA: { en: 'He sees the sun.', id: 'Kakak laki-laki melihat mataharinya.' }, formB: { en: 'She sees the sun.', id: 'Kakak perempuan melihat mataharinya.' } },
      { en: 'Moon', id: 'Bulan', emoji: '🌙', formA: { en: 'He sees the moon.', id: 'Kakak laki-laki melihat bulannya.' }, formB: { en: 'She sees the moon.', id: 'Kakak perempuan melihat bulannya.' } },
      { en: 'Sky', id: 'Langit', emoji: '🌤️', formA: { en: 'He watches the sky.', id: 'Kakak laki-laki memandangi langitnya.' }, formB: { en: 'She watches the sky.', id: 'Kakak perempuan memandangi langitnya.' } },
      { en: 'Cloud', id: 'Awan', emoji: '☁️', formA: { en: 'He sees the cloud.', id: 'Kakak laki-laki melihat awannya.' }, formB: { en: 'She sees the cloud.', id: 'Kakak perempuan melihat awannya.' } },
      { en: 'Tree', id: 'Pohon', emoji: '🌳', formA: { en: 'He climbs the tree.', id: 'Kakak laki-laki memanjat pohonnya.' }, formB: { en: 'She climbs the tree.', id: 'Kakak perempuan memanjat pohonnya.' } },
      { en: 'Flower', id: 'Bunga', emoji: '🌸', formA: { en: 'He smells the flower.', id: 'Kakak laki-laki mencium bunganya.' }, formB: { en: 'She smells the flower.', id: 'Kakak perempuan mencium bunganya.' } },
      { en: 'Grass', id: 'Rumput', emoji: '🌿', formA: { en: 'He sits on the grass.', id: 'Kakak laki-laki duduk di rumputnya.' }, formB: { en: 'She sits on the grass.', id: 'Kakak perempuan duduk di rumputnya.' } },
      { en: 'River', id: 'Sungai', emoji: '🌊', formA: { en: 'He swims in the river.', id: 'Kakak laki-laki berenang di sungainya.' }, formB: { en: 'She swims in the river.', id: 'Kakak perempuan berenang di sungainya.' } },
      { en: 'Stone', id: 'Batu', emoji: '🪨', formA: { en: 'He finds the stone.', id: 'Kakak laki-laki menemukan batunya.' }, formB: { en: 'She finds the stone.', id: 'Kakak perempuan menemukan batunya.' } },
      { en: 'Star', id: 'Bintang', emoji: '⭐', formA: { en: 'He sees the star.', id: 'Kakak laki-laki melihat bintangnya.' }, formB: { en: 'She sees the star.', id: 'Kakak perempuan melihat bintangnya.' } },
    ],
  },
  /**
   * 5 topik lanjutan (riset per-level, `materi/grammar.md` §21) — pola SAMA
   * dgn Little Stars §20 (sekali kategori "bersih" Cambridge Pre-A1 Starters
   * habis, cari struktur/person/nomor baru DI DALAM kategori yg SUDAH
   * tersentuh struktur LAIN, bukan padding tanpa arah). **1 kandidat riset
   * DIJATUHKAN sesi ini** ("some/any" quantifier, mis. "I've got some
   * cake."/"I haven't got any cake.") — audit menemukan strukturnya SELALU
   * terikat pada polaritas have-got/haven't-got scr gramatikal (some/any
   * TIDAK BISA bebas ditukar sambil mempertahankan polaritas tetap), jadi
   * kalimatnya py 2 SINYAL beda (have-got/haven't-got DAN some/any) bukan 1
   * — anak bisa jawab benar 100% cuma dari sinyal have-got yg SUDAH
   * dikuasai sejak `punya-tidak-punya` Little Stars, tanpa pernah perlu
   * memperhatikan some/any sama sekali — PERSIS pelajaran numeral-leak §8,
   * jadi DIJATUHKAN drpd dipaksakan (Starter sekarang 4→9, BUKAN 4→10 —
   * dilaporkan jujur ke user, bukan padding dgn topik lemah).
   */
  /**
   * Topik ke-5 — locative adverb "here/there", KELAS KATA beda dari `ini-itu`
   * (Little Stars, demonstrative PRONOUN this/that) — Cambridge Pre-A1
   * Starters mendaftar keduanya sbg entri terpisah di bawah Adverbs of
   * Place. `contrastVisual: 'proximity'` REUSE PERSIS (metafora jarak
   * dekat/jauh yg sama). Dari domain Vocab `tempat-di-sekitar` (Places
   * Around Us).
   */
  {
    id: 'di-sini-di-sana',
    title: 'Di Sini atau Di Sana? (Here or There?)',
    desc: '10 kata',
    contrastVisual: 'proximity',
    items: [
      { en: 'Park', id: 'Taman', emoji: '🏞️', formA: { en: 'The park is here.', id: 'Tamannya ada di sini.' }, formB: { en: 'The park is there.', id: 'Tamannya ada di sana.' } },
      { en: 'Zoo', id: 'Kebun Binatang', emoji: '🦓', formA: { en: 'The zoo is here.', id: 'Kebun binatangnya ada di sini.' }, formB: { en: 'The zoo is there.', id: 'Kebun binatangnya ada di sana.' } },
      { en: 'Beach', id: 'Pantai', emoji: '🏖️', formA: { en: 'The beach is here.', id: 'Pantainya ada di sini.' }, formB: { en: 'The beach is there.', id: 'Pantainya ada di sana.' } },
      { en: 'Market', id: 'Pasar', emoji: '🛒', formA: { en: 'The market is here.', id: 'Pasarnya ada di sini.' }, formB: { en: 'The market is there.', id: 'Pasarnya ada di sana.' } },
      { en: 'Hospital', id: 'Rumah Sakit', emoji: '🏥', formA: { en: 'The hospital is here.', id: 'Rumah sakitnya ada di sini.' }, formB: { en: 'The hospital is there.', id: 'Rumah sakitnya ada di sana.' } },
      { en: 'Farm', id: 'Ladang', emoji: '🚜', formA: { en: 'The farm is here.', id: 'Ladangnya ada di sini.' }, formB: { en: 'The farm is there.', id: 'Ladangnya ada di sana.' } },
      { en: 'Bridge', id: 'Jembatan', emoji: '🌉', formA: { en: 'The bridge is here.', id: 'Jembatannya ada di sini.' }, formB: { en: 'The bridge is there.', id: 'Jembatannya ada di sana.' } },
      { en: 'Playground', id: 'Taman Bermain', emoji: '🛝', formA: { en: 'The playground is here.', id: 'Taman bermainnya ada di sini.' }, formB: { en: 'The playground is there.', id: 'Taman bermainnya ada di sana.' } },
      { en: 'Street', id: 'Jalan', emoji: '🛣️', formA: { en: 'The street is here.', id: 'Jalannya ada di sini.' }, formB: { en: 'The street is there.', id: 'Jalannya ada di sana.' } },
      { en: 'Mountain', id: 'Gunung', emoji: '⛰️', formA: { en: 'The mountain is here.', id: 'Gunungnya ada di sini.' }, formB: { en: 'The mountain is there.', id: 'Gunungnya ada di sana.' } },
    ],
  },
  /**
   * Topik ke-6 — subject pronoun PLURAL "we/they", struktur RESMI Cambridge
   * Pre-A1 Starters yg belum pernah dilatih (`character` Starter cuma
   * TUNGGAL org ketiga he/she; `pronouns` Explorer cuma "I"). `contrastVisual:
   * 'inclusion'` (BARU, types.ts — lencana 🙋 "Kita" vs 👉 "Mereka", proxy
   * GRUP TERMASUK vs DI LUAR pembicara). Dari domain Vocab
   * `orang-di-sekitarku` (People Around Me). Kata kerja "are" TETAP SAMA di
   * kedua bentuk (org ketiga jamak, sama spt org pertama jamak) — satu-
   * satunya pembeda kalimat PERSIS "we"/"they".
   */
  {
    id: 'kita-mereka',
    title: 'Kita atau Mereka? (We or They?)',
    desc: '10 kata',
    contrastVisual: 'inclusion',
    items: [
      { en: 'Neighbor', id: 'Tetangga', emoji: '🏘️', formA: { en: 'We are neighbors.', id: 'Kami bertetangga.' }, formB: { en: 'They are neighbors.', id: 'Mereka bertetangga.' } },
      { en: 'Classmate', id: 'Teman Sekelas', emoji: '🧑‍🎓', formA: { en: 'We are classmates.', id: 'Kami teman sekelas.' }, formB: { en: 'They are classmates.', id: 'Mereka teman sekelas.' } },
      { en: 'Boy', id: 'Anak Laki-laki', emoji: '👦', formA: { en: 'We are boys.', id: 'Kami anak laki-laki.' }, formB: { en: 'They are boys.', id: 'Mereka anak laki-laki.' } },
      { en: 'Girl', id: 'Anak Perempuan', emoji: '👧', formA: { en: 'We are girls.', id: 'Kami anak perempuan.' }, formB: { en: 'They are girls.', id: 'Mereka anak perempuan.' } },
      { en: 'Cousin', id: 'Sepupu', emoji: '🧑', formA: { en: 'We are cousins.', id: 'Kami sepupu.' }, formB: { en: 'They are cousins.', id: 'Mereka sepupu.' } },
      { en: 'Sibling', id: 'Saudara Kandung', emoji: '🧒', formA: { en: 'We are siblings.', id: 'Kami bersaudara.' }, formB: { en: 'They are siblings.', id: 'Mereka bersaudara.' } },
      { en: 'Baby', id: 'Bayi', emoji: '👶', formA: { en: 'We are babies.', id: 'Kami bayi.' }, formB: { en: 'They are babies.', id: 'Mereka bayi.' } },
      { en: 'Driver', id: 'Supir', emoji: '🚕', formA: { en: 'We are drivers.', id: 'Kami supir.' }, formB: { en: 'They are drivers.', id: 'Mereka supir.' } },
      { en: 'Best Friend', id: 'Sahabat', emoji: '🤝', formA: { en: 'We are best friends.', id: 'Kami sahabat.' }, formB: { en: 'They are best friends.', id: 'Mereka sahabat.' } },
      { en: 'Twin', id: 'Anak Kembar', emoji: '👯', formA: { en: 'We are twins.', id: 'Kami anak kembar.' }, formB: { en: 'They are twins.', id: 'Mereka anak kembar.' } },
    ],
  },
  /**
   * Topik ke-7 — imperatif positif/negatif ("Jump!"/"Don't jump!"), struktur
   * RESMI Cambridge Pre-A1 Starters (verb list), belum pernah dilatih di
   * level manapun (Explorer cuma py `lets-suggestion`/`can-requests`, BUKAN
   * perintah polos). `contrastVisual: 'polarity'` REUSE — lencana ✅/❌
   * dibaca sbg "boleh/dilarang" (metafora rambu, bukan status ya/tidak),
   * tetap intuitif utk perintah. Kosakata BUKAN dipetakan ke 1 domain Vocab
   * (BESPOKE, pola sama Explorer's topik generik awal `this-is`/`there-is`/
   * `pronouns` yg jg tanpa domain) — dicoba pakai domain `di-sekolah` dulu,
   * TAPI menegasikan instruksi otoritas ("jangan dengarkan gurumu") atau
   * relasi sosial ("jangan main dgn temanmu") melanggar filter kid-friendly
   * CLAUDE.md, jadi diganti kosakata TPR ("Listen and do") standar Cambridge
   * yg netral scr sosial (lompat/lari/duduk/dst).
   */
  {
    id: 'lakukan-jangan-lakukan',
    title: "Lakukan atau Jangan? (Do It or Don't?)",
    desc: '10 kata',
    contrastVisual: 'polarity',
    items: [
      { en: 'Jump', id: 'Lompat', emoji: '🤸', formA: { en: 'Jump!', id: 'Lompat!' }, formB: { en: "Don't jump!", id: 'Jangan lompat!' } },
      { en: 'Run', id: 'Lari', emoji: '🏃', formA: { en: 'Run!', id: 'Lari!' }, formB: { en: "Don't run!", id: 'Jangan lari!' } },
      { en: 'Sit Down', id: 'Duduk', emoji: '🪑', formA: { en: 'Sit down!', id: 'Duduk!' }, formB: { en: "Don't sit down!", id: 'Jangan duduk!' } },
      { en: 'Stand Up', id: 'Berdiri', emoji: '🧍', formA: { en: 'Stand up!', id: 'Berdiri!' }, formB: { en: "Don't stand up!", id: 'Jangan berdiri!' } },
      { en: 'Clap', id: 'Tepuk Tangan', emoji: '👏', formA: { en: 'Clap your hands!', id: 'Tepuk tanganmu!' }, formB: { en: "Don't clap your hands!", id: 'Jangan tepuk tanganmu!' } },
      { en: 'Open the Door', id: 'Buka Pintu', emoji: '🚪', formA: { en: 'Open the door!', id: 'Buka pintunya!' }, formB: { en: "Don't open the door!", id: 'Jangan buka pintunya!' } },
      { en: 'Close the Window', id: 'Tutup Jendela', emoji: '🪟', formA: { en: 'Close the window!', id: 'Tutup jendelanya!' }, formB: { en: "Don't close the window!", id: 'Jangan tutup jendelanya!' } },
      { en: 'Wash Your Hands', id: 'Cuci Tangan', emoji: '🧼', formA: { en: 'Wash your hands!', id: 'Cuci tanganmu!' }, formB: { en: "Don't wash your hands!", id: 'Jangan cuci tanganmu!' } },
      { en: 'Touch It', id: 'Sentuh Itu', emoji: '🤚', formA: { en: 'Touch it!', id: 'Sentuh itu!' }, formB: { en: "Don't touch it!", id: 'Jangan sentuh itu!' } },
      { en: 'Write Your Name', id: 'Tulis Namamu', emoji: '✍️', formA: { en: 'Write your name!', id: 'Tulis namamu!' }, formB: { en: "Don't write your name!", id: 'Jangan tulis namamu!' } },
    ],
  },
  /**
   * Topik ke-8 — verb "need" positif/negatif, kata kerja BARU di
   * `'polarity'` yg belum pernah dipakai (beda dari `mau-tidak-mau` Little
   * Stars yg "want" — KEBUTUHAN vs KEINGINAN, perbedaan yg genuinely
   * bermakna utk anak usia Starter yg sedikit lebih besar drpd Little
   * Stars). Dari domain Vocab `di-sekolah` (At School).
   */
  {
    id: 'perlu-tidak-perlu',
    title: "Perlu atau Tidak Perlu? (Need or Don't Need?)",
    desc: '10 kata',
    contrastVisual: 'polarity',
    items: [
      { en: 'Coach', id: 'Pelatih', emoji: '📣', formA: { en: 'I need a coach.', id: 'Aku perlu pelatih.' }, formB: { en: "I don't need a coach.", id: 'Aku tidak perlu pelatih.' } },
      { en: 'Classroom', id: 'Ruang Kelas', emoji: '🏫', formA: { en: 'I need the classroom.', id: 'Aku perlu ruang kelas itu.' }, formB: { en: "I don't need the classroom.", id: 'Aku tidak perlu ruang kelas itu.' } },
      { en: 'Friend', id: 'Teman', emoji: '🧑‍🤝‍🧑', formA: { en: 'I need a friend.', id: 'Aku perlu teman.' }, formB: { en: "I don't need a friend.", id: 'Aku tidak perlu teman.' } },
      { en: 'Principal', id: 'Kepala Sekolah', emoji: '🧑‍💼', formA: { en: 'I need the principal.', id: 'Aku perlu kepala sekolah.' }, formB: { en: "I don't need the principal.", id: 'Aku tidak perlu kepala sekolah.' } },
      { en: 'Library', id: 'Perpustakaan', emoji: '📚', formA: { en: 'I need the library.', id: 'Aku perlu perpustakaan.' }, formB: { en: "I don't need the library.", id: 'Aku tidak perlu perpustakaan.' } },
      { en: 'Lunchbox', id: 'Kotak Bekal', emoji: '🍱', formA: { en: 'I need my lunchbox.', id: 'Aku perlu kotak bekalku.' }, formB: { en: "I don't need my lunchbox.", id: 'Aku tidak perlu kotak bekalku.' } },
      { en: 'Uniform', id: 'Seragam', emoji: '👕', formA: { en: 'I need my uniform.', id: 'Aku perlu seragamku.' }, formB: { en: "I don't need my uniform.", id: 'Aku tidak perlu seragamku.' } },
      { en: 'Bell', id: 'Bel', emoji: '🔔', formA: { en: 'I need the bell.', id: 'Aku perlu belnya.' }, formB: { en: "I don't need the bell.", id: 'Aku tidak perlu belnya.' } },
      { en: 'Homework', id: 'PR', emoji: '📓', formA: { en: 'I need my homework.', id: 'Aku perlu PR-ku.' }, formB: { en: "I don't need my homework.", id: 'Aku tidak perlu PR-ku.' } },
      { en: 'Recess', id: 'Istirahat', emoji: '🥪', formA: { en: 'I need recess.', id: 'Aku perlu istirahat.' }, formB: { en: "I don't need recess.", id: 'Aku tidak perlu istirahat.' } },
    ],
  },
  /**
   * Topik ke-9 — possessive determiner PLURAL "our/their", pasangan
   * struktural utk `kita-mereka` (subjek) di atas — persis pola `dia-siapa`
   * (subjek he/she) + `miliknya-siapa` (posesif his/her) yg SUDAH ada di
   * level ini, cuma versi PLURAL. `contrastVisual: 'inclusion'` REUSE PERSIS
   * dari topik ke-6. Dari domain Vocab `makanan-favoritku` (My Favorite
   * Food) — konteks berbagi makanan pas pesta paling natural utk "punya
   * kita" vs "punya mereka".
   */
  {
    id: 'milik-kita-milik-mereka',
    title: 'Milik Kita atau Milik Mereka? (Ours or Theirs?)',
    desc: '10 kata',
    contrastVisual: 'inclusion',
    items: [
      { en: 'Pizza', id: 'Pizza', emoji: '🍕', formA: { en: 'This is our pizza.', id: 'Ini pizza kita.' }, formB: { en: 'This is their pizza.', id: 'Ini pizza mereka.' } },
      { en: 'Burger', id: 'Burger', emoji: '🍔', formA: { en: 'This is our burger.', id: 'Ini burger kita.' }, formB: { en: 'This is their burger.', id: 'Ini burger mereka.' } },
      { en: 'Sandwich', id: 'Sandwich', emoji: '🥪', formA: { en: 'This is our sandwich.', id: 'Ini sandwich kita.' }, formB: { en: 'This is their sandwich.', id: 'Ini sandwich mereka.' } },
      { en: 'Ice Cream', id: 'Es Krim', emoji: '🍦', formA: { en: 'This is our ice cream.', id: 'Ini es krim kita.' }, formB: { en: 'This is their ice cream.', id: 'Ini es krim mereka.' } },
      { en: 'Cake', id: 'Kue', emoji: '🍰', formA: { en: 'This is our cake.', id: 'Ini kue kita.' }, formB: { en: 'This is their cake.', id: 'Ini kue mereka.' } },
      { en: 'Cookie', id: 'Biskuit', emoji: '🍪', formA: { en: 'This is our cookie.', id: 'Ini biskuit kita.' }, formB: { en: 'This is their cookie.', id: 'Ini biskuit mereka.' } },
      { en: 'Chocolate', id: 'Cokelat', emoji: '🍫', formA: { en: 'This is our chocolate.', id: 'Ini cokelat kita.' }, formB: { en: 'This is their chocolate.', id: 'Ini cokelat mereka.' } },
      { en: 'Cheese', id: 'Keju', emoji: '🧀', formA: { en: 'This is our cheese.', id: 'Ini keju kita.' }, formB: { en: 'This is their cheese.', id: 'Ini keju mereka.' } },
      { en: 'Juice', id: 'Jus', emoji: '🧃', formA: { en: 'This is our juice.', id: 'Ini jus kita.' }, formB: { en: 'This is their juice.', id: 'Ini jus mereka.' } },
      { en: 'Yogurt', id: 'Yogurt', emoji: '🥣', formA: { en: 'This is our yogurt.', id: 'Ini yogurt kita.' }, formB: { en: 'This is their yogurt.', id: 'Ini yogurt mereka.' } },
    ],
  },
  /**
   * Topik ke-10 — verb "go" positif/negatif, struktur RESMI Cambridge Pre-A1
   * Starters (present simple verb list), verb BARU di `'polarity'` yg belum
   * pernah dipakai (permintaan user langsung: "add 1 topic grammar in
   * Starter level so the total is 10" — sesi lanjutan §21, gap terakhir yg
   * sengaja belum diisi krn kandidat "some/any" dijatuhkan §21.1). SENGAJA
   * "go to + PLACE" polos (bukan "go + -ing" spt `go-plus-ing` Adventurer,
   * struktur A1 Movers yg lebih tinggi tier — di sini TETAP present simple
   * dasar, sesuai tier Pre-A1 Starter). BESPOKE tanpa domain Vocab resmi
   * (pola sama `lakukan-jangan-lakukan` di atas — 2 domain Starter yg
   * tersisa, `angka-11-20`/`hari-dalam-seminggu`, SUDAH dicek riset
   * sebelumnya & TIDAK survive utk struktur apa pun tanpa dipaksakan),
   * kosakata tempat dipilih SENGAJA beda dari `di-sini-di-sana` (Park/Zoo/
   * Beach/Market/Hospital/Farm/Bridge/Playground/Street/Mountain) supaya
   * anak tidak melihat 10 gambar yg SAMA PERSIS 2 topik berturut-turut.
   */
  {
    id: 'pergi-tidak-pergi',
    title: 'Pergi atau Tidak Pergi? (I Go / I Don\'t Go?)',
    desc: '10 kata',
    contrastVisual: 'polarity',
    items: [
      { en: 'School', id: 'Sekolah', emoji: '🏫', formA: { en: 'I go to school.', id: 'Aku pergi ke sekolah.' }, formB: { en: "I don't go to school.", id: 'Aku tidak pergi ke sekolah.' } },
      { en: 'Home', id: 'Rumah', emoji: '🏠', formA: { en: 'I go home.', id: 'Aku pulang ke rumah.' }, formB: { en: "I don't go home.", id: 'Aku tidak pulang ke rumah.' } },
      { en: 'Mall', id: 'Mal', emoji: '🛍️', formA: { en: 'I go to the mall.', id: 'Aku pergi ke mal.' }, formB: { en: "I don't go to the mall.", id: 'Aku tidak pergi ke mal.' } },
      { en: 'Swimming Pool', id: 'Kolam Renang', emoji: '🏊', formA: { en: 'I go to the swimming pool.', id: 'Aku pergi ke kolam renang.' }, formB: { en: "I don't go to the swimming pool.", id: 'Aku tidak pergi ke kolam renang.' } },
      { en: 'Dentist', id: 'Dokter Gigi', emoji: '🦷', formA: { en: 'I go to the dentist.', id: 'Aku pergi ke dokter gigi.' }, formB: { en: "I don't go to the dentist.", id: 'Aku tidak pergi ke dokter gigi.' } },
      { en: 'Cinema', id: 'Bioskop', emoji: '🎬', formA: { en: 'I go to the cinema.', id: 'Aku pergi ke bioskop.' }, formB: { en: "I don't go to the cinema.", id: 'Aku tidak pergi ke bioskop.' } },
      { en: 'Countryside', id: 'Pedesaan', emoji: '🌾', formA: { en: 'I go to the countryside.', id: 'Aku pergi ke pedesaan.' }, formB: { en: "I don't go to the countryside.", id: 'Aku tidak pergi ke pedesaan.' } },
      { en: 'Downtown', id: 'Pusat Kota', emoji: '🏙️', formA: { en: 'I go downtown.', id: 'Aku pergi ke pusat kota.' }, formB: { en: "I don't go downtown.", id: 'Aku tidak pergi ke pusat kota.' } },
      { en: "Grandma's House", id: 'Rumah Nenek', emoji: '👵', formA: { en: "I go to grandma's house.", id: 'Aku pergi ke rumah nenek.' }, formB: { en: "I don't go to grandma's house.", id: 'Aku tidak pergi ke rumah nenek.' } },
      { en: 'Gym', id: 'Pusat Kebugaran', emoji: '🏋️', formA: { en: 'I go to the gym.', id: 'Aku pergi ke pusat kebugaran.' }, formB: { en: "I don't go to the gym.", id: 'Aku tidak pergi ke pusat kebugaran.' } },
    ],
  },
];

/**
 * Grammar Achiever (11–13 th) — REUSE `GrammarTopic` LAMA (examples/scramble/
 * fill), BUKAN format baru — riset per-level (`materi/grammar.md` §9)
 * mengonfirmasi A2 Flyers (backbone Achiever) py struktur BARU "present
 * continuous VS present simple" (kontrasnya, bukan continuous doang) yang
 * masih terjawab dgn 3-bagian teks-first yang sama asal KONTENNYA dikurasi
 * sbg pasangan kontras (`examples` sengaja berpasang "every day"/"right now"
 * per aktivitas yang sama) — pola sama "Format C+ via konten, bukan mekanik
 * baru" yang sudah dipakai Achiever Reading. Dipetakan dari
 * `VOCAB_TOPICS_ACHIEVER` `kata-kerja-lanjutan` (Advanced Actions).
 */
export const GRAMMAR_TOPICS_ACHIEVER: GrammarTopic[] = [
  {
    id: 'continuous-vs-simple',
    title: 'Sedang vs Biasa Dilakukan (Present Continuous vs Simple)',
    desc: 'Kontras -ing vs Sehari-hari',
    examples: [
      { en: 'I climb the tree every day.', emoji: '🧗' },
      { en: 'I am climbing the tree right now.', emoji: '🧗' },
      { en: 'She laughs at jokes every day.', emoji: '😂' },
      { en: 'She is laughing right now.', emoji: '😂' },
    ],
    scramble: [
      { emoji: '🤸', target: ['She', 'is', 'jumping', 'right', 'now'] },
      { emoji: '📢', target: ['He', 'shouts', 'every', 'morning'] },
    ],
    fill: {
      before: ['Right', 'now', 'I', 'am'],
      after: [],
      options: [
        { word: 'laughing', emoji: '😂' },
        { word: 'crying', emoji: '😭' },
        { word: 'whispering', emoji: '🤫' },
      ],
    },
  },
  /**
   * 10 topik lanjutan (riset per-level, `materi/grammar.md` §18) — struktur
   * Cambridge A2 Flyers Handbook for Teachers (2018, tabel resmi hlm.80),
   * diverifikasi LANGSUNG dari dokumen asli (bukan cuma ringkasan pihak
   * ketiga) — semua struktur BARU yg ditambahkan Flyers di atas A1 Movers,
   * di luar `continuous-vs-simple` yg sudah ada. Kurikulum Merdeka Fase D
   * (CP resmi, diverifikasi via dokumen primer Kemendikbud, BUKAN cuma
   * parafrase blog) mengonfirmasi "future tense" & konjungsi "because/so/
   * when/but" sbg materi fase ini — mendukung `going-to-vs-will`/`so-result`
   * — TAPI "passive voice"/"relative pronouns" yg sempat diduga (riset sesi
   * sebelumnya) TERNYATA TIDAK ada di teks CP resmi Fase D, jadi relative
   * clauses & full passive voice SENGAJA TIDAK dipakai sesi ini (dicatat
   * sbg kandidat masa depan, bukan lupa — beda dari `made-of` yg memang ADA
   * di tabel resmi Flyers sbg chunk pasif terbatas). Modal `must/mustn't`
   * (juga muncul di tabel Flyers) SENGAJA DILEWATI krn sudah diklaim
   * Adventurer — `should`/`could`(saran)/`might` yg dipilih di sini semua
   * genuinely BELUM ada di level manapun. `could` di sini bermakna SARAN
   * ("You could try..."), sengaja beda makna dari `past-ability-could`
   * Adventurer (kemampuan lampau) — Cambridge sendiri mendaftar 2 makna
   * `could` sbg entri terpisah di tabelnya.
   */
  /**
   * Topik ke-2 — "Past Continuous" (Cambridge Flyers, "I was walking down
   * the road when I saw her.") — BEDA dari `present-continuous` Explorer
   * (present) & `continuous-vs-simple` di atas (kontras present). Dari
   * domain `tempat-di-kota` (Places in Town).
   */
  {
    id: 'past-continuous',
    title: 'Sedang Terjadi di Masa Lalu (Past Continuous)',
    desc: 'Was/Were + -ing',
    examples: [
      { en: 'I was walking to the bank when it started to rain.', emoji: '🏦' },
      { en: 'She was shopping at the supermarket when she saw her teacher.', emoji: '🏬' },
      { en: 'We were watching a movie at the cinema when the lights went out.', emoji: '🎬' },
    ],
    scramble: [
      { emoji: '🏦', target: ['I', 'was', 'walking', 'to', 'the', 'bank'] },
      { emoji: '🎬', target: ['We', 'were', 'watching', 'a', 'movie'] },
    ],
    fill: {
      before: ['I', 'was', 'walking', 'to', 'the'],
      after: ['when', 'it', 'started', 'to', 'rain'],
      options: [
        { word: 'library', emoji: '📚' },
        { word: 'stadium', emoji: '🏟️' },
        { word: 'airport', emoji: '✈️' },
      ],
    },
  },
  /**
   * Topik ke-3 — "Present Perfect" (Cambridge Flyers, "Have you ever been
   * to the circus?") — struktur BARU sepenuhnya, belum ada di level
   * manapun. Dari domain `hiburan-waktu-luang` (Leisure & Entertainment).
   */
  {
    id: 'present-perfect',
    title: 'Pernah atau Belum? (Present Perfect)',
    desc: "Have/Has + Kata Kerja ke-3",
    examples: [
      { en: 'I have never played chess.', emoji: '♟️' },
      { en: 'She has already watched a play at the theater.', emoji: '🎭' },
      { en: 'Have you ever ridden a roller coaster at the amusement park?', emoji: '🎡' },
    ],
    scramble: [
      { emoji: '🍣', target: ['He', 'has', 'never', 'eaten', 'sushi'] },
      { emoji: '🎭', target: ['She', 'has', 'already', 'watched', 'a', 'play'] },
    ],
    fill: {
      before: ['I', 'have', 'never', 'played'],
      after: [],
      options: [
        { word: 'tennis', emoji: '🎾' },
        { word: 'basketball', emoji: '🏀' },
        { word: 'badminton', emoji: '🏸' },
      ],
    },
  },
  /**
   * Topik ke-4 — "Going To vs Will" (Cambridge Flyers, "be going to" &
   * "will" KEDUANYA struktur baru) — dual-sourced, Kurikulum Merdeka Fase D
   * eksplisit menyebut "future tense" sbg materi fase ini. BUKAN duplikat
   * `go-plus-ing` Adventurer (idiom "pergi lalu beraktivitas", struktur
   * beda total). Dari domain `mata-pelajaran` (School Subjects). Scramble
   * SENGAJA menyertakan SATU contoh tiap bentuk (going-to DAN will) —
   * pola sama `continuous-vs-simple` di atas yg scramble-nya jg mewakili
   * kedua sisi kontras, bukan cuma satu.
   */
  {
    id: 'going-to-vs-will',
    title: 'Rencana vs Keputusan Mendadak (Going To vs Will)',
    desc: 'Kontras Going To vs Will',
    examples: [
      { en: 'I am going to study Math after school.', emoji: '🔢' },
      { en: 'She will help her friend with Science homework.', emoji: '🔬' },
      { en: 'We are going to have an English test tomorrow.', emoji: '🇬🇧' },
    ],
    scramble: [
      { emoji: '🔢', target: ['I', 'am', 'going', 'to', 'study', 'Math'] },
      { emoji: '🔬', target: ['She', 'will', 'help', 'her', 'friend'] },
    ],
    fill: {
      before: ['I', 'am', 'going', 'to', 'study'],
      after: ['after', 'school'],
      options: [
        { word: 'art', emoji: '🎨' },
        { word: 'science', emoji: '🔬' },
        { word: 'history', emoji: '📜' },
      ],
    },
  },
  /**
   * Topik ke-5 — "Should vs Could (saran)" (Cambridge Flyers, "should" BARU
   * + "could" bermakna SARAN — Cambridge mendaftar makna ini TERPISAH dari
   * "could" kemampuan lampau, jadi BUKAN duplikat `past-ability-could`
   * Adventurer walau kata sama). Dari domain `teknologi-internet`
   * (perangkat saja, tanpa medsos, konsisten batasan Vocab domain ini).
   */
  {
    id: 'should-vs-could',
    title: 'Saran & Pilihan (Should vs Could)',
    desc: 'Kontras Should vs Could',
    examples: [
      { en: 'You should charge your computer before school.', emoji: '💻' },
      { en: 'You could try a new password for your email.', emoji: '🔑' },
      { en: 'You should not look at the screen for too long.', emoji: '🖥️' },
    ],
    scramble: [
      { emoji: '💻', target: ['You', 'should', 'charge', 'your', 'computer'] },
      { emoji: '🔑', target: ['You', 'could', 'try', 'a', 'new', 'password'] },
    ],
    fill: {
      before: ['You', 'should', 'charge', 'your'],
      after: ['before', 'school'],
      options: [
        { word: 'watch', emoji: '⌚' },
        { word: 'phone', emoji: '📱' },
        { word: 'camera', emoji: '📷' },
      ],
    },
  },
  /**
   * Topik ke-6 — "Might for Possibility" (Cambridge Flyers, "Vicky might
   * come to the party.") — struktur BARU, belum ada di level manapun.
   * Dari domain `arah-posisi` (Directions & Position) — "might be
   * [posisi]" natural utk menebak lokasi.
   */
  {
    id: 'might-possibility',
    title: 'Mungkin Saja (Might for Possibility)',
    desc: 'Modal Might',
    examples: [
      { en: 'My keys might be behind the sofa.', emoji: '🛋️' },
      { en: 'The bakery might be near the corner.', emoji: '📐' },
      { en: 'She might turn left at the next street.', emoji: '⬅️' },
    ],
    scramble: [
      { emoji: '📺', target: ['The', 'remote', 'might', 'be', 'under', 'the', 'couch'] },
      { emoji: '⬅️', target: ['She', 'might', 'turn', 'left'] },
    ],
    fill: {
      before: ['She', 'might', 'turn'],
      after: ['at', 'the', 'corner'],
      options: [
        { word: 'left', emoji: '⬅️' },
        { word: 'right', emoji: '➡️' },
        { word: 'around', emoji: '🔄' },
      ],
    },
  },
  /**
   * Topik ke-7 — "Conjunction So" (Cambridge Flyers kategori Conjunctions —
   * "so") — dual-sourced, Kurikulum Merdeka Fase D py set konjungsi
   * because/so/when/but; `because-reasons` sudah diklaim Adventurer, "so"
   * (akibat, arah sebaliknya dari "because") masih kosong. Dari domain
   * `sifat-kepribadian` (Personality Traits) — sifat→akibat sosial paling
   * natural dirangkai "so".
   */
  {
    id: 'so-result',
    title: 'Jadi, Akibatnya... (Conjunction So)',
    desc: 'Sebab-Akibat dengan So',
    examples: [
      { en: 'Dio is very kind, so everyone likes him.', emoji: '🤗' },
      { en: 'She is very funny, so her friends laugh a lot.', emoji: '😂' },
      { en: 'He is very honest, so people trust him.', emoji: '🤝' },
    ],
    scramble: [
      { emoji: '🦸', target: ['Andi', 'is', 'very', 'brave', 'so', 'he', 'helps', 'others'] },
      { emoji: '🎁', target: ['Maya', 'is', 'very', 'generous', 'so', 'she', 'shares', 'her', 'toys'] },
    ],
    fill: {
      before: ['Dio', 'is', 'very'],
      after: ['so', 'everyone', 'likes', 'him'],
      options: [
        { word: 'helpful', emoji: '🙌' },
        { word: 'funny', emoji: '😂' },
        { word: 'friendly', emoji: '😊' },
      ],
    },
  },
  /**
   * Topik ke-8 — "Look Like" (Cambridge Flyers, "Be/look/sound/feel/taste/
   * smell like" — "What's your new teacher like?") — struktur BARU. Dari
   * domain `ciri-ciri-fisik` (Physical Appearance) — domain jadi PANGGUNG
   * tema kemiripan wajah/fisik, bukan sumber kata harfiah (pola sama
   * `prepositions-of-place` Explorer).
   */
  {
    id: 'look-like',
    title: 'Mirip Siapa? (Look Like)',
    desc: 'Look Like + Orang',
    examples: [
      { en: 'My brother looks like our dad.', emoji: '👨' },
      { en: 'She looks like her older sister.', emoji: '👧' },
      { en: 'The puppy looks like a little bear.', emoji: '🐻' },
    ],
    scramble: [
      { emoji: '🐯', target: ['The', 'kitten', 'looks', 'like', 'a', 'small', 'tiger'] },
      { emoji: '👴', target: ['He', 'looks', 'like', 'his', 'grandfather'] },
    ],
    fill: {
      before: ['My', 'brother', 'looks', 'like', 'our'],
      after: [],
      options: [
        { word: 'uncle', emoji: '🧔' },
        { word: 'mom', emoji: '👩' },
        { word: 'grandpa', emoji: '👴' },
      ],
    },
  },
  /**
   * Topik ke-9 — "Be Made Of" (Cambridge Flyers, "The toy is made of
   * wood.") — chunk semi-pasif TERBATAS yg memang ADA di tabel resmi
   * Flyers, BUKAN full passive voice (itu tetap di luar scope, tier
   * KET/PET). Dari domain `sifat-benda-lanjutan` (Object Qualities).
   */
  {
    id: 'made-of',
    title: 'Terbuat dari Apa? (Be Made Of)',
    desc: 'Be Made Of + Bahan',
    examples: [
      { en: 'This spoon is made of metal, so it feels hard.', emoji: '🥄' },
      { en: 'My pillow is made of cotton, so it feels soft.', emoji: '🛏️' },
      { en: 'The plate is made of glass, so it feels smooth.', emoji: '🍽️' },
    ],
    scramble: [
      { emoji: '🥄', target: ['This', 'spoon', 'is', 'made', 'of', 'metal'] },
      { emoji: '🛏️', target: ['My', 'pillow', 'is', 'made', 'of', 'cotton'] },
    ],
    fill: {
      before: ['This', 'toy', 'is', 'made', 'of'],
      after: [],
      options: [
        { word: 'wood', emoji: '🪵' },
        { word: 'plastic', emoji: '🧴' },
        { word: 'metal', emoji: '🔩' },
      ],
    },
  },
  /**
   * Topik ke-10 — "Zero Conditional" (Cambridge Flyers, "If it's sunny, we
   * go swimming.") — BEDA dari `because-reasons` Adventurer (konjungsi
   * sebab, bukan klausa if). Dari domain `kata-kerja-lanjutan` (REUSE dari
   * `continuous-vs-simple` di atas — kata kerja lanjutan natural utk
   * reaksi/kebiasaan "if X maka Y").
   */
  {
    id: 'zero-conditional',
    title: 'Kalau... Maka... (Zero Conditional)',
    desc: 'If + Present Simple',
    examples: [
      { en: 'If I climb the tree, I feel happy.', emoji: '🧗' },
      { en: 'If she hears a joke, she laughs.', emoji: '😂' },
      { en: 'If the ball comes, he catches it.', emoji: '🤲' },
    ],
    scramble: [
      { emoji: '📝', target: ['If', 'he', 'studies', 'hard', 'he', 'passes', 'the', 'test'] },
      { emoji: '☔', target: ['If', 'it', 'rains', 'we', 'stay', 'home'] },
    ],
    fill: {
      before: ['If', 'I', 'feel', 'scared,', 'I'],
      after: [],
      options: [
        { word: 'hide', emoji: '🙈' },
        { word: 'cry', emoji: '😭' },
        { word: 'shout', emoji: '📢' },
      ],
    },
  },
  /**
   * Topik ke-11 — "Many vs Much" (kategori kuantifier — Cambridge
   * mendaftar "much"/"a few"/"a little" di daftar KOSAKATA Flyers, bukan
   * tabel struktur grammar, tapi kontras countable/uncountable ini genuinely
   * konten baru di tier ini, dikonfirmasi jg pola umum ESL scope-and-
   * sequence A1→A2 British Council/Wordwall). Dari domain `angka-puluhan`
   * (Bigger Numbers) — tema hitung-menghitung jadi panggung natural.
   * Scramble menyertakan SATU contoh tiap sisi kontras (many DAN much),
   * pola sama `continuous-vs-simple`/`going-to-vs-will` di atas.
   */
  {
    id: 'many-vs-much',
    title: 'Banyak yang Bisa Dihitung vs Tidak (Many vs Much)',
    desc: 'Kontras Many vs Much',
    examples: [
      { en: 'I have many friends at school.', emoji: '👫' },
      { en: "We don't have much water left.", emoji: '💧' },
      { en: 'How many students are in your class?', emoji: '🏫' },
    ],
    scramble: [
      { emoji: '👫', target: ['I', 'have', 'many', 'friends'] },
      { emoji: '💧', target: ['We', "don't", 'have', 'much', 'water'] },
    ],
    fill: {
      before: ['I', 'have', 'many'],
      after: ['at', 'school'],
      options: [
        { word: 'lessons', emoji: '📖' },
        { word: 'books', emoji: '📚' },
        { word: 'classes', emoji: '🏫' },
      ],
    },
  },
];

/**
 * Grammar Trailblazer (12+ th, ≈B1) — format KETIGA `GrammarTransformTopic`
 * (types.ts, BARU — lihat komentar lengkap di sana). Riset per-level
 * (`materi/grammar.md` §9): struktur baru PET (passive/reported speech/
 * conditionals) diuji Cambridge sendiri lewat key-word sentence
 * transformation — task shape yang genuinely tidak bisa dijawab 2 format
 * lain, sama alasan Listening/Speaking py format ketiga sendiri di level
 * ini. **User ditanya eksplisit** ("ikuti default PRD §9 low-effort" VS
 * "bangun format baru sentence-transformation ala PET") — user PILIH bangun
 * format baru.
 *
 * Topik pertama: reported speech, DIBATASI ke kalimat PERNYATAAN present
 * simple saja (bukan pertanyaan/perintah yg py aturan beda: "asked if"/"told
 * to") — dipetakan dari `VOCAB_TOPICS_TRAILBLAZER` `bahasa-komunikasi`
 * (Language & Communication, tokoh fiktif membuat pernyataan TENTANG proses
 * belajar bahasa mereka sendiri, fit tematik langsung). Distraktor
 * `reportedOptions` menguji 3 kesalahan umum: lupa geser tense (present tdk
 * berubah), kata ganti salah, tense salah total (pakai "will").
 */
export const GRAMMAR_TOPICS_TRAILBLAZER: GrammarTransformTopic[] = [
  {
    id: 'reported-speech',
    title: 'Reported Speech — Dia Bilang…',
    desc: '10 kutipan',
    transforms: [
      {
        speaker: 'Rani',
        emoji: '✏️',
        original: 'I study grammar every day.',
        originalId: 'Aku belajar tata bahasa setiap hari.',
        reportedOptions: [
          { text: 'Rani said that she studied grammar every day.', ok: true },
          { text: 'Rani said that she studies grammar every day.', ok: false },
          { text: 'Rani said that I studied grammar every day.', ok: false },
          { text: 'Rani said that she will study grammar every day.', ok: false },
        ],
      },
      {
        speaker: 'Dimas',
        emoji: '💬',
        original: 'I am fluent in English.',
        originalId: 'Aku fasih berbahasa Inggris.',
        reportedOptions: [
          { text: 'Dimas said that he was fluent in English.', ok: true },
          { text: 'Dimas said that he is fluent in English.', ok: false },
          { text: 'Dimas said that she was fluent in English.', ok: false },
          { text: 'Dimas said that he will be fluent in English.', ok: false },
        ],
      },
      {
        speaker: 'Sari',
        emoji: '🎤',
        original: 'I have an English accent.',
        originalId: 'Aku punya aksen Inggris.',
        reportedOptions: [
          { text: 'Sari said that she had an English accent.', ok: true },
          { text: 'Sari said that she has an English accent.', ok: false },
          { text: 'Sari said that I had an English accent.', ok: false },
          { text: 'Sari said that she will have an English accent.', ok: false },
        ],
      },
      {
        speaker: 'Budi',
        emoji: '👄',
        original: 'I practice pronunciation every night.',
        originalId: 'Aku berlatih pengucapan setiap malam.',
        reportedOptions: [
          { text: 'Budi said that he practiced pronunciation every night.', ok: true },
          { text: 'Budi said that he practices pronunciation every night.', ok: false },
          { text: 'Budi said that she practiced pronunciation every night.', ok: false },
          { text: 'Budi said that he will practice pronunciation every night.', ok: false },
        ],
      },
      {
        speaker: 'Wati',
        emoji: '📖',
        original: 'I learn new vocabulary every week.',
        originalId: 'Aku belajar kosakata baru setiap minggu.',
        reportedOptions: [
          { text: 'Wati said that she learned new vocabulary every week.', ok: true },
          { text: 'Wati said that she learns new vocabulary every week.', ok: false },
          { text: 'Wati said that I learned new vocabulary every week.', ok: false },
          { text: 'Wati said that she will learn new vocabulary every week.', ok: false },
        ],
      },
      {
        speaker: 'Andi',
        emoji: '📕',
        original: 'I look up words in a dictionary.',
        originalId: 'Aku mencari kata di kamus.',
        reportedOptions: [
          { text: 'Andi said that he looked up words in a dictionary.', ok: true },
          { text: 'Andi said that he looks up words in a dictionary.', ok: false },
          { text: 'Andi said that she looked up words in a dictionary.', ok: false },
          { text: 'Andi said that he will look up words in a dictionary.', ok: false },
        ],
      },
      {
        speaker: 'Lina',
        emoji: '🌍',
        original: 'I am bilingual.',
        originalId: 'Aku dwibahasa.',
        reportedOptions: [
          { text: 'Lina said that she was bilingual.', ok: true },
          { text: 'Lina said that she is bilingual.', ok: false },
          { text: 'Lina said that he was bilingual.', ok: false },
          { text: 'Lina said that she will be bilingual.', ok: false },
        ],
      },
      {
        speaker: 'Doni',
        emoji: '🔤',
        original: 'I translate the sentence.',
        originalId: 'Aku menerjemahkan kalimat itu.',
        reportedOptions: [
          { text: 'Doni said that he translated the sentence.', ok: true },
          { text: 'Doni said that he translates the sentence.', ok: false },
          { text: 'Doni said that she translated the sentence.', ok: false },
          { text: 'Doni said that he will translate the sentence.', ok: false },
        ],
      },
      {
        speaker: 'Maya',
        emoji: '🎙️',
        original: 'I talk to a native speaker.',
        originalId: 'Aku bicara dengan penutur asli.',
        reportedOptions: [
          { text: 'Maya said that she talked to a native speaker.', ok: true },
          { text: 'Maya said that she talks to a native speaker.', ok: false },
          { text: 'Maya said that I talked to a native speaker.', ok: false },
          { text: 'Maya said that she will talk to a native speaker.', ok: false },
        ],
      },
      {
        speaker: 'Fajar',
        emoji: '🗣️',
        original: 'I work as an interpreter.',
        originalId: 'Aku bekerja sebagai penerjemah lisan.',
        reportedOptions: [
          { text: 'Fajar said that he worked as an interpreter.', ok: true },
          { text: 'Fajar said that he works as an interpreter.', ok: false },
          { text: 'Fajar said that she worked as an interpreter.', ok: false },
          { text: 'Fajar said that he will work as an interpreter.', ok: false },
        ],
      },
    ],
  },
  /**
   * 9 topik lanjutan (riset per-level, `materi/grammar.md` §19) — SEMUA
   * TETAP sub-pola "reported speech" (bukan pindah ke struktur PET lain
   * spt passive voice/conditional) krn UI Latihan Inti/Tantangan HARDCODE
   * teks "🔁 Ubah Jadi Reported Speech"/"🔎 Siapa Bilang Apa?" (`games/
   * grammar.ts`, tidak dibaca dari field topik) — topik format LAIN akan
   * salah label kalau bukan genuinely reported speech. Untungnya reported
   * speech sendiri SECARA RESMI Cambridge B1 Preliminary (PET) py banyak
   * sub-pola beda aturan (statement/question/command tiap py aturan
   * transformasi sendiri) — persis yg SUDAH diflag topik pertama sbg scope
   * masa depan ("bukan campur pertanyaan/perintah yg py aturan beda").
   * Permintaan user EKSPLISIT: "min 10" utk Grammar Trailblazer — DEVIASI
   * dari target BAKU level ini (≥5, CLAUDE.md) krn instruksi baru user,
   * pola sama persis dgn Listening Trailblazer yg jg dibangun ke 10 penuh
   * atas permintaan eksplisit. 10 karakter (Rani/Dimas/Sari/Budi/Wati/
   * Andi/Lina/Doni/Maya/Fajar) di-REUSE PERSIS sbg pemeran lintas topik
   * (SATU per kutipan per topik, bukan karakter baru) — konsisten pola
   * "Bima" Speaking Trailblazer.
   */
  /**
   * Topik ke-2 — "Reported Continuous" (present continuous → past
   * continuous, "was/were + -ing" — BEDA morfologi dari shift simple-past
   * topik pertama). Dari domain Vocab `hiburan-media` (Entertainment &
   * Media) — aktivitas hiburan natural berbentuk continuous ("sedang
   * nonton/dengar/main"). Distraktor: (1) lupa geser tense, (2) kata ganti
   * salah, (3) aspek continuous hilang (jadi simple past polos).
   */
  {
    id: 'reported-continuous',
    title: 'Reported Speech — Sedang Apa? (Continuous)',
    desc: '10 kutipan',
    transforms: [
      {
        speaker: 'Dimas',
        emoji: '🎬',
        original: 'I am watching a new anime series.',
        originalId: 'Aku sedang menonton serial anime baru.',
        reportedOptions: [
          { text: 'Dimas said that he was watching a new anime series.', ok: true },
          { text: 'Dimas said that he is watching a new anime series.', ok: false },
          { text: 'Dimas said that she was watching a new anime series.', ok: false },
          { text: 'Dimas said that he watched a new anime series.', ok: false },
        ],
      },
      {
        speaker: 'Sari',
        emoji: '🎧',
        original: 'I am listening to a podcast about music.',
        originalId: 'Aku sedang mendengarkan podcast tentang musik.',
        reportedOptions: [
          { text: 'Sari said that she was listening to a podcast about music.', ok: true },
          { text: 'Sari said that she is listening to a podcast about music.', ok: false },
          { text: 'Sari said that he was listening to a podcast about music.', ok: false },
          { text: 'Sari said that she listened to a podcast about music.', ok: false },
        ],
      },
      {
        speaker: 'Andi',
        emoji: '🎮',
        original: 'I am playing an online game with my friends.',
        originalId: 'Aku sedang main gim daring bareng teman-temanku.',
        reportedOptions: [
          { text: 'Andi said that he was playing an online game with his friends.', ok: true },
          { text: 'Andi said that he is playing an online game with his friends.', ok: false },
          { text: 'Andi said that she was playing an online game with her friends.', ok: false },
          { text: 'Andi said that he played an online game with his friends.', ok: false },
        ],
      },
      {
        speaker: 'Rani',
        emoji: '📺',
        original: 'I am watching a drama series.',
        originalId: 'Aku sedang menonton serial drama.',
        reportedOptions: [
          { text: 'Rani said that she was watching a drama series.', ok: true },
          { text: 'Rani said that she is watching a drama series.', ok: false },
          { text: 'Rani said that he was watching a drama series.', ok: false },
          { text: 'Rani said that she watched a drama series.', ok: false },
        ],
      },
      {
        speaker: 'Budi',
        emoji: '🎤',
        original: 'I am recording a new song.',
        originalId: 'Aku sedang merekam lagu baru.',
        reportedOptions: [
          { text: 'Budi said that he was recording a new song.', ok: true },
          { text: 'Budi said that he is recording a new song.', ok: false },
          { text: 'Budi said that she was recording a new song.', ok: false },
          { text: 'Budi said that he recorded a new song.', ok: false },
        ],
      },
      {
        speaker: 'Wati',
        emoji: '🎨',
        original: 'I am drawing a comic for the school magazine.',
        originalId: 'Aku sedang menggambar komik untuk majalah sekolah.',
        reportedOptions: [
          { text: 'Wati said that she was drawing a comic for the school magazine.', ok: true },
          { text: 'Wati said that she is drawing a comic for the school magazine.', ok: false },
          { text: 'Wati said that he was drawing a comic for the school magazine.', ok: false },
          { text: 'Wati said that she drew a comic for the school magazine.', ok: false },
        ],
      },
      {
        speaker: 'Lina',
        emoji: '🎥',
        original: 'I am editing a video for my vlog.',
        originalId: 'Aku sedang mengedit video untuk vlogku.',
        reportedOptions: [
          { text: 'Lina said that she was editing a video for her vlog.', ok: true },
          { text: 'Lina said that she is editing a video for her vlog.', ok: false },
          { text: 'Lina said that he was editing a video for his vlog.', ok: false },
          { text: 'Lina said that she edited a video for her vlog.', ok: false },
        ],
      },
      {
        speaker: 'Doni',
        emoji: '📖',
        original: 'I am reading a comic book.',
        originalId: 'Aku sedang membaca buku komik.',
        reportedOptions: [
          { text: 'Doni said that he was reading a comic book.', ok: true },
          { text: 'Doni said that he is reading a comic book.', ok: false },
          { text: 'Doni said that she was reading a comic book.', ok: false },
          { text: 'Doni said that he read a comic book.', ok: false },
        ],
      },
      {
        speaker: 'Maya',
        emoji: '🎶',
        original: 'I am singing karaoke with my cousins.',
        originalId: 'Aku sedang bernyanyi karaoke bareng sepupu-sepupuku.',
        reportedOptions: [
          { text: 'Maya said that she was singing karaoke with her cousins.', ok: true },
          { text: 'Maya said that she is singing karaoke with her cousins.', ok: false },
          { text: 'Maya said that he was singing karaoke with his cousins.', ok: false },
          { text: 'Maya said that she sang karaoke with her cousins.', ok: false },
        ],
      },
      {
        speaker: 'Fajar',
        emoji: '💃',
        original: 'I am dancing to my favorite song.',
        originalId: 'Aku sedang menari mengikuti lagu favoritku.',
        reportedOptions: [
          { text: 'Fajar said that he was dancing to his favorite song.', ok: true },
          { text: 'Fajar said that he is dancing to his favorite song.', ok: false },
          { text: 'Fajar said that she was dancing to her favorite song.', ok: false },
          { text: 'Fajar said that he danced to his favorite song.', ok: false },
        ],
      },
    ],
  },
  /**
   * Topik ke-3 — "Reported Past Perfect" (past simple → past perfect,
   * "had + V3" — pola shift RESMI PET utk kalimat yg sumbernya SUDAH past
   * simple, dikonfirmasi flo-joe PET practice set). Dari domain Vocab
   * `perjalanan-wisata` (Travel & Tourism) — register bercerita
   * pengalaman jalan-jalan paling natural utk struktur ini. Distraktor:
   * (1) lupa geser (tetap simple past), (2) kata ganti salah, (3) tipe
   * tense salah (continuous, bukan perfect).
   */
  {
    id: 'reported-past-perfect',
    title: 'Reported Speech — Sudah Terjadi (Past Perfect)',
    desc: '10 kutipan',
    transforms: [
      {
        speaker: 'Wati',
        emoji: '🏝️',
        original: 'I visited Lombok with my family.',
        originalId: 'Aku mengunjungi Lombok bersama keluargaku.',
        reportedOptions: [
          { text: 'Wati said that she had visited Lombok with her family.', ok: true },
          { text: 'Wati said that she visited Lombok with her family.', ok: false },
          { text: 'Wati said that he had visited Lombok with his family.', ok: false },
          { text: 'Wati said that she was visiting Lombok with her family.', ok: false },
        ],
      },
      {
        speaker: 'Fajar',
        emoji: '🎒',
        original: 'I packed my bag before the trip.',
        originalId: 'Aku mengemas tasku sebelum perjalanan.',
        reportedOptions: [
          { text: 'Fajar said that he had packed his bag before the trip.', ok: true },
          { text: 'Fajar said that he packed his bag before the trip.', ok: false },
          { text: 'Fajar said that she had packed her bag before the trip.', ok: false },
          { text: 'Fajar said that he was packing his bag before the trip.', ok: false },
        ],
      },
      {
        speaker: 'Maya',
        emoji: '📸',
        original: 'I took many photos at the waterfall.',
        originalId: 'Aku mengambil banyak foto di air terjun itu.',
        reportedOptions: [
          { text: 'Maya said that she had taken many photos at the waterfall.', ok: true },
          { text: 'Maya said that she took many photos at the waterfall.', ok: false },
          { text: 'Maya said that he had taken many photos at the waterfall.', ok: false },
          { text: 'Maya said that she was taking many photos at the waterfall.', ok: false },
        ],
      },
      {
        speaker: 'Dimas',
        emoji: '🏔️',
        original: 'I climbed a small hill near the village.',
        originalId: 'Aku mendaki bukit kecil dekat desa itu.',
        reportedOptions: [
          { text: 'Dimas said that he had climbed a small hill near the village.', ok: true },
          { text: 'Dimas said that he climbed a small hill near the village.', ok: false },
          { text: 'Dimas said that she had climbed a small hill near the village.', ok: false },
          { text: 'Dimas said that he was climbing a small hill near the village.', ok: false },
        ],
      },
      {
        speaker: 'Sari',
        emoji: '🚆',
        original: 'I traveled by train to Yogyakarta.',
        originalId: 'Aku bepergian naik kereta ke Yogyakarta.',
        reportedOptions: [
          { text: 'Sari said that she had traveled by train to Yogyakarta.', ok: true },
          { text: 'Sari said that she traveled by train to Yogyakarta.', ok: false },
          { text: 'Sari said that he had traveled by train to Yogyakarta.', ok: false },
          { text: 'Sari said that she was traveling by train to Yogyakarta.', ok: false },
        ],
      },
      {
        speaker: 'Budi',
        emoji: '🏨',
        original: 'I booked a room at a small hotel.',
        originalId: 'Aku memesan kamar di hotel kecil.',
        reportedOptions: [
          { text: 'Budi said that he had booked a room at a small hotel.', ok: true },
          { text: 'Budi said that he booked a room at a small hotel.', ok: false },
          { text: 'Budi said that she had booked a room at a small hotel.', ok: false },
          { text: 'Budi said that he was booking a room at a small hotel.', ok: false },
        ],
      },
      {
        speaker: 'Rani',
        emoji: '🗺️',
        original: 'I explored the old town on foot.',
        originalId: 'Aku menjelajahi kota tua itu dengan berjalan kaki.',
        reportedOptions: [
          { text: 'Rani said that she had explored the old town on foot.', ok: true },
          { text: 'Rani said that she explored the old town on foot.', ok: false },
          { text: 'Rani said that he had explored the old town on foot.', ok: false },
          { text: 'Rani said that she was exploring the old town on foot.', ok: false },
        ],
      },
      {
        speaker: 'Andi',
        emoji: '⛵',
        original: 'I sailed to a small island with my uncle.',
        originalId: 'Aku berlayar ke pulau kecil bersama pamanku.',
        reportedOptions: [
          { text: 'Andi said that he had sailed to a small island with his uncle.', ok: true },
          { text: 'Andi said that he sailed to a small island with his uncle.', ok: false },
          { text: 'Andi said that she had sailed to a small island with her uncle.', ok: false },
          { text: 'Andi said that he was sailing to a small island with his uncle.', ok: false },
        ],
      },
      {
        speaker: 'Lina',
        emoji: '🍜',
        original: 'I tried the local food at the market.',
        originalId: 'Aku mencoba makanan khas di pasar itu.',
        reportedOptions: [
          { text: 'Lina said that she had tried the local food at the market.', ok: true },
          { text: 'Lina said that she tried the local food at the market.', ok: false },
          { text: 'Lina said that he had tried the local food at the market.', ok: false },
          { text: 'Lina said that she was trying the local food at the market.', ok: false },
        ],
      },
      {
        speaker: 'Doni',
        emoji: '🏕️',
        original: 'I camped near the lake for two nights.',
        originalId: 'Aku berkemah dekat danau selama dua malam.',
        reportedOptions: [
          { text: 'Doni said that he had camped near the lake for two nights.', ok: true },
          { text: 'Doni said that he camped near the lake for two nights.', ok: false },
          { text: 'Doni said that she had camped near the lake for two nights.', ok: false },
          { text: 'Doni said that he was camping near the lake for two nights.', ok: false },
        ],
      },
    ],
  },
  /**
   * Topik ke-4 — "Reported Modals" (can→could, will→would, must→had to,
   * may→might — pergeseran MODAL, bukan kata kerja utama, tabel terpisah
   * di Cambridge). Dari domain Vocab `pendapat-pengalaman` (Opinions &
   * Experience) — pernyataan kemampuan/rencana/kewajiban natural di
   * register ini. Distraktor: (1) modal tidak digeser, (2) kata ganti
   * salah, (3) modal salah (ditukar ke modal lain).
   */
  {
    id: 'reported-modals',
    title: 'Reported Speech — Bisa, Akan, Harus (Modals)',
    desc: '10 kutipan',
    transforms: [
      {
        speaker: 'Doni',
        emoji: '🎸',
        original: 'I can play the guitar.',
        originalId: 'Aku bisa main gitar.',
        reportedOptions: [
          { text: 'Doni said that he could play the guitar.', ok: true },
          { text: 'Doni said that he can play the guitar.', ok: false },
          { text: 'Doni said that she could play the guitar.', ok: false },
          { text: 'Doni said that he would play the guitar.', ok: false },
        ],
      },
      {
        speaker: 'Wati',
        emoji: '🙋',
        original: 'I will join the debate club.',
        originalId: 'Aku akan ikut klub debat.',
        reportedOptions: [
          { text: 'Wati said that she would join the debate club.', ok: true },
          { text: 'Wati said that she will join the debate club.', ok: false },
          { text: 'Wati said that he would join the debate club.', ok: false },
          { text: 'Wati said that she could join the debate club.', ok: false },
        ],
      },
      {
        speaker: 'Andi',
        emoji: '📝',
        original: 'I must submit my project by Monday.',
        originalId: 'Aku harus mengumpulkan proyekku sebelum hari Senin.',
        reportedOptions: [
          { text: 'Andi said that he had to submit his project by Monday.', ok: true },
          { text: 'Andi said that he must submit his project by Monday.', ok: false },
          { text: 'Andi said that she had to submit her project by Monday.', ok: false },
          { text: 'Andi said that he might submit his project by Monday.', ok: false },
        ],
      },
      {
        speaker: 'Lina',
        emoji: '🏊',
        original: 'I can swim across the pool.',
        originalId: 'Aku bisa berenang menyeberangi kolam itu.',
        reportedOptions: [
          { text: 'Lina said that she could swim across the pool.', ok: true },
          { text: 'Lina said that she can swim across the pool.', ok: false },
          { text: 'Lina said that he could swim across the pool.', ok: false },
          { text: 'Lina said that she would swim across the pool.', ok: false },
        ],
      },
      {
        speaker: 'Fajar',
        emoji: '🎭',
        original: 'I will perform in the school play.',
        originalId: 'Aku akan tampil di drama sekolah.',
        reportedOptions: [
          { text: 'Fajar said that he would perform in the school play.', ok: true },
          { text: 'Fajar said that he will perform in the school play.', ok: false },
          { text: 'Fajar said that she would perform in the school play.', ok: false },
          { text: 'Fajar said that he could perform in the school play.', ok: false },
        ],
      },
      {
        speaker: 'Maya',
        emoji: '📐',
        original: 'I must finish my homework before dinner.',
        originalId: 'Aku harus menyelesaikan PR-ku sebelum makan malam.',
        reportedOptions: [
          { text: 'Maya said that she had to finish her homework before dinner.', ok: true },
          { text: 'Maya said that she must finish her homework before dinner.', ok: false },
          { text: 'Maya said that he had to finish his homework before dinner.', ok: false },
          { text: 'Maya said that she might finish her homework before dinner.', ok: false },
        ],
      },
      {
        speaker: 'Rani',
        emoji: '🎨',
        original: 'I can paint very well.',
        originalId: 'Aku bisa melukis dengan sangat baik.',
        reportedOptions: [
          { text: 'Rani said that she could paint very well.', ok: true },
          { text: 'Rani said that she can paint very well.', ok: false },
          { text: 'Rani said that he could paint very well.', ok: false },
          { text: 'Rani said that she would paint very well.', ok: false },
        ],
      },
      {
        speaker: 'Budi',
        emoji: '🎤',
        original: 'I will sing at the concert.',
        originalId: 'Aku akan bernyanyi di konser itu.',
        reportedOptions: [
          { text: 'Budi said that he would sing at the concert.', ok: true },
          { text: 'Budi said that he will sing at the concert.', ok: false },
          { text: 'Budi said that she would sing at the concert.', ok: false },
          { text: 'Budi said that he could sing at the concert.', ok: false },
        ],
      },
      {
        speaker: 'Sari',
        emoji: '📚',
        original: 'I must return the library book.',
        originalId: 'Aku harus mengembalikan buku perpustakaan itu.',
        reportedOptions: [
          { text: 'Sari said that she had to return the library book.', ok: true },
          { text: 'Sari said that she must return the library book.', ok: false },
          { text: 'Sari said that he had to return the library book.', ok: false },
          { text: 'Sari said that she might return the library book.', ok: false },
        ],
      },
      {
        speaker: 'Dimas',
        emoji: '🏃',
        original: 'I may join the running club.',
        originalId: 'Aku mungkin akan ikut klub lari.',
        reportedOptions: [
          { text: 'Dimas said that he might join the running club.', ok: true },
          { text: 'Dimas said that he may join the running club.', ok: false },
          { text: 'Dimas said that she might join the running club.', ok: false },
          { text: 'Dimas said that he would join the running club.', ok: false },
        ],
      },
    ],
  },
  /**
   * Topik ke-5 — "Reported Yes/No Questions" ("asked if/whether" — konversi
   * urutan kata pertanyaan→pernyataan + sisip "if", BUKAN cuma soal tense).
   * Dari domain Vocab `pendidikan-kehidupan-akademik` (Education & Academic
   * Life) — dialog guru↔murid paling natural. Penerima ditulis LANGSUNG di
   * teks `reportedOptions` (tanpa field baru di skema). Distraktor: (1)
   * inversi tanya tidak dibuang ("if did..."), (2) kata ganti salah, (3)
   * tense tidak digeser.
   */
  {
    id: 'reported-yesno-questions',
    title: 'Reported Speech — Tanya Ya/Tidak (Asked If)',
    desc: '10 kutipan',
    transforms: [
      {
        speaker: 'Budi',
        emoji: '📚',
        original: 'Do you understand the lesson?',
        originalId: 'Apakah kamu mengerti pelajaran ini?',
        reportedOptions: [
          { text: 'Budi asked Sari if she understood the lesson.', ok: true },
          { text: 'Budi asked Sari if did she understand the lesson.', ok: false },
          { text: 'Budi asked Sari if he understood the lesson.', ok: false },
          { text: 'Budi asked Sari if she understands the lesson.', ok: false },
        ],
      },
      {
        speaker: 'Lina',
        emoji: '🧮',
        original: 'Do you like solving math problems?',
        originalId: 'Apakah kamu suka menyelesaikan soal matematika?',
        reportedOptions: [
          { text: 'Lina asked Doni if he liked solving math problems.', ok: true },
          { text: 'Lina asked Doni if did he like solving math problems.', ok: false },
          { text: 'Lina asked Doni if she liked solving math problems.', ok: false },
          { text: 'Lina asked Doni if he likes solving math problems.', ok: false },
        ],
      },
      {
        speaker: 'Andi',
        emoji: '🪪',
        original: 'Do you have your ID card with you?',
        originalId: 'Apakah kamu bawa kartu pelajarmu?',
        reportedOptions: [
          { text: 'Andi asked Wati if she had her ID card with her.', ok: true },
          { text: 'Andi asked Wati if did she have her ID card with her.', ok: false },
          { text: 'Andi asked Wati if he had his ID card with him.', ok: false },
          { text: 'Andi asked Wati if she has her ID card with her.', ok: false },
        ],
      },
      {
        speaker: 'Maya',
        emoji: '📝',
        original: 'Do you finish your homework every day?',
        originalId: 'Apakah kamu menyelesaikan PR-mu setiap hari?',
        reportedOptions: [
          { text: 'Maya asked Fajar if he finished his homework every day.', ok: true },
          { text: 'Maya asked Fajar if did he finish his homework every day.', ok: false },
          { text: 'Maya asked Fajar if she finished her homework every day.', ok: false },
          { text: 'Maya asked Fajar if he finishes his homework every day.', ok: false },
        ],
      },
      {
        speaker: 'Rani',
        emoji: '🔬',
        original: 'Do you enjoy science class?',
        originalId: 'Apakah kamu suka pelajaran sains?',
        reportedOptions: [
          { text: 'Rani asked Dimas if he enjoyed science class.', ok: true },
          { text: 'Rani asked Dimas if did he enjoy science class.', ok: false },
          { text: 'Rani asked Dimas if she enjoyed science class.', ok: false },
          { text: 'Rani asked Dimas if he enjoys science class.', ok: false },
        ],
      },
      {
        speaker: 'Wati',
        emoji: '📏',
        original: 'Do you have a ruler?',
        originalId: 'Apakah kamu punya penggaris?',
        reportedOptions: [
          { text: 'Wati asked Andi if he had a ruler.', ok: true },
          { text: 'Wati asked Andi if did he have a ruler.', ok: false },
          { text: 'Wati asked Andi if she had a ruler.', ok: false },
          { text: 'Wati asked Andi if he has a ruler.', ok: false },
        ],
      },
      {
        speaker: 'Doni',
        emoji: '🎒',
        original: 'Do you bring your own lunch to school?',
        originalId: 'Apakah kamu bawa bekal sendiri ke sekolah?',
        reportedOptions: [
          { text: 'Doni asked Lina if she brought her own lunch to school.', ok: true },
          { text: 'Doni asked Lina if did she bring her own lunch to school.', ok: false },
          { text: 'Doni asked Lina if he brought his own lunch to school.', ok: false },
          { text: 'Doni asked Lina if she brings her own lunch to school.', ok: false },
        ],
      },
      {
        speaker: 'Sari',
        emoji: '📖',
        original: 'Are you reading the new novel for class?',
        originalId: 'Apakah kamu sedang membaca novel baru untuk kelas?',
        reportedOptions: [
          { text: 'Sari asked Budi if he was reading the new novel for class.', ok: true },
          { text: 'Sari asked Budi if was he reading the new novel for class.', ok: false },
          { text: 'Sari asked Budi if she was reading the new novel for class.', ok: false },
          { text: 'Sari asked Budi if he is reading the new novel for class.', ok: false },
        ],
      },
      {
        speaker: 'Fajar',
        emoji: '🖊️',
        original: 'Do you write in your journal every night?',
        originalId: 'Apakah kamu menulis jurnal setiap malam?',
        reportedOptions: [
          { text: 'Fajar asked Maya if she wrote in her journal every night.', ok: true },
          { text: 'Fajar asked Maya if did she write in her journal every night.', ok: false },
          { text: 'Fajar asked Maya if he wrote in his journal every night.', ok: false },
          { text: 'Fajar asked Maya if she writes in her journal every night.', ok: false },
        ],
      },
      {
        speaker: 'Andi',
        emoji: '🎨',
        original: 'Do you like art class?',
        originalId: 'Apakah kamu suka pelajaran seni?',
        reportedOptions: [
          { text: 'Andi asked Rani if she liked art class.', ok: true },
          { text: 'Andi asked Rani if did she like art class.', ok: false },
          { text: 'Andi asked Rani if he liked art class.', ok: false },
          { text: 'Andi asked Rani if she likes art class.', ok: false },
        ],
      },
    ],
  },
  /**
   * Topik ke-6 — "Reported Wh-Questions" (asked what/where/why/when/how —
   * kata tanya TETAP dipakai sbg konektor, TIDAK disisip "if" spt topik
   * sebelumnya — kesalahan paling umum anak tertukar antar 2 pola ini).
   * Dari domain Vocab `pendapat-pengalaman`, gaya wawancara pengalaman.
   * Distraktor: (1) inversi tanya tidak dibuang, (2) kata ganti salah, (3)
   * tense tidak digeser.
   */
  {
    id: 'reported-wh-questions',
    title: 'Reported Speech — Tanya Detail (Asked Wh-)',
    desc: '10 kutipan',
    transforms: [
      {
        speaker: 'Maya',
        emoji: '🏀',
        original: 'Where do you practice basketball?',
        originalId: 'Di mana kamu berlatih basket?',
        reportedOptions: [
          { text: 'Maya asked Fajar where he practiced basketball.', ok: true },
          { text: 'Maya asked Fajar where did he practice basketball.', ok: false },
          { text: 'Maya asked Fajar where she practiced basketball.', ok: false },
          { text: 'Maya asked Fajar where he practices basketball.', ok: false },
        ],
      },
      {
        speaker: 'Doni',
        emoji: '✈️',
        original: 'Why do you like traveling so much?',
        originalId: 'Kenapa kamu suka sekali bepergian?',
        reportedOptions: [
          { text: 'Doni asked Rani why she liked traveling so much.', ok: true },
          { text: 'Doni asked Rani why did she like traveling so much.', ok: false },
          { text: 'Doni asked Rani why he liked traveling so much.', ok: false },
          { text: 'Doni asked Rani why she likes traveling so much.', ok: false },
        ],
      },
      {
        speaker: 'Sari',
        emoji: '🎤',
        original: 'How do you stay confident before a performance?',
        originalId: 'Bagaimana caramu tetap percaya diri sebelum tampil?',
        reportedOptions: [
          { text: 'Sari asked Budi how he stayed confident before a performance.', ok: true },
          { text: 'Sari asked Budi how did he stay confident before a performance.', ok: false },
          { text: 'Sari asked Budi how she stayed confident before a performance.', ok: false },
          { text: 'Sari asked Budi how he stays confident before a performance.', ok: false },
        ],
      },
      {
        speaker: 'Wati',
        emoji: '🎵',
        original: 'What music do you listen to?',
        originalId: 'Musik apa yang kamu dengarkan?',
        reportedOptions: [
          { text: 'Wati asked Andi what music he listened to.', ok: true },
          { text: 'Wati asked Andi what music did he listen to.', ok: false },
          { text: 'Wati asked Andi what music she listened to.', ok: false },
          { text: 'Wati asked Andi what music he listens to.', ok: false },
        ],
      },
      {
        speaker: 'Lina',
        emoji: '📚',
        original: 'When do you study for exams?',
        originalId: 'Kapan kamu belajar untuk ujian?',
        reportedOptions: [
          { text: 'Lina asked Doni when he studied for exams.', ok: true },
          { text: 'Lina asked Doni when did he study for exams.', ok: false },
          { text: 'Lina asked Doni when she studied for exams.', ok: false },
          { text: 'Lina asked Doni when he studies for exams.', ok: false },
        ],
      },
      {
        speaker: 'Fajar',
        emoji: '🎨',
        original: 'What do you usually paint?',
        originalId: 'Apa yang biasanya kamu lukis?',
        reportedOptions: [
          { text: 'Fajar asked Maya what she usually painted.', ok: true },
          { text: 'Fajar asked Maya what did she usually paint.', ok: false },
          { text: 'Fajar asked Maya what he usually painted.', ok: false },
          { text: 'Fajar asked Maya what she usually paints.', ok: false },
        ],
      },
      {
        speaker: 'Rani',
        emoji: '⚽',
        original: 'How often do you practice football?',
        originalId: 'Seberapa sering kamu berlatih sepak bola?',
        reportedOptions: [
          { text: 'Rani asked Dimas how often he practiced football.', ok: true },
          { text: 'Rani asked Dimas how often did he practice football.', ok: false },
          { text: 'Rani asked Dimas how often she practiced football.', ok: false },
          { text: 'Rani asked Dimas how often he practices football.', ok: false },
        ],
      },
      {
        speaker: 'Budi',
        emoji: '🎬',
        original: 'What is your favorite movie genre?',
        originalId: 'Apa genre film favoritmu?',
        reportedOptions: [
          { text: 'Budi asked Sari what her favorite movie genre was.', ok: true },
          { text: 'Budi asked Sari what was her favorite movie genre.', ok: false },
          { text: 'Budi asked Sari what his favorite movie genre was.', ok: false },
          { text: 'Budi asked Sari what her favorite movie genre is.', ok: false },
        ],
      },
      {
        speaker: 'Andi',
        emoji: '🍲',
        original: 'What do you usually cook on weekends?',
        originalId: 'Apa yang biasanya kamu masak di akhir pekan?',
        reportedOptions: [
          { text: 'Andi asked Wati what she usually cooked on weekends.', ok: true },
          { text: 'Andi asked Wati what did she usually cook on weekends.', ok: false },
          { text: 'Andi asked Wati what he usually cooked on weekends.', ok: false },
          { text: 'Andi asked Wati what she usually cooks on weekends.', ok: false },
        ],
      },
      {
        speaker: 'Maya',
        emoji: '🎓',
        original: 'Why did you join the school choir?',
        originalId: 'Kenapa kamu ikut paduan suara sekolah?',
        reportedOptions: [
          { text: 'Maya asked Fajar why he had joined the school choir.', ok: true },
          { text: 'Maya asked Fajar why did he join the school choir.', ok: false },
          { text: 'Maya asked Fajar why she had joined the school choir.', ok: false },
          { text: 'Maya asked Fajar why he joined the school choir.', ok: false },
        ],
      },
    ],
  },
  /**
   * Topik ke-7 — "Reported Requests" (permintaan sopan "Could/Can you...?"/
   * "Please..." → "asked someone TO..." — SECARA BENTUK mirip pertanyaan
   * tapi FUNGSInya permintaan, jadi konversi ke infinitive spt perintah,
   * BUKAN "asked if" spt topik yes/no — pembeda paling penting antar
   * topik ini & topik 5/6). Dari domain Vocab `hiburan-media` (minta
   * tolong ke teman di acara hiburan). Distraktor: (1) salah dibaca sbg
   * pertanyaan info ("asked if...could"), (2) kata ganti/objek salah, (3)
   * "to" hilang.
   */
  {
    id: 'reported-requests',
    title: 'Reported Speech — Minta Tolong (Asked To)',
    desc: '10 kutipan',
    transforms: [
      {
        speaker: 'Sari',
        emoji: '📷',
        original: 'Could you take a photo of us?',
        originalId: 'Bisakah kamu memotret kami?',
        reportedOptions: [
          { text: 'Sari asked Doni to take a photo of them.', ok: true },
          { text: 'Sari asked Doni if he could take a photo of them.', ok: false },
          { text: 'Sari asked Doni to take a photo of her.', ok: false },
          { text: 'Sari asked Doni take a photo of them.', ok: false },
        ],
      },
      {
        speaker: 'Budi',
        emoji: '🎫',
        original: 'Can you hold my seat for a minute?',
        originalId: 'Bisakah kamu jagain kursiku sebentar?',
        reportedOptions: [
          { text: 'Budi asked Lina to hold his seat for a minute.', ok: true },
          { text: 'Budi asked Lina if she could hold his seat for a minute.', ok: false },
          { text: 'Budi asked Lina to hold her seat for a minute.', ok: false },
          { text: 'Budi asked Lina hold his seat for a minute.', ok: false },
        ],
      },
      {
        speaker: 'Wati',
        emoji: '🎬',
        original: 'Please turn off your phone during the movie.',
        originalId: 'Tolong matikan ponselmu selama film diputar.',
        reportedOptions: [
          { text: 'Wati asked Andi to turn off his phone during the movie.', ok: true },
          { text: 'Wati asked Andi if he could turn off his phone during the movie.', ok: false },
          { text: 'Wati asked Andi to turn off her phone during the movie.', ok: false },
          { text: 'Wati asked Andi turn off his phone during the movie.', ok: false },
        ],
      },
      {
        speaker: 'Rani',
        emoji: '🎤',
        original: 'Could you turn down your volume, please?',
        originalId: 'Bisakah kamu mengecilkan volumemu?',
        reportedOptions: [
          { text: 'Rani asked Fajar to turn down his volume.', ok: true },
          { text: 'Rani asked Fajar if he could turn down his volume.', ok: false },
          { text: 'Rani asked Fajar to turn down her volume.', ok: false },
          { text: 'Rani asked Fajar turn down his volume.', ok: false },
        ],
      },
      {
        speaker: 'Dimas',
        emoji: '🍿',
        original: 'Can you buy some popcorn for us?',
        originalId: 'Bisakah kamu membelikan kami popcorn?',
        reportedOptions: [
          { text: 'Dimas asked Maya to buy some popcorn for them.', ok: true },
          { text: 'Dimas asked Maya if she could buy some popcorn for them.', ok: false },
          { text: 'Dimas asked Maya to buy some popcorn for him.', ok: false },
          { text: 'Dimas asked Maya buy some popcorn for them.', ok: false },
        ],
      },
      {
        speaker: 'Doni',
        emoji: '🎟️',
        original: 'Could you save two tickets for your friends?',
        originalId: 'Bisakah kamu menyimpan dua tiket untuk teman-temanmu?',
        reportedOptions: [
          { text: 'Doni asked Sari to save two tickets for her friends.', ok: true },
          { text: 'Doni asked Sari if she could save two tickets for her friends.', ok: false },
          { text: 'Doni asked Sari to save two tickets for his friends.', ok: false },
          { text: 'Doni asked Sari save two tickets for her friends.', ok: false },
        ],
      },
      {
        speaker: 'Lina',
        emoji: '📺',
        original: 'Please lend me your remote control.',
        originalId: 'Tolong pinjamkan aku remote TV-mu.',
        reportedOptions: [
          { text: 'Lina asked Budi to lend her his remote control.', ok: true },
          { text: 'Lina asked Budi if he could lend her his remote control.', ok: false },
          { text: 'Lina asked Budi to lend him his remote control.', ok: false },
          { text: 'Lina asked Budi lend her his remote control.', ok: false },
        ],
      },
      {
        speaker: 'Andi',
        emoji: '🎧',
        original: 'Can you share your earphones with me?',
        originalId: 'Bisakah kamu meminjamkan earphone-mu padaku?',
        reportedOptions: [
          { text: 'Andi asked Wati to share her earphones with him.', ok: true },
          { text: 'Andi asked Wati if she could share her earphones with him.', ok: false },
          { text: 'Andi asked Wati to share his earphones with him.', ok: false },
          { text: 'Andi asked Wati share her earphones with him.', ok: false },
        ],
      },
      {
        speaker: 'Maya',
        emoji: '🎨',
        original: 'Could you help me choose a costume?',
        originalId: 'Bisakah kamu membantuku memilih kostum?',
        reportedOptions: [
          { text: 'Maya asked Rani to help her choose a costume.', ok: true },
          { text: 'Maya asked Rani if she could help her choose a costume.', ok: false },
          { text: 'Maya asked Rani to help him choose a costume.', ok: false },
          { text: 'Maya asked Rani help her choose a costume.', ok: false },
        ],
      },
      {
        speaker: 'Fajar',
        emoji: '📸',
        original: 'Please send me the photos from the concert.',
        originalId: 'Tolong kirimkan aku foto-foto dari konser itu.',
        reportedOptions: [
          { text: 'Fajar asked Dimas to send him the photos from the concert.', ok: true },
          { text: 'Fajar asked Dimas if he could send him the photos from the concert.', ok: false },
          { text: 'Fajar asked Dimas to send her the photos from the concert.', ok: false },
          { text: 'Fajar asked Dimas send him the photos from the concert.', ok: false },
        ],
      },
    ],
  },
  /**
   * Topik ke-8 — "Reported Commands" (perintah imperatif polos → "told
   * someone TO..." — konversi MOOD, bukan cuma tense, dimensi transformasi
   * beda total dari semua topik sebelumnya). Dari domain Vocab
   * `pendidikan-kehidupan-akademik` (konteks guru memberi instruksi).
   * Distraktor: (1) tetap klausa finite ("told...that..."), (2) kata
   * ganti salah, (3) "to" hilang.
   */
  {
    id: 'reported-commands',
    title: 'Reported Speech — Perintah (Told To)',
    desc: '10 kutipan',
    transforms: [
      {
        speaker: 'Wati',
        emoji: '📚',
        original: 'Close your books, please.',
        originalId: 'Tolong tutup buku kalian.',
        reportedOptions: [
          { text: 'Wati told the students to close their books.', ok: true },
          { text: 'Wati told the students that close their books.', ok: false },
          { text: 'Wati told the students to close her books.', ok: false },
          { text: 'Wati told the students close their books.', ok: false },
        ],
      },
      {
        speaker: 'Andi',
        emoji: '⚽',
        original: 'Pass the ball to your teammate!',
        originalId: 'Oper bolanya ke rekan setimmu!',
        reportedOptions: [
          { text: 'Andi told Doni to pass the ball to his teammate.', ok: true },
          { text: 'Andi told Doni that pass the ball to his teammate.', ok: false },
          { text: 'Andi told Doni to pass the ball to her teammate.', ok: false },
          { text: 'Andi told Doni pass the ball to his teammate.', ok: false },
        ],
      },
      {
        speaker: 'Lina',
        emoji: '📖',
        original: 'Return your book by Friday.',
        originalId: 'Kembalikan bukumu sebelum hari Jumat.',
        reportedOptions: [
          { text: 'Lina told Fajar to return his book by Friday.', ok: true },
          { text: 'Lina told Fajar that return his book by Friday.', ok: false },
          { text: 'Lina told Fajar to return her book by Friday.', ok: false },
          { text: 'Lina told Fajar return his book by Friday.', ok: false },
        ],
      },
      {
        speaker: 'Budi',
        emoji: '🖊️',
        original: 'Write your name at the top of the page.',
        originalId: 'Tulis namamu di bagian atas halaman.',
        reportedOptions: [
          { text: 'Budi told the students to write their names at the top of the page.', ok: true },
          { text: 'Budi told the students that write their names at the top of the page.', ok: false },
          { text: 'Budi told the students to write his name at the top of the page.', ok: false },
          { text: 'Budi told the students write their names at the top of the page.', ok: false },
        ],
      },
      {
        speaker: 'Sari',
        emoji: '🎒',
        original: 'Bring your art supplies to class.',
        originalId: 'Bawa perlengkapan senimu ke kelas.',
        reportedOptions: [
          { text: 'Sari told Rani to bring her art supplies to class.', ok: true },
          { text: 'Sari told Rani that bring her art supplies to class.', ok: false },
          { text: 'Sari told Rani to bring his art supplies to class.', ok: false },
          { text: 'Sari told Rani bring her art supplies to class.', ok: false },
        ],
      },
      {
        speaker: 'Maya',
        emoji: '🧪',
        original: 'Wear your safety goggles in the lab.',
        originalId: 'Pakai kacamata pelindungmu di laboratorium.',
        reportedOptions: [
          { text: 'Maya told Dimas to wear his safety goggles in the lab.', ok: true },
          { text: 'Maya told Dimas that wear his safety goggles in the lab.', ok: false },
          { text: 'Maya told Dimas to wear her safety goggles in the lab.', ok: false },
          { text: 'Maya told Dimas wear his safety goggles in the lab.', ok: false },
        ],
      },
      {
        speaker: 'Doni',
        emoji: '🎵',
        original: 'Practice your song before the concert.',
        originalId: 'Latih lagumu sebelum konser.',
        reportedOptions: [
          { text: 'Doni told Wati to practice her song before the concert.', ok: true },
          { text: 'Doni told Wati that practice her song before the concert.', ok: false },
          { text: 'Doni told Wati to practice his song before the concert.', ok: false },
          { text: 'Doni told Wati practice her song before the concert.', ok: false },
        ],
      },
      {
        speaker: 'Fajar',
        emoji: '🧹',
        original: 'Clean your desks after class.',
        originalId: 'Bersihkan meja kalian setelah kelas selesai.',
        reportedOptions: [
          { text: 'Fajar told the students to clean their desks after class.', ok: true },
          { text: 'Fajar told the students that clean their desks after class.', ok: false },
          { text: 'Fajar told the students to clean his desk after class.', ok: false },
          { text: 'Fajar told the students clean their desks after class.', ok: false },
        ],
      },
      {
        speaker: 'Andi',
        emoji: '🎤',
        original: 'Raise your hand to answer.',
        originalId: 'Angkat tanganmu untuk menjawab.',
        reportedOptions: [
          { text: 'Andi told Lina to raise her hand to answer.', ok: true },
          { text: 'Andi told Lina that raise her hand to answer.', ok: false },
          { text: 'Andi told Lina to raise his hand to answer.', ok: false },
          { text: 'Andi told Lina raise her hand to answer.', ok: false },
        ],
      },
      {
        speaker: 'Rani',
        emoji: '📐',
        original: 'Use your ruler to draw the line.',
        originalId: 'Gunakan penggarismu untuk menggambar garis itu.',
        reportedOptions: [
          { text: 'Rani told Budi to use his ruler to draw the line.', ok: true },
          { text: 'Rani told Budi that use his ruler to draw the line.', ok: false },
          { text: 'Rani told Budi to use her ruler to draw the line.', ok: false },
          { text: 'Rani told Budi use his ruler to draw the line.', ok: false },
        ],
      },
    ],
  },
  /**
   * Topik ke-9 — "Reported Negative Commands" ("Don't..." → "told someone
   * NOT TO..." — konversi mood SAMA spt topik perintah, tapi nambah
   * penempatan "not" — kesalahan khas: "not" hilang (membalik makna) atau
   * salah urutan "to not"). Dari domain Vocab `perjalanan-wisata` (aturan/
   * larangan pemandu wisata, register paling natural utk larangan).
   * Distraktor: (1) "not" hilang, (2) objek/kata ganti salah, (3) urutan
   * salah ("to not" bukan "not to").
   */
  {
    id: 'reported-negative-commands',
    title: 'Reported Speech — Larangan (Told Not To)',
    desc: '10 kutipan',
    transforms: [
      {
        speaker: 'Rani',
        emoji: '🐒',
        original: "Don't feed the monkeys!",
        originalId: 'Jangan kasih makan monyet-monyetnya!',
        reportedOptions: [
          { text: 'Rani told the tourists not to feed the monkeys.', ok: true },
          { text: 'Rani told the tourists to feed the monkeys.', ok: false },
          { text: 'Rani told him not to feed the monkeys.', ok: false },
          { text: 'Rani told the tourists to not feed the monkeys.', ok: false },
        ],
      },
      {
        speaker: 'Budi',
        emoji: '🏞️',
        original: "Don't leave any trash on the trail.",
        originalId: 'Jangan tinggalkan sampah di jalur pendakian.',
        reportedOptions: [
          { text: 'Budi told the hikers not to leave any trash on the trail.', ok: true },
          { text: 'Budi told the hikers to leave any trash on the trail.', ok: false },
          { text: 'Budi told her not to leave any trash on the trail.', ok: false },
          { text: 'Budi told the hikers to not leave any trash on the trail.', ok: false },
        ],
      },
      {
        speaker: 'Sari',
        emoji: '🤿',
        original: "Don't touch the coral reef.",
        originalId: 'Jangan sentuh terumbu karangnya.',
        reportedOptions: [
          { text: 'Sari told the divers not to touch the coral reef.', ok: true },
          { text: 'Sari told the divers to touch the coral reef.', ok: false },
          { text: 'Sari told him not to touch the coral reef.', ok: false },
          { text: 'Sari told the divers to not touch the coral reef.', ok: false },
        ],
      },
      {
        speaker: 'Wati',
        emoji: '🏨',
        original: "Don't make noise in the hallway.",
        originalId: 'Jangan berisik di lorong.',
        reportedOptions: [
          { text: 'Wati told the guests not to make noise in the hallway.', ok: true },
          { text: 'Wati told the guests to make noise in the hallway.', ok: false },
          { text: 'Wati told him not to make noise in the hallway.', ok: false },
          { text: 'Wati told the guests to not make noise in the hallway.', ok: false },
        ],
      },
      {
        speaker: 'Andi',
        emoji: '⛺',
        original: "Don't light a fire near the tent.",
        originalId: 'Jangan nyalakan api dekat tenda.',
        reportedOptions: [
          { text: 'Andi told the campers not to light a fire near the tent.', ok: true },
          { text: 'Andi told the campers to light a fire near the tent.', ok: false },
          { text: 'Andi told her not to light a fire near the tent.', ok: false },
          { text: 'Andi told the campers to not light a fire near the tent.', ok: false },
        ],
      },
      {
        speaker: 'Doni',
        emoji: '🏛️',
        original: "Don't take photos inside the museum.",
        originalId: 'Jangan foto-foto di dalam museum.',
        reportedOptions: [
          { text: 'Doni told the visitors not to take photos inside the museum.', ok: true },
          { text: 'Doni told the visitors to take photos inside the museum.', ok: false },
          { text: 'Doni told her not to take photos inside the museum.', ok: false },
          { text: 'Doni told the visitors to not take photos inside the museum.', ok: false },
        ],
      },
      {
        speaker: 'Lina',
        emoji: '🚌',
        original: "Don't stand on the bus.",
        originalId: 'Jangan berdiri di dalam bus.',
        reportedOptions: [
          { text: 'Lina told the passengers not to stand on the bus.', ok: true },
          { text: 'Lina told the passengers to stand on the bus.', ok: false },
          { text: 'Lina told him not to stand on the bus.', ok: false },
          { text: 'Lina told the passengers to not stand on the bus.', ok: false },
        ],
      },
      {
        speaker: 'Maya',
        emoji: '🦋',
        original: "Don't chase the butterflies in the garden.",
        originalId: 'Jangan kejar kupu-kupu di taman itu.',
        reportedOptions: [
          { text: 'Maya told the tourists not to chase the butterflies in the garden.', ok: true },
          { text: 'Maya told the tourists to chase the butterflies in the garden.', ok: false },
          { text: 'Maya told him not to chase the butterflies in the garden.', ok: false },
          { text: 'Maya told the tourists to not chase the butterflies in the garden.', ok: false },
        ],
      },
      {
        speaker: 'Fajar',
        emoji: '🥾',
        original: "Don't walk off the marked path.",
        originalId: 'Jangan berjalan keluar dari jalur yang ditandai.',
        reportedOptions: [
          { text: 'Fajar told the group not to walk off the marked path.', ok: true },
          { text: 'Fajar told the group to walk off the marked path.', ok: false },
          { text: 'Fajar told her not to walk off the marked path.', ok: false },
          { text: 'Fajar told the group to not walk off the marked path.', ok: false },
        ],
      },
      {
        speaker: 'Rani',
        emoji: '🏊',
        original: "Don't swim too far from the shore.",
        originalId: 'Jangan berenang terlalu jauh dari pantai.',
        reportedOptions: [
          { text: 'Rani told the swimmers not to swim too far from the shore.', ok: true },
          { text: 'Rani told the swimmers to swim too far from the shore.', ok: false },
          { text: 'Rani told him not to swim too far from the shore.', ok: false },
          { text: 'Rani told the swimmers to not swim too far from the shore.', ok: false },
        ],
      },
    ],
  },
  /**
   * Topik ke-10 — "Reported Time & Place Shift" (here→there, now→then,
   * tomorrow→the next day, yesterday→the day before, this→that — dimensi
   * KOSAKATA deiktik, bukan morfologi verba — CAPSTONE yg SENGAJA
   * merekombinasi aturan tense topik 3 di beberapa item). Dari domain
   * Vocab `bahasa-komunikasi` (REUSE dari topik pertama — konteks telepon/
   * pesan paling natural utk kata "di sini/sekarang/besok"). Ini
   * SATU-SATUNYA topik yg memakai kata deiktik — 8 topik sebelumnya SENGAJA
   * menghindarinya spy tiap topik menguji SATU aturan transformasi murni
   * (sama prinsip "kalimat tidak boleh bocor sinyal kedua" §8/§13).
   * Distraktor: (1) kata deiktik TIDAK digeser (tense digeser), (2) kata
   * ganti salah, (3) kata deiktik digeser TAPI tense TIDAK (atau
   * sebaliknya).
   */
  {
    id: 'reported-time-place',
    title: 'Reported Speech — Waktu & Tempat Berubah (Time & Place Shift)',
    desc: '10 kutipan',
    transforms: [
      {
        speaker: 'Fajar',
        emoji: '📱',
        original: 'I am arriving here tomorrow.',
        originalId: 'Aku akan tiba di sini besok.',
        reportedOptions: [
          { text: 'Fajar said that he was arriving there the next day.', ok: true },
          { text: 'Fajar said that he was arriving here tomorrow.', ok: false },
          { text: 'Fajar said that she was arriving there the next day.', ok: false },
          { text: 'Fajar said that he is arriving there the next day.', ok: false },
        ],
      },
      {
        speaker: 'Maya',
        emoji: '📞',
        original: 'I am busy now.',
        originalId: 'Aku sedang sibuk sekarang.',
        reportedOptions: [
          { text: 'Maya said that she was busy then.', ok: true },
          { text: 'Maya said that she was busy now.', ok: false },
          { text: 'Maya said that he was busy then.', ok: false },
          { text: 'Maya said that she is busy then.', ok: false },
        ],
      },
      {
        speaker: 'Rani',
        emoji: '💬',
        original: 'I finished this book yesterday.',
        originalId: 'Aku menyelesaikan buku ini kemarin.',
        reportedOptions: [
          { text: 'Rani said that she had finished that book the day before.', ok: true },
          { text: 'Rani said that she had finished this book yesterday.', ok: false },
          { text: 'Rani said that he had finished that book the day before.', ok: false },
          { text: 'Rani said that she finished that book the day before.', ok: false },
        ],
      },
      {
        speaker: 'Dimas',
        emoji: '📲',
        original: 'I will finish the report today.',
        originalId: 'Aku akan menyelesaikan laporan ini hari ini.',
        reportedOptions: [
          { text: 'Dimas said that he would finish the report that day.', ok: true },
          { text: 'Dimas said that he would finish the report today.', ok: false },
          { text: 'Dimas said that she would finish the report that day.', ok: false },
          { text: 'Dimas said that he will finish the report that day.', ok: false },
        ],
      },
      {
        speaker: 'Sari',
        emoji: '💌',
        original: 'I will visit this city next week.',
        originalId: 'Aku akan mengunjungi kota ini minggu depan.',
        reportedOptions: [
          { text: 'Sari said that she would visit that city the following week.', ok: true },
          { text: 'Sari said that she would visit this city next week.', ok: false },
          { text: 'Sari said that he would visit that city the following week.', ok: false },
          { text: 'Sari said that she will visit that city the following week.', ok: false },
        ],
      },
      {
        speaker: 'Budi',
        emoji: '📧',
        original: 'I sent the email yesterday.',
        originalId: 'Aku mengirim email itu kemarin.',
        reportedOptions: [
          { text: 'Budi said that he had sent the email the day before.', ok: true },
          { text: 'Budi said that he had sent the email yesterday.', ok: false },
          { text: 'Budi said that she had sent the email the day before.', ok: false },
          { text: 'Budi said that he sent the email the day before.', ok: false },
        ],
      },
      {
        speaker: 'Wati',
        emoji: '🧳',
        original: 'I am staying here for two more days.',
        originalId: 'Aku akan tinggal di sini selama dua hari lagi.',
        reportedOptions: [
          { text: 'Wati said that she was staying there for two more days.', ok: true },
          { text: 'Wati said that she was staying here for two more days.', ok: false },
          { text: 'Wati said that he was staying there for two more days.', ok: false },
          { text: 'Wati said that she is staying there for two more days.', ok: false },
        ],
      },
      {
        speaker: 'Andi',
        emoji: '🗓️',
        original: 'I will finish this project tomorrow.',
        originalId: 'Aku akan menyelesaikan proyek ini besok.',
        reportedOptions: [
          { text: 'Andi said that he would finish that project the next day.', ok: true },
          { text: 'Andi said that he would finish this project tomorrow.', ok: false },
          { text: 'Andi said that she would finish that project the next day.', ok: false },
          { text: 'Andi said that he will finish that project the next day.', ok: false },
        ],
      },
      {
        speaker: 'Lina',
        emoji: '⏰',
        original: 'I am free now.',
        originalId: 'Aku sedang senggang sekarang.',
        reportedOptions: [
          { text: 'Lina said that she was free then.', ok: true },
          { text: 'Lina said that she was free now.', ok: false },
          { text: 'Lina said that he was free then.', ok: false },
          { text: 'Lina said that she is free then.', ok: false },
        ],
      },
      {
        speaker: 'Doni',
        emoji: '🛍️',
        original: 'I bought this yesterday.',
        originalId: 'Aku membeli ini kemarin.',
        reportedOptions: [
          { text: 'Doni said that he had bought that the day before.', ok: true },
          { text: 'Doni said that he had bought this yesterday.', ok: false },
          { text: 'Doni said that she had bought that the day before.', ok: false },
          { text: 'Doni said that he bought that the day before.', ok: false },
        ],
      },
    ],
  },
];

export const GRAMMAR_TOPICS_BY_LEVEL: Partial<Record<LevelKey, AnyGrammarTopic[]>> = {
  'little-stars': GRAMMAR_TOPICS_LITTLE_STARS,
  starter: GRAMMAR_TOPICS_STARTER,
  explorer: GRAMMAR_TOPICS,
  adventurer: GRAMMAR_TOPICS_ADVENTURER,
  achiever: GRAMMAR_TOPICS_ACHIEVER,
  trailblazer: GRAMMAR_TOPICS_TRAILBLAZER,
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
 *
 * **Digenapkan 1→10 topik** (target CLAUDE.md ≥10/skill, permintaan user
 * "materi reading di little stars masih 1... buatkan minimal 10... research
 * ke lembaga bahasa inggris dalam negeri" — riset dikonfirmasi ulang: LIA
 * GEYL/EF Small Stars/Kumon Indonesia SEMUA mulai dari "look-listen-repeat"
 * kata benda konkret bergambar sebelum phonics, jadi PERLUASAN yang tepat
 * murni GENAPKAN domain `VOCAB_TOPICS_LITTLE_STARS` yang belum dipakai
 * Reading — bukan format/mekanik baru) — 9 topik baru: `kata-warna`/`kata-
 * angka`/`kata-bentuk`/`kata-keluarga`/`kata-tubuh`/`kata-buah`/`kata-
 * mainan`/`kata-pakaian`/`kata-kendaraan`, dipetakan 1:1 dari domain Vocab
 * `kenal-warna`/`angka-pertama`/`bentuk`/`keluargaku`/`tubuhku`/`buah-
 * buahan`/`mainan`/`pakaian`/`kendaraan` — urutan REUSE urutan asli Vocab
 * (sudah mencerminkan progresi "konsep dasar → diri & keluarga → benda
 * konkret" ala Kurikulum Merdeka Fase Fondasi/Kumon level 7A-6A). **2 domain
 * Vocab SENGAJA DILEWATI** (bukan lupa): `salam-sopan-santun` (ditandai
 * `iconAmbiguous:true` di Vocab — emoji gestur/ekspresi (mis. 😔 utk "Sorry")
 * multi-tafsir tanpa teks penjelas, fatal utk format Reading yang jawaban
 * Latihan Inti-nya MURNI gambar tanpa label; kata²nya jg frasa 2-3 kata
 * "Good Morning"/"Excuse Me", bukan kata benda tunggal) & `perasaanku`
 * (konsep EMOSI abstrak — semua sumber yg diriset & urutan Vocab-nya sendiri
 * menaruh kategori ini PALING TERAKHIR/tersulit di tangga Little Stars,
 * disisakan utk sesi mendatang kalau mau digenapkan lebih jauh). ZERO
 * perubahan mekanik/tipe data — 9 topik baru cuma `ReadingWordItem[]`
 * (en/id/emoji) via copy-paste 1:1 dari item Vocab yang sudah divalidasi,
 * murni kerja data.
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
  {
    id: 'kata-warna',
    title: 'Membaca Kata: Warna (Reading Color Words)',
    scene: '🔴',
    desc: '10 kata',
    items: [
      { en: 'Red', id: 'Merah', emoji: '🔴' },
      { en: 'Blue', id: 'Biru', emoji: '🔵' },
      { en: 'Yellow', id: 'Kuning', emoji: '🟡' },
      { en: 'Green', id: 'Hijau', emoji: '🟢' },
      { en: 'Orange', id: 'Oranye', emoji: '🟠' },
      { en: 'Purple', id: 'Ungu', emoji: '🟣' },
      { en: 'Pink', id: 'Merah Muda', emoji: '🩷' },
      { en: 'Black', id: 'Hitam', emoji: '⚫' },
      { en: 'White', id: 'Putih', emoji: '⚪' },
      { en: 'Brown', id: 'Cokelat', emoji: '🟤' },
    ],
  },
  {
    id: 'kata-angka',
    title: 'Membaca Kata: Angka (Reading Number Words)',
    scene: '🔢',
    desc: '10 kata',
    items: [
      { en: 'One', id: 'Satu', emoji: '1️⃣' },
      { en: 'Two', id: 'Dua', emoji: '2️⃣' },
      { en: 'Three', id: 'Tiga', emoji: '3️⃣' },
      { en: 'Four', id: 'Empat', emoji: '4️⃣' },
      { en: 'Five', id: 'Lima', emoji: '5️⃣' },
      { en: 'Six', id: 'Enam', emoji: '6️⃣' },
      { en: 'Seven', id: 'Tujuh', emoji: '7️⃣' },
      { en: 'Eight', id: 'Delapan', emoji: '8️⃣' },
      { en: 'Nine', id: 'Sembilan', emoji: '9️⃣' },
      { en: 'Ten', id: 'Sepuluh', emoji: '🔟' },
    ],
  },
  {
    id: 'kata-bentuk',
    title: 'Membaca Kata: Bentuk (Reading Shape Words)',
    scene: '⭐',
    desc: '10 kata',
    items: [
      { en: 'Circle', id: 'Lingkaran', emoji: '⚪' },
      { en: 'Square', id: 'Persegi', emoji: '⬜' },
      { en: 'Triangle', id: 'Segitiga', emoji: '🔺' },
      { en: 'Star', id: 'Bintang', emoji: '⭐' },
      { en: 'Heart', id: 'Hati', emoji: '❤️' },
      { en: 'Diamond', id: 'Berlian', emoji: '🔷' },
      { en: 'Oval', id: 'Oval', emoji: '🥚' },
      { en: 'Cross', id: 'Silang', emoji: '➕' },
      { en: 'Arrow', id: 'Panah', emoji: '➡️' },
      { en: 'Moon', id: 'Bulan', emoji: '🌙' },
    ],
  },
  {
    id: 'kata-keluarga',
    title: 'Membaca Kata: Keluarga (Reading Family Words)',
    scene: '👨‍👩‍👧‍👦',
    desc: '10 kata',
    items: [
      { en: 'Mom', id: 'Mama', emoji: '👩' },
      { en: 'Dad', id: 'Papa', emoji: '👨' },
      { en: 'Baby', id: 'Bayi', emoji: '👶' },
      { en: 'Sister', id: 'Kakak/Adik Perempuan', emoji: '👧' },
      { en: 'Brother', id: 'Kakak/Adik Laki-laki', emoji: '👦' },
      { en: 'Grandma', id: 'Nenek', emoji: '👵' },
      { en: 'Grandpa', id: 'Kakek', emoji: '👴' },
      { en: 'Aunt', id: 'Bibi', emoji: '👩‍🦱' },
      { en: 'Uncle', id: 'Paman', emoji: '🧔' },
      { en: 'Family', id: 'Keluarga', emoji: '👨‍👩‍👧‍👦' },
    ],
  },
  {
    id: 'kata-tubuh',
    title: 'Membaca Kata: Tubuh (Reading Body Words)',
    scene: '🙂',
    desc: '10 kata',
    items: [
      { en: 'Head', id: 'Kepala', emoji: '🙂' },
      { en: 'Shoulders', id: 'Bahu', emoji: '🤷' },
      { en: 'Knees', id: 'Lutut', emoji: '🦵' },
      { en: 'Toes', id: 'Jari Kaki', emoji: '🦶' },
      { en: 'Eyes', id: 'Mata', emoji: '👀' },
      { en: 'Ears', id: 'Telinga', emoji: '👂' },
      { en: 'Nose', id: 'Hidung', emoji: '👃' },
      { en: 'Mouth', id: 'Mulut', emoji: '👄' },
      { en: 'Hands', id: 'Tangan', emoji: '🙌' },
      { en: 'Hair', id: 'Rambut', emoji: '💇' },
    ],
  },
  {
    id: 'kata-buah',
    title: 'Membaca Kata: Buah (Reading Fruit Words)',
    scene: '🍎',
    desc: '10 kata',
    items: [
      { en: 'Apple', id: 'Apel', emoji: '🍎' },
      { en: 'Banana', id: 'Pisang', emoji: '🍌' },
      { en: 'Orange', id: 'Jeruk', emoji: '🍊' },
      { en: 'Grape', id: 'Anggur', emoji: '🍇' },
      { en: 'Watermelon', id: 'Semangka', emoji: '🍉' },
      { en: 'Strawberry', id: 'Stroberi', emoji: '🍓' },
      { en: 'Mango', id: 'Mangga', emoji: '🥭' },
      { en: 'Pineapple', id: 'Nanas', emoji: '🍍' },
      { en: 'Pear', id: 'Pir', emoji: '🍐' },
      { en: 'Peach', id: 'Persik', emoji: '🍑' },
    ],
  },
  {
    id: 'kata-mainan',
    title: 'Membaca Kata: Mainan (Reading Toy Words)',
    scene: '🧸',
    desc: '10 kata',
    items: [
      { en: 'Ball', id: 'Bola', emoji: '⚽' },
      { en: 'Doll', id: 'Boneka', emoji: '🪆' },
      { en: 'Kite', id: 'Layangan', emoji: '🪁' },
      { en: 'Balloon', id: 'Balon', emoji: '🎈' },
      { en: 'Puzzle', id: 'Puzzle', emoji: '🧩' },
      { en: 'Robot', id: 'Robot', emoji: '🤖' },
      { en: 'Drum', id: 'Drum', emoji: '🥁' },
      { en: 'Blocks', id: 'Balok', emoji: '🧱' },
      { en: 'Yoyo', id: 'Yoyo', emoji: '🪀' },
      { en: 'Teddy', id: 'Boneka Beruang', emoji: '🧸' },
    ],
  },
  {
    id: 'kata-pakaian',
    title: 'Membaca Kata: Pakaian (Reading Clothes Words)',
    scene: '👕',
    desc: '10 kata',
    items: [
      { en: 'Shirt', id: 'Baju', emoji: '👕' },
      { en: 'Pants', id: 'Celana Panjang', emoji: '👖' },
      { en: 'Shoes', id: 'Sepatu', emoji: '👟' },
      { en: 'Socks', id: 'Kaos Kaki', emoji: '🧦' },
      { en: 'Hat', id: 'Topi', emoji: '🧢' },
      { en: 'Dress', id: 'Gaun', emoji: '👗' },
      { en: 'Jacket', id: 'Jaket', emoji: '🧥' },
      { en: 'Shorts', id: 'Celana Pendek', emoji: '🩳' },
      { en: 'Gloves', id: 'Sarung Tangan', emoji: '🧤' },
      { en: 'Scarf', id: 'Syal', emoji: '🧣' },
    ],
  },
  {
    id: 'kata-kendaraan',
    title: 'Membaca Kata: Kendaraan (Reading Vehicle Words)',
    scene: '🚗',
    desc: '10 kata',
    items: [
      { en: 'Car', id: 'Mobil', emoji: '🚗' },
      { en: 'Bus', id: 'Bus', emoji: '🚌' },
      { en: 'Bike', id: 'Sepeda', emoji: '🚲' },
      { en: 'Train', id: 'Kereta', emoji: '🚆' },
      { en: 'Airplane', id: 'Pesawat', emoji: '✈️' },
      { en: 'Boat', id: 'Perahu', emoji: '⛵' },
      { en: 'Truck', id: 'Truk', emoji: '🚚' },
      { en: 'Fire Truck', id: 'Truk Pemadam', emoji: '🚒' },
      { en: 'Ambulance', id: 'Ambulans', emoji: '🚑' },
      { en: 'Helicopter', id: 'Helikopter', emoji: '🚁' },
    ],
  },
];

/**
 * Reading Starter (5–7 th) — TETAP format KEDUA (`ReadingWordTopic`), BUKAN
 * format baru (`materi/reading.md` §9.1) — riset mengonfirmasi Kurikulum
 * Merdeka Fase A (kelas 1–2) masih "teks dibacakan guru", bukan baca
 * mandiri, jadi Starter cuma naik UNIT dari kata tunggal (Little Stars) ke
 * FRASA pendek (2–3 kata) — mekanik & fungsi render 100% sama, TTS TETAP
 * jadi bantuan aktif (jangan dicabut). 10 frasa dipetakan dari
 * `VOCAB_TOPICS_STARTER` topik `tempat-di-sekitar` (preposisi+the+tempat,
 * panjang konsisten, emoji tempat sangat khas/tidak ambigu).
 *
 * **Digenapkan 1→10 topik** (target CLAUDE.md ≥10/skill, permintaan user
 * "materi reading di starter masih 1... buatkan minimal 10... research ke
 * lembaga bahasa inggris dalam negeri" — riset dikonfirmasi ulang, pola sama
 * `materi/reading.md` §13: TIDAK ada institusi/kompetitor yg menyarankan
 * urutan kategori beda dari yg sudah dipakai `VOCAB_TOPICS_STARTER`, jadi
 * PERLUASAN yg tepat murni GENAPKAN 9 domain Vocab Starter yg belum
 * disentuh Reading — SEMUA 9 domain dipakai (0 domain dilewati, beda dari
 * Little Stars yg py 2 domain `iconAmbiguous`/terlalu abstrak — Vocab
 * Starter TIDAK py flag `iconAmbiguous` di domain manapun, aman dipakai
 * semua) — 9 topik baru: `baca-angka`/`baca-hari`/`baca-serangga`/`baca-
 * makanan`/`baca-barang`/`baca-sekolah`/`baca-orang`/`baca-alam`/`baca-
 * hobi`, dipetakan dari `angka-11-20`/`hari-dalam-seminggu`/`serangga`/
 * `makanan-favoritku`/`barang-di-rumah`/`di-sekolah`/`orang-di-sekitarku`/
 * `alam-sekitar`/`hobi`. **Frasa 2-3 kata DIKONSTRUKSI natural per-item**
 * (bukan cuma copy `item.en` mentah spt Little Stars, krn Starter emang
 * wajib naik ke unit FRASA) — pola bervariasi per domain sesuai kealamian
 * bahasa Inggrisnya sendiri (sama prinsip `baca-tempat` yg SUDAH mencampur
 * "At The X" & "On The X" dalam 1 topik, bukan 1 template kaku): `The X`
 * (benda/makhluk — serangga/barang-di-rumah/alam/sebagian orang), `I Like X`
 * (makanan/hobi, REUSE PERSIS `item.example.en` yg sudah ada tanpa titik),
 * `My X` (hal personal — teman/kotak bekal/seragam/PR/tetangga/sahabat),
 * `On Day` (7 nama hari) + `I Play(ed) Today/Tomorrow/Yesterday` (3 kata
 * waktu relatif, tense disesuaikan biar tetap gramatikal: present utk
 * today/tomorrow, past utk yesterday), `<Angka> <Benda Jamak>` (reuse kata
 * benda dari `item.example.en` masing² angka, mis. "Eleven Stickers"). ZERO
 * kosakata baru diauthoring — semua kata sumbernya SUDAH ada di Vocab
 * Starter, cuma dirangkai jadi frasa baca.
 */
export const READING_TOPICS_STARTER: ReadingWordTopic[] = [
  {
    id: 'baca-tempat',
    title: 'Membaca Frasa: Tempat (Reading Place Phrases)',
    scene: '🏞️',
    desc: '10 frasa',
    items: [
      { en: 'At The Park', id: 'Di Taman', emoji: '🏞️' },
      { en: 'At The Zoo', id: 'Di Kebun Binatang', emoji: '🦓' },
      { en: 'At The Beach', id: 'Di Pantai', emoji: '🏖️' },
      { en: 'At The Market', id: 'Di Pasar', emoji: '🛒' },
      { en: 'At The Hospital', id: 'Di Rumah Sakit', emoji: '🏥' },
      { en: 'On The Farm', id: 'Di Ladang', emoji: '🚜' },
      { en: 'On The Bridge', id: 'Di Jembatan', emoji: '🌉' },
      { en: 'At The Playground', id: 'Di Taman Bermain', emoji: '🛝' },
      { en: 'On The Street', id: 'Di Jalan', emoji: '🛣️' },
      { en: 'On The Mountain', id: 'Di Gunung', emoji: '⛰️' },
    ],
  },
  {
    id: 'baca-angka',
    title: 'Membaca Frasa: Angka (Reading Number Phrases)',
    scene: '1️⃣1️⃣',
    desc: '10 frasa',
    items: [
      { en: 'Eleven Stickers', id: 'Sebelas Stiker', emoji: '1️⃣1️⃣' },
      { en: 'Twelve Apples', id: 'Dua Belas Apel', emoji: '1️⃣2️⃣' },
      { en: 'Thirteen Balloons', id: 'Tiga Belas Balon', emoji: '1️⃣3️⃣' },
      { en: 'Fourteen Birds', id: 'Empat Belas Burung', emoji: '1️⃣4️⃣' },
      { en: 'Fifteen Candies', id: 'Lima Belas Permen', emoji: '1️⃣5️⃣' },
      { en: 'Sixteen Ants', id: 'Enam Belas Semut', emoji: '1️⃣6️⃣' },
      { en: 'Seventeen Coins', id: 'Tujuh Belas Koin', emoji: '1️⃣7️⃣' },
      { en: 'Eighteen Flowers', id: 'Delapan Belas Bunga', emoji: '1️⃣8️⃣' },
      { en: 'Nineteen Crackers', id: 'Sembilan Belas Biskuit', emoji: '1️⃣9️⃣' },
      { en: 'Twenty Fish', id: 'Dua Puluh Ikan', emoji: '2️⃣0️⃣' },
    ],
  },
  {
    id: 'baca-hari',
    title: 'Membaca Frasa: Hari (Reading Day Phrases)',
    scene: '🏫',
    desc: '10 frasa',
    items: [
      { en: 'On Monday', id: 'Hari Senin', emoji: '🏫' },
      { en: 'On Tuesday', id: 'Hari Selasa', emoji: '🎨' },
      { en: 'On Wednesday', id: 'Hari Rabu', emoji: '🎵' },
      { en: 'On Thursday', id: 'Hari Kamis', emoji: '⚽' },
      { en: 'On Friday', id: 'Hari Jumat', emoji: '🎈' },
      { en: 'On Saturday', id: 'Hari Sabtu', emoji: '🎉' },
      { en: 'On Sunday', id: 'Hari Minggu', emoji: '🌳' },
      { en: 'I Play Today', id: 'Aku Bermain Hari Ini', emoji: '👉' },
      { en: 'I Play Tomorrow', id: 'Aku Bermain Besok', emoji: '🌅' },
      { en: 'I Played Yesterday', id: 'Aku Bermain Kemarin', emoji: '🌇' },
    ],
  },
  {
    id: 'baca-serangga',
    title: 'Membaca Frasa: Serangga (Reading Insect Phrases)',
    scene: '🦋',
    desc: '10 frasa',
    items: [
      { en: 'The Butterfly', id: 'Kupu-kupu Itu', emoji: '🦋' },
      { en: 'The Bee', id: 'Lebah Itu', emoji: '🐝' },
      { en: 'The Ant', id: 'Semut Itu', emoji: '🐜' },
      { en: 'The Ladybug', id: 'Kepik Itu', emoji: '🐞' },
      { en: 'The Spider', id: 'Laba-laba Itu', emoji: '🕷️' },
      { en: 'The Snail', id: 'Siput Itu', emoji: '🐌' },
      { en: 'The Frog', id: 'Katak Itu', emoji: '🐸' },
      { en: 'The Turtle', id: 'Kura-kura Itu', emoji: '🐢' },
      { en: 'The Crab', id: 'Kepiting Itu', emoji: '🦀' },
      { en: 'The Worm', id: 'Cacing Itu', emoji: '🪱' },
    ],
  },
  {
    id: 'baca-makanan',
    title: 'Membaca Frasa: Makanan (Reading Food Phrases)',
    scene: '🍕',
    desc: '10 frasa',
    items: [
      { en: 'I Like Pizza', id: 'Aku Suka Pizza', emoji: '🍕' },
      { en: 'I Like Burger', id: 'Aku Suka Burger', emoji: '🍔' },
      { en: 'I Like Sandwich', id: 'Aku Suka Sandwich', emoji: '🥪' },
      { en: 'I Like Ice Cream', id: 'Aku Suka Es Krim', emoji: '🍦' },
      { en: 'I Like Cake', id: 'Aku Suka Kue', emoji: '🍰' },
      { en: 'I Like Cookie', id: 'Aku Suka Biskuit', emoji: '🍪' },
      { en: 'I Like Chocolate', id: 'Aku Suka Cokelat', emoji: '🍫' },
      { en: 'I Like Cheese', id: 'Aku Suka Keju', emoji: '🧀' },
      { en: 'I Like Juice', id: 'Aku Suka Jus', emoji: '🧃' },
      { en: 'I Like Yogurt', id: 'Aku Suka Yogurt', emoji: '🥣' },
    ],
  },
  {
    id: 'baca-barang',
    title: 'Membaca Frasa: Barang di Rumah (Reading Home Item Phrases)',
    scene: '🛏️',
    desc: '10 frasa',
    items: [
      { en: 'The Table', id: 'Meja Itu', emoji: '🍽️' },
      { en: 'The Bed', id: 'Tempat Tidur Itu', emoji: '🛏️' },
      { en: 'The Sofa', id: 'Sofa Itu', emoji: '🛋️' },
      { en: 'The Lamp', id: 'Lampu Itu', emoji: '💡' },
      { en: 'The Television', id: 'Televisi Itu', emoji: '📺' },
      { en: 'The Fridge', id: 'Kulkas Itu', emoji: '🧊' },
      { en: 'The Mirror', id: 'Cermin Itu', emoji: '🪞' },
      { en: 'The Phone', id: 'Telepon Itu', emoji: '📱' },
      { en: 'The Cupboard', id: 'Lemari Itu', emoji: '🗄️' },
      { en: 'The Broom', id: 'Sapu Itu', emoji: '🧹' },
    ],
  },
  {
    id: 'baca-sekolah',
    title: 'Membaca Frasa: Di Sekolah (Reading School Phrases)',
    scene: '🏫',
    desc: '10 frasa',
    items: [
      { en: 'The Coach', id: 'Pelatih Itu', emoji: '📣' },
      { en: 'The Classroom', id: 'Ruang Kelas Itu', emoji: '🏫' },
      { en: 'My Friend', id: 'Temanku', emoji: '🧑‍🤝‍🧑' },
      { en: 'The Principal', id: 'Kepala Sekolah Itu', emoji: '🧑‍💼' },
      { en: 'The Library', id: 'Perpustakaan Itu', emoji: '📚' },
      { en: 'My Lunchbox', id: 'Kotak Bekalku', emoji: '🍱' },
      { en: 'My Uniform', id: 'Seragamku', emoji: '👕' },
      { en: 'The Bell', id: 'Bel Itu', emoji: '🔔' },
      { en: 'My Homework', id: 'PR-ku', emoji: '📓' },
      { en: 'At Recess', id: 'Saat Istirahat', emoji: '🥪' },
    ],
  },
  {
    id: 'baca-orang',
    title: 'Membaca Frasa: Orang di Sekitarku (Reading People Phrases)',
    scene: '🧑‍🎓',
    desc: '10 frasa',
    items: [
      { en: 'My Neighbor', id: 'Tetanggaku', emoji: '🏘️' },
      { en: 'My Classmate', id: 'Teman Sekelasku', emoji: '🧑‍🎓' },
      { en: 'The Boy', id: 'Anak Laki-laki Itu', emoji: '👦' },
      { en: 'The Girl', id: 'Anak Perempuan Itu', emoji: '👧' },
      { en: 'The Man', id: 'Pria Itu', emoji: '👨' },
      { en: 'The Woman', id: 'Wanita Itu', emoji: '👩' },
      { en: 'The Baby', id: 'Bayi Itu', emoji: '👶' },
      { en: 'The Driver', id: 'Supir Itu', emoji: '🚕' },
      { en: 'My Best Friend', id: 'Sahabatku', emoji: '🤝' },
      { en: 'My Twin', id: 'Kembaranku', emoji: '👯' },
    ],
  },
  {
    id: 'baca-alam',
    title: 'Membaca Frasa: Alam (Reading Nature Phrases)',
    scene: '🌳',
    desc: '10 frasa',
    items: [
      { en: 'The Sun', id: 'Matahari Itu', emoji: '☀️' },
      { en: 'The Moon', id: 'Bulan Itu', emoji: '🌙' },
      { en: 'The Sky', id: 'Langit Itu', emoji: '🌤️' },
      { en: 'The Cloud', id: 'Awan Itu', emoji: '☁️' },
      { en: 'The Tree', id: 'Pohon Itu', emoji: '🌳' },
      { en: 'The Flower', id: 'Bunga Itu', emoji: '🌸' },
      { en: 'The Grass', id: 'Rumput Itu', emoji: '🌿' },
      { en: 'The River', id: 'Sungai Itu', emoji: '🌊' },
      { en: 'The Stone', id: 'Batu Itu', emoji: '🪨' },
      { en: 'The Star', id: 'Bintang Itu', emoji: '⭐' },
    ],
  },
  {
    id: 'baca-hobi',
    title: 'Membaca Frasa: Hobi (Reading Hobby Phrases)',
    scene: '🎨',
    desc: '10 frasa',
    items: [
      { en: 'I Like Drawing', id: 'Aku Suka Menggambar', emoji: '🎨' },
      { en: 'I Like Singing', id: 'Aku Suka Bernyanyi', emoji: '🎤' },
      { en: 'I Like Reading', id: 'Aku Suka Membaca', emoji: '📖' },
      { en: 'I Like Painting', id: 'Aku Suka Melukis', emoji: '🖌️' },
      { en: 'I Like Cooking', id: 'Aku Suka Memasak', emoji: '🍳' },
      { en: 'I Like Camping', id: 'Aku Suka Berkemah', emoji: '⛺' },
      { en: 'I Like Fishing', id: 'Aku Suka Memancing', emoji: '🎣' },
      { en: 'I Like Gardening', id: 'Aku Suka Berkebun', emoji: '🌱' },
      { en: 'I Like Collecting', id: 'Aku Suka Mengoleksi', emoji: '🪙' },
      { en: 'I Like Building', id: 'Aku Suka Membangun', emoji: '🧱' },
    ],
  },
];

/**
 * Reading Achiever (11–13 th) — TETAP format LAMA `ReadingTopic` (persis tipe
 * Adventurer, TIDAK ada tipe baru), krn riset (`materi/reading.md` §9.4)
 * bilang "Format C+" achiever DNA-nya sama dgn format Adventurer, cukup naik
 * INTENSITAS lewat konten, bukan mekanik baru: (1) passage lebih panjang
 * (`story` 4-5 kalimat, naik dari 3 kalimat Adventurer), (2) `question`
 * WAJIB pertanyaan INFERENSI (butuh gabungkan >1 info dari story, bukan
 * fakta 1-kalimat literal spt Adventurer) — jembatan menuju Fase D/
 * Trailblazer. Tipe soal cloze-dalam-passage (disebut riset sbg pelengkap
 * opsional) SENGAJA belum dibangun sesi ini (di luar scope "reuse tipe
 * existing", `materi/reading.md` §7 gap) — 1 topik pembuka dulu, sama pola
 * bootstrap dgn Little Stars/Starter/Explorer.
 *
 * **Digenapkan 1→10 topik** (target CLAUDE.md ≥10/skill, permintaan user
 * "materi reading di achiver masih 1... buatkan minimal 10... research ke
 * lembaga bahasa inggris dalam negeri" — riset konfirmasi EF Indonesia
 * Trailblazers (10-14 th, irisan Achiever) & Kumon EFL: keduanya eksplisit
 * fokus "topik relevan kehidupan nyata" + critical thinking, cocok dgn arah
 * yg sudah dipilih §9.4, `materi/reading.md` §17) — 9 topik baru skenario
 * remaja 11-13 th, masing² dipetakan dari 1 domain `VOCAB_TOPICS_ACHIEVER`
 * (`ciri-ciri-fisik`/`tempat-di-kota`/`arah-posisi`/`hiburan-waktu-luang`/
 * `kata-kerja-lanjutan`/`teknologi-internet`/`sifat-kepribadian`/`mata-
 * pelajaran`/`angka-puluhan` — 9 dari 10 domain, `sifat-benda-lanjutan`
 * SENGAJA dilewati krn paling sulit dirangkai jadi narasi personal
 * dibanding 9 domain lain, disisakan sbg opsi kalau mau digenapkan lebih
 * jauh). SEMUA 9 topik konsisten format "C+" §9.4: `story` 4 kalimat +
 * `question` akhir WAJIB INFERENSI (jawaban TIDAK PERNAH ditulis literal,
 * anak gabungkan ≥2 info dari primer/drill/story — pola sama `hari-piknik`,
 * mis. `menggalang-dana-sekolah` minta anak MENGHITUNG SENDIRI 90rb+10×1rb
 * = 100rb utk simpulkan target tercapai, bukan sekadar re-baca fakta).
 */
export const READING_TOPICS_ACHIEVER: ReadingTopic[] = [
  {
    id: 'hari-piknik',
    title: 'Hari Piknik (Picnic Day)',
    scene: '🧺',
    desc: '2 bacaan pendek',
    primer: [
      { passage: ['Lani plans a picnic with her cousins.', 'She packs sandwiches, juice, and a big blanket.'], id: 'Lani merencanakan piknik dengan sepupu-sepupunya. Dia mengemas sandwich, jus, dan selimut besar.' },
      { passage: ['They choose a park near the river.', 'The park has tall trees for shade.'], id: 'Mereka memilih taman dekat sungai. Tamannya punya pohon tinggi untuk keteduhan.' },
    ],
    // Sama pola anti-tebak dgn topik Adventurer (distraktor jg disebut di
    // teks, dilekatkan ke hal LAIN) — di sini distraktornya jg dipakai utk
    // "naikkan intensitas" (info yang relevan tidak selalu di kalimat
    // pertama, anak harus baca semua baris dulu).
    drill: [
      {
        passage: ['Lani wants to sit under the big tree, but her cousin Budi prefers the open grass.', 'In the end, they spread the blanket under the tree because the sun is too hot.'],
        id: 'Lani ingin duduk di bawah pohon besar, tapi sepupunya Budi lebih suka rumput terbuka. Akhirnya, mereka menggelar selimut di bawah pohon karena mataharinya terlalu terik.',
        question: 'Where do they finally spread the blanket?',
        questionId: 'Di mana akhirnya mereka menggelar selimut?',
        opts: [{ emoji: '🌳', lbl: 'Under the tree', ok: true }, { emoji: '🌱', lbl: 'On the open grass' }, { emoji: '🏠', lbl: 'Inside the house' }],
      },
      {
        passage: ['Budi brings a kite, and Lani brings a ball.', 'After lunch, the wind is strong, so they decide to fly the kite first.'],
        id: 'Budi membawa layangan, dan Lani membawa bola. Setelah makan siang, anginnya kencang, jadi mereka memutuskan menerbangkan layangan dulu.',
        question: 'What do they play first after lunch?',
        questionId: 'Apa yang mereka mainkan lebih dulu setelah makan siang?',
        opts: [{ emoji: '🪁', lbl: 'The kite', ok: true }, { emoji: '⚽', lbl: 'The ball' }, { emoji: '🎨', lbl: 'Drawing' }],
      },
    ],
    story: [
      'Lani and her cousins arrive at the park at nine in the morning.',
      'They play by the river until they feel hungry.',
      'When they open the basket, the sandwiches are gone — a group of ducks is walking away happily nearby.',
      'Lani laughs and says they will bring a covered basket next time.',
    ],
    storyId: 'Lani dan sepupu-sepupunya tiba di taman pukul sembilan pagi. Mereka bermain di dekat sungai sampai merasa lapar. Ketika membuka keranjang, sandwichnya sudah hilang — sekelompok bebek berjalan pergi dengan riang di dekat situ. Lani tertawa dan berkata mereka akan membawa keranjang bertutup lain kali.',
    // Pertanyaan INFERENSI (permintaan riset §9.4) — jawabannya TIDAK
    // disebutkan literal di story manapun ("ducks ate the sandwiches" tidak
    // pernah ditulis), anak harus GABUNGKAN 2 info (basket kosong + bebek
    // jalan pergi di dekatnya) buat menyimpulkan sendiri.
    question: {
      text: 'What most likely happened to the sandwiches?',
      id: 'Apa yang kemungkinan besar terjadi pada sandwich-nya?',
      opts: [{ emoji: '🦆', lbl: 'The ducks ate them', ok: true }, { emoji: '🎒', lbl: 'Lani forgot to pack them' }, { emoji: '🏠', lbl: 'They left them at home' }],
    },
  },
  {
    id: 'mencari-sahabat-pena',
    title: 'Mencari Sahabat Pena (Finding a Pen Pal)',
    scene: '🧳',
    desc: '2 bacaan pendek',
    primer: [
      { passage: ['Rani is waiting at the airport to meet her pen pal, Emma, for the first time.', 'She has never seen Emma’s photo, only read her letters.'], id: 'Rani menunggu di bandara untuk bertemu sahabat penanya, Emma, untuk pertama kalinya. Dia belum pernah melihat foto Emma, cuma membaca surat-suratnya.' },
      { passage: ['Emma wrote that she has curly hair and is quite tall.', 'Rani looks around at the crowd of passengers.'], id: 'Emma menulis bahwa dia punya rambut keriting dan cukup tinggi. Rani melihat sekeliling kerumunan penumpang.' },
    ],
    drill: [
      {
        passage: ['Two girls with curly hair walk out of the arrival gate.', 'One girl is tall and one girl is quite short.'],
        id: 'Dua anak perempuan berambut keriting keluar dari gerbang kedatangan. Satu anak tinggi dan satu anak agak pendek.',
        question: 'Which girl matches Emma’s letter?',
        questionId: 'Anak perempuan mana yang cocok dengan surat Emma?',
        opts: [{ emoji: '👧', lbl: 'The tall girl', ok: true }, { emoji: '👧', lbl: 'The short girl' }, { emoji: '👦', lbl: 'A boy nearby' }],
      },
      {
        passage: ['The tall girl waves and smiles at Rani.', 'She is wearing a bright yellow backpack, just like in her last letter.'],
        id: 'Anak perempuan tinggi itu melambai dan tersenyum ke Rani. Dia memakai tas ransel kuning cerah, persis seperti di surat terakhirnya.',
        question: 'What color is the girl’s backpack?',
        questionId: 'Apa warna tas ransel anak perempuan itu?',
        opts: [{ emoji: '🟡', lbl: 'Yellow', ok: true }, { emoji: '🔵', lbl: 'Blue' }, { emoji: '🔴', lbl: 'Red' }],
      },
    ],
    story: [
      'Rani walks closer and says hello, but the girl laughs and says her name is Sarah, not Emma.',
      'A little confused, Rani checks her phone and rereads Emma’s last letter.',
      'She then notices a girl nearby holding a notebook with the exact same neat handwriting from the letter.',
      'Rani walks over immediately, and the girl looks up and says, “You must be Rani!”',
    ],
    storyId: 'Rani mendekat dan menyapa, tapi anak itu tertawa dan bilang namanya Sarah, bukan Emma. Agak bingung, Rani memeriksa ponselnya dan membaca ulang surat terakhir Emma. Lalu dia melihat seorang anak perempuan di dekatnya memegang buku catatan dengan tulisan tangan rapi yang persis sama dari surat itu. Rani langsung menghampirinya, dan anak itu mendongak dan bilang, "Kamu pasti Rani!"',
    question: {
      text: 'How does Rani figure out who Emma really is?',
      id: 'Bagaimana Rani akhirnya tahu siapa Emma sebenarnya?',
      opts: [{ emoji: '✍️', lbl: 'She recognizes the handwriting', ok: true }, { emoji: '🎒', lbl: 'She recognizes the backpack' }, { emoji: '👧', lbl: 'She recognizes the curly hair' }],
    },
  },
  {
    id: 'jalan-jalan-di-kota',
    title: 'Jalan-jalan di Kota (A Day Around Town)',
    scene: '🏙️',
    desc: '2 bacaan pendek',
    primer: [
      { passage: ['Dimas and his dad run errands around town on Saturday.', 'Their first stop is the bank to withdraw some money.'], id: 'Dimas dan ayahnya mengurus keperluan di kota hari Sabtu. Perhentian pertama mereka adalah bank untuk mengambil uang.' },
      { passage: ['Next, they walk to the post office to send a package.', 'The post office is very crowded today.'], id: 'Selanjutnya, mereka berjalan ke kantor pos untuk mengirim paket. Kantor posnya sangat ramai hari ini.' },
    ],
    drill: [
      {
        passage: ['After the post office, Dimas wants to visit the museum, but his dad needs to go to the supermarket first.', 'They agree to go to the supermarket first since it closes earlier.'],
        id: 'Setelah kantor pos, Dimas ingin mengunjungi museum, tapi ayahnya perlu ke supermarket dulu. Mereka sepakat ke supermarket dulu karena tutup lebih awal.',
        question: 'Where do they go first, the museum or the supermarket?',
        questionId: 'Ke mana mereka pergi duluan, museum atau supermarket?',
        opts: [{ emoji: '🏬', lbl: 'The supermarket', ok: true }, { emoji: '🏛️', lbl: 'The museum' }, { emoji: '🏦', lbl: 'The bank' }],
      },
      {
        passage: ['At the supermarket, dad buys bread, milk, and eggs.', 'Dimas picks out his favorite cereal to add to the cart.'],
        id: 'Di supermarket, ayah membeli roti, susu, dan telur. Dimas memilih sereal favoritnya untuk ditambahkan ke troli.',
        question: 'What does Dimas add to the cart?',
        questionId: 'Apa yang ditambahkan Dimas ke troli?',
        opts: [{ emoji: '🥣', lbl: 'Cereal', ok: true }, { emoji: '🍞', lbl: 'Bread' }, { emoji: '🥛', lbl: 'Milk' }],
      },
    ],
    story: [
      'By the time they finish shopping, it is almost four o’clock.',
      'Dimas looks at the museum’s opening hours printed on a flyer in his pocket — it closes at four thirty.',
      'Dad checks his watch and starts walking very quickly toward the car.',
      'Dimas grins and grabs his backpack, running to catch up.',
    ],
    storyId: 'Saat mereka selesai belanja, waktu sudah hampir jam empat. Dimas melihat jam buka museum yang tercetak di selebaran di sakunya — tutup jam empat setengah. Ayah melihat jamnya dan mulai berjalan sangat cepat menuju mobil. Dimas tersenyum lebar dan meraih ranselnya, berlari untuk mengejar.',
    question: {
      text: 'Why does dad start walking quickly?',
      id: 'Kenapa ayah mulai berjalan cepat?',
      opts: [{ emoji: '🏛️', lbl: 'They might still make it to the museum', ok: true }, { emoji: '🚗', lbl: 'The car is about to be towed' }, { emoji: '🌧️', lbl: 'It is starting to rain' }],
    },
  },
  {
    id: 'mencari-alamat',
    title: 'Mencari Alamat (Finding the Address)',
    scene: '🧭',
    desc: '2 bacaan pendek',
    primer: [
      { passage: ['Sinta is looking for her new friend’s house for the first time.', 'She has the address written on a small piece of paper.'], id: 'Sinta sedang mencari rumah teman barunya untuk pertama kalinya. Dia punya alamatnya tertulis di secarik kertas kecil.' },
      { passage: ['The house is near the corner of Melati Street.', 'Sinta checks a map on her phone.'], id: 'Rumahnya dekat sudut Jalan Melati. Sinta memeriksa peta di ponselnya.' },
    ],
    drill: [
      {
        passage: ['A man tells Sinta to go straight and then turn left at the corner.', 'Sinta thanks him and follows his directions carefully.'],
        id: 'Seorang pria memberi tahu Sinta untuk jalan lurus lalu belok kiri di sudut. Sinta berterima kasih dan mengikuti arahannya dengan hati-hati.',
        question: 'Which way does Sinta turn at the corner?',
        questionId: 'Ke arah mana Sinta belok di sudut itu?',
        opts: [{ emoji: '⬅️', lbl: 'Left', ok: true }, { emoji: '➡️', lbl: 'Right' }, { emoji: '⬆️', lbl: 'Straight' }],
      },
      {
        passage: ['Sinta sees a small bakery on her right and a park on her left.', 'Her friend’s house should be right behind the bakery.'],
        id: 'Sinta melihat toko roti kecil di sebelah kanannya dan taman di sebelah kirinya. Rumah temannya seharusnya persis di belakang toko roti itu.',
        question: 'Where should the friend’s house be?',
        questionId: 'Di mana seharusnya rumah temannya?',
        opts: [{ emoji: '🥖', lbl: 'Behind the bakery', ok: true }, { emoji: '🌳', lbl: 'Inside the park' }, { emoji: '👉', lbl: 'In front of the bakery' }],
      },
    ],
    story: [
      'Sinta walks behind the bakery, but she only sees a tall fence and no houses at all.',
      'She checks her phone map and sees she is standing on “Melati Street”, just like the address says.',
      'A woman walking her dog mentions that there are actually two different streets named Melati in this town — one near the market, and one near the school.',
      'Sinta looks at her friend’s address again: it says “Melati Street, near the school.”',
    ],
    storyId: 'Sinta berjalan ke belakang toko roti, tapi dia cuma melihat pagar tinggi dan tidak ada rumah sama sekali. Dia memeriksa peta ponselnya dan melihat dia sedang berdiri di "Jalan Melati", persis seperti di alamat itu. Seorang wanita yang jalan-jalan dengan anjingnya bilang sebenarnya ada dua jalan berbeda bernama Melati di kota ini — satu dekat pasar, dan satu dekat sekolah. Sinta melihat lagi alamat temannya: tertulis "Jalan Melati, dekat sekolah."',
    question: {
      text: 'Why did Sinta go to the wrong place first?',
      id: 'Kenapa Sinta pergi ke tempat yang salah di awal?',
      opts: [{ emoji: '🛣️', lbl: 'She went to the Melati Street near the market, not the school', ok: true }, { emoji: '📱', lbl: 'Her phone map was broken' }, { emoji: '🐕', lbl: 'A dog led her the wrong way' }],
    },
  },
  {
    id: 'akhir-pekan-di-rumah',
    title: 'Akhir Pekan di Rumah (Weekend at Home)',
    scene: '🎮',
    desc: '2 bacaan pendek',
    primer: [
      { passage: ['It is Saturday, and Bima has no school today.', 'He wants to decide how to spend his free time.'], id: 'Ini hari Sabtu, dan Bima tidak sekolah hari ini. Dia ingin memutuskan bagaimana menghabiskan waktu luangnya.' },
      { passage: ['His sister invites him to play a board game.', 'His friend calls and invites him to play video games instead.'], id: 'Kakaknya mengajaknya main permainan papan. Temannya menelepon dan mengajaknya main gim video sebagai gantinya.' },
    ],
    drill: [
      {
        passage: ['Bima’s sister sets up a chess board on the living room table.', 'She has been practicing every day this week.'],
        id: 'Kakak Bima menyiapkan papan catur di meja ruang tamu. Dia sudah berlatih setiap hari minggu ini.',
        question: 'What game does the sister want to play?',
        questionId: 'Permainan apa yang ingin dimainkan kakaknya?',
        opts: [{ emoji: '♟️', lbl: 'Chess', ok: true }, { emoji: '🕹️', lbl: 'Video game' }, { emoji: '🃏', lbl: 'Cards' }],
      },
      {
        passage: ['Bima’s friend Andi says the new video game has amazing graphics.', 'Andi has already finished two levels by himself.'],
        id: 'Teman Bima, Andi, bilang gim video barunya punya grafis luar biasa. Andi sudah menyelesaikan dua level sendirian.',
        question: 'How many levels has Andi finished?',
        questionId: 'Berapa level yang sudah diselesaikan Andi?',
        opts: [{ emoji: '2️⃣', lbl: 'Two', ok: true }, { emoji: '1️⃣', lbl: 'One' }, { emoji: '3️⃣', lbl: 'Three' }],
      },
    ],
    story: [
      'Bima looks at his sister’s serious face as she arranges the chess pieces.',
      'He remembers that she lost every game to him last month and really wants a rematch.',
      'He also looks at his phone, where Andi is still typing excited messages about the new game.',
      'Bima puts his phone down and sits across from his sister at the chess board.',
    ],
    storyId: 'Bima melihat wajah serius kakaknya saat menyusun bidak caturnya. Dia ingat kakaknya kalah setiap kali main bulan lalu dan sangat ingin tanding ulang. Dia juga melihat ponselnya, tempat Andi masih mengetik pesan-pesan bersemangat tentang gim barunya. Bima meletakkan ponselnya dan duduk di seberang kakaknya di papan catur.',
    question: {
      text: 'Why does Bima decide to play chess with his sister?',
      id: 'Kenapa Bima memutuskan main catur dengan kakaknya?',
      opts: [{ emoji: '♟️', lbl: 'He wants to give her a chance for a rematch', ok: true }, { emoji: '🕹️', lbl: 'The video game stopped working' }, { emoji: '📵', lbl: 'His phone battery died' }],
    },
  },
  {
    id: 'main-petak-umpet',
    title: 'Main Petak Umpet (Playing Hide and Seek)',
    scene: '🙈',
    desc: '2 bacaan pendek',
    primer: [
      { passage: ['Reza and his cousins play hide and seek in the backyard.', 'Reza’s turn is to count while everyone hides.'], id: 'Reza dan sepupu-sepupunya main petak umpet di halaman belakang. Giliran Reza untuk menghitung sementara semua orang bersembunyi.' },
      { passage: ['He closes his eyes and counts to twenty loudly.', 'Everyone runs to find a good hiding spot.'], id: 'Dia menutup matanya dan menghitung sampai dua puluh dengan keras. Semua orang berlari mencari tempat sembunyi yang bagus.' },
    ],
    drill: [
      {
        passage: ['Reza’s cousin Wati climbs up into the mango tree to hide.', 'His other cousin Doni hides behind the water tank instead.'],
        id: 'Sepupu Reza, Wati, memanjat pohon mangga untuk bersembunyi. Sepupunya yang lain, Doni, malah bersembunyi di belakang tandon air.',
        question: 'Where does Wati hide?',
        questionId: 'Di mana Wati bersembunyi?',
        opts: [{ emoji: '🌳', lbl: 'The mango tree', ok: true }, { emoji: '🚰', lbl: 'The water tank' }, { emoji: '🚗', lbl: 'The garage' }],
      },
      {
        passage: ['Reza finds Doni first and shouts his name loudly.', 'Doni laughs and jumps out from behind the water tank.'],
        id: 'Reza menemukan Doni duluan dan berteriak namanya dengan keras. Doni tertawa dan melompat keluar dari belakang tandon air.',
        question: 'Who does Reza find first?',
        questionId: 'Siapa yang ditemukan Reza duluan?',
        opts: [{ emoji: '🧑', lbl: 'Doni', ok: true }, { emoji: '👧', lbl: 'Wati' }, { emoji: '❓', lbl: 'Nobody' }],
      },
    ],
    story: [
      'After finding Doni, Reza searches the whole yard but cannot find Wati anywhere.',
      'Suddenly, he hears someone trying not to laugh, coming from somewhere above him.',
      'He looks up slowly and sees a pair of shoes dangling between the mango tree leaves.',
      'Reza points and shouts, catching Wati completely by surprise.',
    ],
    storyId: 'Setelah menemukan Doni, Reza mencari ke seluruh halaman tapi tidak menemukan Wati di mana pun. Tiba-tiba, dia mendengar seseorang menahan tawa, datang dari suatu tempat di atasnya. Dia mendongak perlahan dan melihat sepasang sepatu menjuntai di antara daun pohon mangga. Reza menunjuk dan berteriak, membuat Wati benar-benar terkejut.',
    question: {
      text: 'How does Reza finally find Wati?',
      id: 'Bagaimana akhirnya Reza menemukan Wati?',
      opts: [{ emoji: '👀', lbl: 'He sees her shoes in the tree and hears her laughing', ok: true }, { emoji: '📣', lbl: 'Wati calls out her own hiding spot' }, { emoji: '⏰', lbl: 'Time runs out and everyone must come out' }],
    },
  },
  {
    id: 'tugas-sekolah-online',
    title: 'Tugas Sekolah Online (Online Homework)',
    scene: '💻',
    desc: '2 bacaan pendek',
    primer: [
      { passage: ['Farah has an English homework assignment due tomorrow.', 'She turns on her computer to start researching.'], id: 'Farah punya tugas Bahasa Inggris yang harus dikumpulkan besok. Dia menyalakan komputernya untuk mulai mencari informasi.' },
      { passage: ['She opens the internet and searches for information about volcanoes.', 'She finds a helpful website with pictures and facts.'], id: 'Dia membuka internet dan mencari informasi tentang gunung berapi. Dia menemukan situs web yang membantu dengan gambar dan fakta.' },
    ],
    drill: [
      {
        passage: ['Farah types her password to log into the school’s online portal.', 'She types it wrong twice before getting it right.'],
        id: 'Farah mengetik kata sandinya untuk masuk ke portal daring sekolah. Dia mengetiknya salah dua kali sebelum akhirnya benar.',
        question: 'How many times does Farah type her password wrong?',
        questionId: 'Berapa kali Farah salah mengetik kata sandinya?',
        opts: [{ emoji: '2️⃣', lbl: 'Two', ok: true }, { emoji: '1️⃣', lbl: 'One' }, { emoji: '3️⃣', lbl: 'Three' }],
      },
      {
        passage: ['Farah downloads a picture of a volcano to use in her homework.', 'She also uploads her finished essay to the school portal.'],
        id: 'Farah mengunduh gambar gunung berapi untuk dipakai di tugasnya. Dia juga mengunggah esainya yang sudah selesai ke portal sekolah.',
        question: 'What does Farah upload to the school portal?',
        questionId: 'Apa yang diunggah Farah ke portal sekolah?',
        opts: [{ emoji: '📝', lbl: 'Her essay', ok: true }, { emoji: '🖼️', lbl: 'A picture' }, { emoji: '🎬', lbl: 'A video' }],
      },
    ],
    story: [
      'Just as Farah finishes typing the last paragraph, her screen suddenly turns black.',
      'She waits a few seconds, but the computer does not turn back on.',
      'Farah remembers she forgot to save her work before the screen went black.',
      'She sighs and starts typing the whole essay again from memory.',
    ],
    storyId: 'Persis saat Farah selesai mengetik paragraf terakhir, layarnya tiba-tiba menghitam. Dia menunggu beberapa detik, tapi komputernya tidak menyala kembali. Farah ingat dia lupa menyimpan pekerjaannya sebelum layarnya menghitam. Dia menghela napas dan mulai mengetik ulang seluruh esainya dari ingatan.',
    question: {
      text: 'Why does Farah have to type her essay again?',
      id: 'Kenapa Farah harus mengetik esainya lagi?',
      opts: [{ emoji: '💾', lbl: 'She did not save her work before the computer turned off', ok: true }, { emoji: '🌋', lbl: 'She wrote about the wrong topic' }, { emoji: '🔑', lbl: 'She forgot her password again' }],
    },
  },
  {
    id: 'murid-baru-di-kelas',
    title: 'Murid Baru di Kelas (The New Student)',
    scene: '🧑‍🎓',
    desc: '2 bacaan pendek',
    primer: [
      { passage: ['A new student named Kevin joins Ayu’s class this week.', 'He sits quietly at the back on his first day.'], id: 'Seorang murid baru bernama Kevin bergabung ke kelas Ayu minggu ini. Dia duduk diam di belakang di hari pertamanya.' },
      { passage: ['Ayu wonders what Kevin is really like.', 'She decides to say hello during recess.'], id: 'Ayu penasaran seperti apa sebenarnya Kevin. Dia memutuskan untuk menyapa saat istirahat.' },
    ],
    drill: [
      {
        passage: ['At recess, Ayu offers Kevin half of her sandwich.', 'Kevin smiles and thanks her politely before eating it.'],
        id: 'Saat istirahat, Ayu menawarkan Kevin setengah sandwichnya. Kevin tersenyum dan berterima kasih dengan sopan sebelum memakannya.',
        question: 'What does Ayu offer Kevin?',
        questionId: 'Apa yang ditawarkan Ayu ke Kevin?',
        opts: [{ emoji: '🥪', lbl: 'Half of her sandwich', ok: true }, { emoji: '🥤', lbl: 'Her drink' }, { emoji: '✏️', lbl: 'Her pencil' }],
      },
      {
        passage: ['A boy accidentally drops his books all over the hallway.', 'Kevin immediately kneels down and helps pick everything up.'],
        id: 'Seorang anak laki-laki tidak sengaja menjatuhkan buku-bukunya di lorong. Kevin langsung berlutut dan membantu mengambil semuanya.',
        question: 'What does Kevin do when the boy drops his books?',
        questionId: 'Apa yang dilakukan Kevin saat anak itu menjatuhkan bukunya?',
        opts: [{ emoji: '🤝', lbl: 'Helps pick them up', ok: true }, { emoji: '😂', lbl: 'Laughs at him' }, { emoji: '🚶', lbl: 'Walks away' }],
      },
    ],
    story: [
      'After school, Ayu tells her mom about the new student.',
      'She describes how Kevin shared his snack with a hungry classmate, and how he helped clean up the classroom without being asked.',
      'Ayu also remembers Kevin patiently explaining a math problem to a confused classmate three times.',
      'Her mom smiles and asks if Ayu has made a new friend.',
    ],
    storyId: 'Sepulang sekolah, Ayu bercerita ke ibunya tentang murid baru itu. Dia menceritakan bagaimana Kevin berbagi camilannya dengan teman sekelas yang lapar, dan bagaimana dia membantu membersihkan kelas tanpa diminta. Ayu juga ingat Kevin dengan sabar menjelaskan soal matematika ke teman sekelas yang bingung sampai tiga kali. Ibunya tersenyum dan bertanya apakah Ayu sudah punya teman baru.',
    question: {
      text: 'What kind of personality does Kevin most likely have?',
      id: 'Kira-kira, kepribadian Kevin itu seperti apa?',
      opts: [{ emoji: '🤗', lbl: 'Kind and helpful', ok: true }, { emoji: '😠', lbl: 'Angry and rude' }, { emoji: '😴', lbl: 'Lazy and careless' }],
    },
  },
  {
    id: 'memilih-proyek-sekolah',
    title: 'Memilih Proyek Sekolah (Choosing a School Project)',
    scene: '🔬',
    desc: '2 bacaan pendek',
    primer: [
      { passage: ['This semester, students can choose one subject for their big project.', 'Fajri looks at the list: Science, Art, History, and Music.'], id: 'Semester ini, murid bisa memilih satu mata pelajaran untuk proyek besar mereka. Fajri melihat daftarnya: Sains, Seni, Sejarah, dan Musik.' },
      { passage: ['His best friend Ilham already picked Music because he loves singing.', 'Fajri is still not sure what to choose.'], id: 'Sahabatnya, Ilham, sudah memilih Musik karena dia suka bernyanyi. Fajri masih belum yakin harus memilih apa.' },
    ],
    drill: [
      {
        passage: ['Fajri really enjoys mixing chemicals safely in Science class.', 'But he also loves drawing comic characters during Art class.'],
        id: 'Fajri sangat senang mencampur bahan kimia dengan aman di kelas Sains. Tapi dia juga suka menggambar karakter komik saat kelas Seni.',
        question: 'What does Fajri enjoy doing in Science class?',
        questionId: 'Apa yang disukai Fajri di kelas Sains?',
        opts: [{ emoji: '🧪', lbl: 'Mixing chemicals', ok: true }, { emoji: '🎨', lbl: 'Drawing' }, { emoji: '🎵', lbl: 'Singing' }],
      },
      {
        passage: ['His teacher says the Science project needs a lot of extra time after school.', 'The Art project can be finished mostly during class hours.'],
        id: 'Gurunya bilang proyek Sains butuh banyak waktu tambahan setelah sekolah. Proyek Seni bisa diselesaikan hampir semuanya saat jam pelajaran.',
        question: 'Which project needs more extra time after school?',
        questionId: 'Proyek mana yang butuh lebih banyak waktu tambahan setelah sekolah?',
        opts: [{ emoji: '🔬', lbl: 'Science', ok: true }, { emoji: '🎨', lbl: 'Art' }, { emoji: '🎵', lbl: 'Music' }],
      },
    ],
    story: [
      'That evening, Fajri remembers he also plays football practice three times a week after school.',
      'He counts his afternoons on his fingers and realizes he barely has any free time left.',
      'He thinks about the comic characters he has already sketched in his notebook this week.',
      'The next morning, Fajri walks to the sign-up sheet and writes his name under one subject.',
    ],
    storyId: 'Malam itu, Fajri ingat dia juga latihan sepak bola tiga kali seminggu setelah sekolah. Dia menghitung sore harinya dengan jarinya dan sadar dia hampir tidak punya waktu luang lagi. Dia memikirkan karakter komik yang sudah dia sketsa di buku catatannya minggu ini. Keesokan paginya, Fajri berjalan ke daftar pendaftaran dan menulis namanya di bawah satu mata pelajaran.',
    question: {
      text: 'Which project does Fajri most likely choose?',
      id: 'Proyek mana yang kemungkinan besar dipilih Fajri?',
      opts: [{ emoji: '🎨', lbl: 'Art', ok: true }, { emoji: '🔬', lbl: 'Science' }, { emoji: '🎵', lbl: 'Music' }],
    },
  },
  {
    id: 'menggalang-dana-sekolah',
    title: 'Menggalang Dana Sekolah (School Fundraiser)',
    scene: '💰',
    desc: '2 bacaan pendek',
    primer: [
      { passage: ['Ayu’s class is raising money for a school library project.', 'They sell homemade cookies during recess.'], id: 'Kelas Ayu sedang menggalang dana untuk proyek perpustakaan sekolah. Mereka menjual kue buatan sendiri saat istirahat.' },
      { passage: ['Each cookie costs one thousand rupiah.', 'Ayu keeps track of the money in a small notebook.'], id: 'Setiap kue harganya seribu rupiah. Ayu mencatat uangnya di buku catatan kecil.' },
    ],
    drill: [
      {
        passage: ['On Monday, the class sells forty cookies and raises forty thousand rupiah.', 'On Tuesday, they sell fifty cookies instead.'],
        id: 'Hari Senin, kelas menjual empat puluh kue dan mengumpulkan empat puluh ribu rupiah. Hari Selasa, mereka menjual lima puluh kue.',
        question: 'How many cookies does the class sell on Tuesday?',
        questionId: 'Berapa kue yang dijual kelas hari Selasa?',
        opts: [{ emoji: '5️⃣0️⃣', lbl: 'Fifty', ok: true }, { emoji: '4️⃣0️⃣', lbl: 'Forty' }, { emoji: '6️⃣0️⃣', lbl: 'Sixty' }],
      },
      {
        passage: ['By Wednesday, the total money collected reaches ninety thousand rupiah.', 'The teacher says they need one hundred thousand rupiah for the new bookshelf.'],
        id: 'Sampai hari Rabu, total uang yang terkumpul mencapai sembilan puluh ribu rupiah. Gurunya bilang mereka butuh seratus ribu rupiah untuk rak buku baru.',
        question: 'How much money do they need for the bookshelf?',
        questionId: 'Berapa uang yang mereka butuhkan untuk rak buku?',
        opts: [{ emoji: '💯', lbl: 'One hundred thousand', ok: true }, { emoji: '9️⃣0️⃣', lbl: 'Ninety thousand' }, { emoji: '8️⃣0️⃣', lbl: 'Eighty thousand' }],
      },
    ],
    story: [
      'On Thursday morning, Ayu counts the money in the box very carefully.',
      'She counts ninety thousand rupiah from before, plus ten new cookies sold that morning.',
      'Each cookie is one thousand rupiah, so she adds the new money to the total.',
      'Ayu jumps up excitedly and runs to tell her teacher the good news.',
    ],
    storyId: 'Kamis pagi, Ayu menghitung uang di kotak dengan sangat hati-hati. Dia menghitung sembilan puluh ribu rupiah dari sebelumnya, ditambah sepuluh kue baru yang terjual pagi itu. Setiap kue harganya seribu rupiah, jadi dia menambahkan uang barunya ke total. Ayu melompat kegirangan dan berlari memberi tahu gurunya kabar baiknya.',
    question: {
      text: 'Why is Ayu so excited?',
      id: 'Kenapa Ayu sangat senang?',
      opts: [{ emoji: '💯', lbl: 'They finally reached one hundred thousand rupiah', ok: true }, { emoji: '🍪', lbl: 'They ran out of cookies to sell' }, { emoji: '📚', lbl: 'The bookshelf arrived early' }],
    },
  },
];

/**
 * Reading Explorer (7–9 th) — format KETIGA BARU `ReadingCheckTopic`
 * (`types.ts`, `materi/reading.md` §9.2) — 1 kalimat + gambar → Benar/Salah,
 * TTS TIDAK PERNAH (keluarga "silent reading" sama dgn `ReadingTopic`).
 * 10 item dipetakan 1:1 dari `VOCAB_TOPICS` (Explorer) topik `kata-sifat`
 * (Adjectives & Opposites) — domain ini SENGAJA dipilih krn tiap kata sudah
 * py pasangan lawan kata alami (big↔small, dst), jadi `falseSentence` cukup
 * ganti PERSIS 1 kata sifat jadi lawannya — near-miss yang masuk akal &
 * konsisten, bukan kalimat absurd yang gampang ditebak tanpa baca.
 *
 * **Digenapkan 1→10 topik** (target CLAUDE.md ≥10/skill, permintaan user
 * "materi reading di explorer masih 1... buatkan minimal 10... research ke
 * lembaga bahasa inggris dalam negeri" — riset konfirmasi LIA GEYL: domain
 * keluarga/uang/waktu/negara eksplisit disebut cocok utk usia 7-9,
 * `materi/reading.md` §15) — 9 topik baru dipetakan dari SEMUA 9 domain
 * `VOCAB_TOPICS` (Explorer) yg belum disentuh Reading (`keluarga`/`angka`/
 * `warna`/`kesehatan`/`belanja-uang`/`waktu-harian`/`negara`/`pesta-
 * perayaan`/`peralatan-dapur` → `cek-keluarga`/`cek-angka`/`cek-warna`/
 * `cek-kesehatan`/`cek-uang`/`cek-waktu`/`cek-negara`/`cek-pesta`/
 * `cek-dapur`). **Beda dari domain `kata-sifat` (adjective, py lawan kata
 * alami), 9 domain baru ini SEMUANYA kata benda** — mekanik `falseSentence`
 * diadaptasi: domain `warna` REUSE PERSIS pola adjective asli (`item.
 * example.en` Vocab-nya sendiri sudah berbentuk "The X is <warna>.", false
 * ganti warna ke warna sibling — paling natural krn warna jg py struktur
 * deskriptif spt kata sifat); 8 domain benda murni lainnya pakai template
 * seragam "This is a/an <benda>."/frasa natural per-domain ("I am from
 * <negara>."/"It is <waktu>."/dst), `falseSentence` ganti KATA BENDA/FAKTA
 * ke sibling item DALAM topik yang sama (bukan lawan kata krn tidak semua
 * py antonim alami) — tetap "near-miss masuk akal" (kalimat gramatikal utuh,
 * cuma 1 fakta yg salah), bukan kalimat absurd. ZERO kosakata baru
 * diauthoring — semua kata sumbernya sudah ada di `VOCAB_TOPICS`.
 */
export const READING_TOPICS_EXPLORER: ReadingCheckTopic[] = [
  {
    id: 'baca-dan-cek',
    title: 'Baca & Cek: Sifat Benda (Read & Check: Descriptions)',
    scene: '🐘',
    desc: '10 kalimat',
    checks: [
      { emoji: '🐘', trueSentence: 'The elephant is big.', falseSentence: 'The elephant is small.', id: 'Gajahnya besar.' },
      { emoji: '🐭', trueSentence: 'The mouse is small.', falseSentence: 'The mouse is big.', id: 'Tikusnya kecil.' },
      { emoji: '🐆', trueSentence: 'The cheetah is fast.', falseSentence: 'The cheetah is slow.', id: 'Citahnya cepat.' },
      { emoji: '🐢', trueSentence: 'The turtle is slow.', falseSentence: 'The turtle is fast.', id: 'Kura-kuranya lambat.' },
      { emoji: '🐍', trueSentence: 'The snake is long.', falseSentence: 'The snake is short.', id: 'Ularnya panjang.' },
      { emoji: '✏️', trueSentence: 'The pencil is short.', falseSentence: 'The pencil is long.', id: 'Pensilnya pendek.' },
      { emoji: '🪨', trueSentence: 'The rock is heavy.', falseSentence: 'The rock is light.', id: 'Batunya berat.' },
      { emoji: '🪶', trueSentence: 'The feather is light.', falseSentence: 'The feather is heavy.', id: 'Bulunya ringan.' },
      { emoji: '🧼', trueSentence: 'The hands are clean.', falseSentence: 'The hands are dirty.', id: 'Tangannya bersih.' },
      { emoji: '🐷', trueSentence: 'The pig is dirty.', falseSentence: 'The pig is clean.', id: 'Babinya kotor.' },
    ],
  },
  {
    id: 'cek-keluarga',
    title: 'Baca & Cek: Keluarga (Read & Check: Family)',
    scene: '👩',
    desc: '10 kalimat',
    checks: [
      { emoji: '👩', trueSentence: 'This is my mother.', falseSentence: 'This is my father.', id: 'Ini ibuku.' },
      { emoji: '👨', trueSentence: 'This is my father.', falseSentence: 'This is my mother.', id: 'Ini ayahku.' },
      { emoji: '👧', trueSentence: 'This is my sister.', falseSentence: 'This is my brother.', id: 'Ini kakak/adik perempuanku.' },
      { emoji: '👦', trueSentence: 'This is my brother.', falseSentence: 'This is my sister.', id: 'Ini kakak/adik laki-lakiku.' },
      { emoji: '👵', trueSentence: 'This is my grandmother.', falseSentence: 'This is my grandfather.', id: 'Ini nenekku.' },
      { emoji: '👴', trueSentence: 'This is my grandfather.', falseSentence: 'This is my grandmother.', id: 'Ini kakekku.' },
      { emoji: '🧔', trueSentence: 'This is my uncle.', falseSentence: 'This is my aunt.', id: 'Ini pamanku.' },
      { emoji: '👩‍🦱', trueSentence: 'This is my aunt.', falseSentence: 'This is my uncle.', id: 'Ini bibiku.' },
      { emoji: '🧑', trueSentence: 'This is my cousin.', falseSentence: 'This is my baby.', id: 'Ini sepupuku.' },
      { emoji: '👶', trueSentence: 'This is my baby.', falseSentence: 'This is my cousin.', id: 'Ini bayiku.' },
    ],
  },
  {
    id: 'cek-angka',
    title: 'Baca & Cek: Angka (Read & Check: Numbers)',
    scene: '1️⃣',
    desc: '10 kalimat',
    checks: [
      { emoji: '1️⃣', trueSentence: 'This is the number one.', falseSentence: 'This is the number two.', id: 'Ini angka satu.' },
      { emoji: '2️⃣', trueSentence: 'This is the number two.', falseSentence: 'This is the number one.', id: 'Ini angka dua.' },
      { emoji: '3️⃣', trueSentence: 'This is the number three.', falseSentence: 'This is the number four.', id: 'Ini angka tiga.' },
      { emoji: '4️⃣', trueSentence: 'This is the number four.', falseSentence: 'This is the number three.', id: 'Ini angka empat.' },
      { emoji: '5️⃣', trueSentence: 'This is the number five.', falseSentence: 'This is the number six.', id: 'Ini angka lima.' },
      { emoji: '6️⃣', trueSentence: 'This is the number six.', falseSentence: 'This is the number five.', id: 'Ini angka enam.' },
      { emoji: '7️⃣', trueSentence: 'This is the number seven.', falseSentence: 'This is the number eight.', id: 'Ini angka tujuh.' },
      { emoji: '8️⃣', trueSentence: 'This is the number eight.', falseSentence: 'This is the number seven.', id: 'Ini angka delapan.' },
      { emoji: '9️⃣', trueSentence: 'This is the number nine.', falseSentence: 'This is the number ten.', id: 'Ini angka sembilan.' },
      { emoji: '🔟', trueSentence: 'This is the number ten.', falseSentence: 'This is the number nine.', id: 'Ini angka sepuluh.' },
    ],
  },
  {
    id: 'cek-warna',
    title: 'Baca & Cek: Warna (Read & Check: Colors)',
    scene: '🔴',
    desc: '10 kalimat',
    checks: [
      { emoji: '🍎', trueSentence: 'The apple is red.', falseSentence: 'The apple is blue.', id: 'Apelnya merah.' },
      { emoji: '🌤️', trueSentence: 'The sky is blue.', falseSentence: 'The sky is green.', id: 'Langitnya biru.' },
      { emoji: '🌿', trueSentence: 'The grass is green.', falseSentence: 'The grass is yellow.', id: 'Rumputnya hijau.' },
      { emoji: '🍌', trueSentence: 'The banana is yellow.', falseSentence: 'The banana is orange.', id: 'Pisangnya kuning.' },
      { emoji: '🍊', trueSentence: 'The orange is orange.', falseSentence: 'The orange is purple.', id: 'Jeruknya berwarna oranye.' },
      { emoji: '🍇', trueSentence: 'The grapes are purple.', falseSentence: 'The grapes are green.', id: 'Anggurnya ungu.' },
      { emoji: '👗', trueSentence: 'Her dress is pink.', falseSentence: 'Her dress is black.', id: 'Gaunnya merah muda.' },
      { emoji: '🐈‍⬛', trueSentence: 'The cat is black.', falseSentence: 'The cat is white.', id: 'Kucingnya hitam.' },
      { emoji: '☁️', trueSentence: 'The cloud is white.', falseSentence: 'The cloud is pink.', id: 'Awannya putih.' },
      { emoji: '🐻', trueSentence: 'The bear is brown.', falseSentence: 'The bear is red.', id: 'Beruangnya cokelat.' },
    ],
  },
  {
    id: 'cek-kesehatan',
    title: 'Baca & Cek: Kesehatan (Read & Check: Health)',
    scene: '🤒',
    desc: '10 kalimat',
    checks: [
      { emoji: '😷', trueSentence: 'I have a cough.', falseSentence: 'I have a fever.', id: 'Aku batuk.' },
      { emoji: '🤒', trueSentence: 'I have a fever.', falseSentence: 'I have a headache.', id: 'Aku demam.' },
      { emoji: '🤕', trueSentence: 'I have a headache.', falseSentence: 'I have a stomachache.', id: 'Aku sakit kepala.' },
      { emoji: '😖', trueSentence: 'I have a stomachache.', falseSentence: 'I have a cough.', id: 'Aku sakit perut.' },
      { emoji: '🩹', trueSentence: 'I wear a bandage.', falseSentence: 'I take medicine.', id: 'Aku memakai perban.' },
      { emoji: '💊', trueSentence: 'I take medicine.', falseSentence: 'I get an injection.', id: 'Aku minum obat.' },
      { emoji: '💉', trueSentence: 'I get an injection.', falseSentence: 'I wear a bandage.', id: 'Aku mendapat suntikan.' },
      { emoji: '🤧', trueSentence: 'I sneeze a lot.', falseSentence: 'I have a cough.', id: 'Aku banyak bersin.' },
      { emoji: '🛌', trueSentence: 'I need rest.', falseSentence: 'I am healthy.', id: 'Aku butuh istirahat.' },
      { emoji: '💪', trueSentence: 'I am healthy.', falseSentence: 'I need rest.', id: 'Aku sehat.' },
    ],
  },
  {
    id: 'cek-uang',
    title: 'Baca & Cek: Belanja & Uang (Read & Check: Shopping & Money)',
    scene: '💵',
    desc: '10 kalimat',
    checks: [
      { emoji: '💵', trueSentence: 'This is money.', falseSentence: 'This is a coin.', id: 'Ini uang.' },
      { emoji: '🪙', trueSentence: 'This is a coin.', falseSentence: 'This is money.', id: 'Ini koin.' },
      { emoji: '🏷️', trueSentence: 'This is the price.', falseSentence: 'This is a receipt.', id: 'Ini harganya.' },
      { emoji: '🧾', trueSentence: 'This is a receipt.', falseSentence: 'This is the price.', id: 'Ini struk.' },
      { emoji: '💎', trueSentence: 'This is expensive.', falseSentence: 'This is a wallet.', id: 'Ini mahal.' },
      { emoji: '👛', trueSentence: 'This is a wallet.', falseSentence: 'This is expensive.', id: 'Ini dompet.' },
      { emoji: '🧺', trueSentence: 'This is a basket.', falseSentence: 'This is a cart.', id: 'Ini keranjang.' },
      { emoji: '🛒', trueSentence: 'This is a cart.', falseSentence: 'This is a basket.', id: 'Ini troli.' },
      { emoji: '🧑‍💼', trueSentence: 'This is a cashier.', falseSentence: 'This is a piggy bank.', id: 'Ini kasir.' },
      { emoji: '🐷', trueSentence: 'This is a piggy bank.', falseSentence: 'This is a cashier.', id: 'Ini celengan.' },
    ],
  },
  {
    id: 'cek-waktu',
    title: 'Baca & Cek: Waktu (Read & Check: Time)',
    scene: '🌅',
    desc: '10 kalimat',
    checks: [
      { emoji: '🌅', trueSentence: 'It is morning.', falseSentence: 'It is night.', id: 'Ini pagi hari.' },
      { emoji: '☀️', trueSentence: 'It is afternoon.', falseSentence: 'It is evening.', id: 'Ini siang hari.' },
      { emoji: '🌇', trueSentence: 'It is evening.', falseSentence: 'It is afternoon.', id: 'Ini sore hari.' },
      { emoji: '🌃', trueSentence: 'It is night.', falseSentence: 'It is morning.', id: 'Ini malam hari.' },
      { emoji: '🕛', trueSentence: 'It is noon.', falseSentence: 'It is evening.', id: 'Ini tengah hari.' },
      { emoji: '🗓️', trueSentence: 'I see her every week.', falseSentence: 'I see her every month.', id: 'Aku menemuinya setiap minggu.' },
      { emoji: '📅', trueSentence: 'I see her every month.', falseSentence: 'I see her every year.', id: 'Aku menemuinya setiap bulan.' },
      { emoji: '🎊', trueSentence: 'I see her every year.', falseSentence: 'I see her every week.', id: 'Aku menemuinya setiap tahun.' },
      { emoji: '🎂', trueSentence: 'Today is my birthday.', falseSentence: 'Today is a holiday.', id: 'Hari ini ulang tahunku.' },
      { emoji: '🏖️', trueSentence: 'Today is a holiday.', falseSentence: 'Today is my birthday.', id: 'Hari ini hari libur.' },
    ],
  },
  {
    id: 'cek-negara',
    title: 'Baca & Cek: Negara (Read & Check: Countries)',
    scene: '🇮🇩',
    desc: '10 kalimat',
    checks: [
      { emoji: '🇮🇩', trueSentence: 'I am from Indonesia.', falseSentence: 'I am from Japan.', id: 'Aku dari Indonesia.' },
      { emoji: '🇯🇵', trueSentence: 'I am from Japan.', falseSentence: 'I am from Indonesia.', id: 'Aku dari Jepang.' },
      { emoji: '🇬🇧', trueSentence: 'I am from England.', falseSentence: 'I am from France.', id: 'Aku dari Inggris.' },
      { emoji: '🇫🇷', trueSentence: 'I am from France.', falseSentence: 'I am from England.', id: 'Aku dari Prancis.' },
      { emoji: '🇺🇸', trueSentence: 'I am from America.', falseSentence: 'I am from Germany.', id: 'Aku dari Amerika.' },
      { emoji: '🇩🇪', trueSentence: 'I am from Germany.', falseSentence: 'I am from America.', id: 'Aku dari Jerman.' },
      { emoji: '🇨🇳', trueSentence: 'I am from China.', falseSentence: 'I am from Korea.', id: 'Aku dari Tiongkok.' },
      { emoji: '🇰🇷', trueSentence: 'I am from Korea.', falseSentence: 'I am from China.', id: 'Aku dari Korea.' },
      { emoji: '🇦🇺', trueSentence: 'I am from Australia.', falseSentence: 'I am from India.', id: 'Aku dari Australia.' },
      { emoji: '🇮🇳', trueSentence: 'I am from India.', falseSentence: 'I am from Australia.', id: 'Aku dari India.' },
    ],
  },
  {
    id: 'cek-pesta',
    title: 'Baca & Cek: Pesta (Read & Check: Party)',
    scene: '🎉',
    desc: '10 kalimat',
    checks: [
      { emoji: '🎉', trueSentence: 'This is a party.', falseSentence: 'This is a wish.', id: 'Ini pesta.' },
      { emoji: '⭐', trueSentence: 'This is a wish.', falseSentence: 'This is a party.', id: 'Ini harapan.' },
      { emoji: '🎁', trueSentence: 'This is a present.', falseSentence: 'This is a decoration.', id: 'Ini hadiah.' },
      { emoji: '🎊', trueSentence: 'This is a decoration.', falseSentence: 'This is a present.', id: 'Ini hiasan.' },
      { emoji: '🕯️', trueSentence: 'This is a candle.', falseSentence: 'This is a card.', id: 'Ini lilin.' },
      { emoji: '✉️', trueSentence: 'This is a card.', falseSentence: 'This is a candle.', id: 'Ini kartu.' },
      { emoji: '💌', trueSentence: 'This is an invitation.', falseSentence: 'This is a surprise.', id: 'Ini undangan.' },
      { emoji: '😲', trueSentence: 'This is a surprise.', falseSentence: 'This is an invitation.', id: 'Ini kejutan.' },
      { emoji: '🧑‍🤝‍🧑', trueSentence: 'This is a guest.', falseSentence: 'This is a celebration.', id: 'Ini tamu.' },
      { emoji: '🥳', trueSentence: 'This is a celebration.', falseSentence: 'This is a guest.', id: 'Ini perayaan.' },
    ],
  },
  {
    id: 'cek-dapur',
    title: 'Baca & Cek: Dapur (Read & Check: Kitchen)',
    scene: '🍳',
    desc: '10 kalimat',
    checks: [
      { emoji: '🍲', trueSentence: 'This is a pot.', falseSentence: 'This is a pan.', id: 'Ini panci.' },
      { emoji: '🍳', trueSentence: 'This is a pan.', falseSentence: 'This is a pot.', id: 'Ini wajan.' },
      { emoji: '🥄', trueSentence: 'This is a spoon.', falseSentence: 'This is a fork.', id: 'Ini sendok.' },
      { emoji: '🍴', trueSentence: 'This is a fork.', falseSentence: 'This is a spoon.', id: 'Ini garpu.' },
      { emoji: '🔪', trueSentence: 'This is a knife.', falseSentence: 'This is a plate.', id: 'Ini pisau.' },
      { emoji: '🍽️', trueSentence: 'This is a plate.', falseSentence: 'This is a knife.', id: 'Ini piring.' },
      { emoji: '🥣', trueSentence: 'This is a bowl.', falseSentence: 'This is a cup.', id: 'Ini mangkuk.' },
      { emoji: '☕', trueSentence: 'This is a cup.', falseSentence: 'This is a bowl.', id: 'Ini cangkir.' },
      { emoji: '🫖', trueSentence: 'This is a kettle.', falseSentence: 'This is a pot.', id: 'Ini ketel.' },
      { emoji: '🥢', trueSentence: 'These are chopsticks.', falseSentence: 'These are forks.', id: 'Ini sumpit.' },
    ],
  },
];

/**
 * Reading Trailblazer (12+ th, ≈B1) — 🔒 revisi user: target Trailblazer
 * dinaikkan dari "low-effort, 1-2 modul preview" (PRD §9 lama) jadi
 * **minimal 5 topik/skill** (CLAUDE.md "Target Kelengkapan Konten per
 * Modul" poin 1) — TETAP lebih ringan dari 5 level lain (≥10), levelnya
 * tetap "jalur lanjutan" opsional. TETAP format LAMA `ReadingTopic` (BUKAN
 * tipe baru) — riset (`materi/reading.md` §9.5) TIDAK menemukan alasan kuat
 * utk revisi mekanik penuh spt Listening dulu (lompatan Cambridge KET→PET
 * utk Reading lebih ke "teks lebih panjang, tipe soal serupa", bukan
 * kategori skill baru) — cukup reuse format Achiever dgn konten LEBIH berat
 * lagi (kalimat majemuk, konektor "however/although/instead", tema B1 anak
 * 12+: wawancara, liburan, lingkungan, teknologi, kerja sosial). Semua 10
 * topik py `question` akhir INFERENSI (pola sama Achiever) — cerita tidak
 * pernah menyebutkan simpulannya literal, anak gabungkan ≥2 info.
 *
 * **🔒 Digenapkan 5→10 topik + audit konten existing** (permintaan user
 * "tambah 5 materi untuk level trailblazer dan audit juga materi saat ini
 * apakah sudah relevan?", `materi/reading.md` §18) — audit menemukan gap
 * NYATA: 5 topik pertama TIDAK PERNAH benar² pakai konektor "however"/
 * "although" walau dokumentasi desain awal (di atas) mengklaim itu ciri
 * pembeda utama dari Achiever — dicek via grep, cuma "but"/"instead" yg
 * dipakai (0× "however"/"although" di 5 topik awal). **Diperbaiki**: 3 dari
 * 5 topik lama (`liburan-yang-berubah`/`kompetisi-robot`/`proyek-
 * lingkungan`) direvisi ringan (1 kata sambung diganti per topik, MAKNA
 * sama, opsi jawaban/logic TIDAK diubah) supaya korpusnya benar² py variasi
 * konektor B1 spt yg diklaim. **5 topik BARU** (riset WebSearch: Cambridge
 * B1 Preliminary/PET tema resmi remaja — sports & fitness, art & music,
 * food & cooking, friends & parties, money & saving/future plans, SEMUA
 * tema yg belum disentuh 5 topik lama) SENGAJA py "however"/"although"/
 * "even though" GENUINE sejak awal ditulis (bukan retrofit) + struktur
 * kalimat lebih kompleks (klausa relatif "who is much taller", klausa
 * konsesif) supaya benar² lebih berat dari Achiever, bukan cuma beda tema:
 * `seleksi-tim-basket`, `pameran-seni-sekolah`, `kelas-memasak-mingguan`,
 * `pesta-kejutan-sahabat`, `menabung-untuk-sepeda` (yg terakhir REUSE pola
 * "perhitungan matematika aktual" dari Achiever `menggalang-dana-sekolah` —
 * anak hitung sendiri selisih 1.600.000-1.400.000=200.000, bukan re-baca
 * fakta). **Deviasi SADAR dari target baku Trailblazer (≥5)** — user
 * eksplisit minta +5 lagi, preseden sama dgn Listening/Grammar Trailblazer
 * yg jg dibangun ke 10/10 penuh atas permintaan eksplisit sebelumnya.
 */
export const READING_TOPICS_TRAILBLAZER: ReadingTopic[] = [
  {
    id: 'wawancara-radio-sekolah',
    title: 'Wawancara Radio Sekolah (School Radio Interview)',
    scene: '🎙️',
    desc: '2 bacaan pendek',
    primer: [
      { passage: ['Sarah joins the school radio club this semester.', 'She wants to interview interesting students and teachers.'], id: 'Sarah bergabung dengan klub radio sekolah semester ini. Dia ingin mewawancarai murid dan guru yang menarik.' },
      { passage: ['Her first interview is with the school’s chess champion.', 'She prepares five questions the night before.'], id: 'Wawancara pertamanya dengan juara catur sekolah. Dia menyiapkan lima pertanyaan malam sebelumnya.' },
    ],
    drill: [
      {
        passage: ['Sarah plans to record the interview in the library, but it is too noisy there.', 'She decides to use the music room instead because it is quiet.'],
        id: 'Sarah berencana merekam wawancara di perpustakaan, tapi di sana terlalu berisik. Dia memutuskan memakai ruang musik karena tenang.',
        question: 'Where does Sarah record the interview?',
        questionId: 'Di mana Sarah merekam wawancaranya?',
        opts: [{ emoji: '🎵', lbl: 'The music room', ok: true }, { emoji: '📚', lbl: 'The library' }, { emoji: '🏫', lbl: 'The classroom' }],
      },
      {
        passage: ['The chess champion says he practices every day after school.', 'He also says weekends are for resting, not practicing.'],
        id: 'Juara catur itu bilang dia berlatih setiap hari sepulang sekolah. Dia juga bilang akhir pekan untuk istirahat, bukan berlatih.',
        question: 'When does the chess champion practice?',
        questionId: 'Kapan juara catur itu berlatih?',
        opts: [{ emoji: '📅', lbl: 'Every day after school', ok: true }, { emoji: '🌞', lbl: 'On weekends' }, { emoji: '🌙', lbl: 'Only at night' }],
      },
    ],
    story: [
      'After the interview, Sarah listens to the recording carefully.',
      'She notices her voice sounds nervous at the beginning but calmer later.',
      'Her teacher says this is normal for a first interview and tells her to keep practicing.',
      'Sarah feels proud because she finished her very first project for the radio club.',
    ],
    storyId: 'Setelah wawancara, Sarah mendengarkan rekamannya dengan saksama. Dia sadar suaranya terdengar gugup di awal tapi lebih tenang belakangan. Gurunya bilang ini wajar untuk wawancara pertama dan menyuruhnya terus berlatih. Sarah merasa bangga karena sudah menyelesaikan proyek pertamanya untuk klub radio.',
    question: {
      text: 'How does Sarah probably feel about her first interview by the end of the story?',
      id: 'Bagaimana perasaan Sarah tentang wawancara pertamanya di akhir cerita?',
      opts: [{ emoji: '😊', lbl: 'Proud, even though it wasn’t perfect', ok: true }, { emoji: '😢', lbl: 'Sad because she failed' }, { emoji: '😠', lbl: 'Angry at her teacher' }],
    },
  },
  {
    id: 'liburan-yang-berubah',
    title: 'Liburan yang Berubah (A Holiday That Changed)',
    scene: '🌦️',
    desc: '2 bacaan pendek',
    primer: [
      { passage: ['The Putra family plans a beach holiday for the weekend.', 'They pack swimsuits, sunscreen, and beach towels.'], id: 'Keluarga Putra merencanakan liburan pantai akhir pekan. Mereka mengemas baju renang, tabir surya, dan handuk pantai.' },
      { passage: ['On Saturday morning, the weather forecast shows heavy rain.', 'The family must change their plan quickly.'], id: 'Sabtu pagi, ramalan cuaca menunjukkan hujan deras. Keluarga itu harus mengubah rencana dengan cepat.' },
    ],
    drill: [
      {
        passage: ['Instead of the beach, they decide to visit a science museum in the city.', 'Rudi, the youngest, is disappointed at first, however he changes his mind after seeing the dinosaur exhibit.'],
        id: 'Alih-alih ke pantai, mereka memutuskan mengunjungi museum sains di kota. Rudi, yang paling kecil, kecewa di awal, tapi dia berubah pikiran setelah melihat pameran dinosaurus.',
        question: 'Where does the family go instead of the beach?',
        questionId: 'Ke mana keluarga itu pergi selain ke pantai?',
        opts: [{ emoji: '🏛️', lbl: 'A science museum', ok: true }, { emoji: '🎬', lbl: 'A cinema' }, { emoji: '🛍️', lbl: 'A shopping mall' }],
      },
      {
        passage: ['The museum has a special show about space at two o’clock.', 'The family arrives at one thirty so they have time to look around first.'],
        id: 'Museum itu punya pertunjukan khusus tentang luar angkasa jam dua siang. Keluarga itu tiba jam satu setengah supaya sempat melihat-lihat dulu.',
        question: 'What time does the space show start?',
        questionId: 'Jam berapa pertunjukan luar angkasanya dimulai?',
        opts: [{ emoji: '🕑', lbl: 'Two o’clock', ok: true }, { emoji: '🕐', lbl: 'One o’clock' }, { emoji: '🕜', lbl: 'One thirty' }],
      },
    ],
    story: [
      'The space show turns out to be the best part of the day.',
      'Rudi asks so many questions that the guide invites him to press the buttons on the model rocket.',
      'That night, Rudi tells his parents he wants to be an astronaut someday.',
      'His parents smile and say the rainy day turned into a lucky day after all.',
    ],
    storyId: 'Pertunjukan luar angkasa ternyata jadi bagian terbaik hari itu. Rudi bertanya begitu banyak sampai pemandunya mengajaknya menekan tombol pada model roket. Malam itu, Rudi bilang ke orang tuanya dia ingin jadi astronaut suatu hari nanti. Orang tuanya tersenyum dan bilang hari hujan itu ternyata berubah jadi hari yang beruntung.',
    question: {
      text: 'Why do the parents call it a lucky day?',
      id: 'Mengapa orang tuanya menyebutnya hari yang beruntung?',
      opts: [{ emoji: '🚀', lbl: 'The rain led them to a trip Rudi loved', ok: true }, { emoji: '💰', lbl: 'They won some money' }, { emoji: '🏖️', lbl: 'The rain stopped and they went to the beach' }],
    },
  },
  {
    id: 'proyek-lingkungan',
    title: 'Proyek Lingkungan (Environmental Project)',
    scene: '♻️',
    desc: '2 bacaan pendek',
    primer: [
      { passage: ['Dea’s class starts a recycling project this month.', 'Every student brings used paper and plastic bottles from home.'], id: 'Kelas Dea memulai proyek daur ulang bulan ini. Setiap murid membawa kertas bekas dan botol plastik dari rumah.' },
      { passage: ['They sort the materials into different bins.', 'Paper goes in one bin, and plastic goes in another.'], id: 'Mereka memilah bahan ke tempat sampah berbeda. Kertas masuk ke satu tempat, plastik ke tempat lain.' },
    ],
    drill: [
      {
        passage: ['Dea’s group collects the most plastic bottles, although another group collects the most paper.', 'The teacher says both groups did equally well.'],
        id: 'Kelompok Dea mengumpulkan botol plastik paling banyak, meski kelompok lain mengumpulkan kertas paling banyak. Gurunya bilang kedua kelompok sama-sama hebat.',
        question: 'What does Dea’s group collect the most of?',
        questionId: 'Apa yang paling banyak dikumpulkan kelompok Dea?',
        opts: [{ emoji: '🍾', lbl: 'Plastic bottles', ok: true }, { emoji: '📄', lbl: 'Paper' }, { emoji: '🥫', lbl: 'Cans' }],
      },
      {
        passage: ['The class uses the collected paper to make new notebooks.', 'They use the plastic bottles to build a small greenhouse for the school garden.'],
        id: 'Kelas itu memakai kertas yang terkumpul untuk membuat buku catatan baru. Mereka memakai botol plastik untuk membangun rumah kaca kecil di kebun sekolah.',
        question: 'What do they build with the plastic bottles?',
        questionId: 'Apa yang mereka bangun dari botol plastik?',
        opts: [{ emoji: '🏡', lbl: 'A small greenhouse', ok: true }, { emoji: '📓', lbl: 'Notebooks' }, { emoji: '🎨', lbl: 'A painting' }],
      },
    ],
    story: [
      'At the end of the month, the school invites parents to see the greenhouse.',
      'Dea explains how the project reduced trash and grew fresh vegetables at the same time.',
      'One parent asks if other classes can join next semester.',
      'The principal agrees and says the whole school will start recycling next year.',
    ],
    storyId: 'Di akhir bulan, sekolah mengundang orang tua melihat rumah kaca itu. Dea menjelaskan bagaimana proyek ini mengurangi sampah sekaligus menumbuhkan sayuran segar. Seorang orang tua bertanya apakah kelas lain bisa ikut semester depan. Kepala sekolah setuju dan bilang seluruh sekolah akan mulai daur ulang tahun depan.',
    question: {
      text: 'What will most likely happen next semester?',
      id: 'Apa yang kemungkinan besar terjadi semester depan?',
      opts: [{ emoji: '🏫', lbl: 'More classes will join the recycling project', ok: true }, { emoji: '🛑', lbl: 'The project will stop completely' }, { emoji: '🏖️', lbl: 'The school will go on a trip instead' }],
    },
  },
  {
    id: 'kompetisi-robot',
    title: 'Kompetisi Robot (Robotics Competition)',
    scene: '🤖',
    desc: '2 bacaan pendek',
    primer: [
      { passage: ['Bayu and his team build a small robot for a school competition.', 'The robot must move through a maze without touching the walls.'], id: 'Bayu dan timnya membangun robot kecil untuk lomba sekolah. Robot itu harus melewati labirin tanpa menyentuh dinding.' },
      { passage: ['They practice for three weeks before the competition day.', 'Bayu is in charge of programming the robot’s sensors.'], id: 'Mereka berlatih tiga minggu sebelum hari lomba. Bayu bertanggung jawab memprogram sensor robotnya.' },
    ],
    drill: [
      {
        passage: ['During practice, the robot works perfectly on a flat floor.', 'However, on the competition day, the floor has small bumps that confuse the sensors.'],
        id: 'Saat latihan, robotnya bekerja sempurna di lantai rata. Namun, pada hari lomba, lantainya punya benjolan kecil yang membingungkan sensornya.',
        question: 'What confuses the robot’s sensors on competition day?',
        questionId: 'Apa yang membingungkan sensor robot pada hari lomba?',
        opts: [{ emoji: '🪨', lbl: 'Small bumps on the floor', ok: true }, { emoji: '💡', lbl: 'Bright lights' }, { emoji: '🔊', lbl: 'Loud noise' }],
      },
      {
        passage: ['Bayu quickly changes one line of the program before their turn.', 'His teammate Wati checks the wheels one more time.'],
        id: 'Bayu cepat-cepat mengubah satu baris program sebelum giliran mereka. Rekan timnya Wati memeriksa rodanya sekali lagi.',
        question: 'What does Bayu do before their turn?',
        questionId: 'Apa yang dilakukan Bayu sebelum giliran mereka?',
        opts: [{ emoji: '💻', lbl: 'Changes the program', ok: true }, { emoji: '🔧', lbl: 'Checks the wheels' }, { emoji: '🔋', lbl: 'Charges the battery' }],
      },
    ],
    story: [
      'When it is finally their turn, the robot moves slowly but carefully through the maze.',
      'It stops once, but Bayu’s quick fix from earlier helps it continue.',
      'The team does not win first place, but they finish the maze completely, unlike two other teams.',
      'Bayu says the competition taught him that mistakes can be fixed if you stay calm.',
    ],
    storyId: 'Ketika akhirnya giliran mereka, robotnya bergerak pelan tapi hati-hati melewati labirin. Robotnya berhenti sekali, tapi perbaikan cepat Bayu tadi membantunya terus jalan. Tim itu tidak menang juara satu, tapi mereka menyelesaikan labirinnya penuh, tidak seperti dua tim lain. Bayu bilang lomba ini mengajarkannya bahwa kesalahan bisa diperbaiki kalau tetap tenang.',
    question: {
      text: 'What lesson does Bayu learn from the competition?',
      id: 'Pelajaran apa yang didapat Bayu dari lomba ini?',
      opts: [{ emoji: '🧠', lbl: 'Mistakes can be fixed if you stay calm', ok: true }, { emoji: '🏆', lbl: 'Winning is the only thing that matters' }, { emoji: '😴', lbl: 'Practicing is not necessary' }],
    },
  },
  {
    id: 'kerja-sukarela',
    title: 'Hari Kerja Sukarela (Volunteer Day)',
    scene: '🤝',
    desc: '2 bacaan pendek',
    primer: [
      { passage: ['Nina’s school organizes a volunteer day at a local animal shelter.', 'Students help clean cages and feed the animals.'], id: 'Sekolah Nina mengadakan hari sukarelawan di penampungan hewan setempat. Murid-murid membantu membersihkan kandang dan memberi makan hewan.' },
      { passage: ['Nina chooses to help with the cats because she loves them the most.', 'Her friend Tio prefers to walk the dogs.'], id: 'Nina memilih membantu kucing karena dia paling menyukainya. Temannya Tio lebih suka mengajak anjing jalan-jalan.' },
    ],
    drill: [
      {
        passage: ['Nina notices one shy cat that hides in the corner all morning.', 'She sits quietly near the cage until the cat slowly comes closer.'],
        id: 'Nina memperhatikan seekor kucing pemalu yang bersembunyi di sudut sepanjang pagi. Dia duduk diam di dekat kandang sampai kucingnya perlahan mendekat.',
        question: 'What does the shy cat do at first?',
        questionId: 'Apa yang dilakukan kucing pemalu itu di awal?',
        opts: [{ emoji: '🙈', lbl: 'Hides in the corner', ok: true }, { emoji: '😼', lbl: 'Comes closer immediately' }, { emoji: '😴', lbl: 'Sleeps the whole time' }],
      },
      {
        passage: ['Tio walks three dogs before lunch and two more after lunch.', 'He says the energetic puppy is the hardest to walk.'],
        id: 'Tio mengajak jalan tiga anjing sebelum makan siang dan dua lagi setelahnya. Dia bilang anak anjing yang enerjik itu paling sulit diajak jalan.',
        question: 'How many dogs does Tio walk before lunch?',
        questionId: 'Berapa anjing yang diajak jalan Tio sebelum makan siang?',
        opts: [{ emoji: '3️⃣', lbl: 'Three', ok: true }, { emoji: '2️⃣', lbl: 'Two' }, { emoji: '5️⃣', lbl: 'Five' }],
      },
    ],
    story: [
      'By the afternoon, the shy cat finally lets Nina pet her.',
      'Nina feels very happy and asks the shelter staff if she can visit again next month.',
      'The staff member smiles and says volunteers like Nina help the animals trust people again.',
      'On the bus home, Nina tells Tio she wants to volunteer every month from now on.',
    ],
    storyId: 'Menjelang sore, kucing pemalu itu akhirnya membiarkan Nina mengelusnya. Nina merasa sangat senang dan bertanya ke staf penampungan apakah dia boleh berkunjung lagi bulan depan. Stafnya tersenyum dan bilang sukarelawan seperti Nina membantu hewan-hewan belajar percaya lagi pada manusia. Di bus pulang, Nina bilang ke Tio dia ingin jadi sukarelawan setiap bulan mulai sekarang.',
    question: {
      text: 'Why does the staff member say volunteers like Nina are important?',
      id: 'Mengapa staf itu bilang sukarelawan seperti Nina itu penting?',
      opts: [{ emoji: '🐾', lbl: 'They help animals learn to trust people', ok: true }, { emoji: '🧹', lbl: 'They clean the shelter faster' }, { emoji: '💰', lbl: 'They bring money to the shelter' }],
    },
  },
  {
    id: 'seleksi-tim-basket',
    title: 'Seleksi Tim Basket (Basketball Team Tryouts)',
    scene: '🏀',
    desc: '2 bacaan pendek',
    primer: [
      { passage: ['Vino has been practicing basketball every morning for a month, hoping to make the school team this year.', 'Although he is not the tallest player trying out, he is one of the fastest.'], id: 'Vino sudah berlatih basket setiap pagi selama sebulan, berharap masuk tim sekolah tahun ini. Meskipun dia bukan pemain tertinggi yang ikut seleksi, dia salah satu yang tercepat.' },
      { passage: ['The coach announces that tryouts will have two rounds: a fitness test and a skills test.', 'Vino feels confident about the fitness test, but nervous about shooting free throws.'], id: 'Pelatihnya mengumumkan seleksi akan ada dua babak: tes kebugaran dan tes keterampilan. Vino merasa percaya diri soal tes kebugaran, tapi gugup soal melempar bola bebas.' },
    ],
    drill: [
      {
        passage: ['Vino finishes the fitness test in record time, however his legs feel shaky afterward from the effort.', 'He drinks some water and stretches before the skills test begins.'],
        id: 'Vino menyelesaikan tes kebugaran dengan waktu rekor, namun kakinya terasa gemetar setelahnya karena usahanya. Dia minum air dan meregangkan otot sebelum tes keterampilan dimulai.',
        question: 'How does Vino feel after the fitness test?',
        questionId: 'Bagaimana perasaan Vino setelah tes kebugaran?',
        opts: [{ emoji: '🦵', lbl: 'His legs feel shaky', ok: true }, { emoji: '⚡', lbl: 'Full of energy' }, { emoji: '😴', lbl: 'Bored' }],
      },
      {
        passage: ['During the skills test, Vino makes seven out of ten free throws, although his hands are still shaking a little.', 'The player before him only makes four out of ten.'],
        id: 'Saat tes keterampilan, Vino memasukkan tujuh dari sepuluh lemparan bebas, walaupun tangannya masih sedikit gemetar. Pemain sebelum dia cuma memasukkan empat dari sepuluh.',
        question: 'How many free throws does Vino make?',
        questionId: 'Berapa lemparan bebas yang berhasil dimasukkan Vino?',
        opts: [{ emoji: '7️⃣', lbl: 'Seven', ok: true }, { emoji: '4️⃣', lbl: 'Four' }, { emoji: '🔟', lbl: 'Ten' }],
      },
    ],
    story: [
      'That evening, the coach posts the team list on the school notice board.',
      'Vino’s friend Doni, who is much taller, does not see his own name on the list, however he claps for Vino when he sees his friend’s name there.',
      'The coach later explains that the team needed more players who could run fast and pass accurately, not just players who were tall.',
      'Vino promises Doni that he will ask the coach if Doni can join the practice sessions anyway.',
    ],
    storyId: 'Malam itu, pelatih menempel daftar tim di papan pengumuman sekolah. Teman Vino, Doni, yang jauh lebih tinggi, tidak melihat namanya sendiri di daftar itu, namun dia tetap bertepuk tangan untuk Vino saat melihat nama temannya di sana. Pelatihnya kemudian menjelaskan tim butuh lebih banyak pemain yang bisa berlari cepat dan mengoper dengan akurat, bukan cuma pemain yang tinggi. Vino berjanji ke Doni akan bertanya ke pelatih apakah Doni boleh ikut sesi latihan meski begitu.',
    question: {
      text: 'Why does Vino make the team instead of Doni?',
      id: 'Kenapa Vino masuk tim, bukan Doni?',
      opts: [{ emoji: '🏃', lbl: 'The coach values speed and passing over height', ok: true }, { emoji: '📏', lbl: 'Doni is too tall for the team' }, { emoji: '😢', lbl: 'Doni decided not to try out' }],
    },
  },
  {
    id: 'pameran-seni-sekolah',
    title: 'Pameran Seni Sekolah (School Art Exhibition)',
    scene: '🎨',
    desc: '2 bacaan pendek',
    primer: [
      { passage: ['Every year, the school holds an art exhibition where students display their best paintings.', 'Citra has been working on a large painting of her grandmother’s garden for three weeks.'], id: 'Setiap tahun, sekolah mengadakan pameran seni tempat murid memamerkan lukisan terbaik mereka. Citra sudah mengerjakan lukisan besar tentang kebun neneknya selama tiga minggu.' },
      { passage: ['Although painting is not her strongest subject, Citra loves spending time on details like flower petals and leaves.', 'Her art teacher encourages her to enter the exhibition this year.'], id: 'Meskipun melukis bukan pelajaran terkuatnya, Citra suka menghabiskan waktu untuk detail seperti kelopak bunga dan daun. Guru senirya mendorongnya untuk ikut pameran tahun ini.' },
    ],
    drill: [
      {
        passage: ['On the day before the exhibition, Citra accidentally spills orange paint on the corner of her painting.', 'She panics for a moment, however she quickly decides to turn the stain into a small sun in the sky.'],
        id: 'Sehari sebelum pameran, Citra tidak sengaja menumpahkan cat oranye di sudut lukisannya. Dia panik sesaat, namun dia cepat memutuskan mengubah nodanya jadi matahari kecil di langit.',
        question: 'What does Citra turn the paint stain into?',
        questionId: 'Noda catnya diubah jadi apa oleh Citra?',
        opts: [{ emoji: '☀️', lbl: 'A small sun', ok: true }, { emoji: '🌸', lbl: 'A flower' }, { emoji: '🐦', lbl: 'A bird' }],
      },
      {
        passage: ['At the exhibition, three teachers walk past Citra’s painting without stopping.', 'But the fourth teacher, the school principal, stops and stares at it for almost a minute.'],
        id: 'Di pameran, tiga guru berjalan melewati lukisan Citra tanpa berhenti. Tapi guru keempat, kepala sekolahnya, berhenti dan menatapnya hampir satu menit.',
        question: 'Who stops to look at Citra’s painting for almost a minute?',
        questionId: 'Siapa yang berhenti melihat lukisan Citra hampir satu menit?',
        opts: [{ emoji: '🧑‍💼', lbl: 'The principal', ok: true }, { emoji: '🎨', lbl: 'An art teacher' }, { emoji: '🧑‍🎓', lbl: 'A classmate' }],
      },
    ],
    story: [
      'The principal finally speaks and asks Citra about the small sun in the corner of the painting.',
      'Citra explains honestly that it started as a mistake, although she tried her best to make it look natural.',
      'The principal smiles and says that turning mistakes into something beautiful is exactly what good artists do.',
      'A week later, Citra’s painting is chosen to hang permanently in the school library.',
    ],
    storyId: 'Kepala sekolah akhirnya bicara dan bertanya ke Citra tentang matahari kecil di sudut lukisannya. Citra menjelaskan dengan jujur itu awalnya kesalahan, meski dia berusaha sebaik mungkin membuatnya terlihat alami. Kepala sekolah tersenyum dan bilang mengubah kesalahan jadi sesuatu yang indah itu persis yang dilakukan seniman hebat. Seminggu kemudian, lukisan Citra terpilih untuk dipajang permanen di perpustakaan sekolah.',
    question: {
      text: 'Why is Citra’s painting chosen for the library?',
      id: 'Kenapa lukisan Citra dipilih untuk perpustakaan?',
      opts: [{ emoji: '🎨', lbl: 'The principal admires how she handled her mistake creatively', ok: true }, { emoji: '👵', lbl: 'It is the only painting about a grandmother' }, { emoji: '🖌️', lbl: 'It is the biggest painting in the exhibition' }],
    },
  },
  {
    id: 'kelas-memasak-mingguan',
    title: 'Kelas Memasak Mingguan (Weekly Cooking Class)',
    scene: '🍳',
    desc: '2 bacaan pendek',
    primer: [
      { passage: ['Every Friday afternoon, Yoga joins an after-school cooking class with his classmates.', 'This week, the class is learning how to make traditional soto soup.'], id: 'Setiap Jumat siang, Yoga ikut kelas memasak sepulang sekolah bersama teman-teman sekelasnya. Minggu ini, kelasnya belajar membuat soto tradisional.' },
      { passage: ['The teacher explains that soto recipes are different in almost every region of Indonesia.', 'Yoga is paired with his classmate Mira to cook together.'], id: 'Gurunya menjelaskan resep soto berbeda-beda di hampir setiap daerah di Indonesia. Yoga dipasangkan dengan teman sekelasnya, Mira, untuk memasak bersama.' },
    ],
    drill: [
      {
        passage: ['Mira wants to add a lot of chili to their soto, however Yoga reminds her that some classmates cannot eat spicy food.', 'They agree to add the chili separately as a side condiment instead.'],
        id: 'Mira ingin menambahkan banyak cabai ke soto mereka, namun Yoga mengingatkan beberapa teman sekelas tidak bisa makan pedas. Mereka sepakat menambahkan cabainya terpisah sebagai sambal saja.',
        question: 'How do Yoga and Mira decide to serve the chili?',
        questionId: 'Bagaimana Yoga dan Mira memutuskan menyajikan cabainya?',
        opts: [{ emoji: '🌶️', lbl: 'As a separate side condiment', ok: true }, { emoji: '🍲', lbl: 'Mixed into the soup' }, { emoji: '🚫', lbl: 'Not at all' }],
      },
      {
        passage: ['Although the recipe says to cook the broth for one hour, Yoga and Mira only have thirty minutes left before class ends.', 'They turn up the heat slightly to make the broth ready faster.'],
        id: 'Meskipun resepnya bilang merebus kaldu selama satu jam, Yoga dan Mira cuma punya sisa waktu tiga puluh menit sebelum kelas berakhir. Mereka membesarkan apinya sedikit supaya kaldunya lebih cepat siap.',
        question: 'How much time do Yoga and Mira have left before class ends?',
        questionId: 'Berapa sisa waktu Yoga dan Mira sebelum kelas berakhir?',
        opts: [{ emoji: '⏱️', lbl: 'Thirty minutes', ok: true }, { emoji: '⏰', lbl: 'One hour' }, { emoji: '⌛', lbl: 'Ten minutes' }],
      },
    ],
    story: [
      'When the teacher tastes every group’s soto, she pauses longest at Yoga and Mira’s bowl.',
      'She says the broth tastes rich and well-balanced, even though it was cooked in less time than the recipe suggested.',
      'Yoga admits they were worried the shortcut would ruin the flavor.',
      'The teacher laughs and says sometimes cooks discover better methods by accident, under pressure.',
    ],
    storyId: 'Ketika gurunya mencicipi soto setiap kelompok, dia berhenti paling lama di mangkuk Yoga dan Mira. Dia bilang kaldunya terasa kaya dan seimbang, meskipun dimasak dalam waktu lebih singkat dari yang disarankan resep. Yoga mengakui mereka khawatir jalan pintas itu akan merusak rasanya. Gurunya tertawa dan bilang terkadang juru masak menemukan cara yang lebih baik secara tidak sengaja, di bawah tekanan.',
    question: {
      text: 'What does the teacher’s reaction suggest about Yoga and Mira’s soto?',
      id: 'Apa yang tersirat dari reaksi gurunya soal soto Yoga dan Mira?',
      opts: [{ emoji: '😋', lbl: 'It turned out surprisingly delicious despite the shortcut', ok: true }, { emoji: '🤢', lbl: 'It tasted bad because it cooked too fast' }, { emoji: '😐', lbl: 'It tasted exactly the same as everyone else’s' }],
    },
  },
  {
    id: 'pesta-kejutan-sahabat',
    title: 'Pesta Kejutan untuk Sahabat (A Surprise Party for a Friend)',
    scene: '🎉',
    desc: '2 bacaan pendek',
    primer: [
      { passage: ['Nadia wants to plan a surprise birthday party for her best friend, Zahra.', 'She asks five other classmates to help keep the secret.'], id: 'Nadia ingin merencanakan pesta ulang tahun kejutan untuk sahabatnya, Zahra. Dia meminta lima teman sekelas lain untuk membantu menjaga rahasianya.' },
      { passage: ['The plan is to invite Zahra to a fake study group, however the real party will be waiting at Nadia’s house.', 'Everyone promises not to say a single word to Zahra.'], id: 'Rencananya adalah mengundang Zahra ke kelompok belajar palsu, padahal pesta sungguhannya sudah menunggu di rumah Nadia. Semua orang berjanji tidak akan bilang sepatah kata pun ke Zahra.' },
    ],
    drill: [
      {
        passage: ['Two days before the party, one classmate almost tells Zahra by accident, although he stops himself just in time.', 'Nadia reminds everyone again to be extra careful.'],
        id: 'Dua hari sebelum pesta, seorang teman sekelas hampir memberi tahu Zahra tanpa sengaja, meski dia menahan diri tepat waktu. Nadia mengingatkan semua orang lagi untuk lebih hati-hati.',
        question: 'What almost happens two days before the party?',
        questionId: 'Apa yang hampir terjadi dua hari sebelum pesta?',
        opts: [{ emoji: '🤭', lbl: 'A classmate almost tells the secret', ok: true }, { emoji: '🚫', lbl: 'The party gets cancelled' }, { emoji: '💌', lbl: 'Zahra finds an invitation' }],
      },
      {
        passage: ['On the day of the party, Zahra suspects something is strange because all her friends are busy at the same time.', 'She decides not to ask any questions and just waits to see what happens.'],
        id: 'Pada hari pestanya, Zahra curiga ada yang aneh karena semua temannya sibuk di waktu yang sama. Dia memutuskan tidak bertanya apa-apa dan cuma menunggu apa yang akan terjadi.',
        question: 'What does Zahra decide to do about her suspicion?',
        questionId: 'Apa yang diputuskan Zahra soal kecurigaannya?',
        opts: [{ emoji: '⏳', lbl: 'Wait and see what happens', ok: true }, { emoji: '❓', lbl: 'Ask her friends directly' }, { emoji: '🚫', lbl: 'Cancel the study group' }],
      },
    ],
    story: [
      'When Zahra walks into Nadia’s living room expecting a boring study session, the lights suddenly turn on and everyone shouts, “Surprise!”',
      'Zahra freezes for a second, and then her eyes fill with tears of joy.',
      'She later tells Nadia she had actually guessed something was happening, however she never imagined it would be this big.',
      'Nadia smiles and says keeping the secret for two whole weeks was the hardest part.',
    ],
    storyId: 'Ketika Zahra masuk ke ruang tamu Nadia sambil menyangka akan ada sesi belajar yang membosankan, lampunya tiba-tiba menyala dan semua orang berteriak, "Kejutan!" Zahra membeku sesaat, lalu matanya berkaca-kaca karena bahagia. Belakangan dia bilang ke Nadia sebenarnya dia sudah menduga ada sesuatu yang terjadi, namun dia tidak pernah membayangkan akan sebesar ini. Nadia tersenyum dan bilang menjaga rahasia selama dua minggu penuh adalah bagian tersulit.',
    question: {
      text: 'What was the hardest part of the surprise for Nadia?',
      id: 'Apa bagian tersulit dari kejutan itu bagi Nadia?',
      opts: [{ emoji: '🤫', lbl: 'Keeping the secret for two weeks', ok: true }, { emoji: '💸', lbl: 'Paying for the decorations' }, { emoji: '📞', lbl: 'Inviting all the classmates' }],
    },
  },
  {
    id: 'menabung-untuk-sepeda',
    title: 'Menabung untuk Sepeda Baru (Saving for a New Bike)',
    scene: '🚲',
    desc: '2 bacaan pendek',
    primer: [
      { passage: ['Arya has wanted a new mountain bike for months, however the one he likes costs one million five hundred thousand rupiah.', 'He decides to save his allowance instead of asking his parents to buy it for him.'], id: 'Arya sudah ingin sepeda gunung baru selama berbulan-bulan, namun yang dia suka harganya satu juta lima ratus ribu rupiah. Dia memutuskan menabung uang jajannya alih-alih meminta orang tuanya membelikannya.' },
      { passage: ['His parents give him ten thousand rupiah a day, but Arya usually spends half of it on snacks.', 'He decides to change his habit starting this week.'], id: 'Orang tuanya memberinya sepuluh ribu rupiah sehari, tapi Arya biasanya menghabiskan setengahnya untuk jajan. Dia memutuskan mengubah kebiasaannya mulai minggu ini.' },
    ],
    drill: [
      {
        passage: ['In the first month, Arya saves two hundred thousand rupiah, although he still buys snacks twice a week.', 'He keeps the money in a locked box under his bed.'],
        id: 'Bulan pertama, Arya menabung dua ratus ribu rupiah, meski dia masih jajan dua kali seminggu. Dia menyimpan uangnya di kotak terkunci di bawah tempat tidurnya.',
        question: 'How much does Arya save in the first month?',
        questionId: 'Berapa yang ditabung Arya di bulan pertama?',
        opts: [{ emoji: '💰', lbl: 'Two hundred thousand', ok: true }, { emoji: '💵', lbl: 'One hundred thousand' }, { emoji: '💴', lbl: 'Three hundred thousand' }],
      },
      {
        passage: ['Arya’s neighbor offers to pay him to water the plants every morning before school.', 'Arya agrees, even though it means waking up fifteen minutes earlier.'],
        id: 'Tetangga Arya menawarkan membayarnya untuk menyiram tanaman setiap pagi sebelum sekolah. Arya setuju, meski itu berarti bangun lima belas menit lebih awal.',
        question: 'What job does Arya’s neighbor offer him?',
        questionId: 'Pekerjaan apa yang ditawarkan tetangga Arya?',
        opts: [{ emoji: '🌱', lbl: 'Watering plants', ok: true }, { emoji: '🚗', lbl: 'Washing the car' }, { emoji: '🐕', lbl: 'Walking the dog' }],
      },
    ],
    story: [
      'After three months of saving allowance and watering plants, Arya counts his money one evening.',
      'He has exactly one million four hundred thousand rupiah, however the bike he wants now costs one million six hundred thousand because the price went up.',
      'Arya feels disappointed for a moment, but his older sister offers to lend him the difference until his next birthday.',
      'Arya thanks his sister and promises to pay her back with his allowance over the next two months.',
    ],
    storyId: 'Setelah tiga bulan menabung uang jajan dan menyiram tanaman, suatu malam Arya menghitung uangnya. Dia punya tepat satu juta empat ratus ribu rupiah, namun sepeda yang dia inginkan sekarang harganya satu juta enam ratus ribu karena harganya naik. Arya merasa kecewa sesaat, tapi kakak perempuannya menawarkan meminjamkan selisihnya sampai ulang tahunnya berikutnya. Arya berterima kasih ke kakaknya dan berjanji akan membayarnya kembali dengan uang jajannya selama dua bulan ke depan.',
    question: {
      text: 'How much money does Arya still need to reach his goal after counting his savings?',
      id: 'Berapa uang yang masih dibutuhkan Arya setelah menghitung tabungannya?',
      opts: [{ emoji: '💰', lbl: 'Two hundred thousand rupiah', ok: true }, { emoji: '💵', lbl: 'One hundred thousand rupiah' }, { emoji: '💴', lbl: 'Four hundred thousand rupiah' }],
    },
  },
];

export const READING_TOPICS_BY_LEVEL: Partial<Record<LevelKey, AnyReadingTopic[]>> = {
  'little-stars': READING_TOPICS_LITTLE_STARS,
  starter: READING_TOPICS_STARTER,
  explorer: READING_TOPICS_EXPLORER,
  adventurer: READING_TOPICS_ADVENTURER,
  achiever: READING_TOPICS_ACHIEVER,
  trailblazer: READING_TOPICS_TRAILBLAZER,
};
