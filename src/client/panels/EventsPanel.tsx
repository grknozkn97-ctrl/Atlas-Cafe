import { formatGameDate } from '../../shared/constants';
import type { PanelProps } from '../App';
import { realDuration } from '../format';

export function EventsPanel({ c, day, dayMs, send }: PanelProps) {
  return (
    <div className="stack">
      {c.pendingEvents.length === 0 && (
        <section className="card">
          <p className="muted">Şu an kararını bekleyen bir konu yok.</p>
        </section>
      )}
      {c.pendingEvents.map((e) => (
        <section className="card event" key={e.id}>
          <h3>{e.title}</h3>
          <p>{e.text}</p>
          <p className="small muted">
            Karar süresi: {formatGameDate(e.deadlineDay)} (~{realDuration(e.deadlineDay - day, dayMs)}). Süre dolarsa
            "{e.options[e.defaultOption].label}" uygulanır.
          </p>
          <div className="options">
            {e.options.map((o, i) => (
              <button key={i} className="option" onClick={() => send({ type: 'resolveEvent', eventId: e.id, option: i })}>
                <b>{o.label}</b>
                <span className="small muted">{o.desc}</span>
              </button>
            ))}
          </div>
        </section>
      ))}
      <section className="card">
        <h3>Tüm haberler</h3>
        <ul className="news">
          {c.news.map((n, i) => (
            <li key={i} className={n.kind}>
              <span className="muted small">{formatGameDate(n.day)}</span> {n.text}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
