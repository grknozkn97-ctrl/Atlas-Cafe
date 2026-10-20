import { REGIME_LABELS } from '../../shared/constants';
import type { PanelProps } from '../App';
import { money, n0, pct } from '../format';

export function WorldPanel({ c, world }: PanelProps) {
  const sorted = [...world].sort((a, b) => b.gdp - a.gdp);
  return (
    <section className="card">
      <h3>Dünya</h3>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Ülke</th>
              <th>Yönetim</th>
              <th>GSYH</th>
              <th>Büyüme</th>
              <th>Enflasyon</th>
              <th>İşsizlik</th>
              <th>Destek</th>
              <th>Askeri güç</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((w) => (
              <tr key={w.id} className={w.id === c.id ? 'me' : ''}>
                <td>
                  {w.flag} {w.name}
                  <div className="small muted">{REGIME_LABELS[w.regime]}</div>
                </td>
                <td className="small">{w.ownerName ?? 'Yapay zekâ'}</td>
                <td>{money(w.gdp)}</td>
                <td>{pct(w.growth)}</td>
                <td>{pct(w.inflation)}</td>
                <td>{pct(w.unemployment)}</td>
                <td>{pct(w.approval)}</td>
                <td>{n0(w.military)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
