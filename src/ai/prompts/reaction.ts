import type { LessonState, Student } from '../../game/types';
import type { ChatMessage } from '../provider';
import { CONTENT_RULE, QUOTED_RULE, facts, knowledge, lastLines, reminder, who } from './shared';

export function reactionPrompt(state: LessonState, student: Student): ChatMessage[] {
  return [
    {
      role: 'system',
      content: [
        who(student),
        CONTENT_RULE,
        'You know only what is in your_notebook and your_prior_beliefs (which may be wrong).',
        'Decide whether you want to raise your hand right now, and what you would say: a question, a doubt, or a comment.',
        'If the last line of recent_class_transcript is a classmate speaking, you may react to them: agree, disagree, correct them from your notebook, or ask about what they said.',
        'Do not repeat a question that was already asked and answered in recent_class_transcript.',
        'Speak like a real student: one or two short sentences. Never lecture. Never act as the teacher.',
        'If you have nothing to say, set wants_to_speak to false and message to an empty text.',
        QUOTED_RULE,
      ].join('\n'),
    },
    facts(knowledge(student), { board: state.board }, { recent_class_transcript: lastLines(state) }),
    reminder(student),
  ];
}
