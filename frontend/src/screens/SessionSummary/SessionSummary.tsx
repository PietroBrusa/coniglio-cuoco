import { useMemo, useState } from 'react';
import Rabbit from '@/components/Rabbit/Rabbit';
import { formatMetrics } from '@/domain/formatMetrics';
import { useSaveSession } from '@/hooks/useSaveSession';
import { annotateSession } from '@/domain/sessionRecord';
import { PROBLEM_BEHAVIORS, toggleProblemBehavior } from '@/domain/problemBehaviors';
import type { Session } from '@/types';
import s from '@/app/styles/shared.module.scss';
import c from './SessionSummary.module.scss';

/** Che cosa serve alla schermata di riepilogo. */
interface SessionSummaryProps {
  /** Sessione conclusa, con i risultati di tutti i livelli. */
  session: Session;
  /** La sessione è già stata scritta nel database. */
  alreadySaved?: boolean;
  /** Richiamata a salvataggio riuscito. */
  onSaved?: () => void;
  /** Chiude la sessione e torna al setup. */
  onNewSession: () => void;
}

/**
 * Riepilogo di fine sessione: misurazioni di ogni livello, comportamenti
 * problema osservati, note e salvataggio.
 *
 * È il punto in cui il record diventa completo. I comportamenti problema si
 * raccolgono qui e non durante il gioco perché richiedono uno sguardo
 * d'insieme; solo dopo la sessione viene scritta nel database, una volta sola e
 * con una sola richiesta.
 */
const SessionSummary = ({ session, alreadySaved, onSaved, onNewSession }: SessionSummaryProps) => {
  const [problemBehaviors, setProblemBehaviors] = useState<string[]>([]);
  const [notes, setNotes] = useState('');

  const annotated = useMemo(
    () => annotateSession(session, { problemBehaviors, notes }),
    [session, problemBehaviors, notes],
  );

  const { save, status, error } = useSaveSession(annotated, { alreadySaved, onSaved });
  const saved = status === 'success';

  return (
    <div className={s.screen}>
      <Rabbit mood="happy" message="Grazie per aver cucinato con me!" />
      <h2>Sessione completata</h2>

      <div className={`${s.card} ${c.sessionMeta}`}>
        <span>
          <strong>Bambino:</strong> {session.childId}
        </span>
        <span>
          <strong>Terapista:</strong> {session.therapist || '—'}
        </span>
        <span>
          <strong>Sessione:</strong> n. {session.sessionNumber}
        </span>
        <span>
          <strong>Alimento:</strong> {session.food}
        </span>
        <span>
          <strong>Data:</strong> {new Date(session.date).toLocaleString('it-IT')}
        </span>
      </div>

      {session.levels.map((lv) => (
        <div key={lv.levelId} className={`${s.card} ${s.metricsSummary}`}>
          <h3>
            Livello {lv.levelId} · {lv.levelName}
          </h3>
          <dl className={s.metricsGrid}>
            {formatMetrics(lv.metrics).map((m) => (
              <div key={m.label} className={s.metric}>
                <dt>{m.label}</dt>
                <dd>{m.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      ))}

      <fieldset className={`${s.card} ${c.behaviors}`} disabled={saved}>
        <legend>Comportamenti osservati</legend>
        <p className={c.behaviorsHint}>
          Seleziona i comportamenti problema emersi durante la sessione.
        </p>

        <div className={c.behaviorList}>
          {PROBLEM_BEHAVIORS.map((b) => {
            const checked = problemBehaviors.includes(b.id);
            return (
              <label key={b.id} className={`${c.behavior} ${checked ? c.behaviorChecked : ''}`}>
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => setProblemBehaviors((prev) => toggleProblemBehavior(prev, b.id))}
                />
                <span className={s.foodChipEmoji}>{b.emoji}</span>
                {b.label}
              </label>
            );
          })}
        </div>

        <label className={c.notesLabel}>
          Note
          <textarea
            rows={3}
            placeholder="Osservazioni aggiuntive (facoltativo)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </label>
      </fieldset>

      <p
        className={`${s.saveStatus} ${saved ? s.saveOk : ''} ${status === 'error' ? s.saveErr : ''}`}
      >
        {status === 'idle' && '📝 Compila i comportamenti osservati, poi salva la sessione'}
        {status === 'pending' && '💾 Salvataggio in corso...'}
        {saved && '✅ Sessione salvata nel database'}
        {status === 'error' && `⚠️ Salvataggio non riuscito: ${error}`}
      </p>

      <div className={s.rewardActions}>
        {!saved && (
          <button
            type="button"
            className={`${s.btn} ${s.btnPrimary}`}
            onClick={save}
            disabled={status === 'pending'}
          >
            {status === 'error' ? 'Riprova salvataggio ↻' : '💾 Salva sessione'}
          </button>
        )}
        <button
          type="button"
          className={`${s.btn} ${saved ? s.btnPrimary : ''}`}
          onClick={onNewSession}
        >
          Nuova sessione 🔄
        </button>
      </div>
    </div>
  );
};

export default SessionSummary;
