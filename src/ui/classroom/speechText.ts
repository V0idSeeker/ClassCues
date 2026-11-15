/** Pure rules for speech input (no browser APIs here, so they can be tested in node). */

/** What the typing box shows while listening: what was typed before, then the final words, then the interim guess. */
export function mergeSpeech(typed: string, finals: string[], interim: string): string {
  const spoken = [...finals, interim].map(s => s.trim()).filter(Boolean).join(' ');
  if (!spoken) return typed;
  const before = typed.trimEnd();
  return before ? `${before} ${spoken}` : spoken;
}

/** A short message for a recognition error code, or '' when there is nothing to tell the player. */
export function speechErrorMessage(code: string): string {
  switch (code) {
    case 'aborted': return '';
    case 'not-allowed':
    case 'service-not-allowed':
      return 'Microphone blocked. Allow it from the icon at the left of the address bar, then press 🎤 again.';
    case 'no-speech': return 'No speech heard. Press 🎤 and speak.';
    case 'audio-capture': return 'No microphone found.';
    case 'network': return 'Speech recognition needs an internet connection.';
    case 'language-not-supported': return 'Speech recognition does not support your language here.';
    default: return 'Speech recognition stopped. Typing still works.';
  }
}
