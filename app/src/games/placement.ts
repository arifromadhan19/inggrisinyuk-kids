/**
 * "First Placement Test" — kid-friendly filter WAJIB (CLAUDE.md): TANPA timer
 * countdown (versi dewasa 30 menit — ditolak, PRD §4.6), audio-first tap-
 * emoji, copy ajakan bukan evaluatif, retry-friendly per soal, skip jelas
 * tanpa rasa bersalah ("Nanti Aja"). 4 skill sekarang mekanik NYATA, bukan
 * cuma pill di intro (doc/first_placement_test.md §4):
 *   - Vocab: reuse pola Tebak & Cocokkan (games/vocabulary.ts) — TTS 1 kata → tap emoji.
 *   - Listening: reuse pola games/listening.ts `runTantangan` — cerita mini → 1 pertanyaan → tap emoji.
 *   - Speaking lapis 1 (DI-SKOR): format recognition (preseden TOEFL Primary) — deterministik.
 *   - Speaking lapis 2 (TIDAK di-skor): mic terbuka, selalu berhasil ke anak; `matched`+`confidence`
 *     tetap dievaluasi & dikirim sebagai sinyal internal (PRD §13.1 — ASR anak tidak selalu akurat).
 * Maks 2 percobaan per anak (permintaan user — supaya kalau Iterasi 2 pakai
 * LLM gratis, penggunaannya otomatis ikut terkontrol) — digating di app.ts
 * SEBELUM layar ini dibuka (renderPlacementLimitReached), bukan di sini.
 */
import { setHandlers } from '../interaction';
import { listenOnce, looseMatch, speak, speakSequence, sttSupported } from '../speech';
import { PLACEMENT_OPENMIC_ITEMS, PLACEMENT_QUESTIONS, type PlacementQuestion } from '../placement-test-data';
import {
  skipPlacementTest,
  submitPlacementTest,
  ApiRequestError,
  type PlacementAnswer,
} from '../account';
import type { OnDone } from '../types';

export const LEVEL_LABEL: Record<string, string> = {
  starter: '🌱 Starter',
  explorer: '🧭 Explorer',
  adventurer: '🚀 Adventurer',
};

const SKILL_TASTE = [
  ['📚', 'Vocab'],
  ['✏️', 'Grammar'],
  ['🎧', 'Listening'],
  ['🗣️', 'Speaking'],
];

export function renderPlacementIntro(container: HTMLElement, onStart: OnDone, onSkip: OnDone): void {
  container.innerHTML = `
    <span class="stage-badge">🎈 SEBELUM MULAI</span>
    <h2 class="h2" style="margin:12px 0 10px">First Placement Test</h2>

    <p class="lede" style="margin-bottom:14px">Yuk kenalan sama 4 kegiatan seru yang bakal nentuin titik mulaimu:</p>
    <div class="pt-skills">
      ${SKILL_TASTE.map(([emoji, label]) => `<span class="pt-skill-pill">${emoji} ${label}</span>`).join('')}
    </div>

    <div class="pt-story">
      🗺️ Ini langkah pertama di <b>Jalur Petualanganmu</b> — dari Little Stars sampai Trailblazer, singa 🦁 bakal nemenin tiap kamu naik level!
    </div>

    <p class="meta" style="margin:14px 0 4px">⏱️ Sekitar 10 menit, boleh santai — nggak ada yang buru-buru.</p>
    <p class="meta" style="margin-bottom:22px">Kalau di-skip, kamu mulai dari level paling awal dulu — nggak apa-apa, bisa dicoba lagi kapan saja.</p>

    <button class="primary-btn pt-cta" type="button" data-action="ptStart">▶️ Yuk Mulai</button>
    <button class="ghost-btn" type="button" data-action="ptSkip">Nanti Aja</button>
  `;
  setHandlers({ ptStart: onStart, ptSkip: onSkip });
}

/** Layar non-punitive saat kuota 2x percobaan sudah habis (§"max 2 kali").
 *  Dibingkai sebagai "kamu sudah eksplorasi", bukan "ditolak"/"gagal". */
export function renderPlacementLimitReached(
  container: HTMLElement,
  level: string | undefined,
  onHome: OnDone,
  onViewMap: OnDone
): void {
  container.innerHTML = `
    <div style="text-align:center">
      <span class="stage-badge">🎈 SUDAH DICOBA</span>
      <h2 class="h2" style="margin:12px 0 6px">Keren, sudah eksplorasi 2 kali!</h2>
      <p class="lede" style="margin-bottom:16px">First Placement Test cuma bisa dicoba maksimal 2 kali — titik mulaimu sekarang:</p>
      <div style="font-size:48px;margin-bottom:6px">${level ? (LEVEL_LABEL[level]?.slice(0, 2) ?? '🌱') : '🌱'}</div>
      <h2 class="h2" style="margin-bottom:22px">${level ? (LEVEL_LABEL[level] ?? level) : '—'}</h2>
      <button class="primary-btn" type="button" data-action="ptHome">Ke Beranda →</button>
      <button class="ghost-btn" type="button" data-action="ptViewMap">🗺️ Lihat di Peta Petualangan</button>
    </div>
  `;
  setHandlers({ ptHome: onHome, ptViewMap: onViewMap });
}

export interface PlacementOutcome {
  levelRecommended?: string;
  error?: string;
}

/** Layar transisi antar-ronde — tap-through (bukan auto-timeout, supaya
 *  tidak ada risiko lompat sebelum anak siap) + brain-break kecil (§6.3). */
function celebrateRound(container: HTMLElement, doneLabel: string, nextLabel: string, onNext: () => void): void {
  container.innerHTML = `
    <div style="text-align:center;padding:18px 0">
      <div style="font-size:44px;margin-bottom:10px">🌟</div>
      <div class="id-text" style="margin-bottom:4px">${doneLabel} beres!</div>
      <p class="meta" style="margin-bottom:20px">Lanjut ke ${nextLabel} yuk</p>
      <button class="primary-btn" type="button" data-action="ptNextRound">Lanjut →</button>
    </div>
  `;
  setHandlers({ ptNextRound: onNext });
}

function roundBadge(current: number, total: number, label: string): string {
  const dots = Array.from({ length: total }, (_, i) => `<span class="${i < current ? 'done' : ''}"></span>`).join('');
  return `<div class="pt-progress">${dots}</div><div class="id-text" style="text-align:center;margin-bottom:4px">Ronde ${current} dari ${total} · ${label}</div>`;
}

export function runPlacementQuestions(container: HTMLElement, onDone: (outcome: PlacementOutcome) => void): void {
  const answers: PlacementAnswer[] = [];
  const vocabItems = PLACEMENT_QUESTIONS.filter((q) => q.kind === 'vocab');
  const listeningItems = PLACEMENT_QUESTIONS.filter((q) => q.kind === 'listening');
  const speakingItems = PLACEMENT_QUESTIONS.filter((q) => q.kind === 'speakingRecognition');
  const openMicItem = PLACEMENT_OPENMIC_ITEMS[0];
  const TOTAL_ROUNDS = 4;

  function drawMcqStep(
    items: PlacementQuestion[],
    index: number,
    roundNum: number,
    roundLabel: string,
    onRoundDone: () => void
  ): void {
    if (index >= items.length) return onRoundDone();
    const q = items[index];
    const isListening = q.kind === 'listening';
    const isSpeaking = q.kind === 'speakingRecognition';

    container.innerHTML = `
      ${roundBadge(roundNum, TOTAL_ROUNDS, roundLabel)}
      <div class="speak-row"><button class="speak-btn" data-action="ptReplay">🔊 Dengar Lagi</button></div>
      <div class="opt-grid ${q.options.length > 2 ? 'three' : ''}">
        ${q.options
          .map(
            (o, i) =>
              `<button class="opt-btn" type="button" data-action="ptPick" data-payload="${i}">${o.emoji}${o.label ? `<span class="lbl">${o.label}</span>` : ''}</button>`
          )
          .join('')}
      </div>
    `;

    // playPrompt() dibungkus try/catch dan handler DIPASANG DULU sebelum
    // audio diputar — kalau TTS gagal/throw (edge-case browser tertentu),
    // tap target tetap hidup, bukan layar mati (CLAUDE.md poin 4: tanpa
    // layar dead-end).
    function playPrompt(): void {
      try {
        if (isListening) {
          speakSequence([...(q.story ?? []), q.question ?? '']);
        } else if (isSpeaking) {
          speakSequence([q.question ?? '', ...q.options.map((o) => o.label ?? '')]);
        } else {
          speak(q.word ?? '');
        }
      } catch {
        /* diabaikan dengan sengaja — anak masih bisa tap tanpa audio */
      }
    }

    setHandlers({
      ptReplay: () => playPrompt(),
      ptPick: (payload) => {
        const i = Number(payload);
        answers.push({ questionId: q.id, chosenEmoji: q.options[i].emoji });
        drawMcqStep(items, index + 1, roundNum, roundLabel, onRoundDone);
      },
    });

    playPrompt();
  }

  function drawOpenMic(): void {
    if (!openMicItem) {
      void finish();
      return;
    }
    container.innerHTML = `
      ${roundBadge(4, TOTAL_ROUNDS, '🗣️ Speaking')}
      <div class="id-text" style="text-align:center;margin-bottom:6px">Satu lagi — coba ucapkan, ya!</div>
      <div class="en-text" style="text-align:center">"${openMicItem.phrase}"</div>
      <div class="speak-row"><button class="speak-btn" data-action="ptReplay">🔊 Dengar Contoh</button></div>
      <div class="mic-wrap">
        <button class="mic-btn" id="micBtn" type="button" data-action="ptMic">🎤</button>
        <div class="mic-hint">${sttSupported ? 'Tap mic, lalu ucapkan kalimatnya' : 'Mikrofon tidak didukung browser ini'}</div>
      </div>
      <div class="heard-text" id="heard"></div>
      <div class="feedback" id="fb"></div>
      ${sttSupported ? '' : `<button class="ghost-btn" type="button" data-action="ptMicSkip">✅ Aku Sudah Coba Ucapkan</button>`}
    `;

    function safeSpeak(): void {
      try {
        speak(openMicItem.phrase);
      } catch {
        /* diabaikan dengan sengaja — mic tetap bisa dipakai tanpa audio contoh */
      }
    }

    setHandlers({
      ptReplay: () => safeSpeak(),
      ptMicSkip: () => void finish(),
      ptMic: () => {
        const btn = container.querySelector<HTMLElement>('#micBtn')!;
        btn.classList.add('listening');
        listenOnce(
          (said, confidence) => {
            btn.classList.remove('listening');
            container.querySelector<HTMLElement>('#heard')!.textContent = `Kamu bilang: "${said}"`;
            const fb = container.querySelector<HTMLElement>('#fb')!;
            // Selalu positif ke anak (PRD §13.1) — matched/confidence tetap
            // dievaluasi & dikirim sebagai sinyal internal, bukan gerbang.
            fb.textContent = 'Keren banget! 🎉';
            fb.className = 'feedback good';
            answers.push({
              kind: 'openmic',
              questionId: openMicItem.id,
              matched: looseMatch(said, openMicItem.phrase),
              confidence: Number.isFinite(confidence) ? confidence : 0,
            });
            setTimeout(finish, 900);
          },
          () => {
            btn.classList.remove('listening');
            container.querySelector<HTMLElement>('#fb')!.textContent = 'Belum kedengaran, coba lagi 🎧';
          }
        );
      },
    });

    safeSpeak();
  }

  async function finish(): Promise<void> {
    container.innerHTML = `<p class="lede">Menyimpan hasil…</p>`;
    try {
      const result = await submitPlacementTest(answers);
      onDone({ levelRecommended: result.levelRecommended });
    } catch (err) {
      onDone({ error: err instanceof ApiRequestError ? err.message : 'Gagal menyimpan, coba lagi.' });
    }
  }

  // Ronde 1 → 2 → 3 → 4, dengan layar perayaan kecil di antaranya (§6.3).
  drawMcqStep(vocabItems, 0, 1, '📚 Vocab', () =>
    celebrateRound(container, '📚 Vocab', '🎧 Listening', () =>
      drawMcqStep(listeningItems, 0, 2, '🎧 Listening', () =>
        celebrateRound(container, '🎧 Listening', '🗣️ Speaking', () =>
          drawMcqStep(speakingItems, 0, 3, '🗣️ Speaking', () =>
            celebrateRound(container, '🗣️ Speaking (pilihan)', '🗣️ Speaking (ucapkan)', () => drawOpenMic())
          )
        )
      )
    )
  );
}

/** Entry point ke Peta Petualangan (permintaan user) — begitu anak tahu
 *  levelnya, langsung bisa lihat posisinya di peta, bukan cuma nama level
 *  polos. Peta Level yang render (`renderLevels`) sudah otomatis nyorot
 *  "Kamu di sini" di level itu — tidak perlu diteruskan manual dari sini. */
export function renderPlacementResult(
  container: HTMLElement,
  levelRecommended: string,
  onContinue: OnDone,
  onViewMap: OnDone
): void {
  container.innerHTML = `
    <div style="text-align:center">
      <span class="stage-badge">🎉 SELESAI</span>
      <h2 class="h2" style="margin:12px 0 6px">Keren, sudah dicoba semua!</h2>
      <p class="lede" style="margin-bottom:16px">Titik mulai yang pas buat kamu:</p>
      <div style="font-size:48px;margin-bottom:6px">${LEVEL_LABEL[levelRecommended]?.slice(0, 2) ?? '🌱'}</div>
      <h2 class="h2" style="margin-bottom:22px">${LEVEL_LABEL[levelRecommended] ?? levelRecommended}</h2>
      <button class="primary-btn" type="button" data-action="ptContinue">Lanjut →</button>
      <button class="ghost-btn" type="button" data-action="ptViewMap">🗺️ Lihat di Peta Petualangan</button>
    </div>
  `;
  setHandlers({ ptContinue: onContinue, ptViewMap: onViewMap });
}

export async function doSkipPlacementTest(): Promise<PlacementOutcome> {
  try {
    const result = await skipPlacementTest();
    return { levelRecommended: result.level };
  } catch (err) {
    return { error: err instanceof ApiRequestError ? err.message : 'Gagal menyimpan, coba lagi.' };
  }
}
