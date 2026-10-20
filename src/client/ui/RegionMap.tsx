import { geoMercator, geoPath } from 'd3-geo';
import { useMemo } from 'react';
import { regionFit } from '../../shared/politics';
import type { CountryState, Party } from '../../shared/types';
import { featureFor, mainland } from './geo';

const W = 400;
const H = 260;

/** Ülke silüeti üzerinde bölgeler: daire büyüklüğü nüfus, rengi partine uygunluk. */
export function RegionMap({
  c,
  party,
  day,
  selected,
  onSelect,
}: {
  c: CountryState;
  party: Party | null;
  day: number;
  selected: string | null;
  onSelect: (id: string) => void;
}) {
  const geo = useMemo(() => {
    const f = featureFor(c.id);
    if (!f) return null;
    const main = mainland(f);
    const projection = geoMercator().fitExtent(
      [
        [16, 16],
        [W - 16, H - 16],
      ],
      main,
    );
    const path = geoPath(projection);
    return { d: path(main) ?? '', bounds: path.bounds(main) };
  }, [c.id]);
  if (!geo) return null;
  const [[x0, y0], [x1, y1]] = geo.bounds;
  return (
    <div className="regionmap">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${c.name} bölgeleri`}>
        <path d={geo.d} className="region-land" />
        {c.regions.map((r) => {
          const cx = x0 + r.x * (x1 - x0);
          const cy = y0 + r.y * (y1 - y0);
          const rad = 10 + Math.sqrt(r.weight) * 34;
          const fit = party ? regionFit(party, r.lean) : 0.8;
          const cool = (party?.cooldowns[`miting:${r.id}`] ?? 0) > day;
          return (
            <g key={r.id} className={`region ${selected === r.id ? 'sel' : ''} ${cool ? 'cool' : ''}`} onClick={() => onSelect(r.id)}>
              <circle
                cx={cx}
                cy={cy}
                r={rad}
                style={{ fill: party?.color ?? 'var(--accent)', fillOpacity: 0.15 + Math.max(0, Math.min(1, fit / 1.3)) * 0.55 }}
              />
              <text x={cx} y={cy - 2} textAnchor="middle" className="region-name">
                {r.name.split(' ')[0]}
              </text>
              <text x={cx} y={cy + 11} textAnchor="middle" className="region-sub">
                {cool ? '⏳' : `%${Math.round(r.weight * 100)}`}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
