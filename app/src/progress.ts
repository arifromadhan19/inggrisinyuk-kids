import type { LevelKey, LevelMeta, SkillKey } from './types';

/**
 * Progres disimpan di localStorage per perangkat, tanpa akun (PRD §5).
 * Yang dicatat: modul apa saja yang sudah tuntas dicoba (= 1 bintang, PRD §4.5
 * & §4.6 — bukan skor, bukan "coin"), modul terakhir yang dibuka supaya anak
 * bisa langsung lanjut dari Beranda, level mana yang Tantangan Bos-nya sudah
 * ditaklukkan (dipakai Peta Level untuk buka/kunci — lihat `levelUnlockMap`),
 * dan XP — satu angka pertumbuhan yang cuma pernah naik, tidak pernah turun,
 * murni motivasi ("ala Solo Leveling" tapi sepenuhnya non-punitive: tidak ada
 * cara XP berkurang, tidak ada HP yang bisa habis). XP TIDAK dipakai untuk
 * membuka level — itu tetap murni dari `bossCleared` (Belajar tetap inti).
 * Selain itu: streak harian (1 hari pelindung, lihat `getStreak`) dan
 * ketepatan tepat/total (lihat `getAccuracy`) — dua-duanya derived, cuma
 * dihitung dari data yang sudah ada di sini, bukan field sumber kebenaran
 * baru.
 *
 * Tidak ada antrian review yang ditampilkan ke anak (PRD §4.3). Tidak ada
 * coin/mata uang (PRD §4.6) dan tidak ada HP/nyawa yang bisa habis (§12.4).
 */

const KEY = 'inggrisinyuk-kids.progress.v1';

/** Set tetap avatar hewan — dipilih tap, bukan upload foto (PRD: ramah anak,
 *  privasi). Singa duluan karena sudah jadi maskot app di mana-mana. */
export const ANIMAL_AVATARS = ['🦁', '🐯', '🐰', '🐶', '🐱', '🐼', '🦊', '🐨', '🐸', '🐵', '🦄', '🐧'] as const;

export interface LastSpot {
  skill: SkillKey;
  topicIndex: number;
}

export interface Store {
  done: string[];
  last: LastSpot | null;
  bossCleared: string[];
  xp: number;
  /** Tanggal (YYYY-MM-DD, lokal perangkat) yang punya aktivitas — dipakai
   *  "Progres Harian" (`getWeekActivity`, murni strip 7 hari tanpa aturan
   *  berturut-turut) DAN streak (`getStreak`, di bawah — permintaan revisi
   *  yang sengaja tidak dipakai di iterasi sebelumnya, sekarang dipasang lagi
   *  dengan 1 hari pelindung supaya tetap non-punitive, lihat `getStreak`). */
  activeDays: string[];
  /** Tepat/total percobaan di soal yang punya jawaban benar-salah objektif
   *  (pilih gambar, susun kata/kalimat) — dipakai utk "Ketepatan" (§ di
   *  bawah). SENGAJA tidak menghitung percobaan lewat mic (Speaking): ASR
   *  anak tidak selalu akurat, jadi mic sudah didesain "selalu dianggap
   *  berhasil" di games/*.ts — menghitungnya di sini cuma akan bikin angka
   *  akurasi menyesatkan, bukan mengukur ketepatan beneran. */
  correctAttempts: number;
  totalAttempts: number;
  /** Nama panggilan anak, buat sapaan "Hi {nama}" di header — murni lokal,
   *  bukan akun (PRD §5, tanpa auth/backend). Boleh kosong. */
  name: string;
  /** Avatar hewan lucu, dipilih dari set tetap (lihat ANIMAL_AVATARS di
   *  progress.ts) — bukan upload foto (privasi anak, murni lokal juga). */
  avatar: string;
  /** LEGACY — interaksi per KATA di Kenalan Vocab, format tag lama
   *  `${skill}:${topicId}:${itemIndex}:${action}`. Digantikan `sections`
   *  (section='kenalan', lihat §TRD.md 5/9) — masih DIBACA (fallback, supaya
   *  warna tombol di data lama tidak hilang) tapi TIDAK LAGI DITULIS. */
  wordInteractions: string[];
  /** Status per soal/kata per (skill,topik,section) — dasar penanda "sudah
   *  dikerjakan" + urutan Latihan Inti yang stabil/resumable + navigasi
   *  ⬅️/➡️ (permintaan user). Key: `${skill}:${topicId}:${section}`, lihat
   *  TRD.md §5/§6 untuk desain lengkap. Menggantikan `wordInteractions` untuk
   *  Kenalan JUGA (section='kenalan') — satu sistem, bukan dua paralel. */
  sections: Record<string, SectionState>;
}

/** `kind` soal Latihan Inti (`games/vocabulary.ts` `LatihanQuestion`) — cuma
 *  section ini yang butuh `plan` eksplisit karena urutannya di-shuffle;
 *  section lain (kenalan/tantangan-*) meng-iterasi `topic.items` alami,
 *  slot = index item, `plan` tidak perlu. */
export interface LatihanPlanSlot {
  kind: 'hear' | 'toEn' | 'toId' | 'sentence';
  item: number;
}

/** Status 1 slot/soal — TRD.md §5. Field disingkat sengaja (blob ini
 *  dikirim tiap sync, ukurannya ikut dijaga kecil). */
export interface SlotState {
  /** 0 todo, 1 dilihat/ditap, 2 sudah dijawab/dicoba. */
  st: 0 | 1 | 2;
  /** Pernah benar (union — sekali benar tetap benar, non-punitive). */
  ok?: 1;
  /** Hasil percobaan TERAKHIR. */
  lc?: 0 | 1;
  /** Jumlah percobaan. */
  n?: number;
  /** Jumlah yang belum tepat. */
  w?: number;
  /** Hint pernah dipakai di slot ini. */
  h?: 1;
  /** Skor terbaik 0..100 (mic — rasio kata terdengar). */
  sc?: number;
  /** Tap tombol Kenalan yang pernah kena: listen/mic/game. */
  a?: ('l' | 'm' | 'g')[];
  /** Kata/kalimat target di slot ini (mis. "Mother") — DENORMALISASI SENGAJA
   *  (konten cuma ada di bundle client, I6): server tidak bisa menerjemahkan
   *  index slot balik ke kata tanpa ini, jadi dikirim apa adanya supaya
   *  rapor "kata apa yang masih susah" bisa GROUP BY langsung di DB. */
  ir?: string;
  /** epoch ms percobaan terakhir — dipakai merge `lc` (ambil yang lebih baru). */
  t?: number;
}

export interface SectionState {
  /** Reserved utk "Ulangi Modul" nanti (belum ada tombolnya) — selalu 1 sekarang. */
  round: number;
  seed: number;
  /** Cuma diisi section 'latihan' — lihat `LatihanPlanSlot`. */
  plan?: LatihanPlanSlot[];
  /** Posisi terakhir dilihat (resume ⬅️/➡️) — preferensi PERANGKAT, bukan
   *  kebenaran global (non-punitive: tidak pernah mengunci soal). */
  cursor: number;
  slots: Record<number, SlotState>;
}

/** "Setiap mencoba pakai di save" (permintaan user) — 1 percobaan/kejadian.
 *  Dikirim lewat outbox terpisah (`recordEvent`), TIDAK bagian dari `Store`
 *  (volumenya beda: Store = state, ini = log, lihat TRD.md §3). */
export interface LearningEventInput {
  id: string;
  kind: 'answer' | 'speak' | 'interact' | 'topic_done' | 'boss_clear' | 'freeplay';
  occurredAt: string;
  localDay: string;
  localHour: number;
  level?: string;
  skill?: string;
  topicId?: string;
  section?: string;
  slot?: number;
  round?: number;
  itemIndex?: number;
  itemRef?: string;
  activity?: string;
  graded?: boolean;
  correct?: boolean;
  score?: number;
  hintUsed?: boolean;
  attemptNo?: number;
  durationMs?: number;
  xpAwarded?: number;
  detail?: Record<string, unknown>;
}

const EMPTY: Store = {
  done: [],
  last: null,
  bossCleared: [],
  xp: 0,
  activeDays: [],
  correctAttempts: 0,
  totalAttempts: 0,
  name: '',
  avatar: ANIMAL_AVATARS[0],
  wordInteractions: [],
  sections: {},
};

function read(): Store {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...EMPTY };
    const parsed = JSON.parse(raw) as Partial<Store>;
    const num = (v: unknown): number => (typeof v === 'number' && Number.isFinite(v) && v >= 0 ? v : 0);
    return {
      done: Array.isArray(parsed.done) ? parsed.done.filter((d) => typeof d === 'string') : [],
      last: parsed.last ?? null,
      bossCleared: Array.isArray(parsed.bossCleared) ? parsed.bossCleared.filter((d) => typeof d === 'string') : [],
      xp: num(parsed.xp),
      activeDays: Array.isArray(parsed.activeDays) ? parsed.activeDays.filter((d) => typeof d === 'string') : [],
      correctAttempts: num(parsed.correctAttempts),
      totalAttempts: num(parsed.totalAttempts),
      name: typeof parsed.name === 'string' ? parsed.name.slice(0, 24) : '',
      avatar:
        typeof parsed.avatar === 'string' && (ANIMAL_AVATARS as readonly string[]).includes(parsed.avatar)
          ? parsed.avatar
          : ANIMAL_AVATARS[0],
      wordInteractions: Array.isArray(parsed.wordInteractions)
        ? parsed.wordInteractions.filter((d) => typeof d === 'string')
        : [],
      sections:
        parsed.sections && typeof parsed.sections === 'object' && !Array.isArray(parsed.sections)
          ? (parsed.sections as Record<string, SectionState>)
          : {},
    };
  } catch {
    // Storage bisa diblokir (mode privat). App tetap jalan, cuma tanpa progres.
    return { ...EMPTY };
  }
}

/** Dipanggil tiap `write()` sukses (permintaan user: "simpan setiap progress
 *  ke database") — `app.ts` pasang handler-nya sekali di boot (push ke
 *  `portal/` API, didebounce di sana) lewat `setSyncHandler`, supaya file
 *  ini sendiri TETAP murni localStorage, tanpa tahu apa pun soal network/akun
 *  (progres offline-tanpa-login tetap harus jalan penuh, PRD §5/§14.4). */
let onWrite: ((store: Store) => void) | null = null;

export function setSyncHandler(fn: ((store: Store) => void) | null): void {
  onWrite = fn;
}

function write(store: Store): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(store));
  } catch {
    /* diabaikan dengan sengaja — progres bersifat opsional */
  }
  onWrite?.(store);
}

/* --------------------------------------------------------- outbox event -- */

/** "Setiap mencoba pakai di save" (permintaan user) — log mentah tiap
 *  percobaan, TERPISAH dari `Store` (§TRD.md 3: state vs log, volumenya
 *  beda jauh). Disimpan sendiri di localStorage (bukan bagian `Store` yang
 *  di-`write()` tiap detik) supaya tidak membengkakkan payload sync utama;
 *  `app.ts` men-drain outbox ini bareng snapshot `Store` di request PUT
 *  yang sama (1 request/burst, TRD.md §7.0), lalu `clearOutboxIds` setelah
 *  sukses. Kalau gagal kirim/offline lama: event boleh hilang (cap 500,
 *  buang yang tertua) TANPA merusak progres apa pun — semua progres nyata
 *  tetap hidup di `Store` (bintang/XP/status slot), bukan di log ini. */
const EVENTS_KEY = 'inggrisinyuk-kids.events.v1';
const MAX_OUTBOX = 500;

let onEvent: (() => void) | null = null;
export function setEventSyncHandler(fn: (() => void) | null): void {
  onEvent = fn;
}

function readOutbox(): LearningEventInput[] {
  try {
    const raw = localStorage.getItem(EVENTS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as LearningEventInput[]) : [];
  } catch {
    return [];
  }
}

function writeOutbox(events: LearningEventInput[]): void {
  try {
    localStorage.setItem(EVENTS_KEY, JSON.stringify(events));
  } catch {
    /* diabaikan — log analitik bersifat opsional (lihat komentar di atas) */
  }
}

export function peekOutbox(): LearningEventInput[] {
  return readOutbox();
}

export function clearOutboxIds(ids: readonly string[]): void {
  if (ids.length === 0) return;
  const idSet = new Set(ids);
  writeOutbox(readOutbox().filter((e) => !idSet.has(e.id)));
}

/** Generate id+jam lokal, dorong ke outbox, lalu beri tahu `app.ts` (kalau
 *  sudah dipasang) supaya sync-nya didebounce sama seperti `write()`. */
export function recordEvent(input: Omit<LearningEventInput, 'id' | 'occurredAt' | 'localDay' | 'localHour'>): void {
  const now = new Date();
  const event: LearningEventInput = {
    ...input,
    id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
    occurredAt: now.toISOString(),
    localDay: isoDate(now),
    localHour: now.getHours(),
  };
  const outbox = readOutbox();
  outbox.push(event);
  writeOutbox(outbox.length > MAX_OUTBOX ? outbox.slice(-MAX_OUTBOX) : outbox);
  onEvent?.();
}

const tag = (skill: SkillKey, topicId: string): string => `${skill}:${topicId}`;

export function markDone(skill: SkillKey, topicId: string): void {
  const store = read();
  const id = tag(skill, topicId);
  const already = store.done.includes(id);
  if (!already) store.done.push(id);
  write(store);
  if (!already) recordEvent({ kind: 'topic_done', skill, topicId });
}

export function isDone(skill: SkillKey, topicId: string): boolean {
  return read().done.includes(tag(skill, topicId));
}

export function doneCount(): number {
  return read().done.length;
}

/* --------------------------------------------------------------- sections -- */

/** Section = unit dgn urutan & navigasi sendiri di dalam 1 topik. String
 *  (bukan union tertutup) — daftar akan tumbuh begitu pola Vocab dibawa ke
 *  skill lain (TRD.md §4.6 alasan lengkap). */
export type SectionName = 'kenalan' | 'latihan' | 'tantangan-eja' | 'tantangan-ucap' | 'tantangan-susun' | string;

const sectionKey = (skill: SkillKey, topicId: string, section: SectionName): string => `${skill}:${topicId}:${section}`;

const EMPTY_SECTION = (): SectionState => ({ round: 1, seed: Math.floor(Math.random() * 1e9), cursor: 0, slots: {} });

export function getSection(skill: SkillKey, topicId: string, section: SectionName): SectionState | null {
  return read().sections[sectionKey(skill, topicId, section)] ?? null;
}

/** Ambil section yang sudah ada, atau buat baru SEKALI (round=1, cursor=0) —
 *  kalau `buildPlan` dikasih (Latihan Inti, satu-satunya yang ordernya
 *  di-shuffle), plan-nya dimaterialisasi & disimpan PERMANEN saat itu juga,
 *  supaya "soal ke-N" punya identitas stabil lintas sesi (TRD.md §6). Section
 *  lain (kenalan/tantangan-*) meng-iterasi `topic.items` alami — panggil
 *  tanpa `buildPlan`, slot = index item. */
export function ensureSection(
  skill: SkillKey,
  topicId: string,
  section: SectionName,
  buildPlan?: () => LatihanPlanSlot[]
): SectionState {
  const store = read();
  const key = sectionKey(skill, topicId, section);
  let s = store.sections[key];
  if (!s) {
    s = EMPTY_SECTION();
    if (buildPlan) s.plan = buildPlan();
    store.sections[key] = s;
    write(store);
  }
  return s;
}

/**
 * Paksa bangun ulang `plan` sebuah section + reset status slot-nya (dipakai
 * kalau FORMAT soal berubah — mis. revisi mix 4-tipe Latihan Inti Vocab,
 * `games/vocabulary.ts` `buildLatihanOrder` — supaya perangkat yang SUDAH
 * PERNAH buka section ini SEBELUM revisi tidak nyangkut di plan lama
 * selamanya; `ensureSection` sendiri cuma membangun plan SEKALI seumur
 * hidup section itu, jadi perubahan format perlu jalur eksplisit ini,
 * dilaporkan user: "kenapa tidak ada perubahan"). Status slot ikut direset
 * (bukan cuma plan) karena index slot lama sudah tidak match soal barunya.
 */
export function resetSectionPlan(skill: SkillKey, topicId: string, section: SectionName, plan: LatihanPlanSlot[]): void {
  const store = read();
  const key = sectionKey(skill, topicId, section);
  store.sections[key] = { ...EMPTY_SECTION(), plan };
  write(store);
}

/** Posisi terakhir dilihat anak — preferensi PERANGKAT (LWW), dipakai
 *  navigasi ⬅️ Kembali/➡️ Lanjut bebas (tidak pernah mengunci soal, I4). */
export function setSectionCursor(skill: SkillKey, topicId: string, section: SectionName, cursor: number): void {
  const store = read();
  const key = sectionKey(skill, topicId, section);
  const s = store.sections[key] ?? EMPTY_SECTION();
  s.cursor = cursor;
  store.sections[key] = s;
  write(store);
}

export function getSlot(skill: SkillKey, topicId: string, section: SectionName, slot: number): SlotState | undefined {
  return getSection(skill, topicId, section)?.slots[slot];
}

/** Ditandai begitu 1 soal DIJAWAB (benar ATAU belum tepat — "setiap mencoba
 *  pakai di save", permintaan user) — bukan syarat lanjut, murni penanda. */
export function markSlotAnswered(
  skill: SkillKey,
  topicId: string,
  section: SectionName,
  slot: number,
  correct: boolean,
  opts: { hint?: boolean; score?: number; itemRef?: string } = {}
): void {
  const store = read();
  const key = sectionKey(skill, topicId, section);
  const s = store.sections[key] ?? EMPTY_SECTION();
  const cur = s.slots[slot] ?? { st: 0 };
  s.slots[slot] = {
    st: 2,
    ok: cur.ok || correct ? 1 : undefined,
    lc: correct ? 1 : 0,
    n: (cur.n ?? 0) + 1,
    w: (cur.w ?? 0) + (correct ? 0 : 1),
    h: cur.h || opts.hint ? 1 : undefined,
    sc: opts.score !== undefined ? Math.max(cur.sc ?? 0, opts.score) : cur.sc,
    a: cur.a,
    ir: opts.itemRef ?? cur.ir,
    t: Date.now(),
  };
  store.sections[key] = s;
  write(store);
}

/**
 * Penanda RINGAN "step ini pernah dituntaskan 1x" (permintaan user: gating
 * layar "Kerja Bagus" ke progress BENERAN 100%, bukan "kebetulan step
 * terakhir yang lagi dikerjakan" — `app.ts` `nextStep()`/`topicFinished()`)
 * — dipakai skill/format yang BELUM py section granular per-soal (old-
 * format Listening/Explorer&Adventurer, Speaking, Grammar, Reading). Vocab
 * & Listening format baru (Little Stars) pakai `vocabTopicPercent`/
 * `listeningTopicPercent` yang lebih akurat (per-SOAL, bukan per-step),
 * TIDAK perlu penanda ini. Section name `latihan-visited`/`tantangan-
 * visited` SENGAJA beda dari section asli ('latihan'/'tantangan-eja' dst)
 * supaya tidak numpuk/ketimpa data kalau skill ini nanti diupgrade ke
 * section granular sungguhan — reuse `markSlotAnswered`/`getSlot` (slot 0
 * sbg satu-satunya slot) murni supaya TIDAK perlu field `Store` baru/
 * migrasi skema sync ke `portal/`.
 */
export function markStepVisited(skill: SkillKey, topicId: string, step: 'latihan' | 'tantangan'): void {
  markSlotAnswered(skill, topicId, `${step}-visited`, 0, true);
}

export function isStepVisited(skill: SkillKey, topicId: string, step: 'latihan' | 'tantangan'): boolean {
  return getSlot(skill, topicId, `${step}-visited`, 0)?.st === 2;
}

/** Tap tombol Kenalan (🔊 listen / 🎤 mic / 🎮 game) — dipanggil dari
 *  `markWordInteraction` di bawah (section selalu 'kenalan' di situ). */
export function markSlotInteraction(
  skill: SkillKey,
  topicId: string,
  section: SectionName,
  slot: number,
  action: 'l' | 'm' | 'g',
  itemRef?: string
): void {
  const store = read();
  const key = sectionKey(skill, topicId, section);
  const s = store.sections[key] ?? EMPTY_SECTION();
  const cur = s.slots[slot] ?? { st: 0 };
  const a = cur.a ?? [];
  if (!a.includes(action)) a.push(action);
  s.slots[slot] = { ...cur, st: Math.max(cur.st, 1) as 0 | 1 | 2, a, ir: itemRef ?? cur.ir };
  store.sections[key] = s;
  write(store);
}

/* ------------------------------------------------- interaksi per-kata Kenalan -- */

/** Aksi yang bisa ditap per kata di Kenalan Vocab (`games/vocabulary.ts`
 *  `drawWordList`) — dengarkan 🔊, coba ucapkan 🎤, main 🎮. Sekarang tersimpan
 *  sebagai `sections['${skill}:${topicId}:kenalan'].slots[itemIndex].a` —
 *  section 'kenalan' pola aksesnya identik dgn soal Latihan Inti/Tantangan
 *  (upsert saat tap, baca semua saat layar dibuka), jadi dilebur ke sistem
 *  yang sama (TRD.md §4.7), BUKAN tabel/field paralel. */
export type WordAction = 'listen' | 'mic' | 'game';

const WORD_ACTION_LETTER: Record<WordAction, 'l' | 'm' | 'g'> = { listen: 'l', mic: 'm', game: 'g' };

const legacyWordTag = (skill: SkillKey, topicId: string, itemIndex: number, action: WordAction): string =>
  `${skill}:${topicId}:${itemIndex}:${action}`;

/** Ditandai begitu anak TAP tombolnya (bukan nunggu hasil — permintaan user
 *  "ketika sudah diklik") — murni penanda visual "sudah dicoba". */
export function markWordInteraction(
  skill: SkillKey,
  topicId: string,
  itemIndex: number,
  action: WordAction,
  itemRef?: string
): void {
  markSlotInteraction(skill, topicId, 'kenalan', itemIndex, WORD_ACTION_LETTER[action], itemRef);
}

/** Cek section baru DULU, jatuh ke tag lama (`wordInteractions`) sebagai
 *  fallback — supaya warna tombol dari sesi SEBELUM perubahan ini (masih
 *  tersimpan format lama di localStorage anak) tidak hilang begitu saja. */
export function hasWordInteraction(skill: SkillKey, topicId: string, itemIndex: number, action: WordAction): boolean {
  const letter = WORD_ACTION_LETTER[action];
  if (getSlot(skill, topicId, 'kenalan', itemIndex)?.a?.includes(letter)) return true;
  return read().wordInteractions.includes(legacyWordTag(skill, topicId, itemIndex, action));
}

/** Persentase progres 1 topik Vocab — rata-rata 3 langkah (Kenalan, Latihan
 *  Inti, Tantangan yang isinya 3 sub-section) dgn bobot sama, BUKAN `isDone`
 *  biner (0/100%): permintaan user butuh angka granular (mis. "80%") di
 *  daftar topik, bukan cuma selesai/belum. Khusus 'vocabulary' — skill lain
 *  belum punya section granular per TRD.md §4.6. */
/**
 * Kenalan TIDAK dihitung sama sekali (permintaan user: "tab kenalan tidak
 * masuk dalam progress mana pun") — cuma Latihan Inti & Tantangan (rata 2
 * komponen, bukan 3). Kenalan tetap punya penanda visual sendiri per kata
 * (`hasWordInteraction`/`markWordInteraction`, tombol 🔊/🎤/🎮 jadi warna
 * begitu ditap) tapi itu MURNI visual "sudah dicoba", tidak pernah lagi ikut
 * dihitung ke persentase topik. Total tiap section Tantangan dibaca dari
 * `plan.length` PERSISTEN-nya sendiri (`TANTANGAN_TAB_SIZE`, biasanya 5) —
 * BUKAN `itemCount` topik lagi (revisi restrukturisasi Tantangan 3-tab;
 * dulu section-nya seukuran topik penuh, sekarang selalu dibatasi 5).
 */
export function vocabTopicPercent(topicId: string, itemCount: number): number {
  if (itemCount <= 0) return 0;
  const skill: SkillKey = 'vocabulary';

  const stepPct = (section: SectionName, total: number): number => {
    if (total <= 0) return 0;
    const s = getSection(skill, topicId, section);
    if (!s) return 0;
    let done = 0;
    for (let i = 0; i < total; i += 1) {
      if (s.slots[i]?.st === 2) done += 1;
    }
    return done / total;
  };

  const sectionTotal = (section: SectionName): number => getSection(skill, topicId, section)?.plan?.length ?? itemCount;

  const latihanPct = stepPct('latihan', sectionTotal('latihan'));
  const tantanganPct =
    (stepPct('tantangan-eja', sectionTotal('tantangan-eja')) +
      stepPct('tantangan-ucap', sectionTotal('tantangan-ucap')) +
      stepPct('tantangan-susun', sectionTotal('tantangan-susun'))) /
    3;

  return Math.round(((latihanPct + tantanganPct) / 2) * 100);
}

/**
 * Persentase progres 1 topik Listening FORMAT BARU (`items` — Little Stars/
 * Starter: `ListeningSentenceTopic`, Achiever: `ListeningNoteTopic`) — sama
 * persis pola `vocabTopicPercent` di atas (rata-rata Latihan Inti +
 * Tantangan, Kenalan TIDAK dihitung), tapi Tantangan Listening cuma 1
 * sub-section (bukan 3 spt Vocab — Eja Kata/Penggunaan sudah dihapus dari
 * Listening, lihat CLAUDE.md "Listening — 2 Format Berdampingan"). Format
 * LAMA (Explorer/Adventurer, `ListeningTopic`) TIDAK pakai fungsi ini sama
 * sekali — belum py section granular, gating "Kerja Bagus"-nya pakai
 * `markStepVisited`/`isStepVisited` di `app.ts`.
 *
 * `tantangan` opsional (BARU, utk Achiever) — nama section & total slot
 * Tantangan-nya BEDA dari Susun Kalimat: `runTantanganNote` (`games/
 * listening.ts`) menyimpan progres per GAP catatan (`'tantangan-note'`,
 * biasanya 3–5 slot), bukan per KALIMAT (`'tantangan-susun'`, selalu
 * `TANTANGAN_TAB_SIZE`=10) — jadi totalnya tidak bisa disamakan ke
 * `itemCount` spt sebelumnya. Default (tidak diisi) TETAP persis perilaku
 * lama (`'tantangan-susun'`, fallback `itemCount`) — Little Stars/Starter
 * TIDAK perlu ubah pemanggilnya.
 */
export function listeningTopicPercent(
  topicId: string,
  itemCount: number,
  tantangan?: { section: SectionName; total: number }
): number {
  if (itemCount <= 0) return 0;
  const skill: SkillKey = 'listening';

  const stepPct = (section: SectionName, total: number): number => {
    if (total <= 0) return 0;
    const s = getSection(skill, topicId, section);
    if (!s) return 0;
    let done = 0;
    for (let i = 0; i < total; i += 1) {
      if (s.slots[i]?.st === 2) done += 1;
    }
    return done / total;
  };

  const sectionTotal = (section: SectionName, fallback: number): number =>
    getSection(skill, topicId, section)?.plan?.length ?? fallback;

  const latihanPct = stepPct('latihan', sectionTotal('latihan', itemCount));
  const tantanganSection = tantangan?.section ?? 'tantangan-susun';
  const tantanganFallback = tantangan?.total ?? itemCount;
  const tantanganPct = stepPct(tantanganSection, sectionTotal(tantanganSection, tantanganFallback));

  return Math.round(((latihanPct + tantanganPct) / 2) * 100);
}

export function setLast(spot: LastSpot): void {
  const store = read();
  store.last = spot;
  write(store);
}

export function getLast(): LastSpot | null {
  return read().last;
}

export function resetProgress(): void {
  write({ ...EMPTY });
}

/* ------------------------------------------------------- peta level & bos -- */

export function isBossCleared(level: LevelKey): boolean {
  return read().bossCleared.includes(level);
}

/** Menang Tantangan Bos = level itu "ditaklukkan". Idempotent (aman dipanggil ulang). */
export function markBossCleared(level: LevelKey): void {
  const store = read();
  const already = store.bossCleared.includes(level);
  if (!already) store.bossCleared.push(level);
  write(store);
  if (!already) recordEvent({ kind: 'boss_clear', level });
}

/**
 * Status buka/kunci tiap level di Peta Level (PRD tangga §3), konsep dipinjam
 * dari "World Map gating" + "Duel Verifikasi" `inggrisinyuk` (dewasa) — bukan
 * diporting mentah (lihat catatan di app.ts). Aturannya:
 *  - Level pertama di tangga selalu terbuka.
 *  - Level tanpa materi (`hasContent:false`) tidak pernah jadi gerbang nyata:
 *    kalau level SEBELUMNYA belum punya materi, statusnya cuma "diteruskan"
 *    dari status level sebelum itu lagi (tidak ada Bos yang bisa ditagih).
 *  - Kalau level sebelumnya punya materi, level ini baru terbuka setelah Bos
 *    level sebelumnya ditaklukkan — KECUALI anak menaklukkan Bos level ini
 *    SENDIRI lebih dulu (skip-ahead, versi ramah-anak dari "Duel Verifikasi":
 *    tanpa bayar, tanpa AI, cuma tantangan mini-game campuran yang lebih besar).
 */
export function levelUnlockMap(levels: readonly LevelMeta[]): Record<string, boolean> {
  const cleared = read().bossCleared;
  const map: Record<string, boolean> = {};
  levels.forEach((lvl, i) => {
    if (i === 0) {
      map[lvl.key] = true;
      return;
    }
    const prev = levels[i - 1];
    const selfSkip = cleared.includes(lvl.key);
    map[lvl.key] = prev.hasContent ? cleared.includes(prev.key) || selfSkip : (map[prev.key] ?? false) || selfSkip;
  });
  return map;
}

/* ------------------------------------------------------------------- xp -- */

/**
 * XP = satu angka pertumbuhan yang murni naik (tidak pernah turun/hilang) —
 * ala "Stat Kefasihan yang tumbuh tiap misi" di `inggrisinyuk` (dewasa), tapi
 * TANPA bagian yang bisa berkurang (tidak ada HP yang habis, tidak ada skor
 * yang bisa hilang) supaya tetap non-punitive (PRD §4.5/§4.6). Belajar (modul
 * & Bos) memberi XP lebih besar daripada Game (main bebas) — Belajar tetap
 * jalur inti untuk membuka level baru, Game cuma bikin angkanya makin seru.
 */
export function addXp(amount: number): void {
  const store = read();
  store.xp = Math.max(0, store.xp + amount);
  markActiveToday(store);
  write(store);
}

export function getXp(): number {
  return read().xp;
}

/* ------------------------------------------------------ progres harian -- */

const DAY_LABELS = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

function isoDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Dipanggil tiap ada progres nyata (lewat addXp) — tandai hari ini "aktif". */
function markActiveToday(store: Store): void {
  const today = isoDate(new Date());
  if (!store.activeDays.includes(today)) store.activeDays.push(today);
  // Cukup simpan ~60 hari terakhir — tidak perlu riwayat tak terbatas.
  if (store.activeDays.length > 60) store.activeDays = store.activeDays.slice(-60);
}

export interface DayActivity {
  label: string;
  active: boolean;
  isToday: boolean;
}

/**
 * 7 hari terakhir (hari ini paling kanan) — bukan streak. Tidak ada aturan
 * "berturut-turut", tidak ada yang hilang/reset kalau ada hari kosong di
 * tengah. Murni "ini hari-hari kamu sudah main minggu ini" (PRD §12.4 —
 * semua progres di app ini searah naik/informatif, tidak ada yang punitive).
 */
export function getWeekActivity(): DayActivity[] {
  const active = new Set(read().activeDays);
  const today = new Date();
  const days: DayActivity[] = [];
  for (let i = 6; i >= 0; i -= 1) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    days.push({ label: DAY_LABELS[d.getDay()], active: active.has(isoDate(d)), isToday: i === 0 });
  }
  return days;
}

function toEpochDay(iso: string): number {
  const [y, m, d] = iso.split('-').map(Number);
  return Math.floor(Date.UTC(y, m - 1, d) / 86400000);
}

/**
 * Hari main berturut-turut, dihitung dari `activeDays` yang sama dengan
 * `getWeekActivity` — bukan field tersimpan terpisah (pola "derived, bukan
 * sumber kebenaran baru" yang sama dipakai untuk XP, RESEARCH §13.1).
 *
 * Dikasih **1 hari pelindung**: libur SATU hari tidak langsung memutus
 * hitungan (baru reset kalau libur 2 hari berturut-turut) — supaya tetap
 * non-punitive, beda dari streak ala kompetitor yang putus di hari pertama
 * bolong. Hari ini belum sempat main juga tidak dihitung "bolong".
 */
export function getStreak(): number {
  const activeSet = new Set(read().activeDays.map(toEpochDay));
  if (activeSet.size === 0) return 0;

  let streak = 0;
  let usedGrace = false;
  let cursor = toEpochDay(isoDate(new Date()));
  let checkingToday = true;

  for (;;) {
    if (activeSet.has(cursor)) {
      streak += 1;
      cursor -= 1;
      checkingToday = false;
      continue;
    }
    if (checkingToday) {
      checkingToday = false;
      cursor -= 1;
      continue;
    }
    if (!usedGrace) {
      usedGrace = true;
      cursor -= 1;
      continue;
    }
    return streak;
  }
}

/* -------------------------------------------------------------- akurasi -- */

/**
 * Ketepatan = tepat/total percobaan di soal berjawaban benar-salah objektif
 * (`recordAttempt`, dipanggil dari games/*.ts). `null` kalau belum ada
 * percobaan sama sekali — dipakai UI untuk menyembunyikan angka kosong
 * daripada menampilkan "0%" yang terkesan seperti nilai jelek (PRD §4.6).
 */
export function recordAttempt(correct: boolean): void {
  const store = read();
  store.totalAttempts += 1;
  if (correct) store.correctAttempts += 1;
  write(store);
}

export function getAccuracy(): number | null {
  const { correctAttempts, totalAttempts } = read();
  if (totalAttempts === 0) return null;
  return Math.round((correctAttempts / totalAttempts) * 100);
}

/* ----------------------------------------------------------------- nama -- */

export function getName(): string {
  return read().name.trim();
}

export function setName(name: string): void {
  const store = read();
  store.name = name.trim().slice(0, 24);
  write(store);
}

export function getAvatar(): string {
  return read().avatar;
}

export function setAvatar(avatar: string): void {
  if (!(ANIMAL_AVATARS as readonly string[]).includes(avatar)) return;
  const store = read();
  store.avatar = avatar;
  write(store);
}

/* ------------------------------------------------------ sync ke server -- */

/** Salinan `Store` saat ini — dipakai `app.ts` di titik debounce sync
 *  (ambil state TERBARU begitu timer-nya jalan, bukan snapshot basi dari
 *  saat write pertama yang memicu debounce). */
export function snapshot(): Store {
  return read();
}

function mergeSlot(local?: SlotState, remote?: SlotState): SlotState {
  if (!local) return remote ?? { st: 0 };
  if (!remote) return local;
  const lt = local.t ?? 0;
  const rt = remote.t ?? 0;
  const a = Array.from(new Set([...(local.a ?? []), ...(remote.a ?? [])])) as ('l' | 'm' | 'g')[];
  return {
    st: Math.max(local.st, remote.st) as 0 | 1 | 2,
    ok: local.ok || remote.ok ? 1 : undefined,
    lc: rt >= lt ? remote.lc ?? local.lc : local.lc,
    n: Math.max(local.n ?? 0, remote.n ?? 0) || undefined,
    w: Math.max(local.w ?? 0, remote.w ?? 0) || undefined,
    h: local.h || remote.h ? 1 : undefined,
    sc: Math.max(local.sc ?? 0, remote.sc ?? 0) || undefined,
    a: a.length ? a : undefined,
    ir: local.ir ?? remote.ir,
    t: Math.max(lt, rt) || undefined,
  };
}

function mergeSection(local?: SectionState, remote?: SectionState): SectionState {
  if (!local) return remote ?? EMPTY_SECTION();
  if (!remote) return local;
  // Plan & seed ikut pemilik round yang lebih besar — kalau seri, LOCAL
  // menang (anak sedang melihat urutan itu di layar SEKARANG).
  const remoteOwnsPlan = remote.round > local.round;
  const slotKeys = new Set([...Object.keys(local.slots), ...Object.keys(remote.slots)].map(Number));
  const slots: Record<number, SlotState> = {};
  slotKeys.forEach((k) => {
    slots[k] = mergeSlot(local.slots[k], remote.slots[k]);
  });
  return {
    round: Math.max(local.round, remote.round),
    seed: remoteOwnsPlan ? remote.seed : local.seed,
    plan: remoteOwnsPlan ? remote.plan : local.plan,
    cursor: local.cursor, // posisi UI = preferensi perangkat, sama seperti `last`
    slots,
  };
}

function mergeSections(
  local: Record<string, SectionState>,
  remote: unknown
): Record<string, SectionState> {
  const remoteMap =
    remote && typeof remote === 'object' && !Array.isArray(remote) ? (remote as Record<string, SectionState>) : {};
  const keys = new Set([...Object.keys(local), ...Object.keys(remoteMap)]);
  const out: Record<string, SectionState> = {};
  keys.forEach((k) => {
    out[k] = mergeSection(local[k], remoteMap[k]);
  });
  return out;
}

/**
 * Gabungkan progres dari server ke localStorage (dipanggil `app.ts` sekali
 * setelah login/boot kalau sudah ada akun) — BUKAN overwrite, supaya progres
 * yang sempat dibuat di perangkat ini SEBELUM login tidak hilang begitu
 * ditarik data dari perangkat lain. Field progres (done/bossCleared/xp/dst)
 * digabung union/max; identitas (nama/avatar) & posisi terakhir tetap
 * preferensi perangkat ini (localnya selalu sudah terisi default, jadi tidak
 * ada cara membedakan "belum pernah diisi" dari "sengaja default").
 */
export function mergeFromServer(remote: Partial<Store> | null | undefined): void {
  if (!remote || typeof remote !== 'object') return;
  const local = read();
  const strings = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : []);
  const union = (a: string[], b: string[]): string[] => Array.from(new Set([...a, ...b]));

  const remoteTotal = typeof remote.totalAttempts === 'number' && remote.totalAttempts >= 0 ? remote.totalAttempts : 0;
  // correctAttempts/totalAttempts berpasangan (correct <= total) — ambil
  // PASANGAN dari sumber yang totalAttempts-nya lebih besar, bukan max()
  // masing-masing sendiri-sendiri (bisa menghasilkan correct > total).
  const attemptsFromRemote = remoteTotal > local.totalAttempts;

  write({
    done: union(local.done, strings(remote.done)),
    last: local.last ?? remote.last ?? null,
    bossCleared: union(local.bossCleared, strings(remote.bossCleared)),
    xp: Math.max(local.xp, typeof remote.xp === 'number' && remote.xp >= 0 ? remote.xp : 0),
    activeDays: union(local.activeDays, strings(remote.activeDays)).slice(-60),
    correctAttempts: attemptsFromRemote ? (remote.correctAttempts ?? 0) : local.correctAttempts,
    totalAttempts: attemptsFromRemote ? remoteTotal : local.totalAttempts,
    name: local.name,
    avatar: local.avatar,
    wordInteractions: union(local.wordInteractions, strings(remote.wordInteractions)),
    sections: mergeSections(local.sections, remote.sections),
  });
}

