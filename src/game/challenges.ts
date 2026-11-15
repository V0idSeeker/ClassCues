// Teaching challenges: one is picked at random when a lesson starts and judged after the quiz.
import { namedStudent } from './runLesson';
import type { Rng } from './rng';
import type { ChallengeResult, LessonState, Student, TranscriptLine } from './types';

export interface Challenge {
  id: string;
  /** What the player sees. "{quiet}" is replaced by the quiet student's name. */
  title: string;
  /** What the AI judges the transcript against. Code-checked challenges keep it as documentation. */
  detection: string;
  /** Present: judged exactly in code from the lesson. Absent: judged by one AI call (grader model). */
  check?: (state: LessonState) => ChallengeResult;
}

const studentNames = (state: LessonState) => new Set(state.students.map(s => s.persona.name));
const teacherSaid = (t: TranscriptLine[]) => t.filter(l => l.who === 'teacher').map(l => l.text);
const quietStudent = (state: LessonState): Student | undefined => state.students.find(s => s.persona.archetype === 'quiet');

/** Longest run of teacher lines with no student speaking in between. */
export function longestLecture(state: LessonState): number {
  const names = studentNames(state);
  let run = 0;
  let longest = 0;
  for (const l of state.transcript) {
    if (names.has(l.who)) run = 0;
    else if (l.who === 'teacher') longest = Math.max(longest, ++run);
  }
  return longest;
}

const result = (met: boolean, reason: string): ChallengeResult => ({ met, reason });

export const CHALLENGES: Challenge[] = [
  {
    id: 'no-lecture',
    title: 'Never talk 3 turns in a row without a student speaking',
    detection: 'The teacher never said three things in a row without a student speaking in between.',
    check: s => {
      if (teacherSaid(s.transcript).length === 0) return result(false, 'You did not teach anything.');
      const run = longestLecture(s);
      return run < 3 ? result(true, `At most ${run} of your turns came in a row before a student spoke.`)
        : result(false, `At one point you spoke ${run} times in a row with no student speaking.`);
    },
  },
  {
    id: 'every-hand',
    title: 'Answer every raised hand',
    detection: 'Every student who raised a hand was heard or answered before the bell.',
    check: s => {
      const raised = s.transcript.filter(l => l.who === 'note' && l.text.includes('raised a hand')).length;
      const waiting = s.students.filter(st => st.handUp).map(st => st.persona.name);
      if (raised === 0) return result(false, 'No student raised a hand this lesson, so there was nothing to answer.');
      return waiting.length === 0 ? result(true, `All ${raised} raised hand${raised > 1 ? 's were' : ' was'} answered.`)
        : result(false, `${waiting.join(', ')} still had a hand up at the bell.`);
    },
  },
  {
    // ponytail: counts teacher lines, not turns. Asking one student adds a teacher line without a turn, so this is slightly strict.
    id: 'early-check',
    title: 'Ask the class a question within your first 7 turns',
    detection: 'Among the first seven things the teacher said, one was a question to check understanding.',
    check: s => {
      const at = teacherSaid(s.transcript).findIndex(t => t.includes('?'));
      return at >= 0 && at < 7 ? result(true, `You asked a question in turn ${at + 1}.`)
        : result(false, at < 0 ? 'You never asked a question.' : `Your first question came in turn ${at + 1}.`);
    },
  },
  {
    id: 'quiet-answers',
    title: 'Get {quiet}, the quiet student, to answer a question',
    detection: 'The quiet student answered a question the teacher asked.',
    check: s => {
      const quiet = quietStudent(s);
      if (!quiet) return result(false, 'There was no quiet student in this class.');
      const t = s.transcript;
      for (let i = 0; i < t.length; i++) {
        if (t[i].who !== quiet.persona.name) continue;
        let j = i - 1;
        while (j >= 0 && t[j].who === 'board') j--;
        if (j >= 0 && t[j].who === 'teacher' && t[j].text.includes('?')) return result(true, `${quiet.persona.name} answered your question.`);
      }
      return result(false, `${quiet.persona.name} never answered one of your questions.`);
    },
  },
  {
    id: 'three-names',
    title: 'Call on three different students by name',
    detection: 'The teacher addressed at least three different students by name.',
    check: s => {
      const named = new Set(teacherSaid(s.transcript).map(t => namedStudent(s, t)?.persona.name).filter(Boolean));
      return named.size >= 3 ? result(true, `You spoke to ${[...named].join(', ')} by name.`)
        : result(false, `You called ${named.size} student${named.size === 1 ? '' : 's'} by name.`);
    },
  },
  {
    id: 'what-if',
    title: 'Ask a "what would happen if" question',
    detection: 'The teacher asked a question of the form "what would happen if" or "what if".',
    check: s => {
      const asked = teacherSaid(s.transcript).some(t => t.includes('?') && /\bwhat if\b|\bwhat (would|will|might|could) happen\b/i.test(t));
      return asked ? result(true, 'You asked the class to imagine a "what if".') : result(false, 'You never asked a "what would happen if" question.');
    },
  },
  {
    id: 'why-question',
    title: 'Ask a "why" question, not only "what"',
    detection: 'The teacher asked a question starting with or containing "why".',
    check: s => {
      const asked = teacherSaid(s.transcript).some(t => t.includes('?') && /\bwhy\b/i.test(t));
      return asked ? result(true, 'You asked the class why.') : result(false, 'You never asked a "why" question.');
    },
  },
  { id: 'analogy', title: 'Use a real-life example or analogy', detection: 'The teacher used at least one example from everyday life, or an analogy, to explain an idea of the lesson.' },
  { id: 'no-wrong', title: 'Correct a wrong belief without saying "wrong"', detection: 'The teacher corrected a student\'s wrong idea, and the teacher never used the word "wrong" anywhere in the lesson.' },
  { id: 'two-ways', title: 'Explain one idea in two different ways', detection: 'The teacher explained the same idea twice in clearly different ways (for example a definition and then an example, a picture or an analogy).' },
  { id: 'board-summary', title: 'Write a summary on the board', detection: 'The teacher wrote a summary of the main points of the lesson on the board (lines starting with "board:").' },
  { id: 'earlier-lesson', title: 'Connect today\'s topic to an earlier lesson', detection: 'The teacher explicitly linked today\'s topic to something learned in an earlier lesson or that students already know.' },
  { id: 'own-words', title: 'Have a student explain an idea in their own words', detection: 'The teacher asked a student to explain or rephrase an idea in their own words, and a student did.' },
  { id: 'goals-first', title: 'Start by telling the class what they will learn', detection: 'Near the start of the lesson, the teacher told the class what they would learn today.' },
  { id: 'praise-why', title: 'Praise a good answer and say why it was good', detection: 'The teacher praised a student\'s answer and said specifically what made it good.' },
];

export function pickChallenge(rng: Rng): Challenge {
  return CHALLENGES[Math.floor(rng() * CHALLENGES.length)];
}

export function challengeById(id: string | undefined): Challenge | null {
  return CHALLENGES.find(c => c.id === id) ?? null;
}

/** The title as the player sees it in this class. */
export function challengeTitle(c: Challenge, state: LessonState): string {
  return c.title.replace('{quiet}', quietStudent(state)?.persona.name ?? 'the quiet student');
}
