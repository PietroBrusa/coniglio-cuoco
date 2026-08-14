/**
 * Costruisce le schede ABA: un foglio per alimento, ognuno con il grafico che
 * porta il modulo cartaceo — una linea per livello e la linea di criterio.
 *
 * @module
 */

import type { SavedSession } from '@/api/client';
import { buildAbaSeries, conditionOf, groupByFood } from './abaData';
import { NO_PROBLEM_ID, problemBehaviorLabels } from '@/domain/problemBehaviors';
import { colorForLevel } from '@/export/seriesColors';
import type { ChartSpec, ChartSeries } from './xlsx/chart';
import { buildChartXml } from './xlsx/chart';
import type { SheetRow } from './xlsx/sheet';
import { buildSheetXml, columnRange, sanitizeSheetName } from './xlsx/sheet';
import type { ChartAnchor, XlsxSheet } from './xlsx/package';
import { buildXlsxParts, zipXlsx } from './xlsx/package';

/** Dati di partenza dell'esportazione. */
export interface AbaExportInput {
  /** Bambino a cui appartengono le sessioni; finisce nell'intestazione della scheda. */
  childId: string;
  /** Tutte le sue sessioni salvate: vengono raggruppate per alimento, un foglio ciascuno. */
  sessions: SavedSession[];
  /** Percentuale di contatto che il programma si pone come obiettivo, dalle impostazioni dell'app. */
  criterion: number;
}

/** Righe del blocco di intestazione ricopiato dal modulo cartaceo, sopra la tabella. */
const HEADER_ROWS = 8;
/** Riga (da 1) delle intestazioni di colonna; la riga 9 vuota le stacca dal blocco. */
const HEADER_ROW = HEADER_ROWS + 2;
const FIRST_DATA_ROW = HEADER_ROW + 1;

const COL_DATE = 0;
const COL_SESSION = 1;
const COL_THERAPIST = 2;
const COL_CONDITION = 3;
const COL_LEVELS = 4;

/** Verde, fuori dalla palette dei livelli: il criterio si legge come obiettivo e non come dato. */
const CRITERION_COLOR = '2E7D32';
const MARKERS = ['circle', 'square', 'diamond', 'triangle'] as const;

const Y_MAX = 100;
const CHART_ROWS = 24;
const CHART_COLS = 10;

/** Un foglio già pronto: contenuto della tabella, larghezze, grafico e sua collocazione. */
export interface FoodSheet {
  /** Nome del foglio, ripulito dei caratteri che Excel vieta. */
  name: string;
  /** Righe della scheda: blocco di intestazione, riga vuota, intestazioni di colonna, dati. */
  rows: SheetRow[];
  /** Larghezza delle colonne in caratteri. */
  columnWidths: number[];
  /** Definizione del grafico da disegnare sotto la tabella. */
  chart: ChartSpec;
  /** Celle fra cui il grafico è ancorato. */
  anchor: ChartAnchor;
}

/**
 * Prepara un foglio per ogni alimento presente nelle sessioni.
 *
 * @param input - Bambino, sessioni e criterio del programma.
 * @returns I fogli nell'ordine in cui gli alimenti compaiono, con i nomi già resi
 * univoci fra loro.
 */
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

  const colCriterion = COL_LEVELS + levels.length;
  const colBehaviors = colCriterion + 1;
  const colNotes = colBehaviors + 1;

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
  rows.push(header);

  const levelValues: (number | null)[][] = levels.map(() => []);
  const ordinals: number[] = [];

  sessions.forEach((session, index) => {
    const ordinal = index + 1;
    ordinals.push(ordinal);

    const row: SheetRow = [];
    row[COL_DATE] = formatDate(session.date);
    row[COL_SESSION] = ordinal;
    row[COL_THERAPIST] = session.therapist;
    row[COL_CONDITION] = conditionOf(session);

    levels.forEach((level, i) => {
      const result = session.levels.find((l) => l.levelId === level.id);
      const value = result ? round1(result.metrics.engagementRatio) : null;
      levelValues[i].push(value);
      row[COL_LEVELS + i] = value;
    });

    row[colCriterion] = criterion;
    row[colBehaviors] = problemBehaviorLabels(session.problemBehaviors).join(', ');
    row[colNotes] = session.notes;

    rows.push(row);
  });

  const lastDataRow = FIRST_DATA_ROW + sessions.length - 1;
  const dataRange = (column: number) => columnRange(name, column, FIRST_DATA_ROW, lastDataRow);

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

/**
 * Genera il file .xlsx completo delle schede ABA.
 *
 * @param input - Bambino, sessioni e criterio del programma.
 * @returns I byte del file, pronti da consegnare al browser come download.
 * @throws Error se non c'è nessuna sessione da esportare.
 */
export function buildAbaWorkbook(input: AbaExportInput): Uint8Array<ArrayBuffer> {
  const sheets: XlsxSheet[] = buildFoodSheets(input).map((sheet) => ({
    name: sheet.name,
    sheetXml: buildSheetXml(sheet.rows, { columnWidths: sheet.columnWidths, hasDrawing: true }),
    chart: { xml: buildChartXml(sheet.chart), anchor: sheet.anchor },
  }));

  if (sheets.length === 0) throw new Error('Nessuna sessione da esportare');
  return zipXlsx(buildXlsxParts(sheets));
}

/**
 * Nome del file da scaricare, es. `schede-aba_B001_2026-08-05.xlsx`.
 *
 * Il nome del bambino viene ridotto a lettere e cifre (accenti compresi): il
 * risultato è un nome di file valido su Windows, macOS e Linux.
 *
 * @param childId - Bambino a cui appartengono le schede.
 * @param at - Data da riportare nel nome; per impostazione predefinita oggi.
 * @returns Il nome del file, con estensione.
 */
export function abaWorkbookFileName(childId: string, at: Date = new Date()): string {
  const name = childId.trim().replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-|-$/g, '') || 'bambino';
  const day = `${at.getFullYear()}-${pad(at.getMonth() + 1)}-${pad(at.getDate())}`;
  return `schede-aba_${name}_${day}.xlsx`;
}

/** Elenca senza ripetizioni gli operatori che hanno condotto le sessioni, per la voce STAFF. */
function listTherapists(sessions: SavedSession[]): string {
  return [...new Set(sessions.map((s) => s.therapist?.trim()).filter(Boolean))].join(', ');
}

/**
 * Elenca i comportamenti problema emersi almeno una volta, per la voce CP.
 * Scarta il segnaposto «nessuno», che non è un comportamento.
 */
function listBehaviors(sessions: SavedSession[]): string {
  const ids = sessions.flatMap((s) => s.problemBehaviors).filter((id) => id !== NO_PROBLEM_ID);
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
