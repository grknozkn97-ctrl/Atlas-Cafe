import { useEffect, useState } from 'react';
import { CHALLENGE_TRUST, MEDIA, ROLE_LABELS, challengeChance, mediaEffect } from '../../shared/career';
import { formatGameDate } from '../../shared/constants';
import type { ClientMessage, CountryState, MediaAction, Party, PartyRole, PlayerView } from '../../shared/types';
import { n0, n1, pct } from '../format';
import { Avatar } from '../ui/Avatar';
import { Meter, PartyBadge, Stat } from '../ui/Widgets';
import { AdvisorPanel } from './Advisor';
import { GovWatch, News, PollsCard, rankOf } from './Politics';
import { ProvincesPanel } from './Provinces';

type Send = (m: ClientMessage) => void;

const LADDER: { role: PartyRole; min: number }[] = [
  { role: 'uye', min: 0 },
  { role: 'ilBaskani', min: 40 },
  { role: 'myk', min: 60 },
  { role: 'genelBaskanYardimcisi', min: 80 },
  { role: 'genelBaskan', min: 101 },
];

/** Medya ve saha çalışmaları; tahmini etkileriyle birlikte. */
export function MediaCard({ me, p, day, send }: { me: PlayerView; p: Party; day: number; send: Send }) {
  const isLeader = me.partyId === p.id;
  const ch = me.character!;
  return (
    <section className="card">
      <h3>🎥 Medya ve saha</h3>
      <p className="small muted">
        {isLeader
          ? 'Genel başkan olarak her çıkışın partinin ivmesini artırır.'
          : 'Tanınırlığın arttıkça delegeler seni ciddiye alır; saha çalışması partinin sana güvenini en çok artıran iştir.'}
      </p>
      <div className="action-grid">
        {(Object.keys(MEDIA) as MediaAction[]).map((a) => {
          const e = mediaEffect(a, ch.charisma, me.fame, isLeader);
          const until = me.cooldowns?.[a] ?? 0;
          const wait = until > day ? until - day : 0;
          return (
            <button key={a} className="action-tile" disabled={wait > 0 || e.cost > p.funds} onClick={() => send({ type: 'media', action: a })}>
              <span className="at-icon">{MEDIA[a].icon}</span>
              <b>{MEDIA[a].label}</b>
              <span className="small muted">{MEDIA[a].desc}</span>
              <span className="small est">
                Tanınırlık +{n1(e.fame)}
                {e.trust ? ` · güven +${e.trust}` : ''} · ivme +{n1(e.momentum)}
                {e.risk ? ` · gaf %${n0(e.risk * 100)}` : ''}
                {e.cost ? ` · ${e.cost} M$` : ''}
              </span>
              {wait > 0 && <span className="small tag">⏳ {wait} gün</span>}
            </button>
          );
        })}
      </div>
    </section>
  );
}

/** Parti içi kariyer: rütbe, güven, kurultay ve partiden ayrılma. */
export function CareerCard({ c, me, p, day, send }: { c: CountryState; me: PlayerView; p: Party; day: number; send: Send }) {
  const [confirm, setConfirm] = useState(false);
  useEffect(() => {
    if (!confirm) return;
    const t = setTimeout(() => setConfirm(false), 4000);
    return () => clearTimeout(t);
  }, [confirm]);
  const trust = me.membership?.trust ?? 0;
  const isLeader = me.partyId === p.id;
  const chance = challengeChance(c, p, me);
  const wait = Math.max(0, (me.cooldowns?.kurultay ?? 0) - day);
  return (
    <section className="card career">
      <h3>🪜 Parti içindeki yerin</h3>
      <div className="ladder">
        {LADDER.map((l) => {
          const reached = isLeader || (l.role !== 'genelBaskan' && trust >= l.min);
          const current = me.role === l.role;
          return (
            <div key={l.role} className={`rung ${reached ? 'on' : ''} ${current ? 'cur' : ''}`}>
              <span className="rung-dot" />
              <span className="small">{ROLE_LABELS[l.role]}</span>
            </div>
          );
        })}
      </div>
      {!isLeader && (
        <>
          <div className="slider-head small">
            <span>Partinin sana güveni</span>
            <b>{n0(trust)} / 100</b>
          </div>
          <div className="trust-bar">
            <Meter value={trust} color={p.color} />
            <i style={{ left: `${CHALLENGE_TRUST}%` }} title="Kurultay eşiği" />
          </div>
          <p className="small muted">Kurultaya gitmek için {CHALLENGE_TRUST} güven gerekir. Genel başkan: {p.leaderName}.</p>
          <button
            className="primary"
            disabled={trust < CHALLENGE_TRUST || p.inGovernment || wait > 0 || !!p.playerId}
            onClick={() => send({ type: 'challengeLeader' })}
          >
            🗳️ Kurultayda genel başkanlığa aday ol
            {trust >= CHALLENGE_TRUST && !p.inGovernment ? ` · şans ${pct(chance * 100)}` : ''}
          </button>
          {p.inGovernment && <p className="small muted">İktidardaki partide kurultay seçim öncesi açılmaz.</p>}
          {wait > 0 && <p className="small muted">Yeni kurultay için {formatGameDate(day + wait)} tarihini bekle.</p>}
        </>
      )}
      <button
        className={confirm ? 'danger small' : 'ghost small'}
        onClick={() => {
          if (confirm) send({ type: 'leaveParty' });
          setConfirm((x) => !x);
        }}
      >
        {confirm
          ? isLeader
            ? 'Emin misin? Genel başkanlığı bırakıp istifa et'
            : 'Emin misin? İstifa et'
          : `${p.short}'den istifa et`}
      </button>
      {confirm && <p className="small bad">Parti değiştirmek, katılacağın yeni partinin sana başlangıç güvenini düşürür.</p>}
    </section>
  );
}

function MemberHeader({ c, me, p, day }: { c: CountryState; me: PlayerView; p: Party; day: number }) {
  const ch = me.character!;
  return (
    <section className="hq-head card" style={{ ['--party' as string]: p.color }}>
      <Avatar a={ch.avatar} size={64} ring={p.color} />
      <div className="hq-title">
        <div className="small muted">
          <PartyBadge p={p} size={18} /> {p.name} · {rankOf(c, p)}. parti
        </div>
        <h2>{ch.name}</h2>
        <div className="small">{me.role ? ROLE_LABELS[me.role] : 'Üye'}</div>
      </div>
      <div className="hq-kpis">
        <Stat icon="🤝" label="partinin güveni" value={n0(me.membership?.trust ?? 0)} tone={(me.membership?.trust ?? 0) >= CHALLENGE_TRUST ? 'good' : 'mid'} />
        <Stat icon="📣" label="tanınırlık" value={n0(me.fame)} />
        <Stat icon="📊" label="parti anketi" value={pct(p.support)} />
        <Stat icon="🗳️" label={formatGameDate(c.nextElectionDay, false)} value={`${Math.max(0, c.nextElectionDay - day)} gün`} />
      </div>
    </section>
  );
}

const MEMBER_TABS = [
  { id: 'karargah', label: '🏠 Karargâh' },
  { id: 'iller', label: '🏙️ İller' },
  { id: 'anket', label: '📊 Anket ve Meclis' },
  { id: 'ulke', label: '🔎 Ülke Gündemi' },
] as const;

/** Genel başkan olmayan parti üyesinin ekranı. */
export function MemberView({ c, me, p, day, send }: { c: CountryState; me: PlayerView; p: Party; day: number; send: Send }) {
  const [tab, setTab] = useState<(typeof MEMBER_TABS)[number]['id']>('karargah');
  return (
    <div className="dashboard">
      <MemberHeader c={c} me={me} p={p} day={day} />
      <nav className="tabs">
        {MEMBER_TABS.map((t) => (
          <button key={t.id} className={t.id === tab ? 'active' : ''} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </nav>
      <main className="panel">
        {tab === 'karargah' && (
          <div className="two-col">
            <div className="stack">
              <AdvisorPanel c={c} me={me} day={day} send={send} onGoto={(g) => setTab(g === 'iller' ? 'iller' : 'karargah')} />
              <MediaCard me={me} p={p} day={day} send={send} />
            </div>
            <div className="stack">
              <CareerCard c={c} me={me} p={p} day={day} send={send} />
              <News c={c} />
            </div>
          </div>
        )}
        {tab === 'iller' && <ProvincesPanel c={c} me={me} day={day} send={send} governing={false} />}
        {tab === 'anket' && <PollsCard c={c} p={p} />}
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
