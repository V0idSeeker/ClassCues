import type { GraderInputRow, QuizQuestion } from '../../game/types';
import type { ChatMessage } from '../provider';
import type { Lang } from '../../i18n';
import { QUOTED_RULE, facts, languageRule } from './shared';

export function graderPrompt(question: QuizQuestion, rows: GraderInputRow[], lang: Lang = 'en'): ChatMessage[] {
  return [
    {
      role: 'system',
      content: [
        'You grade one quiz question for a whole class. Hold every student to the same standard.',
        'For each student: score the answer against answer_key using the rubric, and give max from the rubric.',
        'Be fair to spelling mistakes and to answers in the student\'s own words.',
        'supported_by_notes is true only if the facts in the answer appear in that student\'s notes.',
        'feedback is one short sentence saying why the answer lost points, or "Correct." if it lost none.',
        'Return every student exactly once, with the same student_id.',
        'Answers may be in a different language from answer_key, rubric and notes. Judge the meaning, not the language: a correct answer in another language gets full marks.',
        languageRule(lang, 'feedback'),
        QUOTED_RULE,
      ].join('\n'),
    },
    facts(
      { question: question.prompt },
      { answer_key: question.answer_key },
      { rubric: question.rubric ?? 'Full marks for a correct answer, none otherwise. Max 1.' },
      { students: rows },
    ),
  ];
}
