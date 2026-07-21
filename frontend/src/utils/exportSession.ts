import type { Session } from '../types';

/** One row per completed level, times in seconds. */
export function sessionToCsv(session: Session): string {
  const rows = [toCsvRow(CSV_HEADER)];
  for (const lv of session.levels) {
    const m = lv.metrics;
    rows.push(
      toCsvRow([
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
      ])
    );
  }
  return rows.join('\n');
}

export function downloadJson(session: Session): void {
  download(`${baseName(session)}.json`, JSON.stringify(session, null, 2), 'application/json');
}

export function downloadCsv(session: Session): void {
  download(`${baseName(session)}.csv`, sessionToCsv(session), 'text/csv');
}

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

/** Milliseconds to seconds, 2 decimal places; `""` for null. */
const s2 = (v: number | null): string => (v == null ? '' : (v / 1000).toFixed(2));

/**
 * Escapes a field per RFC 4180. Without this, free text shifts every following
 * column — the level 2 `behavior` ("Sollevare e avvicinare al viso, annusare")
 * and any child name with a comma in it both do exactly that.
 */
function csvField(value: string | number): string {
  const text = String(value);
  if (!/[",\r\n]/.test(text)) return text;
  return `"${text.replace(/"/g, '""')}"`;
}

const toCsvRow = (fields: (string | number)[]): string => fields.map(csvField).join(',');

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
