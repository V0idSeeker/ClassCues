import { describe, expect, it } from 'vitest';
import { aiReady } from './storage';

describe('aiReady', () => {
  it('needs a key, unless the model runs on this computer', () => {
    expect(aiReady({ apiKey: '', baseUrl: 'https://openrouter.ai/api/v1/chat/completions' })).toBe(false);
    expect(aiReady({ apiKey: ' k ', baseUrl: 'https://openrouter.ai/api/v1/chat/completions' })).toBe(true);
    expect(aiReady({ apiKey: '', baseUrl: 'http://127.0.0.1:11434/v1/chat/completions' })).toBe(true);
    expect(aiReady({ apiKey: '', baseUrl: 'http://localhost:1234/v1/chat/completions' })).toBe(true);
    expect(aiReady({ apiKey: '', baseUrl: 'https://localhost.example.com/v1' })).toBe(false);
  });
});
