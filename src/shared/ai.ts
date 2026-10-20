/**
 * Oyuncusu olmayan ülkeleri yöneten basit yapay zekâ. Ayda bir karar verir.
 */
import { BUDGET_REFERENCE, MINISTRIES } from './constants';
import { ministerScore } from './ministers';
import { appointMinister, clamp, raiseMinWage, recomputeFiscal, startProject } from './sim';
import type { CountryState } from './types';

export function aiMonthly(c: CountryState, day: number, month: number) {
  // Faiz: bağımsız merkez bankası yoksa Taylor kuralına yakın davran.
  if (!c.cbIndependent) {
    const target = 2 + c.expectedInflation + 0.8 * (c.inflation - c.inflationAnchor) + 0.3 * (c.growth - c.potentialGrowth);
    c.policyRate = Math.max(0, c.policyRate + clamp(target - c.policyRate, -2, 2));
  }

  // Yılda bir asgari ücret: alım gücünü başlangıç düzeyine getir.
  if (month === 0 && c.minWageRatio < c.initialMinWageRatio) {
    raiseMinWage(c, day, (c.initialMinWageRatio / c.minWageRatio - 1) * 100);
  }

  // Bütçe dengesi
  if (c.deficitPct > 4.5) {
    for (const m of MINISTRIES) if (m !== 'savunma') c.budget[m] *= 0.98;
  } else if (c.deficitPct < 1.5 && c.approval < 45) {
    c.budget.saglik *= 1.03;
    c.budget.egitim *= 1.03;
    c.budget.calisma *= 1.02;
  }
  if (c.threat > 60 && c.budget.savunma < BUDGET_REFERENCE.savunma * 3) c.budget.savunma *= 1.04;
  if (c.threat < 30 && c.deficitPct > 3) c.budget.savunma *= 0.99;
  recomputeFiscal(c);

  // Yatırımlar
  const tryStart = (t: Parameters<typeof startProject>[2]) => {
    try {
      startProject(c, day, t);
    } catch {
      /* sınır doldu */
    }
  };
  if (c.deficitPct < 5) {
    if (c.unemployment > c.naturalUnemployment + 1 && !c.projects.some((p) => p.type === 'fabrika')) tryStart('fabrika');
    else if (c.quality.saglik < 45 && !c.projects.some((p) => p.type === 'hastane')) tryStart('hastane');
    else if (c.threat > 65 && !c.projects.some((p) => p.type === 'savunmaSanayi')) tryStart('savunmaSanayi');
  }

  // Bakanlar: boşları doldur, çok daha iyi aday çıkarsa değiştir.
  for (const m of MINISTRIES) {
    const cands = c.candidates[m];
    if (!cands.length) continue;
    const best = cands.reduce((a, b) => (ministerScore(b) > ministerScore(a) ? b : a));
    const cur = c.ministers[m];
    if (!cur || ministerScore(best) > ministerScore(cur) + 0.15) appointMinister(c, day, m, best.id);
  }
}
