import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useLang } from '@/lib/store.jsx';
import { CloseIcon } from './icons.jsx';

import { INSTAGRAM_URL as INSTAGRAM, REVIEW_URL as GOOGLE } from '@/data/business.js';
import { track } from '@/lib/track.js';
import { isHalloween } from '@/data/theme.js';
import { hui } from '@/data/halloween.js';

const today = () => new Date().toISOString().slice(0, 10);
const get = (s, k) => { try { return s.getItem(k); } catch { return null; } };
const set = (s, k, v) => { try { s.setItem(k, v); } catch { /* storage off */ } };

/*
  Atlas, the coffee bean. Like the titan in the logo he carries the world,
  here a tiny glass with the map in the coffee.

  Manners, so he never gets in the way:
  - stays out of sight for the first 20 seconds, and until the guest has
    opened a dish or scrolled a good part of the menu;
  - says one short thing, then tucks back to a small peek after 12 seconds;
  - hides while a card or list is open;
  - at most two speech bubbles per visit; "Not now" or ✕ silences him for the day;
  - first visit: Instagram. Back on the menu 25+ minutes later (the meal is
    usually over): asks for a Google review.
*/
export default function Mascot({ suppressed }) {
  const { t: base, lang } = useLang();
  const t = isHalloween ? { ...base, ...hui[lang] } : base;
  const reduce = useReducedMotion();
  const [phase, setPhase] = useState('off'); // off | peek | talk
  const [kind, setKind] = useState('insta');
  const engaged = useRef(false);
  const ready = useRef(false);
  const collapseTimer = useRef(null);

  const silenced = () => get(localStorage, 'atlas-mascot-quiet') === today();
  const talksUsed = () => Number(get(sessionStorage, 'atlas-mascot-talks') || 0);

  // First time seen today, used to tell a returning guest from a new one.
  const firstSeen = useRef(0);
  useEffect(() => {
    const key = 'atlas-first-seen';
    const raw = get(localStorage, key);
    const [day, ts] = (raw || '').split('|');
    if (day === today() && ts) firstSeen.current = Number(ts);
    else { firstSeen.current = Date.now(); set(localStorage, key, `${today()}|${firstSeen.current}`); }
  }, []);

  const talk = useCallback((which) => {
    if (silenced() || talksUsed() >= 2) { setPhase((p) => (p === 'off' && !silenced() ? 'peek' : p)); return; }
    set(sessionStorage, 'atlas-mascot-talks', String(talksUsed() + 1));
    setKind(which);
    setPhase('talk');
    clearTimeout(collapseTimer.current);
    collapseTimer.current = setTimeout(() => setPhase('peek'), 12000);
  }, []);

  const pickKind = () => (Date.now() - firstSeen.current > 25 * 60 * 1000 ? 'google' : 'insta');

  const maybeStart = useCallback(() => {
    if (ready.current && engaged.current && !silenced()) {
      ready.current = false; // only once
      talk(pickKind());
    }
  }, [talk]);

  useEffect(() => {
    if (silenced()) return undefined;
    const timer = setTimeout(() => { ready.current = true; maybeStart(); }, 20000);
    const onEngage = () => { engaged.current = true; maybeStart(); };
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      if (max > 0 && window.scrollY / max > 0.3) onEngage();
    };
    window.addEventListener('atlas:engaged', onEngage);
    window.addEventListener('scroll', onScroll, { passive: true });
    // Coming back to the tab after a while: the meal is likely done.
    let hiddenAt = 0;
    const onVis = () => {
      if (document.hidden) { hiddenAt = Date.now(); return; }
      if (hiddenAt && Date.now() - hiddenAt > 20 * 60 * 1000 && !silenced()) talk('google');
    };
    document.addEventListener('visibilitychange', onVis);
    return () => {
      clearTimeout(timer); clearTimeout(collapseTimer.current);
      window.removeEventListener('atlas:engaged', onEngage);
      window.removeEventListener('scroll', onScroll);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [maybeStart, talk]);

  const quiet = () => { set(localStorage, 'atlas-mascot-quiet', today()); setPhase('off'); };

  const visible = phase !== 'off' && !suppressed;
  const href = kind === 'google' ? GOOGLE : INSTAGRAM;

  return (
    <div className="mascot" aria-live="polite">
      <AnimatePresence>
        {visible && phase === 'talk' && (
          <motion.div
            key="bubble"
            className="bubble"
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 10, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: 6, scale: 0.97 }}
            transition={{ duration: 0.25, ease: [0.2, 0.8, 0.2, 1] }}
            style={{ transformOrigin: 'bottom right' }}
          >
            <button type="button" className="x" onClick={quiet} aria-label={t.close}><CloseIcon /></button>
            <p>{kind === 'google' ? t.mascotGoogle : t.mascotInsta}</p>
            <a className={`go ${kind === 'insta' ? 'insta' : ''}`} href={href} target="_blank" rel="noopener noreferrer" onClick={() => { track('Mascot link', { kind }); setPhase('peek'); }}>
              {kind === 'google' ? `★ ${t.mascotGoogleCta}` : t.mascotInstaCta}
            </a>
            <button type="button" className="later" onClick={quiet}>{t.notNow}</button>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {visible && (
          <motion.button
            key="stage"
            type="button"
            className="mascot-stage"
            aria-label={t.mascotLabel}
            aria-expanded={phase === 'talk'}
            onClick={() => {
              if (phase === 'talk') { setPhase('peek'); return; }
              setKind(pickKind()); setPhase('talk');
              clearTimeout(collapseTimer.current);
              collapseTimer.current = setTimeout(() => setPhase('peek'), 12000);
            }}
            initial={{ y: 140 }}
            animate={{ y: 0 }}
            exit={{ y: 140 }}
            transition={reduce ? { duration: 0.01 } : { type: 'spring', stiffness: 260, damping: 24 }}
          >
            {/* Atlas lives in a cup: he rises out of it to talk and sinks back to a peek. */}
            <span className="bean-well">
              <motion.span
                className="bean"
                animate={{ y: phase === 'peek' ? 22 : 0 }}
                transition={reduce ? { duration: 0.01 } : { type: 'spring', stiffness: 300, damping: 20 }}
              >
                <Bean talking={phase === 'talk'} reduce={reduce} />
              </motion.span>
            </span>
            {isHalloween ? <Cauldron /> : <Cup />}
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}

function Cup() {
  return (
    <svg className="cup" viewBox="0 0 92 44" aria-hidden="true">
      <ellipse cx="46" cy="39" rx="40" ry="5" fill="#e4d8bf" />
      <ellipse cx="46" cy="37.5" rx="30" ry="3.2" fill="#d3c4a4" />
      <path d="M78 14 c9 0 10 13 0 13" fill="none" stroke="#fffdf7" strokeWidth="5" />
      <path d="M78 14 c9 0 10 13 0 13" fill="none" stroke="#d9cfba" strokeWidth="1.2" />
      <path d="M12 7 H80 L76 29 Q74 36 64 36 H28 Q18 36 16 29 Z" fill="#fffdf7" stroke="#d9cfba" strokeWidth="1.2" />
      <path d="M13.6 14 H78.4 L77.6 18.5 H14.5 Z" fill="#2c4a38" />
      <ellipse cx="46" cy="7" rx="34" ry="3.4" fill="none" stroke="#d9cfba" strokeWidth="1.2" />
    </svg>
  );
}

function Cauldron() {
  return (
    <svg className="cup" viewBox="0 0 92 44" aria-hidden="true">
      <ellipse cx="46" cy="40" rx="34" ry="4" fill="rgba(0,0,0,0.35)" />
      <path d="M22 36 l-4 6 M70 36 l4 6" stroke="#0d0b0a" strokeWidth="4" strokeLinecap="round" />
      <path d="M10 8 H82 Q86 30 66 37 H26 Q6 30 10 8 Z" fill="#1c1916" stroke="#3b342d" strokeWidth="1.4" />
      <path d="M14 18 Q46 26 78 18" stroke="#3b342d" strokeWidth="1.2" fill="none" opacity="0.8" />
      <ellipse cx="46" cy="8" rx="37" ry="4.6" fill="#2a2520" stroke="#4a4239" strokeWidth="1.4" />
      <ellipse cx="46" cy="8" rx="33" ry="2.8" fill="#7bc65b" opacity="0.9" />
      <circle cx="30" cy="5" r="2.2" fill="#a8e88a" opacity="0.9" />
      <circle cx="60" cy="4" r="1.6" fill="#a8e88a" opacity="0.85" />
      <circle cx="68" cy="6" r="1.1" fill="#a8e88a" opacity="0.8" />
    </svg>
  );
}

function Bean({ talking, reduce }) {
  const [blink, setBlink] = useState(false);
  useEffect(() => {
    if (reduce) return undefined;
    const id = setInterval(() => { setBlink(true); setTimeout(() => setBlink(false), 140); }, 3800);
    return () => clearInterval(id);
  }, [reduce]);

  const breathe = reduce ? {} : { scaleY: [1, 1.025, 1], transition: { duration: 3.2, repeat: Infinity, ease: 'easeInOut' } };
  const lift = reduce ? {} : { y: talking ? [0, -3, 0] : [0, -1.2, 0], transition: { duration: talking ? 1.4 : 3.2, repeat: Infinity, ease: 'easeInOut' } };

  return (
    <svg viewBox="0 0 100 118" role="img" aria-hidden="true">
      <defs>
        <radialGradient id="beanShade" cx="38%" cy="34%" r="75%">
          <stop offset="0" stopColor="#8a5a36" />
          <stop offset="0.55" stopColor="#6a4126" />
          <stop offset="1" stopColor="#4a2c18" />
        </radialGradient>
        <clipPath id="bowl"><circle cx="50" cy="21" r="15.5" /></clipPath>
      </defs>

      {/* ground shadow */}
      <ellipse cx="50" cy="113" rx="22" ry="3.5" fill="rgba(23,39,30,0.18)" />

      {/* the world in a glass, held overhead (a jack-o'-lantern at Halloween) */}
      {isHalloween ? (
        <motion.g animate={lift}>
          <path d="M50 6 q2 -5 6 -5" stroke="#3d5a2a" strokeWidth="2.6" fill="none" strokeLinecap="round" />
          <ellipse cx="50" cy="22" rx="17" ry="14.5" fill="#e8762c" stroke="#7a3510" strokeWidth="1.6" />
          <path d="M42 9 Q38 22 42 35 M58 9 Q62 22 58 35 M50 8 V36" stroke="#c45a18" strokeWidth="1.3" fill="none" opacity="0.8" />
          <path d="M41 18 l4 -4 l3 4 Z M52 18 l4 -4 l3 4 Z" fill="#ffd36b" />
          <path d="M40 25 q10 9 20 0 l-3 3 l-3 -2 l-4 3 l-3 -3 l-3 2 Z" fill="#ffd36b" />
        </motion.g>
      ) : (
      <motion.g animate={lift}>
        <path d="M50 37 L50 44" stroke="#17271e" strokeWidth="2.4" strokeLinecap="round" />
        <g clipPath="url(#bowl)">
          <rect x="30" y="2" width="40" height="40" fill="#efe2c4" />
          <path d="M33 13 q5-3 9 0 t9 1 t8-2 M36 18 q4 2 8 0" stroke="#d8c39a" strokeWidth="2.2" fill="none" strokeLinecap="round" />
          <path d="M30 24 q6-4 12 0 t12 0 t12 -1 V42 H30Z" fill="#7a4524" />
          <path d="M40 27 q3 2 7 1 q2 3 -1 6 q-4 1 -6 -2Z M56 26 q4 1 6 4 q-3 2 -6 0Z" fill="#9c6236" />
        </g>
        <circle cx="50" cy="21" r="15.5" fill="none" stroke="#17271e" strokeWidth="2.6" />
        <path d="M41 11 q3-3 7-3.5" stroke="#fff" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.8" />
      </motion.g>
      )}

      {/* arms */}
      <path d="M31 63 C 25 54, 30 44, 39 36" stroke="#4a2c18" strokeWidth="5" fill="none" strokeLinecap="round" />
      <path d="M69 63 C 75 54, 70 44, 61 36" stroke="#4a2c18" strokeWidth="5" fill="none" strokeLinecap="round" />
      <circle cx="39.5" cy="35.5" r="3.6" fill="#5a3620" />
      <circle cx="60.5" cy="35.5" r="3.6" fill="#5a3620" />

      {/* feet */}
      <ellipse cx="41" cy="108" rx="7" ry="4" fill="#2b1a0e" />
      <ellipse cx="59" cy="108" rx="7" ry="4" fill="#2b1a0e" />

      {/* the bean */}
      <motion.g animate={breathe} style={{ transformOrigin: '50px 106px' }}>
        <ellipse cx="50" cy="76" rx="24" ry="30" fill="url(#beanShade)" />
        <path d="M60 49 C 68 64, 64 88, 54 104" stroke="#2f1b0d" strokeWidth="2.6" fill="none" strokeLinecap="round" />
        <path d="M61.5 52 C 67 66, 64 84, 57 98" stroke="#a87a52" strokeWidth="1.2" fill="none" strokeLinecap="round" opacity="0.6" />
        <ellipse cx="38" cy="62" rx="5" ry="8" fill="#fff" opacity="0.12" transform="rotate(-18 38 62)" />

        {/* face */}
        <g>
          {blink ? (
            <>
              <path d="M36.5 71 h7" stroke="#14100c" strokeWidth="2.4" strokeLinecap="round" />
              <path d="M48.5 71 h7" stroke="#14100c" strokeWidth="2.4" strokeLinecap="round" />
            </>
          ) : (
            <>
              <ellipse cx="40" cy="71" rx="3.3" ry="4.2" fill="#14100c" />
              <ellipse cx="52" cy="71" rx="3.3" ry="4.2" fill="#14100c" />
              <circle cx="41.2" cy="69.4" r="1.2" fill="#fff" />
              <circle cx="53.2" cy="69.4" r="1.2" fill="#fff" />
            </>
          )}
          <circle cx="34.5" cy="79" r="3.2" fill="#d98b6a" opacity="0.45" />
          <circle cx="57.5" cy="79" r="3.2" fill="#d98b6a" opacity="0.45" />
          {talking ? (
            <path d="M42 79 q4 6 8 0 z" fill="#2a120a" />
          ) : (
            <path d="M42 79.5 q4 3.6 8 0" stroke="#14100c" strokeWidth="2.2" fill="none" strokeLinecap="round" />
          )}
        </g>
      </motion.g>
    </svg>
  );
}
