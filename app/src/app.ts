import {
  BOSS_NAME,
  GRAMMAR_TOPICS_BY_LEVEL,
  LEVEL,
  LEVELS,
  LISTENING_TOPICS_BY_LEVEL,
  READING_TOPICS_BY_LEVEL,
  SKILL_META,
  SPEAKING_TOPICS_BY_LEVEL,
  VOCAB_TOPICS_BY_LEVEL,
} from './content';
import {
  ApiRequestError,
  cacheChildStatus,
  finalizeCheckout,
  getAccountInfo,
  getCachedChildStatus,
  getCachedLeaderboard,
  getProgress,
  isLoggedIn,
  login as apiLogin,
  logout as apiLogout,
  refreshChildStatus,
  refreshLeaderboard,
  saveProgress,
  startCheckout,
} from './account';
import * as bossGame from './games/boss';
import { OBJECTIVE_SKILLS } from './games/boss-bank';
import * as grammarGame from './games/grammar';
import * as listeningGame from './games/listening';
import * as balloonPopGame from './games/balloonpop';
import * as memoryMatchGame from './games/memorymatch';
import * as placementGame from './games/placement';
import * as readingGame from './games/reading';
import * as sentencePuzzleGame from './games/sentencepuzzle';
import * as soundHuntGame from './games/soundhunt';
import * as kelompokGame from './games/kelompok';
import { isMusicOn, isSfxOn, musicToggleHtml, setMusicOn, setSfxOn, sfx, startGameMusic, stopGameMusic } from './game-audio';
import * as speakingGame from './games/speaking';
import * as storyQuestGame from './games/storyquest';
import * as vocabularyGame from './games/vocabulary';
import * as wordMatchGame from './games/wordmatch';
import {
  ICON_BACK,
  ICON_CHECK,
  ICON_CHEVRON,
  ICON_GAME,
  ICON_HOME,
  ICON_LEARN,
  ICON_LOCK,
  ICON_PLAY,
  ICON_RAPOR,
  ICON_SETTINGS,
} from './icons';
import { bindDelegatedClicks, clearHandlers, getGameMapReturn, isGameRoundActive, setGameRoundActive, setHandlers } from './interaction';
import { CLOUD, HILLS_RIDGE, HILLS_SHORE, rajaMascot, TRAIL_BEND_LEFT, TRAIL_BEND_RIGHT, placeFor } from './scenery';
import type { LastSpot, LearningInsights, Store, TopicSignal } from './progress';
import {
  addGameXp,
  addXp,
  ANIMAL_AVATAR_NAMES,
  ANIMAL_AVATARS,
  clearOutboxIds,
  computeInsights,
  getActiveDaysInLast,
  getWeekMinutes,
  getWeeklyTrend,
  getAvatar,
  getBossClearedCount,
  getBrowseLevel,
  gamesPlayedCount,
  getGameAccuracy,
  getGameStats,
  getGameMarkas,
  getGameXp,
  getLast,
  getLastGame,
  getLongestStreak,
  addActiveTime,
  getAvgDailyMinutes,
  getName,
  getStreak,
  getWeekActivity,
  getXp,
  grammarTopicPercent,
  bossTestLevels,
  getBossTest,
  isBossCleared,
  isStepVisited,
  levelUnlockMap,
  listeningTopicPercent,
  markBossCleared,
  markDone,
  markStepVisited,
  mergeFromServer,
  peekOutbox,
  readingTopicPercent,
  speakingTopicPercent,
  requestSync,
  setAvatar,
  setBrowseLevel,
  setLast,
  setLastGame,
  setName,
  setSyncHandler,
  snapshot,
  vocabTopicPercent,
} from './progress';
import type { AppState, LevelKey, LevelMeta, NavKey, RajaKey, Screen, SkillKey, SkillMeta } from './types';
import { escapeHtml, qs } from './util';
import { renderVoicePanel } from './voice-panel';
import { applyDefaultRate, DEFAULT_RATE, stopListening, stopSpeaking } from './speech';

const STEP_LABELS = ['Kenalan', 'Latihan Inti', 'Tantangan'];

/**
 * Avatar Bos per level — beda dari emoji level sendiri (LEVELS di content.ts,
 * PRD §3, TIDAK diganti — nama & emoji level tetap yang utama). Murni
 * dekoratif buat Tantangan Bos punya identitas & progres visual sendiri
 * (kelinci lembut → serigala → singa → naga → elang → unicorn), tidak
 * pengaruhi logic unlock/gating sama sekali.
 */
const BOSS_AVATAR: Record<LevelKey, string> = {
  'little-stars': '🐰',
  starter: '🐺',
  explorer: '🦁',
  adventurer: '🐉',
  achiever: '🦅',
  trailblazer: '🦄',
};

/** "Tantangan ${nama raja}" — fallback generik "Tantangan Raja" dipakai cuma
 *  saat belum ada level aktif sama sekali (mis. progres kosong). */
function bossLabel(lvl: LevelMeta | null | undefined): string {
  return lvl ? `Tantangan ${BOSS_NAME[lvl.key]}` : 'Tantangan Raja';
}

/**
 * XP = angka pertumbuhan murni-naik (lihat progress.ts). Belajar (modul & Bos)
 * memberi lebih besar daripada Game (main bebas) — Belajar tetap jalur inti
 * untuk membuka level baru (levelUnlockMap cuma baca bossCleared, bukan XP).
 */
const XP_MODULE = 15;
const XP_BOSS = 50;
const XP_FREEPLAY = 3;

/**
 * Navigasi berisi tujuan yang benar-benar ada di app ini: Beranda (ringkasan +
 * lanjutkan + Peta Level), Belajar (4 skill → materi → aktivitas → Tantangan
 * Bos), Game (main bebas/latihan, lihat renderGame — tidak menggerakkan
 * progres level), Rapor (laporan progres lengkap: XP/streak/ketepatan + skor
 * tiap skill, buat orang tua pantau — lihat renderRapor), dan Pengaturan
 * (suara/kecepatan + akun). 5 tujuan, semuanya nyata — link ke fitur yang
 * belum ada = navigasi bohong.
 */
const NAV: { key: NavKey; label: string; screen: Screen; icon: string }[] = [
  { key: 'home', label: 'Beranda', screen: 'home', icon: ICON_HOME },
  { key: 'belajar', label: 'Belajar', screen: 'menu', icon: ICON_LEARN },
  { key: 'game', label: 'Game', screen: 'game', icon: ICON_GAME },
  { key: 'rapor', label: 'Rapor', screen: 'rapor', icon: ICON_RAPOR },
  { key: 'settings', label: 'Pengaturan', screen: 'settings', icon: ICON_SETTINGS },
];

interface TopicRef {
  id: string;
  title: string;
  desc: string;
}

/**
 * Konten sekarang per-level (permintaan user: fokus materi Adventurer dulu,
 * bukan cuma Explorer) — `*_TOPICS_BY_LEVEL` di content.ts jadi satu-satunya
 * sumber. Fungsi-fungsi di bawah GANTI const `TOPICS`/`TOTAL_TOPICS` statis
 * yang lama: sekarang level anak bisa berubah saat runtime (login, submit
 * placement test), jadi daftar topik/topic count TIDAK BOLEH dihitung
 * sekali di awal — harus selalu ditanya ulang dari `currentLevelMeta()`.
 */
function vocabTopicsForLevel(level: LevelKey) {
  return VOCAB_TOPICS_BY_LEVEL[level] ?? [];
}
function listeningTopicsForLevel(level: LevelKey) {
  return LISTENING_TOPICS_BY_LEVEL[level] ?? [];
}
function speakingTopicsForLevel(level: LevelKey) {
  return SPEAKING_TOPICS_BY_LEVEL[level] ?? [];
}
function grammarTopicsForLevel(level: LevelKey) {
  return GRAMMAR_TOPICS_BY_LEVEL[level] ?? [];
}
function readingTopicsForLevel(level: LevelKey) {
  return READING_TOPICS_BY_LEVEL[level] ?? [];
}

function topicsForSkill(key: SkillKey, level: LevelKey): TopicRef[] {
  const toRef = (t: { id: string; title: string; desc: string }): TopicRef => ({ id: t.id, title: t.title, desc: t.desc });
  switch (key) {
    case 'vocabulary':
      return vocabTopicsForLevel(level).map(toRef);
    case 'listening':
      return listeningTopicsForLevel(level).map(toRef);
    case 'speaking':
      return speakingTopicsForLevel(level).map(toRef);
    case 'grammar':
      return grammarTopicsForLevel(level).map(toRef);
    case 'reading':
      return readingTopicsForLevel(level).map(toRef);
  }
}

const SKILL_KEYS = Object.keys(SKILL_META) as SkillKey[];
/** Skill yang topiknya kosong di level ini disembunyikan (bukan kartu
 *  "0 materi" yang kelihatan rusak) — mis. Reading baru ada utk Adventurer,
 *  Explorer belum. Dipakai Menu Belajar & Game (permintaan user, konsisten
 *  dgn prinsip "placeholder jujur" content.ts, bukan navigasi bohong). */
function visibleSkillKeys(level: LevelKey): SkillKey[] {
  return SKILL_KEYS.filter((key) => topicsForSkill(key, level).length > 0);
}
function totalTopicsForLevel(level: LevelKey): number {
  return SKILL_KEYS.reduce((n, key) => n + topicsForSkill(key, level).length, 0);
}

/** Modul tuntas (100%, `topicFinished`) di 1 level — sumber yang SAMA dgn
 *  progres level/Menu Belajar/Rapor, supaya angka "tuntas" tidak pernah
 *  beda antar layar (dulu Menu Belajar & Rapor pakai `doneCount()` global
 *  lintas SEMUA level ÷ total modul 1 level — bisa lewat 100%). */
function finishedTopicsForLevel(level: LevelKey): number {
  return SKILL_KEYS.reduce((n, key) => n + topicsForSkill(key, level).filter((t) => topicFinished(key, t.id, level)).length, 0);
}

/** "X% menuju level berikutnya" — 🔒 tes akhir level (`materi/test_level.md`):
 *  setengah dari materi level INI yang tuntas (dulu `doneCount()` global
 *  dibagi topik level ini → salah lintas level), setengah dari babak utama
 *  Tantangan Raja yang sudah lolos (naik level ditentukan tes). */
function levelProgressPct(level: LevelKey): number {
  if (isBossCleared(level)) return 100;
  const total = totalTopicsForLevel(level);
  const finished = SKILL_KEYS.reduce((n, key) => n + topicsForSkill(key, level).filter((t) => topicFinished(key, t.id, level)).length, 0);
  const materi = total > 0 ? finished / total : 0;
  const test = getBossTest(level).passed.filter((s) => s !== 'speaking').length / 4;
  return Math.round((materi * 0.5 + test * 0.5) * 100);
}

function levelProgressCaption(level: LevelKey, parentVoice = false): string {
  const total = totalTopicsForLevel(level);
  const finished = SKILL_KEYS.reduce((n, key) => n + topicsForSkill(key, level).filter((t) => topicFinished(key, t.id, level)).length, 0);
  const babak = getBossTest(level).passed.filter((s) => s !== 'speaking').length;
  if (finished === 0 && babak === 0) return parentVoice ? 'Belum ada modul yang tuntas di level ini.' : 'Ayo mulai dari modul pertama!';
  return `${finished} dari ${total} modul tuntas · ${babak} dari 4 babak ${BOSS_NAME[level]} lolos.`;
}

const state: AppState = {
  screen: 'home',
  skillKey: null,
  topicIndex: 0,
  step: 0,
  bossLevel: null,
  soonLevel: null,
  viewLevel: null,
  gameKey: null,
  orderId: null,
};

let root: HTMLElement;
let crumbEl: HTMLElement;
let railNavEl: HTMLElement;
let tabbarEl: HTMLElement;

/**
 * Placement test (baru atau ulang) yang merekomendasikan level X = bukti
 * anak sudah mampu sampai situ — jadi semua level SEBELUM X ditandai Bos-nya
 * "ditaklukkan" (PRD §14/§16 poin "1. first placement test" & "3. belajar +
 * placement test" sama-sama pakai mekanisme ini). Ini yang bikin "kalau
 * hasil retest naik level, beberapa level otomatis kebuka" — reuse
 * `markBossCleared` yang sudah ada, bukan field baru.
 */
function unlockLevelsUpTo(levelKey: string): void {
  const idx = LEVELS.findIndex((l) => l.key === levelKey);
  if (idx < 0) return;
  for (let i = 0; i < idx; i += 1) {
    markBossCleared(LEVELS[i].key);
  }
}

/**
 * Level rekomendasi First Placement Test yang BENERAN sudah dijalani anak —
 * `null` kalau belum pernah tes atau tes-nya di-skip ("Nanti Aja" TIDAK
 * menghasilkan rekomendasi, level di server tetap default-nya). Dipakai dua
 * tempat: `syncUnlocksFromAccount` (samakan status buka/kunci peta) dan
 * `currentStopKey` (perhentian "Kamu di sini") — dua-duanya harus memakai
 * definisi yang SAMA, makanya dipusatkan di sini, bukan dibaca ulang
 * sendiri-sendiri.
 */
function placementAnchorLevel(): LevelKey | null {
  const { level, placementTestDone } = getCachedChildStatus();
  if (placementTestDone !== true || !level) return null;
  return LEVELS.some((l) => l.key === level) ? level : null;
}

/**
 * Samakan status buka/kunci peta dengan rekomendasi placement test yang
 * DIINGAT SERVER — dipanggil tiap boot & tiap `refreshChildStatus()` selesai,
 * bukan cuma sekali sesudah tes selesai (`toContinue`).
 *
 * Kenapa perlu: `bossCleared` (progress.ts) hidup di localStorage PER
 * PERANGKAT/PER BROWSER, sedangkan hasil tes hidup di server. Begitu anak
 * buka app di browser/profil lain, atau data situsnya kehapus, atau tesnya
 * dikerjakan sebelum perangkat ini dipakai, localStorage-nya kosong — dan
 * dulu peta jadi tidak sinkron sama sekali dengan hasil tes (dilaporkan
 * user: rekomendasi Adventurer, tapi peta masih nunjuk Explorer & Adventurer
 * malah terkunci), karena `unlockLevelsUpTo` cuma pernah dipanggil di detik
 * anak menyelesaikan tes. Aman dipanggil berkali-kali: `markBossCleared`
 * idempotent dan HANYA menambah — tidak ada jalan progres jadi berkurang
 * (non-punitive, PRD §4.6/§12.4).
 */
function syncUnlocksFromAccount(): void {
  const anchor = placementAnchorLevel();
  if (anchor) unlockLevelsUpTo(anchor);
}

/**
 * Sync progres (bintang/XP/streak/status soal per section, dst) + outbox
 * event ke `portal/` — REVISI (permintaan user: "supaya server ringan,
 * jangan auto-sync tiap progress kecil") dari desain lama yang memicu
 * request tiap `write()`/`recordEvent()` internal progress.ts (yaitu tiap 1
 * soal dijawab). SEKARANG localStorage MURNI jadi sumber kebenaran selama
 * anak masih mengerjakan section — request PUT ke server cuma terjadi kalau
 * `requestSync()` (progress.ts) dipanggil EKSPLISIT dari titik section
 * BENERAN selesai — 🔒 REVISI (permintaan user "sama konsepnya dgn vocab,
 * untuk listening/speaking/grammar/reading dan game juga"): tadinya cuma
 * scope Vocab (`runStage`'s case `'vocabulary'` & `games/vocabulary.ts`
 * `runTantangan`'s 3 tab), SEKARANG generik lintas SEMUA skill lewat
 * `nextStepWithSync()` (dipasang di step Latihan Inti & Tantangan tiap
 * skill di `runStage`, SEMUA format) + Game Hub (`runRajaRound`'s
 * `onRoundDone`, 1 titik dipakai ke-7 Raja) + Tantangan Besar Raja Kerajaan
 * (`renderBoss`'s `runBoss` win callback). 1 flush = 1 request PUT berisi snapshot `Store`
 * TERBARU (`snapshot()`) + outbox event yang belum terkirim — event yang
 * sukses dikirim baru dihapus dari outbox (`clearOutboxIds`), supaya gagal
 * kirim tidak menghilangkan detailnya. Debounce 1.5s dipertahankan sbg
 * pengaman kalau 2 section selesai nyaris bersamaan, BUKAN lagi mekanisme
 * utama pembatas frekuensi (skenario itu sudah hilang krn trigger-nya
 * sendiri sudah jarang). Kalau belum login: no-op (localStorage TETAP jalan
 * penuh sendirian, PRD §5/§14.4 — main tanpa akun harus utuh).
 */
let progressSyncTimer: ReturnType<typeof setTimeout> | undefined;
function scheduleProgressSync(): void {
  if (!isLoggedIn()) return;
  clearTimeout(progressSyncTimer);
  progressSyncTimer = setTimeout(() => {
    const events = peekOutbox().slice(0, 200); // server juga membatasi 200/request
    void saveProgress(snapshot() as unknown as Record<string, unknown>, events)
      .then(() => clearOutboxIds(events.map((e) => (e as { id: string }).id)))
      .catch(() => {
        /* offline/gagal kirim — progres tetap aman di localStorage, coba lagi di requestSync berikutnya */
      });
  }, 1500);
}

function wireProgressSync(): void {
  setSyncHandler(() => scheduleProgressSync());
}

/** Tarik progres dari server & gabung ke localStorage (union, bukan
 *  overwrite — lihat `mergeFromServer`) — dipanggil sesudah login & tiap
 *  boot kalau sudah ada akun, supaya progres dari perangkat lain ikut
 *  kebawa tanpa menghapus progres yang sempat dibuat di perangkat ini. */
async function hydrateProgressFromServer(): Promise<void> {
  if (!isLoggedIn()) return;
  try {
    const remote = await getProgress();
    mergeFromServer(remote as Partial<Store> | null);
  } catch {
    /* offline-friendly — localStorage tetap sumber kebenaran */
  }
}

export function initApp(): void {
  root = qs<HTMLDivElement>(document, '#root');
  crumbEl = qs<HTMLDivElement>(document, '#crumb');
  railNavEl = qs<HTMLElement>(document, '#railNav');
  tabbarEl = qs<HTMLElement>(document, '#tabbar');

  // Delegasi klik dipasang di body supaya rail & tab bar (di luar #root) ikut terlayani.
  bindDelegatedClicks(document.body);

  // Pulihkan layar dari URL saat pertama dibuka (reload/bookmark/link
  // dibagikan) — replaceState, bukan push, supaya boot pertama tidak jadi
  // 2 entri riwayat browser.
  applyPathToState(location.pathname, location.search);
  const initialUrl = pathFromState(state);
  if (location.pathname + location.search !== initialUrl) {
    history.replaceState(null, '', initialUrl);
  }

  // Tombol back/forward browser mengubah URL dari LUAR go() — popstate
  // CUMA terpicu oleh navigasi beneran (bukan pushState/replaceState kita
  // sendiri), jadi tidak butuh penjaga echo seperti versi hash dulu.
  window.addEventListener('popstate', () => {
    applyPathToState(location.pathname, location.search);
    render();
    window.scrollTo({ top: 0, behavior: 'auto' });
  });

  paintLevelChips();
  paintNav();
  startActiveTimer();
  wireProgressSync(); // pasang sekali — requestSync() (dipanggil eksplisit di titik section selesai) ikut ke-push kalau login
  // SEBELUM render pertama — supaya peta (/peta) & strip peta di Beranda
  // langsung tampil sinkron dengan hasil placement test yang tersimpan,
  // tanpa nunggu fetch /api/me selesai (cache lokal dibaca sinkron).
  syncUnlocksFromAccount();
  render();

  // Segarkan status placement test + progres di background (kalau sudah
  // login) — chip header/rail (di luar #root, tidak ikut ke-render() ulang)
  // selalu disegarkan; layar penuh cuma di-render() ulang kalau kemungkinan
  // kepengaruh (Belajar/Materi/Aktivitas/Pengaturan + Beranda/Peta yang
  // menampilkan perhentian "Kamu di sini" ATAU progres bintang/warna tombol
  // kata) — supaya level/progres yang ditampilkan tidak pernah nge-hardcode
  // cache lama begitu ada data lebih baru dari server.
  if (isLoggedIn()) {
    void Promise.all([refreshChildStatus(), hydrateProgressFromServer(), refreshLeaderboard()]).then(() => {
      paintLevelChips();
      syncUnlocksFromAccount(); // level dari server bisa lebih baru dari cache lokal
      if (
        state.screen === 'menu' ||
        state.screen === 'settings' ||
        state.screen === 'home' ||
        state.screen === 'rapor' ||
        state.screen === 'topics' ||
        state.screen === 'activity'
      ) {
        render();
      }
    });
  }
}

/* ------------------------------------------------------------------ shell -- */

/**
 * Level yang BENERAN ditampilkan di seluruh app — dari hasil First
 * Placement Test kalau anak sudah login & sudah dapat rekomendasi,
 * fallback ke `LEVEL` (Explorer, satu-satunya yang kontennya nyata) kalau
 * belum login/belum ada data. TANPA fungsi ini, chip header/Pengaturan
 * selalu nge-hardcode "Explorer" walau placement test bilang levelnya
 * beda (dilaporkan user) — dipanggil ulang di tiap titik level bisa
 * berubah: boot, sesudah login, sesudah submit placement test, sesudah
 * logout (lihat pemanggil `paintLevelChips()`).
 */
function currentLevelMeta(): LevelMeta {
  const cachedLevel = getCachedChildStatus().level;
  if (!cachedLevel) return LEVEL;
  return LEVELS.find((l) => l.key === cachedLevel) ?? LEVEL;
}

/**
 * Level BADGE anak (`currentLevelMeta`) bisa beda dari level KONTEN yang
 * ditampilkan — mis. anak levelnya "Starter" (belum ada materi sama
 * sekali) HARUS tetap dapat sesuatu buat dimainkan di Menu Belajar/Game,
 * bukan layar kosong (dulu sebelum konten per-level, SEMUA anak selalu
 * lihat Explorer apa pun levelnya — makanya ini baru kelihatan sebagai
 * regresi begitu konten jadi genuinely per-level, dilaporkan lewat testing
 * akun Starter). Jatuh ke level ber-`hasContent` TERDEKAT (pola sama
 * dengan `resolvePlayableLevel` di portal/lib/placement-scoring.ts &
 * `poolFor` di games/boss.ts) — badge/chip tetap jujur nunjukkin level
 * asli, cuma KONTEN yang dialihkan.
 */
function playableLevelFor(level: LevelKey): LevelKey {
  if (LEVELS.find((l) => l.key === level)?.hasContent) return level;
  const idx = LEVELS.findIndex((l) => l.key === level);
  let best: LevelKey | null = null;
  let bestDistance = Infinity;
  LEVELS.forEach((l, i) => {
    if (!l.hasContent) return;
    const distance = Math.abs(i - idx);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = l.key;
    }
  });
  return best ?? 'explorer';
}

function currentPlayableLevel(): LevelMeta {
  const key = playableLevelFor(currentLevelMeta().key);
  return LEVELS.find((l) => l.key === key) ?? LEVEL;
}

/**
 * Level konten yang SEDANG DIJELAJAHI di alur Menu Belajar (menu/materi/
 * aktivitas) — beda dari `currentPlayableLevel()` (level asli anak, tanpa
 * override). Semua markas yang SUDAH terbuka di Peta Level boleh dibuka
 * Menu Belajar-nya sendiri (`state.viewLevel`, diisi `openMenuFromLevels`
 * atau pemilih level di `renderMenu`/`renderTopics`) buat lihat/ulang
 * materinya, TANPA mengubah level asli anak.
 *
 * 🔒 Prioritas 3 lapis (permintaan user: "ketika user pilih Little Stars akan
 * terus di level tersebut sampai user pilih yang lain"): (1) `state.viewLevel`
 * eksplisit kalau ada (dari URL `?level=`/navigasi barusan) — SELALU menang,
 * termasuk `null` yang SENGAJA dipasang di titik yang topicIndex-nya terikat
 * ke level ASLI anak (`resume`/`practiceInsightTopic`/`reviewInsightTopic` —
 * itu makanya titik2 itu skrg mengisi `currentPlayableLevel().key` eksplisit,
 * BUKAN `null` polos lagi, supaya tetap "menang" di lapis 1, bukan jatuh ke
 * lapis 2 di bawah); (2) `getBrowseLevel()` — cache "nempel" (`Store.
 * browseLevel`), dipakai kalau TIDAK ada override eksplisit (mis. reload
 * langsung ke `/materi` tanpa `?level=`, klik nav rail/tab bar "Belajar",
 * dst) — SATU sumber kebenaran ini yang bikin dropdown level "nempel" lintas
 * reload/nav, bukan disebar cek cache di tiap pemanggil `go()`; (3) fallback
 * akhir `currentPlayableLevel()` kalau belum pernah pilih apa pun.
 * Divalidasi ulang di SETIAP lapis (bukan cuma dipercaya dari storage) —
 * `hasContent` & benar-benar terbuka (`levelUnlockMap`) — supaya URL yang
 * diketik manual/cache basi tidak bisa mengintip markas yang belum
 * ditaklukkan; kalau tidak valid, turun ke lapis berikutnya, bukan layar rusak.
 */
function browsingLevel(): LevelMeta {
  const valid = (key: LevelKey | null): LevelMeta | null => {
    if (!key) return null;
    const lvl = LEVELS.find((l) => l.key === key);
    return lvl?.hasContent && levelUnlockMap(LEVELS)[lvl.key] ? lvl : null;
  };
  return valid(state.viewLevel) ?? valid(getBrowseLevel()) ?? currentPlayableLevel();
}

/**
 * 🔒 Level ANAK yang tampil di header/rail/Pengaturan (permintaan user: "itu
 * level user bukan level materi, tidak akan berubah kecuali naik level").
 * Berangkat dari level akun (`currentLevelMeta`, hasil placement test), lalu
 * maju 1 tangga tiap kali Raja level itu sudah ditaklukkan — pola sama
 * perhentian "Kamu di sini" Peta Level (`currentStopKey`). TIDAK PERNAH ikut
 * level yang sedang dijelajahi di Menu Belajar (`browsingLevel`) — pilih
 * Little Stars dari dropdown tidak menurunkan level di header.
 * Murni tampilan: `currentLevelMeta`/`currentPlayableLevel` (bahasa pujian,
 * default konten, `topicIndex` resume) SENGAJA tidak diubah.
 */
function userLevelMeta(): LevelMeta {
  const base = currentLevelMeta();
  let idx = LEVELS.findIndex((l) => l.key === base.key);
  while (idx >= 0 && idx < LEVELS.length - 1 && isBossCleared(LEVELS[idx].key)) idx += 1;
  return LEVELS[idx] ?? base;
}

function paintLevelChips(): void {
  // Sapaan header — "{avatar} Hi {nama} {level}" kalau nama sudah diisi
  // (lewat Pengaturan). Belum ada nama = balik ke chip level polos (bukan
  // "Hi" yang ganjil tanpa nama) — nama murni opsional & lokal (progress.ts),
  // bukan akun (PRD §5).
  const name = getName();
  const avatar = getAvatar();
  const level = userLevelMeta();
  const chipText = name ? `${avatar} Hi ${escapeHtml(name)} ${level.emoji} ${level.name}` : `${level.emoji} ${level.name}`;
  qs<HTMLElement>(document, '#topLevel').innerHTML = `
    <span class="level-chip"><b>${chipText}</b></span>
  `;
  qs<HTMLElement>(document, '#railFoot').innerHTML = `
    <div class="rail-level">
      <span class="eyebrow">Level</span>
      <b>${level.emoji} ${level.name}</b>
      <span class="cefr">${level.cefr}</span>
    </div>
  `;
}

function activeNav(): NavKey {
  // 'levelSoon' (layar perhentian yang materinya belum ada) ikut Beranda —
  // Peta Level SEKARANG bagian dari Beranda sendiri (bukan layar terpisah lagi),
  // dan 'levelSoon' dibuka DARI situ, isinya info perhentian bukan kegiatan
  // belajar (tanpa baris ini dia jatuh ke fallback 'belajar' dan tab Belajar
  // nyala padahal anak sedang melihat peta).
  if (state.screen === 'home' || state.screen === 'levelSoon') return 'home';
  if (state.screen === 'settings') return 'settings';
  if (state.screen === 'game' || state.screen === 'gamePlay') return 'game';
  if (state.screen === 'rapor' || state.screen === 'raporDetail') return 'rapor';
  return 'belajar'; // menu, topics, activity, boss
}

/** Navigasi digambar sekali; tiap pindah layar cuma status aktifnya yang diperbarui
 *  supaya fokus keyboard tidak hilang saat tombolnya dipakai. */
function paintNav(): void {
  const item = (cls: string) => (n: (typeof NAV)[number]) => `
    <button class="${cls}" type="button" data-action="navigate" data-payload="${n.key}">
      <span class="nav-ico">${n.icon}</span><span>${n.label}</span>
    </button>`;
  railNavEl.innerHTML = NAV.map(item('nav-item')).join('');
  tabbarEl.innerHTML = NAV.map(item('tab')).join('');
}

function syncNav(): void {
  const active = activeNav();
  document.querySelectorAll<HTMLElement>('.rail-nav > button, .tabbar > button').forEach((btn) => {
    if (btn.dataset.payload === active) btn.setAttribute('aria-current', 'page');
    else btn.removeAttribute('aria-current');
  });
}

/* ------------------------------------------------------------ URL routing -- */
/**
 * Path routing asli (History API) — URL beneran berubah tiap pindah layar
 * (mis. `/belajar`, `/pengaturan`), TANPA `#` (kurang cocok utk production —
 * permintaan user). `go()` mendorong path baru (pushState, bikin tombol
 * back/forward browser kerja); `render()` cuma MEMPERBAIKI path di tempat
 * (replaceState) kalau state berubah di luar go() (mis. gerbang login
 * memaksa ke 'account') — supaya back-button tidak nyangkut di layar yang
 * sebenarnya diblokir. Beda dari hash: `pushState`/`replaceState` TIDAK
 * pernah memicu event apa pun (cuma navigasi back/forward beneran yang
 * memicu `popstate`), jadi TIDAK perlu penjaga echo seperti versi hash dulu.
 *
 * PENTING buat server: path asli (bukan hash) butuh server diarahkan balik
 * ke index.html untuk path apa pun yang bukan file statis (SPA fallback) —
 * kalau tidak, reload langsung di `/belajar` akan 404. Lihat
 * `dev-server.mjs` (dev lokal) & config nginx contoh di README.md
 * (produksi) — keduanya sudah diarahkan untuk ini.
 */
/** Segmen URL yang dilihat orang — dibuat SAMA dengan nama halaman yang
 *  tampak (Beranda/Belajar/Game/Pengaturan di nav, bukan nama internal
 *  'home'/'menu'/'settings' yang cuma dipakai kode). `topics`/`activity`
 *  cuma anak dari Belajar (bukan navigasi utama), jadi diberi segmen
 *  sendiri yang tetap deskriptif ("materi"/"aktivitas") — bukan disamakan
 *  ke "belajar" juga, supaya tetap 1-ke-1 & gampang di-reverse-parse. */
const SCREEN_TO_SLUG: Record<Screen, string> = {
  home: 'beranda',
  menu: 'belajar',
  topics: 'materi',
  activity: 'aktivitas',
  settings: 'pengaturan',
  rapor: 'rapor',
  raporDetail: 'rapor-detail',
  levelSoon: 'materi-segera',
  boss: 'bos',
  game: 'game',
  // Fallback SAJA (dipakai kalau `gameKey` somehow null) — jalur normal
  // `/game/<slug>` DITANGANI KHUSUS di `pathFromState`/`applyPathToState`
  // di bawah (nested path, bukan pola flat 1-segmen spt slug lain di sini),
  // slug ini sengaja beda dari `game` di atas biar TIDAK bertabrakan di
  // `SLUG_TO_SCREEN` (reverse map).
  gamePlay: 'game-play',
  account: 'masuk',
  register: 'daftar',
  payment: 'pembayaran',
  placementTest: 'placement-test',
  landing: '',
};
const SLUG_TO_SCREEN: Record<string, Screen> = Object.fromEntries(
  (Object.entries(SCREEN_TO_SLUG) as [Screen, string][]).map(([screen, slug]) => [slug, screen])
);

function pathFromState(s: AppState): string {
  // Screen 'gamePlay' — nested path `/game/<slug>` (permintaan user "misal
  // game/raja-kata"), BUKAN pola flat `/${SCREEN_TO_SLUG[...]}` spt layar
  // lain — ditangani PALING AWAL, sebelum fallback generik di akhir fungsi.
  if (s.screen === 'gamePlay' && s.gameKey) {
    return `/game/${RAJA_SLUG[s.gameKey]}`;
  }
  const query: string[] = [];
  if (s.screen === 'topics' || s.screen === 'activity') {
    if (s.skillKey) query.push(`skill=${s.skillKey}`);
    query.push(`topic=${s.topicIndex}`);
    if (s.screen === 'activity') query.push(`step=${s.step}`);
  }
  // Tiga layar per-level (`bos`, `materi-segera`, & alur Menu Belajar) pakai
  // query `level=` yang sama bentuknya — biar URL-nya konsisten & gampang
  // di-reverse-parse. `viewLevel` cuma ditulis kalau memang diisi (jelajah
  // markas lain) — default (ikut level asli anak) tidak perlu nongol di URL.
  if (s.screen === 'payment' && s.orderId) query.push(`orderId=${encodeURIComponent(s.orderId)}`);
  if (s.screen === 'boss' && s.bossLevel) query.push(`level=${s.bossLevel}`);
  if (s.screen === 'levelSoon' && s.soonLevel) query.push(`level=${s.soonLevel}`);
  if ((s.screen === 'menu' || s.screen === 'topics' || s.screen === 'activity') && s.viewLevel) {
    query.push(`level=${s.viewLevel}`);
  }
  return `/${SCREEN_TO_SLUG[s.screen]}${query.length ? '?' + query.join('&') : ''}`;
}

/** Terapkan path+query dari URL ke `state` — divalidasi ketat (skill/level
 *  harus dikenal, angka harus valid) supaya URL yang diketik manual/lama
 *  tidak bisa bikin renderer nge-crash gara-gara state setengah jadi. */
function applyPathToState(pathname: string, search: string): void {
  const raw = pathname.replace(/^\//, '');
  const params = new URLSearchParams(search);

  // Screen 'gamePlay' — nested path `/game/<slug>`, dicek DULU sebelum
  // fallback flat `SLUG_TO_SCREEN` (yang cuma kenal segmen tunggal persis
  // "game", bukan "game/raja-kata"). Slug tidak dikenal → jatuh ke roster
  // Game Hub biasa, bukan crash.
  if (raw.startsWith('game/')) {
    const gameKey = SLUG_TO_RAJA[raw.slice('game/'.length)];
    if (gameKey) {
      state.screen = 'gamePlay';
      state.gameKey = gameKey;
      return;
    }
    state.screen = 'game';
    return;
  }

  const screen = SLUG_TO_SCREEN[raw] ?? 'home';

  const skillParam = params.get('skill');
  const skillKey = SKILL_KEYS.includes(skillParam as SkillKey) ? (skillParam as SkillKey) : null;
  const topicParam = Number(params.get('topic'));
  const stepParam = Number(params.get('step'));
  const levelParam = params.get('level');
  const levelFromUrl = LEVELS.some((l) => l.key === levelParam) ? (levelParam as LevelKey) : null;

  state.screen = screen;
  if (screen === 'topics' || screen === 'activity') {
    // Tanpa skill yang valid, topics/activity tidak bisa dirender (butuh
    // SKILL_META[key]) — jatuhkan ke menu, bukan biarkan renderer crash.
    if (!skillKey) {
      state.screen = 'menu';
    } else {
      state.skillKey = skillKey;
      state.topicIndex = Number.isFinite(topicParam) ? topicParam : 0;
      // Kenalan/Latihan Inti/Tantangan sengaja TIDAK terkunci (permintaan
      // user) — step dari URL dipakai langsung, cuma diklem ke rentang
      // valid supaya angka ngawur tidak bikin index out-of-range.
      if (screen === 'activity') {
        state.step = Number.isFinite(stepParam) ? Math.min(Math.max(stepParam, 0), STEP_LABELS.length - 1) : 0;
      }
    }
  }
  if (screen === 'payment') state.orderId = params.get('orderId');
  if (screen === 'boss') state.bossLevel = levelFromUrl;
  if (screen === 'levelSoon') state.soonLevel = levelFromUrl;
  if (screen === 'menu' || screen === 'topics' || screen === 'activity') state.viewLevel = levelFromUrl;
}

/** Sinkron URL dgn `state.step` tanpa nambah entri riwayat baru (dipakai
 *  jumpStep/prevStep/nextStep — beda dari `go()` yang selalu pushState) —
 *  supaya refresh/bagikan link tetap mendarat di langkah yang sama, bukan
 *  balik ke Kenalan terus. */
function syncActivityUrl(): void {
  const url = pathFromState(state);
  if (location.pathname + location.search !== url) {
    history.replaceState(null, '', url);
  }
}

function go(screen: Screen, extra?: Partial<AppState>): void {
  state.screen = screen;
  Object.assign(state, extra ?? {});
  const url = pathFromState(state);
  if (location.pathname + location.search !== url) {
    history.pushState(null, '', url);
  }
  render();
  const smooth = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  window.scrollTo({ top: 0, behavior: smooth ? 'smooth' : 'auto' });
}

/** Layar yang boleh dibuka TANPA login (homepage, masuk, daftar, menunggu
 *  pembayaran) — begitu sudah login, layar ini dilewati ke Beranda. */
const PUBLIC_SCREENS: Screen[] = ['landing', 'account', 'register', 'payment'];

function render(): void {
  // Setiap pindah screen/step (back, keluar, tab lain, jumpStep/prevStep/
  // nextStep — SEMUA lewat sini) WAJIB hentikan TTS yang mungkin masih
  // bicara (mis. dialog/cerita panjang Listening yang belum selesai
  // diputar) — permintaan user, `speech.ts` `stopSpeaking()`. Transisi soal
  // ke soal DALAM 1 stage (games/*.ts `draw()`/`paint()` lokal) TIDAK lewat
  // `render()`, jadi pujian TTS di jawaban benar tetap aman tidak keputus.
  stopSpeaking();
  // Mic yang masih merekam juga dimatikan — keluar layar = semua audio berhenti.
  stopListening();
  // Musik latar Game Hub ikut berhenti (dinyalakan lagi `renderGamePlay`).
  stopGameMusic();
  clearHandlers();
  setHandlers({
    navigate: (payload) => {
      const item = NAV.find((n) => n.key === payload);
      // `viewLevel` sengaja `null` polos di sini — `browsingLevel()` sendiri
      // yang jatuh ke `getBrowseLevel()` (cache "nempel") kalau tidak ada
      // override eksplisit, jadi tab "Belajar" otomatis kebuka di level
      // terakhir dipilih TANPA perlu titik ini tahu soal cache sama sekali.
      if (item) go(item.screen, { viewLevel: null });
    },
  });

  // Login wajib — semua layar digerbang KECUALI layar akun & homepage
  // marketing itu sendiri. Pengunjung yang belum login mendarat di 'landing'
  // (bukan langsung dilempar ke form masuk) supaya masih ada penjelasan
  // produk sebelum gerbang login — CTA di 'landing' sendiri yang membawa ke
  // 'account'. Dipusatkan di sini (bukan per-tombol) supaya SEMUA jalur
  // navigasi (nav, tombol dalam, deep action) otomatis kena, tanpa perlu
  // guard berulang di tiap handler.
  if (!isLoggedIn() && !PUBLIC_SCREENS.includes(state.screen)) {
    state.screen = 'landing';
  }
  // Kebalikannya: URL bisa saja masih "/" atau "/masuk" (mis. dari sesi lama
  // yang tokennya sudah kedaluwarsa, atau bookmark homepage) padahal sekarang
  // sudah login — jangan tampilkan layar marketing/login ke orang yang sudah masuk.
  if (isLoggedIn() && PUBLIC_SCREENS.includes(state.screen)) {
    state.screen = getCachedChildStatus().placementTestDone === false ? 'placementTest' : 'home';
  }

  // Perbaiki URL DI TEMPAT (replaceState, bukan push) kalau state barusan
  // berubah di luar go() — mis. gerbang login barusan memaksa ke 'account'.
  // replaceState supaya back-button tidak nyangkut di layar yang diblokir.
  const correctedUrl = pathFromState(state);
  if (location.pathname + location.search !== correctedUrl) {
    history.replaceState(null, '', correctedUrl);
  }

  // Layar login = halaman tersendiri (pola inggrisinyuk dewasa) — tanpa rail/
  // topline/tabbar & tanpa header nama+level, supaya tidak kelihatan separuh
  // app di baliknya sebelum benar-benar masuk.
  document.body.classList.toggle('is-login', ['account', 'register', 'payment'].includes(state.screen));
  // Homepage marketing = halaman tersendiri juga (pola sama .is-login) —
  // tanpa rail/topline/tabbar, full-bleed, punya nav+footer sendiri.
  document.body.classList.toggle('is-landing', state.screen === 'landing');
  // First Placement Test juga halaman tersendiri (permintaan user) — supaya
  // tidak ada jalan keluar diam-diam lewat tab Beranda/Belajar/Game/
  // Pengaturan di tengah tes; keluar cuma lewat tombol balik yang sudah
  // digerbang konfirmasi (renderPlacementTestScreen).
  document.body.classList.toggle('is-placement-test', state.screen === 'placementTest');
  // Main 1 Raja Game Hub juga halaman tersendiri (permintaan user: "ketika
  // klik icon game maka ke halaman baru... sehingga navbar dibawahnya
  // hilang") — pola SAMA PERSIS is-placement-test, keluar tetap lewat
  // tombol balik yang digerbang konfirmasi (`renderGamePlay`).
  document.body.classList.toggle('is-game-play', state.screen === 'gamePlay');
  // Markas Raja / Tantangan Bos JUGA halaman tersendiri (permintaan user:
  // "ketika test di markas raja maka open halaman baru seperti fitur
  // game") — pola SAMA PERSIS is-game-play, keluar tetap lewat tombol balik
  // yang sekarang jg digerbang pop up konfirmasi (`renderBoss`).
  document.body.classList.toggle('is-boss-play', state.screen === 'boss');

  syncNav();
  renderCrumb();
  setAccent(state.screen === 'topics' || state.screen === 'activity' ? state.skillKey : null);

  if (state.screen === 'home') return renderHome();
  if (state.screen === 'levelSoon') return renderLevelSoon();
  if (state.screen === 'settings') return renderSettings();
  if (state.screen === 'rapor') return renderRapor();
  if (state.screen === 'raporDetail') return renderRaporDetail();
  if (state.screen === 'menu') return renderMenu();
  if (state.screen === 'topics') return renderTopics();
  if (state.screen === 'game') return renderGame();
  if (state.screen === 'gamePlay') return renderGamePlay();
  if (state.screen === 'boss') return renderBoss();
  if (state.screen === 'account') return renderAccount();
  if (state.screen === 'register') return renderRegister();
  if (state.screen === 'payment') return renderPayment();
  if (state.screen === 'placementTest') return renderPlacementTestScreen();
  if (state.screen === 'landing') return renderLandingPage();
  renderActivity();
}

/** Warna aksen mengikuti skill yang sedang dibuka; di luar itu balik ke warna merek. */
function setAccent(key: SkillKey | null): void {
  const el = document.documentElement;
  if (!key) {
    el.style.removeProperty('--accent');
    el.style.removeProperty('--accent-bg');
    return;
  }
  el.style.setProperty('--accent', SKILL_META[key].accent);
  el.style.setProperty('--accent-bg', SKILL_META[key].accentBg);
}

function topicTitle(key: SkillKey, index: number, level: LevelKey): string {
  return topicsForSkill(key, level)[index]?.title ?? '';
}

function renderCrumb(): void {
  // Breadcrumb cuma muncul di alur yang benar-benar bertingkat (materi, aktivitas & bos).
  if (state.screen !== 'topics' && state.screen !== 'activity' && state.screen !== 'boss') {
    crumbEl.hidden = true;
    crumbEl.innerHTML = '';
    return;
  }
  crumbEl.hidden = false;

  const parts = ['Menu Belajar'];
  if (state.screen === 'boss' && state.bossLevel) {
    parts.push(LEVELS.find((l) => l.key === state.bossLevel)!.name, `Tantangan ${BOSS_NAME[state.bossLevel]}`);
  } else {
    if (state.skillKey) parts.push(SKILL_META[state.skillKey].label);
    if (state.screen === 'activity' && state.skillKey) {
      parts.push(topicTitle(state.skillKey, state.topicIndex, browsingLevel().key));
      parts.push(STEP_LABELS[state.step]);
    }
  }
  crumbEl.innerHTML = parts
    .map((p, i) => {
      const isLast = i === parts.length - 1;
      return `<span class="${isLast ? 'current' : ''}">${p}</span>` + (isLast ? '' : `<span class="sep">›</span>`);
    })
    .join('');
}

/* ---------------------------------------------------------------- beranda -- */

/** Progres lama bisa menunjuk ke materi yang sudah tidak ada — validasi dulu. */
function validLast(): LastSpot | null {
  const last = getLast();
  if (!last) return null;
  const list = topicsForSkill(last.skill, currentPlayableLevel().key);
  if (!list[last.topicIndex]) return null;
  return last;
}

interface NextMateri {
  skill: SkillKey;
  topicIndex: number;
  /** true = materi terakhir yang dibuka BELUM selesai → tombol "Yuk
   *  Lanjutkan" balik ke situ. false = materi terakhir sudah selesai (atau
   *  belum pernah buka apa pun sama sekali) → tombol "Yuk Mulai" ke materi
   *  BERIKUTNYA yang belum selesai (permintaan user: kasus "belum pernah
   *  mulai" disamakan labelnya dgn "lanjut ke materi baru"). */
  continuing: boolean;
}

/**
 * Topik SUNGGUH selesai (permintaan user, fix "70% tapi sudah tertulis
 * selesai", DIPERLUAS permintaan user berikutnya: "munculkan modul selesai
 * setelah statusnya 100%... berlaku di semua materi vocab, reading,
 * listening, grammar, speaking" — bug: layar "Kerja Bagus" dulu muncul
 * begitu STEP TERAKHIR yang lagi dikerjakan tuntas, apa pun step itu
 * (`nextStep()` di bawah cuma cek `state.step`, TIDAK PERNAH cek progress
 * beneran) — anak yang loncat langsung ke Tantangan (stepper bebas, TIDAK
 * pernah dikunci) & menuntaskannya BISA dapat "Kerja Bagus" walau Latihan
 * Inti masih 0%. SATU sumber kebenaran "topik ini kelar belum" dipakai DUA
 * tempat sekarang: kartu materi/skill/target Lanjutkan (spt sebelumnya) DAN
 * gate layar Kerja Bagus (`nextStep()`) — supaya keduanya TIDAK PERNAH
 * cerita beda:
 *  - Vocab & Listening FORMAT BARU (`ListeningSentenceTopic`, py section
 *    granular per-soal spt Vocab) → `vocabTopicPercent`/
 *    `listeningTopicPercent` (>=100), akurasi PER SOAL (bukan cuma "step
 *    ini pernah dituntaskan").
 *  - Reading &amp; Grammar FORMAT KEDUA (`ReadingWordTopic`/
 *    `GrammarPatternTopic`, py section granular) → `readingTopicPercent`/
 *    `grammarTopicPercent` (>=100), sama pola dgn Listening format baru.
 *  - Listening FORMAT LAMA (Explorer/Adventurer) + Speaking + Grammar
 *    FORMAT LAMA + Reading FORMAT LAMA (SEMUA belum py section granular
 *    per-soal) → `isStepVisited` utk 'latihan' DAN 'tantangan' (Kenalan
 *    TETAP tidak dihitung, konsisten dgn Vocab) — lebih kasar drpd persen
 *    (cuma "pernah dituntaskan 1x", bukan per-soal), tapi TETAP benar
 *    menutup bug utama: step yang BELUM PERNAH disentuh sama sekali TIDAK
 *    akan lolos gate ini.
 */
function topicProgressPercent(key: SkillKey, topicId: string, level: LevelKey): number {
  if (key === 'vocabulary') {
    const vocabTopic = vocabTopicsForLevel(level).find((t) => t.id === topicId);
    return vocabTopicPercent(topicId, vocabTopic?.items.length ?? 0);
  }
  if (key === 'listening') {
    const listeningTopic = listeningTopicsForLevel(level).find((t) => t.id === topicId);
    if (listeningTopic && 'items' in listeningTopic) {
      // `ListeningNoteTopic` (Achiever) & `ListeningDialogueTopic` (Trailblazer)
      // py Tantangan beda dari `ListeningSentenceTopic` (Little Stars/Starter)
      // — section & total slotnya per GAP catatan / per pertanyaan inferensi,
      // bukan per kalimat dikte (`progress.ts` `listeningTopicPercent`).
      const tantangan =
        'noteGaps' in listeningTopic
          ? { section: 'tantangan-note', total: listeningTopic.noteGaps.length }
          : 'dialogueLines' in listeningTopic
            ? { section: 'tantangan-dialog', total: listeningTopic.inferenceQuestions.length }
            : undefined;
      return listeningTopicPercent(topicId, listeningTopic.items.length, tantangan);
    }
  }
  if (key === 'reading') {
    const readingTopic = readingTopicsForLevel(level).find((t) => t.id === topicId);
    // Format "Baca Teks" (satu-satunya format Reading) — section granular per
    // soal `latihan-teks` & `tantangan-teks` (materi/reading.md §22).
    if (readingTopic) {
      const totals = readingGame.textQuizTotals(readingTopic);
      return readingTopicPercent(topicId, totals.latihan, { section: 'tantangan-teks', total: totals.tantangan }, 'latihan-teks');
    }
  }
  const stepsVisited = isStepVisited(key, topicId, 'latihan') && isStepVisited(key, topicId, 'tantangan');
  if (key === 'grammar') {
    const grammarTopic = grammarTopicsForLevel(level).find((t) => t.id === topicId);
    // Semua 3 format py section per soal. Format kalimat & transform: topik
    // yang SUDAH tuntas di alur lama (cuma tercatat `isStepVisited`) tetap
    // 100% — non-punitive, sama pola Speaking.
    if (grammarTopic && 'items' in grammarTopic) {
      return grammarTopicPercent(topicId, grammarTopic.items.length, Math.min(grammarTopic.items.length, 10));
    }
    if (grammarTopic && 'transforms' in grammarTopic) {
      const n = grammarTopic.transforms.length;
      return stepsVisited ? 100 : grammarTopicPercent(topicId, n, n, 'tantangan-transform', null);
    }
    if (grammarTopic && 'sentences' in grammarTopic) {
      const n = grammarTopic.sentences.length;
      return stepsVisited ? 100 : grammarTopicPercent(topicId, n, n, 'tantangan-bentuk', 'tantangan-detektif');
    }
  }
  if (key === 'speaking') {
    const speakingTopic = speakingTopicsForLevel(level).find((t) => t.id === topicId);
    if (speakingTopic) {
      const totals = speakingGame.speakingSlotTotals(speakingTopic, level);
      // Per soal, sama Vocab/Listening. Topik yang SUDAH tuntas di alur lama
      // (sebelum 2026-09-24, cuma tercatat lewat `isStepVisited`) tetap 100% —
      // non-punitive, anak tidak kehilangan status "selesai" krn alur berubah.
      return stepsVisited ? 100 : speakingTopicPercent(topicId, totals.latihan, totals.tantangan, totals.bertanya);
    }
  }
  return stepsVisited ? 100 : 0;
}

function topicFinished(key: SkillKey, topicId: string, level: LevelKey): boolean {
  return topicProgressPercent(key, topicId, level) >= 100;
}

/**
 * Kartu "lanjutkan/mulai" di Menu Belajar (permintaan user) — beda dari
 * `spark` Beranda yang cuma menunjuk balik ke `last` apa adanya: di sini
 * kalau materi terakhir SUDAH selesai, otomatis loncat ke materi berikutnya
 * yang belum selesai (skill sama dulu, baru skill lain) supaya anak tidak
 * diarahkan ke materi yang sudah tuntas. `null` = benar-benar semua materi
 * level ini sudah tuntas.
 */
function findNextMateri(level: LevelKey): NextMateri | null {
  const last = validLast();
  if (last) {
    const list = topicsForSkill(last.skill, level);
    const lastTopic = list[last.topicIndex];
    if (lastTopic && !topicFinished(last.skill, lastTopic.id, level)) {
      return { skill: last.skill, topicIndex: last.topicIndex, continuing: true };
    }
    for (let i = last.topicIndex + 1; i < list.length; i += 1) {
      if (!topicFinished(last.skill, list[i].id, level)) return { skill: last.skill, topicIndex: i, continuing: false };
    }
  }
  for (const key of visibleSkillKeys(level)) {
    const list = topicsForSkill(key, level);
    const idx = list.findIndex((t) => !topicFinished(key, t.id, level));
    if (idx >= 0) return { skill: key, topicIndex: idx, continuing: false };
  }
  return null;
}

/**
 * Panel "Progresmu" (level progress bar + XP/streak/ketepatan) — sumber
 * kebenaran TUNGGAL dipakai Beranda (ringkasan cepat) DAN Rapor (laporan
 * lengkap), supaya angkanya tidak pernah beda antar 2 layar. Dulu cuma ada
 * di `renderHome`, diekstrak begitu tab Rapor ditambahkan.
 */
function buildProgressPanel(withDetail = false, insights: LearningInsights = computeInsights()): string {
  const mapUnlocked = levelUnlockMap(LEVELS);
  const hereKey = currentStopKey(mapUnlocked);
  const hereIdx = LEVELS.findIndex((l) => l.key === hereKey);
  const hereLevel = hereIdx >= 0 ? LEVELS[hereIdx] : null;
  const nextLevel = hereIdx >= 0 ? LEVELS[hereIdx + 1] : undefined;

  // Progres menuju Tantangan Bos — murni informatif/positif — bukan skor
  // benar-salah (PRD §4.5/§4.6: tanpa rasio benar/salah dalam bentuk apa pun
  // dipakai untuk buka/kunci apa pun; "Ketepatan" di bawah cuma motivasi
  // tampilan, tidak pernah menggerbang progres).
  const bossPct = levelProgressPct(hereLevel?.key ?? currentPlayableLevel().key);

  const xp = getXp();
  const streakDays = getStreak();
  // Sama sumber dgn bintang skill (`computeInsights`), bukan `getAccuracy()`.
  const accuracy = insights.objectiveAccuracy;

  // Terinspirasi strip stat + progress bar level di beranda kompetitor, tapi
  // difilter kid-friendly (CLAUDE.md, PRD §4.6/§12.4):
  //  - Tanpa coin/mata uang — tidak ada ekonomi untuk anak belanjakan apa pun.
  //  - Tanpa "HP" yang bisa habis — cuma XP yang memang sudah ada & cuma naik.
  //  - Streak dikasih 1 hari pelindung (progress.ts `getStreak`) supaya libur
  //    sehari tidak langsung kebaca "putus" — beda dari streak kompetitor.
  //  - Ketepatan dibingkai hangat & disembunyikan ("–") kalau belum ada
  //    percobaan sama sekali, bukan ditampilkan sebagai "0%" (PRD §4.6).
  const statTiles = `
    <div class="stat-tile">
      <span class="stat-ic" aria-hidden="true">⚡</span>
      <div class="stat-value">${xp}</div>
      <div class="stat-label">XP</div>
    </div>
    <div class="stat-tile">
      <span class="stat-ic" aria-hidden="true">🔥</span>
      <div class="stat-value">${streakDays > 0 ? streakDays : '–'}</div>
      <div class="stat-label">${streakDays > 0 ? 'hari beruntun' : 'yuk mulai!'}</div>
    </div>
    <div class="stat-tile">
      <span class="stat-ic" aria-hidden="true">🎯</span>
      <div class="stat-value">${accuracy !== null ? `${accuracy}%` : '–'}</div>
      <div class="stat-label">${accuracy !== null ? 'ketepatan' : 'belum ada data'}</div>
    </div>`;

  // Persentase SELALU tampil (termasuk 0%) — beda dari kartu lain yang memang
  // disembunyikan saat kosong (§4.6): di sini progress-bar-nya sendiri LAH
  // fitur yang diminta, jadi menyembunyikannya di 0% = fitur kelihatan tidak
  // ada sama sekali di profil baru. Tetap non-punitive: 0% dibingkai sebagai
  // ajakan ("ayo mulai"), bukan status kosong yang mencolok.
  const levelProgressHead = `
    <div class="level-progress-head">
      <span class="level-progress-name">${hereLevel ? `${hereLevel.emoji} ${hereLevel.name}` : 'Level kamu'}</span>
      <span class="level-progress-pct">${bossPct}% menuju ${nextLevel ? nextLevel.name : bossLabel(hereLevel)}</span>
    </div>`;
  const levelProgress = `
    ${levelProgressHead}
    <div class="progress-track" role="img" aria-label="${bossPct}% menuju ${bossLabel(hereLevel)}">
      <div class="progress-fill" style="width:${bossPct}%"></div>
    </div>
    <p class="meta" style="margin-top:8px">${
      levelProgressCaption(hereLevel?.key ?? currentPlayableLevel().key, withDetail)
    }</p>`;

  return `
    <div class="card progress-panel">
      <div class="progress-panel-head">
        <span class="eyebrow">📈 Progresmu</span>
        ${withDetail ? '<button class="ghost-btn slim" type="button" data-action="openRaporDetail">📖 Detail Rapor</button>' : ''}
      </div>
      ${levelProgress}
      <div class="stat-row">${statTiles}</div>
    </div>`;
}

/** Hasil First Placement Test — cuma tampil begitu ada hasil tersimpan.
 *  Angka mentah (correct/total) SENGAJA tidak ditampilkan mentah ke anak
 *  (CLAUDE.md poin 2 — hindari skor sebagai evaluasi) — diterjemahkan ke
 *  bintang, pola reward yang sudah dipakai di seluruh app (PRD §4.6).
 *  Dipakai Beranda & Rapor, sama alasan `buildProgressPanel`. */
function buildPlacementResultCard(): string {
  const { placementTestDone: ptDone, latestPlacementResult: ptResult } = getCachedChildStatus();
  if (ptDone !== true || !ptResult) return '';
  const ratio = ptResult.totalItems > 0 ? ptResult.totalCorrect / ptResult.totalItems : 0;
  const stars = ratio >= 0.8 ? 3 : ratio >= 0.5 ? 2 : 1;
  const starRow = '⭐'.repeat(stars) + '☆'.repeat(3 - stars);
  const levelLbl = placementGame.LEVEL_LABEL[ptResult.levelRecommended] ?? ptResult.levelRecommended;
  return `
    <div class="card">
      <span class="eyebrow">🎈 Hasil Placement Test</span>
      <div class="card-title" style="margin:4px 0 2px">${levelLbl}</div>
      <div style="font-size:20px;letter-spacing:2px;margin:6px 0" aria-hidden="true">${starRow}</div>
      <p class="meta">Level awal anak dari placement test.</p>
    </div>`;
}

/** 🏰 Hasil Tantangan Raja per level (tes akhir level, `materi/test_level.md`
 *  §5.5, pola Statement of Results Cambridge) — bintang terbaik tiap babak +
 *  status lolos. Disembunyikan kalau belum pernah dicoba. */
/** Kalimat "Anak bisa…" (orang tua) per babak yang LOLOS — disarikan dari
 *  deskriptor CEFR young learners & can-do Cambridge YLE per jenjang
 *  (`materi/test_level.md` §5.5). Tier sama dgn pembeda level materi. */
const CAN_DO: Record<'dasar' | 'menengah' | 'lanjut', Record<SkillKey, string>> = {
  dasar: {
    vocabulary: 'Kenal kata sehari-hari dari gambar & suara',
    listening: 'Paham kalimat sangat pendek yang diucapkan',
    reading: 'Bisa membaca kata & kalimat pendek bergambar',
    grammar: 'Bisa membedakan pola dasar (satu/banyak, ya/tidak)',
    speaking: 'Berani menirukan kata & frasa pendek',
  },
  menengah: {
    vocabulary: 'Paham arti kata topik sehari-hari, Inggris ↔ Indonesia',
    listening: 'Paham cerita & percakapan pendek sehari-hari',
    reading: 'Bisa membaca teks pendek & menemukan informasinya',
    grammar: 'Bisa memilih bentuk kata yang tepat dalam kalimat',
    speaking: 'Bisa menjawab pertanyaan pendek dengan kalimat',
  },
  lanjut: {
    vocabulary: 'Paham kosakata sekolah, hobi & pendapat',
    listening: 'Paham inti & detail percakapan, termasuk menyimpulkan',
    reading: 'Bisa membaca teks panjang & menilai pernyataan',
    grammar: 'Bisa memakai pola kalimat lanjutan',
    speaking: 'Bisa menyampaikan pendapat singkat dengan alasan',
  },
};
function canDoTier(level: LevelKey): 'dasar' | 'menengah' | 'lanjut' {
  return level === 'little-stars' || level === 'starter' ? 'dasar' : level === 'explorer' || level === 'adventurer' ? 'menengah' : 'lanjut';
}

function buildBossResultCard(): string {
  const levels = LEVELS.filter((l) => bossTestLevels().includes(l.key) && Object.keys(getBossTest(l.key).best).length > 0);
  if (!levels.length) return '';
  const blocks = levels
    .map((l) => {
      const t = getBossTest(l.key);
      const rows = (['vocabulary', 'listening', 'reading', 'grammar', 'speaking'] as SkillKey[])
        .map((k) => {
          const pct = t.best[k];
          const status = k === 'speaking' ? 'bonus' : t.passed.includes(k) ? '✅ lolos' : pct === undefined ? 'belum dicoba' : '💪 latihan lagi';
          const canDo = t.passed.includes(k) ? `<span class="can-do">${CAN_DO[canDoTier(l.key)][k]}</span>` : '';
          return `<li><span class="stat-list-ic" aria-hidden="true">${SKILL_META[k].emoji}</span><span class="stat-list-label">${SKILL_META[k].label} <span class="meta">· ${status}</span>${canDo}</span><span class="stat-list-value">${pct === undefined ? '–' : skillStarsHtml(pct)}</span></li>`;
        })
        .join('');
      const last = t.history[t.history.length - 1];
      const when = last ? new Date(last.at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) : '';
      return `<div class="card-title" style="margin:10px 0 0">${l.emoji} ${l.name}${isBossCleared(l.key) ? ' · 👑 ditaklukkan' : ''}${when ? ` <span class="meta">(${when})</span>` : ''}</div><ul class="stat-list">${rows}</ul>`;
    })
    .join('');
  return `<div class="card"><span class="eyebrow">🏰 Hasil Tantangan Raja</span>${blocks}<p class="meta" style="margin-top:8px">Naik level kalau 4 babak utama benar 80%. Speaking = bonus.</p></div>`;
}

/**
 * Papan Peringkat XP — permintaan user, revisi dari keputusan lama PRD §4.6/
 * §13 ("tanpa leaderboard") yang sekarang dibolehkan KHUSUS karena progres
 * sudah tersimpan di database & login sudah jadi gerbang wajib (lihat
 * `account.ts` `refreshLeaderboard`). Filter kid-friendly tetap berlaku
 * penuh: dianonimkan total (cuma avatar hewan + XP, TANPA nama), TANPA
 * highlight "posisi kamu" (angka peringkat eksplisit per anak sengaja tidak
 * dihitung/ditampilkan — cuma daftar top 10, semacam "hall of fame" yang
 * aspirasional, bukan pembanding langsung anak-vs-anak). Dipakai Beranda &
 * Rapor, sama pola dgn `buildProgressPanel`/`buildDailyCard`.
 *
 * Disembunyikan total (return '') kalau belum ada data ATAU listnya kosong
 * (belum ada anak lain yang mulai) — state kosong tidak ditampilkan
 * mencolok (PRD §4.6), bukan kartu "papan peringkat kosong" yang aneh.
 */
function buildLeaderboardCard(): string {
  const top = getCachedLeaderboard();
  if (!top || top.length === 0) return '';

  const medal = ['🥇', '🥈', '🥉'];
  const rows = top
    .map((entry, i) => {
      const rankMark = medal[i] ?? `${i + 1}`;
      return `
        <div class="leaderboard-row">
          <span class="leaderboard-rank" aria-hidden="true">${rankMark}</span>
          <span class="leaderboard-avatar" aria-hidden="true">${entry.avatar}</span>
          <span class="leaderboard-xp">${entry.xp} XP</span>
        </div>`;
    })
    .join('');

  return `
    <div class="card">
      <span class="eyebrow">🏆 Papan Peringkat</span>
      <div class="leaderboard-list" style="margin-top:10px">${rows}</div>
      <p class="meta" style="margin-top:8px">XP tertinggi semua pemain, dianonimkan (tanpa nama).</p>
    </div>`;
}

/**
 * Kartu "Hari Ini" Beranda (permintaan user — pengganti kartu "Main lagi"
 * yang dobel dgn kartu "Yuk Lanjutkan" Menu Belajar). SATU ajakan, dipilih
 * urut prioritas dari data yang SUDAH ada (tanpa field Store baru):
 * 1. First Placement Test belum dikerjakan (akun login) — gantikan kartu
 *    nudge lama di kolom samping peta;
 * 2. Tantangan Raja level sekarang sudah dimulai tapi belum lolos semua babak;
 * 3. topik yang masih sering meleset (`computeInsights().weakTopics`);
 * 4. belum pernah belajar → Menu Belajar; selain itu → Game Hub.
 * Lanjut materi TIDAK di sini — itu tugas kartu atas Menu Belajar.
 */
type TodayMission =
  | { kind: 'placement' }
  | { kind: 'raja'; level: LevelKey; passed: number }
  | { kind: 'weak'; skill: SkillKey; topicIndex: number; title: string; level: LevelKey }
  | { kind: 'start' }
  | { kind: 'game' };

function pickTodayMission(): TodayMission {
  if (getCachedChildStatus().placementTestDone === false) return { kind: 'placement' };

  const hereKey = currentStopKey(levelUnlockMap(LEVELS));
  if (hereKey && !isBossCleared(hereKey)) {
    const test = getBossTest(hereKey);
    const started = test.passed.length > 0 || Object.keys(test.runs).length > 0;
    if (started) {
      const passed = OBJECTIVE_SKILLS.filter((k) => test.passed.includes(k)).length;
      if (passed < OBJECTIVE_SKILLS.length) return { kind: 'raja', level: hereKey, passed };
    }
  }

  const level = currentPlayableLevel().key;
  for (const sig of computeInsights().weakTopics) {
    const list = topicsForSkill(sig.skill, level);
    const idx = list.findIndex((t) => t.id === sig.topicId);
    if (idx >= 0) return { kind: 'weak', skill: sig.skill, topicIndex: idx, title: list[idx].title, level };
  }

  return validLast() ? { kind: 'game' } : { kind: 'start' };
}

function buildTodayCard(m: TodayMission): string {
  const week = getWeekActivity();
  const activeCount = week.filter((d) => d.active).length;
  const dots = week
    .map((d) => `<span class="today-dot${d.active ? ' is-active' : ''}${d.isToday ? ' is-today' : ''}">${d.label}</span>`)
    .join('');

  let title: string;
  let sub: string;
  let cta: string;
  let art: string;
  let accent = '';
  if (m.kind === 'placement') {
    title = 'Cari titik mulaimu dulu, yuk!';
    sub = '4 kegiatan seru, santai tanpa waktu.';
    cta = 'Coba Placement Test';
    art = '🎈';
  } else if (m.kind === 'raja') {
    title = `Tantangan ${BOSS_NAME[m.level]} menunggu`;
    sub = `${m.passed} dari ${OBJECTIVE_SKILLS.length} babak sudah lolos`;
    cta = 'Lanjut Tantangan';
    art = BOSS_AVATAR[m.level];
  } else if (m.kind === 'weak') {
    title = `Misi kilat: ${m.title}`;
    sub = `${SKILL_META[m.skill].label} · latihan sebentar biar makin lancar`;
    cta = 'Latihan Yuk';
    art = SKILL_META[m.skill].emoji;
    accent = ` style="--spark-accent:${SKILL_META[m.skill].accent}"`;
  } else if (m.kind === 'start') {
    title = 'Yuk kenalan sama kata baru';
    sub = 'Dengar, tebak, ucapkan, lalu susun.';
    cta = 'Mulai Belajar';
    art = '🦁';
  } else {
    title = 'Waktunya main!';
    sub = 'Taklukkan markas Raja di Game Hub.';
    cta = 'Main Game';
    art = '🎮';
  }

  return `
    <article class="spark compact today-card"${accent}>
      <span class="cloud c1" aria-hidden="true">${CLOUD}</span><span class="cloud c2" aria-hidden="true">${CLOUD}</span>${HILLS_SHORE}
      <div class="spark-body">
        <span class="eyebrow">Hari Ini</span>
        <h2 class="spark-title">${title}</h2>
        <p class="spark-sub">${sub}</p>
        <button class="cta" type="button" data-action="todayMission">${ICON_PLAY} ${cta}</button>
        <div class="today-week" aria-label="${activeCount} dari 7 hari terakhir kamu main">${dots}</div>
      </div>
      <div class="spark-art" aria-hidden="true"><span class="mascot-idle">${art}</span></div>
    </article>`;
}

function runTodayMission(m: TodayMission): void {
  if (m.kind === 'placement') return go('placementTest');
  if (m.kind === 'raja') return go('boss', { bossLevel: m.level });
  // `viewLevel` dipin ke level asli anak — `topicIndex` dihitung thd topik
  // level itu (alasan sama `practiceInsightTopic` di Rapor).
  if (m.kind === 'weak') return go('activity', { skillKey: m.skill, topicIndex: m.topicIndex, step: 1, viewLevel: m.level });
  if (m.kind === 'start') return go('menu', { viewLevel: null });
  go('game');
}

/**
 * Beranda = kartu "Main Lagi" + Peta Petualangan LENGKAP sekaligus (permintaan
 * user) — dulu Peta Level (`renderLevels`) layar terpisah yang dibuka dari
 * strip mini-trail di sini; sekarang peta penuh ITU SENDIRI isi utama Beranda,
 * strip mini-trail & panel "Progresmu"/statistik (XP/streak/ketepatan/
 * bintang/Progres Harian/Hasil Placement Test/Papan Peringkat) dihapus dari
 * sini karena semuanya SUDAH ada lengkap di tab Rapor (`buildProgressPanel`
 * dkk, `renderRapor`) — Beranda tidak perlu lagi menduplikasinya, cukup jadi
 * titik "lanjut main" + "lihat & buka markas". Screen 'levels' sudah
 * dihapus total (bukan lagi alias) — semua pemanggil lama sekarang `go('home')`.
 */
function renderHome(): void {
  // Kartu "Hari Ini" (permintaan user) — pengganti kartu "Main lagi" yang
  // dobel dgn kartu "Yuk Lanjutkan" Menu Belajar. Isinya berubah sesuai
  // kondisi anak (`pickTodayMission`), bukan lanjut materi lagi.
  const today = pickTodayMission();
  const spark = buildTodayCard(today);

  // --- Peta Petualangan (dulu `renderLevels`, isi PERSIS sama) ---
  const unlocked = levelUnlockMap(LEVELS);
  const hereKey = currentStopKey(unlocked);
  const hereIdx = LEVELS.findIndex((l) => l.key === hereKey);
  const hereLevel = hereIdx >= 0 ? LEVELS[hereIdx] : null;
  const nextLevel = hereIdx >= 0 ? LEVELS[hereIdx + 1] : undefined;

  // Tantangan Bos sekarang SEQUENTIAL (revisi PRD §12.1/§16) — skip-ahead
  // bebas ke level manapun dihapus. Cuma level terkunci PERTAMA (tepat
  // setelah batas terbuka) yang boleh ditantang duluan; level setelahnya
  // mati sampai yang di depannya ditaklukkan dulu.
  const firstLockedIndex = LEVELS.findIndex((l) => !unlocked[l.key]);

  const mapBossPct = hereLevel ? levelProgressPct(hereLevel.key) : 0;
  // Selalu tampil (termasuk 0%) selama sudah ada perhentian aktif — heading
  // nama level + persentase besar di atas bar, supaya bar-nya jelas kebaca,
  // bukan garis dekoratif.
  const mapProgress = hereLevel
    ? `
        <div class="level-progress-head" style="max-width:44ch;position:relative;z-index:1">
          <span class="level-progress-name">${hereLevel.emoji} ${hereLevel.name}</span>
          <span class="level-progress-pct">${mapBossPct}% menuju ${nextLevel ? nextLevel.name : bossLabel(hereLevel)}</span>
        </div>
        <div class="progress-track" role="img" aria-label="${mapBossPct}% menuju ${bossLabel(hereLevel)}" style="margin-top:10px;max-width:44ch">
          <div class="progress-fill" style="width:${mapBossPct}%"></div>
        </div>
        <p class="meta" style="margin-top:8px;position:relative;z-index:1">${
          levelProgressCaption(hereLevel!.key)
        }</p>`
    : '';

  const stops = LEVELS.map((lvl, i) => {
    const cleared = isBossCleared(lvl.key);
    const isUnlocked = !!unlocked[lvl.key];
    const here = lvl.key === hereKey;
    const place = placeFor(lvl.key);
    const cefrBadge = lvl.cefr ? `<span class="tag">${lvl.cefr}</span>` : '';

    const statusChip = cleared
      ? `<span class="tag ok">${ICON_CHECK} ${BOSS_NAME[lvl.key]} ditaklukkan</span>`
      : isUnlocked && lvl.hasContent
        ? `<span class="tag accent">Terbuka</span>`
        : isUnlocked
          ? `<span class="tag">Terbuka · materi segera hadir</span>`
          : `<span class="tag">${ICON_LOCK} Terkunci</span>`;

    let actions: string;
    if (lvl.hasContent && isUnlocked) {
      actions = `
        <button class="primary-btn" type="button" data-action="openMenuFromLevels" data-payload="${lvl.key}">🧭 Yuk Petualang</button>
        <button class="ghost-btn" type="button" data-action="openBossFromLevels" data-payload="${lvl.key}">${BOSS_AVATAR[lvl.key]} ${cleared ? 'Main Lagi' : 'Coba Tantangan'}</button>`;
    } else if (isUnlocked) {
      // Terbuka tapi materinya belum ada (`hasContent:false`). Dulu cuma teks
      // polos tanpa tombol — kartunya kelihatan setengah jadi, padahal sejak
      // `currentStopKey` berjangkar ke hasil placement test, perhentian
      // seperti ini bisa jadi tempat "Kamu di sini" anak yang SEBENARNYA
      // (mis. rekomendasi Adventurer). Tombolnya nyata & bisa di-tap, tapi
      // mendaratnya di layar placeholder yang jujur (`renderLevelSoon`) —
      // bukan materi palsu & bukan tombol mati (content.ts: "placeholder
      // jujur, bukan link mati atau konten palsu"; CLAUDE.md: link ke fitur
      // yang belum ada = navigasi bohong).
      actions = `
        <button class="ghost-btn" type="button" data-action="openSoonFromLevels" data-payload="${lvl.key}">🚧 Intip Markas Ini</button>
        <p class="meta">Sudah terbuka! Materinya masih disiapkan, tunggu ya.</p>`;
    } else if (i === firstLockedIndex) {
      // Level terkunci PERTAMA (persis setelah batas terbuka) — satu-satunya
      // yang boleh ditantang duluan. Bos di sini berfungsi sebagai uji
      // kemampuan umum (mirip placement test) kalau level ini sendiri belum
      // punya materi, jadi tetap bisa dicoba pakai soal dari materi yang ada.
      actions = `
        <button class="ghost-btn" type="button" data-action="openBossFromLevels" data-payload="${lvl.key}">${BOSS_AVATAR[lvl.key]} Coba Tantangan Duluan</button>
        <p class="meta">${
          lvl.hasContent
            ? 'Atau taklukkan dulu Raja level sebelumnya — otomatis kebuka.'
            : `Materi lengkap level ini belum ada, tapi Tantangan ${BOSS_NAME[lvl.key]} tetap bisa dicoba sebagai uji kemampuan umum.`
        }</p>`;
    } else {
      // Berurutan (PRD §12.1/§16, direvisi) — level lebih jauh dari batas
      // terbuka tidak bisa dilompati, walau level di depannya bisa. Taklukkan
      // dulu Bos level sebelumnya (atau placement test yang merekomendasikan
      // sejauh ini, lihat §16) baru tombol ini hidup.
      actions = `
        <button class="ghost-btn" type="button" disabled aria-disabled="true">${ICON_LOCK} Raja Terkunci</button>
        <p class="meta">Taklukkan dulu Raja level sebelumnya secara berurutan — atau coba Placement Test di Pengaturan.</p>`;
    }

    // Stempel di bahu medali: mango+centang kalau bos sudah ditaklukkan, pasir
    // redup+gembok kalau masih tersegel, kosong kalau sedang terbuka.
    const stamp = cleared
      ? `<span class="trail-stamp" aria-hidden="true">${ICON_CHECK}</span>`
      : isUnlocked
        ? ''
        : `<span class="trail-stamp locked" aria-hidden="true">${ICON_LOCK}</span>`;

    const stateClass = [cleared ? 'is-cleared' : '', isUnlocked ? 'is-open' : 'is-locked', here ? 'is-here' : '']
      .filter(Boolean)
      .join(' ');

    // Jejak kaki berkelok bergantian kiri-kanan supaya jalurnya terbaca sebagai
    // rute yang berliku, bukan garis timeline lurus.
    const bend = i % 2 === 0 ? TRAIL_BEND_RIGHT : TRAIL_BEND_LEFT;

    return `
      <li class="trail-stop ${place.cls} ${stateClass}">
        <div class="trail-scene" aria-hidden="true">${place.hills}</div>
        <div class="trail-rail">
          ${bend}
          <span class="trail-medallion" aria-hidden="true"><span>${lvl.emoji}</span>${stamp}</span>
          ${here ? `<span class="trail-you mascot-idle" aria-hidden="true">🦁</span>` : ''}
        </div>
        <div class="trail-card">
          <span class="trail-place">🏰 Markas ${BOSS_NAME[lvl.key]}</span>
          <div class="trail-card-head">
            <div class="trail-card-txt">
              <h3>${lvl.name}${cefrBadge}${here ? ' <span class="tag accent">Kamu di sini</span>' : ''}</h3>
              <div class="trail-meta"><span class="meta">${lvl.age}</span>${statusChip}</div>
            </div>
            <span class="trail-boss" aria-hidden="true">${BOSS_AVATAR[lvl.key]}</span>
          </div>
          <div class="trail-actions">${actions}</div>
        </div>
      </li>`;
  }).join('');

  root.innerHTML = `
    ${spark}

    <section class="two-col" style="margin-top:var(--s5)">
      <div class="map-board">
        <div class="map-sky">
          <span class="map-sun" aria-hidden="true"></span>
          <span class="cloud c1" aria-hidden="true">${CLOUD}</span>
          <span class="cloud c2" aria-hidden="true">${CLOUD}</span>
          <h2>Jalur Petualangan</h2>
          <p>Jalan santai, nggak ada batas waktu.</p>
          ${mapProgress}
        </div>
        <ol class="trail">${stops}</ol>
      </div>

      <aside class="stack">
        <div class="card">
          <span class="eyebrow">Tanda di peta</span>
          <ul class="map-legend" style="margin-top:12px">
            <li><span class="legend-dot is-cleared" aria-hidden="true">${ICON_CHECK}</span>Raja-nya sudah kamu taklukkan</li>
            <li><span class="legend-dot" aria-hidden="true">🧭</span>Terbuka — boleh dimainkan sekarang</li>
            <li><span class="legend-dot is-locked" aria-hidden="true">${ICON_LOCK}</span>Masih tersegel</li>
          </ul>
          <p class="meta" style="margin-top:12px">Singa 🦁 menandai markasmu sekarang.</p>
        </div>
        <div class="card note-card">
          <div class="card-title">Mau lompat lebih jauh?</div>
          <p>Tantangan Raja markas berikutnya (yang paling dekat) boleh langsung dicoba tanpa nunggu — tapi markas setelahnya tetap harus berurutan. Mau lompat lebih jauh lagi? Coba Placement Test di Pengaturan.</p>
        </div>
      </aside>
    </section>

    ${
      hereLevel && LEVEL_CAMBRIDGE_REF[hereLevel.key]
        ? `<p class="meta" style="margin-top:var(--s3)">Catatan: level ini berdasarkan ${LEVEL_CAMBRIDGE_REF[hereLevel.key]}.</p>`
        : ''
    }
  `;

  setHandlers({
    openMenu: () => go('menu', { viewLevel: null }),
    openPlacementTest: () => go('placementTest'),
    todayMission: () => runTodayMission(today),
    openMenuFromLevels: (payload) => {
      setBrowseLevel(payload as LevelKey);
      go('menu', { viewLevel: payload as LevelKey });
    },
    openBossFromLevels: (payload) => go('boss', { bossLevel: payload as LevelKey }),
    openSoonFromLevels: (payload) => go('levelSoon', { soonLevel: payload as LevelKey }),
  });
}

/* ------------------------------------------------------------------ rapor -- */

/**
 * Rapor — laporan progres LENGKAP buat orang tua (beda dari ringkasan cepat
 * di Beranda): panel Progresmu yang SAMA (`buildProgressPanel`, satu sumber
 * kebenaran, angkanya tidak pernah beda dari Beranda) + breakdown skor PER
 * SKILL (baru, belum ada di Beranda) + Progres Harian + hasil Placement
 * Test. Menepati janji homepage marketing ("📊 Progresmu (Rapor Ringkas)" —
 * `LANDING_FEATURES`). Skor per skill dihitung dari `topicFinished()` yang
 * sama dipakai badge "selesai" Menu Belajar (`renderMenu`), supaya angkanya
 * konsisten di semua layar — TANPA rasio benar/salah mentah (CLAUDE.md poin
 * 2), murni jumlah materi tuntas.
 *
 * Skor per skill ditampilkan sbg 1–5 BINTANG (`skillStarsHtml`), BUKAN %
 * mentah — riset kompetitor/lembaga (Cambridge YLE: skor per skill jadi 1–5
 * shield, TANPA angka pass/fail; Khan Academy Kids: fraksi+badge, bukan %)
 * konsisten menghindari angka mentah sbg "nilai ujian" ke orang tua. Dipakai
 * BINTANG (⭐/☆), bukan lencana/shield baru — supaya tetap 1 simbol reward
 * yang sama dgn "Bintang kamu" Beranda & bintang Hasil Placement Test
 * (CLAUDE.md/PRD §4.6: reward pakai bintang, satu bahasa visual, bukan
 * menambah token baru yang bersaing makna). Menu Belajar (`renderMenu`
 * `.skill-pct`) SENGAJA TIDAK ikut diubah — badge % di sana konteksnya
 * navigasi/fungsional ("berapa lagi tersisa"), bukan laporan ke orang tua,
 * jadi angka presisi masih lebih berguna di sana.
 */
/** Bintang 0–5 dari persentase — tiap 20% = 1 bintang, dibulatkan. */
function skillStarCount(pct: number): number {
  return Math.max(0, Math.min(5, Math.round(pct / 20)));
}

function skillStarsHtml(skillPct: number): string {
  const stars = skillStarCount(skillPct);
  return '⭐'.repeat(stars) + '☆'.repeat(5 - stars);
}

/**
 * 1 baris "materi + tombol aksi" dipakai KEDUA insight card di bawah
 * (Kekuatan Sekarang/Misi Berikutnya) — reuse `.topic-card`/`.go` (CSS yang
 * sama dgn daftar materi Menu Belajar, `renderTopics`), TAPI beda dari sana:
 * di sini SELURUH div `.topic-card` SENGAJA BUKAN tombol (tanpa role/
 * tabindex/data-action di kartunya) — cuma `<button class="go">` di dalamnya
 * yang bisa diklik. Ini fix langsung dari keluhan user ("kenapa di rapor
 * ketika di klik masuk tab belajar") thd versi SEBELUMNYA (kartu Skor Tiap
 * Skill yg SELURUH kartunya jadi tombol navigasi) — Rapor sekarang defaultnya
 * MURNI tampilan hasil, navigasi keluar cuma lewat tombol yg jelas labelnya.
 * `kind` nentuin tujuan step: 'weak' → Latihan Inti (step 1, paling relevan
 * buat "coba lagi"), 'strong' → Tantangan (step 2, tantangan asah biar tetap
 * tajam) — dua tujuan step BEDA sesuai maksud kartunya, bukan asal sama.
 */
function insightTopicRowHtml(sig: TopicSignal, level: LevelKey, kind: 'weak' | 'strong'): string {
  const list = topicsForSkill(sig.skill, level);
  const idx = list.findIndex((t) => t.id === sig.topicId);
  if (idx < 0) return ''; // topik dari level/skill yg sudah tidak ada lagi di sini — lewati diam-diam
  const topic = list[idx];
  const s = SKILL_META[sig.skill];
  const action = kind === 'weak' ? 'practiceInsightTopic' : 'reviewInsightTopic';
  const label = kind === 'weak' ? 'Latihan Yuk' : 'Uji Lagi';
  const sub = kind === 'weak' ? `${s.label} · masih sering meleset` : `${s.label} · sudah lancar`;
  return `
    <div class="topic-card">
      <div class="num" aria-hidden="true" style="background:${s.accentBg};color:${s.accent}">${s.emoji}</div>
      <div class="info">
        <b>${topic.title}</b>
        <span>${sub}</span>
      </div>
      <button class="go" type="button" data-action="${action}" data-payload="${sig.skill}|${idx}">${label} →</button>
    </div>`;
}

/**
 * Rapor — laporan progres LENGKAP buat orang tua (beda dari ringkasan cepat
 * di Beranda): panel Progresmu (`buildProgressPanel`) + Stats Singkat (soal
 * dijawab/kata dikuasai — BARU, lebih konkret drpd XP/streak) + Skor Tiap
 * Skill (bintang per skill) + **Kekuatan Sekarang** / **Misi Berikutnya**
 * (BARU — topik SPESIFIK yg sudah mantap vs masih perlu dilatih, `computeInsights`
 * di progress.ts, DERIVED dari `SlotState.n`/`w`/`ir` yg sudah dicatat tiap
 * soal dijawab — bukan cuma "sudah dicoba/belum" spt Skor Tiap Skill, tapi
 * "seberapa sering meleset") + Kata yang Masih Dilatih (kata/kalimat spesifik,
 * BARU) + Progres Harian + Hasil Placement Test + Papan Peringkat.
 *
 * Permintaan user: "analisis isi rapor kompetitor... dikemas konsep
 * petualangan... buat halaman rapor yang bagus dimana orang tua bisa tau
 * performa anak, kelemahan anak, kelebihan anak, apa yang perlu ditingkatkan,
 * apa yang perlu dipertahankan" — 4 pertanyaan itu dijawab literal: kelebihan
 * = Kekuatan Sekarang, kelemahan/tingkatkan = Misi Berikutnya+Kata yang Masih
 * Dilatih, pertahankan = framing "Uji Lagi" di kartu Kekuatan (bukan cuma
 * dipajang lalu dilupakan). SEMUA non-punitive (CLAUDE.md poin 2) — istilah
 * "kelemahan"/"salah"/"gagal" TIDAK PERNAH dipakai di teks yg tampil, diganti
 * "masih suka kepeleset"/"perlu dilatih lagi", & threshold `computeInsights`
 * sengaja tidak agresif (min 2-3 percobaan dulu) spy 1x kebetulan salah tidak
 * langsung dilaporkan sbg "kelemahan" ke orang tua.
 */
function renderRapor(): void {
  const level = currentPlayableLevel();
  const insights = computeInsights();
  const tier = canDoTier(level.key);
  const skills = visibleSkillKeys(level.key);
  // Skill objektif (bukan mic) dgn data cukup — dasar ringkasan, kesiapan
  // Tantangan Raja & kalimat "Anak bisa…". Speaking tidak ikut: skornya
  // dari mic (ASR bisa salah dengar), beda jenis angka.
  const enoughData = (k: SkillKey) => k !== 'speaking' && insights.skillAccuracy[k] !== null && insights.skillAttempts[k] >= 10;

  /* ---------- 1. Sekilas: ringkasan kalimat + Minggu Ini ---------- */

  // Pola rapor Kurikulum Merdeka (capaian tertinggi & terendah) + Statement
  // of Results Cambridge (kekuatan, yang bisa ditingkatkan, kesiapan naik:
  // 4–5 perisai di tiap skill).
  const ranked = skills
    .filter(enoughData)
    .map((k) => ({ k, acc: insights.skillAccuracy[k] as number }))
    .sort((a, b) => b.acc - a.acc);
  const best = ranked[0];
  const low = ranked.length > 1 ? ranked[ranked.length - 1] : undefined;
  const skillName = (k: SkillKey) => `<b>${SKILL_META[k].emoji} ${SKILL_META[k].label}</b>`;
  const sentences: string[] = [];
  if (best) sentences.push(`Paling kuat di ${skillName(best.k)} (${best.acc}%).`);
  if (best && low && low.acc < best.acc) sentences.push(`Paling perlu latihan: ${skillName(low.k)} (${low.acc}%).`);
  const rajaLevel = currentStopKey(levelUnlockMap(LEVELS)) ?? level.key;
  if (!isBossCleared(rajaLevel)) {
    const objective = skills.filter((k) => k !== 'speaking');
    const readyCount = objective.filter((k) => enoughData(k) && skillStarCount(insights.skillAccuracy[k] as number) >= 4).length;
    if (objective.length && readyCount === objective.length) {
      sentences.push(`Sudah siap mencoba <b>Tantangan ${BOSS_NAME[rajaLevel]}</b> 🏰.`);
    } else if (ranked.length) {
      sentences.push(`Menuju Tantangan ${BOSS_NAME[rajaLevel]}: ${readyCount} dari ${objective.length} skill sudah 4–5 bintang.`);
    }
  }
  const summaryHtml = sentences.length
    ? `<p class="rapor-summary">${sentences.join(' ')}</p>`
    : '<p class="rapor-summary">Ringkasan muncul setelah anak menjawab minimal 10 soal di satu skill.</p>';

  const week = getWeekActivity();
  const weekDays = week.filter((d) => d.active).length;
  const trend = getWeeklyTrend(4);
  const lastWeek = trend[trend.length - 2];
  const dayChips = week
    .map((d) => `<span class="day-chip ${d.active ? 'is-active' : ''} ${d.isToday ? 'is-today' : ''}">${d.label}</span>`)
    .join('');
  // Catatan waktu layar yang lembut (WHO: usia 3–4 th ≤ 1 jam layar/hari) —
  // cuma utk anak Little Stars (usia 3–5) & rata-rata > 60 menit. Informasi
  // untuk orang tua, bukan batasan otomatis & tanpa nada menghukum.
  const avgDaily = getAvgDailyMinutes();
  const screenNote =
    currentLevelMeta().key === 'little-stars' && avgDaily !== null && avgDaily > SCREEN_NOTE_MINUTES
      ? `<p class="screen-note">🌤️ Rata-rata belajar ${avgDaily} menit/hari. Untuk usia 3–5 tahun, WHO menyarankan waktu layar maksimal 1 jam sehari. Sesekali selingi dengan main di luar layar, ya.</p>`
      : '';
  const sekilasCard = `
    <div class="card">
      <span class="eyebrow">📝 Ringkasan untuk Orang Tua</span>
      ${summaryHtml}
      <span class="eyebrow sub" style="margin-top:14px">🗓️ Minggu Ini</span>
      <div class="day-row" style="margin-top:8px" aria-label="Hari anak belajar dalam 7 hari terakhir">${dayChips}</div>
      <div class="week-stats">
        <span><b>${weekDays}</b>/7 hari</span>
        <span><b>${getWeekMinutes()}</b> menit (termasuk game)</span>
        <span><b>${insights.weekAnswered}</b> soal belajar</span>
      </div>
      ${lastWeek && (lastWeek.minutes > 0 || lastWeek.answers > 0) ? `<p class="meta" style="margin-top:4px">7 hari sebelumnya: ${lastWeek.minutes} menit${lastWeek.accuracy === null ? '' : ` · ketepatan ${lastWeek.accuracy}%`}</p>` : ''}
      ${screenNote}
    </div>`;

  /* ---------- 2. Kemampuan: daftar skill + Tantangan Raja ---------- */

  // Bintang = KEMAMPUAN (ketepatan, pola perisai Cambridge), materi tuntas
  // ditulis terpisah. 1 baris per skill (dulu 5 kartu besar).
  const skillRows = skills
    .map((key) => {
      const s = SKILL_META[key];
      const topics = topicsForSkill(key, level.key);
      const doneHere = topics.filter((t) => topicFinished(key, t.id, level.key)).length;
      const acc = insights.skillAccuracy[key];
      const hintPct = insights.hintRatioBySkill[key];
      const parts = [
        acc === null ? 'belum ada jawaban' : key === 'speaking' ? `skor ucapan ${acc}%` : `ketepatan ${acc}%`,
        ...(hintPct === null ? [] : [`💡 ${hintPct}%`]),
        `${doneHere}/${topics.length} materi`,
      ];
      const canDo = enoughData(key) && skillStarCount(acc as number) >= 4 ? `<span class="can-do">✅ ${CAN_DO[tier][key]}</span>` : '';
      return `
        <li>
          <span class="skill-row-ic" style="background:${s.accentBg};color:${s.accent}" aria-hidden="true">${s.emoji}</span>
          <span class="skill-row-body">
            <b>${s.label}</b>
            <span class="meta">${parts.join(' · ')}</span>
            ${canDo}
          </span>
          <span class="skill-stars" aria-label="${acc === null ? 'belum ada bintang' : `${skillStarCount(acc)} dari 5 bintang`}">${acc === null ? '☆☆☆☆☆' : skillStarsHtml(acc)}</span>
        </li>`;
    })
    .join('');
  const skillCard = `
    <div class="card">
      <span class="eyebrow">⭐ Tiap Skill</span>
      <ul class="skill-list">${skillRows || '<li class="meta">Belum ada materi di level ini.</li>'}</ul>
      <p class="meta" style="margin-top:8px">⭐ dari ketepatan jawaban · 💡 = soal yang dikerjakan pakai Petunjuk.</p>
    </div>`;

  // Tren 4 minggu (pola grafik progres Kumon) — 1 baris per 7 hari: bar menit
  // (1 seri, angka ditulis langsung) + kolom ketepatan terpisah. Menit &
  // ketepatan beda satuan → tidak digabung dalam 1 sumbu.
  const maxMin = Math.max(1, ...trend.map((t) => t.minutes));
  const trendRows = trend
    .map((t) => {
      const w = Math.round((t.minutes / maxMin) * 100);
      return `
        <li class="trend-row${t.weeksAgo === 0 ? ' is-now' : ''}">
          <span class="trend-label">${t.weeksAgo === 0 ? '7 hari terakhir' : weekRangeLabel(t.from, t.to)}</span>
          <span class="trend-bar" role="img" aria-label="${t.minutes} menit"><span class="trend-fill" style="width:${w}%"></span></span>
          <span class="trend-min">${t.minutes} mnt</span>
          <span class="trend-acc">${t.accuracy === null ? '–' : `${t.accuracy}%`}</span>
        </li>`;
    })
    .join('');
  const trendCard = trend.some((t) => t.minutes > 0 || t.answers > 0)
    ? `
    <div class="card">
      <span class="eyebrow">📈 Tren 4 Minggu</span>
      <div class="trend-head" aria-hidden="true"><span></span><span>waktu belajar</span><span>ketepatan</span></div>
      <ul class="trend-list">${trendRows}</ul>
    </div>`
    : '';

  /* ---------- 3. Yang Perlu Dilakukan ---------- */

  const weakRows = insights.weakTopics.map((t) => insightTopicRowHtml(t, level.key, 'weak')).join('');
  const strongRows = insights.strongTopics.map((t) => insightTopicRowHtml(t, level.key, 'strong')).join('');
  const wordChips = insights.strugglingWords.length
    ? `<span class="eyebrow sub" style="margin-top:14px">📝 Kata yang masih dilatih</span>
       <div class="word-chips">${insights.strugglingWords.map((w) => `<span class="tag">${SKILL_META[w.skill].emoji} ${escapeHtml(w.ir)}</span>`).join('')}</div>`
    : '';
  const missionCard =
    weakRows || wordChips
      ? `
    <div class="card">
      <span class="eyebrow">🗺️ Misi Berikutnya</span>
      ${weakRows ? `<p class="meta" style="margin-top:2px">Materi yang masih sering meleset — bagus dilatih lagi.</p><div class="topic-grid" style="margin-top:12px">${weakRows}</div>` : ''}
      ${wordChips}
    </div>`
      : '';
  const strengthsCard = strongRows
    ? `
    <div class="card">
      <span class="eyebrow">💪 Kekuatan Sekarang</span>
      <p class="meta" style="margin-top:2px">Materi yang sudah dikuasai — sesekali uji lagi supaya tetap ingat.</p>
      <div class="topic-grid" style="margin-top:12px">${strongRows}</div>
    </div>`
    : '';
  const todoHtml =
    missionCard || strengthsCard
      ? `${missionCard}${strengthsCard}`
      : `<div class="card"><p class="meta">Saran latihan muncul setelah anak menjawab minimal 3 soal di satu materi.</p></div>`;

  /* ---------- 4. Rincian (dilipat) ---------- */

  // 🎮 Hasil Game — bagian sendiri (bukan di Rincian), TERPISAH dari nilai
  // skill: 1 game mencampur beberapa skill & dimainkan bebas. Per game:
  // total tepat/total + 💡 petunjuk + markas paling sulit; buka untuk rincian
  // per markas (`Store.gameMarkas`). Yang belum dimainkan digabung 1 kalimat.
  const played = RAJA_LIST.filter((r) => getGameAccuracy(r.key) !== null);
  const unplayed = RAJA_LIST.filter((r) => getGameAccuracy(r.key) === null);
  const gameBlocks = played
    .map((r) => {
      const acc = getGameAccuracy(r.key) as number;
      const st = getGameStats(r.key);
      const markas = getGameMarkas(r.key);
      const hints = markas.reduce((n, m) => n + m.h, 0);
      const rated = markas.filter((m) => m.t >= 3).map((m) => ({ ...m, pct: Math.round((m.c / m.t) * 100) }));
      const hardest = rated.length > 1 ? [...rated].sort((a, b) => a.pct - b.pct)[0] : undefined;
      const hardestTxt = hardest && hardest.pct < Math.max(...rated.map((m) => m.pct)) ? ` · paling sulit: ${hardest.emoji} ${escapeHtml(hardest.name)} (${hardest.pct}%)` : '';
      const rows = markas
        .filter((m) => m.t > 0 || m.h > 0)
        .map((m) => {
          const pct = m.t > 0 ? Math.round((m.c / m.t) * 100) : null;
          return `<li><span class="stat-list-ic" aria-hidden="true">${m.emoji}</span><span class="stat-list-label">${escapeHtml(m.name)} <span class="meta">· ${m.c}/${m.t} tepat${m.h ? ` · 💡 ${m.h}` : ''}</span></span><span class="skill-stars" aria-label="${pct === null ? 'belum ada bintang' : `${skillStarCount(pct)} dari 5 bintang`}">${pct === null ? '☆☆☆☆☆' : skillStarsHtml(pct)}</span></li>`;
        })
        .join('');
      return `
        <details class="game-result">
          <summary>
            <span class="skill-row-ic" style="background:color-mix(in srgb, ${r.color} 20%, var(--surface-2));color:${r.color}" aria-hidden="true">${RAJA_ICON_EMOJI[r.key]}</span>
            <span class="skill-row-body">
              <b>${r.name}</b>
              <span class="meta">${st.correct}/${st.total} tepat${hints ? ` · 💡 ${hints}x` : ''}${hardestTxt}</span>
            </span>
            <span class="skill-stars" aria-label="${skillStarCount(acc)} dari 5 bintang">${skillStarsHtml(acc)}</span>
          </summary>
          ${rows ? `<ul class="stat-list">${rows}</ul>` : '<p class="meta game-result-empty">Rincian per markas tercatat untuk permainan berikutnya.</p>'}
        </details>`;
    })
    .join('');
  const gameSection = `
    <div class="card">
      <span class="eyebrow">🎮 ${played.length}/${RAJA_LIST.length} game dimainkan</span>
      ${gameBlocks ? `<div class="game-results">${gameBlocks}</div><p class="meta" style="margin-top:8px">Tap game untuk lihat tiap markas. Nilai game terpisah dari nilai skill.</p>` : ''}
      ${unplayed.length ? `<p class="meta" style="margin-top:8px">${played.length ? 'Belum dimainkan' : 'Belum ada game yang dimainkan'}: ${unplayed.map((r) => r.name).join(', ')}.</p>` : ''}
    </div>`;

  // Progres per Level — % modul tuntas tiap level (rumus `finishedTopicsForLevel`).
  const levelRows = LEVELS.filter((l) => l.hasContent)
    .map((l) => {
      const total = totalTopicsForLevel(l.key);
      const pct = total > 0 ? Math.round((finishedTopicsForLevel(l.key) / total) * 100) : 0;
      const here = l.key === rajaLevel ? ' <span class="meta">📍 sekarang</span>' : '';
      return `
        <li class="lvl-row${pct >= 100 ? ' done' : ''}">
          <span class="lvl-name">${l.emoji} ${l.name}${here}${l.cefr ? `<span class="lvl-cefr">${l.cefr}</span>` : ''}</span>
          <span class="lvl-track" role="img" aria-label="${pct}% modul ${l.name} tuntas"><span class="lvl-fill" style="width:${pct}%"></span></span>
          <span class="lvl-pct">${pct}%</span>
        </li>`;
    })
    .join('');
  const levelCard = `
    <div class="card">
      <span class="eyebrow">🗺️ Progres per Level</span>
      <ul class="lvl-list">${levelRows}</ul>
    </div>`;

  const avgMin = getAvgDailyMinutes();
  const finishedAll = LEVELS.filter((l) => l.hasContent).reduce((n, l) => n + finishedTopicsForLevel(l.key), 0);
  const statRowsHtml = [
    { ic: '📘', label: 'Modul tuntas', value: finishedAll },
    { ic: '📝', label: 'Soal dijawab', value: insights.totalAnswered },
    { ic: '🔤', label: 'Kata dikuasai', value: insights.masteredWords },
    { ic: '💡', label: 'Soal dikerjakan pakai Petunjuk', value: insights.hintRatio === null ? '–' : `${insights.hintRatio}%` },
    { ic: '🗓️', label: 'Hari aktif (30 hari terakhir)', value: `${getActiveDaysInLast(30)}/30` },
    { ic: '🔥', label: 'Rekor beruntun', value: `${getLongestStreak()} hari` },
    { ic: '⌛', label: 'Rata-rata belajar / hari', value: avgMin === null ? '–' : `${avgMin} menit` },
    { ic: '🏰', label: 'Markas ditaklukkan', value: getBossClearedCount() },
  ]
    .map((r) => `<li><span class="stat-list-ic" aria-hidden="true">${r.ic}</span><span class="stat-list-label">${r.label}</span><span class="stat-list-value">${r.value}</span></li>`)
    .join('');
  const statsCard = `
    <div class="card">
      <span class="eyebrow">📊 Statistik</span>
      <ul class="stat-list">${statRowsHtml}</ul>
    </div>`;

  // Bagian rincian dilipat; status buka/tutup diingat per perangkat.
  let moreOpen = false;
  try {
    moreOpen = localStorage.getItem(RAPOR_MORE_KEY) === '1';
  } catch {
    /* storage diblokir — default tertutup */
  }

  root.innerHTML = `
    <div class="rapor-layout">
      <section class="rapor-sec full" aria-label="Sekilas">
        <div class="rapor-sekilas">
          ${buildProgressPanel(true, insights)}
          ${sekilasCard}
        </div>
      </section>

      <section class="rapor-sec" aria-labelledby="raporKemampuan">
        <h2 class="rapor-h" id="raporKemampuan">Kemampuan</h2>
        ${skillCard}
        ${trendCard}
        ${buildBossResultCard()}
      </section>

      <section class="rapor-sec" aria-labelledby="raporTodo">
        <h2 class="rapor-h" id="raporTodo">Yang Perlu Dilakukan</h2>
        ${todoHtml}
      </section>

      <section class="rapor-sec full" aria-labelledby="raporGame">
        <h2 class="rapor-h" id="raporGame">Hasil Game</h2>
        ${gameSection}
      </section>

      <section class="rapor-sec full">
        <details class="rapor-more" id="raporMore"${moreOpen ? ' open' : ''}>
          <summary><span>📂 Rincian lainnya</span><span class="meta">progres per level, statistik, placement test, peringkat</span></summary>
          <div class="rapor-more-grid">
            ${levelCard}
            ${statsCard}
            ${buildPlacementResultCard()}
            ${buildLeaderboardCard()}
          </div>
        </details>
      </section>
    </div>
  `;

  root.querySelector<HTMLDetailsElement>('#raporMore')?.addEventListener('toggle', (e) => {
    try {
      localStorage.setItem(RAPOR_MORE_KEY, (e.currentTarget as HTMLDetailsElement).open ? '1' : '0');
    } catch {
      /* diabaikan — cuma kenyamanan tampilan */
    }
  });

  // 🔒 `viewLevel` DIPIN eksplisit ke `currentPlayableLevel()` di KEDUA
  // handler di bawah (BUKAN `null`) — `topicIndex`-nya dihitung `computeInsights()`
  // thd topik `level` (level ASLI anak) di atas, jadi harus menang di atas
  // cache "nempel" `browsingLevel()`, sama alasan `resume` (app.ts).
  setHandlers({
    openRaporDetail: () => go('raporDetail'),
    practiceInsightTopic: (payload) => {
      const [skill, idxStr] = (payload ?? '').split('|');
      go('activity', { skillKey: skill as SkillKey, topicIndex: Number(idxStr), step: 1, viewLevel: level.key });
    },
    reviewInsightTopic: (payload) => {
      const [skill, idxStr] = (payload ?? '').split('|');
      go('activity', { skillKey: skill as SkillKey, topicIndex: Number(idxStr), step: 2, viewLevel: level.key });
    },
  });
}

/** "24–30 Sep" / "28 Sep–4 Okt" dari 2 tanggal YYYY-MM-DD. */
function weekRangeLabel(from: string, to: string): string {
  const d = (iso: string) => new Date(`${iso}T12:00:00`);
  const a = d(from);
  const b = d(to);
  const mon = (x: Date) => x.toLocaleDateString('id-ID', { month: 'short' }).replace('.', '');
  return a.getMonth() === b.getMonth() ? `${a.getDate()}–${b.getDate()} ${mon(b)}` : `${a.getDate()} ${mon(a)}–${b.getDate()} ${mon(b)}`;
}

/** Ambang catatan waktu layar Little Stars (menit/hari), pedoman WHO. */
const SCREEN_NOTE_MINUTES = 60;

/** Status buka/tutup "Rincian lainnya" di Rapor (preferensi perangkat). */
const RAPOR_MORE_KEY = 'inggrisinyuk-kids.rapor-more';

/* -------------------------------------------------------- detail rapor -- */

/** Layar "Detail Rapor" — cuma menjelaskan ATURAN tiap nilai di Rapor (apa
 *  artinya & cara bertambahnya), buat orang tua. Angkanya sendiri tetap di
 *  Rapor; sumber aturannya konstanta/fungsi yang sama (XP_*, getStreak,
 *  getAccuracy, levelProgressPct) supaya teks tidak basi kalau angka berubah. */
function renderRaporDetail(): void {
  const rules: { ic: string; name: string; what: string; how: string }[] = [
    {
      ic: '⚡',
      name: 'XP',
      what: 'Poin semangat belajar. Cuma bisa naik, tidak pernah berkurang.',
      how: `+${XP_MODULE} XP tiap modul selesai · +${XP_BOSS} XP lolos Tantangan Raja · +${XP_FREEPLAY} XP tiap markas game selesai.`,
    },
    {
      ic: '🎯',
      name: 'Ketepatan',
      what: 'Seberapa sering jawaban anak tepat di Vocabulary, Listening, Reading & Grammar. Angka ini gabungan dari ketepatan tiap skill.',
      how: 'Jawaban tepat ÷ semua jawaban × 100%, termasuk tiap "Coba Lagi". Tidak termasuk: jawaban lewat mic (Speaking), game (nilainya di bagian Game), & soal Tantangan Raja.',
    },
    {
      ic: '🔥',
      name: 'Hari beruntun',
      what: 'Berapa hari berturut-turut anak belajar.',
      how: 'Hari dihitung aktif kalau anak dapat XP atau mengerjakan Tantangan Raja. Libur 1 hari tidak memutus; libur 2 hari berturut-turut baru mulai dari awal. Rekor = beruntun terpanjang dalam 60 hari terakhir.',
    },
    {
      ic: '📈',
      name: 'Progres level',
      what: 'Seberapa dekat anak ke level berikutnya.',
      how: '50% dari modul yang tuntas + 50% dari babak Tantangan Raja yang lolos (4 babak). Raja ditaklukkan = 100%.',
    },
    {
      ic: '⭐',
      name: 'Bintang skill',
      what: 'Kemampuan tiap skill belajar, dari ketepatan jawaban (bukan banyaknya materi). Jumlah materi tuntas ditulis terpisah di bawahnya.',
      how: 'Jawaban tepat ÷ semua jawaban di skill itu, lalu tiap 20% = 1 bintang (dibulatkan, maks 5). Speaking: rata-rata skor ucapan terbaik tiap soal (perkiraan dari mic). 4–5 bintang = sudah mantap.',
    },
    {
      ic: '🎮',
      name: 'Hasil Game',
      what: 'Nilai tiap game & tiap markasnya, jumlah Petunjuk yang dibuka, dan markas yang paling sulit.',
      how: 'Bintang = jawaban tepat ÷ semua jawaban di game/markas itu, tiap 20% = 1 bintang (dibulatkan). 💡 = berapa soal yang Petunjuknya dibuka. "Paling sulit" = markas dengan ketepatan terendah (minimal 3 jawaban). Nilai game TIDAK masuk nilai skill, karena 1 game mencampur beberapa skill. Rincian per markas mulai tercatat sejak fitur ini ada.',
    },
    {
      ic: '📘',
      name: 'Modul tuntas & Progres per Level',
      what: 'Modul yang Latihan Inti & Tantangannya sudah dikerjakan semua (100%).',
      how: 'Stats Singkat: jumlah dari semua level. Progres per Level: modul tuntas ÷ semua modul di level itu. Kenalan tidak dihitung.',
    },
    {
      ic: '🔤',
      name: 'Kata dikuasai',
      what: 'Kata Vocabulary yang jawaban terakhirnya tepat.',
      how: 'Kalau sempat meleset lalu diulang dan tepat, tetap dihitung dikuasai.',
    },
    {
      ic: '⏱️',
      name: 'Waktu belajar',
      what: 'Total menit 7 hari terakhir & rata-rata menit di hari anak belajar.',
      how: 'Dihitung hanya saat app terbuka & anak aktif menyentuh layar (diam > 1 menit tidak dihitung). Rata-rata = total menit ÷ hari yang ada catatannya; hari libur tidak ikut membagi. Ikut akun (digabung dari semua perangkat). Untuk Little Stars, muncul catatan kalau rata-rata lebih dari 60 menit/hari (pedoman WHO usia 3–4 tahun: maksimal 1 jam layar sehari).',
    },
    {
      ic: '💡',
      name: 'Pakai Petunjuk',
      what: 'Seberapa sering anak membuka 💡 Petunjuk saat mengerjakan. Makin kecil = makin mandiri. Petunjuk boleh dipakai, bukan kesalahan.',
      how: 'Soal yang Petunjuknya dibuka ÷ semua soal yang sudah dikerjakan × 100%. Dihitung per soal (bukan per percobaan), di Latihan Inti & Tantangan semua skill. Kenalan & "💡 Jawabannya" yang muncul otomatis tidak dihitung.',
    },
    {
      ic: '🗓️',
      name: 'Hari aktif',
      what: 'Berapa hari anak belajar dalam 30 hari terakhir.',
      how: 'Hari dihitung aktif kalau anak dapat XP atau mengerjakan Tantangan Raja.',
    },
    {
      ic: '🗺️',
      name: 'Misi Berikutnya & Kekuatan',
      what: 'Materi yang masih suka meleset vs yang sudah mantap.',
      how: 'Muncul setelah minimal 3 jawaban di materi itu. Meleset ≥ 34% → Misi Berikutnya; ≤ 10% → Kekuatan. Soal ucapan (mic) tidak ikut, karena mic bisa salah dengar.',
    },
    {
      ic: '📝',
      name: 'Ringkasan untuk Orang Tua',
      what: 'Skill terkuat, skill yang paling perlu latihan, dan kesiapan mencoba Tantangan Raja.',
      how: 'Dari ketepatan skill yang punya minimal 10 jawaban. "Siap mencoba Tantangan Raja" kalau semua skill (kecuali Speaking) sudah 4–5 bintang, sama aturan kesiapan Cambridge. Speaking tidak ikut (skornya dari mic).',
    },
    {
      ic: '🗓️',
      name: 'Minggu Ini',
      what: 'Hari belajar, menit belajar (termasuk main game), dan soal belajar yang dikerjakan dalam 7 hari terakhir.',
      how: 'Soal belajar = soal di Menu Belajar (tanpa game), dihitung per soal: soal yang dikerjakan ulang minggu ini tetap 1.',
    },
    {
      ic: '📈',
      name: 'Tren 4 Minggu',
      what: 'Waktu belajar & ketepatan tiap 7 hari, 4 periode terakhir.',
      how: 'Ketepatan = jawaban tepat ÷ semua jawaban di periode itu (Vocabulary, Listening, Reading, Grammar; tanpa mic). Mulai tercatat sejak fitur ini ada, jadi periode lama bisa masih kosong.',
    },
    {
      ic: '🏰',
      name: 'Tantangan Raja',
      what: 'Tes akhir level. Satu-satunya jalan naik level.',
      how: 'Naik level kalau 4 babak utama (Vocabulary, Listening, Reading, Grammar) masing-masing benar ≥ 80% di percobaan pertama. Speaking = babak bonus. Bisa diulang dengan soal baru, tidak pernah turun level.',
    },
  ];

  root.innerHTML = `
    <div class="screen-head">
      <button class="iconbtn" type="button" data-action="backToRapor" aria-label="Kembali ke Rapor">${ICON_BACK}</button>
      <div class="txt">
        <h1>📖 Detail Rapor</h1>
        <p>Arti tiap nilai & cara menghitungnya. Rapor untuk memantau, bukan menghukum.</p>
      </div>
    </div>
    <div class="rule-grid">
      ${rules
        .map(
          (r) => `
        <div class="card rule-card">
          <div class="rule-head"><span class="stat-list-ic" aria-hidden="true">${r.ic}</span><h3>${r.name}</h3></div>
          <p>${r.what}</p>
          <p class="meta rule-how"><b>Cara hitung:</b> ${r.how}</p>
        </div>`
        )
        .join('')}
    </div>
    <div class="card note-card track-note">
      <div class="card-title">📡 Cara Data Dicatat</div>
      <ul>
        <li><b>Tiap jawaban</b> langsung disimpan di perangkat ini. App tetap jalan tanpa internet.</li>
        <li><b>Dikirim ke akun hanya saat 1 bagian selesai</b>: Latihan Inti, tiap tab Tantangan, tiap babak Tantangan Raja, atau 1 markas game. Kenalan saja tidak memicu pengiriman.</li>
        <li>Bagian yang baru setengah jalan tetap aman di perangkat, dan ikut terkirim saat bagian berikutnya selesai.</li>
        <li>Data dari perangkat lain <b>digabung</b>, tidak saling menimpa: nilai tertinggi & soal yang sudah dikerjakan tidak pernah hilang.</li>
        <li>Waktu belajar, tren, dan nilai game juga ikut akun, jadi Rapor sama di HP mana pun setelah bagian berikutnya selesai.</li>
      </ul>
    </div>
  `;
  setHandlers({ backToRapor: () => go('rapor') });
}

/** Catat lama belajar aktif (Rapor "Rata-rata belajar / hari"): tiap 15 dtk,
 *  kalau app tampil & ada sentuhan/ketikan dalam 60 dtk terakhir, tambah
 *  15 dtk ke hari ini. Tab yang dibiarkan terbuka tanpa disentuh tidak ikut. */
const ACTIVE_TICK_MS = 15000;
const ACTIVE_IDLE_MS = 60000;
function startActiveTimer(): void {
  let lastInput = Date.now();
  const bump = () => {
    lastInput = Date.now();
  };
  ['pointerdown', 'keydown', 'touchstart'].forEach((ev) => document.addEventListener(ev, bump, { passive: true, capture: true }));
  setInterval(() => {
    if (document.visibilityState !== 'visible') return;
    if (Date.now() - lastInput > ACTIVE_IDLE_MS) return;
    addActiveTime(ACTIVE_TICK_MS);
  }, ACTIVE_TICK_MS);
}

/**
 * Dropdown pemilih level "nempel" — SATU logic dipakai `renderMenu()` DAN
 * `renderTopics()` (permintaan user: "jadikan satu logic dropdown di halaman
 * belajar dan list materi... biar sync" — dulu 2 salinan nyaris identik yang
 * gampang ketinggalan sinkron kalau salah satu diubah tanpa yang lain).
 * `renderLevelSwitcher()` bikin markup-nya (string kosong kalau cuma 1 markas
 * yang bisa dijelajahi — tidak perlu kontrol apa pun, sama spt sebelumnya).
 * `wireLevelSwitcher()` pasang event `change`-nya SEKALI setelah
 * `root.innerHTML` di-set (pola sama `wireTopicsCompactBar`) — `screen`
 * (parameter) nentuin `go()` balik ke layar mana, plus `setBrowseLevel()`
 * supaya pilihan "nempel" lintas navigasi (lihat `browsingLevel()`).
 */
function renderLevelSwitcher(currentLevel: LevelKey, ariaLabel: string): string {
  const unlockedMap = levelUnlockMap(LEVELS);
  const browsable = LEVELS.filter((l) => l.hasContent && unlockedMap[l.key]);
  if (browsable.length <= 1) return '';
  return `
    <label class="level-select-wrap">
      <span aria-hidden="true">📋</span>
      <select class="level-select" id="levelSwitchSelect" aria-label="${ariaLabel}">
        ${browsable
          .map((l) => `<option value="${l.key}" ${l.key === currentLevel ? 'selected' : ''}>${l.emoji} ${l.name}</option>`)
          .join('')}
      </select>
    </label>`;
}

function wireLevelSwitcher(screen: 'menu' | 'topics'): void {
  const select = root.querySelector<HTMLSelectElement>('#levelSwitchSelect');
  if (!select) return;
  select.addEventListener('change', (e) => {
    const picked = (e.target as HTMLSelectElement).value as LevelKey;
    setBrowseLevel(picked);
    go(screen, { viewLevel: picked });
  });
}

/* ----------------------------------------------------------- menu belajar -- */

function renderMenu(): void {
  const level = browsingLevel();
  // Dropdown 1 baris (permintaan user: pill row 2 baris "boros" & mendorong
  // konten belajar turun) — muncul cuma kalau ada lebih dari 1 markas yang
  // bisa dijelajahi (`renderLevelSwitcher`), konsisten dgn tombol "Buka Menu
  // Belajar" per-level di Peta Level (`renderLevels`).
  const menuLevelHead = renderLevelSwitcher(level.key, 'Pilih level Menu Belajar');
  // Progres keseluruhan lintas SEMUA modul di level ini (permintaan user) —
  // formula SAMA dgn levelProgress Beranda/mapProgress Peta Level
  // (modul tuntas level ini ÷ totalTopicsForLevel level ini), supaya
  // angkanya konsisten di mana pun ditampilkan.
  const doneTotal = finishedTopicsForLevel(level.key);
  const topicsTotal = totalTopicsForLevel(level.key);
  const menuPct = topicsTotal > 0 ? Math.round((doneTotal / topicsTotal) * 100) : 0;
  const progressBar = `
    <div class="spark-progress">
      <div class="spark-progress-track" role="img" aria-label="${menuPct}% seluruh materi ${level.name} sudah dikerjakan">
        <div class="spark-progress-fill" style="width:${menuPct}%"></div>
      </div>
      <span class="spark-progress-label">${doneTotal}/${topicsTotal} materi · ${menuPct}%</span>
    </div>`;

  // SATU kartu ringkas (permintaan user: gabung progress + lanjutkan/mulai
  // jadi 1 section, bukan 2 kartu terpisah) — pola visual `spark` Beranda
  // (sky+hills, gradien lagoon+mango) dipertahankan karena itu elemen
  // paling "menarik" yang sudah ada, progress bar-nya diselipkan sebagai
  // strip tipis translus di atas judul, bukan kartu putih terpisah lagi.
  // `findNextMateri` yang beda dari Beranda: otomatis loncat ke materi
  // BERIKUTNYA begitu materi terakhir sudah selesai (Beranda cuma menunjuk
  // balik ke `last` apa adanya). Klik tombolnya langsung ke materinya.
  const next = findNextMateri(level.key);
  const sky = `<span class="cloud c1" aria-hidden="true">${CLOUD}</span><span class="cloud c2" aria-hidden="true">${CLOUD}</span>${HILLS_SHORE}`;
  const nextCard = next
    ? `
      <article class="spark compact" style="--spark-accent:${SKILL_META[next.skill].accent}">
        ${sky}
        <div class="spark-body">
          <h2 class="spark-title">${topicTitle(next.skill, next.topicIndex, level.key)}</h2>
          <p class="spark-sub">${SKILL_META[next.skill].label} · ${SKILL_META[next.skill].tagline}</p>
          <button class="cta" type="button" data-action="continueMateri">${ICON_PLAY} ${next.continuing ? 'Yuk Lanjutkan' : 'Yuk Mulai'}</button>
          ${progressBar}
        </div>
        <div class="spark-art" aria-hidden="true"><span class="mascot-idle">${SKILL_META[next.skill].emoji}</span></div>
      </article>`
    : `
      <article class="spark compact">
        ${sky}
        <div class="spark-body">
          <span class="eyebrow">Keren banget!</span>
          <h2 class="spark-title">Semua materi ${level.name} sudah tuntas! 🎉</h2>
          <p class="spark-sub">Yuk coba Markas ${BOSS_NAME[level.key]} — atau ulang materi mana saja kapan pun mau.</p>
          <button class="cta" type="button" data-action="openBoss">🏰 Coba Tantangan ${BOSS_NAME[level.key]}</button>
          ${progressBar}
        </div>
        <div class="spark-art" aria-hidden="true"><span class="mascot-idle">${BOSS_AVATAR[level.key]}</span></div>
      </article>`;

  const cards = visibleSkillKeys(level.key).map((key) => {
    const s = SKILL_META[key];
    const topics = topicsForSkill(key, level.key);
    const doneHere = topics.filter((t) => topicFinished(key, t.id, level.key)).length;
    const skillPct = topics.length > 0 ? Math.round((doneHere / topics.length) * 100) : 0;
    const tags = s.activities.map((a) => `<span class="tag">${a}</span>`).join('');
    return `
      <div class="skill-card" role="button" tabindex="0" data-action="openSkill" data-payload="${key}">
        <span class="skill-pct${skillPct >= 100 ? ' done' : ''}">${skillPct}%</span>
        <span class="ic" style="background:${s.accentBg};color:${s.accent}" aria-hidden="true">${s.emoji}</span>
        <div class="body">
          <h3>${s.label}</h3>
          <p>${s.tagline} · ${topics.length} materi</p>
          <span class="row">${tags}${doneHere > 0 ? `<span class="tag ok">${doneHere} selesai ⭐</span>` : ''}</span>
        </div>
        <span class="chev" aria-hidden="true">${ICON_CHEVRON}</span>
      </div>`;
  }).join('');

  // Teaser Bos ikut level yang sedang dilihat (dulu hardcode 'explorer' —
  // permintaan user: Adventurer sekarang punya materi juga, jadi anak yang
  // levelnya Adventurer harus lihat "Tantangan Bos Adventurer", bukan Explorer).
  const bossCleared = isBossCleared(level.key);

  // Nudge First Placement Test — sama seperti Beranda (PRD §16): tampil kalau
  // pernah login (`placementTestDone !== null`) tapi belum benar-benar
  // selesai (termasuk sempat di-skip). `null` (belum pernah login) TIDAK
  // memicu nudge — tapi ini kini gerbang wajib jadi praktiknya selalu login
  // dulu. Ditaruh di PALING BAWAH halaman (di luar .two-col) supaya selalu
  // di ujung, konsisten di mobile maupun desktop.
  const ptDone = getCachedChildStatus().placementTestDone;
  const placementNudge =
    ptDone === false
      ? `
        <div class="card note-card" style="margin-top:var(--s4)">
          <div class="card-title">🎈 Belum coba First Placement Test</div>
          <p>Kenalan sama 4 kegiatan seru buat cari tahu titik mulai yang paling pas.</p>
          <button class="ghost-btn" type="button" data-action="openPlacementTest" style="margin-top:var(--s3)">Ambil First Placement Test →</button>
        </div>`
      : '';

  root.innerHTML = `
    <section class="two-col">
      <div class="stack">
        ${nextCard}
        ${menuLevelHead}
        <div class="skill-grid">${cards}</div>

        <article class="boss-teaser">
          ${HILLS_RIDGE}
          <div class="sunburst" aria-hidden="true"><span class="face mascot-idle">${BOSS_AVATAR[level.key]}</span><span class="crown">👑</span></div>
          <div class="boss-teaser-body">
            <span class="eyebrow">${bossCleared ? 'Sudah kamu taklukkan' : 'Tantangan besar'}</span>
            <h2 class="h2">🏰 Markas ${BOSS_NAME[level.key]}</h2>
            <p class="lede">5 babak dari semua kegiatan di atas. ${bossCleared ? 'Boleh dicoba lagi kapan saja.' : 'Benar 80% di 4 babak utama, level berikutnya kebuka!'}</p>
            <button class="cta" type="button" data-action="openBoss">${ICON_PLAY} ${bossCleared ? `Main Lagi Lawan ${BOSS_NAME[level.key]}` : `Coba Tantangan ${BOSS_NAME[level.key]}`}</button>
          </div>
        </article>
      </div>

      <aside class="stack">
        <div class="card">
          <span class="eyebrow">Cara mainnya</span>
          <ol class="howto">
            <li><span class="n">1</span><span><b>Kenalan</b>Dengar contohnya dulu — tanpa hafalan, tanpa penjelasan panjang.</span></li>
            <li><span class="n">2</span><span><b>Latihan Inti</b>Main sampai semua soal dicoba. Salah? Ulang saja, tidak ada nilai.</span></li>
            <li><span class="n">3</span><span><b>Tantangan</b>Bonus buat yang mau lanjut. Boleh dilewati.</span></li>
          </ol>
        </div>
        <div class="card note-card">
          <div class="card-title">Tips</div>
          <p>Sesi pendek 10–15 menit lebih efektif daripada sekali lama. Kecepatan suara bisa dipelankan di Pengaturan.</p>
        </div>
      </aside>
    </section>

    ${placementNudge}
  `;

  setHandlers({
    openSkill: (payload) => go('topics', { skillKey: payload as SkillKey, topicIndex: 0 }),
    openBoss: () => go('boss', { bossLevel: level.key }),
    openPlacementTest: () => go('placementTest'),
    continueMateri: () => {
      if (!next) return;
      setLast({ skill: next.skill, topicIndex: next.topicIndex });
      go('activity', { skillKey: next.skill, topicIndex: next.topicIndex, step: 0 });
    },
  });

  wireLevelSwitcher('menu');
}

/* ---------------------------------------------------------- daftar materi -- */

function renderTopics(): void {
  const key = state.skillKey as SkillKey;
  const meta = SKILL_META[key];
  const levelMeta = browsingLevel();
  const level = levelMeta.key;
  const items = topicsForSkill(key, level);

  // Pemilih level (permintaan user: "tambahkan list dropdown level di list
  // materi", ditaruh berdampingan dgn tombol Cara Main di bawah, BUKAN
  // sendirian) — `renderLevelSwitcher()` SAMA PERSIS yang dipakai
  // `renderMenu()`, jadi level yang dipilih di sini JUGA "nempel" lintas
  // navigasi (satu logic, lihat komentar lengkap di definisinya).
  const topicsLevelDropdown = renderLevelSwitcher(level, `Pilih level ${meta.label}`);

  // "Selesai" (checkmark, warna, teks "Sudah selesai") WAJIB ikut
  // `topicFinished()`/`topicProgressPercent()` (pct>=100), bukan `isDone()`
  // mentah lagi — permintaan user: dulu topik Vocab bisa kepentok "Sudah
  // selesai" di 70% gara-gara `isDone()` cuma cek "pernah 1x nyampe layar
  // Kerja Bagus", yang bisa terjadi tanpa Latihan Inti/Tantangan tuntas
  // semua (mis. anak loncat langsung ke Tantangan lewat stepper bebas).
  const cards = items
    .map((t, i) => {
      const pct = topicProgressPercent(key, t.id, level);
      const finished = topicFinished(key, t.id, level);
      return `
      <div class="topic-card ${finished ? 'done' : ''}" role="button" tabindex="0" data-action="openTopic" data-payload="${i}">
        <div class="num" aria-hidden="true">${finished ? ICON_CHECK : i + 1}</div>
        <div class="info">
          <b>${t.title} <span class="topic-pct${finished ? ' done' : ''}">- ${pct}%</span></b>
          <span>${finished ? '⭐ Sudah selesai' : t.desc}</span>
        </div>
        <div class="go">${finished ? 'Main lagi' : 'Mulai'}</div>
      </div>`;
    })
    .join('');

  const doneHere = items.filter((t) => topicFinished(key, t.id, level)).length;
  // Progres "X dari N materi" — SELALU tampil termasuk 0%, non-punitive.
  // Digabung LANGSUNG ke dalam screen-head (1 section, bukan kartu terpisah
  // di bawahnya). Header penuh ini TIDAK sticky (dulu sempat dibuat sticky,
  // direvisi user: "jadi slim/collapse pas discroll") — pola dari halaman
  // module project inggrisinyuk (app/dashboard/[module]/page.tsx): header
  // besar scroll away seperti biasa, lalu `.topics-compact-bar` (fixed,
  // disembunyikan lewat translateY+opacity) fade-in gantiin begitu
  // `window.scrollY` lewat ambang — bukan 1 elemen yang animasi
  // menyusut/berubah ukuran di tempat (lebih sederhana & robust).
  const topicPct = items.length > 0 ? Math.round((doneHere / items.length) * 100) : 0;

  root.innerHTML = `
    <div class="topics-compact-bar" id="topicsCompactBar">
      <div class="topics-compact-inner">
        <button class="iconbtn" type="button" data-action="backToMenu" aria-label="Kembali ke Menu Belajar">${ICON_BACK}</button>
        <span class="topics-compact-label">${meta.emoji} ${meta.label}</span>
        <span class="topics-compact-pct">${topicPct}%</span>
      </div>
    </div>

    <div class="screen-head topics-head">
      <button class="iconbtn" type="button" data-action="backToMenu" aria-label="Kembali ke Menu Belajar">${ICON_BACK}</button>
      <div class="txt">
        <h1>${meta.emoji} ${meta.label} <span class="tag accent">${items.length} materi</span></h1>
        <p>${meta.tagline} — pilih materi untuk mulai</p>
        <div class="progress-track" role="img" aria-label="${topicPct}% materi ${meta.label} sudah dikerjakan" style="margin-top:10px;max-width:340px">
          <div class="progress-fill" style="width:${topicPct}%"></div>
        </div>
        <p class="meta" style="margin-top:6px">${doneHere} dari ${items.length} materi (${topicPct}%)${doneHere > 0 ? ' · Boleh diulang kapan saja.' : ''}</p>
      </div>
      <button class="ghost-btn cara-main-btn" type="button" data-action="openCaraMain">❓ Cara Main</button>
    </div>

    ${topicsLevelDropdown ? `<div class="topics-toolbar">${topicsLevelDropdown}</div>` : ''}

    <section class="two-col">
      <div class="topic-grid">${cards}</div>

      <aside class="stack">
        <div class="card">
          <span class="eyebrow">Isi ${meta.label}</span>
          <div class="card-title" style="margin:4px 0 4px">Yang dilatih di sini</div>
          <ol class="howto">
            ${meta.activities
              .map((a, i) => `<li><span class="n">${i + 1}</span><span><b>${a}</b></span></li>`)
              .join('')}
          </ol>
          <p class="meta" style="margin-top:12px">Tiap materi jalannya sama: Kenalan → Latihan Inti → Tantangan.</p>
        </div>
      </aside>
    </section>
  `;

  setHandlers({
    backToMenu: () => go('menu'),
    openTopic: (payload) => {
      const index = Number(payload);
      setLast({ skill: key, topicIndex: index });
      go('activity', { topicIndex: index, step: 0 });
    },
    openCaraMain: () => renderCaraMain(meta, levelMeta),
  });

  wireLevelSwitcher('topics');
  wireTopicsCompactBar();
}

/** Nyalakan/matikan `.topics-compact-bar` sesuai posisi scroll (permintaan
 *  user, pola dari project inggrisinyuk). Self-cleaning: kalau
 *  `#topicsCompactBar` sudah tidak ada di DOM (anak sudah pindah layar,
 *  `root.innerHTML` sudah ditimpa render lain), listener-nya melepas diri
 *  sendiri — tidak perlu registry cleanup terpisah tiap `go()`. */
function wireTopicsCompactBar(): void {
  const onScroll = (): void => {
    const bar = document.getElementById('topicsCompactBar');
    if (!bar) {
      window.removeEventListener('scroll', onScroll);
      return;
    }
    bar.classList.toggle('is-visible', window.scrollY > 140);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

/* --------------------------------------------------------------- aktivitas -- */

/**
 * Kartu "Cara Main" — DULU gate otomatis SEKALI SEUMUR HIDUP per topik
 * sebelum Kenalan pertama kali dibuka; permintaan user: dipindah jadi tombol
 * opt-in di atas daftar materi (`renderTopics`) supaya tidak lagi memotong
 * alur tiap kali topik baru dipilih. Sekarang GENERIK per-SKILL (bukan per-
 * topik lagi — tidak ada topik spesifik yang dipilih saat tombolnya ditekan
 * dari daftar materi), makanya parameter `topic`/penanda "sudah pernah
 * dilihat" (`hasSeenCaraMain`/`markCaraMainSeen`) dihapus total, bukan lagi
 * relevan buat tombol yang boleh ditekan berkali-kali kapan saja.
 * Menjelaskan alur 3 langkah SECARA GENERIK (Kenalan → Latihan Inti →
 * Tantangan) — sengaja TIDAK spesifik ke mekanik soal per format (banyak
 * format berbeda per skill/level, lihat CLAUDE.md "N Format Berdampingan"),
 * karena URUTAN TAHAPnya sendiri SELALU sama di seluruh app apa pun
 * formatnya, jadi 1 kartu generik ini cukup dipakai lintas skill/topik.
 * Level ditampilkan sbg badge READ-ONLY, BUKAN pemilih tingkat kesulitan —
 * app ini sudah punya sistem level/progres sendiri lewat Peta Level
 * (Little Stars…Trailblazer), bukan dipilih ulang per-topik di sini.
 */
function renderCaraMain(meta: SkillMeta, level: LevelMeta): void {
  root.innerHTML = `
    <div class="act-head">
      <button class="iconbtn" type="button" data-action="backStep" aria-label="Kembali ke Daftar Materi">${ICON_BACK}</button>
      <div class="txt">
        <h1>${meta.emoji} ${meta.label}</h1>
        <div class="sub"><span class="tag accent">Cara Main</span></div>
      </div>
    </div>

    <div class="card" style="max-width:460px;margin:0 auto;text-align:center">
      <span class="stage-badge">${meta.emoji} Cara Main</span>
      <h2 class="h2" style="margin-bottom:6px">${meta.tagline}</h2>
      <p class="lede" style="margin-bottom:18px">Begini alur tiap materi ${meta.label}, dari kenalan santai sampai tantangan seru.</p>
      <div class="cara-main-steps">
        <div class="cara-main-step">
          <span class="num" aria-hidden="true">1</span>
          <p><b>🎈 Kenalan</b><span>Dengar &amp; coba dulu, santai aja — belum dinilai.</span></p>
        </div>
        <div class="cara-main-step">
          <span class="num" aria-hidden="true">2</span>
          <p><b>🎯 Latihan Inti</b><span>Jawab soalnya, boleh dicoba lagi kalau meleset.</span></p>
        </div>
        <div class="cara-main-step">
          <span class="num" aria-hidden="true">3</span>
          <p><b>👑 Tantangan</b><span>Asah kemampuanmu sampai tuntas.</span></p>
        </div>
      </div>
      <span class="tag" style="margin-top:var(--s2)">${level.emoji} ${level.name}</span>
      <button class="primary-btn pt-cta" type="button" data-action="backStep" style="margin-top:var(--s4);width:100%">✅ Oke, Mengerti!</button>
    </div>
  `;

  setHandlers({
    backStep: () => go('topics'),
  });
}

function renderActivity(): void {
  const key = state.skillKey as SkillKey;
  const meta = SKILL_META[key];
  const level = browsingLevel();
  const topic = topicsForSkill(key, level.key)[state.topicIndex];

  // Panel kecepatan/suara cuma relevan kalau skill-nya benar-benar pakai TTS
  // (`speak()`)/mic di suatu titik (revisi user: sempat digerbang ke
  // listening/speaking saja, TAPI Vocabulary & Grammar juga pakai dengar 🔊/
  // ucap 🎤 di Kenalan-nya, jadi salah kalau ikut disembunyikan). Reading:
  // Kenalan (dibacakan otomatis) & Latihan Inti (🔊 per tier) pakai TTS →
  // panel tampil (permintaan user); Tantangan "Baca Sendiri" tetap tanpa panel.
  const showVoicePanel = key !== 'reading' || state.step < 2;

  // Default kecepatan suara 0.75x di SEMUA skill, level & tahap (permintaan
  // user "defaultkan semua di 0.75 di semua level" — dulu Listening/Speaking/
  // Grammar Adventurer+ 1x di Latihan Inti/Tantangan). Tidak menimpa pill
  // kecepatan yang sudah dipilih user sendiri.
  applyDefaultRate(DEFAULT_RATE);

  const steps = STEP_LABELS.map((label, i) => {
    const cls = i === state.step ? 'active' : i < state.step ? 'done' : '';
    // Semua langkah boleh diklik bebas (permintaan user: Latihan Inti &
    // Tantangan TIDAK BOLEH terkunci) — anak boleh loncat ke mana saja di
    // Kenalan/Latihan Inti/Tantangan kapan saja, non-sequential by design.
    const dot = i < state.step ? ICON_CHECK : String(i + 1);
    return `<li class="${cls}" data-action="jumpStep" data-payload="${i}" role="button" tabindex="0"><span class="dot" aria-hidden="true">${dot}</span>${label}</li>`;
  }).join('');

  root.innerHTML = `
    <div class="act-head">
      <button class="iconbtn" type="button" data-action="backStep" aria-label="Kembali satu langkah">${ICON_BACK}</button>
      <div class="txt">
        <h1>${topic.title}</h1>
        <div class="sub">
          <span class="tag accent">${meta.emoji} ${meta.label}</span>
          <span class="meta">Langkah ${state.step + 1} dari ${STEP_LABELS.length}</span>
        </div>
      </div>
    </div>

    <div class="act-body">
      <div class="act-side">
        <ol class="stepper">${steps}</ol>
        ${
          showVoicePanel
            ? `<div class="voice-shown">
          <div class="voice-shown-head">🔊 Suara &amp; kecepatan</div>
          <div id="voicePanelMount"></div>
        </div>`
            : ''
        }
      </div>
      <div class="act-stage">
        <div class="card" id="stage"></div>
      </div>
    </div>
  `;

  setHandlers({
    backStep: () => prevStep(),
    jumpStep: (payload) => {
      state.step = Number(payload);
      syncActivityUrl();
      render();
    },
  });

  if (showVoicePanel) renderVoicePanel(qs<HTMLDivElement>(root, '#voicePanelMount'));
  runStage(key, qs<HTMLDivElement>(root, '#stage'));
}

/** Tombol kembali: mundur 1 langkah (Tantangan→Latihan Inti→Kenalan), lalu ke Daftar Materi. */
function prevStep(): void {
  if (state.step > 0) {
    state.step -= 1;
    syncActivityUrl();
    render();
  } else {
    go('topics');
  }
}

/**
 * Permintaan user (fix): "Kerja Bagus" WAJIB nunggu progress topik BENERAN
 * 100% (`topicFinished()`), BUKAN cuma "step yang lagi dikerjakan kebetulan
 * tuntas" — dulu `nextStep()` cuma cek `state.step` mentah, jadi anak yang
 * loncat langsung ke Tantangan (stepper bebas, tidak pernah dikunci) lalu
 * menuntaskannya BISA dapat layar "Kerja Bagus" walau Latihan Inti masih
 * 0%. `markStepVisited` dipanggil DULU (sebelum keputusan step berikutnya)
 * supaya Latihan Inti/Tantangan skill TANPA section granular (progress.ts
 * `isStepVisited`) ikut tercatat brp pun urutan anak menyelesaikannya.
 * Kalau step terakhir tuntas TAPI topik belum 100% (`!topicFinished`) —
 * balik ke daftar materi (BUKAN diam di tempat/dead-end) supaya anak bisa
 * lanjut ke bagian yang belum, tanpa perayaan palsu.
 */
function nextStep(): void {
  const key = state.skillKey as SkillKey;
  const level = browsingLevel().key;
  const topic = topicsForSkill(key, level)[state.topicIndex];
  if (state.step === 1) markStepVisited(key, topic.id, 'latihan');
  else if (state.step === 2) markStepVisited(key, topic.id, 'tantangan');

  if (state.step < STEP_LABELS.length - 1) {
    state.step += 1;
    syncActivityUrl();
    render();
  } else if (topicFinished(key, topic.id, level)) {
    renderSelesai();
  } else {
    go('topics');
  }
}

/** Sync eksplisit tiap Latihan Inti/Tantangan BENERAN tuntas — perluasan
 *  pola yang tadinya cuma Vocab (`requestSync()` di step Latihan Inti +
 *  3 tab Tantangan `games/vocabulary.ts`) ke SEMUA skill (Listening/
 *  Reading/Grammar/Speaking, semua format) & Game Hub/Tantangan Besar Raja
 *  (`runRajaRound`/`renderBoss`) — permintaan user "sama konsepnya dgn
 *  vocab, section selesai baru disimpan ke db". Dipakai gantikan `nextStep`
 *  polos DI STEP 1 (Latihan Inti) & STEP 2 (Tantangan) SAJA — step 0
 *  (Kenalan) TETAP `nextStep` tanpa sync, konsisten CLAUDE.md poin 6
 *  (Kenalan tidak pernah dihitung ke progress). */
function nextStepWithSync(): void {
  requestSync();
  nextStep();
}

function runStage(key: SkillKey, stage: HTMLElement): void {
  // Dua level BEDA sengaja dipisah di sini:
  //  - `contentLevel` (browsing, bisa override lewat Peta Level/pemilih di
  //    Menu Belajar, jatuh ke playable kalau tidak ada) nentuin topik/materi
  //    mana yang ditampilkan — anak di level tanpa materi (mis. Starter)
  //    tetap dapat sesuatu utk dimainkan, bukan layar kosong.
  //  - `praiseLevel` (badge asli, TANPA fallback/override) nentuin bahasa
  //    pujian/semangat (praise.ts `PRAISE_LANG_BY_LEVEL`, permintaan user) —
  //    anak level tinggi yang kebetulan lagi main materi markas lain (baik
  //    fallback maupun sengaja dijelajahi) tetap dapat pujian sesuai
  //    levelnya SENDIRI, bukan ikut level kontennya.
  const contentLevel = browsingLevel().key;
  const praiseLevel = currentLevelMeta().key;
  switch (key) {
    case 'vocabulary': {
      const topic = vocabTopicsForLevel(contentLevel)[state.topicIndex];
      if (state.step === 0) vocabularyGame.renderKenalan(stage, topic, praiseLevel);
      // Tantangan (step 2) TIDAK dibungkus `nextStepWithSync` di sini —
      // `games/vocabulary.ts` `runTantangan` sudah requestSync() sendiri di
      // TIAP 3 tab (Eja Kata/Susun Kalimat/Penggunaan), termasuk tab
      // terakhir tepat sebelum manggil `onDone` (=nextStep) ini.
      else if (state.step === 1) vocabularyGame.runLatihanInti(stage, topic, nextStepWithSync, praiseLevel, contentLevel);
      else vocabularyGame.runTantangan(stage, topic, nextStep, praiseLevel, contentLevel);
      return;
    }
    case 'listening': {
      const topic = listeningTopicsForLevel(contentLevel)[state.topicIndex];
      // `AnyListeningTopic` — format lama (Explorer/Adventurer, `scene`/
      // `drill`/`story`) vs 3 varian format baru ala Vocab (Little Stars/
      // Starter/Achiever/Trailblazer, `items`), dibedakan runtime lewat
      // `'items' in topic` (types.ts komentar `AnyListeningTopic`). JANGAN
      // migrasi format lama ke sini tanpa arahan baru user — sudah sengaja
      // dipisah (lihat riwayat commit). Pembeda KEDUA (`'noteGaps' in topic`
      // / `'dialogueLines' in topic`) cuma dipakai di Tantangan (step 2) —
      // Kenalan/Latihan Inti generik utk SEMUA varian format baru
      // (`ListeningItemsTopic`, types.ts).
      if ('items' in topic) {
        if (state.step === 0) listeningGame.renderKenalanSentence(stage, topic, praiseLevel, contentLevel);
        else if (state.step === 1) listeningGame.runLatihanIntiSentence(stage, topic, nextStepWithSync, praiseLevel, contentLevel);
        else if ('noteGaps' in topic) listeningGame.runTantanganNote(stage, topic, nextStepWithSync, praiseLevel, contentLevel);
        else if ('dialogueLines' in topic) listeningGame.runTantanganDialogue(stage, topic, nextStepWithSync, praiseLevel, contentLevel);
        else listeningGame.runTantanganSentence(stage, topic, nextStepWithSync, praiseLevel, contentLevel);
      } else {
        if (state.step === 0) listeningGame.renderKenalan(stage, topic, praiseLevel, contentLevel);
        else if (state.step === 1) listeningGame.runLatihanInti(stage, topic, nextStepWithSync, praiseLevel);
        else listeningGame.runTantangan(stage, topic, nextStepWithSync);
      }
      return;
    }
    case 'speaking': {
      const topic = speakingTopicsForLevel(contentLevel)[state.topicIndex];
      // Speaking: SATU alur di semua level & semua bentuk data (`games/speaking.ts`
      // `flowOf`, `materi/speaking.md` §19) — Kenalan 🔊🎤 → Latihan Inti
      // Tirukan+Lengkapi → Tantangan "Ngobrol Yuk!". Pembeda level lewat
      // `contentLevel` (tier), bukan format layar yang berbeda.
      if (state.step === 0) speakingGame.renderKenalan(stage, topic, nextStep, praiseLevel, contentLevel);
      else if (state.step === 1) speakingGame.runLatihanInti(stage, topic, nextStepWithSync, praiseLevel, contentLevel);
      else speakingGame.runTantangan(stage, topic, nextStepWithSync, praiseLevel, contentLevel);
      return;
    }
    case 'reading': {
      const topic = readingTopicsForLevel(contentLevel)[state.topicIndex];
      // Satu format "Baca Teks" di semua level; beda level lewat konten +
      // `textTier(contentLevel)` (materi/reading.md §19–§22).
      if (state.step === 0) readingGame.renderKenalanText(stage, topic, nextStep, praiseLevel, contentLevel);
      else if (state.step === 1) readingGame.runLatihanIntiText(stage, topic, nextStepWithSync, praiseLevel, contentLevel);
      else readingGame.runTantanganText(stage, topic, nextStepWithSync, praiseLevel, contentLevel);
      return;
    }
    case 'grammar': {
      const topic = grammarTopicsForLevel(contentLevel)[state.topicIndex];
      // `AnyGrammarTopic` — format KALIMAT (Explorer/Adventurer/Achiever,
      // `sentences`, teks-first) vs format KEDUA "py
      // `items`" (Little Stars/Starter, kontras 2-kalimat audio+gambar) vs
      // format KETIGA "py `transforms`" (Trailblazer, transformasi kalimat
      // MCQ), dibedakan runtime tingkat-1 `'items' in topic`, tingkat-2
      // `'transforms' in topic` (types.ts komentar `AnyGrammarTopic`), sama
      // pola persis dgn `AnySpeakingTopic`. `contentLevel` = pembeda level
      // (tier, `materi/pembeda_level.md` § Grammar).
      if ('items' in topic) {
        if (state.step === 0) grammarGame.renderKenalanPattern(stage, topic, nextStep, praiseLevel);
        else if (state.step === 1) grammarGame.runLatihanIntiPattern(stage, topic, nextStepWithSync, praiseLevel, contentLevel);
        else grammarGame.runTantanganPattern(stage, topic, nextStepWithSync, praiseLevel, contentLevel);
      } else if ('transforms' in topic) {
        if (state.step === 0) grammarGame.renderKenalanTransform(stage, topic, nextStep);
        else if (state.step === 1) grammarGame.runLatihanIntiTransform(stage, topic, nextStepWithSync, praiseLevel, contentLevel);
        else grammarGame.runTantanganTransform(stage, topic, nextStepWithSync, praiseLevel, contentLevel);
      } else {
        if (state.step === 0) grammarGame.renderKenalanSentence(stage, topic, nextStep, contentLevel);
        else if (state.step === 1) grammarGame.runLatihanIntiSentence(stage, topic, nextStepWithSync, praiseLevel, contentLevel);
        else grammarGame.runTantanganSentence(stage, topic, nextStepWithSync, praiseLevel, contentLevel);
      }
      return;
    }
  }
}

function renderSelesai(): void {
  const key = state.skillKey as SkillKey;
  const topic = topicsForSkill(key, browsingLevel().key)[state.topicIndex];
  // Selesai = 1 putaran tuntas dicoba, bukan skor minimum (PRD §4.5).
  markDone(key, topic.id);
  addXp(XP_MODULE);

  const stage = qs<HTMLDivElement>(root, '#stage');
  stage.innerHTML = `
    <div class="done-wrap">
      <div class="done-mascot mascot-pop" aria-hidden="true">🦁🎉</div>
      <div class="stars stars-pop" aria-hidden="true">⭐⭐⭐</div>
      <h2 class="done-title baloo">Kerja Bagus!</h2>
      <p class="done-sub">Modul "${topic.title}" selesai kamu coba. Bintangnya masuk ke Beranda. <b>+${XP_MODULE} XP</b> ⚡</p>
      <button class="primary-btn" type="button" data-action="restart">🔁 Ulangi Modul Ini</button>
      <button class="ghost-btn" type="button" data-action="backToTopics">📋 Pilih Materi Lain</button>
    </div>
  `;
  setHandlers({
    restart: () => go('activity', { step: 0 }),
    backToTopics: () => go('topics'),
  });
}

/* -------------------------------------------------------------- pengaturan -- */

/**
 * 🔒 Kartu "Level" (permintaan user "buat section ini lebih simple dan
 * tidak banyak text") — dulu py 2 kalimat penjelas di bawah badge (badge
 * CEFR sekunder utk anak, naik level berbasis modul bukan skor/waktu),
 * SUDAH DIHAPUS — cukup nama+emoji level & badge CEFR·usia yang sudah
 * kebaca dari tata letaknya sendiri (CLAUDE.md "Teks Singkat, Padat,
 * Jelas": kalau dihapus & masih paham dari elemen visual yang ada, jangan
 * ditambahkan).
 *
 * 🔒 **Revisi (permintaan user "tambahkan text catatan: level ini
 * berdasarkan {cambridge}, sesuaikan kata di dalam kurung kurawa")** —
 * 1 baris catatan kecil (`.meta`, sama gaya baris kecil lain di kartu ini)
 * DITAMBAHKAN LAGI, TAPI beda dari 2 kalimat lama yang dihapus di atas: ini
 * SATU baris pendek, isinya sumber acuan bukan penjelasan mekanisme.
 * `LEVEL_CAMBRIDGE_REF` (di bawah) memetakan tiap level ke frasa tingkat
 * Cambridge yang SESUAI (bukan teks generik sama utk semua level) — PRD.md
 * §3 "Sistem Level" kolom "Cambridge YLE/Schools terdekat" adalah sumbernya
 * (lihat juga jawaban sesi sebelumnya soal referensi ini). Little Stars
 * SENGAJA TANPA entri (PRD §3 kolomnya "—" utk level itu, CEFR/Cambridge
 * genuinely tidak berlaku usia 3–5 th) — catatan TIDAK ditampilkan sama
 * sekali utk level itu, bukan dipaksa isi referensi yang tidak ada.
 */
const LEVEL_CAMBRIDGE_REF: Partial<Record<LevelKey, string>> = {
  starter: 'Cambridge Pre A1 Starters (tahap awal)',
  explorer: 'Cambridge Pre A1 Starters',
  adventurer: 'Cambridge A1 Movers',
  achiever: 'Cambridge A2 Flyers',
  trailblazer: 'Cambridge A2 Key & B1 Preliminary for Schools',
};

function renderSettings(): void {
  const avatar = getAvatar();
  const level = userLevelMeta();
  const avatarGrid = ANIMAL_AVATARS.map((a) => {
    const name = ANIMAL_AVATAR_NAMES[a];
    const active = a === avatar;
    return `
      <button class="avatar-opt ${active ? 'is-active' : ''}" type="button" data-action="pickAvatar" data-payload="${a}" aria-label="Pilih avatar ${name}">
        ${active ? `<span class="avatar-opt-check" aria-hidden="true">${ICON_CHECK}</span>` : ''}
        <span class="avatar-opt-emoji" aria-hidden="true">${a}</span>
        <span class="avatar-opt-name">${name}</span>
      </button>`;
  }).join('');

  // Retest ditaruh dekat Keluar (feedback user, pola sama dgn inggrisinyuk
  // dewasa — retest ada di deretan pengaturan akun, bukan di atas sendiri).
  // Maks 2 percobaan (permintaan user) — angkanya ditampilkan di sini
  // (layar orang tua), BUKAN di layar anak, konsisten dgn prinsip "jangan
  // tampilkan skor/kuota sbg tekanan ke anak" (CLAUDE.md poin 2).
  const { placementAttemptsUsed, placementAttemptsRemaining } = getCachedChildStatus();
  const placementTestCard = `
      <section class="card">
        <span class="eyebrow">🎈 Main Dulu, Yuk!</span>
        <div class="card-title" style="margin:4px 0 8px">Ulangi Placement Test</div>
        <p class="meta" style="margin-bottom:14px">Cari tahu titik mulai yang paling pas buat kamu — dengar kata, tebak gambarnya! Sudah dipakai ${placementAttemptsUsed}/2 kali.</p>
        <button class="ghost-btn" type="button" data-action="openPlacementTestFromSettings" ${placementAttemptsRemaining <= 0 ? 'disabled' : ''}>🔁 Main Lagi</button>
      </section>`;

  // Email fallback ke `identifier` (getAccountInfo) — belum kosong walau
  // `/api/me` belum sempat disegarkan sejak login (lihat komentar
  // `parentEmail` di account.ts). `createdAt` beneran perlu fetch itu.
  const { email: accountEmail, createdAt: accountCreatedAt } = getAccountInfo();
  const accountCreatedLabel = accountCreatedAt
    ? new Date(accountCreatedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
    : '—';
  const accountInfoCard = `
      <section class="card">
        <span class="eyebrow">Informasi Akun</span>
        <div class="acc-info-row" style="margin-top:10px">📧 <b>Akun Login</b> : ${escapeHtml(accountEmail ?? '—')}</div>
        <div class="acc-info-row">🗓️ <b>Akun dibuat</b> : ${accountCreatedLabel}</div>
      </section>`;

  root.innerHTML = `
    <div class="set-grid">
      <section class="card">
        <span class="eyebrow">Nama panggilan</span>
        <input type="text" id="nameInput" class="text-input" maxlength="24" placeholder="Nama anak (opsional)" value="${escapeHtml(getName())}" style="margin-top:8px" />
        <div class="avatar-grid" style="margin-top:12px">${avatarGrid}</div>
        <p class="meta" style="margin-top:10px">Cuma tersimpan di perangkat ini — tidak dikirim ke mana pun.</p>
      </section>

      <section class="card">
        <div class="card-title" style="margin:4px 0 12px">Musik &amp; efek suara game</div>
        <div class="audio-toggles">
          <button class="music-toggle${isMusicOn() ? ' is-on' : ''}" type="button" data-action="settingsMusic" role="switch" aria-checked="${isMusicOn()}">${isMusicOn() ? '🎵 Musik latar: Nyala' : '🔇 Musik latar: Mati'}</button>
          <button class="music-toggle${isSfxOn() ? ' is-on' : ''}" type="button" data-action="settingsSfx" role="switch" aria-checked="${isSfxOn()}">${isSfxOn() ? '🔔 Efek suara: Nyala' : '🔕 Efek suara: Mati'}</button>
        </div>
        <p class="meta" style="margin-top:10px">Cuma di Game Hub. Musik otomatis mengecil saat ada suara bicara. Nada jawaban benar/salah tetap bunyi.</p>
      </section>

      <section class="card voice-flush">
        <div class="card-title" style="margin:4px 0 12px">Kecepatan &amp; jenis suara</div>
        <div id="voicePanelMount"></div>
        <p class="meta" style="margin-top:12px">Pelankan suara kalau anak baru mulai — 0.5x–0.75x biasanya paling enak diikuti.</p>
      </section>

      <section class="card">
        <span class="eyebrow">Level</span>
        <div class="lvl-name" style="margin:4px 0 2px">${level.emoji} ${level.name}</div>
        <div class="lvl-meta">${level.cefr} · ${level.age}</div>
        ${LEVEL_CAMBRIDGE_REF[level.key] ? `<p class="meta" style="margin-top:8px">Catatan: level ini berdasarkan ${LEVEL_CAMBRIDGE_REF[level.key]}.</p>` : ''}
      </section>

      ${placementTestCard}

      ${accountInfoCard}

      <button class="ghost-btn" type="button" data-action="logoutAccount">👋 Keluar</button>
    </div>
  `;

  setHandlers({
    openPlacementTestFromSettings: () => go('placementTest'),
    settingsMusic: () => {
      setMusicOn(!isMusicOn());
      render();
    },
    settingsSfx: () => {
      setSfxOn(!isSfxOn());
      render();
    },
    logoutAccount: () => {
      apiLogout();
      cacheChildStatus(null, null);
      paintLevelChips(); // balik ke default (Explorer) — jangan nyisain level akun lama di chip
      render();
    },
    pickAvatar: (payload) => {
      if (!payload) return;
      setAvatar(payload);
      paintLevelChips();
      render();
    },
  });

  // Input teks bebas (bukan tombol) — dikawat langsung, bukan lewat sistem
  // data-action (yang cuma menangani klik, lihat interaction.ts).
  qs<HTMLInputElement>(root, '#nameInput').addEventListener('input', (e) => {
    setName((e.target as HTMLInputElement).value);
    paintLevelChips();
  });

  renderVoicePanel(qs<HTMLDivElement>(root, '#voicePanelMount'), { withIndonesian: true });
}

/* ------------------------------------------------------------- homepage -- */

/** Fitur yang ditonjolkan di homepage — 5 skill asli `SKILL_META` + 1 kartu
 *  bonus Peta Level/Tes Naik Level (bukan skill, ditulis manual krn di luar
 *  `SKILL_META`). Dibuat sekali di module scope, bukan tiap render. */
const LANDING_FEATURES: { emoji: string; label: string; desc: string; accent: string; accentBg: string }[] = [
  ...Object.values(SKILL_META).map((s) => ({ emoji: s.emoji, label: s.label, desc: s.tagline, accent: s.accent, accentBg: s.accentBg })),
  {
    emoji: '👑',
    label: 'Peta Level & Tes Naik Level',
    desc: '6 level; tiap level ditutup tes seru (Tantangan Raja)',
    accent: 'var(--brand-700)',
    accentBg: 'var(--brand-100)',
  },
  {
    emoji: '🎮',
    label: 'Mode Game Bebas',
    desc: 'Latihan santai kapan aja, di luar Peta Level',
    accent: 'var(--brand-600)',
    accentBg: 'var(--brand-50)',
  },
  {
    emoji: '📊',
    label: 'Progresmu (Rapor Ringkas)',
    desc: 'Orang tua pantau XP, streak, & skor tiap skill anak',
    accent: 'var(--sun-600)',
    accentBg: 'var(--sun-100)',
  },
];

/** Teks di sini SENGAJA singkat — detail per poin (CEFR, jumlah materi,
 *  daftar level) sudah masing-masing punya section sendiri di bawah
 *  ("6 Level…", "Apa Aja yang Bisa Dipelajari?"), jadi tidak diulang di sini
 *  (CLAUDE.md "Teks Singkat, Padat, Jelas" — satu fakta cukup sekali). */
const LANDING_STEPS: { emoji: string; title: string; desc: string }[] = [
  { emoji: '🎯', title: 'Cek Kemampuan Dulu', desc: 'First Placement Test yang seru, buat tahu level awal anak.' },
  { emoji: '🗺️', title: 'Pilih Petualangan', desc: 'Jelajahi Peta Level, dari Little Stars sampai Trailblazer.' },
  { emoji: '🎮', title: 'Jalani Misi Tiap Level', desc: 'Vocabulary, Listening, Speaking, Grammar, Reading.' },
  { emoji: '👑', title: 'Tes Naik Level', desc: 'Di akhir tiap level ada tes seru (Tantangan Raja). Lolos, naik ke level berikutnya.' },
];

/** Testimoni placeholder dari sudut pandang ORANG TUA (bukan anak, PRD §14.5
 *  — login/keputusan beli ada di tangan orang tua) — nama & peran generik,
 *  bukan klaim atas orang sungguhan tertentu. */
const LANDING_TESTIMONIALS: { quote: string; name: string; role: string }[] = [
  { quote: 'Anakku jadi suka buka sendiri, seneng banget tiap kali naik level.', name: 'Bunda Sari', role: 'Orang tua anak Explorer' },
  { quote: 'Cuma latihan 10 menit sehari, tapi progresnya kelihatan jelas tiap minggu.', name: 'Ayah Denis', role: 'Orang tua anak Adventurer' },
  { quote: 'Anakku semangat belajar biar lolos tes naik level berikutnya.', name: 'Bunda Wulan', role: 'Orang tua anak Little Stars' },
];

const LANDING_FAQS: { q: string; a: string }[] = [
  { q: 'Apakah ada biaya lagi setelah bayar?', a: 'Tidak. Cukup sekali bayar Rp 99.000 untuk akses selamanya ke semua level & semua skill — tanpa langganan bulanan, biaya per level, atau pembelian di dalam aplikasi.' },
  { q: 'Apa maksud akses selamanya?', a: 'Tidak ada batas main harian dan tidak ada masa langganan yang habis — akun tetap aktif tanpa perlu bayar lagi. Akses berlaku selama layanan InggrisinYuk Kids berjalan.' },
  { q: 'Untuk usia berapa aplikasi ini?', a: '3 sampai 13+ tahun — dari Little Stars sampai Trailblazer, kontennya otomatis menyesuaikan level anak.' },
  { q: 'Apakah anak perlu akun sendiri?', a: 'Tidak, cukup 1 akun keluarga (orang tua) untuk masuk & pantau progres — anak main langsung di app yang sama.' },
  { q: 'Bisa dimainkan tanpa internet?', a: 'Bisa. Progres anak tersimpan otomatis di perangkat; internet cuma dibutuhkan buat masuk akun & sinkron data.' },
  { q: 'Bagaimana kalau jawaban anak salah?', a: 'Tidak ada nilai gagal — jawaban yang belum tepat tetap dapat dorongan semangat & bisa dicoba lagi kapan saja, tanpa timer atau tekanan.' },
  { q: 'Bagaimana orang tua memantau progres anak?', a: 'Lewat panel Progresmu di app — XP, streak, dan skor tiap skill kelihatan begitu orang tua masuk dengan akun keluarga.' },
];

/** Homepage marketing untuk pengunjung yang belum login (lihat gerbang di
 *  `render()`) — hero/cara-kerja/fitur/testimoni/CTA, konsepnya mirip
 *  homepage produk pada umumnya tapi difilter lewat lensa kid-friendly
 *  (CLAUDE.md): harga ditampilkan polos tanpa urgensi/scare tactics, framing
 *  "menaklukkan Raja" (bukan pertarungan) reuse istilah yang sudah dikunci
 *  (`BOSS_NAME`), tanpa timer/skor tekanan apa pun. CTA-nya semua menuju
 *  `go('account')` — satu-satunya pintu yang benar-benar ada hari ini (lihat
 *  komentar `renderAccount` di bawah: akun baru dibuat lewat sukses bayar,
 *  masih backlog, jadi form itu-lah yang menjelaskan langkah berikutnya). */
function renderLandingPage(): void {
  const brandMark = `
    <svg class="brand-mark" viewBox="0 0 40 40" aria-hidden="true" focusable="false">
      <rect x="0" y="0" width="40" height="40" rx="13" fill="#0FA79C"/>
      <circle cx="20" cy="15" r="6.6" fill="#FFC862"/>
      <path d="M6 26.5c3.3 0 3.3 3.2 6.7 3.2s3.3-3.2 6.6-3.2 3.4 3.2 6.7 3.2 3.3-3.2 6.7-3.2" fill="none" stroke="#FFFFFF" stroke-width="2.7" stroke-linecap="round"/>
    </svg>`;

  // Ikon bulat + label, TANPA kartu/border (permintaan user: 3 section kotak
  // beruntun — Level→Fitur→Testimoni — kebaca monoton) — pola sama dgn
  // `.landing-step` di atasnya, TIDAK menyentuh `.skill-card`/`renderMenu`
  // in-app sama sekali (hindari risiko regresi ke layar yang sudah
  // diverifikasi).
  const featureCards = LANDING_FEATURES.map(
    (f) => `
      <div class="landing-feature-item">
        <span class="landing-feature-ic" style="background:${f.accentBg};color:${f.accent}" aria-hidden="true">${f.emoji}</span>
        <h3>${f.label}</h3>
        <p>${f.desc}</p>
      </div>`
  ).join('');

  const stepCards = LANDING_STEPS.map(
    (s, i) => `
      <div class="landing-step">
        <span class="landing-step-ic" aria-hidden="true">${s.emoji}<span class="landing-step-num">${i + 1}</span></span>
        <h3>${s.title}</h3>
        <p>${s.desc}</p>
      </div>`
  ).join('');

  // Nama level (Little Stars…Trailblazer) sendiri belum umum dikenal orang
  // tua — supaya tetap kebaca jelas ini beneran belajar Bahasa Inggris (bukan
  // cuma game), tiap kartu digrounding ke badge CEFR yang SUDAH ada di data
  // asli (`LEVELS[].cefr`, sama seperti yang tampil di Peta Level dalam app,
  // `renderLevels`), bukan angka baru. Little Stars (3-5 th) sengaja TANPA
  // CEFR (`cefr:''`) — riset (RESEARCH.md §3.4, British Council "Early
  // Years") & EF Kids "Small Stars" sama-sama TIDAK memberi label CEFR di
  // usia ini, jadi "Sebelum Pre-A1" lebih jujur drpd mengarang band CEFR palsu.
  // Warna tiap kartu reuse `placeFor()` (scenery.ts) — token tanah yang SAMA
  // dgn Peta Level asli, bukan palet baru, biar kartu ini kebaca sbg preview
  // sungguhan bukan ilustrasi marketing lepas.
  const levelCards = LEVELS.map((lvl) => {
    const cefrTag = lvl.cefr ? `<span class="tag">${lvl.cefr}</span>` : `<span class="tag">Sebelum Pre-A1</span>`;
    return `
      <div class="landing-level ${placeFor(lvl.key).cls}">
        <span class="landing-level-ic" aria-hidden="true">${lvl.emoji}</span>
        <h3>${lvl.name}</h3>
        ${cefrTag}
        <p>${lvl.age}</p>
      </div>`;
  }).join('');

  const faqCards = LANDING_FAQS.map(
    (f) => `
      <details class="landing-faq">
        <summary>${f.q}</summary>
        <p>${f.a}</p>
      </details>`
  ).join('');

  const testiCards = LANDING_TESTIMONIALS.map(
    (t) => `
      <div class="card landing-testi">
        <p>“${t.quote}”</p>
        <div class="who">
          <span class="who-badge" aria-hidden="true">${t.name.trim().split(' ').pop()!.slice(0, 1)}</span>
          <span>
            <span class="who-name" style="display:block">${t.name}</span>
            <span class="who-role">${t.role}</span>
          </span>
        </div>
      </div>`
  ).join('');

  root.innerHTML = `
    <div class="landing-page">
      <div class="landing-nav">
        <span class="brand">${brandMark}<span class="brand-word">InggrisinYuk<small>Kids</small></span></span>
        <div class="landing-nav-actions">
          <button class="ghost-btn landing-nav-btn" type="button" data-action="landingAccount">Masuk</button>
          <button class="cta landing-nav-btn" type="button" data-action="landingRegister">Daftar</button>
        </div>
      </div>

      <section class="landing-hero">
        <div class="landing-hero-inner">
          <span class="landing-mascot mascot-idle" aria-hidden="true">🦁</span>
          <span class="eyebrow">Petualangan Ilmu Bahasa Inggris untuk Anak</span>
          <h1 class="display">Berpetualang, Naik Level, Makin Jago Inggris!</h1>
          <p class="lede">Anak main sendiri, level naik sendiri — dari Little Stars (usia 3–5, sebelum Pre-A1) sampai Trailblazer (setara CEFR B1).</p>
          <div class="mk-offer">
            <p class="mk-offer-price">Rp 99.000</p>
            <p class="mk-offer-claim">Akses selamanya &amp; sekali bayar</p>
            <p class="mk-offer-note">Akses berlaku selama layanan InggrisinYuk Kids berjalan. Tanpa langganan &amp; biaya tambahan.</p>
          </div>
          <button class="cta pt-cta" type="button" data-action="landingRegister">🚀 Daftar &amp; Mulai Sekarang</button>
        </div>
      </section>

      <section class="landing-section" id="cara-kerja">
        <h2 class="h2">Cara Kerja</h2>
        <div class="landing-steps">${stepCards}</div>
      </section>

      <section class="landing-section" id="level">
        <h2 class="h2" style="margin-bottom:8px">6 Level, Ikuti Standar CEFR/Cambridge</h2>
        <p class="meta" style="text-align:center;max-width:72ch;margin:0 auto 8px;text-wrap:balance">CEFR = standar internasional tingkat kemampuan bahasa (Pre-A1 → A1 → A2 → B1, dst).</p>
        <p class="lede" style="text-align:center;max-width:60ch;margin:0 auto var(--s5)">Tiap level makin menantang, bukan materi yang itu-itu saja diulang — soal & format latihan ikut naik tingkat di tiap level, sama seperti ujian Cambridge asli.</p>
        <div class="landing-levels">${levelCards}</div>
      </section>

      <section class="landing-section" id="fitur">
        <h2 class="h2">Apa Aja yang Bisa Dipelajari?</h2>
        <div class="landing-feature-grid">${featureCards}</div>
      </section>

      <section class="landing-section">
        <h2 class="h2">Kata Orang Tua</h2>
        <div class="landing-testis">${testiCards}</div>
      </section>

      <section class="landing-section" id="faq">
        <h2 class="h2">Pertanyaan yang Sering Ditanyakan</h2>
        <div class="landing-faqs">${faqCards}</div>
      </section>

      <section class="landing-section">
        <div class="landing-bottomcta">
          <h2 class="h2">Yuk, Mulai Petualangan Bahasa Inggris Anak!</h2>
          <p class="lede">Semua level & semua skill, akses selamanya dengan sekali bayar — tanpa langganan bulanan.</p>
          <div class="mk-offer">
            <p class="mk-offer-price">Rp 99.000</p>
            <p class="mk-offer-claim">Akses selamanya &amp; sekali bayar</p>
            <p class="mk-offer-note">Akses berlaku selama layanan InggrisinYuk Kids berjalan.</p>
          </div>
          <button class="cta pt-cta" type="button" data-action="landingRegister">🚀 Daftar &amp; Mulai Sekarang</button>
        </div>
      </section>

      <footer class="standalone-footer">
        <div class="landing-footer-links">
          <a href="#cara-kerja">Cara Kerja</a>
          <a href="#level">Level</a>
          <a href="#fitur">Fitur</a>
          <a href="#faq">FAQ</a>
        </div>
        <p>© ${new Date().getFullYear()} InggrisinYuk Kids</p>
      </footer>
      ${stickyBuyBarHtml('landingRegister')}
      ${waFloatHtml('Halo Admin, saya tertarik dengan InggrisinYuk Kids. Boleh minta info lebih lanjut?')}
    </div>
  `;

  // Bar "Daftar" menempel — sembunyi saat tombol Daftar navbar/hero/bawah terlihat.
  wireStickyBuyBar(Array.from(root.querySelectorAll('.landing-page > :not(.mk-sticky) [data-action="landingRegister"]')));

  setHandlers({
    landingAccount: () => go('account'),
    landingRegister: () => go('register'),
  });
}

/* --------------------------------------------------------- akun orang tua -- */

/** Login/Daftar orang tua — murni opsional (PRD §14/§16), dibuka dari
 *  Pengaturan. Form sederhana, langsung ke `account.ts` (bukan gated-beli —
 *  checkout/Xendit masih backlog). */
/**
 * Login WAJIB (gerbang di render()) & passwordless (RESEARCH §16) — cuma no
 * HP/email yang SUDAH terdaftar. Tidak ada form daftar sendiri di sini: akun
 * cuma dibuat lewat sukses bayar (masih backlog, PRD §14) — sebelum itu
 * digarap, akun dibuat manual lewat `portal/prisma/seed.ts`.
 */
function renderAccount(): void {
  let error: string | null = null;
  let loading = false;

  function paint(): void {
    root.innerHTML = `
      <div class="login-page">
        <div class="login-sky" aria-hidden="true">
          <span class="cloud c1">${CLOUD}</span>
          <span class="cloud c2">${CLOUD}</span>
        </div>

        <main class="login-main">
          <div class="login-hero">
            <div class="login-mascot mascot-idle" aria-hidden="true">🦁</div>
            <h1 class="display">InggrisinYuk Kids</h1>
            <p class="lede">Masuk pakai no HP atau email yang sudah terdaftar.</p>
          </div>

          <div class="card login-card">
            ${error ? `<p class="meta" style="color:var(--try);margin-bottom:12px">${escapeHtml(error)}</p>` : ''}
            <div style="margin-bottom:16px">
              <label for="acIdentifier" class="meta" style="display:block;margin-bottom:4px">No HP atau Email</label>
              <input id="acIdentifier" class="text-input" type="text" placeholder="08123456789 atau nama@email.com" />
            </div>
            <button class="primary-btn" type="button" data-action="acSubmit" ${loading ? 'disabled' : ''}>${loading ? 'Memproses…' : 'Masuk'}</button>
            <p class="meta" style="margin-top:14px;text-align:center">Belum punya akun? <button type="button" class="auth-link" data-action="acRegister">Daftar di sini</button></p>
          </div>
        </main>

        <footer class="standalone-footer">
          <p>© ${new Date().getFullYear()} InggrisinYuk Kids</p>
        </footer>
        ${waFloatHtml('Halo Admin, saya butuh bantuan untuk masuk ke akun InggrisinYuk Kids.')}
      </div>
    `;

    setHandlers({
      acSubmit: () => {
        // Baca nilai input SEBELUM paint() (di dalam submit()) menimpa DOM-nya
        // dgn versi kosong buat status "Memproses…" — kalau dibaca setelahnya,
        // yang kebaca input baru yang masih kosong.
        const identifier = qs<HTMLInputElement>(root, '#acIdentifier').value.trim();
        void submit(identifier);
      },
      acRegister: () => go('register'),
    });
  }

  async function submit(identifier: string): Promise<void> {
    error = null;
    loading = true;
    paint();
    try {
      await apiLogin(identifier);
      await enterAfterLogin();
    } catch (err) {
      error = err instanceof ApiRequestError ? err.message : 'Gagal terhubung, coba lagi.';
      loading = false;
      paint();
    }
  }

  paint();
}

/** Sesudah token didapat (login ATAU lunas bayar): tarik status & progres
 *  akun, lalu ke Beranda — atau ke First Placement Test kalau belum. */
async function enterAfterLogin(): Promise<void> {
  await refreshChildStatus();
  await hydrateProgressFromServer(); // tarik progres akun ini (perangkat lain) & gabung ke lokal
  paintLevelChips(); // chip header/rail langsung pakai level akun ini, bukan default lama
  syncUnlocksFromAccount(); // peta ikut hasil tes akun ini walau tesnya dikerjakan di perangkat lain
  const status = getCachedChildStatus();
  go(status.placementTestDone ? 'home' : 'placementTest');
}

/** Pesanan yang sedang dibayar di Xendit — nama anak dipakai jadi sapaan
 *  "Hi {nama}" begitu lunas. Cuma di perangkat ini (kenyamanan saja). */
const PENDING_SIGNUP_KEY = 'inggrisinyuk-kids.pendingSignup.v1';

function readPendingSignup(): { orderId: string; childName: string } | null {
  try {
    const raw = localStorage.getItem(PENDING_SIGNUP_KEY);
    return raw ? (JSON.parse(raw) as { orderId: string; childName: string }) : null;
  } catch {
    return null;
  }
}

function writePendingSignup(value: { orderId: string; childName: string } | null): void {
  try {
    if (value) localStorage.setItem(PENDING_SIGNUP_KEY, JSON.stringify(value));
    else localStorage.removeItem(PENDING_SIGNUP_KEY);
  } catch {
    /* diabaikan dengan sengaja */
  }
}

/** Isi "Ringkasan Pesanan" — pola `OrderSummary` inggrisinyuk-app. */
const REGISTER_BENEFITS: string[] = [
  '5 skill: Vocabulary, Listening, Reading, Grammar, Speaking',
  '6 level, dari Little Stars (sebelum Pre-A1) sampai Trailblazer (setara B1)',
  'Tes naik level (Tantangan Raja) di akhir tiap level',
  '7 game seru di Game Hub',
  'First Placement Test untuk menentukan level awal anak',
  'Rapor untuk orang tua — skor tiap skill, kekuatan & misi berikutnya',
  'Akses selamanya & sekali bayar — tanpa biaya tambahan',
];

/** No WA bantuan InggrisinYuk Kids — tombol WA melayang di homepage, login & Daftar. */
const SUPPORT_WA = '6285169733727';

const SOCIAL_LINKS: { href: string; title: string; svg: string }[] = [
  {
    href: 'https://www.instagram.com/inggrisinyuk/',
    title: 'Instagram',
    svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r=".75" fill="currentColor" stroke="none"/></svg>',
  },
  {
    href: 'https://www.facebook.com/inggrisinyuk',
    title: 'Facebook',
    svg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>',
  },
  {
    href: 'https://www.tiktok.com/@inggrisinyuk',
    title: 'TikTok',
    svg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.79 1.54V6.76a4.85 4.85 0 0 1-1.03-.07z"/></svg>',
  },
  {
    href: 'https://www.linkedin.com/in/inggrisinyuk/',
    title: 'LinkedIn',
    svg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>',
  },
];

const WA_ICON =
  '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.64.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.61-.92-2.2-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.21 3.08c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.63.71.23 1.36.19 1.87.12.57-.09 1.76-.72 2.01-1.41.25-.7.25-1.29.17-1.41-.07-.13-.27-.2-.57-.35zM12.04 21.5h-.01a9.45 9.45 0 0 1-4.82-1.32l-.35-.21-3.58.94.96-3.49-.23-.36a9.43 9.43 0 0 1-1.45-5.03c0-5.22 4.25-9.47 9.48-9.47a9.4 9.4 0 0 1 6.7 2.78 9.4 9.4 0 0 1 2.77 6.7c0 5.23-4.25 9.46-9.47 9.46zm8.06-17.53A11.33 11.33 0 0 0 12.04.63C5.76.63.65 5.74.65 12.02c0 2 .52 3.96 1.52 5.69L.55 23.63l6.05-1.59a11.37 11.37 0 0 0 5.43 1.38h.01c6.28 0 11.39-5.11 11.39-11.39 0-3.04-1.18-5.9-3.33-8.06z"/></svg>';

/** Footer halaman beli (pola inggrisinyuk-app `/beli`): © + ikon sosial. */
function buyFooterHtml(): string {
  const icons = SOCIAL_LINKS.map(
    (l) => `<a href="${l.href}" target="_blank" rel="noopener noreferrer" title="${l.title}" aria-label="${l.title}">${l.svg}</a>`
  ).join('');
  return `
    <footer class="buy-footer">
      <p>© ${new Date().getFullYear()} InggrisinYuk Kids</p>
      <div class="buy-social">${icons}</div>
    </footer>`;
}

/** Bar "Daftar" yang menempel di bawah layar (HP/tablet) — dipakai homepage
 *  & /daftar. Catatan layanan WAJIB ikut krn ada klaim "akses selamanya". */
function stickyBuyBarHtml(action: string): string {
  return `
    <div class="mk-sticky is-hidden" id="mkSticky">
      <div class="mk-sticky-text">
        <p><b>Rp 99.000</b><span class="mk-sticky-sep"> · </span><span class="mk-sticky-claim">akses selamanya &amp; sekali bayar</span></p>
        <small>Selama layanan InggrisinYuk Kids berjalan.</small>
      </div>
      <button class="buy-submit" type="button" data-action="${action}">Daftar</button>
    </div>`;
}

/** Bar menempel muncul HANYA saat tidak ada satu pun pintu daftar lain
 *  (`targets`) yang terlihat di layar — permintaan user. */
function wireStickyBuyBar(targets: Element[]): void {
  const sticky = root.querySelector('#mkSticky');
  if (!sticky || targets.length === 0 || !('IntersectionObserver' in window)) return;
  const visible = new Set<Element>();
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) visible.add(e.target);
        else visible.delete(e.target);
      }
      sticky.classList.toggle('is-hidden', visible.size > 0);
    },
    { threshold: 0.15 }
  );
  targets.forEach((t) => io.observe(t));
}

function waFloatHtml(message: string): string {
  return `<a class="wa-float" href="https://wa.me/${SUPPORT_WA}?text=${encodeURIComponent(message)}" target="_blank" rel="noopener noreferrer" aria-label="Chat via WhatsApp">${WA_ICON}</a>`;
}

/** Konten marketing halaman Daftar (permintaan user: "konsepnya mirip
 *  landing page — munculkan dulu kelebihannya, baru di bawah beli"). Pola
 *  PAS → manfaat → cara mulai → nilai → beli → FAQ. Tetap lensa kid-friendly
 *  (CLAUDE.md): tanpa hitung mundur/stok palsu/urgensi, harga ditampilkan
 *  polos, teks singkat. */
const REGISTER_PAINS: { emoji: string; pain: string; fix: string }[] = [
  { emoji: '😴', pain: 'Bosan dengan hafalan', fix: 'Tiap materi jadi misi petualangan, anak penasaran ingin lanjut.' },
  { emoji: '😟', pain: 'Takut salah & malu ngomong', fix: 'Tidak ada nilai gagal — selalu dapat semangat & boleh coba lagi.' },
  { emoji: '🤔', pain: 'Orang tua bingung progresnya', fix: 'Rapor menunjukkan skor tiap skill & yang perlu dilatih.' },
];

const REGISTER_FEATURES: { emoji: string; title: string; desc: string }[] = [
  { emoji: '🎮', title: 'Belajar Lewat Petualangan', desc: 'Peta Level, misi seru, & 7 game di tiap perjalanan.' },
  { emoji: '🎯', title: 'Mulai dari Level yang Pas', desc: 'Placement Test menentukan titik mulai anak.' },
  { emoji: '📚', title: '5 Skill Lengkap', desc: 'Vocabulary, Listening, Reading, Grammar, Speaking.' },
  { emoji: '🎤', title: 'Berani Ngomong', desc: 'Latihan bicara lewat mic & dengar ulang suaranya sendiri.' },
  { emoji: '🗺️', title: '6 Level ala Cambridge', desc: 'Little Stars (usia 3–5, sebelum Pre-A1) sampai Trailblazer (setara B1).' },
  { emoji: '📊', title: 'Rapor Orang Tua', desc: 'Kekuatan anak, misi berikutnya, & kata yang masih dilatih.' },
];

const REGISTER_STEPS: { title: string; desc: string }[] = [
  { title: 'Daftar & bayar', desc: 'Isi 3 data, bayar lewat QRIS, e-wallet, atau VA.' },
  { title: 'Placement Test', desc: 'Tes singkat yang seru untuk menentukan level awal.' },
  { title: 'Main tiap hari', desc: 'Cukup 10–15 menit sehari, level naik sendiri.' },
];

const REGISTER_VALUES: string[] = ['Tanpa langganan bulanan', 'Tanpa biaya per level', 'Tanpa iklan', 'Semua level & skill', '1 akun untuk keluarga'];

/**
 * Halaman Daftar (tombol "Daftar" homepage) — tata letak MENGIKUTI `/beli`
 * inggrisinyuk-app (permintaan user): "← Kembali ke Beranda", 2 kartu —
 * form (kiri) & Ringkasan Pesanan (kanan, sticky); di HP ringkasan di ATAS
 * form. Isian cukup 3 (permintaan user): nama anak, email & no WA orang tua
 * → `startCheckout` → halaman bayar Xendit. Akun dibuat portal saat lunas.
 */
function renderRegister(): void {
  let error: string | null = null;
  let alreadyRegistered = false;
  let loading = false;
  const values = { childName: '', email: '', phone: '' };

  function field(id: string, label: string, attrs: string, value: string, hint: string, hintClass = ''): string {
    return `
      <div class="buy-field">
        <label for="${id}">${label} <span class="buy-req" aria-hidden="true">*</span></label>
        <input id="${id}" class="buy-input" required ${attrs} value="${escapeHtml(value)}" ${loading ? 'disabled' : ''} />
        <p class="buy-hint ${hintClass}">${hint}</p>
      </div>`;
  }

  function paint(): void {
    const benefits = REGISTER_BENEFITS.map(
      (b) => `<li><span class="buy-check" aria-hidden="true">✓</span><span>${b}</span></li>`
    ).join('');
    const pains = REGISTER_PAINS.map(
      (p) => `
        <div class="buy-card mk-pain">
          <span class="mk-pain-ic" aria-hidden="true">${p.emoji}</span>
          <p class="mk-pain-title">${p.pain}</p>
          <p class="mk-pain-fix"><span aria-hidden="true">✓</span> ${p.fix}</p>
        </div>`
    ).join('');
    const features = REGISTER_FEATURES.map(
      (f) => `
        <div class="buy-card mk-feature">
          <span class="mk-feature-ic" aria-hidden="true">${f.emoji}</span>
          <p class="mk-feature-title">${f.title}</p>
          <p class="mk-feature-desc">${f.desc}</p>
        </div>`
    ).join('');
    const steps = REGISTER_STEPS.map(
      (st, i) => `
        <li class="mk-step">
          <span class="mk-step-num" aria-hidden="true">${i + 1}</span>
          <div><p class="mk-step-title">${st.title}</p><p class="mk-step-desc">${st.desc}</p></div>
        </li>`
    ).join('');
    const valueChips = REGISTER_VALUES.map((v) => `<li><span aria-hidden="true">✓</span> ${v}</li>`).join('');
    const faqs = LANDING_FAQS.slice(0, 5)
      .map((f) => `<details class="buy-card mk-faq"><summary>${f.q}</summary><p>${f.a}</p></details>`)
      .join('');

    root.innerHTML = `
      <div class="buy-page">
        <main class="buy-main">
          <div class="buy-wrap">
            <button class="buy-back" type="button" data-action="regBack">← Kembali ke Beranda</button>

            <section class="mk-hero">
              <span class="mk-mascot mascot-idle" aria-hidden="true">🦁</span>
              <p class="mk-eyebrow">Untuk anak usia 3–13 tahun</p>
              <h1 class="mk-h1">Ajak Anak Berpetualang Jadi Jago Bahasa Inggris</h1>
              <p class="mk-lede">Tiap level adalah petualangan baru. Anak menjelajah sendiri, orang tua tinggal pantau hasilnya di Rapor.</p>
              <div class="mk-offer">
                <p class="mk-offer-price">Rp 99.000</p>
                <p class="mk-offer-claim">Akses selamanya &amp; sekali bayar</p>
                <p class="mk-offer-note">Akses berlaku selama layanan InggrisinYuk Kids berjalan.</p>
              </div>
              <button class="buy-submit mk-cta" type="button" data-action="regCta">🚀 Daftar Sekarang</button>
              <p class="mk-trust">Bayar aman lewat QRIS, e-wallet, atau VA</p>
            </section>

            <section class="mk-section">
              <h2 class="mk-h2">Belajar Bahasa Inggris Sering Bikin Anak…</h2>
              <div class="mk-grid-3">${pains}</div>
            </section>

            <section class="mk-section">
              <h2 class="mk-h2">Kenapa InggrisinYuk Kids?</h2>
              <div class="mk-grid-feat">${features}</div>
            </section>

            <section class="mk-section">
              <h2 class="mk-h2">Mulai dalam 3 Langkah</h2>
              <ol class="mk-steps">${steps}</ol>
            </section>

            <section class="mk-section">
              <div class="buy-card mk-value">
                <p class="mk-value-title">Akses selamanya &amp; sekali bayar</p>
                <ul class="mk-value-list">${valueChips}</ul>
              </div>
            </section>

            <section class="mk-section mk-buy" id="beli">
              <h2 class="mk-h2">Yuk, Mulai Petualangannya!</h2>
            <div class="buy-grid">
              <aside class="buy-card buy-summary" aria-label="Ringkasan pesanan">
                <h2 class="buy-summary-title">Ringkasan Pesanan</h2>
                <p class="buy-product">InggrisinYuk Kids — Akses Selamanya</p>
                <ul class="buy-benefits">${benefits}</ul>
                <div class="buy-divider"></div>
                <div class="buy-total"><span>Total</span><b>Rp 99.000</b></div>
              </aside>

              <section class="buy-card buy-form">
                <h2 class="buy-title">Akses Selamanya — Rp 99.000</h2>
                <p class="buy-lede">Isi data di bawah untuk membuat akun. Pembayaran diproses aman.</p>
                <div class="buy-fields">
                  ${field('regChild', 'Nama Anak', 'type="text" maxlength="40" autocomplete="off" placeholder="contoh: Aisyah"', values.childName, 'Dipakai untuk menyapa anak di aplikasi')}
                  ${field('regEmail', 'Email Orang Tua', 'type="email" autocomplete="email" inputmode="email" placeholder="contoh: bunda@email.com"', values.email, 'Bukti pembayaran dikirim ke email ini')}
                  ${field('regPhone', 'Nomor WhatsApp Orang Tua', 'type="tel" autocomplete="tel" inputmode="numeric" placeholder="contoh: 08123456789"', values.phone, 'Pastikan benar — digunakan sebagai kunci login kamu', 'is-warn')}
                </div>
                ${
                  error
                    ? `<div class="buy-error" role="alert"><span aria-hidden="true">⚠️</span><p>${escapeHtml(error)}${
                        alreadyRegistered ? ` <button type="button" class="auth-link" data-action="regLogin">Masuk di sini</button>` : ''
                      }</p></div>`
                    : ''
                }
                <button class="buy-submit" type="button" data-action="regSubmit" ${loading ? 'disabled' : ''}>${
                  loading ? '<span class="buy-spin" aria-hidden="true"></span> Membuat pesanan...' : 'Bayar Sekarang — Rp 99.000'
                }</button>
                <p class="buy-note buy-note-access">Catatan: akses selamanya berlaku selama layanan InggrisinYuk Kids berjalan.</p>
                <p class="buy-note">Kamu akan diarahkan ke halaman pembayaran (QRIS, e-wallet, atau VA)</p>
                <p class="buy-note">Dengan melanjutkan, kamu setuju dengan syarat &amp; ketentuan InggrisinYuk Kids</p>
                <p class="buy-note">Sudah punya akun? <button type="button" class="auth-link" data-action="regLogin">Masuk</button></p>
              </section>
            </div>
            </section>

            <section class="mk-section">
              <h2 class="mk-h2">Pertanyaan yang Sering Ditanyakan</h2>
              <div class="mk-faqs">${faqs}</div>
            </section>
          </div>
        </main>
        ${buyFooterHtml()}
        ${stickyBuyBarHtml('regCta')}
        ${waFloatHtml('Halo Admin, saya ingin mendaftar InggrisinYuk Kids. Boleh minta info lebih lanjut?')}
      </div>
    `;

    // Bar "Daftar" menempel — sembunyi saat tombol hero atau bagian beli terlihat.
    wireStickyBuyBar(Array.from(root.querySelectorAll('.mk-cta, #beli')));

    setHandlers({
      regBack: () => go('landing'),
      regLogin: () => go('account'),
      regCta: () => {
        const smooth = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        root.querySelector('#beli')?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto', block: 'start' });
        window.setTimeout(() => qs<HTMLInputElement>(root, '#regChild').focus({ preventScroll: true }), smooth ? 500 : 0);
      },
      regSubmit: () => {
        // Baca SEBELUM paint() menimpa DOM (pola sama renderAccount).
        values.childName = qs<HTMLInputElement>(root, '#regChild').value.trim();
        values.email = qs<HTMLInputElement>(root, '#regEmail').value.trim();
        values.phone = qs<HTMLInputElement>(root, '#regPhone').value.trim();
        void submit();
      },
    });
  }

  async function submit(): Promise<void> {
    alreadyRegistered = false;
    if (!values.childName || !values.email || !values.phone) {
      error = 'Isi ketiga data dulu, ya.';
      paint();
      return;
    }
    error = null;
    loading = true;
    paint();
    try {
      const { invoiceUrl, orderId } = await startCheckout(values);
      writePendingSignup({ orderId, childName: values.childName });
      window.location.href = invoiceUrl;
    } catch (err) {
      error = err instanceof ApiRequestError ? err.message : 'Gagal terhubung, coba lagi.';
      alreadyRegistered = err instanceof ApiRequestError && err.data.alreadyRegistered === true;
      loading = false;
      paint();
    }
  }

  paint();
}

/**
 * Kembali dari halaman bayar Xendit (`/pembayaran?orderId=`) — polling portal
 * tiap 2 dtk sampai webhook menandai lunas, lalu otomatis masuk. Tata letak &
 * alur mengikuti `/payment/success` inggrisinyuk-app (kartu kecil di tengah).
 */
function renderPayment(): void {
  const orderId = state.orderId ?? readPendingSignup()?.orderId ?? null;
  const startedAt = Date.now();
  const MAX_WAIT_MS = 10 * 60 * 1000;

  function paint(icon: string, title: string, desc: string, actions = ''): void {
    root.innerHTML = `
      <div class="buy-page">
        <main class="buy-main pay-main">
          <div class="pay-wrap">
            <p class="pay-brand">InggrisinYuk Kids</p>
            <div class="buy-card pay-card" aria-live="polite">
              <div class="pay-icon" aria-hidden="true">${icon}</div>
              <p class="pay-title">${title}</p>
              <p class="pay-desc">${desc}</p>
              ${actions}
            </div>
          </div>
        </main>
        ${buyFooterHtml()}
      </div>
    `;
  }

  const backToRegister = `<button class="auth-link" type="button" data-action="payRegister">Kembali ke halaman pembelian</button>`;
  const toLogin = `<button class="buy-submit" type="button" data-action="payLogin">Masuk</button>`;
  setHandlers({ payRegister: () => go('register'), payLogin: () => go('account') });

  if (!orderId) {
    paint('<span class="pay-x">✕</span>', 'Order tidak ditemukan', 'Silakan ulangi dari halaman pembelian.', backToRegister);
    return;
  }

  paint('<span class="buy-spin is-lg"></span>', 'Memverifikasi pembayaran...', 'Mohon tunggu sebentar, jangan tutup halaman ini.');

  const poll = async (): Promise<void> => {
    if (state.screen !== 'payment') return; // sudah pindah layar
    let status;
    try {
      status = await finalizeCheckout(orderId);
    } catch {
      status = 'pending' as const; // internet putus sebentar — coba lagi
    }
    if (state.screen !== 'payment') return;

    if (status === 'success') {
      const pending = readPendingSignup();
      if (pending?.childName && !getName()) setName(pending.childName);
      writePendingSignup(null);
      paint('<span class="pay-ok">✓</span>', 'Pembayaran berhasil!', 'Mengarahkan kamu ke aplikasi...');
      await enterAfterLogin();
      return;
    }
    if (status === 'claimed') {
      writePendingSignup(null);
      paint('<span class="pay-ok">✓</span>', 'Akun sudah aktif', 'Masuk pakai no WhatsApp atau email yang didaftarkan.', toLogin);
      return;
    }
    if (status === 'expired' || status === 'failed' || status === 'not_found') {
      writePendingSignup(null);
      const title = status === 'expired' ? 'Invoice sudah kedaluwarsa' : status === 'failed' ? 'Pembayaran gagal' : 'Order tidak ditemukan';
      paint('<span class="pay-x">✕</span>', title, 'Silakan ulangi dari halaman pembelian.', backToRegister);
      return;
    }
    if (Date.now() - startedAt > MAX_WAIT_MS) {
      paint(
        '<span class="pay-wait">⏳</span>',
        'Pembayaran belum terkonfirmasi',
        'Kalau sudah bayar, tunggu beberapa menit lalu cek lagi.',
        `<button class="buy-submit" type="button" data-action="payReload">Cek Lagi</button>`
      );
      setHandlers({ payReload: () => location.reload() });
      return;
    }
    window.setTimeout(() => void poll(), 2000);
  };
  void poll();
}

/* --------------------------------------------------------- placement test -- */

function renderPlacementTestScreen(): void {
  // Jawaban belum tersimpan ke mana pun sampai submit sukses (§"max 2
  // kali") — kalau anak tap balik/nav lain SAAT ini true, tampilkan
  // konfirmasi dulu (permintaan user) bukan langsung keluar & kehilangan
  // progres diam-diam.
  let testInProgress = false;

  function confirmExit(leave: () => void): void {
    if (!testInProgress) {
      leave();
      return;
    }
    placementGame.renderExitConfirm(
      () => {
        /* "Yuk Lanjut" — overlay sudah ditutup sendiri, tidak perlu apa-apa lagi di sini */
      },
      () => {
        testInProgress = false;
        leave();
      }
    );
  }

  function shell(): HTMLDivElement {
    root.innerHTML = `
      <div class="act-head">
        <button class="iconbtn" type="button" data-action="backToHome" aria-label="Kembali ke Beranda">${ICON_BACK}</button>
        <div class="txt">
          <h1>First Placement Test</h1>
          <div class="sub"><span class="meta">Nentuin titik mulai yang paling pas buat kamu.</span></div>
        </div>
      </div>
      <div class="card" style="max-width:480px" id="stage"></div>
      <footer class="standalone-footer">
        <p>© ${new Date().getFullYear()} InggrisinYuk Kids</p>
      </footer>
    `;
    // Rail/tabbar disembunyikan total lewat body.is-placement-test (CSS) —
    // tidak perlu lagi digerbang di sini, satu-satunya jalan keluar yang
    // masih kelihatan/bisa di-tap cuma tombol balik ini.
    setHandlers({ backToHome: () => confirmExit(() => go('home')) });
    return qs<HTMLDivElement>(root, '#stage');
  }

  function toContinue(levelRecommended: string | undefined, totalCorrect?: number, totalItems?: number): void {
    if (levelRecommended) {
      unlockLevelsUpTo(levelRecommended);
      paintLevelChips(); // chip header/rail langsung ikut level baru, bukan nunggu layar lain ke-render
      const stage = qs<HTMLDivElement>(root, '#stage');
      placementGame.renderPlacementResult(
        stage,
        levelRecommended,
        () => go('home'),
        totalCorrect,
        totalItems
      );
    } else {
      go('home');
    }
  }

  function paintIntro(): void {
    const stage = shell();
    placementGame.renderPlacementIntro(
      stage,
      () => paintQuestions(),
      () => {
        void (async () => {
          stage.innerHTML = `<p class="lede">Menyimpan…</p>`;
          const outcome = await placementGame.doSkipPlacementTest();
          if (outcome.error) {
            stage.innerHTML = `<p class="meta" style="color:var(--try)">${escapeHtml(outcome.error)}</p>`;
            return;
          }
          paintLevelChips();
          go('home');
        })();
      }
    );
  }

  function paintQuestions(): void {
    testInProgress = true;
    const stage = qs<HTMLDivElement>(root, '#stage');
    placementGame.runPlacementQuestions(stage, (outcome) => {
      testInProgress = false;
      if (outcome.error) {
        stage.innerHTML = `<p class="meta" style="color:var(--try)">${escapeHtml(outcome.error)}</p>`;
        return;
      }
      toContinue(outcome.levelRecommended, outcome.totalCorrect, outcome.totalItems);
    });
  }

  if (!isLoggedIn()) {
    go('account');
    return;
  }

  // Maks 2 percobaan (§"max 2 kali") — dicek di sini, SEBELUM anak masuk ke
  // intro/soal, supaya tidak ada dead-end setelah anak selesai mengerjakan
  // semuanya (server tetap re-cek juga saat submit, ini cuma UX di depan).
  const { level: cachedLevel, placementAttemptsRemaining } = getCachedChildStatus();
  if (placementAttemptsRemaining <= 0) {
    const stage = shell();
    placementGame.renderPlacementLimitReached(stage, cachedLevel ?? undefined, () => go('home'));
    return;
  }

  paintIntro();
}

/* ------------------------------------------------------------ peta level -- */
/**
 * Konsep dipinjam dari "Peta Anglora" (World Map) + "Duel Verifikasi" di
 * `inggrisinyuk` (dewasa, project terpisah) — lihat catatan lengkap di
 * games/boss.ts. Aturan buka/kunci dihitung murni dari `levelUnlockMap`
 * (progress.ts): level berikutnya biasanya terkunci sampai Bos level ini
 * ditaklukkan, TAPI anak juga boleh langsung mencoba Bos level yang terkunci
 * itu sendiri untuk membukanya lebih awal (skip-ahead) — versi ramah-anak,
 * tanpa bayar & tanpa AI, dari mekanik yang sama.
 *
 * REVISI (PRD §12.1/§16): skip-ahead sekarang SEQUENTIAL, bukan bebas ke
 * level manapun — cuma level terkunci PERTAMA (persis di depan batas
 * terbuka) yang boleh ditantang duluan, lihat `firstLockedIndex` di
 * `renderHome`. Cara lain untuk melompat lebih jauh: Placement Test
 * (`renderPlacementTestScreen`/`unlockLevelsUpTo`) — hasilnya menandai Bos
 * semua level di bawah rekomendasi sebagai "ditaklukkan" sekaligus.
 */
/**
 * Perhentian tempat anak berada sekarang ("Kamu di sini" + 🦁 di peta penuh
 * & strip peta Beranda). Hasil placement test WAJIB sinkron dengan peta
 * (dilaporkan user 2x: rekomendasi "Adventurer" tapi peta nunjuk perhentian
 * lain) — jadi rekomendasi itu dipakai langsung sebagai JANGKAR, bukan cuma
 * diharapkan muncul sendiri dari efek samping `bossCleared`:
 *
 *  A) ADA hasil placement test (`placementAnchorLevel`) → mulai mencari dari
 *     level rekomendasi itu, JANGAN dari awal tangga. Praktisnya ini bikin
 *     "Kamu di sini" jatuh PERSIS di level yang direkomendasikan (level di
 *     bawahnya sudah ditandai taklukkan oleh `unlockLevelsUpTo`), dan cuma
 *     bergerak lebih maju kalau anak sendiri sudah menaklukkan Bos level itu
 *     — progres nyata, bukan kebobolan. Dulu jangkar ini tidak ada, jadi
 *     hasilnya ditentukan lapis (B) di bawah dan bisa menyimpang ke depan
 *     (level rekomendasi tanpa materi ikut terlewat) maupun ke belakang
 *     (rekomendasi Starter tapi peta nunjuk Explorer). Kalau level jangkarnya
 *     ternyata belum terbuka (mis. localStorage progres kosong DAN
 *     `syncUnlocksFromAccount` belum/ tidak bisa jalan — storage diblokir di
 *     mode privat), jangkar diabaikan & jatuh ke (B) — lebih baik nunjuk
 *     perhentian yang beneran terbuka daripada yang masih tergembok.
 *  B) BELUM pernah tes / tes di-skip → perilaku default lama: level terbuka
 *     pertama yang materinya ADA & Bos-nya belum ditaklukkan (akun baru
 *     otomatis ke Explorer, bukan nyangkut di Little Stars/Starter yang cuma
 *     placeholder), lalu perhentian terbuka berikutnya apa pun jenisnya,
 *     lalu—sebagai jaring terakhir—perhentian terbuka terjauh. Lapis kedua
 *     ini penting supaya tidak lompat ke ujung tangga cuma karena rantai
 *     pass-through `hasContent:false` (progress.ts `levelUnlockMap`) ikut
 *     membuka perhentian di depan.
 *
 * Perhentian tanpa materi tetap jujur ke anak lewat kartu "Sudah terbuka!
 * Materinya masih disiapkan, tunggu ya." (lihat `stops` di bawah) — bukan
 * dead-end/tombol mati. Murni turunan dari data yang sudah ada — tidak
 * menyimpan apa pun.
 */
function currentStopKey(unlocked: Record<string, boolean>): LevelKey | null {
  const openUncleared = (levels: readonly LevelMeta[]): LevelMeta | undefined =>
    levels.find((l) => unlocked[l.key] && !isBossCleared(l.key));
  const lastOpenOf = (levels: readonly LevelMeta[]): LevelMeta | undefined =>
    levels.filter((l) => unlocked[l.key]).pop();

  const anchor = placementAnchorLevel();
  const anchorIdx = anchor ? LEVELS.findIndex((l) => l.key === anchor) : -1;
  if (anchorIdx >= 0 && unlocked[LEVELS[anchorIdx].key]) {
    const fromAnchor = LEVELS.slice(anchorIdx);
    const stop = openUncleared(fromAnchor) ?? lastOpenOf(fromAnchor);
    if (stop) return stop.key;
  }

  const nextPlayable = LEVELS.find((l) => l.hasContent && unlocked[l.key] && !isBossCleared(l.key));
  if (nextPlayable) return nextPlayable.key;
  const nextFrontier = openUncleared(LEVELS);
  if (nextFrontier) return nextFrontier.key;
  const lastOpen = lastOpenOf(LEVELS);
  return lastOpen ? lastOpen.key : null;
}

/* ------------------------------------------- perhentian: materi belum ada -- */
/**
 * Layar perhentian yang SUDAH terbuka tapi materinya belum diauthoring
 * (`hasContent:false` di content.ts — v1 cuma Explorer yang punya materi).
 *
 * Kenapa perlu layar sendiri: sejak `currentStopKey` berjangkar ke hasil First
 * Placement Test, "Kamu di sini" bisa mendarat PERSIS di perhentian seperti
 * ini (mis. rekomendasi Adventurer) — jadi ini titik pendaratan nyata anak,
 * bukan lagi kasus pinggiran. Kartu peta yang cuma berisi teks tanpa tombol
 * kelihatan setengah jadi di posisi sepenting itu.
 *
 * Yang TIDAK dilakukan di sini (sengaja): tidak ada materi/kegiatan palsu &
 * tidak ada tombol mati — content.ts sudah mematok "placeholder jujur, bukan
 * link mati atau konten palsu", dan CLAUDE.md melarang navigasi bohong.
 * Yang dilakukan: rayakan bahwa perhentian ini memang MILIK anak, jelaskan apa
 * adanya bahwa kegiatannya masih dibikin (tanpa bahasa gagal/evaluatif), dan
 * selalu sediakan jalan lanjut yang nyata — main di perhentian yang materinya
 * sudah siap, atau balik ke peta (CLAUDE.md poin 4: tanpa layar dead-end).
 *
 * Begitu level ini diauthoring (`hasContent:true`), layar ini otomatis tidak
 * pernah tampil lagi untuk level itu — tombol di peta berubah sendiri jadi
 * "Buka Menu Belajar", dan URL lama diarahkan ke Menu Belajar (lihat guard di
 * bawah). Tidak ada yang perlu dihapus manual.
 */
function renderLevelSoon(): void {
  const level = LEVELS.find((l) => l.key === state.soonLevel);
  // URL diketik/di-bookmark manual: key ngawur → balik ke peta; level yang
  // materinya SUDAH ada → antar ke Menu Belajar. Jangan pernah bilang "materi
  // belum siap" untuk level yang sebenarnya sudah siap (bohong ke arah
  // sebaliknya).
  if (!level) {
    go('home');
    return;
  }
  if (level.hasContent) {
    go('menu', { viewLevel: level.key });
    return;
  }

  // Perhentian yang materinya SUDAH siap (v1: Explorer) — dibaca dari data,
  // bukan di-hardcode, supaya ikut sendiri begitu level lain diauthoring.
  const ready = LEVELS.find((l) => l.hasContent);

  root.innerHTML = `
    <div class="screen-head">
      <button class="iconbtn" type="button" data-action="backToHome" aria-label="Kembali ke Peta Level">${ICON_BACK}</button>
      <div class="txt">
        <h1>${level.emoji} ${level.name}</h1>
        <p>Markas ini sudah terbuka — kegiatan belajarnya masih disiapkan.</p>
      </div>
    </div>

    <section class="two-col">
      <div class="stack">
        <div class="card" style="text-align:center">
          <span class="stage-badge">🚧 Sedang Disiapkan</span>
          <div style="font-size:56px;line-height:1;margin:14px 0 6px" aria-hidden="true"><span class="mascot-idle">${level.emoji}</span></div>
          <h2 class="h2" style="margin-bottom:8px">Kegiatannya masih dibikin, ya!</h2>
          <p class="lede" style="margin-bottom:10px">Kamu sudah sampai di markas <b>${level.name}</b> — keren banget! 🎉 Kegiatan belajar khusus markas ini masih dibikin, jadi belum bisa dimainkan sekarang.</p>
          <p class="meta" style="margin-bottom:18px">Santai aja: markas ini tetap punya kamu 🎈 — nggak bakal hilang. Mampir lagi nanti ya!</p>
          ${
            ready
              ? `<button class="primary-btn" type="button" data-action="soonOpenReady">${ready.emoji} Main di ${ready.name} Dulu</button>`
              : ''
          }
          <button class="ghost-btn" type="button" data-action="backToHome">🗺️ Balik ke Peta Level</button>
        </div>
      </div>

      <aside class="stack">
        <div class="card note-card">
          <div class="card-title">Yang sudah bisa dimainkan</div>
          <ul class="set-list">
            <li><span><b>📋 Menu Belajar${ready ? ` di ${ready.emoji} ${ready.name}` : ''}</b> — 4 kegiatan lengkap, plus bintang &amp; Tantangan Raja.</span></li>
            <li><span><b>🎮 Game</b> — main bebas kapan saja, ulang kegiatan yang sudah kamu buka.</span></li>
            <li><span><b>🗺️ Peta Level</b> — lihat semua markas &amp; posisimu sekarang.</span></li>
          </ul>
        </div>
      </aside>
    </section>
  `;

  setHandlers({
    backToHome: () => go('home'),
    soonOpenReady: () => go('menu', { viewLevel: ready?.key ?? null }),
  });
}

/* --------------------------------------------------------- tantangan bos -- */

function renderBoss(): void {
  const levelKey = (state.bossLevel ?? 'explorer') as LevelKey;
  const level = LEVELS.find((l) => l.key === levelKey);

  if (!level) {
    // Jaga-jaga murni (key tidak valid) — seharusnya tidak pernah kejadian
    // karena tombol Tantangan Bos selalu dikirim dengan LevelKey asli dari Peta Level.
    root.innerHTML = `
      <div class="screen-head">
        <button class="iconbtn" type="button" data-action="backToHome" aria-label="Kembali ke Peta Level">${ICON_BACK}</button>
        <div class="txt"><h1>Tantangan Raja</h1><p>Level ini tidak ditemukan — coba lewat Peta Level lagi ya.</p></div>
      </div>`;
    setHandlers({ backToHome: () => go('home') });
    return;
  }

  // Arena = kepala panggung Raja. 🔒 Tes akhir level (`materi/test_level.md`):
  // 5 babak dikerjakan satu-satu di `#stage` (`games/boss.ts`), naik level
  // kalau ke-4 babak utama ≥ 80%. Estimasi waktu = info, bukan hitung mundur.
  const [estMin, estMax] = bossGame.estimatedMinutesFor(levelKey);
  const subLine = 'Lolos 4 babak utama (benar 80%), level berikutnya kebuka!';

  root.innerHTML = `
    <div class="act-head">
      <button class="iconbtn" type="button" data-action="exitBoss" aria-label="Keluar dari Tantangan ${BOSS_NAME[levelKey]}">${ICON_BACK}</button>
      <div class="txt">
        <h1>${level.emoji} 🏰 Markas ${BOSS_NAME[levelKey]}</h1>
        <div class="sub"><span class="meta">${subLine}</span></div>
      </div>
    </div>
    <div class="boss-arena">
      <span class="cloud" aria-hidden="true">${CLOUD}</span>
      ${HILLS_RIDGE}
      <div class="sunburst" aria-hidden="true"><span class="face mascot-idle">${BOSS_AVATAR[levelKey]}</span><span class="crown">👑</span></div>
      <div class="boss-arena-body">
        <span class="eyebrow" style="color:#7A4A08">Arena Tantangan</span>
        <h2>${BOSS_NAME[levelKey]} sudah siap main!</h2>
        <p>5 babak — pilih mau mulai dari mana. Santai, ±${estMin}–${estMax} menit semuanya.</p>
      </div>
    </div>
    <div class="card boss-stage" id="stage"></div>
    <footer class="standalone-footer">
      <p>© ${new Date().getFullYear()} InggrisinYuk Kids</p>
    </footer>
  `;

  // 🔒 Pop up keluar HANYA saat sedang mengerjakan soal (CLAUDE.md § Pop Up
  // Konfirmasi Keluar) — `games/boss.ts` set flag `true` di layar soal
  // (dgn jalan pulang = daftar babak), `false` di Arena/hasil. "Keluar" dari
  // soal = balik ke daftar babak (kemajuan tersimpan), dari Arena = Peta Level.
  setGameRoundActive(false);
  setHandlers({
    exitBoss: () => {
      if (!isGameRoundActive()) {
        go('home');
        return;
      }
      const toHub = getGameMapReturn();
      placementGame.renderExitConfirm(
        () => {
          /* "Yuk Lanjut" — overlay sudah menutup dirinya sendiri */
        },
        () => {
          stopSpeaking();
          if (toHub) toHub();
          else go('home');
        }
      );
    },
  });

  bossGame.runBoss(
    qs<HTMLDivElement>(root, '#stage'),
    {
      onWin: (result) => {
        setGameRoundActive(false);
        markBossCleared(levelKey);
        paintLevelChips(); // naik level → header/rail langsung ikut
        addXp(XP_BOSS);
        requestSync();
        renderBossWin(levelKey, result);
      },
      onPractice: (skill, topicId) => {
        const idx = topicsForSkill(skill, levelKey).findIndex((t) => t.id === topicId);
        if (idx < 0) return;
        go('activity', { skillKey: skill, topicIndex: idx, step: 1, viewLevel: levelKey });
      },
    },
    levelKey
  );
}

function renderBossWin(levelKey: LevelKey, result: bossGame.BossResult): void {
  const stage = qs<HTMLDivElement>(root, '#stage');
  const index = LEVELS.findIndex((l) => l.key === levelKey);
  const wonLevel = LEVELS[index]!;
  const nextLevel = LEVELS[index + 1];
  const nextUnlocked = nextLevel ? !!levelUnlockMap(LEVELS)[nextLevel.key] : false;

  // Kalau level yang baru ditaklukkan belum punya materi sendiri, jelaskan
  // eksplisit apa yang berubah (jalurnya kebuka) dan apa yang belum (belum ada
  // menu belajar buat level ini) — supaya menang tidak terasa seperti bug
  // ("kok gak ada apa-apa di sini").
  const wonLine = !wonLevel.hasContent
    ? `<p class="done-sub">Jalur ke <b>${wonLevel.emoji} ${wonLevel.name}</b> sudah kebuka. Materi belajarnya sendiri masih disiapkan — untuk sekarang, lanjut aja ke markas berikutnya lewat Peta Level.</p>`
    : '';

  const nextLine =
    nextLevel && nextUnlocked
      ? `<p class="done-sub">Level <b>${nextLevel.emoji} ${nextLevel.name}</b> baru kebuka! ${
          nextLevel.hasContent
            ? 'Yuk lanjut ke sana lewat Peta Level.'
            : // Bukan lagi cuma keterangan mati dalam tanda kurung: markasnya
              // sekarang punya layar sendiri (`renderLevelSoon`), yang dibuka dari
              // tombol "Intip Markas Ini" di Peta Level — jadi arahkan ke situ.
              'Kegiatannya masih dibikin — intip markasnya di Peta Level ya.'
        }</p>`
      : '';

  // Skor terbaik tiap babak (1–5 bintang, pola shields Cambridge YLE).
  const scoreRows = (['vocabulary', 'listening', 'reading', 'grammar', 'speaking'] as SkillKey[])
    .map((key) => {
      const pct = result[key];
      if (pct === null) return '';
      return `<li><span class="stat-list-ic" aria-hidden="true">${SKILL_META[key].emoji}</span><span class="stat-list-label">${SKILL_META[key].label}${key === 'speaking' ? ' (bonus)' : ''}</span><span class="stat-list-value">${skillStarsHtml(pct)}</span></li>`;
    })
    .join('');
  const gold = (['vocabulary', 'listening', 'reading', 'grammar'] as SkillKey[]).every((k) => (result[k] ?? 0) >= 95);
  const scoreCard = scoreRows ? `<div class="card"><span class="eyebrow">🌟 Hasil Petualanganmu</span><ul class="stat-list">${scoreRows}</ul></div>` : '';

  stage.innerHTML = `
    <div class="done-wrap win">
      <div class="boss-burst" aria-hidden="true"><span>⭐</span><span>✨</span><span>⭐</span><span>🎉</span><span>✨</span><span>🎊</span><span>⭐</span><span>🎉</span><span>✨</span></div>
      <div class="sunburst lg mascot-pop" aria-hidden="true"><span class="face">${BOSS_AVATAR[levelKey]}</span><span class="crown">👑</span></div>
      <div class="stars stars-pop" aria-hidden="true">⭐⭐⭐</div>
      <h2 class="win-banner">${BOSS_NAME[levelKey]} Ditaklukkan!${gold ? ' Kamu Hebat!' : ''}</h2>
      ${gold ? '<p class="done-sub"><span class="tag ok">🌟 Lencana Emas — hampir semua soal tepat!</span></p>' : ''}
      <p class="done-sub">Semua babak utama lolos. <b>+${XP_BOSS} XP</b> ⚡</p>
      ${wonLine}
      ${nextLine}
      ${scoreCard}
      <button class="primary-btn" type="button" data-action="backToHome">🗺️ Lihat Peta Level</button>
    </div>
  `;
  setHandlers({
    backToHome: () => go('home'),
  });
}

/* -------------------------------------------------------------------- game -- */
/**
 * "Padang Latih" versi kita — main bebas/ulang kegiatan yang sudah dibuka di
 * Explorer. Beda dari versi `inggrisinyuk` (dewasa) yang sama sekali tidak
 * menyentuh Stat cerita utama: di sini main tetap menambah XP (lebih kecil
 * dari Belajar), supaya main bebas tetap terasa "berarti" — TAPI tidak pernah
 * menambah bintang & tidak pernah dihitung levelUnlockMap/bossCleared. Belajar
 * tetap satu-satunya jalur nyata untuk membuka level baru.
 */
interface RajaDef {
  key: RajaKey;
  name: string;
  sub: string;
  color: string;
  /** URL gambar ikon dominan (permintaan user) — kalau kosong, fallback ke
   *  mascot SVG generik `rajaMascot()` (scenery.ts). Raja Kata, Raja Balon,
   *  Sentence Puzzle, Raja Ingatan, Sound Hunt & Story Quest punya art asli
   *  (lihat path masing-masing di RAJA_LIST); Raja Kelompok & Talk to the
   *  King masih fallback mascot. */
  icon?: string;
}

/**
 * Roster "Raja" Game Hub (permintaan user, revisi total dari versi lama
 * yang cuma daftar ULANG semua topik/skill sbg "main bebas"). Prinsip: (1)
 * **BUKAN reskin skill** — nama di sini berbasis MEKANIK (cocokkan/susun
 * kalimat/kelompokkan/cari-pasangan), bukan nama skill Vocab/Listening/dst
 * — versi awal "Raja Kata/Dengar/Suara" sempat DITOLAK user ("game nya
 * tidak perlu kata, dengar, suara") krn waktu itu isinya cuma kuis skill
 * berbaju mahkota, bukan game beneran; (2) **"pure game"** — tiap mekanik
 * di sini task-shape-nya genuinely permainan, bukan MCQ.
 * 🔒 **"Raja Kata" SEKARANG ADA LAGI di sini, menggantikan posisi "Raja
 * Ejaan"** (permintaan user langsung) — TAPI ini BUKAN comeback dari yang
 * ditolak dulu: mekaniknya Word Match (`games/wordmatch.ts` — tap kata↔tap
 * gambar, pasangan benar digambar garis penghubung SVG), genuinely game
 * visual-matching tersendiri (beda task-shape dari 3 raja lain), bukan kuis
 * skill Vocab berbaju mahkota. Awalnya dibangun sbg Boss berdiri sendiri di
 * Peta Level (arena+menang sendiri, XP lebih besar), lalu user minta
 * dipindah ke sini krn lebih pas sbg "main bebas" — sekarang XP-nya SAMA
 * dgn 3 raja lain (`XP_FREEPLAY`, bukan lagi angka spesial), gate 3
 * tingkat kesulitannya (Mudah/Sedang/Sulit) SEMPAT jadi langkah pilih-dulu
 * di dalam `runRajaRound` (`renderKataTierPicker`) — ⚠️ paragraf ini SUDAH
 * DIREVISI, TIDAK BERLAKU LAGI utk Raja Kata (lihat paragraf 🔒 revisi di
 * bawah, sesudah "Raja Balon") — Raja Balon SENDIRI TETAP begini (picker
 * tingkat kesulitan sebelum main, lihat catatan Raja Balon). Eja Kata (`runEjaKata`) TIDAK dihapus
 * dari app — tetap dipakai Tantangan Vocab (`games/vocabulary.ts` tab "✏️
 * Eja Kata"), cuma kehilangan entri berdiri-sendiri di Game Hub ini.
 * (3) **Roster & warna SENDIRI** — beda karakter total dari 6 Raja Hewan
 * Peta Level (permintaan user eksplisit, `scenery.ts` `rajaMascot`), warna
 * pinjam token `--c-*` yang sudah ada (bukan makna skill-nya lagi, cuma
 * hue pembeda antar-kartu).
 * 🔒 **"Raja Balon" BARU** (permintaan user, terinspirasi referensi
 * kompetitor "letupkan balon" — ditanya dulu soal timer/nyawa/badge
 * kesulitan yang ada di referensi itu, SEMUA sengaja DIBUANG di sini krn
 * dilarang keras CLAUDE.md/`materi/game.md` §5, cuma bentuk visualnya yang
 * diadaptasi) — ditaruh TEPAT SETELAH Raja Kata di array ini (permintaan
 * user "simpan di bawah game match word", urutan array = urutan render
 * `renderGame`). Mekanik: `games/balloonpop.ts` — prompt Bahasa Indonesia
 * di atas, balon berisi kata Inggris naik terus-menerus dari bawah ke atas
 * (CSS animation loop), anak tap yang cocok. 🔒 **Revisi user lanjutan**
 * ("kecepatan sama seperti game match word, ada level mudah/sedang/sulit"
 * + "soalnya pun sesuaikan dengan level") — SEKARANG JUGA minta pilih
 * varian dulu (`renderBalonTierPicker`, pola SAMA `renderKataTierPicker`),
 * tiap tingkat py BANK KATA SENDIRI (mudah=kata pendek, sulit=kata
 * panjang, pola sama 3 bank Raja Kata) SEKALIGUS kecepatan naik-turun balon
 * beda (`DIFFICULTY_META.durMin/durMax`, mudah=paling lambat).
 * 🔒 **Revisi (4 sesi) — "Raja Kata" SEKARANG konsep PETUALANGAN ala
 * `games/soundhunt.ts` (Map Kerajaan Kata 5-markas), TANPA picker tingkat
 * kesulitan, TANPA layar Welcome terpisah** — sesi 1 "update game Raja
 * Kata dimana konsep nya seperti game Talk to the King jadi tidak ada
 * level cukup dari awal sampai akhir dan dikunci jika belum selesai"
 * (`renderKataTierPicker` di atas DIHAPUS TOTAL, diganti alur linear tanpa
 * picker) — sesi 2 "kenapa game raja kata tidak seperti Sound Hunt yang
 * ada konsep petualang", ditanya map-style Sound Hunt vs bullet-dot Story
 * Quest → user pilih map-style + "tp konsep nya lebih ke arah
 * berpetualang" (jadi Map 3-markas) — sesi 3 "untuk raja kata minimal 5
 * kerajaan" (digenapkan 3→5 markas) — sesi 4 "remoeve page ini jadi ketika
 * klik game raja-kata maka direct ke list kerajaan nya dan di atas
 * berikan catatan 1 atau kalimat untuk rule game ini" (layar Welcome
 * DIHAPUS, langsung buka Map + 1 kalimat aturan di puncaknya). `runRajaRound`'s
 * cabang `'kata'` manggil `wordMatchGame.runWordMatch(stage, onRoundDone,
 * praiseLevel)` LANGSUNG (signature baru, TANPA parameter `difficulty`
 * lagi) — fungsi itu SENDIRI SEKARANG orkestrator penuh: **Map Kerajaan
 * Kata** (`renderMap()`, layar PERTAMA yang tampil — 5 markas bertema
 * Gerbang/Istana/Balairung/Menara/Ruang Harta Kata = Mudah/Sedang/Sulit/
 * Jago/Legendaris, reuse `.trail.raja-trail` PERSIS Sound Hunt) → tap
 * markas kebuka → 1 ronde → balik ke Map → markas berikutnya kebuka →
 * markas ke-5 tuntas → "Semua Kepingan Ditemukan!" → `onDone()`. "Dikunci
 * jika belum selesai" (sesi 1) TETAP terjaga: markas berikutnya SUNGGUH
 * tidak bisa disentuh (🔒 Terkunci, tombol disabled) sebelum markas
 * sebelumnya PERNAH dikunjungi (non-punitive — cukup pernah dicoba, bukan
 * harus menang, persis `visited` Sound Hunt) — detail lengkap: komentar
 * puncak `games/wordmatch.ts`. Mesin 1-ronde/1-tingkat LAMA (dulu bernama
 * `runWordMatch`, dipanggil picker) TIDAK dihapus, cuma direname
 * `runWordMatchRound` (lihat komentarnya sendiri di `games/wordmatch.ts` —
 * pemanggil KEDUA yang dulu ada di sini, Door Flow "Buka Pintu Kastil",
 * SUDAH DIHAPUS TOTAL, permintaan user).
 * 🔒 **Revisi (sesi lanjutan) — "Raja Balon" SEKARANG JUGA ikut diubah**
 * (permintaan user "remove tingkat kesulitan jadikan konsepnya seperti Raja
 * Kata") — `renderBalonTierPicker` di atas SUDAH DIHAPUS TOTAL, pola SAMA
 * PERSIS Raja Kata: `runRajaRound`'s cabang `'balon'` manggil
 * `balloonPopGame.runBalloonPop(stage, onRoundDone, praiseLevel)` LANGSUNG
 * (signature baru, TANPA parameter `difficulty`) — fungsi itu SENDIRI
 * SEKARANG orkestrator Map Kerajaan Balon 5-markas (Taman/Pasar/Awan/
 * Puncak/Balon Emas = Mudah/Sedang/Sulit/Jago/Legendaris, `BalloonDifficulty`
 * digenapkan 3→5 tingkat sama pola `WordMatchDifficulty`), detail lengkap:
 * komentar puncak `games/balloonpop.ts`.
 * 🔒 **"Raja Susun" DIGANTI TOTAL jadi "Sentence Puzzle"** (permintaan
 * user, screenshot referensi kompetitor: gambar di atas + kata dalam
 * gelembung tersusun piramida termasuk kata pengecoh + bar jawaban emas +
 * tombol Hint) — user eksplisit pilih GANTI (bukan tambah entri ke-6),
 * `key` TETAP `'susun'` (XP/progress lama anak via `getGameXp`/
 * `addGameXp` tidak hilang), cuma `name` & mekanik di baliknya yang
 * berubah — posisi TETAP persis di bawah Raja Balon. Vocab Tantangan "🔤
 * Susun Kalimat" (`vocabularyGame.runSusunKalimat`) SAMA SEKALI TIDAK
 * disentuh, tetap dipakai persis seperti sebelumnya di luar Game Hub ini.
 * Detail mekanik: `games/sentencepuzzle.ts`.
 * 🔒 **"Story Quest" BARU** (permintaan user, ditaruh TEPAT DI BAWAH Sound
 * Hunt — "simpan di bawah game sound hunt", urutan array = urutan render)
 * — fokus MURNI Reading comprehension: baca 1 halaman cerita pendek lalu
 * jawab 1 pertanyaan. Mekanik+data: `games/storyquest.ts`. Sama seperti
 * Sound Hunt, SENGAJA dulu tidak ikut Open the Door "Buka Pintu Kastil"
 * (fitur itu SUDAH DIHAPUS TOTAL, permintaan user) — sudah 1 mini-
 * petualangan multi-halaman sendiri, beda ritme dari gauntlet cepat.
 * 🔒 **Revisi (permintaan user "update story quest dengan konsep yang sama
 * dengan game lain... sub list game, pemanasan, mudah dan seterusnya")** —
 * tema "buku ajaib" (Magic Library, 1 cerita + rak buku "Segera Hadir")
 * SUDAH DIGANTI TOTAL jadi Map Kerajaan Cerita 6-markas, pola SAMA PERSIS
 * `games/wordmatch.ts` — 6 cerita BERDIRI SENDIRI (Pemanasan→Legendaris,
 * bukan lagi 1 cerita 5-halaman + rak "Segera Hadir"), tiap cerita = 1
 * markas. Detail: `games/storyquest.ts`.
 * 🔒 **"Talk to the King" SUDAH DIHAPUS TOTAL** (permintaan user) — dulu
 * raja PERTAMA di Game Hub ini yang 100% Speaking (tema "audiensi dgn
 * Raja", Royal Map → Throne Room, `games/talktotheking.ts`), sekarang
 * dicabut dari roster & `RajaKey` sepenuhnya — file `games/talktotheking.ts`
 * DIHAPUS, jangan cari referensinya lagi.
 */
const RAJA_LIST: RajaDef[] = [
  // 🔒 Nama tampilan disamakan ke pola Inggris "petualangan" yang sudah
  // dipakai Sentence Puzzle/Sound Hunt/Story Quest (permintaan user, audit
  // "penggunaan nama game tidak konsisten") — Raja Kata/Balon/Ingatan dulu
  // satu-satunya yang masih "Raja [Indonesia]", sekarang jadi Word Quest/
  // Balloon Hunt/Memory Hunt. `key`/slug/icon TIDAK berubah (progres lokal
  // anak & URL lama tetap valid) — MURNI label yang tampil ke user.
  { key: 'kata', name: 'Word Quest', sub: 'Cocokkan kata & gambar', color: 'var(--c-vocab)', icon: '/img/word_match_2.jpeg' },
  { key: 'balon', name: 'Balloon Hunt', sub: 'Letupkan balon yang cocok', color: 'var(--sun-500)', icon: '/img/baloon_2.jpeg' },
  { key: 'susun', name: 'Sentence Puzzle', sub: 'Susun kalimat dari gelembung kata', color: 'var(--c-gram)', icon: '/img/sentence_puzzle_2.jpeg' },
  { key: 'kelompok', name: 'Basket Sort', sub: 'Masukkan kata ke keranjangnya', color: 'var(--c-listen)', icon: '/img/basket_sort.jpeg' },
  { key: 'ingatan', name: 'Memory Hunt', sub: 'Cari pasangan katanya', color: 'var(--c-speak)', icon: '/img/ingatan.jpeg' },
  { key: 'soundhunt', name: 'Sound Hunt', sub: 'Dengar & temukan Sound Crystal', color: 'var(--c-read)', icon: '/img/sound_hunt_2.jpeg' },
  { key: 'storyquest', name: 'Story Quest', sub: 'Baca cerita, jawab, lanjut petualang', color: 'var(--brand-500)', icon: '/img/story_quest_2.jpeg' },
];

/** Emoji ikon kecil per Raja — dipakai kartu "🎮 Hasil Main Game" Rapor
 *  (`renderRapor`), BUKAN `RajaDef.icon` (gambar penuh, cocok utk kartu
 *  besar Game Hub, terlalu berat utk lingkaran kecil `.skill-card .ic` —
 *  pola SAMA `SKILL_META[key].emoji` yang dipakai kartu "Skor Tiap Skill"
 *  di sebelahnya). Beda dari emoji "wajah" `renderMissionComplete()` tiap
 *  game (bisa sama persis dgn game lain, mis. Kata & Susun sama-sama 🧩) —
 *  di sini SENGAJA semua beda biar 7 baris berdampingan mudah dibedakan. */
const RAJA_ICON_EMOJI: Record<RajaKey, string> = {
  kata: '🔤',
  balon: '🎈',
  susun: '🧩',
  kelompok: '🧺',
  ingatan: '🧠',
  soundhunt: '🎧',
  storyquest: '📖',
};

/** Slug URL per Raja (screen 'gamePlay', `/game/<slug>` — permintaan user
 *  "ketika klik icon game maka ke halaman baru misal game/raja-kata")—
 *  manusiawi/deskriptif, BUKAN `RajaKey` mentah (mis. 'susun' → 'sentence-
 *  puzzle', bukan '/game/susun', biar URL kebaca jelas tanpa perlu buka kode). */
const RAJA_SLUG: Record<RajaKey, string> = {
  kata: 'raja-kata',
  balon: 'raja-balon',
  susun: 'sentence-puzzle',
  kelompok: 'raja-kelompok',
  ingatan: 'raja-ingatan',
  soundhunt: 'sound-hunt',
  storyquest: 'story-quest',
};
const SLUG_TO_RAJA: Record<string, RajaKey> = Object.fromEntries(
  (Object.entries(RAJA_SLUG) as [RajaKey, string][]).map(([key, slug]) => [slug, key])
);

/**
 * Game Hub — grid kartu "Pilih Game" (permintaan user "buat tampilan game
 * nya mencari card seperti contoh gambar tapi dengan ciri khas inggrisin
 * yuk kids", referensi screenshot kompetitor: grid 2-kolom, ikon besar di
 * atas + judul + badge, SELURUH kartu jadi 1 tombol tap — DIGANTI TOTAL
 * dari jalur petualang selang-seling versi sebelumnya). Diadaptasi, bukan
 * ditiru 100% (filter kid-friendly CLAUDE.md): warna & badge tetap pakai
 * token InggrisinYuk Kids sendiri (`--band-deep` per-Raja, `.tag`/`.tag.ok`
 * yang sudah dipakai lintas app), subtitle (`r.sub`) SENGAJA tidak ikut
 * dirender di kartu hub (CLAUDE.md "Teks Singkat" — ikon+judul cukup,
 * deskripsi lengkap tetap muncul begitu anak masuk ke `renderGamePlay()`).
 * Class BARU (`.raja-grid`/`.raja-card`/`.raja-card-icon`,
 * `public/styles.css`) — AWALNYA SENGAJA TIDAK reuse `.raja-trail`/
 * `.raja-icon` (desain trail lama) krn 3 game (Raja Kata/Balon, Sound Hunt)
 * masih pakai PERSIS class itu utk Map Kerajaan/Hutan Ajaib INTERNAL mereka
 * sendiri. **🔒 Koreksi (sesi lanjutan, permintaan user "jadikan 1 card an
 * seperti di halaman game dimana 1 row jadi 2 card")** — Map Kerajaan
 * SEKARANG JUSTRU reuse PERSIS grid ini juga, `.raja-trail`/`.raja-icon`
 * DIHAPUS TOTAL dari codebase (lihat komentar `renderMap()` `games/
 * wordmatch.ts` utk riwayat lengkap perubahannya).
 *
 * 🔒 **Revisi user lanjutan** ("di atas list game buat seperti ini [ref
 * screenshot 'Tantangan Harian'] dimana mirip dengan di beranda dan belajar
 * yaitu 'Yuk Mulai'/'Yuk Lanjut' dari game terakhir dan berikan juga
 * progress game secara general... dan tiap card game tambahkan percentage
 * di kanan atas mirip konsepnya dengan percentage di setiap modul di
 * halaman belajar") — 2 tambahan, KEDUANYA reuse komponen yang SUDAH ADA
 * (bukan tiru mekanik "Tantangan Harian" referensi apa adanya — app ini
 * TIDAK PERNAH punya coin/mata uang/streak-kalender, PRD §11, jadi 🔥/🪙/💡
 * di puncak referensi itu SENGAJA tidak diambil sama sekali):
 * 1. **Kartu hero "Yuk Mulai"/"Yuk Lanjutkan"** — REUSE PERSIS `.spark
 *    compact` (komponen yang SAMA dgn kartu "lanjutkan materi" Beranda &
 *    Menu Belajar, `sky`/`CLOUD`/`HILLS_SHORE` dari `scenery.ts`), BUKAN
 *    komponen baru. Game terakhir dibuka (`getLastGame()`, `Store.lastGame`
 *    BARU di `progress.ts`, diisi `setLastGame()` di `renderGamePlay()` —
 *    pola SAMA PERSIS `last`/`setLast()` utk materi Belajar) jadi tujuan
 *    tombol; kalau belum pernah buka game apa pun, fallback ke game
 *    PERTAMA di roster & labelnya "Yuk Mulai" (bukan "Yuk Lanjutkan") —
 *    logic sama `next.continuing` di `findNextMateri`. `.spark-art`
 *    menampilkan ikon Raja itu SENDIRI (gambar asli via `<img>`, `public/
 *    styles.css` `.spark-art img` BARU — bukan emoji generik spt Beranda/
 *    Belajar, krn Game Hub sendiri sudah py art asli per-Raja yang lebih
 *    kaya drpd 1 emoji).
 * 2. **Progress bar keseluruhan** — `.spark-progress` (KOMPONEN SAMA PERSIS
 *    dgn strip progress Menu Belajar, cuma angkanya beda sumber) di dalam
 *    kartu hero, formula SAMA PERSIS contoh user ("100 game, baru main 10,
 *    jadi 10%"): `gamesPlayedCount()` (BARU, `progress.ts`) hitung berapa
 *    Raja yang `gameXp[key] > 0` (pernah dimainkan MINIMAL 1x, non-punitive
 *    — bukan harus "tuntas", sama filosofi `visited` markas) dari total
 *    roster level ini.
 * 3. **Badge persen per-kartu** — REUSE PERSIS `.skill-pct` (class yang
 *    SAMA dgn badge persen pojok-kanan-atas kartu modul Menu Belajar, TANPA
 *    CSS baru) krn "mirip konsepnya dengan percentage di setiap modul".
 *    Nilainya BINER 0%/100% (`getGameXp(r.key) > 0`, BUKAN skema ambang XP
 *    yang diciptakan sendiri) — Game Hub TIDAK py struktur "10 soal
 *    tetap"/markas persisten lintas sesi spt topik Belajar (Map Kerajaan
 *    tiap Raja reset tiap sesi main baru, lihat komentar `games/
 *    wordmatch.ts`), jadi satu-satunya sinyal yang JUJUR & bertahan lama
 *    adalah "pernah dimainkan atau belum" — SAMA PERSIS basis
 *    `gamesPlayedCount()` di atas, supaya kartu individual & progress bar
 *    total selalu cerita yang konsisten (bukan 2 formula independen yang
 *    bisa berselisih).
 *
 * 🔒 **Revisi user lanjutan (5 permintaan sekaligus)**:
 * 1. **Judul "Game" polos DIHAPUS** — `.greet`/`<h1 class="display">` di atas
 *    grid ikut dicabut (bukan cuma teksnya dikosongkan) krn tanpa isi lain
 *    wrapper itu cuma nyisa margin kosong; kartu hero "Yuk Mulai" sekarang
 *    jadi elemen PALING ATAS layar.
 * 2. **"Setiap icon" gerak-gerak pelan** — class `mascot-idle` (keyframe
 *    `mascotIdle`, SUDAH ADA `public/styles.css`, dipakai badge XP/kartu
 *    Bos) ditempel ke `.raja-card-icon` (roster grid, `animation-delay`
 *    bertingkat per kartu `i*0.15s` biar tidak bobbing bareng-bareng
 *    serempak) — TANPA keyframe baru, `.spark-art`'s icon (hero) SUDAH pakai
 *    `mascot-idle` sejak awal. (Map Kerajaan/Hutan Ajaib py `.raja-icon`
 *    SENDIRI saat itu, JUGA ditempel `mascot-idle` — class itu sekarang
 *    SUDAH DIHAPUS TOTAL, Map Kerajaan reuse `.raja-card-icon` yang SAMA
 *    persis roster grid ini, lihat koreksi di komentar `renderGame()`.)
 * 3. **Kartu hero "tema berpetualang"** — eyebrow BARU "🧭 Petualangan Game
 *    Hub" di atas judul (`.eyebrow`, class generik yang sudah dipakai kartu
 *    spark lain, mis. "Semua materi tuntas!"), progress bar labelnya diganti
 *    dari "X/Y game" jadi **"X/Y markas"** (istilah yang sama dgn perhentian
 *    Raja di Peta Level/Map Kerajaan tiap game, bukan kata "game" generik) —
 *    murni lewat copy+eyebrow, BUKAN komponen visual baru (`.spark compact`
 *    yang sama tetap dipakai apa adanya).
 * 4/5. Screen 'gamePlay' TERSENDIRI (routing/navbar) & desain Map Kerajaan
 *    per-game — lihat komentar `renderGamePlay()` di bawah & komentar
 *    masing-masing `games/*.ts`.
 */
function renderGame(): void {
  // Semua Raja tampil di semua level — Raja Kelompok dulu disembunyikan di
  // level tanpa topik `sortBaskets` (cuma Little Stars), sekarang punya bank
  // sendiri (`games/kelompok.ts`).
  const roster = RAJA_LIST;

  const playedCount = gamesPlayedCount(roster.map((r) => r.key));
  const gamePct = roster.length > 0 ? Math.round((playedCount / roster.length) * 100) : 0;
  // "markas" (bukan "game" polos) — permintaan user "tema nya berpetualang",
  // reuse istilah yang sudah dipakai lintas app utk perhentian Raja (Peta
  // Level/Map Kerajaan tiap game), bukan kata generik baru.
  const progressBar = `
    <div class="spark-progress">
      <div class="spark-progress-track" role="img" aria-label="${gamePct}% markas Game Hub sudah dijelajahi">
        <div class="spark-progress-fill" style="width:${gamePct}%"></div>
      </div>
      <span class="spark-progress-label">${playedCount}/${roster.length} markas · ${gamePct}%</span>
    </div>`;

  const lastKey = getLastGame();
  const next = roster.find((r) => r.key === lastKey) ?? roster[0];
  const sky = `<span class="cloud c1" aria-hidden="true">${CLOUD}</span><span class="cloud c2" aria-hidden="true">${CLOUD}</span>${HILLS_SHORE}`;
  const heroIcon = next?.icon ? `<img src="${next.icon}" alt="" loading="lazy">` : next ? rajaMascot(next.key, next.color) : '';
  const heroCard = next
    ? `
    <article class="spark compact game-hero" style="--spark-accent:${next.color}">
      ${sky}
      <div class="spark-body">
        <h2 class="spark-title">${next.name}</h2>
        <p class="spark-sub">${next.sub}</p>
        <button class="cta" type="button" data-action="playRaja" data-payload="${next.key}">${ICON_PLAY} ${next.key === lastKey ? 'Yuk Lanjutkan' : 'Yuk Mulai'}</button>
        ${progressBar}
      </div>
      <div class="spark-art" aria-hidden="true"><span class="mascot-idle">${heroIcon}</span></div>
    </article>`
    : '';

  const cards = roster
    .map((r, i) => {
      const xp = getGameXp(r.key);
      const pct = xp > 0 ? 100 : 0;
      const badge = xp > 0 ? `<span class="tag">🏆 ${xp} XP</span>` : `<span class="tag ok">Baru</span>`;
      const iconInner = r.icon ? `<img src="${r.icon}" alt="" loading="lazy">` : rajaMascot(r.key, r.color);
      return `
      <button class="raja-card terrain-card" type="button" data-action="playRaja" data-payload="${r.key}" style="--band-deep:${r.color}">
        <span class="skill-pct${pct >= 100 ? ' done' : ''}">${pct}%</span>
        <span class="raja-card-icon" aria-hidden="true"><span class="mascot-idle" style="display:block;animation-delay:${(i * 0.15).toFixed(2)}s">${iconInner}</span></span>
        <h3>${r.name}</h3>
        ${badge}
      </button>`;
    })
    .join('');

  root.innerHTML = `
    ${heroCard}
    <div class="map-board game-hub-board">
      <div class="map-sky">
        <span class="map-sun" aria-hidden="true"></span>
        <span class="cloud c1" aria-hidden="true">${CLOUD}</span>
        <span class="cloud c2" aria-hidden="true">${CLOUD}</span>
        <h2>🗺️ Pilih Markasmu!</h2>
        <p>Banyak game seru menantimu di sini.</p>
      </div>
      <div class="raja-grid game-hub-grid">${cards}</div>
    </div>
  `;

  setHandlers({
    playRaja: (payload) => go('gamePlay', { gameKey: payload as RajaKey }),
  });
}

/** Layar main 1 Raja Game Hub (Kata/Balon/Susun/Kelompok/Ingatan) — screen
 *  'gamePlay' TERSENDIRI (`state.gameKey`, URL `/game/<slug>`, permintaan
 *  user "ketika klik icon game maka ke halaman baru... sehingga navbar
 *  dibawahnya hilang"; rail/topline/tabbar disembunyikan lewat
 *  `body.is-game-play`, `render()`/styles.css). Dulu `openRajaGame(key)`
 *  cuma menimpa `root.innerHTML` langsung (bukan route beneran) — itu
 *  sebabnya tabbar dulu masih nyangkut kelihatan walau sudah ditambah pop up
 *  konfirmasi keluar (paragraf di bawah); SEKARANG betul² halaman
 *  tersendiri, tabbar hilang total lewat CSS, bukan cuma diakali popup.
 *  🔒 Pop up konfirmasi keluar (permintaan user sesi sebelumnya, "pastikan
 *  ketika keluar ada pop up keluar atau lanjut") TETAP dipertahankan —
 *  tombol balik lewat konfirmasi dulu (`placementGame.renderExitConfirm`,
 *  REUSE PERSIS overlay First Placement Test) supaya SELALU ada jalan
 *  keluar eksplisit & disengaja saat ada progres yang bisa hilang, bukan
 *  cuma karena tabbar sekarang hilang jadi popup-nya jadi tidak perlu lagi.
 *
 *  🔒 **Revisi (permintaan user "ketika di halaman /game/raja-kata dan back
 *  maka tidak perlu keluarkan pop up... hanya ketika sudah masuk proses
 *  mengerjakan")** — popup SEKARANG cuma tampil kalau `isGameRoundActive()`
 *  true (`interaction.ts`, ditulis tiap `games/*.ts` orkestrator "Raja"
 *  bertingkat begitu pindah Map Kerajaan↔markas aktif). Back dari layar Map
 *  (list markas, belum masuk 1 markas manapun) langsung `go('game')` TANPA
 *  konfirmasi — anak belum kehilangan progres apa pun di situ (progres
 *  markas cuma hidup per-sesi, direset tiap buka game lagi). Detail aturan
 *  lengkap: CLAUDE.md § "Pop Up Konfirmasi Keluar Game".
 *
 *  🔒 **Latar kelap-kelip bintang** (permintaan user "analisis /game/
 *  raja-kata... background nya ditambahkan bintang, emot lucu... yang
 *  menarik anak") — `GAME_STAR_FIELD` (scenery.ts) DISISIPKAN DI SINI dulu
 *  (sebelum `.raja-stage`), TAPI ternyata tidak pernah kelihatan sama sekali
 *  — `.raja-stage`/`#rajaStage` adalah `.card` OPAQUE yang membungkus SEMUA
 *  isi Map Kerajaan (note-card+grid+footer), jadi bintang di root level ini
 *  ketutup total oleh background kartu itu. **Koreksi**: bintang SEKARANG
 *  disisipkan DI DALAM `renderMap()` tiap `games/*.ts` (child PERTAMA
 *  `container.innerHTML`, jadi di BALIK note-card/grid/footer dalam kartu
 *  yang SAMA, bukan ketutup dari luar) — lihat komentar `.game-star-field`
 *  `public/styles.css` & `renderMap()` `games/wordmatch.ts` utk detail.
 *
 *  🔒 **Footer standar** (permintaan user "untuk footer tambahkan seperti
 *  original footer Kids-Inggrisin-Yuk seperti di halaman yang lain") —
 *  `.standalone-footer` (© tahun InggrisinYuk Kids) SAMA PERSIS yang sudah
 *  dipakai `renderAccount()`/First Placement Test (screen 'gamePlay' ini
 *  JUGA "halaman berdiri sendiri" tanpa rail/topline/tabbar, komentar CSS
 *  aslinya sendiri sudah bilang "login DAN First Placement Test" — sekarang
 *  jadi 3). Ditaruh SEKALI di sini (level screen, bukan per-map di
 *  `renderMap()`) krn footer brand seharusnya konsisten scr keseluruhan
 *  layar, bukan berulang tiap ganti markas/game — GANTIKAN pesan penutup
 *  custom "Itu semua markas..." yang lama (`gameMapFooterHtml()`, SUDAH
 *  DIHAPUS dari `games/*.ts`, diganti section "Cara Main" — lihat komentar
 *  `renderMap()` masing-masing). */
function renderGamePlay(): void {
  const key = state.gameKey;
  const raja = key ? RAJA_LIST.find((r) => r.key === key) : undefined;
  // URL `/game/<slug-tidak-dikenal>` atau gameKey somehow null — jatuhkan ke
  // roster Game Hub biasa, bukan biarkan renderer crash (pola sama fallback
  // `topics`/`activity` tanpa skill valid di `applyPathToState`).
  if (!raja) return go('game');

  setLastGame(raja.key);
  // Default AMAN sebelum orkestrator game manapun sempat jalan (lihat
  // komentar `isGameRoundActive` `interaction.ts`) — game TANPA layar Map
  // (Kelompok/Story Quest) sengaja TIDAK PERNAH mengubah ini lagi, jadi
  // popup TETAP tampil (perilaku lama, tidak berubah utk 2 game itu). Game
  // ber-Map langsung menimpanya `false` synchronous di `renderMap()`
  // (dipanggil `runRajaRound` di bawah, sebelum anak sempat interaksi).
  setGameRoundActive(true);
  root.innerHTML = `
    <div class="act-head">
      <button class="iconbtn" type="button" data-action="backToGame" aria-label="Kembali ke Game">${ICON_BACK}</button>
      <div class="txt">
        <h1>${raja.name}</h1>
        <div class="sub"><span class="tag accent">🎮 ${raja.sub}</span></div>
      </div>
      <span id="musicToggleMount">${musicToggleHtml()}</span>
    </div>
    <div class="card raja-stage world-${raja.key}" id="rajaStage" style="--k:${raja.color}"></div>
    <footer class="standalone-footer">
      <p>© ${new Date().getFullYear()} InggrisinYuk Kids</p>
    </footer>
  `;
  setHandlers({
    toggleGameMusic: () => {
      setMusicOn(!isMusicOn());
      const mount = root.querySelector('#musicToggleMount');
      if (mount) mount.innerHTML = musicToggleHtml();
    },
    backToGame: () => {
      if (!isGameRoundActive()) {
        go('game');
        return;
      }
      // 🔒 Keluar dari 1 markas → balik ke Map markas game itu (bukan `/game`),
      // lihat `getGameMapReturn` `interaction.ts`. Game tanpa Map → `/game`.
      const exit = () => {
        stopSpeaking();
        stopListening();
        const backToMap = getGameMapReturn();
        if (backToMap) backToMap();
        else go('game');
      };
      placementGame.renderExitConfirm(
        () => {
          /* "Yuk Lanjut" — overlay sudah menutup dirinya sendiri, tidak perlu apa-apa lagi di sini */
        },
        exit
      );
    },
  });
  // Fase 1 suasana game (`materi/suasana_game.md`): musik latar tema game
  // ini + bunyi ketuk lembut utk setiap tombol di area main. Anak baru saja
  // mengetuk kartu game → AudioContext boleh bunyi (kebijakan autoplay).
  startGameMusic(raja.key);
  qs<HTMLDivElement>(root, '#rajaStage').addEventListener('pointerdown', (e) => {
    const btn = (e.target as HTMLElement).closest('button');
    if (btn && !btn.disabled) sfx('tap');
  });
  runRajaRound(raja.key);
}

/** Topik dipilih ACAK tiap "Main" (bukan daftar-lalu-pilih) — permintaan
 *  user "ini game bukan materi": langsung main, bukan browsing materi dulu.
 *  Raja Kelompok py bank sendiri (games/kelompok.ts, Map 6 markas);
 *  Raja Kata py bank kata sendiri (games/wordmatch.ts, TIDAK dari
 *  vocabTopicsForLevel — Map Kerajaan Kata 5-markas Mudah→Sedang→Sulit→
 *  Jago→Legendaris TANPA picker, lihat `wordMatchGame.runWordMatch`); Raja
 *  Balon SEKARANG pola SAMA PERSIS Raja Kata (games/balloonpop.ts, Map
 *  Kerajaan Balon 5-markas TANPA picker tingkat kesulitan lagi, lihat
 *  `balloonPopGame.runBalloonPop`); Raja Ingatan jg py bank kata sendiri
 *  (games/memorymatch.ts, TIDAK terikat level/topik Vocab manapun —
 *  permintaan user "dedicated game"); Sentence Puzzle ('susun') jg py
 *  bank kalimat sendiri per markas (`games/sentencepuzzle-data.ts`, dulu
 *  memakai topik Vocab level anak). */
function runRajaRound(key: RajaKey): void {
  const stage = qs<HTMLDivElement>(root, '#rajaStage');
  const praiseLevel = currentLevelMeta().key;
  const onRoundDone = () => {
    addXp(XP_FREEPLAY);
    addGameXp(key, XP_FREEPLAY);
    requestSync();
    showRajaDone(key);
  };

  if (key === 'kelompok') {
    // Raja Kelompok: Map 6 markas + bank sendiri (games/kelompok.ts), tidak
    // lagi mengambil topik Vocab ber-`sortBaskets`.
    kelompokGame.runKelompok(stage, onRoundDone, praiseLevel);
    return;
  }

  if (key === 'kata') {
    // Raja Kata: TANPA picker tingkat kesulitan lagi — orkestrator penuh
    // (Map Kerajaan Kata 5-markas) hidup DI DALAM wordMatchGame.runWordMatch()
    // sendiri.
    wordMatchGame.runWordMatch(stage, onRoundDone, praiseLevel);
    return;
  }

  if (key === 'balon') {
    // Raja Balon: TANPA picker tingkat kesulitan lagi — orkestrator penuh
    // (Map Kerajaan Balon 5-markas) hidup DI DALAM
    // balloonPopGame.runBalloonPop() sendiri, konsep sama Raja Kata.
    balloonPopGame.runBalloonPop(stage, onRoundDone, praiseLevel);
    return;
  }

  if (key === 'susun') {
    sentencePuzzleGame.runSentencePuzzle(stage, onRoundDone, praiseLevel);
    return;
  }

  if (key === 'ingatan') {
    // Dedicated (games/memorymatch.ts, bank kata sendiri), BUKAN lagi reuse
    // topik Vocab acak (permintaan user, lihat komentar file itu).
    memoryMatchGame.runMemoryMatch(stage, onRoundDone, praiseLevel);
    return;
  }

  if (key === 'soundhunt') {
    // Sound Hunt: Listening murni, bank soal & Forest Map sendiri
    // (games/soundhunt.ts), generik lintas level sama seperti raja lain.
    soundHuntGame.runSoundHunt(stage, onRoundDone, praiseLevel);
    return;
  }

  // 'storyquest' — Story Quest: Reading comprehension murni, Map Kerajaan
  // Cerita 6-markas sendiri (games/storyquest.ts), generik lintas level
  // sama raja lain.
  storyQuestGame.runStoryQuest(stage, onRoundDone, praiseLevel);
}

function showRajaDone(key: RajaKey): void {
  const stage = qs<HTMLDivElement>(root, '#rajaStage');
  stage.innerHTML = `
    <div class="done-wrap">
      <div class="done-mascot mascot-pop" aria-hidden="true">👑🎉</div>
      <p class="done-sub">Seru! <b>+${XP_FREEPLAY} XP</b> ⚡ Main lagi atau pilih Raja lain?</p>
      <button class="primary-btn" type="button" data-action="replayRaja">🔁 Main Lagi</button>
      <button class="ghost-btn" type="button" data-action="toGame">📋 Pilih Raja Lain</button>
    </div>
  `;
  setHandlers({
    replayRaja: () => runRajaRound(key),
    toGame: () => go('game'),
  });
}
