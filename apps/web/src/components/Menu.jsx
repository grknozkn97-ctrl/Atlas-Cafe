import React, { useEffect, useRef, useState } from 'react';
import { useLang, useList } from '@/lib/store.jsx';
import { isHalloween } from '@/data/theme.js';
import { nicknames } from '@/data/halloween.js';
import { Pumpkin } from './icons.jsx';

const scrollToId = (id) => {
  const el = document.getElementById(id);
  if (!el) return;
  const nav = document.querySelector('.catnav');
  const offset = (nav ? nav.offsetHeight : 0) + 4;
  const y = el.getBoundingClientRect().top + window.scrollY - offset;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  window.scrollTo({ top: y, behavior: reduce ? 'auto' : 'smooth' });
};

export function CatNav({ sections, active, setActive }) {
  const { tr } = useLang();
  const chipsRef = useRef(null);
  const current = sections.find((s) => s.id === active.section) || sections[0];

  // Keep the active chip in view as the guest scrolls.
  useEffect(() => {
    const chip = chipsRef.current?.querySelector('[aria-current="true"]');
    if (chip && chipsRef.current) {
      const box = chipsRef.current;
      const left = chip.offsetLeft - box.clientWidth / 2 + chip.clientWidth / 2;
      box.scrollTo({ left, behavior: 'smooth' });
    }
  }, [active.group]);

  if (!current) return null;
  return (
    <nav className="catnav" aria-label="Menu">
      <div className="wrap">
        <div className="tabs" role="list">
          {sections.map((s) => (
            <button
              key={s.id}
              type="button"
              role="listitem"
              className="tab"
              aria-current={s.id === current.id}
              onClick={() => {
                setActive({ section: s.id, group: s.groups[0]?.id, lockUntil: Date.now() + 1100 });
                scrollToId(`sec-${s.id}`);
                try { window.history.replaceState(null, '', s.path + window.location.search); } catch { /* ignore */ }
              }}
            >
              {tr(s.title)}
            </button>
          ))}
        </div>
        <div className="chips" ref={chipsRef}>
          {current.groups.map((g) => (
            <button
              key={g.id}
              type="button"
              className="chip"
              aria-current={g.id === active.group}
              onClick={() => { setActive({ section: current.id, group: g.id, lockUntil: Date.now() + 1100 }); scrollToId(`grp-${g.id}`); }}
            >
              {tr(g.title)}
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
}

function Row({ item, onOpen }) {
  const { itemName, ingList, tr, money, t } = useLang();
  const { perItem } = useList();
  const [imgOk, setImgOk] = useState(true);
  const desc = item.ing?.length ? ingList(item).join(', ') : tr(item.note);
  const count = perItem[item.id] || 0;
  const photo = item.img && imgOk;
  return (
    <li>
      <button type="button" className={`row ${photo ? '' : 'text-row'} ${item.soldOut ? 'sold' : ''}`} onClick={() => onOpen(item)}>
        <div className="row-main">
          <div className="row-name">
            <span>{itemName(item)}</span>
            {isHalloween && nicknames[item.id] && <span className="tag nick"><Pumpkin />{tr(nicknames[item.id])}</span>}
            {item.spicy && <span className="tag hot">{t.spicy}</span>}
            {item.signature && <span className="tag">{t.signature}</span>}
            {item.special && !item.soldOut && <span className="tag pick">{t.special}</span>}
            {item.soldOut && <span className="tag out">{t.soldOut}</span>}
          </div>
          {desc && <div className="row-desc">{desc}</div>}
          {photo ? (
            <div className="row-meta">
              <span className="price">{money(item.price)}</span>
              {item.size && <span className="size">{item.size}</span>}
            </div>
          ) : item.size ? (
            <div className="row-meta"><span className="size">{item.size}</span></div>
          ) : null}
        </div>
        {photo ? (
          <div className="row-thumb">
            <img src={item.img} alt="" loading="lazy" decoding="async" width="92" height="92" onError={() => setImgOk(false)} />
            {count > 0 && <span className="count-badge" aria-label={t.inList(count)}>{count}</span>}
          </div>
        ) : (
          <div className="row-side">
            <span className="price">{money(item.price)}</span>
            {count > 0 && <span className="count-badge row-count" aria-label={t.inList(count)}>{count}</span>}
          </div>
        )}
      </button>
    </li>
  );
}

export function MenuList({ sections, onOpen, setActive, active }) {
  const { tr } = useLang();
  const activeRef = useRef(active);
  activeRef.current = active;

  // Scroll-spy: the group nearest the top of the screen becomes active.
  useEffect(() => {
    const groups = [...document.querySelectorAll('[data-group]')];
    if (!groups.length) return undefined;
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const nav = document.querySelector('.catnav');
        const line = (nav ? nav.getBoundingClientRect().bottom : 0) + 40;
        let found = groups[0];
        for (const g of groups) { if (g.getBoundingClientRect().top <= line) found = g; else break; }
        const next = { section: found.dataset.section, group: found.dataset.group };
        const cur = activeRef.current;
        if (cur.lockUntil && Date.now() < cur.lockUntil) return; // a tap is still scrolling
        if (cur.group !== next.group || cur.section !== next.section) setActive(next);
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => { window.removeEventListener('scroll', onScroll); cancelAnimationFrame(raf); };
  }, [sections, setActive]);

  return (
    <main className="wrap">
      {sections.map((s) => (
        <section key={s.id} id={`sec-${s.id}`} className="section" aria-labelledby={`h-${s.id}`}>
          <h2 id={`h-${s.id}`} className="section-title">{tr(s.title)}</h2>
          {s.groups.map((g) => (
            <div key={g.id} id={`grp-${g.id}`} className="group" data-group={g.id} data-section={s.id}>
              <h3 className="group-title">{tr(g.title)}</h3>
              <ul className="rows">
                {g.items.map((it) => <Row key={it.id} item={it} onOpen={onOpen} />)}
              </ul>
            </div>
          ))}
        </section>
      ))}
    </main>
  );
}

export { scrollToId };
