/**
 * İller ve belediyeler: nüfus, konut, kentleşme, belediye yönetimi ve yerel seçimler.
 * Her il aylık güncellenir; iyi yönetilen şehir göç alır ve büyür, kötü yönetilen şehir küçülür.
 */
import { dateToDay, formatGameDate } from './constants';
import { generateMinister, type Rng } from './ministers';
import { ideologyDistance } from './politics';
import { CITY_SEEDS, DEMOGRAPHY, TR_HH, TR_PROVINCES } from './provinces-data';
import { REGION_SEEDS } from './parties';
import { ActionError, addNews, clamp } from './sim';
import type {
  CountryState,
  Ideology,
  LocalElectionResult,
  Mayor,
  Minister,
  MunicipalProjectType,
  Party,
  Province,
} from './types';

// ---------------------------------------------------------------- projeler

export const MUNICIPAL_PROJECTS: Record<
  MunicipalProjectType,
  { label: string; icon: string; desc: string; cost: number; months: number; minPop?: number }
> = {
  topluKonut: { label: 'Toplu konut', icon: '🏘️', desc: 'Konut stoğu %3 artar, kiralar ve göç baskısı rahatlar.', cost: 2, months: 12 },
  park: { label: 'Park ve yeşil alan', icon: '🌳', desc: 'Hizmet kalitesi kalıcı olarak +4.', cost: 0.6, months: 4 },
  sanayi: { label: 'Organize sanayi bölgesi', icon: '🏭', desc: 'İş imkânı kalıcı olarak +6, şehir göç alır.', cost: 2.5, months: 18 },
  metro: { label: 'Metro / raylı sistem', icon: '🚇', desc: 'Ulaşım +12, şehir daha cazip olur. Nüfus 1 milyonu geçmeli.', cost: 5, months: 36, minPop: 1 },
  kentselDonusum: {
    label: 'Kentsel dönüşüm',
    icon: '🏗️',
    desc: 'Eski binalar yenilenir: konut +%2, hizmet +3. İnşaat süresince memnuniyet düşer.',
    cost: 3,
    months: 24,
  },
};

export const ALLOC_LABELS = { konut: 'Konut', ulasim: 'Ulaşım', sosyal: 'Sosyal hizmet', cevre: 'Çevre ve park' } as const;

/** Kişi başı gelir (bin $) */
export function gdpPc(c: CountryState) {
  return c.gdp / Math.max(0.1, c.population);
}

export function projectCost(c: CountryState, pv: Province, type: MunicipalProjectType) {
  return Math.round(MUNICIPAL_PROJECTS[type].cost * Math.max(0.15, pv.pop) * gdpPc(c) * 25) / 10;
}

/** Belediyenin aylık geliri (milyon $) */
export function municipalRevenue(c: CountryState, pv: Province) {
  const tax = pv.propertyTax === 'yuksek' ? 1.2 : pv.propertyTax === 'dusuk' ? 0.85 : 1;
  return pv.pop * gdpPc(c) * 1.25 * tax;
}

export function households(pv: Province) {
  return (pv.pop * 1e6) / pv.hh;
}

/** Konut/hane oranı. 1,05'in altı konut açığı demek. */
export function housingRatio(pv: Province) {
  return pv.houses / households(pv);
}

function housingScore(pv: Province) {
  return clamp((housingRatio(pv) - 1.05) * 5, -1, 1);
}

export function attractiveness(pv: Province) {
  return clamp(
    0.35 * ((pv.services - 50) / 50) + 0.3 * ((pv.jobs - 50) / 50) + 0.25 * housingScore(pv) + 0.1 * ((pv.infra - 50) / 50),
    -1,
    1,
  );
}

// ---------------------------------------------------------------- kurulum

function makeMayor(c: CountryState, rng: Rng, partyId: string, day: number, from?: Minister): Mayor {
  const base = from ?? generateMinister(rng, c.names);
  return { ...base, partyId, approval: 50 + rng() * 10, sinceDay: day, appointed: !c.playable };
}

function emptyProvince(c: CountryState, name: string, lat: number, lon: number, pop: number, hh: number, lean: Ideology): Province {
  const urban = clamp(50 + 14 * Math.log(pop / 0.2), 40, 99);
  return {
    id: `${c.id}-il${c.provinces.length + 1}`,
    name,
    lat,
    lon,
    pop,
    pop0: pop,
    houses: Math.round(((pop * 1e6) / hh) * 1.12),
    hh,
    urban,
    lean,
    mayor: null as unknown as Mayor,
    services: 50,
    infra: 50,
    jobs: 50,
    funds: 0,
    alloc: { konut: 25, ulasim: 25, sosyal: 30, cevre: 20 },
    propertyTax: 'orta',
    projects: [],
    built: { topluKonut: 0, park: 0, sanayi: 0, metro: 0, kentselDonusum: 0 },
    pool: [],
    nominees: {},
    popHistory: [pop],
    houseHistory: [],
    lastVote: null,
  };
}

const jitter = (rng: Rng, x: number) => clamp(x + (rng() - 0.5) * 0.3, -1, 1);

export function initProvinces(c: CountryState, rng: Rng) {
  const demo = DEMOGRAPHY[c.id] ?? { growth: 0.3, hh: 3 };
  const byShort = (s: string) => c.parties.find((p) => p.short === s);
  const ruling = c.parties.find((p) => p.id === c.rulingPartyId);
  c.provinces = [];
  if (c.id === 'tr') {
    const regions = REGION_SEEDS.tr;
    for (const [name, lat, lon, pop, region, mayorShort] of TR_PROVINCES) {
      const r = regions.find((x) => x.id === region)!;
      const party = byShort(mayorShort) ?? ruling!;
      const lean = {
        economic: jitter(rng, (r.lean.economic + party.ideology.economic) / 2),
        social: jitter(rng, (r.lean.social + party.ideology.social) / 2),
      };
      const pv = emptyProvince(c, name, lat, lon, pop, TR_HH[region] ?? demo.hh, lean);
      pv.mayor = makeMayor(c, rng, party.id, 0);
      c.provinces.push(pv);
    }
  } else {
    const base = ruling?.ideology ?? { economic: 0, social: 0 };
    for (const [name, lat, lon, pop] of CITY_SEEDS[c.id] ?? []) {
      // Büyük şehirler daha özgürlükçü ve biraz daha solda oy verir.
      const lean = {
        economic: jitter(rng, base.economic * 0.5 - 0.06 * Math.log(1 + pop)),
        social: jitter(rng, base.social * 0.5 - 0.12 * Math.log(1 + pop)),
      };
      const pv = emptyProvince(c, name, lat, lon, pop, demo.hh, lean);
      c.provinces.push(pv);
      if (!c.playable) pv.mayor = makeMayor(c, rng, c.rulingPartyId, 0);
      else {
        const poll = localPoll(c, pv, rng, true);
        pv.mayor = makeMayor(c, rng, poll[0]?.partyId ?? c.rulingPartyId, 0);
      }
    }
  }
  for (const pv of c.provinces) {
    refillPool(c, pv, rng);
    settle(c, pv);
    // Başlangıçtaki belediye partisi o ilde gerçekten önde olsun: yerel sadakat çarpanı.
    if (c.playable) {
      const poll = localPoll(c, pv, undefined, true);
      const top = poll[0];
      const own = poll.find((r) => r.partyId === pv.mayor.partyId);
      if (top && own) pv.bias = { [pv.mayor.partyId]: Math.min(6, Math.max(1.15, (top.vote / Math.max(1, own.vote)) * 1.3)) };
    }
    pv.funds = Math.round(municipalRevenue(c, pv) * 0.3 * 8);
  }
  // Yerel seçim takvimi
  if (!c.playable) c.nextLocalElectionDay = Number.MAX_SAFE_INTEGER;
  else if (c.id === 'tr') c.nextLocalElectionDay = dateToDay(2029, 3, 31);
  else {
    const cycle = Math.round(c.electionYears * 365.25);
    let d = c.nextElectionDay - Math.round(cycle / 2);
    while (d < 200) d += cycle;
    c.nextLocalElectionDay = d;
  }
}

/** Başlangıçta hizmet ve iş göstergelerini dengeye oturtur. */
function settle(c: CountryState, pv: Province) {
  const t = targets(c, pv);
  pv.services = t.services;
  pv.infra = t.infra;
  pv.jobs = t.jobs;
  pv.mayor.approval = t.approval;
}

function refillPool(c: CountryState, pv: Province, rng: Rng) {
  while (pv.pool.length < 3) pv.pool.push(generateMinister(rng, c.names));
}

// ---------------------------------------------------------------- aylık güncelleme

function targets(c: CountryState, pv: Province) {
  const comp = pv.mayor.competence;
  const a = pv.alloc;
  const services = clamp(25 + 45 * comp * Math.min(1, (a.sosyal + a.cevre) / 50) + 4 * pv.built.park + 3 * pv.built.kentselDonusum + 5, 0, 100);
  const infra = clamp(25 + 45 * comp * Math.min(1, a.ulasim / 25) + 12 * pv.built.metro + 5, 0, 100);
  const jobs = clamp(
    48 + c.growth * 3 - (c.unemployment - 6) * 1.5 + 6 * pv.built.sanayi + (pv.infra - 50) * 0.15 + Math.log(1 + pv.pop) * 2 + (comp - 0.5) * 12,
    0,
    100,
  );
  const tax = pv.propertyTax === 'yuksek' ? -6 : pv.propertyTax === 'dusuk' ? 3 : 0;
  const building = pv.projects.some((p) => p.type === 'kentselDonusum') ? -4 : 0;
  const approval = clamp(
    50 + (services - 50) * 0.5 + housingScore(pv) * 8 + (jobs - 50) * 0.25 + (pv.mayor.popularity - 0.5) * 20 + tax + building,
    5,
    95,
  );
  return { services, infra, jobs, approval };
}

export function stepProvinces(c: CountryState, day: number, rng: Rng) {
  if (!c.provinces?.length) return;
  const demo = DEMOGRAPHY[c.id] ?? { growth: 0.3, hh: 3 };
  const realRate = c.policyRate - c.inflation;
  const market = clamp(1 + c.growth / 6 - Math.max(0, realRate) / 25, 0.2, 1.6);
  const houseCost = 0.004 * gdpPc(c); // milyon $
  const before = c.provinces.reduce((s, p) => s + p.pop, 0);
  // Göç ülke içinde sıfır toplamlıdır: iller birbirinden göç çeker, ülke geneli sadece biraz etkilenir.
  const meanA = c.provinces.reduce((s, p) => s + attractiveness(p) * p.pop, 0) / Math.max(1e-9, before);
  for (const pv of c.provinces) {
    // Biten projeler
    for (const pr of pv.projects.filter((p) => p.endDay <= day)) {
      pv.built[pr.type] += 1;
      if (pr.type === 'topluKonut') pv.houses += Math.round(households(pv) * 0.03);
      if (pr.type === 'kentselDonusum') pv.houses += Math.round(households(pv) * 0.02);
      // Haber akışını boğmamak için yalnızca büyük şehirler, devlet yatırımları ve oyuncu belediyeleri.
      if (pr.byState || pv.pop >= 2 || isPlayerMunicipality(c, pv)) addNews(c, day, `${pv.name}: ${MUNICIPAL_PROJECTS[pr.type].label} tamamlandı.`, 'iyi');
    }
    pv.projects = pv.projects.filter((p) => p.endDay > day);

    // Gelir: %70 hizmete, %30 yatırım kasasına
    const rev = municipalRevenue(c, pv);
    pv.funds += rev * 0.3;
    pv.houses += Math.round((rev * 0.7 * (pv.alloc.konut / 100)) / Math.max(0.01, houseCost) * 0.5);

    // Piyasanın konut üretimi
    const need = households(pv) * 1.08;
    const gap = need - pv.houses;
    pv.houses += Math.round((Math.max(0, gap) * 0.015 + pv.houses * 0.0009) * market);

    const t = targets(c, pv);
    pv.services += (t.services - pv.services) / 6;
    pv.infra += (t.infra - pv.infra) / 6;
    pv.jobs += (t.jobs - pv.jobs) / 4;
    pv.mayor.approval += (t.approval - pv.mayor.approval) / 4;

    // Nüfus: doğal artış + cazibeye bağlı göç
    const A = attractiveness(pv);
    const g = demo.growth + (A - meanA) * 3.5 + meanA * 0.15;
    pv.pop *= 1 + g / 1200;
    pv.urban = clamp(pv.urban + (A > 0 ? 0.04 : 0.01) * (1 - pv.urban / 100) * 10, 0, 99.5);

    pv.popHistory.push(Math.round(pv.pop * 1000) / 1000);
    if (pv.popHistory.length > 72) pv.popHistory.shift();
    pv.houseHistory.push(pv.houses);
    if (pv.houseHistory.length > 72) pv.houseHistory.shift();

    // Oyuncuya ait olmayan belediyeler kendi projelerini yürütür.
    if (!isPlayerMunicipality(c, pv) && !pv.projects.length && rng() < 0.25) aiProject(c, pv, day);
  }
  const after = c.provinces.reduce((s, p) => s + p.pop, 0);
  if (before > 0) c.population *= after / before;
  for (const pv of c.provinces) refillPool(c, pv, rng);
}

function aiProject(c: CountryState, pv: Province, day: number) {
  const want: MunicipalProjectType =
    housingRatio(pv) < 1.04 ? 'topluKonut' : pv.jobs < 45 ? 'sanayi' : pv.pop >= 1 && pv.built.metro === 0 ? 'metro' : 'park';
  const cost = projectCost(c, pv, want);
  if (want === 'park' && pv.built.park >= 4) return;
  if (pv.funds >= cost) {
    pv.funds -= cost;
    pv.projects.push({ type: want, endDay: day + MUNICIPAL_PROJECTS[want].months * 30, byState: false });
  }
}

export function isPlayerMunicipality(c: CountryState, pv: Province) {
  if (pv.mayor.playerId) return true;
  const p = c.parties.find((x) => x.id === pv.mayor.partyId);
  return !!p?.playerId && !pv.mayor.appointed;
}

// ---------------------------------------------------------------- yerel seçim

function fit(p: Party, pv: Province) {
  return clamp(1.3 - ideologyDistance(p.ideology, pv.lean) * 1.6, 0.25, 1.6);
}

/** Bir partinin o ildeki adayı: oyuncu partisi sadece aday gösterdiği yerde yarışır. */
export function candidateOf(pv: Province, p: Party): Minister | null {
  if (p.playerId) {
    if (pv.nominees[p.id]) return pv.nominees[p.id];
    if (pv.mayor?.partyId === p.id) return pv.mayor;
    return null;
  }
  if (pv.mayor?.partyId === p.id) return pv.mayor;
  return null;
}

/** İl bazında yerel anket. `withAi` true ise yapay zekâ partileri isimsiz adayla yarışır. */
export function localPoll(c: CountryState, pv: Province, rng?: Rng, initial = false): { partyId: string; vote: number }[] {
  const rows: { partyId: string; score: number }[] = [];
  for (const p of c.parties) {
    const cand = candidateOf(pv, p);
    if (p.playerId && !cand) continue;
    if (!p.playerId && p.support < 1.5 && !cand) continue;
    let score = Math.max(0.1, p.support) * fit(p, pv) * (pv.bias?.[p.id] ?? 1);
    if (cand) score *= 1 + (cand.popularity - 0.5) * 0.8;
    if (!initial && pv.mayor?.partyId === p.id) score *= 1 + (pv.mayor.approval - 50) / 80;
    if (rng) score *= 1 + (rng() - 0.5) * 0.3;
    rows.push({ partyId: p.id, score });
  }
  const sum = rows.reduce((s, r) => s + r.score, 0) || 1;
  return rows.map((r) => ({ partyId: r.partyId, vote: (r.score / sum) * 100 })).sort((a, b) => b.vote - a.vote);
}

export function holdLocalElection(c: CountryState, day: number, rng: Rng): LocalElectionResult {
  let flips = 0;
  for (const pv of c.provinces) {
    const poll = localPoll(c, pv, rng);
    pv.lastVote = poll.map((r) => ({ partyId: r.partyId, vote: Math.round(r.vote * 10) / 10 }));
    const winner = c.parties.find((p) => p.id === poll[0]?.partyId);
    if (!winner) continue;
    const cand = candidateOf(pv, winner);
    if (winner.id !== pv.mayor.partyId) flips += 1;
    if (!cand || cand.id !== pv.mayor.id) {
      pv.mayor = makeMayor(c, rng, winner.id, day, cand ?? undefined);
      pv.pool = pv.pool.filter((x) => x.id !== pv.mayor.id);
    } else {
      pv.mayor.approval = Math.max(pv.mayor.approval, 55);
    }
    pv.nominees = {};
  }
  const tally = new Map<string, { provinces: number; pop: number }>();
  for (const pv of c.provinces) {
    const t = tally.get(pv.mayor.partyId) ?? { provinces: 0, pop: 0 };
    t.provinces += 1;
    t.pop += pv.pop;
    tally.set(pv.mayor.partyId, t);
  }
  const result: LocalElectionResult = {
    day,
    tally: [...tally].map(([partyId, t]) => ({ partyId, ...t })).sort((a, b) => b.provinces - a.provinces),
    flips,
  };
  c.lastLocalElection = result;
  c.nextLocalElectionDay = day + Math.round(c.electionYears * 365.25);
  const top = c.parties.find((p) => p.id === result.tally[0]?.partyId);
  addNews(c, day, `Yerel seçim sonuçlandı: ${top?.short ?? '?'} ${result.tally[0]?.provinces ?? 0} ili kazandı, ${flips} belediye el değiştirdi.`, 'notr');
  for (const pv of c.provinces) refillPool(c, pv, rng);
  return result;
}

/** Belediyelerin partilerin anketine etkisi (belediyecilik). */
export function municipalAppeal(c: CountryState, p: Party): number {
  if (!c.provinces?.length) return 0;
  const total = c.provinces.reduce((s, x) => s + x.pop, 0) || 1;
  return c.provinces.reduce((s, pv) => (pv.mayor.partyId === p.id ? s + (pv.pop / total) * ((pv.mayor.approval - 50) / 3) : s), 0);
}

// ---------------------------------------------------------------- oyuncu eylemleri

export function nominationCost(pv: Province) {
  return Math.round((0.3 + pv.pop * 0.3) * 10) / 10;
}

export function nominate(c: CountryState, p: Party, provinceId: string, candidateId: string | null, day: number) {
  const pv = c.provinces.find((x) => x.id === provinceId);
  if (!pv) throw new ActionError('İl bulunamadı.');
  if (!c.playable) throw new ActionError('Bu ülkede yerel seçim yapılmıyor.');
  if (c.nextLocalElectionDay - day < 1) throw new ActionError('Seçim günü aday değiştirilemez.');
  if (candidateId === null) {
    const old = pv.nominees[p.id];
    if (old) pv.pool.push(old);
    delete pv.nominees[p.id];
    return;
  }
  const cand = pv.pool.find((x) => x.id === candidateId);
  if (!cand) throw new ActionError('Aday bulunamadı.');
  const cost = nominationCost(pv);
  if (p.funds < cost) throw new ActionError(`Aday kampanyası için ${cost} milyon $ gerekiyor.`);
  p.funds -= cost;
  const old = pv.nominees[p.id];
  if (old) pv.pool.push(old);
  pv.pool = pv.pool.filter((x) => x.id !== cand.id);
  pv.nominees[p.id] = cand;
}

/** En uygun adayları parasının yettiği illere, büyük şehirden başlayarak gösterir. */
export function nominateAll(c: CountryState, p: Party, day: number): string {
  let n = 0;
  for (const pv of [...c.provinces].sort((a, b) => b.pop - a.pop)) {
    if (pv.nominees[p.id] || pv.mayor.partyId === p.id) continue;
    const best = [...pv.pool].sort((a, b) => b.popularity - a.popularity)[0];
    if (!best || p.funds < nominationCost(pv)) continue;
    nominate(c, p, pv.id, best.id, day);
    n += 1;
  }
  return n ? `${n} ilde aday gösterildi.` : 'Yeni aday gösterilecek il yok ya da kasa yetmiyor.';
}

export function municipalAction(
  c: CountryState,
  pv: Province,
  day: number,
  input: { alloc?: Province['alloc']; propertyTax?: Province['propertyTax']; project?: MunicipalProjectType },
): string | void {
  if (input.alloc) {
    const a = input.alloc;
    const vals = [a.konut, a.ulasim, a.sosyal, a.cevre].map((x) => clamp(Math.round(Number(x) || 0), 0, 100));
    const sum = vals.reduce((s, x) => s + x, 0);
    if (sum <= 0) throw new ActionError('Bütçe dağılımı boş olamaz.');
    const k = 100 / sum;
    pv.alloc = { konut: vals[0] * k, ulasim: vals[1] * k, sosyal: vals[2] * k, cevre: vals[3] * k };
  }
  if (input.propertyTax) {
    if (!['dusuk', 'orta', 'yuksek'].includes(input.propertyTax)) throw new ActionError('Geçersiz vergi.');
    pv.propertyTax = input.propertyTax;
  }
  if (input.project) return startMunicipalProject(c, pv, day, input.project, false);
}

export function startMunicipalProject(c: CountryState, pv: Province, day: number, type: MunicipalProjectType, byState: boolean) {
  const spec = MUNICIPAL_PROJECTS[type];
  if (!spec) throw new ActionError('Bilinmeyen proje.');
  if (spec.minPop && pv.pop < spec.minPop) throw new ActionError(`${spec.label} için nüfus en az ${spec.minPop} milyon olmalı.`);
  if (pv.projects.some((p) => p.type === type)) throw new ActionError('Bu proje zaten sürüyor.');
  const cost = projectCost(c, pv, type);
  if (byState) {
    // Devlet yatırımı borçla finanse edilir.
    c.debtPct += (cost / 1000 / c.gdp) * 100;
  } else {
    if (pv.funds < cost) throw new ActionError(`Belediye kasasında ${cost.toFixed(0)} milyon $ gerekiyor (mevcut ${pv.funds.toFixed(0)}).`);
    pv.funds -= cost;
  }
  pv.projects.push({ type, endDay: day + spec.months * 30, byState });
  addNews(c, day, `${pv.name}: ${spec.label} projesi başladı${byState ? ' (devlet yatırımı)' : ''}. Bitiş ${formatGameDate(day + spec.months * 30, false)}.`, 'iyi');
  return `${spec.label} başladı: ${cost.toFixed(0)} milyon $, ${spec.months} ay.`;
}


/** Şehrin gelişmişlik düzeyi 0-1: gelir, hizmet ve ulaşım. Görsellerde yeni/eski görünümü belirler. */
export function development(c: CountryState, pv: Province) {
  const income = (Math.log10(Math.max(1, gdpPc(c))) - 0.5) / 1.5;
  const city = (pv.services + pv.infra - 100) / 200 + pv.built.metro * 0.05 + pv.built.kentselDonusum * 0.04;
  return clamp(income * 0.75 + city + 0.1, 0, 1);
}
