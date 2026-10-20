/**
 * Ada üzerinde izometrik şehir (Ikariam tarzı): arsalara tıklanır, binalar seviyeyle büyür,
 * nüfus arttıkça kenar mahalleler dolar, yollarda araçlar ve insanlar dolaşır.
 */
import { memo, useMemo, type ReactNode } from 'react';
import { BUILDINGS, capacity, slotCount } from '../../shared/town';
import type { BuildingId, Town } from '../../shared/types';

const TW = 64;
const TH = 32;
const N = 14;

export const iso = (gx: number, gy: number): [number, number] => [(gx - gy) * (TW / 2), (gx + gy) * (TH / 2)];
const pt = (p: [number, number]) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`;

/** Arsaların ızgaradaki sol üst köşeleri (2x2 karo); merkeze yakın olan önce açılır. */
export const PLOTS: [number, number][] = [
  [4, 4],
  [8, 4],
  [4, 8],
  [8, 8],
  [2, 4],
  [4, 2],
  [10, 4],
  [8, 2],
  [2, 8],
  [4, 10],
  [10, 8],
  [8, 10],
  [2, 2],
  [10, 10],
];

function seeded(seed: number) {
  let h = seed >>> 0 || 1;
  return () => {
    h ^= h << 13;
    h ^= h >>> 17;
    h ^= h << 5;
    return ((h >>> 0) % 100000) / 100000;
  };
}

function shade(hex: string, k: number) {
  const n = parseInt(hex.slice(1), 16);
  const f = (v: number) => Math.max(0, Math.min(255, Math.round(k < 0 ? v * (1 + k) : v + (255 - v) * k)));
  const r = f(n >> 16);
  const g = f((n >> 8) & 255);
  const b = f(n & 255);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

// ---------------------------------------------------------------- temel şekiller

interface BoxProps {
  cx: number;
  cy: number;
  hx: number;
  hy: number;
  h: number;
  z?: number;
  color: string;
  roof?: string;
  windows?: number;
  night?: boolean;
  glass?: boolean;
  children?: ReactNode;
}

/** İzometrik kutu: sol ve sağ yüzler gölgeli, isteğe bağlı kat pencereleri. */
function Box({ cx, cy, hx, hy, h, z = 0, color, roof, windows = 0, night, glass }: BoxProps) {
  const top = iso(cx - hx, cy - hy);
  const right = iso(cx + hx, cy - hy);
  const bottom = iso(cx + hx, cy + hy);
  const left = iso(cx - hx, cy + hy);
  const up = (p: [number, number], k: number): [number, number] => [p[0], p[1] - k];
  const lift = (p: [number, number]) => up(p, z);
  const T = lift(top);
  const R = lift(right);
  const B = lift(bottom);
  const L = lift(left);
  const lines: ReactNode[] = [];
  if (windows > 0) {
    const floors = Math.max(1, Math.floor(h / windows));
    const win = night ? '#ffd76a' : glass ? '#bfe3ff' : '#4b5b70';
    for (let f = 0; f < floors; f++) {
      const y = 4 + f * windows + windows * 0.35;
      if (y > h - 3) break;
      const a1 = up(L, y);
      const a2 = up(B, y);
      const b1 = up(B, y);
      const b2 = up(R, y);
      const lit = !night || (f * 7 + Math.round(cx * 3 + cy * 5)) % 3 !== 0;
      lines.push(
        <line key={`l${f}`} x1={a1[0] + 2} y1={a1[1] - 1} x2={a2[0] - 2} y2={a2[1] - 1} stroke={lit ? win : '#2a3242'} strokeWidth={windows * 0.42} strokeDasharray="2.6 2.2" opacity={0.85} />,
        <line key={`r${f}`} x1={b1[0] + 2} y1={b1[1] - 1} x2={b2[0] - 2} y2={b2[1] - 1} stroke={lit ? win : '#2a3242'} strokeWidth={windows * 0.42} strokeDasharray="2.6 2.2" opacity={0.75} />,
      );
    }
  }
  return (
    <g>
      <polygon points={[L, B, up(B, h), up(L, h)].map(pt).join(' ')} fill={shade(color, -0.12)} />
      <polygon points={[B, R, up(R, h), up(B, h)].map(pt).join(' ')} fill={shade(color, -0.3)} />
      {lines}
      <polygon points={[up(T, h), up(R, h), up(B, h), up(L, h)].map(pt).join(' ')} fill={roof ?? shade(color, 0.12)} />
    </g>
  );
}

/** Beşik çatılı küçük ev */
function House({ cx, cy, s = 0.3, color, roof, z = 0, night }: { cx: number; cy: number; s?: number; color: string; roof: string; z?: number; night?: boolean }) {
  const h = 9 + s * 10;
  const ridge = h + 8 * s * 2.2;
  const L = iso(cx - s, cy + s);
  const B = iso(cx + s, cy + s);
  const R = iso(cx + s, cy - s);
  const T = iso(cx - s, cy - s);
  const mL = iso(cx - s, cy);
  const mR = iso(cx + s, cy);
  const up = (p: [number, number], k: number): [number, number] => [p[0], p[1] - k - z];
  return (
    <g>
      <Box cx={cx} cy={cy} hx={s} hy={s} h={h} z={z} color={color} />
      <polygon points={[up(L, h), up(B, h), up(mR, ridge), up(mL, ridge)].map(pt).join(' ')} fill={roof} />
      <polygon points={[up(B, h), up(R, h), up(mR, ridge)].map(pt).join(' ')} fill={shade(roof, -0.3)} />
      <polygon points={[up(T, h), up(mL, ridge), up(mR, ridge), up(R, h)].map(pt).join(' ')} fill={shade(roof, -0.15)} opacity={0.6} />
      {night && <circle cx={iso(cx, cy + s)[0] - 3} cy={iso(cx, cy + s)[1] - z - h * 0.45} r={1.6} fill="#ffd76a" />}
    </g>
  );
}

function Tree({ gx, gy, s = 1, tone = 0 }: { gx: number; gy: number; s?: number; tone?: number }) {
  const [x, y] = iso(gx, gy);
  const greens = ['#3f8f46', '#4c9a3f', '#2f7a44'];
  return (
    <g className="tree">
      <ellipse cx={x} cy={y} rx={5 * s} ry={2.4 * s} fill="rgba(0,0,0,.18)" />
      <rect x={x - 1} y={y - 7 * s} width={2} height={7 * s} fill="#6b4a2b" />
      <circle cx={x} cy={y - 10 * s} r={6 * s} fill={greens[tone % 3]} />
      <circle cx={x - 2 * s} cy={y - 12 * s} r={3.2 * s} fill={shade(greens[tone % 3], 0.2)} />
    </g>
  );
}

function Flag({ x, y, h, color }: { x: number; y: number; h: number; color: string }) {
  return (
    <g>
      <line x1={x} y1={y} x2={x} y2={y - h} stroke="#555" strokeWidth={1.2} />
      <path className="flag-wave" d={`M${x} ${y - h} l12 3 l-12 4 z`} fill={color} />
    </g>
  );
}

function Smoke({ x, y }: { x: number; y: number }) {
  return (
    <g className="smoke">
      {[0, 1, 2].map((i) => (
        <circle key={i} cx={x} cy={y} r={4} style={{ animationDelay: `${i * 1.1}s` }} />
      ))}
    </g>
  );
}

// ---------------------------------------------------------------- binalar

interface SpriteProps {
  b: BuildingId;
  level: number;
  cx: number;
  cy: number;
  night: boolean;
  partyColor: string;
  partyShort: string;
}

/** Binanın seviyeye göre çizimi; (cx, cy) arsanın ızgaradaki merkezi. */
export function BuildingSprite({ b, level: L, cx, cy, night, partyColor, partyShort }: SpriteProps) {
  const base = iso(cx, cy);
  switch (b) {
    case 'belediye': {
      const h = 20 + L * 2.6;
      const wing = L >= 6;
      const tower = L >= 3;
      return (
        <g>
          <Pad cx={cx} cy={cy} color="#d8cfbd" />
          {wing && <Box cx={cx - 0.45} cy={cy + 0.35} hx={0.35} hy={0.3} h={h * 0.7} color="#e9dfcb" windows={7} night={night} />}
          {wing && <Box cx={cx + 0.35} cy={cy - 0.45} hx={0.3} hy={0.35} h={h * 0.7} color="#e9dfcb" windows={7} night={night} />}
          <Box cx={cx} cy={cy} hx={0.62} hy={0.5} h={h} color="#efe4cc" roof="#c8b894" windows={8} night={night} />
          {/* sütunlar */}
          {[0.2, 0.4, 0.6, 0.8].map((k) => {
            const p = iso(cx - 0.62 + k * 1.24, cy + 0.5);
            return <line key={k} x1={p[0]} y1={p[1]} x2={p[0]} y2={p[1] - h * 0.7} stroke="#fffaf0" strokeWidth={2} opacity={0.8} />;
          })}
          {tower && <Box cx={cx} cy={cy} hx={0.18} hy={0.18} h={18 + L * 1.5} z={h} color="#e3d6ba" />}
          {tower && (
            <>
              <circle cx={base[0]} cy={base[1] - h - 12 - L * 0.7} r={4} fill={night ? '#ffe9a6' : '#fff'} stroke="#7b6a45" strokeWidth={1} />
              <ellipse cx={base[0]} cy={base[1] - h - 18 - L * 1.5} rx={9} ry={6} fill={L >= 8 ? '#c9a227' : '#7b8c9c'} />
            </>
          )}
          <Flag x={base[0] + (tower ? 0 : 8)} y={base[1] - h - (tower ? 24 + L * 1.5 : 0)} h={14} color={partyColor} />
        </g>
      );
    }
    case 'konut': {
      if (L <= 3) {
        const spots: [number, number][] = [
          [-0.42, -0.42],
          [0.42, -0.42],
          [-0.42, 0.42],
          [0.42, 0.42],
        ];
        const roofs = ['#b5462f', '#a33b2a', '#c0563a', '#8f3a2a'];
        const walls = ['#f1e3c6', '#e9d4b0', '#f4ead6', '#e2cfa9'];
        return (
          <g>
            <Pad cx={cx} cy={cy} color="#cfdcae" />
            {spots.slice(0, L + 1).map(([dx, dy], i) => (
              <House key={i} cx={cx + dx} cy={cy + dy} s={0.3} color={walls[i]} roof={roofs[i]} night={night} />
            ))}
          </g>
        );
      }
      if (L <= 8) {
        const h = 22 + (L - 3) * 7;
        return (
          <g>
            <Pad cx={cx} cy={cy} color="#d4cfc2" />
            <Box cx={cx - 0.4} cy={cy - 0.35} hx={0.38} hy={0.3} h={h * 0.85} color="#dcc9a6" windows={6} night={night} />
            <Box cx={cx + 0.35} cy={cy + 0.4} hx={0.3} hy={0.38} h={h} color="#e6d8bd" windows={6} night={night} />
            {L >= 6 && <Box cx={cx - 0.35} cy={cy + 0.45} hx={0.28} hy={0.25} h={h * 0.7} color="#cdb894" windows={6} night={night} />}
          </g>
        );
      }
      const h = 60 + (L - 8) * 10;
      return (
        <g>
          <Pad cx={cx} cy={cy} color="#c9ced6" />
          <Box cx={cx - 0.4} cy={cy - 0.4} hx={0.3} hy={0.3} h={h * 0.8} color="#7fa3c6" glass windows={5} night={night} />
          <Box cx={cx + 0.4} cy={cy + 0.4} hx={0.3} hy={0.3} h={h} color="#9bb8d3" glass windows={5} night={night} />
          <Box cx={cx - 0.4} cy={cy + 0.45} hx={0.26} hy={0.26} h={h * 0.6} color="#d9d2c3" windows={6} night={night} />
        </g>
      );
    }
    case 'carsi': {
      if (L <= 5) {
        const awn = ['#d64545', '#2f9e44', '#1c7ed6', '#f08c00', '#ae3ec9', '#0ca678'];
        const spots: [number, number][] = [
          [-0.5, -0.45],
          [0.1, -0.5],
          [-0.5, 0.15],
          [0.5, 0.05],
          [-0.05, 0.5],
          [0.55, 0.55],
        ];
        return (
          <g>
            <Pad cx={cx} cy={cy} color="#e3d2b3" />
            {spots.slice(0, Math.min(6, L + 1)).map(([dx, dy], i) => (
              <g key={i}>
                <Box cx={cx + dx} cy={cy + dy} hx={0.22} hy={0.22} h={9} color="#f3e6cc" />
                <Box cx={cx + dx} cy={cy + dy} hx={0.27} hy={0.27} h={2.5} z={9} color={awn[i]} roof={shade(awn[i], 0.25)} />
              </g>
            ))}
          </g>
        );
      }
      const h = 18 + (L - 5) * 4;
      return (
        <g>
          <Pad cx={cx} cy={cy} color="#c9c4bb" />
          <Box cx={cx} cy={cy} hx={0.72} hy={0.6} h={h} color="#8fb0c9" glass windows={9} night={night} roof="#b8c7d4" />
          <Box cx={cx} cy={cy} hx={0.3} hy={0.3} h={4} z={h} color="#e64980" />
          {(() => {
            const p = iso(cx - 0.72, cy + 0.6);
            const q = iso(cx + 0.72, cy + 0.6);
            return <line x1={p[0] + 6} y1={p[1] - h + 5} x2={(p[0] + q[0]) / 2} y2={(p[1] + q[1]) / 2 - h + 5} stroke={night ? '#ff8cc6' : '#e64980'} strokeWidth={3} />;
          })()}
        </g>
      );
    }
    case 'sanayi': {
      const halls = Math.min(3, 1 + Math.floor(L / 4));
      const chim = Math.min(4, 1 + Math.floor(L / 3));
      const h = 12 + L * 1.4;
      const out: ReactNode[] = [<Pad key="pad" cx={cx} cy={cy} color="#b9b3a7" />];
      for (let i = 0; i < halls; i++) {
        const dy = -0.5 + i * 0.5;
        out.push(<Box key={`h${i}`} cx={cx - 0.2} cy={cy + dy} hx={0.5} hy={0.22} h={h} color="#a7a9ad" roof="#7d8088" />);
        // testere dişi çatı
        const a = iso(cx - 0.7, cy + dy + 0.22);
        const b2 = iso(cx + 0.3, cy + dy + 0.22);
        const teeth = 4;
        let d = `M${a[0]} ${a[1] - h}`;
        for (let k = 0; k < teeth; k++) {
          const p = [a[0] + ((b2[0] - a[0]) * (k + 0.5)) / teeth, a[1] + ((b2[1] - a[1]) * (k + 0.5)) / teeth - h - 6];
          const q = [a[0] + ((b2[0] - a[0]) * (k + 1)) / teeth, a[1] + ((b2[1] - a[1]) * (k + 1)) / teeth - h];
          d += ` L${p[0]} ${p[1]} L${q[0]} ${q[1]}`;
        }
        out.push(<path key={`t${i}`} d={d} fill="none" stroke={night ? '#ffd76a' : '#5e6168'} strokeWidth={1.4} />);
      }
      for (let i = 0; i < chim; i++) {
        const gx = cx + 0.45 + (i % 2) * 0.22;
        const gy = cy - 0.55 + Math.floor(i / 2) * 0.5 + i * 0.12;
        const ch = 26 + L * 2.2;
        out.push(<Box key={`c${i}`} cx={gx} cy={gy} hx={0.07} hy={0.07} h={ch} color="#8a5a44" />);
        const p = iso(gx, gy);
        out.push(<Smoke key={`s${i}`} x={p[0]} y={p[1] - ch - 4} />);
      }
      return <g>{out}</g>;
    }
    case 'okul': {
      const h = 16 + L * 2;
      return (
        <g>
          <Pad cx={cx} cy={cy} color="#d7c9a4" />
          <Box cx={cx - 0.2} cy={cy - 0.1} hx={0.55} hy={0.38} h={h} color="#e8c27a" roof="#b5462f" windows={7} night={night} />
          {L >= 5 && <Box cx={cx + 0.45} cy={cy + 0.45} hx={0.25} hy={0.3} h={h * 0.8} color="#e8c27a" roof="#b5462f" windows={7} night={night} />}
          {(() => {
            const p = iso(cx + 0.5, cy - 0.55);
            return <Flag x={p[0]} y={p[1]} h={22} color="#e03131" />;
          })()}
          <ellipse cx={iso(cx - 0.3, cy + 0.6)[0]} cy={iso(cx - 0.3, cy + 0.6)[1]} rx={10} ry={4} fill="#b2d68c" />
        </g>
      );
    }
    case 'saglik': {
      const h = 14 + L * 3.2;
      const p = iso(cx, cy + 0.45);
      return (
        <g>
          <Pad cx={cx} cy={cy} color="#d9dde2" />
          <Box cx={cx} cy={cy} hx={0.6} hy={0.45} h={h} color="#f4f6f8" roof="#dfe6ec" windows={6} night={night} />
          <g transform={`translate(${p[0] - 18} ${p[1] - h * 0.75})`}>
            <rect x={-4} y={-1.5} width={8} height={3} fill="#e03131" />
            <rect x={-1.5} y={-4} width={3} height={8} fill="#e03131" />
          </g>
          {L >= 5 && (
            <ellipse cx={iso(cx, cy)[0]} cy={iso(cx, cy)[1] - h} rx={9} ry={4.5} fill="none" stroke="#fff" strokeWidth={1.5} />
          )}
        </g>
      );
    }
    case 'park': {
      const r = seeded(cx * 31 + cy * 7);
      const spots: { gx: number; gy: number; s: number }[] = [];
      const n = 3 + L;
      for (let i = 0; i < n; i++) {
        const a = r() * Math.PI * 2;
        const d = 0.35 + r() * 0.5;
        spots.push({ gx: cx + Math.cos(a) * d, gy: cy + Math.sin(a) * d, s: 0.75 + r() * 0.35 });
      }
      spots.sort((a, b) => a.gx + a.gy - (b.gx + b.gy));
      const trees = spots.map((p, i) => <Tree key={i} gx={p.gx} gy={p.gy} s={p.s} tone={i} />);
      return (
        <g>
          <Pad cx={cx} cy={cy} color="#8fc46b" />
          <polygon points={[iso(cx - 0.9, cy), iso(cx, cy - 0.15), iso(cx + 0.9, cy), iso(cx, cy + 0.15)].map(pt).join(' ')} fill="#e6d8b4" opacity={0.8} />
          {L >= 6 && <ellipse cx={base[0] + 14} cy={base[1] + 6} rx={14} ry={6} fill="#5aa9e6" />}
          {L >= 3 && (
            <g>
              <ellipse cx={base[0]} cy={base[1]} rx={8} ry={4} fill="#9fd3f5" stroke="#ccc" />
              <line className="fountain" x1={base[0]} y1={base[1]} x2={base[0]} y2={base[1] - 9} stroke="#cdeefe" strokeWidth={2} />
            </g>
          )}
          {trees}
        </g>
      );
    }
    case 'meydan': {
      const h = 14 + L * 3;
      return (
        <g>
          <Pad cx={cx} cy={cy} color="#e0d6c3" />
          <polygon points={[iso(cx - 0.6, cy - 0.6), iso(cx + 0.6, cy - 0.6), iso(cx + 0.6, cy + 0.6), iso(cx - 0.6, cy + 0.6)].map(pt).join(' ')} fill="none" stroke="#c4b79c" strokeDasharray="3 3" />
          <Box cx={cx} cy={cy} hx={0.18} hy={0.18} h={4} color="#b8ad98" />
          <Box cx={cx} cy={cy} hx={0.06} hy={0.06} h={h} z={4} color="#d9d0bd" />
          {L >= 4 && <Box cx={cx + 0.45} cy={cy - 0.45} hx={0.35} hy={0.18} h={5} color="#8b5e3c" roof={partyColor} />}
          {[-0.75, 0.75].map((d) => {
            const p = iso(cx + d, cy + 0.75);
            return <Flag key={d} x={p[0]} y={p[1]} h={16} color={partyColor} />;
          })}
          <g className="crowd">
            {Array.from({ length: Math.min(14, 3 + L * 1.4) }, (_, i) => {
              const q = iso(cx - 0.4 + (i % 5) * 0.2, cy + 0.15 + Math.floor(i / 5) * 0.2);
              return <circle key={i} cx={q[0]} cy={q[1] - 2} r={1.6} fill={['#334', '#a33', '#246', '#663'][i % 4]} />;
            })}
          </g>
        </g>
      );
    }
    case 'basin': {
      const h = 16 + L * 3;
      const mast = 30 + L * 4;
      const p = iso(cx + 0.35, cy - 0.35);
      return (
        <g>
          <Pad cx={cx} cy={cy} color="#cfd4da" />
          <Box cx={cx - 0.15} cy={cy + 0.15} hx={0.5} hy={0.42} h={h} color="#8ea3b8" windows={7} night={night} glass />
          <line x1={p[0]} y1={p[1]} x2={p[0]} y2={p[1] - mast} stroke="#c92a2a" strokeWidth={2} strokeDasharray="4 3" />
          <line x1={p[0] - 5} y1={p[1]} x2={p[0]} y2={p[1] - mast} stroke="#aaa" strokeWidth={0.8} />
          <line x1={p[0] + 5} y1={p[1]} x2={p[0]} y2={p[1] - mast} stroke="#aaa" strokeWidth={0.8} />
          <circle className="blink" cx={p[0]} cy={p[1] - mast} r={2} fill="#ff4d4d" />
          <ellipse cx={iso(cx - 0.15, cy + 0.15)[0] - 8} cy={iso(cx - 0.15, cy + 0.15)[1] - h - 5} rx={6} ry={4} fill="#eef" stroke="#889" transform={`rotate(-25 ${iso(cx - 0.15, cy + 0.15)[0] - 8} ${iso(cx - 0.15, cy + 0.15)[1] - h - 5})`} />
        </g>
      );
    }
    case 'parti': {
      const h = 16 + L * 2.6;
      const f = iso(cx, cy + 0.42);
      return (
        <g>
          <Pad cx={cx} cy={cy} color="#d9cfc0" />
          <Box cx={cx} cy={cy} hx={0.55} hy={0.42} h={h} color="#f1ece2" windows={7} night={night} />
          <g transform={`translate(${f[0] - 20} ${f[1] - h + 6}) skewY(26.5)`}>
            <rect width={22} height={Math.min(h - 8, 10 + L)} fill={partyColor} />
            <text x={11} y={8} textAnchor="middle" fontSize={6} fontWeight={700} fill="#fff">
              {partyShort.slice(0, 4)}
            </text>
          </g>
          <Flag x={iso(cx, cy)[0]} y={iso(cx, cy)[1] - h} h={16} color={partyColor} />
        </g>
      );
    }
    case 'emniyet': {
      const h = 16 + L * 2.4;
      const p = iso(cx, cy);
      return (
        <g>
          <Pad cx={cx} cy={cy} color="#cbd2db" />
          <Box cx={cx - 0.1} cy={cy - 0.1} hx={0.55} hy={0.45} h={h} color="#5b7aa6" windows={7} night={night} />
          <rect className="siren" x={p[0] - 5} y={p[1] - h - 9} width={10} height={3} rx={1} />
          <Box cx={cx + 0.55} cy={cy + 0.6} hx={0.15} hy={0.09} h={4} color="#f8f9fa" roof="#1c4e89" />
        </g>
      );
    }
  }
}

function Pad({ cx, cy, color }: { cx: number; cy: number; color: string }) {
  const pts = [iso(cx - 0.95, cy - 0.95), iso(cx + 0.95, cy - 0.95), iso(cx + 0.95, cy + 0.95), iso(cx - 0.95, cy + 0.95)];
  return <polygon points={pts.map(pt).join(' ')} fill={color} opacity={0.9} />;
}

function Scaffold({ cx, cy, level }: { cx: number; cy: number; level: number }) {
  const h = 18 + level * 3;
  const corners = [iso(cx - 0.6, cy + 0.6), iso(cx + 0.6, cy + 0.6), iso(cx + 0.6, cy - 0.6)];
  const mast = iso(cx - 0.55, cy - 0.55);
  const H = h + 26;
  return (
    <g className="scaffold">
      {corners.map((p, i) => (
        <line key={i} x1={p[0]} y1={p[1]} x2={p[0]} y2={p[1] - h} stroke="#c47f17" strokeWidth={1.4} />
      ))}
      {[0.3, 0.6, 0.9].map((k) => (
        <polyline key={k} points={corners.map((p) => `${p[0]},${p[1] - h * k}`).join(' ')} fill="none" stroke="#c47f17" strokeWidth={1} />
      ))}
      <line x1={mast[0]} y1={mast[1]} x2={mast[0]} y2={mast[1] - H} stroke="#f2b705" strokeWidth={2.2} />
      <g className="crane-jib" style={{ transformOrigin: `${mast[0]}px ${mast[1] - H}px` }}>
        <line x1={mast[0] - 14} y1={mast[1] - H} x2={mast[0] + 34} y2={mast[1] - H} stroke="#f2b705" strokeWidth={2} />
        <line x1={mast[0] + 26} y1={mast[1] - H} x2={mast[0] + 26} y2={mast[1] - H + 16} stroke="#666" strokeWidth={0.8} />
        <rect x={mast[0] + 23} y={mast[1] - H + 16} width={6} height={4} fill="#8a5a44" />
      </g>
    </g>
  );
}

// ---------------------------------------------------------------- sahne

export interface TownViewProps {
  t: Town;
  day: number;
  night: boolean;
  partyColor: string;
  partyShort: string;
  selected: number | null;
  onSelect: (slot: number) => void;
}

export const TownView = memo(function TownView({ t, day, night, partyColor, partyShort, selected, onSelect }: TownViewProps) {
  const bel = t.slots[0]?.level ?? 1;
  const open = slotCount(bel);
  const k = t.construction;

  // Kenar mahalleler: nüfus kapasiteye göre doldukça küçük evler belirir.
  const fill = useMemo(() => {
    const r = seeded(7919);
    const spots: [number, number][] = [];
    const plotCells = new Set<string>();
    PLOTS.forEach(([x, y]) => {
      for (const dx of [0, 1]) for (const dy of [0, 1]) plotCells.add(`${x + dx},${y + dy}`);
    });
    for (let x = 0; x < N; x++)
      for (let y = 0; y < N; y++) {
        if (x === 6 || x === 7 || y === 6 || y === 7) continue;
        if (plotCells.has(`${x},${y}`)) continue;
        spots.push([x + 0.5, y + 0.5]);
      }
    // Merkeze yakın olan önce dolar.
    return spots
      .map((s) => ({ s, d: Math.hypot(s[0] - 7, s[1] - 7) + r() * 2.2, tone: Math.floor(r() * 4), tree: r() }))
      .sort((a, b) => a.d - b.d);
  }, []);
  const houses = Math.round(Math.min(fill.length, Math.max(0, t.pop / 1300)));
  const cars = Math.min(10, 2 + Math.floor(t.pop / 6000));

  type Item = { depth: number; node: ReactNode };
  const items: Item[] = [];
  fill.forEach((f, i) => {
    const [gx, gy] = f.s;
    if (i < houses) {
      const walls = ['#f1e3c6', '#e9d4b0', '#f4ead6', '#dcd3c0'];
      const roofs = ['#b5462f', '#a33b2a', '#c0563a', '#7b6a5a'];
      const tall = t.pop > 40000 && i < houses * 0.4;
      items.push({
        depth: gx + gy,
        node: tall ? (
          <Box key={`f${i}`} cx={gx} cy={gy} hx={0.32} hy={0.32} h={22 + (i % 4) * 6} color={walls[f.tone]} windows={6} night={night} />
        ) : (
          <House key={`f${i}`} cx={gx} cy={gy} s={0.28} color={walls[f.tone]} roof={roofs[f.tone]} night={night} />
        ),
      });
    } else if (f.tree < 0.45) {
      items.push({ depth: gx + gy, node: <Tree key={`t${i}`} gx={gx} gy={gy} s={0.8 + f.tree * 0.6} tone={f.tone} /> });
    }
  });

  PLOTS.forEach(([px, py], i) => {
    const cx = px + 1;
    const cy = py + 1;
    const s = t.slots[i];
    const building = k?.slot === i ? s.building ?? k.building : s.building;
    const locked = i >= open;
    const under = k?.slot === i;
    const label = building ? `${BUILDINGS[building].label} · ${s.level || '—'}` : locked ? 'Kapalı arsa' : 'Boş arsa';
    const [lx, ly] = iso(cx, cy);
    const height = building ? 40 + (s.level || 1) * 5.5 : 8;
    items.push({
      depth: cx + cy + 0.9,
      node: (
        <g
          key={`p${i}`}
          className={`plot ${selected === i ? 'sel' : ''} ${locked ? 'locked' : ''} ${building ? 'built' : 'empty'}`}
          onClick={() => !locked && onSelect(i)}
          role="button"
          aria-label={label}
          tabIndex={locked ? -1 : 0}
          onKeyDown={(e) => {
            if (!locked && (e.key === 'Enter' || e.key === ' ')) onSelect(i);
          }}
        >
          <polygon className="plot-base" points={[iso(px, py), iso(px + 2, py), iso(px + 2, py + 2), iso(px, py + 2)].map(pt).join(' ')} />
          {building && s.level > 0 && (
            <g transform={`translate(${lx} ${ly}) scale(1.32) translate(${-lx} ${-ly})`}>
              <BuildingSprite b={building} level={s.level} cx={cx} cy={cy} night={night} partyColor={partyColor} partyShort={partyShort} />
            </g>
          )}
          {!building && !locked && !under && (
            <g className="plot-plus">
              <circle cx={lx} cy={ly} r={9} />
              <path d={`M${lx - 4} ${ly} h8 M${lx} ${ly - 4} v8`} />
            </g>
          )}
          {locked && (
            <text x={lx} y={ly + 4} textAnchor="middle" fontSize={11} opacity={0.5}>
              🔒
            </text>
          )}
          {under && <Scaffold cx={cx} cy={cy} level={k!.toLevel} />}
          {under && (
            <g className="build-timer">
              <rect x={lx - 22} y={ly - height - 26} width={44} height={6} rx={3} fill="rgba(0,0,0,.45)" />
              <rect x={lx - 22} y={ly - height - 26} width={44 * Math.min(1, (day - k!.startDay) / Math.max(1, k!.endDay - k!.startDay))} height={6} rx={3} fill="#f2b705" />
            </g>
          )}
          {building && s.level > 0 && (
            <g className="lvl" transform={`translate(${lx + 22} ${ly - 4})`}>
              <circle r={7.5} />
              <text y={3.2} textAnchor="middle">
                {s.level}
              </text>
            </g>
          )}
          <g className="plot-tag" transform={`translate(${lx} ${ly - height - 10})`}>
            <rect x={-label.length * 2.9 - 6} y={-10} width={label.length * 5.8 + 12} height={15} rx={7} />
            <text y={1} textAnchor="middle">
              {label}
            </text>
          </g>
        </g>
      ),
    });
  });
  items.sort((a, b) => a.depth - b.depth);

  // Ada kıyısı
  const pad = 1.2;
  const island = [iso(-pad, -pad), iso(N + pad, -pad), iso(N + pad, N + pad), iso(-pad, N + pad)];
  const ground = [iso(0, 0), iso(N, 0), iso(N, N), iso(0, N)];
  const road = (x0: number, y0: number, x1: number, y1: number) => [iso(x0, y0), iso(x1, y0), iso(x1, y1), iso(x0, y1)].map(pt).join(' ');
  const routes = [
    { a: iso(6.5, 0), b: iso(6.5, N) },
    { a: iso(N, 7.5), b: iso(0, 7.5) },
    { a: iso(7.5, N), b: iso(7.5, 0) },
    { a: iso(0, 6.5), b: iso(N, 6.5) },
  ];
  const ratio = t.pop / capacity(t);
  return (
    <svg className={`townview ${night ? 'night' : ''}`} viewBox="-440 -70 880 560" role="img" aria-label={`${t.name} şehri`}>
      <defs>
        <linearGradient id="tv-sea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={night ? '#0b1f3a' : '#7cc3e8'} />
          <stop offset="1" stopColor={night ? '#06132a' : '#3d8fc4'} />
        </linearGradient>
        <linearGradient id="tv-grass" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={night ? '#2c4a33' : '#9fd17a'} />
          <stop offset="1" stopColor={night ? '#22392a' : '#7fbb5d'} />
        </linearGradient>
      </defs>
      <rect x={-540} y={-200} width={1080} height={700} fill="url(#tv-sea)" />
      <g className="waves">
        {Array.from({ length: 14 }, (_, i) => (
          <path key={i} d={`M${-520 + ((i * 173) % 1000)} ${-170 + ((i * 97) % 640)} q8 -5 16 0 t16 0`} style={{ animationDelay: `${(i % 5) * 0.7}s` }} />
        ))}
      </g>
      <polygon points={island.map(pt).join(' ')} fill={night ? '#5b5440' : '#e9d9a6'} />
      <polygon points={[iso(-0.4, -0.4), iso(N + 0.4, -0.4), iso(N + 0.4, N + 0.4), iso(-0.4, N + 0.4)].map(pt).join(' ')} fill={night ? '#3d4a35' : '#cbd99a'} />
      <polygon points={ground.map(pt).join(' ')} fill="url(#tv-grass)" />
      {/* yollar */}
      <polygon points={road(6, 0, 8, N)} fill={night ? '#3a3f48' : '#8d8f94'} />
      <polygon points={road(0, 6, N, 8)} fill={night ? '#3a3f48' : '#8d8f94'} />
      <line x1={iso(7, 0)[0]} y1={iso(7, 0)[1]} x2={iso(7, N)[0]} y2={iso(7, N)[1]} stroke="#f1f3f5" strokeDasharray="6 6" strokeWidth={1} opacity={0.7} />
      <line x1={iso(0, 7)[0]} y1={iso(0, 7)[1]} x2={iso(N, 7)[0]} y2={iso(N, 7)[1]} stroke="#f1f3f5" strokeDasharray="6 6" strokeWidth={1} opacity={0.7} />
      {night &&
        [2, 4.5, 9.5, 12].map((v) => (
          <g key={v}>
            <circle cx={iso(6, v)[0]} cy={iso(6, v)[1] - 8} r={2} fill="#ffe08a" />
            <circle cx={iso(v, 8)[0]} cy={iso(v, 8)[1] - 8} r={2} fill="#ffe08a" />
          </g>
        ))}
      {/* trafik */}
      <g className="traffic">
        {Array.from({ length: cars }, (_, i) => {
          const r = routes[i % routes.length];
          return (
            <rect key={i} width={7} height={4} rx={1.5} x={-3.5} y={-2} fill={['#e03131', '#f8f9fa', '#1971c2', '#f2b705', '#2f9e44'][i % 5]} stroke="rgba(0,0,0,.3)" strokeWidth={0.5}>
              <animateMotion dur={`${9 + (i % 4) * 2}s`} begin={`${-i * 2.3}s`} repeatCount="indefinite" path={`M${r.a[0]} ${r.a[1]} L${r.b[0]} ${r.b[1]}`} />
            </rect>
          );
        })}
      </g>
      {items.map((x) => x.node)}
      {ratio > 0.97 && (
        <text x={0} y={470} textAnchor="middle" className="tv-warn">
          Konutlar doldu, şehir büyüyemiyor
        </text>
      )}
    </svg>
  );
});
