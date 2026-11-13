import { useState } from 'react';
import { loadSettings, loadUsed, saveSettings } from './storage';
import type { Settings as SettingsType } from './storage';
import Settings from './ui/Settings';

type Screen = 'settings' | 'classroom';

export default function App() {
  const [settings, setSettings] = useState<SettingsType>(loadSettings);
  const [screen, setScreen] = useState<Screen>('settings');
  const [used] = useState(loadUsed);

  return (
    <>
      {screen === 'settings' && (
        <Settings settings={settings} used={used} onSave={s => { saveSettings(s); setSettings(s); }} onPlay={() => setScreen('classroom')} />
      )}
      {screen === 'classroom' && <p className="page">Classroom comes in the next task. Model: {settings.studentModel}</p>}
      <p className="dim footer">Class Is In Session · v{__APP_VERSION__}</p>
    </>
  );
}
