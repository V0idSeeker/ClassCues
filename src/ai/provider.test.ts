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

  it('uses the free-models router on OpenRouter when no model is chosen', async () => {
    const { fetchImpl, opts } = setup([() => reply('{"ok":true}')]);
    await callJson({ ...p, baseUrl: 'https://openrouter.ai/api/v1/chat/completions' }, { ...opts, model: '' });
    const init = (fetchImpl.mock.calls[0] as unknown as [string, RequestInit])[1];
    expect(JSON.parse(init.body as string).model).toBe('openrouter/free');
  });

  it('talks to Gemini its own way: a default model, low thinking, no llama.cpp flag', async () => {
    const { fetchImpl, opts } = setup([() => reply('{"ok":true}')]);
    await callJson({ ...p, baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions' }, { ...opts, model: '' });
    const init = (fetchImpl.mock.calls[0] as unknown as [string, RequestInit])[1];
    const body = JSON.parse(init.body as string);
    expect(body.model).toBe('gemini-3.8-flash');
    expect(body.reasoning_effort).toBe('low');
    expect('chat_template_kwargs' in body).toBe(false);
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer secret-key');
  });

  it('falls back to the next automatic model when one is overloaded, and tries the working one first next time', async () => {
    const here = { ...p, baseUrl: 'http://fallback/v1/chat/completions' };
    const { fetchImpl, opts } = setup([() => reply('', 503), () => reply('{"ok":true}'), () => reply('{"ok":true}')]);
    const onModel = vi.fn();
    const auto = { ...opts, model: '', models: ['newest', 'older'], onModel };
    expect(await callJson(here, auto)).toEqual({ ok: true });
    await callJson(here, auto);
    const used = fetchImpl.mock.calls.map(c => JSON.parse((c as unknown as [string, RequestInit])[1].body as string).model);
    expect(used).toEqual(['newest', 'older', 'older']);
    expect(onModel).toHaveBeenLastCalledWith('older');
  });

  it('waits and goes round again when every automatic model is busy', async () => {
    const here = { ...p, baseUrl: 'http://all-busy/v1/chat/completions' };
    const sleep = vi.fn(async () => {});
    const { fetchImpl, opts } = setup([() => reply('', 503), () => reply('', 503), () => reply('', 503), () => reply('{"ok":true}')]);
    expect(await callJson(here, { ...opts, sleep, model: '', models: ['a', 'b'] })).toEqual({ ok: true });
    const used = fetchImpl.mock.calls.map(c => JSON.parse((c as unknown as [string, RequestInit])[1].body as string).model);
    expect(used).toEqual(['a', 'b', 'a', 'b']);
    expect(sleep).toHaveBeenCalledTimes(1);
  });

  it('gives up with a clear message after three rounds of busy models', async () => {
    const here = { ...p, baseUrl: 'http://always-busy/v1/chat/completions' };
    const { fetchImpl, opts } = setup([() => reply('', 503)]);
    expect(await kindOf(callJson(here, { ...opts, model: '', models: ['a', 'b'] }))).toBe('unavailable');
    expect(fetchImpl).toHaveBeenCalledTimes(6);
  });

  it('waits and retries a single busy model too', async () => {
    const { fetchImpl, opts } = setup([() => reply('', 503), () => reply('{"ok":true}')]);
    expect(await callJson(p, opts)).toEqual({ ok: true });
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it('treats a provider-side "failed to generate JSON" as a bad answer: retry, then the next model', async () => {
    const failed = () => new Response(JSON.stringify({ error: { message: "Failed to generate JSON. Please adjust your prompt.", code: 'json_validate_failed' } }), { status: 400 });
    const here = { ...p, baseUrl: 'http://json-fail/v1/chat/completions' };
    const { fetchImpl, opts } = setup([failed, failed, () => reply('{"ok":true}')]);
    expect(await callJson(here, { ...opts, model: '', models: ['weak', 'strong'] })).toEqual({ ok: true });
    const used = fetchImpl.mock.calls.map(c => JSON.parse((c as unknown as [string, RequestInit])[1].body as string).model);
    expect(used).toEqual(['weak', 'weak', 'strong']);
    expect(await kindOf(callJson(here, { ...setup([failed]).opts, model: 'mine' }))).toBe('badjson');
  });

  it('does not fall back when the player chose the model, or when the key is wrong', async () => {
    const here = { ...p, baseUrl: 'http://no-fallback/v1/chat/completions' };
    const chosen = setup([() => reply('', 503)]);
    expect(await kindOf(callJson(here, { ...chosen.opts, model: 'mine', models: ['a', 'b'] }))).toBe('unavailable');
    const used = chosen.fetchImpl.mock.calls.map(c => JSON.parse((c as unknown as [string, RequestInit])[1].body as string).model);
    expect(used).toEqual(['mine', 'mine', 'mine']);
    const badKey = setup([() => reply('', 401), () => reply('{"ok":true}')]);
    expect(await kindOf(callJson(here, { ...badKey.opts, model: '', models: ['a', 'b'] }))).toBe('auth');
    expect(badKey.fetchImpl).toHaveBeenCalledTimes(1);
  });

  it('switches to plain JSON with the schema in the prompt when a model has no strict schema format', async () => {
    const refuse = () => new Response(JSON.stringify({ error: { message: 'This model does not support response_format json_schema' } }), { status: 400 });
    const here = { ...p, baseUrl: 'http://plain-json/v1/chat/completions' };
    const { fetchImpl, opts } = setup([refuse, () => reply('{"ok":true}'), () => reply('{"ok":false}')]);
    expect(await callJson(here, opts)).toEqual({ ok: true });
    expect(await callJson(here, opts)).toEqual({ ok: false });
    const bodies = fetchImpl.mock.calls.map(c => JSON.parse((c as unknown as [string, RequestInit])[1].body as string));
    expect(bodies[0].response_format.type).toBe('json_schema');
    expect(bodies[1].response_format).toEqual({ type: 'json_object' });
    expect(bodies[1].messages.at(-1).content).toContain('"type":"object"');
    expect(bodies[2].response_format).toEqual({ type: 'json_object' });
  });

  it('talks to Groq with models from its own list only, and no thinking options', async () => {
    const { fetchImpl, opts } = setup([() => reply('{"ok":true}')]);
    await callJson({ ...p, baseUrl: 'https://api.groq.com/openai/v1/chat/completions' }, { ...opts, model: '', models: ['openai/gpt-oss-120b'] });
    const body = JSON.parse((fetchImpl.mock.calls[0] as unknown as [string, RequestInit])[1].body as string);
    expect(body.model).toBe('openai/gpt-oss-120b');
    expect('reasoning_effort' in body).toBe(false);
    expect('chat_template_kwargs' in body).toBe(false);
  });

  it('sends a picture as an image part, and never writes it to the log', async () => {
    const here = { ...p, baseUrl: 'http://eyes/v1/chat/completions' };
    const entries: LogEntry[] = [];
    const { fetchImpl, opts } = setup([() => reply('{"ok":true}')]);
    await callJson(here, { ...opts, messages: [{ role: 'user', content: 'look', image: 'data:image/jpeg;base64,AAAA' }], log: e => entries.push(e) });
    const body = JSON.parse((fetchImpl.mock.calls[0] as unknown as [string, RequestInit])[1].body as string);
    expect(body.messages[0].content).toEqual([{ type: 'text', text: 'look' }, { type: 'image_url', image_url: { url: 'data:image/jpeg;base64,AAAA' } }]);
    expect(JSON.stringify(entries)).not.toContain('AAAA');
    expect(entries[0].messages[0].content).toContain('a picture was attached');
  });

  it('sends text only to a model that refuses pictures, and remembers it', async () => {
    const here = { ...p, baseUrl: 'http://no-eyes/v1/chat/completions' };
    const refuse = () => new Response(JSON.stringify({ error: { message: 'This model does not support image input' } }), { status: 400 });
    const { fetchImpl, opts } = setup([refuse, () => reply('{"ok":true}'), () => reply('{"ok":true}')]);
    const withPicture = { ...opts, messages: [{ role: 'user' as const, content: 'look', image: 'data:image/jpeg;base64,AAAA' }] };
    expect(await callJson(here, withPicture)).toEqual({ ok: true });
    await callJson(here, withPicture);
    const contents = fetchImpl.mock.calls.map(c => JSON.parse((c as unknown as [string, RequestInit])[1].body as string).messages[0].content);
    expect(Array.isArray(contents[0])).toBe(true);
    expect(contents[1]).toBe('look');
    expect(contents[2]).toBe('look');
  });

  it('drops the thinking-off flags when a model refuses them, and remembers it', async () => {
    const refuse = () => new Response(JSON.stringify({ error: { message: 'Reasoning is mandatory for this endpoint and cannot be disabled.' } }), { status: 400 });
    const here = { ...p, baseUrl: 'http://must-think/v1/chat/completions' };
    const { fetchImpl, opts } = setup([refuse, () => reply('{"ok":true}'), () => reply('{"ok":true}')]);
    expect(await callJson(here, opts)).toEqual({ ok: true });
    await callJson(here, opts);
    const bodies = fetchImpl.mock.calls.map(c => JSON.parse((c as unknown as [string, RequestInit])[1].body as string));
    expect(bodies).toHaveLength(3);
    expect(bodies[0].reasoning_effort).toBe('none');
    expect(bodies[1].reasoning_effort).toBeUndefined();
    expect(bodies[2].reasoning_effort).toBeUndefined();
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
    expect(await kindOf(callJson(p, setup([() => reply('', 503)]).opts))).toBe('unavailable');
    expect(await kindOf(callJson(p, setup([() => reply('', 418)]).opts))).toBe('http');
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
