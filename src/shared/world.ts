import { aiMonthly } from './ai';
import { dayToDate } from './constants';
import { COUNTRY_SEEDS } from './countries';
import { applyEventOption, rollEvent } from './events';
import type { Rng } from './ministers';
import { foundParty, joinParty, leaveParty, resetGovCalib } from './politics';
import { ActionError, addNews, calibrate, computeThreat, createCountry, militaryPower, stepDay } from './sim';
import type { Character, CountryState, CountrySummary, ElectionResult, Ideology } from './types';

export interface Player {
  id: string;
  token: string;
  name: string;
  /** Oyuncunun siyaset yaptığı ülke (iktidarda ya da muhalefette) */
  countryId: string | null;
  partyId: string | null;
  character: Character | null;
}

export interface World {
  version: 2;
  day: number;
  countries: Record<string, CountryState>;
  players: Record<string, Player>;
}

export interface ElectionNight {
  playerIds: string[];
  countryId: string;
  countryName: string;
  result: ElectionResult;
}

export function createWorld(rng: Rng): World {
  const countries: Record<string, CountryState> = {};
  for (const seed of COUNTRY_SEEDS) countries[seed.id] = createCountry(seed, rng);
  const world: World = { version: 2, day: 0, countries, players: {} };
  const ctx = { powers: worldPowers(world) };
  for (const c of Object.values(countries)) {
    c.threat = computeThreat(c, ctx);
    calibrate(c);
    resetGovCalib(c);
  }
  return world;
}

export function worldPowers(world: World): Record<string, number> {
  return Object.fromEntries(Object.values(world.countries).map((c) => [c.id, militaryPower(c)]));
}

/** Dünyayı bir oyun günü ilerletir. */
export function tickWorld(world: World, rng: Rng): ElectionNight[] {
  world.day += 1;
  const day = world.day;
  const ctx = { powers: worldPowers(world) };
  const date = dayToDate(day);
  const isMonthStart = date.getUTCDate() === 1;
  const nights: ElectionNight[] = [];

  for (const c of Object.values(world.countries)) {
    const owned = c.ownerId !== null;
    if (!owned && isMonthStart) aiMonthly(c, day, date.getUTCMonth());

    const { election } = stepDay(c, day, ctx, rng);

    // Olaylar
    const ev = rollEvent(c, day, rng);
    if (ev) {
      if (owned && c.pendingEvents.length < 3) {
        c.pendingEvents.push(ev);
        addNews(c, day, `Yeni gelişme: ${ev.title}. Karar bekleniyor.`, 'notr');
      } else if (!owned) {
        applyEventOption(c, ev, ev.defaultOption, day, rng);
      }
    }
    // Süresi dolan kararlar otomatik pilotla çözülür.
    for (const p of c.pendingEvents.filter((p) => p.deadlineDay <= day)) {
      applyEventOption(c, p, p.defaultOption, day, rng, true);
    }
    c.pendingEvents = c.pendingEvents.filter((p) => p.deadlineDay > day);

    if (election) {
      const playerIds = Object.values(world.players)
        .filter((p) => p.countryId === c.id)
        .map((p) => p.id);
      nights.push({ playerIds, countryId: c.id, countryName: c.name, result: election.result });
    }
  }
  return nights;
}

function requireCharacter(player: Player): Character {
  if (!player.character) throw new ActionError('Önce karakterini oluştur.');
  return player.character;
}

function leaveCurrent(world: World, player: Player) {
  if (player.countryId) leaveParty(world.countries[player.countryId], player.id, world.day);
  player.countryId = null;
  player.partyId = null;
}

export function joinCountryParty(world: World, player: Player, countryId: string, partyId: string, rng: Rng) {
  const c = world.countries[countryId];
  if (!c) throw new ActionError('Ülke bulunamadı.');
  const ch = requireCharacter(player);
  if (player.partyId === partyId) return;
  leaveCurrent(world, player);
  joinParty(c, partyId, player.id, ch, world.day, rng);
  player.countryId = countryId;
  player.partyId = partyId;
}

export function foundCountryParty(
  world: World,
  player: Player,
  countryId: string,
  input: { name: string; short: string; color: string; ideology: Ideology },
  rng: Rng,
) {
  const c = world.countries[countryId];
  if (!c) throw new ActionError('Ülke bulunamadı.');
  const ch = requireCharacter(player);
  leaveCurrent(world, player);
  const p = foundParty(c, input, player.id, ch, world.day, rng);
  player.countryId = countryId;
  player.partyId = p.id;
}

export function leaveCountry(world: World, player: Player) {
  leaveCurrent(world, player);
}

export function summarize(world: World): CountrySummary[] {
  return Object.values(world.countries).map((c) => {
    const rp = c.parties.find((p) => p.id === c.rulingPartyId);
    return {
      id: c.id,
      name: c.name,
      flag: c.flag,
      regime: c.regime,
      ownerName: c.ownerName,
      playable: c.playable,
      gdp: c.gdp,
      growth: c.growth,
      inflation: c.inflation,
      unemployment: c.unemployment,
      approval: c.approval,
      military: c.military,
      rulingParty: rp ? { name: rp.name, short: rp.short, color: rp.color } : null,
      leaderName: c.leaderName,
      nextElectionDay: c.nextElectionDay,
    };
  });
}
