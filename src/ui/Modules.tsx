import { useRef, useState } from 'react';
import { generateChapter } from '../ai/calls';
import type { AiDeps } from '../ai/calls';
import { builtInChapter } from '../content';
import type { Chapter, QuizQuestion } from '../game/types';
import { normalizeChapter, validateChapter } from '../game/validate';
import { loadLevels, saveLevels } from '../storage';

const MAX_CHARS = 30000;

interface Props { deps: AiDeps; lessonRunning: boolean; onPlay(c: Chapter): void; onResume(): void; onSettings(): void }
interface Pdf { file: File; pages: number; from: number; to: number }

const message = (e: unknown) => (e instanceof Error ? e.message : String(e));

function download(c: Chapter) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([JSON.stringify(c, null, 2)], { type: 'application/json' }));
  a.download = `${c.title.replace(/[\\/:*?"<>|]+/g, '_').trim() || 'level'}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
}

export default function Modules(p: Props) {
  const [levels, setLevels] = useState<Chapter[]>(loadLevels);
  const [pdf, setPdf] = useState<Pdf | null>(null);
  const [draft, setDraft] = useState<Chapter | null>(null);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [problems, setProblems] = useState<string[]>([]);
  const chapterText = useRef('');

  const keep = (next: Chapter[]) => { setLevels(next); saveLevels(next); };

  async function choosePdf(file: File | undefined) {
    if (!file) return;
    setError('');
    setBusy('Opening the PDF…');
    try {
      const { pdfPages } = await import('../pdf');
      const pages = await pdfPages(file);
      setPdf({ file, pages, from: 1, to: pages });
    } catch {
      setError('Could not open this file as a PDF.');
    } finally {
      setBusy('');
    }
  }

  async function generate() {
    setBusy('The AI is writing the level… this can take a minute.');
    const level = await generateChapter(p.deps, chapterText.current);
    setDraft(level);
    setProblems([]);
  }

  async function createLevel(readPdf: boolean) {
    setError('');
    try {
      if (readPdf && pdf) {
        setBusy('Reading the pages…');
        const { pdfText } = await import('../pdf');
        const text = await pdfText(pdf.file, pdf.from, pdf.to);
        if (text.replace(/\s/g, '').length < 200) throw new Error('These pages have no readable text. The PDF may be scanned images, which are not supported.');
        if (text.length > MAX_CHARS) throw new Error(`These pages hold ${text.length.toLocaleString()} characters; the limit is ${MAX_CHARS.toLocaleString()}. Choose fewer pages.`);
        chapterText.current = text;
      }
      await generate();
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
      const parsed: unknown = JSON.parse(await file.text());
      const found = validateChapter(parsed);
      if (found.length) throw new Error(`This level file cannot be used: ${found[0]}`);
      keep([...levels, normalizeChapter(parsed as Chapter, `level-${Date.now()}`)]);
    } catch (e) {
      setError(e instanceof SyntaxError ? 'This file is not a level file.' : message(e));
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
    setPdf(null);
  }

  const editQuestion = (i: number, patch: Partial<QuizQuestion>) =>
    draft && setDraft({ ...draft, quiz: draft.quiz.map((q, k) => (k === i ? { ...q, ...patch } : q)) });

  if (draft) {
    const setQuiz = (quiz: QuizQuestion[]) => setDraft({ ...draft, quiz });
    const isSaved = levels.some(l => l.id === draft.id);
    return (
      <div className="page narrow">
        <h1>{isSaved ? 'Edit the level' : 'Review the new level'}</h1>
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
            {chapterText.current && <button onClick={() => void createLevel(false)} disabled={!!busy}>Regenerate from the PDF</button>}
            <button onClick={() => { setDraft(null); setProblems([]); }} disabled={!!busy}>{isSaved ? 'Cancel' : 'Discard'}</button>
            <span className="grow" />
            <button className="go" onClick={saveDraft} disabled={!!busy}>Save level</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page narrow">
      <div className="row">
        <h1 className="grow">Choose a level</h1>
        {p.lessonRunning && <button className="go" onClick={p.onResume}>Back to the running lesson</button>}
        <button onClick={p.onSettings}>Settings</button>
      </div>

      <div className="panel" style={{ marginTop: 12 }}>
        <h2>Levels</h2>
        {p.lessonRunning && <p className="dim">A lesson is running. Teaching another level ends it without a quiz.</p>}
        {[builtInChapter, ...levels].map((c, i) => (
          <div className="row" key={c.id} style={{ marginBottom: 8 }}>
            <span className="grow"><b>{c.title}</b> <span className="dim">{i === 0 ? 'built-in · Intro to Python' : `${c.objectives.length} goals · ${c.quiz.length} questions`}</span></span>
            {i > 0 && <button onClick={() => { chapterText.current = ''; setProblems([]); setError(''); setDraft(c); }}>Edit</button>}
            {i > 0 && <button onClick={() => download(c)}>Export</button>}
            {i > 0 && <button onClick={() => keep(levels.filter(x => x.id !== c.id))}>Delete</button>}
            <button className="go" onClick={() => p.onPlay(c)}>Teach</button>
          </div>
        ))}
      </div>

      <div className="panel" style={{ marginTop: 12 }}>
        <h2>Make a level from a PDF chapter</h2>
        <p className="dim">The PDF stays on your computer. Its text is sent to your AI provider to write the level. One PDF (or page range) makes one level.</p>
        <label htmlFor="pdf-file">PDF file</label>
        <input id="pdf-file" type="file" accept="application/pdf,.pdf" onChange={e => void choosePdf(e.target.files?.[0])} />
        {pdf && (
          <>
            <div className="row">
              <label htmlFor="pdf-from" style={{ flex: 1 }}>From page
                <input id="pdf-from" type="number" min={1} max={pdf.pages} value={pdf.from}
                  onChange={e => setPdf({ ...pdf, from: Math.min(pdf.pages, Math.max(1, Number(e.target.value) || 1)) })} />
              </label>
              <label htmlFor="pdf-to" style={{ flex: 1 }}>To page (of {pdf.pages})
                <input id="pdf-to" type="number" min={1} max={pdf.pages} value={pdf.to}
                  onChange={e => setPdf({ ...pdf, to: Math.min(pdf.pages, Math.max(1, Number(e.target.value) || 1)) })} />
              </label>
            </div>
            <div className="row" style={{ marginTop: 10 }}>
              <button className="go" onClick={() => void createLevel(true)} disabled={!!busy || pdf.from > pdf.to}>Create level</button>
            </div>
          </>
        )}
        {busy && <p className="dim" role="status">{busy}</p>}
        {error && <p className="error" role="alert">{error}</p>}
      </div>

      <div className="panel" style={{ marginTop: 12 }}>
        <h2>Add a level someone shared with you</h2>
        <label htmlFor="level-file">Level file (.json)</label>
        <input id="level-file" type="file" accept="application/json,.json" onChange={e => void importLevel(e.target.files?.[0])} />
      </div>
    </div>
  );
}
