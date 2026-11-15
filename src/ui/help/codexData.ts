// The codex: every page of the in-game guide. Plain data, so it can be checked by tests.

/** A picture drawn on a codex page. Each key has a drawing in Codex.tsx. */
export type Visual = 'flow' | 'states' | 'mood' | 'goals' | 'notebook' | 'archetypes' | 'board' | 'report' | 'providers' | 'buttons';

export interface Entry {
  id: string;
  category: string;
  title: string;
  /** The opening paragraph. */
  intro: string;
  /** Short facts, each one line or two. */
  points?: string[];
  visual?: Visual;
  /** Other entries worth reading next. */
  see?: string[];
}

export const CATEGORIES = ['The basics', 'Teaching', 'Your students', 'Quiz and scores', 'Lessons and courses', 'AI and settings'];

export const ENTRIES: Entry[] = [
  // ---------------- The basics
  {
    id: 'goal', category: 'The basics', title: 'What this game is',
    intro: 'You are the teacher of a class of ten students played by AI. They know nothing about today\'s topic except what you teach them. At the end, they take a quiz using only their own notes, so their scores show how well you taught.',
    points: [
      'The real goal is that you learn the subject. To answer a student who asks "why?" or "what if?", you have to understand it yourself.',
      'Students are different: some listen well, some drift off, some arrive with wrong ideas you must correct.',
      'There is no single right way to teach. Explain, give examples, ask questions, use the board.',
    ],
    visual: 'flow', see: ['lesson', 'talking'],
  },
  {
    id: 'lesson', category: 'The basics', title: 'A lesson, step by step',
    intro: 'Every lesson follows the same path: choose a lesson, teach it, ring the bell, and read the report.',
    points: [
      'Choose: on the lessons screen, press Teach next to a lesson. Ten students are drawn from a pool of thirty.',
      'Study: read the goals and the study notes, and see which wrong beliefs students may bring.',
      'Teach: talk, write on the board, answer questions, check understanding.',
      'Ring the bell: the students take a six-question quiz from their notes.',
      'Report: see the class average, every answer, and three tips for next time. Then try to beat your best score.',
    ],
    visual: 'flow', see: ['prepare', 'turns', 'quiz', 'report'],
  },
  {
    id: 'prepare', category: 'The basics', title: 'Studying before you teach',
    intro: 'Before each lesson, a study screen shows what you will teach: the goals, the study notes, and the wrong ideas some students will arrive with. Read it first; you cannot teach what you do not understand.',
    points: [
      'The quiz questions stay hidden. Each one tests one of the goals.',
      'Plan how you will correct each wrong belief, not only how to explain the right idea.',
      'During the lesson, "Lesson notes" in the ☰ menu opens the same notes again.',
      'Tick "Skip this screen next time" to go straight to class. Turn it back on in Settings.',
    ],
    see: ['goals', 'wrong-beliefs'],
  },
  {
    id: 'turns', category: 'The basics', title: 'Turns and the clock',
    intro: 'A lesson lasts 20 turns or 15 real minutes, whichever comes first. The clock in the top bar shows it as a 45-minute class.',
    points: [
      'A turn is one press of "Say it" (or Enter), or one "Write it on the board".',
      'Typing directly on the board counts as a turn when you click away from it.',
      'Changing to another board, calling on a student and asking the class do not use a turn.',
      'When the turns or the time run out, the bell rings by itself.',
      'On a free AI plan with a daily limit, the bell also rings early if only enough requests remain for the quiz.',
    ],
    see: ['bell', 'limits'],
  },
  {
    id: 'bell', category: 'The basics', title: 'Ringing the bell',
    intro: 'Press "Ring the bell: quiz time" when you have taught everything you want. There is no bonus for using all 20 turns.',
    points: [
      'Before ringing, look at the lesson goals panel: a goal at 0/10 means nobody has it in their notes, so nobody can answer its question.',
      'Hands still up at the bell are mentioned in the report.',
      'The quiz takes a little while: the AI answers for each student, then marks the written answers.',
    ],
    visual: 'goals', see: ['quiz', 'goals'],
  },

  // ---------------- Teaching
  {
    id: 'talking', category: 'Teaching', title: 'Talking to the class',
    intro: 'Type what you would say out loud and press Enter (or "Say it"). Every student hears it and some of them write notes.',
    points: [
      'Students only learn what you say, write or draw. If you never mention something, nobody knows it.',
      'If you say something wrong, students write it down as you said it, and use it in the quiz.',
      'Short, clear sentences work better than one long speech. Examples help struggling students.',
      'Shift+Enter starts a new line without sending.',
    ],
    see: ['asking', 'board', 'notebooks'],
  },
  {
    id: 'asking', category: 'Teaching', title: 'Asking questions',
    intro: 'Questions show you what students really understood, and they keep the class awake.',
    points: [
      'End a sentence with a question mark and one student answers out loud. A student with a raised hand goes first; otherwise someone is picked.',
      'Put a student\'s name in your sentence ("Maya, why does that work?") and that student answers, nobody else.',
      '"Ask the class" with nothing typed asks if anyone has a question.',
      'After a student answers, a classmate may raise a hand to agree, disagree or add something.',
      'Always confirm or correct an answer out loud. An answer you ignore can end up in other students\' notes as hearsay.',
    ],
    visual: 'buttons', see: ['calling', 'hearsay'],
  },
  {
    id: 'calling', category: 'Teaching', title: 'Raised hands and calling on students',
    intro: 'Students raise their hands when they want to ask or say something. A raised hand is an arm waving in the classroom and a ✋ bubble.',
    points: [
      'Click a student\'s desk with a raised hand to hear what they want to say.',
      'The ✋ button next to the selected student shows how many hands are up and jumps to the next one.',
      '"Call on" a student: if their hand is up they speak; if you typed a question they answer it; if you typed nothing they are invited to ask a question.',
      'Students ask real questions about the lesson: why, what if, where does the rule stop working. Answering them well is the heart of the game.',
      '🔊 under the typing box repeats what the selected student said.',
    ],
    visual: 'states', see: ['asking', 'moods'],
  },
  {
    id: 'board', category: 'Teaching', title: 'The board',
    intro: 'Students copy what you write on the board, often more reliably than what you say. Write the key points there.',
    points: [
      'Click the board and type, or type in the box below and press "Write it on the board".',
      'Select words on the board to erase or retype them. "Erase selected words" does the same with a button.',
      '"Wipe the board" clears it; "Undo wipe" brings it back.',
      'Erasing only stops students copying from now on. Notes they already took stay in their notebooks.',
      '"Big board" shows a larger board with the students\' faces underneath.',
    ],
    visual: 'board', see: ['slides', 'pictures'],
  },
  {
    id: 'speaking', category: 'Teaching', title: 'Speaking instead of typing',
    intro: 'Press 🎤 next to the typing box and talk. Your words appear in the box as you speak.',
    points: [
      'Nothing is sent by itself. Read what was heard, fix any mistakes, then press Say it or Enter.',
      'Press ■ Stop, or start typing, to stop listening.',
      'Works in Chrome, Edge and Safari. Firefox has no speech recognition, so the button does not appear there.',
      'The first time, the browser asks to use the microphone. If you refused, allow it from the icon at the left of the address bar.',
      'In Chrome and Edge the audio is sent to the browser maker to be turned into text.',
    ],
    see: ['talking'],
  },
  {
    id: 'slides', category: 'Teaching', title: 'Several boards, like slides',
    intro: 'When a board is full, start a new one instead of wiping. Each board keeps its text.',
    points: [
      '"New board" adds a clean board (up to 12). ◀ and ▶ move between boards.',
      'The class sees only the board on show.',
      'Showing a board for the first time counts as new material. Going back to a board they already saw costs nothing and they do not copy it twice.',
      'Changing board does not use a turn.',
    ],
    visual: 'board', see: ['board'],
  },
  {
    id: 'pictures', category: 'Teaching', title: 'Drawing and pictures',
    intro: 'With an AI model that can read pictures, you can draw on the board in chalk or add an image, and the students see it.',
    points: [
      'Gemini models can read pictures. OpenRouter marks which of its models can. For a local model that can, tick "My model can read pictures" in Settings.',
      'With any other model the drawing tools are hidden.',
      '"Draw" turns the mouse or finger into chalk, in four colours. Press "Stop drawing" to type again.',
      'A new picture counts as a turn. You can add a few words saying what it shows.',
    ],
    see: ['providers', 'board'],
  },

  // ---------------- Your students
  {
    id: 'students', category: 'Your students', title: 'Who your students are',
    intro: 'Every class has ten students. Six of them are one of each type below; the other four are ordinary students with their own habits.',
    points: [
      'Eager: listens well, asks a lot, wants exact definitions.',
      'Quiet: understands a lot but never speaks unless you call on them. Silence does not mean understanding.',
      'Class clown: easily distracted, asks with a joke, but the question is real.',
      'Skeptic: asks "why?" and spots when something does not add up.',
      'Wrong-belief carrier: arrives sure of two wrong ideas about the topic.',
      'Struggling: needs simple words, one idea at a time, and examples.',
    ],
    visual: 'archetypes', see: ['moods', 'wrong-beliefs'],
  },
  {
    id: 'moods', category: 'Your students', title: 'Moods and the bubbles above heads',
    intro: 'Each student shows how they feel with their face and a bubble beside their head. A raised hand always wins over the mood.',
    points: [
      'Moods carry over from turn to turn; they do not reset.',
      'A bored student writes down fewer notes, so boredom costs points in the quiz.',
      'Examples, questions and speaking to a student lift their mood. A long lecture with no interaction bores the less attentive ones.',
    ],
    visual: 'states', see: ['class-mood', 'calling'],
  },
  {
    id: 'class-mood', category: 'Your students', title: 'Class mood',
    intro: 'The top bar shows how the class feels as a whole. Moods spread: when many classmates are bored or lost, others drift the same way.',
    points: [
      'Three or more of your turns in a row with no student speaking is a lecture. Low-attention students get bored.',
      'Fix a restless class by asking a question, calling on someone, or giving an example.',
      'Fix a lost class by slowing down, going back to the last clear point, and checking with a question.',
    ],
    visual: 'mood', see: ['moods', 'asking'],
  },
  {
    id: 'notebooks', category: 'Your students', title: 'Notebooks',
    intro: 'Click a student in the class, then open Notebook (next to Talk, under the typing box). It is everything they will have for the quiz. A dot on Notebook means students wrote something new since you last looked.',
    points: [
      'Students write notes in their own words. Attentive students catch almost everything; others miss some.',
      'Orange: a note bent by a wrong belief. It does not count for the goals.',
      'Red: a wrong belief the student still holds. Correct it clearly or they answer the quiz with it.',
      'Grey: something remembered from an earlier lesson.',
      'A note starting with a name ("Tom said: ...") is hearsay: a classmate\'s claim nobody confirmed.',
    ],
    visual: 'notebook', see: ['wrong-beliefs', 'hearsay', 'goals'],
  },
  {
    id: 'goals', category: 'Your students', title: 'Lesson goals',
    intro: 'The Goals counter at the top ("Goals 2/5") shows how many goals at least one student has in their notes. Open it to see every goal with the number of students who have a correct note on it.',
    points: [
      'Each green mark is one student. 0/10 means you have not taught it yet, or nobody caught it.',
      'Every quiz question tests one goal. A goal with no notes means that question is lost.',
      'Bent notes and hearsay do not count.',
    ],
    visual: 'goals', see: ['notebooks', 'quiz'],
  },
  {
    id: 'wrong-beliefs', category: 'Your students', title: 'Wrong beliefs',
    intro: 'Some students start the lesson believing something false about the topic, like "the = sign means equal, like in maths". These come from the lesson itself.',
    points: [
      'The wrong-belief carrier has two, the struggling student one, and two other students one each.',
      'A belief stays until you correct it clearly. It also bends related notes.',
      'Students who still hold a belief at the bell answer the quiz with it. The report lists them.',
      'Say what the wrong idea is and why it is wrong, not only the right idea.',
    ],
    visual: 'notebook', see: ['notebooks'],
  },
  {
    id: 'hearsay', category: 'Your students', title: 'Hearsay',
    intro: 'When a student says something and you move on without confirming or correcting it, a few inattentive classmates may write it down anyway, as "Name said: ...".',
    points: [
      'Hearsay does not count for the goals, and if the claim was wrong it can confuse students.',
      'The report warns you when it happened.',
      'Avoid it by reacting to every answer: "Yes, exactly" or "Not quite, because...".',
    ],
    see: ['asking', 'notebooks'],
  },
  {
    id: 'memory', category: 'Your students', title: 'Memory across lessons',
    intro: 'Students remember. After a quiz, each student keeps up to eight notes from that lesson, right or wrong, for their next three lessons.',
    points: [
      'Remembered notes show in grey in the notebook. Students can use them to speak and in quizzes.',
      'A student who was not in a class remembers nothing of it.',
      'Teaching the same lesson again starts fresh, so a replay still measures that day\'s teaching.',
      'Settings has "Make students forget earlier lessons".',
    ],
    see: ['notebooks'],
  },
  {
    id: 'voices', category: 'Your students', title: 'Voices',
    intro: 'Students read their lines aloud with your browser\'s built-in voices, and their mouth moves while they speak.',
    points: [
      'Edge has the most natural voices. Chrome and Firefox work too.',
      'Turn voices on or off with "Voices" in the ☰ menu or in Settings. Text is always shown.',
    ],
  },

  // ---------------- Quiz and scores
  {
    id: 'quiz', category: 'Quiz and scores', title: 'The quiz',
    intro: 'Each student answers six questions using only their notebook, their wrong beliefs and what they remember from earlier lessons. The AI cannot use what it knows about the subject.',
    points: [
      'Multiple choice: a student with no note on that goal guesses at random.',
      'Written answers are marked against a model answer, all students to the same standard.',
      'A correct written answer that the student\'s notes do not support gets at most half marks.',
      'So the only way to raise scores is to teach.',
    ],
    see: ['report', 'goals'],
  },
  {
    id: 'report', category: 'Quiz and scores', title: 'The report card',
    intro: 'After the quiz you see how the class did and why.',
    points: [
      'Class average, and whether this is your first time, a new best, or your best so far.',
      'Three tips: goals nobody had, questions most students missed, wrong beliefs still held, hands left up.',
      'The goals table: how many students had each goal in their notes, and their average on its questions.',
      '"Your teaching, checked": anything you said or wrote that was wrong.',
      '"In their own words": one student explains the lesson back to you.',
      'Open a student to see each answer, its mark and why it lost points.',
    ],
    visual: 'report', see: ['fact-check', 'explain-back', 'scores'],
  },
  {
    id: 'fact-check', category: 'Quiz and scores', title: 'Your teaching, checked',
    intro: 'After the quiz, the AI compares everything you said and wrote with the lesson\'s reference. Anything false or misleading is listed with what is right.',
    points: [
      'This is how you find out what you got wrong yourself: students write down your mistakes as facts.',
      'Major mistakes are listed first.',
      'Only wrong statements are listed, not things you left out.',
      'The check is made by an AI and can be wrong. When in doubt, look it up.',
      'It uses one extra AI request per lesson.',
    ],
    see: ['report', 'talking'],
  },
  {
    id: 'explain-back', category: 'Quiz and scores', title: 'In their own words',
    intro: 'After the quiz, one student explains the whole lesson back to you, using only their notebook. It shows what your class actually took away.',
    points: [
      'The student is the one whose quiz score was closest to the class average: a typical student, not the best one.',
      'Below the explanation, the goals missing from that student\'s notes are listed.',
      'Listen for wrong ideas and gaps: they show what to explain better next time.',
      'It uses one extra AI request per lesson.',
    ],
    see: ['report', 'notebooks'],
  },
  {
    id: 'scores', category: 'Quiz and scores', title: 'Scores and courses',
    intro: 'Every finished lesson records its class average. Teach a lesson again to beat your best.',
    points: [
      'Each lesson shows its best score, last score and how many times you taught it.',
      'A course score is the average of the best scores of the lessons taught so far ("Course score 70% · 2 of 5 taught").',
      'Scores stay in this browser. They are not included when you export lessons.',
    ],
    visual: 'report', see: ['report'],
  },

  // ---------------- Lessons and courses
  {
    id: 'courses', category: 'Lessons and courses', title: 'Built-in courses',
    intro: 'The game comes with three courses to teach, each with goals, common wrong beliefs and a quiz that tests understanding.',
    points: [
      'Intro to Python: variables, decisions with if, loops.',
      'Data Structures: linked lists, stacks, queues, binary trees.',
      'SQL Basics: SELECT and WHERE, joining tables, counting and grouping.',
      'Pick a lesson you do not know well yet: teaching it is how you learn it.',
    ],
    see: ['pdf'],
  },
  {
    id: 'pdf', category: 'Lessons and courses', title: 'Making lessons from PDFs',
    intro: 'Turn your own course notes, slides or textbook chapters into lessons. The AI writes the goals, wrong beliefs and quiz.',
    points: [
      'On the lessons screen, pick one PDF or several (hold Ctrl).',
      'Cut at chapters: the AI finds where each chapter begins. Or cut into a number of equal parts.',
      'A lesson holds up to 30,000 characters. Scanned PDFs (pictures of pages) do not work.',
      'The PDF stays on your computer; its text is sent to your AI provider.',
    ],
    see: ['editing', 'sharing'],
  },
  {
    id: 'editing', category: 'Lessons and courses', title: 'Editing a lesson',
    intro: 'Check every generated quiz before you teach it. Press Edit next to a lesson.',
    points: [
      'Everything can be changed: title, goals, wrong beliefs, and for each question its kind, goal, wording, choices, right answer and scoring.',
      'Add or remove questions.',
      'Make it as demanding as you like: you then have to teach well enough for students to pass.',
      'The AI sometimes asks something the chapter does not cover. Fix or remove such questions.',
    ],
    see: ['pdf'],
  },
  {
    id: 'sharing', category: 'Lessons and courses', title: 'Sharing lessons',
    intro: 'Lessons and courses are files you can give to others.',
    points: [
      '"Export" saves one lesson, "Export course" a whole course, "Export all my lessons" everything you made.',
      '"Add a lesson or course file" reads any of these. Every lesson is checked before it is added.',
      'Files hold lessons and quizzes, not scores.',
    ],
  },

  // ---------------- AI and settings
  {
    id: 'providers', category: 'AI and settings', title: 'Choosing an AI',
    intro: 'The students are played by an AI model you choose in Settings. Several work for free.',
    points: [
      'Paste the key in Settings, leave the model empty, and press "Test connection". The game picks a suitable model.',
      'Your key is kept in this browser only. Never paste it anywhere else.',
      'Running a model on your own computer works too (Ollama, LM Studio, llama.cpp). See the README.',
    ],
    visual: 'providers', see: ['limits', 'errors'],
  },
  {
    id: 'limits', category: 'AI and settings', title: 'Free limits',
    intro: 'Free AI plans limit how much you can ask per minute or per day. A lesson uses about 40 to 50 requests, plus two after the quiz for the fact check and the explanation.',
    points: [
      '"AI requests today" in the ☰ menu counts what this browser sent.',
      'When a limit is reached, the game waits a moment and tries again, or switches to another model by itself.',
      'With a daily limit set in Settings, the bell rings early so the quiz always has enough requests.',
    ],
    see: ['providers', 'errors'],
  },
  {
    id: 'errors', category: 'AI and settings', title: 'When something goes wrong',
    intro: 'If the AI cannot answer, a red message appears with a "Retry" button. Nothing is lost: the same turn is sent again.',
    points: [
      '"Could not reach the AI address": check the address, or that your local model is running.',
      '"Rejected the key": the key is wrong or deleted.',
      '"Too many requests" or "overloaded": wait a minute.',
      '"A format the game cannot read": pick a stronger model.',
      'A lesson in progress is saved after every turn, even if the page closes.',
    ],
    see: ['limits'],
  },
  {
    id: 'realistic', category: 'AI and settings', title: 'Realistic mode',
    intro: 'Tick "Realistic mode" in the ☰ menu to hide notebooks and goal counts. Like a real teacher, you only know what students understood by asking them.',
    points: ['Turn it off at any time to look again.'],
    see: ['asking', 'goals'],
  },
];

export const entryById = (id: string): Entry | undefined => ENTRIES.find(e => e.id === id);
