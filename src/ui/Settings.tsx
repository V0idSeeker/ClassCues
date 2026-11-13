import { useState } from 'react';
import { ping } from '../ai/calls';
import { AiError } from '../ai/provider';
import { PRESETS, addLog, logText } from '../storage';
import type { Settings as SettingsType } from '../storage';

interface Props { settings: SettingsType; used: number; onSave(s: SettingsType): void; onPlay(): void }

export default function Settings({ settings, used, onSave, onPlay }: Props) {
  const [s, setS] = useState(settings);
  const [test, setTest] = useState<{ ok: boolean; text: string } | null>(null);
  const [testing, setTesting] = useState(false);
  const set = (patch: Partial<SettingsType>) => { setS({ ...s, ...patch }); setTest(null); };
  const preset = Object.values(PRESETS).find(p => p.baseUrl === s.baseUrl);

  async function testConnection() {
    setTesting(true);
    try {
      await ping({ provider: s, studentModel: s.studentModel, graderModel: s.graderModel || s.studentModel, log: s.debugLog ? addLog : undefined });
      setTest({ ok: true, text: 'Connection works.' });
    } catch (e) {
      setTest({ ok: false, text: e instanceof AiError ? e.message : `Something went wrong: ${String(e)}` });
    } finally {
      setTesting(false);
    }
  }

  return (
    <div className="page narrow">
      <h1>Settings</h1>
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

        <label htmlFor="model">Model for students</label>
        <input id="model" value={s.studentModel} onChange={e => set({ studentModel: e.target.value.trim() })} />
        <label htmlFor="grader">Model for grading (empty: same as students; a stronger model grades more fairly)</label>
        <input id="grader" value={s.graderModel} onChange={e => set({ graderModel: e.target.value.trim() })} />

        <label htmlFor="limit">Daily request limit for free models (0 = no limit). Used today: {used}</label>
        <input id="limit" type="number" min={0} value={s.dailyLimit} onChange={e => set({ dailyLimit: Math.max(0, Number(e.target.value) || 0) })} />

        <label className="check"><input type="checkbox" checked={s.thinkingOff} onChange={e => set({ thinkingOff: e.target.checked })} />Ask the model not to "think" first (turn off if the provider rejects requests)</label>
        <label className="check"><input type="checkbox" checked={s.debugLog} onChange={e => set({ debugLog: e.target.checked })} />Keep a debug log of AI requests (never includes the key)</label>

        <div className="row" style={{ marginTop: 12 }}>
          <button type="button" onClick={testConnection} disabled={testing || !s.studentModel}>{testing ? 'Testing…' : 'Test connection'}</button>
          <button type="button" onClick={() => navigator.clipboard.writeText(logText())}>Copy debug log</button>
          <span className="grow" />
          <button type="button" className="go" disabled={!s.studentModel} onClick={() => { onSave(s); onPlay(); }}>Save and teach</button>
        </div>
        {test && <p className={test.ok ? 'ok' : 'error'} role="status">{test.text}</p>}
      </div>
    </div>
  );
}
