import type { ReactNode } from 'react';
import type { Student } from '../../game/types';
import { HAND, STATE, portraitSvg } from '../scene';

interface Props {
  student: Student;
  handsUp: number;
  notebookOpen: boolean;
  newNotes: boolean;
  help(entry: string, what: string): ReactNode;
  onHearAgain(): void;
  onNextHand(): void;
  onNotebook(): void;
}

/** The selected student: face, mood, what they want to say, and quick buttons. */
export default function StudentCard({ student, handsUp, notebookOpen, newNotes, help, onHearAgain, onNextHand, onNotebook }: Props) {
  const chips = student.handUp ? [HAND, STATE[student.emotion]] : [STATE[student.emotion]];
  return (
    <div className="card">
      <div className="pic" dangerouslySetInnerHTML={{ __html: portraitSvg(student) }} />
      <div className="card-text">
        <div className="row" style={{ gap: 6 }}>
          <b className="who">{student.persona.name}</b>
          {chips.map(c => <span key={c.label} className="chip" style={{ borderColor: c.color }}>{c.icon} {c.label}</span>)}
          {help('moods', 'a student\'s mood')}
        </div>
        <p className="line">{student.pendingLine ? `“${student.pendingLine}”` : 'Not asking anything right now.'}</p>
      </div>
      <div className="card-buttons">
        <button onClick={onHearAgain} aria-label={`Hear ${student.persona.name} again`} title="Hear it again">🔊</button>
        <button onClick={onNextHand} disabled={handsUp === 0} title="Select the next student with a raised hand">✋ {handsUp}</button>
        <button className={`show-phone${notebookOpen ? ' on' : ''}`} onClick={onNotebook} aria-pressed={notebookOpen} aria-label="Notebook" title="Notebook">
          📓{newNotes && <span className="mark" aria-label="new notes">●</span>}
        </button>
      </div>
    </div>
  );
}
