import { useEffect, useState } from 'react';

// The owner's Google Sheet "Atlas Menü - Site Fiyatları" (Drive > Cafe Atlas Sync).
// Columns: A Kod | B Ürün | C Bölüm | D Fiyat (€) | E Bugün yok (X) | F Günün önerisi (X)
// The sheet must be shared as "anyone with the link can view". If it cannot be
// read for any reason, the menu simply uses the prices built into the site.
export const SHEET_ID = '1Ufz3QSL5z_iiGkwFvSUjRRwMCmvNygp3_mYpEtmKPr8';
const URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&gid=0`;

function parseCsv(text) {
  const rows = [];
  let row = []; let cell = ''; let q = false;
  for (let i = 0; i < text.length; i += 1) {
    const c = text[i];
    if (q) {
      if (c === '"' && text[i + 1] === '"') { cell += '"'; i += 1; } else if (c === '"') q = false; else cell += c;
    } else if (c === '"') q = true;
    else if (c === ',') { row.push(cell); cell = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i += 1;
      row.push(cell); rows.push(row); row = []; cell = '';
    } else cell += c;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  return rows;
}

const ticked = (v) => /^(x|✓|✔|yes|evet|da|1|true|doğru|dogru)$/i.test((v || '').trim());

export function parseLive(text) {
  const out = {};
  for (const r of parseCsv(text).slice(1)) {
    const id = (r[0] || '').trim();
    if (!id) continue;
    const raw = (r[3] || '').replace(/[€\s]/g, '').replace(',', '.');
    const price = Number(raw);
    out[id] = {
      price: Number.isFinite(price) && price > 0 ? price : undefined,
      soldOut: ticked(r[4]),
      special: ticked(r[5]),
    };
  }
  return out;
}

export function useLive() {
  const [live, setLive] = useState(null);
  useEffect(() => {
    if (!SHEET_ID) return undefined;
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 5000);
    fetch(URL, { signal: ctrl.signal, cache: 'no-store' })
      .then((r) => (r.ok ? r.text() : Promise.reject(new Error(String(r.status)))))
      .then((t) => { if (!/^\s*</.test(t)) setLive(parseLive(t)); })
      .catch(() => { /* keep built-in menu */ })
      .finally(() => clearTimeout(timer));
    return () => { clearTimeout(timer); ctrl.abort(); };
  }, []);
  return live;
}

// Returns a copy of the menu with the sheet's prices and flags applied.
export function applyLive(sections, live) {
  if (!live) return sections;
  return sections.map((s) => ({
    ...s,
    groups: s.groups.map((g) => ({
      ...g,
      items: g.items.map((it) => {
        const l = live[it.id];
        if (!l) return it;
        return { ...it, price: l.price ?? it.price, soldOut: l.soldOut, special: l.special };
      }),
    })),
  }));
}
