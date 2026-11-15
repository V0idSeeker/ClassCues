// A short correction lesson after the report: the goals the class missed and the wrong beliefs it is left with.

import { DICTS, t } from '../i18n';
import type { Report } from './report';
import type { Chapter, FactError, LessonState } from './types';

/** A goal is missed when no student has it in their notes, or the class averaged under 50% on its questions. */
export function missedGoalIds(objectives: Report['objectives']): string[] {
  return objectives.filter(o => o.inNotes === 0 || (o.quizAverage !== null && o.quizAverage < 50)).map(o => o.id);
}

/**
 * The wrong beliefs each student (by id) takes into the follow-up: the chapter's misconceptions they still held
 * at the bell, plus every mistake the fact check found, since the whole class heard the teacher say it.
 */
export function heldAtBell(state: LessonState, errors: FactError[]): Record<string, string[]> {
  const claims = errors.map(e => e.claim);
  const own = new Set(state.chapter.common_misconceptions);
  return Object.fromEntries(state.students.map(s => [
    s.persona.id,
    [...new Set([...s.beliefs.map(b => b.text).filter(t => own.has(t)), ...claims])],
  ]));
}

/** A follow-up's title without its follow-up suffix, in whichever language it was made. */
function baseTitle(title: string): string {
  for (const dict of Object.values(DICTS)) {
    const [before, after] = String(dict['followup.title']).split('{title}');
    if (title.startsWith(before) && title.endsWith(after) && title.length > before.length + after.length) return title.slice(before.length, title.length - after.length);
  }
  return title;
}

/**
 * The follow-up lesson, or null when there is nothing to fix.
 * Goals: the missed ones; all of them if none was missed but the teaching had mistakes. Quiz: the questions on those goals.
 * Wrong beliefs: every belief some student still holds (from heldAtBell).
 */
export function followUpChapter(chapter: Chapter, objectives: Report['objectives'], held: Record<string, string[]>, errors: FactError[]): Chapter | null {
  const missed = missedGoalIds(objectives);
  if (missed.length === 0 && errors.length === 0) return null;
  let goals = missed.length ? chapter.objectives.filter(o => missed.includes(o.id)) : chapter.objectives;
  let quiz = chapter.quiz.filter(q => goals.some(o => o.id === q.objective));
  // ponytail: the missed goals have no quiz question; teach and test the whole lesson rather than an empty quiz.
  if (quiz.length === 0) { goals = chapter.objectives; quiz = chapter.quiz; }
  const base = chapter.followUpOf ? baseTitle(chapter.title) : chapter.title;
  return {
    ...chapter,
    id: `${chapter.id}-followup`,
    title: t('followup.title', { title: base }),
    objectives: goals,
    quiz,
    common_misconceptions: [...new Set(Object.values(held).flat())],
    part: undefined,
    followUpOf: chapter.followUpOf ?? chapter.id,
  };
}
