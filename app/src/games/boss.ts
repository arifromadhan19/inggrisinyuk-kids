/**
 * Tantangan Bos — dipinjam konsepnya dari "Duel Pembisu"/"Duel Verifikasi" di
 * `inggrisinyuk` (dewasa, project terpisah), tapi diadaptasi berat, BUKAN
 * diporting:
 *  - Di sana bos = pertarungan dialog AI sungguhan yang memanggil LLM
 *    (berbayar). Di sini bos 100% hardcoded & client-side — sesuai PRD §5
 *    (tanpa backend/AI di v1) — cuma mashup lebih besar dari mini-game yang
 *    sudah ada (Tebak & Cocokkan, Dengar & Pilih, Susun Kalimat, Ucapkan &
 *    Cek), dicampur dari lebih dari satu skill sekaligus & ditarik dari
 *    SEMUA topik level ini (bukan cuma 1 topik) supaya terasa lebih besar.
 *  - Di sana kalah = uang hangus, harus beli ulang. Di sini TIDAK ADA status
 *    kalah sama sekali — setiap ronde tetap pola "coba sampai benar, retry
 *    tanpa batas" yang sudah dipakai di seluruh app (non-punitive, PRD
 *    §4.5/§4.6/§11.2 RESEARCH). "Menang" = semua ronde tuntas dicoba, sama
 *    seperti aturan selesai modul biasa, cuma bentuknya lebih besar & seru
 *    (framing "bos" ala Mario/Pokémon gym-leader — bukan tegang/menakutkan).
 */
import {
  BOSS_NAME,
  GRAMMAR_TOPICS_BY_LEVEL,
  LISTENING_TOPICS_BY_LEVEL,
  SPEAKING_TOPICS_BY_LEVEL,
  VOCAB_TOPICS_BY_LEVEL,
} from '../content';
import { setHandlers } from '../interaction';
import { recordAttempt } from '../progress';
import { listenOnce, looseMatch, speak, sttSupported } from '../speech';
import type { LevelKey, OnDone } from '../types';
import { shuffle } from '../util';

/** Materi Bos ikut level yang ditantang (permintaan user: Adventurer
 *  sekarang punya materi sendiri, dulu Bos SELALU nyoal dari Explorer
 *  apa pun levelnya) — jatuh ke Explorer kalau skill tertentu di level itu
 *  belum ada topiknya sama sekali, konsisten dgn "Bos level terkunci
 *  pertama tetap bisa dicoba pakai materi yang ada" (app.ts `renderLevels`). */
function poolFor<T>(byLevel: Partial<Record<LevelKey, T[]>>, level: LevelKey): T[] {
  const own = byLevel[level];
  return own && own.length > 0 ? own : (byLevel.explorer ?? []);
}

const ROUNDS_PER_PHASE = 2;
const TOTAL_PHASES = 4;
const TOTAL_ROUNDS = ROUNDS_PER_PHASE * TOTAL_PHASES;

function phaseBadge(bossName: string, n: number, label: string, emoji: string): string {
  return `<span class="stage-badge boss-badge">🏰 ${bossName.toUpperCase()} · Babak ${n}/${TOTAL_PHASES} · ${emoji} ${label}</span>`;
}

function roundMeta(n: number): string {
  return `<div class="id-text">Ronde ${n} dari ${TOTAL_ROUNDS}</div>`;
}

/** Jalankan seluruh gauntlet 4 babak, lalu panggil onWin (selalu tercapai —
 *  tidak ada jalur "kalah", cuma jalur "belum selesai"). */
export function runBoss(container: HTMLElement, onWin: OnDone, level: LevelKey): void {
  const bossName = BOSS_NAME[level];
  let roundNo = 0;
  const next = (fn: () => void) => {
    roundNo += 1;
    fn();
  };

  const vocabTopics = poolFor(VOCAB_TOPICS_BY_LEVEL, level);
  const listeningTopics = poolFor(LISTENING_TOPICS_BY_LEVEL, level);
  const grammarTopics = poolFor(GRAMMAR_TOPICS_BY_LEVEL, level);
  const speakingTopics = poolFor(SPEAKING_TOPICS_BY_LEVEL, level);

  const vocabItems = shuffle(vocabTopics.flatMap((t) => t.items)).slice(0, ROUNDS_PER_PHASE);
  // Listening py 2 format berdampingan (`AnyListeningTopic`, types.ts) —
  // format baru (`items`, mis. Little Stars) diadaptasi jadi bentuk
  // `ListeningDrill` di sini (`ListeningQuestionOption` sudah struktural
  // cocok dgn `ListeningOption`), supaya babak ini TETAP 1 implementasi
  // generik tanpa perlu tahu format aslinya.
  const listenDrills = shuffle(
    listeningTopics.flatMap((t) => ('items' in t ? t.items.map((it) => ({ en: it.example.en, opts: it.question.options })) : t.drill))
  ).slice(0, ROUNDS_PER_PHASE);
  const grammarScrambles = shuffle(grammarTopics.flatMap((t) => t.scramble)).slice(0, ROUNDS_PER_PHASE);
  // Speaking py 2 format berdampingan (`AnySpeakingTopic`, types.ts) — sama
  // adapter inline dgn `listenDrills` di atas: format baru (`items`, Little
  // Stars) diratakan jadi `string[]` frasa target, format lama tetap `.drill`
  // apa adanya, supaya babak ini TETAP 1 implementasi generik.
  const speakPhrases = shuffle(
    speakingTopics.flatMap((t) => ('items' in t ? t.items.map((it) => it.phrase.en) : t.drill))
  ).slice(0, ROUNDS_PER_PHASE);
  const allVocab = vocabTopics.flatMap((t) => t.items);

  runVocabPhase();

  function runVocabPhase(round = 0): void {
    if (round >= vocabItems.length) return runListenPhase();
    const target = vocabItems[round];
    const distractors = shuffle(allVocab.filter((i) => i.en !== target.en)).slice(0, 3);
    const opts = shuffle([target, ...distractors]);

    next(() => {
      container.innerHTML = `
        ${phaseBadge(bossName, 1, 'Vocabulary', '📚')}
        ${roundMeta(roundNo)}
        <div class="speak-row"><button class="speak-btn" data-action="replay">🔊 Dengar Lagi</button></div>
        <div class="opt-grid">
          ${opts.map((o, i) => `<button class="opt-btn" data-action="pick" data-payload="${i}">${o.emoji}</button>`).join('')}
        </div>
        <div class="feedback" id="fb"></div>
      `;
      speak(target.en);

      setHandlers({
        replay: () => speak(target.en),
        pick: (payload) => {
          const i = Number(payload);
          const btn = container.querySelectorAll<HTMLElement>('.opt-btn')[i];
          const fb = container.querySelector<HTMLElement>('#fb')!;
          if (opts[i] === target) {
            recordAttempt(true);
            btn.classList.add('correct');
            fb.textContent = 'Kena! 🎉';
            fb.className = 'feedback good';
            setTimeout(() => runVocabPhase(round + 1), 750);
          } else {
            recordAttempt(false);
            btn.classList.add('wrong');
            fb.textContent = 'Coba lagi ya 💪';
            fb.className = 'feedback bad';
            setTimeout(() => btn.classList.remove('wrong'), 350);
          }
        },
      });
    });
  }

  function runListenPhase(round = 0): void {
    if (round >= listenDrills.length) return runGrammarPhase();
    const d = listenDrills[round];

    next(() => {
      container.innerHTML = `
        ${phaseBadge(bossName, 2, 'Listening', '🎧')}
        ${roundMeta(roundNo)}
        <div class="speak-row"><button class="speak-btn" data-action="replay">🔊 Putar Kalimat</button></div>
        <div class="opt-grid ${d.opts.length > 2 ? 'three' : ''}">
          ${d.opts.map((o, i) => `<button class="opt-btn" data-action="pick" data-payload="${i}">${o.emoji}</button>`).join('')}
        </div>
        <div class="feedback" id="fb"></div>
      `;
      speak(d.en);

      setHandlers({
        replay: () => speak(d.en),
        pick: (payload) => {
          const i = Number(payload);
          const btn = container.querySelectorAll<HTMLElement>('.opt-btn')[i];
          const fb = container.querySelector<HTMLElement>('#fb')!;
          if (d.opts[i].ok) {
            recordAttempt(true);
            btn.classList.add('correct');
            fb.textContent = 'Tepat! 🎉';
            fb.className = 'feedback good';
            setTimeout(() => runListenPhase(round + 1), 750);
          } else {
            recordAttempt(false);
            btn.classList.add('wrong');
            fb.textContent = 'Dengar lagi, yuk 💪';
            fb.className = 'feedback bad';
            setTimeout(() => btn.classList.remove('wrong'), 350);
          }
        },
      });
    });
  }

  function runGrammarPhase(round = 0): void {
    if (round >= grammarScrambles.length) return runSpeakPhase();
    const sc = grammarScrambles[round];
    let answer: { w: string; idx: number }[] = [];
    let bank = shuffle(sc.target.map((w, i) => ({ w, used: false, idx: i })));

    const paint = () => {
      container.innerHTML = `
        ${phaseBadge(bossName, 3, 'Grammar', '✏️')}
        ${roundMeta(roundNo)}
        <div class="big-emoji" style="font-size:44px;">${sc.emoji}</div>
        <div class="answer-row ${answer.length ? '' : 'empty'}">
          ${answer.map((a, ai) => `<span class="chip placed" data-action="unpick" data-payload="${ai}">${a.w}</span>`).join('')}
        </div>
        <div class="bank-row">
          ${bank.map((b, bi) => `<span class="chip ${b.used ? 'hidden' : ''}" data-action="pick" data-payload="${bi}">${b.w}</span>`).join('')}
        </div>
        <div class="feedback" id="fb"></div>
        <button class="primary-btn" data-action="check">Cek Jawaban ✅</button>
        <button class="ghost-btn" data-action="clear">🔄 Bersihkan</button>
      `;
      setHandlers({
        clear: () => {
          answer = [];
          bank = shuffle(sc.target.map((w, i) => ({ w, used: false, idx: i })));
          paint();
        },
        pick: (payload) => {
          const bi = Number(payload);
          if (bank[bi].used) return;
          bank[bi].used = true;
          answer.push(bank[bi]);
          paint();
        },
        unpick: (payload) => {
          const ai = Number(payload);
          const item = answer[ai];
          answer.splice(ai, 1);
          bank.find((b) => b.idx === item.idx)!.used = false;
          paint();
        },
        check: () => {
          const fb = container.querySelector<HTMLElement>('#fb')!;
          const built = answer.map((a) => a.w).join(' ');
          if (built === sc.target.join(' ')) {
            recordAttempt(true);
            fb.textContent = 'Pas banget! 🎉';
            fb.className = 'feedback good';
            speak(built);
            setTimeout(() => runGrammarPhase(round + 1), 900);
          } else {
            recordAttempt(false);
            fb.textContent = 'Urutannya belum pas, coba atur lagi 💪';
            fb.className = 'feedback bad';
          }
        },
      });
    };

    next(paint);
  }

  function runSpeakPhase(round = 0): void {
    if (round >= speakPhrases.length) return finish();
    const phrase = speakPhrases[round];

    next(() => {
      container.innerHTML = `
        ${phaseBadge(bossName, 4, 'Speaking', '🗣️')}
        ${roundMeta(roundNo)}
        <div class="en-text">"${phrase}"</div>
        <div class="speak-row"><button class="speak-btn" data-action="replay">🔊 Dengar Contoh</button></div>
        <div class="mic-wrap">
          <button class="mic-btn" id="micBtn" data-action="mic">🎤</button>
          <div class="mic-hint">${sttSupported ? 'Tap mic, lalu ucapkan kalimatnya' : 'Mikrofon tidak didukung browser ini'}</div>
        </div>
        <div class="heard-text" id="heard"></div>
        <div class="feedback" id="fb"></div>
        ${sttSupported ? '' : `<button class="ghost-btn" data-action="skip">✅ Aku Sudah Coba Ucapkan</button>`}
      `;

      setHandlers({
        replay: () => speak(phrase),
        skip: () => runSpeakPhase(round + 1),
        mic: () => {
          const btn = container.querySelector<HTMLElement>('#micBtn')!;
          btn.classList.add('listening');
          listenOnce(
            (said) => {
              btn.classList.remove('listening');
              container.querySelector<HTMLElement>('#heard')!.textContent = `Kamu bilang: "${said}"`;
              const fb = container.querySelector<HTMLElement>('#fb')!;
              fb.textContent = looseMatch(said, phrase) ? 'Keren banget! 🎉' : 'Bagus, sudah dicoba! Lanjut ya 👍';
              fb.className = 'feedback good';
              setTimeout(() => runSpeakPhase(round + 1), 850);
            },
            (kind) => {
              btn.classList.remove('listening');
              // 'aborted' — mic dihentikan paksa krn "🔊 Dengar Contoh"
              // ditap pas masih dengar (speech.ts `stopListening()`), bukan
              // STT gagal — reset diam-diam.
              if (kind === 'aborted') return;
              container.querySelector<HTMLElement>('#fb')!.textContent = 'Belum kedengaran, coba lagi 🎧';
            }
          );
        },
      });
    });
  }

  function finish(): void {
    onWin();
  }
}
