import { useCallback, useEffect, useRef, useState } from 'react';
import { getLang, localeOf } from '../../i18n';
import { speechErrorMessage } from './speechText';

// The Web Speech API recognition interface is not in TypeScript's DOM types: just what is used here.
interface Recognition {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((e: { results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }> }) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
  start(): void;
  abort(): void;
}
type RecognitionCtor = new () => Recognition;

const w = typeof window === 'undefined' ? undefined : (window as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor });
const Ctor = w?.SpeechRecognition ?? w?.webkitSpeechRecognition;

/** Speech to text with the browser's own recognition. onHeard gets the session's final parts and the current interim guess. */
export function useSpeech(onHeard: (finals: string[], interim: string) => void) {
  const [listening, setListening] = useState(false);
  const [error, setError] = useState('');
  const rec = useRef<Recognition | null>(null);
  const heard = useRef(onHeard);
  heard.current = onHeard;

  /** Stop now and ignore anything still on its way. */
  const stop = useCallback(() => {
    const r = rec.current;
    if (!r) return;
    rec.current = null;
    r.onresult = r.onerror = r.onend = null;
    r.abort();
    setListening(false);
  }, []);

  const start = useCallback(() => {
    if (!Ctor || rec.current) return;
    const r = new Ctor();
    r.continuous = true;
    r.interimResults = true;
    r.lang = localeOf(getLang());
    r.onresult = e => {
      const finals: string[] = [];
      let interim = '';
      for (const res of Array.from(e.results)) {
        if (res.isFinal) finals.push(res[0].transcript); else interim += ' ' + res[0].transcript;
      }
      heard.current(finals, interim);
    };
    r.onerror = e => setError(speechErrorMessage(e.error));
    r.onend = () => { rec.current = null; setListening(false); };
    setError('');
    try { r.start(); } catch { setError(speechErrorMessage('')); return; }
    rec.current = r;
    setListening(true);
  }, []);

  useEffect(() => stop, [stop]);

  return { supported: !!Ctor, listening, error, start, stop, clearError: () => setError('') };
}
