// The teacher's own check: while the class takes the quiz, the teacher answers a few of its questions from memory.
// Teaching only helps the teacher learn when they recall it themselves, so this measures the teacher, not the class.
import { gradeMcq } from './quiz';
import type { Rng } from './rng';
import type { Ai, Chapter, QuizQuestion } from './types';

export const TICKET_MCQ = 2;
export const TICKET_WRITTEN = 1;

/** Up to two multiple-choice and one written question, on different goals where possible. */
export function pickTicket(chapter: Chapter, rng: Rng): QuizQuestion[] {
  const shuffled = [...chapter.quiz].map(q => ({ q, k: rng() })).sort((a, b) => a.k - b.k).map(x => x.q);
  const out: QuizQuestion[] = [];
  const take = (type: QuizQuestion['type'], n: number) => {
    const pool = shuffled.filter(q => q.type === type && !out.includes(q));
    // Prefer goals not asked yet.
    pool.sort((a, b) => Number(out.some(o => o.objective === a.objective)) - Number(out.some(o => o.objective === b.objective)));
    out.push(...pool.slice(0, n));
  };
  take('mcq', TICKET_MCQ);
  take('short', TICKET_WRITTEN);
  return chapter.quiz.filter(q => out.includes(q));
}

export interface TicketItem { question: QuizQuestion; answer: string; fraction: number; feedback: string }
export interface TicketResult { items: TicketItem[]; percent: number }

/** Grades the teacher's answers: multiple choice in code, written answers by the grader (one call each). A failed call scores 0 with a note. */
export async function gradeTicket(questions: QuizQuestion[], answers: Record<string, string>, ai: Ai, failed: string): Promise<TicketResult> {
  const items: TicketItem[] = [];
  for (const q of questions) {
    const answer = (answers[q.id] ?? '').trim();
    if (q.type === 'mcq') {
      const g = gradeMcq('you', q, answer);
      items.push({ question: q, answer, fraction: g.fraction, feedback: g.feedback });
      continue;
    }
    if (!answer) { items.push({ question: q, answer, fraction: 0, feedback: '' }); continue; }
    try {
      const r = await ai.grader(q, [{ student_id: 'you', answer, notes: [] }]);
      const row = r.results[0];
      const fraction = row && row.max > 0 ? Math.min(1, Math.max(0, row.score / row.max)) : 0;
      items.push({ question: q, answer, fraction, feedback: row?.feedback ?? failed });
    } catch {
      items.push({ question: q, answer, fraction: 0, feedback: failed });
    }
  }
  const percent = items.length ? Math.round((100 * items.reduce((n, i) => n + i.fraction, 0)) / items.length) : 0;
  return { items, percent };
}
