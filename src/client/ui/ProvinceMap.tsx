import { geoMercator, geoPath } from 'd3-geo';
import { memo, useMemo, useState } from 'react';
import { development } from '../../shared/local';
import type { CountryState, Province } from '../../shared/types';
import { featureFor, mainland } from './geo';

const W = 640;
const H = 380;

function seeded(seed: string) {
  let h = 2166136261;
  for (const ch of seed) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

/** Gelişmişliğe göre üç mimari dönem. */
type Era = 'eski' | 'beton' | 'modern';

export function eraOf(dev: number): Era {
  return dev > 0.62 ? 'modern' : dev > 0.3 ? 'beton' : 'eski';
}

/**
 * İlin minyatür silueti: bina sayısı konut stoğuna, yükseklik nüfus ve kentleşmeye,
 * malzeme ve renk gelişmişliğe göre değişir.
 */
const Cluster = memo(function Cluster({ pv, r, dev, k }: { pv: Province; r: number; dev: number; k: number }) {
  const shapes = useMemo(() => {
    const rnd = seeded(pv.id);
    const n = Math.round(Math.min(40, Math.max(3, 2 + Math.sqrt(pv.houses / 2200))));
    const t = Math.min(1, Math.max(0, (Math.log10(pv.pop * 1e6) - 4.6) / 2.6));
    const out: { x: number; y: number; w: number; h: number; tone: number; era: Era }[] = [];
    for (let i = 0; i < n; i++) {
      // Altın açı sarmalı: merkez yoğun, çeper seyrek.
      const a = i * 2.39996 + rnd() * 0.4;
      const d = Math.sqrt((i + 0.5) / n) * r * 0.95;
      const x = Math.cos(a) * d;
      const y = Math.sin(a) * d * 0.62;
      const central = 1 - d / (r + 0.01);
      // Merkezde yeni, çeperde eski yapılar; gelişmişlik oranı belirler.
      const era = eraOf(dev + (central - 0.5) * 0.35 + (rnd() - 0.5) * 0.3);
      const base = era === 'modern' ? 14 : era === 'beton' ? 7 : 2.6;
      const w = era === 'modern' ? 1.5 + rnd() * 1.1 : era === 'beton' ? 1.9 + rnd() * 1.3 : 2.2 + rnd() * 1.5;
      const h = Math.max(1.2, base * (0.2 + t * 1.5) * (0.4 + pv.urban / 170) * (0.35 + central * 0.9) * (0.6 + rnd() * 0.7));
      out.push({ x, y, w, h, tone: Math.floor(rnd() * 3), era });
    }
    return { list: out.sort((p, q) => p.y - q.y) };
  }, [pv.id, Math.round(pv.houses / 20000), Math.round(pv.urban), Math.round(dev * 20), r]);
  const s = 1 / Math.sqrt(k);
  return (
    <g className="cluster" transform={`scale(${s})`}>
      {shapes.list.map((b, i) => {
        const { x, y, w, h } = b;
        const dx = w * 0.9;
        const dy = w * 0.45;
        return (
          <g key={i} className={`bld era-${b.era} t${b.tone}`}>
            <path className="bl" d={`M${x - dx} ${y} L${x} ${y + dy} L${x} ${y + dy - h} L${x - dx} ${y - h} Z`} />
            <path className="br" d={`M${x} ${y + dy} L${x + dx} ${y} L${x + dx} ${y - h} L${x} ${y + dy - h} Z`} />
            <path className="bt" d={`M${x - dx} ${y - h} L${x} ${y + dy - h} L${x + dx} ${y - h} L${x} ${y - dy - h} Z`} />
            {b.era === 'eski' && h < 4 && <path className="broof" d={`M${x - dx} ${y - h} L${x} ${y - h - 2} L${x + dx} ${y - h} L${x} ${y + dy - h} Z`} />}
          </g>
        );
      })}
    </g>
  );
});

/** İllerin haritası: her il, nüfusu ve gelişmişliğiyle orantılı minyatür bir şehir; zemin rengi belediyenin partisi. */
export function ProvinceMap({
  c,
  selected,
  onSelect,
  highlightParty,
  color,
}: {
  c: CountryState;
  selected: string | null;
  onSelect: (id: string) => void;
  highlightParty?: string | null;
  /** İsteğe bağlı boyama (ör. göç) */
  color?: (id: string) => string | undefined;
}) {
  const [hover, setHover] = useState<string | null>(null);
  const [zoom, setZoom] = useState(false);
  const geo = useMemo(() => {
    const f = featureFor(c.id);
    const land = f ? mainland(f) : null;
    const pts = { type: 'MultiPoint' as const, coordinates: c.provinces.map((p) => [p.lon, p.lat]) };
    const fc = { type: 'FeatureCollection' as const, features: [...(land ? [land] : []), { type: 'Feature' as const, properties: {}, geometry: pts }] };
    const proj = geoMercator().fitExtent(
      [
        [22, 26],
        [W - 22, H - 18],
      ],
      fc as never,
    );
    const path = geoPath(proj);
    return { d: f ? (path(f) ?? '') : '', proj };
  }, [c.id, c.provinces.length]);
  const maxPop = Math.max(...c.provinces.map((p) => p.pop));
  const party = (id: string) => c.parties.find((p) => p.id === id);
  // Önce arkadakiler (kuzey), sonra öndekiler çizilir.
  const placed = c.provinces
    .map((pv) => ({ pv, xy: geo.proj([pv.lon, pv.lat]) }))
    .filter((x): x is { pv: Province; xy: [number, number] } => !!x.xy)
    .sort((a, b) => a.xy[1] - b.xy[1]);
  const sel = placed.find((x) => x.pv.id === selected);
  const k = zoom && sel ? 3 : 1;
  const tx = sel && zoom ? Math.min(0, Math.max(W - W * k, W / 2 - sel.xy[0] * k)) : 0;
  const ty = sel && zoom ? Math.min(0, Math.max(H - H * k, H / 2 - sel.xy[1] * k)) : 0;
  const hov = placed.find((x) => x.pv.id === hover);
  return (
    <div className="provmap">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${c.name} illeri`}>
        <defs>
          <radialGradient id="pm-sea" cx="50%" cy="40%" r="75%">
            <stop offset="0%" className="ocean-a" />
            <stop offset="100%" className="ocean-b" />
          </radialGradient>
        </defs>
        <rect width={W} height={H} fill="url(#pm-sea)" />
        <g className="map-g" style={{ transform: `translate(${tx}px,${ty}px) scale(${k})` }}>
          <path d={geo.d} className="provmap-land" style={{ strokeWidth: 1 / k }} />
          {placed.map(({ pv, xy }) => {
            const r = 4 + 17 * Math.sqrt(pv.pop / maxPop);
            const p = party(pv.mayor.partyId);
            const mine = !!highlightParty && pv.mayor.partyId === highlightParty;
            const nominated = !!highlightParty && !!pv.nominees[highlightParty];
            const fill = color?.(pv.id) ?? p?.color ?? '#888';
            return (
              <g
                key={pv.id}
                className={`prov ${selected === pv.id ? 'on' : ''}`}
                transform={`translate(${xy[0]} ${xy[1]})`}
                onClick={() => onSelect(pv.id)}
                onMouseEnter={() => setHover(pv.id)}
                onMouseLeave={() => setHover(null)}
              >
                <ellipse rx={r + 5} ry={(r + 5) * 0.7} className="prov-hit" />
                <ellipse rx={r} ry={r * 0.62} fill={fill} className={`prov-ground ${mine ? "mine" : ""}`} />
                <ellipse rx={r} ry={r * 0.62} fill="none" stroke={mine ? "var(--gold)" : fill} strokeWidth={mine ? 2.2 : 1.6} strokeOpacity={0.9} />
                {nominated && <ellipse rx={r + 3} ry={(r + 3) * 0.62} className="prov-nom" />}
                {selected === pv.id && <ellipse rx={r + 4} ry={(r + 4) * 0.62} className="prov-sel" />}
                <Cluster pv={pv} r={r} dev={development(c, pv)} k={1} />
                {(r > 11 || (k > 1 && r > 5)) && (
                  <text y={r * 0.62 + 10 / Math.sqrt(k)} className="prov-label" style={{ fontSize: 11 / Math.sqrt(k) }}>
                    {pv.name}
                  </text>
                )}
              </g>
            );
          })}
        </g>
      </svg>
      {sel && (
        <button className="ghost small map-zoom" onClick={() => setZoom((z) => !z)}>
          {zoom ? '🗺️ Ülkeye dön' : `🔍 ${sel.pv.name}'e yakınlaş`}
        </button>
      )}
      <div className="map-legend small">
        <span>
          <i className="lg era-eski" /> eski yapılar
        </span>
        <span>
          <i className="lg era-beton" /> betonarme
        </span>
        <span>
          <i className="lg era-modern" /> modern
        </span>
      </div>
      {hov && (
        <div className="map-tip" style={{ left: `${((hov.xy[0] * k + tx) / W) * 100}%`, top: `${((hov.xy[1] * k + ty) / H) * 100}%` }}>
          <div className="map-tip-title">{hov.pv.name}</div>
          <div className="small muted">
            {hov.pv.pop >= 1 ? `${hov.pv.pop.toFixed(1)} milyon` : `${Math.round(hov.pv.pop * 1000)} bin`} · {party(hov.pv.mayor.partyId)?.short} ·{' '}
            {{ eski: 'eski yapılar', beton: 'betonarme', modern: 'modern' }[eraOf(development(c, hov.pv))]}
          </div>
        </div>
      )}
    </div>
  );
}
