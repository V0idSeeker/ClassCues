import { useEffect, useRef, useState } from 'react';
import { coverage } from '../game/lesson';
import type { LessonState, Turn } from '../game/types';
import { loadTips, saveTips } from '../storage';
import { speak, stopSpeaking } from '../voice';
import Compose from './classroom/Compose';
import Panels from './classroom/Panels';
import type { Panel } from './classroom/Panels';
import StageColumn from './classroom/StageColumn';
import StudentCard from './classroom/StudentCard';
import TopBar from './classroom/TopBar';
import { useBoards } from './classroom/useBoards';
import { useVisibleHeight } from './classroom/useVisibleHeight';
import { nextTip } from './help/tips';
import { t } from '../i18n';
import type { Key } from '../i18n';

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
  /** The lesson notes were opened during class. */
  onPeek(): void;
  onRetry(): void;
  onSettings(): void;
  onLevels(): void;
  onMenu(): void;
  /** Opens the guide, at a page when given. */
  onHelp(entry?: string): void;
}

/** The classroom screen: fits the visible window, the class on the left, the turn controls on the right. */
export default function Classroom(p: Props) {
  const { state } = p;
  const squeezed = useVisibleHeight();
  const boards = useBoards(state, p.canSeePictures, p.onTurn);
  const [sel, setSel] = useState(state.students[0].persona.id);
  const [realistic, setRealistic] = useState(false);
  const [panel, setPanel] = useState<Panel>('talk');
  const [talking, setTalking] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now());
  const spoken = useRef(state.transcript.length);

  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, []);
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
  const help = (entry: string, what: string) => (
    <button className="q" onClick={() => p.onHelp(entry)} aria-label={t('common.helpAbout', { what })} title={t('common.helpAbout', { what })}>?</button>
  );

  // The Notebook button is marked when students wrote something new since the notebook was last opened.
  const notesNow = state.students.reduce((n, s) => n + s.notes.length, 0);
  const [notesSeen, setNotesSeen] = useState(notesNow);
  useEffect(() => { if (panel === 'notebook') setNotesSeen(notesNow); }, [panel, notesNow]);
  const newNotes = !realistic && notesNow > notesSeen;

  const student = state.students.find(s => s.persona.id === sel) ?? state.students[0];
  const inNotes = coverage(state);
  const goalsReached = state.chapter.objectives.filter(o => inNotes[o.id] > 0).length;
  const hands = state.students.filter(s => s.handUp);
  const toggle = (which: Panel) => setPanel(panel === which ? 'talk' : which);

  // Selecting a student whose hand is up lets them speak.
  function pick(id: string) {
    setSel(id);
    if (!p.busy && state.students.find(s => s.persona.id === id)?.handUp) p.onHear(id);
  }
  function nextHand() {
    const i = state.students.findIndex(s => s.persona.id === sel);
    const up = [...state.students.slice(i + 1), ...state.students.slice(0, i + 1)].find(s => s.handUp);
    if (up) setSel(up.persona.id);
  }
  function hearAgain() {
    const last = [...state.transcript].reverse().find(l => l.who === student.persona.name);
    const words = student.pendingLine ?? last?.text;
    if (words) speak(words, student.persona.voice, on => setTalking(on ? student.persona.id : null));
  }

  return (
    <div className={`class-screen${squeezed ? ' kb' : ''}`}>
      <TopBar
        state={state} now={now} used={p.used} busy={p.busy} goalsReached={goalsReached} goalsOpen={panel === 'goals'}
        realistic={realistic} voiceOn={p.voiceOn} help={help}
        onGoals={() => toggle('goals')} onNotes={() => { if (panel !== 'notes') p.onPeek(); toggle('notes'); }} onRealistic={setRealistic} onVoice={p.onVoice}
        onHelp={() => p.onHelp()} onLevels={p.onLevels} onSettings={p.onSettings} onMenu={p.onMenu} onBell={p.onBell}
      />

      <div className="class-main">
        <StageColumn students={state.students} selected={student.persona.id} talking={talking} boards={boards} canSeePictures={p.canSeePictures} onPick={pick} />

        <aside className="rail">
          <StudentCard student={student} handsUp={hands.length} notebookOpen={panel === 'notebook'} newNotes={newNotes} help={help}
            onHearAgain={hearAgain} onNextHand={nextHand} onNotebook={() => toggle('notebook')} />

          <Panels panel={panel} state={state} student={student} inNotes={inNotes} realistic={realistic} help={help} onClose={() => setPanel('talk')} />

          {(tip || p.busy || p.error) && (
            <div className="status" role="status">
              {p.error ? <><span className="error grow" role="alert">{p.error}</span><button onClick={p.onRetry}>{t('common.retry')}</button></>
                : p.busy ? <span className="dim">{t('class.thinking')}</span>
                : tip && <>
                  <span className="grow"><b>{t('class.tip')}</b> {t(`tip.${tip.id}` as Key)}</span>
                  <button onClick={() => p.onHelp(tip.entry)}>{t('class.more')}</button>
                  <button onClick={() => keepTips({ ...tips, seen: [...tips.seen, tip.id] })}>{t('class.gotIt')}</button>
                  <button className="linkish" onClick={() => keepTips({ ...tips, off: true })}>{t('class.tipsOff')}</button>
                </>}
            </div>
          )}

          <Compose
            studentName={student.persona.name} studentHandUp={student.handUp} busy={p.busy}
            onSay={t => p.onTurn(boards.turnWith(t))}
            onWrite={boards.write}
            onCallOn={said => (student.handUp ? p.onHear(sel) : p.onAsk(sel, said || t('class.callOnDefault', { name: student.persona.name })))}
            onAskClass={said => p.onAskClass(said || t('class.askDefault'))}
          />

          <nav className="tabs hide-phone" aria-label={t('class.panels')}>
            <button className={panel === 'talk' ? 'on' : ''} aria-pressed={panel === 'talk'} onClick={() => setPanel('talk')}>{t('class.talk')}</button>
            <button className={panel === 'notebook' ? 'on' : ''} aria-pressed={panel === 'notebook'} onClick={() => toggle('notebook')}>
              {t('class.notebook')}{newNotes && <span className="mark" aria-label={t('class.newNotes')}>●</span>}
            </button>
            <button className={panel === 'goals' ? 'on' : ''} aria-pressed={panel === 'goals'} onClick={() => toggle('goals')}>
              {t('class.goals', { have: realistic ? '?' : goalsReached, total: state.chapter.objectives.length })}
            </button>
          </nav>
        </aside>
      </div>
    </div>
  );
}
