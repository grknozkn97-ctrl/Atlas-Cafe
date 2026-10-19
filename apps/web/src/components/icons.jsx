import React from 'react';

const S = (props) => (
  <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props} />
);

export const SearchIcon = (p) => <S {...p}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></S>;
export const CloseIcon = (p) => <S {...p}><path d="M6 6l12 12M18 6 6 18" /></S>;
export const GlobeIcon = (p) => <S {...p}><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c2.8 3 2.8 15 0 18M12 3c-2.8 3-2.8 15 0 18" /></S>;
export const FilterIcon = (p) => <S {...p}><path d="M12 3c3 4 5 6.5 5 9.5a5 5 0 0 1-10 0C7 9.5 9 7 12 3Z" /><path d="M4 4l16 16" /></S>;
export const CheckIcon = (p) => <S strokeWidth="3" {...p}><path d="m5 12 5 5 9-10" /></S>;
export const InfoIcon = (p) => <S {...p}><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 7.5v.5" /></S>;
export const PlusIcon = (p) => <S strokeWidth="2.4" {...p}><path d="M12 5v14M5 12h14" /></S>;
export const Pumpkin = (p) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" {...p}>
    <path d="M12 6.2c.3-1.6 1.2-2.6 2.6-3" stroke="#3d5a2a" strokeWidth="1.8" fill="none" strokeLinecap="round" />
    <path d="M12 6c-2-1.2-5.6-1-7.4 1.6C2.8 10.2 3 15 5.4 17.6 7.2 19.6 10 20 12 19c2 1 4.8.6 6.6-1.4 2.4-2.6 2.6-7.4.8-10C17.6 5 14 4.8 12 6Z" fill="#e8762c" />
    <path d="M8.2 11.4l1.6-1.8 1.4 1.8Zm4.6 0 1.6-1.8 1.4 1.8ZM8 14.2c2.4 2.4 5.6 2.4 8 0l-1.6.4-1.2-.8-1.2.9-1.2-.9-1.2.8Z" fill="#ffd36b" />
  </svg>
);

export const Star = () => (
  <svg viewBox="0 0 20 20" aria-hidden="true">
    <path d="M9.05 2.93c.3-.92 1.6-.92 1.9 0l1.07 3.29a1 1 0 0 0 .95.69h3.46c.97 0 1.37 1.24.59 1.81l-2.8 2.03a1 1 0 0 0-.36 1.12l1.07 3.29c.3.92-.76 1.69-1.54 1.12l-2.8-2.03a1 1 0 0 0-1.18 0l-2.8 2.03c-.78.57-1.84-.2-1.54-1.12l1.07-3.29a1 1 0 0 0-.36-1.12L2.98 8.72c-.78-.57-.38-1.81.59-1.81h3.46a1 1 0 0 0 .95-.69l1.07-3.29Z" />
  </svg>
);
