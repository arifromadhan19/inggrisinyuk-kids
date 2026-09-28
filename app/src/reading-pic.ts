/** Gambar Reading = emoji Unicode, ATAU gambar custom (`img:/img/zoo.jpeg`)
 *  utk konsep yang tidak punya emoji yang pas (CLAUDE.md "Ikon/Gambar WAJIB
 *  Relevan" poin 6). Nilai yang sama dipakai di halaman buku, opsi soal
 *  gambar, gambar ✅/❌ & Tantangan Raja, jadi 1 kata = 1 gambar di semua
 *  tempat. Gambar custom WAJIB bebas logo/merek. */
const IMG_PREFIX = 'img:';

/** Pecah string emoji jadi per-gambar (grapheme), mis. "⭐⭐⭐⭐" → 4. */
function splitEmoji(pic: string): string[] {
  const Seg = (Intl as unknown as { Segmenter?: new (l?: string, o?: { granularity: 'grapheme' }) => { segment(s: string): Iterable<{ segment: string }> } }).Segmenter;
  if (!Seg) return [pic];
  return [...new Seg(undefined, { granularity: 'grapheme' }).segment(pic)].map((x) => x.segment).filter((x) => x.trim());
}

/** Skala per jumlah gambar supaya 2–5 benda (buku angka/hitung) muat SATU
 *  baris rapi — dulu 1 string raksasa: 4 bintang terpotong, 5 cangkir pecah
 *  jadi 3 baris. */
function multiScale(n: number): number {
  return n <= 1 ? 1 : n === 2 ? 0.78 : n === 3 ? 0.62 : n === 4 ? 0.5 : 0.42;
}

export function readingPicHtml(pic: string | undefined): string {
  if (!pic) return '';
  if (!pic.startsWith(IMG_PREFIX)) {
    const parts = splitEmoji(pic);
    if (parts.length <= 1) return pic;
    return `<span class="rt-pic-multi" data-n="${Math.min(parts.length, 6)}" style="font-size:${multiScale(parts.length)}em">${parts.map((e) => `<span>${e}</span>`).join('')}</span>`;
  }
  const src = pic.slice(IMG_PREFIX.length).replace(/"/g, '&quot;');
  return `<img class="rt-pic-img" src="${src}" alt="" draggable="false" />`;
}
