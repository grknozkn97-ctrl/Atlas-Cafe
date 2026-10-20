/**
 * Oyuncusuz dünyayı hızlıca N yıl ilerletip göstergeleri yazdırır.
 * Kullanım: npm run simulate -- 10
 */
import { createRng } from '../src/shared/ministers';
import { createWorld, tickWorld } from '../src/shared/world';

const years = Number(process.argv[2] ?? 10);
const rng = createRng(42);
const world = createWorld(rng);
const fmt = (x: number) => x.toFixed(1).padStart(6);

console.log('yıl   ülke                  büyüme  enfl.  işsiz  faiz   borç  açık   onay  tehdit');
for (let y = 0; y <= years; y++) {
  for (const id of ['tr', 'us', 'de', 'ar', 'gr']) {
    const c = world.countries[id];
    console.log(
      `${2026 + y}  ${c.name.slice(0, 20).padEnd(20)} ${fmt(c.growth)} ${fmt(c.inflation)} ${fmt(c.unemployment)} ${fmt(c.policyRate)} ${fmt(c.debtPct)} ${fmt(c.deficitPct)} ${fmt(c.approval)} ${fmt(c.threat)}`,
    );
  }
  if (y < years) for (let d = 0; d < 365; d++) tickWorld(world, rng);
}

const all = Object.values(world.countries);
const range = (f: (c: (typeof all)[number]) => number) => {
  const v = all.map(f);
  return `${Math.min(...v).toFixed(1)} … ${Math.max(...v).toFixed(1)}`;
};
console.log('\nTüm ülkeler aralığı:');
console.log('büyüme', range((c) => c.growth));
console.log('enflasyon', range((c) => c.inflation));
console.log('işsizlik', range((c) => c.unemployment));
console.log('borç', range((c) => c.debtPct));
console.log('onay', range((c) => c.approval));

if (process.env.EXPLAIN) {
  const c = world.countries[process.env.EXPLAIN];
  for (const k of ['inflation', 'growth', 'unemployment', 'approval'] as const) {
    console.log(`\n${c.name} ${k}:`);
    for (const x of c.explain[k]) console.log(`  ${x.label.padEnd(36)} ${x.value.toFixed(2)}`);
  }
  console.log('güven', c.confidence.toFixed(1), 'tehdit', c.threat.toFixed(1), 'asgari', c.minWageRatio.toFixed(2));
}
