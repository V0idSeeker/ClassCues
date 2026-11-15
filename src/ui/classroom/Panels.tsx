import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import type { LessonState, Student } from '../../game/types';

/** What the middle of the right-hand column shows: the conversation, or one of the panels over it. */
export type Panel = 'talk' | 'notebook' | 'goals';

interface Props {
  panel: Panel;
  state: LessonState;
  student: Student;
  inNotes: Record<string, number>;
  realistic: boolean;
  help(entry: string, what: string): ReactNode;
  onClose(): void;
}

export default function Panels({ panel, state, student, inNotes, realistic, help, onClose }: Props) {
  const logRef = useRef<HTMLDivElement>(null);
  useEffect(() => { logRef.current?.scrollTo(0, logRef.current.scrollHeight); }, [state.transcript.length, panel]);

  return (
    <div className="rail-mid">
      {panel === 'talk' && (
        <div className="log" ref={logRef} aria-label="Class so far">
          {state.transcript.map((l, i) => l.who === 'note'
            ? <div key={i} className="dim">{l.text}</div>
            : <div key={i}><b>{l.who === 'teacher' ? 'You' : l.who === 'board' ? 'On the board' : l.who}:</b> {l.text}</div>)}
        </div>
      )}
      {panel === 'notebook' && (
        <div className="sheet paper">
          <div className="row"><h2 className="grow">{student.persona.name}'s notebook {help('notebooks', 'the notebook')}</h2><button onClick={onClose}>Close</button></div>
          {realistic ? <p>Hidden in realistic mode.</p> : (
            <ul>
              {student.notes.map((n, i) => <li key={i} className={n.distorted ? 'bent' : ''}>{n.text}</li>)}
              {student.beliefs.map(b => <li key={b.id} className="wrong">{b.text}</li>)}
              {student.notes.length + student.beliefs.length === 0 && <li>(empty)</li>}
              {student.memory.map((m, i) => <li key={`m${i}`} className="old">{m}</li>)}
            </ul>
          )}
        </div>
      )}
      {panel === 'goals' && (
        <div className="sheet">
          <div className="row"><h2 className="grow">Lesson goals · students who have it in their notes {help('goals', 'lesson goals')}</h2><button onClick={onClose}>Close</button></div>
          {state.chapter.objectives.map(o => (
            <div className="goal" key={o.id}>
              <span>{o.text}</span><b>{realistic ? '?' : `${inNotes[o.id]}/${state.students.length}`}</b>
              {!realistic && <span className="pips">{state.students.map((_, i) => <i key={i} className={i < inNotes[o.id] ? 'on' : ''} />)}</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
