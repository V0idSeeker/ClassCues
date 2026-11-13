import { describe, expect, it } from 'vitest';
import { builtInChapter, students } from '../content';
import { patchStudent, startLesson } from '../game/lesson';
import { portraitSvg, sceneSvg } from './scene';

const state = startLesson(builtInChapter, students, () => 0.5, 0);

describe('sceneSvg', () => {
  it('draws every student with their name and id', () => {
    const svg = sceneSvg(state.students, 'aisha', null, true);
    for (const s of state.students) {
      expect(svg).toContain(`data-id="${s.persona.id}"`);
      expect(svg).toContain(`>${s.persona.name}</text>`);
    }
    expect(svg.match(/class="kid/g)).toHaveLength(10);
  });

  it('marks the selected and the talking student', () => {
    const svg = sceneSvg(state.students, 'tom', 'leo', true);
    expect(svg).toMatch(/class="kid sel"[^>]*data-id="tom"/);
    expect(svg).toMatch(/class="kid talking"[^>]*data-id="leo"/);
  });

  it('shows a raised hand as a waving arm and a hand icon, without motion when asked', () => {
    const up = patchStudent(state, 'maya', { handUp: true, pendingLine: 'Why?' });
    expect(sceneSvg(up.students, 'aisha', null, false)).toContain('animateTransform');
    expect(sceneSvg(up.students, 'aisha', null, true)).not.toContain('animateTransform');
    expect(sceneSvg(up.students, 'aisha', null, true)).toContain('✋');
    expect(sceneSvg(state.students, 'aisha', null, false)).not.toContain('animateTransform');
  });

  it('changes the face with the emotion', () => {
    const bored = patchStudent(state, 'ben', { emotion: 'BORED' });
    expect(sceneSvg(bored.students, 'aisha', null, true)).not.toBe(sceneSvg(state.students, 'aisha', null, true));
  });

  it('escapes names so a level or save file cannot inject markup', () => {
    const odd = { ...state.students[0], persona: { ...state.students[0].persona, name: '<b>x</b>' } };
    expect(sceneSvg([odd], 'aisha', null, true)).not.toContain('<b>x</b>');
  });

  it('draws a portrait', () => {
    expect(portraitSvg(state.students[0])).toMatch(/^<svg viewBox/);
  });
});
