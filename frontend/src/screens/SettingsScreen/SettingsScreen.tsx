import { useState } from 'react';
import Rabbit from '@/components/Rabbit/Rabbit';
import { DEFAULT_SETTINGS, loadSettings, saveSettings } from '@/storage/settings';
import type { AppSettings } from '@/storage/settings';
import s from '@/app/styles/shared.module.scss';
import c from './SettingsScreen.module.scss';

interface SettingsScreenProps {
  onBack: () => void;
}

const SettingsScreen = ({ onBack }: SettingsScreenProps) => {
  const [draft, setDraft] = useState<AppSettings>(() => loadSettings());
  const [saved, setSaved] = useState(false);

  const update = (patch: Partial<AppSettings>) => {
    setDraft((prev) => ({ ...prev, ...patch }));
    setSaved(false);
  };

  const handleSave = () => {
    saveSettings(draft);
    setSaved(true);
  };

  const handleReset = () => {
    setDraft({ ...DEFAULT_SETTINGS });
    setSaved(false);
  };

  return (
    <div className={s.screen}>
      <Rabbit mood="happy" message="Regoliamo le stelle!" />
      <h1>Impostazioni</h1>

      <div className={`${s.card} ${c.form}`}>
        <h3>Stelle</h3>
        <p className={c.intro}>
          Ogni livello completato vale <strong>1 stella</strong>. Le altre due si
          guadagnano con un approccio pronto e con un contatto prolungato: qui
          decidi quanto essere generoso.
        </p>

        <label className={c.field}>
          <span className={c.fieldLabel}>
            2ª stella — approccio pronto
            <small>Tempo massimo per il primo tocco.</small>
          </span>
          <span className={c.inputWrap}>
            <input
              type="number"
              min="0.5"
              step="0.5"
              value={draft.promptLatencyMs / 1000}
              onChange={(e) =>
                update({ promptLatencyMs: Math.max(0, Number(e.target.value) * 1000) })
              }
            />
            <span className={c.unit}>secondi</span>
          </span>
        </label>

        <label className={c.field}>
          <span className={c.fieldLabel}>
            3ª stella — contatto sostenuto (livelli “tieni premuto”)
            <small>Percentuale di tempo a contatto con il cibo.</small>
          </span>
          <span className={c.inputWrap}>
            <input
              type="number"
              min="0"
              max="100"
              step="5"
              value={draft.holdEngagementPct}
              onChange={(e) =>
                update({
                  holdEngagementPct: Math.min(100, Math.max(0, Number(e.target.value))),
                })
              }
            />
            <span className={c.unit}>%</span>
          </span>
        </label>

        <h3>Suoni</h3>
        <label className={c.toggle}>
          <input
            type="checkbox"
            checked={draft.soundEnabled}
            onChange={(e) => update({ soundEnabled: e.target.checked })}
          />
          Suono di vittoria a fine livello
        </label>

        <div className={c.actions}>
          <button type="button" className={s.btn} onClick={handleReset}>
            Ripristina predefiniti
          </button>
          <button type="button" className={`${s.btn} ${s.btnPrimary}`} onClick={handleSave}>
            Salva
          </button>
        </div>
        {saved && <p className={c.savedMsg}>Impostazioni salvate</p>}
      </div>

      <button type="button" className={s.btn} onClick={onBack}>
        Torna indietro
      </button>
    </div>
  );
};

export default SettingsScreen;
