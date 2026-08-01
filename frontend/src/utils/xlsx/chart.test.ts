import { describe, it, expect } from 'vitest';
import { buildChartXml } from './chart';
import type { ChartSeries, ChartSpec } from './chart';

const series = (over: Partial<ChartSeries> = {}): ChartSeries => ({
  name: 'L1 · La Raccolta',
  xRef: "'Mela'!$B$11:$B$13",
  xValues: [1, 2, 3],
  yRef: "'Mela'!$E$11:$E$13",
  yValues: [10, 20, 30],
  color: '1565C0',
  marker: 'circle',
  ...over,
});

const spec = (over: Partial<ChartSpec> = {}): ChartSpec => ({
  title: 'John Doe · Mela',
  xTitle: 'Sessione',
  yTitle: '% di contatto',
  xMax: 3,
  yMax: 100,
  series: [series()],
  ...over,
});

describe('buildChartXml', () => {
  it('plots a scatter chart with lines and markers', () => {
    const xml = buildChartXml(spec());
    expect(xml).toContain('<c:scatterChart>');
    expect(xml).toContain('<c:scatterStyle val="lineMarker"/>');
    expect(xml).toContain('<c:symbol val="circle"/>');
  });

  it('points each series at its columns', () => {
    const xml = buildChartXml(spec());
    expect(xml).toContain("<c:f>'Mela'!$B$11:$B$13</c:f>");
    expect(xml).toContain("<c:f>'Mela'!$E$11:$E$13</c:f>");
  });

  it('caches the values so viewers that never recalculate still draw the line', () => {
    const xml = buildChartXml(spec());
    expect(xml).toContain('<c:ptCount val="3"/>');
    expect(xml).toContain('<c:pt idx="2"><c:v>30</c:v></c:pt>');
  });

  it('leaves out cached points for levels a session did not run', () => {
    const xml = buildChartXml(spec({ series: [series({ yValues: [10, null, 30] })] }));
    expect(xml).toContain(
      '<c:ptCount val="3"/><c:pt idx="0"><c:v>10</c:v></c:pt><c:pt idx="2"><c:v>30</c:v></c:pt>',
    );
    expect(xml).toContain('<c:dispBlanksAs val="gap"/>');
  });

  it('numbers the series in order', () => {
    const xml = buildChartXml(spec({ series: [series(), series({ name: 'Criterio 40%' })] }));
    expect(xml).toContain('<c:idx val="0"/><c:order val="0"/>');
    expect(xml).toContain('<c:idx val="1"/><c:order val="1"/>');
  });

  it('dashes and thins the lines that are references, not data', () => {
    const xml = buildChartXml(spec({ series: [series({ dashed: true, thin: true, marker: 'none' })] }));
    expect(xml).toContain('<a:prstDash val="dash"/>');
    expect(xml).toContain('<a:ln w="12700" cap="rnd">');
    expect(xml).toContain('<c:symbol val="none"/>');
  });

  it('hides the change lines from the legend without hiding the line', () => {
    const xml = buildChartXml(
      spec({ series: [series(), series({ name: 'Cambio', hideFromLegend: true })] }),
    );
    expect(xml).toContain('<c:legendEntry><c:idx val="1"/><c:delete val="1"/></c:legendEntry>');
    expect(xml).not.toContain('<c:idx val="0"/><c:delete val="1"/>');
  });

  it('pads the session axis half a step on either side', () => {
    const xml = buildChartXml(spec({ xMax: 7 }));
    expect(xml).toContain('<c:max val="7.5"/>');
    expect(xml).toContain('<c:min val="0.5"/>');
    expect(xml).toContain('<c:majorUnit val="1"/>');
  });

  it('locks the percentage axis to 0-100', () => {
    const xml = buildChartXml(spec());
    expect(xml).toContain('<c:max val="100"/><c:min val="0"/>');
  });

  it('escapes series names and titles', () => {
    const xml = buildChartXml(spec({ title: 'Mela & pera', series: [series({ name: '<L1>' })] }));
    expect(xml).toContain('Mela &amp; pera');
    expect(xml).toContain('&lt;L1&gt;');
  });

  it('gives the two axes the ids the chart cross-references', () => {
    const xml = buildChartXml(spec());
    expect(xml).toContain('<c:axId val="111111111"/><c:axId val="222222222"/>');
    expect(xml).toContain('<c:crossAx val="222222222"/>');
    expect(xml).toContain('<c:crossAx val="111111111"/>');
  });
});
