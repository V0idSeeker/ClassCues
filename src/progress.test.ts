import { describe, expect, it } from 'vitest';
import { addRun, oftenMissed } from './progress';
import type { RunHistory } from './progress';

const goals = [{ id: 'g1', text: 'Goal one' }, { id: 'g2', text: 'Goal two' }, { id: 'g3', text: 'Goal three' }];
const run = (g1: number, g2: number | null) => [
  { id: 'g1', text: 'Goal one', inNotes: 3, quizAverage: g1 },
  { id: 'g2', text: 'Goal two', inNotes: 3, quizAverage: g2 },
];

describe('often missed goals', () => {
  it('is empty before any run', () => {
    expect(oftenMissed({}, 'l1', goals)).toEqual([]);
  });

  it('lists goals averaging under 50% over the last three runs, never unquizzed ones', () => {
    let h: RunHistory = {};
    for (const [a, b] of [[100, null], [20, null], [40, 60], [60, null]] as const) h = addRun(h, 'l1', run(a, b));
    // Last three runs of g1: 20, 40, 60 -> 40%. g2 quizzed once, at 60%. g3 never recorded.
    expect(oftenMissed(h, 'l1', goals)).toEqual([goals[0]]);
    h = addRun(h, 'l1', run(90, 10));
    // g1: 40, 60, 90 -> 63%. g2: 60, 10 -> 35%.
    expect(oftenMissed(h, 'l1', goals)).toEqual([goals[1]]);
    expect(oftenMissed(h, 'other', goals)).toEqual([]);
  });

  it('records goal id, notes and quiz average per run, keeping the last ten', () => {
    let h: RunHistory = {};
    for (let i = 0; i < 12; i++) h = addRun(h, 'l1', run(i, null));
    expect(h.l1).toHaveLength(10);
    expect(h.l1[9][0]).toEqual({ id: 'g1', inNotes: 3, quizAverage: 11 });
  });
});
