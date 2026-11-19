// The demo lesson: three turns with ready-made students, so a new player can try the game before setting up an AI.
// These students follow simple rules instead of an AI: they copy what was said, ask a stock question, and are graded
// by shared words. Nothing from a demo is saved to scores, rank, memory or review.
import { t } from '../i18n';
import { meaningfulWords } from './review';
import type { Ai, Emotion, LessonState, Objective } from './types';

export const DEMO_TURNS = 3;

const shared = (a: string, b: string) => {
  const wa = meaningfulWords(a);
  let n = 0;
  for (const w of meaningfulWords(b)) if (wa.has(w)) n++;
  return n;
};

/** The goal a sentence is most about (sharing at least one meaningful word), or null. */
function goalOf(text: string, objectives: Objective[]): string | null {
  let best: string | null = null, most = 0;
  for (const o of objectives) {
    const n = shared(text, o.text);
    if (n > most) { most = n; best = o.id; }
  }
  return best;
}

const short = (s: string) => (s.length > 90 ? `${s.slice(0, 87)}…` : s);

export function demoAi(): Ai {
  let reactions = 0;
  return {
    async noteTaker(state, boardAdded, say) {
      const text = [say, boardAdded].map(x => x.trim()).filter(Boolean).join(' / ');
      const asks = say.includes('?');
      return {
        students: state.students.map(s => {
          const a = s.persona.traits.attention;
          const writes = text.length > 0 && a >= 0.45;
          const emotion: Emotion = asks ? 'CURIOUS' : a >= 0.6 ? 'HAPPY' : text.length > 160 ? 'BORED' : 'NEUTRAL';
          return {
            id: s.persona.id,
            new_notes: writes ? [{ text: short(text), objective: goalOf(text, state.chapter.objectives), distorted: false }] : [],
            beliefs_dropped: [],
            emotion,
          };
        }),
      };
    },
    async reaction(_state, student) {
      const lines = [t('demo.why'), t('demo.whatIf'), t('demo.lost')];
      const message = student.persona.archetype === 'struggling' ? t('demo.lost') : lines[reactions++ % 2];
      return { wants_to_speak: true, message, emotion: student.persona.archetype === 'struggling' ? 'CONFUSED' : 'CURIOUS' };
    },
    async answer(_state, student) {
      const note = student.notes[student.notes.length - 1];
      return note
        ? { answer: t('demo.answerNote', { note: note.text }), emotion: 'HAPPY' }
        : { answer: t('demo.answerUnsure'), emotion: 'CONFUSED' };
    },
    async quizTaker(student, questions) {
      return {
        answers: questions.map(q => {
          const notes = student.notes.filter(n => n.objective === q.objective && !n.distorted).map(n => n.text);
          return { question_id: q.id, answer: notes.length ? notes.join(' ') : t('demo.dontRemember') };
        }),
      };
    },
    async grader(q, rows) {
      return {
        results: rows.map(r => {
          const n = shared(r.answer, q.answer_key);
          const score = n >= 2 ? 2 : n === 1 ? 1 : 0;
          return {
            student_id: r.student_id, score, max: 2,
            supported_by_notes: r.notes.some(note => shared(note, r.answer) > 0),
            feedback: score === 2 ? t('demo.gradeRight') : score === 1 ? t('demo.gradeHalf') : t('demo.gradeWrong'),
          };
        }),
      };
    },
  };
}

/** A demo lesson ends after DEMO_TURNS teacher turns. */
export const demoOver = (state: LessonState) => !!state.demo && state.turns >= DEMO_TURNS;

