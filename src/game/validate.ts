import { t } from '../i18n';
import type { Chapter } from './types';

const isObj =(v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const isText = (v: unknown, max: number): v is string => typeof v === 'string' && v.trim().length > 0 && v.length <= max;

/** Keeps only the known fields of a validated chapter and gives it an id. Call after validateChapter passed. */
export function normalizeChapter(c: Chapter, id: string): Chapter {
  return {
    format: 1,
    id,
    title: c.title.trim(),
    objectives: c.objectives.map(o => ({ id: o.id, text: o.text })),
    reference: c.reference,
    common_misconceptions: [...c.common_misconceptions],
    ...(typeof c.course === 'string' && c.course.trim() ? { course: c.course.trim().slice(0, 200) } : {}),
    ...(typeof c.part === 'number' && c.part > 0 ? { part: Math.floor(c.part) } : {}),
    quiz: c.quiz.map(q => ({
      id: q.id,
      type: q.type,
      objective: q.objective,
      prompt: q.prompt,
      ...(q.type === 'mcq' ? { choices: q.choices } : {}),
      answer_key: q.answer_key,
      ...(q.rubric ? { rubric: q.rubric } : {}),
    })),
  };
}

/** Several lessons in one file, for sharing a whole course. */
export function packLessons(lessons: Chapter[]): { format: 1; lessons: Chapter[] } {
  return { format: 1, lessons };
}

/**
 * Reads a shared file: one lesson, a list of lessons, or a pack made by packLessons.
 * Every lesson is checked like a generated one, and gets a new id. A problem in any lesson rejects the file.
 */
export function unpackLessons(data: unknown, newId: (position: number) => string): { lessons: Chapter[]; problem: string | null } {
  const list: unknown[] = Array.isArray(data) ? data : isObj(data) && Array.isArray(data.lessons) ? data.lessons : [data];
  if (list.length === 0) return { lessons: [], problem: t('validate.empty') };
  if (list.length > 100) return { lessons: [], problem: t('validate.tooMany') };
  const lessons: Chapter[] = [];
  for (const [i, item] of list.entries()) {
    const found = validateChapter(item);
    if (found.length > 0) return { lessons: [], problem: list.length > 1 ? t('validate.inLesson', { n: i + 1, problem: found[0] }) : found[0] };
    lessons.push(normalizeChapter(item as Chapter, newId(i)));
  }
  return { lessons, problem: null };
}

/** Returns a list of problems. An empty list means the chapter is safe to play. */
export function validateChapter(c: unknown): string[] {
  if (!isObj(c)) return [t('validate.notChapter')];
  const problems: string[] = [];
  if (!isText(c.title, 200)) problems.push(t('validate.title'));
  if (!isText(c.reference, 6000)) problems.push(t('validate.reference'));

  const objectives = Array.isArray(c.objectives) ? c.objectives : [];
  if (objectives.length < 1 || objectives.length > 8) problems.push(t('validate.objectives'));
  const ids = new Set<string>();
  for (const o of objectives) {
    if (!isObj(o) || !isText(o.id, 40) || !isText(o.text, 300)) problems.push(t('validate.objective'));
    else ids.add(o.id);
  }

  const beliefs = Array.isArray(c.common_misconceptions) ? c.common_misconceptions : null;
  if (!beliefs || beliefs.some(b => !isText(b, 300))) problems.push(t('validate.beliefs'));

  const quiz = Array.isArray(c.quiz) ? c.quiz : [];
  if (quiz.length < 1 || quiz.length > 10) problems.push(t('validate.quiz'));
  for (const q of quiz) {
    if (!isObj(q) || !isText(q.id, 40)) { problems.push(t('validate.noId')); continue; }
    const id = { id: q.id };
    if (q.type !== 'mcq' && q.type !== 'short') problems.push(t('validate.type', id));
    if (!isText(q.prompt, 500)) problems.push(t('validate.prompt', id));
    if (!isText(q.answer_key, 500)) problems.push(t('validate.answer', id));
    if (typeof q.objective !== 'string' || !ids.has(q.objective)) problems.push(t('validate.goal', id));
    if (q.type === 'mcq') {
      const choices = Array.isArray(q.choices) ? q.choices : [];
      if (choices.length < 2 || choices.some(x => !isText(x, 200))) problems.push(t('validate.choices', id));
      else if (!choices.includes(q.answer_key)) problems.push(t('validate.notChoice', id));
    }
  }
  return problems;
}
