import type { PartySummary } from '../../shared/types';

/** Meclis sandalye dağılımı: soldan sağa ideolojiye göre dizilmiş yarım daire. */
export function Hemicycle({ parties, seats = 151, highlight, size = 280 }: { parties: PartySummary[]; seats?: number; highlight?: string | null; size?: number }) {
  const rows = seats > 200 ? 9 : 7;
  const R = 100;
  const r0 = 38;
  // Her sıradaki sandalye sayısı yarıçapla orantılı
  const radii = Array.from({ length: rows }, (_, i) => r0 + ((R - r0) * i) / (rows - 1));
  const totalLen = radii.reduce((s, r) => s + r, 0);
  const pos: { x: number; y: number; a: number }[] = [];
  let left = seats;
  radii.forEach((r, i) => {
    const n = i === rows - 1 ? left : Math.round((seats * r) / totalLen);
    left -= n;
    for (let j = 0; j < n; j++) {
      const a = Math.PI - (Math.PI * (j + 0.5)) / n;
      pos.push({ x: Math.cos(a) * r, y: -Math.sin(a) * r, a });
    }
  });
  pos.sort((p, q) => q.a - p.a);
  const ordered = [...parties].filter((p) => p.seats > 0).sort((a, b) => a.ideology.economic - b.ideology.economic);
  // En büyük kalan yöntemiyle sandalye dağıtımı
  const raw = ordered.map((p) => (p.seats / 100) * seats);
  const base = raw.map(Math.floor);
  let rest = seats - base.reduce((s, x) => s + x, 0);
  raw
    .map((x, i) => ({ i, f: x - Math.floor(x) }))
    .sort((a, b) => b.f - a.f)
    .forEach(({ i }) => {
      if (rest > 0) {
        base[i] += 1;
        rest -= 1;
      }
    });
  const colors: { color: string; id: string }[] = [];
  ordered.forEach((p, i) => {
    for (let k = 0; k < base[i]; k++) colors.push({ color: p.color, id: p.id });
  });
  const dot = Math.max(1.6, (R - r0) / rows / 2.3);
  const majority = parties.filter((p) => p.inGovernment).reduce((s, p) => s + p.seats, 0);
  return (
    <div className="hemicycle" style={{ maxWidth: size }}>
      <svg viewBox="-106 -106 212 112" role="img" aria-label="Meclis dağılımı">
        {pos.map((p, i) => {
          const c = colors[i];
          return (
            <circle
              key={i}
              cx={p.x}
              cy={p.y}
              r={dot}
              fill={c?.color ?? 'var(--surface-3)'}
              opacity={highlight && c && c.id !== highlight ? 0.35 : 1}
            />
          );
        })}
        <text x={0} y={-8} textAnchor="middle" className="hemi-num">
          {Math.round((majority / 100) * seats)}
        </text>
        <text x={0} y={2} textAnchor="middle" className="hemi-label">
          hükümet / {seats}
        </text>
      </svg>
    </div>
  );
}
