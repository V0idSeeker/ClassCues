# Design review of GAME_DESIGN.md

**Status: resolved** (round 1). Issues 1-19 applied to `GAME_DESIGN.md`; 20-21 declined. Changes from the proposals: hosting is Vercel (Issue 6); the quiz-request reserve applies on free models only (Issue 3); students come from a built-in pool, 30 in version 1 (Issue 12).

**Target:** `GAME_DESIGN.md` (full file, lines 1-655)
**Round:** 1 · **Reviewers:** design critic (completed), structural (completed) · **Standard:** feature-spec-standard

Totals after merging duplicates: 2 Blockers, 13 Majors, 12 Nits. Suggested: 21 fixes, 6 declined, 0 contested, 0 escalated.

Four proposed fixes contain a design decision that is yours to make. They are marked **DECISION**.

## Prioritized findings and suggestions

### [Issue 1] [`design_critic` B1 + `structural` B1] - Severity: Blocker
*   **Affected Scope:** [Lines 15-30](GAME_DESIGN.md#L15-L30) (§0.1 Decisions)
*   **Discrepancy Description:** §0.1 lists decisions with no rejected options and no reasons. Only the engine choice (§8) has a comparison. Missing for: own key vs hosted proxy, 10 students vs 4-5, one batched note-taker call vs one per student, browser speech vs local TTS, whole-chapter generation vs retrieval, React vs Svelte, code-computed report vs AI report writer.
*   **Rationale:** The standard fails a spec that proposes one path without documented rejected alternatives.
*   ***AI Suggestion:*** PROPOSE FIX
*   ***Justification:*** Valid. The alternatives were discussed while designing but never written down.
*   ***Proposed Edit:***
    *   Location: new §0.13 "Alternatives considered"
    *   Change: one table, one row per decision: chosen option, rejected option(s), reason. Reasons as discussed: hosted proxy rejected (owner pays for every lesson, needs a server and abuse protection); in-browser model rejected (2-4 GB download, needs a GPU, weak grading); Unity/Godot rejected (game is mostly text, PDF and typing, large download, weak on old laptops); 4-5 students rejected (class feels empty); per-student note-taker rejected (10× requests, breaks the free tier); local TTS rejected (install step); retrieval rejected (one chapter fits in context); AI report writer rejected (scores must be consistent and cost no requests); Svelte rejected (React has more ready help and examples; no technical need).

### [Issue 2] [`design_critic` B2 + `structural` M3] - Severity: Blocker — **DECISION**
*   **Affected Scope:** [Lines 45-53](GAME_DESIGN.md#L45-L53), [65-73](GAME_DESIGN.md#L65-L73), [106](GAME_DESIGN.md#L106)
*   **Discrepancy Description:** The classroom shows and scores on data no v1 call produces: (1) whether a note is correct; (2) which objective a note belongs to (the note-taker never receives the objective list); (3) whether a wrong belief has been corrected; (4) emotion for all ten students (only the one reacting student gets one); (5) "Call on" and "Ask the class" have no call type and no budget.
*   **Rationale:** Step 2 of the build cannot be implemented without inventing these. Giving the note-taker the reference text would break knowledge gating.
*   ***AI Suggestion:*** PROPOSE FIX
*   ***Justification:*** Valid, and the most important finding. Cheapest fix that keeps gating intact and adds no requests:
*   ***Proposed Edit:***
    *   Location: §0.5 and §0.3
    *   Change:
        - The note-taker receives the objective list (ids and texts only, never the reference text or answer keys) and each student's still-held wrong beliefs.
        - It returns, per student: `new_notes: [{ text, objective|null, distorted }]`, `beliefs_dropped: [id]`, and `emotion`. So all ten faces update every turn.
        - Lesson goals count students with at least one undistorted note on the objective. Label changes from "correct note" to "has it in their notes". v1 does not check whether the teacher's own statement was true (no fact-checker); wrong teaching shows up in the quiz.
        - A wrong belief shows as "not corrected yet" until the note-taker returns it in `beliefs_dropped`.
        - Add a sixth call type, **Student answer**, used by "Call on" and "Ask the class" (ask the class: code picks one student with a raised hand, or a random one). Budget about 4 per lesson; reactions drop from about 8 to about 6.

### [Issue 3] [`design_critic` M1 + `structural` N6] - Severity: Major — **DECISION**
*   **Affected Scope:** [Lines 67-79](GAME_DESIGN.md#L67-L79), [107](GAME_DESIGN.md#L107)
*   **Discrepancy Description:** "About 41 requests" leaves out retries, Test connection, Regenerate and student answers. Teacher turns are uncapped. The quiz needs 13 requests at the end; a player at 40 of 50 gets a failed quiz. Rate-limit errors are not handled. The clock has no stated effect. The table column sums to 42, not 41.
*   **Rationale:** "One free lesson per day" is the central promise of the free path and has 8-9 requests of margin.
*   ***AI Suggestion:*** PROPOSE FIX
*   ***Justification:*** Valid. The reviewer's idea of one batched quiz-taker call for all students is not adopted: mixing ten students in one answer call risks them copying each other and leaking.
*   ***Proposed Edit:***
    *   Location: §0.5, §0.9, §0.3
    *   Change:
        - A lesson ends after **20 teacher turns or 15 real minutes** (shown as the 45-minute class clock), whichever comes first. A turn counter is visible.
        - Code reserves the quiz requests (10 quiz + up to 3 grading). When the daily remainder reaches the reserve, the player is warned and the bell rings.
        - Quiz-taker calls run one at a time, with wait-and-retry on HTTP 429. Rate limit and quota errors get their own message, separate from invalid JSON.
        - Table: chapter generator moved out of the per-lesson column. New total: note-taker 20 + reactions 6 + student answers 4 + quiz 10 + grading 3 = about 43, leaving about 7 for retries.
        - "About 50 per day" marked as the limit at the time of writing; the daily limit is a setting.

### [Issue 4] [`design_critic` M2] - Severity: Major
*   **Affected Scope:** [Lines 77](GAME_DESIGN.md#L77), [94-98](GAME_DESIGN.md#L94-L98), [113](GAME_DESIGN.md#L113)
*   **Discrepancy Description:** Multiple-choice answers are graded by code, so they skip the only code-side leak check (`supported_by_notes`). A model that knows Python picks the right option. The leak test has no numeric pass mark.
*   **Rationale:** Programming is the subject models know best; half the quiz may bypass gating.
*   ***AI Suggestion:*** PROPOSE FIX
*   ***Justification:*** Valid and cheap to fix in code.
*   ***Proposed Edit:***
    *   Location: §0.7, §0.10
    *   Change: for a multiple-choice question, if the student has no note on that question's objective, code picks a random choice and the model is not asked. Test pass marks: empty lesson scores at most 10% on written questions and within chance (25% ± 10) on multiple choice; good lesson beats sloppy, and sloppy beats wrong, by at least 15 points each, averaged over 3 runs.

### [Issue 5] [`design_critic` M3] - Severity: Major
*   **Affected Scope:** [Lines 110-113](GAME_DESIGN.md#L110-L113)
*   **Discrepancy Description:** The four-lesson test needs about 170 requests, more than three days of free quota. Not stated: which model, where it runs, which key.
*   **Rationale:** The test is part of "done" and is meant to rerun after every prompt change.
*   ***AI Suggestion:*** PROPOSE FIX
*   ***Proposed Edit:***
    *   Location: §0.10
    *   Change: the scripted-lesson test runs from the command line (Node) against a local model or paid credits, never the free tier. The AI and game logic must not depend on the browser page so the script can reuse them. The reference models that define "playable" are picked in build step 1 and written into this section.

### [Issue 6] [`design_critic` M4] - Severity: Major — **DECISION**
*   **Affected Scope:** [Lines 19](GAME_DESIGN.md#L19), [86-88](GAME_DESIGN.md#L86-L88), [95](GAME_DESIGN.md#L95), [108](GAME_DESIGN.md#L108)
*   **Discrepancy Description:** The API key sits in browser storage. itch.io may serve games from an address shared with other games, which could let another game read the key (reviewer could not verify; neither have I). Imported level files and PDF text are untrusted but only generated output is validated, and only teacher speech is protected against prompt injection.
*   **Rationale:** The key is the only secret; a shared level could rig grading.
*   ***AI Suggestion:*** PROPOSE FIX
*   ***Proposed Edit:***
    *   Location: §0.1, §0.6, §0.7, §0.9
    *   Change:
        - Host v1 on GitHub Pages only. itch.io removed until its storage isolation is checked.
        - Settings gets "Remember key on this device" (off = key kept for this session only) and a line advising a spend limit on the key.
        - Imported level files pass the same validation as generated ones, plus length caps.
        - Chapter text and reference text go into prompts as quoted data, never as instructions, same as teacher speech.

### [Issue 7] [`design_critic` M5] - Severity: Major
*   **Affected Scope:** [Lines 19-20](GAME_DESIGN.md#L19-L20), [34](GAME_DESIGN.md#L34)
*   **Discrepancy Description:** "Runs from a link with a local model" is assumed. A hosted secure page calling a model on the player's own machine can be blocked by the browser or by the model server's default settings.
*   **Rationale:** The local path is what makes play unlimited.
*   ***AI Suggestion:*** PROPOSE FIX
*   ***Proposed Edit:***
    *   Location: §0.2 Settings, §0.12 step 1
    *   Change: build step 1 tests each preset (Ollama, LM Studio, llama.cpp) from the deployed page. Settings shows short setup steps per preset. "Test connection" says which problem it hit: blocked by browser or server settings, wrong key, or unknown model. Fallback documented: run the game from a downloaded copy on the same machine.

### [Issue 8] [`design_critic` M6] - Severity: Major
*   **Affected Scope:** [Lines 46](GAME_DESIGN.md#L46), [69](GAME_DESIGN.md#L69), [107](GAME_DESIGN.md#L107)
*   **Discrepancy Description:** Not defined: when a direct board edit becomes visible to students; how students avoid re-copying the whole board every turn; what happens when the player sends a new turn while the previous note-taker call is still running.
*   **Rationale:** These decide notebook contents, which drive every score.
*   ***AI Suggestion:*** PROPOSE FIX
*   ***Proposed Edit:***
    *   Location: §0.3, §0.5
    *   Change: a turn is one press of "Say it" or "Write it on the board". Direct board edits are sent with the next turn, or on their own when the player clicks away from the board. The note-taker gets what was added to the board since the last turn (plus the full board for context), and code drops duplicate notes. One note-taker call runs at a time; the player can keep typing, and turns sent meanwhile are combined into the next call.

### [Issue 9] [`design_critic` M7] - Severity: Major
*   **Affected Scope:** [Lines 72](GAME_DESIGN.md#L72), [90](GAME_DESIGN.md#L90)
*   **Discrepancy Description:** "One chapter fits in the model's context" is not true for every small local model; some cut long input silently. The all-students grading call has the same exposure.
*   **Rationale:** Silent cutting gives a plausible but incomplete level or grade that validation would not catch.
*   ***AI Suggestion:*** PROPOSE FIX
*   ***Proposed Edit:***
    *   Location: §0.6, §0.2 Settings
    *   Change: Settings has "model context size" (filled by preset). Before a generator or grading call, code estimates the size (characters ÷ 3) and refuses with a clear message if it does not fit. Local presets use a lower chapter cap (12,000 characters). Minimum supported context: 8,000 tokens. If ten students do not fit in one grading call, it is split in two.

### [Issue 10] [`design_critic` M8 + `structural` M1, M4] - Severity: Major
*   **Affected Scope:** [Line 13](GAME_DESIGN.md#L13), [229-288](GAME_DESIGN.md#L229-L288), [433-567](GAME_DESIGN.md#L433-L567)
*   **Discrepancy Description:** "Section 0 wins where they disagree" does not say what applies where §0 is silent. Unclear for: the attention trait dropping notes, `attention_delta`, thinking-disable flags, conversation compaction, sentinel tokens, prerequisite objectives, clarity ratings, content guideline. §9 templates do not match v1: no chapter-generator template, grader is per student with no student id, no quoting of teacher speech.
*   **Rationale:** A new builder must guess which of about 500 later lines apply.
*   ***AI Suggestion:*** PROPOSE FIX
*   ***Proposed Edit:***
    *   Location: new §0.14 "What applies from later sections", new §0.15 "Version 1 call schemas"
    *   Change:
        - In v1: all of §4.2 (structured output, schema files, thinking off, role reminder, one job per call, short prompts, timeouts, logging); §9b.3 (student vs judge knowledge), §9b.4 (quoted speech), §9b.7 (opening lines), §9b.12 (send summary + last 8-10 lines), §9b.13 (rate gates); the attention trait (code drops notes for low-attention students); the content guideline in every student prompt.
        - Not in v1: `attention_delta`, sentinel tokens, prerequisite objectives, clarity ratings, side challenges, hidden roles, boss review, anything else in §9b.
        - §0.15 gives the exact output schema for each of the six v1 calls, including a grader that takes one question and returns results keyed by student id. §9 is marked as the original starting point.

### [Issue 11] [`structural` M2] - Severity: Major
*   **Affected Scope:** [Lines 262-271](GAME_DESIGN.md#L262-L271), [281-286](GAME_DESIGN.md#L281-L286), [360-375](GAME_DESIGN.md#L360-L375), [387-393](GAME_DESIGN.md#L387-L393), [401](GAME_DESIGN.md#L401), [417](GAME_DESIGN.md#L417)
*   **Discrepancy Description:** Later sections contradict §0 without a marker: 8 call types vs 6, budget for 5 students, a second "MVP" screen list, 3-4 expressions vs 5, star ratings and A-F grade, storage.
*   **Rationale:** Two lists both claim to describe the first version.
*   ***AI Suggestion:*** PROPOSE FIX
*   ***Proposed Edit:***
    *   Location: top of §4.4, §4.6, §6.2, §7.1, §7.3, §8
    *   Change: one line each: "Long-term plan. Version 1 differs: see §0.x." §7.1 heading changed from "Screens (MVP)" to "Screens (long-term)".

### [Issue 12] [`design_critic` M9] - Severity: Major
*   **Affected Scope:** [Lines 61](GAME_DESIGN.md#L61), [85](GAME_DESIGN.md#L85), [338-349](GAME_DESIGN.md#L338-L349)
*   **Discrepancy Description:** Personas carry fixed wrong beliefs (the example is about photosynthesis), but v1 has Python and any imported subject. Nothing says how students get wrong beliefs for a new chapter.
*   **Rationale:** Prior beliefs feed every student prompt and so affect scores.
*   ***AI Suggestion:*** PROPOSE FIX
*   ***Proposed Edit:***
    *   Location: §0.4
    *   Change: personas hold no subject-specific beliefs. At lesson start, code hands out the chapter's `common_misconceptions`: the misconception carrier gets two, the struggling student one, and two other students picked at random get one each.

### [Issue 13] [`structural` M7 + `design_critic` M9] - Severity: Major
*   **Affected Scope:** [Lines 623-633](GAME_DESIGN.md#L623-L633) (§12 Risks)
*   **Discrepancy Description:** The risk table predates §0. No rows for: ten-student JSON failure, local-model connection blocks, PDF limits and bad generated quizzes, running out of quota mid-lesson, voice availability by browser, untrusted imported levels, browser clearing saved data, player typing inappropriate content to child characters.
*   **Rationale:** The standard requires the spec to name its own failure modes.
*   ***AI Suggestion:*** PROPOSE FIX
*   ***Proposed Edit:***
    *   Location: §12
    *   Change: add one row per risk above, each pointing to its mitigation in §0 (most come from Issues 3, 6, 7, 9).

### [Issue 14] [`structural` M6] - Severity: Major
*   **Affected Scope:** [Lines 98](GAME_DESIGN.md#L98), [117](GAME_DESIGN.md#L117), [146-149](GAME_DESIGN.md#L146-L149)
*   **Discrepancy Description:** No statement of the v1 goal. "Definition of done" is referenced but has no section. Two "not in first version" lists (§0.11, §1.4) do not point to each other.
*   ***AI Suggestion:*** PROPOSE FIX
*   ***Proposed Edit:***
    *   Location: top of §0, §0.10, §0.11
    *   Change: add a two-sentence v1 goal; add "Definition of done" (a player can teach the built-in chapter and an imported PDF chapter end to end, and the scripted-lesson test passes its marks); §0.11 and §1.4 cross-reference each other.

### [Issue 15] [`structural` M8] - Severity: Major
*   **Affected Scope:** [Lines 63-108](GAME_DESIGN.md#L63-L108)
*   **Discrepancy Description:** No single place shows the v1 flow from teacher turn to score.
*   ***AI Suggestion:*** PROPOSE FIX
*   ***Proposed Edit:***
    *   Location: new diagram at the start of §0.5
    *   Change: one text diagram: teacher turn → note-taker (all students) → notebooks and faces → optional reaction or student answer → bell → quiz taker per student → code grades multiple choice, grader grades written → code computes report.

### [Issue 16] [`structural` M5] - Severity: Major
*   **Affected Scope:** [Lines 130-133](GAME_DESIGN.md#L130-L133)
*   **Discrepancy Description:** §1.1 says what the game offers, not the problem it solves. (The design critic judged this requirement met; reviewers disagree.)
*   ***AI Suggestion:*** PROPOSE FIX
*   ***Justification:*** Two sentences settle it.
*   ***Proposed Edit:***
    *   Location: §1.1
    *   Change: add: "Teaching a topic is one of the best ways to learn it, but most people never get a class to teach, and practising on real students is costly. This game gives anyone a free class that reacts honestly to how well they explain."

### [Issue 17] [`design_critic` N1] - Severity: Nit — **DECISION**
*   **Affected Scope:** [Lines 57](GAME_DESIGN.md#L57), [643](GAME_DESIGN.md#L643)
*   **Discrepancy Description:** "Only the pictures change" understates the art: blinking, the waving arm and the moving mouth are all drawn by code in the mockup. Who makes the art is still open, yet build step 3 depends on it.
*   ***AI Suggestion:*** PROPOSE FIX
*   ***Proposed Edit:***
    *   Location: §0.3, §13
    *   Change: v1 ships with the code-drawn characters from the mockup. Illustrated characters come after v1. The art question leaves the v1 path.

### [Issue 18] [`design_critic` N2, N3, N5 + `structural` N5, N8] - Severity: Nit
*   **Affected Scope:** [Lines 30](GAME_DESIGN.md#L30), [50](GAME_DESIGN.md#L50), [57](GAME_DESIGN.md#L57), [84](GAME_DESIGN.md#L84), [88](GAME_DESIGN.md#L88), [428](GAME_DESIGN.md#L428)
*   **Discrepancy Description:** Wrong mockup path; "Hear it" button missing from §0.3; realistic mode hides notebooks but the goal counters reveal the same thing; privacy wording softer than the facts; layout says this file lives in `/docs`.
*   ***AI Suggestion:*** PROPOSE FIX
*   ***Proposed Edit:***
    *   Change: path becomes `docs/mockups/classroom-scene.html`; add "hear it" to the dialogue box buttons; realistic mode also hides goal counters; state plainly that chapter text is sent to the player's chosen AI provider, that exported levels contain text derived from the PDF, and that some browser voices send text to an online service; fix the layout line.

### [Issue 19] [`design_critic` N4 + `structural` N3, N4] - Severity: Nit
*   **Affected Scope:** [Lines 88](GAME_DESIGN.md#L88), [338-350](GAME_DESIGN.md#L338-L350), [648-655](GAME_DESIGN.md#L648-L655)
*   **Discrepancy Description:** Level files have no format version; persona example lacks opening lines; glossary lacks Level, Persona, Board.
*   ***AI Suggestion:*** PROPOSE FIX
*   ***Proposed Edit:***
    *   Change: level JSON gets `"format": 1`; persona example gets `openingLines`; three glossary entries added.

### [Issue 20] [`structural` N1, N2, N7] - Severity: Nit
*   **Discrepancy Description:** Section "9b" breaks numbering; §0 points forward to later sections; mixed blank-line and code-fence formatting.
*   ***AI Suggestion:*** DECLINE
*   ***Justification:*** Cosmetic. Renumbering would break every cross-reference for no reader benefit.

### [Issue 21] [`design_critic` N4 (rest), N5 (request counter), `structural` N8 (mockup undo)] - Severity: Nit
*   **Discrepancy Description:** No size cap on the debug log; browsers may clear saved data; the request counter is a local count; the mockup lacks the undo that the doc requires.
*   ***AI Suggestion:*** DECLINE
*   ***Justification:*** Log cap and counter accuracy are implementation details for the plan. Data clearing is covered by the new risk row (Issue 13). The mockup is not the target and will be replaced by the real game.
