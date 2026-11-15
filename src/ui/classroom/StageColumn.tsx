import { useMemo, useState } from 'react';
import type { KeyboardEvent, MouseEvent } from 'react';
import type { Student } from '../../game/types';
import BoardArt from '../BoardArt';
import { SCENE_VIEWBOX, boardArea, portraitSvg, sceneSvg } from '../scene';
import type { Boards } from './useBoards';

interface Props {
  students: Student[];
  selected: string;
  talking: string | null;
  boards: Boards;
  canSeePictures: boolean;
  onPick(id: string): void;
}

const still = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
const CHALKS = [['#f5f7f2', 'White chalk'], ['#ffe08a', 'Yellow chalk'], ['#ff9aa8', 'Pink chalk'], ['#9fd4f5', 'Blue chalk']];

/** The drawn class with the board on its wall (or the big board view), and the board tools under it. */
export default function StageColumn({ students, selected, talking, boards: b, canSeePictures, onPick }: Props) {
  const [atBoard, setAtBoard] = useState(false);
  const scene = useMemo(() => sceneSvg(students, selected, talking, still), [students, selected, talking]);

  function pickFromScene(e: MouseEvent | KeyboardEvent) {
    if ('key' in e && e.key !== 'Enter' && e.key !== ' ') return;
    const id = (e.target as Element).closest('[data-id]')?.getAttribute('data-id');
    if (!id) return;
    if ('key' in e) e.preventDefault();
    onPick(id);
  }

  const board = (className: string, onWall: boolean) => (
    <>
      {canSeePictures && (
        <BoardArt key={b.pageNo} art={b.art[b.pageNo] ?? null} drawing={b.drawingNow} color={b.chalk} style={onWall ? boardArea(0) : undefined}
          onChange={b.setPicture} />
      )}
      <textarea ref={b.boardRef} className={`${className}${b.drawingNow ? ' under' : ''}`} spellCheck={false} placeholder="Click the board and write…"
        style={onWall ? boardArea(16) : undefined}
        aria-label="The board. Students copy what you write here. Select words to erase or change them."
        value={b.text} onChange={e => b.setText(e.target.value)} onBlur={b.sendIfChanged} />
    </>
  );

  return (
    <section className="stage-col">
      <div className="stage-box">
        {atBoard ? (
          <div className="bigboard">
            <div className="board-wrap">{board('chalk', false)}</div>
            <div className="strip" aria-label="Students, seen from the board">
              {students.map(s => (
                <button key={s.persona.id} className={`mini${s.handUp ? ' up' : ''}${s.persona.id === selected ? ' sel' : ''}`} onClick={() => onPick(s.persona.id)}
                  aria-label={`${s.persona.name}${s.handUp ? ', hand raised' : ''}`}>
                  <span dangerouslySetInnerHTML={{ __html: portraitSvg(s) }} />{s.persona.name}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="stage">
            <div className="stage-in">
              <svg viewBox={SCENE_VIEWBOX} role="group" aria-label="Classroom with the students at their desks"
                onClick={pickFromScene} onKeyDown={pickFromScene} dangerouslySetInnerHTML={{ __html: scene }} />
              {board('chalk wall-board', true)}
            </div>
          </div>
        )}
      </div>

      <div className="boardbar" role="toolbar" aria-label="Board">
        <button className="gold" onClick={() => setAtBoard(!atBoard)}>{atBoard ? 'Back to the class' : 'Big board'}</button>
        <button onClick={() => b.show(b.pageNo - 1)} disabled={b.pageNo === 0} aria-label="Previous board">◀</button>
        <span className="pill">Board {b.pageNo + 1}/{b.pages.length}</span>
        <button onClick={() => b.show(b.pageNo + 1)} disabled={b.pageNo >= b.pages.length - 1} aria-label="Next board">▶</button>
        <button onClick={b.add} disabled={b.pages.length >= 12}>New board</button>
        {b.pages.length > 1 && <button onClick={b.remove}>Remove board</button>}
        <button onClick={b.eraseSelected}>Erase selected</button>
        {b.wiped === null
          ? <button onClick={b.wipe} disabled={!b.text}>Wipe</button>
          : <button onClick={b.undoWipe}>Undo wipe</button>}
        {canSeePictures && <>
          <button className={b.drawing ? 'gold' : ''} aria-pressed={b.drawing} onClick={() => b.setDrawing(!b.drawing)}>{b.drawing ? 'Stop drawing' : 'Draw'}</button>
          {b.drawing && CHALKS.map(([c, name]) => (
            <button key={c} className={`swatch${b.chalk === c ? ' on' : ''}`} style={{ background: c }} aria-label={name} aria-pressed={b.chalk === c} onClick={() => b.setChalk(c)} />
          ))}
          <label className="filebutton">Picture
            <input type="file" accept="image/*" onChange={e => { void b.addPictureFile(e.target.files?.[0]); e.target.value = ''; }} />
          </label>
          {b.art[b.pageNo] && <button onClick={() => b.setPicture(null)}>Clear picture</button>}
          {(b.art[b.pageNo] || b.caps[b.pageNo]) && (
            <input id="caption" className="caption" value={b.caps[b.pageNo] ?? ''} aria-label="What the picture shows (optional)" placeholder="What the picture shows (optional)"
              onChange={e => b.setCaption(e.target.value)} onBlur={b.sendIfChanged} />
          )}
        </>}
      </div>
    </section>
  );
}
