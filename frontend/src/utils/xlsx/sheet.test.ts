import { describe, it, expect } from 'vitest';
import {
  buildSheetXml,
  columnLetter,
  columnRange,
  quoteSheetName,
  sanitizeSheetName,
  stylesXml,
} from './sheet';

describe('columnLetter', () => {
  it('counts like a spreadsheet does', () => {
    expect(columnLetter(0)).toBe('A');
    expect(columnLetter(25)).toBe('Z');
    expect(columnLetter(26)).toBe('AA');
    expect(columnLetter(51)).toBe('AZ');
    expect(columnLetter(701)).toBe('ZZ');
  });
});

describe('quoteSheetName', () => {
  it('doubles the quotes inside a name', () => {
    expect(quoteSheetName('Mela')).toBe("'Mela'");
    expect(quoteSheetName("Nonna's")).toBe("'Nonna''s'");
  });
});

describe('columnRange', () => {
  it('builds an absolute single-column range', () => {
    expect(columnRange('Mela', 1, 11, 20)).toBe("'Mela'!$B$11:$B$20");
  });
});

describe('sanitizeSheetName', () => {
  it('drops the characters Excel rejects', () => {
    expect(sanitizeSheetName('Mela / Pera [bio]')).toBe('Mela Pera bio');
  });

  it('truncates past 31 characters', () => {
    expect(sanitizeSheetName('a'.repeat(40))).toHaveLength(31);
  });

  it('falls back when nothing is left', () => {
    expect(sanitizeSheetName('///')).toBe('Foglio');
  });

  it('makes duplicates unique', () => {
    expect(sanitizeSheetName('Mela', ['Mela'])).toBe('Mela (2)');
    expect(sanitizeSheetName('Mela', ['Mela', 'Mela (2)'])).toBe('Mela (3)');
  });

  it('keeps a deduplicated long name within the limit', () => {
    const name = sanitizeSheetName('b'.repeat(40), ['b'.repeat(31)]);
    expect(name).toHaveLength(31);
    expect(name.endsWith(' (2)')).toBe(true);
  });
});

describe('buildSheetXml', () => {
  it('writes numbers bare and text as inline strings', () => {
    const xml = buildSheetXml([['Mela', 42]]);
    expect(xml).toContain('<c r="A1" t="inlineStr"><is><t xml:space="preserve">Mela</t></is></c>');
    expect(xml).toContain('<c r="B1"><v>42</v></c>');
  });

  it('marks bold cells with the bold style', () => {
    expect(buildSheetXml([[{ value: 'Data', bold: true }]])).toContain('<c r="A1" s="1"');
  });

  it('skips empty cells so gaps stay gaps in the chart', () => {
    const xml = buildSheetXml([['a', null, undefined, '', 0]]);
    expect(xml).not.toContain('r="B1"');
    expect(xml).not.toContain('r="C1"');
    expect(xml).not.toContain('r="D1"');
    expect(xml).toContain('<c r="E1"><v>0</v></c>');
  });

  it('omits rows that hold nothing', () => {
    const xml = buildSheetXml([['a'], [], ['b']]);
    expect(xml).toContain('<row r="1">');
    expect(xml).not.toContain('<row r="2">');
    expect(xml).toContain('<row r="3">');
  });

  it('escapes text that would break the XML', () => {
    const xml = buildSheetXml([['pesca & <mela>']]);
    expect(xml).toContain('pesca &amp; &lt;mela&gt;');
  });

  it('drops control characters', () => {
    const withNull = `no${String.fromCharCode(0)}te`;
    expect(buildSheetXml([[withNull]])).toContain('>note<');
  });

  it('references the drawing only when asked', () => {
    expect(buildSheetXml([['a']], { hasDrawing: true })).toContain('<drawing r:id="rId1"/>');
    expect(buildSheetXml([['a']])).not.toContain('<drawing');
  });

  it('writes the requested column widths', () => {
    const xml = buildSheetXml([['a']], { columnWidths: [12, 30] });
    expect(xml).toContain('<col min="1" max="1" width="12" customWidth="1"/>');
    expect(xml).toContain('<col min="2" max="2" width="30" customWidth="1"/>');
  });
});

describe('stylesXml', () => {
  it('declares exactly the two formats the cells reference', () => {
    expect(stylesXml()).toContain('<cellXfs count="2">');
  });

  it('uses explicit colours so no theme part is needed', () => {
    expect(stylesXml()).not.toContain('theme=');
  });
});
