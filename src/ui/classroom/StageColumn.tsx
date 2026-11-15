import { useMemo, useState } from 'react';
import type { KeyboardEvent, MouseEvent } from 'react';
import type { Student } from '../../game/types';
import BoardArt from '../BoardArt';
import { SCENE_VIEWBOX, boardArea, portraitSvg, sceneSvg } from '../scene';
import type { Boards } from './useBoards';
import { t } from '../../i18n';
import type { Key } from '../../i18n';

interface Props {
  students: Student[];
  selected: string;
  talking: string | null;
  boards: Boards;
  canSeePictures: boolean;
  onPick(id: string): void;
}

const still = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
const CHALKS: [string, Key][] = [['#f5f7f2', 'stage.white'], ['#ffe08a', 'stage.yellow'], ['#ff9aa8', 'stage.pink'], ['#9fd4f5', 'stage.blue']];

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
      <textarea ref={b.boardRef} dir="auto" className={`${className}${b.drawingNow ? ' under' : ''}`} spellCheck={false} placeholder={t('stage.boardPlaceholder')}
        style={onWall ? boardArea(16) : undefined}
        aria-label={t('stage.boardLabel')}
        value={b.text} onChange={e => b.setText(e.target.value)} onBlur={b.sendIfChanged} />
    </>
  );

  return (
    <section className="stage-col">
      <div className="stage-box">
        {atBoard ? (
          <div className="bigboard">
            <div className="board-wrap">{board('chalk', false)}</div>
            <div className="strip" aria-label={t('stage.strip')}>
              {students.map(s => (
                <button key={s.persona.id} className={`mini${s.handUp ? ' up' : ''}${s.persona.id === selected ? ' sel' : ''}`} onClick={() => onPick(s.persona.id)}
                  aria-label={s.handUp ? t('stage.handRaised', { name: s.persona.name }) : s.persona.name}>
                  <span dangerouslySetInnerHTML={{ __html: portraitSvg(s) }} />{s.persona.name}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="stage">
            <div className="stage-in">
              <svg viewBox={SCENE_VIEWBOX} role="group" aria-label={t('stage.classroom')}
                onClick={pickFromScene} onKeyDown={pickFromScene} dangerouslySetInnerHTML={{ __html: scene }} />
              {board('chalk wall-board', true)}
            </div>
          </div>
        )}
      </div>

      <div className="boardbar" role="toolbar" aria-label={t('stage.toolbar')}>
        <button className="gold" onClick={() => setAtBoard(!atBoard)}>{atBoard ? t('stage.backToClass') : t('stage.bigBoard')}</button>
        <button onClick={() => b.show(b.pageNo - 1)} disabled={b.pageNo === 0} aria-label={t('stage.prev')}>◀</button>
        <span className="pill">{t('stage.boardN', { n: b.pageNo + 1, total: b.pages.length })}</span>
        <button onClick={() => b.show(b.pageNo + 1)} disabled={b.pageNo >= b.pages.length - 1} aria-label={t('stage.next')}>▶</button>
        <button onClick={b.add} disabled={b.pages.length >= 12}>{t('stage.newBoard')}</button>
        {b.pages.length > 1 && <button onClick={b.remove}>{t('stage.removeBoard')}</button>}
        <button onClick={b.eraseSelected}>{t('stage.erase')}</button>
        {b.wiped === null
          ? <button onClick={b.wipe} disabled={!b.text}>{t('stage.wipe')}</button>
          : <button onClick={b.undoWipe}>{t('stage.undoWipe')}</button>}
        {canSeePictures && <>
          <button className={b.drawing ? 'gold' : ''} aria-pressed={b.drawing} onClick={() => b.setDrawing(!b.drawing)}>{b.drawing ? t('stage.stopDrawing') : t('stage.draw')}</button>
          {b.drawing && CHALKS.map(([c, name]) => (
            <button key={c} className={`swatch${b.chalk === c ? ' on' : ''}`} style={{ background: c }} aria-label={t(name)} aria-pressed={b.chalk === c} onClick={() => b.setChalk(c)} />
          ))}
          <label className="filebutton">{t('stage.picture')}
            <input type="file" accept="image/*" onChange={e => { void b.addPictureFile(e.target.files?.[0]); e.target.value = ''; }} />
          </label>
          {b.art[b.pageNo] && <button onClick={() => b.setPicture(null)}>{t('stage.clearPicture')}</button>}
          {(b.art[b.pageNo] || b.caps[b.pageNo]) && (
            <input id="caption" className="caption" value={b.caps[b.pageNo] ?? ''} aria-label={t('stage.caption')} placeholder={t('stage.caption')}
              onChange={e => b.setCaption(e.target.value)} onBlur={b.sendIfChanged} />
          )}
        </>}
      </div>
    </section>
  );
}
