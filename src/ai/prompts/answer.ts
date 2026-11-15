import type { LessonState, Student } from '../../game/types';
import type { ChatMessage } from '../provider';
import type { Lang } from '../../i18n';
import { CONTENT_RULE, QUOTED_RULE, facts, knowledge, languageRule, lastLines, reminder, visibleBoard, who, withPicture } from './shared';

export function answerPrompt(state: LessonState, student: Student, question: string, lang: Lang = 'en'): ChatMessage[] {
  return [
    {
      role: 'system',
      content: [
        who(student),
        CONTENT_RULE,
        'The teacher speaks to you directly (teacher_question). Reply in one or two short sentences, like a real student.',
        'If the teacher asks you a question, answer it.',
        'If the teacher instead invites you to speak or to ask (for example "do you have a question?"), ask one:',
        'Ask something that makes the teacher explain or reason about the lesson. Good kinds of question:',
        '- why something works the way the teacher said;',
        '- what would happen in a new case the teacher did not show ("what if...");',
        '- how it differs from something similar, or where the rule stops working;',
        '- something that seems to contradict what you believe or what was said earlier.',
        'Build the question from what the teacher said, your notebook and your beliefs. You do not need to know the answer.',
        'Never ask about breaks, tests, seating or anything outside the lesson. Never ask what was already asked and answered.',
        'Stay in character: a shy student asks shyly, the class clown asks with a joke, but the question is still a real one about the lesson.',
        'You know only what is in your_notebook and your_prior_beliefs (which may be wrong).',
        'If they do not cover the question, guess, answer partly, or say you do not know.',
        languageRule(lang, 'your reply'),
        QUOTED_RULE,
      ].join('\n'),
    },
    withPicture(facts(knowledge(student), { board: visibleBoard(state) }, ...(state.boardPicture ? [{ board_picture: 'The picture now on the board is attached to this message.' }] : []), { recent_class_transcript: lastLines(state) }, { teacher_question: question }), state.boardPicture),
    reminder(student),
  ];
}
