import type { LogEntry } from './ai/provider';
import type { ClassMemory } from './game/lesson';
import type { Chapter, LessonState } from './game/types';

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
}

export const PRESETS: Record<string, { label: string; baseUrl: string; setup: string }> = {
  openrouter: {
    label: 'OpenRouter',
    baseUrl: 'https://openrouter.ai/api/v1/chat/completions',
    setup: 'Create a key at openrouter.ai and paste it below. Leave the model empty to play on free models (about 50 requests a day, roughly one lesson), or pick one from the list: names ending in :free cost nothing, the others need credit on your OpenRouter account.',
  },
  gemini: {
    label: 'Google Gemini',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
    setup: 'Create a free key at aistudio.google.com ("Get API key") and paste it below. Leave the model empty to use a fast Flash model, or pick one from the list. The free tier allows many requests a day but only a few per minute: if you see "too many requests", wait a minute.',
  },
  ollama: {
    label: 'Ollama (local)',
    baseUrl: 'http://127.0.0.1:11434/v1/chat/completions',
    setup: 'Ollama must allow this page to call it: start Ollama with the OLLAMA_ORIGINS setting set to this page\'s address. No key needed. Type the name of a model you have pulled.',
  },
  lmstudio: {
    label: 'LM Studio (local)',
    baseUrl: 'http://127.0.0.1:1234/v1/chat/completions',
    setup: 'In LM Studio, start the local server and turn on "Enable CORS". No key needed. Type the name of the loaded model.',
  },
  llamacpp: {
    label: 'llama.cpp (local)',
    baseUrl: 'http://127.0.0.1:8080/v1/chat/completions',
    setup: 'Start llama-server with your model. No key needed. The model name can be anything.',
  },
};

const DEFAULTS: Settings = {
  baseUrl: PRESETS.openrouter.baseUrl, apiKey: '', studentModel: '', graderModel: '',
  thinkingOff: true, rememberKey: true, dailyLimit: 0, debugLog: false, voiceOn: true,
};

const K = { settings: 'ts.settings', key: 'ts.key', used: 'ts.used', lesson: 'ts.lesson3', memory: 'ts.memory', levels: 'ts.levels' };

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
  return saved ? { ...saved.state, startedAt: now - saved.elapsed } : null;
}

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
}

const log: LogEntry[] = [];

export function addLog(e: LogEntry): void {
  log.push(e);
  if (log.length > 200) log.shift();
}

export function logText(): string {
  return JSON.stringify(log, null, 2);
}
