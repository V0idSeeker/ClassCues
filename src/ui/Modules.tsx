import { useRef, useState } from 'react';
import { generateChapter } from '../ai/calls';
import type { AiDeps } from '../ai/calls';
import { builtInCourses } from '../content';
import { MAX_LESSON_CHARS, courseScore, splitIntoLessons, suggestedLessonCount } from '../game/course';
import type { Chapter, QuizQuestion } from '../game/types';
import { normalizeChapter, packLessons, unpackLessons, validateChapter } from '../game/validate';
import { loadLevels, loadScores, saveLevels } from '../storage';

interface Props { deps: AiDeps; lessonRunning: boolean; onPlay(c: Chapter): void; onResume(): void; onSettings(): void }
/** The PDFs the player picked: every page's text in order, and which pages to use. */
interface Source { names: string[]; pages: string[]; from: number; to: number; title: string; count: number }

const builtInIds = new Set(builtInCourses.flatMap(c => c.lessons.map(l => l.id)));
const message = (e: unknown) => (e instanceof Error ? e.message : String(e));
const clamp = (v: string, min: number, max: number) => Math.min(max, Math.max(min, Number(v) || min));

/** Saves one lesson, or several lessons as one file, to the player's computer. */
function download(name: string, lessons: Chapter[]) {
  const a = document.createElement('a');
  const data = lessons.length === 1 ? lessons[0] : packLessons(lessons);
  a.href = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
  a.download = `${name.replace(/[\\/:*?"<>|]+/g, '_').trim() || 'lessons'}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
}

export default function Modules(p: Props) {
  const [levels, setLevels] = useState<Chapter[]>(loadLevels);
  const [scores] = useState(loadScores);
  const [source, setSource] = useState<Source | null>(null);
  const [draft, setDraft] = useState<Chapter | null>(null);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [problems, setProblems] = useState<string[]>([]);
  const chapterText = useRef('');

  const keep = (next: Chapter[]) => { setLevels(next); saveLevels(next); };

  async function choosePdfs(files: FileList | null) {
    if (!files || files.length === 0) return;
    setError('');
    setNotice('');
    try {
      const { pdfPageTexts } = await import('../pdf');
      const pages: string[] = [];
      const names: string[] = [];
      for (const [i, file] of [...files].entries()) {
        setBusy(`Reading file ${i + 1} of ${files.length}: ${file.name}`);
        pages.push(...await pdfPageTexts(file));
        names.push(file.name);
      }
      setSource({ names, pages, from: 1, to: pages.length, title: names[0].replace(/\.pdf$/i, ''), count: suggestedLessonCount(pages) });
    } catch {
      setError('Could not open one of these files as a PDF.');
    } finally {
      setBusy('');
    }
  }

  /** One lesson: the AI writes it and the player reviews it before saving. */
  async function writeOne() {
    setBusy('The AI is writing the lesson… this can take a minute.');
    setDraft(await generateChapter(p.deps, chapterText.current));
    setProblems([]);
  }

  async function create() {
    if (!source) return;
    setError('');
    setNotice('');
    const made: Chapter[] = [];
    let parts: string[] = [];
    try {
      const pages = source.pages.slice(source.from - 1, source.to);
      if (pages.join('').replace(/\s/g, '').length < 200) throw new Error('These pages have no readable text. The PDF may be scanned images, which are not supported.');
      parts = splitIntoLessons(pages, source.count);
      const tooLong = parts.findIndex(part => part.length > MAX_LESSON_CHARS);
      if (tooLong >= 0) throw new Error(`Lesson ${tooLong + 1} would hold ${parts[tooLong].length.toLocaleString()} characters; the limit is ${MAX_LESSON_CHARS.toLocaleString()}. Ask for more lessons, or use fewer pages.`);

      if (parts.length === 1) {
        chapterText.current = parts[0];
        await writeOne();
        return;
      }
      const course = source.title.trim() || 'My course';
      for (const [i, text] of parts.entries()) {
        setBusy(`The AI is writing lesson ${i + 1} of ${parts.length}…`);
        const lesson = await generateChapter(p.deps, text, {
          course, part: i + 1, of: parts.length,
          earlier: made.map(m => ({ title: m.title, objectives: m.objectives.map(o => o.text) })),
        });
        made.push({ ...lesson, course, part: i + 1 });
        keep([...levels, ...made]);
      }
      setSource(null);
      setNotice(`Course "${course}" created with ${made.length} lessons. Open each with Edit to check its quiz before you teach it.`);
    } catch (e) {
      setError(made.length > 0 ? `Lesson ${made.length + 1} of ${parts.length} failed: ${message(e)} The first ${made.length} were saved.` : message(e));
    } finally {
      setBusy('');
    }
  }

  async function regenerate() {
    setError('');
    try {
      await writeOne();
    } catch (e) {
      setError(message(e));
    } finally {
      setBusy('');
    }
  }

  async function importLevel(file: File | undefined) {
    if (!file) return;
    setError('');
    try {
      const stamp = Date.now();
      const { lessons, problem } = unpackLessons(JSON.parse(await file.text()), i => `level-${stamp}-${i}`);
      if (problem) throw new Error(`This file cannot be used. ${problem}`);
      keep([...levels, ...lessons]);
      setNotice(lessons.length === 1 ? `Added the lesson "${lessons[0].title}".` : `Added ${lessons.length} lessons.`);
    } catch (e) {
      setError(e instanceof SyntaxError ? 'This file is not a lesson file.' : message(e));
    }
  }

  function saveDraft() {
    if (!draft) return;
    const found = validateChapter(draft);
    setProblems(found);
    if (found.length) return;
    const clean = normalizeChapter(draft, draft.id);
    keep(levels.some(l => l.id === clean.id) ? levels.map(l => (l.id === clean.id ? clean : l)) : [...levels, clean]);
    setDraft(null);
    setSource(null);
  }

  const editQuestion = (i: number, patch: Partial<QuizQuestion>) =>
    draft && setDraft({ ...draft, quiz: draft.quiz.map((q, k) => (k === i ? { ...q, ...patch } : q)) });

  if (draft) {
    const setQuiz = (quiz: QuizQuestion[]) => setDraft({ ...draft, quiz });
    const isSaved = levels.some(l => l.id === draft.id);
    return (
      <div className="page narrow">
        <h1>{isSaved ? 'Edit the lesson' : 'Review the new lesson'}</h1>
        <p className="dim">Everything here can be changed. Make the quiz as demanding as you like: you will have to teach well enough for students to pass it. Students never see the answers.</p>
        <div className="panel">
          <label htmlFor="d-title">Title</label>
          <input id="d-title" value={draft.title} onChange={e => setDraft({ ...draft, title: e.target.value })} />

          <h2 style={{ marginTop: 14 }}>Lesson goals</h2>
          {draft.objectives.map((o, i) => (
            <input key={o.id} aria-label={`Goal ${i + 1}`} style={{ marginBottom: 6 }} value={o.text}
              onChange={e => setDraft({ ...draft, objectives: draft.objectives.map((x, k) => (k === i ? { ...x, text: e.target.value } : x)) })} />
          ))}

          <label htmlFor="d-beliefs">Wrong beliefs some students start with (one per line)</label>
          <textarea id="d-beliefs" rows={Math.max(3, draft.common_misconceptions.length)} value={draft.common_misconceptions.join('\n')}
            onChange={e => setDraft({ ...draft, common_misconceptions: e.target.value.split('\n') })}
            onBlur={() => setDraft({ ...draft, common_misconceptions: draft.common_misconceptions.map(m => m.trim()).filter(Boolean) })} />

          <h2 style={{ marginTop: 14 }}>Quiz</h2>
          {draft.quiz.map((q, i) => (
            <div key={q.id} className="panel" style={{ marginBottom: 8 }}>
              <div className="row">
                <label htmlFor={`t-${q.id}`} style={{ flex: 1, marginTop: 0 }}>Question {i + 1}: kind
                  <select id={`t-${q.id}`} value={q.type}
                    onChange={e => editQuestion(i, e.target.value === 'mcq'
                      ? { type: 'mcq', choices: [q.answer_key || 'Right answer', 'Wrong answer 1', 'Wrong answer 2', 'Wrong answer 3'], answer_key: q.answer_key || 'Right answer', rubric: undefined }
                      : { type: 'short', choices: undefined, rubric: q.rubric ?? '1 point for a correct explanation. Max 1.' })}>
                    <option value="mcq">Multiple choice</option>
                    <option value="short">Written answer</option>
                  </select>
                </label>
                <label htmlFor={`o-${q.id}`} style={{ flex: 2, marginTop: 0 }}>Tests this goal
                  <select id={`o-${q.id}`} value={q.objective} onChange={e => editQuestion(i, { objective: e.target.value })}>
                    {draft.objectives.map(o => <option key={o.id} value={o.id}>{o.text}</option>)}
                  </select>
                </label>
              </div>
              <label htmlFor={`q-${q.id}`}>Question</label>
              <textarea id={`q-${q.id}`} rows={2} value={q.prompt} onChange={e => editQuestion(i, { prompt: e.target.value })} />
              {q.type === 'mcq' && q.choices ? (
                <>
                  {q.choices.map((c, k) => (
                    <label key={k} htmlFor={`c-${q.id}-${k}`}>Choice {k + 1}{c === q.answer_key ? ' (the right answer)' : ''}
                      <input id={`c-${q.id}-${k}`} value={c}
                        onChange={e => editQuestion(i, {
                          choices: q.choices!.map((x, j) => (j === k ? e.target.value : x)),
                          ...(c === q.answer_key ? { answer_key: e.target.value } : {}),
                        })} />
                    </label>
                  ))}
                  <label htmlFor={`a-${q.id}`}>Right answer</label>
                  <select id={`a-${q.id}`} value={q.answer_key} onChange={e => editQuestion(i, { answer_key: e.target.value })}>
                    {q.choices.map((c, k) => <option key={k} value={c}>{c}</option>)}
                  </select>
                </>
              ) : (
                <>
                  <label htmlFor={`a-${q.id}`}>Model answer</label>
                  <textarea id={`a-${q.id}`} rows={2} value={q.answer_key} onChange={e => editQuestion(i, { answer_key: e.target.value })} />
                  <label htmlFor={`r-${q.id}`}>How points are given (end with "Max N.")</label>
                  <input id={`r-${q.id}`} value={q.rubric ?? ''} onChange={e => editQuestion(i, { rubric: e.target.value })} />
                </>
              )}
              <div className="row" style={{ marginTop: 8 }}>
                <button onClick={() => setQuiz(draft.quiz.filter((_, k) => k !== i))} disabled={draft.quiz.length <= 1}>Remove this question</button>
              </div>
            </div>
          ))}
          <div className="row">
            <button disabled={draft.quiz.length >= 10} onClick={() => setQuiz([...draft.quiz, {
              id: `q${Date.now()}`, type: 'short', objective: draft.objectives[0]?.id ?? '', prompt: '', answer_key: '', rubric: '1 point for a correct explanation. Max 1.',
            }])}>Add a question</button>
          </div>

          {problems.map(x => <p key={x} className="error" role="alert">{x}</p>)}
          {error && <p className="error" role="alert">{error}</p>}
          {busy && <p className="dim" role="status">{busy}</p>}
          <div className="row" style={{ marginTop: 10 }}>
            {!isSaved && chapterText.current && <button onClick={() => void regenerate()} disabled={!!busy}>Regenerate from the PDF</button>}
            <button onClick={() => { setDraft(null); setProblems([]); }} disabled={!!busy}>{isSaved ? 'Cancel' : 'Discard'}</button>
            <span className="grow" />
            <button className="go" onClick={saveDraft} disabled={!!busy}>Save lesson</button>
          </div>
        </div>
      </div>
    );
  }

  // Lessons grouped into courses: the built-in ones, each imported course in lesson order, then single lessons.
  const courseNames = [...new Set(levels.filter(l => l.course).map(l => l.course as string))];
  const groups: { name: string; lessons: Chapter[]; own: boolean }[] = [
    ...builtInCourses.map(c => ({ name: c.name, lessons: c.lessons, own: false })),
    ...courseNames.map(name => ({ name, lessons: levels.filter(l => l.course === name).sort((a, b) => (a.part ?? 0) - (b.part ?? 0)), own: true })),
  ];
  const singles = levels.filter(l => !l.course);
  if (singles.length > 0) groups.push({ name: 'Single lessons', lessons: singles, own: false });
  const selectedPages = source ? source.to - source.from + 1 : 0;

  return (
    <div className="page narrow">
      <div className="row">
        <h1 className="grow">Choose a lesson</h1>
        {p.lessonRunning && <button className="go" onClick={p.onResume}>Back to the running lesson</button>}
        <button onClick={p.onSettings}>Settings</button>
      </div>
      {p.lessonRunning && <p className="dim">A lesson is running. Teaching another one ends it without a quiz.</p>}
      {notice && <p className="ok" role="status">{notice}</p>}

      {groups.map(g => {
        const total = courseScore(scores, g.lessons.map(l => l.id));
        return (
          <div className="panel" style={{ marginTop: 12 }} key={`${g.own ? 'own' : 'built-in'}-${g.name}`}>
            <div className="row">
              <h2 className="grow" style={{ margin: 0 }}>{g.name}</h2>
              <span className="pill">{total.average === null ? 'Not taught yet' : `Course score ${total.average}% · ${total.taught} of ${total.lessons} taught`}</span>
              {g.own && <button onClick={() => download(g.name, g.lessons)}>Export course</button>}
              {g.own && <button onClick={() => keep(levels.filter(l => l.course !== g.name))}>Delete course</button>}
            </div>
            {g.lessons.map(c => {
              const s = scores[c.id];
              return (
                <div className="row" key={c.id} style={{ marginTop: 8 }}>
                  <span className="grow">
                    <b>{c.part ? `${c.part}. ` : ''}{c.title}</b>{' '}
                    <span className="dim">{s ? `Best ${s.best}% · last ${s.last}% · taught ${s.plays}×` : 'Not taught yet'}</span>
                  </span>
                  {!builtInIds.has(c.id) && <button onClick={() => { chapterText.current = ''; setProblems([]); setError(''); setDraft(c); }}>Edit</button>}
                  {!builtInIds.has(c.id) && <button onClick={() => download(c.title, [c])}>Export</button>}
                  {!builtInIds.has(c.id) && <button onClick={() => keep(levels.filter(x => x.id !== c.id))}>Delete</button>}
                  <button className="go" onClick={() => p.onPlay(c)}>Teach</button>
                </div>
              );
            })}
          </div>
        );
      })}

      <div className="panel" style={{ marginTop: 12 }}>
        <h2>Make lessons from PDFs</h2>
        <p className="dim">Pick one PDF or several. The game cuts them into as many lessons as you ask for and writes a quiz for each. The PDFs stay on your computer; their text is sent to your AI provider.</p>
        <label htmlFor="pdf-file">PDF files</label>
        <input id="pdf-file" type="file" multiple accept="application/pdf,.pdf" onChange={e => void choosePdfs(e.target.files)} />
        {source && (
          <>
            <p className="dim">{source.names.join(', ')}: {source.pages.length} pages, {source.pages.join('').length.toLocaleString()} characters.</p>
            <div className="row">
              <label htmlFor="pdf-from" style={{ flex: 1 }}>From page
                <input id="pdf-from" type="number" min={1} max={source.pages.length} value={source.from}
                  onChange={e => setSource({ ...source, from: clamp(e.target.value, 1, source.pages.length) })} />
              </label>
              <label htmlFor="pdf-to" style={{ flex: 1 }}>To page (of {source.pages.length})
                <input id="pdf-to" type="number" min={1} max={source.pages.length} value={source.to}
                  onChange={e => setSource({ ...source, to: clamp(e.target.value, 1, source.pages.length) })} />
              </label>
              <label htmlFor="pdf-count" style={{ flex: 1 }}>Number of lessons
                <input id="pdf-count" type="number" min={1} max={Math.max(1, selectedPages)} value={source.count}
                  onChange={e => setSource({ ...source, count: clamp(e.target.value, 1, Math.max(1, selectedPages)) })} />
              </label>
            </div>
            <p className="dim">Suggested number of lessons for these pages: {suggestedLessonCount(source.pages.slice(source.from - 1, source.to))}. One lesson is about 15 minutes of teaching.</p>
            {source.count > 1 && (
              <>
                <label htmlFor="pdf-title">Course name</label>
                <input id="pdf-title" value={source.title} onChange={e => setSource({ ...source, title: e.target.value })} />
              </>
            )}
            <div className="row" style={{ marginTop: 10 }}>
              <button className="go" onClick={() => void create()} disabled={!!busy || source.from > source.to}>
                {source.count > 1 ? `Create course with ${Math.min(source.count, selectedPages)} lessons` : 'Create lesson'}
              </button>
            </div>
          </>
        )}
        {busy && <p className="dim" role="status">{busy}</p>}
        {error && <p className="error" role="alert">{error}</p>}
      </div>

      <div className="panel" style={{ marginTop: 12 }}>
        <h2>Share lessons</h2>
        <label htmlFor="level-file">Add a lesson or course file someone shared with you (.json)</label>
        <input id="level-file" type="file" accept="application/json,.json" onChange={e => void importLevel(e.target.files?.[0])} />
        <div className="row" style={{ marginTop: 10 }}>
          <button onClick={() => download('All my lessons', levels)} disabled={levels.length === 0}>Export all my lessons as one file</button>
        </div>
        <p className="dim">Each lesson and each course also has its own Export button. Exported files hold the lessons and quizzes, not your scores.</p>
      </div>
    </div>
  );
}
