/** Model names the provider offers, from its OpenAI-compatible /models address. Empty list if it cannot be read. */
export async function listModels(baseUrl: string, apiKey: string, fetchImpl: typeof fetch = fetch): Promise<string[]> {
  try {
    const res = await fetchImpl(baseUrl.replace(/\/chat\/completions\/?$/, '/models'), {
      headers: apiKey ? { Authorization: `Bearer ${apiKey}` } : {},
    });
    if (!res.ok) return [];
    const data: unknown = (await res.json()).data;
    if (!Array.isArray(data)) return [];
    const ids = data.map(m => String((m as { id?: unknown })?.id ?? '')).filter(Boolean).sort();
    // Free models first, so a player without credit sees what they can use.
    return [...ids.filter(id => id.endsWith(':free')), ...ids.filter(id => !id.endsWith(':free'))];
  } catch {
    return [];
  }
}
