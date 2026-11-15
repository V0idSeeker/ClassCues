import type { LogEntry } from './ai/provider';
import type { Scores } from './game/course';
import type { ClassMemory } from './game/lesson';
import type { Chapter, Difficulty, LessonState } from './game/types';
import { detectLang, t } from './i18n';
import type { Lang } from './i18n';

export interface Settings {
  baseUrl: string;
  apiKey: string;
  studentModel: string;
  graderModel: string;
  thinkingOff: boolean;
  rememberKey: boolean;
  /** Requests per day on a free model. 0 means no limit. */
  dailyLimit: number;
  debugLog: boolean;
  /** Students speak aloud with the browser's voices. */
  voiceOn: boolean;
  /** The player says the model reads pictures. For local or unlisted models, where the game cannot tell. */
  forceVision: boolean;
  /** How hard the class is: Normal is the game as designed. */
  difficulty: Difficulty;
  /** Interface language, also the language students speak. */
  language: Lang;
}

export const PRESETS: Record<string, { label: string; baseUrl: string; setup: string }> = {
  openrouter: { label: 'OpenRouter', baseUrl: 'https://openrouter.ai/api/v1/chat/completions', get setup() { return t('preset.openrouter'); } },
  gemini: { label: 'Google Gemini', baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions', get setup() { return t('preset.gemini'); } },
  groq: { label: 'Groq', baseUrl: 'https://api.groq.com/openai/v1/chat/completions', get setup() { return t('preset.groq'); } },
  ollama: { get label() { return t('preset.local', { name: 'Ollama' }); }, baseUrl: 'http://127.0.0.1:11434/v1/chat/completions', get setup() { return t('preset.ollama'); } },
  lmstudio: { get label() { return t('preset.local', { name: 'LM Studio' }); }, baseUrl: 'http://127.0.0.1:1234/v1/chat/completions', get setup() { return t('preset.lmstudio'); } },
  llamacpp: { get label() { return t('preset.local', { name: 'llama.cpp' }); }, baseUrl: 'http://127.0.0.1:8080/v1/chat/completions', get setup() { return t('preset.llamacpp'); } },
};

const DEFAULTS: Settings = {
  baseUrl: PRESETS.openrouter.baseUrl, apiKey: '', studentModel: '', graderModel: '',
  thinkingOff: true, rememberKey: true, dailyLimit: 0, debugLog: false, voiceOn: true, forceVision: false, difficulty: 'normal',
  language: detectLang(),
};

const K = { settings: 'ts.settings', key: 'ts.key', used: 'ts.used', lesson: 'ts.lesson6', art: 'ts.art', memory: 'ts.memory', scores: 'ts.scores', levels: 'ts.levels' };

/** True once the player has saved settings at least once. */
export const hasSettings = (): boolean => localStorage.getItem(K.settings) !== null;

// ponytail: levels live in localStorage (a level is a few KB, so hundreds fit). Move to IndexedDB if players hit the 5 MB limit.
export function loadLevels(): Chapter[] {
  return read<Chapter[]>(localStorage, K.levels) ?? [];
}

export function saveLevels(levels: Chapter[]): void {
  localStorage.setItem(K.levels, JSON.stringify(levels));
}

function read<T>(store: Storage, key: string): T | null {
  try {
    const raw = store.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export function loadSettings(): Settings {
  const saved = read<Partial<Settings>>(localStorage, K.settings) ?? {};
  const apiKey = localStorage.getItem(K.key) ?? sessionStorage.getItem(K.key) ?? '';
  return { ...DEFAULTS, ...saved, apiKey };
}

/** The key is stored apart from the other settings, and only on this device if the player asks. */
export function saveSettings(s: Settings): void {
  const { apiKey, ...rest } = s;
  localStorage.setItem(K.settings, JSON.stringify(rest));
  localStorage.removeItem(K.key);
  sessionStorage.removeItem(K.key);
  if (apiKey) (s.rememberKey ? localStorage : sessionStorage).setItem(K.key, apiKey);
}

const today = () => new Date().toISOString().slice(0, 10);

export function loadUsed(): number {
  const saved = read<{ day: string; used: number }>(localStorage, K.used);
  return saved && saved.day === today() ? saved.used : 0;
}

export function bumpUsed(): number {
  const used = loadUsed() + 1;
  localStorage.setItem(K.used, JSON.stringify({ day: today(), used }));
  return used;
}

/** Saves the lesson with the time already spent, so the clock continues correctly after a reload. */
export function saveLesson(state: LessonState, now: number): void {
  localStorage.setItem(K.lesson, JSON.stringify({ state, elapsed: now - state.startedAt }));
}

export function loadLesson(now: number): LessonState | null {
  const saved = read<{ state: LessonState; elapsed: number }>(localStorage, K.lesson);
  return saved ? { ...saved.state, timeline: saved.state.timeline ?? [], startedAt: now - saved.elapsed } : null;
}

/** The automatically chosen model that last answered for this provider address. */
export function loadGoodModel(baseUrl: string): string {
  return localStorage.getItem(`ts.good.${baseUrl}`) ?? '';
}

export function saveGoodModel(baseUrl: string, model: string): void {
  localStorage.setItem(`ts.good.${baseUrl}`, model);
}

/** Best and last class average for every lesson taught. */
export function loadScores(): Scores {
  return read<Scores>(localStorage, K.scores) ?? {};
}

export function saveScores(scores: Scores): void {
  localStorage.setItem(K.scores, JSON.stringify(scores));
}

/** Tips already shown during lessons, and whether tips are wanted at all. */
export function loadTips(): { off: boolean; seen: string[] } {
  return read<{ off: boolean; seen: string[] }>(localStorage, 'ts.tips') ?? { off: false, seen: [] };
}

export function saveTips(tips: { off: boolean; seen: string[] }): void {
  localStorage.setItem('ts.tips', JSON.stringify(tips));
}

/** True once the player has opened the guide. */
export const helpSeen = (): boolean => localStorage.getItem('ts.helpSeen') !== null;
export const markHelpSeen = (): void => localStorage.setItem('ts.helpSeen', '1');

/** What students remember from past lessons. */
export function loadMemory(): ClassMemory {
  return read<ClassMemory>(localStorage, K.memory) ?? {};
}

export function saveMemory(memory: ClassMemory): void {
  localStorage.setItem(K.memory, JSON.stringify(memory));
}

export function clearMemory(): void {
  localStorage.removeItem(K.memory);
}

export function clearLesson(): void {
  localStorage.removeItem(K.lesson);
  localStorage.removeItem(K.art);
}

/** The pictures drawn on the boards of the running lesson, one per board (null: none). */
export function loadArt(): (string | null)[] {
  return read<(string | null)[]>(localStorage, K.art) ?? [];
}

/** Pictures are large. If the browser's storage is full they are simply not kept across a reload; the lesson goes on. */
export function saveArt(art: (string | null)[]): void {
  try {
    localStorage.setItem(K.art, JSON.stringify(art));
  } catch {
    localStorage.removeItem(K.art);
  }
}

const log: LogEntry[] = [];

export function addLog(e: LogEntry): void {
  log.push(e);
  if (log.length > 200) log.shift();
}

export function logText(): string {
  return JSON.stringify(log, null, 2);
}

/** True when the player chose to go straight from Teach to the classroom, without the study screen. */
export function loadSkipPrepare(): boolean {
  return read<boolean>(localStorage, 'ts.skipPrepare') ?? false;
}

export function saveSkipPrepare(skip: boolean): void {
  try {
    localStorage.setItem('ts.skipPrepare', JSON.stringify(skip));
  } catch { /* storage unavailable: the choice lasts for this visit only */ }
}
