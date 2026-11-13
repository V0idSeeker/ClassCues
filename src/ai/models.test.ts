import { describe, expect, it, vi } from 'vitest';
import { listModels } from './models';

describe('listModels', () => {
  it('reads model ids from the /models address next to chat completions', async () => {
    const f = vi.fn(async () => new Response(JSON.stringify({ data: [{ id: 'b/model' }, { id: 'a/model' }, {}] })));
    expect(await listModels('https://openrouter.ai/api/v1/chat/completions', 'k', f as unknown as typeof fetch)).toEqual(['a/model', 'b/model']);
    expect((f.mock.calls[0] as unknown as [string])[0]).toBe('https://openrouter.ai/api/v1/models');
  });

  it('returns an empty list when the provider cannot be read', async () => {
    const down = vi.fn(async () => { throw new TypeError('Failed to fetch'); });
    expect(await listModels('http://x/v1/chat/completions', '', down as unknown as typeof fetch)).toEqual([]);
    const bad = vi.fn(async () => new Response('nope', { status: 500 }));
    expect(await listModels('http://x/v1/chat/completions', '', bad as unknown as typeof fetch)).toEqual([]);
  });
});
