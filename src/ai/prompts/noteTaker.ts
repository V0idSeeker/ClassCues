import { atmosphere, visibleBoard } from '../../game/lesson';
import type { LessonState } from '../../game/types';
import type { ChatMessage } from '../provider';
import type { Lang } from '../../i18n';
import { QUOTED_RULE, facts, languageRule, lastLines, withPicture } from './shared';

export function noteTakerPrompt(state: LessonState, boardAdded: string, say: string, picture?: string | null, lang: Lang = 'en'): ChatMessage[] {
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
        '- emotion is how that student feels right now. Start from feels_now: moods carry over, they do not reset each turn.',
        '- Moods spread. When class_atmosphere shows many classmates bored or confused, a student drifts the same way.',
        '- A clear example, a joke, a question to the class or being spoken to lifts the mood towards CURIOUS or HAPPY.',
        '- When teacher_turns_since_a_student_spoke is 3 or more, the teacher is lecturing without interaction: students with low attention become BORED.',
        '- Something a student cannot follow makes them CONFUSED.',
        '- Return every student exactly once, with the same id.',
        '- recent_class_transcript shows what was said just before, by the teacher and by students. Use it only to understand what the teacher means now, for example which question the teacher is answering.',
        '- Something a classmate said becomes a normal note only if the teacher confirmed it in teacher_dialogue. If the teacher corrected it, note the correction.',
        '- If a classmate answered or claimed something and the teacher moved on without confirming or correcting it, up to three students with low attention may write it down as hearsay: the note starts with "<classmate name> said:" and distorted is true. They may feel CONFUSED.',
        '- When board_picture says a picture is attached, the students can see it on the board. They may note what it shows, in their own words, as far as they understand it. A picture the teacher did not explain teaches less than one the teacher explained.',
        '- Never add knowledge the teacher did not say, write or draw. This rule is the most important.',
        `- ${languageRule(lang, 'every note')}`,
        QUOTED_RULE,
      ].join('\n'),
    },
    withPicture(facts(
      { objectives: state.chapter.objectives },
      { students: state.students.map(s => ({ id: s.persona.id, attention: s.persona.traits.attention, learning_style: s.persona.learning_style, feels_now: s.emotion, wrong_beliefs: s.beliefs })) },
      { class_atmosphere: (({ bored, confused, teacherTurnsSinceStudentSpoke }) => ({
        share_bored: bored, share_confused: confused, teacher_turns_since_a_student_spoke: teacherTurnsSinceStudentSpoke,
      }))(atmosphere(state)) },
      { board_full: visibleBoard(state) },
      // Only the last few lines: enough to see which question the teacher is answering. This is the largest request
      // of a lesson and free tiers cap the text sent per minute.
      { recent_class_transcript: lastLines(state, 8) },
      { board_added: boardAdded },
      ...(picture ? [{ board_picture: 'The teacher put a new picture on the board. It is attached to this message.' }] : []),
      { teacher_dialogue: say },
    ), picture),
    { role: 'system', content: 'Reminder: notes come only from teacher_dialogue and board_added, read in the light of recent_class_transcript. No outside knowledge.' },
  ];
}
