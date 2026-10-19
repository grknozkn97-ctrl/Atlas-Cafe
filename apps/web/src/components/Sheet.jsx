import React, { useEffect, useRef } from 'react';
import { AnimatePresence, motion, useDragControls, useReducedMotion } from 'framer-motion';
import { CloseIcon } from './icons.jsx';
import { useLang } from '@/lib/store.jsx';

// Bottom sheet on phones, centred card on wider screens.
// Closes on the scrim, the ✕, Escape, or a downward swipe on the sheet.
export default function Sheet({ open, onClose, children, footer, label, closeStyle = 'dark' }) {
  const reduce = useReducedMotion();
  const controls = useDragControls();
  const { t } = useLang();
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    const tid = setTimeout(() => ref.current?.focus({ preventScroll: true }), 50);
    return () => { document.body.style.overflow = prev; window.removeEventListener('keydown', onKey); clearTimeout(tid); };
  }, [open, onClose]);

  const enter = reduce ? { opacity: 0 } : { y: '100%' };
  const shown = reduce ? { opacity: 1 } : { y: 0 };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div className="scrim" onClick={onClose} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.22 }} />
          <div className="sheet-holder">
            <motion.div
              ref={ref}
              tabIndex={-1}
              role="dialog"
              aria-modal="true"
              aria-label={label}
              className="sheet"
              initial={enter}
              animate={shown}
              exit={enter}
              transition={reduce ? { duration: 0.15 } : { type: 'spring', stiffness: 420, damping: 40, mass: 0.9 }}
              drag={reduce ? false : 'y'}
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={{ top: 0, bottom: 0.6 }}
              dragListener={false}
              dragControls={controls}
              onDragEnd={(_, info) => { if (info.offset.y > 110 || info.velocity.y > 600) onClose(); }}
              style={{ outline: 'none' }}
            >
              {/* Swipe-down handle: the top strip of the sheet. The content below scrolls normally. */}
              <div className="drag-zone" onPointerDown={(e) => !reduce && controls.start(e)} aria-hidden="true">
                <div className="grabber" />
              </div>
              <button type="button" className={`sheet-close ${closeStyle === 'light' ? 'plain' : ''}`} onClick={onClose} aria-label={t.close}>
                <CloseIcon />
              </button>
              <div className="sheet-scroll">
                {children}
              </div>
              {footer && <div className="sheet-foot">{footer}</div>}
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
