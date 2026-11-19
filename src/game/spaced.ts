// Spaced review: goals the teacher got wrong come back as short questions after 1, 3 and 7 days.
// Recalling something again, further apart each time it is right, is what makes it last.

/** Days until the next review, by step. Right answers move one step on; after the last step the goal is done. */
export const REVIEW_DAYS = [1, 3, 7];
const DAY = 86_400_000;

export interface ReviewItem { lessonId: string; objectiveId: string; step: number; due: number }

const same = (a: ReviewItem, lessonId: string, objectiveId: string) => a.lessonId === lessonId && a.objectiveId === objectiveId;

/** Goals missed in a lesson: added, or set back to the first step, due a day from now. */
export function scheduleMissed(items: ReviewItem[], lessonId: string, objectiveIds: string[], now: number): ReviewItem[] {
  const ids = [...new Set(objectiveIds)];
  const kept = items.filter(i => !ids.some(id => same(i, lessonId, id)));
  return [...kept, ...ids.map(objectiveId => ({ lessonId, objectiveId, step: 0, due: now + REVIEW_DAYS[0] * DAY }))];
}

/** Items due now, oldest first. */
export function dueItems(items: ReviewItem[], now: number): ReviewItem[] {
  return items.filter(i => i.due <= now).sort((a, b) => a.due - b.due);
}

/** After one review: right moves the goal a step further out (or finishes it), wrong starts it over. */
export function answered(items: ReviewItem[], item: ReviewItem, right: boolean, now: number): ReviewItem[] {
  const rest = items.filter(i => !same(i, item.lessonId, item.objectiveId));
  if (!right) return [...rest, { ...item, step: 0, due: now + REVIEW_DAYS[0] * DAY }];
  const step = item.step + 1;
  return step >= REVIEW_DAYS.length ? rest : [...rest, { ...item, step, due: now + REVIEW_DAYS[step] * DAY }];
}
