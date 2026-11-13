export interface ModelInfo {
  id: string;
  /** Costs nothing on OpenRouter (name ends in ":free"). */
  free: boolean;
  /** The provider says this model supports the strict answer format the game needs. */
  structured: boolean;
}

/** Models the provider offers, from its OpenAI-compatible /models address, free ones first. Empty if it cannot be read. */
export async function listModelInfo(baseUrl: string, apiKey: string, fetchImpl: typeof fetch = fetch): Promise<ModelInfo[]> {
  try {
    const res = await fetchImpl(baseUrl.replace(/\/chat\/completions\/?$/, '/models'), {
      headers: apiKey ? { Authorization: `Bearer ${apiKey}` } : {},
    });
    if (!res.ok) return [];
    const data: unknown = (await res.json()).data;
    if (!Array.isArray(data)) return [];
    const models = data
      .map(m => {
        const entry = m as { id?: unknown; supported_parameters?: unknown };
        const id = String(entry?.id ?? '');
        const params = Array.isArray(entry?.supported_parameters) ? entry.supported_parameters : [];
        return { id, free: id.endsWith(':free'), structured: params.includes('structured_outputs') };
      })
      .filter(m => m.id)
      .sort((a, b) => a.id.localeCompare(b.id));
    return [...models.filter(m => m.free), ...models.filter(m => !m.free)];
  } catch {
    return [];
  }
}

/**
 * Gemini's default when the player chooses no model: the newest general "flash" model.
 * Flash models are the fast ones with the largest free allowance.
 */
export function pickGeminiDefault(models: ModelInfo[]): string | null {
  const special = /lite|image|tts|audio|live|embedding|vision|exp|preview|thinking|robotics|computer/i;
  const fit = models.map(m => m.id).filter(id => /gemini-[\d.]+-flash/i.test(id) && !special.test(id));
  const version = (id: string) => Number(id.match(/gemini-([\d.]+)-flash/i)?.[1] ?? 0);
  return fit.sort((a, b) => version(b) - version(a) || a.localeCompare(b))[0] ?? null;
}

/** The model the game uses when the player leaves the model box empty. Empty text means "let the provider decide". */
export function autoModel(baseUrl: string, models: ModelInfo[]): string {
  if (baseUrl.includes('openrouter.ai')) return pickFreeDefault(models) ?? '';
  if (baseUrl.includes('generativelanguage.googleapis.com')) return pickGeminiDefault(models) ?? '';
  return '';
}

/** Size in billions of parameters when the model name states it: "lfm-3-1.7b:free" gives 1.7. */
export function statedSize(id: string): number | null {
  const m = id.match(/(?:^|[-_/])(\d+(?:\.\d+)?)b(?=[-_:]|$)/i);
  return m ? Number(m[1]) : null;
}

const MIN_SIZE = 8;

/**
 * The model used when the player chooses none: a free model that supports the game's answer format
 * and is not tiny. Always the same one, so students behave the same from call to call.
 */
export function pickFreeDefault(models: ModelInfo[]): string | null {
  const fit = models.filter(m => m.free && m.structured && (statedSize(m.id) ?? MIN_SIZE) >= MIN_SIZE).map(m => m.id).sort();
  return fit[0] ?? null;
}
