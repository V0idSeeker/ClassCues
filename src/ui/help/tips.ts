// Tips shown during a lesson the first time something happens, each linked to a codex page.
import { atmosphere } from '../../game/lesson';
import type { LessonState } from '../../game/types';

export interface Tip {
  id: string;
  text: string;
  /** The codex page that explains more. */
  entry: string;
  when(state: LessonState): boolean;
}

/** In order of importance: when several apply, the first one not yet seen is shown. */
export const TIPS: Tip[] = [
  {
    id: 'start', entry: 'talking',
    text: 'Start teaching: type what you would say and press Enter, or write key points on the board. Students only learn what you say, write or draw.',
    when: s => s.turns === 0,
  },
  {
    id: 'hand', entry: 'calling',
    text: 'A hand is up. Click that student\'s desk to hear their question.',
    when: s => s.students.some(st => st.handUp),
  },
  {
    id: 'notebook', entry: 'notebooks',
    text: 'Click any student to read their notebook on the left. It is all they will have in the quiz.',
    when: s => s.turns >= 2,
  },
  {
    id: 'goals', entry: 'goals',
    text: 'The lesson goals on the right show how many students have each goal in their notes. Aim to get every goal above zero.',
    when: s => s.turns >= 3,
  },
  {
    id: 'mood', entry: 'class-mood',
    text: 'The class is drifting. Ask a question, call on someone, or give an example to wake them up.',
    when: s => ['restless', 'lost'].includes(atmosphere(s).mood),
  },
  {
    id: 'beliefs', entry: 'wrong-beliefs',
    text: 'Some students still hold wrong beliefs (red in their notebook). Say clearly what is wrong and why, or they answer the quiz with it.',
    when: s => s.turns >= 4 && s.students.some(st => st.beliefs.length > 0),
  },
  {
    id: 'ask', entry: 'asking',
    text: 'Check understanding: end a sentence with a question mark, or put a student\'s name in it, and someone answers.',
    when: s => s.turns >= 5,
  },
  {
    id: 'bell', entry: 'bell',
    text: 'When every goal is covered, ring the bell. There is no bonus for using all the turns.',
    when: s => s.turns >= 10,
  },
];

export function nextTip(state: LessonState, seen: string[]): Tip | null {
  return TIPS.find(t => !seen.includes(t.id) && t.when(state)) ?? null;
}
