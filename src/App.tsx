import { useEffect, useMemo, useRef, useState } from 'react';
import { explainBack, factCheck, judgeChallenge, makeAi, ping } from './ai/calls';
import { teacherLines } from './ai/prompts/factCheck';
import type { AiDeps } from './ai/calls';
import { autoModels, canReadPictures, listModelInfo } from './ai/models';
import { preferModel } from './ai/provider';
import { AiError } from './ai/provider';
import { studentPool } from './content';
import { AFTER_QUIZ_REQUESTS, mustRingBell, quizReserve } from './game/budget';
import { challengeById, challengeTitle, pickChallenge } from './game/challenges';
import { recordScore } from './game/course';
import { followUpChapter, heldAtBell } from './game/followup';
import { drawClass, lessonOver, mergeTurns, rememberLesson, startLesson } from './game/lesson';
import { earnedBadges, newBadges, rankOf } from './game/rank';
import type { Badge, Rank } from './game/rank';
import { closestToAverage, computeReport, missingGoals } from './game/report';
import type { AfterQuiz, Report as ReportType } from './game/report';
import { askStudent, hearStudent, pickForClassQuestion, runQuiz, teachTurn } from './game/runLesson';
import type { Chapter, Difficulty, LessonState, Persona, Turn } from './game/types';
import { addPlay, addRun, courseLessonIds, loadPlays, loadRuns, saveRuns } from './progress';
import { addLog, bumpUsed, clearLesson, hasSettings, helpSeen, markHelpSeen, loadGoodModel, loadLesson, loadMemory, loadScores, saveScores, saveGoodModel, loadSettings, loadSkipPrepare, saveMemory, loadUsed, saveLesson, saveSettings } from './storage';
import type { Settings as SettingsType } from './storage';
import Classroom from './ui/Classroom';
import Codex from './ui/help/Codex';
import MainMenu from './ui/MainMenu';
import Modules from './ui/Modules';
import Prepare from './ui/Prepare';
import Report from './ui/Report';
import Review from './ui/Review';
import Settings from './ui/Settings';

/** A lesson about to be taught. A follow-up keeps the same class and the wrong beliefs it was left with. */
interface Plan { chapter: Chapter; personas?: Persona[]; held?: Record<string, string[]> }

type Screen = 'menu' | 'settings' | 'modules' | 'prepare' | 'classroom' | 'quiz' | 'report' | 'review';

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
  const [studying, setStudying] = useState<Plan | null>(null);
  const [report, setReport] = useState<{
    report: ReportType; after: AfterQuiz; chapter: Chapter; best: number; bestBefore: number | null;
    difficulty: Difficulty; rank: Rank; badges: Badge[]; lesson: LessonState; followUp: Plan | null;
  } | null>(null);
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

  function play({ chapter, personas, held }: Plan) {
    queue.current = [];
    setError('');
    clearLesson();
    commit(startLesson(chapter, personas ?? drawClass(studentPool, Math.random), Math.random, Date.now(), loadMemory(),
      { difficulty: settings.difficulty, challenge: pickChallenge(Math.random).id, held }));
    setScreen('classroom');
  }

  // The study screen first, unless the player chose to skip it.
  const study = (plan: Plan) => { if (loadSkipPrepare()) play(plan); else { setStudying(plan); setScreen('prepare'); } };

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
      const out = await runQuiz(s, ai, Math.random, (done, total) => setProgress({ done, total: total + AFTER_QUIZ_REQUESTS }));
      const result = computeReport(s, out.answers, out.grades);
      const before = loadScores();
      const scores = recordScore(before, s.chapter.id, result.classAverage, new Date().toISOString());
      saveScores(scores);
      const memory = loadMemory();
      saveMemory(rememberLesson(memory, s));
      saveRuns(addRun(loadRuns(), s.chapter.id, result.objectives));
      clearLesson();
      lessonRef.current = null;
      queue.current = [];
      setLesson(null);

      // After the quiz, one call at a time (free tiers limit requests per minute). A failure never blocks the report.
      let done = s.students.length + s.chapter.quiz.filter(q => q.type === 'short').length;
      const total = done + AFTER_QUIZ_REQUESTS;
      const said = teacherLines(s.transcript).length > 0;
      const after: AfterQuiz = { factCheck: { checked: said, errors: [] }, explain: null, challenge: null };
      if (said) after.factCheck.errors = await factCheck(deps, s.chapter, s.transcript).then(r => r.errors, () => null);
      // Every student in class heard the mistakes: they remember them until the teacher corrects them.
      const errors = after.factCheck.errors ?? [];
      if (errors.length) saveMemory(rememberLesson(memory, s, errors.map(e => e.claim)));
      setProgress({ done: ++done, total });
      const student = s.students.find(st => st.persona.id === closestToAverage(result));
      if (student) {
        const text = await explainBack(deps, student, s.chapter.title).then(r => r.explanation, () => null);
        after.explain = { name: student.persona.name, text, missingGoals: missingGoals(student, s.chapter.objectives) };
      }
      setProgress({ done: ++done, total });
      // The challenge: checked in code when that is exact, otherwise by one AI call.
      const challenge = challengeById(s.challenge);
      if (challenge) {
        const title = challengeTitle(challenge, s);
        const judged = challenge.check ? challenge.check(s) : await judgeChallenge(deps, title, challenge.detection, s.transcript).catch(() => null);
        after.challenge = { title, met: judged?.met ?? null, reason: judged?.reason ?? 'The challenge could not be judged this time.' };
      }
      setProgress({ done: ++done, total });

      const held = heldAtBell(s, errors);
      const fix = followUpChapter(s.chapter, result.objectives, held, errors);
      const followUp = fix && { chapter: fix, personas: s.students.map(st => st.persona), held };
      const difficulty = s.difficulty ?? 'normal';
      const courses = courseLessonIds();
      const playsBefore = loadPlays();
      const plays = addPlay({
        levelId: s.chapter.id, percent: result.classAverage, difficulty, at: new Date().toISOString(),
        challengeMet: after.challenge?.met ?? null, factErrors: said ? after.factCheck.errors?.length ?? null : null,
      });
      const badges = newBadges(earnedBadges(playsBefore, courses, before), earnedBadges(plays, courses, scores));
      setReport({
        report: result, after, chapter: s.chapter, best: scores[s.chapter.id].best, bestBefore: before[s.chapter.id]?.best ?? null,
        difficulty, rank: rankOf(plays, scores), badges, lesson: s, followUp,
      });
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
          rank={rankOf(loadPlays(), loadScores())} badges={earnedBadges(loadPlays(), courseLessonIds(), loadScores())}
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
        <Modules deps={deps} lessonRunning={lesson !== null} onResume={() => setScreen('classroom')} onPlay={c => study({ chapter: c })} onSettings={() => setScreen('settings')}
          onMenu={() => setScreen('menu')} onHelp={() => openHelp('courses')} />
      )}

      {screen === 'prepare' && studying && (
        <Prepare chapter={studying.chapter} onStart={() => play(studying)} onBack={() => setScreen('modules')} onHelp={() => openHelp('lesson')} />
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

      {screen === 'report' && report && <Report {...report}
        onFollowUp={report.followUp ? () => study(report.followUp!) : null} onAgain={() => setScreen('modules')} onReview={() => setScreen('review')} onHelp={() => openHelp('report')} />}

      {screen === 'review' && report && <Review lesson={report.lesson} errors={report.after.factCheck.errors ?? []} onBack={() => setScreen('report')} />}

      {help && <Codex entry={help} onOpen={setHelp} onClose={() => setHelp(null)} />}

      {screen !== 'classroom' && screen !== 'menu' && <p className="dim footer">Class Is In Session · v{__APP_VERSION__}</p>}
    </>
  );
}
