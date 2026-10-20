import type { ReactNode } from 'react';
import { TRAITS, ministerScore } from '../../shared/ministers';
import type { Minister } from '../../shared/types';
import { Avatar } from './Avatar';
import { Meter, ideologyLabel } from './Widgets';

const STATS: { key: 'competence' | 'honesty' | 'loyalty' | 'popularity'; label: string; hint: string }[] = [
  { key: 'competence', label: 'Yetkinlik', hint: 'Bütçeyi ne kadar verimli kullanır' },
  { key: 'honesty', label: 'Dürüstlük', hint: 'Düşükse yolsuzluk skandalı riski' },
  { key: 'loyalty', label: 'Sadakat', hint: 'Düşükse görevden alınınca seni eleştirir' },
  { key: 'popularity', label: 'Popülerlik', hint: 'Halkın onu ne kadar sevdiği' },
];

const DEFAULT_AVATAR = { skin: 1, hair: 1, hairColor: 0, suit: 0, tie: 0 };

/** Tıklanabilir küçük karakter kartı. */
export function PersonCard({ m, sub, onClick, ring, compare }: { m: Minister; sub?: ReactNode; onClick?: () => void; ring?: string; compare?: Minister | null }) {
  const diff = compare ? ministerScore(m) - ministerScore(compare) : 0;
  return (
    <button type="button" className="person" onClick={onClick}>
      <Avatar a={m.avatar ?? DEFAULT_AVATAR} size={46} ring={ring} />
      <span className="person-text">
        <b>{m.name}</b>
        <span className="small muted">{sub ?? m.profession ?? ''}</span>
        <span className="person-traits">
          {(m.traits ?? []).slice(0, 3).map((t) => (
            <span key={t} className="trait-mini" title={TRAITS[t].label}>
              {TRAITS[t].icon}
            </span>
          ))}
          <span className="small muted">puan {Math.round(ministerScore(m) * 100)}</span>
          {compare && Math.abs(diff) >= 0.02 && <span className={`small ${diff > 0 ? 'good' : 'bad'}`}>{diff > 0 ? '▲' : '▼'}</span>}
        </span>
      </span>
    </button>
  );
}

/** Karakter profili: özgeçmiş, özellikler, istatistikler ve danışman tahmini. */
export function MinisterProfile({
  m,
  role,
  estimate,
  compare,
  children,
  onClose,
}: {
  m: Minister;
  role: string;
  estimate?: ReactNode;
  compare?: Minister | null;
  children?: ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="modal profile" onClick={(e) => e.stopPropagation()} role="dialog" aria-label={m.name}>
        <button className="ghost small modal-x" onClick={onClose} aria-label="Kapat">
          ✕
        </button>
        <div className="profile-head">
          <Avatar a={m.avatar ?? DEFAULT_AVATAR} size={96} />
          <div>
            <div className="title-kicker">{role}</div>
            <h2>{m.name}</h2>
            <div className="small muted">
              {m.age ? `${m.age} yaşında · ` : ''}
              {m.profession}
            </div>
            {m.ideology && <div className="small muted">Görüşü: {ideologyLabel(m.ideology)}</div>}
          </div>
        </div>
        {m.bio && <p className="profile-bio">{m.bio}</p>}
        {!!m.traits?.length && (
          <div className="trait-list">
            {m.traits.map((t) => (
              <div key={t} className="trait">
                <span className="trait-icon">{TRAITS[t].icon}</span>
                <div>
                  <b>{TRAITS[t].label}</b>
                  <div className="small muted">{TRAITS[t].desc}</div>
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="profile-stats">
          {STATS.map((s) => {
            const v = m[s.key] * 100;
            const d = compare ? v - compare[s.key] * 100 : 0;
            return (
              <div key={s.key} title={s.hint}>
                <div className="slider-head small">
                  <span>{s.label}</span>
                  <span>
                    {Math.round(v)}
                    {compare && Math.abs(d) >= 3 && <span className={d > 0 ? 'good' : 'bad'}> ({d > 0 ? '+' : ''}{Math.round(d)})</span>}
                  </span>
                </div>
                <Meter value={v} color={v > 66 ? 'var(--good)' : v > 40 ? 'var(--mid)' : 'var(--bad)'} />
              </div>
            );
          })}
        </div>
        {estimate && (
          <div className="advisor-note">
            <span className="an-icon">🧑‍💼</span>
            <div className="small">{estimate}</div>
          </div>
        )}
        {children && <div className="profile-actions">{children}</div>}
      </div>
    </div>
  );
}
