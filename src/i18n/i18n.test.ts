import { afterEach, describe, expect, it, vi } from 'vitest';
import { builtInChapter, inLanguage, students } from '../content';
import { startLesson } from '../game/lesson';
import { answerPrompt } from '../ai/prompts/answer';
import { challengePrompt } from '../ai/prompts/challenge';
import { explainBackPrompt } from '../ai/prompts/explainBack';
import { factCheckPrompt } from '../ai/prompts/factCheck';
import { graderPrompt } from '../ai/prompts/grader';
import { noteTakerPrompt } from '../ai/prompts/noteTaker';
import { quizTakerPrompt } from '../ai/prompts/quizTaker';
import { reactionPrompt } from '../ai/prompts/reaction';
import type { ChatMessage } from '../ai/provider';
import { TIPS } from '../ui/help/tips';
import { DICTS, LANGS, detectLang, getLang, setLang, t } from './index';
import type { Key, Lang } from './index';

const placeholders = (text: string) => [...text.matchAll(/\{(\w+)\}/g)].map(m => m[1]).sort();
const forms = (msg: string | object) => (typeof msg === 'string' ? [msg] : Object.values(msg));

describe('dictionaries', () => {
  const keys = Object.keys(DICTS.en) as Key[];

  it('every language has every key, and no others', () => {
    for (const { id } of LANGS) expect([id, Object.keys(DICTS[id]).sort()]).toEqual([id, [...keys].sort()]);
  });

  it('every message keeps the English placeholders and plural shape', () => {
    for (const { id } of LANGS) {
      for (const key of keys) {
        const en = DICTS.en[key];
        const msg = DICTS[id][key];
        expect([id, key, typeof msg]).toEqual([id, key, typeof en]);
        const want = new Set(forms(en).flatMap(placeholders).filter(p => p !== 'count'));
        // Every placeholder but {count} appears in each form; a plural form may leave {count} out ("one student").
        for (const f of forms(msg)) {
          expect([id, key, f.trim().length > 0]).toEqual([id, key, true]);
          for (const p of want) expect([id, key, f.includes(`{${p}}`)]).toEqual([id, key, true]);
          for (const p of placeholders(f)) expect([id, key, p, p === 'count' || want.has(p)]).toEqual([id, key, p, true]);
        }
        if (typeof msg === 'object') expect([id, key, typeof msg.other]).toEqual([id, key, 'string']);
      }
    }
  });

  it('has the text of every lesson tip in every language', () => {
    for (const { id } of LANGS) for (const tip of TIPS) expect([id, tip.id, !!DICTS[id][`tip.${tip.id}` as Key]]).toEqual([id, tip.id, true]);
  });
});

describe('t', () => {
  afterEach(() => setLang('en'));

  it('fills in {name} values and leaves unknown ones alone', () => {
    expect(t('menu.continue', { title: 'Loops' })).toBe('Continue lesson: Loops');
    expect(t('menu.continue')).toBe('Continue lesson: {title}');
  });

  it('picks English plural forms', () => {
    expect(t('prepare.quiz', { count: 1 })).toMatch(/^The quiz has 1 question\./);
    expect(t('prepare.quiz', { count: 6 })).toMatch(/^The quiz has 6 questions\./);
  });

  it('follows the current language, and can be asked for another one', () => {
    setLang('fr');
    expect(getLang()).toBe('fr');
    expect(t('common.settings')).toBe(DICTS.fr['common.settings']);
    expect(t('common.settings', {}, 'en')).toBe('Settings');
  });

  it('picks all six Arabic plural forms', () => {
    const msg = DICTS.ar['report.rankLine'] as Record<string, string>;
    const fill = (form: string, count: number) => msg[form].replace('{count}', String(count)).replace('{average}', '50');
    expect(t('report.rankLine', { count: 0, average: 50 }, 'ar')).toBe(fill('zero', 0));
    expect(t('report.rankLine', { count: 1, average: 50 }, 'ar')).toBe(fill('one', 1));
    expect(t('report.rankLine', { count: 2, average: 50 }, 'ar')).toBe(fill('two', 2));
    expect(t('report.rankLine', { count: 5, average: 50 }, 'ar')).toBe(fill('few', 5));
    expect(t('report.rankLine', { count: 11, average: 50 }, 'ar')).toBe(fill('many', 11));
    expect(t('report.rankLine', { count: 100, average: 50 }, 'ar')).toBe(fill('other', 100));
    expect(new Set(['zero', 'one', 'two', 'few', 'many', 'other'].map(f => msg[f])).size).toBe(6);
  });

  it('uses French "one" for 0 and 1', () => {
    expect(t('prepare.quiz', { count: 0 }, 'fr')).toBe(t('prepare.quiz', { count: 1 }, 'fr').replace('1', '0'));
  });
});

describe('detectLang', () => {
  afterEach(() => vi.unstubAllGlobals());
  const as = (language: string) => { vi.stubGlobal('navigator', { language }); return detectLang(); };

  it('takes the browser language when the game has it, else English', () => {
    expect(as('fr-CA')).toBe('fr');
    expect(as('es')).toBe('es');
    expect(as('ar-DZ')).toBe('ar');
    expect(as('de-DE')).toBe('en');
    expect(as('')).toBe('en');
  });
});

describe('students in the chosen language', () => {
  it('have opening lines in every language', () => {
    for (const { id } of LANGS) {
      for (const p of students) expect([id, p.id, inLanguage(p, id).openingLines.length]).toEqual([id, p.id, p.openingLines.length]);
    }
    expect(inLanguage(students[0], 'es').openingLines).not.toEqual(students[0].openingLines);
  });
});

describe('prompts set the output language', () => {
  const state = startLesson(builtInChapter, students, () => 0.5, 0);
  const student = state.students[0];
  const q = builtInChapter.quiz.find(x => x.type === 'short')!;
  const builders: [string, (lang?: Lang) => ChatMessage[]][] = [
    ['answer', lang => answerPrompt(state, student, 'Why?', lang)],
    ['reaction', lang => reactionPrompt(state, student, lang)],
    ['noteTaker', lang => noteTakerPrompt(state, '', 'x = 5', null, lang)],
    ['explainBack', lang => explainBackPrompt(student, 'Variables', lang)],
    ['quizTaker', lang => quizTakerPrompt(student, builtInChapter.quiz, lang)],
    ['grader', lang => graderPrompt(q, [], lang)],
    ['factCheck', lang => factCheckPrompt(builtInChapter, [{ who: 'teacher', text: 'x' }], lang)],
    ['challenge', lang => challengePrompt('Ask why', 'The teacher asked why.', [], lang)],
  ];
  const system = (m: ChatMessage[]) => m.filter(x => x.role === 'system').map(x => x.content).join('\n');
  const NAMES: Record<Lang, string> = { en: 'English', fr: 'French', es: 'Spanish', ar: 'Arabic' };

  it('in each language, and English by default', () => {
    for (const [name, build] of builders) {
      expect([name, system(build())]).toEqual([name, expect.stringMatching(/ in English\./)]);
      for (const { id } of LANGS) {
        expect([name, id, system(build(id))]).toEqual([name, id, expect.stringContaining(` in ${NAMES[id]}.`)]);
        for (const other of LANGS.filter(l => l.id !== id)) expect([name, id, system(build(id)).includes(` in ${NAMES[other.id]}.`)]).toEqual([name, id, false]);
      }
    }
  });

  it('tells the grader to judge meaning, not language', () => {
    expect(system(graderPrompt(q, [], 'ar'))).toContain('Judge the meaning, not the language');
  });
});

describe('follow-up titles', () => {
  afterEach(() => setLang('en'));

  it('a follow-up of a follow-up has one suffix, whichever language each was made in', async () => {
    const { followUpChapter } = await import('../game/followup');
    const missed = builtInChapter.objectives.map(o => ({ id: o.id, text: o.text, inNotes: 0, quizAverage: 0 }));
    const first = followUpChapter(builtInChapter, missed, {}, [])!;
    expect(first.title).toBe(`${builtInChapter.title}: follow-up`);
    setLang('fr');
    const second = followUpChapter(first, missed, {}, [])!;
    expect(second.title).toBe(t('followup.title', { title: builtInChapter.title }));
    expect(followUpChapter(second, missed, {}, [])!.title).toBe(second.title);
  });
});
