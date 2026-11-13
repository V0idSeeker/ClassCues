/** Model names the provider offers, from its OpenAI-compatible /models address. Empty list if it cannot be read. */
export async function listModels(baseUrl: string, apiKey: string, fetchImpl: typeof fetch = fetch): Promise<string[]> {
  try {
    const res = await fetchImpl(baseUrl.replace(/\/chat\/completions\/?$/, '/models'), {
      headers: apiKey ? { Authorization: `Bearer ${apiKey}` } : {},
    });
    if (!res.ok) return [];
    const data: unknown = (await res.json()).data;
    if (!Array.isArray(data)) return [];
    return data.map(m => String((m as { id?: unknown })?.id ?? '')).filter(Boolean).sort();
  } catch {
    return [];
  }
}
