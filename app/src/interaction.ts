import type { ActionMap } from './types';

/**
 * Klik di seluruh app didelegasikan ke satu listener (dipasang sekali di #root),
 * lalu dirutekan lewat data-action/data-payload ke handler yang sedang aktif.
 * Ini gantinya pola `window.fnName = ...` yang dipakai di prototipe HTML —
 * lebih idiomatik TypeScript (tidak mengotori objek global).
 */
let handlers: ActionMap = {};

export function setHandlers(next: ActionMap): void {
  handlers = { ...handlers, ...next };
}

export function clearHandlers(): void {
  handlers = {};
}

/**
 * 🔒 Flag state Game Hub (permintaan user: "back dari halaman list markas
 * TIDAK perlu pop up 'Yuk Lanjut'/'Keluar', cuma ketika sudah masuk
 * halaman mengerjakan") — dibaca `app.ts` `renderGamePlay()`'s tombol
 * balik, ditulis tiap `games/*.ts` orkestrator ("Raja" bertingkat) begitu
 * pindah antara layar Map Kerajaan (list markas, `false`) vs 1 markas yang
 * sedang dikerjakan (`true`). Default `true` (app.ts set sebelum
 * `runRajaRound()` dipanggil) — game TANPA layar Map (Raja Kelompok,
 * Story Quest) sengaja TIDAK PERNAH menyentuh flag ini, jadi tetap `true`
 * selamanya (popup SELALU tampil, konsisten krn layar SATU-SATUNYA di
 * game itu MEMANG langsung "halaman mengerjakan"). Lihat CLAUDE.md §
 * "Pop Up Konfirmasi Keluar Game" utk aturan lengkapnya.
 */
let gameRoundActive = true;

export function setGameRoundActive(active: boolean): void {
  gameRoundActive = active;
}

export function isGameRoundActive(): boolean {
  return gameRoundActive;
}

export function bindDelegatedClicks(root: HTMLElement): void {
  root.addEventListener('click', (event) => {
    const target = (event.target as HTMLElement).closest<HTMLElement>('[data-action]');
    if (!target || !root.contains(target)) return;
    const action = target.dataset.action;
    if (!action) return;
    handlers[action]?.(target.dataset.payload);
  });

  root.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    const target = (event.target as HTMLElement).closest<HTMLElement>('[data-action]');
    if (!target || !root.contains(target)) return;
    // <button>/<a>/<summary> sudah otomatis mengirim event click sendiri saat
    // ditekan Enter — kalau tidak di-skip, handler-nya jalan dua kali.
    const tag = target.tagName;
    if (tag === 'BUTTON' || tag === 'A' || tag === 'SUMMARY' || tag === 'INPUT') return;
    const action = target.dataset.action;
    if (!action) return;
    event.preventDefault(); // Spasi jangan ikut men-scroll halaman
    handlers[action]?.(target.dataset.payload);
  });
}
