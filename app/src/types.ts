export interface VocabExample {
  en: string;
  id: string;
  emoji: string;
}

export interface VocabItem {
  en: string;
  id: string;
  emoji: string;
  example: VocabExample;
  /** Kelompok utk mini-game "Kelompokkan" (Kenalan 🎮, `materi/game.md` §7
   *  kandidat #1) — cuma dibaca kalau topiknya py `sortBaskets` (lihat
   *  VocabTopic di bawah). 'a'/'b' generik, makna sesungguhnya dari
   *  `sortBaskets.a/b.label` topik — TIDAK semua item di topik "sortable"
   *  wajib diisi (item tanpa `group` otomatis dilewati mini-game ini). */
  group?: 'a' | 'b';
}

export interface VocabTopic {
  id: string;
  title: string;
  desc: string;
  /** true = topik ini kebanyakan frasa/speech-act (mis. "Sorry", "Thank
   *  You"), bukan benda konkret — emoji-nya cuma proxy ekspresi wajah/gestur
   *  yang AMBIGU kalau jadi satu-satunya penanda jawaban (mis. "Sorry" → 😔
   *  bisa terbaca "sedih", permintaan user: audit "emoji multi tafsir").
   *  Soal Latihan Inti tipe 'audio' (`games/vocabulary.ts` `drawAudio`) pakai
   *  TEKS, bukan emoji, sbg opsi jawaban kalau true. */
  iconAmbiguous?: boolean;
  /** 2 keranjang mini-game "Kelompokkan" (opsional) — kalau topik py ini
   *  DAN minimal 1 item `group:'a'` + 1 item `group:'b'`, topik otomatis
   *  dianggap "sortable" (`isSortableTopic`, `games/vocabulary.ts`) & tombol
   *  🎮 Kenalan tiap kata pakai soal kelompokkan (bukan "Dengar & Tunjuk").
   *  Struktural (bentuk topik), bukan hardcode topic id — pola sama
   *  `isNumberTopic`. */
  sortBaskets?: { a: { label: string; emoji: string }; b: { label: string; emoji: string } };
  items: VocabItem[];
}

export interface ListeningOption {
  emoji: string;
  ok?: boolean;
  lbl?: string;
}

export interface ListeningDrill {
  en: string;
  opts: ListeningOption[];
}

export interface ListeningTopic {
  id: string;
  title: string;
  scene: string;
  desc: string;
  primer: { en: string; id: string }[];
  drill: ListeningDrill[];
  story: string[];
  question: { en: string; opts: ListeningOption[] };
}

/**
 * Format Listening BARU (permintaan user: "format dan flow nya mengikuti
 * vocab") — beda total dari `ListeningTopic` di atas (scene/primer/drill/
 * story/1-pertanyaan-di-akhir, dipakai Explorer & Adventurer, TIDAK disentuh
 * biar tidak regresi). Level yang MEMILIH format baru ini (mulai dari 1
 * materi Little Stars) pakai `items: ListeningSentenceItem[]` — 1 item =
 * 1 kalimat didengar, strukturnya SENGAJA mirip `VocabItem` (en/id/emoji/
 * example) supaya Tantangan (Eja Kata/Susun Kalimat/Penggunaan) bisa
 * mengikuti pola Vocab persis: `en`/`id` = KATA KUNCI tunggal (target Eja
 * Kata), `example` = KALIMAT lengkap yang didengar (target Susun Kalimat/
 * Penggunaan mic/Kenalan 🔊). `question` BARU (tidak ada di VocabItem) —
 * ini yang menjawab "tidak ada pertanyaan" (permintaan user): tiap kalimat
 * WAJIB py pertanyaan komprehensi + 4 pilihan jawaban, dipakai di Latihan
 * Inti & mini-game "Main" Kenalan.
 */
export interface ListeningQuestionOption {
  emoji: string;
  text: string;
  ok: boolean;
}

export interface ListeningSentenceItem {
  en: string;
  id: string;
  emoji: string;
  example: VocabExample;
  question: {
    en: string;
    id: string;
    options: ListeningQuestionOption[];
  };
}

export interface ListeningSentenceTopic {
  id: string;
  title: string;
  desc: string;
  items: ListeningSentenceItem[];
}

/**
 * Format Listening KETIGA (Achiever, ≈A1→A2) — permintaan riset user:
 * Cambridge A2 Flyers (backbone struktural Achiever, PRD §3) py Listening
 * Part 2 resmi "note completion" (dengar percakapan/monolog pendek, lengkapi
 * bagian kosong di form/catatan) — ciri khas yang belum ada di level manapun
 * di app ini. Kenalan & Latihan Inti REUSE PERSIS `items: ListeningSentenceItem[]`
 * (task shape SAMA dgn Little Stars/Starter, TIDAK diduplikasi/didesain
 * ulang) — yang genuinely baru HANYA Tantangan: `noteHeading`/`notePassage`/
 * `noteGaps` di bawah, dirender `runTantanganNote` (`games/listening.ts`),
 * BUKAN dikte kalimat (`runSusunKalimatSentence`) spt 2 level format-baru
 * lain. Anak TAP pilihan kata/angka utk isi tiap gap (bukan ketik bebas —
 * kid-friendly, konsisten dgn SEMUA interaksi Listening lain yang tap-based,
 * beda dari Cambridge asli yang minta anak MENULIS jawaban).
 */
export interface ListeningNoteGap {
  /** Label field di catatan, Bahasa Indonesia, mis. "Nama Dokter". */
  label: string;
  /** Ikon kategori field (bukan per-opsi — opsinya kata/angka abstrak,
   *  tidak py gambar sendiri spt VocabItem) — dipakai berulang di SEMUA
   *  kartu jawaban gap ini via `answerCardsHtml`, mis. 👤 utk gap nama. */
  emoji: string;
  /** Pertanyaan diucapkan TTS utk gap ini, mis. "What is the doctor's name?" */
  question: string;
  questionId: string;
  /** 3–4 kandidat jawaban (kata/angka Inggris) yang ditampilkan sbg tombol tap. */
  options: string[];
  /** Jawaban benar — WAJIB salah satu isi `options`. */
  answer: string;
}

export interface ListeningNoteTopic {
  id: string;
  title: string;
  desc: string;
  /** Kenalan + Latihan Inti — task shape SAMA dgn `ListeningSentenceTopic`. */
  items: ListeningSentenceItem[];
  /** Judul catatan/form yang ditampilkan di Tantangan, mis. "📝 Catatan Kunjungan Dokter". */
  noteHeading: string;
  /** 3–5 kalimat percakapan/monolog pendek yang diputar TTS — sumber jawaban semua gap. */
  notePassage: { en: string; id: string }[];
  /** Field yang harus dilengkapi anak, urut sesuai urutan info di `notePassage`. */
  noteGaps: ListeningNoteGap[];
}

/**
 * Format Listening KEEMPAT (Trailblazer, ≈B1) — permintaan riset user:
 * Cambridge KET (A2 Key for Schools) → PET (B1 Preliminary for Schools) sama2
 * py bagian Listening "identify gist/main idea" & "extended interview +
 * inferensi sikap/opini" (`materi/listening.md` §3F) — beda dari note
 * completion Achiever (isi FAKTA spesifik dari 1 passage pendek): di sini
 * anak dengar 1 PERCAKAPAN 2-arah lebih panjang (`dialogueLines`), lalu
 * jawab pertanyaan yang butuh MEMAHAMI KESELURUHAN percakapan (topik utama,
 * perasaan/sikap tokoh, dugaan tindakan selanjutnya) — bukan tangkap 1 fakta
 * literal. Kenalan & Latihan Inti REUSE PERSIS `items: ListeningSentenceItem[]`
 * (task shape SAMA dgn 2 level format-baru lain) — yang genuinely baru cuma
 * Tantangan: `dialogueHeading`/`dialogueLines`/`inferenceQuestions` di bawah,
 * dirender `runTantanganDialogue` (`games/listening.ts`). Sama spt note
 * completion: TAP pilihan (bukan menulis bebas) — kid-friendly.
 */
export interface ListeningDialogueLine {
  /** Nama tokoh yang bicara, mis. 'Rani' — ditampilkan di transkrip
   *  (`revealed` via 💡 Petunjuk), TIDAK pernah dibacakan TTS (cuma `en`). */
  speaker: string;
  en: string;
  id: string;
}

export interface ListeningInferenceOption {
  emoji: string;
  text: string;
  ok: boolean;
}

export interface ListeningInferenceQuestion {
  /** Pertanyaan gist/sikap/dugaan-tindakan TENTANG SELURUH percakapan (bukan
   *  1 baris tertentu) — mis. "What are they mainly talking about?". */
  question: string;
  questionId: string;
  /** Tepat 4 opsi, tepat 1 `ok:true` — sama kontrak dgn `ListeningQuestionOption`. */
  options: ListeningInferenceOption[];
}

export interface ListeningDialogueTopic {
  id: string;
  title: string;
  desc: string;
  /** Kenalan + Latihan Inti — task shape SAMA dgn `ListeningSentenceTopic`. */
  items: ListeningSentenceItem[];
  /** Judul percakapan yang ditampilkan di Tantangan, mis. "Rencana Liburan". */
  dialogueHeading: string;
  /** 6–8 baris percakapan 2 tokoh bergantian — diputar utuh via `speakSequence`
   *  (urutan `en` semua baris), transkrip+nama tokoh cuma kelihatan lewat
   *  💡 Petunjuk (audio-first, sama prinsipnya dgn `notePassage` Achiever). */
  dialogueLines: ListeningDialogueLine[];
  /** 3 pertanyaan gist/sikap/dugaan-tindakan TENTANG percakapan yang SAMA —
   *  dijawab satu per satu (bukan diacak — bukan krn urutan info spt Achiever,
   *  tapi krn 1↔3 SENGAJA disusun "gist → sikap tokoh → dugaan tindakan",
   *  urutan kesulitan pemahaman yang naik). */
  inferenceQuestions: ListeningInferenceQuestion[];
}

/** Item Listening yang punya Kenalan/Latihan Inti generik (`items`) — dipakai
 *  sbg tipe parameter `renderKenalanSentence`/`runLatihanIntiSentence`
 *  (`games/listening.ts`) supaya ketiga fungsi itu jalan APA ADANYA baik utk
 *  `ListeningSentenceTopic` (Little Stars/Starter, Tantangan = Susun Kalimat),
 *  `ListeningNoteTopic` (Achiever, Tantangan = Lengkapi Catatan), maupun
 *  `ListeningDialogueTopic` (Trailblazer, Tantangan = Dengar & Simpulkan) —
 *  cuma Tantangan yang beda per varian, jadi cuma Tantangan yang butuh
 *  dipisah di pemanggilnya (`app.ts` `runStage`, lihat pembeda kedua
 *  `'noteGaps' in topic` / `'dialogueLines' in topic` di sana). */
export type ListeningItemsTopic = ListeningSentenceTopic | ListeningNoteTopic | ListeningDialogueTopic;

/** Union dipakai `LISTENING_TOPICS_BY_LEVEL` (content.ts) supaya level lama
 *  (format `ListeningTopic`), 2 varian format-baru "py `items`"
 *  (`ListeningSentenceTopic` dikte, `ListeningNoteTopic` note completion), &
 *  format KEEMPAT (`ListeningDialogueTopic`, gist/inferensi) bisa hidup
 *  berdampingan di peta yang sama — pembeda runtime tingkat-1 cuma
 *  `'items' in topic` (lihat `app.ts` `runStage`,
 *  `games/boss.ts` `runListenPhase` — SEMUA lokasi ini cuma butuh tahu
 *  "format lama vs py `items`", jadi TIDAK perlu diubah lagi walau nambah
 *  format baru ke-4/ke-5/dst). Pembeda tingkat-2 (pilih Tantangan yang mana
 *  dari 3 varian "py `items`") pakai `'noteGaps' in topic` (Achiever) lalu
 *  `'dialogueLines' in topic` (Trailblazer), fallback dikte (Little Stars/
 *  Starter) — cuma dipakai di `app.ts` `runStage` step Tantangan &
 *  `topicProgressPercent`. */
export type AnyListeningTopic = ListeningTopic | ListeningSentenceTopic | ListeningNoteTopic | ListeningDialogueTopic;

/**
 * Reading — beda dari Listening: `passage`/`story` dibaca SENDIRI (silent,
 * TIDAK PERNAH diucapkan TTS di kind ini, konsisten dgn `reading` di First
 * Placement Test/placement-test-data.ts) supaya beneran menguji baca, bukan
 * dengar. `ReadingDrill.passage` bisa 1-2 kalimat pendek (beda dari
 * ListeningDrill yang cuma 1 kalimat diucapkan).
 *
 * `id`/`questionId` — 🔒 revisi user ("di latihan inti dan tantangan
 * translasinya berupa klik button petunjuk") — terjemahan Indonesia
 * gabungan dari `passage`/`question`, TAPI TIDAK PERNAH ditampilkan
 * otomatis (beda dari `primer`/Kenalan yg translasinya SELALU terlihat) —
 * cuma muncul lewat tombol "💡 Petunjuk" yg sengaja disembunyikan default,
 * konsisten dgn prinsip "Reading tidak pernah TTS": bantuan tetap ada, tapi
 * WAJIB diusahakan (tap dulu), bukan disodorkan gratis spt Kenalan.
 */
export interface ReadingDrill {
  passage: string[];
  id: string;
  question: string;
  questionId: string;
  opts: ListeningOption[];
}

export interface ReadingTopic {
  id: string;
  title: string;
  scene: string;
  desc: string;
  primer: { passage: string[]; id: string }[];
  drill: ReadingDrill[];
  story: string[];
  /** Terjemahan Indonesia gabungan dari `story` — sama prinsip `ReadingDrill.id`
   *  di atas, cuma muncul lewat 💡 Petunjuk di Tantangan. */
  storyId: string;
  question: { text: string; id: string; opts: ListeningOption[] };
}

/**
 * Format KEDUA Reading — "Baca Kata" (whole-word/sight-word ↔ gambar),
 * khusus Little Stars (3–5 th, pre-literate/baru mulai kenal huruf). BEDA
 * PRINSIP dari `ReadingTopic` di atas (format lama, Adventurer): itu menguji
 * KOMPREHENSI kalimat/cerita (anak SUDAH bisa membaca kalimat) — riset
 * (`materi/reading.md` §5) mengonfirmasi anak 3–5th di app manapun (Reading
 * Eggs, Endless Reader, HOMER, Starfall, Teach Your Monster to Read) &
 * kurikulum Indonesia (Kurikulum Merdeka Fase Fondasi, EF Small Stars)
 * SELALU mulai dari pengenalan KATA TUNGGAL (whole-word/sight-word), bukan
 * kalimat/cerita — komprehensi multi-kalimat digerbangi jauh di belakang
 * puluhan pelajaran prasyarat, bukan aktivitas pembuka. `items` sengaja
 * dipetakan dari kosakata Vocab Little Stars yang SUDAH dikenal anak (bukan
 * daftar kata generik baru spt kompetitor) — anak melatih ULANG kata yang
 * familiar lewat modalitas baca, pola sama dgn keputusan Listening Little
 * Stars (`materi/listening.md` §4A). Pembeda runtime dari `ReadingTopic`
 * lama: `'items' in topic` (lihat `AnyReadingTopic` di bawah, sama pola dgn
 * `AnyListeningTopic`).
 *
 * 🔒 Divergensi SENGAJA dari aturan "Reading tidak pernah TTS" (komentar
 * `ReadingTopic` di atas & CLAUDE.md) — KHUSUS format ini, kata BOLEH
 * diucapkan `speak()` (lihat `games/reading.ts` `renderKenalanWord`/
 * `runLatihanIntiWord`/`runTantanganWord`). Alasan (riset `materi/
 * reading.md` §5): tujuan `ReadingTopic` lama adalah menguji DEKODING
 * MANDIRI (anak sudah bisa baca sendiri, jangan dibantu dengar) — tujuan
 * format ini beda total, MEMBANGUN asosiasi bentuk-cetak↔bunyi↔makna (print
 * awareness) utk anak yang BELUM bisa decode, jadi bantuan dengar itu
 * sendiri bagian dari mekanisme belajarnya (persis pola Reading Eggs/HOMER/
 * Kumon — semua pasangkan audio+cetak di tahap paling awal ini). Jangan
 * generalisasi divergensi ini ke `ReadingTopic` lama (Adventurer) tanpa
 * arahan baru user.
 */
export interface ReadingWordItem {
  en: string;
  id: string;
  emoji: string;
}

export interface ReadingWordTopic {
  id: string;
  title: string;
  scene: string;
  desc: string;
  items: ReadingWordItem[];
}

/**
 * Format KETIGA Reading — "Baca & Nilai" (Benar/Salah), khusus Explorer
 * (7–9 th, ≈Pre-A1→A1). Riset (`materi/reading.md` §9.2, prioritas
 * Kurikulum Merdeka Fase B & Cambridge Pre A1 Starters — backbone struktural
 * Explorer) mengonfirmasi format INI BUTUH BARU, BUKAN versi kecil dari
 * `ReadingTopic` (Adventurer, backbone A1 Movers) — Starters exam strukturnya
 * genuinely lebih ringan (1 kalimat+gambar → centang/silang, BUKAN passage
 * multi-kalimat+MCQ). Format ini masuk keluarga "silent reading" yang SAMA
 * dgn `ReadingTopic` (TTS TIDAK PERNAH dipakai di kind manapun — beda dari
 * `ReadingWordTopic` yang audio-nya sengaja aktif utk pra-pembaca) — titik
 * PERTAMA di tangga Reading yang menguji SATU KALIMAT UTUH dibaca sendiri
 * (naik dari kata/frasa `ReadingWordTopic`, turun dari passage
 * `ReadingTopic`).
 */
export interface ReadingCheckItem {
  emoji: string;
  /** Kalimat Inggris yang BENAR menggambarkan `emoji`. */
  trueSentence: string;
  /** Kalimat Inggris yang SALAH menggambarkan `emoji` — near-miss masuk akal
   *  (ganti PERSIS 1 kata, mis. kata sifat berlawanan), bukan kalimat absurd
   *  yang gampang ditebak tanpa membaca. */
  falseSentence: string;
  /** Terjemahan `trueSentence` — dipakai Kenalan SAJA (exposure), tidak
   *  pernah ditampilkan di Latihan Inti/Tantangan (itu yang justru diuji:
   *  baca Inggrisnya sendiri, tanpa bantuan terjemahan). */
  id: string;
}

export interface ReadingCheckTopic {
  id: string;
  title: string;
  scene: string;
  desc: string;
  checks: ReadingCheckItem[];
}

/** Union dipakai `READING_TOPICS_BY_LEVEL` (content.ts) supaya 3 format
 *  Reading bisa hidup berdampingan — pembeda runtime BERTINGKAT (`app.ts`
 *  `runStage`, sama pola dgn `AnyListeningTopic`):
 *  `'items' in topic` → `ReadingWordTopic` (Little Stars/Starter);
 *  `'checks' in topic` → `ReadingCheckTopic` (Explorer); selain itu →
 *  `ReadingTopic` (Adventurer/Achiever, format lama). */
export type AnyReadingTopic = ReadingTopic | ReadingWordTopic | ReadingCheckTopic;

export interface SpeakingTopic {
  id: string;
  title: string;
  desc: string;
  model: string[];
  drill: string[];
  roleplay: string[];
}

/**
 * Format KEDUA Speaking (`SpeakingPhraseTopic`) — khusus Little Stars (3–5
 * th). Riset (`materi/speaking.md` §3) mengonfirmasi 3 sumber independen
 * (LIA GEVYL, EF Indonesia/English1 Small Stars, Kumon Indonesia EFL) SEMUA
 * berhenti di pola "dengar model → tirukan" (echo/imitation) di usia ini —
 * TPR-berat, tanpa percakapan bebas. `SpeakingTopic` lama (`model`/`drill`/
 * `roleplay`, Explorer/Adventurer) py `roleplay` open-ended (jawaban bebas
 * apa pun diterima) yang cocok utk anak lebih besar, tapi TERLALU maju utk
 * Little Stars yang belum bisa berkonversasi bebas — perlu format baru
 * berbasis TARGET tertutup (1 frasa benar per soal, bisa diskor), bukan
 * genapkan format lama.
 *
 * `en`/`id`/`emoji` = kata kunci tunggal (konsisten `VocabItem`/
 * `ListeningSentenceItem`) — dipakai label kartu mini-game & identitas
 * topik. `phrase` (BUKAN `example` spt Vocab/Listening — nama field sengaja
 * beda krn di sini frasa ini BUKAN cuma "contoh pemakaian" tapi ITULAH yang
 * harus diucapkan anak) = 2–4 kata, sengaja LEBIH dari 1 kata supaya
 * `wordMatchDetail()` (skor proporsional, Aturan Wajib Speaking CLAUDE.md)
 * punya lebih dari 1 kata utk dibandingkan — kalau targetnya cuma 1 kata,
 * skornya cuma biner (kedengaran/tidak), tidak benar² proporsional.
 *
 * Tidak ada field `options`/`question` per-item (beda dari
 * `ListeningSentenceItem`) — 4 opsi kartu mini-game "Main" Kenalan
 * (`games/speaking.ts` `buildPhraseOptions`) dibangun DINAMIS dari sesama
 * `items` topik yang sama (pola sama `ReadingWordTopic`/`buildWordOptions`),
 * bukan diauthoring manual per-item — mini-game-nya murni "kata mana yang
 * baru kamu dengar", jawabannya SELALU salah satu kata sesama topik, jadi
 * tidak perlu opsi hand-picked spt Listening (yang butuh pertanyaan
 * komprehensi genuinely berbeda per kalimat).
 */
export interface SpeakingPhraseItem {
  en: string;
  id: string;
  emoji: string;
  phrase: VocabExample;
}

export interface SpeakingPhraseTopic {
  id: string;
  title: string;
  desc: string;
  items: SpeakingPhraseItem[];
}

/**
 * Format KETIGA Speaking (`SpeakingInterviewTopic`) — khusus Trailblazer
 * (12+ th, ≈B1). Riset (`materi/speaking.md` §9): Cambridge A2 Key (KET) →
 * B1 Preliminary (PET) — backbone struktural Trailblazer — Speaking test-nya
 * format INTERVIEW ANTAR-KANDIDAT (2 anak saling bicara + examiner), BUKAN
 * lagi 1 anak vs examiner spt Starters/Movers/Flyers. Solo-app TIDAK BISA
 * menghadirkan kandidat KEDUA sungguhan — diakali dgn "kandidat A" FIKTIF
 * (`peerName`, TTS, SATU suara yg sama dgn narator — nama tokoh ditampilkan
 * scr TEKS/label saja, TIDAK PERNAH diucapkan sendiri, sama pola persis
 * `ListeningDialogueLine.speaker`) yang MENJAWAB DULU tiap pertanyaan sbg
 * model jawaban natural, BARU giliran anak (kandidat B, via mic) menjawab
 * pertanyaan yg SAMA dgn kata-katanya sendiri — pola "giliran" ini yang
 * mensimulasikan RASA interview 2-arah tanpa perlu partner sungguhan.
 *
 * Jawaban anak SELALU personal/terbuka (tidak ada "jawaban benar" tunggal,
 * beda dari `SpeakingPhraseItem`) — skor proporsional TIDAK berlaku (sama
 * alasan `roleplay` `SpeakingTopic` lama, §CLAUDE.md), tapi "▶️ Play
 * Suaramu" TETAP wajib (bagian aturan yg tidak bersyarat py-target).
 */
export interface SpeakingInterviewTurn {
  question: { en: string; id: string };
  /** Jawaban model "kandidat A" (`peerName`) — didengar SEBELUM giliran anak
   *  di Latihan Inti (scaffold), disembunyikan default di Tantangan (recall,
   *  cuma kelihatan lewat "💡 Dengar Contoh [peerName]"). */
  peerAnswer: { en: string; id: string };
}

export interface SpeakingInterviewTopic {
  id: string;
  title: string;
  desc: string;
  /** Nama "kandidat A" fiktif, mis. "Bima" — ditampilkan sbg label
   *  percakapan (reuse `.dialogue-line`/`.dialogue-speaker`, `styles.css`),
   *  TIDAK PERNAH diucapkan TTS sendiri (cuma `question`/`peerAnswer.en`). */
  peerName: string;
  turns: SpeakingInterviewTurn[];
}

/**
 * Format KEEMPAT Speaking (`SpeakingStoryTopic`) — audit user: "'main', 'core
 * practice', dan 'challenge' speaking section... exercises are all basically
 * the same" + ide konkret "simple stories featuring text and images,
 * accompanied by questions" (contoh: "Andi likes dogs, and Andi has a cat. —
 * What does Andi have?"). 3 tugas SpeakingTopic lama (model/drill/roleplay)
 * SEMUANYA murni produksi lisan tanpa lapisan KOMPREHENSI — anak tidak pernah
 * diminta memproses beberapa fakta lalu memilih yang relevan sebelum
 * berbicara. Format ini menutup gap itu dgn REUSE pola "cerita mini + 1
 * fakta pengecoh + pertanyaan" yang SUDAH terbukti di `ListeningTopic.story`/
 * `ReadingTopic.story` (mis. `LISTENING_TOPICS` topik `toko`: "Andi sees a
 * banana. He buys a red apple." — distraktor disebut duluan), TAPI beda dari
 * keduanya: jawabannya WAJIB DIUCAPKAN via mic (bukan tap gambar), skor
 * proporsional (`wordMatchDetail` thd `answer`, BUKAN skor biner) — genuinely
 * `SPEAKING` (produksi), bukan cuma dengar/baca+pilih.
 */
export interface SpeakingStoryLine {
  en: string;
  id: string;
}

export interface SpeakingStoryItem {
  /** Emoji ilustrasi cerita ("images" pada permintaan user) — 1 gambar utk
   *  SELURUH cerita (bukan per-baris), ditampilkan besar di atas teks. */
  emoji: string;
  /** 2–3 kalimat, SATU di antaranya SENGAJA fakta pengecoh (pola sama
   *  `ListeningTopic.story`/`ReadingTopic.story`) — anak wajib memilah fakta
   *  mana yg relevan dgn `question`, bukan asal ambil kalimat pertama. */
  lines: SpeakingStoryLine[];
  question: { en: string; id: string };
  /** Jawaban lengkap 1 kalimat (BUKAN cuma 1 kata) yg diucapkan anak — target
   *  `wordMatchDetail`, harus bisa ditelusuri langsung dari salah satu
   *  `lines` (bukan fakta baru yg tidak disebut cerita). */
  answer: { en: string; id: string };
}

export interface SpeakingStoryTopic {
  id: string;
  title: string;
  desc: string;
  stories: SpeakingStoryItem[];
}

/** Union dipakai `SPEAKING_TOPICS_BY_LEVEL` (content.ts) supaya format lama
 *  (`SpeakingTopic`, Explorer/Adventurer/Achiever, roleplay bebas), format
 *  KEDUA "py `items`" (`SpeakingPhraseTopic`, Little Stars/Starter, target
 *  tertutup), format KETIGA "py `turns`" (`SpeakingInterviewTopic`,
 *  Trailblazer, interview simulasi), & format KEEMPAT "py `stories`"
 *  (`SpeakingStoryTopic`, cerita mini + pertanyaan dijawab lisan) bisa hidup
 *  berdampingan DI DALAM 1 array level yang sama (mis. `SPEAKING_TOPICS`
 *  Explorer bisa berisi campuran `SpeakingTopic` & `SpeakingStoryTopic` —
 *  dispatch selalu per-TOPIK, bukan per-level, jadi mixing ini aman) —
 *  pembeda runtime tingkat-1 `'items' in topic`, tingkat-2 `'turns' in
 *  topic`, tingkat-3 `'stories' in topic` — dicek di `app.ts`
 *  `runStage`, `games/boss.ts` `runSpeakPhase`, sama pola
 *  persis dgn `AnyListeningTopic`/`AnyReadingTopic`. */
export type AnySpeakingTopic = SpeakingTopic | SpeakingPhraseTopic | SpeakingInterviewTopic | SpeakingStoryTopic;

export interface GrammarExample {
  en: string;
  emoji: string;
}

export interface GrammarScramble {
  emoji: string;
  target: string[];
}

export interface GrammarFillOption {
  word: string;
  emoji: string;
}

export interface GrammarFill {
  before: string[];
  after: string[];
  options: GrammarFillOption[];
}

export interface GrammarTopic {
  id: string;
  title: string;
  desc: string;
  examples: GrammarExample[];
  scramble: GrammarScramble[];
  fill: GrammarFill;
}

/**
 * Format KEDUA Grammar (`GrammarPatternTopic`) — khusus Little Stars (3–6 th)
 * & Starter (5–7 th), audio+gambar murni (BUKAN teks-first spt `GrammarTopic`
 * lama — anak di kedua level ini belum/baru bisa baca kalimat sendiri).
 * Riset awal (`materi/grammar.md` §3/§4, Little Stars) mengonfirmasi TIDAK
 * ADA institusi (LIA GEVYL, EF Small Stars, Kumon) maupun app kompetitor yang
 * mengajarkan RUMUS grammar eksplisit ke usia ini — semua pattern exposure
 * murni (Kumon "Look, Listen, Repeat", Cambridge Starters "listen & point").
 *
 * `formA`/`formB` (BUKAN lagi `singular`/`plural` — **direname riset lanjutan
 * per-level**: format ini generik utk KONTRAS 2-kalimat manapun yang cocok
 * dgn mekanik "dengar 1 bentuk → tunjuk gambar cocok" & kebalikannya, bukan
 * cuma singular/plural. Little Stars pakai utk singular/plural ("It's a
 * car."/"They're cars."), Starter pakai utk suka/tidak suka ("I like
 * drawing."/"I don't like drawing.", Cambridge Starters "present simple
 * positive/negative") — 2 field TERPISAH, bukan 1 kalimat + transformasi
 * kode, krn transformasinya beda-beda per kontras (jamak tidak beraturan,
 * negasi butuh "don't", dst) — ditulis manual per item.
 *
 * `contrastVisual` menentukan cara `contrastVisualInner()` (`games/
 * grammar.ts`) menggambar 2 kartu kontrasnya — SEKARANG 5 varian (riset
 * lanjutan "genapkan topik per level", `materi/grammar.md` §13/§14,
 * Cambridge Pre-A1 Starters official structure list — cuma struktur yang
 * genuinely reduce ke SATU pasangan kontras statis yang dipilih, struktur
 * lain spt present continuous/prepositions TIDAK cocok mekanik ini, dicatat
 * sbg gap yg tetap perlu format lain):
 *  - `'quantity'` (default, Little Stars `satu-banyak`, Starter `ada-apa-
 *    di-sini` — gambar diulang 1x vs 2x, jumlah = jawaban; dipakai jg utk
 *    "there is/there are" krn strukturnya sama-sama singular-vs-plural,
 *    cuma frame kalimatnya beda drpd "it's/they're").
 *  - `'polarity'` (Starter `suka-tidak-suka`, Little Stars `punya-tidak-
 *    punya`/`bisa-tidak-bisa` — gambar + lencana ✅ vs ❌, positif/negatif =
 *    jawaban; dipakai jg utk "have got"/"can" krn strukturnya SAMA positif-
 *    vs-negatif spt present simple positive/negative, cuma kata kerjanya
 *    beda).
 *  - `'proximity'` (Little Stars `ini-itu` — demonstrative this/that,
 *    struktur Starters resmi "This is my car."/"Is that yours?": gambar
 *    besar+🔍 utk "this" [dekat], gambar kecil+🔭 utk "that" [jauh] — proxy
 *    JARAK, bukan jumlah/polaritas).
 *  - `'size'` (Little Stars `besar-kecil` — adjective ukuran, struktur
 *    Starters resmi "He's a small boy.": gambar besar utk "big", gambar
 *    kecil utk "small" — proxy UKURAN itu sendiri, TANPA lencana tambahan
 *    krn ukuran ITU SENDIRI yang jadi konten yang diajarkan, bukan proxy ke
 *    konsep lain).
 *  - `'character'` (BARU, Starter `miliknya-siapa`/`dia-siapa` — possessive
 *    his/her & subject pronoun he/she, DUA struktur Starters resmi berbeda
 *    yang KEBETULAN py bentuk visual sama: gambar + lencana 👦 [formA] vs 👧
 *    [formB] — beda dari `'polarity'` krn lencananya representasi KARAKTER
 *    (siapa yang punya/melakukan), bukan status ya/tidak).
 *  - `'possessor'` (BARU, Little Stars `punya-siapa` — possessive adjective
 *    1st/2nd person my/your, struktur Starters resmi kategori SAMA dgn
 *    `'character'` tapi DEIKSIS beda total: gambar + lencana 🙋 [formA, "my"]
 *    vs 🫵 [formB, "your"] — proxy PEMBICARA vs LAWAN BICARA, bukan
 *    karakter org ketiga spt `'character'`.
 *  - `'inclusion'` (BARU, Starter `kita-mereka`/`milik-kita-milik-mereka` —
 *    subject pronoun we/they & possessive determiner our/their, PLURAL
 *    person yg belum pernah dilatih (`'character'`/`'possessor'` semua
 *    TUNGGAL): gambar + lencana 🙋 [formA, "we/our", GRUP TERMASUK
 *    pembicara] vs 👉 [formB, "they/their", GRUP DI LUAR pembicara] — proxy
 *    INKLUSI grup, beda dari `'possessor'` yg org-ke-2 TUNGGAL (kamu),
 *    bukan grup.
 * Field ini yang bikin SATU mekanik (Kenalan/Latihan Inti/Tantangan
 * `games/grammar.ts`) bisa dipakai ulang lintas kontras grammar BEDA tanpa
 * mekanik baru per level/topik — cuma variasi visual, bukan variasi task
 * shape. Nambah kontras grammar BARU yg TIDAK cocok salah satu dari 7
 * varian ini (structure list lengkap + alasan cocok/tidak: `materi/
 * grammar.md` §13/§14/§20/§21) BUTUH varian visual baru lagi di
 * `contrastVisualInner()`, bukan otomatis didukung.
 */
export interface GrammarPatternForm {
  en: string;
  id: string;
}

export type GrammarContrastVisual = 'quantity' | 'polarity' | 'proximity' | 'size' | 'character' | 'possessor' | 'inclusion';

export interface GrammarPatternItem {
  en: string;
  id: string;
  emoji: string;
  formA: GrammarPatternForm;
  formB: GrammarPatternForm;
}

export interface GrammarPatternTopic {
  id: string;
  title: string;
  desc: string;
  /** Default `'quantity'` kalau tidak diisi (kompatibel dgn topik Little
   *  Stars yang sudah ada sebelum field ini ditambahkan). */
  contrastVisual?: GrammarContrastVisual;
  items: GrammarPatternItem[];
}

/**
 * Format KETIGA Grammar (`GrammarTransformTopic`) — khusus Trailblazer (12+
 * th, ≈B1). Riset per-level (`materi/grammar.md` §9): struktur baru PET
 * (passive voice, reported speech, conditionals) diuji Cambridge sendiri
 * lewat **key-word sentence transformation** (Writing Part 1 resmi PET —
 * tulis ulang kalimat B supaya bermakna sama dgn kalimat A) — task shape yang
 * TIDAK BISA dijawab `GrammarTopic` (scramble 1 kalimat/fill 1 kata) ATAUPUN
 * `GrammarPatternTopic` (2 bentuk kalimat TETAP, bukan transformasi terbuka)
 * — genuinely butuh format baru, sama alasan Listening (`ListeningDialogueTopic`)
 * & Speaking (`SpeakingInterviewTopic`) py format baru sendiri utk Trailblazer.
 * Dibuat kid-friendly via MCQ (pilih hasil transformasi yang benar dari
 * beberapa opsi, REUSE `answerCardsHtml`-style), BUKAN menulis bebas.
 *
 * Topik pertama = reported speech (paling umum/fundamental dari 3 struktur
 * PET di atas) — SENGAJA dibatasi ke kalimat PERNYATAAN present simple saja
 * (bukan campur pertanyaan/perintah yg py aturan transformasi beda: "asked
 * if"/"told to") supaya konsisten & tidak membebani anak dgn 3 pola sekaligus
 * di topik pertama.
 */
export interface GrammarTransformOption {
  text: string;
  ok: boolean;
}

export interface GrammarTransformItem {
  /** Nama tokoh yang mengucapkan kalimat langsung, mis. "Rani" — ditampilkan
   *  sbg label kutipan, TIDAK PERNAH diucapkan TTS sendiri (cuma `original`/
   *  opsi `reportedOptions`), sama pola `ListeningDialogueLine.speaker`. */
  speaker: string;
  emoji: string;
  original: string;
  originalId: string;
  /** 4 opsi hasil reported speech, TEPAT 1 `ok:true` — distraktor ditulis
   *  MANUAL (bukan digenerate dari sibling item) krn harus tetap relevan ke
   *  KUTIPAN yang sama (kesalahan umum: lupa geser tense, kata ganti salah,
   *  tense salah total) — beda dari Tantangan (arah dibalik, `games/
   *  grammar.ts` `runTantanganTransform`) yang distraktornya AMAN diambil
   *  dari `original` sesama item topik (kutipan tokoh LAIN, otomatis jadi
   *  opsi salah yang masuk akal, pola sama `buildWordOptions`). */
  reportedOptions: GrammarTransformOption[];
}

export interface GrammarTransformTopic {
  id: string;
  title: string;
  desc: string;
  transforms: GrammarTransformItem[];
}

/** Union dipakai `GRAMMAR_TOPICS_BY_LEVEL` (content.ts) supaya format LAMA
 *  (`GrammarTopic`, Explorer/Adventurer/Achiever, teks-first scramble/fill),
 *  format KEDUA "py `items`" (`GrammarPatternTopic`, Little Stars/Starter,
 *  audio+gambar), & format KETIGA "py `transforms`" (`GrammarTransformTopic`,
 *  Trailblazer, transformasi kalimat) bisa hidup berdampingan — pembeda
 *  runtime tingkat-1 `'items' in topic` (format kedua vs lainnya), tingkat-2
 *  `'transforms' in topic` (format ketiga vs format lama) — dicek di
 *  `app.ts` `runStage`, `games/boss.ts` grammar phase,
 *  sama pola persis dgn `AnySpeakingTopic`. */
export type AnyGrammarTopic = GrammarTopic | GrammarPatternTopic | GrammarTransformTopic;

export type SkillKey = 'vocabulary' | 'listening' | 'reading' | 'speaking' | 'grammar';

export interface SkillMeta {
  label: string;
  emoji: string;
  tagline: string;
  /** Nama mini-game nyata di dalam skill ini — dipakai sebagai preview di kartu. */
  activities: string[];
  accent: string;
  accentBg: string;
}

/** 6 level di tangga PRD §3 — Little Stars, Starter, Explorer, Adventurer, Achiever, Trailblazer. */
export type LevelKey = 'little-stars' | 'starter' | 'explorer' | 'adventurer' | 'achiever' | 'trailblazer';

/** 5 tingkat kesulitan Raja Kata (Word Match, `games/wordmatch.ts`) —
 *  terpisah total dari LevelKey anak, murni memilih jumlah pasangan &
 *  kompleksitas kata. 5 tingkat (bukan 3) sejak permintaan user "untuk raja
 *  kata minimal 5 kerajaan" — tiap tingkat = 1 kerajaan/markas di Map
 *  Kerajaan Kata (`JOURNEY_NODES`, games/wordmatch.ts), makin ke belakang
 *  makin banyak pasangan & makin jarang katanya. */
export type WordMatchDifficulty = 'mudah' | 'sedang' | 'sulit' | 'jago' | 'legendaris';

/** 5 tingkat kesulitan Raja Balon (Balloon Pop, `games/balloonpop.ts`) — pola
 *  SAMA PERSIS `WordMatchDifficulty` (5 tingkat = 5 markas Map Kerajaan
 *  Balon, `JOURNEY_NODES` di `games/balloonpop.ts`, sejak "jadikan konsepnya
 *  seperti Raja Kata"), di sini mengatur KECEPATAN naik balon (mudah=paling
 *  lambat) SEKALIGUS bank kata (mudah=kata pendek, legendaris=kata paling
 *  panjang/jarang) — bukan jumlah pasangan spt Word Match. */
export type BalloonDifficulty = 'mudah' | 'sedang' | 'sulit' | 'jago' | 'legendaris';

/** Satu entri di tangga level. `hasContent` membedakan level yang sudah punya
 *  materi nyata (v1: cuma Explorer) dari yang masih placeholder di Peta Level —
 *  dipakai supaya map tidak pernah menampilkan tombol ke materi yang belum ada. */
export interface LevelMeta {
  key: LevelKey;
  name: string;
  emoji: string;
  /** '' untuk Little Stars — sengaja tanpa badge CEFR (PRD §7). */
  cefr: string;
  age: string;
  hasContent: boolean;
}

export type Screen =
  | 'home'
  | 'menu'
  | 'topics'
  | 'activity'
  | 'settings'
  | 'rapor'
  /** Perhentian yang sudah terbuka tapi materinya belum ada (`hasContent:false`)
   *  — layar placeholder jujur, lihat `renderLevelSoon` di app.ts. */
  | 'levelSoon'
  | 'boss'
  | 'game'
  /** Main 1 "Raja" Game Hub (`state.gameKey`) — halaman TERSENDIRI (permintaan
   *  user: "ketika klik icon game maka ke halaman baru... sehingga navbar
   *  dibawahnya hilang"), URL `/game/<slug-raja>` (lihat `RAJA_SLUG` app.ts),
   *  rail/topline/tabbar disembunyikan sama pola `body.is-placement-test`
   *  (lihat `render()`/styles.css). Dulu bukan `Screen` sendiri — `openRajaGame`
   *  cuma menimpa `root.innerHTML` langsung tanpa route/URL, itu sebabnya
   *  tabbar dulu masih nyangkut kelihatan di layar ini. */
  | 'gamePlay'
  | 'account'
  | 'placementTest'
  /** Homepage marketing (hero/cara-kerja/fitur/testimoni/CTA) — satu-satunya
   *  layar yang boleh dilihat pengunjung yang BELUM login sebelum digerbang
   *  ke 'account' (lihat gerbang login di app.ts `render()`). */
  | 'landing';

/** Tujuan navigasi yang benar-benar ada di app (rail desktop & tab bar mobile). */
export type NavKey = 'home' | 'belajar' | 'game' | 'rapor' | 'settings';

/** Roster "Raja" Game Hub (`app.ts` `RAJA_LIST`) — dipindah ke sini (dari
 *  dulunya lokal di app.ts) supaya `AppState.gameKey` (screen 'gamePlay')
 *  bisa dityped kuat, bukan `string`. */
export type RajaKey = 'kata' | 'balon' | 'susun' | 'kelompok' | 'ingatan' | 'soundhunt' | 'storyquest';

export interface AppState {
  screen: Screen;
  skillKey: SkillKey | null;
  topicIndex: number;
  step: number;
  /** Level yang lagi dicoba di layar Tantangan Bos (screen 'boss'). */
  bossLevel: LevelKey | null;
  /** Level yang sedang dilihat di layar "materi segera hadir" (screen
   *  'levelSoon') — dipisah dari `bossLevel` supaya dua layar ini tidak
   *  saling menimpa state satu sama lain. */
  soonLevel: LevelKey | null;
  /** Level yang sedang DIJELAJAHI di alur Menu Belajar (menu/materi/aktivitas)
   *  — beda dari level ASLI anak (`currentLevelMeta`). `null` = ikut level
   *  asli anak apa adanya (perilaku default/lama). Diisi lewat Peta Level
   *  ("Buka Menu Belajar" per markas) atau pemilih level di Menu Belajar
   *  sendiri; direset ke `null` tiap kali Menu Belajar dibuka dari luar alur
   *  itu (tab bar, kartu Beranda) supaya tidak nyangkut dari sesi sebelumnya. */
  viewLevel: LevelKey | null;
  /** "Raja" Game Hub yang sedang dimainkan (screen 'gamePlay'). */
  gameKey: RajaKey | null;
}

/** Handler dipanggil dari klik yang didelegasikan lewat data-action/data-payload. */
export type ActionHandler = (payload: string | undefined) => void;
export type ActionMap = Record<string, ActionHandler>;

/** Setiap mini-game punya sinyal "selesai" yang sama ke shell (nextStep/onDone). */
export type OnDone = () => void;
