import { aiMonthly } from './ai';
import { dayToDate } from './constants';
import { COUNTRY_SEEDS } from './countries';
import { applyEventOption, rollEvent } from './events';
import type { Rng } from './ministers';
import { addNews, addShock, calibrate, computeThreat, createCountry, militaryPower, stepDay } from './sim';
import type { CountryState, CountrySummary } from './types';

export interface Player {
  id: string;
  token: string;
  name: string;
  countryId: string | null;
}

export interface World {
  version: 1;
  day: number;
  countries: Record<string, CountryState>;
  players: Record<string, Player>;
}

export interface GameOver {
  playerId: string;
  countryName: string;
  reason: string;
}

export function createWorld(rng: Rng): World {
  const countries: Record<string, CountryState> = {};
  for (const seed of COUNTRY_SEEDS) countries[seed.id] = createCountry(seed, rng);
  const world: World = { version: 1, day: 0, countries, players: {} };
  const ctx = { powers: worldPowers(world) };
  for (const c of Object.values(countries)) {
    c.threat = computeThreat(c, ctx);
    calibrate(c);
  }
  return world;
}

export function worldPowers(world: World): Record<string, number> {
  return Object.fromEntries(Object.values(world.countries).map((c) => [c.id, militaryPower(c)]));
}

/** Dünyayı bir oyun günü ilerletir. */
export function tickWorld(world: World, rng: Rng): GameOver[] {
  world.day += 1;
  const day = world.day;
  const ctx = { powers: worldPowers(world) };
  const date = dayToDate(day);
  const isMonthStart = date.getUTCDate() === 1;
  const gameOvers: GameOver[] = [];

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

    if (election && !election.won) {
      if (owned) {
        const player = world.players[c.ownerId!];
        if (player) {
          player.countryId = null;
          gameOvers.push({
            playerId: player.id,
            countryName: c.name,
            reason: `Seçimi %${election.vote.toFixed(1)} oyla kaybettin.`,
          });
        }
        releaseCountry(c);
      }
      // Yeni hükümet bir süre balayı yaşar.
      addShock(c, day, 'Yeni hükümet balayı', 'approval', 8, 365);
    }
  }
  return gameOvers;
}

export function claimCountry(world: World, player: Player, countryId: string) {
  const c = world.countries[countryId];
  if (!c) throw new Error('Ülke bulunamadı.');
  if (!c.playable) throw new Error('Bu ülke şimdilik sadece yapay zekâ tarafından yönetiliyor.');
  if (c.ownerId && c.ownerId !== player.id) throw new Error('Bu ülke başka bir oyuncuya ait.');
  if (player.countryId && player.countryId !== countryId) releaseCountry(world.countries[player.countryId]);
  c.ownerId = player.id;
  c.ownerName = player.name;
  player.countryId = countryId;
  addNews(c, world.day, `${player.name} ülkenin yönetimini devraldı.`, 'notr');
}

export function releaseCountry(c: CountryState | undefined) {
  if (!c) return;
  c.ownerId = null;
  c.ownerName = null;
  c.pendingEvents = [];
}

export function summarize(world: World): CountrySummary[] {
  return Object.values(world.countries).map((c) => ({
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
  }));
}
