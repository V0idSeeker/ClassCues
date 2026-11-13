import { describe, expect, it } from 'vitest';
import { courseScore, recordScore, splitIntoLessons, suggestedLessonCount } from './course';

const page = (n: number, size: number) => `p${n} ` + 'x'.repeat(size);

describe('splitIntoLessons', () => {
  it('cuts pages into lessons of about equal length, in order, without splitting a page', () => {
    const pages = [1, 2, 3, 4, 5, 6].map(n => page(n, 1000));
    const parts = splitIntoLessons(pages, 3);
    expect(parts).toHaveLength(3);
    expect(parts.map(p => p.match(/p\d/g))).toEqual([['p1', 'p2'], ['p3', 'p4'], ['p5', 'p6']]);
  });

  it('balances by amount of text, not by page count', () => {
    const pages = [page(1, 6100), page(2, 1000), page(3, 1000), page(4, 1000), page(5, 1000), page(6, 2000)];
    const parts = splitIntoLessons(pages, 2);
    expect(parts.map(p => p.match(/p\d/g))).toEqual([['p1'], ['p2', 'p3', 'p4', 'p5', 'p6']]);
  });

  it('always gives the number of lessons asked for when there are enough pages', () => {
    const pages = [page(1, 9000), page(2, 100), page(3, 100), page(4, 100)];
    expect(splitIntoLessons(pages, 4)).toHaveLength(4);
    expect(splitIntoLessons(pages, 3)).toHaveLength(3);
    expect(splitIntoLessons(pages, 1)).toHaveLength(1);
  });

  it('never makes more lessons than pages', () => {
    expect(splitIntoLessons([page(1, 500), page(2, 500)], 5)).toHaveLength(2);
    expect(splitIntoLessons([page(1, 500)], 0)).toHaveLength(1);
  });

  it('keeps all the text', () => {
    const pages = [1, 2, 3, 4, 5, 6, 7].map(n => page(n, n * 300));
    expect(splitIntoLessons(pages, 3).join('\n').match(/p\d/g)).toEqual(['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7']);
  });
});

describe('suggestedLessonCount', () => {
  it('suggests more lessons for more text, never more than pages', () => {
    expect(suggestedLessonCount([page(1, 2000)])).toBe(1);
    expect(suggestedLessonCount(Array.from({ length: 10 }, (_, i) => page(i, 4500)))).toBe(6);
    expect(suggestedLessonCount([page(1, 50000), page(2, 50000)])).toBe(2);
  });
});

describe('scores', () => {
  it('keeps the best and the last score of a lesson and counts the plays', () => {
    let s = recordScore({}, 'a', 60, 'day1');
    s = recordScore(s, 'a', 85, 'day2');
    s = recordScore(s, 'a', 70, 'day3');
    expect(s.a).toEqual({ best: 85, last: 70, plays: 3, at: 'day3' });
  });

  it('scores a course as the average best of the lessons taught so far', () => {
    let s = recordScore({}, 'a', 80, 'd');
    s = recordScore(s, 'b', 60, 'd');
    expect(courseScore(s, ['a', 'b', 'c'])).toEqual({ taught: 2, lessons: 3, average: 70 });
    expect(courseScore({}, ['a', 'b'])).toEqual({ taught: 0, lessons: 2, average: null });
  });
});
