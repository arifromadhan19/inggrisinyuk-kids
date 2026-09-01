/**
 * Raja Susun — Sentence Puzzle. Redesain total mekanik "Raja Susun" (dulu
 * reuse `vocabularyGame.runSusunKalimat` apa adanya — word bank polos tanpa
 * gambar/distractor/hint) menjadi gaya "bubble pyramid" ala referensi
 * kompetitor yang diberi user (screenshot: gambar di atas, kata-kata dalam
 * gelembung tersusun piramida — makin ke bawah makin lebar, termasuk
 * kata PENGECOH yang bukan bagian jawaban — jawaban terangkai di bar emas
 * bawah, tombol Hint + Dengar). Posisi TETAP persis di bawah Raja Balon
 * (`app.ts` RAJA_LIST, key `'susun'` TIDAK diganti supaya XP/progress lama
 * anak tidak hilang) — user eksplisit pilih "ganti Raja Susun", bukan
 * tambah entri ke-6 baru.
 *
 * Vocab Tantangan "🔤 Susun Kalimat" (`games/vocabulary.ts`
 * `runSusunKalimat`) SAMA SEKALI TIDAK disentuh — fitur itu tetap dipakai
 * persis seperti sebelumnya (CLAUDE.md "Format Wajib Materi Vocabulary"),
 * file ini murni menggantikan PEMANGGILAN di Game Hub, bukan fungsinya.
 *
 * Sumber konten (user: "mix emoji dari topik vocab dan kata yang baru"):
 * tiap ronde ambil 1 kalimat target dari `VocabItem.example` topik Vocab
 * level ini (emoji + kalimat sudah ada, tidak perlu data baru), lalu
 * campur kata pengecoh dari DUA sumber sekaligus — (a) kata dari 1-2
 * kalimat SIBLING (item lain di topik yang sama, meniru referensi: 2
 * "kalimat pengecoh" utuh yang kata-katanya diacak masuk piramida,
 * termasuk kata berulang spt "is"/"He") DAN (b) bank kata baru pendek
 * (`EXTRA_FILLER_WORDS`, TIDAK terikat topik/level manapun, konsisten
 * pola Raja Balon/Raja Kata yang jg py bank sendiri) — jadi tiap ronde
 * SELALU mix keduanya, bukan salah satu doang.
 *
 * Kid-friendly (CLAUDE.md): TANPA timer/nyawa, non-punitive (jawaban salah
 * cuma "Semangaat" + tetap bisa lanjut/ulang), bubble berbentuk pill bulat
 * penuh (bukan lingkaran kaku) supaya kata panjang apa pun dari Vocab tetap
 * terbaca — circle kaku ala referensi cuma cocok utk demo kata pendek.
 */
import { setHandlers } from '../interaction';
import { recordAttempt } from '../progress';
import { playCorrectTone, playTryAgainTone, speak } from '../speech';
import { pickPraise, pickEncourage } from '../praise';
import { fireConfetti } from '../confetti';
import { shuffle } from '../util';
import type { LevelKey, OnDone, VocabTopic } from '../types';

const ROUND_COUNT = 5;
/** Maks kata pengecoh (sibling+filler digabung) per ronde — dijaga supaya
 *  piramida tidak membengkak liar kalau kebetulan kalimat sibling panjang. */
const MAX_DISTRACTORS = 9;
const FILLER_COUNT = 3;

/** Bank kata pengecoh BARU, TIDAK terikat topik/level Vocab manapun (poin
 *  b di komentar atas) — adverb/adjective pendek generik yang aman
 *  dicampur ke kalimat apa pun sbg "noise" murni (bukan dituntut membentuk
 *  kalimat alternatif yang benar), konsisten pola bank sendiri Raja Balon. */
const EXTRA_FILLER_WORDS = [
  'quickly',
  'slowly',
  'loudly',
  'quietly',
  'happily',
  'today',
  'again',
  'also',
  'very',
  'little',
  'tiny',
  'huge',
  'nearby',
  'together',
  'carefully',
  'soon',
];

function tokenize(sentence: string): string[] {
  return sentence
    .replace(/[.?!]+$/, '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}

interface PuzzleRound {
  targetWords: string[];
  emoji: string;
  bubbles: string[];
}

function buildRound(topics: VocabTopic[]): PuzzleRound {
  const topic = topics[Math.floor(Math.random() * topics.length)];
  const items = topic.items;
  const target = items[Math.floor(Math.random() * items.length)];
  const targetWords = tokenize(target.example.en);
  const targetLower = targetWords.map((w) => w.toLowerCase());

  const siblings = shuffle(items.filter((it) => it !== target)).slice(0, 2);
  const siblingWords = siblings.flatMap((s) => tokenize(s.example.en));
  const filler = shuffle(EXTRA_FILLER_WORDS.filter((w) => !targetLower.includes(w))).slice(0, FILLER_COUNT);

  let distractors = [...siblingWords, ...filler];
  if (distractors.length > MAX_DISTRACTORS) distractors = shuffle(distractors).slice(0, MAX_DISTRACTORS);

  return { targetWords, emoji: target.example.emoji, bubbles: shuffle([...targetWords, ...distractors]) };
}

/** Susunan baris piramida (jumlah bubble per baris) — makin ke bawah makin
 *  lebar, meniru referensi (baris atas sedikit, bawah banyak). Struktural
 *  berdasar TOTAL bubble, bukan hardcode angka tetap, krn total bervariasi
 *  tergantung panjang kalimat topik yang dipetik. */
function pyramidRows(total: number): number[] {
  if (total <= 3) return [total];
  if (total <= 7) {
    const first = Math.ceil(total / 2);
    return [first, total - first];
  }
  const r1 = Math.max(1, Math.round(total * 0.16));
  const r2 = Math.max(2, Math.round(total * 0.38));
  const r3 = Math.max(1, total - r1 - r2);
  return [r1, r2, r3];
}

/** Duplikat lokal `roundActionsHtml` (konvensi app ini: helper generik
 *  diduplikasi per file game — lihat games/balloonpop.ts dst). */
function roundActionsHtml(isLast: boolean): string {
  return `
    <div class="round-actions">
      <button class="ghost-btn" type="button" data-action="tryAgainRound">🔁 Coba Lagi</button>
      <button class="primary-btn" type="button" data-action="nextRound" style="margin-top:0">${isLast ? 'Selesai ✅' : 'Lanjut ➡️'}</button>
    </div>`;
}

export function runSentencePuzzle(container: HTMLElement, topics: VocabTopic[], onDone: OnDone, level: LevelKey): void {
  let roundIndex = 0;
  let round: PuzzleRound;
  let rows: number[] = [];
  let used: boolean[] = [];
  let answer: number[] = [];
  let answered = false;
  let hintRevealed = false;

  function newRound(): void {
    round = buildRound(topics);
    rows = pyramidRows(round.bubbles.length);
    used = round.bubbles.map(() => false);
    answer = [];
    answered = false;
    hintRevealed = false;
    paint();
    speak(round.targetWords.join(' '));
  }

  function answerText(): string {
    return answer.map((i) => round.bubbles[i]).join(' ');
  }

  function bubbleHtml(word: string, i: number): string {
    // Begitu ronde terjawab, SEMUA bubble diredupkan (bukan cuma yang
    // dipakai) — supaya kelihatan jelas ronde ini sudah terkunci, tidak ada
    // bubble yang masih terlihat "hidup" padahal tap-nya sudah tidak ngapa-
    // ngapain (CLAUDE.md: setiap percobaan anak harus direspons jelas).
    const isUsed = used[i] || answered;
    return `<button class="sp-bubble${isUsed ? ' is-used' : ''}" type="button" data-action="tapBubble" data-payload="${i}" ${
      isUsed ? 'disabled' : ''
    }>${word}</button>`;
  }

  function rowsHtml(): string {
    let idx = 0;
    return rows
      .map((count) => {
        const cells = round.bubbles
          .slice(idx, idx + count)
          .map((w, j) => bubbleHtml(w, idx + j))
          .join('');
        idx += count;
        return `<div class="sp-row">${cells}</div>`;
      })
      .join('');
  }

  function paint(): void {
    const built = answerText();
    container.innerHTML = `
      <div class="sp-head"><span class="tag">${roundIndex + 1}/${ROUND_COUNT} kalimat</span></div>
      <div class="sp-sky" aria-hidden="true">
        <span class="sp-moon">🌙</span>
        <span class="sp-bird">🐦</span>
        <span class="sp-bird sp-bird2">🐦</span>
      </div>
      <div class="sp-picture"><span class="big-emoji" style="margin:0">${round.emoji}</span></div>
      <div class="speak-row">
        <button class="speak-btn pt-cta" type="button" data-action="hearSentence">🔊 Dengar</button>
        <button class="speak-btn-ghost" type="button" data-action="hint" ${hintRevealed || answered ? 'disabled' : ''}>💡 Petunjuk</button>
      </div>
      ${hintRevealed ? `<p class="meta" style="text-align:center;margin:0 0 var(--s3)">💡 <b>${round.targetWords.join(' ')}</b></p>` : ''}
      <div class="sp-pyramid">${rowsHtml()}</div>
      <div class="sp-answer-bar${built ? '' : ' empty'}">${built || 'Tap gelembung katanya 👆'}</div>
      <div class="feedback" id="fb"></div>
      ${
        answered
          ? ''
          : `<div class="letter-actions">
        <button class="ghost-btn slim" type="button" data-action="removeLastBubble" ${answer.length === 0 ? 'disabled' : ''}>⌫ Hapus Kata</button>
        <button class="ghost-btn slim" type="button" data-action="resetBubbles" ${answer.length === 0 ? 'disabled' : ''}>🔄 Ulang Susunan</button>
      </div>`
      }
    `;
    setHandlers({
      tapBubble: (payload) => onTapBubble(Number(payload)),
      hearSentence: () => speak(round.targetWords.join(' ')),
      hint: () => {
        if (hintRevealed || answered) return;
        hintRevealed = true;
        paint();
      },
      removeLastBubble: () => {
        if (answered || answer.length === 0) return;
        const last = answer.pop()!;
        used[last] = false;
        paint();
      },
      resetBubbles: () => {
        if (answered || answer.length === 0) return;
        answer.forEach((i) => (used[i] = false));
        answer = [];
        paint();
      },
    });
  }

  function onTapBubble(i: number): void {
    if (answered || used[i]) return;
    used[i] = true;
    answer.push(i);
    paint();
    if (answer.length === round.targetWords.length) checkAnswer();
  }

  function checkAnswer(): void {
    answered = true;
    // Konsisten pola `runSusunKalimat`/Eja Kata (CLAUDE.md poin 4): hapus
    // `.letter-actions` langsung dari DOM di sini, bukan andalkan render
    // ulang — repaint dari `onTapBubble` barusan sudah kepakai duluan
    // sebelum `answered` berubah jadi true.
    container.querySelector('.letter-actions')?.remove();
    const fb = container.querySelector<HTMLElement>('#fb')!;
    const correct = answerText().toLowerCase() === round.targetWords.join(' ').toLowerCase();
    if (correct) {
      recordAttempt(true);
      container.querySelector<HTMLElement>('.sp-picture')?.classList.add('win-burst');
      playCorrectTone();
      fireConfetti();
      fb.textContent = pickPraise(level);
      fb.className = 'feedback good';
    } else {
      recordAttempt(false);
      playTryAgainTone();
      fb.textContent = pickEncourage(level);
      fb.className = 'feedback bad';
    }
    fb.insertAdjacentHTML('afterend', roundActionsHtml(roundIndex === ROUND_COUNT - 1));
    setHandlers({
      tryAgainRound: () => {
        // `answered = false` WAJIB sebelum `paint()` (bug pattern
        // terdokumentasi CLAUDE.md poin 4) — hint tetap persist (non-
        // punitive), TAPI susunan jawaban di-reset ke bubble kosong lagi.
        answered = false;
        answer = [];
        used = round.bubbles.map(() => false);
        paint();
      },
      nextRound: () => {
        roundIndex += 1;
        if (roundIndex >= ROUND_COUNT) {
          onDone();
          return;
        }
        newRound();
      },
    });
  }

  newRound();
}
