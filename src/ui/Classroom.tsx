import { useEffect, useRef, useState } from 'react';
import { MAX_TURNS, classClock, coverage } from '../game/lesson';
import type { LessonState, Turn } from '../game/types';

interface Props {
  state: LessonState;
  used: number;
  busy: boolean;
  error: string;
  onTurn(t: Turn): void;
  onHear(id: string): void;
  onAsk(id: string, question: string): void;
  onAskClass(question: string): void;
  onBell(): void;
  onRetry(): void;
  onSettings(): void;
}

const FEELING = { CURIOUS: '! curious', CONFUSED: '? confused', BORED: 'z bored', HAPPY: '♪ happy', NEUTRAL: '… listening' };

export default function Classroom(p: Props) {
  const { state } = p;
  const [board, setBoard] = useState(state.board);
  const [wiped, setWiped] = useState<string | null>(null);
  const [text, setText] = useState('');
  const [sel, setSel] = useState(state.students[0].persona.id);
  const [realistic, setRealistic] = useState(false);
  const [now, setNow] = useState(Date.now());
  const boardRef = useRef<HTMLTextAreaElement>(null);
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, []);
  useEffect(() => { logRef.current?.scrollTo(0, logRef.current.scrollHeight); }, [state.transcript.length]);

  const student = state.students.find(s => s.persona.id === sel) ?? state.students[0];
  const inNotes = coverage(state);
  const typed = text.trim();

  function say() {
    if (!typed) return;
    p.onTurn({ say: typed, board });
    setText('');
  }
  function writeOnBoard() {
    if (!typed) return;
    const next = board.trimEnd() ? `${board.trimEnd()}\n${typed}` : typed;
    setBoard(next);
    p.onTurn({ say: '', board: next });
    setText('');
  }
  function eraseSelected() {
    const el = boardRef.current;
    if (!el) return;
    el.setRangeText('');
    setBoard(el.value);
  }
  function nextHand() {
    const i = state.students.findIndex(s => s.persona.id === sel);
    const order = [...state.students.slice(i + 1), ...state.students.slice(0, i + 1)];
    const up = order.find(s => s.handUp);
    if (up) setSel(up.persona.id);
  }
  function callOn() {
    if (student.handUp) p.onHear(sel);
    else if (typed) { p.onAsk(sel, typed); setText(''); }
  }

  return (
    <div className="page">
      <div className="row">
        <h1 className="grow">{state.chapter.title}</h1>
        <span className="pill">Clock {classClock(state, now)} / 45:00</span>
        <span className="pill">Turn {state.turns} / {MAX_TURNS}</span>
        <span className="pill">AI requests today {p.used}</span>
        <label className="check" style={{ margin: 0 }}><input type="checkbox" checked={realistic} onChange={e => setRealistic(e.target.checked)} />Realistic mode</label>
        <button onClick={p.onSettings}>Settings</button>
        <button className="go" onClick={p.onBell} disabled={p.busy}>Ring the bell: quiz time</button>
      </div>

      <div className="play">
        <div className="col">
          <div className="panel">
            <h2>Student</h2>
            <b>{student.persona.name}</b> <span className="dim">{student.handUp ? '✋ hand raised · ' : ''}{FEELING[student.emotion]}</span>
            <p>{student.pendingLine ? `“${student.pendingLine}”` : 'Not asking anything right now.'}</p>
            <div className="row">
              <button onClick={nextHand} disabled={!state.students.some(s => s.handUp)}>Next raised hand</button>
              <button onClick={callOn} disabled={p.busy || (!student.handUp && !typed)} title={student.handUp ? '' : 'Type a question first'}>Call on {student.persona.name}</button>
              <button onClick={() => { if (typed) { p.onAskClass(typed); setText(''); } }} disabled={p.busy || !typed} title="Type a question first">Ask the class</button>
            </div>
          </div>
          <div className="panel">
            <h2>{student.persona.name}'s notebook</h2>
            {realistic ? <p className="dim">Hidden in realistic mode.</p> : (
              <ul className="notes">
                {student.notes.map((n, i) => <li key={i} className={n.distorted ? 'bent' : ''}>{n.text}</li>)}
                {student.beliefs.map(b => <li key={b.id} className="wrong">{b.text} (wrong belief, not corrected yet)</li>)}
                {student.notes.length + student.beliefs.length === 0 && <li className="dim">Empty.</li>}
              </ul>
            )}
          </div>
        </div>

        <div className="col">
          <textarea ref={boardRef} className="board" aria-label="The board. Students copy what you write here." placeholder="Click the board and write…"
            value={board} onChange={e => setBoard(e.target.value)}
            onBlur={() => { if (board !== state.board) p.onTurn({ say: '', board }); }} />
          <div className="row">
            <button onClick={eraseSelected}>Erase selected words</button>
            <button onClick={() => { setWiped(board); setBoard(''); }} disabled={!board}>Wipe the board</button>
            {wiped !== null && <button onClick={() => { setBoard(wiped); setWiped(null); }}>Undo wipe</button>}
          </div>

          <div className="desks">
            {state.students.map(s => (
              <div key={s.persona.id} role="button" tabIndex={0} className={`desk${s.persona.id === sel ? ' sel' : ''}`}
                onClick={() => setSel(s.persona.id)} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') setSel(s.persona.id); }}>
                <b>{s.persona.name}</b>
                <span className="dim">{s.handUp ? '✋ hand up' : FEELING[s.emotion]}</span>
              </div>
            ))}
          </div>

          <div className="panel say">
            <textarea aria-label="What you say to the class" placeholder="Type what you say to the class…" value={text}
              onChange={e => setText(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); say(); } }} />
            <div className="row" style={{ marginTop: 8 }}>
              <button className="go" onClick={say} disabled={!typed}>Say it</button>
              <button onClick={writeOnBoard} disabled={!typed}>Write it on the board</button>
              {p.busy && <span className="dim" role="status">Students are thinking…</span>}
              {p.error && <><span className="error" role="alert">{p.error}</span><button onClick={p.onRetry}>Retry</button></>}
            </div>
          </div>

          <div className="panel">
            <h2>Class so far</h2>
            <div className="log" ref={logRef}>
              {state.transcript.map((l, i) => <div key={i}><b>{l.who === 'teacher' ? 'You' : l.who === 'board' ? 'On the board' : l.who}:</b> {l.text}</div>)}
            </div>
          </div>
        </div>

        <div className="col">
          <div className="panel">
            <h2>Lesson goals · students who have it in their notes</h2>
            {state.chapter.objectives.map(o => (
              <div className="goal" key={o.id}><span>{o.text}</span><b>{realistic ? '?' : `${inNotes[o.id]}/${state.students.length}`}</b></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
