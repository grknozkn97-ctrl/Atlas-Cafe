/**
 * Oyuncunun parti içi kariyeri: üyelik, partinin güveni, medya çalışmaları, kurultay yarışı ve parti değiştirme.
 * Genel başkanlık kendiliğinden gelmez: ya kendi partini kurarsın ya da güven kazanıp kurultayı kazanırsın.
 */
import { formatGameDate } from './constants';
import type { Rng } from './ministers';
import { foundParty, ideologyDistance, joinParty, leaveParty } from './politics';
import { ActionError, addNews, clamp } from './sim';
import type { Character, CountryState, Ideology, MediaAction, Party, PartyRole, PlayerView } from './types';
import type { Player, World } from './world';

export const BACKGROUND_FAME: Record<Character['background'], number> = {
  ekonomist: 18,
  asker: 22,
  isInsani: 25,
  sendikaci: 20,
  akademisyen: 20,
  hukukcu: 15,
};

export const ROLE_LABELS: Record<PartyRole, string> = {
  uye: 'Parti üyesi',
  ilBaskani: 'İl başkanı',
  myk: 'MYK üyesi',
  genelBaskanYardimcisi: 'Genel başkan yardımcısı',
  genelBaskan: 'Genel başkan',
};

export function roleOf(p: Pick<Player, 'membership' | 'partyId'>): PartyRole | null {
  if (!p.membership) return null;
  if (p.partyId === p.membership.partyId) return 'genelBaskan';
  const t = p.membership.trust;
  return t < 40 ? 'uye' : t < 60 ? 'ilBaskani' : t < 80 ? 'myk' : 'genelBaskanYardimcisi';
}

export const CHALLENGE_TRUST = 60;

/** Partinin seni üyeliğe kabul ederken duyacağı güven (0-100). */
export function initialTrust(p: Pick<Party, 'ideology' | 'support'>, ch: Character, fame: number, hops: number) {
  const fit = 1 - ideologyDistance(p.ideology, ch.ideology);
  return Math.round(clamp(fit * 40 + fame * 0.3 - hops * 8 - Math.max(0, p.support - 20) * 0.3, 0, 38));
}

export function canJoin(p: Pick<Party, 'ideology' | 'support'>, ch: Character, fame: number, hops: number) {
  const t = initialTrust(p, ch, fame, hops);
  const fit = 1 - ideologyDistance(p.ideology, ch.ideology);
  if (fit < 0.65) return { ok: false, trust: t, reason: 'Parti yönetimi görüşlerinin partinin çizgisine çok uzak olduğunu düşünüyor.' };
  if (t < 12) return { ok: false, trust: t, reason: 'Parti seni henüz yeterince tanımıyor ya da sık parti değiştirdiğin için güvenmiyor.' };
  return { ok: true, trust: t, reason: '' };
}

function requireCharacter(player: Player): Character {
  if (!player.character) throw new ActionError('Önce karakterini oluştur.');
  return player.character;
}

/** Partiden ayrılır; ülkede kalır, başka partiye geçebilir. */
export function quitParty(world: World, player: Player) {
  const m = player.membership;
  if (!m || !player.countryId) return;
  const c = world.countries[player.countryId];
  const p = c?.parties.find((x) => x.id === m.partyId);
  if (c && player.partyId) leaveParty(c, player.id, world.day);
  else if (c && p && player.character) addNews(c, world.day, `${player.character.name}, ${p.short} üyeliğinden istifa etti.`, 'notr');
  player.membership = null;
  player.partyId = null;
  player.hops = (player.hops ?? 0) + 1;
}

export function joinAsMember(world: World, player: Player, countryId: string, partyId: string) {
  const c = world.countries[countryId];
  if (!c) throw new ActionError('Ülke bulunamadı.');
  if (!c.playable) throw new ActionError('Bu ülkede serbest seçim yok.');
  const ch = requireCharacter(player);
  const p = c.parties.find((x) => x.id === partyId);
  if (!p) throw new ActionError('Parti bulunamadı.');
  if (player.membership?.partyId === partyId) return '';
  const fame = player.fame ?? 0;
  const hops = player.hops ?? 0;
  const check = canJoin(p, ch, fame, hops);
  if (!check.ok) throw new ActionError(check.reason);
  quitParty(world, player);
  if (player.countryId !== countryId) player.hops = 0;
  player.countryId = countryId;
  player.membership = { partyId, trust: check.trust, joinedDay: world.day };
  addNews(c, world.day, `${ch.name} ${p.short} saflarına katıldı.`, 'notr');
  return `${p.short} üyeliğin kabul edildi. Partinin sana güveni: ${check.trust}/100. Genel başkanlık için en az ${CHALLENGE_TRUST} güven gerekir.`;
}

export function foundAsLeader(
  world: World,
  player: Player,
  countryId: string,
  input: { name: string; short: string; color: string; ideology: Ideology },
  rng: Rng,
) {
  const c = world.countries[countryId];
  if (!c) throw new ActionError('Ülke bulunamadı.');
  const ch = requireCharacter(player);
  quitParty(world, player);
  if (player.countryId !== countryId) player.hops = 0;
  const p = foundParty(c, input, player.id, ch, world.day, rng);
  player.countryId = countryId;
  player.partyId = p.id;
  player.membership = { partyId: p.id, trust: 100, joinedDay: world.day };
}

// ---------------------------------------------------------------- medya ve saha

export const MEDIA: Record<MediaAction, { label: string; icon: string; cooldown: number; desc: string }> = {
  tv: { label: 'TV programı', icon: '📺', cooldown: 20, desc: 'Ana haber tartışma programına çık. En çok tanınırlık getirir.' },
  radyo: { label: 'Radyo söyleşisi', icon: '📻', cooldown: 10, desc: 'Taşrada ve yaşlı seçmende etkili, risksiz.' },
  sosyalMedya: { label: 'Sosyal medya', icon: '📱', cooldown: 7, desc: 'Gençlere ulaş. Ucuz ama gaf riski var.' },
  sahaCalismasi: { label: 'Saha çalışması', icon: '🚪', cooldown: 15, desc: 'Kapı kapı gez, teşkilatla çalış. Partinin güvenini en çok bu artırır.' },
  mitingKonusmasi: { label: 'Mitingde konuşma', icon: '🎤', cooldown: 30, desc: 'Parti mitinginde kürsüye çık: hem tanınırlık hem güven.' },
};

export interface MediaEffect {
  fame: number;
  trust: number;
  momentum: number;
  cost: number;
  risk: number;
}

/** Bir medya çalışmasının beklenen etkisi (danışman tahmini için de kullanılır). */
export function mediaEffect(action: MediaAction, charisma: number, fame: number, isLeader: boolean): MediaEffect {
  const damp = 1 - fame / 130;
  const lead = isLeader ? 2 : 1;
  const base: Record<MediaAction, MediaEffect> = {
    tv: { fame: 3 + charisma * 5, trust: 2, momentum: 0.4 + fame / 120, cost: isLeader ? 2 : 0, risk: 0.05 },
    radyo: { fame: 1.5 + charisma * 2, trust: 1, momentum: 0.2 + fame / 300, cost: 0, risk: 0 },
    sosyalMedya: { fame: 1.2 + charisma * 2, trust: 0.5, momentum: 0.15 + fame / 400, cost: 0, risk: 0.15 },
    sahaCalismasi: { fame: 0.5, trust: 4, momentum: 0.25, cost: 0, risk: 0 },
    mitingKonusmasi: { fame: 2 + charisma * 3, trust: 3, momentum: 0.5 + fame / 150, cost: isLeader ? 3 : 0, risk: 0.03 },
  };
  const e = base[action];
  return { ...e, fame: e.fame * damp, momentum: e.momentum * lead, trust: isLeader ? 0 : e.trust };
}

export function doMedia(world: World, player: Player, action: MediaAction, rng: Rng): string {
  const ch = requireCharacter(player);
  const m = player.membership;
  if (!m || !player.countryId) throw new ActionError('Önce bir partiye katıl.');
  const spec = MEDIA[action];
  if (!spec) throw new ActionError('Bilinmeyen çalışma.');
  const day = world.day;
  const until = player.cooldowns?.[action] ?? 0;
  if (day < until) throw new ActionError(`${spec.label} için ${formatGameDate(until)} tarihini beklemelisin.`);
  const c = world.countries[player.countryId];
  const p = c.parties.find((x) => x.id === m.partyId)!;
  const isLeader = player.partyId === p.id;
  const e = mediaEffect(action, ch.charisma, player.fame ?? 0, isLeader);
  if (e.cost > p.funds) throw new ActionError(`Parti kasasında ${e.cost} milyon $ yok.`);
  p.funds -= e.cost;
  player.cooldowns = { ...(player.cooldowns ?? {}), [action]: day + spec.cooldown };
  // Gaf: tanınırlık yine artar ama parti rahatsız olur.
  if (rng() < e.risk) {
    player.fame = clamp((player.fame ?? 0) + e.fame * 0.5, 0, 100);
    m.trust = clamp(m.trust - 4, 0, 100);
    p.momentum -= 0.5;
    addNews(c, day, `${ch.name}'in sözleri tepki çekti; parti açıklama yapmak zorunda kaldı.`, 'kotu');
    return `${spec.label} ters tepti: sözlerin yanlış anlaşıldı. Tanınırlık +${(e.fame * 0.5).toFixed(1)}, partinin güveni −4.`;
  }
  player.fame = clamp((player.fame ?? 0) + e.fame, 0, 100);
  m.trust = clamp(m.trust + e.trust, 0, 100);
  p.momentum += e.momentum;
  if (action === 'sahaCalismasi') p.org = Math.min(100, p.org + 0.5);
  const parts = [`tanınırlık +${e.fame.toFixed(1)}`];
  if (e.trust) parts.push(`partinin güveni +${e.trust}`);
  parts.push(`parti ivmesi +${e.momentum.toFixed(1)}`);
  return `${spec.label} iyi geçti: ${parts.join(', ')}.`;
}

/** Kurultayı kazanma olasılığı. */
export function challengeChance(c: CountryState, p: Party, player: Pick<Player, 'membership' | 'fame' | 'character'>) {
  const trust = player.membership?.trust ?? 0;
  const ch = player.character?.charisma ?? 0.5;
  const incumbentStrength = 0.25 + Math.min(0.3, p.support / 100) + (p.momentum > 2 ? 0.1 : 0);
  return clamp(0.2 + (trust - CHALLENGE_TRUST) / 60 + ch * 0.3 + (player.fame ?? 0) / 250 - incumbentStrength, 0.05, 0.9);
}

export function challengeLeader(world: World, player: Player, rng: Rng): string {
  const ch = requireCharacter(player);
  const m = player.membership;
  if (!m || !player.countryId) throw new ActionError('Önce bir partiye katıl.');
  if (player.partyId) throw new ActionError('Zaten genel başkansın.');
  const c = world.countries[player.countryId];
  const p = c.parties.find((x) => x.id === m.partyId)!;
  if (p.inGovernment) throw new ActionError('İktidardaki partide genel başkanlık yarışı seçim döneminden önce açılmaz.');
  if (p.playerId) throw new ActionError('Partinin genel başkanı başka bir oyuncu.');
  if (m.trust < CHALLENGE_TRUST) throw new ActionError(`Kurultaya gitmek için partinin güveni en az ${CHALLENGE_TRUST} olmalı (şu an ${Math.round(m.trust)}).`);
  const until = player.cooldowns?.kurultay ?? 0;
  if (world.day < until) throw new ActionError(`Yeni kurultay için ${formatGameDate(until)} tarihini beklemelisin.`);
  player.cooldowns = { ...(player.cooldowns ?? {}), kurultay: world.day + 180 };
  const chance = challengeChance(c, p, player);
  if (rng() < chance) {
    const old = p.leaderName;
    const pct = joinParty(c, p.id, player.id, ch, world.day, rng);
    player.partyId = p.id;
    m.trust = 100;
    return `Kurultayı kazandın! ${old} yerine delegelerin %${pct.toFixed(0)} oyuyla genel başkan seçildin.`;
  }
  m.trust = clamp(m.trust - 25, 0, 100);
  addNews(c, world.day, `${p.short} kurultayında ${ch.name} genel başkan ${p.leaderName}'e yenildi.`, 'notr');
  return `Kurultayı kaybettin. Kazanma şansın %${Math.round(chance * 100)} idi. Partinin güveni −25.`;
}

export function playerView(p: Player | null | undefined): PlayerView | null {
  if (!p) return null;
  return {
    id: p.id,
    name: p.name,
    character: p.character,
    countryId: p.countryId,
    partyId: p.partyId,
    membership: p.membership ?? null,
    role: roleOf(p),
    fame: p.fame ?? 0,
    cooldowns: p.cooldowns ?? {},
    hops: p.hops ?? 0,
  };
}
