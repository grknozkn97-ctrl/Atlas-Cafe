import React from 'react';
 
const SocialMediaIcons = ({ instagram, email, phone, website }) => {
  const items = [
    {
      label: 'Instagram',
      href: instagram,
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"
          style={{ width: '22px', height: '22px' }}>
          <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
          <circle cx="12" cy="12" r="4" />
          <circle cx="17.5" cy="6.5" r="0.8" fill="currentColor" stroke="none" />
        </svg>
      ),
    },
    {
      label: 'Email',
      href: email ? `mailto:${email}` : null,
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"
          style={{ width: '22px', height: '22px' }}>
          <rect x="2" y="4" width="20" height="16" rx="2" />
          <polyline points="2,4 12,13 22,4" />
        </svg>
      ),
    },
    {
      label: 'Phone',
      href: phone ? `tel:${phone}` : null,
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"
          style={{ width: '22px', height: '22px' }}>
          <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 10.8a19.79 19.79 0 01-3.07-8.63A2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" />
        </svg>
      ),
    },
    {
      label: 'Website',
      href: website,
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"
          style={{ width: '22px', height: '22px' }}>
          <circle cx="12" cy="12" r="10" />
          <line x1="2" y1="12" x2="22" y2="12" />
          <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
        </svg>
      ),
    },
  ].filter(item => item.href);
 
  if (items.length === 0) return null;
 
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      gap: '12px',
      padding: '8px 20px',
    }}>
      {items.map((item) => (
        <a
          key={item.label}
          href={item.href}
          target={item.label !== 'Phone' && item.label !== 'Email' ? '_blank' : undefined}
          rel="noopener noreferrer"
          aria-label={item.label}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            width: '72px',
            height: '72px',
            borderRadius: '16px',
            backgroundColor: 'hsl(0, 0%, 100%)',
            border: '1px solid hsl(38, 20%, 88%)',
            color: 'hsl(24, 10%, 35%)',
            textDecoration: 'none',
            boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.backgroundColor = 'hsl(24, 45%, 35%)';
            e.currentTarget.style.borderColor = 'hsl(24, 45%, 35%)';
            e.currentTarget.style.color = '#fff';
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.12)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.backgroundColor = 'hsl(0, 0%, 100%)';
            e.currentTarget.style.borderColor = 'hsl(38, 20%, 88%)';
            e.currentTarget.style.color = 'hsl(24, 10%, 35%)';
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.06)';
          }}
        >
          {item.icon}
          <span style={{
            fontFamily: 'DM Sans, sans-serif',
            fontSize: '9px',
            fontWeight: '500',
            letterSpacing: '0.04em',
            color: 'inherit',
            lineHeight: 1,
          }}>
            {item.label}
          </span>
        </a>
      ))}
    </div>
  );
};
 
export default SocialMediaIcons;
