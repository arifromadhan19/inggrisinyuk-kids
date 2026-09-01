/**
 * Ikon inline SVG (stroke = currentColor) untuk chrome aplikasi: navigasi,
 * tombol kembali, penanda status. Sengaja BUKAN emoji — emoji tetap dipakai
 * untuk isi pelajaran (kata, gambar soal), bukan untuk kontrol antarmuka.
 *
 * Sub-path dengan class "ico-accent" sengaja digambar transparan (fill:none)
 * secara default lalu terisi (fill:currentColor) lewat CSS begitu nav aktif
 * (lihat [aria-current="page"] .ico-accent di styles.css) — evolusi "kid
 * friendly" dari outline tipis polos: ikon jadi terasa lebih "penuh"/hangat
 * saat dipilih anak, tanpa perlu gambar 2 set ikon terpisah (outline+filled).
 */

const wrap = (paths: string, extra = ''): string =>
  `<svg class="ico ${extra}" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${paths}</svg>`;

export const ICON_HOME = wrap(
  '<path d="M3.2 10.6 12 3.4l8.8 7.2"/><path d="M5.6 9.6V19a1.4 1.4 0 0 0 1.4 1.4h3V15h4v5.4h3a1.4 1.4 0 0 0 1.4-1.4V9.6"/><rect class="ico-accent" x="9.1" y="15.3" width="3.5" height="5.1" rx="1.1" stroke="none"/>'
);

export const ICON_LEARN = wrap(
  '<path d="M12 6.4C9.6 4.6 6.8 4.2 3.6 5v13c3.2-.8 6 -.4 8.4 1.4"/><path d="M12 6.4c2.4-1.8 5.2-2.2 8.4-1.4v13c-3.2-.8-6-.4-8.4 1.4"/><path d="M12 6.4v13"/><circle class="ico-accent" cx="12" cy="4.4" r="1.35" stroke="none"/>'
);

export const ICON_GAME = wrap(
  '<rect x="2.6" y="8.4" width="18.8" height="9.6" rx="4.6"/><path d="M6.8 11v4M4.8 13h4"/><circle cx="16.1" cy="11.6" r="1.35" fill="currentColor" stroke="none"/><circle cx="18.4" cy="14" r="1.35" fill="currentColor" stroke="none"/>'
);

export const ICON_RAPOR = wrap(
  '<rect x="3.6" y="3.6" width="16.8" height="16.8" rx="3.4"/><path d="M7.6 15.2v-3.4M12 15.2V8.4M16.4 15.2v-5.8"/><circle class="ico-accent" cx="12" cy="8.4" r="1.1" stroke="none"/>'
);

export const ICON_SETTINGS = wrap(
  '<path d="M4 7h7"/><path d="M15 7h5"/><path d="M4 12h3"/><path d="M11 12h9"/><path d="M4 17h7"/><path d="M15 17h5"/><circle class="ico-accent" cx="13" cy="7" r="2" stroke-width="2"/><circle class="ico-accent" cx="9" cy="12" r="2" stroke-width="2"/><circle class="ico-accent" cx="13" cy="17" r="2" stroke-width="2"/>'
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
