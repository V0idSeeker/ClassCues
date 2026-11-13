import { describe, expect, it, vi } from 'vitest';
import { AiError, callJson } from './provider';
import type { CallOptions, LogEntry } from './provider';

const p = { baseUrl: 'http://x/v1/chat/completions', apiKey: 'secret-key', thinkingOff: true };
const reply = (content: string, status = 200) => new Response(JSON.stringify({ choices: [{ message: { content } }] }), { status });
const isOk = (v: unknown): v is { ok: boolean } => typeof v === 'object' && v !== null && typeof (v as { ok?: unknown }).ok === 'boolean';

function setup(replies: (() => Response | Promise<Response>)[]) {
  let i = 0;
  const fetchImpl = vi.fn(async () => replies[Math.min(i++, replies.length - 1)]());
  const opts: CallOptions<{ ok: boolean }> = {
    model: 'm', schemaName: 'ping', schema: { type: 'object' }, messages: [{ role: 'user', content: 'hi' }],
    guard: isOk, fetchImpl: fetchImpl as unknown as typeof fetch, sleep: async () => {},
  };
  return { fetchImpl, opts };
}
const kindOf = async (promise: Promise<unknown>) => promise.then(() => 'none', e => (e instanceof AiError ? e.kind : 'other'));

describe('callJson', () => {
  it('returns the parsed JSON and sends the structured-output request', async () => {
    const { fetchImpl, opts } = setup([() => reply('{"ok":true}')]);
    expect(await callJson(p, opts)).toEqual({ ok: true });
    const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe(p.baseUrl);
    const body = JSON.parse(init.body as string);
    expect(body.response_format).toEqual({ type: 'json_schema', json_schema: { name: 'ping', strict: true, schema: { type: 'object' } } });
    expect(body.reasoning_effort).toBe('none');
    expect(body.chat_template_kwargs).toEqual({ enable_thinking: false });
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer secret-key');
  });

  it('leaves out the thinking flags and the key when they are not set', async () => {
    const { fetchImpl, opts } = setup([() => reply('{"ok":true}')]);
    await callJson({ ...p, apiKey: '', thinkingOff: false }, opts);
    const init = (fetchImpl.mock.calls[0] as unknown as [string, RequestInit])[1];
    expect(JSON.parse(init.body as string).reasoning_effort).toBeUndefined();
    expect((init.headers as Record<string, string>).Authorization).toBeUndefined();
  });

  it('sends no model name when none is chosen, so the provider uses its default', async () => {
    const { fetchImpl, opts } = setup([() => reply('{"ok":true}')]);
    await callJson(p, { ...opts, model: '' });
    const init = (fetchImpl.mock.calls[0] as unknown as [string, RequestInit])[1];
    expect('model' in JSON.parse(init.body as string)).toBe(false);
  });

  it('accepts JSON wrapped in a code fence', async () => {
    const { opts } = setup([() => reply('```json\n{"ok":false}\n```')]);
    expect(await callJson(p, opts)).toEqual({ ok: false });
  });

  it('retries once on invalid JSON, then succeeds', async () => {
    const { fetchImpl, opts } = setup([() => reply('not json'), () => reply('{"ok":true}')]);
    expect(await callJson(p, opts)).toEqual({ ok: true });
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it('gives up with badjson after two bad answers, including a wrong shape', async () => {
    const { fetchImpl, opts } = setup([() => reply('{"nope":1}')]);
    expect(await kindOf(callJson(p, opts))).toBe('badjson');
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it('waits and retries on 429, then reports rate', async () => {
    const sleep = vi.fn(async () => {});
    const { fetchImpl, opts } = setup([() => reply('', 429)]);
    expect(await kindOf(callJson(p, { ...opts, sleep }))).toBe('rate');
    expect(fetchImpl).toHaveBeenCalledTimes(3);
    expect(sleep.mock.calls.map(c => (c as unknown as [number])[0])).toEqual([5000, 15000]);
  });

  it('names the other failures', async () => {
    expect(await kindOf(callJson(p, setup([() => reply('', 401)]).opts))).toBe('auth');
    expect(await kindOf(callJson(p, setup([() => reply('', 402)]).opts))).toBe('quota');
    expect(await kindOf(callJson(p, setup([() => reply('', 404)]).opts))).toBe('model');
    expect(await kindOf(callJson(p, setup([() => reply('', 500)]).opts))).toBe('http');
    expect(await kindOf(callJson(p, setup([() => { throw new TypeError('Failed to fetch'); }]).opts))).toBe('network');
  });

  it('counts every request and never logs the key', async () => {
    const onRequest = vi.fn();
    const entries: LogEntry[] = [];
    const { opts } = setup([() => reply('bad'), () => reply('{"ok":true}')]);
    await callJson(p, { ...opts, onRequest, log: e => entries.push(e) });
    expect(onRequest).toHaveBeenCalledTimes(2);
    expect(entries).toHaveLength(2);
    expect(JSON.stringify(entries)).not.toContain('secret-key');
  });
});
