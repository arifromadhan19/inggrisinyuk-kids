import { setHandlers } from './interaction';
import {
  SPEEDS,
  VoiceAccent,
  VoiceGender,
  getPlaybackRate,
  getVoiceAccent,
  getIndonesianPlaybackRate,
  getIndonesianVoiceGender,
  getVoiceGender,
  onVoicesChanged,
  setIndonesianPlaybackRate,
  setIndonesianVoiceGender,
  setPlaybackRate,
  setVoiceAccent,
  setVoiceGender,
  speakLocalized,
  ttsSupported,
} from './speech';

const GENDER_OPTIONS: { key: VoiceGender; label: string; icon: string }[] = [
  { key: 'female', label: 'Wanita', icon: '👩' },
  { key: 'male', label: 'Pria', icon: '👨' },
];

const ACCENT_OPTIONS: { key: VoiceAccent; label: string }[] = [
  { key: 'us', label: '🇺🇸 US' },
  { key: 'uk', label: '🇬🇧 UK' },
];

/** Panel kecepatan bicara & suara TTS — dipasang di tiap layar yang punya tombol 🔊.
 *  `withIndonesian` (khusus halaman Pengaturan) menambah baris suara Indonesia. */
export function renderVoicePanel(container: HTMLElement, opts: { withIndonesian?: boolean } = {}): void {
  if (!ttsSupported) {
    container.innerHTML = '';
    return;
  }
  paint(container, opts);
  onVoicesChanged(() => paint(container, opts));
}

function paint(container: HTMLElement, opts: { withIndonesian?: boolean }): void {
  const rate = getPlaybackRate();
  const gender = getVoiceGender();
  const accent = getVoiceAccent();
  const idGender = getIndonesianVoiceGender();
  const idRate = getIndonesianPlaybackRate();
  const withId = !!opts.withIndonesian;

  container.innerHTML = `
    <div class="voice-panel">
      ${withId ? '<div class="voice-panel-group">Bahasa Inggris</div>' : ''}
      <div class="voice-panel-row">
        <span class="voice-panel-label">🔊 Kecepatan</span>
        <div class="voice-panel-pills">
          ${SPEEDS.map(
            (s) =>
              `<button class="pill-btn ${s === rate ? 'active' : ''}" data-action="setSpeed" data-payload="${s}">${s}x</button>`
          ).join('')}
        </div>
      </div>
      <div class="voice-panel-row">
        <span class="voice-panel-label">🗣️ Suara</span>
        <div class="voice-panel-pills">
          ${GENDER_OPTIONS.map(
            (g) =>
              `<button class="pill-btn ${gender === g.key ? 'active' : ''}" data-action="setGender" data-payload="${g.key}">${g.icon} ${g.label}</button>`
          ).join('')}
        </div>
        <div class="voice-panel-pills">
          ${ACCENT_OPTIONS.map(
            (a) =>
              `<button class="pill-btn ${accent === a.key ? 'active' : ''}" data-action="setAccent" data-payload="${a.key}">${a.label}</button>`
          ).join('')}
        </div>
      </div>
      ${withId ? `
      <div class="voice-panel-group">Bahasa Indonesia</div>
      <div class="voice-panel-row">
        <span class="voice-panel-label">🔊 Kecepatan</span>
        <div class="voice-panel-pills">
          ${SPEEDS.map(
            (s) =>
              `<button class="pill-btn ${s === idRate ? 'active' : ''}" data-action="setIdSpeed" data-payload="${s}">${s}x</button>`
          ).join('')}
        </div>
      </div>
      <div class="voice-panel-row">
        <span class="voice-panel-label">🗣️ Suara</span>
        <div class="voice-panel-pills">
          ${GENDER_OPTIONS.map(
            (g) =>
              `<button class="pill-btn ${idGender === g.key ? 'active' : ''}" data-action="setIdGender" data-payload="${g.key}">${g.icon} ${g.label}</button>`
          ).join('')}
        </div>
      </div>` : ''}
    </div>
  `;

  setHandlers({
    setSpeed: (payload) => {
      setPlaybackRate(Number(payload));
      paint(container, opts);
    },
    setGender: (payload) => {
      setVoiceGender(payload as VoiceGender);
      paint(container, opts);
    },
    setAccent: (payload) => {
      setVoiceAccent(payload as VoiceAccent);
      paint(container, opts);
    },
    setIdSpeed: (payload) => {
      setIndonesianPlaybackRate(Number(payload));
      speakLocalized('Halo! Ayo belajar bahasa Inggris.', 'id-ID');
      paint(container, opts);
    },
    setIdGender: (payload) => {
      setIndonesianVoiceGender(payload as VoiceGender);
      // Contoh langsung supaya ortu bisa dengar bedanya.
      speakLocalized('Halo! Ayo belajar bahasa Inggris.', 'id-ID');
      paint(container, opts);
    },
  });
}
