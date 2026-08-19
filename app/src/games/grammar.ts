import type { GrammarFill, GrammarScramble, GrammarTopic, OnDone } from '../types';
import { setHandlers } from '../interaction';
import { speak } from '../speech';
import { shuffle } from '../util';

export function renderKenalan(container: HTMLElement, topic: GrammarTopic, onNext: OnDone): void {
  container.innerHTML = `
    <span class="stage-badge">👀 KENALAN</span>
    <div class="id-text" style="margin-bottom:10px;">Perhatikan polanya lewat contoh (bukan rumus!)</div>
    <div class="primer-list">
      ${topic.examples
        .map(
          (ex, i) => `
        <div class="primer-item">
          <div style="font-size:26px">${ex.emoji}</div>
          <div class="txt"><b>${ex.en}</b></div>
          <div class="mini-play" data-action="play" data-payload="${i}">🔊</div>
        </div>`
        )
        .join('')}
    </div>
    <button class="primary-btn" data-action="advance">Lanjut ke Latihan Inti →</button>
  `;
  setHandlers({
    play: (payload) => speak(topic.examples[Number(payload)].en),
    advance: () => onNext(),
  });
}

export function runLatihanInti(container: HTMLElement, topic: GrammarTopic, onDone: OnDone): void {
  let round = 0;
  let answer: { w: string; idx: number }[] = [];
  let bank: { w: string; used: boolean; idx: number }[] = [];

  function setup(sc: GrammarScramble): void {
    answer = [];
    bank = shuffle(sc.target.map((w, i) => ({ w, used: false, idx: i })));
  }

  function draw(): void {
    if (round >= topic.scramble.length) return onDone();
    setup(topic.scramble[round]);
    paint(topic.scramble[round]);
  }

  function paint(sc: GrammarScramble): void {
    container.innerHTML = `
      <span class="stage-badge">🎯 LATIHAN INTI · Susun Kalimat</span>
      <div class="id-text">Soal ${round + 1} dari ${topic.scramble.length}</div>
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
        setup(sc);
        paint(sc);
      },
      pick: (payload) => {
        const bi = Number(payload);
        if (bank[bi].used) return;
        bank[bi].used = true;
        answer.push(bank[bi]);
        paint(sc);
      },
      unpick: (payload) => {
        const ai = Number(payload);
        const item = answer[ai];
        answer.splice(ai, 1);
        bank.find((b) => b.idx === item.idx)!.used = false;
        paint(sc);
      },
      check: () => {
        const fb = container.querySelector<HTMLElement>('#fb')!;
        const built = answer.map((a) => a.w).join(' ');
        if (built === sc.target.join(' ')) {
          fb.textContent = 'Kalimatnya pas! 🎉';
          fb.className = 'feedback good';
          speak(built);
          round += 1;
          setTimeout(draw, 1000);
        } else {
          fb.textContent = 'Urutannya belum pas, coba atur lagi 💪';
          fb.className = 'feedback bad';
        }
      },
    });
  }

  draw();
}

export function runTantangan(container: HTMLElement, topic: GrammarTopic, onDone: OnDone): void {
  const fill: GrammarFill = topic.fill;
  container.innerHTML = `
    <span class="stage-badge">🌟 TANTANGAN · Bikin Sendiri</span>
    <div class="id-text">Lengkapi kalimat ini jadi ceritamu sendiri</div>
    <div class="en-text" id="sentencePreview">${fill.before.join(' ')} ___ ${fill.after.join(' ')}</div>
    <div class="opt-grid three" style="margin-top:16px;">
      ${fill.options
        .map((o, i) => `<button class="opt-btn" data-action="pick" data-payload="${i}">${o.emoji}<span class="lbl">${o.word}</span></button>`)
        .join('')}
    </div>
    <div class="feedback" id="fb"></div>
  `;

  setHandlers({
    pick: (payload) => {
      const i = Number(payload);
      const o = fill.options[i];
      const sentence = [...fill.before, o.word, ...fill.after].join(' ');
      container.querySelector<HTMLElement>('#sentencePreview')!.textContent = sentence + '.';
      container.querySelectorAll<HTMLElement>('.opt-btn').forEach((b) => b.classList.remove('correct'));
      container.querySelectorAll<HTMLElement>('.opt-btn')[i].classList.add('correct');
      const fb = container.querySelector<HTMLElement>('#fb')!;
      fb.textContent = 'Keren, itu kalimatmu sendiri! 🎉';
      fb.className = 'feedback good';
      speak(sentence);
      setTimeout(onDone, 1400);
    },
  });
}
