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
 * campur kata pengecoh dari DUA sumber sekaligus — (a) kata dari 1-3
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
 *
 * 🔒 **Revisi (permintaan user "update... seperti konsepnya Raja Kata
 * dimana ada sub list game per level dan ada game nya 5 di setiap sub list
 * game per level")** — pola SAMA PERSIS `games/wordmatch.ts`/
 * `games/memorymatch.ts`: fungsi lama (dulu bernama `runSentencePuzzle`,
 * SATU-SATUNYA entry point, langsung main 5 kalimat berturut-turut TANPA
 * Map) direname `runSentencePuzzleRound()` — jadi mesin "1 markas" (5
 * kalimat, `ROUND_COUNT` TIDAK berubah nilainya, kebetulan SUDAH 5 dari
 * awal — cuma sekarang dibingkai sbg "5 kalimat per markas", bukan
 * "5 kalimat lalu langsung Selesai"). `runSentencePuzzle()` (nama EXPORT
 * TETAP SAMA, dipanggil `app.ts`) SEKARANG orkestrator Map Kerajaan Kalimat
 * 6-markas (`pemanasan` BARU ditambah paling depan, permintaan user
 * "tambahkan 1 sehingga ada 6... levelnya ada pemanasan, mudah, sedang,
 * sulit, jago, legendaris") — kesulitan naik lewat JUMLAH kata pengecoh
 * (`DIFFICULTY_META`, sibling+filler makin banyak tiap tingkat, krn kalimat
 * TARGET-nya sendiri ikut `topic.items` Vocab level ini apa adanya, bukan
 * sesuatu yang bisa "diperpanjang" per tingkat). Riwayat desain Map/grid/
 * persentase/"Cara Main"/footer lengkap: lihat komentar `games/
 * wordmatch.ts`, TIDAK diulang detail di sini.
 */
import { isDevTestAccount } from '../account';
import { setGameRoundActive, setHandlers } from '../interaction';
import { recordAttempt } from '../progress';
import { playCorrectTone, playTryAgainTone, speak } from '../speech';
import { pickPraise, pickEncourage } from '../praise';
import { fireConfetti } from '../confetti';
import { GAME_STAR_FIELD } from '../scenery';
import { shuffle } from '../util';
import type { LevelKey, OnDone, VocabTopic, WordMatchDifficulty } from '../types';

/** `RajaKey` game ini — dikirim ke `recordAttempt()`, lihat komentar
 *  `GAME_KEY` `games/wordmatch.ts`. */
const GAME_KEY = 'susun';

const ROUND_COUNT = 5;

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

export interface DifficultyMeta {
  label: string;
  sub: string;
  siblingCount: number;
  fillerCount: number;
  maxDistractors: number;
}

/** Kesulitan naik lewat JUMLAH kata pengecoh (sibling+filler), BUKAN
 *  panjang kalimat target — kalimat target selalu 1:1 dari `topic.items`
 *  Vocab level ini apa adanya (tidak diauthoring ulang per tingkat), jadi
 *  "piramida makin ramai" itulah yang bikin markas belakangan genuinely
 *  lebih sulit dicari (lebih banyak kata yang HARUS disaring anak). */
export const DIFFICULTY_META: Record<WordMatchDifficulty, DifficultyMeta> = {
  pemanasan: { label: 'Pemanasan', sub: 'Kata pengecoh paling sedikit', siblingCount: 1, fillerCount: 1, maxDistractors: 3 },
  mudah: { label: 'Mudah', sub: 'Kata pengecoh sedikit', siblingCount: 1, fillerCount: 2, maxDistractors: 5 },
  sedang: { label: 'Sedang', sub: 'Kata pengecoh mulai ramai', siblingCount: 1, fillerCount: 3, maxDistractors: 6 },
  sulit: { label: 'Sulit', sub: 'Kata pengecoh lumayan banyak', siblingCount: 2, fillerCount: 3, maxDistractors: 7 },
  jago: { label: 'Jago', sub: 'Kata pengecoh banyak', siblingCount: 2, fillerCount: 4, maxDistractors: 8 },
  legendaris: { label: 'Legendaris', sub: 'Kata pengecoh sangat banyak', siblingCount: 3, fillerCount: 5, maxDistractors: 9 },
};

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

function buildRound(topics: VocabTopic[], difficulty: WordMatchDifficulty): PuzzleRound {
  const meta = DIFFICULTY_META[difficulty];
  const topic = topics[Math.floor(Math.random() * topics.length)];
  const items = topic.items;
  const target = items[Math.floor(Math.random() * items.length)];
  const targetWords = tokenize(target.example.en);
  const targetLower = targetWords.map((w) => w.toLowerCase());

  const siblings = shuffle(items.filter((it) => it !== target)).slice(0, meta.siblingCount);
  const siblingWords = siblings.flatMap((s) => tokenize(s.example.en));
  const filler = shuffle(EXTRA_FILLER_WORDS.filter((w) => !targetLower.includes(w))).slice(0, meta.fillerCount);

  let distractors = [...siblingWords, ...filler];
  if (distractors.length > meta.maxDistractors) distractors = shuffle(distractors).slice(0, meta.maxDistractors);

  return { targetWords, emoji: target.example.emoji, bubbles: shuffle([...targetWords, ...distractors]) };
}

/** Susunan baris piramida (jumlah bubble per baris) — makin ke bawah makin
 *  lebar, meniru referensi (baris atas sedikit, bawah banyak). Struktural
 *  berdasar TOTAL bubble, bukan hardcode angka tetap, krn total bervariasi
 *  tergantung panjang kalimat topik yang dipetik & tingkat kesulitan. */
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
 *  diduplikasi per file game — lihat games/wordmatch.ts dst). */
function roundActionsHtml(isLast: boolean): string {
  return `
    <div class="round-actions">
      <button class="ghost-btn" type="button" data-action="tryAgainRound">🔁 Coba Lagi</button>
      <button class="primary-btn" type="button" data-action="nextRound" style="margin-top:0">${isLast ? 'Selesai ✅' : 'Lanjut ➡️'}</button>
    </div>`;
}

/** "Cara Main" — duplikat lokal, lihat komentar lengkap `gameHowToHtml`
 *  `games/wordmatch.ts`. */
function gameHowToHtml(steps: string[]): string {
  return `
    <h2 class="game-howto-title">Cara Main</h2>
    <div class="card game-howto-card">
      <ol class="game-howto-list">
        ${steps.map((s, i) => `<li><span class="game-howto-num" aria-hidden="true">${i + 1}</span><span>${s}</span></li>`).join('')}
      </ol>
    </div>`;
}

/** Opsional — dipasok `runSentencePuzzle()` (orkestrator Map Kerajaan
 *  Kalimat) supaya 1 markas tahu posisinya, pola SAMA PERSIS
 *  `RoundJourneyCtx` `games/wordmatch.ts`. */
interface RoundJourneyCtx {
  isLast: boolean;
  headerHtml: string;
}

/** Mesin 1 markas — 5 kalimat berturut-turut (`ROUND_COUNT`) di 1 tingkat
 *  kesulitan. Dulu jadi entry point tunggal bernama `runSentencePuzzle`
 *  (SUDAH DIRENAME, lihat komentar puncak file). Sekarang dipakai
 *  `runSentencePuzzle()` orkestrator di bawah (dipanggil 1× tiap markas
 *  ditap). */
function runSentencePuzzleRound(
  container: HTMLElement,
  topics: VocabTopic[],
  difficulty: WordMatchDifficulty,
  onDone: OnDone,
  level: LevelKey,
  journey?: RoundJourneyCtx
): void {
  let roundIndex = 0;
  let round: PuzzleRound;
  let rows: number[] = [];
  let used: boolean[] = [];
  let answer: number[] = [];
  let answered = false;
  let hintRevealed = false;

  function newRound(): void {
    round = buildRound(topics, difficulty);
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
      ${journey?.headerHtml ?? ''}
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
      recordAttempt(true, GAME_KEY);
      container.querySelector<HTMLElement>('.sp-picture')?.classList.add('win-burst');
      playCorrectTone();
      fireConfetti();
      fb.textContent = pickPraise(level);
      fb.className = 'feedback good';
    } else {
      recordAttempt(false, GAME_KEY);
      playTryAgainTone();
      fb.textContent = pickEncourage(level);
      fb.className = 'feedback bad';
    }
    const isLastRoundOfMarkas = roundIndex === ROUND_COUNT - 1;
    fb.insertAdjacentHTML('afterend', roundActionsHtml(isLastRoundOfMarkas && (journey?.isLast ?? true)));
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

interface JourneyNode {
  difficulty: WordMatchDifficulty;
  place: string;
  emoji: string;
  guideLine: string;
}

/** 6 markas Kerajaan Kalimat, urut Pemanasan→Mudah→Sedang→Sulit→Jago→
 *  Legendaris (markas ke-0 `pemanasan` BARU, permintaan user "tambahkan 1
 *  sehingga ada 6... levelnya ada pemanasan, mudah, sedang, sulit, jago,
 *  legendaris") — nama tempat SENGAJA beda dari Kerajaan Kata/Balon/Ingatan
 *  (hindari nama lokasi persis sama biar tidak tertukar di kepala anak,
 *  pola SAMA alasan `games/wordmatch.ts`). */
const JOURNEY_NODES: JourneyNode[] = [
  { difficulty: 'pemanasan', place: 'Halaman Kalimat', emoji: '🏡', guideLine: 'Yuk pemanasan dulu di Halaman Kalimat sebelum masuk taman!' },
  { difficulty: 'mudah', place: 'Taman Kalimat', emoji: '🌻', guideLine: 'Selamat datang di Taman Kalimat! Susun kalimat pertamamu dari gelembung kata ini.' },
  { difficulty: 'sedang', place: 'Bengkel Kalimat', emoji: '🔧', guideLine: 'Kamu masuk Bengkel Kalimat! Kata pengecohnya mulai ramai, saring baik-baik.' },
  { difficulty: 'sulit', place: 'Studio Kalimat', emoji: '🎨', guideLine: 'Sampai di Studio Kalimat! Susun kalimatnya di antara lebih banyak gelembung.' },
  { difficulty: 'jago', place: 'Panggung Kalimat', emoji: '🎭', guideLine: 'Kamu di Panggung Kalimat! Tunjukkan kehebatanmu menyusun kata.' },
  { difficulty: 'legendaris', place: 'Puncak Kalimat', emoji: '🏔️', guideLine: 'Ini dia Puncak Kalimat! Gelembungnya paling ramai, buktikan kamu Jago Susun sejati.' },
];

/** Header dalam layar 1 markas — pola SAMA PERSIS `nodeHeaderHtml()`
 *  `games/wordmatch.ts`. */
function nodeHeaderHtml(node: JourneyNode, foundCount: number, total: number): string {
  return `
    <div class="latihan-head">
      <span class="stage-badge">${node.emoji} ${node.place}</span>
      <span class="tag accent">🧩 ${foundCount}/${total}</span>
    </div>
    <p class="meta" style="margin-top:var(--s3)">📯 "${node.guideLine}"</p>`;
}

/**
 * Raja Susun — orkestrator penuh (dipanggil `app.ts runRajaRound`), pola
 * SAMA PERSIS `games/wordmatch.ts` `runWordMatch()` — Map Kerajaan Kalimat
 * 6-markas → tap markas → 1 markas = 5 kalimat via
 * `runSentencePuzzleRound()` → balik ke Map → markas ke-6 tuntas →
 * "Semua Kalimat Tersusun!" → `onDone()`. State `visited` cuma hidup di
 * closure ini, TIDAK disimpan progress.ts/localStorage, konsisten semua
 * raja Game Hub lain.
 */
export function runSentencePuzzle(container: HTMLElement, topics: VocabTopic[], onDone: OnDone, level: LevelKey): void {
  const total = JOURNEY_NODES.length;
  const visited = new Set<number>();

  function renderMap(): void {
    // 🔒 Back dari layar Map TIDAK perlu pop up konfirmasi lagi (permintaan
    // user) — lihat komentar `isGameRoundActive` `interaction.ts`.
    setGameRoundActive(false);
    const stops = JOURNEY_NODES.map((node, i) => {
      const cleared = visited.has(i);
      // Akun tes dev ("124") lihat SEMUA markas terbuka — lihat account.ts isDevTestAccount().
      const unlocked = isDevTestAccount() || i === 0 || visited.has(i - 1);
      const stateClass = cleared ? 'is-cleared' : unlocked ? 'is-open' : 'is-locked';
      const pct = cleared ? 100 : 0;
      const badge = `<span class="skill-pct${pct >= 100 ? ' done' : ''}">${pct}%</span>`;
      const meta = DIFFICULTY_META[node.difficulty];
      return `
      <button class="raja-card map-card ${stateClass}" type="button" data-action="enterNode" data-payload="${i}" ${unlocked ? '' : 'disabled aria-disabled="true"'} style="--band-deep:var(--c-gram)">
        ${badge}
        <span class="raja-card-icon" aria-hidden="true"><span class="mascot-idle" style="font-size:clamp(52px,14vw,68px);animation-delay:${(i * 0.15).toFixed(2)}s">${node.emoji}</span></span>
        <h3>${node.place}</h3>
        <span class="tag diff-${node.difficulty}">${meta.label}</span>
      </button>`;
    }).join('');

    const dots = JOURNEY_NODES.map((_, i) => {
      const done = visited.has(i);
      return `<span class="game-progress-dot${done ? ' done' : ''}" aria-hidden="true">${done ? '✓' : ''}</span>`;
    }).join('');

    container.innerHTML = `
      <div class="raja-map-wrap">
        ${GAME_STAR_FIELD}
        <div class="card game-progress-card">
          <h2>Taklukkan markas satu per satu, ya!</h2>
          <div class="game-progress-dots">${dots}<span class="game-progress-label">Selesai ${visited.size} dari ${total}</span></div>
        </div>
        <div class="raja-grid">${stops}</div>
        ${gameHowToHtml([
          'Tap gelembung kata untuk menyusun kalimat',
          'Susun sampai artinya sama seperti gambar',
          'Selesaikan 5 kalimat di tiap markas',
          'Taklukkan markas satu per satu sampai tuntas!',
        ])}
      </div>`;
    setHandlers({ enterNode: (payload) => playStage(Number(payload)) });
  }

  function playStage(idx: number): void {
    setGameRoundActive(true); // masuk markas = "halaman mengerjakan", popup keluar aktif lagi
    const node = JOURNEY_NODES[idx];
    const isLast = idx === total - 1;
    runSentencePuzzleRound(
      container,
      topics,
      node.difficulty,
      () => {
        visited.add(idx);
        if (visited.size >= total) renderMissionComplete();
        else renderMap();
      },
      level,
      { isLast, headerHtml: nodeHeaderHtml(node, visited.size, total) }
    );
  }

  function renderMissionComplete(): void {
    setGameRoundActive(false); // layar selesai, tidak ada progres yang bisa hilang
    container.innerHTML = `
      <div class="done-wrap win">
        <div class="sunburst lg mascot-pop" aria-hidden="true"><span class="face">🧩</span><span class="crown">🏆</span></div>
        <h2 class="win-banner">Semua Kalimat Tersusun!</h2>
        <p class="done-sub">Kamu berhasil menjelajahi seluruh Kerajaan Kalimat & menyusun semua kalimatnya!</p>
        <button class="primary-btn" type="button" data-action="finish">Selesai ✅</button>
      </div>`;
    setHandlers({ finish: () => onDone() });
  }

  renderMap();
}
