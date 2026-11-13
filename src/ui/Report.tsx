import type { Report as ReportType } from '../game/report';
import type { Chapter } from '../game/types';

interface Props { report: ReportType; chapter: Chapter; onAgain(): void }

export default function Report({ report, chapter, onAgain }: Props) {
  const prompt = (id: string) => chapter.quiz.find(q => q.id === id)?.prompt ?? id;
  return (
    <div className="page">
      <div className="row">
        <h1 className="grow">Report card · {chapter.title}</h1>
        <span className="pill">Class average {report.classAverage}%</span>
        <button className="go" onClick={onAgain}>Teach again</button>
      </div>

      <div className="panel" style={{ marginTop: 12 }}>
        <h2>Three tips for next time</h2>
        <ol>{report.tips.map((t, i) => <li key={i}>{t}</li>)}</ol>
      </div>

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
