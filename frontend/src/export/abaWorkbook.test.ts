import { describe, it, expect } from 'vitest';
import { unzipSync, strFromU8 } from 'fflate';
import { abaWorkbookFileName, buildAbaWorkbook, buildFoodSheets } from './abaWorkbook';
import type { FoodSheet } from './abaWorkbook';
import type { CellInput, CellValue } from './xlsx/sheet';
import type { SavedSession } from '@/api/client';

interface SessionOptions {
  food?: string;
  foodId?: string;
  difficulty?: 'facile' | 'difficile';
  therapist?: string;
  problemBehaviors?: string[];
  notes?: string;
  levels?: { levelId: number; engagementRatio: number }[];
}

function session(sessionNumber: number, opts: SessionOptions = {}): SavedSession {
  const {
    food = 'Mela',
    foodId = 'mela',
    difficulty = 'facile',
    therapist = 'Mary Major',
    problemBehaviors,
    notes,
    levels = [{ levelId: 1, engagementRatio: 24 }],
  } = opts;

  return {
    _id: `id-${sessionNumber}`,
    childId: 'John Doe',
    sessionNumber,
    food,
    foodId,
    difficulty,
    therapist,
    problemBehaviors,
    notes,
    date: `2026-07-0${sessionNumber}T10:00:00.000Z`,
    createdAt: '2026-07-01T10:00:00.000Z',
    levels: levels.map((l) => ({
      levelId: l.levelId,
      levelName: `Livello ${l.levelId}`,
      behavior: 'contatto',
      mode: 'hold' as const,
      target: 6,
      metrics: {
        count: 1,
        latencyMs: 100,
        totalContactMs: 1000,
        meanTouchMs: 1000,
        meanIrtMs: null,
        sessionDurationMs: 4000,
        engagementRatio: l.engagementRatio,
        touches: [],
      },
    })),
  } as SavedSession;
}

const value = (cell: CellInput): CellValue =>
  cell !== null && typeof cell === 'object' ? cell.value : cell;

const cellAt = (sheet: FoodSheet, row: number, col: number): CellValue =>
  value(sheet.rows[row - 1]?.[col]);

/** 1-based rows, matching the layout the sheet builder writes. */
const HEADER_ROW = 10;
const FIRST_DATA_ROW = 11;

const build = (sessions: SavedSession[], criterion = 40): FoodSheet[] =>
  buildFoodSheets({ childId: 'John Doe', sessions, criterion });

describe('buildFoodSheets', () => {
  it('writes one sheet per food, named after it', () => {
    const sheets = build([
      session(1, { food: 'Mela', foodId: 'mela' }),
      session(2, { food: 'Carota', foodId: 'carota' }),
    ]);
    expect(sheets.map((s) => s.name)).toEqual(['Mela', 'Carota']);
  });

  it('fills the header block of the paper form', () => {
    const sheets = build([
      session(1, { therapist: 'Mary Major', problemBehaviors: ['rifiuto-cibo'] }),
      session(2, { therapist: 'Anna Bianchi', problemBehaviors: ['nessuno'] }),
    ]);
    const sheet = sheets[0];

    expect(cellAt(sheet, 1, 0)).toBe('Nome studente');
    expect(cellAt(sheet, 1, 1)).toBe('John Doe');
    expect(cellAt(sheet, 2, 1)).toBe('Selettività alimentare · Mela');
    expect(cellAt(sheet, 3, 1)).toBe('01/07/2026');
    expect(cellAt(sheet, 4, 0)).toBe('BCBA');
    expect(cellAt(sheet, 5, 1)).toBe('Mary Major, Anna Bianchi');
    expect(cellAt(sheet, 6, 1)).toBe('Rifiuto del cibo');
    expect(cellAt(sheet, 7, 0)).toBe('COMUNICAZIONI');
    expect(cellAt(sheet, 8, 1)).toBe('40 %');
  });

  it('says so when no problem behaviour was ever recorded', () => {
    const sheets = build([session(1, { problemBehaviors: ['nessuno'] })]);
    expect(cellAt(sheets[0], 6, 1)).toBe('nessuno rilevato');
  });

  it('heads the table with one column per level', () => {
    const sheets = build([
      session(1, { levels: [{ levelId: 1, engagementRatio: 24 }, { levelId: 2, engagementRatio: 50 }] }),
    ]);
    const sheet = sheets[0];

    expect(cellAt(sheet, HEADER_ROW, 0)).toBe('Data');
    expect(cellAt(sheet, HEADER_ROW, 1)).toBe('Sessione');
    expect(cellAt(sheet, HEADER_ROW, 2)).toBe('Terapista');
    expect(cellAt(sheet, HEADER_ROW, 3)).toBe('Condizione');
    expect(cellAt(sheet, HEADER_ROW, 4)).toBe('L1 · Livello 1');
    expect(cellAt(sheet, HEADER_ROW, 5)).toBe('L2 · Livello 2');
    expect(cellAt(sheet, HEADER_ROW, 6)).toBe('Criterio');
    expect(cellAt(sheet, HEADER_ROW, 7)).toBe('Comportamenti');
    expect(cellAt(sheet, HEADER_ROW, 8)).toBe('Note');
  });

  it('writes a data row per session, numbered as the dashboard numbers them', () => {
    const sheets = build([
      session(3, { levels: [{ levelId: 1, engagementRatio: 24.44 }] }),
      session(7, { levels: [{ levelId: 1, engagementRatio: 61.5 }] }),
    ]);
    const sheet = sheets[0];

    expect(cellAt(sheet, FIRST_DATA_ROW, 1)).toBe(1);
    expect(cellAt(sheet, FIRST_DATA_ROW, 3)).toBe('Mela · facile');
    expect(cellAt(sheet, FIRST_DATA_ROW, 4)).toBe(24.4);
    expect(cellAt(sheet, FIRST_DATA_ROW + 1, 1)).toBe(2);
    expect(cellAt(sheet, FIRST_DATA_ROW + 1, 4)).toBe(61.5);
  });

  it('leaves a level blank in a session that did not run it', () => {
    const sheets = build([
      session(1, { levels: [{ levelId: 1, engagementRatio: 24 }, { levelId: 2, engagementRatio: 50 }] }),
      session(2, { levels: [{ levelId: 1, engagementRatio: 30 }] }),
    ]);
    expect(cellAt(sheets[0], FIRST_DATA_ROW + 1, 5)).toBeNull();
  });

  it('repeats the criterion down its own column so it plots as a line', () => {
    const sheets = build([session(1), session(2)], 55);
    expect(cellAt(sheets[0], FIRST_DATA_ROW, 5)).toBe(55);
    expect(cellAt(sheets[0], FIRST_DATA_ROW + 1, 5)).toBe(55);
  });

  it('records the behaviours and notes of each session', () => {
    const sheets = build([
      session(1, { problemBehaviors: ['rifiuto-cibo', 'pianto'], notes: 'Bambino stanco.' }),
    ]);
    expect(cellAt(sheets[0], FIRST_DATA_ROW, 6)).toBe('Rifiuto del cibo, Pianto o lamento');
    expect(cellAt(sheets[0], FIRST_DATA_ROW, 7)).toBe('Bambino stanco.');
  });

  it('splits by food, so a sheet only ever holds its own sessions', () => {
    const sheets = build([
      session(1, { food: 'Mela', foodId: 'mela' }),
      session(2, { food: 'Carota', foodId: 'carota' }),
      session(3, { food: 'Mela', foodId: 'mela' }),
    ]);
    expect(cellAt(sheets[0], FIRST_DATA_ROW + 1, 1)).toBe(2);
    expect(cellAt(sheets[1], FIRST_DATA_ROW + 1, 1)).toBeUndefined();
  });
});

describe('the chart of a food sheet', () => {
  it('draws a series per level plus the criterion', () => {
    const [sheet] = build([
      session(1, { levels: [{ levelId: 1, engagementRatio: 24 }, { levelId: 2, engagementRatio: 50 }] }),
    ]);
    expect(sheet.chart.series.map((s) => s.name)).toEqual([
      'L1 · Livello 1',
      'L2 · Livello 2',
      'Criterio 40%',
    ]);
  });

  it('sets the criterion apart from the level lines and names it on the chart', () => {
    const [sheet] = build([session(1), session(2)]);
    const criterion = sheet.chart.series.find((s) => s.name === 'Criterio 40%');

    expect(criterion?.dash).toBe('lgDash');
    expect(criterion?.labelLastPoint).toBe(true);
    expect(criterion?.marker).toBeUndefined();
    // a colour of its own, or it disappears under whichever level runs along it
    const levelColors = sheet.chart.series
      .filter((s) => s.name.startsWith('L'))
      .map((s) => s.color);
    expect(levelColors).not.toContain(criterion?.color);
  });

  it('points the series at the rows the data actually occupies', () => {
    const [sheet] = build([session(1), session(2), session(3)]);
    expect(sheet.chart.series[0].xRef).toBe("'Mela'!$B$11:$B$13");
    expect(sheet.chart.series[0].yRef).toBe("'Mela'!$E$11:$E$13");
  });

  it('scales the session axis to the number of sessions', () => {
    const [sheet] = build([session(1), session(2), session(3)]);
    expect(sheet.chart.xMax).toBe(3);
    expect(sheet.chart.yMax).toBe(100);
  });

  it('sits below the last data row', () => {
    const [sheet] = build([session(1), session(2), session(3)]);
    expect(sheet.anchor.fromRow).toBe(14);
    expect(sheet.anchor.toRow).toBeGreaterThan(sheet.anchor.fromRow);
  });
});

describe('buildAbaWorkbook', () => {
  it('packs a sheet, a drawing and a chart per food', () => {
    const bytes = buildAbaWorkbook({
      childId: 'John Doe',
      criterion: 40,
      sessions: [
        session(1, { food: 'Mela', foodId: 'mela' }),
        session(2, { food: 'Carota', foodId: 'carota' }),
      ],
    });
    const files = unzipSync(bytes);

    expect(files['xl/worksheets/sheet2.xml']).toBeDefined();
    expect(files['xl/charts/chart2.xml']).toBeDefined();
    expect(strFromU8(files['xl/worksheets/sheet1.xml'])).toContain('<drawing r:id="rId1"/>');
    expect(strFromU8(files['xl/charts/chart1.xml'])).toContain("'Mela'!$B$11:$B$11");
  });

  it('refuses to export nothing', () => {
    expect(() => buildAbaWorkbook({ childId: 'John Doe', criterion: 40, sessions: [] })).toThrow(
      /Nessuna sessione/,
    );
  });
});

describe('abaWorkbookFileName', () => {
  it('names the file after the child, the food and the day', () => {
    expect(abaWorkbookFileName('John Doe', 'Mela', new Date(2026, 6, 26))).toBe(
      'schede-aba_John-Doe_Mela_2026-07-26.xlsx',
    );
  });

  it('strips whatever a file system would object to', () => {
    expect(abaWorkbookFileName('../John/Doe?', 'Purè/di patate', new Date(2026, 0, 5))).toBe(
      'schede-aba_John-Doe_Purè-di-patate_2026-01-05.xlsx',
    );
  });

  it('falls back when the names have nothing usable left', () => {
    expect(abaWorkbookFileName('///', '???', new Date(2026, 0, 5))).toBe(
      'schede-aba_bambino_alimento_2026-01-05.xlsx',
    );
  });
});
