import type { Chapter } from '../game/types';
import { t } from '../i18n';

/**
 * Splits the reference text into readable paragraphs: at blank lines (or line breaks if there are none),
 * and long paragraphs into groups of sentences of about `size` characters.
 */
export function paragraphs(text: string, size = 320): string[] {
  const blocks = text.split(/\n\s*\n/).length > 1 ? text.split(/\n\s*\n/) : text.split('\n');
  const out: string[] = [];
  for (const block of blocks) {
    const clean = block.replace(/\s+/g, ' ').trim();
    if (!clean) continue;
    let current = '';
    for (const sentence of clean.split(/(?<=[.!?])\s+(?=[A-Z0-9"'(])/)) {
      if (current && current.length + 1 + sentence.length > size) { out.push(current); current = sentence; }
      else current = current ? `${current} ${sentence}` : sentence;
    }
    out.push(current);
  }
  return out;
}

/** Goals, reference text and wrong beliefs of a lesson: the same on the study screen and in the classroom's notes panel. */
export default function StudyNotes({ chapter }: { chapter: Chapter }) {
  return (
    <>
      <h2>{t('notes.goals')}</h2>
      <ul>{chapter.objectives.map(o => <li key={o.id}>{o.text}</li>)}</ul>
      <h2>{t('notes.study')}</h2>
      <div style={{ maxWidth: '65ch', lineHeight: 1.6 }}>
        {paragraphs(chapter.reference).map((t, i) => <p key={i}>{t}</p>)}
      </div>
      {chapter.common_misconceptions.length > 0 && (
        <>
          <h2>{t('notes.watch')}</h2>
          <p>{t('notes.believe')}</p>
          <ul>{chapter.common_misconceptions.map((m, i) => <li key={i}>{m}</li>)}</ul>
        </>
      )}
    </>
  );
}
