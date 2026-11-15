import { describe, expect, it } from 'vitest';
import { builtInChapter, students } from '../content';
import { followUpChapter, heldAtBell, missedGoalIds } from './followup';
import { startLesson } from './lesson';
import type { Report } from './report';
import type { FactError } from './types';

const goals = builtInChapter.objectives;
const rows = (f: (i: number) => { inNotes: number; quizAverage: number | null }): Report['objectives'] =>
  goals.map((o, i) => ({ id: o.id, text: o.text, ...f(i) }));
const allGood = rows(() => ({ inNotes: 8, quizAverage: 90 }));
const error: FactError = { claim: 'Variable names can start with a digit', correction: 'They cannot.', severity: 'major' };

describe('follow-up goals', () => {
  it('misses a goal nobody noted or that averaged under 50%', () => {
    const r = rows(i => (i === 0 ? { inNotes: 0, quizAverage: 80 } : i === 1 ? { inNotes: 5, quizAverage: 49 } : { inNotes: 5, quizAverage: null }));
    expect(missedGoalIds(r)).toEqual([goals[0].id, goals[1].id]);
  });

  it('keeps only the missed goals and their questions', () => {
    const missed = goals[0].id;
    const c = followUpChapter(builtInChapter, rows(i => (i === 0 ? { inNotes: 0, quizAverage: 0 } : { inNotes: 9, quizAverage: 100 })), {}, [])!;
    expect(c.objectives.map(o => o.id)).toEqual([missed]);
    expect(c.quiz.length).toBeGreaterThan(0);
    expect(c.quiz.every(q => q.objective === missed)).toBe(true);
  });

  it('uses every goal when none was missed but the teaching had mistakes', () => {
    const c = followUpChapter(builtInChapter, allGood, {}, [error])!;
    expect(c.objectives).toEqual(goals);
    expect(c.quiz).toEqual(builtInChapter.quiz);
  });

  it('has nothing to fix when nothing was missed and nothing was wrong', () => {
    expect(followUpChapter(builtInChapter, allGood, {}, [])).toBeNull();
  });
});

describe('follow-up chapter', () => {
  it('gets its own id, a follow-up title and a link to the original', () => {
    const c = followUpChapter(builtInChapter, allGood, {}, [error])!;
    expect(c.id).toBe(`${builtInChapter.id}-followup`);
    expect(c.title).toBe(`${builtInChapter.title}: follow-up`);
    expect(c.followUpOf).toBe(builtInChapter.id);
    const again = followUpChapter(c, allGood, {}, [error])!;
    expect(again.title).toBe(`${builtInChapter.title}: follow-up`);
    expect(again.followUpOf).toBe(builtInChapter.id);
    expect(again.id).not.toBe(c.id);
  });

  it('carries the misconceptions still held and every fact-check mistake, for every student', () => {
    const state = startLesson(builtInChapter, students, () => 0.5, 0);
    const heldBefore = new Set(state.students.flatMap(s => s.beliefs.map(b => b.text)));
    const held = heldAtBell(state, [error]);
    expect(Object.values(held).every(h => h.includes(error.claim))).toBe(true);
    const tom = state.students.find(s => s.persona.id === 'tom')!;
    expect(held.tom).toEqual([...tom.beliefs.map(b => b.text), error.claim]);

    const c = followUpChapter(builtInChapter, allGood, held, [error])!;
    expect(new Set(c.common_misconceptions)).toEqual(new Set([...heldBefore, error.claim]));

    // The same class starts the follow-up with exactly those beliefs.
    const next = startLesson(c, state.students.map(s => s.persona), () => 0.5, 0, {}, { held });
    for (const s of next.students) expect(new Set(s.beliefs.map(b => b.text))).toEqual(new Set(held[s.persona.id]));
  });
});
