import { describe, expect, it } from 'vitest';
import { builtInChapter, students } from '../../content';
import { patchStudent, startLesson } from '../../game/lesson';
import { CATEGORIES, ENTRIES, entryById } from './codexData';
import { TIPS, nextTip } from './tips';

describe('codex', () => {
  it('has unique ids and every category has pages', () => {
    expect(new Set(ENTRIES.map(e => e.id)).size).toBe(ENTRIES.length);
    for (const c of CATEGORIES) expect([c, ENTRIES.some(e => e.category === c)]).toEqual([c, true]);
    expect(ENTRIES.every(e => CATEGORIES.includes(e.category))).toBe(true);
  });

  it('only links to pages that exist', () => {
    for (const e of ENTRIES) for (const id of e.see ?? []) expect([e.id, id, !!entryById(id)]).toEqual([e.id, id, true]);
    for (const t of TIPS) expect([t.id, !!entryById(t.entry)]).toEqual([t.id, true]);
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
