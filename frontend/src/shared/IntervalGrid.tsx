import type { IntervalRecord } from '../utils/abaData';
import c from './IntervalGrid.module.scss';

interface IntervalGridProps {
  record: IntervalRecord;
  caption: string;
}

/**
 * Whole-interval recording grid, laid out like the paper data sheet: one column
 * per second of the level's window, scored `+` (contact for that whole second)
 * or `−`. The glyph carries the meaning, colour only reinforces it.
 */
const IntervalGrid = ({ record, caption }: IntervalGridProps) => (
  <table className={c.grid}>
    <caption className={c.caption}>
      {caption} — intervalli da {(record.intervalMs / 1000).toFixed(1)} s
    </caption>
    <thead>
      <tr>
        <th scope="col">Secondo</th>
        {record.marks.map((_, i) => (
          <th key={i} scope="col">
            {i + 1}
          </th>
        ))}
        <th scope="col" className={c.totalCol}>
          %
        </th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <th scope="row">(+/−)</th>
        {record.marks.map((mark, i) => (
          <td key={i} className={mark ? c.plus : c.minus}>
            {mark ? '+' : '−'}
          </td>
        ))}
        <td className={c.totalCol}>{record.percent.toFixed(0)}%</td>
      </tr>
    </tbody>
  </table>
);

export default IntervalGrid;
