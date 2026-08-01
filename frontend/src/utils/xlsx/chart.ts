import { XML_DECL, esc } from './xml';

/**
 * A hand-written DrawingML scatter chart. No mainstream JavaScript spreadsheet library
 * emits Excel charts, so the chart part is built here element by element; the order of
 * the children matters, Excel refuses to open the file when it is wrong.
 */

const X_AXIS_ID = 111111111;
const Y_AXIS_ID = 222222222;

/** Line weight in EMU (1 pt = 12700). */
const THICK = 22225;
const THIN = 12700;

export type MarkerSymbol = 'circle' | 'square' | 'diamond' | 'triangle' | 'none';

export interface ChartSeries {
  name: string;
  /** Formula pointing at the X column, e.g. 'Mela'!$B$11:$B$20 */
  xRef: string;
  xValues: number[];
  /** Formula pointing at the Y column. */
  yRef: string;
  /** null leaves a gap in the line, for a level not run in that session. */
  yValues: (number | null)[];
  /** Six hex digits, no leading hash. */
  color: string;
  marker?: MarkerSymbol;
  dashed?: boolean;
  thin?: boolean;
  /** Keeps the series out of the legend without hiding the line. */
  hideFromLegend?: boolean;
}

export interface ChartSpec {
  title: string;
  xTitle: string;
  yTitle: string;
  /** Highest X value plotted; the axis is padded half a step on either side. */
  xMax: number;
  yMax: number;
  series: ChartSeries[];
}

export function buildChartXml(spec: ChartSpec): string {
  const series = spec.series.map(seriesXml).join('');

  const hidden = spec.series
    .map((s, i) => (s.hideFromLegend ? `<c:legendEntry><c:idx val="${i}"/><c:delete val="1"/></c:legendEntry>` : ''))
    .join('');

  return (
    `${XML_DECL}<c:chartSpace` +
    ` xmlns:c="http://schemas.openxmlformats.org/drawingml/2006/chart"` +
    ` xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"` +
    ` xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">` +
    `<c:roundedCorners val="0"/>` +
    `<c:chart>` +
    title(spec.title, 1200, true) +
    `<c:autoTitleDeleted val="0"/>` +
    `<c:plotArea>` +
    `<c:layout/>` +
    `<c:scatterChart>` +
    `<c:scatterStyle val="lineMarker"/>` +
    `<c:varyColors val="0"/>` +
    series +
    `<c:axId val="${X_AXIS_ID}"/><c:axId val="${Y_AXIS_ID}"/>` +
    `</c:scatterChart>` +
    xAxisXml(spec) +
    yAxisXml(spec) +
    `</c:plotArea>` +
    `<c:legend><c:legendPos val="b"/>${hidden}<c:overlay val="0"/></c:legend>` +
    `<c:plotVisOnly val="1"/>` +
    `<c:dispBlanksAs val="gap"/>` +
    `</c:chart>` +
    `</c:chartSpace>`
  );
}

function seriesXml(s: ChartSeries, index: number): string {
  const dash = s.dashed ? '<a:prstDash val="dash"/>' : '';
  const line =
    `<a:ln w="${s.thin ? THIN : THICK}" cap="rnd">` +
    `<a:solidFill><a:srgbClr val="${s.color}"/></a:solidFill>${dash}<a:round/>` +
    `</a:ln>`;

  const symbol = s.marker ?? 'none';
  const marker =
    symbol === 'none'
      ? `<c:marker><c:symbol val="none"/></c:marker>`
      : `<c:marker><c:symbol val="${symbol}"/><c:size val="6"/>` +
        `<c:spPr><a:solidFill><a:srgbClr val="${s.color}"/></a:solidFill>` +
        `<a:ln w="9525"><a:solidFill><a:srgbClr val="${s.color}"/></a:solidFill></a:ln></c:spPr>` +
        `</c:marker>`;

  return (
    `<c:ser>` +
    `<c:idx val="${index}"/><c:order val="${index}"/>` +
    `<c:tx><c:v>${esc(s.name)}</c:v></c:tx>` +
    `<c:spPr>${line}</c:spPr>` +
    marker +
    `<c:xVal>${numRef(s.xRef, s.xValues)}</c:xVal>` +
    `<c:yVal>${numRef(s.yRef, s.yValues)}</c:yVal>` +
    `<c:smooth val="0"/>` +
    `</c:ser>`
  );
}

/**
 * Excel recomputes the cache from the formula on open, but writing it means the chart
 * also renders in viewers that never recalculate.
 */
function numRef(formula: string, values: (number | null)[]): string {
  const points = values
    .map((v, i) => (v === null || !Number.isFinite(v) ? '' : `<c:pt idx="${i}"><c:v>${v}</c:v></c:pt>`))
    .join('');
  return (
    `<c:numRef><c:f>${esc(formula)}</c:f>` +
    `<c:numCache><c:formatCode>General</c:formatCode><c:ptCount val="${values.length}"/>${points}</c:numCache>` +
    `</c:numRef>`
  );
}

function title(text: string, sizeHundredths: number, bold = false): string {
  return (
    `<c:title><c:tx><c:rich>` +
    `<a:bodyPr rot="0" vert="horz"/><a:lstStyle/>` +
    `<a:p><a:pPr><a:defRPr sz="${sizeHundredths}" b="${bold ? 1 : 0}"/></a:pPr>` +
    `<a:r><a:rPr lang="it-IT" sz="${sizeHundredths}" b="${bold ? 1 : 0}"/><a:t>${esc(text)}</a:t></a:r>` +
    `</a:p></c:rich></c:tx><c:overlay val="0"/></c:title>`
  );
}

function xAxisXml(spec: ChartSpec): string {
  return (
    `<c:valAx>` +
    `<c:axId val="${X_AXIS_ID}"/>` +
    `<c:scaling><c:orientation val="minMax"/><c:max val="${spec.xMax + 0.5}"/><c:min val="0.5"/></c:scaling>` +
    `<c:delete val="0"/>` +
    `<c:axPos val="b"/>` +
    title(spec.xTitle, 1000) +
    `<c:numFmt formatCode="0" sourceLinked="0"/>` +
    `<c:majorTickMark val="out"/><c:minorTickMark val="none"/><c:tickLblPos val="nextTo"/>` +
    `<c:crossAx val="${Y_AXIS_ID}"/>` +
    `<c:crosses val="autoZero"/>` +
    `<c:crossBetween val="midCat"/>` +
    `<c:majorUnit val="1"/>` +
    `</c:valAx>`
  );
}

function yAxisXml(spec: ChartSpec): string {
  return (
    `<c:valAx>` +
    `<c:axId val="${Y_AXIS_ID}"/>` +
    `<c:scaling><c:orientation val="minMax"/><c:max val="${spec.yMax}"/><c:min val="0"/></c:scaling>` +
    `<c:delete val="0"/>` +
    `<c:axPos val="l"/>` +
    `<c:majorGridlines/>` +
    title(spec.yTitle, 1000) +
    `<c:numFmt formatCode="0" sourceLinked="0"/>` +
    `<c:majorTickMark val="out"/><c:minorTickMark val="none"/><c:tickLblPos val="nextTo"/>` +
    `<c:crossAx val="${X_AXIS_ID}"/>` +
    `<c:crosses val="autoZero"/>` +
    `</c:valAx>`
  );
}
