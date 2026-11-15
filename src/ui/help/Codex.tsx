import { useEffect, useMemo, useRef, useState } from 'react';
import { studentPool } from '../../content';
import type { Emotion, Student } from '../../game/types';
import { HAND, STATE, portraitSvg } from '../scene';
import { CATEGORIES, categoryName, entries, entryById } from './codexData';
import { getLang, t } from '../../i18n';
import type { Key } from '../../i18n';
import type { Visual } from './codexData';

interface Props { entry: string; onOpen(id: string): void; onClose(): void }

/** The in-game guide: pages grouped by category, a search box, and a drawing on pages where seeing helps. */
export default function Codex({ entry, onOpen, onClose }: Props) {
  const [query, setQuery] = useState('');
  const closeRef = useRef<HTMLButtonElement>(null);
  const lang = getLang();
  const ENTRIES = useMemo(() => entries(lang), [lang]);
  const page = ENTRIES.find(e => e.id === entry) ?? ENTRIES[0];
  const index = ENTRIES.indexOf(page);

  useEffect(() => { closeRef.current?.focus(); }, []);
  useEffect(() => {
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, [onClose]);

  const q = query.trim().toLowerCase();
  const found = useMemo(() => ENTRIES.filter(e => !q || [e.title, e.intro, ...(e.points ?? [])].join(' ').toLowerCase().includes(q)), [q, ENTRIES]);

  return (
    <div className="codex" role="dialog" aria-modal="true" aria-labelledby="codex-title">
      <div className="codex-book">
        <nav className="codex-nav" aria-label={t('codex.pages')}>
          <div className="row">
            <h2 className="grow" style={{ margin: 0 }}>{t('codex.title')}</h2>
            <button ref={closeRef} onClick={onClose}>{t('common.close')}</button>
          </div>
          <input aria-label={t('codex.search')} placeholder={t('codex.searchPlaceholder')} value={query} onChange={e => setQuery(e.target.value)} style={{ margin: '10px 0' }} />
          {CATEGORIES.map(c => {
            const pages = found.filter(e => e.category === c);
            if (pages.length === 0) return null;
            return (
              <div key={c} className="codex-group">
                <h3>{categoryName(c)}</h3>
                {pages.map(e => (
                  <button key={e.id} className={`codex-link${e.id === page.id ? ' on' : ''}`} aria-current={e.id === page.id ? 'page' : undefined} onClick={() => onOpen(e.id)}>
                    {e.title}
                  </button>
                ))}
              </div>
            );
          })}
          {found.length === 0 && <p className="dim">{t('codex.nothing')}</p>}
        </nav>

        <article className="codex-page">
          <p className="dim" style={{ margin: 0 }}>{categoryName(page.category)}</p>
          <h1 id="codex-title">{page.title}</h1>
          <p className="codex-intro">{page.intro}</p>
          {page.visual && <div className="codex-visual"><Drawing visual={page.visual} /></div>}
          {page.points && <ul>{page.points.map(p => <li key={p}>{p}</li>)}</ul>}
          {page.see && page.see.length > 0 && (
            <p className="dim">{t('codex.seeAlso')}{' '}
              {page.see.map((id, i) => (
                <span key={id}>{i > 0 && ' · '}<button className="linkish" onClick={() => onOpen(id)}>{entryById(id)?.title}</button></span>
              ))}
            </p>
          )}
          <div className="row" style={{ marginTop: 16 }}>
            <button onClick={() => onOpen(ENTRIES[index - 1].id)} disabled={index <= 0}>◀ {index > 0 ? ENTRIES[index - 1].title : ''}</button>
            <span className="grow" />
            <button onClick={() => onOpen(ENTRIES[index + 1].id)} disabled={index >= ENTRIES.length - 1}>{index < ENTRIES.length - 1 ? ENTRIES[index + 1].title : ''} ▶</button>
          </div>
        </article>
      </div>
    </div>
  );
}

/** A student made up for a drawing in the guide. */
const sample = (archetype: string, emotion: Emotion, handUp = false): Student => ({
  persona: studentPool.find(p => p.archetype === archetype) ?? studentPool[0],
  notes: [], beliefs: [], emotion, handUp, pendingLine: null, memory: [],
});


function Drawing({ visual }: { visual: Visual }) {
  switch (visual) {
    case 'flow':
      return (
        <div className="row">
          {t('codex.flow').split('|').map((s, i) => (
            <span key={s} className="row" style={{ gap: 8 }}>{i > 0 && <span aria-hidden="true">→</span>}<span className="pill">{s}</span></span>
          ))}
        </div>
      );
    case 'states':
      return (
        <div className="codex-states">
          <div><span className="chip" style={{ borderColor: HAND.color }}>{HAND.icon} {HAND.label}</span> {t('codex.wantsToSpeak')}</div>
          {(Object.keys(STATE) as Emotion[]).map(e => (
            <div key={e}><span className="chip" style={{ borderColor: STATE[e].color }}>{STATE[e].icon} {STATE[e].label}</span> {t(`codex.meaning.${e}`)}</div>
          ))}
        </div>
      );
    case 'mood':
      return (
        <div className="codex-states">
          {(['engaged', 'calm', 'restless', 'lost'] as const).map(m => (
            <div key={m}><span className="pill">{t('top.mood')}{t(`mood.${m}`)}</span> {t(`codex.mood.${m}`)}</div>
          ))}
        </div>
      );
    case 'goals':
      return (
        <div style={{ maxWidth: 360 }}>
          {[[t('codex.goal1'), 9], [t('codex.goal2'), 4], [t('codex.goal3'), 0]].map(([text, n]) => (
            <div className="goal" key={text as string}>
              <span>{text}</span><b>{n}/10</b>
              <span className="pips">{Array.from({ length: 10 }, (_, i) => <i key={i} className={i < (n as number) ? 'on' : ''} />)}</span>
            </div>
          ))}
        </div>
      );
    case 'notebook':
      return (
        <div className="paper" style={{ maxWidth: 420 }}>
          <h2>{t('codex.notebookOf')}</h2>
          <ul>
            <li>{t('codex.note1')}</li>
            <li className="bent">{t('codex.note2')}</li>
            <li>{t('codex.note3')}</li>
            <li className="old">{t('codex.note4')}</li>
            <li className="wrong">{t('codex.note5')}</li>
          </ul>
        </div>
      );
    case 'archetypes':
      return (
        <div className="codex-faces">
          {([['eager', 'CURIOUS'], ['quiet', 'NEUTRAL'], ['clown', 'HAPPY'], ['skeptic', 'CURIOUS'], ['carrier', 'NEUTRAL'], ['struggling', 'CONFUSED']] as [string, Emotion][]).map(([kind, mood]) => (
            <figure key={kind}>
              <span dangerouslySetInnerHTML={{ __html: portraitSvg(sample(kind, mood)) }} />
              <figcaption>{t(`codex.${kind}` as Key)}</figcaption>
            </figure>
          ))}
        </div>
      );
    case 'board':
      return (
        <div>
          <div className="codex-board" dir="ltr" style={{ whiteSpace: 'pre-line' }}>{t('codex.board')}</div>
          <div className="row" style={{ marginTop: 8 }}>
            <button disabled>◀</button><span className="pill">{t('codex.boardOf')}</span><button disabled>▶</button><button disabled>{t('stage.newBoard')}</button><button disabled>{t('codex.wipe')}</button>
          </div>
        </div>
      );
    case 'report':
      return (
        <div className="row">
          <span className="pill">{t('report.average', { average: 72 })}</span><span className="pill">{t('report.newBest', { before: 64 })}</span><span className="pill">{t('codex.courseScore')}</span>
        </div>
      );
    case 'providers':
      return (
        <table>
          <thead><tr><th>{t('codex.provider')}</th><th>{t('codex.speed')}</th><th>{t('codex.free')}</th><th>{t('codex.pictures')}</th></tr></thead>
          <tbody>
            <tr><td>Groq</td><td>{t('codex.veryFast')}</td><td>{t('codex.perMinute')}</td><td>{t('codex.no')}</td></tr>
            <tr><td>Google Gemini</td><td>{t('codex.fast')}</td><td>{t('codex.perMinute')}</td><td>{t('codex.yes')}</td></tr>
            <tr><td>OpenRouter</td><td>{t('codex.slowFree')}</td><td>{t('codex.perDay')}</td><td>{t('codex.someModels')}</td></tr>
            <tr><td>{t('codex.ownComputer')}</td><td>{t('codex.depends')}</td><td>{t('codex.noLimits')}</td><td>{t('codex.someModels')}</td></tr>
          </tbody>
        </table>
      );
    case 'buttons':
      return (
        <div className="row">
          <button disabled>{t('codex.nextHand')}</button><button disabled>{t('codex.hearIt')}</button><button disabled>{t('codex.callOn')}</button><button disabled>{t('compose.ask')}</button>
        </div>
      );
  }
}
