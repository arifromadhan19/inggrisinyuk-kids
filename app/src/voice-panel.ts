import { setHandlers } from './interaction';
import {
  SPEEDS,
  VoiceAccent,
  VoiceGender,
  getPlaybackRate,
  getVoiceAccent,
  getVoiceGender,
  onVoicesChanged,
  setPlaybackRate,
  setVoiceAccent,
  setVoiceGender,
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

/** Panel kecepatan bicara & suara TTS — dipasang di tiap layar yang punya tombol 🔊. */
export function renderVoicePanel(container: HTMLElement): void {
  if (!ttsSupported) {
    container.innerHTML = '';
    return;
  }
  paint(container);
  onVoicesChanged(() => paint(container));
}

function paint(container: HTMLElement): void {
  const rate = getPlaybackRate();
  const gender = getVoiceGender();
  const accent = getVoiceAccent();

  container.innerHTML = `
    <div class="voice-panel">
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
    </div>
  `;

  setHandlers({
    setSpeed: (payload) => {
      setPlaybackRate(Number(payload));
      paint(container);
    },
    setGender: (payload) => {
      setVoiceGender(payload as VoiceGender);
      paint(container);
    },
    setAccent: (payload) => {
      setVoiceAccent(payload as VoiceAccent);
      paint(container);
    },
  });
}
