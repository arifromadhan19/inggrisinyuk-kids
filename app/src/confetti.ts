/**
 * Confetti asli — kepingan kertas kecil jatuh & berputar dari atas layar
 * (permintaan user: "bergerak layaknya di podium kemenangan"), BEDA dari
 * `.win-burst` (styles.css) yang cuma emoji kecil naik-turun di atas tombol.
 * Dipasang di titik yang SAMA persis dgn `.win-burst` sudah dipakai (jawaban
 * benar Vocabulary & Reading) — bukan trigger baru, cuma menaikkan level
 * "festive"-nya (CLAUDE.md Aturan Wajib apresiasi: benar → animasi celebrate
 * yang terasa festive).
 */
const COLORS = ['#0B6E6B', '#FFC562', '#FF8A65', '#7ED9CF', '#FFD66B', '#F76C6C', '#8E7CFF'];

export function fireConfetti(count = 26): void {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const layer = document.createElement('div');
  layer.className = 'confetti-layer';
  document.body.appendChild(layer);

  for (let i = 0; i < count; i += 1) {
    const piece = document.createElement('span');
    piece.className = 'confetti-piece';
    const size = 6 + Math.random() * 6;
    piece.style.left = `${Math.random() * 100}%`;
    piece.style.background = COLORS[Math.floor(Math.random() * COLORS.length)];
    piece.style.width = `${size}px`;
    piece.style.height = `${size * 0.4}px`;
    piece.style.animationDelay = `${Math.random() * 0.25}s`;
    piece.style.animationDuration = `${1.6 + Math.random() * 0.9}s`;
    piece.style.setProperty('--drift', `${(Math.random() - 0.5) * 140}px`);
    piece.style.setProperty('--rotate', `${360 + Math.random() * 360}deg`);
    layer.appendChild(piece);
  }

  setTimeout(() => layer.remove(), 2700);
}
