// Every finished lesson, kept for teacher rank and badges.
import { builtInCourses } from './content';
import type { Play } from './game/rank';
import { loadLevels } from './storage';

const KEY = 'ts.plays';
/** ponytail: keeps the last 500 plays (about 100 KB). Older plays drop out of the "always improving" check only; best scores stay in ts.scores. */
const MAX_PLAYS = 500;

export function loadPlays(): Play[] {
  try {
    const raw = localStorage.getItem(KEY);
    const v: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(v) ? (v as Play[]) : [];
  } catch {
    return [];
  }
}

export function addPlay(play: Play): Play[] {
  const plays = [...loadPlays(), play].slice(-MAX_PLAYS);
  try {
    localStorage.setItem(KEY, JSON.stringify(plays));
  } catch { /* storage full or unavailable: rank and badges miss this lesson */ }
  return plays;
}

/** The lesson ids of every course: the built-in ones and those imported from PDFs. */
export function courseLessonIds(): string[][] {
  const byCourse = new Map<string, string[]>();
  for (const l of loadLevels()) if (l.course) byCourse.set(l.course, [...(byCourse.get(l.course) ?? []), l.id]);
  return [...builtInCourses.map(c => c.lessons.map(l => l.id)), ...byCourse.values()];
}
