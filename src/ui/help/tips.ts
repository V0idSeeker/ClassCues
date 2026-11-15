// Tips shown during a lesson the first time something happens, each linked to a codex page.
import { atmosphere } from '../../game/lesson';
import type { LessonState } from '../../game/types';

export interface Tip {
  /** Its text is the dictionary key tip.<id>. */
  id: string;
  /** The codex page that explains more. */
  entry: string;
  when(state: LessonState): boolean;
}

/** In order of importance: when several apply, the first one not yet seen is shown. */
export const TIPS: Tip[] = [
  {
    id: 'start', entry: 'talking',
    when: s => s.turns === 0,
  },
  {
    id: 'hand', entry: 'calling',
    when: s => s.students.some(st => st.handUp),
  },
  {
    id: 'notebook', entry: 'notebooks',
    when: s => s.turns >= 2,
  },
  {
    id: 'goals', entry: 'goals',
    when: s => s.turns >= 3,
  },
  {
    id: 'mood', entry: 'class-mood',
    when: s => ['restless', 'lost'].includes(atmosphere(s).mood),
  },
  {
    id: 'beliefs', entry: 'wrong-beliefs',
    when: s => s.turns >= 4 && s.students.some(st => st.beliefs.length > 0),
  },
  {
    id: 'ask', entry: 'asking',
    when: s => s.turns >= 5,
  },
  {
    id: 'challenge', entry: 'challenges',
    when: s => s.turns >= 7 && !!s.challenge,
  },
  {
    id: 'bell', entry: 'bell',
    when: s => s.turns >= 10,
  },
];

export function nextTip(state: LessonState, seen: string[]): Tip | null {
  return TIPS.find(t => !seen.includes(t.id) && t.when(state)) ?? null;
}
