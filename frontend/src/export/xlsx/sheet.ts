import { XML_DECL, esc } from './xml';

/** Style indexes into the cellXfs list written by {@link stylesXml}. */
export const STYLE_DEFAULT = 0;
export const STYLE_BOLD = 1;

export type CellValue = string | number | null | undefined;

export interface Cell {
  value: CellValue;
  bold?: boolean;
}

export type CellInput = Cell | CellValue;
export type SheetRow = CellInput[];

export interface SheetOptions {
  /** Column widths in characters, left to right; missing entries keep the default. */
  columnWidths?: number[];
  /** Emits the <drawing> reference the worksheet rels point at the chart. */
  hasDrawing?: boolean;
}

/** 0 -> A, 25 -> Z, 26 -> AA. */
export function columnLetter(index: number): string {
  let n = index + 1;
  let out = '';
  while (n > 0) {
    const rest = (n - 1) % 26;
    out = String.fromCharCode(65 + rest) + out;
    n = Math.floor((n - 1) / 26);
  }
  return out;
}

/** Sheet names are quoted in formulas, and a quote inside one is doubled. */
export const quoteSheetName = (name: string): string => `'${name.replace(/'/g, "''")}'`;

/** An absolute single-column range such as 'Mela'!$B$11:$B$20, as chart formulas want it. */
export function columnRange(
  sheetName: string,
  column: number,
  firstRow: number,
  lastRow: number,
): string {
  const letter = columnLetter(column);
  return `${quoteSheetName(sheetName)}!$${letter}$${firstRow}:$${letter}$${lastRow}`;
}

/**
 * Excel rejects these characters in a sheet name and truncates past 31 characters,
 * so we do it ourselves rather than let it offer to repair the file.
 */
export function sanitizeSheetName(name: string, taken: string[] = []): string {
  const cleaned = name.replace(/[[\]:*?/\\]/g, ' ').replace(/\s+/g, ' ').trim();
  const base = (cleaned || 'Foglio').slice(0, 31);
  if (!taken.includes(base)) return base;

  for (let n = 2; ; n += 1) {
    const suffix = ` (${n})`;
    const candidate = base.slice(0, 31 - suffix.length) + suffix;
    if (!taken.includes(candidate)) return candidate;
  }
}

const toCell = (input: CellInput): Cell =>
  input !== null && typeof input === 'object' ? input : { value: input };

function cellXml(ref: string, input: CellInput): string {
  const { value, bold } = toCell(input);
  if (value === null || value === undefined || value === '') return '';

  const style = bold ? ` s="${STYLE_BOLD}"` : '';
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) return '';
    return `<c r="${ref}"${style}><v>${value}</v></c>`;
  }
  return `<c r="${ref}"${style} t="inlineStr"><is><t xml:space="preserve">${esc(value)}</t></is></c>`;
}

export function buildSheetXml(rows: SheetRow[], options: SheetOptions = {}): string {
  const { columnWidths = [], hasDrawing = false } = options;

  const cols = columnWidths.length
    ? `<cols>${columnWidths
        .map((w, i) => `<col min="${i + 1}" max="${i + 1}" width="${w}" customWidth="1"/>`)
        .join('')}</cols>`
    : '';

  const sheetData = rows
    .map((row, rowIndex) => {
      const cells = row.map((cell, col) => cellXml(`${columnLetter(col)}${rowIndex + 1}`, cell)).join('');
      return cells ? `<row r="${rowIndex + 1}">${cells}</row>` : '';
    })
    .join('');

  return (
    `${XML_DECL}<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"` +
    ` xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">` +
    cols +
    `<sheetData>${sheetData}</sheetData>` +
    (hasDrawing ? '<drawing r:id="rId1"/>' : '') +
    `</worksheet>`
  );
}

/**
 * The smallest style sheet Excel accepts. Colours are explicit sRGB so the workbook
 * needs no theme part.
 */
export function stylesXml(): string {
  return (
    `${XML_DECL}<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">` +
    `<fonts count="2">` +
    `<font><sz val="11"/><color rgb="FF000000"/><name val="Calibri"/><family val="2"/></font>` +
    `<font><b/><sz val="11"/><color rgb="FF000000"/><name val="Calibri"/><family val="2"/></font>` +
    `</fonts>` +
    `<fills count="2">` +
    `<fill><patternFill patternType="none"/></fill>` +
    `<fill><patternFill patternType="gray125"/></fill>` +
    `</fills>` +
    `<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>` +
    `<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>` +
    `<cellXfs count="2">` +
    `<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>` +
    `<xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/>` +
    `</cellXfs>` +
    `<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>` +
    `</styleSheet>`
  );
}
