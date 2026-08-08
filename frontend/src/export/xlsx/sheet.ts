/**
 * Costruzione di un foglio di lavoro: celle, righe, larghezze delle colonne,
 * riferimenti usati dalle formule del grafico e foglio di stili minimo.
 *
 * @module
 */

import { XML_DECL, esc } from './xml';

/** Stile predefinito: indice nella lista `cellXfs` scritta da {@link stylesXml}. */
export const STYLE_DEFAULT = 0;
/** Stile grassetto, usato dalle intestazioni. */
export const STYLE_BOLD = 1;

/** Valore che può finire in una cella; `null` e `undefined` la lasciano vuota. */
export type CellValue = string | number | null | undefined;

/** Una cella con la sua formattazione. */
export interface Cell {
  /** Contenuto della cella. */
  value: CellValue;
  /** Scrive il contenuto in grassetto. */
  bold?: boolean;
}

/** Una cella si può indicare per esteso oppure con il solo valore. */
export type CellInput = Cell | CellValue;

/** Una riga del foglio; le posizioni non assegnate restano vuote. */
export type SheetRow = CellInput[];

/** Opzioni di generazione del foglio. */
export interface SheetOptions {
  /** Larghezza delle colonne in caratteri, da sinistra a destra; le mancanti restano predefinite. */
  columnWidths?: number[];
  /** Emette il riferimento al disegno che le relazioni del foglio puntano al grafico. */
  hasDrawing?: boolean;
}

/**
 * Converte un indice di colonna nella lettera usata da Excel.
 *
 * @param index - Indice a partire da 0.
 * @returns `A` per 0, `Z` per 25, `AA` per 26 e così via.
 */
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

/**
 * Racchiude fra apici il nome del foglio come vogliono le formule; un apice
 * contenuto nel nome va raddoppiato.
 */
export const quoteSheetName = (name: string): string => `'${name.replace(/'/g, "''")}'`;

/**
 * Intervallo assoluto su una sola colonna, nella forma che le formule del
 * grafico si aspettano.
 *
 * @param sheetName - Nome del foglio a cui l'intervallo appartiene.
 * @param column - Indice della colonna, a partire da 0.
 * @param firstRow - Prima riga dell'intervallo, a partire da 1.
 * @param lastRow - Ultima riga dell'intervallo, inclusa.
 * @returns Un riferimento come `'Mela'!$B$11:$B$20`.
 */
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
 * Ripulisce il nome di un foglio.
 *
 * Excel rifiuta i caratteri `[ ] : * ? / \` nei nomi dei fogli e tronca oltre i
 * 31 caratteri: meglio farlo qui che lasciargli proporre la riparazione del
 * file. I nomi già usati vengono resi univoci con un suffisso numerico.
 *
 * @param name - Nome desiderato, tipicamente quello dell'alimento.
 * @param taken - Nomi già assegnati ad altri fogli.
 * @returns Un nome valido e diverso da quelli già assegnati.
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

/**
 * Costruisce la parte XML di un foglio di lavoro.
 *
 * Le righe e le celle vuote non vengono emesse affatto: il file resta più
 * piccolo ed Excel le tratta comunque come vuote.
 *
 * @param rows - Contenuto del foglio, riga per riga.
 * @param options - Larghezze delle colonne ed eventuale riferimento al disegno.
 * @returns Il contenuto di `xl/worksheets/sheetN.xml`.
 */
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
 * Il foglio di stili più piccolo che Excel accetti: due font, normale e
 * grassetto.
 *
 * I colori sono indicati in sRGB esplicito, così il file non ha bisogno della
 * parte del tema.
 *
 * @returns Il contenuto di `xl/styles.xml`.
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
