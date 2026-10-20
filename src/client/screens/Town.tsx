import { useEffect, useMemo, useRef, useState } from 'react';
import { formatGameDate } from '../../shared/constants';
import { localPoll } from '../../shared/local';
import { COVER_LABELS, SERVICES, ZONES, analyze, idx, type Analysis } from '../../shared/city';
import {
  FAVOR_COOLDOWN,
  NETWORK,
  NETWORK_IDS,
  RANKS,
  RANK_ORDER,
  TOWN_ACTIONS,
  campaignChance,
  contactThreshold,
  favorEffect,
  fmt,
  nextRank,
  requirements,
  serviceNetwork,
  MAX_CONTACTS_PER_GROUP,
} from '../../shared/town';
import type { City, ClientMessage, CountryState, CoverKind, NetworkId, Party, PlayerView, ServiceId, Town } from '../../shared/types';
import { Avatar } from '../ui/Avatar';
import { CityEditor, type CityEditorHandle, type Overlay, type Tool } from '../ui/CityEditor';
import { isNight } from '../ui/City3D';
import { ProvinceMap } from '../ui/ProvinceMap';
import { Meter, PartyBadge } from '../ui/Widgets';
import { GovWatch, News, OppositionView, PollsCard } from './Politics';
import { ProvincesPanel } from './Provinces';

type Send = (m: ClientMessage) => void;

const money = (n: number) => (Math.abs(n) >= 1000 ? `${(n / 1000).toFixed(1).replace('.', ',')} milyon ₺` : `${Math.floor(n)} bin ₺`);

// ---------------------------------------------------------------- kaynak çubuğu

function ResourceBar({ t, me }: { t: Town; me: PlayerView }) {
  const st = t.city.stats;
  const powerOk = st.powerProd >= st.powerUse;
  const waterOk = st.waterProd >= st.waterUse;
  const items = [
    { icon: '💰', label: 'Kasa', value: money(t.money), sub: `${st.net >= 0 ? '+' : '−'}${fmt(Math.abs(Math.round(st.net)))}/gün`, tone: t.money < 0 || st.net < 0 ? 'bad' : '' },
    { icon: '👥', label: 'Nüfus', value: fmt(t.pop), sub: `${fmt(Math.round(st.jobs))} iş`, tone: '' },
    { icon: t.happiness >= 60 ? '😊' : t.happiness >= 45 ? '😐' : '😠', label: 'Memnuniyet', value: `%${Math.round(t.happiness)}`, sub: 'memnuniyet', tone: t.happiness < 45 ? 'bad' : '' },
    { icon: '⚡', label: 'Elektrik', value: `${Math.round(st.powerUse)}/${Math.round(st.powerProd)} MW`, sub: powerOk ? 'yeterli' : 'yetersiz!', tone: powerOk ? '' : 'bad' },
    { icon: '💧', label: 'Su', value: `${Math.round(st.waterUse)}/${Math.round(st.waterProd)} m³`, sub: waterOk ? 'yeterli' : 'yetersiz!', tone: waterOk ? '' : 'bad' },
    { icon: '⭐', label: 'Nüfuz', value: `${Math.floor(t.influence)}`, sub: 'nüfuz', tone: '' },
    { icon: '📣', label: 'Tanınırlık', value: `${Math.round(me.fame)}`, sub: me.membership && !me.partyId ? `parti güveni ${Math.round(me.membership.trust)}` : 'tanınırlık', tone: '' },
  ];
  return (
    <div className="resbar">
      {items.map((x) => (
        <div key={x.label} className={`res ${x.tone}`} title={x.label}>
          <span className="res-icon">{x.icon}</span>
          <span className="res-text">
            <b>{x.value}</b>
            <span className="small muted">{x.sub}</span>
          </span>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------- araç çubuğu

const ZONE_ICONS = ['⬜', '🏠', '🏬', '🏭', '🏢'];
const ZONE_HELP = ['Bölge işaretini kaldırır.', 'Evler ve apartmanlar: nüfus ve konut vergisi.', 'Dükkân ve marketler: halkın alışverişi, iş.', 'Fabrikalar: çok iş, ama kirlilik.', 'Ofis kuleleri: temiz ve kârlı, eğitim ister.'];
const ZONE_SOURCES: Partial<Record<NetworkId, string[]>> = { esnaf: ['ticaret bölgeleri'], isDunyasi: ['sanayi ve ofis bölgeleri'], sendika: ['sanayi bölgeleri'] };

const GROUPS: { id: string; icon: string; label: string; items: ServiceId[] }[] = [
  { id: 'saglik', icon: '🏥', label: 'Sağlık', items: ['saglikOcagi', 'hastane'] },
  { id: 'guvenlik', icon: '🚓', label: 'Güvenlik', items: ['polis', 'itfaiye'] },
  { id: 'egitim', icon: '🎓', label: 'Eğitim', items: ['okul', 'universite'] },
  { id: 'park', icon: '🌳', label: 'Park', items: ['park', 'buyukPark'] },
  { id: 'elektrik', icon: '⚡', label: 'Elektrik', items: ['komur', 'gunes', 'ruzgar'] },
  { id: 'su', icon: '💧', label: 'Su', items: ['suPompasi'] },
  { id: 'siyaset', icon: '🚩', label: 'Siyaset', items: ['meydan', 'basin', 'parti'] },
];

const OVERLAYS: { id: Overlay; icon: string; label: string }[] = [
  { id: null, icon: '🏙️', label: 'Normal' },
  { id: 'power', icon: '⚡', label: 'Elektrik' },
  { id: 'water', icon: '💧', label: 'Su' },
  { id: 'saglik', icon: '🏥', label: 'Sağlık' },
  { id: 'polis', icon: '🚓', label: 'Güvenlik' },
  { id: 'itfaiye', icon: '🚒', label: 'İtfaiye' },
  { id: 'egitim', icon: '🎓', label: 'Eğitim' },
  { id: 'park', icon: '🌳', label: 'Yeşil alan' },
  { id: 'pollution', icon: '🏭', label: 'Kirlilik' },
  { id: 'value', icon: '💎', label: 'Arazi değeri' },
  { id: 'happy', icon: '😊', label: 'Mutluluk' },
];

function Demand({ d }: { d: City['stats']['demand'] }) {
  return (
    <div className="rci" title="Talep: çubuk yukarıdaysa o bölgeden daha fazla aç.">
      {d.map((v, k) => (
        <div key={k} className="rci-col">
          <div className="rci-bar">
            <div className="rci-fill" style={{ height: `${Math.abs(v) * 50}%`, bottom: v >= 0 ? '50%' : undefined, top: v < 0 ? '50%' : undefined, background: ZONES[k + 1].color, opacity: v >= 0 ? 1 : 0.4 }} />
          </div>
          <span>{ZONES[k + 1].short}</span>
        </div>
      ))}
    </div>
  );
}

function ToolBar({ tool, setTool, t }: { tool: Tool; setTool: (t: Tool) => void; t: Town }) {
  const [open, setOpen] = useState<string | null>(null);
  const pick = (x: Tool) => {
    setTool(x);
    setOpen(null);
  };
  const same = (a: Tool, b: Tool) => JSON.stringify(a) === JSON.stringify(b);
  const group = GROUPS.find((g) => g.id === open);
  return (
    <div className="city-tools">
      {open === 'bolge' && (
        <div className="tool-menu">
          {[1, 2, 3, 4, 0].map((z) => (
            <button key={z} className={`tool-card ${tool.kind === 'zone' && tool.zone === z ? 'on' : ''}`} onClick={() => pick({ kind: 'zone', zone: z })} style={{ ['--zc' as string]: z ? ZONES[z].color : '#999' }}>
              <span className="tc-icon">{ZONE_ICONS[z]}</span>
              <b>{z ? ZONES[z].label : 'İmarı kaldır'}</b>
              <span className="small muted">{ZONE_HELP[z]}</span>
            </button>
          ))}
        </div>
      )}
      {group && (
        <div className="tool-menu">
          {group.items.map((id) => {
            const sp = SERVICES[id];
            const poor = t.money < sp.cost;
            return (
              <button key={id} className={`tool-card ${tool.kind === 'place' && tool.service === id ? 'on' : ''}`} disabled={poor} onClick={() => pick({ kind: 'place', service: id })}>
                <span className="tc-icon">{sp.icon}</span>
                <b>{sp.label}</b>
                <span className="small muted">{sp.desc}</span>
                <span className="small">
                  💰 {fmt(sp.cost)} bin ₺ · bakım {sp.upkeep}/gün
                  {sp.power ? ` · ⚡ ${sp.power} MW` : ''}
                  {sp.water ? ` · 💧 ${sp.water} m³` : ''}
                  {sp.size > 1 ? ` · ${sp.size}×${sp.size}` : ''}
                </span>
              </button>
            );
          })}
        </div>
      )}
      <div className="tool-row">
        <button className={tool.kind === 'inspect' ? 'on' : ''} onClick={() => pick({ kind: 'inspect' })} title="Seç ve incele (Esc)">
          <span>🔍</span>
          <small>İncele</small>
        </button>
        <button className={tool.kind === 'road' ? 'on' : ''} onClick={() => pick({ kind: 'road' })} title="Sürükleyerek yol çiz">
          <span>🛣️</span>
          <small>Yol</small>
        </button>
        <button className={tool.kind === 'zone' || open === 'bolge' ? 'on' : ''} onClick={() => setOpen(open === 'bolge' ? null : 'bolge')}>
          <span>🗺️</span>
          <small>Bölge</small>
        </button>
        {GROUPS.map((g) => (
          <button key={g.id} className={open === g.id || (tool.kind === 'place' && g.items.includes(tool.service)) ? 'on' : ''} onClick={() => setOpen(open === g.id ? null : g.id)}>
            <span>{g.icon}</span>
            <small>{g.label}</small>
          </button>
        ))}
        <button className={`danger-tool ${tool.kind === 'bulldoze' ? 'on' : ''}`} onClick={() => pick({ kind: 'bulldoze' })} title="Sürükleyerek yık">
          <span>🧨</span>
          <small>Yık</small>
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- inceleme paneli

const LEVEL_NAMES: Record<number, string[]> = {
  1: ['', 'Müstakil ev', 'Bahçeli ikiz ev', 'Apartman', 'Rezidans kulesi'],
  2: ['', 'Mahalle bakkalı', 'Dükkânlar', 'Alışveriş merkezi', 'Ticaret kulesi'],
  3: ['', 'Atölye', 'Fabrika', 'Büyük tesis', 'Organize sanayi'],
  4: ['', 'Küçük ofis', 'İş merkezi', 'Plaza', 'Gökdelen'],
};

function Check({ ok, label, value }: { ok: boolean; label: string; value?: string }) {
  return (
    <li className={ok ? 'ok' : 'bad'}>
      <span>{ok ? '✅' : '⚠️'}</span> {label} {value && <span className="muted small">{value}</span>}
    </li>
  );
}

function ContactRow({ k, t, day, send }: { k: Town['contacts'][number]; t: Town; day: number; send: Send }) {
  const wait = Math.max(0, k.readyDay - day);
  const fx = favorEffect(k.group, t);
  return (
    <div className="contact">
      <Avatar a={k.avatar} size={40} ring={NETWORK[k.group].color} />
      <div className="contact-body">
        <b>{k.name}</b>
        <span className="small muted">{k.title}</span>
        <div className="loyal small">
          sadakat <Meter value={k.loyalty} color={NETWORK[k.group].color} />
        </div>
      </div>
      <button className="small" disabled={wait > 0} onClick={() => send({ type: 'townFavor', contactId: k.id })} title={NETWORK[k.group].favor}>
        {wait > 0 ? `⏳ ${wait} gün` : `İyilik iste`}
        <span className="small muted">{fx.text}</span>
      </button>
    </div>
  );
}

function ServiceInfo({ t, a, i, day, send }: { t: Town; a: Analysis; i: number; day: number; send: Send }) {
  const c = t.city;
  const s = c.services[c.occ[i] - 1];
  const sp = SERVICES[s.type];
  const actions = TOWN_ACTIONS[s.type] ?? [];
  const g = serviceNetwork(s.type);
  const contacts = g ? t.contacts.filter((k) => k.group === g) : [];
  let road = false;
  for (let y = s.y - 1; y <= s.y + sp.size; y++)
    for (let x = s.x - 1; x <= s.x + sp.size; x++) if (x >= 0 && y >= 0 && x < c.n && y < c.n && a.connected[idx(c, x, y)]) road = true;
  return (
    <>
      <h3>
        {sp.icon} {sp.label}
      </h3>
      <p className="small">{sp.desc}</p>
      <ul className="checks small">
        <Check ok={road} label={road ? 'Yol ağına bağlı' : 'Otoyola bağlı yol yok: çalışmıyor'} />
        <li>
          <span>💸</span> Bakım {Math.round(sp.upkeep * (sp.cover ? c.budget.svc[sp.cover] : 1))} bin ₺/gün
        </li>
        {sp.cover && sp.radius && (
          <li>
            <span>📡</span> {COVER_LABELS[sp.cover]} kapsamı: {Math.round(sp.radius * Math.sqrt(c.budget.svc[sp.cover]))} karo yarıçap
          </li>
        )}
        {sp.power && (
          <li>
            <span>⚡</span> {sp.power} MW elektrik
          </li>
        )}
        {sp.water && (
          <li>
            <span>💧</span> {sp.water} m³ su
          </li>
        )}
        {sp.pollution && (
          <li className="bad">
            <span>🏭</span> Çevresini kirletir
          </li>
        )}
        {sp.influence && (
          <li>
            <span>⭐</span> Günde +{sp.influence} nüfuz
          </li>
        )}
      </ul>
      {actions.length > 0 && (
        <div className="bactions">
          <h4>Burada yapabileceklerin</h4>
          {actions.map((x) => {
            const key = `${s.type}:${x.id}`;
            const wait = Math.max(0, (t.cooldowns[key] ?? 0) - day);
            const cant = (x.money ?? 0) > t.money || (x.influence ?? 0) > t.influence;
            return (
              <button key={x.id} className="baction" disabled={wait > 0 || cant} onClick={() => send({ type: 'townAction', building: s.type, action: x.id })}>
                <b>{x.label}</b>
                <span className="small muted">{x.desc}</span>
                <span className="small">
                  {x.money ? `💰 ${x.money} bin ₺ ` : ''}
                  {x.influence ? `⭐ ${x.influence} nüfuz ` : ''}
                  {wait > 0 ? `· ⏳ ${wait} gün` : ''}
                </span>
              </button>
            );
          })}
        </div>
      )}
      {g && (
        <div className="bnet">
          <h4>
            {NETWORK[g].icon} {NETWORK[g].label} çevren
          </h4>
          {contacts.length ? contacts.map((k) => <ContactRow key={k.id} k={k} t={t} day={day} send={send} />) : <p className="small muted">Bu bina zamanla sana bu kesimden tanıdıklar kazandırır.</p>}
        </div>
      )}
      {!sp.fixed && (
        <button className="ghost small danger-text" onClick={() => send({ type: 'cityPaint', tool: 'bulldoze', cells: [i] })}>
          🧨 Yık ({fmt(sp.cost / 2)} bin ₺ geri döner)
        </button>
      )}
    </>
  );
}

function CellInfo({ t, a, i, day, send }: { t: Town; a: Analysis; i: number; day: number; send: Send }) {
  const c = t.city;
  if (c.occ[i]) return <ServiceInfo t={t} a={a} i={i} day={day} send={send} />;
  if (c.road[i])
    return (
      <>
        <h3>🛣️ {c.terrain[i] ? 'Köprü' : 'Yol'}</h3>
        <ul className="checks small">
          <Check ok={!!a.connected[i]} label={a.connected[i] ? 'Otoyola bağlı' : 'Otoyola bağlı değil: araçlar ulaşamaz, bölgeler gelişmez'} />
        </ul>
        <button className="ghost small danger-text" onClick={() => send({ type: 'cityPaint', tool: 'bulldoze', cells: [i] })}>
          🧨 Yolu kaldır
        </button>
      </>
    );
  if (c.terrain[i]) return <h3>🌊 Su</h3>;
  const z = c.zone[i];
  if (!z)
    return (
      <>
        <h3>🌾 Boş arazi</h3>
        <p className="small muted">Bölge aracıyla burayı imara açabilir ya da hizmet binası kurabilirsin. Bölgeler yola en fazla 3 karo uzaklıkta olmalı.</p>
      </>
    );
  const L = c.lvl[i];
  const pct = (v: number) => `%${Math.round(v * 100)}`;
  return (
    <>
      <h3>
        {ZONE_ICONS[z]} {L ? LEVEL_NAMES[z][L] : `${ZONES[z].label} bölgesi (boş)`}
      </h3>
      <p className="small muted">
        {ZONES[z].label} · {L ? `${L}. seviye` : 'talep varsa burada bina yükselecek'}
      </p>
      <ul className="checks small">
        <Check ok={!!a.access[i]} label="Yol erişimi" />
        <Check ok={!!a.power[i]} label="Elektrik" />
        <Check ok={!!a.water[i]} label="Su" />
        <Check ok={a.cover.saglik[i] > 0.2} label="Sağlık" value={pct(a.cover.saglik[i])} />
        <Check ok={a.cover.polis[i] > 0.2} label="Güvenlik" value={pct(a.cover.polis[i])} />
        <Check ok={a.cover.itfaiye[i] > 0.2} label="İtfaiye" value={pct(a.cover.itfaiye[i])} />
        <Check ok={a.cover.egitim[i] > 0.2} label="Eğitim" value={pct(a.cover.egitim[i])} />
        <Check ok={a.pollution[i] < 0.25} label="Kirlilik" value={pct(a.pollution[i])} />
      </ul>
      <div className="small">
        Arazi değeri <Meter value={a.value[i]} color="#8e7cc3" />
      </div>
      {L > 0 && z === 1 && (
        <div className="small">
          Mutluluk <Meter value={a.happy[i]} color="#4caf50" />
        </div>
      )}
      <p className="small muted">Bina, arazi değeri arttıkça büyür. Değeri sağlık, güvenlik, eğitim ve parklar artırır; kirlilik düşürür.</p>
      <button className="ghost small danger-text" onClick={() => send({ type: 'cityPaint', tool: 'bulldoze', cells: [i] })}>
        🧨 Yık ve imarı kaldır
      </button>
    </>
  );
}

function Overview({ t }: { t: Town }) {
  const c = t.city;
  const st = c.stats;
  const has = (k: ServiceId[]) => c.services.some((s) => k.includes(s.type));
  const zoned = (z: number) => c.zone.some((x) => x === z);
  const roads = c.road.reduce((s, x) => s + x, 0);
  const steps = [
    { ok: roads > 24, text: 'Otoyoldan şehre yol çiz' },
    { ok: zoned(1), text: 'Yolun yanına konut bölgesi aç' },
    { ok: has(['komur', 'gunes', 'ruzgar']), text: 'Santral kur (elektrik)' },
    { ok: has(['suPompasi']), text: 'Nehir kıyısına su pompası kur' },
    { ok: zoned(2) && zoned(3), text: 'Ticaret ve sanayi bölgesi aç (iş)' },
    { ok: has(['saglikOcagi', 'hastane']) && has(['polis']) && has(['itfaiye']), text: 'Sağlık, karakol, itfaiye kur' },
    { ok: has(['okul', 'universite']), text: 'Okul kur, ofis bölgelerini aç' },
  ];
  const next = nextRank(t.rank);
  return (
    <>
      <h3>🏙️ {t.name}</h3>
      <div className="ov-grid small">
        <span>Nüfus</span>
        <b>{fmt(st.pop)}</b>
        <span>İş yeri</span>
        <b>{fmt(Math.round(st.jobs))}</b>
        <span>Bina</span>
        <b>{st.buildings}</b>
        <span>Günlük gelir</span>
        <b className={st.net >= 0 ? 'good' : 'bad'}>
          {st.net >= 0 ? '+' : '−'}
          {fmt(Math.abs(Math.round(st.net)))} bin ₺
        </b>
      </div>
      <div className="small">
        ⚡ Elektrik {Math.round(st.powerUse)}/{Math.round(st.powerProd)} MW
        <Meter value={st.powerProd ? (st.powerUse / st.powerProd) * 100 : 100} color={st.powerUse > st.powerProd ? '#e53935' : '#f2b705'} />
        💧 Su {Math.round(st.waterUse)}/{Math.round(st.waterProd)} m³
        <Meter value={st.waterProd ? (st.waterUse / st.waterProd) * 100 : 100} color={st.waterUse > st.waterProd ? '#e53935' : '#2f80ed'} />
      </div>
      <h4>Yapılacaklar</h4>
      <ul className="checks small">
        {steps.map((s) => (
          <li key={s.text} className={s.ok ? 'ok' : ''}>
            <span>{s.ok ? '✅' : '⬜'}</span> {s.text}
          </li>
        ))}
      </ul>
      {next && <p className="small muted">Sıradaki hedefin: {RANKS[next].icon} {RANKS[next].label}. Kariyer sekmesinde şartları gör.</p>}
      <h4>Son olaylar</h4>
      <ul className="tlog">
        {t.log.slice(0, 5).map((l, i) => (
          <li key={i} className={`small ${l.kind}`}>
            <span className="muted">{formatGameDate(l.day, false)}</span> {l.text}
          </li>
        ))}
      </ul>
    </>
  );
}

// ---------------------------------------------------------------- bütçe

function Slider({ label, value, min, max, step, fmtV, onChange, hint }: { label: string; value: number; min: number; max: number; step: number; fmtV: (v: number) => string; onChange: (v: number) => void; hint?: string }) {
  return (
    <label className="bslider">
      <div className="slider-head small">
        <span>{label}</span>
        <b>{fmtV(value)}</b>
      </div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} />
      {hint && <span className="small muted">{hint}</span>}
    </label>
  );
}

function BudgetPanel({ t, send }: { t: Town; send: Send }) {
  const b = t.city.budget;
  const st = t.city.stats;
  const tax = (k: number, v: number) => {
    const next = [...b.tax] as City['budget']['tax'];
    next[k] = v;
    send({ type: 'cityBudget', tax: next });
  };
  const income = st.income.reduce((s, x) => s + x.value, 0);
  const expense = st.expense.reduce((s, x) => s + x.value, 0);
  return (
    <>
      <h3>💼 Bütçe ve vergiler</h3>
      <div className="ov-grid small">
        <span>Gelir</span>
        <b className="good">+{fmt(Math.round(income))}/gün</b>
        <span>Gider</span>
        <b className="bad">−{fmt(Math.round(expense))}/gün</b>
        <span>Net</span>
        <b className={st.net >= 0 ? 'good' : 'bad'}>
          {st.net >= 0 ? '+' : '−'}
          {fmt(Math.abs(Math.round(st.net)))}/gün
        </b>
      </div>
      <h4>Vergi oranları</h4>
      {[0, 1, 2, 3].map((k) => (
        <Slider key={k} label={`${ZONE_ICONS[k + 1]} ${ZONES[k + 1].label}`} value={b.tax[k]} min={1} max={29} step={1} fmtV={(v) => `%${v}`} onChange={(v) => tax(k, v)} hint={k === 0 ? '%10 üstü her puan talebi ve mutluluğu düşürür.' : undefined} />
      ))}
      <h4>Su ve elektrik fiyatı</h4>
      <Slider label="⚡ Elektrik fiyatı" value={b.power} min={0.5} max={2} step={0.05} fmtV={(v) => `${Math.round(v * 100)}%`} onChange={(v) => send({ type: 'cityBudget', power: v })} hint="Pahalı elektrik geliri artırır, halkı kızdırır ve tüketimi azaltır." />
      <Slider label="💧 Su fiyatı" value={b.water} min={0.5} max={2} step={0.05} fmtV={(v) => `${Math.round(v * 100)}%`} onChange={(v) => send({ type: 'cityBudget', water: v })} />
      <h4>Hizmet bütçeleri</h4>
      {(Object.keys(COVER_LABELS) as CoverKind[]).map((k) => (
        <Slider key={k} label={COVER_LABELS[k]} value={b.svc[k]} min={0.5} max={1.5} step={0.05} fmtV={(v) => `%${Math.round(v * 100)}`} onChange={(v) => send({ type: 'cityBudget', svc: { [k]: v } })} />
      ))}
      <p className="small muted">Bütçeyi artırmak kapsama alanını genişletir ama bakım masrafını artırır.</p>
      <h4>Kalem kalem</h4>
      <ul className="ledger small">
        {st.income.filter((x) => x.value > 0.5).map((x) => (
          <li key={x.label}>
            <span>{x.label}</span>
            <b className="good">+{fmt(Math.round(x.value))}</b>
          </li>
        ))}
        {st.expense.filter((x) => x.value > 0.5).map((x) => (
          <li key={x.label}>
            <span>{x.label}</span>
            <b className="bad">−{fmt(Math.round(x.value))}</b>
          </li>
        ))}
      </ul>
    </>
  );
}

// ---------------------------------------------------------------- şehir sekmesi

function CityTab({ t, me, day, send, party, night }: { t: Town; me: PlayerView; day: number; send: Send; party: Party | null; night: boolean }) {
  const [tool, setTool] = useState<Tool>({ kind: 'inspect' });
  const [overlay, setOverlay] = useState<Overlay>(null);
  const [sel, setSel] = useState<number | null>(null);
  const [side, setSide] = useState<'bilgi' | 'butce'>('bilgi');
  const [hint, setHint] = useState<{ text: string; bad?: boolean } | null>(null);
  const handle = useRef<CityEditorHandle | null>(null);
  const a = useMemo(() => analyze(t.city), [t.city]);
  void me;
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setTool({ kind: 'inspect' });
    };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, []);
  const events = useMemo(
    () => ({
      paint: (tool: 'road' | 'zone' | 'bulldoze', cells: number[], zone?: number) => send({ type: 'cityPaint', tool, cells, zone }),
      place: (service: ServiceId, x: number, y: number) => send({ type: 'cityPlace', service, x, y }),
      inspect: (cell: number | null) => {
        setSel(cell);
        setSide('bilgi');
      },
      hint: (text: string | null, bad?: boolean) => setHint((h) => (h?.text === text && h?.bad === bad ? h : text ? { text, bad } : null)),
    }),
    [send],
  );
  return (
    <div className="city-layout">
      <div className="city-stage">
        <CityEditor city={t.city} analysis={a} tool={tool} overlay={overlay} selected={sel} night={night} partyColor={party?.color ?? '#c0392b'} events={events} handle={handle} />
        <div className="city-hud">
          <Demand d={t.city.stats.demand} />
          <div className="overlays">
            {OVERLAYS.map((o) => (
              <button key={o.label} className={overlay === o.id ? 'on' : ''} onClick={() => setOverlay(o.id)} title={o.label}>
                {o.icon}
                <small>{o.label}</small>
              </button>
            ))}
          </div>
        </div>
        {hint && <div className={`city-hint ${hint.bad ? 'bad' : ''}`}>{hint.text}</div>}
        {tool.kind !== 'inspect' && !hint && (
          <div className="city-hint">
            {tool.kind === 'road' ? 'Yol çizmek için sürükle' : tool.kind === 'zone' ? 'Bölge boyamak için sürükle' : tool.kind === 'bulldoze' ? 'Yıkmak için sürükle' : 'Kurmak için dokun'} · iki parmak ya da sağ tık ile kamerayı çevir
          </div>
        )}
        <ToolBar tool={tool} setTool={setTool} t={t} />
      </div>
      <aside className="city-side card">
        <nav className="side-tabs">
          <button className={side === 'bilgi' ? 'active' : ''} onClick={() => setSide('bilgi')}>
            {sel !== null ? '🔍 Seçili' : '🏙️ Şehir'}
          </button>
          <button className={side === 'butce' ? 'active' : ''} onClick={() => setSide('butce')}>
            💼 Bütçe
          </button>
          {sel !== null && side === 'bilgi' && (
            <button className="ghost small" onClick={() => setSel(null)} aria-label="Seçimi kaldır">
              ✕
            </button>
          )}
        </nav>
        <div className="side-body">{side === 'butce' ? <BudgetPanel t={t} send={send} /> : sel !== null ? <CellInfo t={t} a={a} i={sel} day={day} send={send} /> : <Overview t={t} />}</div>
      </aside>
    </div>
  );
}

// ---------------------------------------------------------------- çevre ağı

function NetworkGraph({ t, me }: { t: Town; me: PlayerView }) {
  const W = 560;
  const H = 380;
  const cx = W / 2;
  const cy = H / 2;
  return (
    <svg className="netgraph" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Çevre ağın">
      {NETWORK_IDS.map((g, gi) => {
        const a = (gi / NETWORK_IDS.length) * Math.PI * 2 - Math.PI / 2;
        const hx = cx + Math.cos(a) * 110;
        const hy = cy + Math.sin(a) * 110;
        const list = t.contacts.filter((c) => c.group === g);
        return (
          <g key={g}>
            <line x1={cx} y1={cy} x2={hx} y2={hy} stroke={NETWORK[g].color} strokeWidth={1 + list.length} opacity={0.5} />
            <circle cx={hx} cy={hy} r={18} fill={NETWORK[g].color} opacity={0.18} />
            <text x={hx} y={hy + 5} textAnchor="middle" fontSize={16}>
              {NETWORK[g].icon}
            </text>
            {list.map((c, i) => {
              const b = a + (i - (list.length - 1) / 2) * 0.22;
              const x = cx + Math.cos(b) * 165;
              const y = cy + Math.sin(b) * 165;
              return (
                <g key={c.id}>
                  <line x1={hx} y1={hy} x2={x} y2={y} stroke={NETWORK[g].color} opacity={0.6} />
                  <circle cx={x} cy={y} r={9} fill="var(--surface)" stroke={NETWORK[g].color} strokeWidth={2} />
                  <text x={x} y={y + 3.5} textAnchor="middle" fontSize={9} fontWeight={700} fill="var(--text)">
                    {c.name
                      .split(' ')
                      .map((w) => w[0])
                      .join('')}
                  </text>
                </g>
              );
            })}
          </g>
        );
      })}
      <circle cx={cx} cy={cy} r={30} fill="var(--surface)" stroke="var(--gold)" strokeWidth={3} />
      <foreignObject x={cx - 26} y={cy - 26} width={52} height={52}>
        {me.character && <Avatar a={me.character.avatar} size={52} />}
      </foreignObject>
    </svg>
  );
}

function NetworkTab({ t, me, day, send }: { t: Town; me: PlayerView; day: number; send: Send }) {
  return (
    <div className="two-col">
      <section className="card">
        <h3>🕸️ Çevren</h3>
        <p className="small muted">
          Binaların ve yaptığın işler seni farklı kesimlerle tanıştırır. Her tanıdık {FAVOR_COOLDOWN} günde bir iyilik yapar; sık istersen sadakati düşer ve geri çevirebilir.
        </p>
        <NetworkGraph t={t} me={me} />
      </section>
      <div className="stack">
        {NETWORK_IDS.map((g) => {
          const list = t.contacts.filter((c) => c.group === g);
          const n = list.length;
          const need = contactThreshold(n);
          const prev = n ? contactThreshold(n - 1) : 0;
          const src = (Object.keys(SERVICES) as ServiceId[]).filter((b) => serviceNetwork(b) === g).map((b) => SERVICES[b].label).concat(ZONE_SOURCES[g] ?? []);
          return (
            <section key={g} className="card net-card" style={{ ['--net' as string]: NETWORK[g].color }}>
              <h4>
                {NETWORK[g].icon} {NETWORK[g].label} <span className="muted small">{n} / {MAX_CONTACTS_PER_GROUP}</span>
              </h4>
              {n < MAX_CONTACTS_PER_GROUP && (
                <div className="small muted">
                  Yeni tanıdığa: <Meter value={((t.network[g] - prev) / (need - prev)) * 100} color={NETWORK[g].color} />
                  {src.length ? `Kaynak: ${src.join(', ')}` : 'Kaynak: olaylar ve eylemler'}
                </div>
              )}
              {list.map((c) => (
                <ContactRow key={c.id} k={c} t={t} day={day} send={send} />
              ))}
            </section>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- kariyer

function CareerTab({ c, t, me, day, send }: { c: CountryState; t: Town; me: PlayerView; day: number; send: Send }) {
  const next = nextRank(t.rank);
  const reqs = requirements(t, { fame: me.fame, membership: me.membership, partyId: me.partyId, character: me.character }, c);
  const ready = reqs.length > 0 && reqs.every((r) => r.ok);
  const chance = next === 'il' || next === 'mv' ? campaignChance(t, { fame: me.fame, membership: me.membership, partyId: me.partyId, character: me.character }, c) : null;
  const cur = RANK_ORDER.indexOf(t.rank);
  const camp = t.campaign;
  const wait = Math.max(0, (t.cooldowns.kampanya ?? 0) - day);
  return (
    <div className="two-col">
      <section className="card career-path">
        <h3>🪜 Kariyer yolun</h3>
        <ol className="path">
          {RANK_ORDER.map((r, i) => (
            <li key={r} className={i < cur ? 'done' : i === cur ? 'cur' : ''}>
              <span className="path-node">{RANKS[r].icon}</span>
              <div>
                <b>{RANKS[r].label}</b>
                <div className="small muted">{RANKS[r].desc}</div>
              </div>
            </li>
          ))}
        </ol>
      </section>
      <section className="card">
        {camp ? (
          <>
            <h3>🗳️ {RANKS[camp.rank].label} kampanyası</h3>
            <p className="small">Sonuç {formatGameDate(camp.endDay)} günü belli olacak.</p>
            <Meter value={((day - camp.startDay) / Math.max(1, camp.endDay - camp.startDay)) * 100} color="var(--gold)" />
            <p>
              Kazanma şansı: <b>%{Math.round(Math.min(0.95, camp.chance + camp.boost) * 100)}</b>
            </p>
            <p className="small muted">Kampanya sürerken meydanda miting, basın toplantısı, teşkilat toplantısı ve sendika ile medyadaki tanıdıklarının iyilikleri şansını artırır.</p>
          </>
        ) : next && next !== 'hukumet' ? (
          <>
            <h3>
              {RANKS[next].icon} Sıradaki adım: {RANKS[next].label}
            </h3>
            <p className="small">{RANKS[next].desc}</p>
            <ul className="reqs">
              {reqs.map((r) => (
                <li key={r.label} className={r.ok ? 'ok' : ''}>
                  <span>{r.ok ? '✅' : '⬜'}</span> {r.label} <span className="muted small">({r.have})</span>
                </li>
              ))}
            </ul>
            {chance !== null && <p className="small">Bugün aday olursan kazanma şansın yaklaşık %{Math.round(chance * 100)}.</p>}
            {next === 'genelBaskan' && <p className="small">Kurultayda parti içindeki tanıdıkların delegeleri sana yönlendirir.</p>}
            <button className="primary" disabled={!ready || wait > 0} onClick={() => send({ type: 'runForOffice' })}>
              {next === 'genelBaskan' ? '🗳️ Kurultaya git' : `🗳️ Aday ol (${RANKS[next].days} günlük kampanya)`}
            </button>
            {wait > 0 && <p className="small muted">Yeni adaylık için {wait} gün bekle.</p>}
          </>
        ) : t.rank === 'genelBaskan' ? (
          <>
            <h3>👑 Sıradaki adım: Genel seçim</h3>
            <p className="small">Artık partinin genel başkanısın. "Parti" sekmesinden mitingler, vaatler ve gölge kabineyle seçime hazırlan. Seçimi kazanırsan ülkeyi yönetirsin.</p>
            <p className="small muted">Seçim tarihi: {formatGameDate(c.nextElectionDay)}</p>
          </>
        ) : (
          <h3>👑 Ülkeyi yönetiyorsun.</h3>
        )}
      </section>
    </div>
  );
}

// ---------------------------------------------------------------- olay penceresi

function TownEventModal({ t, send }: { t: Town; send: Send }) {
  const ev = t.event!;
  return (
    <div className="modal-bg">
      <div className="modal town-event">
        <div className="te-icon">{ev.icon}</div>
        <div className="title-kicker">Karar anı · zaman durdu</div>
        <h2>{ev.title}</h2>
        <p>{ev.text}</p>
        <div className="te-opts">
          {ev.options.map((o, i) => (
            <button key={i} className="te-opt" onClick={() => send({ type: 'townEvent', option: i })}>
              <b>{o.label}</b>
              <span className="small muted">{o.desc}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- harita

function MapTab({ c, t, party }: { c: CountryState; t: Town; party: Party | null }) {
  const [sel, setSel] = useState<string | null>(t.provinceId);
  const pv = c.provinces.find((x) => x.id === sel);
  const poll = pv ? localPoll(c, pv).slice(0, 4) : [];
  return (
    <div className="two-col">
      <section className="card">
        <h3>🗺️ {c.name}</h3>
        <ProvinceMap c={c} selected={sel} onSelect={setSel} highlightParty={party?.id ?? null} />
      </section>
      <section className="card">
        {pv && (
          <>
            <h3>
              {pv.name} {pv.id === t.provinceId && <span className="tag gold">senin şehrin burada</span>}
            </h3>
            <p className="small">
              Nüfus {pv.pop >= 1 ? `${pv.pop.toFixed(1)} milyon` : `${Math.round(pv.pop * 1000)} bin`} · Belediye başkanı {pv.mayor.name}
            </p>
            <h4>Yerel anket</h4>
            {poll.map((x) => {
              const p = c.parties.find((y) => y.id === x.partyId);
              return (
                <div key={x.partyId} className="poll-row small">
                  {p && <PartyBadge p={p} size={20} />} <span>{p?.short}</span>
                  <Meter value={x.vote} color={p?.color} />
                  <b>%{Math.round(x.vote)}</b>
                </div>
              );
            })}
          </>
        )}
      </section>
    </div>
  );
}

// ---------------------------------------------------------------- parti

function PartyTab({ c, p, me, send }: { c: CountryState; p: Party; me: PlayerView; send: Send }) {
  const [confirm, setConfirm] = useState(false);
  return (
    <div className="two-col">
      <div className="stack">
        <section className="card">
          <h3>
            <PartyBadge p={p} size={24} /> {p.name}
          </h3>
          <p className="small">
            Genel başkan {p.leaderName} · anket %{p.support.toFixed(1)} · partinin sana güveni {Math.round(me.membership?.trust ?? 0)}/100
          </p>
          <p className="small muted">Parti içinde yükselmek için şehrinde parti binası kur, teşkilat toplantıları yap ve parti içinde tanıdık edin. Genel başkanlık yolu Kariyer sekmesinde.</p>
          <button
            className={confirm ? 'danger small' : 'ghost small'}
            onClick={() => {
              if (confirm) send({ type: 'leaveParty' });
              setConfirm((x) => !x);
            }}
          >
            {confirm ? 'Emin misin? İstifa et' : `${p.short}'den istifa et`}
          </button>
        </section>
        <PollsCard c={c} p={p} />
      </div>
      <GovWatch c={c} />
    </div>
  );
}

// ---------------------------------------------------------------- ana ekran

const TOWN_TABS = [
  { id: 'sehir', label: '🏙️ Şehrim' },
  { id: 'cevre', label: '🕸️ Çevrem' },
  { id: 'kariyer', label: '🪜 Kariyer' },
  { id: 'harita', label: '🗺️ Ülke' },
  { id: 'il', label: '🌆 İl belediyesi' },
  { id: 'parti', label: '🚩 Parti' },
  { id: 'haber', label: '📰 Haberler' },
] as const;

type TabId = (typeof TOWN_TABS)[number]['id'];

export function TownGame({ c, me, day, dayMs, send }: { c: CountryState; me: PlayerView; day: number; dayMs: number; send: Send }) {
  const t = me.town!;
  const [tab, setTab] = useState<TabId>('sehir');
  const [night, setNight] = useState(isNight());
  useEffect(() => {
    const m = window.matchMedia?.('(prefers-color-scheme: dark)');
    const f = () => setNight(isNight());
    m?.addEventListener?.('change', f);
    return () => m?.removeEventListener?.('change', f);
  }, []);
  const party = c.parties.find((p) => p.id === me.membership?.partyId) ?? null;
  const leader = c.parties.find((p) => p.id === me.partyId) ?? null;
  const tabs = TOWN_TABS.filter((x) => x.id !== 'il' || (me.office?.id === 'belediyeBaskani' && t.rank !== 'ilce'));
  return (
    <div className="dashboard town-game">
      <section className="town-head card">
        {me.character && <Avatar a={me.character.avatar} size={56} ring={party?.color} />}
        <div className="hq-title">
          <div className="small muted">
            {party && <PartyBadge p={party} size={18} />} {party?.name ?? 'Bağımsız'}
          </div>
          <h2>{t.name}</h2>
          <div className="small">
            {RANKS[t.rank].icon} {me.character?.name} · {RANKS[t.rank].label}
            {t.campaign && <span className="tag gold"> kampanya sürüyor</span>}
          </div>
        </div>
        <ResourceBar t={t} me={me} />
      </section>
      <nav className="tabs">
        {tabs.map((x) => (
          <button key={x.id} className={x.id === tab ? 'active' : ''} onClick={() => setTab(x.id)}>
            {x.label}
          </button>
        ))}
      </nav>
      <main className="panel">
        {tab === 'sehir' && <CityTab t={t} me={me} day={day} send={send} party={party} night={night} />}
        {tab === 'cevre' && <NetworkTab t={t} me={me} day={day} send={send} />}
        {tab === 'kariyer' && <CareerTab c={c} t={t} me={me} day={day} send={send} />}
        {tab === 'harita' && <MapTab c={c} t={t} party={party} />}
        {tab === 'il' && <ProvincesPanel c={c} me={me} day={day} send={send} governing={false} />}
        {tab === 'parti' &&
          (leader ? (
            <OppositionView c={c} p={leader} me={me} day={day} dayMs={dayMs} send={send} />
          ) : party ? (
            <PartyTab c={c} p={party} me={me} send={send} />
          ) : (
            <p className="muted">Bir partiye üye değilsin.</p>
          ))}
        {tab === 'haber' && (
          <div className="two-col">
            <section className="card">
              <h3>🏡 Şehrin günlüğü</h3>
              <ul className="tlog">
                {t.log.map((l, i) => (
                  <li key={i} className={`small ${l.kind}`}>
                    <span className="muted">{formatGameDate(l.day)}</span> {l.text}
                  </li>
                ))}
              </ul>
            </section>
            <News c={c} />
          </div>
        )}
      </main>
      {t.event && <TownEventModal t={t} send={send} />}
    </div>
  );
}

// ---------------------------------------------------------------- şehir seçimi

export function TownPick({ c, me, send }: { c: CountryState; me: PlayerView; send: Send }) {
  const party = c.parties.find((p) => p.id === me.membership?.partyId) ?? null;
  const [sel, setSel] = useState<string | null>(null);
  const pv = c.provinces.find((x) => x.id === sel);
  const [name, setName] = useState('');
  const vote = pv && party ? localPoll(c, pv).find((x) => x.partyId === party.id)?.vote ?? 0 : 0;
  return (
    <main className="party-screen town-pick">
      <header className="screen-head">
        <div className="step-pill">Son adım</div>
        <h2>Belediyeni seç</h2>
        <p className="muted">
          Siyasete küçük bir ilçe belediyesiyle başlıyorsun. Şehrini büyüt, çevre edin; sonra o ilin büyükşehir belediyesine, meclise, partinin başına ve sonunda hükümete yürü. Partinin güçlü olduğu bir il, ileride il belediye seçimini kazanmayı kolaylaştırır.
        </p>
      </header>
      <div className="two-col">
        <section className="card">
          <ProvinceMap c={c} selected={sel} onSelect={(id) => {
            setSel(id);
            const p = c.provinces.find((x) => x.id === id);
            if (p) setName(`${p.name} Merkez`);
          }} highlightParty={party?.id ?? null} />
        </section>
        <section className="card">
          {pv ? (
            <>
              <h3>{pv.name}</h3>
              <p className="small">
                İlin nüfusu {pv.pop >= 1 ? `${pv.pop.toFixed(1)} milyon` : `${Math.round(pv.pop * 1000)} bin`} · Belediye: {c.parties.find((p) => p.id === pv.mayor.partyId)?.short}
              </p>
              {party && (
                <p className="small">
                  {party.short} burada %{Math.round(vote)} oy alıyor. {vote >= 30 ? 'Güçlü bir zemin.' : vote >= 15 ? 'Rekabetçi bir il.' : 'Zor bir il, ama kazanırsan büyük ses getirir.'}
                </p>
              )}
              <label className="field">
                <span className="small muted">Belediyenin adı</span>
                <input value={name} maxLength={24} onChange={(e) => setName(e.target.value)} />
              </label>
              <button className="primary" disabled={!name.trim()} onClick={() => send({ type: 'foundTown', provinceId: pv.id, name })}>
                🏡 Bu ilde başla
              </button>
            </>
          ) : (
            <p className="muted">Haritadan bir il seç.</p>
          )}
        </section>
      </div>
    </main>
  );
}
