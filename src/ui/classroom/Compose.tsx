import { useState } from 'react';

interface Props {
  studentName: string;
  studentHandUp: boolean;
  busy: boolean;
  onSay(text: string): void;
  onWrite(text: string): void;
  /** Call on the selected student, with what was typed (may be empty). */
  onCallOn(text: string): void;
  /** Ask the class what was typed (may be empty). */
  onAskClass(text: string): void;
}

/** The typing box and everything that uses what was typed. */
export default function Compose(p: Props) {
  const [text, setText] = useState('');
  const typed = text.trim();
  const send = (fn: (t: string) => void) => { fn(typed); setText(''); };

  return (
    <div className="compose">
      <textarea aria-label="What you say to the class" placeholder="Type what you say… End with ? and a student answers." value={text}
        onChange={e => setText(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); if (typed) send(p.onSay); } }} />
      <div className="actions">
        <button className="go" onClick={() => send(p.onSay)} disabled={!typed}>Say it</button>
        <button onClick={() => send(p.onWrite)} disabled={!typed}>Write on board</button>
        <button onClick={() => send(p.onCallOn)} disabled={p.busy}
          title={p.studentHandUp ? 'Hear what they want to say' : 'Asks them what you typed. With nothing typed, invites them to speak.'}>Call on {p.studentName}</button>
        <button onClick={() => send(p.onAskClass)} disabled={p.busy} title="Asks the class what you typed. With nothing typed, asks if anyone has a question.">Ask the class</button>
      </div>
    </div>
  );
}
