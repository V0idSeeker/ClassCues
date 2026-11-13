export type AiErrorKind = 'network' | 'auth' | 'model' | 'rate' | 'quota' | 'badjson' | 'timeout' | 'unavailable' | 'http';

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
/** image: a picture sent along with the text, as a data URL. Only models that read pictures get it. */
export interface ChatMessage { role: 'system' | 'user'; content: string; image?: string }
export interface LogEntry { at: string; schema: string; model: string; messages: ChatMessage[]; status: number; response: string }

export interface CallOptions<T> {
  /** The model the player chose. Empty: use `models`, or the provider's default. */
  model: string;
  /** Models to try in order when the player chose none. If one is overloaded or silent, the next is tried. */
  models?: string[];
  /** Told which automatically chosen model answered, so it can be remembered. */
  onModel?: (model: string) => void;
  /** false: fail at once when the provider is busy, instead of waiting and retrying. Used when asking several models at once. */
  patient?: boolean;
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

const BAD_JSON_MESSAGE = 'The AI answered in a format the game cannot read, twice. Try again, or pick a stronger model.';
/** Waits before asking again when the provider says "too many requests" or "overloaded". */
const BUSY_WAITS_MS = [5000, 15000];
export const OPENROUTER_DEFAULT_MODEL = 'openrouter/free';
/** From Google's own example for its OpenAI-compatible address. Used only when the model list cannot be read. */
export const GEMINI_DEFAULT_MODEL = 'gemini-3.8-flash';
export const isOpenRouter = (baseUrl: string) => baseUrl.includes('openrouter.ai');
export const isGemini = (baseUrl: string) => baseUrl.includes('generativelanguage.googleapis.com');
export const isGroq = (baseUrl: string) => baseUrl.includes('api.groq.com');

/**
 * How to ask a model to think as little as possible. Providers differ:
 * Gemini's newer models cannot turn thinking off, and it does not know llama.cpp's chat_template_kwargs.
 */
function lessThinking(baseUrl: string): object {
  if (isGemini(baseUrl)) return { reasoning_effort: 'low' };
  // Groq's models differ in which thinking options they accept, so none is sent.
  if (isGroq(baseUrl)) return {};
  return { reasoning_effort: 'none', chat_template_kwargs: { enable_thinking: false } };
}
/** Address+model pairs that refused the thinking-off flags. Remembered so each later call costs one request, not two. */
const mustThink = new Set<string>();
/** Address+model pairs that refused the strict schema format. They get plain JSON mode with the schema written in the prompt. */
const plainJson = new Set<string>();
/** Address+model pairs that refused a picture. They get the text only. */
const noImages = new Set<string>();

function parseContent(responseText: string): unknown {
  try {
    const content = JSON.parse(responseText).choices?.[0]?.message?.content;
    if (typeof content !== 'string') return undefined;
    return JSON.parse(content.replace(/^\s*```(?:json)?\s*|\s*```\s*$/g, ''));
  } catch {
    return undefined;
  }
}

/** The automatically chosen model that last answered, per provider address. It is tried first. */
const working = new Map<string, string>();
export function preferModel(baseUrl: string, model: string): void {
  if (model) working.set(baseUrl, model);
}

const FULL_TIMEOUT_MS = 90000;
/** With other models to fall back on, do not wait long for a silent one. */
const FALLBACK_TIMEOUT_MS = 40000;
const TRY_NEXT: AiErrorKind[] = ['timeout', 'unavailable', 'model', 'rate', 'badjson'];

export async function callJson<T>(p: ProviderSettings, o: CallOptions<T>): Promise<T> {
  if (o.model) return callModel(p, o, o.model, o.timeoutMs ?? FULL_TIMEOUT_MS, o.patient ?? true);

  // No model chosen: try the given candidates, else the provider's default, else send none and let the server decide.
  const given = o.models && o.models.length > 0 ? o.models
    : [isOpenRouter(p.baseUrl) ? OPENROUTER_DEFAULT_MODEL : isGemini(p.baseUrl) ? GEMINI_DEFAULT_MODEL : ''];
  const first = working.get(p.baseUrl);
  const list = first && given.includes(first) ? [first, ...given.filter(m => m !== first)] : given;
  const timeoutMs = list.length > 1 ? Math.min(o.timeoutMs ?? FULL_TIMEOUT_MS, FALLBACK_TIMEOUT_MS) : o.timeoutMs ?? FULL_TIMEOUT_MS;
  if (list.length === 1) return finish(await callModel(p, o, list[0], timeoutMs, o.patient ?? true), list[0]);

  // Several candidates: move on at once when one is busy. If all are busy, wait and go round again.
  const sleep = o.sleep ?? ((ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms)));
  for (let round = 0; ; round++) {
    let lastError: unknown;
    for (const model of list) {
      try {
        return finish(await callModel(p, o, model, timeoutMs, false), model);
      } catch (e) {
        if (!(e instanceof AiError) || !TRY_NEXT.includes(e.kind)) throw e;
        lastError = e;
      }
    }
    if (round >= BUSY_WAITS_MS.length) throw lastError;
    await sleep(BUSY_WAITS_MS[round]);
  }

  function finish(value: T, model: string): T {
    if (model) { working.set(p.baseUrl, model); o.onModel?.(model); }
    return value;
  }
}

async function callModel<T>(p: ProviderSettings, o: CallOptions<T>, model: string, timeoutMs: number, patient: boolean): Promise<T> {
  const doFetch = o.fetchImpl ?? fetch;
  const sleep = o.sleep ?? ((ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms)));
  const target = `${p.baseUrl}|${model}`;
  const hasImage = o.messages.some(m => m.image);
  // The OpenAI format for a message with a picture: a list of parts instead of plain text.
  const wire = (list: ChatMessage[]) => list.map(m => (m.image && !noImages.has(target)
    ? { role: m.role, content: [{ type: 'text', text: m.content }, { type: 'image_url', image_url: { url: m.image } }] }
    : { role: m.role, content: m.content }));
  const makeBody = () => JSON.stringify({
    ...(model ? { model } : {}),
    ...(plainJson.has(target)
      ? {
          messages: wire([...o.messages, { role: 'system', content: `Reply with one JSON object only, no other text. It must match this JSON schema exactly:\n${JSON.stringify(o.schema)}` }]),
          response_format: { type: 'json_object' },
        }
      : {
          messages: wire(o.messages),
          response_format: { type: 'json_schema', json_schema: { name: o.schemaName, strict: true, schema: o.schema } },
        }),
    // Reasoning models burn the token budget thinking and return empty content otherwise.
    ...(p.thinkingOff && !mustThink.has(target) ? lessThinking(p.baseUrl) : {}),
  });
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (p.apiKey) headers.Authorization = `Bearer ${p.apiKey}`;

  let badAnswers = 0;
  let busyRetries = 0;
  for (;;) {
    const abort = new AbortController();
    const timer = setTimeout(() => abort.abort(), timeoutMs);
    let res: Response;
    let text: string;
    o.onRequest?.();
    try {
      res = await doFetch(p.baseUrl, { method: 'POST', headers, body: makeBody(), signal: abort.signal });
      text = await res.text();
    } catch {
      if (abort.signal.aborted) throw new AiError('timeout', 'The AI took too long to answer. Try again, or pick another model in Settings.');
      throw new AiError('network', 'Could not reach the AI address. Check the URL. For a local model, the browser or the model server may be blocking this page: see the setup steps in Settings.');
    } finally {
      clearTimeout(timer);
    }
    o.log?.({ at: new Date().toISOString(), schema: o.schemaName, model, messages: o.messages.map(m => (m.image ? { role: m.role, content: `${m.content} [a picture was attached]` } : m)), status: res.status, response: text });

    // A model that cannot read pictures refuses the request. Send it again as text only.
    if (hasImage && !noImages.has(target) && [400, 404, 415, 422].includes(res.status) && /image|vision|multimodal|modalit|content.{0,40}(string|array)/i.test(text)) {
      noImages.add(target);
      continue;
    }

    // Some models refuse to have thinking turned off. Send the same request again without those flags.
    if (res.status === 400 && p.thinkingOff && !mustThink.has(target) && /reasoning|thinking|chat_template_kwargs/i.test(text)) {
      mustThink.add(target);
      continue;
    }
    // Some models do not support the strict schema format. Ask again in plain JSON mode with the schema in the prompt.
    if (res.status === 400 && !plainJson.has(target) && /response_format|json_schema|json schema|structured output/i.test(text)) {
      plainJson.add(target);
      continue;
    }
    if ((res.status === 429 || res.status >= 500) && patient && busyRetries < BUSY_WAITS_MS.length) {
      await sleep(BUSY_WAITS_MS[busyRetries++]);
      continue;
    }
    if (res.status === 429) {
      throw new AiError('rate', 'The AI provider says: too many requests. Wait a minute, or check your daily limit.');
    }
    // Some providers check the JSON themselves and answer 400 when the model wrote something invalid. Same as a bad answer.
    if (res.status === 400 && /json_validate_failed|failed to generate json/i.test(text)) {
      if (badAnswers++ < 1) continue;
      throw new AiError('badjson', BAD_JSON_MESSAGE);
    }
    if (res.status === 401 || res.status === 403) throw new AiError('auth', 'The AI provider rejected the key. Check the API key in Settings.');
    if (res.status === 402) throw new AiError('quota', 'This model needs credit and the account has none (or has reached its limit). Pick a model ending in :free, leave the model empty, or add credit at your provider.');
    if (res.status === 404 || (res.status === 400 && /model/i.test(text))) throw new AiError('model', 'The AI provider does not know this model, or no model could be picked automatically. Choose a model from the list in Settings.');
    if (res.status >= 500) throw new AiError('unavailable', 'The AI provider is overloaded or down right now. Try again in a moment, or pick another model in Settings.');
    if (!res.ok) throw new AiError('http', `The AI provider answered with error ${res.status}.`);

    const value = parseContent(text);
    if (value !== undefined && o.guard(value)) return value;
    if (badAnswers++ < 1) continue;
    throw new AiError('badjson', BAD_JSON_MESSAGE);
  }
}
