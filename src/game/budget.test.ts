import { describe, expect, it } from 'vitest';
import { builtInChapter } from '../content';
import { mustRingBell, quizReserve } from './budget';

describe('budget', () => {
  it('reserves one request per student, one per written question and two for after the quiz', () => {
    expect(quizReserve(10, builtInChapter.quiz)).toBe(15);
  });

  it('rings the bell when the remaining requests reach the reserve', () => {
    expect(mustRingBell(36, 50, 13)).toBe(false);
    expect(mustRingBell(37, 50, 13)).toBe(true);
  });

  it('never rings when there is no daily limit', () => {
    expect(mustRingBell(9999, 0, 13)).toBe(false);
  });
});
