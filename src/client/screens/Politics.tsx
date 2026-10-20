import { useState } from 'react';
import { MINISTRIES, MINISTRY_LABELS, formatGameDate } from '../../shared/constants';
import { ministerScore } from '../../shared/ministers';
import { ACTION_COOLDOWNS, ACTION_COSTS, MAX_PROMISES, PROMISES, regionFit, topIssue } from '../../shared/politics';
import type { ClientMessage, CountryState, Party, PromiseId } from '../../shared/types';
import { n0, n1, pct, realDuration } from '../format';
import { Hemicycle } from '../ui/Hemicycle';
import { RegionMap } from '../ui/RegionMap';
import { Gauge, Meter, PartyBadge, PollChart, Stat } from '../ui/Widgets';
import type { PanelProps } from '../App';

type Send = (m: ClientMessage) => void;

const ready = (p: Party, key: string, day: number) => (p.cooldowns[key] ?? 0) <= day;
const waitText = (p: Party, key: string, day: number) => {
  const until = p.cooldowns[key] ?? 0;
  return until > day ? `${until - day} gün sonra` : '';
};

export function rankOf(c: CountryState, p: Party) {
  return [...c.parties].sort((a, b) => b.support - a.support).findIndex((x) => x.id === p.id) + 1;
}

export function PartyHeader({ c, p, day, dayMs }: { c: CountryState; p: Party; day: number; dayMs: number }) {
  const daysLeft = c.nextElectionDay - day;
  const rank = rankOf(c, p);
  const passes = p.support >= (c.electionThreshold || 0);
  return (
    <section className="hq-head card" style={{ ['--party' as string]: p.color }}>
      <PartyBadge p={p} size={64} />
      <div className="hq-title">
        <div className="small muted">{p.inGovernment ? (p.id === c.rulingPartyId ? 'İktidar partisi' : 'Koalisyon ortağı') : 'Ana muhalefet yarışında'}</div>
        <h2>{p.name}</h2>
        <div className="small">
          Genel başkan <b>{p.leaderName}</b>
        </div>
      </div>
      <div className="hq-kpis">
        <Stat icon="📊" label={`anket · ${rank}. parti`} value={pct(p.support)} tone={passes ? (rank === 1 ? 'good' : 'mid') : 'bad'} />
        <Stat icon="🏛️" label="sandalye" value={pct(p.seats)} />
        <Stat icon="💰" label="kasa (milyon $)" value={n1(p.funds)} tone={p.funds < 5 ? 'bad' : undefined} />
        <Stat icon="🗳️" label={formatGameDate(c.nextElectionDay, false)} value={daysLeft > 0 ? `${daysLeft} gün` : 'bugün'} />
      </div>
      <div className="hq-org">
        <span className="small muted">Teşkilat {n0(p.org)}/100</span>
        <Meter value={p.org} color={p.color} />
        <span className="small muted">İvme {p.momentum >= 0 ? '+' : ''}{n1(p.momentum)}</span>
        <Meter value={Math.max(0, p.momentum) * 8} color="var(--gold)" />
        {!passes && c.electionThreshold > 0 && <span className="small bad">Baraj %{c.electionThreshold}: şu an meclis dışı kalırsın</span>}
        {daysLeft > 0 && <span className="small muted">Seçime gerçek zamanla ~{realDuration(daysLeft, dayMs)}</span>}
      </div>
    </section>
  );
}

export function RegionsCard({ c, p, day, send }: { c: CountryState; p: Party; day: number; send: Send }) {
  const [sel, setSel] = useState<string | null>(c.regions[0]?.id ?? null);
  const r = c.regions.find((x) => x.id === sel);
  const key = r ? `miting:${r.id}` : '';
  const fit = r ? regionFit(p, r.lean) : 0;
  return (
    <section className="card">
      <h3>🗺️ Saha çalışması</h3>
      <p className="small muted">Bölgeye dokun. Renk ne kadar koyuysa oradaki seçmen partine o kadar yakın.</p>
      <RegionMap c={c} party={p} day={day} selected={sel} onSelect={setSel} />
      {r && (
        <div className="region-panel">
          <div>
            <b>{r.name}</b>
            <div className="small muted">
              Nüfusun %{Math.round(r.weight * 100)}'i · uyum {fit > 1 ? 'yüksek' : fit > 0.6 ? 'orta' : 'düşük'}
            </div>
          </div>
          <button className="primary" disabled={!ready(p, key, day) || p.funds < ACTION_COSTS.miting} onClick={() => send({ type: 'partyAction', action: 'miting', regionId: r.id })}>
            📣 Miting yap · {ACTION_COSTS.miting} M$ {waitText(p, key, day) && `(${waitText(p, key, day)})`}
          </button>
        </div>
      )}
    </section>
  );
}

export function ActionsCard({ c, p, day, send }: { c: CountryState; p: Party; day: number; send: Send }) {
  const issue = topIssue(c);
  const orgCost = p.leader?.background === 'hukukcu' ? 8 : ACTION_COSTS.teskilat;
  const actions = [
    {
      id: 'teskilat' as const,
      icon: '🏢',
      title: 'Teşkilatı büyüt',
      desc: `İl ve ilçe örgütleri açılır: anket desteğin kalıcı olarak güçlenir. ${orgCost} M$`,
      ok: p.funds >= orgCost && p.org < 100,
      wait: '',
    },
    {
      id: 'bagis' as const,
      icon: '💰',
      title: 'Bağış kampanyası',
      desc: 'Teşkilat ve desteğin büyüdükçe daha çok para toplar.',
      ok: ready(p, 'bagis', day),
      wait: waitText(p, 'bagis', day),
    },
    ...(!p.inGovernment
      ? [
          {
            id: 'aciklama' as const,
            icon: '🎙️',
            title: 'Basın açıklaması',
            desc: `Gündemin en sıcak konusu: “${issue.label}”. Sorun büyüdükçe açıklaman daha çok ses getirir.`,
            ok: ready(p, 'aciklama', day),
            wait: waitText(p, 'aciklama', day),
          },
          {
            id: 'erkenSecim' as const,
            icon: '⏱️',
            title: 'Erken seçim çağrısı',
            desc: `Hükümetin desteği düşükse kabul edilebilir (şu an ${pct(c.approval)}). ${ACTION_COOLDOWNS.erkenSecim} günde bir.`,
            ok: ready(p, 'erkenSecim', day),
            wait: waitText(p, 'erkenSecim', day),
          },
        ]
      : []),
  ];
  return (
    <section className="card">
      <h3>⚡ Parti eylemleri</h3>
      <div className="action-grid">
        {actions.map((a) => (
          <button key={a.id} className="action-tile" disabled={!a.ok} onClick={() => send({ type: 'partyAction', action: a.id })}>
            <span className="at-icon">{a.icon}</span>
            <b>{a.title}</b>
            <span className="small muted">{a.desc}</span>
            {a.wait && <span className="small tag">⏳ {a.wait}</span>}
          </button>
        ))}
      </div>
    </section>
  );
}

export function PromisesCard({ p, send }: { p: Party; send: Send }) {
  const toggle = (id: PromiseId) => {
    const has = p.promises.includes(id);
    const next = has ? p.promises.filter((x) => x !== id) : [...p.promises, id];
    if (next.length <= MAX_PROMISES) send({ type: 'setPromises', promises: next });
  };
  return (
    <section className="card">
      <h3>📜 Seçim vaatleri ({p.promises.length}/{MAX_PROMISES})</h3>
      <p className="small muted">Vaatler seçmeni çeker. İktidara gelirsen bir sonraki seçimde hesabı sorulur: tutulan vaat oy kazandırır, tutulmayan kaybettirir.</p>
      <div className="promise-grid">
        {(Object.keys(PROMISES) as PromiseId[]).map((id) => {
          const on = p.promises.includes(id);
          return (
            <button key={id} className={`promise ${on ? 'on' : ''}`} disabled={!on && p.promises.length >= MAX_PROMISES} onClick={() => toggle(id)}>
              <b>{PROMISES[id].short}</b>
              <span className="small muted">{PROMISES[id].label}</span>
              <span className="small">Çekim {'●'.repeat(Math.round(PROMISES[id].appeal * 2))}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

export function ShadowCard({ c, p, send }: { c: CountryState; p: Party; send: Send }) {
  const filled = MINISTRIES.filter((m) => p.shadowCabinet[m]).length;
  return (
    <section className="card">
      <h3>👥 Gölge kabine ({filled}/{MINISTRIES.length})</h3>
      <p className="small muted">İktidara gelince bu isimler bakan olarak yemin eder. Boş bıraktığın bakanlıklarda mevcut bakan görevine devam eder.</p>
      <div className="shadow-list">
        {MINISTRIES.map((m) => {
          const cur = p.shadowCabinet[m];
          return (
            <div key={m} className="shadow-row">
              <span className="sr-min">{MINISTRY_LABELS[m]}</span>
              <select
                value={cur?.id ?? ''}
                onChange={(e) => send({ type: 'setShadow', ministry: m, candidateId: e.target.value || null })}
              >
                <option value="">Boş</option>
                {cur && !c.candidates[m].some((x) => x.id === cur.id) && <option value={cur.id}>{cur.name}</option>}
                {c.candidates[m].map((cand) => (
                  <option key={cand.id} value={cand.id}>
                    {cand.name} · puan {Math.round(ministerScore(cand) * 100)}
                  </option>
                ))}
              </select>
              {cur && <Meter value={ministerScore(cur) * 100} color="var(--good)" />}
            </div>
          );
        })}
      </div>
    </section>
  );
}

export function PollsCard({ c, p }: { c: CountryState; p: Party | null }) {
  const sorted = [...c.parties].sort((a, b) => b.support - a.support);
  return (
    <section className="card">
      <h3>📊 Anketler ve meclis</h3>
      <PollChart parties={c.parties} />
      <div className="polls-row">
        <Hemicycle parties={c.parties} highlight={p?.id} />
        <div className="party-list">
          {sorted.map((x) => (
            <div key={x.id} className={`party-row ${x.id === p?.id ? 'me' : ''}`}>
              <span className="dot-c" style={{ background: x.color }} />
              <span className="pr-name">{x.short}</span>
              <span className="pr-bar">
                <span style={{ width: `${Math.min(100, x.support * 2)}%`, background: x.color }} />
              </span>
              <span className="pr-num">{pct(x.support)}</span>
              {x.inGovernment && <span className="tag">iktidar</span>}
            </div>
          ))}
        </div>
      </div>
      {c.electionThreshold > 0 && <p className="small muted">Seçim barajı %{c.electionThreshold}. Barajı geçemeyen partiler meclise giremez.</p>}
    </section>
  );
}

function GovWatch({ c }: { c: CountryState }) {
  const tone = (v: number, good: number, mid: number, lowerBetter = true) =>
    lowerBetter ? (v <= good ? 'good' : v <= mid ? 'mid' : 'bad') : v >= good ? 'good' : v >= mid ? 'mid' : 'bad';
  const issue = topIssue(c);
  return (
    <section className="card">
      <h3>🔎 Hükümeti izle</h3>
      <div className="watch">
        <Gauge value={c.approval} label="Hükümete onay" sub={`Lider: ${c.leaderName}`} />
        <div className="stat-grid">
          <Stat icon="🛒" label="Enflasyon" value={pct(c.inflation)} tone={tone(c.inflation, 4, 12)} />
          <Stat icon="👷" label="İşsizlik" value={pct(c.unemployment)} tone={tone(c.unemployment, 5, 9)} />
          <Stat icon="💹" label="Büyüme" value={pct(c.growth)} tone={tone(c.growth, 2.5, 0.5, false)} />
          <Stat icon="🏦" label="Borç / GSYH" value={pct(c.debtPct)} tone={tone(c.debtPct, 60, 100)} />
        </div>
      </div>
      <p className="small">
        Halkın en büyük derdi: <b>{issue.label}</b>. Bu konuda yapacağın basın açıklamaları daha çok ses getirir.
      </p>
    </section>
  );
}

function News({ c }: { c: CountryState }) {
  return (
    <section className="card">
      <h3>📰 Haberler</h3>
      <ul className="news">
        {c.news.slice(0, 12).map((n, i) => (
          <li key={i} className={n.kind}>
            <span className="small muted">{formatGameDate(n.day)}</span> {n.text}
          </li>
        ))}
      </ul>
    </section>
  );
}

const OPP_TABS = [
  { id: 'karargah', label: '🏠 Karargâh' },
  { id: 'anket', label: '📊 Anket ve Meclis' },
  { id: 'program', label: '📜 Vaatler ve Kadro' },
  { id: 'ulke', label: '🔎 Ülke Gündemi' },
] as const;

/** Muhalefetteyken oyuncunun ekranı. */
export function OppositionView({ c, p, day, dayMs, send }: { c: CountryState; p: Party; day: number; dayMs: number; send: Send }) {
  const [tab, setTab] = useState<(typeof OPP_TABS)[number]['id']>('karargah');
  return (
    <div className="dashboard">
      <PartyHeader c={c} p={p} day={day} dayMs={dayMs} />
      <nav className="tabs">
        {OPP_TABS.map((t) => (
          <button key={t.id} className={t.id === tab ? 'active' : ''} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </nav>
      <main className="panel">
        {tab === 'karargah' && (
          <div className="two-col">
            <RegionsCard c={c} p={p} day={day} send={send} />
            <div className="stack">
              <ActionsCard c={c} p={p} day={day} send={send} />
              <News c={c} />
            </div>
          </div>
        )}
        {tab === 'anket' && <PollsCard c={c} p={p} />}
        {tab === 'program' && (
          <div className="two-col">
            <PromisesCard p={p} send={send} />
            <ShadowCard c={c} p={p} send={send} />
          </div>
        )}
        {tab === 'ulke' && (
          <div className="two-col">
            <GovWatch c={c} />
            <News c={c} />
          </div>
        )}
      </main>
    </div>
  );
}

/** Hükümetteyken parti ve meclis sekmesi. */
export function PoliticsPanel({ c, day, send }: PanelProps) {
  const p = c.parties.find((x) => x.id === c.rulingPartyId)!;
  return (
    <div className="stack">
      {c.activePromises.length > 0 && (
        <section className="card">
          <h3>📜 Verdiğin sözler</h3>
          <p className="small muted">Bir sonraki seçimde tutulan her söz yaklaşık +2 puan, tutulmayan −3 puan etkiler.</p>
          <div className="promise-track">
            {c.activePromises.map((ap) => {
              const def = PROMISES[ap.id];
              const now = def.measure(c);
              const ok = def.kept(now, ap.baseline);
              return (
                <div key={ap.id} className={`pt ${ok ? 'ok' : ''}`}>
                  <span className="pt-icon">{ok ? '✅' : '⏳'}</span>
                  <div>
                    <b>{def.short}</b>
                    <div className="small muted">
                      Hedef: {def.target} · başlangıç {n1(ap.baseline)}, şimdi {n1(now)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
      <div className="two-col">
        <PollsCard c={c} p={p} />
        <div className="stack">
          {p && <RegionsCard c={c} p={p} day={day} send={send} />}
          {p && <ActionsCard c={c} p={p} day={day} send={send} />}
        </div>
      </div>
    </div>
  );
}
