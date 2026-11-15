import { useState } from 'react';
import type { Chapter } from '../game/types';
import { loadRuns, oftenMissed } from '../progress';
import { loadSkipPrepare, saveSkipPrepare } from '../storage';
import StudyNotes from './StudyNotes';

interface Props { chapter: Chapter; onStart(): void; onBack(): void; onHelp(): void }

/** Study before teaching: the lesson's goals, notes and the wrong beliefs students will bring. */
export default function Prepare({ chapter, onStart, onBack, onHelp }: Props) {
  const [skip, setSkip] = useState(loadSkipPrepare);
  const [missed] = useState(() => oftenMissed(loadRuns(), chapter.id, chapter.objectives));
  return (
    <div className="page narrow">
      <div className="row">
        <div className="grow">
          {chapter.course && <p className="dim">{chapter.course}</p>}
          <h1>{chapter.title}</h1>
        </div>
        <button onClick={onHelp}>Help</button>
      </div>
      <div className="panel">
        {missed.length > 0 && (
          <>
            <h2>Your classes often missed:</h2>
            <ul>{missed.map(o => <li key={o.id}>{o.text}</li>)}</ul>
          </>
        )}
        <StudyNotes chapter={chapter} />
        <h2>How to teach it</h2>
        <ul>
          <li>Cover every goal.</li>
          <li>Write the key points on the board.</li>
          <li>Ask questions to check what students understood.</li>
          <li>Correct wrong beliefs out loud.</li>
        </ul>
        <p className="dim">The quiz has {chapter.quiz.length} question{chapter.quiz.length === 1 ? '' : 's'}. It stays hidden until you ring the bell.</p>
        <label className="check"><input type="checkbox" checked={skip} onChange={e => { setSkip(e.target.checked); saveSkipPrepare(e.target.checked); }} />Skip this screen next time</label>
        <div className="row" style={{ marginTop: 12 }}>
          <button onClick={onBack}>Back to the lessons</button>
          <span className="grow" />
          <button className="go" onClick={onStart}>Start the lesson</button>
        </div>
      </div>
    </div>
  );
}
