import { useRef, useState } from 'react';
import { generateChapter } from '../ai/calls';
import { builtInChapter } from '../content';
import type { Chapter, QuizQuestion } from '../game/types';
import { normalizeChapter, validateChapter } from '../game/validate';
import { addLog, loadLevels, saveLevels } from '../storage';
import type { Settings } from '../storage';

const MAX_CHARS = 30000;

interface Props { settings: Settings; onRequest(): void; onPlay(c: Chapter): void; onSettings(): void }
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
    const level = await generateChapter({
      provider: p.settings,
      studentModel: p.settings.studentModel,
      graderModel: p.settings.graderModel || p.settings.studentModel,
      onRequest: p.onRequest,
      log: p.settings.debugLog ? addLog : undefined,
    }, chapterText.current);
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
    keep([...levels, draft]);
    setDraft(null);
    setPdf(null);
  }

  const editQuestion = (i: number, patch: Partial<QuizQuestion>) =>
    draft && setDraft({ ...draft, quiz: draft.quiz.map((q, k) => (k === i ? { ...q, ...patch } : q)) });

  if (draft) {
    return (
      <div className="page narrow">
        <h1>Review the new level</h1>
        <p className="dim">The AI wrote this from your PDF. Check it, fix what is wrong, then save. Students never see the answers.</p>
        <div className="panel">
          <label htmlFor="d-title">Title</label>
          <input id="d-title" value={draft.title} onChange={e => setDraft({ ...draft, title: e.target.value })} />

          <h2 style={{ marginTop: 14 }}>Lesson goals</h2>
          {draft.objectives.map((o, i) => (
            <input key={o.id} aria-label={`Goal ${i + 1}`} style={{ marginBottom: 6 }} value={o.text}
              onChange={e => setDraft({ ...draft, objectives: draft.objectives.map((x, k) => (k === i ? { ...x, text: e.target.value } : x)) })} />
          ))}

          <h2 style={{ marginTop: 14 }}>Quiz</h2>
          {draft.quiz.map((q, i) => (
            <div key={q.id} className="panel" style={{ marginBottom: 8 }}>
              <label htmlFor={`q-${q.id}`}>Question {i + 1} ({q.type === 'mcq' ? 'multiple choice' : 'written'})</label>
              <input id={`q-${q.id}`} value={q.prompt} onChange={e => editQuestion(i, { prompt: e.target.value })} />
              <label htmlFor={`a-${q.id}`}>Right answer</label>
              {q.type === 'mcq' && q.choices ? (
                <select id={`a-${q.id}`} value={q.answer_key} onChange={e => editQuestion(i, { answer_key: e.target.value })}>
                  {q.choices.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              ) : (
                <input id={`a-${q.id}`} value={q.answer_key} onChange={e => editQuestion(i, { answer_key: e.target.value })} />
              )}
              <div className="row" style={{ marginTop: 8 }}>
                <button onClick={() => setDraft({ ...draft, quiz: draft.quiz.filter((_, k) => k !== i) })} disabled={draft.quiz.length <= 1}>Remove this question</button>
              </div>
            </div>
          ))}

          <h2 style={{ marginTop: 14 }}>Wrong beliefs some students will start with</h2>
          <ul>{draft.common_misconceptions.map(m => <li key={m}>{m}</li>)}</ul>

          {problems.map(x => <p key={x} className="error" role="alert">{x}</p>)}
          {error && <p className="error" role="alert">{error}</p>}
          {busy && <p className="dim" role="status">{busy}</p>}
          <div className="row">
            <button onClick={() => void createLevel(false)} disabled={!!busy}>Regenerate</button>
            <button onClick={() => { setDraft(null); setProblems([]); }} disabled={!!busy}>Discard</button>
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
        <button onClick={p.onSettings}>Settings</button>
      </div>

      <div className="panel" style={{ marginTop: 12 }}>
        <h2>Levels</h2>
        {[builtInChapter, ...levels].map((c, i) => (
          <div className="row" key={c.id} style={{ marginBottom: 8 }}>
            <span className="grow"><b>{c.title}</b> <span className="dim">{i === 0 ? 'built-in · Intro to Python' : `${c.objectives.length} goals · ${c.quiz.length} questions`}</span></span>
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
