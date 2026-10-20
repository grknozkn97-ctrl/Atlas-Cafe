import { useState } from 'react';
import { formatGameDate } from '../../shared/constants';
import type { Contribution } from '../../shared/types';
import type { PanelProps } from '../App';
import { LineChart } from '../Chart';
import { money, n1, pct, realDuration, signed } from '../format';

type ExplainKey = 'inflation' | 'growth' | 'unemployment' | 'approval';

export function OverviewPanel({ c, day, dayMs }: PanelProps) {
  const [explain, setExplain] = useState<ExplainKey>('inflation');
  const prev = c.history[c.history.length - 1];
  const kpis: { key: string; label: string; value: string; delta?: number; goodUp?: boolean; explain?: ExplainKey }[] = [
    { key: 'growth', label: 'Büyüme', value: pct(c.growth), delta: prev && c.growth - prev.growth, goodUp: true, explain: 'growth' },
    { key: 'inflation', label: 'Enflasyon', value: pct(c.inflation), delta: prev && c.inflation - prev.inflation, goodUp: false, explain: 'inflation' },
    { key: 'unemployment', label: 'İşsizlik', value: pct(c.unemployment), delta: prev && c.unemployment - prev.unemployment, goodUp: false, explain: 'unemployment' },
    { key: 'approval', label: 'Hükümete destek', value: pct(c.approval), delta: prev && c.approval - prev.approval, goodUp: true, explain: 'approval' },
    { key: 'rate', label: 'Politika faizi', value: pct(c.policyRate) },
    { key: 'deficit', label: 'Bütçe açığı / GSYH', value: pct(c.deficitPct), delta: prev && c.deficitPct - prev.deficitPct, goodUp: false },
    { key: 'debt', label: 'Kamu borcu / GSYH', value: pct(c.debtPct), delta: prev && c.debtPct - prev.debtPct, goodUp: false },
    { key: 'gdp', label: 'GSYH', value: money(c.gdp) },
    { key: 'conf', label: 'Piyasa güveni', value: `${n1(c.confidence)}/100` },
    { key: 'threat', label: 'Dış tehdit', value: `${n1(c.threat)}/100` },
  ];
  const daysToElection = c.nextElectionDay - day;
  const h = c.history.slice(-60);

  return (
    <div className="stack">
      <section className="kpi-grid">
        {kpis.map((k) => {
          const good = k.delta === undefined || Math.abs(k.delta) < 0.05 ? null : (k.delta > 0) === k.goodUp;
          return (
            <button
              key={k.key}
              className={`kpi ${k.explain === explain ? 'selected' : ''} ${k.explain ? 'clickable' : ''}`}
              onClick={() => k.explain && setExplain(k.explain)}
              disabled={!k.explain}
            >
              <div className="kpi-label">{k.label}</div>
              <div className="kpi-value">{k.value}</div>
              {k.delta !== undefined && good !== null && (
                <div className={`kpi-delta ${good ? 'good' : 'bad'}`}>
                  {signed(k.delta)} <span className="muted">geçen aya göre</span>
                </div>
              )}
            </button>
          );
        })}
      </section>

      <div className="two-col">
        <section className="card">
          <h3>Neden? {LABELS[explain]}</h3>
          <p className="muted small">
            Gösterge her gün aşağıdaki etkenlerin toplamına doğru yavaşça ilerler. Hedef değer:{' '}
            <b>{pct(sum(c.explain[explain]))}</b>
          </p>
          <ExplainList items={c.explain[explain]} skipBase={explain === 'approval'} />
        </section>
        <section className="card">
          <h3>Seçim takvimi</h3>
          {c.playable ? (
            <>
              <p>
                Sonraki seçim: <b>{formatGameDate(c.nextElectionDay)}</b>
              </p>
              <p className="muted">
                {daysToElection} oyun günü, gerçek zamanda yaklaşık {realDuration(daysToElection, dayMs)} kaldı.
              </p>
              <p className="muted small">
                Kazanmak için oyların yaklaşık yarısı gerekir. Şu anki desteğin {pct(c.approval)}.
              </p>
            </>
          ) : (
            <p className="muted">Bu rejimde seçim yok.</p>
          )}
          {c.lastElection && (
            <p className="small">
              Son seçim ({formatGameDate(c.lastElection.day, false)}): {pct(c.lastElection.vote)} ·{' '}
              {c.lastElection.won ? 'kazanıldı' : 'kaybedildi'}
            </p>
          )}
        </section>
      </div>

      <div className="two-col">
        <section className="card">
          <h3>Ekonomi (aylık)</h3>
          <LineChart
            series={[
              { label: 'Enflasyon', color: '#e8590c', values: h.map((p) => p.inflation) },
              { label: 'İşsizlik', color: '#1c7ed6', values: h.map((p) => p.unemployment) },
              { label: 'Büyüme', color: '#2f9e44', values: h.map((p) => p.growth) },
            ]}
          />
        </section>
        <section className="card">
          <h3>Destek ve borç</h3>
          <LineChart
            series={[
              { label: 'Hükümete destek', color: '#7048e8', values: h.map((p) => p.approval) },
              { label: 'Borç / GSYH', color: '#868e96', values: h.map((p) => p.debtPct) },
            ]}
          />
        </section>
      </div>

      <section className="card">
        <h3>Haberler</h3>
        <ul className="news">
          {c.news.slice(0, 12).map((n, i) => (
            <li key={i} className={n.kind}>
              <span className="muted small">{formatGameDate(n.day)}</span> {n.text}
            </li>
          ))}
          {c.news.length === 0 && <li className="muted">Henüz haber yok.</li>}
        </ul>
      </section>
    </div>
  );
}

const LABELS: Record<ExplainKey, string> = {
  inflation: 'Enflasyon',
  growth: 'Büyüme',
  unemployment: 'İşsizlik',
  approval: 'Hükümete destek',
};

function sum(x: Contribution[]) {
  return x.reduce((s, v) => s + v.value, 0);
}

export function ExplainList({ items, skipBase }: { items: Contribution[]; skipBase?: boolean }) {
  const list = items.filter((i) => Math.abs(i.value) >= 0.05 && !(skipBase && i.label === 'Taban'));
  const max = Math.max(1, ...list.map((i) => Math.abs(i.value)));
  return (
    <ul className="explain">
      {[...list]
        .sort((a, b) => Math.abs(b.value) - Math.abs(a.value))
        .map((i) => (
          <li key={i.label}>
            <span className="lbl">{i.label}</span>
            <span className="track">
              <span
                className={i.value >= 0 ? 'pos' : 'neg'}
                style={{ width: `${(Math.abs(i.value) / max) * 50}%`, [i.value >= 0 ? 'left' : 'right']: '50%' }}
              />
            </span>
            <span className="val">{signed(i.value)}</span>
          </li>
        ))}
    </ul>
  );
}
