/**
 * Runs four scripted lessons against a real model and checks the pass marks of GAME_DESIGN.md §0.10.
 * About 200 AI requests. Use a local model or credit, never a free daily limit.
 *
 *   TS_BASE_URL=http://127.0.0.1:11434/v1/chat/completions TS_MODEL=<model name> npm run lessons
 *
 * Optional: TS_API_KEY, TS_GRADER_MODEL (default: TS_MODEL), TS_RUNS (default 3).
 */
import { readFileSync } from 'node:fs';
import { makeAi } from '../src/ai/calls';
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
const ai = makeAi({
  provider: { baseUrl: env.TS_BASE_URL, apiKey: env.TS_API_KEY ?? '', thinkingOff: true },
  studentModel: env.TS_MODEL,
  graderModel: env.TS_GRADER_MODEL ?? env.TS_MODEL,
  onRequest: () => { requests++; },
});

const RUNS = Number(env.TS_RUNS ?? 3);
const LESSONS = ['good', 'sloppy', 'wrong', 'empty'] as const;
const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);

interface Score { total: number; written: number; mcq: number }

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
  }
  const { answers, grades } = await runQuiz(state, ai, rng, () => {});
  const typeOf = (qid: string) => builtInChapter.quiz.find(q => q.id === qid)!.type;
  const pctOf = (type: string) => 100 * mean(grades.filter(g => typeOf(g.question_id) === type).map(g => g.fraction));
  return { total: computeReport(state, answers, grades).classAverage, written: pctOf('short'), mcq: pctOf('mcq') };
}

const results: Record<string, Score> = {};
for (const name of LESSONS) {
  const turns = JSON.parse(readFileSync(new URL(`./transcripts/${name}.json`, import.meta.url), 'utf8')) as Turn[];
  const runs: Score[] = [];
  for (let i = 0; i < RUNS; i++) {
    runs.push(await runOnce(turns, 1000 + i));
    console.log(`${name} run ${i + 1}/${RUNS}: total ${runs[i].total.toFixed(0)}%, written ${runs[i].written.toFixed(0)}%, multiple choice ${runs[i].mcq.toFixed(0)}%`);
  }
  results[name] = { total: mean(runs.map(r => r.total)), written: mean(runs.map(r => r.written)), mcq: mean(runs.map(r => r.mcq)) };
}

const { good, sloppy, wrong, empty } = results;
const checks: [string, boolean][] = [
  [`good beats sloppy by 15+ points (${good.total.toFixed(0)} vs ${sloppy.total.toFixed(0)})`, good.total - sloppy.total >= 15],
  [`sloppy beats wrong by 15+ points (${sloppy.total.toFixed(0)} vs ${wrong.total.toFixed(0)})`, sloppy.total - wrong.total >= 15],
  [`leak test: empty lesson written score at most 10% (${empty.written.toFixed(0)}%)`, empty.written <= 10],
  [`leak test: empty lesson multiple choice within chance, 25% ± 10 (${empty.mcq.toFixed(0)}%)`, Math.abs(empty.mcq - 25) <= 10],
];

console.log(`\nModel: ${env.TS_MODEL} · grader: ${env.TS_GRADER_MODEL ?? env.TS_MODEL} · requests: ${requests}`);
for (const [label, ok] of checks) console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}`);
process.exit(checks.every(c => c[1]) ? 0 : 1);
