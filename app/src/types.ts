export interface VocabExample {
  en: string;
  id: string;
  emoji: string;
}

export interface VocabItem {
  en: string;
  id: string;
  emoji: string;
  example: VocabExample;
}

export interface VocabTopic {
  id: string;
  title: string;
  desc: string;
  items: VocabItem[];
}

export interface ListeningOption {
  emoji: string;
  ok?: boolean;
  lbl?: string;
}

export interface ListeningDrill {
  en: string;
  opts: ListeningOption[];
}

export interface ListeningTopic {
  id: string;
  title: string;
  scene: string;
  desc: string;
  primer: { en: string; id: string }[];
  drill: ListeningDrill[];
  story: string[];
  question: { en: string; opts: ListeningOption[] };
}

export interface SpeakingTopic {
  id: string;
  title: string;
  desc: string;
  model: string[];
  drill: string[];
  roleplay: string[];
}

export interface GrammarExample {
  en: string;
  emoji: string;
}

export interface GrammarScramble {
  emoji: string;
  target: string[];
}

export interface GrammarFillOption {
  word: string;
  emoji: string;
}

export interface GrammarFill {
  before: string[];
  after: string[];
  options: GrammarFillOption[];
}

export interface GrammarTopic {
  id: string;
  title: string;
  desc: string;
  examples: GrammarExample[];
  scramble: GrammarScramble[];
  fill: GrammarFill;
}

export type SkillKey = 'vocabulary' | 'listening' | 'speaking' | 'grammar';

export interface SkillMeta {
  label: string;
  emoji: string;
  tagline: string;
  /** Nama mini-game nyata di dalam skill ini — dipakai sebagai preview di kartu. */
  activities: string[];
  accent: string;
  accentBg: string;
}

/** 6 level di tangga PRD §3 — Little Stars, Starter, Explorer, Adventurer, Achiever, Trailblazer. */
export type LevelKey = 'little-stars' | 'starter' | 'explorer' | 'adventurer' | 'achiever' | 'trailblazer';

/** Satu entri di tangga level. `hasContent` membedakan level yang sudah punya
 *  materi nyata (v1: cuma Explorer) dari yang masih placeholder di Peta Level —
 *  dipakai supaya map tidak pernah menampilkan tombol ke materi yang belum ada. */
export interface LevelMeta {
  key: LevelKey;
  name: string;
  emoji: string;
  /** '' untuk Little Stars — sengaja tanpa badge CEFR (PRD §7). */
  cefr: string;
  age: string;
  hasContent: boolean;
}

export type Screen =
  | 'home'
  | 'menu'
  | 'topics'
  | 'activity'
  | 'settings'
  | 'levels'
  | 'boss'
  | 'game'
  | 'account'
  | 'placementTest';

/** Tujuan navigasi yang benar-benar ada di app (rail desktop & tab bar mobile). */
export type NavKey = 'home' | 'belajar' | 'game' | 'settings';

export interface AppState {
  screen: Screen;
  skillKey: SkillKey | null;
  topicIndex: number;
  step: number;
  /** Level yang lagi dicoba di layar Tantangan Bos (screen 'boss'). */
  bossLevel: LevelKey | null;
}

/** Handler dipanggil dari klik yang didelegasikan lewat data-action/data-payload. */
export type ActionHandler = (payload: string | undefined) => void;
export type ActionMap = Record<string, ActionHandler>;

/** Setiap mini-game punya sinyal "selesai" yang sama ke shell (nextStep/onDone). */
export type OnDone = () => void;
