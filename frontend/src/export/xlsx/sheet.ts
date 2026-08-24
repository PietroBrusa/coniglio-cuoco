import { XML_DECL, esc } from './xml';


//indice 1 = grassetto, deve restare uguale al secondo <xf> in stylesXml (fontId="1")
export const STYLE_BOLD = 1;

export type CellValue = string | number | null | undefined;

export interface Cell {
  value: CellValue;
  bold?: boolean;
}

export type CellInput = Cell | CellValue;

export type SheetRow = CellInput[];

export interface SheetOptions {
  columnWidths?: number[];
  hasDrawing?: boolean;
}

//conversione indice di colonna in lettere excel
export function columnLetter(index: number): string {
  let n = index + 1;
  let out = '';
  while (n > 0) {
    //-1 prima di % e / = base 26 senza zero, altrimenti 26 non darebbe "AA"
    const rest = (n - 1) % 26;
    out = String.fromCharCode(65 + rest) + out;
    n = Math.floor((n - 1) / 26);
  }
  return out;
}

//per scrivere il nome del foglio dentro un riferimento di formula, non in una cella
export const quoteSheetName = (name: string): string => `'${name.replace(/'/g, "''")}'`;

export function columnRange(
  sheetName: string,
  column: number,
  firstRow: number,
  lastRow: number,
): string {
  const letter = columnLetter(column);
  return `${quoteSheetName(sheetName)}!$${letter}$${firstRow}:$${letter}$${lastRow}`;
}

//vieta alcuni caratteri nel nome del foglio
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

//alla scrittura della riga posso passare un valore o un oggetto, normalizza entrambi in un unico punto
const toCell = (input: CellInput): Cell =>
  input !== null && typeof input === 'object' ? input : { value: input };

//cella vuota/numero non valido -> non crea nessun XML
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
      //se tutte le celle sono vuote, cells è '' e la riga intera non si scrive
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
