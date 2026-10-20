import { useState } from 'react';
import { MINISTRIES, MINISTRY_LABELS, formatGameDate } from '../../shared/constants';
import type { Minister, MinistryId } from '../../shared/types';
import type { PanelProps } from '../App';
import { Bar } from '../Chart';

export function MinistersPanel({ c, send }: PanelProps) {
  const [open, setOpen] = useState<MinistryId | null>(null);
  const card = c.reportCards[0];
  return (
    <div className="stack">
      <p className="muted small">
        Yetkinlik bütçenin ne kadar verimli kullanıldığını, dürüstlük yolsuzluk riskini, popülerlik halk desteğini
        belirler. Sadakati düşük bir bakanı görevden alırsan muhalefete geçip seni eleştirebilir. Karneler her çeyrek
        yenilenir{card ? ` (son karne: ${formatGameDate(card.day)})` : ''}.
      </p>
      <div className="minister-grid">
        {MINISTRIES.map((m) => {
          const min = c.ministers[m];
          const grade = card?.entries.find((e) => e.ministry === m);
          return (
            <section className="card minister" key={m}>
              <div className="minister-head">
                <h3>{MINISTRY_LABELS[m]}</h3>
                {grade && <span className={`grade g${grade.grade}`}>{grade.grade}</span>}
              </div>
              {min ? (
                <>
                  <div className="name">{min.name}</div>
                  <Stats m={min} />
                  {grade && <p className="small muted">{grade.note}</p>}
                  <div className="actions">
                    <button className="ghost small" onClick={() => setOpen(open === m ? null : m)}>
                      Adaylar ({c.candidates[m].length})
                    </button>
                    <button className="danger small" onClick={() => send({ type: 'dismissMinister', ministry: m })}>
                      Görevden al
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <p className="bad">Bakanlık boş: hizmetler verimsiz yürüyor.</p>
                  <button className="primary small" onClick={() => setOpen(m)}>
                    Bakan ata
                  </button>
                </>
              )}
              {open === m && (
                <div className="candidates">
                  {c.candidates[m].length === 0 && <p className="muted small">Şu an aday yok. Her çeyrekte yeni adaylar çıkar.</p>}
                  {c.candidates[m].map((cand) => (
                    <div className="candidate" key={cand.id}>
                      <div className="name small">{cand.name}</div>
                      <Stats m={cand} compare={min ?? undefined} />
                      <button
                        className="primary small"
                        onClick={() => {
                          send({ type: 'appointMinister', ministry: m, candidateId: cand.id });
                          setOpen(null);
                        }}
                      >
                        Ata
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}

const STATS: { key: keyof Pick<Minister, 'competence' | 'honesty' | 'loyalty' | 'popularity'>; label: string }[] = [
  { key: 'competence', label: 'Yetkinlik' },
  { key: 'honesty', label: 'Dürüstlük' },
  { key: 'loyalty', label: 'Sadakat' },
  { key: 'popularity', label: 'Popülerlik' },
];

function Stats({ m, compare }: { m: Minister; compare?: Minister }) {
  return (
    <div className="stats-grid">
      {STATS.map((s) => {
        const v = m[s.key];
        const diff = compare ? v - compare[s.key] : 0;
        return (
          <div key={s.key} className="stat">
            <span className="small muted">
              {s.label}
              {compare && Math.abs(diff) >= 0.05 && <span className={diff > 0 ? 'good' : 'bad'}> {diff > 0 ? '▲' : '▼'}</span>}
            </span>
            <Bar value={v * 100} tone="auto" />
          </div>
        );
      })}
    </div>
  );
}
