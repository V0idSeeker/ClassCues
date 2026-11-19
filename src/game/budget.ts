import type { QuizQuestion } from './types';

/** Requests after the quiz: the fact check, one student explaining the lesson back, and judging the challenge. */
/** Fact check, explain-back, challenge judge, and the teacher's own written question. */
export const AFTER_QUIZ_REQUESTS = 4;

/** Requests the bell needs: one per student, one grading call per written question, and the after-quiz requests. */
export function quizReserve(studentCount: number, quiz: QuizQuestion[]): number {
  return studentCount + quiz.filter(q => q.type === 'short').length + AFTER_QUIZ_REQUESTS;
}

/** dailyLimit 0 means no limit (credit or a local model). */
export function mustRingBell(used: number, dailyLimit: number, reserve: number): boolean {
  return dailyLimit > 0 && dailyLimit - used <= reserve;
}
