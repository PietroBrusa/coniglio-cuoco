import type { Session } from '../types';

/**
 * Session export to external files (CSV / JSON) and metric formatting for the UI.
 * Domain record construction lives in `game/sessionRecord.ts`.
 */

/**
 * Serialises a session as CSV — one row per completed level, times in seconds.
 * @param session - The session to serialise.
 * @returns CSV string with header row.
 */
export function sessionToCsv(session: Session): string {
  const rows = [CSV_HEADER.join(',')];
  for (const lv of session.levels) {
    const m = lv.metrics;
    rows.push(
      [
        session.childId,
        session.date,
        session.sessionNumber,
        session.food,
        session.difficulty ?? 'facile',
        lv.levelName,
        lv.behavior,
        s2(m.sessionDurationMs),
        m.n,
        s2(m.latencyMs),
        s2(m.totalContactMs),
        s2(m.meanTouchMs),
        s2(m.meanIrtMs),
        m.engagementRatio == null ? '' : m.engagementRatio.toFixed(1),
      ].join(',')
    );
  }
  return rows.join('\n');
}

/**
 * Triggers a browser download of the full session as a JSON file.
 * @param session - Session to export.
 */
export function downloadJson(session: Session): void {
  download(`${baseName(session)}.json`, JSON.stringify(session, null, 2), 'application/json');
}

/**
 * Triggers a browser download of the session as a CSV file (Excel-compatible).
 * @param session - Session to export.
 */
export function downloadCsv(session: Session): void {
  download(`${baseName(session)}.csv`, sessionToCsv(session), 'text/csv');
}

/** A label/value pair used in metric summary tables throughout the UI. */
export interface MetricRow {
  label: string;
  value: string | number;
}

/**
 * Converts metrics into labelled rows with human-readable units.
 * Accepts both live {@link Metrics} (`count`) and persisted metrics (`n`);
 * whichever is present is used for the tap-count row.
 * @param m - Metrics object, either live or persisted.
 * @returns Array of {@link MetricRow} ready for rendering.
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

/**
 * Converts milliseconds to seconds with 2 decimal places.
 * @param v - Value in milliseconds, or `null`.
 * @returns Formatted string (e.g. `"1.50"`) or `""` for null.
 */
const s2 = (v: number | null): string => (v == null ? '' : (v / 1000).toFixed(2));

const CSV_HEADER = [
  'IdBambino',
  'Data',
  'NSessione',
  'Alimento',
  'Difficolta',
  'Livello',
  'Comportamento',
  'DurataSessione_s',
  'NTocchi',
  'Latenza_s',
  'ContattoTotale_s',
  'DurataMediaTocco_s',
  'IRTmedio_s',
  'EngagementRatio_%',
];

/**
 * Triggers a browser file download via a temporary Blob object URL.
 * @param filename - Suggested file name.
 * @param content - Text content of the file.
 * @param type - MIME type (e.g. `'text/csv'` or `'application/json'`).
 */
function download(filename: string, content: string, type: string): void {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function baseName(session: Session): string {
  const day = session.date.slice(0, 10);
  return `${slug(session.childId)}_s${session.sessionNumber}_${slug(session.food)}_${day}`;
}

const slug = (s: string | number): string =>
  String(s)
    .replace(/[^a-z0-9]+/gi, '_')
    .replace(/^_|_$/g, '') || 'sessione';
