import { PROJECTS, PROJECT_TYPES, formatGameDate } from '../../shared/constants';
import type { PanelProps } from '../App';
import { Bar } from '../Chart';
import { money, n2, realDuration } from '../format';

export function ProjectsPanel({ c, day, dayMs, send }: PanelProps) {
  const durationFactor = 1.3 - c.bureaucracy / 250;
  return (
    <div className="stack">
      <section className="card">
        <h3>Yeni yatırım başlat</h3>
        <p className="muted small">
          Maliyet yapım süresine yayılır ve bütçe açığına eklenir. Bürokrasi kalitesi ({Math.round(c.bureaucracy)}/100)
          yapım süresini etkiler.
        </p>
        <div className="project-grid">
          {PROJECT_TYPES.map((t) => {
            const p = PROJECTS[t];
            const days = Math.round(p.days * durationFactor);
            const running = c.projects.filter((x) => x.type === t).length;
            return (
              <div className="project-card" key={t}>
                <div className="name">{p.label}</div>
                <p className="small muted">{p.desc}</p>
                <div className="small">
                  Maliyet: {money((p.costPct * c.gdp) / 100)} (GSYH %{n2(p.costPct)})
                </div>
                <div className="small">
                  Süre: {days} oyun günü (~{realDuration(days, dayMs)})
                </div>
                <div className="small muted">Tamamlanan: {c.completed[t]}</div>
                <button className="primary small" disabled={running >= 2} onClick={() => send({ type: 'startProject', projectType: t })}>
                  {running >= 2 ? 'Sınırda (2 proje)' : 'Başlat'}
                </button>
              </div>
            );
          })}
        </div>
      </section>
      <section className="card">
        <h3>Süren projeler</h3>
        {c.projects.length === 0 && <p className="muted">Şu anda süren proje yok.</p>}
        {c.projects.map((p) => {
          const progress = ((day - p.startDay) / (p.endDay - p.startDay)) * 100;
          return (
            <div key={p.id} className="project-row">
              <span>{PROJECTS[p.type].label}</span>
              <Bar value={progress} tone="good" />
              <span className="small muted">Bitiş: {formatGameDate(p.endDay)}</span>
            </div>
          );
        })}
      </section>
    </div>
  );
}
