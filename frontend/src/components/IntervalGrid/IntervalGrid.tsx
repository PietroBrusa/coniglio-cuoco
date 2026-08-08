import type { IntervalRecord } from '@/export/abaData';
import c from './IntervalGrid.module.scss';

/** Dati della griglia a intervalli. */
interface IntervalGridProps {
  /** Esito della registrazione a intervalli da rappresentare. */
  record: IntervalRecord;
  /** Titolo della tabella, es. «Whole interval recording». */
  caption: string;
}

/**
 * Griglia dei segni `+` e `−`, un intervallo per colonna, con la percentuale
 * finale.
 *
 * Riproduce la griglia del modulo cartaceo, che il terapista riconosce a colpo
 * d'occhio.
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
