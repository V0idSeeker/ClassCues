export type AiErrorKind = 'network' | 'auth' | 'model' | 'rate' | 'quota' | 'badjson' | 'timeout' | 'http';

export class AiError extends Error {
  kind: AiErrorKind;
  constructor(kind: AiErrorKind, message: string) {
    super(message);
    this.name = 'AiError';
    this.kind = kind;
  }
}

/** baseUrl is the full chat-completions address, e.g. https://openrouter.ai/api/v1/chat/completions */
export interface ProviderSettings { baseUrl: string; apiKey: string; thinkingOff: boolean }
export interface ChatMessage { role: 'system' | 'user'; content: string }
export interface LogEntry { at: string; schema: string; model: string; messages: ChatMessage[]; status: number; response: string }

export interface CallOptions<T> {
  model: string;
  schemaName: string;
  schema: object;
  messages: ChatMessage[];
  /** Shape check. A reply that fails it counts as invalid JSON. */
  guard: (v: unknown) => v is T;
  timeoutMs?: number;
  fetchImpl?: typeof fetch;
  sleep?: (ms: number) => Promise<void>;
  onRequest?: () => void;
  log?: (e: LogEntry) => void;
}

const RATE_WAITS_MS = [5000, 15000];
export const OPENROUTER_DEFAULT_MODEL = 'openrouter/free';
/** Address+model pairs that refused the thinking-off flags. Remembered so each later call costs one request, not two. */
const mustThink = new Set<string>();

function parseContent(responseText: string): unknown {
  try {
    const content = JSON.parse(responseText).choices?.[0]?.message?.content;
    if (typeof content !== 'string') return undefined;
    return JSON.parse(content.replace(/^\s*```(?:json)?\s*|\s*```\s*$/g, ''));
  } catch {
    return undefined;
  }
}

export async function callJson<T>(p: ProviderSettings, o: CallOptions<T>): Promise<T> {
  const doFetch = o.fetchImpl ?? fetch;
  const sleep = o.sleep ?? ((ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms)));
  // No model chosen: on OpenRouter use its free-models router; elsewhere send none and let the server decide.
  const model = o.model || (p.baseUrl.includes('openrouter.ai') ? OPENROUTER_DEFAULT_MODEL : '');
  const target = `${p.baseUrl}|${model}`;
  const makeBody = () => JSON.stringify({
    ...(model ? { model } : {}),
    messages: o.messages,
    response_format: { type: 'json_schema', json_schema: { name: o.schemaName, strict: true, schema: o.schema } },
    // Reasoning models burn the token budget thinking and return empty content otherwise.
    ...(p.thinkingOff && !mustThink.has(target) ? { reasoning_effort: 'none', chat_template_kwargs: { enable_thinking: false } } : {}),
  });
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (p.apiKey) headers.Authorization = `Bearer ${p.apiKey}`;

  let badAnswers = 0;
  let rateRetries = 0;
  for (;;) {
    const abort = new AbortController();
    const timer = setTimeout(() => abort.abort(), o.timeoutMs ?? 90000);
    let res: Response;
    let text: string;
    o.onRequest?.();
    try {
      res = await doFetch(p.baseUrl, { method: 'POST', headers, body: makeBody(), signal: abort.signal });
      text = await res.text();
    } catch {
      if (abort.signal.aborted) throw new AiError('timeout', 'The AI took too long to answer (over 90 seconds).');
      throw new AiError('network', 'Could not reach the AI address. Check the URL. For a local model, the browser or the model server may be blocking this page: see the setup steps in Settings.');
    } finally {
      clearTimeout(timer);
    }
    o.log?.({ at: new Date().toISOString(), schema: o.schemaName, model, messages: o.messages, status: res.status, response: text });

    // Some models refuse to have thinking turned off. Send the same request again without those flags.
    if (res.status === 400 && p.thinkingOff && !mustThink.has(target) && /reasoning|thinking|chat_template_kwargs/i.test(text)) {
      mustThink.add(target);
      continue;
    }
    if (res.status === 429) {
      if (rateRetries < RATE_WAITS_MS.length) {
        await sleep(RATE_WAITS_MS[rateRetries++]);
        continue;
      }
      throw new AiError('rate', 'The AI provider says: too many requests. Wait a minute, or check your daily limit.');
    }
    if (res.status === 401 || res.status === 403) throw new AiError('auth', 'The AI provider rejected the key. Check the API key in Settings.');
    if (res.status === 402) throw new AiError('quota', 'This model needs credit and the account has none (or has reached its limit). Pick a model ending in :free, leave the model empty, or add credit at your provider.');
    if (res.status === 404 || (res.status === 400 && /model/i.test(text))) throw new AiError('model', 'The AI provider does not know this model name. Check the model in Settings.');
    if (!res.ok) throw new AiError('http', `The AI provider answered with error ${res.status}.`);

    const value = parseContent(text);
    if (value !== undefined && o.guard(value)) return value;
    if (badAnswers++ < 1) continue;
    throw new AiError('badjson', 'The AI answered in a format the game cannot read, twice. Try again, or pick a stronger model.');
  }
}
