import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import Sheet from './Sheet.jsx';
import { CheckIcon } from './icons.jsx';
import { RatingLink } from './Top.jsx';
import { track } from '@/lib/track.js';
import { MAPS_URL, INSTAGRAM_URL, hours } from '@/data/business.js';
import { useLang, useList, lineInfo } from '@/lib/store.jsx';
import { LANGS } from '@/data/i18n.js';
import { allergens, filterAllergens } from '@/data/ingredients.js';

export function LangSheet({ open, onClose }) {
  const { lang, setLang, t } = useLang();
  return (
    <Sheet open={open} onClose={onClose} label={t.language} closeStyle="light">
      <div className="plain-body" style={{ paddingBottom: 24 }}>
        <h2>{t.language}</h2>
        <div className="langs">
          {LANGS.map((l) => (
            <button key={l.code} type="button" className="lang-opt" aria-pressed={l.code === lang} lang={l.html}
              onClick={() => { setLang(l.code); setTimeout(onClose, 150); }}>
              {l.label}
              {l.code === lang ? <CheckIcon style={{ width: 20, height: 20, stroke: 'var(--green)' }} /> : <span>{l.short}</span>}
            </button>
          ))}
        </div>
      </div>
    </Sheet>
  );
}

export function FilterSheet({ open, onClose, hidden, setHidden }) {
  const { t, tr } = useLang();
  const toggle = (n) => setHidden((h) => (h.includes(n) ? h.filter((x) => x !== n) : [...h, n]));
  const footer = <button type="button" className="cta" onClick={onClose}>{t.done}</button>;
  return (
    <Sheet open={open} onClose={onClose} label={t.filterTitle} closeStyle="light" footer={footer}>
      <div className="plain-body">
        <h2>{t.filterTitle}</h2>
        <p className="help">{t.filterHelp}</p>
        <div className="filter-grid">
          {filterAllergens.map((n) => (
            <button key={n} type="button" className="toggle" aria-pressed={hidden.includes(n)} onClick={() => toggle(n)}>
              <span className="num">{n}</span>{tr(allergens[n])}
            </button>
          ))}
        </div>
        {hidden.length > 0 && (
          <button type="button" className="cta ghost" style={{ marginTop: 18 }} onClick={() => setHidden([])}>{t.showAll}</button>
        )}
      </div>
    </Sheet>
  );
}

export function ListBar({ onOpen, hiddenWhen }) {
  const { count, total } = useList();
  const { t, money } = useLang();
  const reduce = useReducedMotion();
  return (
    <AnimatePresence>
      {count > 0 && !hiddenWhen && (
        <motion.button
          type="button"
          className="listbar"
          onClick={onOpen}
          initial={reduce ? { opacity: 0 } : { y: 90, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={reduce ? { opacity: 0 } : { y: 90, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 380, damping: 32 }}
        >
          <motion.span key={count} className="n" initial={reduce ? false : { scale: 1.35 }} animate={{ scale: 1 }}>{count}</motion.span>
          {t.myList} <span className="sum">· {money(total)}</span>
        </motion.button>
      )}
    </AnimatePresence>
  );
}

function lineLabel(line, info, tr, itemName) {
  if (line.kind === 'deal') return { name: tr(info.deal.title), sub: '' };
  return { name: itemName(info.item), sub: info.chosen.map((x) => '+ ' + tr(x.name)).join(', ') };
}

export function ListSheet({ open, onClose }) {
  const { lines, change, clear, total, live } = useList();
  const { t, tr, itemName, money } = useLang();
  const [waiter, setWaiter] = useState(false);
  useEffect(() => { if (!open) setWaiter(false); }, [open]);

  const footer = lines.length > 0 && (
    <button type="button" className="cta" onClick={() => { track('Shown to waiter', { items: lines.length }); setWaiter(true); }}>{t.showWaiter}</button>
  );

  return (
    <>
      <Sheet open={open && !waiter} onClose={onClose} label={t.myList} closeStyle="light" footer={footer}>
        <div className="plain-body">
          <h2>{t.myList}</h2>
          <p className="help">{lines.length ? t.listHelp : t.emptyList}</p>
          <ul className="lines">
            {lines.map((l) => {
              const info = lineInfo(l, live);
              if (!info) return null;
              const { name, sub } = lineLabel(l, info, tr, itemName);
              return (
                <li key={l.key} className="line">
                  <div className="line-main">
                    <div className="line-name">{name}</div>
                    {sub && <div className="line-x">{sub}</div>}
                    <div className="price" style={{ fontSize: 14 }}>{money(info.unit * l.qty)}</div>
                  </div>
                  <div className="stepper">
                    <button type="button" onClick={() => change(l.key, -1)} aria-label={t.remove}>−</button>
                    <span>{l.qty}</span>
                    <button type="button" onClick={() => change(l.key, 1)} aria-label={t.add}>+</button>
                  </div>
                </li>
              );
            })}
          </ul>
          {lines.length > 0 && (
            <>
              <div className="total-row"><span>{t.total}</span><span className="price" style={{ fontSize: 20 }}>{money(total)}</span></div>
              <button type="button" className="cta ghost" style={{ margin: '10px 0 8px' }} onClick={clear}>{t.clearList}</button>
            </>
          )}
        </div>
      </Sheet>
      {open && waiter && <WaiterView onBack={() => setWaiter(false)} />}
    </>
  );
}

// Large, plain list the guest turns towards the waiter. Dish names are in
// English, the way the till knows them, with the guest's language underneath.
function WaiterView({ onBack }) {
  const { lines, total, live } = useList();
  const { t, tr, itemName, money, lang } = useLang();
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);
  return (
    <div className="waiter" role="dialog" aria-modal="true" aria-label={t.waiterTitle}>
      <button type="button" className="cta ghost" style={{ width: 'auto', padding: '0 18px' }} onClick={onBack}>← {t.back}</button>
      <h2>{t.waiterTitle}</h2>
      {lines.map((l) => {
        const info = lineInfo(l, live);
        if (!info) return null;
        const en = l.kind === 'deal' ? info.deal.title.en : info.item.name;
        const local = l.kind === 'deal' ? tr(info.deal.title) : itemName(info.item);
        const ex = l.kind === 'item' ? info.chosen.map((x) => '+ ' + x.name.en).join(', ') : '';
        return (
          <div key={l.key} className="w-line">
            <span className="w-qty">{l.qty}×</span>
            <span>
              {en}
              {lang !== 'en' && local !== en && <span className="w-x">{local}</span>}
              {ex && <span className="w-x">{ex}</span>}
            </span>
          </div>
        );
      })}
      <div className="w-total"><span>{t.total}</span><span>{money(total)}</span></div>
    </div>
  );
}

export function Footer() {
  const { t, lang } = useLang();
  const meta = LANGS.find((l) => l.code === lang);
  const fmt = (day) => {
    try { return new Intl.DateTimeFormat(meta?.html || 'en', { weekday: 'long', timeZone: 'UTC' }).format(new Date(Date.UTC(2026, 0, 4 + day))); } catch { return String(day); }
  };
  const todayIdx = new Date().getDay();
  const order = [1, 2, 3, 4, 5, 6, 0];
  return (
    <footer className="foot">
      <div className="wrap">
        <h2>{t.findUs}</h2>
        <address style={{ fontStyle: 'normal', lineHeight: 1.6 }}>
          Hercegovačka 7, 81000 Podgorica<br />
          <a href="tel:+38267036687">+382 67 036 687</a> · <a href="mailto:info@cafeatlas.me">info@cafeatlas.me</a>
        </address>
        <ul className="hours" aria-label={t.hoursTitle}>
          {order.map((d) => (
            <React.Fragment key={d}>
              <li className={d === todayIdx ? 'today' : ''} style={{ textTransform: 'capitalize' }}>{fmt(d)}</li>
              <li className={d === todayIdx ? 'today' : ''}>{hours[d] ? `${String(hours[d][0]).padStart(2, '0')}:00–${hours[d][1]}:00` : t.closed}</li>
            </React.Fragment>
          ))}
        </ul>
        <div className="foot-links">
          <a href={MAPS_URL} target="_blank" rel="noopener noreferrer">Google Maps</a>
          <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer">{t.follow}</a>
          <a href="tel:+38267036687">{t.call}</a>
        </div>
        <RatingLink />
        <small style={{ marginTop: 18 }}>{t.allergenNote} {t.prices}</small>
      </div>
    </footer>
  );
}
