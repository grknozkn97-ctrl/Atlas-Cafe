import { aiMonthly } from './ai';
import { dayToDate } from './constants';
import { COUNTRY_SEEDS } from './countries';
import { applyEventOption, rollEvent } from './events';
import type { Rng } from './ministers';
import { quitParty } from './career';
import { refreshOffers, stepOffice } from './offices';
import { resetGovCalib } from './politics';
import { addNews, calibrate, computeThreat, createCountry, militaryPower, stepDay } from './sim';
import type { Character, CountryState, CountrySummary, ElectionResult, LocalElectionResult, Membership, Office, OfficeOffer } from './types';

export interface Player {
  id: string;
  token: string;
  name: string;
  /** Oyuncunun siyaset yaptığı ülke (iktidarda ya da muhalefette) */
  countryId: string | null;
  /** Genel başkanı olduğu parti */
  partyId: string | null;
  character: Character | null;
  membership?: Membership | null;
  fame?: number;
  cooldowns?: Record<string, number>;
  /** Bu ülkede kaç kez parti değiştirdi */
  hops?: number;
  office?: Office | null;
  offers?: OfficeOffer[];
  stats?: { media: number };
}

export interface World {
  version: 3;
  day: number;
  countries: Record<string, CountryState>;
  players: Record<string, Player>;
}

export interface ElectionNight {
  playerIds: string[];
  countryId: string;
  countryName: string;
  result?: ElectionResult;
  local?: LocalElectionResult;
}

export function createWorld(rng: Rng): World {
  const countries: Record<string, CountryState> = {};
  for (const seed of COUNTRY_SEEDS) countries[seed.id] = createCountry(seed, rng);
  const world: World = { version: 3, day: 0, countries, players: {} };
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

    const { election, local } = stepDay(c, day, ctx, rng);

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

    if (isMonthStart) {
      for (const pl of Object.values(world.players)) {
        if (pl.countryId !== c.id) continue;
        stepOffice(world, pl, rng);
        refreshOffers(world, pl, rng);
      }
    }
    if (local) {
      // Seçimi kaybeden oyuncu belediye başkanları görevi bırakır.
      for (const pl of Object.values(world.players)) {
        if (pl.countryId === c.id && pl.office?.id === 'belediyeBaskani') {
          const pv = c.provinces.find((x) => x.id === pl.office!.provinceId);
          if (!pv || pv.mayor.playerId !== pl.id) pl.office = null;
        }
      }
    }
    if (election || local) {
      const playerIds = Object.values(world.players)
        .filter((p) => p.countryId === c.id)
        .map((p) => p.id);
      nights.push({ playerIds, countryId: c.id, countryName: c.name, result: election?.result, local });
    }
  }
  return nights;
}

export function leaveCountry(world: World, player: Player) {
  quitParty(world, player);
  player.countryId = null;
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
      population: c.population,
      debtPct: c.debtPct,
      electionThreshold: c.electionThreshold,
      parties: c.parties.map((p) => ({
        id: p.id,
        name: p.name,
        short: p.short,
        color: p.color,
        ideology: p.ideology,
        support: p.support,
        seats: p.seats,
        inGovernment: p.inGovernment,
        leaderName: p.leaderName,
        playerId: p.playerId,
        founded: p.founded,
      })),
    };
  });
}
