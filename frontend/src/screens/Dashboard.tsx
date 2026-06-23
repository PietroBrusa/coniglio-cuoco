import { useState } from 'react';
import Rabbit from '../shared/Rabbit';
import { useDeleteSession, useSessions } from '../hooks/useSessions';
import { getFood } from '../game/levels';
import { downloadCsv, downloadJson, formatMetrics } from '../utils/exportSession';
import type { SavedSession } from '../api/client';
import s from '../styles/shared.module.scss';
import c from './Dashboard.module.scss';

interface DashboardProps {
  /** Child identifier used to label the view (child scoping is enforced server-side). */
  childId: string;
  /** Called when the back button is pressed (navigates to setup). */
  onBack: () => void;
}

/**
 * Saved-session dashboard: expandable session list with per-level metric detail,
 * CSV / JSON export and individual session deletion.
 */
const Dashboard = ({ childId, onBack }: DashboardProps) => {
  const { data, isLoading, isError, error, refetch, isFetching } = useSessions(childId);
  const deleteMutation = useDeleteSession();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const sessions = data ?? [];

  const handleDelete = (session: SavedSession) => {
    const when = new Date(session.date).toLocaleString('it-IT');
    if (window.confirm(`Eliminare la sessione n.${session.sessionNumber} (${session.food}, ${when})?\nL'operazione è definitiva.`)) {
      deleteMutation.mutate(session._id);
    }
  };

  return (
    <div className={s.screen}>
      <Rabbit mood="happy" message={`Sessioni di ${childId}`} />
      <h2>Sessioni di {childId}</h2>

      <div className={c.dashHeader}>
        <button type="button" className={s.btn} onClick={() => refetch()} disabled={isFetching}>
          {isFetching ? '⏳' : '↻'} Aggiorna
        </button>
      </div>

      {isLoading && <p className={c.muted}>Caricamento…</p>}
      {isError && (
        <p className={s.saveErr}>
          ⚠️ Impossibile caricare le sessioni: {error instanceof Error ? error.message : 'errore'}
        </p>
      )}
      {!isLoading && !isError && sessions.length === 0 && (
        <p className={c.muted}>Nessuna sessione salvata per questo bambino.</p>
      )}

      {sessions.map((session: SavedSession) => {
        const food = getFood(session.foodId);
        const open = expandedId === session._id;
        return (
          <div key={session._id} className={`${s.card} ${c.sessionItem}`}>
            <button
              type="button"
              className={c.sessionRow}
              onClick={() => setExpandedId(open ? null : session._id)}
            >
              <span className={c.sessionRowMain}>
                <span className={s.foodChipEmoji}>{food.emoji}</span>
                sessione n.{session.sessionNumber} · {session.food}
              </span>
              <span className={c.sessionRowMeta}>
                {session.levels.length} livelli ·{' '}
                {new Date(session.date).toLocaleString('it-IT')} {open ? '▲' : '▼'}
              </span>
            </button>

            {open && (
              <div className={c.sessionDetail}>
                {session.levels.map((lv) => (
                  <div key={lv.levelId} className={s.metricsSummary}>
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
                <div className={s.rewardActions}>
                  <button type="button" className={s.btn} onClick={() => downloadCsv(session)}>
                    Esporta CSV ⬇
                  </button>
                  <button type="button" className={s.btn} onClick={() => downloadJson(session)}>
                    Esporta JSON ⬇
                  </button>
                  <button
                    type="button"
                    className={`${s.btn} ${s.btnDanger}`}
                    onClick={() => handleDelete(session)}
                    disabled={deleteMutation.isPending}
                  >
                    Elimina 🗑
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}

      <button type="button" className={`${s.btn} ${s.btnPrimary}`} onClick={onBack}>
        ← Torna all'inizio
      </button>
    </div>
  );
};

export default Dashboard;
