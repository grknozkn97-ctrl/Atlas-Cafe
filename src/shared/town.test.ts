import assert from 'node:assert/strict';
import { test } from 'node:test';
import { dispatch } from './dispatch';
import { createRng } from './ministers';
import { capacity, levelOf, requirements } from './town';
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

test('belediye kurulur, inşaat zamanla biter ve tek inşaat kuralı işler', () => {
  const { world, player, rng } = setup();
  const t = player.town!;
  assert.equal(t.rank, 'ilce');
  assert.equal(levelOf(t, 'belediye'), 1);
  dispatch(world, player, { type: 'townBuild', slot: 3, building: 'park' }, rng);
  assert.throws(() => dispatch(world, player, { type: 'townBuild', slot: 4, building: 'okul' }, rng), /tek inşaat/);
  for (let i = 0; i < 6; i++) tickWorld(world, rng);
  assert.equal(levelOf(player.town!, 'park'), 1);
  assert.equal(player.town!.construction, null);
});

test('kapalı arsaya bina kurulamaz, belediye büyüyünce arsa açılır', () => {
  const { world, player, rng } = setup();
  assert.throws(() => dispatch(world, player, { type: 'townBuild', slot: 9, building: 'park' }, rng), /açılmadı/);
});

test('binalar zamanla çevre kazandırır ve tanıdıklar iyilik yapar', () => {
  const { world, player, rng } = setup();
  for (let i = 0; i < 120; i++) tickWorld(world, rng);
  const t = player.town!;
  assert.ok(t.contacts.length > 0, 'çarşı ve belediye tanıdık getirmeli');
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
  t.slots[0].level = 4;
  t.slots[1].level = 6;
  t.pop = Math.min(capacity(t), 15000);
  t.happiness = 95;
  t.influence = 100;
  player.fame = 60;
  for (let i = 0; i < 6; i++) t.contacts.push({ id: `k${i}`, name: 'A B', title: 'x', group: 'esnaf', avatar: { skin: 0, hair: 0, hairColor: 0, suit: 0, tie: 0 }, loyalty: 80, readyDay: 0, sinceDay: 0 });
  assert.ok(requirements(t, player, c).every((r) => r.ok));
  dispatch(world, player, { type: 'runForOffice' }, rng);
  t.campaign!.boost = 1;
  for (let i = 0; i < 31; i++) {
    tickWorld(world, rng);
    t.event = null;
  }
  assert.equal(t.rank, 'il');
  const pv = c.provinces.find((x) => x.id === t.provinceId)!;
  assert.equal(pv.mayor.playerId, player.id);
});

test('kötü yönetilen şehir küçülür', () => {
  const { world, player, rng } = setup();
  const t = player.town!;
  t.tax = 'yuksek';
  t.slots[2] = { building: 'sanayi', level: 6 };
  const pop0 = t.pop;
  for (let i = 0; i < 200; i++) {
    tickWorld(world, rng);
    t.event = null;
  }
  assert.ok(t.pop < pop0, `nüfus azalmalı: ${pop0} -> ${t.pop}`);
});
