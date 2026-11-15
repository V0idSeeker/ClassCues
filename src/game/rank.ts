// Teacher rank and badges, computed from every lesson played. Pure functions.
import type { Scores } from './course';
import type { Difficulty } from './types';

/** One finished lesson, as kept for rank and badges. */
export interface Play {
  levelId: string;
  /** Class average, 0 to 100. */
  percent: number;
  difficulty: Difficulty;
  /** null: no challenge, or it could not be judged. */
  challengeMet: boolean | null;
  /** Mistakes the fact check found; null: not checked. */
  factErrors: number | null;
  at: string;
}

/** Harder classes count more toward rank. */
export const DIFFICULTY_WEIGHT: Record<Difficulty, number> = { easy: 0.8, normal: 1, hard: 1.2, inspection: 1.3 };

export const RANKS = [
  { name: 'Student Teacher', lessons: 0, average: 0 },
  { name: 'Substitute', lessons: 1, average: 40 },
  { name: 'Teacher', lessons: 3, average: 55 },
  { name: 'Senior Teacher', lessons: 6, average: 70 },
  { name: 'Head of Department', lessons: 10, average: 80 },
] as const;

export interface Rank {
  name: string;
  /** Different lessons taught. */
  lessons: number;
  /** Average over lessons of the best weighted class average, 0 to 100. */
  average: number;
  /** What the next rank needs, or null at the top. */
  next: { name: string; lessons: number; average: number } | null;
}

/**
 * Each lesson counts once, with its best class average times the difficulty weight (capped at 100).
 * Scores from before plays were kept count as Normal.
 */
export function rankOf(plays: Play[], scores: Scores = {}): Rank {
  const best = new Map<string, number>();
  for (const [id, s] of Object.entries(scores)) best.set(id, s.best);
  const fromPlays = new Map<string, number>();
  for (const p of plays) fromPlays.set(p.levelId, Math.max(fromPlays.get(p.levelId) ?? 0, Math.min(100, p.percent * DIFFICULTY_WEIGHT[p.difficulty])));
  for (const [id, v] of fromPlays) best.set(id, v);
  const lessons = best.size;
  const average = lessons ? Math.round([...best.values()].reduce((a, b) => a + b, 0) / lessons) : 0;
  let at = 0;
  RANKS.forEach((r, i) => { if (lessons >= r.lessons && average >= r.average) at = i; });
  const next = RANKS[at + 1] ?? null;
  return { name: RANKS[at].name, lessons, average, next: next && { ...next } };
}

export interface Badge { id: string; name: string; how: string }

export const BADGES: Badge[] = [
  { id: 'first-lesson', name: 'First Bell', how: 'Teach your first lesson.' },
  { id: 'eighty', name: 'Top of the Class', how: 'Reach a class average of 80% or more.' },
  { id: 'full-course', name: 'Whole Course', how: 'Teach every lesson of a course.' },
  { id: 'challenge', name: 'Challenger', how: 'Meet a lesson challenge.' },
  { id: 'five-challenges', name: 'Five Challenges', how: 'Meet five lesson challenges.' },
  { id: 'no-mistakes', name: 'Spotless', how: 'Teach a lesson in which the fact check finds no mistakes.' },
  { id: 'tough-class', name: 'Tough Crowd', how: 'Get 60% or more with a Hard or Inspection class.' },
  { id: 'improver', name: 'Always Improving', how: 'Teach the same lesson three times in a row, scoring better each time.' },
];

/** Ids of the badges earned. courses: the lesson ids of each course. */
export function earnedBadges(plays: Play[], courses: string[][], scores: Scores = {}): Set<string> {
  const out = new Set<string>();
  const taught = new Set([...Object.keys(scores), ...plays.map(p => p.levelId)]);
  if (taught.size > 0) out.add('first-lesson');
  if (plays.some(p => p.percent >= 80) || Object.values(scores).some(s => s.best >= 80)) out.add('eighty');
  if (courses.some(c => c.length > 0 && c.every(id => taught.has(id)))) out.add('full-course');
  const met = plays.filter(p => p.challengeMet === true).length;
  if (met >= 1) out.add('challenge');
  if (met >= 5) out.add('five-challenges');
  if (plays.some(p => p.factErrors === 0)) out.add('no-mistakes');
  if (plays.some(p => (p.difficulty === 'hard' || p.difficulty === 'inspection') && p.percent >= 60)) out.add('tough-class');
  const byLevel = new Map<string, number[]>();
  for (const p of plays) byLevel.set(p.levelId, [...(byLevel.get(p.levelId) ?? []), p.percent]);
  for (const xs of byLevel.values()) {
    if (xs.some((x, i) => i >= 2 && xs[i - 2] < xs[i - 1] && xs[i - 1] < x)) out.add('improver');
  }
  return out;
}

/** Badges earned by the newest play: in `after` but not in `before`. */
export function newBadges(before: Set<string>, after: Set<string>): Badge[] {
  return BADGES.filter(b => after.has(b.id) && !before.has(b.id));
}
