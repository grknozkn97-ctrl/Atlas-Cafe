import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { LANGS, detectLang, ui, euro } from '@/data/i18n.js';
import { ingredients } from '@/data/ingredients.js';
import { extras as extrasData, itemsById } from '@/data/menu.js';
import { deals } from '@/data/deals.js';

const safeGet = (k) => { try { return localStorage.getItem(k); } catch { return null; } };
const safeSet = (k, v) => { try { localStorage.setItem(k, v); } catch { /* storage off */ } };

/* ── Language ───────────────────────────────────────── */
const LangCtx = createContext(null);

export function LangProvider({ children }) {
  const [lang, setLangState] = useState(detectLang);
  const setLang = useCallback((l) => { setLangState(l); safeSet('atlas-lang', l); }, []);
  useEffect(() => {
    const meta = LANGS.find((l) => l.code === lang);
    document.documentElement.lang = meta ? meta.html : 'en';
  }, [lang]);
  const value = useMemo(() => {
    const t = ui[lang];
    const tr = (obj) => (obj ? obj[lang] || obj.en : '');
    const itemName = (it) => (it.names && it.names[lang]) || it.name;
    const ingList = (it) => (it.ing || []).map((k) => {
      const [q, key] = k.includes(':') ? k.split(':') : [null, k];
      const word = tr(ingredients[key]);
      return q ? `${q} ${word}` : word;
    });
    const money = (n) => euro(n, lang);
    return { lang, setLang, t, tr, itemName, ingList, money };
  }, [lang, setLang]);
  return <LangCtx.Provider value={value}>{children}</LangCtx.Provider>;
}
export const useLang = () => useContext(LangCtx);

/* ── My list (what the guest wants to order) ────────── */
const ListCtx = createContext(null);
const LIST_KEY = 'atlas-list';
const LIST_TTL = 1000 * 60 * 60 * 6; // a visit, not forever

function loadList() {
  try {
    const raw = JSON.parse(safeGet(LIST_KEY) || 'null');
    if (raw && Date.now() - raw.at < LIST_TTL && Array.isArray(raw.lines)) return raw.lines;
  } catch { /* ignore */ }
  return [];
}

export function lineInfo(line) {
  if (line.kind === 'deal') {
    const d = deals.find((x) => x.id === line.id);
    return d ? { unit: d.price, deal: d } : null;
  }
  const item = itemsById[line.id];
  if (!item) return null;
  const pool = extrasData[item.extrasKey] || [];
  const chosen = pool.filter((x) => line.extras.includes(x.id));
  return { item, chosen, unit: item.price + chosen.reduce((s, x) => s + x.price, 0) };
}

export function ListProvider({ children }) {
  const [lines, setLines] = useState(loadList);
  useEffect(() => { safeSet(LIST_KEY, JSON.stringify({ at: Date.now(), lines })); }, [lines]);

  const add = useCallback((id, kind = 'item', extras = []) => {
    const ex = [...extras].sort();
    const key = `${kind}:${id}:${ex.join(',')}`;
    setLines((ls) => {
      const found = ls.find((l) => l.key === key);
      if (found) return ls.map((l) => (l.key === key ? { ...l, qty: l.qty + 1 } : l));
      return [...ls, { key, id, kind, extras: ex, qty: 1 }];
    });
  }, []);
  const change = useCallback((key, d) => {
    setLines((ls) => ls.map((l) => (l.key === key ? { ...l, qty: l.qty + d } : l)).filter((l) => l.qty > 0));
  }, []);
  const clear = useCallback(() => setLines([]), []);

  const value = useMemo(() => {
    let count = 0; let total = 0;
    const perItem = {};
    for (const l of lines) {
      const info = lineInfo(l);
      if (!info) continue;
      count += l.qty; total += info.unit * l.qty;
      perItem[l.id] = (perItem[l.id] || 0) + l.qty;
    }
    return { lines, add, change, clear, count, total, perItem };
  }, [lines, add, change, clear]);
  return <ListCtx.Provider value={value}>{children}</ListCtx.Provider>;
}
export const useList = () => useContext(ListCtx);

/* ── Podgorica time ─────────────────────────────────── */
export function podgoricaHour() {
  try {
    return Number(new Intl.DateTimeFormat('en-GB', { hour: 'numeric', hour12: false, timeZone: 'Europe/Podgorica' }).format(new Date())) % 24;
  } catch {
    return new Date().getHours();
  }
}
export const isLive = (d, h) => h >= d.from && h < d.to;
