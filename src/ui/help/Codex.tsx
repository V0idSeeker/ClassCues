import { useEffect, useMemo, useRef, useState } from 'react';
import { studentPool } from '../../content';
import type { Emotion, Student } from '../../game/types';
import { HAND, STATE, portraitSvg } from '../scene';
import { CATEGORIES, ENTRIES, entryById } from './codexData';
import type { Visual } from './codexData';

interface Props { entry: string; onOpen(id: string): void; onClose(): void }

/** The in-game guide: pages grouped by category, a search box, and a drawing on pages where seeing helps. */
export default function Codex({ entry, onOpen, onClose }: Props) {
  const [query, setQuery] = useState('');
  const closeRef = useRef<HTMLButtonElement>(null);
  const page = entryById(entry) ?? ENTRIES[0];
  const index = ENTRIES.indexOf(page);

  useEffect(() => { closeRef.current?.focus(); }, []);
  useEffect(() => {
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, [onClose]);

  const q = query.trim().toLowerCase();
  const found = useMemo(() => ENTRIES.filter(e => !q || [e.title, e.intro, ...(e.points ?? [])].join(' ').toLowerCase().includes(q)), [q]);

  return (
    <div className="codex" role="dialog" aria-modal="true" aria-labelledby="codex-title">
      <div className="codex-book">
        <nav className="codex-nav" aria-label="Guide pages">
          <div className="row">
            <h2 className="grow" style={{ margin: 0 }}>How to play</h2>
            <button ref={closeRef} onClick={onClose}>Close</button>
          </div>
          <input aria-label="Search the guide" placeholder="Search…" value={query} onChange={e => setQuery(e.target.value)} style={{ margin: '10px 0' }} />
          {CATEGORIES.map(c => {
            const pages = found.filter(e => e.category === c);
            if (pages.length === 0) return null;
            return (
              <div key={c} className="codex-group">
                <h3>{c}</h3>
                {pages.map(e => (
                  <button key={e.id} className={`codex-link${e.id === page.id ? ' on' : ''}`} aria-current={e.id === page.id ? 'page' : undefined} onClick={() => onOpen(e.id)}>
                    {e.title}
                  </button>
                ))}
              </div>
            );
          })}
          {found.length === 0 && <p className="dim">Nothing found.</p>}
        </nav>

        <article className="codex-page">
          <p className="dim" style={{ margin: 0 }}>{page.category}</p>
          <h1 id="codex-title">{page.title}</h1>
          <p className="codex-intro">{page.intro}</p>
          {page.visual && <div className="codex-visual"><Drawing visual={page.visual} /></div>}
          {page.points && <ul>{page.points.map(p => <li key={p}>{p}</li>)}</ul>}
          {page.see && page.see.length > 0 && (
            <p className="dim">See also:{' '}
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

const MEANING: Record<Emotion, string> = {
  CURIOUS: 'wants to know more',
  CONFUSED: 'lost the thread',
  BORED: 'drifting off, writes fewer notes',
  HAPPY: 'following and enjoying it',
  NEUTRAL: 'listening',
};

function Drawing({ visual }: { visual: Visual }) {
  switch (visual) {
    case 'flow':
      return (
        <div className="row">
          {['Choose a lesson', 'Teach', 'Ring the bell', 'Quiz', 'Report', 'Try again'].map((s, i) => (
            <span key={s} className="row" style={{ gap: 8 }}>{i > 0 && <span aria-hidden="true">→</span>}<span className="pill">{s}</span></span>
          ))}
        </div>
      );
    case 'states':
      return (
        <div className="codex-states">
          <div><span className="chip" style={{ borderColor: HAND.color }}>{HAND.icon} {HAND.label}</span> wants to speak: click their desk</div>
          {(Object.keys(STATE) as Emotion[]).map(e => (
            <div key={e}><span className="chip" style={{ borderColor: STATE[e].color }}>{STATE[e].icon} {STATE[e].label}</span> {MEANING[e]}</div>
          ))}
        </div>
      );
    case 'mood':
      return (
        <div className="codex-states">
          <div><span className="pill">Class mood: engaged</span> half the class or more curious or happy</div>
          <div><span className="pill">Class mood: calm</span> listening, nothing to worry about</div>
          <div><span className="pill">Class mood: restless</span> four or more bored: change something</div>
          <div><span className="pill">Class mood: lost</span> four or more confused: slow down and check</div>
        </div>
      );
    case 'goals':
      return (
        <div style={{ maxWidth: 360 }}>
          {[['A variable stores a value under a name', 9], ['The = sign assigns, it does not mean equal', 4], ['Names are case-sensitive', 0]].map(([text, n]) => (
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
          <h2>Tom's notebook</h2>
          <ul>
            <li>a variable is a name that stores a value</li>
            <li className="bent">= means both sides are equal</li>
            <li>Leo said: you can call a variable pizza</li>
            <li className="old">From the lesson "Loops": range(5) starts at 0</li>
            <li className="wrong">A variable keeps its first value forever</li>
          </ul>
        </div>
      );
    case 'archetypes':
      return (
        <div className="codex-faces">
          {([['eager', 'Eager', 'CURIOUS'], ['quiet', 'Quiet', 'NEUTRAL'], ['clown', 'Class clown', 'HAPPY'], ['skeptic', 'Skeptic', 'CURIOUS'], ['carrier', 'Wrong-belief carrier', 'NEUTRAL'], ['struggling', 'Struggling', 'CONFUSED']] as [string, string, Emotion][]).map(([kind, label, mood]) => (
            <figure key={kind}>
              <span dangerouslySetInnerHTML={{ __html: portraitSvg(sample(kind, mood)) }} />
              <figcaption>{label}</figcaption>
            </figure>
          ))}
        </div>
      );
    case 'board':
      return (
        <div>
          <div className="codex-board">score = 10<br />= means put into, not equal</div>
          <div className="row" style={{ marginTop: 8 }}>
            <button disabled>◀</button><span className="pill">Board 2 of 3</span><button disabled>▶</button><button disabled>New board</button><button disabled>Wipe the board</button>
          </div>
        </div>
      );
    case 'report':
      return (
        <div className="row">
          <span className="pill">Class average 72%</span><span className="pill">New best! Before: 64%</span><span className="pill">Course score 70% · 2 of 5 taught</span>
        </div>
      );
    case 'providers':
      return (
        <table>
          <thead><tr><th>Provider</th><th>Speed</th><th>Free</th><th>Sees pictures</th></tr></thead>
          <tbody>
            <tr><td>Groq</td><td>Very fast</td><td>Yes, limited per minute</td><td>No</td></tr>
            <tr><td>Google Gemini</td><td>Fast</td><td>Yes, limited per minute</td><td>Yes</td></tr>
            <tr><td>OpenRouter</td><td>Slow on free models</td><td>About 50 requests a day</td><td>Some models</td></tr>
            <tr><td>A model on your computer</td><td>Depends on your computer</td><td>Yes, no limits</td><td>Some models</td></tr>
          </tbody>
        </table>
      );
    case 'buttons':
      return (
        <div className="row">
          <button disabled>Next raised hand</button><button disabled>🔊 Hear it</button><button disabled>Call on Maya</button><button disabled>Ask the class</button>
        </div>
      );
  }
}
