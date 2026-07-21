export interface MetricRow {
  label: string;
  value: string | number;
}

/**
 * Labelled rows with human-readable units. Accepts both live `Metrics`
 * (`count`) and persisted metrics (`n`); whichever is present is used.
 */
export function formatMetrics(m: {
  count?: number; // live Metrics
  n?: number;     // persisted LevelResultMetrics
  latencyMs: number | null;
  totalContactMs: number;
  meanTouchMs: number | null;
  meanIrtMs: number | null;
  sessionDurationMs: number;
  engagementRatio: number;
}): MetricRow[] {
  return [
    { label: 'Tocchi (n)', value: m.count ?? m.n ?? 0 },
    { label: 'Latenza 1° tocco', value: m.latencyMs == null ? '—' : `${s2(m.latencyMs)} s` },
    { label: 'Contatto totale', value: `${s2(m.totalContactMs)} s` },
    { label: 'Durata media tocco', value: m.meanTouchMs == null ? '—' : `${s2(m.meanTouchMs)} s` },
    { label: 'IRT medio', value: m.meanIrtMs == null ? '—' : `${s2(m.meanIrtMs)} s` },
    { label: 'Durata sessione', value: `${s2(m.sessionDurationMs)} s` },
    { label: 'Engagement Ratio', value: `${m.engagementRatio.toFixed(1)} %` },
  ];
}

/** Milliseconds to seconds, 2 decimal places. */
const s2 = (v: number): string => (v / 1000).toFixed(2);
