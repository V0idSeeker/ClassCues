import { useRef, useState } from 'react';
import { generateChapter, outlineCourse } from '../ai/calls';
import type { AiDeps } from '../ai/calls';
import { builtInCourses, builtInIds } from '../content';
import { getLang, t } from '../i18n';
import { MAX_LESSON_CHARS, courseScore, cutAtPages, splitIntoLessons, suggestedLessonCount } from '../game/course';
import type { Chapter, QuizQuestion } from '../game/types';
import { normalizeChapter, packLessons, unpackLessons, validateChapter } from '../game/validate';
import { loadRuns, oftenMissed } from '../progress';
import { loadLevels, loadScores, saveLevels } from '../storage';

interface Props { deps: AiDeps; lessonRunning: boolean; onPlay(c: Chapter): void; onResume(): void; onSettings(): void; onMenu(): void; onHelp(): void }
/** The PDFs the player picked: every page's text in order, and which pages to use. */
interface Source { names: string[]; pages: string[]; from: number; to: number; title: string; count: number; how: 'chapters' | 'equal' }

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
  const [runs] = useState(loadRuns);
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
        setBusy(t('lessons.reading', { n: i + 1, total: files.length, name: file.name }));
        pages.push(...await pdfPageTexts(file));
        names.push(file.name);
      }
      setSource({ names, pages, from: 1, to: pages.length, title: names[0].replace(/\.pdf$/i, ''), count: suggestedLessonCount(pages), how: pages.length > 1 ? 'chapters' : 'equal' });
    } catch {
      setError(t('lessons.notPdf'));
    } finally {
      setBusy('');
    }
  }

  /** One lesson: the AI writes it and the player reviews it before saving. */
  async function writeOne() {
    setBusy(t('lessons.writing'));
    setDraft(await generateChapter(p.deps, chapterText.current));
    setProblems([]);
  }

  async function create() {
    if (!source) return;
    setError('');
    setNotice('');
    const made: Chapter[] = [];
    let parts: string[] = [];
    let cutByLength = false;
    try {
      const pages = source.pages.slice(source.from - 1, source.to);
      if (pages.join('').replace(/\s/g, '').length < 200) throw new Error(t('lessons.noText'));
      if (source.how === 'chapters' && pages.length > 1) {
        setBusy(t('lessons.findingChapters'));
        try {
          parts = cutAtPages(pages, await outlineCourse(p.deps, pages));
        } catch {
          // Without an outline the material is still usable: cut it by length instead.
          parts = splitIntoLessons(pages, suggestedLessonCount(pages));
          cutByLength = true;
        }
      } else {
        parts = splitIntoLessons(pages, source.count);
      }
      const tooLong = parts.findIndex(part => part.length > MAX_LESSON_CHARS);
      if (tooLong >= 0) throw new Error(t('lessons.tooLong', { n: tooLong + 1, chars: parts[tooLong].length.toLocaleString(), limit: MAX_LESSON_CHARS.toLocaleString() }));

      if (parts.length === 1) {
        chapterText.current = parts[0];
        await writeOne();
        return;
      }
      const course = source.title.trim() || t('lessons.myCourse');
      for (const [i, text] of parts.entries()) {
        setBusy(t('lessons.writingN', { n: i + 1, total: parts.length }));
        const lesson = await generateChapter(p.deps, text, {
          course, part: i + 1, of: parts.length,
          earlier: made.map(m => ({ title: m.title, objectives: m.objectives.map(o => o.text) })),
        });
        made.push({ ...lesson, course, part: i + 1 });
        keep([...levels, ...made]);
      }
      setSource(null);
      setNotice(`${t('lessons.created', { course, count: made.length })}${cutByLength ? ` ${t('lessons.cutByLength')}` : ''}`);
    } catch (e) {
      setError(made.length > 0 ? t('lessons.failed', { n: made.length + 1, total: parts.length, error: message(e), count: made.length }) : message(e));
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
      if (problem) throw new Error(t('lessons.badFile', { problem }));
      keep([...levels, ...lessons]);
      setNotice(lessons.length === 1 ? t('lessons.added', { title: lessons[0].title }) : t('lessons.addedN', { count: lessons.length }));
    } catch (e) {
      setError(e instanceof SyntaxError ? t('lessons.notLessonFile') : message(e));
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
        <h1>{isSaved ? t('edit.titleEdit') : t('edit.titleNew')}</h1>
        <p className="dim">{t('edit.intro')}</p>
        <div className="panel">
          <label htmlFor="d-title">{t('edit.title')}</label>
          <input id="d-title" value={draft.title} onChange={e => setDraft({ ...draft, title: e.target.value })} />

          <h2 style={{ marginTop: 14 }}>{t('edit.goals')}</h2>
          {draft.objectives.map((o, i) => (
            <input key={o.id} aria-label={t('edit.goal', { n: i + 1 })} style={{ marginBottom: 6 }} value={o.text}
              onChange={e => setDraft({ ...draft, objectives: draft.objectives.map((x, k) => (k === i ? { ...x, text: e.target.value } : x)) })} />
          ))}

          <label htmlFor="d-beliefs">{t('edit.beliefs')}</label>
          <textarea id="d-beliefs" rows={Math.max(3, draft.common_misconceptions.length)} value={draft.common_misconceptions.join('\n')}
            onChange={e => setDraft({ ...draft, common_misconceptions: e.target.value.split('\n') })}
            onBlur={() => setDraft({ ...draft, common_misconceptions: draft.common_misconceptions.map(m => m.trim()).filter(Boolean) })} />

          <h2 style={{ marginTop: 14 }}>{t('edit.quiz')}</h2>
          {draft.quiz.map((q, i) => (
            <div key={q.id} className="panel" style={{ marginBottom: 8 }}>
              <div className="row">
                <label htmlFor={`t-${q.id}`} style={{ flex: 1, marginTop: 0 }}>{t('edit.kind', { n: i + 1 })}
                  <select id={`t-${q.id}`} value={q.type}
                    onChange={e => editQuestion(i, e.target.value === 'mcq'
                      ? { type: 'mcq', choices: [q.answer_key || t('edit.right'), ...[1, 2, 3].map(n => t('edit.wrongN', { n }))], answer_key: q.answer_key || t('edit.right'), rubric: undefined }
                      : { type: 'short', choices: undefined, rubric: q.rubric ?? t('edit.defaultRubric') })}>
                    <option value="mcq">{t('edit.mcq')}</option>
                    <option value="short">{t('edit.short')}</option>
                  </select>
                </label>
                <label htmlFor={`o-${q.id}`} style={{ flex: 2, marginTop: 0 }}>{t('edit.testsGoal')}
                  <select id={`o-${q.id}`} value={q.objective} onChange={e => editQuestion(i, { objective: e.target.value })}>
                    {draft.objectives.map(o => <option key={o.id} value={o.id}>{o.text}</option>)}
                  </select>
                </label>
              </div>
              <label htmlFor={`q-${q.id}`}>{t('edit.question')}</label>
              <textarea id={`q-${q.id}`} rows={2} value={q.prompt} onChange={e => editQuestion(i, { prompt: e.target.value })} />
              {q.type === 'mcq' && q.choices ? (
                <>
                  {q.choices.map((c, k) => (
                    <label key={k} htmlFor={`c-${q.id}-${k}`}>{t('edit.choice', { n: k + 1 })}{c === q.answer_key ? t('edit.theRight') : ''}
                      <input id={`c-${q.id}-${k}`} value={c}
                        onChange={e => editQuestion(i, {
                          choices: q.choices!.map((x, j) => (j === k ? e.target.value : x)),
                          ...(c === q.answer_key ? { answer_key: e.target.value } : {}),
                        })} />
                    </label>
                  ))}
                  <label htmlFor={`a-${q.id}`}>{t('edit.right')}</label>
                  <select id={`a-${q.id}`} value={q.answer_key} onChange={e => editQuestion(i, { answer_key: e.target.value })}>
                    {q.choices.map((c, k) => <option key={k} value={c}>{c}</option>)}
                  </select>
                </>
              ) : (
                <>
                  <label htmlFor={`a-${q.id}`}>{t('edit.model')}</label>
                  <textarea id={`a-${q.id}`} rows={2} value={q.answer_key} onChange={e => editQuestion(i, { answer_key: e.target.value })} />
                  <label htmlFor={`r-${q.id}`}>{t('edit.rubric')}</label>
                  <input id={`r-${q.id}`} value={q.rubric ?? ''} onChange={e => editQuestion(i, { rubric: e.target.value })} />
                </>
              )}
              <div className="row" style={{ marginTop: 8 }}>
                <button onClick={() => setQuiz(draft.quiz.filter((_, k) => k !== i))} disabled={draft.quiz.length <= 1}>{t('edit.remove')}</button>
              </div>
            </div>
          ))}
          <div className="row">
            <button disabled={draft.quiz.length >= 10} onClick={() => setQuiz([...draft.quiz, {
              id: `q${Date.now()}`, type: 'short', objective: draft.objectives[0]?.id ?? '', prompt: '', answer_key: '', rubric: t('edit.defaultRubric'),
            }])}>{t('edit.add')}</button>
          </div>

          {problems.map(x => <p key={x} className="error" role="alert">{x}</p>)}
          {error && <p className="error" role="alert">{error}</p>}
          {busy && <p className="dim" role="status">{busy}</p>}
          <div className="row" style={{ marginTop: 10 }}>
            {!isSaved && chapterText.current && <button onClick={() => void regenerate()} disabled={!!busy}>{t('edit.regenerate')}</button>}
            <button onClick={() => { setDraft(null); setProblems([]); }} disabled={!!busy}>{isSaved ? t('common.cancel') : t('edit.discard')}</button>
            <span className="grow" />
            <button className="go" onClick={saveDraft} disabled={!!busy}>{t('edit.save')}</button>
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
  if (singles.length > 0) groups.push({ name: t('lessons.single'), lessons: singles, own: false });
  const selectedPages = source ? source.to - source.from + 1 : 0;

  return (
    <div className="page narrow">
      <div className="row">
        <h1 className="grow">{t('lessons.title')}</h1>
        {p.lessonRunning && <button className="go" onClick={p.onResume}>{t('lessons.back')}</button>}
        <button onClick={p.onHelp}>{t('common.help')}</button>
        <button onClick={p.onSettings}>{t('common.settings')}</button>
        <button onClick={p.onMenu}>{t('common.mainMenu')}</button>
      </div>
      {p.lessonRunning && <p className="dim">{t('lessons.running')}</p>}
      {getLang() !== 'en' && <p className="dim">{t('common.builtInEnglish')}</p>}
      {notice && <p className="ok" role="status">{notice}</p>}

      {groups.map(g => {
        const total = courseScore(scores, g.lessons.map(l => l.id));
        return (
          <div className="panel" style={{ marginTop: 12 }} key={`${g.own ? 'own' : 'built-in'}-${g.name}`}>
            <div className="row">
              <h2 className="grow" style={{ margin: 0 }}>{g.name}</h2>
              <span className="pill">{total.average === null ? t('common.notTaught') : t('lessons.courseScore', { average: total.average, taught: total.taught, lessons: total.lessons })}</span>
              {g.own && <button onClick={() => download(g.name, g.lessons)}>{t('lessons.exportCourse')}</button>}
              {g.own && <button onClick={() => keep(levels.filter(l => l.course !== g.name))}>{t('lessons.deleteCourse')}</button>}
            </div>
            {g.lessons.map(c => {
              const s = scores[c.id];
              const missed = oftenMissed(runs, c.id, c.objectives);
              return (
                <div className="row" key={c.id} style={{ marginTop: 8 }}>
                  <span className="grow">
                    <b>{c.part ? `${c.part}. ` : ''}{c.title}</b>{' '}
                    <span className="dim">{s ? t('lessons.scoreLine', { best: s.best, last: s.last, plays: s.plays }) : t('common.notTaught')}</span>
                    {missed.length > 0 && <><br /><span className="dim">{t('lessons.oftenMissed', { goals: missed.map(o => o.text).join(', ') })}</span></>}
                  </span>
                  {!builtInIds.has(c.id) && <button onClick={() => { chapterText.current = ''; setProblems([]); setError(''); setDraft(c); }}>{t('lessons.edit')}</button>}
                  {!builtInIds.has(c.id) && <button onClick={() => download(c.title, [c])}>{t('lessons.export')}</button>}
                  {!builtInIds.has(c.id) && <button onClick={() => keep(levels.filter(x => x.id !== c.id))}>{t('lessons.delete')}</button>}
                  <button className="go" onClick={() => p.onPlay(c)}>{t('lessons.teach')}</button>
                </div>
              );
            })}
          </div>
        );
      })}

      <div className="panel" style={{ marginTop: 12 }}>
        <h2>{t('lessons.pdfTitle')}</h2>
        <p className="dim">{t('lessons.pdfIntro')}</p>
        <label htmlFor="pdf-file">{t('lessons.pdfFiles')}</label>
        <input id="pdf-file" type="file" multiple accept="application/pdf,.pdf" onChange={e => void choosePdfs(e.target.files)} />
        {source && (
          <>
            <p className="dim">{t('lessons.pdfSummary', { names: source.names.join(', '), pages: source.pages.length, chars: source.pages.join('').length.toLocaleString() })}</p>
            <label htmlFor="pdf-how">{t('lessons.how')}</label>
            <select id="pdf-how" value={source.how} onChange={e => setSource({ ...source, how: e.target.value === 'equal' ? 'equal' : 'chapters' })}>
              <option value="chapters">{t('lessons.atChapters')}</option>
              <option value="equal">{t('lessons.equal')}</option>
            </select>
            <div className="row">
              <label htmlFor="pdf-from" style={{ flex: 1 }}>{t('lessons.from')}
                <input id="pdf-from" type="number" min={1} max={source.pages.length} value={source.from}
                  onChange={e => setSource({ ...source, from: clamp(e.target.value, 1, source.pages.length) })} />
              </label>
              <label htmlFor="pdf-to" style={{ flex: 1 }}>{t('lessons.to', { pages: source.pages.length })}
                <input id="pdf-to" type="number" min={1} max={source.pages.length} value={source.to}
                  onChange={e => setSource({ ...source, to: clamp(e.target.value, 1, source.pages.length) })} />
              </label>
              {source.how === 'equal' && <label htmlFor="pdf-count" style={{ flex: 1 }}>{t('lessons.count')}
                <input id="pdf-count" type="number" min={1} max={Math.max(1, selectedPages)} value={source.count}
                  onChange={e => setSource({ ...source, count: clamp(e.target.value, 1, Math.max(1, selectedPages)) })} />
              </label>}
            </div>
            <p className="dim">
              {source.how === 'chapters'
                ? t('lessons.chaptersHint')
                : t('lessons.suggested', { count: suggestedLessonCount(source.pages.slice(source.from - 1, source.to)) })}
              {' '}{t('lessons.length')}
            </p>
            {(source.how === 'chapters' ? selectedPages > 1 : source.count > 1) && (
              <>
                <label htmlFor="pdf-title">{t('lessons.courseName')}</label>
                <input id="pdf-title" value={source.title} onChange={e => setSource({ ...source, title: e.target.value })} />
              </>
            )}
            <div className="row" style={{ marginTop: 10 }}>
              <button className="go" onClick={() => void create()} disabled={!!busy || source.from > source.to}>
                {source.how === 'chapters' && selectedPages > 1 ? t('lessons.createCourse')
                  : source.how === 'equal' && source.count > 1 ? t('lessons.createCourseN', { count: Math.min(source.count, selectedPages) }) : t('lessons.createLesson')}
              </button>
            </div>
          </>
        )}
        {busy && <p className="dim" role="status">{busy}</p>}
        {error && <p className="error" role="alert">{error}</p>}
      </div>

      <div className="panel" style={{ marginTop: 12 }}>
        <h2>{t('lessons.share')}</h2>
        <label htmlFor="level-file">{t('lessons.addFile')}</label>
        <input id="level-file" type="file" accept="application/json,.json" onChange={e => void importLevel(e.target.files?.[0])} />
        <div className="row" style={{ marginTop: 10 }}>
          <button onClick={() => download(t('lessons.allFile'), levels)} disabled={levels.length === 0}>{t('lessons.exportAll')}</button>
        </div>
        <p className="dim">{t('lessons.shareHint')}</p>
      </div>
    </div>
  );
}
