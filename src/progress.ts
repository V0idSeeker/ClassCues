// What the game keeps about finished lessons: goal results per run (for often-missed goals),
// and every play (for teacher rank and badges).
import { builtInCourses } from './content';
import type { Play } from './game/rank';
import { loadLevels } from './storage';
import type { Report } from './game/report';
import type { Objective } from './game/types';

// ---------- Goal results of every lesson run, to find the goals classes keep missing.

export interface GoalResult { id: string; inNotes: number; quizAverage: number | null }
/** Per lesson id: each run's goal results, oldest first. */
export type RunHistory = Record<string, GoalResult[][]>;

const RUNS_KEY = 'ts.runs';
const KEEP_RUNS = 10;
const RECENT_RUNS = 3;

export function addRun(history: RunHistory, lessonId: string, objectives: Report['objectives']): RunHistory {
  const run = objectives.map(o => ({ id: o.id, inNotes: o.inNotes, quizAverage: o.quizAverage }));
  return { ...history, [lessonId]: [...(history[lessonId] ?? []), run].slice(-KEEP_RUNS) };
}

/** Goals whose quiz average over the lesson's last three runs is under 50%. Goals never quizzed are left out. */
export function oftenMissed(history: RunHistory, lessonId: string, objectives: Objective[]): Objective[] {
  const runs = (history[lessonId] ?? []).slice(-RECENT_RUNS);
  return objectives.filter(o => {
    const scores = runs.flatMap(r => r.filter(g => g.id === o.id && g.quizAverage !== null).map(g => g.quizAverage as number));
    return scores.length > 0 && scores.reduce((a, b) => a + b, 0) / scores.length < 50;
  });
}

export function loadRuns(): RunHistory {
  try {
    return JSON.parse(localStorage.getItem(RUNS_KEY) ?? '{}') as RunHistory;
  } catch {
    return {};
  }
}

export function saveRuns(history: RunHistory): void {
  try {
    localStorage.setItem(RUNS_KEY, JSON.stringify(history));
  } catch { /* storage full or unavailable: this run is not kept */ }
}

// ---------- Every finished lesson, for teacher rank and badges.

const PLAYS_KEY = 'ts.plays';
/** ponytail: keeps the last 500 plays (about 100 KB). Older plays drop out of the "always improving" check only; best scores stay in ts.scores. */
const MAX_PLAYS = 500;

export function loadPlays(): Play[] {
  try {
    const raw = localStorage.getItem(PLAYS_KEY);
    const v: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(v) ? (v as Play[]) : [];
  } catch {
    return [];
  }
}

/** Changes the newest play (after the teacher disputes a mistake), and returns all plays. */
export function updateLastPlay(patch: Partial<Play>): Play[] {
  const plays = loadPlays();
  if (plays.length === 0) return plays;
  const next = [...plays.slice(0, -1), { ...plays[plays.length - 1], ...patch }];
  try { localStorage.setItem(PLAYS_KEY, JSON.stringify(next)); } catch { /* storage full or blocked: the in-memory result still holds */ }
  return next;
}

export function addPlay(play: Play): Play[] {
  const plays = [...loadPlays(), play].slice(-MAX_PLAYS);
  try {
    localStorage.setItem(PLAYS_KEY, JSON.stringify(plays));
  } catch { /* storage full or unavailable: rank and badges miss this lesson */ }
  return plays;
}

/** The lesson ids of every course: the built-in ones and those imported from PDFs. */
export function courseLessonIds(): string[][] {
  const byCourse = new Map<string, string[]>();
  for (const l of loadLevels()) if (l.course) byCourse.set(l.course, [...(byCourse.get(l.course) ?? []), l.id]);
  return [...builtInCourses.map(c => c.lessons.map(l => l.id)), ...byCourse.values()];
}
