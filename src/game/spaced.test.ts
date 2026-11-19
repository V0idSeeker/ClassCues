import { describe, expect, it } from 'vitest';
import { REVIEW_DAYS, answered, dueItems, scheduleMissed } from './spaced';

const DAY = 86_400_000;

describe('spaced review', () => {
  it('a missed goal is due a day later, and missing it again starts it over', () => {
    let items = scheduleMissed([], 'ch1', ['obj-1', 'obj-1'], 0);
    expect(items).toEqual([{ lessonId: 'ch1', objectiveId: 'obj-1', step: 0, due: DAY }]);
    expect(dueItems(items, DAY - 1)).toEqual([]);
    expect(dueItems(items, DAY)).toHaveLength(1);
    items = answered(items, items[0], true, DAY);
    expect(items[0]).toMatchObject({ step: 1, due: DAY + REVIEW_DAYS[1] * DAY });
    items = scheduleMissed(items, 'ch1', ['obj-1'], 5 * DAY);
    expect(items[0]).toMatchObject({ step: 0, due: 6 * DAY });
  });

  it('right answers space it out until it is done; a wrong one starts over', () => {
    let items = scheduleMissed([], 'ch1', ['obj-1'], 0);
    items = answered(items, items[0], true, 0);
    items = answered(items, items[0], false, 0);
    expect(items[0]).toMatchObject({ step: 0, due: DAY });
    for (let i = 0; i < REVIEW_DAYS.length; i++) items = answered(items, items[0], true, 0);
    expect(items).toEqual([]);
  });
});
