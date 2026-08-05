import type { SavedSession } from '@/api/client';
import { buildAbaSeries, conditionOf, findPhaseChanges, groupByFood } from './abaData';
import { NO_PROBLEM_ID, problemBehaviorLabels } from '@/domain/problemBehaviors';
import { colorForLevel } from '@/export/seriesColors';
import type { ChartSpec, ChartSeries } from './xlsx/chart';
import { buildChartXml } from './xlsx/chart';
import type { SheetRow } from './xlsx/sheet';
import { buildSheetXml, columnRange, sanitizeSheetName } from './xlsx/sheet';
import type { ChartAnchor, XlsxSheet } from './xlsx/package';
import { buildXlsxParts, zipXlsx } from './xlsx/package';

/**
 * Turns the saved sessions into one ABA data sheet per food, each with the chart the
 * paper form carries: a line per level, the criterion line, and a vertical change line
 * wherever the condition switches.
 */

export interface AbaExportInput {
  childId: string;
  sessions: SavedSession[];
  /** Engagement percentage the programme aims at, from the app settings. */
  criterion: number;
}

/** Header block copied from the paper form, above the table. */
const HEADER_ROWS = 8;
/** 1-based row of the column headers; the blank row 9 separates them from the block. */
const HEADER_ROW = HEADER_ROWS + 2;
const FIRST_DATA_ROW = HEADER_ROW + 1;

const COL_DATE = 0;
const COL_SESSION = 1;
const COL_THERAPIST = 2;
const COL_CONDITION = 3;
const COL_LEVELS = 4;

/** Green, outside the level palette, so the criterion reads as the target and not as data. */
const CRITERION_COLOR = '2E7D32';
const CHANGE_COLOR = '212121';
const MARKERS = ['circle', 'square', 'diamond', 'triangle'] as const;

const Y_MAX = 100;
const CHART_ROWS = 24;
const CHART_COLS = 10;

export interface FoodSheet {
  name: string;
  rows: SheetRow[];
  columnWidths: number[];
  chart: ChartSpec;
  anchor: ChartAnchor;
}

export function buildFoodSheets({ childId, sessions, criterion }: AbaExportInput): FoodSheet[] {
  const taken: string[] = [];

  return groupByFood(sessions).map((group) => {
    const name = sanitizeSheetName(group.food, taken);
    taken.push(name);
    return buildFoodSheet(name, childId, group.food, group.sessions, criterion);
  });
}

function buildFoodSheet(
  name: string,
  childId: string,
  food: string,
  sessions: SavedSession[],
  criterion: number,
): FoodSheet {
  const levels = buildAbaSeries(sessions).map((s) => ({ id: s.levelId, name: s.levelName }));
  const changes = findPhaseChanges(sessions);

  const colCriterion = COL_LEVELS + levels.length;
  const colBehaviors = colCriterion + 1;
  const colNotes = colBehaviors + 1;
  // One blank column keeps the change-line helpers clear of the table proper.
  const colChangeY = colNotes + 2;
  const colChangeX = (index: number) => colChangeY + 1 + index;

  const rows: SheetRow[] = [
    [{ value: 'Nome studente', bold: true }, childId],
    [{ value: 'Programma', bold: true }, `Selettività alimentare · ${food}`],
    [{ value: 'Data inizio programma', bold: true }, formatDate(sessions[0]?.date)],
    [{ value: 'BCBA', bold: true }],
    [{ value: 'STAFF', bold: true }, listTherapists(sessions)],
    [{ value: 'CP', bold: true }, listBehaviors(sessions)],
    [{ value: 'COMUNICAZIONI', bold: true }],
    [{ value: 'Criterio', bold: true }, `${criterion} %`],
    [],
  ];

  const header: SheetRow = [];
  header[COL_DATE] = { value: 'Data', bold: true };
  header[COL_SESSION] = { value: 'Sessione', bold: true };
  header[COL_THERAPIST] = { value: 'Terapista', bold: true };
  header[COL_CONDITION] = { value: 'Condizione', bold: true };
  levels.forEach((level, i) => {
    header[COL_LEVELS + i] = { value: `L${level.id} · ${level.name}`, bold: true };
  });
  header[colCriterion] = { value: 'Criterio', bold: true };
  header[colBehaviors] = { value: 'Comportamenti', bold: true };
  header[colNotes] = { value: 'Note', bold: true };
  header[colChangeY] = { value: 'Y cambio', bold: true };
  changes.forEach((change, i) => {
    header[colChangeX(i)] = { value: `X ${change.condition}`, bold: true };
  });
  rows.push(header);

  const levelValues: (number | null)[][] = levels.map(() => []);
  const ordinals: number[] = [];

  sessions.forEach((session, index) => {
    const ordinal = index + 1;
    ordinals.push(ordinal);

    const row: SheetRow = [];
    row[COL_DATE] = formatDate(session.date);
    row[COL_SESSION] = ordinal;
    row[COL_THERAPIST] = session.therapist ?? '';
    row[COL_CONDITION] = conditionOf(session);

    levels.forEach((level, i) => {
      const result = session.levels.find((l) => l.levelId === level.id);
      const value = result ? round1(result.metrics.engagementRatio) : null;
      levelValues[i].push(value);
      row[COL_LEVELS + i] = value;
    });

    row[colCriterion] = criterion;
    row[colBehaviors] = problemBehaviorLabels(session.problemBehaviors).join(', ');
    row[colNotes] = session.notes ?? '';

    // The change lines only need two points each: floor and ceiling of the Y axis.
    if (index < 2) {
      row[colChangeY] = index === 0 ? 0 : Y_MAX;
      changes.forEach((change, i) => {
        row[colChangeX(i)] = change.atOrdinal - 0.5;
      });
    }

    rows.push(row);
  });

  const lastDataRow = FIRST_DATA_ROW + sessions.length - 1;
  const dataRange = (column: number) => columnRange(name, column, FIRST_DATA_ROW, lastDataRow);
  const changeRange = (column: number) => columnRange(name, column, FIRST_DATA_ROW, FIRST_DATA_ROW + 1);

  const series: ChartSeries[] = levels.map((level, i) => ({
    name: `L${level.id} · ${level.name}`,
    xRef: dataRange(COL_SESSION),
    xValues: ordinals,
    yRef: dataRange(COL_LEVELS + i),
    yValues: levelValues[i],
    color: hex(colorForLevel(level.id)),
    marker: MARKERS[i % MARKERS.length],
  }));

  series.push({
    name: `Criterio ${criterion}%`,
    xRef: dataRange(COL_SESSION),
    xValues: ordinals,
    yRef: dataRange(colCriterion),
    yValues: ordinals.map(() => criterion),
    color: CRITERION_COLOR,
    dash: 'lgDash',
    labelLastPoint: true,
  });

  changes.forEach((change, i) => {
    series.push({
      name: `Cambio · ${change.condition}`,
      xRef: changeRange(colChangeX(i)),
      xValues: [change.atOrdinal - 0.5, change.atOrdinal - 0.5],
      yRef: changeRange(colChangeY),
      yValues: [0, Y_MAX],
      color: CHANGE_COLOR,
      thin: true,
      hideFromLegend: true,
    });
  });

  const columnWidths = [12, 10, 18, 24, ...levels.map(() => 16), 10, 30, 32];
  const anchorRow = lastDataRow + 1;

  return {
    name,
    rows,
    columnWidths,
    chart: {
      title: `${childId} · ${food}`,
      xTitle: 'Sessione',
      yTitle: '% di contatto (engagement ratio)',
      xMax: sessions.length,
      yMax: Y_MAX,
      series,
    },
    anchor: {
      fromCol: 0,
      fromRow: anchorRow,
      toCol: CHART_COLS,
      toRow: anchorRow + CHART_ROWS,
    },
  };
}

export function buildAbaWorkbook(input: AbaExportInput): Uint8Array<ArrayBuffer> {
  const sheets: XlsxSheet[] = buildFoodSheets(input).map((sheet) => ({
    name: sheet.name,
    sheetXml: buildSheetXml(sheet.rows, { columnWidths: sheet.columnWidths, hasDrawing: true }),
    chart: { xml: buildChartXml(sheet.chart), anchor: sheet.anchor },
  }));

  if (sheets.length === 0) throw new Error('Nessuna sessione da esportare');
  return zipXlsx(buildXlsxParts(sheets));
}

export function abaWorkbookFileName(childId: string, at: Date = new Date()): string {
  const name = childId.trim().replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-|-$/g, '') || 'bambino';
  const day = `${at.getFullYear()}-${pad(at.getMonth() + 1)}-${pad(at.getDate())}`;
  return `schede-aba_${name}_${day}.xlsx`;
}

function listTherapists(sessions: SavedSession[]): string {
  return [...new Set(sessions.map((s) => s.therapist?.trim()).filter(Boolean))].join(', ');
}

function listBehaviors(sessions: SavedSession[]): string {
  const ids = sessions.flatMap((s) => s.problemBehaviors ?? []).filter((id) => id !== NO_PROBLEM_ID);
  const labels = problemBehaviorLabels([...new Set(ids)]);
  return labels.length ? labels.join(', ') : 'nessuno rilevato';
}

function formatDate(iso: string | undefined): string {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`;
}

const pad = (n: number): string => String(n).padStart(2, '0');
const round1 = (n: number): number => Math.round(n * 10) / 10;
const hex = (color: string): string => color.replace('#', '').toUpperCase();
