import { describe, expect, it } from 'vitest';
import { builtInChapter, students } from '../content';
import { normalizeChapter, validateChapter } from './validate';

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

describe('built-in students', () => {
  it('has ten students covering the six archetypes', () => {
    expect(students).toHaveLength(10);
    const kinds = new Set(students.map(s => s.archetype));
    for (const k of ['eager', 'quiet', 'clown', 'skeptic', 'carrier', 'struggling']) expect(kinds.has(k as never)).toBe(true);
  });
});
