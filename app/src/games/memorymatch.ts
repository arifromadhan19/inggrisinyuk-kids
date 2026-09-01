/**
 * Raja Ingatan — Memory Match "dedicated" (permintaan user). Sebelumnya
 * entry point "Raja Ingatan" (app.ts RAJA_LIST) cuma reuse GENERIK
 * `vocabularyGame.runMemoryMatch` dengan 1 topik Vocab yang dipilih ACAK
 * tiap main — beda dari Raja Kata/Raja Balon/Sentence Puzzle yang
 * masing-masing sudah punya file & bank kata SENDIRI, tidak terikat topik/
 * level Vocab manapun. File ini menyamakan Raja Ingatan ke pola yang sama
 * (persis `wordmatch.ts`/`balloonpop.ts`): bank kata EN↔ID generik sendiri,
 * dipilih ulang tiap ronde dari bank yang lebih besar (variasi antar-main,
 * pola sama `shuffle(bank).slice(...)` Balon).
 *
 * `vocabularyGame.runMemoryMatch` (games/vocabulary.ts) TIDAK dihapus —
 * tetap fungsi generik yang bisa dipakai ulang kalau nanti ada kebutuhan
 * lain reuse-topik-Vocab-acak. File ini murni menggantikan PEMANGGILAN di
 * Game Hub ("Raja Ingatan"), bukan menghapus fungsi lama itu. (Open the
 * Door "Buka Pintu Kastil", app.ts `runDoorFlow` — yang dulu jg
 * memanggilnya sbg "Pintu 3" — SUDAH DIHAPUS TOTAL, permintaan user.)
 */
import { setHandlers } from '../interaction';
import { recordAttempt } from '../progress';
import { playCorrectTone, playTryAgainTone } from '../speech';
import { pickPraise, pickEncourage } from '../praise';
import { fireConfetti } from '../confetti';
import { shuffle } from '../util';
import type { LevelKey, OnDone } from '../types';

interface MemoryWord {
  id: string;
  en: string;
  emoji: string;
}

/** Bank kata sendiri, generik lintas level (pola sama Raja Kata/Raja
 *  Balon) — kosakata konkret & luas (hewan/benda/alam), BUKAN diambil dari
 *  topik Vocab level manapun. Emoji selalu unik per kata supaya kartu sisi
 *  ID (emoji+teks) tidak pernah ambigu. */
const BANK: MemoryWord[] = [
  { id: 'Kucing', en: 'Cat', emoji: '🐱' },
  { id: 'Anjing', en: 'Dog', emoji: '🐶' },
  { id: 'Ikan', en: 'Fish', emoji: '🐟' },
  { id: 'Burung', en: 'Bird', emoji: '🐦' },
  { id: 'Kelinci', en: 'Rabbit', emoji: '🐰' },
  { id: 'Apel', en: 'Apple', emoji: '🍎' },
  { id: 'Pisang', en: 'Banana', emoji: '🍌' },
  { id: 'Bola', en: 'Ball', emoji: '⚽' },
  { id: 'Buku', en: 'Book', emoji: '📖' },
  { id: 'Matahari', en: 'Sun', emoji: '☀️' },
  { id: 'Bulan', en: 'Moon', emoji: '🌙' },
  { id: 'Bintang', en: 'Star', emoji: '⭐' },
  { id: 'Pohon', en: 'Tree', emoji: '🌳' },
  { id: 'Bunga', en: 'Flower', emoji: '🌸' },
  { id: 'Rumah', en: 'House', emoji: '🏠' },
  { id: 'Mobil', en: 'Car', emoji: '🚗' },
  { id: 'Topi', en: 'Hat', emoji: '🎩' },
  { id: 'Payung', en: 'Umbrella', emoji: '☂️' },
];

/** 4 pasangan/ronde (8 kartu) — sedikit lebih ramai dari versi generik
 *  lama (3 pasangan), tetap ringan krn game ini dimainkan di SEMUA level
 *  termasuk Little Stars (3-5 th) via Pintu 3 Open the Door. */
const PAIR_COUNT = 4;

interface MemoryCard {
  pairId: number;
  face: 'id' | 'en';
  matched: boolean;
}

/** Duplikat lokal `roundActionsHtml` (konvensi app ini: helper generik
 *  diduplikasi per file game — lihat games/wordmatch.ts dst). */
function roundActionsHtml(isLast: boolean): string {
  return `
    <div class="round-actions">
      <button class="ghost-btn" type="button" data-action="tryAgainRound">🔁 Coba Lagi</button>
      <button class="primary-btn" type="button" data-action="nextRound" style="margin-top:0">${isLast ? 'Selesai ✅' : 'Lanjut ➡️'}</button>
    </div>`;
}

export function runMemoryMatch(container: HTMLElement, onDone: OnDone, level: LevelKey): void {
  let words: MemoryWord[] = shuffle(BANK).slice(0, Math.min(PAIR_COUNT, BANK.length));
  let cards: MemoryCard[] = buildCards(words);
  let opened: number[] = [];
  let score = 0;
  let busy = false;

  function buildCards(w: MemoryWord[]): MemoryCard[] {
    return shuffle(
      w.flatMap((_, i) => [
        { pairId: i, face: 'id' as const, matched: false },
        { pairId: i, face: 'en' as const, matched: false },
      ])
    );
  }

  function cardLabel(c: MemoryCard): { emoji: string; text: string } {
    const w = words[c.pairId];
    return c.face === 'id' ? { emoji: w.emoji, text: w.id } : { emoji: '', text: w.en };
  }

  function paint(): void {
    const matchedPairs = cards.filter((c) => c.matched).length / 2;
    container.innerHTML = `
      <div class="mm-head">
        <span class="mm-score">SKOR: <b>${score}</b></span>
        <span class="tag">${matchedPairs}/${words.length}</span>
      </div>
      <div class="mm-grid">
        ${cards
          .map((c, i) => {
            const isOpen = c.matched || opened.includes(i);
            const label = cardLabel(c);
            return `
            <button class="mm-card ${isOpen ? 'is-open' : ''} ${c.matched ? 'is-matched' : ''}" type="button"
              data-action="flip" data-payload="${i}" ${isOpen ? 'disabled' : ''} aria-label="${isOpen ? label.text : 'Kartu tertutup'}">
              ${
                isOpen
                  ? `${c.matched ? '<span class="mm-check" aria-hidden="true">✅</span>' : ''}${label.emoji ? `<span class="mm-emoji">${label.emoji}</span>` : ''}<span class="mm-text">${label.text}</span>`
                  : `<span class="mm-mark" aria-hidden="true">❓</span>`
              }
            </button>`;
          })
          .join('')}
      </div>
      <div class="feedback" id="fb"></div>
    `;
    setHandlers({ flip: (payload) => flip(Number(payload)) });
  }

  function flip(i: number): void {
    if (busy || cards[i].matched || opened.includes(i) || opened.length >= 2) return;
    opened.push(i);
    paint();
    if (opened.length < 2) return;

    busy = true;
    const [a, b] = opened;
    const isMatch = cards[a].pairId === cards[b].pairId && cards[a].face !== cards[b].face;
    setTimeout(() => {
      const fb = container.querySelector<HTMLElement>('#fb');
      if (isMatch) {
        cards[a].matched = true;
        cards[b].matched = true;
        score += 10;
        recordAttempt(true);
        playCorrectTone();
        fireConfetti();
        if (fb) {
          fb.textContent = pickPraise(level);
          fb.className = 'feedback good';
        }
      } else {
        recordAttempt(false);
        playTryAgainTone();
        if (fb) {
          fb.textContent = pickEncourage(level);
          fb.className = 'feedback bad';
        }
      }
      opened = [];
      busy = false;
      paint();

      if (cards.every((c) => c.matched)) {
        const doneFb = container.querySelector<HTMLElement>('#fb');
        if (doneFb) doneFb.insertAdjacentHTML('afterend', roundActionsHtml(true));
        setHandlers({
          tryAgainRound: () => {
            words = shuffle(BANK).slice(0, Math.min(PAIR_COUNT, BANK.length));
            cards = buildCards(words);
            opened = [];
            score = 0;
            paint();
          },
          nextRound: () => onDone(),
        });
      }
    }, 700);
  }

  paint();
}
