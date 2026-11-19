/**
 * Runs four scripted lessons against a real model and checks the pass marks of GAME_DESIGN.md §0.10.
 * About 200 AI requests. Use a local model or credit, never a free daily limit.
 *
 *   TS_BASE_URL=http://127.0.0.1:11434/v1/chat/completions TS_MODEL=<model name> npm run lessons
 *
 * Optional: TS_API_KEY, TS_GRADER_MODEL (default: TS_MODEL), TS_RUNS (default 3),
 * TS_PAUSE_MS (wait between teacher turns, like a real player; default 0).
 * TS_MODEL=auto picks models from the provider's list and falls back between them, as the game does.
 * Free plans limit requests per minute: a call refused for that is retried after 30, 60 and 90 seconds.
 */
import { readFileSync } from 'node:fs';
import { makeAi } from '../src/ai/calls';
import { autoModels, listModelInfo } from '../src/ai/models';
import { AiError } from '../src/ai/provider';
import type { Ai } from '../src/game/types';
import { builtInChapter, students } from '../src/content';
import { startLesson } from '../src/game/lesson';
import { computeReport } from '../src/game/report';
import { mulberry32 } from '../src/game/rng';
import { runQuiz, teachTurn } from '../src/game/runLesson';
import type { Turn } from '../src/game/types';

const env = process.env;
if (!env.TS_BASE_URL || !env.TS_MODEL) {
  console.error('Set TS_BASE_URL and TS_MODEL. See the comment at the top of this file.');
  process.exit(2);
}

let requests = 0;
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
const PAUSE_MS = Number(env.TS_PAUSE_MS ?? 0);

/** Retries a call that a free plan refused for its per-minute limit, waiting longer each time. */
async function patient<T>(call: () => Promise<T>): Promise<T> {
  for (const wait of [30000, 60000, 90000, 0]) {
    try {
      return await call();
    } catch (e) {
      const busy = e instanceof AiError && (e.kind === 'rate' || e.kind === 'unavailable' || e.kind === 'badjson');
      if (!busy || wait === 0) throw e;
      console.log(`  provider busy, waiting ${wait / 1000} s`);
      await sleep(wait);
    }
  }
  throw new Error('unreachable');
}

const auto = env.TS_MODEL === 'auto';
const candidates = auto ? autoModels(env.TS_BASE_URL, await listModelInfo(env.TS_BASE_URL, env.TS_API_KEY ?? '')) : [];
if (auto) console.log('models:', candidates.join(', '));
const raw = makeAi({
  provider: { baseUrl: env.TS_BASE_URL, apiKey: env.TS_API_KEY ?? '', thinkingOff: true },
  studentModel: auto ? '' : env.TS_MODEL,
  graderModel: auto ? '' : env.TS_GRADER_MODEL ?? env.TS_MODEL,
  autoModels: candidates,
  onRequest: () => { requests++; },
});
const ai: Ai = {
  noteTaker: (...a) => patient(() => raw.noteTaker(...a)),
  reaction: (...a) => patient(() => raw.reaction(...a)),
  answer: (...a) => patient(() => raw.answer(...a)),
  quizTaker: (...a) => patient(() => raw.quizTaker(...a)),
  grader: (...a) => patient(() => raw.grader(...a)),
};

const RUNS = Number(env.TS_RUNS ?? 5);
// Each run draws a new class; the same seed is used for every lesson in that run, so lessons are compared on the same class.
// TS_SEED repeats an earlier test.
const SEED = Number(env.TS_SEED ?? Math.floor(Math.random() * 1e6));
// TS_LESSONS=empty (comma list) runs only those lessons; checks needing a lesson that did not run are skipped.
const LESSONS = env.TS_LESSONS?.split(',') ?? ['good', 'sloppy', 'wrong', 'empty'];
const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);

interface Score { total: number; written: number; mcq: number; mcqByModel: number }

async function runOnce(turns: Turn[], seed: number): Promise<Score> {
  const rng = mulberry32(seed);
  let state = startLesson(builtInChapter, students, rng, 0);
  let now = 0;
  let lastReaction = -1e9;
  for (const turn of turns) {
    now += 30000;
    const out = await teachTurn(state, turn, ai, rng, now, lastReaction);
    state = out.state;
    if (out.reactedAt !== null) lastReaction = out.reactedAt;
    if (PAUSE_MS) await sleep(PAUSE_MS);
  }
  const { answers, grades } = await runQuiz(state, ai, rng, () => {});
  const typeOf = (qid: string) => builtInChapter.quiz.find(q => q.id === qid)!.type;
  const pctOf = (type: string) => 100 * mean(grades.filter(g => typeOf(g.question_id) === type).map(g => g.fraction));
  // Multiple-choice answers the model gave: without a note on the goal, code picks the answer at random instead.
  const mcqByModel = Object.values(answers).flat().filter(a => typeOf(a.question_id) === 'mcq' && !a.byCode).length;
  return { total: computeReport(state, answers, grades).classAverage, written: pctOf('short'), mcq: pctOf('mcq'), mcqByModel };
}

const results: Record<string, Score> = {};
const perRun: Record<string, Score[]> = {};
console.log(`seed ${SEED}, ${RUNS} runs`);
for (const name of LESSONS) {
  const turns = JSON.parse(readFileSync(new URL(`./transcripts/${name}.json`, import.meta.url), 'utf8')) as Turn[];
  const runs: Score[] = [];
  for (let i = 0; i < RUNS; i++) {
    runs.push(await runOnce(turns, SEED + i));
    console.log(`${name} run ${i + 1}/${RUNS}: total ${runs[i].total.toFixed(0)}%, written ${runs[i].written.toFixed(0)}%, multiple choice ${runs[i].mcq.toFixed(0)}%`);
  }
  perRun[name] = runs;
  results[name] = { total: mean(runs.map(r => r.total)), written: mean(runs.map(r => r.written)), mcq: mean(runs.map(r => r.mcq)), mcqByModel: runs.reduce((n, r) => n + r.mcqByModel, 0) };
}

/** Mean of the paired gaps (run i of a vs run i of b, same class) and a 95% t-interval. */
function gap(a: Score[], b: Score[]): { mean: number; low: number; high: number } {
  const d = a.map((r, i) => r.total - b[i].total);
  const m = mean(d);
  if (d.length < 2) return { mean: m, low: m, high: m };
  const sd = Math.sqrt(d.reduce((n, x) => n + (x - m) ** 2, 0) / (d.length - 1));
  const T95: Record<number, number> = { 1: 12.71, 2: 4.3, 3: 3.18, 4: 2.78, 5: 2.57, 6: 2.45, 7: 2.36, 8: 2.31, 9: 2.26 };
  const half = ((T95[d.length - 1] ?? 2.0) * sd) / Math.sqrt(d.length);
  return { mean: m, low: m - half, high: m + half };
}

const { empty } = results;
const checks: [string, boolean][] = [];
for (const [hi, lo] of [['good', 'sloppy'], ['sloppy', 'wrong']] as const) {
  if (!perRun[hi] || !perRun[lo]) continue;
  const g = gap(perRun[hi], perRun[lo]);
  const sure = g.low >= 15 ? 'sure' : 'not sure yet: run more';
  checks.push([`${hi} beats ${lo} by 15+ points (gap ${g.mean.toFixed(0)}, 95% range ${g.low.toFixed(0)} to ${g.high.toFixed(0)}, ${sure})`, g.mean >= 15]);
}
if (empty) {
  checks.push([`leak test: empty lesson written score at most 10% (${empty.written.toFixed(0)}%; runs ${perRun.empty.map(r => r.written.toFixed(0)).join('/')})`, empty.written <= 10]);
  // Without notes, code picks multiple-choice answers at random, so the model must never answer one.
  checks.push([`leak test: no multiple-choice answer in the empty lesson came from the model (${empty.mcqByModel} did)`, empty.mcqByModel === 0]);
}

console.log(`\nModel: ${env.TS_MODEL} · grader: ${env.TS_GRADER_MODEL ?? env.TS_MODEL} · requests: ${requests}`);
for (const [label, ok] of checks) console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}`);
process.exit(checks.every(c => c[1]) ? 0 : 1);
