import {
  GRAMMAR_TOPICS,
  LEVEL,
  LEVELS,
  LISTENING_TOPICS,
  SKILL_META,
  SPEAKING_TOPICS,
  VOCAB_TOPICS,
} from './content';
import * as bossGame from './games/boss';
import * as grammarGame from './games/grammar';
import * as listeningGame from './games/listening';
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
import type { LastSpot } from './progress';
import {
  addXp,
  doneCount,
  doneCountFor,
  getLast,
  getXp,
  isBossCleared,
  isDone,
  levelUnlockMap,
  markBossCleared,
  markDone,
  resetProgress,
  setLast,
} from './progress';
import type { AppState, LevelKey, NavKey, Screen, SkillKey } from './types';
import { qs } from './util';
import { renderVoicePanel } from './voice-panel';

const STEP_LABELS = ['Kenalan', 'Latihan Inti', 'Tantangan'];

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

export function initApp(): void {
  root = qs<HTMLDivElement>(document, '#root');
  crumbEl = qs<HTMLDivElement>(document, '#crumb');
  railNavEl = qs<HTMLElement>(document, '#railNav');
  tabbarEl = qs<HTMLElement>(document, '#tabbar');

  // Delegasi klik dipasang di body supaya rail & tab bar (di luar #root) ikut terlayani.
  bindDelegatedClicks(document.body);

  paintLevelChips();
  paintNav();
  render();
}

/* ------------------------------------------------------------------ shell -- */

function paintLevelChips(): void {
  qs<HTMLElement>(document, '#topLevel').innerHTML = `
    <span class="level-chip"><b>${LEVEL.emoji} ${LEVEL.name}</b><span class="cefr">${LEVEL.cefr}</span></span>
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

function go(screen: Screen, extra?: Partial<AppState>): void {
  state.screen = screen;
  Object.assign(state, extra ?? {});
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

  const spark = last
    ? `
      <article class="spark">
        <div class="spark-body">
          <span class="eyebrow">Lanjutkan</span>
          <h2 class="spark-title">${topicTitle(last.skill, last.topicIndex)}</h2>
          <p class="spark-sub">${SKILL_META[last.skill].label} · ${SKILL_META[last.skill].tagline}</p>
          <button class="cta" type="button" data-action="resume">${ICON_PLAY} Main lagi</button>
        </div>
        <div class="spark-art" aria-hidden="true">${SKILL_META[last.skill].emoji}</div>
      </article>`
    : `
      <article class="spark">
        <div class="spark-body">
          <span class="eyebrow">Mulai di sini</span>
          <h2 class="spark-title">Yuk kenalan sama kata baru</h2>
          <p class="spark-sub">Dengar, tebak, ucapkan, lalu susun. Semua lewat main.</p>
          <button class="cta" type="button" data-action="openMenu">${ICON_PLAY} Buka Menu Belajar</button>
        </div>
        <div class="spark-art" aria-hidden="true">🦁</div>
      </article>`;

  const jumps = SKILL_KEYS.map((key) => {
    const s = SKILL_META[key];
    return `
      <div class="jump" role="button" tabindex="0" data-action="openSkill" data-payload="${key}">
        <span class="ic" style="background:${s.accentBg};color:${s.accent}" aria-hidden="true">${s.emoji}</span>
        <span class="txt"><b>${s.label}</b><span>${TOPICS[key].length} materi</span></span>
      </div>`;
  }).join('');

  const levelBody =
    done > 0
      ? `
        <div class="progress-track" role="img" aria-label="${done} dari ${TOTAL_TOPICS} modul selesai">
          <div class="progress-fill" style="width:${Math.round((done / TOTAL_TOPICS) * 100)}%"></div>
        </div>
        <p class="meta" style="margin-top:8px">${done} dari ${TOTAL_TOPICS} modul sudah kamu selesaikan.</p>`
      : `<p class="meta" style="margin-top:12px">Semua modul masih baru — pilih yang paling kamu suka duluan.</p>`;

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

  root.innerHTML = `
    <section class="two-col">
      <div class="stack">
        <div class="greet">
          <h1 class="display">Halo! Mau main apa hari ini?</h1>
          <p class="lede">Pilih satu kegiatan lalu mainkan sampai selesai. Tidak ada nilai, tidak ada batas waktu — santai saja.</p>
        </div>
        ${spark}
        <div class="stack">
          <h2 class="h2">Kegiatan kamu</h2>
          <div class="jump-grid">${jumps}</div>
        </div>
      </div>

      <aside class="stack">
        <div class="card level-card">
          <span class="eyebrow">Level kamu</span>
          <div class="lvl-name">${LEVEL.emoji} ${LEVEL.name}</div>
          <div class="lvl-meta">${LEVEL.cefr} · ${LEVEL.age}</div>
          ${levelBody}
          <div class="xp-row">
            <span class="xp-badge mascot-idle" aria-hidden="true">⚡</span>
            <span class="xp-text"><b>${xp} XP</b><span>Terus bertambah tiap kamu belajar &amp; main</span></span>
          </div>
          <button class="ghost-btn" type="button" data-action="openLevels">🗺️ Lihat Peta Level</button>
        </div>
        ${starCard}
        <div class="card note-card">
          <div class="card-title">Untuk orang tua</div>
          <p>Progres tersimpan di perangkat ini saja — tanpa akun, tanpa iklan, dan tanpa pembelian di dalam aplikasi.</p>
        </div>
      </aside>
    </section>
  `;

  setHandlers({
    openMenu: () => go('menu'),
    openSkill: (payload) => go('topics', { skillKey: payload as SkillKey, topicIndex: 0 }),
    openLevels: () => go('levels'),
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

  root.innerHTML = `
    <section class="two-col">
      <div class="stack">
        <div class="greet">
          <h1 class="display">Menu Belajar</h1>
          <p class="lede">Empat kegiatan dengan alur yang sama, jadi sekali paham bisa dipakai di semua kegiatan.</p>
        </div>
        <div class="skill-grid">${cards}</div>

        <article class="boss-teaser">
          <div class="boss-teaser-art mascot-idle" aria-hidden="true">🦁👑</div>
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
  `;

  setHandlers({
    openSkill: (payload) => go('topics', { skillKey: payload as SkillKey, topicIndex: 0 }),
    openBoss: () => go('boss', { bossLevel: 'explorer' }),
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
  const done = doneCount();

  root.innerHTML = `
    <div class="greet">
      <h1 class="display">Pengaturan</h1>
      <p class="lede">Atur suara pembaca dan lihat progres. Semua pengaturan berlaku di seluruh aplikasi.</p>
    </div>

    <div class="set-grid">
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

      <section class="card">
        <span class="eyebrow">Progres</span>
        <div class="card-title" style="margin:4px 0 8px">Tersimpan di perangkat ini</div>
        <p class="meta">${
          done > 0
            ? `${done} dari ${TOTAL_TOPICS} modul sudah diselesaikan.`
            : 'Belum ada modul yang diselesaikan.'
        }</p>
        <button class="danger-btn" type="button" data-action="resetProgress">Hapus progres di perangkat ini</button>
      </section>

      <section class="card note-card">
        <div class="card-title">Untuk orang tua</div>
        <p>Aplikasi ini berjalan sepenuhnya di perangkat: tanpa akun, tanpa server, tanpa iklan, dan tanpa pembelian dalam aplikasi. Fitur bicara memakai mikrofon hanya saat tombol 🎤 ditekan.</p>
      </section>
    </div>
  `;

  setHandlers({
    resetProgress: () => {
      if (!window.confirm('Hapus semua progres di perangkat ini?')) return;
      resetProgress();
      render();
    },
  });

  renderVoicePanel(qs<HTMLDivElement>(root, '#voicePanelMount'));
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
 */
function renderLevels(): void {
  const unlocked = levelUnlockMap(LEVELS);

  const nodes = LEVELS.map((lvl, i) => {
    const cleared = isBossCleared(lvl.key);
    const isUnlocked = !!unlocked[lvl.key];
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
        <button class="ghost-btn" type="button" data-action="openBossFromLevels" data-payload="${lvl.key}">👑 ${cleared ? 'Main Lagi Lawan Bos' : 'Coba Tantangan Bos'}</button>`;
    } else if (lvl.hasContent) {
      // Skip-ahead: materi ada tapi level masih terkunci — boleh langsung coba Bos-nya.
      actions = `
        <button class="ghost-btn" type="button" data-action="openBossFromLevels" data-payload="${lvl.key}">🎯 Coba Tantangan Bos, Buka Duluan</button>
        <p class="meta" style="margin-top:8px">Atau taklukkan dulu Bos level sebelumnya — otomatis kebuka.</p>`;
    } else if (isUnlocked) {
      actions = `<p class="meta" style="margin-top:8px">Sudah terbuka! Materinya masih disiapkan, tunggu ya.</p>`;
    } else {
      actions = `<p class="meta" style="margin-top:8px">Materi level ini belum ada, jadi Tantangan Bos-nya juga belum bisa dicoba.</p>`;
    }

    const stateClass = cleared ? 'cleared' : isUnlocked ? (lvl.hasContent ? 'open' : 'soon') : 'locked';

    return `
      <li class="level-node ${stateClass}">
        <div class="level-node-rail" aria-hidden="true">
          <span class="level-node-dot">${cleared ? ICON_CHECK : isUnlocked ? i + 1 : ICON_LOCK}</span>
          ${i < LEVELS.length - 1 ? '<span class="level-node-line"></span>' : ''}
        </div>
        <div class="level-node-card">
          <div class="level-node-head">
            <span class="level-node-emoji" aria-hidden="true">${lvl.emoji}</span>
            <div class="level-node-txt">
              <h3>${lvl.name}</h3>
              <div class="row">${cefrBadge}<span class="meta">${lvl.age}</span></div>
            </div>
            ${statusChip}
          </div>
          <div class="level-node-actions">${actions}</div>
        </div>
      </li>`;
  }).join('');

  root.innerHTML = `
    <div class="screen-head">
      <button class="iconbtn" type="button" data-action="backToHome" aria-label="Kembali ke Beranda">${ICON_BACK}</button>
      <div class="txt">
        <h1>🗺️ Peta Level</h1>
        <p>Taklukkan Bos level ini untuk buka level berikutnya — atau langsung coba Bos level yang lebih tinggi buat buka duluan.</p>
      </div>
    </div>
    <ol class="level-map">${nodes}</ol>
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

  if (!level || !level.hasContent) {
    // Jaga-jaga (seharusnya tidak pernah kejadian — tombol Tantangan Bos cuma
    // dirender untuk level yang materinya sudah ada): placeholder jujur, bukan layar kosong.
    root.innerHTML = `
      <div class="screen-head">
        <button class="iconbtn" type="button" data-action="backToLevels" aria-label="Kembali ke Peta Level">${ICON_BACK}</button>
        <div class="txt"><h1>Tantangan Bos</h1><p>Materi level ini belum ada, jadi Tantangan Bos-nya juga belum bisa dicoba.</p></div>
      </div>`;
    setHandlers({ backToLevels: () => go('levels') });
    return;
  }

  root.innerHTML = `
    <div class="act-head">
      <button class="iconbtn" type="button" data-action="exitBoss" aria-label="Keluar dari Tantangan Bos">${ICON_BACK}</button>
      <div class="txt">
        <h1>${level.emoji} Tantangan Bos ${level.name}</h1>
        <div class="sub"><span class="meta">Campuran soal dari 4 kegiatan sekaligus — sekali menang, level berikutnya kebuka!</span></div>
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
  const nextLevel = LEVELS[index + 1];
  const nextUnlocked = nextLevel ? !!levelUnlockMap(LEVELS)[nextLevel.key] : false;

  const nextLine =
    nextLevel && nextUnlocked
      ? `<p class="done-sub">Level <b>${nextLevel.emoji} ${nextLevel.name}</b> baru kebuka! ${
          nextLevel.hasContent ? 'Yuk lanjut ke sana lewat Peta Level.' : '(Materinya masih disiapkan — tunggu ya.)'
        }</p>`
      : '';

  stage.innerHTML = `
    <div class="done-wrap">
      <div class="boss-burst" aria-hidden="true"><span>⭐</span><span>✨</span><span>⭐</span><span>🎉</span><span>✨</span></div>
      <div class="done-mascot mascot-pop" aria-hidden="true">🦁👑</div>
      <div class="stars stars-pop" aria-hidden="true">⭐⭐⭐</div>
      <h2 class="done-title baloo">Bos Ditaklukkan!</h2>
      <p class="done-sub">Kamu menang lawan Bos ${LEVELS.find((l) => l.key === levelKey)!.name}. <b>+${XP_BOSS} XP</b> ⚡</p>
      ${nextLine}
      <button class="primary-btn" type="button" data-action="backToLevels">🗺️ Lihat Peta Level</button>
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
