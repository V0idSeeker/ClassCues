// Teaching challenges: one is picked at random when a lesson starts and judged after the quiz.
import { t } from '../i18n';
import { RAISED_HAND, namedStudent } from './runLesson';
import type { Rng } from './rng';
import type { ChallengeResult, LessonState, Student, TranscriptLine } from './types';

export interface Challenge {
  id: string;
  /** What the player sees, in the current language. "{quiet}" is replaced by the quiet student's name. */
  readonly title: string;
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
    get title() { return t('challenge.no-lecture'); },
    detection: 'The teacher never said three things in a row without a student speaking in between.',
    check: s => {
      if (teacherSaid(s.transcript).length === 0) return result(false, t('judge.nothingTaught'));
      const run = longestLecture(s);
      return run < 3 ? result(true, t('judge.lectureOk', { count: run }))
        : result(false, t('judge.lectureBad', { count: run }));
    },
  },
  {
    id: 'every-hand',
    get title() { return t('challenge.every-hand'); },
    detection: 'Every student who raised a hand was heard or answered before the bell.',
    check: s => {
      const raised = s.transcript.filter(l => l.who === 'note' && l.text.includes(RAISED_HAND)).length;
      const waiting = s.students.filter(st => st.handUp).map(st => st.persona.name);
      if (raised === 0) return result(false, t('judge.noHands'));
      return waiting.length === 0 ? result(true, t('judge.handsOk', { count: raised }))
        : result(false, t('tips.hands', { names: waiting.join(', ') }));
    },
  },
  {
    // ponytail: counts teacher lines, not turns. Asking one student adds a teacher line without a turn, so this is slightly strict.
    id: 'early-check',
    get title() { return t('challenge.early-check'); },
    detection: 'Among the first seven things the teacher said, one was a question to check understanding.',
    check: s => {
      const at = teacherSaid(s.transcript).findIndex(t => t.includes('?'));
      return at >= 0 && at < 7 ? result(true, t('judge.askedAt', { n: at + 1 }))
        : result(false, at < 0 ? t('judge.neverAsked') : t('judge.askedLate', { n: at + 1 }));
    },
  },
  {
    id: 'quiet-answers',
    get title() { return t('challenge.quiet-answers'); },
    detection: 'The quiet student answered a question the teacher asked.',
    check: s => {
      const quiet = quietStudent(s);
      if (!quiet) return result(false, t('judge.noQuiet'));
      const lines = s.transcript;
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].who !== quiet.persona.name) continue;
        let j = i - 1;
        while (j >= 0 && lines[j].who === 'board') j--;
        if (j >= 0 && lines[j].who === 'teacher' && lines[j].text.includes('?')) return result(true, t('judge.quietOk', { name: quiet.persona.name }));
      }
      return result(false, t('judge.quietBad', { name: quiet.persona.name }));
    },
  },
  {
    id: 'three-names',
    get title() { return t('challenge.three-names'); },
    detection: 'The teacher addressed at least three different students by name.',
    check: s => {
      const named = new Set(teacherSaid(s.transcript).map(t => namedStudent(s, t)?.persona.name).filter(Boolean));
      return named.size >= 3 ? result(true, t('judge.namesOk', { names: [...named].join(', ') }))
        : result(false, t('judge.namesBad', { count: named.size }));
    },
  },
  {
    id: 'what-if',
    get title() { return t('challenge.what-if'); },
    detection: 'The teacher asked a question of the form "what would happen if" or "what if".',
    check: s => {
      const asked = teacherSaid(s.transcript).some(t => t.includes('?') && /\bwhat if\b|\bwhat (would|will|might|could) happen\b/i.test(t));
      return asked ? result(true, t('judge.whatIfOk')) : result(false, t('judge.whatIfBad'));
    },
  },
  {
    id: 'why-question',
    get title() { return t('challenge.why-question'); },
    detection: 'The teacher asked a question starting with or containing "why".',
    check: s => {
      const asked = teacherSaid(s.transcript).some(t => t.includes('?') && /\bwhy\b/i.test(t));
      return asked ? result(true, t('judge.whyOk')) : result(false, t('judge.whyBad'));
    },
  },
  { id: 'analogy', get title() { return t('challenge.analogy'); }, detection: 'The teacher used at least one example from everyday life, or an analogy, to explain an idea of the lesson.' },
  { id: 'no-wrong', get title() { return t('challenge.no-wrong'); }, detection: 'The teacher corrected a student\'s wrong idea, and the teacher never used the word "wrong" anywhere in the lesson.' },
  { id: 'two-ways', get title() { return t('challenge.two-ways'); }, detection: 'The teacher explained the same idea twice in clearly different ways (for example a definition and then an example, a picture or an analogy).' },
  { id: 'board-summary', get title() { return t('challenge.board-summary'); }, detection: 'The teacher wrote a summary of the main points of the lesson on the board (lines starting with "board:").' },
  { id: 'earlier-lesson', get title() { return t('challenge.earlier-lesson'); }, detection: 'The teacher explicitly linked today\'s topic to something learned in an earlier lesson or that students already know.' },
  { id: 'own-words', get title() { return t('challenge.own-words'); }, detection: 'The teacher asked a student to explain or rephrase an idea in their own words, and a student did.' },
  { id: 'goals-first', get title() { return t('challenge.goals-first'); }, detection: 'Near the start of the lesson, the teacher told the class what they would learn today.' },
  { id: 'praise-why', get title() { return t('challenge.praise-why'); }, detection: 'The teacher praised a student\'s answer and said specifically what made it good.' },
];

export function pickChallenge(rng: Rng): Challenge {
  return CHALLENGES[Math.floor(rng() * CHALLENGES.length)];
}

export function challengeById(id: string | undefined): Challenge | null {
  return CHALLENGES.find(c => c.id === id) ?? null;
}

/** The title as the player sees it in this class. */
export function challengeTitle(c: Challenge, state: LessonState): string {
  return c.title.replace('{quiet}', quietStudent(state)?.persona.name ?? t('challenge.quietFallback'));
}
