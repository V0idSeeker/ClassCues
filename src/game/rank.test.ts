import { describe, expect, it } from 'vitest';
import { BADGES, earnedBadges, newBadges, rankOf } from './rank';
import type { Play } from './rank';

const play = (levelId: string, percent: number, more: Partial<Play> = {}): Play =>
  ({ levelId, percent, difficulty: 'normal', challengeMet: null, factErrors: null, at: '2026-01-01', ...more });

describe('rank', () => {
  it('starts as Student Teacher', () => {
    expect(rankOf([]).name).toBe('Student Teacher');
    expect(rankOf([]).next?.name).toBe('Substitute');
  });

  it('climbs by lessons taught and average best score', () => {
    expect(rankOf([play('a', 40)]).name).toBe('Substitute');
    expect(rankOf([play('a', 39)]).name).toBe('Student Teacher');
    expect(rankOf(['a', 'b', 'c'].map(id => play(id, 55))).name).toBe('Teacher');
    expect(rankOf(['a', 'b'].map(id => play(id, 90))).name).toBe('Substitute');
    expect(rankOf(Array.from({ length: 6 }, (_, i) => play(`l${i}`, 70))).name).toBe('Senior Teacher');
    const ten = Array.from({ length: 10 }, (_, i) => play(`l${i}`, 80));
    expect(rankOf(ten).name).toBe('Head of Department');
    expect(rankOf(ten).next).toBeNull();
    // Many lessons but a low average stays low.
    expect(rankOf(Array.from({ length: 10 }, (_, i) => play(`l${i}`, 50))).name).toBe('Substitute');
  });

  it('counts each lesson once, at its best', () => {
    expect(rankOf([play('a', 20), play('a', 60), play('a', 30)])).toMatchObject({ lessons: 1, average: 60 });
  });

  it('harder classes count more, capped at 100', () => {
    expect(rankOf([play('a', 50, { difficulty: 'hard' })]).average).toBe(60);
    expect(rankOf([play('a', 50, { difficulty: 'easy' })]).average).toBe(40);
    expect(rankOf([play('a', 90, { difficulty: 'inspection' })]).average).toBe(100);
  });

  it('uses older scores (no plays kept) as Normal', () => {
    expect(rankOf([], { a: { best: 70, last: 70, plays: 1, at: '' } })).toMatchObject({ lessons: 1, average: 70 });
  });
});

describe('badges', () => {
  it('has eight', () => expect(BADGES).toHaveLength(8));

  it('none before any lesson', () => expect(earnedBadges([], [['a']]).size).toBe(0));

  it('first lesson, 80%, challenges, no mistakes, tough class', () => {
    expect(earnedBadges([play('a', 10)], [])).toEqual(new Set(['first-lesson']));
    expect(earnedBadges([play('a', 80)], []).has('eighty')).toBe(true);
    expect(earnedBadges([play('a', 10, { challengeMet: true })], []).has('challenge')).toBe(true);
    expect(earnedBadges(Array.from({ length: 4 }, () => play('a', 10, { challengeMet: true })), []).has('five-challenges')).toBe(false);
    expect(earnedBadges(Array.from({ length: 5 }, () => play('a', 10, { challengeMet: true })), []).has('five-challenges')).toBe(true);
    expect(earnedBadges([play('a', 10, { factErrors: 0 })], []).has('no-mistakes')).toBe(true);
    expect(earnedBadges([play('a', 10, { factErrors: null })], []).has('no-mistakes')).toBe(false);
    expect(earnedBadges([play('a', 60, { difficulty: 'hard' })], []).has('tough-class')).toBe(true);
    expect(earnedBadges([play('a', 60, { difficulty: 'inspection' })], []).has('tough-class')).toBe(true);
    expect(earnedBadges([play('a', 59, { difficulty: 'hard' }), play('a', 90)], []).has('tough-class')).toBe(false);
  });

  it('a full course needs every lesson of it', () => {
    expect(earnedBadges([play('a', 10)], [['a', 'b']]).has('full-course')).toBe(false);
    expect(earnedBadges([play('a', 10), play('b', 10)], [['a', 'b']]).has('full-course')).toBe(true);
  });

  it('always improving: three plays of one lesson in a row, each better', () => {
    expect(earnedBadges([play('a', 10), play('b', 5), play('a', 20), play('a', 30)], []).has('improver')).toBe(true);
    expect(earnedBadges([play('a', 10), play('a', 20), play('a', 20)], []).has('improver')).toBe(false);
    expect(earnedBadges([play('a', 30), play('a', 10), play('a', 20)], []).has('improver')).toBe(false);
  });

  it('lists only the badges this lesson earned', () => {
    const before = earnedBadges([play('a', 10)], []);
    const after = earnedBadges([play('a', 10), play('a', 85)], []);
    expect(newBadges(before, after).map(b => b.id)).toEqual(['eighty']);
  });
});
