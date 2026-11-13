import type { Ai, AnswerResult, Chapter, GraderResult, NoteTakerResult, QuizTakerResult, ReactionResult } from '../game/types';
import { normalizeChapter, validateChapter } from '../game/validate';
import { answerPrompt } from './prompts/answer';
import { chapterGeneratorPrompt } from './prompts/chapterGenerator';
import chapterSchema from './schemas/chapterGenerator.json';
import { graderPrompt } from './prompts/grader';
import { noteTakerPrompt } from './prompts/noteTaker';
import { quizTakerPrompt } from './prompts/quizTaker';
import { reactionPrompt } from './prompts/reaction';
import { callJson, preferModel } from './provider';
import type { ChatMessage, LogEntry, ProviderSettings } from './provider';
import answerSchema from './schemas/answer.json';
import graderSchema from './schemas/grader.json';
import noteTakerSchema from './schemas/noteTaker.json';
import pingSchema from './schemas/ping.json';
import quizTakerSchema from './schemas/quizTaker.json';
import reactionSchema from './schemas/reaction.json';

export interface AiDeps {
  provider: ProviderSettings;
  studentModel: string;
  graderModel: string;
  /** Models to try, best first, when the player chose no model. */
  autoModels?: string[];
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

function caller(d: AiDeps) {
  return <T>(model: string, schemaName: string, schema: object, messages: ChatMessage[], guard: (v: unknown) => v is T) =>
    callJson<T>(d.provider, { model, models: d.autoModels, onModel: d.onModel, schemaName, schema, messages, guard, onRequest: d.onRequest, log: d.log, fetchImpl: d.fetchImpl, sleep: d.sleep });
}

export function makeAi(d: AiDeps): Ai {
  const call = caller(d);
  return {
    noteTaker: (state, boardAdded, say) => call(d.studentModel, 'note_taker', noteTakerSchema, noteTakerPrompt(state, boardAdded, say), isNoteTaker),
    reaction: (state, student) => call(d.studentModel, 'student_reaction', reactionSchema, reactionPrompt(state, student), isReaction),
    answer: (state, student, question) => call(d.studentModel, 'student_answer', answerSchema, answerPrompt(state, student, question), isAnswer),
    quizTaker: (student, questions) => call(d.studentModel, 'quiz_taker', quizTakerSchema, quizTakerPrompt(student, questions), isQuizTaker),
    grader: (question, rows) => call(d.graderModel, 'grader', graderSchema, graderPrompt(question, rows), isGrader),
  };
}

const isChapter = (v: unknown): v is Chapter => validateChapter(v).length === 0;

/** Turns chapter text into a playable level. An invalid result is retried once by callJson. */
export async function generateChapter(d: AiDeps, chapterText: string): Promise<Chapter> {
  const raw = await caller(d)(d.graderModel, 'chapter_generator', chapterSchema, chapterGeneratorPrompt(chapterText), isChapter);
  return normalizeChapter(raw, `level-${Date.now()}`);
}

const PING: ChatMessage[] = [{ role: 'user', content: 'Reply with the JSON {"ok": true}.' }];

/**
 * One tiny call, used by "Test connection". With several automatic models to choose from,
 * it asks them all at once and keeps the first that answers, so a silent model costs no waiting.
 */
export async function ping(d: AiDeps): Promise<{ ok: boolean }> {
  const candidates = d.studentModel ? [] : d.autoModels ?? [];
  if (candidates.length < 2) return caller(d)(d.studentModel, 'ping', pingSchema, PING, isPing);
  let won = false;
  try {
    return await Promise.any(candidates.map(async model => {
      const value = await callJson(d.provider, {
        model, schemaName: 'ping', schema: pingSchema, messages: PING, guard: isPing, timeoutMs: 30000, patient: false,
        onRequest: d.onRequest, log: d.log, fetchImpl: d.fetchImpl, sleep: d.sleep,
      });
      if (!won) { won = true; preferModel(d.provider.baseUrl, model); d.onModel?.(model); }
      return value;
    }));
  } catch (e) {
    throw e instanceof AggregateError ? e.errors[0] : e;
  }
}
