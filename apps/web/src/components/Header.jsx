import React, { useEffect, useState } from 'react';
 
const WORDS = ['GOOD FOOD.', 'GOOD MOOD.'];
 
const Header = () => {
  const [wordIndex, setWordIndex] = useState(0);
  const [visible, setVisible] = useState(true);
 
  useEffect(() => {
    const cycle = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setWordIndex(prev => (prev + 1) % WORDS.length);
        setVisible(true);
      }, 400);
    }, 2200);
    return () => clearInterval(cycle);
  }, []);
 
  return (
    <header
      style={{
        width: '100%',
        height: '68px',
        backgroundColor: 'hsl(40, 33%, 98%)',
        borderBottom: '1px solid hsl(38, 20%, 85%)',
        display: 'flex',
        alignItems: 'center',
      }}
    >
      {/* 3 kolonlu grid — sol/orta/sağ eşit genişlikte → slogan gerçekten ortada */}
      <div
        style={{
          width: '100%',
          maxWidth: '1024px',
          margin: '0 auto',
          padding: '0 16px',
          display: 'grid',
          gridTemplateColumns: '1fr auto 1fr',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        {/* Sol: Logo */}
        <a
          href="/"
          style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', justifyContent: 'flex-start' }}
        >
          <img
            src="/Atlas Trspr.png"
            alt="Atlas Cafe"
            style={{ height: '52px', width: 'auto', objectFit: 'contain' }}
          />
        </a>
 
        {/* Orta: Slogan — grid sayesinde matematiksel olarak ortada */}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <span
            style={{
              fontFamily: 'Lora, serif',
              fontSize: 'clamp(13px, 2.8vw, 17px)',
              fontStyle: 'italic',
              fontWeight: '600',
              color: 'hsl(24, 45%, 35%)',
              letterSpacing: '0.06em',
              whiteSpace: 'nowrap',
              opacity: visible ? 1 : 0,
              transform: visible ? 'translateY(0px)' : 'translateY(-5px)',
              transition: 'opacity 0.4s ease, transform 0.4s ease',
              userSelect: 'none',
            }}
          >
            {WORDS[wordIndex]}
          </span>
        </div>
 
        {/* Sağ: Google Rating Pill */}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <a
            href="https://share.google/gx9QBu5N87yWGipUd"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              textDecoration: 'none',
              padding: '6px 12px',
              borderRadius: '100px',
              backgroundColor: '#fff',
              border: '1px solid hsl(38, 20%, 85%)',
              boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="#f5c842"
              style={{ width: '13px', height: '13px', flexShrink: 0 }}>
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <span style={{ fontSize: '12px', fontWeight: '600', color: 'hsl(24, 10%, 10%)', fontFamily: 'DM Sans, sans-serif', lineHeight: 1 }}>
              4.9
            </span>
            <span style={{ fontSize: '10px', color: 'hsl(24, 10%, 40%)', fontFamily: 'DM Sans, sans-serif', lineHeight: 1 }}>
              Google
            </span>
          </a>
        </div>
 
      </div>
    </header>
  );
};
 
export default Header;
