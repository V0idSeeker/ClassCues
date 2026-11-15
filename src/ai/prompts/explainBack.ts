import type { Student } from '../../game/types';
import type { ChatMessage } from '../provider';
import { CONTENT_RULE, QUOTED_RULE, facts, knowledge, reminder, who } from './shared';

/** After the quiz, one student explains the whole lesson in their own words, from their notebook only. */
export function explainBackPrompt(student: Student, lessonTitle: string): ChatMessage[] {
  return [
    {
      role: 'system',
      content: [
        who(student),
        CONTENT_RULE,
        'The lesson is over. Explain to your teacher, in your own words, what the whole lesson was about and what you learned.',
        'You may ONLY use facts from your_notebook, your_prior_beliefs and what_you_remember_from_earlier_lessons.',
        'Write 3 to 6 sentences, in your own voice. Be honest: say which parts you are unsure of or did not get.',
        QUOTED_RULE,
      ].join('\n'),
    },
    facts({ lesson_title: lessonTitle }, knowledge(student)),
    reminder(student),
  ];
}
