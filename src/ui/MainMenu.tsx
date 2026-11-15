import { useMemo } from 'react';
import { studentPool } from '../content';
import type { Emotion, Student } from '../game/types';
import { SCENE_VIEWBOX, boardArea, sceneSvg } from './scene';

interface Props {
  lessonTitle: string | null;
  firstVisit: boolean;
  onContinue(): void;
  onStart(): void;
  onHelp(): void;
  onSettings(): void;
}

const MOODS: Emotion[] = ['CURIOUS', 'HAPPY', 'NEUTRAL', 'BORED', 'CURIOUS', 'CONFUSED', 'HAPPY', 'NEUTRAL', 'CURIOUS', 'HAPPY'];
const still = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

export default function MainMenu(p: Props) {
  // A class waiting for its teacher, drawn behind the menu.
  const scene = useMemo(() => {
    const kids: Student[] = studentPool.slice(0, 10).map((persona, i) => ({
      persona, notes: [], beliefs: [], emotion: MOODS[i], handUp: i === 7, pendingLine: null, memory: [],
    }));
    return sceneSvg(kids, '', null, still);
  }, []);

  return (
    <div className="page menu">
      <div className="stage menu-stage">
        <div className="stage-in">
          <svg viewBox={SCENE_VIEWBOX} aria-hidden="true" dangerouslySetInnerHTML={{ __html: scene }} />
          <div className="menu-title" style={boardArea(16)}>
            <h1>Class Is In Session</h1>
            <p>Teach a class of AI students. They only know what you taught them.</p>
          </div>
        </div>
      </div>
      <nav className="menu-buttons" aria-label="Main menu">
        {p.lessonTitle && <button className="go" onClick={p.onContinue}>Continue lesson: {p.lessonTitle}</button>}
        <button className={p.lessonTitle ? '' : 'go'} onClick={p.onStart}>{p.lessonTitle ? 'Choose another lesson' : 'Start teaching'}</button>
        <button className={p.firstVisit ? 'gold' : ''} onClick={p.onHelp}>How to play{p.firstVisit ? ' (start here)' : ''}</button>
        <button onClick={p.onSettings}>Settings</button>
      </nav>
    </div>
  );
}
