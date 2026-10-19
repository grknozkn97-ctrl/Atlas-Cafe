// Builds the printable Halloween menu (A4, 4 pages, Montenegrin + English)
// straight from the site's menu data, so prices and allergens match exactly.
import { writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const QR = require('qrcode');

// Run: npm i qrcode && node tools/print/gen-halloween-a4.mjs apps/web/public/print/halloween-a4.html
const D = new URL('../../apps/web/src/data/', import.meta.url).href;
const { sections } = await import(D + 'menu.js');
const { ingredients, allergens } = await import(D + 'ingredients.js');
const { deals } = await import(D + 'deals.js');
const { nicknames, featured, tales } = await import(D + 'halloween.js');

const out = process.argv[2];
const SITE = 'https://www.cafeatlas.me';

const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const eur = (n) => n.toFixed(2).replace('.', ',') + ' €';
const meName = (it) => it.names?.me || it.name;
const enName = (it) => it.names?.en || it.name;
const ing = (it, l) => (it.ing || []).map((k) => {
  const [q, key] = k.includes(':') ? k.split(':') : [null, k];
  const w = ingredients[key]?.[l] || key;
  return q ? `${q} ${w}` : w;
}).join(', ');
const desc = (it) => {
  const en = it.ing?.length ? ing(it, 'en') : it.note?.en || '';
  return en;
};
const alg = (it) => (it.al?.length ? `<span class="al">${it.al.join(' · ')}</span>` : '');

const sec = Object.fromEntries(sections.map((s) => [s.id, s]));
const grp = (sid, gid) => sec[sid].groups.find((g) => g.id === gid);

// Featured dishes go first in their group, as on the site.
const ordered = (g) => [...g.items.filter((i) => featured.includes(i.id)), ...g.items.filter((i) => !featured.includes(i.id))];

const pumpkin = (cls = 'pk') => `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 6c-1-2 0-4 2-4" stroke="#6b8f3a" stroke-width="1.6" fill="none" stroke-linecap="round"/><ellipse cx="7.5" cy="14" rx="5.5" ry="7" fill="#e8762c"/><ellipse cx="16.5" cy="14" rx="5.5" ry="7" fill="#e8762c"/><ellipse cx="12" cy="14" rx="5" ry="7.5" fill="#f08a3c"/><path d="M8 12l2 1.6-2 .4zM16 12l-2 1.6 2 .4zM8 17c2 1.6 6 1.6 8 0l-1.3 1.6-1.3-1-1.4 1-1.4-1-1.3 1z" fill="#2a1a0c"/></svg>`;
const bat = `<svg class="bat" viewBox="0 0 22 10" aria-hidden="true"><path d="M0 6 C3 2 6 2 8 5 C9 3 10 3 11 5 C12 3 13 3 14 5 C16 2 19 2 22 6 C19 5 17 6 15 9 C13 8 9 8 7 9 C5 6 3 5 0 6 Z" fill="#efe5cf"/></svg>`;
const web = `<svg class="web" viewBox="0 0 100 100" aria-hidden="true"><g fill="none" stroke="#efe5cf" stroke-width="1"><path d="M0 0L100 100M0 0L100 40M0 0L40 100M0 0L100 0M0 0L0 100"/><path d="M0 22Q14 18 18 4M0 44Q26 38 34 8M0 66Q40 56 52 12"/><path d="M14 30Q24 22 28 14M24 56Q44 44 50 26"/></g></svg>`;

function itemRow(it) {
  const me = meName(it), en = enName(it);
  const nick = nicknames[it.id];
  const d = desc(it);
  const tags = [it.spicy ? '<span class="hot">ljuto · spicy</span>' : '', it.size ? `<span class="sz">${esc(it.size)}</span>` : ''].join('');
  if (featured.includes(it.id)) {
    return `<div class="feat">
      ${it.img ? `<img class="fimg" src="${esc(it.img)}" alt="">` : ''}
      <div class="fbody">
        <div class="ftag">${pumpkin('pk s')}<span>Halloween specijal · special</span></div>
        <div class="line"><span class="nm">${esc(nick.me)}</span><span class="dots"></span><span class="pr">${eur(it.price)}</span></div>
        <div class="fnick">${esc(nick.en)} — ${esc(me)}${en !== me ? ' / ' + esc(en) : ''}</div>
        <div class="tale">${esc(tales[it.id].me)}<br><i>${esc(tales[it.id].en)}</i></div>
        ${d ? `<div class="ds">${esc(d)} ${alg(it)}</div>` : alg(it) ? `<div class="ds">${alg(it)}</div>` : ''}
      </div>
    </div>`;
  }
  return `<div class="it">
    <div class="line"><span class="nm">${esc(me)}</span>${tags}<span class="dots"></span><span class="pr">${eur(it.price)}</span></div>
    ${en !== me ? `<div class="en">${esc(en)}</div>` : ''}
    ${nick ? `<div class="nick">Halloween: ${esc(nick.me)} · ${esc(nick.en)}</div>` : ''}
    ${d || it.al?.length ? `<div class="ds">${esc(d)} ${alg(it)}</div>` : ''}
  </div>`;
}

const group = (sid, gid) => {
  const g = grp(sid, gid);
  const extras = g.extras ? `<div class="extras">Dodaci · Extras: ${esc(extrasLine(g.extras))}</div>` : '';
  return `<section class="grp"><h3><span class="h-me">${esc(g.title.me)}</span>${g.title.en !== g.title.me ? `<span class="h-en">${esc(g.title.en)}</span>` : ''}</h3>${ordered(g).map(itemRow).join('')}${extras}</section>`;
};

const { extras } = await import(D + 'menu.js');
function extrasLine(key) {
  return (extras[key] || []).map((x) => `${x.name.en.replace(/ \d+ g$/, '')} +${x.price.toFixed(2).replace('.', ',')}`).join(' · ');
}

const head = (meT, enT, n) => `
  <header class="ph">
    ${web}
    <div class="brand"><img src="${SITE}/logo.png" alt="Atlas"><div><div class="bn">Atlas Cafe &amp; Bar</div><div class="bs">Halloween meni · menu &nbsp;·&nbsp; do 15. novembra · until 15 November</div></div></div>
    <div class="pt">${pumpkin('pk m')}<div><div class="t1">${meT}</div><div class="t2">${enT}</div></div></div>
    <div class="bats">${bat}${bat}${bat}</div>
  </header>`;

const foot = (n) => `
  <footer class="pf">
    <span>Brojevi = alergeni (EU 1169/2011), lista na str. 4 · Numbers = allergens, list on page 4</span>
    <span>Cijene u eurima · Prices in euro &nbsp;·&nbsp; ${n}/4</span>
  </footer>`;

const page = (label, body, n, meT, enT, cls = '', extra = '') => `
<div class="page ${cls}" data-document-role="page" data-label="${esc(label)}">
  ${head(meT, enT, n)}
  <main class="cols">${body}</main>
  ${extra}
  ${foot(n)}
</div>`;

// ── Pages ──
const dealCard = (d) => `
  <div class="deal">
    <div class="dt">${esc(d.title.me)}</div>
    <div class="en">${esc(d.title.en)}</div>
    <div class="ds">${esc(d.detail.me)}<br><i>${esc(d.detail.en)}</i></div>
    <div class="dp"><span class="pr">${eur(d.price)}</span>${d.regular ? ` <s>${eur(d.regular)}</s>` : ''}<span class="hrs">${String(d.from).padStart(2, '0')}–${String(d.to).padStart(2, '0')} h</span></div>
    ${d.regular ? `<div class="save">−${eur(d.regular - d.price)}</div>` : d.saveUpTo ? `<div class="save sm">do · up to −${eur(d.saveUpTo)}</div>` : ''}
  </div>`;

const strip = `<section class="strip"><h3><span class="h-me">Ponude dana</span><span class="h-en">Daily deals</span></h3><div class="deals">${deals.map(dealCard).join('')}</div></section>`;

const p1 = page('Kuhinja · Kitchen', `
  <div class="col">${['breakfast', 'toast'].map((g) => group('kitchen', g)).join('')}</div>
  <div class="col">${['sandwich', 'snacks', 'pasta'].map((g) => group('kitchen', g)).join('')}</div>`, 1, 'Kuhinja', 'Kitchen', '', strip);

const p2 = page('Kuhinja i desert · Kitchen & dessert', `
  <div class="col">${['chicken', 'meat', 'salad'].map((g) => group('kitchen', g)).join('')}</div>
  <div class="col">${['burger', 'pizza', 'wrap'].map((g) => group('kitchen', g)).join('')}${group('dessert', 'dessert-sub')}</div>`, 2, 'Kuhinja · Desert', 'Kitchen · Dessert');

const p3 = page('Pića · Drinks', `
  <div class="col">${['hot-coffee', 'cold-coffee', 'hot-drink'].map((g) => group('drinks', g)).join('')}</div>
  <div class="col">${['soft-drinks', 'frozen', 'milkshake'].map((g) => group('drinks', g)).join('')}</div>`, 3, 'Pića', 'Drinks');

const qrSvg = await QR.toString(SITE + '/', { type: 'svg', margin: 0, errorCorrectionLevel: 'M', color: { dark: '#15110e', light: '#efe5cf' } });
const legend = Object.entries(allergens).map(([n, a]) => `<li><span class="lnum">${n}</span><span class="lme">${esc(a.me)}</span>${a.en !== a.me ? `<span class="len">${esc(a.en)}</span>` : ''}</li>`).join('');

const p4 = page('Bar', `
  <div class="col">${['cocktail', 'beer'].map((g) => group('bar', g)).join('')}</div>
  <div class="col">${['wine', 'spirits'].map((g) => group('bar', g)).join('')}
    <div class="note">Alkohol samo za osobe starije od 18 godina · Alcohol served to guests over 18 only</div>
    <section class="grp legendbox"><h3><span class="h-me">Alergeni</span><span class="h-en">Allergens</span></h3>
      <ul class="legend">${legend}</ul>
      <p class="small">Prema EU uredbi 1169/2011. Ako imate alergiju, recite konobaru. · EU Regulation 1169/2011. If you have an allergy, please tell your waiter.</p>
    </section>
    <section class="qrbox">
      <div class="qr">${qrSvg}</div>
      <div>
        <div class="qt">Kompletan meni na telefonu</div>
        <div class="qe">Full menu on your phone</div>
        <p class="small">Sastojci, alergeni i dnevne ponude, na 5 jezika. · Ingredients, allergens and today's picks, in 5 languages.</p>
        <p class="url">cafeatlas.me</p>
      </div>
    </section>
    <section class="info">
      <p><b>Atlas Cafe &amp; Bar</b> · Hercegovačka 7, Podgorica</p>
      <p>Pon–Sub · Mon–Sat 09–21 h &nbsp;·&nbsp; Nedjelja zatvoreno · Sunday closed</p>
      <p>Instagram @atlascafefoodbar &nbsp;·&nbsp; ★ 4,9 Google</p>
    </section>
  </div>`, 4, 'Bar', 'Bar');

const css = `
@page { size: A4; margin: 0; }
* { box-sizing: border-box; margin: 0; padding: 0; }
html, body { background: #0c0a08; }
body { font-family: 'Figtree', Arial, sans-serif; color: #efe5cf; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
.page { width: 794px; height: 1123px; margin: 0 auto 24px; position: relative; overflow: hidden; background: #15110e; padding: 28px 38px 0; display: flex; flex-direction: column; }
@media print { body { background: none; } .page { margin: 0; page-break-after: always; } }
.ph { position: relative; display: flex; align-items: center; justify-content: space-between; padding-bottom: 11px; border-bottom: 2px solid #e8762c; }
.ph .web { position: absolute; left: -38px; top: -34px; width: 120px; height: 120px; opacity: .22; }
.brand { display: flex; align-items: center; gap: 12px; position: relative; }
.brand img { width: 30px; height: 49px; }
.bn { font-family: 'Gloock', Georgia, serif; font-size: 25px; line-height: 1.05; color: #efe5cf; }
.bs { font-size: 10.5px; letter-spacing: .06em; text-transform: uppercase; color: #f4a45c; margin-top: 3px; }
.pt { display: flex; align-items: center; gap: 10px; text-align: right; }
.pt .t1 { font-family: 'Gloock', Georgia, serif; font-size: 32px; line-height: 1; color: #e8762c; }
.pt .t2 { font-size: 12px; letter-spacing: .14em; text-transform: uppercase; color: #a89a82; margin-top: 4px; }
.pk.m { width: 34px; height: 34px; }
.pk.s { width: 12px; height: 12px; vertical-align: -2px; }
.pk.xs { width: 10px; height: 10px; vertical-align: -1px; }
.bats { position: absolute; right: 190px; top: -14px; display: flex; gap: 14px; opacity: .5; }
.bat { width: 22px; height: 10px; }
.bats .bat:nth-child(2) { width: 16px; margin-top: 10px; }
.bats .bat:nth-child(3) { width: 12px; margin-top: 2px; }
.cols { flex: 1; min-height: 0; display: flex; gap: 30px; padding-top: 11px; }
.col { flex: 1; min-width: 0; }
.grp { margin-bottom: 9px; }
.grp h3 { display: flex; align-items: baseline; gap: 9px; font-weight: 400; border-bottom: 1px solid #4a3d30; padding-bottom: 3px; margin-bottom: 5px; }
.h-me { font-family: 'Gloock', Georgia, serif; font-weight: 400; font-size: 18.5px; color: #efe5cf; }
.h-en { font-family: 'Figtree', Arial, sans-serif; font-size: 10px; letter-spacing: .14em; text-transform: uppercase; color: #a89a82; }
.it { margin-bottom: 5px; }
.line { display: flex; align-items: baseline; gap: 5px; }
.nm { font-weight: 700; font-size: 13px; color: #efe5cf; }
.dots { flex: 1; border-bottom: 1px dotted #5c4d3d; transform: translateY(-3px); min-width: 10px; }
.pr { font-weight: 700; font-size: 13px; color: #f4a45c; white-space: nowrap; }
.sz { padding-left: 3px; font-size: 9.6px; color: #a89a82; white-space: nowrap; }
.hot { padding-left: 3px; font-size: 8.5px; font-weight: 700; color: #ff7a59; text-transform: uppercase; letter-spacing: .05em; white-space: nowrap; }
.en { font-size: 10.8px; color: #c9bba0; font-style: italic; line-height: 1.25; }
.ds { font-size: 10px; color: #a89a82; line-height: 1.3; }
.al { color: #f4a45c; font-weight: 700; font-size: 9.2px; white-space: nowrap; }
.al::before { content: 'A '; font-weight: 400; opacity: .8; }
.nick { font-size: 10.2px; color: #e8762c; font-weight: 600; }
.extras { font-size: 9.6px; color: #a89a82; border-left: 2px solid #4a3d30; padding-left: 6px; margin-top: 4px; line-height: 1.3; }
.feat { display: flex; gap: 9px; background: #2a1a0f; border: 1.5px solid #e8762c; border-radius: 8px; padding: 7px 9px 7px 7px; margin: 3px 0 7px; }
.fimg { width: 58px; height: 58px; border-radius: 6px; object-fit: cover; flex: none; background: #3a2616; }
.fbody { flex: 1; min-width: 0; }
.ftag { display: flex; align-items: center; gap: 4px; font-size: 8.5px; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; color: #e8762c; margin-bottom: 2px; }
.feat .nm { font-family: 'Gloock', Georgia, serif; font-weight: 400; font-size: 16.5px; color: #f4a45c; }
.feat .pr { font-size: 13px; }
.fnick { font-size: 10.2px; color: #efe5cf; font-weight: 600; margin: 1px 0 2px; }
.tale { font-size: 9.8px; color: #c9bba0; line-height: 1.3; margin-bottom: 2px; }
.strip { border-top: 2px solid #e8762c; padding-top: 6px; margin-top: 2px; }
.strip h3 { display: flex; align-items: baseline; gap: 9px; font-weight: 400; margin-bottom: 4px; }
.deals { display: flex; gap: 10px; }
.deal { flex: 1; position: relative; border: 1.5px solid #e8762c; border-radius: 9px; padding: 8px 9px; background: #2a1a0f; }
.dt { font-family: 'Gloock', Georgia, serif; font-size: 15px; color: #f4a45c; line-height: 1.1; padding-right: 34px; }
.deal .ds { margin-top: 2px; font-size: 9px; line-height: 1.25; }
.dp { display: flex; align-items: baseline; gap: 6px; margin-top: 5px; }
.dp .pr { font-size: 15px; }
.dp s { font-size: 10px; color: #a89a82; }
.hrs { margin-left: auto; font-size: 9px; font-weight: 700; color: #15110e; background: #e8762c; border-radius: 10px; padding: 1px 7px; }
.save { position: absolute; top: -9px; right: -6px; background: #e8762c; color: #15110e; font-weight: 800; font-size: 10.5px; border-radius: 12px; padding: 3px 7px; transform: rotate(6deg); }
.save.sm { font-size: 8.5px; }
.legend { list-style: none; display: flex; flex-wrap: wrap; }
.legend li { width: 50%; display: flex; align-items: center; gap: 6px; margin-bottom: 4px; }
.lnum { width: 18px; height: 18px; flex: none; border-radius: 9px; background: #e8762c; color: #15110e; font-size: 9px; font-weight: 700; display: flex; align-items: center; justify-content: center; }
.lme { font-size: 10px; color: #efe5cf; }
.len { font-size: 9px; color: #a89a82; font-style: italic; }
.small { font-size: 9px; color: #a89a82; line-height: 1.35; margin-top: 7px; }
.note { font-size: 9px; color: #a89a82; margin: 6px 0 12px; }
.qrbox { display: flex; gap: 14px; align-items: center; background: #1f1914; border: 1.5px solid #e8762c; border-radius: 10px; padding: 12px; margin: 6px 0 12px; }
.qr { width: 110px; height: 110px; flex: none; background: #efe5cf; padding: 7px; border-radius: 6px; }
.qr svg { width: 96px; height: 96px; display: block; }
.qt { font-family: 'Gloock', Georgia, serif; font-size: 17px; color: #f4a45c; }
.qe { font-size: 10px; letter-spacing: .12em; text-transform: uppercase; color: #a89a82; }
.url { font-weight: 700; font-size: 13px; margin-top: 5px; color: #efe5cf; }
.info p { font-size: 10px; color: #c9bba0; line-height: 1.6; }
.pf { display: flex; justify-content: space-between; font-size: 8.5px; color: #8a7c66; border-top: 1px solid #3a3027; padding: 7px 0 14px; margin-top: 4px; }
`;

const html = `<!doctype html>
<html lang="sr-Latn-ME">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>Atlas Cafe &amp; Bar — Halloween meni (A4)</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Figtree:wght@400;600;700&family=Gloock&display=swap" rel="stylesheet">
<style>${css}</style>
</head>
<body>
${p1}${p2}${p3}${p4}
</body>
</html>`;

writeFileSync(out, html);
console.log('wrote', out, html.length);
