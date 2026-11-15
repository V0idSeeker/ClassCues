import { useEffect, useState } from 'react';
import { ping } from '../ai/calls';
import { autoModels, listModelInfo } from '../ai/models';
import type { ModelInfo } from '../ai/models';
import { AiError } from '../ai/provider';
import { PRESETS, addLog, clearMemory, loadGoodModel, loadSkipPrepare, loadTips, logText, saveSkipPrepare, saveGoodModel, saveTips } from '../storage';
import type { Settings as SettingsType } from '../storage';
import type { Difficulty } from '../game/types';
import { LANGS, t } from '../i18n';
import type { Key, Lang } from '../i18n';

const DIFFICULTIES: Difficulty[] = ['easy', 'normal', 'hard', 'inspection'];

interface Props { settings: SettingsType; used: number; onSave(s: SettingsType): void; onPlay(): void; onMenu(): void; onHelp(): void; onLanguage(lang: Lang): void }

export default function Settings({ settings, used, onSave, onPlay, onMenu, onHelp, onLanguage }: Props) {
  const [s, setS] = useState(settings);
  const [test, setTest] = useState<{ ok: boolean; text: string } | null>(null);
  const [testing, setTesting] = useState(false);
  const [tipsOff, setTipsOff] = useState(() => loadTips().off);
  const [skipPrepare, setSkipPrepare] = useState(loadSkipPrepare);
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
      setTest({ ok: true, text: t('settings.works') });
    } catch (e) {
      setTest({ ok: false, text: e instanceof AiError ? e.message : t('common.somethingWrong', { error: String(e) }) });
    } finally {
      setTesting(false);
    }
  }

  return (
    <div className="page narrow">
      <div className="row">
        <h1 className="grow">{t('settings.title')}</h1>
        <button onClick={onHelp}>{t('settings.helpAi')}</button>
        <button onClick={onMenu}>{t('settings.menuNoSave')}</button>
      </div>
      {!s.apiKey && <p className="dim">{t('settings.chooseAi')}</p>}
      <div className="panel">
        <label htmlFor="lang">{t('settings.language')}</label>
        <select id="lang" value={s.language} onChange={e => { const language = e.target.value as Lang; set({ language }); onLanguage(language); }}>
          {LANGS.map(l => <option key={l.id} value={l.id} lang={l.id}>{l.name}</option>)}
        </select>

        <label htmlFor="preset">{t('settings.provider')}</label>
        <select id="preset" value={preset ? s.baseUrl : ''} onChange={e => e.target.value && set({ baseUrl: e.target.value })}>
          {Object.values(PRESETS).map(p => <option key={p.baseUrl} value={p.baseUrl}>{p.label}</option>)}
          <option value="">{t('settings.other')}</option>
        </select>
        {preset && <p className="dim">{preset.setup}</p>}

        <label htmlFor="url">{t('settings.address')}</label>
        <input id="url" value={s.baseUrl} onChange={e => set({ baseUrl: e.target.value.trim() })} />

        <label htmlFor="key">{t('settings.key')}</label>
        <input id="key" type="password" autoComplete="off" value={s.apiKey} onChange={e => set({ apiKey: e.target.value.trim() })} />
        <div className="row">
          <label className="check"><input type="checkbox" checked={s.rememberKey} onChange={e => set({ rememberKey: e.target.checked })} />{t('settings.rememberKey')}</label>
          <button type="button" onClick={() => set({ apiKey: '' })}>{t('settings.removeKey')}</button>
        </div>

        <label htmlFor="model">{t('settings.studentModel')}</label>
        <input id="model" list="models" placeholder={t('settings.automatic')} value={s.studentModel} onChange={e => set({ studentModel: e.target.value.trim() })} />
        <label htmlFor="grader">{t('settings.graderModel')}</label>
        <input id="grader" list="models" placeholder={t('settings.sameAsStudents')} value={s.graderModel} onChange={e => set({ graderModel: e.target.value.trim() })} />
        <datalist id="models">{models.map(m => <option key={m.id} value={m.id} />)}</datalist>
        <p className="dim" role="status">
          {models.length > 0
            ? t('settings.modelsFound', { count: models.length })
            : t('settings.noModels')}
        </p>
        {auto && <p className="dim">{t('settings.autoModel')} <b>{auto}</b>{candidates.length > 1 ? t('settings.fallback', { models: candidates.filter(m => m !== auto).join(', ') }) : ''}</p>}

        <label htmlFor="limit">{t('settings.limit', { used })}</label>
        <input id="limit" type="number" min={0} value={s.dailyLimit} onChange={e => set({ dailyLimit: Math.max(0, Number(e.target.value) || 0) })} />

        <fieldset className="difficulty">
          <legend>{t('settings.difficulty')}</legend>
          {DIFFICULTIES.map(d => (
            <label key={d} className="check"><input type="radio" name="difficulty" checked={s.difficulty === d} onChange={() => set({ difficulty: d })} /><b>{t(`difficulty.${d}`)}</b>: {t(`difficulty.${d}.line` as Key)}</label>
          ))}
        </fieldset>

        <label className="check"><input type="checkbox" checked={s.thinkingOff} onChange={e => set({ thinkingOff: e.target.checked })} />{t('settings.thinkingOff')}</label>
        <label className="check"><input type="checkbox" checked={!tipsOff} onChange={e => { const off = !e.target.checked; setTipsOff(off); saveTips({ off, seen: off ? loadTips().seen : [] }); }} />{t('settings.tips')}</label>
        <label className="check"><input type="checkbox" checked={!skipPrepare} onChange={e => { setSkipPrepare(!e.target.checked); saveSkipPrepare(!e.target.checked); }} />{t('settings.study')}</label>
        <label className="check"><input type="checkbox" checked={s.forceVision} onChange={e => set({ forceVision: e.target.checked })} />{t('settings.vision')}</label>
        <label className="check"><input type="checkbox" checked={s.voiceOn} onChange={e => set({ voiceOn: e.target.checked })} />{t('settings.voice')}</label>
        <label className="check"><input type="checkbox" checked={s.debugLog} onChange={e => set({ debugLog: e.target.checked })} />{t('settings.debug')}</label>

        <div className="row" style={{ marginTop: 12 }}>
          <button type="button" onClick={testConnection} disabled={testing}>{testing ? t('settings.testing') : t('settings.test')}</button>
          <button type="button" onClick={() => navigator.clipboard.writeText(logText())}>{t('settings.copyLog')}</button>
          <button type="button" onClick={() => { clearMemory(); setTest({ ok: true, text: t('settings.forgotten') }); }}>{t('settings.forget')}</button>
          <span className="grow" />
          <button type="button" className="go" onClick={() => { onSave(s); onPlay(); }}>{t('settings.save')}</button>
        </div>
        {test && <p className={test.ok ? 'ok' : 'error'} role="status">{test.text}</p>}
      </div>
    </div>
  );
}
