import { groupTurns, matchClaims, turnMarkers } from '../game/review';
import type { FactError, LessonState, TranscriptLine, TurnSnapshot } from '../game/types';

interface Props { lesson: LessonState; errors: FactError[]; onBack(): void }

const MOODS: TurnSnapshot['mood'][] = ['lost', 'restless', 'calm', 'engaged'];
const goTo = (turn: number) => document.getElementById(`review-turn-${turn}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });

function Chart({ timeline, goals }: { timeline: TurnSnapshot[]; goals: number }) {
  const W = 640, L = 78, R = 12, top = 22, gh = 96, gap = 34, mh = 66, H = top + gh + gap + mh + 34;
  const n = timeline.length;
  const x = (i: number) => (n === 1 ? (L + W - R) / 2 : L + (i * (W - R - L)) / (n - 1));
  const gy = (g: number) => top + gh - (goals ? (g / goals) * gh : 0);
  const mTop = top + gh + gap;
  const my = (m: TurnSnapshot['mood']) => mTop + mh - (MOODS.indexOf(m) * mh) / (MOODS.length - 1);
  const path = (y: (s: TurnSnapshot) => number) => timeline.map((s, i) => `${i ? 'L' : 'M'}${x(i)},${y(s)}`).join(' ');
  const step = Math.max(1, Math.ceil(n / 12));
  return (
    <svg className="rv-chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Goals covered and class mood after each turn">
      {/* Goals: 0..N */}
      <text className="rv-text" x={4} y={top + gh / 2} dominantBaseline="middle">Goals</text>
      {[0, goals].map(g => (
        <g key={g}><line className="rv-grid" x1={L} x2={W - R} y1={gy(g)} y2={gy(g)} /><text className="rv-text" x={L - 6} y={gy(g)} textAnchor="end" dominantBaseline="middle">{g}</text></g>
      ))}
      <path className="rv-goals" d={path(s => gy(s.goals))} />
      {/* Mood as four levels */}
      <text className="rv-text" x={4} y={mTop - 12}>Mood</text>
      {MOODS.map(m => (
        <g key={m}><line className="rv-grid" x1={L} x2={W - R} y1={my(m)} y2={my(m)} /><text className="rv-text" x={L - 6} y={my(m)} textAnchor="end" dominantBaseline="middle">{m}</text></g>
      ))}
      <path className="rv-mood" d={path(s => my(s.mood))} />
      {timeline.map((s, i) => (
        <g key={s.turn} className="rv-point" role="button" tabIndex={0} aria-label={`Turn ${s.turn}: ${s.goals} of ${goals} goals, ${s.mood}${s.hands ? `, ${s.hands} hands up` : ''}`}
          onClick={() => goTo(s.turn)} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); goTo(s.turn); } }}>
          <title>Turn {s.turn}</title>
          <rect x={x(i) - 8} y={top - 16} width={16} height={H - top - 18} fill="transparent" />
          {s.hands > 0 && <text className="rv-hand" x={x(i)} y={top - 6} textAnchor="middle">✋</text>}
          <circle className="rv-goals-dot" cx={x(i)} cy={gy(s.goals)} r={4} />
          <circle className="rv-mood-dot" cx={x(i)} cy={my(s.mood)} r={4} />
          {(i % step === 0 || i === n - 1) && <text className="rv-text" x={x(i)} y={H - 18} textAnchor="middle">{s.turn}</text>}
        </g>
      ))}
      <text className="rv-text" x={(L + W - R) / 2} y={H - 2} textAnchor="middle">Turn</text>
    </svg>
  );
}

const speaker = (l: TranscriptLine) => (l.who === 'teacher' ? 'You' : l.who === 'board' ? 'On the board' : l.who);
const Mistake = ({ e }: { e: FactError }) => (
  <div className="rv-fact">{e.severity === 'major' && <span className="pill">Major</span>} ✗ “{e.claim}” → {e.correction}</div>
);

export default function Review({ lesson, errors, onBack }: Props) {
  const timeline = lesson.timeline ?? [];
  const goals = lesson.chapter.objectives.length;
  const groups = groupTurns(lesson.transcript, timeline);
  const { byLine, unmatched } = matchClaims(lesson.transcript, errors);
  const marks = turnMarkers(timeline);
  return (
    <div className="page narrow rv">
      <div className="row">
        <h1 className="grow">Lesson review · {lesson.chapter.title}</h1>
        <button onClick={onBack}>Back to the report</button>
      </div>

      <div className="panel" style={{ marginTop: 12 }}>
        <h2>Turn by turn</h2>
        {timeline.length === 0 ? <p>No turns were recorded for this lesson.</p> : (
          <>
            <Chart timeline={timeline} goals={goals} />
            <p className="dim">Goals: how many lesson goals at least one student has in their notes. ✋: hands were up. Click a turn to jump to it.</p>
          </>
        )}
      </div>

      {groups.map(g => (
        <div key={g.turn} id={`review-turn-${g.turn}`} className="panel rv-turn" style={{ marginTop: 12 }}>
          <div className="row">
            <h2 className="grow">{g.turn === 0 ? 'Before the first turn' : `Turn ${g.turn}`}</h2>
            {(marks.get(g.turn) ?? []).map(m => <span key={m} className={`pill ${m === 'class drifted' ? 'rv-drift' : 'rv-gain'}`}>{m}</span>)}
          </div>
          <div className="log rv-log">
            {g.lines.map(({ line, index }) => line.who === 'note'
              ? <div key={index} className="dim">{line.text}</div>
              : (
                <div key={index}>
                  <b>{speaker(line)}:</b> {line.text}
                  {(byLine.get(index) ?? []).map((e, k) => <Mistake key={k} e={e} />)}
                </div>
              ))}
          </div>
          {g.snapshot && (
            <p className="dim">
              After this turn: class {g.snapshot.mood} · {g.snapshot.hands} {g.snapshot.hands === 1 ? 'hand' : 'hands'} up · {g.snapshot.goals} of {goals} goals covered
            </p>
          )}
        </div>
      ))}

      {unmatched.length > 0 && (
        <div className="panel" style={{ marginTop: 12 }}>
          <h2>Mistakes not matched to a line</h2>
          {unmatched.map((e, k) => <Mistake key={k} e={e} />)}
        </div>
      )}
    </div>
  );
}
