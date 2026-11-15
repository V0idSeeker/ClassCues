import type { ReactNode } from 'react';
import type { Student } from '../../game/types';
import { HAND, STATE, portraitSvg } from '../scene';
import { t } from '../../i18n';

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
          {help('moods', t('class.whatMood'))}
        </div>
        <p className="line">{student.pendingLine ? `“${student.pendingLine}”` : t('card.notAsking')}</p>
      </div>
      <div className="card-buttons">
        <button onClick={onHearAgain} aria-label={t('card.hearAgain', { name: student.persona.name })} title={t('card.hearIt')}>🔊</button>
        <button onClick={onNextHand} disabled={handsUp === 0} title={t('card.nextHand')}>✋ {handsUp}</button>
        <button className={`show-phone${notebookOpen ? ' on' : ''}`} onClick={onNotebook} aria-pressed={notebookOpen} aria-label={t('class.notebook')} title={t('class.notebook')}>
          📓{newNotes && <span className="mark" aria-label={t('class.newNotes')}>●</span>}
        </button>
      </div>
    </div>
  );
}
