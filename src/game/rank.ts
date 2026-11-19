// Teacher rank and badges, computed from every lesson played. Pure functions.
import { t } from '../i18n';
import type { Key } from '../i18n';
import type { Scores } from './course';
import type { Difficulty } from './types';

/** One finished lesson, as kept for rank and badges. */
export interface Play {
  levelId: string;
  /** Lesson score, 0 to 100: the class average minus the mistake penalty (plays saved before 0.8 hold the class average). */
  percent: number;
  /** Times the lesson notes were opened during class. Missing in older plays. */
  peeks?: number;
  /** The teacher's own score on their questions during the quiz, 0 to 100; missing when skipped. */
  mastery?: number;
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
  /** Average over lessons of each lesson's recent weighted score, 0 to 100. */
  average: number;
  /** What the next rank needs, or null at the top. */
  next: { name: string; lessons: number; average: number } | null;
}

/** Plays per lesson that count toward rank: the most recent ones, so one lucky replay does not lift it. */
export const RANK_RECENT_PLAYS = 3;

/** Follow-up lessons practise a lesson already counted, so they stay out of rank and badges about lessons taught. */
export const isFollowUp = (levelId: string) => levelId.endsWith('-followup');

/**
 * Each lesson counts once: the average of its last RANK_RECENT_PLAYS plays, each times its difficulty weight (capped at 100).
 * Scores from before plays were kept count as Normal, with their best. Follow-up lessons do not count.
 */
export function rankOf(plays: Play[], scores: Scores = {}): Rank {
  const best = new Map<string, number>();
  for (const [id, s] of Object.entries(scores)) if (!isFollowUp(id)) best.set(id, s.best);
  const byLevel = new Map<string, number[]>();
  for (const p of plays) {
    if (isFollowUp(p.levelId)) continue;
    byLevel.set(p.levelId, [...(byLevel.get(p.levelId) ?? []), Math.min(100, p.percent * DIFFICULTY_WEIGHT[p.difficulty])]);
  }
  for (const [id, xs] of byLevel) {
    const recent = xs.slice(-RANK_RECENT_PLAYS);
    best.set(id, recent.reduce((a, b) => a + b, 0) / recent.length);
  }
  const lessons = best.size;
  const average = lessons ? Math.round([...best.values()].reduce((a, b) => a + b, 0) / lessons) : 0;
  let at = 0;
  RANKS.forEach((r, i) => { if (lessons >= r.lessons && average >= r.average) at = i; });
  const next = RANKS[at + 1] ?? null;
  return { name: rankName(at), lessons, average, next: next && { name: rankName(at + 1), ...next } };
}

export const SPOTLESS_MIN = 60;
export const IMPROVER_MIN = 50;
export const IMPROVER_GAIN = 10;

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
  // Spotless: no mistakes in a lesson that was also taught well, so one true sentence is not enough.
  if (plays.some(p => p.factErrors === 0 && p.percent >= SPOTLESS_MIN)) out.add('no-mistakes');
  if (plays.some(p => (p.difficulty === 'hard' || p.difficulty === 'inspection') && p.percent >= 60)) out.add('tough-class');
  const byLevel = new Map<string, number[]>();
  for (const p of plays) byLevel.set(p.levelId, [...(byLevel.get(p.levelId) ?? []), p.percent]);
  // Always Improving: three plays in a row that rise, all at least IMPROVER_MIN, gaining IMPROVER_GAIN in total (not luck, not sandbagging).
  for (const xs of byLevel.values()) {
    if (xs.some((x, i) => i >= 2 && xs[i - 2] < xs[i - 1] && xs[i - 1] < x && xs[i - 2] >= IMPROVER_MIN && x - xs[i - 2] >= IMPROVER_GAIN)) out.add('improver');
  }
  return out;
}

/** Badges earned by the newest play: in `after` but not in `before`. */
export function newBadges(before: Set<string>, after: Set<string>): Badge[] {
  return BADGES.filter(b => after.has(b.id) && !before.has(b.id));
}
