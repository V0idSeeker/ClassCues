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

  it('warns when students wrote down a classmate\u2019s unconfirmed claim', () => {
    const noted = {
      ...state,
      students: state.students.map(s => ({
        ...s,
        notes: [
          ...state.chapter.objectives.map(o => ({ text: 'ok', objective: o.id, distorted: false })),
          ...(s.persona.id === 'ben' || s.persona.id === 'leo' ? [{ text: 'Tom said: variables never change', objective: null, distorted: true }] : []),
        ],
        beliefs: [],
      })),
    };
    const grades = noted.students.flatMap(s => noted.chapter.quiz.map(q => ({ student_id: s.persona.id, question_id: q.id, fraction: 1, feedback: 'Correct.' })));
    expect(computeReport(noted, {}, grades).tips[0]).toContain('2 students wrote down what a classmate said');
  });

  it('gives 100% to a student with full marks on every question', () => {
    const grades: Grade[] = builtInChapter.quiz.map(q => ({ student_id: 'aisha', question_id: q.id, fraction: 1, feedback: 'Correct.' }));
    const r = computeReport(state, { aisha: builtInChapter.quiz.map(q => ({ question_id: q.id, answer: 'x', byCode: false })) }, grades);
    expect(r.students.find(s => s.id === 'aisha')!.percent).toBe(100);
    expect(r.classAverage).toBe(10);
    expect(r.objectives.find(o => o.id === 'obj-2')!.quizAverage).toBe(10);
  });
});
