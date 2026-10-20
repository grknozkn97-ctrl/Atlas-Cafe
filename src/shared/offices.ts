/**
 * Parti içi görevler: parti, üyelerine karakterlerine ve güvenlerine göre görev teklif eder.
 * Belediye başkanvekilliği, il başkanlığı, sözcülük gibi görevlerin aylık etkisi ve süreli hedefleri vardır.
 */
import { formatGameDate } from './constants';
import { localPoll } from './local';
import type { Rng } from './ministers';
import { ActionError, addNews, clamp } from './sim';
import type { BackgroundId, CountryState, GoalKind, Mayor, Office, OfficeGoal, OfficeId, OfficeOffer, Party, Province } from './types';
import type { Player, World } from './world';

export interface OfficeSpec {
  label: string;
  icon: string;
  desc: string;
  /** Bu göreve yatkın geçmişler */
  fits: BackgroundId[];
  minTrust: number;
  /** Her ay sağladığı katkının açıklaması */
  perks: string;
}

export const OFFICES: Record<OfficeId, OfficeSpec> = {
  belediyeBaskani: {
    label: 'Belediye başkanvekili',
    icon: '🏛️',
    desc: 'Partinin kazandığı bir ilin belediyesini yönetirsin: bütçe, vergi ve projeler senin elinde.',
    fits: ['isInsani', 'sendikaci', 'hukukcu'],
    minTrust: 20,
    perks: 'Şehir iyi yönetilirse tanınırlık ve güven her ay artar; kötü yönetilirse düşer.',
  },
  ilBaskani: {
    label: 'İl başkanı',
    icon: '📍',
    desc: 'Bir ilde partinin örgütünü yönetirsin; yerel seçimde oyu artırmak senin işin.',
    fits: ['sendikaci', 'asker', 'hukukcu'],
    minTrust: 10,
    perks: 'O ilde partinin oyu her ay biraz artar. Güven +1/ay.',
  },
  sozcu: {
    label: 'Parti sözcüsü',
    icon: '🎙️',
    desc: 'Partiyi televizyonlarda ve basında temsil edersin.',
    fits: ['akademisyen', 'hukukcu'],
    minTrust: 25,
    perks: 'Tanınırlık +1,2/ay, partinin ivmesi artar.',
  },
  ekonomiMasasi: {
    label: 'Ekonomi politikaları sorumlusu',
    icon: '📈',
    desc: 'Partinin ekonomi programını yazarsın.',
    fits: ['ekonomist', 'isInsani', 'akademisyen'],
    minTrust: 25,
    perks: 'Partinin kalıcı çekimi artar, tanınırlık +0,6/ay.',
  },
  teskilatBaskani: {
    label: 'Teşkilat başkanı',
    icon: '🏢',
    desc: 'Partinin il ve ilçe örgütlerinden sorumlusun.',
    fits: ['sendikaci', 'asker'],
    minTrust: 35,
    perks: 'Partinin teşkilatı +0,6/ay, güven +1/ay.',
  },
  finansSorumlusu: {
    label: 'Mali işler sorumlusu',
    icon: '💰',
    desc: 'Bağışçılarla ilişkileri ve parti kasasını yönetirsin.',
    fits: ['isInsani', 'ekonomist'],
    minTrust: 30,
    perks: 'Parti kasasına her ay bağış getirirsin.',
  },
  guvenlikMasasi: {
    label: 'Güvenlik ve dış politika sorumlusu',
    icon: '🛡️',
    desc: 'Partinin savunma ve dış politika çizgisini belirlersin.',
    fits: ['asker', 'hukukcu'],
    minTrust: 30,
    perks: 'Tanınırlık +0,8/ay; güvenlik krizlerinde parti ivme kazanır.',
  },
};

const MAYOR_PREFIX = 'oyuncu-baskan-';

function party(c: CountryState, player: Player): Party | undefined {
  return c.parties.find((p) => p.id === player.membership?.partyId);
}

export function officeTitle(o: Pick<Office, 'id' | 'provinceId'>, c: CountryState | null) {
  const pv = o.provinceId ? c?.provinces.find((x) => x.id === o.provinceId) : undefined;
  if (o.id === 'belediyeBaskani') return `${pv?.name ?? ''} Belediye Başkanvekili`;
  if (o.id === 'ilBaskani') return `${pv?.name ?? ''} İl Başkanı`;
  return OFFICES[o.id].label;
}

// ---------------------------------------------------------------- hedefler

/** Hedefin şu anki değeri. */
export function goalValue(c: CountryState, kind: GoalKind, o: Pick<Office, 'provinceId'>, partyId: string, stats: { media: number }): number {
  const p = c.parties.find((x) => x.id === partyId);
  const pv = o.provinceId ? c.provinces.find((x) => x.id === o.provinceId) : undefined;
  switch (kind) {
    case 'media':
      return stats.media;
    case 'org':
      return p?.org ?? 0;
    case 'funds':
      return p?.funds ?? 0;
    case 'support':
      return p?.support ?? 0;
    case 'approval':
      return pv?.mayor.approval ?? 0;
    case 'localVote':
      return pv ? (localPoll(c, pv).find((r) => r.partyId === partyId)?.vote ?? 0) : 0;
  }
}

function makeGoal(c: CountryState, player: Player, o: Office, day: number): OfficeGoal {
  const p = party(c, player)!;
  const stats = player.stats ?? { media: 0 };
  const v = (k: GoalKind) => goalValue(c, k, o, p.id, stats);
  const step = Math.min(3, o.done);
  switch (o.id) {
    case 'belediyeBaskani': {
      const a = v('approval');
      return { kind: 'approval', label: `Halkın belediyeden memnuniyetini %${Math.round(Math.min(90, Math.max(a + 6, 60)))}'a çıkar`, start: a, target: Math.min(90, Math.max(a + 6, 60)), deadline: day + 240, reward: 12 };
    }
    case 'ilBaskani': {
      const a = v('localVote');
      const t = Math.round(a + 3 + step);
      return { kind: 'localVote', label: `Bu ilde partinin oyunu %${t}'e çıkar`, start: a, target: t, deadline: day + 240, reward: 10 };
    }
    case 'sozcu': {
      const n = 3 + step;
      return { kind: 'media', label: `${n} medya ya da saha çalışması yap`, start: stats.media, target: stats.media + n, deadline: day + 120, reward: 8 };
    }
    case 'ekonomiMasasi': {
      const a = v('support');
      return { kind: 'support', label: `Partinin anketini %${(a + 1).toFixed(1)}'e çıkar`, start: a, target: a + 1, deadline: day + 180, reward: 10 };
    }
    case 'teskilatBaskani': {
      const a = v('org');
      const t = Math.min(100, a + 5);
      return { kind: 'org', label: `Teşkilat gücünü ${Math.round(t)}'e çıkar`, start: a, target: t, deadline: day + 180, reward: 10 };
    }
    case 'finansSorumlusu': {
      const a = v('funds');
      return { kind: 'funds', label: `Parti kasasını ${Math.round(a + 15)} milyon $'a çıkar`, start: a, target: a + 15, deadline: day + 180, reward: 9 };
    }
    case 'guvenlikMasasi': {
      const n = 2 + step;
      return { kind: 'media', label: `Güvenlik konularında ${n} kez kamuoyuna konuş`, start: stats.media, target: stats.media + n, deadline: day + 150, reward: 8 };
    }
  }
}

// ---------------------------------------------------------------- teklifler

function hash(s: string) {
  let h = 0;
  for (const ch of s) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return h;
}

/** Partinin bu oyuncuya teklif edebileceği görevler (en uygun olan önce). */
export function eligibleOffers(c: CountryState, player: Player, day: number): OfficeOffer[] {
  const p = party(c, player);
  const ch = player.character;
  if (!p || !ch || player.partyId) return [];
  const trust = player.membership!.trust;
  const fame = player.fame ?? 0;
  const out: (OfficeOffer & { score: number })[] = [];
  const held = player.office?.id;
  const already = new Set((player.offers ?? []).map((o) => `${o.office}:${o.provinceId ?? ''}`));
  const push = (office: OfficeId, why: string, score: number, provinceId?: string) => {
    if (held === office && office !== 'ilBaskani' && office !== 'belediyeBaskani') return;
    if (already.has(`${office}:${provinceId ?? ''}`)) return;
    if (player.office?.provinceId && provinceId === player.office.provinceId) return;
    out.push({ id: `${office}-${provinceId ?? 'x'}-${day}`, office, provinceId, why, expires: day + 60, score });
  };
  const fit = (o: OfficeId) => (OFFICES[o].fits.includes(ch.background) ? 1 : 0);
  // Belediye başkanvekilliği: partinin elindeki iller; güven ve tanınırlık arttıkça büyük şehirler.
  if (c.nextLocalElectionDay < Number.MAX_SAFE_INTEGER && trust >= OFFICES.belediyeBaskani.minTrust) {
    const reach = 0.15 + trust / 60 + fame / 70; // milyon kişi
    const cities = c.provinces
      .filter((pv) => pv.mayor.partyId === p.id && !pv.mayor.playerId && pv.pop <= reach)
      .sort((a, b) => b.pop - a.pop)
      .slice(0, 3);
    const pick = cities[hash(player.id + day) % Math.max(1, cities.length)];
    if (pick) {
      push(
        'belediyeBaskani',
        `${pick.name} belediye başkanı ${pick.mayor.name} görevden ayrılıyor. Belediye meclisindeki ${p.short} grubu, ${fit('belediyeBaskani') ? 'yönetim deneyimin nedeniyle ' : ''}seni başkanvekili seçmeye hazır.`,
        3 + fit('belediyeBaskani') * 2 + trust / 30,
        pick.id,
      );
    }
  }
  // İl başkanlığı: partinin zayıf ama umutlu olduğu iller
  if (c.provinces.length && trust >= OFFICES.ilBaskani.minTrust) {
    const targets = c.provinces
      .filter((pv) => pv.mayor.partyId !== p.id && !pv.mayor.appointed)
      .map((pv) => ({ pv, v: localPoll(c, pv).find((r) => r.partyId === p.id)?.vote ?? 0 }))
      .filter((x) => x.v > 8)
      .sort((a, b) => b.pv.pop * b.v - a.pv.pop * a.v)
      .slice(0, 5);
    const pick = targets[hash(player.id + 'il' + day) % Math.max(1, targets.length)];
    if (pick) push('ilBaskani', `${p.short}, ${pick.pv.name}'de %${Math.round(pick.v)} oyda. Genel merkez ili kazanılabilir görüyor ve başına sahadan gelen birini istiyor.`, 2 + fit('ilBaskani') * 2, pick.pv.id);
  }
  const plain: OfficeId[] = ['sozcu', 'ekonomiMasasi', 'teskilatBaskani', 'finansSorumlusu', 'guvenlikMasasi'];
  const reasons: Record<string, string> = {
    sozcu: 'Kameralar önünde rahatsın; parti seni ekranlarda görmek istiyor.',
    ekonomiMasasi: 'Ekonomi bilgin partinin programına güç katar.',
    teskilatBaskani: 'Sahada örgütlenmeyi bilen birine ihtiyaç var.',
    finansSorumlusu: 'İş dünyasıyla bağların partinin kasasını doldurabilir.',
    guvenlikMasasi: 'Güvenlik konularındaki tecrüben partiye inandırıcılık katar.',
  };
  for (const o of plain) {
    if (trust < OFFICES[o].minTrust) continue;
    if (!fit(o) && trust < OFFICES[o].minTrust + 20) continue;
    push(o, fit(o) ? reasons[o] : `Partide yükseldin; genel merkez seni ${OFFICES[o].label.toLocaleLowerCase('tr')} olarak düşünüyor.`, 1 + fit(o) * 3 + trust / 50);
  }
  return out.sort((a, b) => b.score - a.score).map(({ score: _s, ...o }) => o);
}

/** Yeni teklifleri gelen kutusuna ekler. */
export function refreshOffers(world: World, player: Player, rng: Rng, force = false) {
  if (!player.countryId || !player.membership || player.partyId) {
    player.offers = [];
    return;
  }
  const c = world.countries[player.countryId];
  const day = world.day;
  player.offers = (player.offers ?? []).filter((o) => o.expires > day);
  if (player.offers.length >= 2) return;
  if (!force && rng() > 0.45) return;
  const options = eligibleOffers(c, player, day);
  const take = force ? 2 : 1;
  for (const o of options.slice(0, take)) player.offers.push(o);
}

// ---------------------------------------------------------------- görev değişiklikleri

export function mayorFromPlayer(player: Player, pv: Province, partyId: string, day: number): Mayor {
  const ch = player.character!;
  return {
    id: `${MAYOR_PREFIX}${player.id}`,
    name: ch.name,
    competence: 0.55,
    loyalty: 1,
    honesty: 0.8,
    popularity: clamp(0.35 + (player.fame ?? 0) / 150 + ch.charisma * 0.2, 0, 1),
    age: ch.age,
    avatar: ch.avatar,
    profession: 'Belediye başkanvekili',
    bio: `${ch.name}, ${formatGameDate(day, false)} tarihinde belediye meclisince başkanvekili seçildi.`,
    ideology: ch.ideology,
    partyId,
    approval: pv.mayor.approval,
    sinceDay: day,
    appointed: false,
    playerId: player.id,
  };
}

/** Görevden ayrılır; belediye başkanlığı varsa partiden biri devralır. */
export function endOffice(world: World, player: Player, reason?: string) {
  const o = player.office;
  if (!o) return;
  const c = player.countryId ? world.countries[player.countryId] : null;
  if (c && o.id === 'belediyeBaskani') {
    const pv = c.provinces.find((x) => x.id === o.provinceId);
    if (pv && pv.mayor.playerId === player.id) {
      const next = pv.pool.shift();
      if (next) pv.mayor = { ...next, partyId: pv.mayor.partyId, approval: pv.mayor.approval, sinceDay: world.day, appointed: false };
      else pv.mayor = { ...pv.mayor, playerId: undefined, id: `${pv.mayor.id}-x`, name: 'Meclis başkanvekili' };
    }
  }
  if (c && reason) addNews(c, world.day, reason, 'notr');
  player.office = null;
}

export function acceptOffer(world: World, player: Player, offerId: string): string {
  const offer = (player.offers ?? []).find((o) => o.id === offerId);
  if (!offer) throw new ActionError('Bu teklif artık geçerli değil.');
  if (!player.countryId || !player.membership) throw new ActionError('Önce bir partiye katıl.');
  const c = world.countries[player.countryId];
  const p = party(c, player)!;
  const day = world.day;
  if (offer.office === 'belediyeBaskani') {
    const pv = c.provinces.find((x) => x.id === offer.provinceId);
    if (!pv || pv.mayor.partyId !== p.id) throw new ActionError('Bu belediye artık partinin elinde değil.');
  }
  endOffice(world, player);
  const office: Office = { id: offer.office, provinceId: offer.provinceId, sinceDay: day, goal: null, done: 0 };
  if (offer.office === 'belediyeBaskani') {
    const pv = c.provinces.find((x) => x.id === offer.provinceId)!;
    pv.pool.push({ ...pv.mayor, appointedDay: undefined });
    pv.mayor = mayorFromPlayer(player, pv, p.id, day);
  }
  player.office = office;
  office.goal = makeGoal(c, player, office, day);
  player.offers = (player.offers ?? []).filter((o) => o.id !== offerId);
  const title = officeTitle(office, c);
  addNews(c, day, `${player.character!.name}, ${p.short} adına ${title} oldu.`, 'iyi');
  return `Artık ${title} olarak görevdesin. İlk hedefin: ${office.goal.label} (${formatGameDate(office.goal.deadline, false)}'e kadar).`;
}

export function declineOffer(player: Player, offerId: string) {
  player.offers = (player.offers ?? []).filter((o) => o.id !== offerId);
  if (player.membership) player.membership.trust = clamp(player.membership.trust - 1, 0, 100);
}

// ---------------------------------------------------------------- aylık

/** Görevin aylık etkileri ve hedef kontrolü. */
export function stepOffice(world: World, player: Player, rng: Rng) {
  const o = player.office;
  if (!o || !player.countryId || !player.membership) return;
  const c = world.countries[player.countryId];
  const p = party(c, player);
  if (!p) return;
  const day = world.day;
  const m = player.membership;
  const fame = (x: number) => (player.fame = clamp((player.fame ?? 0) + x, 0, 100));
  const trust = (x: number) => (m.trust = clamp(m.trust + x, 0, 100));
  switch (o.id) {
    case 'belediyeBaskani': {
      const pv = c.provinces.find((x) => x.id === o.provinceId);
      if (!pv || pv.mayor.playerId !== player.id) {
        endOffice(world, player);
        return;
      }
      fame(0.4 + (pv.mayor.approval - 50) / 40 + pv.pop * 0.3);
      trust((pv.mayor.approval - 50) / 25);
      pv.mayor.popularity = clamp(pv.mayor.popularity + (pv.mayor.approval - 50) / 2000, 0, 1);
      break;
    }
    case 'ilBaskani': {
      const pv = c.provinces.find((x) => x.id === o.provinceId);
      if (pv) pv.bias = { ...(pv.bias ?? {}), [p.id]: Math.min(3, (pv.bias?.[p.id] ?? 1) * 1.012) };
      trust(1);
      fame(0.2);
      break;
    }
    case 'sozcu':
      fame(1.2);
      p.momentum += 0.15;
      break;
    case 'ekonomiMasasi':
      p.appeal *= 1.004;
      fame(0.6);
      break;
    case 'teskilatBaskani':
      p.org = Math.min(100, p.org + 0.6);
      trust(1);
      break;
    case 'finansSorumlusu':
      p.funds += 0.8 + (player.character?.background === 'isInsani' ? 0.8 : 0);
      break;
    case 'guvenlikMasasi':
      fame(0.8);
      if (c.threat > 60) p.momentum += 0.3;
      break;
  }
  // Hedef
  const g = o.goal;
  if (!g) {
    o.goal = makeGoal(c, player, o, day);
    return;
  }
  const v = goalValue(c, g.kind, o, p.id, player.stats ?? { media: 0 });
  if (v >= g.target) {
    trust(g.reward);
    fame(3);
    o.done += 1;
    addNews(c, day, `${player.character!.name} görevinde başarılı oldu: ${g.label.toLocaleLowerCase('tr')}.`, 'iyi');
    o.goal = makeGoal(c, player, o, day);
  } else if (day >= g.deadline) {
    trust(-5);
    o.goal = makeGoal(c, player, o, day);
  }
  void rng;
}

/** Hedefte ilerleme yüzdesi (0-1). */
export function goalProgress(g: OfficeGoal, value: number) {
  if (g.target === g.start) return value >= g.target ? 1 : 0;
  return clamp((value - g.start) / (g.target - g.start), 0, 1);
}
