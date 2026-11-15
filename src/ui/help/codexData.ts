// The codex: every page of the in-game guide. The structure is here; each language's text is in src/i18n/codex.
import { codexAr } from '../../i18n/codex/ar';
import { codexEn } from '../../i18n/codex/en';
import { codexEs } from '../../i18n/codex/es';
import { codexFr } from '../../i18n/codex/fr';
import { getLang } from '../../i18n';
import type { Lang } from '../../i18n';

/** A picture drawn on a codex page. Each key has a drawing in Codex.tsx. */
export type Visual = 'flow' | 'states' | 'mood' | 'goals' | 'notebook' | 'archetypes' | 'board' | 'report' | 'providers' | 'buttons';

export const CATEGORIES = ['basics', 'teaching', 'students', 'scores', 'courses', 'ai'] as const;
export type Category = typeof CATEGORIES[number];

/** A page's place in the guide, the same in every language. */
export interface Page {
  id: string;
  category: Category;
  visual?: Visual;
  /** Other entries worth reading next. */
  see?: string[];
}

/** A page's words in one language. */
export interface PageText {
  title: string;
  /** The opening paragraph. */
  intro: string;
  /** Short facts, each one line or two. */
  points?: string[];
}

export interface CodexText { categories: Record<Category, string>; pages: Record<string, PageText> }

export type Entry = Page & PageText;

export const CODEX_TEXT: Record<Lang, CodexText> = { en: codexEn, fr: codexFr, es: codexEs, ar: codexAr };

export const PAGES: Page[] = [
  { id: 'goal', category: 'basics', visual: 'flow', see: ['lesson', 'talking'] },
  { id: 'lesson', category: 'basics', visual: 'flow', see: ['prepare', 'turns', 'quiz', 'report'] },
  { id: 'prepare', category: 'basics', see: ['goals', 'wrong-beliefs'] },
  { id: 'turns', category: 'basics', see: ['bell', 'limits'] },
  { id: 'bell', category: 'basics', visual: 'goals', see: ['quiz', 'goals'] },
  { id: 'talking', category: 'teaching', see: ['asking', 'board', 'notebooks'] },
  { id: 'asking', category: 'teaching', visual: 'buttons', see: ['calling', 'hearsay'] },
  { id: 'calling', category: 'teaching', visual: 'states', see: ['asking', 'moods'] },
  { id: 'board', category: 'teaching', visual: 'board', see: ['slides', 'pictures'] },
  { id: 'speaking', category: 'teaching', see: ['talking'] },
  { id: 'slides', category: 'teaching', visual: 'board', see: ['board'] },
  { id: 'pictures', category: 'teaching', see: ['providers', 'board'] },
  { id: 'students', category: 'students', visual: 'archetypes', see: ['moods', 'wrong-beliefs'] },
  { id: 'moods', category: 'students', visual: 'states', see: ['class-mood', 'calling'] },
  { id: 'class-mood', category: 'students', visual: 'mood', see: ['moods', 'asking'] },
  { id: 'notebooks', category: 'students', visual: 'notebook', see: ['wrong-beliefs', 'hearsay', 'goals'] },
  { id: 'goals', category: 'students', visual: 'goals', see: ['notebooks', 'quiz'] },
  { id: 'wrong-beliefs', category: 'students', visual: 'notebook', see: ['notebooks'] },
  { id: 'difficulty', category: 'students', see: ['wrong-beliefs', 'quiz'] },
  { id: 'hearsay', category: 'students', see: ['asking', 'notebooks'] },
  { id: 'memory', category: 'students', see: ['notebooks'] },
  { id: 'voices', category: 'students' },
  { id: 'quiz', category: 'scores', see: ['report', 'goals'] },
  { id: 'report', category: 'scores', visual: 'report', see: ['fact-check', 'explain-back', 'scores'] },
  { id: 'fact-check', category: 'scores', see: ['report', 'talking'] },
  { id: 'explain-back', category: 'scores', see: ['report', 'notebooks'] },
  { id: 'review', category: 'scores', see: ['fact-check', 'class-mood'] },
  { id: 'follow-up', category: 'scores', see: ['fact-check', 'wrong-beliefs'] },
  { id: 'scores', category: 'scores', visual: 'report', see: ['report'] },
  { id: 'challenges', category: 'scores', see: ['rank'] },
  { id: 'rank', category: 'scores', see: ['challenges', 'scores'] },
  { id: 'courses', category: 'courses', see: ['pdf'] },
  { id: 'pdf', category: 'courses', see: ['editing', 'sharing'] },
  { id: 'editing', category: 'courses', see: ['pdf'] },
  { id: 'sharing', category: 'courses' },
  { id: 'providers', category: 'ai', visual: 'providers', see: ['limits', 'errors'] },
  { id: 'limits', category: 'ai', see: ['providers', 'errors'] },
  { id: 'errors', category: 'ai', see: ['limits'] },
  { id: 'realistic', category: 'ai', see: ['asking', 'goals'] },
];

const text = (lang: Lang) => CODEX_TEXT[lang] ?? codexEn;

/** Every page with its words in the language (the current one by default). */
export const entries = (lang: Lang = getLang()): Entry[] =>
  PAGES.map(p => ({ ...p, ...(text(lang).pages[p.id] ?? codexEn.pages[p.id]) }));

export const entryById = (id: string, lang: Lang = getLang()): Entry | undefined => entries(lang).find(e => e.id === id);

export const categoryName = (c: Category, lang: Lang = getLang()): string => text(lang).categories[c];
