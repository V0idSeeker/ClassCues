// Courses: splitting PDF pages into lessons, and keeping scores per lesson and per course.

export const MAX_LESSON_CHARS = 30000;
/** A comfortable amount of text for one lesson. Used to suggest how many lessons a PDF should become. */
export const GOOD_LESSON_CHARS = 9000;

export function suggestedLessonCount(pages: string[]): number {
  const total = pages.reduce((n, p) => n + p.length, 0);
  return Math.max(1, Math.min(pages.length || 1, Math.ceil(total / GOOD_LESSON_CHARS)));
}

/**
 * Cuts the pages into `count` lessons of about equal length, in order, never splitting a page.
 * ponytail: cuts by amount of text, not by topic. If lessons need to follow chapter headings,
 * add one AI call that reads the page starts and proposes the cut points.
 */
export function splitIntoLessons(pages: string[], count: number): string[] {
  const n = Math.max(1, Math.min(count, pages.length));
  const total = pages.reduce((sum, p) => sum + p.length, 0);
  const parts: string[][] = [[]];
  let used = 0;
  pages.forEach((page, i) => {
    const current = parts.length;
    const pagesLeft = pages.length - i;
    const partsLeft = n - current;
    // Start the next lesson when this one has its share of the text, or when every remaining page is needed to fill the remaining lessons.
    if (parts[current - 1].length > 0 && partsLeft > 0 && (used >= (total * current) / n || pagesLeft <= partsLeft)) parts.push([]);
    parts[parts.length - 1].push(page);
    used += page.length;
  });
  return parts.map(p => p.join('\n').trim());
}

export interface Score { best: number; last: number; plays: number; at: string }
export type Scores = Record<string, Score>;

/** Adds one finished lesson (class average, 0 to 100) to the scores. */
export function recordScore(scores: Scores, levelId: string, percent: number, at: string): Scores {
  const before = scores[levelId];
  return { ...scores, [levelId]: { best: Math.max(before?.best ?? 0, percent), last: percent, plays: (before?.plays ?? 0) + 1, at } };
}

/** A course's score: the average of the best score of each lesson taught so far. */
export function courseScore(scores: Scores, levelIds: string[]): { taught: number; lessons: number; average: number | null } {
  const best = levelIds.filter(id => scores[id]).map(id => scores[id].best);
  return { taught: best.length, lessons: levelIds.length, average: best.length ? Math.round(best.reduce((a, b) => a + b, 0) / best.length) : null };
}
