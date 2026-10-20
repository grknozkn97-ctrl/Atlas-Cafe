import { QUALITY_LABELS } from '../../shared/constants';
import type { PanelProps } from '../App';
import { Bar } from '../Chart';
import { money, n0, n1, pct } from '../format';

export function DefensePanel({ c, world }: PanelProps) {
  const rivals = c.rivals.map((r) => world.find((w) => w.id === r)).filter((x): x is NonNullable<typeof x> => !!x);
  return (
    <div className="stack">
      <div className="two-col">
        <section className="card">
          <h3>Silahlı kuvvetler</h3>
          <p>
            Askeri güç: <b>{n0(c.military)}</b>
          </p>
          <p>
            Savunma bütçesi: <b>{pct(c.budget.savunma)}</b> GSYH ({money((c.budget.savunma * c.gdp) / 100)})
          </p>
          <div className="small muted">{QUALITY_LABELS.savunma}</div>
          <Bar value={c.quality.savunma} tone="auto" />
          <p className="small muted">
            Askeri güç, ordunun hazırlığı ile savunma harcamasının büyüklüğünden hesaplanır. Bütçeyi "Bütçe"
            sekmesinden, yerli savunma sanayiini "Yatırımlar" sekmesinden artırabilirsin.
          </p>
        </section>
        <section className="card">
          <h3>Dış tehdit: {n1(c.threat)}/100</h3>
          <Bar value={c.threat} tone={c.threat > 60 ? 'bad' : c.threat > 40 ? 'mid' : 'good'} />
          <p className="small muted">
            Tehdit 50'yi geçince büyüme ve piyasa güveni zarar görür; 60'ı geçince halk da tedirgin olur. Aşırı
            savunma harcaması ise ekonomiye yük olur.
          </p>
          <h4>Rakip ülkeler</h4>
          {rivals.length === 0 && <p className="muted small">Belirgin bir rakip yok.</p>}
          {rivals.map((r) => (
            <div key={r.id} className="rival-row">
              <span>
                {r.flag} {r.name}
              </span>
              <span className="small">Güç {n0(r.military)}</span>
              <span className="small muted">Gerginlik ×{n1(c.tension[r.id] ?? 1)}</span>
              <span className="small muted">{r.ownerName ? `Oyuncu: ${r.ownerName}` : 'Yapay zekâ'}</span>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}
