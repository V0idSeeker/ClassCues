import { publicQuestion } from '../../game/quiz';
import type { QuizQuestion, Student } from '../../game/types';
import type { ChatMessage } from '../provider';
import type { Lang } from '../../i18n';
import { CONTENT_RULE, QUOTED_RULE, facts, knowledge, languageRule, reminder, who } from './shared';

export function quizTakerPrompt(student: Student, questions: QuizQuestion[], lang: Lang = 'en'): ChatMessage[] {
  return [
    {
      role: 'system',
      content: [
        who(student),
        CONTENT_RULE,
        'You are taking a quiz. Answer every question, using its id as question_id.',
        'You may ONLY use facts from your_notebook, your_prior_beliefs and what_you_remember_from_earlier_lessons.',
        'If they do not cover a question, do what a real student would: guess, answer partly, or write "I don\'t remember".',
        'For a question with choices, answer with the exact text of one choice.',
        `${languageRule(lang, 'your written answers')} For a question with choices, still copy the exact text of one choice, in the language it is written in.`,
        QUOTED_RULE,
      ].join('\n'),
    },
    facts(knowledge(student), { quiz: questions.map(publicQuestion) }),
    reminder(student),
  ];
}
