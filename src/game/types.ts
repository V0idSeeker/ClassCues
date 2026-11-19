export type Emotion = 'CURIOUS' | 'CONFUSED' | 'BORED' | 'HAPPY' | 'NEUTRAL';
export type Archetype = 'eager' | 'quiet' | 'clown' | 'skeptic' | 'carrier' | 'struggling' | 'other';

export type HairStyle = 'short' | 'long' | 'bob' | 'spiky' | 'curly' | 'pigtails' | 'bun' | 'cap' | 'hijab' | 'wavy';
/** How a student is drawn. */
export interface Look { hair: HairStyle; hairColor: string; skin: string; shirt: string; glasses: boolean; /** Graduation cap, sash and floral collar. */ graduate?: boolean }

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
  /** The course this lesson belongs to, and its position in it. Lessons made one at a time have neither. */
  course?: string;
  part?: number;
  /** A follow-up lesson: the id of the lesson whose mistakes it corrects. */
  followUpOf?: string;
}

export interface Persona {
  id: string;
  name: string;
  archetype: Archetype;
  traits: { attention: number; curiosity: number; confidence: number };
  learning_style: string;
  personality: string;
  openingLines: string[];
  look: Look;
  /** Which browser voice this student uses (a position in the voice list). */
  voice: number;
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
  /** What the student still remembers from earlier lessons, as short lines. */
  memory: string[];
}

/** who is 'teacher', 'board', or a student's name. */
export interface TranscriptLine { who: string; text: string }

export interface LessonState {
  chapter: Chapter;
  students: Student[];
  transcript: TranscriptLine[];
  /** Everything on all boards, as of the last turn that was sent to the students. */
  board: string;
  /** The boards the teacher has, like slides. Only one is on show at a time. */
  boardPages: string[];
  /** Which board is on show (a position in boardPages). */
  boardPage: number;
  /** For each board: what its picture shows, in the teacher's words. Students cannot see pictures, only this text. */
  boardCaptions: string[];
  /** The picture on the board that is on show, as students see it (a data URL), or null. Only set when the model reads pictures. */
  boardPicture: string | null;
  /** Short keys of the pictures the class has already seen, so a picture is new only once. */
  seenPictures: string[];
  turns: number;
  startedAt: number;
  /** One snapshot per teacher turn, for the lesson review. Lessons saved before it existed load with an empty list. */
  timeline: TurnSnapshot[];
  /** How hard this class is. Missing (older saves): normal. */
  difficulty?: Difficulty;
  /** The id of this lesson's teaching challenge (src/game/challenges.ts). Missing in older saves. */
  challenge?: string;
  /** How many times the teacher opened the lesson notes during class. Missing in older saves. */
  peeks?: number;
  /** Students the teacher checked on since their last turn (named, called on, or a question to the class): shy students show confusion only then. */
  checked?: string[];
  /** A demo lesson with ready-made students (src/game/demo.ts): no AI, nothing saved. */
  demo?: boolean;
}

/** How the class stood right after one teacher turn. */
export interface TurnSnapshot {
  turn: number;
  /** Positions in transcript where this turn's lines start, and end (exclusive). */
  start: number;
  end: number;
  mood: 'engaged' | 'calm' | 'restless' | 'lost';
  /** Shares of the class, 0 to 1. */
  bored: number;
  confused: number;
  hands: number;
  /** Goals that at least one student has in their notes. */
  goals: number;
}

export type Difficulty = 'easy' | 'normal' | 'hard' | 'inspection';

/**
 * One teacher turn: what was said, and the text of all boards at that moment.
 * pages and page say how that text is spread over boards and which one is on show; without them there is one board.
 */
export interface Turn { say: string; board: string; pages?: string[]; page?: number; captions?: string[]; picture?: string | null }

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
  /** picture: a new picture on the board, for models that read pictures. */
  noteTaker(state: LessonState, boardAdded: string, say: string, picture?: string | null): Promise<NoteTakerResult>;
  reaction(state: LessonState, student: Student): Promise<ReactionResult>;
  answer(state: LessonState, student: Student, question: string): Promise<AnswerResult>;
  quizTaker(student: Student, questions: QuizQuestion[]): Promise<QuizTakerResult>;
  grader(question: QuizQuestion, rows: GraderInputRow[]): Promise<GraderResult>;
}

/** A false or misleading statement the teacher made, found after the quiz. */
export interface FactError { claim: string; correction: string; severity: 'minor' | 'major' }
export interface FactCheckResult { errors: FactError[] }
export interface ExplainBackResult { explanation: string }
export interface ChallengeResult { met: boolean; reason: string }
