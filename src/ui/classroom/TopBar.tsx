import type { ReactNode } from 'react';
import { MAX_TURNS, atmosphere, classClock } from '../../game/lesson';
import type { LessonState } from '../../game/types';
import { stopSpeaking } from '../../voice';

interface Props {
  state: LessonState;
  now: number;
  used: number;
  busy: boolean;
  goalsReached: number;
  goalsOpen: boolean;
  realistic: boolean;
  voiceOn: boolean;
  help(entry: string, what: string): ReactNode;
  onGoals(): void;
  onNotes(): void;
  onRealistic(on: boolean): void;
  onVoice(on: boolean): void;
  onHelp(): void;
  onLevels(): void;
  onSettings(): void;
  onMenu(): void;
  onBell(): void;
}

/** One row: lesson, clock, turns, class mood, goals counter, help, a menu for the rarer controls, and the bell. */
export default function TopBar(p: Props) {
  const { state } = p;
  return (
    <header className="topbar">
      <h1>{state.chapter.title}</h1>
      <span className="pill hide-phone">{classClock(state, p.now)} / 45:00</span>
      <span className="pill" title="Turns used">Turn {state.turns}/{MAX_TURNS}</span>
      <span className="pill" title="How the class feels as a whole. It spreads: bored or lost classmates pull others along.">
        <span className="hide-phone">Class mood: </span>{atmosphere(state).mood}
      </span>{p.help('class-mood', 'class mood')}
      <button className={`pill-button${p.goalsOpen ? ' on' : ''}`} onClick={p.onGoals} aria-pressed={p.goalsOpen}
        title="Lesson goals that at least one student has in their notes">
        Goals {p.realistic ? '?' : p.goalsReached}/{state.chapter.objectives.length}
      </button>
      <button className="hide-phone" onClick={p.onHelp}>Help</button>
      <details className="menu-pop">
        <summary aria-label="More">☰</summary>
        <div className="menu-pop-list">
          <span className="dim">AI requests today: {p.used}</span>
          <label className="check"><input type="checkbox" checked={p.voiceOn} onChange={e => { if (!e.target.checked) stopSpeaking(); p.onVoice(e.target.checked); }} />Voices</label>
          <label className="check"><input type="checkbox" checked={p.realistic} onChange={e => p.onRealistic(e.target.checked)} />Realistic mode</label>
          <button onClick={p.onNotes}>Lesson notes</button>
          <button onClick={p.onHelp}>Help</button>
          <button onClick={p.onLevels}>Lessons and PDF import</button>
          <button onClick={p.onSettings}>Settings</button>
          <button onClick={p.onMenu}>Main menu</button>
        </div>
      </details>
      <button className="go" onClick={p.onBell} disabled={p.busy} title="End the lesson: the students take the quiz">🔔<span className="hide-phone"> Ring the bell</span></button>
    </header>
  );
}
