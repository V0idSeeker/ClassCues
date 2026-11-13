import { describe, expect, it, vi } from 'vitest';
import { listModelInfo, pickFreeDefault, statedSize } from './models';

const listing = {
  data: [
    { id: 'paid/big', supported_parameters: ['structured_outputs'] },
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
    expect(models.find(m => m.id === 'google/gemma-4-26b-it:free')).toEqual({ id: 'google/gemma-4-26b-it:free', free: true, structured: false });
  });

  it('returns an empty list when the provider cannot be read', async () => {
    const down = vi.fn(async () => { throw new TypeError('Failed to fetch'); });
    expect(await listModelInfo('http://x/v1/chat/completions', '', down as unknown as typeof fetch)).toEqual([]);
    const bad = vi.fn(async () => new Response('nope', { status: 500 }));
    expect(await listModelInfo('http://x/v1/chat/completions', '', bad as unknown as typeof fetch)).toEqual([]);
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
