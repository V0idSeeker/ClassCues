import type { Rng } from './rng';
import type { Archetype, Belief, Chapter, Emotion, LessonState, NoteTakerResult, Persona, Student, TranscriptLine, Turn } from './types';

export const MAX_TURNS = 20;
export const LESSON_MS = 15 * 60 * 1000;
export const REACT_EVERY_TURNS = 2;
export const REACT_GAP_MS = 6000;
export const EMOTIONS: Emotion[] = ['CURIOUS', 'CONFUSED', 'BORED', 'HAPPY', 'NEUTRAL'];

/** Removes and returns up to n random items from pool. */
function draw<T>(pool: T[], n: number, rng: Rng): T[] {
  const out: T[] = [];
  for (let i = 0; i < n && pool.length > 0; i++) out.push(pool.splice(Math.floor(rng() * pool.length), 1)[0]);
  return out;
}

const CORE: Archetype[] = ['eager', 'quiet', 'clown', 'skeptic', 'carrier', 'struggling'];

/** A class for one lesson: one student of each core archetype, the rest at random, in random seats. */
export function drawClass(pool: Persona[], rng: Rng, size = 10): Persona[] {
  const rest = [...pool];
  const picked: Persona[] = [];
  for (const kind of CORE) {
    const matches = rest.filter(p => p.archetype === kind);
    if (matches.length === 0 || picked.length >= size) continue;
    const p = matches[Math.floor(rng() * matches.length)];
    picked.push(p);
    rest.splice(rest.indexOf(p), 1);
  }
  picked.push(...draw(rest, size - picked.length, rng));
  return draw(picked, picked.length, rng);
}

/** What each student (by id) kept from past lessons. Newest lesson last. */
export type ClassMemory = Record<string, { chapterId: string; title: string; notes: string[] }[]>;
export const MEMORY_LESSONS = 3;
export const MEMORY_NOTES = 8;

/** After a lesson: every student keeps some of their notes, right or wrong. Only the last few lessons stay. */
export function rememberLesson(memory: ClassMemory, state: LessonState): ClassMemory {
  const next: ClassMemory = { ...memory };
  for (const s of state.students) {
    const before = (memory[s.persona.id] ?? []).filter(m => m.chapterId !== state.chapter.id);
    const notes = s.notes.slice(0, MEMORY_NOTES).map(n => n.text);
    next[s.persona.id] = [...before, { chapterId: state.chapter.id, title: state.chapter.title, notes }].slice(-MEMORY_LESSONS);
  }
  return next;
}

/** A student's memory lines for a new lesson. The same chapter is left out, so replaying a level starts fresh. */
export function memoryFor(memory: ClassMemory, studentId: string, chapterId: string): string[] {
  return (memory[studentId] ?? [])
    .filter(m => m.chapterId !== chapterId)
    .flatMap(m => m.notes.map(text => `From the lesson "${m.title}": ${text}`));
}

export function startLesson(chapter: Chapter, personas: Persona[], rng: Rng, now: number, memory: ClassMemory = {}): LessonState {
  const beliefs: Belief[] = chapter.common_misconceptions.map((text, i) => ({ id: `b${i + 1}`, text }));
  const take = (n: number, from: number): Belief[] =>
    beliefs.length === 0 ? [] : Array.from({ length: Math.min(n, beliefs.length) }, (_, k) => beliefs[(from + k) % beliefs.length]);

  const lucky = draw(personas.filter(p => p.archetype !== 'carrier' && p.archetype !== 'struggling'), 2, rng).map(p => p.id);

  const students: Student[] = personas.map(p => ({
    persona: p,
    notes: [],
    memory: memoryFor(memory, p.id, chapter.id),
    emotion: 'NEUTRAL',
    handUp: false,
    pendingLine: null,
    beliefs:
      p.archetype === 'carrier' ? take(2, 0)
      : p.archetype === 'struggling' ? take(1, 2)
      : lucky.includes(p.id) ? take(1, 3 + lucky.indexOf(p.id))
      : [],
  }));

  // Two pre-written opening lines, so class starts without an AI call.
  const transcript: TranscriptLine[] = draw([...personas], 2, rng).map(p => ({
    who: p.name,
    text: p.openingLines[Math.floor(rng() * p.openingLines.length)],
  }));

  return { chapter, students, transcript, board: '', boardPages: [''], boardPage: 0, boardCaptions: [''], boardPicture: null, seenPictures: [], turns: 0, startedAt: now };
}

/** The board the class is looking at right now. */
export function visibleBoard(state: LessonState): string {
  return boardText(state.boardPages[state.boardPage] ?? state.board, state.boardCaptions[state.boardPage]);
}

/** A short key for a picture, enough to tell whether the class has seen it before. */
export function pictureKey(picture: string): string {
  return `${picture.length}:${picture.slice(-32)}`;
}

export const PICTURE_PREFIX = 'Picture on the board: ';

/** What students can read from one board: its text, plus the description of its picture if the teacher wrote one. */
export function boardText(text: string, caption: string | undefined): string {
  const described = caption?.trim();
  return described ? `${text}${text.trim() ? '\n' : ''}${PICTURE_PREFIX}${described}` : text;
}

/** Lines present on the board now that were not there before. */
export function boardAdded(before: string, after: string): string {
  const seen = new Set(before.split('\n').map(l => l.trim()));
  return after.split('\n').map(l => l.trim()).filter(l => l && !seen.has(l)).join('\n');
}

const squash = (s: string) => s.toLowerCase().replace(/\s+/g, ' ').trim();

export function applyNotes(state: LessonState, result: NoteTakerResult, rng: Rng): LessonState {
  const objectiveIds = new Set(state.chapter.objectives.map(o => o.id));
  const byId = new Map(result.students.map(s => [s.id, s]));
  const students = state.students.map(st => {
    const r = byId.get(st.persona.id);
    if (!r) return st;
    // Attention 1 keeps every note, attention 0 keeps 40% of them.
    // A bored student writes down less.
    const keep = (0.4 + 0.6 * st.persona.traits.attention) * (st.emotion === 'BORED' ? BORED_NOTE_FACTOR : 1);
    const notes = [...st.notes];
    for (const n of r.new_notes) {
      const text = n.text.trim();
      if (!text) continue;
      if (rng() >= keep) continue;
      if (notes.some(x => squash(x.text) === squash(text))) continue;
      notes.push({ text, objective: n.objective && objectiveIds.has(n.objective) ? n.objective : null, distorted: n.distorted === true });
    }
    return {
      ...st,
      notes,
      beliefs: st.beliefs.filter(b => !r.beliefs_dropped.includes(b.id)),
      emotion: EMOTIONS.includes(r.emotion) ? r.emotion : st.emotion,
    };
  });
  return { ...state, students };
}

export const BORED_NOTE_FACTOR = 0.6;

export interface Atmosphere {
  /** Share of the class that is bored, 0 to 1. */
  bored: number;
  /** Share of the class that is confused, 0 to 1. */
  confused: number;
  /** Teacher turns in a row since a student last spoke. A long run means a lecture with no interaction. */
  teacherTurnsSinceStudentSpoke: number;
  mood: 'engaged' | 'calm' | 'restless' | 'lost';
}

/** How the class feels as a whole. Fed back to the students, so moods spread. */
export function atmosphere(state: LessonState): Atmosphere {
  const n = state.students.length || 1;
  const share = (...kinds: Emotion[]) => state.students.filter(s => kinds.includes(s.emotion)).length / n;
  const names = new Set(state.students.map(s => s.persona.name));
  let quiet = 0;
  for (let i = state.transcript.length - 1; i >= 0; i--) {
    const who = state.transcript[i].who;
    if (names.has(who)) break;
    if (who === 'teacher') quiet++;
  }
  const bored = share('BORED');
  const confused = share('CONFUSED');
  const mood = confused >= 0.4 ? 'lost' : bored >= 0.4 ? 'restless' : share('HAPPY', 'CURIOUS') >= 0.5 ? 'engaged' : 'calm';
  return { bored, confused, teacherTurnsSinceStudentSpoke: quiet, mood };
}

export function patchStudent(state: LessonState, id: string, patch: Partial<Student>): LessonState {
  return { ...state, students: state.students.map(s => (s.persona.id === id ? { ...s, ...patch } : s)) };
}

export function hasObjective(student: Student, objectiveId: string): boolean {
  return student.notes.some(n => n.objective === objectiveId && !n.distorted);
}

/** For each objective id: how many students have it in their notes. */
export function coverage(state: LessonState): Record<string, number> {
  const out: Record<string, number> = {};
  for (const o of state.chapter.objectives) out[o.id] = state.students.filter(s => hasObjective(s, o.id)).length;
  return out;
}

/** Curious students speak more; confused students speak only if they are confident. */
export function pickReactor(state: LessonState, rng: Rng): Student | null {
  const candidates = state.students.filter(s => !s.handUp);
  if (candidates.length === 0) return null;
  const weights = candidates.map(s => 0.05 + s.persona.traits.curiosity + (s.emotion === 'CONFUSED' ? s.persona.traits.confidence : 0));
  let r = rng() * weights.reduce((a, b) => a + b, 0);
  for (let i = 0; i < candidates.length; i++) {
    r -= weights[i];
    if (r < 0) return candidates[i];
  }
  return candidates[candidates.length - 1];
}

export function shouldReact(turns: number, lastReactionAt: number, now: number): boolean {
  return turns % REACT_EVERY_TURNS === 0 && now - lastReactionAt >= REACT_GAP_MS;
}

export function lessonOver(state: LessonState, now: number): boolean {
  return state.turns >= MAX_TURNS || now - state.startedAt >= LESSON_MS;
}

export function mergeTurns(turns: Turn[]): Turn {
  return { ...turns[turns.length - 1], say: turns.map(t => t.say.trim()).filter(Boolean).join('\n') };
}

export function recentLines(state: LessonState, n = 10): TranscriptLine[] {
  return state.transcript.slice(-n);
}

/** The 15 real minutes shown as a 45-minute class, as mm:ss. */
export function classClock(state: LessonState, now: number): string {
  const elapsed = Math.min(LESSON_MS, Math.max(0, now - state.startedAt));
  const seconds = Math.floor((elapsed * 45 * 60) / LESSON_MS);
  return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
}
