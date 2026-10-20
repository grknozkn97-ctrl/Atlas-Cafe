import { useEffect, useState } from 'react';
import { REGIME_LABELS, formatGameDate } from '../shared/constants';
import type { ClientMessage, CountryState, CountrySummary, PartySummary, PlayerView } from '../shared/types';
import { pct } from './format';
import { BudgetPanel } from './panels/BudgetPanel';
import { DefensePanel } from './panels/DefensePanel';
import { EconomyPanel } from './panels/EconomyPanel';
import { EventsPanel } from './panels/EventsPanel';
import { MinistersPanel } from './panels/MinistersPanel';
import { OverviewPanel } from './panels/OverviewPanel';
import { PeoplePanel } from './panels/PeoplePanel';
import { ProjectsPanel } from './panels/ProjectsPanel';
import { WorldPanel } from './panels/WorldPanel';
import { CharacterCreator } from './screens/CharacterCreator';
import { CountrySelect } from './screens/CountrySelect';
import { Ceremony, ElectionNight } from './screens/Overlays';
import { PartyChoice } from './screens/PartyChoice';
import { OppositionView, PoliticsPanel } from './screens/Politics';
import { Title } from './screens/Title';
import { Avatar } from './ui/Avatar';
import { Gauge, PartyBadge } from './ui/Widgets';
import { useGame } from './useGame';
import { SPEEDS, useLocalGame } from './useLocalGame';

/** `vite build --mode demo`: sunucusuz, tek oyunculu deneme sürümü */
const DEMO = import.meta.env.MODE === 'demo';

export interface PanelProps {
  c: CountryState;
  day: number;
  dayMs: number;
  world: CountrySummary[];
  send: (m: ClientMessage) => void;
}

const TABS = [
  { id: 'genel', label: '🏛️ Genel Bakış', Comp: OverviewPanel },
  { id: 'ekonomi', label: '💹 Ekonomi', Comp: EconomyPanel },
  { id: 'butce', label: '🧾 Bütçe', Comp: BudgetPanel },
  { id: 'projeler', label: '🏗️ Yatırımlar', Comp: ProjectsPanel },
  { id: 'bakanlar', label: '👥 Kabine', Comp: MinistersPanel },
  { id: 'halk', label: '🗳️ Halk ve Seçim', Comp: PeoplePanel },
  { id: 'siyaset', label: '📊 Parti ve Meclis', Comp: PoliticsPanel },
  { id: 'savunma', label: '🛡️ Savunma', Comp: DefensePanel },
  { id: 'olaylar', label: '⚠️ Gündem', Comp: EventsPanel },
  { id: 'dunya', label: '🌍 Dünya', Comp: WorldPanel },
] as const;

type TabId = (typeof TABS)[number]['id'];

export function App() {
  const { state, send, login, logout, clearElection, clearError, setSpeed } = DEMO ? useLocalGame() : useGame();
  const [browsing, setBrowsing] = useState<string | null>(null);
  const [ceremony, setCeremony] = useState<{ party: Pick<PartySummary, 'name' | 'short' | 'color'>; founded: boolean } | null>(null);
  const player = state.player;
  const screen =
    state.needsLogin || !state.playerName
      ? 'title'
      : !player?.character
        ? 'creator'
        : !player.partyId
          ? browsing
            ? 'party'
            : 'select'
          : 'game';
  useEffect(() => window.scrollTo(0, 0), [screen, browsing]);
  // Hata olursa (ör. parti adı alınmış) tören penceresini kapat.
  useEffect(() => {
    if (state.error && ceremony && !player?.partyId) setCeremony(null);
  }, [state.error, ceremony, player?.partyId]);

  const toast = (state.error || (state.notice && !ceremony)) && (
    <div className={`toast ${state.error ? 'err' : ''}`} onClick={clearError} role="status">
      {state.error ?? state.notice}
    </div>
  );

  if (screen === 'title') {
    return <Title world={state.world} demo={DEMO} connected={state.connected} onStart={() => login('Yeni lider')} />;
  }
  if (screen === 'creator') {
    return (
      <div className="app setup">
        {toast}
        <CharacterCreator send={send} />
      </div>
    );
  }
  if (screen === 'select' || screen === 'party') {
    const c = state.world.find((x) => x.id === browsing);
    return (
      <div className="app setup">
        {toast}
        {screen === 'party' && c && player?.character ? (
          <PartyChoice
            c={c}
            character={player.character}
            send={send}
            onBack={() => setBrowsing(null)}
            onCeremony={(party, founded) => setCeremony({ party, founded })}
          />
        ) : (
          <CountrySelect world={state.world} day={state.day} onChoose={setBrowsing} />
        )}
      </div>
    );
  }

  const c = state.country;
  const myParty = c?.parties.find((p) => p.id === player?.partyId) ?? null;
  const governing = !!c && c.ownerId === player?.id;
  const title = c && c.regime === 'parlamenter' ? 'Başbakan' : 'Devlet başkanı';
  return (
    <div className="app">
      <TopBar
        day={state.day}
        dayMs={state.dayMs}
        lastTickAt={state.lastTickAt}
        connected={state.connected}
        player={player}
        country={c}
        role={governing ? title : myParty ? `${myParty.short} genel başkanı` : ''}
        onLeave={() => {
          setBrowsing(null);
          send({ type: 'leaveCountry' });
        }}
        onLogout={logout}
        speedMs={state.speedMs}
        onSpeed={setSpeed}
      />
      {toast}
      {ceremony && (
        <Ceremony
          party={ceremony.party}
          founded={ceremony.founded}
          notice={state.notice}
          player={player}
          onDone={() => {
            setCeremony(null);
            clearError();
          }}
        />
      )}
      {state.electionNight && (
        <ElectionNight
          countryName={state.electionNight.countryName}
          result={state.electionNight.result}
          c={c}
          player={player}
          onClose={clearElection}
        />
      )}
      {DEMO && state.speedMs === 0 && !ceremony && !state.electionNight && (
        <button className="start-time" onClick={() => setSpeed?.(SPEEDS[1].ms)}>
          ▶ Zamanı başlat
        </button>
      )}
      {c && governing ? (
        <Dashboard c={c} day={state.day} dayMs={state.dayMs} world={state.world} send={send} title={title} />
      ) : c && myParty ? (
        <OppositionView c={c} p={myParty} day={state.day} dayMs={state.dayMs} send={send} />
      ) : (
        <div className="center muted">Yükleniyor…</div>
      )}
    </div>
  );
}

function TopBar(props: {
  day: number;
  dayMs: number;
  lastTickAt: number;
  connected: boolean;
  player: PlayerView | null;
  country: CountryState | null;
  role: string;
  onLeave: () => void;
  onLogout: () => void;
  speedMs?: number;
  onSpeed?: (ms: number) => void;
}) {
  const [now, setNow] = useState(Date.now());
  // Geri alınamaz işlemler: ilk tıklama onay ister, ikincisi uygular.
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [menu, setMenu] = useState(false);
  useEffect(() => {
    if (!confirmLeave && !confirmReset) return;
    const t = setTimeout(() => {
      setConfirmLeave(false);
      setConfirmReset(false);
    }, 4000);
    return () => clearTimeout(t);
  }, [confirmLeave, confirmReset]);
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(t);
  }, []);
  const paused = props.speedMs === 0;
  const progress = paused ? 0 : Math.min(1, (now - props.lastTickAt) / props.dayMs);
  const ch = props.player?.character;
  return (
    <header className="topbar">
      <div className="brand">DEVLET</div>
      {props.country && (
        <div className="country-name">
          <span className="flag">{props.country.flag}</span>
          <span className="cn-text">
            {props.country.name}
            <span className="muted small"> · {REGIME_LABELS[props.country.regime]}</span>
          </span>
        </div>
      )}
      <div className={`date ${paused ? 'paused' : ''}`}>
        <div>{formatGameDate(props.day)}</div>
        <div className="day-progress" title="Bir sonraki oyun gününe kalan süre">
          <div style={{ width: `${progress * 100}%` }} />
        </div>
      </div>
      {props.onSpeed && (
        <span className="speed" role="group" aria-label="Oyun hızı">
          {SPEEDS.map((sp) => (
            <button
              key={sp.label}
              title={sp.label}
              aria-label={sp.label}
              className={`ghost small ${props.speedMs === sp.ms ? 'on' : ''}`}
              onClick={() => props.onSpeed!(sp.ms)}
            >
              {sp.icon}
            </button>
          ))}
        </span>
      )}
      <div className="right">
        {!props.onSpeed && <span className={props.connected ? 'dot on' : 'dot'} title={props.connected ? 'Bağlı' : 'Bağlantı yok'} />}
        <button className="me-chip" onClick={() => setMenu((m) => !m)} aria-expanded={menu}>
          {ch && <Avatar a={ch.avatar} size={30} />}
          <span className="me-text">
            <b>{ch?.name ?? props.player?.name}</b>
            <span className="small muted">{props.role}</span>
          </span>
        </button>
        {menu && (
          <div className="me-menu card">
            <button
              className={confirmLeave ? 'danger small' : 'ghost small'}
              onClick={() => {
                if (confirmLeave) {
                  setConfirmLeave(false);
                  setMenu(false);
                  props.onLeave();
                } else setConfirmLeave(true);
              }}
            >
              {confirmLeave ? 'Emin misin? İstifa et' : 'Partiden istifa et, ülke değiştir'}
            </button>
            {props.onSpeed ? (
              <button className={confirmReset ? 'danger small' : 'ghost small'} onClick={() => (confirmReset ? props.onLogout() : setConfirmReset(true))}>
                {confirmReset ? 'Kayıt silinsin mi? Evet' : 'Baştan başla'}
              </button>
            ) : (
              <button className="ghost small" onClick={props.onLogout}>
                Çıkış
              </button>
            )}
          </div>
        )}
      </div>
    </header>
  );
}

function GovHeader({ c, day, title }: { c: CountryState; day: number; title: string }) {
  const p = c.parties.find((x) => x.id === c.rulingPartyId);
  const partners = c.parties.filter((x) => x.inGovernment && x.id !== c.rulingPartyId);
  return (
    <section className="hq-head card gov" style={{ ['--party' as string]: p?.color }}>
      {c.leader && <Avatar a={c.leader.avatar} size={72} ring={p?.color} />}
      <div className="hq-title">
        <div className="small muted">
          {c.flag} {title}
        </div>
        <h2>{c.leaderName}</h2>
        <div className="small hq-parties">
          {p && <PartyBadge p={p} size={22} />} {p?.name}
          {partners.length > 0 && <span className="muted"> + {partners.map((x) => x.short).join(', ')}</span>}
        </div>
      </div>
      <div className="hq-gauges">
        <Gauge value={c.approval} label="Halk desteği" />
        <Gauge value={c.govSeatShare} label="Meclis çoğunluğu" tone={c.govSeatShare > 50 ? 'good' : 'bad'} sub={pct(c.govSeatShare)} />
        <div className="hq-next">
          <span className="small muted">Sonraki seçim</span>
          <b>{formatGameDate(c.nextElectionDay, false)}</b>
          <span className="small muted">{Math.max(0, c.nextElectionDay - day)} gün</span>
        </div>
      </div>
    </section>
  );
}

function Dashboard(props: PanelProps & { title: string }) {
  const [tab, setTab] = useState<TabId>('genel');
  const Active = TABS.find((t) => t.id === tab)!.Comp;
  const pending = props.c.pendingEvents.length;
  return (
    <div className="dashboard">
      <GovHeader c={props.c} day={props.day} title={props.title} />
      <nav className="tabs">
        {TABS.map((t) => (
          <button key={t.id} className={t.id === tab ? 'active' : ''} onClick={() => setTab(t.id)}>
            {t.label}
            {t.id === 'olaylar' && pending > 0 && <span className="badge">{pending}</span>}
          </button>
        ))}
      </nav>
      <main className="panel">
        {pending > 0 && tab !== 'olaylar' && (
          <div className="alert" onClick={() => setTab('olaylar')}>
            ⚠️ {pending} konu kararını bekliyor. Karar vermezsen otomatik pilot varsayılan seçeneği uygular.
          </div>
        )}
        <Active {...props} />
      </main>
    </div>
  );
}
