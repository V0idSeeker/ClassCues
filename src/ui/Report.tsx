import { useState } from 'react';
import type { Badge, Rank } from '../game/rank';
import { mistakePenalty } from '../game/report';
import type { AfterQuiz, Report as ReportType } from '../game/report';
import type { Chapter, Difficulty, LessonState } from '../game/types';
import { shareCard } from './shareCard';
import { t } from '../i18n';

interface Props {
  report: ReportType; after: AfterQuiz; chapter: Chapter; best: number; bestBefore: number | null;
  difficulty: Difficulty; rank: Rank; badges: Badge[];
  /** Lesson score: the class average minus the mistakes that were not disputed. */
  score: number; disputed: string[]; lesson: LessonState;
  onDispute(claim: string): void;
  /** Starts a follow-up lesson on what the class missed; null when there is nothing to fix. */
  onFollowUp: (() => void) | null;
  onAgain(): void; onReview(): void; onHelp(): void;
}


export default function Report({ report, after, chapter, best, bestBefore, difficulty, rank, badges, score, disputed, lesson, onDispute, onFollowUp, onAgain, onReview, onHelp }: Props) {
  const [shared, setShared] = useState('');
  const challenge = after.challenge;
  async function share() {
    try {
      const how = await shareCard({
        lesson: chapter.title, course: chapter.course, average: report.classAverage, best, rank: rank.name, difficulty: t(`difficulty.${difficulty}`),
        challenge: challenge && { title: challenge.title, met: challenge.met }, date: new Date().toLocaleDateString(), version: __APP_VERSION__,
      });
      setShared(how === 'downloaded' ? t('report.downloaded') : '');
    } catch (e) {
      setShared(t('report.noPicture', { error: String(e) }));
    }
  }
  const prompt = (id: string) => chapter.quiz.find(q => q.id === id)?.prompt ?? id;
  const { checked, errors } = after.factCheck;
  const sorted = errors && [...errors].sort((a, b) => Number(b.severity === 'major') - Number(a.severity === 'major'));
  const explain = after.explain;
  const cost = mistakePenalty(errors ?? [], disputed);
  const peeks = lesson.peeks ?? 0;
  return (
    <div className="page">
      <div className="row">
        <h1 className="grow">{t('report.title')} · {chapter.course ? `${chapter.course} · ` : ''}{chapter.title}</h1>
        <span className="pill">{t('report.average', { average: report.classAverage })}</span>
        {cost > 0 && <span className="pill bad">{t('report.cost', { points: cost })}</span>}
        <span className="pill strong">{t('report.lessonScore', { score })}</span>
        <span className="pill">
          {bestBefore === null ? t('report.first') : score > bestBefore ? t('report.newBest', { before: bestBefore }) : t('report.best', { best })}
        </span>
        <span className="pill">{t('report.level', { level: t(`difficulty.${difficulty}`) })}</span>
        {difficulty === 'inspection' && <span className="stamp">{t('difficulty.inspection')}</span>}
        <button className="go" onClick={onAgain}>{t('report.again')}</button>
        <button onClick={onReview}>{t('report.review')}</button>
        <button onClick={() => void share()}>{t('report.share')}</button>
        <button onClick={onHelp}>{t('report.meaning')}</button>
      </div>
      {shared && <p className="dim" role="status">{shared}</p>}

      <div className="panel" style={{ marginTop: 12 }}>
        <h2>{t('report.rank', { rank: rank.name })}</h2>
        <p>{t('report.rankLine', { count: rank.lessons, average: rank.average })}
          {rank.next ? t('report.next', { name: rank.next.name, lessons: rank.next.lessons, average: rank.next.average }) : t('report.top')}</p>
        {badges.map(b => <p key={b.id} className="ok">{t('report.newBadge')} <b>{b.name}</b> · {b.how}</p>)}
        {challenge && (
          <p>
            <b>{challenge.met === null ? t('report.challengeNone') : challenge.met ? t('report.challengeMet') : t('report.challengeNot')}</b>: {challenge.title}. {challenge.reason}
          </p>
        )}
      </div>

      <div className="panel" style={{ marginTop: 12 }}>
        <h2>{t('report.tips')}</h2>
        <ol>{report.tips.map((t, i) => <li key={i}>{t}</li>)}</ol>
        {peeks > 0 && <p>{t('report.peeks', { count: peeks })} {t('report.peeksTip')}</p>}
      </div>

      <div className="panel" style={{ marginTop: 12 }}>
        <h2>{t('report.checked')}</h2>
        {!checked ? <p>{t('report.nothingSaid')}</p>
          : sorted === null ? <p className="error">{t('report.checkFailed')}</p>
          : sorted.length === 0 ? <p>{t('report.noMistakes')}</p>
          : (
            <ul>
              {sorted.map((e, i) => (
                <li key={i} className={disputed.includes(e.claim) ? 'disputed' : undefined}>
                  {e.severity === 'major' && <span className="pill">{t('report.major')}</span>} “{e.claim}” → {e.correction}{' '}
                  {disputed.includes(e.claim)
                    ? <span className="dim">{t('report.disputed')}</span>
                    : <button className="small" onClick={() => onDispute(e.claim)}>{t('report.disagree')}</button>}
                </li>
              ))}
            </ul>
          )}
        {sorted && sorted.length > 0 && <p className="dim">{t('report.costLine')}</p>}
        <p className="dim">{t('report.aiWarning')}</p>
      </div>

      <div className="panel" style={{ marginTop: 12 }}>
        <h2>{t('report.fix')}</h2>
        {onFollowUp ? (
          <>
            <p>{t('report.fixLine')}</p>
            <button className="go" onClick={onFollowUp}>{t('report.followUp')}</button>
          </>
        ) : after.factCheck.checked && after.factCheck.errors === null
          ? <p>{t('report.uncheckedGoals')}</p>
          : <p>{t('report.wellTaught')}</p>}
      </div>

      {explain && (
        <div className="panel" style={{ marginTop: 12 }}>
          <h2>{t('report.ownWords', { name: explain.name })}</h2>
          {explain.text === null ? <p className="error">{t('report.noExplain', { name: explain.name })}</p> : <p>{explain.text}</p>}
          <p>{t('report.missing', { name: explain.name })} {explain.missingGoals.length === 0 ? t('report.none') : ''}</p>
          {explain.missingGoals.length > 0 && <ul>{explain.missingGoals.map(g => <li key={g}>{g}</li>)}</ul>}
        </div>
      )}

      <div className="panel" style={{ marginTop: 12 }}>
        <h2>{t('report.goals')}</h2>
        <table>
          <thead><tr><th>{t('report.goal')}</th><th>{t('report.inNotes')}</th><th>{t('report.quizAverage')}</th></tr></thead>
          <tbody>
            {report.objectives.map(o => (
              <tr key={o.id}><td>{o.text}</td><td>{o.inNotes}/{report.students.length}</td><td>{o.quizAverage === null ? t('report.notInQuiz') : `${o.quizAverage}%`}</td></tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="panel" style={{ marginTop: 12 }}>
        <h2>{t('report.students')}</h2>
        {report.students.map(s => (
          <details key={s.id}>
            <summary><b>{s.name}</b> · {s.percent}%</summary>
            <table>
              <thead><tr><th>{t('report.question')}</th><th>{t('report.answer')}</th><th>{t('report.score')}</th><th>{t('report.why')}</th></tr></thead>
              <tbody>
                {s.answers.map(a => (
                  <tr key={a.question_id}><td>{prompt(a.question_id)}</td><td>{a.answer || t('report.noAnswer')}</td><td>{Math.round(a.fraction * 100)}%</td><td>{a.feedback}</td></tr>
                ))}
              </tbody>
            </table>
          </details>
        ))}
      </div>
    </div>
  );
}
