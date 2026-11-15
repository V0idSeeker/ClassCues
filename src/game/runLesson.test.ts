import { describe, expect, it, vi } from 'vitest';
import { builtInChapter, students } from '../content';
import { patchStudent, startLesson } from './lesson';
import { askStudent, hearStudent, namedStudent, pickForClassQuestion, runQuiz, teachTurn } from './runLesson';
import type { Ai } from './types';

const start = () => startLesson(builtInChapter, students, () => 0.5, 0);

function fakeAi(over: Partial<Ai> = {}): Ai {
  return {
    noteTaker: vi.fn(async s => ({
      students: s.students.map(st => ({ id: st.persona.id, new_notes: [{ text: 'a variable stores a value', objective: 'obj-1', distorted: false }], beliefs_dropped: [], emotion: 'HAPPY' as const })),
    })),
    reaction: vi.fn(async () => ({ wants_to_speak: true, message: 'Can I call it pizza?', emotion: 'CURIOUS' as const })),
    answer: vi.fn(async () => ({ answer: 'It stores a value?', emotion: 'NEUTRAL' as const })),
    quizTaker: vi.fn(async (_s, qs) => ({ answers: qs.map(q => ({ question_id: q.id, answer: 'It stores a value' })) })),
    grader: vi.fn(async (_q, rows) => ({ results: rows.map(r => ({ student_id: r.student_id, score: 1, max: 2, supported_by_notes: true, feedback: 'Half right.' })) })),
    ...over,
  };
}

describe('teachTurn', () => {
  it('uses a turn, records the speech and gives every student notes', async () => {
    const ai = fakeAi();
    const out = await teachTurn(start(), { say: 'A variable is a name that stores a value.', board: '' }, ai, () => 0, 1000, 0);
    expect(out.state.turns).toBe(1);
    expect(out.state.transcript.at(-1)).toEqual({ who: 'teacher', text: 'A variable is a name that stores a value.' });
    expect(out.state.students.every(s => s.notes.length === 1 && s.emotion === 'HAPPY')).toBe(true);
    expect(out.reactedAt).toBeNull();
  });

  it('sends only the new board lines and remembers the board', async () => {
    const ai = fakeAi();
    const first = await teachTurn(start(), { say: '', board: 'x = 5' }, ai, () => 0, 1000, 0);
    await teachTurn(first.state, { say: '', board: 'x = 5\ny = 2' }, ai, () => 0, 2000, 0);
    expect((ai.noteTaker as ReturnType<typeof vi.fn>).mock.calls[1][1]).toBe('y = 2');
    expect(first.state.board).toBe('x = 5');
    expect(first.state.transcript.at(-1)).toEqual({ who: 'board', text: 'x = 5' });
  });

  it('changing to another board costs no turn, and only text the class has not seen is new', async () => {
    const ai = fakeAi();
    const first = await teachTurn(start(), { say: '', board: 'x = 5', pages: ['x = 5'], page: 0 }, ai, () => 0, 1000, 0);
    const flipped = await teachTurn(first.state, { say: '', board: 'x = 5\n', pages: ['x = 5', ''], page: 1 }, ai, () => 0, 2000, 0);
    expect(flipped.state).toMatchObject({ turns: 1, boardPages: ['x = 5', ''], boardPage: 1 });
    expect(ai.noteTaker).toHaveBeenCalledTimes(1);
    const written = await teachTurn(flipped.state, { say: '', board: 'x = 5\ny = 2', pages: ['x = 5', 'y = 2'], page: 1 }, ai, () => 0, 3000, 0);
    expect((ai.noteTaker as ReturnType<typeof vi.fn>).mock.calls[1][1]).toBe('y = 2');
    const back = await teachTurn(written.state, { say: '', board: 'x = 5\ny = 2', pages: ['x = 5', 'y = 2'], page: 0 }, ai, () => 0, 4000, 0);
    expect(back.state).toMatchObject({ turns: 2, boardPage: 0 });
    expect(ai.noteTaker).toHaveBeenCalledTimes(2);
  });

  it('treats a new picture description as something new on the board', async () => {
    const ai = fakeAi();
    const first = await teachTurn(start(), { say: '', board: 'x = 5', pages: ['x = 5'], page: 0, captions: [''] }, ai, () => 0, 1000, 0);
    const described = await teachTurn(first.state, { say: '', board: 'x = 5\nPicture on the board: a box named x holding 5', pages: ['x = 5'], page: 0, captions: ['a box named x holding 5'] }, ai, () => 0, 2000, 0);
    expect((ai.noteTaker as ReturnType<typeof vi.fn>).mock.calls[1][1]).toBe('Picture on the board: a box named x holding 5');
    expect(described.state).toMatchObject({ turns: 2, boardPages: ['x = 5'], boardCaptions: ['a box named x holding 5'] });
    expect((await teachTurn(start(), { say: 'hi', board: '' }, ai, () => 0, 1000, 0)).state.boardCaptions).toEqual(['']);
  });

  it('shows the class a new picture once: it counts as something new the first time only', async () => {
    const ai = fakeAi();
    const pic = 'data:image/jpeg;base64,' + 'A'.repeat(80);
    const first = await teachTurn(start(), { say: '', board: '', picture: pic }, ai, () => 0, 1000, 0);
    expect(first.state).toMatchObject({ turns: 1, boardPicture: pic });
    expect(first.state.transcript.at(-1)).toEqual({ who: 'board', text: '(a new picture)' });
    expect((ai.noteTaker as ReturnType<typeof vi.fn>).mock.calls[0][3]).toBe(pic);
    const again = await teachTurn(first.state, { say: '', board: '', picture: pic }, ai, () => 0, 2000, 0);
    expect(again.state.turns).toBe(1);
    expect(ai.noteTaker).toHaveBeenCalledTimes(1);
    const spoken = await teachTurn(first.state, { say: 'Look at the box.', board: '', picture: pic }, ai, () => 0, 3000, 0);
    expect((ai.noteTaker as ReturnType<typeof vi.fn>).mock.calls[1][3]).toBeNull();
    expect(spoken.state.boardPicture).toBe(pic);
    const hidden = await teachTurn(spoken.state, { say: '', board: '' }, ai, () => 0, 4000, 0);
    expect(hidden.state.boardPicture).toBeNull();
  });

  it('costs no turn and no request when nothing new was said or written', async () => {
    const ai = fakeAi();
    const s = { ...start(), board: 'x = 5\ny = 2' };
    const out = await teachTurn(s, { say: '  ', board: 'x = 5' }, ai, () => 0, 1000, 0);
    expect(out.state.turns).toBe(0);
    expect(out.state.board).toBe('x = 5');
    expect(ai.noteTaker).not.toHaveBeenCalled();
  });

  it('records one snapshot per turn: where its lines are, mood, hands and goals covered', async () => {
    const ai = fakeAi();
    const s0 = start();
    const first = await teachTurn(s0, { say: 'A variable stores a value.', board: 'x = 5' }, ai, () => 0, 1000, 0);
    expect(first.state.timeline).toEqual([{
      turn: 1, start: s0.transcript.length, end: s0.transcript.length + 2, mood: 'engaged', bored: 0, confused: 0, hands: 0, goals: 1,
    }]);
    const second = await teachTurn(first.state, { say: 'More.', board: 'x = 5' }, ai, () => 0, 10000, 0);
    expect(second.state.timeline).toHaveLength(2);
    // On the second turn one student reacts: the hand-up note is part of the turn's lines.
    expect(second.state.timeline[1]).toMatchObject({ turn: 2, start: first.state.transcript.length, end: second.state.transcript.length, hands: 1, goals: 1 });
    const same = await teachTurn(second.state, { say: ' ', board: 'x = 5' }, ai, () => 0, 20000, 0);
    expect(same.state.timeline).toHaveLength(2);
  });

  it('lets one student raise a hand on every second turn', async () => {
    const ai = fakeAi();
    const out = await teachTurn({ ...start(), turns: 1 }, { say: 'More.', board: '' }, ai, () => 0, 10000, 0);
    const up = out.state.students.filter(s => s.handUp);
    expect(up).toHaveLength(1);
    expect(up[0].pendingLine).toBe('Can I call it pizza?');
    expect(up[0].emotion).toBe('CURIOUS');
    expect(out.reactedAt).toBe(10000);
  });

  it('tells the player when a hand goes up', async () => {
    const out = await teachTurn({ ...start(), turns: 1 }, { say: 'More.', board: '' }, fakeAi(), () => 0, 10000, 0);
    expect(out.state.transcript.at(-1)).toMatchObject({ who: 'note' });
    expect(out.state.transcript.at(-1)!.text).toContain('raised a hand');
  });

  it('has a student answer aloud when the teacher asks the class a question', async () => {
    const ai = fakeAi();
    const out = await teachTurn(start(), { say: 'Who can tell me what a variable is?', board: '' }, ai, () => 0.9, 1000, 0);
    expect(out.state.transcript.slice(-2)).toEqual([
      { who: 'teacher', text: 'Who can tell me what a variable is?' },
      { who: 'Ben', text: 'It stores a value?' },
    ]);
    expect(ai.answer).toHaveBeenCalledTimes(1);
    expect(ai.reaction).not.toHaveBeenCalled();
    expect(out.state.turns).toBe(1);
  });

  it('lets the student the teacher names reply, not someone else', async () => {
    const ai = fakeAi();
    const out = await teachTurn(start(), { say: 'Go ahead Maya, ask your question.', board: '' }, ai, () => 0.9, 1000, 0);
    expect(out.state.transcript.at(-1)).toEqual({ who: 'Maya', text: 'It stores a value?' });
    expect((ai.answer as ReturnType<typeof vi.fn>).mock.calls[0][1].persona.id).toBe('maya');
  });

  it('says the waiting line of a named student with a raised hand, without an answer call', async () => {
    const ai = fakeAi();
    const s = patchStudent(start(), 'leo', { handUp: true, pendingLine: 'Can I call it pizza?' });
    const out = await teachTurn(s, { say: 'Yes Leo?', board: '' }, ai, () => 0, 1000, 0);
    expect(out.state.transcript.at(-1)).toEqual({ who: 'Leo', text: 'Can I call it pizza?' });
    expect(ai.answer).not.toHaveBeenCalled();
    expect(out.state.students.find(x => x.persona.id === 'leo')!.handUp).toBe(false);
  });

  it('finds a name as a whole word only, the first one mentioned', () => {
    const s = start();
    expect(namedStudent(s, 'tom, then Sam')!.persona.id).toBe('tom');
    expect(namedStudent(s, 'Sam and Tom')!.persona.id).toBe('sam');
    expect(namedStudent(s, 'The same atom is benign')).toBeNull();
    expect(namedStudent(s, 'What about you, Ben?')!.persona.id).toBe('ben');
  });

  it('sometimes lets a classmate react to an answer, never the student who answered', async () => {
    const ai = fakeAi();
    const out = await teachTurn(start(), { say: 'Who can tell me what a variable is?', board: '' }, ai, () => 0, 1000, 0);
    const reactor = (ai.reaction as ReturnType<typeof vi.fn>).mock.calls[0][1];
    expect(ai.reaction).toHaveBeenCalledTimes(1);
    expect(reactor.persona.id).not.toBe('aisha');
    expect(out.state.transcript.at(-2)).toEqual({ who: 'Aisha', text: 'It stores a value?' });
    expect(out.state.transcript.at(-1)!.text).toContain(`${reactor.persona.name} raised a hand`);
    expect(out.state.students.find(s => s.persona.id === reactor.persona.id)!.pendingLine).toBe('Can I call it pizza?');
  });

  it('counts what a student remembers from earlier lessons as their notes when grading', async () => {
    const ai = fakeAi();
    const s = start();
    const withMemory = { ...s, students: s.students.map(x => (x.persona.id === 'aisha' ? { ...x, memory: ['From the lesson "Old": 42 is an int'] } : x)) };
    await runQuiz(withMemory, ai, () => 0, () => {});
    const rows = (ai.grader as ReturnType<typeof vi.fn>).mock.calls[0][1];
    expect(rows.find((r: { student_id: string }) => r.student_id === 'aisha').notes).toEqual(['From the lesson "Old": 42 is an int']);
  });

  it('leaves the hand down when the student has nothing to say', async () => {
    const ai = fakeAi({ reaction: async () => ({ wants_to_speak: false, message: '', emotion: 'BORED' }) });
    const out = await teachTurn({ ...start(), turns: 1 }, { say: 'More.', board: '' }, ai, () => 0, 10000, 0);
    expect(out.state.students.some(s => s.handUp)).toBe(false);
  });
});

describe('calling on students', () => {
  it('hears a raised hand without an AI call', () => {
    const s = patchStudent(start(), 'leo', { handUp: true, pendingLine: 'Can I call it pizza?' });
    const out = hearStudent(s, 'leo');
    expect(out.transcript.at(-1)).toEqual({ who: 'Leo', text: 'Can I call it pizza?' });
    const leo = out.students.find(x => x.persona.id === 'leo')!;
    expect(leo.handUp).toBe(false);
    expect(leo.pendingLine).toBeNull();
  });

  it('asks a student a question and records both lines', async () => {
    const out = await askStudent(start(), 'maya', 'What is a variable?', fakeAi());
    expect(out.transcript.slice(-2)).toEqual([{ who: 'teacher', text: 'What is a variable?' }, { who: 'Maya', text: 'It stores a value?' }]);
    expect(out.turns).toBe(0);
  });

  it('picks a raised hand first for a class question', () => {
    const s = patchStudent(start(), 'yuki', { handUp: true, pendingLine: 'But why?' });
    expect(pickForClassQuestion(s, () => 0).persona.id).toBe('yuki');
    expect(pickForClassQuestion(start(), () => 0).persona.id).toBe('aisha');
  });
});

describe('runQuiz', () => {
  it('with no notes: sends students only the written questions and grades everything', async () => {
    const ai = fakeAi();
    const progress = vi.fn();
    const out = await runQuiz(start(), ai, () => 0, progress);
    const asked = (ai.quizTaker as ReturnType<typeof vi.fn>).mock.calls[0][1].map((q: { id: string }) => q.id);
    expect(asked).toEqual(['q3', 'q5', 'q6']);
    expect(ai.quizTaker).toHaveBeenCalledTimes(10);
    expect(ai.grader).toHaveBeenCalledTimes(3);
    expect(out.grades).toHaveLength(60);
    expect(out.answers.aisha).toHaveLength(6);
    expect(out.grades.find(g => g.student_id === 'aisha' && g.question_id === 'q3')!.fraction).toBe(0.5);
    expect(progress).toHaveBeenLastCalledWith(13, 13);
  });

  it('gives zero when the grader skips a student or the student skips a question', async () => {
    const ai = fakeAi({ quizTaker: async () => ({ answers: [] }), grader: async () => ({ results: [] }) });
    const out = await runQuiz(start(), ai, () => 0, () => {});
    expect(out.answers.aisha.find(a => a.question_id === 'q3')!.answer).toBe('');
    expect(out.grades.find(g => g.student_id === 'aisha' && g.question_id === 'q3')).toMatchObject({ fraction: 0, feedback: 'Not graded.' });
  });
});
