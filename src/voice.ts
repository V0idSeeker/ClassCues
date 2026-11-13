// Student voices with the browser's built-in speech. Free, no key. Browser only.

/** The voice for a student: one that speaks the language if there is any, reused in turn when students outnumber voices. */
export function pickVoice<T extends { lang: string }>(voices: T[], index: number, lang: string): T | null {
  const fit = voices.filter(v => v.lang.toLowerCase().startsWith(lang.toLowerCase()));
  const from = fit.length > 0 ? fit : voices;
  return from.length > 0 ? from[index % from.length] : null;
}

/** Students who share a voice still sound different: pitch and speed vary by student. */
export function voiceTuning(index: number): { pitch: number; rate: number } {
  return { pitch: 1 + ((index * 7) % 5) * 0.12, rate: 0.95 + ((index * 3) % 4) * 0.05 };
}

// ponytail: voices are English. For levels in other languages pass the level's language here once levels carry one.
const LANG = 'en';

/** Says the text aloud in the student's voice. onState(true) when speech starts, onState(false) when it ends. */
export function speak(text: string, voiceIndex: number, onState: (talking: boolean) => void): void {
  const synth = typeof window === 'undefined' ? undefined : window.speechSynthesis;
  if (!synth || !text.trim()) return;
  const u = new SpeechSynthesisUtterance(text);
  const voice = pickVoice(synth.getVoices(), voiceIndex, LANG);
  if (voice) u.voice = voice;
  const { pitch, rate } = voiceTuning(voiceIndex);
  u.pitch = pitch;
  u.rate = rate;
  u.onstart = () => onState(true);
  u.onend = () => onState(false);
  u.onerror = () => onState(false);
  synth.cancel();
  synth.speak(u);
}

export function stopSpeaking(): void {
  if (typeof window !== 'undefined') window.speechSynthesis?.cancel();
}
