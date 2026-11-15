import { describe, expect, it } from 'vitest';
import { builtInChapter, students } from '../content';
import { applyNotes, startLesson } from './lesson';
import { gradeMcq, gradeWritten, planQuiz, publicQuestion } from './quiz';

const quiz = builtInChapter.quiz;
const fresh = () => startLesson(builtInChapter, students, () => 0.5, 0);

describe('planQuiz', () => {
  it('answers multiple choice by random pick when the student has no note on the objective', () => {
    const plan = planQuiz(fresh().students[0], quiz, () => 0);
    expect(plan.coded.map(a => a.question_id)).toEqual(['q1', 'q2', 'q4']);
    expect(plan.coded[0]).toEqual({ question_id: 'q1', answer: quiz[0].choices![0], byCode: true });
    expect(plan.ask.map(q => q.id)).toEqual(['q3', 'q5', 'q6']);
  });

  it('asks the model when the student has a note on the objective', () => {
    const s = applyNotes(fresh(), { students: [{ id: 'aisha', new_notes: [{ text: 'a variable stores a value', objective: 'obj-1', distorted: false }], beliefs_dropped: [], emotion: 'HAPPY' }] }, () => 0);
    const plan = planQuiz(s.students.find(x => x.persona.id === 'aisha')!, quiz, () => 0);
    expect(plan.ask.map(q => q.id)).toContain('q1');
    expect(plan.coded.map(a => a.question_id)).toEqual(['q2', 'q4']);
  });
});

describe('grading', () => {
  it('grades multiple choice ignoring case and spaces', () => {
    expect(gradeMcq('aisha', quiz[0], '  a name that stores a VALUE ').fraction).toBe(1);
    expect(gradeMcq('aisha', quiz[0], 'A kind of loop').fraction).toBe(0);
    expect(gradeMcq('aisha', quiz[0], '').fraction).toBe(0);
  });

  it('caps a written answer at half credit when the notes do not support it', () => {
    const row = { student_id: 'aisha', score: 2, max: 2, supported_by_notes: false, feedback: 'ok' };
    expect(gradeWritten(quiz[2], row).fraction).toBe(0.5);
    expect(gradeWritten(quiz[2], { ...row, supported_by_notes: true }).fraction).toBe(1);
  });

  it('Inspection marking: a right answer the notes do not support gets nothing', () => {
    const row = { student_id: 'aisha', score: 2, max: 2, supported_by_notes: false, feedback: 'ok' };
    expect(gradeWritten(quiz[2], row, true).fraction).toBe(0);
    expect(gradeWritten(quiz[2], { ...row, supported_by_notes: true }, true).fraction).toBe(1);
  });

  it('survives odd grader numbers', () => {
    const row = { student_id: 'aisha', score: 5, max: 2, supported_by_notes: true, feedback: '' };
    expect(gradeWritten(quiz[2], row).fraction).toBe(1);
    expect(gradeWritten(quiz[2], { ...row, max: 0 }).fraction).toBe(0);
    expect(gradeWritten(quiz[2], { ...row, score: -1 }).fraction).toBe(0);
  });
});

describe('publicQuestion', () => {
  it('never exposes the answer key or the rubric', () => {
    const text = JSON.stringify(quiz.map(publicQuestion));
    expect(text).not.toContain('answer_key');
    expect(text).not.toContain('rubric');
    expect(text).toContain('A kind of loop');
  });
});
