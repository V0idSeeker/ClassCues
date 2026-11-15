import { publicQuestion } from '../../game/quiz';
import type { QuizQuestion, Student } from '../../game/types';
import type { ChatMessage } from '../provider';
import { CONTENT_RULE, QUOTED_RULE, facts, knowledge, reminder, who } from './shared';

export function quizTakerPrompt(student: Student, questions: QuizQuestion[]): ChatMessage[] {
  return [
    {
      role: 'system',
      content: [
        who(student),
        CONTENT_RULE,
        'You are taking a quiz. Answer every question, using its id as question_id.',
        'You may ONLY use facts from your_notebook, your_prior_beliefs and what_you_remember_from_earlier_lessons.',
        'Anything you know from outside those lists, you have NOT learned yet: do not use it, even if you are sure it is right.',
        'If they do not cover a question, do what a real student would: write "I don\'t remember", or a guess built only from what they do say.',
        'For a question with choices, answer with the exact text of one choice.',
        QUOTED_RULE,
      ].join('\n'),
    },
    facts(knowledge(student), { quiz: questions.map(publicQuestion) }),
    reminder(student),
  ];
}
