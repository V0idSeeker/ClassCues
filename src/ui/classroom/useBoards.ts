import { useEffect, useRef, useState } from 'react';
import { boardText } from '../../game/lesson';
import type { LessonState, Turn } from '../../game/types';
import { loadArt, saveArt } from '../../storage';
import { addPicture, pictureForStudents } from '../BoardArt';

/**
 * The teacher's boards: several, like slides, each with its text, an optional picture and a description of it.
 * Every change the class should see is sent with onTurn; the game decides whether it is new to them.
 */
export function useBoards(state: LessonState, canSeePictures: boolean, onTurn: (t: Turn) => void) {
  const [pages, setPages] = useState<string[]>(state.boardPages);
  const [pageNo, setPageNo] = useState(state.boardPage);
  const [caps, setCaps] = useState<string[]>(state.boardCaptions);
  const [art, setArt] = useState<(string | null)[]>(() => { const saved = loadArt(); return state.boardPages.map((_, i) => saved[i] ?? null); });
  const [wiped, setWiped] = useState<string | null>(null);
  const [drawing, setDrawing] = useState(false);
  const [chalk, setChalk] = useState('#f5f7f2');
  const boardRef = useRef<HTMLTextAreaElement>(null);

  // Each board's picture as the students' model gets it, made ready whenever a picture changes.
  const [seen, setSeen] = useState<(string | null)[]>([]);
  useEffect(() => {
    let current = true;
    void Promise.all(art.map(a => (a ? pictureForStudents(a).catch(() => null) : null))).then(list => { if (current) setSeen(list); });
    return () => { current = false; };
  }, [art]);

  const text = pages[pageNo] ?? '';
  const withText = (t: string) => pages.map((x, i) => (i === pageNo ? t : x));
  const keepArt = (next: (string | null)[]) => { setArt(next); saveArt(next); };
  const allText = (allPages = pages, allCaps = caps) => allPages.map((t, i) => boardText(t, allCaps[i])).join('\n');

  /** A turn with what the teacher says and the boards as they are now (or as given). */
  const turnWith = (say: string, allPages = pages, no = pageNo, allCaps = caps): Turn =>
    ({ say, board: allText(allPages, allCaps), pages: allPages, page: no, captions: allCaps, picture: canSeePictures ? seen[no] ?? null : null });

  /** Sends the boards if the class has not seen them like this yet (after typing on the board, or a description). */
  const sendIfChanged = () => { if (allText() !== state.board) onTurn(turnWith('')); };

  // Changing board shows the class another one. Text on a board the class has not seen yet is new to them.
  function show(no: number, allPages = pages, allCaps = caps) {
    setPages(allPages);
    setCaps(allCaps);
    setPageNo(no);
    setWiped(null);
    onTurn(turnWith('', allPages, no, allCaps));
  }

  return {
    pages, pageNo, text, caps, art, wiped, drawing, chalk, boardRef,
    /** Drawing is on and the model can see it. */
    drawingNow: drawing && canSeePictures,
    turnWith, sendIfChanged,
    setText: (t: string) => setPages(withText(t)),
    /** Adds a line to the board and sends it to the class. */
    write(line: string) {
      const next = text.trimEnd() ? `${text.trimEnd()}\n${line}` : line;
      setPages(withText(next));
      onTurn(turnWith('', withText(next)));
    },
    show,
    add() { keepArt([...art, null]); show(pages.length, [...pages, ''], [...caps, '']); },
    remove() {
      const others = <T,>(list: T[]) => list.filter((_, i) => i !== pageNo);
      keepArt(others(art));
      show(Math.max(0, pageNo - 1), others(pages), others(caps));
    },
    eraseSelected() {
      const el = boardRef.current;
      if (!el) return;
      el.setRangeText('');
      setPages(withText(el.value));
    },
    wipe() { setWiped(text); setPages(withText('')); },
    undoWipe() { if (wiped !== null) { setPages(withText(wiped)); setWiped(null); } },
    setDrawing, setChalk,
    setPicture: (picture: string | null) => keepArt(art.map((a, i) => (i === pageNo ? picture : a))),
    async addPictureFile(file: File | undefined) {
      if (!file) return;
      try {
        const picture = await addPicture(file, art[pageNo] ?? null);
        keepArt(art.map((a, i) => (i === pageNo ? picture : a)));
      } catch {
        // An unreadable file leaves the board as it was.
      }
    },
    setCaption: (c: string) => setCaps(caps.map((x, i) => (i === pageNo ? c : x))),
  };
}

export type Boards = ReturnType<typeof useBoards>;
