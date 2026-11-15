import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import type { LessonState, Student } from '../../game/types';
import StudyNotes from '../StudyNotes';
import { noteText } from '../../game/runLesson';
import { t } from '../../i18n';

/** What the middle of the right-hand column shows: the conversation, or one of the panels over it. */
export type Panel = 'talk' | 'notebook' | 'goals' | 'notes';

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
        <div className="log" ref={logRef} aria-label={t('class.soFar')}>
          {state.transcript.map((l, i) => l.who === 'note'
            ? <div key={i} className="dim">{noteText(l.text)}</div>
            : <div key={i}><b>{l.who === 'teacher' ? t('class.you') : l.who === 'board' ? t('class.onBoard') : l.who}:</b> {l.text}</div>)}
        </div>
      )}
      {panel === 'notebook' && (
        <div className="sheet paper">
          <div className="row"><h2 className="grow">{t('class.notebookOf', { name: student.persona.name })} {help('notebooks', t('class.whatNotebook'))}</h2><button onClick={onClose}>{t('common.close')}</button></div>
          {realistic ? <p>{t('class.hidden')}</p> : (
            <ul>
              {student.notes.map((n, i) => <li key={i} className={n.distorted ? 'bent' : ''}>{n.text}</li>)}
              {student.beliefs.map(b => <li key={b.id} className="wrong">{b.text}</li>)}
              {student.notes.length + student.beliefs.length === 0 && <li>{t('class.empty')}</li>}
              {student.memory.map((m, i) => <li key={`m${i}`} className="old">{m}</li>)}
            </ul>
          )}
        </div>
      )}
      {panel === 'goals' && (
        <div className="sheet">
          <div className="row"><h2 className="grow">{t('class.goalsTitle')} {help('goals', t('class.whatGoals'))}</h2><button onClick={onClose}>{t('common.close')}</button></div>
          {state.chapter.objectives.map(o => (
            <div className="goal" key={o.id}>
              <span>{o.text}</span><b>{realistic ? '?' : `${inNotes[o.id]}/${state.students.length}`}</b>
              {!realistic && <span className="pips">{state.students.map((_, i) => <i key={i} className={i < inNotes[o.id] ? 'on' : ''} />)}</span>}
            </div>
          ))}
        </div>
      )}
      {panel === 'notes' && (
        <div className="sheet">
          <div className="row"><h2 className="grow">{t('class.lessonNotes')}</h2><button onClick={onClose}>{t('common.close')}</button></div>
          <StudyNotes chapter={state.chapter} />
        </div>
      )}
    </div>
  );
}
