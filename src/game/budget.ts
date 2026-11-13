import type { QuizQuestion } from './types';

/** Requests the quiz needs: one per student, plus one grading call per written question. */
export function quizReserve(studentCount: number, quiz: QuizQuestion[]): number {
  return studentCount + quiz.filter(q => q.type === 'short').length;
}

/** dailyLimit 0 means no limit (credit or a local model). */
export function mustRingBell(used: number, dailyLimit: number, reserve: number): boolean {
  return dailyLimit > 0 && dailyLimit - used <= reserve;
}
