import { describe, expect, it, vi } from 'vitest';
import { builtInChapter } from '../content';
import { gradeTicket, pickTicket } from './ticket';
import type { Ai } from './types';

describe('the teacher\'s own questions', () => {
  it('picks two multiple-choice and one written question from the quiz, in quiz order', () => {
    const qs = pickTicket(builtInChapter, () => 0.5);
    expect(qs.filter(q => q.type === 'mcq')).toHaveLength(2);
    expect(qs.filter(q => q.type === 'short')).toHaveLength(1);
    const order = builtInChapter.quiz.map(q => q.id);
    expect(qs.map(q => order.indexOf(q.id))).toEqual([...qs.map(q => order.indexOf(q.id))].sort((a, b) => a - b));
  });

  it('grades multiple choice in code and written answers with one grader call each', async () => {
    const qs = pickTicket(builtInChapter, () => 0.5);
    const mcq = qs.find(q => q.type === 'mcq')!;
    const written = qs.find(q => q.type === 'short')!;
    const grader = vi.fn(async () => ({ results: [{ student_id: 'you', score: 1, max: 2, supported_by_notes: false, feedback: 'Half.' }] }));
    const out = await gradeTicket(qs, { [mcq.id]: mcq.answer_key, [written.id]: 'something' }, { grader } as unknown as Ai, 'failed');
    expect(grader).toHaveBeenCalledTimes(1);
    expect(out.items.find(i => i.question.id === mcq.id)!.fraction).toBe(1);
    expect(out.items.find(i => i.question.id === written.id)!.fraction).toBe(0.5);
  });

  it('a blank written answer costs no call, and a failed call scores 0 with a note', async () => {
    const written = pickTicket(builtInChapter, () => 0.5).filter(q => q.type === 'short');
    const grader = vi.fn(async () => { throw new Error('down'); });
    const blank = await gradeTicket(written, {}, { grader } as unknown as Ai, 'failed');
    expect(grader).not.toHaveBeenCalled();
    expect(blank.percent).toBe(0);
    const failed = await gradeTicket(written, { [written[0].id]: 'x' }, { grader } as unknown as Ai, 'failed');
    expect(failed.items[0]).toMatchObject({ fraction: 0, feedback: 'failed' });
  });
});
