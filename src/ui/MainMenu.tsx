import { useMemo } from 'react';
import { studentPool } from '../content';
import { BADGES } from '../game/rank';
import type { Rank } from '../game/rank';
import type { Emotion, Student } from '../game/types';
import { SCENE_VIEWBOX, boardArea, sceneSvg } from './scene';
import { t } from '../i18n';

interface Props {
  rank: Rank;
  /** Ids of the badges earned. */
  badges: Set<string>;
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
            <h1>{t('app.title')}</h1>
            <p>{t('menu.tagline')}</p>
          </div>
        </div>
      </div>
      <nav className="menu-buttons" aria-label={t('menu.label')}>
        <div className="menu-rank">
          <b>{p.rank.name}</b>
          <details>
            <summary>{t('menu.badges', { have: p.badges.size, total: BADGES.length })}</summary>
            <ul>{BADGES.map(b => <li key={b.id} className={p.badges.has(b.id) ? '' : 'dim'}>{p.badges.has(b.id) ? '★' : '☆'} <b>{b.name}</b>: {b.how}</li>)}</ul>
          </details>
        </div>
        {p.lessonTitle && <button className="go" onClick={p.onContinue}>{t('menu.continue', { title: p.lessonTitle })}</button>}
        <button className={p.lessonTitle ? '' : 'go'} onClick={p.onStart}>{p.lessonTitle ? t('menu.another') : t('menu.start')}</button>
        <button className={p.firstVisit ? 'gold' : ''} onClick={p.onHelp}>{p.firstVisit ? t('menu.startHere') : t('menu.howToPlay')}</button>
        <button onClick={p.onSettings}>{t('common.settings')}</button>
        <p className="dim version">{t('app.version', { version: __APP_VERSION__ })}</p>
      </nav>
    </div>
  );
}
