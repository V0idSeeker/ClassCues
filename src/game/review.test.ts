import { describe, expect, it } from 'vitest';
import { groupTurns, matchClaims, turnMarkers } from './review';
import type { FactError, TranscriptLine, TurnSnapshot } from './types';

const snap = (turn: number, start: number, end: number, over: Partial<TurnSnapshot> = {}): TurnSnapshot =>
  ({ turn, start, end, mood: 'calm', bored: 0, confused: 0, hands: 0, goals: 0, ...over });
const t = (who: string, text: string): TranscriptLine => ({ who, text });
const err = (claim: string): FactError => ({ claim, correction: 'fix', severity: 'major' });

describe('groupTurns', () => {
  it('puts opening lines in group 0 and lines between turns with the turn before', () => {
    const transcript = [t('Ana', 'hi'), t('teacher', 'one'), t('Bo', 'reply'), t('Bo', 'heard later'), t('teacher', 'two'), t('board', 'x')];
    const groups = groupTurns(transcript, [snap(1, 1, 3), snap(2, 4, 6)]);
    expect(groups.map(g => [g.turn, g.lines.map(l => l.index)])).toEqual([[0, [0]], [1, [1, 2, 3]], [2, [4, 5]]]);
    expect(groups[0].snapshot).toBeNull();
    expect(groups[2].snapshot?.turn).toBe(2);
  });

  it('without a timeline everything is one group', () => {
    expect(groupTurns([t('Ana', 'hi'), t('teacher', 'a')], [])).toEqual([
      { turn: 0, snapshot: null, lines: [{ line: t('Ana', 'hi'), index: 0 }, { line: t('teacher', 'a'), index: 1 }] },
    ]);
    expect(groupTurns([], [])).toEqual([]);
  });
});

describe('matchClaims', () => {
  const transcript = [
    t('teacher', 'A variable stores a value in memory.'),
    t('Ana', 'Variables store values in memory forever and ever?'),
    t('board', 'Variables store values forever, even after the program ends!'),
    t('teacher', 'The program ends when main returns.'),
  ];

  it('picks the teacher or board line with the most words in common, ignoring case and punctuation', () => {
    const e = err('VARIABLES store values FOREVER after the program ends');
    const { byLine, unmatched } = matchClaims(transcript, [e]);
    expect([...byLine.entries()]).toEqual([[2, [e]]]);
    expect(unmatched).toEqual([]);
  });

  it('student lines never match', () => {
    const e = err('forever and ever?');
    expect(matchClaims([transcript[1]], [e]).unmatched).toEqual([e]);
  });

  it('a claim sharing fewer than 3 meaningful words with every line is not matched', () => {
    const e = err('The value is in the memory');
    const { byLine, unmatched } = matchClaims(transcript, [e]);
    expect(byLine.size).toBe(0);
    expect(unmatched).toEqual([e]);
    // Three shared words is enough.
    expect(matchClaims(transcript, [err('variable stores memory')]).byLine.has(0)).toBe(true);
  });
});

describe('turnMarkers', () => {
  it('marks the turn the mood fell to restless or lost, and turns that gained goals', () => {
    const marks = turnMarkers([
      snap(1, 0, 1, { goals: 1 }),
      snap(2, 1, 2, { goals: 1, mood: 'restless' }),
      snap(3, 2, 3, { goals: 1, mood: 'lost' }),
      snap(4, 3, 4, { goals: 3, mood: 'calm' }),
      snap(5, 4, 5, { goals: 2, mood: 'lost' }),
    ]);
    expect([...marks.entries()]).toEqual([
      [1, ['+1 goal']], [2, ['class drifted']], [4, ['+2 goals']], [5, ['class drifted']],
    ]);
  });
});
