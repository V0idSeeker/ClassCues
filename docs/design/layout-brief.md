# No-Scroll Classroom Layout

* **Author:** V0idSeeker
* **Date:** 2026-11-15
* **Status:** final. Option A chosen by the author, with the always-visible Goals counter and the mark on Notebook. Built on branch layout-a.

## Overview

The classroom screen is where the player spends the whole lesson. Today it is three columns (student card and notebook on the left, the drawn class with the board, buttons, typing box and conversation in the middle, lesson goals on the right) and nothing limits its height. On a 1280×720 laptop the conversation and often the typing box sit below the bottom of the window, so the player scrolls on every turn. On a phone the drawn class also scrolls sideways.

The goal: the classroom fits with no page scrolling in a 1280×720 browser window (about 1280×600 of usable page) and on a phone held upright (about 390×750, with the on-screen keyboard covering the bottom part while typing). While typing a turn the player always sees the class, the board, the last few lines of conversation and the typing box. The notebook, lesson goals and the board and picture tools open with one tap or click.

This brief covers layout and interaction only. Colours and styling wait for the player's visual identity.

## Analysis

Seven reviewers looked at the code and the design (all completed). Full findings: `layout-options.md`.

### Why it scrolls today

- Nothing caps the height. The middle column needs about 830 pixels; the window has about 600. The footer adds another 35.
- The drawing is 1200 wide by 850 tall. Across the width of the middle column it is already taller than the whole window can spare.
- The top bar holds eleven controls and wraps to two or three rows.
- Things that appear and disappear (the tip, the error and Retry, "Students are thinking…", the picture description, chalk colours, Undo wipe) each push the typing box further down.
- On phones, `.stage-in` has a minimum width of 520 pixels, so the class always scrolls sideways at 390 wide.

### The core tension

The drawn class and the board need height; the conversation and typing box need height too; a 720p window gives about 600. Stacking them can never fit. The inventive review named the way out: a 1280×600 window is *wide*, not tall. The width left over beside a drawing scaled to the full height (about 470 to 515 pixels) is the right size for the conversation and the typing box. So put them side by side instead of on top of each other.

### Risks raised

- **The phone keyboard.** Android Chrome shrinks the page for the keyboard only if the page asks for it (one setting in `index.html`). iPhone Safari ignores that setting and slides the page up instead, and it zooms into any typing box with text smaller than 16 pixels (ours are 15). A short script that follows the visible height is needed for iPhones.
- **Board text on a phone.** The chalk text scales with the drawing; at 390 wide it would be about 10 pixels, too small. It needs a minimum size, and tapping the board should open the large board view.
- **Hidden things get ignored.** Once the notebook and goals are behind buttons, players may stop checking them. An always-visible "Goals 2/5" chip and a mark on the Notebook button keep them in sight.
- **The board position is written twice**, once in the drawing code and once as percentages in the styles. Any change to the drawing would misplace the board text. It should come from one place.
- **"No scrolling" needs a check that can fail.** Measure the page at 1280×600, 390×750 and 390×450 (keyboard open) and confirm the class, at least three conversation lines and the typing box are inside the window. Then try once on a real iPhone and a real Android phone.
- **Installed copies of the game** may mix old styles with the new page for one launch after the update; they correct themselves on the next start.

### One claim checked and corrected

A reviewer read that changing boards costs a turn. It does not: the change is sent to the game, but the game adds no turn and makes no AI request when nothing new appears on the board (this has a test). The only real gap: switching to a board the class has not seen yet counts as new material, which is intended.

## Goals vs. Non-Goals

* **In-Scope Goals:**
  * No page scrolling, up/down or sideways, at 1280×600 and at 390×750.
  * With the phone keyboard open (about 390×450 visible): the class, two or three conversation lines and the typing box stay visible.
  * Every current feature stays reachable in one tap or click.
  * The conversation box scrolls inside itself; the page never does.
  * Board text never smaller than 14 pixels.
* **Out-of-Scope Non-Goals:**
  * Colours, fonts and decoration (waiting for the visual identity).
  * Redrawing the classroom picture.
  * Other screens (menu, lessons, settings, report). They are lists and scrolling them is normal.
  * Tablets and landscape phones get whichever of the two layouts their width fits; no special third layout.

## Alternatives Weighed

* **B. Three columns capped to the screen, conversation and typing box in a strip along the bottom.** Smallest change and keeps the notebook and goals always visible on a computer. Rejected: the drawing shrinks by about a quarter (board text about 13 pixels), there is no spare room at all at 600 pixels tall, it needs a separate phone layout anyway, and it gets cramped at 1000 to 1100 pixels wide.
* **C. Board as its own panel above a cropped strip of students.** Best board readability, fits under a phone keyboard everywhere. Rejected for now: it drops the "room seen from the teacher's desk" picture the game is built around, and needs the classroom redrawn. Kept as the fallback for phones only, if the board is still unreadable on a real phone.
* **Full-screen class with floating panels over it.** Rejected by every reviewer who looked at it: panels cover the front-row students, readability depends on colours not chosen yet, and it is harder to use with a keyboard or screen reader. Can come back with the visual identity.
* **Cropping the drawing.** Rejected: students and the board fill almost the whole picture height; cropping saves little.
* **A separate "History" panel for the full conversation.** Rejected: the conversation box already scrolls inside itself and jumps to the newest line.

## Key Decisions & Staging for Next Steps

### Recommended layout: A, class on the left, a rail of turn controls on the right

**Computer, 1280×600:**

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ Variables · 12:30/45 · Turn 4/20 · Class mood: calm ?   Goals 2/5  Help  ☰  🔔 │ 40
├───────────────────────────────────────────┬──────────────────────────────────┤
│                                           │ Students: ✋Leo  ?Maya  …         │ 60
│                                           ├──────────────────────────────────┤
│            Drawn class + board            │ Conversation (scrolls inside)     │
│            about 780 × 552                │ 6–12 lines                        │ 250+
│            board text about 18 px         │                                  │
│                                           ├──────────────────────────────────┤
│                                           │ [ type what you say…           ] │
│                                           │ Say it · Write on board          │
│                                           │ Call on · Ask the class · Hear   │ 120
│                                           ├──────────────────────────────────┤
│ ◀ Board 1/2 ▶  New  Erase  Wipe  Draw     │ Notebook · Goals · Tools          │ 40
└───────────────────────────────────────────┴──────────────────────────────────┘
```

* The top bar is one row. Lessons, Settings, Main menu, Voices and Realistic mode move into the ☰ menu.
* Notebook, Goals and Tools open as a panel over the student strip and conversation part of the rail. They never cover the drawing or the typing box. One panel open at a time.
* "Call on", "Ask the class" and "Hear it" move under the typing box, next to the text they use.
* Tips, errors and "Students are thinking…" appear in fixed places (a line over the conversation, or a small toast) so they never push the typing box.

**Phone, 390×750, upright:**

```
┌───────────────────────────┐
│ Turn 4/20 · calm · ☰  🔔   │ 40
├───────────────────────────┤
│   Drawn class + board      │ 276   (tap the board: large board view)
├───────────────────────────┤
│ ✋Leo  ?Maya  …            │ 44
├───────────────────────────┤
│ Conversation (scrolls)     │ flexible
├───────────────────────────┤
│ [ type…        ] Say it ▸ │ 56–96
├───────────────────────────┤
│ Notebook · Goals · Board   │ 48
└───────────────────────────┘
```

* With the keyboard open, the student strip and the bottom bar hide; the class, two or three lines and the typing box remain (about 400 to 430 pixels).
* Panels slide up from the bottom over the conversation, never over the typing box.

### Defaults chosen for the open questions (change any of them)

1. **Full history:** the conversation box scrolls inside itself; no separate History panel.
2. **Board on phone:** minimum 14-pixel text, and tapping the board opens the large board view. Option C only if that is still unreadable on a real phone.
3. **iPhone keyboard script:** add it now; it is about 15 lines.
4. **Size measured** in normal pixels at 100% zoom. 125% Windows scaling (about 1024×480) is checked but allowed to scroll inside the conversation box only.
5. **Landscape phones and tablets:** use the computer layout when the window is at least 900 wide, the phone layout otherwise.
6. **Changing boards** stays free (it already is).

### Build order

1. Styles only: lock the screen height, remove the fixed minimum widths and heights, minimum board text size, hide the footer in class. Likely fixes most of the computer scrolling alone.
2. Board position from one place, shared by the drawing and the styles.
3. One-row top bar with the ☰ menu; tips and errors in fixed places.
4. The rail: student strip, conversation, typing box with all actions, Notebook / Goals / Tools panels, Goals chip.
5. Board tools into the bottom bar or Tools panel; the board view on phones for drawing.
6. Phone keyboard handling.
7. Split the classroom screen into smaller parts (it is one 330-line file today).
8. Automated no-scroll checks at the three sizes; one test each on a real iPhone and Android phone.
9. Update section 0.3 of `GAME_DESIGN.md`, the tips that mention the "left card", and the README.
