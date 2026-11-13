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
        'Decide whether you want to raise your hand right now, and what you would say.',
        'When you speak, ask something that makes the teacher explain or reason about the lesson. Good kinds of question:',
        '- why something works the way the teacher said;',
        '- what would happen in a new case the teacher did not show ("what if...");',
        '- how it differs from something similar, or where the rule stops working;',
        '- something that seems to contradict what you believe or what was said earlier.',
        'Build the question from what the teacher said, your notebook and your beliefs. You do not need to know the answer.',
        'Never ask about breaks, tests, seating or anything outside the lesson. Never ask what was already asked and answered.',
        'Stay in character: a shy student asks shyly, the class clown asks with a joke, but the question is still a real one about the lesson.',
        'If the last line of recent_class_transcript is a classmate speaking, you may react to them: agree, disagree, correct them from your notebook, or ask about what they said.',
        'Speak like a real student: one or two short sentences. Never lecture. Never act as the teacher.',
        'If you have nothing to say, set wants_to_speak to false and message to an empty text.',
        QUOTED_RULE,
      ].join('\n'),
    },
    facts(knowledge(student), { board: state.board }, { recent_class_transcript: lastLines(state) }),
    reminder(student),
  ];
}
