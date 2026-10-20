/**
 * Ülke simülasyonu. Saf fonksiyonlardan oluşur; hem sunucu hem testler kullanır.
 *
 * Model fikri: her gösterge için o anki politikalardan bir "hedef" değer hesaplanır
 * (etkenlerin toplamı) ve gösterge her gün hedefe doğru yavaşça kayar. Böylece
 * kararların etkisi gecikmeli gelir ve her değişimin nedeni etken listesinden okunabilir.
 */
import {
  BUDGET_REFERENCE,
  CAMPAIGN_DAYS,
  GROUPS,
  MAX_RALLIES,
  MINISTRIES,
  MINISTRY_LABELS,
  MINISTRY_QUALITY,
  PROJECTS,
  WIN_THRESHOLD,
  dateToDay,
  dayToDate,
  formatGameDate,
} from './constants';
import { generateMinister, ministerScore, type Rng } from './ministers';
import { holdGeneralElection, initPolitics, stepPolitics, type ElectionOutcome } from './politics';
import type {
  Contribution,
  CountrySeed,
  CountryState,
  GroupId,
  Minister,
  MinistryId,
  NewsItem,
  ProjectType,
  QualityId,
  ReportCardEntry,
  ShockTarget,
} from './types';

const DT = 1 / 365;

export const clamp = (x: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, x));
const sumValues = (c: Contribution[]) => c.reduce((s, x) => s + x.value, 0);

// ---------------------------------------------------------------- yardımcılar

export function addNews(c: CountryState, day: number, text: string, kind: NewsItem['kind'] = 'notr') {
  c.news.unshift({ day, text, kind });
  if (c.news.length > 40) c.news.length = 40;
}

export function addShock(c: CountryState, day: number, label: string, target: ShockTarget, value: number, days: number) {
  c.shocks.push({ label, target, value, endDay: day + days });
}

function shockContributions(c: CountryState, target: ShockTarget): Contribution[] {
  const byLabel = new Map<string, number>();
  for (const s of c.shocks) {
    if (s.target === target) byLabel.set(s.label, (byLabel.get(s.label) ?? 0) + s.value);
  }
  return [...byLabel].map(([label, value]) => ({ label, value }));
}

function ministerEfficiency(m: Minister | null): number {
  if (!m) return 0.45;
  return (0.6 + 0.6 * m.competence) * (1 - (1 - m.honesty) * 0.3);
}

export function budgetTotal(c: CountryState): number {
  return MINISTRIES.reduce((s, m) => s + c.budget[m], 0);
}

function activeProjectSpending(c: CountryState): number {
  return c.projects.reduce((s, p) => s + p.costPct / ((p.endDay - p.startDay) / 365), 0);
}

export function taxRevenuePct(c: CountryState): number {
  const eco = c.ministers.ekonomi;
  const hazineBudget = c.budget.ekonomi / BUDGET_REFERENCE.ekonomi;
  let eff = 0.75 + c.bureaucracy / 400 + (eco ? eco.competence * 0.1 : 0) + clamp((hazineBudget - 1) * 0.03, -0.05, 0.03);
  // Çok yüksek oranlarda kayıt dışılık artar.
  eff *= 1 - Math.max(0, c.taxes.income - 35) * 0.01 - Math.max(0, c.taxes.vat - 25) * 0.01;
  return (c.taxes.income * 0.3 + c.taxes.corporate * 0.12 + c.taxes.vat * 0.55) * eff;
}

function debtRateTarget(c: CountryState): number {
  const risk = Math.max(0, c.debtPct - 90) * 0.03 + Math.max(0, 45 - c.confidence) * 0.05;
  return Math.max(0.3, c.policyRate * 0.35 + 1.5 + risk);
}

/** Bütçe kalemlerini, gelir ve açığı yeniden hesaplar. */
export function recomputeFiscal(c: CountryState) {
  c.interestPct = (c.debtPct * c.debtRate) / 100;
  c.revenuePct = taxRevenuePct(c) + c.otherRevenuePct;
  c.spendingPct = budgetTotal(c) + activeProjectSpending(c) + c.interestPct;
  c.deficitPct = c.spendingPct - c.revenuePct;
}

export function militaryPower(c: CountryState): number {
  const spendingBn = (c.budget.savunma * c.gdp) / 100;
  return c.quality.savunma * Math.sqrt(Math.max(0, spendingBn));
}

// ---------------------------------------------------------------- hedefler

function realRate(c: CountryState) {
  return c.policyRate - c.expectedInflation;
}

export function growthTarget(c: CountryState): Contribution[] {
  const k = c.completed;
  const list: Contribution[] = [
    { label: 'Potansiyel büyüme', value: c.potentialGrowth },
    { label: 'Eğitim düzeyi', value: (c.quality.egitim - 50) * 0.01 },
    { label: 'Altyapı', value: (c.quality.altyapi - 50) * 0.012 },
    { label: 'Sanayi desteği', value: (c.quality.sanayi - 50) * 0.008 },
    { label: 'Tamamlanan yatırımlar', value: k.fabrika * 0.05 + k.enerji * 0.08 + k.otoyol * 0.06 + k.savunmaSanayi * 0.02 },
    { label: 'Faiz politikası', value: clamp(-(realRate(c) - 2) * 0.15, -4, 2) },
    { label: 'Bütçe açığı (talep)', value: clamp((c.deficitPct - 3) * 0.25, -2, 2) },
    { label: 'Vergi yükü', value: -(c.revenuePct - c.baseRevenuePct) * 0.12 },
    { label: 'Piyasa güveni', value: (c.confidence - 50) * 0.04 },
    { label: 'Dış tehdit', value: -Math.max(0, c.threat - 50) * 0.03 },
    { label: 'Asgari ücret maliyeti', value: -(c.minWageRatio - c.initialMinWageRatio) * 3 },
    ...shockContributions(c, 'growth'),
    { label: 'Yapısal etkenler', value: c.residual.growth },
  ];
  return list;
}

export function unemploymentTarget(c: CountryState): Contribution[] {
  const k = c.completed;
  const mwGap = c.minWageRatio - c.initialMinWageRatio;
  return [
    { label: 'Doğal işsizlik', value: c.naturalUnemployment },
    { label: 'Fabrikalar ve sanayi', value: -(k.fabrika * 0.15 + k.savunmaSanayi * 0.05) },
    { label: 'Süren inşaatlar', value: -c.projects.length * 0.04 },
    { label: 'Ekonomik büyüme', value: -(c.growth - c.potentialGrowth) * 0.4 },
    { label: 'Asgari ücret', value: mwGap > 0 ? mwGap * 12 : mwGap * 4 },
    { label: 'Eğitim düzeyi', value: -(c.quality.egitim - 50) * 0.015 },
    { label: 'İstihdam programları', value: -(c.quality.sosyal - 50) * 0.008 },
    ...shockContributions(c, 'unemployment'),
    { label: 'Yapısal etkenler', value: c.residual.unemployment },
  ];
}

export function inflationTarget(c: CountryState): Contribution[] {
  return [
    { label: 'Enflasyon beklentisi', value: c.expectedInflation * 0.6 },
    { label: 'Merkez bankası hedefi', value: c.inflationAnchor * 0.4 },
    { label: 'Faiz politikası', value: clamp(-(realRate(c) - 2) * 0.25, -15, 15) },
    { label: 'Talep baskısı', value: (c.growth - c.potentialGrowth) * 0.5 },
    { label: 'Bütçe açığı', value: Math.max(0, c.deficitPct - 3) * 0.4 },
    { label: 'Enerji santralleri', value: -c.completed.enerji * 0.3 },
    { label: 'Piyasa güveni', value: -(c.confidence - 50) * 0.05 },
    ...shockContributions(c, 'inflation'),
    { label: 'Yapısal etkenler', value: c.residual.inflation },
  ];
}

export function confidenceTarget(c: CountryState): number {
  const eco = c.ministers.ekonomi;
  let t = 50;
  t += (c.approval - 50) * 0.2;
  t -= Math.max(0, c.deficitPct - 3) * 3;
  t -= Math.max(0, c.debtPct - 60) * 0.15;
  t -= Math.min(25, Math.max(0, c.inflation - 4) * 0.4);
  t += c.cbIndependent ? 5 : -5;
  t += eco ? (eco.competence - 0.5) * 20 : -10;
  t -= Math.max(0, c.threat - 50) * 0.3;
  t += c.bureaucracy * 0.1 - 5;
  if (c.leader?.background === 'ekonomist') t += 6;
  if (c.leader?.background === 'isInsani') t += 4;
  t += sumValues(shockContributions(c, 'confidence'));
  return clamp(t, 0, 100);
}

export function qualityTargets(c: CountryState): Record<QualityId, number> {
  const bureau = 0.8 + c.bureaucracy / 500;
  const out: Partial<Record<QualityId, number>> = {};
  for (const m of MINISTRIES) {
    const q = MINISTRY_QUALITY[m];
    if (!q) continue;
    const ratio = c.budget[m] / BUDGET_REFERENCE[m];
    out[q] = 100 * (1 - Math.exp(-1.2 * ratio * ministerEfficiency(c.ministers[m]) * bureau * leaderBonus(c, q)));
  }
  const k = c.completed;
  out.saglik! += k.hastane * 2;
  out.egitim! += k.okul * 2;
  out.altyapi! += k.otoyol * 3;
  out.savunma! += k.savunmaSanayi * 3;
  for (const key of Object.keys(out) as QualityId[]) out[key] = clamp(out[key]!, 0, 100);
  return out as Record<QualityId, number>;
}

/** Liderin geçmişine göre bazı hizmetler daha verimli işler. */
function leaderBonus(c: CountryState, q: QualityId): number {
  const bg = c.leader?.background;
  if (bg === 'asker' && (q === 'savunma' || q === 'guvenlik')) return 1.12;
  if (bg === 'akademisyen' && (q === 'saglik' || q === 'egitim')) return 1.1;
  return 1;
}

type FactorId =
  | 'inflation'
  | 'unemployment'
  | 'growth'
  | 'minWage'
  | 'incomeTax'
  | 'corpTax'
  | 'vat'
  | 'rate'
  | 'saglik'
  | 'egitim'
  | 'sosyal'
  | 'guvenlik'
  | 'tarim'
  | 'spending'
  | 'confidence';

const FACTOR_LABELS: Record<FactorId, string> = {
  inflation: 'Enflasyon',
  unemployment: 'İşsizlik',
  growth: 'Ekonomik büyüme',
  minWage: 'Asgari ücretin alım gücü',
  incomeTax: 'Gelir vergisi',
  corpTax: 'Kurumlar vergisi',
  vat: 'KDV',
  rate: 'Kredi faizleri',
  saglik: 'Sağlık hizmetleri',
  egitim: 'Eğitim',
  sosyal: 'Sosyal güvenlik',
  guvenlik: 'İç güvenlik',
  tarim: 'Tarım desteği',
  spending: 'Kamu harcamaları',
  confidence: 'Piyasa güveni',
};

const GROUP_FACTORS: Record<GroupId, Partial<Record<FactorId, number>>> = {
  isciler: { inflation: 1, unemployment: 1.2, minWage: 1, vat: 1, sosyal: 0.5, growth: 0.3 },
  emekliler: { inflation: 1.3, saglik: 0.8, sosyal: 0.8 },
  gencler: { unemployment: 1.5, egitim: 0.8, growth: 0.5 },
  ortaSinif: { inflation: 1, incomeTax: 1, guvenlik: 0.6, growth: 0.6, saglik: 0.3, egitim: 0.3 },
  ciftciler: { tarim: 1.2, inflation: 0.7, growth: 0.3 },
  kamu: { inflation: 1, spending: 1, sosyal: 0.3 },
  isDunyasi: { corpTax: 1, rate: 1, growth: 1, confidence: 1, minWage: -0.5 },
};

function factorValues(c: CountryState): Record<FactorId, number> {
  const q = (x: number) => (x - 50) * 0.4;
  return {
    inflation: -Math.min(35, Math.max(0, c.inflation - 2) * 0.7),
    unemployment: clamp(-(c.unemployment - 5) * 2, -30, 10),
    growth: clamp(c.growth * 2, -15, 12),
    minWage: (c.minWageRatio - c.initialMinWageRatio) * 80,
    incomeTax: -(c.taxes.income - c.baseTaxes.income) * 1.0,
    corpTax: -(c.taxes.corporate - c.baseTaxes.corporate) * 1.2,
    vat: -(c.taxes.vat - c.baseTaxes.vat) * 0.8,
    rate: clamp(-(realRate(c) - 2) * 0.8, -20, 10),
    saglik: q(c.quality.saglik),
    egitim: q(c.quality.egitim),
    sosyal: q(c.quality.sosyal),
    guvenlik: q(c.quality.guvenlik) * 0.5,
    tarim: q(c.quality.tarim),
    spending: clamp((budgetTotal(c) - c.baseSpendingPct) * 2, -20, 15),
    confidence: (c.confidence - 50) * 0.3,
  };
}

function globalApprovalTerms(c: CountryState): Contribution[] {
  const ms = MINISTRIES.map((m) => c.ministers[m]).filter((m): m is Minister => !!m);
  const pop = ms.length ? ms.reduce((s, m) => s + m.popularity, 0) / ms.length : 0.3;
  return [
    { label: 'Kabinenin popülerliği', value: (pop - 0.5) * 10 },
    { label: 'Dış tehdit', value: -Math.max(0, c.threat - 60) * 0.2 },
    ...shockContributions(c, 'approval'),
  ];
}

/** Grup memnuniyet hedefleri ve onay açıklaması */
export function approvalTargets(c: CountryState): { groups: Record<GroupId, number>; explain: Contribution[] } {
  const f = factorValues(c);
  const global = globalApprovalTerms(c);
  const globalSum = sumValues(global) + c.residual.approval;
  const groups = {} as Record<GroupId, number>;
  const agg = new Map<FactorId, number>();
  for (const g of GROUPS) {
    let s = 50 + globalSum;
    for (const [fid, w] of Object.entries(GROUP_FACTORS[g.id]) as [FactorId, number][]) {
      s += f[fid] * w;
      agg.set(fid, (agg.get(fid) ?? 0) + f[fid] * w * g.weight);
    }
    if (g.id === 'isciler' && c.leader?.background === 'sendikaci') s += 4;
    if (g.id === 'isDunyasi' && c.leader?.background === 'isInsani') s += 4;
    groups[g.id] = clamp(s, 0, 100);
  }
  const explain: Contribution[] = [
    { label: 'Taban', value: 50 },
    ...[...agg].map(([fid, value]) => ({ label: FACTOR_LABELS[fid], value })),
    ...global,
    { label: 'Yapısal etkenler', value: c.residual.approval },
  ];
  return { groups, explain };
}

export function approvalFromGroups(groups: Record<GroupId, number>): number {
  return GROUPS.reduce((s, g) => s + groups[g.id] * g.weight, 0);
}

// ---------------------------------------------------------------- oluşturma

function parseYm(ym: string): number {
  const [y, m] = ym.split('-').map(Number);
  return dateToDay(y, m, 1);
}

export function createCountry(seed: CountrySeed, rng: Rng): CountryState {
  const nonDefense = seed.spendingPct - seed.defensePct;
  const refOthers = MINISTRIES.filter((m) => m !== 'savunma').reduce((s, m) => s + BUDGET_REFERENCE[m], 0);
  const budget = {} as Record<MinistryId, number>;
  for (const m of MINISTRIES) {
    budget[m] = m === 'savunma' ? seed.defensePct : round2((nonDefense * BUDGET_REFERENCE[m]) / refOthers);
  }

  const ministers = {} as Record<MinistryId, Minister | null>;
  const candidates = {} as Record<MinistryId, Minister[]>;
  for (const m of MINISTRIES) {
    ministers[m] = { ...generateMinister(rng, seed.names), appointedDay: 0 };
    candidates[m] = [0, 1, 2].map(() => generateMinister(rng, seed.names));
  }

  const playable = seed.regime !== 'otoriter';
  const c: CountryState = {
    id: seed.id,
    name: seed.name,
    flag: seed.flag,
    regime: seed.regime,
    ownerId: null,
    ownerName: null,
    population: seed.population,
    gdp: seed.gdp,
    growth: seed.growth,
    inflation: seed.inflation,
    expectedInflation: seed.inflation,
    unemployment: seed.unemployment,
    policyRate: seed.policyRate,
    debtPct: seed.debtPct,
    deficitPct: seed.deficitPct,
    revenuePct: 0,
    spendingPct: 0,
    interestPct: 0,
    debtRate: 0,
    confidence: 50,
    potentialGrowth: seed.potentialGrowth,
    naturalUnemployment: seed.naturalUnemployment,
    inflationAnchor: seed.inflationAnchor,
    baseRevenuePct: 0,
    baseSpendingPct: seed.spendingPct,
    otherRevenuePct: 0,
    initialMinWageRatio: seed.minWageRatio,
    baseTaxes: { ...seed.taxes },
    taxes: { ...seed.taxes },
    minWageRatio: seed.minWageRatio,
    budget,
    cbIndependent: seed.cbIndependent,
    quality: { saglik: 50, egitim: 50, guvenlik: 50, altyapi: 50, sosyal: 50, tarim: 50, diplomasi: 50, sanayi: 50, savunma: 50 },
    military: 0,
    threat: 30,
    tension: Object.fromEntries(seed.rivals.map((r) => [r, 1])),
    bureaucracy: seed.bureaucracy,
    groups: { isciler: 50, emekliler: 50, gencler: 50, isDunyasi: 50, ciftciler: 50, kamu: 50, ortaSinif: 50 },
    approval: seed.approval,
    govSeatShare: seed.govSeatShare,
    ministers,
    candidates,
    projects: [],
    completed: { fabrika: 0, enerji: 0, otoyol: 0, hastane: 0, okul: 0, savunmaSanayi: 0, eDevlet: 0 },
    shocks: [],
    residual: { inflation: 0, growth: 0, unemployment: 0, approval: 0 },
    pendingEvents: [],
    news: [],
    history: [],
    reportCards: [],
    quarterStart: {},
    explain: { inflation: [], growth: [], unemployment: [], approval: [] },
    electionYears: seed.electionYears,
    nextElectionDay: playable ? parseYm(seed.nextElection) : Number.MAX_SAFE_INTEGER,
    campaignRallies: 0,
    handoutUsed: false,
    lastElection: null,
    parties: [],
    rulingPartyId: '',
    regions: [],
    electionThreshold: 0,
    leader: null,
    leaderName: '',
    activePromises: [],
    govCalib: 0,
    rivals: seed.rivals,
    playable,
    names: seed.names,
  };

  // Mali denge: diğer gelirleri, başlangıç açığı gerçek veriyle tutacak şekilde ayarla.
  c.debtRate = debtRateTarget(c);
  c.interestPct = (c.debtPct * c.debtRate) / 100;
  const tax = taxRevenuePct(c);
  c.otherRevenuePct = seed.spendingPct + c.interestPct - seed.deficitPct - tax;
  recomputeFiscal(c);
  c.baseRevenuePct = c.revenuePct;

  // Hizmet kaliteleri başlangıçta dengede.
  c.quality = qualityTargets(c);
  c.military = militaryPower(c);
  calibrate(c);
  initPolitics(c, rng);
  return c;
}

/**
 * Modeli ülkenin gerçek başlangıç değerlerine oturtur: hesaplanan hedef ile gerçek
 * değer arasındaki fark "yapısal etkenler" olarak saklanır. Tehdit gibi dünyaya bağlı
 * değerler belli olduktan sonra yeniden çağrılmalıdır.
 */
export function calibrate(c: CountryState) {
  const approval = c.approval;
  c.confidence = confidenceTarget(c);
  c.residual.growth = 0;
  c.residual.unemployment = 0;
  c.residual.inflation = 0;
  c.residual.approval = 0;
  c.residual.growth = c.growth - sumValues(growthTarget(c));
  c.residual.unemployment = c.unemployment - sumValues(unemploymentTarget(c));
  c.residual.inflation = c.inflation - sumValues(inflationTarget(c));
  c.residual.approval = approval - approvalFromGroups(approvalTargets(c).groups);
  const appr = approvalTargets(c);
  c.groups = appr.groups;
  c.approval = approvalFromGroups(c.groups);
  c.confidence = confidenceTarget(c);
  c.explain = {
    growth: growthTarget(c),
    unemployment: unemploymentTarget(c),
    inflation: inflationTarget(c),
    approval: appr.explain,
  };
  c.quarterStart = snapshotKpis(c);
}

function round2(x: number) {
  return Math.round(x * 100) / 100;
}

// ---------------------------------------------------------------- günlük adım

export interface WorldContext {
  powers: Record<string, number>;
}

export function computeThreat(c: CountryState, ctx: WorldContext): number {
  const own = Math.max(1, ctx.powers[c.id] ?? militaryPower(c));
  let t = 0;
  for (const r of c.rivals) {
    const p = ctx.powers[r];
    if (p === undefined) continue;
    t += 20 * Math.min(3, p / own) * (c.tension[r] ?? 1);
  }
  return clamp(t, 0, 100);
}

export interface StepResult {
  election?: ElectionOutcome;
}

/** Bir oyun günü ilerlet. */
export function stepDay(c: CountryState, day: number, ctx: WorldContext, rng: Rng): StepResult {
  const result: StepResult = {};

  // Süresi dolan şoklar ve biten projeler
  c.shocks = c.shocks.filter((s) => s.endDay > day);
  for (const p of c.projects.filter((p) => p.endDay <= day)) {
    c.completed[p.type] += 1;
    if (p.type === 'eDevlet') c.bureaucracy = clamp(c.bureaucracy + 6, 0, 100);
    addNews(c, day, `${PROJECTS[p.type].label} tamamlandı ve hizmete açıldı.`, 'iyi');
  }
  c.projects = c.projects.filter((p) => p.endDay > day);

  // Maliye
  c.debtRate += (debtRateTarget(c) - c.debtRate) * DT;
  recomputeFiscal(c);
  c.debtPct = Math.max(0, c.debtPct + c.deficitPct * DT - c.debtPct * ((c.growth + c.inflation * 0.6) / 100) * DT);

  // Bağımsız merkez bankası faizi kendisi belirler (Taylor kuralı).
  if (c.cbIndependent) {
    const taylor = 2 + c.expectedInflation + 1.0 * (c.inflation - c.inflationAnchor) + 0.5 * (c.growth - c.potentialGrowth);
    const step = clamp(taylor - c.policyRate, -2.5 / 30, 2.5 / 30);
    c.policyRate = Math.max(0, c.policyRate + step);
  }

  // Makro göstergeler
  const g = growthTarget(c);
  const u = unemploymentTarget(c);
  const inf = inflationTarget(c);
  c.explain.growth = g;
  c.explain.unemployment = u;
  c.explain.inflation = inf;
  c.growth += (clamp(sumValues(g), -15, 15) - c.growth) / 90;
  c.unemployment += (clamp(sumValues(u), 0.8, 45) - c.unemployment) / 120;
  c.inflation += (clamp(sumValues(inf), -3, 300) - c.inflation) / 120;
  c.expectedInflation += (c.inflation - c.expectedInflation) / 150;
  c.residual.inflation *= 1 - DT;
  c.gdp *= 1 + (c.growth / 100) * DT;
  c.population *= 1 + 0.006 * DT;
  // Enflasyon asgari ücretin alım gücünü eritir (ortalama ücretler kısmen endekslidir).
  c.minWageRatio *= 1 - (Math.max(0, c.inflation) / 100) * DT * 0.6;

  // Hizmetler, ordu, tehdit
  const qt = qualityTargets(c);
  for (const k of Object.keys(qt) as QualityId[]) c.quality[k] += (qt[k] - c.quality[k]) / 180;
  c.military = militaryPower(c);
  for (const r of Object.keys(c.tension)) c.tension[r] = 1 + (c.tension[r] - 1) * (1 - 1 / 180);
  c.threat += (computeThreat(c, ctx) - c.threat) / 30;
  c.confidence += (confidenceTarget(c) - c.confidence) / 60;

  // Kamuoyu
  const a = approvalTargets(c);
  c.explain.approval = a.explain;
  for (const gr of GROUPS) c.groups[gr.id] += (a.groups[gr.id] - c.groups[gr.id]) / 45;
  c.approval = approvalFromGroups(c.groups);

  const date = dayToDate(day);
  if (date.getUTCDate() === 1) monthly(c, day, rng);
  stepPolitics(c, day, rng);

  // Seçim
  if (c.playable && day >= c.nextElectionDay) {
    result.election = holdGeneralElection(c, day, rng);
  }
  return result;
}

function monthly(c: CountryState, day: number, rng: Rng) {
  c.history.push({
    day,
    gdp: c.gdp,
    growth: c.growth,
    inflation: c.inflation,
    unemployment: c.unemployment,
    approval: c.approval,
    debtPct: c.debtPct,
    deficitPct: c.deficitPct,
    policyRate: c.policyRate,
  });
  if (c.history.length > 240) c.history.shift();
  if (c.leader?.background === 'hukukcu') c.bureaucracy = clamp(c.bureaucracy + 0.25, 0, 100);

  // Dürüst olmayan bakanlar skandala karışabilir.
  for (const m of MINISTRIES) {
    const min = c.ministers[m];
    if (min && rng() < (1 - min.honesty) * 0.02) {
      addShock(c, day, 'Yolsuzluk skandalı', 'approval', -2, 120);
      c.bureaucracy = clamp(c.bureaucracy - 0.5, 0, 100);
      addNews(c, day, `${MINISTRY_LABELS[m]} Bakanı ${min.name} yolsuzluk iddialarıyla gündemde.`, 'kotu');
    }
  }

  const month = dayToDate(day).getUTCMonth();
  if (month % 3 === 0 && day > 0) {
    quarterlyReport(c, day);
    refreshCandidates(c, day, rng);
  }
}

function snapshotKpis(c: CountryState): Record<string, number> {
  return {
    inflation: c.inflation,
    growth: c.growth,
    unemployment: c.unemployment,
    threat: c.threat,
    ...Object.fromEntries(Object.entries(c.quality).map(([k, v]) => [`q_${k}`, v])),
  };
}

function kpiScore(c: CountryState, m: MinistryId, s: Record<string, number>): { score: number; note: string } {
  const d = (k: string, now: number) => now - (s[k] ?? now);
  const fmt = (x: number) => (x >= 0 ? '+' : '') + x.toFixed(1);
  const qd = (q: QualityId) => d(`q_${q}`, c.quality[q]);
  switch (m) {
    case 'ekonomi': {
      const di = d('inflation', c.inflation);
      return { score: -di * 0.5 + (c.growth - c.potentialGrowth) * 0.5, note: `Enflasyon ${fmt(di)} puan, büyüme %${c.growth.toFixed(1)}` };
    }
    case 'disisleri': {
      const dt = d('threat', c.threat);
      return { score: -dt * 0.3 + qd('diplomasi') * 0.3, note: `Tehdit seviyesi ${fmt(dt)}` };
    }
    case 'calisma': {
      const du = d('unemployment', c.unemployment);
      return { score: -du * 2 + qd('sosyal') * 0.3, note: `İşsizlik ${fmt(du)} puan` };
    }
    case 'sanayi': {
      const du = d('unemployment', c.unemployment);
      return { score: -du + qd('sanayi') * 0.3, note: `Sanayi desteği ${fmt(qd('sanayi'))}` };
    }
    default: {
      const q = MINISTRY_QUALITY[m]!;
      return { score: qd(q) * 0.5, note: `Hizmet kalitesi ${fmt(qd(q))}` };
    }
  }
}

function quarterlyReport(c: CountryState, day: number) {
  const entries: ReportCardEntry[] = MINISTRIES.map((m) => {
    const min = c.ministers[m];
    if (!min) return { ministry: m, ministerName: null, grade: '-', note: 'Bakanlık boş' };
    const { score, note } = kpiScore(c, m, c.quarterStart);
    const total = score + (min.competence - 0.5) * 3;
    const grade = total > 1.5 ? 'A' : total > 0.5 ? 'B' : total > -0.5 ? 'C' : total > -1.5 ? 'D' : 'F';
    return { ministry: m, ministerName: min.name, grade, note };
  });
  c.reportCards.unshift({ day, entries });
  if (c.reportCards.length > 4) c.reportCards.length = 4;
  c.quarterStart = snapshotKpis(c);
}

function refreshCandidates(c: CountryState, day: number, rng: Rng) {
  // Zaman geçtikçe havuza daha nitelikli adaylar düşer.
  const bonus = Math.min(0.15, (day / 3650) * 0.15);
  for (const m of MINISTRIES) {
    if (rng() < 0.35) {
      c.candidates[m].push(generateMinister(rng, c.names, bonus));
      if (c.candidates[m].length > 5) {
        c.candidates[m].sort((a, b) => ministerScore(b) - ministerScore(a));
        c.candidates[m].length = 5;
      }
    }
  }
}

export function inCampaign(c: CountryState, day: number): boolean {
  return c.playable && day >= c.nextElectionDay - CAMPAIGN_DAYS && day < c.nextElectionDay;
}

// ---------------------------------------------------------------- oyuncu eylemleri

export class ActionError extends Error {}

export function setTaxes(c: CountryState, t: Partial<CountryState['taxes']>) {
  if (t.income !== undefined) c.taxes.income = clamp(t.income, 0, 60);
  if (t.corporate !== undefined) c.taxes.corporate = clamp(t.corporate, 0, 50);
  if (t.vat !== undefined) c.taxes.vat = clamp(t.vat, 0, 35);
  recomputeFiscal(c);
}

export function setPolicyRate(c: CountryState, rate: number) {
  if (c.cbIndependent) throw new ActionError('Merkez bankası bağımsız: faizi o belirliyor. Önce bağımsızlığı kaldırmalısın.');
  c.policyRate = clamp(rate, 0, 100);
}

export function setCbIndependence(c: CountryState, day: number, independent: boolean) {
  if (c.cbIndependent === independent) return;
  c.cbIndependent = independent;
  if (independent) {
    addNews(c, day, 'Merkez bankasına tam bağımsızlık verildi. Piyasalar olumlu karşıladı.', 'iyi');
  } else {
    addShock(c, day, 'Merkez bankası bağımsızlığının kaldırılması', 'confidence', -8, 365);
    addNews(c, day, 'Merkez bankasının bağımsızlığı kaldırıldı. Yatırımcılar tedirgin.', 'kotu');
  }
}

export function raiseMinWage(c: CountryState, day: number, raisePct: number) {
  const r = clamp(raisePct, 0, 100);
  if (r <= 0) return;
  c.minWageRatio *= 1 + r / 100;
  addShock(c, day, 'Asgari ücret artışı', 'inflation', r * 0.12, 180);
  addNews(c, day, `Asgari ücrete %${r.toFixed(0)} zam yapıldı.`, 'notr');
}

export function setBudget(c: CountryState, budget: Partial<Record<MinistryId, number>>) {
  for (const m of MINISTRIES) {
    const v = budget[m];
    if (v !== undefined && Number.isFinite(v)) c.budget[m] = clamp(v, 0, BUDGET_REFERENCE[m] * 4);
  }
  recomputeFiscal(c);
}

export function startProject(c: CountryState, day: number, type: ProjectType) {
  const def = PROJECTS[type];
  if (!def) throw new ActionError('Bilinmeyen proje.');
  if (c.projects.filter((p) => p.type === type).length >= 2) throw new ActionError('Bu türden aynı anda en fazla 2 proje yürütülebilir.');
  if (c.projects.length >= 8) throw new ActionError('Aynı anda en fazla 8 proje yürütülebilir.');
  // Düşük bürokrasi kalitesi projeleri uzatır.
  const days = Math.round(def.days * (1.3 - c.bureaucracy / 250));
  c.projects.push({ id: `p${day}-${c.projects.length}-${type}`, type, startDay: day, endDay: day + days, costPct: def.costPct });
  if (type === 'eDevlet') addShock(c, day, 'Kamu reformu tepkisi', 'approval', -1.5, 180);
  recomputeFiscal(c);
  addNews(c, day, `${def.label} projesi başladı. Tahmini bitiş: ${formatGameDate(day + days, false)}.`, 'notr');
}

export function appointMinister(c: CountryState, day: number, ministry: MinistryId, candidateId: string) {
  const list = c.candidates[ministry];
  const idx = list?.findIndex((m) => m.id === candidateId) ?? -1;
  if (idx < 0) throw new ActionError('Aday bulunamadı.');
  const [cand] = list.splice(idx, 1);
  if (c.ministers[ministry]) dismissMinister(c, day, ministry, true);
  c.ministers[ministry] = { ...cand, appointedDay: day };
  addNews(c, day, `${cand.name}, ${MINISTRY_LABELS[ministry]} Bakanı olarak atandı.`, 'notr');
}

export function dismissMinister(c: CountryState, day: number, ministry: MinistryId, replacing = false) {
  const m = c.ministers[ministry];
  if (!m) throw new ActionError('Bu bakanlık zaten boş.');
  c.ministers[ministry] = null;
  addShock(c, day, 'Kabine değişikliği', 'confidence', replacing ? -1 : -2, 90);
  if (m.loyalty < 0.4) {
    addShock(c, day, 'Görevden alınan bakanın muhalefeti', 'approval', -3, 150);
    addNews(c, day, `Görevden alınan ${m.name} hükümeti sert sözlerle eleştirdi.`, 'kotu');
  } else {
    addNews(c, day, `${MINISTRY_LABELS[ministry]} Bakanı ${m.name} görevden alındı.`, 'notr');
  }
}

export function campaignAction(c: CountryState, day: number, action: 'miting' | 'secimEkonomisi') {
  if (!inCampaign(c, day)) throw new ActionError('Seçim kampanyası, seçimden 6 ay önce başlar.');
  if (action === 'miting') {
    if (c.campaignRallies >= MAX_RALLIES) throw new ActionError('Bu kampanyada daha fazla büyük miting düzenleyemezsin.');
    c.campaignRallies += 1;
    c.debtPct += 0.02;
    addShock(c, day, 'Seçim mitingleri', 'approval', 0.5, c.nextElectionDay - day + 1);
    addNews(c, day, 'Büyük bir seçim mitingi düzenlendi.', 'notr');
  } else {
    if (c.handoutUsed) throw new ActionError('Seçim ekonomisi bu kampanyada zaten uygulandı.');
    c.handoutUsed = true;
    c.debtPct += 0.5;
    addShock(c, day, 'Seçim ekonomisi', 'approval', 4, 150);
    addShock(c, day, 'Seçim ekonomisi', 'inflation', 1.2, 240);
    addNews(c, day, 'Seçim öncesi maaş artışları ve vergi indirimleri açıklandı.', 'notr');
  }
}
