import { useState } from 'react';
import { REGIME_LABELS, formatGameDate } from '../../shared/constants';
import type { CountrySummary } from '../../shared/types';
import { pct } from '../format';
import { Hemicycle } from '../ui/Hemicycle';
import { WorldMap } from '../ui/WorldMap';
import { PartyBadge, Stat } from '../ui/Widgets';

/** Zorluk: yüksek enflasyon, işsizlik ve borç ile parçalı bir meclis işi zorlaştırır. */
export function difficulty(c: CountrySummary): number {
  let d = 1;
  if (c.inflation > 10) d += 1;
  if (c.inflation > 30) d += 1;
  if (c.unemployment > 8) d += 1;
  if (c.debtPct > 100) d += 1;
  return Math.min(5, d);
}

function untilText(days: number) {
  if (days <= 0) return 'çok yakında';
  const y = Math.floor(days / 365);
  const m = Math.round((days % 365) / 30.4);
  return [y ? `${y} yıl` : '', m ? `${m} ay` : ''].filter(Boolean).join(' ') || `${days} gün`;
}

export function CountrySelect({
  world,
  day,
  onChoose,
}: {
  world: CountrySummary[];
  day: number;
  onChoose: (id: string) => void;
}) {
  const [sel, setSel] = useState<string | null>('tr');
  const c = world.find((x) => x.id === sel) ?? null;
  const sorted = [...world].sort((a, b) => Number(b.playable) - Number(a.playable) || a.name.localeCompare(b.name, 'tr'));
  return (
    <main className="select-screen">
      <header className="screen-head floating">
        <div className="step-pill">Adım 2 / 3</div>
        <h2>Siyasi kariyerine nerede başlayacaksın?</h2>
        <p className="muted small">Haritada ülkelere dokunup incele. Zaman sen hazır olana kadar akmaz.</p>
      </header>
      <div className="select-body">
        <div className="select-map">
          <WorldMap world={world} selected={sel} onSelect={setSel} />
          <div className="country-strip" role="list">
            {sorted.map((x) => (
              <button key={x.id} role="listitem" className={`strip-item ${x.id === sel ? 'on' : ''} ${x.playable ? '' : 'locked'}`} onClick={() => setSel(x.id)}>
                <span className="flag">{x.flag}</span>
                <span>{x.name}</span>
              </button>
            ))}
          </div>
        </div>
        {c && (
          <aside className="dossier card" key={c.id}>
            <div className="dossier-head">
              <span className="dossier-flag">{c.flag}</span>
              <div>
                <h3>{c.name}</h3>
                <div className="small muted">
                  {REGIME_LABELS[c.regime]} · {(c.population).toLocaleString('tr-TR', { maximumFractionDigits: 0 })} milyon nüfus
                </div>
              </div>
            </div>
            <div className="difficulty" title="Zorluk">
              <span className="small muted">Zorluk</span>
              {[1, 2, 3, 4, 5].map((i) => (
                <span key={i} className={i <= difficulty(c) ? 'star on' : 'star'}>
                  ★
                </span>
              ))}
            </div>
            {c.rulingParty && (
              <div className="ruling">
                <PartyBadge p={c.rulingParty} size={34} />
                <div>
                  <div className="small muted">İktidar</div>
                  <b>{c.rulingParty.name}</b>
                  <div className="small">Lider: {c.leaderName}</div>
                </div>
              </div>
            )}
            <div className="stat-grid">
              <Stat icon="💹" label="Büyüme" value={pct(c.growth)} tone={c.growth > 2 ? 'good' : c.growth > 0 ? 'mid' : 'bad'} />
              <Stat icon="🛒" label="Enflasyon" value={pct(c.inflation)} tone={c.inflation < 4 ? 'good' : c.inflation < 12 ? 'mid' : 'bad'} />
              <Stat icon="👷" label="İşsizlik" value={pct(c.unemployment)} tone={c.unemployment < 5 ? 'good' : c.unemployment < 9 ? 'mid' : 'bad'} />
              <Stat icon="👍" label="Hükümete onay" value={pct(c.approval)} tone={c.approval > 50 ? 'good' : c.approval > 35 ? 'mid' : 'bad'} />
            </div>
            {c.playable ? (
              <>
                <h4>Meclis</h4>
                <Hemicycle parties={c.parties} size={260} />
                <div className="party-list">
                  {[...c.parties]
                    .sort((a, b) => b.support - a.support)
                    .map((p) => (
                      <div key={p.id} className="party-row">
                        <span className="dot-c" style={{ background: p.color }} />
                        <span className="pr-name">{p.short}</span>
                        <span className="pr-bar">
                          <span style={{ width: `${Math.min(100, p.support * 2)}%`, background: p.color }} />
                        </span>
                        <span className="pr-num">{pct(p.support)}</span>
                        {p.inGovernment && <span className="tag">iktidar</span>}
                        {p.playerId && <span className="tag gold">oyuncu</span>}
                      </div>
                    ))}
                </div>
                <p className="small muted">
                  Sonraki seçim {formatGameDate(c.nextElectionDay, false)} ({untilText(c.nextElectionDay - day)} sonra)
                  {c.electionThreshold ? ` · seçim barajı %${c.electionThreshold}` : ''}
                </p>
                <button className="primary big wide" onClick={() => onChoose(c.id)}>
                  {c.flag} {c.name} siyasetine gir →
                </button>
              </>
            ) : (
              <div className="locked-note">
                🔒 Bu ülkede serbest seçim yok. Şimdilik yapay zekâ yönetiyor; dünyadaki rolünü diğer ülkelerden izleyebilirsin.
              </div>
            )}
          </aside>
        )}
      </div>
    </main>
  );
}
