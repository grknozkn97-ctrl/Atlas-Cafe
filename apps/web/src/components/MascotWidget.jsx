import React, { useState, useEffect, useRef } from 'react';
 
const SIGNS = [
  {
    id: 'instagram',
    line1: '📸 Follow Us',
    line2: 'Instagram',
    bg: '#E1306C',
    color: '#fff',
    href: 'https://instagram.com/atlascafe.me',
  },
  {
    id: 'google',
    line1: '⭐ Rate Us',
    line2: 'Google',
    bg: '#4285F4',
    color: '#fff',
    href: 'https://share.google/gx9QBu5N87yWGipUd',
  },
];
 
/*
  Koordinat planı (viewBox="0 0 100 220"):
  
  PANKART:
    Tabela:  x=15..85, y=10..45  (yükseklik 35, genişlik 70)
    Sopa:    x=50, y=45..90      (sopa aşağı uzanır)
  
  KARAKTER (pankart tutunca eller sopanın ~y=88 noktasına gider):
    Kafa merkezi: cx=50, cy=120, r=18
    Gövde:        x=35..65, y=138..165
    Sol omuz:     (35, 142)
    Sağ omuz:     (65, 142)
    Sol el ucu (yukarı): kol ~45px → (23, 90)  ← sopanın sol tarafı
    Sağ el ucu (yukarı): kol ~45px → (77, 90)  ← sopanın sağ tarafı
    Bacaklar:     y=165..185
*/
 
export default function MascotWidget() {
  const [phase, setPhase] = useState('falling');
  const [signIdx, setSignIdx] = useState(0);
  const [eyeBlink, setEyeBlink] = useState(false);
  const [zFrame, setZFrame] = useState(0);
  const idleRef  = useRef(null);
  const cycleRef = useRef(null);
  const zRef     = useRef(null);
 
  // Göz kırpma
  useEffect(() => {
    const t = setInterval(() => {
      if (phase !== 'sleeping' && phase !== 'waking') {
        setEyeBlink(true);
        setTimeout(() => setEyeBlink(false), 130);
      }
    }, 2800);
    return () => clearInterval(t);
  }, [phase]);
 
  // ZZZ
  useEffect(() => {
    if (phase === 'sleeping') {
      zRef.current = setInterval(() => setZFrame(p => (p + 1) % 3), 650);
    } else {
      clearInterval(zRef.current);
    }
    return () => clearInterval(zRef.current);
  }, [phase]);
 
  const resetIdle = () => {
    clearTimeout(idleRef.current);
    idleRef.current = setTimeout(() => {
      clearTimeout(cycleRef.current);
      // pankartı indir
      setPhase('lowering');
      setTimeout(() => {
        // uyu
        setPhase('sleeping');
        setTimeout(() => {
          // yavaş kalk
          setPhase('waking');
          setTimeout(() => {
            setPhase('excited');
            setTimeout(() => {
              setPhase('raising');
              setTimeout(() => {
                setPhase('holding');
                resetIdle();
                startCycle();
              }, 700);
            }, 700);
          }, 1500);
        }, 3000);
      }, 500);
    }, 10000);
  };
 
  const startCycle = () => {
    clearTimeout(cycleRef.current);
    cycleRef.current = setTimeout(() => {
      setPhase('lowering');
      setTimeout(() => {
        setSignIdx(p => (p + 1) % SIGNS.length);
        setPhase('raising');
        setTimeout(() => {
          setPhase('holding');
          resetIdle();
          startCycle();
        }, 700);
      }, 500);
    }, 4500);
  };
 
  useEffect(() => {
    const t1 = setTimeout(() => setPhase('standing'), 500);
    const t2 = setTimeout(() => {
      setPhase('raising');
      setTimeout(() => { setPhase('holding'); resetIdle(); startCycle(); }, 700);
    }, 1100);
    return () => {
      clearTimeout(t1); clearTimeout(t2);
      clearTimeout(idleRef.current); clearTimeout(cycleRef.current);
      clearInterval(zRef.current);
    };
  }, []);
 
  const handleClick = () => {
    if (phase === 'sleeping' || phase === 'waking') {
      clearTimeout(idleRef.current); clearTimeout(cycleRef.current);
      setPhase('excited');
      setTimeout(() => {
        setPhase('raising');
        setTimeout(() => { setPhase('holding'); resetIdle(); startCycle(); }, 700);
      }, 700);
      return;
    }
    if (phase === 'holding') {
      resetIdle();
      window.open(SIGNS[signIdx].href, '_blank');
    }
  };
 
  // ── State derived ───────────────────────────────────────────
  const isFalling  = phase === 'falling';
  const isSleeping = phase === 'sleeping';
  const isWaking   = phase === 'waking';
  const isExcited  = phase === 'excited';
  const armsUp     = phase === 'raising' || phase === 'holding';
  const signUp     = phase === 'holding';
  const asleep     = isSleeping || isWaking;
 
  // Gövde eğimi
  const tilt  = isSleeping ? 22 : isWaking ? 8 : 0;
  // Zıplama
  const jumpY = isExcited ? -14 : 0;
  // Düşme
  const fallY = isFalling ? -220 : 0;
 
  const sign = SIGNS[signIdx];
 
  // ── Kol uç koordinatları (SVG içi, omuz bazlı) ───────────────
  // Sol omuz: (35, 142). Kolun boyu 52px.
  // Yukarı: açı -130° (sola-yukarı) → uç ≈ (35 + 52*cos(-130°), 142 + 52*sin(-130°))
  //   cos(-130°)≈-0.643, sin(-130°)≈-0.766 → (35-33, 142-40) = (2, 102)... biraz geniş
  // Daha basit: elle belirle.
  // Eller sopanın iki yanında buluşsun: sol el (40, 90), sağ el (60, 90)
  // Sol omuz (35,142) → sol el (40,90): Δx=5, Δy=-52 → kol açısı = atan2(-52,5)≈-84°
  // Sağ omuz (65,142) → sağ el (60,90): Δx=-5, Δy=-52 → kol açısı = atan2(-52,-5)≈-96° (yani ~96° soldan)
 
  // Kollar aşağıda:
  // Sol omuz (35,142) → sol el (18,162): Δx=-17, Δy=20
  // Sağ omuz (65,142) → sağ el (82,162)
 
  return (
    <div
      onClick={handleClick}
      style={{
        position: 'fixed',
        bottom: 8,
        right: 8,
        zIndex: 9999,
        width: '100px',
        height: '220px',
        cursor: phase === 'holding' ? 'pointer' : 'default',
        userSelect: 'none',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      <svg
        width="100"
        height="220"
        viewBox="0 0 100 220"
        xmlns="http://www.w3.org/2000/svg"
        overflow="visible"
        style={{
          transform: `translateY(${fallY + jumpY}px)`,
          transition: isFalling
            ? 'transform 0.6s cubic-bezier(0.34,1.2,0.64,1)'
            : 'transform 0.35s ease',
        }}
      >
        {/* ── Tüm gövde: uyku eğimi ── */}
        <g style={{
          transformOrigin: '50px 210px',
          transform: `rotate(${tilt}deg)`,
          transition: 'transform 0.7s cubic-bezier(0.25,1,0.5,1)',
        }}>
 
          {/* ════ PANKART ════
              Tabela: y=5..42, sopa: y=42..90
              Eller sopanın alt ucuna (y≈88) temas eder
          */}
          <g style={{
            opacity: signUp ? 1 : 0,
            transform: signUp ? 'translateY(0px)' : 'translateY(35px)',
            transition: 'opacity 0.4s ease, transform 0.55s cubic-bezier(0.34,1.56,0.64,1)',
            animation: signUp ? 'signWave 3.5s ease-in-out infinite' : 'none',
          }}>
            {/* Tabela */}
            <rect x="14" y="5" width="72" height="37" rx="5"
              fill={sign.bg} />
            <rect x="14" y="5" width="72" height="37" rx="5"
              fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" />
            <text x="50" y="21" textAnchor="middle"
              fontSize="9.5" fontWeight="800" fill={sign.color}
              fontFamily="DM Sans,sans-serif">
              {sign.line1}
            </text>
            <text x="50" y="34" textAnchor="middle"
              fontSize="10.5" fontWeight="900" fill={sign.color}
              fontFamily="DM Sans,sans-serif" letterSpacing="0.3">
              {sign.line2}
            </text>
            {/* Sopa */}
            <line x1="50" y1="42" x2="50" y2="90"
              stroke="hsl(24,45%,28%)" strokeWidth="3.5" strokeLinecap="round" />
          </g>
 
          {/* ════ KARAKTER ════ */}
 
          {/* Bacaklar */}
          <line x1="41" y1="166" x2="37" y2="188"
            stroke="hsl(25,50%,28%)" strokeWidth="6" strokeLinecap="round" />
          <line x1="59" y1="166" x2="63" y2="188"
            stroke="hsl(25,50%,28%)" strokeWidth="6" strokeLinecap="round" />
          {/* Ayakkabılar */}
          <ellipse cx="36" cy="190" rx="7" ry="4" fill="hsl(24,15%,18%)" />
          <ellipse cx="64" cy="190" rx="7" ry="4" fill="hsl(24,15%,18%)" />
 
          {/* Pantolon (kahverengi) */}
          <rect x="32" y="153" width="36" height="16" rx="5"
            fill="hsl(25,50%,28%)" />
          <line x1="50" y1="153" x2="50" y2="169"
            stroke="hsl(25,40%,20%)" strokeWidth="1.5" />
 
          {/* Gömlek (beyaz) */}
          <rect x="30" y="130" width="40" height="26" rx="7"
            fill="white" stroke="hsl(0,0%,86%)" strokeWidth="1" />
          {/* Düğmeler */}
          <circle cx="50" cy="136" r="1.4" fill="hsl(0,0%,72%)" />
          <circle cx="50" cy="143" r="1.4" fill="hsl(0,0%,72%)" />
          <circle cx="50" cy="150" r="1.4" fill="hsl(0,0%,72%)" />
          {/* Yaka */}
          <path d="M40,130 L50,138 L60,130"
            fill="none" stroke="hsl(0,0%,80%)" strokeWidth="1.3" />
 
          {/* ── SOL KOL ──
              Omuz: (32, 135)
              Yukarı el: (40, 90) — sopanın sol yanı
              Aşağı el:  (14, 158)
          */}
          <line
            x1="32" y1="135"
            x2={armsUp ? 41 : 14}
            y2={armsUp ? 90 : 158}
            stroke="white" strokeWidth="6" strokeLinecap="round"
            style={{ transition: 'x2 0.5s cubic-bezier(0.34,1.56,0.64,1), y2 0.5s cubic-bezier(0.34,1.56,0.64,1)' }}
          />
          <line
            x1="32" y1="135"
            x2={armsUp ? 41 : 14}
            y2={armsUp ? 90 : 158}
            stroke="hsl(0,0%,88%)" strokeWidth="5" strokeLinecap="round"
            style={{ transition: 'x2 0.5s cubic-bezier(0.34,1.56,0.64,1), y2 0.5s cubic-bezier(0.34,1.56,0.64,1)' }}
          />
          {/* Sol el */}
          <circle
            cx={armsUp ? 41 : 14}
            cy={armsUp ? 90 : 158}
            r="4.5"
            fill="hsl(30,60%,72%)"
            style={{ transition: 'cx 0.5s cubic-bezier(0.34,1.56,0.64,1), cy 0.5s cubic-bezier(0.34,1.56,0.64,1)' }}
          />
 
          {/* ── SAĞ KOL ──
              Omuz: (68, 135)
              Yukarı el: (59, 90) — sopanın sağ yanı
              Aşağı el:  (86, 158)
          */}
          <line
            x1="68" y1="135"
            x2={armsUp ? 59 : 86}
            y2={armsUp ? 90 : 158}
            stroke="white" strokeWidth="6" strokeLinecap="round"
            style={{ transition: 'x2 0.5s cubic-bezier(0.34,1.56,0.64,1), y2 0.5s cubic-bezier(0.34,1.56,0.64,1)' }}
          />
          <line
            x1="68" y1="135"
            x2={armsUp ? 59 : 86}
            y2={armsUp ? 90 : 158}
            stroke="hsl(0,0%,88%)" strokeWidth="5" strokeLinecap="round"
            style={{ transition: 'x2 0.5s cubic-bezier(0.34,1.56,0.64,1), y2 0.5s cubic-bezier(0.34,1.56,0.64,1)' }}
          />
          {/* Sağ el */}
          <circle
            cx={armsUp ? 59 : 86}
            cy={armsUp ? 90 : 158}
            r="4.5"
            fill="hsl(30,60%,72%)"
            style={{ transition: 'cx 0.5s cubic-bezier(0.34,1.56,0.64,1), cy 0.5s cubic-bezier(0.34,1.56,0.64,1)' }}
          />
 
          {/* ── KAFA ── cx=50, cy=108, r=20 */}
          <circle cx="50" cy="108" r="20" fill="hsl(30,60%,75%)" />
 
          {/* Saç */}
          <path d="M30,102 Q38,84 50,88 Q62,84 70,102"
            fill="hsl(24,40%,22%)" />
          <rect x="29" y="100" width="42" height="8" rx="4"
            fill="hsl(24,40%,22%)" />
 
          {/* ── GÖZLER — cx=50, cy=108 ── */}
          {asleep ? (
            // Uyku: kapalı yay
            <>
              <path d="M38,108 Q41,105 44,108"
                fill="none" stroke="hsl(24,10%,20%)" strokeWidth="2.3" strokeLinecap="round" />
              <path d="M56,108 Q59,105 62,108"
                fill="none" stroke="hsl(24,10%,20%)" strokeWidth="2.3" strokeLinecap="round" />
            </>
          ) : eyeBlink ? (
            <>
              <line x1="37" y1="108" x2="44" y2="108"
                stroke="hsl(24,10%,20%)" strokeWidth="2.3" strokeLinecap="round" />
              <line x1="56" y1="108" x2="63" y2="108"
                stroke="hsl(24,10%,20%)" strokeWidth="2.3" strokeLinecap="round" />
            </>
          ) : (
            <>
              {/* Yeşil iris */}
              <circle cx="41" cy="108" r="4.5" fill="#2e9455" />
              <circle cx="59" cy="108" r="4.5" fill="#2e9455" />
              {/* Göz bebeği */}
              <circle cx="41" cy="108" r="2.5" fill="#111" />
              <circle cx="59" cy="108" r="2.5" fill="#111" />
              {/* Parlaklık */}
              <circle cx="42.2" cy="106.8" r="1.1" fill="white" />
              <circle cx="60.2" cy="106.8" r="1.1" fill="white" />
            </>
          )}
 
          {/* Kaşlar (heyecan) */}
          {isExcited && (
            <>
              <path d="M36,102 Q41,99 46,102"
                fill="none" stroke="hsl(24,40%,22%)" strokeWidth="1.8" strokeLinecap="round" />
              <path d="M54,102 Q59,99 64,102"
                fill="none" stroke="hsl(24,40%,22%)" strokeWidth="1.8" strokeLinecap="round" />
            </>
          )}
 
          {/* Burun */}
          <ellipse cx="50" cy="113" rx="2.5" ry="2"
            fill="hsl(24,40%,58%)" />
 
          {/* ── AĞIZ — kafa cy=108, r=20, ağız y≈119 ── */}
          <path
            d={asleep
              ? 'M44,119 Q50,118 56,119'   // hafif açık
              : isExcited
              ? 'M43,118 Q50,124 57,118'   // geniş gülümseme
              : 'M44,118 Q50,122 56,118'}  // normal
            fill="none"
            stroke="hsl(24,10%,22%)"
            strokeWidth="2"
            strokeLinecap="round"
          />
 
          {/* Yanak */}
          <ellipse cx="36" cy="115" rx="4.5" ry="3"
            fill="hsl(0,60%,78%)" opacity="0.38" />
          <ellipse cx="64" cy="115" rx="4.5" ry="3"
            fill="hsl(0,60%,78%)" opacity="0.38" />
 
          {/* ── ZZZ ── */}
          {isSleeping && (
            <>
              <text x="66" y="96" fontSize="10" fontWeight="bold"
                fill="hsl(220,65%,62%)" fontFamily="DM Sans,sans-serif"
                opacity={zFrame === 0 ? 1 : 0.15}
                style={{ transition: 'opacity 0.35s' }}>z</text>
              <text x="73" y="86" fontSize="13" fontWeight="bold"
                fill="hsl(220,65%,62%)" fontFamily="DM Sans,sans-serif"
                opacity={zFrame === 1 ? 1 : 0.15}
                style={{ transition: 'opacity 0.35s' }}>z</text>
              <text x="81" y="74" fontSize="16" fontWeight="bold"
                fill="hsl(220,65%,62%)" fontFamily="DM Sans,sans-serif"
                opacity={zFrame === 2 ? 1 : 0.15}
                style={{ transition: 'opacity 0.35s' }}>z</text>
            </>
          )}
 
        </g>{/* /tilt */}
      </svg>
 
      <style>{`
        @keyframes signWave {
          0%,100% { transform: translateY(0px) rotate(-2deg); }
          50%      { transform: translateY(-6px) rotate(2.5deg); }
        }
      `}</style>
    </div>
  );
}
