import { useEffect, useMemo, useRef, useState } from 'react';
import { makeAi, ping } from './ai/calls';
import type { AiDeps } from './ai/calls';
import { autoModels, listModelInfo } from './ai/models';
import { isGemini, isOpenRouter, preferModel } from './ai/provider';
import { AiError } from './ai/provider';
import { studentPool } from './content';
import { mustRingBell, quizReserve } from './game/budget';
import { drawClass, lessonOver, mergeTurns, rememberLesson, startLesson } from './game/lesson';
import { computeReport } from './game/report';
import type { Report as ReportType } from './game/report';
import { askStudent, hearStudent, pickForClassQuestion, runQuiz, teachTurn } from './game/runLesson';
import type { Chapter, LessonState, Turn } from './game/types';
import { addLog, bumpUsed, clearLesson, hasSettings, loadGoodModel, loadLesson, loadMemory, saveGoodModel, loadSettings, saveMemory, loadUsed, saveLesson, saveSettings } from './storage';
import type { Settings as SettingsType } from './storage';
import Classroom from './ui/Classroom';
import Modules from './ui/Modules';
import Report from './ui/Report';
import Settings from './ui/Settings';

type Screen = 'settings' | 'modules' | 'classroom' | 'quiz' | 'report';

const explain = (e: unknown) => (e instanceof AiError ? e.message : `Something went wrong: ${String(e)}`);

export default function App() {
  const [settings, setSettings] = useState<SettingsType>(loadSettings);
  const [screen, setScreen] = useState<Screen>(() => (hasSettings() ? 'modules' : 'settings'));
  const [lesson, setLesson] = useState<LessonState | null>(null);
  const [report, setReport] = useState<{ report: ReportType; chapter: Chapter } | null>(null);
  const [used, setUsed] = useState(loadUsed);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState({ done: 0, total: 1 });

  // Refs hold the latest values for code that runs after an await.
  const lessonRef = useRef<LessonState | null>(null);
  const queue = useRef<Turn[]>([]);
  const running = useRef(false);
  const lastReact = useRef(0);

  // No model chosen: on OpenRouter and Gemini the game tries a short list of fitting models, best first.
  const [autoList, setAutoList] = useState<string[]>([]);
  useEffect(() => {
    let current = true;
    setAutoList([]);
    preferModel(settings.baseUrl, loadGoodModel(settings.baseUrl));
    if (settings.studentModel || !(isOpenRouter(settings.baseUrl) || isGemini(settings.baseUrl))) return;
    void listModelInfo(settings.baseUrl, settings.apiKey).then(list => { if (current) setAutoList(autoModels(settings.baseUrl, list)); });
    return () => { current = false; };
  }, [settings.baseUrl, settings.apiKey, settings.studentModel]);

  const deps = useMemo<AiDeps>(() => ({
    provider: settings,
    studentModel: settings.studentModel,
    graderModel: settings.graderModel || settings.studentModel,
    autoModels: autoList,
    onModel: model => saveGoodModel(settings.baseUrl, model),
    onRequest: () => setUsed(bumpUsed()),
    log: settings.debugLog ? addLog : undefined,
  }), [settings, autoList]);
  const ai = useMemo(() => makeAi(deps), [deps]);

  // Find out once which of those models answers, so the first lesson call does not wait on a silent one.
  const probed = useRef('');
  useEffect(() => {
    if (autoList.length < 2 || loadGoodModel(settings.baseUrl) || probed.current === settings.baseUrl) return;
    probed.current = settings.baseUrl;
    void ping(deps).catch(() => {});
  }, [deps]);

  function commit(state: LessonState) {
    lessonRef.current = state;
    setLesson(state);
    saveLesson(state, Date.now());
  }

  // A lesson that was running when the page closed continues where it stopped.
  useEffect(() => {
    const saved = hasSettings() ? loadLesson(Date.now()) : null;
    if (!saved) return;
    commit(saved);
    setScreen('classroom');
  }, []);

  function play(chapter: Chapter) {
    queue.current = [];
    setError('');
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
      setReport({ report: computeReport(s, out.answers, out.grades), chapter: s.chapter });
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
      {screen === 'settings' && (
        <Settings settings={settings} used={used} onSave={s => { saveSettings(s); setSettings(s); }} onPlay={() => setScreen(lessonRef.current ? 'classroom' : 'modules')} />
      )}

      {screen === 'modules' && (
        <Modules deps={deps} lessonRunning={lesson !== null} onResume={() => setScreen('classroom')} onPlay={play} onSettings={() => setScreen('settings')} />
      )}

      {screen === 'classroom' && lesson && (
        <Classroom
          state={lesson} used={used} busy={busy} error={error}
          voiceOn={settings.voiceOn} onVoice={on => { const next = { ...settings, voiceOn: on }; saveSettings(next); setSettings(next); }}
          onTurn={t => { queue.current.push(t); void pump(); }}
          onHear={id => void act(s => hearStudent(s, id))}
          onAsk={(id, q) => void act(s => askStudent(s, id, q, ai))}
          onAskClass={q => void act(s => askStudent(s, pickForClassQuestion(s, Math.random).persona.id, q, ai))}
          onBell={() => void bell()}
          onRetry={() => void pump()}
          onSettings={() => setScreen('settings')}
          onLevels={() => setScreen('modules')}
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

      {screen === 'report' && report && <Report report={report.report} chapter={report.chapter} onAgain={() => setScreen('modules')} />}

      <p className="dim footer">Class Is In Session · v{__APP_VERSION__}</p>
    </>
  );
}
