import { useState } from 'react';
import Rabbit from '../shared/Rabbit';
import { DEFAULT_SETTINGS, loadSettings, saveSettings } from '../game/settings';
import type { AppSettings } from '../game/settings';
import s from '../styles/shared.module.scss';
import c from './SettingsScreen.module.scss';

interface SettingsScreenProps {
  /** Called when the therapist leaves the settings screen. */
  onBack: () => void;
}

/**
 * Settings screen: lets the therapist tune the star-rating thresholds and toggle
 * the victory sound. Values are edited in friendly units (seconds / percent) and
 * persisted to localStorage via {@link saveSettings}.
 */
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
        <h3>Stelle ⭐</h3>
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

        <label className={c.field}>
          <span className={c.fieldLabel}>
            3ª stella — contatto sostenuto (livelli “a tocchi” / difficile)
            <small>Tempo totale di contatto richiesto.</small>
          </span>
          <span className={c.inputWrap}>
            <input
              type="number"
              min="0"
              step="0.5"
              value={draft.tapContactMs / 1000}
              onChange={(e) =>
                update({ tapContactMs: Math.max(0, Number(e.target.value) * 1000) })
              }
            />
            <span className={c.unit}>secondi</span>
          </span>
        </label>

        <h3>Suoni 🔊</h3>
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
        {saved && <p className={c.savedMsg}>Impostazioni salvate ✓</p>}
      </div>

      <button type="button" className={s.btn} onClick={onBack}>
        ← Torna indietro
      </button>
    </div>
  );
};

export default SettingsScreen;
