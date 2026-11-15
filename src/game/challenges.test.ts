import { describe, expect, it } from 'vitest';
import { builtInChapter, students } from '../content';
import { loadLesson } from '../storage';
import { CHALLENGES, challengeById, challengeTitle, longestLecture, pickChallenge } from './challenges';
import { patchStudent, startLesson } from './lesson';
import type { LessonState, TranscriptLine } from './types';

const base = startLesson(builtInChapter, students, () => 0.5, 0);
const quiet = base.students.find(s => s.persona.archetype === 'quiet')!.persona.name;
const other = base.students.find(s => s.persona.archetype === 'eager')!.persona.name;
const said = (...lines: [string, string][]): LessonState => ({ ...base, transcript: lines.map(([who, text]): TranscriptLine => ({ who, text })) });
const run = (id: string, s: LessonState) => challengeById(id)!.check!(s);

describe('challenges', () => {
  it('has about fifteen, with unique ids, and both kinds', () => {
    expect(CHALLENGES.length).toBeGreaterThanOrEqual(12);
    expect(new Set(CHALLENGES.map(c => c.id)).size).toBe(CHALLENGES.length);
    expect(CHALLENGES.some(c => c.check)).toBe(true);
    expect(CHALLENGES.some(c => !c.check)).toBe(true);
  });

  it('picks one at random and stores it in the lesson state', () => {
    expect(pickChallenge(() => 0)).toBe(CHALLENGES[0]);
    expect(pickChallenge(() => 0.9999)).toBe(CHALLENGES[CHALLENGES.length - 1]);
    const s = startLesson(builtInChapter, students, () => 0.5, 0, {}, { challenge: 'analogy' });
    expect(s.challenge).toBe('analogy');
  });

  it('an older save without a challenge still loads and simply has none', () => {
    const { challenge: _c, difficulty: _d, ...old } = startLesson(builtInChapter, students, () => 0.5, 0, {}, { challenge: 'analogy', difficulty: 'hard' });
    const saved = JSON.stringify({ state: old, elapsed: 1000 });
    (globalThis as { localStorage?: unknown }).localStorage = { getItem: () => saved };
    const loaded = loadLesson(5000)!;
    delete (globalThis as { localStorage?: unknown }).localStorage;
    expect(loaded.startedAt).toBe(4000);
    expect(challengeById(loaded.challenge)).toBeNull();
  });

  it('names the quiet student in the title', () => {
    expect(challengeTitle(challengeById('quiet-answers')!, base)).toContain(quiet);
  });

  it('no-lecture: counts teacher lines in a row with no student speaking', () => {
    const lecture = said(['teacher', 'a'], ['board', 'x'], ['teacher', 'b'], ['note', 'n'], ['teacher', 'c']);
    expect(longestLecture(lecture)).toBe(3);
    expect(run('no-lecture', lecture).met).toBe(false);
    expect(run('no-lecture', said(['teacher', 'a'], ['teacher', 'b'], [other, 'hi'], ['teacher', 'c'])).met).toBe(true);
    expect(run('no-lecture', said()).met).toBe(false);
  });

  it('every-hand: met only when hands went up and none is left waiting', () => {
    const raised = said(['note', `${other} raised a hand. Click their desk to hear them.`]);
    expect(run('every-hand', raised).met).toBe(true);
    const waiting = patchStudent(raised, base.students[0].persona.id, { handUp: true });
    expect(run('every-hand', waiting).met).toBe(false);
    expect(run('every-hand', said()).met).toBe(false);
  });

  it('early-check: a question among the first seven teacher lines', () => {
    expect(run('early-check', said(['teacher', 'a'], ['teacher', 'What is x?'])).met).toBe(true);
    const late = said(...Array.from({ length: 7 }, (_, i): [string, string] => ['teacher', `line ${i}`]), ['teacher', 'Any questions?']);
    expect(run('early-check', late).met).toBe(false);
  });

  it('quiet-answers: the quiet student speaks right after a teacher question (board lines between are fine)', () => {
    expect(run('quiet-answers', said(['teacher', `${quiet}, what is x?`], ['board', 'x = 5'], [quiet, '5'])).met).toBe(true);
    expect(run('quiet-answers', said(['teacher', 'x is 5.'], [quiet, 'ok'])).met).toBe(false);
    expect(run('quiet-answers', said(['teacher', 'What is x?'], [other, '5'])).met).toBe(false);
  });

  it('three-names, what-if and why are read from what the teacher said', () => {
    const names = base.students.slice(0, 3).map(s => s.persona.name);
    expect(run('three-names', said(...names.map((n): [string, string] => ['teacher', `${n}, listen.`]))).met).toBe(true);
    expect(run('three-names', said(['teacher', `${names[0]} and ${names[0]} again`])).met).toBe(false);
    expect(run('what-if', said(['teacher', 'What would happen if x was 0?'])).met).toBe(true);
    expect(run('what-if', said(['teacher', 'What is x?'], [other, 'What if x was 0?'])).met).toBe(false);
    expect(run('why-question', said(['teacher', 'Why does this work?'])).met).toBe(true);
    expect(run('why-question', said(['teacher', 'This is why.'])).met).toBe(false);
  });
});
