import { zipSync, strToU8 } from 'fflate';
import { XML_DECL, esc } from './xml';
import { stylesXml } from './sheet';

//dove va ancorato il grafico
export interface ChartAnchor {
  fromCol: number;
  fromRow: number;
  toCol: number;
  toRow: number;
}

export interface XlsxSheet {
  name: string;
  sheetXml: string;
  chart?: {
    xml: string;
    anchor: ChartAnchor;
  };
}

//nomi standard
const PKG_RELS = 'http://schemas.openxmlformats.org/package/2006/relationships';
const DOC_RELS = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';

//mappa tipo di parte -> MIME type
const CT = {
  workbook: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml',
  styles: 'application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml',
  worksheet: 'application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml',
  drawing: 'application/vnd.openxmlformats-officedocument.drawing+xml',
  chart: 'application/vnd.openxmlformats-officedocument.drawingml.chart+xml',
};

//costruzione xml
export function buildXlsxParts(sheets: XlsxSheet[]): Record<string, string> {
  if (sheets.length === 0) throw new Error('Un workbook deve avere almeno un foglio');

  const parts: Record<string, string> = {};

  parts['[Content_Types].xml'] = contentTypesXml(sheets);
  //punto di inizio che indica il nome del workbook in target
  parts['_rels/.rels'] =
    `${XML_DECL}<Relationships xmlns="${PKG_RELS}">` +
    `<Relationship Id="rId1" Type="${DOC_RELS}/officeDocument" Target="xl/workbook.xml"/>` +
    `</Relationships>`;

  //dichiara quale rId usa ogni foglio
  parts['xl/workbook.xml'] =
    `${XML_DECL}<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"` +
    ` xmlns:r="${DOC_RELS}"><sheets>` +
    sheets
      .map((s, i) => `<sheet name="${esc(s.name)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`)
      .join('') +
    `</sheets></workbook>`;
  //collegamento rId -> file reale
  parts['xl/_rels/workbook.xml.rels'] =
    `${XML_DECL}<Relationships xmlns="${PKG_RELS}">` +
    sheets
      .map(
        (_, i) =>
          `<Relationship Id="rId${i + 1}" Type="${DOC_RELS}/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`,
      )
      .join('') +
    `<Relationship Id="rId${sheets.length + 1}" Type="${DOC_RELS}/styles" Target="styles.xml"/>` +
    `</Relationships>`;

  parts['xl/styles.xml'] = stylesXml();

  sheets.forEach((sheet, i) => {
    const n = i + 1;
    parts[`xl/worksheets/sheet${n}.xml`] = sheet.sheetXml;
    if (!sheet.chart) return;

    //se il foglio ha un grafico collega il foglio a un file drawing, decide dove sulla pagina va collegato qualcosa
    parts[`xl/worksheets/_rels/sheet${n}.xml.rels`] =
      `${XML_DECL}<Relationships xmlns="${PKG_RELS}">` +
      `<Relationship Id="rId1" Type="${DOC_RELS}/drawing" Target="../drawings/drawing${n}.xml"/>` +
      `</Relationships>`;
    //contenuto del drawing
    parts[`xl/drawings/drawing${n}.xml`] = drawingXml(sheet.chart.anchor);
    //collegamento file al grafico
    parts[`xl/drawings/_rels/drawing${n}.xml.rels`] =
      `${XML_DECL}<Relationships xmlns="${PKG_RELS}">` +
      `<Relationship Id="rId1" Type="${DOC_RELS}/chart" Target="../charts/chart${n}.xml"/>` +
      `</Relationships>`;

    parts[`xl/charts/chart${n}.xml`] = sheet.chart.xml;
  });

  return parts;
}

//assegnazione di ogni tipo a ogni parte
function contentTypesXml(sheets: XlsxSheet[]): string {
  const overrides = sheets
    .map((sheet, i) => {
      const n = i + 1;
      //ContentType dice di che tipo è il file
      const worksheet = `<Override PartName="/xl/worksheets/sheet${n}.xml" ContentType="${CT.worksheet}"/>`;
      if (!sheet.chart) return worksheet;
      return (
        worksheet +
        `<Override PartName="/xl/drawings/drawing${n}.xml" ContentType="${CT.drawing}"/>` +
        `<Override PartName="/xl/charts/chart${n}.xml" ContentType="${CT.chart}"/>`
      );
    })
    .join('');

  return (
    `${XML_DECL}<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">` +
    `<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>` +
    `<Default Extension="xml" ContentType="application/xml"/>` +
    `<Override PartName="/xl/workbook.xml" ContentType="${CT.workbook}"/>` +
    `<Override PartName="/xl/styles.xml" ContentType="${CT.styles}"/>` +
    overrides +
    `</Types>`
  );
}

//costruzione dell'xml che indica dove costruire il grafico (celle)
function drawingXml(anchor: ChartAnchor): string {
  const at = (col: number, row: number) =>
    `<xdr:col>${col}</xdr:col><xdr:colOff>0</xdr:colOff><xdr:row>${row}</xdr:row><xdr:rowOff>0</xdr:rowOff>`;

  return (
    `${XML_DECL}<xdr:wsDr` +
    ` xmlns:xdr="http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing"` +
    ` xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">` +
    `<xdr:twoCellAnchor>` +
    `<xdr:from>${at(anchor.fromCol, anchor.fromRow)}</xdr:from>` +
    `<xdr:to>${at(anchor.toCol, anchor.toRow)}</xdr:to>` +
    `<xdr:graphicFrame macro="">` +
    `<xdr:nvGraphicFramePr>` +
    `<xdr:cNvPr id="2" name="Grafico"/>` +
    `<xdr:cNvGraphicFramePr/>` +
    `</xdr:nvGraphicFramePr>` +
    `<xdr:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/></xdr:xfrm>` +
    `<a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/chart">` +
    `<c:chart xmlns:c="http://schemas.openxmlformats.org/drawingml/2006/chart"` +
    ` xmlns:r="${DOC_RELS}" r:id="rId1"/>` +
    `</a:graphicData></a:graphic>` +
    `</xdr:graphicFrame>` +
    `<xdr:clientData/>` +
    `</xdr:twoCellAnchor>` +
    `</xdr:wsDr>`
  );
}

//crea lo zip di xml
export function zipXlsx(parts: Record<string, string>): Uint8Array<ArrayBuffer> {
  const files: Record<string, Uint8Array> = {};
  for (const [path, xml] of Object.entries(parts)) files[path] = strToU8(xml);
  return zipSync(files, { level: 6 }) as Uint8Array<ArrayBuffer>;
}
