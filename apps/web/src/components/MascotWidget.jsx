import React, { useState, useEffect, useRef } from 'react';
 
const SIGNS = [
  { id: 'instagram', line1: '📸 Follow Us', line2: 'Instagram', bg: '#E1306C', color: '#fff', href: 'https://www.instagram.com/atlascafefoodbar/' },
  { id: 'google',    line1: '⭐ Rate Us',   line2: 'Google',    bg: '#4285F4', color: '#fff', href: 'https://share.google/gx9QBu5N87yWGipUd' },
];
 
// ── Faz listesi ──────────────────────────────────────────────────
// falling → squash → standup → lookAround → pickUp → raising → holding
// → (10s idle) → tired → sleeping → waking → excited → raising → holding
 
export default function MascotWidget() {
  const [phase, setPhase]     = useState('falling');
  const [signIdx, setSignIdx] = useState(0);
  const [blink, setBlink]     = useState(false);
  const [zf, setZf]           = useState(0);       // zzz frame 0/1/2
  const [signAngle, setSignAngle] = useState(-2);  // pankart sallanma açısı
  const idleRef  = useRef(null);
  const cycleRef = useRef(null);
  const zRef     = useRef(null);
  const waveRef  = useRef(null);
 
  // Göz kırpma
  useEffect(() => {
    const t = setInterval(() => {
      if (!['sleeping','waking','squash'].includes(phase)) {
        setBlink(true); setTimeout(() => setBlink(false), 120);
      }
    }, 2600);
    return () => clearInterval(t);
  }, [phase]);
 
  // Pankart + eller birlikte sallanma
  useEffect(() => {
    if (phase === 'holding') {
      waveRef.current = setInterval(() => {
        setSignAngle(a => a === -2 ? 3 : -2);
      }, 900);
    } else {
      clearInterval(waveRef.current);
      setSignAngle(-2);
    }
    return () => clearInterval(waveRef.current);
  }, [phase]);
 
  // ZZZ
  useEffect(() => {
    if (phase === 'sleeping') {
      zRef.current = setInterval(() => setZf(p => (p + 1) % 3), 650);
    } else {
      clearInterval(zRef.current); setZf(0);
    }
    return () => clearInterval(zRef.current);
  }, [phase]);
 
  // ── Sahne akışı ──────────────────────────────────────────────
  const go = (p, delay = 0) => delay ? setTimeout(() => setPhase(p), delay) : setPhase(p);
 
  const resetIdle = () => {
    clearTimeout(idleRef.current);
    idleRef.current = setTimeout(() => {
      clearTimeout(cycleRef.current);
      go('lowering');
      setTimeout(() => {
        go('sleeping');
        setTimeout(() => {
          go('waking');
          setTimeout(() => {
            go('excited');
            setTimeout(() => {
              go('pickUp');
              setTimeout(() => { go('raising'); setTimeout(() => { go('holding'); resetIdle(); startCycle(); }, 600); }, 700);
            }, 600);
          }, 1200);
        }, 5000);
      }, 500);
    }, 10000);
  };
 
  const startCycle = () => {
    clearTimeout(cycleRef.current);
    cycleRef.current = setTimeout(() => {
      go('lowering');
      setTimeout(() => {
        setSignIdx(p => (p + 1) % SIGNS.length);
        go('raising');
        setTimeout(() => { go('holding'); resetIdle(); startCycle(); }, 600);
      }, 500);
    }, 4500);
  };
 
  // Başlangıç sekansı: fall → squash → standup → lookAround → pickUp → raising → holding
  useEffect(() => {
    go('falling');
    setTimeout(() => go('squash'),    600);
    setTimeout(() => go('standup'),  1200);
    setTimeout(() => go('lookAround'), 1700);
    setTimeout(() => go('pickUp'),   3200);
    setTimeout(() => go('raising'),  3900);
    setTimeout(() => { go('holding'); resetIdle(); startCycle(); }, 4600);
    return () => { clearTimeout(idleRef.current); clearTimeout(cycleRef.current); clearInterval(zRef.current); clearInterval(waveRef.current); };
  }, []);
 
  const handleClick = () => {
    if (phase === 'sleeping' || phase === 'waking') {
      clearTimeout(idleRef.current); clearTimeout(cycleRef.current);
      go('excited');
      setTimeout(() => go('pickUp'), 600);
      setTimeout(() => go('raising'), 1300);
      setTimeout(() => { go('holding'); resetIdle(); startCycle(); }, 2000);
      return;
    }
    if (phase === 'holding') { resetIdle(); window.open(SIGNS[signIdx].href, '_blank'); }
  };
 
  // ── Derived ──────────────────────────────────────────────────
  const isFalling  = phase === 'falling';
  const isSquash   = phase === 'squash';
  const isLooking  = phase === 'lookAround';
  const isSleeping = phase === 'sleeping';
  const isWaking   = phase === 'waking';
  const isExcited  = phase === 'excited';
  const isPickUp   = phase === 'pickUp';
  const signUp     = phase === 'holding';
  const armsUp     = phase === 'raising' || phase === 'holding' || phase === 'lowering';
 
  const asleep = isSleeping || isWaking;
  const sign = SIGNS[signIdx];
 
  // Gövde eğimi (uyku)
  const bodyTilt = isSleeping ? 22 : isWaking ? 10 : 0;
  // Karakter Y (düşme)
  const fallY = isFalling ? -180 : 0;
  // Squash scale
  const scaleY = isSquash ? 0.82 : 1;
  const scaleX = isSquash ? 1.18 : 1;
  // Zıplama
  const jumpY = isExcited ? -14 : 0;
  // Baş sola/sağa bakma offseti
  const headX = isLooking ? -4 : 0;
 
  // Kollar: armsUp → yukarı (eller sopa tutacak konumda)
  // Sol omuz: (32,132), sopa sol: (43,88)
  // Sağ omuz: (68,132), sopa sağ: (57,88)
  // Aşağıda: sol (16,155), sağ (84,155)
  // pickUp: eller yerde (sol:30,175) (sağ:70,175) sonra yukarı
  const lx2 = isPickUp ? 30 : armsUp ? 43 : 16;
  const ly2 = isPickUp ? 175 : armsUp ? 88 : 155;
  const rx2 = isPickUp ? 70 : armsUp ? 57 : 84;
  const ry2 = isPickUp ? 175 : armsUp ? 88 : 155;
 
  // Pankart + eller aynı açıda döner
  const waveTransform = `rotate(${signAngle}deg)`;
 
  return (
    <div onClick={handleClick} style={{
      position: 'fixed', bottom: 0, right: 0, zIndex: 9999,
      width: '50px', height: '110px',
      cursor: phase === 'holding' ? 'pointer' : 'default',
      userSelect: 'none', WebkitTapHighlightColor: 'transparent',
    }}>
      <svg width="50" height="110" viewBox="0 0 100 220"
        xmlns="http://www.w3.org/2000/svg" overflow="visible"
        style={{
          transform: `translateY(${fallY + jumpY}px) scaleX(${scaleX}) scaleY(${scaleY})`,
          transformOrigin: 'bottom center',
          transition: isFalling
            ? 'transform 0.55s cubic-bezier(0.34,1.2,0.64,1)'
            : 'transform 0.4s cubic-bezier(0.34,1.2,0.64,1)',
        }}>
 
        {/* ── Tüm gövde eğimi (uyku) ── */}
        <g style={{
          transformOrigin: '50px 210px',
          transform: `rotate(${bodyTilt}deg)`,
          transition: 'transform 0.8s cubic-bezier(0.25,1,0.5,1)',
        }}>
 
          {/* ════ PANKART + ELLER — aynı g içinde, birlikte sallanır ════ */}
          <g style={{
            transformOrigin: '50px 88px',
            transform: signUp ? waveTransform : 'rotate(0deg)',
            transition: 'transform 0.5s ease',
          }}>
            {/* Pankart grubu */}
            <g style={{
              opacity: signUp ? 1 : 0,
              transform: signUp ? 'translateY(0)' : 'translateY(40px)',
              transition: 'opacity 0.35s ease, transform 0.5s cubic-bezier(0.34,1.56,0.64,1)',
            }}>
              {/* Tabela */}
              <rect x="14" y="4" width="72" height="36" rx="5" fill={sign.bg}/>
              <rect x="14" y="4" width="72" height="36" rx="5" fill="none" stroke="rgba(255,255,255,0.28)" strokeWidth="1.5"/>
              <text x="50" y="19" textAnchor="middle" fontSize="9" fontWeight="800"
                fill={sign.color} fontFamily="DM Sans,sans-serif">{sign.line1}</text>
              <text x="50" y="32" textAnchor="middle" fontSize="10" fontWeight="900"
                fill={sign.color} fontFamily="DM Sans,sans-serif">{sign.line2}</text>
              {/* Sopa */}
              <line x1="50" y1="40" x2="50" y2="88"
                stroke="#5C3418" strokeWidth="3.5" strokeLinecap="round"/>
            </g>
 
            {/* Sol el — sopa üstünde, (43,88) */}
            <circle cx="43" cy="88" r="5"
              fill="#E8B88A"
              style={{
                transform: armsUp ? 'translateY(0)' : 'translateY(67px) translateX(-27px)',
                transition: 'transform 0.5s cubic-bezier(0.34,1.56,0.64,1)',
              }}
            />
            {/* Sağ el — sopa üstünde, (57,88) */}
            <circle cx="57" cy="88" r="5"
              fill="#E8B88A"
              style={{
                transform: armsUp ? 'translateY(0)' : 'translateY(67px) translateX(27px)',
                transition: 'transform 0.5s cubic-bezier(0.34,1.56,0.64,1)',
              }}
            />
          </g>
 
          {/* ════ KARAKTER ════ */}
 
          {/* Bacaklar */}
          <line x1="41" y1="166" x2="37" y2="188" stroke="#5C3418" strokeWidth="6" strokeLinecap="round"/>
          <line x1="59" y1="166" x2="63" y2="188" stroke="#5C3418" strokeWidth="6" strokeLinecap="round"/>
          <ellipse cx="35" cy="190" rx="7" ry="3.5" fill="#2C1A0E"/>
          <ellipse cx="65" cy="190" rx="7" ry="3.5" fill="#2C1A0E"/>
 
          {/* Pantolon */}
          <rect x="32" y="152" width="36" height="17" rx="5" fill="#5C3418"/>
          <line x1="50" y1="152" x2="50" y2="169" stroke="#4A2910" strokeWidth="1.5"/>
 
          {/* Gömlek */}
          <rect x="30" y="128" width="40" height="27" rx="7" fill="white" stroke="#e0e0e0" strokeWidth="1"/>
          {/* Yaka V */}
          <path d="M39,128 L50,138 L61,128" fill="none" stroke="#d0d0d0" strokeWidth="1.3"/>
          {/* Düğmeler */}
          <circle cx="50" cy="141" r="1.4" fill="#ccc"/>
          <circle cx="50" cy="148" r="1.4" fill="#ccc"/>
 
          {/* ── Sol kol (önde — z-order: kol, sonra gövde üstünde) ── */}
          <line x1="32" y1="133"
            x2={lx2} y2={ly2}
            stroke="white" strokeWidth="6.5" strokeLinecap="round"
            style={{ transition: 'x2 0.5s cubic-bezier(0.34,1.56,0.64,1), y2 0.5s cubic-bezier(0.34,1.56,0.64,1)' }}
          />
          <line x1="32" y1="133"
            x2={lx2} y2={ly2}
            stroke="#e8e8e8" strokeWidth="5" strokeLinecap="round"
            style={{ transition: 'x2 0.5s cubic-bezier(0.34,1.56,0.64,1), y2 0.5s cubic-bezier(0.34,1.56,0.64,1)' }}
          />
 
          {/* ── Sağ kol ── */}
          <line x1="68" y1="133"
            x2={rx2} y2={ry2}
            stroke="white" strokeWidth="6.5" strokeLinecap="round"
            style={{ transition: 'x2 0.5s cubic-bezier(0.34,1.56,0.64,1), y2 0.5s cubic-bezier(0.34,1.56,0.64,1)' }}
          />
          <line x1="68" y1="133"
            x2={rx2} y2={ry2}
            stroke="#e8e8e8" strokeWidth="5" strokeLinecap="round"
            style={{ transition: 'x2 0.5s cubic-bezier(0.34,1.56,0.64,1), y2 0.5s cubic-bezier(0.34,1.56,0.64,1)' }}
          />
 
          {/* ── KAFA ── */}
          <g style={{
            transform: `translateX(${headX}px)`,
            transition: 'transform 0.4s ease',
          }}>
            {/* Kafa taban */}
            <circle cx="50" cy="105" r="20" fill="#E8B88A"/>
 
            {/* Kulaklar */}
            <ellipse cx="30" cy="105" rx="4" ry="5" fill="#E8B88A"/>
            <ellipse cx="70" cy="105" rx="4" ry="5" fill="#E8B88A"/>
            <ellipse cx="30" cy="105" rx="2.5" ry="3.5" fill="#D4946A"/>
            <ellipse cx="70" cy="105" rx="2.5" ry="3.5" fill="#D4946A"/>
 
            {/* ── SAÇ — dolgun, kelli değil ── */}
            {/* Saç tabanı — kafanın üst yarısını tamamen kapatır */}
            <path d="M30,105 Q30,82 50,80 Q70,82 70,105"
              fill="#3D2B1F"/>
            {/* Saç doluluğu — yan saçlar */}
            <ellipse cx="50" cy="84" rx="21" ry="14" fill="#3D2B1F"/>
            {/* Saç detayı — hafif dalgalı üst */}
            <path d="M29,100 Q32,86 40,82 Q50,78 60,82 Q68,86 71,100"
              fill="#3D2B1F"/>
            {/* Saç alt kenarı — alın çizgisi */}
            <path d="M30,100 Q35,96 50,95 Q65,96 70,100"
              fill="#E8B88A"/>
            {/* Saç çizgileri (detay) */}
            <path d="M38,83 Q42,88 40,94" fill="none" stroke="#2C1A0E" strokeWidth="0.8" opacity="0.5"/>
            <path d="M50,80 Q50,86 50,93" fill="none" stroke="#2C1A0E" strokeWidth="0.8" opacity="0.5"/>
            <path d="M62,83 Q58,88 60,94" fill="none" stroke="#2C1A0E" strokeWidth="0.8" opacity="0.5"/>
 
            {/* ── GÖZLER ── */}
            {asleep ? (
              <>
                <path d="M39,107 Q42,103 45,107" fill="none" stroke="#3D2B1F" strokeWidth="2.2" strokeLinecap="round"/>
                <path d="M55,107 Q58,103 61,107" fill="none" stroke="#3D2B1F" strokeWidth="2.2" strokeLinecap="round"/>
                {/* Kirpik */}
                <line x1="39" y1="107" x2="37" y2="105" stroke="#3D2B1F" strokeWidth="1.2"/>
                <line x1="45" y1="107" x2="47" y2="105" stroke="#3D2B1F" strokeWidth="1.2"/>
                <line x1="55" y1="107" x2="53" y2="105" stroke="#3D2B1F" strokeWidth="1.2"/>
                <line x1="61" y1="107" x2="63" y2="105" stroke="#3D2B1F" strokeWidth="1.2"/>
              </>
            ) : isSquash ? (
              // Başı dönmüş gözler
              <>
                <text x="39" y="111" fontSize="9" fill="#3D2B1F" textAnchor="middle">×</text>
                <text x="61" y="111" fontSize="9" fill="#3D2B1F" textAnchor="middle">×</text>
              </>
            ) : blink ? (
              <>
                <line x1="38" y1="107" x2="46" y2="107" stroke="#3D2B1F" strokeWidth="2.2" strokeLinecap="round"/>
                <line x1="54" y1="107" x2="62" y2="107" stroke="#3D2B1F" strokeWidth="2.2" strokeLinecap="round"/>
              </>
            ) : (
              <>
                {/* Göz beyazı */}
                <ellipse cx="42" cy="107" rx="5" ry="5.5" fill="white"/>
                <ellipse cx="58" cy="107" rx="5" ry="5.5" fill="white"/>
                {/* Yeşil iris */}
                <circle cx="42" cy="107" r="3.8" fill="#2e9455"/>
                <circle cx="58" cy="107" r="3.8" fill="#2e9455"/>
                {/* Göz bebeği */}
                <circle cx="42" cy="107" r="2.2" fill="#111"/>
                <circle cx="58" cy="107" r="2.2" fill="#111"/>
                {/* Parlaklık */}
                <circle cx="43.2" cy="105.5" r="1" fill="white"/>
                <circle cx="59.2" cy="105.5" r="1" fill="white"/>
                {/* Üst kirpik */}
                <path d="M37,104 Q42,102 47,104" fill="none" stroke="#3D2B1F" strokeWidth="1.2" strokeLinecap="round"/>
                <path d="M53,104 Q58,102 63,104" fill="none" stroke="#3D2B1F" strokeWidth="1.2" strokeLinecap="round"/>
              </>
            )}
 
            {/* Kaşlar */}
            {isExcited && (
              <>
                <path d="M37,101 Q42,98 47,101" fill="none" stroke="#3D2B1F" strokeWidth="1.8" strokeLinecap="round"/>
                <path d="M53,101 Q58,98 63,101" fill="none" stroke="#3D2B1F" strokeWidth="1.8" strokeLinecap="round"/>
              </>
            )}
 
            {/* Burun */}
            <ellipse cx="50" cy="113" rx="3" ry="2.2" fill="#D4946A"/>
            <ellipse cx="48.5" cy="113" rx="1.2" ry="1" fill="#C4836A" opacity="0.6"/>
            <ellipse cx="51.5" cy="113" rx="1.2" ry="1" fill="#C4836A" opacity="0.6"/>
 
            {/* Ağız */}
            <path d={
              isSquash
                ? 'M44,119 Q50,116 56,119'
                : asleep
                ? 'M46,119 Q50,118 54,119'
                : isExcited
                ? 'M43,118 Q50,124 57,118'
                : 'M44,118 Q50,122 56,118'
            } fill="none" stroke="#5C3418" strokeWidth="2" strokeLinecap="round"/>
 
            {/* Yanak allığı */}
            <ellipse cx="35" cy="114" rx="5" ry="3.5" fill="#F4A0A0" opacity="0.35"/>
            <ellipse cx="65" cy="114" rx="5" ry="3.5" fill="#F4A0A0" opacity="0.35"/>
 
            {/* Salya (uyku) */}
            {isSleeping && (
              <path d="M56,120 Q59,125 57,129" fill="none" stroke="#B8D4F0" strokeWidth="2" strokeLinecap="round" opacity="0.8"/>
            )}
 
            {/* Yıldızlar (çarpma) */}
            {isSquash && (
              <>
                <text x="26" y="90" fontSize="9" fill="#F5C842">✦</text>
                <text x="66" y="88" fontSize="8" fill="#F5C842" opacity="0.8">✦</text>
                <text x="46" y="83" fontSize="11" fill="#F5C842">✦</text>
              </>
            )}
          </g>
 
          {/* ── ZZZ ── */}
          {isSleeping && (
            <>
              <text x="68" y="92" fontSize="10" fontWeight="bold" fill="#6B8FD4"
                opacity={zf === 0 ? 1 : 0.1} style={{ transition: 'opacity 0.3s' }}>z</text>
              <text x="75" y="81" fontSize="13" fontWeight="bold" fill="#6B8FD4"
                opacity={zf === 1 ? 1 : 0.1} style={{ transition: 'opacity 0.3s' }}>z</text>
              <text x="83" y="68" fontSize="16" fontWeight="bold" fill="#6B8FD4"
                opacity={zf === 2 ? 1 : 0.1} style={{ transition: 'opacity 0.3s' }}>z</text>
            </>
          )}
 
        </g>
      </svg>
    </div>
  );
}
