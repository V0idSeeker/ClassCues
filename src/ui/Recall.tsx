import { useEffect, useState } from 'react';
import type { ReviewItem } from '../game/spaced';
import type { Chapter, QuizQuestion } from '../game/types';
import { t } from '../i18n';

interface Props {
  /** The goals due now, oldest first. */
  due: ReviewItem[];
  findChapter(id: string): Chapter | undefined;
  /** One goal reviewed: right or not. */
  onAnswer(item: ReviewItem, right: boolean): void;
  /** A goal whose lesson or question no longer exists. */
  onDrop(item: ReviewItem): void;
  onBack(): void;
}

/** A question for this goal: multiple choice when there is one (checked at once, no AI), otherwise written. */
function questionFor(chapter: Chapter, objectiveId: string): QuizQuestion | undefined {
  const qs = chapter.quiz.filter(q => q.objective === objectiveId);
  return qs.find(q => q.type === 'mcq' && q.choices) ?? qs[0];
}

/** Spaced review: one question per goal due, answered from memory. */
export default function Recall({ due, findChapter, onAnswer, onDrop, onBack }: Props) {
  // Goals whose lesson or question no longer exists are dropped once, not shown.
  const [queue] = useState(() => due.filter(i => { const c = findChapter(i.lessonId); return c && c.objectives.some(o => o.id === i.objectiveId) && questionFor(c, i.objectiveId); }));
  useEffect(() => { for (const i of due) if (!queue.includes(i)) onDrop(i); }, []);
  const [at, setAt] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [shown, setShown] = useState(false);
  const item = queue[at];
  const chapter = item && findChapter(item.lessonId);
  const goal = chapter?.objectives.find(o => o.id === item.objectiveId);
  const q = chapter && goal ? questionFor(chapter, goal.id) : undefined;
  const next = () => { setAt(a => a + 1); setPicked(null); setShown(false); };

  return (
    <div className="page narrow">
      <div className="row">
        <h1 className="grow">{t('recall.title')}</h1>
        <button onClick={onBack}>{t('recall.back')}</button>
      </div>
      <div className="panel" style={{ marginTop: 12 }}>
        {!item || !chapter || !goal || !q ? <p>{t('recall.done')}</p> : (
          <>
            <p className="dim">{t('recall.progress', { done: at + 1, total: queue.length })} · {chapter.title}</p>
            <p><b>{q.prompt}</b></p>
            {q.type === 'mcq' && q.choices ? (
              <div className="recall-choices">
                {q.choices.map(c => (
                  <button key={c} disabled={picked !== null} className={picked !== null && c === q.answer_key ? 'go' : undefined}
                    onClick={() => { setPicked(c); onAnswer(item, c === q.answer_key); }}>{c}</button>
                ))}
              </div>
            ) : !shown ? (
              <>
                <textarea rows={3} dir="auto" aria-label={q.prompt} placeholder={t('ticket.placeholder')} />
                <button onClick={() => setShown(true)}>{t('recall.show')}</button>
              </>
            ) : (
              <>
                <p>{t('recall.key', { key: q.answer_key })}</p>
                {picked === null && (
                  <div className="row">
                    <button className="go" onClick={() => { setPicked('had'); onAnswer(item, true); }}>{t('recall.had')}</button>
                    <button onClick={() => { setPicked('not'); onAnswer(item, false); }}>{t('recall.notYet')}</button>
                  </div>
                )}
              </>
            )}
            {picked !== null && (
              <>
                {q.type === 'mcq' && <p className={picked === q.answer_key ? 'ok' : 'error'} role="status">
                  {picked === q.answer_key ? t('recall.right') : t('recall.key', { key: q.answer_key })}</p>}
                {/* The goal often states the answer, so it shows only after answering. */}
                <p className="dim">{t('recall.goal', { goal: goal.text })}</p>
                <button className="go" onClick={next}>{t('recall.next')}</button>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
