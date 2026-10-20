/**
 * Şehir oyunu: oyuncu küçük bir ilçe belediyesiyle başlar, binalar kurup geliştirir,
 * çevre edinir (iş dünyası, esnaf, sendika, medya…) ve kariyer basamaklarını tırmanarak
 * il belediye başkanlığına, milletvekilliğine, genel başkanlığa ve sonunda hükümete yükselir.
 */
import { challengeLeader } from './career';
import { formatGameDate } from './constants';
import { localPoll } from './local';
import { generateMinister, type Rng } from './ministers';
import { endOffice, mayorFromPlayer } from './offices';
import { ActionError, addNews, clamp } from './sim';
import type { BuildingId, Contact, CountryState, NetworkId, Party, RankId, Town, TownEvent } from './types';
import type { Player, World } from './world';

// ---------------------------------------------------------------- binalar

export interface BuildingSpec {
  label: string;
  icon: string;
  desc: string;
  /** Seviye 1'in maliyeti; sonraki seviyeler katlanarak artar */
  money: number;
  materials: number;
  days: number;
  max: number;
  /** Aynı türden en fazla kaç bina olabilir */
  limit: number;
  /** Bu binanın çevre kazandırdığı kesim */
  network?: NetworkId;
  /** Seviyeye göre etkisinin kısa açıklaması */
  effect: (level: number) => string;
}

export const BUILDINGS: Record<BuildingId, BuildingSpec> = {
  belediye: {
    label: 'Belediye binası',
    icon: '🏛️',
    desc: 'Şehrin kalbi. Seviyesi diğer binaların ulaşabileceği seviyeyi ve açılan arsa sayısını belirler.',
    money: 400,
    materials: 200,
    days: 12,
    max: 12,
    limit: 1,
    network: 'burokrasi',
    effect: (l) => `${slotCount(l)} arsa açık, diğer binalar en fazla ${l + 1}. seviye`,
  },
  konut: {
    label: 'Konut bölgesi',
    icon: '🏘️',
    desc: 'Evler ve apartmanlar. Şehrin barındırabileceği nüfusu artırır.',
    money: 150,
    materials: 120,
    days: 6,
    max: 14,
    limit: 3,
    effect: (l) => `+${fmt(housingOf(l))} kişilik konut`,
  },
  carsi: {
    label: 'Çarşı',
    icon: '🛍️',
    desc: 'Dükkânlar ve pazar yeri. Kasaya vergi, şehre iş getirir; esnafla tanışırsın.',
    money: 200,
    materials: 80,
    days: 6,
    max: 12,
    limit: 1,
    network: 'esnaf',
    effect: (l) => `+${Math.round(l * 12)} bin ₺/gün, ${fmt(l * 1200)} iş`,
  },
  sanayi: {
    label: 'Sanayi sitesi',
    icon: '🏭',
    desc: 'Atölye ve fabrikalar. İnşaat malzemesi ve iş üretir ama havayı kirletir.',
    money: 250,
    materials: 60,
    days: 8,
    max: 12,
    limit: 1,
    network: 'isDunyasi',
    effect: (l) => `+${l * 12} ton malzeme/gün, ${fmt(l * 2000)} iş, memnuniyet −${(l * 1.5).toFixed(1)}`,
  },
  okul: {
    label: 'Okul',
    icon: '🏫',
    desc: 'Eğitim aileleri memnun eder; öğretmen ve akademisyenlerle tanışırsın.',
    money: 300,
    materials: 150,
    days: 10,
    max: 10,
    limit: 1,
    network: 'akademi',
    effect: (l) => `memnuniyet +${(l * 2.5).toFixed(1)}`,
  },
  saglik: {
    label: 'Sağlık merkezi',
    icon: '🏥',
    desc: 'Sağlık ocağından hastaneye. Memnuniyeti ve nüfus artışını yükseltir.',
    money: 350,
    materials: 150,
    days: 10,
    max: 10,
    limit: 1,
    network: 'akademi',
    effect: (l) => `memnuniyet +${(l * 3.5).toFixed(1)}`,
  },
  park: {
    label: 'Park',
    icon: '🌳',
    desc: 'Yeşil alan ucuzdur ve halkı mutlu eder.',
    money: 120,
    materials: 40,
    days: 4,
    max: 10,
    limit: 2,
    effect: (l) => `memnuniyet +${l * 3}`,
  },
  meydan: {
    label: 'Kent meydanı',
    icon: '🎪',
    desc: 'Miting ve halk buluşmaları burada yapılır. Nüfuz ve sendikalarla bağ kazandırır.',
    money: 250,
    materials: 120,
    days: 8,
    max: 10,
    limit: 1,
    network: 'sendika',
    effect: (l) => `nüfuz +${(l * 0.2).toFixed(1)}/gün, memnuniyet +${l * 2}`,
  },
  basin: {
    label: 'Basın merkezi',
    icon: '📡',
    desc: 'Yerel gazete ve televizyon. Tanınırlığını artırır, medyayla tanışırsın.',
    money: 300,
    materials: 100,
    days: 8,
    max: 10,
    limit: 1,
    network: 'medya',
    effect: (l) => `tanınırlık +${(l * 0.9).toFixed(1)}/ay, nüfuz +${(l * 0.2).toFixed(1)}/gün`,
  },
  parti: {
    label: 'Parti binası',
    icon: '🚩',
    desc: 'Partinin ilçe teşkilatı. Nüfuz üretir, parti içinde yükselmeni sağlar.',
    money: 200,
    materials: 100,
    days: 8,
    max: 10,
    limit: 1,
    network: 'parti',
    effect: (l) => `nüfuz +${(l * 0.4).toFixed(1)}/gün, partinin güveni +${(l * 0.6).toFixed(1)}/ay`,
  },
  emniyet: {
    label: 'Emniyet müdürlüğü',
    icon: '🚓',
    desc: 'Güvenlik memnuniyeti artırır; bürokratlarla tanışırsın.',
    money: 300,
    materials: 150,
    days: 10,
    max: 10,
    limit: 1,
    network: 'burokrasi',
    effect: (l) => `memnuniyet +${l * 2}`,
  },
};

export const BUILDING_IDS = Object.keys(BUILDINGS) as BuildingId[];

/** Toplam arsa sayısı (belediye dahil) */
export const MAX_SLOTS = 14;

export function slotCount(belediyeLevel: number) {
  return Math.min(MAX_SLOTS, 4 + belediyeLevel * 1);
}

function housingOf(level: number) {
  return Math.round(level * 2500 + level * level * 120);
}

export function fmt(n: number) {
  if (n >= 1e6) return `${(n / 1e6).toFixed(1).replace('.', ',')} milyon`;
  if (n >= 1e4) return `${Math.round(n / 1000)} bin`;
  return Math.round(n).toLocaleString('tr-TR');
}

export function upgradeCost(b: BuildingId, toLevel: number) {
  const s = BUILDINGS[b];
  const k = toLevel - 1;
  return {
    money: Math.round(s.money * 1.65 ** k),
    materials: Math.round(s.materials * 1.55 ** k),
    days: Math.round(s.days * 1.25 ** k),
  };
}

export function levelOf(t: Town, b: BuildingId) {
  return t.slots.reduce((s, x) => s + (x.building === b ? x.level : 0), 0);
}

// ---------------------------------------------------------------- çevre

export const NETWORK: Record<NetworkId, { label: string; icon: string; color: string; favor: string; titles: string[] }> = {
  isDunyasi: { label: 'İş dünyası', icon: '💼', color: '#c9a227', favor: 'Bağış iste: kasaya para', titles: ['Müteahhit', 'Fabrikatör', 'Holding yöneticisi', 'Banka müdürü', 'İhracatçı', 'Sanayi odası başkanı'] },
  esnaf: { label: 'Esnaf', icon: '🧺', color: '#e07a3f', favor: 'Esnaftan destek: memnuniyet artar', titles: ['Esnaf odası başkanı', 'Kahveci', 'Fırıncı', 'Kuyumcu', 'Manav', 'Lokantacı'] },
  sendika: { label: 'Sendika ve halk', icon: '✊', color: '#d64545', favor: 'Sahaya çağır: memnuniyet ve kampanyaya güç', titles: ['Sendika temsilcisi', 'İşçi lideri', 'Muhtar', 'Dernek başkanı', 'Kooperatif başkanı', 'Emekliler derneği başkanı'] },
  akademi: { label: 'Akademi', icon: '🎓', color: '#5b8def', favor: 'Danışmanlık: nüfuz ve proje fikri', titles: ['Profesör', 'Okul müdürü', 'Başhekim', 'Şehir plancısı', 'Ekonomist', 'Rektör'] },
  medya: { label: 'Medya', icon: '📰', color: '#9b59b6', favor: 'Haber yaptır: tanınırlık', titles: ['Yerel gazete sahibi', 'Muhabir', 'TV yapımcısı', 'Köşe yazarı', 'Haber müdürü', 'Ünlü sunucu'] },
  burokrasi: { label: 'Bürokrasi', icon: '📜', color: '#3aa38f', favor: 'Evrakı hızlandır: inşaat çabuk biter', titles: ['Kaymakam', 'İl müdürü', 'Vali yardımcısı', 'Emniyet müdürü', 'Bakanlık genel müdürü', 'Vali'] },
  parti: { label: 'Parti', icon: '🚩', color: '#c0392b', favor: 'Genel merkezde sözünü ettir: güven ve nüfuz', titles: ['İlçe başkanı', 'Gençlik kolları başkanı', 'İl başkanı', 'Milletvekili', 'MYK üyesi', 'Genel başkan yardımcısı'] },
};

export const NETWORK_IDS = Object.keys(NETWORK) as NetworkId[];

/** Bir kesimden yeni tanıdık edinmek için gereken puan */
export function contactThreshold(n: number) {
  return 6 + n * 6;
}

export const MAX_CONTACTS_PER_GROUP = 6;

function addContact(t: Town, group: NetworkId, day: number, rng: Rng, names: 'tr' | 'genel') {
  const n = t.contacts.filter((c) => c.group === group).length;
  if (n >= MAX_CONTACTS_PER_GROUP) return null;
  const m = generateMinister(rng, names);
  const c: Contact = {
    id: `k${day}-${group}-${Math.floor(rng() * 1e6)}`,
    name: m.name,
    title: NETWORK[group].titles[n],
    group,
    avatar: m.avatar!,
    loyalty: Math.round(55 + rng() * 30),
    readyDay: day,
    sinceDay: day,
  };
  t.contacts.push(c);
  log(t, day, `${NETWORK[group].icon} Çevren genişledi: ${c.title} ${c.name} artık seni tanıyor.`, 'iyi');
  return c;
}

function gainNetwork(t: Town, group: NetworkId, pts: number, day: number, rng: Rng, names: 'tr' | 'genel') {
  t.network[group] = Math.max(0, t.network[group] + pts);
  for (;;) {
    const n = t.contacts.filter((c) => c.group === group).length;
    if (n >= MAX_CONTACTS_PER_GROUP || t.network[group] < contactThreshold(n)) break;
    addContact(t, group, day, rng, names);
  }
}

function contactsIn(t: Town, g: NetworkId) {
  return t.contacts.filter((c) => c.group === g).length;
}

// ---------------------------------------------------------------- ekonomi

const TAX = {
  dusuk: { label: 'Düşük', mult: 0.6, mood: 6 },
  orta: { label: 'Orta', mult: 1, mood: 0 },
  yuksek: { label: 'Yüksek', mult: 1.45, mood: -10 },
};
export const TAX_LABELS = { dusuk: TAX.dusuk.label, orta: TAX.orta.label, yuksek: TAX.yuksek.label };

export function capacity(t: Town) {
  return 3500 + t.slots.reduce((s, x) => s + (x.building === 'konut' ? housingOf(x.level) : 0), 0);
}

export function jobs(t: Town) {
  const L = (b: BuildingId) => levelOf(t, b);
  return 1500 + L('carsi') * 1200 + L('sanayi') * 2000 + (L('okul') + L('saglik') + L('emniyet') + L('belediye')) * 350 + L('basin') * 250;
}

export function unemployment(t: Town) {
  const work = t.pop * 0.42;
  return clamp((work - jobs(t)) / Math.max(1, work), 0, 0.6);
}

/** Rütbe çarpanı: il merkezi ve sonrası daha büyük bütçe yönetir. */
function rankMult(t: Town) {
  return t.rank === 'ilce' ? 1 : t.rank === 'il' ? 1.5 : 1.8;
}

/** Günlük gelir, gider ve üretimin dökümü. */
export function economy(t: Town) {
  const L = (b: BuildingId) => levelOf(t, b);
  const esnaf = contactsIn(t, 'esnaf');
  const taxIncome = (t.pop / 1000) * 4 * TAX[t.tax].mult * (1 - unemployment(t) * 0.8);
  const trade = L('carsi') * 12 * (1 + esnaf * 0.05);
  const industry = L('sanayi') * 6;
  const income = (taxIncome + trade + industry) * rankMult(t);
  const upkeep = t.slots.reduce((s, x) => s + x.level ** 1.3, 0) * 1.6;
  const materials = 10 + L('sanayi') * 12;
  const influence = 0.3 + L('parti') * 0.4 + L('meydan') * 0.2 + L('basin') * 0.2;
  return { taxIncome, trade, industry, income, upkeep, net: income - upkeep, materials, influence };
}

/** Memnuniyetin oturmaya çalıştığı değer ve nedenleri. */
export function happinessTarget(t: Town) {
  const L = (b: BuildingId) => levelOf(t, b);
  const crowd = t.pop / capacity(t);
  const parts = [
    { label: 'Temel', value: 53 },
    { label: 'Parklar', value: L('park') * 3 },
    { label: 'Sağlık', value: L('saglik') * 3.5 },
    { label: 'Eğitim', value: L('okul') * 2.5 },
    { label: 'Meydan', value: L('meydan') * 2 },
    { label: 'Güvenlik', value: L('emniyet') * 2 },
    { label: 'Vergi', value: TAX[t.tax].mood },
    { label: 'Sanayi kirliliği', value: -L('sanayi') * 1.5 },
    { label: 'İşsizlik', value: -unemployment(t) * 70 },
    { label: 'Kalabalık', value: crowd > 0.97 ? -8 : 0 },
    { label: 'Makamın beklentisi', value: -RANK_ORDER.indexOf(t.rank) * 5 },
    { label: 'Büyüyen şehrin beklentisi', value: -Math.max(0, Math.log10(t.pop / 5000)) * 16 },
  ];
  return { value: clamp(parts.reduce((s, p) => s + p.value, 0), 0, 100), parts: parts.filter((p) => p.value !== 0) };
}

// ---------------------------------------------------------------- kariyer

export interface RankSpec {
  label: string;
  icon: string;
  desc: string;
  /** Kampanya süresi (gün) ve nüfuz bedeli */
  days: number;
  influence: number;
}

export const RANKS: Record<RankId, RankSpec> = {
  ilce: { label: 'İlçe belediye başkanı', icon: '🏡', desc: 'Küçük bir ilçede başlıyorsun.', days: 0, influence: 0 },
  il: { label: 'İl belediye başkanı', icon: '🏙️', desc: 'Bütün ilin belediyesini yönetirsin: büyük bütçe, il haritası ve 3B şehir.', days: 30, influence: 40 },
  mv: { label: 'Milletvekili', icon: '🏛️', desc: 'Meclise girersin. Ülke çapında tanınır, parti içinde ağırlık kazanırsın.', days: 45, influence: 80 },
  genelBaskan: { label: 'Genel başkan', icon: '⭐', desc: 'Kurultayı kazanıp partinin başına geçersin. Artık ülke seçimine sen yürürsün.', days: 0, influence: 60 },
  hukumet: { label: 'Hükümet', icon: '👑', desc: 'Genel seçimi kazanıp ülkeyi yönetirsin.', days: 0, influence: 0 },
};

export const RANK_ORDER: RankId[] = ['ilce', 'il', 'mv', 'genelBaskan', 'hukumet'];

export function nextRank(r: RankId): RankId | null {
  const i = RANK_ORDER.indexOf(r);
  return RANK_ORDER[i + 1] ?? null;
}

export interface Requirement {
  label: string;
  ok: boolean;
  have: string;
}

type PlayerLike = Pick<Player, 'fame' | 'membership' | 'partyId' | 'character'>;

export function requirements(t: Town, pl: PlayerLike, c: CountryState): Requirement[] {
  const next = nextRank(t.rank);
  const bel = levelOf(t, 'belediye');
  const fame = pl.fame ?? 0;
  const trust = pl.membership?.trust ?? 0;
  const r = (label: string, ok: boolean, have: string): Requirement => ({ label, ok, have });
  switch (next) {
    case 'il':
      return [
        r('Belediye binası 4. seviye', bel >= 4, `${bel}. seviye`),
        r('Nüfus 12 bin', t.pop >= 12000, fmt(t.pop)),
        r('Memnuniyet %60', t.happiness >= 60, `%${Math.round(t.happiness)}`),
        r('Çevrende 6 tanıdık', t.contacts.length >= 6, `${t.contacts.length}`),
        r('Tanınırlık 25', fame >= 25, `${Math.round(fame)}`),
        r(`${RANKS.il.influence} nüfuz`, t.influence >= RANKS.il.influence, `${Math.floor(t.influence)}`),
      ];
    case 'mv':
      return [
        r('Belediye binası 6. seviye', bel >= 6, `${bel}. seviye`),
        r('Nüfus 25 bin', t.pop >= 25000, fmt(t.pop)),
        r('Çevrende 12 tanıdık', t.contacts.length >= 12, `${t.contacts.length}`),
        r('Partide 3 tanıdık', contactsIn(t, 'parti') >= 3, `${contactsIn(t, 'parti')}`),
        r('Tanınırlık 40', fame >= 40, `${Math.round(fame)}`),
        r(`${RANKS.mv.influence} nüfuz`, t.influence >= RANKS.mv.influence, `${Math.floor(t.influence)}`),
      ];
    case 'genelBaskan': {
      const p = c.parties.find((x) => x.id === pl.membership?.partyId);
      return [
        r('Partinin güveni 60', trust >= 60, `${Math.round(trust)}`),
        r('Partide 5 tanıdık', contactsIn(t, 'parti') >= 5, `${contactsIn(t, 'parti')}`),
        r('Tanınırlık 50', fame >= 50, `${Math.round(fame)}`),
        r('Partin muhalefette olmalı', !!p && !p.inGovernment, p?.inGovernment ? 'iktidarda' : 'muhalefette'),
        r(`${RANKS.genelBaskan.influence} nüfuz`, t.influence >= RANKS.genelBaskan.influence, `${Math.floor(t.influence)}`),
      ];
    }
    default:
      return [];
  }
}

/** Seçim kampanyasının kazanma şansı (kampanya sırasında destekle artar). */
export function campaignChance(t: Town, pl: PlayerLike, c: CountryState) {
  const next = nextRank(t.rank);
  const fame = pl.fame ?? 0;
  const partyVote = (() => {
    const pv = c.provinces.find((x) => x.id === t.provinceId);
    const id = pl.membership?.partyId;
    if (!pv || !id) return 15;
    return localPoll(c, pv).find((x) => x.partyId === id)?.vote ?? 10;
  })();
  if (next === 'il') {
    return clamp(0.1 + (t.happiness - 60) / 70 + Math.min(12, t.contacts.length) * 0.02 + fame / 250 + partyVote / 150, 0.08, 0.85);
  }
  if (next === 'mv') {
    return clamp(0.12 + contactsIn(t, 'parti') * 0.05 + contactsIn(t, 'sendika') * 0.03 + fame / 220 + partyVote / 200 + (t.happiness - 60) / 120, 0.08, 0.85);
  }
  return 0;
}

export function runForOffice(world: World, player: Player, rng: Rng): string {
  const t = requireTown(player);
  const c = world.countries[t.countryId];
  const next = nextRank(t.rank);
  if (!next || next === 'hukumet') throw new ActionError('Bir sonraki adım genel seçim: partinle seçimi kazanmalısın.');
  if (t.campaign) throw new ActionError('Kampanya zaten sürüyor.');
  const reqs = requirements(t, player, c);
  const missing = reqs.filter((r) => !r.ok);
  if (missing.length) throw new ActionError(`Henüz hazır değilsin: ${missing.map((r) => r.label.toLocaleLowerCase('tr')).join(', ')}.`);
  t.influence -= RANKS[next].influence;
  if (next === 'genelBaskan') {
    // Kurultay: mevcut kurultay kuralları, ama çevren delegeleri etkiler.
    const m = player.membership!;
    const before = m.trust;
    m.trust = clamp(m.trust + contactsIn(t, 'parti') * 3, 0, 100);
    try {
      const msg = challengeLeader(world, player, rng);
      if (player.partyId) {
        t.rank = 'genelBaskan';
        log(t, world.day, `⭐ Kurultayı kazandın, artık genel başkansın.`, 'iyi');
      } else m.trust = Math.min(m.trust, before);
      return msg;
    } catch (e) {
      m.trust = before;
      t.influence += RANKS[next].influence;
      throw e;
    }
  }
  const chance = campaignChance(t, player, c);
  t.campaign = { rank: next, startDay: world.day, endDay: world.day + RANKS[next].days, chance, boost: 0 };
  log(t, world.day, `🗳️ ${RANKS[next].label} için kampanya başladı. Sonuç ${formatGameDate(t.campaign.endDay)}.`, 'notr');
  return `Kampanya başladı. Şu anki kazanma şansın %${Math.round(chance * 100)}; kampanya boyunca miting, basın ve çevrenden destek şansını artırır.`;
}

function finishCampaign(world: World, player: Player, t: Town, rng: Rng) {
  const camp = t.campaign!;
  const c = world.countries[t.countryId];
  t.campaign = null;
  const chance = clamp(camp.chance + camp.boost, 0.05, 0.95);
  const won = rng() < chance;
  const day = world.day;
  const name = player.character?.name ?? player.name;
  if (!won) {
    t.happiness = clamp(t.happiness - 3, 0, 100);
    player.fame = clamp((player.fame ?? 0) + 2, 0, 100);
    log(t, day, `Seçimi kaybettin (şansın %${Math.round(chance * 100)} idi). Biraz daha güçlenip yeniden dene.`, 'kotu');
    addNews(c, day, `${name}, ${RANKS[camp.rank].label.toLocaleLowerCase('tr')} seçimini kaybetti.`, 'notr');
    t.cooldowns.kampanya = day + 60;
    return;
  }
  t.rank = camp.rank;
  if (camp.rank === 'il') {
    const pv = c.provinces.find((x) => x.id === t.provinceId);
    const p = c.parties.find((x) => x.id === player.membership?.partyId);
    if (pv && p) {
      endOffice(world, player);
      pv.pool.push({ ...pv.mayor, appointedDay: undefined });
      pv.mayor = { ...mayorFromPlayer(player, pv, p.id, day), profession: 'Belediye başkanı' };
      player.office = { id: 'belediyeBaskani', provinceId: pv.id, sinceDay: day, goal: null, done: 0 };
    }
    player.fame = clamp((player.fame ?? 0) + 8, 0, 100);
    log(t, day, `🏙️ Seçimi kazandın! Artık ${pv?.name ?? t.name} il belediye başkanısın. Gelirler %50 arttı.`, 'iyi');
    addNews(c, day, `${name}, ${pv?.name} belediye başkanlığını kazandı.`, 'iyi');
  } else if (camp.rank === 'mv') {
    player.fame = clamp((player.fame ?? 0) + 12, 0, 100);
    if (player.membership) player.membership.trust = clamp(player.membership.trust + 10, 0, 100);
    log(t, day, `🏛️ Milletvekili seçildin! Meclise giriyorsun.`, 'iyi');
    addNews(c, day, `${name} milletvekili seçildi.`, 'iyi');
  }
}

// ---------------------------------------------------------------- olaylar

interface Ctx {
  world: World;
  player: Player;
  t: Town;
  c: CountryState;
  rng: Rng;
  day: number;
}

interface EventDef {
  id: string;
  icon: string;
  title: string;
  text: (x: Ctx) => string;
  when?: (x: Ctx) => boolean;
  options: { label: string; desc: string; apply: (x: Ctx) => string }[];
  /** Karar verilmezse uygulanan seçenek */
  fallback: number;
}

const fame = (x: Ctx, v: number) => (x.player.fame = clamp((x.player.fame ?? 0) + v, 0, 100));
const mood = (x: Ctx, v: number) => (x.t.happiness = clamp(x.t.happiness + v, 0, 100));
const trust = (x: Ctx, v: number) => x.player.membership && (x.player.membership.trust = clamp(x.player.membership.trust + v, 0, 100));
const net = (x: Ctx, g: NetworkId, v: number) => gainNetwork(x.t, g, v, x.day, x.rng, x.c.names);

const EVENTS: EventDef[] = [
  {
    id: 'rusvet',
    icon: '💼',
    title: 'Müteahhidin teklifi',
    text: () => 'Tanınmış bir müteahhit, yeni konut ihalesini kendisine verirsen belediyeye 900 bin ₺ "bağış" yapacağını söylüyor.',
    options: [
      {
        label: 'Kabul et',
        desc: 'Kasa +900 bin ₺, iş dünyası seni sever. Ama ortaya çıkma ihtimali yüksek.',
        apply: (x) => {
          x.t.money += 900;
          net(x, 'isDunyasi', 6);
          if (x.rng() < 0.5) x.t.later.push({ day: x.day + 60 + Math.floor(x.rng() * 120), id: 'skandal' });
          return 'Para kasaya girdi. Umarım kimse duymaz.';
        },
      },
      {
        label: 'Reddet',
        desc: 'Temiz kalırsın; tanınırlık biraz artar.',
        apply: (x) => {
          fame(x, 2);
          return 'Teklifi geri çevirdin.';
        },
      },
      {
        label: 'Savcılığa bildir',
        desc: 'Medya ve bürokrasi takdir eder, iş dünyası sana soğur.',
        apply: (x) => {
          net(x, 'medya', 4);
          net(x, 'burokrasi', 3);
          x.t.network.isDunyasi = Math.max(0, x.t.network.isDunyasi - 6);
          fame(x, 4);
          return 'Basın, rüşvet teklifini ifşa eden başkanı konuşuyor.';
        },
      },
    ],
    fallback: 1,
  },
  {
    id: 'sel',
    icon: '🌧️',
    title: 'Sel baskını',
    text: (x) => `Şiddetli yağmur ${x.t.name}'de alt geçitleri ve bodrum katları su altında bıraktı.`,
    options: [
      {
        label: 'Bütün ekipleri sahaya sür',
        desc: '300 bin ₺ harcanır, halk minnettar kalır.',
        apply: (x) => {
          x.t.money -= 300;
          mood(x, 6);
          net(x, 'sendika', 3);
          return 'Ekipler gece boyunca çalıştı; halk memnun.';
        },
      },
      {
        label: 'Valilikten yardım iste',
        desc: '15 nüfuz harcanır; bürokraside tanıdığın varsa daha etkili.',
        apply: (x) => {
          x.t.influence = Math.max(0, x.t.influence - 15);
          const b = contactsIn(x.t, 'burokrasi');
          mood(x, b ? 5 : 1);
          return b ? 'Valilik ekipleri hızla geldi.' : 'Valilik geç kaldı; halk biraz söylendi.';
        },
      },
      {
        label: 'Kendi hâline bırak',
        desc: 'Para harcamazsın ama memnuniyet düşer.',
        apply: (x) => {
          mood(x, -9);
          return 'Halk belediyenin ortada olmamasına kızgın.';
        },
      },
    ],
    fallback: 2,
  },
  {
    id: 'yatirimci',
    icon: '🏭',
    title: 'Fabrika kurmak isteyen yatırımcı',
    text: () => 'Bir yatırımcı şehre fabrika kurmak istiyor. 1.500 kişiye iş, ama dere kenarında ve çevreciler tedirgin.',
    when: (x) => levelOf(x.t, 'sanayi') >= 1,
    options: [
      {
        label: 'İzin ver',
        desc: 'Sanayi sitesi bir seviye büyür, iş dünyası memnun; memnuniyet −3.',
        apply: (x) => {
          const s = x.t.slots.find((y) => y.building === 'sanayi');
          if (s && s.level < BUILDINGS.sanayi.max) s.level += 1;
          net(x, 'isDunyasi', 6);
          mood(x, -3);
          return 'Fabrikanın temeli atıldı.';
        },
      },
      {
        label: 'Arıtma şartı koş',
        desc: 'Yarı yarıya ihtimalle yatırımcı kabul eder; ederse herkes kazanır.',
        apply: (x) => {
          if (x.rng() < 0.5) {
            const s = x.t.slots.find((y) => y.building === 'sanayi');
            if (s && s.level < BUILDINGS.sanayi.max) s.level += 1;
            net(x, 'isDunyasi', 3);
            net(x, 'akademi', 3);
            return 'Yatırımcı arıtma şartını kabul etti.';
          }
          return 'Yatırımcı başka şehre gitti.';
        },
      },
      {
        label: 'Reddet',
        desc: 'Çevreciler ve akademisyenler takdir eder.',
        apply: (x) => {
          net(x, 'akademi', 3);
          mood(x, 1);
          return 'Yatırımı geri çevirdin.';
        },
      },
    ],
    fallback: 2,
  },
  {
    id: 'grev',
    icon: '✊',
    title: 'Sanayide grev',
    text: () => 'Sanayi sitesindeki işçiler ücret zammı için greve çıktı. İki taraf da belediyenin tavrını bekliyor.',
    when: (x) => levelOf(x.t, 'sanayi') >= 2,
    options: [
      {
        label: 'İşçilerin yanında dur',
        desc: 'Sendika seni sever, iş dünyası kırılır.',
        apply: (x) => {
          net(x, 'sendika', 6);
          x.t.network.isDunyasi = Math.max(0, x.t.network.isDunyasi - 4);
          mood(x, 2);
          return 'İşçiler seni omuzlarında taşıdı.';
        },
      },
      {
        label: 'İşverenle uzlaş',
        desc: 'Üretim sürer; iş dünyası memnun, memnuniyet −3.',
        apply: (x) => {
          net(x, 'isDunyasi', 5);
          mood(x, -3);
          return 'Grev kırıldı, işçiler küskün.';
        },
      },
      {
        label: 'Arabulucu ol',
        desc: 'Karizman yeterse iki taraf da kazanır; olmazsa tanınırlık düşer.',
        apply: (x) => {
          const ch = x.player.character?.charisma ?? 0.5;
          const bonus = x.player.character?.background === 'sendikaci' || x.player.character?.background === 'hukukcu' ? 0.15 : 0;
          if (x.rng() < 0.3 + ch * 0.45 + bonus) {
            net(x, 'sendika', 4);
            net(x, 'isDunyasi', 4);
            fame(x, 4);
            return 'Masayı kurdun ve anlaşma çıktı. Herkes seni konuşuyor.';
          }
          fame(x, -2);
          mood(x, -2);
          return 'Arabuluculuk tutmadı; grev uzadı.';
        },
      },
    ],
    fallback: 1,
  },
  {
    id: 'mitingDaveti',
    icon: '🚩',
    title: 'Genel merkezin mitingi',
    text: () => 'Partinin genel merkezi, bölge mitingini senin şehrinde yapmak istiyor. Masraf belediyeye.',
    when: (x) => !!x.player.membership,
    options: [
      {
        label: 'Ev sahipliği yap',
        desc: '250 bin ₺; partinin güveni +6, tanınırlık +3.',
        apply: (x) => {
          x.t.money -= 250;
          trust(x, 6);
          fame(x, 3);
          net(x, 'parti', 4);
          return 'Meydan doldu taştı; genel merkez memnun.';
        },
      },
      {
        label: 'Bütçe yok de',
        desc: 'Para harcamazsın; partinin güveni −4.',
        apply: (x) => {
          trust(x, -4);
          return 'Genel merkez bozuldu.';
        },
      },
    ],
    fallback: 1,
  },
  {
    id: 'gazete',
    icon: '📰',
    title: 'Yerel gazetede sert eleştiri',
    text: () => 'Yerel gazete, belediyenin hizmetlerini yerden yere vuran bir manşet attı.',
    options: [
      {
        label: 'Sert cevap ver',
        desc: 'Taraftarların coşar; yarı yarıya ihtimalle ters teper.',
        apply: (x) => {
          if (x.rng() < 0.5) {
            fame(x, 4);
            return 'Cevabın sosyal medyada çok paylaşıldı.';
          }
          fame(x, -2);
          mood(x, -3);
          return 'Cevabın "basına baskı" diye yorumlandı.';
        },
      },
      {
        label: 'Gazeteciyi belediyeye davet et',
        desc: '5 nüfuz; medyada bir dost kazanabilirsin.',
        apply: (x) => {
          x.t.influence = Math.max(0, x.t.influence - 5);
          net(x, 'medya', 5);
          return 'Uzun bir sohbet oldu; ertesi gün daha dengeli bir yazı çıktı.';
        },
      },
      {
        label: 'Görmezden gel',
        desc: 'Memnuniyet biraz düşer.',
        apply: (x) => {
          mood(x, -2);
          return 'Haber birkaç gün konuşuldu.';
        },
      },
    ],
    fallback: 2,
  },
  {
    id: 'gocDalgasi',
    icon: '🧳',
    title: 'Göç dalgası',
    text: () => 'Komşu ilçelerden iş arayan aileler şehrine akın ediyor.',
    when: (x) => x.t.pop < capacity(x.t) * 0.9,
    options: [
      {
        label: 'Kapıları aç',
        desc: 'Nüfus +%8; işsizlik artabilir.',
        apply: (x) => {
          x.t.pop = Math.min(capacity(x.t), x.t.pop * 1.08);
          net(x, 'sendika', 2);
          return 'Şehir hızla büyüyor.';
        },
      },
      {
        label: 'Sadece konut varsa al',
        desc: 'Nüfus +%3, sorun çıkmaz.',
        apply: (x) => {
          x.t.pop = Math.min(capacity(x.t), x.t.pop * 1.03);
          return 'Kontrollü bir büyüme oldu.';
        },
      },
    ],
    fallback: 1,
  },
];

const EVENT_BY_ID = new Map(EVENTS.map((e) => [e.id, e]));

/** Gecikmeli sonuçlar */
function runLater(x: Ctx, id: string) {
  if (id === 'skandal') {
    fame(x, -8);
    mood(x, -12);
    trust(x, -10);
    x.t.network.isDunyasi = Math.max(0, x.t.network.isDunyasi - 5);
    log(x.t, x.day, '🔥 Rüşvet skandalı patladı! Müteahhitten alınan "bağış" manşetlerde.', 'kotu');
    addNews(x.c, x.day, `${x.player.character?.name ?? 'Belediye başkanı'} hakkında rüşvet iddiası.`, 'kotu');
  }
}

function rollEvent(x: Ctx): TownEvent | null {
  const pool = EVENTS.filter((e) => !e.when || e.when(x));
  if (!pool.length) return null;
  const e = pool[Math.floor(x.rng() * pool.length)];
  return {
    id: `t${x.day}-${e.id}`,
    defId: e.id,
    title: e.title,
    text: e.text(x),
    icon: e.icon,
    options: e.options.map((o) => ({ label: o.label, desc: o.desc })),
    day: x.day,
    deadline: x.day + 20,
  };
}

export function resolveTownEvent(world: World, player: Player, option: number, rng: Rng): string {
  const t = requireTown(player);
  const ev = t.event;
  if (!ev) throw new ActionError('Bekleyen bir karar yok.');
  const def = EVENT_BY_ID.get(ev.defId);
  t.event = null;
  if (!def) return '';
  const opt = def.options[option] ?? def.options[def.fallback];
  const x: Ctx = { world, player, t, c: world.countries[t.countryId], rng, day: world.day };
  const msg = opt.apply(x);
  log(t, world.day, `${ev.icon} ${ev.title}: ${opt.label}. ${msg}`, 'notr');
  return msg;
}

// ---------------------------------------------------------------- bina eylemleri

export interface TownActionSpec {
  id: string;
  label: string;
  desc: string;
  money?: number;
  influence?: number;
  cooldown: number;
  minLevel?: number;
  apply: (x: Ctx, level: number) => string;
}

export const TOWN_ACTIONS: Partial<Record<BuildingId, TownActionSpec[]>> = {
  belediye: [
    {
      id: 'halkGunu',
      label: 'Halk günü',
      desc: 'Kapını vatandaşa aç, dertlerini dinle. Memnuniyet +4.',
      influence: 8,
      cooldown: 20,
      apply: (x) => {
        mood(x, 4);
        net(x, 'sendika', 2);
        return 'Yüzlerce vatandaşı dinledin.';
      },
    },
  ],
  carsi: [
    {
      id: 'esnafZiyareti',
      label: 'Esnaf ziyareti',
      desc: 'Dükkân dükkân gez, çay iç. Esnafla bağ kurarsın.',
      influence: 4,
      cooldown: 12,
      apply: (x, l) => {
        net(x, 'esnaf', 3 + l * 0.5);
        mood(x, 1);
        return 'Çarşıda sıcak karşılandın.';
      },
    },
  ],
  sanayi: [
    {
      id: 'yatirimci',
      label: 'Yatırımcı ağırla',
      desc: 'Sanayicilerle yemek: iş dünyasında tanıdık ve malzeme bağışı.',
      influence: 10,
      cooldown: 30,
      apply: (x, l) => {
        net(x, 'isDunyasi', 4 + l * 0.6);
        x.t.materials += 60 + l * 20;
        return `Sanayiciler ${60 + l * 20} ton malzeme bağışladı.`;
      },
    },
  ],
  okul: [
    {
      id: 'burs',
      label: 'Burs programı',
      desc: 'Başarılı öğrencilere burs: aileler ve akademi memnun.',
      money: 250,
      cooldown: 30,
      apply: (x, l) => {
        net(x, 'akademi', 3 + l * 0.5);
        mood(x, 2);
        return 'Burslar dağıtıldı.';
      },
    },
  ],
  saglik: [
    {
      id: 'tarama',
      label: 'Ücretsiz sağlık taraması',
      desc: 'Mahallelerde sağlık çadırları. Memnuniyet +3.',
      money: 250,
      cooldown: 30,
      apply: (x) => {
        mood(x, 3);
        net(x, 'akademi', 2);
        return 'Binlerce kişi taramadan geçti.';
      },
    },
  ],
  park: [
    {
      id: 'konser',
      label: 'Parkta konser',
      desc: 'Halk konseri: memnuniyet +4, tanınırlık +1.',
      money: 180,
      cooldown: 25,
      apply: (x) => {
        mood(x, 4);
        fame(x, 1);
        return 'Park tıklım tıklım doldu.';
      },
    },
  ],
  meydan: [
    {
      id: 'miting',
      label: 'Miting',
      desc: 'Meydanda konuşma: tanınırlık, partinin güveni ve halkla bağ.',
      influence: 12,
      cooldown: 30,
      apply: (x, l) => {
        fame(x, 2 + l * 0.4);
        trust(x, 2);
        net(x, 'sendika', 3 + l * 0.4);
        if (x.t.campaign) x.t.campaign.boost += 0.04;
        return x.t.campaign ? 'Miting kampanyana güç kattı (şans +%4).' : 'Meydan alkışlarla inledi.';
      },
    },
  ],
  basin: [
    {
      id: 'basinToplantisi',
      label: 'Basın toplantısı',
      desc: 'Projelerini anlat: tanınırlık ve medya bağları.',
      influence: 6,
      cooldown: 15,
      apply: (x, l) => {
        fame(x, 1.5 + l * 0.3);
        net(x, 'medya', 3 + l * 0.4);
        if (x.t.campaign) x.t.campaign.boost += 0.02;
        return 'Akşam haberlerine çıktın.';
      },
    },
  ],
  parti: [
    {
      id: 'teskilat',
      label: 'Teşkilat toplantısı',
      desc: 'İlçe teşkilatıyla çalış: partinin güveni ve parti içi tanıdıklar.',
      influence: 8,
      cooldown: 20,
      apply: (x, l) => {
        trust(x, 3 + l * 0.3);
        net(x, 'parti', 3 + l * 0.4);
        if (x.t.campaign) x.t.campaign.boost += 0.03;
        return 'Teşkilat seninle daha sıkı çalışacak.';
      },
    },
  ],
  emniyet: [
    {
      id: 'asayis',
      label: 'Asayiş denetimi',
      desc: 'Emniyetle ortak denetim: memnuniyet ve bürokraside bağ.',
      money: 150,
      cooldown: 30,
      apply: (x, l) => {
        mood(x, 2);
        net(x, 'burokrasi', 3 + l * 0.4);
        return 'Sokaklar daha güvenli.';
      },
    },
  ],
};

export function townAction(world: World, player: Player, b: BuildingId, actionId: string, rng: Rng): string {
  const t = requireTown(player);
  const spec = TOWN_ACTIONS[b]?.find((a) => a.id === actionId);
  if (!spec) throw new ActionError('Bilinmeyen eylem.');
  const level = levelOf(t, b);
  if (level < 1) throw new ActionError(`Önce ${BUILDINGS[b].label.toLocaleLowerCase('tr')} kurmalısın.`);
  const key = `${b}:${actionId}`;
  const day = world.day;
  if ((t.cooldowns[key] ?? 0) > day) throw new ActionError(`${spec.label} için ${formatGameDate(t.cooldowns[key])} tarihini bekle.`);
  if (spec.money && t.money < spec.money) throw new ActionError(`Kasada ${spec.money} bin ₺ yok.`);
  if (spec.influence && t.influence < spec.influence) throw new ActionError(`${spec.influence} nüfuz gerekiyor.`);
  t.money -= spec.money ?? 0;
  t.influence -= spec.influence ?? 0;
  t.cooldowns[key] = day + spec.cooldown;
  const msg = spec.apply({ world, player, t, c: world.countries[t.countryId], rng, day }, level);
  log(t, day, `${BUILDINGS[b].icon} ${spec.label}: ${msg}`, 'notr');
  return msg;
}

// ---------------------------------------------------------------- iyilikler

export function favorEffect(g: NetworkId, t: Town) {
  const r = RANK_ORDER.indexOf(t.rank) + 1;
  switch (g) {
    case 'isDunyasi':
      return { text: `kasaya +${300 * r} bin ₺`, apply: (x: Ctx) => void (x.t.money += 300 * r) };
    case 'esnaf':
      return { text: 'memnuniyet +5', apply: (x: Ctx) => void mood(x, 5) };
    case 'sendika':
      return {
        text: t.campaign ? 'memnuniyet +3, kampanya şansı +%5' : 'memnuniyet +3',
        apply: (x: Ctx) => {
          mood(x, 3);
          if (x.t.campaign) x.t.campaign.boost += 0.05;
        },
      };
    case 'akademi':
      return { text: 'nüfuz +12', apply: (x: Ctx) => void (x.t.influence += 12) };
    case 'medya':
      return {
        text: t.campaign ? 'tanınırlık +4, kampanya şansı +%3' : 'tanınırlık +4',
        apply: (x: Ctx) => {
          fame(x, 4);
          if (x.t.campaign) x.t.campaign.boost += 0.03;
        },
      };
    case 'burokrasi':
      return {
        text: t.construction ? 'süren inşaatın kalan süresi yarıya iner' : 'nüfuz +6 (inşaat yokken)',
        apply: (x: Ctx) => {
          const k = x.t.construction;
          if (k) k.endDay = x.day + Math.ceil((k.endDay - x.day) / 2);
          else x.t.influence += 6;
        },
      };
    case 'parti':
      return { text: 'partinin güveni +5, nüfuz +5', apply: (x: Ctx) => void (trust(x, 5), (x.t.influence += 5)) };
  }
}

export const FAVOR_COOLDOWN = 60;

export function askFavor(world: World, player: Player, contactId: string, rng: Rng): string {
  const t = requireTown(player);
  const k = t.contacts.find((x) => x.id === contactId);
  if (!k) throw new ActionError('Tanıdık bulunamadı.');
  const day = world.day;
  if (k.readyDay > day) throw new ActionError(`${k.name}'den yeni bir iyilik için ${formatGameDate(k.readyDay)} tarihini bekle.`);
  k.readyDay = day + FAVOR_COOLDOWN;
  // Sadakat düşükse geri çevirebilir.
  if (rng() > 0.35 + k.loyalty / 100) {
    k.loyalty = clamp(k.loyalty - 5, 0, 100);
    return `${k.name} bu sefer yardım edemeyeceğini söyledi. İlişkini güçlendirmelisin.`;
  }
  const fx = favorEffect(k.group, t);
  fx.apply({ world, player, t, c: world.countries[t.countryId], rng, day });
  k.loyalty = clamp(k.loyalty - 12, 0, 100);
  log(t, day, `${NETWORK[k.group].icon} ${k.title} ${k.name} yardım etti: ${fx.text}.`, 'iyi');
  return `${k.name} yardım etti: ${fx.text}.`;
}

// ---------------------------------------------------------------- kurma ve geliştirme

function requireTown(player: Player): Town {
  if (!player.town) throw new ActionError('Önce bir belediye kur.');
  return player.town;
}

function log(t: Town, day: number, text: string, kind: 'iyi' | 'kotu' | 'notr') {
  t.log.unshift({ day, text, kind });
  if (t.log.length > 40) t.log.length = 40;
}

export function createTown(c: CountryState, provinceId: string, name: string, day: number): Town {
  const slots = Array.from({ length: MAX_SLOTS }, () => ({ building: null, level: 0 })) as Town['slots'];
  slots[0] = { building: 'belediye', level: 1 };
  slots[1] = { building: 'konut', level: 1 };
  slots[2] = { building: 'carsi', level: 1 };
  return {
    id: `town-${provinceId}-${day}`,
    name,
    countryId: c.id,
    provinceId,
    foundedDay: day,
    slots,
    construction: null,
    money: 600,
    materials: 300,
    pop: 5000,
    happiness: 62,
    influence: 10,
    tax: 'orta',
    network: { isDunyasi: 0, esnaf: 0, sendika: 0, akademi: 0, medya: 0, burokrasi: 0, parti: 0 },
    contacts: [],
    rank: 'ilce',
    campaign: null,
    cooldowns: {},
    event: null,
    nextEventDay: day + 25,
    later: [],
    log: [{ day, text: `🏡 ${name} belediye başkanı olarak göreve başladın.`, kind: 'iyi' }],
    popHistory: [5000],
  };
}

export function foundTown(world: World, player: Player, provinceId: string, name: string): string {
  if (!player.character) throw new ActionError('Önce karakterini oluştur.');
  if (!player.countryId || !player.membership) throw new ActionError('Önce bir partiye katıl.');
  if (player.town) throw new ActionError('Zaten bir belediyen var.');
  const c = world.countries[player.countryId];
  const pv = c.provinces.find((x) => x.id === provinceId);
  if (!pv) throw new ActionError('İl bulunamadı.');
  const clean = String(name ?? '').trim().slice(0, 24) || `${pv.name} Merkez`;
  player.town = createTown(c, pv.id, clean, world.day);
  // Belediye ile parti görevleri birbirine karışmasın.
  player.offers = [];
  addNews(c, world.day, `${player.character.name}, ${clean} belediye başkanı oldu.`, 'notr');
  return `${clean} senin. İlk iş: boş arsalara bina kur, belediye binanı büyüt.`;
}

export function canBuild(t: Town, slot: number, b: BuildingId): string | null {
  const bel = levelOf(t, 'belediye');
  if (slot < 0 || slot >= slotCount(bel)) return 'Bu arsa henüz açılmadı. Belediye binasını büyüt.';
  if (t.slots[slot].building) return 'Arsa dolu.';
  const count = t.slots.filter((x) => x.building === b).length;
  if (count >= BUILDINGS[b].limit) return `En fazla ${BUILDINGS[b].limit} ${BUILDINGS[b].label.toLocaleLowerCase('tr')} olabilir.`;
  if (b === 'parti' && !t.contacts.length && bel < 2) return 'Parti binası için belediye binası 2. seviye olmalı.';
  return null;
}

export function build(world: World, player: Player, slot: number, b: BuildingId): string {
  const t = requireTown(player);
  if (!BUILDINGS[b]) throw new ActionError('Bilinmeyen bina.');
  const err = canBuild(t, slot, b);
  if (err) throw new ActionError(err);
  return startConstruction(world, t, slot, b, 1);
}

export function upgrade(world: World, player: Player, slot: number): string {
  const t = requireTown(player);
  const s = t.slots[slot];
  if (!s?.building) throw new ActionError('Burada bina yok.');
  const spec = BUILDINGS[s.building];
  if (s.level >= spec.max) throw new ActionError('Bina en üst seviyede.');
  const bel = levelOf(t, 'belediye');
  if (s.building !== 'belediye' && s.level + 1 > bel + 1) throw new ActionError(`Önce belediye binasını ${s.level}. seviyeye çıkar.`);
  return startConstruction(world, t, slot, s.building, s.level + 1);
}

function startConstruction(world: World, t: Town, slot: number, b: BuildingId, toLevel: number): string {
  if (t.construction) throw new ActionError('Aynı anda tek inşaat yürütülebilir. Önce süren inşaatın bitmesini bekle.');
  const cost = upgradeCost(b, toLevel);
  if (t.money < cost.money) throw new ActionError(`Kasada ${cost.money} bin ₺ gerekiyor (var: ${Math.floor(t.money)}).`);
  if (t.materials < cost.materials) throw new ActionError(`${cost.materials} ton malzeme gerekiyor (var: ${Math.floor(t.materials)}).`);
  t.money -= cost.money;
  t.materials -= cost.materials;
  t.construction = { slot, building: b, toLevel, startDay: world.day, endDay: world.day + cost.days };
  return `${BUILDINGS[b].label} ${toLevel === 1 ? 'inşaatı' : `${toLevel}. seviye çalışması`} başladı: ${cost.days} gün.`;
}

export function cancelConstruction(player: Player): string {
  const t = requireTown(player);
  const k = t.construction;
  if (!k) throw new ActionError('Süren inşaat yok.');
  const cost = upgradeCost(k.building, k.toLevel);
  t.money += cost.money * 0.7;
  t.materials += cost.materials * 0.7;
  t.construction = null;
  return 'İnşaat iptal edildi; maliyetin %70’i geri döndü.';
}

/** Çarşıda malzeme alıp satma (bin ₺ / ton) */
export const MATERIAL_BUY = 3;
export const MATERIAL_SELL = 1.4;

export function trade(player: Player, tons: number): string {
  const t = requireTown(player);
  if (levelOf(t, 'carsi') < 1) throw new ActionError('Malzeme ticareti için çarşı gerekir.');
  const n = Math.round(tons);
  if (!n) return '';
  if (n > 0) {
    const cost = n * MATERIAL_BUY;
    if (t.money < cost) throw new ActionError(`${n} ton için ${cost} bin ₺ gerekiyor.`);
    t.money -= cost;
    t.materials += n;
    return `${n} ton malzeme alındı (${cost} bin ₺).`;
  }
  if (t.materials < -n) throw new ActionError('Depoda o kadar malzeme yok.');
  t.materials += n;
  t.money += -n * MATERIAL_SELL;
  return `${-n} ton malzeme satıldı (+${Math.round(-n * MATERIAL_SELL)} bin ₺).`;
}

export function setTax(player: Player, tax: Town['tax']) {
  const t = requireTown(player);
  if (!(tax in TAX)) throw new ActionError('Geçersiz vergi.');
  t.tax = tax;
}

// ---------------------------------------------------------------- günlük adım

export function stepTown(world: World, player: Player, rng: Rng, isMonthStart: boolean) {
  const t = player.town;
  if (!t) return;
  const c = world.countries[t.countryId];
  if (!c) return;
  const day = world.day;
  const x: Ctx = { world, player, t, c, rng, day };
  // İnşaat
  const k = t.construction;
  if (k && day >= k.endDay) {
    const s = t.slots[k.slot];
    s.building = k.building;
    s.level = k.toLevel;
    t.construction = null;
    log(t, day, `🏗️ ${BUILDINGS[k.building].label} ${k.toLevel}. seviyeye ulaştı.`, 'iyi');
  }
  // Ekonomi
  const e = economy(t);
  t.money += e.net;
  t.materials += e.materials;
  t.influence = Math.min(250, t.influence + e.influence);
  if (t.money < 0) t.happiness = clamp(t.happiness - 0.3, 0, 100); // maaşlar gecikiyor
  // Memnuniyet ve nüfus
  const h = happinessTarget(t).value;
  t.happiness += (h - t.happiness) * 0.05;
  const cap = capacity(t);
  const L = (b: BuildingId) => levelOf(t, b);
  if (t.happiness >= 50 && t.pop < cap) {
    t.pop += t.pop * 0.0045 * ((t.happiness - 45) / 20) * (1 + L('saglik') * 0.04);
  } else if (t.happiness < 45) {
    t.pop -= t.pop * 0.003 * ((45 - t.happiness) / 15);
  }
  t.pop = Math.max(800, Math.min(t.pop, cap * 1.02));
  // Çevre: binalar kendi kesimlerinden tanıdık getirir
  for (const s of t.slots) {
    const g = s.building && BUILDINGS[s.building].network;
    if (g && s.level) gainNetwork(t, g, s.level * 0.06, day, rng, c.names);
  }
  if (L('sanayi') >= 2) gainNetwork(t, 'sendika', L('sanayi') * 0.02, day, rng, c.names);
  for (const ct of t.contacts) ct.loyalty = Math.min(100, ct.loyalty + 0.15);
  // Gecikmeli sonuçlar
  for (const l of t.later.filter((l) => l.day <= day)) runLater(x, l.id);
  t.later = t.later.filter((l) => l.day > day);
  // Olaylar
  if (t.event && day >= t.event.deadline) resolveTownEvent(world, player, EVENT_BY_ID.get(t.event.defId)?.fallback ?? 0, rng);
  if (!t.event && day >= t.nextEventDay) {
    t.event = rollEvent(x);
    t.nextEventDay = day + 30 + Math.floor(rng() * 25);
  }
  // Kampanya
  if (t.campaign && day >= t.campaign.endDay) finishCampaign(world, player, t, rng);
  // Aylık
  if (isMonthStart) {
    fame(x, L('basin') * 0.9 + (t.happiness - 55) / 40);
    if (player.membership && !player.partyId) trust(x, L('parti') * 0.6);
    t.popHistory.push(Math.round(t.pop));
    if (t.popHistory.length > 48) t.popHistory.shift();
  }
  // İl belediyesini yerel seçimde kaybeden ilçeye döner.
  if (t.rank === 'il') {
    const pv = c.provinces.find((y) => y.id === t.provinceId);
    if (pv && pv.mayor.playerId !== player.id) {
      t.rank = 'ilce';
      log(t, day, 'İl belediye başkanlığını kaybettin; ilçe belediyene döndün.', 'kotu');
    }
  }
  // Rütbeyi gerçek duruma göre güncelle.
  if (player.partyId && RANK_ORDER.indexOf(t.rank) < 3) t.rank = 'genelBaskan';
  if (c.ownerId === player.id) t.rank = 'hukumet';
  else if (t.rank === 'hukumet') t.rank = 'genelBaskan';
  if (t.rank === 'genelBaskan' && !player.partyId) t.rank = 'mv';
}

export function partyOf(c: CountryState, player: Pick<Player, 'membership'>): Party | undefined {
  return c.parties.find((p) => p.id === player.membership?.partyId);
}
