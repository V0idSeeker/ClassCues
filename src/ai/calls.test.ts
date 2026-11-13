import { describe, expect, it, vi } from 'vitest';
import { builtInChapter, students } from '../content';
import { applyNotes, startLesson } from '../game/lesson';
import { makeAi, ping } from './calls';
import { answerPrompt } from './prompts/answer';
import { graderPrompt } from './prompts/grader';
import { noteTakerPrompt } from './prompts/noteTaker';
import { quizTakerPrompt } from './prompts/quizTaker';
import { reactionPrompt } from './prompts/reaction';

const KEY_PHRASE = 'computes the right side';          // only in the reference text
const ANSWER_KEY = builtInChapter.quiz[2].answer_key;  // "11. The right side is computed first..."
let state = startLesson(builtInChapter, students, () => 0.5, 0);
state = applyNotes(state, { students: [{ id: 'aisha', new_notes: [{ text: 'a variable stores a value', objective: 'obj-1', distorted: false }], beliefs_dropped: [], emotion: 'HAPPY' }] }, () => 0);
const aisha = state.students.find(s => s.persona.id === 'aisha')!;
const tom = state.students.find(s => s.persona.id === 'tom')!;
const all = (messages: { content: string }[]) => messages.map(m => m.content).join('\n');

describe('prompts keep judge knowledge away from students', () => {
  it('note-taker gets the objectives but not the reference or answer keys', () => {
    const text = all(noteTakerPrompt(state, 'x = 5', 'A variable is a name.'));
    expect(text).toContain(builtInChapter.objectives[3].text);
    expect(text).toContain('A variable is a name.');
    expect(text).toContain(tom.beliefs[0].text);
    expect(text).not.toContain(KEY_PHRASE);
    expect(text).not.toContain(ANSWER_KEY);
  });

  it('student calls get only notebook and beliefs', () => {
    for (const text of [all(reactionPrompt(state, aisha)), all(answerPrompt(state, aisha, 'What is a variable?')), all(quizTakerPrompt(tom, builtInChapter.quiz))]) {
      expect(text).not.toContain(KEY_PHRASE);
      expect(text).not.toContain(ANSWER_KEY);
      expect(text).not.toContain('answer_key');
    }
    expect(all(reactionPrompt(state, aisha))).toContain('a variable stores a value');
    expect(all(quizTakerPrompt(tom, builtInChapter.quiz))).toContain(tom.beliefs[0].text);
  });

  it('every student call ends with a system role reminder', () => {
    for (const m of [reactionPrompt(state, aisha), answerPrompt(state, aisha, 'q?'), quizTakerPrompt(aisha, builtInChapter.quiz), noteTakerPrompt(state, '', 'hi')]) {
      expect(m[m.length - 1].role).toBe('system');
      expect(m[m.length - 1].content).toContain('Reminder');
    }
  });

  it('grader gets the answer key, the rubric and each notebook', () => {
    const text = all(graderPrompt(builtInChapter.quiz[2], [{ student_id: 'aisha', answer: '11', notes: ['score is 11'] }]));
    expect(text).toContain(ANSWER_KEY);
    expect(text).toContain('Max 2');
    expect(text).toContain('score is 11');
  });
});

describe('makeAi', () => {
  const reply = (content: object) => new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify(content) } }] }), { status: 200 });
  const deps = (fetchImpl: unknown) => ({
    provider: { baseUrl: 'http://x', apiKey: '', thinkingOff: false },
    studentModel: 'small', graderModel: 'strong', fetchImpl: fetchImpl as typeof fetch, sleep: async () => {},
  });
  const sent = (f: ReturnType<typeof vi.fn>) => JSON.parse((f.mock.calls[0] as unknown as [string, RequestInit])[1].body as string);

  it('uses the student model and the note_taker schema for notes', async () => {
    const f = vi.fn(async () => reply({ students: [] }));
    await makeAi(deps(f)).noteTaker(state, '', 'hello');
    expect(sent(f).model).toBe('small');
    expect(sent(f).response_format.json_schema.name).toBe('note_taker');
  });

  it('uses the grader model for grading', async () => {
    const f = vi.fn(async () => reply({ results: [] }));
    await makeAi(deps(f)).grader(builtInChapter.quiz[2], []);
    expect(sent(f).model).toBe('strong');
  });

  it('rejects a reply with the wrong shape', async () => {
    const f = vi.fn(async () => reply({ students: 'nope' }));
    await expect(makeAi(deps(f)).noteTaker(state, '', 'hello')).rejects.toMatchObject({ kind: 'badjson' });
  });

  it('pings with a tiny schema', async () => {
    const f = vi.fn(async () => reply({ ok: true }));
    expect(await ping(deps(f))).toEqual({ ok: true });
  });
});
