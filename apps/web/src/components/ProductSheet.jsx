import React, { useEffect, useState } from 'react';

const hideOnError = (e) => { e.currentTarget.style.visibility = 'hidden'; };
import { motion, useReducedMotion } from 'framer-motion';
import Sheet from './Sheet.jsx';
import { CheckIcon, InfoIcon, PlusIcon } from './icons.jsx';
import { useLang, useList } from '@/lib/store.jsx';
import { allergens } from '@/data/ingredients.js';
import { extras as extrasData } from '@/data/menu.js';
import { deals, dealForGroup } from '@/data/deals.js';

// Content fades up just behind the sheet, one small step at a time.
function Reveal({ i, children }) {
  const reduce = useReducedMotion();
  if (reduce) return children;
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 + i * 0.045, duration: 0.28, ease: [0.2, 0.8, 0.2, 1] }}>
      {children}
    </motion.div>
  );
}

export function AllergenBlock({ al }) {
  const { t, tr } = useLang();
  return (
    <div className="block">
      <h3>{t.allergens}</h3>
      {al && al.length ? (
        <ul className="allergens">
          {al.map((n) => (
            <li key={n} className="allergen"><span className="num">{n}</span>{tr(allergens[n])}</li>
          ))}
        </ul>
      ) : (
        <p className="note-text">{t.noAllergens}</p>
      )}
      <p className="allergen-note"><InfoIcon />{t.allergenNote}</p>
    </div>
  );
}

export default function ProductSheet({ item, onClose, onDeal }) {
  const { t, tr, itemName, ingList, money } = useLang();
  const { add, perItem } = useList();
  const [chosen, setChosen] = useState([]);
  const [justAdded, setJustAdded] = useState(false);

  useEffect(() => {
    setChosen([]); setJustAdded(false);
    if (item) window.dispatchEvent(new Event('atlas:engaged'));
  }, [item?.id]);

  const pool = item ? extrasData[item.extrasKey] || [] : [];
  const unit = item ? item.price + pool.filter((x) => chosen.includes(x.id)).reduce((s, x) => s + x.price, 0) : 0;
  const deal = item ? deals.find((d) => d.id === dealForGroup[item.groupId]) : null;
  const ings = item ? ingList(item) : [];
  const note = item ? tr(item.note) : '';
  const inList = item ? perItem[item.id] || 0 : 0;

  let i = 0;
  const footer = item && (
    <button
      type="button"
      className="cta"
      onClick={() => { add(item.id, 'item', chosen); setJustAdded(true); setTimeout(onClose, 380); }}
    >
      {justAdded ? <CheckIcon /> : <PlusIcon />}
      {justAdded ? t.inList(inList) : t.addToList}
      <span className="amt">· {money(unit)}</span>
    </button>
  );

  return (
    <Sheet open={!!item} onClose={onClose} footer={footer} label={item ? itemName(item) : ''} closeStyle={item?.img ? 'dark' : 'light'}>
      {item && (
        <>
          {item.img && (
            <div className="sheet-photo">
              <motion.img
                src={item.img}
                alt={itemName(item)}
                onError={hideOnError}
                initial={{ scale: 1.06 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.5, ease: [0.2, 0.8, 0.2, 1] }}
              />
            </div>
          )}
          <div className={`sheet-body ${item.img ? '' : 'no-photo'}`}>
            <Reveal i={i++}>
              <h2 className="sheet-name">{itemName(item)}</h2>
              {itemName(item) !== item.name && <div className="sheet-sub">{item.name}</div>}
              <div className="sheet-facts">
                <span className="price">{money(item.price)}</span>
                {item.size && <span className="fact">{item.size}</span>}
                {item.kcal > 0 && <span className="fact">{item.kcal} {t.kcal}</span>}
                {item.spicy && <span className="tag hot">{t.spicy}</span>}
                {item.signature && <span className="tag">{t.signature}</span>}
              </div>
            </Reveal>

            {(ings.length > 0 || note) && (
              <Reveal i={i++}>
                <div className="block">
                  <h3>{t.ingredients}</h3>
                  {note && <p className="note-text" style={{ marginBottom: ings.length ? 12 : 0 }}>{note}</p>}
                  {ings.length > 0 && <ul className="ing">{ings.map((x) => <li key={x}>{x}</li>)}</ul>}
                </div>
              </Reveal>
            )}

            {pool.length > 0 && (
              <Reveal i={i++}>
                <div className="block">
                  <h3>{t.extras}</h3>
                  <div className="extras">
                    {pool.map((x) => {
                      const on = chosen.includes(x.id);
                      return (
                        <button
                          key={x.id}
                          type="button"
                          className="extra"
                          aria-pressed={on}
                          onClick={() => setChosen((c) => (on ? c.filter((y) => y !== x.id) : [...c, x.id]))}
                        >
                          <span className="box">{on && <CheckIcon />}</span>
                          <span className="x-name">{tr(x.name)}</span>
                          <span className="x-price">+{money(x.price)}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </Reveal>
            )}

            {deal && (
              <Reveal i={i++}>
                <div className="block">
                  <h3>{t.pairs}</h3>
                  <button type="button" className="pair" onClick={() => onDeal(deal)}>
                    <img src={deal.img} alt="" loading="lazy" onError={hideOnError} />
                    <span>
                      <span className="pair-title" style={{ display: 'block' }}>{tr(deal.title)} · {money(deal.price)}</span>
                      <span className="pair-sub">
                        {deal.regular ? t.save(money(deal.regular - deal.price)) : deal.saveUpTo ? t.saveUpTo(money(deal.saveUpTo)) : tr(deal.detail)}
                      </span>
                    </span>
                  </button>
                </div>
              </Reveal>
            )}

            <Reveal i={i++}>
              <AllergenBlock al={item.al} />
            </Reveal>
          </div>
        </>
      )}
    </Sheet>
  );
}

export function DealSheet({ deal, onClose }) {
  const { t, tr, money } = useLang();
  const { add } = useList();
  const [added, setAdded] = useState(false);
  useEffect(() => setAdded(false), [deal?.id]);
  const footer = deal && (
    <button type="button" className="cta" onClick={() => { add(deal.id, 'deal'); setAdded(true); setTimeout(onClose, 380); }}>
      {added ? <CheckIcon /> : <PlusIcon />}
      {t.addToList}
      <span className="amt">· {money(deal.price)}</span>
    </button>
  );
  return (
    <Sheet open={!!deal} onClose={onClose} footer={footer} label={deal ? tr(deal.title) : ''}>
      {deal && (
        <>
          <div className="sheet-photo"><img src={deal.img} alt="" onError={hideOnError} /></div>
          <div className="sheet-body">
            <Reveal i={0}>
              <h2 className="sheet-name">{tr(deal.title)}</h2>
              <div className="sheet-facts">
                <span className="price">{money(deal.price)}</span>
                {deal.regular && <s className="fact">{money(deal.regular)}</s>}
                {deal.regular && <span className="tag">{t.save(money(deal.regular - deal.price))}</span>}
                {!deal.regular && deal.saveUpTo && <span className="tag">{t.saveUpTo(money(deal.saveUpTo))}</span>}
              </div>
            </Reveal>
            <Reveal i={1}>
              <div className="block">
                <p className="note-text">{tr(deal.detail)}</p>
                <p className="allergen-note" style={{ marginTop: 10 }}><InfoIcon />{String(deal.from).padStart(2, '0')}:00–{deal.to === 24 ? '24' : String(deal.to).padStart(2, '0')}:00</p>
              </div>
            </Reveal>
          </div>
        </>
      )}
    </Sheet>
  );
}
