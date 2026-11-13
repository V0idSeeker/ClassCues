import { hasObjective } from './lesson';
import { pick } from './rng';
import type { Rng } from './rng';
import type { GraderRow, QuizQuestion, Student } from './types';

export interface Answer { question_id: string; answer: string; byCode: boolean }
export interface Grade { student_id: string; question_id: string; fraction: number; feedback: string }

/**
 * Knowledge gating for multiple choice: a student with no note on the question's
 * objective gets a random pick by code, so the model cannot answer from its own knowledge.
 */
export function planQuiz(student: Student, quiz: QuizQuestion[], rng: Rng): { ask: QuizQuestion[]; coded: Answer[] } {
  const ask: QuizQuestion[] = [];
  const coded: Answer[] = [];
  for (const q of quiz) {
    if (q.type === 'mcq' && q.choices && !hasObjective(student, q.objective)) {
      coded.push({ question_id: q.id, answer: pick(q.choices, rng), byCode: true });
    } else {
      ask.push(q);
    }
  }
  return { ask, coded };
}

const same = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();

export function gradeMcq(studentId: string, q: QuizQuestion, answer: string): Grade {
  const right = same(answer, q.answer_key);
  return {
    student_id: studentId,
    question_id: q.id,
    fraction: right ? 1 : 0,
    feedback: right ? 'Correct.' : `Chose "${answer.trim() || 'nothing'}". The answer was "${q.answer_key}".`,
  };
}

/** A correct answer the notebook does not support gets at most half credit. */
export function gradeWritten(q: QuizQuestion, row: GraderRow): Grade {
  const raw = row.max > 0 ? Math.min(1, Math.max(0, row.score / row.max)) : 0;
  return {
    student_id: row.student_id,
    question_id: q.id,
    fraction: row.supported_by_notes ? raw : Math.min(raw, 0.5),
    feedback: row.feedback,
  };
}

/** The part of a question a student is allowed to see. */
export function publicQuestion(q: QuizQuestion): { id: string; type: string; prompt: string; choices?: string[] } {
  return { id: q.id, type: q.type, prompt: q.prompt, ...(q.choices ? { choices: q.choices } : {}) };
}
