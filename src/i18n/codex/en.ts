// The guide's text in English. Page ids and the number of points must match in every language.
import type { CodexText } from '../../ui/help/codexData';

export const codexEn: CodexText = {
  categories: {
    basics: 'The basics',
    teaching: 'Teaching',
    students: 'Your students',
    scores: 'Quiz and scores',
    courses: 'Lessons and courses',
    ai: 'AI and settings',
  },
  pages: {
    'goal': {
      title: 'What this game is',
      intro: 'You are the teacher of a class of ten students played by AI. They know nothing about today\'s topic except what you teach them. At the end, they take a quiz using only their own notes, so their scores show how well you taught.',
      points: [
        'The real goal is that you learn the subject. To answer a student who asks "why?" or "what if?", you have to understand it yourself.',
        'Students are different: some listen well, some drift off, some arrive with wrong ideas you must correct.',
        'There is no single right way to teach. Explain, give examples, ask questions, use the board.',
      ],
    },
    'lesson': {
      title: 'A lesson, step by step',
      intro: 'Every lesson follows the same path: choose a lesson, teach it, ring the bell, and read the report.',
      points: [
        'Choose: on the lessons screen, press Teach next to a lesson. Ten students are drawn from a pool of thirty.',
        'Study: read the goals and the study notes, and see which wrong beliefs students may bring.',
        'Teach: talk, write on the board, answer questions, check understanding.',
        'Ring the bell: the students take a six-question quiz from their notes.',
        'Report: see the class average, every answer, and three tips for next time. Then try to beat your best score.',
      ],
    },
    'prepare': {
      title: 'Studying before you teach',
      intro: 'Before each lesson, a study screen shows what you will teach: the goals, the study notes, and the wrong ideas some students will arrive with. Read it first; you cannot teach what you do not understand.',
      points: [
        'The quiz questions stay hidden. Each one tests one of the goals.',
        'Plan how you will correct each wrong belief, not only how to explain the right idea.',
        'During the lesson, "Lesson notes" in the ☰ menu opens the same notes again.',
        'Tick "Skip this screen next time" to go straight to class. Turn it back on in Settings.',
        'When your classes keep missing a goal of a lesson, it shows as "Often missed" on the lessons screen and on the study screen.',
      ],
    },
    'turns': {
      title: 'Turns and the clock',
      intro: 'A lesson lasts 20 turns or 15 real minutes, whichever comes first. The clock in the top bar shows it as a 45-minute class.',
      points: [
        'A turn is one press of "Say it" (or Enter), or one "Write it on the board".',
        'Typing directly on the board counts as a turn when you click away from it.',
        'Changing to another board, calling on a student and asking the class do not use a turn.',
        'When the turns or the time run out, the bell rings by itself.',
        'On a free AI plan with a daily limit, the bell also rings early if only enough requests remain for the quiz.',
      ],
    },
    'bell': {
      title: 'Ringing the bell',
      intro: 'Press "Ring the bell: quiz time" when you have taught everything you want. There is no bonus for using all 20 turns.',
      points: [
        'Before ringing, look at the lesson goals panel: a goal at 0/10 means nobody has it in their notes, so nobody can answer its question.',
        'Hands still up at the bell are mentioned in the report.',
        'The quiz takes a little while: the AI answers for each student, then marks the written answers.',
      ],
    },
    'talking': {
      title: 'Talking to the class',
      intro: 'Type what you would say out loud and press Enter (or "Say it"). Every student hears it and some of them write notes.',
      points: [
        'Students only learn what you say, write or draw. If you never mention something, nobody knows it.',
        'If you say something wrong, students write it down as you said it, and use it in the quiz.',
        'Short, clear sentences work better than one long speech. Examples help struggling students.',
        'Shift+Enter starts a new line without sending.',
      ],
    },
    'asking': {
      title: 'Asking questions',
      intro: 'Questions show you what students really understood, and they keep the class awake.',
      points: [
        'End a sentence with a question mark and one student answers out loud. A student with a raised hand goes first; otherwise someone is picked.',
        'Put a student\'s name in your sentence ("Maya, why does that work?") and that student answers, nobody else.',
        '"Ask the class" with nothing typed asks if anyone has a question.',
        'After a student answers, a classmate may raise a hand to agree, disagree or add something.',
        'Always confirm or correct an answer out loud. An answer you ignore can end up in other students\' notes as hearsay.',
      ],
    },
    'calling': {
      title: 'Raised hands and calling on students',
      intro: 'Students raise their hands when they want to ask or say something. A raised hand is an arm waving in the classroom and a ✋ bubble.',
      points: [
        'Click a student\'s desk with a raised hand to hear what they want to say.',
        'The ✋ button next to the selected student shows how many hands are up and jumps to the next one.',
        '"Call on" a student: if their hand is up they speak; if you typed a question they answer it; if you typed nothing they are invited to ask a question.',
        'Students ask real questions about the lesson: why, what if, where does the rule stop working. Answering them well is the heart of the game.',
        '🔊 under the typing box repeats what the selected student said.',
      ],
    },
    'board': {
      title: 'The board',
      intro: 'Students copy what you write on the board, often more reliably than what you say. Write the key points there.',
      points: [
        'Click the board and type, or type in the box below and press "Write it on the board".',
        'Select words on the board to erase or retype them. "Erase selected words" does the same with a button.',
        '"Wipe the board" clears it; "Undo wipe" brings it back.',
        'Erasing only stops students copying from now on. Notes they already took stay in their notebooks.',
        '"Big board" shows a larger board with the students\' faces underneath.',
      ],
    },
    'speaking': {
      title: 'Speaking instead of typing',
      intro: 'Press 🎤 next to the typing box and talk. Your words appear in the box as you speak.',
      points: [
        'Nothing is sent by itself. Read what was heard, fix any mistakes, then press Say it or Enter.',
        'Press ■ Stop, or start typing, to stop listening.',
        'Works in Chrome, Edge and Safari. Firefox has no speech recognition, so the button does not appear there.',
        'The first time, the browser asks to use the microphone. If you refused, allow it from the icon at the left of the address bar.',
        'In Chrome and Edge the audio is sent to the browser maker to be turned into text.',
      ],
    },
    'slides': {
      title: 'Several boards, like slides',
      intro: 'When a board is full, start a new one instead of wiping. Each board keeps its text.',
      points: [
        '"New board" adds a clean board (up to 12). ◀ and ▶ move between boards.',
        'The class sees only the board on show.',
        'Showing a board for the first time counts as new material. Going back to a board they already saw costs nothing and they do not copy it twice.',
        'Changing board does not use a turn.',
      ],
    },
    'pictures': {
      title: 'Drawing and pictures',
      intro: 'With an AI model that can read pictures, you can draw on the board in chalk or add an image, and the students see it.',
      points: [
        'Gemini models can read pictures. OpenRouter marks which of its models can. For a local model that can, tick "My model can read pictures" in Settings.',
        'With any other model the drawing tools are hidden.',
        '"Draw" turns the mouse or finger into chalk, in four colours. Press "Stop drawing" to type again.',
        'A new picture counts as a turn. You can add a few words saying what it shows.',
      ],
    },
    'students': {
      title: 'Who your students are',
      intro: 'Every class has ten students. Six of them are one of each type below; the other four are ordinary students with their own habits.',
      points: [
        'Eager: listens well, asks a lot, wants exact definitions.',
        'Quiet: understands a lot but never speaks unless you call on them. Silence does not mean understanding.',
        'Class clown: easily distracted, asks with a joke, but the question is real.',
        'Skeptic: asks "why?" and spots when something does not add up.',
        'Wrong-belief carrier: arrives sure of two wrong ideas about the topic.',
        'Struggling: needs simple words, one idea at a time, and examples.',
      ],
    },
    'moods': {
      title: 'Moods and the bubbles above heads',
      intro: 'Each student shows how they feel with their face and a bubble beside their head. A raised hand always wins over the mood. Shy students hide their confusion: they look calm until you ask the class a question or speak to them.',
      points: [
        'Moods carry over from turn to turn; they do not reset.',
        'A bored student writes down fewer notes, so boredom costs points in the quiz.',
        'Examples, questions and speaking to a student lift their mood. A long lecture with no interaction bores the less attentive ones.',
      ],
    },
    'class-mood': {
      title: 'Class mood',
      intro: 'The top bar shows how the class feels as a whole. Moods spread: when many classmates are bored or lost, others drift the same way.',
      points: [
        'Three or more of your turns in a row with no student speaking is a lecture. Low-attention students get bored.',
        'Fix a restless class by asking a question, calling on someone, or giving an example.',
        'Fix a lost class by slowing down, going back to the last clear point, and checking with a question.',
      ],
    },
    'notebooks': {
      title: 'Notebooks',
      intro: 'Click a student in the class, then open Notebook (next to Talk, under the typing box). It is everything they will have for the quiz. A dot on Notebook means students wrote something new since you last looked.',
      points: [
        'Students write notes in their own words. Attentive students catch almost everything; others miss some.',
        'Orange: a note bent by a wrong belief. It does not count for the goals.',
        'Red: a wrong belief the student still holds. Correct it clearly or they answer the quiz with it.',
        'Grey: something remembered from an earlier lesson.',
        'A note starting with a name ("Tom said: ...") is hearsay: a classmate\'s claim nobody confirmed.',
      ],
    },
    'goals': {
      title: 'Lesson goals',
      intro: 'The Goals counter at the top ("Goals 2/5") shows how many goals at least one student has in their notes. Open it to see every goal with the number of students who have a correct note on it.',
      points: [
        'Each green mark is one student. 0/10 means you have not taught it yet, or nobody caught it.',
        'Every quiz question tests one goal. A goal with no notes means that question is lost.',
        'Bent notes and hearsay do not count.',
      ],
    },
    'wrong-beliefs': {
      title: 'Wrong beliefs',
      intro: 'Some students start the lesson believing something false about the topic, like "the = sign means equal, like in maths". These come from the lesson itself.',
      points: [
        'The wrong-belief carrier has two, the struggling student one, and two other students one each.',
        'A belief stays until you correct it clearly. Confident students need you to name the wrong idea and say why it is wrong; hearing the right answer is not enough for them. It also bends related notes.',
        'Students who still hold a belief at the bell answer the quiz with it. The report lists them.',
        'Say what the wrong idea is and why it is wrong, not only the right idea.',
      ],
    },
    'difficulty': {
      title: 'Easy, Normal, Hard, Inspection',
      intro: 'Choose how hard your class is in Settings. Normal is the game as designed.',
      points: [
        'Easy: students pay more attention, and only the wrong-belief carrier brings wrong ideas.',
        'Hard: students pay less attention. Everyone but the eager student brings a wrong idea, the carrier three.',
        'Inspection: like Hard, and a correct written answer that the student\'s notes do not support gets no marks.',
        'Harder classes count more toward your rank.',
      ],
    },
    'hearsay': {
      title: 'Hearsay',
      intro: 'When a student says something and you move on without confirming or correcting it, a few inattentive classmates may write it down anyway, as "Name said: ...".',
      points: [
        'Hearsay does not count for the goals, and if the claim was wrong it can confuse students.',
        'The report warns you when it happened.',
        'Avoid it by reacting to every answer: "Yes, exactly" or "Not quite, because...".',
      ],
    },
    'memory': {
      title: 'Memory across lessons',
      intro: 'Students remember. After a quiz, each student keeps up to eight notes from that lesson, right or wrong, for their next three lessons.',
      points: [
        'Remembered notes show in grey in the notebook. Students can use them to speak and in quizzes.',
        'A student who was not in a class remembers nothing of it.',
        'Teaching the same lesson again starts fresh, so a replay still measures that day\'s teaching.',
        'Your mistakes found by the fact check are remembered too. In their next lessons, students who wrote them down start out believing them (red in the notebook) until you correct them, up to three per student.',
        'Settings has "Make students forget earlier lessons".',
      ],
    },
    'voices': {
      title: 'Voices',
      intro: 'Students read their lines aloud with your browser\'s built-in voices, and their mouth moves while they speak.',
      points: [
        'Edge has the most natural voices. Chrome and Firefox work too.',
        'Turn voices on or off with "Voices" in the ☰ menu or in Settings. Text is always shown.',
      ],
    },
    'quiz': {
      title: 'The quiz',
      intro: 'Each student answers six questions using only their notebook, their wrong beliefs and what they remember from earlier lessons. The AI cannot use what it knows about the subject.',
      points: [
        'Multiple choice: a student with no note on that goal guesses at random.',
        'Written answers are marked against a model answer, all students to the same standard.',
        'A correct written answer that the student\'s notes do not support gets at most half marks.',
        'So the only way to raise scores is to teach.',
      ],
    },
    'report': {
      title: 'The report card',
      intro: 'While the class takes the quiz, you answer three of its questions from memory. Then you see how the class did and why, and how you did yourself.',
      points: [
        'Class average, the points your own mistakes cost, and the lesson score that results; and whether this is your first time, a new best, or your best so far.',
        'Three tips: goals nobody had, questions most students missed, wrong beliefs still held, hands left up.',
        'The goals table: how many students had each goal in their notes, and their average on its questions.',
        '"Your teaching, checked": anything you said or wrote that was wrong.',
        '"In their own words": one student explains the lesson back to you.',
        'Open a student to see each answer, its mark and why it lost points.',
      ],
    },
    'fact-check': {
      title: 'Your teaching, checked',
      intro: 'After the quiz, the AI compares everything you said and wrote with the lesson\'s reference. Anything false or misleading is listed with what is right.',
      points: [
        'This is how you find out what you got wrong yourself: students write down your mistakes as facts.',
        'Major mistakes are listed first. Each one takes points off your lesson score: major −5, minor −2, at most −15.',
        'Only wrong statements are listed, not things you left out.',
        'The check is made by an AI and can be wrong. When in doubt, look it up, and press "I disagree": that mistake then costs nothing and the class forgets it.',
        'It uses one extra AI request per lesson.',
      ],
    },
    'explain-back': {
      title: 'In their own words',
      intro: 'After the quiz, one student explains the whole lesson back to you, using only their notebook. It shows what your class actually took away.',
      points: [
        'The student is the one whose quiz score was closest to the class average: a typical student, not the best one.',
        'Below the explanation, the goals missing from that student\'s notes are listed.',
        'Listen for wrong ideas and gaps: they show what to explain better next time.',
        'It uses one extra AI request per lesson.',
      ],
    },
    'review': {
      title: 'Reviewing a lesson',
      intro: '"Review the lesson" on the report replays it, turn by turn.',
      points: [
        'A chart over the turns shows goals covered and class mood, with ✋ where hands were up. Click a turn to jump to it.',
        'The conversation is grouped by turn, each with the class\'s state after it.',
        'Mistakes from the fact check are pinned to the line where you said them.',
        '"Class drifted" and "+1 goal" markers show where things went wrong or right.',
      ],
    },
    'follow-up': {
      title: 'Follow-up lessons',
      intro: 'When the class missed goals or the fact check found mistakes, the report offers "Teach a follow-up lesson".',
      points: [
        'A goal is missed when nobody had it in their notes, or the class scored under 50% on its questions.',
        'The same ten students come back. The lesson covers only the missed goals and their questions.',
        'Students start out believing your mistakes and the wrong ideas they still held.',
        'Its score is kept apart from the course.',
      ],
    },
    'scores': {
      title: 'Scores and courses',
      intro: 'Every finished lesson records its lesson score: the class average minus points for your mistakes. Teach a lesson again to beat your best. Goals you got wrong yourself, or that no student had in their notes, come back for review on the lessons screen after 1, 3 and 7 days.',
      points: [
        'Each lesson shows its best score, last score and how many times you taught it.',
        'A course score is the average of the best scores of the lessons taught so far ("Course score 70% · 2 of 5 taught").',
        'Scores stay in this browser. They are not included when you export lessons.',
      ],
    },
    'challenges': {
      title: 'Lesson challenges',
      intro: 'Each lesson has one teaching challenge, shown in the top bar with 🎯.',
      points: [
        'For example: use a real-life example, get the quiet student to answer, never lecture three turns in a row.',
        'Some are checked by the game, some by the AI after the quiz.',
        'The report says whether you met it.',
      ],
    },
    'rank': {
      title: 'Rank and badges',
      intro: 'Your rank grows from Student Teacher to Substitute, Teacher, Senior Teacher and Head of Department as you teach more lessons with higher scores.',
      points: [
        'Harder classes count more. Each lesson counts by the average of its last three plays, and follow-up lessons do not count.',
        'Badges mark milestones: a first 80% class, a full course, challenges met, a lesson with no mistakes found.',
        'Both show on the main menu and the report.',
        '"Share" on the report makes a picture of your report card.',
      ],
    },
    'courses': {
      title: 'Built-in courses',
      intro: 'The game comes with three courses to teach, each with goals, common wrong beliefs and a quiz that tests understanding.',
      points: [
        'Intro to Python: variables, decisions with if, loops.',
        'Data Structures: linked lists, stacks, queues, binary trees.',
        'SQL Basics: SELECT and WHERE, joining tables, counting and grouping.',
        'Pick a lesson you do not know well yet: teaching it is how you learn it.',
      ],
    },
    'pdf': {
      title: 'Making lessons from PDFs',
      intro: 'Turn your own course notes, slides or textbook chapters into lessons. The AI writes the goals, wrong beliefs and quiz.',
      points: [
        'On the lessons screen, pick one PDF or several (hold Ctrl).',
        'Cut at chapters: the AI finds where each chapter begins. Or cut into a number of equal parts.',
        'A lesson holds up to 30,000 characters. Scanned PDFs (pictures of pages) do not work.',
        'The PDF stays on your computer; its text is sent to your AI provider.',
      ],
    },
    'editing': {
      title: 'Editing a lesson',
      intro: 'Check every generated quiz before you teach it. Press Edit next to a lesson.',
      points: [
        'Everything can be changed: title, goals, wrong beliefs, and for each question its kind, goal, wording, choices, right answer and scoring.',
        'Add or remove questions.',
        'Make it as demanding as you like: you then have to teach well enough for students to pass.',
        'The AI sometimes asks something the chapter does not cover. Fix or remove such questions.',
      ],
    },
    'sharing': {
      title: 'Sharing lessons',
      intro: 'Lessons and courses are files you can give to others.',
      points: [
        '"Export" saves one lesson, "Export course" a whole course, "Export all my lessons" everything you made.',
        '"Add a lesson or course file" reads any of these. Every lesson is checked before it is added.',
        'Files hold lessons and quizzes, not scores.',
      ],
    },
    'providers': {
      title: 'Choosing an AI',
      intro: 'The students are played by an AI model you choose in Settings. Several work for free.',
      points: [
        'Paste the key in Settings, leave the model empty, and press "Test connection". The game picks a suitable model.',
        'Your key is kept in this browser only. Never paste it anywhere else.',
        'Running a model on your own computer works too (Ollama, LM Studio, llama.cpp). See the README.',
      ],
    },
    'limits': {
      title: 'Free limits',
      intro: 'Free AI plans limit how much you can ask per minute or per day. A lesson uses about 40 to 50 requests, plus two after the quiz for the fact check and the explanation.',
      points: [
        '"AI requests today" in the ☰ menu counts what this browser sent.',
        'When a limit is reached, the game waits a moment and tries again, or switches to another model by itself.',
        'With a daily limit set in Settings, the bell rings early so the quiz always has enough requests.',
      ],
    },
    'errors': {
      title: 'When something goes wrong',
      intro: 'If the AI cannot answer, a red message appears with a "Retry" button. Nothing is lost: the same turn is sent again.',
      points: [
        '"Could not reach the AI address": check the address, or that your local model is running.',
        '"Rejected the key": the key is wrong or deleted.',
        '"Too many requests" or "overloaded": wait a minute.',
        '"A format the game cannot read": pick a stronger model.',
        'A lesson in progress is saved after every turn, even if the page closes.',
      ],
    },
    'realistic': {
      title: 'Realistic mode',
      intro: 'Tick "Realistic mode" in the ☰ menu to hide notebooks and goal counts. Like a real teacher, you only know what students understood by asking them.',
      points: [
        'Turn it off at any time to look again.',
      ],
    },
  },
};
