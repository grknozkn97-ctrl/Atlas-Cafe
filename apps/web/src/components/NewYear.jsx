import React from 'react';

/*
  New Year costume: gentle snowfall behind the menu, a string of lights over
  the header, a wreath around the compass logo and small ornaments on the
  corners of product photos. All of it is decoration only: never clickable,
  faint enough that text stays easy to read, and the moving parts stop for
  people who ask their phone for reduced motion.
*/

// A tiny seeded random so the snow looks the same on every visit and render.
function rng(seed) {
  let s = seed >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}

// Two layers: many small soft flakes far away, and a few larger snow
// crystals close by that turn slowly as they fall.
const FLAKES = (() => {
  const r = rng(2027);
  return Array.from({ length: 44 }, (_, i) => ({
    left: (r() * 100).toFixed(2),
    size: (2.5 + r() * 4.5).toFixed(1),
    dur: (10 + r() * 12).toFixed(1),
    delay: (-r() * 22).toFixed(1),
    sway: (14 + r() * 34).toFixed(0),
    opacity: (0.35 + r() * 0.45).toFixed(2),
    blur: i % 4 === 0,
  }));
})();

const CRYSTALS = (() => {
  const r = rng(1231);
  return Array.from({ length: 12 }, () => ({
    left: (3 + r() * 94).toFixed(2),
    size: (11 + r() * 12).toFixed(0),
    dur: (15 + r() * 12).toFixed(1),
    delay: (-r() * 27).toFixed(1),
    sway: (30 + r() * 50).toFixed(0),
    spin: (7 + r() * 9).toFixed(1),
    opacity: (0.45 + r() * 0.35).toFixed(2),
  }));
})();

const CRYSTAL = (
  <svg viewBox="0 0 24 24">
    <g stroke="#ffffff" strokeWidth="1.6" strokeLinecap="round" fill="none">
      <path d="M12 1.5v21M2.9 6.75l18.2 10.5M2.9 17.25l18.2-10.5" />
      <path d="M12 1.5l-2.4 2.6M12 1.5l2.4 2.6M12 22.5l-2.4-2.6M12 22.5l2.4-2.6M2.9 6.75l3.4.4M2.9 6.75l1 3.3M21.1 17.25l-3.4-.4M21.1 17.25l-1-3.3M2.9 17.25l1-3.3M2.9 17.25l3.4-.4M21.1 6.75l-1 3.3M21.1 6.75l-3.4.4" />
    </g>
  </svg>
);

export function Snowfall() {
  return (
    <div className="snow" aria-hidden="true">
      {FLAKES.map((f, i) => (
        <span
          key={`f${i}`}
          className={`flake ${f.blur ? 'soft' : ''}`}
          style={{
            left: `${f.left}%`, width: `${f.size}px`, height: `${f.size}px`, opacity: f.opacity,
            animationDuration: `${f.dur}s, ${(f.dur / 3).toFixed(1)}s`, animationDelay: `${f.delay}s, ${f.delay}s`,
            '--sway': `${f.sway}px`,
          }}
        />
      ))}
      {CRYSTALS.map((c, i) => (
        <span
          key={`c${i}`}
          className="flake crystal"
          style={{
            left: `${c.left}%`, width: `${c.size}px`, height: `${c.size}px`, opacity: c.opacity,
            animationDuration: `${c.dur}s, ${(c.dur / 3).toFixed(1)}s, ${c.spin}s`,
            animationDelay: `${c.delay}s, ${c.delay}s, ${c.delay}s`,
            '--sway': `${c.sway}px`,
          }}
        >
          {CRYSTAL}
        </span>
      ))}
    </div>
  );
}

/* ── String of lights over the header ─────────────────────────────── */
const SCALLOPS = 5;
const BULBS = 15;
const DIP = 16;
const COLORS = ['gold', 'red', 'ice', 'green'];

function wireY(xFrac) {
  const t = (xFrac * SCALLOPS) % 1;
  return 3 + DIP * 4 * t * (1 - t);
}

export function Garland() {
  const path = Array.from({ length: SCALLOPS }, (_, i) => {
    const x0 = (i / SCALLOPS) * 100; const x1 = ((i + 1) / SCALLOPS) * 100; const xm = (x0 + x1) / 2;
    return `${i === 0 ? `M${x0} 3` : ''} Q${xm} ${3 + DIP * 2} ${x1} 3`;
  }).join(' ');
  return (
    <div className="garland" aria-hidden="true">
      <svg viewBox="0 0 100 30" preserveAspectRatio="none">
        <path d={path} fill="none" stroke="#2b3b2f" strokeWidth="1.4" vectorEffect="non-scaling-stroke" />
      </svg>
      {Array.from({ length: BULBS }, (_, i) => {
        const x = (i + 0.5) / BULBS;
        return (
          <span
            key={i}
            className={`bulb ${COLORS[i % COLORS.length]}`}
            style={{ left: `${(x * 100).toFixed(2)}%`, top: `${wireY(x).toFixed(1)}px`, animationDelay: `${((i * 0.37) % 2.4).toFixed(2)}s` }}
          />
        );
      })}
    </div>
  );
}

/* ── Wreath around the logo ───────────────────────────────────────── */
export function Wreath() {
  const leaves = Array.from({ length: 22 }, (_, i) => i * (360 / 22));
  const berries = [20, 80, 140, 200, 260, 320];
  return (
    <svg className="wreath" viewBox="0 0 100 100" aria-hidden="true">
      {leaves.map((a, i) => (
        <ellipse
          key={a}
          cx="50" cy="6.5" rx="4.6" ry="9"
          fill={i % 2 ? '#2f6b45' : '#3f8656'}
          transform={`rotate(${a} 50 50) rotate(${i % 2 ? 32 : -32} 50 6.5)`}
        />
      ))}
      {berries.map((a) => (
        <circle key={a} cx="50" cy="5" r="3" fill={a % 120 === 20 ? '#e6c25a' : '#d2413a'} transform={`rotate(${a} 50 50)`} />
      ))}
      <g transform="translate(50 93)">
        <path d="M0 0 L-12 -6 Q-14 0 -12 6 Z M0 0 L12 -6 Q14 0 12 6 Z" fill="#c8312e" />
        <path d="M0 0 L-6 12 L-2 12 Z M0 0 L6 12 L2 12 Z" fill="#a82724" />
        <circle r="3.4" fill="#e04a40" />
      </g>
    </svg>
  );
}

/* ── Gold star, used as the badge icon ────────────────────────────── */
export const GoldStar = (p) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" {...p}>
    <path d="M12 2.2l2.7 6.1 6.6.6-5 4.4 1.5 6.5L12 16.5l-5.8 3.3 1.5-6.5-5-4.4 6.6-.6Z" fill="#f2cf63" stroke="#a87b1d" strokeWidth="0.9" strokeLinejoin="round" />
    <path d="M12 5.4l1.6 3.7" stroke="#fff6cf" strokeWidth="1.1" strokeLinecap="round" opacity="0.8" />
  </svg>
);

/* ── Corner ornaments for product photos ──────────────────────────── */
const Bauble = ({ className, color = '#c8312e', shine = '#ff8f86', len = 14 }) => (
  <svg className={className} viewBox={`0 0 24 ${len + 20}`} aria-hidden="true">
    <path d={`M12 0 V${len}`} stroke="#e8d18c" strokeWidth="0.9" />
    <rect x="9.2" y={len - 1} width="5.6" height="3.4" rx="0.8" fill="#d6b04d" />
    <circle cx="12" cy={len + 10} r="8.4" fill={color} />
    <path d={`M5 ${len + 9} q7 4 14 0`} stroke="rgba(255,255,255,0.45)" strokeWidth="1" fill="none" />
    <ellipse cx="9" cy={len + 7} rx="2.2" ry="3" fill={shine} opacity="0.7" transform={`rotate(-30 9 ${len + 7})`} />
  </svg>
);

const Holly = ({ className }) => (
  <svg className={className} viewBox="0 0 32 24" aria-hidden="true">
    <path d="M16 13 C10 4 3 6 1 10 c3 0 3 3 6 3 c-1 2 1 4 3 3 c1 2 4 2 6-3Z" fill="#2f7a49" stroke="#1d4d2e" strokeWidth="0.6" />
    <path d="M16 13 C22 4 29 6 31 10 c-3 0-3 3-6 3 c1 2-1 4-3 3 c-1 2-4 2-6-3Z" fill="#3a8c55" stroke="#1d4d2e" strokeWidth="0.6" />
    <circle cx="14" cy="15" r="2.8" fill="#d2413a" /><circle cx="18.4" cy="15.6" r="2.8" fill="#e04a40" /><circle cx="16.2" cy="11.8" r="2.6" fill="#c8312e" />
    <circle cx="13.2" cy="14" r="0.8" fill="#fff" opacity="0.6" />
  </svg>
);

const Flake = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
    <g stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" fill="none">
      <path d="M12 2v20M3.3 7l17.4 10M3.3 17L20.7 7" />
      <path d="M12 2l-2 2.4M12 2l2 2.4M12 22l-2-2.4M12 22l2-2.4M3.3 7l3 .3M3.3 7l1 2.8M20.7 17l-3-.3M20.7 17l-1-2.8M3.3 17l1-2.8M3.3 17l3-.3M20.7 7l-1 2.8M20.7 7l-3 .3" />
    </g>
  </svg>
);

const Gift = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
    <rect x="3" y="9" width="18" height="13" rx="1.6" fill="#c8312e" />
    <rect x="2" y="6.5" width="20" height="4.4" rx="1.2" fill="#e04a40" />
    <rect x="10.6" y="6.5" width="2.8" height="15.5" fill="#f2cf63" />
    <path d="M12 6.5 C9 1 4.6 3.2 6.4 6.5 Z M12 6.5 C15 1 19.4 3.2 17.6 6.5 Z" fill="#f2cf63" stroke="#a87b1d" strokeWidth="0.6" />
  </svg>
);

const Pine = ({ className }) => (
  <svg className={className} viewBox="0 0 40 26" aria-hidden="true">
    <path d="M0 4 Q20 8 40 2" stroke="#4a3320" strokeWidth="1.4" fill="none" />
    <g stroke="#2f7a49" strokeWidth="1.5" strokeLinecap="round">
      {Array.from({ length: 12 }, (_, i) => {
        const x = 2 + i * 3.2; const y = 4 + Math.sin((i / 11) * Math.PI) * 2;
        return <path key={i} d={`M${x} ${y} l-2.4 ${6 + (i % 3)} M${x} ${y} l2.4 ${6 + ((i + 1) % 3)}`} />;
      })}
    </g>
    <circle cx="14" cy="13" r="2.2" fill="#f2cf63" /><circle cx="27" cy="12" r="2.2" fill="#d2413a" />
  </svg>
);

const RedBauble = (p) => <Bauble {...p} />;
const GoldBauble = (p) => <Bauble {...p} color="#d9ae3e" shine="#fff2b8" len={20} />;

// Two ornaments per photo, picked from the dish id so the menu looks varied
// but each dish always wears the same ones.
const SETS = [
  ['red tr', 'holly bl'],
  ['gold tl', 'flake br'],
  ['pine tr', 'gift bl'],
  ['red tl', 'flake br'],
  ['gold tr', 'holly bl'],
  ['pine tl', 'gift br'],
];
const PARTS = { red: RedBauble, gold: GoldBauble, holly: Holly, flake: Flake, gift: Gift, pine: Pine };

export function PhotoDecor({ id, big = false }) {
  let h = 0;
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  const set = SETS[h % SETS.length];
  return (
    <span className={`decor ny ${big ? 'big' : ''}`} aria-hidden="true">
      {set.map((s) => {
        const [part, corner] = s.split(' ');
        const P = PARTS[part];
        return <P key={s} className={`orn ny-${part} ${corner}`} />;
      })}
    </span>
  );
}
