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
 *  `'items' in topic` (lihat `app.ts` `runStage`/`runFreePlayRound`,
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
 */
export interface ReadingDrill {
  passage: string[];
  question: string;
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
  question: { text: string; opts: ListeningOption[] };
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

/** Union dipakai `READING_TOPICS_BY_LEVEL` (content.ts) supaya format lama
 *  (`ReadingTopic`, Adventurer) & format baru "py `items`" (`ReadingWordTopic`,
 *  Little Stars) bisa hidup berdampingan — pembeda runtime `'items' in topic`
 *  (`app.ts` `runStage`/`runFreePlayRound`), sama pola persis dgn
 *  `AnyListeningTopic`. */
export type AnyReadingTopic = ReadingTopic | ReadingWordTopic;

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

/** Union dipakai `SPEAKING_TOPICS_BY_LEVEL` (content.ts) supaya format lama
 *  (`SpeakingTopic`, Explorer/Adventurer, roleplay bebas) & format baru "py
 *  `items`" (`SpeakingPhraseTopic`, Little Stars, target tertutup) bisa
 *  hidup berdampingan — pembeda runtime `'items' in topic` (`app.ts`
 *  `runStage`/`runFreePlayRound`, `games/boss.ts` `runSpeakPhase`), sama
 *  pola persis dgn `AnyListeningTopic`/`AnyReadingTopic`. */
export type AnySpeakingTopic = SpeakingTopic | SpeakingPhraseTopic;

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
  | 'levels'
  /** Perhentian yang sudah terbuka tapi materinya belum ada (`hasContent:false`)
   *  — layar placeholder jujur, lihat `renderLevelSoon` di app.ts. */
  | 'levelSoon'
  | 'boss'
  | 'game'
  | 'account'
  | 'placementTest'
  /** Homepage marketing (hero/cara-kerja/fitur/testimoni/CTA) — satu-satunya
   *  layar yang boleh dilihat pengunjung yang BELUM login sebelum digerbang
   *  ke 'account' (lihat gerbang login di app.ts `render()`). */
  | 'landing';

/** Tujuan navigasi yang benar-benar ada di app (rail desktop & tab bar mobile). */
export type NavKey = 'home' | 'belajar' | 'game' | 'settings';

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
}

/** Handler dipanggil dari klik yang didelegasikan lewat data-action/data-payload. */
export type ActionHandler = (payload: string | undefined) => void;
export type ActionMap = Record<string, ActionHandler>;

/** Setiap mini-game punya sinyal "selesai" yang sama ke shell (nextStep/onDone). */
export type OnDone = () => void;
