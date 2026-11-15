// Goal results of every lesson run, to find the goals classes keep missing.

import type { Report } from './game/report';
import type { Objective } from './game/types';

export interface GoalResult { id: string; inNotes: number; quizAverage: number | null }
/** Per lesson id: each run's goal results, oldest first. */
export type RunHistory = Record<string, GoalResult[][]>;

const KEY = 'ts.runs';
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
    return JSON.parse(localStorage.getItem(KEY) ?? '{}') as RunHistory;
  } catch {
    return {};
  }
}

export function saveRuns(history: RunHistory): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(history));
  } catch { /* storage full or unavailable: this run is not kept */ }
}
