import { describe, expect, it } from 'vitest';
import { builtInChapter, students } from '../content';
import { startLesson } from './lesson';
import type { Grade } from './quiz';
import { computeReport } from './report';

const state = startLesson(builtInChapter, students, () => 0.5, 0);

describe('computeReport', () => {
  it('scores an untaught class at zero and says what was never taught', () => {
    const r = computeReport(state, {}, []);
    expect(r.classAverage).toBe(0);
    expect(r.students).toHaveLength(10);
    expect(r.objectives.every(o => o.inNotes === 0)).toBe(true);
    expect(r.tips).toHaveLength(3);
    expect(r.tips[0]).toContain(builtInChapter.objectives[0].text);
  });

  it('gives 100% to a student with full marks on every question', () => {
    const grades: Grade[] = builtInChapter.quiz.map(q => ({ student_id: 'aisha', question_id: q.id, fraction: 1, feedback: 'Correct.' }));
    const r = computeReport(state, { aisha: builtInChapter.quiz.map(q => ({ question_id: q.id, answer: 'x', byCode: false })) }, grades);
    expect(r.students.find(s => s.id === 'aisha')!.percent).toBe(100);
    expect(r.classAverage).toBe(10);
    expect(r.objectives.find(o => o.id === 'obj-2')!.quizAverage).toBe(10);
  });
});
