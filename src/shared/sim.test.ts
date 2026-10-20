import assert from 'node:assert/strict';
import { test } from 'node:test';
import { handleAction } from './actions';
import { dispatch } from './dispatch';
import { createRng } from './ministers';
import {
  inflationTarget,
  raiseMinWage,
  setPolicyRate,
  startProject,
  stepDay,
  unemploymentTarget,
  growthTarget,
} from './sim';
import type { CountryState } from './types';
import { createWorld, tickWorld, worldPowers, type Player, type World } from './world';

const total = (xs: { value: number }[]) => xs.reduce((s, x) => s + x.value, 0);

function freshTurkey() {
  const world = createWorld(createRng(1));
  return { world, c: world.countries.tr };
}

/** Olaylar olmadan sadece bir ülkeyi N gün ilerletir. */
function run(c: CountryState, ctx: { powers: Record<string, number> }, days: number, startDay = 1) {
  const rng = createRng(7);
  for (let d = startDay; d < startDay + days; d++) stepDay(c, d, ctx, rng);
}

test('başlangıçta model gerçek verilere oturur', () => {
  const { c } = freshTurkey();
  assert.ok(Math.abs(total(inflationTarget(c)) - 33) < 1e-6);
  assert.ok(Math.abs(total(unemploymentTarget(c)) - 8.5) < 1e-6);
  assert.ok(Math.abs(total(growthTarget(c)) - 3.3) < 1e-6);
  assert.ok(Math.abs(c.approval - 42) < 1e-6);
});

test('büyük asgari ücret zammı işsizliği ve enflasyonu artırır, işçileri memnun eder', () => {
  const a = freshTurkey();
  const b = freshTurkey();
  const ctx = { powers: worldPowers(a.world) };
  raiseMinWage(b.c, 1, 40);
  run(a.c, ctx, 365);
  run(b.c, ctx, 365);
  assert.ok(b.c.unemployment > a.c.unemployment + 0.5, `işsizlik ${b.c.unemployment} > ${a.c.unemployment}`);
  assert.ok(b.c.inflation > a.c.inflation + 1, `enflasyon ${b.c.inflation} > ${a.c.inflation}`);
  assert.ok(b.c.groups.isciler > a.c.groups.isciler, 'işçiler daha memnun olmalı');
});

test('faiz artışı enflasyonu düşürür ama büyümeyi yavaşlatır', () => {
  const a = freshTurkey();
  const b = freshTurkey();
  const ctx = { powers: worldPowers(a.world) };
  setPolicyRate(b.c, 50);
  run(a.c, ctx, 365);
  run(b.c, ctx, 365);
  assert.ok(b.c.inflation < a.c.inflation - 1, `enflasyon ${b.c.inflation} < ${a.c.inflation}`);
  assert.ok(b.c.growth < a.c.growth, `büyüme ${b.c.growth} < ${a.c.growth}`);
});

test('fabrika tamamlanınca işsizlik kalıcı olarak düşer', () => {
  const { world, c } = freshTurkey();
  const ctx = { powers: worldPowers(world) };
  startProject(c, 1, 'fabrika');
  const end = c.projects[0].endDay;
  const before = total(unemploymentTarget(c));
  run(c, ctx, end + 1);
  assert.equal(c.completed.fabrika, 1);
  assert.equal(c.projects.length, 0);
  // Aynı koşullarda hedef karşılaştırması: fabrika etkisi -0,15 puan.
  const factory = unemploymentTarget(c).find((x) => x.label === 'Fabrikalar ve sanayi');
  assert.ok(factory && factory.value < 0);
  assert.ok(Number.isFinite(before));
});

function newPlayer(world: World): Player {
  const p: Player = { id: 'p1', token: 't', name: 'Test', countryId: null, partyId: null, character: null };
  world.players.p1 = p;
  const rng = createRng(9);
  dispatch(
    world,
    p,
    {
      type: 'createCharacter',
      character: {
        name: 'Ayşe Demir',
        age: 48,
        background: 'sendikaci',
        ideology: { economic: -0.4, social: -0.2 },
        avatar: { skin: 1, hair: 2, hairColor: 0, suit: 1, tie: 3 },
      },
    },
    rng,
  );
  return p;
}

test('başlangıçta anketler ve meclis toplamı %100 eder', () => {
  const { world, c } = freshTurkey();
  const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);
  assert.ok(Math.abs(sum(c.parties.map((p) => p.support)) - 100) < 1e-6);
  assert.ok(Math.abs(sum(c.parties.map((p) => p.seats)) - 100) < 1e-6);
  assert.equal(c.parties.find((p) => p.id === c.rulingPartyId)?.short, 'AK Parti');
  const rng = createRng(2);
  for (let d = 0; d < 400; d++) tickWorld(world, rng);
  assert.ok(Math.abs(sum(c.parties.map((p) => p.support)) - 100) < 1, 'anketler toplamı 100 civarı kalmalı');
});

test('oyuncu muhalefet partisine katılır ama hükümet kararları veremez', () => {
  const world = createWorld(createRng(3));
  const player = newPlayer(world);
  const c = world.countries.tr;
  const rng = createRng(4);
  assert.throws(() => dispatch(world, player, { type: 'joinParty', countryId: 'tr', partyId: c.rulingPartyId }, rng), /İktidar/);
  const chp = c.parties.find((p) => p.short === 'CHP')!;
  dispatch(world, player, { type: 'joinParty', countryId: 'tr', partyId: chp.id }, rng);
  assert.equal(chp.playerId, 'p1');
  assert.equal(player.countryId, 'tr');
  assert.throws(() => dispatch(world, player, { type: 'setBudget', budget: { saglik: 9 } }, rng), /seçim kazan/);
  const funds = chp.funds;
  const region = c.regions[0];
  dispatch(world, player, { type: 'partyAction', action: 'miting', regionId: region.id }, rng);
  assert.ok(chp.funds < funds && chp.momentum > 0);
  assert.throws(() => dispatch(world, player, { type: 'partyAction', action: 'miting', regionId: region.id }, rng), /beklemelisin/);
});

test('seçimi kazanan oyuncu gölge kabinesi ve vaatleriyle iktidara gelir, kaybedince muhalefete döner', () => {
  const world = createWorld(createRng(3));
  const player = newPlayer(world);
  const c = world.countries.tr;
  const rng = createRng(4);
  dispatch(world, player, { type: 'foundParty', countryId: 'tr', name: 'Yeni Yol Partisi', short: 'YYP', color: '#2a9d8f', ideology: { economic: 0, social: 0 } }, rng);
  const party = c.parties.find((p) => p.playerId === 'p1')!;
  dispatch(world, player, { type: 'setPromises', promises: ['saglik', 'egitim'] }, rng);
  const cand = c.candidates.ekonomi[0];
  dispatch(world, player, { type: 'setShadow', ministry: 'ekonomi', candidateId: cand.id }, rng);
  // Partiyi zirveye taşı ve seçimi yarına al.
  party.appeal = 400;
  party.support = 70;
  for (const p of c.parties) if (p !== party) p.support = 30 / (c.parties.length - 1);
  c.nextElectionDay = world.day + 1;
  const nights = tickWorld(world, createRng(5));
  assert.equal(nights.length >= 1, true);
  assert.equal(c.rulingPartyId, party.id);
  assert.equal(c.ownerId, 'p1');
  assert.equal(c.ministers.ekonomi?.id, cand.id);
  assert.equal(c.activePromises.length, 2);
  assert.equal(c.leader?.name, 'Ayşe Demir');
  // Artık hükümet kararı verebilir.
  dispatch(world, player, { type: 'setBudget', budget: { saglik: c.budget.saglik + 1 } }, rng);

  // Sonraki seçimde çöküş
  party.appeal = 0.1;
  party.support = 2;
  for (const p of c.parties) if (p !== party) p.support = 98 / (c.parties.length - 1);
  c.govCalib = -80;
  c.nextElectionDay = world.day + 1;
  tickWorld(world, createRng(6));
  assert.notEqual(c.rulingPartyId, party.id);
  assert.equal(c.ownerId, null);
  assert.equal(player.countryId, 'tr', 'oyuncu muhalefette kalır');
  assert.equal(c.lastElection?.won, false);
});

test('bağımsız merkez bankasında oyuncu faizi değiştiremez', () => {
  const world = createWorld(createRng(5));
  const us = world.countries.us;
  assert.throws(() => handleAction(us, 1, { type: 'setEconomy', policyRate: 10 }, createRng(1)), /bağımsız/);
});

test('geçersiz istekler reddedilir', () => {
  const { c } = freshTurkey();
  // @ts-expect-error bilinmeyen bakanlık
  assert.throws(() => handleAction(c, 1, { type: 'dismissMinister', ministry: 'yok' }, createRng(1)));
  // @ts-expect-error bilinmeyen proje
  assert.throws(() => handleAction(c, 1, { type: 'startProject', projectType: 'uzay' }, createRng(1)));
});

test('dünya 20 yıl boyunca sayısal olarak kararlı kalır', () => {
  const world = createWorld(createRng(11));
  const rng = createRng(12);
  for (let d = 0; d < 365 * 20; d++) tickWorld(world, rng);
  for (const c of Object.values(world.countries)) {
    for (const v of [c.growth, c.inflation, c.unemployment, c.approval, c.debtPct, c.gdp]) {
      assert.ok(Number.isFinite(v), `${c.name} sayısal değil`);
    }
    assert.ok(c.inflation < 100, `${c.name} enflasyon ${c.inflation}`);
    assert.ok(c.approval >= 0 && c.approval <= 100);
  }
});
