import { n1 } from './format';

interface Series {
  label: string;
  color: string;
  values: number[];
}

/** Bağımlılıksız, basit çizgi grafik. */
export function LineChart({ series, height = 160 }: { series: Series[]; height?: number }) {
  const width = 600;
  const pad = { l: 36, r: 8, t: 8, b: 18 };
  const all = series.flatMap((s) => s.values);
  if (all.length < 2) return <div className="chart-empty">Grafik için en az iki aylık veri gerekiyor.</div>;
  let min = Math.min(...all, 0);
  let max = Math.max(...all);
  if (max - min < 1) max = min + 1;
  const span = max - min;
  min -= span * 0.05;
  max += span * 0.05;
  const n = Math.max(...series.map((s) => s.values.length));
  const x = (i: number) => pad.l + (i / Math.max(1, n - 1)) * (width - pad.l - pad.r);
  const y = (v: number) => pad.t + (1 - (v - min) / (max - min)) * (height - pad.t - pad.b);
  const ticks = [min, (min + max) / 2, max];
  return (
    <div className="chart">
      <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" role="img">
        {ticks.map((t, i) => (
          <g key={i}>
            <line x1={pad.l} x2={width - pad.r} y1={y(t)} y2={y(t)} className="grid" />
            <text x={pad.l - 4} y={y(t) + 4} className="axis" textAnchor="end">
              {n1(t)}
            </text>
          </g>
        ))}
        {min < 0 && max > 0 && <line x1={pad.l} x2={width - pad.r} y1={y(0)} y2={y(0)} className="zero" />}
        {series.map((s) => (
          <polyline
            key={s.label}
            fill="none"
            stroke={s.color}
            strokeWidth={2}
            vectorEffect="non-scaling-stroke"
            points={s.values.map((v, i) => `${x(i)},${y(v)}`).join(' ')}
          />
        ))}
      </svg>
      <div className="legend">
        {series.map((s) => (
          <span key={s.label}>
            <i style={{ background: s.color }} /> {s.label}
          </span>
        ))}
      </div>
    </div>
  );
}

export function Bar({ value, max = 100, tone }: { value: number; max?: number; tone?: 'good' | 'mid' | 'bad' | 'auto' }) {
  const p = Math.max(0, Math.min(100, (value / max) * 100));
  const cls = tone === 'auto' ? (p >= 60 ? 'good' : p >= 40 ? 'mid' : 'bad') : (tone ?? 'mid');
  return (
    <div className="bar">
      <div className={`bar-fill ${cls}`} style={{ width: `${p}%` }} />
    </div>
  );
}
