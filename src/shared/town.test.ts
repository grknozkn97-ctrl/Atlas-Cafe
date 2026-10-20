import assert from 'node:assert/strict';
import { test } from 'node:test';
import { analyze, canPlace, idx } from './city';
import { dispatch } from './dispatch';
import { createRng } from './ministers';
import { requirements } from './town';
import type { City } from './types';
import { createWorld, tickWorld, type Player } from './world';

function setup() {
  const rng = createRng(11);
  const world = createWorld(rng);
  const player: Player = { id: 'p', token: 'p', name: 'X', countryId: null, partyId: null, character: null };
  world.players.p = player;
  dispatch(world, player, { type: 'createCharacter', character: { name: 'Deniz Kaya', age: 44, background: 'sendikaci', ideology: { economic: -0.2, social: -0.1 }, avatar: { skin: 0, hair: 0, hairColor: 0, suit: 0, tie: 0 } } }, rng);
  const c = world.countries.tr;
  for (const p of c.parties.filter((x) => !x.inGovernment)) {
    try {
      dispatch(world, player, { type: 'joinParty', countryId: 'tr', partyId: p.id }, rng);
      break;
    } catch {
      /* uymayan parti */
    }
  }
  const pv = c.provinces[10];
  dispatch(world, player, { type: 'foundTown', provinceId: pv.id, name: 'Deneme' }, rng);
  return { world, player, rng, c };
}

/** Otoyoldan doğuya yol, iki yanına bölgeler, santral ve pompa kurar. */
function starterCity(world: ReturnType<typeof setup>['world'], player: Player, rng: ReturnType<typeof createRng>) {
  const city = player.town!.city;
  const ry = Math.floor(city.n / 2);
  let end = 15;
  while (!city.terrain[idx(city, end + 1, ry)]) end++;
  const row: number[] = [];
  for (let x = 15; x <= end; x++) row.push(idx(city, x, ry));
  dispatch(world, player, { type: 'cityPaint', tool: 'road', cells: row }, rng);
  const zone = (z: number, dy: number[]) => {
    const cells: number[] = [];
    for (let x = 15; x < end - 4; x++) for (const d of dy) cells.push(idx(city, x, ry + d));
    dispatch(world, player, { type: 'cityPaint', tool: 'zone', zone: z, cells }, rng);
  };
  zone(1, [-1, -2, -3]);
  zone(2, [1]);
  zone(3, [2, 3]);
  const spot = [end, end - 1, end - 2].flatMap((x) => [[x, ry - 1], [x, ry + 1]]).find(([x, y]) => !canPlace(city, 'suPompasi', x, y))!;
  dispatch(world, player, { type: 'cityPlace', service: 'suPompasi', x: spot[0], y: spot[1] }, rng);
  dispatch(world, player, { type: 'cityPlace', service: 'komur', x: end - 3, y: ry + 1 }, rng);
  return city;
}

test('belediye ızgara şehirle kurulur; yol, bölge ve bina para harcar', () => {
  const { world, player, rng } = setup();
  const t = player.town!;
  assert.equal(t.rank, 'ilce');
  assert.equal(t.city.services[0].type, 'belediye');
  const m0 = t.money;
  starterCity(world, player, rng);
  assert.ok(t.money < m0 - 6000, 'santral, pompa ve yol para tutmalı');
  assert.throws(() => dispatch(world, player, { type: 'cityPlace', service: 'belediye', x: 2, y: 2 }, rng), /kurulamaz/);
});

test('yoldan uzak ya da suya değmeyen yere bina kurulamaz', () => {
  const { player } = setup();
  const city: City = player.town!.city;
  assert.ok(canPlace(city, 'hastane', 2, 2), 'yola değmeyen yer reddedilmeli');
  const ry = Math.floor(city.n / 2);
  assert.ok(canPlace(city, 'suPompasi', 5, ry - 1), 'pompa suya değmeli');
});

test('elektrik, su ve yol olan bölgelerde şehir büyür; vergiler gelir getirir', () => {
  const { world, player, rng } = setup();
  const city = starterCity(world, player, rng);
  for (let i = 0; i < 150; i++) {
    tickWorld(world, rng);
    player.town!.event = null;
  }
  const a = analyze(city);
  assert.ok(city.stats.pop > 300, `nüfus artmalı: ${city.stats.pop}`);
  assert.ok(city.stats.buildings > 20);
  assert.ok(a.power.some((x) => x));
  assert.ok(city.stats.income.find((x) => x.label === 'Konut vergisi')!.value > 0);
});

test('çok yüksek vergi ve pahalı elektrik şehri küçültür', () => {
  const { world, player, rng } = setup();
  const city = starterCity(world, player, rng);
  for (let i = 0; i < 150; i++) {
    tickWorld(world, rng);
    player.town!.event = null;
  }
  const pop0 = city.stats.pop;
  dispatch(world, player, { type: 'cityBudget', tax: [29, 29, 29, 29], power: 2, water: 2 }, rng);
  for (let i = 0; i < 250; i++) {
    tickWorld(world, rng);
    player.town!.event = null;
  }
  assert.ok(city.stats.pop < pop0, `nüfus azalmalı: ${pop0} -> ${city.stats.pop}`);
});

test('binalar zamanla çevre kazandırır ve tanıdıklar iyilik yapar', () => {
  const { world, player, rng } = setup();
  starterCity(world, player, rng);
  for (let i = 0; i < 400; i++) {
    tickWorld(world, rng);
    player.town!.event = null;
  }
  const t = player.town!;
  assert.ok(t.contacts.length > 0, 'belediye ve ticaret tanıdık getirmeli');
  const k = t.contacts[0];
  k.loyalty = 100;
  const before = JSON.stringify([t.money, t.happiness, t.influence, player.fame]);
  dispatch(world, player, { type: 'townFavor', contactId: k.id }, rng);
  assert.notEqual(JSON.stringify([t.money, t.happiness, t.influence, player.fame]), before);
  assert.throws(() => dispatch(world, player, { type: 'townFavor', contactId: k.id }, rng), /bekle/);
});

test('kariyer basamağı şartlar sağlanmadan açılmaz; sağlanınca kampanya ile kazanılır', () => {
  const { world, player, rng, c } = setup();
  assert.throws(() => dispatch(world, player, { type: 'runForOffice' }, rng), /hazır değilsin/);
  const t = player.town!;
  t.pop = 15000;
  t.happiness = 95;
  t.influence = 100;
  player.fame = 60;
  for (const type of ['saglikOcagi', 'polis', 'itfaiye', 'okul'] as const) t.city.services.push({ id: type, type, x: 0, y: 0 });
  for (let i = 0; i < 6; i++) t.contacts.push({ id: `k${i}`, name: 'A B', title: 'x', group: 'esnaf', avatar: { skin: 0, hair: 0, hairColor: 0, suit: 0, tie: 0 }, loyalty: 80, readyDay: 0, sinceDay: 0 });
  assert.ok(requirements(t, player, c).every((r) => r.ok), JSON.stringify(requirements(t, player, c)));
  dispatch(world, player, { type: 'runForOffice' }, rng);
  t.campaign!.boost = 1;
  t.city.services = t.city.services.slice(0, 1);
  for (let i = 0; i < 31; i++) {
    tickWorld(world, rng);
    t.event = null;
  }
  assert.equal(t.rank, 'il');
  const pv = c.provinces.find((x) => x.id === t.provinceId)!;
  assert.equal(pv.mayor.playerId, player.id);
});
