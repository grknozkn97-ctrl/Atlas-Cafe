import React, { useMemo } from 'react';
import { useLang, podgoricaHour, isLive } from '@/lib/store.jsx';
import { deals } from '@/data/deals.js';

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

export default function Deals({ onOpen }) {
  const { t } = useLang();
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
      <div className="deal-rail">
        {ordered.map(([d, live]) => <DealCard key={d.id} deal={d} live={live} onOpen={onOpen} />)}
      </div>
    </section>
  );
}
