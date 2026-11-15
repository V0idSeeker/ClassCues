import { useEffect, useMemo, useRef, useState } from 'react';
import { makeAi, ping } from './ai/calls';
import type { AiDeps } from './ai/calls';
import { autoModels, canReadPictures, listModelInfo } from './ai/models';
import { preferModel } from './ai/provider';
import { AiError } from './ai/provider';
import { studentPool } from './content';
import { mustRingBell, quizReserve } from './game/budget';
import { recordScore } from './game/course';
import { drawClass, lessonOver, mergeTurns, rememberLesson, startLesson } from './game/lesson';
import { computeReport } from './game/report';
import type { Report as ReportType } from './game/report';
import { askStudent, hearStudent, pickForClassQuestion, runQuiz, teachTurn } from './game/runLesson';
import type { Chapter, LessonState, Turn } from './game/types';
import { addLog, bumpUsed, clearLesson, hasSettings, helpSeen, markHelpSeen, loadGoodModel, loadLesson, loadMemory, loadScores, saveScores, saveGoodModel, loadSettings, loadSkipPrepare, saveMemory, loadUsed, saveLesson, saveSettings } from './storage';
import type { Settings as SettingsType } from './storage';
import Classroom from './ui/Classroom';
import Codex from './ui/help/Codex';
import MainMenu from './ui/MainMenu';
import Modules from './ui/Modules';
import Prepare from './ui/Prepare';
import Report from './ui/Report';
import Settings from './ui/Settings';

type Screen = 'menu' | 'settings' | 'modules' | 'prepare' | 'classroom' | 'quiz' | 'report';

const explain = (e: unknown) => (e instanceof AiError ? e.message : `Something went wrong: ${String(e)}`);

export default function App() {
  const [settings, setSettings] = useState<SettingsType>(loadSettings);
  const [screen, setScreen] = useState<Screen>('menu');
  // The guide opens over any screen, so a running lesson is never interrupted. null: closed.
  const [help, setHelp] = useState<string | null>(null);
  const [firstVisit, setFirstVisit] = useState(() => !helpSeen());
  const openHelp = (entry = 'goal') => { setHelp(entry); markHelpSeen(); setFirstVisit(false); };
  const [lesson, setLesson] = useState<LessonState | null>(null);
  // The lesson being studied on the prepare screen, before it starts.
  const [studying, setStudying] = useState<Chapter | null>(null);
  const [report, setReport] = useState<{ report: ReportType; chapter: Chapter; best: number; bestBefore: number | null } | null>(null);
  const [used, setUsed] = useState(loadUsed);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState({ done: 0, total: 1 });

  // Refs hold the latest values for code that runs after an await.
  const lessonRef = useRef<LessonState | null>(null);
  const queue = useRef<Turn[]>([]);
  const running = useRef(false);
  const lastReact = useRef(0);

  // No model chosen: on OpenRouter, Gemini and Groq the game tries a short list of fitting models, best first.
  // The list comes from the provider; AI calls wait for it, so no call goes out with a guessed model name.
  const autoList = useMemo<Promise<string[]>>(
    () => (settings.studentModel
      ? Promise.resolve([])
      : listModelInfo(settings.baseUrl, settings.apiKey).then(list => autoModels(settings.baseUrl, list))),
    [settings.baseUrl, settings.apiKey, settings.studentModel],
  );
  useEffect(() => { preferModel(settings.baseUrl, loadGoodModel(settings.baseUrl)); }, [settings.baseUrl]);

  const deps = useMemo<AiDeps>(() => ({
    provider: settings,
    studentModel: settings.studentModel,
    graderModel: settings.graderModel || settings.studentModel,
    autoModels: () => autoList,
    onModel: model => saveGoodModel(settings.baseUrl, model),
    onRequest: () => setUsed(bumpUsed()),
    log: settings.debugLog ? addLog : undefined,
  }), [settings, autoList]);
  const ai = useMemo(() => makeAi(deps), [deps]);

  // Can the students' model see pictures? Only then is drawing on the board offered.
  const [vision, setVision] = useState(false);
  useEffect(() => {
    let current = true;
    void listModelInfo(settings.baseUrl, settings.apiKey).then(list => {
      const model = settings.studentModel || autoModels(settings.baseUrl, list)[0] || '';
      if (current) setVision(canReadPictures(settings.baseUrl, model, list, settings.forceVision));
    });
    return () => { current = false; };
  }, [settings.baseUrl, settings.apiKey, settings.studentModel, settings.forceVision]);

  // Find out once which of those models answers, so the first lesson call does not wait on a silent one.
  const probed = useRef('');
  useEffect(() => {
    let current = true;
    void autoList.then(list => {
      if (!current || list.length < 2 || loadGoodModel(settings.baseUrl) || probed.current === settings.baseUrl) return;
      probed.current = settings.baseUrl;
      void ping(deps).catch(() => {});
    });
    return () => { current = false; };
  }, [deps]);

  function commit(state: LessonState) {
    lessonRef.current = state;
    setLesson(state);
    saveLesson(state, Date.now());
  }

  // A lesson that was running when the page closed can be continued from the main menu.
  useEffect(() => {
    const saved = hasSettings() ? loadLesson(Date.now()) : null;
    if (saved) commit(saved);
  }, []);

  function play(chapter: Chapter) {
    queue.current = [];
    setError('');
    clearLesson();
    commit(startLesson(chapter, drawClass(studentPool, Math.random), Math.random, Date.now(), loadMemory()));
    setScreen('classroom');
  }

  // Sends queued turns one call at a time. Turns typed while a call runs are merged into the next call.
  async function pump() {
    if (running.current) return;
    running.current = true;
    setBusy(true);
    setError('');
    try {
      while (queue.current.length > 0 && lessonRef.current) {
        const count = queue.current.length;
        const out = await teachTurn(lessonRef.current, mergeTurns(queue.current), ai, Math.random, Date.now(), lastReact.current);
        queue.current.splice(0, count);
        if (out.reactedAt !== null) lastReact.current = out.reactedAt;
        commit(out.state);
      }
    } catch (e) {
      setError(explain(e));
    } finally {
      running.current = false;
      setBusy(false);
    }
  }

  // One-off actions (call on, ask the class) wait their turn behind a running call.
  async function act(fn: (s: LessonState) => LessonState | Promise<LessonState>) {
    const s = lessonRef.current;
    if (!s || running.current) return;
    running.current = true;
    setBusy(true);
    setError('');
    try {
      commit(await fn(s));
    } catch (e) {
      setError(explain(e));
    } finally {
      running.current = false;
      setBusy(false);
      void pump();
    }
  }

  async function bell() {
    const s = lessonRef.current;
    if (!s || running.current) return;
    running.current = true;
    setError('');
    setProgress({ done: 0, total: 1 });
    setScreen('quiz');
    try {
      const out = await runQuiz(s, ai, Math.random, (done, total) => setProgress({ done, total }));
      const result = computeReport(s, out.answers, out.grades);
      const before = loadScores();
      const scores = recordScore(before, s.chapter.id, result.classAverage, new Date().toISOString());
      saveScores(scores);
      setReport({ report: result, chapter: s.chapter, best: scores[s.chapter.id].best, bestBefore: before[s.chapter.id]?.best ?? null });
      saveMemory(rememberLesson(loadMemory(), s));
      clearLesson();
      lessonRef.current = null;
      queue.current = [];
      setLesson(null);
      setScreen('report');
    } catch (e) {
      setError(explain(e));
    } finally {
      running.current = false;
    }
  }

  // The bell rings by itself at the turn cap, the time cap, or when a free daily limit is nearly used up.
  useEffect(() => {
    if (screen !== 'classroom') return;
    const timer = setInterval(() => {
      const s = lessonRef.current;
      if (!s || running.current || queue.current.length > 0) return;
      const reserve = quizReserve(s.students.length, s.chapter.quiz);
      if (lessonOver(s, Date.now()) || mustRingBell(loadUsed(), settings.dailyLimit, reserve)) void bell();
    }, 1000);
    return () => clearInterval(timer);
  });

  return (
    <>
      {screen === 'menu' && (
        <MainMenu
          lessonTitle={lesson?.chapter.title ?? null} firstVisit={firstVisit}
          onContinue={() => setScreen('classroom')}
          onStart={() => setScreen(hasSettings() ? 'modules' : 'settings')}
          onHelp={() => openHelp()}
          onSettings={() => setScreen('settings')}
        />
      )}

      {screen === 'settings' && (
        <Settings settings={settings} used={used} onSave={s => { saveSettings(s); setSettings(s); }} onPlay={() => setScreen(lessonRef.current ? 'classroom' : 'modules')}
          onMenu={() => setScreen('menu')} onHelp={() => openHelp('providers')} />
      )}

      {screen === 'modules' && (
        <Modules deps={deps} lessonRunning={lesson !== null} onResume={() => setScreen('classroom')} onPlay={c => { if (loadSkipPrepare()) play(c); else { setStudying(c); setScreen('prepare'); } }} onSettings={() => setScreen('settings')}
          onMenu={() => setScreen('menu')} onHelp={() => openHelp('courses')} />
      )}

      {screen === 'prepare' && studying && (
        <Prepare chapter={studying} onStart={() => play(studying)} onBack={() => setScreen('modules')} onHelp={() => openHelp('lesson')} />
      )}

      {screen === 'classroom' && lesson && (
        <Classroom
          state={lesson} used={used} busy={busy} error={error}
          canSeePictures={vision}
          voiceOn={settings.voiceOn} onVoice={on => { const next = { ...settings, voiceOn: on }; saveSettings(next); setSettings(next); }}
          onTurn={t => { queue.current.push(t); void pump(); }}
          onHear={id => void act(s => hearStudent(s, id))}
          onAsk={(id, q) => void act(s => askStudent(s, id, q, ai))}
          onAskClass={q => void act(s => askStudent(s, pickForClassQuestion(s, Math.random).persona.id, q, ai))}
          onBell={() => void bell()}
          onRetry={() => void pump()}
          onSettings={() => setScreen('settings')}
          onLevels={() => setScreen('modules')}
          onMenu={() => setScreen('menu')}
          onHelp={openHelp}
        />
      )}

      {screen === 'quiz' && (
        <div className="page narrow">
          <h1>Quiz in progress</h1>
          <div className="panel">
            <p role="status">Students are writing… {progress.done} of {progress.total} steps done.</p>
            <progress value={progress.done} max={progress.total} style={{ width: '100%' }} />
            {error && <p className="error" role="alert">{error} <button onClick={() => void bell()}>Retry the quiz</button></p>}
          </div>
        </div>
      )}

      {screen === 'report' && report && <Report report={report.report} chapter={report.chapter} best={report.best} bestBefore={report.bestBefore} onAgain={() => setScreen('modules')} onHelp={() => openHelp('report')} />}

      {help && <Codex entry={help} onOpen={setHelp} onClose={() => setHelp(null)} />}

      {screen !== 'classroom' && <p className="dim footer">Class Is In Session · v{__APP_VERSION__}</p>}
    </>
  );
}
