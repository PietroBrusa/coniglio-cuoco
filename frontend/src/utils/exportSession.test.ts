import { describe, it, expect } from 'vitest';
import { sessionToCsv, formatMetrics } from './exportSession';
import { LEVELS } from '../game/levels';
import type { LevelResult, Session } from '../types';

/**
 * Splits one CSV line the way a real reader (Excel, R, pandas) does: quoted
 * fields may contain commas, and a doubled quote inside them is a literal quote.
 * Used to assert that the exported columns actually line up.
 */
function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let field = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') {
        field += '"';
        i += 1;
      } else if (ch === '"') inQuotes = false;
      else field += ch;
    } else if (ch === '"') inQuotes = true;
    else if (ch === ',') {
      fields.push(field);
      field = '';
    } else field += ch;
  }
  fields.push(field);
  return fields;
}

/**
 * UNIT tests for the pure serialisation/formatting helpers.
 *
 * `sessionToCsv` and `formatMetrics` are pure functions (no DOM, no I/O), so
 * they are tested with plain input/output assertions. The file-download helpers
 * (`downloadJson`/`downloadCsv`) are intentionally left out here: they only wire
 * these pure functions to browser APIs (Blob/URL/anchor) and are better covered
 * by the browser-level tests.
 */

const level: LevelResult = {
  levelId: 1,
  levelName: 'La Raccolta',
  behavior: 'Approccio e contatto con le dita',
  mode: 'count',
  target: 5,
  metrics: {
    n: 3,
    latencyMs: 800,
    totalContactMs: 1500,
    meanTouchMs: 500,
    meanIrtMs: 250,
    sessionDurationMs: 5000,
    engagementRatio: 30,
    touches: [],
  },
};

const session: Session = {
  childId: 'B001',
  sessionNumber: 2,
  food: 'Carota',
  foodId: 'carota',
  difficulty: 'facile',
  date: '2026-07-07T10:00:00.000Z',
  levels: [level],
};

describe('sessionToCsv', () => {
  it('emits a header row followed by one row per level', () => {
    const lines = sessionToCsv(session).split('\n');
    expect(lines).toHaveLength(2); // header + 1 level
    expect(lines[0]).toContain('IdBambino');
    expect(lines[0]).toContain('EngagementRatio_%');
  });

  it('converts millisecond metrics to seconds with 2 decimals', () => {
    const row = sessionToCsv(session).split('\n')[1].split(',');
    // Column order mirrors CSV_HEADER in exportSession.ts.
    expect(row[0]).toBe('B001'); // IdBambino
    expect(row[2]).toBe('2'); // NSessione
    expect(row[3]).toBe('Carota'); // Alimento
    expect(row[7]).toBe('5.00'); // DurataSessione_s (5000ms)
    expect(row[8]).toBe('3'); // NTocchi
    expect(row[9]).toBe('0.80'); // Latenza_s (800ms)
    expect(row[13]).toBe('30.0'); // EngagementRatio_% (1 decimal)
  });

  // Regression: level 2's real `behavior` text contains a comma. Written raw it
  // acted as a column separator and shifted every metric one place to the left,
  // silently corrupting the exported dataset.
  it('keeps the columns aligned when a field contains a comma', () => {
    const annusata = LEVELS[1];
    expect(annusata.behavior).toContain(','); // guards the premise of this test

    const csv = sessionToCsv({
      ...session,
      levels: [{ ...level, levelId: annusata.id, levelName: annusata.name, behavior: annusata.behavior }],
    });
    const [header, row] = csv.split('\n').map(parseCsvLine);

    expect(row).toHaveLength(header.length);
    expect(row[6]).toBe(annusata.behavior); // Comportamento, comma and all
    expect(row[7]).toBe('5.00'); // DurataSessione_s — still in its own column
    expect(row[8]).toBe('3'); // NTocchi
    expect(row[13]).toBe('30.0'); // EngagementRatio_% — no longer falls off the row
  });

  it('escapes quotes and commas in free-text fields (child name, food)', () => {
    const csv = sessionToCsv({ ...session, childId: 'Rossi, Mario', food: 'Pane "integrale"' });
    const row = parseCsvLine(csv.split('\n')[1]);

    expect(row[0]).toBe('Rossi, Mario');
    expect(row[3]).toBe('Pane "integrale"');
    expect(row).toHaveLength(14);
  });
});

describe('formatMetrics', () => {
  it('labels every metric with human-readable units', () => {
    const rows = formatMetrics(level.metrics);
    const byLabel = Object.fromEntries(rows.map((r) => [r.label, r.value]));

    expect(byLabel['Tocchi (n)']).toBe(3);
    expect(byLabel['Latenza 1° tocco']).toBe('0.80 s');
    expect(byLabel['Engagement Ratio']).toBe('30.0 %');
  });

  it('renders a dash for null values (e.g. no taps recorded)', () => {
    const rows = formatMetrics({ ...level.metrics, latencyMs: null, meanIrtMs: null });
    const byLabel = Object.fromEntries(rows.map((r) => [r.label, r.value]));

    expect(byLabel['Latenza 1° tocco']).toBe('—');
    expect(byLabel['IRT medio']).toBe('—');
  });

  it('accepts live metrics that use "count" instead of "n"', () => {
    const rows = formatMetrics({
      count: 7,
      latencyMs: 0,
      totalContactMs: 0,
      meanTouchMs: null,
      meanIrtMs: null,
      sessionDurationMs: 0,
      engagementRatio: 0,
    });
    const byLabel = Object.fromEntries(rows.map((r) => [r.label, r.value]));
    expect(byLabel['Tocchi (n)']).toBe(7);
  });
});
