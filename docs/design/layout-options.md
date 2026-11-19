# Layout options: no-scroll classroom

**Concept:** The classroom screen fits with no page scroll at 1280x600 (desktop) and 390x750 (phone held upright, with about 450px visible when the keyboard is open). While typing, the player sees the scene, the board text, the last few lines of conversation and the typing box. Everything else opens with one tap.

**Mode:** BRAINSTORM

**Files reviewed:**
- `src/ui/Classroom.tsx`
- `src/ui/styles.css`
- `src/ui/scene.ts`
- `src/ui/BoardArt.tsx`
- `GAME_DESIGN.md` §0.3
- `docs/mockups/classroom-scene.html`
- Some reviewers also read `index.html` and `src/App.tsx`.

## Review angles

Seven review angles: design, codebase details, simplicity and scope, a first-time player, implementation readiness, structure, and inventive alternatives.

All seven reviewers recommended **Option A (stage + right rail)**.

---

## Key Findings (deduplicated)

### 🔴 Blockers

#### 1. The phone always scrolls sideways
- **Reported by:** all 7 reviewers
- **Where:** `styles.css:24-25`
- **Problem:** `.stage-in { min-width: 520px }` together with `.stage { overflow-x: auto }` forces horizontal scroll at 390px wide. This fails the phone goal by itself.
- **Fix:** Remove the min-width. Size the stage by height and width with `aspect-ratio: 1200/850`. One way to do it (implementation-readiness):
  - Give the stage cell `container-type: size`.
  - Set `.stage-in` to `width: min(100cqw, 100cqh*1200/850)`.

#### 2. Nothing limits the page height
- **Reported by:** all 7 reviewers
- **Where:**
  - `styles.css:13`: `.page` has no height limit.
  - `styles.css:20`: `.play` uses `align-items: start`.
  - `.log` uses `max-height: 160px`.
  - `.stage svg` uses `height: auto`.
- **Problem:** At 1280 wide, the middle column alone needs about 830px against 600px available.
- **Fix:**
  - Make the root `height: var(--app-h, 100dvh); overflow: hidden`, with grid rows `auto minmax(0,1fr)`.
  - Every region that can grow (log, notebook, goals, board text) gets `min-height: 0; overflow: auto` inside a fixed slot.
  - The App footer also renders under the classroom (`App.tsx:246`, about 35px). Hide it on this screen.

#### 3. The phone keyboard
- **Reported by:** all 7 reviewers
- **Where:** `index.html:5`, which has a plain viewport meta tag.
- **Android Chrome:** shrinks the layout only if the meta tag includes `interactive-widget=resizes-content`.
- **iOS Safari:** ignores that setting. It pans the visual viewport to the focused field instead.
- **iOS zoom:** inputs are 15px today (`styles.css:3,10`). iOS zooms in on focus for any input under 16px, which also breaks zero scroll.
- **Fix:**
  - Add the meta setting.
  - Use 16px or larger text in inputs on touch screens.
  - Add a roughly 10-line `visualViewport` listener that sets `--app-h` (and calls `scrollTo(0,0)`).
- **Disagreement:**
  - Zoom-out: defer the JS listener until a test on a real iPhone shows the input hidden.
  - Design, structural, implementation-readiness and catalyst: add it from the start.
- **Note:** iOS behaviour can be approached but not guaranteed. Make it a test case on a real device.

### 🟡 Major

#### 4. The top bar wraps to 2-3 rows (about 80-110px)
- **Reported by:** all 7 reviewers
- **Where:** `Classroom.tsx:185-198`, about 11-13 controls.
- **Fix:** One row of 36-40px.
  - **Stays visible:** title, clock, turn, mood (with its ?), Ring the bell.
  - **Moves into a ☰ Menu popover:** AI requests, Voices, Realistic mode, Help, Lessons/PDF, Settings, Main menu.

#### 5. Elements that appear and disappear push the typing box off screen
- **Reported by:** all 7 reviewers
- **The elements:**
  - tip banner (`Classroom.tsx:200-207`), which shows in the very first lesson
  - error and Retry (304)
  - "Students are thinking…" (303)
  - picture caption input (288-294)
  - chalk swatches (280)
  - Undo wipe (273)
  - Remove board
  - the "drawing is off" notice
- **Fix:** each one gets a reserved slot or floats over the layout:
  - the tip becomes a toast;
  - busy and error share one line inside the typing box;
  - the caption and swatches live inside the board tools panel.

#### 6. Board text is unreadable on a phone
- **Reported by:** all 7 reviewers
- **Where:** `styles.css:56`. The font is `2.5cqw`: about 19px on a 760px-wide scene, but about 9.75px at 390px. Desk name plates are about 5-7px.
- **Fix options:**
  - a font floor, `clamp(12-13px, 2.5cqw, 22px)` (the board textarea already scrolls inside itself);
  - tap the board to open Board view;
  - a board-only crop while typing;
  - split the board out of the scene (Option C).
- **Decision needed.**

#### 7. The board position is hard-coded twice
- **Reported by:** structural, codebase, catalyst, comprehension, implementation-readiness
- **Where:**
  - the board rect is `220,38,760,392` in `scene.ts:102-103`;
  - CSS repeats it as percentages: `.wall-board` 19.8/5.6/60.4/43.8% and `.stage-in .art` 18.33/4.47/63.33/46.12% (`styles.css:46,56`). `.menu-title` (92) shares the scene too.
- **Problem:** any viewBox crop, or the player's coming art pass, silently misplaces the board text and the drawing layer.
- **Fix:** export the rect from `scene.ts` and set the overlay position from it with CSS variables.

#### 8. Cropping the scene barely helps
- **Reported by:** catalyst, codebase, design
- **Where:**
  - Students span x 76-1124 (`scene.ts:108-109`).
  - The board spans y 24-444.
  - Back-row hands reach about y 455-465; front-row desks end at y 844 (`scene.ts:119`).
- **Problem:** there is almost no empty height to cut. Trimming the sides gains about 10% and makes the scene taller per unit of width, the wrong direction. Cropping only pays off if the board leaves the SVG (Option C).

#### 9. Board view does not fit either size
- **Reported by:** all 7 reviewers
- **Where:** `.bigboard .chalk { min-height: 420px; font-size: 28px }` (`styles.css:58`), plus the 10-head `.strip`, which wraps to 2-3 rows at 390.
- **Fix:**
  - the board takes `1fr` of the height;
  - the student strip is one row (heads about 34px on phone, or a row that scrolls sideways).
- **Related:**
  - The drawing canvas is 760x392 (ratio 1.94) and gets stretched, so the board container should keep that ratio.
  - On phone, the in-scene board is about 236-250px wide, too small to draw on. Turning on Draw on a phone should switch to Board view.
  - Drawing tools must not be a modal that covers the board.

#### 10. Moving tools into popovers can cost AI requests
- **Reported by:** design, codebase
- **Where:** a board edit is sent as a turn when the board loses focus (`Classroom.tsx:179`).
- **Problem:** every tap from the board into a tools popover blurs the board and can send an extra turn.
- **Fix:**
  - Send on blur only when `relatedTarget` is outside the board, the toolbar and the popover.
  - Never unmount the board textarea while it has focus, or the blur never fires.
- **Also confirm:** `showBoard` calls `onTurn` (`Classroom.tsx:117`), but §0.3 says changing board does not use a turn. Previous/next board will be one tap away and used more.

#### 11. "Call on" and "Ask the class" use the typed text but sit on the student card
- **Reported by:** comprehension, codebase
- **Where:** `Classroom.tsx:160-163, 225`
- **Fix:**
  - Put one action row under the typing box: Say it, Write it on the board, Call on <name>, Ask the class.
  - Keep a compact selected-student strip (portrait, name, chips, their line on one line, Next hand, Hear it) visible while typing.

#### 12. Hidden panels will go unopened
- **Reported by:** comprehension
- **Problem:** the goals panel is the only progress feedback.
- **Fix:**
  - an always-visible "Goals 2/5" chip or pips that opens the panel;
  - a badge on Notebook (new note, wrong belief).

#### 13. Panel state
- **Reported by:** structural, zoom-out, codebase
- **Fix:**
  - One value: `open: 'student'|'goals'|'log'|'tools'|null`.
  - Use the native `popover` attribute or `<dialog>`. They give Esc, light-dismiss and the top layer with no library. The existing `.codex` overlay (`styles.css:105`) is the modal pattern.
  - Do not save which panel is open.
  - Do not add a store or context.
- **Keep together:** the card and the notebook stay in one panel, because §0.3 promises they always show the same student.

#### 14. A separate "full history" panel may not be needed
- **Reported by:** zoom-out, comprehension, codebase
- **Reasoning:** scrolling inside a box is not page scroll. The log already auto-scrolls to the newest line (`Classroom.tsx:72`). A log sized to the space left over is both "the last few lines" and the full history.
- **Decision needed:** does scrolling inside the log count as reaching the history? If yes, skip the History panel.
- **Definition needed:** count "last few lines" as messages, with at least 3 visible.

#### 15. Keep the keyboard on screen when opening panels
- **Reported by:** comprehension
- **Problem:** on phone, tapping a panel button takes focus from the typing box and closes the keyboard.
- **Fix:**
  - Panels open in place of the conversation area, never over the typing box.
  - Closing a panel puts focus back in the typing box.

#### 16. Spec drift
- **Reported by:** structural, codebase, implementation-readiness, comprehension
- **Where:** `GAME_DESIGN.md:80-85` (§0.3, "Around the stage": left card and notebook, right goals, input under the stage) and the mockup both describe the old layout.
- **Fix:** rewrite §0.3 in the same change as:
  - **Always visible:** top bar, stage with board, recent lines, typing box, student strip.
  - **One tap:** Student (card and notebook), Goals, Conversation, Board tools.
  - **Sizes:** a paragraph on the target sizes and on keyboard behaviour.
- **Mockup:** mark it superseded.
- **Not checked:** §7.1 may need a matching edit.

#### 17. PWA cache
- **Reported by:** implementation-readiness
- **Problem:** an installed app can keep old CSS alongside new HTML.
- **Fix:** confirm asset names are hashed and the service worker updates on the next load.

#### 18. Defining and testing "zero scroll"
- **Reported by:** implementation-readiness, structural, comprehension
- **Definition:** `scrollHeight <= innerHeight` and `scrollWidth <= innerWidth`, measured in CSS px at 100% zoom.
- **Bounding-box checks are also needed,** because `overflow: hidden` passes the definition by hiding content. The scene, the board, at least 3 log lines, the typing box and Say it must all sit inside the viewport.
- **Test conditions:**
  - viewports 1280x600, 390x750 and 390x450;
  - 0 and 60 log lines, and very long lines;
  - with the tip, an error and a caption all showing.
- **Tooling:** none exists (vitest only). Either add `@playwright/test` or use a manual checklist. Plus one real check on iPhone Safari and one on Android Chrome.
- **Note:** 1280x720 at 125% Windows scaling is about 1024x480 CSS px. State the target.

### 🟢 Nits
- **Tap targets in the phone scene:**
  - Scale is about 0.325.
  - Back-row students are about 33x48-55px, under 44px.
  - Keep "Next raised hand" and Board view's `.mini` strip as the fallbacks.
  - A mistap on a student with a raised hand spends an AI request (`pick`, line 146).
- **Out-of-scope sizes:** landscape phone (about 740x390) and tablets at 900-1000px need an explicit "supported" or "out of scope". The `@media (max-width:1000px)` rule (`styles.css:122`) gets replaced.
- **Accessibility:**
  - `aria-expanded` on panel buttons;
  - return focus when a panel closes;
  - `aria-live="polite"` on the recent lines.
- **Long content:** long objectives and chapter titles truncate with an ellipsis or scroll inside their panel.
- **Optional:** a `data-layout` attribute on the root, to help read players' screenshots.

---

## Feature Inventory (every item needs a home)

Sourced from `Classroom.tsx:185-327`.

- **Top bar:**
  - title
  - clock
  - turn
  - mood and its ?
  - AI requests
  - Voices
  - Realistic mode
  - Help
  - Lessons/PDF
  - Settings
  - Main menu
  - Ring the bell
- **Tip:**
  - text
  - Tell me more
  - Got it
  - Turn tips off
- **Student card:**
  - ?
  - portrait
  - name
  - chips
  - pending line
  - Next raised hand
  - Hear it
  - Call on
  - Ask the class
- **Notebook:**
  - ?
  - notes
  - bent notes
  - wrong beliefs
  - memory lines
  - realistic-mode notice
- **Stage:**
  - Class view: SVG with click and keyboard picking, wall-board textarea, canvas
  - Board view: big board and student strip
- **Board row:**
  - Go to the board / Back to the class
  - ◀ and ▶
  - Board n of m
  - New (up to 12)
  - Remove (shown when more than one board)
  - Erase selected words
  - Wipe
  - Undo wipe
- **Picture row:**
  - the "drawing is off" notice
  - Draw
  - 4 swatches
  - Add picture
  - Clear picture
  - caption
- **Typing box:**
  - textarea (Enter sends, Shift+Enter adds a line)
  - Say it
  - Write it on the board
  - "Students are thinking…"
  - error and Retry
- **Log:** auto-scrolls to the newest line.
- **Goals:**
  - ?
  - objectives
  - counts and pips (shown as ? in realistic mode)

---

## Layout Options

### Shared by all options
- Top bar is one row of 36-40px. The ☰ Menu holds the rarely used controls.
- The tip is a floating toast.
- The scene keeps its 1200:850 ratio and has no min-width.
- The root is height-locked to `--app-h` / `100dvh`.
- Only the inner panels scroll.

### Option A: Stage + right rail (recommended by all 7)

**Desktop 1280x600** (8px padding and gaps)

| Region | Size |
| --- | --- |
| Top bar | 40 |
| Stage, left | about 536-552 tall x 757-780 wide; board text about 17-19px |
| Board toolbar under or on the stage (optional) | 36: Go to the board, ◀ n/m ▶, Board tools ▾ |
| Right rail | about 470-515 wide |
| - selected-student strip | 60-96: portrait 48-64, name, chips, one-line pending line, Next hand, Hear it |
| - recent lines (log) | `1fr`, about 230-300, 6-12 lines, kept scrolled to the newest |
| - typing box | 100-120: textarea about 60, action row with Say it, Write on board, Call on X, Ask class; busy and error share this row |
| - tab row | 36-40: Student/Notebook (badge), Goals n/m, Board tools, (Conversation) |

- Panels open over the rail's student and log area only. The scene and the typing box are never covered, so drawing still works while tools are open.
- Board view swaps into the stage box: the board fills the space, and one row of 10 heads at about 70px sits under it.

**Phone 390x750**

| Region | Keyboard closed | Keyboard open (about 450 visible) |
| --- | --- | --- |
| Top bar | 40 | 36-40, or hidden |
| Scene | 390x276 | 276, or a board crop of about 150-208 |
| Board toolbar / tab bar | 40-52 | hidden |
| Student strip | 44-56 | hidden |
| Recent lines | `1fr`, about 60-260 | about 48-110 (2-3 lines) |
| Typing box | 56-96 | 56-96 |
| **Total** | about 610-750 | about 400-430 |

- Panels are bottom sheets of about 70% height, opening over the log, never over the input.
- Board text needs the font floor. Tap the board to open Board view. Draw switches to Board view on phone.

**Pros:**
- Largest scene and board at the most-used size.
- The only option with spare room at 1280x600.
- One DOM and one model at both sizes: the rail stacks under the scene on phone.
- Keeps the §0.3 single-room picture.
- Input-under-feed is the familiar messaging pattern.
- Reuses `.log` and its auto-scroll, the popover/`.codex` overlay, Board view and the `.mini` strip.

**Cons:**
- Notebook and goals are no longer always visible on desktop. The Goals chip and Notebook badge mitigate this.
- Tips and the guide that point at the "left card" need new wording.
- The phone log is tight while typing (2-3 lines).

### Option B: Three columns capped to the screen height, plus a bottom dock (smallest change from today)

**Desktop 1280x600**

| Region | Size |
| --- | --- |
| Top bar | 36-40 |
| Upper band | about 370-456 tall |
| - left column | 250-350 wide: card and notebook, notebook scrolls inside |
| - scene, middle | about 520-644 wide x 370-456 tall; board text about 13-16px |
| - right column | 260-350 wide: goals (or the log) |
| Bottom dock, full width | 120-164: recent lines (about 4-5) on the left 60%, typing box and actions on the right 40% |

- Board tools are a popover above the stage.
- The phone falls back to Option A's phone layout.

**Variant (catalyst):** in the middle column, the speaker's latest line shows as a speech bubble and the teacher's line as a subtitle. This removes the log strip.

**Pros:**
- Closest to §0.3 and to the current way the screen reads.
- Notebook and goals stay visible on desktop, more than the requirement asks.
- Mostly a CSS change on desktop.

**Cons:**
- Scene and board are about 25-30% smaller, with board text about 13px.
- No slack at 600px: an error, a caption or a tip overflows.
- The side columns get squeezed at 1000-1100px.
- Two layouts to maintain (columns on desktop, tabs on phone).
- The bubble variant needs placement and clamping code, and covers students.

### Option C: Board as its own HTML panel, plus a cropped strip of students

**Desktop 1280x600**

| Region | Size |
| --- | --- |
| Top bar | 40 |
| Left: board panel | about 640-760 x 300-330 (keeps the 1.94 canvas ratio); text about 16-24px |
| Left: students SVG, `viewBox="0 450 1200 400"` (about 3:1) | about 640-760 x 150-253 |
| Right rail | as in Option A |

**Phone 390x750** (keyboard closed / open)
- Board: 390x170-200 closed, about 120-180 open.
- Students: 390x130; tap targets about 70px.
- Recent lines: 48-60.
- Typing box: 56-90.
- Total about 400-470, and it fits under the keyboard on every platform.

**Pros:**
- Most readable board and largest tap targets.
- Board placement no longer depends on hard-coded percentages, and the drawing layer lines up for free.
- Reuses `board-wrap` and `boardBox('chalk')` from Board view.
- Board view becomes mostly unnecessary.

**Cons:**
- Breaks §0.3's "room seen from the teacher's position" and the Class/Board view idea.
- Drops the window, clock and poster.
- Needs new scene positions and touches the main menu scene.
- May clash with the player's coming art.
- It is a design change, so it needs the player's approval.

### Option considered and rejected: full-screen scene with overlays
Three reviewers (structural, zoom-out, implementation-readiness) explored it:
- the scene fills the area;
- the log becomes semi-transparent captions or bubbles over the floor (viewBox y 580-850);
- the typing bar sits over the bottom edge.

Every reviewer that explored it rejected it:
- It covers the front-row students and name plates, which are tap targets.
- Contrast depends on styling the player has not chosen yet.
- It is hardest to make accessible.
- On desktop, height limits the scene to about 760-790 wide anyway, so it ends up as Option A with overlays.
- Revisit it after the visual identity exists.

---

## Risks (all options)
1. iOS keyboard panning, which is partly out of our control. Test on real devices.
2. Elements that appear and disappear. Every one needs a slot or must float.
3. Board legibility at 390px.
4. Board view and drawing at 600px and on phone.
5. Hard-coded board percentages if the viewBox or the art changes.
6. Extra AI turns when the board loses focus to a panel.
7. Long lessons growing a panel instead of scrolling inside it.
8. PWA cache serving mixed versions.
9. Spec and mockup drift.

---

## Recommended Pick: Option A (all 7 reviewers agree)

**Reasons:**
- It moves the per-turn controls into the space the 1280x600 screen has spare, which is width, so it gains the most with the least new logic.
- Largest board on desktop (about 17-19px text).
- One layout model at both sizes.
- The typing box and the scene are never covered.
- It keeps §0.3's room picture.
- It reuses existing parts.

**Hard requirements that come with it:**
- Font floor on the board, 16px text in inputs.
- Goals chip and Notebook badge.
- One-row top bar with ☰ Menu.
- Tip as a toast; busy and error inside the typing row.
- Draw on phone opens Board view.
- `relatedTarget` guard on the board's blur.
- Viewport meta setting plus `--app-h`.
- Rewrite §0.3.

**Fallbacks:**
- If the board is still unreadable on a real phone, use Option C on phone only (below about 600px) and leave the desktop alone.
- Use Option B only if the player insists that notebook and goals stay visible on desktop.

**Suggested build order (merged from zoom-out, structural, design and implementation-readiness):**
1. CSS only:
   - height-lock the root;
   - remove `min-width:520px`, `min-height:420px` and `max-height:160px`;
   - add the font floor;
   - hide the footer.

   These alone probably fix most of the desktop scroll.
2. Export the board rect from `scene.ts`, and position the overlays from it.
3. Top bar into ☰ Menu; tip as a toast.
4. Right rail:
   - student strip;
   - log;
   - typing box with the merged action row;
   - tabs using `popover`/`<dialog>` with one `open` state value.
5. Board and picture tools into one panel or Board view, with the blur guard.
6. Keyboard: the meta setting, then `visualViewport` (now, or after the device test; see the disagreement in Finding 3).
7. Split `Classroom.tsx` into presentational parts, keeping state in Classroom:
   - `TopBar`
   - `Stage`
   - `BoardTools`
   - `SayBox`
   - `RecentLines`
   - `StudentPanel`
   - `GoalsPanel`
8. Zero-scroll check at 1280x600, 390x750 and 390x450, then real iPhone and Android tests.
9. Update `GAME_DESIGN.md` §0.3 and mark the mockup superseded.

**Decisions needed from the player:**
- Does scrolling inside the log count as the "full history"? If yes, there is no History panel.
- How should the board read on phone: font floor, tap to Board view, or the Option C split?
- Is the `visualViewport` JS added now or after the device test?
- Is the target 1280x600 in CSS px, or at 125% Windows scaling (about 1024x480)?
- Are landscape phone and tablet sizes in scope?
- Does `showBoard` send a turn when switching boards (`Classroom.tsx:117`), or does it follow §0.3's "no turn"?
