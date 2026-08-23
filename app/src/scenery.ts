/**
 * Dekorasi peta & panorama — SVG inline yang perannya BEDA dari `icons.ts`.
 *
 * `icons.ts` = ikon chrome (navigasi, kembali, centang): stroke tipis,
 * `currentColor`, ukuran tetap, punya makna fungsional.
 * File ini = pemandangan: siluet bukit, awan, dan jejak kaki di Peta Level.
 * Semuanya `aria-hidden` (murni suasana, tidak membawa informasi), memakai
 * `fill:currentColor` supaya warnanya ikut warna "tanah" tiap perhentian, dan
 * di-stretch lewat `preserveAspectRatio="none"` supaya 1 path bisa dipakai di
 * lebar layar mana pun tanpa aset gambar eksternal (PRD §5: tidak nambah
 * dependency, cukup CSS + SVG inline).
 */
import type { LevelKey } from './types';

const band = (paths: string): string =>
  `<svg class="trail-hills" viewBox="0 0 320 60" preserveAspectRatio="none" aria-hidden="true" focusable="false">${paths}</svg>`;

/** Bukit pasir lembut — pembuka perjalanan, paling landai. */
const HILLS_DUNES = band(
  '<path d="M0 60V42c40-16 68 2 104-4 38-6 64-24 104-18 38 6 64 20 112 12v28z" fill="currentColor"/>'
);

/** Padang bergelombang + semak kecil. */
const HILLS_MEADOW = band(
  '<path d="M0 60V45c28-15 54-11 78-3 26 9 44-6 72-10 32-5 54 12 86 10 26-2 56-10 84-6v24z" fill="currentColor"/>' +
    '<g fill="currentColor" opacity=".55"><circle cx="42" cy="47" r="7"/><circle cx="128" cy="44" r="6"/><circle cx="232" cy="47" r="7"/><circle cx="292" cy="45" r="5"/></g>'
);

/** Riak air lagoon — "rumah" warna merek. */
const HILLS_WAVES = band(
  '<path d="M0 60V47c24-9 40 5 64 5s40-14 68-12 40 14 68 12 36-14 64-12c20 1 36 8 56 5v15z" fill="currentColor"/>' +
    '<path d="M0 60V54c26-6 44 4 70 3s42-9 68-7 42 10 68 8 34-9 58-7 30 6 56 3v6z" fill="currentColor" opacity=".5"/>'
);

/** Sungai berliku di antara tebing rendah. */
const HILLS_RIVER = band(
  '<path d="M0 60V38c30 6 46-6 74-4s44 14 74 10 46-16 78-12c26 3 62 12 94 6v22z" fill="currentColor"/>' +
    '<path d="M0 60V52c34 6 52-3 84 0s48 8 80 4 50-8 76-4 50 6 80 2v6z" fill="currentColor" opacity=".45"/>'
);

/** Ngarai bertingkat — bentuk paling "besar", pas untuk level tinggi. */
const HILLS_CANYON = band(
  '<path d="M0 60V44h36V30h30v16h44V25h52v16h48V20h48v18h34v-8h28v14z" fill="currentColor"/>'
);

/** Puncak bersalju + bintang kecil — ujung perjalanan yang masih jauh. */
const HILLS_SUMMIT = band(
  '<path d="M0 60V44l38-25 28 15 40-27 46 33 38-22 40 20 42-25 48 24v23z" fill="currentColor"/>' +
    '<g fill="currentColor" opacity=".45"><circle cx="70" cy="14" r="2.4"/><circle cx="164" cy="9" r="2"/><circle cx="248" cy="16" r="2.6"/></g>'
);

/**
 * Jejak kaki (titik-titik) yang menghubungkan satu perhentian ke perhentian
 * berikutnya. Dua varian lengkung — kiri & kanan, dipakai bergantian — supaya
 * jalurnya terasa berkelok seperti peta, bukan garis lurus ala timeline.
 * `vector-effect="non-scaling-stroke"` menjaga ukuran titik tetap walau
 * tinggi tiap perhentian beda-beda.
 */
const trail = (d: string): string =>
  `<svg class="trail-path" viewBox="0 0 64 200" preserveAspectRatio="none" aria-hidden="true" focusable="false">` +
  `<path d="${d}" fill="none" stroke="currentColor" stroke-width="6" stroke-linecap="round" ` +
  `stroke-dasharray="0.5 15" vector-effect="non-scaling-stroke"/></svg>`;

export const TRAIL_BEND_LEFT = trail('M32-6C6 44 6 152 32 206');
export const TRAIL_BEND_RIGHT = trail('M32-6c26 50 26 158 0 212');

/**
 * Siluet yang dipakai di luar peta supaya panorama Beranda & arena Tantangan
 * Bos memakai bahasa visual yang sama persis dengan peta (bukan dekorasi baru).
 */
export const HILLS_SHORE = HILLS_WAVES;
export const HILLS_RIDGE = HILLS_DUNES;

/** Awan kecil untuk panorama (Beranda & kepala Peta Level). */
export const CLOUD = `<svg class="cloud-art" viewBox="0 0 90 34" aria-hidden="true" focusable="false"><g fill="currentColor"><ellipse cx="30" cy="20" rx="22" ry="12"/><ellipse cx="53" cy="16" rx="17" ry="14"/><ellipse cx="68" cy="22" rx="16" ry="10"/></g></svg>`;

/**
 * Satu "markas" di peta = 1 level (PRD §3). Nama tempat di sini MURNI label
 * pemandangan untuk bagian peta yang sedang dilewati — nama & emoji level
 * tetap yang utama dan tidak diganti (PRD §7, RESEARCH §13.2: nama level tidak
 * boleh ditukar dengan nama fantasi). Urutan warnanya menceritakan jarak:
 * padang pasir → kebun → pantai (warna merek, tempat anak sekarang) → sungai →
 * gunung senja → puncak yang masih jauh.
 *
 * Nama pemandangan & istilah "perhentian" direvisi (permintaan user: kata
 * yang lebih familiar & menarik, TIDAK terlalu formal, buat anak SD) — lewat
 * beberapa iterasi: "Perhentian" (istilah bus/kereta, formal) → "Pos" (netral
 * tapi kurang seru) → "Gerbang" (masih berasa formal/resmi) → **"Markas"**
 * — kata santai yang sudah biasa dipakai anak dalam main pura-pura
 * ("markas rahasia"), pas dengan tema petualangan & tidak terikat satu jenis
 * medan (beda dari "Gerbang" yang berasa struktur besar). Nama pemandangan
 * lama ("Fajar", "Tunas", "Lagoon", "Berliku", "Ngarai", "Berbintang") juga
 * diganti ke benda/tempat konkret yang sudah dikenal anak sejak dini
 * (pasir, bunga, pantai, deras, gunung, bintang) — struktur warna & urutan
 * "perjalanan"-nya TIDAK berubah, cuma katanya lebih sederhana & hidup.
 */
export interface Place {
  /** class token warna tanah di styles.css (--band/--band-soft/--band-deep) */
  cls: string;
  /** nama pemandangan, tampil kecil di atas nama level */
  name: string;
  hills: string;
}

const FALLBACK: Place = { cls: 't-meadow', name: 'Jalur Baru', hills: HILLS_MEADOW };

const PLACES: Partial<Record<LevelKey, Place>> = {
  'little-stars': { cls: 't-dawn', name: 'Padang Pasir', hills: HILLS_DUNES },
  starter: { cls: 't-meadow', name: 'Kebun Bunga', hills: HILLS_MEADOW },
  explorer: { cls: 't-lagoon', name: 'Pantai Biru', hills: HILLS_WAVES },
  adventurer: { cls: 't-river', name: 'Sungai Deras', hills: HILLS_RIVER },
  achiever: { cls: 't-canyon', name: 'Gunung Senja', hills: HILLS_CANYON },
  trailblazer: { cls: 't-summit', name: 'Puncak Bintang', hills: HILLS_SUMMIT },
};

export function placeFor(key: LevelKey): Place {
  return PLACES[key] ?? FALLBACK;
}
