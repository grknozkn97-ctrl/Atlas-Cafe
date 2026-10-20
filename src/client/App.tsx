import { useEffect, useState } from 'react';
import { REGIME_LABELS, formatGameDate } from '../shared/constants';
import type { ClientMessage, CountryState, CountrySummary } from '../shared/types';
import { money, pct } from './format';
import { BudgetPanel } from './panels/BudgetPanel';
import { DefensePanel } from './panels/DefensePanel';
import { EconomyPanel } from './panels/EconomyPanel';
import { EventsPanel } from './panels/EventsPanel';
import { MinistersPanel } from './panels/MinistersPanel';
import { OverviewPanel } from './panels/OverviewPanel';
import { PeoplePanel } from './panels/PeoplePanel';
import { ProjectsPanel } from './panels/ProjectsPanel';
import { WorldPanel } from './panels/WorldPanel';
import { useGame } from './useGame';

export interface PanelProps {
  c: CountryState;
  day: number;
  dayMs: number;
  world: CountrySummary[];
  send: (m: ClientMessage) => void;
}

const TABS = [
  { id: 'genel', label: 'Genel Bakış', Comp: OverviewPanel },
  { id: 'ekonomi', label: 'Ekonomi', Comp: EconomyPanel },
  { id: 'butce', label: 'Bütçe', Comp: BudgetPanel },
  { id: 'projeler', label: 'Yatırımlar', Comp: ProjectsPanel },
  { id: 'bakanlar', label: 'Kabine', Comp: MinistersPanel },
  { id: 'halk', label: 'Halk ve Seçim', Comp: PeoplePanel },
  { id: 'savunma', label: 'Savunma', Comp: DefensePanel },
  { id: 'olaylar', label: 'Gündem', Comp: EventsPanel },
  { id: 'dunya', label: 'Dünya', Comp: WorldPanel },
] as const;

type TabId = (typeof TABS)[number]['id'];

export function App() {
  const { state, send, login, logout, clearGameOver, clearError } = useGame();
  const countryId = state.country?.id ?? null;
  useEffect(() => window.scrollTo(0, 0), [countryId]);

  if (state.needsLogin) return <Login onLogin={login} error={state.error} connected={state.connected} />;
  if (!state.playerName) return <div className="center muted">Bağlanılıyor…</div>;

  return (
    <div className="app">
      <TopBar
        day={state.day}
        dayMs={state.dayMs}
        lastTickAt={state.lastTickAt}
        connected={state.connected}
        playerName={state.playerName}
        country={state.country}
        onLeave={() => {
          if (confirmLeave()) send({ type: 'leaveCountry' });
        }}
        onLogout={logout}
      />
      {state.error && (
        <div className="toast" onClick={clearError}>
          {state.error}
        </div>
      )}
      {state.gameOver && (
        <div className="modal-bg">
          <div className="modal">
            <h2>İktidarı kaybettin</h2>
            <p>
              {state.gameOver.countryName}: {state.gameOver.reason}
            </p>
            <p className="muted">Ülke artık yapay zekâ tarafından yönetiliyor. Yeni bir ülke seçerek tekrar deneyebilirsin.</p>
            <button className="primary" onClick={clearGameOver}>
              Tamam
            </button>
          </div>
        </div>
      )}
      {state.country ? (
        <Dashboard c={state.country} day={state.day} dayMs={state.dayMs} world={state.world} send={send} />
      ) : (
        <CountryPicker world={state.world} onPick={(id) => send({ type: 'chooseCountry', countryId: id })} />
      )}
    </div>
  );
}

function confirmLeave() {
  // Tarayıcı onay penceresi yerine basit bir çift tıklama koruması yeterli olurdu;
  // ama ülkeyi bırakmak geri alınamaz, bu yüzden açıkça soruyoruz.
  return window.confirm('Ülkenin yönetimini bırakmak istediğine emin misin? Ülke yapay zekâya geçer.');
}

function Login({ onLogin, error, connected }: { onLogin: (n: string) => void; error: string | null; connected: boolean }) {
  const [name, setName] = useState('');
  return (
    <div className="center">
      <form
        className="card login"
        onSubmit={(e) => {
          e.preventDefault();
          if (name.trim()) onLogin(name.trim());
        }}
      >
        <h1>🏛️ Devlet</h1>
        <p className="muted">Gerçek zamanlı ülke yönetim simülasyonu. Bir ülke seç, ekonomiyi yönet, seçimleri kazan.</p>
        <label>
          Oyuncu adın
          <input value={name} onChange={(e) => setName(e.target.value)} maxLength={24} autoFocus placeholder="Örn. Gürkan" />
        </label>
        <button className="primary" disabled={!connected || !name.trim()}>
          {connected ? 'Oyuna gir' : 'Sunucuya bağlanılıyor…'}
        </button>
        {error && <p className="error">{error}</p>}
      </form>
    </div>
  );
}

function TopBar(props: {
  day: number;
  dayMs: number;
  lastTickAt: number;
  connected: boolean;
  playerName: string;
  country: CountryState | null;
  onLeave: () => void;
  onLogout: () => void;
}) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(t);
  }, []);
  const progress = Math.min(1, (now - props.lastTickAt) / props.dayMs);
  return (
    <header className="topbar">
      <div className="brand">🏛️ Devlet</div>
      {props.country && (
        <div className="country-name">
          {props.country.flag} {props.country.name}
          <span className="muted small"> · {REGIME_LABELS[props.country.regime]}</span>
        </div>
      )}
      <div className="date">
        <div>{formatGameDate(props.day)}</div>
        <div className="day-progress" title="Bir sonraki oyun gününe kalan süre">
          <div style={{ width: `${progress * 100}%` }} />
        </div>
      </div>
      <div className="right">
        <span className={props.connected ? 'dot on' : 'dot'} title={props.connected ? 'Bağlı' : 'Bağlantı yok'} />
        <span className="small">{props.playerName}</span>
        {props.country && (
          <button className="ghost small" onClick={props.onLeave}>
            Ülkeyi bırak
          </button>
        )}
        <button className="ghost small" onClick={props.onLogout}>
          Çıkış
        </button>
      </div>
    </header>
  );
}

function CountryPicker({ world, onPick }: { world: CountrySummary[]; onPick: (id: string) => void }) {
  const sorted = [...world].sort((a, b) => Number(b.playable) - Number(a.playable) || b.gdp - a.gdp);
  return (
    <main className="picker">
      <h2>Yöneteceğin ülkeyi seç</h2>
      <p className="muted">
        Seçilmeyen ülkeleri yapay zekâ yönetir. Otoriter rejimler şimdilik sadece yapay zekâya açık.
      </p>
      <div className="country-grid">
        {sorted.map((c) => {
          const taken = !!c.ownerName;
          const disabled = !c.playable || taken;
          return (
            <button key={c.id} className="country-card" disabled={disabled} onClick={() => onPick(c.id)}>
              <div className="flag">{c.flag}</div>
              <div className="name">{c.name}</div>
              <div className="small muted">{REGIME_LABELS[c.regime]}</div>
              <div className="stats small">
                <span>GSYH {money(c.gdp)}</span>
                <span>Enflasyon {pct(c.inflation)}</span>
                <span>İşsizlik {pct(c.unemployment)}</span>
                <span>Onay {pct(c.approval)}</span>
              </div>
              <div className="owner small">
                {taken ? `Yönetici: ${c.ownerName}` : c.playable ? 'Boşta (yapay zekâ)' : 'Sadece yapay zekâ'}
              </div>
            </button>
          );
        })}
      </div>
    </main>
  );
}

function Dashboard(props: PanelProps) {
  const [tab, setTab] = useState<TabId>('genel');
  const Active = TABS.find((t) => t.id === tab)!.Comp;
  const pending = props.c.pendingEvents.length;
  return (
    <div className="dashboard">
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
