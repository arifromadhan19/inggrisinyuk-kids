import type { OnDone, VocabItem, VocabTopic } from '../types';
import { setHandlers } from '../interaction';
import { listenOnce, looseMatch, speak, sttSupported } from '../speech';
import { shuffle } from '../util';

export function renderKenalan(container: HTMLElement, topic: VocabTopic, onNext: OnDone): void {
  container.innerHTML = `
    <span class="stage-badge">👀 KENALAN</span>
    <div class="id-text" style="margin-bottom:10px;">Dengarkan kata-katanya dulu, tap 🔊 untuk mengulang</div>
    <div class="primer-list">
      ${topic.items
        .map(
          (it, i) => `
        <div class="primer-item">
          <div style="font-size:26px">${it.emoji}</div>
          <div class="txt"><b>${it.en}</b><span>${it.id}</span></div>
          <div class="mini-play" data-action="playWord" data-payload="${i}">🔊</div>
        </div>`
        )
        .join('')}
    </div>
    <button class="primary-btn" data-action="advance">Lanjut ke Latihan Inti →</button>
  `;
  setHandlers({
    playWord: (payload) => speak(topic.items[Number(payload)].en),
    advance: () => onNext(),
  });
}

export function runLatihanInti(container: HTMLElement, topic: VocabTopic, onDone: OnDone): void {
  const order = shuffle(topic.items);
  let round = 0;

  function draw(): void {
    if (round >= order.length) return onDone();
    const target = order[round];
    const distractors = shuffle(topic.items.filter((i) => i !== target)).slice(0, 3);
    const opts = shuffle([target, ...distractors]);

    container.innerHTML = `
      <span class="stage-badge">🎯 LATIHAN INTI · Tebak &amp; Cocokkan</span>
      <div class="id-text">Soal ${round + 1} dari ${order.length}</div>
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
          btn.classList.add('correct');
          fb.textContent = 'Betul! 🎉';
          fb.className = 'feedback good';
          round += 1;
          setTimeout(draw, 800);
        } else {
          btn.classList.add('wrong');
          fb.textContent = 'Coba lagi ya 💪';
          fb.className = 'feedback bad';
          setTimeout(() => btn.classList.remove('wrong'), 350);
        }
      },
    });
  }

  draw();
}

export function runTantangan(container: HTMLElement, topic: VocabTopic, onDone: OnDone): void {
  runEjaKata(container, topic.items, () => runContohPenggunaan(container, topic.items, onDone));
}

/** Bagian 1 dari Tantangan: eja kata lewat chip huruf acak. */
function runEjaKata(container: HTMLElement, items: VocabItem[], onDone: OnDone): void {
  let round = 0;
  let slots: (string | null)[] = [];
  let bank: { ch: string; used: boolean; idx: number }[] = [];

  function setup(it: VocabItem): void {
    slots = new Array(it.en.length).fill(null);
    bank = shuffle(
      it.en
        .toUpperCase()
        .split('')
        .map((ch, i) => ({ ch, used: false, idx: i }))
    );
  }

  function draw(): void {
    if (round >= items.length) return onDone();
    const it = items[round];
    setup(it);
    paint(it);
    speak(it.en);
  }

  function paint(it: VocabItem): void {
    container.innerHTML = `
      <span class="stage-badge">🌟 TANTANGAN · Eja Kata</span>
      <div class="id-text">Kata ${round + 1} dari ${items.length}</div>
      <div class="big-emoji">${it.emoji}</div>
      <div class="speak-row"><button class="speak-btn" data-action="replay">🔊 Dengar Kata</button></div>
      <div class="answer-row">
        ${slots
          .map((s) => (s ? `<span class="chip placed letter">${s}</span>` : `<span class="chip letter" style="opacity:.35">_</span>`))
          .join('')}
      </div>
      <div class="bank-row">
        ${bank
          .map((b, bi) => `<span class="chip letter ${b.used ? 'hidden' : ''}" data-action="pickLetter" data-payload="${bi}">${b.ch}</span>`)
          .join('')}
      </div>
      <div class="feedback" id="fb"></div>
      <button class="ghost-btn" data-action="clearLetters">🔄 Ulang Susunan</button>
    `;

    setHandlers({
      replay: () => speak(it.en),
      clearLetters: () => {
        setup(it);
        paint(it);
      },
      pickLetter: (payload) => {
        const bi = Number(payload);
        if (bank[bi].used) return;
        const emptyIndex = slots.findIndex((x) => x === null);
        if (emptyIndex === -1) return;
        slots[emptyIndex] = bank[bi].ch;
        bank[bi].used = true;
        paint(it);
        if (slots.every((x) => x !== null)) {
          const built = slots.join('');
          const fb = container.querySelector<HTMLElement>('#fb')!;
          if (built.toLowerCase() === it.en.toLowerCase()) {
            fb.textContent = 'Ejaannya benar! 🎉';
            fb.className = 'feedback good';
            round += 1;
            setTimeout(draw, 1000);
          } else {
            fb.textContent = 'Belum pas, coba susun ulang 💪';
            fb.className = 'feedback bad';
            setTimeout(() => {
              setup(it);
              paint(it);
            }, 900);
          }
        }
      },
    });
  }

  draw();
}

/** Bagian 2 dari Tantangan: kata dipakai dalam kalimat konteks — dengar+ucapkan lalu susun kata. */
function runContohPenggunaan(container: HTMLElement, items: VocabItem[], onDone: OnDone): void {
  let round = 0;
  let phase: 'ucap' | 'susun' = 'ucap';

  function draw(): void {
    if (round >= items.length) return onDone();
    const it = items[round];
    if (phase === 'ucap') drawUcap(it);
    else drawSusun(it);
  }

  function drawUcap(it: VocabItem): void {
    const ex = it.example;
    container.innerHTML = `
      <span class="stage-badge">🌟 TANTANGAN · Contoh Penggunaan</span>
      <div class="id-text">Kata "${it.en}" · ${round + 1} dari ${items.length}</div>
      <div class="big-emoji" style="font-size:40px;">${ex.emoji}</div>
      <div class="en-text">${ex.en}</div>
      <div class="id-text">${ex.id}</div>
      <div class="speak-row"><button class="speak-btn" data-action="replay">🔊 Dengar Contoh</button></div>
      <div class="mic-wrap">
        <button class="mic-btn" id="micBtn" data-action="mic">🎤</button>
        <div class="mic-hint">${sttSupported ? 'Tap mic, coba ucapkan kalimatnya' : 'Mikrofon tidak didukung browser ini'}</div>
      </div>
      <div class="heard-text" id="heard"></div>
      <div class="feedback" id="fb"></div>
      ${sttSupported ? '' : `<button class="ghost-btn" data-action="skip">✅ Aku Sudah Coba Ucapkan</button>`}
    `;

    setHandlers({
      replay: () => speak(ex.en),
      skip: () => {
        phase = 'susun';
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
            fb.textContent = looseMatch(said, ex.en) ? 'Pas banget! 🎉' : 'Bagus, sudah dicoba! Lanjut, yuk 👍';
            fb.className = 'feedback good';
            setTimeout(() => {
              phase = 'susun';
              draw();
            }, 900);
          },
          () => {
            btn.classList.remove('listening');
            container.querySelector<HTMLElement>('#fb')!.textContent = 'Belum kedengaran, coba lagi 🎧';
          }
        );
      },
    });
  }

  function drawSusun(it: VocabItem): void {
    const ex = it.example;
    const words = ex.en.replace('.', '').split(' ');
    let answer: { w: string; idx: number }[] = [];
    let bank = shuffle(words.map((w, i) => ({ w, used: false, idx: i })));

    function paint(): void {
      container.innerHTML = `
        <span class="stage-badge">🌟 TANTANGAN · Susun Kata</span>
        <div class="id-text">Susun jadi kalimat yang tadi kamu dengar</div>
        <div class="big-emoji" style="font-size:36px;">${ex.emoji}</div>
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
          bank = shuffle(words.map((w, i) => ({ w, used: false, idx: i })));
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
          if (built.toLowerCase() === words.join(' ').toLowerCase()) {
            fb.textContent = 'Kalimatnya pas! 🎉';
            fb.className = 'feedback good';
            speak(ex.en);
            round += 1;
            phase = 'ucap';
            setTimeout(draw, 1100);
          } else {
            fb.textContent = 'Coba atur lagi 💪';
            fb.className = 'feedback bad';
          }
        },
      });
    }

    paint();
  }

  draw();
}
