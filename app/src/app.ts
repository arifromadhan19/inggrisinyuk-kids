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
} from './account';
import * as bossGame from './games/boss';
import * as grammarGame from './games/grammar';
import * as listeningGame from './games/listening';
import * as balloonPopGame from './games/balloonpop';
import * as memoryMatchGame from './games/memorymatch';
import * as placementGame from './games/placement';
import * as readingGame from './games/reading';
import * as sentencePuzzleGame from './games/sentencepuzzle';
import * as soundHuntGame from './games/soundhunt';
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
import { bindDelegatedClicks, clearHandlers, isGameRoundActive, setGameRoundActive, setHandlers } from './interaction';
import { CLOUD, HILLS_RIDGE, HILLS_SHORE, rajaMascot, TRAIL_BEND_LEFT, TRAIL_BEND_RIGHT, placeFor } from './scenery';
import type { LastSpot, Store, TopicSignal } from './progress';
import {
  addGameXp,
  addXp,
  ANIMAL_AVATAR_NAMES,
  ANIMAL_AVATARS,
  clearOutboxIds,
  computeInsights,
  doneCount,
  getAccuracy,
  getActiveDaysCount,
  getAvatar,
  getBossClearedCount,
  getBrowseLevel,
  gamesPlayedCount,
  getGameAccuracy,
  getGameStats,
  getGameXp,
  getLast,
  getLastGame,
  getLongestStreak,
  getName,
  getStreak,
  getWeekActivity,
  getXp,
  grammarTopicPercent,
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
  setAvatar,
  setBrowseLevel,
  setEventSyncHandler,
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

const state: AppState = {
  screen: 'home',
  skillKey: null,
  topicIndex: 0,
  step: 0,
  bossLevel: null,
  soonLevel: null,
  viewLevel: null,
  gameKey: null,
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
 * event ("setiap mencoba pakai di save") ke `portal/` — dipasang SEKALI di
 * boot lewat `setSyncHandler`/`setEventSyncHandler` (progress.ts), jadi tiap
 * `write()`/`recordEvent()` internal di sana (dari MANA pun dipanggil)
 * otomatis memicu debounce yang SAMA, tanpa perlu menyentuh puluhan titik
 * panggil satu-satu. 1 flush = 1 request PUT berisi snapshot `Store` TERBARU
 * (`snapshot()`, bukan snapshot basi dari pemicu pertama) + outbox event
 * yang belum terkirim — event yang sukses dikirim baru dihapus dari outbox
 * (`clearOutboxIds`), supaya gagal kirim tidak menghilangkan detailnya.
 * Didebounce 1.5s supaya ronde beruntun (mis. 10 soal Latihan Inti) cuma
 * kirim 1 request. Kalau belum login: no-op (localStorage TETAP jalan penuh
 * sendirian, PRD §5/§14.4 — main tanpa akun harus utuh).
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
        /* offline/gagal kirim — progres tetap aman di localStorage, coba lagi di write/event berikutnya */
      });
  }, 1500);
}

function wireProgressSync(): void {
  setSyncHandler(() => scheduleProgressSync());
  setEventSyncHandler(() => scheduleProgressSync());
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
  wireProgressSync(); // pasang sekali — dari sini tiap write() progress.ts otomatis ikut ke-push kalau login
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

function paintLevelChips(): void {
  // Sapaan header — "Hi {nama} : Level" kalau nama sudah diisi (lewat
  // Pengaturan). Belum ada nama = balik ke chip level polos (bukan "Hi :"
  // yang ganjil tanpa nama) — nama murni opsional & lokal (progress.ts),
  // bukan akun (PRD §5).
  const name = getName();
  const avatar = getAvatar();
  const level = currentLevelMeta();
  const chipText = name ? `${avatar} Hi ${escapeHtml(name)} : ${level.emoji} ${level.name}` : `${level.emoji} ${level.name}`;
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
  if (state.screen === 'rapor') return 'rapor';
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

function render(): void {
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
  if (!isLoggedIn() && state.screen !== 'account' && state.screen !== 'landing') {
    state.screen = 'landing';
  }
  // Kebalikannya: URL bisa saja masih "/" atau "/masuk" (mis. dari sesi lama
  // yang tokennya sudah kedaluwarsa, atau bookmark homepage) padahal sekarang
  // sudah login — jangan tampilkan layar marketing/login ke orang yang sudah masuk.
  if (isLoggedIn() && (state.screen === 'account' || state.screen === 'landing')) {
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
  document.body.classList.toggle('is-login', state.screen === 'account');
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

  syncNav();
  renderCrumb();
  setAccent(state.screen === 'topics' || state.screen === 'activity' ? state.skillKey : null);

  if (state.screen === 'home') return renderHome();
  if (state.screen === 'levelSoon') return renderLevelSoon();
  if (state.screen === 'settings') return renderSettings();
  if (state.screen === 'rapor') return renderRapor();
  if (state.screen === 'menu') return renderMenu();
  if (state.screen === 'topics') return renderTopics();
  if (state.screen === 'game') return renderGame();
  if (state.screen === 'gamePlay') return renderGamePlay();
  if (state.screen === 'boss') return renderBoss();
  if (state.screen === 'account') return renderAccount();
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
    // Format KEDUA (`ReadingWordTopic`, "Baca Kata") & KETIGA
    // (`ReadingCheckTopic`, "Baca & Nilai") py section granular sejak revisi
    // feedback user — format LAMA (Adventurer/Achiever, `ReadingTopic`)
    // TIDAK, tetap jatuh ke fallback `isStepVisited` di bawah.
    if (readingTopic && 'items' in readingTopic) {
      return readingTopicPercent(topicId, readingTopic.items.length, {
        section: 'tantangan-baca',
        total: Math.min(readingTopic.items.length, 10),
      });
    }
    if (readingTopic && 'checks' in readingTopic) {
      return readingTopicPercent(topicId, readingTopic.checks.length, {
        section: 'tantangan-cek',
        total: Math.min(readingTopic.checks.length, 10),
      });
    }
  }
  if (key === 'grammar') {
    const grammarTopic = grammarTopicsForLevel(level).find((t) => t.id === topicId);
    // Format KEDUA (`GrammarPatternTopic`, "Satu atau Banyak?") py section
    // granular — format LAMA (Explorer/Adventurer, `GrammarTopic`) TIDAK,
    // tetap jatuh ke fallback `isStepVisited` di bawah.
    if (grammarTopic && 'items' in grammarTopic) {
      return grammarTopicPercent(topicId, grammarTopic.items.length, Math.min(grammarTopic.items.length, 10));
    }
  }
  return isStepVisited(key, topicId, 'latihan') && isStepVisited(key, topicId, 'tantangan') ? 100 : 0;
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
function buildProgressPanel(): string {
  const mapUnlocked = levelUnlockMap(LEVELS);
  const hereKey = currentStopKey(mapUnlocked);
  const hereIdx = LEVELS.findIndex((l) => l.key === hereKey);
  const hereLevel = hereIdx >= 0 ? LEVELS[hereIdx] : null;
  const nextLevel = hereIdx >= 0 ? LEVELS[hereIdx + 1] : undefined;

  // Progres menuju Tantangan Bos — murni informatif/positif — bukan skor
  // benar-salah (PRD §4.5/§4.6: tanpa rasio benar/salah dalam bentuk apa pun
  // dipakai untuk buka/kunci apa pun; "Ketepatan" di bawah cuma motivasi
  // tampilan, tidak pernah menggerbang progres).
  const done = doneCount();
  const totalTopics = totalTopicsForLevel(currentPlayableLevel().key);
  const bossPct = totalTopics > 0 ? Math.round((done / totalTopics) * 100) : 0;

  const xp = getXp();
  const streakDays = getStreak();
  const accuracy = getAccuracy();

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
      done > 0
        ? `${done} dari ${totalTopics} modul sudah kamu tuntaskan.`
        : `Ayo mulai dari modul pertama!`
    }</p>`;

  return `
    <div class="card progress-panel">
      <span class="eyebrow">📈 Progresmu</span>
      ${levelProgress}
      <div class="stat-row">${statTiles}</div>
    </div>`;
}

/** Strip 7 hari aktif belajar — beda dari angka streak di panel Progresmu
 *  (yang punya aturan "berturut-turut" + 1 hari pelindung): strip ini murni
 *  menunjukkan hari mana saja anak main minggu ini, tanpa aturan yang bisa
 *  "putus". Dipakai Beranda & Rapor, sama alasan `buildProgressPanel`. */
function buildDailyCard(): string {
  const dayChips = getWeekActivity()
    .map(
      (d) =>
        `<span class="day-chip ${d.active ? 'is-active' : ''} ${d.isToday ? 'is-today' : ''}">${d.label}</span>`
    )
    .join('');
  return `
    <div class="card">
      <span class="eyebrow">Progres Harian</span>
      <div class="day-row" style="margin-top:10px" aria-label="Hari kamu aktif belajar dalam 7 hari terakhir">${dayChips}</div>
      <p class="meta" style="margin-top:10px">Ini hari-hari kamu sudah main minggu ini — libur sehari juga santai saja.</p>
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
      <p class="meta">Titik mulai kamu di Jalur Petualangan — keren, sudah dicoba! 🎉</p>
    </div>`;
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
      <p class="meta" style="margin-top:8px">XP tertinggi dari anak-anak lain yang lagi main — dianonimkan, tanpa nama asli.</p>
    </div>`;
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
  const last = validLast();

  // Panorama kecil di balik kartu "lanjutkan" — langit, awan, dan siluet
  // pantai yang sama dengan peta di bawahnya, supaya terasa satu dunia
  // (hiasan murni, aria-hidden, tidak menambah informasi baru).
  const sky = `<span class="cloud c1" aria-hidden="true">${CLOUD}</span><span class="cloud c2" aria-hidden="true">${CLOUD}</span>${HILLS_SHORE}`;

  // Slim (permintaan user) — modifier `compact` KHUSUS instance Beranda,
  // TIDAK dipakai di `.spark` Menu Belajar (biar tidak ikut mengecil) — dan
  // tanpa eyebrow "Lanjutkan"/"Mulai di sini" di atas judul (permintaan user).
  const spark = last
    ? `
      <article class="spark compact">
        ${sky}
        <div class="spark-body">
          <h2 class="spark-title">${topicTitle(last.skill, last.topicIndex, currentPlayableLevel().key)}</h2>
          <p class="spark-sub">${SKILL_META[last.skill].label} · ${SKILL_META[last.skill].tagline}</p>
          <button class="cta" type="button" data-action="resume">${ICON_PLAY} Main lagi</button>
        </div>
        <div class="spark-art" aria-hidden="true"><span class="mascot-idle">${SKILL_META[last.skill].emoji}</span></div>
      </article>`
    : `
      <article class="spark compact">
        ${sky}
        <div class="spark-body">
          <h2 class="spark-title">Yuk kenalan sama kata baru</h2>
          <p class="spark-sub">Dengar, tebak, ucapkan, lalu susun. Semua lewat main.</p>
          <button class="cta" type="button" data-action="openMenu">${ICON_PLAY} Buka Menu Belajar</button>
        </div>
        <div class="spark-art" aria-hidden="true"><span class="mascot-idle">🦁</span></div>
      </article>`;

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

  const done = doneCount();
  const mapTotalTopics = hereLevel ? totalTopicsForLevel(hereLevel.key) : 0;
  const mapBossPct = mapTotalTopics > 0 ? Math.round((done / mapTotalTopics) * 100) : 0;
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
          done > 0 ? `${done} dari ${mapTotalTopics} modul sudah kamu tuntaskan.` : `Ayo mulai dari modul pertama!`
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
        <button class="primary-btn" type="button" data-action="openMenuFromLevels" data-payload="${lvl.key}">📋 Yuk Belajar</button>
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

  // Nudge First Placement Test — sama syarat munculnya dgn Belajar (PRD §16):
  // cuma tampil kalau belum benar-benar selesai (termasuk sempat di-skip).
  const ptDone = getCachedChildStatus().placementTestDone;
  const placementNudge =
    ptDone === false
      ? `
    <div class="card note-card">
      <div class="card-title">🎈 Belum coba First Placement Test</div>
      <p>Kenalan sama 4 kegiatan seru buat cari tahu titik mulai yang paling pas.</p>
      <button class="ghost-btn" type="button" data-action="openPlacementTest" style="margin-top:var(--s3)">Ambil First Placement Test →</button>
    </div>`
      : '';

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
        ${placementNudge}
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
    resume: () => {
      if (!last) return go('menu', { viewLevel: null });
      // 🔒 `viewLevel` DIPIN eksplisit ke level ASLI anak (BUKAN `null` lagi)
      // — `topicIndex` di sini terikat ke array topik `currentPlayableLevel()`
      // (lihat `getLast()`/`setLast()`), jadi HARUS menang di atas cache
      // "nempel" (`browsingLevel()` lapis 1 vs 2) — kalau jatuh ke level lain
      // yang lagi di-browse, topicIndex bisa nunjuk topik yang SALAH.
      go('activity', { skillKey: last.skill, topicIndex: last.topicIndex, step: 0, viewLevel: currentPlayableLevel().key });
    },
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
function skillStarsHtml(skillPct: number): string {
  const stars = Math.max(0, Math.min(5, Math.round(skillPct / 20)));
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
  const sub = kind === 'weak' ? `${s.label} · masih suka kepeleset di sini` : `${s.label} · sudah lancar, jaga terus!`;
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

  const skillCards = visibleSkillKeys(level.key)
    .map((key) => {
      const s = SKILL_META[key];
      const topics = topicsForSkill(key, level.key);
      const doneHere = topics.filter((t) => topicFinished(key, t.id, level.key)).length;
      const skillPct = topics.length > 0 ? Math.round((doneHere / topics.length) * 100) : 0;
      return `
        <div class="skill-card">
          <span class="skill-pct stars${skillPct >= 100 ? ' done' : ''}" aria-label="${Math.round(skillPct / 20)} dari 5 bintang">${skillStarsHtml(skillPct)}</span>
          <span class="ic" style="background:${s.accentBg};color:${s.accent}" aria-hidden="true">${s.emoji}</span>
          <div class="body">
            <h3>${s.label}</h3>
            <p>${doneHere}/${topics.length} materi selesai</p>
          </div>
        </div>`;
    })
    .join('');

  // 🔒 "Hasil Main Game" (permintaan user "update rapor dimana masukan
  // nilai dari hasil main game") — dulu Game Hub ("Raja" Kata/Balon/Susun/
  // Kelompok/Ingatan/Sound Hunt/Story Quest) SAMA SEKALI TIDAK muncul di
  // Rapor (`gameXp`/`recordAttempt` tercatat tapi tidak pernah dibaca di
  // sini) — sekarang tiap Raja dapat kartu SAMA PERSIS pola "Skor Tiap
  // Skill" di atas (`.skill-grid`/`.skill-card`/`skillStarsHtml`, komponen
  // yang SAMA, bukan bikin baru) supaya 2 kartu breakdown ini terasa 1
  // keluarga visual. Bintang dari `getGameAccuracy()` (`Store.gameStats`,
  // diisi `recordAttempt(correct, gameKey)` — lihat komentar `GAME_KEY`
  // `games/wordmatch.ts`), BUKAN dari `gameXp` (itu cuma kosmetik biner
  // main/belum, tidak merefleksikan SEBERAPA TEPAT jawabannya). Roster
  // difilter SAMA PERSIS `renderGame()` (Raja Kelompok cuma tampil kalau
  // level ini punya topik `sortBaskets`) — jangan sampai Rapor menyebut
  // game yang anak sendiri tidak bisa akses dari Game Hub-nya.
  const gameRosterForRapor = RAJA_LIST.filter((r) => r.key !== 'kelompok' || vocabTopicsForLevel(level.key).filter(vocabularyGame.isSortableTopic).length > 0);
  const gameCards = gameRosterForRapor
    .map((r) => {
      const acc = getGameAccuracy(r.key);
      const stats = getGameStats(r.key);
      const pct = acc ?? 0;
      const sub = acc === null ? 'Belum dimainkan' : `${stats.correct}/${stats.total} jawaban tepat`;
      return `
        <div class="skill-card">
          <span class="skill-pct stars${pct >= 100 ? ' done' : ''}" aria-label="${Math.round(pct / 20)} dari 5 bintang">${skillStarsHtml(pct)}</span>
          <span class="ic" style="background:color-mix(in srgb, ${r.color} 20%, var(--surface-2));color:${r.color}" aria-hidden="true">${RAJA_ICON_EMOJI[r.key]}</span>
          <div class="body">
            <h3>${r.name}</h3>
            <p>${sub}</p>
          </div>
        </div>`;
    })
    .join('');

  // List/baris (permintaan user, dibanding grid 3-tile sebelumnya) — pola
  // ikon+label+angka per baris ala referensi kompetitor, TAPI visual bahasa
  // TETAP punya (lingkaran gradien radial sama dgn `.stat-ic` Progresmu,
  // bukan ikon flat kompetitor) supaya konsisten 1 keluarga tampilan dgn
  // kartu lain, bukan tempelan gaya asing. List (bukan grid) juga membuka
  // jalan nambah stat lain nanti tanpa kartu jadi padat/berdesakan.
  const statRowsHtml = [
    { ic: '📘', label: 'Modul tuntas', value: doneCount() },
    { ic: '📝', label: 'Soal dijawab', value: insights.totalAnswered },
    { ic: '🔤', label: 'Kata dikuasai', value: insights.masteredWords },
    { ic: '🗓️', label: 'Hari aktif', value: getActiveDaysCount() },
    { ic: '🔥', label: 'Rekor beruntun', value: getLongestStreak() },
    { ic: '🏰', label: 'Markas ditaklukkan', value: getBossClearedCount() },
  ]
    .map((r) => `<li><span class="stat-list-ic" aria-hidden="true">${r.ic}</span><span class="stat-list-label">${r.label}</span><span class="stat-list-value">${r.value}</span></li>`)
    .join('');

  const statsSingkatCard = `
    <div class="card">
      <span class="eyebrow">📊 Stats Singkat</span>
      <ul class="stat-list">${statRowsHtml}</ul>
    </div>`;

  const strongRows = insights.strongTopics.map((t) => insightTopicRowHtml(t, level.key, 'strong')).join('');
  const weakRows = insights.weakTopics.map((t) => insightTopicRowHtml(t, level.key, 'weak')).join('');

  // Kedua kartu disembunyikan total (bukan kartu "belum ada data" kosong,
  // konsisten `buildPlacementResultCard`/`buildLeaderboardCard`) kalau belum
  // cukup sinyal — anak baru mulai belum "punya kelemahan", itu wajar.
  const strengthsCard = strongRows
    ? `
    <div class="card">
      <span class="eyebrow">💪 Kekuatan Sekarang</span>
      <p class="meta" style="margin-top:2px">Materi yang sudah dikuasai dengan mantap — sekali-sekali diuji lagi biar tetap tajam.</p>
      <div class="topic-grid" style="margin-top:12px">${strongRows}</div>
    </div>`
    : '';

  const missionCard = weakRows
    ? `
    <div class="card">
      <span class="eyebrow">🗺️ Misi Berikutnya</span>
      <p class="meta" style="margin-top:2px">Materi yang masih suka kepeleset — cocok buat dilatih sebentar lagi.</p>
      <div class="topic-grid" style="margin-top:12px">${weakRows}</div>
    </div>`
    : '';

  const wordsCard = insights.strugglingWords.length
    ? `
    <div class="card">
      <span class="eyebrow">📝 Kata yang Masih Dilatih</span>
      <div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:10px">
        ${insights.strugglingWords.map((w) => `<span class="tag">${SKILL_META[w.skill].emoji} ${escapeHtml(w.ir)}</span>`).join('')}
      </div>
    </div>`
    : '';

  root.innerHTML = `
    <section class="two-col">
      <div class="stack">
        ${buildProgressPanel()}
        ${statsSingkatCard}
        <div class="card">
          <span class="eyebrow">🏅 Skor Belajar &amp; Game</span>
          <span class="eyebrow sub" style="margin-top:12px">📘 Skill Belajar</span>
          <div class="skill-grid" style="margin-top:8px">${skillCards || '<p class="meta">Belum ada materi di level ini.</p>'}</div>
          <span class="eyebrow sub" style="margin-top:16px">🎮 Game</span>
          <div class="skill-grid" style="margin-top:8px">${gameCards || '<p class="meta">Belum ada game di level ini.</p>'}</div>
        </div>
        ${strengthsCard}
        ${missionCard}
        ${wordsCard}
      </div>

      <aside class="stack">
        ${buildDailyCard()}
        ${buildPlacementResultCard()}
        ${buildLeaderboardCard()}
        <div class="card note-card">
          <div class="card-title">Untuk orang tua</div>
          <p>Rapor ini murni progres & motivasi — bukan nilai ujian, tidak pernah dipakai menghukum atau mengunci apa pun. "Misi Berikutnya" cuma saran, boleh dilewati kapan saja.</p>
        </div>
      </aside>
    </section>
  `;

  // 🔒 `viewLevel` DIPIN eksplisit ke `currentPlayableLevel()` di KEDUA
  // handler di bawah (BUKAN `null`) — `topicIndex`-nya dihitung `computeInsights()`
  // thd topik `level` (level ASLI anak) di atas, jadi harus menang di atas
  // cache "nempel" `browsingLevel()`, sama alasan `resume` (app.ts).
  setHandlers({
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
  // (doneCount() global ÷ totalTopicsForLevel level ini), supaya angkanya
  // konsisten di mana pun ditampilkan.
  const doneTotal = doneCount();
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
            <p class="lede">Campuran soal dari semua kegiatan di atas, sekaligus — lebih rame, lebih seru. ${bossCleared ? 'Boleh dicoba lagi kapan saja.' : 'Menang sekali saja sudah cukup buat buka level berikutnya!'}</p>
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
  // ucap 🎤 di Kenalan-nya, jadi salah kalau ikut disembunyikan). Reading
  // SATU-SATUNYA skill yang sengaja TANPA TTS sama sekali (dibaca sendiri,
  // types.ts) — cuma itu yang panelnya benar-benar tidak relevan.
  const showVoicePanel = key !== 'reading';

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
      else if (state.step === 1) vocabularyGame.runLatihanInti(stage, topic, nextStep, praiseLevel);
      else vocabularyGame.runTantangan(stage, topic, nextStep, praiseLevel);
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
        if (state.step === 0) listeningGame.renderKenalanSentence(stage, topic, praiseLevel);
        else if (state.step === 1) listeningGame.runLatihanIntiSentence(stage, topic, nextStep, praiseLevel);
        else if ('noteGaps' in topic) listeningGame.runTantanganNote(stage, topic, nextStep, praiseLevel);
        else if ('dialogueLines' in topic) listeningGame.runTantanganDialogue(stage, topic, nextStep, praiseLevel);
        else listeningGame.runTantanganSentence(stage, topic, nextStep, praiseLevel);
      } else {
        if (state.step === 0) listeningGame.renderKenalan(stage, topic, nextStep);
        else if (state.step === 1) listeningGame.runLatihanInti(stage, topic, nextStep);
        else listeningGame.runTantangan(stage, topic, nextStep);
      }
      return;
    }
    case 'speaking': {
      const topic = speakingTopicsForLevel(contentLevel)[state.topicIndex];
      // `AnySpeakingTopic` — format lama (Explorer/Adventurer/Achiever,
      // `model`/`drill`/`roleplay` bebas) vs format KEDUA "py `items`"
      // (Little Stars/Starter, target tertutup 3-tangga recognize/imitate/
      // recall) vs format KETIGA "py `turns`" (Trailblazer, simulasi
      // interview KET/PET) vs format KEEMPAT "py `stories`" (pilot Explorer,
      // cerita mini + pertanyaan komprehensi dijawab lewat mic) — dibedakan
      // runtime lewat `'items' in topic` (tingkat-1) lalu `'turns' in topic`
      // lalu `'stories' in topic` (tingkat-2/3), sama pola persis dgn
      // `AnyListeningTopic`/`AnyReadingTopic`. JANGAN migrasi format lama ke
      // sini tanpa arahan baru user.
      if ('items' in topic) {
        if (state.step === 0) speakingGame.renderKenalanPhrase(stage, topic, nextStep, praiseLevel);
        else if (state.step === 1) speakingGame.runLatihanIntiPhrase(stage, topic, nextStep, praiseLevel);
        else speakingGame.runTantanganPhrase(stage, topic, nextStep, praiseLevel);
      } else if ('turns' in topic) {
        if (state.step === 0) speakingGame.renderKenalanInterview(stage, topic, nextStep);
        else if (state.step === 1) speakingGame.runLatihanIntiInterview(stage, topic, nextStep, praiseLevel);
        else speakingGame.runTantanganInterview(stage, topic, nextStep, praiseLevel);
      } else if ('stories' in topic) {
        if (state.step === 0) speakingGame.renderKenalanStory(stage, topic, nextStep, praiseLevel);
        else if (state.step === 1) speakingGame.runLatihanIntiStory(stage, topic, nextStep, praiseLevel);
        else speakingGame.runTantanganStory(stage, topic, nextStep, praiseLevel);
      } else {
        if (state.step === 0) speakingGame.renderKenalan(stage, topic, nextStep);
        else if (state.step === 1) speakingGame.runLatihanInti(stage, topic, nextStep, praiseLevel);
        else speakingGame.runTantangan(stage, topic, nextStep, praiseLevel);
      }
      return;
    }
    case 'reading': {
      const topic = readingTopicsForLevel(contentLevel)[state.topicIndex];
      // `AnyReadingTopic` — 3 format: format lama (Adventurer/Achiever,
      // `primer`/`drill`/`story`, baca kalimat/cerita, silent) vs format
      // KEDUA "py `items`" (Little Stars/Starter, baca KATA/FRASA ↔ gambar,
      // TTS aktif) vs format KETIGA "py `checks`" (Explorer, 1 kalimat →
      // Benar/Salah, silent) — dibedakan runtime BERTINGKAT lewat
      // `'items' in topic` lalu `'checks' in topic` (types.ts komentar
      // `AnyReadingTopic`), sama pola persis dgn `AnyListeningTopic`. JANGAN
      // migrasi format lama ke sini tanpa arahan baru user.
      if ('items' in topic) {
        if (state.step === 0) readingGame.renderKenalanWord(stage, topic, nextStep, praiseLevel);
        else if (state.step === 1) readingGame.runLatihanIntiWord(stage, topic, nextStep, praiseLevel);
        else readingGame.runTantanganWord(stage, topic, nextStep, praiseLevel);
      } else if ('checks' in topic) {
        if (state.step === 0) readingGame.renderKenalanCheck(stage, topic, nextStep);
        else if (state.step === 1) readingGame.runLatihanIntiCheck(stage, topic, nextStep, praiseLevel);
        else readingGame.runTantanganCheck(stage, topic, nextStep, praiseLevel);
      } else {
        if (state.step === 0) readingGame.renderKenalan(stage, topic, nextStep, praiseLevel);
        else if (state.step === 1) readingGame.runLatihanInti(stage, topic, nextStep, praiseLevel);
        else readingGame.runTantangan(stage, topic, nextStep, praiseLevel);
      }
      return;
    }
    case 'grammar': {
      const topic = grammarTopicsForLevel(contentLevel)[state.topicIndex];
      // `AnyGrammarTopic` — format LAMA (Explorer/Adventurer/Achiever,
      // `examples`/`scramble`/`fill`, teks-first) vs format KEDUA "py
      // `items`" (Little Stars/Starter, kontras 2-kalimat audio+gambar) vs
      // format KETIGA "py `transforms`" (Trailblazer, transformasi kalimat
      // MCQ), dibedakan runtime tingkat-1 `'items' in topic`, tingkat-2
      // `'transforms' in topic` (types.ts komentar `AnyGrammarTopic`), sama
      // pola persis dgn `AnySpeakingTopic`. JANGAN migrasi format lama ke
      // sini tanpa arahan baru user.
      if ('items' in topic) {
        if (state.step === 0) grammarGame.renderKenalanPattern(stage, topic, nextStep, praiseLevel);
        else if (state.step === 1) grammarGame.runLatihanIntiPattern(stage, topic, nextStep, praiseLevel);
        else grammarGame.runTantanganPattern(stage, topic, nextStep, praiseLevel);
      } else if ('transforms' in topic) {
        if (state.step === 0) grammarGame.renderKenalanTransform(stage, topic, nextStep);
        else if (state.step === 1) grammarGame.runLatihanIntiTransform(stage, topic, nextStep, praiseLevel);
        else grammarGame.runTantanganTransform(stage, topic, nextStep, praiseLevel);
      } else {
        if (state.step === 0) grammarGame.renderKenalan(stage, topic, nextStep);
        else if (state.step === 1) grammarGame.runLatihanInti(stage, topic, nextStep);
        else grammarGame.runTantangan(stage, topic, nextStep);
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
  const level = currentLevelMeta();
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

  renderVoicePanel(qs<HTMLDivElement>(root, '#voicePanelMount'));
}

/* ------------------------------------------------------------- homepage -- */

/** Fitur yang ditonjolkan di homepage — 5 skill asli `SKILL_META` + 1 kartu
 *  bonus Peta Level/Tantangan Bos (bukan skill, ditulis manual krn di luar
 *  `SKILL_META`). Dibuat sekali di module scope, bukan tiap render. */
const LANDING_FEATURES: { emoji: string; label: string; desc: string; accent: string; accentBg: string }[] = [
  ...Object.values(SKILL_META).map((s) => ({ emoji: s.emoji, label: s.label, desc: s.tagline, accent: s.accent, accentBg: s.accentBg })),
  {
    emoji: '👑',
    label: 'Peta Level & Tantangan Bos',
    desc: '6 dunia, taklukkan Raja di tiap level',
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
  { emoji: '🎮', title: 'Belajar Sambil Main', desc: 'Vocabulary, Listening, Speaking, Grammar, Reading.' },
  { emoji: '👑', title: 'Taklukkan Raja', desc: 'Menang Tantangan Bos, ujian naik level tiap dunia.' },
];

/** Testimoni placeholder dari sudut pandang ORANG TUA (bukan anak, PRD §14.5
 *  — login/keputusan beli ada di tangan orang tua) — nama & peran generik,
 *  bukan klaim atas orang sungguhan tertentu. */
const LANDING_TESTIMONIALS: { quote: string; name: string; role: string }[] = [
  { quote: 'Anakku jadi suka buka sendiri, seneng banget tiap kali naik level.', name: 'Bunda Sari', role: 'Orang tua anak Explorer' },
  { quote: 'Cuma latihan 10 menit sehari, tapi progresnya kelihatan jelas tiap minggu.', name: 'Ayah Denis', role: 'Orang tua anak Adventurer' },
  { quote: 'Anakku semangat belajar demi bisa menaklukkan Raja berikutnya.', name: 'Bunda Wulan', role: 'Orang tua anak Little Stars' },
];

const LANDING_FAQS: { q: string; a: string }[] = [
  { q: 'Apakah ada biaya lagi setelah bayar?', a: 'Tidak. Rp 99.000 itu sekali bayar untuk akses selamanya — semua level, semua skill, tanpa biaya bulanan atau tambahan lain.' },
  { q: 'Apakah aksesnya dibatasi (per hari/tanggal habis)?', a: 'Tidak. Akses selamanya, anak bisa main kapan saja tanpa batas waktu harian atau tanggal kedaluwarsa.' },
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
  // usia ini, jadi "Fase Awal" lebih jujur drpd mengarang band CEFR palsu.
  // Warna tiap kartu reuse `placeFor()` (scenery.ts) — token tanah yang SAMA
  // dgn Peta Level asli, bukan palet baru, biar kartu ini kebaca sbg preview
  // sungguhan bukan ilustrasi marketing lepas.
  const levelCards = LEVELS.map((lvl) => {
    const cefrTag = lvl.cefr ? `<span class="tag">${lvl.cefr}</span>` : `<span class="tag">Fase Awal</span>`;
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
          <button class="cta landing-nav-btn" type="button" data-action="landingAccount">Daftar</button>
        </div>
      </div>

      <section class="landing-hero">
        <div class="landing-hero-inner">
          <span class="landing-mascot mascot-idle" aria-hidden="true">🦁</span>
          <span class="eyebrow">Petualangan Bahasa Inggris Anak</span>
          <h1 class="display">Naik Level, Taklukkan Raja, Makin Jago Inggris!</h1>
          <p class="lede">Anak main sendiri, level naik sendiri — dari Little Stars sampai Trailblazer, kapan saja dan di mana saja.</p>
          <span class="landing-price">✨ Akses Selamanya — Rp 99.000 sekali bayar</span>
          <button class="cta pt-cta" type="button" data-action="landingAccount">🚀 Daftar &amp; Mulai Sekarang</button>
        </div>
      </section>

      <section class="landing-section" id="cara-kerja">
        <h2 class="h2">Cara Kerja</h2>
        <div class="landing-steps">${stepCards}</div>
      </section>

      <section class="landing-section" id="level">
        <h2 class="h2">6 Level, Ikuti Standar CEFR/Cambridge</h2>
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
          <p class="lede">Akses semua level, semua skill, selamanya — sekali bayar, tanpa langganan bulanan.</p>
          <span class="landing-price">✨ Rp 99.000 sekali bayar</span>
          <button class="cta pt-cta" type="button" data-action="landingAccount">🚀 Daftar &amp; Mulai Sekarang</button>
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
    </div>
  `;

  setHandlers({
    landingAccount: () => go('account'),
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
            <p class="meta" style="margin-top:14px;text-align:center">Belum terdaftar? No HP/email kamu terdaftar otomatis setelah beli.</p>
          </div>
        </main>

        <footer class="standalone-footer">
          <p>© ${new Date().getFullYear()} InggrisinYuk Kids</p>
        </footer>
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
    });
  }

  async function submit(identifier: string): Promise<void> {
    error = null;
    loading = true;
    paint();
    try {
      await apiLogin(identifier);
      await refreshChildStatus();
      await hydrateProgressFromServer(); // tarik progres akun ini (perangkat lain) & gabung ke lokal
      paintLevelChips(); // chip header/rail langsung pakai level akun ini, bukan default lama
      syncUnlocksFromAccount(); // peta ikut hasil tes akun ini walau tesnya dikerjakan di perangkat lain
      const status = getCachedChildStatus();
      go(status.placementTestDone ? 'home' : 'placementTest');
    } catch (err) {
      error = err instanceof ApiRequestError ? err.message : 'Gagal terhubung, coba lagi.';
      loading = false;
      paint();
    }
  }

  paint();
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

  // Arena = kepala panggung Bos: siapa bosnya + peta 4 babak yang akan dilewati.
  // Sengaja diberitahu di depan — anak tahu persis apa yang datang (tenang, bukan
  // kejutan menegangkan), dan tidak ada satu pun angka/nyawa yang bisa berkurang.
  const phases = [
    ['📚', 'Vocabulary'],
    ['🎧', 'Listening'],
    ['✏️', 'Grammar'],
    ['🗣️', 'Speaking'],
  ]
    .map(([emoji, label]) => `<span class="boss-phase">${emoji} ${label}</span>`)
    .join('');

  // Kalau level ini belum punya materi sendiri, Bos-nya berperan sebagai uji
  // kemampuan umum (mirip placement test) buat buka jalurnya duluan — soalnya
  // tetap dari materi yang sudah ada, bukan materi level ini (yang belum ada).
  const subLine = level.hasContent
    ? 'Campuran soal dari 4 kegiatan sekaligus — sekali menang, level berikutnya kebuka!'
    : 'Uji kemampuan umum, bukan materi level ini (yang belum ada) — sekali menang, jalur ke sini kebuka.';

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
        <p>Empat babak, santai saja — boleh diulang sebanyak yang kamu mau.</p>
        <div class="boss-phases">${phases}</div>
      </div>
    </div>
    <div class="card boss-stage" id="stage"></div>
  `;

  setHandlers({ exitBoss: () => go('home') });

  bossGame.runBoss(
    qs<HTMLDivElement>(root, '#stage'),
    () => {
      markBossCleared(levelKey);
      addXp(XP_BOSS);
      renderBossWin(levelKey);
    },
    levelKey
  );
}

function renderBossWin(levelKey: LevelKey): void {
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

  stage.innerHTML = `
    <div class="done-wrap win">
      <div class="boss-burst" aria-hidden="true"><span>⭐</span><span>✨</span><span>⭐</span><span>🎉</span><span>✨</span><span>🎊</span><span>⭐</span><span>🎉</span><span>✨</span></div>
      <div class="sunburst lg mascot-pop" aria-hidden="true"><span class="face">${BOSS_AVATAR[levelKey]}</span><span class="crown">👑</span></div>
      <div class="stars stars-pop" aria-hidden="true">⭐⭐⭐</div>
      <h2 class="win-banner">${BOSS_NAME[levelKey]} Ditaklukkan!</h2>
      <p class="done-sub">Kamu menang lawan ${BOSS_NAME[levelKey]}. <b>+${XP_BOSS} XP</b> ⚡</p>
      ${wonLine}
      ${nextLine}
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
  { key: 'kata', name: 'Word Quest', sub: 'Cocokkan kata & gambar', color: 'var(--c-vocab)', icon: '/img/word_match.jpeg' },
  { key: 'balon', name: 'Balloon Hunt', sub: 'Letupkan balon yang cocok', color: 'var(--sun-500)', icon: '/img/baloon.jpeg' },
  { key: 'susun', name: 'Sentence Puzzle', sub: 'Susun kalimat dari gelembung kata', color: 'var(--c-gram)', icon: '/img/sentence puzzle.png' },
  { key: 'kelompok', name: 'Raja Kelompok', sub: 'Kelompokkan gambarnya', color: 'var(--c-listen)' },
  { key: 'ingatan', name: 'Memory Hunt', sub: 'Cari pasangan katanya', color: 'var(--c-speak)', icon: '/img/ingatan.jpeg' },
  { key: 'soundhunt', name: 'Sound Hunt', sub: 'Dengar & temukan Sound Crystal', color: 'var(--c-read)', icon: '/img/sound_hunt.png' },
  { key: 'storyquest', name: 'Story Quest', sub: 'Baca cerita, jawab, lanjut petualang', color: 'var(--brand-500)', icon: '/img/story_quest.png' },
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
  const level = currentPlayableLevel().key;
  const sortableCount = vocabTopicsForLevel(level).filter(vocabularyGame.isSortableTopic).length;
  // Raja Kelompok cuma tampil kalau level ini punya ≥1 topik `sortBaskets`
  // (baru pilot 1 topik, `bentuk`/Little Stars, materi/game.md §7) — pola
  // sama `visibleSkillKeys()`, sembunyikan diam-diam drpd kartu mati.
  const roster = RAJA_LIST.filter((r) => r.key !== 'kelompok' || sortableCount > 0);

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
        <span class="eyebrow">🧭 Petualangan Game Hub</span>
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
      <button class="raja-card map-card" type="button" data-action="playRaja" data-payload="${r.key}" style="--band-deep:${r.color}">
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
        <h2>🗺️ Semua Markas</h2>
        <p>Pilih markas yang mau dijelajahi.</p>
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
    </div>
    <div class="card raja-stage" id="rajaStage" style="--k:${raja.color}"></div>
    <footer class="standalone-footer">
      <p>© ${new Date().getFullYear()} InggrisinYuk Kids</p>
    </footer>
  `;
  setHandlers({
    backToGame: () => {
      if (!isGameRoundActive()) {
        go('game');
        return;
      }
      placementGame.renderExitConfirm(
        () => {
          /* "Yuk Lanjut" — overlay sudah menutup dirinya sendiri, tidak perlu apa-apa lagi di sini */
        },
        () => go('game')
      );
    },
  });
  runRajaRound(raja.key);
}

/** Topik dipilih ACAK tiap "Main" (bukan daftar-lalu-pilih) — permintaan
 *  user "ini game bukan materi": langsung main, bukan browsing materi dulu.
 *  Raja Kelompok wajib dari pool topik `sortBaskets` (`isSortableTopic`);
 *  Raja Kata py bank kata sendiri (games/wordmatch.ts, TIDAK dari
 *  vocabTopicsForLevel — Map Kerajaan Kata 5-markas Mudah→Sedang→Sulit→
 *  Jago→Legendaris TANPA picker, lihat `wordMatchGame.runWordMatch`); Raja
 *  Balon SEKARANG pola SAMA PERSIS Raja Kata (games/balloonpop.ts, Map
 *  Kerajaan Balon 5-markas TANPA picker tingkat kesulitan lagi, lihat
 *  `balloonPopGame.runBalloonPop`); Raja Ingatan jg py bank kata sendiri
 *  (games/memorymatch.ts, TIDAK terikat level/topik Vocab manapun —
 *  permintaan user "dedicated game"); Sentence Puzzle ('susun')
 *  SATU-SATUNYA yang masih butuh `topics` topik Vocab level ini krn tiap
 *  ronde memilih topik+kata pengecoh sibling sendiri secara internal
 *  (`games/sentencepuzzle.ts`). */
function runRajaRound(key: RajaKey): void {
  const stage = qs<HTMLDivElement>(root, '#rajaStage');
  const level = currentPlayableLevel().key;
  const praiseLevel = currentLevelMeta().key;
  const onRoundDone = () => {
    addXp(XP_FREEPLAY);
    addGameXp(key, XP_FREEPLAY);
    showRajaDone(key);
  };

  if (key === 'kelompok') {
    const pool = vocabTopicsForLevel(level).filter(vocabularyGame.isSortableTopic);
    const topic = pool[Math.floor(Math.random() * pool.length)];
    vocabularyGame.runKelompokkan(stage, topic.id, topic.items, topic.sortBaskets, onRoundDone, praiseLevel);
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
    const topics = vocabTopicsForLevel(level);
    sentencePuzzleGame.runSentencePuzzle(stage, topics, onRoundDone, praiseLevel);
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
