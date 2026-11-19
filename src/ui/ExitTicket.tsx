import { useState } from 'react';
import type { QuizQuestion } from '../game/types';
import { t } from '../i18n';

interface Props {
  questions: QuizQuestion[];
  /** Answers handed in, or null when skipped. Once set, the form shows that it is done. */
  handedIn: Record<string, string> | null | undefined;
  onHandIn(answers: Record<string, string> | null): void;
}

/** While the class takes the quiz, the teacher answers a few of its questions from memory. */
export default function ExitTicket({ questions, handedIn, onHandIn }: Props) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  if (handedIn !== undefined) return <p className="dim" role="status">{handedIn === null ? t('ticket.skipped') : t('ticket.waiting')}</p>;
  const set = (id: string, v: string) => setAnswers(a => ({ ...a, [id]: v }));
  return (
    <form className="ticket" onSubmit={e => { e.preventDefault(); onHandIn(answers); }}>
      <h2>{t('ticket.title')}</h2>
      <p>{t('ticket.intro')}</p>
      <ol>
        {questions.map(q => (
          <li key={q.id}>
            <p><b>{q.prompt}</b></p>
            {q.type === 'mcq' && q.choices ? (
              <fieldset>
                <legend className="sr-only">{q.prompt}</legend>
                {q.choices.map(c => (
                  <label key={c} className="check">
                    <input type="radio" name={q.id} value={c} checked={answers[q.id] === c} onChange={() => set(q.id, c)} />{c}
                  </label>
                ))}
              </fieldset>
            ) : (
              <textarea rows={3} dir="auto" aria-label={q.prompt} placeholder={t('ticket.placeholder')}
                value={answers[q.id] ?? ''} onChange={e => set(q.id, e.target.value)} />
            )}
          </li>
        ))}
      </ol>
      <div className="row">
        <button type="submit" className="go">{t('ticket.handIn')}</button>
        <button type="button" onClick={() => onHandIn(null)}>{t('ticket.skip')}</button>
      </div>
    </form>
  );
}
