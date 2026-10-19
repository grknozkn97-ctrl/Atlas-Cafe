import React, { useEffect, useMemo, useRef } from 'react';
import { useLang, podgoricaHour, isLive } from '@/lib/store.jsx';
import { deals } from '@/data/deals.js';
import { hui, nicknames } from '@/data/halloween.js';
import { Pumpkin } from './icons.jsx';

export function DealCard({ deal, live, onOpen }) {
  const { t, tr, money } = useLang();
  const saving = deal.regular ? deal.regular - deal.price : null;
  return (
    <button type="button" className="deal" data-live={live} onClick={() => onOpen(deal)}>
      <div className="deal-img">
        <img src={deal.img} alt="" loading="lazy" decoding="async" onError={(e) => { e.currentTarget.style.visibility = 'hidden'; }} />
        <span className="when" data-live={live}>{live ? t.now : t.from(deal.from)}</span>
        {saving ? (
          <span className="stamp" aria-label={t.save(money(saving))}>
            <b>−{money(saving)}</b>
          </span>
        ) : null}
      </div>
      <div className="deal-body">
        <div className="deal-title">{tr(deal.title)}</div>
        <div className="deal-detail">{tr(deal.detail)}</div>
        <div className="deal-price">
          <strong>{money(deal.price)}</strong>
          {deal.regular ? <s aria-label={t.instead(money(deal.regular))}>{money(deal.regular)}</s> : null}
          {!deal.regular && deal.saveUpTo ? <span className="size">{t.saveUpTo(money(deal.saveUpTo))}</span> : null}
        </div>
      </div>
    </button>
  );
}

function SpecialCard({ item, onOpen }) {
  const { t, itemName, ingList, tr, money } = useLang();
  const desc = item.ing?.length ? ingList(item).join(', ') : tr(item.note);
  return (
    <button type="button" className="deal special" onClick={() => onOpen(item)}>
      <div className="deal-img">
        {item.img && <img src={item.img} alt="" loading="lazy" decoding="async" onError={(e) => { e.currentTarget.style.visibility = 'hidden'; }} />}
        <span className="when special-tag">{t.special}</span>
      </div>
      <div className="deal-body">
        <div className="deal-title">{itemName(item)}</div>
        {desc && <div className="deal-detail">{desc}</div>}
        <div className="deal-price"><strong>{money(item.price)}</strong></div>
      </div>
    </button>
  );
}

function PickCard({ item, onOpen }) {
  const { itemName, tr, money } = useLang();
  return (
    <button type="button" className="deal pick-card" onClick={() => onOpen(item)}>
      <div className="deal-img">
        {item.img ? <img src={item.img} alt="" loading="lazy" decoding="async" onError={(e) => { e.currentTarget.style.visibility = 'hidden'; }} /> : <Pumpkin className="pick-pumpkin" />}
      </div>
      <div className="deal-body">
        <div className="deal-title">{tr(nicknames[item.id])}</div>
        <div className="deal-detail">{itemName(item)}</div>
        <div className="deal-price"><strong>{money(item.price)}</strong></div>
      </div>
    </button>
  );
}

export function HalloweenPicks({ items, onOpen }) {
  const { lang } = useLang();
  if (!items.length) return null;
  return (
    <section className="deals wrap hw-picks" aria-label={hui[lang].picksTitle}>
      <h2>{hui[lang].picksTitle}</h2>
      <div className="deal-rail">
        {items.map((it) => <PickCard key={it.id} item={it} onOpen={onOpen} />)}
      </div>
    </section>
  );
}

export default function Deals({ onOpen, specials = [], onOpenItem }) {
  const { t } = useLang();
  const railRef = useRef(null);
  // Today's picks arrive a moment after load; bring the rail back to its start so they are seen.
  useEffect(() => { if (railRef.current) railRef.current.scrollLeft = 0; }, [specials.length]);
  const hour = podgoricaHour();
  // Deals that fit the time of day come first.
  const ordered = useMemo(() => {
    const live = deals.filter((d) => isLive(d, hour));
    const later = deals.filter((d) => !isLive(d, hour)).sort((a, b) => ((a.from - hour + 24) % 24) - ((b.from - hour + 24) % 24));
    return [...live.map((d) => [d, true]), ...later.map((d) => [d, false])];
  }, [hour]);

  return (
    <section className="deals wrap" aria-label={t.deals}>
      <h2>{t.deals}</h2>
      <div className="deal-rail" ref={railRef}>
        {specials.map((it) => <SpecialCard key={it.id} item={it} onOpen={onOpenItem} />)}
        {ordered.map(([d, live]) => <DealCard key={d.id} deal={d} live={live} onOpen={onOpen} />)}
      </div>
    </section>
  );
}
