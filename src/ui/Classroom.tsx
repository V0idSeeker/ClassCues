import { useEffect, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent, MouseEvent } from 'react';
import { MAX_TURNS, atmosphere, boardText, classClock, coverage } from '../game/lesson';
import type { LessonState, Turn } from '../game/types';
import { loadArt, loadTips, saveArt, saveTips } from '../storage';
import { nextTip } from './help/tips';
import { speak, stopSpeaking } from '../voice';
import BoardArt, { addPicture, pictureForStudents } from './BoardArt';
import { HAND, SCENE_VIEWBOX, STATE, portraitSvg, sceneSvg } from './scene';

interface Props {
  state: LessonState;
  used: number;
  busy: boolean;
  error: string;
  /** The students' model reads pictures: drawing on the board is offered, and students see it. */
  canSeePictures: boolean;
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
  onMenu(): void;
  /** Opens the guide, at a page when given. */
  onHelp(entry?: string): void;
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
  // Each board can carry a picture (drawn or pasted) and a description of it. Students read only the description.
  const [caps, setCaps] = useState<string[]>(state.boardCaptions);
  const [art, setArt] = useState<(string | null)[]>(() => { const saved = loadArt(); return state.boardPages.map((_, i) => saved[i] ?? null); });
  const [drawing, setDrawing] = useState(false);
  const [chalk, setChalk] = useState('#f5f7f2');
  const drawingNow = drawing && p.canSeePictures;
  // Each board's picture as the students' model gets it, made ready whenever a picture changes.
  const [seen, setSeen] = useState<(string | null)[]>([]);
  useEffect(() => {
    let current = true;
    void Promise.all(art.map(a => (a ? pictureForStudents(a).catch(() => null) : null))).then(list => { if (current) setSeen(list); });
    return () => { current = false; };
  }, [art]);
  const keepArt = (next: (string | null)[]) => { setArt(next); saveArt(next); };
  const allText = (allPages = pages, allCaps = caps) => allPages.map((t, i) => boardText(t, allCaps[i])).join('\n');
  const turnWith = (say: string, allPages = pages, no = pageNo, allCaps = caps): Turn =>
    ({ say, board: allText(allPages, allCaps), pages: allPages, page: no, captions: allCaps, picture: p.canSeePictures ? seen[no] ?? null : null });
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

  // Tips: the first time something happens, a line explains it, with a link to the guide.
  const [tips, setTips] = useState(loadTips);
  const tip = tips.off ? null : nextTip(state, tips.seen);
  const keepTips = (next: { off: boolean; seen: string[] }) => { setTips(next); saveTips(next); };
  const ask = (entry: string, what: string) => (
    <button className="q" onClick={() => p.onHelp(entry)} aria-label={`Help: ${what}`} title={`What is ${what}?`}>?</button>
  );

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
  function showBoard(no: number, allPages = pages, allCaps = caps) {
    setPages(allPages);
    setCaps(allCaps);
    setPageNo(no);
    setWiped(null);
    p.onTurn(turnWith('', allPages, no, allCaps));
  }
  function addBoard() {
    keepArt([...art, null]);
    showBoard(pages.length, [...pages, ''], [...caps, '']);
  }
  function removeBoard() {
    const others = <T,>(list: T[]) => list.filter((_, i) => i !== pageNo);
    keepArt(others(art));
    showBoard(Math.max(0, pageNo - 1), others(pages), others(caps));
  }
  async function pastePicture(file: File | undefined) {
    if (!file) return;
    try {
      const picture = await addPicture(file, art[pageNo] ?? null);
      keepArt(art.map((a, i) => (i === pageNo ? picture : a)));
    } catch {
      // An unreadable file leaves the board as it was.
    }
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
    <>
      {p.canSeePictures && (
        <BoardArt key={pageNo} art={art[pageNo] ?? null} drawing={drawingNow} color={chalk}
          onChange={picture => keepArt(art.map((a, i) => (i === pageNo ? picture : a)))} />
      )}
      <textarea ref={boardRef} className={`${className}${drawingNow ? ' under' : ''}`} spellCheck={false} placeholder="Click the board and write…"
        aria-label="The board. Students copy what you write here. Select words to erase or change them."
        value={board} onChange={e => setBoard(e.target.value)}
        onBlur={() => { if (allText() !== state.board) p.onTurn(turnWith('')); }} />
    </>
  );

  return (
    <div className="page">
      <div className="row">
        <h1 className="grow">{state.chapter.title}</h1>
        <span className="pill">Clock {classClock(state, now)} / 45:00</span>
        <span className="pill">Turn {state.turns} / {MAX_TURNS}</span>
        <span className="pill" title="How the class feels as a whole. It spreads: bored or lost classmates pull others along.">Class mood: {atmosphere(state).mood}</span>{ask('class-mood', 'class mood')}
        <span className="pill">AI requests today {p.used}</span>
        <label className="check" style={{ margin: 0 }}><input type="checkbox" checked={p.voiceOn} onChange={e => { if (!e.target.checked) stopSpeaking(); p.onVoice(e.target.checked); }} />Voices</label>
        <label className="check" style={{ margin: 0 }}><input type="checkbox" checked={realistic} onChange={e => setRealistic(e.target.checked)} />Realistic mode</label>
        <button onClick={() => p.onHelp()}>Help</button>
        <button onClick={p.onLevels}>Lessons and PDF import</button>
        <button onClick={p.onSettings}>Settings</button>
        <button onClick={p.onMenu}>Main menu</button>
        <button className="go" onClick={p.onBell} disabled={p.busy}>Ring the bell: quiz time</button>
      </div>

      {tip && (
        <div className="tip" role="status">
          <span className="grow"><b>Tip:</b> {tip.text}</span>
          <button onClick={() => p.onHelp(tip.entry)}>Tell me more</button>
          <button onClick={() => keepTips({ ...tips, seen: [...tips.seen, tip.id] })}>Got it</button>
          <button className="linkish" onClick={() => keepTips({ ...tips, off: true })}>Turn tips off</button>
        </div>
      )}

      <div className="play">
        <div className="col">
          <div className="panel">
            <h2>Student {ask('moods', 'a student\'s mood')}</h2>
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
            <h2>{student.persona.name}'s notebook {ask('notebooks', 'the notebook')}</h2>
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
              <div className="board-wrap">{boardBox('chalk')}</div>
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
            <button onClick={() => showBoard(pageNo - 1)} disabled={pageNo === 0} aria-label="Previous board">◀</button>
            <span className="pill">Board {pageNo + 1} of {pages.length}</span>
            <button onClick={() => showBoard(pageNo + 1)} disabled={pageNo >= pages.length - 1} aria-label="Next board">▶</button>
            <button onClick={addBoard} disabled={pages.length >= 12}>New board</button>
            {pages.length > 1 && <button onClick={removeBoard}>Remove this board</button>}
            <button onClick={eraseSelected}>Erase selected words</button>
            <button onClick={() => { setWiped(board); setBoard(''); }} disabled={!board}>Wipe the board</button>
            {wiped !== null && <button onClick={() => { setBoard(wiped); setWiped(null); }}>Undo wipe</button>}
          </div>

          {!p.canSeePictures && <p className="dim" style={{ margin: 0 }}>Drawing on the board is off: the AI model in use cannot read pictures. Gemini models can; so can some OpenRouter models. Change it in Settings.</p>}
          {p.canSeePictures && <>
          <div className="row">
            <button className={drawing ? 'gold' : ''} aria-pressed={drawing} onClick={() => setDrawing(!drawing)}>{drawing ? 'Drawing: click to type again' : 'Draw on the board'}</button>
            {drawing && [['#f5f7f2', 'White chalk'], ['#ffe08a', 'Yellow chalk'], ['#ff9aa8', 'Pink chalk'], ['#9fd4f5', 'Blue chalk']].map(([c, name]) => (
              <button key={c} className={`swatch${chalk === c ? ' on' : ''}`} style={{ background: c }} aria-label={name} aria-pressed={chalk === c} onClick={() => setChalk(c)} />
            ))}
            <label className="filebutton">Add a picture
              <input type="file" accept="image/*" onChange={e => { void pastePicture(e.target.files?.[0]); e.target.value = ''; }} />
            </label>
            {art[pageNo] && <button onClick={() => keepArt(art.map((a, i) => (i === pageNo ? null : a)))}>Clear the picture</button>}
          </div>
          {(art[pageNo] || caps[pageNo]) && (
            <label htmlFor="caption" style={{ marginTop: 0 }}>Students see this picture with your next sentence. Optional: also say in words what it shows.
              <input id="caption" value={caps[pageNo] ?? ''} placeholder="For example: a box labelled score with the number 10 inside"
                onChange={e => setCaps(caps.map((c, i) => (i === pageNo ? e.target.value : c)))}
                onBlur={() => { if (allText() !== state.board) p.onTurn(turnWith('')); }} />
            </label>
          )}
          </>}

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
            <h2>Lesson goals · students who have it in their notes {ask('goals', 'lesson goals')}</h2>
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
