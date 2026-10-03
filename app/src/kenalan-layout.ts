/**
 * 🔒 Aturan Wajib "kartu Kenalan gendut → tombol ke bawah" (permintaan user
 * 2026-10-03): kalau satu baris Kenalan berisi ≥2 kalimat ATAU kalimat
 * panjang, tombol 🔊/🎤/🎮 di HP turun ke kanan bawah kalimat (class
 * `.is-sentence`, styles.css) supaya teks dapat lebar penuh. Diputuskan per
 * TOPIK (bukan per baris) supaya 1 daftar seragam. Desktop tetap 1 baris.
 */
export const FAT_TEXT_CHARS = 24;

/** `rows` = teks Inggris tiap baris (1 baris bisa >1 kalimat). */
export function kenalanRowClass(rows: string[][]): string {
  const fat = rows.some((texts) => texts.length > 1 || texts.some((t) => t.length > FAT_TEXT_CHARS));
  return fat ? ' is-sentence' : '';
}
