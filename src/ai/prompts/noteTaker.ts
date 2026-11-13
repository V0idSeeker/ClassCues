import type { LessonState } from '../../game/types';
import type { ChatMessage } from '../provider';
import { QUOTED_RULE, facts } from './shared';

export function noteTakerPrompt(state: LessonState, boardAdded: string, say: string): ChatMessage[] {
  return [
    {
      role: 'system',
      content: [
        'You simulate how each student in a class writes notes during a lesson.',
        'For each student, write the short notes they would take from teacher_dialogue and board_added only, in their own words.',
        'Rules:',
        '- If the teacher taught nothing new, new_notes is an empty list.',
        '- If the teacher said something factually wrong, students write it down as said.',
        '- A student may bend a note toward one of their wrong_beliefs. Then set distorted to true.',
        '- If the teacher clearly corrected one of a student\'s wrong_beliefs, put its id in beliefs_dropped.',
        '- objective is the id of the objective the note is about, or null.',
        '- emotion is how that student feels right now.',
        '- Return every student exactly once, with the same id.',
        '- Never add knowledge the teacher did not say or write. This rule is the most important.',
        QUOTED_RULE,
      ].join('\n'),
    },
    facts(
      { objectives: state.chapter.objectives },
      { students: state.students.map(s => ({ id: s.persona.id, learning_style: s.persona.learning_style, wrong_beliefs: s.beliefs })) },
      { board_full: state.board },
      { board_added: boardAdded },
      { teacher_dialogue: say },
    ),
    { role: 'system', content: 'Reminder: notes come only from teacher_dialogue and board_added. No outside knowledge.' },
  ];
}
