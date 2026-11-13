export type Emotion = 'CURIOUS' | 'CONFUSED' | 'BORED' | 'HAPPY' | 'NEUTRAL';
export type Archetype = 'eager' | 'quiet' | 'clown' | 'skeptic' | 'carrier' | 'struggling' | 'other';

export interface Objective { id: string; text: string }

export interface QuizQuestion {
  id: string;
  type: 'mcq' | 'short';
  objective: string;
  prompt: string;
  choices?: string[];
  answer_key: string;
  rubric?: string;
}

export interface Chapter {
  format: 1;
  id: string;
  title: string;
  objectives: Objective[];
  reference: string;
  common_misconceptions: string[];
  quiz: QuizQuestion[];
}

export interface Persona {
  id: string;
  name: string;
  archetype: Archetype;
  traits: { attention: number; curiosity: number; confidence: number };
  learning_style: string;
  personality: string;
  openingLines: string[];
}

export interface Belief { id: string; text: string }
export interface Note { text: string; objective: string | null; distorted: boolean }

export interface Student {
  persona: Persona;
  notes: Note[];
  beliefs: Belief[];
  emotion: Emotion;
  handUp: boolean;
  /** What the student wants to say while their hand is up. */
  pendingLine: string | null;
}

/** who is 'teacher', 'board', or a student's name. */
export interface TranscriptLine { who: string; text: string }

export interface LessonState {
  chapter: Chapter;
  students: Student[];
  transcript: TranscriptLine[];
  /** Board text as of the last turn that was sent to the students. */
  board: string;
  turns: number;
  startedAt: number;
}

/** One teacher turn: what was said, and the full board text at that moment. */
export interface Turn { say: string; board: string }

export interface NoteTakerResult {
  students: { id: string; new_notes: Note[]; beliefs_dropped: string[]; emotion: Emotion }[];
}
export interface ReactionResult { wants_to_speak: boolean; message: string; emotion: Emotion }
export interface AnswerResult { answer: string; emotion: Emotion }
export interface QuizTakerResult { answers: { question_id: string; answer: string }[] }
export interface GraderRow { student_id: string; score: number; max: number; supported_by_notes: boolean; feedback: string }
export interface GraderResult { results: GraderRow[] }
export interface GraderInputRow { student_id: string; answer: string; notes: string[] }

/** The five lesson calls. Implemented by src/ai/calls.ts, faked in tests. */
export interface Ai {
  noteTaker(state: LessonState, boardAdded: string, say: string): Promise<NoteTakerResult>;
  reaction(state: LessonState, student: Student): Promise<ReactionResult>;
  answer(state: LessonState, student: Student, question: string): Promise<AnswerResult>;
  quizTaker(student: Student, questions: QuizQuestion[]): Promise<QuizTakerResult>;
  grader(question: QuizQuestion, rows: GraderInputRow[]): Promise<GraderResult>;
}
