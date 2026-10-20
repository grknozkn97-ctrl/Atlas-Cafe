import { useEffect, useState } from 'react';
import type { PanelProps } from '../App';
import { n1, pct } from '../format';

export function EconomyPanel({ c, send }: PanelProps) {
  const [taxes, setTaxes] = useState(c.taxes);
  const [rate, setRate] = useState(c.policyRate);
  const [raise, setRaise] = useState(0);

  // Sunucudan gelen değer değişirse (ör. bağımsız MB faizi oynattıysa) formu güncelle.
  useEffect(() => setTaxes(c.taxes), [c.taxes.income, c.taxes.corporate, c.taxes.vat]);
  useEffect(() => {
    if (c.cbIndependent) setRate(c.policyRate);
  }, [c.policyRate, c.cbIndependent]);

  const dirty =
    taxes.income !== c.taxes.income ||
    taxes.corporate !== c.taxes.corporate ||
    taxes.vat !== c.taxes.vat ||
    (!c.cbIndependent && Math.abs(rate - c.policyRate) > 1e-9) ||
    raise > 0;

  const apply = () => {
    send({
      type: 'setEconomy',
      taxes,
      policyRate: c.cbIndependent ? undefined : rate,
      minWageRaise: raise > 0 ? raise : undefined,
    });
    setRaise(0);
  };

  const realRate = c.policyRate - c.expectedInflation;

  return (
    <div className="stack">
      <div className="two-col">
        <section className="card">
          <h3>Vergiler</h3>
          <p className="muted small">Vergiyi artırmak bütçe gelirini artırır, ama büyümeyi ve ilgili grupların memnuniyetini düşürür.</p>
          <Slider label="Gelir vergisi (ortalama)" value={taxes.income} min={0} max={60} step={0.5} onChange={(v) => setTaxes({ ...taxes, income: v })} hint="Orta sınıfı etkiler" />
          <Slider label="Kurumlar vergisi" value={taxes.corporate} min={0} max={50} step={0.5} onChange={(v) => setTaxes({ ...taxes, corporate: v })} hint="İş dünyasını etkiler" />
          <Slider label="KDV" value={taxes.vat} min={0} max={35} step={0.5} onChange={(v) => setTaxes({ ...taxes, vat: v })} hint="İşçileri etkiler" />
          <div className="facts small">
            <span>Bütçe geliri: {pct(c.revenuePct)} GSYH</span>
            <span>Harcama: {pct(c.spendingPct)} GSYH</span>
            <span>Faiz ödemesi: {pct(c.interestPct)} GSYH</span>
            <span className={c.deficitPct > 3 ? 'bad' : ''}>Açık: {pct(c.deficitPct)} GSYH</span>
          </div>
        </section>

        <section className="card">
          <h3>Para politikası</h3>
          <label className="switch">
            <input
              type="checkbox"
              checked={c.cbIndependent}
              onChange={(e) => send({ type: 'setEconomy', cbIndependent: e.target.checked })}
            />
            Merkez bankası bağımsız
          </label>
          <p className="muted small">
            {c.cbIndependent
              ? 'Faizi merkez bankası enflasyona göre kendisi belirler. Piyasa güveni yüksek olur.'
              : 'Faizi sen belirliyorsun. Bağımsızlığın olmaması piyasa güvenini düşürür.'}
          </p>
          <Slider label="Politika faizi" value={rate} min={0} max={80} step={0.25} onChange={setRate} disabled={c.cbIndependent} />
          <div className="facts small">
            <span>Enflasyon beklentisi: {pct(c.expectedInflation)}</span>
            <span className={realRate < 0 ? 'bad' : ''}>Reel faiz: {pct(realRate)}</span>
          </div>
          <p className="muted small">
            Reel faiz yükseldikçe enflasyon 6-12 ay içinde düşer, ama büyüme yavaşlar ve işsizlik artar.
          </p>
        </section>
      </div>

      <section className="card">
        <h3>Asgari ücret</h3>
        <p>
          Asgari ücretin ortalama ücrete oranı: <b>{n1(c.minWageRatio * 100)}%</b>{' '}
          <span className="muted small">(başlangıçta {n1(c.initialMinWageRatio * 100)}%)</span>
        </p>
        <p className="muted small">
          Enflasyon asgari ücretin alım gücünü her gün eritir. Zam işçileri memnun eder; ama fazlası işsizliği ve
          enflasyonu artırır.
        </p>
        <Slider label="Yapılacak zam" value={raise} min={0} max={60} step={1} onChange={setRaise} unit="%" />
      </section>

      <div className="actions">
        <button className="primary" disabled={!dirty} onClick={apply}>
          Kararları uygula
        </button>
        {dirty && (
          <button
            className="ghost"
            onClick={() => {
              setTaxes(c.taxes);
              setRate(c.policyRate);
              setRaise(0);
            }}
          >
            Vazgeç
          </button>
        )}
      </div>
    </div>
  );
}

export function Slider(props: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  disabled?: boolean;
  hint?: string;
  unit?: string;
}) {
  return (
    <label className={`slider ${props.disabled ? 'disabled' : ''}`}>
      <span className="slider-head">
        <span>{props.label}</span>
        <b>
          {props.unit ?? '%'}
          {n1(props.value)}
        </b>
      </span>
      <input
        type="range"
        min={props.min}
        max={props.max}
        step={props.step}
        value={props.value}
        disabled={props.disabled}
        onChange={(e) => props.onChange(Number(e.target.value))}
      />
      {props.hint && <span className="muted small">{props.hint}</span>}
    </label>
  );
}
