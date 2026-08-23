import type { LevelKey } from './types';
import { speak } from './speech';

/**
 * Pujian (jawaban benar) & semangat (belum tepat) — dipakai lintas game
 * (mulai dari Vocab, CLAUDE.md "Aturan Wajib": setiap anak mencoba apa pun
 * WAJIB dapat apresiasi/semangat, tidak boleh diam saja). Satu kata seru
 * saja (permintaan user), beberapa variasi per pool biar tidak berasa
 * robot diulang-ulang — TIDAK PERNAH ada kata "salah"/"gagal" di pool
 * semangat (CLAUDE.md poin 2), nadanya tetap mengajak lanjut.
 */
export type PraiseLang = 'id' | 'en';

/**
 * Level mana pakai bahasa apa (permintaan user) — level awal (masih perlu
 * dukungan bahasa ibu buat ngerti dia lagi diapresiasi) pakai Indonesia,
 * level tinggi (sudah mulai immersion Inggris) pakai Inggris langsung.
 * Cuma Explorer yang punya materi nyata di v1 (content.ts) — begitu
 * Adventurer/Achiever/Trailblazer diauthoring, pujiannya otomatis ikut
 * beralih ke Inggris tanpa perlu ubah mapping ini lagi.
 */
export const PRAISE_LANG_BY_LEVEL: Record<LevelKey, PraiseLang> = {
  'little-stars': 'id',
  starter: 'id',
  explorer: 'id',
  adventurer: 'en',
  achiever: 'en',
  trailblazer: 'en',
};

// Satu kata seru saja (permintaan user) — GOOD_EN sengaja tidak pakai "Great
// job!" (2 kata) biar konsisten satu kata semua, termasuk versi Indonesia.
// GOOD_ID[i]/GOOD_EN[i] sengaja PASANGAN SEJAJAR (index sama = emoji sama)
// — dipakai supaya teks yang TAMPIL (ikut level, poin di bawah) & versi
// Inggris yang DIUCAPKAN (poin "Feedback Suara WAJIB Inggris" di bawah)
// tetap semangatnya senada, walau kata persisnya beda bahasa.
const GOOD_ID = ['Hebaaat! 🎉', 'Kereeen! ⭐', 'Mantaaap! 🌟', 'Asyiiik! 🎊', 'Waaah! 🥳'];
const GOOD_EN = ['Awesome! 🎉', 'Amazing! ⭐', 'Fantastic! 🌟', 'Wonderful! 🎊', 'Terrific! 🥳'];
const TRY_ID = ['Semangaaat! 💪', 'Ayooo! 🌈', 'Dikit lagi! ✨', 'Yuk coba! 😊'];
const TRY_EN = ['Keep going! 💪', 'Almost there! 🌈', 'Nice try! ✨', 'You got this! 😊'];

function langFor(level: LevelKey | null | undefined): PraiseLang {
  return level ? PRAISE_LANG_BY_LEVEL[level] : 'id';
}

function pickIndex(length: number): number {
  return Math.floor(Math.random() * length);
}

/**
 * Ucapkan pujian via TTS (permintaan user: "dalam bentuk suara", bukan cuma
 * teks) — SELALU Inggris, di SEMUA level (revisi user: "feedback pujian
 * suara wajib bahasa inggris di semua level" — dulu level teks-Indonesia
 * diucapkan pakai `speakLocalized('id-ID')`, sekarang diganti versi Inggris
 * sejajarnya `GOOD_EN[i]`, BUKAN melafalkan teks Indonesia yg lagi
 * ditampilkan). Teks yang TAMPIL di layar tetap ikut level apa adanya
 * (tabel `PRAISE_LANG_BY_LEVEL` tidak berubah) — cuma audio-nya yang
 * dipisah, supaya anak level awal tetap dengar imersi Inggris walau
 * teksnya masih Indonesia. Best-effort — kalau TTS gagal, teks pujian
 * tetap tampil normal.
 */
function speakPraise(index: number): void {
  try {
    speak(GOOD_EN[index]);
  } catch {
    /* diabaikan dengan sengaja */
  }
}

export function pickPraise(level: LevelKey | null | undefined): string {
  const lang = langFor(level);
  const i = pickIndex(GOOD_ID.length);
  speakPraise(i);
  return lang === 'id' ? GOOD_ID[i] : GOOD_EN[i];
}

export function pickEncourage(level: LevelKey | null | undefined): string {
  const list = langFor(level) === 'id' ? TRY_ID : TRY_EN;
  return list[pickIndex(list.length)];
}
