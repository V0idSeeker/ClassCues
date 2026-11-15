import { describe, expect, it } from 'vitest';
import { builtInChapter, studentPool, students } from '../content';
import {
  LESSON_MS, MAX_TURNS, applyNotes, atmosphere, boardText, drawClass, memoryFor, rememberLesson, boardAdded, classClock, coverage, hasObjective, lessonOver,
  mergeTurns, mistakesFor, patchStudent, pickReactor, shouldReact, startLesson, visibleBoard,
} from './lesson';
import type { ClassMemory } from './lesson';
import type { NoteTakerResult } from './types';

const start = () => startLesson(builtInChapter, students, () => 0.5, 0);
const find = (s: ReturnType<typeof start>, id: string) => s.students.find(x => x.persona.id === id)!;
const notesFor = (id: string, text: string, objective: string | null = 'obj-1', distorted = false): NoteTakerResult => ({
  students: [{ id, new_notes: [{ text, objective, distorted }], beliefs_dropped: [], emotion: 'HAPPY' }],
});

describe('startLesson', () => {
  it('hands out wrong beliefs: carrier two, struggling one, two others one each', () => {
    const s = start();
    expect(find(s, 'tom').beliefs).toHaveLength(2);
    expect(find(s, 'sam').beliefs).toHaveLength(1);
    expect(s.students.filter(x => x.beliefs.length > 0)).toHaveLength(4);
  });

  it('opens with two pre-written student lines and no turns used', () => {
    const s = start();
    expect(s.transcript).toHaveLength(2);
    expect(s.turns).toBe(0);
  });

  it('works when the chapter has no misconceptions', () => {
    const s = startLesson({ ...builtInChapter, common_misconceptions: [] }, students, () => 0.5, 0);
    expect(s.students.every(x => x.beliefs.length === 0)).toBe(true);
  });
});

describe('drawClass', () => {
  it('draws ten different students with every core archetype', () => {
    for (const seed of [0, 0.3, 0.77, 0.999]) {
      const cls = drawClass(studentPool, () => seed);
      expect(cls).toHaveLength(10);
      expect(new Set(cls.map(p => p.id)).size).toBe(10);
      for (const kind of ['eager', 'quiet', 'clown', 'skeptic', 'carrier', 'struggling']) expect(cls.some(p => p.archetype === kind)).toBe(true);
    }
  });

  it('gives everyone when the pool is smaller than a class', () => {
    expect(drawClass(students.slice(0, 4), () => 0.5)).toHaveLength(4);
  });

  it('has a pool of complete students with unique ids (checks content/students.json)', () => {
    expect(studentPool.length).toBeGreaterThanOrEqual(30);
    expect(studentPool.every(p => p.look.hair && p.look.skin && typeof p.voice === 'number')).toBe(true);
    expect(new Set(studentPool.map(p => p.id)).size).toBe(studentPool.length);
    const kinds = ['eager', 'quiet', 'clown', 'skeptic', 'carrier', 'struggling', 'other'];
    for (const p of studentPool) {
      expect(p.id).toMatch(/^[a-z0-9-]+$/);
      expect(kinds).toContain(p.archetype);
      expect(p.name && p.personality && p.learning_style).toBeTruthy();
      expect(p.openingLines.length).toBeGreaterThanOrEqual(1);
      for (const t of [p.traits.attention, p.traits.curiosity, p.traits.confidence]) { expect(t).toBeGreaterThanOrEqual(0); expect(t).toBeLessThanOrEqual(1); }
    }
  });
});

describe('applyNotes', () => {
  it('keeps a note for an attentive student and drops it for an inattentive one', () => {
    const r: NoteTakerResult = { students: [...notesFor('aisha', 'a variable stores a value').students, ...notesFor('leo', 'a variable stores a value').students] };
    const s = applyNotes(start(), r, () => 0.9);
    expect(find(s, 'aisha').notes).toHaveLength(1);
    expect(find(s, 'leo').notes).toHaveLength(0);
  });

  it('does not store the same note twice', () => {
    let s = applyNotes(start(), notesFor('aisha', 'A variable stores a value'), () => 0);
    s = applyNotes(s, notesFor('aisha', 'a variable  stores a value'), () => 0);
    expect(find(s, 'aisha').notes).toHaveLength(1);
  });

  it('clears an objective id the chapter does not have', () => {
    const s = applyNotes(start(), notesFor('aisha', 'something', 'obj-99'), () => 0);
    expect(find(s, 'aisha').notes[0].objective).toBeNull();
  });

  it('removes a corrected belief and sets the emotion', () => {
    const before = start();
    const first = find(before, 'tom').beliefs[0].id;
    const s = applyNotes(before, { students: [{ id: 'tom', new_notes: [], beliefs_dropped: [first], emotion: 'CURIOUS' }] }, () => 0);
    expect(find(s, 'tom').beliefs.map(b => b.id)).not.toContain(first);
    expect(find(s, 'tom').emotion).toBe('CURIOUS');
  });

  it('ignores students the model invented', () => {
    const s = applyNotes(start(), notesFor('nobody', 'x'), () => 0);
    expect(s.students.every(x => x.notes.length === 0)).toBe(true);
  });
});

describe('memory across lessons', () => {
  const taught = () => applyNotes(start(), notesFor('aisha', 'a variable stores a value'), () => 0);

  it('keeps each student\u2019s notes after a lesson and gives them back in the next one', () => {
    const memory = rememberLesson({}, taught());
    expect(memory.aisha).toEqual([{ chapterId: 'ch1', title: 'Variables', notes: ['a variable stores a value'] }]);
    const next = startLesson({ ...builtInChapter, id: 'ch2', title: 'Loops' }, students, () => 0.5, 0, memory);
    expect(find(next, 'aisha').memory).toEqual(['From the lesson "Variables": a variable stores a value']);
    expect(find(next, 'leo').memory).toEqual([]);
    expect(find(next, 'aisha').notes).toEqual([]);
  });

  it('starts fresh when the same level is taught again', () => {
    const memory = rememberLesson({}, taught());
    expect(find(startLesson(builtInChapter, students, () => 0.5, 0, memory), 'aisha').memory).toEqual([]);
    expect(memoryFor(memory, 'aisha', 'ch1')).toEqual([]);
  });

  it('keeps only the last three lessons and replaces a repeated one', () => {
    let memory = {};
    for (const id of ['a', 'b', 'c', 'd', 'b']) memory = rememberLesson(memory, { ...taught(), chapter: { ...builtInChapter, id, title: id } });
    expect((memory as Record<string, { chapterId: string }[]>).aisha.map(m => m.chapterId)).toEqual(['c', 'd', 'b']);
  });
});

describe('remembered mistakes', () => {
  const mistakeBeliefs = (s: ReturnType<typeof start>, id: string) => find(s, id).beliefs.filter(b => b.id.startsWith('m')).map(b => b.text);
  const next = (memory: ClassMemory) => startLesson({ ...builtInChapter, id: 'ch2', title: 'Loops' }, students, () => 0.5, 0, memory);

  it('gives every student of the class the teacher’s mistakes as wrong beliefs in any later lesson', () => {
    const memory = rememberLesson({}, start(), ['x = 1 makes x equal to 1 forever']);
    const s = next(memory);
    for (const st of s.students) expect(mistakeBeliefs(s, st.persona.id)).toEqual(['x = 1 makes x equal to 1 forever']);
    // Also when the same lesson is taught again.
    expect(mistakeBeliefs(startLesson(builtInChapter, students, () => 0.5, 0, memory), 'aisha')).toEqual(['x = 1 makes x equal to 1 forever']);
  });

  it('keeps at most three, newest first', () => {
    let memory = rememberLesson({}, start(), ['old 1', 'old 2']);
    memory = rememberLesson(memory, next(memory), ['new 1', 'new 2']);
    expect(mistakesFor(memory, 'aisha')).toEqual(['new 1', 'new 2', 'old 1']);
  });

  it('forgets a mistake once the student dropped it during a lesson', () => {
    const memory = rememberLesson({}, start(), ['wrong A', 'wrong B']);
    let s = next(memory);
    const a = find(s, 'aisha').beliefs.find(b => b.text === 'wrong A')!;
    s = applyNotes(s, { students: [{ id: 'aisha', new_notes: [], beliefs_dropped: [a.id], emotion: 'HAPPY' }] }, () => 0);
    const after = rememberLesson(memory, s);
    expect(mistakesFor(after, 'aisha')).toEqual(['wrong B']);
    expect(mistakesFor(after, 'leo')).toEqual(['wrong A', 'wrong B']);
    expect(mistakeBeliefs(next(after), 'aisha')).toEqual(['wrong B']);
  });

  it('loads memory saved before mistakes were remembered', () => {
    const old: ClassMemory = { aisha: [{ chapterId: 'ch1', title: 'Variables', notes: ['a note'] }] };
    expect(mistakesFor(old, 'aisha')).toEqual([]);
    expect(mistakeBeliefs(next(old), 'aisha')).toEqual([]);
    expect(find(next(old), 'aisha').memory).toEqual(['From the lesson "Variables": a note']);
  });
});

describe('class atmosphere', () => {
  it('reads the mood of the class from how students feel', () => {
    let s = start();
    expect(atmosphere(s).mood).toBe('calm');
    for (const id of ['aisha', 'maya', 'leo', 'yuki']) s = patchStudent(s, id, { emotion: 'BORED' });
    expect(atmosphere(s)).toMatchObject({ bored: 0.4, mood: 'restless' });
    for (const id of ['tom', 'sam', 'nora', 'omar']) s = patchStudent(s, id, { emotion: 'CONFUSED' });
    expect(atmosphere(s).mood).toBe('lost');
    let happy = start();
    for (const st of happy.students.slice(0, 5)) happy = patchStudent(happy, st.persona.id, { emotion: 'CURIOUS' });
    expect(atmosphere(happy).mood).toBe('engaged');
  });

  it('counts teacher turns since a student last spoke', () => {
    const s = start();
    const talk = (lines: [string, string][]) => ({ ...s, transcript: lines.map(([who, text]) => ({ who, text })) });
    expect(atmosphere(talk([['Leo', 'hi'], ['teacher', 'a'], ['board', 'x'], ['teacher', 'b'], ['note', 'n'], ['teacher', 'c']])).teacherTurnsSinceStudentSpoke).toBe(3);
    expect(atmosphere(talk([['teacher', 'a'], ['Leo', 'why?']])).teacherTurnsSinceStudentSpoke).toBe(0);
  });

  it('makes a bored student write down less', () => {
    const r = notesFor('aisha', 'a variable stores a value');
    expect(find(applyNotes(start(), r, () => 0.7), 'aisha').notes).toHaveLength(1);
    expect(find(applyNotes(patchStudent(start(), 'aisha', { emotion: 'BORED' }), r, () => 0.7), 'aisha').notes).toHaveLength(0);
  });
});

describe('coverage', () => {
  it('counts students with an undistorted note on the objective', () => {
    let s = applyNotes(start(), notesFor('aisha', 'a variable stores a value', 'obj-1'), () => 0);
    s = applyNotes(s, notesFor('tom', 'variables are equations', 'obj-1', true), () => 0);
    expect(coverage(s)['obj-1']).toBe(1);
    expect(coverage(s)['obj-4']).toBe(0);
    expect(hasObjective(find(s, 'tom'), 'obj-1')).toBe(false);
  });
});

describe('board and turns', () => {
  it('finds lines added to the board', () => {
    expect(boardAdded('a\nb', 'a\nb\nc')).toBe('c');
    expect(boardAdded('a\nb', 'a')).toBe('');
    expect(boardAdded('', ' x = 5 \n')).toBe('x = 5');
  });

  it('starts with one empty board, and knows which board is on show', () => {
    expect(start()).toMatchObject({ boardPages: [''], boardPage: 0 });
    expect(visibleBoard({ ...start(), boardPages: ['first', 'second'], boardPage: 1 })).toBe('second');
  });

  it('lets students read the description of a board picture, never the picture', () => {
    expect(boardText('score = 10', 'a box labelled score with 10 inside')).toBe('score = 10\nPicture on the board: a box labelled score with 10 inside');
    expect(boardText('', ' a tree ')).toBe('Picture on the board: a tree');
    expect(boardText('score = 10', '  ')).toBe('score = 10');
    expect(boardText('score = 10', undefined)).toBe('score = 10');
    const s = { ...start(), boardPages: ['one', 'two'], boardPage: 1, boardCaptions: ['', 'a jar'] };
    expect(visibleBoard(s)).toBe('two\nPicture on the board: a jar');
  });

  it('keeps the boards of the newest turn when turns are merged', () => {
    expect(mergeTurns([{ say: 'one', board: 'a' }, { say: 'two', board: 'a\nb', pages: ['a', 'b'], page: 1 }]))
      .toEqual({ say: 'one\ntwo', board: 'a\nb', pages: ['a', 'b'], page: 1 });
  });

  it('merges queued turns into one', () => {
    expect(mergeTurns([{ say: 'one', board: 'a' }, { say: ' ', board: 'a\nb' }, { say: 'two', board: 'a\nb\nc' }]))
      .toEqual({ say: 'one\ntwo', board: 'a\nb\nc' });
  });

  it('ends the lesson at the turn cap or the time cap', () => {
    const s = start();
    expect(lessonOver(s, 1000)).toBe(false);
    expect(lessonOver({ ...s, turns: MAX_TURNS }, 1000)).toBe(true);
    expect(lessonOver(s, LESSON_MS)).toBe(true);
  });

  it('shows the 15 real minutes as a 45-minute class clock', () => {
    expect(classClock(start(), LESSON_MS / 3)).toBe('15:00');
    expect(classClock(start(), LESSON_MS * 2)).toBe('45:00');
  });
});

describe('reactions', () => {
  it('reacts every second turn and not within six seconds of the last one', () => {
    expect(shouldReact(2, 0, 6000)).toBe(true);
    expect(shouldReact(1, 0, 6000)).toBe(false);
    expect(shouldReact(2, 0, 5999)).toBe(false);
  });

  it('never picks a student whose hand is already up', () => {
    let s = start();
    for (const st of s.students.slice(1)) s = patchStudent(s, st.persona.id, { handUp: true });
    expect(pickReactor(s, () => 0.99)!.persona.id).toBe(s.students[0].persona.id);
    s = patchStudent(s, s.students[0].persona.id, { handUp: true });
    expect(pickReactor(s, () => 0.5)).toBeNull();
  });
});
