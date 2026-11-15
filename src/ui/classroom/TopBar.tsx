import type { ReactNode } from 'react';
import { challengeById, challengeTitle } from '../../game/challenges';
import { MAX_TURNS, atmosphere, classClock } from '../../game/lesson';
import type { LessonState } from '../../game/types';
import { stopSpeaking } from '../../voice';
import { t } from '../../i18n';

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
  const found = challengeById(state.challenge);
  const challenge = found && challengeTitle(found, state);
  return (
    <header className="topbar">
      <h1>{state.chapter.title}</h1>
      <span className="pill hide-phone">{t('top.clock', { clock: classClock(state, p.now) })}</span>
      <span className="pill" title={t('top.turnsUsed')}>{t('top.turn', { n: state.turns, max: MAX_TURNS })}</span>
      <span className="pill" title={t('top.moodTitle')}>
        <span className="hide-phone">{t('top.mood')}</span>{t(`mood.${atmosphere(state).mood}`)}
      </span>{p.help('class-mood', t('class.whatClassMood'))}
      {challenge && <span className="pill challenge-chip" title={t('top.challengeTitle', { title: challenge })}><span className="hide-phone">{t('top.challenge')}</span>🎯 {challenge}</span>}
      <button className={`pill-button${p.goalsOpen ? ' on' : ''}`} onClick={p.onGoals} aria-pressed={p.goalsOpen}
        title={t('top.goalsTitle')}>
        {t('class.goals', { have: p.realistic ? '?' : p.goalsReached, total: state.chapter.objectives.length })}
      </button>
      <button className="hide-phone" onClick={p.onHelp}>{t('common.help')}</button>
      <details className="menu-pop">
        <summary aria-label={t('top.more')}>☰</summary>
        <div className="menu-pop-list">
          <span className="dim">{t('top.requests', { version: __APP_VERSION__, used: p.used })}</span>
          {challenge && <span>{t('top.challengeTitle', { title: challenge })}</span>}
          <label className="check"><input type="checkbox" checked={p.voiceOn} onChange={e => { if (!e.target.checked) stopSpeaking(); p.onVoice(e.target.checked); }} />{t('top.voices')}</label>
          <label className="check"><input type="checkbox" checked={p.realistic} onChange={e => p.onRealistic(e.target.checked)} />{t('top.realistic')}</label>
          <button onClick={p.onNotes}>{t('class.lessonNotes')}</button>
          <button onClick={p.onHelp}>{t('common.help')}</button>
          <button onClick={p.onLevels}>{t('top.levels')}</button>
          <button onClick={p.onSettings}>{t('common.settings')}</button>
          <button onClick={p.onMenu}>{t('common.mainMenu')}</button>
        </div>
      </details>
      <button className="go" onClick={p.onBell} disabled={p.busy} title={t('top.bellTitle')}>🔔<span className="hide-phone">{t('top.bell')}</span></button>
    </header>
  );
}
