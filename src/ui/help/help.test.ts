import { describe, expect, it } from 'vitest';
import { builtInChapter, students } from '../../content';
import { patchStudent, startLesson } from '../../game/lesson';
import { LANGS } from '../../i18n';
import { CATEGORIES, CODEX_TEXT, PAGES, entries, entryById } from './codexData';
import { TIPS, nextTip } from './tips';

describe('codex', () => {
  it('has unique ids and every category has pages', () => {
    expect(new Set(PAGES.map(e => e.id)).size).toBe(PAGES.length);
    for (const c of CATEGORIES) expect([c, PAGES.some(e => e.category === c)]).toEqual([c, true]);
    expect(PAGES.every(e => CATEGORIES.includes(e.category))).toBe(true);
  });

  it('only links to pages that exist', () => {
    for (const e of PAGES) for (const id of e.see ?? []) expect([e.id, id, !!entryById(id)]).toEqual([e.id, id, true]);
    for (const t of TIPS) expect([t.id, !!entryById(t.entry)]).toEqual([t.id, true]);
  });

  it('has every page, with the same number of points, in every language', () => {
    const en = CODEX_TEXT.en;
    for (const { id: lang } of LANGS) {
      const text = CODEX_TEXT[lang];
      expect([lang, Object.keys(text.pages).sort()]).toEqual([lang, PAGES.map(p => p.id).sort()]);
      expect([lang, Object.keys(text.categories).sort()]).toEqual([lang, [...CATEGORIES].sort()]);
      for (const p of PAGES) {
        const page = text.pages[p.id];
        expect([lang, p.id, !!page.title.trim() && !!page.intro.trim(), page.points?.length]).toEqual([lang, p.id, true, en.pages[p.id].points?.length]);
      }
      expect(entries(lang).map(e => e.id)).toEqual(PAGES.map(p => p.id));
    }
  });

  it('shows pages in the language asked for', () => {
    expect(entryById('goal', 'en')!.title).toBe('What this game is');
    expect(entryById('goal', 'fr')!.title).not.toBe(entryById('goal', 'en')!.title);
  });
});

describe('tips', () => {
  const start = () => startLesson(builtInChapter, students, () => 0.5, 0);

  it('greets a new lesson, then explains raised hands before anything else', () => {
    expect(nextTip(start(), [])!.id).toBe('start');
    const hand = { ...patchStudent(start(), 'leo', { handUp: true }), turns: 3 };
    expect(nextTip(hand, ['start'])!.id).toBe('hand');
  });

  it('never shows a tip twice, and has nothing left once all are seen', () => {
    const late = { ...patchStudent(start(), 'leo', { handUp: true }), turns: 12 };
    const seen: string[] = [];
    for (let tip = nextTip(late, seen); tip; tip = nextTip(late, seen)) {
      expect(seen).not.toContain(tip.id);
      seen.push(tip.id);
    }
    expect(seen.length).toBeGreaterThanOrEqual(6);
  });
});
