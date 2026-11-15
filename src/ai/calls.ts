import type { Ai, AnswerResult, Chapter, ChallengeResult, ExplainBackResult, FactCheckResult, GraderResult, NoteTakerResult, QuizTakerResult, ReactionResult, Student, TranscriptLine } from '../game/types';
import { normalizeChapter, validateChapter } from '../game/validate';
import { answerPrompt } from './prompts/answer';
import { challengePrompt } from './prompts/challenge';
import { chapterGeneratorPrompt } from './prompts/chapterGenerator';
import type { CourseContext } from './prompts/chapterGenerator';
import chapterSchema from './schemas/chapterGenerator.json';
import { explainBackPrompt } from './prompts/explainBack';
import { factCheckPrompt } from './prompts/factCheck';
import { graderPrompt } from './prompts/grader';
import { noteTakerPrompt } from './prompts/noteTaker';
import { outlinePrompt } from './prompts/outline';
import { quizTakerPrompt } from './prompts/quizTaker';
import { reactionPrompt } from './prompts/reaction';
import { callJson, preferModel } from './provider';
import type { ChatMessage, LogEntry, ProviderSettings } from './provider';
import answerSchema from './schemas/answer.json';
import challengeSchema from './schemas/challenge.json';
import explainBackSchema from './schemas/explainBack.json';
import factCheckSchema from './schemas/factCheck.json';
import graderSchema from './schemas/grader.json';
import noteTakerSchema from './schemas/noteTaker.json';
import outlineSchema from './schemas/outline.json';
import pingSchema from './schemas/ping.json';
import quizTakerSchema from './schemas/quizTaker.json';
import reactionSchema from './schemas/reaction.json';

export interface AiDeps {
  provider: ProviderSettings;
  studentModel: string;
  graderModel: string;
  /** Models to try, best first, when the player chose no model. A function lets calls wait until the provider's model list has loaded. */
  autoModels?: string[] | (() => Promise<string[]>);
  /** Told which automatically chosen model answered. */
  onModel?: (model: string) => void;
  onRequest?: () => void;
  log?: (e: LogEntry) => void;
  fetchImpl?: typeof fetch;
  sleep?: (ms: number) => Promise<void>;
}

type Rec = Record<string, unknown>;
const rec = (v: unknown): v is Rec => typeof v === 'object' && v !== null && !Array.isArray(v);
const list = (v: unknown, each: (x: unknown) => boolean): boolean => Array.isArray(v) && v.every(each);

const isNoteTaker = (v: unknown): v is NoteTakerResult =>
  rec(v) && list(v.students, s =>
    rec(s) && typeof s.id === 'string'
    && list(s.new_notes, n => rec(n) && typeof n.text === 'string')
    && list(s.beliefs_dropped, b => typeof b === 'string'));
const isReaction = (v: unknown): v is ReactionResult => rec(v) && typeof v.wants_to_speak === 'boolean' && typeof v.message === 'string';
const isAnswer = (v: unknown): v is AnswerResult => rec(v) && typeof v.answer === 'string';
const isQuizTaker = (v: unknown): v is QuizTakerResult =>
  rec(v) && list(v.answers, a => rec(a) && typeof a.question_id === 'string' && typeof a.answer === 'string');
const isGrader = (v: unknown): v is GraderResult =>
  rec(v) && list(v.results, r =>
    rec(r) && typeof r.student_id === 'string' && typeof r.score === 'number' && typeof r.max === 'number'
    && typeof r.supported_by_notes === 'boolean' && typeof r.feedback === 'string');
const isPing = (v: unknown): v is { ok: boolean } => rec(v) && typeof v.ok === 'boolean';

const candidatesOf = async (d: AiDeps): Promise<string[]> => (typeof d.autoModels === 'function' ? d.autoModels() : d.autoModels ?? []);

function caller(d: AiDeps) {
  return async <T>(model: string, schemaName: string, schema: object, messages: ChatMessage[], guard: (v: unknown) => v is T) =>
    callJson<T>(d.provider, { model, models: model ? undefined : await candidatesOf(d), onModel: d.onModel, schemaName, schema, messages, guard, onRequest: d.onRequest, log: d.log, fetchImpl: d.fetchImpl, sleep: d.sleep });
}

export function makeAi(d: AiDeps): Ai {
  const call = caller(d);
  return {
    noteTaker: (state, boardAdded, say, picture) => call(d.studentModel, 'note_taker', noteTakerSchema, noteTakerPrompt(state, boardAdded, say, picture), isNoteTaker),
    reaction: (state, student) => call(d.studentModel, 'student_reaction', reactionSchema, reactionPrompt(state, student), isReaction),
    answer: (state, student, question) => call(d.studentModel, 'student_answer', answerSchema, answerPrompt(state, student, question), isAnswer),
    quizTaker: (student, questions) => call(d.studentModel, 'quiz_taker', quizTakerSchema, quizTakerPrompt(student, questions), isQuizTaker),
    grader: (question, rows) => call(d.graderModel, 'grader', graderSchema, graderPrompt(question, rows), isGrader),
  };
}

const isOutline = (v: unknown): v is { lessons: { title: string; first_page: number }[] } =>
  rec(v) && Array.isArray(v.lessons) && v.lessons.length > 0 && v.lessons.every(l => rec(l) && typeof l.first_page === 'number');

/** Asks the AI where the lessons of a course should begin. Returns the first page of each lesson (pages start at 1). */
export async function outlineCourse(d: AiDeps, pages: string[]): Promise<number[]> {
  const plan = await caller(d)(d.graderModel, 'course_outline', outlineSchema, outlinePrompt(pages), isOutline);
  return plan.lessons.map(l => l.first_page);
}

const isFactCheck = (v: unknown): v is FactCheckResult =>
  rec(v) && list(v.errors, e =>
    rec(e) && typeof e.claim === 'string' && typeof e.correction === 'string' && (e.severity === 'minor' || e.severity === 'major'));

/** After the quiz: finds what the teacher said or wrote that was false or misleading, compared with the reference. */
export async function factCheck(d: AiDeps, chapter: Chapter, transcript: TranscriptLine[]): Promise<FactCheckResult> {
  return caller(d)(d.graderModel, 'fact_checker', factCheckSchema, factCheckPrompt(chapter, transcript), isFactCheck);
}

const isExplainBack = (v: unknown): v is ExplainBackResult => rec(v) && typeof v.explanation === 'string';

/** After the quiz: one student explains the lesson in their own words, from their notebook only. */
export async function explainBack(d: AiDeps, student: Student, lessonTitle: string): Promise<ExplainBackResult> {
  return caller(d)(d.studentModel, 'explain_back', explainBackSchema, explainBackPrompt(student, lessonTitle), isExplainBack);
}

const isChallenge = (v: unknown): v is ChallengeResult => rec(v) && typeof v.met === 'boolean' && typeof v.reason === 'string';

/** After the quiz: judges a challenge that code cannot check, from the whole lesson. */
export async function judgeChallenge(d: AiDeps, title: string, detection: string, transcript: TranscriptLine[]): Promise<ChallengeResult> {
  return caller(d)(d.graderModel, 'challenge_judge', challengeSchema, challengePrompt(title, detection, transcript), isChallenge);
}

const isChapter = (v: unknown): v is Chapter => validateChapter(v).length === 0;

/** Turns chapter text into a playable level. An invalid result is retried once by callJson. */
export async function generateChapter(d: AiDeps, chapterText: string, context?: CourseContext): Promise<Chapter> {
  const raw = await caller(d)(d.graderModel, 'chapter_generator', chapterSchema, chapterGeneratorPrompt(chapterText, context), isChapter);
  return normalizeChapter(raw, `level-${Date.now()}`);
}

const PING: ChatMessage[] = [{ role: 'user', content: 'Reply with the JSON {"ok": true}.' }];
/** After the first model answers, better-ranked ones get this long to answer too. */
const PING_GRACE_MS = 3000;

/**
 * One tiny call, used by "Test connection". With several automatic models to choose from, it asks
 * them all at once, so a silent model costs no waiting, and keeps the best-ranked one that answers.
 */
export async function ping(d: AiDeps): Promise<{ ok: boolean }> {
  const candidates = d.studentModel ? [] : await candidatesOf(d);
  if (candidates.length < 2) return caller(d)(d.studentModel, 'ping', pingSchema, PING, isPing);

  const sleep = d.sleep ?? ((ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms)));
  const answered = new Map<string, { ok: boolean }>();
  const tries = candidates.map(async model => {
    const value = await callJson(d.provider, {
      model, schemaName: 'ping', schema: pingSchema, messages: PING, guard: isPing, timeoutMs: 30000, patient: false,
      onRequest: d.onRequest, log: d.log, fetchImpl: d.fetchImpl, sleep: d.sleep,
    });
    answered.set(model, value);
  });
  try {
    await Promise.any(tries);
  } catch (e) {
    throw e instanceof AggregateError ? e.errors[0] : e;
  }
  await Promise.race([Promise.allSettled(tries), sleep(PING_GRACE_MS)]);
  const best = candidates.find(model => answered.has(model)) as string;
  preferModel(d.provider.baseUrl, best);
  d.onModel?.(best);
  return answered.get(best) as { ok: boolean };
}
