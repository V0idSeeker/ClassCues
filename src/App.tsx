import { useEffect, useMemo, useRef, useState } from 'react';
import { explainBack, factCheck, judgeChallenge, makeAi, ping } from './ai/calls';
import { teacherLines } from './ai/prompts/factCheck';
import type { AiDeps } from './ai/calls';
import { autoModels, canReadPictures, listModelInfo } from './ai/models';
import { preferModel } from './ai/provider';
import { AiError } from './ai/provider';
import { builtInChapter, builtInCourses, inLanguage, studentPool } from './content';
import { AFTER_QUIZ_REQUESTS, mustRingBell, quizReserve } from './game/budget';
import { challengeById, challengeTitle, pickChallenge } from './game/challenges';
import { recordScore } from './game/course';
import { gradeTicket, pickTicket } from './game/ticket';
import { demoAi } from './game/demo';
import type { TicketResult } from './game/ticket';
import ExitTicket from './ui/ExitTicket';
import type { Scores } from './game/course';
import { followUpChapter, heldAtBell } from './game/followup';
import { checkStudents, drawClass, forgetMistake, lessonOver, mergeTurns, rememberLesson, startLesson } from './game/lesson';
import { earnedBadges, newBadges, rankOf } from './game/rank';
import type { Badge, Rank } from './game/rank';
import { closestToAverage, computeReport, lessonScore, missingGoals } from './game/report';
import type { AfterQuiz, Report as ReportType } from './game/report';
import { askStudent, hearStudent, pickForClassQuestion, runQuiz, teachTurn } from './game/runLesson';
import type { Chapter, Difficulty, LessonState, Persona, QuizQuestion, Turn } from './game/types';
import { addPlay, addRun, courseLessonIds, loadPlays, loadReview, loadRuns, saveReview, saveRuns, updateLastPlay } from './progress';
import { answered, dueItems, scheduleMissed } from './game/spaced';
import Recall from './ui/Recall';
import { addLog, aiReady, bumpUsed, clearLesson, hasSettings, loadLevels, helpSeen, markHelpSeen, loadGoodModel, loadLesson, loadMemory, loadScores, saveScores, saveGoodModel, loadSettings, loadSkipPrepare, saveMemory, loadUsed, saveLesson, saveSettings } from './storage';
import type { Settings as SettingsType } from './storage';
import { setLang, t } from './i18n';
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

type Screen = 'menu' | 'settings' | 'modules' | 'prepare' | 'classroom' | 'quiz' | 'report' | 'review' | 'recall';

const explain = (e: unknown) => (e instanceof AiError ? e.message : t('common.somethingWrong', { error: String(e) }));

export default function App() {
  const [settings, setSettings] = useState<SettingsType>(loadSettings);
  // Set before any child renders, so the whole tree reads the chosen language.
  setLang(settings.language);
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
    /** Lesson score (class average minus mistakes), mistakes the teacher disputed, and what is needed to re-save after a dispute. */
    score: number; disputed: string[]; scoresBefore: Scores; at: string;
    /** The teacher's own answers during the quiz; null when skipped. */
    you: TicketResult | null;
    /** A demo lesson: nothing was saved. */
    demo: boolean;
  } | null>(null);
  // The teacher's own questions while the class takes the quiz. The report waits until they hand in or skip.
  const [ticket, setTicket] = useState<{ questions: QuizQuestion[]; handedIn?: Record<string, string> | null } | null>(null);
  const ticketWait = useRef<{ questions: QuizQuestion[]; answers: Promise<Record<string, string> | null>; resolve(a: Record<string, string> | null): void } | null>(null);
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
    lang: settings.language,
    autoModels: () => autoList,
    onModel: model => saveGoodModel(settings.baseUrl, model),
    onRequest: () => setUsed(bumpUsed()),
    log: settings.debugLog ? addLog : undefined,
  }), [settings, autoList]);
  // A demo lesson uses ready-made students instead of the AI, so it works without a key.
  const demo = !!lesson?.demo;
  const ai = useMemo(() => (demo ? demoAi() : makeAi(deps)), [deps, demo]);

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
    // Not before the player has set up an AI: without a key the request would only fail.
    if (!aiReady(settings)) return;
    let current = true;
    void autoList.then(list => {
      if (!current || list.length < 2 || loadGoodModel(settings.baseUrl) || probed.current === settings.baseUrl) return;
      probed.current = settings.baseUrl;
      void ping(deps).catch(() => {});
    });
    return () => { current = false; };
  }, [deps]);

  function commit(state: LessonState) {
    // A turn that started before the notes were opened returns a state without the newer peeks: keep the higher count.
    const peeks = Math.max(state.peeks ?? 0, lessonRef.current?.peeks ?? 0);
    if (peeks > 0 && peeks !== state.peeks) state = { ...state, peeks };
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
    commit(startLesson(chapter, (personas ?? drawClass(studentPool, Math.random)).map(p => inLanguage(p, settings.language)), Math.random, Date.now(), loadMemory(),
      { difficulty: settings.difficulty, challenge: pickChallenge(Math.random).id, held }));
    setScreen('classroom');
  }

  /** Three turns with ready-made students, before any AI is set up. Easy class, no challenge, nothing saved. */
  function playDemo() {
    queue.current = [];
    setError('');
    clearLesson();
    const state = startLesson(builtInChapter, drawClass(studentPool, Math.random).map(p => inLanguage(p, settings.language)), Math.random, Date.now(), {}, { difficulty: 'easy' });
    commit({ ...state, demo: true });
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
    if (!ticketWait.current) {
      const questions = pickTicket(s.chapter, Math.random);
      let resolve: (a: Record<string, string> | null) => void = () => {};
      const answers = new Promise<Record<string, string> | null>(r => { resolve = r; });
      ticketWait.current = { questions, answers, resolve };
      setTicket({ questions });
    }
    setScreen('quiz');
    try {
      const out = await runQuiz(s, ai, Math.random, (done, total) => setProgress({ done, total: total + AFTER_QUIZ_REQUESTS }));
      const result = computeReport(s, out.answers, out.grades);
      const before = loadScores();
      const at = new Date().toISOString();
      const memory = loadMemory();
      const demoRun = !!s.demo;
      if (!demoRun) {
        saveMemory(rememberLesson(memory, s));
        saveRuns(addRun(loadRuns(), s.chapter.id, result.objectives));
      }
      clearLesson();
      lessonRef.current = null;
      queue.current = [];
      setLesson(null);

      // After the quiz, one call at a time (free tiers limit requests per minute). A failure never blocks the report.
      let done = s.students.length + s.chapter.quiz.filter(q => q.type === 'short').length;
      const total = done + AFTER_QUIZ_REQUESTS;
      // A demo makes no AI calls after the quiz: there is no key yet.
      const said = !demoRun && teacherLines(s.transcript).length > 0;
      const after: AfterQuiz = { factCheck: { checked: said, errors: [] }, explain: null, challenge: null };
      if (said) after.factCheck.errors = await factCheck(deps, s.chapter, s.transcript).then(r => r.errors, () => null);
      // Every student in class heard the mistakes: they remember them until the teacher corrects them.
      const errors = after.factCheck.errors ?? [];
      if (errors.length) saveMemory(rememberLesson(memory, s, errors.map(e => e.claim)));
      setProgress({ done: ++done, total });
      // The lesson score counts the teacher's own mistakes; it is what best scores and rank use.
      const score = lessonScore(result.classAverage, errors);
      const scores = recordScore(before, s.chapter.id, score, at);
      if (!demoRun) saveScores(scores);
      const student = s.students.find(st => st.persona.id === closestToAverage(result));
      if (student && !demoRun) {
        const text = await explainBack(deps, student, s.chapter.title).then(r => r.explanation, () => null);
        after.explain = { name: student.persona.name, text, missingGoals: missingGoals(student, s.chapter.objectives) };
      }
      setProgress({ done: ++done, total });
      // The challenge: checked in code when that is exact, otherwise by one AI call.
      const challenge = challengeById(s.challenge);
      if (challenge) {
        const title = challengeTitle(challenge, s);
        const judged = challenge.check ? challenge.check(s) : await judgeChallenge(deps, title, challenge.detection, s.transcript).catch(() => null);
        after.challenge = { title, met: judged?.met ?? null, reason: judged?.reason ?? t('report.notJudged') };
      }
      setProgress({ done: ++done, total });

      // The teacher's own answers: wait for them to hand in or skip, then grade.
      const wait = ticketWait.current;
      const mine = wait ? await wait.answers : null;
      const you = wait && mine ? await gradeTicket(wait.questions, mine, ai, t('report.notGraded')) : null;
      ticketWait.current = null;
      setTicket(null);
      // Goals you got wrong yourself, or that no student had in their notes, come back for spaced review.
      const missed = [
        ...(you?.items.filter(i => i.fraction < 1).map(i => i.question.objective) ?? []),
        ...result.objectives.filter(o => o.inNotes === 0).map(o => o.id),
      ].filter((id): id is string => !!id);
      if (missed.length && !demoRun) saveReview(scheduleMissed(loadReview(), s.chapter.followUpOf ?? s.chapter.id, missed, Date.now()));
      const held = heldAtBell(s, errors);
      const fix = followUpChapter(s.chapter, result.objectives, held, errors);
      const followUp = !demoRun && fix ? { chapter: fix, personas: s.students.map(st => st.persona), held } : null;
      const difficulty = s.difficulty ?? 'normal';
      const courses = courseLessonIds();
      const playsBefore = loadPlays();
      const plays = demoRun ? playsBefore : addPlay({
        levelId: s.chapter.id, percent: score, difficulty, at, ...(s.peeks ? { peeks: s.peeks } : {}), ...(you ? { mastery: you.percent } : {}),
        challengeMet: after.challenge?.met ?? null, factErrors: said ? after.factCheck.errors?.length ?? null : null,
      });
      const badges = demoRun ? [] : newBadges(earnedBadges(playsBefore, courses, before), earnedBadges(plays, courses, scores));
      setReport({
        report: result, after, chapter: s.chapter, best: scores[s.chapter.id].best, bestBefore: before[s.chapter.id]?.best ?? null,
        difficulty, rank: rankOf(plays, scores), badges, lesson: s, followUp,
        score, disputed: [], scoresBefore: before, at, you, demo: demoRun,
      });
      setScreen('report');
    } catch (e) {
      setError(explain(e));
    } finally {
      running.current = false;
    }
  }

  /** The teacher disputes a fact-check mistake: it no longer costs points, and the class forgets it. */
  function dispute(claim: string) {
    if (!report || report.disputed.includes(claim)) return;
    const disputed = [...report.disputed, claim];
    const errors = (report.after.factCheck.errors ?? []).filter(e => !disputed.includes(e.claim));
    saveMemory(forgetMistake(loadMemory(), report.chapter.id, claim));
    const score = lessonScore(report.report.classAverage, errors);
    const scores = recordScore(report.scoresBefore, report.chapter.id, score, report.at);
    saveScores(scores);
    const plays = updateLastPlay({ percent: score, factErrors: errors.length });
    const s = report.lesson;
    const held = heldAtBell(s, errors);
    const fix = followUpChapter(s.chapter, report.report.objectives, held, errors);
    setReport({
      ...report, disputed, score, best: scores[report.chapter.id].best, rank: rankOf(plays, scores),
      followUp: fix && { chapter: fix, personas: s.students.map(st => st.persona), held },
    });
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
          onDemo={aiReady(settings) ? null : playDemo}
          onHelp={() => openHelp()}
          onSettings={() => setScreen('settings')}
        />
      )}

      {screen === 'settings' && (
        <Settings settings={settings} used={used} onSave={s => { saveSettings(s); setSettings(s); }} onPlay={() => setScreen(lessonRef.current ? 'classroom' : 'modules')}
          onMenu={() => setScreen('menu')} onHelp={() => openHelp('providers')}
          onLanguage={language => { const next = { ...settings, language }; saveSettings(next); setSettings(next); }} />
      )}

      {screen === 'modules' && (
        <Modules deps={deps} dueCount={dueItems(loadReview(), Date.now()).length} onRecall={() => setScreen('recall')} lessonRunning={lesson !== null} onResume={() => setScreen('classroom')} onPlay={c => study({ chapter: c })} onSettings={() => setScreen('settings')}
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
          onAskClass={q => void act(async s => { const out = await askStudent(s, pickForClassQuestion(s, Math.random).persona.id, q, ai); return checkStudents(out, out.students.map(st => st.persona.id)); })}
          onBell={() => void bell()}
          onPeek={() => { const s = lessonRef.current; if (s) commit({ ...s, peeks: (s.peeks ?? 0) + 1 }); }}
          onRetry={() => void pump()}
          onSettings={() => setScreen('settings')}
          onLevels={() => setScreen('modules')}
          onMenu={() => setScreen('menu')}
          onHelp={openHelp}
        />
      )}

      {screen === 'quiz' && (
        <div className="page narrow">
          <h1>{t('quiz.title')}</h1>
          {ticket && (
            <div className="panel" style={{ marginBottom: 12 }}>
              <ExitTicket questions={ticket.questions} handedIn={ticket.handedIn}
                onHandIn={a => { setTicket(x => x && { ...x, handedIn: a }); ticketWait.current?.resolve(a); }} />
            </div>
          )}
          <div className="panel">
            <p role="status">{t('quiz.progress', { done: progress.done, total: progress.total })}</p>
            <progress value={progress.done} max={progress.total} style={{ width: '100%' }} />
            {error && <p className="error" role="alert">{error} <button onClick={() => void bell()}>{t('quiz.retry')}</button></p>}
          </div>
        </div>
      )}

      {screen === 'report' && report && <Report {...report} onDispute={dispute} onSetUp={() => setScreen('settings')}
        onFollowUp={report.followUp ? () => study(report.followUp!) : null} onAgain={() => setScreen('modules')} onReview={() => setScreen('review')} onHelp={() => openHelp('report')} />}

      {screen === 'recall' && (
        <Recall due={dueItems(loadReview(), Date.now())}
          findChapter={id => [...builtInCourses.flatMap(c => c.lessons), ...loadLevels()].find(c => c.id === id)}
          onAnswer={(item, right) => saveReview(answered(loadReview(), item, right, Date.now()))}
          onDrop={item => saveReview(loadReview().filter(i => !(i.lessonId === item.lessonId && i.objectiveId === item.objectiveId)))}
          onBack={() => setScreen('modules')} />
      )}

      {screen === 'review' && report && <Review lesson={report.lesson} errors={report.after.factCheck.errors ?? []} onBack={() => setScreen('report')} />}

      {help && <Codex entry={help} onOpen={setHelp} onClose={() => setHelp(null)} />}

      {screen !== 'classroom' && screen !== 'menu' && <p className="dim footer">{t('app.footer', { version: __APP_VERSION__ })}</p>}
    </>
  );
}
