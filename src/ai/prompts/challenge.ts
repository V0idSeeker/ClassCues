import type { TranscriptLine } from '../../game/types';
import type { ChatMessage } from '../provider';
import { QUOTED_RULE, facts } from './shared';

/** After the quiz: did the teacher meet the lesson's challenge? Judged from the whole lesson. */
export function challengePrompt(title: string, detection: string, transcript: TranscriptLine[]): ChatMessage[] {
  return [
    {
      role: 'system',
      content: [
        'You judge whether a teacher met a teaching challenge during a lesson in a classroom game.',
        'lesson lists every line of the lesson in order: "teacher:" is what the teacher said, "board:" what the teacher wrote on the board, any other name is a student speaking.',
        'met is true only if the lesson clearly shows what the rule describes. When in doubt, met is false.',
        'reason is one short sentence to the teacher, saying what they did or what was missing. Quote the lesson briefly if it helps.',
        QUOTED_RULE,
      ].join('\n'),
    },
    facts(
      { challenge: title, rule: detection },
      { lesson: transcript.filter(l => l.who !== 'note').map(l => `${l.who}: ${l.text}`) },
    ),
  ];
}
