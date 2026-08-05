import { useId, useState } from 'react';
import type { AbaSeries, PhaseChange } from '@/export/abaData';
import { colorForLevel } from '@/export/seriesColors';
import c from './AbaChart.module.scss';

const W = 760;
const H = 340;
const M = { top: 16, right: 18, bottom: 46, left: 52 };
const PLOT_W = W - M.left - M.right;
const PLOT_H = H - M.top - M.bottom;

const Y_TICKS = [0, 25, 50, 75, 100];

interface AbaChartProps {
  series: AbaSeries[];
  phaseChanges: PhaseChange[];
  criterion: number;
  foodLabel?: string;
}

const AbaChart = ({ series, phaseChanges, criterion, foodLabel }: AbaChartProps) => {
  const titleId = useId();
  const [hover, setHover] = useState<{
    x: number;
    y: number;
    label: string;
    value: number;
    ordinal: number;
  } | null>(null);

  const ordinals = [
    ...new Set(series.flatMap((s) => s.points.map((p) => p.ordinal))),
  ].sort((a, b) => a - b);

  if (ordinals.length === 0) {
    return <p className={c.empty}>Nessun dato da rappresentare.</p>;
  }

  const step = ordinals.length > 1 ? PLOT_W / (ordinals.length - 1) : 0;
  const x = (ordinal: number) =>
    M.left + (ordinals.length > 1 ? ordinals.indexOf(ordinal) * step : PLOT_W / 2);
  const y = (value: number) => M.top + PLOT_H - (Math.max(0, Math.min(100, value)) / 100) * PLOT_H;

  const labelEvery = Math.ceil(ordinals.length / 12);

  return (
    <figure className={c.figure}>
      <svg
        className={c.svg}
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-labelledby={titleId}
        onPointerLeave={() => setHover(null)}
      >
        <title id={titleId}>
          Percentuale di contatto per sessione{foodLabel ? ` con ${foodLabel}` : ''}, una linea per
          livello, con linea di criterio al {criterion}%
        </title>

        {Y_TICKS.map((t) => (
          <g key={t}>
            <line className={c.grid} x1={M.left} x2={W - M.right} y1={y(t)} y2={y(t)} />
            <text className={c.tickLabel} x={M.left - 10} y={y(t)} textAnchor="end" dy="0.32em">
              {t}%
            </text>
          </g>
        ))}

        {phaseChanges.map((change) => {
          const i = ordinals.indexOf(change.atOrdinal);
          if (i <= 0) return null;
          const px = x(change.atOrdinal) - step / 2;
          return (
            <g key={`${change.atOrdinal}-${change.condition}`}>
              <line className={c.phaseLine} x1={px} x2={px} y1={M.top} y2={M.top + PLOT_H} />
              <text className={c.phaseLabel} x={px + 5} y={M.top + 12}>
                {change.condition}
              </text>
            </g>
          );
        })}

        <line
          className={c.criterionLine}
          x1={M.left}
          x2={W - M.right}
          y1={y(criterion)}
          y2={y(criterion)}
        />
        <text className={c.criterionLabel} x={M.left + 4} y={y(criterion) - 6} textAnchor="start">
          criterio {criterion}%
        </text>

        <line
          className={c.axis}
          x1={M.left}
          x2={W - M.right}
          y1={M.top + PLOT_H}
          y2={M.top + PLOT_H}
        />
        {ordinals.map((n, i) =>
          i % labelEvery === 0 ? (
            <text
              key={n}
              className={c.tickLabel}
              x={x(n)}
              y={M.top + PLOT_H + 20}
              textAnchor="middle"
            >
              {n}
            </text>
          ) : null,
        )}
        <text className={c.axisTitle} x={M.left + PLOT_W / 2} y={H - 8} textAnchor="middle">
          Sessione
        </text>

        {series.map((s) => {
          const color = colorForLevel(s.levelId);
          const points = [...s.points].sort((a, b) => a.ordinal - b.ordinal);
          return (
            <g key={s.levelId}>
              <polyline
                className={c.line}
                stroke={color}
                points={points.map((p) => `${x(p.ordinal)},${y(p.value)}`).join(' ')}
              />
              {points.map((p) => (
                <g key={p.ordinal}>
                  <circle
                    className={c.marker}
                    cx={x(p.ordinal)}
                    cy={y(p.value)}
                    r={5}
                    fill={color}
                  />
                  <circle
                    className={c.hit}
                    cx={x(p.ordinal)}
                    cy={y(p.value)}
                    r={14}
                    onPointerEnter={() =>
                      setHover({
                        x: x(p.ordinal),
                        y: y(p.value),
                        label: s.levelName,
                        value: p.value,
                        ordinal: p.ordinal,
                      })
                    }
                  >
                    <title>{`${s.levelName} · sessione ${p.ordinal}: ${p.value.toFixed(1)}%`}</title>
                  </circle>
                </g>
              ))}
            </g>
          );
        })}

        {hover && (
          <g className={c.tooltip} pointerEvents="none">
            <rect
              x={Math.min(hover.x + 10, W - M.right - 170)}
              y={Math.max(hover.y - 42, M.top)}
              width={170}
              height={38}
              rx={6}
            />
            <text x={Math.min(hover.x + 20, W - M.right - 160)} y={Math.max(hover.y - 26, M.top + 16)}>
              {hover.label}
            </text>
            <text
              className={c.tooltipValue}
              x={Math.min(hover.x + 20, W - M.right - 160)}
              y={Math.max(hover.y - 12, M.top + 30)}
            >
              sessione {hover.ordinal} · {hover.value.toFixed(1)}%
            </text>
          </g>
        )}
      </svg>

      <figcaption className={c.legend}>
        {series.map((s) => (
          <span key={s.levelId} className={c.legendItem}>
            <span className={c.legendSwatch} style={{ background: colorForLevel(s.levelId) }} />
            Livello {s.levelId} · {s.levelName}
          </span>
        ))}
      </figcaption>
    </figure>
  );
};

export default AbaChart;
