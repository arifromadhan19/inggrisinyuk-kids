/**
 * Tantangan Bos — dipinjam konsepnya dari "Duel Pembisu"/"Duel Verifikasi" di
 * `inggrisinyuk` (dewasa, project terpisah), tapi diadaptasi berat, BUKAN
 * diporting:
 *  - Di sana bos = pertarungan dialog AI sungguhan yang memanggil LLM
 *    (berbayar). Di sini bos 100% hardcoded & client-side — sesuai PRD §5
 *    (tanpa backend/AI di v1) — cuma mashup lebih besar dari mini-game yang
 *    sudah ada (Tebak & Cocokkan, Dengar & Pilih, Susun Kalimat, Ucapkan &
 *    Cek), dicampur dari lebih dari satu skill sekaligus & ditarik dari
 *    SEMUA topik level ini (bukan cuma 1 topik) supaya terasa lebih besar.
 *  - Di sana kalah = uang hangus, harus beli ulang. Di sini TIDAK ADA status
 *    kalah sama sekali — setiap ronde tetap pola "coba sampai benar, retry
 *    tanpa batas" yang sudah dipakai di seluruh app (non-punitive, PRD
 *    §4.5/§4.6/§11.2 RESEARCH). "Menang" = semua ronde tuntas dicoba, sama
 *    seperti aturan selesai modul biasa, cuma bentuknya lebih besar & seru
 *    (framing "bos" ala Mario/Pokémon gym-leader — bukan tegang/menakutkan).
 *
 * 🔒 Redesain "Test per Level" (permintaan user, riset & rasional lengkap:
 * `materi/test_perlevel.md`) — audit menemukan versi lama JAUH dari
 * comprehensive: cuma 4 dari 5 skill (Reading bolong total), 2 soal/skill
 * TETAP di semua 6 level (Little Stars 3 th & Trailblazer 13+ th disamakan),
 * dan tidak ada skor yang benar² diukur (selalu menang, tidak ada laporan
 * hasil). Redesain: (1) tambah babak Reading (5 skill lengkap, adapter
 * `toReadingBossItems` menormalkan 3 format Reading yang hidup berdampingan
 * — lihat `AnyReadingTopic`, types.ts), (2) jumlah soal/skill naik seiring
 * usia (`ROUNDS_PER_SKILL`, riset Cambridge YLE/LIA/EF/Kumon SEMUA menaikkan
 * cakupan tes per level, bukan angka tetap), (3) skor per skill dihitung
 * dari percobaan PERTAMA tiap ronde (`BossResult`, dilaporkan sbg 1–5
 * bintang di `app.ts` `renderBossWin`, pola sama `skillStarsHtml` Rapor &
 * "Shields" Cambridge YLE). TETAP TANPA timer & TANPA status kalah — retry
 * tak terbatas & "menang = semua ronde dicoba" TIDAK berubah (PRD §4.6),
 * skor MURNI pelaporan tambahan, tidak pernah jadi gerbang blokir naik
 * level.
 *
 * 🔒 PILOT — permintaan user "coba terapkan dulu di bos little star":
 * redesain di atas HANYA aktif utk `PILOT_LEVELS` (skrg cuma `little-stars`)
 * — 5 level lain TETAP persis perilaku LAMA (4 babak tanpa Reading, 2
 * soal/skill, tanpa kartu skor/estimasi waktu di `app.ts`), lewat cabang
 * `isPilotLevel()` di `runBoss` & `renderBoss` (app.ts). Kalau nanti mau
 * digenapkan ke level lain, TINGGAL tambah key-nya ke `PILOT_LEVELS` — tidak
 * ada kode lain yang perlu disentuh (pola sama preseden pilot lain di repo
 * ini, mis. Vocab `sortBaskets`/Speaking `SpeakingStoryTopic`).
 *
 * 🔒 Navigasi bebas antar skill (permintaan user: "test ini per materi...
 * button vocab/listening/dst bisa diklik jadi user bisa mengerjakan yang
 * dia inginkan") — SEBELUMNYA gauntlet linear kaku (Vocab→Listening→
 * Reading→Grammar→Speaking, tidak bisa lompat). Sekarang `SKILL_DEFS` +
 * `cursor` (posisi ronde TERAKHIR dikunjungi per skill) bikin urutan cuma
 * DEFAULT, bukan wajib — 5 (atau 4) pill `skillPillsHtml()` di atas tiap
 * ronde SEMUANYA bisa ditap kapan saja (`jumpTo()`), pill yang SEDANG
 * dikerjakan warna pekat/solid (`.boss-phase.active`), yang SUDAH tuntas
 * semua rondenya kehijauan+centang (`.boss-phase.done`) — permintaan user
 * "warnanya dibuat pekat/dibedakan". Nge-tap skill yang SUDAH tuntas
 * me-reset skill itu (retry penuh, non-punitive, "boleh diulang" — copy
 * Arena TIDAK berubah) drpd jadi no-op aneh. `continueOrFinish()` gantikan
 * pemanggilan langsung "skill berikutnya" tiap 1 skill kelar — otomatis
 * lanjut ke skill BELUM TUNTAS pertama dalam urutan default (tetap zippy,
 * tidak perlu anak pilih manual tiap kali), finish() dipanggil begitu
 * SEMUA skill (bukan cuma yang terakhir dlm urutan lama) sudah tuntas.
 */
import {
  GRAMMAR_TOPICS_BY_LEVEL,
  LISTENING_TOPICS_BY_LEVEL,
  READING_TOPICS_BY_LEVEL,
  SPEAKING_TOPICS_BY_LEVEL,
  VOCAB_TOPICS_BY_LEVEL,
} from '../content';
import { setHandlers } from '../interaction';
import { recordAttempt, recordEvent } from '../progress';
import {
  listenAndRecordOnce,
  playCorrectTone,
  playTryAgainTone,
  playWrongTone,
  speak,
  sttSupported,
  vibrateDevice,
  wordMatchDetail,
} from '../speech';
import { pickEncourage, pickPraise } from '../praise';
import { fireConfetti } from '../confetti';
import type { AnyReadingTopic, LevelKey, SkillKey } from '../types';
import { shuffle } from '../util';

/** Materi Bos ikut level yang ditantang (permintaan user: Adventurer
 *  sekarang punya materi sendiri, dulu Bos SELALU nyoal dari Explorer
 *  apa pun levelnya) — jatuh ke Explorer kalau skill tertentu di level itu
 *  belum ada topiknya sama sekali, konsisten dgn "Bos level terkunci
 *  pertama tetap bisa dicoba pakai materi yang ada" (app.ts `renderLevels`). */
function poolFor<T>(byLevel: Partial<Record<LevelKey, T[]>>, level: LevelKey): T[] {
  const own = byLevel[level];
  return own && own.length > 0 ? own : (byLevel.explorer ?? []);
}

/** Jumlah soal per SKILL, naik seiring usia/level (riset `materi/
 *  test_perlevel.md` §3/§5 — Cambridge YLE/LIA/EF/Kumon semua menaikkan
 *  cakupan tes per level, bukan angka tetap) — beda dari `ROUNDS_PER_PHASE`
 *  lama yang SELALU 2 di semua 6 level.
 *
 * 🔒 `little-stars` 3→5 (permintaan user "apakah cukup 3 soal... apakah
 * tidak 5 saja", `materi/test_perlevel.md` §8) — ALASAN UTAMA bukan cuma
 * "lebih banyak lebih baik", tapi bug matematis konkret: skor 1-5 bintang
 * (`skillStarsHtml`, `app.ts`) dihitung `round(pct/20)` — dengan N=3 soal,
 * satu²nya persentase yang mungkin (0/33/67/100%) MEMBULAT ke 0/2/3/5
 * bintang — bintang 1 & 4 TIDAK PERNAH bisa muncul sama sekali (dicek via
 * skrip, N mana pun yang BUKAN kelipatan 5 py celah serupa; N=5 memetakan
 * bersih ke keenam nilai 0-5). `starter`/`explorer`/`adventurer` (3/4/4)
 * py cacat SAMA — SEKARANG DIKOREKSI JUGA (permintaan user "terapkan yang
 * belum diterapkan") jadi 5, SAMA PERSIS `little-stars`/`achiever`/
 * `trailblazer` — ketiganya BELUM `PILOT_LEVELS` jadi tidak ada anak
 * sungguhan yang terdampak, aman diubah kapan saja.
 *
 * 🔒 Efek samping YANG DISADARI (bukan bug): progresi "naik seiring usia"
 * yang jadi tema utama redesain ini (§3/§5, meniru Cambridge YLE/dst
 * menaikkan cakupan per level) jadi RATA di 5 utk KEENAM level, krn
 * kendala matematis di atas MEMAKSA tiap level pakai kelipatan 5, dan
 * kelipatan 5 PALING KECIL yang cocok utk semua umur (3-5 th s.d. 12+ th)
 * ya 5 itu sendiri — melompat ke 10 utk sebagian level akan melanggar
 * urutan monoton (level lebih tua HARUS ≥ level lebih muda) tanpa jg
 * menaikkan `achiever`/`trailblazer` yang TIDAK diminta disentuh sesi ini.
 * Diferensiasi usia yang lebih halus (mis. 5/5/5/10/10/10) adalah
 * keputusan produk TERPISAH yang sengaja TIDAK diambil sepihak di sini —
 * tanya user dulu kalau mau progresi berjenjang lagi nanti. */
const ROUNDS_PER_SKILL: Record<LevelKey, number> = {
  'little-stars': 5,
  starter: 5,
  explorer: 5,
  adventurer: 5,
  achiever: 5,
  trailblazer: 5,
};

/** Jumlah ronde/skill LAMA (versi pra-redesain) — dipertahankan apa adanya
 *  utk level di luar `PILOT_LEVELS`. */
const LEGACY_ROUNDS_PER_PHASE = 2;

/** Level yang SUDAH pakai redesain "test per level" (5 skill, skor
 *  terukur) — lihat catatan PILOT di komentar atas file. Tambah key di sini
 *  kalau mau menggenapkan ke level lain.
 *
 * 🔒 `explorer` ditambahkan (permintaan user: "untuk test materi reading,
 * mirip vocab cuma user baca... apakah baiknya buat statement dan ada
 * pertanyaan?") — Little Stars TETAP kata tunggal (SENGAJA, riset usia 3-5
 * th belum siap kalimat, `materi/reading.md`), TAPI materi Reading Explorer
 * (`ReadingCheckTopic`, `'checks' in t` di `toReadingBossItems` bawah)
 * SUDAH berbentuk 1 kalimat (statement) + judge Benar/Salah — genapkan
 * Explorer ke pilot ini supaya "statement + pertanyaan" kelihatan hidup di
 * test tanpa perlu adapter/konten baru (sudah generik sejak awal). */
const PILOT_LEVELS: LevelKey[] = ['little-stars', 'explorer'];

export function isPilotLevel(level: LevelKey): boolean {
  return PILOT_LEVELS.includes(level);
}

export function roundsPerSkillFor(level: LevelKey): number {
  return isPilotLevel(level) ? ROUNDS_PER_SKILL[level] : LEGACY_ROUNDS_PER_PHASE;
}

/** Estimasi durasi — MURNI informasi ditampilkan sebelum mulai (`app.ts`
 *  `renderBoss`), BUKAN timer/hitung mundur (PRD §4.6 tidak berubah).
 *  🔒 `little-stars`/`starter`/`explorer`/`adventurer` disesuaikan ikut
 *  kenaikan soal/skill di atas — pacing PER-RONDE dipertahankan SAMA
 *  persis dgn sebelum revisi (cuma jumlah rondenya naik ke 25), jadi
 *  rentang menit brubah proporsional: `little-stars` ~24–36 detik/ronde
 *  (riset attention-span preschool 3–5 th §8: 10–15 menit MASIH masuk
 *  rentang "didukung" 8–15 menit, bukan "independen" 3–6 menit — app ini
 *  py TTS+dorongan+animasi terus-menerus, bukan lembar kerja senyap);
 *  `starter` ~28–40 detik/ronde; `explorer` ~30–39 detik/ronde;
 *  `adventurer` ~33–42 detik/ronde (usia lebih tua, rentang perhatian
 *  lebih panjang, §3.6, jadi tetap wajar walau totalnya sama 25 ronde).
 *  Detail & sumber: `materi/test_perlevel.md` §8. */
const EST_MINUTES: Record<LevelKey, [number, number]> = {
  'little-stars': [10, 15],
  starter: [12, 17],
  explorer: [13, 16],
  adventurer: [14, 18],
  achiever: [14, 18],
  trailblazer: [15, 19],
};

export function estimatedMinutesFor(level: LevelKey): [number, number] {
  return EST_MINUTES[level];
}

/** 🔒 Permintaan user: "tambahkan bullet progress dan tambahkan percentage
 *  biar user tau berapa lagi yang perlu di kerjakan" — dots READ-ONLY (bukan
 *  quiz-dot jump-around, boss ini linear/tidak bisa lompat ronde), REUSE
 *  PERSIS class `.quiz-dot.static`/`.quiz-nav`/`.quiz-dots` yang sudah ada
 *  (pola sama `games/storyquest.ts` `dotsHtml()`) — 1 dot per ronde DALAM
 *  skill yang sedang jalan (bukan seluruh boss run, supaya tidak kepadatan
 *  dots kalau totalnya besar). Persentase di `progressLine` (dideklarasikan
 *  di `runBoss`, butuh akses `cursor`) cakup progres KESELURUHAN gauntlet
 *  (lintas 5/4 babak). */
function skillDotsHtml(skillIdx: number, skillTotal: number): string {
  const dots = Array.from({ length: skillTotal }, (_, i) => {
    const cls = i < skillIdx ? 'done' : i === skillIdx ? 'current' : '';
    return `<span class="quiz-dot static ${cls}" aria-hidden="true">${i < skillIdx ? '✓' : i + 1}</span>`;
  }).join('');
  return `<div class="quiz-nav"><div class="quiz-dots">${dots}</div></div>`;
}

/** Skor per skill, dihitung dari percobaan PERTAMA tiap ronde (bukan
 *  "menang setelah retry tak terbatas") — retry tetap bebas dipakai anak
 *  utk belajar (poin 2/3 `materi/test_perlevel.md` §4), cuma tidak menambah
 *  skor yang dilaporkan. Dilaporkan sbg 1–5 bintang di `app.ts`
 *  `renderBossWin` (`skillStarsHtml`, pola sama Rapor). */
export interface BossSkillScore {
  correct: number;
  total: number;
}
export type BossResult = Record<SkillKey, BossSkillScore>;

function emptyResult(): BossResult {
  return {
    vocabulary: { correct: 0, total: 0 },
    listening: { correct: 0, total: 0 },
    reading: { correct: 0, total: 0 },
    grammar: { correct: 0, total: 0 },
    speaking: { correct: 0, total: 0 },
  };
}

/** 🔒 Permintaan user: "audit dan pastikan icon nya relevan dengan jawaban"
 *  — audit menemukan `runVocabPhase`/`runListenPhase` di bawah menampilkan
 *  emoji opsi jawaban APA ADANYA (ambil dari SELURUH topik level, target
 *  Vocab bisa jatuh ke topik `kenal-warna`/`angka-pertama` Little Stars)
 *  TANPA lewat deteksi `isColorTopic`/`isNumberTopic`/dst yang sudah ada di
 *  `games/vocabulary.ts` — celah PERSIS yang sudah diperbaiki di sana
 *  (CLAUDE.md "Soal Tidak Boleh Bisa Ditebak Tanpa Paham": swatch warna
 *  🔴 utk "Red"/digit 2️⃣ utk "Two" bikin anak bisa cocokkan tanpa paham kata
 *  Inggrisnya SAMA SEKALI) — reinject ulang krn boss.ts py adapter sendiri,
 *  tidak lewat `answerCardsHtml` yang sudah dibentengi. Daftar kata SAMA
 *  PERSIS 4 kategori `vocabulary.ts` (`NUMBER_WORDS`/`COLOR_WORDS`/
 *  `SHAPE_WORDS`/`DAY_WORDS`), diduplikasi ke sini (konvensi helper generik
 *  per file game). 🔒 TIDAK diterapkan ke `toReadingBossItems` (`'items' in
 *  t` / `ReadingWordTopic`) — beda kasus: `games/reading.ts` `runLatihanIntiWord`/
 *  `runTantanganWord` (game ASLI-nya, sudah diaudit sebelumnya) SENGAJA
 *  TIDAK menyaring kategori ini, krn tugasnya "baca kata TERCETAK (tanpa
 *  audio wajib) → tunjuk gambar", bukan "dengar kata → tunjuk gambar" —
 *  tidak ada jalur dengar-lalu-cocok-warna/angka yang bisa dilewati tanpa
 *  benar² membaca, jadi bukan celah yang sama.
 */
const LEAKY_EMOJI_WORDS = new Set(
  [
    // NUMBER_WORDS
    'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
    'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty',
    // COLOR_WORDS
    'red', 'blue', 'yellow', 'green', 'orange', 'purple', 'pink', 'black', 'white', 'brown', 'gray', 'grey',
    // SHAPE_WORDS
    'circle', 'square', 'triangle', 'star', 'heart', 'diamond', 'oval', 'cross', 'arrow', 'moon', 'crescent',
    // DAY_WORDS
    'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday', 'today', 'tomorrow', 'yesterday',
  ]
);

function isLeakyEmojiWord(en: string): boolean {
  return LEAKY_EMOJI_WORDS.has(en.trim().toLowerCase());
}

interface ReadingBossItem {
  text: string;
  /** Cuma `true` utk item dari `ReadingWordTopic` (divergensi TTS yang sah,
   *  types.ts) — `ReadingCheckTopic`/`ReadingTopic` lama TIDAK PERNAH dapat
   *  tombol suara, konsisten "Reading tidak pernah TTS" di luar Kenalan. */
  speakable: boolean;
  opts: { emoji: string; ok?: boolean }[];
}

/** Menormalkan 3 format Reading (`AnyReadingTopic`) jadi 1 bentuk MCQ
 *  generik, pola SAMA dgn adapter Vocab/Listening/Grammar/Speaking di bawah
 *  (`runBoss`) — supaya babak Reading TETAP 1 implementasi generik tanpa
 *  perlu tahu format aslinya. */
function toReadingBossItems(topics: AnyReadingTopic[]): ReadingBossItem[] {
  return topics.flatMap((t): ReadingBossItem[] => {
    if ('items' in t) {
      // ReadingWordTopic (Little Stars/Starter) — kartu kata dibaca sendiri,
      // "🔊 Dengar" tetap opsional (divergensi sah TTS format ini).
      return t.items.map((it) => {
        const distractors = shuffle(t.items.filter((s) => s.en !== it.en)).slice(0, 3);
        const opts = shuffle([it, ...distractors]).map((o) => ({ emoji: o.emoji, ok: o.en === it.en }));
        return { text: it.en, speakable: true, opts };
      });
    }
    if ('checks' in t) {
      // ReadingCheckTopic (Explorer) — 1 kalimat (benar/salah diacak 50/50)
      // + gambar, jawab Benar/Salah — SILENT (TTS tidak pernah dipakai).
      return t.checks.map((c) => {
        const isTrue = Math.random() < 0.5;
        return {
          text: `${c.emoji} "${isTrue ? c.trueSentence : c.falseSentence}"`,
          speakable: false,
          opts: [
            { emoji: '✅', ok: isTrue },
            { emoji: '❌', ok: !isTrue },
          ],
        };
      });
    }
    // ReadingTopic lama (Adventurer/Achiever/Trailblazer) — passage+question
    // dibaca sendiri, SILENT (konsisten `runReadingQuizSet`, games/reading.ts).
    return t.drill.map((d) => ({
      text: `${d.passage.join(' ')} — ${d.question}`,
      speakable: false,
      opts: d.opts.map((o) => ({ emoji: o.emoji, ok: o.ok })),
    }));
  });
}

/** Jalankan seluruh gauntlet (4 babak lama, atau 5 babak hasil redesain kalau
 *  `level` termasuk `PILOT_LEVELS`), lalu panggil onWin dgn skor per skill
 *  (selalu tercapai — tidak ada jalur "kalah", cuma jalur "belum selesai"). */
export function runBoss(container: HTMLElement, onWin: (result: BossResult) => void, level: LevelKey): void {
  const pilot = isPilotLevel(level);
  const roundsPerSkill = roundsPerSkillFor(level);
  const totalPhases = pilot ? 5 : 4;
  const totalRounds = roundsPerSkill * totalPhases;
  const result = emptyResult();
  // Menjalankan blok render 1 ronde — dulu jg increment counter global
  // `roundNo` utk hitung "Ronde X dari Y", TAPI itu cuma valid selama urutan
  // KETAT linear (setiap render = 1 progres nyata). Sekarang navigasi bebas
  // antar skill (`jumpTo`) bikin counter model itu SALAH (nge-loncat ke
  // Speaking lalu balik ke Vocab yg belum disentuh akan salah menghitung
  // "sudah 2 ronde" padahal belum ada progres nyata sama sekali) — diganti
  // `progressLine()`/`overallPct()` di bawah yg baca progres ASLI dari
  // `cursor` (posisi per skill), bukan "berapa kali render dipanggil". Nama
  // dipertahankan generik biar tiap call site (5 titik) tak perlu diubah.
  const render = (fn: () => void) => fn();

  const vocabTopics = poolFor(VOCAB_TOPICS_BY_LEVEL, level);
  const listeningTopics = poolFor(LISTENING_TOPICS_BY_LEVEL, level);
  const readingTopics = pilot ? poolFor(READING_TOPICS_BY_LEVEL, level) : [];
  const grammarTopics = poolFor(GRAMMAR_TOPICS_BY_LEVEL, level);
  const speakingTopics = poolFor(SPEAKING_TOPICS_BY_LEVEL, level);

  const vocabItems = shuffle(vocabTopics.flatMap((t) => t.items)).slice(0, roundsPerSkill);
  // Listening py 4 format berdampingan (`AnyListeningTopic`, types.ts) —
  // SEMUA 3 format yang py `items` (dikte/note-completion/dialog+inferensi)
  // diadaptasi jadi bentuk `ListeningDrill` di sini lewat cabang generik
  // `'items' in t` (`ListeningQuestionOption` sudah struktural cocok dgn
  // `ListeningOption`) — supaya babak ini TETAP 1 implementasi generik
  // tanpa perlu tahu format aslinya, termasuk 2 format yang ditambahkan
  // belakangan (note-completion Achiever, dialog+inferensi Trailblazer).
  const listenDrills = shuffle(
    listeningTopics.flatMap((t) =>
      'items' in t ? t.items.map((it) => ({ en: it.example.en, id: it.example.id, opts: it.question.options })) : t.drill
    )
  ).slice(0, roundsPerSkill);
  const readingItems = pilot ? shuffle(toReadingBossItems(readingTopics)).slice(0, roundsPerSkill) : [];
  // Grammar py 3 format berdampingan (`AnyGrammarTopic`, types.ts) — format
  // KEDUA (`items`, Little Stars/Starter) diadaptasi jadi bentuk
  // `GrammarScramble` (susun kata dari kalimat formA-nya, tanda titik
  // dibuang biar cocok dgn `target.join(' ')` di `runGrammarPhase`), format
  // KETIGA (`transforms`, Trailblazer) diadaptasi dari kalimat reported
  // speech yang BENAR per item, format LAMA tetap `.scramble` apa adanya,
  // supaya babak ini TETAP 1 implementasi generik.
  const grammarScrambles = shuffle(
    grammarTopics.flatMap((t) =>
      'items' in t
        ? t.items.map((it) => ({ emoji: it.emoji, target: it.formA.en.replace(/\.$/, '').split(' ') }))
        : 'transforms' in t
          ? t.transforms.map((tr) => ({ emoji: tr.emoji, target: tr.reportedOptions.find((o) => o.ok)!.text.replace(/\.$/, '').split(' ') }))
          : t.scramble
    )
  ).slice(0, roundsPerSkill);
  // Speaking py 4 format berdampingan (`AnySpeakingTopic`, types.ts) — sama
  // adapter inline dgn `listenDrills` di atas: format KEDUA (`items`, Little
  // Stars/Starter) diratakan jadi `string[]` frasa target, format KETIGA
  // (`turns`, Trailblazer) diratakan jadi jawaban model `peerName` (anak
  // menirukan itu sbg "phrase" di gauntlet — tidak perlu simulasi giliran
  // penuh di sini), format KEEMPAT (`stories`, pilot Explorer) diratakan
  // jadi jawaban kanonis tiap cerita (`story.answer.en` — anak mengucapkan
  // itu sbg "phrase", tidak perlu simulasi baca cerita+pertanyaan penuh di
  // sini), format lama tetap `.drill` apa adanya, supaya babak ini TETAP 1
  // implementasi generik.
  const speakPhrases = shuffle(
    speakingTopics.flatMap((t) =>
      'items' in t
        ? t.items.map((it) => it.phrase.en)
        : 'turns' in t
          ? t.turns.map((turn) => turn.peerAnswer.en)
          : 'stories' in t
            ? t.stories.map((s) => s.answer.en)
            : t.drill.map((d) => d.en)
    )
  ).slice(0, roundsPerSkill);
  const allVocab = vocabTopics.flatMap((t) => t.items);

  // Posisi ronde TERAKHIR dikunjungi per skill — dasar "sudah tuntas belum"
  // pill (`skillPillsHtml`) & titik resume tiap `jumpTo()`. Di-set di AWAL
  // tiap fungsi babak (`cursor.X = round`), termasuk pas keluar (round ===
  // panjang array) — jadi otomatis jadi penanda "tuntas" tanpa field lain.
  const cursor: Record<SkillKey, number> = { vocabulary: 0, listening: 0, reading: 0, grammar: 0, speaking: 0 };

  function completeRound(key: SkillKey, score: number): void {
    result[key].total += 1;
    result[key].correct += score;
  }

  const SKILL_DEFS: { key: SkillKey; label: string; emoji: string; total: number; run: (round: number) => void }[] = (
    pilot
      ? [
          { key: 'vocabulary', label: 'Vocabulary', emoji: '📚', total: vocabItems.length, run: runVocabPhase },
          { key: 'listening', label: 'Listening', emoji: '🎧', total: listenDrills.length, run: runListenPhase },
          { key: 'reading', label: 'Reading', emoji: '📖', total: readingItems.length, run: runReadingPhase },
          { key: 'grammar', label: 'Grammar', emoji: '✏️', total: grammarScrambles.length, run: runGrammarPhase },
          { key: 'speaking', label: 'Speaking', emoji: '🗣️', total: speakPhrases.length, run: runSpeakPhase },
        ]
      : [
          { key: 'vocabulary', label: 'Vocabulary', emoji: '📚', total: vocabItems.length, run: runVocabPhase },
          { key: 'listening', label: 'Listening', emoji: '🎧', total: listenDrills.length, run: runListenPhase },
          { key: 'grammar', label: 'Grammar', emoji: '✏️', total: grammarScrambles.length, run: runGrammarPhase },
          { key: 'speaking', label: 'Speaking', emoji: '🗣️', total: speakPhrases.length, run: runSpeakPhase },
        ]
  ) as { key: SkillKey; label: string; emoji: string; total: number; run: (round: number) => void }[];

  /** 🔒 Permintaan user: "button vocab/listening/dst bisa diklik... ketika
   *  berada dalam materi test warnanya dibuat pekat/dibedakan" — pill YANG
   *  SEDANG dikerjakan (`.active`, warna solid) beda jelas dari yang belum
   *  (pucat/translusen, style dasar `.boss-phase`) & yang sudah tuntas
   *  (`.done`, hijau+centang). Direnderi ulang tiap ronde (bkn statis) spy
   *  status selalu akurat begitu skill lain diselesaikan di background. */
  function skillPillsHtml(activeKey: SkillKey): string {
    const pills = SKILL_DEFS.map((s) => {
      const done = cursor[s.key] >= s.total;
      const cls = [s.key === activeKey ? 'active' : '', done ? 'done' : ''].filter(Boolean).join(' ');
      return `<button type="button" class="boss-phase ${cls}" data-action="jumpPhase" data-payload="${s.key}">${s.emoji} ${s.label}${done ? ' ✓' : ''}</button>`;
    }).join('');
    return `<div class="boss-phases">${pills}</div>`;
  }

  /** Progres KESELURUHAN gauntlet (lintas skill), dihitung dari `cursor`
   *  ASLI — bukan "berapa kali render dipanggil" (lihat komentar `render`
   *  di atas soal kenapa counter lama salah begitu navigasi bebas dibuka). */
  function overallPct(): number {
    const done = SKILL_DEFS.reduce((sum, s) => sum + Math.min(cursor[s.key], s.total), 0);
    return totalRounds > 0 ? Math.round((done / totalRounds) * 100) : 0;
  }

  /** Teks progres per ronde — "Soal ke-N dari skillTotal" (versi teks dari
   *  `skillDotsHtml` yg `aria-hidden`, jadi tetap ada info yg sama utk
   *  pembaca layar) + persentase KESELURUHAN dari `overallPct()`. */
  function progressLine(round: number, skillTotal: number): string {
    return `<div class="id-text">Soal ${round + 1} dari ${skillTotal} · ${overallPct()}% selesai</div>`;
  }

  /** Dipanggil tiap 1 skill kelar semua rondenya — lanjut OTOMATIS ke skill
   *  belum-tuntas PERTAMA dlm urutan default (tetap zippy, anak tidak wajib
   *  pilih manual tiap kali), ATAU `finish()` kalau SEMUA skill sudah
   *  tuntas (bukan cuma yang terakhir dlm urutan lama). */
  function continueOrFinish(): void {
    const nextDef = SKILL_DEFS.find((s) => cursor[s.key] < s.total);
    if (!nextDef) return finish();
    nextDef.run(cursor[nextDef.key]);
  }

  /** Tap pill (`jumpPhase`) — pindah ke skill itu, resume dari posisi
   *  terakhir. Skill yang SUDAH tuntas direset total (skor & posisi) begitu
   *  ditap lagi — non-punitive, "boleh diulang sebanyak yang kamu mau"
   *  (copy Arena, TIDAK berubah) drpd jadi tap yang tidak berefek apa pun. */
  function jumpTo(key: SkillKey): void {
    const def = SKILL_DEFS.find((s) => s.key === key);
    if (!def) return;
    if (cursor[key] >= def.total) {
      cursor[key] = 0;
      result[key] = { correct: 0, total: 0 };
    }
    def.run(cursor[key]);
  }

  setHandlers({ jumpPhase: (payload) => jumpTo(payload as SkillKey) });

  runVocabPhase();

  function runVocabPhase(round = 0): void {
    cursor.vocabulary = round;
    if (round >= vocabItems.length) return continueOrFinish();
    const target = vocabItems[round];
    const distractors = shuffle(allVocab.filter((i) => i.en !== target.en)).slice(0, 3);
    const opts = shuffle([target, ...distractors]);
    // 🔒 Target dari kategori bocor (warna/angka/bentuk/hari) → SELURUH 4
    // opsi ronde ini teks-saja (bukan cuma milik target), biar grid tetap
    // seragam — lihat komentar `isLeakyEmojiWord` di atas.
    const textOnly = isLeakyEmojiWord(target.en);
    let firstTry = true;

    render(() => {
      container.innerHTML = `
        ${skillPillsHtml('vocabulary')}
        ${skillDotsHtml(round, vocabItems.length)}
        ${progressLine(round, vocabItems.length)}
        <div class="speak-row"><button class="speak-btn" data-action="replay">🔊 Dengar Lagi</button></div>
        <div class="opt-grid">
          ${opts.map((o, i) => `<button class="opt-btn ${textOnly ? 'opt-btn-text' : ''}" data-action="pick" data-payload="${i}">${textOnly ? o.en : o.emoji}</button>`).join('')}
        </div>
        <div class="feedback" id="fb"></div>
      `;
      speak(target.en);

      setHandlers({
        replay: () => speak(target.en),
        pick: (payload) => {
          const i = Number(payload);
          const btn = container.querySelectorAll<HTMLElement>('.opt-btn')[i];
          const fb = container.querySelector<HTMLElement>('#fb')!;
          if (opts[i] === target) {
            completeRound('vocabulary', firstTry ? 1 : 0);
            recordAttempt(true);
            btn.classList.add('correct');
            playCorrectTone();
            fireConfetti();
            fb.textContent = 'Kena! 🎉';
            fb.className = 'feedback good';
            setTimeout(() => runVocabPhase(round + 1), 750);
          } else {
            firstTry = false;
            recordAttempt(false);
            btn.classList.add('wrong');
            playWrongTone();
            vibrateDevice(160);
            fb.textContent = 'Coba lagi ya 💪';
            fb.className = 'feedback bad';
            setTimeout(() => btn.classList.remove('wrong'), 350);
          }
        },
      });
    });
  }

  function runListenPhase(round = 0): void {
    cursor.listening = round;
    if (round >= listenDrills.length) return continueOrFinish();
    const d = listenDrills[round];
    let firstTry = true;
    // 🔒 Sama fix icon-leak dgn `runVocabPhase` — cek label opsi yang BENAR
    // (format baru py `.text`, format lama kadang py `.lbl`), kalau kata
    // itu warna/angka/bentuk/hari, SELURUH opsi ronde ini teks-saja.
    const correctLabel = (d.opts.find((o) => o.ok) as { text?: string; lbl?: string } | undefined)?.text
      ?? (d.opts.find((o) => o.ok) as { text?: string; lbl?: string } | undefined)?.lbl;
    const textOnly = !!correctLabel && isLeakyEmojiWord(correctLabel);
    const optLabel = (o: { emoji: string }) => (o as { text?: string; lbl?: string }).text ?? (o as { text?: string; lbl?: string }).lbl ?? o.emoji;

    render(() => {
      container.innerHTML = `
        ${skillPillsHtml('listening')}
        ${skillDotsHtml(round, listenDrills.length)}
        ${progressLine(round, listenDrills.length)}
        <div class="speak-row"><button class="speak-btn" data-action="replay">🔊 Putar Kalimat</button></div>
        <div class="opt-grid ${d.opts.length === 3 ? 'three' : ''}">
          ${/* 🔒 Permintaan user (screenshot: 4 opsi tampil 3+1 timpang) —
             `.opt-grid.three` cuma dipasang utk PERSIS 3 opsi (baris tunggal
             rapi). 4 opsi (SELALU muncul di Listening format baru Little
             Stars, `item.question.options`) jatuh ke `.opt-grid` default
             (2 kolom, 2×2), SAMA PERSIS grid Vocab — bukan lagi `>2` yang
             salah menyamaratakan 4 opsi jadi 3 kolom+1 sisa. */ ''}
          ${d.opts.map((o, i) => `<button class="opt-btn ${textOnly ? 'opt-btn-text' : ''}" data-action="pick" data-payload="${i}">${textOnly ? optLabel(o) : o.emoji}</button>`).join('')}
        </div>
        <div class="feedback" id="fb"></div>
      `;
      speak(d.en);

      setHandlers({
        replay: () => speak(d.en),
        pick: (payload) => {
          const i = Number(payload);
          const btn = container.querySelectorAll<HTMLElement>('.opt-btn')[i];
          const fb = container.querySelector<HTMLElement>('#fb')!;
          if (d.opts[i].ok) {
            completeRound('listening', firstTry ? 1 : 0);
            recordAttempt(true);
            btn.classList.add('correct');
            playCorrectTone();
            fireConfetti();
            fb.textContent = 'Tepat! 🎉';
            fb.className = 'feedback good';
            setTimeout(() => runListenPhase(round + 1), 750);
          } else {
            firstTry = false;
            recordAttempt(false);
            btn.classList.add('wrong');
            playWrongTone();
            vibrateDevice(160);
            fb.textContent = 'Dengar lagi, yuk 💪';
            fb.className = 'feedback bad';
            setTimeout(() => btn.classList.remove('wrong'), 350);
          }
        },
      });
    });
  }

  /** Babak Reading BARU (`materi/test_perlevel.md` §5/§6) — sebelumnya
   *  bolong total di Tantangan Bos, padahal Reading sekarang py materi
   *  TUNTAS di semua 6 level. SILENT by default (konsisten "Reading tidak
   *  pernah TTS") — cuma item `speakable` (dari `ReadingWordTopic`, Little
   *  Stars/Starter) yang dapat tombol "🔊 Dengar" OPSIONAL. */
  function runReadingPhase(round = 0): void {
    cursor.reading = round;
    if (round >= readingItems.length) return continueOrFinish();
    const item = readingItems[round];
    let firstTry = true;

    render(() => {
      container.innerHTML = `
        ${skillPillsHtml('reading')}
        ${skillDotsHtml(round, readingItems.length)}
        ${progressLine(round, readingItems.length)}
        <div class="en-text">${item.text}</div>
        ${item.speakable ? '<div class="speak-row"><button class="speak-btn" data-action="replay">🔊 Dengar</button></div>' : ''}
        <div class="opt-grid ${item.opts.length === 3 ? 'three' : ''}">
          ${/* Sama fix dgn `runListenPhase` di atas — 4 opsi (`ReadingWordTopic`
             target+3 distraktor) WAJIB grid 2×2 default, bukan 3 kolom+1 sisa. */ ''}
          ${item.opts.map((o, i) => `<button class="opt-btn" data-action="pick" data-payload="${i}">${o.emoji}</button>`).join('')}
        </div>
        <div class="feedback" id="fb"></div>
      `;

      setHandlers({
        ...(item.speakable ? { replay: () => speak(item.text) } : {}),
        pick: (payload) => {
          const i = Number(payload);
          const btn = container.querySelectorAll<HTMLElement>('.opt-btn')[i];
          const fb = container.querySelector<HTMLElement>('#fb')!;
          if (item.opts[i].ok) {
            completeRound('reading', firstTry ? 1 : 0);
            recordAttempt(true);
            btn.classList.add('correct');
            playCorrectTone();
            fireConfetti();
            fb.textContent = 'Tepat! 🎉';
            fb.className = 'feedback good';
            setTimeout(() => runReadingPhase(round + 1), 750);
          } else {
            firstTry = false;
            recordAttempt(false);
            btn.classList.add('wrong');
            playWrongTone();
            vibrateDevice(160);
            fb.textContent = 'Baca lagi, yuk 💪';
            fb.className = 'feedback bad';
            setTimeout(() => btn.classList.remove('wrong'), 350);
          }
        },
      });
    });
  }

  /**
   * 🔒 Permintaan user (screenshot "Cek Jawaban"): samakan ke pola "Susun
   * Kalimat" Vocab (`games/vocabulary.ts` `runSusunKalimat`) — TANPA tombol
   * "Cek Jawaban" (evaluasi OTOMATIS begitu semua kata tersusun, dicek di
   * `pick`), TAMBAH "⌫ Hapus Kata" (hapus kata TERAKHIR) berdampingan dgn
   * "🔄 Bersihkan" (hapus semua) yang sudah ada. BEDA dari Vocab: papan
   * TIDAK dikunci (tanpa state `answered`/tombol "Coba Lagi") begitu salah —
   * tombol edit (Hapus Kata/Bersihkan/tap chip) TETAP aktif sesudahnya,
   * anak cukup betulkan susunannya lewat situ & otomatis DICEK ULANG begitu
   * penuh lagi — konsisten pace boss.ts yang lain (retry instan tanpa perlu
   * tap "Lanjut", BUKAN pola locked-then-retry-button Vocab). `speak(built)`
   * tetap dipanggil pas BENAR (sama persis `runSusunKalimat`).
   */
  function runGrammarPhase(round = 0): void {
    cursor.grammar = round;
    if (round >= grammarScrambles.length) return continueOrFinish();
    const sc = grammarScrambles[round];
    let answer: { w: string; idx: number }[] = [];
    let bank = shuffle(sc.target.map((w, i) => ({ w, used: false, idx: i })));
    let firstTry = true;

    const paint = () => {
      container.innerHTML = `
        ${skillPillsHtml('grammar')}
        ${skillDotsHtml(round, grammarScrambles.length)}
        ${progressLine(round, grammarScrambles.length)}
        <div class="answer-row ${answer.length ? '' : 'empty'}">
          ${answer.map((a, ai) => `<span class="chip placed" data-action="unpick" data-payload="${ai}">${a.w}</span>`).join('')}
        </div>
        <div class="bank-row">
          ${bank.map((b, bi) => `<span class="chip ${b.used ? 'hidden' : ''}" data-action="pick" data-payload="${bi}">${b.w}</span>`).join('')}
        </div>
        <div class="feedback" id="fb"></div>
        <div class="letter-actions">
          <button class="ghost-btn slim" type="button" data-action="removeLastWord" ${answer.length ? '' : 'disabled'}>⌫ Hapus Kata</button>
          <button class="ghost-btn slim" type="button" data-action="clear">🔄 Bersihkan</button>
        </div>
      `;
      setHandlers({
        clear: () => {
          answer = [];
          bank = shuffle(sc.target.map((w, i) => ({ w, used: false, idx: i })));
          paint();
        },
        removeLastWord: () => {
          if (!answer.length) return;
          const last = answer[answer.length - 1];
          answer = answer.slice(0, -1);
          bank.find((b) => b.idx === last.idx)!.used = false;
          paint();
        },
        pick: (payload) => {
          const bi = Number(payload);
          if (bank[bi].used) return;
          bank[bi].used = true;
          answer.push(bank[bi]);
          paint();
          if (answer.length === bank.length) checkAnswer();
        },
        unpick: (payload) => {
          const ai = Number(payload);
          const item = answer[ai];
          answer.splice(ai, 1);
          bank.find((b) => b.idx === item.idx)!.used = false;
          paint();
        },
      });
    };

    function checkAnswer(): void {
      const fb = container.querySelector<HTMLElement>('#fb')!;
      const built = answer.map((a) => a.w).join(' ');
      if (built === sc.target.join(' ')) {
        completeRound('grammar', firstTry ? 1 : 0);
        recordAttempt(true);
        playCorrectTone();
        fireConfetti();
        fb.textContent = 'Pas banget! 🎉';
        fb.className = 'feedback good';
        speak(built);
        setTimeout(() => runGrammarPhase(round + 1), 900);
      } else {
        firstTry = false;
        recordAttempt(false);
        container.querySelector('.answer-row')?.classList.add('is-wrong');
        playWrongTone();
        vibrateDevice(160);
        fb.textContent = 'Urutannya belum pas, coba atur lagi 💪';
        fb.className = 'feedback bad';
      }
    }

    render(paint);
  }

  /**
   * 🔒 Fix Aturan Wajib Speaking (audit sesi Little Stars — CLAUDE.md sendiri
   * menyebut eksplisit `games/boss.ts` sbg salah satu tempat wajib) —
   * sebelumnya pakai `looseMatch` biner & tidak py "▶️ Play Suaramu" sama
   * sekali. Sekarang skor proporsional (`wordMatchDetail`, sama pola
   * `games/speaking.ts` `scoreMic`) + rekam paralel utk Play Suaramu
   * (`listenAndRecordOnce`, bukan `listenOnce` lagi) — TETAP auto-advance
   * (konsisten pace 3 babak lain di gauntlet ini, BUKAN diubah jadi manual
   * "Lanjut" spt `games/speaking.ts`) & TETAP maju apa pun hasilnya (sudah
   * begitu dari awal — bukan diubah, cuma sekarang py tampilan skor yang
   * proporsional). Jeda diperpanjang dikit (850ms→1400ms) supaya sempat
   * kebaca bintang/kata yang kedengaran sebelum ronde berikutnya muncul.
   */
  function runSpeakPhase(round = 0): void {
    cursor.speaking = round;
    if (round >= speakPhrases.length) return continueOrFinish();
    const phrase = speakPhrases[round];

    render(() => {
      container.innerHTML = `
        ${skillPillsHtml('speaking')}
        ${skillDotsHtml(round, speakPhrases.length)}
        ${progressLine(round, speakPhrases.length)}
        <div class="en-text">"${phrase}"</div>
        <div class="speak-row"><button class="speak-btn" data-action="replay">🔊 Dengar Contoh</button></div>
        <div class="mic-wrap">
          <button class="mic-btn" id="micBtn" data-action="mic">🎤</button>
          <div class="mic-hint">${sttSupported ? 'Tap mic, lalu ucapkan kalimatnya' : 'Mikrofon tidak didukung browser ini'}</div>
        </div>
        <div id="micResult"></div>
        <div class="feedback" id="fb"></div>
        ${sttSupported ? '' : `<button class="ghost-btn" data-action="skip">✅ Aku Sudah Coba Ucapkan</button>`}
      `;

      setHandlers({
        replay: () => speak(phrase),
        skip: () => runSpeakPhase(round + 1),
        mic: () => {
          const btn = container.querySelector<HTMLElement>('#micBtn')!;
          btn.classList.add('listening');
          let recordedAudioUrl: string | null = null;
          listenAndRecordOnce(
            (said) => {
              btn.classList.remove('listening');
              const words = wordMatchDetail(said, phrase);
              const matchedCount = words.filter((w) => w.matched).length;
              const hitRatio = words.length ? matchedCount / words.length : 0;
              // Ditotal HANYA pas beneran ada percobaan mic terukur (bukan di
              // awal ronde) — device tanpa STT (jalur `skip` di bawah) TIDAK
              // dihitung sama sekali ke skor, supaya keterbatasan teknis
              // browser tidak ikut menurunkan bintang Speaking anak.
              completeRound('speaking', hitRatio);
              const stars = hitRatio >= 0.8 ? 3 : hitRatio >= 0.4 ? 2 : 1;
              const perfect = stars === 3;
              if (perfect) {
                playCorrectTone();
                fireConfetti();
              } else playTryAgainTone();
              recordEvent({
                kind: 'speak',
                skill: 'speaking',
                topicId: 'boss',
                activity: 'mic',
                graded: false,
                score: Math.round(hitRatio * 100),
                detail: { heard: said },
              });
              container.querySelector<HTMLElement>('#micResult')!.innerHTML = `
                <div style="font-size:20px;letter-spacing:3px;text-align:center;margin-top:8px" aria-hidden="true">${'⭐'.repeat(stars)}${'☆'.repeat(3 - stars)}</div>
                <div class="word-diff" style="margin-top:6px">${words.map((w) => `<span class="${w.matched ? 'ok' : 'miss'}">${w.word}</span>`).join('')}</div>
                <div class="heard-text">Terdengar: "${said}"</div>
                <div class="speak-row" style="margin-top:8px">
                  <button class="speak-btn" type="button" id="playMineBtn" data-action="playMine" disabled>▶️ Play Suaramu</button>
                </div>
              `;
              const fb = container.querySelector<HTMLElement>('#fb')!;
              fb.textContent = perfect ? pickPraise(level) : pickEncourage(level);
              fb.className = 'feedback good';
              setHandlers({ playMine: () => { if (recordedAudioUrl) new Audio(recordedAudioUrl).play().catch(() => {}); } });
              setTimeout(() => runSpeakPhase(round + 1), 1400);
            },
            (kind) => {
              btn.classList.remove('listening');
              // 'aborted' — mic dihentikan paksa krn "🔊 Dengar Contoh"
              // ditap pas masih dengar (speech.ts `stopListening()`), bukan
              // STT gagal — reset diam-diam.
              if (kind === 'aborted') return;
              container.querySelector<HTMLElement>('#fb')!.textContent = 'Belum kedengaran, coba lagi 🎧';
            },
            (audioUrl) => {
              recordedAudioUrl = audioUrl;
              const playBtn = container.querySelector<HTMLButtonElement>('#playMineBtn');
              if (playBtn) playBtn.disabled = false;
            }
          );
        },
      });
    });
  }

  function finish(): void {
    onWin(result);
  }
}
