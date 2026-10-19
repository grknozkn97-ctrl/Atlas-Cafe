import React from 'react';

/*
  Trick-or-treaters: four kids in costume, each with a sweets basket, strolling
  slowly across the lower half of the screen behind the menu. Pure decoration —
  never clickable, faint enough that text stays easy to read, and hidden for
  people who ask their phone for reduced motion.
*/

const Basket = ({ x, y }) => (
  <g transform={`translate(${x} ${y})`}>
    <path d="M-7 0 q7 -11 14 0" fill="none" stroke="#7a3510" strokeWidth="1.6" />
    <ellipse cx="0" cy="5" rx="8" ry="7" fill="#e8762c" />
    <path d="M-3 3 l1.6 -1.8 l1.4 1.8Z M1.4 3 l1.6 -1.8 l1.4 1.8Z M-3.4 6.6 q3.4 3 6.8 0" fill="#ffd36b" />
    <circle cx="-3" cy="-1" r="1.6" fill="#ff5d8f" />
    <circle cx="2" cy="-1.6" r="1.4" fill="#7bd0ff" />
  </g>
);

function Ghost() {
  return (
    <svg viewBox="0 0 64 92">
      <path d="M12 44 Q12 10 32 10 Q52 10 52 44 V82 l-6.6 -5 l-6.6 5 l-6.6 -5 l-6.6 5 l-6.6 -5 l-6.6 5 Z" fill="#efe5cf" />
      <ellipse cx="25" cy="34" rx="3.4" ry="4.6" fill="#15110e" />
      <ellipse cx="39" cy="34" rx="3.4" ry="4.6" fill="#15110e" />
      <path d="M50 52 q6 2 8 6" stroke="#efe5cf" strokeWidth="5" strokeLinecap="round" fill="none" />
      <Basket x={56} y={62} />
    </svg>
  );
}

function Witch() {
  return (
    <svg viewBox="0 0 64 92">
      <path d="M14 26 H50 L46 22 H18 Z" fill="#1b1622" />
      <path d="M22 23 L33 0 L42 23 Z" fill="#1b1622" />
      <rect x="23" y="18" width="18" height="3.4" fill="#8e5cc7" />
      <circle cx="32" cy="32" r="8" fill="#e6c29b" />
      <path d="M24 30 q-3 8 0 14 M40 30 q3 8 0 14" stroke="#d4552a" strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M22 76 L28 40 H36 L42 76 Z" fill="#4a2e66" />
      <path d="M27 76 v10 M37 76 v10" stroke="#1b1622" strokeWidth="3.4" strokeLinecap="round" />
      <path d="M38 48 q10 4 14 10" stroke="#4a2e66" strokeWidth="4.4" strokeLinecap="round" fill="none" />
      <Basket x={53} y={63} />
    </svg>
  );
}

function PumpkinHead() {
  return (
    <svg viewBox="0 0 64 92">
      <path d="M31 8 q2 -6 6 -6" stroke="#3d5a2a" strokeWidth="2.6" fill="none" strokeLinecap="round" />
      <ellipse cx="32" cy="22" rx="15" ry="13" fill="#e8762c" />
      <path d="M25 9 Q21 22 25 34 M39 9 Q43 22 39 34" stroke="#c45a18" strokeWidth="1.2" fill="none" />
      <path d="M24 19 l3.6 -4 l3 4Z M33 19 l3.6 -4 l3 4Z M23 25 q9 8 18 0 l-3 2.4 l-3 -2 l-3 2.4 l-3 -2.4 l-3 2Z" fill="#ffd36b" />
      <rect x="22" y="36" width="20" height="28" rx="6" fill="#2f4a2a" />
      <path d="M26 64 v20 M38 64 v20" stroke="#1d2a1b" strokeWidth="4" strokeLinecap="round" />
      <path d="M40 44 q9 4 12 12" stroke="#2f4a2a" strokeWidth="4.4" strokeLinecap="round" fill="none" />
      <Basket x={53} y={61} />
    </svg>
  );
}

function Vampire() {
  return (
    <svg viewBox="0 0 64 92">
      <path d="M12 40 L20 30 H44 L52 40 L46 80 H18 Z" fill="#a3172c" />
      <path d="M16 40 L22 32 H42 L48 40 L43 80 H21 Z" fill="#1b1416" />
      <circle cx="32" cy="22" r="9" fill="#e9dccb" />
      <path d="M23 20 Q24 10 32 12 Q40 10 41 20 L36 16 L32 21 L28 16 Z" fill="#1b1416" />
      <path d="M29 27 l1 2.4 l1 -2.4 M33 27 l1 2.4 l1 -2.4" fill="#fff" stroke="#fff" strokeWidth="0.6" />
      <path d="M26 80 v8 M38 80 v8" stroke="#1b1416" strokeWidth="3.6" strokeLinecap="round" />
      <path d="M44 46 q8 4 10 10" stroke="#1b1416" strokeWidth="4.4" strokeLinecap="round" fill="none" />
      <Basket x={55} y={60} />
    </svg>
  );
}

const WALKERS = [
  { C: Ghost, top: '58%', dur: 52, delay: -8, size: 64, dir: 'ltr' },
  { C: Witch, top: '74%', dur: 64, delay: -30, size: 70, dir: 'rtl' },
  { C: PumpkinHead, top: '66%', dur: 58, delay: -44, size: 60, dir: 'ltr' },
  { C: Vampire, top: '84%', dur: 70, delay: -18, size: 66, dir: 'rtl' },
];

export function TrickOrTreaters() {
  return (
    <div className="walkers" aria-hidden="true">
      {WALKERS.map(({ C, top, dur, delay, size, dir }, i) => (
        <div
          key={i}
          className={`walker ${dir}`}
          style={{ top, width: size, height: size * 1.44, animationDuration: `${dur}s`, animationDelay: `${delay}s` }}
        >
          <div className="walker-bob" style={{ animationDelay: `${i * 0.17}s` }}><C /></div>
        </div>
      ))}
    </div>
  );
}

/* ── Corner ornaments for product photos ────────────────────────────── */

const Web = ({ className }) => (
  <svg className={className} viewBox="0 0 40 40" aria-hidden="true">
    <g stroke="rgba(239,229,207,0.85)" strokeWidth="0.9" fill="none">
      <path d="M0 0 L40 6 M0 0 L30 22 M0 0 L22 30 M0 0 L6 40" />
      <path d="M10 1.5 Q9 6 7.5 8 Q4 9 1.5 10" />
      <path d="M20 3 Q17 12 15 15 Q8 18 3 20" />
      <path d="M31 4.6 Q26 18 23 23 Q14 27 4.6 31" />
    </g>
  </svg>
);

const MiniPumpkin = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
    <path d="M12 6.2c.3-1.6 1.2-2.6 2.6-3" stroke="#3d5a2a" strokeWidth="1.8" fill="none" strokeLinecap="round" />
    <path d="M12 6c-2-1.2-5.6-1-7.4 1.6C2.8 10.2 3 15 5.4 17.6 7.2 19.6 10 20 12 19c2 1 4.8.6 6.6-1.4 2.4-2.6 2.6-7.4.8-10C17.6 5 14 4.8 12 6Z" fill="#e8762c" stroke="#7a3510" strokeWidth="0.6" />
    <path d="M8.2 11.4l1.6-1.8 1.4 1.8Zm4.6 0 1.6-1.8 1.4 1.8ZM8 14.2c2.4 2.4 5.6 2.4 8 0l-1.6.4-1.2-.8-1.2.9-1.2-.9-1.2.8Z" fill="#ffd36b" />
  </svg>
);

const Bat = ({ className }) => (
  <svg className={className} viewBox="0 0 24 12" aria-hidden="true">
    <path d="M0 6 C3 2 6 2 8 5 C9 3 10 3 11 5 C12 3 13 3 14 5 C16 2 19 2 22 6 C19 5 17 6 15 9 C13 8 9 8 7 9 C5 6 3 5 0 6 Z" fill="#15110e" stroke="rgba(239,229,207,0.6)" strokeWidth="0.6" />
  </svg>
);

const Spider = ({ className }) => (
  <svg className={className} viewBox="0 0 20 40" aria-hidden="true">
    <path d="M10 0 V22" stroke="rgba(239,229,207,0.8)" strokeWidth="0.8" />
    <g stroke="#15110e" strokeWidth="1.3" fill="none" strokeLinecap="round">
      <path d="M10 26 l-6 -4 l-2 3 M10 27 l-7 0 l-2 3 M10 28 l-6 4 l-1 3 M10 26 l6 -4 l2 3 M10 27 l7 0 l2 3 M10 28 l6 4 l1 3" />
    </g>
    <ellipse cx="10" cy="27" rx="3.6" ry="4.2" fill="#15110e" stroke="rgba(239,229,207,0.5)" strokeWidth="0.5" />
    <circle cx="8.8" cy="26" r="0.7" fill="#ff7a3c" /><circle cx="11.2" cy="26" r="0.7" fill="#ff7a3c" />
  </svg>
);

const Candy = ({ className }) => (
  <svg className={className} viewBox="0 0 30 14" aria-hidden="true">
    <path d="M0 2 L7 7 L0 12 Z M30 2 L23 7 L30 12 Z" fill="#8e5cc7" />
    <ellipse cx="15" cy="7" rx="8.6" ry="6" fill="#e8762c" />
    <path d="M9 4 Q15 9 21 4 M9 10 Q15 5 21 10" stroke="#ffd36b" strokeWidth="1.2" fill="none" />
  </svg>
);

// Two ornaments per photo, picked from the dish id so the menu looks varied
// but each dish always wears the same ones.
const SETS = [
  ['web tl', 'pumpkin br'],
  ['web tr', 'spider tl'],
  ['bat tr', 'pumpkin bl'],
  ['web tl', 'candy br'],
  ['spider tr', 'pumpkin bl'],
  ['web tr', 'bat tl'],
];
const PARTS = { web: Web, pumpkin: MiniPumpkin, bat: Bat, spider: Spider, candy: Candy };

export function PhotoDecor({ id, big = false }) {
  let h = 0;
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  const set = SETS[h % SETS.length];
  return (
    <span className={`decor ${big ? 'big' : ''}`} aria-hidden="true">
      {set.map((s) => {
        const [part, corner] = s.split(' ');
        const P = PARTS[part];
        return <P key={s} className={`orn ${part} ${corner}`} />;
      })}
    </span>
  );
}
