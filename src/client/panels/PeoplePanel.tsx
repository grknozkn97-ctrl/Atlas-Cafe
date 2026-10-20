import { CAMPAIGN_DAYS, GROUPS, MAX_RALLIES, WIN_THRESHOLD, formatGameDate } from '../../shared/constants';
import type { PanelProps } from '../App';
import { Bar } from '../Chart';
import { n0, pct, realDuration } from '../format';

export function PeoplePanel({ c, day, dayMs, send }: PanelProps) {
  const daysLeft = c.nextElectionDay - day;
  const campaign = c.playable && daysLeft <= CAMPAIGN_DAYS && daysLeft > 0;
  const threshold = WIN_THRESHOLD[c.regime];
  return (
    <div className="stack">
      <div className="two-col">
        <section className="card">
          <h3>Toplum grupları</h3>
          <p className="muted small">Hükümete destek, grupların nüfus ağırlıklı memnuniyetidir.</p>
          {GROUPS.map((g) => (
            <div className="group-row" key={g.id}>
              <div className="group-head">
                <span>
                  {g.label} <span className="muted small">(%{n0(g.weight * 100)})</span>
                </span>
                <b>{n0(c.groups[g.id])}</b>
              </div>
              <Bar value={c.groups[g.id]} tone="auto" />
              <div className="small muted">Önem verdikleri: {g.cares}</div>
            </div>
          ))}
        </section>
        <section className="card">
          <h3>Seçim</h3>
          <p>
            Hükümete destek: <b>{pct(c.approval)}</b>
          </p>
          <p>
            Meclisteki sandalye payın: <b>{pct(c.govSeatShare)}</b>
          </p>
          <p>
            Sonraki seçim: <b>{formatGameDate(c.nextElectionDay)}</b>{' '}
            <span className="muted">({daysLeft} oyun günü, ~{realDuration(daysLeft, dayMs)})</span>
          </p>
          <p className="muted small">
            Seçimde her parti kendi anket desteği kadar oy alır. Hükümet partisine kampanya mitingleri ve seçim vaatlerinin
            karnesi eklenir. {c.regime === 'parlamenter' ? 'En büyük parti, ideolojisi yakın partilerle meclis çoğunluğu kurar.' : `İlk turda %50'yi geçen olmazsa en güçlü iki aday ikinci tura kalır (eşik yaklaşık %${threshold}).`} Seçimi
            kaybedersen muhalefete düşersin ve yeniden mücadele edebilirsin.
          </p>
          <h4>Kampanya</h4>
          {campaign ? (
            <div className="stack-sm">
              <button
                className="primary"
                disabled={c.campaignRallies >= MAX_RALLIES}
                onClick={() => send({ type: 'campaign', action: 'miting' })}
              >
                Büyük miting düzenle ({c.campaignRallies}/{MAX_RALLIES})
              </button>
              <span className="small muted">Her miting seçimde yaklaşık +1 puan getirir.</span>
              <button className="primary" disabled={c.handoutUsed} onClick={() => send({ type: 'campaign', action: 'secimEkonomisi' })}>
                Seçim ekonomisi uygula
              </button>
              <span className="small muted">
                Maaş artışı ve vergi indirimleri: destek +4 puan, ama bütçe açığı ve enflasyon artar.
              </span>
            </div>
          ) : (
            <p className="muted small">Kampanya dönemi seçimden 6 ay önce açılır.</p>
          )}
        </section>
      </div>
    </div>
  );
}
