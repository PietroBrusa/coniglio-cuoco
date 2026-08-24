import { useMemo, useState } from 'react';
import Rabbit from '@/components/Rabbit/Rabbit';
import AbaChart from '@/components/AbaChart/AbaChart';
import IntervalGrid from '@/components/IntervalGrid/IntervalGrid';
import { useDeleteSession, useSessions } from '@/hooks/useSessions';
import { getFood } from '@/domain/levels';
import { loadSettings } from '@/storage/settings';
import { getProblemBehavior } from '@/domain/problemBehaviors';
import { buildAbaSeries, groupByFood, ordinalsFor, wholeIntervalRecording } from '@/export/abaData';
import { formatMetrics } from '@/domain/formatMetrics';
import { abaWorkbookFileName, buildAbaWorkbook } from '@/export/abaWorkbook';
import { XLSX_MIME, downloadFile } from '@/lib/downloadFile';
import type { SavedSession } from '@/api/client';
import s from '@/app/styles/shared.module.scss';
import c from './Dashboard.module.scss';

interface DashboardProps {
  childId: string;
  onBack: () => void;
}

const Dashboard = ({ childId, onBack }: DashboardProps) => {
  const { data, isLoading, isError, error, refetch, isFetching } = useSessions(childId);
  const deleteMutation = useDeleteSession();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedFood, setSelectedFood] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);

  const sessions = useMemo(() => data ?? [], [data]);

  const criterion = loadSettings().holdEngagementPct;

  const groups = useMemo(() => groupByFood(sessions), [sessions]);
  const group = groups.find((g) => g.foodId === selectedFood) ?? groups[0];

  const series = useMemo(() => (group ? buildAbaSeries(group.sessions) : []), [group]);

  const listed = useMemo(() => (group ? [...group.sessions].reverse() : []), [group]);
  const ordinalOf = useMemo(() => ordinalsFor(group?.sessions ?? []), [group]);

  const handleExport = () => {
    try {
      setExportError(null);
      downloadFile(
        buildAbaWorkbook({ childId, sessions, criterion }),
        abaWorkbookFileName(childId),
        XLSX_MIME,
      );
    } catch (e) {
      setExportError(e instanceof Error ? e.message : 'errore sconosciuto');
    }
  };

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
          Aggiorna
        </button>
        <button
          type="button"
          className={s.btn}
          onClick={handleExport}
          disabled={sessions.length === 0}
          title="Scarica le schede ABA, un foglio per alimento con il suo grafico"
        >
          Esporta Excel
        </button>
      </div>
      {exportError && <p className={s.saveErr}>Esportazione non riuscita: {exportError}</p>}

      {groups.length > 1 && (
        <div className={c.foodTabs} role="tablist" aria-label="Alimento">
          {groups.map((g) => {
            const selected = g.foodId === group?.foodId;
            return (
              <button
                key={g.foodId}
                type="button"
                role="tab"
                aria-selected={selected}
                className={`${c.foodTab} ${selected ? c.foodTabActive : ''}`}
                onClick={() => {
                  setSelectedFood(g.foodId);
                  setExpandedId(null);
                }}
              >
                <span className={s.foodChipEmoji}>{getFood(g.foodId).emoji}</span>
                {g.food}
                <span className={c.foodTabCount}>({g.sessions.length})</span>
              </button>
            );
          })}
        </div>
      )}

      {group && series.length > 0 && (
        <div className={`${s.card} ${c.chartCard}`}>
          <h3 className={c.chartTitle}>Andamento del programma · {group.food}</h3>
          <AbaChart series={series} criterion={criterion} foodLabel={group.food} />
        </div>
      )}

      {isLoading && <p className={c.muted}>Caricamento…</p>}
      {isError && (
        <p className={s.saveErr}>
          Impossibile caricare le sessioni: {error instanceof Error ? error.message : 'errore'}
        </p>
      )}
      {!isLoading && !isError && sessions.length === 0 && (
        <p className={c.muted}>Nessuna sessione salvata per questo bambino.</p>
      )}

      {listed.map((session: SavedSession) => {
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
                sessione {ordinalOf(session.sessionNumber)} · {session.food}
              </span>
              <span className={c.sessionRowMeta}>
                {session.levels.length} livelli · {new Date(session.date).toLocaleString('it-IT')}
                <span
                  className={`${c.chevron} ${open ? c.chevronOpen : ''}`}
                  aria-hidden="true"
                />
              </span>
            </button>

            {open && (
              <div className={c.sessionDetail}>
                <dl className={c.sessionInfo}>
                  <div>
                    <dt>Terapista</dt>
                    <dd>{session.therapist || <span className={c.muted}>non registrato</span>}</dd>
                  </div>
                  <div>
                    <dt>Difficoltà</dt>
                    <dd>{session.difficulty}</dd>
                  </div>
                  <div className={c.sessionInfoWide}>
                    <dt>Comportamenti osservati</dt>
                    <dd>
                      {session.problemBehaviors.length ? (
                        <span className={c.behaviorTags}>
                          {session.problemBehaviors.map((id) => {
                            const b = getProblemBehavior(id);
                            return (
                              <span key={id} className={c.behaviorTag}>
                                {b ? b.label : id}
                              </span>
                            );
                          })}
                        </span>
                      ) : (
                        <span className={c.muted}>nessuno registrato</span>
                      )}
                    </dd>
                  </div>
                  {session.notes && (
                    <div className={c.sessionInfoWide}>
                      <dt>Note</dt>
                      <dd>{session.notes}</dd>
                    </div>
                  )}
                </dl>

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
                    <IntervalGrid
                      caption="Whole interval recording"
                      record={wholeIntervalRecording(
                        lv.metrics.touches,
                        lv.metrics.sessionDurationMs,
                      )}
                    />
                  </div>
                ))}
                <div className={s.rewardActions}>
                  <button
                    type="button"
                    className={`${s.btn} ${s.btnDanger}`}
                    onClick={() => handleDelete(session)}
                    disabled={deleteMutation.isPending}
                  >
                    Elimina
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}

      <button type="button" className={`${s.btn} ${s.btnPrimary}`} onClick={onBack}>
        Torna all'inizio
      </button>
    </div>
  );
};

export default Dashboard;
