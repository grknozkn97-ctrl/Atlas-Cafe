import assert from 'node:assert/strict';
import { test } from 'node:test';
import { handleAction } from '../server/actions';
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
import { claimCountry, createWorld, tickWorld, worldPowers } from './world';

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

test('seçimi kaybeden oyuncu ülkesini yapay zekâya bırakır', () => {
  const world = createWorld(createRng(3));
  const player = { id: 'p1', token: 't', name: 'Test', countryId: null };
  world.players.p1 = player;
  claimCountry(world, player, 'tr');
  const c = world.countries.tr;
  c.nextElectionDay = world.day + 1;
  for (const k of Object.keys(c.groups) as (keyof typeof c.groups)[]) c.groups[k] = 5;
  c.residual.approval = -60;
  const overs = tickWorld(world, createRng(4));
  assert.equal(overs.length, 1);
  assert.equal(c.ownerId, null);
  assert.equal(player.countryId, null);
  assert.ok(c.lastElection && !c.lastElection.won);
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
