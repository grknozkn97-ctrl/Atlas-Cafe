import { useMemo } from 'react';
import { housingRatio } from '../../shared/local';
import type { Province } from '../../shared/types';

const W = 400;
const H = 150;
const GROUND = 126;

function seeded(seed: string) {
  let h = 2166136261;
  for (const ch of seed) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

interface Building {
  x: number;
  w: number;
  h: number;
  tower: boolean;
  shade: number;
}

/**
 * Şehrin silueti: nüfus ne kadar büyükse binalar o kadar yüksek, kentleşme arttıkça kule sayısı artar.
 * Konut açığı varsa çeperde gecekondular, süren projelerde vinçler görünür.
 */
export function Skyline({ pv }: { pv: Province }) {
  const scene = useMemo(() => {
    const rnd = seeded(pv.id);
    const t = Math.min(1, Math.max(0, (Math.log10(pv.pop * 1e6) - 4.6) / 2.6));
    const maxH = 16 + 92 * t;
    const towerShare = Math.max(0.05, (pv.urban - 40) / 60) * (0.35 + 0.65 * t);
    const count = Math.round(12 + pv.urban / 4 + t * 10);
    const buildings: Building[] = [];
    let x = 4;
    for (let i = 0; i < count && x < W - 8; i++) {
      const center = 1 - Math.abs(x / W - 0.55) * 1.6;
      const tower = rnd() < towerShare * (0.6 + Math.max(0, center));
      const w = tower ? 10 + rnd() * 14 : 12 + rnd() * 12;
      const h = tower ? maxH * (0.45 + 0.55 * Math.pow(rnd(), 1.3)) * (0.6 + 0.5 * Math.max(0, center)) : 10 + rnd() * 12;
      buildings.push({ x, w, h: Math.max(8, h), tower, shade: rnd() });
      x += w + (rnd() < 0.25 ? 3 : 1);
    }
    // Arka plan katmanı (daha soluk, daha yüksek)
    const back: Building[] = [];
    if (t > 0.35) {
      let bx = 0;
      while (bx < W) {
        const w = 14 + rnd() * 18;
        back.push({ x: bx, w, h: maxH * (0.4 + rnd() * 0.5), tower: true, shade: rnd() });
        bx += w + 2;
      }
    }
    const ratio = housingRatio(pv);
    const shacks = ratio < 1 ? Math.round((1 - ratio) * 60) : 0;
    const shackList = Array.from({ length: Math.min(14, shacks) }, (_, i) => ({ x: (i % 2 ? W - 8 - (i >> 1) * 12 : 4 + (i >> 1) * 12), w: 9 + rnd() * 3, h: 6 + rnd() * 4 }));
    const trees = Array.from({ length: Math.min(10, 2 + pv.built.park * 3) }, () => ({ x: 6 + rnd() * (W - 12), s: 0.8 + rnd() * 0.5 }));
    return { buildings, back, shackList, trees };
  }, [pv.id, Math.round(pv.pop * 20), Math.round(pv.urban), pv.built.park, Math.round(housingRatio(pv) * 20)]);

  const building = pv.projects.length > 0;
  return (
    <svg className="skyline" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMax slice" role="img" aria-label={`${pv.name} silueti`}>
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" className="sky-a" />
          <stop offset="100%" className="sky-b" />
        </linearGradient>
      </defs>
      <rect width={W} height={H} fill="url(#sky)" />
      <circle cx={W - 40} cy={28} r={12} className="sk-sun" />
      {scene.back.map((b, i) => (
        <rect key={`b${i}`} x={b.x} y={GROUND - b.h} width={b.w} height={b.h} className="sk-back" />
      ))}
      {pv.built.sanayi > 0 && (
        <g className="sk-factory">
          <rect x={W - 70} y={GROUND - 22} width={44} height={22} />
          <rect x={W - 62} y={GROUND - 44} width={6} height={24} />
          <rect x={W - 48} y={GROUND - 38} width={6} height={18} />
          <circle cx={W - 57} cy={GROUND - 50} r={5} className="sk-smoke" />
          <circle cx={W - 52} cy={GROUND - 58} r={6} className="sk-smoke" />
        </g>
      )}
      {scene.buildings.map((b, i) => (
        <g key={i}>
          {b.tower ? (
            <>
              <rect x={b.x} y={GROUND - b.h} width={b.w} height={b.h} className={`sk-tower s${Math.floor(b.shade * 3)}`} />
              {Array.from({ length: Math.floor((b.h - 6) / 7) }, (_, r) =>
                Array.from({ length: Math.max(1, Math.floor((b.w - 3) / 5)) }, (_, cIdx) => (
                  <rect
                    key={`${r}-${cIdx}`}
                    x={b.x + 2 + cIdx * 5}
                    y={GROUND - b.h + 4 + r * 7}
                    width={2.4}
                    height={3}
                    className={(r * 7 + cIdx * 3 + i) % 5 === 0 ? 'sk-win off' : 'sk-win'}
                  />
                )),
              )}
            </>
          ) : (
            <>
              <rect x={b.x} y={GROUND - b.h} width={b.w} height={b.h} className={`sk-house s${Math.floor(b.shade * 3)}`} />
              <path d={`M${b.x - 1} ${GROUND - b.h} L${b.x + b.w / 2} ${GROUND - b.h - 6} L${b.x + b.w + 1} ${GROUND - b.h} Z`} className="sk-roof" />
              <rect x={b.x + b.w / 2 - 2} y={GROUND - b.h + 4} width={4} height={4} className="sk-win" />
            </>
          )}
        </g>
      ))}
      {scene.shackList.map((s, i) => (
        <g key={`s${i}`} className="sk-shack">
          <rect x={s.x} y={GROUND - s.h} width={s.w} height={s.h} />
          <path d={`M${s.x - 1} ${GROUND - s.h} L${s.x + s.w + 1} ${GROUND - s.h - 2}`} />
        </g>
      ))}
      {building && (
        <g className="sk-crane">
          <path d={`M${W * 0.3} ${GROUND} V${GROUND - 92} M${W * 0.3 - 18} ${GROUND - 88} H${W * 0.3 + 46} M${W * 0.3 + 38} ${GROUND - 88} V${GROUND - 64}`} />
          <rect x={W * 0.3 + 34} y={GROUND - 64} width={8} height={6} />
        </g>
      )}
      <rect x={0} y={GROUND} width={W} height={H - GROUND} className="sk-ground" />
      {pv.built.metro > 0 && (
        <g className="sk-metro">
          <rect x={20} y={GROUND + 6} width={W - 40} height={2} />
          <rect x={60} y={GROUND + 1} width={70} height={7} rx={3} />
        </g>
      )}
      {scene.trees.map((tr, i) => (
        <g key={`t${i}`} transform={`translate(${tr.x} ${GROUND}) scale(${tr.s})`} className="sk-tree">
          <rect x={-1} y={-6} width={2} height={6} />
          <circle cx={0} cy={-9} r={5} />
        </g>
      ))}
    </svg>
  );
}
