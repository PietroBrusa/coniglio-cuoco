import Rabbit from '../shared/Rabbit';
import { formatMetrics } from '../utils/formatMetrics';
import { useSaveSession } from '../hooks/useSaveSession';
import type { Session } from '../types';
import s from '../styles/shared.module.scss';
import c from './SessionSummary.module.scss';

interface SessionSummaryProps {
  session: Session;
  alreadySaved?: boolean;
  onSaved?: () => void;
  onNewSession: () => void;
}

const SessionSummary = ({ session, alreadySaved, onSaved, onNewSession }: SessionSummaryProps) => {
  const { save, status, error } = useSaveSession(session, { alreadySaved, onSaved });

  return (
    <div className={s.screen}>
      <Rabbit mood="happy" message="Grazie per aver cucinato con me!" />
      <h2>Sessione completata</h2>

      <div className={`${s.card} ${c.sessionMeta}`}>
        <span>
          <strong>Bambino:</strong> {session.childId}
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
            {formatMetrics({ ...lv.metrics, count: lv.metrics.n }).map((m) => (
              <div key={m.label} className={s.metric}>
                <dt>{m.label}</dt>
                <dd>{m.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      ))}

      <p className={`${s.saveStatus} ${status === 'success' ? s.saveOk : ''} ${status === 'error' ? s.saveErr : ''}`}>
        {status === 'pending' && '💾 Salvataggio in corso...'}
        {status === 'success' && '✅ Sessione salvata nel database'}
        {status === 'error' && `⚠️ Salvataggio non riuscito: ${error}`}
        {status === 'idle' && ' '}
      </p>

      <div className={s.rewardActions}>
        {status === 'error' && (
          <button type="button" className={s.btn} onClick={save}>
            Riprova salvataggio ↻
          </button>
        )}
        <button type="button" className={`${s.btn} ${s.btnPrimary}`} onClick={onNewSession}>
          Nuova sessione 🔄
        </button>
      </div>
    </div>
  );
};

export default SessionSummary;
