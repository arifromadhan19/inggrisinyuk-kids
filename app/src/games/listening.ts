import type { ListeningTopic, OnDone } from '../types';
import { setHandlers } from '../interaction';
import { recordAttempt } from '../progress';
import { speak, speakSequence } from '../speech';

export function renderKenalan(container: HTMLElement, topic: ListeningTopic, onNext: OnDone): void {
  container.innerHTML = `
    <span class="stage-badge">👀 KENALAN</span>
    <div class="big-emoji">${topic.scene}</div>
    <div class="id-text" style="margin-bottom:10px;">Dengar dulu contoh kalimatnya</div>
    <div class="primer-list">
      ${topic.primer
        .map(
          (p, i) => `
        <div class="primer-item">
          <div class="txt"><b>${p.en}</b><span>${p.id}</span></div>
          <div class="mini-play" data-action="play" data-payload="${i}">🔊</div>
        </div>`
        )
        .join('')}
    </div>
    <button class="primary-btn" data-action="advance">Lanjut ke Latihan Inti →</button>
  `;
  setHandlers({
    play: (payload) => speak(topic.primer[Number(payload)].en),
    advance: () => onNext(),
  });
}

export function runLatihanInti(container: HTMLElement, topic: ListeningTopic, onDone: OnDone): void {
  let round = 0;

  function draw(): void {
    if (round >= topic.drill.length) return onDone();
    const d = topic.drill[round];
    container.innerHTML = `
      <span class="stage-badge">🎯 LATIHAN INTI · Dengar &amp; Pilih</span>
      <div class="id-text">Soal ${round + 1} dari ${topic.drill.length}</div>
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
          round += 1;
          setTimeout(draw, 800);
        } else {
          recordAttempt(false);
          btn.classList.add('wrong');
          fb.textContent = 'Dengar lagi, yuk 💪';
          fb.className = 'feedback bad';
          setTimeout(() => btn.classList.remove('wrong'), 350);
        }
      },
    });
  }

  draw();
}

export function runTantangan(container: HTMLElement, topic: ListeningTopic, onDone: OnDone): void {
  container.innerHTML = `
    <span class="stage-badge">🌟 TANTANGAN · Dengar Cerita Mini</span>
    <div class="big-emoji">${topic.scene}</div>
    <div class="speak-row"><button class="speak-btn" data-action="playStory">▶️ Putar Ceritanya</button></div>
    <div class="id-text" id="qArea" style="margin-top:6px;">Putar dulu ceritanya, baru jawab pertanyaannya</div>
    <div id="qWrap"></div>
    <div class="feedback" id="fb"></div>
  `;

  setHandlers({
    playStory: () => {
      speakSequence(topic.story, 1900);
      container.querySelector<HTMLElement>('#qArea')!.textContent = '';
      container.querySelector<HTMLElement>('#qWrap')!.innerHTML = `
        <div class="en-text" style="margin-top:10px;">${topic.question.en}</div>
        <div class="opt-grid ${topic.question.opts.length > 2 ? 'three' : ''}">
          ${topic.question.opts
            .map(
              (o, i) =>
                `<button class="opt-btn" data-action="answer" data-payload="${i}">${o.emoji}<span class="lbl">${o.lbl ?? ''}</span></button>`
            )
            .join('')}
        </div>
      `;
      setHandlers({
        answer: (payload) => {
          const i = Number(payload);
          const btn = container.querySelectorAll<HTMLElement>('#qWrap .opt-btn')[i];
          const fb = container.querySelector<HTMLElement>('#fb')!;
          if (topic.question.opts[i].ok) {
            recordAttempt(true);
            btn.classList.add('correct');
            fb.textContent = 'Ceritanya kedengeran ya! 🎉';
            fb.className = 'feedback good';
            setTimeout(onDone, 900);
          } else {
            recordAttempt(false);
            btn.classList.add('wrong');
            fb.textContent = 'Coba putar & dengar lagi 💪';
            fb.className = 'feedback bad';
            setTimeout(() => btn.classList.remove('wrong'), 350);
          }
        },
      });
    },
  });
}
