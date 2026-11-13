import { describe, expect, it, vi } from 'vitest';
import { autoModel, autoModels, canReadPictures, listModelInfo, pickFreeDefault, pickGeminiDefault, statedSize } from './models';

const listing = {
  data: [
    { id: 'paid/big', supported_parameters: ['structured_outputs'], architecture: { input_modalities: ['text', 'image'] } },
    { id: 'zeta/model:free', supported_parameters: ['structured_outputs', 'tools'] },
    { id: 'liquid/lfm-3-1.7b:free', supported_parameters: ['structured_outputs'] },
    { id: 'google/gemma-4-26b-it:free', supported_parameters: ['response_format'] },
    { id: 'beta/model:free', supported_parameters: ['structured_outputs'] },
    {},
  ],
};

describe('listModelInfo', () => {
  it('reads models from the /models address next to chat completions, free ones first', async () => {
    const f = vi.fn(async () => new Response(JSON.stringify(listing)));
    const models = await listModelInfo('https://openrouter.ai/api/v1/chat/completions', 'k', f as unknown as typeof fetch);
    expect((f.mock.calls[0] as unknown as [string])[0]).toBe('https://openrouter.ai/api/v1/models');
    expect(models.map(m => m.id)).toEqual(['beta/model:free', 'google/gemma-4-26b-it:free', 'liquid/lfm-3-1.7b:free', 'zeta/model:free', 'paid/big']);
    expect(models.find(m => m.id === 'google/gemma-4-26b-it:free')).toEqual({ id: 'google/gemma-4-26b-it:free', free: true, structured: false, vision: false });
    expect(models.find(m => m.id === 'paid/big')!.vision).toBe(true);
  });

  it('returns an empty list when the provider cannot be read', async () => {
    const down = vi.fn(async () => { throw new TypeError('Failed to fetch'); });
    expect(await listModelInfo('http://x/v1/chat/completions', '', down as unknown as typeof fetch)).toEqual([]);
    const bad = vi.fn(async () => new Response('nope', { status: 500 }));
    expect(await listModelInfo('http://x/v1/chat/completions', '', bad as unknown as typeof fetch)).toEqual([]);
  });
});

describe('canReadPictures', () => {
  const list = [{ id: 'a/eyes', free: false, structured: true, vision: true }, { id: 'a/blind', free: false, structured: true, vision: false }];

  it('trusts the provider list, knows Gemini, and lets the player decide for the rest', () => {
    expect(canReadPictures('https://openrouter.ai/api/v1/chat/completions', 'a/eyes', list, false)).toBe(true);
    expect(canReadPictures('https://openrouter.ai/api/v1/chat/completions', 'a/blind', list, false)).toBe(false);
    expect(canReadPictures('https://generativelanguage.googleapis.com/v1beta/openai/chat/completions', 'models/gemini-3.6-flash', [], false)).toBe(true);
    expect(canReadPictures('http://127.0.0.1:11434/v1/chat/completions', 'llava', [], false)).toBe(false);
    expect(canReadPictures('http://127.0.0.1:11434/v1/chat/completions', 'llava', [], true)).toBe(true);
  });
});

describe('pickGeminiDefault', () => {
  const g = (id: string) => ({ id, free: false, structured: false });
  const gemini = ['models/gemini-2.5-flash', 'models/gemini-3.8-flash', 'models/gemini-3.8-flash-lite', 'models/gemini-3.8-pro', 'models/gemini-4.0-flash-preview', 'models/gemini-3.8-flash-image', 'models/text-embedding-004'].map(g);

  it('picks the newest general flash model', () => {
    expect(pickGeminiDefault(gemini)).toBe('models/gemini-3.8-flash');
    expect(pickGeminiDefault([g('models/gemini-3.8-pro')])).toBeNull();
  });

  it('lists fallbacks newest first, without special-purpose models', () => {
    const real = ['models/gemini-3.5-flash', 'models/gemini-3.8-flash', 'models/gemini-omni-1.2-flash', 'models/gemini-3.7-flash', 'models/gemini-3.6-flash', 'models/gemini-3.8-flash-tts', 'models/gemini-3-flash-preview', 'models/gemini-2.5-flash'].map(g);
    expect(autoModels('https://generativelanguage.googleapis.com/v1beta/openai/chat/completions', real))
      .toEqual(['models/gemini-3.8-flash', 'models/gemini-3.7-flash', 'models/gemini-3.6-flash', 'models/gemini-3.5-flash']);
  });

  it('lists Groq chat models largest first, without speech, safety or tiny models', () => {
    const groq = ['llama-3.1-8b-instant', 'llama-3.3-70b-versatile', 'whisper-large-v3', 'openai/gpt-oss-120b', 'meta-llama/llama-guard-4-12b', 'qwen/qwen3-32b', 'tiny-1b', 'openai/gpt-oss-20b'].map(g);
    expect(autoModels('https://api.groq.com/openai/v1/chat/completions', groq))
      .toEqual(['openai/gpt-oss-120b', 'llama-3.3-70b-versatile', 'qwen/qwen3-32b', 'openai/gpt-oss-20b']);
  });

  it('chooses the default by provider address', () => {
    expect(autoModel('https://generativelanguage.googleapis.com/v1beta/openai/chat/completions', gemini)).toBe('models/gemini-3.8-flash');
    expect(autoModel('https://openrouter.ai/api/v1/chat/completions', [{ id: 'a/b:free', free: true, structured: true }])).toBe('a/b:free');
    expect(autoModel('http://127.0.0.1:11434/v1/chat/completions', gemini)).toBe('');
  });
});

describe('pickFreeDefault', () => {
  it('reads the size from a model name when it states one', () => {
    expect(statedSize('liquid/lfm-3-1.7b:free')).toBe(1.7);
    expect(statedSize('google/gemma-4-26b-a4b-it:free')).toBe(26);
    expect(statedSize('particle-ai/particle-1:free')).toBeNull();
  });

  it('picks a free model with the right answer format that is not tiny, always the same one', async () => {
    const f = vi.fn(async () => new Response(JSON.stringify(listing)));
    const models = await listModelInfo('https://openrouter.ai/api/v1/chat/completions', '', f as unknown as typeof fetch);
    expect(pickFreeDefault(models)).toBe('beta/model:free');
    expect(pickFreeDefault([...models].reverse())).toBe('beta/model:free');
  });

  it('gives nothing when no model fits', () => {
    expect(pickFreeDefault([{ id: 'paid/big', free: false, structured: true }, { id: 'tiny-2b:free', free: true, structured: true }])).toBeNull();
  });
});
