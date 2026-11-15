import { useState } from 'react';
import type { Chapter } from '../game/types';
import { loadRuns, oftenMissed } from '../progress';
import { loadSkipPrepare, saveSkipPrepare } from '../storage';
import StudyNotes from './StudyNotes';
import { isBuiltIn } from '../content';
import { getLang, t } from '../i18n';

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
        <button onClick={onHelp}>{t('common.help')}</button>
      </div>
      {getLang() !== 'en' && isBuiltIn(chapter) && <p className="dim">{t('common.builtInEnglish')}</p>}
      <div className="panel">
        {missed.length > 0 && (
          <>
            <h2>{t('prepare.missed')}</h2>
            <ul>{missed.map(o => <li key={o.id}>{o.text}</li>)}</ul>
          </>
        )}
        <StudyNotes chapter={chapter} />
        <h2>{t('prepare.how')}</h2>
        <ul>
          <li>{t('prepare.how1')}</li>
          <li>{t('prepare.how2')}</li>
          <li>{t('prepare.how3')}</li>
          <li>{t('prepare.how4')}</li>
        </ul>
        <p className="dim">{t('prepare.quiz', { count: chapter.quiz.length })}</p>
        <label className="check"><input type="checkbox" checked={skip} onChange={e => { setSkip(e.target.checked); saveSkipPrepare(e.target.checked); }} />{t('prepare.skip')}</label>
        <div className="row" style={{ marginTop: 12 }}>
          <button onClick={onBack}>{t('prepare.back')}</button>
          <span className="grow" />
          <button className="go" onClick={onStart}>{t('prepare.start')}</button>
        </div>
      </div>
    </div>
  );
}
