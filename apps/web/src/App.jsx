import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { LangProvider, ListProvider, LiveProvider, useLang, useLiveData } from '@/lib/store.jsx';
import { applyLive } from '@/lib/live.js';
import { sections as baseSections, itemsById } from '@/data/menu.js';
import { ingredients } from '@/data/ingredients.js';
import Top from '@/components/Top.jsx';
import Deals from '@/components/Deals.jsx';
import { CatNav, MenuList, scrollToId } from '@/components/Menu.jsx';
import ProductSheet, { DealSheet } from '@/components/ProductSheet.jsx';
import { FilterSheet, Footer, LangSheet, ListBar, ListSheet } from '@/components/Panels.jsx';
import Mascot from '@/components/Mascot.jsx';
import { Analytics } from '@vercel/analytics/react';
import { track } from '@/lib/track.js';

// Lower-case and strip accents so "cokertme" finds "Çökertme" and "kafa" finds "Kafa".
const fold = (s) => (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd');

function Page() {
  const { lang, t } = useLang();
  const live = useLiveData();
  const allSections = useMemo(() => applyLive(baseSections, live), [live]);
  const [query, setQuery] = useState('');
  const [hidden, setHidden] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem('atlas-hide') || '[]'); } catch { return []; }
  });
  const [item, setItem] = useState(null);
  const [deal, setDeal] = useState(null);
  const [panel, setPanel] = useState(null); // 'lang' | 'filter' | 'list'
  const [active, setActive] = useState({ section: baseSections[0].id, group: baseSections[0].groups[0].id });

  useEffect(() => { try { sessionStorage.setItem('atlas-hide', JSON.stringify(hidden)); } catch { /* ignore */ } }, [hidden]);

  // Apply search and allergen filter; drop empty groups and sections.
  const { sections, hiddenCount } = useMemo(() => {
    const q = fold(query.trim());
    let hiddenN = 0;
    const out = [];
    for (const s of allSections) {
      const groups = [];
      for (const g of s.groups) {
        const items = g.items.filter((it) => {
          if (hidden.length && (it.al || []).some((a) => hidden.includes(a))) { hiddenN += 1; return false; }
          if (!q) return true;
          const hay = [it.name, ...Object.values(it.names || {}), ...Object.values(g.title),
            ...(it.ing || []).map((k) => { const key = k.split(':').pop(); return Object.values(ingredients[key] || {}).join(' '); }),
          ].join(' ');
          return fold(hay).includes(q);
        });
        if (items.length) groups.push({ ...g, items });
      }
      if (groups.length) out.push({ ...s, groups });
    }
    return { sections: out, hiddenCount: hiddenN };
  }, [query, hidden, allSections]);

  // Old links and QR codes: /drinks, /food, /alcohol, /dessert jump to their section.
  useEffect(() => {
    const path = window.location.pathname.replace(/\/+$/, '');
    const target = baseSections.find((s) => s.path === path);
    if (target) setTimeout(() => scrollToId(`sec-${target.id}`), 250);
  }, []);

  const openItem = useCallback((it) => {
    const l = live && live[it.id];
    const base = itemsById[it.id];
    track('Product opened', { id: it.id, name: base.name });
    setItem(l ? { ...base, price: l.price ?? base.price, soldOut: l.soldOut, special: l.special } : base);
  }, [live]);
  const specials = useMemo(() => {
    const out = [];
    for (const s of allSections) for (const g of s.groups) for (const it of g.items) if (it.special && !it.soldOut) out.push(it);
    return out;
  }, [allSections]);
  const openDeal = useCallback((d) => {
    track('Deal opened', { id: d.id }); setItem(null); setTimeout(() => setDeal(d), item ? 260 : 0); }, [item]);
  const anyOpen = !!item || !!deal || !!panel;

  return (
    <>
      <Top
        query={query}
        setQuery={setQuery}
        onLang={() => setPanel('lang')}
        onFilter={() => setPanel('filter')}
        hiddenAllergens={hidden}
        hiddenCount={hiddenCount}
        clearFilter={() => setHidden([])}
      />
      {!query && <Deals onOpen={openDeal} specials={specials} onOpenItem={openItem} />}
      {sections.length > 0 ? (
        <>
          <CatNav sections={sections} active={active} setActive={setActive} />
          <MenuList sections={sections} onOpen={openItem} active={active} setActive={setActive} key={lang + query + hidden.join()} />
        </>
      ) : (
        <p className="empty wrap">{t.noResults(query)}</p>
      )}
      <Footer />

      <ProductSheet item={item} onClose={() => setItem(null)} onDeal={openDeal} />
      <DealSheet deal={deal} onClose={() => setDeal(null)} />
      <LangSheet open={panel === 'lang'} onClose={() => setPanel(null)} />
      <FilterSheet open={panel === 'filter'} onClose={() => setPanel(null)} hidden={hidden} setHidden={setHidden} />
      <ListSheet open={panel === 'list'} onClose={() => setPanel(null)} />
      <ListBar onOpen={() => setPanel('list')} hiddenWhen={anyOpen} />
      <Mascot suppressed={anyOpen} />
      <Analytics />
    </>
  );
}

export default function App() {
  return (
    <LangProvider>
      <LiveProvider>
        <ListProvider>
          <Page />
        </ListProvider>
      </LiveProvider>
    </LangProvider>
  );
}
