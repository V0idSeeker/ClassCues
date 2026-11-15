import { useRef, useState } from 'react';
import { mergeSpeech } from './speechText';
import { useSpeech } from './useSpeech';

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
  // What was in the box when listening started: speech is added after it, never sent by itself.
  const typedBefore = useRef('');
  const speech = useSpeech((finals, interim) => setText(mergeSpeech(typedBefore.current, finals, interim)));
  const typed = text.trim();
  const send = (fn: (t: string) => void) => { speech.stop(); fn(typed); setText(''); };
  const toggleMic = () => {
    if (speech.listening) return speech.stop();
    typedBefore.current = text;
    speech.start();
  };

  return (
    <div className="compose">
      <textarea aria-label="What you say to the class" placeholder="Type what you say… End with ? and a student answers." value={text}
        // Editing by hand stops listening, so recognition never overwrites the edit.
        onChange={e => { speech.stop(); setText(e.target.value); }}
        onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); if (typed) send(p.onSay); } }} />
      <div className="actions">
        {speech.supported && (
          <button className={speech.listening ? 'mic on' : 'mic'} onClick={toggleMic} aria-pressed={speech.listening}
            aria-label={speech.listening ? 'Stop listening' : 'Speak instead of typing'}
            title="Speak instead of typing. Your words appear in the box; nothing is sent until you press Say it. In Chrome and Edge, speech recognition sends the audio to the browser maker's servers.">
            {speech.listening ? '■ Stop' : '🎤'}
          </button>
        )}
        <button className="go" onClick={() => send(p.onSay)} disabled={!typed}>Say it</button>
        <button onClick={() => send(p.onWrite)} disabled={!typed}>Write on board</button>
        <button onClick={() => send(p.onCallOn)} disabled={p.busy}
          title={p.studentHandUp ? 'Hear what they want to say' : 'Asks them what you typed. With nothing typed, invites them to speak.'}>Call on {p.studentName}</button>
        <button onClick={() => send(p.onAskClass)} disabled={p.busy} title="Asks the class what you typed. With nothing typed, asks if anyone has a question.">Ask the class</button>
      </div>
      {speech.error && <p className="speech-error" role="status">{speech.error}</p>}
    </div>
  );
}
