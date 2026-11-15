// Teacher rank and badges, computed from every lesson played. Pure functions.
import { t } from '../i18n';
import type { Key } from '../i18n';
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
  { lessons: 0, average: 0 },
  { lessons: 1, average: 40 },
  { lessons: 3, average: 55 },
  { lessons: 6, average: 70 },
  { lessons: 10, average: 80 },
] as const;

const rankName = (i: number) => t(`rank.${i}` as Key);

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
  return { name: rankName(at), lessons, average, next: next && { name: rankName(at + 1), ...next } };
}

export interface Badge { id: string; name: string; how: string }

/** Name and how-to are read in the current language each time. */
const badge = (id: string): Badge => ({ id, get name() { return t(`badge.${id}` as Key); }, get how() { return t(`badge.${id}.how` as Key); } });

export const BADGES: Badge[] = ['first-lesson', 'eighty', 'full-course', 'challenge', 'five-challenges', 'no-mistakes', 'tough-class', 'improver'].map(badge);

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
