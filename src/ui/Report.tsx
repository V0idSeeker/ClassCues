import { useState } from 'react';
import type { Badge, Rank } from '../game/rank';
import type { AfterQuiz, Report as ReportType } from '../game/report';
import type { Chapter, Difficulty } from '../game/types';
import { shareCard } from './shareCard';

interface Props {
  report: ReportType; after: AfterQuiz; chapter: Chapter; best: number; bestBefore: number | null;
  difficulty: Difficulty; rank: Rank; badges: Badge[]; onAgain(): void; onHelp(): void;
}

const LEVEL: Record<Difficulty, string> = { easy: 'Easy', normal: 'Normal', hard: 'Hard', inspection: 'Inspection' };

export default function Report({ report, after, chapter, best, bestBefore, difficulty, rank, badges, onAgain, onHelp }: Props) {
  const [shared, setShared] = useState('');
  const challenge = after.challenge;
  async function share() {
    try {
      const how = await shareCard({
        lesson: chapter.title, course: chapter.course, average: report.classAverage, best, rank: rank.name, difficulty: LEVEL[difficulty],
        challenge: challenge && { title: challenge.title, met: challenge.met }, date: new Date().toLocaleDateString(), version: __APP_VERSION__,
      });
      setShared(how === 'downloaded' ? 'The report card picture was downloaded.' : '');
    } catch (e) {
      setShared(`Could not make the picture: ${String(e)}`);
    }
  }
  const prompt = (id: string) => chapter.quiz.find(q => q.id === id)?.prompt ?? id;
  const { checked, errors } = after.factCheck;
  const sorted = errors && [...errors].sort((a, b) => Number(b.severity === 'major') - Number(a.severity === 'major'));
  const explain = after.explain;
  return (
    <div className="page">
      <div className="row">
        <h1 className="grow">Report card · {chapter.course ? `${chapter.course} · ` : ''}{chapter.title}</h1>
        <span className="pill">Class average {report.classAverage}%</span>
        <span className="pill">
          {bestBefore === null ? 'First time teaching this lesson' : report.classAverage > bestBefore ? `New best! Before: ${bestBefore}%` : `Your best: ${best}%`}
        </span>
        <span className="pill">{LEVEL[difficulty]} class</span>
        {difficulty === 'inspection' && <span className="stamp">Inspection</span>}
        <button className="go" onClick={onAgain}>Back to the lessons</button>
        <button onClick={() => void share()}>Share</button>
        <button onClick={onHelp}>What does this mean?</button>
      </div>
      {shared && <p className="dim" role="status">{shared}</p>}

      <div className="panel" style={{ marginTop: 12 }}>
        <h2>Your rank: {rank.name}</h2>
        <p>{rank.lessons} lesson{rank.lessons === 1 ? '' : 's'} taught, average best {rank.average}% (harder classes count more).
          {rank.next ? ` Next: ${rank.next.name} at ${rank.next.lessons} lessons and ${rank.next.average}%.` : ' This is the highest rank.'}</p>
        {badges.map(b => <p key={b.id} className="ok">New badge: <b>{b.name}</b> · {b.how}</p>)}
        {challenge && (
          <p>
            <b>{challenge.met === null ? 'Challenge not judged' : challenge.met ? 'Challenge met' : 'Challenge not met'}</b>: {challenge.title}. {challenge.reason}
          </p>
        )}
      </div>

      <div className="panel" style={{ marginTop: 12 }}>
        <h2>Three tips for next time</h2>
        <ol>{report.tips.map((t, i) => <li key={i}>{t}</li>)}</ol>
      </div>

      <div className="panel" style={{ marginTop: 12 }}>
        <h2>Your teaching, checked</h2>
        {!checked ? <p>You did not say or write anything, so there was nothing to check.</p>
          : sorted === null ? <p className="error">The check of what you said could not be made this time.</p>
          : sorted.length === 0 ? <p>No mistakes found in what you said and wrote.</p>
          : (
            <ul>
              {sorted.map((e, i) => (
                <li key={i}>
                  {e.severity === 'major' && <span className="pill">Major</span>} “{e.claim}” → {e.correction}
                </li>
              ))}
            </ul>
          )}
        <p className="dim">This check is made by the AI and can be wrong.</p>
      </div>

      {explain && (
        <div className="panel" style={{ marginTop: 12 }}>
          <h2>In {explain.name}'s own words</h2>
          {explain.text === null ? <p className="error">{explain.name}'s explanation could not be made this time.</p> : <p>{explain.text}</p>}
          <p>Goals missing from {explain.name}'s notes: {explain.missingGoals.length === 0 ? 'None' : ''}</p>
          {explain.missingGoals.length > 0 && <ul>{explain.missingGoals.map(g => <li key={g}>{g}</li>)}</ul>}
        </div>
      )}

      <div className="panel" style={{ marginTop: 12 }}>
        <h2>Goals</h2>
        <table>
          <thead><tr><th>Goal</th><th>In notes</th><th>Quiz average</th></tr></thead>
          <tbody>
            {report.objectives.map(o => (
              <tr key={o.id}><td>{o.text}</td><td>{o.inNotes}/{report.students.length}</td><td>{o.quizAverage === null ? 'not in quiz' : `${o.quizAverage}%`}</td></tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="panel" style={{ marginTop: 12 }}>
        <h2>Students</h2>
        {report.students.map(s => (
          <details key={s.id}>
            <summary><b>{s.name}</b> · {s.percent}%</summary>
            <table>
              <thead><tr><th>Question</th><th>Answer</th><th>Score</th><th>Why</th></tr></thead>
              <tbody>
                {s.answers.map(a => (
                  <tr key={a.question_id}><td>{prompt(a.question_id)}</td><td>{a.answer || '(no answer)'}</td><td>{Math.round(a.fraction * 100)}%</td><td>{a.feedback}</td></tr>
                ))}
              </tbody>
            </table>
          </details>
        ))}
      </div>
    </div>
  );
}
