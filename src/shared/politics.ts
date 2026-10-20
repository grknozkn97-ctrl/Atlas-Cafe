/**
 * Siyaset katmanı: partiler, anketler, muhalefet eylemleri, seçimler ve iktidar değişimi.
 */
import { BUDGET_REFERENCE, MINISTRIES, MINISTRY_LABELS, WIN_THRESHOLD, formatGameDate } from './constants';
import { generateMinister, ministerScore, type Rng } from './ministers';
import { ELECTION_THRESHOLD, PARTY_SEEDS, REGION_SEEDS, genericRegions } from './parties';
import { ActionError, addNews, addShock, clamp } from './sim';
import type {
  ActivePromise,
  BackgroundId,
  Character,
  CountryState,
  ElectionPartyResult,
  ElectionResult,
  Ideology,
  MinistryId,
  Party,
  PromiseId,
} from './types';

// ---------------------------------------------------------------- karakter

export const BACKGROUNDS: Record<
  BackgroundId,
  { label: string; desc: string; charisma: number; perks: string[] }
> = {
  ekonomist: {
    label: 'Ekonomist',
    desc: 'Merkez bankası ve finans dünyasından geliyor.',
    charisma: 0.45,
    perks: ['Piyasa güveni +6', 'Ekonomi sözleri daha inandırıcı'],
  },
  asker: {
    label: 'Emekli general',
    desc: 'Ordudan gelen disiplinli bir lider.',
    charisma: 0.55,
    perks: ['Ordu hazırlığı ve iç güvenlik daha verimli', 'Savunma sözleri daha çekici'],
  },
  isInsani: {
    label: 'İş insanı',
    desc: 'Büyük bir şirketi yönetmiş, iş dünyasında tanınıyor.',
    charisma: 0.55,
    perks: ['Bağış toplama %50 daha etkili', 'Piyasa güveni +4'],
  },
  sendikaci: {
    label: 'Sendika lideri',
    desc: 'Sahada büyümüş, kalabalıkları coşturmayı bilen biri.',
    charisma: 0.7,
    perks: ['Mitingler %25 daha etkili', 'İşçilerin desteği yüksek'],
  },
  akademisyen: {
    label: 'Akademisyen',
    desc: 'Saygın bir profesör, televizyonların aranan konuğu.',
    charisma: 0.45,
    perks: ['Basın açıklamaları %30 daha etkili', 'Eğitim ve sağlık daha verimli'],
  },
  hukukcu: {
    label: 'Hukukçu',
    desc: 'Yıllarca avukatlık ve yargıçlık yapmış.',
    charisma: 0.5,
    perks: ['Teşkilat kurmak daha ucuz', 'Bürokrasi zamanla iyileşir, yolsuzluk azalır'],
  },
};

export function makeCharacter(input: Omit<Character, 'charisma'>): Character {
  const bg = BACKGROUNDS[input.background];
  if (!bg) throw new ActionError('Geçersiz geçmiş.');
  const name = String(input.name ?? '').trim().slice(0, 32);
  if (name.length < 2) throw new ActionError('Karakterine bir isim ver.');
  const age = clamp(Math.round(Number(input.age) || 45), 30, 80);
  // Orta yaş en karizmatik dönem kabul edilir.
  const ageFactor = 1 - Math.abs(age - 50) / 100;
  return {
    name,
    age,
    background: input.background,
    ideology: normIdeology(input.ideology),
    avatar: {
      skin: clamp(Math.round(input.avatar?.skin ?? 0), 0, 5),
      hair: clamp(Math.round(input.avatar?.hair ?? 0), 0, 5),
      hairColor: clamp(Math.round(input.avatar?.hairColor ?? 0), 0, 5),
      suit: clamp(Math.round(input.avatar?.suit ?? 0), 0, 5),
      tie: clamp(Math.round(input.avatar?.tie ?? 0), 0, 5),
    },
    charisma: Math.round(bg.charisma * ageFactor * 100) / 100 + 0.1,
  };
}

export function normIdeology(x: Partial<Ideology> | undefined): Ideology {
  return {
    economic: clamp(Number(x?.economic) || 0, -1, 1),
    social: clamp(Number(x?.social) || 0, -1, 1),
  };
}

export function ideologyDistance(a: Ideology, b: Ideology): number {
  return Math.hypot(a.economic - b.economic, a.social - b.social) / Math.SQRT2 / 2;
}

// ---------------------------------------------------------------- vaatler

export interface PromiseDef {
  label: string;
  short: string;
  /** Muhalefetteyken desteğe katkısı */
  appeal: number;
  measure: (c: CountryState) => number;
  kept: (now: number, baseline: number) => boolean;
  target: string;
}

export const PROMISES: Record<PromiseId, PromiseDef> = {
  enflasyon: {
    label: "Enflasyonu %10'un altına indireceğiz",
    short: 'Tek haneli enflasyon',
    appeal: 2,
    measure: (c) => c.inflation,
    kept: (now) => now < 10,
    target: 'Enflasyon < %10',
  },
  asgariUcret: {
    label: 'Asgari ücrete gerçek zam yapacağız',
    short: 'Asgari ücrete zam',
    appeal: 2.5,
    measure: (c) => c.minWageRatio,
    kept: (now, base) => now >= base * 1.15,
    target: 'Asgari ücretin alım gücü +%15',
  },
  vergiIndirimi: {
    label: 'Gelir vergisini 5 puan düşüreceğiz',
    short: 'Gelir vergisi indirimi',
    appeal: 2,
    measure: (c) => c.taxes.income,
    kept: (now, base) => now <= base - 5,
    target: 'Gelir vergisi 5 puan aşağı',
  },
  issizlik: {
    label: 'İşsizliği 2 puan azaltacağız',
    short: 'Herkese iş',
    appeal: 1.8,
    measure: (c) => c.unemployment,
    kept: (now, base) => now <= base - 2,
    target: 'İşsizlik 2 puan aşağı',
  },
  saglik: {
    label: "Sağlık bütçesini %30 artıracağız",
    short: 'Sağlığa yatırım',
    appeal: 1.5,
    measure: (c) => c.budget.saglik,
    kept: (now, base) => now >= base * 1.3,
    target: 'Sağlık bütçesi +%30',
  },
  egitim: {
    label: 'Eğitim bütçesini %30 artıracağız',
    short: 'Eğitime yatırım',
    appeal: 1.2,
    measure: (c) => c.budget.egitim,
    kept: (now, base) => now >= base * 1.3,
    target: 'Eğitim bütçesi +%30',
  },
  savunma: {
    label: "Savunmaya GSYH'nin en az %3'ünü ayıracağız",
    short: 'Güçlü ordu',
    appeal: 1,
    measure: (c) => c.budget.savunma,
    kept: (now) => now >= 3,
    target: 'Savunma ≥ GSYH %3',
  },
  kurumlar: {
    label: 'Kurumlar vergisini 5 puan düşüreceğiz',
    short: 'Yatırımcı dostu vergi',
    appeal: 0.8,
    measure: (c) => c.taxes.corporate,
    kept: (now, base) => now <= base - 5,
    target: 'Kurumlar vergisi 5 puan aşağı',
  },
  tarim: {
    label: 'Çiftçiye desteği iki katına çıkaracağız',
    short: 'Çiftçiye destek',
    appeal: 1,
    measure: (c) => c.budget.tarim,
    kept: (now, base) => now >= base * 2,
    target: 'Tarım bütçesi ×2',
  },
  borc: {
    label: 'Kamu borcunu 5 puan azaltacağız',
    short: 'Borçsuz devlet',
    appeal: 0.8,
    measure: (c) => c.debtPct,
    kept: (now, base) => now <= base - 5,
    target: 'Borç/GSYH 5 puan aşağı',
  },
};

export const MAX_PROMISES = 3;

// ---------------------------------------------------------------- kurulum

export function initPolitics(c: CountryState, rng: Rng) {
  const seeds = PARTY_SEEDS[c.id] ?? [];
  const total = seeds.reduce((s, p) => s + p.support, 0) || 1;
  c.parties = seeds.map((p, idx) => {
    const support = (p.support / total) * 100;
    return {
      id: `${c.id}-${idx}`,
      name: p.name,
      short: p.short,
      color: p.color,
      ideology: { ...p.ideology },
      support,
      appeal: support,
      momentum: 0,
      org: 30 + support,
      funds: Math.round(5 + support * 1.5),
      seats: 0,
      inGovernment: !!(p.ruling || p.partner),
      leaderName: generateMinister(rng, c.names).name,
      playerId: null,
      leader: null,
      promises: [],
      shadowCabinet: {},
      cooldowns: {},
      founded: false,
      trend: [support],
    };
  });
  const seedGovSeats = c.govSeatShare;
  assignSeats(c, c.parties.map((p) => ({ partyId: p.id, vote: p.support, seats: 0 })));
  // Meclis son seçimin sonucunu yansıtır: hükümetin gerçek sandalye payına ölçekle.
  const gov = c.parties.filter((p) => p.inGovernment && p.seats > 0);
  const govNow = gov.reduce((s, p) => s + p.seats, 0);
  if (gov.length && govNow > 0 && govNow < 100 && seedGovSeats > 0 && seedGovSeats < 100) {
    for (const p of c.parties) {
      if (p.seats <= 0) continue;
      p.seats *= p.inGovernment ? seedGovSeats / govNow : (100 - seedGovSeats) / (100 - govNow);
    }
    c.govSeatShare = seedGovSeats;
  }
  const ruling = c.parties.find((p) => seeds[Number(p.id.split('-')[1])]?.ruling) ?? c.parties[0];
  c.rulingPartyId = ruling?.id ?? '';
  c.leaderName = ruling?.leaderName ?? '';
  c.leader = null;
  c.activePromises = [];
  c.electionThreshold = ELECTION_THRESHOLD[c.id] ?? 0;
  const capital = ruling?.ideology ?? { economic: 0, social: 0 };
  c.regions = (REGION_SEEDS[c.id] ?? genericRegions(capital)).map((r) => ({ ...r, lean: { ...r.lean } }));
  c.govCalib = govSum(c) - govShareRaw(c);
}

function govShareRaw(c: CountryState) {
  return c.approval * 0.85 + 8;
}

function govSum(c: CountryState) {
  return c.parties.filter((p) => p.inGovernment).reduce((s, p) => s + p.support, 0);
}

/** Sandalye dağılımı: barajı geçen partiler oylarıyla orantılı. */
function assignSeats(c: CountryState, results: ElectionPartyResult[]) {
  const passed = results.filter((r) => r.vote >= (c.electionThreshold ?? 0));
  const sum = passed.reduce((s, r) => s + r.vote, 0) || 1;
  for (const r of results) r.seats = r.vote >= (c.electionThreshold ?? 0) ? (r.vote / sum) * 100 : 0;
  for (const p of c.parties) p.seats = results.find((r) => r.partyId === p.id)?.seats ?? 0;
  c.govSeatShare = c.parties.filter((p) => p.inGovernment).reduce((s, p) => s + p.seats, 0);
}

export function playerParty(c: CountryState, playerId: string): Party | undefined {
  return c.parties.find((p) => p.playerId === playerId);
}

// ---------------------------------------------------------------- günlük siyaset

/** Anketleri ve parti kasalarını bir gün ilerletir. */
export function stepPolitics(c: CountryState, day: number, rng: Rng) {
  if (!c.parties?.length) return;
  c.govCalib *= 1 - 1 / 365;
  const govShare = clamp(govShareRaw(c) + c.govCalib, 3, 92);
  const gov = c.parties.filter((p) => p.inGovernment);
  const opp = c.parties.filter((p) => !p.inGovernment);
  const weight = (p: Party) => Math.max(0.2, p.appeal * (1 + p.org / 200) + p.momentum + promiseAppeal(p));
  const gw = gov.reduce((s, p) => s + weight(p), 0) || 1;
  const ow = opp.reduce((s, p) => s + weight(p), 0) || 1;
  const oppShare = opp.length ? 100 - govShare : 0;
  const govTotal = opp.length ? govShare : 100;
  for (const p of c.parties) {
    const target = p.inGovernment ? (govTotal * weight(p)) / gw : (oppShare * weight(p)) / ow;
    p.support += (target - p.support) / 20;
    p.momentum *= 1 - 1 / 90;
  }
  // Aylık devlet yardımı ve bağışlar
  if (day % 30 === 0) {
    for (const p of c.parties) {
      p.funds += 1 + p.support * 0.12 + p.org * 0.03;
      p.trend.push(Math.round(p.support * 10) / 10);
      if (p.trend.length > 48) p.trend.shift();
      // Yapay zekâ partileri de kendi kampanyalarını yürütür.
      if (!p.playerId && !p.inGovernment && rng() < 0.5) {
        p.momentum += rng() * 1.2;
        if (p.support > 5 && rng() < 0.15) {
          const r = c.regions[Math.floor(rng() * c.regions.length)];
          if (r) addNews(c, day, `${p.short}, ${r.name} bölgesinde miting yaptı.`, 'notr');
        }
      }
    }
  }
}

/** Dünya kurulurken onay değiştiyse hükümet payını yeniden oturtur. */
export function resetGovCalib(c: CountryState) {
  if (c.parties.length) c.govCalib = govSum(c) - govShareRaw(c);
}

function promiseAppeal(p: Party) {
  const bonus = p.leader?.background === 'ekonomist' ? 1.3 : 1;
  return p.promises.reduce((s, id) => {
    const def = PROMISES[id];
    const mult = (id === 'savunma' && p.leader?.background === 'asker') || id === 'enflasyon' ? bonus : 1;
    return s + (def?.appeal ?? 0) * mult;
  }, 0);
}

// ---------------------------------------------------------------- oyuncu katılımı

export function joinParty(c: CountryState, partyId: string, playerId: string, character: Character, day: number, rng: Rng) {
  if (!c.playable) throw new ActionError('Bu ülkede serbest seçim yok; şimdilik sadece yapay zekâ yönetiyor.');
  const p = c.parties.find((x) => x.id === partyId);
  if (!p) throw new ActionError('Parti bulunamadı.');
  if (p.inGovernment) throw new ActionError('İktidardaki partilere katılamazsın; muhalefetten başlayıp seçim kazanmalısın.');
  if (p.playerId && p.playerId !== playerId) throw new ActionError('Bu partinin genel başkanı başka bir oyuncu.');
  // Kurultay: delegelerin oyu karizmaya bağlı.
  const delegates = clamp(48 + character.charisma * 35 + rng() * 10, 51, 92);
  p.playerId = playerId;
  p.leader = character;
  p.leaderName = character.name;
  p.momentum += 1.5;
  ensureShadowPool(p, c, rng);
  addNews(c, day, `${p.short} olağanüstü kurultayında ${character.name}, delegelerin %${delegates.toFixed(0)} oyuyla genel başkan seçildi.`, 'iyi');
  return delegates;
}

export function foundParty(
  c: CountryState,
  input: { name: string; short: string; color: string; ideology: Ideology },
  playerId: string,
  character: Character,
  day: number,
  rng: Rng,
): Party {
  if (!c.playable) throw new ActionError('Bu ülkede serbest seçim yok; şimdilik sadece yapay zekâ yönetiyor.');
  const name = String(input.name ?? '').trim().slice(0, 48);
  const short = String(input.short ?? '').trim().slice(0, 10);
  if (name.length < 3) throw new ActionError('Partine en az 3 harfli bir isim ver.');
  if (!short) throw new ActionError('Partinin kısa adını yaz.');
  if (c.parties.some((p) => p.name.toLocaleLowerCase('tr') === name.toLocaleLowerCase('tr'))) {
    throw new ActionError('Bu isimde bir parti zaten var.');
  }
  const color = /^#[0-9a-f]{6}$/i.test(input.color) ? input.color : '#d4a73c';
  const p: Party = {
    id: `${c.id}-p${day}-${Math.floor(rng() * 1e6)}`,
    name,
    short,
    color,
    ideology: normIdeology(input.ideology),
    support: 0.5,
    appeal: 1.5 + character.charisma * 2,
    momentum: 2,
    org: 5,
    funds: 25,
    seats: 0,
    inGovernment: false,
    leaderName: character.name,
    playerId,
    leader: character,
    promises: [],
    shadowCabinet: {},
    cooldowns: {},
    founded: true,
    trend: [0.5],
  };
  c.parties.push(p);
  ensureShadowPool(p, c, rng);
  addNews(c, day, `${character.name} yeni bir parti kurdu: ${name} (${short}).`, 'iyi');
  return p;
}

/** Gölge kabine için parti kadrosu (aday havuzu ülke havuzundan ayrıdır). */
function ensureShadowPool(p: Party, c: CountryState, rng: Rng) {
  for (const m of MINISTRIES) {
    if (!c.candidates[m].length) c.candidates[m].push(generateMinister(rng, c.names));
  }
  void p;
}

export function leaveParty(c: CountryState, playerId: string, day: number) {
  const p = playerParty(c, playerId);
  if (!p) return;
  p.playerId = null;
  p.leader = null;
  if (c.ownerId === playerId) {
    c.ownerId = null;
    c.ownerName = null;
    c.leader = null;
    c.activePromises = [];
    c.pendingEvents = [];
  }
  if (p.founded && !p.inGovernment && p.support < 3) {
    c.parties = c.parties.filter((x) => x.id !== p.id);
    addNews(c, day, `${p.name} kurucusunun ayrılmasıyla dağıldı.`, 'notr');
  } else {
    p.leaderName = `${p.leaderName} (istifa etti)`;
    addNews(c, day, `${p.short} genel başkanı istifa etti.`, 'notr');
  }
}

// ---------------------------------------------------------------- muhalefet eylemleri

export const ACTION_COSTS = { miting: 4, teskilat: 12, bagis: 0, aciklama: 0, erkenSecim: 0 };
export const ACTION_COOLDOWNS = { miting: 30, teskilat: 0, bagis: 30, aciklama: 20, erkenSecim: 180 };

function checkCooldown(p: Party, key: string, day: number) {
  const until = p.cooldowns[key] ?? 0;
  if (day < until) throw new ActionError(`Bunu tekrar yapmak için ${formatGameDate(until)} tarihini beklemelisin.`);
}

function spend(p: Party, amount: number) {
  if (p.funds < amount) throw new ActionError(`Parti kasasında yeterli para yok (gereken ${amount} milyon $).`);
  p.funds -= amount;
}

export function regionFit(p: Party, regionLean: Ideology) {
  return 1.3 - ideologyDistance(p.ideology, regionLean) * 1.2;
}

export function partyAction(
  c: CountryState,
  p: Party,
  day: number,
  action: 'miting' | 'teskilat' | 'bagis' | 'aciklama' | 'erkenSecim',
  rng: Rng,
  regionId?: string,
): string {
  const ch = p.leader;
  const charisma = ch?.charisma ?? 0.5;
  switch (action) {
    case 'miting': {
      const r = c.regions.find((x) => x.id === regionId);
      if (!r) throw new ActionError('Bölge bulunamadı.');
      const key = `miting:${r.id}`;
      checkCooldown(p, key, day);
      spend(p, ACTION_COSTS.miting);
      const mult = ch?.background === 'sendikaci' ? 1.25 : 1;
      const gain = (0.6 + r.weight * 4) * (0.6 + charisma) * regionFit(p, r.lean) * mult;
      p.momentum += gain;
      if (!p.inGovernment) addShock(c, day, 'Muhalefet mitingleri', 'approval', -0.25 * gain, 60);
      p.cooldowns[key] = day + ACTION_COOLDOWNS.miting;
      addNews(c, day, `${p.short}, ${r.name} bölgesinde büyük bir miting düzenledi.`, 'notr');
      return `${r.name} mitingi destek ivmesini ${gain.toFixed(1)} puan artırdı.`;
    }
    case 'teskilat': {
      if (p.org >= 100) throw new ActionError('Teşkilat zaten her yerde örgütlü.');
      const cost = ch?.background === 'hukukcu' ? 8 : ACTION_COSTS.teskilat;
      spend(p, cost);
      p.org = Math.min(100, p.org + 8);
      return `Yeni il ve ilçe teşkilatları açıldı. Teşkilat gücü ${p.org.toFixed(0)}/100.`;
    }
    case 'bagis': {
      checkCooldown(p, 'bagis', day);
      const amount = (4 + p.org * 0.12 + p.support * 0.2) * (ch?.background === 'isInsani' ? 1.5 : 1);
      p.funds += amount;
      p.cooldowns.bagis = day + ACTION_COOLDOWNS.bagis;
      return `Bağış kampanyası ${amount.toFixed(1)} milyon $ topladı.`;
    }
    case 'aciklama': {
      if (p.inGovernment) throw new ActionError('Hükümet partisi kendini eleştiremez.');
      checkCooldown(p, 'aciklama', day);
      const issue = topIssue(c);
      const mult = ch?.background === 'akademisyen' ? 1.3 : 1;
      const gain = (0.5 + issue.severity * 2) * mult * (0.7 + charisma * 0.6);
      p.momentum += gain;
      addShock(c, day, 'Muhalefetin eleştirileri', 'approval', -0.4 * gain, 60);
      p.cooldowns.aciklama = day + ACTION_COOLDOWNS.aciklama;
      addNews(c, day, `${p.short} genel başkanı ${p.leaderName}: "${issue.quote}"`, 'notr');
      return `Basın açıklaması ilgi gördü: "${issue.label}" gündemi destek ivmesini ${gain.toFixed(1)} puan artırdı.`;
    }
    case 'erkenSecim': {
      if (p.inGovernment) throw new ActionError('Erken seçim çağrısını muhalefet yapar.');
      checkCooldown(p, 'erkenSecim', day);
      p.cooldowns.erkenSecim = day + ACTION_COOLDOWNS.erkenSecim;
      if (c.nextElectionDay - day < 200) throw new ActionError('Seçim zaten yakın.');
      const chance = clamp((38 - c.approval) / 25 + (p.support - 15) / 60, 0, 0.8);
      if (rng() < chance) {
        c.nextElectionDay = day + 90;
        addNews(c, day, `Muhalefetin baskısıyla erken seçim kararı alındı: ${formatGameDate(c.nextElectionDay)}.`, 'iyi');
        return `Başardın! Erken seçim ${formatGameDate(c.nextElectionDay)} tarihinde yapılacak.`;
      }
      addNews(c, day, `Hükümet, ${p.short}'nin erken seçim çağrısını reddetti.`, 'notr');
      return `Hükümet erken seçimi reddetti. Şansın %${(chance * 100).toFixed(0)} idi; hükümetin desteği düştükçe artar.`;
    }
  }
}

export function topIssue(c: CountryState): { label: string; severity: number; quote: string } {
  const issues = [
    { label: 'Hayat pahalılığı', severity: clamp((c.inflation - 4) / 30, 0, 1.5), quote: 'Vatandaş market rafları arasında eziliyor, bu hükümet enflasyonu yönetemiyor.' },
    { label: 'İşsizlik', severity: clamp((c.unemployment - 5) / 8, 0, 1.5), quote: 'Gençlerimiz iş bulamıyor, umudunu kaybediyor.' },
    { label: 'Durgunluk', severity: clamp((1.5 - c.growth) / 3, 0, 1.5), quote: 'Ekonomi duruyor, fabrikalar kapanıyor.' },
    { label: 'Borç yükü', severity: clamp((c.debtPct - 70) / 60, 0, 1.2), quote: 'Çocuklarımızın geleceğini borca batırdılar.' },
    { label: 'Güvenlik', severity: clamp((c.threat - 50) / 40, 0, 1.2), quote: 'Sınırlarımız tehdit altında, hükümet seyirci kalıyor.' },
    { label: 'Hizmet eksikliği', severity: clamp((55 - c.quality.saglik) / 40, 0, 1), quote: 'Hastanelerde randevu bulunamıyor.' },
  ];
  return issues.reduce((a, b) => (b.severity > a.severity ? b : a));
}

export function setPromises(p: Party, promises: PromiseId[]) {
  const unique = [...new Set(promises)].filter((x) => x in PROMISES);
  if (unique.length > MAX_PROMISES) throw new ActionError(`En fazla ${MAX_PROMISES} seçim vaadi verebilirsin.`);
  if (p.inGovernment) throw new ActionError('Vaatler seçim döneminde, muhalefetteyken belirlenir.');
  p.promises = unique;
}

export function setShadow(c: CountryState, p: Party, ministry: MinistryId, candidateId: string | null) {
  if (!MINISTRIES.includes(ministry)) throw new ActionError('Bilinmeyen bakanlık.');
  if (candidateId === null) {
    delete p.shadowCabinet[ministry];
    return;
  }
  const cand = c.candidates[ministry].find((m) => m.id === candidateId);
  if (!cand) throw new ActionError('Aday bulunamadı.');
  // Aynı kişi iki bakanlığa atanamaz.
  for (const m of MINISTRIES) if (p.shadowCabinet[m]?.id === candidateId) delete p.shadowCabinet[m];
  p.shadowCabinet[ministry] = { ...cand };
}

// ---------------------------------------------------------------- seçim

export interface ElectionOutcome {
  result: ElectionResult;
  previousOwnerId: string | null;
  newOwnerId: string | null;
}

export function holdGeneralElection(c: CountryState, day: number, rng: Rng): ElectionOutcome {
  const previousOwnerId = c.ownerId;
  const previousRuling = c.rulingPartyId;

  // Verilen sözlerin hesabı
  let promiseAdj = 0;
  if (c.activePromises.length) {
    for (const ap of c.activePromises) {
      const def = PROMISES[ap.id];
      ap.kept = def.kept(def.measure(c), ap.baseline);
      promiseAdj += ap.kept ? 2 : -3;
      addNews(c, day, `Seçim vaadi "${def.short}": ${ap.kept ? 'tutuldu' : 'tutulmadı'}.`, ap.kept ? 'iyi' : 'kotu');
    }
  }

  let results: ElectionPartyResult[] = c.parties.map((p) => {
    let vote = p.support + (rng() - 0.5) * 3;
    if (p.id === c.rulingPartyId) vote += c.campaignRallies * 0.8 + promiseAdj;
    return { partyId: p.id, vote: Math.max(0.1, vote), seats: 0 };
  });
  const total = results.reduce((s, r) => s + r.vote, 0);
  results = results.map((r) => ({ ...r, vote: (r.vote / total) * 100 })).sort((a, b) => b.vote - a.vote);
  assignSeats(c, results);

  const byId = (id: string) => c.parties.find((p) => p.id === id)!;
  let winner = results[0].partyId;
  let runoff: ElectionResult['runoff'];
  let coalition: string[] = [winner];

  if (c.regime === 'baskanlik' || c.regime === 'yariBaskanlik') {
    if (results[0].vote < 50 && results.length > 1) {
      const a = byId(results[0].partyId);
      const b = byId(results[1].partyId);
      let aVote = results[0].vote;
      let bVote = results[1].vote;
      for (const r of results.slice(2)) {
        const p = byId(r.partyId);
        const da = ideologyDistance(p.ideology, a.ideology);
        const db = ideologyDistance(p.ideology, b.ideology);
        const shareA = db / (da + db || 1);
        aVote += r.vote * shareA * 0.85;
        bVote += r.vote * (1 - shareA) * 0.85;
      }
      aVote += (rng() - 0.5) * 2;
      const aPct = (aVote / (aVote + bVote)) * 100;
      runoff = { a: a.id, b: b.id, aVote: aPct };
      winner = aPct >= 50 ? a.id : b.id;
    }
    coalition = [winner];
    // Başkanlıkta meclis müttefikleri: ideolojisi en yakın partiler
    const w = byId(winner);
    for (const r of results) {
      if (r.partyId === winner) continue;
      if (ideologyDistance(byId(r.partyId).ideology, w.ideology) < 0.12 && !byId(r.partyId).playerId) coalition.push(r.partyId);
    }
  } else {
    // Parlamenter: en büyük parti, ideolojisi yakın partilerle çoğunluk arar.
    const lead = byId(results[0].partyId);
    const seatsOf = (id: string) => results.find((r) => r.partyId === id)?.seats ?? 0;
    let seats = seatsOf(lead.id);
    const others = results
      .filter((r) => r.partyId !== lead.id && r.seats > 0)
      .map((r) => byId(r.partyId))
      .filter((p) => !p.playerId || p.playerId === lead.playerId)
      .sort((x, y) => ideologyDistance(x.ideology, lead.ideology) - ideologyDistance(y.ideology, lead.ideology));
    for (const p of others) {
      if (seats > 50) break;
      coalition.push(p.id);
      seats += seatsOf(p.id);
    }
    winner = lead.id;
  }

  for (const p of c.parties) p.inGovernment = coalition.includes(p.id);
  c.rulingPartyId = winner;
  c.govSeatShare = c.parties.filter((p) => p.inGovernment).reduce((s, p) => s + p.seats, 0);

  const prevVote = results.find((r) => r.partyId === previousRuling)?.vote ?? 0;
  const won = winner === previousRuling;
  const result: ElectionResult = { day, vote: prevVote, won, results, winnerPartyId: winner, runoff, coalition };
  c.lastElection = result;
  c.nextElectionDay = day + Math.round(c.electionYears * 365.25);
  c.campaignRallies = 0;
  c.handoutUsed = false;

  const wp = byId(winner);
  let newOwnerId: string | null = wp.playerId;
  if (!won) {
    addNews(c, day, `Seçimi ${wp.short} kazandı (%${(results.find((r) => r.partyId === winner)?.vote ?? 0).toFixed(1)}). İktidar değişti.`, 'iyi');
    // Yeni hükümet: balayı dönemi ve sıfırlanan kalibrasyon
    const govVote = results.filter((r) => coalition.includes(r.partyId)).reduce((s, r) => s + r.vote, 0);
    addShock(c, day, 'Yeni hükümet balayı', 'approval', clamp(govVote - c.approval, -5, 20), 365);
  } else {
    addNews(c, day, `${wp.short} seçimi kazanarak iktidarını sürdürdü.`, 'iyi');
  }
  for (const p of c.parties) {
    const r = results.find((x) => x.partyId === p.id);
    if (r) {
      p.support = r.vote;
      p.appeal = Math.max(0.5, r.vote);
      p.momentum = 0;
      p.promises = p.inGovernment ? p.promises : [];
    }
  }
  c.govCalib = govSum(c) - govShareRaw(c);

  if (newOwnerId) takeOffice(c, wp, day);
  else {
    c.ownerId = null;
    c.ownerName = null;
    c.leader = null;
    c.activePromises = [];
    c.leaderName = wp.leaderName;
    if (previousOwnerId) c.pendingEvents = [];
  }
  if (newOwnerId === previousOwnerId && newOwnerId) newOwnerId = previousOwnerId;
  return { result, previousOwnerId, newOwnerId };
}

/** Oyuncunun partisi iktidara gelir: gölge kabine göreve başlar, vaatler takibe alınır. */
export function takeOffice(c: CountryState, p: Party, day: number) {
  const fresh = c.ownerId !== p.playerId;
  c.ownerId = p.playerId;
  c.ownerName = p.leader?.name ?? p.leaderName;
  c.leader = p.leader;
  c.leaderName = p.leaderName;
  if (fresh) {
    for (const m of MINISTRIES) {
      const s = p.shadowCabinet[m];
      if (s) {
        c.ministers[m] = { ...s, appointedDay: day };
        c.candidates[m] = c.candidates[m].filter((x) => x.id !== s.id);
      }
    }
    p.shadowCabinet = {};
    c.activePromises = p.promises.map<ActivePromise>((id) => ({ id, baseline: PROMISES[id].measure(c) }));
    p.promises = [];
    addNews(c, day, `${c.ownerName} hükümeti göreve başladı. Kabine yemin etti.`, 'iyi');
  } else {
    c.activePromises = [];
  }
}

/** Gölge kabine boşsa en iyi adaylardan önerir (yapay zekâ partileri ve hızlı doldurma için). */
export function suggestShadow(c: CountryState): Partial<Record<MinistryId, string>> {
  const out: Partial<Record<MinistryId, string>> = {};
  for (const m of MINISTRIES) {
    const best = [...c.candidates[m]].sort((a, b) => ministerScore(b) - ministerScore(a))[0];
    if (best) out[m] = best.id;
  }
  return out;
}

export function winThreshold(c: CountryState) {
  return WIN_THRESHOLD[c.regime];
}

export { BUDGET_REFERENCE, MINISTRY_LABELS };
