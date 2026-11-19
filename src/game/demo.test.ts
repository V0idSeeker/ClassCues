import { describe, expect, it } from 'vitest';
import { builtInChapter, students } from '../content';
import { DEMO_TURNS, demoAi } from './demo';
import { lessonOver, startLesson } from './lesson';
import { runQuiz, teachTurn } from './runLesson';

describe('demo lesson', () => {
  it('ends after three turns', () => {
    const s = { ...startLesson(builtInChapter, students, () => 0.5, 0), demo: true };
    expect(lessonOver({ ...s, turns: DEMO_TURNS - 1 }, 0)).toBe(false);
    expect(lessonOver({ ...s, turns: DEMO_TURNS }, 0)).toBe(true);
  });

  it('runs a whole lesson and quiz without an AI, and teaching the goal scores better than saying nothing', async () => {
    const ai = demoAi();
    const start = { ...startLesson(builtInChapter, students, () => 0.5, 0), demo: true };
    const goal = builtInChapter.objectives[0].text;
    const taught = (await teachTurn(start, { say: goal, board: '' }, ai, () => 0.5, 0, -1e9)).state;
    expect(taught.students.some(s => s.notes.length > 0)).toBe(true);
    const score = async (s: typeof start) => {
      const { grades } = await runQuiz(s, ai, () => 0.5, () => {});
      return grades.reduce((n, g) => n + g.fraction, 0);
    };
    expect(await score(taught)).toBeGreaterThanOrEqual(await score(start));
  });
});
