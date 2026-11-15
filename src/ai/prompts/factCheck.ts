import type { Chapter, TranscriptLine } from '../../game/types';
import type { ChatMessage } from '../provider';
import type { Lang } from '../../i18n';
import { QUOTED_RULE, facts, languageRule } from './shared';

/** What the teacher said and wrote on the board, in order. Student lines are left out. */
export const teacherLines = (transcript: TranscriptLine[]): string[] =>
  transcript.filter(l => l.who === 'teacher' || l.who === 'board').map(l => `${l.who}: ${l.text}`);

export function factCheckPrompt(chapter: Chapter, transcript: TranscriptLine[], lang: Lang = 'en'): ChatMessage[] {
  return [
    {
      role: 'system',
      content: [
        'You check a lesson for mistakes made by the teacher. The goal is to help the teacher learn the subject.',
        'teacher_said lists everything the teacher said ("teacher:") and wrote on the board ("board:") during the lesson.',
        'Compare it with reference and with well-established facts of the subject.',
        'Flag only statements that are false or misleading. Do NOT flag things the teacher left out, simplifications that are still true, or style.',
        'For each mistake: claim quotes or closely paraphrases what the teacher said; correction is one or two plain sentences saying what is right, based on reference;',
        'severity is "major" if it would make students learn something wrong about a goal, "minor" otherwise.',
        'An empty errors list is a normal, good result. Do not invent mistakes.',
        `${languageRule(lang, 'each correction')} claim stays in the teacher's own words and language. The teacher may speak another language than reference: judge the meaning.`,
        QUOTED_RULE,
      ].join('\n'),
    },
    facts(
      { reference: chapter.reference },
      { objectives: chapter.objectives.map(o => o.text) },
      { teacher_said: teacherLines(transcript) },
    ),
  ];
}
