import { describe, expect, it } from 'vitest';
import { builtInChapter, students } from '../content';
import { startLesson } from './lesson';
import type { Grade } from './quiz';
import { closestToAverage, computeReport, lessonScore, missingGoals, mistakePenalty } from './report';
import type { Report } from './report';

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

describe('after the quiz', () => {
  const row = (id: string, percent: number) => ({ id, name: id, percent, answers: [] });
  const report = (classAverage: number, ...students: Report['students']): Report => ({ classAverage, students, objectives: [], tips: [] });

  it('picks the student closest to the class average, the first one on a tie', () => {
    expect(closestToAverage(report(50, row('a', 90), row('b', 45), row('c', 60)))).toBe('b');
    expect(closestToAverage(report(50, row('a', 40), row('b', 60), row('c', 40)))).toBe('a');
    expect(closestToAverage(report(0))).toBeNull();
  });

  it('lists the goals a student has no undistorted note on', () => {
    const [o1, o2] = builtInChapter.objectives;
    const s = { ...state.students[0], notes: [{ text: 'a', objective: o1.id, distorted: false }, { text: 'b', objective: o2.id, distorted: true }] };
    const missing = missingGoals(s, builtInChapter.objectives);
    expect(missing).not.toContain(o1.text);
    expect(missing).toContain(o2.text);
    expect(missing).toHaveLength(builtInChapter.objectives.length - 1);
  });
});

describe('lesson score', () => {
  const major = { claim: 'A', correction: 'a', severity: 'major' as const };
  const minor = { claim: 'B', correction: 'b', severity: 'minor' as const };
  it('takes 5 points per major mistake and 2 per minor one, at most 15', () => {
    expect(mistakePenalty([])).toBe(0);
    expect(mistakePenalty([major, minor])).toBe(7);
    expect(mistakePenalty([major, major, major, major])).toBe(15);
  });
  it('does not count disputed mistakes, and never goes below 0', () => {
    expect(lessonScore(80, [major, minor], ['A'])).toBe(78);
    expect(lessonScore(3, [major])).toBe(0);
  });
});
