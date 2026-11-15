import { coverage, hasObjective } from './lesson';
import type { Answer, Grade } from './quiz';
import type { FactError, LessonState, Objective, Student } from './types';

export interface Report {
  classAverage: number;
  students: { id: string; name: string; percent: number; answers: { question_id: string; answer: string; fraction: number; feedback: string }[] }[];
  objectives: { id: string; text: string; inNotes: number; quizAverage: number | null }[];
  tips: string[];
}

/** What the AI added after the quiz. A null error list or text: that part could not be made. */
export interface AfterQuiz {
  /** null with checked false: the teacher said nothing, so there was nothing to check. */
  factCheck: { checked: boolean; errors: FactError[] | null };
  /** One student's explanation of the lesson, and the goals missing from their notes (computed in code). */
  explain: { name: string; text: string | null; missingGoals: string[] } | null;
  /** The lesson's challenge. met null: it could not be judged. null: the lesson had no challenge (an older save). */
  challenge: { title: string; met: boolean | null; reason: string } | null;
}

/** The student whose quiz percentage is closest to the class average; ties go to the first in class order. */
export function closestToAverage(report: Report): string | null {
  let best: Report['students'][number] | null = null;
  for (const s of report.students) {
    if (!best || Math.abs(s.percent - report.classAverage) < Math.abs(best.percent - report.classAverage)) best = s;
  }
  return best?.id ?? null;
}

/** The goals a student has no undistorted note on. */
export function missingGoals(student: Student, objectives: Objective[]): string[] {
  return objectives.filter(o => !hasObjective(student, o.id)).map(o => o.text);
}

const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
const pct = (x: number) => Math.round(x * 100);

const GENERAL_TIPS = [
  'Ask the class a question mid-lesson to check what they understood.',
  'Write key points on the board: students copy what they see.',
  'Call on a quiet student: silence does not mean understanding.',
];

export function computeReport(state: LessonState, answers: Record<string, Answer[]>, grades: Grade[]): Report {
  const quiz = state.chapter.quiz;
  const gradeOf = (sid: string, qid: string) => grades.find(g => g.student_id === sid && g.question_id === qid);

  const students = state.students.map(s => {
    const rows = quiz.map(q => ({
      question_id: q.id,
      answer: answers[s.persona.id]?.find(a => a.question_id === q.id)?.answer ?? '',
      fraction: gradeOf(s.persona.id, q.id)?.fraction ?? 0,
      feedback: gradeOf(s.persona.id, q.id)?.feedback ?? 'Not graded.',
    }));
    return { id: s.persona.id, name: s.persona.name, percent: pct(mean(rows.map(r => r.fraction))), answers: rows };
  });

  const inNotes = coverage(state);
  const objectives = state.chapter.objectives.map(o => {
    const questionIds = quiz.filter(q => q.objective === o.id).map(q => q.id);
    const fractions = students.flatMap(s => s.answers.filter(a => questionIds.includes(a.question_id)).map(a => a.fraction));
    return { id: o.id, text: o.text, inNotes: inNotes[o.id], quizAverage: fractions.length ? pct(mean(fractions)) : null };
  });

  const n = state.students.length;
  const tips: string[] = [];

  for (const o of objectives) {
    if (o.inNotes === 0) tips.push(`No student has "${o.text}" in their notes. You did not teach it, or nobody caught it.`);
  }

  const hardest = quiz
    .map(q => ({ q, full: students.filter(s => (s.answers.find(a => a.question_id === q.id)?.fraction ?? 0) >= 0.99).length }))
    .sort((a, b) => a.full - b.full)[0];
  if (hardest && hardest.full < n / 2) tips.push(`Only ${hardest.full}/${n} students got full marks on: "${hardest.q.prompt}"`);

  const held = new Map<string, number>();
  for (const s of state.students) for (const b of s.beliefs) held.set(b.text, (held.get(b.text) ?? 0) + 1);
  for (const [text, k] of held) tips.push(`${k} student${k > 1 ? 's still believe' : ' still believes'}: "${text}". Say clearly why it is wrong.`);

  // The note-taker marks hearsay as a distorted note that starts with "<name> said:".
  const hearsay = state.students.filter(s => s.notes.some(n => n.distorted && /\bsaid:/i.test(n.text))).length;
  if (hearsay) tips.push(`${hearsay} student${hearsay > 1 ? 's' : ''} wrote down what a classmate said without knowing if it was right. Confirm or correct answers out loud.`);

  const hands = state.students.filter(s => s.handUp).map(s => s.persona.name);
  if (hands.length) tips.push(`${hands.join(', ')} still had a hand up at the bell.`);

  tips.push(...GENERAL_TIPS);

  return { classAverage: pct(mean(students.map(s => s.percent / 100))), students, objectives, tips: tips.slice(0, 3) };
}
