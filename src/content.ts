import mod from '../content/modules/python-intro.json';
import pool from '../content/students.json';
import type { Chapter, Persona } from './game/types';

export const builtInChapter = mod.chapters[0] as unknown as Chapter;
export const students = pool as unknown as Persona[];
