import { geoMercator, geoPath } from 'd3-geo';
import { useMemo, useState } from 'react';
import type { CountryState } from '../../shared/types';
import { featureFor, mainland } from './geo';

const W = 640;
const H = 380;

/** İllerin haritası: daire büyüklüğü nüfus, renk belediye başkanının partisi. */
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
  /** İsteğe bağlı boyama (ör. nüfus değişimi) */
  color?: (id: string) => string | undefined;
}) {
  const [hover, setHover] = useState<string | null>(null);
  const geo = useMemo(() => {
    const f = featureFor(c.id);
    const land = f ? mainland(f) : null;
    const pts = { type: 'MultiPoint' as const, coordinates: c.provinces.map((p) => [p.lon, p.lat]) };
    const fc = { type: 'FeatureCollection' as const, features: [...(land ? [land] : []), { type: 'Feature' as const, properties: {}, geometry: pts }] };
    const proj = geoMercator().fitExtent(
      [
        [18, 18],
        [W - 18, H - 18],
      ],
      fc as never,
    );
    const path = geoPath(proj);
    return { d: f ? (path(f) ?? '') : '', proj };
  }, [c.id, c.provinces.length]);
  const maxPop = Math.max(...c.provinces.map((p) => p.pop));
  const party = (id: string) => c.parties.find((p) => p.id === id);
  const sorted = [...c.provinces].sort((a, b) => b.pop - a.pop);
  const hov = c.provinces.find((p) => p.id === hover);
  const hovXY = hov ? geo.proj([hov.lon, hov.lat]) : null;
  return (
    <div className="provmap">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${c.name} illeri`}>
        <rect width={W} height={H} className="provmap-sea" />
        <path d={geo.d} className="provmap-land" />
        {sorted.map((pv) => {
          const xy = geo.proj([pv.lon, pv.lat]);
          if (!xy) return null;
          const r = 3 + 19 * Math.sqrt(pv.pop / maxPop);
          const p = party(pv.mayor.partyId);
          const mine = !!highlightParty && pv.mayor.partyId === highlightParty;
          const nominated = !!highlightParty && !!pv.nominees[highlightParty];
          return (
            <g
              key={pv.id}
              className={`prov ${selected === pv.id ? 'on' : ''}`}
              transform={`translate(${xy[0]} ${xy[1]})`}
              onClick={() => onSelect(pv.id)}
              onMouseEnter={() => setHover(pv.id)}
              onMouseLeave={() => setHover(null)}
            >
              <circle r={r + 6} className="prov-hit" />
              <circle r={r} fill={color?.(pv.id) ?? p?.color ?? '#888'} className={`prov-dot ${mine ? 'mine' : ''}`} />
              {nominated && <circle r={r + 3} className="prov-nom" />}
              {selected === pv.id && <circle r={r + 5} className="prov-sel" />}
              {r > 11 && (
                <text y={r + 11} className="prov-label">
                  {pv.name}
                </text>
              )}
            </g>
          );
        })}
      </svg>
      {hov && hovXY && (
        <div className="map-tip" style={{ left: `${(hovXY[0] / W) * 100}%`, top: `${(hovXY[1] / H) * 100}%` }}>
          <div className="map-tip-title">{hov.name}</div>
          <div className="small muted">
            {hov.pop >= 1 ? `${hov.pop.toFixed(1)} milyon` : `${Math.round(hov.pop * 1000)} bin`} · {party(hov.mayor.partyId)?.short}
          </div>
        </div>
      )}
    </div>
  );
}
