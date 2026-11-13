import { describe, expect, it } from 'vitest';
import { pickVoice, voiceTuning } from './voice';

const voices = [{ lang: 'fr-FR', name: 'f' }, { lang: 'en-US', name: 'a' }, { lang: 'en-GB', name: 'b' }];

describe('pickVoice', () => {
  it('uses voices of the right language and reuses them in turn', () => {
    expect(pickVoice(voices, 0, 'en')!.name).toBe('a');
    expect(pickVoice(voices, 1, 'en')!.name).toBe('b');
    expect(pickVoice(voices, 2, 'en')!.name).toBe('a');
  });

  it('falls back to any voice, and to none when the browser has no voices', () => {
    expect(pickVoice(voices, 0, 'ja')!.name).toBe('f');
    expect(pickVoice([], 3, 'en')).toBeNull();
  });
});

describe('voiceTuning', () => {
  it('stays in a natural range and differs between neighbours', () => {
    for (let i = 0; i < 30; i++) {
      const t = voiceTuning(i);
      expect(t.pitch).toBeGreaterThanOrEqual(1);
      expect(t.pitch).toBeLessThanOrEqual(1.5);
      expect(t.rate).toBeGreaterThanOrEqual(0.95);
      expect(t.rate).toBeLessThanOrEqual(1.1);
    }
    expect(voiceTuning(0)).not.toEqual(voiceTuning(1));
  });
});
