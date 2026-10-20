import { useEffect, useMemo, useState } from 'react';
import { formatGameDate } from '../../shared/constants';
import {
  ALLOC_LABELS,
  MUNICIPAL_PROJECTS,
  attractiveness,
  housingRatio,
  isPlayerMunicipality,
  localPoll,
  municipalRevenue,
  nominationCost,
  projectCost,
} from '../../shared/local';
import type { ClientMessage, CountryState, Minister, MunicipalProjectType, PlayerView, Province } from '../../shared/types';
import { n0, n1 } from '../format';
import { MinisterProfile, PersonCard } from '../ui/MinisterProfile';
import { ProvinceMap } from '../ui/ProvinceMap';
import { Skyline } from '../ui/Skyline';
import { Meter, Stat } from '../ui/Widgets';

type Send = (m: ClientMessage) => void;

export const popText = (m: number) => (m >= 1 ? `${n1(m)} milyon` : `${n0(m * 1000)} bin`);

function Spark({ values, color = 'var(--pos)' }: { values: number[]; color?: string }) {
  if (values.length < 2) return <span className="small muted">Henüz veri yok</span>;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const pts = values.map((v, i) => `${(i / (values.length - 1)) * 100},${28 - ((v - min) / span) * 24}`).join(' ');
  return (
    <svg className="spark" viewBox="0 0 100 30" preserveAspectRatio="none">
      <polyline points={pts} fill="none" stroke={color} strokeWidth={1.6} vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

function trend(pv: Province) {
  const h = pv.popHistory;
  if (h.length < 2) return 0;
  const back = h[Math.max(0, h.length - 13)];
  return ((pv.pop - back) / back) * 100;
}

export function ProvincesPanel({ c, me, day, send, governing }: { c: CountryState; me: PlayerView; day: number; send: Send; governing: boolean }) {
  const [sel, setSel] = useState<string | null>(null);
  const [q, setQ] = useState('');
  const [view, setView] = useState<'parti' | 'gocc'>('parti');
  const myParty = c.parties.find((p) => p.id === me.partyId) ?? null;
  const memberParty = c.parties.find((p) => p.id === me.membership?.partyId) ?? null;
  const pv = c.provinces.find((x) => x.id === sel) ?? [...c.provinces].sort((a, b) => b.pop - a.pop)[0];
  const elections = c.nextLocalElectionDay < Number.MAX_SAFE_INTEGER;
  const list = useMemo(
    () =>
      [...c.provinces]
        .filter((x) => x.name.toLocaleLowerCase('tr').includes(q.toLocaleLowerCase('tr')))
        .sort((a, b) => b.pop - a.pop),
    [c.provinces, q],
  );
  const myCount = memberParty ? c.provinces.filter((x) => x.mayor.partyId === memberParty.id).length : 0;
  const nomCount = myParty ? c.provinces.filter((x) => x.nominees[myParty.id]).length : 0;
  if (!c.provinces.length) return <p className="muted">Bu ülkede il verisi yok.</p>;
  const colorFn =
    view === 'gocc'
      ? (id: string) => {
          const a = attractiveness(c.provinces.find((x) => x.id === id)!);
          return a > 0.15 ? 'var(--good)' : a > -0.1 ? 'var(--mid)' : 'var(--bad)';
        }
      : undefined;
  return (
    <div className="stack">
      <section className="card prov-summary">
        <div>
          <h3>🏙️ İller ve belediyeler</h3>
          <p className="small muted">
            {elections
              ? `Sonraki yerel seçim ${formatGameDate(c.nextLocalElectionDay, false)} (${Math.max(0, c.nextLocalElectionDay - day)} gün). Partinin kazandığı illeri o partinin genel başkanı yönetir.`
              : 'Bu ülkede belediye başkanları seçilmez; valileri merkezî hükümet atar.'}
          </p>
        </div>
        <div className="prov-kpis">
          {memberParty && <Stat icon="🏛️" label={`${memberParty.short} belediyesi`} value={`${myCount} il`} />}
          {myParty && elections && <Stat icon="🗳️" label="aday gösterilen il" value={nomCount} />}
          {myParty && elections && (
            <button className="primary" onClick={() => send({ type: 'nominateAll' })} disabled={myParty.funds < 0.5}>
              Büyük illerde aday göster
            </button>
          )}
        </div>
      </section>
      <div className="prov-layout">
        <section className="card prov-left">
          <div className="seg">
            <button className={view === 'parti' ? 'on' : ''} onClick={() => setView('parti')}>
              Belediye partisi
            </button>
            <button className={view === 'gocc' ? 'on' : ''} onClick={() => setView('gocc')}>
              Göç ve cazibe
            </button>
          </div>
          <ProvinceMap c={c} selected={pv?.id ?? null} onSelect={setSel} highlightParty={memberParty?.id} color={colorFn} />
          <input className="prov-search" placeholder="İl ara…" value={q} onChange={(e) => setQ(e.target.value)} />
          <div className="prov-list">
            {list.map((x) => {
              const p = c.parties.find((y) => y.id === x.mayor.partyId);
              const t = trend(x);
              return (
                <button key={x.id} className={`prov-row ${x.id === pv?.id ? 'on' : ''}`} onClick={() => setSel(x.id)}>
                  <span className="dot-c" style={{ background: p?.color }} />
                  <span className="pr-name">{x.name}</span>
                  <span className="small muted">{popText(x.pop)}</span>
                  <span className={`small ${t > 0.05 ? 'good' : t < -0.05 ? 'bad' : 'muted'}`}>{t > 0.05 ? '▲' : t < -0.05 ? '▼' : '•'}</span>
                  {memberParty && x.mayor.partyId === memberParty.id && <span className="tag gold">bizim</span>}
                </button>
              );
            })}
          </div>
        </section>
        {pv && <ProvinceDetail key={pv.id} c={c} pv={pv} me={me} day={day} send={send} governing={governing} />}
      </div>
    </div>
  );
}

function ProvinceDetail({ c, pv, me, day, send, governing }: { c: CountryState; pv: Province; me: PlayerView; day: number; send: Send; governing: boolean }) {
  const [profile, setProfile] = useState<{ m: Minister; role: string; nominate?: boolean } | null>(null);
  const [picking, setPicking] = useState(false);
  const party = c.parties.find((p) => p.id === pv.mayor.partyId);
  const myParty = c.parties.find((p) => p.id === me.partyId) ?? null;
  const owned = !!myParty && pv.mayor.partyId === myParty.id && isPlayerMunicipality(c, pv);
  const elections = c.nextLocalElectionDay < Number.MAX_SAFE_INTEGER && !pv.mayor.appointed;
  const ratio = housingRatio(pv);
  const A = attractiveness(pv);
  const t = trend(pv);
  const poll = elections ? localPoll(c, pv) : [];
  const myNominee = myParty ? pv.nominees[myParty.id] : undefined;
  const cost = nominationCost(pv);
  return (
    <section className="card prov-detail">
      <div className="pd-head">
        <div>
          <h2>{pv.name}</h2>
          <div className="small muted">
            {popText(pv.pop)} nüfus · kentleşme %{n0(pv.urban)} ·{' '}
            <span className={t > 0.05 ? 'good' : t < -0.05 ? 'bad' : ''}>
              yıllık {t >= 0 ? '+' : ''}
              {n1(t)}%
            </span>
          </div>
        </div>
        <div className={`pd-mood ${A > 0.15 ? 'good' : A > -0.1 ? 'mid' : 'bad'}`}>
          {A > 0.15 ? 'Göç alıyor' : A > -0.1 ? 'Durağan' : 'Göç veriyor'}
        </div>
      </div>
      <Skyline pv={pv} />
      <div className="pd-stats">
        <Stat icon="🏠" label={`konut · hane başına ${n1(ratio)}`} value={`${n0(pv.houses / 1000)} bin`} tone={ratio >= 1.02 ? 'good' : ratio >= 0.95 ? 'mid' : 'bad'} />
        <Stat icon="🩺" label="hizmet" value={n0(pv.services)} tone={pv.services > 60 ? 'good' : pv.services > 40 ? 'mid' : 'bad'} />
        <Stat icon="🚌" label="ulaşım" value={n0(pv.infra)} tone={pv.infra > 60 ? 'good' : pv.infra > 40 ? 'mid' : 'bad'} />
        <Stat icon="💼" label="iş imkânı" value={n0(pv.jobs)} tone={pv.jobs > 60 ? 'good' : pv.jobs > 40 ? 'mid' : 'bad'} />
      </div>
      <div className="pd-trend">
        <div>
          <span className="small muted">Nüfus (son {pv.popHistory.length} ay)</span>
          <Spark values={pv.popHistory} />
        </div>
        <div>
          <span className="small muted">Konut sayısı</span>
          <Spark values={pv.houseHistory} color="var(--gold)" />
        </div>
      </div>

      <h3>{pv.mayor.appointed ? 'Vali' : 'Belediye başkanı'}</h3>
      <div className="mayor-row">
        <PersonCard
          m={pv.mayor}
          ring={party?.color}
          sub={
            <>
              {party?.short} · {formatGameDate(pv.mayor.sinceDay, false)}'den beri
            </>
          }
          onClick={() => setProfile({ m: pv.mayor, role: `${pv.name} ${pv.mayor.appointed ? 'valisi' : 'belediye başkanı'}` })}
        />
        <div className="mayor-approval">
          <span className="small muted">Halkın memnuniyeti %{n0(pv.mayor.approval)}</span>
          <Meter value={pv.mayor.approval} color={pv.mayor.approval > 55 ? 'var(--good)' : pv.mayor.approval > 40 ? 'var(--mid)' : 'var(--bad)'} />
        </div>
      </div>

      {elections && (
        <>
          <h3>🗳️ Yerel seçim anketi</h3>
          <div className="local-poll">
            {poll.slice(0, 5).map((r) => {
              const p = c.parties.find((x) => x.id === r.partyId)!;
              return (
                <div key={r.partyId} className={`party-row ${r.partyId === myParty?.id ? 'me' : ''}`}>
                  <span className="dot-c" style={{ background: p.color }} />
                  <span className="pr-name">{p.short}</span>
                  <span className="pr-bar">
                    <span style={{ width: `${Math.min(100, r.vote)}%`, background: p.color }} />
                  </span>
                  <span className="pr-num">%{n0(r.vote)}</span>
                </div>
              );
            })}
          </div>
          {myParty && pv.mayor.partyId !== myParty.id && (
            <div className="nominate">
              {myNominee ? (
                <div className="mayor-row">
                  <PersonCard m={myNominee} ring={myParty.color} sub={`${myParty.short} adayı`} onClick={() => setProfile({ m: myNominee, role: `${myParty.short} ${pv.name} adayı` })} />
                  <button className="ghost small" onClick={() => setPicking((x) => !x)}>
                    Adayı değiştir
                  </button>
                </div>
              ) : (
                <div className="nominate-cta">
                  <span className="small">
                    {myParty.short} bu ilde aday göstermedi; aday göstermezsen burada oy alamazsın. Kampanya maliyeti {n1(cost)} milyon $.
                  </span>
                  <button className="primary small" onClick={() => setPicking((x) => !x)}>
                    Aday seç
                  </button>
                </div>
              )}
              {picking && (
                <div className="pool">
                  {pv.pool.map((m) => (
                    <PersonCard key={m.id} m={m} sub={`${m.profession ?? ''} · popülerlik ${n0(m.popularity * 100)}`} onClick={() => setProfile({ m, role: `${pv.name} için aday adayı`, nominate: true })} />
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {owned && <MunicipalControls c={c} pv={pv} day={day} send={send} />}
      {!owned && myParty && pv.mayor.partyId === myParty.id && pv.mayor.appointed && <p className="small muted">Bu il atanmış bir valiyle yönetiliyor.</p>}
      {!owned && !governing && (
        <p className="small muted">
          {elections
            ? 'Bu ili yönetmek için partinin yerel seçimi kazanması ve senin partinin genel başkanı olman gerekir.'
            : 'Otoriter yönetimde iller merkezden yönetilir.'}
        </p>
      )}
      {governing && <StateInvest c={c} pv={pv} send={send} />}
      {pv.projects.length > 0 && (
        <div className="pd-projects">
          {pv.projects.map((pr) => (
            <span key={pr.type} className="tag">
              {MUNICIPAL_PROJECTS[pr.type].icon} {MUNICIPAL_PROJECTS[pr.type].label} · {formatGameDate(pr.endDay, false)}
              {pr.byState ? ' · devlet' : ''}
            </span>
          ))}
        </div>
      )}

      {profile && (
        <MinisterProfile
          m={profile.m}
          role={profile.role}
          onClose={() => setProfile(null)}
          estimate={
            profile.nominate
              ? `Popülerliği yüksek aday sandıkta partinin oyunu ${n0((profile.m.popularity - 0.5) * 80)} puana kadar oynatır. Yetkinliği, kazanırsa ilin nasıl yönetileceğini belirler.`
              : undefined
          }
        >
          {profile.nominate && myParty && (
            <button
              className="primary"
              disabled={myParty.funds < cost}
              onClick={() => {
                send({ type: 'nominateMayor', provinceId: pv.id, candidateId: profile.m.id });
                setProfile(null);
                setPicking(false);
              }}
            >
              Aday göster · {n1(cost)} milyon $
            </button>
          )}
        </MinisterProfile>
      )}
    </section>
  );
}

function MunicipalControls({ c, pv, day, send }: { c: CountryState; pv: Province; day: number; send: Send }) {
  const [alloc, setAlloc] = useState(pv.alloc);
  useEffect(() => setAlloc(pv.alloc), [pv.id]);
  const total = alloc.konut + alloc.ulasim + alloc.sosyal + alloc.cevre;
  const dirty = (Object.keys(alloc) as (keyof typeof alloc)[]).some((k) => Math.abs(alloc[k] - pv.alloc[k]) > 0.5);
  return (
    <div className="muni">
      <h3>🏛️ Belediyeni yönet</h3>
      <div className="muni-cash">
        <Stat icon="💰" label="belediye kasası (milyon $)" value={n0(pv.funds)} />
        <Stat icon="📥" label="aylık yatırım geliri" value={`+${n1(municipalRevenue(c, pv) * 0.3)}`} />
      </div>
      <p className="small muted">Gelirin %70'i hizmetlere gider. Payları değiştir: konut payı yeni konut, ulaşım payı altyapı, sosyal ve çevre payı hizmet kalitesi getirir.</p>
      {(Object.keys(ALLOC_LABELS) as (keyof typeof alloc)[]).map((k) => (
        <label key={k} className="slider">
          <span className="slider-head small">
            <span>{ALLOC_LABELS[k]}</span>
            <b>%{n0((alloc[k] / (total || 1)) * 100)}</b>
          </span>
          <input type="range" min={0} max={100} value={Math.round(alloc[k])} onChange={(e) => setAlloc({ ...alloc, [k]: Number(e.target.value) })} />
        </label>
      ))}
      {dirty && (
        <button className="primary small" onClick={() => send({ type: 'municipal', provinceId: pv.id, alloc })}>
          Bütçeyi onayla
        </button>
      )}
      <div className="small muted" style={{ marginTop: 10 }}>
        Emlak vergisi
      </div>
      <div className="seg">
        {(['dusuk', 'orta', 'yuksek'] as const).map((t) => (
          <button key={t} className={pv.propertyTax === t ? 'on' : ''} onClick={() => send({ type: 'municipal', provinceId: pv.id, propertyTax: t })}>
            {t === 'dusuk' ? 'Düşük (memnuniyet +)' : t === 'orta' ? 'Orta' : 'Yüksek (gelir +%20)'}
          </button>
        ))}
      </div>
      <h4>Belediye projeleri</h4>
      <ProjectGrid c={c} pv={pv} day={day} onStart={(type) => send({ type: 'municipal', provinceId: pv.id, project: type })} budget={pv.funds} />
    </div>
  );
}

function StateInvest({ c, pv, send }: { c: CountryState; pv: Province; send: Send }) {
  return (
    <div className="muni">
      <h3>🏗️ Devlet yatırımı</h3>
      <p className="small muted">Hükümet olarak bu ile yatırım yapabilirsin. Maliyet borçla karşılanır; belediye hangi partide olursa olsun il büyür.</p>
      <ProjectGrid c={c} pv={pv} day={0} onStart={(type) => send({ type: 'stateInvest', provinceId: pv.id, project: type })} />
    </div>
  );
}

function ProjectGrid({ c, pv, onStart, budget }: { c: CountryState; pv: Province; day: number; onStart: (t: MunicipalProjectType) => void; budget?: number }) {
  return (
    <div className="muni-projects">
      {(Object.keys(MUNICIPAL_PROJECTS) as MunicipalProjectType[]).map((type) => {
        const spec = MUNICIPAL_PROJECTS[type];
        const cost = projectCost(c, pv, type);
        const running = pv.projects.some((p) => p.type === type);
        const tooSmall = !!spec.minPop && pv.pop < spec.minPop;
        const poor = budget !== undefined && budget < cost;
        return (
          <button key={type} className="action-tile" disabled={running || tooSmall || poor} onClick={() => onStart(type)}>
            <span className="at-icon">{spec.icon}</span>
            <b>{spec.label}</b>
            <span className="small muted">{spec.desc}</span>
            <span className="small">
              {n0(cost)} milyon $ · {spec.months} ay {pv.built[type] ? `· mevcut ${pv.built[type]}` : ''}
            </span>
            {running && <span className="small tag">⏳ sürüyor</span>}
          </button>
        );
      })}
    </div>
  );
}

