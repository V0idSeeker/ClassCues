import { describe, expect, it } from 'vitest';
import { mulberry32, pick } from './rng';

describe('mulberry32', () => {
  it('gives the same sequence for the same seed', () => {
    const a = mulberry32(42);
    const b = mulberry32(42);
    expect([a(), a(), a()]).toEqual([b(), b(), b()]);
  });

  it('stays inside 0 (included) and 1 (excluded)', () => {
    const r = mulberry32(7);
    for (let i = 0; i < 1000; i++) {
      const v = r();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
});

describe('pick', () => {
  it('returns the item at the random position', () => {
    expect(pick(['a', 'b', 'c', 'd'], () => 0.5)).toBe('c');
  });
});
