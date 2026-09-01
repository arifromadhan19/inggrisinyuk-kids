/**
 * Ikon inline SVG untuk chrome aplikasi: navigasi, tombol kembali, penanda
 * status. Sengaja BUKAN emoji — emoji tetap dipakai untuk isi pelajaran
 * (kata, gambar soal), bukan untuk kontrol antarmuka.
 *
 * DUA gaya hidup berdampingan di sini:
 * 1. Ikon NAVIGASI UTAMA (ICON_HOME/LEARN/GAME/RAPOR/SETTINGS, dipakai NAV di
 *    app.ts) — BERWARNA PENUH (fill warna tetap per-bentuk, BUKAN currentColor),
 *    gaya "kid friendly" chunky-flat (permintaan user, referensi navbar app
 *    kompetitor yang ikonnya berwarna-warni) — TAPI warnanya HANYA teal
 *    (--brand-500/600/300) + mango (--sun-500/400) + putih, SENGAJA TIDAK
 *    ungu/lavender spt referensi (lihat rationale palet di atas styles.css:
 *    "brand teal sengaja jauh dari indigo-ungu yang jadi warna utama app
 *    pembanding" — pill navigasi aktif jg pakai mango, bukan ungu, biar
 *    konsisten). Selalu terlihat berwarna, aktif ATAU tidak — beda dari gaya
 *    lama yang baru "terisi" saat aktif.
 * 2. Ikon UTILITY (BACK/CHEVRON/CHECK/PLAY/LOCK) — TETAP stroke=currentColor
 *    polos spt sebelumnya, TIDAK disentuh, dipakai di konteks yang warnanya
 *    memang harus ikut teks sekitar (tombol kembali, breadcrumb, dst).
 */

const wrap = (paths: string, extra = ''): string =>
  `<svg class="ico ${extra}" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${paths}</svg>`;

export const ICON_HOME = wrap(
  '<path d="M2.6 11.4 12 3.2l9.4 8.2-1.6 1.9L12 6.5l-7.8 6.8z" fill="#FFB53D" stroke="none"/><rect x="5.4" y="10.6" width="13.2" height="9.8" rx="2.6" fill="#12A398" stroke="none"/><rect x="9.2" y="14.4" width="5.6" height="6" rx="1.6" fill="#fff" stroke="none"/><circle cx="13.7" cy="17.4" r=".6" fill="#0B6E6B" stroke="none"/>'
);

export const ICON_LEARN = wrap(
  '<path d="M3.6 5.6c3.2-.9 6-.5 8.4 1.3v12.1c-2.4-1.7-5.2-2.1-8.4-1.3z" fill="#12A398" stroke="none"/><path d="M20.4 5.6c-3.2-.9-6-.5-8.4 1.3v12.1c2.4-1.7 5.2-2.1 8.4-1.3z" fill="#FFB53D" stroke="none"/><path d="M12 6.9v12.1" fill="none" stroke="#0B6E6B" stroke-width="1.3" stroke-linecap="round"/>'
);

export const ICON_GAME = wrap(
  '<rect x="2.2" y="8.2" width="19.6" height="10.2" rx="5.1" fill="#12A398" stroke="none"/><path d="M6.6 10.6v4.2M4.5 12.7h4.2" fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round"/><circle cx="16.1" cy="11.6" r="1.5" fill="#FFB53D" stroke="none"/><circle cx="18.6" cy="14.2" r="1.5" fill="#fff" stroke="none"/>'
);

export const ICON_RAPOR = wrap(
  '<rect x="3.4" y="3.6" width="17.2" height="16.8" rx="4.2" fill="#D6F0EC" stroke="none"/><rect x="6.8" y="13" width="2.8" height="4.8" rx="1.2" fill="#12A398" stroke="none"/><rect x="10.6" y="10" width="2.8" height="7.8" rx="1.2" fill="#FFB53D" stroke="none"/><rect x="14.4" y="7" width="2.8" height="10.8" rx="1.2" fill="#0B6E6B" stroke="none"/>'
);

export const ICON_SETTINGS = wrap(
  '<rect x="4" y="6.2" width="16" height="2.4" rx="1.2" fill="#D6F0EC" stroke="none"/><circle cx="14.6" cy="7.4" r="2.5" fill="#FFB53D" stroke="none"/><rect x="4" y="10.8" width="16" height="2.4" rx="1.2" fill="#D6F0EC" stroke="none"/><circle cx="8.4" cy="12" r="2.5" fill="#12A398" stroke="none"/><rect x="4" y="15.4" width="16" height="2.4" rx="1.2" fill="#D6F0EC" stroke="none"/><circle cx="15.6" cy="16.6" r="2.5" fill="#FFB53D" stroke="none"/>'
);

export const ICON_BACK = wrap('<path d="M15 5l-7 7 7 7"/>');

export const ICON_CHEVRON = wrap('<path d="M9 5l7 7-7 7"/>', 'ico-sm');

export const ICON_CHECK = wrap('<path d="M4.5 12.5 9.5 17.5 19.5 6.5"/>', 'ico-sm');

export const ICON_PLAY = wrap('<path d="M7 4.8v14.4L19.5 12z" fill="currentColor" stroke-linejoin="round"/>', 'ico-sm');

/** Dipakai di Peta Level untuk level yang masih tersegel. */
export const ICON_LOCK = wrap(
  '<rect x="5.2" y="10.6" width="13.6" height="9.4" rx="3"/><path d="M8.2 10.6V8a3.8 3.8 0 0 1 7.6 0v2.6"/>',
  'ico-sm'
);
