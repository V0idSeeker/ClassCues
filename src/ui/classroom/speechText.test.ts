import { describe, expect, it } from 'vitest';
import { mergeSpeech, speechErrorMessage } from './speechText';

describe('mergeSpeech', () => {
  it('fills an empty box with what was heard', () => {
    expect(mergeSpeech('', [], 'hello')).toBe('hello');
    expect(mergeSpeech('', [' hello'], ' class')).toBe('hello class');
  });
  it('adds after typed text with one space, never replacing it', () => {
    expect(mergeSpeech('Today', ['we learn'], '')).toBe('Today we learn');
    expect(mergeSpeech('Today ', ['we learn'], '')).toBe('Today we learn');
  });
  it('replaces an interim guess with the later one', () => {
    const typed = 'So';
    expect(mergeSpeech(typed, [], 'fraction')).toBe('So fraction');
    expect(mergeSpeech(typed, [], 'fractions are')).toBe('So fractions are');
  });
  it('keeps final parts and puts the interim after them', () => {
    expect(mergeSpeech('So', ['fractions are', 'parts of'], 'a hole')).toBe('So fractions are parts of a hole');
    expect(mergeSpeech('So', ['fractions are', 'parts of'], 'a whole')).toBe('So fractions are parts of a whole');
  });
  it('leaves the typed text alone when nothing was heard', () => {
    expect(mergeSpeech('Hi ', [], '  ')).toBe('Hi ');
  });
});

describe('speechErrorMessage', () => {
  it('stays quiet when the player stopped it', () => expect(speechErrorMessage('aborted')).toBe(''));
  it('says how to allow the microphone', () => expect(speechErrorMessage('not-allowed')).toMatch(/Allow/));
  it('has a message for anything else', () => expect(speechErrorMessage('whatever')).not.toBe(''));
});
