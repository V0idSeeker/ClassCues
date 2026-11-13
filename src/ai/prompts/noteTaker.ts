import type { LessonState } from '../../game/types';
import type { ChatMessage } from '../provider';
import { QUOTED_RULE, facts, lastLines } from './shared';

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
        '- recent_class_transcript shows what was said just before, by the teacher and by students. Use it only to understand what the teacher means now, for example which question the teacher is answering.',
        '- Something a student said becomes a note only if the teacher confirmed it in teacher_dialogue. If the teacher corrected it, note the correction.',
        '- Never add knowledge the teacher did not say or write. This rule is the most important.',
        QUOTED_RULE,
      ].join('\n'),
    },
    facts(
      { objectives: state.chapter.objectives },
      { students: state.students.map(s => ({ id: s.persona.id, learning_style: s.persona.learning_style, wrong_beliefs: s.beliefs })) },
      { board_full: state.board },
      { recent_class_transcript: lastLines(state) },
      { board_added: boardAdded },
      { teacher_dialogue: say },
    ),
    { role: 'system', content: 'Reminder: notes come only from teacher_dialogue and board_added, read in the light of recent_class_transcript. No outside knowledge.' },
  ];
}
