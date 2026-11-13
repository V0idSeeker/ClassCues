import { useEffect, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent, MouseEvent } from 'react';
import { MAX_TURNS, atmosphere, classClock, coverage } from '../game/lesson';
import type { LessonState, Turn } from '../game/types';
import { speak, stopSpeaking } from '../voice';
import { HAND, SCENE_VIEWBOX, STATE, portraitSvg, sceneSvg } from './scene';

interface Props {
  state: LessonState;
  used: number;
  busy: boolean;
  error: string;
  voiceOn: boolean;
  onVoice(on: boolean): void;
  onTurn(t: Turn): void;
  onHear(id: string): void;
  onAsk(id: string, question: string): void;
  onAskClass(question: string): void;
  onBell(): void;
  onRetry(): void;
  onSettings(): void;
  onLevels(): void;
}

const still = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

export default function Classroom(p: Props) {
  const { state } = p;
  // Several boards, like slides: one is on show, the others keep their text.
  const [pages, setPages] = useState<string[]>(state.boardPages);
  const [pageNo, setPageNo] = useState(state.boardPage);
  const board = pages[pageNo] ?? '';
  const withBoard = (text: string) => pages.map((x, i) => (i === pageNo ? text : x));
  const setBoard = (text: string) => setPages(withBoard(text));
  const turnWith = (say: string, allPages = pages, no = pageNo): Turn => ({ say, board: allPages.join('\n'), pages: allPages, page: no });
  const [wiped, setWiped] = useState<string | null>(null);
  const [text, setText] = useState('');
  const [sel, setSel] = useState(state.students[0].persona.id);
  const [atBoard, setAtBoard] = useState(false);
  const [realistic, setRealistic] = useState(false);
  const [talking, setTalking] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now());
  const boardRef = useRef<HTMLTextAreaElement>(null);
  const logRef = useRef<HTMLDivElement>(null);
  const spoken = useRef(state.transcript.length);

  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, []);
  useEffect(() => { logRef.current?.scrollTo(0, logRef.current.scrollHeight); }, [state.transcript.length]);
  useEffect(() => stopSpeaking, []);

  // A student's new line is spoken in their voice, and their mouth moves while it plays.
  useEffect(() => {
    const fresh = state.transcript.slice(spoken.current);
    spoken.current = state.transcript.length;
    if (!p.voiceOn) return;
    const line = [...fresh].reverse().find(l => state.students.some(s => s.persona.name === l.who));
    const speaker = line && state.students.find(s => s.persona.name === line.who);
    if (line && speaker) speak(line.text, speaker.persona.voice, on => setTalking(on ? speaker.persona.id : null));
  }, [state.transcript.length]);

  const student = state.students.find(s => s.persona.id === sel) ?? state.students[0];
  const inNotes = coverage(state);
  const typed = text.trim();
  const scene = useMemo(() => sceneSvg(state.students, student.persona.id, talking, still), [state.students, student.persona.id, talking]);
  const chips = student.handUp ? [HAND, STATE[student.emotion]] : [STATE[student.emotion]];

  function say() {
    if (!typed) return;
    p.onTurn(turnWith(typed));
    setText('');
  }
  function writeOnBoard() {
    if (!typed) return;
    const next = board.trimEnd() ? `${board.trimEnd()}\n${typed}` : typed;
    setPages(withBoard(next));
    p.onTurn(turnWith('', withBoard(next)));
    setText('');
  }
  // Changing board shows the class another one. Text on a board the class has not seen yet is new to them.
  function showBoard(allPages: string[], no: number) {
    setPages(allPages);
    setPageNo(no);
    setWiped(null);
    p.onTurn(turnWith('', allPages, no));
  }
  function eraseSelected() {
    const el = boardRef.current;
    if (!el) return;
    el.setRangeText('');
    setBoard(el.value);
  }
  // Selecting a student whose hand is up lets them speak.
  function pick(id: string) {
    setSel(id);
    if (!p.busy && state.students.find(s => s.persona.id === id)?.handUp) p.onHear(id);
  }
  function pickFromScene(e: MouseEvent | KeyboardEvent) {
    if ('key' in e && e.key !== 'Enter' && e.key !== ' ') return;
    const id = (e.target as Element).closest('[data-id]')?.getAttribute('data-id');
    if (!id) return;
    if ('key' in e) e.preventDefault();
    pick(id);
  }
  function nextHand() {
    const i = state.students.findIndex(s => s.persona.id === sel);
    const up = [...state.students.slice(i + 1), ...state.students.slice(0, i + 1)].find(s => s.handUp);
    if (up) setSel(up.persona.id);
  }
  function callOn() {
    if (student.handUp) p.onHear(sel);
    else { p.onAsk(sel, typed || `${student.persona.name}, what are you thinking? Do you have a question?`); setText(''); }
  }
  function hearAgain() {
    const last = [...state.transcript].reverse().find(l => l.who === student.persona.name);
    const words = student.pendingLine ?? last?.text;
    if (words) speak(words, student.persona.voice, on => setTalking(on ? student.persona.id : null));
  }

  const boardBox = (className: string) => (
    <textarea ref={boardRef} className={className} spellCheck={false} placeholder="Click the board and write…"
      aria-label="The board. Students copy what you write here. Select words to erase or change them."
      value={board} onChange={e => setBoard(e.target.value)}
      onBlur={() => { if (pages.join('\n') !== state.board) p.onTurn(turnWith('')); }} />
  );

  return (
    <div className="page">
      <div className="row">
        <h1 className="grow">{state.chapter.title}</h1>
        <span className="pill">Clock {classClock(state, now)} / 45:00</span>
        <span className="pill">Turn {state.turns} / {MAX_TURNS}</span>
        <span className="pill" title="How the class feels as a whole. It spreads: bored or lost classmates pull others along.">Class mood: {atmosphere(state).mood}</span>
        <span className="pill">AI requests today {p.used}</span>
        <label className="check" style={{ margin: 0 }}><input type="checkbox" checked={p.voiceOn} onChange={e => { if (!e.target.checked) stopSpeaking(); p.onVoice(e.target.checked); }} />Voices</label>
        <label className="check" style={{ margin: 0 }}><input type="checkbox" checked={realistic} onChange={e => setRealistic(e.target.checked)} />Realistic mode</label>
        <button onClick={p.onLevels}>Lessons and PDF import</button>
        <button onClick={p.onSettings}>Settings</button>
        <button className="go" onClick={p.onBell} disabled={p.busy}>Ring the bell: quiz time</button>
      </div>

      <div className="play">
        <div className="col">
          <div className="panel">
            <h2>Student</h2>
            <div className="talk">
              <div className="pic" dangerouslySetInnerHTML={{ __html: portraitSvg(student) }} />
              <div>
                <b className="who">{student.persona.name}</b>
                <div className="chips">{chips.map(c => <span key={c.label} className="chip" style={{ borderColor: c.color }}>{c.icon} {c.label}</span>)}</div>
              </div>
            </div>
            <p className="line">{student.pendingLine ? `“${student.pendingLine}”` : 'Not asking anything right now.'}</p>
            <div className="row">
              <button onClick={nextHand} disabled={!state.students.some(s => s.handUp)}>Next raised hand</button>
              <button onClick={hearAgain}>🔊 Hear it</button>
              <button onClick={callOn} disabled={p.busy} title={student.handUp ? 'Hear what they want to say' : 'Asks them what you typed. With nothing typed, invites them to speak.'}>Call on {student.persona.name}</button>
              <button onClick={() => { p.onAskClass(typed || 'Does anyone have a question about this?'); setText(''); }} disabled={p.busy} title="Asks the class what you typed. With nothing typed, asks if anyone has a question.">Ask the class</button>
            </div>
          </div>
          <div className="paper">
            <h2>{student.persona.name}'s notebook</h2>
            {realistic ? <p>Hidden in realistic mode.</p> : (
              <ul>
                {student.notes.map((n, i) => <li key={i} className={n.distorted ? 'bent' : ''}>{n.text}</li>)}
                {student.beliefs.map(b => <li key={b.id} className="wrong">{b.text}</li>)}
                {student.notes.length + student.beliefs.length === 0 && <li>(empty)</li>}
                {student.memory.map((m, i) => <li key={`m${i}`} className="old">{m}</li>)}
              </ul>
            )}
          </div>
        </div>

        <div className="col">
          {atBoard ? (
            <div className="bigboard">
              {boardBox('chalk')}
              <div className="strip" aria-label="Students, seen from the board">
                {state.students.map(s => (
                  <button key={s.persona.id} className={`mini${s.handUp ? ' up' : ''}${s.persona.id === sel ? ' sel' : ''}`} onClick={() => pick(s.persona.id)}
                    aria-label={`${s.persona.name}${s.handUp ? ', hand raised' : ''}`}>
                    <span dangerouslySetInnerHTML={{ __html: portraitSvg(s) }} />{s.persona.name}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="stage">
              <div className="stage-in">
                <svg viewBox={SCENE_VIEWBOX} role="group" aria-label="Classroom with the students at their desks"
                  onClick={pickFromScene} onKeyDown={pickFromScene} dangerouslySetInnerHTML={{ __html: scene }} />
                {boardBox('chalk wall-board')}
              </div>
            </div>
          )}

          <div className="row">
            <button className="gold" onClick={() => setAtBoard(!atBoard)}>{atBoard ? 'Back to the class' : 'Go to the board'}</button>
            <button onClick={() => showBoard(pages, pageNo - 1)} disabled={pageNo === 0} aria-label="Previous board">◀</button>
            <span className="pill">Board {pageNo + 1} of {pages.length}</span>
            <button onClick={() => showBoard(pages, pageNo + 1)} disabled={pageNo >= pages.length - 1} aria-label="Next board">▶</button>
            <button onClick={() => showBoard([...pages, ''], pages.length)} disabled={pages.length >= 12}>New board</button>
            {pages.length > 1 && <button onClick={() => showBoard(pages.filter((_, i) => i !== pageNo), Math.max(0, pageNo - 1))}>Remove this board</button>}
            <button onClick={eraseSelected}>Erase selected words</button>
            <button onClick={() => { setWiped(board); setBoard(''); }} disabled={!board}>Wipe the board</button>
            {wiped !== null && <button onClick={() => { setBoard(wiped); setWiped(null); }}>Undo wipe</button>}
          </div>

          <div className="panel say">
            <textarea aria-label="What you say to the class" placeholder="Type what you say to the class… End with a question mark and a student will answer." value={text}
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
              {state.transcript.map((l, i) => l.who === 'note'
                ? <div key={i} className="dim">{l.text}</div>
                : <div key={i}><b>{l.who === 'teacher' ? 'You' : l.who === 'board' ? 'On the board' : l.who}:</b> {l.text}</div>)}
            </div>
          </div>
        </div>

        <div className="col">
          <div className="panel">
            <h2>Lesson goals · students who have it in their notes</h2>
            {state.chapter.objectives.map(o => (
              <div className="goal" key={o.id}>
                <span>{o.text}</span><b>{realistic ? '?' : `${inNotes[o.id]}/${state.students.length}`}</b>
                {!realistic && <span className="pips">{state.students.map((_, i) => <i key={i} className={i < inNotes[o.id] ? 'on' : ''} />)}</span>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
