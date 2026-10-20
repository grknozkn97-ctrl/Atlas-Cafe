import type { Avatar as AvatarT } from '../../shared/types';

export const SKINS = ['#f6d7c3', '#eac09f', '#d39b72', '#b47a52', '#8a5636', '#5e3a24'];
export const HAIR_COLORS = ['#1f1b18', '#4a2f1d', '#8a5a2b', '#c9a15b', '#9c9c9c', '#e8e4dc'];
export const SUITS = ['#1f2a44', '#2b2b2e', '#5a5f66', '#3d2b1f', '#7a1f2b', '#e9e4d8'];
export const TIES = ['#c92a2a', '#1c7ed6', '#2f9e44', '#f08c00', '#7048e8', 'none'];
export const HAIR_LABELS = ['Kel', 'Kısa', 'Yana taranmış', 'Uzun', 'Topuz', 'Kıvırcık'];

/** Katmanlı SVG portre. */
export function Avatar({ a, size = 96, ring }: { a: AvatarT; size?: number; ring?: string }) {
  const skin = SKINS[a.skin] ?? SKINS[0];
  const hairC = HAIR_COLORS[a.hairColor] ?? HAIR_COLORS[0];
  const suit = SUITS[a.suit] ?? SUITS[0];
  const tie = TIES[a.tie] ?? TIES[0];
  const shade = 'rgba(0,0,0,.14)';
  return (
    <svg className="avatar" width={size} height={size} viewBox="0 0 120 120" role="img" aria-label="Lider portresi">
      <defs>
        <clipPath id={`clip-${size}`}>
          <circle cx="60" cy="60" r="58" />
        </clipPath>
      </defs>
      <circle cx="60" cy="60" r="58" className="avatar-bg" />
      <g clipPath={`url(#clip-${size})`}>
        {/* uzun saç arkası */}
        {a.hair === 3 && <path d="M30 52 Q28 98 40 108 L80 108 Q92 98 90 52 Z" fill={hairC} />}
        {/* gövde */}
        <path d="M14 120 Q16 88 44 82 L76 82 Q104 88 106 120 Z" fill={suit} />
        <path d="M48 82 L60 104 L72 82 Z" fill="#f4f4f2" />
        {tie !== 'none' ? (
          <path d="M57 86 L63 86 L65 92 L62 108 L58 108 L55 92 Z" fill={tie} />
        ) : (
          <path d="M52 82 Q60 92 68 82" fill="none" stroke={shade} strokeWidth="2" />
        )}
        <path d="M44 82 L56 100 L50 120 M76 82 L64 100 L70 120" fill="none" stroke={shade} strokeWidth="2" />
        {/* boyun ve kafa */}
        <rect x="52" y="66" width="16" height="18" rx="6" fill={skin} />
        <rect x="52" y="74" width="16" height="6" fill={shade} />
        <ellipse cx="36" cy="54" rx="5" ry="7" fill={skin} />
        <ellipse cx="84" cy="54" rx="5" ry="7" fill={skin} />
        <ellipse cx="60" cy="50" rx="23" ry="27" fill={skin} />
        {/* yüz */}
        <ellipse cx="51" cy="51" rx="2.4" ry="2.8" fill="#2a211c" />
        <ellipse cx="69" cy="51" rx="2.4" ry="2.8" fill="#2a211c" />
        <path d="M46 44 Q51 41 56 44 M64 44 Q69 41 74 44" stroke={a.hair === 0 ? '#3a2a20' : hairC} strokeWidth="2.2" fill="none" strokeLinecap="round" />
        <path d="M60 52 Q57 60 60 62" stroke={shade} strokeWidth="2" fill="none" strokeLinecap="round" />
        <path d="M52 67 Q60 72 68 67" stroke="#8a3b2e" strokeWidth="2.2" fill="none" strokeLinecap="round" />
        {/* saç */}
        {a.hair === 0 && <path d="M38 48 Q38 40 42 36 M82 48 Q82 40 78 36" stroke={hairC} strokeWidth="4" fill="none" opacity=".7" />}
        {a.hair === 1 && <path d="M37 46 Q36 22 60 21 Q84 22 83 46 Q78 32 60 31 Q42 32 37 46 Z" fill={hairC} />}
        {a.hair === 2 && <path d="M37 50 Q34 20 62 20 Q86 22 83 48 Q80 34 70 32 Q56 36 44 32 Q38 38 37 50 Z" fill={hairC} />}
        {a.hair === 3 && <path d="M35 58 Q30 18 60 19 Q90 18 85 58 Q82 36 72 30 Q60 36 46 30 Q38 38 35 58 Z" fill={hairC} />}
        {a.hair === 4 && (
          <>
            <circle cx="60" cy="16" r="10" fill={hairC} />
            <path d="M37 48 Q35 22 60 22 Q85 22 83 48 Q78 32 60 30 Q42 32 37 48 Z" fill={hairC} />
          </>
        )}
        {a.hair === 5 && (
          <g fill={hairC}>
            {[...Array(11)].map((_, i) => {
              const ang = Math.PI + (Math.PI * i) / 10;
              return <circle key={i} cx={60 + Math.cos(ang) * 22} cy={42 + Math.sin(ang) * 20} r="8" />;
            })}
          </g>
        )}
      </g>
      {ring && <circle cx="60" cy="60" r="57" fill="none" stroke={ring} strokeWidth="4" />}
    </svg>
  );
}
