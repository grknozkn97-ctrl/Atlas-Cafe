import { geoGraticule10, geoNaturalEarth1, geoPath } from 'd3-geo';
import { useMemo, useState } from 'react';
import type { CountrySummary } from '../../shared/types';
import { FEATURES, NUM_TO_ID, mainland } from './geo';

const W = 960;
const H = 500;

interface Props {
  world: CountrySummary[];
  selected: string | null;
  onSelect: (id: string) => void;
  /** Seçilen ülkeye yakınlaş */
  zoom?: boolean;
  /** Oyuncunun ülkesi (vurgulanır) */
  home?: string | null;
}

export function WorldMap({ world, selected, onSelect, zoom = true, home }: Props) {
  const [hover, setHover] = useState<{ id: string; x: number; y: number } | null>(null);
  const { path, shapes, graticule, sphere } = useMemo(() => {
    const projection = geoNaturalEarth1().fitExtent(
      [
        [4, 4],
        [W - 4, H - 4],
      ],
      { type: 'Sphere' },
    );
    const path = geoPath(projection);
    const shapes = FEATURES.map((f) => ({
      f,
      id: NUM_TO_ID[f.id ?? ''] as string | undefined,
      d: path(f) ?? '',
      centroid: path.centroid(mainland(f)),
      bounds: path.bounds(mainland(f)),
    }));
    return { path, shapes, graticule: path(geoGraticule10()) ?? '', sphere: path({ type: 'Sphere' }) ?? '' };
  }, []);
  void path;
  const byId = useMemo(() => Object.fromEntries(world.map((c) => [c.id, c])), [world]);

  let transform = 'translate(0px,0px) scale(1)';
  let k = 1;
  const sel = selected ? shapes.find((s) => s.id === selected) : undefined;
  if (zoom && sel) {
    const [[x0, y0], [x1, y1]] = sel.bounds;
    k = Math.min(5, 0.5 / Math.max((x1 - x0) / W, (y1 - y0) / H));
    const cx = (x0 + x1) / 2;
    const cy = (y0 + y1) / 2;
    // SVG koordinatlarında kaydırma; CSS geçişiyle yumuşak yakınlaşma.
    const tx = Math.min(0, Math.max(W - W * k, W / 2 - cx * k));
    const ty = Math.min(0, Math.max(H - H * k, H / 2 - cy * k));
    transform = `translate(${tx}px,${ty}px) scale(${k})`;
  }
  const hovered = hover ? byId[hover.id] : null;

  return (
    <div className="worldmap" onMouseLeave={() => setHover(null)}>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Dünya haritası">
        <defs>
          <radialGradient id="ocean" cx="50%" cy="45%" r="70%">
            <stop offset="0%" className="ocean-a" />
            <stop offset="100%" className="ocean-b" />
          </radialGradient>
        </defs>
        <g className="map-g" style={{ transform }}>
          <path d={sphere} fill="url(#ocean)" className="sphere" />
          <path d={graticule} className="graticule" style={{ strokeWidth: 0.5 / k }} />
          {shapes.map((s, i) => {
            const c = s.id ? byId[s.id] : undefined;
            const cls = ['land', c ? 'game' : '', c && !c.playable ? 'locked' : '', s.id === selected ? 'sel' : '', s.id === home ? 'home' : '']
              .filter(Boolean)
              .join(' ');
            return (
              <path
                key={i}
                d={s.d}
                className={cls}
                style={{
                  fill: c?.rulingParty && c.playable ? c.rulingParty.color : undefined,
                  strokeWidth: (s.id === selected ? 1.6 : 0.4) / k,
                }}
                onClick={c ? () => onSelect(c.id) : undefined}
                onMouseMove={
                  c
                    ? (e) => {
                        const r = (e.currentTarget.ownerSVGElement as SVGSVGElement).getBoundingClientRect();
                        setHover({ id: c.id, x: e.clientX - r.left, y: e.clientY - r.top });
                      }
                    : undefined
                }
              />
            );
          })}
          {shapes
            .filter((s) => s.id && byId[s.id])
            .map((s) => (
              <g
                key={s.id}
                className={`pin ${s.id === selected ? 'sel' : ''}`}
                transform={`translate(${s.centroid[0]},${s.centroid[1]}) scale(${1 / k})`}
                onClick={() => onSelect(s.id!)}
              >
                <circle r={9} className="pin-hit" />
                <circle r={3.2} className="pin-dot" />
                {s.id === selected && <circle r={3.2} className="pin-pulse" />}
              </g>
            ))}
        </g>
      </svg>
      {hovered && hover && (
        <div className="map-tip" style={{ left: hover.x, top: hover.y }}>
          <div className="map-tip-title">
            <span className="flag">{hovered.flag}</span> {hovered.name}
          </div>
          {hovered.rulingParty && (
            <div className="small">
              <span className="dot-c" style={{ background: hovered.rulingParty.color }} /> {hovered.rulingParty.short} ·{' '}
              {hovered.leaderName}
            </div>
          )}
          {!hovered.playable && <div className="small muted">Serbest seçim yok</div>}
        </div>
      )}
    </div>
  );
}
