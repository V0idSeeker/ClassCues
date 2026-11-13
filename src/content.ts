import mod from '../content/modules/python-intro.json';
import pool from '../content/students.json';
import type { Chapter, Look, Persona } from './game/types';

export const builtInChapter = mod.chapters[0] as unknown as Chapter;

const DEFAULT_LOOK: Look = { hair: 'short', hairColor: '#2b2330', skin: '#e8b98f', shirt: '#3f7fd1', glasses: false };

/**
 * Every built-in student, from content/students.json. Add a student there and they join the pool.
 * "look" and "voice" are optional in the file: a missing look is a plain one, a missing voice follows the student's position.
 */
export const studentPool: Persona[] = (pool as unknown as (Omit<Persona, 'look' | 'voice'> & { look?: Partial<Look>; voice?: number })[])
  .map((p, i) => ({ ...p, look: { ...DEFAULT_LOOK, ...p.look }, voice: p.voice ?? i }));

/** The original ten, in a fixed order: used by tests and scripted lessons. */
export const students = studentPool.slice(0, 10);
