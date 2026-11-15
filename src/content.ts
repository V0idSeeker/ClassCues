import dataStructures from '../content/modules/data-structures.json';
import pythonMore from '../content/modules/python-intro-2.json';
import python from '../content/modules/python-intro.json';
import sql from '../content/modules/sql.json';
import pool from '../content/students.json';
import type { Chapter, Look, Persona } from './game/types';
import type { Lang } from './i18n';
import { openingAr } from './i18n/students/ar';
import { openingEs } from './i18n/students/es';
import { openingFr } from './i18n/students/fr';

/**
 * The lesson files that ship with the game, in the order they are shown.
 * To add a course: put a file in content/modules and add it to this list. Files with the same "title" form one course.
 */
const MODULES = [python, pythonMore, dataStructures, sql] as unknown as { title: string; chapters: Chapter[] }[];

/** The first built-in lesson (Python: Variables). Used by tests and scripted lessons. */
export const builtInChapter = MODULES[0].chapters[0];

/** Built-in courses, each with its lessons in order. */
export const builtInCourses: { name: string; lessons: Chapter[] }[] = [];
for (const module of MODULES) {
  let course = builtInCourses.find(c => c.name === module.title);
  if (!course) {
    course = { name: module.title, lessons: [] };
    builtInCourses.push(course);
  }
  for (const lesson of module.chapters) course.lessons.push({ ...lesson, course: module.title, part: course.lessons.length + 1 });
}

const DEFAULT_LOOK: Look = { hair: 'short', hairColor: '#2b2330', skin: '#e8b98f', shirt: '#3f7fd1', glasses: false };

/**
 * Every built-in student, from content/students.json. Add a student there and they join the pool.
 * "look" and "voice" are optional in the file: a missing look is a plain one, a missing voice follows the student's position.
 */
export const studentPool: Persona[] = (pool as unknown as (Omit<Persona, 'look' | 'voice'> & { look?: Partial<Look>; voice?: number })[])
  .map((p, i) => ({ ...p, look: { ...DEFAULT_LOOK, ...p.look }, voice: p.voice ?? i }));

/** The original ten, in a fixed order: used by tests and scripted lessons. */
export const students = studentPool.slice(0, 10);

/** Ids of every built-in lesson. Their content (goals, notes, quiz) is in English. */
export const builtInIds = new Set(builtInCourses.flatMap(c => c.lessons.map(l => l.id)));

/** True for a built-in lesson, or a follow-up of one. */
export const isBuiltIn = (c: Chapter): boolean => builtInIds.has(c.followUpOf ?? c.id);

const OPENING: Record<Lang, Record<string, string[]>> = { en: {}, fr: openingFr, es: openingEs, ar: openingAr };

/** A student who says their opening line in the language. */
export const inLanguage = (p: Persona, lang: Lang): Persona => ({ ...p, openingLines: OPENING[lang][p.id] ?? p.openingLines });
