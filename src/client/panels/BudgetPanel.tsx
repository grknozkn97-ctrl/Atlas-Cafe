import { useEffect, useState } from 'react';
import { BUDGET_REFERENCE, MINISTRIES, MINISTRY_LABELS, MINISTRY_QUALITY, QUALITY_LABELS } from '../../shared/constants';
import type { MinistryId } from '../../shared/types';
import type { PanelProps } from '../App';
import { Bar } from '../Chart';
import { money, n0, n2, pct, signed } from '../format';

export function BudgetPanel({ c, send }: PanelProps) {
  const [draft, setDraft] = useState(c.budget);
  const key = MINISTRIES.map((m) => c.budget[m].toFixed(3)).join();
  useEffect(() => setDraft(c.budget), [key]);

  const total = MINISTRIES.reduce((s, m) => s + draft[m], 0);
  const current = MINISTRIES.reduce((s, m) => s + c.budget[m], 0);
  const newDeficit = c.deficitPct + (total - current);
  const dirty = MINISTRIES.some((m) => Math.abs(draft[m] - c.budget[m]) > 1e-9);

  const set = (m: MinistryId, v: number) => setDraft({ ...draft, [m]: Math.max(0, v) });

  return (
    <div className="stack">
      <section className="card">
        <h3>Bakanlık bütçeleri</h3>
        <p className="muted small">
          Rakamlar GSYH'ye oran olarak yıllık bütçedir. Az bütçe hizmet kalitesini düşürür; bakanın yetkinliği ve
          bürokrasi kalitesi, paranın ne kadar verimli kullanıldığını belirler.
        </p>
        <div className="budget-table">
          <div className="budget-row head small muted">
            <span>Bakanlık</span>
            <span>Bütçe (GSYH %)</span>
            <span>Yıllık tutar</span>
            <span>Hizmet kalitesi</span>
          </div>
          {MINISTRIES.map((m) => {
            const q = MINISTRY_QUALITY[m];
            const ratio = draft[m] / BUDGET_REFERENCE[m];
            return (
              <div className="budget-row" key={m}>
                <span>{MINISTRY_LABELS[m]}</span>
                <span className="budget-input">
                  <button className="ghost small" onClick={() => set(m, draft[m] * 0.9)}>
                    −10%
                  </button>
                  <input
                    type="number"
                    step={0.05}
                    min={0}
                    value={Number(draft[m].toFixed(2))}
                    onChange={(e) => set(m, Number(e.target.value))}
                  />
                  <button className="ghost small" onClick={() => set(m, draft[m] * 1.1)}>
                    +10%
                  </button>
                  <span className={`small ${ratio < 0.8 ? 'bad' : 'muted'}`} title="Referans düzeye göre">
                    ref. {n2(BUDGET_REFERENCE[m])}
                  </span>
                </span>
                <span className="small">{money((draft[m] * c.gdp) / 100)}</span>
                <span>
                  {q ? (
                    <>
                      <Bar value={c.quality[q]} tone="auto" />
                      <span className="small muted">
                        {QUALITY_LABELS[q]}: {n0(c.quality[q])}
                      </span>
                    </>
                  ) : (
                    <span className="small muted">Vergi tahsilatını etkiler</span>
                  )}
                </span>
              </div>
            );
          })}
        </div>
        <div className="facts">
          <span>Toplam: {pct(total)} GSYH</span>
          <span>Değişim: {signed(total - current)} puan</span>
          <span className={newDeficit > 3 ? 'bad' : ''}>Tahmini bütçe açığı: {pct(newDeficit)}</span>
        </div>
      </section>
      <div className="actions">
        <button className="primary" disabled={!dirty} onClick={() => send({ type: 'setBudget', budget: draft })}>
          Bütçeyi onayla
        </button>
        {dirty && (
          <button className="ghost" onClick={() => setDraft(c.budget)}>
            Vazgeç
          </button>
        )}
      </div>
    </div>
  );
}
