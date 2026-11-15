import { describe, expect, it } from 'vitest';
import { paragraphs } from './StudyNotes';

describe('paragraphs', () => {
  it('splits at blank lines and joins wrapped lines', () => {
    expect(paragraphs('One line\nwrapped.\n\nSecond.')).toEqual(['One line wrapped.', 'Second.']);
  });
  it('splits at single line breaks when there are no blank lines', () => {
    expect(paragraphs('A.\nB.\n')).toEqual(['A.', 'B.']);
  });
  it('groups the sentences of a long paragraph without losing any', () => {
    const text = Array.from({ length: 12 }, (_, i) => `Sentence ${i} is here.`).join(' ');
    const out = paragraphs(text, 60);
    expect(out.length).toBeGreaterThan(1);
    expect(out.join(' ')).toBe(text);
    expect(out.every(p => p.length <= 60)).toBe(true);
  });
  it('keeps a short text whole and drops empty input', () => {
    expect(paragraphs('x = 5. Then y.')).toEqual(['x = 5. Then y.']);
    expect(paragraphs('  \n ')).toEqual([]);
  });
});
