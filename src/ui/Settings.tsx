import { useEffect, useState } from 'react';
import { ping } from '../ai/calls';
import { autoModels, listModelInfo } from '../ai/models';
import type { ModelInfo } from '../ai/models';
import { AiError } from '../ai/provider';
import { PRESETS, addLog, clearMemory, loadGoodModel, loadTips, logText, saveGoodModel, saveTips } from '../storage';
import type { Settings as SettingsType } from '../storage';

interface Props { settings: SettingsType; used: number; onSave(s: SettingsType): void; onPlay(): void; onMenu(): void; onHelp(): void }

export default function Settings({ settings, used, onSave, onPlay, onMenu, onHelp }: Props) {
  const [s, setS] = useState(settings);
  const [test, setTest] = useState<{ ok: boolean; text: string } | null>(null);
  const [testing, setTesting] = useState(false);
  const [tipsOff, setTipsOff] = useState(() => loadTips().off);
  const set = (patch: Partial<SettingsType>) => { setS({ ...s, ...patch }); setTest(null); };
  const preset = Object.values(PRESETS).find(p => p.baseUrl === s.baseUrl);
  const [models, setModels] = useState<ModelInfo[]>([]);
  // With no model chosen, the game picks one fixed model that fits (on OpenRouter and Gemini).
  const candidates = s.studentModel ? [] : autoModels(s.baseUrl, models);
  const remembered = loadGoodModel(s.baseUrl);
  const auto = candidates.includes(remembered) ? remembered : candidates[0] ?? '';

  // Ask the provider which models it offers, shortly after the address or key stops changing.
  useEffect(() => {
    let current = true;
    const timer = setTimeout(() => { void listModelInfo(s.baseUrl, s.apiKey).then(list => { if (current) setModels(list); }); }, 400);
    return () => { current = false; clearTimeout(timer); };
  }, [s.baseUrl, s.apiKey]);

  async function testConnection() {
    setTesting(true);
    try {
      await ping({
        provider: s, studentModel: s.studentModel, graderModel: s.graderModel || s.studentModel,
        autoModels: candidates, onModel: model => saveGoodModel(s.baseUrl, model), log: s.debugLog ? addLog : undefined,
      });
      setTest({ ok: true, text: 'Connection works.' });
    } catch (e) {
      setTest({ ok: false, text: e instanceof AiError ? e.message : `Something went wrong: ${String(e)}` });
    } finally {
      setTesting(false);
    }
  }

  return (
    <div className="page narrow">
      <div className="row">
        <h1 className="grow">Settings</h1>
        <button onClick={onHelp}>Help: choosing an AI</button>
        <button onClick={onMenu}>Main menu (without saving)</button>
      </div>
      {!s.apiKey && <p className="dim">Choose an AI to play your students. Groq and Google Gemini have free keys; "Help: choosing an AI" explains the options.</p>}
      <div className="panel">
        <label htmlFor="preset">AI provider</label>
        <select id="preset" value={preset ? s.baseUrl : ''} onChange={e => e.target.value && set({ baseUrl: e.target.value })}>
          {Object.values(PRESETS).map(p => <option key={p.baseUrl} value={p.baseUrl}>{p.label}</option>)}
          <option value="">Other (type the address below)</option>
        </select>
        {preset && <p className="dim">{preset.setup}</p>}

        <label htmlFor="url">Address (chat completions URL)</label>
        <input id="url" value={s.baseUrl} onChange={e => set({ baseUrl: e.target.value.trim() })} />

        <label htmlFor="key">API key (stays in this browser, never sent anywhere except the address above)</label>
        <input id="key" type="password" autoComplete="off" value={s.apiKey} onChange={e => set({ apiKey: e.target.value.trim() })} />
        <div className="row">
          <label className="check"><input type="checkbox" checked={s.rememberKey} onChange={e => set({ rememberKey: e.target.checked })} />Remember key on this device</label>
          <button type="button" onClick={() => set({ apiKey: '' })}>Remove key</button>
        </div>

        <label htmlFor="model">Model for students (empty: a suitable model is picked for you on OpenRouter, Gemini and Groq)</label>
        <input id="model" list="models" placeholder="Automatic" value={s.studentModel} onChange={e => set({ studentModel: e.target.value.trim() })} />
        <label htmlFor="grader">Model for grading and for making levels from PDFs (empty: same as students; a stronger model does both better)</label>
        <input id="grader" list="models" placeholder="Same as students" value={s.graderModel} onChange={e => set({ graderModel: e.target.value.trim() })} />
        <datalist id="models">{models.map(m => <option key={m.id} value={m.id} />)}</datalist>
        <p className="dim" role="status">
          {models.length > 0
            ? `${models.length} models found. Click a model box and type to search the list.`
            : 'No model list from this address yet. Check the address and key, or type a model name by hand.'}
        </p>
        {auto && <p className="dim">With no model chosen, the game uses: <b>{auto}</b>{candidates.length > 1 ? `. If it is overloaded, it falls back to: ${candidates.filter(m => m !== auto).join(', ')}` : ''}</p>}

        <label htmlFor="limit">Daily request limit for free models (0 = no limit). Used today: {used}</label>
        <input id="limit" type="number" min={0} value={s.dailyLimit} onChange={e => set({ dailyLimit: Math.max(0, Number(e.target.value) || 0) })} />

        <label className="check"><input type="checkbox" checked={s.thinkingOff} onChange={e => set({ thinkingOff: e.target.checked })} />Ask the model not to "think" first (turn off if the provider rejects requests)</label>
        <label className="check"><input type="checkbox" checked={!tipsOff} onChange={e => { const off = !e.target.checked; setTipsOff(off); saveTips({ off, seen: off ? loadTips().seen : [] }); }} />Show tips during lessons (turning this back on shows every tip again)</label>
        <label className="check"><input type="checkbox" checked={s.forceVision} onChange={e => set({ forceVision: e.target.checked })} />My model can read pictures (drawing on the board is offered only for models that can; Gemini and marked OpenRouter models are detected by themselves)</label>
        <label className="check"><input type="checkbox" checked={s.voiceOn} onChange={e => set({ voiceOn: e.target.checked })} />Students speak aloud (uses your browser's voices; text is always shown)</label>
        <label className="check"><input type="checkbox" checked={s.debugLog} onChange={e => set({ debugLog: e.target.checked })} />Keep a debug log of AI requests (never includes the key)</label>

        <div className="row" style={{ marginTop: 12 }}>
          <button type="button" onClick={testConnection} disabled={testing}>{testing ? 'Testing…' : 'Test connection'}</button>
          <button type="button" onClick={() => navigator.clipboard.writeText(logText())}>Copy debug log</button>
          <button type="button" onClick={() => { clearMemory(); setTest({ ok: true, text: 'Students have forgotten all earlier lessons.' }); }}>Make students forget earlier lessons</button>
          <span className="grow" />
          <button type="button" className="go" onClick={() => { onSave(s); onPlay(); }}>Save and choose a lesson</button>
        </div>
        {test && <p className={test.ok ? 'ok' : 'error'} role="status">{test.text}</p>}
      </div>
    </div>
  );
}
