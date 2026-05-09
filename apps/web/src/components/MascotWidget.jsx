import React, { useState, useEffect, useRef } from 'react';

const SIGNS = [
  { id: 'instagram', line1: '📸 Fallow Me', line2: 'Instagram', bg: '#E1306C', color: '#fff', href: 'https://instagram.com/atlascafe.me' },
  { id: 'google',    line1: '⭐ Use Rate', line2: 'Google',    bg: '#4285F4', color: '#fff', href: 'https://share.google/gx9QBu5N87yWGipUd' },
];

export default function MascotWidget() {
  // Animasyon fazları
  const [phase, setPhase] = useState('falling');
  const [signIdx, setSignIdx] = useState(0);
  const [signAngle, setSignAngle] = useState(-2); 
  
  const sequenceRef = useRef(null);
  const idleRef = useRef(null);
  const waveRef = useRef(null);
  const zRef = useRef(null);
  const [zf, setZf] = useState(0);

  // ZZZ Efekti
  useEffect(() => {
    if (phase === 'sleeping') {
      zRef.current = setInterval(() => setZf(p => (p + 1) % 3), 600);
    } else {
      clearInterval(zRef.current); setZf(0);
    }
    return () => clearInterval(zRef.current);
  }, [phase]);

  // Pankart sallama
  useEffect(() => {
    if (phase === 'holding') {
      waveRef.current = setInterval(() => setSignAngle(a => a === -2 ? 3 : -2), 1000);
    } else {
      clearInterval(waveRef.current);
      setSignAngle(0);
    }
    return () => clearInterval(waveRef.current);
  }, [phase]);

  const go = (p) => setPhase(p);

  // 🎬 YÖNETMEN KOLTUĞU: Ana Hikaye Akışı
  const startSequence = () => {
    clearTimeout(sequenceRef.current);
    clearTimeout(idleRef.current);

    go('falling');                                  // 1. Düşüş
    setTimeout(() => go('crash'), 500);             // 2. Çarpma ve pankartı düşürme
    setTimeout(() => go('recovery'), 1200);         // 3. Yerde sersemlik
    setTimeout(() => go('standup'), 2200);          // 4. Ayağa kalkma
    setTimeout(() => go('lookLeft'), 3000);         // 5. Sola bak (Pankart nerede?)
    setTimeout(() => go('lookRight'), 4000);        // 6. Sağa bak
    setTimeout(() => go('spotSign'), 5000);         // 7. Pankartı gör (!)
    setTimeout(() => go('pickUp'), 5800);           // 8. Eğilip al
    setTimeout(() => go('raising'), 6500);          // 9. Doğrul
    setTimeout(() => { 
      go('holding');                                // 10. Salla
      startIdleTimer();                             // Sıkılma sayacını başlat
    }, 7200);
  };

  // ⏱ SIKILMA VE UYKU SAYACI
  const startIdleTimer = () => {
    clearTimeout(idleRef.current);
    idleRef.current = setTimeout(() => {
      go('bored');                                  // 10 sn sonra: Sıkılma (İç çekme)
      setTimeout(() => {
        go('walkingToCorner');                      // Köşeye yönelme
        setTimeout(() => {
          go('sleeping');                           // Yere yatıp uyuma
          
          // 5 Saniye Uyu, Sonra Uyan
          setTimeout(() => {
            go('waking');                           // Gözünü ovuşturarak uyanma
            setTimeout(() => {
              go('standup');                        // Kalk
              setSignIdx(p => (p + 1) % SIGNS.length); // Diğer tabelayı al
              setTimeout(() => go('pickUp'), 800);
              setTimeout(() => go('raising'), 1500);
              setTimeout(() => {
                go('holding');
                startIdleTimer();                   // Döngüyü tekrar başlat
              }, 2200);
            }, 1000);
          }, 5000); // 5 saniye uyku

        }, 800);
      }, 1000);
    }, 10000); // 10 saniye bekleme süresi
  };

  // İlk yüklemede hikayeyi başlat
  useEffect(() => {
    startSequence();
    return () => { clearTimeout(sequenceRef.current); clearTimeout(idleRef.current); };
  }, []);

  const handleClick = () => {
    if (phase === 'holding') {
      window.open(SIGNS[signIdx].href, '_blank');
    } else if (phase === 'sleeping' || phase === 'waking' || phase === 'bored') {
      // Uyurken tıklanırsa korkarak uyan ve hemen işe dön
      clearTimeout(idleRef.current);
      clearTimeout(sequenceRef.current);
      go('shocked');
      setTimeout(() => go('standup'), 600);
      setTimeout(() => go('pickUp'), 1100);
      setTimeout(() => go('raising'), 1600);
      setTimeout(() => { go('holding'); startIdleTimer(); }, 2100);
    }
  };

  // ── DURUM KONTROLLERİ (Derivations) ──────────────────────────
  const isFalling = phase === 'falling';
  const isCrash = phase === 'crash';
  const isRecovery = phase === 'recovery';
  const isStandup = phase === 'standup';
  const isLookLeft = phase === 'lookLeft';
  const isLookRight = phase === 'lookRight';
  const isSpotSign = phase === 'spotSign';
  const isPickUp = phase === 'pickUp';
  const isRaising = phase === 'raising';
  const isHolding = phase === 'holding';
  const isBored = phase === 'bored';
  const isSleeping = phase === 'sleeping';
  const isWaking = phase === 'waking';
  const isShocked = phase === 'shocked';
  const isWalking = phase === 'walkingToCorner';

  const signDropped = ['crash','recovery','standup','lookLeft','lookRight','spotSign','waking','shocked'].includes(phase);
  const bodyAsleep = isSleeping || isWalking;

  // ── DİNAMİK STİLLER & KOORDİNATLAR ──────────────────────────
  
  // Karakter Transformasyonu (Zıplama, Yatırma)
  let charY = 0; let charX = 0; let scaleY = 1; let scaleX = 1; let charRotate = 0;
  let transitionStyle = 'all 0.5s cubic-bezier(0.34, 1.3, 0.64, 1)';

  if (isFalling) { charY = -250; scaleY = 1.1; scaleX = 0.9; transitionStyle = 'all 0.5s ease-in'; }
  else if (isCrash) { charY = 15; scaleY = 0.6; scaleX = 1.4; transitionStyle = 'all 0.1s ease-out'; }
  else if (isRecovery) { charY = 5; scaleY = 0.95; }
  else if (isBored) { charY = 2; scaleY = 0.98; }
  else if (isWalking) { charX = -20; charY = 20; charRotate = -45; transitionStyle = 'all 0.8s ease-in'; }
  else if (isSleeping) { charX = -45; charY = 50; charRotate = -85; transitionStyle = 'all 1s ease'; }
  else if (isWaking) { charX = -30; charY = 30; charRotate = -40; }
  else if (isShocked) { charY = -20; scaleY = 1.1; transitionStyle = 'all 0.2s ease-out'; }

  // Baş Transformasyonu
  let headX = 0; let headY = 0; let headRotate = 0;
  if (isRecovery) { headY = 5; headRotate = 15; }
  if (isLookLeft) { headX = -8; headRotate = -10; }
  if (isLookRight) { headX = 10; headRotate = 15; }
  if (isSpotSign) { headX = 12; headY = -2; headRotate = 20; }
  if (isBored) { headY = 8; headRotate = -10; }
  if (isPickUp) { headX = 15; headY = 25; headRotate = 35; } // Eğilirken kafa da eğilir

  // Pankart Transformasyonu
  let signGroupStyle = {
    transform: isHolding ? `rotate(${signAngle}deg)` : 'rotate(0deg)',
    transition: 'transform 0.4s ease',
  };
  
  if (signDropped) {
    // Yerde durma pozisyonu
    signGroupStyle = { transform: 'translate(40px, 90px) rotate(80deg)', transition: 'all 0.5s cubic-bezier(0.2, 0.8, 0.2, 1)' };
  } else if (isPickUp) {
    // Eğilip alırken
    signGroupStyle = { transform: 'translate(20px, 60px) rotate(40deg)', transition: 'all 0.4s ease' };
  } else if (isBored || isWalking || bodyAsleep) {
    // Sıkılıp yanına bırakma
    signGroupStyle = { transform: 'translate(-30px, 100px) rotate(-70deg)', transition: 'all 0.8s ease' };
  } else if (isFalling || isRaising) {
    signGroupStyle = { transform: 'translate(0px, 0px) rotate(0deg)', transition: 'all 0.6s ease' };
  }

  // Kol Pozisyonları (Gerçekçi eğriler için Bezier yolları kullanıyoruz)
  // Sağ kol d="..."
  let rightArmPath = "M 66 128 Q 75 145, 60 88"; // Normal tutuş
  let leftArmPath = "M 34 128 Q 25 145, 40 88";  // Normal tutuş

  if (signDropped) {
    if (isRecovery) {
      rightArmPath = "M 66 128 Q 70 110, 55 100"; // Kafasını tutuyor
      leftArmPath = "M 34 128 Q 20 150, 30 180";  // Yerde destek
    } else if (isLookLeft || isLookRight) {
      rightArmPath = "M 66 128 Q 80 150, 75 160"; // Aşağıda serbest
      leftArmPath = "M 34 128 Q 20 150, 25 160";
    }
  }
  if (isPickUp) {
    rightArmPath = "M 66 135 Q 80 160, 95 190"; // Yere uzanıyor
    leftArmPath = "M 34 135 Q 50 170, 85 185";  // Yere uzanıyor
  }
  if (isBored) {
    rightArmPath = "M 66 128 Q 80 150, 70 170"; // Sarkık
    leftArmPath = "M 34 128 Q 20 150, 30 170";
  }
  if (bodyAsleep) {
    rightArmPath = "M 66 128 Q 80 120, 60 110"; // Uyurken yastık gibi
    leftArmPath = "M 34 128 Q 20 120, 40 110";
  }

  const sign = SIGNS[signIdx];

  return (
    <div style={{
      position: 'fixed', bottom: 20, right: 20, zIndex: 9999,
      width: '120px', height: '160px', // Animasyon alanı genişletildi
      cursor: isHolding ? 'pointer' : 'default',
      userSelect: 'none', WebkitTapHighlightColor: 'transparent',
    }} onClick={handleClick}>
      
      <svg width="100%" height="100%" viewBox="0 0 150 250" overflow="visible">
        <defs>
          <radialGradient id="skin" cx="50%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#FAD6B1" />
            <stop offset="100%" stopColor="#D99B6A" />
          </radialGradient>
          <linearGradient id="shirt" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="100%" stopColor="#E0E0E0" />
          </linearGradient>
          <filter id="shadow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feColorMatrix type="matrix" values="0 0 0 0 0   0 0 0 0 0   0 0 0 0 0  0 0 0 0.2 0"/>
            <feBlend in="SourceGraphic" in2="blurOut" mode="normal" />
          </filter>
        </defs>

        {/* ── ZEMİN GÖLGESİ ── */}
        <ellipse cx="60" cy="200" rx={isFalling ? 10 : 35} ry={isFalling ? 2 : 6} 
          fill="black" opacity={isFalling ? 0 : 0.25} style={{ transition: 'all 0.5s ease' }} />

        {/* ── ANA KARAKTER GRUBU ── */}
        <g style={{
          transform: `translate(${charX}px, ${charY}px) scale(${scaleX}, ${scaleY}) rotate(${charRotate}deg)`,
          transformOrigin: '60px 190px',
          transition: transitionStyle
        }}>

          {/* ── PANKART GRUBU (Bağımsız Hareket Edebilir) ── */}
          <g style={signGroupStyle}>
            {/* Pankart Zemin Göstergesi (Sadece yerdeyken) */}
            {signDropped && <ellipse cx="50" cy="80" rx="40" ry="10" fill="black" opacity="0.15" />}
            
            {/* Tabela */}
            <rect x="10" y="0" width="80" height="42" rx="6" fill={sign.bg} filter="url(#shadow)"/>
            <rect x="12" y="2" width="76" height="38" rx="4" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2"/>
            <text x="50" y="18" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#fff" opacity="0.9">{sign.line1}</text>
            <text x="50" y="34" textAnchor="middle" fontSize="13" fontWeight="900" fill={sign.color}>{sign.line2}</text>
            {/* Sopa */}
            <path d="M 48 42 L 48 88 L 52 88 L 52 42 Z" fill="#6F4E37"/>
            <path d="M 50 42 L 50 88" stroke="#4A3020" strokeWidth="1" opacity="0.6"/>

            {/* Eller (Sadece tutarken görünür) */}
            <g style={{ opacity: (signDropped || isBored || bodyAsleep || isPickUp) ? 0 : 1, transition: 'opacity 0.2s' }}>
              <circle cx="40" cy="84" r="6" fill="url(#skin)" stroke="#B8734A" strokeWidth="0.5"/>
              <circle cx="60" cy="84" r="6" fill="url(#skin)" stroke="#B8734A" strokeWidth="0.5"/>
            </g>
          </g>

          {/* ── VÜCUT ── */}
          {/* Sol Bacak */}
          <path d={isRecovery || bodyAsleep ? "M 48 160 Q 30 170, 25 185" : "M 48 160 Q 45 175, 42 190"} 
                fill="none" stroke="#2B1A10" strokeWidth="9" strokeLinecap="round" style={{ transition: 'all 0.4s' }}/>
          {/* Sağ Bacak */}
          <path d={isRecovery || bodyAsleep ? "M 52 160 Q 75 165, 80 185" : "M 52 160 Q 55 175, 58 190"} 
                fill="none" stroke="#2B1A10" strokeWidth="9" strokeLinecap="round" style={{ transition: 'all 0.4s' }}/>
          {/* Ayakkabılar */}
          <path d={isRecovery || bodyAsleep ? "M 20 185 Q 25 180, 30 185 Q 30 195, 20 195 Z" : "M 35 190 Q 42 185, 49 190 Q 49 198, 35 198 Z"} fill="#1A1A1A" style={{ transition: 'all 0.4s' }}/>
          <path d={isRecovery || bodyAsleep ? "M 75 185 Q 80 180, 85 185 Q 85 195, 75 195 Z" : "M 51 190 Q 58 185, 65 190 Q 65 198, 51 198 Z"} fill="#1A1A1A" style={{ transition: 'all 0.4s' }}/>

          {/* Gövde - Pantolon */}
          <path d="M 38 150 L 62 150 L 58 168 L 42 168 Z" fill="#2B1A10" stroke="#1A1A1A" strokeWidth="1"/>
          {/* Gövde - Gömlek (Gerçekçi Kıvrımlar) */}
          <path d={isPickUp ? "M 35 120 L 75 130 L 70 155 L 38 155 Z" : "M 32 120 L 68 120 L 63 152 L 37 152 Z"} 
                fill="url(#shirt)" filter="url(#shadow)" style={{ transition: 'all 0.4s' }}/>
          <path d="M 50 120 L 50 150" stroke="#CCCCCC" strokeWidth="1" strokeDasharray="3 2"/>

          {/* Sol Kol (Dinamik Bezier) */}
          <path d={leftArmPath} fill="none" stroke="url(#shirt)" strokeWidth="8" strokeLinecap="round" filter="url(#shadow)" style={{ transition: 'all 0.4s' }}/>
          {/* Sadece boşken eller */}
          {(signDropped || isBored || bodyAsleep || isPickUp) && (
            <circle cx="0" cy="0" r="5" fill="url(#skin)" style={{ offsetPath: `path('${leftArmPath}')`, offsetDistance: '100%', transition: 'all 0.4s' }}/>
          )}

          {/* Sağ Kol (Dinamik Bezier) */}
          <path d={rightArmPath} fill="none" stroke="url(#shirt)" strokeWidth="8" strokeLinecap="round" filter="url(#shadow)" style={{ transition: 'all 0.4s' }}/>
          {(signDropped || isBored || bodyAsleep || isPickUp) && (
            <circle cx="0" cy="0" r="5" fill="url(#skin)" style={{ offsetPath: `path('${rightArmPath}')`, offsetDistance: '100%', transition: 'all 0.4s' }}/>
          )}

          {/* ── KAFA GRUBU ── */}
          <g style={{
            transform: `translate(${headX}px, ${headY}px) rotate(${headRotate}deg)`,
            transformOrigin: '50px 115px',
            transition: 'all 0.4s ease'
          }}>
            {/* Boyun */}
            <rect x="46" y="112" width="8" height="12" fill="url(#skin)" />
            {/* Yüz Tabani */}
            <path d="M 30 100 Q 30 120, 50 120 Q 70 120, 70 100 Q 70 75, 50 75 Q 30 75, 30 100 Z" fill="url(#skin)" filter="url(#shadow)"/>
            
            {/* Kulaklar */}
            <ellipse cx="28" cy="100" rx="4" ry="6" fill="url(#skin)"/>
            <ellipse cx="72" cy="100" rx="4" ry="6" fill="url(#skin)"/>

            {/* Gerçekçi Saç */}
            <path d="M 28 95 Q 35 70, 50 68 Q 65 70, 72 95 Q 60 85, 50 88 Q 40 85, 28 95 Z" fill="#3D2314"/>
            <path d="M 45 68 Q 50 60, 55 68" fill="none" stroke="#3D2314" strokeWidth="3" strokeLinecap="round"/>

            {/* GÖZLER */}
            <g transform="translate(0, -2)">
              {isCrash || isRecovery ? (
                // Sersemlemiş Gözler (Spiraller)
                <g stroke="#3D2314" strokeWidth="1.5" fill="none">
                  <path d="M 38 102 Q 43 98, 43 103 Q 40 106, 38 102" />
                  <path d="M 58 102 Q 63 98, 63 103 Q 60 106, 58 102" />
                </g>
              ) : bodyAsleep || isBored ? (
                // Kapalı/Kısık Gözler
                <g stroke="#3D2314" strokeWidth="2" strokeLinecap="round" fill="none">
                  <path d="M 37 104 Q 41 106, 45 104" />
                  <path d="M 55 104 Q 59 106, 63 104" />
                </g>
              ) : isShocked || isSpotSign ? (
                // Şaşkın Gözler (Kocaman)
                <>
                  <circle cx="41" cy="102" r="5" fill="#FFF" stroke="#CCC" strokeWidth="0.5"/>
                  <circle cx="59" cy="102" r="5" fill="#FFF" stroke="#CCC" strokeWidth="0.5"/>
                  <circle cx="41" cy="102" r="2" fill="#111"/>
                  <circle cx="59" cy="102" r="2" fill="#111"/>
                </>
              ) : (
                // Normal Gözler (İris detaylı)
                <>
                  <path d="M 36 102 Q 41 98, 46 102 Q 41 106, 36 102 Z" fill="#FFF"/>
                  <path d="M 54 102 Q 59 98, 64 102 Q 59 106, 54 102 Z" fill="#FFF"/>
                  <circle cx={isLookLeft ? 39 : isLookRight ? 43 : 41} cy="102" r="2.5" fill="#2E6B4C"/>
                  <circle cx={isLookLeft ? 57 : isLookRight ? 61 : 59} cy="102" r="2.5" fill="#2E6B4C"/>
                  <circle cx={isLookLeft ? 39 : isLookRight ? 43 : 41} cy="102" r="1" fill="#111"/>
                  <circle cx={isLookLeft ? 57 : isLookRight ? 61 : 59} cy="102" r="1" fill="#111"/>
                </>
              )}
            </g>

            {/* Kaşlar */}
            <g stroke="#3D2314" strokeWidth="1.5" strokeLinecap="round" fill="none">
              {(isSpotSign || isShocked) ? (
                <> <path d="M 36 93 Q 41 89, 46 93" /> <path d="M 54 93 Q 59 89, 64 93" /> </>
              ) : isBored || isRecovery ? (
                <> <path d="M 36 96 L 46 98" /> <path d="M 54 98 L 64 96" /> </>
              ) : (
                <> <path d="M 36 96 Q 41 94, 46 96" /> <path d="M 54 96 Q 59 94, 64 96" /> </>
              )}
            </g>

            {/* Burun */}
            <path d="M 49 106 Q 52 108, 48 110" fill="none" stroke="#C28A62" strokeWidth="1.5" strokeLinecap="round"/>

            {/* Ağız */}
            <path d={
              isCrash || isRecovery ? "M 44 114 Q 50 110, 56 114" : // Üzgün
              isSpotSign || isShocked ? "M 46 114 Q 50 118, 54 114 Z" : // O harfi
              isBored || bodyAsleep ? "M 46 115 L 54 115" : // Düz
              "M 43 113 Q 50 118, 57 113" // Normal Gülümseme
            } fill={isSpotSign || isShocked ? "#5C3418" : "none"} stroke="#5C3418" strokeWidth="1.5" strokeLinecap="round"/>

            {/* Allık */}
            <ellipse cx="36" cy="108" rx="4" ry="2" fill="#FF8888" opacity="0.4" />
            <ellipse cx="64" cy="108" rx="4" ry="2" fill="#FF8888" opacity="0.4" />

            {/* Efektler (Bulduğunda Ünlem, Sersemlediğinde Yıldız) */}
            {isSpotSign && <text x="65" y="80" fontSize="20" fill="#FF3333" fontWeight="bold" style={{ animation: 'bounce 0.5s infinite' }}>!</text>}
            {isRecovery && <text x="25" y="80" fontSize="15" fill="#FFCC00">✨</text>}
            
            {/* Uyku Modu Salyası */}
            {isSleeping && <path d="M 54 115 Q 58 122, 55 128" fill="none" stroke="#ADD8E6" strokeWidth="1.5" opacity="0.8"/>}

          </g> {/* Kafa Sonu */}
        </g> {/* Karakter Ana Grup Sonu */}

        {/* ── ZZZ UYKU EFEKTİ ── */}
        {isSleeping && (
          <g fontSize="16" fontWeight="900" fill="#6B8FD4">
            <text x="75" y="60" opacity={zf === 0 ? 1 : 0.2}>Z</text>
            <text x="85" y="45" fontSize="20" opacity={zf === 1 ? 1 : 0.2}>Z</text>
            <text x="98" y="25" fontSize="26" opacity={zf === 2 ? 1 : 0.2}>Z</text>
          </g>
        )}

      </svg>
    </div>
  );
}
