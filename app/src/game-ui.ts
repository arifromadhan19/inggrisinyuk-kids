/**
 * Tampilan bersama Game Hub (Fase 2 `materi/suasana_game.md`, permintaan
 * user "kerjakan fase 1 dan 2"): peta markas berupa JALAN BERKELOK (saga
 * map) menggantikan grid kartu `.raja-grid` yang mirip daftar materi,
 * pengumuman singkat saat masuk markas, & perayaan saat markas tuntas.
 * Dipakai ketujuh orkestrator game (`games/*.ts` `renderMap`/`playStage`).
 *
 * Latar dunia per game (`.raja-stage.world-<key>`) dipasang `renderGamePlay`
 * (app.ts) lewat CSS, jadi tidak perlu diubah per game.
 */
import { isDevTestAccount } from './account';
import { sfx } from './game-audio';

export interface JourneyStop {
  name: string;
  emoji: string;
  /** `WordMatchDifficulty` — dipakai utk warna tag `.diff-*`. */
  difficulty: string;
  label: string;
}

/** Markas tuntas sebelumnya per game — supaya markas yang BARU tuntas
 *  diberi animasi & suara sekali saja saat kembali ke peta. */
const lastCleared = new Map<string, Set<number>>();

/** Palet & hiasan dunia tiap game (TANPA makhluk hidup — aturan ikon app).
 *  `ground` = gradasi rumput/tanah, `path` = jalan, `water` = sungai. */
interface World {
  ground: [string, string];
  patch: string;
  path: string;
  pathEdge: string;
  water: string;
  deco: string[];
  finish: string;
}

const WORLDS: Record<string, World> = {
  kata: { ground: ['#9BE07A', '#6CC35A'], patch: '#B7EC97', path: '#F7D98B', pathEdge: '#D9A85B', water: '#5EC8F2', deco: ['🌳', '🌷', '🪨', '🌲', '🏡', '🌼'], finish: '🏰' },
  balon: { ground: ['#A8E6FF', '#8FD68A'], patch: '#C9F1FF', path: '#FFE3A3', pathEdge: '#E6B25E', water: '#6FD0F5', deco: ['☁️', '🎈', '🌈', '🌳', '🌼', '☁️'], finish: '🎪' },
  susun: { ground: ['#C8E98E', '#93CF6E'], patch: '#DDF3B0', path: '#FFE0B8', pathEdge: '#E0A46A', water: '#63C7EE', deco: ['🌻', '🌳', '🧩', '🪨', '🌷', '🌲'], finish: '🎭' },
  kelompok: { ground: ['#D8EB8C', '#A9D46A'], patch: '#EBF5B8', path: '#F4D08A', pathEdge: '#C99650', water: '#5FC4EC', deco: ['🌾', '🌳', '🧺', '🌻', '🏠', '🪨'], finish: '🏰' },
  ingatan: { ground: ['#B9D9A0', '#86BC7D'], patch: '#CFE6BC', path: '#EAD9B8', pathEdge: '#B99B6B', water: '#6CB8E8', deco: ['🍄', '🌳', '🕯️', '🪨', '🌲', '✨'], finish: '⭐' },
  soundhunt: { ground: ['#8FD37C', '#4FA55A'], patch: '#A9E08F', path: '#E9CF95', pathEdge: '#B58A4E', water: '#58C2EC', deco: ['🌲', '🍄', '🌳', '🌿', '🌲', '🍄'], finish: '🏰' },
  storyquest: { ground: ['#F2E3A6', '#C9DB8A'], patch: '#F8EDC4', path: '#FFFFFF', pathEdge: '#D8B780', water: '#6CCBEF', deco: ['📚', '🌳', '🌷', '🪨', '📖', '🌼'], finish: '🏰' },
};

/** Ukuran kanvas peta (px virtual — diskalakan ke lebar layar). */
const MAP_W = 360;
const ROW_H = 150;
const TOP = 105;
const BOTTOM = 120;
/** Posisi horizontal markas — zig-zag. */
const XS = [96, 262, 104, 258, 98, 264];

function nodePos(i: number): { x: number; y: number } {
  return { x: XS[i % XS.length], y: TOP + i * ROW_H };
}

/** Kurva jalan antar-markas: turun tegak dari markas, lalu menyeberang. */
function segment(i: number): { p0: number[]; c1: number[]; c2: number[]; p3: number[] } {
  const a = nodePos(i);
  const b = nodePos(i + 1);
  return { p0: [a.x, a.y], c1: [a.x, a.y + ROW_H * 0.62], c2: [b.x, b.y - ROW_H * 0.62], p3: [b.x, b.y] };
}

function bez(sg: ReturnType<typeof segment>, t: number): number[] {
  const u = 1 - t;
  return [0, 1].map((k) => u * u * u * sg.p0[k] + 3 * u * u * t * sg.c1[k] + 3 * u * t * t * sg.c2[k] + t * t * t * sg.p3[k]);
}

/** Ilustrasi peta (SVG): rumput + petak terang, sungai + jembatan kayu,
 *  jalan tanah bertepi, hiasan emoji, papan "Mulai" & tanda finish. */
function mapSceneSvg(world: World, n: number, doneUntil: number, h: number): string {
  let road = '';
  let done = '';
  for (let i = 0; i < n - 1; i++) {
    const sg = segment(i);
    const d = `M${sg.p0} C${sg.c1} ${sg.c2} ${sg.p3}`;
    road += d + ' ';
    if (i < doneUntil) done += d + ' ';
  }
  // Sungai melintang tepat di bawah markas ke-2 (di situ jalan turun tegak),
  // jembatan kayu mengikuti arah jalan.
  const riverAt = Math.min(2, n - 2);
  const sg = segment(riverAt);
  const bridgePt = bez(sg, 0.22);
  const ahead = bez(sg, 0.26);
  const angle = (Math.atan2(ahead[1] - bridgePt[1], ahead[0] - bridgePt[0]) * 180) / Math.PI;
  const ry = bridgePt[1];
  const river = `M-10 ${ry - 16} C60 ${ry - 34} 120 ${ry + 4} 200 ${ry - 14} S320 ${ry - 30} 370 ${ry - 12} L370 ${ry + 22} C300 ${ry + 6} 240 ${ry + 36} 170 ${ry + 18} S40 ${ry + 2} -10 ${ry + 20} Z`;

  // Hiasan: 2 titik aman per baris (sisi berlawanan dari markas, jauh dari jalan & label).
  const decos: string[] = [];
  for (let i = 0; i < n; i++) {
    const { x, y } = nodePos(i);
    const left = x < MAP_W / 2;
    const spots = left ? [[28, y - 58], [334, y + 34]] : [[332, y - 58], [26, y + 34]];
    spots.forEach(([dx, dy], k) => {
      if (Math.abs(dy - ry) < 34) return; // jangan di atas sungai
      const e = world.deco[(i * 2 + k) % world.deco.length];
      decos.push(`<text x="${dx}" y="${dy}" font-size="${k ? 30 : 34}" text-anchor="middle" dominant-baseline="central">${e}</text>`);
    });
  }
  const patches = Array.from({ length: n }, (_, i) => {
    const { y } = nodePos(i);
    const cx = i % 2 ? 70 : 290;
    return `<ellipse cx="${cx}" cy="${y + 70}" rx="70" ry="30" fill="${world.patch}" opacity=".55"/>`;
  }).join('');
  const first = nodePos(0);
  const last = nodePos(n - 1);
  const planks = Array.from({ length: 5 }, (_, k) => `<line x1="${-24 + k * 12}" y1="-19" x2="${-24 + k * 12}" y2="19" stroke="#8A5A2B" stroke-width="2"/>`).join('');

  return `
    <svg class="jm-scene" viewBox="0 0 ${MAP_W} ${h}" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <linearGradient id="jmGround" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${world.ground[0]}"/><stop offset="1" stop-color="${world.ground[1]}"/></linearGradient>
      </defs>
      <rect width="${MAP_W}" height="${h}" fill="url(#jmGround)"/>
      ${patches}
      <path d="${river}" fill="${world.water}"/>
      <path d="${river}" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="3"/>
      <path d="${road}" fill="none" stroke="${world.pathEdge}" stroke-width="40" stroke-linecap="round"/>
      <path d="${road}" fill="none" stroke="${world.path}" stroke-width="30" stroke-linecap="round"/>
      <path d="${road}" fill="none" stroke="#fff" stroke-opacity=".55" stroke-width="4" stroke-dasharray="2 14" stroke-linecap="round"/>
      ${done ? `<path d="${done}" fill="none" stroke="#FFC83D" stroke-width="7" stroke-dasharray="1 13" stroke-linecap="round"/>` : ''}
      <g transform="translate(${bridgePt[0]} ${bridgePt[1]}) rotate(${angle})">
        <rect x="-30" y="-21" width="60" height="42" rx="6" fill="#C98C4F" stroke="#8A5A2B" stroke-width="3"/>
        ${planks}
      </g>
      ${decos.join('')}
      <g transform="translate(${first.x < MAP_W / 2 ? first.x + 96 : first.x - 96} ${first.y - 62})">
        <rect x="-3" y="0" width="6" height="36" fill="#8A5A2B"/>
        <rect x="-34" y="-20" width="68" height="26" rx="6" fill="#C98C4F" stroke="#8A5A2B" stroke-width="3"/>
        <text x="0" y="-7" font-size="13" font-weight="800" fill="#fff" text-anchor="middle" dominant-baseline="central" font-family="inherit">MULAI</text>
      </g>
      <text x="${last.x < MAP_W / 2 ? last.x + 4 : last.x - 4}" y="${last.y + 78}" font-size="44" text-anchor="middle" dominant-baseline="central">${world.finish}</text>
    </svg>`;
}

/**
 * Peta petualangan ber-ilustrasi (referensi user: peta jalan hijau dengan
 * sungai, jembatan, pohon, lencana bintang). Markas ke-i terbuka kalau
 * markas ke-(i-1) sudah pernah dituntaskan (non-punitive, sama aturan
 * lama); akun tes dev ("124") melihat semua terbuka. Tombol tetap
 * `data-action="enterNode"` + `data-payload=i`, jadi handler orkestrator
 * tidak berubah.
 */
export function journeyMapHtml(gameKey: string, stops: JourneyStop[], visited: Set<number>): string {
  const prev = lastCleared.get(gameKey);
  // Sesi main baru (visited kosong lagi) → lupakan catatan lama.
  const justCleared = prev && visited.size > prev.size ? [...visited].find((i) => !prev.has(i)) : undefined;
  lastCleared.set(gameKey, new Set(visited));
  if (justCleared !== undefined) window.setTimeout(() => sfx('clear'), 250);

  const world = WORLDS[gameKey] ?? WORLDS.kata;
  const n = stops.length;
  const h = TOP + (n - 1) * ROW_H + BOTTOM;
  const current = stops.findIndex((_, i) => !visited.has(i));
  const doneUntil = current === -1 ? n - 1 : current;

  const nodes = stops
    .map((s, i) => {
      const { x, y } = nodePos(i);
      const cleared = visited.has(i);
      const unlocked = isDevTestAccount() || i === 0 || visited.has(i - 1);
      const state = cleared ? 'is-cleared' : unlocked ? 'is-open' : 'is-locked';
      const extra = [i === current ? 'is-current' : '', i === justCleared ? 'just-cleared' : '', justCleared !== undefined && i === justCleared + 1 ? 'just-opened' : '']
        .filter(Boolean)
        .join(' ');
      const side = x < MAP_W / 2 ? 'is-left' : 'is-right';
      const stars = `<span class="jn-stars" aria-hidden="true">${cleared ? '⭐⭐⭐' : '<i>★</i><i>★</i><i>★</i>'}</span>`;
      const lock = !unlocked ? '<span class="jn-lock" aria-hidden="true">🔒</span>' : '';
      const here = i === current && unlocked ? '<span class="jn-here" aria-hidden="true">📍</span>' : '';
      return `
      <button class="journey-node ${state} ${side} ${extra}" type="button" data-action="enterNode" data-payload="${i}"
        style="--x:${((x / MAP_W) * 100).toFixed(3)}%; --y:${((y / h) * 100).toFixed(3)}%" ${unlocked ? '' : 'disabled aria-disabled="true"'}
        aria-label="${s.name} (${s.label})${cleared ? ', sudah tuntas' : unlocked ? '' : ', terkunci'}">
        ${here}
        <span class="jn-badge">${stars}<span class="jn-emoji" aria-hidden="true">${s.emoji}</span>${lock}<span class="jn-num" aria-hidden="true">${i + 1}</span></span>
        <span class="jn-label"><b>${s.name}</b><span class="tag diff-${s.difficulty}">${s.label}</span></span>
      </button>`;
    })
    .join('');

  return `
    <div class="journey-map" style="aspect-ratio:${MAP_W} / ${h}">
      ${mapSceneSvg(world, n, doneUntil, h)}
      ${nodes}
    </div>`;
}

/** Pengumuman singkat saat masuk markas (±1,2 dtk, tidak menghalangi
 *  ketukan). Hormati `prefers-reduced-motion` lewat CSS. */
export function markasIntro(emoji: string, name: string): void {
  sfx('enter');
  const el = document.createElement('div');
  el.className = 'markas-intro';
  el.setAttribute('aria-hidden', 'true');
  el.innerHTML = `<span class="mi-emoji">${emoji}</span><span class="mi-name">${name}</span>`;
  // Ditempel ke <body> (fixed) — isi stage diganti game begitu markas dibuka.
  document.body.appendChild(el);
  window.setTimeout(() => el.remove(), 1400);
}
