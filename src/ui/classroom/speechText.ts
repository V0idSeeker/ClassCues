/** Pure rules for speech input (no browser APIs here, so they can be tested in node). */
import { t } from '../../i18n';

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
      return t('speech.blocked');
    case 'no-speech': return t('speech.noSpeech');
    case 'audio-capture': return t('speech.noMic');
    case 'network': return t('speech.network');
    case 'language-not-supported': return t('speech.language');
    default: return t('speech.stopped');
  }
}
