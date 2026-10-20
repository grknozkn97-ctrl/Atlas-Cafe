import { useState } from 'react';
import { CHALLENGE_TRUST, canJoin } from '../../shared/career';
import { ideologyDistance } from '../../shared/politics';
import type { ClientMessage, CountrySummary, Ideology, PartySummary, PlayerView } from '../../shared/types';
import { pct } from '../format';
import { Compass, PartyBadge, ideologyLabel } from '../ui/Widgets';

const COLORS = ['#d4a73c', '#e8590c', '#c2255c', '#7048e8', '#1c7ed6', '#0ca678', '#2b8a3e', '#495057'];

export function PartyChoice({
  c,
  me,
  send,
  onBack,
  onCeremony,
}: {
  c: CountrySummary;
  me: PlayerView;
  send: (m: ClientMessage) => void;
  onBack: () => void;
  onCeremony: (p: Pick<PartySummary, 'name' | 'short' | 'color'>, founded: boolean) => void;
}) {
  const character = me.character!;
  const [mode, setMode] = useState<'katil' | 'kur'>('katil');
  const [pick, setPick] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [short, setShort] = useState('');
  const [color, setColor] = useState(COLORS[0]);
  const [ideology, setIdeology] = useState<Ideology>(character.ideology);
  const parties = [...c.parties].sort((a, b) => b.support - a.support);
  const fit = (p: PartySummary) => Math.round((1 - ideologyDistance(p.ideology, character.ideology)) * 100);
  const chosen = parties.find((p) => p.id === pick);
  return (
    <main className="party-screen">
      <header className="screen-head">
        <button className="ghost small back" onClick={onBack}>
          ← Haritaya dön
        </button>
        <div className="step-pill">Adım 3 / 3</div>
        <h2>
          {c.flag} {c.name} siyasetinde yerini seç
        </h2>
        <p className="muted">
          Bir partiye üye olarak girersin: genel başkan olmak için önce partinin güvenini kazanman, sonra kurultayı kazanman gerekir.
          Parti seni görüşlerine ve tanınırlığına göre kabul eder. Kendi partini kurarsan ilk günden genel başkansın ama sıfırdan başlarsın.
        </p>
        <div className="seg">
          <button className={mode === 'katil' ? 'on' : ''} onClick={() => setMode('katil')}>
            🤝 Partiye katıl
          </button>
          <button className={mode === 'kur' ? 'on' : ''} onClick={() => setMode('kur')}>
            🚩 Parti kur
          </button>
        </div>
      </header>

      {mode === 'katil' ? (
        <div className="party-grid">
          {parties.map((p) => {
            const check = canJoin(p, character, me.fame, me.hops);
            const locked = !check.ok;
            const f = fit(p);
            return (
              <button key={p.id} className={`party-card ${pick === p.id ? 'on' : ''}`} disabled={locked} onClick={() => setPick(p.id)} style={{ borderTopColor: p.color }}>
                <div className="pc-head">
                  <PartyBadge p={p} size={46} />
                  <div>
                    <b>{p.name}</b>
                    <div className="small muted">{ideologyLabel(p.ideology)}</div>
                  </div>
                </div>
                <div className="pc-stats">
                  <div>
                    <span className="big-num">{pct(p.support)}</span>
                    <span className="small muted">anket</span>
                  </div>
                  <div>
                    <span className="big-num">{Math.round(p.seats)}%</span>
                    <span className="small muted">sandalye</span>
                  </div>
                  <div>
                    <span className={`big-num ${f > 70 ? 'good' : f > 45 ? '' : 'bad'}`}>{f}</span>
                    <span className="small muted">uyum</span>
                  </div>
                  <div>
                    <span className={`big-num ${check.trust >= 40 ? 'good' : check.trust >= 20 ? '' : 'bad'}`}>{check.ok ? check.trust : '—'}</span>
                    <span className="small muted">güven</span>
                  </div>
                </div>
                <div className="small muted">Genel başkan: {p.leaderName}</div>
                {p.inGovernment && <div className="lock">🏛️ İktidarda</div>}
                {locked && <div className="lock-reason small">🔒 {check.reason}</div>}
              </button>
            );
          })}
          {chosen && (
            <div className="join-bar card">
              <div>
                <b>{chosen.short}</b> seni üye olarak kabul ediyor. Başlangıç güvenin{' '}
                <b>{canJoin(chosen, character, me.fame, me.hops).trust}/100</b>; genel başkanlık yarışı için {CHALLENGE_TRUST} gerekir.
                {chosen.inGovernment && <div className="small muted">İktidar partisinde kurultay seçim öncesi açılmaz; yükselmek daha uzun sürer.</div>}
              </div>
              <button className="primary big" onClick={() => send({ type: 'joinParty', countryId: c.id, partyId: chosen.id })}>
                Üye ol →
              </button>
            </div>
          )}
        </div>
      ) : (
        <form
          className="found-grid"
          onSubmit={(e) => {
            e.preventDefault();
            onCeremony({ name, short, color }, true);
            send({ type: 'foundParty', countryId: c.id, name: name.trim(), short: short.trim(), color, ideology });
          }}
        >
          <section className="card">
            <h3>Parti kimliği</h3>
            <label>
              Partinin adı
              <input value={name} onChange={(e) => setName(e.target.value)} maxLength={48} placeholder="Örn. Yeni Gelecek Partisi" />
            </label>
            <label>
              Kısa adı
              <input value={short} onChange={(e) => setShort(e.target.value.toLocaleUpperCase('tr'))} maxLength={10} placeholder="YGP" />
            </label>
            <span className="small muted">Renk</span>
            <div className="swatches">
              {COLORS.map((col) => (
                <button type="button" key={col} className={`swatch ${col === color ? 'on' : ''}`} style={{ background: col }} onClick={() => setColor(col)} aria-label={col} />
              ))}
            </div>
            <div className="found-preview">
              <PartyBadge p={{ short: short || '?', color }} size={64} />
              <div>
                <b>{name || 'Partinin adı'}</b>
                <div className="small muted">{ideologyLabel(ideology)}</div>
              </div>
            </div>
          </section>
          <section className="card">
            <h3>Parti çizgisi</h3>
            <p className="small muted">Diğer partilerin konumu pusulada görünüyor. Boş bir alan bul ya da büyük bir partinin seçmenine göz dik.</p>
            <Compass value={ideology} onChange={setIdeology} dots={c.parties.map((p) => ({ ideology: p.ideology, color: p.color, label: p.short }))} />
          </section>
          <section className="card found-start">
            <h3>Başlangıç</h3>
            <ul className="perks">
              <li>✦ Anket: %0,5. Seçim barajı {c.electionThreshold ? `%${c.electionThreshold}` : 'yok'}</li>
              <li>✦ Kasa: 25 milyon $ ve küçük bir teşkilat</li>
              <li>✦ Tüm kararlar senin; kimseye hesap vermezsin</li>
            </ul>
            <button className="primary big wide" disabled={name.trim().length < 3 || !short.trim()}>
              Partiyi kur →
            </button>
          </section>
        </form>
      )}
    </main>
  );
}
