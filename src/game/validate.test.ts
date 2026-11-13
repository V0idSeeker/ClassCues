import { describe, expect, it } from 'vitest';
import { builtInChapter, builtInCourses, students } from '../content';
import { normalizeChapter, packLessons, unpackLessons, validateChapter } from './validate';

const copy = () => JSON.parse(JSON.stringify(builtInChapter));

describe('validateChapter', () => {
  it('accepts the built-in chapter', () => {
    expect(validateChapter(builtInChapter)).toEqual([]);
  });

  it('rejects a question that points to a missing objective', () => {
    const c = copy();
    c.quiz[0].objective = 'obj-99';
    expect(validateChapter(c).join(' ')).toContain('q1');
  });

  it('rejects a multiple-choice answer key that is not one of the choices', () => {
    const c = copy();
    c.quiz[1].answer_key = 'Something else';
    expect(validateChapter(c).join(' ')).toContain('q2');
  });

  it('rejects text that is too long', () => {
    const c = copy();
    c.reference = 'x'.repeat(6001);
    expect(validateChapter(c).length).toBeGreaterThan(0);
  });

  it('rejects something that is not a chapter', () => {
    expect(validateChapter('hello').length).toBeGreaterThan(0);
    expect(validateChapter({ title: 'x' }).length).toBeGreaterThan(0);
  });
});

describe('normalizeChapter', () => {
  it('keeps the course a lesson belongs to and drops unknown fields', () => {
    const c = normalizeChapter({ ...builtInChapter, course: ' Biology ', part: 2, extra: 'x' } as never, 'new-id');
    expect(c).toMatchObject({ id: 'new-id', course: 'Biology', part: 2 });
    expect('extra' in c).toBe(false);
    expect('course' in normalizeChapter(builtInChapter, 'x')).toBe(false);
  });
});

describe('sharing several lessons in one file', () => {
  const two = [{ ...builtInChapter, course: 'Python', part: 1 }, { ...builtInChapter, title: 'Loops', course: 'Python', part: 2 }];
  const id = (i: number) => `new-${i}`;

  it('packs lessons and reads them back with new ids, keeping the course', () => {
    const { lessons, problem } = unpackLessons(JSON.parse(JSON.stringify(packLessons(two))), id);
    expect(problem).toBeNull();
    expect(lessons.map(l => [l.id, l.title, l.course, l.part])).toEqual([['new-0', 'Variables', 'Python', 1], ['new-1', 'Loops', 'Python', 2]]);
  });

  it('also reads a single lesson and a plain list', () => {
    expect(unpackLessons(builtInChapter, id).lessons).toHaveLength(1);
    expect(unpackLessons(two, id).lessons).toHaveLength(2);
  });

  it('rejects the whole file when one lesson is broken, and says which', () => {
    const broken = { ...builtInChapter, quiz: [] };
    expect(unpackLessons(packLessons([builtInChapter, broken as never]), id)).toMatchObject({ lessons: [], problem: expect.stringContaining('Lesson 2') });
    expect(unpackLessons({ lessons: [] }, id).problem).toContain('no lessons');
    expect(unpackLessons('hello', id).problem).toBeTruthy();
  });
});

describe('built-in courses', () => {
  const lessons = builtInCourses.flatMap(c => c.lessons);

  it('ships several courses, numbered in order', () => {
    expect(builtInCourses.map(c => c.name)).toEqual(['Intro to Python', 'Data Structures', 'SQL Basics']);
    for (const c of builtInCourses) expect(c.lessons.map(l => l.part)).toEqual(c.lessons.map((_, i) => i + 1));
    expect(lessons.every(l => typeof l.course === 'string')).toBe(true);
  });

  it('has only valid lessons with unique ids', () => {
    for (const l of lessons) expect([l.title, ...validateChapter(l)]).toEqual([l.title]);
    expect(new Set(lessons.map(l => l.id)).size).toBe(lessons.length);
  });

  it('gives every lesson a quiz that covers each goal and mixes both kinds of question', () => {
    for (const l of lessons) {
      const tested = new Set(l.quiz.map(q => q.objective));
      for (const o of l.objectives) expect([l.title, o.id, tested.has(o.id)]).toEqual([l.title, o.id, true]);
      expect(l.quiz.filter(q => q.type === 'mcq').length).toBeGreaterThanOrEqual(2);
      expect(l.quiz.filter(q => q.type === 'short').length).toBeGreaterThanOrEqual(2);
      expect(l.common_misconceptions.length).toBeGreaterThanOrEqual(4);
    }
  });

  it('does not always put the right choice first', () => {
    for (const l of lessons.filter(x => x.id !== 'ch1')) {
      const positions = new Set(l.quiz.filter(q => q.type === 'mcq').map(q => q.choices!.indexOf(q.answer_key)));
      expect([l.title, positions.size > 1]).toEqual([l.title, true]);
    }
  });
});

describe('built-in students', () => {
  it('has ten students covering the six archetypes', () => {
    expect(students).toHaveLength(10);
    const kinds = new Set(students.map(s => s.archetype));
    for (const k of ['eager', 'quiet', 'clown', 'skeptic', 'carrier', 'struggling']) expect(kinds.has(k as never)).toBe(true);
  });
});
