import type { ReactNode } from 'react';
import type { Ideology, Party } from '../../shared/types';

/** Yarım daire gösterge (0-100). */
export function Gauge({ value, label, tone, sub }: { value: number; label: string; tone?: 'good' | 'mid' | 'bad'; sub?: ReactNode }) {
  const v = Math.max(0, Math.min(100, value));
  const t = tone ?? (v >= 50 ? 'good' : v >= 35 ? 'mid' : 'bad');
  const a = Math.PI * (1 - v / 100);
  const x = 50 + Math.cos(a) * 40;
  const y = 50 - Math.sin(a) * 40;
  return (
    <div className="gauge">
      <svg viewBox="0 0 100 58">
        <path d="M10 50 A40 40 0 0 1 90 50" className="gauge-track" />
        <path d={`M10 50 A40 40 0 0 1 ${x.toFixed(2)} ${y.toFixed(2)}`} className={`gauge-fill ${t}`} />
        <text x="50" y="47" textAnchor="middle" className="gauge-num">
          {v.toFixed(0)}
        </text>
      </svg>
      <div className="gauge-label">{label}</div>
      {sub && <div className="gauge-sub">{sub}</div>}
    </div>
  );
}

/** Parti amblemi: renkli rozet ve kısa ad. */
export function PartyBadge({ p, size = 40 }: { p: Pick<Party, 'color' | 'short'>; size?: number }) {
  const text = p.short.length > 5 ? p.short.slice(0, 4) : p.short;
  return (
    <span className="party-badge" style={{ width: size, height: size, background: p.color, fontSize: size / (text.length > 3 ? 3.6 : 2.8) }}>
      {text}
    </span>
  );
}

export function Meter({ value, max = 100, color, label }: { value: number; max?: number; color?: string; label?: ReactNode }) {
  return (
    <div className="meter" title={typeof label === 'string' ? label : undefined}>
      <div className="meter-fill" style={{ width: `${Math.max(0, Math.min(100, (value / max) * 100))}%`, background: color }} />
    </div>
  );
}

/** İdeoloji pusulası: tıklanabilir ya da sadece gösterim. */
export function Compass({
  value,
  onChange,
  dots = [],
  size = 220,
}: {
  value?: Ideology;
  onChange?: (v: Ideology) => void;
  dots?: { ideology: Ideology; color: string; label: string }[];
  size?: number;
}) {
  const toPx = (v: Ideology) => ({ x: 50 + v.economic * 45, y: 50 - v.social * 45 });
  const handle = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!onChange || (e.type === 'pointermove' && e.buttons !== 1)) return;
    const r = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * 100;
    const y = ((e.clientY - r.top) / r.height) * 100;
    const clamp = (n: number) => Math.round(Math.max(-1, Math.min(1, n)) * 20) / 20;
    onChange({ economic: clamp((x - 50) / 45), social: clamp((50 - y) / 45) });
  };
  const me = value ? toPx(value) : null;
  return (
    <div className="compass" style={{ maxWidth: size }}>
      <svg viewBox="0 0 100 100" onPointerDown={handle} onPointerMove={handle} className={onChange ? 'editable' : ''}>
        <rect x="5" y="5" width="45" height="45" className="q q1" />
        <rect x="50" y="5" width="45" height="45" className="q q2" />
        <rect x="5" y="50" width="45" height="45" className="q q3" />
        <rect x="50" y="50" width="45" height="45" className="q q4" />
        <line x1="50" y1="5" x2="50" y2="95" className="axis" />
        <line x1="5" y1="50" x2="95" y2="50" className="axis" />
        <text x="50" y="4" textAnchor="middle" className="ax-l" dominantBaseline="auto">Muhafazakâr</text>
        <text x="50" y="99.5" textAnchor="middle" className="ax-l">Özgürlükçü</text>
        <text x="6" y="48" className="ax-l">Sol</text>
        <text x="94" y="48" textAnchor="end" className="ax-l">Sağ</text>
        {dots.map((d, i) => {
          const p = toPx(d.ideology);
          return (
            <g key={i}>
              <circle cx={p.x} cy={p.y} r="3.2" fill={d.color} stroke="var(--surface)" strokeWidth="0.8" />
              <text x={p.x + 4} y={p.y + 1.5} className="dot-l">
                {d.label}
              </text>
            </g>
          );
        })}
        {me && (
          <g>
            <circle cx={me.x} cy={me.y} r="5" className="me-ring" />
            <circle cx={me.x} cy={me.y} r="2.4" className="me-dot" />
          </g>
        )}
      </svg>
    </div>
  );
}

export function ideologyLabel(v: Ideology): string {
  const e = v.economic < -0.5 ? 'Sol' : v.economic < -0.15 ? 'Merkez sol' : v.economic <= 0.15 ? 'Merkez' : v.economic <= 0.5 ? 'Merkez sağ' : 'Sağ';
  const s = v.social > 0.4 ? 'muhafazakâr' : v.social < -0.4 ? 'özgürlükçü' : 'ılımlı';
  return `${e}, ${s}`;
}

/** Anket eğilimi: partilerin aylık destek çizgileri. */
export function PollChart({ parties, height = 170 }: { parties: Party[]; height?: number }) {
  const W = 600;
  const pad = { l: 30, r: 54, t: 8, b: 14 };
  const shown = [...parties].sort((a, b) => b.support - a.support).slice(0, 7);
  const n = Math.max(2, ...shown.map((p) => p.trend.length));
  const max = Math.max(10, ...shown.flatMap((p) => p.trend)) * 1.1;
  const x = (i: number, len: number) => pad.l + ((i + (n - len)) / (n - 1)) * (W - pad.l - pad.r);
  const y = (v: number) => pad.t + (1 - v / max) * (height - pad.t - pad.b);
  if (n < 2 || shown.every((p) => p.trend.length < 2)) return <div className="chart-empty">Anket eğilimi ilk aydan sonra görünür.</div>;
  const ticks = [0, Math.round(max / 2), Math.round(max * 0.9)];
  // Etiketler üst üste binmesin: sıralayıp en az 12 birim aralık bırak.
  const labels = shown
    .map((p) => ({ id: p.id, short: p.short, color: p.color, y: y(p.trend[p.trend.length - 1] ?? 0) }))
    .sort((a, b) => a.y - b.y);
  for (let i = 1; i < labels.length; i++) labels[i].y = Math.max(labels[i].y, labels[i - 1].y + 12);
  return (
    <div className="chart poll">
      <svg viewBox={`0 0 ${W} ${height}`} role="img" aria-label="Anket eğilimi">
        {ticks.map((t) => (
          <g key={t}>
            <line x1={pad.l} x2={W - pad.r} y1={y(t)} y2={y(t)} className="grid" />
            <text x={pad.l - 4} y={y(t) + 4} textAnchor="end" className="tick">
              {t}
            </text>
          </g>
        ))}
        {shown.map((p) => {
          const pts = p.trend.map((v, i) => `${x(i, p.trend.length).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
          return <polyline key={p.id} points={pts} fill="none" stroke={p.color} strokeWidth={p.playerId ? 3 : 1.8} strokeLinejoin="round" />;
        })}
        {labels.map((l) => (
          <text key={l.id} x={W - pad.r + 4} y={l.y + 4} className="tick" style={{ fill: l.color }}>
            {l.short}
          </text>
        ))}
      </svg>
    </div>
  );
}

export function Stat({ label, value, tone, icon }: { label: string; value: ReactNode; tone?: 'good' | 'mid' | 'bad'; icon?: string }) {
  return (
    <div className={`stat ${tone ?? ''}`}>
      {icon && <span className="stat-icon">{icon}</span>}
      <div>
        <div className="stat-value">{value}</div>
        <div className="stat-label">{label}</div>
      </div>
    </div>
  );
}
