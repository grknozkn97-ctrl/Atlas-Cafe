import { useState } from 'react';
import { advise, advisorPersona, type Advice } from '../../shared/advisor';
import type { ClientMessage, CountryState, PlayerView } from '../../shared/types';
import { Avatar } from '../ui/Avatar';

/** Danışman: duruma göre sıralı öneriler ve tahmini sonuçları. */
export function AdvisorPanel({
  c,
  me,
  day,
  send,
  onGoto,
  limit = 4,
}: {
  c: CountryState;
  me: PlayerView;
  day: number;
  send: (m: ClientMessage) => void;
  onGoto?: (tab: NonNullable<Advice['goto']>) => void;
  limit?: number;
}) {
  const [all, setAll] = useState(false);
  const persona = advisorPersona(c, me.id);
  const tips = advise(c, me, day);
  const shown = all ? tips : tips.slice(0, limit);
  const top = tips[0];
  return (
    <section className="card advisor">
      <div className="advisor-head">
        <Avatar a={persona.avatar} size={56} />
        <div>
          <div className="title-kicker">{persona.title}</div>
          <b>{persona.name}</b>
          <p className="advisor-say">
            {top ? `“Bence önce şunu yapmalısın: ${top.title.toLocaleLowerCase('tr')}. ${top.why}”` : '“Şu an acil bir iş yok. Zamanı ilerlet, gelişmeleri birlikte izleyelim.”'}
          </p>
        </div>
      </div>
      <ol className="advice-list">
        {shown.map((a, i) => (
          <li key={a.id} className={`advice ${i === 0 ? 'top' : ''}`}>
            <span className="advice-icon">{a.icon}</span>
            <div className="advice-body">
              <b>{a.title}</b>
              {i > 0 && <span className="small muted">{a.why}</span>}
              <span className="small advice-est">📈 Tahmin: {a.estimate}</span>
            </div>
            <div className="advice-act">
              {a.action && (
                <button className={i === 0 ? 'primary small' : 'small'} onClick={() => send(a.action!)}>
                  Uygula
                </button>
              )}
              {a.goto && onGoto && (
                <button className="ghost small" onClick={() => onGoto(a.goto!)}>
                  Aç →
                </button>
              )}
            </div>
          </li>
        ))}
      </ol>
      {tips.length > limit && (
        <button className="ghost small" onClick={() => setAll((x) => !x)}>
          {all ? 'Daha az göster' : `Tüm öneriler (${tips.length})`}
        </button>
      )}
    </section>
  );
}
