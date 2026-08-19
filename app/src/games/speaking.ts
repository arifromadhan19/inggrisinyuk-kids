import type { OnDone, SpeakingTopic } from '../types';
import { setHandlers } from '../interaction';
import { listenOnce, looseMatch, speak, sttSupported } from '../speech';

export function renderKenalan(container: HTMLElement, topic: SpeakingTopic, onNext: OnDone): void {
  container.innerHTML = `
    <span class="stage-badge">👀 KENALAN</span>
    <div class="id-text" style="margin-bottom:10px;">Dengarkan cara mengucapkannya dulu, ya!</div>
    <div class="primer-list">
      ${topic.model
        .map(
          (m, i) => `
        <div class="primer-item">
          <div class="txt"><b>${m}</b></div>
          <div class="mini-play" data-action="play" data-payload="${i}">🔊</div>
        </div>`
        )
        .join('')}
    </div>
    <button class="primary-btn" data-action="advance">Lanjut ke Latihan Inti →</button>
  `;
  setHandlers({
    play: (payload) => speak(topic.model[Number(payload)]),
    advance: () => onNext(),
  });
}

export function runLatihanInti(container: HTMLElement, topic: SpeakingTopic, onDone: OnDone): void {
  let round = 0;

  function draw(): void {
    if (round >= topic.drill.length) return onDone();
    const phrase = topic.drill[round];
    container.innerHTML = `
      <span class="stage-badge">🎯 LATIHAN INTI · Ucapkan &amp; Cek</span>
      <div class="id-text">Soal ${round + 1} dari ${topic.drill.length}</div>
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
      skip: () => {
        round += 1;
        draw();
      },
      mic: () => {
        const btn = container.querySelector<HTMLElement>('#micBtn')!;
        btn.classList.add('listening');
        listenOnce(
          (said) => {
            btn.classList.remove('listening');
            container.querySelector<HTMLElement>('#heard')!.textContent = `Kamu bilang: "${said}"`;
            const fb = container.querySelector<HTMLElement>('#fb')!;
            if (looseMatch(said, phrase)) {
              fb.textContent = 'Keren banget! 🎉';
              fb.className = 'feedback good';
              round += 1;
              setTimeout(draw, 900);
            } else {
              fb.textContent = 'Hampir! Coba sekali lagi 💪';
              fb.className = 'feedback bad';
            }
          },
          () => {
            btn.classList.remove('listening');
            container.querySelector<HTMLElement>('#fb')!.textContent = 'Belum kedengaran, coba lagi 🎧';
          }
        );
      },
    });
  }

  draw();
}

export function runTantangan(container: HTMLElement, topic: SpeakingTopic, onDone: OnDone): void {
  let turn = 0;

  function draw(): void {
    if (turn >= topic.roleplay.length) return onDone();
    const q = topic.roleplay[turn];
    container.innerHTML = `
      <span class="stage-badge">🌟 TANTANGAN · Mini-Roleplay</span>
      <div class="turn-dots">${topic.roleplay.map((_, i) => `<div class="turn-dot ${i <= turn ? 'on' : ''}"></div>`).join('')}</div>
      <div class="id-text">Giliran ${turn + 1} dari ${topic.roleplay.length}</div>
      <div class="en-text">🦁 "${q}"</div>
      <div class="speak-row"><button class="speak-btn" data-action="replay">🔊 Dengar Lagi</button></div>
      <div class="mic-wrap">
        <button class="mic-btn" id="micBtn" data-action="mic">🎤</button>
        <div class="mic-hint">${sttSupported ? 'Tap mic, jawab pertanyaannya bebas' : 'Mikrofon tidak didukung browser ini'}</div>
      </div>
      <div class="heard-text" id="heard"></div>
      <div class="feedback" id="fb"></div>
      ${sttSupported ? '' : `<button class="ghost-btn" data-action="skip">✅ Aku Sudah Jawab</button>`}
    `;
    speak(q);

    setHandlers({
      replay: () => speak(q),
      skip: () => {
        turn += 1;
        draw();
      },
      mic: () => {
        const btn = container.querySelector<HTMLElement>('#micBtn')!;
        btn.classList.add('listening');
        listenOnce(
          (said) => {
            btn.classList.remove('listening');
            container.querySelector<HTMLElement>('#heard')!.textContent = `Kamu jawab: "${said}"`;
            const fb = container.querySelector<HTMLElement>('#fb')!;
            fb.textContent = 'Bagus, sudah berani jawab! 🎉';
            fb.className = 'feedback good';
            turn += 1;
            setTimeout(draw, 1000);
          },
          () => {
            btn.classList.remove('listening');
            container.querySelector<HTMLElement>('#fb')!.textContent = 'Belum kedengaran, coba lagi 🎧';
          }
        );
      },
    });
  }

  draw();
}
