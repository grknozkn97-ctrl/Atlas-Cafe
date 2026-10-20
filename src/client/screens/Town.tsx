import { useEffect, useMemo, useState } from 'react';
import { formatGameDate } from '../../shared/constants';
import { localPoll } from '../../shared/local';
import {
  BUILDINGS,
  BUILDING_IDS,
  FAVOR_COOLDOWN,
  MATERIAL_BUY,
  MATERIAL_SELL,
  NETWORK,
  NETWORK_IDS,
  RANKS,
  RANK_ORDER,
  TAX_LABELS,
  TOWN_ACTIONS,
  campaignChance,
  canBuild,
  capacity,
  contactThreshold,
  economy,
  favorEffect,
  fmt,
  happinessTarget,
  levelOf,
  nextRank,
  requirements,
  slotCount,
  unemployment,
  upgradeCost,
  MAX_CONTACTS_PER_GROUP,
} from '../../shared/town';
import type { BuildingId, ClientMessage, CountryState, NetworkId, Party, PlayerView, Town } from '../../shared/types';
import { Avatar } from '../ui/Avatar';
import { isNight } from '../ui/City3D';
import { ProvinceMap } from '../ui/ProvinceMap';
import { BuildingSprite, TownView, iso } from '../ui/TownView';
import { Meter, PartyBadge } from '../ui/Widgets';
import { GovWatch, News, OppositionView, PollsCard } from './Politics';
import { ProvincesPanel } from './Provinces';

type Send = (m: ClientMessage) => void;

const money = (n: number) => (Math.abs(n) >= 1000 ? `${(n / 1000).toFixed(1).replace('.', ',')} milyon ₺` : `${Math.floor(n)} bin ₺`);

// ---------------------------------------------------------------- kaynak çubuğu

function ResourceBar({ t, me }: { t: Town; me: PlayerView }) {
  const e = economy(t);
  const cap = capacity(t);
  const items = [
    { icon: '💰', label: 'Kasa', value: money(t.money), sub: `${e.net >= 0 ? '+' : '−'}${Math.abs(Math.round(e.net))}/gün`, tone: t.money < 0 || e.net < 0 ? 'bad' : '' },
    { icon: '🧱', label: 'Malzeme', value: `${fmt(Math.floor(t.materials))} t`, sub: `+${Math.round(e.materials)}/gün`, tone: '' },
    { icon: '👥', label: 'Nüfus', value: fmt(t.pop), sub: `konut ${fmt(cap)}`, tone: t.pop / cap > 0.97 ? 'mid' : '' },
    { icon: t.happiness >= 60 ? '😊' : t.happiness >= 45 ? '😐' : '😠', label: 'Memnuniyet', value: `%${Math.round(t.happiness)}`, sub: `hedef %${Math.round(happinessTarget(t).value)}`, tone: t.happiness < 45 ? 'bad' : '' },
    { icon: '⭐', label: 'Nüfuz', value: `${Math.floor(t.influence)}`, sub: `+${e.influence.toFixed(1)}/gün`, tone: '' },
    { icon: '📣', label: 'Tanınırlık', value: `${Math.round(me.fame)}`, sub: me.membership && !me.partyId ? `parti güveni ${Math.round(me.membership.trust)}` : '', tone: '' },
  ];
  return (
    <div className="resbar">
      {items.map((x) => (
        <div key={x.label} className={`res ${x.tone}`} title={x.label}>
          <span className="res-icon">{x.icon}</span>
          <span className="res-text">
            <b>{x.value}</b>
            <span className="small muted">{x.sub || x.label}</span>
          </span>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------- bina paneli

function MiniSprite({ b, level, color, short }: { b: BuildingId; level: number; color: string; short: string }) {
  const [x, y] = iso(1, 1);
  return (
    <svg className="mini-sprite" viewBox={`${x - 70} ${y - 120} 140 150`} aria-hidden>
      <BuildingSprite b={b} level={Math.max(1, level)} cx={1} cy={1} night={false} partyColor={color} partyShort={short} />
    </svg>
  );
}

function CostLine({ t, b, toLevel }: { t: Town; b: BuildingId; toLevel: number }) {
  const cost = upgradeCost(b, toLevel);
  return (
    <div className="cost">
      <span className={t.money >= cost.money ? '' : 'bad'}>💰 {money(cost.money)}</span>
      <span className={t.materials >= cost.materials ? '' : 'bad'}>🧱 {fmt(cost.materials)} t</span>
      <span>⏱️ {cost.days} gün</span>
    </div>
  );
}

function BuildMenu({ t, slot, send, party }: { t: Town; slot: number; send: Send; party: Party | null }) {
  return (
    <div className="build-menu">
      <p className="small muted">Bu arsaya ne kurmak istersin? Aynı anda tek inşaat yürür.</p>
      {BUILDING_IDS.filter((b) => b !== 'belediye').map((b) => {
        const err = canBuild(t, slot, b);
        const spec = BUILDINGS[b];
        return (
          <button key={b} className="build-opt" disabled={!!err || !!t.construction} onClick={() => send({ type: 'townBuild', slot, building: b })}>
            <MiniSprite b={b} level={1} color={party?.color ?? '#c0392b'} short={party?.short ?? ''} />
            <span className="build-opt-body">
              <b>
                {spec.icon} {spec.label}
              </b>
              <span className="small muted">{spec.desc}</span>
              <span className="small">{spec.effect(1)}</span>
              {err ? <span className="small bad">{err}</span> : <CostLine t={t} b={b} toLevel={1} />}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function TradeBox({ t, send }: { t: Town; send: Send }) {
  const [n, setN] = useState(100);
  return (
    <div className="trade">
      <h4>🧱 Malzeme ticareti</h4>
      <p className="small muted">
        Alış {MATERIAL_BUY} bin ₺/ton, satış {MATERIAL_SELL} bin ₺/ton.
      </p>
      <div className="trade-row">
        <input type="range" min={10} max={1000} step={10} value={n} onChange={(e) => setN(Number(e.target.value))} aria-label="Ton" />
        <b>{n} t</b>
      </div>
      <div className="actions">
        <button className="small" disabled={t.money < n * MATERIAL_BUY} onClick={() => send({ type: 'townTrade', tons: n })}>
          Al ({fmt(n * MATERIAL_BUY)} bin ₺)
        </button>
        <button className="ghost small" disabled={t.materials < n} onClick={() => send({ type: 'townTrade', tons: -n })}>
          Sat (+{fmt(n * MATERIAL_SELL)} bin ₺)
        </button>
      </div>
    </div>
  );
}

function TaxBox({ t, send }: { t: Town; send: Send }) {
  const e = economy(t);
  const h = happinessTarget(t);
  return (
    <div className="taxbox">
      <h4>🧾 Emlak ve çevre vergisi</h4>
      <div className="seg">
        {(['dusuk', 'orta', 'yuksek'] as const).map((x) => (
          <button key={x} className={t.tax === x ? 'on' : ''} onClick={() => send({ type: 'townTax', tax: x })}>
            {TAX_LABELS[x]}
          </button>
        ))}
      </div>
      <table className="ledger small">
        <tbody>
          <tr>
            <td>Vergi geliri</td>
            <td>+{Math.round(e.taxIncome)}</td>
          </tr>
          <tr>
            <td>Çarşı</td>
            <td>+{Math.round(e.trade)}</td>
          </tr>
          <tr>
            <td>Sanayi</td>
            <td>+{Math.round(e.industry)}</td>
          </tr>
          <tr>
            <td>Bina bakımı</td>
            <td className="bad">−{Math.round(e.upkeep)}</td>
          </tr>
          <tr className="sum">
            <td>Günlük net (bin ₺)</td>
            <td>{Math.round(e.net)}</td>
          </tr>
        </tbody>
      </table>
      <h4>😊 Memnuniyet neden %{Math.round(h.value)}?</h4>
      <div className="mood-parts">
        {h.parts.map((p) => (
          <span key={p.label} className={`chip ${p.value >= 0 ? 'good' : 'bad'}`}>
            {p.label} {p.value >= 0 ? '+' : '−'}
            {Math.abs(p.value).toFixed(0)}
          </span>
        ))}
      </div>
      <p className="small muted">İşsizlik %{Math.round(unemployment(t) * 100)}. İş için çarşı ve sanayiyi büyüt.</p>
    </div>
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

function BuildingPanel({ t, slot, day, send, party, onClose }: { t: Town; slot: number; day: number; send: Send; party: Party | null; onClose: () => void }) {
  const s = t.slots[slot];
  const k = t.construction;
  const color = party?.color ?? '#c0392b';
  const short = party?.short ?? '';
  if (!s.building && k?.slot !== slot) {
    return (
      <aside className="bpanel card">
        <header className="bpanel-head">
          <h3>🏗️ Boş arsa</h3>
          <button className="ghost small" onClick={onClose} aria-label="Kapat">
            ✕
          </button>
        </header>
        <BuildMenu t={t} slot={slot} send={send} party={party} />
      </aside>
    );
  }
  const b = (s.building ?? k!.building) as BuildingId;
  const spec = BUILDINGS[b];
  const bel = levelOf(t, 'belediye');
  const busy = k?.slot === slot;
  const maxed = s.level >= spec.max;
  const blocked = b !== 'belediye' && s.level + 1 > bel + 1;
  const actions = TOWN_ACTIONS[b] ?? [];
  const contacts = spec.network ? t.contacts.filter((c) => c.group === spec.network) : [];
  return (
    <aside className="bpanel card">
      <header className="bpanel-head">
        <MiniSprite b={b} level={s.level || 1} color={color} short={short} />
        <div>
          <h3>
            {spec.icon} {spec.label}
          </h3>
          <div className="small muted">{s.level ? `${s.level}. seviye` : 'yapım aşamasında'}</div>
        </div>
        <button className="ghost small" onClick={onClose} aria-label="Kapat">
          ✕
        </button>
      </header>
      <p className="small">{spec.desc}</p>
      <div className="fx-now small">
        {s.level > 0 && (
          <div>
            <span className="muted">Şimdi:</span> {spec.effect(s.level)}
          </div>
        )}
        {!maxed && (
          <div>
            <span className="muted">{s.level + 1}. seviye:</span> <b>{spec.effect(s.level + 1)}</b>
          </div>
        )}
      </div>
      {busy ? (
        <div className="busy">
          <div className="slider-head small">
            <span>🏗️ {k!.toLevel}. seviyeye çıkıyor</span>
            <b>{Math.max(0, k!.endDay - day)} gün</b>
          </div>
          <Meter value={((day - k!.startDay) / Math.max(1, k!.endDay - k!.startDay)) * 100} color="#f2b705" />
          <button className="ghost small" onClick={() => send({ type: 'townCancel' })}>
            İnşaatı iptal et (%70 iade)
          </button>
        </div>
      ) : maxed ? (
        <p className="small good">En üst seviyede.</p>
      ) : (
        <div className="upgrade">
          <CostLine t={t} b={b} toLevel={s.level + 1} />
          <button className="primary" disabled={!!k || blocked} onClick={() => send({ type: 'townUpgrade', slot })}>
            ⬆️ {s.level + 1}. seviyeye yükselt
          </button>
          {blocked && <p className="small bad">Önce belediye binasını {s.level}. seviyeye çıkar.</p>}
          {k && <p className="small muted">Şu an başka bir inşaat sürüyor: {BUILDINGS[k.building].label}.</p>}
        </div>
      )}
      {actions.length > 0 && s.level > 0 && (
        <div className="bactions">
          <h4>Bu binada yapabileceklerin</h4>
          {actions.map((a) => {
            const key = `${b}:${a.id}`;
            const wait = Math.max(0, (t.cooldowns[key] ?? 0) - day);
            const cant = (a.money ?? 0) > t.money || (a.influence ?? 0) > t.influence;
            return (
              <button key={a.id} className="baction" disabled={wait > 0 || cant} onClick={() => send({ type: 'townAction', building: b, action: a.id })}>
                <b>{a.label}</b>
                <span className="small muted">{a.desc}</span>
                <span className="small">
                  {a.money ? `💰 ${a.money} bin ₺ ` : ''}
                  {a.influence ? `⭐ ${a.influence} nüfuz ` : ''}
                  {wait > 0 ? `· ⏳ ${wait} gün` : ''}
                </span>
              </button>
            );
          })}
        </div>
      )}
      {b === 'belediye' && <TaxBox t={t} send={send} />}
      {b === 'belediye' && <p className="small muted">Açık arsa: {slotCount(bel)} / 14. Belediye binası büyüdükçe yeni arsalar açılır.</p>}
      {b === 'carsi' && s.level > 0 && <TradeBox t={t} send={send} />}
      {spec.network && (
        <div className="bnet">
          <h4>
            {NETWORK[spec.network].icon} {NETWORK[spec.network].label} çevren
          </h4>
          {contacts.length ? (
            contacts.map((c) => <ContactRow key={c.id} k={c} t={t} day={day} send={send} />)
          ) : (
            <p className="small muted">Bu bina zamanla sana bu kesimden tanıdıklar kazandıracak.</p>
          )}
        </div>
      )}
    </aside>
  );
}

function Guide({ t }: { t: Town }) {
  const next = nextRank(t.rank);
  const k = t.construction;
  return (
    <aside className="bpanel card guide">
      <h3>🏡 {t.name}</h3>
      <p className="small">Şehrindeki bir binaya ya da boş arsaya dokun. Binalar geliştikçe şehir büyür, gelirin artar ve yeni insanlarla tanışırsın.</p>
      {k ? (
        <p className="small">
          🏗️ Süren inşaat: <b>{BUILDINGS[k.building].label}</b> ({k.toLevel}. seviye), {formatGameDate(k.endDay)}.
        </p>
      ) : (
        <p className="small good">İnşaat ekibin boşta. Bir bina kur ya da geliştir.</p>
      )}
      {next && <p className="small muted">Sıradaki hedefin: {RANKS[next].icon} {RANKS[next].label}. Kariyer sekmesinde neler gerektiğini gör.</p>}
      <h4>Son olaylar</h4>
      <ul className="tlog">
        {t.log.slice(0, 6).map((l, i) => (
          <li key={i} className={`small ${l.kind}`}>
            <span className="muted">{formatGameDate(l.day, false)}</span> {l.text}
          </li>
        ))}
      </ul>
    </aside>
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
          const src = BUILDING_IDS.filter((b) => BUILDINGS[b].network === g).map((b) => BUILDINGS[b].label);
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
  const [sel, setSel] = useState<number | null>(null);
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
  const pending = useMemo(() => t.slots.filter((s, i) => i < slotCount(t.slots[0].level) && !s.building).length, [t]);
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
            {x.id === 'sehir' && !t.construction && pending > 0 && <span className="badge">{pending}</span>}
          </button>
        ))}
      </nav>
      <main className="panel">
        {tab === 'sehir' && (
          <div className="town-layout">
            <div className="town-stage">
              <TownView t={t} day={day} night={night} partyColor={party?.color ?? '#c0392b'} partyShort={party?.short ?? ''} selected={sel} onSelect={setSel} />
            </div>
            {sel !== null ? <BuildingPanel t={t} slot={sel} day={day} send={send} party={party} onClose={() => setSel(null)} /> : <Guide t={t} />}
          </div>
        )}
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
