import { EMOTIONS, applyNotes, boardAdded, patchStudent, pickReactor, pictureKey, shouldReact } from './lesson';
import { gradeMcq, gradeWritten, planQuiz } from './quiz';
import type { Answer, Grade } from './quiz';
import { pick } from './rng';
import type { Rng } from './rng';
import type { Ai, Emotion, LessonState, Student, TranscriptLine, Turn } from './types';

const feeling = (e: Emotion, fallback: Emotion): Emotion => (EMOTIONS.includes(e) ? e : fallback);
const byId = (state: LessonState, id: string): Student => {
  const s = state.students.find(x => x.persona.id === id);
  if (!s) throw new Error(`No student with id ${id}`);
  return s;
};

/**
 * One teacher turn. Returns a new state and leaves the old one untouched,
 * so a failed AI call loses nothing and the same turn can be sent again.
 */
export async function teachTurn(
  state: LessonState, turn: Turn, ai: Ai, rng: Rng, now: number, lastReactionAt: number,
): Promise<{ state: LessonState; reactedAt: number | null }> {
  const say = turn.say.trim();
  const added = boardAdded(state.board, turn.board);
  // Erasing only: nothing new for students to hear or copy.
  const boardPages = turn.pages && turn.pages.length > 0 ? turn.pages : [turn.board];
  const boards = {
    board: turn.board,
    boardPages,
    boardPage: Math.min(Math.max(turn.page ?? 0, 0), boardPages.length - 1),
    boardCaptions: boardPages.map((_, i) => turn.captions?.[i] ?? ''),
    boardPicture: turn.picture ?? null,
  };
  // A picture is new to the class the first time it is on show.
  const picture = turn.picture && !state.seenPictures.includes(pictureKey(turn.picture)) ? turn.picture : null;
  if (!say && !added && !picture) return { state: { ...state, ...boards }, reactedAt: null };

  const lines: TranscriptLine[] = [];
  if (say) lines.push({ who: 'teacher', text: say });
  if (added) lines.push({ who: 'board', text: added });
  if (picture) lines.push({ who: 'board', text: '(a new picture)' });
  let next: LessonState = {
    ...state, transcript: [...state.transcript, ...lines], ...boards, turns: state.turns + 1,
    seenPictures: picture ? [...state.seenPictures, pictureKey(picture)] : state.seenPictures,
  };

  next = applyNotes(next, await ai.noteTaker(next, added, say, picture), rng);

  // The teacher spoke to one student by name: that student replies, nobody else.
  const named = namedStudent(next, say);
  if (named?.pendingLine) return { state: hearStudent(next, named.persona.id), reactedAt: null };

  // Otherwise a question to the whole class gets one answer aloud right away.
  if (named || say.includes('?')) {
    const asked = named ?? pickForClassQuestion(next, rng);
    const a = await ai.answer(next, asked, say);
    next = {
      ...patchStudent(next, asked.persona.id, { emotion: feeling(a.emotion, asked.emotion), handUp: false, pendingLine: null }),
      transcript: [...next.transcript, { who: asked.persona.name, text: a.answer.trim() }],
    };
    // Sometimes a classmate wants to react to that answer: agree, disagree or add to it.
    if (rng() < PEER_REACT_CHANCE) {
      const others: LessonState = { ...next, students: next.students.filter(s => s.persona.id !== asked.persona.id) };
      const peer = pickReactor(others, rng);
      if (peer) next = await react(next, peer, ai);
    }
    // An answer is not a raised hand, so it does not delay the next one.
    return { state: next, reactedAt: null };
  }

  if (!shouldReact(next.turns, lastReactionAt, now)) return { state: next, reactedAt: null };
  const student = pickReactor(next, rng);
  if (!student) return { state: next, reactedAt: null };
  return { state: await react(next, student, ai), reactedAt: now };
}

/** How often a classmate gets the chance to react after a student answered aloud. */
export const PEER_REACT_CHANCE = 0.5;

/** One student decides whether to raise a hand, and with what line. */
async function react(state: LessonState, student: Student, ai: Ai): Promise<LessonState> {
  const r = await ai.reaction(state, student);
  const message = r.message.trim();
  const speaks = r.wants_to_speak && message.length > 0;
  const next = patchStudent(state, student.persona.id, {
    emotion: feeling(r.emotion, student.emotion),
    handUp: speaks,
    pendingLine: speaks ? message : null,
  });
  // 'note' lines tell the player what happened; they are not speech.
  return speaks
    ? { ...next, transcript: [...next.transcript, { who: 'note', text: `${student.persona.name} raised a hand. Click their desk to hear them.` }] }
    : next;
}

/** The student the teacher addressed by name, if any. With several names, the one mentioned first. */
export function namedStudent(state: LessonState, say: string): Student | null {
  let best: { at: number; student: Student } | null = null;
  for (const student of state.students) {
    const name = student.persona.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const at = say.search(new RegExp(`(^|[^\\p{L}])${name}(?![\\p{L}])`, 'iu'));
    if (at >= 0 && (!best || at < best.at)) best = { at, student };
  }
  return best ? best.student : null;
}

/** The teacher calls on a raised hand: the student's waiting line is said aloud. No AI call. */
export function hearStudent(state: LessonState, studentId: string): LessonState {
  const s = byId(state, studentId);
  if (!s.pendingLine) return state;
  return {
    ...patchStudent(state, studentId, { handUp: false, pendingLine: null }),
    transcript: [...state.transcript, { who: s.persona.name, text: s.pendingLine }],
  };
}

/** The teacher asks one student a question. */
export async function askStudent(state: LessonState, studentId: string, question: string, ai: Ai): Promise<LessonState> {
  const s = byId(state, studentId);
  const asked: LessonState = { ...state, transcript: [...state.transcript, { who: 'teacher', text: question.trim() }] };
  const r = await ai.answer(asked, s, question.trim());
  return {
    ...patchStudent(asked, studentId, { emotion: feeling(r.emotion, s.emotion), handUp: false, pendingLine: null }),
    transcript: [...asked.transcript, { who: s.persona.name, text: r.answer.trim() }],
  };
}

/** "Ask the class": a student with a raised hand answers, otherwise a random one. */
export function pickForClassQuestion(state: LessonState, rng: Rng): Student {
  const hands = state.students.filter(s => s.handUp);
  return pick(hands.length ? hands : state.students, rng);
}

/** Quiz calls run one at a time, so a rate-limited provider is not hit by a burst. */
export async function runQuiz(
  state: LessonState, ai: Ai, rng: Rng, onProgress: (done: number, total: number) => void,
): Promise<{ answers: Record<string, Answer[]>; grades: Grade[] }> {
  const quiz = state.chapter.quiz;
  const written = quiz.filter(q => q.type === 'short');
  const total = state.students.length + written.length;
  let done = 0;

  const answers: Record<string, Answer[]> = {};
  for (const st of state.students) {
    const plan = planQuiz(st, quiz, rng);
    let fromModel: Answer[] = [];
    if (plan.ask.length > 0) {
      const r = await ai.quizTaker(st, plan.ask);
      fromModel = plan.ask.map(q => ({
        question_id: q.id,
        answer: r.answers.find(a => a.question_id === q.id)?.answer ?? '',
        byCode: false,
      }));
    }
    answers[st.persona.id] = [...plan.coded, ...fromModel];
    onProgress(++done, total);
  }

  const answerOf = (sid: string, qid: string) => answers[sid].find(a => a.question_id === qid)?.answer ?? '';
  const grades: Grade[] = [];
  for (const q of quiz) {
    if (q.type === 'mcq') {
      for (const st of state.students) grades.push(gradeMcq(st.persona.id, q, answerOf(st.persona.id, q.id)));
      continue;
    }
    const r = await ai.grader(q, state.students.map(st => ({
      student_id: st.persona.id,
      answer: answerOf(st.persona.id, q.id) || '(no answer)',
      notes: [...st.memory, ...st.notes.map(n => n.text)],
    })));
    for (const st of state.students) {
      const row = r.results.find(x => x.student_id === st.persona.id);
      grades.push(row ? gradeWritten(q, row, state.difficulty === 'inspection') : { student_id: st.persona.id, question_id: q.id, fraction: 0, feedback: 'Not graded.' });
    }
    onProgress(++done, total);
  }
  return { answers, grades };
}
