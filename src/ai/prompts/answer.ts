import type { LessonState, Student } from '../../game/types';
import type { ChatMessage } from '../provider';
import { CONTENT_RULE, QUOTED_RULE, facts, knowledge, lastLines, reminder, who } from './shared';

export function answerPrompt(state: LessonState, student: Student, question: string): ChatMessage[] {
  return [
    {
      role: 'system',
      content: [
        who(student),
        CONTENT_RULE,
        'The teacher asks you a question. Answer in one or two short sentences, like a real student.',
        'You know only what is in your_notebook and your_prior_beliefs (which may be wrong).',
        'If they do not cover the question, guess, answer partly, or say you do not know.',
        QUOTED_RULE,
      ].join('\n'),
    },
    facts(knowledge(student), { board: state.board }, { recent_class_transcript: lastLines(state) }, { teacher_question: question }),
    reminder(student),
  ];
}
