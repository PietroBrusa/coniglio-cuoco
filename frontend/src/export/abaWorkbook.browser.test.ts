import { describe, it, expect } from 'vitest';
import { unzipSync, strFromU8 } from 'fflate';
import { buildAbaWorkbook } from './abaWorkbook';
import type { SavedSession } from '@/api/client';

/**
 * The workbook is XML we assemble by hand, so this runs in a browser to hold every part
 * against a real parser. It cannot prove Excel opens the file — only that nothing we
 * write is malformed, which is the failure Excel reports as a corrupt workbook.
 */

const session = (
  sessionNumber: number,
  over: Partial<SavedSession> = {},
): SavedSession =>
  ({
    _id: `id-${sessionNumber}`,
    childId: 'John Doe',
    sessionNumber,
    food: 'Mela',
    foodId: 'mela',
    difficulty: 'facile',
    therapist: 'Mary Major',
    problemBehaviors: ['rifiuto-cibo'],
    notes: 'Note con & e <segni> "particolari".',
    date: `2026-07-0${sessionNumber}T10:00:00.000Z`,
    createdAt: '2026-07-01T10:00:00.000Z',
    levels: [1, 2].map((levelId) => ({
      levelId,
      levelName: `Livello ${levelId}`,
      behavior: 'contatto',
      mode: 'hold' as const,
      target: 6,
      metrics: {
        n: 1,
        latencyMs: 100,
        totalContactMs: 1000,
        meanTouchMs: 1000,
        meanIrtMs: null,
        sessionDurationMs: 4000,
        engagementRatio: 20 * levelId + sessionNumber,
        touches: [],
      },
    })),
    ...over,
  }) as SavedSession;

const sessions: SavedSession[] = [
  session(1),
  session(2, { difficulty: 'difficile' }),
  session(3, { difficulty: 'difficile' }),
  session(4, { food: 'Carota & pera', foodId: 'carota' }),
];

const workbook = () =>
  unzipSync(buildAbaWorkbook({ childId: 'John Doe', sessions, criterion: 40 }));

const parse = (xml: string): Document => new DOMParser().parseFromString(xml, 'application/xml');

describe('the exported workbook', () => {
  it('has every part parse as well-formed XML', () => {
    const files = workbook();
    expect(Object.keys(files).length).toBeGreaterThan(0);

    for (const [path, bytes] of Object.entries(files)) {
      const doc = parse(strFromU8(bytes));
      const failure = doc.querySelector('parsererror');
      expect(failure?.textContent ?? `${path}: ok`).toBe(`${path}: ok`);
    }
  });

  it('declares a content type for every part that is not a rels file', () => {
    const files = workbook();
    const types = parse(strFromU8(files['[Content_Types].xml']));
    const declared = [...types.getElementsByTagName('Override')].map((o) =>
      o.getAttribute('PartName'),
    );

    for (const path of Object.keys(files)) {
      if (path.endsWith('.rels') || path === '[Content_Types].xml') continue;
      expect(declared).toContain(`/${path}`);
    }
  });

  it('resolves every relationship to a part that is in the package', () => {
    const files = workbook();
    const paths = new Set(Object.keys(files));

    for (const [path, bytes] of Object.entries(files)) {
      if (!path.endsWith('.rels')) continue;
      const base = path.replace(/_rels\/[^/]+$/, '');
      const rels = parse(strFromU8(bytes));

      for (const rel of [...rels.getElementsByTagName('Relationship')]) {
        const target = new URL(rel.getAttribute('Target') ?? '', `file:///${base}`).pathname
          .slice(1);
        expect(paths.has(target), `${path} punta a ${target}`).toBe(true);
      }
    }
  });

  it('keeps every chart formula pointing at its own sheet', () => {
    const files = workbook();
    const sheetNames = [...parse(strFromU8(files['xl/workbook.xml'])).getElementsByTagName('sheet')]
      .map((s) => s.getAttribute('name'));

    expect(sheetNames).toEqual(['Mela', 'Carota & pera']);

    sheetNames.forEach((name, i) => {
      const chart = parse(strFromU8(files[`xl/charts/chart${i + 1}.xml`]));
      const formulas = [...chart.getElementsByTagName('c:f')].map((f) => f.textContent ?? '');

      expect(formulas.length).toBeGreaterThan(0);
      for (const formula of formulas) {
        expect(formula.startsWith(`'${name}'!`), `${formula} su ${name}`).toBe(true);
      }
    });
  });

  it('gives the chart of a three-session sheet a series per level, the criterion and the change line', () => {
    const chart = parse(strFromU8(workbook()['xl/charts/chart1.xml']));
    const names = [...chart.getElementsByTagName('c:ser')].map(
      (ser) => ser.getElementsByTagName('c:v')[0]?.textContent,
    );

    expect(names).toEqual([
      'L1 · Livello 1',
      'L2 · Livello 2',
      'Criterio 40%',
      'Cambio · Mela · difficile',
    ]);
  });
});
