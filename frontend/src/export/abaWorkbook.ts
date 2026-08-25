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

//sessions è già l'insieme da esportare: la dashboard passa solo le sedute
//dell'alimento selezionato, quindi il raggruppamento qui sotto produce
//normalmente un foglio solo
export interface AbaExportInput {
  childId: string;
  sessions: SavedSession[];
  criterion: number;
}

//posizioni dei dati, calcolate a mano: devono restare sincronizzate col
//numero di righe scritte davvero più sotto (riga 72-82), altrimenti puntano
//alla cella sbagliata senza che nulla lo segnali
const HEADER_ROWS = 8;
const HEADER_ROW = HEADER_ROWS + 2;
const FIRST_DATA_ROW = HEADER_ROW + 1;

//indici colonna  
const COL_DATE = 0;
const COL_SESSION = 1;
const COL_THERAPIST = 2;
const COL_CONDITION = 3;
const COL_LEVELS = 4;

const CRITERION_COLOR = '2E7D32';
const MARKERS = ['circle', 'square', 'diamond', 'triangle'] as const;

const Y_MAX = 100;
const CHART_ROWS = 24;
const CHART_COLS = 10;

//un foglio per alimento
export interface FoodSheet {
  name: string;
  rows: SheetRow[];
  columnWidths: number[];
  chart: ChartSpec;
  anchor: ChartAnchor;
}

//costruisce un foglio per alimento
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
  //le colonne si adattano al numero di livelli
  const levels = buildAbaSeries(sessions).map((s) => ({ id: s.levelId, name: s.levelName }));

  const colCriterion = COL_LEVELS + levels.length;
  const colBehaviors = colCriterion + 1;
  const colNotes = colBehaviors + 1;

  //le righe seguono un ordine fisso
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

  //l'indice nell'array è quello nella colonna
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

  //riempie con le informazioni mentre si costruisce il grafico
  const levelValues: (number | null)[][] = levels.map(() => []);
  const ordinals: number[] = [];

  sessions.forEach((session, index) => {
    const ordinal = index + 1;
    ordinals.push(ordinal);

    //come sopra: l'indice nell'array è la colonna
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

  //xRef e yRef -> dice quali sono le celle del foglio collegate al grafico
  //xValues e yValues -> copia dei numeri nel file XML
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

  //larghezze colonne, i livelli hanno una lunghezza uguale tra loro
  const columnWidths = [12, 10, 18, 24, ...levels.map(() => 16), 10, 30, 32];
  //posizione grafico
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

//trasforma FoodSheet in xlsxSheet
export function buildAbaWorkbook(input: AbaExportInput): Uint8Array<ArrayBuffer> {
  const sheets: XlsxSheet[] = buildFoodSheets(input).map((sheet) => ({
    name: sheet.name,
    //costruisce il file xlsx
    sheetXml: buildSheetXml(sheet.rows, { columnWidths: sheet.columnWidths, hasDrawing: true }),
    //costruisce il grafico xlsx
    chart: { xml: buildChartXml(sheet.chart), anchor: sheet.anchor },
  }));

  if (sheets.length === 0) throw new Error('Nessuna sessione da esportare');
  return zipXlsx(buildXlsxParts(sheets));
}

export function abaWorkbookFileName(
  childId: string,
  food: string,
  at: Date = new Date(),
): string {
  const name = slug(childId) || 'bambino';
  const dish = slug(food) || 'alimento';
  const day = `${at.getFullYear()}-${pad(at.getMonth() + 1)}-${pad(at.getDate())}`;
  return `schede-aba_${name}_${dish}_${day}.xlsx`;
}

//via tutto quello che un file system rifiuterebbe
const slug = (text: string): string =>
  text.trim().replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-|-$/g, '');

function listTherapists(sessions: SavedSession[]): string {
  return [...new Set(sessions.map((s) => s.therapist?.trim()).filter(Boolean))].join(', ');
}

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
