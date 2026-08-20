import {
  GRAMMAR_TOPICS,
  LEVEL,
  LEVELS,
  LISTENING_TOPICS,
  SKILL_META,
  SPEAKING_TOPICS,
  VOCAB_TOPICS,
} from './content';
import {
  ApiRequestError,
  cacheChildStatus,
  getCachedChildStatus,
  isLoggedIn,
  login as apiLogin,
  logout as apiLogout,
  refreshChildStatus,
} from './account';
import * as bossGame from './games/boss';
import * as grammarGame from './games/grammar';
import * as listeningGame from './games/listening';
import * as placementGame from './games/placement';
import * as speakingGame from './games/speaking';
import * as vocabularyGame from './games/vocabulary';
import {
  ICON_BACK,
  ICON_CHECK,
  ICON_CHEVRON,
  ICON_GAME,
  ICON_HOME,
  ICON_LEARN,
  ICON_LOCK,
  ICON_PLAY,
  ICON_SETTINGS,
} from './icons';
import { bindDelegatedClicks, clearHandlers, setHandlers } from './interaction';
import { CLOUD, HILLS_RIDGE, HILLS_SHORE, TRAIL_BEND_LEFT, TRAIL_BEND_RIGHT, placeFor } from './scenery';
import type { LastSpot } from './progress';
import {
  addXp,
  ANIMAL_AVATARS,
  doneCount,
  doneCountFor,
  getAccuracy,
  getAvatar,
  getLast,
  getName,
  getStreak,
  getWeekActivity,
  getXp,
  isBossCleared,
  isDone,
  levelUnlockMap,
  markBossCleared,
  markDone,
  setAvatar,
  setLast,
  setName,
} from './progress';
import type { AppState, LevelKey, NavKey, Screen, SkillKey } from './types';
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
 * progres level), dan Pengaturan (suara/kecepatan + progres). 4 tujuan,
 * semuanya nyata — link ke fitur yang belum ada = navigasi bohong.
 */
const NAV: { key: NavKey; label: string; screen: Screen; icon: string }[] = [
  { key: 'home', label: 'Beranda', screen: 'home', icon: ICON_HOME },
  { key: 'belajar', label: 'Belajar', screen: 'menu', icon: ICON_LEARN },
  { key: 'game', label: 'Game', screen: 'game', icon: ICON_GAME },
  { key: 'settings', label: 'Pengaturan', screen: 'settings', icon: ICON_SETTINGS },
];

interface TopicRef {
  id: string;
  title: string;
  desc: string;
}

const TOPICS: Record<SkillKey, TopicRef[]> = {
  vocabulary: VOCAB_TOPICS.map((t) => ({ id: t.id, title: t.title, desc: t.desc })),
  listening: LISTENING_TOPICS.map((t) => ({ id: t.id, title: t.title, desc: t.desc })),
  speaking: SPEAKING_TOPICS.map((t) => ({ id: t.id, title: t.title, desc: t.desc })),
  grammar: GRAMMAR_TOPICS.map((t) => ({ id: t.id, title: t.title, desc: t.desc })),
};

const SKILL_KEYS = Object.keys(SKILL_META) as SkillKey[];
const TOTAL_TOPICS = SKILL_KEYS.reduce((n, key) => n + TOPICS[key].length, 0);

const state: AppState = { screen: 'home', skillKey: null, topicIndex: 0, step: 0, bossLevel: null };

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

export function initApp(): void {
  root = qs<HTMLDivElement>(document, '#root');
  crumbEl = qs<HTMLDivElement>(document, '#crumb');
  railNavEl = qs<HTMLElement>(document, '#railNav');
  tabbarEl = qs<HTMLElement>(document, '#tabbar');

  // Delegasi klik dipasang di body supaya rail & tab bar (di luar #root) ikut terlayani.
  bindDelegatedClicks(document.body);

  // Pulihkan layar dari hash URL saat pertama dibuka (reload/bookmark/link
  // dibagikan) — replaceState, bukan push, supaya boot pertama tidak jadi
  // 2 entri riwayat browser.
  if (location.hash) applyHashToState(location.hash);
  lastKnownHash = hashFromState(state);
  if (location.hash !== lastKnownHash) history.replaceState(null, '', lastKnownHash);

  // Tombol back/forward browser (atau URL diketik manual) mengubah hash dari
  // LUAR go() — sinkronkan state balik dari situ. Dibedakan dari echo hash
  // yang kita ubah sendiri lewat perbandingan ke `lastKnownHash`.
  window.addEventListener('hashchange', () => {
    if (location.hash === lastKnownHash) return;
    applyHashToState(location.hash);
    lastKnownHash = location.hash;
    render();
    window.scrollTo({ top: 0, behavior: 'auto' });
  });

  paintLevelChips();
  paintNav();
  render();

  // Segarkan status placement test di background (kalau sudah login) —
  // render ulang cuma kalau layarnya kemungkinan kepengaruh (Belajar/Pengaturan).
  if (isLoggedIn()) {
    void refreshChildStatus().then(() => {
      if (state.screen === 'menu' || state.screen === 'settings') render();
    });
  }
}

/* ------------------------------------------------------------------ shell -- */

function paintLevelChips(): void {
  // Sapaan header — "Hi {nama} : Level" kalau nama sudah diisi (lewat
  // Pengaturan). Belum ada nama = balik ke chip level polos (bukan "Hi :"
  // yang ganjil tanpa nama) — nama murni opsional & lokal (progress.ts),
  // bukan akun (PRD §5).
  const name = getName();
  const avatar = getAvatar();
  const chipText = name ? `${avatar} Hi ${escapeHtml(name)} : ${LEVEL.emoji} ${LEVEL.name}` : `${LEVEL.emoji} ${LEVEL.name}`;
  qs<HTMLElement>(document, '#topLevel').innerHTML = `
    <span class="level-chip"><b>${chipText}</b></span>
  `;
  qs<HTMLElement>(document, '#railFoot').innerHTML = `
    <div class="rail-level">
      <span class="eyebrow">Level</span>
      <b>${LEVEL.emoji} ${LEVEL.name}</b>
      <span class="cefr">${LEVEL.cefr}</span>
    </div>
  `;
}

function activeNav(): NavKey {
  if (state.screen === 'home' || state.screen === 'levels') return 'home';
  if (state.screen === 'settings') return 'settings';
  if (state.screen === 'game') return 'game';
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
 * Hash-routing ringan (permintaan user: URL sebaiknya berubah pindah tab,
 * bukan cuma diam di satu alamat) — `#/<screen>?param=...`. `go()` men-
 * dorong hash baru (push, bikin tombol back/forward browser kerja), sedang
 * `render()` cuma MEMPERBAIKI hash di tempat (replaceState) kalau state
 * berubah di luar go() (mis. gerbang login memaksa ke 'account') — supaya
 * back-button tidak nyangkut di layar yang sebenarnya diblokir. `lastKnownHash`
 * dipakai buat bedakan hashchange asli (tombol back/forward/URL diketik
 * manual) dari echo perubahan yang kita lakukan sendiri.
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
  levels: 'peta',
  boss: 'bos',
  game: 'game',
  account: 'masuk',
  placementTest: 'placement-test',
};
const SLUG_TO_SCREEN: Record<string, Screen> = Object.fromEntries(
  (Object.entries(SCREEN_TO_SLUG) as [Screen, string][]).map(([screen, slug]) => [slug, screen])
);
let lastKnownHash = '';

function hashFromState(s: AppState): string {
  const query: string[] = [];
  if (s.screen === 'topics' || s.screen === 'activity') {
    if (s.skillKey) query.push(`skill=${s.skillKey}`);
    query.push(`topic=${s.topicIndex}`);
    if (s.screen === 'activity') query.push(`step=${s.step}`);
  }
  if (s.screen === 'boss' && s.bossLevel) query.push(`level=${s.bossLevel}`);
  return `#/${SCREEN_TO_SLUG[s.screen]}${query.length ? '?' + query.join('&') : ''}`;
}

/** Terapkan hash dari URL ke `state` — divalidasi ketat (skill/level harus
 *  dikenal, angka harus valid) supaya hash yang diketik manual/lama tidak
 *  bisa bikin renderer nge-crash gara-gara state setengah jadi. */
function applyHashToState(hash: string): void {
  const raw = hash.replace(/^#\/?/, '');
  const [screenPart, queryPart] = raw.split('?');
  const screen = SLUG_TO_SCREEN[screenPart] ?? 'home';
  const params = new URLSearchParams(queryPart ?? '');

  const skillParam = params.get('skill');
  const skillKey = SKILL_KEYS.includes(skillParam as SkillKey) ? (skillParam as SkillKey) : null;
  const topicParam = Number(params.get('topic'));
  const stepParam = Number(params.get('step'));
  const levelParam = params.get('level');
  const bossLevel = LEVELS.some((l) => l.key === levelParam) ? (levelParam as LevelKey) : null;

  state.screen = screen;
  if (screen === 'topics' || screen === 'activity') {
    // Tanpa skill yang valid, topics/activity tidak bisa dirender (butuh
    // SKILL_META[key]) — jatuhkan ke menu, bukan biarkan renderer crash.
    if (!skillKey) {
      state.screen = 'menu';
    } else {
      state.skillKey = skillKey;
      state.topicIndex = Number.isFinite(topicParam) ? topicParam : 0;
      if (screen === 'activity') state.step = Number.isFinite(stepParam) ? stepParam : 0;
    }
  }
  if (screen === 'boss') state.bossLevel = bossLevel;
}

function go(screen: Screen, extra?: Partial<AppState>): void {
  state.screen = screen;
  Object.assign(state, extra ?? {});
  const hash = hashFromState(state);
  if (location.hash !== hash) {
    lastKnownHash = hash;
    location.hash = hash;
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
      if (item) go(item.screen);
    },
  });

  // Login wajib — semua layar digerbang KECUALI layar akun itu sendiri.
  // Dipusatkan di sini (bukan per-tombol) supaya SEMUA jalur navigasi
  // (nav, tombol dalam, deep action) otomatis kena, tanpa perlu guard
  // berulang di tiap handler.
  if (!isLoggedIn() && state.screen !== 'account') {
    state.screen = 'account';
  }
  // Kebalikannya: hash URL bisa saja masih "#/account" (mis. dari sesi lama
  // yang tokennya sudah kedaluwarsa) padahal sekarang sudah login — jangan
  // tampilkan layar login ke orang yang sudah masuk.
  if (isLoggedIn() && state.screen === 'account') {
    state.screen = getCachedChildStatus().placementTestDone === false ? 'placementTest' : 'home';
  }

  // Perbaiki URL DI TEMPAT (replaceState, bukan push) kalau state barusan
  // berubah di luar go() — mis. gerbang login barusan memaksa ke 'account'.
  // replaceState supaya back-button tidak nyangkut di layar yang diblokir.
  const correctedHash = hashFromState(state);
  if (location.hash !== correctedHash) {
    lastKnownHash = correctedHash;
    history.replaceState(null, '', correctedHash);
  }

  // Layar login = halaman tersendiri (pola inggrisinyuk dewasa) — tanpa rail/
  // topline/tabbar & tanpa header nama+level, supaya tidak kelihatan separuh
  // app di baliknya sebelum benar-benar masuk.
  document.body.classList.toggle('is-login', state.screen === 'account');

  syncNav();
  renderCrumb();
  setAccent(state.screen === 'topics' || state.screen === 'activity' ? state.skillKey : null);

  if (state.screen === 'home') return renderHome();
  if (state.screen === 'levels') return renderLevels();
  if (state.screen === 'settings') return renderSettings();
  if (state.screen === 'menu') return renderMenu();
  if (state.screen === 'topics') return renderTopics();
  if (state.screen === 'game') return renderGame();
  if (state.screen === 'boss') return renderBoss();
  if (state.screen === 'account') return renderAccount();
  if (state.screen === 'placementTest') return renderPlacementTestScreen();
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

function topicTitle(key: SkillKey, index: number): string {
  return TOPICS[key][index]?.title ?? '';
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
    parts.push(LEVELS.find((l) => l.key === state.bossLevel)!.name, 'Tantangan Bos');
  } else {
    if (state.skillKey) parts.push(SKILL_META[state.skillKey].label);
    if (state.screen === 'activity' && state.skillKey) {
      parts.push(topicTitle(state.skillKey, state.topicIndex));
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
  const list = TOPICS[last.skill];
  if (!list || !list[last.topicIndex]) return null;
  return last;
}

function renderHome(): void {
  const done = doneCount();
  const last = validLast();

  // Panorama kecil di balik kartu "lanjutkan" — langit, awan, dan siluet
  // pantai yang sama dengan Peta Level, supaya Beranda terasa satu dunia dengan
  // petanya (hiasan murni, aria-hidden, tidak menambah informasi baru).
  const sky = `<span class="cloud c1" aria-hidden="true">${CLOUD}</span><span class="cloud c2" aria-hidden="true">${CLOUD}</span>${HILLS_SHORE}`;

  const spark = last
    ? `
      <article class="spark">
        ${sky}
        <div class="spark-body">
          <span class="eyebrow">Lanjutkan</span>
          <h2 class="spark-title">${topicTitle(last.skill, last.topicIndex)}</h2>
          <p class="spark-sub">${SKILL_META[last.skill].label} · ${SKILL_META[last.skill].tagline}</p>
          <button class="cta" type="button" data-action="resume">${ICON_PLAY} Main lagi</button>
        </div>
        <div class="spark-art" aria-hidden="true"><span class="mascot-idle">${SKILL_META[last.skill].emoji}</span></div>
      </article>`
    : `
      <article class="spark">
        ${sky}
        <div class="spark-body">
          <span class="eyebrow">Mulai di sini</span>
          <h2 class="spark-title">Yuk kenalan sama kata baru</h2>
          <p class="spark-sub">Dengar, tebak, ucapkan, lalu susun. Semua lewat main.</p>
          <button class="cta" type="button" data-action="openMenu">${ICON_PLAY} Buka Menu Belajar</button>
        </div>
        <div class="spark-art" aria-hidden="true"><span class="mascot-idle">🦁</span></div>
      </article>`;

  // Strip peta ringkas — versi mini dari Peta Level (renderLevels di bawah),
  // ditonjolkan di Beranda supaya "sedang menjalani misi, taklukkan Bos,
  // upgrade skill ala Solo Leveling" (PRD §12) terasa begitu app dibuka, bukan
  // cuma waktu buka layar peta penuh. Tap di mana saja = buka peta penuh.
  const mapUnlocked = levelUnlockMap(LEVELS);
  const hereKey = currentStopKey(mapUnlocked);
  const hereIdx = LEVELS.findIndex((l) => l.key === hereKey);
  const hereLevel = hereIdx >= 0 ? LEVELS[hereIdx] : null;
  const nextLevel = hereIdx >= 0 ? LEVELS[hereIdx + 1] : undefined;

  const miniStops = LEVELS.map((lvl) => {
    const cleared = isBossCleared(lvl.key);
    const isUnlocked = !!mapUnlocked[lvl.key];
    const here = lvl.key === hereKey;
    const stamp = cleared
      ? `<span class="trail-stamp" aria-hidden="true">${ICON_CHECK}</span>`
      : isUnlocked
        ? ''
        : `<span class="trail-stamp locked" aria-hidden="true">${ICON_LOCK}</span>`;
    const stateClass = [cleared ? 'is-cleared' : '', isUnlocked ? 'is-open' : 'is-locked', here ? 'is-here' : '']
      .filter(Boolean)
      .join(' ');
    return `
      <li class="mini-stop ${placeFor(lvl.key).cls} ${stateClass}" title="${lvl.name}">
        <span class="mini-medallion" aria-hidden="true"><span>${lvl.emoji}</span>${stamp}</span>
        ${here ? `<span class="mini-you mascot-idle" aria-hidden="true">🦁</span>` : ''}
        ${lvl.cefr ? `<span class="mini-cefr">${lvl.cefr}</span>` : ''}
      </li>`;
  }).join('');

  const miniTrailCaption = hereLevel
    ? nextLevel
      ? `🗺️ Kamu di <b>${hereLevel.emoji} ${hereLevel.name}</b> — taklukkan Bos untuk buka <b>${nextLevel.name}</b>.`
      : `🗺️ Kamu di <b>${hereLevel.emoji} ${hereLevel.name}</b> — perhentian terjauh yang sudah siap!`
    : '🗺️ Peta petualanganmu menunggu di sini.';

  const miniTrail = `
    <div class="mini-trail" role="button" tabindex="0" data-action="openLevels" aria-label="Buka Peta Level">
      <div class="mini-trail-head">
        <p class="mini-trail-caption">${miniTrailCaption}</p>
        <span class="mini-trail-link">Lihat peta ${ICON_CHEVRON}</span>
      </div>
      <ol class="mini-trail-row">${miniStops}</ol>
    </div>`;

  // Progres menuju Tantangan Bos — murni informatif/positif — bukan skor
  // benar-salah (PRD §4.5/§4.6: tanpa rasio benar/salah dalam bentuk apa pun
  // dipakai untuk buka/kunci apa pun; "Ketepatan" di panel Progresmu di bawah
  // cuma motivasi tampilan, tidak pernah menggerbang progres).
  const bossPct = TOTAL_TOPICS > 0 ? Math.round((done / TOTAL_TOPICS) * 100) : 0;

  const starCard =
    done > 0
      ? `
      <div class="card">
        <span class="eyebrow">Bintang kamu</span>
        <div class="star-row" aria-label="${done} bintang">${'⭐'.repeat(Math.min(done, 6))}${done > 6 ? ` +${done - 6}` : ''}</div>
        <p class="meta">Satu bintang untuk setiap modul yang selesai kamu coba.</p>
      </div>`
      : '';

  const xp = getXp();
  const streakDays = getStreak();
  const accuracy = getAccuracy();

  // Progresmu — terinspirasi strip stat + progress bar level di beranda
  // kompetitor, tapi difilter kid-friendly (CLAUDE.md, PRD §4.6/§12.4):
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

  // Persentase SELALU tampil (termasuk 0%) — beda dari starCard/dailyCard
  // yang memang disembunyikan saat kosong (§4.6): di sini progress-bar-nya
  // sendiri LAH fitur yang diminta, jadi menyembunyikannya di 0% = fitur
  // kelihatan tidak ada sama sekali di profil baru. Tetap non-punitive: 0%
  // dibingkai sebagai ajakan ("ayo mulai"), bukan status kosong yang mencolok.
  // Ditaruh sebagai heading tersendiri (nama level + persentase besar, ala
  // baris "Level 1 ... 30% menuju Level 2" di kompetitor) supaya bar-nya
  // jelas kebaca sebagai progress bar, bukan cuma garis dekoratif tipis.
  const levelProgressHead = `
    <div class="level-progress-head">
      <span class="level-progress-name">${hereLevel ? `${hereLevel.emoji} ${hereLevel.name}` : 'Level kamu'}</span>
      <span class="level-progress-pct">${bossPct}% menuju ${nextLevel ? nextLevel.name : 'Tantangan Bos'}</span>
    </div>`;
  const levelProgress = `
    ${levelProgressHead}
    <div class="progress-track" role="img" aria-label="${bossPct}% menuju Tantangan Bos${hereLevel ? ` ${hereLevel.name}` : ''}">
      <div class="progress-fill" style="width:${bossPct}%"></div>
    </div>
    <p class="meta" style="margin-top:8px">${
      done > 0
        ? `${done} dari ${TOTAL_TOPICS} modul sudah kamu tuntaskan.`
        : `Ayo mulai dari modul pertama!`
    }</p>`;

  const progressPanel = `
    <div class="card progress-panel">
      <span class="eyebrow">📈 Progresmu</span>
      ${levelProgress}
      <div class="stat-row">${statTiles}</div>
    </div>`;

  // Progres harian — strip 7 hari, beda dari angka streak di atas (yang
  // punya aturan "berturut-turut" + 1 hari pelindung): strip ini murni
  // menunjukkan hari mana saja anak main minggu ini, tanpa aturan apa pun
  // yang bisa "putus" — tetap dipertahankan sebagai tampilan pelengkap.
  const dayChips = getWeekActivity()
    .map(
      (d) =>
        `<span class="day-chip ${d.active ? 'is-active' : ''} ${d.isToday ? 'is-today' : ''}">${d.label}</span>`
    )
    .join('');
  const dailyCard = `
    <div class="card">
      <span class="eyebrow">Progres Harian</span>
      <div class="day-row" style="margin-top:10px" aria-label="Hari kamu aktif belajar dalam 7 hari terakhir">${dayChips}</div>
      <p class="meta" style="margin-top:10px">Ini hari-hari kamu sudah main minggu ini — libur sehari juga santai saja.</p>
    </div>`;

  // Nudge First Placement Test — sama syarat munculnya dgn Belajar (PRD §16):
  // cuma tampil kalau belum benar-benar selesai (termasuk sempat di-skip).
  const { placementTestDone: ptDone, latestPlacementResult: ptResult } = getCachedChildStatus();
  const placementNudge =
    ptDone === false
      ? `
    <div class="card note-card">
      <div class="card-title">🎈 Belum coba First Placement Test</div>
      <p>Kenalan sama 4 kegiatan seru buat cari tahu titik mulai yang paling pas.</p>
      <button class="ghost-btn" type="button" data-action="openPlacementTest" style="margin-top:var(--s3)">Ambil First Placement Test →</button>
    </div>`
      : '';

  // Hasil placement test — kartu di bawah Progres Harian (permintaan user),
  // cuma tampil begitu ada hasil tersimpan. Angka mentah (correct/total)
  // SENGAJA tidak ditampilkan mentah ke anak (CLAUDE.md poin 2 — hindari
  // skor sebagai evaluasi) — diterjemahkan ke bintang, pola reward yang
  // sudah dipakai di seluruh app (PRD §4.6).
  const placementResultCard = (() => {
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
  })();

  root.innerHTML = `
    <section class="two-col">
      <div class="stack">
        ${spark}
        ${miniTrail}
        ${progressPanel}
      </div>

      <aside class="stack">
        ${starCard}
        ${dailyCard}
        ${placementResultCard}
        ${placementNudge}
        <div class="card note-card">
          <div class="card-title">Untuk orang tua</div>
          <p>Progres tersimpan di perangkat ini saja — tanpa akun, tanpa iklan, dan tanpa pembelian di dalam aplikasi.</p>
        </div>
      </aside>
    </section>
  `;

  setHandlers({
    openMenu: () => go('menu'),
    openLevels: () => go('levels'),
    openPlacementTest: () => go('placementTest'),
    resume: () => {
      if (!last) return go('menu');
      go('activity', { skillKey: last.skill, topicIndex: last.topicIndex, step: 0 });
    },
  });
}

/* ----------------------------------------------------------- menu belajar -- */

function renderMenu(): void {
  const cards = SKILL_KEYS.map((key) => {
    const s = SKILL_META[key];
    const ids = TOPICS[key].map((t) => t.id);
    const doneHere = doneCountFor(key, ids);
    const tags = s.activities.map((a) => `<span class="tag">${a}</span>`).join('');
    return `
      <div class="skill-card" role="button" tabindex="0" data-action="openSkill" data-payload="${key}">
        <span class="ic" style="background:${s.accentBg};color:${s.accent}" aria-hidden="true">${s.emoji}</span>
        <div class="body">
          <h3>${s.label}</h3>
          <p>${s.tagline} · ${TOPICS[key].length} materi</p>
          <span class="row">${tags}${doneHere > 0 ? `<span class="tag ok">${doneHere} selesai ⭐</span>` : ''}</span>
        </div>
        <span class="chev" aria-hidden="true">${ICON_CHEVRON}</span>
      </div>`;
  }).join('');

  const bossCleared = isBossCleared('explorer');

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
        <div class="greet">
          <h1 class="display">Menu Belajar</h1>
          <p class="lede">Empat kegiatan dengan alur yang sama, jadi sekali paham bisa dipakai di semua kegiatan.</p>
        </div>
        <div class="skill-grid">${cards}</div>

        <article class="boss-teaser">
          ${HILLS_RIDGE}
          <div class="sunburst" aria-hidden="true"><span class="face mascot-idle">${BOSS_AVATAR.explorer}</span><span class="crown">👑</span></div>
          <div class="boss-teaser-body">
            <span class="eyebrow">${bossCleared ? 'Sudah kamu taklukkan' : 'Tantangan besar'}</span>
            <h2 class="h2">Tantangan Bos Explorer</h2>
            <p class="lede">Campuran soal dari semua kegiatan di atas, sekaligus — lebih rame, lebih seru. ${bossCleared ? 'Boleh dicoba lagi kapan saja.' : 'Menang sekali saja sudah cukup buat buka level berikutnya!'}</p>
            <button class="cta" type="button" data-action="openBoss">${ICON_PLAY} ${bossCleared ? 'Main Lagi Lawan Bos' : 'Coba Tantangan Bos'}</button>
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
    openBoss: () => go('boss', { bossLevel: 'explorer' }),
    openPlacementTest: () => go('placementTest'),
  });
}

/* ---------------------------------------------------------- daftar materi -- */

function renderTopics(): void {
  const key = state.skillKey as SkillKey;
  const meta = SKILL_META[key];
  const items = TOPICS[key];

  const cards = items
    .map((t, i) => {
      const finished = isDone(key, t.id);
      return `
      <div class="topic-card ${finished ? 'done' : ''}" role="button" tabindex="0" data-action="openTopic" data-payload="${i}">
        <div class="num" aria-hidden="true">${finished ? ICON_CHECK : i + 1}</div>
        <div class="info">
          <b>${t.title}</b>
          <span>${finished ? '⭐ Sudah selesai' : t.desc}</span>
        </div>
        <div class="go">${finished ? 'Main lagi' : 'Mulai'}</div>
      </div>`;
    })
    .join('');

  const doneHere = doneCountFor(key, items.map((t) => t.id));

  root.innerHTML = `
    <div class="screen-head">
      <button class="iconbtn" type="button" data-action="backToMenu" aria-label="Kembali ke Menu Belajar">${ICON_BACK}</button>
      <div class="txt">
        <h1>${meta.emoji} ${meta.label} <span class="tag accent">${items.length} materi</span></h1>
        <p>${meta.tagline} — pilih materi untuk mulai</p>
      </div>
    </div>

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
        ${
          doneHere > 0
            ? `<div class="card">
                 <span class="eyebrow">Sudah selesai</span>
                 <div class="star-row" aria-label="${doneHere} bintang">${'⭐'.repeat(doneHere)}</div>
                 <p class="meta">${doneHere} dari ${items.length} materi di ${meta.label}. Boleh diulang kapan saja.</p>
               </div>`
            : `<div class="card note-card">
                 <div class="card-title">Belum tahu mau mulai dari mana?</div>
                 <p>Mulai dari materi pertama — urutannya sudah disusun dari yang paling gampang.</p>
               </div>`
        }
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
  });
}

/* --------------------------------------------------------------- aktivitas -- */

function renderActivity(): void {
  const key = state.skillKey as SkillKey;
  const meta = SKILL_META[key];

  const steps = STEP_LABELS.map((label, i) => {
    const cls = i === state.step ? 'active' : i < state.step ? 'done' : '';
    // Cuma langkah yang sudah/sedang dilewati yang boleh diklik — tidak bisa lompat maju.
    const attrs = i <= state.step ? `data-action="jumpStep" data-payload="${i}" role="button" tabindex="0"` : '';
    const dot = i < state.step ? ICON_CHECK : String(i + 1);
    return `<li class="${cls}" ${attrs}><span class="dot" aria-hidden="true">${dot}</span>${label}</li>`;
  }).join('');

  root.innerHTML = `
    <div class="act-head">
      <button class="iconbtn" type="button" data-action="backStep" aria-label="Kembali satu langkah">${ICON_BACK}</button>
      <div class="txt">
        <h1>${topicTitle(key, state.topicIndex)}</h1>
        <div class="sub">
          <span class="tag accent">${meta.emoji} ${meta.label}</span>
          <span class="meta">Langkah ${state.step + 1} dari ${STEP_LABELS.length}</span>
        </div>
      </div>
    </div>

    <div class="act-body">
      <div class="act-side">
        <ol class="stepper">${steps}</ol>
        <details class="voice-drop">
          <summary>🔊 Suara &amp; kecepatan</summary>
          <div id="voicePanelMount"></div>
        </details>
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
      render();
    },
  });

  renderVoicePanel(qs<HTMLDivElement>(root, '#voicePanelMount'));
  runStage(key, qs<HTMLDivElement>(root, '#stage'));
}

/** Tombol kembali: mundur 1 langkah (Tantangan→Latihan Inti→Kenalan), lalu ke Daftar Materi. */
function prevStep(): void {
  if (state.step > 0) {
    state.step -= 1;
    render();
  } else {
    go('topics');
  }
}

function nextStep(): void {
  if (state.step < STEP_LABELS.length - 1) {
    state.step += 1;
    render();
  } else {
    renderSelesai();
  }
}

function runStage(key: SkillKey, stage: HTMLElement): void {
  switch (key) {
    case 'vocabulary': {
      const topic = VOCAB_TOPICS[state.topicIndex];
      if (state.step === 0) vocabularyGame.renderKenalan(stage, topic, nextStep);
      else if (state.step === 1) vocabularyGame.runLatihanInti(stage, topic, nextStep);
      else vocabularyGame.runTantangan(stage, topic, nextStep);
      return;
    }
    case 'listening': {
      const topic = LISTENING_TOPICS[state.topicIndex];
      if (state.step === 0) listeningGame.renderKenalan(stage, topic, nextStep);
      else if (state.step === 1) listeningGame.runLatihanInti(stage, topic, nextStep);
      else listeningGame.runTantangan(stage, topic, nextStep);
      return;
    }
    case 'speaking': {
      const topic = SPEAKING_TOPICS[state.topicIndex];
      if (state.step === 0) speakingGame.renderKenalan(stage, topic, nextStep);
      else if (state.step === 1) speakingGame.runLatihanInti(stage, topic, nextStep);
      else speakingGame.runTantangan(stage, topic, nextStep);
      return;
    }
    case 'grammar': {
      const topic = GRAMMAR_TOPICS[state.topicIndex];
      if (state.step === 0) grammarGame.renderKenalan(stage, topic, nextStep);
      else if (state.step === 1) grammarGame.runLatihanInti(stage, topic, nextStep);
      else grammarGame.runTantangan(stage, topic, nextStep);
      return;
    }
  }
}

function renderSelesai(): void {
  const key = state.skillKey as SkillKey;
  const topic = TOPICS[key][state.topicIndex];
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
      <button class="ghost-btn" type="button" data-action="backToHome">🏠 Beranda</button>
    </div>
  `;
  setHandlers({
    restart: () => go('activity', { step: 0 }),
    backToTopics: () => go('topics'),
    backToHome: () => go('home'),
  });
}

/* -------------------------------------------------------------- pengaturan -- */

function renderSettings(): void {
  const avatar = getAvatar();
  const avatarGrid = ANIMAL_AVATARS.map(
    (a) =>
      `<button class="avatar-opt ${a === avatar ? 'is-active' : ''}" type="button" data-action="pickAvatar" data-payload="${a}" aria-label="Pilih avatar ${a}">${a}</button>`
  ).join('');

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

  root.innerHTML = `
    <div class="set-grid">
      <section class="card">
        <span class="eyebrow">Nama panggilan</span>
        <input type="text" id="nameInput" class="text-input" maxlength="24" placeholder="Nama anak (opsional)" value="${escapeHtml(getName())}" style="margin-top:8px" />
        <div class="avatar-grid" style="margin-top:12px">${avatarGrid}</div>
        <p class="meta" style="margin-top:10px">Cuma tersimpan di perangkat ini — tidak dikirim ke mana pun.</p>
      </section>

      <section class="card voice-flush">
        <span class="eyebrow">Suara pembaca</span>
        <div class="card-title" style="margin:4px 0 12px">Kecepatan &amp; jenis suara</div>
        <div id="voicePanelMount"></div>
        <p class="meta" style="margin-top:12px">Pelankan suara kalau anak baru mulai — 0.5x–0.75x biasanya paling enak diikuti.</p>
      </section>

      <section class="card">
        <span class="eyebrow">Level</span>
        <div class="lvl-name" style="margin:4px 0 2px">${LEVEL.emoji} ${LEVEL.name}</div>
        <div class="lvl-meta">${LEVEL.cefr} · ${LEVEL.age}</div>
        <ul class="set-list">
          <li><span>Badge CEFR ditampilkan kecil untuk orang tua; anak cukup lihat nama levelnya.</span></li>
          <li><span>Naik level berbasis modul yang selesai, bukan nilai atau lamanya belajar.</span></li>
        </ul>
      </section>

      <section class="card note-card">
        <div class="card-title">Untuk orang tua</div>
        <p>Progres anak tersimpan di perangkat ini — tanpa iklan, tanpa pembelian dalam aplikasi. Fitur bicara memakai mikrofon hanya saat tombol 🎤 ditekan.</p>
      </section>

      ${placementTestCard}

      <button class="ghost-btn" type="button" data-action="logoutAccount">👋 Keluar</button>
    </div>
  `;

  setHandlers({
    openPlacementTestFromSettings: () => go('placementTest'),
    logoutAccount: () => {
      apiLogout();
      cacheChildStatus(null, null);
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

        <footer class="login-footer">
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
    `;
    setHandlers({ backToHome: () => go('home') });
    return qs<HTMLDivElement>(root, '#stage');
  }

  function toContinue(levelRecommended: string | undefined): void {
    if (levelRecommended) {
      unlockLevelsUpTo(levelRecommended);
      const stage = qs<HTMLDivElement>(root, '#stage');
      placementGame.renderPlacementResult(
        stage,
        levelRecommended,
        () => go('home'),
        () => go('levels')
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
          go('home');
        })();
      }
    );
  }

  function paintQuestions(): void {
    const stage = qs<HTMLDivElement>(root, '#stage');
    placementGame.runPlacementQuestions(stage, (outcome) => {
      if (outcome.error) {
        stage.innerHTML = `<p class="meta" style="color:var(--try)">${escapeHtml(outcome.error)}</p>`;
        return;
      }
      toContinue(outcome.levelRecommended);
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
    placementGame.renderPlacementLimitReached(
      stage,
      cachedLevel ?? undefined,
      () => go('home'),
      () => go('levels')
    );
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
 * `renderLevels`. Cara lain untuk melompat lebih jauh: Placement Test
 * (`renderPlacementTestScreen`/`unlockLevelsUpTo`) — hasilnya menandai Bos
 * semua level di bawah rekomendasi sebagai "ditaklukkan" sekaligus.
 */
/** Perhentian tempat anak berada sekarang: level terbuka pertama yang materinya
 *  ada tapi Bos-nya belum ditaklukkan; kalau semua sudah, pakai yang terakhir
 *  terbuka. Murni turunan dari data yang sudah ada — tidak menyimpan apa pun. */
function currentStopKey(unlocked: Record<string, boolean>): LevelKey | null {
  const next = LEVELS.find((l) => l.hasContent && unlocked[l.key] && !isBossCleared(l.key));
  if (next) return next.key;
  const lastOpen = LEVELS.filter((l) => unlocked[l.key]).pop();
  return lastOpen ? lastOpen.key : null;
}

function renderLevels(): void {
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

  // Persentase yang sama dengan panel "Progresmu" di Beranda (bossPct di
  // renderHome) — ditampilkan lagi di sini supaya begitu anak buka peta penuh,
  // progresnya tetap kelihatan tanpa harus balik ke Beranda dulu.
  const done = doneCount();
  const mapBossPct = TOTAL_TOPICS > 0 ? Math.round((done / TOTAL_TOPICS) * 100) : 0;
  // Selalu tampil (termasuk 0%) selama sudah ada perhentian aktif — sama
  // seperti levelProgress di renderHome (heading nama level + persentase
  // besar di atas bar, supaya bar-nya jelas kebaca, bukan garis dekoratif).
  const mapProgress = hereLevel
    ? `
        <div class="level-progress-head" style="max-width:44ch;position:relative;z-index:1">
          <span class="level-progress-name">${hereLevel.emoji} ${hereLevel.name}</span>
          <span class="level-progress-pct">${mapBossPct}% menuju ${nextLevel ? nextLevel.name : 'Tantangan Bos'}</span>
        </div>
        <div class="progress-track" role="img" aria-label="${mapBossPct}% menuju Tantangan Bos ${hereLevel.name}" style="margin-top:10px;max-width:44ch">
          <div class="progress-fill" style="width:${mapBossPct}%"></div>
        </div>
        <p class="meta" style="margin-top:8px;position:relative;z-index:1">${
          done > 0 ? `${done} dari ${TOTAL_TOPICS} modul sudah kamu tuntaskan.` : `Ayo mulai dari modul pertama!`
        }</p>`
    : '';

  const stops = LEVELS.map((lvl, i) => {
    const cleared = isBossCleared(lvl.key);
    const isUnlocked = !!unlocked[lvl.key];
    const here = lvl.key === hereKey;
    const place = placeFor(lvl.key);
    const cefrBadge = lvl.cefr ? `<span class="tag">${lvl.cefr}</span>` : '';

    const statusChip = cleared
      ? `<span class="tag ok">${ICON_CHECK} Bos ditaklukkan</span>`
      : isUnlocked && lvl.hasContent
        ? `<span class="tag accent">Terbuka</span>`
        : isUnlocked
          ? `<span class="tag">Terbuka · materi segera hadir</span>`
          : `<span class="tag">${ICON_LOCK} Terkunci</span>`;

    let actions: string;
    if (lvl.hasContent && isUnlocked) {
      actions = `
        <button class="primary-btn" type="button" data-action="openMenuFromLevels" data-payload="${lvl.key}">📋 Buka Menu Belajar</button>
        <button class="ghost-btn" type="button" data-action="openBossFromLevels" data-payload="${lvl.key}">${BOSS_AVATAR[lvl.key]} ${cleared ? 'Main Lagi Lawan Bos' : 'Coba Tantangan Bos'}</button>`;
    } else if (isUnlocked) {
      actions = `<p class="meta">Sudah terbuka! Materinya masih disiapkan, tunggu ya.</p>`;
    } else if (i === firstLockedIndex) {
      // Level terkunci PERTAMA (persis setelah batas terbuka) — satu-satunya
      // yang boleh ditantang duluan. Bos di sini berfungsi sebagai uji
      // kemampuan umum (mirip placement test) kalau level ini sendiri belum
      // punya materi, jadi tetap bisa dicoba pakai soal dari materi yang ada.
      actions = `
        <button class="ghost-btn" type="button" data-action="openBossFromLevels" data-payload="${lvl.key}">${BOSS_AVATAR[lvl.key]} Coba Tantangan Bos, Buka Duluan</button>
        <p class="meta">${
          lvl.hasContent
            ? 'Atau taklukkan dulu Bos level sebelumnya — otomatis kebuka.'
            : 'Materi lengkap level ini belum ada, tapi Tantangan Bos-nya tetap bisa dicoba sebagai uji kemampuan umum.'
        }</p>`;
    } else {
      // Berurutan (PRD §12.1/§16, direvisi) — level lebih jauh dari batas
      // terbuka tidak bisa dilompati, walau level di depannya bisa. Taklukkan
      // dulu Bos level sebelumnya (atau placement test yang merekomendasikan
      // sejauh ini, lihat §16) baru tombol ini hidup.
      actions = `
        <button class="ghost-btn" type="button" disabled aria-disabled="true">${ICON_LOCK} Bos Terkunci</button>
        <p class="meta">Taklukkan dulu Bos level sebelumnya secara berurutan — atau coba Placement Test di Pengaturan.</p>`;
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
          <span class="trail-place">Perhentian ${i + 1} · ${place.name}</span>
          <h3>${lvl.name}${here ? ' <span class="tag accent">Kamu di sini</span>' : ''}</h3>
          <div class="trail-meta">${cefrBadge}<span class="meta">${lvl.age}</span>${statusChip}</div>
          <div class="trail-actions">${actions}</div>
        </div>
      </li>`;
  }).join('');

  root.innerHTML = `
    <div class="screen-head">
      <button class="iconbtn" type="button" data-action="backToHome" aria-label="Kembali ke Beranda">${ICON_BACK}</button>
      <div class="txt">
        <h1>🗺️ Peta Level</h1>
        <p>Enam perhentian, satu jalur. Taklukkan Bos di perhentianmu untuk membuka yang berikutnya.</p>
      </div>
    </div>

    <section class="two-col">
      <div class="map-board">
        <div class="map-sky">
          <span class="map-sun" aria-hidden="true"></span>
          <span class="cloud c1" aria-hidden="true">${CLOUD}</span>
          <span class="cloud c2" aria-hidden="true">${CLOUD}</span>
          <h2>Jalur Petualangan</h2>
          <p>Jalannya lewat sini. Kamu boleh jalan pelan-pelan — tidak ada batas waktu, dan tidak ada yang hilang kalau diulang.</p>
          ${mapProgress}
        </div>
        <ol class="trail">${stops}</ol>
        <div class="trail-horizon">
          <div class="trail-rail" aria-hidden="true">${TRAIL_BEND_RIGHT}</div>
          <div class="trail-horizon-txt">
            <b>Ujung jalur untuk sekarang</b>
            <span>Perhentian berikutnya masih dibangun — materinya menyusul.</span>
          </div>
        </div>
      </div>

      <aside class="stack">
        <div class="card">
          <span class="eyebrow">Tanda di peta</span>
          <ul class="map-legend" style="margin-top:12px">
            <li><span class="legend-dot is-cleared" aria-hidden="true">${ICON_CHECK}</span>Bos-nya sudah kamu taklukkan</li>
            <li><span class="legend-dot" aria-hidden="true">🧭</span>Terbuka — boleh dimainkan sekarang</li>
            <li><span class="legend-dot is-locked" aria-hidden="true">${ICON_LOCK}</span>Masih tersegel</li>
          </ul>
          <p class="meta" style="margin-top:12px">Singa 🦁 menandai perhentianmu sekarang.</p>
        </div>
        <div class="card note-card">
          <div class="card-title">Mau lompat lebih jauh?</div>
          <p>Tantangan Bos perhentian berikutnya (yang paling dekat) boleh langsung dicoba tanpa nunggu — tapi perhentian setelahnya tetap harus berurutan. Mau lompat lebih jauh lagi? Coba Placement Test di Pengaturan.</p>
        </div>
      </aside>
    </section>
  `;

  setHandlers({
    backToHome: () => go('home'),
    openMenuFromLevels: () => go('menu'),
    openBossFromLevels: (payload) => go('boss', { bossLevel: payload as LevelKey }),
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
        <button class="iconbtn" type="button" data-action="backToLevels" aria-label="Kembali ke Peta Level">${ICON_BACK}</button>
        <div class="txt"><h1>Tantangan Bos</h1><p>Level ini tidak ditemukan — coba lewat Peta Level lagi ya.</p></div>
      </div>`;
    setHandlers({ backToLevels: () => go('levels') });
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
      <button class="iconbtn" type="button" data-action="exitBoss" aria-label="Keluar dari Tantangan Bos">${ICON_BACK}</button>
      <div class="txt">
        <h1>${level.emoji} Tantangan Bos ${level.name}</h1>
        <div class="sub"><span class="meta">${subLine}</span></div>
      </div>
    </div>
    <div class="boss-arena">
      <span class="cloud" aria-hidden="true">${CLOUD}</span>
      ${HILLS_RIDGE}
      <div class="sunburst" aria-hidden="true"><span class="face mascot-idle">${BOSS_AVATAR[levelKey]}</span><span class="crown">👑</span></div>
      <div class="boss-arena-body">
        <span class="eyebrow" style="color:#7A4A08">Arena Tantangan</span>
        <h2>Bos ${level.name} sudah siap main!</h2>
        <p>Empat babak, santai saja — boleh diulang sebanyak yang kamu mau.</p>
        <div class="boss-phases">${phases}</div>
      </div>
    </div>
    <div class="card boss-stage" id="stage"></div>
  `;

  setHandlers({ exitBoss: () => go('levels') });

  bossGame.runBoss(qs<HTMLDivElement>(root, '#stage'), () => {
    markBossCleared(levelKey);
    addXp(XP_BOSS);
    renderBossWin(levelKey);
  });
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
    ? `<p class="done-sub">Jalur ke <b>${wonLevel.emoji} ${wonLevel.name}</b> sudah kebuka. Materi belajarnya sendiri masih disiapkan — untuk sekarang, lanjut aja ke perhentian berikutnya lewat Peta Level.</p>`
    : '';

  const nextLine =
    nextLevel && nextUnlocked
      ? `<p class="done-sub">Level <b>${nextLevel.emoji} ${nextLevel.name}</b> baru kebuka! ${
          nextLevel.hasContent ? 'Yuk lanjut ke sana lewat Peta Level.' : '(Materinya masih disiapkan — tunggu ya.)'
        }</p>`
      : '';

  stage.innerHTML = `
    <div class="done-wrap win">
      <div class="boss-burst" aria-hidden="true"><span>⭐</span><span>✨</span><span>⭐</span><span>🎉</span><span>✨</span><span>🎊</span><span>⭐</span><span>🎉</span><span>✨</span></div>
      <div class="sunburst lg mascot-pop" aria-hidden="true"><span class="face">${BOSS_AVATAR[levelKey]}</span><span class="crown">👑</span></div>
      <div class="stars stars-pop" aria-hidden="true">⭐⭐⭐</div>
      <h2 class="win-banner">Bos Ditaklukkan!</h2>
      <p class="done-sub">Kamu menang lawan Bos ${wonLevel.name}. <b>+${XP_BOSS} XP</b> ⚡</p>
      ${wonLine}
      ${nextLine}
      <button class="primary-btn" type="button" data-action="backToLevels">Lihat Peta Level</button>
      <button class="ghost-btn" type="button" data-action="backToHome">🏠 Beranda</button>
    </div>
  `;
  setHandlers({
    backToLevels: () => go('levels'),
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
function renderGame(): void {
  const cards = SKILL_KEYS.flatMap((key) => {
    const meta = SKILL_META[key];
    return TOPICS[key].map(
      (t, i) => `
      <div class="skill-card" role="button" tabindex="0" data-action="playFree" data-payload="${key}:${i}">
        <span class="ic" style="background:${meta.accentBg};color:${meta.accent}" aria-hidden="true">${meta.emoji}</span>
        <div class="body">
          <h3>${t.title}</h3>
          <p>${meta.label} · main bebas</p>
        </div>
        <span class="chev" aria-hidden="true">${ICON_CHEVRON}</span>
      </div>`
    );
  }).join('');

  root.innerHTML = `
    <div class="greet">
      <h1 class="display">Game</h1>
      <p class="lede">Main bebas kapan saja — ulang kegiatan yang sudah kamu buka di Explorer. Tetap dapat XP tiap main, tapi tidak menambah bintang dan tidak dihitung untuk buka level baru — bintang &amp; Tantangan Bos tetap dari Menu Belajar.</p>
    </div>
    <div class="skill-grid game-grid">${cards}</div>
  `;

  setHandlers({
    playFree: (payload) => {
      const [key, idx] = (payload as string).split(':');
      openFreePlay(key as SkillKey, Number(idx));
    },
  });
}

function openFreePlay(key: SkillKey, index: number): void {
  setAccent(key);
  const meta = SKILL_META[key];
  root.innerHTML = `
    <div class="act-head">
      <button class="iconbtn" type="button" data-action="backToGame" aria-label="Kembali ke Game">${ICON_BACK}</button>
      <div class="txt">
        <h1>${topicTitle(key, index)}</h1>
        <div class="sub"><span class="tag accent">${meta.emoji} Main Bebas</span></div>
      </div>
    </div>
    <div class="card" id="freeStage"></div>
  `;
  setHandlers({ backToGame: () => go('game') });
  runFreePlayRound(key, index);
}

function runFreePlayRound(key: SkillKey, index: number): void {
  const stage = qs<HTMLDivElement>(root, '#freeStage');
  const onRoundDone = () => {
    addXp(XP_FREEPLAY);
    showFreePlayDone(key, index);
  };
  switch (key) {
    case 'vocabulary':
      vocabularyGame.runLatihanInti(stage, VOCAB_TOPICS[index], onRoundDone);
      return;
    case 'listening':
      listeningGame.runLatihanInti(stage, LISTENING_TOPICS[index], onRoundDone);
      return;
    case 'speaking':
      speakingGame.runLatihanInti(stage, SPEAKING_TOPICS[index], onRoundDone);
      return;
    case 'grammar':
      grammarGame.runLatihanInti(stage, GRAMMAR_TOPICS[index], onRoundDone);
      return;
  }
}

function showFreePlayDone(key: SkillKey, index: number): void {
  const stage = qs<HTMLDivElement>(root, '#freeStage');
  stage.innerHTML = `
    <div class="done-wrap">
      <div class="done-mascot mascot-pop" aria-hidden="true">🦁🎉</div>
      <p class="done-sub">Seru! <b>+${XP_FREEPLAY} XP</b> ⚡ Main lagi atau pilih kegiatan lain?</p>
      <button class="primary-btn" type="button" data-action="replayFree">🔁 Main Lagi</button>
      <button class="ghost-btn" type="button" data-action="toGame">📋 Pilih Lainnya</button>
    </div>
  `;
  setHandlers({
    replayFree: () => runFreePlayRound(key, index),
    toGame: () => go('game'),
  });
}
