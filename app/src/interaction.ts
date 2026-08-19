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
