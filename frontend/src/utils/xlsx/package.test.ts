import { describe, it, expect } from 'vitest';
import { unzipSync, strFromU8 } from 'fflate';
import { buildXlsxParts, zipXlsx } from './package';
import type { XlsxSheet } from './package';

const anchor = { fromCol: 0, fromRow: 12, toCol: 10, toRow: 36 };
const sheet = (name: string, withChart = true): XlsxSheet => ({
  name,
  sheetXml: '<worksheet/>',
  chart: withChart ? { xml: '<c:chartSpace/>', anchor } : undefined,
});

describe('buildXlsxParts', () => {
  it('lays out every part a chart needs', () => {
    const parts = buildXlsxParts([sheet('Mela')]);
    expect(Object.keys(parts).sort()).toEqual(
      [
        '[Content_Types].xml',
        '_rels/.rels',
        'xl/_rels/workbook.xml.rels',
        'xl/charts/chart1.xml',
        'xl/drawings/_rels/drawing1.xml.rels',
        'xl/drawings/drawing1.xml',
        'xl/styles.xml',
        'xl/workbook.xml',
        'xl/worksheets/_rels/sheet1.xml.rels',
        'xl/worksheets/sheet1.xml',
      ].sort(),
    );
  });

  it('skips the drawing chain for a sheet without a chart', () => {
    const parts = buildXlsxParts([sheet('Mela', false)]);
    expect(parts['xl/drawings/drawing1.xml']).toBeUndefined();
    expect(parts['[Content_Types].xml']).not.toContain('/xl/charts/chart1.xml');
  });

  it('numbers the sheets and their relationships consistently', () => {
    const parts = buildXlsxParts([sheet('Mela'), sheet('Carota')]);
    expect(parts['xl/workbook.xml']).toContain('<sheet name="Mela" sheetId="1" r:id="rId1"/>');
    expect(parts['xl/workbook.xml']).toContain('<sheet name="Carota" sheetId="2" r:id="rId2"/>');
    expect(parts['xl/_rels/workbook.xml.rels']).toContain('Target="worksheets/sheet2.xml"');
    expect(parts['xl/worksheets/_rels/sheet2.xml.rels']).toContain('Target="../drawings/drawing2.xml"');
    expect(parts['xl/drawings/_rels/drawing2.xml.rels']).toContain('Target="../charts/chart2.xml"');
  });

  it('puts styles after the sheets in the workbook relationships', () => {
    const parts = buildXlsxParts([sheet('Mela'), sheet('Carota')]);
    expect(parts['xl/_rels/workbook.xml.rels']).toContain('Id="rId3"');
    expect(parts['xl/_rels/workbook.xml.rels']).toContain('Target="styles.xml"');
  });

  it('declares a content type for every part with an extension of its own', () => {
    const types = buildXlsxParts([sheet('Mela')])['[Content_Types].xml'];
    for (const part of ['/xl/workbook.xml', '/xl/styles.xml', '/xl/worksheets/sheet1.xml',
      '/xl/drawings/drawing1.xml', '/xl/charts/chart1.xml']) {
      expect(types).toContain(`PartName="${part}"`);
    }
  });

  it('carries no document properties, so no author or path leaks out', () => {
    const parts = buildXlsxParts([sheet('Mela')]);
    expect(Object.keys(parts).some((p) => p.startsWith('docProps/'))).toBe(false);
  });

  it('anchors the chart where the sheet asked', () => {
    const drawing = buildXlsxParts([sheet('Mela')])['xl/drawings/drawing1.xml'];
    expect(drawing).toContain('<xdr:col>0</xdr:col><xdr:colOff>0</xdr:colOff><xdr:row>12</xdr:row>');
    expect(drawing).toContain('<xdr:col>10</xdr:col><xdr:colOff>0</xdr:colOff><xdr:row>36</xdr:row>');
  });

  it('escapes a sheet name that would break the workbook XML', () => {
    const parts = buildXlsxParts([sheet('Pesca & mela')]);
    expect(parts['xl/workbook.xml']).toContain('name="Pesca &amp; mela"');
  });

  it('refuses to build an empty workbook', () => {
    expect(() => buildXlsxParts([])).toThrow();
  });
});

describe('zipXlsx', () => {
  it('produces a zip that unpacks back to the same parts', () => {
    const parts = buildXlsxParts([sheet('Mela')]);
    const unzipped = unzipSync(zipXlsx(parts));

    expect(Object.keys(unzipped).sort()).toEqual(Object.keys(parts).sort());
    expect(strFromU8(unzipped['xl/charts/chart1.xml'])).toBe('<c:chartSpace/>');
  });

  it('starts with the zip magic number', () => {
    const bytes = zipXlsx(buildXlsxParts([sheet('Mela')]));
    expect([...bytes.slice(0, 4)]).toEqual([0x50, 0x4b, 0x03, 0x04]);
  });
});
